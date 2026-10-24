(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,lvText}=BioLab.h;
const TAU=Math.PI*2,D2R=Math.PI/180;

/* ---------- reference methods ----------
   Stature: Trotter & Gleser (1952), formulas from their U.S. White reference sample (cm; bone length in cm; ± one standard error).
   Age: Suchey–Brooks pubic symphysis phases (Brooks & Suchey 1990), 95% ranges by sex.
   Sex (skull): Walker (2008) logistic equations on 1–5 trait scores; positive = female. */
const TG={M:{femur:[2.38,61.41,3.27],tibia:[2.52,78.62,3.37],humerus:[3.08,70.45,4.05]},F:{femur:[2.47,54.10,3.72],tibia:[2.90,61.53,3.66],humerus:[3.36,57.97,4.45]}};
const SB={F:[[15,24],[19,40],[21,53],[26,70],[25,83],[42,87]],M:[[15,23],[19,34],[21,46],[23,57],[27,66],[34,86]]};
const SBMEAN={F:[19.4,25.0,30.7,38.2,48.1,60.0],M:[18.5,23.4,28.7,35.2,45.6,61.2]};
const PLATES={open:{l:'Some growth plates still open',r:[12,20]},clav:{l:'All fused except the collarbone',r:[18,30]},fused:{l:'All fused, collarbone too',r:[23,120]}};
const SUT={open:{l:'Open',r:[15,40]},partial:{l:'Partly closed',r:[25,60]},closed:{l:'Mostly closed',r:[35,120]}};
const ROMAN=['I','II','III','IV','V','VI'];
const BONE={femur:{l:'Femur (thigh)',min:38,max:54},tibia:{l:'Tibia (shin)',min:30,max:45},humerus:{l:'Humerus (upper arm)',min:26,max:38}};
const walker2=(g,m)=>-1.568*g-1.459*m+7.434;
const walker1=(g,m,e)=>-1.375*g-1.185*m-1.151*e+9.128;
const sig=x=>1/(1+Math.exp(-x));
const inch=cm=>{const t=Math.round(cm/2.54);return Math.floor(t/12)+' ft '+(t%12)+' in';};

/* fictional remains and missing-person reports */
const CASES={r1:{l:'Remains 1',v:{subpubic:96,notch:1,glabella:2,mastoid:2,mental:1,plates:'fused',symph:3,sutures:'partial',femur:45.0,tibia:36.5,humerus:31.8}},
             r2:{l:'Remains 2',v:{subpubic:62,notch:5,glabella:4,mastoid:5,mental:4,plates:'fused',symph:5,sutures:'closed',femur:49.6,tibia:40.2,humerus:34.6}}};
const REP=[{id:1,sex:'F',age:34,h:168},{id:2,sex:'M',age:41,h:178},{id:3,sex:'F',age:19,h:160},{id:4,sex:'F',age:58,h:170},{id:5,sex:'M',age:24,h:173}];
const MEAS=['subpubic','notch','glabella','mastoid','mental','plates','symph','sutures','femur','tibia','humerus'];

/* ---------- the biological profile, computed from the current observations ---------- */
function sexEst(p){const hon=atLeast('honors'),ap=atLeast('ap');
  if(!hon){const s=p.subpubic>=90?'F':p.subpubic<=70?'M':null;return {sex:s,word:s==='F'?'female':s==='M'?'male':'undetermined',src:'pelvis',pel:s,sk:null,pf:null};}
  const pi=[clamp((p.subpubic-80)/15,-1,1),(3-p.notch)/2],ps=(pi[0]+pi[1])/2,pel=ps>0.4?'F':ps<-0.4?'M':null;
  const lg=ap?walker1(p.glabella,p.mastoid,p.mental):walker2(p.glabella,p.mastoid),pf=sig(lg),sk=pf>0.75?'F':pf<0.25?'M':null;
  const sex=pel||sk,word=pel?(pel==='F'?'female':'male'):sk?(sk==='F'?'probably female':'probably male'):'undetermined';
  return {sex,word,src:pel?'pelvis':sk?'skull':'none',pel,sk,pf,lg,ps,conflict:pel&&sk&&pel!==sk};}
function ageRanges(p){const sx=sexEst(p).sex,out=[];out.push({id:'plates',l:'Growth plates',r:PLATES[p.plates].r});
  const ph=Math.round(p.symph)-1,r=sx?SB[sx][ph]:[Math.min(SB.F[ph][0],SB.M[ph][0]),Math.max(SB.F[ph][1],SB.M[ph][1])];out.push({id:'symph',l:'Pubic symphysis, phase '+ROMAN[ph],r});
  if(atLeast('honors'))out.push({id:'sutures',l:'Skull sutures',r:SUT[p.sutures].r});
  let lo=0,hi=200;out.forEach(o=>{lo=Math.max(lo,o.r[0]);hi=Math.min(hi,o.r[1]);});return {list:out,lo,hi,ok:lo<=hi};}
function statureFor(p,bone,sx){const L=p[bone];const one=s=>{const c=TG[s][bone];const v=c[0]*L+c[1];return {v,lo:v-2*c[2],hi:v+2*c[2],se:c[2],a:c[0],b:c[1]};};
  if(sx)return one(sx);const f=one('F'),m=one('M');return {v:(f.v+m.v)/2,lo:Math.min(f.lo,m.lo),hi:Math.max(f.hi,m.hi),se:null,both:[f,m]};}
function stature(p){const sx=sexEst(p).sex,bone=atLeast('honors')?p.bone:'femur';return Object.assign({bone,sx},statureFor(p,bone,sx));}
function reportCheck(p,R){const s=sexEst(p),a=ageRanges(p),st=stature(p),why=[];
  if(s.sex&&s.sex!==R.sex)why.push('sex');if(a.ok&&(R.age<a.lo||R.age>a.hi))why.push('age');if(R.h<st.lo-0.05||R.h>st.hi+0.05)why.push('stature');return why;}
const repText=R=>'MP-'+R.id+': '+(R.sex==='F'?'woman':'man')+', '+R.age+', '+R.h+' cm';

/* ---------- facial tissue depths (mm), rounded adult averages after Rhine & Moore (1984) and Stephan’s T-tables ----------
   b: bone point (mm, lateral skull frame: porion at 0,0, face toward +x, y down). w: how much body build changes the depth. */
const FACE=[
  {n:'Supraglabella',b:[93,-55],d:4.5,w:0.4},{n:'Glabella',b:'G',d:5.5,w:0.4},{n:'Nasion',b:[92,-28],d:6.5,w:0.4},{n:'End of nasal bones',b:[102,-5],d:3.0,w:0.3},
  {n:'Mid-philtrum',b:[103,29],d:11.0,w:0.7},{n:'Upper lip',b:[105,40],d:10.5,w:0.8},{n:'Lower lip',b:[104,53],d:11.5,w:0.8},{n:'Chin-lip fold',b:[101,66],d:10.5,w:0.9},
  {n:'Chin (mental eminence)',b:'E',d:11.0,w:1.0},{n:'Beneath the chin',b:'Me',d:7.0,w:1.2},
  {n:'Above the eye (supraorbital)',b:[83,-25],d:8.0,w:0.5,lat:true},{n:'Side of the eye socket',b:[70,-10],d:9.5,w:0.7,lat:true},{n:'Cheekbone',b:[74,14],d:13.0,w:1.0,lat:true},
  {n:'Zygomatic arch',b:[45,8],d:7.5,w:0.9,lat:true},{n:'Upper cheek',b:[84,34],d:20.0,w:1.2,lat:true},{n:'Lower cheek',b:[80,60],d:16.0,w:1.3,lat:true},{n:'Jaw angle (gonion)',b:[24,70],d:12.0,w:1.2,lat:true}];
const BUILD={thin:0.7,average:1,heavy:1.45};
const NFACE=FACE.length;

/* ---------- skull outline (lateral view) ---------- */
function A(cx,cy,rx,ry,a0,a1){const n=Math.max(3,Math.ceil(Math.abs(a1-a0)/15)),o=[];for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*D2R;o.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}return o;}
function catmull(pts,closed){const n=pts.length,o=[];const P=i=>closed?pts[(i+n)%n]:pts[clamp(i,0,n-1)];const last=closed?n:n-1;
  for(let i=0;i<last;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);for(let s=0;s<8;s++){const t=s/8,t2=t*t,t3=t2*t;o.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}
  if(!closed)o.push(pts[n-1]);return o;}
function smoothC(pts){const out=[];let run=[];pts.forEach((p,i)=>{run.push(p);if((p[2]&&i>0)||i===pts.length-1){const seg=catmull(run,false);if(out.length)seg.shift();out.push(...seg);run=[p];}});return out;}
const C=(x,y)=>[x,y,1];
function skullGeo(T){const gb=(T.g-1)*2.2,ml=6+(T.m-1)*4,ce=(T.e-3)*1.6;
  const G=[95+gb,-38],E=[104+ce,79],Me=[95+ce*0.4,92];
  const cran=smoothC([C(92,-28),G,[93,-55],[86,-78],[70,-100],[45,-117],[12,-125],[-22,-121],[-52,-107],[-76,-84],[-91,-55],[-96,-25],[-93,2],[-84,22],[-62,32],[-35,30],[-14,24],C(-6,22),[-2,22+ml],C(6,22+ml*0.6),[12,16],C(22,12),[45,14],C(64,14),[72,24],[82,34],C(92,37),[101,38],C(104,37),[101,29],C(106,22),[99,14],[97,4],C(102,-5),[96,-18],C(92,-28)]);
  const mand=smoothC([C(102,59),[101,67],E,[100,88],Me,[75,88],[50,84],[30,78],C(22,70),[16,48],[12,26],C(8,14),[14,13],[22,24],C(34,16),[38,28],[44,48],[60,56],C(80,58),C(102,59)]);
  return {cran,mand,G,E,Me,ml,gb};}
function bonePt(f,geo){return f.b==='G'?geo.G:f.b==='E'?geo.E:f.b==='Me'?geo.Me:f.b;}
function pathPts(ctx,pts,X){ctx.beginPath();pts.forEach((q,i)=>{const [x,y]=X(q);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});}
function drawSkull(ctx,T,ox,oy,s,opt){opt=opt||{};const X=q=>[ox+q[0]*s,oy+q[1]*s],geo=skullGeo(T),ink=PAL['cv-ink'],lw=Math.max(1.5,2*s/1.45);
  ctx.save();ctx.lineJoin='round';ctx.fillStyle=PAL['card'];ctx.strokeStyle=ink;ctx.lineWidth=lw;
  pathPts(ctx,geo.cran,X);ctx.closePath();ctx.fill();ctx.stroke();pathPts(ctx,geo.mand,X);ctx.closePath();ctx.fill();ctx.stroke();
  // orbit, nasal aperture shadow, ear canal, zygomatic arch, teeth
  ctx.fillStyle=PAL['cv-bg2'];ctx.lineWidth=lw*0.8;pathPts(ctx,A(80,-12,10,15,0,360),X);ctx.fill();ctx.stroke();
  pathPts(ctx,[[99,-2],[96,8],[99,16],[103,20],[100,8]],X);ctx.closePath();ctx.fill();
  pathPts(ctx,A(4,2,5,5,0,360),X);ctx.fill();ctx.stroke();
  ctx.lineWidth=lw*0.7;pathPts(ctx,[[22,4],[50,2],[70,6]],X);ctx.stroke();pathPts(ctx,[[22,11],[50,10],[66,13]],X);ctx.stroke();
  for(let i=0;i<5;i++){const x=84+i*4.6;pathPts(ctx,[[x,37],[x,47]],X);ctx.stroke();pathPts(ctx,[[x-0.5,49],[x-0.5,58]],X);ctx.stroke();}
  pathPts(ctx,[[82,48],[103,48]],X);ctx.stroke();
  // brow ridge emphasis
  if(T.g>=3){ctx.lineWidth=lw*(0.6+0.25*(T.g-2));pathPts(ctx,[[86,-31],[91+geo.gb*0.8,-37],[93,-45]],X);ctx.stroke();}
  // sutures
  if(opt.sut){const st=opt.sut;ctx.strokeStyle=ink;ctx.lineWidth=st==='open'?lw*0.75:lw*0.5;ctx.globalAlpha=st==='open'?1:st==='partial'?0.75:0.3;if(st==='partial')ctx.setLineDash([5,5]);if(st==='closed')ctx.setLineDash([2,8]);
    const zig=(pts)=>{const o=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];for(let j=0;j<4;j++){const t=j/4,x=lerp(a[0],b[0],t),y=lerp(a[1],b[1],t);o.push([x+(j%2?1.6:-1.6),y]);}}o.push(pts[pts.length-1]);return o;};
    pathPts(ctx,zig([[28,-123],[38,-100],[46,-72],[52,-44],[56,-26]]),X);ctx.stroke();pathPts(ctx,zig([[-50,-109],[-62,-80],[-70,-50],[-76,-20],[-74,6]]),X);ctx.stroke();
    ctx.setLineDash([]);ctx.globalAlpha=1;}
  ctx.restore();return {X,geo};}

/* ---------- pelvis (front view) ---------- */
function drawPelvis(ctx,cx,cy,s,ang,notch,k,showAngle){const f=clamp((ang-60)/45,0,1),ink=PAL['cv-ink'];ctx.save();ctx.lineJoin='round';ctx.lineWidth=2;ctx.strokeStyle=ink;ctx.fillStyle=PAL['card'];
  const S=(x,y)=>[cx+x*s,cy+y*s];const L=(pts,close)=>{ctx.beginPath();pts.forEach((q,i)=>{const [x,y]=S(q[0],q[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});if(close)ctx.closePath();};
  const half=ang/2*D2R,sym=[0,62],tub=[Math.sin(half)*70,62+Math.cos(half)*70];
  [-1,1].forEach(sd=>{const m=q=>[q[0]*sd,q[1]];
    // hip bone: iliac blade, acetabulum region, pubis and ischium
    const wing=catmull([[38,-70],[70,-98],[118+22*f,-92+8*f],[150+26*f,-58+10*f],[142+22*f,-22],[120+18*f,6],[104+14*f,30],[96+12*f,52],[tub[0]+20,tub[1]+4],[tub[0]+4,tub[1]+10],[tub[0]-8,tub[1]-6],[10,64],[6,48],[30,42],[60,22],[52,-10],[38,-40]],true).map(m);
    L(wing,true);ctx.fill();ctx.stroke();
    // obturator foramen
    const oc=[48+14*f+tub[0]*0.25,58];ctx.fillStyle=PAL['cv-bg2'];L(A(oc[0],oc[1],10+5*f,16-3*f,0,360).map(m),true);ctx.fill();ctx.stroke();ctx.fillStyle=PAL['card'];
    // acetabulum
    L(A(100+14*f,22,17,17,0,360).map(m),true);ctx.stroke();L(A(100+14*f,22,9,9,0,360).map(m),true);ctx.stroke();});
  // sacrum and coccyx
  L(catmull([[-40,-78],[40,-78],[30,-20],[12,18],[0,30],[-12,18],[-30,-20]],true));ctx.fill();ctx.stroke();
  ctx.lineWidth=1.2;for(let i=0;i<4;i++){const y=-60+i*18,w=34-i*7;L([[-w,y],[w,y]]);ctx.stroke();}
  // pelvic inlet
  ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-soft'];L(A(0,-8,48+18*f,38+4*f,0,360),true);ctx.stroke();ctx.setLineDash([]);
  // pubic symphysis
  ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.fillStyle=PAL['card2'];L(A(0,50,6,13,0,360),true);ctx.fill();ctx.stroke();
  if(showAngle){const [ax,ay]=S(0,sym[1]);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(...S(-tub[0],tub[1]));ctx.lineTo(ax,ay);ctx.lineTo(...S(tub[0],tub[1]));ctx.stroke();
    ctx.beginPath();ctx.arc(ax,ay,32*s,Math.PI/2-half,Math.PI/2+half);ctx.stroke();txt(ctx,Math.round(ang)+'°',ax,ay+(32*s+16*k),{s:14*k,w:700,a:'center',c:PAL['s1']});}
  ctx.restore();}
function drawNotch(ctx,x,y,w,h,score,k){const ink=PAL['cv-ink'];ctx.save();ctx.fillStyle=PAL['card'];ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.lineJoin='round';
  const f=(score-1)/4,hw=lerp(w*0.26,w*0.1,f),dp=lerp(h*0.42,h*0.62,f),nx=x+w*0.5,by=y+h;
  ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(x+w*0.04,y+h*0.12);ctx.quadraticCurveTo(x+w*0.5,y-h*0.05,x+w,y+h*0.18);ctx.lineTo(x+w*0.96,by);ctx.lineTo(nx+hw,by);
  ctx.bezierCurveTo(nx+hw*0.6,by-dp*0.9,nx-hw*0.6,by-dp*0.9,nx-hw,by);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(nx-hw,by+6);ctx.lineTo(nx+hw,by+6);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,score<=2?'wide':score>=4?'narrow':'medium',nx,by+22*k,{s:12*k,a:'center',c:PAL['s1'],w:700});ctx.restore();}
/* ---------- long bones, symphysis face, clavicle ---------- */
function drawLongBone(ctx,x,y,L,type,open,col){const ink=PAL['cv-ink'];ctx.save();ctx.fillStyle=col||PAL['card'];ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.lineJoin='round';
  const t=L/450,P=(u,v)=>[x+u*t,y+v*t];const path=pts=>{ctx.beginPath();catmull(pts,true).forEach((q,i)=>{const [px,py]=P(q[0],q[1]);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.closePath();ctx.fill();ctx.stroke();};
  if(type==='femur'){path([[100,-13],[250,-12],[400,-13],[428,-26],[447,-28],[453,-12],[453,12],[447,28],[428,26],[400,13],[250,12],[112,13],[98,22],[86,20],[66,9],[46,0],[38,-8],[44,-24],[60,-21],[74,-30],[88,-32],[98,-24]]);
    ctx.beginPath();const [hx,hy]=P(34,-16);ctx.arc(hx,hy,22*t,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(...P(440,0));ctx.lineTo(...P(452,0));ctx.stroke();
    if(open){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(...P(40,-40));ctx.lineTo(...P(50,0));ctx.stroke();ctx.setLineDash([]);}}
  else if(type==='tibia'){path([[0,-30],[18,-32],[60,-12],[250,-10],[420,-11],[446,-16],[452,-6],[452,10],[440,14],[420,11],[250,10],[60,12],[18,32],[0,30]]);}
  else{path([[30,-18],[60,-12],[250,-10],[410,-12],[440,-24],[452,-10],[452,10],[440,24],[410,12],[250,10],[60,12],[30,18]]);ctx.beginPath();const [hx,hy]=P(22,0);ctx.arc(hx,hy,22*t,0,TAU);ctx.fill();ctx.stroke();}
  ctx.restore();}
function drawSymphysis(ctx,cx,cy,w,h,ph,k){const ink=PAL['cv-ink'],r=rng(3+ph);ctx.save();ctx.fillStyle=PAL['card'];ctx.strokeStyle=ink;ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(cx,cy,w/2,h/2,0,0,TAU);ctx.fill();ctx.stroke();ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,w/2-2,h/2-2,0,0,TAU);ctx.clip();
  const ridges=[9,7,4,0,0,0][ph-1];ctx.lineWidth=2;for(let i=0;i<ridges;i++){const y=cy-h/2+h*(i+0.7)/(ridges+0.4);ctx.beginPath();for(let x=cx-w/2;x<=cx+w/2;x+=4)ctx.lineTo(x,y+3*Math.sin((x-cx)*0.25+i));ctx.stroke();}
  if(ph>=2){ctx.lineWidth=3;ctx.beginPath();const ext=[0.25,0.55,0.95,1,1][ph-2];ctx.ellipse(cx,cy,w/2-9,h/2-9,0,Math.PI*0.5,Math.PI*0.5+TAU*ext);ctx.stroke();}
  if(ph===4||ph===5){ctx.fillStyle='rgba(120,120,120,.18)';ctx.beginPath();ctx.ellipse(cx,cy,w/2-14,h/2-14,0,0,TAU);ctx.fill();}
  if(ph===5){ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,cy,w/2-15,h/2-15,0,0,TAU);ctx.stroke();}
  if(ph===6){ctx.fillStyle=PAL['cv-bg2'];for(let i=0;i<22;i++){ctx.beginPath();ctx.arc(cx+(r()-0.5)*w*0.7,cy+(r()-0.5)*h*0.75,2+r()*4,0,TAU);ctx.fill();ctx.stroke();}
    ctx.strokeStyle=PAL['card'];ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(cx,cy,w/2-9,h/2-9,0,1.2,1.9);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,cy,w/2-9,h/2-9,0,4.0,4.6);ctx.stroke();}
  ctx.restore();ctx.restore();}
function drawClavicle(ctx,x,y,L,open){ctx.save();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+L*0.3,y+16,x+L*0.6,y-16,x+L,y-4);ctx.stroke();
  ctx.strokeStyle=PAL['card'];ctx.lineWidth=9;ctx.stroke();if(open){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x+12,y-10);ctx.lineTo(x+12,y+12);ctx.stroke();ctx.setLineDash([]);}ctx.restore();}

/* ---------- full skeleton, front view, clean line art ---------- */
function drawSkeleton(ctx,cx,top,H,fem,hl){const ink=PAL['cv-ink'],card=PAL['card'],w=H*(fem?0.95:1);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  const P=(x,y)=>[cx+x*w,top+y*H];const bone=(pts,wd)=>{ctx.beginPath();pts.forEach((q,i)=>{const [x,y]=P(q[0],q[1]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=ink;ctx.lineWidth=wd+3;ctx.stroke();ctx.strokeStyle=card;ctx.lineWidth=wd;ctx.stroke();};
  const sym=(pts,wd)=>{bone(pts,wd);bone(pts.map(q=>[-q[0],q[1]]),wd);};
  // skull
  ctx.fillStyle=card;ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(...P(0,0.058),0.052*w,0.058*H,0,0,TAU);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(...P(-0.042,0.075));ctx.quadraticCurveTo(...P(-0.04,0.118),...P(0,0.125));ctx.quadraticCurveTo(...P(0.04,0.118),...P(0.042,0.075));ctx.fill();ctx.stroke();
  ctx.fillStyle=PAL['cv-bg2'];[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(...P(0.02*sd,0.058),0.014*w,0.012*H,0,0,TAU);ctx.fill();ctx.stroke();});ctx.beginPath();ctx.moveTo(...P(0,0.072));ctx.lineTo(...P(-0.007,0.088));ctx.lineTo(...P(0.007,0.088));ctx.closePath();ctx.fill();ctx.stroke();
  // spine
  for(let y=0.13;y<0.52;y+=0.017){const ww=y<0.19?0.012:y<0.4?0.015:0.019;ctx.fillStyle=card;ctx.strokeStyle=ink;ctx.lineWidth=1.5;const [x0,y0]=P(-ww,y);rr(ctx,x0,y0,2*ww*w,0.012*H,2);ctx.fill();ctx.stroke();}
  // ribs and sternum
  for(let i=0;i<9;i++){const y=0.205+i*0.019,hw=0.07+0.025*Math.sin(Math.min(1,(i+2)/7)*Math.PI/2);[-1,1].forEach(sd=>{ctx.beginPath();ctx.moveTo(...P(0.018*sd,y));ctx.bezierCurveTo(...P(hw*sd*1.05,y-0.012),...P(hw*sd*1.15,y+0.03),...P(hw*0.55*sd,y+0.045+i*0.002));ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=card;ctx.lineWidth=1.8;ctx.stroke();});}
  bone([[0,0.205],[0,0.33]],5);
  sym([[0.02,0.19],[0.06,0.196],[0.115,0.186]],4.5);
  // arms
  sym([[0.125,0.195],[0.14,0.37]],6);sym([[0.14,0.375],[0.16,0.51]],4);sym([[0.148,0.375],[0.172,0.505]],3.5);
  [-1,1].forEach(sd=>{for(let j=0;j<4;j++)bone([[sd*(0.158+j*0.006),0.52],[sd*(0.152+j*0.012),0.575]],2);});
  // pelvis
  ctx.fillStyle=card;ctx.strokeStyle=ink;ctx.lineWidth=2;[-1,1].forEach(sd=>{ctx.beginPath();ctx.moveTo(...P(0.02*sd,0.5));ctx.quadraticCurveTo(...P((fem?0.12:0.105)*sd,0.475),...P((fem?0.115:0.1)*sd,0.53));ctx.quadraticCurveTo(...P(0.07*sd,0.565),...P((fem?0.03:0.02)*sd,0.575));ctx.lineTo(...P(0.006*sd,0.56));ctx.closePath();ctx.fill();ctx.stroke();});
  // legs
  sym([[0.075,0.54],[0.06,0.775]],7);[-1,1].forEach(sd=>{ctx.beginPath();ctx.arc(...P(0.06*sd,0.783),0.012*w,0,TAU);ctx.fillStyle=card;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1.5;ctx.stroke();});
  sym([[0.058,0.795],[0.052,0.955]],6);sym([[0.075,0.8],[0.068,0.95]],3);sym([[0.045,0.965],[0.08,0.995]],4);
  if(hl){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;hl.forEach(h=>{const [x,y]=P(h[0],h[1]);ctx.beginPath();ctx.arc(x,y,h[2]*H,0,TAU);ctx.stroke();});}
  ctx.restore();}

/* ---------- helpers ---------- */
function vis(sim,c){if(!atLeast(c.lvl||'bio'))return false;if(c.modes&&!c.modes.includes(sim.p.mode))return false;return true;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def;
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(sim,c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(sim,m);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!vis(sim,a);});}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBlock(ctx,lines,x,y,maxW,maxY,k){let ly=y;for(const L of lines){const sz=(L.s||13)*k;const ws=wrapLines(ctx,L.t,maxW,sz,L.w);for(const w of ws){if(ly+sz>maxY)return ly;ly+=sz*1.25;txt(ctx,w,x,ly-sz*0.25,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink']});}ly+=(L.gap||3)*k;}return ly;}
function card(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function caseMatch(p){for(const id in CASES){const v=CASES[id].v;if(MEAS.every(m=>v[m]===p[m]||(typeof v[m]==='number'&&Math.abs(v[m]-p[m])<1e-6)))return id;}return null;}
const roundPhase=p=>clamp(Math.round(p.symph),1,6);
function tipOf(f,geo,build){const b=bonePt(f,geo);return b;}
/* outward normal on the midline profile, from the neighboring bone points */
function faceTips(T,build){const geo=skullGeo(T),fb=BUILD[build],out=[];
  const mid=FACE.filter(f=>!f.lat),bp=mid.map(f=>bonePt(f,geo));
  FACE.forEach((f,i)=>{const b=bonePt(f,geo),d=f.d*(1+(fb-1)*f.w);let nx,ny;
    if(!f.lat){const j=mid.indexOf(f),a=bp[Math.max(0,j-1)],c=bp[Math.min(bp.length-1,j+1)],tx=c[0]-a[0],ty=c[1]-a[1],L=Math.hypot(tx,ty)||1;nx=ty/L;ny=-tx/L;if(nx<0){nx=-nx;ny=-ny;}}
    else{nx=0.8;ny=0.6;const L=Math.hypot(nx,ny);nx/=L;ny/=L;if(f.n.startsWith('Jaw')){nx=-0.55;ny=0.83;}if(f.n.startsWith('Above')){nx=0.7;ny=-0.7;}if(f.n.startsWith('Zyg')){nx=0.2;ny=-0.98;}}
    out.push({f,b,d,t:[b[0]+nx*d,b[1]+ny*d],n:[nx,ny]});});return {geo,tips:out};}

const AN={
  id:'anthropology',hash:'anthropology',apUnit:9,order:2,tab:'Bones and faces',kind:'Virtual lab',prereq:['timeofdeath'],next:['dna'],
  card:'Read a skeleton for sex, age and stature, compare the profile with missing-person reports, and build a face on a skull with tissue-depth markers.',
  title:'Forensic anthropology and facial reconstruction',
  lede:{bio:'Bones keep a record of who a person was. Read the pelvis for sex, growth plates and the pubic bone for age, and the thigh bone for height. Then see which missing-person report fits.',
        honors:'Score the pelvis and skull traits, combine age methods into one range, and choose the bone and formula for stature. A biological profile narrows the search; it does not identify anyone by itself.',
        ap:'Every estimate carries uncertainty: logistic probabilities for sex, 95% ranges for age phases, ±2 standard errors for stature. Watch the ranges overlap, and see why the profile only excludes or includes.'},
  scale:{bio:'Drawings are schematic. The thigh bone (femur) of an adult is about 40–52 cm long; the pelvis is about 28 cm wide.',ap:'Schematic drawings. Adult femur 38–54 cm; skull drawn at about 1.5 px per mm; facial tissue depths 3–22 mm.'},
  timeless:true,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'case',lvl:'bio',noTrial:true,options:[{v:'case',l:'Case profile'},{v:'sex',l:'Sex'},{v:'age',l:'Age'},{v:'stature',l:'Stature'},{v:'face',l:'Face'}]},
    {id:'caseid',label:'Remains to examine',type:'seg',def:'r1',lvl:'bio',modes:['case'],noTrial:true,options:[{v:'r1',l:'Remains 1'},{v:'r2',l:'Remains 2'}],help:'Choosing a set loads its measurements into Sex, Age and Stature.'},
    {id:'report',label:'Missing-person report',type:'seg',def:1,lvl:'bio',modes:['case'],noTrial:true,options:REP.map(R=>({v:R.id,l:'MP-'+R.id}))},
    {id:'subpubic',label:'Subpubic angle (pubic arch)',type:'range',min:50,max:110,step:1,def:96,unit:'°',lvl:'bio',modes:['sex'],help:'The angle under the pubic bones. Wide (over 90°) in most females, narrow (under 70°) in most males.'},
    {id:'notch',label:'Greater sciatic notch score',type:'range',min:1,max:5,step:1,def:1,unit:'',lvl:'honors',modes:['sex'],help:'1 = wide and shallow (female) to 5 = narrow and deep (male).'},
    {id:'glabella',label:'Brow ridge (glabella) score',type:'range',min:1,max:5,step:1,def:2,unit:'',lvl:'honors',modes:['sex'],help:'1 = smooth forehead, 5 = strong brow ridge.'},
    {id:'mastoid',label:'Mastoid process score',type:'range',min:1,max:5,step:1,def:2,unit:'',lvl:'honors',modes:['sex'],help:'The bump behind the ear: 1 = small, 5 = large.'},
    {id:'mental',label:'Chin (mental eminence) score',type:'range',min:1,max:5,step:1,def:1,unit:'',lvl:'ap',modes:['sex'],help:'1 = small, pointed chin; 5 = broad, square chin.'},
    {id:'plates',label:'Growth plates',type:'seg',def:'fused',lvl:'bio',modes:['age'],options:Object.keys(PLATES).map(k=>({v:k,l:{open:'Some open',clav:'All but collarbone fused',fused:'All fused'}[k]}))},
    {id:'symph',label:'Pubic symphysis phase',type:'range',min:1,max:6,step:1,def:3,unit:'',lvl:'bio',modes:['age'],help:'The joint face of the pubic bone: ridged when young (I), rimmed in middle age (IV), eroded when old (VI).'},
    {id:'sutures',label:'Skull sutures',type:'seg',def:'partial',lvl:'honors',modes:['age'],options:Object.keys(SUT).map(k=>({v:k,l:SUT[k].l}))},
    {id:'bone',label:'Bone to use',type:'seg',def:'femur',lvl:'honors',modes:['stature'],options:Object.keys(BONE).map(k=>({v:k,l:BONE[k].l.split(' (')[0]}))},
    {id:'femur',label:'Femur length',type:'range',min:38,max:54,step:0.1,def:45.0,unit:' cm',lvl:'bio',modes:['stature']},
    {id:'tibia',label:'Tibia length',type:'range',min:30,max:45,step:0.1,def:36.5,unit:' cm',lvl:'honors',modes:['stature']},
    {id:'humerus',label:'Humerus length',type:'range',min:26,max:38,step:0.1,def:31.8,unit:' cm',lvl:'honors',modes:['stature']},
    {id:'markers',label:'Tissue-depth markers placed',type:'range',min:0,max:NFACE,step:1,def:4,unit:'',lvl:'bio',modes:['face']},
    {id:'build',label:'Body build',type:'seg',def:'average',lvl:'bio',modes:['face'],options:[{v:'thin',l:'Thin'},{v:'average',l:'Average'},{v:'heavy',l:'Heavy'}],help:'Tissue is thicker over the cheeks and jaw in heavier people; it changes little over the brow and nose bridge.'},
    {id:'spread',label:'Show the uncertainty (±25% depth)',type:'toggle',def:false,lvl:'ap',modes:['face']}
  ],
  actions:[
    {id:'load',label:'Load the case bones',lvl:'bio',modes:['sex','age','stature'],run(sim){loadCase(sim,sim.p.caseid);}},
    {id:'place',label:'Place the next marker',lvl:'bio',primary:true,modes:['face'],run(sim){BioLab.setValues(sim,{markers:Math.min(NFACE,Math.round(sim.p.markers)+1)});}},
    {id:'nextrep',label:'Next report',lvl:'bio',modes:['case'],run(sim){BioLab.setValues(sim,{report:sim.p.report%REP.length+1});}}
  ],
  init(sim){return {};},
  metrics:[
    {id:'sex',label:'Sex estimate',unit:'',lvl:'bio',text:true,modes:['case','sex'],get:s=>{const e=sexEst(s.p);return e.word+(e.sex?' (from the '+e.src+')':'');}},
    {id:'pf',label:'Skull: P(female), Walker',unit:'',lvl:'honors',min:0,max:1,d:2,modes:['sex'],get:s=>sexEst(s.p).pf},
    {id:'age',label:'Age range',unit:'',lvl:'bio',text:true,modes:['case','age'],get:s=>{const a=ageRanges(s.p);return a.ok?a.lo+'–'+(a.hi>=100?'90+':a.hi)+' years':'methods disagree';}},
    {id:'stat',label:'Stature estimate',unit:'',lvl:'bio',text:true,modes:['case','stature'],get:s=>{const t=stature(s.p);return t.v.toFixed(1)+' cm ('+inch(t.v)+')';}},
    {id:'srange',label:'Stature range (±2 SE)',unit:'',lvl:'honors',text:true,modes:['case','stature'],get:s=>{const t=stature(s.p);return t.lo.toFixed(1)+'–'+t.hi.toFixed(1)+' cm';}},
    {id:'height',label:'Estimated stature',unit:'cm',lvl:'ap',min:140,max:200,d:1,modes:['stature'],get:s=>stature(s.p).v},
    {id:'rep',label:'This report',unit:'',lvl:'bio',text:true,modes:['case'],noTrial:true,get:s=>{const R=REP[s.p.report-1],w=reportCheck(s.p,R);return w.length?'Excluded by '+w.join(' and '):'Consistent: keep this lead';}},
    {id:'nm',label:'Markers placed',unit:'',lvl:'bio',text:true,modes:['face'],get:s=>Math.round(s.p.markers)+' of '+NFACE}
  ],
  graphs:[{id:'agebars',label:'Age ranges by method',lvl:'bio',custom:true},{id:'tg',label:'Stature vs femur length',lvl:'bio',custom:true}],
  defaultGraph:'agebars',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='tg'){const ax=axes(ctx,box,{xmin:38,xmax:54,ymin:140,ymax:200,xl:'femur length (cm)',yl:'stature (cm)'});
      [['F',PAL['s1']],['M',PAL['s2']]].forEach(([sx,col])=>{const c=TG[sx].femur;ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ax.X(38),ax.Y(c[0]*38+c[1]));ctx.lineTo(ax.X(54),ax.Y(c[0]*54+c[1]));ctx.stroke();
        ctx.globalAlpha=0.15;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(ax.X(38),ax.Y(c[0]*38+c[1]+2*c[2]));ctx.lineTo(ax.X(54),ax.Y(c[0]*54+c[1]+2*c[2]));ctx.lineTo(ax.X(54),ax.Y(c[0]*54+c[1]-2*c[2]));ctx.lineTo(ax.X(38),ax.Y(c[0]*38+c[1]-2*c[2]));ctx.fill();ctx.globalAlpha=1;});
      legend(ctx,box.L+8,box.T+10,[{label:'female formula',color:PAL['s1']},{label:'male formula',color:PAL['s2']}]);
      const t=statureFor(p,'femur',sexEst(p).sex);ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(ax.X(p.femur),ax.Y(t.v),5.5,0,TAU);ctx.fill();return;}
    const a=ageRanges(p),ax=axes(ctx,box,{xmin:10,xmax:90,ymin:0,ymax:a.list.length+1,xl:'age (years)',yl:''});const bh=Math.min(22,box.H/(a.list.length+1)*0.5);
    a.list.concat([{l:'Combined',r:[a.lo,a.hi],comb:true}]).forEach((o,i)=>{const y=ax.Y(a.list.length+0.5-i),x0=ax.X(clamp(o.r[0],10,90)),x1=ax.X(clamp(o.r[1],10,90));if(o.comb&&!a.ok)return;
      ctx.fillStyle=o.comb?PAL['s3']:PAL['g-axis'];ctx.globalAlpha=o.comb?0.9:0.55;ctx.fillRect(x0,y-bh/2,Math.max(2,x1-x0),bh);ctx.globalAlpha=1;txt(ctx,o.l,x0+4,y-bh/2-4,{s:12,c:PAL['cv-ink']});});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const rows=REP.map(R=>{const w=reportCheck(p,R);return `<tr${R.id===p.report?' style="font-weight:700"':''}><td style="text-align:left">MP-${R.id}</td><td style="text-align:left">${R.sex==='F'?'woman':'man'}, ${R.age}, ${R.h} cm (${inch(R.h)})</td><td style="text-align:left">${w.length?'excluded: '+w.join(', '):'consistent'}</td></tr>`;}).join('');
      const cm=caseMatch(p);return `<h3>Missing-person reports (fictional)</h3><p>Hikers found a skeleton in a state forest (fictional), long after death. ${cm?'The profile below uses the measurements of '+CASES[cm].l+'.':'<b>You have edited the measurements</b>, so the profile uses your values. Load the case bones to reset them.'}</p><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Report</th><th style="text-align:left">Missing person</th><th style="text-align:left">Against the profile</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">A profile can exclude reports or keep them as leads. ${hon?'Identification needs individual evidence: dental records, DNA, or healed injuries and implants matched to records.':'Identification needs dental records or DNA.'}</p>`;}
    if(p.mode==='sex'){const e=sexEst(p);return `<h3>Scoring guide</h3><div class="tbl-wrap"><table><thead><tr><th>Trait</th><th>Female pattern</th><th>Male pattern</th><th>Reliability</th></tr></thead><tbody><tr><td>Subpubic angle</td><td>over 90°, U-shaped</td><td>under 70°, V-shaped</td><td>high</td></tr>${hon?'<tr><td>Greater sciatic notch</td><td>wide (score 1–2)</td><td>narrow (4–5)</td><td>high</td></tr><tr><td>Brow ridge</td><td>smooth (1–2)</td><td>strong (4–5)</td><td>moderate</td></tr><tr><td>Mastoid</td><td>small (1–2)</td><td>large (4–5)</td><td>moderate</td></tr>':''}${ap?'<tr><td>Chin</td><td>small, pointed (1–2)</td><td>broad, square (4–5)</td><td>moderate</td></tr>':''}</tbody></table></div>${hon?`<p class="help">The pelvis is about 95% accurate in adults because it is shaped for childbirth. Walker’s skull equation is about ${ap?'88':'85'}% accurate. ${ap?`logit = −1.375G − 1.185M − 1.151E + 9.128 = ${e.lg.toFixed(2)}, so P(female) = ${e.pf.toFixed(2)}.`:''} Sex cannot be read reliably from children’s skeletons.</p>`:''}`;}
    if(p.mode==='age'){const sx=sexEst(p).sex;const rows=ROMAN.map((r,i)=>`<tr${i===roundPhase(p)-1?' style="font-weight:700"':''}><td>${r}</td><td>${SB.F[i][0]}–${SB.F[i][1]}${ap?' (mean '+SBMEAN.F[i]+')':''}</td><td>${SB.M[i][0]}–${SB.M[i][1]}${ap?' (mean '+SBMEAN.M[i]+')':''}</td></tr>`).join('');
      return `<h3>Suchey–Brooks pubic symphysis phases</h3><div class="tbl-wrap"><table><thead><tr><th>Phase</th><th>Female (95% range)</th><th>Male (95% range)</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">${sx?'Using the '+(sx==='F'?'female':'male')+' ranges, because the sex estimate is '+(sx==='F'?'female':'male')+'.':'Sex is undetermined, so both ranges are combined.'} Ranges widen with age: bones change quickly while we grow, and slowly and unevenly after about 30.</p>`;}
    if(p.mode==='stature'){const rows=['F','M'].map(sx=>Object.keys(BONE).map(b=>{const c=TG[sx][b];return `<tr${b===stature(p).bone&&sx===sexEst(p).sex?' style="font-weight:700"':''}><td>${sx==='F'?'Female':'Male'}</td><td>${BONE[b].l}</td><td>${c[0]} × L + ${c[1]}</td><td>± ${c[2]}</td></tr>`;}).join('')).join('');
      return `<h3>Trotter and Gleser (1952) formulas</h3><div class="tbl-wrap"><table><thead><tr><th>Sex</th><th>Bone</th><th>Stature (cm)</th><th>Standard error</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">L is the bone’s maximum length in cm, measured on an osteometric board. The range shown is ±2 standard errors (about 95%). These formulas come from one U.S. reference sample; labs today choose formulas that fit the population and time period.</p>`;}
    const ft=faceTips({g:p.glabella,m:p.mastoid,e:p.mental},p.build).tips;const rows=ft.map((o,i)=>`<tr${i<Math.round(p.markers)?'':' style="opacity:.55"'}><td>${i+1}</td><td>${o.f.n}</td><td>${o.d.toFixed(1)}</td><td>${i<Math.round(p.markers)?'placed':''}</td></tr>`).join('');
    return `<h3>Tissue-depth markers</h3><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Landmark</th><th>Depth (mm), ${p.build}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">In the clay method, pegs cut to these depths are glued to the skull, then clay is built up to the peg tips. Depths are averages; real people vary by about ±25%.</p>`;},
  narrate(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const R=REP[p.report-1],w=reportCheck(p,R),e=sexEst(p),a=ageRanges(p),t=stature(p);
      const prof='The bones say: '+e.word+', '+(a.ok?a.lo+'–'+(a.hi>=100?'90+':a.hi)+' years':'age unclear')+', '+t.lo.toFixed(0)+'–'+t.hi.toFixed(0)+' cm. ';
      return prof+(w.length?'<b>MP-'+R.id+' is excluded</b> by '+w.join(' and ')+'.':'<b>MP-'+R.id+' is consistent</b>, so investigators keep it as a lead and compare dental records or DNA.');}
    if(p.mode==='sex'){const e=sexEst(p);if(!hon)return p.subpubic>=90?'The pubic arch is wide and U-shaped ('+Math.round(p.subpubic)+'°). <b>A wide arch is the female pattern</b>: the female pelvis is shaped for childbirth.':p.subpubic<=70?'The pubic arch is narrow and V-shaped ('+Math.round(p.subpubic)+'°). <b>A narrow arch is the male pattern.</b>':'The pubic arch is '+Math.round(p.subpubic)+'°, between the typical ranges. <b>One trait in the overlap zone cannot decide sex.</b>';
      if(e.conflict)return 'The pelvis looks '+(e.pel==='F'?'female':'male')+' but the skull looks '+(e.sk==='F'?'female':'male')+'. <b>Trust the pelvis</b>: it is shaped for childbirth and is about 95% accurate, while skull traits vary more.';
      return 'Pelvis: '+(e.pel?(e.pel==='F'?'female':'male')+' pattern':'in between')+'. Skull: P(female) = '+e.pf.toFixed(2)+'. <b>Estimate: '+e.word+'</b>'+(e.sex?', based on the '+e.src+'.':'. Score more traits.');}
    if(p.mode==='age'){const a=ageRanges(p);if(!a.ok)return '<b>The age methods do not overlap.</b> Recheck your observations: a real skeleton cannot be under 20 by its growth plates and over 40 by its pubic bone.';
      return (p.plates==='open'?'Some growth plates are still open, so this person was <b>still growing</b>. ':'')+'Each method gives a range, and the true age must fit all of them. <b>Combined: '+a.lo+'–'+(a.hi>=100?'90+':a.hi)+' years.</b>'+(ap?' The phase ranges are wide because adults age at different rates.':'');}
    if(p.mode==='stature'){const t=stature(p),b=BONE[t.bone].l.split(' (')[0].toLowerCase();return 'The '+b+' is '+p[t.bone].toFixed(1)+' cm long. '+(t.sx?'Using the '+(t.sx==='F'?'female':'male')+' formula':'Sex is undetermined, so both formulas are used')+': <b>stature ≈ '+t.v.toFixed(0)+' cm ('+inch(t.v)+'), range '+t.lo.toFixed(0)+'–'+t.hi.toFixed(0)+' cm.</b>'+(hon?' Leg bones predict height better than arm bones.':'');}
    const n=Math.round(p.markers);return n===0?'This is a clean skull drawing. <b>Place tissue-depth markers</b> at standard landmarks to start building the face.':n<10?n+' markers placed. Each peg is cut to the average tissue depth at that spot. <b>The face outline follows the peg tips.</b>':'The profile now follows all the midline pegs. <b>The nose and lips are the least certain parts</b>: they are cartilage and soft tissue, so they are estimated from the bone around them.';},
  tour:[
    {title:'A skeleton to identify',text:'Hikers found a skeleton (fictional). The anthropologist builds a biological profile: sex, age and stature. Then the profile is compared with missing-person reports.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',caseid:'r1',report:1});loadCase(sim,'r1');}},
    {title:'Sex from the pelvis',text:{bio:'The angle under the pubic bones is wide (U-shaped) in most females and narrow (V-shaped) in most males. This one is 96°.',honors:'The pelvis is the best indicator of sex in adults. Add the sciatic notch, then check the skull: brow ridge, mastoid and chin.'},focus:[16,36,400,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'sex'});syncMode(sim);}},
    {title:'Age from growth and wear',text:'Growth plates fuse in a known order through the teens and twenties. After that, the face of the pubic bone changes from ridged to rimmed to eroded. Each method gives a range.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'age'});syncMode(sim);}},
    {title:'Stature from the femur',text:'The femur lies on an osteometric board, a ruler with fixed and sliding end blocks. Its length goes into a regression formula: stature = 2.47 × 45.0 + 54.10 ≈ 165 cm for a female.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'stature',bone:'femur'});syncMode(sim);}},
    {title:'Compare with the reports',text:'The profile is a box of possible ages and heights. Reports outside the box, or of the other sex, are excluded. MP-1 fits, so it becomes a lead.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',report:1});syncMode(sim);}},
    {title:'Building a face',text:'For a facial approximation, pegs cut to average tissue depths are glued at landmarks on the skull. Clay is built up to the peg tips, and the face outline appears.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'face',markers:NFACE,build:'average'});syncMode(sim);}},
    {lvl:'honors',title:'Build changes the face',text:'Tissue over the cheeks and jaw is much thicker in heavier people, while the brow and nose bridge barely change. The same skull can give quite different faces.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{build:'heavy'});}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);BioLab.refresh(sim);}},
  challenges(sim){const fF=statureFor({femur:48},'femur','F'),r1=CASES.r1.v,l1=walker1(r1.glabella,r1.mastoid,r1.mental),pf=sig(l1),st1=statureFor(r1,'femur','F');return [
    {lvl:'bio',instant:true,set:{mode:'sex',subpubic:100},q:'A pelvis has a wide, U-shaped pubic arch, about 100°. What does that suggest?',choices:['Male','Female','You cannot tell anything from a pelvis'],correct:1,
     explain:'A subpubic angle over 90° is the female pattern. The female pelvis is wider with a wider arch, an adaptation for childbirth. The model now shows 100°.'},
    {lvl:'bio',instant:true,set:{mode:'stature',femur:48,bone:'femur'},q:'A female femur is 48.0 cm long. Using stature = 2.47 × femur + 54.10, about how tall was she?',choices:['About 96 cm (twice the femur)','About '+fF.v.toFixed(0)+' cm','About 210 cm'],correct:1,
     explain:'2.47 × 48.0 + 54.10 = '+fF.v.toFixed(1)+' cm, about '+inch(fF.v)+'. Body parts do not scale by a simple ratio: the formula has a slope and an intercept, from measured skeletons of known height.'},
    {lvl:'bio',instant:true,set:{mode:'age',plates:'open'},q:'Several growth plates in a skeleton are still open (not fused). What does that tell you?',choices:['The person was over 40','The person was still growing: a child or teenager','Nothing: growth plates never fuse'],correct:1,
     explain:'Growth plates are cartilage zones where bones lengthen. They fuse in a known order, mostly between about 12 and 25. Open plates mean the person was still growing.'},
    {lvl:'bio',instant:true,set:{mode:'case',caseid:'r1',report:3},q:'Remains 1 has every growth plate fused, even the collarbone. Report MP-3 is a 19-year-old woman. Is MP-3 consistent with the remains?',choices:['Yes, the sex matches','No: a 19-year-old would still have an open collarbone growth plate','It cannot be checked'],correct:1,
     explain:'The collarbone’s growth plate is the last to fuse, usually in the twenties. A fully fused skeleton is older than about 23, so MP-3 is excluded by age even though sex and height fit.'},
    {lvl:'honors',instant:true,set:{mode:'sex',subpubic:96,notch:1,glabella:4,mastoid:4},q:'The pelvis shows a wide arch and a wide sciatic notch, but the skull has a strong brow and large mastoids. What is the best estimate?',choices:['Male, because the skull is robust','Female, because the pelvis is the more reliable indicator','Exactly 50/50'],correct:1,
     explain:'Skull traits vary a lot: some women have robust skulls. The pelvis is shaped for childbirth and is about 95% accurate in adults, so it outweighs the skull.'},
    {lvl:'honors',instant:true,set:{mode:'age',symph:4},q:'A male pubic symphysis is in Suchey–Brooks phase IV. What age should you report?',choices:['35 exactly','23–57 years','50–60 years'],correct:1,
     explain:'Phase IV in males covers 23–57 years (95% range), with a mean of 35.2. Anthropologists report ranges, not a single age, because people age at different rates.'},
    {lvl:'honors',instant:true,set:{mode:'stature',bone:'humerus'},q:'You can measure the femur or the humerus. Which gives the more precise stature estimate?',choices:['The femur: its formula has a smaller standard error','The humerus: arms are easier to measure','Both are equally precise'],correct:0,
     explain:'Leg bones make up a large part of height. For males the femur’s standard error is '+TG.M.femur[2]+' cm and the humerus’s is '+TG.M.humerus[2]+' cm; for females '+TG.F.femur[2]+' and '+TG.F.humerus[2]+' cm.'},
    {lvl:'honors',instant:true,set:{mode:'face',markers:NFACE},q:'Which part of a facial reconstruction is least certain?',choices:['The forehead','The nose and lips','The brow ridge'],correct:1,
     explain:'Forehead and brow tissue is thin and follows the bone. The nose is cartilage and the lips are soft tissue, so their shape is estimated from rules of thumb (for example, nose projection about 3× the nasal spine length).'},
    {lvl:'ap',instant:true,set:{mode:'sex',glabella:r1.glabella,mastoid:r1.mastoid,mental:r1.mental},q:'Walker’s equation: logit = −1.375G − 1.185M − 1.151E + 9.128. Remains 1 scores G = '+r1.glabella+', M = '+r1.mastoid+', E = '+r1.mental+'. What is P(female) = 1/(1 + e^(−logit))?',choices:['About 0.50','About '+pf.toFixed(2),'About 0.05'],correct:1,
     explain:'logit = −1.375('+r1.glabella+') − 1.185('+r1.mastoid+') − 1.151('+r1.mental+') + 9.128 = '+l1.toFixed(2)+'. P = 1/(1 + e^(−'+l1.toFixed(2)+')) = '+pf.toFixed(2)+'. The P(female) tile shows it.'},
    {lvl:'ap',instant:true,set:{mode:'case',caseid:'r1',report:4},q:'Remains 1’s stature range is '+st1.lo.toFixed(1)+'–'+st1.hi.toFixed(1)+' cm. MP-4 is a 170 cm woman, age 58. Is she consistent with the remains?',choices:['Yes: her height and sex fit','No: her height fits, but age 58 is outside the age range','No: her height is outside the range'],correct:1,
     explain:'Every part of the profile must fit. 170 cm lies inside the ±2 SE stature range, but the combined age range is '+(()=>{const a=ageRanges(Object.assign({},sim.p,r1));return a.lo+'–'+a.hi;})()+' years, so MP-4 is excluded by age.'},
    {lvl:'ap',instant:true,set:{mode:'age',symph:5},q:'Why are the Suchey–Brooks ranges for phases V and VI so much wider than for phase I?',choices:['The samples were small','Adult bones change slowly and at different rates, so older ages overlap more','Older people are harder to measure'],correct:1,
     explain:'Growth follows a tight schedule, but degeneration after about 30 depends on activity, health and genetics. Phase V in females covers 25–83 years. The ranges overlap, so older adults are hard to age precisely.'},
    {lvl:'ap',instant:true,set:{mode:'face',markers:NFACE,spread:true},q:'A facial approximation is finished. How do investigators use it?',choices:['As proof of identity in court','To create leads: the public may recognize the face, then DNA or dental records confirm','To replace the biological profile'],correct:1,
     explain:'Tissue depths vary by about ±25% between people of the same build (the shaded band), and nose, lips and ears are estimates. A reconstruction can prompt recognition; identification comes from DNA, dental records or medical implants.'}
  ];},
  lab:{bio:'<p><b>Question:</b> Which missing-person report fits Remains 1?</p><ol><li>In Sex, read the subpubic angle.</li><li>In Age, note the growth plates and the pubic symphysis phase.</li><li>In Stature, read the femur on the osteometric board.</li><li>In Case profile, step through the five reports.</li></ol><p>Which report is consistent? For each excluded report, name the trait that excluded it. Then do the same for Remains 2.</p>',
       honors:'<p><b>Question:</b> How much does the choice of bone change the stature estimate?</p><ol><li>Load the case bones for Remains 1. In Stature, record the estimate and range for the femur, tibia and humerus (press Record trial for each).</li><li>Repeat for Remains 2.</li><li>In Sex, change one skull score at a time and record when the estimate changes.</li></ol><p>Which bone gives the narrowest range? Explain why the pelvis outweighs the skull when they disagree.</p>',
       ap:'<p><b>Question:</b> How does uncertainty in each method limit identification?</p><ol><li>For Remains 1, record P(female), the combined age range and the stature range.</li><li>Change the symphysis phase by one step and record the new combined age range.</li><li>Turn on the uncertainty band in Face and compare thin and heavy builds.</li></ol><p><b>Claim–evidence–reasoning:</b> Which report best fits Remains 1, how confident can you be, and what evidence would you need to identify the person?</p>'},
  terms:[{t:'Biological profile',d:'Sex, age, stature and other traits estimated from a skeleton.'},{t:'Subpubic angle',d:'The angle of the arch below the pubic bones: wide in most females, narrow in most males.'},{t:'Growth plate (epiphyseal plate)',d:'A cartilage zone near the end of a bone where it grows. It fuses when growth stops.'},{t:'Femur',d:'The thigh bone, the longest bone in the body and the best single predictor of height.'},{t:'Facial reconstruction',d:'Building an approximate face on a skull, using average tissue depths.'},
    {lvl:'honors',t:'Greater sciatic notch',d:'A notch at the back of the hip bone: wide and shallow in females, narrow and deep in males.'},{lvl:'honors',t:'Glabella and mastoid',d:'The smooth area between the brows, and the bump behind the ear. Both are larger in most males.'},{lvl:'honors',t:'Pubic symphysis',d:'The joint where the two pubic bones meet. Its surface changes with age in six Suchey–Brooks phases.'},{lvl:'honors',t:'Cranial sutures',d:'Wavy joints between skull bones. They close slowly with age, but very unevenly.'},{lvl:'honors',t:'Osteometric board',d:'A board with a ruler and two end blocks for measuring a bone’s maximum length.'},
    {lvl:'ap',t:'Standard error of estimate',d:'The typical scatter of real statures around a regression formula. About 95% fall within ±2 SE.'},{lvl:'ap',t:'Logistic regression',d:'A model that turns trait scores into a probability, as in Walker’s skull equation.'},{lvl:'ap',t:'Exclusion vs identification',d:'A profile can rule people out; only individual evidence (DNA, dental records) can identify.'}],
  about:'<p><b>Sex.</b> Big picture uses the subpubic angle alone (over 90° female, under 70° male). Closer look averages the subpubic angle and sciatic notch into a pelvis score, and scores the skull with Walker’s (2008) equation from glabella and mastoid (logit = −1.568G − 1.459M + 7.434); Deep dive adds the chin (−1.375G − 1.185M − 1.151E + 9.128). The pelvis decides when it is clear, because it is the more reliable indicator in adults.</p><p><b>Age.</b> Pubic symphysis ranges are the Suchey–Brooks 95% ranges (Brooks and Suchey 1990), using the sex estimate when there is one. Growth-plate and suture ranges are rounded teaching values; real fusion ages vary by bone, sex and population, and sutures are a poor age indicator.</p><p><b>Stature.</b> Trotter and Gleser’s 1952 formulas for the femur, tibia and humerus from their U.S. White reference sample, with ±2 standard errors. Their study gave separate formulas for other groups, and labs now use population-specific or updated formulas (for example in FORDISC).</p><p><b>Face.</b> Tissue depths are rounded adult averages after Rhine and Moore (1984) and Stephan’s pooled tables. Body build scales soft-tissue sites more than bony ones. The face is a stylized outline through the peg tips; the nose uses Krogman’s rule of thumb (projection ≈ 3 × nasal spine length). The skull, pelvis and skeleton are schematic line drawings. All cases and reports are fictional.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);syncLight(sim);
    ({case:drawCase,sex:drawSex,age:drawAge,stature:drawStature,face:drawFace})[p.mode](sim,ctx,k);},
  thumbSetup(sim){sim.p.mode='face';sim.p.markers=NFACE;},thumbFrames:3
};
function syncLight(sim){const key=BioLab.level+sim.p.mode;if(sim._sk!==key){sim._sk=key;syncMode(sim);sim.infoDirty=true;}}
function loadCase(sim,id){BioLab.setValues(sim,Object.assign({},CASES[id].v));sim.infoDirty=true;}

/* ---------- views ---------- */
function drawCase(sim,ctx,k){const p=sim.p,e=sexEst(p),a=ageRanges(p),t=stature(p),phn=k>1.35,cm=caseMatch(p);
  drawSkeleton(ctx,120,40,396,e.sex==='F',null);
  txt(ctx,cm?CASES[cm].l:'Your edited values',120,32,{s:13*k,w:700,a:'center'});
  // profile card
  const bx=244,bw=540,R0=REP[p.report-1],w0=reportCheck(p,R0);card(ctx,bx,36,bw,phn?112:78);const L=[{t:'Biological profile',s:14,w:700},{t:'Sex: '+e.word+'   ·   Age: '+(a.ok?a.lo+'–'+(a.hi>=100?'90+':a.hi):'unclear')+'   ·   Stature: '+t.lo.toFixed(0)+'–'+t.hi.toFixed(0)+' cm',s:13}];
  if(!phn)L.push({t:repText(R0)+': '+(w0.length?'excluded by '+w0.join(' and '):'consistent'),s:13,w:700,c:w0.length?PAL['cv-soft']:PAL['s3']});
  textBlock(ctx,L,bx+14,40,bw-28,36+(phn?110:76),k);
  // chart: age vs stature, profile box and reports
  const c={L:bx+48,T:phn?190:146,R:784-14,B:404};const X=v=>c.L+(v-10)/80*(c.R-c.L),Y=v=>c.B-(v-145)/50*(c.B-c.T);
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let v=10;v<=90;v+=10){ctx.beginPath();ctx.moveTo(X(v),c.T);ctx.lineTo(X(v),c.B);ctx.stroke();}for(let v=145;v<=195;v+=10){ctx.beginPath();ctx.moveTo(c.L,Y(v));ctx.lineTo(c.R,Y(v));ctx.stroke();}
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(c.L,c.T);ctx.lineTo(c.L,c.B);ctx.lineTo(c.R,c.B);ctx.stroke();
  for(let v=10;v<=90;v+=phn?20:10)txt(ctx,String(v),X(v),c.B+15*k,{s:12*k,a:'center',c:PAL['cv-soft']});for(let v=145;v<=195;v+=phn?20:10)txt(ctx,String(v),c.L-6,Y(v),{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});
  txt(ctx,'age (years)',c.R,c.B+(phn?36:32)*k*0.9,{s:12*k,a:'right',c:PAL['cv-soft']});txt(ctx,'height (cm)',c.L+4,c.T-8,{s:12*k,c:PAL['cv-soft']});
  if(a.ok){const x0=X(clamp(a.lo,10,90)),x1=X(clamp(a.hi,10,90)),y0=Y(clamp(t.hi,145,195)),y1=Y(clamp(t.lo,145,195));ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.18;ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.globalAlpha=1;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    if(!phn)txt(ctx,'profile',x1-6,y1-6,{s:12*k,w:700,a:'right',c:PAL['s3']});}
  REP.forEach(R=>{const x=X(R.age),y=Y(R.h),w=reportCheck(p,R),sel=R.id===p.report,col=w.length?PAL['cv-soft']:PAL['s3'];ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=2;
    if(R.sex==='F'){ctx.beginPath();ctx.arc(x,y,7,0,TAU);}else{ctx.beginPath();ctx.rect(x-6.5,y-6.5,13,13);}if(e.sex&&e.sex!==R.sex)ctx.stroke();else ctx.fill();
    if(sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,13,0,TAU);ctx.stroke();}
    txt(ctx,'MP-'+R.id,x+(R.id===5?-14:14),y+(R.id===5?-12:0),{s:12.5*k,w:sel?700:400,b:'middle',a:R.id===5?'right':'left',c:PAL['cv-ink']});});
  if(!phn){const lx=c.R-170,ly=c.T+12;ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.arc(lx,ly,5,0,TAU);ctx.fill();txt(ctx,'woman',lx+9,ly,{s:12*k,b:'middle',c:PAL['cv-soft']});ctx.fillRect(lx+64,ly-5,10,10);txt(ctx,'man',lx+79,ly,{s:12*k,b:'middle',c:PAL['cv-soft']});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(lx+118,ly,5,0,TAU);ctx.stroke();txt(ctx,'wrong sex',lx+127,ly,{s:12*k,b:'middle',c:PAL['cv-soft']});}}

function drawSex(sim,ctx,k){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),e=sexEst(p),phn=k>1.35;
  txt(ctx,'Pelvis, front view',24,30,{s:14*k,w:700});drawPelvis(ctx,210,180,1.12,p.subpubic,p.notch,k,true);
  if(hon){txt(ctx,'Sciatic notch: '+Math.round(p.notch),24,phn?372:362,{s:13*k,w:700});drawNotch(ctx,phn?250:220,phn?326:340,140,phn?56:62,Math.round(p.notch),k);}
  txt(ctx,'Skull, side view',430,30,{s:14*k,w:700});drawSkull(ctx,{g:hon?Math.round(p.glabella):2,m:hon?Math.round(p.mastoid):2,e:ap?Math.round(p.mental):2},560,178,1.05);
  if(hon){const X=(q)=>[560+q[0]*1.05,178+q[1]*1.05],geo=skullGeo({g:p.glabella,m:p.mastoid,e:p.mental});const mark=(q,l,dx,dy)=>{const [x,y]=X(q);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,9,0,TAU);ctx.stroke();txt(ctx,l,x+dx,y+dy,{s:12.5*k,w:700,a:dx<0?'right':'left',b:'middle',c:PAL['rj']});};
    mark(geo.G,'brow '+Math.round(p.glabella),14,-6);mark([-2,22+geo.ml],'mastoid '+Math.round(p.mastoid),-14,10);if(ap)mark(geo.E,'chin '+Math.round(p.mental),14,4);}
  card(ctx,430,330,354,110);const L=[{t:'Estimate: '+e.word,s:14,w:700},{t:'Pelvis: '+(hon?(e.pel?(e.pel==='F'?'female':'male')+' pattern':'in between'):(p.subpubic>=90?'wide arch, female pattern':p.subpubic<=70?'narrow arch, male pattern':'in the overlap zone')),s:13}];
  if(hon)L.push({t:'Skull: P(female) = '+e.pf.toFixed(2)+(e.conflict?' (disagrees)':''),s:13});textBlock(ctx,L,444,336,326,436,k);}

function drawAge(sim,ctx,k){const p=sim.p,hon=atLeast('honors'),phn=k>1.35,ph=roundPhase(p);
  card(ctx,16,36,248,236);txt(ctx,phn?'Plates':'Growth plates',28,60,{s:14*k,w:700});
  ctx.save();ctx.beginPath();ctx.rect(17,70,246,phn?90:86);ctx.clip();drawLongBone(ctx,44,phn?122:118,560,'femur',p.plates==='open');ctx.restore();txt(ctx,'top of the femur',40,phn?178:172,{s:12*k,c:PAL['cv-soft']});
  drawClavicle(ctx,52,phn?208:204,150,p.plates!=='fused');txt(ctx,'collarbone (inner end)',40,phn?246:236,{s:12*k,c:PAL['cv-soft']});
  if(!phn)txt(ctx,'red dashes: plate still open',28,260,{s:12*k,c:PAL['s1']});
  card(ctx,276,36,248,236);txt(ctx,(phn?'Symphysis ':'Pubic symphysis: ')+ROMAN[ph-1],288,60,{s:14*k,w:700});drawSymphysis(ctx,400,phn?170:160,96,phn?150:160,ph,k);
  card(ctx,536,36,248,236);txt(ctx,hon?(phn?'Sutures':'Skull sutures'):'Skull',548,60,{s:14*k,w:700});drawSkull(ctx,{g:2,m:2,e:2},650,phn?172:166,0.78,{sut:hon?p.sutures:null});
  // ranges chart
  const a=ageRanges(p),c={L:phn?170:200,R:770,T:300,B:420},X=v=>c.L+(clamp(v,10,90)-10)/80*(c.R-c.L);
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let v=10;v<=90;v+=10){ctx.beginPath();ctx.moveTo(X(v),c.T-6);ctx.lineTo(X(v),c.B);ctx.stroke();txt(ctx,String(v),X(v),c.B+14*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
  const rows=a.list.concat([{l:'Combined',r:[a.lo,a.hi],comb:true}]),rh=(c.B-c.T)/rows.length;
  rows.forEach((o,i)=>{const y=c.T+rh*(i+0.5);txt(ctx,phn?o.l.split(',')[0].replace('Pubic symphysis','Symphysis').replace('Growth plates','Plates').replace('Skull sutures','Sutures'):o.l.split(',')[0],c.L-10,y,{s:12.5*k,a:'right',b:'middle',w:o.comb?700:400});
    if(o.comb&&!a.ok){txt(ctx,'no overlap: recheck',X(12),y,{s:12.5*k,b:'middle',c:PAL['s1'],w:700});return;}
    ctx.fillStyle=o.comb?PAL['s3']:PAL['g-axis'];ctx.globalAlpha=o.comb?0.9:0.55;ctx.fillRect(X(o.r[0]),y-rh*0.28,Math.max(3,X(o.r[1])-X(o.r[0])),rh*0.56);ctx.globalAlpha=1;});
  if(!phn)txt(ctx,'age (years)',c.L-10,c.B+14*k,{s:12*k,a:'right',c:PAL['cv-soft']});}

function drawStature(sim,ctx,k){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),phn=k>1.35,t=stature(p),bone=t.bone,L=p[bone];
  // osteometric board, 0–60 cm
  const x0=40,x1=760,cm=(x1-x0)/60,by=110;ctx.fillStyle=PAL['cv-bench'];rr(ctx,x0-16,by-50,x1-x0+32,100,6);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=PAL['cv-ruler'];ctx.fillRect(x0,by+30,x1-x0,18);ctx.strokeStyle=PAL['cv-soft'];for(let c=0;c<=60;c++){const x=x0+c*cm;ctx.beginPath();ctx.moveTo(x,by+30);ctx.lineTo(x,by+30+(c%10===0?14:c%5===0?9:5));ctx.stroke();}
  for(let c=0;c<=60;c+=phn?20:10)txt(ctx,String(c),x0+c*cm,by+66,{s:12*k,a:'center',c:PAL['cv-ink']});
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(x0-14,by-50,14,80);const ex=x0+L*cm;ctx.fillRect(ex,by-50,14,80);
  drawLongBone(ctx,x0+2,by-12,L*cm-4,bone,false);
  ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ex,by-56);ctx.lineTo(ex,by+48);ctx.stroke();if(phn)txt(ctx,L.toFixed(1)+' cm',ex,by-58,{s:14*k,w:700,a:'center',c:PAL['rj']});else txt(ctx,L.toFixed(1)+' cm',ex+18,by-34,{s:14*k,w:700,c:PAL['rj']});
  txt(ctx,(phn?'Board: ':'Osteometric board: ')+BONE[bone].l.split(' (')[0].toLowerCase()+(phn?'':', maximum length'),24,30,{s:14*k,w:700});
  // formula card
  card(ctx,16,200,phn?470:500,240);const sx=t.sx,lines=[];
  if(t.both){lines.push({t:'Sex undetermined: use both formulas',s:13.5,w:700});t.both.forEach((o,i)=>lines.push({t:(i?'Male: ':'Female: ')+o.a+' × '+L.toFixed(1)+' + '+o.b+' = '+o.v.toFixed(1)+' cm',s:13}));}
  else{const c=TG[sx][bone];lines.push({t:(sx==='F'?'Female':'Male')+' '+BONE[bone].l.split(' (')[0].toLowerCase()+' formula',s:13.5,w:700});lines.push({t:'stature = '+c[0]+' × '+L.toFixed(1)+' + '+c[1],s:13});lines.push({t:'= '+t.v.toFixed(1)+' cm ('+inch(t.v)+')',s:14,w:700});}
  lines.push({t:'Range (±2 SE): '+t.lo.toFixed(1)+'–'+t.hi.toFixed(1)+' cm',s:13,c:PAL['cv-soft']});
  if(ap&&t.se&&!phn)lines.push({t:'Standard error '+t.se+' cm: about 95% of people fall within ±'+(2*t.se).toFixed(1)+' cm',s:12.5,c:PAL['cv-soft']});
  if(!hon)lines.push({t:'Sex from the pelvis: '+sexEst(p).word,s:12.5,c:PAL['cv-soft']});
  else{const o=Object.keys(BONE).filter(b=>b!==bone).map(b=>{const r=statureFor(p,b,sx);return BONE[b].l.split(' (')[0]+' '+r.v.toFixed(0)+' cm';});lines.push({t:'Check with the other bones: '+o.join(', '),s:12.5,c:PAL['cv-soft'],gap:2});}
  textBlock(ctx,lines,30,206,(phn?470:500)-28,436,k);
  // height scale
  const sx0=phn?510:540,sw=784-sx0,sy0=212,sy1=428,Y=v=>sy1-(v-140)/60*(sy1-sy0);card(ctx,sx0,200,sw,240);
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(sx0+70,sy0);ctx.lineTo(sx0+70,sy1);ctx.stroke();for(let v=140;v<=200;v+=10){ctx.beginPath();ctx.moveTo(sx0+64,Y(v));ctx.lineTo(sx0+70,Y(v));ctx.stroke();txt(ctx,String(v),sx0+58,Y(v),{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});}
  ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.25;ctx.fillRect(sx0+76,Y(t.hi),sw-96,Y(t.lo)-Y(t.hi));ctx.globalAlpha=1;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.strokeRect(sx0+76,Y(t.hi),sw-96,Y(t.lo)-Y(t.hi));
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx0+76,Y(t.v));ctx.lineTo(sx0+sw-20,Y(t.v));ctx.stroke();if(!phn)txt(ctx,'cm',sx0+12,sy0+2,{s:12*k,c:PAL['cv-soft']});}

function drawFace(sim,ctx,k){const p=sim.p,ap=atLeast('ap'),n=Math.round(p.markers),phn=k>1.35,T={g:2,m:2,e:2},s=1.36,ox=178,oy=240;
  const {geo,tips}=faceTips(T,p.build);const X=q=>[ox+q[0]*s,oy+q[1]*s];
  const placed=tips.slice(0,n),mid=tips.filter(o=>!o.f.lat),allMid=mid.every(o=>tips.indexOf(o)<n);
  // face profile through the midline peg tips (plus forehead and neck), drawn behind the skull lines
  const nose=(()=>{const ans=[106,22],base=[98,12];const proj=3*(ans[0]-base[0]);return {tip:[ans[0]+proj,ans[1]-11],sub:[ans[0]+7,ans[1]+3]};})();
  const prof=(sc)=>{const t=o=>[o.b[0]+o.n[0]*o.d*sc,o.b[1]+o.n[1]*o.d*sc];const m=mid.map(t);
    return [[-60,-118],[-20,-131],[20,-130],[55,-118],[80,-100],[94,-76],m[0],m[1],m[2],m[3],[nose.tip[0]-6,nose.tip[1]-6],nose.tip,[nose.tip[0]-3,nose.tip[1]+6],nose.sub,m[4],m[5],[m[5][0]-4,47],m[6],m[7],m[8],m[9],[70,104],[48,112],[36,150]];};
  drawSkull(ctx,T,ox,oy,s);
  if(allMid){ctx.save();const pts=catmull(prof(1),false);ctx.beginPath();catmull(prof(1).concat([[-20,150],[-62,116],[-86,62],[-102,10],[-104,-40],[-90,-92],[-76,-110]]),false).forEach((q,j)=>{const [x,y]=X(q);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.closePath();ctx.fillStyle='rgba(176,148,118,.55)';ctx.fill();
    if(ap&&p.spread){[1.25,0.75].forEach(sc=>{const q2=catmull(prof(sc),false);ctx.beginPath();q2.forEach((q,j)=>{const [x,y]=X(q);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=PAL['s4'];ctx.lineWidth=1.8;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);});}
    ctx.beginPath();pts.forEach((q,j)=>{const [x,y]=X(q);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.stroke();
    ctx.lineWidth=2;const [ex,ey]=X([88,-12]);ctx.beginPath();ctx.moveTo(ex-12,ey);ctx.quadraticCurveTo(ex,ey-7,ex+12,ey+1);ctx.quadraticCurveTo(ex,ey+5,ex-12,ey);ctx.stroke();
    const [ax,ay]=X([2,4]);ctx.beginPath();ctx.ellipse(ax,ay,13,24,0.15,0,TAU);ctx.stroke();ctx.restore();}
  // pegs
  placed.forEach((o,i)=>{const [bx,by]=X(o.b),[tx,ty]=X(o.t);ctx.fillStyle=PAL['s1'];ctx.strokeStyle=PAL['s1'];if(o.f.lat){ctx.beginPath();ctx.arc(bx,by,4,0,TAU);ctx.fill();ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx,by,7.5,0,TAU);ctx.stroke();return;}ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.stroke();ctx.beginPath();ctx.arc(tx,ty,3.5,0,TAU);ctx.fill();});
  if(n<NFACE){const o=tips[n],[bx,by]=X(o.b);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(bx,by,9,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  // side card
  const cx0=phn?440:470;card(ctx,cx0,36,784-cx0,404);const L=[{t:'Tissue-depth markers',s:14,w:700},{t:n+' of '+NFACE+' placed · '+p.build+' build',s:13,c:PAL['cv-soft']}];
  if(n<NFACE){const o=tips[n];L.push({t:'Next: '+o.f.n+', '+o.d.toFixed(1)+' mm',s:13,w:700,c:PAL['rj']});}
  if(n>0){const o=tips[n-1];L.push({t:'Last placed: '+o.f.n+', '+o.d.toFixed(1)+' mm',s:13});}
  L.push({t:allMid?'Profile built from the '+mid.length+' midline pegs. Nose tip set by Krogman’s rule: about 3 × the nasal spine length.':'The face outline appears when all '+mid.length+' midline pegs are placed.',s:12.5,c:PAL['cv-soft']});
  if(ap&&p.spread)L.push({t:'Dashed: tissue 25% thinner and 25% thicker. Real faces fall anywhere in that band.',s:12.5,c:PAL['s4']});
  const ly=textBlock(ctx,L,cx0+14,42,784-cx0-28,432,k);
  if(!phn){const rh=Math.min(15,(428-ly-8)/NFACE),bx=cx0+180,bw=784-bx-40;if(rh>=13){tips.forEach((o,i)=>{const y=ly+8+i*rh+rh/2,on=i<n;txt(ctx,o.f.n.replace(' (mental eminence)','').replace(' (supraorbital)','').replace(' (gonion)',''),bx-8,y,{s:12,a:'right',b:'middle',c:on?PAL['cv-ink']:PAL['cv-soft']});
    ctx.fillStyle=on?PAL['s1']:PAL['line'];ctx.fillRect(bx,y-rh*0.3,o.d/25*bw,rh*0.6);if(on)txt(ctx,o.d.toFixed(1),bx+o.d/25*bw+4,y,{s:12,b:'middle',c:PAL['cv-soft']});});}}}

AN.onLevel=sim=>{syncMode(sim);sim.infoDirty=true;};
const C0=AN.controls;
C0.find(c=>c.id==='mode').onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
C0.find(c=>c.id==='caseid').onChange=sim=>loadCase(sim,sim.p.caseid);
BioLab.register(AN);
})();

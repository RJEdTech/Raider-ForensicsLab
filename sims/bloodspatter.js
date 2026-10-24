(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const TAU=Math.PI*2,DEG=Math.PI/180,G=9.81;

/* ---------- drop physics ----------
   Falling speed with quadratic drag: v(h) = vt·√(1 − e^(−2gh/vt²)), vt = 7.65 m/s for a 50 µL drop (MacDonell).
   Spreading on a smooth surface: Pasandideh-Fard et al. (1996), D/d₀ = √((We + 12) / (3(1 − cos θa) + 4We/√Re)), θa = 90°.
   Blood: ρ = 1060 kg/m³, μ = 4.0 mPa·s, σ = 0.058 N/m. Width W ≈ D; length L = W / sin θ. */
const VT=7.65,RHO=1060,MU=0.004,SIG=0.058;
const vImpact=h=>VT*Math.sqrt(1-Math.exp(-2*G*Math.max(0,h)/(VT*VT)));
const d0mm=uL=>Math.cbrt(6*uL/Math.PI);
function weRe(v,uL){const d=d0mm(uL)/1000;return {We:RHO*v*v*d/SIG,Re:RHO*v*d/MU};}
function spread(v,uL){const {We,Re}=weRe(v,uL);return Math.sqrt((We+12)/(3+4*We/Math.sqrt(Math.max(Re,1))));}
const diam=(v,uL)=>d0mm(uL)*spread(v,uL);
const tailLen=(W,th)=>th>=80?0:W*1.05*Math.pow(1-Math.sin(th*DEG),0.8);
const half=x=>Math.round(x*2)/2;
function dropModel(p){const h=p.height/100,v=vImpact(h),vol=p.vol,W=diam(v,vol),th=p.angle,L=W/Math.sin(th*DEG),T=tailLen(W,th),wr=weRe(v,vol);
  return {h,v,vol,W,L,T,th,We:wr.We,Re:wr.Re,d0:d0mm(vol),sf:spread(v,vol),thTail:Math.asin(W/(L+T))/DEG};}
function shapeText(th){return th>=80?'Round':th>=60?'Slightly oval':th>=35?'Oval with a short tail':'Long, narrow oval with a tail';}

/* ---------- the scene: drops thrown from a source, flying on parabolas to the floor ---------- */
const FL={x:24,y:44,S:1.75,w:300,h:220};           // floor 300 cm × 220 cm, 1.75 px per cm
const fx=x=>FL.x+x*FL.S,fy=y=>FL.y+y*FL.S;
const MAG=8;                                         // stains on the floor drawn 8× life size
const SC={};
function genScene(key){if(SC[key])return SC[key];
  const r=rng(key==='one'?4127:9931);
  const srcs=key==='one'?[{x:150,y:110,z:95,n:7,id:'A'}]:[{x:88,y:76,z:58,n:5,id:'A'},{x:200,y:130,z:104,n:5,id:'B'}];
  const stains=[];
  srcs.forEach((S,si)=>{let made=0,tries=0;
    while(made<S.n&&tries<4000){tries++;
      const phi=TAU*(made+0.2+0.6*r())/S.n+si*0.5,v=3.8+3.4*r(),beta=(12+33*r())*DEG,vh=v*Math.cos(beta),w0=v*Math.sin(beta),z0=S.z/100;
      const t=(-w0+Math.sqrt(w0*w0+2*G*z0))/G,d=vh*t*100,vz=w0+G*t,th=Math.atan2(vz,vh)/DEG;
      const x=S.x+d*Math.cos(phi),y=S.y+d*Math.sin(phi);
      if(x<14||x>286||y<14||y>206||th<20||th>72||d<35)continue;
      if(stains.some(s=>Math.hypot(s.x-x,s.y-y)<24))continue;
      const vol=6+8*r(),vl=Math.hypot(vh,vz),W=diam(vl,vol),L=W/Math.sin(th*DEG),Wm=half(W),Lm=half(L),thm=Math.asin(Wm/Lm)/DEG;
      const phm=phi+(r()-0.5)*5*DEG;
      stains.push({x,y,phi,phm,th,thm,W,L,Wm,Lm,T:tailLen(W,th),g:si,dTrue:d,vl,seed:Math.floor(r()*1e6)});made++;}});
  // order stains left to right so their numbers are easy to find
  stains.sort((a,b)=>a.x-b.x);stains.forEach((s,i)=>s.n=i+1);
  const conv=srcs.map((S,si)=>{const g=stains.filter(s=>s.g===si);let a=0,b=0,c=0,bx=0,by=0;
    g.forEach(s=>{const ux=Math.cos(s.phm),uy=Math.sin(s.phm),m11=1-ux*ux,m12=-ux*uy,m22=1-uy*uy;a+=m11;b+=m12;c+=m22;bx+=m11*s.x+m12*s.y;by+=m12*s.x+m22*s.y;});
    const det=a*c-b*b,X=(c*bx-b*by)/det,Y=(a*by-b*bx)/det;
    // radius of the area: RMS distance of the string lines from the best point
    let ss=0;g.forEach(s=>{const ux=Math.cos(s.phm),uy=Math.sin(s.phm),dx=X-s.x,dy=Y-s.y;ss+=Math.pow(dx*uy-dy*ux,2);});
    g.forEach(s=>{s.dC=Math.hypot(s.x-X,s.y-Y);s.hEst=s.dC*Math.tan(s.thm*DEG);});
    const hAvg=g.reduce((q,s)=>q+s.hEst,0)/g.length;
    return {x:X,y:Y,r:Math.max(4,Math.sqrt(ss/g.length)),h:hAvg,id:S.id};});
  return SC[key]={key,srcs,stains,conv};}
const sceneOf=sim=>genScene(sim.p.scase==='two'&&atLeast('honors')?'two':'one');
const selStain=sim=>{const sc=sceneOf(sim);return sc.stains[clamp(Math.round(sim.p.stain)-1,0,sc.stains.length-1)];};

/* ---------- local UI helpers ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode)||(c.only&&!c.only(sim));});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode)||(m.only&&!m.only(sim));});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function para(ctx,s,x,y,maxW,sz,o){o=o||{};const ls=wrapLines(ctx,s,maxW,sz,o.w);ls.forEach((l,i)=>txt(ctx,l,x,y+i*sz*1.25,{s:sz,w:o.w||400,c:o.c||PAL['cv-ink'],a:o.a||'left'}));return y+ls.length*sz*1.25;}
const INK='#26262b',INK2='#55555c',PAPER='#fbfaf6',BLOOD='#a3121e',BLOOD_D='#7e0c16',STRING='#2d6bd2',CONV='#1b8a4a',GUESS='#7b3fe4',TRUE='#c27a00';
const IN_STYLE='style="width:6.5em;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)"';

/* Draw one stain. (x,y) = center of the oval body, ang = direction of travel, s = px per mm, f = growth 0–1. */
function drawStain(ctx,x,y,W,L,T,ang,s,o){o=o||{};const f=o.f===undefined?1:o.f;if(f<=0)return;const a=L/2*s*f,b=W/2*s*f,tl=T*s*f,R=rng(o.seed||7);
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.fillStyle=o.col||BLOOD;
  ctx.beginPath();const n=64,rough=o.rough;for(let i=0;i<=n;i++){const ph=i/n*TAU,m=rough?1+0.06*Math.sin(11*ph+(o.seed||0))+0.04*Math.sin(23*ph):1;const px=a*Math.cos(ph)*m,py=b*Math.sin(ph)*m;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
  if(tl>0.5){const c35=0.82,s35=0.57;ctx.beginPath();ctx.moveTo(a*c35,-b*s35);ctx.quadraticCurveTo(a+tl*0.25,-b*0.28,a+tl*0.85,-Math.max(0.6,b*0.07));ctx.quadraticCurveTo(a+tl,0,a+tl*0.85,Math.max(0.6,b*0.07));ctx.quadraticCurveTo(a+tl*0.25,b*0.28,a*c35,b*s35);ctx.closePath();ctx.fill();
    if(o.th!==undefined&&o.th<35){const rr2=Math.max(1.2,b*0.28);ctx.beginPath();ctx.ellipse(a+tl+rr2*2.6,0,rr2*1.5,rr2,0,0,TAU);ctx.fill();}}
  if(rough&&o.nsat){ctx.strokeStyle=o.col||BLOOD;ctx.lineCap='round';
    for(let i=0;i<o.nsat;i++){const ph=R()*TAU,cs=Math.cos(ph),sn=Math.sin(ph),ex=a*cs,ey=b*sn,len=(0.15+0.3*R())*b;ctx.lineWidth=Math.max(1,b*0.07);ctx.beginPath();ctx.moveTo(ex*0.95,ey*0.95);ctx.lineTo(ex+cs*len,ey+sn*len);ctx.stroke();}
    for(let i=0;i<o.nsat;i++){const ph=(R()-0.5)*(o.th<70?2.2:TAU),d=1.35+0.9*R(),rad=Math.max(1,b*(0.04+0.06*R()));ctx.beginPath();ctx.arc(Math.cos(ph)*a*d+(o.th<70?a*0.3:0),Math.sin(ph)*b*d,rad,0,TAU);ctx.fill();}}
  ctx.restore();}
function arrow(ctx,x1,y1,x2,y2,col,w){const a=Math.atan2(y2-y1,x2-x1),h=7+w;ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2-Math.cos(a)*h*0.6,y2-Math.sin(a)*h*0.6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-h*Math.cos(a-0.4),y2-h*Math.sin(a-0.4));ctx.lineTo(x2-h*Math.cos(a+0.4),y2-h*Math.sin(a+0.4));ctx.closePath();ctx.fill();}
/* ruler: zero at (x0,y0), running along angle ang, length len mm, s px/mm, ticks on the side toward +normal */
function ruler(ctx,x0,y0,ang,len,s,k,o){o=o||{};const wpx=26;ctx.save();ctx.translate(x0,y0);ctx.rotate(ang);
  ctx.fillStyle=o.clear?'rgba(255,245,170,.45)':'#f3e7b8';ctx.strokeStyle='#8a7a3c';ctx.lineWidth=1;const pre=3*s;ctx.fillRect(-pre,0,len*s+pre*2,wpx);ctx.strokeRect(-pre,0,len*s+pre*2,wpx);
  const step=s>=3?1:s>=1.5?2:5,fs=12*k;ctx.font='600 '+fs+'px '+FONT;const need=ctx.measureText('000').width+6;let lab=10;while(lab*s<need&&lab<100)lab=lab===10?20:lab===20?50:100;
  ctx.strokeStyle='#3a3420';for(let m=0;m<=len+1e-6;m+=step){const major=m%10===0,mid=m%5===0;const h=major?12:mid?8:5;ctx.lineWidth=major?1.4:1;ctx.beginPath();ctx.moveTo(m*s,0);ctx.lineTo(m*s,h);ctx.stroke();
    if(m%lab===0&&!o.nolab){ctx.save();ctx.translate(m*s,h+fs*0.95);if(o.flip)ctx.rotate(-Math.PI/2);txt(ctx,String(m),0,0,{s:fs,w:600,c:'#3a3420',a:'center',b:o.flip?'middle':'alphabetic'});ctx.restore();}}
  ctx.restore();}

/* vertical ruler: right edge at x, zero at y0, running down */
function vruler(ctx,x,y0,len,s,k){const fs=12*k;ctx.font='600 '+fs+'px '+FONT;const tw=ctx.measureText('00').width,wpx=Math.max(30,tw+20),pre=3*s;
  ctx.fillStyle='#f3e7b8';ctx.strokeStyle='#8a7a3c';ctx.lineWidth=1;ctx.fillRect(x-wpx,y0-pre,wpx,len*s+2*pre);ctx.strokeRect(x-wpx,y0-pre,wpx,len*s+2*pre);
  const step=s>=3?1:s>=1.5?2:5;let lab=5;while(lab*s<fs*1.15&&lab<100)lab=lab===5?10:lab===10?20:50;ctx.strokeStyle='#3a3420';
  for(let m=0;m<=len+1e-6;m+=step){const h=m%10===0?12:m%5===0?8:5;ctx.lineWidth=m%10===0?1.4:1;ctx.beginPath();ctx.moveTo(x,y0+m*s);ctx.lineTo(x-h,y0+m*s);ctx.stroke();
    if(m%lab===0)txt(ctx,String(m),x-14,y0+m*s,{s:fs,w:600,c:'#3a3420',a:'right',b:'middle'});}}
/* ---------- layout (drop mode) ---------- */
const LP={x:16,y:30,w:290,h:406},IP={x:180,y:356},RP={x:318,y:30,w:466,h:406};
const PAPR={x:RP.x+12,y:RP.y+40,w:RP.w-24,h:RP.h-52};
const PP={x:16,y:30,w:768,h:406};
const SR={x:562,y:30,w:226,h:406};
function stainLayout(m,k){const tot=m.L+m.T+(m.th<35?m.W*0.6:0);const s=Math.min(9,(PAPR.w-130)/tot,150/m.W);const left=PAPR.x+60+(PAPR.w-90-tot*s)/2,cx=left+m.L/2*s;const gh=m.W*s+14+30+16*k;const cy=PAPR.y+Math.max(24,(PAPR.h-30-gh)/2)+m.W/2*s;return {s,cx,cy,left};}

const BS={
  id:'bloodspatter',hash:'bloodspatter',apUnit:7,order:1,tab:'Blood spatter',kind:'Virtual lab',prereq:['crimescene'],next:['dna'],
  card:'Drop blood from different heights and angles, measure each stain with a ruler, and trace a scene’s stains back to where the blood came from.',
  title:'Blood spatter: angle, size and the area of origin',
  lede:{bio:'A drop of blood keeps a record of how it landed. A higher drop leaves a bigger stain, and a slanted hit leaves a long oval whose tail points the way the drop was going.',
        honors:'Measure the width W and length L of a stain to get its impact angle, θ = sin⁻¹(W/L). String lines drawn back along each stain’s long axis meet at the area of convergence.',
        ap:'Model the drop’s fall with air drag and its spreading with the Weber and Reynolds numbers, then estimate the area of origin height with the tangent method and test its built-in bias.'},
  scale:{bio:'Drop view: one 50 µL drop (about 4.6 mm across) and its stain, enlarged. Scene: a 3.0 m × 2.2 m floor seen from above, stains drawn 8× life size.',
         ap:'Drop view: one drop of 10–100 µL (2.7–5.8 mm across) falling 0.1–6 m; stain enlarged, ruler in mm. Scene: a 3.0 m × 2.2 m floor from above, stains drawn 8× life size.'},
  timeless:true,animated:true,chReveal:4,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'drop',lvl:'bio',noTrial:true,options:[{v:'drop',l:'Drop a drop'},{v:'pattern',l:'Pattern types'},{v:'scene',l:'Investigate a scene'}]},
    {id:'height',label:'Drop height',type:'range',min:10,max:600,step:10,def:100,unit:' cm',lvl:'bio',modes:['drop'],help:'Measured from the dropper tip to where the drop hits.'},
    {id:'angle',label:'Impact angle θ',type:'range',min:10,max:90,step:5,def:90,unit:'°',lvl:'bio',modes:['drop'],help:'Tilt the paper. 90° means the drop hits straight on.'},
    {id:'surface',label:'Surface',type:'seg',def:'smooth',lvl:'honors',modes:['drop'],options:[{v:'smooth',l:'Smooth paper'},{v:'rough',l:'Rough cardboard'}],help:'Texture changes the edge of the stain, not its basic size.'},
    {id:'guides',label:'Show the fitted oval',type:'toggle',def:false,lvl:'honors',noTrial:true,modes:['drop'],help:'Outlines the oval body you measure, without the tail.'},
    {id:'check',label:'Show the true measurements',type:'toggle',def:false,lvl:'honors',noTrial:true,modes:['drop'],help:'Measure W and L yourself first, then check.'},
    {id:'vol',label:'Drop volume',type:'range',min:10,max:100,step:5,def:50,unit:' µL',lvl:'ap',modes:['drop'],help:'A drop from a fingertip is about 50 µL.'},
    {id:'ptype',label:'Pattern',type:'select',def:'passive',lvl:'bio',noTrial:true,modes:['pattern'],options:[{v:'passive',l:'Passive drops'},{v:'trail',l:'Drip trail (moving source)'},{v:'transfer',l:'Transfer (swipe and contact)'},{v:'castoff',l:'Cast-off (swung object)'}]},
    {id:'pspeed',label:'Speed of the moving source',type:'range',min:0.5,max:4,step:0.5,def:1.5,unit:' m/s',lvl:'honors',modes:['pattern'],only:s=>s.p.ptype==='trail'||s.p.ptype==='castoff',help:'Walking is about 1.4 m/s; running is about 4 m/s.'},
    {id:'swings',label:'Number of swings',type:'range',min:1,max:3,step:1,def:1,unit:'',lvl:'honors',modes:['pattern'],only:s=>s.p.ptype==='castoff'},
    {id:'scase',label:'Scene',type:'seg',def:'one',lvl:'bio',noTrial:true,modes:['scene'],options:[{v:'one',l:'Scene 1: one event'},{v:'two',l:'Scene 2: two events',lvl:'honors'}]},
    {id:'strings',label:'Draw string lines',type:'toggle',def:false,lvl:'bio',modes:['scene'],help:'Each line runs back along a stain’s long axis, opposite its tail.'},
    {id:'stain',label:'Stain to examine',type:'select',def:1,lvl:'bio',noTrial:true,modes:['scene'],options:[1,2,3,4,5,6,7,8,9,10].map(n=>({v:n,l:'Stain '+n,lvl:n>7?'honors':undefined}))},
    {id:'gx',label:'Your source estimate: across',type:'range',min:0,max:300,step:5,def:40,unit:' cm',lvl:'bio',noTrial:true,modes:['scene'],help:'Or click the floor to place your marker.'},
    {id:'gy',label:'Your source estimate: down',type:'range',min:0,max:220,step:5,def:30,unit:' cm',lvl:'bio',noTrial:true,modes:['scene']},
    {id:'reveal',label:'Show the true source',type:'toggle',def:false,lvl:'bio',noTrial:true,modes:['scene']}
  ],
  actions:[{id:'again',label:'Drop again',lvl:'bio',primary:true,modes:['drop'],run(sim){sim.st.key='';}}],
  init(sim){return {key:'',ph:'fall',a:0,b:0,pt:0};},
  step(sim,dt){const st=sim.st,p=sim.p;st.pt+=dt;if(p.mode!=='drop')return;
    const key=[p.height,p.angle,p.vol,p.surface].join('|');if(key!==st.key){st.key=key;st.ph='fall';st.a=0;st.b=0;}
    const tf=fallTime(p);if(st.ph==='fall'){st.a+=dt;if(st.a>=tf){st.ph='spread';st.b=0;}}else if(st.ph==='spread'){st.b+=dt;if(st.b>=0.35)st.ph='done';}},
  metrics:[
    {id:'v',label:'Impact speed',unit:'m/s',lvl:'bio',min:0,max:8,d:2,modes:['drop'],get:s=>dropModel(s.p).v},
    {id:'diam',label:'Stain width W',unit:'mm',lvl:'bio',min:0,max:30,d:1,modes:['drop'],get:s=>dropModel(s.p).W},
    {id:'shape',label:'Stain shape',unit:'',lvl:'bio',text:true,modes:['drop'],get:s=>shapeText(s.p.angle)},
    {id:'len',label:'Stain length L (no tail)',unit:'mm',lvl:'honors',min:0,max:null,d:1,modes:['drop'],get:s=>s.p.check?dropModel(s.p).L:null},
    {id:'ratio',label:'W ÷ L',unit:'',lvl:'honors',min:0,max:1,d:2,modes:['drop'],get:s=>{if(!s.p.check)return null;const m=dropModel(s.p);return m.W/m.L;}},
    {id:'ang',label:'Angle sin⁻¹(W/L)',unit:'°',lvl:'honors',min:0,max:90,d:0,modes:['drop'],get:s=>{if(!s.p.check)return null;const m=dropModel(s.p);return Math.asin(m.W/m.L)/DEG;}},
    {id:'mine',label:'Your angle from your W and L',unit:'°',lvl:'honors',min:0,max:90,d:1,modes:['drop'],noTrial:true,get:s=>myAngle(s)},
    {id:'d0',label:'Drop diameter in flight d₀',unit:'mm',lvl:'ap',min:0,max:6,d:2,modes:['drop'],get:s=>dropModel(s.p).d0},
    {id:'we',label:'Weber number ρv²d₀/σ',unit:'',lvl:'ap',min:0,max:null,d:0,modes:['drop'],get:s=>dropModel(s.p).We},
    {id:'sf',label:'Spread factor D/d₀',unit:'',lvl:'ap',min:0,max:6,d:2,modes:['drop'],get:s=>dropModel(s.p).sf},
    {id:'ptell',label:'What this pattern tells you',unit:'',lvl:'bio',text:true,modes:['pattern'],noTrial:true,get:s=>PT[s.p.ptype].tells},
    {id:'pang',label:'Impact angle of these drops',unit:'°',lvl:'honors',min:0,max:90,d:0,modes:['pattern'],only:s=>s.p.ptype==='trail',get:s=>trailModel(s.p).th},
    {id:'pgap',label:'Gap between drops (2 drops/s)',unit:'cm',lvl:'honors',min:0,max:null,d:0,modes:['pattern'],only:s=>s.p.ptype==='trail',get:s=>trailModel(s.p).gap},
    {id:'nst',label:'Stains to examine',unit:'',lvl:'bio',min:0,max:12,d:0,modes:['scene'],noTrial:true,get:s=>sceneOf(s).stains.length},
    {id:'err',label:'Your estimate is off by',unit:'cm',lvl:'bio',min:0,max:null,d:0,modes:['scene'],noTrial:true,get:s=>{if(!s.p.reveal)return null;const sc=sceneOf(s);return Math.min(...sc.srcs.map(q=>Math.hypot(q.x-s.p.gx,q.y-s.p.gy)));}},
    {id:'conv',label:'Area of convergence (across, down)',unit:'',lvl:'honors',text:true,modes:['scene'],noTrial:true,get:s=>s.p.strings?sceneOf(s).conv.map(c=>(sceneOf(s).conv.length>1?c.id+': ':'')+'('+Math.round(c.x)+', '+Math.round(c.y)+') cm').join(' · '):'Draw the string lines'},
    {id:'horig',label:'Origin height, tangent method',unit:'',lvl:'ap',text:true,modes:['scene'],noTrial:true,get:s=>sceneOf(s).conv.map(c=>(sceneOf(s).conv.length>1?c.id+': ':'')+Math.round(c.h)+' cm').join(' · ')},
    {id:'truth',label:'True source',unit:'',lvl:'bio',text:true,modes:['scene'],noTrial:true,get:s=>s.p.reveal?sceneOf(s).srcs.map(q=>(sceneOf(s).srcs.length>1?q.id+': ':'')+'('+q.x+', '+q.y+') cm'+(atLeast('ap')?', '+q.z+' cm high':'')).join(' · '):'Hidden: make your estimate first'}
  ],
  graphs:[{id:'dh',label:'Stain width vs drop height',lvl:'bio',custom:true},{id:'wl',label:'W ÷ L vs impact angle',lvl:'honors',custom:true},{id:'hs',label:'Tangent-method height for each stain',lvl:'ap',custom:true}],
  defaultGraph:'dh',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='dh'){const ax=axes(ctx,box,{xmin:0,xmax:8,ymin:0,ymax:30,xl:'Drop height (m)',yl:'Stain width (mm)'});
      const vols=atLeast('ap')?[20,50,p.vol]:[50];const seen=new Set();
      vols.forEach((vol,i)=>{if(seen.has(vol))return;seen.add(vol);const col=vol===p.vol?PAL['s1']:PAL['muted'];ctx.strokeStyle=col;ctx.lineWidth=vol===p.vol?2.5:1.5;ctx.setLineDash(vol===p.vol?[]:[5,4]);ctx.beginPath();
        for(let h=0.05;h<=8.001;h+=0.05){const y=diam(vImpact(h),vol);h<0.06?ctx.moveTo(ax.X(h),ax.Y(y)):ctx.lineTo(ax.X(h),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
        if(vol!==p.vol)txt(ctx,vol+' µL',ax.X(7.9),ax.Y(diam(vImpact(8),vol))-6,{s:12,c:PAL['muted'],a:'right'});});
      const m=dropModel(p);ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(m.h),ax.Y(m.W),6,0,TAU);ctx.fill();
      const pl=diam(VT,p.vol);ctx.setLineDash([3,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(box.L,ax.Y(pl));ctx.lineTo(box.L+box.W,ax.Y(pl));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'terminal velocity limit '+pl.toFixed(1)+' mm',box.L+box.W-4,ax.Y(pl)+16,{s:12,c:PAL['muted'],a:'right'});
      txt(ctx,p.vol+' µL drop',box.L+8,box.T+14,{s:12,c:PAL['s1'],w:700});return;}
    if(id==='wl'){const ax=axes(ctx,box,{xmin:0,xmax:90,ymin:0,ymax:1,xl:'Impact angle θ (°)',yl:'W ÷ L'});ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.5;ctx.beginPath();
      for(let a=1;a<=90;a++){const y=Math.sin(a*DEG);a===1?ctx.moveTo(ax.X(a),ax.Y(y)):ctx.lineTo(ax.X(a),ax.Y(y));}ctx.stroke();
      ctx.strokeStyle=PAL['s4'];ctx.setLineDash([5,4]);ctx.beginPath();for(let a=10;a<=90;a++){const W=10,y=W/(W/Math.sin(a*DEG)+tailLen(W,a));a===10?ctx.moveTo(ax.X(a),ax.Y(y)):ctx.lineTo(ax.X(a),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(p.angle),ax.Y(Math.sin(p.angle*DEG)),6,0,TAU);ctx.fill();
      legend(ctx,box.L+10,box.T+10,[{label:'W ÷ L = sin θ',color:PAL['g-line']},{label:'if you include the tail',color:PAL['s4'],dash:true}]);return;}
    const sc=sceneOf(sim),n=sc.stains.length,ymax=Math.max(160,...sc.stains.map(s=>s.hEst))*1.1;const ax=axes(ctx,box,{xmin:0,xmax:n,ymin:0,ymax,xcats:sc.stains.map(s=>String(s.n)),yl:'height d·tan θ (cm)'});
    sc.stains.forEach((s,i)=>{const x0=ax.X(i+0.2),x1=ax.X(i+0.8);ctx.fillStyle=s.g?PAL['s5']:PAL['s2'];ctx.fillRect(x0,ax.Y(s.hEst),x1-x0,ax.Y(0)-ax.Y(s.hEst));});
    sc.srcs.forEach((q,i)=>{if(!p.reveal)return;ctx.setLineDash([5,4]);ctx.strokeStyle=i?PAL['s5']:PAL['s2'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(box.L,ax.Y(q.z));ctx.lineTo(box.L+box.W,ax.Y(q.z));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'true height '+(sc.srcs.length>1?q.id+' ':'')+q.z+' cm',box.L+box.W-4,ax.Y(q.z)-6,{s:12,c:PAL['muted'],a:'right'});});
    if(!p.reveal)txt(ctx,'Turn on “Show the true source” to compare',box.L+box.W-4,box.T+14,{s:12,c:PAL['muted'],a:'right'});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='drop'){const m=dropModel(p);
      if(!hon)return `<h3>Reading a single stain</h3><p>This drop fell ${p.height} cm and hit at ${p.angle}°. It was moving ${m.v.toFixed(1)} m/s and spread into a stain ${m.W.toFixed(1)} mm wide.</p><p class="help">A drop falls faster the higher it starts, until air drag stops it speeding up (about 7.7 m/s). A faster drop spreads wider. A slanted hit stretches the stain into an oval.</p>`;
      const uw=sim._uw,ul=sim._ul;
      return `<h3>Measure this stain</h3><p class="help">Use the clear rulers on the paper. Measure the oval body only and leave out the tail. Readings to the nearest 0.5 mm.</p>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin:6px 0 10px"><label>Width W (mm)<br><input type="number" step="0.5" min="0" id="bs-uw" ${IN_STYLE} value="${uw!=null?uw:''}"></label><label>Length L (mm)<br><input type="number" step="0.5" min="0" id="bs-ul" ${IN_STYLE} value="${ul!=null?ul:''}"></label></div>
        <p id="bs-res">${resultText(sim)}</p>${ap?`<p class="help">Spreading: We = ${Math.round(m.We)}, Re = ${Math.round(m.Re)}, D/d₀ = ${m.sf.toFixed(2)}, so D = ${m.d0.toFixed(2)} mm × ${m.sf.toFixed(2)} = ${m.W.toFixed(1)} mm.</p>`:''}`;}
    if(p.mode==='pattern'){const P=PT[p.ptype];return `<h3>${P.name}</h3><p>${lvText(P.how)}</p><p class="help">${lvText(P.read)}</p>`;}
    const sc=sceneOf(sim),two=sc.srcs.length>1;
    const head=`<tr><th>Stain</th><th>W (mm)</th>${hon?'<th>L (mm)</th><th>θ = sin⁻¹(W/L)</th>':''}${ap?'<th>d to convergence (cm)</th><th>height d·tan θ (cm)</th>':''}</tr>`;
    const rows=sc.stains.map(s=>`<tr${s.n===Math.round(p.stain)?' style="font-weight:700"':''}><td>${s.n}${two&&ap?' ('+sc.conv[s.g].id+')':''}</td><td>${s.Wm.toFixed(1)}</td>${hon?`<td>${s.Lm.toFixed(1)}</td><td>${s.thm.toFixed(0)}°</td>`:''}${ap?`<td>${Math.round(s.dC)}</td><td>${Math.round(s.hEst)}</td>`:''}</tr>`).join('');
    return `<h3>Stain worksheet: ${two?'Scene 2':'Scene 1'}</h3><div class="tbl-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div><p class="help">${hon?'Widths and lengths are ruler readings to 0.5 mm. ':''}${ap?'The tangent method treats each flight path as a straight line from the floor at angle θ.':'Each tail points the way its drop was moving, so the source is back the other way.'}</p>`;},
  bindInfo(sim,el){const w=el.querySelector('#bs-uw'),l=el.querySelector('#bs-ul'),res=el.querySelector('#bs-res');if(!w||!l)return;
    const upd=()=>{const a=parseFloat(w.value),b=parseFloat(l.value);sim._uw=Number.isFinite(a)?a:null;sim._ul=Number.isFinite(b)?b:null;if(res)res.innerHTML=resultText(sim);};
    w.addEventListener('input',upd);l.addEventListener('input',upd);},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='drop'){const m=dropModel(p);
      if(st.ph==='fall')return 'The drop falls '+p.height+' cm. <b>The farther it falls, the faster it hits</b>, up to about 7.7 m/s, where air drag balances its weight.';
      let s='';
      if(p.angle>=80)s='It hit at '+m.v.toFixed(1)+' m/s and spread into a <b>round stain '+m.W.toFixed(1)+' mm across</b>. A round stain means the drop came straight down onto the surface.';
      else s='At '+p.angle+'° the drop slides as it spreads, so the stain stretches into an oval'+(hon&&p.check?' '+m.L.toFixed(1)+' mm long':'')+'. <b>The tail points the way the drop was traveling.</b>';
      if(hon&&p.angle<80&&!p.check)s+=' Measure W and L, then θ = sin⁻¹(W/L).';
      if(hon&&p.surface==='rough')s+=' The rough cardboard breaks up the edge into <b>spines and satellite drops</b>.';
      if(ap&&p.height>=300)s+=' Above about 3 m the width barely grows: the speed is close to terminal.';
      return s;}
    if(p.mode==='pattern')return PT[p.ptype].nar(sim);
    const sc=sceneOf(sim);
    if(p.reveal){const e=Math.min(...sc.srcs.map(q=>Math.hypot(q.x-p.gx,q.y-p.gy)));return 'Your marker is <b>'+Math.round(e)+' cm</b> from the nearest true source. '+(ap?'The tangent method put the source at '+sc.conv.map(c=>Math.round(c.h)+' cm').join(' and ')+' high; the truth is '+sc.srcs.map(q=>q.z+' cm').join(' and ')+'. Real drops curve down, so the straight strings land too high.':e<20?'That is inside the area of convergence. Nice work.':'Draw the string lines and look where they cross.');}
    if(!p.strings)return 'Each stain’s tail points away from where its drop came from. <b>Look back along each oval’s long axis</b>, or turn on the string lines.';
    return sc.srcs.length>1?'The strings cross in <b>two separate places</b>, so the stains came from two events. Find both areas of convergence.':'The string lines cross in one small region: the <b>area of convergence</b>. The blood came from above that spot.';},
  tour:[
    {title:'One drop of blood',text:'A 50 µL drop (about the size from a fingertip) falls 1 m onto paper held flat. Watch it fall and spread. The side view is on the left; the top view of the paper is on the right.',focus:[LP.x,LP.y,LP.w,LP.h],speed:0.4,setup(sim){BioLab.setValues(sim,{mode:'drop',height:100,angle:90,surface:'smooth',vol:50});sim.st.key='';syncMode(sim);}},
    {title:'Higher drop, bigger stain',text:'From 3 m the drop hits faster and spreads wider. The width grows quickly at first, then levels off once the drop nears terminal velocity (about 7.7 m/s). Height alone cannot be read exactly from size.',focus:[[LP.x,LP.y,LP.w,LP.h],[RP.x,RP.y,RP.w,RP.h]],speed:0.5,setup(sim){BioLab.setValues(sim,{height:300});}},
    {title:'Tilt the surface',text:'Now the paper is tilted so the drop hits at 30°. The drop keeps sliding as it spreads, so the stain stretches into an oval with a tail.',focus:[RP.x,RP.y,RP.w,RP.h],speed:0.5,setup(sim){BioLab.setValues(sim,{height:100,angle:30});}},
    {lvl:'honors',title:'Measure W and L',text:'Fit an oval to the body of the stain. Measure its width W and its length L, leaving out the tail. Then sin θ = W ÷ L. Here W ÷ L = 0.5, so θ = 30°.',focus:[RP.x,RP.y,RP.w,RP.h],pause:true,setup(sim){BioLab.setValues(sim,{guides:true});sim.st.ph='done';}},
    {title:'The tail points forward',text:'The tail (and any small satellite stain past it) is on the side the drop was heading toward. So the source lies back the other way, opposite the tail.',focus:[RP.x,RP.y,RP.w,RP.h],pause:true,setup(sim){BioLab.setValues(sim,{angle:25});sim.st.ph='done';}},
    {title:'Patterns tell what happened',text:'Stains also form patterns. A drip trail shows a moving source, and its tails point the way it moved. Faster movement means longer stains spaced farther apart.',focus:[PP.x,PP.y,PP.w,PP.h],speed:1,setup(sim){BioLab.setValues(sim,{mode:'pattern',ptype:'trail',pspeed:1.5});syncMode(sim);}},
    {title:'Back to the source',text:'In a scene, draw a string line back along each stain’s long axis, away from its tail. Where the lines cross is the area of convergence: the source was above that spot.',focus:[FL.x,FL.y,FL.w*FL.S,FL.h*FL.S],pause:true,setup(sim){BioLab.setValues(sim,{mode:'scene',scase:'one',strings:true,reveal:false});syncMode(sim);}},
    {lvl:'ap',title:'How high was it?',text:'For each stain, height ≈ d × tan θ, where d is its distance to the area of convergence. Average the stains. Real drops fly on curved paths, so this straight-line estimate comes out too high.',focus:[SR.x,SR.y,SR.w,SR.h],pause:true,setup(sim){BioLab.setValues(sim,{stain:3,reveal:true});}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);sim.st.key='';syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);sim.st.key='';syncMode(sim);BioLab.refresh(sim);}},
  challenges(sim){const w30=diam(vImpact(0.3),50),w150=diam(vImpact(1.5),50),w300=diam(vImpact(3),50),w600=diam(vImpact(6),50),w20=diam(vImpact(1),20),w50=diam(vImpact(1),50);
    const W=10,tail=tailLen(W,30),thT=Math.asin(W/(20+tail))/DEG;const sc=genScene('one'),c=sc.conv[0];
    return [
    {lvl:'bio',q:'You drop blood from 30 cm, then from 150 cm onto the same flat paper. What happens to the stain?',choices:['It gets bigger','It stays the same size','It gets smaller'],correct:0,
     baseline:{mode:'drop',height:30,angle:90},change:{height:150},at:1.6,reveal:4.2,changeText:'Dropped from 150 cm',watch:'diam',
     explain:{bio:'From 30 cm the stain is about '+w30.toFixed(1)+' mm wide; from 150 cm it is about '+w150.toFixed(1)+' mm. A longer fall means a faster drop, and a faster drop spreads wider before it stops.'}},
    {lvl:'bio',instant:true,set:{mode:'drop',angle:30,height:100},q:'A drop hits the paper at 30°. Which way does the stain’s tail point?',choices:['Back toward where the drop came from','The way the drop was traveling','In a random direction'],correct:1,
     explain:{bio:'The model now shows a 30° drop. The blood keeps moving forward as it lands, so the tail and any small satellite stains end up on the far side. To find the source, look back the other way, opposite the tail.'}},
    {lvl:'bio',instant:true,set:{mode:'drop',angle:90,height:100},q:'A stain on a floor is almost perfectly round. What does that tell you?',choices:['The drop hit at close to 90°, straight on','The drop fell from very high','The drop was flying fast sideways'],correct:0,
     explain:{bio:'Roundness tells you the angle, not the height. A drop moving sideways hits at a slant and leaves an oval. Only a drop coming straight down (about 90°) leaves a circle. Size, not shape, depends on the height.'}},
    {lvl:'honors',instant:true,set:{mode:'drop',angle:30,height:100,guides:true,check:true},q:'A stain measures W = 10.0 mm and L = 20.0 mm. What was its impact angle?',choices:['30°','45°','60°'],correct:0,
     explain:{honors:'sin θ = W/L = 10.0/20.0 = 0.50, so θ = sin⁻¹(0.50) = 30°. A common slip is to use cos or to multiply the ratio by 90°. Note that 60° would make the stain much rounder (W/L = 0.87).'}},
    {lvl:'honors',instant:true,set:{mode:'drop',angle:30,height:100,guides:true,check:true},q:'You measure that same 30° stain but include the tail in your length. Your calculated angle comes out:',choices:['Too small','Too large','Still correct'],correct:0,
     explain:{honors:'The tail adds about '+tail.toFixed(1)+' mm, so L looks like '+(20+tail).toFixed(1)+' mm and sin⁻¹(10/'+(20+tail).toFixed(1)+') = '+thT.toFixed(0)+'°, too small. The orange dashed curve on the W ÷ L graph shows this error at every angle. Always fit the oval body and leave the tail out.'}},
    {lvl:'honors',q:'Same drop, same 150 cm height, but now onto rough cardboard instead of smooth paper. What changes?',choices:['The stain gets much bigger','The edge breaks into spines and tiny satellite stains','Nothing changes'],correct:1,
     baseline:{mode:'drop',height:150,angle:90,surface:'smooth'},change:{surface:'rough'},at:1.6,reveal:4.2,changeText:'Switched to rough cardboard',watch:'diam',
     explain:{honors:'The width stays about the same, but the rough fibers break the spreading rim into spines and throw off satellite drops. That is why analysts test drops on the same kind of surface as the scene before comparing sizes.'}},
    {lvl:'honors',q:'You raise the dropper from 3 m to 6 m. What happens to the stain’s width?',choices:['It doubles','It grows only a little','It shrinks'],correct:1,
     baseline:{mode:'drop',height:300,angle:90},change:{height:600},at:1.8,reveal:4.6,changeText:'Raised to 6 m',watch:'diam',
     explain:{honors:'From 3 m the stain is about '+w300.toFixed(1)+' mm; from 6 m about '+w600.toFixed(1)+' mm. By 3 m the drop is already near terminal velocity (7.7 m/s), so extra height adds little speed. The graph shows the curve flattening.'}},
    {lvl:'honors',q:'A moving source drips blood, then starts to move faster. What happens to the trail?',choices:['Longer stains, farther apart, tails pointing the way it moved','Rounder stains closer together','No change'],correct:0,
     baseline:{mode:'pattern',ptype:'trail',pspeed:1},change:{pspeed:3.5},at:1.5,reveal:4,changeText:'Moving at 3.5 m/s',watch:'pang',
     explain:{honors:'Each drop keeps the source’s forward speed as it falls. Faster sideways motion makes a smaller impact angle (here from about '+trailModel({pspeed:1}).th.toFixed(0)+'° to '+trailModel({pspeed:3.5}).th.toFixed(0)+'°), so the stains stretch, and at 2 drops per second they land farther apart.'}},
    {lvl:'ap',instant:true,q:'A stain hit at 40° and lies 120 cm from the area of convergence. What height does the tangent method give for the source?',choices:['About 77 cm','About 101 cm','About 143 cm'],correct:1,
     explain:{ap:'h = d × tan θ = 120 cm × tan 40° = 120 × 0.839 = 101 cm. 77 cm comes from using sin, and 143 cm from dividing by tan θ.'}},
    {lvl:'ap',instant:true,set:{mode:'scene',scase:'one',strings:true,reveal:true,stain:3},q:'Compare the tangent-method height with the true source height in Scene 1. What does the model show?',choices:['The tangent method gives a height that is too high','It gives a height that is too low','It is exact'],correct:0,
     explain:{ap:'The tangent method gives '+Math.round(c.h)+' cm, but the source was '+sc.srcs[0].z+' cm high. Gravity bends each path downward, so the drop lands steeper than the straight line from the source, and d × tan θ overshoots. Analysts report the result as an upper limit, or use trajectory software that includes gravity and drag.'}},
    {lvl:'ap',q:'At a fixed 1 m height you switch from a 50 µL drop to a 20 µL drop. What happens to the stain’s width?',choices:['It gets smaller, so width alone cannot tell you the height','It stays the same: width depends only on height','It gets bigger'],correct:0,
     baseline:{mode:'drop',height:100,angle:90,vol:50},change:{vol:20},at:1.6,reveal:4.2,changeText:'Switched to a 20 µL drop',watch:'diam',
     explain:{ap:'At 1 m the 50 µL drop leaves about '+w50.toFixed(1)+' mm and the 20 µL drop about '+w20.toFixed(1)+' mm. Width depends on both speed and drop size (D = d₀ × spread factor), so in casework drop height is only estimated with test drops of matching volume.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> How does drop height change the size of a bloodstain?</p><ol><li>Keep the angle at 90°. Drop from 20, 50, 100, 150, 200, 300, 400 and 600 cm.</li><li>After each drop, press Record trial.</li><li>Use the Trials graph: plot stain width (y) against drop height (x).</li></ol><p>Describe the shape of your graph. Why does the stain stop growing much after about 3 m?</p><p class="help">In the real lab you use simulated blood, never real blood. Wear gloves and goggles.</p>',
       honors:'<p><b>Question:</b> Can you find a drop’s impact angle from its stain?</p><ol><li>Set the height to 100 cm and the angle to a value a partner picks without telling you.</li><li>Measure W and L with the on-screen rulers (leave out the tail) and type them in the box.</li><li>Compute θ = sin⁻¹(W/L), then turn on “Show the true measurements” and record both angles.</li><li>Repeat for 5 angles from 15° to 90°.</li></ol><p>Which angles were hardest to measure accurately, and why? Then switch to Investigate a scene and find the area of convergence.</p><p class="help">Real lab: simulated blood, gloves and goggles, and tilt the target board with a protractor.</p>',
       ap:'<p><b>Question:</b> How accurate is the tangent method for the area of origin?</p><ol><li>Open Scene 1 and draw the string lines. Record the area of convergence.</li><li>For each stain, record W, L, θ and d (worksheet), and compute d × tan θ.</li><li>Average the heights, then reveal the true source height and find your percent error.</li><li>Repeat with Scene 2 (two events).</li></ol><p><b>Claim–evidence–reasoning:</b> Is the tangent-method height an overestimate or an underestimate? Use the physics of a falling drop to explain why, and say how an analyst should report the result.</p>'},
  terms:[{t:'Bloodstain pattern analysis (BPA)',d:'Reading the size, shape and placement of bloodstains to work out what happened.'},{t:'Passive drop',d:'A drop that falls under gravity alone, such as from a dripping wound or object.'},{t:'Impact angle',d:'The angle between the drop’s path and the surface it hits. 90° is straight on.'},{t:'Tail',d:'The narrow end of an oval stain. It points in the direction the drop was traveling.'},{t:'Area of convergence',d:'The region on a surface where lines drawn back along several stains cross.'},
    {lvl:'honors',t:'Width and length',d:'W and L of the best-fitting oval for the stain body, measured without the tail.'},{lvl:'honors',t:'sin θ = W ÷ L',d:'The relationship that gives the impact angle from a stain’s shape.'},{lvl:'honors',t:'Satellite stain',d:'A small stain thrown off the main drop as it lands, more common on rough surfaces.'},{lvl:'honors',t:'Cast-off',d:'A line of stains flung from a moving object. Each separate line means at least one swing.'},{lvl:'honors',t:'Transfer stain',d:'A stain made when a bloody object touches a surface; a swipe feathers out in the direction of motion.'},
    {lvl:'ap',t:'Area of origin',d:'The 3D region the blood came from: the area of convergence plus a height.'},{lvl:'ap',t:'Tangent method',d:'Height ≈ d × tan θ for each stain, using its distance d to the area of convergence. Assumes straight-line flight.'},{lvl:'ap',t:'Terminal velocity',d:'The top falling speed, where air drag balances weight: about 7.65 m/s for a 50 µL drop.'},{lvl:'ap',t:'Weber number',d:'We = ρv²d₀/σ, the ratio of the drop’s momentum to its surface tension. Bigger We means more spreading.'}],
  about:'<p><b>Falling.</b> The drop’s speed after falling h is v = v<sub>t</sub>√(1 − e<sup>−2gh/v<sub>t</sub>²</sup>), the result for quadratic air drag, with v<sub>t</sub> = 7.65 m/s, the classic terminal velocity for a 50 µL drop (MacDonell). The same terminal speed is used for every volume, which is a simplification.</p><p><b>Spreading.</b> The stain width is the maximum spread diameter from Pasandideh-Fard et al. (1996): D/d₀ = √[(We + 12) / (3(1 − cos θ<sub>a</sub>) + 4We/√Re)], with a 90° contact angle and blood’s density 1060 kg/m³, viscosity 4.0 mPa·s and surface tension 0.058 N/m. It gives widths of about 14 mm from 10 cm to 22 mm near terminal speed for a 50 µL drop, in line with published test drops on paper. Width is taken as the same at every angle and length as L = W / sin θ, which is the standard analysis; real widths shrink slightly at low angles. Tails, spines and satellites are drawn from simple rules, not computed.</p><p><b>Scene.</b> Drops leave the source at 3.5–6.5 m/s, aimed 25–60° downward, and fly on parabolas (gravity only, no drag) to the floor. Their stains, impact angles and ruler readings (to 0.5 mm) come from those flights; each stain’s direction carries a few degrees of reading error. The area of convergence is the least-squares point closest to all string lines. Because real paths curve, the tangent method overestimates the height, as the literature reports.</p><p><b>Patterns.</b> Pattern types are schematic sketches, not computed. All cases and scenes are fictional. Real analysis follows the SWGSTAIN / ASB standards and is done on test patterns with the same surface and blood.</p>',
  initVis(sim){},
  onClick(sim,x,y){if(sim.p.mode!=='scene')return;if(x<FL.x||x>FL.x+FL.w*FL.S||y<FL.y||y>FL.y+FL.h*FL.S)return;
    BioLab.setValues(sim,{gx:clamp(Math.round((x-FL.x)/FL.S/5)*5,0,300),gy:clamp(Math.round((y-FL.y)/FL.S/5)*5,0,220)});},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const key=BioLab.level+sim.p.mode+sim.p.ptype;if(sim._sk!==key){sim._sk=key;syncMode(sim);}
    if(sim.p.mode==='pattern')drawPattern(sim,ctx,k,t);else if(sim.p.mode==='scene')drawScene(sim,ctx,k,t);else drawDrop(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.angle=35;sim.p.height=150;},thumbFrames:70
};
function fallTime(p){return 0.45+0.12*Math.sqrt(p.height/10);}
function myAngle(s){const w=s._uw,l=s._ul;if(!(w>0&&l>0)||w>l)return null;return Math.asin(w/l)/DEG;}
function resultText(sim){const w=sim._uw,l=sim._ul,m=dropModel(sim.p);
  if(!(w>0)||!(l>0))return 'Type your W and L to compute the angle.';
  if(w>l)return 'W cannot be larger than L. Check which is which.';
  const a=Math.asin(w/l)/DEG;let s=`sin θ = W ÷ L = ${w} ÷ ${l} = ${(w/l).toFixed(3)}, so <b>θ = ${a.toFixed(1)}°</b>.`;
  if(sim.p.check){const tr=Math.asin(m.W/m.L)/DEG,e=a-tr;s+=` True angle: ${tr.toFixed(1)}°. ${Math.abs(e)<=3?'Within 3°: a good measurement.':e<0?'Too small. Did you include the tail in L?':'Too large. Check your length reading.'}`;}
  return s;}
/* ---------- pattern types ---------- */
function trailModel(p){const vz=vImpact(0.9),vx=p.pspeed,th=Math.atan2(vz,vx)/DEG;return {vz,vx,th,gap:vx/2*100};}
const PT={
  passive:{name:'Passive drops',tells:'Blood dripped under gravity alone: round drops on a flat surface',how:{bio:'Drops that fall straight down onto a flat surface leave round stains. Their size grows with the fall height until terminal velocity. Blood dripping into blood that is already there splashes into a drip pattern with many small satellite stains.'},
    read:{bio:'A drip pattern shows that the source stayed in one place for a while.',honors:'Passive stains alone cannot give an exact height: size also depends on drop volume and surface. Analysts compare them with test drops.'},nar:()=>'Passive drops fall under <b>gravity alone</b>. On a flat floor they leave round stains; blood dripping into a pool throws out <b>satellite stains</b>.'},
  trail:{name:'Drip trail',tells:'A moving source: the tails point the way it moved',how:{bio:'A bleeding source that is moving drips a trail. Each drop keeps the forward speed of the source, so it hits at a slant. The tails point the way the source was moving.'},read:{bio:'Faster movement means longer, narrower stains spaced farther apart.',honors:'Impact angle = tan⁻¹(falling speed ÷ forward speed). Gap = forward speed ÷ drip rate.'},
    nar:sim=>{const m=trailModel(sim.p);return 'The source moves at '+sim.p.pspeed.toFixed(1)+' m/s and drips about twice a second. Each drop keeps that forward speed, so it lands at about '+m.th.toFixed(0)+'°. <b>The tails point the way the source moved.</b>';}},
  transfer:{name:'Transfer stains',tells:'Contact with a bloody object: shape and direction of the contact',how:{bio:'A transfer stain forms when something with blood on it touches a surface. A swipe (a bloody object sliding along) thins out and feathers at the end where the motion stopped. A pressed object can leave its own pattern.'},read:{bio:'Feathering shows the direction of motion. A pattern transfer can be compared with the object that made it.',honors:'A wipe is different: a clean object moving through a wet stain that was already there.'},
    nar:()=>'A swipe starts dense and <b>feathers out the way the object moved</b>. A pressed pattern copies the object’s surface, like a print.'},
  castoff:{name:'Cast-off',tells:'Blood flung off a moving object: each line is at least one swing',how:{bio:'When an object with blood on it is swung, drops fly off its tip and land in a line or arc on a wall or ceiling. The stains stretch along the line, with tails pointing in the direction of the swing.'},read:{bio:'Count the separate lines: each is at least one swing.',honors:'Faster swings throw drops at shallower angles, so the stains are longer. Stains get smaller along the line as less blood is left.'},
    nar:sim=>'Drops leave the tip of a swung object and hit the wall moving sideways, so they stretch <b>along the swing direction</b>. '+(sim.p.swings>1?'There are '+sim.p.swings+' lines: at least '+sim.p.swings+' swings.':'One line means at least one swing.')}
};

/* ---------- drawing: drop mode ---------- */
function panel(ctx,b,title,k,sub){ctx.fillStyle=PAL['card'];rr(ctx,b.x,b.y,b.w,b.h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,title,b.x+12,b.y+20*Math.min(k,1.3)+2,{s:14*k,w:700,c:PAL['cv-ink']});if(sub&&k<1.35)txt(ctx,sub,b.x+b.w-12,b.y+22,{s:12*k,c:PAL['cv-soft'],a:'right'});}
function drawDrop(sim,ctx,k,t){const p=sim.p,st=sim.st,m=dropModel(p),hon=atLeast('honors');
  panel(ctx,LP,'Side view',k);
  const beta=(90-p.angle)*DEG,ux=Math.cos(beta),uy=Math.sin(beta),nx=uy,ny=-ux;
  const ytop=IP.y-(40+212*Math.sqrt(p.height/600));
  // stand and board
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(LP.x+10,424,LP.w-20,8);
  ctx.strokeStyle=PAL['cv-lamp'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(IP.x+uy*10,IP.y+8);ctx.lineTo(IP.x,424);ctx.stroke();
  const up=130,dn=Math.min(80,(420-IP.y)/Math.max(uy,0.01));
  ctx.lineCap='butt';ctx.strokeStyle='#b98b52';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(IP.x-ux*up-nx*6,IP.y-uy*up-ny*6);ctx.lineTo(IP.x+ux*dn-nx*6,IP.y+uy*dn-ny*6);ctx.stroke();
  ctx.strokeStyle=PAPER;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(IP.x-ux*up,IP.y-uy*up);ctx.lineTo(IP.x+ux*dn,IP.y+uy*dn);ctx.stroke();
  // dropper
  const dx=IP.x;ctx.fillStyle=PAL['cv-lamp'];rr(ctx,dx-9,ytop-62,18,20,7);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.fillStyle='rgba(160,200,215,.25)';
  ctx.beginPath();ctx.moveTo(dx-5,ytop-44);ctx.lineTo(dx+5,ytop-44);ctx.lineTo(dx+5,ytop-14);ctx.lineTo(dx+1.5,ytop-4);ctx.lineTo(dx-1.5,ytop-4);ctx.lineTo(dx-5,ytop-14);ctx.closePath();ctx.fill();ctx.stroke();
  // height arrow
  const hx=IP.x-96;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(hx-6,ytop-4);ctx.lineTo(dx-8,ytop-4);ctx.moveTo(hx-6,IP.y);ctx.lineTo(IP.x-20,IP.y);ctx.stroke();ctx.setLineDash([]);
  arrow(ctx,hx,(ytop+IP.y)/2,hx,ytop-2,PAL['cv-soft'],1.5);arrow(ctx,hx,(ytop+IP.y)/2,hx,IP.y-2,PAL['cv-soft'],1.5);
  const hl=p.height>=100?(p.height/100).toFixed(p.height%100?1:0)+' m':p.height+' cm';ctx.fillStyle=PAL['card'];ctx.font='700 '+13*k+'px '+FONT;const hw=ctx.measureText(hl).width;ctx.fillRect(hx-hw/2-3,(ytop+IP.y)/2-9*k,hw+6,18*k);
  txt(ctx,hl,hx,(ytop+IP.y)/2,{s:13*k,w:700,a:'center',b:'middle'});
  // angle arc
  ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(IP.x,IP.y,44,beta-Math.PI,-Math.PI/2);ctx.stroke();
  txt(ctx,'θ = '+p.angle+'°',IP.x+10,IP.y-36,{s:13*k,w:700,c:PAL['s4']});
  // falling drop or splash
  if(st.ph==='fall'){const tf=fallTime(p),f=clamp(st.a/tf,0,1),y=lerp(ytop+2,IP.y-5,f*f);ctx.fillStyle=BLOOD;ctx.beginPath();ctx.ellipse(dx,y,4.2,5.2,0,0,TAU);ctx.fill();}
  else{const f=st.ph==='spread'?clamp(st.b/0.35,0,1):1,len=Math.min(40,m.W*0.9+m.T*0.4)*f;ctx.strokeStyle=BLOOD;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(IP.x-ux*len*0.25,IP.y-uy*len*0.25);ctx.lineTo(IP.x+ux*len,IP.y+uy*len);ctx.stroke();ctx.lineCap='butt';}
  if(p.angle<85)arrow(ctx,IP.x+ux*30+nx*20,IP.y+uy*30+ny*20,IP.x+ux*70+nx*20,IP.y+uy*70+ny*20,PAL['cv-soft'],2);
  // top view
  panel(ctx,RP,'Top view of the paper',k,'enlarged · ruler in mm');
  ctx.fillStyle=PAPER;rr(ctx,PAPR.x,PAPR.y,PAPR.w,PAPR.h,4);ctx.fill();ctx.strokeStyle='#d9d6cc';ctx.lineWidth=1;ctx.stroke();
  const L=stainLayout(m,k),f=st.ph==='fall'?0:st.ph==='spread'?1-Math.pow(1-clamp(st.b/0.35,0,1),3):1;
  const nsat=p.surface==='rough'?Math.round(clamp((m.v-1)*2.6,2,18)):0;
  drawStain(ctx,L.cx,L.cy,m.W,m.L,m.T,0,L.s,{f,rough:p.surface==='rough',nsat:f>=1?nsat:0,seed:p.height+p.angle,th:m.th});
  // rulers: length ruler under the stain, width ruler (clear) across the middle
  const ry=L.cy+m.W/2*L.s+14;ruler(ctx,L.cx-m.L/2*L.s,ry,0,Math.ceil(m.L+m.T+6),L.s,k);
  vruler(ctx,L.left-14,L.cy-m.W/2*L.s,Math.ceil(m.W+3),L.s,k);ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle=INK2;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L.left-14,L.cy-m.W/2*L.s);ctx.lineTo(L.cx,L.cy-m.W/2*L.s);ctx.moveTo(L.left-14,L.cy+m.W/2*L.s);ctx.lineTo(L.cx,L.cy+m.W/2*L.s);ctx.stroke();ctx.restore();
  if(p.guides&&hon&&f>=1){ctx.save();ctx.setLineDash([6,4]);ctx.strokeStyle=STRING;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(L.cx,L.cy,m.L/2*L.s,m.W/2*L.s,0,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.moveTo(L.cx-m.L/2*L.s,L.cy);ctx.lineTo(L.cx+m.L/2*L.s,L.cy);ctx.stroke();ctx.restore();
        if(m.T>1)txt(ctx,'tail: not measured',L.cx+m.L/2*L.s+m.T*L.s*0.3,L.cy-m.W/2*L.s-10,{s:12*k,c:INK2,a:'center'});}
  // direction note and readout strip
  const by=PAPR.y+PAPR.h-14;
  if(p.angle<85){arrow(ctx,PAPR.x+18,by-4,PAPR.x+58,by-4,INK2,2);txt(ctx,'direction of travel',PAPR.x+66,by,{s:12*k,c:INK2});}
  else txt(ctx,'Straight on: no tail',PAPR.x+16,by,{s:12*k,c:INK2});
  if(hon&&k<1.35)txt(ctx,'Measure the oval body, not the tail',PAPR.x+PAPR.w-14,by,{s:12*k,c:INK2,a:'right'});}

/* ---------- drawing: pattern types ---------- */
function drawPattern(sim,ctx,k,t){const p=sim.p,P=PT[p.ptype];panel(ctx,PP,P.name,k);
  const A={x:PP.x+12,y:PP.y+38,w:PP.w-24,h:PP.h-50};ctx.fillStyle=PAPER;rr(ctx,A.x,A.y,A.w,A.h,4);ctx.fill();ctx.strokeStyle='#d9d6cc';ctx.lineWidth=1;ctx.stroke();
  const tt=RM?2:t;
  if(p.ptype==='passive'){const s=3,hs=[[0.2,'20 cm'],[1,'1 m'],[3,'3 m']];
    hs.forEach((h,i)=>{const x=A.x+80+i*120,y=A.y+150,W=diam(vImpact(h[0]),50);drawStain(ctx,x,y,W,W,0,0,s,{});txt(ctx,'from '+h[1],x,y+W*s/2+24,{s:13*k,w:700,c:INK,a:'center'});txt(ctx,W.toFixed(0)+' mm',x,y+W*s/2+24+16*k,{s:12*k,c:INK2,a:'center'});});
    txt(ctx,'Single drops, 90° (3× life size)',A.x+200,A.y+30,{s:13*k,w:700,c:INK,a:'center'});
    const cx=A.x+A.w-170,cy=A.y+175,R=rng(5);ctx.fillStyle=BLOOD;ctx.beginPath();for(let i=0;i<=40;i++){const ph=i/40*TAU,r=46*(1+0.12*Math.sin(5*ph)+0.07*Math.sin(13*ph));i?ctx.lineTo(cx+r*Math.cos(ph),cy+r*0.9*Math.sin(ph)):ctx.moveTo(cx+r*Math.cos(ph),cy+r*0.9*Math.sin(ph));}ctx.fill();
    for(let i=0;i<46;i++){const ph=R()*TAU,d=58+R()*80,rad=1.2+R()*3.2;ctx.beginPath();ctx.ellipse(cx+d*Math.cos(ph),cy+d*0.9*Math.sin(ph),rad*1.5,rad,ph,0,TAU);ctx.fill();}
    const ph=(tt%1.2)/1.2,y=A.y+20+ph*(cy-A.y-50);if(ph<0.95){ctx.beginPath();ctx.ellipse(cx,y,4,5,0,0,TAU);ctx.fill();}
    txt(ctx,'Drip pattern: blood into blood',cx,A.y+30,{s:13*k,w:700,c:INK,a:'center'});txt(ctx,'satellite stains all around',cx,cy+150,{s:12*k,c:INK2,a:'center'});return;}
  if(p.ptype==='trail'){const m=trailModel(p),pxm=170,gap=m.gap/100*pxm,y=A.y+A.h/2+10,s=1.6,W=diam(Math.hypot(m.vx,m.vz),50),L=W/Math.sin(m.th*DEG);
    for(let x=A.x+40;x<A.x+A.w-50;x+=gap)drawStain(ctx,x,y+Math.sin(x*0.05)*4,W,L,tailLen(W,m.th),0,s,{seed:Math.round(x),th:m.th});
    const sx=A.x+40+((tt*p.pspeed*pxm*0.35)%(A.w-90));ctx.strokeStyle=INK2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,y-62,12,0,TAU);ctx.stroke();arrow(ctx,sx+16,y-62,sx+52,y-62,INK2,2);
    txt(ctx,'moving source',sx,y-84,{s:12*k,c:INK2,a:'center'});
    txt(ctx,'Top view of the floor (stains about 9× life size)',A.x+14,A.y+24,{s:13*k,w:700,c:INK});
    txt(ctx,'Drops land at '+m.th.toFixed(0)+'°, '+m.gap.toFixed(0)+' cm apart',A.x+14,A.y+A.h-16,{s:13*k,c:INK2});return;}
  if(p.ptype==='transfer'){const x0=A.x+50,x1=A.x+A.w-60,y=A.y+110,R=rng(3);
    txt(ctx,'Swipe: a bloody object slid along the wall',A.x+14,A.y+24,{s:13*k,w:700,c:INK});
    for(let i=0;i<26;i++){const yy=y-26+i*2,len=(x1-x0)*(0.55+0.45*Math.pow(R(),0.6));ctx.strokeStyle=BLOOD;ctx.lineWidth=2.4;ctx.globalAlpha=1;
      const g=ctx.createLinearGradient(x0,0,x0+len,0);g.addColorStop(0,'rgba(163,18,30,.95)');g.addColorStop(0.6,'rgba(163,18,30,.7)');g.addColorStop(1,'rgba(163,18,30,0)');ctx.strokeStyle=g;ctx.beginPath();ctx.moveTo(x0+R()*10,yy);ctx.lineTo(x0+len,yy+(R()-0.5)*3);ctx.stroke();}
    const ox=x0+((tt*80)%(x1-x0));ctx.strokeStyle=INK2;ctx.lineWidth=2;ctx.setLineDash([5,4]);rr(ctx,ox-18,y-34,36,68,8);ctx.stroke();ctx.setLineDash([]);
    arrow(ctx,x1-160,y+50,x1-40,y+50,INK2,2);txt(ctx,'feathered end = direction of motion',x1-40,y+76,{s:12*k,c:INK2,a:'right'});
    const gx=A.x+60,gy=A.y+250;txt(ctx,'Pattern transfer: a textured object pressed on paper',A.x+14,gy-14,{s:13*k,w:700,c:INK});
    for(let i=0;i<9;i++)for(let j=0;j<5;j++){if(R()<0.12)continue;ctx.fillStyle=BLOOD;ctx.globalAlpha=0.55+0.4*R();ctx.fillRect(gx+i*22,gy+j*18,15,11);}ctx.globalAlpha=1;
    txt(ctx,'The pattern can be compared with the object',gx+215,gy+48,{s:12*k,c:INK2});return;}
  // cast-off
  const n=p.swings,vs=p.pspeed;txt(ctx,'Wall above a moving object (stains about 3× life size)',A.x+14,A.y+24,{s:13*k,w:700,c:INK});
  for(let sIdx=0;sIdx<n;sIdx++){const off=sIdx*60-((n-1)*30),R=rng(11+sIdx);
    for(let i=0;i<12;i++){const f=i/11,x=A.x+90+f*(A.w-200),y=A.y+180+off-Math.sin(f*Math.PI)*70+(sIdx?f*20:0);const ang=Math.atan2(-Math.cos(f*Math.PI)*70*Math.PI/(A.w-200),1);
      const th=clamp(70-vs*9-f*20,12,80),W=6.5-f*3.5+R()*0.8,L=W/Math.sin(th*DEG);drawStain(ctx,x,y,W,L,tailLen(W,th),ang,3,{seed:i+sIdx*20,th});}}
  arrow(ctx,A.x+A.w-200,A.y+A.h-30,A.x+A.w-90,A.y+A.h-30,INK2,2);txt(ctx,'swing direction',A.x+A.w-212,A.y+A.h-25,{s:12*k,c:INK2,a:'right'});
  txt(ctx,n+(n>1?' lines: at least '+n+' swings':' line: at least 1 swing'),A.x+14,A.y+A.h-25,{s:13*k,w:700,c:INK});}

/* ---------- drawing: scene ---------- */
function drawScene(sim,ctx,k,t){const p=sim.p,sc=sceneOf(sim),hon=atLeast('honors'),ap=atLeast('ap'),W=FL.w*FL.S,H=FL.h*FL.S,sel=selStain(sim);
  txt(ctx,'Floor, top view: 3.0 m × 2.2 m',FL.x,FL.y-14,{s:13*k,w:700});
  ctx.fillStyle=PAPER;ctx.fillRect(FL.x,FL.y,W,H);ctx.strokeStyle='#e4e1d8';ctx.lineWidth=1;
  for(let x=50;x<300;x+=50){ctx.beginPath();ctx.moveTo(fx(x)+.5,FL.y);ctx.lineTo(fx(x)+.5,FL.y+H);ctx.stroke();}for(let y=50;y<220;y+=50){ctx.beginPath();ctx.moveTo(FL.x,fy(y)+.5);ctx.lineTo(FL.x+W,fy(y)+.5);ctx.stroke();}
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.strokeRect(FL.x,FL.y,W,H);
  if(k<1.35){for(let x=50;x<300;x+=50)txt(ctx,String(x),fx(x),FL.y+H-6,{s:12,c:'#8a877e',a:'center'});for(let y=50;y<220;y+=50)txt(ctx,String(y),FL.x+5,fy(y)+4,{s:12,c:'#8a877e'});}
  // strings
  if(p.strings){ctx.save();ctx.beginPath();ctx.rect(FL.x,FL.y,W,H);ctx.clip();ctx.lineWidth=1.6;
    sc.stains.forEach(s=>{ctx.strokeStyle=STRING;ctx.globalAlpha=0.8;ctx.beginPath();ctx.moveTo(fx(s.x),fy(s.y));ctx.lineTo(fx(s.x)-Math.cos(s.phm)*560,fy(s.y)-Math.sin(s.phm)*560);ctx.stroke();});ctx.globalAlpha=1;
    if(hon)sc.conv.forEach(c=>{ctx.setLineDash([4,3]);ctx.strokeStyle=CONV;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(fx(c.x),fy(c.y),Math.max(9,c.r*FL.S*1.6),0,TAU);ctx.stroke();ctx.setLineDash([]);});ctx.restore();}
  // stains
  const s1=MAG*FL.S/10;
  sc.stains.forEach(s=>{const cx=fx(s.x)-Math.cos(s.phi)*s.T*s1*0.4,cy=fy(s.y)-Math.sin(s.phi)*s.T*s1*0.4;drawStain(ctx,cx,cy,s.W,s.L,s.T,s.phi,s1,{seed:s.seed,th:s.th});
    const lx=fx(s.x)-Math.cos(s.phi)*(s.L*s1/2+16),ly=fy(s.y)-Math.sin(s.phi)*(s.L*s1/2+16);
    if(s===sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(fx(s.x),fy(s.y),s.L*s1/2+s.T*s1*0.3+8,0,TAU);ctx.stroke();}
    ctx.fillStyle='rgba(251,250,246,.85)';ctx.beginPath();ctx.arc(lx,ly,8*k,0,TAU);ctx.fill();txt(ctx,String(s.n),lx,ly+1,{s:12*k,w:700,c:INK,a:'center',b:'middle'});});
  // guess and truth
  const gx=fx(p.gx),gy=fy(p.gy);ctx.strokeStyle=GUESS;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(gx,gy,10,0,TAU);ctx.moveTo(gx-16,gy);ctx.lineTo(gx+16,gy);ctx.moveTo(gx,gy-16);ctx.lineTo(gx,gy+16);ctx.stroke();
  if(k<1.35)txt(ctx,'your estimate',gx+14,gy-12,{s:12,w:700,c:GUESS});
  if(p.reveal)sc.srcs.forEach(q=>{const x=fx(q.x),y=fy(q.y);ctx.fillStyle=TRUE;ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?5:12,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));}ctx.closePath();ctx.fill();
    txt(ctx,'source'+(sc.srcs.length>1?' '+q.id:'')+(ap?' · '+q.z+' cm up':''),x+14,y+18,{s:12*k,w:700,c:'#8a5600'});});
  // side panel: selected stain
  panel(ctx,SR,'Stain '+sel.n,k);const Z={x:SR.x+10,y:SR.y+34,w:SR.w-20,h:150};ctx.fillStyle=PAPER;rr(ctx,Z.x,Z.y,Z.w,Z.h,4);ctx.fill();
  const zs=Math.min((Z.w-40)/(sel.L+sel.T+2),80/sel.W,8),zcx=Z.x+18+sel.L/2*zs,zcy=Z.y+48;
  drawStain(ctx,zcx,zcy,sel.W,sel.L,sel.T,0,zs,{seed:sel.seed,th:sel.th});ruler(ctx,zcx-sel.L/2*zs,zcy+sel.W/2*zs+8,0,Math.ceil(sel.L+sel.T+3),zs,k);
  let ty=Z.y+Z.h+22*Math.min(k,1.3);const lines=[];
  lines.push('Width W = '+sel.Wm.toFixed(1)+' mm');if(hon){lines.push('Length L = '+sel.Lm.toFixed(1)+' mm');lines.push('θ = sin⁻¹(W/L) = '+sel.thm.toFixed(0)+'°');}else lines.push('The tail points away from the source.');
  lines.forEach(l=>{txt(ctx,l,SR.x+12,ty,{s:13*k,c:PAL['cv-ink']});ty+=18*k;});
  if(ap){const top=ty+4,bot=SR.y+SR.h-34,bx=SR.x+20,bw=SR.w-40,dC=sel.dC,hE=sel.hEst,sx=Math.min(bw/Math.max(dC,1),(bot-top-14)/Math.max(hE,1));
    const x0=bx+bw,x1=x0-dC*sx,yb=bot,yt=bot-hE*sx;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,yb);ctx.lineTo(x0,yb);ctx.stroke();
    ctx.strokeStyle=STRING;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,yb);ctx.lineTo(x1,yt);ctx.stroke();ctx.setLineDash([4,3]);ctx.strokeStyle=CONV;ctx.beginPath();ctx.moveTo(x1,yb);ctx.lineTo(x1,yt);ctx.stroke();ctx.setLineDash([]);
    if(p.reveal){const q=sc.srcs[sel.g],yq=bot-q.z*sx;ctx.fillStyle=TRUE;ctx.beginPath();ctx.arc(x1,yq,5,0,TAU);ctx.fill();}
    txt(ctx,'d = '+Math.round(dC)+' cm',(x0+x1)/2,yb+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});txt(ctx,'h = '+Math.round(hE)+' cm',x1+6,Math.max(top+12,(yb+yt)/2),{s:12*k,w:700,c:PAL['cv-ink']});}
}
BS.onLevel=syncMode;BS.controls[0].onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
BS.controls.find(c=>c.id==='ptype').onChange=sim=>syncMode(sim);
BS.controls.find(c=>c.id==='scase').onChange=sim=>{const n=sceneOf(sim).stains.length;if(sim.p.stain>n)BioLab.setValues(sim,{stain:1});};
BioLab.register(BS);
})();

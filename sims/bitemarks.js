(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText}=BioLab.h;
const TAU=Math.PI*2;

/* ---------- teeth: Universal numbering ----------
   Universal (ADA) system: 1 = upper right third molar, around the upper arch to 16 = upper left third molar,
   then 17 = lower left third molar around to 32 = lower right third molar. Everything is drawn as if you face the biter,
   so the biter's right side is on your left. Mesiodistal crown widths are average adult values (Wheeler's Dental Anatomy). */
const TYPE=['','central incisor','lateral incisor','canine','first premolar','second premolar','first molar','second molar','third molar'];
const quadOf=n=>n<=8?'upper right':n<=16?'upper left':n<=24?'lower left':'lower right';
const posOf=n=>n<=8?9-n:n<=16?n-8:n<=24?25-n:n-24;
const tname=n=>quadOf(n)+' '+TYPE[posOf(n)];
const fdi=n=>n<=8?'1'+(9-n):n<=16?'2'+(n-8):n<=24?'3'+(25-n):'4'+(n-24);
const MD_UP=[0,8.5,6.5,7.5,7,6.5,10,9,8.5],MD_LO=[0,5,5.5,7,7,7,11,10.5,10];
const mdOf=n=>(n<=16?MD_UP:MD_LO)[posOf(n)];
const UP=[6,7,8,9,10,11],LO=[22,23,24,25,26,27],FRONT=UP.concat(LO);
const SUS=['A','B','C','D'];
const PEXP={U:2.0,V:1.25,square:3.4},SHAPEN={U:'U-shaped (rounded)',V:'V-shaped (pointed)',square:'square (flat front)'};
const S=7,CX=300,CY=232,HG=19.5;          // 7 px per mm; bite center on the stage; front of each arch 19.5 mm from the center
const gss=r=>randn(r);
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

/* ---------- a dentition: arch shape, intercanine distance, front tooth widths and distinctive features ---------- */
function baseDent(){const d={shape:'U',icdU:34.6,icdL:26.0,w:{},gapU:0,gapL:0,rot:{},chip:{},missing:{},out:{},feats:[]};FRONT.forEach(n=>d.w[n]=mdOf(n));return d;}
const lcU=d=>d.w[8]+d.w[7]+d.w[6]/2,lcL=d=>d.w[25]+d.w[26]+d.w[27]/2;
function fitICD(d){d.icdU=clamp(d.icdU,29.5,2*lcU(d)*0.965);d.icdL=clamp(d.icdL,22,2*lcL(d)*0.965);}
function genDent(r){const x=r();const d=baseDent();d.shape=x<0.5?'U':x<0.78?'square':'V';
  [[8,9],[7,10],[6,11],[25,24],[26,23],[27,22]].forEach(([a,b])=>{const m=mdOf(a)+0.35*gss(r);d.w[a]=+(m+0.1*gss(r)).toFixed(2);d.w[b]=+(m+0.1*gss(r)).toFixed(2);});
  d.icdU=34.4+1.7*gss(r);d.icdL=d.icdU*0.755+0.6*gss(r);fitICD(d);addFeats(d,r,r()<0.55?1:2);return d;}
function clone(d){return JSON.parse(JSON.stringify(d));}
function addFeat(d,f){if(f.t==='rot')d.rot[f.n]=f.a;if(f.t==='chip')d.chip[f.n]={side:f.side,size:f.size};if(f.t==='missing')d.missing[f.n]=true;if(f.t==='out')d.out[f.n]=f.mm;
  if(f.t==='gap'){if(f.arch==='U')d.gapU=f.mm;else d.gapL=f.mm;}d.feats.push(f);}
function addFeats(d,r,nf,avoid){const used={};let tries=0;
  while(d.feats.length<nf&&tries<60){tries++;const k=r();let f;
    if(k<0.28)f={t:'rot',n:[8,9,7,10,24,25,23,26][Math.floor(r()*8)],a:Math.round((16+14*r())*(r()<0.5?-1:1))};
    else if(k<0.48)f={t:'chip',n:[8,9,7,10][Math.floor(r()*4)],side:r()<0.5?-1:1,size:+(1.1+0.5*r()).toFixed(2)};
    else if(k<0.66)f=r()<0.7?{t:'gap',arch:'U',mm:+(1.3+1.3*r()).toFixed(2)}:{t:'gap',arch:'L',mm:+(1.0+0.8*r()).toFixed(2)};
    else if(k<0.82)f={t:'missing',n:[7,10,23,26][Math.floor(r()*4)]};
    else f={t:'out',n:[7,10,26,23,24,25][Math.floor(r()*6)],mm:+(1.1+0.5*r()).toFixed(2)};
    const key=f.t==='gap'?'gap'+f.arch:'n'+f.n;if(used[key]||used['t'+f.t])continue;
    if(avoid&&avoid.some(a=>a.t===f.t&&(a.n===f.n||(f.t==='gap'&&a.arch===f.arch))))continue;
    used[key]=1;used['t'+f.t]=1;addFeat(d,f);}}
function featText(f){return f.t==='rot'?'tooth '+f.n+' rotated':f.t==='chip'?'tooth '+f.n+' chipped':f.t==='missing'?'tooth '+f.n+' missing':f.t==='out'?'tooth '+f.n+' set back out of line':f.arch==='U'?'gap between 8 and 9':'gap between 24 and 25';}
const featsText=d=>d.feats.length?d.feats.map(featText).join('; '):'none';

/* ---------- arch geometry: teeth placed edge to edge along y = D (x/20)^p; D is solved so the canine tips sit at the intercanine distance ---------- */
function curvePts(D,p){const xs=[],ys=[],ss=[];let s=0,px=0,py=0;for(let i=0;i<=560;i++){const x=i*0.05,y=D*Math.pow(x/20,p);if(i)s+=Math.hypot(x-px,y-py);xs.push(x);ys.push(y);ss.push(s);px=x;py=y;}return {xs,ys,ss};}
function atArc(C,L){let lo=0,hi=C.ss.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(C.ss[m]<L)lo=m;else hi=m;}const f=clamp((L-C.ss[lo])/((C.ss[hi]-C.ss[lo])||1),0,1);
  return [lerp(C.xs[lo],C.xs[hi],f),lerp(C.ys[lo],C.ys[hi],f),Math.atan2(C.ys[hi]-C.ys[lo],C.xs[hi]-C.xs[lo])];}
function layoutArch(d,arch){const seq=arch==='U'?[[8,7,6],[9,10,11]]:[[25,26,27],[24,23,22]],gap=arch==='U'?d.gapU:d.gapL,icd=arch==='U'?d.icdU:d.icdL,p=PEXP[d.shape];
  const Lc=s=>gap/2+d.w[s[0]]+d.w[s[1]]+d.w[s[2]]/2,La=(Lc(seq[0])+Lc(seq[1]))/2;let lo=0,hi=40;
  for(let it=0;it<26;it++){const D=(lo+hi)/2,x=atArc(curvePts(D,p),La)[0];if(x>icd/2)lo=D;else hi=D;}
  const C=curvePts((lo+hi)/2,p),out=[];
  seq.forEach((side,si)=>{const sg=si?1:-1;let s=gap/2;side.forEach(n=>{const w=d.w[n],c=atArc(C,s+w/2);s+=w;
    let a=si?c[2]:Math.PI-c[2];const nx=si?-Math.sin(c[2]):Math.sin(c[2]),ny=Math.cos(c[2]);let x=c[0]*sg,y=c[1];
    if(d.out[n]){x+=nx*d.out[n];y+=ny*d.out[n];}if(d.rot[n])a+=d.rot[n]*Math.PI/180;
    const ux=Math.cos(a),uy=Math.sin(a);let p1=[x-ux*w/2,y-uy*w/2],p2=[x+ux*w/2,y+uy*w/2];
    const ch=d.chip[n];if(ch){const e=ch.side>0?p2:p1,o=ch.side>0?p1:p2,L2=w-ch.size;e[0]=o[0]+(e[0]-o[0])*L2/w;e[1]=o[1]+(e[1]-o[1])*L2/w;}
    out.push({n,x,y,p1,p2,kind:posOf(n)===3?'can':'inc',missing:!!d.missing[n],chip:!!ch});});});
  return out;}
/* surfaces: how the material and the photograph change the mark (frame coordinates in mm, origin at the bite center) */
const SURF={foam:{l:'Styrofoam',spread:0.05},apple:{l:'Apple',spread:0.15},cheese:{l:'Cheese',spread:0.45},skin:{l:'Skin',spread:0.3}};
function warp(surf,o){o=o||{};
  if(surf==='apple'){const R=38,k=o.k||1;return (x,y)=>[R*Math.sin(x/R)*k,y*0.99];}
  if(surf==='cheese'){const k=o.k||1.035;return (x,y)=>[x*k,y*1.02];}
  if(surf==='skin'){const mv=o.moved,R=34;return (x,y)=>{const sx=mv?0.88:1,sy=mv?1.06:1,X=R*Math.sin(x*sx/R);return [X+(mv?0.05*y:0),y*sy];};}
  return (x,y)=>[x,y];}
function marksOf(d,surf,o){o=o||{};const f=warp(surf,o),sp=SURF[surf].spread+(surf==='skin'?0.025*(o.hours||0):0)+(o.spread||0),res={surf,spread:sp,U:[],L:[]};
  ['U','L'].forEach(arch=>{layoutArch(d,arch).forEach(t=>{const fr=(x,y)=>arch==='U'?[x,-HG+y]:[x,HG-y];
    const P1=f(...fr(...t.p1)),P2=f(...fr(...t.p2)),C=f(...fr(t.x,t.y));const L0=Math.hypot(P2[0]-P1[0],P2[1]-P1[1]);
    const ux=(P2[0]-P1[0])/L0,uy=(P2[1]-P1[1])/L0,e=sp/2;
    res[arch].push({n:t.n,c:C,p1:[P1[0]-ux*e,P1[1]-uy*e],p2:[P2[0]+ux*e,P2[1]+uy*e],len:t.missing?0:L0+sp,a:Math.atan2(uy,ux),kind:t.kind,missing:t.missing,chip:t.chip,
      th:(t.kind==='can'?2.1:arch==='U'?1.3:1.1)+sp});});});
  const cU=[6,11].map(n=>res.U.find(t=>t.n===n).c),cL=[27,22].map(n=>res.L.find(t=>t.n===n).c);
  res.icdU=Math.hypot(cU[1][0]-cU[0][0],cU[1][1]-cU[0][1]);res.icdL=Math.hypot(cL[1][0]-cL[0][0],cL[1][1]-cL[0][1]);return res;}
const tooth=(M,n)=>M.U.find(t=>t.n===n)||M.L.find(t=>t.n===n);
function truthOf(M,feat){if(feat==='icdU')return M.icdU;if(feat==='icdL')return M.icdL;const t=tooth(M,+feat.slice(1));return t?t.len:NaN;}
function featEnds(M,feat){if(feat==='icdU'){const a=tooth(M,6).c,b=tooth(M,11).c;return [a,b,'U',true];}if(feat==='icdL'){const a=tooth(M,27).c,b=tooth(M,22).c;return [a,b,'L',true];}
  const n=+feat.slice(1),t=tooth(M,n);return [t.p1,t.p2,n<=16?'U':'L',false,t];}

/* ---------- overlay fit: how many of the 12 front teeth on a suspect's acetate line up with the evidence ---------- */
function moved(t,tx,ty,ca,sa){const m=p=>[p[0]*ca-p[1]*sa+tx,p[0]*sa+p[1]*ca+ty];return {c:m(t.c),len:t.len,a:t.a+Math.atan2(sa,ca),missing:t.missing};}
function lineUp(E,O){if(E.missing||O.missing)return E.missing===O.missing;let d=Math.abs(E.a-O.a)%Math.PI;d=Math.min(d,Math.PI-d);
  return Math.hypot(E.c[0]-O.c[0],E.c[1]-O.c[1])<0.9&&Math.abs(E.len-O.len)<1.0&&d<0.25;}
function fitAt(Ev,Su,tx,ty,rot){const ca=Math.cos(rot),sa=Math.sin(rot);let n=0,dsum=0;const list=[];
  FRONT.forEach(k=>{const e=tooth(Ev,k),o=moved(tooth(Su,k),tx,ty,ca,sa);const ok=lineUp(e,o);if(ok)n++;list.push([k,ok]);if(!e.missing&&!o.missing)dsum+=Math.hypot(e.c[0]-o.c[0],e.c[1]-o.c[1]);});return {n,dsum,list};}
function bestFit(Ev,Su){let best=null;for(let tx=-2;tx<=2.001;tx+=0.5)for(let ty=-2;ty<=2.001;ty+=0.5)for(let r=-4;r<=4;r+=2){const f=fitAt(Ev,Su,tx,ty,r*Math.PI/180);
  if(!best||f.n>best.n||(f.n===best.n&&f.dsum<best.dsum)){best=f;best.tx=tx;best.ty=ty;best.rot=r*Math.PI/180;}}return best;}

/* ---------- a case: one evidence bite and four suspects' styrofoam impressions ---------- */
function newCase(seed,o){o=o||{};const r=rng(seed>>>0||1);const food=o.food||(r()<0.5?'apple':'cheese');const close=o.close!==undefined?o.close:r()<0.6;
  const src=genDent(r),list=[src];let near=null;
  if(close){near=clone(src);FRONT.forEach(n=>near.w[n]=+(near.w[n]+0.22*gss(r)).toFixed(2));near.icdU=src.icdU+(r()<0.5?-1:1)*(0.25+0.35*r());near.icdL=src.icdL+0.3*gss(r);fitICD(near);
    near.feats=[];near.rot={};near.chip={};near.missing={};near.out={};near.gapU=0;near.gapL=0;const f0=clone(src.feats[0]);if(f0.t==='rot')f0.a+=Math.round(4*gss(r));if(f0.mm)f0.mm=+(f0.mm+0.2*gss(r)).toFixed(2);addFeat(near,f0);list.push(near);}
  let tries=0;while(list.length<4&&tries<200){tries++;const d=genDent(r);if(Math.abs(d.icdU-src.icdU)<2.2&&d.shape===src.shape)continue;if(d.feats.some(f=>src.feats.some(g=>g.t===f.t&&g.n===f.n)))continue;list.push(d);}
  if(o.missingDecoy&&!list.slice(1).some(d=>d.feats.some(f=>f.t==='missing'))){const d=list[list.length-1];if(!src.missing[10]){d.feats=d.feats.filter(f=>f.t!=='missing');d.missing={};addFeat(d,{t:'missing',n:10});}}
  const order=list.map((d,i)=>i);for(let i=3;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const C={seed,food,close,sus:order.map(i=>list[i]),src:order.indexOf(0),near:close?order.indexOf(1):-1};
  C.ev=marksOf(src,food,{k:food==='apple'?1+0.008*gss(r):1.03+0.01*r()});C.imp=C.sus.map(d=>marksOf(d,'foam'));C.fit=C.imp.map(M=>bestFit(C.ev,M));return C;}
let FCASE=null;function fullCase(sim){const s=sim._seed||(sim._seed=20261103);if(!FCASE||FCASE.seed!==s)FCASE=newCase(s,{food:'apple',close:true,missingDecoy:true});return FCASE;}
let VCASE=null;function vCase(V){if(!VCASE||VCASE.seed!==V.seed)VCASE=newCase(V.seed);return VCASE;}
const isLab=sim=>!!(sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='bitemark-compare');
const subjM=(C,s)=>s==='E'?C.ev:C.imp[SUS.indexOf(s)];
/* the caliper: the true length plus a small, seeded placement error (each student's bench is different) */
function caliper(V,C,s,feat){const r=rng(hash(V.seed+'|'+s+'|'+feat));return Math.round((truthOf(subjM(C,s),feat)+0.1*gss(r))*100)/100;}
function repRead(V,C,i){const r=rng(hash(V.seed+'|rep|'+i));return Math.round((C.ev.icdU+0.26*gss(r))*100)/100;}

/* ---------- drawing helpers ---------- */
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBlock(ctx,lines,x,y,maxW,maxY,k){let ly=y;for(const L of lines){const sz=(L.s||13)*k;const ws=wrapLines(ctx,L.t,maxW,sz,L.w);for(const w of ws){if(ly+sz>maxY)return ly;ly+=sz*1.25;txt(ctx,w,x,ly-sz*0.25,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink']});}ly+=(L.gap||3)*k;}return ly;}
const T=p=>[CX+p[0]*S,CY+p[1]*S];
const MCOL={foam:'#8f959c',apple:'#9a6b2e',cheese:'#a66f12',skin:'#7f2f4c'};
function markPath(ctx,t,grow){const a=T(t.p1),b=T(t.p2),dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,h=(t.th*S)/2+(grow||0);
  ctx.beginPath();if(t.kind==='can'){const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(cx-uy*h*2,cy+ux*h*2,b[0],b[1]);ctx.quadraticCurveTo(cx+uy*h*2,cy-ux*h*2,a[0],a[1]);ctx.closePath();return;}
  const r=Math.min(h,L/2);ctx.moveTo(a[0]-uy*h+ux*r,a[1]+ux*h+uy*r);ctx.lineTo(b[0]-uy*h-ux*r,b[1]+ux*h-uy*r);ctx.quadraticCurveTo(b[0]-uy*h,b[1]+ux*h,b[0],b[1]);
  ctx.quadraticCurveTo(b[0]+uy*h,b[1]-ux*h,b[0]+uy*h-ux*r,b[1]-ux*h-uy*r);ctx.lineTo(a[0]+uy*h+ux*r,a[1]-ux*h+uy*r);ctx.quadraticCurveTo(a[0]+uy*h,a[1]-ux*h,a[0],a[1]);ctx.quadraticCurveTo(a[0]-uy*h,a[1]+ux*h,a[0]-uy*h+ux*r,a[1]+ux*h+uy*r);ctx.closePath();}
function drawSurface(ctx,M,surf){const all=M.U.concat(M.L);
  if(surf==='foam'){[[-1,60,200],[1,262,402]].forEach(([s,y0,y1])=>{ctx.fillStyle='rgba(0,0,0,.16)';rr(ctx,128,y0+5,350,y1-y0,10);ctx.fill();ctx.fillStyle='#f3f3ee';rr(ctx,124,y0,350,y1-y0,10);ctx.fill();ctx.strokeStyle='#c9c9c0';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='rgba(160,160,150,.25)';for(let i=0;i<70;i++){const x=134+((i*53)%330),y=y0+8+((i*29)%(y1-y0-16));ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();}});return;}
  if(surf==='apple'){ctx.fillStyle='#b8262f';ctx.beginPath();ctx.ellipse(CX,CY,250,200,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(CX-130,CY-110,60,34,-0.6,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,220,120,.25)';for(let i=0;i<40;i++){const a=i*2.4,rad=60+((i*37)%170);ctx.beginPath();ctx.arc(CX+Math.cos(a)*rad*1.1,CY+Math.sin(a)*rad*0.9,1.6,0,TAU);ctx.fill();}}
  else if(surf==='cheese'){ctx.fillStyle='#e9b93c';rr(ctx,64,34,476,400,16);ctx.fill();ctx.strokeStyle='#c99a24';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='rgba(170,120,20,.35)';
    [[100,70,14],[500,90,18],[90,380,20],[480,400,12],[520,250,10],[80,230,9]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();});}
  else{ctx.fillStyle='#d49a76';rr(ctx,40,34,520,402,30);ctx.fill();ctx.strokeStyle='rgba(120,60,40,.25)';ctx.lineWidth=1;for(let i=0;i<14;i++){ctx.beginPath();ctx.moveTo(60,50+i*28);ctx.quadraticCurveTo(300,40+i*28+12,540,52+i*28);ctx.stroke();}}
  // the bitten area inside the ring of marks
  const up=M.U.slice().sort((a,b)=>a.c[0]-b.c[0]),lo=M.L.slice().sort((a,b)=>b.c[0]-a.c[0]);
  if(surf==='skin'){ctx.fillStyle='rgba(150,60,80,.18)';}else ctx.fillStyle=surf==='apple'?'#f1e3bd':'#f6d77a';
  ctx.beginPath();up.forEach((t,i)=>{const p=T([t.c[0],t.c[1]-t.th*0.6]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});
  const ur=T(up[up.length-1].c),lr=T(lo[0].c);ctx.quadraticCurveTo(Math.max(ur[0],lr[0])+34,(ur[1]+lr[1])/2,lr[0],lr[1]);lo.forEach(t=>{const p=T([t.c[0],t.c[1]+t.th*0.6]);ctx.lineTo(p[0],p[1]);});
  const ll=T(lo[lo.length-1].c),ul=T(up[0].c);ctx.quadraticCurveTo(Math.min(ll[0],ul[0])-34,(ll[1]+ul[1])/2,ul[0],ul[1]);ctx.closePath();ctx.fill();
  if(surf==='skin'){ctx.strokeStyle='rgba(130,50,80,.25)';ctx.lineWidth=10;ctx.stroke();}}
function drawMarks(ctx,M,surf,o){o=o||{};const col=MCOL[surf],blur=surf==='cheese'?1.2:surf==='skin'?1+(o.hours||0)/18:0;
  M.U.concat(M.L).forEach(t=>{if(t.missing)return;ctx.save();if(blur&&!RM)ctx.filter='blur('+blur.toFixed(1)+'px)';ctx.fillStyle=col;markPath(ctx,t);ctx.fill();
    ctx.strokeStyle=surf==='foam'?'#5f646a':'rgba(40,20,10,.55)';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();});}
function drawOutline(ctx,M,col,o){o=o||{};ctx.save();if(o.tf){ctx.translate(CX,CY);ctx.translate(o.tf.tx*S,o.tf.ty*S);ctx.rotate(o.tf.rot);ctx.translate(-CX,-CY);}
  ctx.strokeStyle=col;ctx.lineWidth=o.lw||2;if(o.dash)ctx.setLineDash(o.dash);M.U.concat(M.L).forEach(t=>{if(t.missing)return;markPath(ctx,t,o.grow||0);ctx.stroke();});ctx.restore();}
function foamTags(ctx,k){txt(ctx,'Upper arch',128,50,{s:12.5*k,w:700,c:PAL['cv-soft']});txt(ctx,'Lower arch',128,254,{s:12.5*k,w:700,c:PAL['cv-soft']});}
function sideTags(ctx,k){pill(ctx,'R',104,CY,PAL['card'],PAL['cv-ink'],12*k);pill(ctx,'L',496,CY,PAL['card'],PAL['cv-ink'],12*k);}
function panel(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
const PX=568,PW=222;

/* caliper (digital) or millimeter ruler laid along a measurement */
function measureGeom(M,feat){const [a,b,arch,icd]=featEnds(M,feat);const A=T(a),B=T(b),dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
  let nx=-uy,ny=ux;const out=icd?(arch==='U'?1:-1):(arch==='U'?-1:1);if(ny*out<0){nx=-nx;ny=-ny;}return {A,B,ux,uy,nx,ny,L};}
function drawCaliper(ctx,M,feat,k){const g=measureGeom(M,feat),off=24,{A,B,ux,uy,nx,ny}=g;const bx0=A[0]-ux*26+nx*off,by0=A[1]-uy*26+ny*off,bx1=B[0]+ux*60+nx*off,by1=B[1]+uy*60+ny*off;
  ctx.save();ctx.lineCap='round';ctx.strokeStyle='#59626c';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(bx0,by0);ctx.lineTo(bx1,by1);ctx.stroke();ctx.strokeStyle='#aeb6bf';ctx.lineWidth=5;ctx.stroke();
  ctx.strokeStyle='#3c434a';ctx.lineWidth=3;[A,B].forEach(P=>{ctx.beginPath();ctx.moveTo(P[0]+nx*(off+4),P[1]+ny*(off+4));ctx.lineTo(P[0]+nx*2,P[1]+ny*2);ctx.stroke();});
  ctx.fillStyle='#2f3740';ctx.save();ctx.translate(B[0]+ux*34+nx*off,B[1]+uy*34+ny*off);ctx.rotate(Math.atan2(uy,ux));rr(ctx,-20,-9,40,18,4);ctx.fill();ctx.fillStyle='#b9d48c';rr(ctx,-15,-5,30,10,2);ctx.fill();ctx.restore();
  [A,B].forEach(P=>{ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(P[0],P[1],2.6,0,TAU);ctx.fill();});ctx.restore();}
function drawRuler(ctx,M,feat,k,zs){zs=zs||1;const g=measureGeom(M,feat),{A,B,ux,uy,nx,ny,L}=g,len=L/S+5,flip=(nx*-uy+ny*ux)<0?-1:1;
  ctx.save();ctx.translate(A[0],A[1]);ctx.rotate(Math.atan2(uy,ux));ctx.scale(1,flip);
  ctx.fillStyle='rgba(250,248,232,.92)';ctx.fillRect(-2*S,0,(len+2)*S,30);ctx.strokeStyle='#6b6450';ctx.lineWidth=1/zs;ctx.strokeRect(-2*S,0,(len+2)*S,30);
  ctx.strokeStyle='#1d1d1d';for(let m=-2;m<=len;m++){const x=m*S,h=m%10===0?14:m%5===0?10:6;ctx.lineWidth=(m%5===0?1.4:1)/zs;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  ctx.restore();const step=zs>1?(k>1.35?2:1):(k>1.35?10:5),Lm=L/S;
  for(let m=0;m<=len;m+=step){if(zs>1&&Math.abs(m-Lm)>2.6)continue;const x=A[0]+ux*m*S+nx*21,y=A[1]+uy*m*S+ny*21;txt(ctx,String(m),x,y,{s:zs>1?12.5*k/zs:11*k,w:700,a:'center',b:'middle',c:'#1d1d1d'});}
  [A,B].forEach(P=>{ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(P[0],P[1],2.4/zs+0.6,0,TAU);ctx.fill();});}
function lcd(ctx,x,y,w,val,k,label){ctx.fillStyle='#2f3740';rr(ctx,x,y,w,58*Math.min(k,1.4),8);ctx.fill();ctx.fillStyle='#b9d48c';rr(ctx,x+8,y+8,w-16,42*Math.min(k,1.4),5);ctx.fill();
  txt(ctx,val,x+w-16,y+8+21*Math.min(k,1.4),{s:24*Math.min(k,1.5),w:700,a:'right',b:'middle',c:'#1b2a10'});if(label)txt(ctx,label,x,y-8,{s:12.5*k,w:700});}

/* ---------- show only what the current Full lab task uses ---------- */
function vis(sim,c){if(c.vlab)return null;if(!atLeast(c.lvl||'bio'))return false;if(c.modes&&!c.modes.includes(sim.p.mode))return false;if(c.show&&!c.show(sim))return false;return true;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec||sim.mode==='vlab')return;const d=sim.def;
  d.controls.forEach(c=>{const v=vis(sim,c);if(v===null)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!v;});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(sim,m);});
  d.actions.forEach(a=>{if(a.vlab)return;const b=sim.ui.actB&&sim.ui.actB[a.id];if(b)b.hidden=!vis(sim,a);});}
function syncLight(sim){const key=BioLab.level+sim.p.mode+sim.p.surface+sim.mode;if(sim._sk!==key){sim._sk=key;syncMode(sim);}}

/* the Full lab bite: a base set of teeth with the chosen arch shape and one feature */
function fullDent(p){const d=baseDent();d.shape=atLeast('honors')?p.shape:'U';const f={rot:{t:'rot',n:9,a:24},chip:{t:'chip',n:8,side:-1,size:1.4},gap:{t:'gap',arch:'U',mm:2.2},missing:{t:'missing',n:10},out:{t:'out',n:7,mm:1.4}}[p.feature];if(f)addFeat(d,f);fitICD(d);return d;}
function fullMarks(sim){const p=sim.p,d=fullDent(p),key=JSON.stringify([p.shape,p.feature,p.surface,p.posture,p.hours,BioLab.level]);
  if(sim._fk!==key){sim._fk=key;sim._fm={d,teeth:marksOf(d,'foam',{spread:-0.05}),mark:marksOf(d,p.surface,{moved:atLeast('honors')&&p.posture==='moved',hours:atLeast('ap')?p.hours:0})};}return sim._fm;}

/* ---------- the definition ---------- */
const BM={
  id:'bitemarks',hash:'bitemarks',apUnit:8,order:4,tab:'Bite marks',kind:'Virtual lab',prereq:['fingerprints'],next:['dna','anthropology'],
  card:'Number the teeth, measure bite marks in styrofoam, apple, cheese and skin, and test how far a bite-mark comparison can really go.',
  title:'Bite marks and forensic odontology',
  lede:{bio:'Your front teeth leave a pattern when you bite. Measure that pattern, see how food and skin bend it out of shape, and find out why courts no longer trust bite marks to name a person.',
        honors:'Use the Universal numbering system, intercanine distance, tooth widths and distinctive features (rotation, chips, gaps, missing teeth) to compare a bite with suspects, and weigh what the comparison can and cannot show.',
        ap:'Model the distortion of a mark on a curved or stretchy surface, put numbers on how common a dental pattern is, and read the scientific reviews (NAS 2009, PCAST 2016, NIST 2023) that found bite-mark identification lacks a valid foundation.'},
  scale:{bio:'The front six teeth of each jaw, about 4 cm across. Drawn at about 7 px per mm.',ap:'The front six teeth of each jaw: upper intercanine distance about 31–38 mm, lower about 23–28 mm. Drawn at 7 px per mm; the caliper reads to 0.01 mm.'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'bite',lvl:'bio',noTrial:true,options:[{v:'arch',l:'Teeth and their numbers'},{v:'bite',l:'Make a bite mark'},{v:'compare',l:'Compare with suspects'}]},
    {id:'tooth',label:'Tooth number',type:'range',min:1,max:32,step:1,def:8,lvl:'bio',modes:['arch'],help:'Universal system: 1 to 16 around the upper jaw from the right back molar, then 17 to 32 around the lower jaw from the left back molar.'},
    {id:'system',label:'Numbering system',type:'seg',def:'uni',lvl:'ap',modes:['arch'],options:[{v:'uni',l:'Universal (US)'},{v:'fdi',l:'FDI (international)'}]},
    {id:'surface',label:'Bitten surface',type:'seg',def:'foam',lvl:'bio',modes:['bite'],options:[{v:'foam',l:'Styrofoam'},{v:'apple',l:'Apple'},{v:'cheese',l:'Cheese'},{v:'skin',l:'Skin'}]},
    {id:'feature',label:'Distinctive feature',type:'select',def:'none',lvl:'bio',modes:['bite'],options:[{v:'none',l:'None'},{v:'rot',l:'Rotated tooth (9)'},{v:'chip',l:'Chipped tooth (8)'},{v:'gap',l:'Gap between 8 and 9'},{v:'missing',l:'Missing tooth (10)'},{v:'out',l:'Tooth set back (7)'}]},
    {id:'shape',label:'Arch shape',type:'seg',def:'U',lvl:'honors',modes:['bite'],options:[{v:'U',l:'U (rounded)'},{v:'V',l:'V (pointed)'},{v:'square',l:'Square'}]},
    {id:'posture',label:'Skin when photographed',type:'seg',def:'same',lvl:'honors',modes:['bite'],show:s=>s.p.surface==='skin',options:[{v:'same',l:'Arm as it was bitten'},{v:'moved',l:'Arm moved since'}],help:'Skin stretches. A bite made on a bent arm looks different when the arm is straight.'},
    {id:'hours',label:'Time since the bite',type:'range',min:0,max:72,step:6,def:0,unit:' h',lvl:'ap',modes:['bite'],show:s=>s.p.surface==='skin',help:'Bruising spreads and the edges blur over the first days.'},
    {id:'truth',label:'Show the real tooth edges',type:'toggle',def:true,lvl:'bio',modes:['bite'],noTrial:true},
    {id:'suspect',label:'Suspect',type:'seg',def:0,lvl:'bio',modes:['compare'],noTrial:true,options:SUS.map((l,i)=>({v:i,l:'Suspect '+l}))},
    // virtual lab bench only
    {id:'bmView',label:'Look at',type:'seg',def:'evidence',vlab:true,noTrial:true,options:[{v:'evidence',l:'Evidence bite'},{v:'suspect',l:'Suspect impression'},{v:'overlay',l:'Acetate overlay'}],onChange(s){s._ovk=null;}},
    {id:'bmSus',label:'Suspect',type:'seg',def:'A',vlab:true,noTrial:true,options:SUS.map(l=>({v:l,l:'Suspect '+l})),onChange(s){s._ovk=null;}},
    {id:'bmMeas',label:'Measure',type:'select',def:'icdU',vlab:true,noTrial:true,options:[{v:'icdU',l:'Upper intercanine (6 to 11)'},{v:'icdL',l:'Lower intercanine (27 to 22)'}].concat(UP.map(n=>({v:'t'+n,l:'Upper tooth '+n})),LO.map(n=>({v:'t'+n,l:'Lower tooth '+n})))},
    {id:'bmTool',label:'Tool',type:'seg',def:'cal',vlab:true,noTrial:true,options:[{v:'cal',l:'Digital caliper'},{v:'ruler',l:'Millimeter ruler'}]},
    {id:'ovX',label:'Slide the acetate left or right',type:'range',min:-15,max:15,step:0.1,def:0,unit:' mm',vlab:true,noTrial:true,help:'Or drag the acetate on the bench.'},
    {id:'ovY',label:'Slide the acetate up or down',type:'range',min:-15,max:15,step:0.1,def:0,unit:' mm',vlab:true,noTrial:true},
    {id:'ovR',label:'Turn the acetate',type:'range',min:-15,max:15,step:0.5,def:0,unit:'°',vlab:true,noTrial:true}
  ],
  actions:[
    {id:'newcase',label:'New case',lvl:'bio',modes:['compare'],run(sim){sim._seed=((sim._seed||1)*7+13)%2147483647;sim.infoDirty=true;}},
    {id:'trace',label:'Trace this impression onto acetate',vlab:true,lvl:'bio',run(sim){if(!isLab(sim))return;const B=sim.vlab.bench;B.ov=B.ov||{};B.ov[sim.p.bmSus]=true;BioLab.setValues(sim,{bmView:'overlay'});sim._ovk=null;},
     enabled:sim=>isLab(sim)&&!(sim.vlab.bench.ov||{})[sim.p.bmSus]},
    {id:'reseat',label:'Lift and re-seat the caliper',vlab:true,lvl:'bio',run(sim){if(!isLab(sim))return;const B=sim.vlab.bench;B.rep=B.rep||[];if(B.rep.length<3)B.rep.push(repRead(sim.vlab,vCase(sim.vlab),B.rep.length));},
     enabled:sim=>isLab(sim)&&((sim.vlab.bench.rep||[]).length<3)}
  ],
  init(sim){return {};},
  step(){},
  metrics:[
    {id:'tname',label:'This tooth',unit:'',lvl:'bio',text:true,modes:['arch'],get:s=>tname(s.p.tooth)},
    {id:'tfdi',label:'FDI number',unit:'',lvl:'ap',text:true,modes:['arch'],get:s=>fdi(s.p.tooth)},
    {id:'tmd',label:'Average crown width',unit:'mm',lvl:'honors',min:0,max:12,d:1,modes:['arch'],get:s=>mdOf(s.p.tooth)},
    {id:'icdT',label:'Upper intercanine: the teeth',unit:'mm',lvl:'bio',min:20,max:45,d:1,modes:['bite'],get:s=>fullMarks(s).teeth.icdU},
    {id:'icdM',label:'Upper intercanine: the mark',unit:'mm',lvl:'bio',min:20,max:45,d:1,modes:['bite'],get:s=>fullMarks(s).mark.icdU},
    {id:'chg',label:'Change in the mark',unit:'%',lvl:'honors',min:-15,max:15,d:1,modes:['bite'],get:s=>{const m=fullMarks(s);return 100*(m.mark.icdU/m.teeth.icdU-1);}},
    {id:'w9',label:'Tooth 9: tooth vs mark',unit:'',lvl:'ap',text:true,modes:['bite'],get:s=>{const m=fullMarks(s);return truthOf(m.teeth,'t9').toFixed(1)+' → '+truthOf(m.mark,'t9').toFixed(1)+' mm';}},
    {id:'cE',label:'Upper intercanine: evidence',unit:'mm',lvl:'bio',min:20,max:45,d:1,modes:['compare'],noTrial:true,get:s=>fullCase(s).ev.icdU},
    {id:'cS',label:'Upper intercanine: this suspect',unit:'mm',lvl:'bio',min:20,max:45,d:1,modes:['compare'],noTrial:true,get:s=>fullCase(s).imp[s.p.suspect].icdU},
    {id:'cN',label:'Front teeth that line up',unit:'',lvl:'bio',text:true,modes:['compare'],noTrial:true,get:s=>fullCase(s).fit[s.p.suspect].n+' of 12'},
    {id:'cV',label:'What you can say',unit:'',lvl:'bio',text:true,modes:['compare'],noTrial:true,get:s=>verdict(fullCase(s),s.p.suspect)}
  ],
  graphs:[{id:'tw',label:'Front tooth widths: teeth vs mark',lvl:'bio',custom:true},{id:'cmp',label:'Intercanine distance by suspect',lvl:'bio',custom:true}],
  defaultGraph:'tw',
  plot(sim,ctx,box,id){
    if(id==='cmp'){const C=fullCase(sim),vals=[C.ev.icdU].concat(C.imp.map(M=>M.icdU)),lo=Math.floor(Math.min(...vals)-3),hi=Math.ceil(Math.max(...vals)+2);
      const ax=axes(ctx,box,{xmin:0,xmax:5,ymin:lo,ymax:hi,xcats:['Evidence'].concat(SUS.map(l=>'Suspect '+l)),yl:'upper intercanine (mm)',yd:0});
      ctx.fillStyle=PAL['g-fill']||'rgba(120,120,120,.15)';ctx.globalAlpha=0.5;ctx.fillRect(box.L,ax.Y(C.ev.icdU+1),box.W,ax.Y(C.ev.icdU-1)-ax.Y(C.ev.icdU+1));ctx.globalAlpha=1;
      bars(ctx,ax,vals.map(v=>v),{colors:[PAL['s4']].concat(SUS.map((l,i)=>i===sim.p.suspect?PAL['s2']:PAL['g-axis'])),d:1});
      txt(ctx,'shaded: evidence ± 1 mm',box.L+box.W-4,box.T+12,{s:12,c:PAL['muted'],a:'right'});return;}
    const m=fullMarks(sim),ns=FRONT,a=ns.map(n=>truthOf(m.teeth,'t'+n)),b=ns.map(n=>truthOf(m.mark,'t'+n));
    const ax=axes(ctx,box,{xmin:0,xmax:12,ymin:0,ymax:11,xcats:ns.map(String),yl:'width (mm)',yd:0});const w=ax.X(1)-ax.X(0);
    ns.forEach((n,i)=>{[[a[i],PAL['g-axis'],-1],[b[i],PAL['s1'],1]].forEach(([v,c,s])=>{if(!(v>0))return;const x=ax.X(i+0.5)+s*w*0.18;ctx.fillStyle=c;ctx.fillRect(x-w*0.16,ax.Y(v),w*0.32,ax.Y(0)-ax.Y(v));});});
    legendRow(ctx,[[0,'tooth edges',PAL['g-axis']],[0,'mark on '+SURF[sim.p.surface].l.toLowerCase(),PAL['s1']]],box.L+8,box.T+8,box.L+box.W,1);},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors');
    if(p.mode==='compare'){const C=fullCase(sim);const rows=SUS.map((l,i)=>{const M=C.imp[i];return `<tr${i===p.suspect?' style="font-weight:700"':''}><td>${l}</td><td>${M.icdU.toFixed(1)}</td><td>${M.icdL.toFixed(1)}</td><td>${SHAPEN[C.sus[i].shape].split(' ')[0]}</td><td>${featsText(C.sus[i])}</td><td>${C.fit[i].n} of 12</td><td>${verdict(C,i)}</td></tr>`;}).join('');
      return `<h3>Comparison worksheet (fictional case)</h3><p>A bite was left in an apple at the scene. Four people bit styrofoam to make known impressions.</p><div class="tbl-wrap"><table><thead><tr><th>Suspect</th><th>Upper ICD (mm)</th><th>Lower ICD (mm)</th><th>Arch</th><th>Features</th><th>Overlay</th><th>Conclusion</th></tr></thead><tbody><tr><td>Evidence</td><td>${C.ev.icdU.toFixed(1)}</td><td>${C.ev.icdL.toFixed(1)}</td><td></td><td>see the bite</td><td></td><td></td></tr>${rows}</tbody></table></div>
        <p class="help">A clear difference, like a missing tooth or a very different arch, can exclude a person. Agreement can only mean “cannot be excluded.” ${hon?'Reviews by the National Academy of Sciences (2009), PCAST (2016) and NIST (2023) found no scientific basis for saying a bite mark came from one person. A saliva swab of the bite, tested for DNA, is the strong evidence.':'The strong evidence from a bite is the biter’s DNA in the saliva left behind.'}</p>`;}
    if(p.mode==='arch'){const n=p.tooth;return `<h3>The Universal numbering system</h3><div class="tbl-wrap"><table><thead><tr><th>Numbers</th><th>Where</th><th>Runs from</th></tr></thead><tbody><tr><td>1–8</td><td>upper right</td><td>third molar (1) to central incisor (8)</td></tr><tr><td>9–16</td><td>upper left</td><td>central incisor (9) to third molar (16)</td></tr><tr><td>17–24</td><td>lower left</td><td>third molar (17) to central incisor (24)</td></tr><tr><td>25–32</td><td>lower right</td><td>central incisor (25) to third molar (32)</td></tr></tbody></table></div><p class="help">Tooth ${n} is the ${tname(n)}. ${hon?'Dentists use these numbers on charts and X-ray records. Matching a body’s fillings, crowns, root shapes and missing teeth with a dental record is a reliable way to identify human remains.':'Bite marks come mostly from the front six teeth of each jaw: 6 to 11 on top, 22 to 27 below.'}</p>`;}
    const m=fullMarks(sim);const rows=FRONT.map(n=>`<tr><td>${n}</td><td>${TYPE[posOf(n)]}</td><td>${truthOf(m.teeth,'t'+n).toFixed(1)}</td><td>${truthOf(m.mark,'t'+n).toFixed(1)}</td></tr>`).join('');
    return `<h3>Teeth vs the mark on ${SURF[p.surface].l.toLowerCase()} (mm)</h3><div class="tbl-wrap"><table><thead><tr><th>Tooth</th><th>Type</th><th>Tooth edge</th><th>Mark</th></tr></thead><tbody>${rows}<tr><td>6–11</td><td>upper intercanine</td><td>${m.teeth.icdU.toFixed(1)}</td><td>${m.mark.icdU.toFixed(1)}</td></tr><tr><td>27–22</td><td>lower intercanine</td><td>${m.teeth.icdL.toFixed(1)}</td><td>${m.mark.icdL.toFixed(1)}</td></tr></tbody></table></div><p class="help">A width of 0 means the tooth leaves no mark.</p>`;},
  narrate(sim){const p=sim.p,hon=atLeast('honors');
    if(isLab(sim)){const v=p.bmView;if(v==='overlay'){const B=sim.vlab.bench;return (B.ov||{})[p.bmSus]?'Suspect '+p.bmSus+'’s traced acetate lies on the evidence photo. <b>Drag it, or use the sliders, until the marks line up as well as they can</b>, then judge the fit.':'You have not traced Suspect '+p.bmSus+'’s impression yet. <b>Trace it onto acetate first.</b>';}
      const who=v==='evidence'?'The evidence bite':'Suspect '+p.bmSus+'’s styrofoam impression';const f=p.bmMeas;return who+'. The '+(p.bmTool==='cal'?'caliper':'ruler')+' is on '+(f==='icdU'?'the upper canine tips (6 and 11)':f==='icdL'?'the lower canine tips (27 and 22)':'tooth '+f.slice(1))+'. <b>Read the '+(p.bmTool==='cal'?'display':'ruler')+' and record it in your table.</b>';}
    if(p.mode==='arch'){const n=p.tooth,pos=posOf(n);return 'Tooth '+(p.system==='fdi'&&atLeast('ap')?fdi(n)+' (FDI), Universal '+n:n)+' is the <b>'+tname(n)+'</b>. '+(pos<=3?'It is one of the front six teeth that make most bite marks.':pos<=5?'Premolars sit behind the canines and rarely mark a bite.':'Molars grind food at the back of the mouth and almost never show in a bite mark.');}
    if(p.mode==='compare'){const C=fullCase(sim),i=p.suspect,f=C.fit[i],other=C.fit.filter(x=>x.n>=10).length;
      if(f.n>=10)return 'Suspect '+SUS[i]+'’s acetate lines up at '+f.n+' of 12 teeth. <b>Suspect '+SUS[i]+' cannot be excluded</b>'+(other>1?', but neither can another suspect. The bite cannot tell them apart.':'. That is not the same as proof: other people outside this group might fit too.');
      return 'Only '+f.n+' of 12 teeth line up. <b>Suspect '+SUS[i]+' is excluded</b>: '+(C.sus[i].missing[10]&&!C.ev.U.find(t=>t.n===10).missing?'tooth 10 is missing, but the evidence shows a mark for 10.':'the arch width and tooth positions differ from the evidence.');}
    const m=fullMarks(sim),ch=100*(m.mark.icdU/m.teeth.icdU-1),s=p.surface;let t;
    if(s==='foam')t='Styrofoam holds a crisp copy of the edges, so <b>the mark matches the teeth</b> within about 0.1 mm. That is why classroom labs use it for known impressions.';
    else if(s==='apple')t='The apple curves away from the bite, so a straight-on photo <b>squeezes the outer marks inward</b>: the canine marks look '+Math.abs(ch).toFixed(1)+'% closer together than the canines are.';
    else if(s==='cheese')t='Soft cheese spreads and springs back, so <b>every mark comes out wider and blurrier</b>: the intercanine distance is '+ch.toFixed(1)+'% larger than the teeth.';
    else t=(hon&&p.posture==='moved'?'The bite was made on a bent arm and photographed straight, so <b>the skin stretched the mark out of shape</b> ('+ch.toFixed(1)+'% across).':'Skin is curved and stretchy, and it bruises instead of holding an edge. <b>The mark is a distorted, blurred copy</b> of the teeth.')+(atLeast('ap')&&p.hours>0?' After '+p.hours+' h the bruise has spread further.':'');
    if(p.feature!=='none'&&s!=='skin')t+=' The '+{rot:'rotated tooth 9',chip:'chipped tooth 8',gap:'gap between 8 and 9',missing:'missing tooth 10',out:'set-back tooth 7'}[p.feature]+' shows in the mark.';
    return t;},
  tour:[
    {title:'Thirty-two teeth, numbered',text:{bio:'An adult has 32 teeth. In the Universal system, used in the United States, you count from the biter’s upper right back molar (1) around the top to the upper left back molar (16), then from the lower left back molar (17) around to the lower right (32).',honors:'Universal numbering runs 1–16 across the upper jaw from the patient’s right, then 17–32 back across the lower jaw from the left. The chart is drawn as if you face the patient, so their right is on your left.'},focus:[20,20,530,420],pause:true,setup(sim){BioLab.setValues(sim,{mode:'arch',tooth:1});syncMode(sim);}},
    {title:'The front six make the mark',text:'Tooth 8 is the upper right central incisor. When you bite, the front six teeth of each jaw (6 to 11 on top, 22 to 27 below) leave most of the mark. Back teeth rarely show.',focus:[20,20,530,420],pause:true,setup(sim){BioLab.setValues(sim,{mode:'arch',tooth:8});}},
    {title:'An impression in styrofoam',text:{bio:'Biting a styrofoam plate copies the edges of your front teeth. The upper arch is on top and the lower arch below. Measure the distance between the canine tips: the intercanine distance.',honors:'Measure the upper and lower intercanine distances (canine tip to canine tip) and the width of each front tooth’s mark. Styrofoam copies the teeth within about 0.1 mm.'},focus:[100,40,400,380],pause:true,setup(sim){BioLab.setValues(sim,{mode:'bite',surface:'foam',feature:'none',truth:true});syncMode(sim);}},
    {title:'Distinctive features',text:'A rotated, chipped, missing or out-of-line tooth, or a gap, changes the pattern. Here tooth 9 is turned. Features like these are what examiners compare first.',focus:[100,40,400,380],pause:true,setup(sim){BioLab.setValues(sim,{feature:'rot'});}},
    {title:'Food changes the mark',text:'Now the same teeth bite cheese. Cheese is soft, so each mark spreads wider and blurs, and the intercanine distance grows. An apple curves away, so a photo squeezes the outer marks inward.',focus:[[40,20,520,420],[PX,30,PW,400]],pause:true,setup(sim){BioLab.setValues(sim,{surface:'cheese'});}},
    {title:'Skin changes it more',text:'Skin is curved, stretchy and moves. A bite on a bent arm, photographed with the arm straight, is several millimeters off, and the bruise spreads for days. The dashed outline is the real teeth.',focus:[[40,20,520,420],[PX,30,PW,400]],pause:true,setup(sim){BioLab.setValues(sim,{surface:'skin',posture:'moved',feature:'none'});}},
    {title:'Comparing suspects',text:'An acetate tracing of each suspect’s impression is laid on the evidence. In this case two suspects line up almost equally well. The bite cannot say which one, if either, made it.',focus:[20,20,770,420],pause:true,setup(sim){const C=fullCase(sim);BioLab.setValues(sim,{mode:'compare',suspect:C.near>=0?C.near:C.src});syncMode(sim);}},
    {lvl:'honors',title:'What odontology does well',text:'Courts and reviewers found bite-mark comparison is not a valid way to identify a person, and it has helped convict innocent people. The solid uses are a DNA swab of the saliva in a bite, and matching dental X-rays and records to identify human remains.',focus:[20,20,770,420],pause:true,setup(sim){const C=fullCase(sim);BioLab.setValues(sim,{mode:'compare',suspect:C.src});}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);BioLab.refresh(sim);sim.infoDirty=true;}},
  challenges(sim){const C=fullCase(sim),nearL=SUS[C.near],srcL=SUS[C.src],md=C.sus.findIndex((d,i)=>i!==C.src&&d.missing[10]);
    const cheese=marksOf(fullDent({shape:'U',feature:'none'}),'cheese'),foam=marksOf(fullDent({shape:'U',feature:'none'}),'foam',{spread:-0.05}),skinM=marksOf(fullDent({shape:'U',feature:'none'}),'skin',{moved:true});
    return [
    {lvl:'bio',instant:true,set:{mode:'bite',surface:'skin',feature:'none',posture:'same'},q:'A bite mark on a victim’s arm is the same size and shape as a suspect’s teeth. What does that show?',choices:['The suspect made the bite','The suspect cannot be excluded, but that does not identify them; a saliva DNA swab could','Nothing: a bite mark can never exclude anyone'],correct:1,
     explain:'Many people have teeth that would fit a blurred mark on skin. The National Academy of Sciences (2009) and later reviews found no scientific basis for naming one person from a bite mark, and bite-mark testimony helped convict people later cleared by DNA. A swab of the saliva in the bite can carry the biter’s DNA.'},
    {lvl:'bio',instant:true,set:{mode:'arch',tooth:8},q:'In the Universal numbering system, what number is the upper right central incisor (a front tooth)?',choices:['1','8','9'],correct:1,
     explain:'Counting starts at the upper right third molar, number 1, and runs forward: the upper right central incisor is 8 and the upper left central incisor is 9. The model now highlights tooth 8.'},
    {lvl:'bio',instant:true,set:{mode:'bite',surface:'cheese',feature:'none'},q:'The same teeth bite a styrofoam plate and a block of cheese. How do the two marks compare?',choices:['They are identical: teeth are rigid, so the marks are the same size','The cheese mark is wider and blurrier, because soft cheese spreads and springs back','The cheese mark is smaller'],correct:1,
     explain:'In the model the upper intercanine distance is '+foam.icdU.toFixed(1)+' mm in styrofoam but '+cheese.icdU.toFixed(1)+' mm in cheese, and every mark is blurred. The material changes the mark, not just the teeth.'},
    {lvl:'bio',instant:true,set:{mode:'compare',suspect:C.near},q:'On the acetate overlays, Suspect '+nearL+' and Suspect '+srcL+' both line up with the evidence bite at '+Math.min(C.fit[C.near].n,C.fit[C.src].n)+' or more of the 12 front teeth. What can you conclude?',choices:['The suspect whose measurement is a little closer made the bite','Neither one can be excluded; the bite cannot tell them apart','They both bit the apple'],correct:1,
     explain:'Their intercanine distances differ by only '+Math.abs(C.imp[C.near].icdU-C.imp[C.src].icdU).toFixed(1)+' mm, less than the distortion from the apple and the error in measuring a mark. When two people fit, the honest conclusion is that neither can be excluded.'},
    {lvl:'honors',instant:true,set:{mode:'bite',surface:'skin',posture:'moved',feature:'none'},q:'Someone was bitten on a bent forearm, and the photo was taken later with the arm straight. What happens to the mark’s upper intercanine distance?',choices:['It stays the same: the teeth did not change','It is off by several millimeters, because the skin stretched and relaxed','It changes by less than 0.1 mm'],correct:1,
     explain:'In the model the teeth measure '+foam.icdU.toFixed(1)+' mm across the canines, but the mark on the straightened arm measures '+skinM.icdU.toFixed(1)+' mm, about '+Math.abs(foam.icdU-skinM.icdU).toFixed(1)+' mm off. Real skin can distort a mark even more, and in different directions.'},
    {lvl:'honors',instant:true,set:{mode:'arch',tooth:24},q:'Where in the mouth is tooth 24?',choices:['Upper left','Lower left, a central incisor','Lower right, a molar'],correct:1,
     explain:'The lower numbers start at the lower left third molar (17) and run forward, so 24 is the lower left central incisor and 25 is the lower right central incisor.'},
    {lvl:'honors',instant:true,set:{mode:'compare',suspect:md>=0?md:0},q:'Suspect '+SUS[md>=0?md:0]+' is missing tooth 10, but the evidence bite shows a clear mark where tooth 10 should be. What does that show?',choices:['Nothing: a missing tooth does not matter','Suspect '+SUS[md>=0?md:0]+' is excluded','Suspect '+SUS[md>=0?md:0]+' made the bite with a false tooth'],correct:1,
     explain:'A clear difference that cannot be explained by distortion excludes a person. Exclusion is the most reliable thing a bite-mark comparison can do. Agreement only means “cannot be excluded.”'},
    {lvl:'honors',instant:true,set:{mode:'bite',surface:'skin',posture:'same',feature:'none'},q:'An investigator arrives at a fresh bite on skin. What should be done before anything else touches it?',choices:['Wash it so the photo is clear','Swab it for saliva, because saliva can carry the biter’s DNA','Press a styrofoam plate on it'],correct:1,
     explain:'Saliva left on the skin contains cells with the biter’s DNA. Examiners swab it (a wet swab, then a dry one), then photograph the mark with a scale. A DNA profile can identify a person; the pattern of the mark cannot.'},
    {lvl:'ap',instant:true,set:{mode:'arch',tooth:8,system:'fdi'},q:'Universal tooth 8 is the upper right central incisor. What is its number in the international FDI system?',choices:['18','11','21'],correct:1,
     explain:'FDI numbers are two digits: quadrant first (1 upper right, 2 upper left, 3 lower left, 4 lower right), then the tooth counted from the midline. The upper right central incisor is 11; the upper right third molar (Universal 1) is 18.'},
    {lvl:'ap',instant:true,set:{mode:'compare',suspect:C.src},q:'Suppose 1 adult in 10 has an upper intercanine distance within 0.5 mm of the evidence, 1 in 20 has a rotated tooth 9, and the two are independent. In a town of 100,000 adults, about how many would match both?',choices:['None: a combination like that is unique','About 500','About 5'],correct:1,
     explain:'100,000 × 1/10 × 1/20 = 500 people. And no one has measured how often dental features occur together, so even this estimate has no data behind it. That is one reason the 2016 PCAST report found bite-mark analysis far from scientifically valid.'},
    {lvl:'ap',instant:true,set:{mode:'bite',surface:'apple',feature:'none'},q:'An apple has a radius of about 38 mm. A canine mark sits 17.5 mm from the center of the bite, measured along the curved skin. In a straight-on photo, how far from the center does it appear?',choices:['17.5 mm','About 16.9 mm','About 12 mm'],correct:1,
     explain:'Seen straight on, a point s along the curve appears at R sin(s/R) = 38 × sin(17.5/38) = 38 × sin(0.46) ≈ 16.9 mm. Both canines move in about 0.6 mm, so the photo shrinks the intercanine distance by about 1.2 mm. The model uses this rule for the apple.'},
    {lvl:'ap',instant:true,q:'In a 2015 study, 39 board-certified bite-mark examiners looked at photos of 100 injuries. On how many did they all agree whether there was enough evidence to call it a human bite mark?',choices:['Nearly all 100','About half','Fewer than 10'],correct:2,
     explain:'The examiners agreed unanimously on only a handful of the 100 cases. If experts cannot agree that an injury is a bite, a match to one person’s teeth cannot be reliable. Texas, in 2016, called for a stop to bite-mark testimony, and NIST’s 2023 review found the method lacks a sufficient scientific foundation.'}
  ];},
  lab:{bio:'<p><b>Question:</b> How much do different surfaces change a bite mark?</p><ol><li>Choose Make a bite mark. Keep the real tooth edges showing.</li><li>For styrofoam, apple, cheese and skin, record the upper intercanine distance of the teeth and of the mark.</li><li>Add each distinctive feature in turn and look for it in the cheese and skin marks.</li></ol><p>Which surface gives the most faithful copy? Why do labs use styrofoam for known impressions but swab a bite on skin for DNA?</p>',
       honors:'<p><b>Question:</b> When can a bite mark exclude someone, and when can it not?</p><ol><li>In Compare with suspects, record each suspect’s upper and lower intercanine distance, arch shape and features.</li><li>Record how many of the 12 front teeth line up on each overlay.</li><li>Press New case several times and note how often two suspects both fit.</li></ol><p>Write which suspects you can exclude, by which feature, and why “cannot be excluded” is the strongest conclusion the bite supports.</p>',
       ap:'<p><b>Question:</b> How big is the distortion compared with the differences between people?</p><ol><li>For the apple, cheese and skin (arm moved), record the percent change in the upper intercanine distance.</li><li>On skin, record tooth 9’s mark width at 0, 24, 48 and 72 hours.</li><li>Compare these changes with the 1.7 mm standard deviation of upper intercanine distance in adults used here.</li></ol><p><b>Claim–evidence–reasoning:</b> Can a mark on skin separate two people whose intercanine distances differ by 1 mm? Use your numbers and the findings of the NAS (2009), PCAST (2016) and NIST (2023) reviews.</p>'},
  terms:[{t:'Forensic odontology',d:'Dentistry applied to the law: identifying remains from teeth and dental records, estimating age from teeth, and (with serious limits) studying bite marks.'},{t:'Universal numbering system',d:'US system numbering adult teeth 1–32: 1 upper right third molar, 16 upper left third molar, 17 lower left third molar, 32 lower right third molar.'},
    {t:'Incisors and canines',d:'The front cutting teeth (central and lateral incisors) and the pointed teeth beside them. They make most bite marks.'},{t:'Intercanine distance',d:'The distance between the tips of the two canines in one jaw, in mm.'},{t:'Impression',d:'A copy of the biting edges, made by biting styrofoam or dental wax.'},
    {lvl:'honors',t:'Distinctive features',d:'Rotated, chipped, missing or out-of-line teeth and gaps (diastemas) that change a bite pattern.'},{lvl:'honors',t:'Arch shape',d:'The curve of the front teeth seen from above: U-shaped (rounded), V-shaped (pointed) or square.'},{lvl:'honors',t:'Overlay',d:'A tracing of a suspect’s biting edges on clear acetate, laid over a scaled photo of the bite mark.'},
    {lvl:'honors',t:'Exclusion vs identification',d:'A clear difference can exclude a person. Agreement can only mean “cannot be excluded,” never “made the bite.”'},{lvl:'honors',t:'ABFO No. 2 scale',d:'An L-shaped ruler photographed beside a bite so the photo can be measured at true size.'},
    {lvl:'ap',t:'FDI system',d:'International two-digit tooth numbers: quadrant (1–4) then position from the midline (1–8). Upper right central incisor = 11.'},{lvl:'ap',t:'Foundational validity',d:'Evidence from properly designed studies that a method gives accurate, repeatable results. PCAST (2016) found bite-mark analysis lacks it.'}],
  about:'<p><b>Teeth.</b> Tooth widths are average adult mesiodistal crown widths (Wheeler’s Dental Anatomy): upper central incisor 8.5 mm, lateral 6.5 mm, canine 7.5 mm; lower central 5.0 mm, lateral 5.5 mm, canine 7.0 mm. Each simulated person varies about these by a standard deviation of about 0.35 mm. Upper intercanine distances vary with a standard deviation of about 1.7 mm around 34 mm, and the lower is about three quarters of the upper, as in published adult samples. The teeth are placed edge to edge along a curve y = D(x/20)ᵖ, with p set by the arch shape and D solved so the canine tips sit at the intercanine distance. A mark’s width is the length of that tooth’s biting edge.</p><p><b>Surfaces.</b> Styrofoam copies the edges within about 0.1 mm. The apple is a sphere of radius 38 mm photographed straight on, so a point s along the surface appears at R sin(s/R). Cheese spreads each mark by about 0.45 mm and stretches the pattern by 3–4%. Skin uses a curved arm (radius 34 mm); “arm moved” squeezes the mark 12% across and stretches it 6% along the arm, and bruising widens marks by 0.025 mm per hour. These are illustrative values; real skin distortion is larger, varies in every direction and cannot be undone reliably.</p><p><b>Overlays.</b> A tooth “lines up” when its center is within 0.9 mm of the evidence mark, its width within 1.0 mm and its angle within about 14°, after the best small shift and turn of the acetate.</p><p><b>What the science says.</b> The National Academy of Sciences (2009) found no scientific basis for identifying a person from a bite mark. PCAST (2016) found it far from foundationally valid, and NIST’s 2023 review found that its key premises (that front teeth are unique, that skin records them accurately, and that examiners can interpret the marks reliably) are not supported. More than 20 people convicted or charged with the help of bite-mark testimony have since been cleared. DNA from saliva and identification of remains from dental records remain solid uses of forensic odontology. All cases and people here are fictional.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);syncLight(sim);bindDrag(sim);if(sim._dragTick)sim._dragTick();
    if(isLab(sim)){drawBench(sim,ctx,k);return;}const m=sim.p.mode;if(m==='arch')drawArch(sim,ctx,k);else if(m==='compare')drawCompare(sim,ctx,k);else drawBite(sim,ctx,k);},
  thumbSetup(sim){sim.p.mode='bite';sim.p.surface='apple';sim.p.feature='rot';},thumbFrames:4,
  benchRead(sim){if(!isLab(sim))return null;const V=sim.vlab,C=vCase(V),p=sim.p,B=V.bench,subj=p.bmView==='evidence'?'E':p.bmSus;
    const Mx=p.bmView==='overlay'?null:subjM(C,subj),noMark=!!(Mx&&p.bmMeas[0]==='t'&&tooth(Mx,+p.bmMeas.slice(1)).missing);
    return {view:p.bmView,subj,meas:p.bmMeas,tool:p.bmTool,noMark,reading:p.bmView==='overlay'?null:(B.phase==='rep'&&subj==='E'&&p.bmMeas==='icdU'?((B.rep||[]).slice(-1)[0]??null):caliper(V,C,subj,p.bmMeas)),
      rep:(B.rep||[]).slice(),traced:Object.assign({},B.ov||{}),fit:SUS.map((l,i)=>C.fit[i].n),food:C.food,close:C.close,src:SUS[C.src],near:C.near>=0?SUS[C.near]:null,
      shapes:{E:C.sus[C.src].shape,A:C.sus[0].shape,B:C.sus[1].shape,C:C.sus[2].shape,D:C.sus[3].shape},feats:{E:featsText(C.sus[C.src]),A:featsText(C.sus[0]),B:featsText(C.sus[1]),C:featsText(C.sus[2]),D:featsText(C.sus[3])}};}
};
function verdict(C,i){return C.fit[i].n>=10?'Cannot be excluded':'Excluded';}
function legendRow(ctx,items,x0,y0,maxX,k){ctx.font='400 '+(12*k)+'px '+FONT;let lx=x0,ly=y0;items.forEach(it=>{const w=ctx.measureText(it[1]).width+26*k;if(lx+w>maxX&&lx>x0){lx=x0;ly+=18*k;}
  ctx.fillStyle=it[2]||PAL['g-axis'];ctx.fillRect(lx,ly-5*k,12*k,10*k);txt(ctx,it[1],lx+16*k,ly,{s:12*k,c:PAL['cv-soft'],b:'middle'});lx+=w;});return ly;}

/* ---------- Full lab views ---------- */
function drawArch(sim,ctx,k){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),sel=p.tooth;const cx=290,cyU=212,cyL=246,a=232,b=176;
  const seqU=[];for(let n=1;n<=16;n++)seqU.push(n);const seqL=[];for(let n=32;n>=17;n--)seqL.push(n);
  [[seqU,cyU,-1],[seqL,cyL,1]].forEach(([seq,cy,dir])=>{const tot=seq.reduce((s,n)=>s+mdOf(n),0);let acc=0;
    seq.forEach(n=>{const w=mdOf(n),f=(acc+w/2)/tot;acc+=w;const ph=Math.PI*(0.06+0.88*f),x=cx-a*Math.cos(ph),y=cy+dir*b*Math.sin(ph);const pos=posOf(n),front=pos<=3;
      const r=6+w*1.45;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dir*b*Math.cos(ph),a*Math.sin(ph)));
      ctx.fillStyle=n===sel?PAL['rj']:(hon&&front?'#f4e7c8':'#ecebe4');ctx.strokeStyle=n===sel?PAL['rj']:'#8d8a80';ctx.lineWidth=n===sel?3:1.4;
      rr(ctx,-r*0.55,-r*(pos>=6?0.62:pos>=4?0.52:0.42),r*1.1,r*(pos>=6?1.24:pos>=4?1.04:0.84),pos>=4?6:4);ctx.fill();ctx.stroke();ctx.restore();
      if(k>1.35&&n!==sel&&![1,8,9,16,17,24,25,32].includes(n))return;const lab=p.system==='fdi'&&ap?fdi(n):String(n);
      const ox=cx+(a-r*1.05-14*k)*(-Math.cos(ph)),oy=cy+dir*(b-r*1.05-14*k)*Math.sin(ph);txt(ctx,lab,ox,oy,{s:(n===sel?13:12)*k,w:n===sel?700:500,a:'center',b:'middle',c:n===sel?PAL['rj']:PAL['cv-soft']});});});
  txt(ctx,'Upper jaw',cx,cyU-30,{s:13*k,w:700,a:'center'});txt(ctx,'Lower jaw',cx,cyL+40,{s:13*k,w:700,a:'center'});
  txt(ctx,'Patient’s right',cx-a+10,22,{s:12*k,c:PAL['cv-soft']});txt(ctx,'Patient’s left',cx+a-10,22,{s:12*k,c:PAL['cv-soft'],a:'right'});
  panel(ctx,PX,30,PW,400);const L=[{t:(p.system==='fdi'&&ap?'FDI '+fdi(sel)+' · Universal '+sel:'Tooth '+sel),s:16,w:700},{t:tname(sel),s:14,w:700,c:PAL['rj']},{t:'Average width about '+mdOf(sel)+' mm',s:13,c:PAL['cv-soft']},
    {t:posOf(sel)<=3?'A front tooth: it marks a bite.':'A back tooth: it rarely marks a bite.',s:13}];if(hon)L.push({t:'Light teeth: the front six of each jaw (6–11 and 22–27).',s:12.5,c:PAL['cv-soft']});if(ap)L.push({t:'FDI: quadrant 1–4, then 1–8 from the midline.',s:12.5,c:PAL['cv-soft']});
  textBlock(ctx,L,PX+14,44,PW-28,420,k);}
function drawBite(sim,ctx,k){const p=sim.p,m=fullMarks(sim),ap=atLeast('ap');drawSurface(ctx,m.mark,p.surface);drawMarks(ctx,m.mark,p.surface,{hours:ap?p.hours:0});
  if(p.truth)drawOutline(ctx,m.teeth,p.surface==='foam'?'#2a2a2a':'#ffffff',{dash:[4,3],lw:1.4});sideTags(ctx,k);if(p.surface==='foam')foamTags(ctx,k);
  txt(ctx,SURF[p.surface].l+(p.surface==='foam'?' impression':' bite'),20,22,{s:14*k,w:700});
  panel(ctx,PX,30,PW,400);const hon=atLeast('honors'),L=[{t:'Upper intercanine',s:13,w:700},{t:'Teeth: '+m.teeth.icdU.toFixed(1)+' mm',s:13},{t:'Mark: '+m.mark.icdU.toFixed(1)+' mm',s:13,w:700,c:PAL['rj']},
    {t:'Lower intercanine',s:13,w:700},{t:'Teeth: '+m.teeth.icdL.toFixed(1)+' mm',s:13},{t:'Mark: '+m.mark.icdL.toFixed(1)+' mm',s:13,w:700,c:PAL['rj']}];
  if(p.truth)L.push({t:'Dashed: the real tooth edges',s:12.5,c:PAL['cv-soft']});if(hon)L.push({t:'Arch: '+SHAPEN[p.shape],s:12.5,c:PAL['cv-soft']});
  textBlock(ctx,L,PX+14,44,PW-28,420,k);}
function drawCompare(sim,ctx,k){const C=fullCase(sim),i=sim.p.suspect,f=C.fit[i];drawSurface(ctx,C.ev,C.food);drawMarks(ctx,C.ev,C.food);
  ctx.save();ctx.fillStyle='rgba(120,180,230,.16)';ctx.translate(CX+f.tx*S,CY+f.ty*S);ctx.rotate(f.rot);rr(ctx,-175,-185,350,370,6);ctx.fill();ctx.strokeStyle='rgba(60,120,190,.7)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
  drawOutline(ctx,C.imp[i],'#1f4fd1',{tf:f,lw:2});
  f.list.forEach(([n,ok])=>{const e=tooth(C.ev,n);const pnt=T(e.c),dy=n<=16?-(e.th*S/2+11):(e.th*S/2+11);ctx.fillStyle=ok?PAL['s3']:PAL['s1'];ctx.beginPath();ctx.arc(pnt[0],pnt[1]+dy,5,0,TAU);ctx.fill();});
  txt(ctx,'Evidence in an apple, Suspect '+SUS[i]+'’s acetate on top',20,22,{s:13*k,w:700});sideTags(ctx,k);
  const ty=30,th=(360-3*8)/4;SUS.forEach((l,j)=>{const y=ty+j*(th+8),sel=j===i;ctx.fillStyle=PAL['card'];rr(ctx,PX,y,PW,th,10);ctx.fill();ctx.strokeStyle=sel?PAL['rj']:PAL['line'];ctx.lineWidth=sel?3:1;ctx.stroke();
    txt(ctx,'Suspect '+l,PX+12,y+20*Math.min(k,1.3),{s:14*k,w:700});txt(ctx,C.imp[j].icdU.toFixed(1)+' mm · '+C.fit[j].n+'/12',PX+12,y+20*Math.min(k,1.3)+16*k,{s:12.5*k,c:PAL['cv-soft']});
    txt(ctx,verdict(C,j),PX+PW-10,y+20*Math.min(k,1.3),{s:12*k,w:700,a:'right',c:C.fit[j].n>=10?PAL['s3']:PAL['s1']});});
  legendRow(ctx,[[0,'lines up',PAL['s3']],[0,'does not',PAL['s1']],[0,'tracing','#1f4fd1']],PX+4,404,PX+PW,k);}

/* ---------- the virtual lab bench ---------- */
function drawBench(sim,ctx,k){const V=sim.vlab,C=vCase(V),p=sim.p,B=V.bench,view=p.bmView;
  if(view==='overlay'){drawSurface(ctx,C.ev,C.food);drawMarks(ctx,C.ev,C.food);sideTags(ctx,k);const s=p.bmSus,traced=(B.ov||{})[s];
    txt(ctx,'Evidence photo with Suspect '+s+'’s acetate',20,22,{s:14*k,w:700});
    if(traced){const tf={tx:p.ovX,ty:p.ovY,rot:p.ovR*Math.PI/180};ctx.save();ctx.translate(CX+tf.tx*S,CY+tf.ty*S);ctx.rotate(tf.rot);ctx.fillStyle='rgba(120,180,230,.18)';rr(ctx,-175,-185,350,370,6);ctx.fill();ctx.strokeStyle='rgba(60,120,190,.8)';ctx.lineWidth=1.5;ctx.stroke();
      txt(ctx,'Suspect '+s,-165,-170,{s:12*k,w:700,c:'#1f4fd1'});ctx.restore();drawOutline(ctx,C.imp[SUS.indexOf(s)],'#1f4fd1',{tf,lw:2});}
    panel(ctx,PX,30,PW,400);textBlock(ctx,traced?[{t:'Line up the acetate',s:14,w:700},{t:'Drag the clear sheet, or use the sliders, until the blue tracing sits on the marks as well as it can.',s:13},{t:'Then count the front teeth whose tracing sits on the evidence mark.',s:13,c:PAL['cv-soft']}]:
      [{t:'No tracing yet',s:14,w:700},{t:'Open Suspect '+s+'’s impression and trace it onto acetate first.',s:13}],PX+14,44,PW-28,420,k);return;}
  const subj=view==='evidence'?'E':p.bmSus,M=subjM(C,subj),surf=subj==='E'?C.food:'foam';
  drawSurface(ctx,M,surf);drawMarks(ctx,M,surf);sideTags(ctx,k);
  if(surf==='foam')foamTags(ctx,k);
  if(subj==='E')drawScale(ctx,k);
  txt(ctx,subj==='E'?'Evidence: bite in '+(C.food==='apple'?'an apple':'a block of cheese'):'Suspect '+subj+': styrofoam impression',20,22,{s:14*k,w:700});
  const feat=p.bmMeas,rep=B.phase==='rep'&&subj==='E'&&feat==='icdU',miss=feat[0]==='t'&&tooth(M,+feat.slice(1)).missing;
  panel(ctx,PX,30,PW,400);const lab=feat==='icdU'?'Upper intercanine':feat==='icdL'?'Lower intercanine':'Tooth '+feat.slice(1)+' mark';
  let y=textBlock(ctx,[{t:lab,s:14,w:700}],PX+14,40,PW-28,420,k)+6;
  if(miss){textBlock(ctx,[{t:'No mark here.',s:14,w:700},{t:'This tooth left no mark to measure.',s:13,c:PAL['cv-soft']}],PX+14,y,PW-28,420,k);return;}
  if(p.bmTool==='cal'){drawCaliper(ctx,M,feat,k);let val=caliper(V,C,subj,feat).toFixed(2);if(rep){const r=B.rep||[];val=r.length?r[r.length-1].toFixed(2):'– – . – –';}
    const kk=Math.min(k,1.4);lcd(ctx,PX+14,y,PW-28,val,k,'');txt(ctx,'mm',PX+PW-16,y+70*kk,{s:12*k,c:PAL['cv-soft'],a:'right'});y+=76*kk+6*k;
    if(rep)textBlock(ctx,[{t:'Repeat '+((B.rep||[]).length)+' of 3',s:13,w:700},{t:'Lift the caliper and set it again on the canine tips each time.',s:12.5,c:PAL['cv-soft']}],PX+14,y,PW-28,420,k);
    else textBlock(ctx,[{t:'Jaws on the two red dots.',s:12.5,c:PAL['cv-soft']}],PX+14,y,PW-28,420,k);}
  else{drawRuler(ctx,M,feat,k);const g=measureGeom(M,feat),y2=textBlock(ctx,[{t:'Zero is at the first red dot. The magnifier (3×) shows the far dot.',s:12.5,c:PAL['cv-soft']}],PX+14,y,PW-28,420,k);
    const zr=Math.min(92,(PW-20)/2,(422-y2)/2-4),zx=PX+PW/2,zy=y2+6+zr,zs=3,fx=g.B[0]+g.nx*12,fy=g.B[1]+g.ny*12;
    ctx.save();ctx.beginPath();ctx.arc(zx,zy,zr,0,TAU);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.clip();ctx.translate(zx,zy);ctx.scale(zs,zs);ctx.translate(-fx,-fy);drawSurface(ctx,M,surf);drawMarks(ctx,M,surf);drawRuler(ctx,M,feat,k,zs);ctx.restore();
    ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(zx,zy,zr,0,TAU);ctx.stroke();}}
function drawScale(ctx,k){const x=26,y0=80,mm=40;ctx.fillStyle='#f2f0e6';ctx.fillRect(x-8,y0-6,16,mm*S+12);ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.strokeRect(x-8,y0-6,16,mm*S+12);
  for(let i=0;i<=mm;i++){const y=y0+i*S;ctx.beginPath();ctx.moveTo(x+8,y);ctx.lineTo(x+8-(i%10===0?12:i%5===0?8:4),y);ctx.stroke();}ctx.save();ctx.translate(x-12,y0+mm*S/2);ctx.rotate(-Math.PI/2);txt(ctx,'ABFO scale (mm)',0,0,{s:11.5*k,w:700,a:'center',c:PAL['cv-soft']});ctx.restore();}
/* drag the acetate on the bench */
function bindDrag(sim){const cv=sim.ui&&sim.ui.stage;if(!cv||cv._bmDrag)return;cv._bmDrag=true;let drag=null;const on=()=>isLab(sim)&&sim.p.bmView==='overlay'&&(sim.vlab.bench.ov||{})[sim.p.bmSus];
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*800/r.width,(e.clientY-r.top)*450/r.height];};
  cv.addEventListener('pointerdown',e=>{if(!on())return;const [x,y]=pos(e);if(Math.abs(x-(CX+sim.p.ovX*S))>185||Math.abs(y-(CY+sim.p.ovY*S))>195)return;drag={x,y,ox:sim.p.ovX,oy:sim.p.ovY};try{cv.setPointerCapture(e.pointerId);}catch(er){}e.preventDefault();});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const [x,y]=pos(e);BioLab.setValues(sim,{ovX:clamp(Math.round((drag.ox+(x-drag.x)/S)*10)/10,-15,15),ovY:clamp(Math.round((drag.oy+(y-drag.y)/S)*10)/10,-15,15)});e.preventDefault();});
  const end=()=>{drag=null;};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  const tick=()=>{const want=on()?'none':'';if(cv.style.touchAction!==want){cv.style.touchAction=want;cv.style.cursor=want?'grab':'';}};cv.addEventListener('pointerenter',tick);sim._dragTick=tick;}

/* ---------- the virtual lab: Bite mark comparison (Forensic Science, Glugoski) ---------- */
const RL=['Evidence','Suspect A','Suspect B','Suspect C','Suspect D'],ROWS=RL,RID=n=>n==='Evidence'?'E':String(n).slice(-1);
const cv=sim=>{const V=sim.vlab;return V?vCase(V):null;};
function cellCheck(feat){return (sim,row,v)=>{const V=sim.vlab,C=cv(sim);if(!C)return null;row=RID(row);const M=subjM(C,row),tr=truthOf(M,feat);
  if(tr===0)return v===0?null:'Look at this mark again. Type 0 for a tooth that left no mark.';if(v===0)return 'This tooth does leave a mark. Measure its width.';
  const ref=caliper(V,C,row,feat);if(Math.abs(v-ref)>0.6)return 'This does not match the mark on the bench. Put the caliper or ruler on it and read it again.';return null;};}
function startOv(sim){const r=rng(hash(sim.vlab.seed+'|ov|'+sim.p.bmSus));BioLab.setValues(sim,{ovX:Math.round((7+5*r())*(r()<0.5?-1:1)*10)/10,ovY:Math.round((4+5*r())*(r()<0.5?-1:1)*10)/10,ovR:Math.round((3+6*r())*(r()<0.5?-1:1)*2)/2});}
function rowDone(V,t,row,cols){return cols.every(c=>V.raw('c:'+t+':'+c+':'+row).trim()!=='');}
const SET=(sim,o,phase)=>{sim.vlab.bench.phase=phase||'';BioLab.setValues(sim,o);};
const susStep=(l,i)=>({title:'Measure Suspect '+l+'’s impression',text:'<p>Suspect '+l+' bit a styrofoam plate: the upper arch is on top and the lower arch below. Measure it exactly as you measured the evidence.</p><p>Record the <b>upper and lower intercanine distances</b>, the <b>width of each front tooth</b> (type 0 for a tooth with no mark), the <b>arch shape</b> and any <b>distinctive features</b>, by tooth number, in the Suspect '+l+' rows.</p>',
  controls:['bmMeas','bmTool'],setup(sim){SET(sim,{bmView:'suspect',bmSus:l});},done:sim=>rowDone(sim.vlab,'t1',i+1,['icdU','icdL']),doneHint:'Record Suspect '+l+'’s upper and lower intercanine distances first.'});
const LAB_BM={id:'bitemark-compare',title:'Lab 1: Bite Marks',course:'Forensic Science',teachers:'Glugoski',
  source:{label:'Lab 1: Bite Marks (Week 16, Forensic Odontology)',href:'https://rjhs.instructure.com/courses/14959/assignments/554074'},level:'honors',
  purpose:'<p>Compare a bite mark left at a crime scene with dental impressions from four suspects. Measure the arches and teeth, build acetate overlays, and decide which suspects you can exclude. Then judge how confident a bite-mark comparison can be, and why.</p>',
  background:'<p>When you bite, the <b>front six teeth</b> of each jaw (the central incisors, lateral incisors and canines) leave most of the mark. Dentists number teeth with the <b>Universal system</b>: 1 to 16 around the upper jaw starting at the upper right third molar, then 17 to 32 around the lower jaw starting at the lower left third molar. The upper front teeth are 6 to 11 and the lower front teeth are 22 to 27.</p>'+
    '<p>Examiners compare the <b>intercanine distance</b> (canine tip to canine tip), the width of each front tooth’s mark, the <b>arch shape</b> (U, V or square) and <b>distinctive features</b>: rotated, chipped, missing or out-of-line teeth and gaps. They trace a suspect’s biting edges onto clear <b>acetate</b> and lay it over a photo of the bite taken with a scale.</p>'+
    '<p><b>Be careful what you conclude.</b> Food and skin change a mark: cheese spreads, an apple curves away from the camera, and skin stretches and bruises. In 2009 the National Academy of Sciences found no scientific basis for identifying a person from a bite mark, and later reviews (PCAST 2016, NIST 2023) agreed. Bite-mark testimony has contributed to the convictions of people later proven innocent. A clear difference can <b>exclude</b> someone; agreement only means a person <b>cannot be excluded</b>. The strong evidence from a bite is <b>DNA</b> from the saliva, collected with a swab. Teeth are also used to identify human remains by matching dental records and X-rays.</p>'+
    '<p><b>About the virtual bench.</b> The case and suspects are fictional. Every student’s case is different. The caliper reads to 0.01 mm, but where you set the jaws on a mark changes the reading a little, as in a real lab.</p>',
  materials:['Evidence: a bite in an apple or a block of cheese, photographed with an ABFO No. 2 scale','Styrofoam bite impressions from Suspects A, B, C and D (upper and lower arch)','Digital caliper (0.01 mm) and millimeter ruler','Clear acetate sheets and a fine marker','Gloves'],
  hypothesis:{prompt:'<p>Before you measure: which measurements or features do you think will best tell the suspects apart? Will you be able to say for certain who made the bite? Explain.</p>'},
  setup(sim){const B=sim.vlab.bench;B.ov=B.ov||{};B.rep=B.rep||[];VCASE=null;vCase(sim.vlab);},
  teardown(){VCASE=null;},
  controls:['bmView','bmSus','bmMeas','bmTool'],
  steps:[
    {title:'Look at the evidence',text:'<p>Put on gloves. The evidence is a bite left at the scene, photographed straight on with an ABFO No. 2 scale. The upper arch marks are on top and the lower arch marks are below. <b>R</b> marks the biter’s right side.</p><p>Describe what the bite is in and what you notice about the marks in the Observations box.</p>',controls:[],setup(sim){SET(sim,{bmView:'evidence',bmMeas:'icdU'});}},
    {title:'Measure the evidence',text:'<p>Choose each measurement in <b>Measure</b>. The caliper jaws close on the two red dots. Read the display and record each value to two decimals in the <b>Evidence</b> rows:</p><ul><li>upper intercanine distance (canine tips 6 to 11) and lower (27 to 22)</li><li>the width of each front tooth’s mark, 6 to 11 and 22 to 27 (type 0 for a tooth that left no mark)</li><li>the arch shape and any distinctive features, by tooth number</li></ul><p>You can switch to the millimeter ruler to check a reading.</p>',
     controls:['bmMeas','bmTool'],setup(sim){SET(sim,{bmView:'evidence'});},done:sim=>rowDone(sim.vlab,'t1',0,['icdU','icdL'])&&rowDone(sim.vlab,'t2',0,UP.map(n=>'w'+n)),doneHint:'Record the evidence intercanine distances and the six upper tooth widths first.'},
    {title:'Repeat one measurement',text:'<p>How repeatable is a measurement on a soft, curved mark? Measure the evidence’s <b>upper intercanine distance</b> three times. Each time, press <b>Lift and re-seat the caliper</b>, read the display, and record it in the repeat table.</p>',
     controls:['reseat'],setup(sim){SET(sim,{bmView:'evidence',bmMeas:'icdU',bmTool:'cal'},'rep');},done:sim=>(sim.vlab.bench.rep||[]).length>=3,doneHint:'Re-seat the caliper three times.'},
    susStep('A',0),susStep('B',1),susStep('C',2),susStep('D',3),
    {title:'Make the acetate overlays',text:'<p>For each suspect, lay a sheet of acetate on the styrofoam impression and trace the edges of every front tooth mark with a fine marker. Choose the suspect and press <b>Trace this impression onto acetate</b>.</p>',
     controls:['bmSus','trace'],setup(sim){SET(sim,{bmView:'suspect'});},done:sim=>SUS.every(l=>(sim.vlab.bench.ov||{})[l]),doneHint:'Trace all four suspects’ impressions.'},
    {title:'Compare each overlay',text:'<p>Lay each acetate on the evidence photo. <b>Drag the sheet</b> (or use the sliders) until the tracing sits on the marks as well as it can. Turn it if you need to.</p><p>For each suspect, record how many of the 12 front teeth line up, rate the overall fit, and decide whether the suspect is <b>excluded</b> or <b>cannot be excluded</b>.</p>',
     controls:['bmSus','ovX','ovY','ovR'],setup(sim){SET(sim,{bmView:'overlay'});startOv(sim);}},
    {title:'Analyze and conclude',text:'<p>Do the calculations from your own tables. Compare the spread of your repeat measurements with the differences between suspects. Then answer the questions and write your conclusion, including how confident you are and the limitations of this evidence.</p>',controls:['bmView','bmSus','bmMeas','bmTool','ovX','ovY','ovR'],setup(sim){SET(sim,{});}}
  ],
  tables:[
    {id:'t1',title:'Arch measurements and features',cols:[{id:'s',label:'',rows:ROWS},
      {id:'icdU',label:'Upper intercanine (mm)',dp:2,check:(sim,row,v)=>cellCheck('icdU')(sim,row,v)},{id:'icdL',label:'Lower intercanine (mm)',dp:2,check:(sim,row,v)=>cellCheck('icdL')(sim,row,v)},
      {id:'shape',label:'Arch shape',input:'select',options:[{v:'U',l:'U (rounded)'},{v:'V',l:'V (pointed)'},{v:'square',l:'Square'}],check(sim,row,v){const C=cv(sim);if(!C)return null;row=RID(row);const d=row==='E'?C.sus[C.src]:C.sus[SUS.indexOf(row)];return d.shape===v?null:'Look at the curve of the front teeth again: is the front rounded, pointed or flat?';}},
      {id:'feat',label:'Distinctive features (by tooth number)',input:'text',check(sim,row,v){return /\d|none|no /i.test(v)?null:'Name each feature with its tooth number, for example “tooth 10 chipped”, or write “none”.';}}]},
    {id:'t2',title:'Upper front teeth: width of each mark (mm)',cols:[{id:'s',label:'',rows:ROWS}].concat(UP.map(n=>({id:'w'+n,label:String(n),dp:2,check:(sim,row,v)=>cellCheck('t'+n)(sim,row,v)})))},
    {id:'t3',title:'Lower front teeth: width of each mark (mm)',cols:[{id:'s',label:'',rows:ROWS}].concat(LO.map(n=>({id:'w'+n,label:String(n),dp:2,check:(sim,row,v)=>cellCheck('t'+n)(sim,row,v)})))},
    {id:'t4',title:'Repeat measurement: evidence upper intercanine (mm)',cols:[{id:'r',label:'Trial',rows:[1,2,3]},{id:'v',label:'Upper intercanine (mm)',dp:2,check(sim,row,v){const r=(sim.vlab.bench.rep||[])[row-1];if(r===undefined)return 'Re-seat the caliper and read it before you record trial '+row+'.';return Math.abs(v-r)>0.06?'That is not what the caliper read for trial '+row+'. Check the number you copied.':null;}}]},
    {id:'t5',title:'Overlay comparison',cols:[{id:'s',label:'Suspect',rows:SUS,rowLabels:SUS.map(l=>'Suspect '+l)},
      {id:'n',label:'Front teeth that line up (of 12)',dp:0,check(sim,row,v){const C=cv(sim);if(!C)return null;if(!(sim.vlab.bench.ov||{})[row])return 'Trace Suspect '+row+'’s impression and lay it on the evidence first.';if(v<0||v>12||v!==Math.round(v))return 'Enter a whole number from 0 to 12.';return Math.abs(v-C.fit[SUS.indexOf(row)].n)>1?'Look at the overlay again. Count only the teeth whose tracing sits on the evidence mark.':null;}},
      {id:'fit',label:'Overall fit',input:'select',options:[{v:'good',l:'Good: nearly every edge lines up'},{v:'partial',l:'Partial'},{v:'poor',l:'Poor'}]},
      {id:'call',label:'Conclusion',input:'select',options:[{v:'cannot',l:'Cannot be excluded'},{v:'excluded',l:'Excluded'}]}]}
  ],
  observations:[{id:'ev',label:'The evidence: what it is in, and what you notice about the marks'},{id:'dist',label:'How the evidence marks look different from the styrofoam impressions'}],
  calcs:[
    {id:'range',label:'Spread of your repeat measurements: largest − smallest trial',unit:'mm',check(sim,v,V){const a=V.col('t4','v');if(!a.every(Number.isFinite))return 'Fill in all three trials first.';return Math.abs(v-(Math.max(...a)-Math.min(...a)))>0.011?'Check: subtract your smallest trial from your largest.':null;}},
    {id:'dmin',label:'Smallest difference in upper intercanine distance between the evidence and a suspect',unit:'mm',check(sim,v,V){const a=V.col('t1','icdU');if(!a.every(Number.isFinite))return 'Fill in every upper intercanine distance first.';const m=Math.min(...a.slice(1).map(x=>Math.abs(x-a[0])));return Math.abs(v-m)>0.011?'Check: find the suspect whose value is closest to the evidence, and subtract.':null;}},
    {id:'d2',label:'Difference in upper intercanine distance between the two suspects closest to the evidence',unit:'mm',check(sim,v,V){const a=V.col('t1','icdU');if(!a.every(Number.isFinite))return 'Fill in every upper intercanine distance first.';const s=a.slice(1).map(x=>[Math.abs(x-a[0]),x]).sort((p,q)=>p[0]-q[0]);return Math.abs(v-Math.abs(s[0][1]-s[1][1]))>0.011?'Check: take the two suspects closest to the evidence and subtract their values.':null;}}],
  graph:{type:'bar',title:'Intercanine distance: evidence and suspects',xl:'Bite',yl:'Intercanine distance (mm)',ymin:0,series:[{table:'t1',x:'s',y:'icdU',label:'Upper (6 to 11)'},{table:'t1',x:'s',y:'icdL',label:'Lower (27 to 22)'}]},
  questions:[
    {id:'q1',q:'<p>Which suspects could you exclude, and which feature or measurement excluded each one?</p>'},
    {id:'q2',q:'<p>Which suspect or suspects cannot be excluded? Could you tell them apart? Use your overlay table.</p>'},
    {id:'q3',q:'<p>Compare the spread of your three repeat measurements with the difference between the two suspects closest to the evidence. What does that tell you about using intercanine distance to tell people apart?</p>'},
    {id:'q4',q:'<p>How did the material of the evidence (apple or cheese) change the marks compared with the styrofoam impressions? How would a bite on skin be different?</p>'},
    {id:'q5',q:'<p>The 2009 National Academy of Sciences report and later reviews found that bite-mark comparison is not scientifically valid for identifying a person, and it has contributed to wrongful convictions. Give two reasons from this lab that support that finding.</p>'},
    {id:'q6',q:'<p>Why is a saliva swab from a bite mark stronger evidence than the pattern of the mark?</p>'},
    {id:'q7',q:'<p>Dental records are used to identify human remains, for example after a fire or a plane crash. Why does that work when matching a bite mark to one person does not?</p>'},
    {id:'q8',q:'<p>Using the Universal numbering system, give the number of each tooth.</p>',fields:[{id:'a',label:'Upper left central incisor'},{id:'b',label:'Lower right canine'},{id:'c',label:'Upper right third molar'}]},
    {id:'q9',n:'Confidence',q:'<p>State your confidence in your conclusion (low, moderate or high) and list its limitations.</p>',fields:[{id:'conf',label:'Confidence'},{id:'lim',label:'Limitations'}]}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: which suspect, if any, could have made the bite, and how strongly does the bite-mark evidence support that? Use your measurements, your overlays and your repeat measurement.</p>',cer:true}};
BM.labs=[LAB_BM];

/* ---------- the practical layer ---------- */
BioLab.addPractical({bitemarks:{
  hookSet:{mode:'compare'},
  hook:'A bite in an apple at a fictional scene has an upper intercanine distance of about 33 mm. Four people bit styrofoam. Two of them measure within 0.6 mm of the evidence, and both acetate tracings line up. Can the bite tell you which of them took the bite?',
  answer:'No. The two close suspects differ by less than the distortion an apple’s curve adds (it squeezes the canine marks about 1 mm closer together in a photo) and less than the spread of repeat caliper readings. The bite can exclude the suspects whose arches or missing teeth differ, but the two who fit can only be called “cannot be excluded.” A DNA swab of the saliva could settle it.',
  uses:[
    'Identifying remains: after fires and plane crashes, teeth often survive, and matching fillings, crowns and X-rays with dental records is a standard way to name the dead.',
    'Wrongful convictions: more than 20 people convicted or charged with the help of bite-mark testimony have been cleared, many by DNA. Texas called for a stop to bite-mark testimony in 2016.',
    'Swabbing a bite: saliva carries cells with the biter’s DNA, so a bite on skin is swabbed before anything else, then photographed with an ABFO No. 2 scale.'
  ],
  lede:'Your front teeth leave a pattern when you bite, a bit like a stamp. Measure it, see how food and skin bend it out of shape, and find out why courts no longer trust bite marks to name a person.',
  takeaway:'A bite mark can sometimes rule a person out, but it cannot pick one person out, because food and skin distort marks and many people’s front teeth are alike. Trust the DNA in the saliva and the dental records, not the pattern.',
  tour:[
    'An adult has 32 teeth. In the Universal system, used by US dentists, you count from the upper right back molar (1) around the top to the upper left back molar (16), then from the lower left back molar (17) around to the lower right (32).',
    'Tooth 8 is the upper right central incisor, one of your two big front teeth. When you bite, the front six teeth of each jaw (6 to 11 on top, 22 to 27 below) leave most of the mark. Back teeth rarely show.',
    'Biting a styrofoam plate, like a takeout container, copies the edges of your front teeth. Measure the distance between the pointed canine tips: the intercanine distance, about 3.5 cm on top for most adults.',
    'A turned, chipped, missing or out-of-line tooth, or a gap between the front teeth, changes the pattern. Here tooth 9 is turned. These features are what examiners compare first.',
    'Now the same teeth bite cheese. Cheese is soft, so each mark spreads wider and blurs, like a footprint in mud. An apple curves away, so a photo squeezes the outer marks closer together.',
    'Skin is curved, stretchy and moves. A bite on a bent arm, photographed with the arm straight, is off by several millimeters, and the bruise spreads for days. The dashed outline shows the real teeth.',
    'A clear tracing of each suspect’s teeth is laid on the evidence. In this case two suspects line up almost equally well, so the bite cannot say which one, if either, made it. A DNA swab of the saliva could.'
  ]
}});
BM.onLevel=syncMode;
BM.controls[0].onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
['surface','feature','shape','posture','hours','tooth','system','suspect'].forEach(id=>{const c=BM.controls.find(x=>x.id===id);const o=c.onChange;c.onChange=sim=>{if(o)o(sim);syncMode(sim);sim.infoDirty=true;};});
const cs=BM.controls.find(x=>x.id==='bmSus'),o0=cs.onChange;cs.onChange=sim=>{o0(sim);if(isLab(sim)&&sim.p.bmView==='overlay')startOv(sim);};
const cvw=BM.controls.find(x=>x.id==='bmView'),o1=cvw.onChange;cvw.onChange=sim=>{o1(sim);if(sim._dragTick)sim._dragTick();};
BioLab.register(BM);
})();

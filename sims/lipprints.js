(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText}=BioLab.h;
const TAU=Math.PI*2;

/* ---------- groove types: Suzuki and Tsuchihashi (1970) ----------
   Type I: clear vertical grooves across the whole lip. I′: vertical grooves that stop partway. II: branched (Y).
   III: intersecting (X). IV: reticular (a net). V: undetermined (does not fit the others).
   Prints here are drawn procedurally: each quadrant is filled with grooves of its type in a (u, v) frame,
   u = distance from the midline (mm) and v = fraction of the lip height from the mouth line to the border. */
const TYPES=['I','Ip','II','III','IV','V'];
const TN={I:'I',Ip:'I′',II:'II',III:'III',IV:'IV',V:'V'};
const TD={I:'complete vertical grooves',Ip:'incomplete vertical grooves',II:'branched (Y-shaped) grooves',III:'intersecting (X-shaped) grooves',IV:'reticular (net-like) grooves',V:'undetermined: fits no other type'};
const TS={I:'vertical, full height',Ip:'vertical, partial',II:'branched (Y)',III:'crossed (X)',IV:'net (grid)',V:'undetermined'};
const TW=[['I',0.2],['Ip',0.15],['II',0.25],['III',0.17],['IV',0.13],['V',0.1]];
const QS=['UR','UL','LR','LL'],QN={UR:'upper right',UL:'upper left',LR:'lower right',LL:'lower left'};
const SUS=['A','B','C','D'];
const W=52,HU=9,HL=11;                       // lip width and heights (mm)
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function pickType(r){let x=r();for(const [t,w] of TW){if(x<w)return t;x-=w;}return 'V';}
const hU=x=>{const t=Math.min(1,Math.abs(x)/(W/2));return Math.max(0.6,HU*Math.pow(1-t*t,0.7)*(1-0.2*Math.exp(-(x/3)*(x/3)))+0.9*Math.exp(-Math.pow((Math.abs(x)-6)/3.5,2))*(1-t));};
const hL=x=>{const t=Math.min(1,Math.abs(x)/(W/2));return Math.max(0.6,HL*Math.pow(1-t*t,0.6));};

/* grooves in (u, v): u from the midline outward (mm), v from 0 (mouth line) to 1 (lip border) */
function vline(r,u,a,b){const pts=[],ph=r()*TAU,amp=0.12+0.1*r();for(let i=0;i<=6;i++){const v=lerp(a,b,i/6);pts.push([u+amp*Math.sin(ph+v*5),v]);}return pts;}
function grooves(r,type,u0,u1){const out=[],sp=()=>1.1+0.6*r();
  if(type==='III'){for(let u=u0-1.5;u<u1;u+=1.5+0.9*r()){const w=1.8+1.3*r();out.push([[u,0.04],[u+w,0.96]]);out.push([[u+w,0.04],[u,0.96]]);}}
  else if(type==='IV'){const us=[];for(let u=u0+0.3+0.5*r();u<u1;u+=sp())us.push(u);us.forEach(u=>out.push(vline(r,u,0.04,0.96)));
    for(let i=0;i<us.length-1;i++){const n=2+Math.floor(r()*2);for(let j=0;j<n;j++){const v=0.12+0.76*r();out.push([[us[i],v],[us[i+1],v+0.1*(r()-0.5)]]);}}}
  else if(type==='V'){const n=Math.round((u1-u0)/1.0);for(let i=0;i<n;i++){let u=u0+r()*(u1-u0),v=0.05+0.9*r();const pts=[[u,v]];const du=(r()-0.5)*1.6,dv=(r()-0.5)*0.35;for(let j=0;j<4;j++){u+=du+(r()-0.5)*0.9;v=clamp(v+dv+(r()-0.5)*0.2,0.02,0.98);pts.push([u,v]);}out.push(pts);}}
  else{for(let u=u0+0.3+0.6*r();u<u1-0.2;u+=sp()){
      if(type==='I')out.push(vline(r,u,0.03,0.97));
      else if(type==='Ip'){const a=0.04+0.45*r(),L=0.22+0.3*r();out.push(vline(r,u,a,Math.min(0.97,a+L)));}
      else{const vb=0.38+0.32*r(),d=0.55+0.45*r(),l=vline(r,u,0.03,vb),e=l[l.length-1];out.push(l);out.push([[e[0],vb],[e[0]-d,0.97]]);out.push([[e[0],vb],[e[0]+d,0.97]]);}}
    if(type==='I'||type==='II'){const u=u0+r()*(u1-u0);out.push(vline(r,u,0.55,0.8));}}
  return out;}
function densify(pl){const o=[];for(let i=0;i<pl.length-1;i++){const a=pl[i],b=pl[i+1];for(let j=0;j<4;j++)o.push([lerp(a[0],b[0],j/4),lerp(a[1],b[1],j/4)]);}o.push(pl[pl.length-1]);return o;}
/* map a quadrant's (u, v) to print mm: x to the viewer's right, y down. The person's right is on the viewer's left. */
function mapQ(q,u,v){const sg=q==='UR'||q==='LR'?-1:1,up=q[0]==='U';const x=sg*(u+v*1.3*Math.min(1,u/(W/2)));const h=up?hU(x):hL(x);return [x,up?-(0.6+v*(h-0.6)):(0.6+v*(h-0.6))];}
function person(seed,types){const r=rng(seed);const P={seed,types:{},g:{}};QS.forEach(q=>{P.types[q]=types&&types[q]?types[q]:pickType(r);});
  QS.forEach(q=>{const rq=rng(hash(seed+'|'+q+'|'+P.types[q]));P.g[q]=grooves(rq,P.types[q],0.4,W/2-0.4).map(pl=>densify(pl).map(p=>mapQ(q,p[0],p[1])));});return P;}
const code=P=>QS.map(q=>q+' '+TN[P.types[q]]).join(' · ');

/* ---------- drawing ---------- */
function lipPath(ctx,part){ctx.beginPath();const N=60;
  if(part!=='L'){for(let i=0;i<=N;i++){const x=-W/2+W*i/N;const y=-hU(x);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}for(let i=N;i>=0;i--){const x=-W/2+W*i/N;ctx.lineTo(x,-0.6*(1-Math.pow(Math.abs(x)/(W/2),4)));}ctx.closePath();}
  if(part!=='U'){for(let i=0;i<=N;i++){const x=-W/2+W*i/N;const y=0.6*(1-Math.pow(Math.abs(x)/(W/2),4));i?ctx.lineTo(x,y):ctx.moveTo(x,y);}for(let i=N;i>=0;i--){const x=-W/2+W*i/N;ctx.lineTo(x,hL(x));}ctx.closePath();}}
function quadClip(ctx,q){ctx.beginPath();const up=q[0]==='U',L=q==='UR'||q==='LR';ctx.rect(L?-W/2-2:0,up?-HU-3:0,W/2+2,HU+HL+3);ctx.clip();lipPath(ctx,up?'U':'L');ctx.clip();}
/* o: {cx,cy,sc,ink,paper,alpha,pressure,smear,clip,sx,quads} */
function drawPrint(ctx,P,o){const sc=o.sc;ctx.save();ctx.translate(o.cx,o.cy);ctx.scale(sc*(o.sx||1),sc);
  if(o.clip){ctx.beginPath();ctx.ellipse(0,1,W*0.39,15,0,0,TAU);ctx.clip();}
  const pr=o.pressure||'normal',rN=rng(P.seed^0x5bd1);
  QS.forEach(q=>{if(o.quads&&!o.quads.includes(q))return;ctx.save();quadClip(ctx,q);const sm=o.smear===q;
    ctx.globalAlpha=(o.alpha||1)*(sm?0.55:1);ctx.fillStyle=o.ink;ctx.fillRect(-W/2-2,-HU-3,W+4,HU+HL+6);
    if(pr==='light'){ctx.fillStyle=o.paper;for(let i=0;i<26;i++){ctx.beginPath();ctx.ellipse(-W/2+rN()*W,-HU+rN()*(HU+HL),1+2.4*rN(),0.6+1.4*rN(),rN()*3,0,TAU);ctx.fill();}}
    ctx.strokeStyle=o.paper;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=pr==='heavy'?0.13:pr==='light'?0.34:0.24;
    if(sm&&!RM)ctx.filter='blur('+(0.9*sc/6).toFixed(2)+'px)';
    P.g[q].forEach((pl,i)=>{if(pr==='heavy'&&(i*7+3)%5<2)return;ctx.beginPath();pl.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
      if(sm){ctx.save();ctx.translate(0.7,0.25);ctx.globalAlpha*=0.7;ctx.stroke();ctx.restore();}});
    if(sm){ctx.filter='none';ctx.globalAlpha=0.35;ctx.strokeStyle=o.ink;ctx.lineWidth=1.1;for(let i=0;i<5;i++){ctx.beginPath();const y=(q[0]==='U'?-HU*0.8:1)+i*1.6;ctx.moveTo(q==='UR'||q==='LR'?-W/2:0,y);ctx.lineTo(q==='UR'||q==='LR'?0:W/2,y+0.8);ctx.stroke();}}
    ctx.restore();});
  ctx.restore();}
function guides(ctx,o,k,labels){const {cx,cy,sc}=o;ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(cx,cy-(HU+4)*sc);ctx.lineTo(cx,cy+(HL+4)*sc);ctx.moveTo(cx-(W/2+4)*sc,cy);ctx.lineTo(cx+(W/2+4)*sc,cy);ctx.stroke();ctx.restore();
  if(labels){const dx=(W/2+1)*sc,dyU=(HU+5)*sc,dyL=(HL+6)*sc;[['UR',-1,-1],['UL',1,-1],['LR',-1,1],['LL',1,1]].forEach(([q,sx,sy])=>{const t=labels[q]||q;txt(ctx,t,cx+sx*dx*0.62,cy+(sy<0?-dyU:dyL),{s:12.5*k,w:700,a:'center',b:'middle',c:'#3a362e'});});}}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBlock(ctx,lines,x,y,maxW,maxY,k){let ly=y;for(const L of lines){const sz=(L.s||13)*k;const ws=wrapLines(ctx,L.t,maxW,sz,L.w);for(const w of ws){if(ly+sz>maxY)return ly;ly+=sz*1.25;txt(ctx,w,x,ly-sz*0.25,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink']});}ly+=(L.gap||3)*k;}return ly;}
function panel(ctx,x,y,w,h){ctx.fillStyle=PAL['card'];rr(ctx,x,y,w,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function card(ctx,x,y,w,h,lined){ctx.fillStyle='rgba(0,0,0,.18)';rr(ctx,x+4,y+5,w,h,6);ctx.fill();ctx.fillStyle='#fbfaf4';rr(ctx,x,y,w,h,6);ctx.fill();ctx.strokeStyle='#d6d2c2';ctx.lineWidth=1;ctx.stroke();
  if(lined){ctx.strokeStyle='#c7dbea';for(let ly=y+38;ly<y+h-8;ly+=24){ctx.beginPath();ctx.moveTo(x+10,ly);ctx.lineTo(x+w-10,ly);ctx.stroke();}ctx.strokeStyle='#e7a3a3';ctx.beginPath();ctx.moveTo(x+10,y+26);ctx.lineTo(x+w-10,y+26);ctx.stroke();}}
const LIP='#c23a52',POW='#26262a',PAPER='#fbfaf4';
const PX=568,PW=222,CX=290,CY=236,SC=8;
/* magnifier: one quadrant at 2.2× the print scale */
function qCenter(q){const up=q[0]==='U',L=q==='UR'||q==='LR';return [(L?-1:1)*W*0.24,up?-HU*0.5:HL*0.5];}
function loupe(ctx,P,o,q,zx,zy,zr,zoom,k,label){const c=qCenter(q),sc=o.sc*zoom;ctx.save();ctx.beginPath();ctx.arc(zx,zy,zr,0,TAU);ctx.fillStyle=o.bg||PAPER;ctx.fill();ctx.clip();
  drawPrint(ctx,P,Object.assign({},o,{cx:zx-c[0]*sc*(o.sx||1),cy:zy-c[1]*sc,sc,quads:[q]}));ctx.restore();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(zx,zy,zr,0,TAU);ctx.stroke();
  if(label)txt(ctx,label,zx,zy-zr-10,{s:12.5*k,w:700,a:'center'});}

/* ---------- cases ---------- */
function newCase(seed,o){o=o||{};const r=rng(seed>>>0||1);const close=o.close!==undefined?o.close:r()<0.6;
  const ref=person(hash(seed+'|ref')),src=person(hash(seed+'|src'));const list=[src];
  const nt=Object.assign({},src.types);if(!close){const q=QS[Math.floor(r()*4)];nt[q]=TYPES.filter(t=>t!==src.types[q])[Math.floor(r()*5)];}
  list.push(person(hash(seed+'|near'),nt));let i=0;
  while(list.length<4&&i<80){i++;const P=person(hash(seed+'|o'+i));if(QS.filter(q=>P.types[q]!==src.types[q]).length>=2)list.push(P);}
  const ord=[0,1,2,3];for(let j=3;j>0;j--){const k=Math.floor(r()*(j+1));[ord[j],ord[k]]=[ord[k],ord[j]];}
  const smear=r()<0.6?QS[Math.floor(r()*4)]:null;
  return {seed,close,ref,sus:ord.map(j=>list[j]),src:ord.indexOf(0),near:ord.indexOf(1),smear,sx:0.97+0.06*r()};}
let FCASE=null;function fullCase(sim){const s=sim._seed||(sim._seed=20261103);if(!FCASE||FCASE.seed!==s)FCASE=newCase(s,{close:true});return FCASE;}
let VCASE=null;function vCase(V){if(!VCASE||VCASE.seed!==V.seed)VCASE=newCase(V.seed);return VCASE;}
const isLab=sim=>!!(sim&&sim.vlab&&sim.vlab.lab&&sim.vlab.lab.id==='lipprint-match');
const agreeN=(C,i)=>QS.filter(q=>C.sus[i].types[q]===C.sus[C.src].types[q]).length;
function verdict(C,i){if(i===C.src)return 'Cannot be excluded';return agreeN(C,i)===4?'Excluded by groove detail':'Excluded by groove type';}

/* scene objects where lip prints turn up */
const WHERE={glass:{l:'Drinking glass',por:false,col:'Photograph it, swab the rim for DNA, then dust the print with powder and lift it with tape.',dna:'saliva and skin cells on the rim'},
  cup:{l:'Coffee cup lid',por:false,col:'Photograph it, swab around the sip hole for DNA, then powder and lift the print.',dna:'saliva around the sip hole'},
  butt:{l:'Cigarette butt',por:true,col:'Photograph it and package it whole in a paper envelope. The lab studies the print, then tests the filter paper.',dna:'saliva soaked into the filter: a strong DNA source'},
  napkin:{l:'Paper napkin',por:true,col:'Photograph it. A long-lasting lipstick print can be stained with a fat-soluble dye such as Nile red or Sudan black.',dna:'saliva on the paper'},
  letter:{l:'Letter sealed with a kiss',por:true,col:'Photograph it, then package it in paper. The licked envelope flap can be swabbed or cut out for DNA.',dna:'saliva on the licked flap'}};

/* ---------- show only what the current Full lab task uses ---------- */
function vis(sim,c){if(c.vlab)return null;if(!atLeast(c.lvl||'bio'))return false;if(c.modes&&!c.modes.includes(sim.p.mode))return false;return true;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec||sim.mode==='vlab')return;const d=sim.def;
  d.controls.forEach(c=>{const v=vis(sim,c);if(v===null)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!v;});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(sim,m);});
  d.actions.forEach(a=>{if(a.vlab)return;const b=sim.ui.actB&&sim.ui.actB[a.id];if(b)b.hidden=!vis(sim,a);});}
function syncLight(sim){const key=BioLab.level+sim.p.mode+sim.mode;if(sim._sk!==key){sim._sk=key;syncMode(sim);}}
function fullPerson(sim){const s=sim._pseed||(sim._pseed=7301);if(!sim._P||sim._P.seed!==s)sim._P=person(s);return sim._P;}
const TPATCH={};function patch(t){if(!TPATCH[t]){const r=rng(hash('patch'+t));TPATCH[t]=grooves(r,t,0.2,21.8).map(pl=>densify(pl).map(p=>[p[0],p[1]*15.2]));}return TPATCH[t];}

const LP={
  id:'lipprints',hash:'lipprints',apUnit:16,order:2,tab:'Lip prints',kind:'Virtual lab',prereq:['fingerprints'],next:['bitemarks','dna'],
  card:'Make your own lip print, classify the grooves in each quadrant by type, and compare a print from a glass with four suspects.',
  title:'Lip prints (cheiloscopy)',
  lede:{bio:'The skin of your lips is covered with tiny grooves. Press your lips on a card, sort the grooves into six types, and compare a print left on a glass with suspects’ prints.',
        honors:'Classify lip prints quadrant by quadrant with the Suzuki–Tsuchihashi types I, I′, II, III, IV and V, see how pressure and smearing change a print, and learn where lip prints turn up as evidence.',
        ap:'Go beyond the type code: compare the arrangement of grooves under magnification, put numbers on how often a type pattern is shared, and weigh why lip prints have limited standing in court.'},
  scale:{bio:'A pair of lips about 5 cm wide. The grooves are about 1.5–2 mm apart.',ap:'Lips about 52 mm wide, the upper lip about 9 mm tall at the middle. Groove spacing about 1.5–2.2 mm; the magnifier shows one quadrant at 2.2×.'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'print',lvl:'bio',noTrial:true,options:[{v:'types',l:'The six groove types'},{v:'print',l:'Classify a print'},{v:'where',l:'Where prints are found'},{v:'compare',l:'Compare with suspects'}]},
    {id:'type',label:'Groove type',type:'seg',def:'I',lvl:'bio',modes:['types'],options:TYPES.map(t=>({v:t,l:'Type '+TN[t]}))},
    {id:'labels',label:'Show the type in each quadrant',type:'toggle',def:false,lvl:'bio',modes:['print'],noTrial:true},
    {id:'quad',label:'Magnifier on',type:'seg',def:'UR',lvl:'bio',modes:['print'],noTrial:true,options:QS.map(q=>({v:q,l:q}))},
    {id:'pressure',label:'How hard the lips pressed',type:'seg',def:'normal',lvl:'honors',modes:['print'],options:[{v:'light',l:'Lightly'},{v:'normal',l:'Relaxed, even'},{v:'heavy',l:'Hard'}]},
    {id:'smear',label:'Lips moved while pressing',type:'toggle',def:false,lvl:'ap',modes:['print']},
    {id:'surface',label:'Found on',type:'select',def:'glass',lvl:'bio',modes:['where'],options:Object.keys(WHERE).map(k=>({v:k,l:WHERE[k].l}))},
    {id:'suspect',label:'Suspect',type:'seg',def:0,lvl:'bio',modes:['compare'],noTrial:true,options:SUS.map((l,i)=>({v:i,l:'Suspect '+l}))},
    {id:'cquad',label:'Magnifier on',type:'seg',def:'UR',lvl:'honors',modes:['compare'],noTrial:true,options:QS.map(q=>({v:q,l:q}))},
    // virtual lab bench only
    {id:'lpView',label:'Look at',type:'seg',def:'ref',vlab:true,noTrial:true,options:[{v:'ref',l:'Your reference print'},{v:'evidence',l:'Evidence'},{v:'suspect',l:'Suspect print'},{v:'side',l:'Side by side'}]},
    {id:'lpSus',label:'Suspect',type:'seg',def:'A',vlab:true,noTrial:true,options:SUS.map(l=>({v:l,l:'Suspect '+l}))},
    {id:'lpQuad',label:'Magnifier on',type:'seg',def:'UR',vlab:true,noTrial:true,options:[{v:'UR',l:'Upper right'},{v:'UL',l:'Upper left'},{v:'LR',l:'Lower right'},{v:'LL',l:'Lower left'}],help:'Right and left are the person’s own right and left.'}
  ],
  actions:[
    {id:'newperson',label:'New person',lvl:'bio',modes:['print'],run(sim){sim._pseed=(sim._pseed||7301)*31%2147483647+17;sim.infoDirty=true;}},
    {id:'newcase',label:'New case',lvl:'bio',modes:['compare'],run(sim){sim._seed=((sim._seed||1)*7+13)%2147483647;sim.infoDirty=true;}},
    {id:'lipstick',label:'Apply lipstick',vlab:true,lvl:'bio',run(sim){const B=sim.vlab&&sim.vlab.bench;if(B&&!(B.ref>0))B.ref=1;},enabled:sim=>isLab(sim)&&!(sim.vlab.bench.ref>0)},
    {id:'tape',label:'Press clear tape on your closed lips',vlab:true,lvl:'bio',run(sim){const B=sim.vlab&&sim.vlab.bench;if(B&&B.ref===1)B.ref=2;},enabled:sim=>isLab(sim)&&sim.vlab.bench.ref===1},
    {id:'card',label:'Stick the tape on an index card',vlab:true,lvl:'bio',run(sim){const B=sim.vlab&&sim.vlab.bench;if(B&&B.ref===2)B.ref=3;},enabled:sim=>isLab(sim)&&sim.vlab.bench.ref===2},
    {id:'swab',label:'Swab the rim for DNA',vlab:true,lvl:'bio',run(sim){const B=sim.vlab&&sim.vlab.bench;if(B&&!(B.ev>0))B.ev=1;},enabled:sim=>isLab(sim)&&!(sim.vlab.bench.ev>0)},
    {id:'dust',label:'Dust the print with black powder',vlab:true,lvl:'bio',run(sim){const B=sim.vlab&&sim.vlab.bench;if(B&&B.ev===1)B.ev=2;},enabled:sim=>isLab(sim)&&sim.vlab.bench.ev===1},
    {id:'lift',label:'Lift the print with tape onto a card',vlab:true,lvl:'bio',run(sim){const B=sim.vlab&&sim.vlab.bench;if(B&&B.ev===2)B.ev=3;},enabled:sim=>isLab(sim)&&sim.vlab.bench.ev===2}
  ],
  init(sim){return {};},
  step(){},
  metrics:[
    {id:'tname',label:'This type',unit:'',lvl:'bio',text:true,modes:['types'],get:s=>'Type '+TN[s.p.type]+': '+TD[s.p.type]},
    {id:'dom',label:'Most common type in this print',unit:'',lvl:'bio',text:true,modes:['print'],get:s=>{const P=fullPerson(s),c={};QS.forEach(q=>c[P.types[q]]=(c[P.types[q]]||0)+1);const t=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];return 'Type '+TN[t]+' ('+c[t]+' of 4 quadrants)';}},
    {id:'code',label:'Classification',unit:'',lvl:'honors',text:true,modes:['print'],get:s=>code(fullPerson(s))},
    {id:'wpor',label:'Surface',unit:'',lvl:'bio',text:true,modes:['where'],get:s=>WHERE[s.p.surface].por?'Porous: soaks things up':'Nonporous: the print sits on top'},
    {id:'wdna',label:'DNA source',unit:'',lvl:'bio',text:true,modes:['where'],get:s=>WHERE[s.p.surface].dna},
    {id:'cA',label:'Quadrants with the same type',unit:'',lvl:'bio',text:true,modes:['compare'],noTrial:true,get:s=>agreeN(fullCase(s),s.p.suspect)+' of 4'},
    {id:'cD',label:'Groove detail',unit:'',lvl:'honors',text:true,modes:['compare'],noTrial:true,get:s=>{const C=fullCase(s);return s.p.suspect===C.src?'Agrees':'Differs';}},
    {id:'cV',label:'What you can say',unit:'',lvl:'bio',text:true,modes:['compare'],noTrial:true,get:s=>verdict(fullCase(s),s.p.suspect)}
  ],
  graphs:[{id:'tcount',label:'Quadrants of each type in this print',lvl:'bio',custom:true},{id:'agree',label:'Compare: quadrants that agree with the evidence',lvl:'bio',custom:true}],
  defaultGraph:'tcount',
  plot(sim,ctx,box,id){if(id==='tcount'){const P=fullPerson(sim),vals=TYPES.map(t=>QS.filter(q=>P.types[q]===t).length);const ax=axes(ctx,box,{xmin:0,xmax:6,ymin:0,ymax:4.6,xcats:TYPES.map(t=>TN[t]),yl:'quadrants',yd:0});bars(ctx,ax,vals,{colors:TYPES.map(t=>PAL['s2']),d:0});return;}const C=fullCase(sim),vals=SUS.map((l,i)=>agreeN(C,i));const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:4.6,xcats:SUS.map(l=>'Suspect '+l),yl:'quadrants with the same type',yd:0});
    bars(ctx,ax,vals,{colors:SUS.map((l,i)=>i===sim.p.suspect?PAL['s2']:PAL['g-axis']),d:0});txt(ctx,'Same type is not a match: check the detail too.',box.L+box.W-4,box.T+10,{s:12,c:PAL['muted'],a:'right'});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='types')return `<h3>Suzuki–Tsuchihashi groove types</h3><div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Grooves</th></tr></thead><tbody>${TYPES.map(t=>`<tr${t===p.type?' style="font-weight:700"':''}><td>${TN[t]}</td><td>${TD[t]}</td></tr>`).join('')}</tbody></table></div><p class="help">Japanese researchers Yasuo Tsuchihashi and Kazuo Suzuki described these types in 1970. Most prints mix types, so examiners record the type that covers most of each part of the lip.</p>`;
    if(p.mode==='where'){const rows=Object.keys(WHERE).map(k=>{const w=WHERE[k];return `<tr${k===p.surface?' style="font-weight:700"':''}><td>${w.l}</td><td>${w.por?'porous':'nonporous'}</td><td>${w.col}</td></tr>`;}).join('');
      return `<h3>Where lip prints are found</h3><div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Surface</th><th>How to collect it</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">A print made with lipstick is often visible. A print from bare lips leaves only a faint trace of moisture and oils and must be developed${ap?', for example with powder on glass or a fat-soluble (lysochrome) dye on paper':''}. Saliva on the same spot can carry the person’s DNA, which is far stronger evidence than the pattern.</p>`;}
    if(p.mode==='compare'){const C=fullCase(sim);const E=C.sus[C.src];const rows=SUS.map((l,i)=>{const P=C.sus[i];return `<tr${i===p.suspect?' style="font-weight:700"':''}><td>${l}</td>${QS.map(q=>`<td>${TN[P.types[q]]}</td>`).join('')}<td>${agreeN(C,i)} of 4</td><td>${verdict(C,i)}</td></tr>`;}).join('');
      return `<h3>Comparison worksheet (fictional case)</h3><p>A print was lifted from a drinking glass at the scene.</p><div class="tbl-wrap"><table><thead><tr><th>Print</th><th>UR</th><th>UL</th><th>LR</th><th>LL</th><th>Same type</th><th>Conclusion</th></tr></thead><tbody><tr><td>Evidence</td>${QS.map(q=>`<td>${TN[E.types[q]]}</td>`).join('')}<td></td><td></td></tr>${rows}</tbody></table></div><p class="help">Groove type is a class characteristic. Two people can share all four types${hon?', so examiners then compare the arrangement of individual grooves, branches and crossings under magnification':''}. Even when everything agrees, the honest conclusion is “cannot be excluded.”</p>`;}
    const P=fullPerson(sim);return `<h3>This print, quadrant by quadrant</h3><div class="tbl-wrap"><table><thead><tr><th>Quadrant</th><th>Dominant type</th><th>What the grooves do</th></tr></thead><tbody>${QS.map(q=>`<tr${q===p.quad?' style="font-weight:700"':''}><td>${QN[q]} (${q})</td><td>${p.labels||hon?TN[P.types[q]]:'?'}</td><td>${p.labels||hon?TS[P.types[q]]:'turn on the labels to check'}</td></tr>`).join('')}</tbody></table></div><p class="help">Right and left are the person’s own: as you face the print, the upper right quadrant is on your left.</p>`;},
  narrate(sim){const p=sim.p,hon=atLeast('honors');
    if(isLab(sim)){const B=sim.vlab.bench,v=p.lpView;
      if(v==='ref')return !(B.ref>=3)?'Make your reference print: lipstick, then clear tape pressed on relaxed, closed lips, then the tape on an index card.':'Your reference print on the index card. <b>Look at each quadrant through the magnifier and record the type that covers most of it.</b>';
      if(v==='evidence')return !(B.ev>=3)?'A drinking glass from the scene with a lip print on the rim. <b>Swab the rim for DNA first, then dust and lift the print.</b>':'The lifted evidence print. Parts of it may be missing or smudged. <b>Classify each quadrant you can read.</b>';
      if(v==='suspect')return 'Suspect '+p.lpSus+'’s known print, made the same way as yours. <b>Classify each quadrant.</b>';
      return 'The evidence (left) and Suspect '+p.lpSus+' (right), the '+QN[p.lpQuad]+' quadrant under the magnifier. <b>Do the individual grooves, branches and crossings fall in the same places?</b>';}
    if(p.mode==='types')return 'Type '+TN[p.type]+': <b>'+TD[p.type]+'</b>. '+{I:'The grooves run straight across the whole height of the lip.',Ip:'Like type I, but the grooves stop partway and do not cross the whole lip.',II:'Each groove starts straight, then splits in two like a Y toward the edge of the lip.',III:'Grooves run on a slant and cross each other like an X.',IV:'Grooves join into a net of small boxes, like a grid.',V:'The grooves wander and fit no other type.'}[p.type];
    if(p.mode==='where'){const w=WHERE[p.surface];return 'A '+w.l.toLowerCase()+' is '+(w.por?'porous':'nonporous')+'. <b>'+w.col+'</b>';}
    if(p.mode==='compare'){const C=fullCase(sim),i=p.suspect,n=agreeN(C,i);
      if(i===C.src)return 'All four quadrants agree in type, and under the magnifier <b>the individual grooves line up too</b>. Suspect '+SUS[i]+' cannot be excluded, but no study shows how many other people would match this well.';
      if(n===4)return 'Suspect '+SUS[i]+' has the same type in all four quadrants, <b>but the grooves themselves fall in different places</b>. Same type is a class match only, so the detail excludes Suspect '+SUS[i]+'.';
      return 'Suspect '+SUS[i]+'’s print differs in type in '+(4-n)+' of 4 quadrants. <b>A clear difference in type excludes Suspect '+SUS[i]+'.</b>';}
    const P=fullPerson(sim),q=p.quad;let s=(p.labels||hon?'The '+QN[q]+' quadrant is type '+TN[P.types[q]]+', '+TD[P.types[q]]+'.':'The magnifier shows the '+QN[q]+' quadrant. <b>Which of the six types covers most of it?</b>');
    if(hon&&p.pressure==='heavy')s+=' <b>Pressing hard squeezes the grooves shut</b>, so many of them vanish from the print.';else if(hon&&p.pressure==='light')s+=' <b>A light press leaves gaps</b> where the lips never touched the card.';
    if(atLeast('ap')&&p.smear)s+=' The lips slid as they pressed, so the grooves are doubled and streaked.';return s;},
  tour:[
    {title:'Grooves on your lips',text:{bio:'The red part of your lips is covered with small grooves, like the ridges on a fingertip. Press your lips on a card and the grooves show as pale lines.',honors:'The lip grooves (sulci labiorum) form before birth and are thought to stay the same through life. Studying lip prints is called cheiloscopy.'},focus:[CX-230,CY-120,460,240],pause:true,setup(sim){BioLab.setValues(sim,{mode:'print',labels:false,pressure:'normal',smear:false});syncMode(sim);}},
    {title:'Six groove types',text:'Suzuki and Tsuchihashi sorted lip grooves into six types: I complete vertical, I′ incomplete vertical, II branched, III crossed, IV net-like and V undetermined.',focus:[20,30,540,410],pause:true,setup(sim){BioLab.setValues(sim,{mode:'types',type:'II'});syncMode(sim);}},
    {title:'Four quadrants',text:'Split the print with a line down the middle and the line where the lips meet. That makes four quadrants: upper right, upper left, lower right and lower left. Right and left are the person’s own, so the upper right is on your left.',focus:[CX-240,CY-120,480,250],pause:true,setup(sim){BioLab.setValues(sim,{mode:'print',labels:false});syncMode(sim);}},
    {title:'Classify each quadrant',text:'Look at one quadrant at a time through the magnifier and record the type that covers most of it. The four types together are the print’s classification.',focus:[[CX-240,CY-120,480,250],[PX,30,PW,400]],pause:true,setup(sim){BioLab.setValues(sim,{labels:true,quad:'UL'});}},
    {title:'How you press matters',text:'Press hard and the grooves squeeze shut; press too lightly and parts of the lips never touch. A good reference print uses relaxed, closed lips and light, even pressure.',focus:[CX-240,CY-120,480,250],pause:true,setup(sim){BioLab.setValues(sim,{pressure:'heavy',labels:false});}},
    {title:'Where prints are found',text:'Lip prints turn up on glasses, cups, cigarette butts, napkins and letters. The saliva on the same spot can carry DNA, so the rim is swabbed too.',focus:[20,30,540,410],pause:true,setup(sim){BioLab.setValues(sim,{mode:'where',surface:'glass',pressure:'normal'});syncMode(sim);}},
    {title:'Same type is not a match',text:'Here a suspect’s print has the same type in all four quadrants as the evidence. Under the magnifier, the grooves fall in different places. Type only narrows the field.',focus:[20,30,770,410],pause:true,setup(sim){const C=fullCase(sim);BioLab.setValues(sim,{mode:'compare',suspect:C.near,cquad:'UR'});syncMode(sim);}},
    {lvl:'honors',title:'The limits',text:'Lip prints change with pressure, smearing and lip movement, few studies have tested how well examiners match them, and courts rarely admit them. A DNA profile from the saliva is the strong evidence.',focus:[20,30,770,410],pause:true,setup(sim){const C=fullCase(sim);BioLab.setValues(sim,{mode:'compare',suspect:C.src});}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);BioLab.refresh(sim);sim.infoDirty=true;}},
  challenges(sim){const C=fullCase(sim),nl=SUS[C.near];return [
    {lvl:'bio',instant:true,set:{mode:'compare',suspect:C.near},q:'Suspect '+nl+'’s lip print has the same groove type as the evidence in all four quadrants. Does that show Suspect '+nl+' drank from the glass?',choices:['Yes, all four quadrants match','No: many people share types; the individual grooves must line up too','Only if the prints are the same size'],correct:1,
     explain:'The model now shows Suspect '+nl+'. The types agree, but under the magnifier the grooves, branches and crossings fall in different places. Groove type is a class characteristic, like a loop in a fingerprint.'},
    {lvl:'bio',instant:true,set:{mode:'types',type:'II'},q:'Lip grooves that start straight and then split in two, like the letter Y, are which type?',choices:['Type I','Type II','Type IV'],correct:1,
     explain:'Type II is branched. Type I runs straight across the whole lip, and type IV joins into a net.'},
    {lvl:'bio',instant:true,set:{mode:'where',surface:'glass'},q:'A lip print is on the rim of a drinking glass. What else should be collected from the same spot?',choices:['Nothing: the print is the evidence','A swab for DNA from saliva and skin cells','A sample of the drink only'],correct:1,
     explain:'Lips leave saliva and skin cells on the rim, which can give a DNA profile. A DNA profile can point to one person; a lip print pattern has never been tested well enough to do that.'},
    {lvl:'honors',instant:true,set:{mode:'types',type:'Ip'},q:'A quadrant has vertical grooves, but most of them stop partway and do not cross the whole height of the lip. Which type is it?',choices:['Type I','Type I′','Type V'],correct:1,
     explain:'Type I′ is incomplete vertical. Type I grooves run the full height of the lip; type V is for patterns that fit no type.'},
    {lvl:'honors',instant:true,set:{mode:'print',pressure:'heavy',labels:false},q:'You press your lips down hard on the card. What happens to the print?',choices:['It gets sharper, with more grooves','Many grooves squeeze shut and vanish, so it is harder to classify','Nothing changes'],correct:1,
     explain:'The model now shows a hard press: the lip tissue flattens and many grooves close. A good reference print uses relaxed, closed lips and light, even pressure, and an evidence print may have been made at any pressure.'},
    {lvl:'honors',instant:true,set:{mode:'print',quad:'UR',labels:true},q:'You face a lip print on a card. On which side is the upper right quadrant?',choices:['On your right','On your left: right means the person’s own right','On top in the middle'],correct:1,
     explain:'Quadrants are named for the person’s own right and left, as when you face them. So the upper right quadrant (UR) is on your left.'},
    {lvl:'ap',instant:true,set:{mode:'compare',suspect:C.src},q:'Suppose type II is found in 30% of upper right quadrants, type III in 20% of upper left, type I in 20% of lower right and type IV in 10% of lower left, and the quadrants are independent. In a city of 50,000 adults, about how many would share the code UR II, UL III, LR I, LL IV?',choices:['None: the code is unique','About 60','About 6,000'],correct:1,
     explain:'0.30 × 0.20 × 0.20 × 0.10 = 0.0012, and 0.0012 × 50,000 = 60 people. Type codes narrow the field but do not identify. These percentages are made up for the exercise: real frequencies vary between studies and populations, and the quadrants may not be independent.'},
    {lvl:'ap',instant:true,set:{mode:'where',surface:'napkin'},q:'A long-lasting lipstick leaves an almost invisible print on a paper napkin. Which method is designed to show it?',choices:['Ninhydrin, because lips sweat a lot','A fat-soluble dye such as Nile red or Sudan black, which stains the oils and waxes in the lipstick','Nothing can show it'],correct:1,
     explain:'The lip surface has almost no sweat glands, so ninhydrin has little to react with. Lysochrome dyes dissolve in the oils and waxes of the lipstick and stain them, the way they stain fat in biology labs.'},
    {lvl:'ap',instant:true,set:{mode:'compare',suspect:C.src},q:'Why are lip prints rarely accepted in court as proof of who left them?',choices:['Lip grooves are not individual at all','Few studies have tested examiners, there is no known error rate, and a print changes with pressure and movement','Lips change their pattern every few weeks'],correct:1,
     explain:'Lip prints are believed to be individual and stable, but that has been studied far less than fingerprints. Without large validation studies, an examiner cannot say how often two people’s prints would look alike, or how often examiners make mistakes.'}
  ];},
  lab:{bio:'<p><b>Question:</b> How do the six groove types look, and how do you classify a whole print?</p><ol><li>In The six groove types, look at each type and sketch it in your notes.</li><li>In Classify a print, use the magnifier on each quadrant and write the type you see. Then turn on the labels to check.</li><li>Press New person and classify three more prints.</li></ol><p>Which types were easiest to confuse? Why does a print need four quadrants instead of one type?</p>',
       honors:'<p><b>Question:</b> How does the way a print is made change its classification?</p><ol><li>Classify one person’s print with relaxed, even pressure.</li><li>Classify it again pressed lightly, then pressed hard.</li><li>Record which quadrants you could still classify each time.</li></ol><p>Explain why a reference print is made with relaxed, closed lips, and why an evidence print on a glass may be hard to compare.</p>',
       ap:'<p><b>Question:</b> How much does a type code narrow the field?</p><ol><li>Press New case five times. For each case, record how many suspects share all four types with the evidence.</li><li>For those suspects, compare the groove detail with the magnifier.</li><li>Use the probability challenge to estimate how many people in a city share a type code.</li></ol><p><b>Claim–evidence–reasoning:</b> Can a lip print type code identify a person? Explain what the groove detail adds and what is still missing before lip prints could be used to identify someone.</p>'},
  terms:[{t:'Cheiloscopy',d:'The study of lip prints. From the Greek cheilos, lip.'},{t:'Lip grooves',d:'The small furrows on the red part of the lips (the vermilion). They show as pale lines in a print.'},{t:'Quadrant',d:'One quarter of a lip print: upper right, upper left, lower right or lower left, named for the person’s own right and left.'},
    {t:'Suzuki–Tsuchihashi types',d:'Six groove types: I complete vertical, I′ incomplete vertical, II branched, III intersecting, IV reticular, V undetermined.'},
    {lvl:'honors',t:'Reference print',d:'A known print made on purpose, with relaxed, closed lips and even pressure, to compare with evidence.'},{lvl:'honors',t:'Class vs individual characteristic',d:'Groove type is shared by many people (class). The exact arrangement of grooves is thought to be individual.'},{lvl:'honors',t:'Porous / nonporous',d:'Paper and cigarette filters soak things up; glass and plastic hold the print on the surface.'},
    {lvl:'ap',t:'Lysochrome',d:'A fat-soluble dye, such as Nile red or Sudan black, that stains oils and waxes, used to show lipstick prints.'},{lvl:'ap',t:'Validation study',d:'A test of how often a method gives the right answer and how often examiners err. Cheiloscopy has had few.'}],
  about:'<p><b>Prints.</b> Each print is drawn procedurally. Each quadrant gets a dominant type, and its grooves are generated in a frame running from the mouth line to the border of the lip, spaced about 1.5–2.2 mm apart and fanning slightly toward the corners. Types I and II quadrants also carry a short minority groove, as real prints mix types. The lip outline (52 mm wide, upper lip about 9 mm, lower about 11 mm tall) is an illustrative average.</p><p><b>Type frequencies.</b> The chance of each type in a quadrant (I 20%, I′ 15%, II 25%, III 17%, IV 13%, V 10%) is an illustrative mix. Published studies often find types I, II and III common, but the numbers vary a lot between populations and studies.</p><p><b>Evidence prints.</b> A print from a glass rim is shown after dusting and lifting: it is partial (the corners are missing), slightly stretched, and sometimes one quadrant is smeared. Hard pressure closes about 40% of the grooves; a light press leaves gaps; sliding lips double the grooves.</p><p><b>Limits.</b> Lip prints are widely believed to be individual and stable, like fingerprints, but this rests on small studies. There are no large validation studies or known error rates, and courts have admitted lip-print comparisons only rarely. Saliva on the same surface can yield DNA, which is far stronger evidence. All cases and people here are fictional.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);syncLight(sim);
    if(isLab(sim)){drawBench(sim,ctx,k);return;}const m=sim.p.mode;if(m==='types')drawTypes(sim,ctx,k);else if(m==='where')drawWhere(sim,ctx,k);else if(m==='compare')drawCompare(sim,ctx,k);else drawFullPrint(sim,ctx,k);},
  thumbSetup(sim){sim.p.mode='print';},thumbFrames:4,
  benchRead(sim){if(!isLab(sim))return null;const C=vCase(sim.vlab),B=sim.vlab.bench,T=P=>Object.assign({},P.types);
    return {view:sim.p.lpView,sus:sim.p.lpSus,quad:sim.p.lpQuad,ref:B.ref||0,ev:B.ev||0,smear:C.smear,close:C.close,src:SUS[C.src],near:SUS[C.near],
      types:{R:T(C.ref),E:T(C.sus[C.src]),A:T(C.sus[0]),B:T(C.sus[1]),C:T(C.sus[2]),D:T(C.sus[3])}};}
};

/* ---------- Full lab views ---------- */
function drawTypes(sim,ctx,k){const sel=sim.p.type;const cw=166,ch=150,gx=14,gy=34;
  TYPES.forEach((t,i)=>{const x=24+(i%3)*(cw+gx),y=gy+Math.floor(i/3)*(ch+38);const on=t===sel;
    ctx.fillStyle=PAPER;rr(ctx,x,y+22,cw,ch-22,8);ctx.fill();ctx.strokeStyle=on?PAL['rj']:PAL['line'];ctx.lineWidth=on?3:1;ctx.stroke();
    ctx.save();rr(ctx,x+8,y+30,cw-16,ch-38,6);ctx.clip();const sc=(cw-16)/22;ctx.translate(x+8,y+30);ctx.scale(sc,sc);ctx.fillStyle=LIP;ctx.fillRect(0,0,22,20);
    ctx.strokeStyle=PAPER;ctx.lineCap='round';ctx.lineWidth=0.26;patch(t).forEach(pl=>{ctx.beginPath();pl.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});ctx.restore();
    txt(ctx,'Type '+TN[t],x+4,y+12,{s:14*k,w:700,c:on?PAL['rj']:PAL['cv-ink']});});
  panel(ctx,PX,30,PW,400);textBlock(ctx,[{t:'Type '+TN[sel],s:16,w:700},{t:TD[sel],s:14,w:700,c:PAL['rj']},{t:atLeast('honors')?'Each patch is a strip of lip about 22 mm wide, from the mouth line (top) to the border of the lip (bottom).':'Pale lines are the grooves; the color is lipstick on the ridges.',s:12.5,c:PAL['cv-soft']}],PX+14,44,PW-28,420,k);}
function printCard(ctx,cx,cy,sc){card(ctx,cx-(W/2+8)*sc,cy-(HU+9)*sc,(W+16)*sc,(HU+HL+18)*sc);}
function drawFullPrint(sim,ctx,k){const p=sim.p,P=fullPerson(sim),hon=atLeast('honors'),ap=atLeast('ap');const o={cx:CX,cy:CY,sc:SC,ink:LIP,paper:PAPER,pressure:hon?p.pressure:'normal'};
  printCard(ctx,CX,CY,SC);drawPrint(ctx,P,o);if(ap&&p.smear){drawPrint(ctx,P,Object.assign({},o,{cx:CX+5,cy:CY+1.5,alpha:0.45}));}
  guides(ctx,o,k,p.labels?Object.fromEntries(QS.map(q=>[q,q+': '+TN[P.types[q]]])):null);
  txt(ctx,'Person’s right',CX-(W/2)*SC,CY-(HU+12)*SC-4,{s:12*k,c:PAL['cv-soft']});txt(ctx,'Person’s left',CX+(W/2)*SC,CY-(HU+12)*SC-4,{s:12*k,c:PAL['cv-soft'],a:'right'});
  const c=qCenter(p.quad);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(CX+c[0]*SC,CY+c[1]*SC,6*SC*0.8,0,TAU);ctx.stroke();
  panel(ctx,PX,30,PW,400);const zr=k>1.35?88:96;loupe(ctx,P,o,p.quad,PX+PW/2,60+zr+(k>1.35?20:12),zr,2.2,k,'Magnifier: '+p.quad);
  textBlock(ctx,[{t:QN[p.quad]+' quadrant',s:13.5,w:700},{t:p.labels?'Type '+TN[P.types[p.quad]]+': '+TS[P.types[p.quad]]:'Which type covers most of it?',s:13,c:PAL['cv-soft']}],PX+14,72+2*zr+(k>1.35?24:14),PW-28,424,k);}
function drawWhere(sim,ctx,k){const s=sim.p.surface,w=WHERE[s],P=fullPerson(sim);const ink=s==='butt'?'#b8485c':LIP;
  if(s==='glass'||s==='cup'){const x0=150,x1=430,y0=70,y1=420;ctx.fillStyle=s==='glass'?'rgba(170,205,225,.35)':'#f2efe6';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.lineTo(x1-30,y1);ctx.lineTo(x0+30,y1);ctx.closePath();ctx.fill();ctx.strokeStyle=s==='glass'?'rgba(90,140,170,.9)':'#b9b3a2';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.ellipse((x0+x1)/2,y0,(x1-x0)/2,16,0,0,TAU);ctx.stroke();if(s==='cup'){ctx.fillStyle='#3b3b40';ctx.beginPath();ctx.ellipse((x0+x1)/2,y0,(x1-x0)/2+8,20,0,0,TAU);ctx.fill();ctx.fillStyle='#111';rr(ctx,(x0+x1)/2-60,y0-6,26,10,4);ctx.fill();}
    drawPrint(ctx,P,{cx:(x0+x1)/2-(s==='cup'?47:0),cy:y0+(s==='cup'?-1:30),sc:s==='cup'?1.6:3.2,ink,paper:s==='glass'?'rgba(230,240,245,.9)':'#3b3b40',clip:true,alpha:0.85});}
  else if(s==='butt'){ctx.fillStyle='#f3f1ea';rr(ctx,130,200,260,60,8);ctx.fill();ctx.fillStyle='#d9a35b';rr(ctx,330,200,140,60,8);ctx.fill();ctx.fillStyle='rgba(120,70,30,.4)';for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(340+(i*37)%120,206+(i*17)%48,1.6,0,TAU);ctx.fill();}
    ctx.fillStyle='#555';ctx.beginPath();ctx.ellipse(130,230,10,30,0,0,TAU);ctx.fill();drawPrint(ctx,P,{cx:410,cy:230,sc:1.9,ink,paper:'#d9a35b',clip:true,alpha:0.8});}
  else{card(ctx,90,70,410,320,s==='letter');if(s==='napkin'){ctx.strokeStyle='#e4e0d3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(295,70);ctx.lineTo(295,390);ctx.moveTo(90,230);ctx.lineTo(500,230);ctx.stroke();}
    if(s==='letter')['Dear J,','I will be there at nine.','Burn this.'].forEach((t,i)=>txt(ctx,t,110,116+i*24,{s:14*k,c:'#2c3e6b'}));
    drawPrint(ctx,P,{cx:300,cy:s==='letter'?316:230,sc:4,ink,paper:PAPER,alpha:s==='napkin'?0.6:0.9,pressure:s==='napkin'?'light':'normal'});}
  txt(ctx,w.l,20,24,{s:14*k,w:700});
  panel(ctx,PX,30,PW,400);textBlock(ctx,[{t:w.por?'Porous surface':'Nonporous surface',s:14,w:700},{t:w.col,s:13},{t:'DNA: '+w.dna,s:13,w:700,c:PAL['rj']}],PX+14,44,PW-28,424,k);}
function drawCompare(sim,ctx,k){const C=fullCase(sim),i=sim.p.suspect,E=C.sus[C.src],S=C.sus[i],hon=atLeast('honors');const sc=4.6;
  const oE={cx:150,cy:112,sc,ink:POW,paper:PAPER,clip:true,smear:C.smear,sx:C.sx},oS={cx:420,cy:112,sc,ink:LIP,paper:PAPER};
  card(ctx,20,40,262,150);card(ctx,290,40,262,150);drawPrint(ctx,E,oE);drawPrint(ctx,S,oS);
  txt(ctx,'Evidence (glass rim, lifted)',151,30,{s:12.5*k,w:700,a:'center'});txt(ctx,'Suspect '+SUS[i],421,30,{s:12.5*k,w:700,a:'center'});
  [[oE,E],[oS,S]].forEach(([o,P])=>{QS.forEach(q=>{const c=qCenter(q),same=E.types[q]===S.types[q];pill(ctx,TN[P.types[q]],o.cx+c[0]*sc*1.25,o.cy+(q[0]==='U'?-(HU+4.5):(HL+4.5))*sc,same?PAL['s3']:PAL['s1'],'#fff',12*k);});});
  if(hon){const q=sim.p.cquad,zr=k>1.35?80:92;loupe(ctx,E,oE,q,150,330,zr,3.6/sc*SC*0.6,k,'');loupe(ctx,S,oS,q,420,330,zr,3.6/sc*SC*0.6,k,'');txt(ctx,'Magnifier: '+q,285,226,{s:12.5*k,w:700,a:'center',b:'middle'});}
  else textBlock(ctx,[{t:'Green: same type as the evidence. Red: a different type.',s:13,c:PAL['cv-soft']},{t:'Closer look adds a magnifier to compare the grooves themselves.',s:13,c:PAL['cv-soft']}],30,240,520,430,k);
  const ty=30,th=(400-3*8)/4;SUS.forEach((l,j)=>{const y=ty+j*(th+8),sel=j===i;ctx.fillStyle=PAL['card'];rr(ctx,PX,y,PW,th,10);ctx.fill();ctx.strokeStyle=sel?PAL['rj']:PAL['line'];ctx.lineWidth=sel?3:1;ctx.stroke();
    txt(ctx,'Suspect '+l,PX+12,y+22*Math.min(k,1.3),{s:14*k,w:700});txt(ctx,agreeN(C,j)+' of 4 types agree',PX+12,y+22*Math.min(k,1.3)+17*k,{s:12.5*k,c:PAL['cv-soft']});
    const v=verdict(C,j);txt(ctx,v.startsWith('Cannot')?'Not excluded':'Excluded',PX+PW-10,y+22*Math.min(k,1.3),{s:12*k,w:700,a:'right',c:v.startsWith('Cannot')?PAL['s3']:PAL['s1']});});}

/* ---------- the virtual lab bench ---------- */
function drawLips(ctx,cx,cy,sc,col){ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.fillStyle='#e2b49a';rr(ctx,-W/2-14,-HU-12,W+28,HU+HL+24,14);ctx.fill();ctx.fillStyle=col;lipPath(ctx);ctx.fill();ctx.strokeStyle='rgba(80,30,30,.5)';ctx.lineWidth=0.3;lipPath(ctx);ctx.stroke();ctx.restore();}
function drawBench(sim,ctx,k){const V=sim.vlab,C=vCase(V),p=sim.p,B=V.bench,v=p.lpView;let P=null,o=null,title='',status=[];
  if(v==='ref'){const st=B.ref||0;title='Your reference print';
    if(st<2){drawLips(ctx,CX,CY,SC,st>=1?LIP:'#c98585');status=[{t:st?'Lipstick on.':'Your lips, relaxed and closed.',s:14,w:700},{t:st?'Next, press clear tape on your closed lips.':'Start by putting on lipstick.',s:13,c:PAL['cv-soft']}];}
    else{if(st>=3)printCard(ctx,CX,CY,SC);P=C.ref;o={cx:CX,cy:CY,sc:SC,ink:LIP,paper:st>=3?PAPER:'rgba(235,240,245,.95)'};if(st===2){ctx.fillStyle='rgba(225,235,245,.8)';rr(ctx,CX-(W/2+8)*SC,CY-(HU+8)*SC,(W+16)*SC,(HU+HL+16)*SC,4);ctx.fill();}
      drawPrint(ctx,P,o);if(st===2){ctx.strokeStyle='rgba(120,150,180,.8)';ctx.lineWidth=1.5;rr(ctx,CX-(W/2+8)*SC,CY-(HU+8)*SC,(W+16)*SC,(HU+HL+16)*SC,4);ctx.stroke();status=[{t:'The print is on the tape.',s:14,w:700},{t:'Stick the tape on an index card.',s:13,c:PAL['cv-soft']}];}}}
  else if(v==='evidence'){const st=B.ev||0;title=st>=3?'Evidence print, lifted onto a card':'Evidence: drinking glass from the scene';
    if(st<3){const x0=170,x1=410,y0=90,y1=420;ctx.fillStyle='rgba(170,205,225,.30)';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.lineTo(x1-26,y1);ctx.lineTo(x0+26,y1);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(90,140,170,.9)';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.ellipse((x0+x1)/2,y0,(x1-x0)/2,14,0,0,TAU);ctx.stroke();
      drawPrint(ctx,C.sus[C.src],{cx:290,cy:y0+34,sc:3.6,ink:st>=2?POW:'rgba(200,210,215,.55)',paper:'rgba(225,238,245,.9)',clip:true,smear:C.smear,sx:C.sx,alpha:st>=2?0.9:0.5});
      if(st>=1){ctx.fillStyle='#f4f4f4';ctx.strokeStyle='#888';ctx.lineWidth=1;rr(ctx,430,380,80,10,4);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(512,385,12,8,0,0,TAU);ctx.fill();ctx.stroke();txt(ctx,'DNA swab',470,410,{s:12*k,a:'center',c:PAL['cv-soft']});}
      status=[{t:st===0?'A faint print on the rim.':st===1?'Rim swabbed for DNA.':'Print dusted with black powder.',s:14,w:700},{t:st===0?'Swab the rim for DNA before anything touches it.':st===1?'Now dust the print with black powder.':'Lift it with clear tape onto a white card.',s:13,c:PAL['cv-soft']}];}
    else{printCard(ctx,CX,CY,SC);P=C.sus[C.src];o={cx:CX,cy:CY,sc:SC,ink:POW,paper:PAPER,clip:true,smear:C.smear,sx:C.sx};drawPrint(ctx,P,o);}}
  else if(v==='suspect'){title='Suspect '+p.lpSus+': known print';printCard(ctx,CX,CY,SC);P=C.sus[SUS.indexOf(p.lpSus)];o={cx:CX,cy:CY,sc:SC,ink:LIP,paper:PAPER};drawPrint(ctx,P,o);}
  else{const E=C.sus[C.src],S=C.sus[SUS.indexOf(p.lpSus)],q=p.lpQuad,zr=k>1.35?120:136;const oE={cx:0,cy:0,sc:SC,ink:POW,paper:PAPER,clip:true,smear:C.smear,sx:C.sx},oS={cx:0,cy:0,sc:SC,ink:LIP,paper:PAPER};
    if(!(B.ev>=3)){txt(ctx,'Lift the evidence print first.',CX,CY,{s:15*k,w:700,a:'center'});}
    else{loupe(ctx,E,oE,q,150,250,zr,2.2,k,'Evidence');loupe(ctx,S,oS,q,430,250,zr,2.2,k,'Suspect '+p.lpSus);}
    txt(ctx,'Side by side: '+QN[q]+' quadrant',20,24,{s:14*k,w:700});
    panel(ctx,PX,30,PW,400);textBlock(ctx,[{t:'Compare the detail',s:14,w:700},{t:'Look for the same grooves in the same places: where they branch, where they cross, where they stop.',s:13},{t:'Check all four quadrants before you decide.',s:13,c:PAL['cv-soft']}],PX+14,44,PW-28,424,k);return;}
  txt(ctx,title,20,24,{s:14*k,w:700});
  if(P){guides(ctx,o,k,{UR:'UR',UL:'UL',LR:'LR',LL:'LL'});txt(ctx,'Person’s right',CX-(W/2)*SC,CY-(HU+12)*SC-6,{s:12*k,c:PAL['cv-soft']});txt(ctx,'Person’s left',CX+(W/2)*SC,CY-(HU+12)*SC-6,{s:12*k,c:PAL['cv-soft'],a:'right'});
    const q=p.lpQuad,c=qCenter(q);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(CX+c[0]*SC,CY+c[1]*SC,6*SC*0.8,0,TAU);ctx.stroke();
    panel(ctx,PX,30,PW,400);const zr=k>1.35?88:96;loupe(ctx,P,o,q,PX+PW/2,60+zr+(k>1.35?20:12),zr,2.2,k,'Magnifier: '+q);
    textBlock(ctx,[{t:QN[q]+' quadrant',s:13.5,w:700},{t:'Which type covers most of it?',s:13,c:PAL['cv-soft']}],PX+14,72+2*zr+(k>1.35?24:14),PW-28,424,k);}
  else{panel(ctx,PX,30,PW,400);textBlock(ctx,status,PX+14,44,PW-28,424,k);}}

/* ---------- the virtual lab: Lab 3: Cheiloscopy (Forensic Science, Glugoski) ---------- */
const ROWS=['R','E','A','B','C','D'],RL=['Your reference print','Evidence (glass rim)','Suspect A','Suspect B','Suspect C','Suspect D'];
const TOPT=TYPES.map(t=>({v:t,l:'Type '+TN[t]}));
const cv=sim=>sim.vlab?vCase(sim.vlab):null;
function typeCheck(q){return (sim,row,v)=>{const C=cv(sim);if(!C)return null;const B=sim.vlab.bench;
  if(row==='R'&&!(B.ref>=3))return 'Make your reference print on the index card first.';if(row==='E'&&!(B.ev>=3))return 'Lift the evidence print onto a card first.';
  const P=row==='R'?C.ref:row==='E'?C.sus[C.src]:C.sus[SUS.indexOf(row)];if(v===P.types[q])return null;if(row==='E'&&C.smear===q&&v==='V')return null;
  return 'Look at this quadrant again through the magnifier. Which pattern do most of the grooves follow?';};}
const rowFull=(V,row)=>QS.every(q=>V.raw('c:t1:'+q+':'+row).trim()!=='');
const LSET=(sim,o)=>BioLab.setValues(sim,o);
const LAB_LP={id:'lipprint-match',title:'Lab 3: Cheiloscopy',course:'Forensic Science',teachers:'Glugoski',
  source:{label:'Lab 3: Cheiloscopy (Week 3, Fingerprinting)',href:'https://rjhs.instructure.com/courses/16619/assignments/612884'},level:'honors',
  purpose:'<p>Make your own lip print and classify it. Then classify a lip print lifted from a drinking glass at a crime scene, quadrant by quadrant, compare it with prints from four suspects, and decide which suspects you can exclude.</p>',
  background:'<p>The red part of your lips is covered with small grooves. When you press your lips on a surface, the grooves show as pale lines in the print. The study of lip prints is called <b>cheiloscopy</b>. Lip grooves are believed to be unique to each person and to stay the same through life, like fingerprints, but they have been studied much less.</p>'+
    '<p>To classify a print, divide it into four <b>quadrants</b> with a line down the middle and the line where the lips meet: upper right, upper left, lower right and lower left. Right and left are the person’s own, so as you face the print, the upper right is on your left. For each quadrant, record the type that covers most of it, using the <b>Suzuki–Tsuchihashi</b> system:</p>'+
    '<ul><li><b>Type I</b>: clear vertical grooves that run across the whole lip</li><li><b>Type I′</b>: vertical grooves that stop partway</li><li><b>Type II</b>: branched grooves, like a Y</li><li><b>Type III</b>: intersecting grooves, like an X</li><li><b>Type IV</b>: reticular grooves that form a net or grid</li><li><b>Type V</b>: undetermined, a pattern that fits no other type</li></ul>'+
    '<p>Lip prints are found on glasses, cups, cigarette butts, napkins and letters. The same spot often carries <b>saliva and skin cells</b>, which can give a DNA profile. Groove type is a class characteristic: many people share a type, so matching types do not identify anyone. Pressure, smearing and lip movement change a print, and courts have rarely accepted lip prints.</p>'+
    '<p><b>About the virtual bench.</b> The case and suspects are fictional, and every student’s prints are different. Your “own” print is simulated.</p>',
  materials:['Lipstick (or lip balm and fingerprint powder)','Clear tape and white index cards','Magnifying glass','Evidence: a drinking glass from the scene','Cotton swab and sterile water for DNA','Black fingerprint powder and brush','Known lip prints from Suspects A, B, C and D','Gloves'],
  hypothesis:{prompt:'<p>Before you start: do you think two people could have the same groove type in all four quadrants? Could a lip print alone prove who drank from the glass? Explain.</p>'},
  setup(sim){VCASE=null;vCase(sim.vlab);},
  teardown(){VCASE=null;},
  controls:['lpView','lpSus','lpQuad'],
  steps:[
    {title:'Make your reference print',text:'<p>Put on lipstick. Relax your lips and keep them closed. Press a strip of clear tape across your lips with light, even pressure, peel it off, and stick it on a white index card.</p><p>Use the buttons in order. In the Observations box, note how you pressed and anything that went wrong.</p>',controls:['lipstick','tape','card'],setup(sim){LSET(sim,{lpView:'ref',lpQuad:'UR'});},done:sim=>sim.vlab.bench.ref>=3,doneHint:'Finish your print: lipstick, tape, then the index card.'},
    {title:'Classify your reference print',text:'<p>Look at each quadrant through the magnifier. Record the type that covers most of each quadrant in the <b>Your reference print</b> row.</p>',controls:['lpQuad'],setup(sim){LSET(sim,{lpView:'ref'});},done:sim=>rowFull(sim.vlab,0),doneHint:'Classify all four quadrants of your print.'},
    {title:'Collect the evidence print',text:'<p>Put on gloves. A drinking glass from the scene has a lip print on the rim. First <b>swab the rim</b> for saliva and skin cells for DNA, away from the print’s grooves. Then <b>dust the print</b> with black powder and <b>lift it</b> with clear tape onto a white card.</p>',controls:['swab','dust','lift'],setup(sim){LSET(sim,{lpView:'evidence'});},done:sim=>sim.vlab.bench.ev>=3,doneHint:'Swab, dust and lift the print.'},
    {title:'Classify the evidence',text:'<p>Classify each quadrant of the evidence print. Parts of a print from a glass are often missing or smudged. If you cannot tell a quadrant’s type, record Type V (undetermined). Describe the print’s condition in the Observations box.</p>',controls:['lpQuad'],setup(sim){LSET(sim,{lpView:'evidence'});},done:sim=>rowFull(sim.vlab,1),doneHint:'Classify all four quadrants of the evidence.'},
    {title:'Classify the suspects’ prints',text:'<p>Each suspect made a known print the same way you made yours. Classify all four quadrants of each suspect’s print in the Suspect rows.</p>',controls:['lpSus','lpQuad'],setup(sim){LSET(sim,{lpView:'suspect'});},done:sim=>[2,3,4,5].every(r=>rowFull(sim.vlab,r)),doneHint:'Classify all four suspects’ prints.'},
    {title:'Compare the detail',text:'<p>Count the quadrants where each suspect’s type matches the evidence and record it. Then use <b>Side by side</b> to compare the grooves themselves, quadrant by quadrant: do the same grooves branch, cross and stop in the same places? Record what you see and whether each suspect is excluded.</p>',controls:['lpSus','lpQuad'],setup(sim){LSET(sim,{lpView:'side'});}},
    {title:'Conclude',text:'<p>Use your tables and the graph to answer the questions. Then write your conclusion, with your confidence and the limitations of lip-print evidence.</p>',controls:['lpView','lpSus','lpQuad']}
  ],
  tables:[
    {id:'t1',title:'Dominant groove type in each quadrant',cols:[{id:'p',label:'Print',rows:ROWS,rowLabels:RL}].concat(QS.map(q=>({id:q,label:QN[q][0].toUpperCase()+QN[q].slice(1)+' ('+q+')',input:'select',options:TOPT,check:typeCheck(q)})))},
    {id:'t2',title:'Comparison with the evidence',cols:[{id:'s',label:'Suspect',rows:SUS,rowLabels:SUS.map(l=>'Suspect '+l)},
      {id:'agree',label:'Quadrants with the same type (0–4)',dp:0,check(sim,row,v){const V=sim.vlab;if(!V)return null;const rs=ROWS.indexOf(row);
        if(!rowFull(V,1)||!rowFull(V,rs))return 'Classify all four quadrants of the evidence and of Suspect '+row+' first.';const n=QS.filter(q=>V.raw('c:t1:'+q+':1')===V.raw('c:t1:'+q+':'+rs)).length;
        return v===n?null:'Count again from your table: in how many quadrants is Suspect '+row+'’s type the same as the evidence?';}},
      {id:'detail',label:'Groove detail under the magnifier',input:'select',options:[{v:'agrees',l:'Agrees'},{v:'differs',l:'Differs'},{v:'unclear',l:'Cannot tell'}]},
      {id:'call',label:'Conclusion',input:'select',options:[{v:'cannot',l:'Cannot be excluded'},{v:'excluded',l:'Excluded'}]}]}
  ],
  observations:[{id:'ref',label:'Your reference print: how you pressed, and how clear it came out'},{id:'ev',label:'The evidence print: which parts are clear, smudged or missing'}],
  graph:{type:'bar',title:'Quadrants whose type matches the evidence',xl:'Suspect',yl:'Quadrants with the same type',ymin:0,ymax:4,series:[{table:'t2',x:'s',y:'agree',label:'Same type'}]},
  questions:[
    {id:'q1',q:'<p>Write your reference print’s classification as a code, for example UR II, UL III, LR I′, LL IV.</p>'},
    {id:'q2',q:'<p>Which suspects could you exclude by groove type alone? Which needed the magnifier?</p>'},
    {id:'q3',q:'<p>Are lip prints unique? Give the evidence for and against, from this lab and your notes.</p>'},
    {id:'q4',q:'<p>List four places at a crime scene where lip prints might be found.</p>'},
    {id:'q5',q:'<p>Why was the rim swabbed before it was dusted? What could the swab show that the print cannot?</p>'},
    {id:'q6',q:'<p>Describe three things that can change a lip print or make it hard to compare.</p>'},
    {id:'q7',n:'Confidence',q:'<p>State your confidence in your conclusion (low, moderate or high) and list its limitations, including whether a court would accept it.</p>',fields:[{id:'conf',label:'Confidence'},{id:'lim',label:'Limitations'}]}],
  conclusion:{prompt:'<p>Write a claim–evidence–reasoning conclusion: which suspect, if any, could have left the print on the glass, and how strongly does the lip print support that? Use your classification table and what you saw under the magnifier.</p>',cer:true}};
LP.labs=[LAB_LP];

/* ---------- the practical layer ---------- */
BioLab.addPractical({lipprints:{
  hookSet:{mode:'compare'},
  hook:'A lip print on a fictional party glass is classified UR, UL, LR and LL. Four guests gave known prints, and two of them have the same type in all four quadrants. Does a type code of four letters tell you who drank from the glass?',
  answer:'No. Two suspects share all four types with the evidence, because a type is a class characteristic. Only the magnifier separates them: one suspect’s grooves branch and cross in the same places as the evidence, the other’s do not. Even the one that agrees can only be called “cannot be excluded,” since no large study shows how often two people’s prints look alike. A DNA swab from the rim could settle it.',
  uses:[
    'Party cups and mugs: a print from a drinking glass is dusted and lifted with tape, the same way a fingerprint is, after the rim is swabbed for saliva DNA.',
    'Cigarette butts: the filter paper carries saliva, which is often a better DNA source than the print on its surface.',
    'Long-lasting lipstick: prints that look invisible can be stained with fat-soluble dyes such as Nile red, which color the oils and waxes in the lipstick.'
  ],
  takeaway:'Sort a lip print quadrant by quadrant, but remember that a matching type only narrows the field. Look at the grooves themselves, and trust a DNA swab of the same spot far more than the pattern.',
  lede:'The skin of your lips is covered with tiny grooves, like the ridges on your fingertips. Press your lips on a card, sort the grooves into six types, and compare a print left on a glass with suspects’ prints.',
  tour:[
    'The red part of your lips is covered with small grooves, like the ridges on a fingertip. Press your lips on a card, the way a lipstick mark ends up on a cup, and the grooves show as pale lines.',
    'Two Japanese researchers, Suzuki and Tsuchihashi, sorted lip grooves into six types: I straight across, I′ straight but stopping partway, II branched like a Y, III crossed like an X, IV a net like a waffle, and V anything else.',
    'Split the print with a line down the middle and the line where your lips meet. That makes four quadrants: upper right, upper left, lower right and lower left. They are named for the person’s own right and left, so the upper right is on your left as you look.',
    'Look at one quadrant at a time through the magnifier and record the type that covers most of it. The four types together are the print’s classification, a little like a four-letter code.',
    'Press hard and the grooves squeeze shut, like pressing a sponge flat; press too lightly and parts of the lips never touch. A good print uses relaxed, closed lips and light, even pressure.',
    'Lip prints turn up on glasses, cups, cigarette butts, napkins and letters. Saliva on the same spot can carry the person’s DNA, so investigators swab the rim before they dust it.',
    'This suspect’s print has the same type as the evidence in all four quadrants. Under the magnifier, the grooves fall in different places. A matching type only narrows the field, the way many people share a shoe size.'
  ]
}});
LP.onLevel=syncMode;
LP.controls[0].onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
['type','labels','quad','pressure','smear','surface','suspect','cquad'].forEach(id=>{const c=LP.controls.find(x=>x.id===id);c.onChange=sim=>{sim.infoDirty=true;};});
BioLab.register(LP);
})();

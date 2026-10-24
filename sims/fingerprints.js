(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText}=BioLab.h;
const TAU=Math.PI*2,W=150,H=200;

/* ---------- procedural prints ----------
   Ridges are fringes of a phase field: cos(Φ), Φ = 2πN·φ(u,v) + Σ s·atan2(v−y, u−x).
   φ gives the pattern (arch, loop, whorl); each atan2 "spiral" adds one minutia (Larkin & Fletcher 2007).
   Each minutia is nudged along the ridge gradient so its type (ridge ending vs bifurcation) is the one we label. */
const sp=(x,s)=>Math.log(1+Math.exp(x*s))/s;
function basePhase(P,u,v){const c=Math.cos(P.rot),s=Math.sin(P.rot),uu=c*u-s*v,vv=s*u+c*v,a=uu-P.core[0],b=vv-P.core[1];
  if(P.type==='arch')return vv+0.30*Math.exp(-uu*uu/0.25)*(1-0.4*vv);
  const wb=1/(1+Math.exp(-(b-P.db)/0.11));
  if(P.type==='whorl'){const r=Math.sqrt(a*a+b*b*1.1);return (1-wb)*r+wb*b;}
  const r=Math.sqrt(b*b+Math.pow(sp(a*P.dir,6),2));return (1-wb)*r+wb*b;}
function phaseAt(P,u,v,skip){let p=TAU*P.N*basePhase(P,u,v);P.vort.forEach((q,i)=>{if(i!==skip)p+=q.s*Math.atan2(v-q.y,u-q.x);});return p;}
const wrap=x=>{x=(x+Math.PI)%TAU;if(x<0)x+=TAU;return x-Math.PI;};
function nudge(P){for(let it=0;it<5;it++)P.vort.forEach((q,i)=>{const e=1e-3,p0=phaseAt(P,q.x,q.y,i),gx=(phaseAt(P,q.x+e,q.y,i)-p0)/e,gy=(phaseAt(P,q.x,q.y+e,i)-p0)/e,g2=gx*gx+gy*gy;
  const single=Math.atan2(gy,gx)+q.s*Math.PI/2,target=q.t==='bif'?0:Math.PI,d=wrap(target-(p0+q.s*single));q.x+=d*gx/g2;q.y+=d*gy/g2;});}
function toImg(P,a,b){const c=Math.cos(P.rot),s=Math.sin(P.rot);return [c*a+s*b,-s*a+c*b];}
function landmarks(P){const core=toImg(P,P.core[0],P.core[1]);const deltas=[];if(P.type==='arch')return {core:null,deltas};
  // deltas: saddles of the pattern field, found as local minima of |∇φ| below the core
  const g=(u,v)=>{const e=2e-3;return Math.hypot(basePhase(P,u+e,v)-basePhase(P,u-e,v),basePhase(P,u,v+e)-basePhase(P,u,v-e))/(2*e);};
  const cand=[];for(let v=-0.3;v<=0.9;v+=0.025)for(let u=-0.85;u<=0.85;u+=0.025){if(Math.hypot(u-core[0],v-core[1])<0.3||inMask(u,v)>0.72||v<core[1]+0.1)continue;if(P.type==='loop'&&(u-core[0])*P.dir<0.05)continue;cand.push([g(u,v),u,v]);}
  cand.sort((x,y)=>x[0]-y[0]);for(const c of cand){if(deltas.length>=(P.type==='whorl'?2:1))break;if(deltas.every(d=>Math.hypot(d[0]-c[1],d[1]-c[2])>0.4))deltas.push([c[1],c[2]]);}
  return {core,deltas};}
function inMask(u,v){const vv=v+0.04,e=u*u/0.64+vv*vv/((vv<0?1.0:0.92)**2);return e;}
function genPrint(rand,type,avoid){const P={type,rot:(rand()-0.5)*0.3,N:9.5,db:0.36+rand()*0.06,dir:rand()<0.5?1:-1,
    core:type==='arch'?[0,0]:[(rand()-0.5)*0.12+(type==='loop'?0.08:0),-0.12+(rand()-0.5)*0.1],vort:[]};
  const L=landmarks(P),keep=[];if(L.core)keep.push(L.core);L.deltas.forEach(d=>keep.push(d));
  let tries=0;while(P.vort.length<9&&tries<400){tries++;const x=(rand()-0.5)*1.25,y=(rand()-0.5)*1.5;if(inMask(x,y)>0.62)continue;
    if(keep.some(q=>Math.hypot(q[0]-x,q[1]-y)<0.26))continue;if(P.vort.some(q=>Math.hypot(q.x-x,q.y-y)<0.24))continue;
    if(avoid&&avoid.some(q=>Math.hypot(q.x-x,q.y-y)<0.12))continue;
    P.vort.push({x,y,s:P.vort.length%2?-1:1,t:rand()<0.5?'bif':'end'});}
  nudge(P);const ph=new Float32Array(W*H),m=new Float32Array(W*H);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const u=(i-W/2)/(W/2),v=(j-H/2)/(H/2);ph[j*W+i]=phaseAt(P,u,v,-1);m[j*W+i]=clamp((1-inMask(u,v))/0.1,0,1);}
  return {P,ph,m,type,min:P.vort.map(q=>({x:q.x,y:q.y,t:q.t})),core:L.core,deltas:L.deltas,imgs:{}};}
function noise(i,j){return Math.sin(i*0.37+j*0.11)*Math.sin(j*0.29-i*0.07)+0.5*Math.sin(i*1.3+j*1.7);}
function printImg(pr,rgb,cut){const key=rgb.join(',')+(cut?'c':'');if(pr.imgs[key])return pr.imgs[key];
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),img=g.createImageData(W,H);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=j*W+i,u=(i-W/2)/(W/2),v=(j-H/2)/(H/2);let a=clamp((Math.cos(pr.ph[k])-0.05+0.12*noise(i,j))*2.2,0,1)*pr.m[k];
    if(cut)a*=clamp((cut.d-(u*cut.c+v*cut.s))/0.12,0,1);
    img.data[k*4]=rgb[0];img.data[k*4+1]=rgb[1];img.data[k*4+2]=rgb[2];img.data[k*4+3]=Math.round(a*255);}
  g.putImageData(img,0,0);pr.imgs[key]=cv;return cv;}
const visibleOnCase=(c,q)=>inMask(q.x,q.y)<0.75&&(q.x*c.cut.c+q.y*c.cut.s)<c.cut.d-0.1;

/* ---------- the case: one scene print and three suspects ---------- */
const FREQ={loop:'about 60–65%',whorl:'about 30–35%',arch:'about 5%'};
function newCase(seed){const r=rng(seed),x=r();const type=x<0.62?'loop':x<0.95?'whorl':'arch';
  const other=type==='loop'?(r()<0.5?'whorl':'arch'):'loop';
  const src=genPrint(r,type),decoy=genPrint(r,type,src.min),diff=genPrint(r,other);
  const order=[src,decoy,diff];for(let i=2;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const a=r()*TAU;const c={seed,type,suspects:order,src:order.indexOf(src),decoy:order.indexOf(decoy),diff:order.indexOf(diff),cut:{c:Math.cos(a),s:Math.sin(a),d:0.42}};
  c.print=src;return c;}
function getCase(sim){if(!sim._case)sim._case=newCase(sim._seed||(sim._seed=20261024));return sim._case;}
function matches(c,si){const s=c.suspects[si],vis=c.print.min.filter(q=>visibleOnCase(c,q));
  const m=vis.filter(q=>s.min.some(z=>z.t===q.t&&Math.hypot(z.x-q.x,z.y-q.y)<0.06));return {n:m.length,of:vis.length,list:m,vis};}
const LET=['A','B','C'];

/* ---------- development chemistry ---------- */
const SURF={glass:{l:'Glass',porous:false},paper:{l:'Paper',porous:true},bag:{l:'Plastic bag',porous:false}};
const METH={powder:{l:'Fingerprint powder'},iodine:{l:'Iodine fuming'},ninhydrin:{l:'Ninhydrin spray'},cyano:{l:'Super glue (cyanoacrylate) fuming'}};
const Q0={powder:{glass:.92,paper:.22,bag:.72},iodine:{glass:.40,paper:.80,bag:.30},ninhydrin:{glass:.15,paper:.95,bag:.12},cyano:{glass:.86,paper:.18,bag:.95}};
const AGE=['1h','1d','1w','6mo'],AGEL={'1h':'1 hour','1d':'1 day','1w':'1 week','6mo':'6 months'};
const WATER=[1,0.6,0.35,0.15],OILN=[1,0.9,0.7,0.35],OILP=[1,0.7,0.4,0.1],AMINO=[1,1,0.97,0.9],AMINON=[1,0.95,0.85,0.6];
const FUME=5,TAU_I2=12,EA=95000,R=8.314;
const pI2=T=>41*Math.exp(62400/R*(1/298.15-1/(T+273.15)));   // Pa; Clausius–Clapeyron from 41 Pa at 25 °C, ΔHsub = 62.4 kJ/mol
const effT=p=>p.heat?p.temp:22, effRH=p=>p.heat?p.rh:30;
function residue(p){const a=AGE.indexOf(p.age),por=SURF[p.surface].porous;return {water:WATER[a],oil:por?OILP[a]:OILN[a],amino:por?AMINO[a]:AMINON[a]};}
function model(p){const m=p.method,s=p.surface,r=residue(p),T=effT(p),RH=effRH(p);let Q=Q0[m][s],k;
  if(m==='powder'){Q*=0.5*r.water+0.5*r.oil;k=3;}
  else if(m==='iodine'){Q*=r.oil;k=0.25*Math.sqrt(pI2(T)/pI2(25));}
  else if(m==='ninhydrin'){Q*=r.amino;k=0.35*Math.exp(-EA/R*(1/(T+273.15)-1/353.15))*clamp(RH/65,0.2,1.3);}
  else{Q*=(0.5*r.water+0.5*r.amino)*(0.35+0.65*Math.min(1,RH/80));k=Math.max(0.02,0.3*Math.pow(RH/80,1.2));}
  return {Q,k,r,T,RH};}
const TARGET={powder:'moisture and oils (sticks physically)',iodine:'oils and fats (dissolves in them)',ninhydrin:'amino acids (chemical reaction)',cyano:'water and amino acids (start a polymer)'};
function ink(p){const m=p.method;if(m==='powder')return p.surface==='bag'?[222,226,232]:[34,34,38];if(m==='iodine')return [128,72,22];if(m==='ninhydrin')return [112,40,150];return [246,246,246];}
function inkName(p){const m=p.method;if(m==='powder')return p.surface==='bag'?'silver powder':'black powder';return {iodine:'iodine',ninhydrin:'ninhydrin',cyano:'super glue'}[m];}
function grade(C){return C<0.08?'Nothing visible':C<0.3?'Faint smudge, no detail':C<0.55?'Ridges show, pattern only':C<0.75?'Clear ridges, some minutiae':'Sharp, minutiae clear';}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode)||(m.only&&!m.only(sim));});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}

/* ---------- layout ---------- */
const EV={x:45,y:74,w:270,h:332},PS=1.25,PCX=180,PCY=238;
let ZX=598,ZY=168,ZR=120;

const FP={
  id:'fingerprints',hash:'fingerprints',apUnit:16,order:1,tab:'Fingerprints',kind:'Virtual lab',next:['spottest','chromatography'],
  card:'Develop hidden prints on glass, paper and plastic with powder, iodine, ninhydrin or super glue, then match the print to a suspect.',
  title:'Fingerprints: developing and matching latent prints',
  lede:{bio:'Most prints at a scene are latent: invisible traces of sweat and skin oil. Pick a surface and a method, watch the print appear, then compare it with the suspects’ prints.',
        honors:'Each method targets a different part of the residue: oils, amino acids or water. Match the method to the surface and the print’s age, and name the minutiae you compare.',
        ap:'Treat development as chemistry: iodine vapor pressure from Clausius–Clapeyron, the ninhydrin reaction rate from the Arrhenius equation, and humidity-started polymerization.'},
  scale:{bio:'A fingertip about 1.5 cm wide; ridges about 0.5 mm apart. The zoom circle shows two ridges, magnified about 200×.',ap:'A fingertip about 1.5 cm wide; ridges about 0.5 mm apart. The zoom circle shows two ridges (about 1 mm), magnified about 200×. A print holds roughly 10–100 μg of residue.'},
  timeScale:1.5,dtMax:0.05,sampleDt:0.1,window:30,unit:'min',timeLabel:'Time',chChange:2,chReveal:14,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'develop',lvl:'bio',noTrial:true,options:[{v:'develop',l:'Develop the print'},{v:'compare',l:'Compare with suspects'}]},
    {id:'surface',label:'Surface the print is on',type:'seg',def:'glass',lvl:'bio',modes:['develop'],options:[{v:'glass',l:'Glass'},{v:'paper',l:'Paper'},{v:'bag',l:'Plastic bag'}],help:'Glass and plastic are nonporous: the residue sits on top. Paper is porous: the residue soaks into the fibers.'},
    {id:'method',label:'Development method',type:'select',def:'powder',lvl:'bio',modes:['develop'],options:Object.keys(METH).map(k=>({v:k,l:METH[k].l}))},
    {id:'age',label:'Age of the print',type:'seg',def:'1h',lvl:'honors',modes:['develop'],options:AGE.map(a=>({v:a,l:AGEL[a]})),help:'Water evaporates within days and oils soak in or break down. Amino acids stay in paper for years.'},
    {id:'heat',label:'Heat and humidity chamber',type:'toggle',def:true,lvl:'honors',modes:['develop'],help:'Off means room conditions: 22 °C, 30% humidity.'},
    {id:'rh',label:'Relative humidity',type:'range',min:20,max:90,step:5,def:70,unit:'%',lvl:'honors',modes:['develop'],help:'Used by ninhydrin and super glue when the chamber is on.'},
    {id:'temp',label:'Chamber temperature',type:'range',min:25,max:100,step:5,def:80,unit:' °C',lvl:'ap',modes:['develop'],help:'Warms the iodine crystals or the ninhydrin-treated paper.'},
    {id:'suspect',label:'Suspect card',type:'seg',def:0,lvl:'bio',noTrial:true,modes:['compare'],options:[{v:0,l:'Suspect A'},{v:1,l:'Suspect B'},{v:2,l:'Suspect C'}]},
    {id:'marks',label:'Show core and deltas',type:'toggle',def:false,lvl:'honors',noTrial:true,modes:['compare'],help:'Count the deltas: arch 0, loop 1, whorl 2.'}
  ],
  actions:[
    {id:'fresh',label:'Develop a fresh print',lvl:'bio',primary:true,modes:['develop'],run(sim){sim.st.key='';}},
    {id:'newcase',label:'New case',lvl:'bio',modes:['compare'],run(sim){sim._seed=(sim._seed||1)*7+13;sim._case=newCase(sim._seed);sim.infoDirty=true;}}
  ],
  init(sim){getCase(sim);return {C:0,tDev:0,key:''};},
  step(sim,dt){const p=sim.p,st=sim.st;if(p.mode!=='develop')return;const key=p.surface+'|'+p.method+'|'+p.age;
    if(key!==st.key){st.key=key;st.C=0;st.tDev=0;}
    const M=model(p);if(p.method==='iodine'&&st.tDev>=FUME)st.C-=st.C/TAU_I2*dt;else st.C+=M.k*(M.Q-st.C)*dt;st.C=clamp(st.C,0,1);st.tDev+=dt;},
  clock(sim){const st=sim.st;if(sim.p.mode!=='develop')return 'Comparing prints';const m=Math.floor(st.tDev),s=Math.floor((st.tDev-m)*60);
    return (sim.p.method==='iodine'&&st.tDev>=FUME?'Out of the cabinet: ':'Time on this print ')+m+':'+String(s).padStart(2,'0')+' min';},
  metrics:[
    {id:'contrast',label:'Print contrast',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['develop'],get:s=>100*s.st.C},
    {id:'detail',label:'What you can see',unit:'',lvl:'bio',text:true,modes:['develop'],get:s=>grade(s.st.C)},
    {id:'target',label:'This method detects',unit:'',lvl:'honors',text:true,modes:['develop'],get:s=>TARGET[s.p.method]},
    {id:'k',label:'Development rate constant k',unit:'min⁻¹',lvl:'ap',min:0,max:null,d:3,modes:['develop'],get:s=>model(s.p).k},
    {id:'thalf',label:'Half-time ln 2 / k',unit:'min',lvl:'ap',min:0,max:null,d:1,modes:['develop'],get:s=>Math.LN2/model(s.p).k},
    {id:'pi2',label:'I₂ vapor pressure in the cabinet',unit:'Pa',lvl:'ap',min:0,max:null,d:0,modes:['develop'],only:s=>s.p.method==='iodine',get:s=>pI2(effT(s.p))},
    {id:'match',label:'Minutiae that match',unit:'',lvl:'bio',text:true,modes:['compare'],noTrial:true,get:s=>{const c=getCase(s),m=matches(c,s.p.suspect);return m.n+' of '+m.of+' visible';}},
    {id:'pattern',label:'Scene print pattern',unit:'',lvl:'bio',text:true,modes:['compare'],noTrial:true,get:s=>{const c=getCase(s);return c.type+' ('+(c.type==='arch'?'no deltas':c.type==='loop'?'1 delta':'2 deltas')+')';}},
    {id:'freq',label:'People with this pattern',unit:'',lvl:'honors',text:true,modes:['compare'],noTrial:true,get:s=>FREQ[getCase(s).type]}
  ],
  graphs:[{id:'contrast',label:'Print contrast',lvl:'bio',lines:['contrast']},{id:'mbars',label:'Matching minutiae by suspect',lvl:'bio',custom:true}],
  defaultGraph:'contrast',
  plot(sim,ctx,box,id){const c=getCase(sim),vals=[0,1,2].map(i=>matches(c,i).n),of=matches(c,0).of;
    const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:Math.max(of,1)+1,xcats:LET.map(l=>'Suspect '+l),yl:'matching minutiae',yd:0});
    bars(ctx,ax,vals,{colors:[0,1,2].map(i=>i===sim.p.suspect?PAL['s3']:PAL['g-axis']),d:0});
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(box.L,ax.Y(of));ctx.lineTo(box.L+box.W,ax.Y(of));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'visible on the scene print: '+of,box.L+box.W-4,ax.Y(of)-6,{s:12,c:PAL['muted'],a:'right'});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='compare'){const c=getCase(sim);const rows=[0,1,2].map(i=>{const m=matches(c,i),s=c.suspects[i];return `<tr><td>${LET[i]}</td><td>${s.type}</td><td>${m.n} of ${m.of}</td><td>${m.n===m.of&&m.of>=6?'Identified':m.n<=1?'Excluded':'Inconclusive'}</td></tr>`;}).join('');
      return `<h3>Comparison worksheet</h3><div class="tbl-wrap"><table><thead><tr><th>Suspect</th><th>Pattern</th><th>Minutiae match</th><th>Conclusion</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">Pattern type is a class characteristic: it narrows the field. Only matching minutiae, in the same places and of the same types, point to one person.${hon?' Examiners follow ACE-V: Analysis, Comparison, Evaluation, Verification by a second examiner.':''}</p>`;}
    const M=model(p),r=M.r;let h=`<h3>The residue on this print</h3><div class="tbl-wrap"><table><thead><tr><th>Part of the residue</th><th>Left (vs fresh)</th><th>Detected by</th></tr></thead><tbody>
      <tr><td>Water (about 98%)</td><td>${Math.round(100*r.water)}%</td><td>powder, super glue</td></tr><tr><td>Oils and fats</td><td>${Math.round(100*r.oil)}%</td><td>powder, iodine</td></tr><tr><td>Amino acids</td><td>${Math.round(100*r.amino)}%</td><td>ninhydrin, super glue</td></tr></tbody></table></div>`;
    if(hon)h+=`<p class="help">${SURF[p.surface].porous?'Paper is porous: the residue soaks into the fibers, so surface methods (powder, super glue) have little to grab, but amino acids stay locked in place for years.':'This surface is nonporous: the residue sits on top, where powder and super glue can reach it. Liquids like ninhydrin run and smear it.'}</p>`;
    if(ap)h+=`<p class="help">Conditions: ${M.T} °C, ${M.RH}% humidity. k = ${M.k.toFixed(3)} min⁻¹, best contrast ${Math.round(100*M.Q)}%.</p>`;
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.mode==='compare'){const c=getCase(sim),m=matches(c,p.suspect),s=c.suspects[p.suspect],L=LET[p.suspect];
      if(m.n===m.of&&m.of>0)return '<b>Suspect '+L+'’s print agrees at all '+m.of+' minutiae</b> you can see, in the same places and of the same types. That points to Suspect '+L+' as the source.';
      if(s.type!==c.type)return 'Suspect '+L+' has a '+s.type+', but the scene print is a '+c.type+'. <b>A different pattern type excludes Suspect '+L+'</b> right away.';
      return 'Suspect '+L+' also has a '+s.type+', yet only '+m.n+' of '+m.of+' minutiae line up. <b>Same pattern type is not a match</b>: the ridge endings and bifurcations differ.';}
    const M=model(p),C=st.C,su=SURF[p.surface],nm=inkName(p);
    if(st.tDev<0.15)return 'The print is <b>latent</b>: a thin film of water, salts, amino acids and skin oils, invisible on '+su.l.toLowerCase()+'. '+METH[p.method].l+' is about to begin.';
    let s='';
    if(p.method==='powder')s=su.porous?'The '+nm+' sticks to the paper fibers everywhere, not just to the ridges, so <b>the print turns into a gray smudge</b>.':'The fine '+nm+' sticks to the sticky moisture and oils on the ridges and brushes off the clean valleys. <b>This is physical adhesion, not a reaction.</b>';
    else if(p.method==='iodine')s=st.tDev>=FUME?'The print is out of the cabinet and <b>fading</b>: the iodine only dissolved in the oils, so it sublimes back into the air. Photograph it now.':'Iodine crystals <b>sublime</b> into violet vapor, and the vapor dissolves into the oils on the ridges, turning them yellow-brown.';
    else if(p.method==='ninhydrin')s=su.porous?(M.k<0.01?'Ninhydrin is reacting with the amino acids, but at '+M.T+' °C <b>the reaction is very slow</b>: it takes about a day. Heat and humidity speed it up.':'Ninhydrin reacts with the amino acids held in the fibers and forms <b>Ruhemann’s purple</b>. The heat and humidity make the reaction fast.'):'On a nonporous surface the ninhydrin solution runs and smears the residue, so <b>only a faint purple stain forms</b>. Ninhydrin is a paper method.';
    else s=su.porous?'Super glue vapor has little to build on: the water and amino acids soaked into the paper. <b>Only a faint white haze forms.</b>':(M.RH<50?'Water in the residue starts the polymer, but the air is dry, so <b>the white polymer grows slowly and thinly</b>.':'Water and amino acids on the ridges start a chain reaction: cyanoacrylate molecules link into a <b>hard white polymer</b> that traces every ridge.');
    if(hon&&p.age!=='1h'&&(p.method==='powder'||p.method==='iodine')&&C<0.5)s+=' This print is '+AGEL[p.age]+' old, so much of the moisture and oil is gone.';
    return s;},
  tour:[
    {title:'An invisible print',text:{bio:'Your finger leaves sweat and skin oil wherever it touches. On this glass slide the print is latent: it is there, but you cannot see it. The zoom circle shows the residue sitting on two ridges.',honors:'Latent residue is about 98% water. The rest is salts, amino acids and urea (from sweat pores) plus fatty acids and waxes (wiped from skin oil). Each method targets one part.'},focus:[[EV.x,EV.y,EV.w,EV.h],[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'develop',surface:'glass',method:'powder',age:'1h'});sim.st.key=sim.p.surface+'|'+sim.p.method+'|'+sim.p.age;sim.st.C=0;sim.st.tDev=0;}},
    {title:'Dusting with powder',text:'Fine powder grains stick to the moist, oily ridges and brush off the clean valleys. Nothing reacts. It is the fastest method, and it works best on smooth, nonporous surfaces like glass.',focus:[[EV.x,EV.y,EV.w,EV.h],[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12]],speed:0.3,setup(sim){sim.st.key='';}},
    {title:'Paper soaks up the print',text:'Now the same powder on paper. Paper is porous, so the residue has soaked into the fibers, and the powder sticks to the fibers everywhere. The result is a smudge.',focus:[EV.x,EV.y,EV.w,EV.h],speed:0.5,setup(sim){BioLab.setValues(sim,{surface:'paper'});}},
    {title:'Iodine fuming',text:'Iodine crystals sublime (solid straight to gas). The violet vapor dissolves into the oils on the ridges and stains them brown. It is a physical change, so after the print leaves the cabinet the iodine escapes and the print fades.',focus:[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12],speed:1,setup(sim){BioLab.setValues(sim,{method:'iodine'});}},
    {title:'Ninhydrin',text:{bio:'Ninhydrin reacts with amino acids from sweat and makes a purple compound called Ruhemann’s purple. Amino acids stay in paper for years, so this works on old documents.',honors:'2 ninhydrin + amino acid → Ruhemann’s purple + aldehyde + CO₂ + 3 H₂O. This is a real chemical reaction, and the heat and humidity chamber speeds it up.'},focus:[[EV.x,EV.y,EV.w,EV.h],[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12]],speed:0.5,setup(sim){BioLab.setValues(sim,{method:'ninhydrin'});}},
    {title:'Super glue fuming',text:'Heated super glue (cyanoacrylate) gives off vapor. Water and amino acids on the ridges start a chain reaction, and the molecules link into a white plastic that traces every ridge. It is the method for plastic bags, cans and guns.',focus:[[EV.x,EV.y,EV.w,EV.h],[ZX-ZR-6,ZY-ZR-6,2*ZR+12,2*ZR+12]],speed:0.6,setup(sim){BioLab.setValues(sim,{surface:'bag',method:'cyano'});}},
    {title:'Compare with suspects',text:'The developed scene print is usually partial. First check the pattern type (loop, whorl or arch). Then compare minutiae, the places where ridges end or split, with each suspect’s inked print.',focus:[20,40,520,400],pause:true,setup(sim){BioLab.setValues(sim,{mode:'compare',suspect:getCase(sim).src});}},
    {lvl:'honors',title:'Class vs individual',text:'Pattern type is a class characteristic: about two people in three have loops. Minutiae are individual characteristics. A circle marks a ridge ending and a square marks a bifurcation; matched pairs are joined by lines.',focus:[20,40,520,400],pause:true,setup(sim){BioLab.setValues(sim,{mode:'compare',suspect:getCase(sim).src,marks:true});}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);sim.st.key='';syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);BioLab.refresh(sim);}},
  challenges(sim){const c=getCase(sim),dL=LET[c.decoy],sL=LET[c.src];return [
    {lvl:'bio',q:'Black powder gives a sharp print on glass. What happens if you dust a print on paper the same way?',choices:['An equally sharp print','A faint, smudged print: the powder sticks to the paper too','No powder sticks at all'],correct:1,
     baseline:{surface:'glass',method:'powder'},change:{surface:'paper'},changeText:'Switched to a print on paper',watch:'contrast',
     explain:{bio:'On glass the contrast reached about 90%. On paper it only reaches about 20%. Paper is porous: the residue soaks in, and the powder grains catch in the fibers everywhere, so the ridges barely stand out.'}},
    {lvl:'bio',q:'An iodine-fumed print on paper is brown and clear. After you take it out of the fuming cabinet, what happens over the next 20 minutes?',choices:['It stays brown for good','It slowly fades away','It turns purple'],correct:1,
     baseline:{surface:'paper',method:'iodine'},changeText:'Fuming stops at 5 min. Keep watching',at:5,reveal:24,watch:'contrast',
     explain:{bio:'The iodine never reacted. It only dissolved in the oils, so it sublimes back into the air and the print fades. Examiners photograph iodine prints right away, or fix them with a starch spray that turns them blue-black.'}},
    {lvl:'bio',instant:true,set:{mode:'compare',suspect:c.decoy},q:'The scene print is a '+c.type+'. Suspect '+dL+'’s print is also a '+c.type+'. Does that show Suspect '+dL+' left the print?',choices:['Yes, the patterns match','No, many people share a pattern type; the minutiae must match','Only if the prints are the same size'],correct:1,
     explain:{bio:'The model now shows Suspect '+dL+'. The pattern matches, but most minutiae do not line up. Pattern type only narrows the field; about '+FREQ[c.type]+' of people have a '+c.type+'. Suspect '+sL+' is the one whose minutiae all agree.'}},
    {lvl:'bio',instant:true,q:'Which fingerprint pattern is the most common?',choices:['Whorl','Loop','Arch'],correct:1,
     explain:{bio:'Loops make up about 60–65% of fingerprints, whorls about 30–35%, and arches only about 5%. That is why a loop on its own says very little about who left a print.'}},
    {lvl:'honors',q:'A letter sat in a drawer for 6 months. Iodine barely shows a print. What happens if you switch to ninhydrin?',choices:['Nothing: the print is too old for any method','A clear purple print develops','A brown print develops'],correct:1,
     baseline:{surface:'paper',method:'iodine',age:'6mo',heat:true},change:{method:'ninhydrin'},changeText:'Switched to ninhydrin',watch:'contrast',
     explain:{honors:'After 6 months the oils have soaked deep into the paper, so iodine has little to dissolve in. Amino acids bind to the paper fibers and stay put for years, and ninhydrin reacts with them to form Ruhemann’s purple. Contrast rises to over 80%.'}},
    {lvl:'honors',q:'Ninhydrin is developing a print on paper in the heat and humidity chamber. You switch the chamber off. What happens next?',choices:['The print keeps appearing just as fast','The print almost stops developing, because the reaction slows way down','The purple color disappears'],correct:1,
     baseline:{surface:'paper',method:'ninhydrin',heat:true},change:{heat:false},at:1.2,changeText:'Chamber off: 22 °C, 30% humidity',watch:'contrast',
     explain:{honors:'The reaction does not stop, but at room temperature and low humidity it takes about a day instead of a few minutes. The contrast curve flattens. Reaction rates depend strongly on temperature.'}},
    {lvl:'honors',q:'A print on a plastic bag is in a super glue chamber at 20% humidity. You raise the humidity to 80%. What happens?',choices:['Nothing changes: glue only needs heat','The white polymer builds faster and thicker','The print dissolves'],correct:1,
     baseline:{surface:'bag',method:'cyano',rh:20,heat:true},change:{rh:80},changeText:'Humidity raised to 80%',watch:'contrast',
     explain:{honors:'Water is what starts the polymerization: hydroxide ions from water attack the C=C bond of cyanoacrylate and the chain grows from there. More moisture means more chains start, so the white polymer builds faster and the contrast climbs higher.'}},
    {lvl:'honors',instant:true,set:{mode:'develop',surface:'paper',method:'ninhydrin'},q:'Ninhydrin turns a print purple. Which part of the residue does it react with?',choices:['Skin oils','Amino acids from sweat','Salt (NaCl)'],correct:1,
     explain:{honors:'Ninhydrin reacts with the amine group of amino acids (and other amines), producing Ruhemann’s purple. The “This method detects” readout shows the target for each method.'}},
    {lvl:'ap',instant:true,set:{mode:'develop',surface:'paper',method:'iodine',heat:true,temp:50},q:'Solid iodine has a vapor pressure of 41 Pa at 25 °C, and ΔH(sublimation) = 62.4 kJ/mol. About what is its vapor pressure at 50 °C?',choices:['About 82 Pa (2×)','About 290 Pa (7×)','About 1000 Pa (25×)'],correct:1,
     explain:{ap:'ln(P₂/P₁) = (ΔH/R)(1/T₁ − 1/T₂) = (62 400 / 8.314)(1/298.15 − 1/323.15) = 1.95, so P₂/P₁ ≈ 7.0 and P₂ ≈ 290 Pa. The model is now at 50 °C: the I₂ vapor pressure readout shows it. More vapor means faster fuming.'}},
    {lvl:'ap',q:'Ninhydrin’s effective activation energy here is 95 kJ/mol. You raise the oven from 50 °C to 80 °C. About how much faster does the print develop?',choices:['1.6× (80/50)','About 20×','About 200×'],correct:1,
     baseline:{surface:'paper',method:'ninhydrin',heat:true,temp:50},change:{temp:80},changeText:'Oven raised to 80 °C',watch:'contrast',
     explain:{ap:'k₂/k₁ = exp[(Ea/R)(1/T₁ − 1/T₂)] = exp[(95 000/8.314)(1/323.15 − 1/353.15)] = e³·⁰ ≈ 20. Watch the k readout jump from about 0.019 to 0.38 min⁻¹. Ratios of Celsius temperatures mean nothing; use kelvins.'}},
    {lvl:'ap',instant:true,q:'2 ninhydrin + amino acid → Ruhemann’s purple + RCHO + CO₂ + 3 H₂O. A print holds about 0.2 μmol of amino acids. How many μmol of ninhydrin are needed to react with all of it?',choices:['0.1 μmol','0.2 μmol','0.4 μmol'],correct:2,
     explain:{ap:'The mole ratio is 2 ninhydrin : 1 amino acid, so 0.2 μmol × 2 = 0.4 μmol. The spray supplies a large excess, so the amino acids are the limiting reactant and set how much purple forms.'}},
    {lvl:'ap',instant:true,q:'How many matching minutiae does the FBI require before an examiner may call an identification?',choices:['12','16','There is no fixed number in the United States'],correct:2,
     explain:{ap:'Since 1973 the International Association for Identification has rejected any fixed minimum, and the FBI uses none. Examiners judge the quality and quantity of detail together (ACE-V). Some countries once used 12 or 16 points.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> Which development method works best on each surface?</p><ol><li>For glass, paper and the plastic bag, try all four methods.</li><li>Let each one finish (about 10 minutes of lab time), then press Record trial.</li><li>Fill in a 3 × 4 grid with the contrast for each pair.</li></ol><p>Which methods suit porous surfaces, and which suit nonporous ones? Explain using what sticks to what.</p><p class="help">Safety in the real lab: iodine and super glue fuming happen in a fume hood or closed chamber. Wear gloves and goggles, and never breathe the vapors.</p>',
       honors:'<p><b>Question:</b> How does the age of a print change the best method?</p><ol><li>Use a print on paper. For each age (1 hour, 1 day, 1 week, 6 months), develop it with iodine and with ninhydrin.</li><li>Record the final contrast for each.</li><li>Repeat with the plastic bag, using powder and super glue.</li></ol><p>Explain your results using which part of the residue each method targets and how that part changes with time.</p><p class="help">Safety: fuming happens in a fume hood; ninhydrin is sprayed in a hood with gloves.</p>',
       ap:'<p><b>Question:</b> What is the activation energy of the ninhydrin development?</p><ol><li>Use a fresh print on paper with ninhydrin, chamber on, 70% humidity.</li><li>Record k at 40, 50, 60, 70, 80, 90 and 100 °C.</li><li>Plot ln k against 1/T (in K) and find the slope.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the slope (−Ea/R) to find Ea, and explain why crime labs develop ninhydrin prints in a warm, humid oven instead of on the bench.</p>'},
  terms:[{t:'Latent print',d:'A print you cannot see until it is developed.'},{t:'Porous / nonporous',d:'Porous surfaces (paper, cardboard) soak up residue. Nonporous ones (glass, plastic, metal) hold it on top.'},{t:'Loop, whorl, arch',d:'The three basic ridge patterns. Loops recurve and exit the side they entered; whorls circle; arches flow across.'},{t:'Minutiae',d:'Small ridge details, such as ridge endings and bifurcations, used to match a print to one person.'},
    {lvl:'honors',t:'Ridge ending / bifurcation',d:'A ridge that stops (circle) or splits in two (square).'},{lvl:'honors',t:'Core and delta',d:'The center of the pattern, and the triangle-shaped spot where ridges meet from three directions.'},{lvl:'honors',t:'Class vs individual characteristic',d:'Shared by a group (pattern type) vs unique to one source (minutiae arrangement).'},{lvl:'honors',t:'Sublimation',d:'A solid turning straight into a gas, as iodine does.'},{lvl:'honors',t:'Ruhemann’s purple',d:'The purple product of ninhydrin and amino acids.'},
    {lvl:'ap',t:'Anionic polymerization',d:'A chain reaction started by a base (here OH⁻ from water) attacking the C=C bond of cyanoacrylate.'},{lvl:'ap',t:'Clausius–Clapeyron equation',d:'ln(P₂/P₁) = (ΔH/R)(1/T₁ − 1/T₂): vapor pressure rises steeply with temperature.'},{lvl:'ap',t:'ACE-V',d:'Analysis, Comparison, Evaluation, Verification: the method examiners use to compare prints.'}],
  about:'<p><b>Development.</b> Contrast C approaches a ceiling Q at rate k: dC/dt = k(Q − C). Q depends on how well the method suits the surface and on how much of its target (water, oils or amino acids) is left at that age. Iodine fumes for 5 minutes and then fades with a 12-minute time constant, because it only dissolves in the oils. Iodine’s vapor pressure follows Clausius–Clapeyron from 41 Pa at 25 °C with ΔH(sub) = 62.4 kJ/mol, and the fuming rate grows with its square root. Ninhydrin uses the Arrhenius equation with an effective Ea of 95 kJ/mol, chosen so it takes minutes at 80 °C and about a day at room temperature, as real labs report. Super glue’s rate and coverage rise with humidity.</p><p><b>Simplifications.</b> The method–surface ceilings and residue losses with age are classroom estimates that follow the published guidance (porous: ninhydrin and iodine; nonporous: powder and cyanoacrylate), not measured values. Real labs often run methods in sequence (super glue, then dye stain) and photograph under special lighting.</p><p><b>Prints.</b> Ridge patterns are drawn as fringes of a phase field, and each minutia is a spiral in that phase, after Larkin and Fletcher’s fingerprint model. Pattern frequencies are approximate FBI figures. The scene print is a partial copy of one suspect’s print; matching uses minutia type and position only.</p>',
  initVis(sim){sim.vis.rand=rng(7);},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);syncLight(sim);
    if(p.mode==='compare')drawCompare(sim,ctx,k,t);else drawDevelop(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.surface='bag';sim.p.method='cyano';},thumbFrames:60
};
function syncLight(sim){const key=BioLab.level+sim.p.mode+sim.p.method;if(sim._sk!==key){sim._sk=key;syncMode(sim);}}

/* ---------- develop view ---------- */
function drawEvidence(ctx,p,st,k){const x=EV.x,y=EV.y,w=EV.w,h=EV.h,s=p.surface;
  ctx.save();
  if(s==='paper'){ctx.fillStyle='rgba(0,0,0,.18)';rr(ctx,x+5,y+6,w,h,4);ctx.fill();ctx.fillStyle='#f6f3ea';rr(ctx,x,y,w,h,4);ctx.fill();
    ctx.strokeStyle='#bcd3e6';ctx.lineWidth=1;for(let ly=y+44;ly<y+h-10;ly+=22){ctx.beginPath();ctx.moveTo(x+12,ly);ctx.lineTo(x+w-12,ly);ctx.stroke();}
    ctx.strokeStyle='#e7a3a3';ctx.beginPath();ctx.moveTo(x+34,y+6);ctx.lineTo(x+34,y+h-6);ctx.stroke();}
  else if(s==='bag'){ctx.fillStyle='#24272d';ctx.beginPath();ctx.moveTo(x+8,y);ctx.lineTo(x+w-8,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=2;[[0.2,0.1,0.35,0.9],[0.7,0.05,0.6,0.95],[0.85,0.3,0.95,0.7]].forEach(f=>{ctx.beginPath();ctx.moveTo(x+w*f[0],y+h*f[1]);ctx.quadraticCurveTo(x+w*(f[0]+f[2])/2+14,y+h*0.5,x+w*f[2],y+h*f[3]);ctx.stroke();});
    ctx.fillStyle='#3a3e46';ctx.fillRect(x+8,y,w-16,14);}
  else{const dark=p.method==='cyano';ctx.fillStyle=dark?'#1d1f23':'#f2f2ee';rr(ctx,x,y,w,h,6);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,x,y,w,h,6);ctx.stroke();
    ctx.fillStyle='rgba(150,190,205,.22)';rr(ctx,x+16,y+16,w-32,h-32,8);ctx.fill();ctx.strokeStyle='rgba(120,170,190,.8)';ctx.lineWidth=2;rr(ctx,x+16,y+16,w-32,h-32,8);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+36,y+40);ctx.lineTo(x+70,y+28);ctx.moveTo(x+36,y+60);ctx.lineTo(x+96,y+36);ctx.stroke();}
  ctx.restore();}
function drawDevelop(sim,ctx,k,t){if(k>1.35){ZX=604;ZY=146;ZR=104;}else{ZX=598;ZY=168;ZR=120;}const p=sim.p,st=sim.st,c=getCase(sim),pr=c.print,M=model(p),hon=atLeast('honors'),ap=atLeast('ap');
  drawEvidence(ctx,p,st,k);
  // background staining (powder caught in paper fibers, iodine yellowing)
  if(p.surface==='paper'&&p.method==='powder'){ctx.fillStyle='rgba(60,60,60,'+(0.42*st.C/Math.max(0.05,Q0.powder.paper)*0.55).toFixed(3)+')';rr(ctx,EV.x,EV.y,EV.w,EV.h,4);ctx.fill();}
  if(p.surface==='paper'&&p.method==='iodine'){ctx.fillStyle='rgba(200,150,60,'+(0.15*st.C).toFixed(3)+')';rr(ctx,EV.x,EV.y,EV.w,EV.h,4);ctx.fill();}
  const pw=W*PS,ph=H*PS,px=PCX-pw/2,py=PCY-ph/2;
  // faint outline so students know where the latent print is
  if(st.C<0.12){ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle=p.surface==='bag'||(p.surface==='glass'&&p.method==='cyano')?'rgba(255,255,255,.45)':'rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(PCX,PCY-4,pw*0.4,ph*0.48,0,0,TAU);ctx.stroke();ctx.restore();}
  const img=printImg(pr,ink(p));ctx.save();ctx.globalAlpha=clamp(st.C*1.05,0,1);if(p.method==='powder'&&p.surface==='paper')ctx.filter='blur(1.2px)';ctx.drawImage(img,px,py,pw,ph);ctx.restore();
  // zoom marker on the print
  const zx=PCX+18,zy=PCY+30;ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.strokeRect(zx-12,zy-12,24,24);
  ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(zx+12,zy-12);ctx.lineTo(ZX-ZR*0.7,ZY-ZR*0.7);ctx.moveTo(zx+12,zy+12);ctx.lineTo(ZX-ZR*0.7,ZY+ZR*0.7);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,SURF[p.surface].l+(SURF[p.surface].porous?' (porous)':' (nonporous)'),EV.x,EV.y-12,{s:14*k,w:700});
  drawZoom(sim,ctx,k,t,M);
  // status pill
  const done=p.method==='iodine'?st.tDev>=FUME:st.C>0.95*M.Q;
  pill(ctx,st.tDev<0.15?'Latent: invisible':p.method==='iodine'&&st.tDev>=FUME?'Fading: iodine escaping':done?'Fully developed':'Developing…',PCX,EV.y+EV.h+22,PAL['card'],PAL['cv-ink'],13*k);
  // equation panel
  const phn=k>1.35,bx=phn?322:392,by=phn?328:336,bw=788-bx,bh=440-by;rr(ctx,bx,by,bw,bh,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const E={powder:['Physical: grains stick to moisture and oils','No reaction. Powder: carbon black or aluminum flakes'],
    iodine:['I₂(s) → I₂(g), then I₂ dissolves in the oils','Physical and reversible, so the print fades'],
    ninhydrin:['2 ninhydrin + amino acid →','Ruhemann’s purple + RCHO + CO₂ + 3 H₂O'],
    cyano:['n CH₂=C(CN)COOC₂H₅ → polymer','H₂O (OH⁻) on the ridges starts the chain']}[p.method];
  const SHORT={powder:'Powder dusting',iodine:'Iodine fuming',ninhydrin:'Ninhydrin spray',cyano:'Super glue fuming'};
  const lines=[[SHORT[p.method],14,700,PAL['cv-ink']],[hon?E[0]:{powder:'Grains stick to the damp, oily ridges',iodine:'Vapor dissolves in the oils on the ridges',ninhydrin:'Reacts with amino acids: turns purple',cyano:'Glue vapor builds white plastic on the ridges'}[p.method],13,400,PAL['cv-ink']]];
  if(hon)lines.push([E[1],13,400,PAL['cv-soft']]);else lines.push(['Target: '+TARGET[p.method].split(' (')[0],13,400,PAL['cv-soft']]);
  if(ap)lines.push([{powder:'Room conditions · k = 3.0 min⁻¹',iodine:'Iodine at '+M.T+' °C: P(I₂) = '+Math.round(pI2(M.T))+' Pa',ninhydrin:M.T+' °C · '+M.RH+'% RH · k = '+M.k.toFixed(3)+' min⁻¹',cyano:M.RH+'% RH · k = '+M.k.toFixed(3)+' min⁻¹'}[p.method],12.5,400,PAL['cv-soft']]);
  let ly=by+8;for(const L of lines){const sz=Math.max(L[1]*(phn?0.92:1),12)*k;const ws=wrapLines(ctx,L[0],bw-26,sz,L[2]);for(const w of ws){if(ly+sz*1.18>by+bh-4)break;ly+=sz*1.22;txt(ctx,w,bx+13,ly-sz*0.22,{s:sz,w:L[2],c:L[3]});}}}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function legendRow(ctx,items,x0,y0,maxX,k,center){ctx.font='400 '+(12*k)+'px '+FONT;const ws=items.map(it=>ctx.measureText(it[1]).width+24*k);
  const rows=[[]];let w=0;items.forEach((it,i)=>{if(w+ws[i]>maxX-x0&&rows[rows.length-1].length){rows.push([]);w=0;}rows[rows.length-1].push(i);w+=ws[i];});
  rows.forEach((row,ri)=>{const tot=row.reduce((a,i)=>a+ws[i],0);let lx=center?Math.max(x0,(x0+maxX)/2-tot/2):x0;const ly=y0+ri*18*k;
    row.forEach(i=>{const it=items[i],cx=lx+6*k;it[0](cx,ly);txt(ctx,it[1],cx+10*k,ly,{s:12*k,c:PAL['cv-soft'],b:'middle'});lx+=ws[i];});});return y0+rows.length*18*k;}
function drawZoom(sim,ctx,k,t,M){const p=sim.p,st=sim.st,por=SURF[p.surface].porous,r=M.r,prog=M.Q>0?clamp(st.C/Math.max(M.Q,0.05),0,1):0,anim=RM?0:t;
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,TAU);ctx.clip();ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(ZX-ZR,ZY-ZR,2*ZR,2*ZR);
  const ys=ZY+34;const R=rng(11);const inkS=p.surface==='bag'?'#f2f2f2':p.surface==='paper'?'#3a3328':PAL['cv-ink'];
  // surface slab
  if(p.surface==='paper'){ctx.fillStyle='#efe8d8';ctx.fillRect(ZX-ZR,ys-6,2*ZR,ZR);ctx.strokeStyle='#cbbd9c';ctx.lineWidth=3;for(let i=0;i<16;i++){const x0=ZX-ZR+R()*2*ZR,y0=ys-8+R()*60;ctx.beginPath();ctx.moveTo(x0-40,y0);ctx.quadraticCurveTo(x0,y0+(R()-0.5)*20,x0+40,y0+(R()-0.5)*14);ctx.stroke();}}
  else if(p.surface==='bag'){ctx.fillStyle='#2b2f36';ctx.fillRect(ZX-ZR,ys,2*ZR,ZR);}
  else{ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.45;ctx.fillRect(ZX-ZR,ys,2*ZR,ZR);ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ZX-ZR,ys);ctx.lineTo(ZX+ZR,ys);ctx.stroke();}
  const ridges=[ZX-60,ZX+60];
  // residue deposits
  ridges.forEach((rx,ri)=>{const R2=rng(31+ri);
    if(!por){ctx.fillStyle='rgba(150,170,180,.30)';ctx.beginPath();ctx.ellipse(rx,ys,44,24,0,Math.PI,TAU);ctx.fill();}
    const spot=(n,col,rad)=>{for(let i=0;i<n;i++){const a=R2()*Math.PI,d=R2();const x=rx+Math.cos(a)*36*d,y=por?ys+8+R2()*40:ys-Math.sin(a)*19*d-3;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();}};
    spot(Math.round(9*r.water),'#4a8fd6',4.2);
    // oils: stained brown by iodine
    const oil=p.method==='iodine'?mixHex('#e0b23a','#7a3f10',clamp(st.C/0.8,0,1)):'#e0b23a';spot(Math.round(7*r.oil),oil,5.2);
    // amino acids: turned purple by ninhydrin
    const nA=Math.round(6*r.amino),conv=p.method==='ninhydrin'?Math.round(nA*prog):0;
    for(let i=0;i<nA;i++){const a=R2()*Math.PI,d=R2();const x=rx+Math.cos(a)*32*d,y=por?ys+10+R2()*38:ys-Math.sin(a)*16*d-3;
      if(i<conv){ctx.fillStyle='#7a2aa0';ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();}else{ctx.fillStyle='#3f9e4f';ctx.fillRect(x-3.4,y-3.4,6.8,6.8);}}});
  // reagents
  if(p.method==='powder'){const R3=rng(5);const stick=Math.round(26*prog*(0.5*r.water+0.5*r.oil));
    ridges.forEach(rx=>{for(let i=0;i<stick;i++){const a=R3()*Math.PI,d=0.4+0.6*R3();const x=rx+Math.cos(a)*44*d,y=por?ys-2+R3()*10:ys-Math.sin(a)*24*d-3;grain(ctx,x,y,p);}});
    if(por){const n=Math.round(30*prog);for(let i=0;i<n;i++)grain(ctx,ZX-ZR+R3()*2*ZR,ys-2+R3()*12,p);}
    if(prog<0.97){for(let i=0;i<12;i++){const x=ZX-ZR+20+((i*53)%(2*ZR-40)),y=ZY-ZR+((anim*60+i*37)%(ys-ZY+ZR-8));grain(ctx,x+Math.sin(anim*2+i)*4,y,p);}}}
  else if(p.method==='iodine'){const fuming=st.tDev<FUME;const n=fuming?26:10;
    for(let i=0;i<n;i++){const ph=i*1.7;let x=ZX-ZR+20+((i*61+anim*18*(i%2?1:-1))%(2*ZR-40)+(2*ZR-40))%(2*ZR-40),y;
      if(fuming)y=ZY-ZR+18+((Math.sin(anim*0.9+ph)*0.5+0.5)*(ys-ZY+ZR-40));else y=ys-20-((anim*22+i*19)%120);
      dumbbell(ctx,x,y,anim+ph);}}
  else if(p.method==='ninhydrin'){const R4=rng(9);for(let i=0;i<20;i++){const x=ZX-ZR+10+R4()*(2*ZR-20),y=ys-4-R4()*6;ctx.fillStyle='#d9cf7a';ctx.beginPath();ctx.arc(x,y,2.4,0,TAU);ctx.fill();}
    if(prog>0.03&&prog<0.97){for(let i=0;i<6;i++){const x=ridges[i%2]+((i*17)%30)-15,y=ys-10-((anim*30+i*23)%80);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.stroke();}}}
  else{const L=Math.round(9*prog);ridges.forEach((rx,ri)=>{for(let c=0;c<5;c++){let x=rx-30+c*15,y=ys-8;for(let b=0;b<L;b++){const nx=x+(b%2?5:-5),ny=y-7;ctx.strokeStyle='#9aa0a8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);ctx.stroke();
      ctx.fillStyle='#f4f4f4';ctx.beginPath();ctx.arc(nx,ny,3.2,0,TAU);ctx.fill();ctx.strokeStyle='#8a8f96';ctx.lineWidth=1;ctx.stroke();x=nx;y=ny;}}});
    if(prog<0.97){for(let i=0;i<10;i++){const x=ZX-ZR+24+((i*47+anim*14)%(2*ZR-48)),y=ZY-ZR+20+((Math.sin(anim+i)*0.5+0.5)*(ys-ZY+ZR-90));ctx.save();ctx.translate(x,y);ctx.rotate(anim*0.8+i);ctx.fillStyle='#f4f4f4';ctx.strokeStyle='#8a8f96';ctx.lineWidth=1;rr(ctx,-6,-2.2,12,4.4,2);ctx.fill();ctx.stroke();ctx.restore();}}}
  // labels inside the zoom
  ridges.forEach(rx=>{if(por)txt(ctx,'ridge',rx,ys-14,{s:12*k,w:700,a:'center',c:PAL['cv-ink']});else{ctx.strokeStyle=inkS;ctx.globalAlpha=0.6;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(rx-40,ys+6);ctx.lineTo(rx-40,ys+10);ctx.lineTo(rx+40,ys+10);ctx.lineTo(rx+40,ys+6);ctx.stroke();ctx.globalAlpha=1;txt(ctx,'ridge',rx,ys+25,{s:12*k,w:700,a:'center',c:inkS});}});
  if(k<=1.35)txt(ctx,'valley',ZX,ys+(por?-14:-6),{s:12*k,a:'center',c:PAL['cv-soft']});
  txt(ctx,por?'paper fibers':p.surface==='bag'?'plastic':'glass',ZX,ys+(por?66:58),{s:12*k,w:700,a:'center',c:inkS});
  ctx.restore();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,TAU);ctx.stroke();
  // legend under the zoom
  const dot=c=>(x,y)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,4.5,0,TAU);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=0.8;ctx.stroke();};
  const items=[[dot('#4a8fd6'),'water'],[dot('#e0b23a'),'oils'],[(x,y)=>{ctx.fillStyle='#3f9e4f';ctx.fillRect(x-4,y-4,8,8);},'amino acids']];
  if(p.method==='ninhydrin')items.push([dot('#7a2aa0'),'purple product']);else if(p.method==='cyano')items.push([dot('#f4f4f4'),'polymer']);else if(p.method==='iodine')items.push([(x,y)=>dumbbell(ctx,x,y,0),'I₂']);else items.push([dot(p.surface==='bag'?'#d8dce2':'#2a2a2e'),'powder']);
  legendRow(ctx,items,k>1.35?330:400,ZY+ZR+16,796,k,true);}
function grain(ctx,x,y,p){ctx.fillStyle=p.surface==='bag'?'#d8dce2':'#2a2a2e';ctx.beginPath();ctx.arc(x,y,2.8,0,TAU);ctx.fill();}
function dumbbell(ctx,x,y,a){const dx=Math.cos(a)*3.4,dy=Math.sin(a)*3.4;ctx.fillStyle='#8e44ad';ctx.beginPath();ctx.arc(x-dx,y-dy,3.2,0,TAU);ctx.arc(x+dx,y+dy,3.2,0,TAU);ctx.fill();}
function mixHex(a,b,f){const h=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const A=h(a),B=h(b);return 'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],f))).join(',')+')';}

/* ---------- compare view ---------- */
const CA={x:34,y:74,s:1.1},CB={x:262,y:74,s:1.1};
function drawPrintCard(ctx,pr,x,y,s,rgb,cut,label,k,bg){const w=W*s,h=H*s;ctx.fillStyle=bg||'#fbfbf8';rr(ctx,x-8,y-8,w+16,h+16,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  ctx.drawImage(printImg(pr,rgb,cut),x,y,w,h);if(label)txt(ctx,label,x+w/2,y-18,{s:13*k,w:700,a:'center'});}
const imgXY=(o,q)=>[o.x+(q[0]+1)*W/2*o.s,o.y+(q[1]+1)*H/2*o.s];
function mark(ctx,x,y,type,col,k){ctx.strokeStyle=col;ctx.lineWidth=2.2;if(type==='bif')ctx.strokeRect(x-6,y-6,12,12);else{ctx.beginPath();ctx.arc(x,y,6.5,0,TAU);ctx.stroke();}}
function drawCompare(sim,ctx,k,t){const p=sim.p,c=getCase(sim),hon=atLeast('honors'),si=p.suspect,S=c.suspects[si],m=matches(c,si);
  const phn=k>1.35;drawPrintCard(ctx,c.print,CA.x,CA.y,CA.s,[40,40,46],c.cut,phn?'Scene print':'Scene print (partial)',k,'#ecedef');
  drawPrintCard(ctx,S,CB.x,CB.y,CB.s,[20,20,24],null,phn?'Suspect '+LET[si]:'Suspect '+LET[si]+' (inked card)',k);
  // markers
  const ok=PAL['s3'],bad=PAL['s1'];
  m.vis.forEach(q=>{const a=imgXY(CA,[q.x,q.y]);const hit=m.list.includes(q);mark(ctx,a[0],a[1],hon?q.t:'end',hit?ok:bad,k);});
  S.min.forEach(q=>{const b=imgXY(CB,[q.x,q.y]);const hit=m.list.some(z=>Math.hypot(z.x-q.x,z.y-q.y)<0.06&&z.t===q.t);if(hit||hon)mark(ctx,b[0],b[1],hon?q.t:'end',hit?ok:PAL['cv-soft'],k);});
  ctx.save();ctx.globalAlpha=0.7;ctx.strokeStyle=ok;ctx.lineWidth=1.4;m.list.forEach(q=>{const a=imgXY(CA,[q.x,q.y]),b=imgXY(CB,[q.x,q.y]);ctx.beginPath();ctx.moveTo(a[0]+7,a[1]);ctx.lineTo(b[0]-7,b[1]);ctx.stroke();});ctx.restore();
  if(p.marks&&hon){[[c.print,CA],[S,CB]].forEach(([pr,o])=>{if(pr.core){const a=imgXY(o,pr.core);ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(a[0],a[1],6,0,TAU);ctx.fill();}
    pr.deltas.forEach(d=>{const a=imgXY(o,d);ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(a[0],a[1]-8);ctx.lineTo(a[0]+7,a[1]+5);ctx.lineTo(a[0]-7,a[1]+5);ctx.closePath();ctx.fill();});});}
  // suspect thumbnails
  const tx=488,ty=30,th=122;
  c.suspects.forEach((s,i)=>{const y=ty+i*(th+12),sel=i===si,mm=matches(c,i);ctx.fillStyle=PAL['card'];rr(ctx,tx-10,y,310,th,10);ctx.fill();ctx.strokeStyle=sel?PAL['rj']:PAL['line'];ctx.lineWidth=sel?3:1;ctx.stroke();
    ctx.fillStyle='#fbfbf8';rr(ctx,tx-2,y+8,70,th-16,4);ctx.fill();ctx.drawImage(printImg(s,[20,20,24]),tx+2,y+12,62,th-24);
    txt(ctx,'Suspect '+LET[i],tx+78,y+30,{s:14*k,w:700});txt(ctx,s.type,tx+78,y+52,{s:13*k,c:PAL['cv-soft']});
    txt(ctx,mm.n+'/'+mm.of+' match',tx+78,y+74,{s:13*k,w:700,c:mm.n===mm.of?PAL['s3']:PAL['cv-soft']});});
  // verdict line
  const v=m.n===m.of&&m.of>0?'Identified: all '+m.of+' visible minutiae agree':S.type!==c.type?'Excluded: different pattern type':'Excluded: only '+m.n+' of '+m.of+' minutiae agree';
  pill(ctx,v,(CA.x+CB.x+W*CB.s)/2,CA.y+H*CA.s+34,m.n===m.of&&m.of>0?PAL['s3']:PAL['card2'],m.n===m.of&&m.of>0?'#fff':PAL['cv-ink'],13*k);
  if(hon){const items=[[(x,y)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.stroke();},'ridge ending'],[(x,y)=>{ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.strokeRect(x-6,y-6,12,12);},'bifurcation']];
    if(p.marks)items.push([(x,y)=>{ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();},'core'],[(x,y)=>{ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+7,y+5);ctx.lineTo(x-7,y+5);ctx.closePath();ctx.fill();},'delta']);
    legendRow(ctx,items,CA.x-6,CA.y+H*CA.s+64,CB.x+W*CB.s+12,k,true);}}
FP.onLevel=syncMode;FP.controls[0].onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
BioLab.register(FP);
})();

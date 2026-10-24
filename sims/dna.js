(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const TAU=Math.PI*2;
const supN=n=>String(n).split('').map(d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const sci=(v,s)=>(window.ChemLab&&ChemLab.sci)?ChemLab.sci(v,'',s||2):v.toExponential(1);

/* ---------- six real CODIS STR loci ----------
   Amplicon size = base + 4 bp per repeat (+1–3 bp for microvariants like 9.3), close to the Identifiler kit ranges.
   Allele frequencies are rounded from published US population data (FBI CODIS databases, Budowle et al. 1999). */
const LOCI=[
  {id:'D3S1358',base:63,dye:0,lad:[12,19],freq:{13:0.01,14:0.14,15:0.25,16:0.23,17:0.21,18:0.15,19:0.01}},
  {id:'TH01',base:147,dye:0,lad:[5,10],xl:[9.3],freq:{6:0.23,7:0.19,8:0.09,9:0.12,9.3:0.37}},
  {id:'D8S1179',base:91,dye:1,lad:[8,17],freq:{10:0.10,11:0.07,12:0.14,13:0.33,14:0.21,15:0.12,16:0.03}},
  {id:'vWA',base:108,dye:2,lad:[13,20],freq:{14:0.10,15:0.11,16:0.20,17:0.28,18:0.20,19:0.11}},
  {id:'D21S11',base:89,dye:1,lad:[26,34],xl:[30.2,31.2,32.2,33.2],freq:{27:0.04,28:0.16,29:0.20,30:0.27,30.2:0.03,31:0.08,31.2:0.09,32.2:0.10,33.2:0.03}},
  {id:'FGA',base:147,dye:3,lad:[18,27],freq:{19:0.06,20:0.15,21:0.17,22:0.19,23:0.14,24:0.14,25:0.09,26:0.06}}
];
LOCI.forEach(L=>{L.alle=Object.keys(L.freq).map(Number).sort((a,b)=>a-b);L.ladder=[];for(let a=L.lad[0];a<=L.lad[1];a++)L.ladder.push(a);(L.xl||[]).forEach(a=>L.ladder.push(a));L.ladder.sort((a,b)=>a-b);});
const LOC=id=>LOCI.find(L=>L.id===id)||LOCI[0];
const bp=(L,a)=>L.base+4*Math.floor(a)+Math.round((a-Math.floor(a))*10);
const aTxt=a=>Number.isInteger(a)?String(a):a.toFixed(1);
const gTxt=g=>g?g.map(aTxt).join(', '):'—';
const DYES=[{n:'blue',c:'#2d6bd2'},{n:'green',c:'#1b8a4a'},{n:'yellow (shown black)',c:'#333338'},{n:'red',c:'#c1272d'}];
const DYE_OF={D8S1179:0,D21S11:0,D3S1358:1,TH01:1,vWA:2,FGA:3};

/* ---------- PCR and detection ---------- */
const NMAX=2e11,DET=1e9,STOCH=4e9,RFU=c=>c/2e7;   // detection 50 RFU, stochastic threshold 200 RFU
function amplify(N0,n,E){let N=N0;const whole=Math.floor(n);for(let i=0;i<whole;i++)N=N*(1+E*(1-N/NMAX));return N*(1+E*(n-whole)*(1-N/NMAX));}

/* ---------- fictional cases, generated from the allele frequencies ---------- */
function pick(r,L){let x=r(),acc=0;for(const a of L.alle){acc+=L.freq[a];if(x<=acc)return a;}return L.alle[L.alle.length-1];}
function randGeno(r){const g={};LOCI.forEach(L=>{g[L.id]=[pick(r,L),pick(r,L)].sort((a,b)=>a-b);});return g;}
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const diffLoci=(g,h)=>LOCI.filter(L=>!same(g[L.id],h[L.id])).length;
function redraw(r,g,ids){const h=JSON.parse(JSON.stringify(g));ids.forEach(id=>{const L=LOC(id);let t=0;do{h[id]=[pick(r,L),pick(r,L)].sort((a,b)=>a-b);t++;}while(same(h[id],g[id])&&t<50);});return h;}
function stranger(r,ref,min){let g,t=0;do{g=randGeno(r);t++;}while(diffLoci(g,ref)<min&&t<200);return g;}
function shuffle(r,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const CASES={
  single:{name:'Case 1: the trophy case',short:'Trophy case',lvl:'bio'},
  paternity:{name:'Case 2: who is the father?',short:'Paternity',lvl:'bio'},
  mixture:{name:'Case 3: a mixed sample',short:'Mixture',lvl:'ap'},
  degraded:{name:'Case 4: an old, degraded stain',short:'Degraded',lvl:'ap'}
};
const STORY={
  single:'A trophy case at Lakeview High School (fictional) was broken open after hours. A water bottle left beside it carries saliva. The coach who owns the case gave an elimination sample; Suspects A, B and C were in the building. Everyone is fictional.',
  paternity:'A family court asks which of three men is a child’s biological father. Everyone gave a cheek swab. Everyone is fictional.',
  mixture:'A swab from the handle of a broken cabinet holds DNA from two people. Four people had access to the room. Everyone is fictional.',
  degraded:'A small stain sat for months in a hot attic before it was found. Heat and time have broken the DNA into short pieces. Everyone is fictional.'
};
function buildCase(type,seed){const r=rng(seed*7919+type.length*31);const lanes=[{id:'lad',name:'Allelic ladder',short:'Ladder',ladder:true}];let truth='';
  if(type==='single'){const src=randGeno(r),decoy=redraw(r,src,shuffle(r,LOCI.map(L=>L.id)).slice(0,2)),other=stranger(r,src,4),elim=stranger(r,src,4);
    const sus=shuffle(r,[{g:src,k:'src'},{g:decoy,k:'decoy'},{g:other,k:'other'}]);
    lanes.push({id:'ev',name:'Evidence (water bottle)',short:'Evidence',ev:true,parts:[{g:src,share:1}],N0:150});lanes.push({id:'el',name:'Elimination: coach',short:'Coach',ref:true,g:elim});
    sus.forEach((s,i)=>lanes.push({id:'s'+i,name:'Suspect '+'ABC'[i],short:'ABC'[i],ref:true,g:s.g,key:s.k}));truth='Suspect '+'ABC'[sus.findIndex(s=>s.k==='src')];}
  else if(type==='paternity'){const mom=randGeno(r),dad=randGeno(r),kid={};LOCI.forEach(L=>{kid[L.id]=[mom[L.id][r()<0.5?0:1],dad[L.id][r()<0.5?0:1]].sort((a,b)=>a-b);});
    const bad=()=>{let g,t=0;do{g=randGeno(r);t++;}while(inconsistent(kid,mom,g).length<2&&t<300);return g;};
    const men=shuffle(r,[{g:dad,k:'src'},{g:bad(),k:'other'},{g:bad(),k:'other'}]);
    lanes.push({id:'ch',name:'Child',short:'Child',ev:true,parts:[{g:kid,share:1}],N0:150,g:kid});lanes.push({id:'mo',name:'Mother',short:'Mother',ref:true,g:mom});
    men.forEach((m,i)=>lanes.push({id:'m'+i,name:'Alleged father '+(i+1),short:'Man '+(i+1),ref:true,g:m.g,key:m.k}));truth='Alleged father '+(men.findIndex(m=>m.k==='src')+1);}
  else if(type==='mixture'){const a=randGeno(r),c=randGeno(r);const mixA=new Set();LOCI.forEach(L=>{});
    const out=()=>{let g,t=0;do{g=randGeno(r);t++;}while(LOCI.filter(L=>!g[L.id].every(x=>a[L.id].includes(x)||c[L.id].includes(x))).length<2&&t<400);return g;};
    const sus=shuffle(r,[{g:a,k:'major'},{g:c,k:'minor'},{g:out(),k:'other'},{g:out(),k:'other'}]);
    lanes.push({id:'ev',name:'Mixture (cabinet handle)',short:'Mixture',ev:true,mix:true,parts:[{g:a,share:0.7},{g:c,share:0.3}],N0:150});
    sus.forEach((s,i)=>lanes.push({id:'s'+i,name:'Suspect '+'ABCD'[i],short:'ABCD'[i],ref:true,g:s.g,key:s.k}));
    truth='Suspects '+sus.map((s,i)=>s.k!=='other'?'ABCD'[i]:'').filter(Boolean).join(' and ');}
  else{const src=randGeno(r);// a look-alike who matches at the short loci but not at the long ones that drop out
    const decoy=redraw(r,src,['D21S11','FGA']);const sus=shuffle(r,[{g:src,k:'src'},{g:decoy,k:'decoy'},{g:stranger(r,src,4),k:'other'},{g:stranger(r,src,4),k:'other'}]);
    lanes.push({id:'ev',name:'Evidence (degraded stain)',short:'Evidence',ev:true,deg:42,parts:[{g:src,share:1}],N0:40});
    sus.forEach((s,i)=>lanes.push({id:'s'+i,name:'Suspect '+'ABCD'[i],short:'ABCD'[i],ref:true,g:s.g,key:s.k}));truth='Suspect '+'ABCD'[sus.findIndex(s=>s.k==='src')];}
  return {type,seed,lanes,truth};}
function inconsistent(kid,mom,man){return LOCI.filter(L=>{const ob=obligate(kid[L.id],mom[L.id]);return !ob.some(a=>man[L.id].includes(a));}).map(L=>L.id);}
function obligate(c,m){const s=new Set();if(m.includes(c[0]))s.add(c[1]);if(m.includes(c[1]))s.add(c[0]);return [...s];}
function getCase(sim){const k=sim.p.case+'|'+(sim._seed||1);if(!sim._case||sim._ck!==k){sim._ck=k;sim._case=buildCase(sim.p.case,sim._seed||1);}return sim._case;}

/* starting copies of each allele in a lane at a locus (before PCR) */
function startCopies(lane,L){if(lane.ladder)return L.ladder.map(a=>({a,n:150}));
  if(lane.ref)return mergeA(lane.g[L.id].map(a=>({a,n:150})));
  const out=[];lane.parts.forEach(pt=>pt.g[L.id].forEach(a=>out.push({a,n:(lane.N0||150)*pt.share*(lane.deg?Math.exp(-(bp(L,a)-100)/lane.deg):1)})));return mergeA(out);}
function mergeA(list){const m=new Map();list.forEach(x=>m.set(x.a,(m.get(x.a)||0)+x.n));return [...m].map(([a,n])=>({a,n})).sort((x,y)=>x.a-y.a);}
function bands(sim,lane,L,cyc){const E=sim.p.eff/100;return startCopies(lane,L).map(x=>({a:x.a,size:bp(L,x.a),c:lane.ladder||lane.ref?amplify(x.n,Math.max(sim.p.cycles,28),E):amplify(x.n,cyc,E)}));}
/* what an analyst can call at a locus for a lane */
function call(sim,lane,L){const b=bands(sim,lane,L,sim.p.cycles).filter(x=>x.c>=DET);if(!b.length)return {st:'none',al:[]};
  if(!lane.mix&&b.length===1&&b[0].c<STOCH)return {st:'risk',al:b.map(x=>x.a)};return {st:'ok',al:b.map(x=>x.a)};}
const genoFreq=(L,g)=>g[0]===g[1]?Math.pow(L.freq[g[0]]||0.01,2):2*(L.freq[g[0]]||0.01)*(L.freq[g[1]]||0.01);

/* comparison of each reference lane with the evidence over the loci typed so far */
function compare(sim){const c=getCase(sim),ev=c.lanes.find(l=>l.ev),typed=[...sim.st.typed];const res={};let stat=1,used=0,pat=1;
  const refs=c.lanes.filter(l=>l.ref);refs.forEach(l=>res[l.id]={mis:0,ok:0,inc:0});
  typed.forEach(id=>{const L=LOC(id),cl=call(sim,ev,L);
    if(c.type==='paternity'){if(cl.st==='none')return;const kid=ev.g[id],mom=c.lanes.find(l=>l.id==='mo').g[id],ob=obligate(kid,mom);used++;
      refs.forEach(l=>{if(l.id==='mo'){res[l.id][kid.some(a=>l.g[id].includes(a))?'ok':'mis']++;return;}res[l.id][ob.some(a=>l.g[id].includes(a))?'ok':'mis']++;});return;}
    if(cl.st!=='ok'){refs.forEach(l=>res[l.id].inc++);return;}used++;
    if(c.type==='mixture'){refs.forEach(l=>res[l.id][l.g[id].every(a=>cl.al.includes(a))?'ok':'mis']++);const s=cl.al.reduce((q,a)=>q+(L.freq[a]||0.01),0);stat*=s*s;return;}
    const g=cl.al.length===1?[cl.al[0],cl.al[0]]:cl.al;refs.forEach(l=>res[l.id][same(l.g[id],g)?'ok':'mis']++);stat*=genoFreq(L,g);});
  return {res,stat,used,typed:typed.length};}
function paternityIndex(sim,man){const c=getCase(sim),kid=c.lanes.find(l=>l.ev).g,mom=c.lanes.find(l=>l.id==='mo').g;let cpi=1;
  [...sim.st.typed].forEach(id=>{const L=LOC(id),k=kid[id],m=mom[id],f=man[id];let X=0,Y=0;
    m.forEach(ma=>{f.forEach(fa=>{if(same([ma,fa].sort((a,b)=>a-b),k))X+=0.25;});if(k.includes(ma)){const other=k[0]===ma?k[1]:k[0];Y+=0.5*(L.freq[other]||0.01);}});
    cpi*=Y>0?X/Y:1;});return cpi;}
function verdictFor(sim,l){const v=compare(sim).res[l.id];if(!v)return '';if(!compare(sim).used)return 'not typed yet';
  if(getCase(sim).type==='paternity'&&l.id!=='mo'&&v.mis===1)return '1 mismatch: type more loci';
  if(v.mis)return getCase(sim).type==='paternity'?(l.id==='mo'?'check sample':'Excluded'):'Excluded';return getCase(sim).type==='paternity'?(l.id==='mo'?'Consistent':'Not excluded'):'Cannot be excluded';}
const oneIn=p=>p>0?'1 in '+(1/p>=1e4?sci(1/p,2):Math.round(1/p).toLocaleString('en-US')):'—';

/* ---------- local helpers ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def;
  const sel=document.getElementById(d.id+'-lane');if(sel){const ls=getCase(sim).lanes;[...sel.options].forEach((o,i)=>{o.textContent=ls[i+1]?ls[i+1].name:'Sample '+(i+1);});}
  d.controls.forEach(c=>{if(!c.only)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.only(sim);});
  d.metrics.forEach(m=>{if(!m.only)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.only(sim);});}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function panel(ctx,b,title,k){ctx.fillStyle=PAL['card'];rr(ctx,b.x,b.y,b.w,b.h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,title,b.x+12,b.y+22,{s:14*k,w:700});}

/* ---------- layout ---------- */
const LP={x:12,y:12,w:272,h:426},RP={x:296,y:12,w:492,h:426};
const GEL={x:RP.x+40,y:RP.y+70,w:RP.w-52,h:RP.h-96};
const laneX=(i,n)=>GEL.x+GEL.w*(i+0.5)/n;
/* migration: distance ∝ log of size (shorter fragments travel farther); the window shows this locus’s size range */
function yOf(L,size,r){const lo=bp(L,L.lad[0])-6,hi=bp(L,L.lad[1])+6,d=(Math.log(hi+8)-Math.log(size))/(Math.log(hi+8)-Math.log(lo));return GEL.y+8+r*d*(GEL.h-22);}
const runDone=sim=>!sim.st.pcr&&!sim.st.gelOn&&sim.st.gel>=1;

const DNA={
  id:'dna',hash:'dna',apUnit:7,order:2,tab:'DNA profiling',kind:'Virtual lab',prereq:['crimescene'],next:['bloodspatter'],
  card:'Copy DNA with PCR, run STR fragments on a gel, read each person’s alleles, and decide who is excluded, who matches and how rare the match is.',
  title:'DNA profiling: PCR, electrophoresis and STR matching',
  lede:{bio:'Everyone’s DNA has short sequences repeated over and over, and the number of repeats differs from person to person. Copy those regions, sort them by size, and compare the evidence with each person.',
        honors:'Each STR locus gives two alleles, one from each parent. PCR copies them, electrophoresis separates them by length against an allelic ladder, and any one mismatch excludes a person.',
        ap:'Use the product rule with Hardy–Weinberg genotype frequencies to find the random match probability, then see how mixtures, degraded DNA and allele dropout weaken a profile.'},
  scale:{bio:'One STR region is 100–250 base pairs long, about 35–85 nm of DNA. The gel window shows one locus, about 5 cm of a real gel.',ap:'Amplicons of 111–255 bp at six CODIS loci (4 bp repeats); detection limit about 50 RFU, about 10⁹ copies. The gel window shows one locus; the capillary view shows all six.'},
  timeless:true,animated:true,chReveal:5,
  controls:[
    {id:'case',label:'Case',type:'select',def:'single',lvl:'bio',noTrial:true,options:Object.keys(CASES).map(k=>({v:k,l:CASES[k].name,lvl:CASES[k].lvl==='bio'?undefined:CASES[k].lvl}))},
    {id:'locus',label:'STR locus on the gel',type:'select',def:'TH01',lvl:'bio',options:LOCI.map(L=>({v:L.id,l:L.id})),only:s=>s.p.detector!=='ce',help:'Each locus is a different spot on a different chromosome.'},
    {id:'cycles',label:'PCR cycles',type:'range',min:10,max:34,step:1,def:28,unit:'',lvl:'honors',help:'Crime labs usually run 28–30 cycles.'},
    {id:'labels',label:'Label the alleles',type:'toggle',def:false,lvl:'honors',noTrial:true,only:s=>s.p.detector!=='ce',help:'Read them against the ladder yourself first.'},
    {id:'detector',label:'Detector',type:'seg',def:'gel',lvl:'ap',noTrial:true,options:[{v:'gel',l:'Gel, one locus'},{v:'ce',l:'Capillary, all loci'}]},
    {id:'lane',label:'Sample in the capillary',type:'select',def:1,lvl:'ap',noTrial:true,only:s=>s.p.detector==='ce',options:[1,2,3,4,5].map(i=>({v:i,l:'Sample '+i}))},
    {id:'eff',label:'PCR efficiency',type:'range',min:70,max:100,step:5,def:100,unit:'%',lvl:'ap',help:'100% means every copy doubles each cycle.'}
  ],
  actions:[
    {id:'run',label:'Run PCR and gel',lvl:'bio',primary:true,run(sim){restartPCR(sim);}},
    {id:'all',label:'Type all six loci',lvl:'honors',run(sim){const st=sim.st;st.pcr=false;st.cyc=sim.p.cycles;st.gel=1;st.gelOn=false;LOCI.forEach(L=>st.typed.add(L.id));}},
    {id:'newcase',label:'New people, same case',lvl:'bio',run(sim){sim._seed=(sim._seed||1)+1;BioLab.reset(sim);}}
  ],
  init(sim){getCase(sim);return {cyc:0,pcr:true,gel:0,gelOn:false,typed:new Set(),k1:'',k2:''};},
  step(sim,dt){const st=sim.st,p=sim.p;const k1=p.case+'|'+(sim._seed||1)+'|'+p.cycles+'|'+p.eff,k2=p.locus+'|'+p.detector;
    if(st.k1!==k1){if(st.k1&&st.k1.split('|')[0]!==p.case)st.typed=new Set();st.k1=k1;st.k2=k2;restartPCR(sim);}
    else if(st.k2!==k2){st.k2=k2;if(!st.pcr){st.gel=0;st.gelOn=true;}}
    if(st.pcr){st.cyc=Math.min(p.cycles,st.cyc+dt*9);if(st.cyc>=p.cycles){st.pcr=false;st.gel=0;st.gelOn=true;}}
    else if(st.gelOn){st.gel=Math.min(1,st.gel+dt/3.2);if(st.gel>=1){st.gelOn=false;if(p.detector==='ce')LOCI.forEach(L=>st.typed.add(L.id));else st.typed.add(p.locus);sim.infoDirty=true;}}},
  metrics:[
    {id:'cyc',label:'PCR cycle',unit:'',lvl:'bio',min:0,max:34,d:0,get:s=>s.st.cyc},
    {id:'copies',label:'Copies of each allele',unit:'',lvl:'bio',text:true,get:s=>sci(amplify(evN0(s),s.st.cyc,s.p.eff/100),2)},
    {id:'typed',label:'Loci typed',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>s.st.typed.size+' of 6'},
    {id:'verdict',label:'So far',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>summary(s)},
    {id:'gf',label:'Evidence at this locus',unit:'',lvl:'honors',text:true,noTrial:true,get:s=>locusLine(s)},
    {id:'stat',label:'How rare is it?',unit:'',lvl:'ap',text:true,noTrial:true,get:s=>statLine(s)}
  ],
  graphs:[{id:'pcr',label:'Copies vs PCR cycle',lvl:'bio',custom:true},{id:'std',label:'Size vs distance traveled (ladder)',lvl:'honors',custom:true}],
  defaultGraph:'pcr',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='pcr'){const ax=axes(ctx,box,{xmin:0,xmax:34,ymin:1,ymax:12,xl:'PCR cycle',yl:'log₁₀(copies of one allele)',yd:0});
      const N0=evN0(sim),E=p.eff/100;const curve=(E2,col,dash,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash?[5,4]:[]);ctx.beginPath();for(let n=0;n<=34;n+=0.25){const y=Math.log10(amplify(N0,n,E2));n?ctx.lineTo(ax.X(n),ax.Y(y)):ctx.moveTo(ax.X(n),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);};
      if(E<1)curve(1,PAL['muted'],true,1.5);curve(E,PAL['s2'],false,2.5);
      ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(9));ctx.lineTo(box.L+box.W,ax.Y(9));ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'enough to detect (about 10⁹ copies)',box.L+6,ax.Y(9)-6,{s:12,c:PAL['s1']});
      const y=Math.log10(amplify(N0,sim.st.cyc,E));ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(ax.X(sim.st.cyc),ax.Y(y),6,0,TAU);ctx.fill();
      txt(ctx,'start: '+Math.round(N0)+' copies'+(E<1?' · dashed = 100% efficiency':''),box.L+box.W-4,box.T+box.H-8,{s:12,c:PAL['muted'],a:'right'});return;}
    const L=LOC(p.locus),dist=a=>(yOf(L,bp(L,a),1)-GEL.y)/GEL.h*60;const xs=L.ladder.map(dist),ys=L.ladder.map(a=>bp(L,a));
    const ax=axes(ctx,box,{xmin:0,xmax:60,ymin:Math.min(...ys)-6,ymax:Math.max(...ys)+6,xl:'Distance from the well (mm)',yl:'Fragment size (bp)'});
    ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();L.ladder.forEach((a,i)=>{i?ctx.lineTo(ax.X(xs[i]),ax.Y(ys[i])):ctx.moveTo(ax.X(xs[i]),ax.Y(ys[i]));});ctx.stroke();
    L.ladder.forEach((a,i)=>{ctx.fillStyle=PAL['g-axis'];ctx.beginPath();ctx.arc(ax.X(xs[i]),ax.Y(ys[i]),4,0,TAU);ctx.fill();});
    const ev=getCase(sim).lanes.find(l=>l.ev);call(sim,ev,L).al.forEach(a=>{ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(dist(a)),ax.Y(bp(L,a)),7,0,TAU);ctx.fill();txt(ctx,aTxt(a)+' ('+bp(L,a)+' bp)',ax.X(dist(a))+10,ax.Y(bp(L,a))-8,{s:12,c:PAL['fg'],w:700});});
    legend(ctx,box.L+10,box.T+10,[{label:'ladder alleles ('+L.id+')',color:PAL['g-axis']},{label:'evidence',color:PAL['s1']}]);},
  infoPanel(sim){const c=getCase(sim),hon=atLeast('honors'),ap=atLeast('ap'),cmp=compare(sim),refs=c.lanes.filter(l=>l.ref),ev=c.lanes.find(l=>l.ev);
    const head=`<tr><th>Locus</th><th>${ev.short}</th>${refs.map(l=>`<th>${l.short}</th>`).join('')}</tr>`;
    const rows=LOCI.map(L=>{const t=sim.st.typed.has(L.id);if(!t)return `<tr><td>${L.id}</td><td colspan="${refs.length+1}" style="color:var(--muted)">not typed yet</td></tr>`;
      const cl=call(sim,ev,L);const evTxt=cl.st==='none'?'no result':gTxt(cl.al)+(cl.st==='risk'?' (dropout?)':'');
      const cells=refs.map(l=>{const g=l.g[L.id];let ok;
        if(cl.st==='none'||(cl.st==='risk'&&c.type!=='paternity'))ok=null;
        else if(c.type==='paternity'){const ob=obligate(ev.g[L.id],c.lanes.find(x=>x.id==='mo').g[L.id]);ok=l.id==='mo'?ev.g[L.id].some(a=>g.includes(a)):ob.some(a=>g.includes(a));}
        else if(c.type==='mixture')ok=g.every(a=>cl.al.includes(a));
        else ok=same(g,cl.al.length===1?[cl.al[0],cl.al[0]]:cl.al);
        return `<td style="${ok===false?'color:var(--bad);font-weight:700':''}">${gTxt(g)}${ok===false?' ✗':''}</td>`;}).join('');
      return `<tr><td>${L.id}</td><td><b>${evTxt}</b></td>${cells}</tr>`;}).join('');
    const vrow=`<tr><td><b>Conclusion</b></td><td></td>${refs.map(l=>`<td><b>${verdictFor(sim,l)}</b></td>`).join('')}</tr>`;
    let h=`<h3>${CASES[c.type].name}</h3><p class="help">${STORY[c.type]}</p><div class="tbl-wrap"><table><thead>${head}</thead><tbody>${rows}${vrow}</tbody></table></div>`;
    if(c.type==='paternity')h+=`<p class="help">The child got one allele from each parent. The allele not from the mother must come from the father: a man without it at two or more loci is excluded.${ap?' A single mismatch can be a mutation, so labs require two or more.':''}</p>`;
    else if(c.type==='mixture')h+=`<p class="help">Up to four alleles per locus from two people. A person is included if every one of their alleles appears in the mixture.</p>`;
    else h+=`<p class="help">${hon?'“Cannot be excluded” means every typed locus matches. ':''}One clear mismatch at any locus excludes a person.${ap&&c.type==='degraded'?' Loci with no result or a possible dropout are left out of the comparison.':''}</p>`;
    if(ap&&cmp.used&&c.type!=='paternity')h+=`<p class="help">${c.type==='mixture'?'Combined probability of inclusion':'Random match probability'} over ${cmp.used} usable loci: ${oneIn(cmp.stat)}.</p>`;
    if(ap&&c.type==='paternity'&&cmp.used){h+='<p class="help">'+refs.filter(l=>l.id!=='mo').map(l=>{const cpi=paternityIndex(sim,l.g),v=compare(sim).res[l.id];return l.name+': '+(v.mis>=2?'excluded':'CPI = '+fmtBig(cpi)+', probability '+(100*cpi/(cpi+1)).toFixed(cpi>1e3?3:1)+'%');}).join('<br>')+'</p>';}
    return h;},
  narrate(sim){const st=sim.st,p=sim.p,c=getCase(sim),hon=atLeast('honors'),ap=atLeast('ap');
    if(st.pcr)return 'PCR cycle '+Math.floor(st.cyc)+': heat splits each DNA double strand, primers stick to the ends of the STR region, and the enzyme copies it. <b>Each cycle doubles the copies</b>'+(p.eff<100?' (here only '+p.eff+'% of them copy each cycle)':'')+'.';
    const L=LOC(p.locus),ev=c.lanes.find(l=>l.ev),cl=call(sim,ev,L);
    if(p.detector==='ce'&&ap&&!st.gelOn){const sm=summary(sim);if(c.type==='degraded')return 'Peak heights fall as the fragments get longer (a <b>ski slope</b>): damaged DNA has few long pieces left, so D21S11 and FGA drop out. '+sm+'.';
      return 'Each peak is one allele; its height (RFU) shows how much DNA there was. <b>Two peaks at a locus means two different alleles</b>'+(c.type==='mixture'?', and more than two means a mixture':'')+'. '+sm+'.';}
    if(st.gelOn)return p.detector==='ce'?'The fragments race through a thin capillary. <b>Short fragments arrive first</b>, and a laser reads each colored tag as it passes.':'DNA is negatively charged, so the fragments move toward the + end. <b>Shorter fragments slip through the gel faster</b> and travel farther.';
    if(cl.st==='none'&&p.detector!=='ce')return amplify(evN0(sim),p.cycles,p.eff/100)<DET?'After only '+p.cycles+' cycles there are too few copies: <b>the evidence bands are too faint to see</b>. Run more cycles.':'At '+L.id+' the long fragments in this damaged sample are gone: <b>no result at this locus</b>.';
    if(ap&&cl.st==='risk')return 'Only one weak peak shows at '+L.id+'. It might be a true homozygote, or <b>the other allele may have dropped out</b>. Analysts treat this locus as inconclusive.';
    const s=summary(sim);
    if(c.type==='paternity')return 'The child’s alleles at '+L.id+' are '+gTxt(ev.g[L.id])+'. One came from the mother; <b>the other must come from the father</b>. '+(st.typed.size<6?'Type more loci to be sure.':s);
    if(c.type==='mixture')return 'The mixture shows '+cl.al.length+' alleles at '+L.id+': <b>two people’s DNA together</b>. Taller bands come from the person who left more DNA.';
    return 'Read each band against the ladder. At '+L.id+' the evidence is <b>'+gTxt(cl.al)+'</b>. '+(st.typed.size<3?'One locus is not enough: many people share any one genotype.':s);},
  tour:[
    {title:'The case',text:'A trophy case was broken open and a water bottle was left behind. Saliva on it holds cheek cells, and each cell holds DNA. We will compare it with an elimination sample from the coach and with three suspects (all fictional).',focus:[RP.x,RP.y,RP.w,RP.h],pause:true,setup(sim){BioLab.setValues(sim,{case:'single',locus:'TH01',detector:'gel',cycles:28,eff:100});}},
    {title:'PCR copies the STR regions',text:'Each cycle: heat to 95 °C to split the strands, cool to about 60 °C so primers bind, then 72 °C so the enzyme copies the region. Watch the copy count double every cycle.',focus:[LP.x,LP.y,LP.w,LP.h],speed:0.35,setup(sim){restartPCR(sim);}},
    {title:'From a few hundred to billions',text:{bio:'After n cycles you have 2ⁿ times as many copies. 28 cycles turns 150 copies into about 4 × 10¹⁰, enough to see.',honors:'After n cycles you have 2ⁿ times as many copies, until the primers and nucleotides start to run out and the curve levels off (the plateau).'},focus:[LP.x,LP.y,LP.w,LP.h],speed:1},
    {title:'Gel electrophoresis',text:'The copies go into wells at the − end. DNA is negatively charged, so it moves toward the + end. Shorter fragments slip through the gel faster and travel farther.',focus:[RP.x,RP.y,RP.w,RP.h],speed:0.5,setup(sim){const st=sim.st;st.pcr=false;st.cyc=sim.p.cycles;st.gel=0;st.gelOn=true;}},
    {title:'Read against the ladder',text:'The allelic ladder holds every common allele. Line up each sample band with a ladder band to read its repeat number. Two bands means two different alleles, one from each parent; one band means both are the same.',focus:[RP.x,RP.y,RP.w,RP.h],pause:true,setup(sim){const st=sim.st;st.gel=1;st.gelOn=false;st.typed.add('TH01');BioLab.setValues(sim,{labels:true});}},
    {title:'Compare: one mismatch excludes',text:'A person whose bands differ at any locus cannot be the source. A person who matches at every locus “cannot be excluded”. One locus is not enough, so labs type many.',focus:[RP.x,RP.y,RP.w,RP.h],pause:true,setup(sim){const st=sim.st;LOCI.forEach(L=>st.typed.add(L.id));}},
    {lvl:'ap',title:'How rare is the match?',text:'Multiply the genotype frequencies across loci (the product rule): 2pq for two different alleles, p² for two the same. Six loci give odds of about one in tens of millions; the 20 CODIS loci give far smaller numbers.',focus:[RP.x,RP.y,RP.w,RP.h],pause:true},
    {lvl:'ap',title:'All loci at once',text:'Crime labs run all loci together with colored tags in a capillary. The electropherogram shows a peak for each allele; the peak height (RFU) tracks how much DNA there was.',focus:[RP.x,RP.y,RP.w,RP.h],pause:true,setup(sim){BioLab.setValues(sim,{detector:'ce',lane:1});const st=sim.st;st.gel=1;st.gelOn=false;st.k2=sim.p.locus+'|ce';}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);BioLab.reset(sim);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.typeAll){const st=sim.st;st.k1=sim.p.case+'|'+(sim._seed||1)+'|'+sim.p.cycles+'|'+sim.p.eff;st.k2=sim.p.locus+'|'+sim.p.detector;st.pcr=false;st.cyc=sim.p.cycles;st.gel=1;st.gelOn=false;LOCI.forEach(L=>st.typed.add(L.id));}syncMode(sim);BioLab.refresh(sim);}},
  challenges(sim){const c1=buildCase('single',sim._seed||1),dIdx=c1.lanes.findIndex(l=>l.key==='decoy'),dName=c1.lanes[dIdx].name;
    const L=LOC('TH01'),s6=bp(L,6),s93=bp(L,9.3),dg=buildCase('degraded',sim._seed||1),dev=dg.lanes.find(l=>l.ev);
    return [
    {lvl:'bio',instant:true,q:'PCR starts with one copy of a DNA region. How many copies are there after 10 cycles?',choices:['20','100','1,024'],correct:2,
     explain:{bio:'Each cycle doubles the number: 2, 4, 8, … so after 10 cycles there are 2¹⁰ = 1,024 copies. After 28 cycles, one copy becomes about 270 million. That is why a tiny sample can be enough.'}},
    {lvl:'bio',q:'At TH01, allele 6 is '+s6+' bp long and allele 9.3 is '+s93+' bp long. They start together in the well. Which one travels farther?',choices:['Allele 6, the shorter one','Allele 9.3, the longer one','They travel together'],correct:0,
     baseline:{case:'single',locus:'TH01',detector:'gel',cycles:28},changeText:'Running the PCR and the gel',at:0.2,reveal:7.5,watch:'cyc',
     explain:{bio:'Shorter fragments wiggle through the gel’s tiny pores more easily, so they move faster and end up farther from the well. On the ladder, the low repeat numbers sit near the bottom.'}},
    {lvl:'bio',instant:true,set:{case:'single',locus:'TH01',detector:'gel'},typeAll:true,q:dName+' matches the evidence at 4 of the 6 loci. What do you conclude?',choices:[''+dName.replace('Suspect ','Suspect ')+' is probably the source','The two mismatches exclude '+dName,'Run a seventh locus to break the tie'],correct:1,
     explain:{bio:'All six loci are typed now; look at the ✗ marks in the table. The evidence came from one person, and that person has one genotype at every locus. A single clear mismatch rules someone out, no matter how many other loci match. Relatives often share many alleles.'}},
    {lvl:'honors',q:'You run only 20 PCR cycles instead of 28. What do the evidence bands look like?',choices:['The same, just a little lighter','Too faint to see: about 250 times fewer copies','More bands appear'],correct:1,
     baseline:{case:'single',locus:'TH01',detector:'gel',cycles:28},change:{cycles:20},at:6.6,reveal:12.5,changeText:'Running again with 20 cycles',watch:'cyc',
     explain:{honors:'Eight fewer cycles means 2⁸ = 256 times fewer copies: about 1.6 × 10⁸ instead of 4 × 10¹⁰, below the roughly 10⁹ needed to detect. The ladder and the reference samples still show because they were amplified from plenty of DNA.'}},
    {lvl:'honors',instant:true,q:'At D8S1179 a child is 14, 17 and the mother is 14, 15. Which allele must have come from the biological father?',choices:['14','15','17'],correct:2,
     explain:{honors:'The child has one allele from each parent. The mother could have passed the 14, but she has no 17, so the 17 is the obligate paternal allele. Any man without a 17 at this locus is inconsistent with being the father.'}},
    {lvl:'honors',instant:true,q:'At one locus a person is 15, 16. Allele 15 has frequency 0.25 and allele 16 has frequency 0.20. How common is this genotype?',choices:['0.05 (1 in 20)','0.10 (1 in 10)','0.45 (about 1 in 2)'],correct:1,
     explain:{honors:'A genotype with two different alleles can come from either parent in either order, so its frequency is 2pq = 2 × 0.25 × 0.20 = 0.10. That is 1 in 10 people: one locus alone is far from unique.'}},
    {lvl:'honors',instant:true,q:'Why does the lab type the coach, who owns the trophy case?',choices:['The coach is a suspect','To rule out DNA from someone who is supposed to be there','To calibrate the ladder'],correct:1,
     explain:{honors:'Elimination samples come from people with a normal reason to have touched the evidence (owners, first responders, lab staff). If their profile shows up, it is explained and not mistaken for the offender’s.'}},
    {lvl:'ap',instant:true,q:'Genotype frequencies at three loci are 0.10, 0.05 and 0.20. Using the product rule, what is the random match probability for all three?',choices:['0.35 (add them)','0.001 (1 in 1,000)','0.05 (use the rarest)'],correct:1,
     explain:{ap:'The loci are on different chromosomes and inherited independently, so the probabilities multiply: 0.10 × 0.05 × 0.20 = 0.001, or 1 in 1,000. Six loci in this lab give about 1 in tens of millions; the 20 CODIS core loci give numbers like 1 in 10¹⁸.'}},
    {lvl:'ap',instant:true,set:{case:'degraded',detector:'ce',lane:1},typeAll:true,q:'In the degraded stain, the largest loci (D21S11, FGA) show weak or missing peaks. What is the right conclusion at those loci?',choices:['The person is homozygous there','No reliable result: the long fragments broke down (allele dropout)','The person has no alleles there'],correct:1,
     explain:{ap:'Heat and time cut DNA into short pieces, so long amplicons fail first and peak heights slope down with size (a “ski slope”). A missing or single low peak below the stochastic threshold (about 200 RFU) is treated as inconclusive. Check the table: a look-alike who differs only at those loci now “cannot be excluded” too, so the partial profile is much weaker evidence.'}},
    {lvl:'ap',instant:true,q:'The random match probability for a profile is 1 in 10 million. What does that mean?',choices:['There is a 1 in 10 million chance the suspect is innocent','About 1 in 10 million unrelated people would match by chance','The lab is 99.99999% accurate'],correct:1,
     explain:{ap:'The RMP answers “how rare is this profile?”, not “how likely is the suspect guilty?” Treating it as the chance of innocence is the prosecutor’s fallacy. In a country of 330 million people, about 33 unrelated people might match, and lab error rates (often 1 in hundreds to thousands) can matter more than the RMP.'}},
    {lvl:'ap',instant:true,set:{case:'mixture',detector:'gel',locus:'D8S1179'},typeAll:true,q:'A suspect’s alleles all appear in a two-person mixture. Compared with a single-source match, how strong is that evidence?',choices:['Just as strong','Much weaker: many more people would also be included','Stronger, because two people are involved'],correct:1,
     explain:{ap:'With up to four alleles per locus, many genotypes fit inside the mixture. The combined probability of inclusion (CPI) multiplies (sum of the mixture’s allele frequencies)² across loci, and it is far larger than a single-source RMP. Modern labs use probabilistic genotyping software for mixtures.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> Which suspect’s DNA matches the water bottle?</p><ol><li>Press Run PCR and gel. Watch the copy count, then the bands move.</li><li>Read the evidence bands against the ladder and write the two allele numbers.</li><li>Change the STR locus and run each of the six loci. The table fills in as you go.</li><li>Mark every mismatch.</li></ol><p>Who is excluded, and who cannot be excluded? Why do labs test many loci instead of one?</p><p class="help">In a real lab: gloves at all times, never touch the gel stain or the UV light box without a shield, and dispose of gels as your teacher directs.</p>',
       honors:'<p><b>Question:</b> How many PCR cycles do you need to see a profile?</p><ol><li>Set PCR cycles to 14, 18, 20, 22, 24, 26 and 28. For each, run PCR and gel and press Record trial.</li><li>Note whether the evidence bands are visible.</li><li>Then solve Case 2: find the obligate paternal allele at each locus and decide which man is excluded.</li></ol><p>Explain the cycle cutoff using 2ⁿ, and explain paternity exclusion using how alleles are inherited.</p>',
       ap:'<p><b>Question:</b> How strong is a DNA match, and what weakens it?</p><ol><li>Case 1: type all six loci and record the random match probability. Show the product-rule calculation for two loci by hand.</li><li>Case 4: switch to the capillary view and record the peak heights for each locus. Which loci drop out, and which suspects can no longer be excluded?</li><li>Case 3: compare the CPI with the single-source RMP.</li></ol><p><b>Claim–evidence–reasoning:</b> Write a one-paragraph lab report for a jury on Case 4 that states what the DNA shows and what it cannot show. Avoid the prosecutor’s fallacy.</p>'},
  terms:[{t:'DNA profile',d:'A person’s set of alleles at several chosen loci.'},{t:'STR (short tandem repeat)',d:'A short sequence (here 4 bases) repeated several times in a row. People differ in the number of repeats.'},{t:'Allele',d:'One version of a locus, named by its repeat number (e.g. 9.3 = 9 full repeats plus 3 bases).'},{t:'PCR',d:'Polymerase chain reaction: cycles of heating and cooling that double a chosen DNA region each cycle.'},{t:'Gel electrophoresis',d:'Separating DNA by size: an electric field pulls the negative DNA through a gel, and shorter pieces travel farther.'},{t:'Exclusion',d:'A mismatch at any locus that rules a person out as the source.'},
    {lvl:'honors',t:'Locus (plural loci)',d:'A specific place on a chromosome. The FBI’s CODIS system uses 20 core STR loci.'},{lvl:'honors',t:'Allelic ladder',d:'A mixture of all common alleles of a locus, run next to the samples to read repeat numbers.'},{lvl:'honors',t:'Heterozygous / homozygous',d:'Two different alleles (two bands) or two copies of the same allele (one band).'},{lvl:'honors',t:'Obligate paternal allele',d:'The child’s allele that cannot have come from the mother, so it must have come from the father.'},{lvl:'honors',t:'Elimination sample',d:'DNA from someone with a legitimate reason to be at the scene, used to explain their profile.'},
    {lvl:'ap',t:'Product rule',d:'Multiplying genotype frequencies across independent loci to get the random match probability.'},{lvl:'ap',t:'Random match probability (RMP)',d:'The chance that an unrelated person picked at random has the same profile.'},{lvl:'ap',t:'Allele dropout',d:'An allele that fails to show because there was too little or too damaged DNA.'},{lvl:'ap',t:'Electropherogram',d:'The capillary readout: peaks of fluorescence (RFU) against fragment size.'},{lvl:'ap',t:'Prosecutor’s fallacy',d:'Mistaking the RMP for the chance that the suspect is innocent.'},{lvl:'ap',t:'Paternity index',d:'How many times more likely the child’s alleles are if the man is the father than if a random man is.'}],
  about:'<p><b>Loci and alleles.</b> The six loci are real CODIS core loci. Amplicon sizes follow the Identifiler kit design (4 bp per repeat plus a fixed flanking length, microvariants like 9.3 add 3 bp), and the allele frequencies are rounded from published US population data. All people and cases are fictional and generated from those frequencies.</p><p><b>PCR.</b> Copies grow as N<sub>k+1</sub> = N<sub>k</sub>(1 + E(1 − N<sub>k</sub>/N<sub>max</sub>)), which doubles each cycle at efficiency E = 100% and levels off near N<sub>max</sub> = 2 × 10¹¹ copies. The evidence starts with 150 copies of each allele (about 1 ng of DNA); the degraded stain starts with 40, further reduced by e<sup>−(size−100)/42</sup> to mimic DNA broken into short pieces. About 10⁹ copies (50 RFU) are needed to detect an allele; a single peak under 200 RFU is flagged as possible dropout.</p><p><b>Separation.</b> Distance traveled is proportional to −log(size), the usual standard curve. Real 4 bp differences need a polyacrylamide gel or a capillary; a classroom agarose gel cannot resolve them, and real kits read all loci at once in a capillary with four or five dye colors.</p><p><b>Statistics.</b> Genotype frequencies use Hardy–Weinberg (2pq or p²) and the product rule, with no population-structure correction. The paternity index assumes the mother is known and uses a 50% prior for the probability of paternity. Mixtures use the combined probability of inclusion. Real labs also report lab error and use probabilistic genotyping for mixtures.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const key=BioLab.level+sim.p.detector;if(sim._sk!==key){sim._sk=key;syncMode(sim);}
    drawPCR(sim,ctx,k,t);if(sim.p.detector==='ce'&&atLeast('ap'))drawCE(sim,ctx,k,t);else drawGel(sim,ctx,k,t);},
  thumbFrames:90
};
function evN0(sim){const ev=getCase(sim).lanes.find(l=>l.ev);return ev.N0*(ev.mix?0.7:1)*(ev.deg?0.5:1);}
function restartPCR(sim){const st=sim.st;st.cyc=0;st.pcr=true;st.gel=0;st.gelOn=false;}
function fmtBig(v){return v>=1e4?sci(v,2):v>=10?Math.round(v).toLocaleString('en-US'):v.toFixed(2);}
function summary(sim){const c=getCase(sim),cmp=compare(sim);if(!cmp.used)return 'Run and read a locus';
  const refs=c.lanes.filter(l=>l.ref&&l.id!=='mo');const need=c.type==='paternity'?2:1,exc=refs.filter(l=>cmp.res[l.id].mis>=need).map(l=>l.short),inc=refs.filter(l=>cmp.res[l.id].mis<need).map(l=>l.short);
  const word=c.type==='paternity'?'not excluded':'cannot be excluded';
  return (exc.length?'Excluded: '+exc.join(', '):'No one excluded yet')+(inc.length?' · '+word+': '+inc.join(', '):'');}
function locusLine(sim){const c=getCase(sim),p=sim.p,L=LOC(p.locus),ev=c.lanes.find(l=>l.ev),cl=call(sim,ev,L);if(!sim.st.typed.has(L.id))return 'Run and read '+L.id+' first';
  if(c.type==='paternity'){const ob=obligate(ev.g[L.id],c.lanes.find(l=>l.id==='mo').g[L.id]);return 'Child '+gTxt(ev.g[L.id])+' · from father: '+ob.map(aTxt).join(' or ');}
  if(cl.st==='none')return 'No result at '+L.id;if(cl.st==='risk')return gTxt(cl.al)+': possible dropout';
  if(c.type==='mixture')return cl.al.length+' alleles: '+gTxt(cl.al);const g=cl.al.length===1?[cl.al[0],cl.al[0]]:cl.al;return gTxt(cl.al)+' · '+(g[0]===g[1]?'p²':'2pq')+' = '+oneIn(genoFreq(L,g));}
function statLine(sim){const c=getCase(sim),cmp=compare(sim);if(!cmp.used)return 'Type some loci first';
  if(c.type==='paternity'){const men=c.lanes.filter(l=>l.ref&&l.id!=='mo'&&cmp.res[l.id].mis<2);if(!men.length)return 'All men excluded';const m=men.slice().sort((a,b)=>paternityIndex(sim,b.g)-paternityIndex(sim,a.g))[0],cpi=paternityIndex(sim,m.g);return m.short+': CPI '+fmtBig(cpi)+' ('+(100*cpi/(cpi+1)).toFixed(2)+'%)';}
  return (c.type==='mixture'?'CPI ':'RMP ')+oneIn(cmp.stat)+' ('+cmp.used+' loci)';}

/* ---------- drawing ---------- */
function drawPCR(sim,ctx,k,t){const st=sim.st,p=sim.p,ap=atLeast('ap'),E=p.eff/100,N0=evN0(sim);const phn=k>1.35;panel(ctx,LP,phn?'1. PCR':'1. Copy the DNA (PCR)',k);
  // thermal cycler tube
  const tx=LP.x+44,ty=LP.y+60;ctx.fillStyle='rgba(160,200,215,.25)';ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx-16,ty);ctx.lineTo(tx+16,ty);ctx.lineTo(tx+16,ty+44);ctx.lineTo(tx,ty+74);ctx.lineTo(tx-16,ty+44);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=PAL['cv-lamp'];rr(ctx,tx-19,ty-12,38,12,3);ctx.fill();
  const phase=st.pcr?(st.cyc%1):0.99,temp=phase<0.33?95:phase<0.6?60:72,tc=temp===95?PAL['s1']:temp===60?PAL['s2']:PAL['s4'];
  ctx.fillStyle=st.pcr?tc:PAL['muted'];ctx.globalAlpha=0.55;ctx.beginPath();ctx.moveTo(tx-12,ty+20);ctx.lineTo(tx+12,ty+20);ctx.lineTo(tx+12,ty+43);ctx.lineTo(tx,ty+66);ctx.lineTo(tx-12,ty+43);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  txt(ctx,st.pcr?temp+' °C':'done',tx,ty+96,{s:13*k,w:700,a:'center',c:st.pcr?tc:PAL['cv-soft']});
  if(st.pcr&&k<1.35)txt(ctx,temp===95?'split':temp===60?'primers bind':'copy',tx,ty+114,{s:12*k,a:'center',c:PAL['cv-soft']});
  txt(ctx,'Cycle',LP.x+96,LP.y+66,{s:12*k,c:PAL['cv-soft']});txt(ctx,Math.floor(st.cyc)+' of '+p.cycles,LP.x+96,LP.y+66+22*k,{s:20*k,w:700});
  // doubling picture: copies of one starting molecule, shown up to 64
  if(!phn){const n=Math.min(64,Math.pow(2,Math.floor(st.cyc))),gx=LP.x+96,gy=LP.y+108+18*(k-1),cols=16,cw=10,chh=11;
  for(let i=0;i<n;i++){const x=gx+(i%cols)*cw,y=gy+Math.floor(i/cols)*chh;ctx.strokeStyle=i===0?PAL['s1']:PAL['s2'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+8);ctx.moveTo(x+3,y);ctx.lineTo(x+3,y+8);ctx.stroke();}
  txt(ctx,Math.pow(2,Math.floor(st.cyc))>64?'1 copy → 2'+supN(Math.floor(st.cyc))+' (64 shown)':'1 copy → '+n+(n===1?' copy':' copies'),gx,gy+4*chh+16*k,{s:12*k,c:PAL['cv-soft']});}
  // copies meter on a log scale
  const mx=LP.x+18,my=LP.y+262,mw=LP.w-36,c=amplify(N0,st.cyc,E),lg=Math.log10(Math.max(1,c)),X=v=>mx+mw*v/12;
  txt(ctx,phn?'Copies':'Copies of each evidence allele',mx,my-30*k-4,{s:12*k,c:PAL['cv-soft']});txt(ctx,sci(c,2),mx,my-8,{s:18*k,w:700});
  ctx.fillStyle=PAL['card2'];rr(ctx,mx,my+4,mw,16,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();ctx.fillStyle=c>=DET?PAL['s3']:PAL['s2'];rr(ctx,mx,my+4,Math.max(8,X(lg)-mx),16,8);ctx.fill();
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(9),my);ctx.lineTo(X(9),my+24);ctx.stroke();txt(ctx,'detectable',phn?X(9)-4:X(9),phn?my+62*k:my+38*k,{s:12*k,c:PAL['s1'],a:phn?'right':'center'});
  [[0,'1'],[3,'10³'],[6,'10⁶'],[12,'10¹²']].forEach(([v,l])=>{if(!phn||v===0||v===12)txt(ctx,l,X(v),my+38*k,{s:12*k,c:PAL['cv-soft'],a:v===0?'left':v===12?'right':'center'});});
  // cycle formula
  const fy=LP.y+LP.h-16;txt(ctx,ap?'N = N₀(1 + E)ⁿ, E = '+p.eff+'%':'Copies double every cycle: × 2ⁿ',LP.x+14,fy,{s:13*k,w:700,c:PAL['cv-ink']});}
function laneSet(sim){const c=getCase(sim);return c.lanes;}
function drawGel(sim,ctx,k,t){const st=sim.st,p=sim.p,c=getCase(sim),L=LOC(p.locus),lanes=laneSet(sim),n=lanes.length,hon=atLeast('honors');
  panel(ctx,RP,(k>1.35?'2. Gel: ':'2. Separate by size: ')+L.id,k);
  ctx.fillStyle='#dfe8ec';rr(ctx,GEL.x,GEL.y,GEL.w,GEL.h,6);ctx.fill();ctx.strokeStyle='#a9bcc6';ctx.lineWidth=1;ctx.stroke();
  // electrodes
  txt(ctx,'−',GEL.x-14,GEL.y-6,{s:20*k,w:700,c:PAL['cv-ink'],a:'center'});txt(ctx,'+',GEL.x-14,GEL.y+GEL.h+16*k,{s:20*k,w:700,c:PAL['s1'],a:'center'});
  const r=st.pcr?0:st.gel,ev=lanes.find(l=>l.ev);
  lanes.forEach((ln,i)=>{const x=laneX(i,n),bw=Math.min(p.labels&&hon?(k>1.35?30:40):54,GEL.w/n-16);
    ctx.fillStyle='#9fb3bd';ctx.fillRect(x-bw/2,GEL.y+2,bw,5);
    const lbl=k>1.35?ln.short.replace('Evidence','Ev.').replace('Ladder','Lad.').replace('Mother','Mom').replace('Mixture','Mix').replace('Man ','M').replace('Child','Kid'):ln.short;
    txt(ctx,lbl,x,GEL.y-10,{s:12*k,w:ln.ev?700:400,c:ln.ev?PAL['rj']:PAL['cv-ink'],a:'center'});
    if(st.pcr&&!ln.ladder&&!ln.ref)return;
    bands(sim,ln,L,st.pcr?st.cyc:p.cycles).forEach(b=>{if(b.c<DET*0.35)return;const a=clamp(0.25+0.75*Math.log10(b.c/(DET*0.35))/1.7,0.12,1);const y=yOf(L,b.size,r);
      ctx.fillStyle=ln.ladder?'rgba(70,80,96,'+a.toFixed(3)+')':'rgba(29,63,143,'+a.toFixed(3)+')';rr(ctx,x-bw/2,y-2.5,bw,5,2);ctx.fill();
      if(r>=1&&p.labels&&hon&&!ln.ladder&&b.c>=DET)txt(ctx,aTxt(b.a),x+bw/2+2,y+4,{s:12*k,w:700,c:'#1d3f8f'});});
    if(ln.ev){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.strokeRect(x-bw/2-5,GEL.y-2,bw+10,GEL.h);ctx.setLineDash([]);}});
  // ladder allele numbers to the left of the gel
  if(r>=0.98){const fs=12*k;let last=-1e9;L.ladder.forEach(a=>{if(!Number.isInteger(a))return;const y=yOf(L,bp(L,a),1);if(Math.abs(y-last)<fs*1.05)return;last=y;txt(ctx,aTxt(a),GEL.x-6,y+4,{s:fs,c:PAL['cv-soft'],a:'right'});});
    if(k<1.35)txt(ctx,'ladder: repeat numbers',GEL.x,GEL.y+GEL.h+16,{s:12,c:PAL['cv-soft']});}
  else if(!st.pcr){txt(ctx,'running…',GEL.x+GEL.w/2,GEL.y+GEL.h+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
  if(st.pcr)txt(ctx,'Waiting for PCR…',GEL.x+GEL.w/2,GEL.y+GEL.h/2,{s:14*k,w:700,c:'#4a5a66',a:'center'});
  if(r>=1&&!st.pcr){const v=summary(sim);if(k<1.35)txt(ctx,v.length>58?v.slice(0,56)+'…':v,RP.x+12,RP.y+44,{s:12*k,c:PAL['cv-soft']});}}
function drawCE(sim,ctx,k,t){const st=sim.st,p=sim.p,c=getCase(sim),lanes=c.lanes,idx=clamp(Math.round(p.lane),1,lanes.length-1),ln=lanes[idx];
  panel(ctx,RP,'2. Capillary: '+(k>1.35?ln.short:ln.name),k);
  const B={x:RP.x+46,y:RP.y+48,w:RP.w-58,h:RP.h-84},rows=4,rh=B.h/rows,X=s=>B.x+(s-100)/(270-100)*B.w,r=st.pcr?0:st.gel;
  const all=[];LOCI.forEach(L=>bands(sim,ln,L,st.pcr?st.cyc:p.cycles).forEach(b=>all.push({L,b})));
  const ymax=Math.max(600,...all.map(o=>RFU(o.b.c)))*1.12;
  for(let d=0;d<rows;d++){const y0=B.y+d*rh,base=y0+rh-14,Y=v=>base-(v/ymax)*(rh-30);
    ctx.fillStyle=PAL['card2'];ctx.fillRect(B.x,y0+2,B.w,rh-6);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(B.x,base+.5);ctx.lineTo(B.x+B.w,base+.5);ctx.stroke();
    const dc=DYES[d].c==='#333338'?PAL['cv-ink']:DYES[d].c;ctx.fillStyle=dc;ctx.beginPath();ctx.arc(B.x-30,y0+rh/2,6,0,TAU);ctx.fill();
    ctx.setLineDash([3,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(B.x,Y(50));ctx.lineTo(B.x+B.w,Y(50));ctx.stroke();ctx.setLineDash([]);
    LOCI.filter(L=>DYE_OF[L.id]===d).forEach(L=>{const cx=X((bp(L,L.lad[0])+bp(L,L.lad[1]))/2);txt(ctx,L.id,cx,y0+15*Math.min(k,1.3)+2,{s:12*k,w:700,c:PAL['cv-soft'],a:'center'});});
    // trace
    const pk=all.filter(o=>DYE_OF[o.L.id]===d);ctx.strokeStyle=DYES[d].c==='#333338'?PAL['cv-ink']:DYES[d].c;ctx.lineWidth=1.6;ctx.beginPath();
    for(let s=100;s<=270;s+=0.4){let v=0;if(r>0){pk.forEach(o=>{const arrive=0.08+0.88*(o.b.size-100)/170;if(r>=arrive)v+=RFU(o.b.c)*Math.exp(-Math.pow((s-o.b.size)/0.9,2));});}const x=X(s),y=Y(Math.min(v,ymax));s===100?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
    if(r>=1){let lastX=-1e9,lift=0;pk.filter(o=>RFU(o.b.c)>=50).sort((a,b)=>a.b.size-b.b.size).forEach(o=>{const x=X(o.b.size);lift=x-lastX<22*k?lift+1:0;lastX=x;const y=Y(Math.min(RFU(o.b.c),ymax))-5-lift*13*k;txt(ctx,aTxt(o.b.a),x,y,{s:12*k,w:700,c:PAL['cv-ink'],a:'center'});});}}
  [100,150,200,250].forEach(s=>txt(ctx,s+' bp',X(s),B.y+B.h+16,{s:12*k,c:PAL['cv-soft'],a:'center'}));
  txt(ctx,'50 RFU',B.x+B.w-4,B.y+rh-14-(50/ymax)*(rh-30)-4,{s:12*k,c:PAL['cv-soft'],a:'right'});}
DNA.onLevel=syncMode;
DNA.controls.find(c=>c.id==='detector').onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
DNA.controls.find(c=>c.id==='case').onChange=sim=>{sim.infoDirty=true;syncMode(sim);};
BioLab.register(DNA);
})();

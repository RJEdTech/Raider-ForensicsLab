(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor,lvText}=BioLab.h;
const TAU=Math.PI*2;

/* ---------- the scene: a fictional break-in at a school chemistry room (no victim) ----------
   Room 9.0 m × 6.6 m, drawn at 0.589 px per cm. Coordinates in cm from the top-left corner. */
const RW=900,RH=660,R={x:20,y:34,S:0.589};
const X=x=>R.x+x*R.S,Y=y=>R.y+y*R.S;
const BENCHES=[[160,140],[480,140],[160,290],[480,290],[160,440],[480,440]].map(([x,y])=>({x,y,w:200,h:70}));
const DESK={x:330,y:24,w:240,h:62},CAB={x:842,y:96,w:50,h:220},HOOD={x:700,y:8,w:130,h:50};
const ITEMS=[
  {id:'glass',n:'Broken glass on the floor',sh:'Glass',x:46,y:236,loc:'open',d:0.55,trace:false,pack:['rigid','fold'],cls:'Class (individual only if pieces fit together)',pv:'Medium: shows the point of entry',tools:[],
    why:'Sharp pieces go in a rigid box so they cannot cut anyone or poke through. Tiny fragments can go in a druggist fold.'},
  {id:'shoe',n:'Shoe print in dust',sh:'Shoe print',x:112,y:270,loc:'open',d:0.45,trace:false,pack:['photo'],cls:'Class (individual if it has unique wear or cuts)',pv:'Medium: shows the path and shoe size',tools:[],
    why:'A print cannot be picked up. Photograph it with a scale from straight above, then lift it (electrostatic lifter) or cast it.'},
  {id:'blood',n:'Small blood drops by the window',sh:'Blood drops',x:34,y:190,loc:'open',d:0.40,trace:true,pack:['paper'],cls:'Individual (DNA)',pv:'High: the intruder likely cut a hand on the glass',tools:['bloodspatter','dna'],
    why:'Swab the drops, let the swabs air-dry, and package them in paper. Plastic traps moisture, and mold and bacteria destroy the DNA.'},
  {id:'fiber',n:'Fibers caught on the window frame',sh:'Fibers',x:8,y:304,loc:'surface',d:0.80,trace:true,pack:['fold'],cls:'Class',pv:'Low to medium: many garments share a fiber type',tools:['hairfiber'],
    why:'Trace evidence goes in a druggist fold (folded paper) and then an envelope, so nothing slips out through the corners.'},
  {id:'fp',n:'Fingerprint on the cabinet glass',sh:'Fingerprint',x:852,y:206,loc:'surface',d:0.55,trace:true,pack:['photo'],cls:'Individual',pv:'High: can point to one person',tools:['fingerprints'],
    why:'Photograph it first, then develop it with powder and lift it onto a card. The card is packaged in a paper envelope.'},
  {id:'pry',n:'Pry mark on the cabinet door',sh:'Pry mark',x:858,y:140,loc:'furniture',d:0.35,trace:false,pack:['photo'],cls:'Class (individual if tool marks are unique)',pv:'Medium: shows a tool was used',tools:[],
    why:'Photograph it with a scale and cast it with silicone, or remove the whole door. Never try to fit a suspect tool into the mark.'},
  {id:'powder',n:'Spilled white powder near the cabinet',sh:'Powder',x:806,y:262,loc:'furniture',d:0.50,trace:true,pack:['fold','plastic'],cls:'Class',pv:'Medium: tells what was taken or spilled',tools:['spottest','toxicology','spectroscopy'],
    why:'A dry powder goes in a druggist fold or a sealed plastic bag so none is lost. It is tested later in the lab.'},
  {id:'hair',n:'A hair under a lab bench',sh:'Hair',x:428,y:384,loc:'furniture',d:0.90,trace:true,pack:['fold'],cls:'Class (individual only with a root for DNA)',pv:'Medium',tools:['hairfiber','dna'],
    why:'Pick it up with clean forceps and place it in a druggist fold, then a paper envelope.'},
  {id:'bottle',n:'Water bottle left on a bench',sh:'Water bottle',x:560,y:318,loc:'surface',d:0.10,trace:false,pack:['paper'],cls:'Individual (saliva DNA, prints)',pv:'High, unless someone who uses the room left it',tools:['dna','fingerprints'],
    why:'Handle it by the edges with gloves and package it in a paper bag so moisture from the saliva can escape.'},
  {id:'note',n:'Torn handwritten note',sh:'Note',x:250,y:472,loc:'surface',d:0.20,trace:false,pack:['paper'],cls:'Individual (handwriting, ink)',pv:'Medium',tools:['handwriting','chromatography'],
    why:'Documents go flat in a paper envelope or folder. Never fold or write on them.'},
  {id:'usb',n:'USB drive under the teacher’s desk',sh:'USB drive',x:610,y:78,loc:'furniture',d:0.45,trace:false,pack:['antistatic'],cls:'Individual (its data)',pv:'High',tools:['hashing','filesig','metadata','recovery'],
    why:'Electronics go in an anti-static bag. In the lab it is copied with a write blocker and hashed before anyone looks at it.'}
];
const ITEM=id=>ITEMS.find(i=>i.id===id)||ITEMS[0];
const TOOLNAME={bloodspatter:'Blood spatter',dna:'DNA profiling',hairfiber:'Hair and fiber',fingerprints:'Fingerprints',spottest:'Spot tests',toxicology:'Toxicology',spectroscopy:'Spectroscopy',handwriting:'Handwriting',chromatography:'Ink chromatography',hashing:'Hashing',filesig:'File signatures',metadata:'Metadata',recovery:'Data recovery'};
const PACKS={paper:'Paper bag or envelope',plastic:'Plastic bag',fold:'Druggist fold in an envelope',rigid:'Rigid box or tube',can:'Airtight metal can',antistatic:'Anti-static bag',photo:'Photograph, then lift or cast'};
const WRONG={plastic:'A plastic bag traps moisture. Anything damp or biological can grow mold and lose its DNA.',can:'Airtight cans are for fire debris, so vapors of accelerants cannot escape.',paper:'A plain envelope lets tiny items slip out of the corners, and gives no protection from sharp edges or static.',fold:'A druggist fold is for tiny trace evidence, not this item.',rigid:'A rigid box is for sharp or fragile items.',antistatic:'Anti-static bags are for electronics.',photo:'This item can be collected, so it should be packaged, not just photographed.'};

/* ---------- search patterns ---------- */
const PAT={line:{l:'Line',base:{open:0.85,furniture:0.5,surface:0.6}},grid:{l:'Grid',base:{open:1.0,furniture:0.7,surface:0.8}},spiral:{l:'Spiral',base:{open:0.8,furniture:0.32,surface:0.48}},zone:{l:'Zone',base:{open:0.88,furniture:0.88,surface:0.88}}};
const SPEED=150;   // careful search, cm per minute
function spacingOf(p){return p.pattern==='spiral'?60:p.pattern==='zone'?40:RH/Math.round(p.n);}
function quality(p,it){const pt=PAT[p.pattern];let q=pt.base[it.loc];if(p.pattern==='line'||p.pattern==='grid')q*=clamp(1.25-spacingOf(p)/400,0.5,1.05);if(p.als&&atLeast('honors')&&it.trace)q+=0.15;return q;}
function serp(x0,y0,x1,y1,sp){const pts=[];let k=0;for(let y=y0+sp/2;y<=y1-sp/2+1;y+=sp){pts.push(k%2?[x1-20,y]:[x0+20,y],k%2?[x0+20,y]:[x1-20,y]);k++;}return pts;}
const PC={};
function plan(p){const n=Math.round(p.n),key=p.pattern+'|'+n;if(PC[key])return PC[key];let paths=[],hw;
  if(p.pattern==='line'||p.pattern==='grid'){const sp=RH/n;hw=sp/2;for(let i=0;i<n;i++){const y=sp*(i+0.5),pts=[[30,y],[RW-30,y]];if(p.pattern==='grid'){const xs=RW/n*(i+0.5);pts.push([xs,RH-30],[xs,30]);}paths.push(pts);}}
  else if(p.pattern==='spiral'){hw=30;const pts=[];let a=30,b=30,c=RW-30,d=RH-30;while(c-a>0&&d-b>0){pts.push([a,b],[c,b],[c,d],[a,d],[a,b+60]);a+=60;b+=60;c-=60;d-=60;}pts.push([a,(b+d)/2],[Math.max(a,c),(b+d)/2]);paths.push(pts);}
  else{hw=20;const zs=[[0,0,450,330],[450,0,900,330],[0,330,450,660],[450,330,900,660]],m=Math.min(4,n);for(let i=0;i<m;i++)paths.push([]);zs.forEach((z,i)=>{paths[i%m].push(...serp(...z,40));});}
  const lens=paths.map(pts=>{let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;});
  const Lmax=Math.max(...lens);
  // when (fraction of the search) each item first falls inside someone's sweep
  const cover={};ITEMS.forEach(it=>{let best=Infinity;paths.forEach(pts=>{let L=0;for(let i=1;i<pts.length&&L<best;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let s=0;s<=l;s+=8){const px=a[0]+(b[0]-a[0])*s/l,py=a[1]+(b[1]-a[1])*s/l;if(Math.hypot(px-it.x,py-it.y)<=hw+4){best=Math.min(best,L+s);break;}}L+=l;}});cover[it.id]=best/Lmax;});
  return PC[key]={paths,lens,Lmax,hw,cover,n:paths.length};}
const pointAt=(pts,d)=>{let L=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L+l>=d){const t=(d-L)/l;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}L+=l;}return pts[pts.length-1];};
function trampled(p){if(p.ppe)return false;const pl=plan(p),it=ITEM('shoe');return pl.cover[it.id]<=1;}
/* results of a full search with these settings */
function results(p){const pl=plan(p),out={};ITEMS.forEach(it=>{const t=pl.cover[it.id],ok=quality(p,it)>=it.d&&t<=1;out[it.id]=it.id==='shoe'&&trampled(p)?{found:false,trampled:true,t}:{found:ok,t};});return out;}
function foundNow(sim){const r=results(sim.p),pr=sim.st.prog;return ITEMS.filter(it=>r[it.id].found&&r[it.id].t<=pr+1e-9);}
function searchTime(p){const pl=plan(p);return {wall:pl.Lmax/SPEED,person:pl.lens.reduce((a,b)=>a+b,0)/SPEED};}
const contamination=p=>p.ppe?0:2;
const markerNo=(sim,it)=>{const f=ITEMS.filter(x=>results(sim.p)[x.id].found).sort((a,b)=>results(sim.p)[a.id].t-results(sim.p)[b.id].t);return f.indexOf(it)+1;};

/* ---------- sketch measurements ---------- */
const PA=[0,RH];
const PB=p=>p.ref2==='near'&&atLeast('ap')?[100,RH]:[RW,RH];
function sketch(p,it){const B=PB(p),dA=Math.hypot(it.x-PA[0],it.y-PA[1]),dB=Math.hypot(it.x-B[0],it.y-B[1]);
  const ua=[(it.x-PA[0])/dA,(it.y-PA[1])/dA],ub=[(it.x-B[0])/dB,(it.y-B[1])/dB],sg=Math.abs(ua[0]*ub[1]-ua[1]*ub[0]),ang=Math.asin(clamp(sg,0,1))*180/Math.PI;
  return {bx:it.x,by:RH-it.y,dA,dB,ang,unc:p.method==='tri'?2/Math.max(sg,0.02):2*Math.SQRT2};}

/* ---------- helpers ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode)||(c.only&&!c.only(sim));});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function para(ctx,s,x,y,maxW,sz,o){o=o||{};const ls=wrapLines(ctx,s,maxW,sz,o.w);ls.forEach((l,i)=>txt(ctx,l,x,y+i*sz*1.28,{s:sz,w:o.w||400,c:o.c||PAL['cv-ink']}));return y+ls.length*sz*1.28;}
const fit=(ctx,s,maxW,sz,w)=>{ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return s;while(s.length>3&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);return s+'…';};
const SP={x:562,y:34,w:226,h:404};
const toolLinks=it=>it.tools.length?it.tools.map(t=>`<a href="#${t}">${TOOLNAME[t]}</a>`).join(', '):'—';
const PACKED=sim=>{const f=foundNow(sim);return f.filter(it=>sim.st.pack[it.id]&&it.pack.includes(sim.st.pack[it.id])).length;};

const CS={
  id:'crimescene',hash:'crimescene',apUnit:6,order:1,tab:'Crime scene',kind:'Virtual lab',
  next:['fingerprints','bloodspatter','dna','hairfiber','handwriting','chromatography','spottest','toxicology','spectroscopy','timeofdeath','anthropology','hashing','filesig','metadata','recovery','casefile'],
  card:'Search a break-in at a school chemistry room with line, grid, spiral or zone patterns, then sketch, package and log every piece of evidence.',
  title:'The crime scene: search, document, collect',
  lede:{bio:'Someone broke into a school chemistry room overnight. No one was hurt. Choose how to search, find the evidence, then record and package it so it still counts in court.',
        honors:'Locard’s exchange principle says every contact leaves a trace. Pick a search pattern for an indoor room, sketch each item with baseline or triangulation measurements, and match each item to the right package.',
        ap:'Weigh thoroughness against person-hours, judge class vs individual evidence and probative value, and see how measurement geometry and chain-of-custody gaps affect what holds up.'},
  scale:{bio:'A 9.0 m × 6.6 m classroom seen from above. Evidence icons are enlarged so you can see them.',ap:'A 9.0 m × 6.6 m classroom from above (1 px ≈ 1.7 cm). Icons enlarged. Search speed about 1.5 m per minute per searcher; tape measure ±2 cm.'},
  timeless:true,animated:true,chReveal:6,
  controls:[
    {id:'mode',label:'Step',type:'seg',def:'search',lvl:'bio',noTrial:true,options:[{v:'search',l:'1. Search'},{v:'document',l:'2. Document'},{v:'collect',l:'3. Collect'}]},
    {id:'pattern',label:'Search pattern',type:'seg',def:'line',lvl:'bio',modes:['search'],options:Object.keys(PAT).map(k=>({v:k,l:PAT[k].l})),help:'Line: searchers side by side. Grid: a line search, then again crosswise. Spiral: one person circles inward. Zone: split the room into sections.'},
    {id:'n',label:'Searchers',type:'range',min:2,max:6,step:1,def:4,unit:'',lvl:'honors',modes:['search'],help:'More people means narrower lanes in a line or grid search.'},
    {id:'als',label:'Alternate light source',type:'toggle',def:false,lvl:'honors',modes:['search'],help:'A strong colored light makes fibers, hairs, prints and body fluids stand out.'},
    {id:'ppe',label:'Protective gear and a marked path',type:'toggle',def:true,lvl:'honors',modes:['search'],help:'Gloves, shoe covers and one marked walkway in and out.'},
    {id:'missed',label:'Show what the search missed',type:'toggle',def:false,lvl:'bio',noTrial:true,modes:['search']},
    {id:'item',label:'Evidence item',type:'select',def:'bottle',lvl:'bio',noTrial:true,modes:['document','collect'],options:ITEMS.map(it=>({v:it.id,l:it.sh}))},
    {id:'method',label:'Sketch measurement',type:'seg',def:'base',lvl:'honors',modes:['document'],options:[{v:'base',l:'Baseline'},{v:'tri',l:'Triangulation'}],help:'Baseline: distance along a wall, then straight out. Triangulation: distances from two fixed points.'},
    {id:'ref2',label:'Second fixed point',type:'seg',def:'far',lvl:'ap',modes:['document'],only:s=>s.p.method==='tri',options:[{v:'far',l:'Far corner (9 m away)'},{v:'near',l:'Nearby (1 m away)'}]},
    {id:'pack',label:'Package to use',type:'select',def:'paper',lvl:'bio',noTrial:true,modes:['collect'],options:Object.keys(PACKS).map(k=>({v:k,l:PACKS[k]}))}
  ],
  actions:[{id:'go',label:'Run the search',lvl:'bio',primary:true,modes:['search'],run(sim){sim.st.prog=0;}},
    {id:'seal',label:'Package and seal',lvl:'bio',primary:true,modes:['collect'],run(sim){const it=ITEM(sim.p.item);if(foundNow(sim).includes(it)){sim.st.pack[it.id]=sim.p.pack;sim.st.log[it.id]=sim.st.log[it.id]||clockAt(Object.keys(sim.st.log).length);}}}],
  init(sim){return {prog:0,key:'',pack:{},log:{}};},
  step(sim,dt){const st=sim.st,p=sim.p;const key=[p.pattern,Math.round(p.n),p.als,p.ppe].join('|');if(key!==st.key){st.key=key;st.prog=0;st.pack={};st.log={};}
    if(p.mode!=='search'){st.prog=1;return;}if(st.prog<1){st.prog=Math.min(1,st.prog+dt/5);if(st.prog>=1)sim.infoDirty=true;}},
  metrics:[
    {id:'found',label:'Evidence found',unit:'of 11',lvl:'bio',min:0,max:11,d:0,modes:['search'],get:s=>foundNow(s).length},
    {id:'time',label:'Search time',unit:'min',lvl:'bio',min:0,max:null,d:0,modes:['search'],get:s=>searchTime(s.p).wall},
    {id:'pmin',label:'Person-minutes',unit:'min',lvl:'honors',min:0,max:null,d:0,modes:['search'],get:s=>searchTime(s.p).person},
    {id:'contam',label:'Traces added by the team',unit:'',lvl:'honors',min:0,max:5,d:0,modes:['search'],get:s=>contamination(s.p)+(trampled(s.p)&&s.st.prog>=results(s.p).shoe.t?1:0)},
    {id:'pos',label:'Baseline: along the wall, out from it',unit:'',lvl:'bio',text:true,modes:['document'],get:s=>{const it=ITEM(s.p.item),k=sketch(s.p,it);return (k.bx/100).toFixed(2)+' m, '+(k.by/100).toFixed(2)+' m';}},
    {id:'tri',label:'Triangulation: from A, from B',unit:'',lvl:'honors',text:true,modes:['document'],get:s=>{const k=sketch(s.p,ITEM(s.p.item));return (k.dA/100).toFixed(2)+' m, '+(k.dB/100).toFixed(2)+' m';}},
    {id:'unc',label:'Position uncertainty (±2 cm tape)',unit:'cm',lvl:'ap',min:0,max:null,d:1,modes:['document'],get:s=>sketch(s.p,ITEM(s.p.item)).unc},
    {id:'packed',label:'Packaged correctly',unit:'',lvl:'bio',text:true,modes:['collect'],get:s=>PACKED(s)+' of '+foundNow(s).length+' found items'},
    {id:'evtype',label:'Type of evidence',unit:'',lvl:'ap',text:true,modes:['collect','document'],get:s=>ITEM(s.p.item).cls}
  ],
  graphs:[{id:'cmp',label:'Evidence found by search pattern',lvl:'bio',custom:true}],defaultGraph:'cmp',
  plot(sim,ctx,box,id){const keys=Object.keys(PAT),vals=keys.map(k=>{const p=Object.assign({},sim.p,{pattern:k});return Object.values(results(p)).filter(r=>r.found).length;});
    const ax=axes(ctx,box,{xmin:0,xmax:4,ymin:0,ymax:12,xcats:keys.map(k=>PAT[k].l),yl:'items found (of 11)',yd:0});
    bars(ctx,ax,vals,{colors:keys.map(k=>k===sim.p.pattern?PAL['s1']:PAL['g-axis']),d:0});
    keys.forEach((k,i)=>{const t=searchTime(Object.assign({},sim.p,{pattern:k}));txt(ctx,Math.round(atLeast('honors')?t.person:t.wall)+(atLeast('honors')?' person-min':' min'),ax.X(i+0.5),ax.Y(0)-8,{s:12,c:'#fff',a:'center',w:700});});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap'),res=results(p),done=sim.st.prog>=1;
    if(p.mode==='search'){const rows=ITEMS.map(it=>{const r=res[it.id],f=r.found&&r.t<=sim.st.prog;const st=f?'Found (#'+markerNo(sim,it)+')':r.trampled&&sim.st.prog>=r.t?'<span style="color:var(--bad)">Destroyed by the team</span>':done?'<span style="color:var(--muted)">Missed</span>':'…';
        return `<tr><td>${p.missed||f?it.n:'?'}</td><td>${st}</td>${hon?`<td>${f||p.missed?toolLinks(it):''}</td>`:''}${ap?`<td>${f||p.missed?it.cls:''}</td><td>${f||p.missed?it.pv:''}</td>`:''}</tr>`;}).join('');
      return `<h3>Evidence log</h3><div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Status</th>${hon?'<th>Examined in</th>':''}${ap?'<th>Class or individual</th><th>Probative value</th>':''}</tr></thead><tbody>${rows}</tbody></table></div><p class="help">Locard’s exchange principle: the intruder left traces (prints, fibers, blood, a bottle) and took traces away (glass, powder). ${hon?'Missed items are lost for good once the scene is released.':''}</p>`;}
    const it=ITEM(p.item),f=foundNow(sim).includes(it);
    if(!f)return `<h3>${it.n}</h3><p>This item was not found by the ${PAT[p.pattern].l.toLowerCase()} search, so it cannot be documented or collected. Go back to Search and try another pattern${hon?' or the alternate light source':''}.</p>`;
    if(p.mode==='document'){const k=sketch(p,it);
      return `<h3>Document: ${it.n}</h3><ol><li><b>Photograph</b> it three ways: an overall shot of the room, a mid-range shot showing where it is, and a close-up with a scale (ruler) beside it.</li><li><b>Sketch</b> the room and mark the item with its evidence number.</li><li><b>Measure</b> its position: baseline ${(k.bx/100).toFixed(2)} m along the bottom wall from corner A, then ${(k.by/100).toFixed(2)} m straight out${hon?`; or triangulation: ${(k.dA/100).toFixed(2)} m from A and ${(k.dB/100).toFixed(2)} m from ${PB(p)[0]===RW?'corner B':'point B (1 m from A)'}`:''}.</li></ol>${ap?`<p class="help">The two tape lines meet at ${k.ang.toFixed(0)}°. With ±2 cm on each tape, the position is uncertain by about ±2 cm ÷ sin(${k.ang.toFixed(0)}°) = ±${k.unc.toFixed(1)} cm${p.method==='base'?' (baseline: about ±2.8 cm if the offset is truly square to the wall)':''}.</p>`:''}<p class="help">Examined later in: ${toolLinks(it)}</p>`;}
    const pk=sim.st.pack[it.id],ok=pk&&it.pack.includes(pk);
    let h=`<h3>Collect: ${it.n}</h3><p>${pk?(ok?'<b style="color:var(--good)">Packaged correctly</b> in: '+PACKS[pk]+'.':'<b style="color:var(--bad)">Wrong package</b>: '+PACKS[pk]+'. '+(WRONG[pk]||'')):'Choose a package, then press Package and seal.'}</p>${pk?`<p class="help">${it.why}</p>`:''}`;
    if(pk){const t=sim.st.log[it.id]||'10:40 PM',bio=it.trace||['bottle','blood','hair'].includes(it.id);
      const rows=[['Collected, sealed and initialed','Investigator R. Moreno (fictional)',t],['Received in the evidence van','Tech J. Park (fictional)',addMin(t,35)],['Logged into the evidence room','Officer D. Silva (fictional)','7:55 AM next day'],['Checked out to the lab','Analyst K. Osei (fictional)','9:10 AM next day']];
      h+=`<div class="tbl-wrap"><table><thead><tr><th>Chain of custody</th><th>Who</th><th>When</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>`;
      if(!p.ppe&&hon&&bio)h+=`<p class="help" style="color:var(--bad)">Lab note: the team did not use gloves, so their own DNA or prints may be on this item. Elimination samples are now needed from everyone who entered.</p>`;
      if(ap)h+='<p class="help">Every handoff is signed, dated and timed. A gap (an unlogged hour, an unsealed bag) lets the defense argue the item could have been changed.</p>';}
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='search'){const f=foundNow(sim).length,all=Object.values(results(p)).filter(r=>r.found).length,t=searchTime(p);
      if(st.prog<1){return {line:'Searchers walk side by side across the room. <b>A line search is fast</b>, but lab benches break up the lanes, so spots under and around furniture get a quick look.',grid:'The team does a line search, then <b>searches again crosswise</b>. Every spot is seen twice, from two directions.',spiral:'One searcher circles inward from the walls. <b>A spiral suits an open space with one person</b>; here the benches block the path.',zone:'The room is split into four zones, and each is searched in close lanes. <b>Zone searches suit rooms full of furniture.</b>'}[p.pattern]+(hon&&!p.ppe?' Without shoe covers and a marked path, the team is adding its own traces.':'');}
      let s='The '+PAT[p.pattern].l.toLowerCase()+' search found <b>'+f+' of 11</b> items in about '+Math.round(t.wall)+' minutes'+(hon?' ('+Math.round(t.person)+' person-minutes)':'')+'. ';
      if(f<11)s+=p.pattern==='zone'?'Only the smallest trace is left: try the alternate light source.':'Small items near furniture are easy to miss. Try another pattern.';else s+='Every item was found: each is marked with a numbered tent.';
      if(hon&&trampled(p))s+=' The team walked over the shoe print and <b>destroyed it</b>.';return s;}
    const it=ITEM(p.item);if(!foundNow(sim).includes(it))return 'The '+it.sh.toLowerCase()+' was <b>not found</b> in this search, so it never reaches the lab.';
    if(p.mode==='document'){const k=sketch(p,it);if(p.method==='tri'&&hon)return 'Triangulation: measure from two fixed points that will still be there later. '+(ap?'The tape lines cross at '+k.ang.toFixed(0)+'°, so the spot is fixed to ±'+k.unc.toFixed(1)+' cm. <b>Lines that cross at a narrow angle give a fuzzy position.</b>':'<b>Two distances pin down one spot.</b>');
      return 'Photograph first, then sketch. The '+it.sh.toLowerCase()+' is <b>'+(k.bx/100).toFixed(2)+' m along the wall from corner A and '+(k.by/100).toFixed(2)+' m out</b>, so anyone can find its exact spot later.';}
    const pk=st.pack[it.id];if(!pk)return 'Pick the package that keeps the '+it.sh.toLowerCase()+' safe and unchanged, then seal it, initial it and start the <b>chain of custody</b>.';
    return it.pack.includes(pk)?'<b>Correct.</b> '+it.why:'<b>Wrong package.</b> '+(WRONG[pk]||'')+' Use: '+it.pack.map(q=>PACKS[q].toLowerCase()).join(' or ')+'.';},
  tour:[
    {title:'Secure the scene',text:'Someone broke into a chemistry room overnight. No one was hurt. First the scene is secured: one way in and out, a log of everyone who enters, and nothing touched before it is recorded.',focus:[R.x,R.y,RW*R.S,RH*R.S],pause:true,setup(sim){BioLab.setValues(sim,{mode:'search',pattern:'line',missed:false});sim.st.prog=0;syncMode(sim);}},
    {title:'Every contact leaves a trace',text:'Locard’s exchange principle: the intruder left things behind (prints, fibers, blood, a water bottle) and carried things away (glass, powder). The search looks for both.',focus:[R.x,R.y,RW*R.S,RH*R.S],speed:0.4},
    {title:'A line search',text:'Four searchers walk side by side across the room. It is fast, but benches break up the lanes, so items under furniture or on the cabinet get only a quick look.',focus:[R.x,R.y,RW*R.S,RH*R.S],speed:1,setup(sim){sim.st.prog=0;}},
    {title:'A zone search',text:'For a furnished room, split it into zones and search each one closely. It takes more person-minutes but finds much more. Compare the counts in the evidence log.',focus:[R.x,R.y,RW*R.S,RH*R.S],speed:1,setup(sim){BioLab.setValues(sim,{pattern:'zone'});}},
    {lvl:'honors',title:'Light up trace evidence',text:'An alternate light source (a strong light of one color, viewed through orange goggles) makes fibers, hairs and fluids glow. Now the last hair under a bench shows up.',focus:[R.x,R.y,RW*R.S,RH*R.S],speed:1,setup(sim){BioLab.setValues(sim,{als:true});}},
    {title:'Photograph and sketch',text:'Each item is photographed (overall, mid-range, close-up with a scale) and measured on a sketch. Here the bottle is located by a baseline: a distance along the wall from corner A, then straight out.',focus:[[R.x,R.y,RW*R.S,RH*R.S],[SP.x,SP.y,SP.w,SP.h]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'document',item:'bottle',method:'base'});syncMode(sim);}},
    {title:'Package it right',text:'Damp and biological items go in paper so they can breathe; tiny trace items go in a druggist fold; electronics go in anti-static bags. Each package is sealed, initialed and logged.',focus:[SP.x,SP.y,SP.w,SP.h],pause:true,setup(sim){BioLab.setValues(sim,{mode:'collect',item:'blood',pack:'paper'});const it=ITEM('blood');sim.st.pack[it.id]='paper';sim.st.log[it.id]='10:40 PM';syncMode(sim);}},
    {lvl:'ap',title:'Chain of custody',text:'Every person who holds the evidence signs for it, with the date and time. A gap gives the defense room to argue the evidence was changed. The information panel shows the form for this item.',focus:[SP.x,SP.y,SP.w,SP.h],pause:true}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);BioLab.reset(sim);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.seal){sim.st.pack[sim.p.item]=sim.p.pack;sim.st.log[sim.p.item]='10:40 PM';}syncMode(sim);BioLab.refresh(sim);}},
  challenges(sim){const cnt=pt=>Object.values(results(Object.assign({},CS.controls.reduce((o,c)=>(o[c.id]=c.def,o),{}),pt))).filter(r=>r.found).length;
    const near=sketch({method:'tri',ref2:'near'},ITEM('bottle')),far=sketch({method:'tri',ref2:'far'},ITEM('bottle'));
    return [
    {lvl:'bio',q:'The team finishes a line search, then searches the same furnished room again with a zone search. What happens to the number of items found?',choices:['It goes up: each zone is searched closely','It goes down','It stays the same'],correct:0,
     baseline:{mode:'search',pattern:'line'},change:{pattern:'zone'},at:5.4,reveal:11.2,changeText:'Switched to a zone search',watch:'found',
     explain:{bio:'The line search found '+cnt({pattern:'line'})+' items; the zone search finds '+cnt({pattern:'zone'})+'. Benches break up a line search’s lanes. Zones get close, careful lanes, including under and around furniture, at the cost of more person-minutes.'}},
    {lvl:'bio',instant:true,set:{mode:'collect',item:'blood',pack:'paper'},seal:true,q:'You swab the small blood drops by the window. What should the swabs go in?',choices:['A sealed plastic bag','A paper envelope, after they air-dry','An airtight metal can'],correct:1,
     explain:{bio:'Biological evidence must be able to breathe. In plastic, moisture stays trapped, mold and bacteria grow, and the DNA breaks down. Air-dry the swabs, then package them in paper.'}},
    {lvl:'bio',instant:true,q:'The intruder wore gloves. What does Locard’s exchange principle predict?',choices:['They left no evidence at all','They still left traces and took some away: shoe prints, fibers, glass','Only DNA evidence counts'],correct:1,
     explain:{bio:'Gloves stop fingerprints from bare skin, but every contact still exchanges material: fibers from clothes, a shoe print in the dust, glass on the clothes, even fibers from the gloves themselves.'}},
    {lvl:'honors',q:'A zone search found all but one item. You turn on the alternate light source and search again. What happens?',choices:['Nothing new: light does not help','The last trace item, a hair, now shows up','Items already found disappear'],correct:1,
     baseline:{mode:'search',pattern:'zone',als:false},change:{als:true},at:5.4,reveal:11.2,changeText:'Searching again with the alternate light source',watch:'found',
     explain:{honors:'Hairs, fibers, prints and body fluids absorb and glow (fluoresce) under strong light of one color, viewed through colored goggles. The hair under the bench, nearly invisible in room light, stands out.'}},
    {lvl:'honors',q:'The team searches without shoe covers or a marked walkway. What happens to the evidence?',choices:['Nothing changes','They add their own traces and walk over the shoe print','They find more, because they move faster'],correct:1,
     baseline:{mode:'search',pattern:'line',ppe:true},change:{ppe:false},at:5.4,reveal:11.2,changeText:'Searching without protective gear',watch:'contam',
     explain:{honors:'Watch the “Traces added by the team” readout and the evidence log. The team’s own hairs and prints get mixed in, and the intruder’s shoe print in the dust is trampled. Contamination can make real evidence useless or mislead the investigation.'}},
    {lvl:'honors',instant:true,set:{mode:'document',item:'bottle',method:'tri'},q:'To fix the bottle’s spot on the sketch by triangulation, what do you measure?',choices:['One distance from one corner','The distances from two fixed points','Its compass direction only'],correct:1,
     explain:{honors:'One distance only puts the item somewhere on a circle. Two distances from two fixed points (corners, door frames) cross at one spot. The baseline method instead measures along a wall and then straight out.'}},
    {lvl:'honors',instant:true,q:'Why is a fiber packaged in a druggist fold before it goes in an envelope?',choices:['Tiny items can slip out of an envelope’s corners','The fold keeps the fiber damp','It is cheaper'],correct:0,
     explain:{honors:'A druggist fold is a sheet of paper folded so it has no open corners. Hairs, fibers, glass slivers and powders stay inside it, and it can be opened in the lab without losing anything.'}},
    {lvl:'ap',instant:true,q:'A fiber from the window frame matches the cotton type in a popular store-brand T-shirt. What kind of evidence is it?',choices:['Individual: it identifies the shirt','Class: it narrows the field to millions of shirts','Not evidence at all'],correct:1,
     explain:{ap:'Class evidence shares features with a group of sources. It can exclude, and it adds weight when several class items agree, but it cannot single out one source. Fingerprints and DNA are individual evidence.'}},
    {lvl:'ap',instant:true,set:{mode:'document',item:'bottle',method:'tri',ref2:'near'},q:'You triangulate the bottle from corner A and a second point only 1 m along the same wall, instead of the far corner. How does the position uncertainty change?',choices:['It gets much larger: the tape lines cross at a narrow angle','It gets smaller: the points are closer','It does not change'],correct:0,
     explain:{ap:'From the far corner the lines cross at '+far.ang.toFixed(0)+'° and the position is good to ±'+far.unc.toFixed(1)+' cm. From two points 1 m apart they cross at '+near.ang.toFixed(0)+'°, so ±2 cm on each tape becomes about ±'+near.unc.toFixed(1)+' cm. Choose reference points far apart, so the lines meet near 90°.'}},
    {lvl:'ap',instant:true,q:'The fingerprint card sat unlogged in an investigator’s desk drawer for two days before reaching the lab. What is the biggest problem?',choices:['The print fades','A gap in the chain of custody lets the defense argue it was tampered with','No problem, as long as it was sealed'],correct:1,
     explain:{ap:'Chain of custody documents who had the evidence at every moment. An unexplained gap does not prove tampering, but it lets the defense challenge the evidence, and a judge may give it less weight or exclude it.'}},
    {lvl:'ap',instant:true,q:'DNA on the water bottle belongs to a student who uses this room every day. Why might the bottle now have low probative value?',choices:['DNA is unreliable','There is an innocent explanation: the student had a reason to be there','Bottles cannot hold DNA'],correct:1,
     explain:{ap:'Probative value is how strongly evidence proves a fact in question. A trace from someone who legitimately uses the room does not show they were the intruder. That is why investigators collect elimination samples and ask how and when a trace got there.'}}
  ];},
  lab:{bio:'<p><b>Question:</b> Which search pattern works best in a furnished classroom?</p><ol><li>Run each of the four search patterns (line, grid, spiral, zone).</li><li>After each one, press Record trial to save the items found and the time.</li><li>Turn on “Show what the search missed” and note which items each pattern missed and where they were.</li></ol><p>Which pattern would you choose for this room, and which would you choose for a big open field? Explain using what you saw.</p>',
       honors:'<p><b>Question:</b> How do people, light and care change a search?</p><ol><li>Run a line search with 2, 4 and 6 searchers. Record items found and person-minutes.</li><li>Run a zone search with and without the alternate light source.</li><li>Run any search with protective gear off and note what happens to the shoe print.</li><li>Then document three found items (baseline and triangulation) and package every found item.</li></ol><p>Write a short search plan for this room that a new investigator could follow.</p>',
       ap:'<p><b>Question:</b> What makes evidence hold up in court?</p><ol><li>Find all 11 items. For each, record class or individual and its probative value.</li><li>Triangulate three items from the far corner and from the nearby point. Record the crossing angle and the uncertainty.</li><li>Package every item and read its chain-of-custody form.</li></ol><p><b>Claim–evidence–reasoning:</b> Rank the three items you think are most valuable to the case. Justify each with its type, its probative value and any weakness (contamination, measurement, custody) the defense could raise.</p>'},
  terms:[{t:'Locard’s exchange principle',d:'Every contact leaves a trace: a person leaves material at a scene and takes material away.'},{t:'Search pattern',d:'A planned way to cover a scene: line, grid, spiral or zone.'},{t:'Evidence marker',d:'A numbered tent placed by each item before it is photographed.'},{t:'Chain of custody',d:'The signed record of everyone who handled a piece of evidence, and when.'},{t:'Packaging',d:'Paper for damp or biological items, druggist folds for trace items, rigid boxes for sharp items, anti-static bags for electronics.'},
    {lvl:'honors',t:'Baseline method',d:'Measuring an item’s position along a fixed line (like a wall), then straight out from it.'},{lvl:'honors',t:'Triangulation',d:'Measuring an item’s distances from two fixed points.'},{lvl:'honors',t:'Alternate light source (ALS)',d:'A strong light of one color that makes fibers, hairs and fluids fluoresce.'},{lvl:'honors',t:'Contamination',d:'Material added to a scene or an item after the crime, often by investigators.'},{lvl:'honors',t:'Elimination sample',d:'Prints or DNA from people who belong at the scene, used to rule out their traces.'},
    {lvl:'ap',t:'Class evidence',d:'Shared by a group of sources (fiber type, shoe model, blood type).'},{lvl:'ap',t:'Individual evidence',d:'Can be linked to one source (fingerprint, DNA, a physical fit).'},{lvl:'ap',t:'Probative value',d:'How strongly an item helps prove or disprove a fact in the case.'}],
  about:'<p><b>The scene.</b> A fictional break-in at a school chemistry room; no one is hurt. The intruder came in through the window, opened the chemical cabinet and left by the door. Eleven items were placed by hand. Icons are enlarged.</p><p><b>Searching.</b> Each pattern is a set of walking paths with a sweep width (line and grid lanes are the room depth divided by the number of searchers; spiral 60 cm; zone 40 cm). An item is reached when a path passes within half the sweep width. Whether it is noticed depends on a search-quality score for its location (open floor, around furniture, or on a raised surface) compared with how hard the item is to see. Line and grid quality drops as lanes get wider; the alternate light source adds to the score for trace items. These scores are classroom estimates chosen to match standard guidance (zone or grid for furnished indoor rooms, line for large outdoor areas, spiral for small open areas with one searcher), not measured data. Search speed is 1.5 m per minute per searcher.</p><p><b>Measuring.</b> Positions come from the drawn room. Triangulation uncertainty is ±2 cm on each tape divided by the sine of the angle at which the two tape lines cross; baseline uncertainty is ±2 cm on each of two square measurements.</p><p><b>Packaging and custody.</b> Packaging rules follow common crime-scene guidance (for example NIST and the U.S. Department of Justice crime scene guides). Names in the chain-of-custody form are invented.</p>',
  onClick(sim,x,y){if(sim.p.mode==='search')return;let best=null,bd=26;ITEMS.forEach(it=>{const d=Math.hypot(X(it.x)-x,Y(it.y)-y);if(d<bd){bd=d;best=it;}});if(best)BioLab.setValues(sim,{item:best.id});},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const key=BioLab.level+sim.p.mode+sim.p.method;if(sim._sk!==key){sim._sk=key;syncMode(sim);}drawRoom(sim,ctx,k,t);drawSide(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.pattern='zone';},thumbFrames:110
};
function clockAt(i){const m=40+i*6,h=10+Math.floor(m/60);return h+':'+String(m%60).padStart(2,'0')+' PM';}
function addMin(t,dm){const mm=t.match(/(\d+):(\d+)/);let h=+mm[1],m=+mm[2]+dm;h+=Math.floor(m/60);m%=60;return (h>12?h-12:h)+':'+String(m).padStart(2,'0')+(h>=12&&h<24&&+mm[1]<12?' AM':' PM');}

/* ---------- drawing ---------- */
const WALL='#4a4d55',FLOOR='#efece4',BENCH='#cdb994',INK='#26262b';
function icon(ctx,it,x,y,a){ctx.save();ctx.globalAlpha=a===undefined?1:a;ctx.translate(x,y);
  switch(it.id){
    case 'glass':ctx.fillStyle='#9ec9dc';ctx.strokeStyle='#5d8ea4';ctx.lineWidth=1;[[-7,-3],[2,-6],[5,3],[-3,5],[8,-1]].forEach(([a,b],i)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(a+4,b+1);ctx.lineTo(a+1,b+4+i%2);ctx.closePath();ctx.fill();ctx.stroke();});break;
    case 'shoe':ctx.strokeStyle='#6b6253';ctx.lineWidth=1.5;ctx.setLineDash([2,2]);ctx.beginPath();ctx.ellipse(0,-3,5,7,0.3,0,TAU);ctx.stroke();ctx.beginPath();ctx.ellipse(3,8,4,4,0.3,0,TAU);ctx.stroke();ctx.setLineDash([]);break;
    case 'blood':ctx.fillStyle='#a3121e';[[-5,-3,2.4],[1,-5,1.8],[4,2,2.6],[-2,4,1.6],[-7,3,1.3]].forEach(([a,b,r])=>{ctx.beginPath();ctx.arc(a,b,r,0,TAU);ctx.fill();});break;
    case 'fiber':ctx.lineWidth=1.6;['#2d6bd2','#7b3fe4','#2d6bd2'].forEach((c,i)=>{ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(-6,-5+i*5);ctx.quadraticCurveTo(0,-9+i*5,6,-4+i*5);ctx.stroke();});break;
    case 'fp':ctx.strokeStyle='#6b6b73';ctx.lineWidth=1;for(let r=2;r<=8;r+=2){ctx.beginPath();ctx.ellipse(0,0,r*0.8,r,0,0.2,TAU-0.6);ctx.stroke();}break;
    case 'pry':ctx.strokeStyle='#8a5a2b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-4);ctx.lineTo(-3,3);ctx.lineTo(1,-3);ctx.lineTo(5,4);ctx.lineTo(8,-2);ctx.stroke();break;
    case 'powder':ctx.fillStyle='#ffffff';ctx.strokeStyle='#b8b4a8';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<=12;i++){const ph=i/12*TAU,r=7+2*Math.sin(3*ph);ctx.lineTo(r*Math.cos(ph),r*0.7*Math.sin(ph));}ctx.fill();ctx.stroke();break;
    case 'hair':ctx.strokeStyle='#4a3020';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-8,3);ctx.bezierCurveTo(-3,-8,3,8,8,-3);ctx.stroke();break;
    case 'bottle':ctx.fillStyle='#8cc3e6';ctx.strokeStyle='#3d78a8';ctx.lineWidth=1.2;rr(ctx,-4,-9,8,16,3);ctx.fill();ctx.stroke();ctx.fillStyle='#2d6bd2';ctx.fillRect(-2,-12,4,3);break;
    case 'note':ctx.fillStyle='#ffffff';ctx.strokeStyle='#8f8a7d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,-6);ctx.lineTo(6,0);ctx.lineTo(8,6);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#6c86b8';[-3,0,3].forEach(v=>{ctx.beginPath();ctx.moveTo(-5,v);ctx.lineTo(4,v);ctx.stroke();});break;
    case 'usb':ctx.fillStyle='#3a3e46';rr(ctx,-6,-3,10,6,1.5);ctx.fill();ctx.fillStyle='#b9bec6';ctx.fillRect(4,-2,4,4);break;}
  ctx.restore();}
function tent(ctx,x,y,n,k){const s=8*Math.min(k,1.4);ctx.fillStyle='#f2c200';ctx.strokeStyle='#8a6d00';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-s,y+s*0.8);ctx.lineTo(x,y-s*1.1);ctx.lineTo(x+s,y+s*0.8);ctx.closePath();ctx.fill();ctx.stroke();txt(ctx,String(n),x,y+s*0.35,{s:Math.max(11,9.5*Math.min(k,1.4)),w:700,c:INK,a:'center',b:'middle'});}
function drawRoom(sim,ctx,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors');const W=RW*R.S,H=RH*R.S;
  ctx.fillStyle=FLOOR;ctx.fillRect(R.x,R.y,W,H);ctx.strokeStyle='#e0dccf';ctx.lineWidth=1;for(let x=50;x<RW;x+=50){ctx.beginPath();ctx.moveTo(X(x)+.5,R.y);ctx.lineTo(X(x)+.5,R.y+H);ctx.stroke();}for(let y=50;y<RH;y+=50){ctx.beginPath();ctx.moveTo(R.x,Y(y)+.5);ctx.lineTo(R.x+W,Y(y)+.5);ctx.stroke();}
  // furniture
  BENCHES.forEach(b=>{ctx.fillStyle=BENCH;ctx.strokeStyle='#8f7b55';ctx.lineWidth=1;ctx.fillRect(X(b.x),Y(b.y),b.w*R.S,b.h*R.S);ctx.strokeRect(X(b.x)+.5,Y(b.y)+.5,b.w*R.S,b.h*R.S);ctx.fillStyle='#b7c7cf';ctx.fillRect(X(b.x+b.w-30),Y(b.y+15),14*R.S*1.6,22*R.S*1.4);});
  ctx.fillStyle='#bfa77a';ctx.fillRect(X(DESK.x),Y(DESK.y),DESK.w*R.S,DESK.h*R.S);ctx.strokeStyle='#8f7b55';ctx.strokeRect(X(DESK.x)+.5,Y(DESK.y)+.5,DESK.w*R.S,DESK.h*R.S);
  ctx.fillStyle='#d5dde2';ctx.fillRect(X(CAB.x),Y(CAB.y),CAB.w*R.S,CAB.h*R.S);ctx.strokeStyle='#6f8796';ctx.strokeRect(X(CAB.x)+.5,Y(CAB.y)+.5,CAB.w*R.S,CAB.h*R.S);ctx.beginPath();ctx.moveTo(X(CAB.x),Y(CAB.y+CAB.h/2));ctx.lineTo(X(CAB.x+CAB.w),Y(CAB.y+CAB.h/2));ctx.stroke();
  ctx.fillStyle='#c9cfd4';ctx.fillRect(X(HOOD.x),Y(HOOD.y),HOOD.w*R.S,HOOD.h*R.S);
  if(k<1.35){txt(ctx,'teacher’s desk',X(DESK.x+DESK.w/2),Y(DESK.y+DESK.h/2)+4,{s:12,c:INK,a:'center'});txt(ctx,'chemical',X(CAB.x)-4,Y(CAB.y+CAB.h+18),{s:12,c:INK,a:'right'});txt(ctx,'cabinet',X(CAB.x)-4,Y(CAB.y+CAB.h+18)+14,{s:12,c:INK,a:'right'});txt(ctx,'fume hood',X(HOOD.x+HOOD.w/2),Y(HOOD.y+HOOD.h/2)+4,{s:12,c:INK,a:'center'});}
  // walls, window, door
  ctx.strokeStyle=WALL;ctx.lineWidth=5;ctx.strokeRect(R.x,R.y,W,H);
  ctx.strokeStyle=FLOOR;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(R.x,Y(150));ctx.lineTo(R.x,Y(330));ctx.moveTo(X(700),R.y+H);ctx.lineTo(X(800),R.y+H);ctx.stroke();
  ctx.strokeStyle='#7fb3c9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(R.x,Y(150));ctx.lineTo(R.x,Y(205));ctx.moveTo(R.x,Y(275));ctx.lineTo(R.x,Y(330));ctx.stroke();ctx.strokeStyle='#a5c9d8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(R.x,Y(205));ctx.lineTo(R.x+6,Y(220));ctx.moveTo(R.x,Y(275));ctx.lineTo(R.x+7,Y(258));ctx.stroke();
  ctx.strokeStyle=WALL;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(X(700),R.y+H,100*R.S,-Math.PI/2,0);ctx.stroke();ctx.beginPath();ctx.moveTo(X(700),R.y+H);ctx.lineTo(X(700),R.y+H-100*R.S);ctx.stroke();
  txt(ctx,'broken window',R.x+8,Y(330)+16*k,{s:12*k,w:700,c:INK});txt(ctx,'door',X(750),R.y+H-8,{s:12*k,c:INK,a:'center'});
  const res=results(p),fn=foundNow(sim);
  if(p.mode==='search'){const pl=plan(p),hw=pl.hw*R.S,pr=st.prog;
    // swept area
    ctx.save();ctx.beginPath();ctx.rect(R.x,R.y,W,H);ctx.clip();ctx.lineCap='round';ctx.lineJoin='round';pl.paths.forEach((pts,i)=>{const d=pr*pl.Lmax;ctx.strokeStyle='rgba(45,107,210,.13)';ctx.lineWidth=hw*2;ctx.beginPath();let L=0;ctx.moveTo(X(pts[0][0]),Y(pts[0][1]));
      for(let j=1;j<pts.length;j++){const l=Math.hypot(pts[j][0]-pts[j-1][0],pts[j][1]-pts[j-1][1]);if(L+l>=d){const q=pointAt(pts,d);ctx.lineTo(X(q[0]),Y(q[1]));break;}ctx.lineTo(X(pts[j][0]),Y(pts[j][1]));L+=l;}ctx.stroke();
      ctx.strokeStyle='rgba(45,107,210,.55)';ctx.lineWidth=1.2;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);});ctx.restore();
    if(!p.ppe&&hon&&pr>0){ctx.fillStyle='rgba(120,90,60,.35)';const R2=rng(4);pl.paths.forEach(pts=>{for(let d=0;d<pr*pl.Lmax;d+=90){const q=pointAt(pts,d);ctx.beginPath();ctx.ellipse(X(q[0])+(R2()-0.5)*4,Y(q[1])+(R2()-0.5)*4,2.5,4,0.6,0,TAU);ctx.fill();}});}
    pl.paths.forEach((pts,i)=>{const q=pointAt(pts,pr*pl.Lmax);if(pr>=1)return;ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),6,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();});
    ITEMS.forEach(it=>{const r=res[it.id],f=fn.includes(it);if(f){icon(ctx,it,X(it.x),Y(it.y));tent(ctx,X(it.x)+11,Y(it.y)-11,markerNo(sim,it),k);}
      else if(p.missed&&pr>=1){icon(ctx,it,X(it.x),Y(it.y),0.55);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.8;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(X(it.x),Y(it.y),12,0,TAU);ctx.stroke();ctx.setLineDash([]);}
      if(r.trampled&&pr>=r.t&&hon){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(it.x)-8,Y(it.y)-8);ctx.lineTo(X(it.x)+8,Y(it.y)+8);ctx.moveTo(X(it.x)+8,Y(it.y)-8);ctx.lineTo(X(it.x)-8,Y(it.y)+8);ctx.stroke();}});
    return;}
  // document / collect: all found items with markers, selected one highlighted
  const sel=ITEM(p.item);ITEMS.forEach(it=>{if(!fn.includes(it))return;icon(ctx,it,X(it.x),Y(it.y));tent(ctx,X(it.x)+11,Y(it.y)-11,markerNo(sim,it),k);});
  if(fn.includes(sel)){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(X(sel.x),Y(sel.y),15,0,TAU);ctx.stroke();}
  if(p.mode==='document'&&fn.includes(sel)){const k2=sketch(p,sel),A=[X(PA[0]),Y(PA[1])],B=PB(p),Bp=[X(B[0]),Y(B[1])],S=[X(sel.x),Y(sel.y)];
    const dim=(a,b,label,off)=>{ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);
      const mx=(a[0]+b[0])/2+(off?off[0]:0),my=(a[1]+b[1])/2+(off?off[1]:0);ctx.font='700 '+12*k+'px '+FONT;const w=ctx.measureText(label).width+8;ctx.fillStyle='rgba(255,255,255,.92)';rr(ctx,mx-w/2,my-9*k,w,18*k,4);ctx.fill();txt(ctx,label,mx,my,{s:12*k,w:700,c:'#5a2aa8',a:'center',b:'middle'});};
    if(p.method==='tri'&&hon){dim(A,S,(k2.dA/100).toFixed(2)+' m');dim(Bp,S,(k2.dB/100).toFixed(2)+' m');}
    else{const F=[X(sel.x),Y(RH)];dim(A,F,(k2.bx/100).toFixed(2)+' m',[0,-12*k]);dim(F,S,(k2.by/100).toFixed(2)+' m',[0,0]);ctx.strokeStyle=PAL['s5'];ctx.lineWidth=1.5;ctx.strokeRect(F[0],F[1]-8,8,8);}
    const pt=(q,l)=>{ctx.fillStyle=PAL['s5'];ctx.beginPath();ctx.arc(q[0],q[1],5,0,TAU);ctx.fill();txt(ctx,l,q[0]+(q[0]<R.x+20?6:-6),q[1]+16*k,{s:13*k,w:700,c:PAL['s5'],a:q[0]<R.x+20?'left':'right'});};
    pt(A,'A');if(p.method==='tri'&&hon)pt(Bp,'B');}}
function drawSide(sim,ctx,k,t){const p=sim.p,st=sim.st,hon=atLeast('honors');ctx.fillStyle=PAL['card'];rr(ctx,SP.x,SP.y,SP.w,SP.h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const x0=SP.x+12,fs=13*k;
  if(p.mode==='search'){txt(ctx,'Evidence log',x0,SP.y+22,{s:14*k,w:700});const fn=foundNow(sim).sort((a,b)=>markerNo(sim,a)-markerNo(sim,b));
    let y=SP.y+46*Math.min(k,1.3);const lh=Math.min(22*k,(SP.h-90)/11);
    if(!fn.length)txt(ctx,st.prog<1?'Searching…':'Nothing found',x0,y,{s:fs,c:PAL['cv-soft']});
    fn.forEach(it=>{tent(ctx,x0+8,y-4,markerNo(sim,it),Math.min(k,1.2));txt(ctx,fit(ctx,it.sh,SP.w-44,Math.min(fs,lh*0.8)),x0+24,y,{s:Math.min(fs,lh*0.8)});y+=lh;});
    const r=results(p),miss=ITEMS.filter(it=>!r[it.id].found).length;
    if(st.prog>=1)txt(ctx,miss?miss+' item'+(miss>1?'s':'')+' missed':'All 11 found',x0,SP.y+SP.h-14,{s:fs,w:700,c:miss?PAL['s1']:PAL['s3']});
    else{ctx.fillStyle=PAL['card2'];rr(ctx,x0,SP.y+SP.h-26,SP.w-24,12,6);ctx.fill();const pw=(SP.w-24)*clamp(st.prog,0,1);if(pw>12){ctx.fillStyle=PAL['s2'];rr(ctx,x0,SP.y+SP.h-26,pw,12,6);ctx.fill();}}
    return;}
  const it=ITEM(p.item),found=foundNow(sim).includes(it);txt(ctx,fit(ctx,(found?'#'+markerNo(sim,it)+' ':'')+it.sh,SP.w-24,14*k,700),x0,SP.y+22,{s:14*k,w:700});
  if(!found){para(ctx,'Not found in this search. It cannot be documented or collected.',x0,SP.y+52,SP.w-24,fs,{c:PAL['cv-soft']});return;}
  if(p.mode==='document'){// close-up photo with a scale
    const ph={x:x0,y:SP.y+38,w:SP.w-24,h:130};ctx.fillStyle='#2b2d33';rr(ctx,ph.x,ph.y,ph.w,ph.h,6);ctx.fill();ctx.fillStyle=FLOOR;ctx.fillRect(ph.x+8,ph.y+8,ph.w-16,ph.h-16);
    ctx.save();ctx.translate(ph.x+ph.w/2,ph.y+ph.h/2-8);ctx.scale(3.2,3.2);icon(ctx,it,0,0);ctx.restore();
    ctx.fillStyle='#f3e7b8';ctx.fillRect(ph.x+14,ph.y+ph.h-30,ph.w-28,14);ctx.strokeStyle='#3a3420';ctx.lineWidth=1;for(let i=0;i<=10;i++){const xx=ph.x+14+i*(ph.w-28)/10;ctx.beginPath();ctx.moveTo(xx,ph.y+ph.h-30);ctx.lineTo(xx,ph.y+ph.h-(i%5?24:20));ctx.stroke();}
    txt(ctx,'close-up with scale',ph.x+ph.w/2,ph.y+ph.h+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
    let y=ph.y+ph.h+40*k;const ks=['Overall photo','Mid-range photo','Close-up with scale','Sketch measurement'];
    ks.forEach(s=>{ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x0,y-5);ctx.lineTo(x0+4,y-1);ctx.lineTo(x0+11,y-10);ctx.stroke();txt(ctx,s,x0+18,y,{s:Math.min(fs,12*k)});y+=19*k;});
    if(atLeast('ap')&&y<SP.y+SP.h-8){const k2=sketch(p,it);txt(ctx,'± '+k2.unc.toFixed(1)+' cm',x0,Math.min(y+6,SP.y+SP.h-12),{s:fs,w:700,c:PAL['s5']});}return;}
  // collect: package picture
  const pk=st.pack[it.id],show=pk||p.pack,ok=pk&&it.pack.includes(pk),bx={x:SP.x+SP.w/2,y:SP.y+120};
  drawPack(ctx,show,bx.x,bx.y,it,!pk);
  let y=SP.y+214;y=para(ctx,PACKS[show],x0,y,SP.w-24,fs,{w:700});
  if(pk){pill(ctx,ok?'Correct':'Wrong package',SP.x+SP.w/2,y+16*k,ok?PAL['s3']:PAL['s1'],'#fff',13*k);y+=44*k;if(k<1.35&&y<SP.y+SP.h-40){y=para(ctx,'Sealed '+(st.log[it.id]||'')+' · initials R.M.',x0,y,SP.w-24,12*k,{c:PAL['cv-soft']});}}
  else para(ctx,'Not sealed yet. Press Package and seal.',x0,y+6,SP.w-24,12*k,{c:PAL['cv-soft']});
  txt(ctx,'Packaged correctly: '+PACKED(sim)+' of '+foundNow(sim).length,x0,SP.y+SP.h-14,{s:12*k,w:700,c:PAL['cv-soft']});}
function drawPack(ctx,pk,x,y,it,ghost){ctx.save();ctx.globalAlpha=ghost?0.65:1;ctx.translate(x,y);
  if(pk==='paper'){ctx.fillStyle='#c8a46e';ctx.strokeStyle='#8a6a3a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-40,-50);ctx.lineTo(40,-50);ctx.lineTo(46,55);ctx.lineTo(-46,55);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-40,-38);ctx.lineTo(40,-38);ctx.stroke();}
  else if(pk==='plastic'){ctx.fillStyle='rgba(200,225,240,.55)';ctx.strokeStyle='#7fa6bf';ctx.lineWidth=1.5;rr(ctx,-46,-50,92,104,8);ctx.fill();ctx.stroke();ctx.strokeStyle='#c1272d';ctx.beginPath();ctx.moveTo(-46,-40);ctx.lineTo(46,-40);ctx.stroke();}
  else if(pk==='fold'){ctx.fillStyle='#fbfbf8';ctx.strokeStyle='#9a968a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-48);ctx.lineTo(48,0);ctx.lineTo(0,48);ctx.lineTo(-48,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-24,-24);ctx.lineTo(24,24);ctx.moveTo(24,-24);ctx.lineTo(-24,24);ctx.stroke();}
  else if(pk==='rigid'){ctx.fillStyle='#e6dccb';ctx.strokeStyle='#8f7b55';ctx.lineWidth=2;ctx.fillRect(-48,-36,96,72);ctx.strokeRect(-48,-36,96,72);ctx.fillStyle='#d6c9b0';ctx.fillRect(-48,-36,96,14);}
  else if(pk==='can'){ctx.fillStyle='#b9bec6';ctx.strokeStyle='#6b7079';ctx.lineWidth=2;ctx.fillRect(-36,-40,72,84);ctx.strokeRect(-36,-40,72,84);ctx.beginPath();ctx.ellipse(0,-40,36,9,0,0,TAU);ctx.fillStyle='#d4d8de';ctx.fill();ctx.stroke();}
  else if(pk==='antistatic'){ctx.fillStyle='rgba(190,170,185,.75)';ctx.strokeStyle='#8a7790';ctx.lineWidth=1.5;rr(ctx,-44,-50,88,104,6);ctx.fill();ctx.stroke();ctx.strokeStyle='#5d4f63';ctx.beginPath();ctx.moveTo(-44,-40);ctx.lineTo(44,-40);ctx.stroke();}
  else{ctx.fillStyle='#3a3e46';rr(ctx,-46,-30,92,62,8);ctx.fill();ctx.fillStyle='#22252b';ctx.beginPath();ctx.arc(0,2,22,0,TAU);ctx.fill();ctx.fillStyle='#8cb4d8';ctx.beginPath();ctx.arc(0,2,13,0,TAU);ctx.fill();ctx.fillStyle='#3a3e46';ctx.fillRect(-20,-40,26,12);}
  ctx.save();ctx.scale(2.2,2.2);icon(ctx,it,0,pk==='photo'?-28:0);ctx.restore();
  if(!ghost&&pk!=='photo'){ctx.fillStyle='#c1272d';ctx.fillRect(-40,36,80,17);txt(ctx,'EVIDENCE',0,45,{s:12,w:700,c:'#fff',a:'center',b:'middle'});}
  ctx.restore();}
CS.onLevel=syncMode;CS.controls[0].onChange=sim=>{syncMode(sim);sim.infoDirty=true;};
CS.controls.find(c=>c.id==='method').onChange=sim=>syncMode(sim);
BioLab.register(CS);
})();

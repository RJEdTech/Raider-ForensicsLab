(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;

/* ---------- dyes: representative Rf on filter paper in water (w) and in isopropanol (i) ---------- */
const DYES={
  Y5:{name:'Tartrazine (Yellow 5)',col:'#f2c200',fam:'yellow',w:0.93,i:0.08},
  Y6:{name:'Sunset Yellow (Yellow 6)',col:'#f08a1c',fam:'orange',w:0.74,i:0.14},
  R40:{name:'Allura Red (Red 40)',col:'#d8262f',fam:'red',w:0.58,i:0.20},
  ER:{name:'Erythrosine (Red 3)',col:'#e0457b',fam:'pink',w:0.40,i:0.45},
  B1:{name:'Brilliant Blue FCF (Blue 1)',col:'#1f5fd0',fam:'blue',w:0.82,i:0.32},
  PB:{name:'Patent Blue V',col:'#2364d2',fam:'blue',w:0.82,i:0.58},
  CV:{name:'Crystal violet',col:'#6a2c9e',fam:'violet',w:0.10,i:0.84},
  VB:{name:'Victoria Blue B',col:'#2b3f9e',fam:'navy',w:0.06,i:0.66},
  RB:{name:'Rhodamine B',col:'#d6338f',fam:'magenta',w:0.30,i:0.76},
  NG:{name:'Nigrosine',col:'#3b3b46',fam:'black',w:0.02,i:0.55},
  SB:{name:'Solvent Blue 35',col:'#3a62b8',fam:'blue',w:0.01,i:0.88}
};
const PENS={
  A:{name:'Pen A',desc:'washable marker',dyes:[['Y5',1],['R40',0.9],['B1',1]]},
  B:{name:'Pen B',desc:'felt-tip pen',dyes:[['Y5',0.8],['R40',1],['PB',1]]},
  C:{name:'Pen C',desc:'fountain pen ink',dyes:[['Y6',1],['ER',0.9],['B1',0.9]]},
  D:{name:'Pen D',desc:'permanent marker',dyes:[['NG',1],['RB',0.8],['SB',1]]},
  X:{name:'Ballpoint pen',desc:'ballpoint ink',dyes:[['CV',1],['VB',0.9],['RB',0.6]]}
};
const LINE_DYES=PENS.X.dyes;                 // a start line drawn in ballpoint pen is ballpoint ink
const CASES={'1':'C','2':'B','3':'X'};
const STRIPS=['note','A','B','C','D'];
const SOLV={water:{f:0,D:6.0,name:'water',lab:'Water'},ipa:{f:1,D:1.8,name:'isopropanol',lab:'Isopropanol'},mix:{f:0.5,D:1.5,name:'1 : 1 water–isopropanol',lab:'1 : 1 mix'}};
/* Rf = 1/(1+k), k = partition ratio (time on paper / time in solvent). ln k is interpolated with solvent composition. */
const kOf=rf=>(1-rf)/rf;
function rfDye(id,f){const d=DYES[id];const lk=(1-f)*Math.log(kOf(d.w))+f*Math.log(kOf(d.i));return 1/(1+Math.exp(lk));}

/* ---------- TLC on silica: Snyder–Soczewinski, k = k₁·x^(−n), x = fraction of ethyl acetate in hexane ---------- */
const TLCC={caf:{name:'Caffeine',rf1:0.30,n:1.5,col:'#8e5ac8'},asp:{name:'Aspirin',rf1:0.60,n:1.3,col:'#d0621f'},acet:{name:'Acetaminophen',rf1:0.45,n:1.6,col:'#2e86c1'},X:{name:'Unidentified compound',rf1:0.80,n:1.0,col:'#2e8b57'}};
const LANES=[{id:'caf',lab:'Caf',name:'Caffeine standard',c:['caf']},{id:'asp',lab:'Asp',name:'Aspirin standard',c:['asp']},{id:'acet',lab:'Acet',name:'Acetaminophen standard',c:['acet']},
  {id:'sa',lab:'A',name:'Seized sample A (simulated)',c:['caf','acet']},{id:'sb',lab:'B',name:'Seized sample B (simulated)',c:['caf','X']}];
function rfTlc(c,pct){const m=TLCC[c],x=Math.max(0.1,pct/100);return 1/(1+kOf(m.rf1)*Math.pow(x,-m.n));}

/* ---------- layout ---------- */
const YB=388,PX=25,LEN=12,ORG=1.5,SW=46;const XS=i=>72+i*90;const yP=cm=>YB-cm*PX;
const TP={len:7,org:1.0,depth:0.5,px:42,D:3.0};const XL=i=>98+i*76;const yT=cm=>YB-cm*TP.px;
const ZX=652,ZY=162,ZR=104;
const round1=v=>Math.round(v*10)/10;

function geom(sim){const p=sim.p,st=sim.st;
  if(p.mode==='tlc'){const max=TP.len-0.6,yF=Math.min(max,TP.depth+Math.sqrt(TP.D*st.t));return {tlc:true,len:TP.len,org:TP.org,depth:TP.depth,yF,F:Math.max(0,yF-TP.org),max};}
  const S=SOLV[p.solvent]||SOLV.water,max=LEN-0.6,yF=Math.min(max,p.depth+Math.sqrt(S.D*st.t));return {tlc:false,len:LEN,org:ORG,depth:p.depth,yF,F:Math.max(0,yF-ORG),max,f:S.f};}
const washed=sim=>sim.p.mode!=='tlc'&&sim.p.depth>=ORG;
const notePen=sim=>CASES[sim.p.case]||'C';
const penOf=(sim,i)=>i===0?notePen(sim):STRIPS[i];
const stripName=(sim,i)=>i===0?'Ransom note':PENS[STRIPS[i]].name;
const selIdx=sim=>sim.p.mode==='tlc'?Math.max(0,LANES.findIndex(l=>l.id===sim.p.lane)):Math.max(0,STRIPS.indexOf(sim.p.strip));

/* spots on strip/lane i right now: [{key,col,fam,name,rf,d,amt,line}] */
function spots(sim,i){const g=geom(sim);
  if(g.tlc)return LANES[i].c.map(c=>{const rf=rfTlc(c,sim.p.eluent);return {key:c,col:TLCC[c].col,fam:c,name:TLCC[c].name,rf,d:rf*g.F,amt:1};});
  const w=washed(sim)?1-sim.st.wash:1;
  return PENS[penOf(sim,i)].dyes.map(([id,a])=>{const rf=rfDye(id,g.f);return {key:id,col:DYES[id].col,fam:DYES[id].fam,name:DYES[id].name,rf,d:rf*g.F,amt:a*w};}).sort((a,b)=>b.d-a.d);}
function lineSpots(sim){const g=geom(sim);return LINE_DYES.map(([id,a])=>{const rf=rfDye(id,g.f);return {key:id,col:DYES[id].col,fam:DYES[id].fam,name:DYES[id].name,rf,d:rf*g.F,amt:a,line:true};});}
/* what a student measures with a ruler (to 0.1 cm) */
function measured(s,F){const dm=round1(s.d),Fm=round1(F);return {dm,Fm,rf:Fm>0?dm/Fm:0};}
/* pattern of spots a student would write down for pen key at solvent fraction f once the front is F cm past the line */
function patternFor(pen,f,F){return PENS[pen].dyes.map(([id])=>{const rf=rfDye(id,f),d=rf*F;return {fam:DYES[id].fam,rf:round1(F)>0?round1(d)/round1(F):0,moved:d>=0.25};}).sort((a,b)=>b.rf-a.rf);}
function samePattern(a,b){if(a.length!==b.length)return false;return a.every((s,i)=>s.fam===b[i].fam&&(s.moved?b[i].moved&&Math.abs(s.rf-b[i].rf)<=0.05:!b[i].moved));}
const FULL=9.5;
function matchesFor(caseId,solv,F){const f=SOLV[solv].f,note=patternFor(CASES[caseId],f,F||FULL);return ['A','B','C','D'].filter(k=>samePattern(note,patternFor(k,f,F||FULL)));}
function listPens(ks){if(!ks.length)return 'no pen';if(ks.length===1)return 'Pen '+ks[0];return 'Pens '+ks.slice(0,-1).join(', ')+' and '+ks[ks.length-1];}
function describe(pat){return pat.map(s=>s.moved?s.fam+' '+s.rf.toFixed(2):s.fam+' at the line').join(', ');}

/* ---------- run control ---------- */
function freshRun(sim){const st=sim.st;if(!st)return;st.t=0;st.done=false;st.trace=[];st.wash=0;sim.infoDirty=true;}
function resKey(sim){return sim.p.mode==='tlc'?'tlc|'+sim.p.eluent:sim.p.case+'|'+sim.p.solvent;}
function record(sim){const st=sim.st,g=geom(sim);if(g.F<3||washed(sim))return;const n=sim.p.mode==='tlc'?LANES.length:5,rows=[];
  for(let i=0;i<n;i++)rows.push(spots(sim,i).map(s=>({fam:s.fam,col:s.col,rf:measured(s,g.F).rf,moved:s.d>=0.25})));
  st.res[resKey(sim)]={rows,pen:sim.p.line==='pen'&&sim.p.mode!=='tlc'};sim.infoDirty=true;}
function stopRun(sim){const st=sim.st;if(st.done)return;st.done=true;record(sim);}
function finishRun(sim){const st=sim.st;freshRun(sim);const g=geom(sim),D=g.tlc?TP.D:SOLV[sim.p.solvent].D;st.t=Math.pow(g.max-g.depth,2)/D+0.01;
  for(let s=0;s<=st.t;s+=0.25)st.trace.push([s,Math.min(g.max,g.depth+Math.sqrt(D*s))]);if(washed(sim))st.wash=1;stopRun(sim);}

function syncMode(sim){if(!atLeast('ap')&&sim.p.mode==='tlc'){sim.p.mode='paper';if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.mode)sim.ui.ctl.mode.set('paper');}
  if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});}

function matchText(sim){const g=geom(sim);
  if(sim.p.mode==='tlc'){if(!sim.p.uv)return 'Turn on the UV lamp to see the spots';if(g.F<1.5)return 'Let the eluent climb farther';
    const st=LANES.slice(0,3).map((l,i)=>({l,rf:measured(spots(sim,i)[0],g.F).rf}));
    return ['sa','sb'].map(id=>{const i=LANES.findIndex(l=>l.id===id),ss=spots(sim,i).map(s=>measured(s,g.F).rf);
      const hits=ss.map(r=>{const m=st.find(s=>Math.abs(s.rf-r)<=0.03);return m?m.l.lab:'?';});return LANES[i].lab+': '+hits.join(' + ');}).join(' · ')+(atLeast('ap')?' (? = no standard matches)':'');}
  if(washed(sim))return 'Ink washed into the solvent';
  if(g.F<2)return 'Let the solvent climb farther';
  const ks=matchesFor(sim.p.case,sim.p.solvent,g.F);let s=ks.length===1?'Pen '+ks[0]+' matches the note':ks.length?listPens(ks)+' both match':'No suspect pen matches';
  if(atLeast('honors')){const runs=Object.keys(sim.st.res).filter(k=>k.startsWith(sim.p.case+'|')).map(k=>k.split('|')[1]);
    if(runs.length>1){const all=['A','B','C','D'].filter(k=>runs.every(sv=>matchesFor(sim.p.case,sv).includes(k)));s='All '+runs.length+' solvents: '+(all.length?listPens(all)+(all.length>1?' match':' matches'):'no pen matches');}}
  return s;}

const CHROM={
  id:'chromatography',hash:'chromatography',apUnit:16,order:5,kind:'Virtual lab',tab:'Ink chromatography',
  prereq:['separation'],next:['imf','spottest','spectroscopy'],
  card:'Run ink from a ransom note and four suspect pens up paper strips, measure Rf values, and find the pen that wrote the note.',
  title:'Chromatography: who wrote the ransom note?',
  lede:{bio:'Black ink is a mixture of colored dyes. As solvent climbs the paper, each dye travels a different distance. The pattern of spots is like a fingerprint for the ink.',
        honors:'Measure Rf values with a ruler, test the note in two solvents, and see how lab technique (solvent depth, start-line pencil) can ruin a run.',
        ap:'Treat Rf as a partition ratio, change the solvent polarity, and run thin-layer chromatography (TLC) on simulated drug evidence under UV light.'},
  scale:{bio:'Real lab scale: paper strips 12 cm long in a jar. Each dye spot holds trillions of dye molecules about 1 nm across.',
         ap:'Paper strips 12 cm long; TLC plate 7 cm tall. The particle view zooms about 100,000× into the paper (cellulose fibers about 20 µm wide) or the silica gel.'},
  timeScale:1,dtMax:0.05,prewarm:1.5,sampleDt:0.25,window:45,unit:'min',timeLabel:'Run time',chChange:0.3,chReveal:10,
  controls:[
    {id:'mode',label:'Method',type:'seg',def:'paper',lvl:'ap',options:[{v:'paper',l:'Paper: pen inks'},{v:'tlc',l:'TLC: drug standards',lvl:'ap'}],onChange(sim){syncMode(sim);freshRun(sim);}},
    {id:'solvent',label:'Solvent',type:'seg',def:'water',lvl:'bio',modes:['paper'],options:[{v:'water',l:'Water'},{v:'ipa',l:'Isopropanol'},{v:'mix',l:'1 : 1 mix',lvl:'honors'}],
     help:'Changing the solvent starts fresh strips.',onChange:freshRun},
    {id:'case',label:'Case file',type:'select',def:'1',lvl:'bio',modes:['paper'],options:[{v:'1',l:'Case 1: the ransom note'},{v:'2',l:'Case 2: a closer call',lvl:'honors'},{v:'3',l:'Case 3: an outside pen',lvl:'honors'}],onChange(sim){freshRun(sim);}},
    {id:'strip',label:'Strip to measure',type:'select',def:'note',lvl:'bio',modes:['paper'],options:[{v:'note',l:'Ransom note'},{v:'A',l:'Pen A'},{v:'B',l:'Pen B'},{v:'C',l:'Pen C'},{v:'D',l:'Pen D'}],onChange(sim){sim.st.spot=0;},noTrial:false},
    {id:'depth',label:'Solvent depth',type:'range',min:0.5,max:2,step:0.1,def:0.8,unit:' cm',lvl:'honors',modes:['paper'],help:'The start line is 1.5 cm above the bottom.',onChange:freshRun},
    {id:'line',label:'Start line drawn in',type:'seg',def:'pencil',lvl:'honors',modes:['paper'],options:[{v:'pencil',l:'Pencil'},{v:'pen',l:'Ballpoint pen'}],onChange:freshRun},
    {id:'eluent',label:'Ethyl acetate in hexane',type:'range',min:10,max:100,step:5,def:60,unit:'%',lvl:'ap',modes:['tlc'],help:'More ethyl acetate makes a more polar eluent. Changing it starts a fresh plate.',onChange:freshRun},
    {id:'uv',label:'UV lamp (254 nm)',type:'toggle',def:true,lvl:'ap',modes:['tlc'],help:'The plate glows green; compounds that absorb UV show as dark spots.'},
    {id:'lane',label:'Lane to measure',type:'select',def:'sa',lvl:'ap',modes:['tlc'],options:LANES.map(l=>({v:l.id,l:l.name})),onChange(sim){sim.st.spot=0;}}
  ],
  actions:[
    {id:'run',label:'Dip fresh strips',primary:true,run(sim){freshRun(sim);}},
    {id:'stop',label:'Remove and mark the front',run(sim){stopRun(sim);}},
    {id:'spot',label:'Next spot',run(sim){const n=sim.p.mode==='tlc'?LANES[selIdx(sim)].c.length:3;sim.st.spot=(sim.st.spot+1)%n;}}
  ],
  init(){return {t:0,done:false,trace:[],wash:0,spot:0,res:{}};},
  step(sim,dt){const st=sim.st;if(st.done)return;st.t+=dt;const g=geom(sim);
    if(washed(sim))st.wash=1-Math.exp(-st.t/1.2);
    if(!st.trace.length||st.t-st.trace[st.trace.length-1][0]>=0.25)st.trace.push([st.t,g.yF]);
    if(g.yF>=g.max-1e-9)stopRun(sim);},
  metrics:[
    {id:'front',label:'Solvent front above start line',unit:'cm',lvl:'bio',min:0,max:10,d:1,get:s=>geom(s).F},
    {id:'state',label:'Run',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>s.st.done?'Strips out, front marked':geom(s).F<=0?'Solvent climbing to the ink':'Developing'},
    {id:'spots',label:'Spots on the selected strip',unit:'',lvl:'bio',text:true,modes:['paper'],get:s=>{const g=geom(s),ss=spots(s,selIdx(s));if(washed(s)&&s.st.wash>0.5)return 'Ink washed off the line';if(g.F<0.3)return 'Still one dark spot';
      return ss.map(x=>x.d>=0.25?x.fam+' '+measured(x,g.F).rf.toFixed(2):x.fam+' (at the line)').join(' · ');}},
    {id:'tspots',label:'Rf on the selected lane',unit:'',lvl:'ap',text:true,modes:['tlc'],get:s=>{const g=geom(s);if(!s.p.uv)return 'Spots invisible without UV';if(g.F<0.3)return 'Still at the start line';return spots(s,selIdx(s)).map(x=>x.name.split(' ')[0]+' '+measured(x,g.F).rf.toFixed(2)).join(' · ');}},
    {id:'match',label:'Does the note match a pen?',unit:'',lvl:'bio',text:true,modes:['paper'],get:matchText},
    {id:'tmatch',label:'Sample spots line up with',unit:'',lvl:'ap',text:true,modes:['tlc'],get:matchText},
    {id:'rfsel',label:'Rf of the selected spot',unit:'',lvl:'honors',min:0,max:1,d:2,get:s=>{const g=geom(s),ss=spots(s,selIdx(s)),x=ss[s.st.spot%ss.length];return g.F>0?measured(x,g.F).rf:0;}},
    {id:'ksel',label:'Partition ratio k = (1 − Rf)/Rf',unit:'',lvl:'ap',min:0,max:null,d:2,get:s=>{const ss=spots(s,selIdx(s)),x=ss[s.st.spot%ss.length];return kOf(x.rf);}}
  ],
  graphs:[{id:'front',label:'Solvent front vs time',lvl:'bio',lines:['front']},{id:'svf',label:'Spot distance vs solvent distance',lvl:'honors',custom:true},{id:'wash',label:'Front² vs time (Washburn)',lvl:'ap',custom:true}],
  defaultGraph:'front',
  plot(sim,ctx,box,id){const g=geom(sim),st=sim.st;
    if(id==='svf'){const ss=spots(sim,selIdx(sim)),fm=Math.max(10,g.F);const ax=axes(ctx,box,{xmin:0,xmax:10,ymin:0,ymax:10,xl:'Solvent front distance (cm)',yl:'Spot distance (cm)'});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
      const lc=s=>s.col==='#f2c200'?'#c99a00':s.col;ss.forEach((s,i)=>{ctx.strokeStyle=lc(s);ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(10),ax.Y(10*s.rf));ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=lc(s);ctx.beginPath();ctx.arc(ax.X(g.F),ax.Y(s.d),5.5,0,6.29);ctx.fill();});ctx.restore();
      legend(ctx,box.L+10,box.T+10,ss.slice(0,3).map(s=>({label:(sim.p.mode==='tlc'?s.name.split(' ')[0]:s.fam)+' Rf '+s.rf.toFixed(2),color:lc(s),dash:true})));txt(ctx,'slope of each line = Rf',box.L+box.W-6,box.T+box.H-10,{s:13,c:PAL['muted'],a:'right'});return;}
    const D=g.tlc?TP.D:SOLV[sim.p.solvent].D,tmax=Math.max(5,Math.pow(g.max-g.depth,2)/D*1.05),ymax=Math.pow(g.max-g.depth,2)*1.05;
    const ax=axes(ctx,box,{xmin:0,xmax:tmax,ymin:0,ymax,xl:'Run time (min)',yl:'(front height above solvent)² (cm²)'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(tmax),ax.Y(D*tmax));ctx.stroke();ctx.setLineDash([]);
    st.trace.forEach(q=>{ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(ax.X(q[0]),ax.Y(Math.pow(q[1]-g.depth,2)),3.5,0,6.29);ctx.fill();});ctx.restore();
    legend(ctx,box.L+10,box.T+10,[{label:'your run',color:serColor(0)},{label:'h² = D·t, D = '+D.toFixed(1)+' cm²/min',color:PAL['muted'],dash:true}]);},
  infoPanel(sim){const tl=sim.p.mode==='tlc';let h='<div class="p-head"><h3>Evidence table'+(tl?': TLC':': Case '+sim.p.case)+'</h3></div>';
    const keys=Object.keys(sim.st.res).filter(k=>tl?k.startsWith('tlc|'):k.startsWith(sim.p.case+'|'));
    if(!keys.length)return h+'<p class="help">Results appear here when strips come out of the jar. Let a run finish, or press “Remove and mark the front” once the solvent is high.</p>';
    const cols=keys.map(k=>({k,lab:tl?k.split('|')[1]+'% EtOAc':SOLV[k.split('|')[1]].lab}));
    const chip=s=>`<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px"><span style="width:11px;height:11px;border-radius:50%;background:${s.col};border:1px solid rgba(0,0,0,.3)"></span>${s.moved?s.rf.toFixed(2):'line'}</span>`;
    h+='<div class="tbl-wrap"><table><thead><tr><th style="text-align:left">'+(tl?'Lane':'Strip')+'</th>'+cols.map(c=>'<th style="text-align:left">'+c.lab+'</th>').join('')+'</tr></thead><tbody>';
    const n=tl?LANES.length:5;for(let i=0;i<n;i++){h+='<tr><td style="text-align:left">'+(tl?LANES[i].name:(i===0?'<b>Ransom note</b>':PENS[STRIPS[i]].name+' ('+PENS[STRIPS[i]].desc+')'))+'</td>'+cols.map(c=>'<td style="text-align:left">'+sim.st.res[c.k].rows[i].map(chip).join('')+'</td>').join('')+'</tr>';}
    h+='</tbody></table></div>';
    if(!tl){const ms=cols.map(c=>c.lab+': '+listPens(matchesFor(sim.p.case,c.k.split('|')[1])));h+='<p class="help" style="margin-top:8px"><b>Matches the note.</b> '+ms.join(' · ')+'</p>';
      if(keys.some(k=>sim.st.res[k].pen))h+='<p class="help">One run used a pen start line, so its ink ran on every strip too.</p>';}
    else h+='<p class="help" style="margin-top:8px">A sample spot matches a standard when its Rf is within about 0.03. TLC is a presumptive test: confirm with mass spectrometry or IR.</p>';
    return h;},
  narrate(sim){const p=sim.p,st=sim.st,g=geom(sim),hon=atLeast('honors');
    if(p.mode==='tlc'){if(!p.uv)return 'The plate looks blank because caffeine, aspirin and acetaminophen are <b>colorless</b>. Switch on the UV lamp: compounds that absorb 254 nm light block the plate’s green glow.';
      if(g.F<0.3)return 'The eluent is climbing the silica plate. It has not reached the samples yet.';
      return 'Silica is very polar, so <b>polar compounds stick and lag behind</b>. At '+p.eluent+'% ethyl acetate, aspirin moves to Rf '+rfTlc('asp',p.eluent).toFixed(2)+' and caffeine only to '+rfTlc('caf',p.eluent).toFixed(2)+'. '+(st.done?'Compare each sample’s spots with the standards.':'');}
    if(washed(sim))return 'The solvent covers the start line, so the ink <b>dissolves into the pool</b> instead of climbing the paper. Keep the solvent below the line.';
    const ss=spots(sim,selIdx(sim)),nm=stripName(sim,selIdx(sim));
    if(g.F<=0)return 'The '+SOLV[p.solvent].name+' is soaking up the paper by <b>capillary action</b>. It has not reached the ink on the start line yet.';
    const still=ss.filter(s=>s.d<0.25);let s;
    if(still.length===ss.length&&g.F>2)s=nm+'’s dyes <b>do not dissolve in '+SOLV[p.solvent].name+'</b>, so they stay on the start line while the solvent passes them.';
    else{const a=ss[0],b=ss[ss.length-1];s='<b>Each dye moves at its own pace.</b> On the '+nm.toLowerCase().replace('pen','Pen')+' strip, the '+a.fam+' dye has moved '+round1(a.d).toFixed(1)+' cm but the '+b.fam+' dye only '+round1(b.d).toFixed(1)+' cm, because it '+(b.d<0.25?'barely dissolves in the solvent.':'sticks to the paper more.');}
    if(p.line==='pen'&&p.mode==='paper'&&g.F>1)s+=' The ballpoint start line is running too, smearing extra dyes up every strip.';
    else if(st.done&&hon)s+=' The strips are out: Rf = spot distance ÷ front distance.';
    return s;},
  tour:[
    {title:'Set up the jar',text:'Each paper strip has a dot of black ink on a pencil start line, 1.5 cm from the bottom. One strip holds ink from the ransom note. The other four hold ink from the suspects’ pens. The solvent sits below the line.',focus:[18,50,466,345],speed:0.3,setup(sim){BioLab.setValues(sim,{mode:'paper',solvent:'water',case:'1',strip:'note',depth:0.8,line:'pencil'});freshRun(sim);}},
    {title:'Capillary action',text:'Water soaks up the paper between the cellulose fibers, the same way a paper towel soaks up a spill. The wet edge is the <b>solvent front</b>.',focus:[18,140,466,255],speed:0.4},
    {title:'Black ink is a mixture',text:'When the front passes the ink, the dyes start to travel. Each one moves a different distance, so the black dot splits into colors.',focus:[18,50,466,345],speed:1,setup(sim){sim.st.t=Math.max(sim.st.t,2.5);}},
    {title:'Why the dyes separate',text:'Zoom in. Each dye molecule keeps switching between <b>sticking to the paper</b> and <b>moving with the solvent</b>. A dye that spends more time dissolved travels farther.',focus:[ZX-ZR-12,ZY-ZR-30,2*ZR+24,2*ZR+90],speed:1},
    {title:'Measure Rf',text:'Take the strips out before the front reaches the top and mark the front. Then Rf = distance the spot moved ÷ distance the solvent moved. Rf stays the same no matter how long the run is.',focus:[[18,50,140,345],[520,300,272,96]],speed:1,pause:true,setup(sim){finishRun(sim);}},
    {title:'Match the note',text:'Compare the note’s spots (color and Rf) with each pen. In water, only Pen C gives the same pattern as the note.',focus:[18,50,466,345],speed:1,pause:true},
    {lvl:'honors',title:'A second solvent',text:'In Case 2, the note matches Pens A and B in water. Isopropanol moves different dyes and tells the two blues apart. Only Pen B matches in both solvents.',focus:[18,50,466,345],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{case:'2',solvent:'ipa'});finishRun(sim);}},
    {lvl:'ap',title:'TLC of drug evidence',text:'The same idea runs on a silica plate. These compounds are colorless, so you see them as dark spots under UV light. A matching Rf is only presumptive: confirm with spectroscopy.',focus:[30,14,440,384],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'tlc',uv:true,eluent:60});finishRun(sim);}}
  ],
  onTourExit(sim){const base={};CHROM.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);BioLab.reset(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);finishRun(sim);}},
  challenges(sim){const pc=matchesFor('1','water'),pens=['Pen A','Pen B','Pen C','Pen D'];
    const nC=describe(patternFor('C',0,FULL)),w2=matchesFor('2','water'),i2=matchesFor('2','ipa');
    const kw=kOf(rfDye('B1',0)),ki=kOf(rfDye('B1',1)),r30=rfTlc('caf',30),r80=rfTlc('caf',80);
    return [
    {lvl:'bio',q:'The ransom note was written in black ink. As the water climbs past the ink spot, what will happen to it?',choices:['The whole black spot moves up as one blob','It splits into several colored spots','It washes off the paper'],correct:1,
     baseline:{mode:'paper',solvent:'water',case:'1',strip:'note'},changeAction:'run',changeText:'Fresh strips dipped in water',watch:'front',
     explain:{bio:'Black ink is a mixture of dyes. The note’s ink split into orange, pink and blue spots, because each dye moves a different distance.',honors:'The note separated into '+nC+'. Each dye’s Rf depends on how well it dissolves in water compared with how strongly it sticks to the paper.'}},
    {lvl:'bio',q:'Pen D is a permanent marker. What happens to its ink in water?',choices:['It separates like the other inks','Most of it stays on or near the start line','It climbs as one black spot'],correct:1,
     baseline:{mode:'paper',solvent:'water',case:'1',strip:'D'},changeAction:'run',changeText:'Fresh strips dipped in water',
     explain:{bio:'Permanent-marker dyes are mostly nonpolar, so they barely dissolve in water. The water passes them by: the black and blue dyes stay on the line and the pink one creeps only a short way. That is why permanent marker does not wash off.',honors:'Nigrosine, Rhodamine B and Solvent Blue 35 have Rf ≈ 0.01–0.30 in water. “Like dissolves like”: these alcohol-soluble dyes need a less polar solvent.'}},
    {lvl:'bio',q:'Switch the solvent to isopropanol (rubbing alcohol). What happens to Pen D’s ink now?',choices:['It still stays on the line','It separates into colored spots','It disappears'],correct:1,
     baseline:{mode:'paper',solvent:'water',case:'1',strip:'D'},change:{solvent:'ipa'},changeText:'Fresh strips dipped in isopropanol',reveal:30,
     explain:{bio:'Isopropanol is less polar than water, so it dissolves the permanent-marker dyes and carries them up the paper. The right solvent depends on the ink.',honors:'In isopropanol Pen D gives '+describe(patternFor('D',1,FULL))+'. The food dyes in Pens A–C barely move now.'}},
    {lvl:'bio',instant:true,set:{mode:'paper',solvent:'water',case:'1',strip:'note'},q:'Case 1, run in water. Compare the note’s spots with each pen. Which pen wrote the note?',choices:pens,correct:Math.max(0,pens.indexOf('Pen '+pc[0])),
     explain:{bio:'The strips are now finished. The note shows '+nC+'. Only Pen '+pc[0]+' gives the same colors at the same heights.',honors:'Matching means the same number of spots, the same colors and Rf values within about 0.05. Note: '+nC+'.'}},
    {lvl:'honors',q:'After a few minutes the note’s top spot has an Rf of about 0.82. If you let the solvent keep climbing, its Rf will…',choices:['grow, because the spot keeps moving','stay about the same','shrink'],correct:1,
     baseline:{mode:'paper',solvent:'water',case:'1',strip:'note'},at:4,changeText:'Letting the solvent keep climbing',reveal:11,watch:'svf',
     explain:{honors:'The spot and the front both keep moving, in the same proportion. Watch the Rf readout: it stays near 0.82 the whole run. On the graph, each dye is a straight line whose slope is its Rf.'}},
    {lvl:'honors',q:'In Case 2, the note matches both Pen A and Pen B in water. What should you do next?',choices:['Conclude it was Pen A','Run the inks again in a different solvent','Nothing: chromatography cannot separate these pens'],correct:1,
     baseline:{mode:'paper',solvent:'water',case:'2',strip:'note'},change:{solvent:'ipa'},changeText:'Fresh strips dipped in isopropanol',reveal:32,
     explain:{honors:'In water, '+listPens(w2)+' match: their two blue dyes have the same Rf (0.82). In isopropanol those blues separate differently (0.32 vs 0.58), and only '+listPens(i2)+' still matches.'}},
    {lvl:'honors',q:'You pour the solvent 2 cm deep, above the 1.5 cm start line. What happens to the ink?',choices:['The spots separate faster','The ink dissolves into the solvent pool instead of climbing','Nothing changes'],correct:1,
     baseline:{mode:'paper',solvent:'water',case:'1',depth:2},changeAction:'run',changeText:'Fresh strips dipped into deep solvent',reveal:6,
     explain:{honors:'The ink sat under the surface, so the dyes dissolved into the pool and spread out. Nothing was left to climb. Always keep the solvent below the start line.'}},
    {lvl:'honors',q:'Why is the start line drawn in pencil, not pen?',choices:['Pencil is easier to erase','Pen ink is a mixture of dyes that runs up the paper too; graphite does not dissolve','Pen lines are too thick to measure from'],correct:1,
     baseline:{mode:'paper',solvent:'ipa',case:'1',line:'pen'},changeAction:'run',changeText:'Fresh strips with a ballpoint start line, in isopropanol',reveal:25,
     explain:{honors:'The ballpoint line separated into violet, magenta and navy streaks across every strip, mixing with the spots you wanted to measure. Graphite (carbon) is insoluble, so a pencil line stays put.'}},
    {lvl:'honors',instant:true,set:{mode:'paper',solvent:'ipa',case:'3',strip:'note'},q:'In Case 3, the note matches none of the four pens in water or in isopropanol. What can you conclude?',choices:['One of the pens wrote it; the test failed','None of these four pens wrote the note','The note is a fake'],correct:1,
     explain:{honors:'The model shows no match in either solvent ('+listPens(matchesFor('3','water'))+' in water, '+listPens(matchesFor('3','ipa'))+' in isopropanol). Chromatography can <b>exclude</b> a pen. A match only shows the inks are consistent, since many pens of one brand share an ink (class evidence).'}},
    {lvl:'ap',instant:true,set:{mode:'paper',solvent:'water',case:'1',strip:'A'},q:'Brilliant Blue FCF has Rf 0.82 in water but 0.32 in isopropanol. What does that say about it?',choices:['It is nonpolar','It is very polar (ionic), so it prefers water to isopropanol','It sticks to the paper more in water'],correct:1,
     explain:{ap:'k = (1 − Rf)/Rf: k = '+kw.toFixed(2)+' in water but '+ki.toFixed(2)+' in isopropanol. A small k means the dye spends most of its time in the mobile phase. Brilliant Blue carries two sulfonate (–SO₃⁻) groups, so it dissolves best in the most polar solvent.'}},
    {lvl:'ap',q:'On a silica TLC plate, you raise the ethyl acetate from 30% to 80%. The Rf values will…',choices:['all increase','all decrease','not change'],correct:0,
     baseline:{mode:'tlc',eluent:30,uv:true,lane:'sa'},change:{eluent:80},changeText:'Fresh plate run in 80% ethyl acetate',at:1,reveal:16,
     explain:{ap:'Ethyl acetate is more polar than hexane, so it competes with the compounds for the polar silica sites. Caffeine’s Rf rose from '+r30.toFixed(2)+' to '+r80.toFixed(2)+'. In the model, k = k₁·x⁻ⁿ (Snyder–Soczewinski).'}},
    {lvl:'ap',q:'Under room light the developed TLC plate looks blank. What will the UV lamp show?',choices:['Still nothing: the samples are gone','Dark spots where compounds absorb 254 nm light','Each spot glowing a different color'],correct:1,
     baseline:{mode:'tlc',eluent:60,uv:false,lane:'sa'},change:{uv:true},changeText:'UV lamp switched on',at:13,reveal:15,
     explain:{ap:'The plate contains a green fluorescent indicator (F254). Aromatic compounds like caffeine, aspirin and acetaminophen absorb 254 nm light, so they block the glow and appear dark. They were there all along, just colorless.'}},
    {lvl:'ap',instant:true,set:{mode:'tlc',eluent:60,uv:true,lane:'sa'},q:'Seized sample A (simulated) shows spots at the same Rf as caffeine and acetaminophen. Is that a confirmed identification?',choices:['Yes: matching Rf proves identity','No: TLC is presumptive; confirm with mass spectrometry or IR','Yes, if the spots are the same size'],correct:1,
     explain:{ap:'Different compounds can share an Rf in one eluent. Labs treat TLC as presumptive and confirm with a technique that identifies structure, such as GC–MS or IR spectroscopy (see the Spectroscopy tool). Sample B also has a spot no standard matches.'}}];},
  lab:{bio:'<p><b>Question:</b> Which suspect pen wrote the ransom note?</p><p>Safety: goggles on. Isopropanol is flammable, so no flames nearby.</p><ol><li>Use Case 1 with water as the solvent. Let the run finish.</li><li>For each strip, select it and record a trial. Write down the color of each spot and its Rf.</li><li>Compare the note with each pen.</li><li>Repeat in isopropanol and check that your answer holds.</li></ol><p>Write: “The note was written with Pen __ because __.”</p>',
       honors:'<p><b>Question:</b> How sure can a chromatogram make you?</p><ol><li>Run Case 2 in water, then in isopropanol. Record Rf values for the note and Pens A and B.</li><li>Run Case 3 in both solvents.</li><li>Test one technique error: solvent above the line, or a pen start line. Describe what goes wrong.</li><li>Check that Rf stays the same while the solvent climbs (Spot distance vs solvent distance graph).</li></ol><p>Explain why a match is weaker evidence than a mismatch.</p>',
       ap:'<p><b>Question:</b> How does mobile-phase polarity control Rf?</p><ol><li>Paper: record Rf for each dye in water, the 1 : 1 mix and isopropanol. Calculate k = (1 − Rf)/Rf.</li><li>TLC: run plates at 20%, 40%, 60%, 80% and 100% ethyl acetate. Record Rf for each standard.</li><li>Plot log k against log(fraction ethyl acetate) and find the slope.</li><li>Identify the spots in Seized samples A and B (simulated).</li></ol><p><b>Claim–evidence–reasoning:</b> Explain the order of the TLC spots using intermolecular forces with silica, and say what further test would confirm sample B.</p>'},
  terms:[{t:'Chromatography',d:'Separating a mixture by how its parts move through a stationary phase carried by a mobile phase.'},{t:'Stationary phase',d:'The material that stays put: paper (cellulose) or silica gel.'},
    {t:'Mobile phase (solvent)',d:'The liquid that climbs and carries the substances: water, isopropanol, or an eluent mixture.'},{t:'Solvent front',d:'The farthest point the solvent has reached.'},
    {t:'Rf (retention factor)',d:'Distance the spot moved ÷ distance the solvent front moved, both measured from the start line. Always between 0 and 1.'},{t:'Capillary action',d:'Liquid drawn up through narrow spaces, like the gaps between paper fibers.'},
    {lvl:'honors',t:'Like dissolves like',d:'Polar substances dissolve in polar solvents and nonpolar substances in nonpolar ones.'},{lvl:'honors',t:'Class evidence',d:'Evidence that narrows a source to a group (one ink formula), not one individual item.'},
    {lvl:'honors',t:'Exclusion',d:'A mismatch shows a sample did not come from a source.'},
    {lvl:'ap',t:'Partition ratio k',d:'Time spent on the stationary phase ÷ time in the mobile phase. Rf = 1/(1 + k).'},{lvl:'ap',t:'TLC',d:'Thin-layer chromatography: a thin layer of silica gel on glass or foil as the stationary phase.'},
    {lvl:'ap',t:'Eluent strength',d:'How well the mobile phase competes for the stationary phase. On silica, more polar eluents give higher Rf.'}],
  about:'<p><b>Model.</b> Each dye spends a fraction of its time dissolved in the moving solvent. That fraction is its Rf, so a spot sits at Rf × (front distance), and Rf = 1/(1 + k) where k is the partition ratio. For paper, each dye has a representative Rf in water and in isopropanol; mixed solvents interpolate ln k linearly with composition. The front rises by the Washburn equation, h² = D·t, with D larger for water than for the more viscous isopropanol and the 1 : 1 mix. Times are realistic in shape but compressed.</p><p><b>TLC.</b> Silica-gel retention follows the Snyder–Soczewinski rule k = k₁·x⁻ⁿ, where x is the fraction of ethyl acetate. Rf values are representative of classroom plates, not measured constants.</p><p><b>Simplified.</b> The dye names are real ink and food dyes, but the pens are invented and their Rf values were chosen to resemble typical classroom results. Real Rf values shift with the paper, temperature and how saturated the jar air is, so labs always run standards side by side. Spots are idealized ellipses that widen by diffusion. Seized samples are simulated mixtures of over-the-counter compounds; no controlled substances are modeled. Rulers read to 0.1 cm, so measured Rf values carry that uncertainty.</p>',
  initVis(sim){sim.vis.mol=null;sim.vis.flow=[];},
  onClick(sim,x,y){const tl=sim.p.mode==='tlc',n=tl?LANES.length:5;for(let i=0;i<n;i++){const cx=tl?XL(i):XS(i);if(Math.abs(x-cx)<(tl?34:30)&&y>60&&y<YB+4){
      if(i===selIdx(sim)){const g=geom(sim),ss=spots(sim,i),yy=tl?yT:yP,org=tl?TP.org:ORG;let best=-1,bd=40;ss.forEach((s,j)=>{const dy=Math.abs(yy(org+s.d)-y);if(dy<bd){bd=dy;best=j;}});if(best>=0)sim.st.spot=best;}
      else BioLab.setValues(sim,tl?{lane:LANES[i].id}:{strip:STRIPS[i]});return;}}},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,g=geom(sim),hon=atLeast('honors'),ap=atLeast('ap'),tl=g.tlc,sel=selIdx(sim);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,400,800,50);
    // jar
    ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.10;rr(ctx,18,50,466,346,10);ctx.fill();ctx.globalAlpha=1;
    const poolH=g.depth*(tl?TP.px:PX);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(20,YB-poolH,462,poolH+6);
    if(!tl&&washed(sim)&&st.wash>0){ctx.fillStyle='rgba(70,40,90,'+(0.35*st.wash)+')';ctx.fillRect(20,YB-poolH,462,poolH+6);}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(18,50);ctx.lineTo(18,394);ctx.quadraticCurveTo(18,396,28,396);ctx.lineTo(474,396);ctx.quadraticCurveTo(484,396,484,386);ctx.lineTo(484,50);ctx.stroke();
    ctx.fillStyle=PAL['cv-soft'];rr(ctx,10,44,482,8,3);ctx.fill();
    if(tl)drawPlate(sim,ctx,g,k,sel,ap);else drawStrips(sim,ctx,g,k,sel,hon);
    drawZoom(sim,ctx,g,k,vdt,t,sel);
    // bench labels
    const sv=tl?p.eluent+'% ethyl acetate':SOLV[p.solvent].lab+(hon?' · '+p.depth.toFixed(1)+' cm deep':'');pill(ctx,sv,250,425,PAL['card'],PAL['cv-ink'],13*k);
    txt(ctx,k<1.3?'Goggles on · no flames near alcohol':'Goggles on',650,429,{s:12*k,c:PAL['cv-soft'],a:'center',w:600});},
  thumbSetup(sim){sim.st.t=5;}
};

function hexA(h,a){const n=parseInt(h.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
function blob(ctx,x,y,rx,ry,col,a){if(a<=0.01)return;ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const gr=ctx.createRadialGradient(0,0,0,0,0,1);gr.addColorStop(0,hexA(col,a));gr.addColorStop(0.55,hexA(col,a*0.85));gr.addColorStop(1,hexA(col,0));
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,1,0,6.29);ctx.fill();ctx.restore();}
function drawStrips(sim,ctx,g,k,sel,hon){const p=sim.p,st=sim.st,top=yP(LEN);
  ctx.fillStyle=PAL['cv-soft'];rr(ctx,24,top-8,454,6,3);ctx.fill();
  for(let i=0;i<5;i++){const x=XS(i);
    // paper
    ctx.fillStyle='#fbfaf3';ctx.fillRect(x-SW/2,top,SW,YB-top);
    ctx.save();ctx.beginPath();ctx.rect(x-SW/2,top,SW,YB-top);ctx.clip();
    ctx.fillStyle='rgba(110,160,210,.20)';ctx.fillRect(x-SW/2,yP(g.yF),SW,YB-yP(g.yF));
    ctx.strokeStyle=p.line==='pen'?'#3d2a7a':'#8c8c8c';ctx.lineWidth=p.line==='pen'?2:1.5;ctx.beginPath();ctx.moveTo(x-SW/2+3,yP(ORG));ctx.lineTo(x+SW/2-3,yP(ORG));ctx.stroke();
    ctx.globalCompositeOperation='multiply';
    if(p.line==='pen')lineSpots(sim).forEach(s=>{const yy=yP(ORG+s.d),ry=3+2.4*Math.sqrt(s.d);blob(ctx,x,yy,SW*0.75,ry,s.col,0.55*s.amt/(1+0.15*s.d));});
    spots(sim,i).forEach(s=>{const yy=yP(ORG+s.d),sq=Math.sqrt(s.d),ry=5+3.2*sq,rx=Math.min(SW/2-3,9+1.8*sq),a=s.amt*0.92/(1+0.12*s.d);
      if(s.d>0.4){const gr=ctx.createLinearGradient(0,yP(ORG),0,yy);gr.addColorStop(0,hexA(s.col,0.02));gr.addColorStop(1,hexA(s.col,0.14*s.amt));ctx.fillStyle=gr;ctx.fillRect(x-rx*0.6,yy,rx*1.2,yP(ORG)-yy);}
      blob(ctx,x,yy,rx,ry,s.col,a);});
    ctx.globalCompositeOperation='source-over';
    if(st.done){ctx.strokeStyle='#7a7a7a';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x-SW/2,yP(g.yF));ctx.lineTo(x+SW/2,yP(g.yF));ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
    ctx.strokeStyle='#cfc9b4';ctx.lineWidth=1;ctx.strokeRect(x-SW/2+.5,top+.5,SW-1,YB-top-1);
    ctx.fillStyle='#4b4f57';rr(ctx,x-11,top-12,22,12,2);ctx.fill();
    txt(ctx,i===0?'Note':'Pen '+STRIPS[i],x,top-20,{s:13*k,w:i===sel?800:600,a:'center',c:i===sel?PAL['s1']:PAL['cv-ink']});
    if(i===sel){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;rr(ctx,x-SW/2-5,top-4,SW+10,YB-top+2,8);ctx.stroke();}}
  // selected spot marker and ruler
  const x=XS(sel),ss=spots(sim,sel),sp=ss[st.spot%ss.length];
  if(g.F>0.3&&sp.amt>0.2){const yy=yP(ORG+sp.d);ctx.strokeStyle='#222';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.ellipse(x,yy,SW/2-1,8+3.2*Math.sqrt(sp.d),0,0,6.29);ctx.stroke();ctx.setLineDash([]);}
  if(hon){const rx=x+SW/2+3,rw=22;ctx.fillStyle=PAL['cv-ruler'];rr(ctx,rx,yP(ORG+10.2),rw,10.4*PX,3);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();for(let c=0;c<=10.001;c+=0.5){const yy=Math.round(yP(ORG+c))+.5,L=Number.isInteger(c)?8:4;ctx.moveTo(rx,yy);ctx.lineTo(rx+L,yy);}ctx.stroke();
    for(let c=0;c<=10;c+=2)txt(ctx,String(c),rx+rw-3,yP(ORG+c)+(c===0?-3:4),{s:12*k,c:PAL['cv-soft'],a:'right',w:600});
    if(g.F>0.3){const marks=[[ORG+g.F,PAL['s2']],[ORG+sp.d,PAL['s1']]];marks.forEach(([cm,c])=>{const yy=yP(cm);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rx-4,yy);ctx.lineTo(rx+rw+4,yy);ctx.stroke();});}}}
function drawPlate(sim,ctx,g,k,sel,ap){const p=sim.p,st=sim.st,top=yT(TP.len),x0=50,x1=450;
  if(p.uv){ctx.fillStyle='#5b3fa0';rr(ctx,120,8,260,26,6);ctx.fill();txt(ctx,'UV lamp · 254 nm',250,26,{s:13*k,w:700,c:'#fff',a:'center'});}
  ctx.fillStyle=p.uv?'#8fdc8a':'#f3f3ee';ctx.fillRect(x0,top,x1-x0,YB-top);
  ctx.save();ctx.beginPath();ctx.rect(x0,top,x1-x0,YB-top);ctx.clip();
  ctx.fillStyle=p.uv?'rgba(30,90,140,.18)':'rgba(110,160,210,.16)';ctx.fillRect(x0,yT(g.yF),x1-x0,YB-yT(g.yF));
  ctx.strokeStyle='#8c8c8c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0+8,yT(TP.org));ctx.lineTo(x1-8,yT(TP.org));ctx.stroke();
  for(let i=0;i<LANES.length;i++){const x=XL(i);spots(sim,i).forEach(s=>{const yy=yT(TP.org+s.d),sq=Math.sqrt(s.d),ry=4+3.5*sq,rx=Math.min(24,8+2.5*sq);
      if(p.uv)blob(ctx,x,yy,rx,ry,'#3a2d5c',0.85/(1+0.15*s.d));else blob(ctx,x,yy,rx,ry,'#d8d4c4',0.25);});}
  if(st.done){ctx.strokeStyle='#666';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x0,yT(g.yF));ctx.lineTo(x1,yT(g.yF));ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();ctx.strokeStyle='#9aa3a8';ctx.lineWidth=2;ctx.strokeRect(x0,top,x1-x0,YB-top);
  for(let i=0;i<LANES.length;i++){const x=XL(i);txt(ctx,LANES[i].lab,x,top-12,{s:13*k,w:i===sel?800:600,a:'center',c:i===sel?PAL['s1']:PAL['cv-ink']});}
  const x=XL(sel);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;rr(ctx,x-32,top+3,64,YB-top-6,8);ctx.stroke();
  if(ap&&p.uv){const ss=spots(sim,sel),sp=ss[st.spot%ss.length];if(g.F>0.3){const yy=yT(TP.org+sp.d);ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.ellipse(x,yy,26,8+3.5*Math.sqrt(sp.d),0,0,6.29);ctx.stroke();ctx.setLineDash([]);}}}
/* particle view: molecules hop between the stationary phase and the moving solvent; fraction of time moving = Rf */
function drawZoom(sim,ctx,g,k,vdt,t,sel){const p=sim.p,st=sim.st,v=sim.vis,tl=g.tlc,ss=spots(sim,sel);
  const pick=[ss[st.spot%ss.length]];const other=ss.filter(s=>s!==pick[0]).sort((a,b)=>Math.abs(b.rf-pick[0].rf)-Math.abs(a.rf-pick[0].rf))[0];if(other)pick.push(other);
  const key=pick.map(s=>s.key).join('|')+(tl?'t':'p');
  const lanesX=tl?[-70,-20,30,80]:[-62,-2,58];
  if(!v.mol||v.key!==key){v.key=key;v.mol=[];for(let j=0;j<pick.length;j++)for(let i=0;i<14;i++){const c=i%lanesX.length;v.mol.push({d:j,y0:i*13+j*7,y:ZY-ZR+((i*53+j*29)%(2*ZR)),ch:tl?i:c,side:(i%2?1:-1),free:false,x:ZX+lanesX[c]+(i%2?14:-14)});}
    v.flow=[];for(let i=0;i<26;i++)v.flow.push({x:ZX-ZR+((i*61)%(2*ZR)),y:ZY-ZR+((i*37)%(2*ZR))});}
  const moving=!st.done&&g.F>0&&!(washed(sim)&&!tl);const wet=g.F>0||g.yF>=g.org;
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.clip();
  ctx.fillStyle=wet?'#d9eaf4':'#efeae0';ctx.fillRect(ZX-ZR,ZY-ZR,2*ZR,2*ZR);
  if(!tl){[-92,-32,28,88].forEach((dx,i)=>{const x=ZX+dx;ctx.fillStyle='#e4d9b8';ctx.beginPath();ctx.moveTo(x-11,ZY-ZR);for(let y=ZY-ZR;y<=ZY+ZR;y+=12)ctx.lineTo(x-11+Math.sin(y*0.05+i)*3,y);ctx.lineTo(x+11,ZY+ZR);for(let y=ZY+ZR;y>=ZY-ZR;y-=12)ctx.lineTo(x+11+Math.sin(y*0.05+i)*3,y);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#c9b98d';ctx.lineWidth=1;ctx.stroke();});}
  else{for(let i=0;i<5;i++)for(let j=0;j<5;j++){const x=ZX-ZR+20+i*48+(j%2)*24,y=ZY-ZR+18+j*46;ctx.fillStyle='#e6e6df';ctx.beginPath();ctx.arc(x,y,17,0,6.29);ctx.fill();ctx.strokeStyle='#bdbdb3';ctx.lineWidth=1;ctx.stroke();}}
  if(moving&&!RM){v.flow.forEach(f=>{f.y-=60*vdt;if(f.y<ZY-ZR)f.y+=2*ZR;});}
  if(wet){ctx.fillStyle='#7f9fb0';ctx.globalAlpha=0.6;v.flow.forEach(f=>{ctx.beginPath();ctx.arc(f.x,f.y,2,0,6.29);ctx.fill();});ctx.globalAlpha=1;}
  const kt=2.2;v.mol.forEach(m=>{const s=pick[m.d];if(!s)return;
    if(moving&&!RM&&vdt>0){if(m.free){if(Math.random()<kt*(1-s.rf)*vdt)m.free=false;}else if(Math.random()<kt*s.rf*vdt)m.free=true;}else if(!moving)m.free=false;
    const hx=tl?ZX-ZR+16+((m.ch*67+m.d*41+(m.side>0?23:0)+Math.round(m.y0||0))%(2*ZR-32)):0;
    const target=tl?hx:(m.free?ZX+lanesX[m.ch]+m.side*6:ZX+lanesX[m.ch]+m.side*17);
    m.x+=(target-m.x)*Math.min(1,vdt*8||0);if(m.free&&!RM){m.y-=60*vdt;if(m.y<ZY-ZR-8)m.y+=2*ZR+16;}
    ctx.fillStyle=s.col;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(m.x,m.y,m.free?6.5:6,0,6.29);ctx.fill();ctx.stroke();});
  ctx.restore();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  txt(ctx,k>1.4?'Particle view':tl?'Particle view: silica gel':'Particle view: paper fibers',ZX,ZY-ZR-12,{s:13*k,w:700,a:'center'});
  // lead lines from the selected strip
  const sx=488,sy=(tl?yT:yP)(g.org+pick[0].d);
  ctx.save();ctx.globalAlpha=0.45;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ZX-ZR*0.71,ZY-ZR*0.71);ctx.moveTo(sx,sy);ctx.lineTo(ZX-ZR*0.71,ZY+ZR*0.71);ctx.stroke();ctx.restore();
  // legend
  let ly=ZY+ZR+24;ctx.font='600 '+(12*k)+'px '+FONT;const longs=pick.map(s=>(tl?s.name.split(' ')[0]:s.fam+' dye')+': in the solvent '+Math.round(s.rf*100)+'% of the time'),useLong=longs.every(l=>ctx.measureText(l).width<250);
  const ABB={caf:'Caf',asp:'Asp',acet:'Acet',X:'X'};pick.forEach((s,i)=>{let L=useLong?longs[i]:(tl?s.name.split(' ')[0]:s.fam+' dye')+' · '+Math.round(s.rf*100)+'% moving';if(ctx.measureText(L).width>250)L=(tl?ABB[s.key]:s.fam)+' · '+Math.round(s.rf*100)+'% moving';
    ctx.fillStyle=s.col;ctx.strokeStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.arc(530,ly-4,6,0,6.29);ctx.fill();ctx.stroke();txt(ctx,L,542,ly,{s:12*k,w:600,c:PAL['cv-ink']});ly+=19*Math.min(k,1.35);});
  if(!moving)txt(ctx,st.done?'Run over: nothing is moving now':'Dry paper: nothing moves yet',ZX,ly+2,{s:12*k,c:PAL['cv-soft'],a:'center'});
  else if(atLeast('honors')){const sp=pick[0],m=measured(sp,g.F);if(ly+4<396)txt(ctx,'Rf = '+m.dm.toFixed(1)+(k>1.4?' ÷ ':' cm ÷ ')+m.Fm.toFixed(1)+(k>1.4?' = ':' cm = ')+m.rf.toFixed(2),ZX,ly+4,{s:13*k,w:700,a:'center',c:PAL['cv-ink']});}}

CHROM.onLevel=syncMode;
BioLab.register(CHROM);
})();

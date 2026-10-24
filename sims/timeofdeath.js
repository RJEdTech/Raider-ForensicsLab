(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor,lvText}=BioLab.h;
const TAU=Math.PI*2,T0=37.2,HMAX=48;

/* ---------- body cooling (Henssge 1988) ----------
   (Tr − Ta)/(37.2 − Ta) = A·e^(Bt) − (A − 1)·e^(AB t/(A−1)),  B = −1.2815·(cf·m)^−0.625 + 0.0284 per hour,
   A = 1.25 for air ≤ 23 °C and 1.11 above. The same curve is the exact solution of a two-step chain:
   skin → air at rate r1 = −B, core → skin at rate r2 = r1·A/(A−1), both starting at 37.2 °C. Integrating the chain
   lets the air temperature change partway through. */
const CLOTH={none:{l:'Unclothed',cf:1.0},light:{l:'Light clothing',cf:1.1},heavy:{l:'Heavy clothing',cf:1.4},blanket:{l:'Under a thick blanket',cf:1.8}};
const Bof=(m,cf)=>-1.2815*Math.pow(cf*m,-0.625)+0.0284;
const Aof=Ta=>Ta<=23?1.25:1.11;
function rates(p,Ta){const r1=-Bof(p.mass,CLOTH[p.cloth].cf),A=Aof(Ta);return {r1,r2:r1*A/(A-1),A};}
function henssgeQ(t,A,B){return A*Math.exp(B*t)-(A-1)*Math.exp(A*B*t/(A-1));}
function henssgeT(t,Ta,m,cf){const A=Aof(Ta),B=Bof(m,cf);return Ta+(T0-Ta)*henssgeQ(t,A,B);}
function henssgeInv(T,Ta,m,cf){const q=(T-Ta)/(T0-Ta);if(q>=1)return 0;if(q<=0.02)return NaN;const A=Aof(Ta),B=Bof(m,cf);let a=0,b=200;
  for(let i=0;i<60;i++){const c=(a+b)/2;if(henssgeQ(c,A,B)>q)a=c;else b=c;}return (a+b)/2;}
const toF=c=>c*9/5+32;
const glaister=T=>(98.6-toF(T))/1.5;
function newtonEst(T,Ta,m,cf){const q=(T-Ta)/(T0-Ta);if(q>=1)return 0;if(q<=0.02)return NaN;return Math.log(1/q)/(-Bof(m,cf));}
function advanceBody(st,p,dh){const Ta=p.ta,{r1,r2}=rates(p,Ta);let left=dh;while(left>1e-9){const h=Math.min(0.05,left);
  const Ts=Ta+(st.Ts-Ta)*Math.exp(-r1*h);st.Tc=st.Tc+(-r2*(st.Tc-(st.Ts+Ts)/2))*h;st.Ts=Ts;left-=h;st.h+=h;}}

/* ---------- rigor and livor (classroom timeline at 20 °C; rigor scales with temperature) ---------- */
const rigF=Ta=>clamp(Math.pow(2,(20-Ta)/10),0.5,2.5);
function rigor(h,Ta){const f=rigF(Ta),T=[2,12,24,36].map(x=>x*f);
  return h<T[0]?{i:0,l:'Not yet: body limp',r:[0,T[0]]}:h<T[1]?{i:1,l:'Developing: small muscles first',r:[T[0],T[1]]}:h<T[2]?{i:2,l:'Full: whole body stiff',r:[T[1],T[2]]}:h<T[3]?{i:3,l:'Passing: stiffness fading',r:[T[2],T[3]]}:{i:4,l:'Gone: body limp again',r:[T[3],Infinity]};}
function livor(h){return h<0.5?{i:0,l:'Not visible yet',r:[0,0.5]}:h<2?{i:1,l:'Appearing',r:[0.5,2]}:h<10?{i:2,l:'Visible, not yet fixed',r:[2,10]}:{i:3,l:'Fixed: does not shift',r:[8,Infinity]};}

/* ---------- blow fly development (Lucilia sericata, base 10 °C; ADH rounded from published studies) ---------- */
const TB=10;
const STAGES=[{id:'egg',l:'Eggs',a:0,b:270},{id:'l1',l:'1st instar larva',a:270,b:570},{id:'l2',l:'2nd instar larva',a:570,b:870},{id:'l3',l:'3rd instar (feeding)',a:870,b:1470},{id:'pf',l:'Post-feeding (wandering)',a:1470,b:2670},{id:'pupa',l:'Pupa',a:2670,b:4770}];
const ADULT=4770;
const tempAt=(p,h)=>p.ta+(p.swing||0)*Math.sin(TAU*h/24-Math.PI/2);
function dayADH(p){let a=0;for(let i=0;i<240;i++)a+=Math.max(0,tempAt(p,(i+0.5)*0.1)-TB)*0.1;return a;}
function adhAt(p,h){if(!p.swing)return Math.max(0,p.ta-TB)*h;const n=Math.floor(h/24);let a=n*dayADH(p);for(let t=n*24;t<h;t+=0.1)a+=Math.max(0,tempAt(p,t+0.05)-TB)*Math.min(0.1,h-t);return a;}
function hoursFor(p,adh){if(adh<=0)return 0;if(!p.swing){const r=Math.max(0,p.ta-TB);return r>0?adh/r:Infinity;}
  const D=dayADH(p);if(D<=0)return Infinity;const n=Math.floor(adh/D);let rem=adh-n*D,t=n*24;if(rem<=1e-9)return t;
  for(let i=0;i<240;i++){const da=Math.max(0,tempAt(p,t+0.05)-TB)*0.1;if(da>=rem)return t+0.1*rem/da;rem-=da;t+=0.1;}return t;}
const stageOf=adh=>adh>=ADULT?6:STAGES.findIndex(s=>adh<s.b);

/* ---------- cases: clues generated from the same models ---------- */
const CASES={c1:{l:'Case 1: apartment bedroom',place:'Indoors, windows closed',ta:20,m:75,cloth:'light',pmi:9,bugs:false},
  c2:{l:'Case 2: city park',place:'Outdoors in early summer',ta:22,m:65,cloth:'light',pmi:30,bugs:true},
  c3:{l:'Case 3: field in summer',place:'Outdoors, warm days',ta:25,m:80,cloth:'light',pmi:100,bugs:true}};
function clues(key){const c=CASES[key],cf=CLOTH[c.cloth].cf,T=henssgeT(c.pmi,c.ta,c.m,cf),rg=rigor(c.pmi,c.ta),lv=livor(c.pmi);
  const out={c,T,rows:[]};const near=T-c.ta<1;
  const ht=near?[henssgeInv(c.ta+1,c.ta,c.m,cf),Infinity]:(()=>{const e=henssgeInv(T,c.ta,c.m,cf);return [Math.max(0,e-2.8),e+2.8];})();
  out.rows.push({id:'temp',l:'Body temperature',r:ht,note:near?'at air temperature: at least '+Math.round(ht[0])+' h':'cooling curve ±2.8 h'});
  out.rows.push({id:'rigor',l:'Rigor mortis',r:rg.r,note:rg.l.split(':')[0]});
  out.rows.push({id:'livor',l:'Livor mortis',r:lv.r,note:lv.l.split(':')[0]});
  let st=null;if(c.bugs){const adh=c.pmi*(c.ta-TB);st=STAGES[Math.min(5,stageOf(adh))];out.rows.push({id:'bugs',l:'Insects',r:[st.a/(c.ta-TB),st.b/(c.ta-TB)],note:'oldest: '+st.l.toLowerCase()});}
  else out.rows.push({id:'bugs',l:'Insects',r:null,note:'none found (indoors)'});
  out.stage=st;let lo=0,hi=Infinity;out.rows.forEach(r=>{if(!r.r)return;lo=Math.max(lo,r.r[0]);hi=Math.min(hi,r.r[1]);});out.comb=[lo,hi];out.gl=glaister(T);return out;}
function bestClue(key){const c=CASES[key];return c.pmi<20?'body temperature':c.pmi<40?'temperature, rigor and insects together':'insects';}

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.view,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function jumpToTemp(sim,T){const st=sim.st;st.h=0;st.Tc=T0;st.Ts=T0;st.trace=[[0,T0]];let g=0;while(st.Tc>T&&st.h<HMAX&&g<5000){advanceBody(st,sim.p,0.02);g++;if(st.h-st.trace[st.trace.length-1][0]>=0.25)st.trace.push([st.h,st.Tc]);}st.hold=true;}
const fmtH=h=>!Number.isFinite(h)?'—':h<10?h.toFixed(1)+' h':Math.round(h)+' h';
const fmtRange=r=>r[1]===Infinity?'more than '+fmtH(r[0]):fmtH(r[0])+' – '+fmtH(r[1]);
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBox(ctx,b,lines,k){const rows=[];let need=10;for(const L of lines){const sz=L.s*k;for(const w of wrapLines(ctx,L.t,b.w-24,sz,L.w)){rows.push([w,sz,L]);need+=sz*1.3;}}
  const h=Math.max(b.h,need);rr(ctx,b.x,b.y,b.w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=b.y+6;for(const [w,sz,L] of rows){y+=sz*1.3;txt(ctx,w,b.x+12,y-sz*0.3,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink']});}}

const TOD={
  id:'timeofdeath',hash:'timeofdeath',apUnit:9,order:4,tab:'Time of death',kind:'Simulation',prereq:['calorimetry'],next:['halflife'],
  card:'Read a cooling body temperature, rigor, livor and the age of blow fly larvae, then combine the clues to estimate the time since death.',
  title:'Time of death: cooling, rigor and the insect clock',
  lede:{bio:'After death the body cools toward the air temperature, the muscles stiffen and relax, and insects arrive and grow on a schedule. Each clue gives a time range. Combine them.',
        honors:'Newton’s law of cooling explains why the body cools fast at first and slower near air temperature. Clothing and body mass change the rate, and insect growth depends on temperature.',
        ap:'Use Henssge’s double-exponential cooling model (with the early plateau) and accumulated degree hours, including day–night swings, to estimate the post-mortem interval.'},
  scale:{bio:'A whole adult body, about 70 kg, in still air. Blow fly eggs are about 1.5 mm long; a full-grown larva is about 15 mm.',ap:'A 70 kg adult in still air; rectal temperature starts at 37.2 °C. Blow fly (Lucilia sericata) eggs about 1.5 mm, third-instar larvae up to about 15 mm; development counted above a 10 °C base.'},
  timeless:true,animated:true,chChange:1,chReveal:6,
  controls:[
    {id:'view',label:'Clue',type:'seg',def:'cool',lvl:'bio',noTrial:true,options:[{v:'cool',l:'Body cooling'},{v:'insects',l:'Insect clock'},{v:'case',l:'Solve a case'}]},
    {id:'ta',label:'Air temperature',type:'range',min:0,max:35,step:1,def:20,unit:' °C',lvl:'bio',modes:['cool','insects']},
    {id:'cloth',label:'Covering',type:'seg',def:'none',lvl:'honors',modes:['cool'],options:Object.keys(CLOTH).map(k=>({v:k,l:CLOTH[k].l})),help:'Henssge’s corrective factor: unclothed 1.0, light 1.1, heavy 1.4, thick blanket 1.8.'},
    {id:'mass',label:'Body mass',type:'range',min:40,max:120,step:5,def:70,unit:' kg',lvl:'honors',modes:['cool']},
    {id:'found',label:'Oldest insect stage found',type:'select',def:'l3',lvl:'bio',noTrial:true,modes:['insects'],options:STAGES.map(s=>({v:s.id,l:s.l}))},
    {id:'swing',label:'Day–night swing (±)',type:'range',min:0,max:10,step:1,def:0,unit:' °C',lvl:'ap',modes:['insects'],help:'Air temperature rises and falls around the average each day.'},
    {id:'cs',label:'Case',type:'select',def:'c1',lvl:'bio',noTrial:true,modes:['case'],options:Object.keys(CASES).map(k=>({v:k,l:CASES[k].l}))}
  ],
  actions:[{id:'restart',label:'Restart the clock',lvl:'bio',primary:true,modes:['cool','insects'],run(sim){const st=sim.st;st.h=0;st.Tc=T0;st.Ts=T0;st.trace=[[0,T0]];st.ih=0;st.hold=false;}},
    {id:'reveal',label:'Reveal the true time',lvl:'bio',modes:['case'],run(sim){sim.st.reveal=!sim.st.reveal;}}],
  init(){return {h:0,Tc:T0,Ts:T0,trace:[[0,T0]],ih:0,hold:false,reveal:false};},
  step(sim,dt){const st=sim.st,p=sim.p;if(st.hold)return;
    if(p.view==='cool'&&st.h<HMAX){advanceBody(st,p,Math.min(dt*2,HMAX-st.h));const last=st.trace[st.trace.length-1];if(st.h-last[0]>=0.2)st.trace.push([st.h,st.Tc]);}
    if(p.view==='insects'){const end=hoursFor(p,ADULT);if(st.ih<end)st.ih=Math.min(end,st.ih+dt*12);}},
  metrics:[
    {id:'tc',label:'Rectal temperature',unit:'°C',lvl:'bio',min:0,max:40,d:1,modes:['cool'],get:s=>s.st.Tc},
    {id:'tf',label:'Rectal temperature',unit:'°F',lvl:'bio',min:32,max:100,d:1,modes:['cool'],get:s=>toF(s.st.Tc)},
    {id:'h',label:'True time since death',unit:'h',lvl:'bio',min:0,max:48,d:1,modes:['cool'],get:s=>s.st.h},
    {id:'gl',label:'Glaister estimate (98.6 °F − T) ÷ 1.5',unit:'h',lvl:'bio',min:0,max:48,d:1,modes:['cool'],get:s=>Math.max(0,glaister(s.st.Tc))},
    {id:'nw',label:'Newton’s law estimate',unit:'h',lvl:'honors',min:0,max:48,d:1,modes:['cool'],get:s=>newtonEst(s.st.Tc,s.p.ta,s.p.mass,CLOTH[s.p.cloth].cf)},
    {id:'hs',label:'Henssge estimate (±2.8 h)',unit:'h',lvl:'ap',min:0,max:48,d:1,modes:['cool'],get:s=>henssgeInv(s.st.Tc,s.p.ta,s.p.mass,CLOTH[s.p.cloth].cf)},
    {id:'rig',label:'Rigor mortis',unit:'',lvl:'bio',text:true,modes:['cool'],get:s=>rigor(s.st.h,s.p.ta).l},
    {id:'liv',label:'Livor mortis',unit:'',lvl:'bio',text:true,modes:['cool'],get:s=>livor(s.st.h).l},
    {id:'stage',label:'Insects now',unit:'',lvl:'bio',text:true,modes:['insects'],get:s=>{const i=stageOf(adhAt(s.p,s.st.ih));return i>=6?'Adult flies emerged':STAGES[i].l;}},
    {id:'ih',label:'Hours since eggs were laid',unit:'h',lvl:'bio',min:0,max:null,d:0,modes:['insects'],get:s=>s.st.ih},
    {id:'adh',label:'Accumulated degree hours',unit:'°C·h',lvl:'honors',min:0,max:null,d:0,modes:['insects'],get:s=>adhAt(s.p,s.st.ih)},
    {id:'pmi',label:'Found stage means eggs laid',unit:'',lvl:'bio',text:true,modes:['insects'],get:s=>{const st=STAGES.find(x=>x.id===s.p.found);if(s.p.ta<=TB&&!(s.p.swing>0))return 'no growth at or below 10 °C';return fmtRange([hoursFor(s.p,st.a),hoursFor(s.p,st.b)])+' ago';}},
    {id:'est',label:'All clues agree on',unit:'',lvl:'bio',text:true,modes:['case'],get:s=>{const c=clues(s.p.cs);return c.comb[0]<c.comb[1]?fmtRange(c.comb)+' since death':'no overlap';}},
    {id:'best',label:'Most useful clue here',unit:'',lvl:'bio',text:true,modes:['case'],get:s=>bestClue(s.p.cs)},
    {id:'truth',label:'True time since death',unit:'',lvl:'bio',text:true,modes:['case'],get:s=>s.st.reveal?CASES[s.p.cs].pmi+' h':'press Reveal'}
  ],
  graphs:[{id:'cool',label:'Cooling curves compared',lvl:'bio',custom:true},{id:'adh',label:'Degree hours piling up',lvl:'honors',custom:true}],
  defaultGraph:'cool',
  plot(sim,ctx,box,id){const p=sim.p;
    if(id==='cool'){const b={x:box.L,y:box.T+22,w:box.W,h:box.H-22};drawCoolChart(ctx,sim,b,1,true);return;}
    const H=Math.max(48,hoursFor(p,ADULT)*1.05),ymax=ADULT*1.08,b={x:box.L,y:box.T+8,w:box.W,h:box.H-8},X=h=>b.x+h/H*b.w,Y=a=>b.y+b.h-a/ymax*b.h;
    ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let a=0;a<=ymax;a+=1000){const y=Math.round(Y(a))+.5;ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke();txt(ctx,String(a),b.x-8,y,{s:12,c:PAL['g-axis'],a:'right',b:'middle'});}
    const hs=H>400?100:H>150?50:24;for(let h=0;h<=H;h+=hs){const x=Math.round(X(h))+.5;ctx.beginPath();ctx.moveTo(x,b.y);ctx.lineTo(x,b.y+b.h);ctx.stroke();txt(ctx,h+' h',x,b.y+b.h+16,{s:12,c:PAL['g-axis'],a:'center'});}
    STAGES.forEach((s,i)=>{const y=Y(s.b);ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['muted'];ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke();ctx.setLineDash([]);if(i>=2)txt(ctx,'end of '+s.l.split(' (')[0].toLowerCase(),b.x+b.w-4,y-4,{s:12,c:PAL['muted'],a:'right'});});
    ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();let a=0;ctx.moveTo(X(0),Y(0));for(let h=0;h<=H;h+=0.5){a+=Math.max(0,tempAt(p,h+0.25)-TB)*0.5;ctx.lineTo(X(h+0.5),Y(Math.min(a,ymax)));}ctx.stroke();
    ctx.fillStyle=serColor(0);ctx.beginPath();ctx.arc(X(sim.st.ih),Y(adhAt(p,sim.st.ih)),5,0,TAU);ctx.fill();
    ctx.save();ctx.translate(14,b.y+b.h/2);ctx.rotate(-Math.PI/2);txt(ctx,'degree hours above 10 °C',0,0,{s:13,c:PAL['muted'],a:'center',b:'middle'});ctx.restore();},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.view==='case'){const c=clues(p.cs),C=c.c;return `<h3>${C.l}</h3><div class="tbl-wrap"><table><thead><tr><th>Clue</th><th>Observation</th><th>Time range</th></tr></thead><tbody>${c.rows.map(r=>`<tr><td>${r.l}</td><td>${r.id==='temp'?c.T.toFixed(1)+' °C (air '+C.ta+' °C)':r.note}</td><td>${r.r?fmtRange(r.r):'no limit'}</td></tr>`).join('')}</tbody></table></div><p class="help">Glaister’s rule on its own gives ${fmtH(Math.max(0,c.gl))}. ${C.pmi>18?'It assumes steady cooling, so it fails once the body nears air temperature.':'It ignores clothing, body size and the early plateau.'}</p>`;}
    if(p.view==='insects'){const T=p.ta;return `<h3>Blow fly development at ${T} °C${p.swing?' ± '+p.swing+' °C':''}</h3><div class="tbl-wrap"><table><thead><tr><th>Stage</th><th>Degree hours</th><th>Hours from egg laying</th></tr></thead><tbody>${STAGES.map(s=>`<tr><td>${s.l}</td><td>${s.a}–${s.b}</td><td>${T<=TB&&!p.swing?'no growth':fmtRange([hoursFor(p,s.a),hoursFor(p,s.b)])}</td></tr>`).join('')}</tbody></table></div><p class="help">Flies usually lay eggs within hours of death outdoors in warm weather, so the age of the oldest insects is a minimum time since death.${hon?' Below about 10 °C the larvae stop developing, and flies rarely lay eggs at night.':''}</p>`;}
    const cf=CLOTH[p.cloth].cf,A=Aof(p.ta),B=Bof(p.mass,cf);
    return `<h3>Cooling of this body</h3><p>Air ${p.ta} °C, ${p.mass} kg, ${CLOTH[p.cloth].l.toLowerCase()} (factor ${cf}).</p>${hon?`<p class="help">Newton’s law: T − T(air) = (37.2 − T(air))·e^(−kt), with k = ${(-B).toFixed(4)} h⁻¹ for this body.</p>`:''}${ap?`<p class="help">Henssge: (T − T(air))/(37.2 − T(air)) = ${A}·e^(${B.toFixed(4)} t) − ${(A-1).toFixed(2)}·e^(${(A*B/(A-1)).toFixed(4)} t).</p>`:''}<p class="help">Rigor and livor times are typical values at 20 °C. Rigor comes and goes faster when it is warm and slower when it is cold.</p>`;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(p.view==='case'){const c=clues(p.cs),C=c.c;
      if(st.reveal)return 'The true time was <b>'+C.pmi+' hours</b>. '+(C.pmi>=c.comb[0]&&C.pmi<=c.comb[1]?'It falls inside the range where all the clues overlap.':'Check which clue missed.')+' The most useful clue here was '+bestClue(p.cs)+'.';
      return C.pmi<20?'The body is still well above the air temperature, so <b>the cooling curve gives the tightest range</b>. Rigor and livor agree with it.':C.pmi<40?'The body is close to air temperature and rigor is passing. <b>The ranges only narrow when you combine them.</b>':'The body has reached air temperature and rigor is gone, so those clues only set a minimum. <b>The insects are now the best clock.</b>';}
    if(p.view==='insects'){const adh=adhAt(p,st.ih),i=stageOf(adh);
      if(p.ta<=TB&&!(p.swing>0))return 'At '+p.ta+' °C the air is at or below the 10 °C base temperature, so <b>the larvae do not develop at all</b>. Cold slows the insect clock to a stop.';
      return 'At '+p.ta+' °C the insects gain about <b>'+Math.round(Math.max(0,p.ta-TB))+' degree hours every hour</b>'+(p.swing?' on average (more in the warm afternoons)':'')+'. After '+Math.round(st.ih)+' h they are '+(i>=6?'adult flies':['eggs','first-instar larvae','second-instar larvae','third-instar larvae, still feeding','post-feeding larvae, wandering off to pupate','pupae'][i])+'. Warmer air means faster growth.';}
    const T=st.Tc,d=T-p.ta;
    if(st.h<0.2)return 'At death the core is at about <b>37 °C (98.6 °F)</b>. The body now loses heat to the '+p.ta+' °C air.';
    if(d<0.6)return 'The body has reached the air temperature, so <b>it stops cooling</b>. From here, temperature can only say “at least this long”.';
    if(p.ta>=37)return 'The air is as warm as the body, so the body does not cool at all.';
    if(st.h<3&&hon)return 'This is the <b>plateau</b>: heat has to travel from the core to the skin before the rectal temperature drops much.';
    let s='The body is '+d.toFixed(1)+' °C warmer than the air. <b>The bigger that gap, the faster it cools</b>, so the curve gets flatter as it nears '+p.ta+' °C.';
    if(hon&&p.cloth!=='none')s+=' The '+CLOTH[p.cloth].l.toLowerCase().replace('under a ','')+' slows heat loss.';
    return s;},
  tour:[
    {title:'Heat leaves the body',text:'After death the body stops making heat. The rectal (core) temperature starts at about 37 °C (98.6 °F) and heat flows out into the cooler air.',focus:[[14,40,118,300],[128,26,662,296]],pause:true,setup(sim){BioLab.setValues(sim,{view:'cool',ta:20});sim.st.h=0;sim.st.Tc=T0;sim.st.Ts=T0;sim.st.trace=[[0,T0]];sim.st.hold=false;}},
    {title:'The cooling curve',text:{bio:'Watch the temperature fall. It drops fastest when the body is much warmer than the air and slows down as it gets close to air temperature.',honors:'This is Newton’s law of cooling: the rate of heat loss is proportional to the temperature difference, T − T(air).'},focus:[128,26,662,296],speed:1,setup(sim){sim.st.hold=false;}},
    {title:'Glaister’s rule',text:'The classroom shortcut: hours since death ≈ (98.6 °F − rectal temperature) ÷ 1.5. It is the dashed straight line. It works only roughly, and only for the first half day or so.',focus:[128,26,662,296],speed:1},
    {title:'Rigor and livor',text:'Rigor mortis (stiffening) starts in the small muscles after about 2 h, is complete around 12 h and passes after a day or more. Livor mortis (settling of blood) appears within 2 h and becomes fixed after about 8–12 h.',focus:[12,330,776,116],speed:1},
    {title:'The insect clock',text:'Blow flies can lay eggs on a body within hours. The young go through egg, three larval stages, a wandering stage and a pupa. The oldest stage found tells how long insects have been there.',focus:[12,30,776,300],speed:1,setup(sim){BioLab.setValues(sim,{view:'insects',ta:25});sim.st.ih=0;sim.st.hold=false;}},
    {title:'Warmer means faster',text:'Insects are cold-blooded, so they develop by accumulated degree hours (ADH): each hour adds (air temperature − 10 °C). At 30 °C they grow twice as fast as at 20 °C.',focus:[12,330,776,116],speed:1,setup(sim){BioLab.setValues(sim,{ta:30});}},
    {title:'Combine the clues',text:'Each clue gives a range of possible times. The answer has to fit all of them, so the overlap (shaded) is the best estimate.',focus:[300,30,488,330],pause:true,setup(sim){BioLab.setValues(sim,{view:'case',cs:'c2'});sim.st.reveal=false;}},
    {lvl:'ap',title:'Henssge’s model',text:'Real cooling has a plateau for the first few hours because heat must first flow from the core to the skin. Henssge’s equation includes it, plus body mass and clothing, and gives a 95% range of about ±2.8 h.',focus:[128,26,662,296],speed:1,setup(sim){BioLab.setValues(sim,{view:'cool',ta:15});sim.st.h=0;sim.st.Tc=T0;sim.st.Ts=T0;sim.st.trace=[[0,T0]];sim.st.hold=false;}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);BioLab.reset(sim);syncMode(sim);},
  onChallenge(sim,ch,phase){if(phase==='ask'&&sim.st)sim.st.hold=false;if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.jumpT!==undefined)jumpToTemp(sim,ch.jumpT);if(ch.reveal)sim.st.reveal=true;syncMode(sim);BioLab.refresh(sim);}},
  challenges:[
    {lvl:'bio',q:'A body is cooling in a 20 °C room. Someone opens the windows and the air drops to 5 °C. What happens to the cooling?',choices:['It cools more slowly','It cools at the same rate','It cools faster'],correct:2,
     baseline:{view:'cool',ta:20},change:{ta:5},changeText:'Air temperature dropped to 5 °C',watch:'cool',
     explain:{bio:'Heat flows faster when the temperature difference is bigger. With 5 °C air the gap between body and air is larger, so the curve bends down more steeply.'}},
    {lvl:'bio',instant:true,set:{view:'cool',ta:20,mass:70,cloth:'none'},jumpT:(92.6-32)*5/9,q:'A rectal temperature reads 92.6 °F. Using the Glaister rule, (98.6 °F − reading) ÷ 1.5, about how many hours since death?',choices:['2 hours','4 hours','6 hours'],correct:1,
     explain:{bio:'(98.6 − 92.6) ÷ 1.5 = 6 ÷ 1.5 = 4 hours. The model is now paused at that reading, and its true time is about 6.7 hours. Glaister’s rule is quick, but it ignores clothing, body size and the slow start, so treat it as a rough first guess.'}},
    {lvl:'bio',q:'Blow fly larvae are growing at 15 °C. The weather warms to 25 °C. How fast do they develop now?',choices:['The same: insects follow a fixed calendar','About 1.7× faster (25 ÷ 15)','About 3× faster'],correct:2,
     baseline:{view:'insects',ta:15,swing:0},change:{ta:25},changeText:'Air warmed to 25 °C',
     explain:{bio:'Growth depends on the degrees above 10 °C, where development stops. At 15 °C that is 5 degree hours per hour; at 25 °C it is 15. So the larvae develop 3× faster. Watch the “Hours since eggs were laid” and the stage change.'}},
    {lvl:'bio',instant:true,set:{view:'case',cs:'c3'},q:'A body has lain in a warm field for about four days. Which clue tells you the most about the time since death?',choices:['Body temperature','Rigor mortis','The age of the blow fly larvae'],correct:2,
     explain:{bio:'The model now shows Case 3. The body has cooled to air temperature and rigor has come and gone, so those clues only say “more than a day or so”. The insects keep developing for days, so they give the best range.'}},
    {lvl:'honors',q:'As the body temperature gets close to the air temperature, the rate of cooling…',choices:['speeds up','slows down','stays the same'],correct:1,
     baseline:{view:'cool',ta:20},changeText:'Watch the curve flatten',at:1,reveal:9,watch:'cool',
     explain:{honors:'Newton’s law: the cooling rate is proportional to T − T(air). As that difference shrinks, so does the rate, and the curve levels off toward the air temperature. This is why linear rules like Glaister’s fail later on.'}},
    {lvl:'honors',q:'The same body is covered with a thick blanket. How does that change its cooling?',choices:['It cools faster','It cools more slowly','No change: the blanket is not warm'],correct:1,
     baseline:{view:'cool',ta:20,cloth:'none'},change:{cloth:'blanket'},at:1.5,changeText:'Covered with a thick blanket',watch:'cool',
     explain:{honors:'The blanket traps air and slows heat loss (Henssge’s corrective factor goes from 1.0 to 1.8). If you forgot about it, the temperature would make the death seem more recent than it was.'}},
    {lvl:'honors',instant:true,set:{view:'case',cs:'c3'},q:'In Case 3 the body is at the air temperature. What can body temperature tell you?',choices:['Exactly when death happened','Only that death was at least about a day or more ago','Nothing at all'],correct:1,
     explain:{honors:'Once the body matches the air, it has stopped cooling. The cooling curve then only gives a minimum time: the board shows “more than” for temperature. Other clues have to set the upper limit.'}},
    {lvl:'ap',q:'Newton’s law predicts the fastest drop right at the start. What does the core temperature actually do in the first 2–3 hours?',choices:['It falls fastest right away','It stays nearly flat (the plateau), then starts to fall','It rises'],correct:1,
     baseline:{view:'cool',ta:15},changeText:'Watch the first three hours',at:0.1,reveal:2,watch:'cool',
     explain:{ap:'Heat has to travel from the core to the skin before the core cools, so the rectal temperature stays near 37 °C at first. Henssge’s two-exponential model (A = 1.25) captures this: dT/dt = 0 at t = 0.'}},
    {lvl:'ap',q:'At an average of 15 °C, what happens to larval development if the air swings ±10 °C each day instead of staying constant?',choices:['No change: the swings average out','It speeds up','It slows down'],correct:1,
     baseline:{view:'insects',ta:15,swing:0},change:{swing:10},changeText:'Day–night swing of ±10 °C added',
     explain:{ap:'Development only counts degrees above 10 °C. Cold nights below 10 °C cost nothing extra (growth just stops), but warm afternoons add a lot, so the daily total rises from 120 to about 146 degree hours, about 22% faster. ADH must be integrated hour by hour.'}},
    {lvl:'ap',instant:true,set:{view:'cool',ta:15,mass:70,cloth:'none'},jumpT:30,q:'Rectal temperature 30.0 °C, air 15 °C, 70 kg, unclothed. About what time since death does Henssge’s equation give?',choices:['About 5 h','About 10 h','About 18 h'],correct:1,
     explain:{ap:'Q = (30.0 − 15)/(37.2 − 15) = 0.676. With B = −1.2815·70^(−0.625) + 0.0284 = −0.0617 h⁻¹, solving 1.25e^(Bt) − 0.25e^(5Bt) = 0.676 gives t ≈ 9.7 h. The Henssge readout shows it. Glaister would say 8.4 h.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does air temperature change how fast a body cools?</p><ol><li>Use Body cooling. Set the air to 5 °C, press Restart the clock, and record a trial at 4, 8 and 12 hours (pause the clock to record).</li><li>Repeat with air at 20 °C and 30 °C.</li><li>Compare the Glaister estimate with the true time for each trial.</li></ol><p>When does Glaister’s rule work best, and when does it fail?</p>',
       honors:'<p><b>Question:</b> Which factors change the cooling rate, and by how much?</p><ol><li>At 20 °C, record the rectal temperature after 10 h for body masses 50, 70, 90 and 110 kg.</li><li>Repeat for each covering.</li><li>Use the Insect clock to find how long each larval stage lasts at 15, 20, 25 and 30 °C.</li></ol><p>Explain each trend with Newton’s law of cooling or with degree hours.</p>',
       ap:'<p><b>Question:</b> How precise is a time-of-death estimate?</p><ol><li>Record the true time and the Glaister, Newton and Henssge estimates every 4 h for 24 h at 15 °C.</li><li>Plot each estimate against the true time.</li><li>Solve all three cases and record the overlap of the clue ranges.</li></ol><p><b>Claim–evidence–reasoning:</b> Which method is most accurate in the first 12 h, which after 24 h, and why does combining independent clues narrow the estimate?</p>'},
  terms:[{t:'Post-mortem interval (PMI)',d:'The time since death.'},{t:'Algor mortis',d:'The cooling of the body after death.'},{t:'Rigor mortis',d:'Temporary stiffening of the muscles after death.'},{t:'Livor mortis',d:'Settling of blood to the lowest parts of the body, which becomes fixed after several hours.'},{t:'Glaister rule',d:'Hours since death ≈ (98.6 °F − rectal temperature) ÷ 1.5.'},{t:'Instar',d:'A larval stage between molts.'},
    {lvl:'honors',t:'Newton’s law of cooling',d:'The rate of cooling is proportional to the difference between the body and air temperatures.'},{lvl:'honors',t:'Accumulated degree hours (ADH)',d:'The sum over time of (air temperature − base temperature), which sets insect development.'},{lvl:'honors',t:'Base temperature',d:'The temperature below which an insect stops developing (about 10 °C for this blow fly).'},
    {lvl:'ap',t:'Temperature plateau',d:'The first few hours when the core temperature hardly drops, because heat must first reach the skin.'},{lvl:'ap',t:'Henssge nomogram',d:'A chart (and equation) that estimates PMI from rectal and air temperatures, body mass and a clothing factor.'}],
  about:'<p><b>Cooling.</b> The rectal temperature follows Henssge’s model, (T − T(air))/(37.2 − T(air)) = A·e^(Bt) − (A − 1)·e^(ABt/(A−1)), with B = −1.2815·(cf·m)^(−0.625) + 0.0284 h⁻¹ and A = 1.25 (1.11 above 23 °C). It is integrated as a skin-to-air and core-to-skin chain, which gives exactly this curve when the air stays constant and still works when you change the air partway through. Clothing factors are typical Henssge values. Real estimates also correct for wind, wet clothing and what the body lies on.</p><p><b>Rigor and livor.</b> Classroom timelines (rigor about 2, 12, 24 and 36 h; livor 0.5–2 h, fixed by about 8–12 h). Rigor times are scaled by 2^((20 − T)/10) for temperature. Real timing varies widely between people.</p><p><b>Insects.</b> Development thresholds for the green bottle fly Lucilia sericata are rounded from published studies, base 10 °C. Degree hours are integrated over the daily temperature cycle. The estimate assumes flies laid eggs soon after death, so it is a minimum interval.</p><p>Cases are fictional and generated from these same models. Everything is shown as diagrams and readings.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const key=BioLab.level+p.view;if(sim._sk!==key){sim._sk=key;syncMode(sim);}
    if(p.view==='insects')drawInsects(sim,ctx,k,t);else if(p.view==='case')drawCase(sim,ctx,k);else drawCool(sim,ctx,k,t);},
  thumbSetup(sim){for(let i=0;i<40;i++){advanceBody(sim.st,sim.p,0.25);sim.st.trace.push([sim.st.h,sim.st.Tc]);}}
};

/* ---------- cooling view ---------- */
function drawCoolChart(ctx,sim,b,k,panel){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');const ymin=Math.min(0,p.ta-2),ymax=40;
  const X=h=>b.x+h/HMAX*b.w,Y=T=>b.y+b.h-(T-ymin)/(ymax-ymin)*b.h;
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let T=Math.ceil(ymin/10)*10;T<=ymax;T+=10){const y=Math.round(Y(T))+.5;ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke();txt(ctx,T+' °C',b.x-6,y,{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});}
  for(let h=0;h<=HMAX;h+=(k>1.35?12:6)){const x=Math.round(X(h))+.5;ctx.beginPath();ctx.moveTo(x,b.y);ctx.lineTo(x,b.y+b.h);ctx.stroke();txt(ctx,h+' h',x,b.y+b.h+15*k,{s:12*k,c:PAL['g-axis'],a:'center'});}
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(b.x+.5,b.y);ctx.lineTo(b.x+.5,b.y+b.h);ctx.lineTo(b.x+b.w,b.y+b.h+.5);ctx.stroke();
  ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();
  ctx.strokeStyle=PAL['s6'];ctx.lineWidth=2;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(b.x,Y(p.ta));ctx.lineTo(b.x+b.w,Y(p.ta));ctx.stroke();
  // Glaister straight line (1.5 °F per hour)
  ctx.strokeStyle=PAL['s4'];ctx.setLineDash([7,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(0),Y(37));const hg=Math.max(0,(37-p.ta)/(1.5*5/9));ctx.lineTo(X(Math.min(HMAX,hg)),Y(37-Math.min(HMAX,hg)*1.5*5/9));if(hg<HMAX)ctx.lineTo(X(HMAX),Y(p.ta));ctx.stroke();
  if(hon){const kN=-Bof(p.mass,CLOTH[p.cloth].cf);ctx.strokeStyle=PAL['s5'];ctx.setLineDash([2,3]);ctx.beginPath();for(let h=0;h<=HMAX;h+=0.25){const y=Y(p.ta+(T0-p.ta)*Math.exp(-kN*h));h?ctx.lineTo(X(h),y):ctx.moveTo(X(h),y);}ctx.stroke();}
  ctx.setLineDash([]);
  // future of the model curve from the current state (faint), then the measured trace
  const f={h:st.h,Tc:st.Tc,Ts:st.Ts};ctx.strokeStyle=PAL['s1'];ctx.globalAlpha=0.28;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X(f.h),Y(f.Tc));while(f.h<HMAX){advanceBody(f,p,0.5);ctx.lineTo(X(f.h),Y(f.Tc));}ctx.stroke();ctx.globalAlpha=1;
  ctx.lineWidth=3.2;ctx.beginPath();st.trace.forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));ctx.lineTo(X(st.h),Y(st.Tc));ctx.stroke();
  ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(X(st.h),Y(st.Tc),6,0,TAU);ctx.fill();ctx.restore();
  const items=[{label:'body (model)',color:PAL['s1']},{label:'Glaister rule',color:PAL['s4'],dash:true}];if(hon)items.push({label:'Newton’s law',color:PAL['s5'],dash:true});items.push({label:'air',color:PAL['s6'],dash:true});
  if(panel)legend(ctx,b.x+6,b.y-12,items);else{ctx.font='400 '+(12*k)+'px '+FONT;const rowsN=(()=>{let x=0,n=1;items.forEach(it=>{const w=ctx.measureText(it.label).width+30*k;if(x+w>b.w+20){x=0;n++;}x+=w;});return n;})();let x=b.x+4,y=b.y-12-(rowsN-1)*16*k;items.forEach(it=>{const w=ctx.measureText(it.label).width+30*k;if(x+w>b.x+b.w+20){x=b.x+4;y+=16*k;}
    ctx.strokeStyle=it.color;ctx.lineWidth=3;ctx.setLineDash(it.dash?[5,4]:[]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+16,y);ctx.stroke();ctx.setLineDash([]);txt(ctx,it.label,x+21,y,{s:12*k,c:PAL['cv-soft'],b:'middle'});x+=w;});}}
function thermo(ctx,x,y,h,T,Ta,k){const tmin=0,tmax=40,Y=v=>y+h-(v-tmin)/(tmax-tmin)*h;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,x-10,y-8,20,h+16,10);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x,y+h+22,17,0,TAU);ctx.fillStyle=PAL['s1'];ctx.fill();ctx.fillStyle=PAL['s1'];ctx.fillRect(x-5,Y(clamp(T,tmin,tmax)),10,y+h+10-Y(clamp(T,tmin,tmax)));
  for(let v=0;v<=40;v+=10){const yy=Y(v);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+10,yy);ctx.lineTo(x+18,yy);ctx.stroke();txt(ctx,String(v),x+22,yy,{s:12*k,c:PAL['cv-soft'],b:'middle'});}
  const ya=Y(clamp(Ta,tmin,tmax));ctx.strokeStyle=PAL['s6'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-18,ya);ctx.lineTo(x-10,ya);ctx.stroke();}
function drawCool(sim,ctx,k,t){const p=sim.p,st=sim.st,phn=k>1.35;
  thermo(ctx,58,52,212,st.Tc,p.ta,k);
  txt(ctx,st.Tc.toFixed(1)+' °C',58,330,{s:15*k,w:700,a:'center'});
  if(!phn)txt(ctx,toF(st.Tc).toFixed(1)+' °F',58,348,{s:12*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,'rectal',58,34,{s:12*k,c:PAL['cv-soft'],a:'center'});
  const b={x:phn?190:178,y:phn?96:54,w:phn?596:604,h:phn?162:214};drawCoolChart(ctx,sim,b,k,false);
  txt(ctx,fmtH(st.h)+' since death',b.x+b.w,b.y+b.h-8,{s:14*k,w:700,a:'right'});
  // rigor and livor timeline
  const tl={x:b.x,w:b.w,y:phn?318:316};const X=h=>tl.x+h/HMAX*tl.w;const f=rigF(p.ta);
  const rows=[{l:'Rigor',segs:[[0,2*f,'limp'],[2*f,12*f,'developing'],[12*f,24*f,'full'],[24*f,36*f,'passing'],[36*f,HMAX,'gone']],cols:[PAL['cv-bg2'],PAL['s5'],PAL['s5'],PAL['s5'],PAL['cv-bg2']],al:[1,0.45,0.9,0.45,1]},
    {l:'Livor',segs:[[0,0.5,''],[0.5,2,''],[2,10,'visible'],[10,HMAX,'fixed']],cols:[PAL['cv-bg2'],PAL['s2'],PAL['s2'],PAL['s2']],al:[1,0.35,0.6,0.95]}];
  const rh=phn?30:26;rows.forEach((r,ri)=>{const y=tl.y+ri*(rh+12);txt(ctx,r.l,tl.x-8,y+rh/2,{s:12*k,w:700,a:'right',b:'middle'});
    r.segs.forEach((sg,i)=>{const x0=X(Math.min(HMAX,sg[0])),x1=X(Math.min(HMAX,sg[1]));if(x1<=x0)return;ctx.globalAlpha=r.al[i];ctx.fillStyle=r.cols[i];ctx.fillRect(x0,y,x1-x0,rh);ctx.globalAlpha=1;
      if(sg[2]){ctx.font='600 '+(12*k)+'px '+FONT;if(ctx.measureText(sg[2]).width<x1-x0-8)txt(ctx,sg[2],(x0+x1)/2,y+rh/2+1,{s:12*k,w:600,a:'center',b:'middle',c:r.al[i]>0.7&&r.cols[i]!==PAL['cv-bg2']?'#fff':PAL['cv-ink']});}});
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(tl.x,y,tl.w,rh);});
  const cx=X(Math.min(HMAX,st.h));ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,tl.y-6);ctx.lineTo(cx,tl.y+2*rh+18);ctx.stroke();
  if(!phn)txt(ctx,'Timeline at '+p.ta+' °C air: rigor comes and goes faster in warm air',tl.x,tl.y+2*rh+34,{s:12*k,c:PAL['cv-soft']});}

/* ---------- insect view ---------- */
function bug(ctx,id,x,y,s,hl){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const cream='#f1e6c8',edge='#9b8a5e';
  if(id==='egg'){for(let i=0;i<7;i++){ctx.fillStyle='#fbf7ea';ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(-12+i*4,(i%2)*5-2,2.4,6,0.3,0,TAU);ctx.fill();ctx.stroke();}}
  else if(id[0]==='l'||id==='pf'){const L={l1:12,l2:20,l3:30,pf:30}[id];ctx.fillStyle=id==='pf'?'#e8dcc0':cream;ctx.strokeStyle=edge;ctx.lineWidth=1.2;rr(ctx,-L/2,-L*0.14-1.5,L,L*0.28+3,L*0.14+1.5);ctx.fill();ctx.stroke();
    for(let i=1;i<6;i++){const xx=-L/2+i*L/6;ctx.beginPath();ctx.moveTo(xx,-L*0.12);ctx.lineTo(xx,L*0.12);ctx.stroke();}ctx.fillStyle='#4a3b20';ctx.beginPath();ctx.arc(-L/2+2,0,1.2,0,TAU);ctx.fill();}
  else if(id==='pupa'){ctx.fillStyle='#8a4b1f';ctx.strokeStyle='#5a2f12';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,13,6.5,0,0,TAU);ctx.fill();ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*4.5,-6);ctx.lineTo(i*4.5,6);ctx.stroke();}}
  else{ctx.fillStyle='rgba(190,215,235,.55)';ctx.strokeStyle='#7fa2b8';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(-2,-8,9,4,-0.5,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(-2,8,9,4,0.5,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillStyle='#2f8f5b';ctx.beginPath();ctx.ellipse(-3,0,9,5,0,0,TAU);ctx.fill();ctx.fillStyle='#24643f';ctx.beginPath();ctx.arc(8,0,4.5,0,TAU);ctx.fill();ctx.fillStyle='#a33';ctx.beginPath();ctx.arc(10,-2,1.8,0,TAU);ctx.arc(10,2,1.8,0,TAU);ctx.fill();}
  ctx.restore();}
function drawInsects(sim,ctx,k,t){const p=sim.p,st=sim.st,phn=k>1.35,adh=adhAt(p,st.ih),cur=stageOf(adh),fi=STAGES.findIndex(s=>s.id===p.found);
  // life-cycle wheel
  const cx=phn?150:196,cy=phn?158:182,R=phn?82:104;const ids=STAGES.map(s=>s.id).concat(['adult']),labels=['eggs','1st instar','2nd instar','3rd instar','wandering','pupa','adult fly'];
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
  for(let i=0;i<7;i++){const a=-Math.PI/2+i/7*TAU,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R,on=i===Math.min(cur,6),fd=i===fi;
    ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(x,y,phn?28:30,0,TAU);ctx.fill();ctx.strokeStyle=on?PAL['rj']:fd?PAL['s4']:PAL['line'];ctx.lineWidth=on||fd?3.5:1.5;ctx.stroke();
    bug(ctx,ids[i],x,y,i===6?1.3:i===0?1.3:1.45,on);
    const lx=cx+Math.cos(a)*(R+(phn?38:40)),ly=cy+Math.sin(a)*(R+(phn?40:42));
    if(!phn)txt(ctx,labels[i],lx,ly,{s:12*k,w:on?700:400,a:Math.abs(Math.cos(a))<0.3?'center':Math.cos(a)>0?'left':'right',b:'middle',c:on?PAL['cv-ink']:PAL['cv-soft']});}
  txt(ctx,Math.round(st.ih)+' h',cx,cy-6,{s:18*k,w:700,a:'center'});txt(ctx,phn?'old':'since eggs laid',cx,cy+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  if(phn){txt(ctx,'now: '+labels[Math.min(cur,6)],20,cy+R+50,{s:12*k,w:700,c:PAL['rj']});txt(ctx,'found: '+labels[fi],20,cy+R+50+20*k,{s:12*k,w:700,c:PAL['s4']});}
  // stage timeline at this temperature
  const b={x:phn?326:410,y:phn?50:54,w:phn?458:376,h:phn?38:34};let yy=b.y+b.h+15*k;const end=hoursFor(p,ADULT),H=Number.isFinite(end)?end*1.04:400;const X=h=>b.x+Math.min(h,H)/H*b.w;
  txt(ctx,'Stages at '+p.ta+' °C'+(p.swing?' ± '+p.swing+' °C':''),b.x,b.y-12,{s:13*k,w:700});
  if(!Number.isFinite(end)){txt(ctx,'Too cold: no development',b.x,b.y+24,{s:14*k,w:700,c:PAL['s1']});}
  else{const cols=['#d9cf9e','#c9b77a','#b39a5a','#9a7b3c','#7d5d2a','#5a3a1a'];
    STAGES.forEach((s,i)=>{const x0=X(hoursFor(p,s.a)),x1=X(hoursFor(p,s.b));ctx.fillStyle=cols[i];ctx.fillRect(x0,b.y,x1-x0,b.h);if(i===fi){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.strokeRect(x0+1.5,b.y-3,x1-x0-3,b.h+6);}});
    const ticks=H>600?200:H>250?100:H>100?48:24;for(let h=0;h<=H;h+=ticks)txt(ctx,h+' h',X(h),b.y+b.h+15*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
    const xc=X(st.ih);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xc,b.y-6);ctx.lineTo(xc,b.y+b.h+4);ctx.stroke();
    const fs=STAGES[fi],h0=hoursFor(p,fs.a),h1=hoursFor(p,fs.b);const yb=yy+20*k;
    ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(h0),yb-8);ctx.lineTo(X(h0),yb);ctx.lineTo(X(h1),yb);ctx.lineTo(X(h1),yb-8);ctx.stroke();
    txt(ctx,'found: '+fs.l.split(' (')[0].toLowerCase(),clamp((X(h0)+X(h1))/2,b.x+70*k,b.x+b.w-70*k),yb+16*k,{s:12*k,w:700,c:PAL['s4'],a:'center'});
    txt(ctx,'eggs laid '+fmtRange([h0,h1])+' ago',clamp((X(h0)+X(h1))/2,b.x+90*k,b.x+b.w-90*k),yb+33*k,{s:12*k,c:PAL['cv-ink'],a:'center'});}
  yy+=20*k+33*k+26*k;
  // equation box
  const L=[{t:'ADH = Σ (air temperature − 10 °C) × hours',s:13.5,w:700},{t:p.ta>TB||p.swing?'At '+p.ta+' °C: '+Math.max(0,p.ta-TB)+' degree hours each hour'+(p.swing?' on average before the swing':'')+'. '+STAGES[fi].l.split(' (')[0]+' needs '+STAGES[fi].a+'–'+STAGES[fi].b+' ADH.':'At or below 10 °C the larvae stop developing.',s:13}];
  if(!phn)L.push({t:'The oldest insects give a minimum time since death: flies may have arrived later than the moment of death.',s:12.5,c:PAL['cv-soft']});
  const mb={x:b.x,y:yy,w:b.w,h:16};txt(ctx,'Degree hours so far: '+Math.round(adh)+' of '+ADULT+' to adult',mb.x,mb.y-10,{s:12*k,w:700});
  ctx.fillStyle=PAL['card2'];rr(ctx,mb.x,mb.y,mb.w,mb.h,8);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=PAL['s4'];rr(ctx,mb.x,mb.y,Math.max(8,mb.w*Math.min(1,adh/ADULT)),mb.h,8);ctx.fill();
  textBox(ctx,{x:b.x-8,y:yy+28,w:788-b.x+8,h:60},L,k);}

/* ---------- case board ---------- */
function drawCase(sim,ctx,k){const p=sim.p,st=sim.st,c=clues(p.cs),C=c.c,phn=k>1.35,bio=!atLeast('honors');
  // case card
  const cw=262;if(!phn){rr(ctx,12,14,cw,422,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
  const facts=[[C.l.split(': ')[1].replace(/^./,m=>m.toUpperCase()),'',true],['Scene',C.place],['Air temperature',C.ta+' °C'],['Body mass',C.m+' kg'],['Covering',CLOTH[C.cloth].l],['Rectal temperature',c.T.toFixed(1)+' °C ('+toF(c.T).toFixed(1)+' °F)'],['Rigor',rigor(C.pmi,C.ta).l.split(':')[0]],['Livor',livor(C.pmi).l.split(':')[0].replace(', not yet fixed','')],['Insects',c.stage?c.stage.l.split(' (')[0]:'none found']];
  facts.push(['Glaister rule alone',fmtH(Math.max(0,c.gl))]);
  if(phn){txt(ctx,C.l.split(': ')[1].replace(/^./,m=>m.toUpperCase())+': air '+C.ta+' °C, rectal '+c.T.toFixed(1)+' °C',14,30,{s:14*k,w:700});}
  else{let y=40;facts.forEach(f=>{if(f[2]){txt(ctx,f[0],26,y,{s:15*k,w:700});y+=26*k;return;}if(y>420)return;txt(ctx,f[0],26,y,{s:12*k,c:PAL['cv-soft']});y+=15*k;txt(ctx,f[1],26,y,{s:13*k,w:700});y+=21*k;});}
  // board
  const maxH=C.pmi<20?24:C.pmi<50?60:200;const b={x:phn?160:(cw+118),y:phn?72:44,w:0,h:0};b.w=786-b.x;const X=h=>b.x+Math.min(h,maxH)/maxH*b.w;
  const rows=c.rows,rh=phn?44:46,gap=phn?14:16;
  const ty=b.y+rows.length*(rh+gap)+8;
  const ticks=maxH===24?6:maxH===60?12:50;ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let h=0;h<=maxH;h+=ticks){const x=Math.round(X(h))+.5;ctx.beginPath();ctx.moveTo(x,b.y-10);ctx.lineTo(x,ty);ctx.stroke();txt(ctx,h+' h',x,ty+16*k,{s:12*k,c:PAL['g-axis'],a:'center'});}
  if(c.comb[0]<c.comb[1]){const x0=X(c.comb[0]),x1=X(Math.min(c.comb[1],maxH));ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.18;ctx.fillRect(x0,b.y-10,x1-x0,ty-b.y+10);ctx.globalAlpha=1;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.strokeRect(x0,b.y-10,x1-x0,ty-b.y+10);}
  const cols=[PAL['s1'],PAL['s5'],PAL['s2'],PAL['s4']];
  rows.forEach((r,i)=>{const y=b.y+i*(rh+gap);txt(ctx,{temp:'Temperature',rigor:'Rigor',livor:'Livor',bugs:'Insects'}[r.id],b.x-10,y+rh*0.36,{s:13*k,w:700,a:'right',b:'middle'});
    if(!r.r){txt(ctx,'none found indoors: no limit',b.x+6,y+rh*0.4,{s:12*k,c:PAL['cv-soft'],b:'middle'});return;}
    const x0=X(r.r[0]),x1=r.r[1]===Infinity?b.x+b.w:X(r.r[1]);ctx.fillStyle=cols[i];rr(ctx,x0,y+rh*0.18,Math.max(4,x1-x0),rh*0.44,6);ctx.fill();
    if(r.r[1]===Infinity||r.r[1]>maxH){ctx.fillStyle=cols[i];ctx.beginPath();ctx.moveTo(b.x+b.w+8,y+rh*0.4);ctx.lineTo(b.x+b.w-4,y+rh*0.18-4);ctx.lineTo(b.x+b.w-4,y+rh*0.62+4);ctx.closePath();ctx.fill();}
    const nt=phn?(bio?r.note:fmtRange(r.r)):(bio?r.note:r.note+': '+fmtRange(r.r));ctx.font='400 '+(12*k)+'px '+FONT;const nw=ctx.measureText(nt).width/2+4;
    const nx=clamp((x0+Math.min(x1,b.x+b.w))/2,b.x+nw,b.x+b.w-nw),ny=y+rh*0.62+13*k;ctx.fillStyle=PAL['cv-bg'];ctx.globalAlpha=0.85;ctx.fillRect(nx-nw,ny-11*k,2*nw,15*k);ctx.globalAlpha=1;
    txt(ctx,nt,nx,ny,{s:12*k,c:PAL['cv-soft'],a:'center'});});
  if(bio&&c.gl>0){const xg=X(c.gl);ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(xg,b.y-8);ctx.lineTo(xg+7,b.y-1);ctx.lineTo(xg,b.y+6);ctx.lineTo(xg-7,b.y-1);ctx.closePath();ctx.fill();txt(ctx,'Glaister '+fmtH(c.gl),xg+10,b.y-2,{s:12*k,c:PAL['s4'],w:700,b:'middle'});}
  const comb=c.comb[0]<c.comb[1]?'All clues overlap: '+fmtRange(c.comb):'The clues do not overlap';pill(ctx,comb,b.x+b.w/2,ty+42*k,PAL['s3'],'#fff',13*k);
  if(st.reveal){const xt=X(C.pmi);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(xt,b.y-16);ctx.lineTo(xt,ty);ctx.stroke();ctx.setLineDash([]);pill(ctx,'true: '+C.pmi+' h',clamp(xt,b.x+40*k,b.x+b.w-40*k),b.y-22,PAL['cv-ink'],PAL['card'],12*k);}}
TOD.onLevel=syncMode;TOD.controls[0].onChange=sim=>{syncMode(sim);sim.st.hold=false;sim.infoDirty=true;};
BioLab.register(TOD);
})();

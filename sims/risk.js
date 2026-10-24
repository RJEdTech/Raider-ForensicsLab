(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* ---------- the case: Pinecrest Bakery (fictional) ---------- */
const THREATS=[
  {id:'phish',name:'Phishing email',short:'Phishing',ashort:'Shop email',asset:'Shop email and the order inbox',cia:'C',aro:2,sle:3000,
   desc:'A fake “supplier invoice” email tricks a staff member into typing the shop email password on a look-alike page. The attacker reads customer emails and sends fake invoices.',
   avoid:{text:'Stop using email for the business',cost:40000}},
  {id:'laptop',name:'Stolen laptop',short:'Laptop',ashort:'Laptops',asset:'Two staff laptops (payroll file)',cia:'C',aro:0.2,sle:6000,
   desc:'A laptop left in a car overnight is stolen. It holds the payroll spreadsheet with staff names and addresses.',
   avoid:{text:'Laptops never leave the shop',cost:800}},
  {id:'guess',name:'Weak password guessed',short:'Password',ashort:'Website',asset:'Online-order website admin',cia:'I',aro:0.5,sle:4000,
   desc:'The website admin password is “Pinecrest2024”. A guessing bot gets in and changes prices and pickup times on orders.',
   avoid:{text:'Shut down online ordering',cost:15000}},
  {id:'ransom',name:'Unpatched software',short:'Ransomware',ashort:'Order PC',asset:'Order computer and recipe files',cia:'A',aro:0.25,sle:40000,
   desc:'The order computer has skipped updates for a year. Ransomware gets in through an old, known flaw and locks every file.',
   avoid:{text:'Go back to paper orders',cost:9000}},
  {id:'power',name:'Power outage',short:'Power',ashort:'Ovens and register',asset:'Ovens, register and router',cia:'A',aro:1.5,sle:1500,
   desc:'A storm knocks out power for most of a day. The register, card reader and ovens all stop, and dough spoils.',
   avoid:{text:'No realistic way to avoid storms',cost:null}},
  {id:'insider',name:'Insider mistake',short:'Insider',ashort:'Customer list',asset:'Customer list (480 loyalty members)',cia:'C',aro:0.5,sle:8000,
   desc:'An employee means to email one customer but attaches the whole loyalty list and sends it to the wrong address.',
   avoid:{text:'Stop keeping a customer email list',cost:6000}},
  {id:'skimmer',lvl:'honors',name:'Card skimmer',short:'Skimmer',ashort:'Card reader',asset:'Payment terminal',cia:'C',aro:0.08,sle:60000,
   desc:'Someone swaps the card reader for a look-alike that copies cards. It runs for weeks before the bank notices.',
   avoid:{text:'Take cash only',cost:50000}}
];
/* Controls, in the order an attack meets them. stop = chance this layer stops one attempt; cut = share of the damage it removes. */
const CONTROLS=[
  {id:'locks',name:'Cable locks and a locked office',short:'Locks',type:'Physical',fn:'Preventive',cost:250,stop:{laptop:0.5,skimmer:0.3}},
  {id:'seal',name:'Tamper seals and a daily terminal check',short:'Seals',type:'Physical',fn:'Detective',cost:100,cut:{skimmer:0.8}},
  {id:'filter',name:'Email filter',short:'Filter',type:'Technical',fn:'Preventive',cost:300,stop:{phish:0.6}},
  {id:'pwm',name:'Password manager and long passphrases',short:'Passwords',type:'Administrative',fn:'Preventive',cost:200,stop:{guess:0.8}},
  {id:'train',name:'Phishing and data-handling training',short:'Training',type:'Administrative',fn:'Preventive',cost:400,stop:{phish:0.5,insider:0.4}},
  {id:'dlp',name:'“Check the recipient” email delay',short:'Delay',type:'Technical',fn:'Preventive',cost:150,stop:{insider:0.6}},
  {id:'patch',name:'Automatic updates',short:'Updates',type:'Technical',fn:'Preventive',cost:350,stop:{ransom:0.75}},
  {id:'mfa',name:'Multi-factor sign-in (MFA)',short:'MFA',type:'Technical',fn:'Preventive',cost:250,stop:{phish:0.7,guess:0.95}},
  {id:'crypt',name:'Full-disk encryption on laptops',short:'Encrypt',type:'Technical',fn:'Preventive',cost:150,cut:{laptop:0.6}},
  {id:'alerts',name:'Sign-in alerts and a weekly log review',short:'Alerts',type:'Technical',fn:'Detective',cost:450,cut:{phish:0.5,guess:0.6}},
  {id:'backup',name:'Daily offline backups',short:'Backups',type:'Technical',fn:'Corrective',cost:500,cut:{ransom:0.85,laptop:0.15}},
  {id:'ups',name:'Battery backup (UPS) for the register',short:'UPS',type:'Physical',fn:'Corrective',cost:900,cut:{power:0.5}}
];
const CIA={C:'Confidentiality',I:'Integrity',A:'Availability'};
const CIAF={C:'#7b3fe4',I:'#2d6bd2',A:'#b86e00'};
const LWORD=['','Rare','Unlikely','Possible','Likely','Almost certain'];
const IWORD=['','Minor','Moderate','Major','Severe','Critical'];
const LHELP=['','less than once in 10 years','once every 3 to 10 years','once every 1 to 3 years','1 to 3 times a year','more than 3 times a year'];
const IHELP=['','under $500','$500 to $2,000','$2,000 to $10,000','$10,000 to $50,000','over $50,000'];
const lRate=a=>1+[0.1,0.3,1,3].filter(b=>a>=b).length;
const iRate=s=>1+[500,2000,10000,50000].filter(b=>s>=b).length;
const band=s=>s>=20?{n:'Critical',c:'#b3261e'}:s>=10?{n:'High',c:'#cf5a12'}:s>=5?{n:'Medium',c:'#b58a00'}:{n:'Low',c:'#2e7d4f'};
const DED=1000;                     // insurance deductible per incident
const CASE_BUDGET=2000,GOAL=0.7;
const TREAT={accept:'Accept',mitigate:'Mitigate',transfer:'Transfer',avoid:'Avoid'};
const money=v=>(v<0?'−':'')+'$'+Math.round(Math.abs(v)).toLocaleString('en-US');
const pct=v=>(v*100<9.95&&v*100>0?(v*100).toFixed(1):Math.round(v*100))+'%';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const freq=a=>a>=1?(a===Math.round(a)?a:a.toFixed(1))+' times a year':a>0?'about once every '+(1/a<10?(1/a).toFixed(1).replace(/\.0$/,''):Math.round(1/a))+' years':'never';
function premium(a2,s2){return Math.round((1.3*a2*Math.max(0,s2-DED)+50)/10)*10;}
function poisson(l,R){if(l<=0)return 0;const L=Math.exp(-l);let k=0,p=1;do{k++;p*=R();}while(p>L&&k<200);return k-1;}

/* ---------- plans ---------- */
function newPlan(){return {rate:{},treat:{},buy:{},num:{},custom:[],ran:false,draft:{name:'',cia:'A',aro:'1',sle:'2000'}};}
const plan=sim=>sim.st&&sim.st.chPlan?sim.st.chPlan:sim.plan;
const sandbox=sim=>sim.p.mode==='sandbox';
function threatsFor(sim,pl){const list=THREATS.filter(t=>atLeast(t.lvl));return sandbox(sim)?list.concat(pl.custom):list;}
function param(sim,pl,t){if(t.custom)return {aro:t.aro,sle:t.sle};if(sandbox(sim)&&pl.num[t.id])return pl.num[t.id];return {aro:t.aro,sle:t.sle};}
const ctrlOK=(c,t)=>(c.stop&&c.stop[t.id]!==undefined)||(c.cut&&c.cut[t.id]!==undefined);
const budgetOf=sim=>sandbox(sim)?sim.p.budget:CASE_BUDGET;
function evaluate(sim,pl){pl=pl||plan(sim);const ts=threatsFor(sim,pl);let before=0,ale=0,prem=0,lost=0,ctrl=0;const rows=[];
  CONTROLS.forEach(c=>{if(pl.buy[c.id])ctrl+=c.cost;});
  ts.forEach((t,i)=>{const {aro,sle}=param(sim,pl,t);let tr=pl.treat[t.id]||'';const layers=CONTROLS.filter(c=>pl.buy[c.id]&&ctrlOK(c,t));
    let pass=1,cut=1;layers.forEach(c=>{if(c.stop&&c.stop[t.id])pass*=1-c.stop[t.id];if(c.cut&&c.cut[t.id])cut*=1-c.cut[t.id];});
    const a2=aro*pass,s2=sle*cut;let ale_t=a2*s2,prem_t=0,lost_t=0;
    if(tr==='avoid'&&!(t.avoid&&t.avoid.cost!==null))tr='accept';
    if(tr==='avoid'){ale_t=0;lost_t=t.avoid.cost;}else if(tr==='transfer'){prem_t=premium(a2,s2);ale_t=a2*Math.min(s2,DED);}
    before+=aro*sle;ale+=ale_t;prem+=prem_t;lost+=lost_t;rows.push({t,n:i+1,aro,sle,pass,cut,a2,s2,ale:ale_t,prem:prem_t,lost:lost_t,tr,layers,base:aro*sle});});
  return {rows,before,ale,prem,lost,ctrl,spend:ctrl+prem,total:ale+ctrl+prem+lost,cut:before>0?1-ale/before:0};}
function simYear(sim,pl,seed){const R=rng(seed),ev=evaluate(sim,pl),out=[];
  ev.rows.forEach(r=>{if(r.tr==='avoid')return;const n=poisson(r.aro,R);
    for(let i=0;i<n;i++){let by=null;for(const c of r.layers){const p=c.stop&&c.stop[r.t.id];if(p&&R()<p){by=c;break;}}
      const day=Math.floor(R()*365),loss=by?0:r.s2,paid=by?0:(r.tr==='transfer'?Math.min(loss,DED):loss);out.push({r,day,by,loss,paid});}});
  out.sort((a,b)=>a.day-b.day);return out;}
const mcCache={};
function simMany(sim,pl,n,seed){const key=JSON.stringify([pl.buy,pl.treat,pl.num,pl.custom.map(c=>[c.aro,c.sle]),sim.p.mode,atLeast('honors'),n,seed]);
  if(mcCache[key])return mcCache[key];const ys=[];for(let y=0;y<n;y++){let s=0;simYear(sim,pl,seed*7919+y).forEach(e=>s+=e.paid);ys.push(s);}
  const so=ys.slice().sort((a,b)=>a-b),mean=ys.reduce((a,b)=>a+b,0)/n;
  const res={ys,so,mean,median:so[Math.floor(n/2)],p95:so[Math.floor(n*0.95)],max:so[n-1],zero:so.filter(v=>v===0).length};
  const ks=Object.keys(mcCache);if(ks.length>40)delete mcCache[ks[0]];mcCache[key]=res;return res;}
function goals(sim){const pl=sim.plan,ts=threatsFor(sim,pl),ev=evaluate(sim,pl);
  const rated=ts.filter(t=>pl.rate[t.id]&&pl.rate[t.id].L&&pl.rate[t.id].I).length,treated=ts.filter(t=>pl.treat[t.id]).length;
  return [{ok:rated===ts.length,t:'Rate every threat ('+rated+' of '+ts.length+')'},{ok:treated===ts.length,t:'Choose a treatment for every threat ('+treated+' of '+ts.length+')'},
    {ok:ev.spend<=CASE_BUDGET,t:'Stay within the '+money(CASE_BUDGET)+' budget (now '+money(ev.spend)+')'},
    {ok:ev.cut>=GOAL,t:'Cut expected yearly losses by at least '+Math.round(GOAL*100)+'% (now '+Math.round(ev.cut*100)+'%)'},
    {ok:!!pl.ran,t:'Play out at least one simulated year'}];}

/* presets for challenges and the walkthrough (never touch the student's own plan) */
function preset(buy,treat,extra){const p=newPlan();(buy||[]).forEach(id=>p.buy[id]=true);Object.assign(p.treat,treat||{});
  THREATS.forEach(t=>{p.rate[t.id]={L:lRate(t.aro),I:iRate(t.sle)};});return Object.assign(p,extra||{});}
const PRESETS={
  none:()=>preset([]),train:()=>preset(['train']),trainFilter:()=>preset(['train','filter']),trainFilterMfa:()=>preset(['train','filter','mfa']),
  plan:()=>preset(['filter','dlp','patch','mfa','backup'],{phish:'mitigate',laptop:'avoid',guess:'mitigate',ransom:'mitigate',power:'accept',insider:'mitigate',skimmer:'transfer'}),
  ransomT:()=>preset([],{ransom:'transfer'}),seal:()=>preset(['seal']),mfa:()=>preset(['mfa'])
};
function usePreset(sim,name){sim.st.chPlan=PRESETS[name]();sim.st.dots=[];sim.st.hist=[];sim.st.year=null;sim.st.many=null;}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{if(!a.modes)return;const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}
function onMode(sim){if(sim.st){sim.st.year=null;sim.st.many=null;sim.st.dots=[];sim.st.hist=[];}syncMode(sim);}

/* ---------- styles for the planning panel ---------- */
function injectStyle(){if(document.getElementById('rk-style'))return;const s=document.createElement('style');s.id='rk-style';s.textContent=`
.rk h4{margin:14px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.rk h4:first-child{margin-top:0}
.rk .rk-goals{list-style:none;padding:0;margin:0 0 4px;font-size:15px}.rk .rk-goals li{padding:2px 0 2px 26px;position:relative}
.rk .rk-goals li::before{content:"○";position:absolute;left:4px;color:var(--muted);font-weight:700}.rk .rk-goals li.ok::before{content:"✓";color:var(--good)}
.rk .rk-card{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--card2)}
.rk .rk-top{display:flex;gap:10px;align-items:flex-start}.rk .rk-n{flex:0 0 auto;width:28px;height:28px;border-radius:50%;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px}
.rk .rk-tag{display:inline-block;font-size:12px;font-weight:700;border-radius:999px;padding:1px 8px;color:#fff;margin-left:6px;vertical-align:2px}
.rk .rk-q{font-size:14px;font-weight:600;margin:10px 0 4px}.rk .seg button{font-size:14px;padding:4px 9px}
.rk .rk-note{font-size:14px;color:var(--muted);margin:6px 0 0}.rk .rk-good{color:var(--good)}.rk .rk-bad{color:var(--bad)}
.rk .rk-shop{display:flex;flex-direction:column;gap:4px}.rk .rk-item{display:flex;gap:10px;align-items:flex-start;padding:6px 8px;border:1px solid var(--line);border-radius:8px;cursor:pointer;font-size:14px;line-height:1.35}
.rk .rk-item:has(input:checked){border-color:var(--rj);background:var(--card2)}.rk .rk-item input{margin-top:3px;accent-color:var(--rj)}
.rk .rk-item b{font-weight:600}.rk .rk-item .rk-cost{margin-left:auto;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
.rk .rk-meta{display:block;color:var(--muted);font-size:13px}
.rk .rk-in{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:end;margin-top:6px}.rk .rk-in label{display:flex;flex-direction:column;font-size:13px;color:var(--muted);gap:2px}
.rk .rk-in input,.rk .rk-in select{border:1px solid var(--line);background:var(--card);border-radius:7px;padding:5px 7px;font-size:15px;width:130px}
.rk .rk-in input.rk-wide{width:200px}.rk .rk-list{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 0}
.rk .rk-pick{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:3px 10px;font-size:14px;cursor:pointer}.rk .rk-pick[aria-pressed="true"]{border-color:var(--rj);box-shadow:inset 0 0 0 1px var(--rj)}`;
  document.head.appendChild(s);}

/* ---------- panel ---------- */
function panelHTML(sim){injectStyle();const pl=sim.plan,sb=sandbox(sim),hon=atLeast('honors'),ap=atLeast('ap'),ev=evaluate(sim,pl),ts=threatsFor(sim,pl);
  const t=THREATS.find(x=>x.id===sim.p.threat&&atLeast(x.lvl))||THREATS[0],row=ev.rows.find(r=>r.t===t),n=row?row.n:1;
  let h='<div class="rk">';
  if(sim.st.chPlan)h+='<p class="rk-note"><b>Showing a challenge or walkthrough setup.</b> Press Reset under the stage to return to your own plan.</p>';
  if(!sb){h+='<h4>Your mission</h4><ul class="rk-goals">'+goals(sim).map(g=>`<li class="${g.ok?'ok':''}">${g.t}</li>`).join('')+'</ul>';}
  else h+='<h4>Try it yourself</h4><p class="rk-note" style="margin-top:0">Your own numbers drive this model. Change how often each threat happens and what one costs, add threats of your own, and set the budget with the slider.</p>';
  // threat picker
  h+='<h4>Threats</h4><div class="rk-list">'+ts.filter(x=>!x.custom).map((x,i)=>`<button type="button" class="rk-pick" data-a="pick" data-id="${x.id}" data-fid="pick-${x.id}" aria-pressed="${x===t}">${i+1}. ${x.short}</button>`).join('')+'</div>';
  // selected threat card
  const r=pl.rate[t.id]||{},P=param(sim,pl,t);
  h+=`<div class="rk-card" style="margin-top:8px"><div class="rk-top"><span class="rk-n" style="background:${CIAF[t.cia]}">${n}</span><div><b style="font-size:16px">${t.name}</b><span class="rk-tag" style="background:${CIAF[t.cia]}">${hon?CIA[t.cia]:t.cia==='C'?'Secrets leak':t.cia==='I'?'Data changed':'Things stop working'}</span>
    <div class="rk-meta">Asset at risk: ${t.asset}</div></div></div><p style="margin:8px 0 0;font-size:15px">${t.desc}</p>`;
  if(!sb){h+=`<p class="rk-q">How likely is it in a year?</p><div class="seg" role="radiogroup" aria-label="Likelihood">${[1,2,3,4,5].map(v=>`<button type="button" role="radio" data-a="L" data-v="${v}" data-fid="L${v}" aria-checked="${r.L===v}" title="${LHELP[v]}">${v} ${LWORD[v]}</button>`).join('')}</div>
    <p class="rk-q">How bad would one be?</p><div class="seg" role="radiogroup" aria-label="Impact">${[1,2,3,4,5].map(v=>`<button type="button" role="radio" data-a="I" data-v="${v}" data-fid="I${v}" aria-checked="${r.I===v}" title="${IHELP[v]}">${v} ${IWORD[v]}</button>`).join('')}</div>`;
    if(r.L&&r.I){const aL=lRate(t.aro),aI=iRate(t.sle),you=r.L*r.I,an=aL*aI;
      h+=`<p class="rk-note">Your risk score: ${r.L} × ${r.I} = <b>${you} (${band(you).n})</b>. Analyst data: ${freq(t.aro)}, about ${money(t.sle)} each, so ${aL} × ${aI} = <b>${an} (${band(an).n})</b>.`;
      if(Math.abs(r.L-aL)>=2)h+=` <span class="rk-bad">Your likelihood is far from the data: this happens ${freq(t.aro)}.</span>`;
      if(Math.abs(r.I-aI)>=2)h+=` <span class="rk-bad">Your impact is far from the data: one costs about ${money(t.sle)}.</span>`;
      h+='</p>';}
    else h+='<p class="rk-note">Rate it first, then the analyst’s data appears for comparison.</p>';}
  else h+=`<div class="rk-in"><label>Times per year<input type="number" min="0" max="50" step="0.05" value="${P.aro}" data-a="aro" data-fid="aro"></label><label>Cost of one incident ($)<input type="number" min="0" max="10000000" step="100" value="${Math.round(P.sle)}" data-a="sle" data-fid="sle"></label></div>
    <p class="rk-note">Score: ${lRate(P.aro)} × ${iRate(P.sle)} = ${lRate(P.aro)*iRate(P.sle)} (${band(lRate(P.aro)*iRate(P.sle)).n}). Expected loss ${P.aro} × ${money(P.sle)} = ${money(P.aro*P.sle)} a year.</p>`;
  // treatment
  const tr=pl.treat[t.id]||'',canAvoid=t.avoid&&t.avoid.cost!==null;
  h+=`<p class="rk-q">What will the bakery do about it?</p><div class="seg" role="radiogroup" aria-label="Treatment">${Object.keys(TREAT).map(k=>`<button type="button" role="radio" data-a="T" data-v="${k}" data-fid="T${k}" aria-checked="${tr===k}"${k==='avoid'&&!canAvoid?' disabled':''}>${TREAT[k]}</button>`).join('')}</div>`;
  const tnote={'':'Accept: live with it. Mitigate: add layers of controls. Transfer: buy insurance. Avoid: stop the activity that causes it.',
    accept:'Accept: the bakery pays for each incident as it comes.'+(row&&row.base>=3000?' <span class="rk-bad">That is a lot to accept: '+money(row.ale)+' a year expected.</span>':''),
    mitigate:'Mitigate: controls below reduce how often it gets through or how much it hurts.'+(row&&!row.layers.length?' <span class="rk-bad">No control you bought covers this threat yet.</span>':''),
    transfer:'Transfer: insurance pays each loss above a '+money(DED)+' deductible. Premium '+money(row?row.prem:0)+' a year.',
    avoid:canAvoid?'Avoid: '+t.avoid.text+'. The threat is gone, but the bakery gives up about '+money(t.avoid.cost)+' a year.':''};
  h+=`<p class="rk-note">${tnote[tr]||''}</p>`;
  if(row){const ls=row.layers;h+=`<p class="rk-note">Layers on this threat: ${ls.length?ls.map(c=>c.short).join(', '):'none'}. ${hon?'Expected loss now '+money(row.ale)+' a year (was '+money(row.base)+').':''}</p>`;}
  if(!canAvoid)h+='<p class="rk-note">'+t.avoid.text+'.</p>';
  h+='</div>';
  // control shop
  const bud=budgetOf(sim);
  h+=`<h4>Buy controls (${money(ev.spend)} of ${money(bud)} spent${ev.prem?', including '+money(ev.prem)+' insurance':''})</h4><div class="rk-shop">`+CONTROLS.map(c=>{const helps=ts.filter(x=>ctrlOK(c,x));if(!helps.length&&!pl.buy[c.id])return '';
    const what=helps.map(x=>{const i=ts.indexOf(x)+1;return c.stop&&c.stop[x.id]?i+' (stops '+Math.round(c.stop[x.id]*100)+'%)':i+' (−'+Math.round(c.cut[x.id]*100)+'% damage)';}).join(', ');
    return `<label class="rk-item"><input type="checkbox" data-a="buy" data-id="${c.id}" data-fid="buy-${c.id}"${pl.buy[c.id]?' checked':''}><span><b>${c.name}</b><span class="rk-meta">${c.type}${hon?' · '+c.fn:''} · helps with ${what}</span></span><span class="rk-cost">${money(c.cost)}</span></label>`;}).join('')+'</div>';
  if(ev.spend>bud)h+=`<p class="rk-note rk-bad">Over budget by ${money(ev.spend-bud)}.</p>`;
  if(sb){const d=pl.draft;h+=`<h4>Add your own threat</h4><div class="rk-in"><label>Name<input class="rk-wide" type="text" maxlength="28" value="${esc(d.name)}" placeholder="e.g. Broken freezer" data-a="dname" data-fid="dname"></label>
    <label>Breaks<select data-a="dcia" data-fid="dcia">${['C','I','A'].map(k=>`<option value="${k}"${d.cia===k?' selected':''}>${CIA[k]}</option>`).join('')}</select></label>
    <label>Times per year<input type="number" min="0" max="50" step="0.05" value="${esc(d.aro)}" data-a="daro" data-fid="daro"></label><label>Cost each ($)<input type="number" min="0" step="100" value="${esc(d.sle)}" data-a="dsle" data-fid="dsle"></label>
    <button type="button" class="btn" data-a="add" data-fid="add"${pl.custom.length>=3?' disabled':''}>Add threat</button></div>`;
    if(pl.custom.length)h+='<div class="rk-list" style="margin-top:8px">'+pl.custom.map((c,i)=>`<button type="button" class="rk-pick" data-a="del" data-i="${i}" data-fid="del${i}" title="Remove">${ts.indexOf(c)+1}. ${esc(c.name)}: ${freq(c.aro)}, ${money(c.sle)} ✕</button>`).join('')+'</div><p class="rk-note">No control in the shop covers your own threats, so they show what happens to a risk nobody planned for.</p>';}
  if(ap&&ev.spend>0){const rosi=(ev.before-ev.ale-ev.spend)/ev.spend;h+=`<p class="rk-note">Return on security spending: (${money(ev.before)} − ${money(ev.ale)} − ${money(ev.spend)}) ÷ ${money(ev.spend)} = <b>${Math.round(rosi*100)}%</b>.</p>`;}
  return h+'</div>';}
function rerender(sim,fid){sim._fid=fid;sim.infoDirty=true;BioLab.refresh(sim);}
function bindPanel(sim,el){
  el.onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,pl=sim.plan,id=sim.p.threat;
    if(a==='pick'){BioLab.setValues(sim,{threat:b.dataset.id});rerender(sim,b.dataset.fid);return;}
    if(a==='L'||a==='I'){pl.rate[id]=Object.assign({},pl.rate[id]);pl.rate[id][a]=+b.dataset.v;rerender(sim,b.dataset.fid);return;}
    if(a==='T'){pl.treat[id]=b.dataset.v;rerender(sim,b.dataset.fid);return;}
    if(a==='add'){const d=pl.draft,aro=clamp(parseFloat(d.aro)||0,0,50),sle=clamp(parseFloat(d.sle)||0,0,1e7);const nm=(d.name||'').trim()||'My threat '+(pl.custom.length+1);
      pl.custom.push({id:'c'+Date.now()%100000+pl.custom.length,custom:true,name:nm,short:nm.slice(0,10),cia:d.cia,aro,sle,asset:'Your choice',avoid:{text:'',cost:null}});d.name='';rerender(sim,'add');return;}
    if(a==='del'){pl.custom.splice(+b.dataset.i,1);rerender(sim,'add');return;}};
  el.onchange=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,pl=sim.plan,id=sim.p.threat;
    if(a==='buy'){pl.buy[b.dataset.id]=b.checked;sim.st.dots=[];sim.st.hist=[];rerender(sim,b.dataset.fid);return;}
    if(a==='aro'||a==='sle'){const t=THREATS.find(x=>x.id===id),cur=Object.assign({},param(sim,pl,t)),v=parseFloat(b.value);
      if(Number.isFinite(v)){cur[a]=a==='aro'?clamp(v,0,50):clamp(Math.round(v),0,1e7);pl.num[id]=cur;}rerender(sim,b.dataset.fid);return;}
    if(a==='dcia'){pl.draft.cia=b.value;}};
  el.oninput=e=>{const b=e.target.closest('[data-a]');if(!b)return;const d=sim.plan.draft;if(b.dataset.a==='dname')d.name=b.value;if(b.dataset.a==='daro')d.aro=b.value;if(b.dataset.a==='dsle')d.sle=b.value;};
  if(sim._fid){const e=el.querySelector('[data-fid="'+sim._fid+'"]');if(e)try{e.focus({preventScroll:true});}catch(_){}sim._fid=null;}}

/* ---------- drawing helpers ---------- */
function wrap(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const words=String(s).split(' '),lines=[];let cur='';
  words.forEach(wd=>{const tryS=cur?cur+' '+wd:wd;if(ctx.measureText(tryS).width>maxW&&cur){lines.push(cur);cur=wd;}else cur=tryS;});if(cur)lines.push(cur);return lines;}
function badge(ctx,x,y,r,n,fill,k){ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fillStyle=fill;ctx.fill();txt(ctx,String(n),x,y+1,{s:Math.max(12*k,r*1.05),w:700,c:'#fff',a:'center',b:'middle'});}
function header(sim,ctx,k,title,short){const ev=evaluate(sim),bud=budgetOf(sim),ph=k>1.4;
  txt(ctx,ph&&short?short:title,20,34,{s:17*k,w:700});
  const bw=ph?210:230,bx=780-bw,by=40;txt(ctx,(ph?'':'Spent ')+money(ev.spend)+' of '+money(bud),780,30,{s:13*k,w:600,a:'right',c:ev.spend>bud?PAL['s1']:PAL['cv-soft']});
  rr(ctx,bx,by,bw,8,4);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  rr(ctx,bx,by,bw*clamp(bud>0?ev.spend/bud:ev.spend>0?1:0,0,1),8,4);ctx.fillStyle=ev.spend>bud?PAL['s1']:PAL['s3'];ctx.fill();}

/* risk matrix */
function matrixGeom(k){const ph=k>1.4;return ph?{gx:62,gy:66,cw:145,ch:72,ph}:{gx:150,gy:66,cw:76,ch:72,ph};}
function matrixMarks(sim){const pl=plan(sim),ts=threatsFor(sim,pl),sb=sandbox(sim),out=[];
  ts.forEach((t,i)=>{const P=param(sim,pl,t);let L,I;
    if(sb){L=lRate(P.aro);I=iRate(P.sle);out.push({t,n:i+1,L,I,kind:'you'});return;}
    const r=pl.rate[t.id];if(r&&r.L&&r.I){out.push({t,n:i+1,L:r.L,I:r.I,kind:'you'});}
    if(sim.p.compare||(r&&r.L&&r.I&&sim.st.chPlan))out.push({t,n:i+1,L:lRate(t.aro),I:iRate(t.sle),kind:'an'});});
  return out;}
function layoutMarks(sim,k){const g=matrixGeom(k),marks=matrixMarks(sim),cells={};marks.forEach(m=>{const key=m.I+','+m.L;(cells[key]=cells[key]||[]).push(m);});
  Object.values(cells).forEach(list=>{const n=list.length,per=n<=3?n:n<=6?3:4,rows=Math.ceil(n/per);const r=Math.min(g.cw/(per*2+1.2),g.ch/(rows*2+0.9),17);
    list.forEach((m,j)=>{const row=Math.floor(j/per),inRow=Math.min(per,n-row*per),col=j%per;const cx=g.gx+(m.I-0.5)*g.cw,cy=g.gy+(5-m.L+0.5)*g.ch;
      m.x=cx+(col-(inRow-1)/2)*r*2.25;m.y=cy+(row-(rows-1)/2)*r*2.2;m.r=r;});});return marks;}
function drawMatrix(sim,ctx,k){const g=matrixGeom(k),pl=plan(sim),ts=threatsFor(sim,pl);
  header(sim,ctx,k,'Risk matrix: likelihood × impact','Risk matrix');
  for(let L=1;L<=5;L++)for(let I=1;I<=5;I++){const x=g.gx+(I-1)*g.cw,y=g.gy+(5-L)*g.ch,b=band(L*I);ctx.globalAlpha=0.2;ctx.fillStyle=b.c;ctx.fillRect(x,y,g.cw,g.ch);ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,g.cw,g.ch);if(!g.ph)txt(ctx,String(L*I),x+g.cw-5,y+14,{s:12,c:PAL['cv-soft'],a:'right'});}
  for(let L=1;L<=5;L++){const y=g.gy+(5-L+0.5)*g.ch;txt(ctx,g.ph?String(L):LWORD[L],g.gx-8,y,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle',w:600});}
  for(let I=1;I<=5;I++){const x=g.gx+(I-0.5)*g.cw;txt(ctx,g.ph?String(I):IWORD[I],x,g.gy+5*g.ch+18*k,{s:12*k,c:PAL['cv-soft'],a:'center',w:600});}
  const by=g.gy+5*g.ch+(g.ph?44:38)*k*0.85;txt(ctx,'Impact: how bad one incident is →',g.gx+2.5*g.cw,Math.min(492,by),{s:13*k,w:700,a:'center'});
  ctx.save();ctx.translate(g.ph?18:24,g.gy+2.5*g.ch);ctx.rotate(-Math.PI/2);txt(ctx,'Likelihood per year →',0,0,{s:13*k,w:700,a:'center',b:'middle'});ctx.restore();
  const marks=layoutMarks(sim,k);
  marks.forEach(m=>{const sel=m.t.id===sim.p.threat;if(m.kind==='an'){ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y,m.r-1,0,6.29);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.arc(m.x,m.y,m.r-2.5,0,6.29);ctx.fill();txt(ctx,String(m.n),m.x,m.y+1,{s:Math.max(12*k,m.r),w:700,a:'center',b:'middle'});}
    else badge(ctx,m.x,m.y,m.r,m.n,m.t.custom?'#5f6b7a':CIAF[m.t.cia],k);
    if(sel){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(m.x,m.y,m.r+3,0,6.29);ctx.stroke();}});
  if(!g.ph){// list of threats
    const x0=552;txt(ctx,'Threats',x0,80,{s:13,w:700,c:PAL['cv-soft']});
    ts.forEach((t,i)=>{const y=104+i*(ts.length>7?34:42),r=plan(sim).rate[t.id],sb=sandbox(sim),P=param(sim,pl,t),sel=t.id===sim.p.threat;
      if(sel){rr(ctx,x0-8,y-15,244,ts.length>7?32:38,7);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=1.5;ctx.stroke();}
      badge(ctx,x0+8,y,10,i+1,t.custom?'#5f6b7a':CIAF[t.cia],1);txt(ctx,t.name.length>22?t.name.slice(0,21)+'…':t.name,x0+26,y+1,{s:13,w:600,b:'middle'});
      let s2;if(sb){const L=lRate(P.aro),I=iRate(P.sle);s2=L+' × '+I+' = '+L*I+' '+band(L*I).n;}else s2=r&&r.L&&r.I?'You: '+r.L+' × '+r.I+' = '+r.L*r.I+' '+band(r.L*r.I).n:'Not rated yet';
      if(ts.length<=7)txt(ctx,s2,x0+26,y+17,{s:12,c:PAL['cv-soft'],b:'middle'});});
    const ly=104+ts.length*(ts.length>7?34:42)+6;
    [['C','Confidentiality (secrets leak)'],['I','Integrity (data changed)'],['A','Availability (stops working)']].forEach((c,i)=>{badge(ctx,x0+8,ly+i*20,7,'',CIAF[c[0]],1);txt(ctx,c[1],x0+22,ly+i*20+1,{s:12,c:PAL['cv-soft'],b:'middle'});});
    if(!sandbox(sim)){const yy=ly+64;ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x0+8,yy,7,0,6.29);ctx.stroke();ctx.setLineDash([]);txt(ctx,'Analyst estimate from data',x0+22,yy+1,{s:12,c:PAL['cv-soft'],b:'middle'});}}
  if(!marks.length){rr(ctx,g.gx+g.cw*0.5,g.gy+g.ch*2,g.cw*4,g.ch,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    const lines=wrap(ctx,'Rate each threat in the panel below to place it here.',g.cw*4-24,14*k,600);lines.forEach((l,i)=>txt(ctx,l,g.gx+g.cw*2.5,g.gy+g.ch*2.5+(i-(lines.length-1)/2)*17*k,{s:14*k,w:600,a:'center',b:'middle'}));}}

/* Swiss-cheese layers */
function holesFor(c,tid){const p=c.stop[tid],R=rng(c.id.length*131+tid.length*17+c.id.charCodeAt(0)),n=1+Math.round((1-p)*4),open=(1-p)*230;
  const hs=[];let used=0;const sizes=[];for(let i=0;i<n;i++)sizes.push(0.6+R());const tot=sizes.reduce((a,b)=>a+b,0);
  const free=250-open,gaps=[];for(let i=0;i<=n;i++)gaps.push(0.4+R());const gt=gaps.reduce((a,b)=>a+b,0);let y=125+gaps[0]/gt*free;
  for(let i=0;i<n;i++){const h=sizes[i]/tot*open;hs.push([y,y+h]);y+=h+gaps[i+1]/gt*free;used+=h;}return hs;}
function layerGeom(sim){const pl=plan(sim),t=THREATS.find(x=>x.id===sim.p.threat&&atLeast(x.lvl))||THREATS[0];const ev=evaluate(sim,pl),row=ev.rows.find(r=>r.t===t);
  const pre=row.layers.filter(c=>c.stop&&c.stop[t.id]),cut=row.layers.filter(c=>c.cut&&c.cut[t.id]);
  const x0=228,x1=cut.length?548:600,xs=pre.map((c,i)=>pre.length===1?(x0+x1)/2:x0+i*(x1-x0)/(pre.length-1));
  return {t,row,pre,cut,xs,holes:pre.map(c=>holesFor(c,t.id))};}
function spawnDot(sim,G){const st=sim.st,R=Math.random;const path=[[178,175+R()*150]];let stopAt=-1;
  for(let i=0;i<G.pre.length;i++){const hs=G.holes[i],pass=R()>=G.pre[i].stop[G.t.id];
    if(pass){const h=hs[Math.floor(R()*hs.length)];path.push([G.xs[i],lerp(h[0]+4,h[1]-4,R())]);}
    else{let y,tries=0;do{y=128+R()*244;tries++;}while(hs.some(h=>y>h[0]-7&&y<h[1]+7)&&tries<40);path.push([G.xs[i]-11,y]);stopAt=i;break;}}
  if(stopAt<0)path.push([630,190+R()*120]);st.dots.push({path,seg:0,u:0,stopAt,done:0,key:G.t.id+JSON.stringify(G.pre.map(c=>c.id))});}
function stepLayers(sim,dt){const st=sim.st;if(sim.p.view!=='layers')return;const G=layerGeom(sim),key=G.t.id+JSON.stringify(G.pre.map(c=>c.id));
  if(st.lkey!==key){st.lkey=key;st.dots=[];st.hist=[];}
  st.spawn-=dt;if(st.spawn<=0&&st.dots.length<14){spawnDot(sim,G);st.spawn=0.55;}
  st.dots.forEach(d=>{if(d.done>0){d.done+=dt;return;}const a=d.path[d.seg],b=d.path[d.seg+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;d.u+=dt*230/L;
    if(d.u>=1){d.u=0;d.seg++;if(d.seg>=d.path.length-1){d.done=0.001;st.hist.push(d.stopAt<0?1:0);if(st.hist.length>40)st.hist.shift();if(d.stopAt<0)st.hit=0.5;}}});
  st.dots=st.dots.filter(d=>d.done<1.1);st.hit=Math.max(0,(st.hit||0)-dt);}
function drawLayers(sim,ctx,k){const st=sim.st,G=layerGeom(sim),t=G.t,row=G.row,hon=atLeast('honors'),ph=k>1.4;
  header(sim,ctx,k,'Layers of defense: '+t.short,'Layers: '+t.short);
  // threat card
  rr(ctx,14,150,150,200,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  badge(ctx,40,176,14,row.n,CIAF[t.cia],k);if(!ph)txt(ctx,'Threat',62,177,{s:12*k,w:700,c:PAL['cv-soft'],b:'middle'});
  wrap(ctx,ph?t.short:t.name,128,14*k,700).slice(0,3).forEach((l,i)=>txt(ctx,l,26,214+i*18*k,{s:14*k,w:700}));
  if(!ph)wrap(ctx,freq(row.aro),130,12*k).slice(0,3).forEach((l,i)=>txt(ctx,l,26,300+i*15*k,{s:12*k,c:PAL['cv-soft']}));
  // asset card
  const hitC=st.hit>0;rr(ctx,640,150,146,200,12);ctx.fillStyle=hitC?'rgba(193,20,48,.18)':PAL['card'];ctx.fill();ctx.strokeStyle=hitC?PAL['s1']:PAL['line'];ctx.lineWidth=hitC?3:1.5;ctx.stroke();
  txt(ctx,'Asset',652,174,{s:12*k,w:700,c:PAL['cv-soft']});wrap(ctx,ph?t.ashort:t.asset,124,13*k,700).slice(0,4).forEach((l,i)=>txt(ctx,l,652,198+i*17*k,{s:13*k,w:700}));
  wrap(ctx,money(row.s2)+' per hit',126,12*k,600).forEach((l,i,a)=>txt(ctx,l,652,338-(a.length-1-i)*15*k,{s:12*k,c:G.cut.length?PAL['s3']:PAL['cv-soft'],w:600}));
  // cushions (detective and corrective controls)
  G.cut.forEach((c,i)=>{const x=590+i*16;rr(ctx,x,140,12,220,6);ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.55;ctx.fill();ctx.globalAlpha=1;});
  if(G.cut.length){const lab=G.cut.map(c=>c.short+' −'+Math.round(c.cut[t.id]*100)+'%');lab.forEach((l,i)=>txt(ctx,l,630,380+i*16*k+8*k,{s:12*k,w:700,c:PAL['s3'],a:'right'}));}
  // slices
  G.pre.forEach((c,i)=>{const x=G.xs[i],hs=G.holes[i];ctx.fillStyle=PAL['cv-head'];rr(ctx,x-12,120,24,260,8);ctx.fill();
    hs.forEach(h=>{ctx.fillStyle=PAL['cv-bg'];rr(ctx,x-7,h[0],14,h[1]-h[0],7);ctx.fill();});
    const up=i%2===0||G.pre.length<3;const y=up?104:398+12*k;txt(ctx,c.short,x,y,{s:12*k,w:700,a:'center'});if(!ph)txt(ctx,'stops '+Math.round(c.stop[t.id]*100)+'%',x,y+(up?-15:15),{s:12,c:PAL['cv-soft'],a:'center'});});
  if(!G.pre.length){const msg=G.cut.length?'No layer stops this threat. Only the damage is cut.':'No layers yet. Every attempt reaches the asset.';
    wrap(ctx,msg,300,14*k,600).forEach((l,i)=>txt(ctx,l,395,240+i*19*k,{s:14*k,w:600,a:'center',c:PAL['cv-soft']}));}
  // dots
  st.dots.forEach(d=>{let p;if(d.done>0)p=d.path[d.path.length-1];else{const a=d.path[d.seg],b=d.path[d.seg+1];p=[lerp(a[0],b[0],d.u),lerp(a[1],b[1],d.u)];}
    const al=d.done>0?clamp(1-d.done,0,1):1;ctx.globalAlpha=al;
    if(d.done>0&&d.stopAt>=0){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p[0]-5,p[1]-5);ctx.lineTo(p[0]+5,p[1]+5);ctx.moveTo(p[0]+5,p[1]-5);ctx.lineTo(p[0]-5,p[1]+5);ctx.stroke();}
    else{ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(p[0],p[1],6,0,6.29);ctx.fill();}ctx.globalAlpha=1;});
  // numbers
  const n=st.hist.length,thr=st.hist.reduce((a,b)=>a+b,0);
  const f=G.pre.map(c=>Math.round((1-c.stop[t.id])*100)+'%').join(' × ');
  const l1=n?'Last '+n+' attempts: '+(n-thr)+' stopped, '+thr+' got through':'Watch the attempts…';
  const l2=G.pre.length?(hon?'Chance one gets through: '+f+' = '+pct(row.pass):'About '+Math.round(row.pass*100)+' in 100 attempts get through every layer'):'Every attempt gets through';
  txt(ctx,l1,400,ph?456:446,{s:13*k,w:700,a:'center'});txt(ctx,l2,400,ph?486:466,{s:13*k,a:'center',c:PAL['cv-soft']});
  if(hon&&!ph)txt(ctx,'Expected loss: '+row.aro+' × '+pct(row.pass)+' × '+money(row.s2)+' = '+money(row.a2*row.s2)+' a year',400,486,{s:13,a:'center',c:PAL['cv-soft']});}

/* simulated year(s) */
function stepYear(sim,dt){const y=sim.st.year;if(!y||y.clock>=y.dur)return;y.clock=Math.min(y.dur,y.clock+dt);if(y.clock>=y.dur)sim.infoDirty=true;}
function drawYear(sim,ctx,k){const st=sim.st,pl=plan(sim),ph=k>1.4,ap=atLeast('ap');
  if(st.many&&!st.year){header(sim,ctx,k,'1,000 simulated years','1,000 years');const M=st.many,top=Math.max(1000,M.so[Math.floor(M.so.length*0.99)]);
    const nb=20,bw=top/nb,bins=new Array(nb).fill(0);M.ys.forEach(v=>{bins[Math.min(nb-1,Math.floor(v/bw))]++;});const ns=BioLab.h.niceStep(Math.max(...bins),4),bmax=Math.ceil(Math.max(...bins)/ns)*ns;
    const L=ph?70:90,T=80,W=ph?700:670,H=ph?300:310,X=v=>L+clamp(v/top,0,1)*W,Y=c=>T+H-c/bmax*H;
    ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let c=0;c<=bmax+1e-9;c+=ns){const yy=Y(c);ctx.beginPath();ctx.moveTo(L,yy);ctx.lineTo(L+W,yy);ctx.stroke();txt(ctx,String(Math.round(c)),L-8,yy,{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});}
    bins.forEach((c,i)=>{ctx.fillStyle=PAL['s2'];ctx.fillRect(L+i*W/nb+1,Y(c),W/nb-2,T+H-Y(c));});
    for(let i=0;i<=4;i++){const v=top*i/4;txt(ctx,money(v),X(v),T+H+18*k,{s:12*k,c:PAL['g-axis'],a:i===0?'left':i===4?'right':'center'});}
    txt(ctx,'Years',L-8,T-10,{s:12*k,c:PAL['muted'],a:'right'});txt(ctx,'Loss in one year (what the bakery pays)',L+W/2,T+H+40*k,{s:13*k,c:PAL['muted'],a:'center'});
    const mk=(v,c,lab,row)=>{const x=X(v);ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,T+H);ctx.stroke();ctx.setLineDash([]);
      const right=x<L+W*0.6,ty=T+14+row*22*k;ctx.font='700 '+13*k+'px '+FONT;const tw=ctx.measureText(lab).width;rr(ctx,right?x+2:x-tw-10,ty-13*k,tw+8,18*k,4);ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.92;ctx.fill();ctx.globalAlpha=1;
      txt(ctx,lab,x+(right?6:-6),ty,{s:13*k,w:700,c,a:right?'left':'right'});};
    mk(M.mean,PAL['s1'],'average '+money(M.mean),0);mk(M.median,PAL['s3'],'median '+money(M.median),1);if(ap)mk(M.p95,PAL['s4'],'1-in-20 bad year '+money(M.p95),2);
    txt(ctx,M.zero+' of 1,000 years had no loss at all',780,ph?492:488,{s:12*k,c:PAL['cv-soft'],a:'right'});return;}
  header(sim,ctx,k,'A year at Pinecrest Bakery','One year');const ts=threatsFor(sim,pl),L=ph?64:132,R=780,T=88,rh=Math.min(34,240/ts.length),X=d=>L+(d+0.5)/365*(R-L);
  const MON=ph?['J','F','M','A','M','J','J','A','S','O','N','D']:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  MON.forEach((m,i)=>{const x=L+(i+0.5)*(R-L)/12;txt(ctx,m,x,T-8,{s:12*k,c:PAL['cv-soft'],a:'center'});if(i){ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L+i*(R-L)/12,T);ctx.lineTo(L+i*(R-L)/12,T+rh*ts.length);ctx.stroke();}});
  ts.forEach((t,i)=>{const y=T+rh*(i+0.5);if(i%2===0){ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(L,y-rh/2,R-L,rh);}badge(ctx,ph?30:22,y,Math.min(rh*0.42,13),i+1,t.custom?'#5f6b7a':CIAF[t.cia],k);
    if(!ph)txt(ctx,t.short,40,y+1,{s:12,w:600,b:'middle'});const tr=pl.treat[t.id];if(tr==='avoid'&&!ph)txt(ctx,'avoided',R-6,y+1,{s:12,c:PAL['cv-soft'],a:'right',b:'middle'});});
  const yr=st.year,sumY=T+rh*ts.length+30*k;
  if(!yr){wrap(ctx,'Press “Run one year” to play out a year with your plan. Each attack runs into your layers: some get stopped, some get through.',600,14*k,600).forEach((l,i)=>txt(ctx,l,400,sumY+i*19*k,{s:14*k,w:600,a:'center',c:PAL['cv-soft']}));return;}
  const day=yr.clock/yr.dur*365;ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;const cx=L+day/365*(R-L);ctx.beginPath();ctx.moveTo(cx,T-2);ctx.lineTo(cx,T+rh*ts.length+2);ctx.stroke();
  let n=0,stop=0,loss=0,paid=0;
  yr.events.forEach(e=>{if(e.day>day)return;n++;const i=ts.indexOf(e.r.t);if(i<0)return;const x=X(e.day),y=T+rh*(i+0.5),r=Math.min(rh*0.34,9*k*0.85);
    if(e.by){stop++;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.stroke();}
    else{loss+=e.loss;paid+=e.paid;ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();txt(ctx,'!',x,y+1,{s:Math.max(12,r*1.4),w:800,c:'#fff',a:'center',b:'middle'});}});
  const ev=evaluate(sim,pl);const done=yr.clock>=yr.dur;
  txt(ctx,(done?'Whole year: ':'So far: ')+n+' attack'+(n===1?'':'s')+', '+stop+' stopped, '+(n-stop)+' got through',400,sumY,{s:14*k,w:700,a:'center'});
  txt(ctx,'Losses '+money(paid)+(loss>paid?' (insurance paid '+money(loss-paid)+')':'')+(done?' + security '+money(ev.spend)+' = '+money(paid+ev.spend):''),400,sumY+20*k,{s:13*k,a:'center',c:PAL['cv-soft']});
  if(!ph){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(250,492-6,6,0,6.29);ctx.stroke();txt(ctx,'stopped by a layer',262,487,{s:12,c:PAL['cv-soft'],b:'middle'});
    ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(420,486,6,0,6.29);ctx.fill();txt(ctx,'got through',432,487,{s:12,c:PAL['cv-soft'],b:'middle'});}}

/* ---------- challenge numbers come from the model ---------- */
const T_=id=>THREATS.find(t=>t.id===id);
const ALE=id=>T_(id).aro*T_(id).sle;
const passOf=(ids,tid)=>ids.reduce((p,id)=>p*(1-(CONTROLS.find(c=>c.id===id).stop[tid]||0)),1);
const mfaSave=ALE('phish')*0.7+ALE('guess')*0.95,mfaRosi=(mfaSave-250)/250;
const ransomT=(()=>{const a=T_('ransom').aro,s=T_('ransom').sle;return {cost:a*Math.min(s,DED)+premium(a,s),ale:a*s,worst:DED};})();

const RISK={
  id:'risk',hash:'risk',apUnit:20,order:1,tab:'Risk and defense in depth',kind:'Learning tool',
  card:'Rate the threats to a fictional bakery, spend a security budget on layered controls, then play out a year and see what gets through.',
  title:'Risk and defense in depth: protect Pinecrest Bakery',
  lede:{bio:'Pinecrest Bakery (fictional) has customer data, a card reader, a website and two laptops. Decide which threats matter most, spend a small budget on defenses, and see how layers of protection stop attacks.',
        honors:'Rate each threat on a 5 × 5 risk matrix, tag it with the CIA triad, choose to accept, mitigate, transfer or avoid it, and stack preventive, detective and corrective controls.',
        ap:'Quantify risk with annualized loss expectancy (ALE = ARO × SLE), compare return on security spending, and use 1,000 simulated years to see the spread of outcomes, not just the average.'},
  scale:'One small shop, one year: about 2 phishing attempts reach a careless click each year; a ransomware attack costs about $40,000.',
  aspect:1.6,timeless:true,animated:true,graph:false,chChange:1,chReveal:4.5,
  controls:[
    {id:'mode',label:'Mode',type:'seg',def:'case',noTrial:true,options:[{v:'case',l:'Investigate'},{v:'sandbox',l:'Try it yourself'}],onChange:onMode},
    {id:'view',label:'Show',type:'seg',noTrial:true,def:'matrix',options:[{v:'matrix',l:'Risk matrix'},{v:'layers',l:'Layers'},{v:'year',l:'Simulated year'}]},
    {id:'threat',label:'Threat',type:'select',noTrial:true,def:'phish',options:THREATS.map((t,i)=>({v:t.id,l:(i+1)+'. '+t.name,lvl:t.lvl})),help:'Or click a threat on the stage.'},
    {id:'compare',label:'Show analyst estimates',noTrial:true,type:'toggle',def:false,modes:['case'],help:'Rings show the rating that real loss data gives.'},
    {id:'budget',label:'Security budget',type:'range',min:0,max:5000,step:100,def:2000,unit:' $/yr',modes:['sandbox']}
  ],
  actions:[
    {id:'year',label:'Run one year',primary:true,run(sim){const st=sim.st;st.yearN=(st.yearN||0)+1;st.many=null;st.year={events:simYear(sim,plan(sim),1000+st.yearN*37),clock:0,dur:RM?0.01:6};
      st.lastLoss=st.year.events.reduce((a,e)=>a+e.paid,0);if(!st.chPlan)sim.plan.ran=true;BioLab.setValues(sim,{view:'year'});}},
    {id:'many',label:'Run 1,000 years',lvl:'honors',run(sim){sim.st.year=null;sim.st.many=simMany(sim,plan(sim),1000,3);BioLab.setValues(sim,{view:'year'});}},
    {id:'analyst',label:'Fill in the analyst’s ratings',modes:['case'],run(sim){THREATS.forEach(t=>{sim.plan.rate[t.id]={L:lRate(t.aro),I:iRate(t.sle)};});}},
    {id:'clear',label:'Start a new plan',run(sim){const keep=sim.plan.draft;sim.plan=newPlan();sim.plan.draft=keep;sim.st.chPlan=null;sim.st.year=null;sim.st.many=null;sim.st.dots=[];sim.st.hist=[];}}
  ],
  init(sim){if(!sim.plan)sim.plan=newPlan();const st={chPlan:null,dots:[],hist:[],spawn:0,year:null,many:null,hit:0,lastLoss:null,yearN:0};
    if(sim.p._ch){st.chPlan=PRESETS[sim.p._ch]();sim.p._ch=null;}return st;},
  step(sim,dt){const st=sim.st;if(sim.p._ch){usePreset(sim,sim.p._ch);sim.p._ch=null;sim.infoDirty=true;}stepLayers(sim,dt);stepYear(sim,dt);},
  metrics:[
    {id:'spend',label:'Spent on security',unit:'$/yr',d:0,min:0,max:null,get:s=>evaluate(s).spend},
    {id:'before',label:'Expected loss with no plan',unit:'$/yr',lvl:'honors',d:0,min:0,max:null,get:s=>evaluate(s).before},
    {id:'ale',label:'Expected loss with your plan',unit:'$/yr',d:0,min:0,max:null,get:s=>evaluate(s).ale},
    {id:'cut',label:'Expected loss cut by',unit:'%',d:0,min:0,max:100,get:s=>Math.round(evaluate(s).cut*100)},
    {id:'total',label:'Total cost of risk',unit:'$/yr',lvl:'honors',d:0,min:0,max:null,get:s=>evaluate(s).total},
    {id:'rosi',label:'Return on security spending',unit:'%',lvl:'ap',d:0,min:0,max:null,get:s=>{const e=evaluate(s);return e.spend>0?Math.round((e.before-e.ale-e.spend)/e.spend*100):0;}},
    {id:'worst',label:'1-in-20 bad year',unit:'$',lvl:'ap',d:0,min:0,max:null,get:s=>simMany(s,plan(s),1000,3).p95},
    {id:'last',label:'Loss in the last simulated year',unit:'$',d:0,min:0,max:null,noTrial:true,get:s=>s.st.lastLoss===null?0:s.st.lastLoss}
  ],
  infoPanel:panelHTML,bindInfo:bindPanel,
  onClick(sim,x,y){const k=sim.vis.k||1,pl=plan(sim),ts=threatsFor(sim,pl);
    if(sim.p.view==='matrix'){const ms=layoutMarks(sim,k).filter(m=>!m.t.custom);const hit=ms.find(m=>Math.hypot(m.x-x,m.y-y)<=m.r+4);if(hit){BioLab.setValues(sim,{threat:hit.t.id});return;}
      if(k<=1.4&&x>540){const step=ts.length>7?34:42,i=Math.floor((y-104+18)/step);if(i>=0&&i<ts.length&&!ts[i].custom)BioLab.setValues(sim,{threat:ts[i].id});}}
    else if(sim.p.view==='year'&&!sim.st.many){const rh=Math.min(34,240/ts.length),i=Math.floor((y-88)/rh);if(i>=0&&i<ts.length&&!ts[i].custom)BioLab.setValues(sim,{threat:ts[i].id});}},
  narrate(sim){const st=sim.st,pl=plan(sim),ev=evaluate(sim,pl),hon=atLeast('honors'),ap=atLeast('ap'),v=sim.p.view;
    if(v==='layers'){const G=layerGeom(sim),t=G.t;if(!G.pre.length)return 'Nothing stands between <b>'+t.name.toLowerCase()+'</b> and the '+t.asset.toLowerCase()+(G.cut.length?'. Your '+G.cut.map(c=>c.short).join(' and ')+' only cut the damage after it happens.':', so every attempt gets through. Add a control that stops it.');
      return '<b>Defense in depth:</b> each layer has holes, but the holes rarely line up. With '+G.pre.map(c=>c.short).join(', ')+', about '+Math.round(G.row.pass*100)+' in 100 attempts get through'+(G.pre.length>1?', even though no single layer stops more than '+Math.round(Math.max(...G.pre.map(c=>c.stop[t.id]))*100)+'%':'')+'.'+(hon&&G.pre.length>1?' The chances multiply: '+G.pre.map(c=>pct(1-c.stop[t.id])).join(' × ')+' = '+pct(G.row.pass)+'.':'');}
    if(v==='year'){if(st.many){const M=st.many;return 'Across 1,000 simulated years the bakery loses <b>'+money(M.mean)+' a year on average</b>, close to the expected loss of '+money(ev.ale)+'. The median year costs only '+money(M.median)+': most years are quiet, and a few rare disasters pull the average up.'+(ap?' One year in 20 costs '+money(M.p95)+' or more.':'');}
      if(!st.year)return 'Press <b>Run one year</b> to play out a year at the bakery with your plan.';
      const y=st.year,done=y.clock>=y.dur,got=y.events.filter(e=>!e.by);
      if(!done)return 'The year is playing out. Each mark is one attack: a ring means a layer stopped it, a red mark means it got through.';
      return 'This year brought <b>'+y.events.length+' attacks</b>; '+(y.events.length-got.length)+' were stopped and '+got.length+' got through, costing '+money(st.lastLoss)+'. One year is luck as much as planning'+(hon?': run 1,000 years to see the average.':', so run it again and compare.');}
    const sb=sandbox(sim);if(sb)return 'Your numbers place each threat on the matrix. <b>Risk = likelihood × impact</b>. Expected loss with your plan: '+money(ev.ale)+' a year, down '+Math.round(ev.cut*100)+'% from '+money(ev.before)+'.';
    const ts=threatsFor(sim,pl),rated=ts.filter(t=>pl.rate[t.id]&&pl.rate[t.id].L&&pl.rate[t.id].I);
    if(!rated.length)return 'Start by rating each threat: how likely is it in a year, and how bad would one be? <b>Risk = likelihood × impact</b>, so a rare disaster can matter as much as a common nuisance.';
    const top=rated.slice().sort((a,b)=>pl.rate[b.id].L*pl.rate[b.id].I-pl.rate[a.id].L*pl.rate[a.id].I)[0],r=pl.rate[top.id];
    const big=ev.rows.slice().sort((a,b)=>b.base-a.base)[0];
    return 'Your highest risk is <b>'+top.name.toLowerCase()+'</b> ('+r.L+' × '+r.I+' = '+r.L*r.I+', '+band(r.L*r.I).n+'). '+(rated.length<ts.length?(ts.length-rated.length)+' threat'+(ts.length-rated.length===1?' is':'s are')+' still unrated.':(ap?'In dollars, the biggest expected loss is '+big.t.name.toLowerCase()+' at '+money(big.base)+' a year.':'Now pick a treatment for each one and buy controls.'));},
  tour:[
    {title:'A small business with real risks',text:'Pinecrest Bakery (fictional) has four kinds of assets: customer data, a card reader, an online-order website and two laptops. Each threat in the list could hurt one of them.',focus:[540,60,256,380],pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',view:'matrix',compare:false});usePreset(sim,'none');}},
    {title:'Risk = likelihood × impact',text:{bio:'Each threat lands on the grid by how likely it is in a year (up) and how bad one incident is (right). The top-right corner is where the worst risks live.',honors:'A 5 × 5 risk matrix: score = likelihood × impact, from 1 (low) to 25 (critical). Here every threat is placed at the analyst’s rating from loss data.'},focus:[[8,58,532,440]],pause:true,setup(sim){usePreset(sim,'none');BioLab.setValues(sim,{compare:true});}},
    {title:'Common is not the same as costly',text:'Power outages happen 1 to 2 times a year but cost about $1,500 each. Ransomware hits about once every 4 years but costs about $40,000. Over time, ransomware costs the bakery four times as much.',focus:[[8,58,532,440]],pause:true,setup(sim){BioLab.setValues(sim,{threat:'ransom'});}},
    {title:'Layers of Swiss cheese',text:{bio:'One defense always has holes. Stack several and an attack only gets through if it finds a hole in every one. Here an email filter, training and MFA guard against phishing.',honors:'Each preventive layer stops part of the attacks. The chance one gets through all three is 40% × 50% × 30% = 6%.'},focus:[[180,80,450,340]],speed:1,setup(sim){usePreset(sim,'trainFilterMfa');BioLab.setValues(sim,{view:'layers',threat:'phish'});}},
    {title:'Some controls cut the damage instead',text:'Backups do not stop ransomware from getting in. They let the bakery restore its files, so the damage drops from $40,000 to about $6,000. That is a corrective control.',focus:[[560,130,236,280]],speed:1,setup(sim){usePreset(sim,'plan');BioLab.setValues(sim,{view:'layers',threat:'ransom'});}},
    {title:'Play out a year',text:'A year at the bakery: each mark is one attack. Rings were stopped by a layer, red marks got through and cost money. Run it again and the year changes, because attacks are random.',focus:[[0,60,800,440]],speed:1,setup(sim){usePreset(sim,'plan');sim.st.year={events:simYear(sim,plan(sim),2024),clock:0,dur:5};BioLab.setValues(sim,{view:'year'});}},
    {lvl:'honors',title:'1,000 years at once',text:{honors:'Repeat the year 1,000 times. The average loss matches the expected loss, ALE = ARO × SLE summed over threats. Most years cost less than average.',ap:'The histogram is skewed: rare, expensive incidents make a long right tail. The 1-in-20 bad year is what insurance and savings must cover.'},focus:[[0,60,800,440]],pause:true,setup(sim){usePreset(sim,'none');sim.st.many=simMany(sim,plan(sim),1000,3);BioLab.setValues(sim,{view:'year'});}}
  ],
  onTourExit(sim){sim.st.chPlan=null;sim.st.year=null;sim.st.many=null;sim.st.dots=[];sim.st.hist=[];BioLab.setValues(sim,{view:'matrix',compare:false});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.show&&phase==='done')ch.show(sim);},
  challenges:[
    {lvl:'bio',instant:true,q:'A power outage happens 1 to 2 times a year and costs about $1,500. Ransomware hits about once every 4 years and costs about $40,000. Which costs the bakery more per year on average?',
     choices:['The power outage, because it happens more often','Ransomware, because each one costs so much more','About the same'],correct:ALE('ransom')>ALE('power')?1:0,
     show(sim){usePreset(sim,'none');BioLab.setValues(sim,{mode:'case',view:'matrix',compare:true,threat:'ransom'});},
     explain:{bio:'Expected loss = how often × how much. Power: 1.5 × $1,500 = '+money(ALE('power'))+' a year. Ransomware: 0.25 × $40,000 = '+money(ALE('ransom'))+' a year. Rare but expensive can beat common but cheap.',ap:'ALE = ARO × SLE: power 1.5 × $1,500 = '+money(ALE('power'))+'; ransomware 0.25 × $40,000 = '+money(ALE('ransom'))+'. On the matrix both score 8, which is why analysts back the matrix with dollar estimates.'}},
    {lvl:'bio',q:'Training stops half of phishing attempts. You add an email filter that stops 60%. How many phishing attempts get through both layers?',
     choices:['None: two layers stop everything','About 20 in 100','About 10 in 100, because 50% + 60% is more than 100%'],correct:Math.abs(passOf(['train','filter'],'phish')-0.2)<0.01?1:0,
     baseline:{mode:'case',view:'layers',threat:'phish',_ch:'train'},change:{_ch:'trainFilter'},changeText:'Email filter added in front of training',
     explain:{bio:'The filter lets 40% through, and training stops half of those: 40% × 50% = 20%. Layers do not add up to perfect. Each one shrinks what is left.',honors:'Pass-through chances multiply: (1 − 0.6)(1 − 0.5) = 0.20. Stopping power never adds past 100%.'}},
    {lvl:'bio',instant:true,q:'Avoiding a risk means stopping the activity that causes it. Which avoidance makes sense for the bakery?',
     choices:['Stop using email, to avoid phishing','Keep the laptops in the shop, to avoid laptop theft','Shut down online ordering, to avoid password guessing'],
     correct:['phish','laptop','guess'].map(id=>T_(id).avoid.cost-ALE(id)).reduce((bi,v,i,a)=>v<a[bi]?i:bi,0),
     show(sim){usePreset(sim,'none');BioLab.setValues(sim,{mode:'case',view:'matrix',threat:'laptop'});},
     explain:{bio:'Keeping laptops in the shop gives up about '+money(T_('laptop').avoid.cost)+' a year of convenience to remove '+money(ALE('laptop'))+' of expected loss. Dropping email would cost about '+money(T_('phish').avoid.cost)+' to remove '+money(ALE('phish'))+', and closing online orders costs '+money(T_('guess').avoid.cost)+' to remove '+money(ALE('guess'))+'.'}},
    {lvl:'honors',instant:true,q:'An employee emails the whole customer list to the wrong address. Which part of the CIA triad does that break?',choices:['Confidentiality','Integrity','Availability'],correct:['C','I','A'].indexOf(T_('insider').cia),
     show(sim){usePreset(sim,'none');BioLab.setValues(sim,{mode:'case',view:'matrix',threat:'insider'});},
     explain:{honors:'The list is still correct and still available to the bakery, but people who should not see it now can. That is a loss of confidentiality. Changed prices would be integrity; a dead register would be availability.'}},
    {lvl:'honors',instant:true,q:'You transfer the ransomware risk by buying insurance with a $1,000 deductible. What happens to ransomware’s cost to the bakery?',
     choices:['It drops to zero','On average it goes up a little, but a bad year is capped near the deductible','It stays exactly the same'],correct:ransomT.cost>ransomT.ale?1:0,
     show(sim){usePreset(sim,'ransomT');sim.st.many=simMany(sim,plan(sim),1000,3);BioLab.setValues(sim,{mode:'case',view:'year',threat:'ransom'});},
     explain:{honors:'Without insurance: '+money(ransomT.ale)+' a year on average. With it: premium '+money(premium(0.25,40000))+' + deductibles about '+money(0.25*DED)+' = '+money(ransomT.cost)+'. Insurers charge more than the average loss to cover their costs. You pay for certainty: no single ransomware attack can cost more than '+money(DED)+'.'}},
    {lvl:'honors',q:'Tamper seals and a daily check do not stop someone from installing a card skimmer. Run a year of skimmer attacks with them. What do they change?',
     choices:['Nothing, because they do not stop the attack','How often skimmers get installed','How much damage a skimmer does, because it is caught within a day'],correct:2,
     baseline:{mode:'case',view:'layers',threat:'skimmer',_ch:'none'},change:{_ch:'seal'},changeText:'Tamper seals and daily checks added',
     explain:{honors:'Seals are a <b>detective</b> control. Skimmers still get through at the same rate, but a swapped reader is spotted the next morning instead of after weeks of stolen cards: the damage per incident drops 80%, from $60,000 to $12,000.'}},
    {lvl:'ap',instant:true,q:'MFA costs $250 a year and stops 70% of phishing and 95% of password guessing. How much expected loss does it remove per year?',
     choices:['About $250, the same as it costs','About '+money(Math.round(mfaSave/100)*100),'About $8,000'],correct:1,
     show(sim){usePreset(sim,'mfa');BioLab.setValues(sim,{mode:'case',view:'layers',threat:'phish'});},
     explain:{ap:'Phishing: 0.70 × $6,000 = $4,200. Guessing: 0.95 × $2,000 = $1,900. Total '+money(mfaSave)+' a year. Return on security spending = ('+money(mfaSave)+' − $250) ÷ $250 ≈ '+Math.round(mfaRosi*100)+'%, which is why MFA is one of the first controls security teams recommend.'}},
    {lvl:'ap',instant:true,q:'Run 1,000 years with no controls at all. Compared with the average (mean) year, the typical (median) year is…',
     choices:['cheaper than the average','the same as the average','more expensive than the average'],
     correct:(()=>{const fake={p:{mode:'case'},st:{}};const M=simMany(fake,newPlan(),1000,3);return M.median<M.mean?0:M.median>M.mean?2:1;})(),
     show(sim){usePreset(sim,'none');sim.st.many=simMany(sim,plan(sim),1000,3);BioLab.setValues(sim,{mode:'case',view:'year'});},
     explain:{ap:'The loss distribution is skewed right. Most years see a few small incidents, while rare ransomware or skimmer years cost tens of thousands and pull the mean up. Plan for the median, budget for the tail.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Where should Pinecrest Bakery spend a $2,000 security budget?</p><ol><li>Rate each threat (likelihood and impact) in the panel, then compare with the analyst’s data.</li><li>Choose accept, mitigate, transfer or avoid for each one.</li><li>Buy controls until expected losses drop at least 70% without going over budget.</li><li>Run one year a few times and record a trial after each.</li></ol><p>Write a two-sentence recommendation to the owner: what to buy first and why.</p>',
       honors:'<p><b>Question:</b> How does adding layers change expected loss, and when do you stop buying?</p><ol><li>Start a new plan. Record a trial with no controls.</li><li>Add one control at a time, best value first, recording a trial after each.</li><li>Copy the table as CSV and plot Spent on security (x) against Expected loss with your plan (y).</li></ol><p>Describe the shape of the curve. Where does the next dollar stop buying much safety?</p>',
       ap:'<p><b>Question:</b> Is the cheapest plan the safest one?</p><ol><li>Build two plans with the same spending: one all-preventive, one that transfers the rare, expensive threats.</li><li>For each, run 1,000 years and record the expected loss, total cost of risk and the 1-in-20 bad year.</li><li>Compute return on security spending for each.</li></ol><p><b>Claim–evidence–reasoning:</b> Recommend one plan, using ALE and the 1-in-20 year as evidence.</p>'},
  terms:[{t:'Asset',d:'Anything worth protecting: data, devices, systems, money, reputation.'},{t:'Threat',d:'Something that could cause harm, such as a phishing email or a storm.'},{t:'Risk',d:'How likely a threat is times how bad it would be.'},
    {t:'Defense in depth',d:'Several layers of protection, so one failure does not cause a breach.'},{t:'Accept, mitigate, transfer, avoid',d:'The four ways to treat a risk: live with it, reduce it, insure it, or stop the activity.'},
    {lvl:'honors',t:'CIA triad',d:'Confidentiality (only the right people see it), integrity (it stays correct), availability (it works when needed).'},
    {lvl:'honors',t:'Preventive, detective, corrective',d:'Controls that stop an attack, notice it quickly, or repair the damage afterward.'},{lvl:'honors',t:'Physical, technical, administrative',d:'Locks and guards; software and hardware; policies and training.'},
    {lvl:'ap',t:'ALE = ARO × SLE',d:'Annualized loss expectancy: annual rate of occurrence times single loss expectancy, in dollars per year.'},{lvl:'ap',t:'Return on security spending',d:'(Loss avoided − cost of controls) ÷ cost of controls.'},{lvl:'ap',t:'Residual risk',d:'The risk that remains after controls. It is never zero.'}],
  about:'<p>Each threat has a yearly rate (ARO) and a cost per incident (SLE). The numbers for Pinecrest Bakery are invented but in the range small-business surveys report. Attacks arrive at random (a Poisson process). Each preventive control you buy is one layer that stops an attempt with a fixed chance, independently of the others, so pass-through chances multiply. Detective and corrective controls cut the cost of an incident instead. Insurance pays losses above a $1,000 deductible, with a premium of 1.3 × the expected payout plus $50. Avoiding a threat removes it but costs the stated yearly benefit. Real layers are not fully independent (a tired employee can defeat training and ignore a warning together), real costs vary from incident to incident, and real attackers adapt to defenses.</p><p>The 5 × 5 matrix bands are a common convention: likelihood from rare (under once in 10 years) to almost certain (over 3 times a year), impact from minor (under $500) to critical (over $50,000).</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k){sim.vis.k=k;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const v=sim.p.view;
    if(v==='layers')drawLayers(sim,ctx,k);else if(v==='year')drawYear(sim,ctx,k);else drawMatrix(sim,ctx,k);},
  thumbSetup(sim){THREATS.forEach(t=>{sim.plan.rate[t.id]={L:lRate(t.aro),I:iRate(t.sle)};});},
  next:['firewall','logs']
};
RISK.onLevel=syncMode;
BioLab.register(RISK);
})();

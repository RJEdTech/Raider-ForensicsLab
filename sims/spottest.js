(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* ---------- powders: the properties each presumptive test responds to ---------- */
const SAMP={
  bakingsoda:{name:'Baking soda (NaHCO₃)',lab:['Baking','soda'],sh:['Bak.','soda'],lvl:'bio',sol:'ionic',an:'HCO₃⁻',carb:1,na:1,pH:8.3,powder:'#fbfbf8'},
  cornstarch:{name:'Cornstarch',lab:['Corn-','starch'],sh:['Corn','starch'],lvl:'bio',sol:'insol',starch:1,pH:7.0,char:1,powder:'#fdfdfb'},
  sugar:{name:'Table sugar (sucrose)',lab:['Table','sugar'],sh:['Sugar'],lvl:'bio',sol:'mol',sucrose:1,pH:7.0,char:1,powder:'#ffffff'},
  salt:{name:'Table salt (NaCl)',lab:['Table','salt'],sh:['Salt'],lvl:'bio',sol:'ionic',an:'Cl⁻',na:1,pH:7.0,powder:'#f7f9fb'},
  aspirin:{name:'Aspirin (acetylsalicylic acid)',lab:['Aspirin'],sh:['Aspi-','rin'],lvl:'bio',sol:'slight',acid:{Ka:3.0e-4,M:180.16,sat:3.3},smoke:1,powder:'#fafaf6'},
  caffeine:{name:'Caffeine',lab:['Caffeine'],sh:['Caf-','feine'],lvl:'honors',sol:'mol',pH:6.9,smoke:1,powder:'#fbfbf7'},
  glucose:{name:'Glucose (dextrose)',lab:['Glucose'],sh:['Glu-','cose'],lvl:'honors',sol:'mol',red:1,pH:7.0,char:1,powder:'#ffffff'},
  gelatin:{name:'Gelatin (protein)',lab:['Gelatin'],sh:['Gela-','tin'],lvl:'honors',sol:'insol',prot:1,pH:5.8,char:1,powder:'#f1e8cc'},
  simA:{name:'Simulated drug sample A',lab:['Sim.','sample A'],sh:['Sim.','A'],lvl:'honors',sol:'insol',starch:1,rx:'A',pH:7.0,char:1,powder:'#f6f4f0'},
  simB:{name:'Simulated drug sample B',lab:['Sim.','sample B'],sh:['Sim.','B'],lvl:'honors',sol:'ionic',an:'HCO₃⁻',carb:0.5,na:1,rx:'B',pH:8.3,powder:'#f8f7f2'}
};
const KEYS=Object.keys(SAMP);
const TESTS={
  water:{name:'Water',tests:'whether it dissolves',col:'#dcecf5',lvl:'bio'},
  iodine:{name:'Iodine solution',tests:'starch',col:'#c8892e',lvl:'bio'},
  vinegar:{name:'Vinegar (acetic acid)',tests:'carbonates (fizzing)',col:'#eef0e6',lvl:'bio'},
  ph:{name:'pH paper',tests:'acids and bases',col:'#f0d36a',lvl:'bio'},
  flame:{name:'Flame test',tests:'metal ions such as sodium',col:'#9fb9d6',lvl:'bio'},
  benedict:{name:'Benedict’s solution (heated)',tests:'reducing sugars',col:'#2f63c9',lvl:'honors'},
  biuret:{name:'Biuret reagent',tests:'protein',col:'#4b7fd8',lvl:'honors'},
  rx:{name:'Reagent X (simulated)',tests:'the simulated drug compounds',col:'#efefe8',lvl:'honors'}
};
const TKEYS=Object.keys(TESTS);
const VM=ChemLab.K.Ratm*298.15;          // L/mol of gas at 25 °C and 1 atm
const MNAHCO3=ChemLab.molarMass('NaHCO3');
const VSOL=0.050;                         // L of water the sample is dissolved in for pH

const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixC=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');};
const UI=[[1,'#d32f2f'],[3,'#e65100'],[4,'#ef8f00'],[5,'#f2c200'],[6,'#b5c934'],[7,'#3fa34d'],[8,'#14897a'],[9,'#1f6fc4'],[10,'#3b4fb0'],[12,'#6a3da8']];
function uiColor(pH){if(pH<=UI[0][0])return UI[0][1];for(let i=1;i<UI.length;i++)if(pH<=UI[i][0])return mixC(UI[i-1][1],UI[i][1],(pH-UI[i-1][0])/(UI[i][0]-UI[i-1][0]));return UI[UI.length-1][1];}
function phOf(sp,m){if(sp.acid){const a=sp.acid,C=Math.min(m/a.M/VSOL,a.sat/a.M),Ka=a.Ka,x=(-Ka+Math.sqrt(Ka*Ka+4*Ka*C))/2;return -Math.log10(x);}return sp.pH;}
const co2mL=(sp,m)=>(sp.carb||0)*m/MNAHCO3*VM*1000;
const phWord=pH=>pH<6.5?'acidic':pH>7.5?'basic':'neutral';

/* result of test r on powder sp (sample mass m in g) */
function outcome(sp,r,m){const ap=atLeast('ap'),hon=atLeast('honors');
  if(r==='water'){if(sp.sol==='ionic'||sp.sol==='mol')return {col:'#dfeef6',txt:'Dissolves: clear solution',sh:'dissolves',pos:true};
    if(sp.sol==='slight')return {col:'#e6ecee',cloud:0.45,txt:'Barely dissolves: cloudy, crystals settle',sh:'barely'};
    return {col:'#eef0ee',cloud:0.9,txt:sp.prot?'Does not dissolve: swells and clouds':'Does not dissolve: cloudy white suspension',sh:'cloudy'};}
  if(r==='iodine')return sp.starch?{col:'#1e1b3b',txt:'Blue-black (+ starch)',sh:'+ blue-black',pos:true}:{col:'#c8892e',txt:'Stays amber-brown (−)',sh:'− amber'};
  if(r==='vinegar')return sp.carb?{col:'#e8eef0',fizz:sp.carb,txt:(sp.carb<1?'Fizzes a little':'Fizzes')+': CO₂ bubbles (+ carbonate)',sh:'+ fizz',pos:true}:{col:'#eef0e6',txt:'No bubbles, no change (−)',sh:'− none'};
  if(r==='ph'){const pH=phOf(sp,m),w=phWord(pH);return {col:uiColor(pH),pH,txt:ap?'pH ≈ '+Math.round(pH)+', '+w+' (calculated '+pH.toFixed(1)+')':hon?'pH ≈ '+Math.round(pH)+' ('+w+')':w.charAt(0).toUpperCase()+w.slice(1)+' ('+(w==='acidic'?'red-orange':w==='basic'?'blue-green':'green')+')',sh:'pH '+Math.round(pH),pos:w!=='neutral'};}
  if(r==='flame'){if(sp.na)return {col:'#ffae00',flame:'#ffae00',txt:'Bright yellow-orange flame (sodium)',sh:'+ yellow-orange',pos:true};
    if(sp.smoke)return {col:'#8c8f96',flame:'#5b8fd9',txt:'Melts and smokes; no flame color',sh:'− smokes'};
    return {col:'#5a4a3a',flame:'#5b8fd9',txt:sp.prot?'Chars, smells like burnt hair; no flame color':'Melts and chars black; no flame color',sh:'− chars'};}
  if(r==='benedict')return sp.red?{col:'#a8341f',txt:'Brick red (+ reducing sugar)',sh:'+ brick red',pos:true}:{col:'#2f63c9',txt:'Stays blue (−)',sh:'− blue'};
  if(r==='biuret')return sp.prot?{col:'#7b3fb0',txt:'Violet (+ protein)',sh:'+ violet',pos:true}:{col:'#4b7fd8',txt:'Stays blue (−)',sh:'− blue'};
  if(sp.rx==='A')return {col:'#5a2a8a',txt:'Deep purple (+, presumptive)',sh:'+ purple',pos:true};
  if(sp.rx==='B')return {col:'#c0641f',txt:'Orange-brown (+, presumptive)',sh:'+ orange',pos:true};
  if(sp.char&&!sp.prot)return {col:'#b89a6a',slow:true,txt:'Faint brown after a minute (false positive)',sh:'± faint brown',pos:true};
  return {col:'#eeeeea',txt:'No color change (−)',sh:'− none'};}

/* ---------- sample list, evidence, wells ---------- */
function visKeys(){return KEYS.filter(k=>atLeast(SAMP[k].lvl));}
function wells(sim){return visKeys().concat(['ev']);}
const spOf=(sim,k)=>k==='ev'?SAMP[sim.st.ev]:SAMP[k];
const nameOf=(sim,k)=>k==='ev'?'Evidence powder':SAMP[k].name;
function pickEvidence(sim){const pool=visKeys(),r=rng(sim.st.round*97+13);let k=pool[Math.floor(r()*pool.length)];if(sim.st.round===1)k=atLeast('honors')?'simA':'bakingsoda';sim.st.ev=k;}
function wellPos(i,n){const per=6,row=n<=per?0:Math.floor(i/per),col=n<=per?i:i%per,cols=n<=per?n:(row===0?per:n-per);const x0=258-(cols-1)*40;return {x:x0+col*80,y:n<=per?196:(row?262:128)};}
function testsVis(){return TKEYS.filter(k=>atLeast(TESTS[k].lvl));}

function addWell(sim,k,delay){const st=sim.st,r=sim.p.test;st.w[r]=st.w[r]||{};if(st.w[r][k])return;st.w[r][k]={t:0,delay:delay||0,heat:0};st.drops.push({k,t:0,delay:delay||0});}
function progress(sim,r,w,sp){const o=outcome(sp,r,sim.p.mass);const mixT=1.0,need=r==='benedict'?2.4:o.slow?3.0:r==='flame'?1.2:0;const t=w.t-w.delay;return {o,mix:clamp(t/mixT,0,1),dev:need?clamp((t-mixT)/need,0,1):(t>=mixT?1:0),done:t>=mixT+need};}
function record(sim,r,k){const sp=spOf(sim,k);const o=outcome(sp,r,sim.p.mass);sim.st.res[k]=sim.st.res[k]||{};const prev=sim.st.res[k][r];if(!prev||prev.txt!==o.txt){sim.st.res[k][r]=o;sim.infoDirty=true;}}
function resOf(sim,k,r){const o=sim.st.res[k]&&sim.st.res[k][r];return o||null;}
function selRes(sim){return resOf(sim,sim.p.sample,sim.p.test);}

const SPOT={
  id:'spottest',hash:'spottest',apUnit:16,order:3,kind:'Virtual lab',tab:'Color spot tests',
  prereq:[],next:['spectroscopy','chromatography','toxicology'],
  card:'Run presumptive color and fizz tests on white powders, fill in an evidence table, and identify the powder found at the scene.',
  title:'Spot tests: identify the white powder',
  lede:{bio:'Many white powders look exactly alike. Simple chemical tests (iodine, vinegar, pH paper, a flame) each react with one kind of substance, so together they narrow down what a powder is.',
        honors:'Add Benedict’s, biuret and a simulated drug reagent. Use positive and negative results together, and watch for false positives.',
        ap:'Make the tests quantitative: calculate the CO₂ volume and pH from the sample mass, and decide what counts as presumptive versus confirmatory evidence.'},
  scale:'Real lab scale: a white ceramic spot plate with wells about 2 cm across, each holding a pinch of powder (0.05–0.5 g) and a few drops of reagent.',
  timeless:true,animated:true,graph:false,chReveal:4,controlsTitle:'Lab bench',
  controls:[
    {id:'test',label:'Test',type:'seg',def:'iodine',lvl:'bio',options:TKEYS.map(k=>({v:k,l:{water:'Water',iodine:'Iodine',vinegar:'Vinegar',ph:'pH paper',flame:'Flame',benedict:'Benedict’s',biuret:'Biuret',rx:'Reagent X'}[k],lvl:TESTS[k].lvl==='bio'?undefined:TESTS[k].lvl})),
     help:'Each test reacts with one kind of substance.'},
    {id:'sample',label:'Selected powder',type:'select',def:'ev',lvl:'bio',options:KEYS.map(k=>({v:k,l:SAMP[k].name,lvl:SAMP[k].lvl==='bio'?undefined:SAMP[k].lvl})).concat([{v:'ev',l:'Evidence powder (unknown)'}])},
    {id:'mass',label:'Sample mass',type:'range',min:0.05,max:0.5,step:0.05,def:0.2,unit:' g',lvl:'ap',help:'Used for the CO₂ volume (vinegar) and the pH (dissolved in 50 mL water).'}
  ],
  actions:[
    {id:'add',label:'Test the selected powder',primary:true,run(sim){addWell(sim,sim.p.sample,0);}},
    {id:'all',label:'Test every powder',run(sim){wells(sim).forEach((k,i)=>addWell(sim,k,i*0.1));}},
    {id:'clean',label:'Clean this test’s wells',run(sim){sim.st.w[sim.p.test]={};sim.st.drops=[];}},
    {id:'newev',label:'New evidence powder',run(sim){const st=sim.st;st.round++;pickEvidence(sim);TKEYS.forEach(r=>{if(st.w[r])delete st.w[r].ev;});delete st.res.ev;sim.infoDirty=true;}}
  ],
  init(sim){const st={round:(sim.st&&sim.st.round)||1,ev:'bakingsoda',w:{},res:{},drops:[]};sim.st=st;pickEvidence(sim);
    if(!sim._opened){sim._opened=true;st.w.iodine={};wells(sim).forEach(k=>{st.w.iodine[k]={t:5,delay:0,heat:0};record(sim,'iodine',k);});}return st;},
  step(sim,dt){const st=sim.st;TKEYS.forEach(r=>{const W=st.w[r];if(!W)return;Object.keys(W).forEach(k=>{const w=W[k];w.t+=dt;const pr=progress(sim,r,w,spOf(sim,k));if(pr.done)record(sim,r,k);});});
    st.drops=st.drops.filter(d=>(d.t+=dt)<0.7+d.delay);},
  onLevel(sim){if(!wells(sim).includes(sim.p.sample))BioLab.setValues(sim,{sample:'ev'});},
  metrics:[
    {id:'sel',label:'Selected powder',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>nameOf(s,s.p.sample)},
    {id:'res',label:'Result',unit:'',lvl:'bio',text:true,get:s=>{const o=selRes(s);if(o)return o.txt;const W=s.st.w[s.p.test];return W&&W[s.p.sample]?'Reacting…':'Not tested yet';}},
    {id:'done',label:'Evidence table',unit:'',lvl:'bio',text:true,noTrial:true,get:s=>{const ks=wells(s),ts=testsVis();let n=0;ks.forEach(k=>ts.forEach(r=>{if(resOf(s,k,r))n++;}));return n+' of '+ks.length*ts.length+' results recorded';}},
    {id:'ph',label:'pH of the solution',unit:'',lvl:'ap',min:0,max:14,d:1,get:s=>{const o=resOf(s,s.p.sample,'ph');return o?o.pH:null;}},
    {id:'co2',label:'CO₂ released with vinegar',unit:'mL',lvl:'ap',min:0,max:150,d:1,get:s=>{const o=resOf(s,s.p.sample,'vinegar');return o?co2mL(spOf(s,s.p.sample),s.p.mass):null;}}
  ],
  infoPanel(sim){const ks=wells(sim),ts=testsVis();
    let h='<div class="p-head"><h3>Evidence table</h3></div><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Powder</th>'+ts.map(r=>'<th style="text-align:left">'+TESTS[r].name.replace(' (simulated)','').replace(' (heated)','').replace(' (acetic acid)','').replace(' solution','')+'</th>').join('')+'</tr></thead><tbody>';
    ks.forEach(k=>{h+='<tr><td style="text-align:left">'+(k==='ev'?'<b>Evidence powder</b>':SAMP[k].name)+'</td>'+ts.map(r=>{const o=resOf(sim,k,r);if(!o)return '<td></td>';
      return '<td style="text-align:left"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:5px;background:'+o.col+';border:1px solid rgba(0,0,0,.25)"></span>'+o.sh+'</td>';}).join('')+'</tr>';});
    h+='</tbody></table></div><p class="help" style="margin-top:8px">'+(atLeast('honors')?'Every result here is <b>presumptive</b>: it suggests what a powder contains. Confirm an identification with a spectrum (IR or mass spectrometry).':'Compare the evidence row with each known powder. A powder that matches on every test is the most likely identity.')+'</p>';
    return h;},
  challenges(sim){const ev=SAMP[sim.st.ev],r=rng(sim.st.round*7+3),pool=KEYS.filter(k=>k!==sim.st.ev).sort(()=>r()-0.5).slice(0,3);
    const words=TKEYS.map(t=>TESTS[t].name.replace(' (simulated)','').replace(' (heated)','').replace(' (acetic acid)','')+': '+outcome(ev,t,0.2).sh).join('; ');
    const opts=[sim.st.ev].concat(pool).map(k=>({k,s:r()})).sort((a,b)=>a.s-b.s).map(o=>o.k);
    const V=co2mL(SAMP.bakingsoda,0.2),VB=co2mL(SAMP.simB,0.2),ph=phOf(SAMP.aspirin,0.1);
    const fmtV=v=>(v<10?v.toFixed(1):v.toFixed(0))+' mL';
    return [
    {lvl:'bio',q:'You add iodine to the cornstarch. What color will it turn?',choices:['Stays amber-brown','Blue-black','Bright red'],correct:1,
     baseline:{test:'iodine',sample:'cornstarch'},at:0.6,changeAction:'add',changeText:'Iodine dropped on the cornstarch',reveal:3.2,
     explain:{bio:'Cornstarch is starch. Iodine slips inside the coiled starch molecule and the pair turns blue-black.',honors:'Starch’s amylose chains coil into helices. Triiodide ions (I₃⁻) line up inside the helix, and that complex absorbs most visible light, so it looks blue-black.'}},
    {lvl:'bio',q:'You add vinegar to the table salt. What happens?',choices:['It fizzes, like baking soda','Nothing you can see','It turns blue-black'],correct:1,
     baseline:{test:'vinegar',sample:'salt'},at:0.6,changeAction:'add',changeText:'Vinegar dropped on the salt',reveal:3.2,
     explain:{bio:'Vinegar is an acid, but acid only fizzes with carbonates and bicarbonates, which release carbon dioxide gas. Salt (NaCl) has no carbonate, so nothing happens. Not every white powder reacts with acid.'}},
    {lvl:'bio',q:'You dip pH paper into dissolved baking soda. What does it show?',choices:['Acidic (red-orange)','Neutral (green)','Basic (blue-green)'],correct:2,
     baseline:{test:'ph',sample:'bakingsoda'},at:0.6,changeAction:'add',changeText:'pH paper dipped in baking soda solution',reveal:3.2,
     explain:{bio:'Baking soda is a weak base. Its solution has a pH of about 8, so the paper turns blue-green.',ap:'HCO₃⁻ is amphiprotic. Its solution’s pH is about ½(pKa₁ + pKa₂) = ½(6.35 + 10.33) ≈ 8.3, almost independent of concentration.'}},
    {lvl:'bio',instant:true,q:'Iodine turns the evidence powder blue-black. Does that prove the evidence is cornstarch?',choices:['Yes: only cornstarch turns blue-black','No: it shows starch is present, and flour, potato starch or a mixture cut with starch would also turn blue-black'],correct:1,
     explain:{bio:'A spot test is <b>presumptive</b>: it detects a kind of substance, not one exact powder. You need several tests, and a confirmatory test, before you name it.'}},
    {lvl:'bio',instant:true,q:'Table sugar and table salt both dissolve and look clear in water. Which test tells them apart?',choices:['Iodine','Vinegar','Flame test'],correct:2,
     explain:{bio:'Salt contains sodium ions, which give a bright yellow-orange flame. Sugar has no metal ion; it melts and chars black. Iodine and vinegar give negative results for both.'}},
    {lvl:'honors',q:'You test table sugar (sucrose) with Benedict’s solution and heat it. What color will it be?',choices:['Brick red, because it is a sugar','Still blue','Violet'],correct:1,
     baseline:{test:'benedict',sample:'sugar'},at:0.5,changeAction:'add',changeText:'Benedict’s added and heated',reveal:4.5,
     explain:{honors:'Benedict’s detects <b>reducing</b> sugars like glucose. In sucrose, the glucose and fructose units are joined through their reducing groups, so it cannot reduce Cu²⁺. Glucose turns brick red; table sugar stays blue.'}},
    {lvl:'honors',q:'Salt gives a bright yellow-orange flame. What color flame will baking soda give?',choices:['No color: it is not salt','The same yellow-orange','Green'],correct:1,
     baseline:{test:'flame',sample:'bakingsoda'},at:0.5,changeAction:'add',changeText:'Baking soda held in the flame',reveal:3.4,
     explain:{honors:'The flame color comes from the metal ion, not the whole compound. Both NaCl and NaHCO₃ contain Na⁺. Heat excites sodium’s outer electron, and as it falls back it emits light at 589 nm.'}},
    {lvl:'honors',q:'Reagent X turns purple or orange with the simulated drug samples. What does it do with plain table sugar?',choices:['Nothing at all','It slowly turns faint brown, a false positive','It turns deep purple'],correct:1,
     baseline:{test:'rx',sample:'sugar'},at:0.5,changeAction:'add',changeText:'Reagent X added to table sugar',reveal:5,
     explain:{honors:'Color reagents contain strong acid that slowly chars sugars brown. A careless reading could call that positive. That is a <b>false positive</b>, and one reason color tests are only presumptive.'}},
    {lvl:'honors',instant:true,q:'The evidence powder gave these results. '+words+'. What is it?',choices:opts.map(k=>SAMP[k].name),correct:opts.indexOf(sim.st.ev),
     explain:{honors:'Match the whole pattern, not one test. '+ev.name+' gives exactly this set of results. Then confirm with a spectrum before writing it in a report.'}},
    {lvl:'ap',instant:true,q:'0.20 g of baking soda reacts completely with excess vinegar at 25 °C and 1 atm. About how much CO₂ forms?',choices:[fmtV(V),fmtV(V/2),fmtV(V*2),fmtV(V/10)],correct:0,
     explain:{ap:'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂. n = 0.20 g ÷ '+MNAHCO3.toFixed(2)+' g/mol = '+(0.2/MNAHCO3*1000).toFixed(2)+' mmol of CO₂ (1 : 1). V = nRT/P = '+(0.2/MNAHCO3).toExponential(2)+' mol × '+VM.toFixed(2)+' L/mol = '+fmtV(V)+'. Set the mass to 0.20 g and test baking soda with vinegar to see the readout.'}},
    {lvl:'ap',instant:true,q:'0.20 g of Simulated sample B releases '+fmtV(VB)+' of CO₂ with excess vinegar (25 °C, 1 atm). 0.20 g of pure baking soda releases '+fmtV(V)+'. What percent of sample B is baking soda?',choices:['25%','50%','75%','100%'],correct:1,
     explain:{ap:VB.toFixed(1)+' ÷ '+V.toFixed(1)+' = 0.50, so half of the sample’s mass is NaHCO₃. The other half is the cutting agent and the simulated compound, which do not react with acid.'}},
    {lvl:'ap',instant:true,q:'0.10 g of aspirin (Ka = 3.0 × 10⁻⁴, 180.16 g/mol) dissolves in 50 mL of water. What is the pH?',choices:['about 1.0','about '+ph.toFixed(1),'about 4.5','about 7.0'],correct:1,
     explain:{ap:'C = 0.10 ÷ 180.16 ÷ 0.050 = 0.0111 M. Solve x²/(C − x) = Ka: x = [H⁺] = '+Math.pow(10,-ph).toExponential(2)+' M, so pH = '+ph.toFixed(2)+'. Aspirin is a weak acid, so it ionizes only about '+(Math.pow(10,-ph)/0.0111*100).toFixed(0)+'%.'}},
    {lvl:'ap',instant:true,q:'Which result could confirm the identity of Simulated sample A in a crime-lab report?',choices:['A deep purple color with Reagent X','A blue-black iodine result','An IR or mass spectrum that matches a reference standard'],correct:2,
     explain:{ap:'Color and fizz tests are presumptive: several substances can give the same result. A confirmatory test measures the molecule’s structure, such as GC–MS or IR spectroscopy compared with a reference (see the Spectroscopy tool).'}}];},
  narrate(sim){const r=sim.p.test,T=TESTS[r],k=sim.p.sample,sp=spOf(sim,k),W=sim.st.w[r]||{},w=W[k],nm=k==='ev'?'the evidence powder':SAMP[k].name.replace(/ \(.*\)/,'').toLowerCase();
    if(!Object.keys(W).length)return 'The '+T.name.replace(' (simulated)','')+' test detects <b>'+T.tests+'</b>. Test the selected powder, or every powder, and compare the results.';
    if(!w)return 'Select a tested well, or test '+nm+' to see its result.';
    const pr=progress(sim,r,w,sp),o=pr.o;
    if(!pr.done){if(r==='benedict'&&pr.mix>=1)return '<b>Heating…</b> Benedict’s only reacts when hot. Reducing sugars change blue Cu²⁺ into red-orange Cu₂O.';
      if(o.slow&&pr.mix>=1)return 'Watch closely. Something is slowly happening in this well.';return 'Mixing the '+T.name.replace(' (simulated)','').toLowerCase()+' with '+nm+'…';}
    const why={water:o.pos?'Its particles spread out among the water molecules.':'Its particles stay clumped together, so the water stays cloudy.',
      iodine:o.pos?'Iodine is trapped inside coiled starch molecules.':'There is no starch for the iodine to bind.',
      vinegar:o.pos?'The acid turns carbonate into carbon dioxide gas.':'There is no carbonate to release gas.',
      ph:o.pos?(o.pH<7?'The powder releases H⁺ ions into the water.':'The powder takes H⁺ from water, leaving OH⁻.'):'It neither releases nor takes up H⁺.',
      flame:o.pos?'Heat excites the electrons in sodium ions, and they give off yellow-orange light as they fall back.':'There is no metal ion to color the flame.',
      benedict:o.pos?'The sugar’s free aldehyde reduces Cu²⁺ to red Cu₂O.':'There is no reducing sugar to change the copper.',
      biuret:o.pos?'Cu²⁺ binds to the peptide bonds in protein.':'There are no peptide bonds for Cu²⁺ to bind.',
      rx:o.slow?'This is a <b>false positive</b>: acid in the reagent chars sugar.':o.pos?'The simulated compound reacts to make a colored product. This is only presumptive.':'Nothing in this powder reacts with the reagent.'}[r];
    return (k==='ev'?'Evidence':SAMP[k].name.replace(/ \(.*\)/,''))+': <b>'+o.txt+'</b>. '+why;},
  tour:[
    {title:'Presumptive tests',text:'Each well holds a pinch of a white powder. The last one is the evidence from the scene. A presumptive test tells you what kind of substance <b>might</b> be present. Goggles on, and never taste or sniff an unknown.',focus:[16,54,486,318],speed:1,setup(sim){BioLab.reset(sim);BioLab.setValues(sim,{test:'water',sample:'ev'});}},
    {title:'Does it dissolve?',text:'Water first. Salt, sugar and baking soda dissolve and look clear. Cornstarch stays cloudy. Aspirin barely dissolves.',focus:[16,54,486,318],speed:1,setup(sim){BioLab.setValues(sim,{test:'water',sample:'cornstarch'});act(sim,'all');}},
    {title:'Iodine finds starch',text:'Iodine is amber-brown. In the particle view, iodine ions slip inside the coiled starch molecule and the pair turns blue-black.',focus:[[16,54,486,318],[540,20,222,236]],speed:1,setup(sim){BioLab.setValues(sim,{test:'iodine',sample:'cornstarch'});act(sim,'all');}},
    {title:'Vinegar finds carbonates',text:'Acetic acid reacts with bicarbonate to make carbon dioxide gas, so baking soda fizzes. Powders without carbonate do nothing.',focus:[[16,54,486,318],[540,20,222,236]],speed:1,setup(sim){BioLab.setValues(sim,{test:'vinegar',sample:'bakingsoda'});act(sim,'all');}},
    {title:'pH paper',text:'The paper’s color shows the pH. Aspirin is an acid (red-orange). Baking soda is a weak base (blue-green). Most of the others are neutral (green).',focus:[16,54,486,318],speed:1,setup(sim){BioLab.setValues(sim,{test:'ph',sample:'aspirin'});act(sim,'all');}},
    {title:'Flame test',text:'A wire loop holds each powder in a burner flame. Sodium compounds glow yellow-orange. The color comes from electrons in Na⁺ falling back to a lower energy level.',focus:[[16,54,486,318],[540,20,222,236]],speed:1,setup(sim){BioLab.setValues(sim,{test:'flame',sample:'salt'});act(sim,'all');}},
    {lvl:'honors',title:'Benedict’s needs heat',text:'Benedict’s tests for reducing sugars. Glucose turns brick red after heating, but table sugar (sucrose) stays blue.',focus:[16,54,486,318],speed:1,setup(sim){BioLab.setValues(sim,{test:'benedict',sample:'glucose'});act(sim,'all');}},
    {lvl:'ap',title:'Presumptive, not proof',text:'Reagent X colors the simulated drug samples, but it also browns sugar slowly. Color tests narrow the list. A spectrum matched to a reference confirms the identity.',focus:[16,54,486,318],speed:1,setup(sim){BioLab.setValues(sim,{test:'rx',sample:'simA'});act(sim,'all');}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{test:'iodine',sample:'ev',mass:0.2});BioLab.reset(sim);},
  onChallenge(sim,ch,phase){if(!ch||!ch.instant||phase!=='done')return;
    if(/baking soda reacts completely/.test(ch.q)){BioLab.setValues(sim,{test:'vinegar',sample:'bakingsoda',mass:0.2});finishWell(sim,'vinegar','bakingsoda');}
    else if(/Simulated sample B releases/.test(ch.q)){BioLab.setValues(sim,{test:'vinegar',sample:'simB',mass:0.2});finishWell(sim,'vinegar','simB');}
    else if(/aspirin \(Ka/.test(ch.q)){BioLab.setValues(sim,{test:'ph',sample:'aspirin',mass:0.1});finishWell(sim,'ph','aspirin');}},
  lab:{bio:'<p><b>Question:</b> What is the evidence powder?</p><p>Safety: goggles on. Never taste, touch or sniff an unknown powder.</p><ol><li>For each test, press “Test every powder”.</li><li>Fill in the evidence table: + or − for each powder.</li><li>Find the known powder whose row matches the evidence row on every test.</li><li>Press “New evidence powder” and solve a new case.</li></ol><p>Write: “The evidence is most likely ___ because ___.”</p>',
       honors:'<p><b>Question:</b> Which tests do you actually need?</p><ol><li>Run all eight tests on every powder, including the two simulated drug samples.</li><li>For each test, name a positive control and a negative control.</li><li>Find the smallest set of tests that tells all ten powders apart.</li><li>Identify three new evidence powders using only that set.</li></ol><p>Explain why a positive Reagent X result is not proof that a drug is present.</p>',
       ap:'<p><b>Question:</b> How much baking soda is in Simulated sample B?</p><ol><li>Test pure baking soda with vinegar at masses from 0.05 to 0.50 g. Record the CO₂ volume each time.</li><li>Graph volume against mass and find the slope (mL per g).</li><li>Test sample B at three masses and calculate its percent NaHCO₃.</li><li>Calculate the pH of aspirin solutions at 0.05, 0.10 and 0.20 g, and explain why the pH stops falling.</li></ol><p><b>Claim–evidence–reasoning:</b> State sample B’s composition and say which confirmatory test a crime lab would run next.</p>'},
  terms:[{t:'Presumptive test',d:'A quick test that suggests what a substance might be. It can give false positives.'},{t:'Confirmatory test',d:'A test that identifies a specific substance, such as a mass spectrum matched to a reference.'},
    {t:'Positive / negative result',d:'A positive result shows the reaction (color change, gas, flame color). A negative result shows no reaction.'},{t:'Starch–iodine test',d:'Iodine turns blue-black with starch.'},
    {t:'Carbonate test',d:'Acids release CO₂ gas from carbonates and bicarbonates, so the sample fizzes.'},{t:'Flame test',d:'Metal ions give characteristic flame colors. Sodium is yellow-orange (589 nm).'},{t:'Evidence table',d:'A grid of every powder’s result for every test.'},
    {lvl:'honors',t:'False positive',d:'A positive result when the target substance is absent.'},{lvl:'honors',t:'Reducing sugar',d:'A sugar with a free aldehyde or ketone group (glucose, not sucrose) that reduces Cu²⁺ in Benedict’s.'},
    {lvl:'honors',t:'Control',d:'A sample known to be positive or negative, run beside the unknown to show the test works.'},
    {lvl:'ap',t:'Amphiprotic',d:'Able to donate or accept H⁺. HCO₃⁻ is amphiprotic, so baking soda solutions sit near pH 8.3.'},{lvl:'ap',t:'Molar volume',d:'Volume of one mole of gas: about 24.5 L at 25 °C and 1 atm, from V = nRT/P.'}],
  about:'<p><b>Model.</b> Each powder has a fixed set of properties (soluble or not, starch, carbonate, sodium, reducing sugar, protein, acid strength). Each test reads one property, and the well color and text come from it. CO₂ volume uses NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂ with V = nRT/P at 25 °C and 1 atm ('+VM.toFixed(2)+' L/mol). Aspirin’s pH solves the weak-acid equilibrium with Ka = 3.0 × 10⁻⁴ in 50 mL of water, capped at its solubility (about 3.3 g/L). Baking soda solutions sit near pH 8.3.</p><p><b>Simplified.</b> Colors are idealized and reactions finish in seconds. pH paper really reads to about one unit; the calculated value is shown at Deep dive. Reagent X is invented: it stands in for real presumptive drug reagents and reacts only with the two simulated samples (and slowly browns sugars, the way strong acid chars them). Simulated samples A and B are mixtures of a fictional compound with cornstarch or baking soda; no real drugs are modeled. Real crime labs confirm every presumptive result with an instrument.</p>',
  initVis(sim){},
  onClick(sim,x,y){const ws=wells(sim);ws.forEach((k,i)=>{const P=wellPos(i,ws.length);if(Math.hypot(x-P.x,y-P.y)<34)BioLab.setValues(sim,{sample:k});});},
  draw(sim,ctx,vdt,k,t){const st=sim.st,r=sim.p.test,T=TESTS[r],ws=wells(sim),selK=sim.p.sample,W=st.w[r]||{},small=k>1.4;
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,386,800,64);
    txt(ctx,small?T.name.replace(/ \(.*\)/,'').replace(' solution',''):T.name.replace(' (heated)','')+' · tests for '+T.tests.replace(' such as sodium','').replace(' (fizzing)',''),20,32,{s:14*k,w:700});
    // spot plate
    ctx.fillStyle='rgba(0,0,0,.12)';rr(ctx,20,58,486,320,16);ctx.fill();ctx.fillStyle='#f6f6f2';rr(ctx,16,54,486,320,16);ctx.fill();ctx.strokeStyle='#cfcfc6';ctx.lineWidth=1.5;ctx.stroke();
    ws.forEach((key,i)=>{const P=wellPos(i,ws.length),sp=spOf(sim,key),w=W[key];
      ctx.fillStyle='#dedfd8';ctx.beginPath();ctx.arc(P.x,P.y,30,0,6.29);ctx.fill();const gw=ctx.createRadialGradient(P.x-6,P.y-8,4,P.x,P.y,28);gw.addColorStop(0,'#fbfbf8');gw.addColorStop(1,'#e3e3dc');ctx.fillStyle=gw;ctx.beginPath();ctx.arc(P.x,P.y,27,0,6.29);ctx.fill();
      if(!w){// dry powder
        ctx.fillStyle=sp.powder;ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(P.x,P.y+4,15,10,0,0,6.29);ctx.fill();ctx.stroke();
        ctx.fillStyle='rgba(0,0,0,.07)';for(let j=0;j<7;j++){ctx.beginPath();ctx.arc(P.x-9+((j*37)%19),P.y+((j*23)%11)-1,1.3,0,6.29);ctx.fill();}}
      else{const pr=progress(sim,r,w,sp),o=pr.o,tt=w.t-w.delay;
        if(r==='flame'){ctx.fillStyle='#e9e3d9';ctx.beginPath();ctx.ellipse(P.x,P.y+4,15,10,0,0,6.29);ctx.fill();if(tt>0){const c=pr.dev>0?mixC('#5b8fd9',o.flame,pr.dev):'#5b8fd9';drawFlame(ctx,P.x,P.y+12,12,40,c,t+i);}}
        else if(r==='ph'){ctx.fillStyle='#dfeef6';ctx.beginPath();ctx.arc(P.x,P.y,22,0,6.29);ctx.fill();if(tt>0){ctx.fillStyle=mixC(T.col,o.col,pr.mix);ctx.fillRect(P.x-6,P.y-24,12,40);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.strokeRect(P.x-6,P.y-24,12,40);}}
        else{const base=mixC(sp.powder,T.col,Math.min(1,pr.mix*1.6));let c=mixC(base,o.col,r==='benedict'||o.slow?pr.dev:pr.mix);if(tt<=0)c=sp.powder;
          ctx.fillStyle=c;ctx.beginPath();ctx.arc(P.x,P.y,22,0,6.29);ctx.fill();
          if(o.cloud&&pr.mix>0){ctx.fillStyle='rgba(255,255,255,'+(0.55*o.cloud*pr.mix)+')';ctx.beginPath();ctx.arc(P.x,P.y,22,0,6.29);ctx.fill();ctx.fillStyle='rgba(200,200,195,.8)';for(let j=0;j<6;j++){ctx.beginPath();ctx.arc(P.x-10+((j*29)%21),P.y+8+((j*13)%8),1.8,0,6.29);ctx.fill();}}
          if(o.fizz&&pr.mix>0.2){ctx.save();ctx.beginPath();ctx.arc(P.x,P.y,22,0,6.29);ctx.clip();ctx.strokeStyle='rgba(90,120,140,.7)';ctx.lineWidth=1.2;const n=Math.round(10*o.fizz);for(let j=0;j<n;j++){const ph=((RM?0.5:t*0.9)+j*0.137)%1,bx=P.x-16+((j*53)%32),by=P.y+20-ph*42;ctx.beginPath();ctx.arc(bx,by,1.6+((j*7)%3),0,6.29);ctx.stroke();}ctx.restore();}
          if(r==='benedict'&&pr.mix>=1&&!pr.done&&!RM){ctx.strokeStyle='rgba(150,160,170,.7)';ctx.lineWidth=2;for(let j=0;j<3;j++){const yy=P.y-34-((t*20+j*9)%18);ctx.beginPath();ctx.moveTo(P.x-10+j*10,yy+10);ctx.quadraticCurveTo(P.x-4+j*10,yy+4,P.x-10+j*10,yy);ctx.stroke();}}}}
      if(key===selK){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(P.x,P.y,34,0,6.29);ctx.stroke();}
      const lines=key==='ev'?(small?['Evi-','dence']:['Evidence']):(small?SAMP[key].sh:SAMP[key].lab),fs=12*k;
      lines.forEach((ln,j)=>txt(ctx,ln,P.x,P.y+48+j*(fs+1),{s:fs,w:key===selK||key==='ev'?800:600,a:'center',c:key==='ev'?'#a8102a':'#33343a'}));});
    // droppers
    st.drops.forEach(d=>{const tt=d.t-d.delay;if(tt<0||r==='flame'||r==='ph')return;const i=ws.indexOf(d.k);if(i<0)return;const P=wellPos(i,ws.length);
      ctx.fillStyle='#555';rr(ctx,P.x-3,P.y-62,6,26,2);ctx.fill();ctx.fillStyle='#2b2b2b';rr(ctx,P.x-6,P.y-72,12,12,4);ctx.fill();ctx.fillStyle=T.col;const yy=P.y-34+((tt*70)%26);ctx.beginPath();ctx.arc(P.x,yy,3,0,6.29);ctx.fill();});
    if(!small)txt(ctx,'Goggles on · never taste or sniff an unknown',259,366,{s:12*k,c:'#6a6a70',a:'center'});
    drawParticles(sim,ctx,k,t);
    // symbolic view on the bench
    const eq=equation(sim);pill(ctx,eq,400,418,PAL['card'],PAL['cv-ink'],(small?12.5:13.5)*k);},
  thumbSetup(sim){BioLab.setValues(sim,{test:'iodine'});wells(sim).forEach(k=>{addWell(sim,k,0);sim.st.w.iodine[k].t=3;});}
};
function act(sim,id){SPOT.actions.find(a=>a.id===id).run(sim);}
function finishWell(sim,r,k){const st=sim.st;st.w[r]=st.w[r]||{};st.w[r][k]={t:9,delay:0,heat:0};record(sim,r,k);}
function drawFlame(ctx,x,y,w,h,c,t){const f=RM?0:Math.sin(t*9)*2;ctx.save();ctx.globalAlpha=0.9;const g=ctx.createLinearGradient(0,y,0,y-h);g.addColorStop(0,c);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w,y-h*0.5,x+f,y-h);ctx.quadraticCurveTo(x+w,y-h*0.5,x+w,y);ctx.closePath();ctx.fill();ctx.restore();}

/* symbolic view: one line for the current test and powder */
function equation(sim){const r=sim.p.test,k=sim.p.sample,sp=spOf(sim,k),tested=!!resOf(sim,k,r)||!!((sim.st.w[r]||{})[k]);
  if(!tested)return 'Test the selected powder to see the chemistry';
  if(r==='water'){if(sp.sol==='ionic')return sp.an==='Cl⁻'?'NaCl(s) → Na⁺(aq) + Cl⁻(aq)':'NaHCO₃(s) → Na⁺(aq) + HCO₃⁻(aq)';
    if(sp.sol==='mol')return k==='caffeine'||sim.st.ev==='caffeine'&&k==='ev'?'C₈H₁₀N₄O₂(s) → C₈H₁₀N₄O₂(aq)':sp.red?'C₆H₁₂O₆(s) → C₆H₁₂O₆(aq)':'C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq)';
    if(sp.sol==='slight')return 'C₉H₈O₄(s) ⇌ C₉H₈O₄(aq): only about 3 g dissolves per liter';return 'No dissolving: the particles stay clumped and scatter light';}
  if(r==='iodine')return sp.starch?'starch(s) + I₃⁻(aq) → starch–I₃⁻ complex (blue-black)':'No starch: I₃⁻(aq) stays amber-brown';
  if(r==='vinegar')return sp.carb?'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂(g)':'No carbonate, so no CO₂ forms';
  if(r==='ph'){const pH=phOf(sp,sim.p.mass);if(sp.acid)return 'C₉H₈O₄(aq) ⇌ H⁺(aq) + C₉H₇O₄⁻(aq)   pH ≈ '+pH.toFixed(1);if(sp.carb)return 'HCO₃⁻(aq) + H₂O(l) ⇌ H₂CO₃(aq) + OH⁻(aq)   pH ≈ 8.3';return 'About as many H₃O⁺ as OH⁻: pH ≈ '+Math.round(pH);}
  if(r==='flame')return sp.na?'Na⁺ electron: excited state → ground state + light (589 nm)':'No metal ion: no flame color';
  if(r==='benedict')return sp.red?'2 Cu²⁺(aq, blue) + glucose → Cu₂O(s, brick red)':sp.sucrose?'Sucrose has no free aldehyde: Cu²⁺ stays blue':'No reducing sugar: Cu²⁺ stays blue';
  if(r==='biuret')return sp.prot?'Cu²⁺(aq) + peptide bonds → violet complex':'No peptide bonds: Cu²⁺ stays blue';
  if(sp.rx)return 'Reagent X + simulated compound '+sp.rx+' → colored product (presumptive)';return sp.char&&!sp.prot?'Strong acid slowly chars sugar: a false positive':'Nothing reacts with Reagent X';}

/* particle view: a stateless scene drawn from the test, the powder and its progress */
function drawParticles(sim,ctx,k,t){const r=sim.p.test,key=sim.p.sample,sp=spOf(sim,key),w=(sim.st.w[r]||{})[key],pr=w?progress(sim,r,w,sp):null,o=pr?pr.o:null,on=pr&&w.t-w.delay>0;
  const CX=652,CY=146,R=100,tt=RM?0:t;const leg=[];
  ctx.save();ctx.beginPath();ctx.arc(CX,CY,R,0,6.29);ctx.clip();ctx.fillStyle=on&&r!=='flame'?'#dcebf4':'#efede6';ctx.fillRect(CX-R,CY-R,2*R,2*R);
  const P=(i,n,spread)=>{const a=i*2.399+0.3,rad=Math.sqrt((i+0.5)/n)*R*0.86*spread;return [CX+Math.cos(a)*rad+Math.sin(tt*0.9+i)*4,CY+Math.sin(a)*rad+Math.cos(tt*0.8+i*1.3)*4];};
  const dot=(x,y,rad,c)=>{ctx.fillStyle=c;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,rad,0,6.29);ctx.fill();ctx.stroke();};
  const hexm=(x,y,s,c)=>{ctx.fillStyle=c;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3;ctx[j?'lineTo':'moveTo'](x+Math.cos(a)*s,y+Math.sin(a)*s);}ctx.closePath();ctx.fill();ctx.stroke();};
  const water=n=>{for(let i=0;i<n;i++){const [x,y]=P(i+40,n+40,1);dot(x,y,3,'#5dade2');}};
  const sampleParts=(spread,n)=>{const ionic=sp.sol==='ionic',molc=sp.starch?'#e6d3a3':sp.prot?'#d8b25a':'#df741a';
    for(let i=0;i<n;i++){const [x,y]=spread<1?[CX-34+(i%5)*17+(Math.floor(i/5)%2)*8+Math.sin(tt*3+i)*1.2,CY-20+Math.floor(i/5)*15+Math.cos(tt*3+i)*1.2]:P(i,n,spread);
      if(ionic)dot(x,y,i%2?6:8,i%2?'#8e5ac8':(sp.an==='Cl⁻'?'#2e8b57':'#c0392b'));else hexm(x,y,7,molc);}
    if(ionic)leg.push(['#8e5ac8','Na⁺ ion'],[sp.an==='Cl⁻'?'#2e8b57':'#c0392b',(sp.an||'anion')+' ion']);else leg.push([molc,sp.starch?'starch chains':sp.prot?'protein chains':'whole molecules']);};
  if(!on){sampleParts(0.5,20);leg.length=0;leg.push(['#df741a','dry powder: particles packed tight']);}
  else if(r==='water'){const sol=o.pos;sampleParts(sol?1:0.5,sol?18:20);water(26);leg.push(['#5dade2','H₂O']);}
  else if(r==='iodine'){if(sp.starch){for(let j=0;j<2;j++){const y0=CY-34+j*64;ctx.strokeStyle='#c9b27a';ctx.lineWidth=9;ctx.beginPath();for(let x=CX-R;x<=CX+R;x+=4)ctx[x===CX-R?'moveTo':'lineTo'](x,y0+Math.sin(x*0.09)*12);ctx.stroke();
        for(let q=0;q<6;q++){const x=CX-80+q*32+Math.sin(tt+q)*2;if(q/6<pr.mix){dot(x-5,y0+Math.sin(x*0.09)*12,3.5,'#24204a');dot(x,y0+Math.sin(x*0.09)*12,3.5,'#24204a');dot(x+5,y0+Math.sin(x*0.09)*12,3.5,'#24204a');}}}
      leg.push(['#c9b27a','starch helix'],['#24204a','trapped I₃⁻ (blue-black)']);}
    else{sampleParts(sp.sol==='insol'?0.5:1,12);for(let i=0;i<8;i++){const [x,y]=P(i+20,30,1);dot(x-5,y,3.5,'#b0701c');dot(x,y,3.5,'#b0701c');dot(x+5,y,3.5,'#b0701c');}leg.push(['#b0701c','free I₃⁻: amber-brown']);}}
  else if(r==='vinegar'){for(let i=0;i<9;i++){const [x,y]=P(i+12,24,1);hexm(x,y,6,'#9ccc65');}leg.push(['#9ccc65','CH₃COOH']);
    if(sp.carb){for(let i=0;i<8;i++){const [x,y]=P(i,18,0.9);dot(x,y,6,'#c0392b');}leg.push(['#c0392b','HCO₃⁻']);const n=Math.round(9*sp.carb*pr.mix);
      for(let i=0;i<n;i++){const ph=(tt*0.5+i*0.13)%1,x=CX-70+((i*47)%140),y=CY+R-ph*2*R;ctx.strokeStyle='#6f97ab';ctx.fillStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,7+(i%3)*2,0,6.29);ctx.fill();ctx.stroke();}leg.push(['#ffffff','CO₂ gas bubbles']);}
    else sampleParts(sp.sol==='insol'?0.5:1,10);}
  else if(r==='ph'){const pH=o.pH,nH=Math.round(clamp(5+(7-pH)*3,1,22)),nO=Math.round(clamp(5+(pH-7)*4,1,22));water(24);
    for(let i=0;i<nH;i++){const [x,y]=P(i*2,nH*2+2,1);dot(x,y,6,PAL['cv-h']);}for(let i=0;i<nO;i++){const [x,y]=P(i*2+1,nO*2+2,1);dot(x,y,6,'#2d6bd2');}
    leg.push([PAL['cv-h'],'H₃O⁺ ('+nH+')'],['#2d6bd2','OH⁻ ('+nO+')']);}
  else if(r==='flame'){ctx.fillStyle='#1d2330';ctx.fillRect(CX-R,CY-R,2*R,2*R);
    if(sp.na){const nx=CX-30,ny=CY+10;dot(nx,ny,12,'#8e5ac8');ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;[30,52].forEach(rad=>{ctx.beginPath();ctx.arc(nx,ny,rad,0,6.29);ctx.stroke();});
      const ph=(tt*0.6)%1,up=ph<0.5,rad=up?lerp(30,52,ph*2):lerp(52,30,(ph-0.5)*2);dot(nx+rad*Math.cos(-0.6),ny+rad*Math.sin(-0.6),5,PAL['cv-e']);
      if(!up){ctx.strokeStyle='#ffae00';ctx.lineWidth=3;ctx.beginPath();const sx=nx+40,sy=ny-30,L=(ph-0.5)*2*90;for(let s=0;s<=L;s+=2)ctx[s?'lineTo':'moveTo'](sx+s,sy-s*0.5+Math.sin(s*0.5)*5);ctx.stroke();}
      leg.push(['#8e5ac8','Na⁺: electron jumps up, then falls back'],['#ffae00','light given off: 589 nm']);}
    else{for(let i=0;i<14;i++){const ph=(tt*0.3+i*0.071)%1;dot(CX-60+((i*41)%120),CY+R-ph*2*R,3+(i%3),'#4a4a4a');}leg.push(['#4a4a4a','soot and smoke: no metal ion']);}}
  else if(r==='benedict'){const n=18,conv=sp.red?pr.dev:0;for(let i=0;i<n;i++){const [x,y]=P(i,n,1);if(i/n<conv){dot(x-3,y,5,'#b03a2e');dot(x+3,y+2,5,'#b03a2e');}else dot(x,y,6,'#2f63c9');}
    leg.push(['#2f63c9','Cu²⁺ (blue)']);if(sp.red)leg.push(['#b03a2e','Cu₂O solid (brick red)']);else leg.push(['#df741a',sp.sucrose?'sucrose: no free aldehyde':'no reducing sugar']);}
  else if(r==='biuret'){if(sp.prot){ctx.strokeStyle='#c49a3c';ctx.lineWidth=4;ctx.beginPath();for(let x=CX-R;x<=CX+R;x+=6)ctx[x===CX-R?'moveTo':'lineTo'](x,CY+Math.sin(x*0.06+tt*0.5)*30);ctx.stroke();
      for(let q=0;q<5;q++){const x=CX-72+q*36,y=CY+Math.sin(x*0.06+tt*0.5)*30;if(q/5<pr.mix){ctx.fillStyle='rgba(123,63,176,.35)';ctx.beginPath();ctx.arc(x,y,14,0,6.29);ctx.fill();}dot(x,y-(q/5<pr.mix?0:30),6,'#4b7fd8');}
      leg.push(['#c49a3c','protein chain (peptide bonds)'],['#7b3fb0','Cu²⁺ bound: violet']);}
    else{for(let i=0;i<12;i++){const [x,y]=P(i,12,1);dot(x,y,6,'#4b7fd8');}leg.push(['#4b7fd8','Cu²⁺: nothing to bind']);}}
  else{for(let i=0;i<12;i++){const [x,y]=P(i+14,30,1);dot(x,y,4,'#9a9a9a');}leg.push(['#9a9a9a','reagent molecules']);
    if(sp.rx){for(let i=0;i<9;i++){const [x,y]=P(i,14,0.8);hexm(x,y,7,i/9<pr.mix?o.col:'#e0dccf');}leg.push([o.col,'colored product (simulated)']);}
    else if(o.slow){for(let i=0;i<12;i++){const [x,y]=P(i,16,0.9);hexm(x,y,6,mixC('#df741a','#5a3a1a',pr.dev));}leg.push(['#5a3a1a','sugar slowly charring']);}
    else{sampleParts(sp.sol==='insol'?0.5:1,10);}}
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(CX,CY,R,0,6.29);ctx.stroke();
  txt(ctx,k>1.4?'Particle view':'Particle view: '+(key==='ev'?'evidence':SAMP[key].lab.join(' ').replace('- ','').toLowerCase()),CX,CY-R-12,{s:13*k,w:700,a:'center'});
  let ly=CY+R+26;const rh=19*Math.min(k,1.4);leg.slice(0,k>1.4?2:3).forEach(([c,l])=>{ctx.font='600 '+(12*k)+'px '+FONT;let s=l;while(ctx.measureText(s).width>236&&s.length>6)s=s.slice(0,-2);if(s!==l)s=s.replace(/[\s:,]+$/,'')+'…';
    ctx.fillStyle=c;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(538,ly-4,6,0,6.29);ctx.fill();ctx.stroke();txt(ctx,s,550,ly,{s:12*k,w:600,c:PAL['cv-ink']});ly+=rh;});}

BioLab.register(SPOT);
})();

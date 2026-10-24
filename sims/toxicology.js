(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor,lvText}=BioLab.h;
const TAU=Math.PI*2;

/* Typical rat oral LD50 values (mg/kg) from safety data sheets and the toxicology literature. h = Hill slope of the model curve. */
const SUB={
  water:{l:'Water',f:'H₂O',ld:90000,h:6,note:'Drinking extreme amounts very fast dilutes the sodium in blood (hyponatremia), which can be fatal. Even water has an LD₅₀.'},
  sugar:{l:'Table sugar (sucrose)',f:'C₁₂H₂₂O₁₁',ld:29700,h:4,serv:{mg:4000,n:'teaspoons of sugar (4 g)'},note:'Sugar is about as non-toxic as a substance gets, yet it still has an LD₅₀.'},
  ethanol:{l:'Ethanol',f:'C₂H₅OH',ld:7060,h:6,note:'People are far more sensitive to alcohol than the rat LD₅₀ suggests, especially when it is drunk quickly. Do not use this number for people.'},
  salt:{l:'Table salt (sodium chloride)',f:'NaCl',ld:3000,h:5,serv:{mg:6000,n:'teaspoons of salt (6 g)'},note:'Very large amounts of salt can be deadly, so even salt has an LD₅₀.'},
  apap:{l:'Acetaminophen',f:'C₈H₉NO₂',ld:1944,h:4,note:'In people, liver damage can begin near 150 mg/kg, more than 10× below the rat LD₅₀. Animal LD₅₀ values can badly understate the danger to humans.'},
  aspirin:{l:'Aspirin',f:'C₉H₈O₄',ld:200,h:4,note:'An overdose of aspirin is a medical emergency far below the rat LD₅₀. A medicine is not automatically safe.'},
  caffeine:{l:'Caffeine',f:'C₈H₁₀N₄O₂',ld:192,h:4,serv:{mg:95,n:'cups of brewed coffee (95 mg)'},note:'Caffeine pills and powders have caused deaths, because a small scoop of powder can hold as much caffeine as dozens of cups of coffee.'},
  nicotine:{l:'Nicotine',f:'C₁₀H₁₄N₂',ld:50,h:5,poison:true,note:'Mice are more sensitive (LD₅₀ about 3 mg/kg). Liquid nicotine for e-cigarettes has poisoned young children.'},
  arsenic:{l:'Arsenic trioxide',f:'As₂O₃',ld:14.6,h:4,poison:true,note:'The classic poison of history. Arsenic binds to enzymes the cell needs to release energy from food.'},
  cyanide:{l:'Sodium cyanide',f:'NaCN',ld:6.4,h:8,poison:true,note:'Cyanide blocks cytochrome c oxidase, the last enzyme of cellular respiration, so cells cannot use oxygen.'}
};
const KEYS=Object.keys(SUB),N=40;
const R=(s,D)=>D<=0?0:1/(1+Math.pow(s.ld/D,s.h));
const dose=p=>Math.pow(10,p.dose);
const fmtMg=v=>v>=1000?(v/1000).toPrecision(3)+' g':v>=10?Math.round(v)+' mg':v>=1?v.toFixed(1)+' mg':v.toFixed(2)+' mg';
const fmtDose=v=>(v>=100?Math.round(v).toLocaleString('en-US'):v>=10?v.toFixed(1):v>=1?v.toFixed(2):v.toFixed(3))+' mg/kg';
function hodge(ld){return ld<=1?'Extremely toxic (≤ 1 mg/kg)':ld<=50?'Highly toxic (1–50 mg/kg)':ld<=500?'Moderately toxic (50–500)':ld<=5000?'Slightly toxic (0.5–5 g/kg)':ld<=15000?'Practically non-toxic (5–15 g/kg)':'Relatively harmless (> 15 g/kg)';}
// each test animal gets a tolerance from the curve's quantiles, so the count responding matches R(D)
const ORDER=(()=>{const r=rng(42),a=[...Array(N).keys()];for(let i=N-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;})();
const tol=(s,i)=>{const u=(ORDER[i]+0.5)/N;return s.ld*Math.pow(u/(1-u),1/s.h);};
const responding=(s,D)=>{let n=0;for(let i=0;i<N;i++)if(tol(s,i)<=D)n++;return n;};

/* caffeine in the body: one-compartment model with first-order absorption (ka) and elimination (k = ln2/t½) */
const KA=3,VD=0.6,CTOX=15,CEFF=[1,10];
function pk(p){const k=Math.LN2/p.thalf,V=VD*p.mass,n=p.view==='body'?p.n:1;const times=[];for(let i=0;i<n;i++)times.push(i*p.tau);
  const C=t=>{let c=0;for(const ti of times){if(t<ti)continue;const u=t-ti;c+=(p.mg/V)*(KA/(KA-k))*(Math.exp(-k*u)-Math.exp(-KA*u));}return c;};
  const A=t=>{let a=0;for(const ti of times){if(t<ti)continue;const u=t-ti;a+=p.mg*Math.exp(-KA*u)+p.mg*(KA/(KA-k))*(Math.exp(-k*u)-Math.exp(-KA*u));}return a;};
  let peak=0,first=0;for(let t=0;t<=24;t+=0.05){const c=C(t);if(c>peak)peak=c;if(t<=(n>1?p.tau:24)&&c>first)first=c;}
  return {k,V,times,C,A,peak,first,acc:n>1?1/(1-Math.exp(-k*p.tau)):1,css:p.mg/(k*V*p.tau)};}
const HOURS=24,HRATE=2;  // the clock sweeps 2 hours per second

function syncMode(sim){if(!atLeast('honors')&&sim.p.view==='body')BioLab.setValues(sim,{view:'ld50'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.view,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function doseOut(sim){const o=document.getElementById('toxicology-dose-out');if(o){const t=fmtDose(dose(sim.p));if(o.textContent!==t)o.textContent=t;}}

/* log-axis chart helper: x is log10 */
function logChart(ctx,b,x0,x1,k,step){ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;const X=v=>b.x+(v-x0)/(x1-x0)*b.w,Y=f=>b.y+b.h-f*b.h;
  for(let e=Math.ceil(x0);e<=x1;e++){const x=Math.round(X(e))+.5;ctx.beginPath();ctx.moveTo(x,b.y);ctx.lineTo(x,b.y+b.h);ctx.stroke();
    if((e-Math.ceil(x0))%(step||1)===0)txt(ctx,e<0?String(Math.pow(10,e)):Math.pow(10,e).toLocaleString('en-US'),x,b.y+b.h+15*k,{s:12*k,c:PAL['g-axis'],a:'center'});}
  [0,0.5,1].forEach(f=>{const y=Math.round(Y(f))+.5;ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke();txt(ctx,Math.round(f*100)+'%',b.x-6,y,{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});});
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(b.x+.5,b.y);ctx.lineTo(b.x+.5,b.y+b.h);ctx.lineTo(b.x+b.w,b.y+b.h+.5);ctx.stroke();return {X,Y};}
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBox(ctx,b,lines,k){const rows=[];let need=10;for(const L of lines){const sz=L.s*k;for(const w of wrapLines(ctx,L.t,b.w-24,sz,L.w)){rows.push([w,sz,L]);need+=sz*1.3;}}
  const h=Math.max(b.h,need);rr(ctx,b.x,b.y,b.w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  let y=b.y+6;for(const [w,sz,L] of rows){y+=sz*1.3;txt(ctx,w,b.x+12,y-sz*0.3,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink']});}}
function rat(ctx,x,y,s,fill,stroke){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.3/s;
  ctx.beginPath();ctx.ellipse(0,0,10,6.5,0,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(9,-2,5.5,4.2,-0.3,0,TAU);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(8,-6.5,2.6,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-10,1);ctx.quadraticCurveTo(-17,6,-21,0);ctx.stroke();ctx.restore();}

const TOX={
  id:'toxicology',hash:'toxicology',apUnit:16,order:2,tab:'Toxicology and LD₅₀',kind:'Simulation',prereq:['units'],next:['spottest','titration'],
  card:'Dose a test group, build the S-shaped dose–response curve, find the LD₅₀, and see why the dose makes the poison.',
  title:'Toxicology: the dose makes the poison',
  lede:{bio:'Every substance, even water, is toxic at a high enough dose. Raise the dose for a test group, find the LD₅₀, and compare how toxic everyday substances are.',
        honors:'Compare toxicity on the LD₅₀ scale, then follow caffeine through the bloodstream: absorption, a peak, and first-order elimination with a half-life.',
        ap:'Fit the dose–response curve (Hill slope), linearize it with logits, and use first-order kinetics to predict accumulation and steady state.'},
  scale:{bio:'A test group of 40 rats, about 250 g each. Doses are in milligrams of substance per kilogram of body mass (mg/kg). LD₅₀ values come from animal studies; this is not medical guidance.',
         honors:'Dose view: 40 rats of about 250 g, doses in mg/kg. Bloodstream view: caffeine in a person’s blood plasma, in mg per liter. Animal data and a simple model; not medical guidance.'},
  timeless:true,animated:true,chChange:0.6,chReveal:3.5,
  controls:[
    {id:'view',label:'View',type:'seg',def:'ld50',lvl:'bio',noTrial:true,options:[{v:'ld50',l:'Dose and LD₅₀'},{v:'body',l:'In the bloodstream',lvl:'honors'}]},
    {id:'sub',label:'Substance',type:'select',def:'caffeine',lvl:'bio',modes:['ld50'],options:KEYS.map(k=>({v:k,l:SUB[k].l}))},
    {id:'dose',label:'Dose given to the test group',type:'range',min:-1,max:5,step:0.01,def:Math.log10(192),unit:'',lvl:'bio',noTrial:true,modes:['ld50'],help:'The slider is logarithmic: each step to the right multiplies the dose.'},
    {id:'mass',label:'Body mass for scaling',type:'range',min:20,max:120,step:1,def:60,unit:' kg',lvl:'bio',help:'LD₅₀ × body mass gives the amount that matches the LD₅₀ for that mass.'},
    {id:'mg',label:'Caffeine per serving',type:'range',min:25,max:300,step:5,def:95,unit:' mg',lvl:'honors',modes:['body'],help:'A cup of brewed coffee has about 95 mg; a can of cola about 34 mg.'},
    {id:'n',label:'Number of servings',type:'range',min:1,max:6,step:1,def:1,unit:'',lvl:'honors',modes:['body']},
    {id:'tau',label:'Hours between servings',type:'range',min:1,max:8,step:0.5,def:4,unit:' h',lvl:'honors',modes:['body']},
    {id:'thalf',label:'Caffeine half-life',type:'range',min:2,max:10,step:0.5,def:5,unit:' h',lvl:'ap',modes:['body'],help:'Typically 3–7 h in adults. Longer during pregnancy or with liver disease; shorter in smokers.'}
  ],
  actions:[{id:'replay',label:'Replay the day',lvl:'honors',modes:['body'],primary:true,run(sim){sim.st.th=0;}}],
  init(){return {th:0,hold:false};},
  step(sim,dt){const st=sim.st;if(st.ramp){if(sim.p.dose<st.ramp)BioLab.setValues(sim,{dose:Math.min(st.ramp,sim.p.dose+dt*0.25)});else st.ramp=0;}if(!st.hold)st.th=Math.min(HOURS,st.th+dt*HRATE);doseOut(sim);},
  metrics:[
    {id:'dmg',label:'Dose given',unit:'mg/kg',lvl:'bio',min:0,max:null,d:1,modes:['ld50'],get:s=>dose(s.p)},
    {id:'resp',label:'Test group responding',unit:'',lvl:'bio',text:true,modes:['ld50'],get:s=>{const n=responding(SUB[s.p.sub],dose(s.p));return n+' of '+N;}},
    {id:'pct',label:'Expected response at this dose',unit:'%',lvl:'bio',min:0,max:100,d:1,modes:['ld50'],get:s=>100*R(SUB[s.p.sub],dose(s.p))},
    {id:'ld',label:'LD₅₀ (rat, oral)',unit:'mg/kg',lvl:'bio',min:0,max:null,d:1,modes:['ld50'],get:s=>SUB[s.p.sub].ld},
    {id:'scaled',label:'LD₅₀ × body mass',unit:'',lvl:'bio',text:true,modes:['ld50'],get:s=>{const S=SUB[s.p.sub];return S.poison?'compare per kg only':fmtMg(S.ld*s.p.mass);}},
    {id:'cls',label:'Toxicity class (Hodge–Sterner)',unit:'',lvl:'honors',text:true,modes:['ld50'],get:s=>hodge(SUB[s.p.sub].ld)},
    {id:'vs',label:'Compared with table salt',unit:'',lvl:'honors',text:true,modes:['ld50'],get:s=>{const r=3000/SUB[s.p.sub].ld;return Math.abs(r-1)<0.01?'same as salt':r>1?(r>=10?Math.round(r):r.toFixed(1))+'× more toxic':(1/r).toFixed(1)+'× less toxic';}},
    {id:'hill',label:'Hill slope h',unit:'',lvl:'ap',min:0,max:null,d:0,modes:['ld50'],get:s=>SUB[s.p.sub].h},
    {id:'cnow',label:'Caffeine in plasma now',unit:'mg/L',lvl:'honors',min:0,max:null,d:2,modes:['body'],get:s=>pk(s.p).C(s.st.th)},
    {id:'cpeak',label:'Highest level today',unit:'mg/L',lvl:'honors',min:0,max:null,d:2,modes:['body'],get:s=>pk(s.p).peak},
    {id:'abody',label:'Caffeine still in the body',unit:'mg',lvl:'honors',min:0,max:null,d:0,modes:['body'],get:s=>pk(s.p).A(s.st.th)},
    {id:'kel',label:'Elimination rate constant k',unit:'h⁻¹',lvl:'ap',min:0,max:null,d:3,modes:['body'],get:s=>Math.LN2/s.p.thalf},
    {id:'acc',label:'Accumulation factor 1/(1 − e^(−kτ))',unit:'',lvl:'ap',min:0,max:null,d:2,modes:['body'],get:s=>pk(s.p).acc},
    {id:'css',label:'Steady-state average D/(kVτ)',unit:'mg/L',lvl:'ap',min:0,max:null,d:2,modes:['body'],get:s=>pk(s.p).css}
  ],
  graphs:[{id:'ladder',label:'LD₅₀ of every substance (log scale)',lvl:'bio',custom:true},{id:'conc',label:'Caffeine in plasma over the day',lvl:'honors',custom:true},{id:'logit',label:'Linearized curve: logit vs log dose',lvl:'ap',custom:true}],
  defaultGraph:'ladder',
  plot(sim,ctx,box,id){const p=sim.p,W=box.cw,H=box.ch;
    if(id==='ladder'){const b={x:box.L+90,y:box.T+4,w:box.W-96,h:box.H-8};const x0=0,x1=5;ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;
      const X=v=>b.x+(Math.log10(v)-x0)/(x1-x0)*b.w,rowH=b.h/KEYS.length;
      for(let e=x0;e<=x1;e++){const x=Math.round(b.x+(e-x0)/(x1-x0)*b.w)+.5;ctx.beginPath();ctx.moveTo(x,b.y);ctx.lineTo(x,b.y+b.h);ctx.stroke();txt(ctx,b.w<400?['1','10','100','1k','10k','100k'][e]:Math.pow(10,e).toLocaleString('en-US'),x,b.y+b.h+16,{s:12,c:PAL['g-axis'],a:'center'});}
      KEYS.slice().sort((a,c)=>SUB[a].ld-SUB[c].ld).forEach((key,i)=>{const S=SUB[key],y=b.y+rowH*(i+0.5),x=X(S.ld),sel=key===p.sub;
        ctx.fillStyle=sel?PAL['s1']:PAL['g-axis'];ctx.globalAlpha=sel?1:0.55;ctx.fillRect(b.x,y-rowH*0.28,x-b.x,rowH*0.56);ctx.globalAlpha=1;
        txt(ctx,S.l.split(' (')[0],b.x-8,y,{s:12,c:sel?PAL['fg']:PAL['muted'],a:'right',b:'middle',w:sel?700:400});const vl=String(S.ld>=100?Math.round(S.ld).toLocaleString('en-US'):S.ld);ctx.font='12px '+FONT;const inside=x+6+ctx.measureText(vl).width>b.x+b.w;if(inside){ctx.font='700 12px '+FONT;pill(ctx,vl,x-ctx.measureText(vl).width/2-12,y,PAL['card'],PAL['fg'],12);}else txt(ctx,vl,x+6,y,{s:12,c:PAL['muted'],b:'middle'});});
      txt(ctx,'LD₅₀ (mg/kg, log scale). Shorter bar = more toxic.',b.x+b.w,box.ch-4,{s:13,c:PAL['muted'],a:'right'});return;}
    if(id==='conc'){drawConc(ctx,sim,{x:box.L,y:box.T+18,w:box.W,h:box.H-18},1,true);return;}
    if(id==='logit'){const S=SUB[p.sub],b={x:box.L,y:box.T,w:box.W,h:box.H};const lx0=Math.log10(S.ld)-1,lx1=Math.log10(S.ld)+1;
      const X=v=>b.x+(v-lx0)/(lx1-lx0)*b.w,Y=v=>b.y+b.h/2-v/6*b.h/2;ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;
      for(let v=-6;v<=6;v+=3){const y=Math.round(Y(v))+.5;ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke();txt(ctx,String(v),b.x-8,y,{s:13,c:PAL['g-axis'],a:'right',b:'middle'});}
      for(let e=0;e<=4;e++){const lv=lx0+e*0.5,x=Math.round(X(lv))+.5;ctx.beginPath();ctx.moveTo(x,b.y);ctx.lineTo(x,b.y+b.h);ctx.stroke();txt(ctx,fmtDose(Math.pow(10,lv)).replace(' mg/kg',''),x,b.y+b.h+16,{s:12,c:PAL['g-axis'],a:'center'});}
      ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(lx0),Y(S.h*Math.log(Math.pow(10,lx0)/S.ld)));ctx.lineTo(X(lx1),Y(S.h*Math.log(Math.pow(10,lx1)/S.ld)));ctx.stroke();ctx.setLineDash([]);
      // the test group's data: each dose step, logit of the observed fraction (clipped at 0.5/40 and 39.5/40)
      for(let e=0;e<=16;e++){const lv=lx0+e*0.125,D=Math.pow(10,lv),n=responding(S,D),f=clamp(n,0.5,N-0.5)/N;ctx.fillStyle=serColor(1);ctx.beginPath();ctx.arc(X(lv),Y(Math.log(f/(1-f))),4,0,TAU);ctx.fill();}
      const D=dose(p);if(D>=Math.pow(10,lx0)&&D<=Math.pow(10,lx1)){const f=R(S,D);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(X(Math.log10(D)),Y(Math.log(f/(1-f))),8,0,TAU);ctx.stroke();}
      ctx.restore();txt(ctx,'ln[R/(1 − R)] = h·ln D − h·ln LD₅₀   (slope h = '+S.h+')',b.x+8,b.y+14,{s:13,c:PAL['muted']});
      ctx.save();ctx.translate(14,b.y+b.h/2);ctx.rotate(-Math.PI/2);txt(ctx,'logit = ln[R/(1 − R)]',0,0,{s:13,c:PAL['muted'],a:'center',b:'middle'});ctx.restore();
      txt(ctx,'Dose (mg/kg, log scale)',b.x+b.w/2,box.ch-4,{s:13,c:PAL['muted'],a:'center'});}},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors');
    if(p.view==='body'){const P=pk(p);return `<h3>Caffeine in this model</h3><p>Volume of distribution ${VD} L/kg × ${p.mass} kg = ${P.V.toFixed(0)} L. Half-life ${p.thalf} h, so k = ln 2 / ${p.thalf} = ${P.k.toFixed(3)} h⁻¹. Absorption rate k<sub>a</sub> = ${KA} h⁻¹ (peak about an hour after each serving).</p><p class="help">The shaded band (1–10 mg/L) is the range usually measured after ordinary coffee drinking. Toxic effects are reported above about 15 mg/L. People vary a lot; this is a model for learning kinetics, not medical guidance.</p>`;}
    const S=SUB[p.sub];let h=`<h3>${S.l}, ${S.f}</h3><p>Rat oral LD₅₀ ≈ ${S.ld.toLocaleString('en-US')} mg/kg${hon?'. '+hodge(S.ld)+'.':'.'}</p><p>${S.note}</p>`;
    if(!S.poison&&S.serv)h+=`<p class="help">Scaled to ${p.mass} kg: ${S.ld.toLocaleString('en-US')} mg/kg × ${p.mass} kg = ${fmtMg(S.ld*p.mass)}, about ${Math.round(S.ld*p.mass/S.serv.mg).toLocaleString('en-US')} ${S.serv.n}. That is the worksheet math. Harm starts far below the LD₅₀, so it is never a safe amount.</p>`;
    else if(S.poison)h+=`<p class="help">This tool compares classic poisons per kilogram only.</p>`;
    return h;},
  narrate(sim){const p=sim.p,hon=atLeast('honors');
    if(p.view==='body'){const P=pk(p),c=P.C(sim.st.th),th=sim.st.th;
      if(c>CTOX)return 'The level is <b>'+c.toFixed(1)+' mg/L, above the 15 mg/L where toxic effects are reported</b>. Servings this close together add up faster than the liver can clear them.';
      if(p.n>1&&th>p.tau)return 'Each new serving arrives before the last one is cleared, so <b>the caffeine builds up</b>. With a '+p.thalf+' h half-life and a serving every '+p.tau+' h, the peaks rise toward a level about '+P.acc.toFixed(1)+'× the first one.';
      if(th<1.2)return 'The caffeine is being <b>absorbed</b> from the gut into the blood, so the level climbs. It peaks about an hour after the serving.';
      return 'The liver clears caffeine by <b>first-order elimination</b>: the same fraction leaves each hour, so the level halves every '+p.thalf+' hours. It never drops straight to zero.';}
    const S=SUB[p.sub],D=dose(p),n=responding(S,D),f=R(S,D);
    if(n===0)return 'At '+fmtDose(D)+' of '+S.l.toLowerCase()+', <b>none of the test group responds</b>. The LD₅₀ is '+fmtDose(S.ld)+', so this dose is '+(S.ld/D>=10?Math.round(S.ld/D):(S.ld/D).toFixed(1))+'× lower.';
    if(n===N)return 'At '+fmtDose(D)+', <b>every animal in the test group responds</b>. Past the top of the S-curve, more dose adds nothing.';
    let s='<b>'+n+' of '+N+' animals respond</b> at '+fmtDose(D)+'. ';
    s+=Math.abs(Math.log10(D/S.ld))<0.05?'This is the LD₅₀: the dose where half the group responds.':D<S.ld?'The curve is steep near the LD₅₀, so a small increase in dose here affects many more animals.':'This is above the LD₅₀, so more than half respond.';
    if(hon)s+=' '+S.l+' is '+hodge(S.ld).split(' (')[0].toLowerCase()+'.';
    return s;},
  tour:[
    {title:'A dose–response test',text:{bio:'Toxicologists give groups of test animals a dose of a substance and count how many respond. Each rat here is one animal in a group of 40. The dose is in milligrams per kilogram of body mass.',honors:'Classic LD₅₀ tests used large groups. Modern guidelines (such as the OECD up-and-down procedure) estimate the LD₅₀ with far fewer animals.'},focus:[16,56,300,290],pause:true,setup(sim){BioLab.setValues(sim,{view:'ld50',sub:'caffeine',dose:1.4});}},
    {title:'Raise the dose',text:'At a low dose no animal responds. As the dose rises, the animals with the lowest tolerance respond first. Individuals differ, so the response grows gradually.',focus:[[16,56,300,290],[330,40,460,290]],speed:1,setup(sim){BioLab.setValues(sim,{dose:1.4});sim.st.ramp=2.6;}},
    {title:'The S-shaped curve',text:'Plotted against the log of the dose, the share responding makes an S. The LD₅₀ is the dose where half the group responds: 192 mg/kg for caffeine in rats.',focus:[330,40,460,290],speed:1,setup(sim){sim.st.ramp=0;BioLab.setValues(sim,{dose:Math.log10(192)});}},
    {title:'Lower LD₅₀, more toxic',text:'Switch to nicotine. Its curve sits far to the left: half the group responds at only 50 mg/kg. The lower the LD₅₀, the more toxic the substance.',focus:[330,40,460,290],speed:1,setup(sim){BioLab.setValues(sim,{sub:'nicotine',dose:Math.log10(50)});}},
    {title:'Scale by body mass',text:'Multiply the LD₅₀ by a body mass: 192 mg/kg × 60 kg = 11.5 g of caffeine. That is the classic worksheet math. It comes from rats, and real harm starts far lower, so it is never a safe amount.',focus:[12,334,776,110],pause:true,setup(sim){BioLab.setValues(sim,{sub:'caffeine',dose:Math.log10(192),mass:60});}},
    {title:'The dose makes the poison',text:'Even water has an LD₅₀ (about 90 000 mg/kg in rats). Paracelsus wrote that all things are poison and only the dose makes a thing not a poison. Toxicity is about how much, not just what.',focus:[330,40,460,290],speed:1,setup(sim){BioLab.setValues(sim,{sub:'water',dose:Math.log10(90000)});}},
    {lvl:'honors',title:'Into the bloodstream',text:'One cup of coffee: caffeine is absorbed in about an hour, peaks near 2 mg/L in a 60 kg person, then the liver clears it. Each dot in the circle stands for a fixed amount of caffeine.',focus:[[16,40,300,300],[330,40,460,290]],speed:1,setup(sim){BioLab.setValues(sim,{view:'body',n:1,mg:95,tau:4});sim.st.th=0;}},
    {lvl:'honors',title:'Half-life and build-up',text:'Elimination is first order: half the caffeine is gone every half-life (about 5 h). A new serving every 4 hours arrives before the last is cleared, so the level climbs toward a steady state.',focus:[330,40,460,290],speed:1,setup(sim){BioLab.setValues(sim,{view:'body',n:6,mg:95,tau:4});sim.st.th=0;}}
  ],
  onTourExit(sim){sim.st.ramp=0;const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);sim.st.th=0;sim.st.hold=false;syncMode(sim);},
  onChallenge(sim,ch,phase){if(phase==='ask'){sim.st.hold=false;}if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.th!==undefined){sim.st.th=ch.th;sim.st.hold=true;}syncMode(sim);BioLab.refresh(sim);}},
  challenges:[
    {lvl:'bio',q:'At 96 mg/kg of caffeine, about 2 of the 40 rats respond. What happens if you double the dose to 192 mg/kg?',choices:['About twice as many respond (4 of 40)','About half the group responds (20 of 40)','All 40 respond'],correct:1,
     baseline:{view:'ld50',sub:'caffeine',dose:Math.log10(96)},change:{dose:Math.log10(192)},changeText:'Dose doubled to 192 mg/kg',
     explain:{bio:'The count jumps from 2 to 20. The curve is S-shaped, not a straight line: near the LD₅₀, a small rise in dose affects many more animals. 192 mg/kg is caffeine’s LD₅₀, so half the group responds.'}},
    {lvl:'bio',instant:true,set:{view:'ld50',sub:'caffeine'},q:'Table salt has an LD₅₀ of 3000 mg/kg. Caffeine’s is 192 mg/kg. Which is more toxic?',choices:['Table salt, because its number is bigger','Caffeine, because a smaller dose has the same effect','They are equally toxic'],correct:1,
     explain:{bio:'A lower LD₅₀ means it takes less of the substance to affect half the test group, so caffeine is about 16× more toxic than table salt. The “LD₅₀ of every substance” graph shows the comparison.'}},
    {lvl:'bio',q:'At 200 mg/kg, table salt affects none of the test group. What happens at the same dose of aspirin, a common medicine?',choices:['None respond: medicines are made to be safe','About half respond','All respond'],correct:1,
     baseline:{view:'ld50',sub:'salt',dose:Math.log10(200)},change:{sub:'aspirin'},changeText:'Same 200 mg/kg dose, now aspirin',
     explain:{bio:'Aspirin’s rat LD₅₀ is about 200 mg/kg, so about half the group responds. The same dose can be harmless for one substance and toxic for another, and a medicine is not automatically safe.'}},
    {lvl:'bio',instant:true,set:{view:'ld50',sub:'water',dose:Math.log10(90000)},q:'Can plain water be toxic?',choices:['No, water is always safe','Yes, at a high enough dose','Only if it is dirty'],correct:1,
     explain:{bio:'The model now shows water at its LD₅₀, about 90 000 mg/kg in rats. Drinking extreme amounts very fast dilutes the sodium in blood. Every substance has a toxic dose: the dose makes the poison.'}},
    {lvl:'honors',instant:true,set:{view:'ld50',sub:'apap'},q:'Acetaminophen’s rat LD₅₀ is 1944 mg/kg. Can you use that number to judge a safe dose for a person?',choices:['Yes, scale it by body mass','No: people can be far more sensitive than rats','Yes, but divide it by 2'],correct:1,
     explain:{honors:'In people, liver damage from acetaminophen can begin near 150 mg/kg, more than 10× below the rat LD₅₀. Species differ in how they absorb and break down chemicals, so animal LD₅₀ values compare toxicity; they do not set human doses.'}},
    {lvl:'honors',instant:true,set:{view:'body',n:1,mg:95,tau:4},th:10,q:'Caffeine’s half-life is 5 hours. About how long after one cup is the caffeine in the body down to about a quarter of the dose?',choices:['7.5 hours','10 hours','20 hours'],correct:1,
     explain:{honors:'Two half-lives: 95 mg → 48 mg after 5 h → 24 mg after 10 h. The model is paused at 10 h: “Caffeine still in the body” reads about a quarter of the 95 mg. First-order elimination never reaches zero in a fixed time.'}},
    {lvl:'honors',q:'One cup gives one peak. What happens if you have a cup every 4 hours instead (6 servings)?',choices:['Every peak is the same height as the first','The peaks climb higher with each serving, then level off','The level keeps rising without limit'],correct:1,
     baseline:{view:'body',n:1,mg:95,tau:4},change:{n:6},at:0.4,reveal:13,changeText:'Now 6 servings, one every 4 hours',watch:'conc',
     explain:{honors:'Each serving arrives while caffeine from the last one is still there, so the levels add. The rise slows as elimination (which grows with the level) catches up with intake: a steady state.'}},
    {lvl:'ap',instant:true,set:{view:'ld50',sub:'caffeine',dose:Math.log10(384)},q:'Caffeine’s curve has Hill slope h = 4. What share of the test group should respond at 2 × LD₅₀ (384 mg/kg)?',choices:['75%','94%','100%'],correct:1,
     explain:{ap:'R = 1/(1 + (LD₅₀/D)^h) = 1/(1 + 0.5⁴) = 1/1.0625 = 0.94. The model is now at 384 mg/kg: the expected response reads 94.1%, and 38 of 40 respond. A steeper curve (larger h) would get closer to 100%.'}},
    {lvl:'ap',instant:true,set:{view:'body',n:6,tau:5,thalf:5,mg:95},q:'You take a serving every half-life (τ = t½ = 5 h). At steady state, how high are the peaks compared with the first peak?',choices:['About the same','About 2×','About 6×'],correct:1,
     explain:{ap:'Accumulation factor = 1/(1 − e^(−kτ)) = 1/(1 − ½) = 2. The model is set to τ = t½ = 5 h: the accumulation factor readout shows 2.00, and the peaks level off near twice the first.'}},
    {lvl:'ap',q:'With a serving every 4 h, what happens to the steady-state average level if the half-life doubles from 5 h to 10 h (as can happen in late pregnancy)?',choices:['It stays the same','It about doubles','It quadruples'],correct:1,
     baseline:{view:'body',n:6,tau:4,thalf:5},change:{thalf:10},changeText:'Half-life doubled to 10 h',watch:'conc',
     explain:{ap:'C(ss, avg) = D/(k·V·τ). Doubling t½ halves k, so the average doubles: about 4.8 → 9.5 mg/L here. Slower elimination is why the same caffeine intake affects some people much more.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the response of a test group change as the dose rises?</p><ol><li>Choose caffeine. Set the dose to 50, 100, 150, 200, 300 and 500 mg/kg.</li><li>Record a trial at each dose, with the number of the 40 rats responding.</li><li>Plot dose (x) against response (y). Then try a log-scale x axis on paper.</li></ol><p>Find the LD₅₀ from your graph. Then calculate LD₅₀ × 60 kg and explain why that is not a safe amount for a person.</p>',
       honors:'<p><b>Question:</b> Which everyday substances are most toxic, and how fast does the body clear caffeine?</p><ol><li>Record the LD₅₀ and toxicity class of all ten substances. Rank them.</li><li>Switch to In the bloodstream. Record the caffeine level every 2 hours after one serving (pause the clock).</li><li>Find how long the level takes to halve, and check it twice.</li></ol><p>Explain the difference between a high LD₅₀ and a long half-life.</p>',
       ap:'<p><b>Question:</b> Can you recover the Hill slope and LD₅₀ from test-group data?</p><ol><li>For one substance, record the number responding at 8 doses spanning the curve.</li><li>Compute the logit ln[R/(1 − R)] and plot it against ln D.</li><li>Fit a line: the slope is h, and the x-intercept is ln LD₅₀.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare your values with the model. Then use the accumulation factor to explain why “one cup every half-life” settles at twice the first peak.</p>'},
  terms:[{t:'Dose',d:'The amount of a substance taken in, usually in mg per kg of body mass.'},{t:'LD₅₀',d:'The dose that is lethal to 50% of a test population. Lower LD₅₀ means more toxic.'},{t:'Dose–response curve',d:'A graph of the share of a group responding against dose. On a log dose axis it is S-shaped.'},{t:'“The dose makes the poison”',d:'Paracelsus’s idea: any substance is toxic at a high enough dose.'},
    {lvl:'honors',t:'Toxicity class',d:'A ranking by LD₅₀, such as the Hodge–Sterner scale (extremely toxic ≤ 1 mg/kg up to relatively harmless > 15 g/kg).'},{lvl:'honors',t:'Half-life (t½)',d:'The time for the amount in the body to fall by half.'},{lvl:'honors',t:'First-order elimination',d:'The body removes the same fraction each hour, so the amount falls exponentially.'},{lvl:'honors',t:'Therapeutic window',d:'The range between the level that has an effect and the level that becomes toxic.'},
    {lvl:'ap',t:'Hill slope',d:'The steepness h in R = 1/(1 + (LD₅₀/D)^h).'},{lvl:'ap',t:'Logit',d:'ln[R/(1 − R)], which turns the S-curve into a straight line against ln D.'},{lvl:'ap',t:'Accumulation factor',d:'1/(1 − e^(−kτ)): how much higher steady-state peaks are than the first, for doses every τ.'},{lvl:'ap',t:'Volume of distribution',d:'The volume that would hold the drug at its plasma concentration: amount = C × V.'}],
  about:'<p><b>Dose–response.</b> The share responding follows R = 1/(1 + (LD₅₀/D)^h), a log-logistic curve. Each of the 40 animals has a tolerance taken from that curve’s quantiles, so the count responding matches the curve. LD₅₀ values are typical rat oral figures from safety data sheets and the toxicology literature; published values vary with strain, sex and lab. The Hill slopes are model choices that give realistic steepness.</p><p><b>Caffeine kinetics.</b> One-compartment model with first-order absorption (kₐ = 3 h⁻¹) and elimination (k = ln 2 / t½), volume of distribution 0.6 L/kg. Each serving adds a Bateman curve, so multiple servings superpose. The 1–10 mg/L band and the 15 mg/L toxic line are approximate values from clinical reports.</p><p><b>Not medical guidance.</b> LD₅₀ values come from animal studies, and toxic effects in people begin far below them. This tool teaches the science of why the dose makes the poison. It does not give safe or unsafe amounts for anyone, and it does not scale classic poisons to a person.</p>',
  initVis(sim){sim.vis.col=new Float32Array(N);sim.vis.dots=null;},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const key=BioLab.level+p.view;if(sim._sk!==key){sim._sk=key;syncMode(sim);}doseOut(sim);
    if(p.view==='body')drawBody(sim,ctx,vdt,k,t);else drawLD(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.dose=Math.log10(230);}
};

/* ---------- dose view ---------- */
function drawLD(sim,ctx,vdt,k,t){const p=sim.p,S=SUB[p.sub],D=dose(p),hon=atLeast('honors'),ap=atLeast('ap'),phn=k>1.35;
  // test group
  const gx=28,gy=phn?62:74,cw=phn?36:34,chh=phn?40:44;const v=sim.vis;if(!v.col)v.col=new Float32Array(N);
  for(let i=0;i<N;i++){const on=tol(S,i)<=D?1:0;v.col[i]=RM||!vdt?on:v.col[i]+(on-v.col[i])*Math.min(1,vdt*6);
    const c=i%8,r=Math.floor(i/8),x=gx+16+c*cw,y=gy+14+r*chh;const f=v.col[i];
    rat(ctx,x,y,phn?1.15:1.05,f>0.5?PAL['s1']:PAL['card'],f>0.5?PAL['s1']:PAL['cv-soft']);}
  const n=responding(S,D),ly=gy+5*chh+12*k;
  txt(ctx,n+' of '+N+' responded ('+Math.round(100*n/N)+'%)',gx,ly,{s:14*k,w:700});
  rat(ctx,gx+10,26,0.8,PAL['s1'],PAL['s1']);txt(ctx,'lethal response',gx+28,27,{s:12*k,c:PAL['cv-soft'],b:'middle'});
  if(!phn){rat(ctx,gx+150,26,0.8,PAL['card'],PAL['cv-soft']);txt(ctx,'no response',gx+168,27,{s:12*k,c:PAL['cv-soft'],b:'middle'});}
  // dose–response chart
  const b={x:phn?372:388,y:phn?48:52,w:phn?382:362,h:phn?186:226};const x0=-1,x1=5;const ax=logChart(ctx,b,x0,x1,k,phn?2:1);
  txt(ctx,'Dose (mg/kg, log scale)',b.x+b.w/2,b.y+b.h+33*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  ctx.save();ctx.beginPath();ctx.rect(b.x,b.y-6,b.w,b.h+12);ctx.clip();
  if(hon)KEYS.forEach(key=>{if(key===p.sub)return;const s2=SUB[key];ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=2;ctx.beginPath();for(let lv=x0;lv<=x1;lv+=0.02){const y=ax.Y(R(s2,Math.pow(10,lv)));lv===x0?ctx.moveTo(ax.X(lv),y):ctx.lineTo(ax.X(lv),y);}ctx.stroke();});
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();for(let lv=x0;lv<=x1;lv+=0.01){const y=ax.Y(R(S,Math.pow(10,lv)));lv===x0?ctx.moveTo(ax.X(lv),y):ctx.lineTo(ax.X(lv),y);}ctx.stroke();
  const lx=ax.X(Math.log10(S.ld));ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b.x,ax.Y(0.5));ctx.lineTo(lx,ax.Y(0.5));ctx.lineTo(lx,b.y+b.h);ctx.stroke();ctx.setLineDash([]);
  const dx=ax.X(Math.log10(D)),dy=ax.Y(R(S,D));ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(dx,dy,7,0,TAU);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();ctx.restore();
  const lab='LD₅₀ = '+fmtDose(S.ld),lw=(ctx.font='700 '+(12*k)+'px '+FONT,ctx.measureText(lab).width);
  const tx=clamp(lx+(lx>b.x+b.w*0.55?-8:8),b.x+4,b.x+b.w-4);txt(ctx,lab,tx,ax.Y(0.5)+(R(S,Math.pow(10,(Math.log10(S.ld)+0.3)))>0.5?20*k:-10),{s:12*k,w:700,c:PAL['cv-ink'],a:lx>b.x+b.w*0.55?'right':'left'});
  txt(ctx,S.l.split(' (')[0]+'  '+S.f,b.x,b.y-(phn?16:20),{s:15*k,w:700});
  // scaling box
  const bb={x:12,y:phn?300:338,w:776,h:phn?100:80};let L;
  if(S.poison)L=[{t:'Compare per kilogram: '+S.l.split(' (')[0].toLowerCase()+' is about '+Math.round(3000/S.ld)+'× more toxic than table salt.',s:14,w:700},{t:'LD₅₀ values for classic poisons are compared per kilogram only. Animal data; not medical guidance.',s:12.5,c:PAL['cv-soft']}];
  else{const m=S.ld*p.mass;L=[{t:'LD₅₀ × body mass = '+S.ld.toLocaleString('en-US')+' mg/kg × '+p.mass+' kg = '+fmtMg(m)+(S.serv&&!phn?' (about '+Math.round(m/S.serv.mg).toLocaleString('en-US')+' '+S.serv.n+')':''),s:14,w:700}];
    if(S.serv&&phn)L.push({t:'About '+Math.round(m/S.serv.mg).toLocaleString('en-US')+' '+S.serv.n,s:13});
    L.push({t:'This is rat data scaled by mass. Real harm starts far below the LD₅₀, so it is never a safe or target amount.',s:12.5,c:PAL['cv-soft']});}
  if(ap&&!phn)L.push({t:'R = 1/(1 + (LD₅₀/D)^h) = 1/(1 + ('+S.ld+' / '+(D>=10?D.toFixed(0):D.toFixed(2))+')^'+S.h+') = '+(100*R(S,D)).toFixed(1)+'%',s:12.5,c:PAL['cv-soft']});
  textBox(ctx,bb,L,k);}

/* ---------- bloodstream view ---------- */
function drawConc(ctx,sim,b,k,panel){const p=sim.p,P=pk(p),th=sim.st.th;const ymax=Math.max(CTOX*1.25,P.peak*1.15);const X=t=>b.x+t/HOURS*b.w,Y=c=>b.y+b.h-c/ymax*b.h;
  ctx.fillStyle=PAL['s3'];ctx.globalAlpha=0.13;ctx.fillRect(b.x,Y(CEFF[1]),b.w,Y(CEFF[0])-Y(CEFF[1]));ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;const ys=ymax>60?20:ymax>30?10:5;
  for(let c=0;c<=ymax;c+=ys){const y=Math.round(Y(c))+.5;ctx.beginPath();ctx.moveTo(b.x,y);ctx.lineTo(b.x+b.w,y);ctx.stroke();txt(ctx,String(c),b.x-6,y,{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});}
  for(let h=0;h<=HOURS;h+=(k>1.35?6:4)){const x=Math.round(X(h))+.5;ctx.beginPath();ctx.moveTo(x,b.y);ctx.lineTo(x,b.y+b.h);ctx.stroke();txt(ctx,h+' h',x,b.y+b.h+15*k,{s:12*k,c:PAL['g-axis'],a:'center'});}
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(b.x+.5,b.y);ctx.lineTo(b.x+.5,b.y+b.h);ctx.lineTo(b.x+b.w,b.y+b.h+.5);ctx.stroke();
  ctx.setLineDash([6,4]);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,Y(CTOX));ctx.lineTo(b.x+b.w,Y(CTOX));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'toxic effects reported above 15 mg/L',b.x+b.w-4,Y(CTOX)-6,{s:12*k,c:PAL['s1'],a:'right',w:600});
  txt(ctx,'typical after coffee',b.x+6,Y(CEFF[1])+14*k,{s:12*k,c:PAL['s3'],w:600});
  ctx.strokeStyle=PAL['s2'];ctx.globalAlpha=0.35;ctx.lineWidth=2;ctx.beginPath();for(let t=0;t<=HOURS;t+=0.05){const y=Y(P.C(t));t?ctx.lineTo(X(t),y):ctx.moveTo(X(t),y);}ctx.stroke();ctx.globalAlpha=1;
  ctx.lineWidth=3;ctx.beginPath();for(let t=0;t<=th;t+=0.05){const y=Y(P.C(t));t?ctx.lineTo(X(t),y):ctx.moveTo(X(t),y);}ctx.stroke();
  ctx.fillStyle=PAL['s2'];ctx.beginPath();ctx.arc(X(th),Y(P.C(th)),5.5,0,TAU);ctx.fill();
  P.times.forEach(ti=>{const x=X(ti);ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.moveTo(x,b.y+b.h-2);ctx.lineTo(x-6,b.y+b.h-12);ctx.lineTo(x+6,b.y+b.h-12);ctx.closePath();ctx.fill();});
  if(!panel){txt(ctx,'Caffeine in plasma (mg/L)',b.x,b.y-12,{s:12*k,c:PAL['cv-soft']});}
  else{legend(ctx,b.x+8,b.y-8,[{label:'caffeine in plasma',color:PAL['s2']},{label:'15 mg/L',color:PAL['s1'],dash:true}]);}}
function drawBody(sim,ctx,vdt,k,t){const p=sim.p,P=pk(p),th=sim.st.th,c=P.C(th),phn=k>1.35,ap=atLeast('ap');
  txt(ctx,'Caffeine, '+SUB.caffeine.f,20,30,{s:15*k,w:700});
  const cx=158,cy=phn?162:168,r=phn?100:106;ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.clip();ctx.fillStyle='#f3d6cf';ctx.fillRect(cx-r,cy-r,2*r,2*r);
  // a few red blood cells drifting through the plasma
  const tt=RM?0:t;for(let i=0;i<7;i++){const x=cx-r+((i*83+tt*18)%(2*r+60))-30,y=cy-r+30+((i*57)%(2*r-60));ctx.fillStyle='#c0392b';ctx.globalAlpha=0.55;ctx.beginPath();ctx.ellipse(x,y,17,11,i,0,TAU);ctx.fill();ctx.globalAlpha=1;}
  const per=0.0667,nd=Math.min(180,Math.round(c/per));const R2=rng(3);
  for(let i=0;i<nd;i++){const a=R2()*TAU,d=Math.sqrt(R2())*(r-8),x=cx+Math.cos(a)*d+Math.sin(tt*1.3+i)*3,y=cy+Math.sin(a)*d+Math.cos(tt*1.1+i*0.7)*3;ctx.fillStyle='#4a2c12';ctx.beginPath();ctx.arc(x,y,3.2,0,TAU);ctx.fill();}
  ctx.restore();ctx.strokeStyle=PAL['line'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  txt(ctx,'Blood plasma, zoomed',cx,cy-r-10,{s:12*k,c:PAL['cv-soft'],a:'center'});
  txt(ctx,c.toFixed(2)+' mg/L at '+th.toFixed(1)+' h',cx,cy+r+20*k,{s:14*k,w:700,a:'center'});
  if(!phn)txt(ctx,'1 dot ≈ 0.07 mg/L'+(nd>=180?' (display capped)':''),cx,cy+r+38*k,{s:12*k,c:PAL['cv-soft'],a:'center'});
  const b={x:phn?374:384,y:phn?48:52,w:phn?402:392,h:phn?190:226};drawConc(ctx,sim,b,k,false);
  const L=[{t:'C(t) falls as C₀·e^(−kt), with k = ln 2 / t½ = 0.693 / '+p.thalf+' h = '+P.k.toFixed(3)+' h⁻¹',s:13.5,w:700}];
  L.push({t:p.n>1?(p.n+' servings of '+p.mg+' mg, '+p.tau+' h apart: highest level '+P.peak.toFixed(1)+' mg/L'):('One serving of '+p.mg+' mg in '+P.V.toFixed(0)+' L of distribution volume: peak '+P.peak.toFixed(2)+' mg/L'),s:13});
  if(ap&&p.n>1&&!phn)L.push({t:'Accumulation factor 1/(1 − e^(−kτ)) = '+P.acc.toFixed(2)+';  steady-state average D/(kVτ) = '+P.css.toFixed(2)+' mg/L',s:12.5,c:PAL['cv-soft']});
  L.push({t:'A model for learning kinetics, not medical guidance.',s:12,c:PAL['cv-soft']});
  textBox(ctx,{x:12,y:phn?300:338,w:776,h:phn?100:80},L,k);}
TOX.onLevel=syncMode;TOX.controls[0].onChange=sim=>{syncMode(sim);sim.st.th=0;sim.st.hold=false;sim.infoDirty=true;};
BioLab.register(TOX);
})();

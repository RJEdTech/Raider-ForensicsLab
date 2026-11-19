/* ForensicsLab Learn it, part A: the lab tools (Nov 18, 2026).
   crimescene, fingerprints, toxicology, spottest, timeofdeath, anthropology, handwriting, chromatography, hairfiber, spectroscopy.
   Same shape as BioLab's learn-more.js: each step reuses the tool's own walkthrough setups (captured below, before Learn it
   replaces the tour) and adds a live number card from the tool's metrics. Extra why questions are appended to each tool's
   existing review questions (review.js) with addQs(), so nothing in review.js is replaced. */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TSTEP=(id,title)=>(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});
const tour=(id,title,after)=>sim=>{const s=TSTEP(id,title);if(s&&s.setup)s.setup(sim);if(after)after(sim);};
const TF=(id,title)=>{const s=TSTEP(id,title);return s?s.focus:undefined;};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
/* formatted metric: value + unit; FL adds the label */
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u==='%'?'%':u&&!/^\(|^of |^\(/.test(u)&&u.length<14?' '+u:(u&&/^of /.test(u)?' '+u:''));};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* card: word-wrapped rows; o.up draws it upward from y */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.minH)h=Math.max(h,o.minH);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.97;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* red ring around the part of the picture that matters in this step */
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
/* evaluate a metric as if one control had another value (for graphs drawn from the model) */
const MAT=(sim,id,o)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(Object.assign(Object.create(Object.getPrototypeOf(sim)),sim,{p:Object.assign({},sim.p,o)}));}catch(e){return NaN;}};
/* append why questions to a tool's existing review questions (addReview replaces a whole tool's entry, so read it first) */
let RV=null;
function reviews(){if(RV)return RV;const oa=Object.assign;Object.assign=function(t){RV=t;return oa.apply(this,arguments);};try{BioLab.addReview({});}finally{Object.assign=oa;}return RV||{};}
function addQs(id,qs){const R=reviews();const cur=R[id]||{questions:[]};const have=new Set((cur.questions||[]).map(q=>q.id));
  cur.questions=(cur.questions||[]).concat(qs.filter(q=>!have.has(q.id)));R[id]=cur;}
/* run fn once per step visit, after the step's own setup has settled */
const once=(sim,tau,t,fn)=>{if(tau>=t&&sim._lnOnce!==sim.lnT0){sim._lnOnce=sim.lnT0;fn(sim);}};
const atLeastH=()=>H.level==='honors'||H.level==='ap';
const L={};

/* ---------- crimescene ---------- */
const csCard=(ctx,k,LH,rows)=>card(ctx,k,566,LH-14,218,rows,{up:true});
const csAll=sim=>{sim.st.prog=1e6;};   /* finish the search so later steps have the found items */
L.crimescene={
  goals:{
    bio:['Why a scene is secured before anyone searches it','What Locard’s exchange principle says','How line and zone searches trade time for evidence found','How evidence is sketched and packaged so it holds up in court'],
    honors:['How an alternate light source finds trace evidence','How triangulation locates an item from two fixed points'],
    ap:['Why the chain of custody decides whether evidence can be used']},
  matters:'Most evidence is won or lost in the first hour. A rushed search, a careless step or a sealed plastic bag can destroy the clue that would have solved the case, and once the scene is released you can’t go back.',
  steps:[
    {key:'secure',title:'Secure the scene',run:tour('crimescene','Secure the scene'),pause:true,focus:TF('crimescene','Secure the scene'),
     see:'A chemistry room after a break-in, seen from above. The red outline is the secured scene: one way in, and every visitor logged.',
     why:'Every person who walks in can add a trace or wipe one away. Securing it first protects what is there.'},
    {key:'locard',title:'Every contact leaves a trace',run:tour('crimescene','Secure the scene'),speed:0.4,focus:TF('crimescene','Every contact'),
     see:'Yellow markers by the broken window: glass, a shoe print and blood drops. More traces are hidden around the room.',
     why:'<b>Locard’s exchange principle:</b> every contact leaves a trace, both ways. The intruder left things behind and carried things away.'},
    {key:'line',title:'A line search',run:tour('crimescene','A line search'),speed:1,focus:TF('crimescene','A line search'),
     see:'Four searchers walk side by side in lanes across the room. Watch the evidence log fill.',
     why:'A <b>line search</b> is fast, but the benches break up the lanes. Items under furniture or on the cabinet get only a quick look.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[[FL(sim,'found',0),{w:800}],[FL(sim,'time',0)]]);}},
    {key:'zone',title:'A zone search',set:{pattern:'zone'},run:tour('crimescene','A zone search'),speed:1,focus:TF('crimescene','A zone search'),
     see:'Now the room is split into zones, each searched closely. Compare the count and the time with the line search.',
     why:'A <b>zone search</b> looks at every bench and cabinet up close. It takes longer, but in a furnished room it finds far more.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[[FL(sim,'found',0),{w:800,c:GREEN}],[FL(sim,'time',0)],atLeastH()?[FL(sim,'pmin',0)]:'']);}},
    {key:'hook',title:'Your question: which search?',set:{pattern:'zone'},run:tour('crimescene','A zone search',csAll),pause:true,focus:TF('crimescene','A zone search'),
     see:'From this model: the line search finds 6 of 11 items in about 6 minutes; the zone search finds 10 in about 24.',
     why:'Four more items for 18 more minutes. Once the scene is released, missed evidence is gone, so the zone search wins.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[['Line: 6 of 11, about 6 min'],['Zone: 10 of 11, about 24 min',{w:800,c:GREEN}],['(about 95 person-minutes)',{s:12}]]);}},
    {key:'als',lvl:'honors',title:'Light up trace evidence',set:{pattern:'zone',als:true},run:tour('crimescene','Light up trace evidence',csAll),speed:1,focus:TF('crimescene','Light up'),
     see:'An <b>alternate light source</b>: a strong light of one color, viewed through orange goggles. Fibers, hairs and fluids glow.',
     why:'These traces are nearly invisible in room light. Under the light, the hair under a bench finally shows up.',
     overlay(sim,ctx,LH,k,tau){once(sim,tau,0.4,csAll);csCard(ctx,k,LH,[[FL(sim,'found',0),{w:800,c:GREEN}]]);}},
    {key:'sketch',title:'Photograph and sketch',set:{mode:'document',item:'bottle',method:'base',pattern:'zone'},run:tour('crimescene','Photograph and sketch',csAll),pause:true,focus:TF('crimescene','Photograph and sketch'),
     see:'The water bottle is placed on the sketch by a <b>baseline</b>: a distance along the wall from corner A, then straight out.',
     why:'Each item is photographed with a scale and measured from fixed points, so anyone can put it back exactly where it was.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[[FL(sim,'pos'),{w:800}]]);}},
    {key:'tri',lvl:'honors',title:'Triangulation',set:{mode:'document',item:'bottle',method:'tri',pattern:'zone'},run:tour('crimescene','Photograph and sketch',sim=>{csAll(sim);BioLab.setValues(sim,{method:'tri'});}),pause:true,focus:TF('crimescene','Photograph and sketch'),
     see:'The same bottle, now measured from two fixed points, A and B.',
     why:'Two distances from two known points fix one spot. It works even when no straight wall is nearby, like outdoors.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[[FL(sim,'tri'),{w:800}],H.level==='ap'?[FL(sim,'unc')]:'']);}},
    {key:'pack',title:'Package it right',run:tour('crimescene','Package it right',csAll),pause:true,focus:TF('crimescene','Package it right'),
     see:'The blood drops go into a paper bag, sealed, initialed and logged with the time.',
     why:'Damp, biological items go in <b>paper</b> so they can breathe; sealed in plastic, they rot and the DNA breaks down. Electronics go in anti-static bags.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[['Blood: paper bag ✓',{w:800,c:GREEN}]]);}},
    {key:'custody',lvl:'ap',title:'Chain of custody',run:tour('crimescene','Package it right',csAll),pause:true,focus:TF('crimescene','Chain of custody'),
     see:'Every person who holds this bag signs for it, with the date and time.',
     why:'A gap in the <b>chain of custody</b> lets the defense argue the evidence was swapped or changed, and a judge may exclude it.',
     overlay(sim,ctx,LH,k){csCard(ctx,k,LH,[[FL(sim,'evtype'),{w:700}]]);}}
  ],
  useIt:[
    {do:'Lost something small, like an earring or a key? Search the room in strips, then check under the furniture.',why:'A quick look misses the same places a line search misses: under and behind things. A strip-by-strip search covers every spot once.'},
    {do:'If something happens to you or your property, don’t clean up before it is reported. Take photos first.',why:'Locard’s principle works for you: the traces are there until someone wipes them away.'},
    {do:'Keep receipts and records with the date and who handled them.',why:'It is the same idea as the chain of custody: a clear record of who had something, and when, is what makes it believable later.'}],
  tryIt:[{title:'line search vs zone search (10 minutes)',steps:['Have someone hide 10 coins around a room: some in the open, some under or behind furniture.','Search once by walking straight across the room in lanes, for 1 minute. Count what you find.','Put them back. Now search one corner at a time, looking under and behind everything. Time it and count.'],look:'The lane search is faster but misses the coins under furniture. The zone search takes longer and finds more, just like the model.'}]};

/* ---------- fingerprints ---------- */
const fpCard=(ctx,k,LH,rows)=>card(ctx,k,392,LH-12,396,rows,{up:true});
const fpCmp=(ctx,k,LH,rows)=>card(ctx,k,24,LH-8,300,rows,{up:true});
L.fingerprints={
  goals:{
    bio:['What a latent print is made of','Why powder works on glass but not on paper','Which method to use on paper, and on plastic','How a scene print is matched to a person'],
    honors:['Class vs individual characteristics: pattern type vs minutiae','How iodine (physical) and ninhydrin (chemical) differ'],
    ap:['How temperature changes the development rate constant k']},
  matters:'Choosing the wrong method can ruin a print for good: powder on paper makes a smudge, and the print can’t be redeveloped. Picking the method that matches the surface is the difference between an identification and nothing.',
  steps:[
    {key:'latent',title:'An invisible print',run:tour('fingerprints','An invisible print'),pause:true,focus:TF('fingerprints','An invisible print'),
     see:'A glass slide with a print you can’t see. The circle zooms in on two ridges coated with sweat and skin oil.',
     why:'A <b>latent</b> print is there but invisible: mostly water, plus salts, amino acids and oils. Each method targets one part.'},
    {key:'powder',title:'Dusting with powder',run:tour('fingerprints','Dusting with powder'),speed:0.3,focus:TF('fingerprints','Dusting with powder'),
     see:'Black powder is brushed on. The grains stick to the moist, oily ridges and brush off the clean valleys.',
     why:'Nothing reacts; the powder just sticks. It is fast and works best on smooth, <b>nonporous</b> surfaces like glass.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[[FL(sim,'contrast',0),{w:800}],[FL(sim,'detail')]]);}},
    {key:'paper',title:'Paper soaks up the print',run:tour('fingerprints','Paper soaks up'),speed:0.5,focus:TF('fingerprints','Paper soaks up'),
     see:'The same powder on paper. The print stays a gray smudge.',
     why:'Paper is <b>porous</b>. The residue soaked into the fibers, so the powder sticks to fibers everywhere, not just the ridges.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[[FL(sim,'contrast',0),{w:800,c:RED}],[FL(sim,'detail')]]);}},
    {key:'iodine',title:'Iodine fuming',set:{surface:'paper'},run:tour('fingerprints','Iodine fuming'),speed:1,focus:TF('fingerprints','Iodine fuming'),
     see:'Violet iodine vapor surrounds the paper, and the ridges turn brown.',
     why:'Iodine <b>sublimes</b> (solid straight to gas) and dissolves into the oils. Nothing reacts, so the print fades once it leaves the cabinet.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[[FL(sim,'contrast',0),{w:800}]]);}},
    {key:'ninhydrin',title:'Ninhydrin',set:{surface:'paper'},run:tour('fingerprints','Ninhydrin'),speed:0.5,focus:TF('fingerprints','Ninhydrin'),
     see:'Ninhydrin spray on the paper, in a warm, humid chamber. The ridges turn purple.',
     why:'Ninhydrin reacts with the <b>amino acids</b> from sweat. They stay in paper for years, so it works even on old documents.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[[FL(sim,'contrast',0),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: the jar and the envelope',set:{surface:'paper'},run:tour('fingerprints','Ninhydrin'),speed:2,focus:TF('fingerprints','Ninhydrin'),
     see:'From this model: powder reaches about 92% contrast on glass but stalls near 22% on paper. Ninhydrin develops the envelope.',
     why:'Powder gives a usable print on the jar only. On the envelope, use ninhydrin: it reaches about 95%, sharp enough to compare.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[['Powder on glass: about 92%'],['Powder on paper: about 22%',{c:RED}],['Ninhydrin on paper now: '+F(sim,'contrast',0),{w:800,c:GREEN}]]);}},
    {key:'glue',title:'Super glue fuming',run:tour('fingerprints','Super glue fuming'),speed:0.6,focus:TF('fingerprints','Super glue fuming'),
     see:'A plastic bag in a super glue chamber. White plastic builds up along every ridge.',
     why:'Heated <b>super glue</b> vapor reacts with water on the ridges and links into a hard polymer. It is the method for bags and cans.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[[FL(sim,'contrast',0),{w:800}]]);}},
    {key:'compare',title:'Compare with suspects',run:tour('fingerprints','Compare with suspects'),pause:true,focus:TF('fingerprints','Compare with suspects'),
     see:'The partial scene print beside a suspect’s inked card. Green lines join points that match.',
     why:'First check the pattern: loop, whorl or arch. Then compare <b>minutiae</b>, the places where ridges end or split.',
     overlay(sim,ctx,LH,k){fpCmp(ctx,k,LH,[[FL(sim,'pattern'),{w:700}],[FL(sim,'match'),{w:800,c:GREEN}]]);}},
    {key:'class',lvl:'honors',title:'Class vs individual',run:tour('fingerprints','Class vs individual'),pause:true,focus:TF('fingerprints','Class vs individual'),
     see:'Circles mark ridge endings and squares mark splits. Blue is the core; orange is the delta.',
     why:'A loop is a <b>class</b> characteristic shared by many people. Minutiae are <b>individual</b>: they point to one person.',
     overlay(sim,ctx,LH,k){fpCmp(ctx,k,LH,[[FL(sim,'freq'),{w:700}]]);}},
    {key:'heat',lvl:'ap',title:'Heat speeds the reaction',set:{surface:'paper',method:'ninhydrin',heat:true,temp:80},run:tour('fingerprints','Ninhydrin'),speed:1,focus:TF('fingerprints','Ninhydrin'),
     see:'Ninhydrin on paper at 80 °C and 70% humidity. Read the rate constant and the half-time.',
     why:'Higher temperature raises <b>k</b>, so the half-time (ln 2 ÷ k) shrinks. Switch the chamber off and the print barely develops.',
     overlay(sim,ctx,LH,k){fpCard(ctx,k,LH,[[FL(sim,'k',3),{w:800}],[FL(sim,'thalf',1)]]);}}
  ],
  useIt:[
    {do:'Notice where your own prints show up: phone screens, glasses, a glossy table.',why:'Smooth, nonporous surfaces hold the oily residue on top, which is why powder works on them and why a screen shows every smudge.'},
    {do:'Handle important papers by the edges.',why:'Paper soaks up sweat, and the amino acids stay for years. That is why ninhydrin can find prints on old documents.'},
    {do:'When a TV show says “we got a match” from half a print, ask what was compared.',why:'A shared pattern type is class evidence. Only matching minutiae point to one person, and examiners can still make mistakes.'}],
  tryIt:[{title:'cocoa powder prints (10 minutes)',steps:['Rub your fingertip on your forehead, then press it firmly on a clean drinking glass and on a sheet of paper.','Sprinkle a little cocoa powder or cornstarch on each print and gently blow off the extra.','Look at both with a flashlight held low.'],look:'The glass print shows clear ridges. The paper print is a blur, because the residue soaked into the fibers. That is why labs use ninhydrin on paper.'}]};

/* ---------- toxicology ---------- */
const txCard=(ctx,k,LH,rows)=>k>1.3?card(ctx,k,8,LH-6,784,rows,{up:true}):card(ctx,k,370,56,206,rows);   /* phones: across the bottom */
const txBody=(ctx,k,LH,rows)=>card(ctx,k,18,6,296,rows);
L.toxicology={
  goals:{
    bio:['How a dose–response test works','What the LD₅₀ is, and why a lower LD₅₀ means more toxic','Why toxicity is measured per kilogram of body mass','Why “the dose makes the poison”'],
    honors:['How caffeine rises and falls in the blood','Why repeated doses build up: half-life'],
    ap:['First-order elimination, k and the accumulation factor']},
  matters:'Labels, news stories and overdose warnings all rest on dose. Knowing that harm depends on how much, per kilogram, explains why pure caffeine powder is dangerous and why a medicine can be safe at one dose and harmful at another.',
  steps:[
    {key:'test',title:'A dose–response test',run:tour('toxicology','A dose–response test'),pause:true,focus:TF('toxicology','A dose–response test'),
     see:'Each rat is one animal in a test group of 40. The dose is in milligrams per kilogram of body mass (mg/kg).',
     why:'Toxicologists give a group a dose and count how many respond. Dosing per kilogram lets small and large animals compare fairly.'},
    {key:'raise',title:'Raise the dose',run:tour('toxicology','Raise the dose'),speed:1,focus:TF('toxicology','Raise the dose'),
     see:'The dose rises from low to high. Rats turn red as they respond, and the dot climbs the curve.',
     why:'Animals differ in tolerance. The most sensitive respond first, so the share responding grows gradually, not all at once.',
     overlay(sim,ctx,LH,k){txCard(ctx,k,LH,[[FL(sim,'dmg',0),{w:700}],[FL(sim,'resp'),{w:800}]]);}},
    {key:'curve',title:'The S-shaped curve',run:tour('toxicology','The S-shaped curve'),speed:1,focus:TF('toxicology','The S-shaped curve'),
     see:'On a log scale of dose, the share responding makes an S. The dashed lines mark where half the group responds.',
     why:'That dose is the <b>LD₅₀</b>: the dose that kills half of a test group. For caffeine in rats it is 192 mg/kg.',
     overlay(sim,ctx,LH,k){txCard(ctx,k,LH,[[FL(sim,'ld',0),{w:800}]]);}},
    {key:'nicotine',title:'Lower LD₅₀, more toxic',run:tour('toxicology','Lower LD₅₀'),speed:1,focus:TF('toxicology','Lower LD₅₀'),
     see:'Nicotine’s curve sits far to the left of where caffeine’s was. Half the group responds at only 50 mg/kg.',
     why:'The lower the LD₅₀, the smaller the dose that harms, so the more toxic the substance.',
     overlay(sim,ctx,LH,k){txCard(ctx,k,LH,[[FL(sim,'ld',0),{w:800,c:RED}],atLeastH()?[FL(sim,'cls')]:'']);}},
    {key:'hook',title:'Your question: salt or caffeine?',set:{sub:'salt',dose:Math.log10(3000)},speed:1,focus:TF('toxicology','The S-shaped curve'),
     see:'Table salt’s curve: half the group responds at 3000 mg/kg. Caffeine’s LD₅₀ was 192 mg/kg.',
     why:'3000 ÷ 192 ≈ 16, so per kilogram caffeine is about 16 times more toxic. These rat numbers rank substances; they never give a safe amount.',
     overlay(sim,ctx,LH,k){txCard(ctx,k,LH,[['Salt: '+F(sim,'ld',0),{w:700}],['Caffeine: 192 mg/kg',{w:700,c:RED}],['3000 ÷ 192 ≈ 16× more toxic',{w:800}]]);}},
    {key:'mass',title:'Scale by body mass',run:tour('toxicology','Scale by body mass'),pause:true,focus:TF('toxicology','Scale by body mass'),
     see:'The bottom line multiplies caffeine’s LD₅₀ by a 60 kg body mass.',
     why:'192 mg/kg × 60 kg ≈ 11.5 g. That is classroom math from rat data. Harm in people starts far lower, so it is never a safe amount.'},
    {key:'water',title:'The dose makes the poison',run:tour('toxicology','The dose makes the poison'),speed:1,focus:TF('toxicology','The dose makes the poison'),
     see:'Even water has an LD₅₀: about 90,000 mg/kg in rats, far to the right of the others.',
     why:'<b>The dose makes the poison.</b> Every substance can harm at a high enough dose. Toxicity is about how much, not just what.',
     overlay(sim,ctx,LH,k){txCard(ctx,k,LH,[[FL(sim,'ld',0),{w:800}]]);}},
    {key:'blood',lvl:'honors',title:'Into the bloodstream',run:tour('toxicology','Into the bloodstream'),speed:1,focus:TF('toxicology','Into the bloodstream'),
     see:'One 95 mg cup of coffee in a 60 kg person. Blood caffeine rises for about an hour, then slowly falls.',
     why:'The gut absorbs it; the liver clears it. Each dot in the circle stands for a fixed amount of caffeine in the blood.',
     overlay(sim,ctx,LH,k){txBody(ctx,k,LH,[[FL(sim,'cnow',2),{w:800}],[FL(sim,'cpeak',2)]]);}},
    {key:'build',lvl:'honors',title:'Half-life and build-up',run:tour('toxicology','Half-life and build-up'),speed:1,focus:TF('toxicology','Half-life and build-up'),
     see:'Six servings, one every 4 hours. Each peak is higher than the one before.',
     why:'Half the caffeine is cleared every <b>half-life</b>, about 5 h. The next serving arrives before the last is gone, so the level builds up.',
     overlay(sim,ctx,LH,k){txBody(ctx,k,LH,[[FL(sim,'cpeak',2),{w:800,c:RED}],[FL(sim,'abody',0)]]);}},
    {key:'steady',lvl:'ap',title:'Toward a steady state',set:{view:'body',n:6,mg:95,tau:4},run:tour('toxicology','Half-life and build-up'),speed:1,focus:TF('toxicology','Half-life and build-up'),
     see:'The same schedule. Read k, the accumulation factor and the steady-state average.',
     why:'k = ln 2 ÷ 5 h ≈ 0.139 per hour. Repeated doses build up by 1/(1 − e^(−kτ)) until the amount cleared per dose equals the dose.',
     overlay(sim,ctx,LH,k){txBody(ctx,k,LH,[[FL(sim,'kel',3)],[FL(sim,'acc',2)],[FL(sim,'css',2),{w:800}]]);}}
  ],
  useIt:[
    {do:'Check the caffeine in energy drinks and pre-workout powders, not just the number of cans.',why:'Toxicity depends on dose per kilogram. Several high-caffeine drinks close together add up, and they build up because caffeine’s half-life is hours long.'},
    {do:'Follow the dose on medicine labels, even for “safe” medicines like acetaminophen.',why:'The dose makes the poison. A medicine that helps at one dose can damage the liver at a few times that dose.'},
    {do:'Keep medicines and cleaning products away from young children.',why:'A child’s body mass is small, so the same amount is a much bigger dose per kilogram.'}],
  tryIt:[{title:'your caffeine half-life (5 minutes, no caffeine needed)',steps:['Pick a drink with a known amount of caffeine, such as a 95 mg cup of coffee at 3 PM.','Halve the amount every 5 hours: 8 PM, 1 AM, 6 AM.','Write how much is still in your body at bedtime.'],look:'About half is still there 5 hours later. That is why a late-afternoon drink can still affect sleep.'}]};

/* ---------- spottest ---------- */
const stCard=(ctx,k,LH,rows)=>card(ctx,k,530,318,258,rows);
L.spottest={
  goals:{
    bio:['What a presumptive (spot) test can and can’t tell you','How water, iodine, vinegar, pH paper and a flame each pick out a powder','The smallest set of tests that tells four kitchen powders apart'],
    honors:['Why Benedict’s test finds glucose but not table sugar'],
    ap:['Why a color test is presumptive, and what confirms an identity']},
  matters:'Field drug tests are color tests like these, and they give false positives: people have been arrested over harmless powders. Knowing what a spot test can and can’t prove is how you judge that evidence.',
  steps:[
    {key:'plate',title:'Presumptive tests',run:tour('spottest','Presumptive tests'),speed:1,focus:TF('spottest','Presumptive tests'),
     see:'A spot plate with one well per white powder. The last well, labeled in red, is the evidence from the scene.',
     why:'A <b>presumptive test</b> tells you what a powder might be, not what it is. Goggles on, and never taste or sniff an unknown.'},
    {key:'water',title:'Does it dissolve?',run:tour('spottest','Does it dissolve?'),speed:1,focus:TF('spottest','Does it dissolve?'),
     see:'Water in every well. Most powders dissolve and look clear; cornstarch stays cloudy.',
     why:'Salt, sugar and baking soda break apart among the water molecules. Starch chains are too big, so they stay clumped and scatter light.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}},
    {key:'iodine',title:'Iodine finds starch',run:tour('spottest','Iodine finds starch'),speed:1,focus:TF('spottest','Iodine finds starch'),
     see:'Iodine is amber-brown in most wells, but cornstarch turns blue-black. The circle shows the molecules.',
     why:'Iodine slips inside the coiled starch molecule, and the pair absorbs light differently. Blue-black means starch.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}},
    {key:'vinegar',title:'Vinegar finds carbonates',run:tour('spottest','Vinegar finds carbonates'),speed:1,focus:TF('spottest','Vinegar finds carbonates'),
     see:'Vinegar is added to every well. Only baking soda fizzes.',
     why:'Acetic acid reacts with the bicarbonate in baking soda to make carbon dioxide gas. Powders without a carbonate do nothing.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}},
    {key:'ph',title:'pH paper',run:tour('spottest','pH paper'),speed:1,focus:TF('spottest','pH paper'),
     see:'pH paper in each well. Aspirin turns red-orange, baking soda blue-green, and most others green.',
     why:'The color shows the pH. Aspirin is an acid and baking soda a weak base. Neutral powders stay green, near pH 7.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}},
    {key:'flame',title:'Flame test',run:tour('spottest','Flame test'),speed:1,focus:TF('spottest','Flame test'),
     see:'Each powder is held in a burner flame on a wire loop. Table salt glows yellow-orange.',
     why:'Heat lifts electrons in sodium ions to a higher energy level. When they fall back, they give off yellow-orange light.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}},
    {key:'hook',title:'Your question: which tests are enough?',set:{test:'flame',sample:'salt'},run:tour('spottest','Flame test'),pause:true,focus:TF('spottest','Flame test'),
     see:'Baking soda, cornstarch, sugar or salt: three of these tests tell all four apart.',
     why:'Vinegar picks out baking soda, and iodine picks out cornstarch. Sugar and salt both dissolve, but only salt glows yellow; sugar chars black.',
     overlay(sim,ctx,LH,k){card(ctx,k,530,300,258,[['1. Vinegar fizzes: baking soda'],['2. Iodine blue-black: cornstarch'],['3. Flame yellow: salt (sugar chars)',{w:800}]]);}},
    {key:'benedict',lvl:'honors',title:'Benedict’s needs heat',run:tour('spottest','Benedict’s needs heat'),speed:1,focus:TF('spottest','Benedict’s needs heat'),
     see:'Benedict’s solution is heated with each powder. Glucose turns brick red; table sugar stays blue.',
     why:'Benedict’s finds <b>reducing sugars</b>. Glucose has a reactive group that turns blue Cu²⁺ into red Cu₂O. In sucrose that group is locked up.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}},
    {key:'proof',lvl:'ap',title:'Presumptive, not proof',run:tour('spottest','Presumptive, not proof'),speed:1,focus:TF('spottest','Presumptive, not proof'),
     see:'Reagent X colors the simulated drug samples and the evidence. It also browns some sugars slowly.',
     why:'A color test narrows the list; it doesn’t prove identity. A lab confirms with a spectrum matched to a known reference.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[F(sim,'sel'),{w:800}],[F(sim,'res')]]);}}
  ],
  useIt:[
    {do:'Use vinegar to check whether an old white powder in the pantry is baking soda.',why:'Baking soda is a bicarbonate, so it fizzes as it makes carbon dioxide. Baking powder fizzes too, but cornstarch, sugar and salt don’t.'},
    {do:'Never taste or sniff an unknown powder, even at home.',why:'Many dangerous powders look like sugar or salt. Tests like these exist so nobody has to guess by taste.'},
    {do:'When you hear that a field test “came back positive,” ask whether a lab confirmed it.',why:'Color tests are presumptive. Harmless substances can give the same color, so only a confirmatory test proves identity.'}],
  tryIt:[{title:'kitchen powder detective (15 minutes, with an adult)',steps:['Put a spoonful of baking soda, cornstarch, sugar and salt on four labeled plates.','Add a few drops of vinegar to each. Then, on fresh samples, add a drop of iodine tincture from a first-aid kit (don’t eat anything after).','Have someone mix up the plates, and identify each powder with your two tests plus how it dissolves in water.'],look:'Only baking soda fizzes, and only cornstarch turns blue-black. Sugar and salt both dissolve; telling them apart needs the flame test, which is for the lab.'}]};

/* ---------- timeofdeath ---------- */
const tdCard=(ctx,k,LH,rows)=>card(ctx,k,536,52,246,rows);
const tdIns=(ctx,k,LH,rows)=>card(ctx,k,14,LH-10,380,rows,{up:true});
L.timeofdeath={
  goals:{
    bio:['Why a body cools fast at first and then slowly','What Glaister’s rule estimates, and why it is only rough','How rigor and livor mortis change over the first day','How the insect clock gives a minimum time, and why temperature matters'],
    honors:['Newton’s law of cooling','Degree hours: why insects grow faster when it is warm'],
    ap:['Why real cooling starts with a plateau (Henssge’s model)']},
  matters:'Time since death can confirm or break an alibi. No single clue is exact, so investigators combine the cooling curve, rigor, livor and insects, and the overlap is what they report.',
  steps:[
    {key:'heat',title:'Heat leaves the body',run:tour('timeofdeath','Heat leaves the body'),pause:true,focus:TF('timeofdeath','Heat leaves the body'),
     see:'The thermometer shows the body’s core (rectal) temperature, 37 °C at death. The air is 20 °C.',
     why:'After death the body stops making heat. Heat flows from warm to cool, so the body starts cooling toward the air.',
     overlay(sim,ctx,LH,k){tdCard(ctx,k,LH,[[FL(sim,'tc',1),{w:800}]]);}},
    {key:'curve',title:'The cooling curve',run:tour('timeofdeath','The cooling curve'),speed:1,focus:TF('timeofdeath','The cooling curve'),
     see:'The red curve traces the temperature hour by hour. It falls fast at first, then more slowly near the air temperature.',
     why:{bio:'Heat flows faster when the temperature difference is bigger. As the body nears the air temperature, cooling slows.',honors:'<b>Newton’s law of cooling:</b> the rate of heat loss is proportional to the difference, T − T(air). Smaller gap, slower cooling.'},
     overlay(sim,ctx,LH,k){tdCard(ctx,k,LH,[[FL(sim,'h',1),{w:700}],[FL(sim,'tc',1),{w:800}]]);}},
    {key:'glaister',title:'Glaister’s rule',run:tour('timeofdeath','The cooling curve'),speed:1,focus:TF('timeofdeath','Glaister’s rule'),
     see:'The dashed orange line is a classroom rule: hours ≈ (98.6 °F − rectal temperature in °F) ÷ 1.5.',
     why:'The rule assumes the body loses the same amount every hour, but real cooling curves. It is rough, and only for about the first half day.',
     overlay(sim,ctx,LH,k){tdCard(ctx,k,LH,[[FL(sim,'h',1)],[FL(sim,'gl',1),{w:800,c:'#b8860b'}]]);}},
    {key:'rigor',title:'Rigor and livor',run:tour('timeofdeath','The cooling curve'),speed:1,focus:TF('timeofdeath','Rigor and livor'),
     see:'The bars under the graph show stiffening (rigor) and blood settling (livor) as the hours pass.',
     why:'<b>Rigor mortis</b> starts after about 2 h and is complete near 12 h. <b>Livor mortis</b> appears within 2 h and is fixed after 8 to 12 h.',
     overlay(sim,ctx,LH,k){tdCard(ctx,k,LH,[[FL(sim,'h',0)],[FL(sim,'rig'),{w:800}],[FL(sim,'liv'),{w:800}]]);}},
    {key:'insects',title:'The insect clock',run:tour('timeofdeath','The insect clock'),speed:1,focus:TF('timeofdeath','The insect clock'),
     see:'The circle shows a blow fly’s life cycle: eggs, three larval stages, wandering, pupa. The clock counts hours since egg-laying.',
     why:'Blow flies lay eggs within hours of death. The oldest stage found shows how long insects have been there: a minimum time.',
     overlay(sim,ctx,LH,k){tdIns(ctx,k,LH,[[FL(sim,'stage'),{w:800}],[FL(sim,'ih',0)]]);}},
    {key:'warm',title:'Warmer means faster',set:{view:'insects'},run:tour('timeofdeath','The insect clock',sim=>BioLab.setValues(sim,{ta:30})),speed:1,focus:TF('timeofdeath','The insect clock'),
     see:'The air is now 30 °C. The stages move faster, and the degree-hour bar fills more quickly.',
     why:'Insects are cold-blooded. They grow by <b>degree hours</b>: each hour adds (air temperature − 10 °C). At 30 °C that is twice as fast as at 20 °C.',
     overlay(sim,ctx,LH,k){tdIns(ctx,k,LH,[[FL(sim,'stage'),{w:800}],atLeastH()?[FL(sim,'adh',0)]:[FL(sim,'ih',0)]]);}},
    {key:'hook',title:'Your question: 25 °C or 15 °C?',set:{view:'insects',ta:15,found:'l3'},run:tour('timeofdeath','The insect clock',sim=>BioLab.setValues(sim,{ta:15})),pause:true,focus:TF('timeofdeath','The insect clock'),
     see:'Third-stage larvae were found: eggs laid 58 to 98 hours ago at 25 °C. The orange bracket shows 15 °C.',
     why:'At 15 °C each hour adds 5 degree hours, not 15, so the same larvae took three times longer: about 7 to 12 days.',
     overlay(sim,ctx,LH,k){tdIns(ctx,k,LH,[['At 25 °C: eggs laid 58 h – 98 h ago'],['At 15 °C: '+F(sim,'pmi'),{w:800,c:RED}]]);}},
    {key:'combine',title:'Combine the clues',run:tour('timeofdeath','Combine the clues'),pause:true,focus:TF('timeofdeath','Combine the clues'),
     see:'A case in a city park. Each clue gives a range of hours, and the green band is where they overlap.',
     why:'The answer has to fit every clue at once, so the overlap is the best estimate. Any one clue alone can mislead.'},
    {key:'henssge',lvl:'ap',title:'Henssge’s model',run:tour('timeofdeath','Henssge’s model'),speed:1,focus:TF('timeofdeath','Henssge’s model'),
     see:'Air at 15 °C. Look at the start of the red curve: it stays nearly flat for the first hours.',
     why:'Heat must first flow from the core to the skin, so cooling starts with a plateau. Henssge’s model adds that, body mass and clothing.',
     overlay(sim,ctx,LH,k){tdCard(ctx,k,LH,[[FL(sim,'h',1)],[FL(sim,'hs',1),{w:800}]]);}}
  ],
  useIt:[
    {do:'Notice how a hot drink cools: quickly at first, then slowly as it nears room temperature.',why:'It follows the same law as the cooling curve. The bigger the temperature gap, the faster heat leaves.'},
    {do:'Put leftovers in the fridge soon instead of waiting for them to cool on the counter.',why:'Bacteria and insects, like blow flies, grow faster when it is warm. Cold slows them, the same reason insects develop slowly at 15 °C.'},
    {do:'When a news story gives an exact time of death, look for the range behind it.',why:'Every method gives a range. Reports that sound exact usually come from combining several clues.'}],
  tryIt:[{title:'a cooling curve in a mug (20 minutes)',steps:['Pour hot tap water into a mug and put a kitchen thermometer in it.','Write the temperature every 2 minutes for 20 minutes.','Plot temperature against time.'],look:'The temperature drops fastest at the start and levels off toward room temperature, the same curved shape as the body cooling curve.'}]};

/* ---------- anthropology ---------- */
const anCase=(ctx,k,LH,rows)=>card(ctx,k,12,LH-8,236,rows,{up:true});
const anSex=(ctx,k,LH,rows)=>card(ctx,k,604,LH-12,186,rows,{up:true});
const anLow=(ctx,k,LH,rows)=>card(ctx,k,20,LH-14,400,rows,{up:true});
L.anthropology={
  goals:{
    bio:['How the pelvis shows whether a skeleton is male or female','How growth plates and wear give an age range','How the femur’s length gives a height range','How a biological profile narrows a list of missing people'],
    honors:['Why facial reconstruction gives many possible faces'],
    ap:['Why every estimate is a range (standard error)']},
  matters:'When remains can’t be identified by sight, the skeleton is the first record of who the person was. A careful profile can return a name to a family; an overconfident one can send the search the wrong way.',
  steps:[
    {key:'remains',title:'A skeleton to identify',run:tour('anthropology','A skeleton to identify'),pause:true,focus:TF('anthropology','A skeleton to identify'),
     see:'Remains 1, found by hikers. The box above the chart builds a profile: sex, age range and height range.',
     why:'A <b>biological profile</b> narrows the list of missing people. Each estimate is a range, because bodies vary.'},
    {key:'sex',title:'Sex from the pelvis',run:tour('anthropology','Sex from the pelvis'),pause:true,focus:TF('anthropology','Sex from the pelvis'),
     see:'The pelvis from the front and the skull from the side. The arch under the pelvis measures 96°.',
     why:'A wide pubic arch and a wide sciatic notch are adaptations for childbirth, so they point to female. The skull adds weaker clues.'},
    {key:'age',title:'Age from growth and wear',run:tour('anthropology','Age from growth and wear'),pause:true,focus:TF('anthropology','Age from growth and wear'),
     see:'Growth plates, the pubic bone’s surface and the skull seams each give an age range. The green bar is where they overlap.',
     why:'Growth plates fuse in a known order until about 25. After that, joint surfaces wear and skull seams close slowly.',
     overlay(sim,ctx,LH,k){card(ctx,k,470,396,290,[[FL(sim,'age'),{w:800}]]);}},
    {key:'stature',title:'Stature from the femur',run:tour('anthropology','Stature from the femur'),pause:true,focus:TF('anthropology','Stature from the femur'),
     see:'The thigh bone (femur) on a measuring board: 45.0 cm. The formula turns that length into a height.',
     why:'Leg bones grow in proportion to height. For women, height ≈ 2.47 × femur + 54.1 cm, give or take about 7 cm.',
     overlay(sim,ctx,LH,k){anLow(ctx,k,LH,[[FL(sim,'stat'),{w:800}],atLeastH()?[FL(sim,'srange')]:'']);}},
    {key:'compare',title:'Compare with the reports',run:tour('anthropology','Compare with the reports'),pause:true,focus:TF('anthropology','Compare with the reports'),
     see:'Each dot is a missing-person report, placed by age and height. The green box is the profile from the bones.',
     why:'Reports outside the box, or of the wrong sex, are excluded. Reports inside it stay as leads.',
     overlay(sim,ctx,LH,k){anCase(ctx,k,LH,[[FL(sim,'rep'),{w:700}]]);}},
    {key:'hook',title:'Your question: which missing woman?',set:{mode:'case',report:3},run:tour('anthropology','Compare with the reports',sim=>BioLab.setValues(sim,{report:3})),pause:true,focus:TF('anthropology','Compare with the reports'),
     see:'MP-3 is 160 cm and 19. Her height fits, but every growth plate is fused, even the collarbone’s.',
     why:'The collarbone fuses after about 23, so MP-3 is excluded. MP-1, 34 and 168 cm, fits and stays a lead until DNA or dental records confirm it.',
     overlay(sim,ctx,LH,k){anCase(ctx,k,LH,[[FL(sim,'rep'),{w:700}]]);}},
    {key:'face',title:'Building a face',run:tour('anthropology','Building a face'),pause:true,focus:TF('anthropology','Building a face'),
     see:'Red pegs on the skull mark the average tissue depth at 17 points, and the face is built over them.',
     why:'Skin and muscle thickness at each point comes from averages. The nose, lips and ears aren’t set by bone, so they are educated guesses.',
     overlay(sim,ctx,LH,k){card(ctx,k,12,40,250,[[FL(sim,'nm'),{w:700}]]);}},
    {key:'build',lvl:'honors',title:'Build changes the face',run:tour('anthropology','Building a face',sim=>BioLab.setValues(sim,{build:'heavy'})),pause:true,focus:TF('anthropology','Build changes the face'),
     see:'The same skull with tissue depths for a heavy build. The cheeks and jaw fill out.',
     why:'The skull can’t show weight, so one skull fits many faces. Reconstructions are released to get tips, not to identify anyone.'}
  ],
  useIt:[
    {do:'Next time you see a growth chart at a doctor’s office, notice that it shows ranges, not one number.',why:'Bodies vary, which is why a skeleton gives an age and height range instead of an exact answer.'},
    {do:'Look at an X-ray of a hand or knee from a teenager and an adult (many are online from medical schools).',why:'You can see the open growth plates in a teen. Their closing is one of the main clues to age.'},
    {do:'When police release a reconstructed face, treat it as a sketch, not a photo.',why:'The nose, lips, ears and weight aren’t set by bone, so the real person may look quite different.'}],
  tryIt:[{title:'height from your leg (10 minutes)',steps:['With a tape measure, measure your thigh from the bony bump at your hip to the outer knee joint, in cm.','Use height ≈ 2.47 × femur + 54.1 (women) or 2.38 × femur + 61.4 (men).','Compare with your real height.'],look:'The estimate usually lands within about 7 cm. Measuring over skin isn’t as exact as a bone on a board, which is why scientists give a range.'}]};

/* ---------- handwriting ---------- */
const hwCase=(ctx,k,LH,rows)=>card(ctx,k,556,44,228,rows);
const hwSide=(ctx,k,LH,rows)=>card(ctx,k,566,LH-12,218,rows,{up:true});
L.handwriting={
  goals:{
    bio:['Why examiners compare a questioned note with exemplars','Why one shared feature is not enough','How slant, letter forms and spacing are compared together','How a low light reveals indented writing'],
    honors:['How line quality gives away a traced or copied signature'],
    ap:['How ESDA reads grooves too shallow for a flashlight']},
  matters:'Handwriting still turns up in threats, wills, forged checks and signatures on contracts. Courts treat it as expert opinion, so knowing how it is done, and its limits, matters if you ever have to sign, check or question a document.',
  steps:[
    {key:'note',title:'The questioned note',run:tour('handwriting','The questioned note'),pause:true,focus:TF('handwriting','The questioned note'),
     see:'The questioned note, left at the scene. Below it is known writing from Suspect A.',
     why:'Examiners compare the note with <b>exemplars</b>: known samples of each suspect’s writing, with the same words when possible.'},
    {key:'slant',title:'Slant',set:{suspect:0},run:tour('handwriting','Slant'),pause:true,focus:TF('handwriting','Slant'),
     see:'Slant is highlighted in red. The note leans right; Suspect A writes upright.',
     why:'Slant is a strong habit. A clear, consistent difference like this points away from Suspect A.',
     overlay(sim,ctx,LH,k){hwCase(ctx,k,LH,[['Note: leans right (12°)',{w:800}],['Suspect A: upright (0°)']]);}},
    {key:'shared',title:'A shared feature is not enough',run:tour('handwriting','A shared feature is not enough'),pause:true,focus:TF('handwriting','A shared feature'),
     see:'Suspect B joins letters with connecting strokes, just like the note.',
     why:'Many people join their letters. One shared feature can’t identify a writer; you need many features that agree.'},
    {key:'forms',title:'Letter forms',set:{suspect:1},run:tour('handwriting','Letter forms'),pause:true,focus:TF('handwriting','Letter forms'),
     see:'The form of the a is circled. The note uses a two-story a; Suspect B writes a one-story a.',
     why:'Letter forms are learned early and are hard to change. This difference points away from Suspect B, even though the joins matched.'},
    {key:'all',title:'All features together',run:tour('handwriting','All features together'),pause:true,focus:TF('handwriting','All features together'),
     see:'Suspect C: the circled i dots match, and so do the slant, spacing and letter forms.',
     why:'No single feature decides it. When every feature you can compare agrees, the writing is <b>consistent with</b> Suspect C.'},
    {key:'indent',title:'Indented writing',run:tour('handwriting','Indented writing'),pause:true,focus:TF('handwriting','Indented writing'),
     see:'The sheet under the torn-off note, lit by a flashlight held 8° above the page. Pressed grooves show the hidden message.',
     why:'A low light makes each groove cast a shadow. Lit from straight above, the grooves cast no shadow and stay invisible.',
     overlay(sim,ctx,LH,k){hwSide(ctx,k,LH,[[FL(sim,'vis',0),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: where do you hold the light?',run:tour('handwriting','Indented writing'),pause:true,
     see:'The graph is drawn from the model: readable strokes for every flashlight angle, from straight down (90°) to skimming the page.',
     why:'Straight down you read 0%; at 30° about 88%; skimming at 6° to 10°, about 97%. Hold the light low, across the page.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:110,x1:740,y0:70,y1:360},xr=[0,90];K.dim(ctx,LH,0.97);
       K.axes(ctx,B,k,{xr,xt:[[0,'0°'],[15,'15°'],[30,'30°'],[45,'45°'],[60,'60°'],[75,'75°'],[90,'90°']],yt:[[0,'0%'],[0.5,'50%'],[1,'100%']],xl:'Flashlight angle above the page',yl:'Strokes you can read'});
       const fn=v=>MAT(sim,'vis',{elev:Math.max(2,v)})/100;K.curve(ctx,B,xr,fn,90,'#1f5fbf');
       const v=90-Math.min(1,tau/5)*82;K.dot(ctx,K.X(B,xr,v),K.Y(B,fn(v)),HI,8);K.tagA(ctx,Math.round(v)+'°: '+Math.round(fn(v)*100)+'% readable',K.X(B,xr,v)+(v>45?-14:14),K.Y(B,fn(v))-26,k,{hi:true,w:700,s:13},v>45?'r':'l');}},
    {key:'quality',lvl:'honors',title:'Line quality',run:tour('handwriting','Line quality'),pause:true,focus:TF('handwriting','Line quality'),
     see:'A parent signature on a school slip, above three known signatures. The circle zooms in on the first letter.',
     why:'Copied signatures are drawn slowly: shaky lines, blunt starts and stops, extra pen lifts. Real signatures flow fast and smooth.',
     overlay(sim,ctx,LH,k){card(ctx,k,24,LH-46,320,[[FL(sim,'lifts',0),{w:800}],H.level==='ap'?[FL(sim,'trem',2)]:''],{up:true});}},
    {key:'esda',lvl:'ap',title:'ESDA reads shallow grooves',set:{mode:'indent',elev:8,sheets:3,esda:true},run:tour('handwriting','Indented writing',sim=>BioLab.setValues(sim,{sheets:3,esda:true})),pause:true,focus:TF('handwriting','Indented writing'),
     see:'The 3rd sheet down, where the grooves are very shallow, read with ESDA instead of a flashlight.',
     why:'<b>ESDA</b> senses the crushed paper fibers with static charge, so it needs no shadows and reads grooves a flashlight would miss.',
     overlay(sim,ctx,LH,k){hwSide(ctx,k,LH,[[FL(sim,'vis',0),{w:800,c:GREEN}],[FL(sim,'depth',1)]]);}}
  ],
  useIt:[
    {do:'Read what a pen pressed into a notepad: shine your phone light across the page from the side.',why:'Low light makes each groove cast a shadow, the same reason examiners read indented writing that way.'},
    {do:'Sign your name at your normal speed, every time.',why:'Fluent, fast strokes are what make a genuine signature hard to copy. A forger has to draw it slowly, which shows.'},
    {do:'Be skeptical when a show says handwriting “proves” who wrote something.',why:'Handwriting comparison is expert opinion. Experts are usually right, but they do make errors, so it works best with other evidence.'}],
  tryIt:[{title:'read the page underneath (10 minutes)',steps:['Write a short message firmly on a sheet of paper on top of a pad.','Tear off the top sheet. Darken the room.','Shine a phone flashlight straight down on the next sheet, then slowly lower it until it skims the page from the side.'],look:'Straight down you see almost nothing. As the light gets low, the grooves throw shadows and the message appears.'}]};

/* ---------- chromatography ---------- */
const crCard=(ctx,k,LH,rows)=>card(ctx,k,526,396,262,rows,{up:true,minH:72});
L.chromatography={
  goals:{
    bio:['How capillary action carries the solvent up the paper','Why black ink splits into colors','How to measure and use Rf','How chromatography links a note to a pen'],
    honors:['Why labs run a second solvent before calling a match'],
    ap:['How TLC compares drug evidence with known standards']},
  matters:'Chromatography separates mixtures everywhere: drug tests, food safety, the purity of medicines. In forensics it can link an ink, a dye or a drug to its source, or rule a source out.',
  steps:[
    {key:'jar',title:'Set up the jar',run:tour('chromatography','Set up the jar'),speed:0.3,focus:TF('chromatography','Set up the jar'),
     see:'Five paper strips hang in water: one from the ransom note, one from each suspect’s pen. Each ink dot sits on a pencil line.',
     why:'The water starts below the dots. Ink sitting in the pool would dissolve away instead of climbing the paper.'},
    {key:'capillary',title:'Capillary action',speed:0.4,focus:TF('chromatography','Capillary action'),
     see:'The water creeps up the paper strips, past the ink dots.',
     why:'<b>Capillary action:</b> water is attracted to the paper’s fibers, so it pulls itself up the tiny gaps between them.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'front',1),{w:800}]]);}},
    {key:'mixture',title:'Black ink is a mixture',run:tour('chromatography','Black ink is a mixture'),speed:1,focus:TF('chromatography','Black ink is a mixture'),
     see:'The black dots split into colored bands as the water climbs.',
     why:'Black ink is a <b>mixture</b> of several dyes. Each dye travels at its own speed, so they separate.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'spots'),{w:700}]]);}},
    {key:'why',title:'Why the dyes separate',speed:1,focus:TF('chromatography','Why the dyes separate'),
     see:'The circle shows the dye molecules: blue spends 82% of its time in the moving water, pink only 40%.',
     why:'Dyes that dissolve well ride along with the solvent; dyes that cling to the paper lag behind. Like dissolves like.'},
    {key:'rf',title:'Measure Rf',run:tour('chromatography','Measure Rf'),speed:1,focus:TF('chromatography','Measure Rf'),
     see:'The run is over. The ruler measures how far a spot moved and how far the water moved.',
     why:'<b>Rf</b> = spot distance ÷ solvent distance. It doesn’t depend on how long the run lasted, so strips can be compared.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[atLeastH()?[FL(sim,'rfsel',2),{w:800}]:[FL(sim,'spots'),{w:700}]]);}},
    {key:'match',title:'Match the note',speed:1,focus:TF('chromatography','Match the note'),
     see:'Compare the note’s spots with each pen’s spots: the same colors at the same heights?',
     why:'A pen whose spots and Rf values all match the note is consistent with it. One spot that doesn’t match rules a pen out.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'match'),{w:800,c:GREEN}]]);}},
    {key:'hook',title:'Your question: the permanent marker',set:{strip:'D'},run:tour('chromatography','Measure Rf'),speed:1,focus:TF('chromatography','Set up the jar'),
     see:'Pen D is a permanent marker. In water, two of its dyes stay on the start line; one creeps up a little.',
     why:'Its dyes barely dissolve in water. Pen A, a washable marker, splits into food dyes that climb to Rf 0.58 to 0.93.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[['Pen D in water',{w:800}],[FL(sim,'spots')]]);}},
    {key:'hook2',title:'Your question: now try rubbing alcohol',set:{strip:'D',solvent:'ipa'},run:tour('chromatography','Measure Rf'),speed:1,focus:TF('chromatography','Set up the jar'),
     see:'The same pens in isopropanol, rubbing alcohol. Pen D’s dyes now climb high up the strip.',
     why:'These dyes dissolve in alcohol but not in water: like dissolves like. That is why rubbing alcohol lifts permanent marker.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[['Pen D in isopropanol',{w:800,c:GREEN}],[FL(sim,'spots')]]);}},
    {key:'second',lvl:'honors',title:'A second solvent',run:tour('chromatography','A second solvent'),speed:1,focus:TF('chromatography','A second solvent'),
     see:'Case 2: in water, two pens looked alike. Here the strips are run again in isopropanol.',
     why:'A second solvent separates the dyes differently, so pens that matched in one can split apart in the other. Labs run both.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'match'),{w:800}]]);}},
    {key:'tlc',lvl:'ap',title:'TLC of drug evidence',run:tour('chromatography','TLC of drug evidence'),speed:1,focus:TF('chromatography','TLC of drug evidence'),
     see:'Thin-layer chromatography under a UV lamp: known drug standards beside evidence samples A and B.',
     why:'A spot at the same Rf as a standard suggests that substance. Like a spot test, it is presumptive until a spectrum confirms it.',
     overlay(sim,ctx,LH,k){crCard(ctx,k,LH,[[FL(sim,'tmatch'),{w:800}]]);}}
  ],
  useIt:[
    {do:'Remove permanent marker from a whiteboard or counter with rubbing alcohol, not water.',why:'Permanent-marker dyes dissolve in alcohol but not in water: like dissolves like, the same reason they climb in isopropanol.'},
    {do:'Rinse a fresh washable-marker stain with cold water before it dries.',why:'Washable inks use water-soluble dyes, so water carries them away, just as it carried them up the paper.'},
    {do:'When you read that a food or drug was “tested for purity,” picture the strip.',why:'Labs use chromatography to separate a sample into its parts and check each against known standards.'}],
  tryIt:[{title:'coffee-filter chromatography (20 minutes)',steps:['Cut strips from a coffee filter. Draw a pencil line 2 cm from the bottom and put a dot of black washable marker on it.','Stand the strip in a glass with 1 cm of water, keeping the dot above the water.','When the water is near the top, mark the front, let it dry, and measure each color’s Rf.'],look:'The black dot splits into colors such as blue, yellow and red. Try a permanent marker too: it barely moves in water.'}]};

/* ---------- hairfiber ---------- */
const hfCard=(ctx,k,LH,rows)=>card(ctx,k,440,LH-14,346,rows,{up:true});
const hfFiber=sim=>BioLab.setValues(sim,{item:'fiber'});
L.hairfiber={
  goals:{
    bio:['The three layers of a hair, and what the medulla shows','How to tell an animal hair from a human hair','How natural and synthetic fibers look, and how they burn','Why hair and fibers are usually class evidence'],
    honors:['The medullary index, and when a hair can give DNA'],
    ap:['How polarized light measures a fiber’s birefringence']},
  matters:'Hairs and fibers transfer at almost every contact, so they are among the most common trace evidence. They can link a person to a place, or rule someone out, but they rarely point to one person, and overstating them has led to wrongful convictions.',
  steps:[
    {key:'hair',title:'A hair under the microscope',run:tour('hairfiber','A hair under the microscope'),pause:true,focus:TF('hairfiber','A hair under the microscope'),
     see:'A human head hair at 400×, lit from below. The dark streaks down the middle are the medulla.',
     why:'A hair has three layers: cuticle (scales), cortex (color) and <b>medulla</b> (core). In human hair the medulla is thin or broken.',
     overlay(sim,ctx,LH,k){hfCard(ctx,k,LH,[[FL(sim,'medulla'),{w:800}],atLeastH()?[FL(sim,'mi',2)]:'']);}},
    {key:'scales',title:'Scales on the surface',set:{mode:'hair'},run:tour('hairfiber','A hair under the microscope',sim=>BioLab.setValues(sim,{hview:'scales'})),pause:true,focus:TF('hairfiber','Scales on the surface'),
     see:'A cast of the hair’s surface shows flat, overlapping scales.',
     why:'Scale patterns differ between species. Human scales are flat and overlap like roof shingles.',
     overlay(sim,ctx,LH,k){hfCard(ctx,k,LH,[[FL(sim,'scales'),{w:800}]]);}},
    {key:'animal',title:'An animal hair',set:{mode:'hair'},run:tour('hairfiber','An animal hair'),pause:true,focus:TF('hairfiber','An animal hair'),
     see:'A dog hair: the dark medulla fills most of the width.',
     why:'Animal hairs have a wide medulla, more than a third of the hair’s width. That alone tells a pet’s hair from a person’s.',
     overlay(sim,ctx,LH,k){hfCard(ctx,k,LH,[[FL(sim,'medulla'),{w:800}],[FL(sim,'mi',2)]]);}},
    {key:'fiber',title:'Fibers: natural or made',run:tour('hairfiber','Fibers: natural or made'),pause:true,focus:TF('hairfiber','Fibers: natural or made'),
     see:'Cotton fibers at about 1000×: flat, twisted ribbons.',
     why:'Natural fibers keep shapes from plants or animals: cotton twists and wool has scales. Synthetic fibers are smooth, even rods.',
     overlay(sim,ctx,LH,k){hfCard(ctx,k,LH,[[FL(sim,'fclass'),{w:800}]]);}},
    {key:'burn',title:'The burn test',set:{mode:'fiber',fiber:'nylon'},run:tour('hairfiber','Fibers: natural or made',sim=>{const t=TSTEP('hairfiber','The burn test');if(t&&t.setup)t.setup(sim);}),speed:1,focus:TF('hairfiber','The burn test'),
     see:'A known nylon fiber is held near the flame, in it, then out.',
     why:'Synthetics melt, shrink from the flame and leave a hard bead. Cotton burns like paper and leaves soft gray ash.',
     overlay(sim,ctx,LH,k){hfCard(ctx,k,LH,[[FL(sim,'burnres'),{w:700}]]);}},
    {key:'compare',title:'Compare with suspects',run:tour('hairfiber','Compare with suspects'),pause:true,focus:TF('hairfiber','Compare with suspects'),
     see:'The comparison microscope: the scene hair on the left, Suspect A’s pet cat hair on the right.',
     why:'Side by side, the medullas look different. One clear difference is enough to exclude a sample.'},
    {key:'call',title:'Make your call',run:tour('hairfiber','Make your call'),pause:true,focus:TF('hairfiber','Make your call'),
     see:'Suspect B’s dog hair beside the scene hair. The medulla and scales agree.',
     why:'Agreeing features make it <b>consistent with</b> the dog, not proof. Hair is class evidence unless a root gives DNA.'},
    {key:'hook',title:'Your question: the red fiber',set:{mode:'case',cs:'c1',item:'fiber',suspect:0},run:tour('hairfiber','Compare with suspects',hfFiber),pause:true,focus:TF('hairfiber','Compare with suspects'),
     see:'The red fiber from the window beside Suspect A’s wool sweater. The color matches, but the shapes don’t.',
     why:'The scene fiber is a smooth acrylic rod; wool is scaly and crimped. That one clear difference excludes the sweater.'},
    {key:'hook2',title:'Your question: the fleece',set:{mode:'case',cs:'c1',item:'fiber',suspect:1},run:tour('hairfiber','Compare with suspects',sim=>BioLab.setValues(sim,{item:'fiber',suspect:1})),pause:true,focus:TF('hairfiber','Compare with suspects'),
     see:'Suspect B’s red acrylic fleece beside the scene fiber: same type, same color.',
     why:'It is consistent, but it is not proof. Any other fleece made of the same fiber and dye would match too.'},
    {key:'polar',lvl:'ap',title:'Polarized light',run:tour('hairfiber','Polarized light'),pause:true,focus:TF('hairfiber','Polarized light'),
     see:'A polyester fiber between crossed polarizers glows bright on a black background.',
     why:'Stretched synthetic fibers bend light differently along and across their length. That <b>birefringence</b> identifies the polymer.',
     overlay(sim,ctx,LH,k){hfCard(ctx,k,LH,[[FL(sim,'bire',3),{w:800}],[FL(sim,'ret',0)]]);}}
  ],
  useIt:[
    {do:'Check the fiber content tag on your clothes, then look at a loose thread under a magnifier or phone camera zoom.',why:'Cotton looks like a twisted ribbon and synthetics look like smooth rods, the same differences examiners use.'},
    {do:'Use a lint roller before an interview or a nice event.',why:'Fibers and pet hairs transfer at almost every contact. That is why they show up at crime scenes too.'},
    {do:'When a story says a hair “matched” a suspect, ask whether it was DNA or a microscope comparison.',why:'Under a microscope, hair is class evidence: many people share the same features. Overstated hair matches have led to wrongful convictions.'}],
  tryIt:[{title:'phone-microscope hair and thread (10 minutes)',steps:['Tape one of your hairs, a pet hair (if you have one) and threads from a cotton shirt and a fleece onto white paper.','Zoom in with your phone camera as far as it goes, with a flashlight shining from behind the paper.','Sketch what you see for each one.'],look:'The pet hair often shows a dark core down the middle. The cotton thread looks twisted and the fleece fiber looks smooth and even.'}]};

/* ---------- spectroscopy ---------- */
const spCard=(ctx,k,LH,rows)=>card(ctx,k,12,LH-6,360,rows,{up:true});
L.spectroscopy={
  goals:{
    bio:['What an infrared spectrum shows','How the O–H and C=O bands tell an alcohol from acetone','What the fingerprint region is','How a spectrum confirms what a spot test only suggests'],
    honors:['How a mass spectrum gives the molecular ion and base peak'],
    ap:['Why isotopes make small M+1 peaks']},
  matters:'Spot tests and chromatography only suggest an identity. A spectrum matched to a reference is how a lab confirms what a substance is, in drug cases, fire investigations and even airport security.',
  steps:[
    {key:'ir',title:'An infrared spectrum',run:tour('spectroscopy','An infrared spectrum'),speed:1,focus:TF('spectroscopy','An infrared spectrum'),
     see:'Infrared light is scanned across ethanol. Each dip in the red line is light the molecule absorbed.',
     why:'An <b>IR spectrum</b> shows which bonds a molecule has. Each kind of bond absorbs its own frequencies, read in wavenumbers (cm⁻¹).'},
    {key:'oh',title:'Bonds absorb their own frequency',run:tour('spectroscopy','Bonds absorb their own frequency'),speed:1,focus:TF('spectroscopy','Bonds absorb'),
     see:'The O–H bond in ethanol is marked: a broad, deep dip near 3340 cm⁻¹.',
     why:'Bonds vibrate like springs and absorb light at their own frequency. Hydrogen bonds between O–H groups make this band broad.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'selpk'),{w:800}]]);}},
    {key:'co',title:'C=O: a strong, sharp clue',run:tour('spectroscopy','C=O: a strong'),speed:1,focus:TF('spectroscopy','C=O: a strong'),
     see:'Acetone has no broad O–H dip, but a very strong, sharp dip at 1715 cm⁻¹.',
     why:'That is the C=O double bond. A stiffer bond vibrates faster, so it absorbs at a higher frequency than a single C–O bond.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'selpk'),{w:800}]]);}},
    {key:'ch',title:'C–H and the fingerprint region',run:tour('spectroscopy','C–H and the fingerprint'),speed:1,focus:TF('spectroscopy','C–H and the fingerprint'),
     see:'Hexane has only C–H and C–C bonds: dips near 2960 cm⁻¹ and a few below 1500.',
     why:'Nearly every organic molecule has C–H near 3000. Below 1500 cm⁻¹ is the <b>fingerprint region</b>, a pattern unique to each molecule.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'groups'),{w:700}]]);}},
    {key:'hook',title:'Your question: rubbing alcohol or acetone?',set:{view:'ir',sample:'isopropanol',ref:'acetone'},run:sim=>{sim.st.scan=1;},speed:1,focus:TF('spectroscopy','Match the evidence'),
     see:'Isopropanol (rubbing alcohol) in red, with acetone’s library spectrum laid over it. Look near 3350 and 1715 cm⁻¹.',
     why:'Isopropanol has a broad O–H dip near 3350 and nothing strong at 1715. Acetone is the reverse. Those two regions settle it.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'groups'),{w:700}]]);}},
    {key:'match',title:'Match the evidence',run:tour('spectroscopy','Match the evidence'),speed:1,focus:TF('spectroscopy','Match the evidence'),
     see:'The evidence sample: a broad O–H dip and C–H dips, but no C=O.',
     why:'The bands say “alcohol.” Matching the whole spectrum, fingerprint region included, against a library confirms which one.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'groups'),{w:700}],H.level==='ap'?[FL(sim,'best'),{w:800}]:'']);}},
    {key:'ms',lvl:'honors',title:'Mass spectrometry',run:tour('spectroscopy','Mass spectrometry'),speed:1,focus:TF('spectroscopy','Mass spectrometry'),
     see:'A mass spectrum of ethanol: each bar is a charged fragment, placed by its mass.',
     why:'Molecules are broken into charged pieces and sorted by mass-to-charge ratio (<b>m/z</b>). The pattern of pieces is another fingerprint.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'mion',0),{w:800}],[FL(sim,'base',0)]]);}},
    {key:'ion',lvl:'honors',title:'Molecular ion and base peak',set:{view:'ms',sample:'ethanol'},run:tour('spectroscopy','Molecular ion and base peak'),speed:1,focus:TF('spectroscopy','Molecular ion'),
     see:'The bar at m/z 46 is the whole molecule minus one electron. The tallest bar, at 31, is highlighted.',
     why:'The <b>molecular ion</b> gives the molar mass: 46 g/mol. The <b>base peak</b> is the most common fragment, here CH₂OH⁺.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'mion',0)],[FL(sim,'base',0),{w:800}]]);}},
    {key:'iso',lvl:'ap',title:'Isotope peaks',run:tour('spectroscopy','Isotope peaks'),speed:1,focus:TF('spectroscopy','Isotope peaks'),
     see:'Caffeine’s molecular ion at m/z 194, with a small peak next to it at 195.',
     why:'About 1.1% of carbon atoms are carbon-13, one unit heavier. The more carbons a molecule has, the taller its M+1 peak.',
     overlay(sim,ctx,LH,k){spCard(ctx,k,LH,[[FL(sim,'mion',0),{w:800}]]);}}
  ],
  useIt:[
    {do:'Read the active ingredient on a cleaning product before mixing it with anything.',why:'Labs identify substances by their bonds. Products that look alike, like rubbing alcohol and acetone, behave very differently.'},
    {do:'Notice the body scanners and swab tests at airports.',why:'Many work on the same idea: each substance absorbs or breaks apart in its own pattern, which a machine matches to a library.'},
    {do:'When a news story says a lab “confirmed” a drug, picture a spectrum matched to a reference.',why:'Color tests only suggest. A spectrum that matches a known reference is what confirms an identity.'}],
  tryIt:[{title:'bonds as springs (5 minutes)',steps:['Hang a small weight (like keys) from a rubber band and bounce it.','Double the rubber band to make it stiffer and bounce it again.','Count bounces in 10 seconds each time.'],look:'The stiffer “bond” bounces faster. Stiffer bonds, like C=O, vibrate faster and absorb higher-frequency infrared light.'}]};

/* ---------- extra why questions (appended to review.js entries) ---------- */
addQs('fingerprints',[
  {id:'ln-porous',kind:'test',lvl:'bio',q:'Why does fingerprint powder give only a smudge on paper?',choices:['The residue soaks into the fibers, so powder sticks everywhere','Paper is too smooth and slick for the powder grains to grip','The powder reacts with the paper itself and turns it all gray','Paper holds no sweat or oil, so there is nothing to stick to'],correct:0,
   steps:['Paper is porous.','The sweat and oil soak into the fibers instead of sitting on top.','Powder then sticks to the fibers everywhere, not just the ridges.']},
  {id:'ln-iodfade',kind:'test',lvl:'bio',q:'Why does an iodine-fumed print fade after a while?',choices:['The iodine only dissolved in the oils and escapes again','The iodine reacts with the amino acids and burns them up','Light breaks the print’s ridges apart','The paper absorbs the brown color over time'],correct:0,
   steps:['Iodine fuming is a physical change.','The violet vapor dissolves into the oils on the ridges.','Out of the cabinet, the iodine evaporates and the print fades.']},
  {id:'ln-method',kind:'real',lvl:'bio',q:'Which surface is best developed with super glue fuming?',choices:['A plastic sandwich bag','A paper receipt','A cotton T-shirt','A cardboard box'],correct:0,
   steps:['Super glue fuming works on nonporous surfaces.','The vapor builds a hard polymer along the ridges.','Plastic bags, cans and guns are classic uses.']},
  {id:'ln-minutiae',kind:'test',lvl:'bio',q:'What are minutiae in a fingerprint?',choices:['Places where ridges end or split','The overall pattern, like a loop or whorl','The sweat pores between the ridges','Smudges left when a print is dragged'],correct:0,
   steps:['Minutiae are ridge details.','Ridge endings and bifurcations (splits) are the most common.','Matching minutiae, not just the pattern, points to one person.']},
  {id:'ln-oldletter',kind:'test',lvl:'honors',q:'Why can ninhydrin find prints on paper that is years old?',choices:['Amino acids stay locked in the paper fibers for years','The oils in a print get stronger and darker with age','Ninhydrin reacts with the paper itself, not the print','Old paper is less porous, so the prints sit on top of it'],correct:0,
   steps:['Ninhydrin reacts with amino acids from sweat.','In paper, amino acids soak in and stay put.','So the reaction still works on old documents.']},
  {id:'ln-classind',kind:'test',lvl:'honors',q:'About two in three people have loop patterns. What kind of characteristic is a loop?',choices:['A class characteristic','An individual characteristic','A minutia','Proof of identity'],correct:0,
   steps:['Class characteristics are shared by groups of people.','A loop is shared by most people.','Individual characteristics, the minutiae, point to one person.']},
  {id:'ln-thalf',kind:'test',lvl:'ap',q:'A print develops with rate constant k = 0.35 min⁻¹. What is its half-time, ln 2 ÷ k, in minutes?',num:{ans:1.98,tol:0.1,unit:'min'},
   steps:['Half-time = ln 2 ÷ k.','ln 2 ≈ 0.693.','0.693 ÷ 0.35 ≈ 2.0 min.']}
]);
addQs('spottest',[
  {id:'ln-starch',kind:'test',lvl:'bio',q:'Why does iodine turn cornstarch blue-black?',choices:['Iodine slips inside the coiled starch molecule','Iodine dissolves the starch and stains the water','Starch is an acid and changes iodine’s color','Iodine reacts with the carbonate in cornstarch'],correct:0,
   steps:['Starch molecules coil into helixes.','Iodine fits inside the coil.','The starch–iodine pair absorbs light differently and looks blue-black.']},
  {id:'ln-flame',kind:'test',lvl:'bio',q:'Table salt glows yellow-orange in a flame. What makes the color?',choices:['Electrons in sodium ions falling back to lower energy','The salt melting into a glowing liquid on the wire loop','Chloride gas from the salt burning brightly in the flame','Soot from carbon atoms in the salt glowing in the heat'],correct:0,
   steps:['Heat lifts electrons to higher energy levels.','When they fall back, they give off light.','Sodium’s light is yellow-orange, near 589 nm.']},
  {id:'ln-sugarsalt',kind:'test',lvl:'bio',q:'Sugar and salt both dissolve and test neutral. Which test tells them apart?',choices:['The flame test','The iodine test','Vinegar','pH paper'],correct:0,
   steps:['Both dissolve and neither has starch or carbonate.','In a flame, salt glows yellow-orange from sodium.','Sugar melts and chars black.']},
  {id:'ln-safety',kind:'real',lvl:'bio',q:'Why should you never taste or sniff an unknown powder?',choices:['Many dangerous powders look like harmless ones','Tasting a powder ruins the sample for later tests','Powders lose their color as soon as they get wet','Smelling a powder changes its pH and its result'],correct:0,
   steps:['White powders look alike.','Some are toxic in tiny amounts.','Tests let you identify a powder without exposure.']},
  {id:'ln-presump',kind:'test',lvl:'bio',q:'A powder fizzes with vinegar. What can you conclude for sure?',choices:['It probably contains a carbonate; more tests are needed','It is definitely baking soda and could be nothing else','It is an acid, like aspirin, reacting with the vinegar','It contains starch, which gives off gas when it gets wet'],correct:0,
   steps:['Fizzing means carbon dioxide formed.','Any carbonate or bicarbonate does that.','A presumptive test narrows the list; it doesn’t prove identity.']},
  {id:'ln-benedict',kind:'test',lvl:'honors',q:'Why does glucose turn Benedict’s solution brick red but table sugar doesn’t?',choices:['Glucose is a reducing sugar; in sucrose that group is tied up','Sucrose doesn’t dissolve in Benedict’s solution, so it can’t react','Glucose is an acid and sucrose is a base, so only one reacts','Sucrose needs iodine added first before Benedict’s can work'],correct:0,
   steps:['Benedict’s detects reducing sugars.','Glucose has a free reactive group that reduces Cu²⁺ to red Cu₂O.','In sucrose that group is tied up in the link between its two sugars.']},
  {id:'ln-co2',kind:'test',lvl:'ap',q:'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂. How many moles of CO₂ come from 0.010 mol of baking soda with excess vinegar?',num:{ans:0.010,tol:0.0005,unit:'mol'},
   steps:['The ratio of NaHCO₃ to CO₂ is 1 : 1.','Vinegar is in excess, so all the baking soda reacts.','0.010 mol NaHCO₃ makes 0.010 mol CO₂.']}
]);
addQs('timeofdeath',[
  {id:'ln-curve',kind:'test',lvl:'bio',q:'Why does a body cool fastest in the first hours after death?',choices:['The temperature gap with the air is largest then','The heart keeps pumping warm blood out for a while','Rigor mortis squeezes heat out of the muscles','Insects on the body lower its temperature quickly'],correct:0,
   steps:['Heat flows faster across a bigger temperature difference.','Right after death the gap between body and air is largest.','As the gap shrinks, cooling slows.']},
  {id:'ln-glaister',kind:'test',lvl:'bio',q:'Why is Glaister’s rule (1.5 °F per hour) only a rough estimate?',choices:['Real cooling slows down over time instead of staying steady','It only works for bodies found indoors in a heated room','It uses Celsius, so the numbers come out much too small','It ignores the insects, which are always the more exact clue'],correct:0,
   steps:['The rule assumes the same drop every hour.','Real cooling follows a curve that levels off.','So the rule drifts further off after the first half day.']},
  {id:'ln-minimum',kind:'test',lvl:'bio',q:'Why does the oldest insect stage give a minimum time since death?',choices:['Flies may have arrived some time after death','Insects grow faster after the body is moved','The youngest stage is always the most accurate','Insects only lay eggs at night'],correct:0,
   steps:['The insect clock starts when eggs are laid.','Flies usually arrive within hours, but sometimes later.','So death happened at least that long ago, maybe longer.']},
  {id:'ln-adh',kind:'test',lvl:'honors',q:'Each hour adds (air temperature − 10 °C) degree hours. How many degree hours build up in 24 hours at 25 °C?',num:{ans:360,tol:5,unit:'°C·h'},
   steps:['Each hour adds 25 − 10 = 15 degree hours.','24 hours × 15 = 360.','That is 360 °C·h.']},
  {id:'ln-cold',kind:'test',lvl:'bio',q:'The same insect stage is found at 15 °C instead of 25 °C. What does that mean for the estimate?',choices:['More time has passed, since insects grew slower','Less time has passed, since cold speeds insects up','The same time has passed; temperature doesn’t matter','The insect clock can’t be used below 20 °C'],correct:0,
   steps:['Insects are cold-blooded.','At 15 °C each hour adds 5 degree hours, versus 15 at 25 °C.','Reaching the same stage takes about three times longer.']},
  {id:'ln-combine',kind:'test',lvl:'bio',q:'Cooling says 20–30 h, rigor says 24–36 h and insects say at least 22 h. What is the best estimate?',choices:['24–30 h, where all three overlap','20–36 h, the full span of all clues','22 h, from the insects alone','30–36 h, the latest times given'],correct:0,
   steps:['The true time must fit every clue.','Overlap of 20–30, 24–36 and 22+ is 24–30 h.','The overlap is the best estimate.']},
  {id:'ln-plateau',kind:'test',lvl:'ap',q:'Why does a body’s core temperature stay nearly flat for the first few hours?',choices:['Heat must first flow from the core out to the skin','The body keeps making its own heat for several hours','Clothing blocks all heat loss for the first few hours','The air around the body warms up to body temperature'],correct:0,
   steps:['The thermometer reads the core.','Heat leaves from the skin first.','Until the skin cools and a gradient forms, the core barely changes.']}
]);
addQs('anthropology',[
  {id:'ln-pelvis',kind:'test',lvl:'bio',q:'Why does the pelvis show whether a skeleton is female or male?',choices:['A female pelvis is wider, adapted for childbirth','Female pelvis bones are always shorter','A male pelvis has more bones','The pelvis grows only in males after puberty'],correct:0,
   steps:['The female pelvis is shaped for childbirth.','Its pubic arch and sciatic notch are wider.','The skull gives weaker clues.']},
  {id:'ln-plates',kind:'test',lvl:'bio',q:'Every growth plate in a skeleton is fused, including the collarbone’s. What does that suggest?',choices:['The person was older than about 23','The person was a teenager','The person was very tall','The person was female'],correct:0,
   steps:['Growth plates fuse in a set order.','The collarbone’s inner end fuses last, in the mid-20s.','So all plates fused means an adult past about 23.']},
  {id:'ln-stature',kind:'test',lvl:'bio',q:'For women, height ≈ 2.47 × femur length + 54.1 cm. Estimate the height for a 42.0 cm femur.',num:{ans:157.8,tol:1,unit:'cm'},
   steps:['2.47 × 42.0 = 103.7.','103.7 + 54.1 = 157.8.','About 158 cm, give or take about 7 cm.']},
  {id:'ln-range',kind:'test',lvl:'bio',q:'Why does a skeleton give a height range instead of one exact height?',choices:['People with the same femur length vary in height','The femur shrinks a little in the years after death','Measuring boards are never accurate to the centimeter','Height depends on the skull and spine, not the legs'],correct:0,
   steps:['Formulas come from many measured people.','People with the same femur length differ in height.','About 95% fall within roughly ±7 cm.']},
  {id:'ln-exclude',kind:'test',lvl:'bio',q:'A missing person is the right height and sex, but much younger than the age range. What do you do?',choices:['Exclude that report','Call it a match, since two of three fit','Ignore the age and keep it as the top lead','Change the age estimate to fit the report'],correct:0,
   steps:['A profile must fit every estimate.','An age clearly outside the range rules a report out.','Reports that fit everything stay as leads.']},
  {id:'ln-confirm',kind:'real',lvl:'honors',q:'A report fits the profile in sex, age and height. What confirms the identity?',choices:['DNA or dental records','A facial reconstruction','A second height estimate','A closer look at the pelvis'],correct:0,
   steps:['A profile only narrows the list.','Many people share the same sex, age and height range.','DNA or dental records can identify one person.']},
  {id:'ln-face',kind:'test',lvl:'honors',q:'Why can one skull give several different faces?',choices:['Tissue depth and soft features aren’t set by bone','The skull slowly changes shape in the years after death','Each artist picks the eye color and hair, so faces differ','Skulls are too fragile to measure the same way twice'],correct:0,
   steps:['Tissue depths come from averages for each build.','The nose, lips, ears and weight aren’t set by bone.','So reconstructions are used for tips, not identification.']}
]);
addQs('handwriting',[
  {id:'ln-oneft',kind:'test',lvl:'bio',q:'A suspect slants their writing to the right, like the note. What does that show?',choices:['Very little: many people slant right','That the suspect wrote the note','That the note is a forgery','That the suspect is left-handed'],correct:0,
   steps:['Slant is shared by many writers.','One shared feature is class-level evidence.','Many features must agree before writing is called consistent.']},
  {id:'ln-forms',kind:'test',lvl:'bio',q:'The note has a two-story a, and a suspect always writes a one-story a. What does that suggest?',choices:['It points away from that suspect','It proves the suspect disguised their writing','It doesn’t matter, since letters vary','It means the note was traced'],correct:0,
   steps:['Letter forms are learned early.','They are hard to change consistently.','A clear, consistent difference points away from that writer.']},
  {id:'ln-light',kind:'test',lvl:'bio',q:'Why does a low, skimming flashlight reveal indented writing?',choices:['Each groove casts a shadow when lit from the side','The light warms the paper and darkens the grooves','Low light is brighter than light from above','The grooves reflect the light like mirrors'],correct:0,
   steps:['Indented writing is grooves, not ink.','Light from straight above casts no shadows in grooves.','Low light makes every groove throw a shadow.']},
  {id:'ln-consist',kind:'test',lvl:'bio',q:'Every feature you can compare agrees between the note and Suspect C. How should it be reported?',choices:['Consistent with Suspect C','Proven beyond doubt to be Suspect C','Not useful without a confession','Forged by Suspect C'],correct:0,
   steps:['Handwriting comparison is expert opinion.','Agreement across many features is strong support.','Examiners report it as consistent, not as certain proof.']},
  {id:'ln-traced',kind:'test',lvl:'honors',q:'Which sign suggests a signature was traced?',choices:['Shaky lines with blunt starts and stops','Fast, smooth, tapered strokes','A slightly different size than usual','Letters that lean a little to the right'],correct:0,
   steps:['A tracer draws slowly to follow the shape.','Slow drawing gives tremor and blunt ends.','Real signatures are written fast and flow.']},
  {id:'ln-shadow',kind:'test',lvl:'ap',q:'A groove 12 µm deep is lit 30° above the page. Shadow width = depth ÷ tan θ. About how wide is the shadow?',num:{ans:20.8,tol:0.6,unit:'µm'},
   steps:['tan 30° ≈ 0.577.','12 ÷ 0.577 ≈ 20.8.','About 21 µm.']},
  {id:'ln-esda',kind:'test',lvl:'ap',q:'Why can ESDA read grooves too shallow for a flashlight?',choices:['It senses crushed fibers with static charge, not shadows','It uses a much brighter light held straight above the page','It dissolves the top layer of paper to expose the grooves','It heats the page so the shallow grooves grow deeper'],correct:0,
   steps:['Oblique light needs grooves deep enough to cast shadows.','ESDA detects the disturbed fibers with static charge.','So it can reveal faint writing several sheets down.']}
]);
addQs('chromatography',[
  {id:'ln-cap',kind:'test',lvl:'bio',q:'What pulls the water up the paper strip?',choices:['Capillary action between the paper fibers','Gravity pulling from the top of the strip','Evaporation pushing from below','The ink dragging the water upward'],correct:0,
   steps:['Water is attracted to the paper’s fibers.','It pulls itself into the tiny gaps between them.','That is capillary action.']},
  {id:'ln-fast',kind:'test',lvl:'bio',q:'On the same strip, a blue dye travels higher than a pink dye. Why?',choices:['Blue dissolves better in the solvent and clings less to paper','Blue molecules are heavier, so they push farther up the strip','Pink dye is pulled back down the wet strip by gravity','Blue dye was dotted on the strip first, so it had a head start'],correct:0,
   steps:['Dyes split their time between solvent and paper.','The one that stays in the moving solvent more travels farther.','Blue spends more time in the solvent here.']},
  {id:'ln-rfcalc',kind:'test',lvl:'bio',q:'The solvent front is 8.0 cm above the start line, and a spot is at 2.4 cm. What is its Rf?',num:{ans:0.30,tol:0.01,unit:''},
   steps:['Rf = spot distance ÷ solvent distance.','2.4 ÷ 8.0 = 0.30.','Rf has no unit.']},
  {id:'ln-perm',kind:'test',lvl:'bio',q:'A permanent marker barely moves in water but runs in rubbing alcohol. Why?',choices:['Its dyes dissolve in alcohol but not in water','Alcohol climbs the paper faster than water','Water reacts with the dyes and locks them','The paper soaks up alcohol but not water'],correct:0,
   steps:['Like dissolves like.','Permanent-marker dyes don’t dissolve in water.','They do dissolve in isopropanol, so they travel with it.']},
  {id:'ln-oneoff',kind:'test',lvl:'bio',q:'A pen matches the note in two spots but has a third spot the note lacks. What do you conclude?',choices:['That pen is ruled out','That pen wrote the note','The test must be repeated in pen ink','The extra spot doesn’t matter'],correct:0,
   steps:['A match needs every spot to agree.','A spot the note doesn’t have means a different ink.','So that pen is excluded.']},
  {id:'ln-second',kind:'test',lvl:'honors',q:'Two pens give the same spots in water. What should an examiner do next?',choices:['Run both again in a different solvent','Call it a match for both pens','Use a longer paper strip','Repeat the run in water'],correct:0,
   steps:['Different dyes can travel alike in one solvent.','A second solvent separates them differently.','Pens that still match in both are more strongly linked.']},
  {id:'ln-tlc',kind:'test',lvl:'ap',q:'An evidence spot lines up with a caffeine standard on a TLC plate. What does that show?',choices:['It may be caffeine; a spectrum should confirm it','It is definitely caffeine, since the spots line up','It is a mixture of caffeine and aspirin together','It cannot contain caffeine, since TLC never matches'],correct:0,
   steps:['Matching Rf values suggest the same substance.','Different substances can share an Rf.','Confirmation needs a method like a spectrum.']}
]);
addQs('hairfiber',[
  {id:'ln-layers',kind:'test',lvl:'bio',q:'What is the medulla of a hair?',choices:['The core running down its middle','The scaly outer layer','The colored middle layer','The root at the base'],correct:0,
   steps:['A hair has three layers.','Cuticle outside, cortex in the middle, medulla at the core.','The medulla’s width helps tell species apart.']},
  {id:'ln-mi',kind:'test',lvl:'honors',q:'A hair’s medulla is 25 µm wide and the shaft is 75 µm wide. What is the medullary index?',num:{ans:0.33,tol:0.01,unit:''},
   steps:['Medullary index = medulla width ÷ shaft width.','25 ÷ 75 ≈ 0.33.','About 1/3: right at the line between human and animal.']},
  {id:'ln-synth',kind:'test',lvl:'bio',q:'Under the microscope, a fiber is a smooth, even rod with no twists or scales. What is it likely to be?',choices:['A synthetic fiber','Cotton','Wool','A human hair'],correct:0,
   steps:['Cotton twists and wool has scales.','Synthetic fibers are made by pushing plastic through holes.','So they come out as smooth, even rods.']},
  {id:'ln-cotton',kind:'test',lvl:'bio',q:'In a burn test, a fiber burns like paper and leaves soft gray ash. What is it likely to be?',choices:['Cotton','Nylon','Polyester','Acrylic'],correct:0,
   steps:['Cotton is cellulose, like paper.','It burns steadily and leaves soft ash.','Synthetics melt into hard beads instead.']},
  {id:'ln-exclude',kind:'test',lvl:'bio',q:'A red fiber matches a suspect’s sweater in color, but it is smooth and the sweater is scaly wool. What do you conclude?',choices:['The sweater is excluded','The sweater is the source','It is consistent with the sweater','The test is useless'],correct:0,
   steps:['Color alone is a weak link.','Fiber type clearly differs: smooth vs scaly.','One clear difference rules the source out.']},
  {id:'ln-class',kind:'test',lvl:'bio',q:'Why is a fiber that matches a suspect’s fleece not proof that it came from that fleece?',choices:['Many other fleeces share the same fiber and dye','Fibers change type after they fall off clothing','Fleece fibers can’t be seen clearly under a microscope','A real match always needs two fibers, not just one'],correct:0,
   steps:['Mass-produced fabrics share fiber type and dye.','That makes fibers class evidence.','A match is consistent, not unique.']},
  {id:'ln-root',kind:'test',lvl:'honors',q:'A shed hair with no root is found. What DNA testing is possible?',choices:['Mitochondrial DNA, which many relatives share','Nuclear DNA that points to one person','None at all','Only a blood type'],correct:0,
   steps:['Nuclear DNA is in the root cells.','A shed hair usually has no living root.','Its shaft still holds mitochondrial DNA, shared along the mother’s line.']}
]);
addQs('spectroscopy',[
  {id:'ln-dip',kind:'test',lvl:'bio',q:'What does a dip in an infrared spectrum mean?',choices:['The molecule absorbed light at that frequency','The molecule gave off extra light at that frequency','No light at all reached the detector there','The sample was too dilute to measure at that point'],correct:0,
   steps:['The spectrum shows how much light gets through.','A dip means less got through.','That light was absorbed by a vibrating bond.']},
  {id:'ln-alc',kind:'test',lvl:'bio',q:'A clear liquid shows a broad dip near 3350 cm⁻¹ and nothing at 1715 cm⁻¹. Is it acetone or isopropanol?',choices:['Isopropanol','Acetone','Both at once','You can’t tell from IR'],correct:0,
   steps:['Broad 3350 cm⁻¹ is O–H.','Strong 1715 cm⁻¹ would be C=O.','O–H with no C=O means the alcohol, isopropanol.']},
  {id:'ln-finger',kind:'test',lvl:'bio',q:'What is special about the fingerprint region below 1500 cm⁻¹?',choices:['Its pattern is unique to each molecule','It shows only O–H bonds','It is the same for every molecule','It shows a person’s fingerprints'],correct:0,
   steps:['Below 1500 cm⁻¹, many bends and stretches overlap.','The overall pattern differs for each molecule.','Matching it to a library confirms identity.']},
  {id:'ln-stiff',kind:'test',lvl:'bio',q:'Why does C=O absorb at a higher wavenumber than C–O?',choices:['The double bond is stiffer, so it vibrates faster','The double bond is heavier, so it vibrates faster','Oxygen is lighter in a double bond','C–O bonds don’t vibrate at all'],correct:0,
   steps:['Bonds vibrate like springs.','A double bond is a stiffer spring.','Stiffer springs vibrate faster, absorbing higher frequencies.']},
  {id:'ln-confirm',kind:'real',lvl:'bio',q:'A spot test suggests a powder is caffeine. What would confirm it?',choices:['Its spectrum matching a caffeine reference','A second spot test with the same reagent','Its color under room light','Dissolving it in water'],correct:0,
   steps:['Spot tests are presumptive.','A spectrum is like a fingerprint for a molecule.','A match to a known reference confirms the identity.']},
  {id:'ln-mion',kind:'test',lvl:'honors',q:'A mass spectrum’s molecular ion is at m/z 58. What is the molar mass of the compound?',choices:['About 58 g/mol','About 29 g/mol','About 116 g/mol','It can’t be told from the spectrum'],correct:0,
   steps:['The molecular ion is the whole molecule minus one electron.','Its charge is +1, so m/z equals its mass.','So the molar mass is about 58 g/mol (acetone, for example).']},
  {id:'ln-m1',kind:'test',lvl:'ap',q:'Why is caffeine’s M+1 peak taller than ethanol’s?',choices:['Caffeine has more carbon atoms that can be carbon-13','Caffeine molecules are more stable inside the machine','Ethanol has no isotopes, so it never shows an M+1 peak','Caffeine molecules carry a +2 charge instead of +1'],correct:0,
   steps:['About 1.1% of carbon is carbon-13.','Caffeine has 8 carbons; ethanol has 2.','More carbons means a bigger chance of one heavy atom, so a taller M+1 peak.']}
]);

BioLab.addLearn(L);
})();

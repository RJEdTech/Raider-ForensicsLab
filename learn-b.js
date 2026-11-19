/* Learn it for ForensicsLab, group B (Nov 18, 2026): bloodspatter, dna, lipprints, bitemarks, facematch, casefile, hashing, filesig, metadata.
   Same shape as BioLab/ChemLab/PhysLab learn-more.js: each step reuses the tool's own walkthrough setups (captured below before
   Learn it replaces the tour), keeps about 40 words a step, and marks the result on the picture. Why questions (addReview) for
   tools that had none; tools that had a few (lipprints, bitemarks) get extra questions appended after BioLab.start(). */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TT=(id,title)=>(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});
const TS=(id,title)=>{const s=TT(id,title);return s&&s.setup?s.setup:null;};
const TF=(id,title)=>{const s=TT(id,title);return s&&s.focus?s.focus:undefined;};
const tour=(id,...titles)=>sim=>{titles.forEach(t=>{const f=TS(id,t);if(f)f(sim);});};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&u!=='undefined'&&!/^\(|^of /.test(u)&&u.length<14?' '+u:'');};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* value of a metric for different control values (metrics that read only sim.p) */
const MP=(sim,id,p)=>{const m=met(sim,id);try{return m.get(Object.assign({},sim,{p:Object.assign({},sim.p,p)}));}catch(e){return NaN;}};
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
const L={},R={},RX={};

/* ======================= bloodspatter ======================= */
const bsCard=(ctx,k,rows)=>card(ctx,k,332,392,290,rows,{up:true});
L.bloodspatter={
  goals:{
    bio:['How a drop’s impact speed sets the size of its stain','How a slanted hit stretches a stain into an oval with a tail','Which way a drop was moving, from its tail','How string lines find the area the blood came from'],
    honors:['How to measure W and L and get the impact angle from sin θ = W ÷ L','Why a stain’s size can’t give the drop height exactly','How drip trails show a moving source'],
    ap:['How the tangent method estimates the source height, and why it runs high','How the Weber number links speed and drop size to spreading']},
  matters:'Bloodstain patterns help investigators work out where people stood and what moved, not who did it. The limits matter as much as the method: a 2009 National Academy of Sciences report found many pattern opinions were more subjective than scientific.',
  steps:[
    {key:'drop',title:'One drop falls',run:tour('bloodspatter','One drop of blood'),speed:0.35,focus:TF('bloodspatter','One drop of blood'),
     see:'A 50 µL drop, about what drips from a cut fingertip, falls 1 m onto flat paper. Left: side view. Right: the stain from above.',
     why:'It hits at about 4 m/s and spreads evenly in every direction, so the stain is round.',
     overlay(sim,ctx,LH,k){bsCard(ctx,k,[[FL(sim,'v',1),{w:700}],[FL(sim,'diam',1),{w:700,c:RED}]]);}},
    {key:'higher',title:'Higher drop, bigger stain',run:tour('bloodspatter','Higher drop'),speed:0.35,focus:TF('bloodspatter','Higher drop'),
     see:'The same drop from 3 m, about basketball-rim height. It hits faster and spreads wider.',
     why:'Air drag caps a falling drop near 7.7 m/s, its terminal velocity. So the width grows fast at first, then levels off.',
     overlay(sim,ctx,LH,k){bsCard(ctx,k,[[FL(sim,'v',1),{w:700}],[FL(sim,'diam',1),{w:700,c:RED}]]);}},
    {key:'hgraph',title:'Width vs drop height',speed:0.5,
     see:'The model’s stain width for this drop, from 10 cm to 6 m. The dot slides along the curve.',
     why:'Steep below 1 m, then flat: drops from 2 m and 6 m leave stains millimeters apart, so size can’t give the height.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:110,x1:740,y0:70,y1:360},xr=[10,600];K.dim(ctx,LH);
       const W=h=>MP(sim,'diam',{mode:'drop',angle:90,height:h}),ymax=30,sc=v=>v/ymax;
       K.axes(ctx,B,k,{xr,xt:[[10,'10 cm'],[100,'1 m'],[200,'2 m'],[300,'3 m'],[400,'4 m'],[500,'5 m'],[600,'6 m']],yt:[[0,'0'],[sc(10),'10'],[sc(20),'20'],[sc(30),'30']],xl:'Drop height',yl:'Stain width (mm)'});
       K.curve(ctx,B,xr,h=>sc(W(Math.max(10,h))),600,'#9b1c1c',null,3);
       const p=(tau%10)/10,h=10+590*K.ease(Math.min(1,p*1.25)),x=K.X(B,xr,h),y=K.Y(B,sc(W(h)));K.dot(ctx,x,y,HI,7);
       K.tagA(ctx,(h/100).toFixed(1)+' m: '+W(h).toFixed(1)+' mm',x>520?x-12:x+12,y+26,k,{s:13},x>520?'r':'l');
       const w1=W(100),w2=W(200);K.tagA(ctx,'1 m: '+w1.toFixed(1)+' mm · 2 m: '+w2.toFixed(1)+' mm',B.x0+12,B.y1-20,k,{s:12.5,hi:true},'l');}},
    {key:'tilt',title:'Tilt the surface',run:tour('bloodspatter','Tilt the surface'),speed:0.35,focus:TF('bloodspatter','Tilt the surface'),
     see:'Back to 1 m, with the paper tilted so the drop hits at 30°. The stain is an oval with a tail.',
     why:'The drop keeps sliding as it spreads, so the more slanted the hit, the longer the stain.',
     overlay(sim,ctx,LH,k){bsCard(ctx,k,[[FL(sim,'shape'),{w:700}]]);}},
    {key:'wl',lvl:'honors',title:'Measure W and L',run:sim=>{BioLab.setValues(sim,{angle:30,check:true});const f=TS('bloodspatter','Measure W and L');if(f)f(sim);},pause:true,focus:TF('bloodspatter','Measure W and L'),
     see:'A dashed oval fitted to the stain’s body. W is its width; L is its length, without the tail.',
     why:'sin θ = W ÷ L. Here W ÷ L ≈ 0.5, and sin 30° = 0.5, so θ = 30°.',
     overlay(sim,ctx,LH,k){bsCard(ctx,k,[[FL(sim,'diam',1)+' · '+FL(sim,'len',1),{w:700}],[FL(sim,'ratio',2)+' → θ ≈ '+F(sim,'ang',0),{w:800,c:RED}]]);}},
    {key:'tail',title:'The tail points the way it went',run:tour('bloodspatter','The tail points forward'),pause:true,focus:TF('bloodspatter','The tail points forward'),
     see:'A 25° hit. The tail, and the small satellite stain past it, are on the right.',
     why:'The tail forms on the side the drop was heading toward. So the blood came from the other way: look back opposite the tail.',
     overlay(sim,ctx,LH,k){bsCard(ctx,k,[['Travel →  so the source is ←',{w:800,c:RED}]]);}},
    {key:'trail',title:'A drip trail',run:tour('bloodspatter','Patterns tell what happened'),speed:0.5,focus:TF('bloodspatter','Patterns tell what happened'),
     see:'Drops from a moving source, like drips from a leaky bottle as you walk.',
     why:'Each drop keeps the source’s forward speed, so its tail points the way the source moved. Faster walking: longer stains, farther apart.',
     overlay(sim,ctx,LH,k){card(ctx,k,470,95,300,[[FL(sim,'ptell'),{w:700}]]);}},
    {key:'scene',title:'Back to the source',run:tour('bloodspatter','Back to the source'),pause:true,focus:TF('bloodspatter','Back to the source'),
     see:'Ten stains on a floor, from above. A string runs back from each stain along its long axis, away from the tail.',
     why:'Where the strings cross is the area of convergence: the blood came from somewhere above that spot.',
     overlay(sim,ctx,LH,k){card(ctx,k,575,322,210,[[FL(sim,'conv'),{w:700,c:RED}]]);}},
    {key:'hook',title:'Your question: 1 m or 2 m?',set:{mode:'drop',height:200,angle:90},fresh:true,speed:0.35,focus:[318,30,466,406],
     see:'The same drop from 2 m. The card compares its width with the 1 m stain.',
     why:'About 18.9 vs 20.3 mm: 1.4 mm apart, about what a slightly bigger drop adds. Size can’t settle it; the round shape shows the drops fell straight down.',
     overlay(sim,ctx,LH,k){const w1=MP(sim,'diam',{height:100,angle:90}),w2=MP(sim,'diam',{height:200,angle:90});
       bsCard(ctx,k,[['From 1 m: '+w1.toFixed(1)+' mm',{w:700}],['From 2 m: '+w2.toFixed(1)+' mm',{w:700}],['Difference: '+(w2-w1).toFixed(1)+' mm',{w:800,c:RED}]]);}},
    {key:'height',lvl:'ap',title:'How high was the source?',run:tour('bloodspatter','Back to the source','How high was it?'),pause:true,focus:TF('bloodspatter','How high was it?'),
     see:'Stain 3, with the true source shown. Each stain’s angle and its distance to the convergence give a height.',
     why:'Height ≈ d × tan θ, averaged over stains. Real drops fall along curves, so this straight-line estimate runs high.',
     overlay(sim,ctx,LH,k){card(ctx,k,575,322,210,[[FL(sim,'horig'),{w:700,c:RED}],[FL(sim,'truth'),{w:700}]]);}}
  ],
  useIt:[
    {do:'When a TV crime show reads a whole story from a few stains, ask which parts the stains could really show.',why:'Stains can give direction, angle and an area of origin. They can’t say who was there or why, and the size of a stain barely tells the height.'},
    {do:'Watch rain hit a car window or a slanted sidewalk.',why:'Drops that hit at a slant stretch into ovals with tails pointing the way they were moving, the same physics as a bloodstain.'},
    {do:'If you ever clean up a spill of paint or juice, look at the drops before you wipe.',why:'Round drops fell straight down; long ones with tails flew sideways. You can tell where the spill started.'}],
  tryIt:[{title:'drip stains (15 minutes)',steps:['Mix water with a few drops of food coloring and a little dish soap.','Drip single drops from a dropper onto paper from 25 cm, 50 cm, 1 m and 2 m. Label each.','Tape a sheet to a clipboard, tilt it to about 30°, and drip again.','Measure each stain’s width (and length, for the tilted ones) with a ruler.'],look:'Width grows with height, then levels off. Tilted stains are ovals with tails pointing downhill; W ÷ L should be close to sin 30° = 0.5. (Water is thinner than blood, so the sizes differ.)'}]};

/* ======================= dna ======================= */
const dnCard=(ctx,k,rows)=>card(ctx,k,18,398,254,rows,{up:true});
const sci=v=>{if(v<1000)return Math.round(v).toLocaleString('en-US');const e=Math.floor(Math.log10(v)),m=v/Math.pow(10,e);return m.toFixed(1)+' × 10'+String(e).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');};
const amp=(N0,n,E)=>{let N=N0;const w=Math.floor(n);for(let i=0;i<w;i++)N=N*(1+E*(1-N/2e11));return N*(1+E*(n-w)*(1-N/2e11));};
L.dna={
  goals:{
    bio:['How PCR copies a tiny amount of DNA into billions of copies','How gel electrophoresis sorts DNA pieces by size','How to read alleles against a ladder','Why one clear mismatch excludes a person, while a match only means “cannot be excluded”'],
    honors:['Why PCR copies double each cycle and then level off','What one band and two bands say about a person’s alleles at a locus'],
    ap:['How the product rule estimates how rare a full profile is','How capillary electrophoresis reads every locus at once']},
  matters:'DNA profiling has identified victims, convicted the guilty and freed more than 375 wrongly convicted people in the US. It works because labs test many places on the DNA and treat a single mismatch as decisive.',
  steps:[
    {key:'case',title:'The case',run:tour('dna','The case'),pause:true,focus:TF('dna','The case'),
     see:'A water bottle left at a broken trophy case (all fictional). The gel has lanes for a ladder, the evidence, the coach and three suspects.',
     why:'Saliva holds cheek cells, and each holds DNA. The coach belongs there; his sample rules out his DNA.',},
    {key:'pcr',title:'PCR copies the DNA',run:tour('dna','The case','PCR copies the STR regions'),speed:0.6,focus:TF('dna','PCR copies the STR regions'),
     see:'The tube cycles: 95 °C splits the DNA strands, 60 °C lets primers stick, 72 °C lets an enzyme copy. The count climbs.',
     why:'Each cycle copies every strand already there, so the count doubles every cycle.',
     overlay(sim,ctx,LH,k){dnCard(ctx,k,[[FL(sim,'cyc'),{w:700}],[FL(sim,'copies'),{w:800,c:RED}]]);}},
    {key:'pgraph',title:'The amplification curve',speed:0.5,
     see:'The model’s copy count each cycle, from 150 copies. Each step up the axis is 1,000 times more.',
     why:'Doubling climbs in a straight line on this log axis. Near 10⁹ copies, bands become visible; then ingredients run short and the curve levels off.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:110,x1:740,y0:70,y1:360},xr=[0,34];K.dim(ctx,LH);const y=v=>Math.log10(Math.max(1,v))/12;
       K.axes(ctx,B,k,{xr,xt:[[0,'0'],[10,'10'],[20,'20'],[28,'28'],[34,'34']],yt:[[0,'1'],[0.25,'10³'],[0.5,'10⁶'],[0.75,'10⁹'],[1,'10¹²']],xl:'PCR cycle',yl:'Copies (log scale)'});
       ctx.save();ctx.strokeStyle=HI;ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(B.x0,K.Y(B,0.75));ctx.lineTo(B.x1,K.Y(B,0.75));ctx.stroke();ctx.restore();
       K.tagA(ctx,'bands visible',B.x0+10,K.Y(B,0.75)-14,k,{s:12},'l');
       const p=(tau%11)/11,n=34*Math.min(1,p*1.2);K.curve(ctx,B,xr,c=>y(amp(150,c,1)),n,'#1f5fbf',null,3);
       const c=Math.floor(n);K.dot(ctx,K.X(B,xr,n),K.Y(B,y(amp(150,n,1))),HI,7);
       K.tagA(ctx,'Cycle '+c+': '+sci(amp(150,c,1)),K.X(B,xr,n)>500?K.X(B,xr,n)-12:K.X(B,xr,n)+12,K.Y(B,y(amp(150,n,1)))+26,k,{s:13},K.X(B,xr,n)>500?'r':'l');}},
    {key:'gel',title:'The gel sorts by size',run:tour('dna','The case','Gel electrophoresis'),speed:0.6,focus:TF('dna','Gel electrophoresis'),
     see:'The copies go into wells at the − end of a gel, a slab of firm jelly. Bands move down toward the + end.',
     why:'DNA is negatively charged, so it is pulled toward +. Short pieces slip through the gel’s tiny pores faster, so they travel farther.'},
    {key:'ladder',title:'Read against the ladder',run:tour('dna','The case','Gel electrophoresis','Read against the ladder'),pause:true,focus:TF('dna','Read against the ladder'),
     see:'Labeled bands. The ladder holds every common allele (version) of this locus, numbered by repeats. The evidence shows two bands: 7 and 8.',
     why:'You get one allele from each parent. Two bands mean two different alleles; one band means both copies are the same.',
     overlay(sim,ctx,LH,k){dnCard(ctx,k,[[FL(sim,'verdict'),{w:700}]]);}},
    {key:'hook',title:'Your question: a match at 4 of 6?',run:tour('dna','The case','Gel electrophoresis','Read against the ladder','Compare: one mismatch excludes'),pause:true,focus:TF('dna','Read against the ladder'),
     see:'All six loci are typed. One suspect matches the evidence at four but differs at two.',
     why:'The saliva came from one person, with one genotype at every locus, so two clear mismatches exclude that suspect. A full six-locus match only means “cannot be excluded.”',
     overlay(sim,ctx,LH,k){dnCard(ctx,k,[[FL(sim,'verdict'),{w:700,c:RED}]]);}},
    {key:'rare',lvl:'ap',title:'How rare is the match?',run:tour('dna','The case','Gel electrophoresis','Read against the ladder','Compare: one mismatch excludes'),pause:true,focus:TF('dna','Read against the ladder'),
     see:'The card multiplies how common each of the matching person’s genotypes is.',
     why:'The product rule: 2pq for two different alleles, p² for two the same, multiplied across loci. Six loci give about one in tens of millions.',
     overlay(sim,ctx,LH,k){dnCard(ctx,k,[['Chance a random person matches: '+F(sim,'stat'),{w:700,c:RED}]]);}},
    {key:'ce',lvl:'ap',title:'All loci at once',run:tour('dna','The case','Gel electrophoresis','Compare: one mismatch excludes','All loci at once'),pause:true,focus:TF('dna','All loci at once'),
     see:'A capillary run of sample 1: every locus at once, each allele a colored peak instead of a band.',
     why:'Each locus gets a dye color and a size range, so one run reads them all. Peak height (RFU) tracks how much DNA there was.'}
  ],
  useIt:[
    {do:'If you read that a DNA test “matched” someone, look for how many loci were tested and whether any mismatched.',why:'One clear mismatch excludes a person. A match at many loci only says the person cannot be excluded, with a rarity number attached.'},
    {do:'When a consumer DNA test says you share DNA with a stranger, remember relatives share alleles.',why:'Relatives inherit many of the same alleles, which is why a near-match at most loci can point to a family member and still exclude the person.'},
    {do:'Notice how fast a rumor spreads when each person tells two more.',why:'That is doubling, the same math as PCR: about 1,000 times more after 10 rounds and a billion after 30.'}],
  tryIt:[{title:'doubling (10 minutes)',steps:['Fold a sheet of paper in half, then in half again, counting the layers each time.','Write down 1, 2, 4, 8 … for each fold, until you can’t fold any more.','Work out how many layers 28 folds would make.'],look:'Each fold doubles the layers, like each PCR cycle doubles the DNA. 28 folds would be 2²⁸, about 268 million layers. You run out of room long before, the same way PCR levels off when it runs out of ingredients.'}]};
R.dna={questions:[
  {id:'double',kind:'test',lvl:'bio',q:'A sample starts with 100 copies of a DNA region. About how many copies are there after 10 PCR cycles?',choices:['About 1,000','About 100,000','About 2,000','About 10,000,000'],correct:1,
   steps:['Each cycle doubles the copies.','2¹⁰ = 1,024, about 1,000.','100 × 1,000 ≈ 100,000.']},
  {id:'gel',kind:'test',lvl:'bio',q:'Why do shorter DNA pieces travel farther in a gel?',choices:['They carry more negative charge per piece','They slip through the gel’s pores faster','They are pulled toward the − end harder','They are lighter, so gravity pulls them less'],correct:1,
   steps:['DNA is negatively charged, so all of it moves toward +.','The gel is a mesh of tiny pores.','Short pieces get through the mesh faster, so they move farther in the same time.']},
  {id:'mismatch',kind:'test',lvl:'bio',q:'The evidence profile and a suspect match at 9 of 10 loci but clearly differ at one. What can you say?',choices:['The suspect is very likely the source','The suspect is excluded as the source','The test needs only one more matching locus','The suspect must be the source’s parent'],correct:1,
   steps:['The evidence came from one person, with one genotype at every locus.','A clear difference at any locus means this person can’t be that source.','Many matches can come from a relative; one mismatch still excludes.']},
  {id:'bands',kind:'test',lvl:'bio',q:'At one locus, a person’s lane shows a single band. What does that mean?',choices:['The test failed for one of the two copies','Both copies of the locus have the same allele','The person has only one chromosome there','The sample is a mix of two different people'],correct:1,
   steps:['Everyone has two copies of each locus, one from each parent.','Two different alleles give two bands.','The same allele on both copies gives one band.']},
  {id:'many',kind:'test',lvl:'honors',q:'Why do labs type many loci instead of one?',choices:['Many people share the same genotype at any one locus','One locus is too short for the gel to show','Each locus only works on some people’s DNA','The ladder only covers one allele per locus'],correct:0,
   steps:['Any one genotype might be shared by 1 person in 10 or 20.','Each extra matching locus makes a random match rarer.','Together, many loci make a random match extremely unlikely.']},
  {id:'product',kind:'test',lvl:'ap',q:'At three loci, a profile’s genotypes have frequencies 0.1, 0.05 and 0.02. Using the product rule, how rare is the profile?',num:{ans:10000,tol:1,unit:'(1 in …)'},
   steps:['Multiply the frequencies: 0.1 × 0.05 × 0.02 = 0.0001.','0.0001 = 1 in 10,000.','So about 1 person in 10,000 would match by chance.']},
  {id:'plateau',kind:'test',lvl:'honors',q:'Why does PCR stop doubling after many cycles?',choices:['The DNA strands become too long to copy','Primers and building blocks run short','The enzyme copies only the newest strands','The tube cools down a little more each cycle'],correct:1,
   steps:['Each copy uses up primers and nucleotides.','Near billions of copies, these start to run out.','With fewer ingredients, each cycle adds less, and the curve levels off.']}
]};

/* ======================= lipprints ======================= */
const lpCard=(ctx,k,y,rows)=>card(ctx,k,578,y,205,rows);
L.lipprints={
  goals:{
    bio:['What the grooves on your lips are, and how a lip print forms','The six groove types used to classify a print','How a print is split into four quadrants and classified','Why matching types narrows the field but doesn’t identify a person'],
    honors:['How pressure and smearing change a print','Why the saliva on a lip print is often the stronger evidence'],
    ap:['Why few studies support matching lip prints to one person']},
  matters:'Lip prints show up on cups, glasses and letters at real scenes. Learning to classify them is a lesson in the difference between class evidence, which narrows a group, and individual evidence, which points to one person.',
  steps:[
    {key:'grooves',title:'Grooves on your lips',run:tour('lipprints','Grooves on your lips'),pause:true,focus:TF('lipprints','Grooves on your lips'),
     see:'A lip print, with a magnifier on one corner. The pale lines are grooves in the lips.',
     why:'Like fingertip ridges, the grooves form before birth. Pressed on a card or a cup, they leave pale gaps in the print.',},
    {key:'types',title:'Six groove types',run:tour('lipprints','Six groove types'),pause:true,focus:TF('lipprints','Six groove types'),
     see:'Six patches of grooves. Type II, branched like a Y, is outlined.',
     why:'Suzuki and Tsuchihashi sorted grooves into six types: I straight across, I′ straight but stopping partway, II branched, III crossed like an X, IV a net, V anything else.',},
    {key:'quads',title:'Four quadrants',run:tour('lipprints','Four quadrants'),pause:true,focus:TF('lipprints','Four quadrants'),
     see:'Dashed lines split the print down the middle and where the lips meet: four quadrants.',
     why:'They are named for the person’s own sides, so their upper right is on your left as you look.',},
    {key:'classify',title:'Classify each quadrant',run:tour('lipprints','Four quadrants','Classify each quadrant'),pause:true,focus:TF('lipprints','Classify each quadrant'),
     see:'Each quadrant is labeled with the type that covers most of it. The magnifier shows the upper left.',
     why:'The four types together are the print’s classification, a little like a four-letter code.',
     overlay(sim,ctx,LH,k){lpCard(ctx,k,345,[[FL(sim,'code'),{w:700,c:RED}]]);}},
    {key:'press',title:'How you press matters',run:tour('lipprints','Four quadrants','How you press matters'),pause:true,focus:TF('lipprints','How you press matters'),
     see:'The same lips, pressed hard. Many grooves have vanished.',
     why:'Pressing hard squeezes the grooves shut, like pressing a sponge flat. Too lightly and parts never touch. A good print uses relaxed lips and light, even pressure.'},
    {key:'where',title:'Where prints are found',run:tour('lipprints','Where prints are found'),pause:true,focus:TF('lipprints','Where prints are found'),
     see:'A lip print on a drinking glass. The panel says how to collect it.',
     why:'Glass is nonporous, so the print sits on top. Photograph it, swab the rim for DNA first, then dust and lift it with tape.',},
    {key:'hook',title:'Your question: does the code identify the drinker?',run:tour('lipprints','Same type is not a match'),pause:true,focus:TF('lipprints','Same type is not a match'),
     see:'The evidence beside a suspect with the same type in all four quadrants. The magnifiers compare one quadrant.',
     why:'The grooves fall in different places. A type is a class feature many people share, like a shoe size. Fine groove detail, or DNA, separates them.',},
    {key:'limits',lvl:'honors',title:'The limits',run:tour('lipprints','The limits'),pause:true,focus:TF('lipprints','The limits'),
     see:'The suspect whose grooves do line up with the evidence.',
     why:'Prints change with pressure, smearing and lip movement. Few studies have tested how well examiners match them, and courts rarely admit them. The DNA in the saliva is the strong evidence.'}
  ],
  useIt:[
    {do:'Next time a news story calls evidence a “match”, ask whether it is a class match or an individual one.',why:'A shared lip-print type, blood type or shoe size only narrows the group. It doesn’t point to one person.'},
    {do:'If you wear lip balm or lipstick, look at the mark it leaves on a cup.',why:'The pale lines are your lip grooves. Press harder and they fade, which is why a print’s quality depends on pressure.'},
    {do:'When you sort anything into categories, notice what the categories can’t tell apart.',why:'Six groove types sort prints into groups; they don’t make each print unique. Categories trade detail for simplicity.'}],
  tryIt:[{title:'your own lip print (10 minutes)',steps:['Put on a little lip balm or lipstick.','Press your relaxed, closed lips lightly on white paper or an index card.','Draw a cross to split it into four quadrants and classify each one with a magnifying glass.','Make a second print pressing hard and compare.'],look:'Each quadrant usually has one main groove type. The hard print loses grooves where the lips were squeezed. Compare with a friend: you may share some types but not the exact grooves.'}]};
RX.lipprints=[
  {id:'classcode',kind:'test',lvl:'bio',q:'Two people’s lip prints have the same groove type in all four quadrants. What does that show?',choices:['They are probably the same person','They belong to the same group of prints','One of them must have smeared the print','Their DNA would match at most places'],correct:1,
   steps:['A groove type is a class characteristic.','Many people share each type, so a four-quadrant code is shared too.','Matching codes only put both prints in the same group.']},
  {id:'pressure',kind:'test',lvl:'bio',q:'Why does a lip print made by pressing hard lose many of its grooves?',choices:['The grooves squeeze shut under pressure','Lipstick fills in the grooves when warm','Hard pressure smears every groove sideways','The lips stretch and the grooves vanish'],correct:0,
   steps:['Grooves are small folds in the lip surface.','Pressing hard flattens the lips and closes the folds.','Closed grooves don’t leave gaps, so they vanish from the print.']},
  {id:'upperright',kind:'test',lvl:'bio',q:'Looking at a lip print, where is the upper right quadrant?',choices:['Top half, on the viewer’s left','Top half, on the viewer’s right','Bottom half, on the viewer’s left','Bottom half, on the viewer’s right'],correct:0,
   steps:['Quadrants are named for the person’s own right and left.','Facing a person, their right side is on your left.','So their upper right is the top half, on your left.']}
];

/* ======================= bitemarks ======================= */
const bmCard=(ctx,k,y,rows)=>card(ctx,k,578,y,205,rows);
L.bitemarks={
  goals:{
    bio:['How teeth are numbered in the Universal system','Which teeth leave most of a bite mark, and how it is measured','How food and skin distort a bite mark','Why a bite mark can exclude people but not identify one'],
    honors:['How distinctive features like a turned or chipped tooth change the pattern','Why reviewers found bite-mark comparison unreliable for identifying people'],
    ap:['How distortion compares with the differences between suspects']},
  matters:'Bite-mark testimony helped convict people later freed by DNA. Studying why it fails teaches how to judge any forensic match: compare the differences you are relying on with the errors in the method.',
  steps:[
    {key:'numbers',title:'Thirty-two teeth, numbered',run:tour('bitemarks','Thirty-two teeth'),pause:true,focus:TF('bitemarks','Thirty-two teeth'),
     see:'An adult’s 32 teeth, numbered. Tooth 1, the upper right back molar, is highlighted.',
     why:'The Universal system counts 1 to 16 across the upper jaw from the person’s right, then 17 to 32 back across the lower jaw. Their right is on your left.'},
    {key:'front',title:'The front six make the mark',run:tour('bitemarks','The front six make the mark'),pause:true,focus:TF('bitemarks','The front six make the mark'),
     see:'Tooth 8, the upper right central incisor, one of the two big front teeth.',
     why:'In a bite, the front six teeth of each jaw (6 to 11 on top, 22 to 27 below) leave most of the mark. Back teeth rarely show.'},
    {key:'foam',title:'An impression in styrofoam',run:tour('bitemarks','An impression in styrofoam'),pause:true,focus:TF('bitemarks','An impression in styrofoam'),
     see:'The front teeth’s edges pressed into styrofoam. The dashed outline shows the real tooth edges; the panel lists the measurements.',
     why:'The key measurement is the intercanine distance: canine tip to canine tip, about 3.5 cm on top for most adults. Styrofoam copies it almost exactly.'},
    {key:'feature',title:'Distinctive features',run:tour('bitemarks','An impression in styrofoam','Distinctive features'),pause:true,focus:TF('bitemarks','Distinctive features'),
     see:'The same bite, but tooth 9 is turned in the jaw. Its mark sits at an angle.',
     why:'A turned, chipped, missing or out-of-line tooth, or a gap, changes the pattern. Examiners compare these features first.'},
    {key:'cheese',title:'Food changes the mark',run:tour('bitemarks','An impression in styrofoam','Food changes the mark'),pause:true,focus:TF('bitemarks','Food changes the mark'),
     see:'The same teeth bite cheese. Each mark spreads wider and blurs, like a footprint in mud.',
     why:'Soft food squishes outward, so the intercanine distance grows. An apple curves away, so a photo squeezes the outer marks closer together.'},
    {key:'skin',title:'Skin changes it more',run:tour('bitemarks','An impression in styrofoam','Skin changes it more'),pause:true,focus:TF('bitemarks','Skin changes it more'),
     see:'A bite on a bent arm, photographed with the arm straight. The mark no longer fits the dashed tooth outline.',
     why:'Skin is curved, stretchy and moves, and the bruise spreads for days. The mark here is off by several millimeters.'},
    {key:'hook',title:'Your question: which suspect took the bite?',run:tour('bitemarks','Comparing suspects'),pause:true,focus:TF('bitemarks','Comparing suspects'),
     see:'Suspect tracings on the apple bite. Two measure within 0.6 mm of it, and both line up.',
     why:'The apple’s curve shifts the marks about 1 mm, more than the gap between those two. The bite excludes the others but can’t choose; a saliva swab could.',},
    {key:'limits',lvl:'honors',title:'What odontology does well',run:tour('bitemarks','What odontology does well'),pause:true,focus:TF('bitemarks','What odontology does well'),
     see:'The other close suspect’s tracing on the same bite.',
     why:'A 2016 White House science council report found bite-mark comparison is not a valid way to identify a person. The solid uses: DNA from the saliva, and dental records to identify remains.'}
  ],
  useIt:[
    {do:'At your next dental checkup, ask which numbers your dentist uses for your teeth.',why:'US dentists use the Universal system, 1 to 32, the same chart forensic dentists use to identify remains from dental records.'},
    {do:'When a forensic method says two things “match”, ask how big the measurement errors are.',why:'If the errors are bigger than the differences between suspects, as with bite marks on skin, the match can’t tell them apart.'},
    {do:'Bite into a slice of cheese and an apple, then compare the marks.',why:'The cheese mark spreads and the apple mark bends with the curve: the same teeth, different marks.'}],
  tryIt:[{title:'bite impressions (15 minutes)',steps:['Bite gently into a clean styrofoam plate, then into a slice of cheese.','Measure the distance between your canine marks in each with a ruler, in millimeters.','Ask a family member to do the same and compare.'],look:'The styrofoam distance matches your teeth closely; the cheese one is wider and blurrier. Two people’s distances may differ by only a few millimeters, about as much as the cheese changed yours.'}]};
RX.bitemarks=[
  {id:'front6',kind:'test',lvl:'bio',q:'Which teeth leave most of a bite mark?',choices:['The front six teeth of each jaw','The back molars of the upper jaw','All 32 teeth in equal measure','Only the two biggest front teeth'],correct:0,
   steps:['In a bite, the front of the mouth meets the surface first.','The front six teeth of each jaw (6–11, 22–27) do most of the marking.','Back teeth rarely show.']},
  {id:'cheese',kind:'test',lvl:'bio',q:'The same person bites styrofoam and soft cheese. How does the cheese mark differ?',choices:['It is narrower and much sharper','It spreads wider and blurs','It is identical to the styrofoam mark','It shows the back teeth more clearly'],correct:1,
   steps:['Styrofoam holds the shape of the tooth edges.','Soft cheese squishes outward around each tooth.','So each mark spreads, and the intercanine distance grows.']},
  {id:'error',kind:'test',lvl:'honors',q:'Two suspects’ intercanine distances differ by 0.5 mm. The apple’s curve shifts the evidence mark about 1 mm. What can the bite show?',choices:['It points to the closer of the two suspects','It can’t tell those two suspects apart','It proves both suspects bit the apple','It shows the apple was bitten twice'],correct:1,
   steps:['The difference between suspects is 0.5 mm.','The distortion from the apple is about 1 mm, bigger than that difference.','When the error is bigger than the difference, the measurement can’t separate them.']}
];

/* ======================= facematch ======================= */
L.facematch={
  goals:{
    bio:['How a face search compares one photo with millions and scores each','What a match threshold and a false match rate are','Why a tiny error rate still gives many wrong matches in a huge database','Why a blurry photo makes wrong matches far more common'],
    honors:['Why a search still returns candidates when the real person isn’t in the database','How matching records on name and birthday can merge two different people'],
    ap:['How raising the threshold trades wrong matches against missed real ones']},
  matters:'Police in the US have arrested innocent people after face searches. Robert Williams was held about 30 hours in Detroit in 2020. The math here explains why, and why a search result should start an investigation, not end one.',
  steps:[
    {key:'search',title:'One photo against many',run:tour('facematch','One photo against many'),pause:true,focus:TF('facematch','One photo against many'),
     see:'A clear probe image, and two piles of similarity scores from comparing it with 1 million photos.',
     why:'A phone checks you against one saved face (1:1). A search checks one probe against everyone (1:N), so rare mistakes get many chances.',},
    {key:'piles',title:'Two piles of scores',run:tour('facematch','One photo against many'),pause:true,focus:[196,8,594,210],
     see:'The green pile is the score the real person usually gets. The gray pile is everyone else.',
     why:'Faces of the same person look alike, so they score high. Strangers usually score lower. With a clear photo, the piles barely overlap.'},
    {key:'thresh',title:'The threshold',run:tour('facematch','One photo against many'),pause:true,focus:[196,8,594,210],
     see:'The red line at 0.60 is the threshold: any score at or above it is a possible match.',
     why:'A sliver of the gray pile, too thin to see, lies past it. Each stranger clears it about 1 time in 100,000: the false match rate.',},
    {key:'hook',title:'Your question: how many wrong people?',run:tour('facematch','One photo against many','Tiny rates, big databases'),pause:true,focus:TF('facematch','Tiny rates, big databases'),
     see:'The answer, and the top five candidates the search returns.',
     why:'1,000,000 × 1/100,000 = about 10 wrong people above the threshold, on every search. A phone tries one stranger; a search tries a million.',},
    {key:'blur',title:'A blurry still',run:tour('facematch','One photo against many','A blurry still'),pause:true,focus:TF('facematch','A blurry still'),
     see:'Now the probe is a blurry surveillance still. Both piles spread out and slide together.',
     why:'The false match rate jumps to about 1 in 120: about 8,300 strangers clear the same threshold, and the top candidate is almost always the wrong person.'},
    {key:'dbgraph',title:'Wrong matches vs database size',speed:0.5,
     see:'Expected wrong people above 0.60, for 1,000 to 10 million photos. Blue: a clear photo. Red: a blurry still.',
     why:'Wrong matches = photos × false match rate, so each line climbs with the database: ten times the photos, ten times the wrong people.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,B={x0:170,x1:740,y0:70,y1:360},xr=[3,7];K.dim(ctx,LH);
       const per=q=>{const m=met(sim,'hits');let v=NaN;try{v=m.get(Object.assign({},sim,{p:Object.assign({},sim.p,{mode:'face',quality:q,thresh:0.6,db:'1000000',inDb:true}),st:Object.assign({},sim.st,{revealed:true})}));}catch(e){}return isFinite(v)&&v>0?v/1e6:(q==='good'?1e-5:1/120);};
       const fg=per('good'),fb=per('blur'),y=n=>(Math.log10(Math.max(0.01,n))+2)/7,fmt=v=>v<10?v.toFixed(v<1?2:1):Math.round(v).toLocaleString('en-US');
       K.axes(ctx,B,k,{xr,xt:[[3,'1,000'],[4,'10,000'],[5,'100,000'],[6,'1 million'],[7,'10 million']],yt:[[y(0.01),'0.01'],[y(1),'1'],[y(100),'100'],[y(1e4),'10,000']],xl:'Photos in the database',yl:'Wrong people above 0.60'});
       const p=(tau%10)/10,e=3+4*Math.min(1,p*1.3);K.curve(ctx,B,xr,x=>y(Math.pow(10,x)*fg),e,'#1f5fbf',null,3);K.curve(ctx,B,xr,x=>y(Math.pow(10,x)*fb),e,'#b3261e',null,3);
       [[fg,'#1f5fbf','clear'],[fb,'#b3261e','blurry']].forEach(([f,c,n],i)=>{const v=Math.pow(10,e)*f;const X=K.X(B,xr,e),Y=K.Y(B,y(v));K.dot(ctx,X,Y,c,6);K.tagA(ctx,n+': '+fmt(v),X>520?X-12:X+12,Y+(i?-16:24),k,{s:12.5},X>520?'r':'l');});
       if(p>0.8)K.tagA(ctx,'1 million photos: '+fmt(1e6*fg)+' (clear) vs '+fmt(1e6*fb)+' (blurry)',B.x0+12,B.y0+12,k,{s:13,hi:true},'l');}},
    {key:'notin',lvl:'honors',title:'Not in the database',run:tour('facematch','One photo against many','A blurry still','Not in the database'),pause:true,focus:TF('facematch','Not in the database'),
     see:'The real person isn’t in the database at all. The green pile is gone, but candidates still appear.',
     why:'A search always ranks the best-scoring photos it has. When the person isn’t there, every candidate it returns is a stranger.'},
    {key:'raise',lvl:'ap',title:'Raise the threshold',set:{mode:'face',quality:'blur',thresh:0.7,db:'1000000',inDb:true},fresh:true,run:sim=>{sim.st.revealed=true;},pause:true,focus:TF('facematch','A blurry still'),
     see:'The blurry still again, with the threshold raised from 0.60 to 0.70.',
     why:'Wrong people above the line drop from about 8,200 to about 340, but more of the real person’s scores now fall below it too. A threshold trades one error for the other.'},
    {key:'birthday',lvl:'honors',title:'Name and birthday',run:tour('facematch','Name and birthday'),pause:true,focus:TF('facematch','Name and birthday'),
     see:'A background check matching records on name and birth date. 1,000 records share your full name.',
     why:'Birth dates spread over 60 years, so each record shares yours about 1 time in 21,900. With 1,000 records, that is about a 4.5% chance of a false merge.'},
    {key:'real',title:'A real case',run:tour('facematch','A real case'),pause:true,focus:TF('facematch','A real case'),
     see:'The blurry still, at the same threshold, with its top candidates.',
     why:'In 2020, Detroit police arrested Robert Williams after a face-recognition match from a store video. His 2024 settlement bars arrests based on face recognition alone.',
     so:'Other evidence has to back up any search result.'}
  ],
  useIt:[
    {do:'When a news story says an app or system is “99.9% accurate”, ask how many people it checks.',why:'0.1% wrong on a million checks is a thousand mistakes. Tiny error rates turn into many errors at large scale.'},
    {do:'Check your phone’s face-unlock settings and how it handles a bad photo or a twin.',why:'Phones compare you with one saved face (1:1), which keeps wrong matches rare. Searches compare against millions (1:N).'},
    {do:'If a site merges your record with someone else’s, ask what details it matched on.',why:'Matching on name and birthday alone merges different people often enough to matter; adding another detail cuts that a lot.'}],
  tryIt:[{title:'the birthday match (10 minutes)',steps:['Ask a group of people (a class, a team, family group chat) for their birthdays, month and day.','Count how many pairs share a birthday.','Work out: with 365 days, about how many pairs would you expect?'],look:'With 23 people there is about a 50% chance two share a birthday. Comparing everyone with everyone gives many chances for a coincidence, the same reason big face searches return wrong matches.'}]};

/* ======================= casefile ======================= */
L.casefile={
  goals:{
    bio:['How a drive image is checked with a hash before anyone looks at it','How file signatures and deleted-file recovery reveal what a drive really holds','How a timeline from different systems tests an alibi','Why each claim in a case needs reliable evidence, not just opportunity'],
    honors:['How to convert logs from UTC to local time','How a phishing email gives itself away'],
    ap:['How a message can hide in the lowest bits of a photo']},
  matters:'Digital evidence is now part of most investigations, from school discipline to court cases. Each station here is one real step examiners take, and the last one is the hardest: making a claim no stronger than your evidence.',
  steps:[
    {key:'board',title:'The case',run:tour('casefile','The case'),pause:true,focus:TF('casefile','The case'),
     see:'An evidence board with nine empty card slots, and four suspects. A lab practical’s answer key leaked into a group chat. All fictional.',
     why:'Each station you solve adds a card. At the end you name a suspect and back each claim with a card.',},
    {key:'hash',title:'1 · Verify before you look',run:tour('casefile','1 · Verify'),pause:true,focus:TF('casefile','1 · Verify'),
     see:'Three hashes: one logged when the drive was seized, copy A and copy B. A matches the log; B doesn’t.',
     why:'A hash is a fingerprint of every byte. Copy B was opened on an office PC, which changed it, so only A can be trusted.',},
    {key:'sig',title:'2 · Names can lie, bytes can’t',run:tour('casefile','2 · Names can lie'),pause:true,focus:TF('casefile','2 · Names can lie'),
     see:'The first bytes of chem_notes.txt: 50 4B 03 04. The table says that is a ZIP file.',
     why:'Word .docx files are ZIP files inside. So this “text file” is a renamed Word document, and renaming is a clue someone wanted to hide it.'},
    {key:'recover',title:'3 · Deleted is not erased',run:tour('casefile','3 · Deleted is not erased'),pause:true,focus:TF('casefile','3 · Deleted is not erased'),
     see:'The drive’s clusters. A deleted file, ~draft.txt, used clusters 21 to 23. Two still hold its text; cluster 23 now belongs to a song.',
     why:'Deleting only marks space as free in the file table. The old bytes stay until something new is written over them.'},
    {key:'time',title:'4 · Line up the times',run:tour('casefile','4 · Line up the times'),pause:true,focus:TF('casefile','4 · Line up the times'),
     see:'Badges, sign-ins and file times, in local time. Riley’s bar starts at 3:38; the login is at 3:41.',
     why:'Riley said they left at 3:30, but Riley’s badge opened the lab at 3:38. Sam left at 3:35.',
     so:{honors:'Logs are in UTC: convert with UTC−6.'}},
    {key:'phish',title:'5 · How the password was stolen',run:tour('casefile','5 · How the password'),pause:true,focus:TF('casefile','5 · How the password'),
     see:'A fake help-desk email, with three clues boxed: the sender’s real domain, the reply-to address, and where the link really goes.',
     why:'The real domain is the last part, account-verify.test, not the school’s. Replies go to rm.lab42, a clue to the sender.'},
    {key:'stego',lvl:'honors',title:'6 · A note hidden in a photo',run:tour('casefile','6 · A note hidden'),pause:true,focus:TF('casefile','6 · A note hidden'),
     see:'A cat photo and its blue bit plane 0, the lowest bit of each blue value. A striped band is hidden text, signed -RM.',
     why:'The lowest bit changes a color by 1 of 255, too little to see. Initials are a clue, not proof.',},
    {key:'hook',title:'Your question: who had the opportunity?',run:sim=>{tour('casefile','1 · Verify','2 · Names can lie','3 · Deleted is not erased','4 · Line up the times','5 · How the password','6 · A note hidden','Make your case')(sim);BioLab.setValues(sim,{accuse:'riley'});},pause:true,focus:TF('casefile','Make your case'),
     see:'Riley Moss accused. Five rated cards are on the board; solving the other stations in Full lab adds four more.',
     why:'Riley’s badge opened the lab three minutes before the login. That is opportunity; reliable cards must also tie Riley to the drive and password.',}
  ],
  useIt:[
    {do:'Before you believe a screenshot of a chat or a post, ask where the original is.',why:'Like copy B, an image can be edited. Examiners trust only copies whose hashes match the original.'},
    {do:'Hover over a link before you click it, and read the domain right before the first single slash.',why:'Phishing links show one address and go to another. The real domain is the last part before the slash.'},
    {do:'When you delete a file to free space, remember it may still be recoverable until it is overwritten.',why:'Deleting marks space as free; secure erase or encryption is what actually protects old data.'}],
  tryIt:[{title:'a family timeline (15 minutes)',steps:['Pick one evening last week. Write down what each family member remembers doing and when.','Check phone photo times, text times or step counts for the same evening.','Line up the records on one timeline.'],look:'Memories drift by half an hour or more; device times are precise but can be in another time zone or simply wrong. Records from separate systems that agree are the strongest.'}]};
R.casefile={questions:[
  {id:'hashcopy',kind:'test',lvl:'bio',q:'A working copy of a seized drive has a different hash from the one in the custody log. What does that mean?',choices:['The copy is still fine to use as evidence','Some bytes of the copy have changed','The hash program was used incorrectly','The original drive must have been empty'],correct:1,
   steps:['A hash is computed from every byte.','Identical bytes always give an identical hash.','A different hash means at least one byte changed, so the copy can’t be trusted.']},
  {id:'docxzip',kind:'test',lvl:'bio',q:'A file named notes.txt starts with the bytes 50 4B 03 04. What is it most likely?',choices:['A plain text file with a typo','A ZIP-based file, like a Word document','A JPEG photo with the wrong name','A damaged file that can’t be opened'],correct:1,
   steps:['50 4B 03 04 is the ZIP signature (“PK”).','Word .docx files are ZIP files inside.','So it is probably a renamed document, not text.']},
  {id:'deleted',kind:'test',lvl:'bio',q:'Why can a deleted file often be recovered?',choices:['Deleting only marks its space as free','Deleted files move to a hidden backup drive','Every file is saved twice on the drive','The file table keeps a full copy of each file'],correct:0,
   steps:['The file table lists which clusters hold each file.','Deleting removes the entry and marks the clusters free.','The old bytes stay until new data overwrites them.']},
  {id:'utc',kind:'test',lvl:'honors',q:'A server log says a login happened at 21:41 UTC. The school is on UTC−6. What local time was it?',choices:['3:41 PM','9:41 PM','3:41 AM','11:41 AM'],correct:0,
   steps:['UTC−6 means local time is 6 hours behind UTC.','21:41 − 6 h = 15:41.','15:41 is 3:41 PM.']},
  {id:'domain',kind:'test',lvl:'bio',q:'An email link reads larkspur-ridge.example.org.account-verify.test/login. Who controls that site?',choices:['Whoever owns account-verify.test','The Larkspur Ridge school district','The email provider of the sender','Anyone who clicks on the link'],correct:0,
   steps:['A domain is read from the right.','The registered domain is the last two parts before the first single slash: account-verify.test.','Everything to its left is just a label its owner chose.']},
  {id:'opportunity',kind:'test',lvl:'bio',q:'A badge log shows a student in the lab when the key was copied. Why isn’t that enough to accuse them?',choices:['It shows opportunity, not that they did it','Badge logs are never used as evidence','Being in the lab proves nothing at all','Only a confession can support an accusation'],correct:0,
   steps:['Being there is opportunity.','Others could have been there, or the badge could have been borrowed.','A strong case adds reliable evidence tying the person to the act itself.']},
  {id:'lsb',kind:'test',lvl:'ap',q:'A hidden message changes only the lowest bit of each blue value in a photo. By how much can one blue value change, out of 255?',num:{ans:1,tol:0,unit:''},
   steps:['The lowest bit is worth 1.','Flipping it changes a value by at most 1.','1 out of 255 is far too small to see.']}
]};

/* ======================= hashing ======================= */
L.hashing={
  goals:{
    bio:['What a hash is: a short fingerprint made from every byte of a file','Why a matching hash means two files are identical','Why changing one character changes about half of the hash','How logged hashes show when evidence changed hands and changed'],
    honors:['Why examiners copy drives through a write blocker'],
    ap:['Why collisions exist but are never found for SHA-256: the birthday effect']},
  matters:'Every piece of digital evidence in court, and every software download you trust, relies on hashes. A one-line fingerprint lets anyone check that billions of bytes haven’t changed.',
  steps:[
    {key:'fp',title:'The evidence and its fingerprint',run:tour('hashing','The evidence and its fingerprint'),pause:true,focus:TF('hashing','The evidence and its fingerprint'),
     see:'The original messages.txt from a seized phone, with its SHA-256 hash: 64 characters, hashed when it was collected.',
     why:'A hash is computed from every byte of the file. Same bytes, same hash, every time; any change gives a different one.'},
    {key:'copies',title:'Five copies went out',run:tour('hashing','The evidence and its fingerprint'),pause:true,focus:TF('hashing','Five copies went out'),
     see:'Five copies: prosecutor, defense, lab archive, detective and court. None is hashed yet.',
     why:'Each copy should be byte-for-byte identical to the original, so each should give exactly the same hash.'},
    {key:'compare',title:'Hash a copy and compare',run:tour('hashing','Hash a copy and compare'),pause:true,focus:TF('hashing','Hash a copy and compare'),
     see:'Copy A is hashed. Its 64 characters are identical to the original’s: Exact match.',
     why:'You don’t have to compare the files byte by byte. A matching hash means every byte is the same.'},
    {key:'hook',title:'Your question: one character changed',run:tour('hashing','One character changes everything'),pause:true,focus:TF('hashing','One character changes everything'),
     see:'Text B differs from Text A by one character. Red squares are the hash bits that differ.',
     why:'About half of the 256 bits flip, so nearly every character changes: the avalanche effect. A hash never looks “close”.',},
    {key:'custody',title:'Follow the chain of custody',run:tour('hashing','Follow the chain of custody'),pause:true,focus:TF('hashing','Follow the chain of custody'),
     see:'The altered copy. Each person who received it logged its hash. The early ones match; then a ✗.',
     why:'The first logged hash that doesn’t match shows the file changed while the person before that handoff held it.'},
    {key:'blocker',lvl:'honors',title:'Why examiners use a write blocker',run:tour('hashing','Why examiners use a write blocker'),speed:0.6,focus:TF('hashing','Why examiners use a write blocker'),
     see:'A seized drive plugged straight into a laptop, with no write blocker. Red squares are bytes that changed.',
     why:'Computers write to a drive as soon as it connects. A write blocker lets the examiner read but never write.',},
    {key:'collide',lvl:'ap',title:'Collisions exist, but you’ll never find one',run:tour('hashing','Collisions exist'),speed:0.6,focus:TF('hashing','Collisions exist'),
     see:'Files hashed to a hash shortened to 8 bits: 256 possible values. A collision, two files with the same value, shows up within a few dozen files.',
     why:'With n files there are n(n−1)/2 pairs: the birthday effect. With all 256 bits you would need about 4 × 10³⁸ files to expect one.'}
  ],
  useIt:[
    {do:'When you download software, look for a SHA-256 checksum on the download page.',why:'Hashing your copy and comparing proves it is byte-for-byte what the publisher released.'},
    {do:'If someone sends a “cropped” or “slightly edited” version of a file as the original, ask for the hash.',why:'Any edit, even one character, gives a completely different hash.'},
    {do:'Notice that your password is stored as a hash, not as the password itself.',why:'Sites check your login by hashing what you type. A hash can’t be run backward to get the password.'}],
  tryIt:[{title:'see the avalanche (10 minutes)',steps:['Open the “Try it yourself” activity in this tool (or any online SHA-256 calculator).','Hash your name. Write down the first 8 characters.','Change one letter to a capital and hash again.'],look:'The two hashes share almost nothing, even though only one character changed. Change it back and the original hash returns exactly.'}]};
R.hashing={questions:[
  {id:'same',kind:'test',lvl:'bio',q:'Two files give exactly the same SHA-256 hash. What can you conclude?',choices:['They have the same file name','Their bytes are identical','They were made on the same day','They are both safe to open'],correct:1,
   steps:['A hash is computed from every byte.','Identical bytes give identical hashes.','A collision for SHA-256 has never been found, so the files are identical.']},
  {id:'avalanche',kind:'test',lvl:'bio',q:'One character in a long file changes. About what share of the 256 hash bits change?',choices:['About 1 bit','About half of them','All 256 of them','About a tenth of them'],correct:1,
   steps:['Hash functions mix every input bit into every output bit.','A tiny change scrambles the whole result.','On average about half, around 128 bits, flip: the avalanche effect.']},
  {id:'chain',kind:'test',lvl:'bio',q:'A copy’s logged hashes match at the first two handoffs and fail at the third. When did the file change?',choices:['Before the first handoff','While the second holder had it','After the third holder logged it','It never changed at all'],correct:1,
   steps:['The second hash matched, so the file was intact then.','The third hash failed.','So it changed between those handoffs, while the second holder had it.']},
  {id:'back',kind:'test',lvl:'bio',q:'Why can’t you get a file back from its hash alone?',choices:['A hash keeps only a fingerprint, not the file’s data','Hashes are always deleted after they are computed','The hash is protected by a separate password','Only the court is allowed to reverse a hash'],correct:0,
   steps:['A 64-character hash is the same length for any file.','It can’t hold the contents of a large file.','It is a fingerprint, so it can check a file but not rebuild it.']},
  {id:'blocker',kind:'test',lvl:'honors',q:'Why do examiners image a drive through a write blocker?',choices:['It makes copying the drive much faster','It stops the computer from changing the drive','It decrypts files on the drive automatically','It removes viruses before the drive is read'],correct:1,
   steps:['Computers write to drives as soon as they connect.','Any write changes bytes, so the drive’s hash would change.','A write blocker allows reading only, so the evidence stays exactly as seized.']},
  {id:'bits',kind:'test',lvl:'ap',q:'A hash is shortened to 10 bits. How many different values can it take?',num:{ans:1024,tol:0,unit:''},
   steps:['Each bit doubles the number of values.','2¹⁰ = 1,024.','With only 1,024 values, collisions come quickly.']},
  {id:'birthday',kind:'test',lvl:'ap',q:'With an 8-bit hash (256 values), why does a collision usually appear within a few dozen files?',choices:['The number of pairs grows much faster than the files','Short hashes are computed less carefully','Each new file erases one possible hash value','The first files always get the same values'],correct:0,
   steps:['Any two files can collide, not just a new file with one old one.','n files make n(n−1)/2 pairs: 30 files make 435.','With 256 values, that many pairs makes a collision likely: the birthday effect.']}
]};

/* ======================= filesig ======================= */
L.filesig={
  goals:{
    bio:['Why file names and extensions can’t be trusted','How a hex viewer shows the raw bytes of a file','What a file signature is, and how to read one','How to spot a file wearing the wrong name'],
    honors:['How one byte can be read as hex, decimal, binary or a character'],
    ap:['How data can hide after a file’s end marker']},
  matters:'Malware often hides behind innocent names, like invoice.pdf that is really a program. Reading a file’s first bytes is how investigators, antivirus tools and your own computer tell what a file really is.',
  steps:[
    {key:'folder',title:'The seized folder',run:tour('filesig','The seized folder'),pause:true,focus:TF('filesig','The seized folder'),
     see:'A seized USB drive with ten files. Its owner says it holds only homework and music. The hex viewer shows the first file’s bytes.',
     why:'Anyone can rename a file in two seconds, so investigators never trust names or extensions. They read what the bytes say.'},
    {key:'hex',title:'Reading raw bytes',run:tour('filesig','The seized folder'),pause:true,focus:TF('filesig','Reading raw bytes'),
     see:'Left: the offset into the file. Middle: each byte as two hex digits, 00 to FF. Right: the bytes as characters, or dots.',
     why:'A byte has 256 possible values, and two hex digits (16 × 16) name exactly that many.',},
    {key:'sig',title:'The signature',run:tour('filesig','The signature'),pause:true,focus:TF('filesig','The signature'),
     see:'schedule.pdf. Its first bytes are 25 50 44 46, shown on the right as %PDF.',
     why:'Most file types start with a fixed pattern of bytes: a file signature, or magic number. A JPEG starts FF D8 FF. A PDF starts %PDF.'},
    {key:'hook',title:'Your question: broken or wearing the wrong name?',run:tour('filesig','homework.txt is not homework'),pause:true,focus:TF('filesig','homework.txt is not homework'),
     see:'homework.txt starts with the bytes FF D8 FF E0.',
     why:'FF D8 FF is the JPEG signature. It isn’t broken: it’s a photo with a .txt name, so a text editor shows gibberish. Renaming changes only the label.'},
    {key:'flags',title:'Flag and check',run:tour('filesig','The seized folder'),pause:true,focus:TF('filesig','Flag and check'),
     see:'The rest of the folder. In Full lab you set Your call for each file: extension matches, wrong, or hidden data.',
     why:'Compare each file’s first bytes with the signature list: a .png should start 89 50 4E 47.',},
    {key:'byte',lvl:'honors',title:'One byte, three ways',run:tour('filesig','One byte, three ways'),pause:true,focus:TF('filesig','One byte, three ways'),
     see:'logo.png, with the cursor on its first byte: 89.',
     why:'0x89 = 8 × 16 + 9 = 137 = 10001001 in binary. 137 isn’t a printable ASCII character, so the text column shows a dot.'},
    {key:'after',lvl:'ap',title:'Something after the end',run:tour('filesig','Something after the end'),pause:true,focus:TF('filesig','Something after the end'),
     see:'photo_0412.jpg, scrolled to where the JPEG ends with FF D9. Right after it: 50 4B 03 04.',
     why:'Image viewers stop reading at FF D9, so a ZIP archive appended after it never shows. The photo looks normal, but it carries hidden files.'}
  ],
  useIt:[
    {do:'Turn on “show file extensions” in your computer’s file settings.',why:'Hidden extensions let a file called photo.jpg.exe pass as a picture. Seeing the full name is the first check.'},
    {do:'Be careful with attachments whose type doesn’t fit the message, like a “receipt” that is a .zip or .exe.',why:'Names and icons can lie. Your antivirus checks the bytes, the way you did here.'},
    {do:'If a file won’t open, try checking what it really is before deleting it.',why:'A file with the wrong extension often opens fine once it has the right one, like homework.txt as a .jpg.'}],
  tryIt:[{title:'rename a picture (10 minutes)',steps:['Copy a photo on a computer (work on the copy). Turn on file extensions.','Rename the copy from photo.jpg to photo.txt and open it in a text editor.','Look at the first characters, then rename it back.'],look:'The text editor shows gibberish that starts with ÿØÿ, the way FF D8 FF looks as text. Renaming it back makes it a photo again, because the bytes never changed.'}]};
R.filesig={questions:[
  {id:'jpeg',kind:'test',lvl:'bio',q:'A file named essay.docx starts with FF D8 FF. What is it really?',choices:['A Word document','A JPEG image','A PDF document','A damaged text file'],correct:1,
   steps:['Look up the signature, not the name.','FF D8 FF is the JPEG signature.','So it is a picture with a .docx name.']},
  {id:'rename',kind:'test',lvl:'bio',q:'You rename song.mp3 to song.txt. What happens to the file’s bytes?',choices:['They are converted into text','Nothing; only the name changes','They are scrambled and lost','The first bytes are replaced'],correct:1,
   steps:['The extension is part of the name, not the data.','Renaming changes only the label in the file table.','The bytes, signature included, stay the same.']},
  {id:'hexval',kind:'test',lvl:'honors',q:'What decimal value is the byte 0x4A?',num:{ans:74,tol:0,unit:''},
   steps:['Hex is base 16: the first digit counts 16s.','4 × 16 = 64.','64 + A (10) = 74.']},
  {id:'pdf',kind:'test',lvl:'bio',q:'Why does a PDF’s hex view show “%PDF” in the text column?',choices:['Its first bytes are the characters %PDF','The viewer adds a label for known types','Every file starts with its own extension','The text column shows the file name'],correct:0,
   steps:['The PDF signature is 25 50 44 46.','As ASCII characters, those bytes are %, P, D, F.','The text column shows bytes as characters, so you see %PDF.']},
  {id:'twohex',kind:'test',lvl:'bio',q:'Why does a hex viewer use exactly two hex digits per byte?',choices:['One byte has 256 values, and 16 × 16 = 256','Each hex digit stands for one whole byte','Two digits fit the screen better than one','Bytes have two halves, a name and a value'],correct:0,
   steps:['A byte is 8 bits, so it has 2⁸ = 256 values.','One hex digit has 16 values.','Two digits give 16 × 16 = 256, exactly one byte.']},
  {id:'append',kind:'test',lvl:'ap',q:'A ZIP signature appears right after a JPEG’s FF D9 end marker. What does that suggest?',choices:['Hidden data was added after the image','The image is damaged near the end','The camera saved the photo twice','The file is a normal JPEG, nothing more'],correct:0,
   steps:['FF D9 marks the end of the image data.','Viewers stop reading there.','Bytes after it, starting PK, are a hidden ZIP archive.']},
  {id:'malware',kind:'real',lvl:'bio',q:'An email attachment is called invoice.pdf, but its first bytes are 4D 5A, the signature of a Windows program. What should you do?',choices:['Don’t open it, and report the email','Open it, since the name says PDF','Rename it to .pdf so it opens safely','Forward it to friends to check it'],correct:0,
   steps:['The bytes say it is a program, not a document.','Programs can run code on your computer.','A program disguised as a PDF is a classic malware trick, so report it unopened.']}
]};

/* ======================= metadata ======================= */
L.metadata={
  goals:{
    bio:['What metadata is: hidden facts a device stores with a file','Why the same moment has different clock times in different systems','How metadata can be edited, and how to spot an edited file','How a timeline from separate systems tests an alibi'],
    honors:['How to convert UTC times to local time','Why a copied file can be “modified” before it was “created”'],
    ap:['How Unix timestamps work','How daylight saving time traps a timeline']},
  matters:'Your phone stamps time and place on almost everything it saves. That metadata can prove where you were, or be faked. Knowing how to test it is part of judging any photo, post or record.',
  steps:[
    {key:'alibi',title:'The alibi',run:tour('metadata','The alibi'),pause:true,focus:TF('metadata','The alibi'),
     see:'A timeline from 8:00 to 9:30 PM. Blue: Hale says he was at the diner, 8 to 10. Red: the controller went missing, 8:30 to 9:30. All fictional.',
     why:'Evidence putting Hale somewhere else inside the red band breaks the alibi.',},
    {key:'lanes',title:'Evidence from different systems',run:tour('metadata','The alibi'),pause:true,focus:TF('metadata','Evidence from different systems'),
     see:'Five lanes, each a separate source: a diner receipt, Hale’s phone, school Wi-Fi, door badges and a hall camera.',
     why:'One record can be wrong or faked. Separate systems that agree are much harder to fake, because someone would have to change all of them.'},
    {key:'receipt',title:'Read the record',run:tour('metadata','Read the record'),pause:true,focus:TF('metadata','Read the record'),
     see:'Card 1, the diner receipt, printed at 8:12 PM, placed in the Diner lane.',
     why:'The register prints local time, so it needs no conversion. Hale really was at the diner early in the evening.'},
    {key:'badge',title:'Same moment, different clocks',run:tour('metadata','Same moment'),pause:true,focus:TF('metadata','Same moment'),
     see:'Card 4: Hale’s badge opened the robotics lab. The server logged 03:47 UTC, March 8; it goes on the timeline at 8:47 PM.',
     why:{bio:'Colorado is 7 hours behind UTC, so 03:47 UTC is 8:47 PM the evening before. That is when Hale says he was eating at the diner.',
          honors:'Colorado is UTC−07:00: 03:47 − 7 h = 20:47 the day before, 8:47 PM. Reading it as 3:47 AM would wreck the timeline.',
          ap:'The server stores Unix time, 1772941650 seconds after 1970-01-01 UTC: 03:47:30 UTC on March 8, which is 8:47:30 PM MST.'}},
    {key:'hook',title:'Your question: does the photo prove it?',run:tour('metadata','An edited photo'),pause:true,focus:TF('metadata','An edited photo'),
     see:'The alibi photo’s metadata: 9:15 PM at the diner. Red rows: a photo editor saved it two days later.',
     why:'An editor can retype any date or place, so the photo proves nothing. Records Hale couldn’t edit (Wi-Fi, badge, camera) put him at the school.',},
    {key:'copy',lvl:'honors',title:'Modified before created',run:tour('metadata','Modified before created'),pause:true,focus:TF('metadata','Modified before created'),
     see:'A manual on Hale’s laptop: modified February 20, created March 9.',
     why:'Copying makes a new file with a new Created time but keeps the old Modified time. It is a copy artifact, not tampering: the file arrived on March 9.'},
    {key:'dst',lvl:'ap',title:'Daylight saving traps',run:tour('metadata','Daylight saving traps'),pause:true,focus:TF('metadata','Daylight saving traps'),
     see:'A doorbell log reading 2:30 AM on March 8, 2026.',
     why:'At 2:00 AM that night, Mountain time jumped to 3:00 AM, so 2:30 AM never happened. The device ignores daylight saving: it was really 3:30 AM MDT.'},
    {key:'all',title:'Build the whole timeline',run:tour('metadata','Build the whole timeline'),pause:true,focus:TF('metadata','Build the whole timeline'),
     see:'The finished timeline. Phone, Wi-Fi, badge and camera cards sit inside the red band; the edited photo is crossed out.',
     why:'Three separate systems put Hale at the school from 8:44 to 9:08 PM, inside the theft window. Only the edited photo disagrees. The alibi fails.'}
  ],
  useIt:[
    {do:'Check what your phone stores in a photo before you post it: open the photo’s details or info.',why:'Many photos carry GPS coordinates. Social sites often strip them, but messages and email may not.'},
    {do:'When you compare times from two apps or devices, check their time zones first.',why:'Servers often log in UTC. Mixing UTC and local time can shift events by hours, the trap in this case.'},
    {do:'Be skeptical of a single screenshot or photo as proof of where or when.',why:'Metadata can be edited. Look for separate records that agree.'}],
  tryIt:[{title:'your photo’s metadata (10 minutes)',steps:['Open a photo you took on your phone and view its details or info (swipe up, or tap the ⓘ).','Write down the date, time and location it shows.','Check whether the time matches when you remember taking it.'],look:'The photo stores the exact time and often the place. If you edited the photo, the details may show the editing app too.'}]};
R.metadata={questions:[
  {id:'utc',kind:'test',lvl:'bio',q:'A badge server logs 03:47 UTC on March 8. Colorado is 7 hours behind UTC. What was the local time?',choices:['8:47 PM on March 7','3:47 AM on March 8','10:47 AM on March 8','8:47 AM on March 8'],correct:0,
   steps:['7 hours behind means subtract 7.','03:47 − 7 h goes back past midnight.','That gives 20:47 on March 7: 8:47 PM.']},
  {id:'edited',kind:'test',lvl:'bio',q:'A photo’s metadata names a photo editor and was modified two days after it was taken. What does that mean for its date and GPS?',choices:['They can’t be trusted either way','They prove the photo was faked','They are more accurate after editing','They show where the editor was'],correct:0,
   steps:['Photo editors can rewrite date and location fields.','So the values might be real, or retyped.','The photo can’t prove the time or place by itself.']},
  {id:'agree',kind:'test',lvl:'bio',q:'Why do investigators trust records from several separate systems more than one record?',choices:['Faking all of them at once is much harder','Separate systems never make mistakes','More records always mean a confession','One record is never allowed in court'],correct:0,
   steps:['Any one record can be wrong or edited.','Separate systems are run by different people and devices.','When they agree, it would take changing all of them to fake the story.']},
  {id:'copied',kind:'test',lvl:'honors',q:'A file’s Modified time is earlier than its Created time. What is the most likely reason?',choices:['The file was copied onto this computer','Someone set the computer’s clock back','The file was damaged while being saved','The file was created by a virus'],correct:0,
   steps:['Copying makes a new file, so Created is the copy time.','The Modified time travels with the content.','So Modified before Created usually just means a copy.']},
  {id:'unix',kind:'test',lvl:'ap',q:'A Unix timestamp counts seconds since 1970-01-01 00:00 UTC. How many seconds are in one day?',num:{ans:86400,tol:0,unit:'s'},
   steps:['24 hours × 60 minutes × 60 seconds.','24 × 3,600 = 86,400.','So each day adds 86,400 to a Unix timestamp.']},
  {id:'dst',kind:'test',lvl:'ap',q:'On the night daylight saving starts, clocks jump from 2:00 AM to 3:00 AM. A device logs 2:30 AM. What does that tell you?',choices:['The device ignores daylight saving','The event happened at exactly 2:30 AM','The log was faked to fit the case','The device is in a different country'],correct:0,
   steps:['2:30 AM doesn’t exist that night.','The device must still be on standard time.','So the real local time was 3:30 AM daylight time.']},
  {id:'gps',kind:'real',lvl:'bio',q:'You post a photo taken at home straight from your phone to a site that keeps metadata. What might others learn?',choices:['Where you live, from the GPS coordinates','Your phone’s password from the camera data','The names of everyone in your contacts','Nothing, since photos never store location'],correct:0,
   steps:['Phones can write GPS coordinates into each photo.','Sites that keep metadata pass them along.','Coordinates of a photo taken at home point to your address.']}
]};

BioLab.addLearn(L);
BioLab.addReview(R);
/* tools that already had a few why questions: append ours after the site’s review questions are attached at start */
const start0=BioLab.start;BioLab.start=function(){const r=start0.apply(this,arguments);
  Object.keys(RX).forEach(id=>{const d=DEF(id);if(!d)return;if(!d.review)d.review={questions:[]};if(!d.review.questions)d.review.questions=[];const have=new Set(d.review.questions.map(q=>q.id));
    RX[id].forEach(q=>{if(!have.has(q.id))d.review.questions.push(q);});});return r;};
})();

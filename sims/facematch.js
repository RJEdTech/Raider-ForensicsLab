(function(){
'use strict';
const {clamp,lerp,rng,randn,rr,txt,pill,atLeast,PAL,FONT}=BioLab.h;

/* ======================================================================
   The wrong match: face-recognition search and record linkage.
   Face search (1:N): a probe image's feature vector is compared with every
   photo in a database. Similarity scores for the true person (genuine) and
   for everyone else (impostors) are modeled as two normal distributions.
   False match rate FMR = P(impostor score > threshold); expected false hits
   = (number of other people) × FMR. Image quality widens the distributions.
   Record linkage: matching people on name + date of birth.
   All distribution parameters are illustrative assumptions (see about).
   ====================================================================== */
const QUAL={
  good:{l:'Clear, front-facing photo',short:'clear photo',withA:'a clear photo',g:[0.78,0.06],i:[0.30,0.0703]},
  dim:{l:'Poor lighting',short:'poor lighting',withA:'poor lighting',g:[0.66,0.10],i:[0.33,0.085]},
  blur:{l:'Blurry surveillance still',short:'blurry still',withA:'a blurry still',g:[0.58,0.12],i:[0.36,0.10]}};
/* complementary error function, fractional error < 1.2e-7 (Numerical Recipes erfcc) */
function erfc(x){const z=Math.abs(x),t=1/(1+0.5*z);const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
const Q=z=>0.5*erfc(z/Math.SQRT2);                 // upper tail of the standard normal
const phi=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
/* inverse of the standard normal CDF (Acklam), p in (0,1) */
function ninv(p){const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742];
  const pl=0.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if(p>1-pl){q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  q=p-0.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}

function face(p){const Qd=QUAL[p.quality]||QUAL.good,N=+p.db,inDb=!!p.inDb,others=N-(inDb?1:0),t=p.thresh;
  const [mg,sg]=Qd.g,[mi,si]=Qd.i;
  const fmr=Q((t-mi)/si);
  const hits=others*fmr;
  const anyWrong=-Math.expm1(others*Math.log1p(-fmr));
  const tmr=inDb?Q((t-mg)/sg):0;
  let topWrong=1;if(inDb){let acc=0;const n=1600,lo=mg-8*sg,hi=mg+8*sg,h=(hi-lo)/n;
    for(let k=0;k<=n;k++){const s=lo+k*h,w=(k===0||k===n)?1:(k%2?4:2);const qi=Q((s-mi)/si);acc+=w*phi((s-mg)/sg)/sg*Math.exp(others*Math.log1p(-Math.min(qi,1-1e-16)));}
    topWrong=clamp(1-acc*h/3,0,1);}
  const dprime=(mg-mi)/Math.sqrt((sg*sg+si*si)/2);
  return {Qd,N,inDb,others,t,mg,sg,mi,si,fmr,hits,anyWrong,tmr,topWrong,dprime};}
/* top candidates: order statistics of the impostor scores, plus the real person's score */
let CAND={key:null,val:null};
function candidates(sim){const p=sim.p,f=face(p),seed=sim.seed||1;const key=[p.quality,p.db,p.inDb,seed].join('|');if(CAND.key===key)return CAND.val;
  const r=rng(seed*7919+13);const list=[];let qPrev=0,n=f.others;
  for(let k=0;k<5&&n>0;k++,n--){const u=Math.max(r(),1e-12);const qk=qPrev+(1-qPrev)*(-Math.expm1(Math.log(u)/n));qPrev=qk;
    list.push({s:f.mi+f.si*(-ninv(clamp(qk,1e-300,1-1e-12))),real:false,id:10000+Math.floor(r()*89999)});}
  if(f.inDb)list.push({s:f.mg+f.sg*randn(r),real:true,id:10000+Math.floor(r()*89999)});
  list.sort((a,b)=>b.s-a.s);const val=list.slice(0,5);CAND={key,val};return val;}

/* record linkage on name + date of birth */
function link(p){const K=+p.nameK,D=365*p.span;const pk=p.keys==='name'?1:p.keys==='namedob'?1/D:1/(D*10000);
  const exp=(K-1)*pk,any=-Math.expm1((K-1)*Math.log1p(-Math.min(pk,1-1e-15)));return {K,D,pk,exp,any:p.keys==='name'?(K>1?1:0):any};}

const fmtI=n=>Math.round(n).toLocaleString('en-US');
function oneIn(x){if(x<=0)return 'never';const n=1/x;if(n<1.5)return 'almost every time';const sig=n>=100?+n.toPrecision(2):Math.round(n);return '1 in '+fmtI(sig);}
function fmtHits(h){return h>=100?fmtI(h):h>=10?h.toFixed(0):h>=1?h.toFixed(1):h>=0.01?h.toFixed(2):h.toExponential(1);}
function pct(x){const v=100*x;return v>=99.95&&v<100?'over 99.9%':v>=10?v.toFixed(0)+'%':v>=1?v.toFixed(1)+'%':v>=0.01?v.toFixed(2)+'%':'under 0.01%';}

/* ---------- Your turn: expected wrong people = photos searched × false match rate ----------
   Uses the rate as printed ("1 in X", 2 significant figures), so the key matches what students read. */
const oneInX=f=>{const n=1/f;return n>=100?+n.toPrecision(2):Math.max(1,Math.round(n));};
const fmtY=v=>v>=100?Math.round(v).toLocaleString('en-US'):v>=10?v.toFixed(0):v>=1?v.toFixed(1):v>=0.01?v.toFixed(2):v.toPrecision(1);
const YT={
  key:sim=>[sim.p.quality,sim.p.thresh,sim.p.db,sim.p.inDb].join('|'),
  ans:sim=>{const f=face(sim.p);return f.N/oneInX(f.fmr);},
  tol:sim=>Math.max(1e-9,0.04*YT.ans(sim)),
  fmt:fmtY,
  wrong:sim=>{const f=face(sim.p),a=YT.ans(sim),X=oneInX(f.fmr);return [a*10,a/10,X/f.N,a*100];},
  hint:'Divide the number of photos by the X in “1 in X.”'
};
const hashS=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))%2147483647;return h||1;};
const ytNow=sim=>{const y=sim.st&&sim.st.yt;return y&&y.key===YT.key(sim)?y:null;};
function ytChoices(sim){const a=YT.ans(sim),t=YT.tol(sim),f=YT.fmt,seen=new Set([f(a)]),out=[a];
  const add=v=>{if(out.length<4&&Number.isFinite(v)&&v>0&&!seen.has(f(v))&&Math.abs(v-a)>t*1.5){seen.add(f(v));out.push(v);}};
  YT.wrong(sim).forEach(add);[1000,0.001,5,0.2].forEach(m=>add(a*m));
  const r=rng(hashS(YT.key(sim)));for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function ytSubmit(sim,v){let y=ytNow(sim);if(!y){y={key:YT.key(sim),tries:[],done:false,ok:false};sim.st.yt=y;}if(y.done)return;
  y.tries.push(v);if(Math.abs(v-YT.ans(sim))<=YT.tol(sim)+1e-9){y.ok=true;y.done=true;}else if(y.tries.length>=2)y.done=true;
  if(y.done)sim.st.revealed=true;}
function ytClick(sim,x,y){const R=sim.vis&&sim.vis.ytR;if(!R)return false;for(const r of R){if(x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]-4&&y<=r[1]+r[3]+4){BioLab.setValues(sim,{ans:r[4]});ytSubmit(sim,r[4]);sim.vis.ytR=null;return true;}}return false;}
const shown=sim=>!!(sim.st&&sim.st.revealed)||sim.p.mode==='link';
const fresh=sim=>{sim.st.revealed=false;sim.st.yt=null;};
function wrap(ctx,s,x,y,w,o){o=o||{};const size=o.s||13,lh=o.lh||size*1.3;ctx.font=(o.w||400)+' '+size+'px '+FONT;let line='',yy=y;
  String(s).split(' ').forEach(word=>{const t=line?line+' '+word:word;if(ctx.measureText(t).width>w&&line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;line=word;}else line=t;});
  if(line){txt(ctx,line,x,yy,{s:size,w:o.w,c:o.c,a:o.a});yy+=lh;}return yy;}
function ytVerdict(sim){const y=ytNow(sim);if(!y||!y.tries.length)return '';const last=y.tries[y.tries.length-1];
  return y.ok?'Your answer: '+YT.fmt(last)+'. Correct.':'Your answer: '+YT.fmt(last)+'. The math gives '+YT.fmt(YT.ans(sim))+'.';}

function syncMode(sim){const ui=sim.ui;if(!ui||!ui.sec)return;const m=sim.p.mode;
  (sim.def.controls||[]).forEach(c=>{if(!c.modes)return;const e=ui.sec.querySelector('#'+sim.def.id+'-'+c.id)||ui.sec.querySelector('#'+sim.def.id+'-'+c.id+'-l');const w=e&&e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl||'bio')||!c.modes.includes(m);});
  (sim.def.metrics||[]).forEach(mm=>{const t=ui.tiles&&ui.tiles[mm.id];const w=t&&t.num&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl||'bio')||(mm.modes&&!mm.modes.includes(m));});
  const btns=[...ui.sec.querySelectorAll('.actions button')];(sim.def.actions||[]).forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl||'bio')||(a.modes&&!a.modes.includes(m));});}
const F=['face'],LK=['link'];

/* abstract face icon: no real faces */
function faceIcon(ctx,x,y,r,variant,col,ink){ctx.save();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,6.29);ctx.fill();
  ctx.fillStyle=ink;const v=variant%4;
  if(v===0){ctx.beginPath();ctx.arc(x,y-r*0.35,r*0.95,Math.PI*1.08,Math.PI*1.92);ctx.lineTo(x,y-r*0.6);ctx.fill();}
  else if(v===1){ctx.fillRect(x-r*0.8,y-r*0.98,r*1.6,r*0.32);}
  else if(v===2){ctx.beginPath();ctx.arc(x-r*0.55,y-r*0.75,r*0.32,0,6.29);ctx.arc(x+r*0.55,y-r*0.75,r*0.32,0,6.29);ctx.fill();}
  ctx.beginPath();ctx.arc(x-r*0.34,y-r*0.08,r*0.11,0,6.29);ctx.arc(x+r*0.34,y-r*0.08,r*0.11,0,6.29);ctx.fill();
  ctx.strokeStyle=ink;ctx.lineWidth=Math.max(1.5,r*0.08);ctx.beginPath();ctx.arc(x,y+r*0.2,r*0.32,0.2*Math.PI,0.8*Math.PI);ctx.stroke();ctx.restore();}

const SIM={
  id:'facematch',hash:'facematch',yt:YT,apUnit:18,order:7.5,tab:'The wrong match',kind:'Learning tool',next:['casefile'],
  card:'Search a blurry still against a million photos, count the wrong people who score as matches, and see how name-and-birthday matching merges strangers.',
  title:'The wrong match: face recognition and record matching',
  lede:{bio:'The math: expected false matches = photos searched × false match rate (Forensic Science; Statistics: probability). Your phone’s face unlock compares your face with one saved face. A police face search compares one photo with millions. Compute how many wrong people to expect, then change the image quality, the threshold and the database size.',
        honors:'Similarity scores for the true person and for everyone else form two overlapping distributions. The threshold sets the false match rate, and the database size multiplies it. Then see how matching records on name and birth date can merge two different people.',
        ap:'Compute expected false hits as N × FMR, the chance that at least one wrong person clears the threshold, and the chance that the top-ranked candidate is the wrong person. Then use the birthday math to estimate false merges in record linkage.'},
  scale:{bio:'Face search: one probe image against 1,000 to 10 million photos; with a clear photo, a stranger clears the threshold about 1 time in 100,000. Name match: one person’s record against up to 10,000 others with the same name.',
         ap:'Similarity scores run from 0 to 1. False match rates span from about 1 in 10 to less than 1 in a billion, so tail areas too thin to see still matter when multiplied by millions.'},
  timeless:true,animated:true,graph:false,aspect:16/9,chChange:0.5,chReveal:1.5,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'face',lvl:'honors',noTrial:true,options:[{v:'face',l:'Face search'},{v:'link',l:'Name + birthday match'}],onChange:syncMode},
    {id:'quality',modes:F,label:'Probe image',type:'seg',def:'good',lvl:'bio',options:[{v:'good',l:'Clear, front-facing photo'},{v:'dim',l:'Poor lighting'},{v:'blur',l:'Blurry surveillance still'}]},
    {id:'thresh',modes:F,label:'Match threshold',type:'range',min:0.40,max:0.95,step:0.01,def:0.60,unit:'',d:2,lvl:'bio',help:'Scores at or above this count as a possible match. Or click the score chart.'},
    {id:'db',modes:F,label:'Photos in the database',type:'seg',def:'1000000',lvl:'bio',options:[{v:'1000',l:'1,000'},{v:'10000',l:'10,000'},{v:'100000',l:'100,000'},{v:'1000000',l:'1 million'},{v:'10000000',l:'10 million'}]},
    {id:'inDb',modes:F,label:'The person in the probe image is in the database',type:'toggle',def:true,lvl:'honors'},
    {id:'ans',modes:F,label:'Your answer: expected wrong people above the threshold',type:'range',min:0,max:100000,step:1,def:0,noTrial:true,lvl:'bio',help:'Photos ÷ the X in “1 in X.” Set your answer, then press Lock in my answer. The canvas buttons are quicker.'},
    {id:'nameK',modes:LK,label:'Records with the same full name',type:'seg',def:'1000',lvl:'bio',options:[{v:'10',l:'10'},{v:'100',l:'100'},{v:'1000',l:'1,000'},{v:'10000',l:'10,000'}],help:'In a nationwide background-check database, a common name can appear thousands of times.'},
    {id:'keys',modes:LK,label:'The system matches on',type:'seg',def:'namedob',lvl:'bio',options:[{v:'name',l:'Name only'},{v:'namedob',l:'Name + birth date'},{v:'namedobid',l:'Name + birth date + last 4 of an ID number'}]},
    {id:'span',modes:LK,label:'Birth years the records cover',type:'range',min:20,max:80,step:5,def:60,unit:' years',lvl:'honors',help:'More possible birth dates make a shared one less likely.'}
  ],
  actions:[
    {id:'lock',label:'Lock in my answer',primary:true,lvl:'bio',modes:F,run(sim){ytSubmit(sim,sim.p.ans);}},
    {id:'show',label:'Show the math',lvl:'bio',modes:F,run(sim){sim.st.revealed=true;}},
    {id:'hide',label:'New answer: hide the results',lvl:'bio',modes:F,run(sim){fresh(sim);}},
    {id:'again',label:'Run the search again',lvl:'bio',modes:F,run(sim){sim.seed=(sim.seed||1)+1;}}],
  init(sim){if(sim&&!sim.seed)sim.seed=1;return {ph:0,revealed:false,yt:null};},
  step(sim,dt){sim.st.ph+=dt;},
  onLevel(sim){if(!atLeast('honors')&&sim.p.mode==='link')BioLab.setValues(sim,{mode:'face'});syncMode(sim);},
  metrics:[
    {id:'fmr',modes:F,label:'False match rate (per comparison)',unit:'',lvl:'bio',text:true,get:s=>oneIn(face(s.p).fmr)},
    {id:'hits',modes:F,label:'Expected wrong people above the threshold',unit:'',lvl:'bio',min:0,max:null,d:2,get:s=>shown(s)?face(s.p).hits:null},
    {id:'topw',modes:F,label:'Chance the top candidate is the wrong person',unit:'%',lvl:'bio',min:0,max:100,d:1,get:s=>shown(s)?100*face(s.p).topWrong:null},
    {id:'tmr',modes:F,label:'Chance the real person clears the threshold',unit:'%',lvl:'honors',min:0,max:100,d:1,get:s=>100*face(s.p).tmr},
    {id:'anyw',modes:F,label:'Chance at least one wrong person clears it',unit:'%',lvl:'ap',min:0,max:100,d:2,get:s=>shown(s)?100*face(s.p).anyWrong:null},
    {id:'dp',modes:F,label:'Separation d′',unit:'',lvl:'ap',min:0,max:10,d:2,get:s=>face(s.p).dprime},
    {id:'lexp',modes:LK,label:'Expected other records that match you',unit:'',lvl:'bio',min:0,max:null,d:3,get:s=>link(s.p).exp},
    {id:'lany',modes:LK,label:'Chance at least one stranger matches you',unit:'%',lvl:'bio',min:0,max:100,d:2,get:s=>100*link(s.p).any}
  ],
  narrate(sim){const p=sim.p;
    if(p.mode==='link'){const L=link(p);
      if(p.keys==='name')return 'Matching on name alone, <b>every one</b> of the other '+fmtI(L.K-1)+' records with your name looks like you. Name alone is never enough.';
      if(p.keys==='namedob')return 'Each of the other '+fmtI(L.K-1)+' people with your name has about a 1 in '+fmtI(L.D)+' chance of sharing your exact birth date, so there is a <b>'+pct(L.any)+'</b> chance at least one record gets merged with yours. That is how, according to O’Neil (2016), one Arkansas woman was confused with another woman of the same name born on the same day.';
      return 'Adding the last 4 digits of an ID number divides the chance of a false merge by 10,000: now about '+pct(L.any)+'. One field that really differs between people does more than any number of fields that often repeat.';}
    const f=face(p),q=QUAL[p.quality].withA;
    if(!shown(sim)){const y=ytNow(sim);return (y&&y.tries.length?'<b>Not quite.</b> '+YT.hint+' ':'<b>Your turn:</b> ')+'the search compares the probe image with '+fmtI(f.N)+' photos, and each stranger clears the threshold about 1 time in '+fmtI(oneInX(f.fmr))+'. <b>How many wrong people do you expect above the threshold?</b> Click your answer under the chart.';}
    const vd=ytVerdict(sim),lead=vd?'<b>'+vd+'</b> ':'';
    if(!f.inDb)return lead+ 'The person is <b>not in the database</b>, but the search still returns its top-scoring candidates. Every one of them is the wrong person. '+(f.hits>=1?'About '+fmtHits(f.hits)+' of them clear the threshold.':'');
    if(f.hits>=1&&f.topWrong>0.5)return lead+'With '+q+', strangers’ scores spread out and overlap the real person’s. About <b>'+fmtHits(f.hits)+' wrong people</b> clear the threshold, and there is a '+pct(f.topWrong)+' chance the top candidate is not the person in the image.';
    if(f.hits>=1)return lead+'Each stranger has only a '+oneIn(f.fmr)+' chance of clearing the threshold, but there are '+fmtI(f.others)+' of them, so about <b>'+fmtHits(f.hits)+' wrong people</b> come back as possible matches. Tiny rates times big databases make real numbers.';
    return lead+'With '+q+' and '+fmtI(f.N)+' photos, about '+fmtHits(f.hits)+' wrong people are expected above the threshold. Grow the database or blur the image and watch that number climb.';},
  onClick(sim,x,y){if(sim.p.mode!=='face')return;if(!shown(sim)&&ytClick(sim,x,y))return;const P=plotBox();if(x>=P.x0&&x<=P.x1&&y>=P.y0-10&&y<=P.y1+10){const t=clamp(Math.round(((x-P.x0)/(P.x1-P.x0))*100)/100,0.40,0.95);BioLab.setValues(sim,{thresh:t});}},
  tour:[
    {title:'One photo against many',text:'Your phone checks your face against one saved face. A face search checks one <b>probe image</b> against every photo in a database, here 1 million, and gives each a similarity score.',focus:[[8,8,180,212],[196,8,596,220]],setup(sim){sim.seed=1;BioLab.setValues(sim,{mode:'face',quality:'good',thresh:0.6,db:'1000000',inDb:true});fresh(sim);}},
    {title:'Two piles of scores',text:'The green curve is the score the real person usually gets. The gray curve is everyone else. With a clear photo, the piles barely overlap.',focus:[196,8,596,220]},
    {title:'The threshold',text:'Scores at or above the threshold (the red line) count as possible matches. The sliver of gray past the line is too thin to see: each stranger clears it about 1 time in 100,000. That is the <b>false match rate</b>.',focus:[196,8,596,220]},
    {title:'Your turn',text:'The search compares the probe with 1,000,000 photos, and each stranger clears the threshold about 1 time in 100,000. <b>How many wrong people do you expect above the threshold?</b> Click your answer under the chart, or press Next to see the math.',focus:[8,232,784,212]},
    {title:'Tiny rates, big databases',text:'1,000,000 photos × 1/100,000 = about <b>10 wrong people</b> above the threshold, on every search. Here the top candidate is still usually the real person, but 10 strangers come back as possible matches too.',focus:[[196,8,596,220],[8,232,784,212]],setup(sim){sim.st.revealed=true;}},
    {title:'A blurry still',text:'Surveillance stills are often blurry, dark or at an angle. Both piles spread out and slide together. The false match rate jumps to about 1 in 120, so 1,000,000 ÷ 120 ≈ 8,300 strangers clear the same threshold (8,200 in the model, which uses the unrounded rate), and the top candidate is almost always the wrong person.',focus:[[8,8,180,212],[196,8,596,220]],setup(sim){BioLab.setValues(sim,{quality:'blur'});sim.st.revealed=true;}},
    {lvl:'honors',title:'Not in the database',text:'If the person is not in the database at all, the search still ranks the best-scoring strangers. Every candidate it returns is wrong.',focus:[8,232,784,212],setup(sim){BioLab.setValues(sim,{inDb:false});sim.st.revealed=true;}},
    {lvl:'honors',title:'Name and birthday',text:'Background checks often match people on name and birth date. With 1,000 records sharing your name, there is about a 4.5% chance one shares your birthday too, and its record gets merged with yours.',focus:[8,8,784,436],setup(sim){BioLab.setValues(sim,{mode:'link',nameK:'1000',keys:'namedob',span:60,inDb:true});}},
    {title:'A real case',text:'In Detroit, Robert Williams was arrested in 2020 after a face-recognition match and held about 30 hours. The 2024 settlement bars Detroit police from arresting people based on face recognition results alone. With this blurry still, how many wrong people clear the threshold, and what would you want checked before an arrest?',focus:[8,8,784,436],setup(sim){BioLab.setValues(sim,{mode:'face',quality:'blur',inDb:true});sim.st.revealed=true;}}
  ],
  onTourExit(sim){sim.seed=1;BioLab.setValues(sim,{mode:'face',quality:'good',thresh:0.6,db:'1000000',inDb:true,nameK:'1000',keys:'namedob',span:60});fresh(sim);},
  onChallenge(sim,ch){if(ch&&ch.set){sim.seed=1;BioLab.setValues(sim,ch.set);sim.st.revealed=true;}},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'face',quality:'good',thresh:0.6,db:'1000000',inDb:true},q:'A different system wrongly matches a stranger 1 time in 50,000. It searches 2,000,000 photos. About how many wrong people clear the threshold?',choices:['40','4','400','25,000'],correct:0,
     explain:'2,000,000 × 1/50,000 = 2,000,000 ÷ 50,000 = 40. A rate that sounds tiny is multiplied by every photo in the database, on every search.'},
    {lvl:'bio',instant:true,set:{mode:'face',quality:'blur',thresh:0.6,db:'1000000',inDb:true},q:'Same threshold and 1 million photos, but the probe is a blurry surveillance still. About how many wrong people clear the threshold now?',choices:['About 10','About 100','Thousands'],correct:2,
     explain:'Blur spreads strangers’ scores out, so many more land above the line. The false match rate jumps to about 1 in 120, and 1,000,000 ÷ 120 ≈ 8,300. The model, with the unrounded rate, gives about 8,200.'},
    {lvl:'honors',instant:true,set:{mode:'link',nameK:'1000',keys:'namedob',span:60},q:'A background check matches on name + birth date. 1,000 other records share your full name, and birth dates spread over 60 years. What is the chance at least one of them shares your exact birth date?',choices:['About 0.005%','About 4.5%','About 50%'],correct:1,
     explain:'60 × 365 = 21,900 possible birth dates. Each of 999 people has a 1 in 21,900 chance, so about 999 ÷ 21,900 ≈ 0.046 matches expected, a 4.5% chance of at least one. Across millions of background checks, that happens a lot.'},
    {lvl:'honors',instant:true,set:{mode:'face',quality:'blur',thresh:0.7,db:'1000000',inDb:true},q:'For the blurry still, an analyst raises the threshold from 0.60 to 0.70. What happens?',choices:['Fewer false hits, and the real person clears it less often','Fewer false hits and no downside','More false hits'],correct:0,
     explain:'False hits drop from about 8,200 to about 340, but the real person’s chance of clearing the threshold drops from 43% to 16%. With overlapping distributions, every threshold trades one error for the other.'},
    {lvl:'honors',instant:true,set:{mode:'face',quality:'good',thresh:0.6,db:'1000000',inDb:false},q:'The person in the probe image is not in the database. What does the search return?',choices:['Nothing','A ranked list of candidates, all of them wrong','The right person, ranked lower'],correct:1,
     explain:'A search always ranks the best scores it found. If the person is not in the database, every candidate is a stranger who happens to look similar to the system.'},
    {lvl:'honors',instant:true,set:{mode:'link',nameK:'1000',keys:'namedobid',span:60},q:'The system also requires the last 4 digits of an ID number to match. How does the chance of a false merge change?',choices:['It stays the same','It drops about 10,000 times','It drops about 4 times'],correct:1,
     explain:'There are 10,000 possible 4-digit endings. If they are spread evenly, a stranger with your name and birthday matches them only 1 time in 10,000, so the chance falls from about 4.5% to about 0.0005%.'},
    {lvl:'ap',instant:true,set:{mode:'face',quality:'good',thresh:0.6,db:'10000000',inDb:true},q:'The database grows from 1 million to 10 million photos at the same threshold. What happens to the expected number of false hits?',choices:['It stays about 10','It grows to about 100','It grows to about 1,000,000'],correct:1,
     explain:'Expected false hits = (N − 1) × FMR, which is linear in N: 10 times as many photos gives 10 times as many false hits, about 99.'},
    {lvl:'ap',instant:true,set:{mode:'face',quality:'good',thresh:0.6,db:'1000000',inDb:true},q:'With FMR = 1/100,000 and 1,000,000 strangers, what is the chance that at least one stranger clears the threshold?',choices:['About 10%','About 63%','Over 99.99%'],correct:2,
     explain:'P(none) = (1 − 10⁻⁵)<sup>10⁶</sup> ≈ e<sup>−10</sup> ≈ 0.000045, so P(at least one) ≈ 99.995%. On a search this size, some wrong person almost always clears the line.'},
    {lvl:'ap',instant:true,set:{mode:'face',quality:'dim',thresh:0.6,db:'1000000',inDb:true},q:'Why does poor lighting raise the false match rate so much more than it lowers the average stranger’s score difference?',choices:['The rate depends on the far tail, and widening a normal curve grows its tail very fast','Dark photos always score higher','The database gets bigger in the dark'],correct:0,
     explain:'FMR = Q((t − μ)/σ). For a clear photo, (0.60 − 0.30)/0.0703 ≈ 4.27 standard deviations: about 1 in 100,000. In poor lighting, (0.60 − 0.33)/0.085 ≈ 3.18: about 1 in 1,300, roughly 75 times more. Small changes in σ move far-tail areas by orders of magnitude.'}
  ],
  lab:{bio:'<p><b>Question:</b> When does a face search return the wrong people?</p><ol><li>Keep the threshold at 0.60. For each image quality, record the expected wrong people above the threshold at 1,000 and at 1 million photos.</li><li>For two of your settings, compute photos ÷ the X in “1 in X” by hand before you press <b>Show the math</b>.</li><li>Record the chance that the top candidate is the wrong person each time.</li></ol><p>Is a match enough to arrest someone? Use two numbers from your table.</p>',
       honors:'<p><b>Question:</b> How does the threshold trade one error for another?</p><ol><li>Choose the blurry still and 1 million photos.</li><li>For thresholds 0.50, 0.60, 0.70, 0.80 and 0.90, record the expected false hits and the chance the real person clears the threshold.</li><li>Graph both against the threshold.</li><li>Switch Activity to <b>Name + birthday match</b> and record the chance of a false merge for each name count.</li></ol><p>Explain why no threshold makes both errors small when the two score distributions overlap.</p>',
       ap:'<p><b>Question:</b> How do database size and image quality combine?</p><ol><li>For each quality, find the threshold where expected false hits in 1 million photos falls below 1. Record the real person’s match chance there.</li><li>Check one value by hand: hits = (N − 1) × Q((t − μ)/σ).</li><li>For record linkage, compute the false-merge chance by hand for 10,000 records with the same name over 60 years, then check it in the tool.</li></ol><p><b>Claim–evidence–reasoning:</b> Use the tail of a normal distribution to explain why a blurry still and a huge database together make a wrong top candidate likely.</p>'},
  terms:[{t:'Probe image',d:'The photo being searched for, such as a still from a security camera.'},
    {t:'Similarity score',d:'A number from 0 to 1 for how alike two faces look to the system.'},
    {t:'Threshold',d:'The score at or above which the system reports a possible match.'},
    {t:'False match',d:'A different person whose score clears the threshold.'},
    {t:'False match rate (FMR)',d:'The chance that one comparison with a stranger clears the threshold.'},
    {t:'1:1 vs. 1:N',d:'Verification checks one face against one saved face (phone unlock). Identification searches one face against N faces.'},
    {t:'Record linkage',d:'Deciding which records in different databases belong to the same person.'},
    {lvl:'honors',t:'False non-match',d:'The real person scores below the threshold and is missed.'},
    {lvl:'honors',t:'Investigative lead',d:'Something that tells investigators where to look next. It is not proof by itself.'},
    {lvl:'ap',t:'Order statistics',d:'The distribution of the highest, second-highest and other ranked values in a sample, used here for the top candidates.'},
    {lvl:'ap',t:'d′ (d-prime)',d:'How far apart two distributions are, measured in standard deviations: (μ₁ − μ₂)/σ.'}],
  about:'<p><b>The model.</b> Similarity scores for the true person (genuine) and for everyone else (impostors) are normal distributions. FMR = Q((t − μ<sub>i</sub>)/σ<sub>i</sub>); expected false hits = (N − 1) × FMR (N × FMR if the person is not in the database); P(at least one false hit) = 1 − (1 − FMR)<sup>N−1</sup>. The chance the top candidate is wrong is 1 − ∫ f<sub>genuine</sub>(s) F<sub>impostor</sub>(s)<sup>N−1</sup> ds. The five candidates shown are drawn from these distributions using order statistics. <b>All score distributions are assumptions for illustration</b>, not measurements of any real product: clear photo, genuine 0.78 ± 0.06 and impostor 0.30 ± 0.0703 (set so FMR ≈ 1 in 100,000 at 0.60); poor lighting 0.66 ± 0.10 and 0.33 ± 0.085; blurry still 0.58 ± 0.12 and 0.36 ± 0.10. Real systems, and their error rates for different groups of people, vary widely.</p>'+
    '<p><b>Record linkage.</b> Birth dates are assumed spread evenly over the years you set (365 per year), and ID digits evenly over 10,000 endings. Expected false merges = (K − 1)/D for name + birth date. According to O’Neil, <i>Weapons of Math Destruction</i> (2016), Chapter 8, an Arkansas woman named Catherine Taylor was confused with another Catherine Taylor, born on the same day, who had a drug charge.</p>'+
    '<p><b>Real cases.</b> Robert Williams was wrongfully arrested in Detroit in January 2020 after a face-recognition match and held about 30 hours. The 2024 settlement bars Detroit police from arresting people based on face recognition results alone and requires training and an audit (<a href="https://aclu.org/cases/williams-v-city-of-detroit-face-recognition-false-arrest" target="_blank" rel="noopener">ACLU</a>). Porcha Woodruff was arrested in February 2023, while eight months pregnant, in a case that used face recognition. Her lawsuit, which alleged wrongful arrest, was dismissed in August 2025, and her lawyers planned an appeal (<a href="https://www.michiganpublic.org/criminal-justice-legal-system/2025-09-05/woman-wrongly-accused-of-carjacking-loses-lawsuit-against-detroit-police-who-used-facial-tech" target="_blank" rel="noopener">Michigan Public, Sept. 5, 2025</a>); check for later developments.</p>'+
    '<p><b>Both sides.</b> Supporters say face searches can produce leads quickly when there is little else to go on. Critics point to wrongful arrests and argue the technology should be limited or banned. How to weigh these is a question of values; this tool does the math. Faces are abstract icons: no real photos are used.</p>',
  draw(sim,ctx,vdt,k){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='link'){drawLink(sim,ctx,k);return;}
    const f=face(p);
    /* probe image */
    ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,12,12,172,206,10);ctx.fill();ctx.stroke();
    txt(ctx,'Probe image',98,34,{s:13*k,w:700,a:'center'});
    ctx.save();ctx.beginPath();rr(ctx,30,44,136,130,8);ctx.clip();ctx.fillStyle='#5b6676';ctx.fillRect(30,44,136,130);
    if(p.quality==='blur')ctx.filter='blur(4px)';
    faceIcon(ctx,98,112,44,0,'#d8c7b4','#2b2f36');ctx.filter='none';
    if(p.quality==='dim'){ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(30,44,136,130);}
    if(p.quality==='blur'){ctx.fillStyle='rgba(90,100,115,0.25)';ctx.fillRect(30,44,136,130);}
    ctx.restore();
    txt(ctx,QUAL[p.quality].short,98,198,{s:13*k,a:'center',c:PAL['cv-soft']});
    /* score distributions */
    const P=plotBox(),X=s=>P.x0+s*(P.x1-P.x0),ymax=Math.max(phi(0)/f.si,f.inDb?phi(0)/f.sg:0)/0.64,Y=v=>P.y1-v/ymax*(P.y1-P.y0);
    const curve=(m,sd,col,fillA,from)=>{ctx.beginPath();let first=true;for(let i=0;i<=200;i++){const s=i/200;if(from!==undefined&&s<from)continue;const v=phi((s-m)/sd)/sd;first?ctx.moveTo(X(s),Y(v)):ctx.lineTo(X(s),Y(v));first=false;}
      if(fillA){ctx.lineTo(X(1),Y(0));ctx.lineTo(X(from||0),Y(0));ctx.closePath();ctx.globalAlpha=fillA;ctx.fillStyle=col;ctx.fill();ctx.globalAlpha=1;}else{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();}};
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(P.x0,P.y1+.5);ctx.lineTo(P.x1,P.y1+.5);ctx.stroke();
    for(let s=0.2;s<=1.001;s+=0.2){txt(ctx,s.toFixed(1),X(s),P.y1+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
    txt(ctx,'score',P.x0-14,P.y1+16*k,{s:12*k,a:'right',c:PAL['cv-soft'],w:700});
    curve(f.mi,f.si,PAL['muted'],0.35);curve(f.mi,f.si,PAL['cv-soft']);
    if(f.inDb){curve(f.mg,f.sg,PAL['s3'],0.25);curve(f.mg,f.sg,PAL['s3']);}
    curve(f.mi,f.si,PAL['s1'],0.9,f.t);
    const pk=v=>Y(v);
    txt(ctx,'everyone else',X(f.mi),pk(phi(0)/f.si)-8,{s:12*k,a:'center',c:PAL['cv-soft'],w:700});
    if(f.inDb)txt(ctx,'real person',X(f.mg)+(k>1.3?20:0),pk(phi(0)/f.sg)-8,{s:12*k,a:'center',c:PAL['s3'],w:700});
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X(f.t),P.y0+14);ctx.lineTo(X(f.t),P.y1);ctx.stroke();
    {const lab='threshold '+f.t.toFixed(2);ctx.font='700 '+(12*k)+'px '+BioLab.h.FONT;const w=ctx.measureText(lab).width;let right=f.inDb?f.t<f.mg:f.t>0.75;if(right&&X(f.t)-6-w<P.x0)right=false;if(!right&&X(f.t)+6+w>P.x1)right=true;
      txt(ctx,lab,X(f.t)+(right?-6:6),P.y0+12+6*k,{s:12*k,c:PAL['s1'],w:700,a:right?'right':'left'});}
    sim.vis.ytR=null;const big=k>1.3,XR=oneInX(f.fmr);
    if(!shown(sim)){/* Your turn: bare-number choices in place of the candidate list */
      const y0=ytNow(sim),retry=y0&&y0.tries.length,PT=232;ctx.fillStyle=PAL['card'];rr(ctx,12,PT,776,440-PT,12);ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();
      let y=PT+12+14*k;txt(ctx,'Your turn',28,y,{s:14*k,w:800});
      y+=10+13*k;txt(ctx,(big?'':'Photos searched: ')+fmtI(f.N)+(big?' photos · ':'     False match rate: ')+'1 in '+fmtI(XR),28,y,{s:13*k,w:700,c:PAL['s1']});
      y=wrap(ctx,retry?'Not quite. '+YT.hint+(big?'':' Pick again.'):(big?'How many wrong people above the threshold?':'How many wrong people do you expect above the threshold? Click your answer:'),28,y+10+12*k,744,{s:12*k,w:600,c:retry?PAL['s1']:PAL['cv-ink']});
      const ch=ytChoices(sim),gp=12,bw=(744-gp*3)/4,bh=Math.min(48,26*k+10),by=Math.min(y+4,440-10-bh);sim.vis.ytR=[];
      ch.forEach((v,i)=>{const bx=28+i*(bw+gp),tried=y0&&y0.tries.some(t=>Math.abs(t-v)<1e-12);ctx.fillStyle=PAL[tried?'card2':'cv-bg'];rr(ctx,bx,by,bw,bh,9);ctx.fill();ctx.strokeStyle=tried?PAL['line']:PAL['rj'];ctx.lineWidth=2;ctx.stroke();
        txt(ctx,YT.fmt(v),bx+bw/2,by+bh/2+1,{s:15*Math.min(k,1.5),w:800,a:'center',b:'middle',c:tried?PAL['cv-soft']:PAL['cv-ink']});if(!tried)sim.vis.ytR.push([bx,by,bw,bh,v]);});
      return;}
    /* the math with this search's numbers, then the candidates */
    const C=candidates(sim),fl=(big?'':'')+fmtI(f.N)+(big?' × 1/':' photos × 1/')+fmtI(XR)+' = '+fmtY(YT.ans(sim))+(big?' wrong people':' expected wrong people above the threshold');
    txt(ctx,fl,14,242+6*k,{s:14*k,w:800,c:PAL['s1']});
    const vd=ytVerdict(sim),yv=ytNow(sim);txt(ctx,vd?vd+(big?'':'  Top '+C.length+' candidates:'):'Top '+C.length+' candidates from '+fmtI(f.N)+' photos',14,248+22*k,{s:12*k,w:700,c:vd?(yv&&yv.ok?PAL['s3']:PAL['s1']):PAL['cv-ink']});
    const cw=150,gap=(800-24-5*cw)/4,cy=254+28*k,ch=440-cy;
    C.forEach((c,i)=>{const x=12+i*(cw+gap),above=c.s>=f.t;
      ctx.fillStyle=PAL['card'];rr(ctx,x,cy,cw,ch,8);ctx.fill();ctx.strokeStyle=above?PAL['s1']:PAL['line'];ctx.lineWidth=above?2.5:1;ctx.stroke();
      const fr=Math.min(24,ch*0.17);faceIcon(ctx,x+cw/2,cy+8+fr,fr,(c.id%4),PAL['muted'],PAL['cv-bg']);
      let ty=cy+16+2*fr+14*k;
      txt(ctx,c.real?'real person':'#'+c.id,x+cw/2,ty,{s:12*k,a:'center',w:c.real?800:400,c:c.real?PAL['s3']:PAL['cv-soft']});
      ty+=18*k;txt(ctx,(k<1.3?'score ':'')+c.s.toFixed(2),x+cw/2,ty,{s:14*k,a:'center',w:800});
      ty+=17*k;if(ty<438)txt(ctx,above?'match':'below line',x+cw/2,ty,{s:12*k,a:'center',w:700,c:above?PAL['s1']:PAL['cv-soft']});});},
  thumbSetup(sim){BioLab.setValues(sim,{quality:'blur'});}
};
function plotBox(){return {x0:258,x1:780,y0:22,y1:196};}
function drawLink(sim,ctx,k){const p=sim.p,L=link(p);
  const merged=p.keys!=='namedobid';
  const card=(x,title,variant,rows)=>{ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;rr(ctx,x,12,372,250,10);ctx.fill();ctx.stroke();
    faceIcon(ctx,x+34,48,22,variant,PAL['muted'],PAL['cv-bg']);txt(ctx,title,x+66,54,{s:15*k,w:700});
    let y=68;rows.forEach(r=>{y+=Math.max(30,24*k);txt(ctx,r[0]+': ',x+16,y,{s:13*k,c:PAL['cv-soft']});ctx.font='400 '+(13*k)+'px '+BioLab.h.FONT;const w=ctx.measureText(r[0]+': ').width;
      txt(ctx,r[1],x+16+w,y,{s:13*k,w:700,c:r[3]||PAL['cv-ink']});if(r[2])txt(ctx,r[2]==='x'?'✗':'✓',x+356,y,{s:15*k,w:800,c:r[2]==='x'?PAL['s1']:PAL['s3'],a:'right'});});};
  const usesN=true,usesD=p.keys!=='name',usesI=p.keys==='namedobid';
  card(12,'You',1,[['Name','Jordan Ellis',usesN],['Born','Mar 14, 2009',usesD],['ID ends','4417',usesI?'x':false],['Record',merged?'drug charge (merged)':'none',false,merged?PAL['s1']:PAL['s3']]]);
  card(416,'Another record',2,[['Name','Jordan Ellis',usesN],['Born',usesD?'Mar 14, 2009':'Sep 2, 1987',usesD],['ID ends','9032',usesI?'x':false],['Record','drug charge',false]]);
  pill(ctx,merged?'System decides: same person. Records merged.':'System decides: different people.',400,290,merged?'#b3261e':'#1d7a46','#ffffff',13*Math.min(k,1.4));
  let y=322+4*k;const g=27*k;
  txt(ctx,'Records with your full name: '+fmtI(L.K),24,y,{s:13*k});y+=g;
  txt(ctx,p.keys==='name'?'Name only: every one of them looks like you':'Chance one shares your '+(usesI?'birth date and ID digits':'birth date')+': 1 in '+fmtI(1/L.pk),24,y,{s:13*k});y+=g;
  txt(ctx,'Chance at least one stranger matches you: '+pct(L.any),24,y,{s:14*k,w:800,c:L.any>0.01?PAL['s1']:PAL['cv-ink']});}
BioLab.register(SIM);

BioLab.addPractical({facematch:{
 hook:'Your phone’s face unlock compares your face with one saved face (1:1). Suppose it would let a stranger in 1 time in 100,000. A police face search compares one photo with 1,000,000 photos (1:N) at that same rate. How many wrong people come back as possible matches?',
 answer:'On your phone, one stranger has a 1 in 100,000 chance. In the search, 1,000,000 × 1/100,000 = 10 wrong people clear the threshold on every search. With a blurry surveillance still, the rate in this model jumps to about 1 in 120: about 8,200 wrong people clear the same threshold, and the top candidate is almost always the wrong person.',
 uses:['Your phone: face unlock is a 1:1 check, one face against one saved face, so a tiny false match rate stays tiny.','Background checks for a first job or an apartment: records are often matched on name and birth date. With 1,000 other records sharing your name over 60 years of birth dates, 999 ÷ 21,900 ≈ 0.046 matches are expected, about a 4.5% chance that one is merged with yours.','Detroit: Robert Williams was arrested in 2020 after a face-recognition match and held about 30 hours. The 2024 settlement bars Detroit police from arresting people based on face recognition results alone.'],
 takeaway:'Expected false matches = photos searched × false match rate. A rate that sounds tiny, times a huge database, is a real number of wrong people.'}});

BioLab.addReview({facematch:{questions:[
 {id:'ten',kind:'test',lvl:'bio',q:'A face search wrongly matches a stranger 1 time in 100,000. It searches 10,000,000 photos. About how many wrong people clear the threshold?',num:{ans:100,tol:2,unit:'people'},
  steps:['Expected false matches = photos × false match rate.','10,000,000 × 1/100,000 = 10,000,000 ÷ 100,000 = 100.','The model, with its unrounded rate, gives about 99.'],
  lab:{set:{mode:'face',quality:'good',thresh:0.6,db:'10000000',inDb:true},act:'show',look:'Read <b>Expected wrong people above the threshold</b>.'},verify:[['hits',98.87,0.05]]},
 {id:'blur',kind:'real',lvl:'bio',q:'The probe is a blurry surveillance still. The false match rate at threshold 0.60 is about 1 in 120, and the search covers 1,000,000 photos. To the nearest hundred, how many wrong people clear the threshold?',num:{ans:8300,tol:150,unit:'people'},
  steps:['1,000,000 × 1/120 = 1,000,000 ÷ 120 ≈ 8,333.','About 8,300. The model uses the unrounded rate and gives about 8,200.','Either way, thousands of strangers clear the line, so the top candidate is almost always the wrong person.'],
  lab:{set:{mode:'face',quality:'blur',thresh:0.6,db:'1000000',inDb:true},act:'show',look:'Read <b>Expected wrong people above the threshold</b> and <b>Chance the top candidate is the wrong person</b>.'},verify:[['hits',8197.5,1],['topw',98.53,0.05]]},
 {id:'bday',kind:'real',lvl:'honors',q:'A background check matches on name + birth date. 1,000 other records share your name, with birth dates spread over 60 years. How many of them do you expect to share your birth date? Round to 0.001.',num:{ans:0.046,tol:0.001,unit:''},
  steps:['Possible birth dates: 60 × 365 = 21,900.','Other records: 999. Each matches with chance 1/21,900.','Expected matches: 999 ÷ 21,900 ≈ 0.046, so about a 4.5% chance that at least one does.'],
  lab:{set:{mode:'link',nameK:'1000',keys:'namedob',span:60},look:'Read <b>Expected other records that match you</b> and <b>Chance at least one stranger matches you</b>.'},verify:[['lexp',0.0456,0.0001],['lany',4.459,0.005]]},
 {id:'thresh',kind:'test',lvl:'honors',q:'For a blurry still, raising the threshold from 0.60 to 0.70 cuts the false hits from about 8,200 to about 340. What is the cost?',choices:['The real person clears the threshold less often: 43% → 16%','There is no cost','The database gets smaller','More strangers clear it'],correct:0,
  steps:['The real person’s scores and strangers’ scores overlap for a blurry still.','A higher line removes strangers and some of the real person’s scores too.','Every threshold trades false matches for missed matches.'],
  lab:{set:{mode:'face',quality:'blur',thresh:0.7,db:'1000000',inDb:true},act:'show',look:'Read <b>Expected wrong people</b> and <b>Chance the real person clears the threshold</b>.'},verify:[['hits',336.9,0.5],['tmr',15.87,0.05]]},
 {id:'any',kind:'test',lvl:'ap',q:'With a false match rate of 1/100,000 and 1,000,000 strangers, what is the chance that at least one stranger clears the threshold? Give a percent to 2 decimal places.',num:{ans:99.995,tol:0.01,unit:'%'},
  steps:['P(no stranger clears it) = (1 − 10⁻⁵)<sup>1,000,000</sup> ≈ e<sup>−10</sup> ≈ 0.0000454.','P(at least one) = 1 − 0.0000454 ≈ 99.995%.','The model’s rate is slightly below 1/100,000, so it shows about 99.995% too.'],
  lab:{set:{mode:'face',quality:'good',thresh:0.6,db:'1000000',inDb:true},act:'show',look:'Read <b>Chance at least one wrong person clears it</b>.'},verify:[['anyw',99.995,0.001]]},
 {id:'id4',kind:'real',lvl:'ap',q:'Adding the last 4 digits of an ID number to name + birth date divides the chance of a false merge by about what number?',num:{ans:10000,tol:1,unit:''},
  steps:['There are 10,000 possible 4-digit endings (0000 to 9999).','If endings are spread evenly, a stranger who shares your name and birthday matches yours 1 time in 10,000.','So the false-merge chance falls from about 4.5% to about 0.0005%.']}
]}});
})();

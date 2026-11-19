/* ForensicsLab Learn it, digital forensics tools (Nov 18, 2026): recovery, passwords, phishing, stego, binary, internet,
   pubkey, risk, firewall, logs. Same shape as BioLab/ChemLab/PhysLab learn-more.js: each step replays the tool's own
   walkthrough setups (captured below before Learn it replaces the tour), keeps the tour's focus box, and adds live number
   cards from the tool's metrics. Plus 7 Test yourself why questions per tool (none of these tools had any).
   These tools teach defense and how digital evidence works, never attack steps. */
(function(){
'use strict';
/* ---- shared helpers for learn-more.js (copied into each site's file) ---- */
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TS=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s&&s.setup?s.setup:null;};
const tour=(id,title)=>sim=>{const f=TS(id,title);if(f)f(sim);};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
/* formatted metric: "label: value unit" or just value */
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&!/^\(|^of |^\(/.test(u)&&u.length<14?' '+u:'');};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* card: word-wrapped rows. pos: [x,y] top-left, or {x,y,w,up} */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* red ring around the part of the picture that matters in this step */
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const kk=(sim.lnKey||'')+':'+key;if(tau>=t&&!sim._at[kk]){sim._at[kk]=1;fn(sim);}};
const atReset=sim=>{sim._at={};};
/* replay the named tour steps' setups, in order, so a step rebuilds the tour's state from scratch */
const TSTEP=(id,title)=>(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});
const seq=(id,...titles)=>sim=>{titles.forEach(t=>{const s=TSTEP(id,t);if(s&&s.setup)s.setup(sim);});};
const foc=(id,title)=>{const s=TSTEP(id,title);return s?s.focus:null;};
/* run one of the tool's own buttons (actions) */
const act=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a&&a.run)a.run(sim);};
/* the tool's metric for a hypothetical setting, without touching the live sim (for graph steps) */
const metAt=(sim,id,p,st)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get({def:sim.def,p:Object.assign({},sim.p,p),st:st||{},vis:{},t:0});}catch(e){return NaN;}};
const L={},R={};
/* ---------- recovery (deleted file recovery) ---------- */
const rcCard=(ctx,k,LH,rows)=>card(ctx,k,452,LH-12,336,rows,{up:true});
const rcG=['A drive is a grid','The file table','Deleting only changes','Using the drive overwrites'];
/* % of the case's deleted evidence still on the drive after d days of use (the tool's own case drive) */
function rcCurve(sim){if(sim._rc)return sim._rc;const o={};[['h50',50,'hdd'],['h90',90,'hdd'],['s50',50,'ssd']].forEach(([key,fill,media])=>{o[key]=[];for(let d=0;d<=30;d++)o[key].push(metAt(sim,'ondrive',{mode:'case',days:d,fill,media}));});return sim._rc=o;}
L.recovery={
  goals:{
    bio:['How a drive stores a file in clusters, listed in a file table','Why deleting a file leaves its data on the drive','How using the drive overwrites deleted data','Why only overwriting with zeros truly erases a drive'],
    honors:['How file-table recovery differs from carving for signatures','Why a fuller drive loses deleted data faster','Why SSDs with TRIM erase deleted files on their own'],
    ap:['What slack space holds, and why it survives','How hex views and file signatures identify data without names']},
  matters:'Deleted photos, texts and files come back in court cases every week, and the same facts decide what happens to the data on a phone or laptop you sell or give away. Knowing what deleting really does protects you and explains how investigators work.',
  steps:[
    {key:'grid',title:'A drive is a grid of clusters',run:seq('recovery',...rcG.slice(0,1)),pause:true,focus:foc('recovery','A drive is a grid'),
     see:'A USB drive drawn as a grid. Each square is one <b>cluster</b>, a 4 KB block of storage. The letters and colors show which file each cluster belongs to.',
     why:'A file takes as many clusters as it needs, wherever there is room.'},
    {key:'table',title:'The file table',run:seq('recovery',...rcG.slice(0,2)),pause:true,focus:foc('recovery','The file table'),
     see:'Beside the drive is the <b>file table</b>: every file’s name, size and clusters, like a book’s table of contents.',
     why:'To show you your files, the computer reads only this table. It never looks at the clusters themselves.'},
    {key:'del',title:'Deleting only changes the table',run:seq('recovery',...rcG.slice(0,3)),pause:true,focus:foc('recovery','Deleting only changes'),
     see:'vacation.jpg is deleted. Its table entry now says deleted, and its clusters turn striped: marked free. The photo’s bytes are still there.',
     why:'Deleting tears the page out of the table of contents, not out of the book. Nothing was erased.'},
    {key:'use',title:'Using the drive overwrites free space',run:seq('recovery',...rcG),pause:true,focus:foc('recovery','Using the drive overwrites'),
     see:'Six days of normal use. New temporary files land in free clusters, including some of the deleted photo’s.',
     why:'Free means “OK to reuse.” Each reused cluster loses the old data for good, so investigators copy a drive as soon as they can.',
     overlay(sim,ctx,LH,k){if(k<1.15)rcCard(ctx,k,LH,[[FL(sim,'remn',0),{w:700}],[FL(sim,'recov',0)]]);}},   /* phones: the longer file table fills that corner */
    {key:'tbl',title:'Recovering from the file table',run:seq('recovery',...rcG,'Recovering from the file table'),pause:true,focus:foc('recovery','Recovering from the file table'),
     see:'Recovery follows each deleted entry’s cluster list. Clusters that still hold the file come back, with the original name.',
     why:'Overwritten clusters come back as junk. A file is only whole if every one of its clusters survived.'},
    {key:'carve',title:'Carving for signatures',run:seq('recovery',...rcG,'Carving for signatures'),pause:true,focus:foc('recovery','Carving for signatures'),
     see:'Carving ignores the table. It scans free space for the bytes every file type starts with, like FF D8 FF for a JPEG photo.',
     why:'So photos can survive even when the table is wiped. Carved files come back without their names.'},
    {key:'days',title:'How long deleted evidence lasts',set:{mode:'case',days:1,fill:50,media:'hdd'},fresh:true,pause:true,
     see:{bio:'The case drive, graphed: how much deleted evidence is still on it after each day of use. Green: half full. Red: nearly full.',
          honors:'The case drive, graphed: deleted evidence left after each day of use. Green: half full. Red: nearly full. Dashed: an SSD with TRIM.'},
     why:'Nothing is lost until new files need the space. A fuller drive has fewer free clusters, so it reuses the deleted ones sooner.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,c=rcCurve(sim),p=tau%12,B={x0:120,x1:740,y0:70,y1:Math.min(LH-90,400)},xr=[0,30],hon=(H.level||'bio')!=='bio';K.dim(ctx,LH);
       K.axes(ctx,B,k,{xr,xt:[[0,'0'],[5,'5'],[10,'10'],[15,'15'],[20,'20'],[25,'25'],[30,'30']],yt:[[0,'0%'],[0.5,'50%'],[1,'100%']],xl:'Days the drive was used after the delete',yl:'Evidence still on the drive'});
       const f=a=>t=>{const i=Math.floor(t),j=Math.min(30,i+1),u=t-i;return ((a[i]||0)*(1-u)+(a[j]||0)*u)/100;};const to=Math.min(30,p*6);
       K.curve(ctx,B,xr,f(c.h50),to,GREEN);K.curve(ctx,B,xr,f(c.h90),to,RED);if(hon)K.curve(ctx,B,xr,f(c.s50),to,BLUE,[8,6]);
       if(p>=5.2)K.tagA(ctx,hon?'Green: half full · Red: nearly full · Dashed: SSD with TRIM':'Green: half full · Red: nearly full',B.x0,B.y0-34,k,{s:12.5},'l');}},
    {key:'quick',title:'Your question: does a quick format work?',set:{mode:'erase',method:'quick'},fresh:true,pause:true,run:sim=>{act(sim,'table');act(sim,'carve');},
     see:'The same drive a day after a quick format, with both recovery tools run. Read the card.',
     why:'A quick format writes a new, empty file table, so table recovery finds nothing. The data is untouched, and carving brings most photos back, minus their names.',
     overlay(sim,ctx,LH,k){rcCard(ctx,k,LH,[['Quick format',{w:800}],['Evidence still on the drive: '+F(sim,'ondrive',0)],['Found with the file table: '+F(sim,'ptable',0)],['Found by carving: '+F(sim,'pcarve',0),{w:800,c:RED}]]);}},
    {key:'full',title:'Only zeros erase it',set:{mode:'erase',method:'full'},fresh:true,pause:true,run:sim=>{act(sim,'table');act(sim,'carve');},
     see:'Now a full format, which writes zeros over every cluster.',
     why:'Zeros replace the bytes themselves, so nothing is left to find. One pass is enough on a modern drive.',
     so:'Before you give a drive away, full-format it. For a phone, use factory reset.',
     overlay(sim,ctx,LH,k){rcCard(ctx,k,LH,[['Full format (zeros)',{w:800}],['Evidence still on the drive: '+F(sim,'ondrive',0),{w:800,c:GREEN}],['Found by carving: '+F(sim,'pcarve',0)]]);}},
    {key:'ssd',lvl:'honors',title:'SSDs with TRIM are different',run:seq('recovery',...rcG,'SSDs with TRIM'),pause:true,focus:foc('recovery','SSDs with TRIM'),
     see:'The same delete on an SSD. Its blocks read back as zeros.',
     why:'With <b>TRIM</b>, the computer tells the SSD which blocks were freed, and the drive erases them in the background, usually within minutes.'},
    {key:'slack',lvl:'ap',title:'Slack space',run:seq('recovery','Slack space'),pause:true,focus:foc('recovery','Slack space'),
     see:'The case drive at day 14. Squares with a striped strip along the bottom still hold old bytes in their slack.',
     why:'A file rarely fills its last cluster. The unused end, the <b>slack</b>, keeps whatever was there before, even after the clusters are reused.'}
  ],
  useIt:[
    {do:'Before you sell or give away a phone, use Erase All Content and Settings (iPhone) or a factory reset (Android).',why:'Modern phones encrypt everything, and the reset destroys the key, which works like writing zeros: deleting photos one by one would leave them recoverable.'},
    {do:'If you delete something by mistake, stop using the drive and run a recovery tool from a different drive.',why:'The data stays until new files reuse its clusters, so every new file you save shrinks your chances.'},
    {do:'Check a Recently Deleted folder before you assume a photo or file is gone.',why:'Phones and cloud services keep deleted items for about 30 days. Deleting in one place rarely deletes it everywhere.'}],
  tryIt:[{title:'the table-of-contents drive (10 minutes)',steps:['Write a short story on numbered index cards, one sentence per card, and make a “table” card listing which cards hold it.','“Delete” it by crossing it off the table only. Hand the stack to a friend and ask them to find the story.','Then reuse a few cards for a new story and try again.'],look:'The story is easy to rebuild until its cards are reused: exactly how deleted files work.'}]
};
R.recovery={questions:[
  {id:'deldo',kind:'test',lvl:'bio',q:'What does deleting a file actually change on a USB drive?',choices:['It writes zeros over every cluster the file used','It marks the file’s entry and clusters as free in the table','It moves the file into a hidden part of the drive','It shrinks the file until it takes up no space on the drive'],correct:1,
   steps:['The computer finds files through the file table.','Deleting marks the entry deleted and its clusters free.','The bytes stay until something new is written over them.']},
  {id:'stop',kind:'real',lvl:'bio',q:'You deleted an important photo by mistake. What should you do first?',choices:['Keep using the drive so the photo gets backed up','Stop saving anything to that drive','Delete more files so the photo has room','Quick-format the drive to reset the table'],correct:1,
   steps:['The photo is still there until its clusters are reused.','Every new file could land on those clusters.','So stop writing to the drive, then recover it from another drive.']},
  {id:'quickq',kind:'test',lvl:'bio',q:'A suspect quick-formats a USB stick full of photos. What can investigators still get back?',choices:['Nothing, because the photos are erased','Most photos, by carving free space, but without names','Only the photo names, since the old table survives the format','Every photo with its name, from the old table'],correct:1,
   steps:['A quick format only writes a new, empty file table.','The photos’ bytes are untouched.','Carving finds them by their starting bytes, but the names were in the old table.']},
  {id:'full',kind:'test',lvl:'bio',q:'Which way of erasing leaves 0% of the deleted photos to recover?',choices:['Deleting each photo','A quick format','A full format that writes zeros','Emptying the recycle bin right after'],correct:2,
   steps:['Deleting and quick formats change only the table.','A full format writes zeros over every cluster.','With the bytes replaced, there is nothing left to carve.']},
  {id:'fuller',kind:'test',lvl:'honors',q:'Two drives get the same use after a delete. One is half full and one is nearly full. Which loses the deleted evidence sooner?',choices:['The half-full drive','The nearly full drive','Both at the same time','Neither, since use never overwrites deleted data'],correct:1,
   steps:['New files go into free clusters.','A nearly full drive has few free clusters besides the deleted ones.','So it reuses them sooner, and the evidence is overwritten faster.']},
  {id:'ssd',kind:'test',lvl:'honors',q:'Why do deleted files on an SSD with TRIM usually read back as zeros within minutes?',choices:['SSDs store files in the cloud, not on the drive','TRIM tells the drive which blocks are free, and it erases them','SSDs never keep a file table at all','The SSD encrypts every deleted file with a brand-new secret key'],correct:1,
   steps:['The computer sends TRIM listing the freed blocks.','The SSD erases those blocks in the background to stay fast.','So the deleted data is gone soon after the delete.']},
  {id:'clusters',kind:'test',lvl:'ap',q:'A 19,000-byte photo is saved on a drive with 4,096-byte clusters. How many bytes of slack does its last cluster have?',num:{ans:1480,tol:2,unit:'bytes'},
   steps:['19,000 ÷ 4,096 = 4.64, so the photo needs 5 clusters.','5 × 4,096 = 20,480 bytes of space.','20,480 − 19,000 = 1,480 bytes of slack.']}
]};
/* ---------- passwords (passwords and hashing) ---------- */
/* the time bars already show these numbers; on phones the card would cover them, so it is desktop-only */
const pwCard=(ctx,k,LH,rows)=>{if(k<1.15)card(ctx,k,12,LH-6,440,rows,{up:true});};
const pwG=['Every character comes from a pool','Length multiplies the guesses','Patterns give passwords away','Three kinds of attack'];
L.passwords={
  goals:{
    bio:['How the size of the character pool and the length set the number of guesses','Why patterns like a word plus a year are weak, whatever the meter says','Why stolen password hashes can be guessed offline, with no lockout','Why a site’s choice of hash, and a salt, protect you'],
    honors:['How multi-factor authentication stops a stolen password from signing in','Why a passphrase of random words beats a short “complex” password'],
    ap:['How entropy in bits, L × log₂N, counts the guesses','Why each extra bit doubles an attacker’s work']},
  matters:'Every few weeks a company announces that its password database was stolen. What happens next to your account depends on two things you can control, a long random password and multi-factor authentication, and one you can’t: how the site stored it.',
  steps:[
    {key:'pool',title:'Every character comes from a pool',run:seq('passwords',...pwG.slice(0,1)),pause:true,focus:foc('passwords','Every character'),
     see:'A made-up password, one box per character, colored by kind: lowercase, uppercase, digit or symbol.',
     why:{bio:'The <b>pool</b> is how many characters each box could be: 26 with lowercase only, 95 with all four kinds. Each box multiplies the guesses by the pool.',
          ap:'The pool N is the characters each box could be (26 to 95). A random password of length L has L × log₂N bits of <b>entropy</b>; each bit doubles the guesses.'}},
    {key:'len',title:'Length multiplies the guesses',run:seq('passwords',...pwG.slice(0,2)),pause:true,focus:foc('passwords','Length multiplies'),
     see:'Twelve random lowercase letters instead of eight. Read the time bars.',
     why:'Each extra letter multiplies the guesses by 26. Eight letters fall in about 21 seconds to a fast offline attack; twelve take about 110 days.',
     overlay(sim,ctx,LH,k){pwCard(ctx,k,LH,[['This password: '+F(sim,'len',0)+', pool of '+F(sim,'pool',0)],['Offline, fast hash: '+F(sim,'tfast'),{w:800,c:RED}]]);}},
    {key:'graph',title:'The length graph',set:{mode:'test',ex:'low12'},fresh:true,pause:true,
     see:'Time to try every possibility against a fast hash, by length. Blue: lowercase only. Red: all four kinds.',
     why:'Each character multiplies the time, so the lines climb steeply. The dot is Sunshine2024!: 13 characters, cracked instantly because of its pattern.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,p=tau%12,B={x0:150,x1:740,y0:60,y1:Math.min(LH-90,400)},xr=[4,16],yr=[-3,18];K.dim(ctx,LH);
       const ly=t=>(Math.log10(Math.max(t,1e-3))-yr[0])/(yr[1]-yr[0]),tim=(n,N)=>Math.pow(N,n)/1e10;
       K.axes(ctx,B,k,{xr,xt:[[4,'4'],[6,'6'],[8,'8'],[10,'10'],[12,'12'],[14,'14'],[16,'16']],yt:[[ly(1),'1 second'],[ly(3600),'1 hour'],[ly(3.15e7),'1 year'],[ly(3.15e10),'1,000 years'],[ly(4.35e17),'age of universe']],xl:'Length (random characters)',yl:'Time to crack',ylOff:96});
       const to=4+Math.min(12,p*3);K.curve(ctx,B,xr,n=>ly(tim(n,26)),to,BLUE);K.curve(ctx,B,xr,n=>ly(tim(n,95)),to,RED);
       if(p>=4.2){K.tagA(ctx,'Lowercase only (26)',K.X(B,xr,16)-4,K.Y(B,ly(tim(14,26)))+44,k,{s:12.5,c:BLUE},'r');K.tagA(ctx,'All four kinds (95)',K.X(B,xr,4.4),K.Y(B,ly(tim(8.6,95)))-22,k,{s:12.5,c:RED},'l');}
       if(p>=5.5){const x=K.X(B,xr,13),y=K.Y(B,ly(1e-3));K.dot(ctx,x,y,'#c8102e',8);K.tagA(ctx,'Sunshine2024!: instantly',x-12,y-22,k,{s:12.5,hi:true},'r');}}},
    {key:'pat',title:'Patterns give passwords away',run:seq('passwords',...pwG.slice(0,3)),pause:true,focus:foc('passwords','Patterns give'),
     see:'Sunshine2024! has 13 characters of all four kinds, yet the meter says very weak.',
     why:'It is a common word, a capital, a year and a symbol: the pattern attackers try first. The strength that counts is the pattern-aware one, not the pool.'},
    {key:'atk',title:'Three kinds of attack',run:seq('passwords',...pwG),pause:true,focus:foc('passwords','Three kinds of attack'),
     see:'Three bars for three kinds of attack. Online, the site locks the account after a few wrong tries.',
     why:'Offline, attackers have the stolen hashes and guess with no lockout. A slow hash like bcrypt makes each guess about a million times slower.'},
    {key:'phrase',title:'Your question: Sunshine2024! or five random words?',run:seq('passwords',...pwG,'Passphrases'),pause:true,focus:foc('passwords','Passphrases'),
     see:'Five random words, like “maple orbit candle river lantern.”',
     why:'An attacker must try every combination of words, about 2⁵⁵ guesses: around 57 days on a fast hash, over 150,000 years on a slow one.',
     so:'Five random words win, and are easier to remember.',
     overlay(sim,ctx,LH,k){pwCard(ctx,k,LH,[['Five random words, fast hash: '+F(sim,'tfast'),{w:700}],['Slow hash: '+F(sim,'tslow'),{w:800,c:GREEN}]]);}},
    {key:'mfa',lvl:'honors',title:'MFA blocks a stolen password',run:seq('passwords','MFA blocks'),pause:true,focus:foc('passwords','MFA blocks'),
     see:'The same weak password, but the account has <b>multi-factor authentication</b> (MFA). The online bar now says blocked.',
     why:'Signing in also needs your phone or security key, so a guessed password alone fails. Offline cracking can still reveal it, so never reuse a password.'},
    {key:'same',title:'Investigate: identical hashes',run:seq('passwords','Investigate: identical hashes'),pause:true,focus:foc('passwords','Investigate: identical'),
     see:'A fictional pet store’s stolen customer table. Each password was saved as a SHA-256 hash. Brackets join matching values.',
     why:'The same password always gives the same <b>hash</b>. One right guess unlocks every account that shares it, and one guess tests every account at once.'},
    {key:'salt',title:'A salt makes every hash different',run:seq('passwords','Investigate: identical hashes','A salt makes'),pause:true,focus:foc('passwords','A salt makes'),
     see:'Each password got a random <b>salt</b> mixed in before hashing. Now no two stored values match.',
     why:'Shared passwords no longer show, and attackers must test each guess one account at a time. Good sites use a salt and a slow hash.'}
  ],
  useIt:[
    {do:'Make your next password five or six random words, and use a password manager for the rest.',why:'Length from random words gives far more guesses than a short password with symbols, and a manager lets every site have its own.'},
    {do:'Turn on multi-factor authentication for your school, email and gaming accounts.',why:'Even if your password is stolen or guessed, signing in also needs your phone or key.'},
    {do:'When a site you use announces a breach, change that password and any account where you reused it.',why:'Stolen hashes are cracked offline with no lockout, and one cracked password unlocks every account that shares it.'}],
  tryIt:[{title:'count the guesses (10 minutes)',steps:['Pick a 2-digit code. A friend guesses one code per second while you time them.','Now pick a 3-digit code and estimate the time before they start.','Try a 2-letter code (26 × 26 choices).'],look:'Each extra digit multiplies the work by 10, each letter by 26: length matters more than you expect.'}]
};
R.passwords={questions:[
  {id:'pool',kind:'test',lvl:'bio',q:'A password uses only lowercase letters. How many choices does an attacker have for each character?',num:{ans:26,tol:0,unit:'choices'},
   steps:['The pool is every character that could go in one box.','Lowercase only means the 26 letters a to z.','So each character multiplies the guesses by 26.']},
  {id:'longer',kind:'test',lvl:'bio',q:'You add four more random lowercase letters to an 8-letter password. What happens to the number of guesses?',choices:['It goes up by 4, one for each new letter','It is multiplied by 26 four times, about 457,000','It doubles, since the password is longer','It stays the same, since the pool did not change'],correct:1,
   steps:['Each new letter can be any of 26.','So each multiplies the guesses by 26.','26 × 26 × 26 × 26 ≈ 457,000 times as many guesses.']},
  {id:'season',kind:'test',lvl:'bio',q:'Why is “Sunshine2024!” weak even though it has all four kinds of character?',choices:['It is too long for most websites to store safely in a database','It is a common word, a capital, a year and a symbol','Symbols make a password easier to crack','It has no lowercase letters'],correct:1,
   steps:['Attackers try common words first.','Then they add a capital, a recent year and a symbol, in that order.','The pattern makes it fall far faster than its pool suggests.']},
  {id:'offline',kind:'test',lvl:'bio',q:'Why is an offline attack on stolen hashes so much faster than guessing at a login page?',choices:['There is no lockout, so guesses go as fast as the computer allows','The stolen hashes include the passwords in plain text','Offline attacks only need to guess the first letter','Websites send the attacker a hint after each wrong guess, so it narrows'],correct:0,
   steps:['Online, the site locks the account after a few wrong tries.','Offline, the attacker has the hashes on their own computer.','They can test billions of guesses a second against a fast hash.']},
  {id:'mfa',kind:'real',lvl:'honors',q:'Your password leaks in a breach, but your account has MFA. What stops someone from signing in?',choices:['They also need your phone or security key','MFA changes your password every day','MFA hides your username from the site','The site deletes leaked passwords automatically'],correct:0,
   steps:['MFA asks for a second factor after the password.','That factor is something you have, like your phone or a key.','A stolen password alone is not enough to sign in.']},
  {id:'salt',kind:'test',lvl:'bio',q:'Two customers chose the same password. With a salt added before hashing, what does the stolen table show?',choices:['Two matching stored values','Two different stored values','Both passwords in plain text','No values at all for those two'],correct:1,
   steps:['A salt is a random value, different for every account.','It is mixed into the password before hashing.','So the same password gives a different stored value for each account.']},
  {id:'bits',kind:'test',lvl:'ap',q:'A random password has 8 characters from a pool of 64. How many bits of entropy does it have?',num:{ans:48,tol:0,unit:'bits'},
   steps:['Entropy = L × log₂N.','log₂ 64 = 6, since 2⁶ = 64.','8 × 6 = 48 bits, or 2⁴⁸ possible passwords.']}
]};
/* ---------- phishing (phishing analysis) ---------- */
const phG=['An inbox of fictional emails','The display name can say anything','Hover to see where a link really goes','Pressure is a clue'];
L.phishing={
  goals:{
    bio:['Why a display name proves nothing, and where the real sender’s domain is','How to read where a link really goes, from the right','Which kinds of wording and attachments are warning signs','What a real security alert looks like'],
    honors:['How look-alike domains and subdomains fool readers','How to weigh several small clues instead of one'],
    ap:['How SPF, DKIM and DMARC results in the headers reveal a forged sender','How investigators line up email, web and sign-in logs into one timeline']},
  matters:'Most break-ins at schools and companies start with one email that someone trusted. The checks in this tool take a few seconds, and they are the same ones investigators use afterward to work out what happened.',
  steps:[
    {key:'inbox',title:'An inbox of fictional emails',run:seq('phishing',...phG.slice(0,1)),pause:true,focus:foc('phishing','An inbox'),
     see:'Ten fictional emails: some real, some phishing. Every organization, person and address is made up.',
     why:'<b>Phishing</b> is an email built to trick you into giving away a password, money or access. The clues are in the details, so inspect before you decide.'},
    {key:'from',title:'The display name can say anything',run:seq('phishing',...phG.slice(0,2)),pause:true,focus:foc('phishing','The display name'),
     see:'The sender shows as “Pinecrest Credit Union,” but that is only a display name. The real address is security@pinecrest-alerts.test.',
     why:'Anyone can type any display name. The <b>domain</b> after the @ says who sent it, and pinecrest-alerts.test is not the credit union’s pinecrest.example.com.'},
    {key:'link',title:'Your question: who owns that link?',run:seq('phishing',...phG.slice(0,3)),pause:true,focus:foc('phishing','Hover to see'),
     see:'The link text says pinecrest.example.com. It really goes to pinecrest.example.com.account-verify.test/login.',
     why:'Read an address from the right, up to the first slash. The owner is account-verify.test; the rest is a label it made up.',
     so:'Don’t click. Report the email, then open the credit union’s app yourself.'},
    {key:'press',title:'Pressure is a clue',run:seq('phishing',...phG),pause:true,focus:foc('phishing','Pressure is'),
     see:'Highlighted words: a 24-hour deadline, a threat to suspend the account, and a request for your password.',
     why:'Scammers rush you so you don’t stop to check. Banks and schools say they will never ask for your password by email.'},
    {key:'att',title:'Attachments can be programs',run:seq('phishing',...phG,'Attachments can be'),pause:true,focus:foc('phishing','Attachments can be'),
     see:'A “missed delivery” email with an attachment: Delivery_Label.pdf.exe.',
     why:'Only the last extension counts, and .exe means a program, not a PDF. Windows hides known extensions, so it can show up as Delivery_Label.pdf.'},
    {key:'real',title:'Not every scary email is phishing',run:seq('phishing',...phG,'Not every scary'),pause:true,focus:foc('phishing','Not every scary'),
     see:'A sign-in alert from the real domain, pinecrest.example.com. It uses your name and has no link.',
     why:'It tells you to use the app or call the number on your card. No rush, no link, no password request: that is what a real alert looks like.'},
    {key:'lookalike',lvl:'honors',title:'Look-alike addresses',set:{mode:'links',lex:'sub'},fresh:true,pause:true,
     see:'The link checker takes one address apart. The red flags it finds are listed beside it.',
     why:'Scammers put a trusted name in a <b>subdomain</b>, on the left, or swap letters (rn for m). The owner is still whatever sits just before the first slash.',
     overlay(sim,ctx,LH,k){card(ctx,k,12,LH-12,330,[[FL(sim,'red',0),{w:700}],[FL(sim,'lverd'),{w:800,c:RED}]],{up:true});}},
    {key:'hdr',lvl:'ap',title:'Headers reveal forged senders',run:seq('phishing','Headers reveal'),pause:true,focus:foc('phishing','Headers reveal'),
     see:'The raw headers of an email whose From line shows the real school domain. They say spf=fail and dmarc=fail.',
     why:'The server that sent it is not allowed to send for that domain, so the From line is forged. Mail systems run these checks for you.'},
    {key:'case',title:'Investigate: put the logs on one timeline',run:seq('phishing','Investigate: put the logs'),pause:true,focus:foc('phishing','Investigate: put the logs'),
     see:'A teacher’s account sent spam. The case lines up that morning’s emails, web visits and sign-ins.',
     why:'A look-alike email and a fake sign-in page came just before a stranger’s first sign-in. Lining up times turns separate logs into one story.'}
  ],
  useIt:[
    {do:'Before you tap a link in a text or email, press and hold it (or hover on a computer) and read the address from the right.',why:'The real owner is the name just before the first slash. Words on its left are labels the owner made up.'},
    {do:'If a message says your account is about to close, open the app or type the site’s address yourself instead of using the link.',why:'Real problems will show up there too, and a fake page can’t follow you.'},
    {do:'Use your school’s “Report phishing” button instead of just deleting a suspicious email.',why:'One report lets IT block the message for everyone and check whether anyone already clicked.'}],
  tryIt:[{title:'the inbox audit (10 minutes)',steps:['Open your email’s spam or junk folder (don’t click anything inside).','For three messages, write down the display name and the real address after the @.','Find one more clue in each: urgency, a link, an attachment, or a request for a password or money.'],look:'Most junk mail fails the display-name test right away.'}]
};
R.phishing={questions:[
  {id:'display',kind:'test',lvl:'bio',q:'An email shows “Bramblewood School” as the sender. What tells you who actually sent it?',choices:['The display name, shown in bold at the very top','The domain after the @ in the real address','The school logo inside the message','The friendly greeting at the start'],correct:1,
   steps:['A display name is typed by the sender and can be anything.','The address after the @ shows the sending domain.','Only a domain the school owns means the school sent it.']},
  {id:'owner',kind:'test',lvl:'bio',q:'A link goes to https://bramblewood.example.org.login-check.test/sso. Who owns that site?',choices:['bramblewood.example.org','login-check.test','example.org','The school, since its name comes first'],correct:1,
   steps:['Read the address from the right, up to the first slash.','The last two parts before the slash are login-check.test.','Everything to its left is a label that owner chose.']},
  {id:'exe',kind:'test',lvl:'bio',q:'An attachment is named Report_Card.pdf.exe. What is it?',choices:['A PDF file with a long name','A program that runs when opened','A picture that was saved as a PDF','A zipped folder of PDFs'],correct:1,
   steps:['Only the last extension decides the file type.','.exe is a program.','Windows may hide .exe, so it can look like Report_Card.pdf.']},
  {id:'press',kind:'test',lvl:'bio',q:'Why do phishing emails often say your account will close within 24 hours?',choices:['Banks must close accounts within a day by law','Pressure makes people act before they check','Short deadlines get past spam filters','It is how real security alerts are written'],correct:1,
   steps:['A deadline and a threat create panic.','People in a hurry skip checking the sender and the link.','Real organizations rarely demand action by email this way.']},
  {id:'safe',kind:'real',lvl:'bio',q:'You get an email saying your gaming account was locked, with a link to unlock it. What is the safest move?',choices:['Click the link but don’t type your password','Open the game or its site yourself and check','Reply and ask if the email is real','Forward it to friends to see if they got it too'],correct:1,
   steps:['The link could lead to a fake sign-in page.','Going to the real app yourself avoids the link entirely.','If there is a real problem, it will show up there.']},
  {id:'lookalike',kind:'test',lvl:'honors',q:'Which address is most likely a look-alike of paypal.com?',choices:['www.paypal.com/help/account','paypal.com/signin','paypal.com.secure-pay.test','help.paypal.com/contact'],correct:2,
   steps:['Read each from the right, up to the first slash.','Three have paypal.com just before the first slash, so PayPal owns them.','The third is owned by secure-pay.test; “paypal.com” on its left is a made-up label.']},
  {id:'dmarc',kind:'test',lvl:'ap',q:'An email’s headers show dmarc=fail for the domain in its From line. What does that mean?',choices:['The email was sent by that domain’s own server','The sender’s server isn’t allowed to send for it','The email has an attachment that carries a virus','The message was encrypted on its way to you'],correct:1,
   steps:['SPF and DKIM check whether the server may send for a domain.','DMARC fails when the From domain is not backed by those checks.','So the From line is probably forged.']}
]};
/* ---------- stego (ciphers and steganography) ---------- */
const sgG=['An ordinary photo?','Pixels are numbers','Compare the two files','Look at one bit plane','Read the bits as letters'];
const sgCard=(ctx,k,rows)=>card(ctx,k,26,272,350,rows,{up:true});
L.stego={
  goals:{
    bio:['How a photo is stored as numbers, and how changing the lowest bit hides a message','How investigators find hidden data by comparing files, not by looking','How a Caesar cipher scrambles text, and why 25 keys are easy to try'],
    honors:['Why frequency analysis breaks a substitution cipher','Why hiding more bits per pixel holds more but changes the image more'],
    ap:['How the index of coincidence finds a Vigenère key length','How χ² against English letter frequencies finds each key letter']},
  matters:'Hidden messages turn up in real cases, from spies’ photos to malware that hides its instructions in images. The same ideas, bits, keys and letter counts, sit underneath the encryption that protects your messages every day.',
  steps:[
    {key:'photo',title:'An ordinary photo?',run:seq('stego',...sgG.slice(0,1)),pause:true,focus:foc('stego','An ordinary photo'),
     see:'A harbor photo a suspect posted, beside the original from the suspect’s camera card. They look the same.',
     why:'Hiding a message inside an ordinary file is <b>steganography</b>. Your eyes can’t find it, but the numbers might.'},
    {key:'px',title:'Pixels are numbers',run:seq('stego',...sgG.slice(0,2)),pause:true,focus:foc('stego','Pixels are numbers'),
     see:'The first 8 pixels of the top row: red values from 0 to 255. Small boxes show each value’s 8 bits; orange is bit 0.',
     why:'Changing bit 0 changes a value by just 1 out of 255, too little to see.'},
    {key:'diff',title:'Your question: how much changed?',run:seq('stego',...sgG.slice(0,3)),pause:true,focus:foc('stego','Compare the two files'),
     see:'The Difference view marks every pixel that isn’t identical in the two files. Only the top rows changed.',
     why:'320 of the 6,144 pixels changed, each by 1 out of 255. Far too small to see, and not random: camera noise would be scattered everywhere.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,[[FL(sim,'chg',0),{w:800,c:RED}],[FL(sim,'maxd',0)]]);}},
    {key:'plane',title:'Look at one bit plane',run:seq('stego',...sgG.slice(0,4)),pause:true,focus:foc('stego','Look at one bit plane'),
     see:'Bit plane 0 of the red values: white for a 1, black for a 0.',
     why:'Camera noise looks like TV static. The hidden bits make neat stripes across the top rows, the mark of a message.'},
    {key:'read',title:'Read the bits as letters',run:seq('stego',...sgG),speed:0.5,focus:foc('stego','Read the bits'),
     see:'Bit 0 of each pixel, read in order. Every 8 bits make one character code.',
     why:'The message comes out letter by letter, but it is scrambled. The suspect encrypted it before hiding it.'},
    {key:'caesar',title:'Caesar cipher',run:seq('stego','Caesar cipher'),focus:foc('stego','Caesar cipher'),
     see:'A <b>Caesar cipher</b> wheel: each plain letter (outer) maps to a cipher letter (inner), shifted by 7. A becomes H.',
     why:'Only 25 shifts exist, so trying them all is quick. Shifting the hidden text back 7 gives “MEET AT PIER 9 ON FRIDAY AT 6 PM.”'},
    {key:'freq',lvl:'honors',title:'Frequency analysis',run:seq('stego','Frequency analysis'),focus:foc('stego','Frequency analysis'),
     see:'A substitution cipher swaps each letter for another. Top: cipher letters in the note, most common first. Bottom: English.',
     why:'There are too many keys to try, but E is still the most common letter. The tallest cipher bar is probably E, and the rest follow.'},
    {key:'more',lvl:'honors',title:'More bits, more room, more change',set:{mode:'hide',bits:4},fresh:true,pause:true,run:sim=>act(sim,'hide'),
     see:'Your own message hidden in 4 bits of each value instead of 1. Read the card.',
     why:'More bits hold a longer message, but each value can now change by up to 15. Big enough changes start to show, and are easier to detect.',
     overlay(sim,ctx,LH,k){sgCard(ctx,k,[[FL(sim,'cap',0),{w:700}],[FL(sim,'chg',0)],[FL(sim,'maxd',0),{w:800,c:RED}]]);}},
    {key:'vig',lvl:'ap',title:'Vigenère and key length',run:seq('stego','Vigenère'),focus:foc('stego','Vigenère'),
     see:'A Vigenère keyword shifts each letter by a different amount. The bars show the average index of coincidence (IC) for each key length.',
     why:'At the right length, every column is a simple shift and looks like English, so the IC jumps to about 0.066. Then each column is solved like a Caesar cipher.'}
  ],
  useIt:[
    {do:'When someone shares a “too good to be true” photo, remember the file can carry more than the picture.',why:'Malware sometimes hides its instructions in image bits, the same trick as this tool. Security tools compare and scan files for it.'},
    {do:'Use apps with end-to-end encryption for private messages.',why:'Modern ciphers have far too many keys to try, unlike Caesar’s 25, so a copied message stays unreadable.'},
    {do:'Try a word puzzle like a cryptogram in a newspaper or app.',why:'Cryptograms are substitution ciphers, and frequency analysis, starting from E, T and A, is how people solve them.'}],
  tryIt:[{title:'a Caesar note (10 minutes)',steps:['Write a short sentence and shift every letter forward 3 (A→D).','Give it to a friend without the key and time how long they take to crack it.','Then count the letters in a longer secret message and guess E from the most common one.'],look:'With 25 possible shifts, a Caesar note falls quickly; letter counts break even scrambled alphabets.'}]
};
R.stego={questions:[
  {id:'lsb',kind:'test',lvl:'bio',q:'A message is hidden by changing the lowest bit of a pixel’s red value from 0 to 1. How much does the red value change?',num:{ans:1,tol:0,unit:'out of 255'},
   steps:['The lowest bit is worth 1.','Changing it from 0 to 1 adds 1 to the value.','A change of 1 out of 255 is too small to see.']},
  {id:'find',kind:'test',lvl:'bio',q:'Investigators have a posted photo and the camera’s original. How do they find a hidden message?',choices:['Zoom in until the hidden letters show','Compare the two files pixel by pixel','Print both photos and hold them to a light','Ask the photo app for its edit history'],correct:1,
   steps:['The changes are too small for any eye.','Comparing the numbers shows exactly which pixels differ.','The changed pixels then point to where the message is.']},
  {id:'stripes',kind:'test',lvl:'bio',q:'In the lowest bit plane, camera noise looks like static. What does a hidden message look like?',choices:['Neat stripes or patterns in one area','A completely black image','Bright colors across the whole photo','Exactly the same static as the noise'],correct:0,
   steps:['Noise sets the lowest bits at random.','Text bits follow the regular pattern of character codes.','So a message shows as stripes where it was written.']},
  {id:'caesar',kind:'test',lvl:'bio',q:'With a Caesar shift of 3, what does the word CAB become?',choices:['DBC','FDE','ZXY','CAB'],correct:1,
   steps:['Shift each letter 3 forward.','C→F, A→D, B→E.','CAB becomes FDE.']},
  {id:'keys',kind:'test',lvl:'bio',q:'Why is a Caesar cipher easy to break without the key?',choices:['There are only 25 shifts to try','It uses numbers instead of letters','The key is always written on the message','Computers can’t read shifted letters'],correct:0,
   steps:['The key is just the size of the shift.','A shift of 0 or 26 changes nothing, leaving 25 real keys.','Trying all 25 takes about a minute by hand.']},
  {id:'freq',kind:'test',lvl:'honors',q:'In a long substitution-cipher note, the most common cipher letter is Q. What is your best first guess for Q?',choices:['E, the most common letter in English','Z, the rarest letter in English','Q, since substitution keeps some letters','A, because it is first in the alphabet'],correct:0,
   steps:['A substitution cipher swaps letters but keeps their counts.','E is the most common letter in English text.','So the most common cipher letter probably stands for E.']},
  {id:'bits',kind:'test',lvl:'honors',q:'Hiding 4 bits per value instead of 1 holds four times as much text. What is the cost?',choices:['Each value can change by up to 15, which can show','The photo’s file size doubles','The message can no longer be read back by anyone, even you','Nothing; it is just as hidden'],correct:0,
   steps:['The lowest 4 bits are worth up to 1 + 2 + 4 + 8 = 15.','So each value can move by up to 15 out of 255.','Changes that big start to show and are easier to detect.']}
]};
/* ---------- binary (data is just bits) ---------- */
L.binary={
  goals:{
    bio:['How eight on/off switches make a byte, and how place values turn bits into numbers','How text and pixels are stored as numbers','Why a fixed number of bits has a top, and what happens past it','How a parity bit catches a flipped bit'],
    honors:['How hex writes a byte in two characters','Why decimals like 0.1 can’t be stored exactly'],
    ap:['How two’s complement stores negative numbers']},
  matters:'Every photo, message and file an investigator examines is a long row of bits. Knowing how bits become numbers, letters and colors explains glitches you have seen, like scores that roll over, and the hex views forensic tools show.',
  steps:[
    {key:'byte',title:'A byte is eight switches',run:seq('binary','A byte is eight'),focus:foc('binary','A byte is eight'),
     see:'Eight boxes, one byte. Each box is a <b>bit</b>, a switch that is off (0) or on (1). This byte is 00000101.',
     why:'Eight bits make a byte, enough for one plain letter of text. Everything a computer stores, from texts to photos, is bytes.'},
    {key:'place',title:'Place values double',run:seq('binary','A byte is eight','Place values'),focus:foc('binary','Place values'),
     see:'Each switch is worth twice the one to its right: 1, 2, 4 … 128. Here 128 + 32 + 4 + 1 = 165.',
     why:'Add the values of the switches that are on. Eight switches make 256 patterns, every number from 0 to 255.'},
    {key:'hex',lvl:'honors',title:'Hex is shorthand',run:seq('binary','A byte is eight','Place values'),focus:foc('binary','Hex is shorthand'),
     see:'The byte split into two groups of 4 bits. Each group is one <b>hex</b> digit, 0–9 then A–F: 1010 0101 is A5.',
     why:'Hex writes a byte in 2 characters instead of 8, which is why forensic tools show the inside of files in hex.'},
    {key:'text',title:'Text is numbers',run:seq('binary','Text is numbers'),focus:foc('binary','Text is numbers'),
     see:'“Café” as bytes. C, a and f take one byte each; é takes two.',
     why:'Every character has a number code. UTF-8, the code your phone uses, gives plain letters one byte and others two to four, so 4 characters take 5 bytes.'},
    {key:'px',title:'Pixels are numbers',run:seq('binary','Pixels are numbers'),focus:foc('binary','Pixels are numbers'),
     see:'An 8 × 8 picture. The selected pixel is three bytes: red 58, green 42, blue 26.',
     why:'Each pixel is red, green and blue light from 0 to 255. Change the numbers and the color changes. A phone photo is millions of these.'},
    {key:'over',title:'Your question: 250 + 10 points',run:seq('binary','Counting past the top'),focus:foc('binary','Counting past the top'),
     see:'The game stores its score in one byte. At 250 points you earn 10 more.',
     why:'One byte holds at most 255. 260 needs a ninth bit, so the carry falls off and the byte keeps 260 − 256 = 4.',
     so:'Every fixed-size counter has a top.'},
    {key:'parity',title:'One flipped bit',run:seq('binary','One flipped bit'),focus:foc('binary','One flipped bit'),
     see:'A message arrived with one bit flipped. The sender added a <b>parity bit</b> so every character has an even number of 1s.',
     why:'The character with an odd count is the broken one. Parity spots one flipped bit, but two flips in one character fool it.'},
    {key:'float',lvl:'honors',title:'Decimals aren’t exact',set:{mode:'float'},fresh:true,
     see:'The computer adds 0.1 + 0.2 and gets 0.30000000000000004.',
     why:'In binary, 0.1 is a repeating fraction, like 1/3 in decimal, so it is stored rounded. The tiny errors show up when you add.',
     so:'That is why banks count in whole cents.'},
    {key:'neg',lvl:'ap',title:'Negative numbers',run:seq('binary','Negative numbers'),focus:foc('binary','Negative numbers'),
     see:'In <b>two’s complement</b> the top bit is worth −128. 11111111 is −128 + 127 = −1.',
     why:'To negate a number, flip every bit and add 1. Adding then works the same for negative and positive numbers.'}
  ],
  useIt:[
    {do:'When a game score, a counter or a date suddenly jumps to a tiny or negative number, think of overflow.',why:'A fixed number of bits has a top. Past it, the carry falls off, just like the Comet Dash score.'},
    {do:'Look at how many bytes a text message with emoji uses compared with plain letters.',why:'UTF-8 gives plain letters one byte and emoji four, which is why emoji fill up a message limit faster.'},
    {do:'In a spreadsheet, type =0.1+0.2-0.3 and see what comes back.',why:'0.1 can’t be stored exactly in binary, so you may see a tiny leftover instead of 0.'}],
  tryIt:[{title:'count to 31 on one hand (5 minutes)',steps:['Give your fingers place values: thumb 1, index 2, middle 4, ring 8, pinky 16.','Raise fingers to show 5, then 13, then 31.','Try 32. You need a sixth finger.'],look:'Five bits stop at 31; the next number needs another bit, which is overflow on your hand.'}]
};
R.binary={questions:[
  {id:'val',kind:'test',lvl:'bio',q:'What number is the byte 00001010?',num:{ans:10,tol:0,unit:''},
   steps:['The bits that are on are worth 8 and 2.','8 + 2 = 10.','So 00001010 is 10.']},
  {id:'max',kind:'test',lvl:'bio',q:'What is the largest number one byte (8 bits) can hold?',choices:['8','128','255','256'],correct:2,
   steps:['All eight switches on: 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1.','That adds up to 255.','With 0 included, a byte has 256 different values.']},
  {id:'over',kind:'test',lvl:'bio',q:'A one-byte score is 250. The player earns 10 more. What does the score show?',num:{ans:4,tol:0,unit:'points'},
   steps:['250 + 10 = 260, but one byte holds at most 255.','The carry into a ninth bit falls off.','260 − 256 = 4.']},
  {id:'text',kind:'test',lvl:'bio',q:'How does a computer store the letter “C” in a text?',choices:['As a tiny picture of the letter','As a number code, 67, in one byte','As the sound the letter makes','As a color value somewhere from 0 to 255'],correct:1,
   steps:['Every character has a number code.','“C” is 67, which fits in one byte.','The screen draws the letter from that code.']},
  {id:'parity',kind:'test',lvl:'bio',q:'With even parity, a character arrives with five 1s. What does that tell you?',choices:['A bit was flipped in that character','The character is a capital letter','The message was encrypted','Nothing; five is allowed'],correct:0,
   steps:['Even parity makes every character’s count of 1s even.','Five is odd.','So at least one bit in that character changed on the way.']},
  {id:'hex',kind:'test',lvl:'honors',q:'What is the byte 1111 0000 written in hex?',choices:['F0','0F','FF','00'],correct:0,
   steps:['Split into two groups of 4: 1111 and 0000.','1111 is 15, which is F; 0000 is 0.','So the byte is F0.']},
  {id:'neg',kind:'test',lvl:'ap',q:'In 8-bit two’s complement, what number is 11111110?',num:{ans:-2,tol:0,unit:''},
   steps:['The top bit is worth −128.','The other seven are 64 + 32 + 16 + 8 + 4 + 2 = 126.','−128 + 126 = −2.']}
]};
/* ---------- internet (how the internet moves data) ---------- */
const inCard=(ctx,k,rows)=>card(ctx,k,536,40,254,rows);   /* top-right of the map: empty there */
const inCardL=(ctx,k,rows)=>card(ctx,k,10,44,260,rows);  /* DNS screen: top-left is empty */
L.internet={
  goals:{
    bio:['How DNS turns a name into an address','Why data travels as numbered packets that can take different paths','How the server puts packets back in order','Why a cut wire rarely stops the internet'],
    honors:['How TCP resends packets that get lost','How traceroute reveals each router on the way','Why a cached DNS answer is faster'],
    ap:['What a packet’s headers hold: addresses, ports, sequence number and TTL']},
  matters:'Every message, video and assignment you send crosses the internet this way. Investigators read the same packets, addresses and router hops to trace where data came from, and network staff use them to work out why a site won’t load.',
  steps:[
    {key:'net',title:'A network of routers',run:seq('internet','A network of routers'),focus:foc('internet','A network of routers'),
     see:'Maya’s laptop on the left and the lunarlibrary.test server on the right (both fictional). Between them, routers pass data along wires.',
     why:'Each <b>router</b> hands data one step closer, like post offices passing a letter along. There are many possible paths.'},
    {key:'dns',title:'First, find the address',run:seq('internet','First, find the address'),speed:0.6,focus:foc('internet','First, find the address'),
     see:'A <b>DNS</b> lookup asks a chain of servers until one knows that www.lunarlibrary.test is 203.0.113.80.',
     why:'People type names, but computers need number addresses. DNS is the internet’s contact list.',
     overlay(sim,ctx,LH,k){inCardL(ctx,k,[[FL(sim,'dnsQ',0),{w:700}],[FL(sim,'dnsT',0)]]);}},
    {key:'hello',title:'Say hello',run:seq('internet','Say hello'),speed:0.5,focus:foc('internet','Say hello'),
     see:'Before sending the essay, the laptop sends a hello (SYN) and waits for the server’s reply.',
     why:'Both sides confirm the other is ready, like checking someone can hear you before you talk on a call. This is the TCP handshake.'},
    {key:'paths',title:'Packets take different paths',run:seq('internet','Say hello'),speed:0.6,focus:foc('internet','Packets take different'),
     see:'After the handshake, the essay is split into 8 numbered <b>packets</b>. Watch them spread across the map.',
     why:'Each router sends a packet one step closer by any equally short path, so packets from one essay take different routes.'},
    {key:'order',title:'Put back in order',run:seq('internet','Say hello'),speed:1,focus:foc('internet','Put back in order'),
     see:'The “Server has” row fills in as packets arrive, sometimes out of order.',
     why:'The server uses the numbers to rebuild the essay, like numbered pages, and acknowledges each packet so the laptop knows it arrived.',
     overlay(sim,ctx,LH,k){inCard(ctx,k,[[FL(sim,'ngot'),{w:700}],[FL(sim,'nooo',0)]]);}},
    {key:'cut',title:'Your question: a wire is cut mid-send',run:seq('internet','A network of routers','Break a wire'),speed:0.6,focus:foc('internet','Break a wire'),
     see:'The R5–R7 wire is cut, and the essay is sent again.',
     why:'Routers steer around the dead wire. All 8 packets still arrive, a few out of order, and the server puts them back in order.',
     so:'Many paths make the internet hard to break.',
     overlay(sim,ctx,LH,k){inCard(ctx,k,[[FL(sim,'ngot'),{w:800,c:GREEN}],[FL(sim,'nooo',0)],[FL(sim,'tdel',0)]]);}},
    {key:'loss',lvl:'honors',title:'Lost packets are sent again',run:sim=>{seq('internet','A network of routers')(sim);BioLab.setValues(sim,{loss:20});act(sim,'send');},speed:0.8,focus:[0,40,800,350],
     see:'Now about 20% of packets get lost on the way. Watch the count of packets sent.',
     why:'When a packet’s acknowledgment doesn’t come back in time, TCP sends that packet again. The essay still arrives whole, just later.',
     overlay(sim,ctx,LH,k){inCard(ctx,k,[[FL(sim,'nretx',0),{w:800,c:RED}],[FL(sim,'ngot')],[FL(sim,'tdel',0)]]);}},
    {key:'trace',lvl:'honors',title:'Traceroute',run:seq('internet','A network of routers','Traceroute'),focus:foc('internet','Traceroute'),
     see:'<b>Traceroute</b> sends probes that may cross only 1 router, then 2, then 3. Each router that drops one reports back.',
     why:'The replies reveal every hop on the path and how long each took, which is how network staff find where a connection breaks.'},
    {key:'cache',lvl:'honors',title:'A cached answer is faster',set:{mode:'dns',cache:true},fresh:true,run:sim=>act(sim,'look'),speed:0.6,
     see:'The same lookup, but the resolver saved the answer from earlier: it is <b>cached</b>.',
     why:'It answers right away instead of asking the chain of servers, so the lookup takes 2 messages instead of 8.',
     overlay(sim,ctx,LH,k){inCardL(ctx,k,[[FL(sim,'dnsQ',0),{w:800,c:GREEN}],[FL(sim,'dnsT',0)]]);}},
    {key:'hdr',lvl:'ap',title:'Inside a packet',run:seq('internet','A network of routers','Inside a packet'),speed:0.5,focus:foc('internet','Inside a packet'),
     see:'One packet’s headers: source and destination addresses and ports, the TCP flags, and a TTL.',
     why:'Each router lowers the TTL (time to live) by 1 and drops a packet that reaches 0, so a packet caught in a loop can’t circle forever.'}
  ],
  useIt:[
    {do:'If a site won’t load but others do, try it on your phone’s data instead of Wi-Fi.',why:'That changes the DNS resolver and the path, which tells you whether the problem is your network or the site.'},
    {do:'On a computer, open a command window and run tracert (Windows) or traceroute (Mac) on a site you use.',why:'You will see each router between you and the site, with the time each hop takes.'},
    {do:'Submit big assignments a few minutes early on a slow connection.',why:'Lost packets are sent again, so a weak connection still delivers the whole file, just more slowly.'}],
  tryIt:[{title:'packet post (10 minutes)',steps:['Write a sentence on 6 numbered sticky notes, one word each.','Hand them to three friends standing in different spots, who pass them to you by different routes.','Rebuild the sentence from the numbers.'],look:'The notes arrive out of order, but the numbers let you rebuild the sentence, just as TCP does.'}]
};
R.internet={questions:[
  {id:'dns',kind:'test',lvl:'bio',q:'What does a DNS lookup do?',choices:['Turns a name like www.site.test into a number address','Checks the site for viruses before your browser lets it load','Splits a file into numbered packets','Encrypts the data before it is sent'],correct:0,
   steps:['People type names; computers route by number addresses.','DNS asks a chain of servers for the address that matches the name.','Then the computer can send data to that address.']},
  {id:'number',kind:'test',lvl:'bio',q:'Why does every packet of an essay carry a number?',choices:['So the server can put them back in order','So routers know which packet is most important','So the essay is encrypted','So each packet takes the same path'],correct:0,
   steps:['Packets can take different paths.','So they can arrive out of order.','The numbers let the server rebuild the essay correctly.']},
  {id:'cut',kind:'test',lvl:'bio',q:'A wire between two routers is cut while your essay is sending. What usually happens?',choices:['The essay is lost and must be retyped','Routers find another path and the essay arrives','The server receives half the essay','Every router on the internet shuts down until the wire is fixed'],correct:1,
   steps:['There are many paths between most places.','Routers drop the broken wire from their routes.','Packets go around it and still arrive.']},
  {id:'hello',kind:'test',lvl:'bio',q:'Why does a laptop say hello to a server before sending an essay?',choices:['So both sides know the other is ready','To find the server’s name','To check the essay for spelling','To pick which wire the packets should travel on'],correct:0,
   steps:['The TCP handshake is a hello and a reply.','It confirms both sides are ready and listening.','Only then does the data start to flow.']},
  {id:'lost',kind:'test',lvl:'honors',q:'One packet is lost on the way. How does TCP still deliver the whole essay?',choices:['The laptop resends it when no acknowledgment comes back','The server guesses what the missing words were from the rest of the essay','Routers keep a copy of every packet forever','The essay is sent with that part left blank'],correct:0,
   steps:['The server acknowledges each packet it receives.','No acknowledgment means the packet may be lost.','So the laptop sends it again until it gets through.']},
  {id:'cache',kind:'test',lvl:'honors',q:'Why is a second visit to the same site’s name usually faster to look up?',choices:['The resolver has the answer cached','The site moves closer to you','Routers skip DNS for popular sites','Your laptop memorizes every website'],correct:0,
   steps:['The first lookup asks a chain of servers.','The resolver saves (caches) the answer for a while.','The next lookup is answered straight from the cache.']},
  {id:'ttl',kind:'test',lvl:'ap',q:'A packet leaves with TTL 64, and each router lowers it by 1. After how many routers does its TTL reach 0, so it is dropped?',num:{ans:64,tol:0,unit:'routers'},
   steps:['Each router subtracts 1 from the TTL.','A packet whose TTL reaches 0 is dropped.','64 routers bring it from 64 down to 0, so the 64th router drops it.']}
]};
/* ---------- pubkey (public-key crypto and HTTPS) ---------- */
L.pubkey={
  goals:{
    bio:['Why anything sent in the open can be copied','How two people agree on a secret key while someone listens','How a digital signature catches a changed message','What the browser padlock does and doesn’t promise'],
    honors:['Why small keys break and each extra bit doubles the work','How RSA lets anyone lock a message that only one person can unlock','Why a scam site can have a padlock'],
    ap:['How a person in the middle defeats key agreement without certificates']},
  matters:'Every time you sign in, pay, or check grades, your browser runs these steps in a fraction of a second. Investigators know what encryption hides and what it doesn’t: the words are protected, but who talked to whom, and when, often is not.',
  steps:[
    {key:'open',title:'The problem',run:seq('pubkey','The problem'),focus:foc('pubkey','The problem'),
     see:'Ava sends Ben a message across a line Eve can copy, like shared Wi-Fi. With no encryption, Eve’s notebook shows every word.',
     why:'Anything sent in the open can be copied. The fix is to lock (<b>encrypt</b>) it with a key only Ava and Ben know.'},
    {key:'keyfirst',title:'Sharing a key out loud fails',run:seq('pubkey','The problem','Sharing a key'),focus:foc('pubkey','Sharing a key'),
     see:'Ava locks the message but sends the key first. Eve’s notebook has the key too.',
     why:'It’s like mailing a locked box with the key taped to the lid. The real problem is agreeing on a key while someone listens.'},
    {key:'paint',title:'Mixing paint in public',run:seq('pubkey','Mixing paint'),focus:foc('pubkey','Mixing paint'),
     see:'Ava and Ben each mix a secret color into a shared public color, swap the mixes, then add their own secret again.',
     why:'Both end with the same color, and Eve can’t un-mix paint. <b>Diffie–Hellman</b> does this with numbers that are easy to combine and hard to undo.'},
    {key:'small',lvl:'honors',title:'Small keys break',run:seq('pubkey','Mixing paint','Small keys break'),focus:foc('pubkey','Small keys break'),
     see:'With a small prime, Eve simply tries every secret number until one fits.',
     why:'Each extra bit of key doubles her work. Real keys are hundreds of bits long, so trying them all would take longer than the age of the universe.'},
    {key:'rsa',lvl:'honors',title:'A lock anyone can close',run:seq('pubkey','A lock anyone'),focus:foc('pubkey','A lock anyone'),
     see:'<b>RSA</b>: Ben publishes two numbers, n and e. Ava locks her number with them; only Ben’s private number d unlocks it.',
     why:'Finding d means splitting n into its two prime factors. That is easy for 3,233, but impossibly slow for the 600-digit numbers real sites use.'},
    {key:'wifi',title:'Your question: what does Eve learn on guest Wi-Fi?',set:{mode:'case',setup:2},fresh:true,focus:[0,40,800,410],
     see:'Now Ava and Ben agree on a key with Diffie–Hellman first, as HTTPS does. Read Eve’s notebook.',
     why:'Without the key, the words stay hidden. Eve still sees who talked to whom, when, and how much data moved.',
     so:'Encryption hides what you said, not that you said something.'},
    {key:'sign',title:'Signatures catch tampering',run:seq('pubkey','Signatures catch'),focus:foc('pubkey','Signatures catch'),
     see:'Ava signs “$5 by Friday” with her private key. Eve changes it to $9. Ben’s check fails.',
     why:'The <b>signature</b> comes from the message and a key only Ava has. Change one character and it no longer matches.'},
    {key:'pad',title:'What the padlock means',run:seq('pubkey','What the padlock'),focus:foc('pubkey','What the padlock'),
     see:'The site’s <b>certificate</b>, signed by an authority your browser trusts. All four checks pass, so the browser shows a padlock.',
     why:'The padlock means the connection is encrypted and the name matches. It does not mean the site is honest.'},
    {key:'phish',lvl:'honors',title:'A scam site can have a padlock',set:{mode:'cert',cert:'phish'},fresh:true,focus:[0,0,800,450],
     see:'A look-alike site with a valid certificate for its own look-alike name. Every check passes.',
     why:'Anyone can get a certificate for a name they own, so the scam site gets a padlock too. Check the name in the address bar.'},
    {key:'mitm',lvl:'ap',title:'Eve in the middle',run:seq('pubkey','Eve in the middle'),focus:foc('pubkey','Eve in the middle'),
     see:'Without certificates, Eve runs a separate key exchange with Ava and with Ben, and reads everything in between.',
     why:'Each side thinks it is talking to the other. Certificates and signatures stop this, because Eve can’t sign as Ben.'}
  ],
  useIt:[
    {do:'On public Wi-Fi, check for https:// and the padlock before you sign in anywhere.',why:'Without encryption, anyone on the network can copy what you send, just like Eve’s notebook.'},
    {do:'Before typing a password, read the site’s name in the address bar, not just the padlock.',why:'A scam site can get a valid certificate for its own look-alike name, so it shows a padlock too.'},
    {do:'If your browser warns that a certificate is expired or doesn’t match, don’t click past it.',why:'A failed check can mean someone is in the middle of your connection.'}],
  tryIt:[{title:'mix paint in public (15 minutes)',steps:['With a friend, agree out loud on a shared color, like a cup of water with yellow food coloring.','Each of you secretly adds a drop of your own color to a copy, then swap cups.','Each adds your own secret drop again and compare.'],look:'You both end with the same color, and a watcher who only saw the swapped cups can’t easily rebuild it.'}]
};
R.pubkey={questions:[
  {id:'open',kind:'test',lvl:'bio',q:'Ava sends a message with no encryption over shared Wi-Fi. What can someone on the network see?',choices:['The whole message','Only that a message was sent','Nothing at all','Only the first word'],correct:0,
   steps:['Without encryption, the message crosses the network as plain text.','Anyone copying the traffic gets every word.','That is why sites use HTTPS.']},
  {id:'keyfirst',kind:'test',lvl:'bio',q:'Why doesn’t it work to send the key first, then the locked message?',choices:['The listener copies the key and unlocks it','Keys can’t be sent over the internet','The message gets too long to send','The key changes the message’s words'],correct:0,
   steps:['Anything sent in the open can be copied.','If the key crosses the wire, the listener has it too.','So the two sides need a way to agree on a key without sending it.']},
  {id:'meta',kind:'real',lvl:'bio',q:'You check grades over HTTPS on school guest Wi-Fi. What can another person on the network still learn?',choices:['Your grades and password','That your device talked to that site, and when','Nothing, since HTTPS hides everything','Only your grades, but not the password you typed'],correct:1,
   steps:['HTTPS encrypts what you send and receive.','But the addresses, times and amount of data still show.','Encryption hides what you said, not that you said something.']},
  {id:'sign',kind:'test',lvl:'bio',q:'Eve changes “$5” to “$9” in a signed message. What happens when Ben checks the signature?',choices:['It fails, so Ben knows the message changed','It passes, since Eve changed only one character','Ben’s computer fixes the message back to $5','The signature updates itself to match'],correct:0,
   steps:['The signature was made from the original message.','Any change makes the message and signature disagree.','So Ben’s check fails.']},
  {id:'pad',kind:'test',lvl:'bio',q:'What does the padlock in your browser tell you?',choices:['The connection is encrypted and the name matches','The site is honest and safe to buy from or sign up for','The site has never been hacked','Your computer has no viruses'],correct:0,
   steps:['A certificate proves the site owns its name and key.','The browser checks it and encrypts the connection.','It says nothing about whether the owner is honest.']},
  {id:'bits',kind:'test',lvl:'honors',q:'A key grows from 40 bits to 41 bits. How much longer does trying every key take?',choices:['About twice as long','About 1 more second','About 41 times as long','No longer at all'],correct:0,
   steps:['Each bit doubles the number of possible keys.','41 bits has 2 × as many keys as 40.','So trying them all takes about twice as long.']},
  {id:'factor',kind:'test',lvl:'honors',q:'Ben’s public number is n = 3,233 = 61 × 53. Why do real sites use far bigger numbers?',choices:['Small ones are fast to factor, revealing the key','Small numbers can’t be multiplied by a computer','Bigger numbers make each web page load faster','Browsers reject any public number under 10,000'],correct:0,
   steps:['The private key comes from n’s two prime factors.','Factoring 3,233 takes a moment.','Factoring a 600-digit n would take far longer than anyone has.']}
]};
/* ---------- risk (risk and defense in depth) ---------- */
const rkG=['A small business with real risks','Risk = likelihood × impact','Common is not the same as costly'];
/* the tool's own threat table (risk.js THREATS): yearly rate (ARO) and cost per incident (SLE) */
const RK_T=[['Ransomware',0.25,40000],['Phishing',2,3000],['Skimmer',0.08,60000,'honors'],['Insider',0.5,8000],['Power',1.5,1500],['Password',0.5,4000],['Laptop',0.2,6000]];
L.risk={
  goals:{
    bio:['How risk combines how likely a threat is with how bad it would be','Why a rare, costly threat can cost more per year than a common, cheap one','How stacked defenses (layers) cut the chance an attack gets through','Why some controls reduce the damage instead of stopping the attack'],
    honors:['How expected yearly loss (ARO × SLE) compares threats in dollars','Why a simulated year rarely matches the average'],
    ap:['Why the distribution of yearly losses is skewed, and what a 1-in-20 bad year means']},
  matters:'Schools, hospitals and small businesses can’t afford to stop every possible attack, so security people rank risks and spend where it counts. The same thinking explains insurance, seat belts and backups.',
  steps:[
    {key:'biz',title:'A small business with real risks',run:seq('risk',...rkG.slice(0,1)),pause:true,focus:foc('risk','A small business'),
     see:'Pinecrest Bakery (fictional) has customer data, a card reader, an order website and two laptops. The list names threats to them.',
     why:'Security starts with a list of what could go wrong. No business can defend everything, so it has to choose.'},
    {key:'grid',title:'Risk = likelihood × impact',run:seq('risk',...rkG.slice(0,2)),pause:true,focus:foc('risk','Risk = likelihood'),
     see:'Each threat sits on the grid by how likely it is each year (up) and how bad one incident is (right). Dashed circles are analysts’ estimates.',
     why:'<b>Risk</b> = likelihood × impact. The top-right corner, both likely and costly, is where the worst risks live.'},
    {key:'q',title:'Your question: power or ransomware?',run:seq('risk',...rkG),pause:true,focus:foc('risk','Common is not'),
     see:'Power outages (5): about 1.5 a year, $1,500 each. Ransomware through unpatched software (4): about once every 4 years, $40,000 each.',
     why:'Expected yearly loss is how often × how much. Power: 1.5 × $1,500 = $2,250. Ransomware: 0.25 × $40,000 = $10,000, about four times as much.'},
    {key:'ale',title:'Expected loss per year',set:{mode:'case',view:'matrix'},fresh:true,pause:true,
     see:'Every bakery threat as a bar: its expected loss per year, how often × how much.',
     why:'Rare but costly threats can top the list. Ransomware and phishing cost the most per year, so they come first in the budget.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,p=tau%10,hon=(H.level||'bio')!=='bio',B={x0:110,x1:760,y0:70,y1:Math.min(LH-80,410)};K.dim(ctx,LH);
       const T=RK_T.filter(t=>!t[3]||hon),mx=12000,kk=Math.min(k,1.25);
       K.axes(ctx,B,k,{xr:[0,1],yt:[[0,'$0'],[2500/mx,'$2,500'],[5000/mx,'$5,000'],[7500/mx,'$7,500'],[10000/mx,'$10,000']],yl:'Expected loss per year',ylOff:80});
       K.bars(ctx,B,T.map(t=>[t[0],t[1]*t[2]/mx,t[0]==='Ransomware'?RED:t[0]==='Power'?'#c27a00':BLUE]),k,Math.min(1,p/1.5));
       if(p>=1.8){const gw=(B.x1-B.x0)/T.length;T.forEach((t,i)=>{const v=t[1]*t[2],x=B.x0+gw*(i+0.5),y=K.Y(B,v/mx)-12*kk;H.txt(ctx,'$'+v.toLocaleString('en-US'),x,y,{s:12.5*kk,w:700,a:'center',b:'middle'});});}}},
    {key:'cheese',title:'Layers of Swiss cheese',run:seq('risk','A small business','Layers of Swiss'),focus:foc('risk','Layers of Swiss'),
     see:'Phishing emails fly at three layers: an email filter, staff training and MFA. Each layer stops some of them.',
     why:'Every defense has holes, like Swiss cheese. An attack gets through only if it finds a hole in every layer: 40% × 50% × 30% = 6%.'},
    {key:'backup',title:'Some controls cut the damage instead',run:seq('risk','A small business','Some controls cut'),focus:foc('risk','Some controls cut'),
     see:'Ransomware against software updates, with backups beside the order computer.',
     why:'Backups don’t stop ransomware getting in. They let the bakery restore its files, cutting each hit from $40,000 to about $6,000.'},
    {key:'year',title:'Play out a year',run:seq('risk','A small business','Play out a year'),focus:foc('risk','Play out a year'),
     see:'A year at the bakery with its plan. Rings were stopped by a layer; red marks got through and cost money.',
     why:'Attacks are random, so no two years match. Plans use the average cost per year, not one lucky or unlucky year.'},
    {key:'many',lvl:'honors',title:'1,000 years at once',run:seq('risk','A small business','1,000 years'),pause:true,focus:foc('risk','1,000 years'),
     see:{honors:'The year repeated 1,000 times, with no plan. Each bar counts years with that much loss.',ap:'The year repeated 1,000 times, with no plan. Lines mark the median, the average and the 1-in-20 bad year.'},
     why:{honors:'The average matches the expected loss, ARO × SLE added over threats. Most years cost less than the average.',ap:'The histogram is skewed: rare, expensive hits drag the average above the median. Plans must also survive the 1-in-20 bad year.'}}
  ],
  useIt:[
    {do:'Turn on automatic updates and back up your photos and schoolwork.',why:'Updates close the holes ransomware uses, and backups cut the damage if it gets in anyway: two layers for one big risk.'},
    {do:'When you decide what to protect first, ask how often it could happen and how bad it would be.',why:'Multiplying the two shows that a rare, costly loss can matter more than a frequent, small one.'},
    {do:'Use more than one protection on your most important account, like a strong password plus MFA.',why:'Stacked layers multiply: an attacker has to find a hole in every one.'}],
  tryIt:[{title:'your own risk grid (15 minutes)',steps:['List five things that could go wrong with your phone: lost, cracked screen, stolen account, dead battery, water.','Guess how often each happens per year and what it would cost.','Multiply and rank them.'],look:'The top of your list may not be the most common problem, but the one that costs most per year.'}]
};
R.risk={questions:[
  {id:'def',kind:'test',lvl:'bio',q:'Which two things does a risk grid compare for each threat?',choices:['How likely it is and how bad one incident would be','How new it is and who discovered it','How many computers and how many people it affects','Its cost to fix and how long it takes to fix'],correct:0,
   steps:['Risk combines likelihood and impact.','Likelihood goes up the grid; impact goes across.','Threats in the top-right corner are the worst.']},
  {id:'ale',kind:'test',lvl:'bio',q:'A threat happens about 2 times a year and costs $3,000 each time. What is the expected loss per year?',num:{ans:6000,tol:0,unit:'dollars'},
   steps:['Expected yearly loss = how often × how much.','2 × $3,000.','= $6,000 a year.']},
  {id:'rare',kind:'test',lvl:'bio',q:'Power outages: 1.5 a year at $1,500. Ransomware: once every 4 years at $40,000. Which costs more per year?',choices:['Power outages, since they happen more often','Ransomware, about $10,000 vs $2,250','They cost exactly the same','Neither costs anything on average'],correct:1,
   steps:['Power: 1.5 × $1,500 = $2,250 a year.','Ransomware: 0.25 × $40,000 = $10,000 a year.','The rare, costly threat costs about four times as much.']},
  {id:'layers',kind:'test',lvl:'bio',q:'Three layers let through 40%, 50% and 30% of attacks. What share gets through all three?',num:{ans:6,tol:0.5,unit:'%'},
   steps:['An attack must pass every layer.','Multiply the chances: 0.40 × 0.50 × 0.30.','= 0.06, or 6%.']},
  {id:'backup',kind:'test',lvl:'bio',q:'What do backups do against ransomware?',choices:['They cut the damage by letting you restore files','They stop the ransomware from getting in','They make the computer immune to all malware','They send the attacker’s location straight to the police'],correct:0,
   steps:['Ransomware locks your files and demands payment.','Backups don’t keep it out.','They let you restore the files, so each hit costs far less.']},
  {id:'year',kind:'test',lvl:'honors',q:'The expected loss is $10,000 a year, but this year the bakery lost $2,000. What explains it?',choices:['Attacks are random, so single years vary around the average','The expected loss was calculated wrong','The bakery’s defenses must have stopped every attack that came','Expected loss only counts the first attack of a year'],correct:0,
   steps:['Expected loss is an average over many years.','Rare attacks may not happen in a given year.','So most years land above or below the average.']},
  {id:'skew',kind:'test',lvl:'ap',q:'In 1,000 simulated years, the average loss is well above the median. Why?',choices:['A few rare, very expensive years pull the average up','Most years have huge losses','The median counts only years with no loss','The simulation double-counts the cheapest threats'],correct:0,
   steps:['Most years have only small losses.','A few years include a $40,000 or $60,000 hit.','Those big values pull the average above the middle year.']}
]};
/* ---------- firewall (firewall rules) ---------- */
const fwR=(act,src,dst,port,proto)=>({act,src,dst,port:port||'any',proto:proto||'any',log:false});
const fwUse=list=>sim=>{seq('firewall','Four zones')(sim);sim.st.chRules=list();sim.st.pk=[];sim.infoDirty=true;};
L.firewall={
  goals:{
    bio:['How a firewall checks each packet between network zones against a list of rules','What ports are, and how they name services','Why rule order matters: the first match wins','Why an implicit “deny everything” sits under every rule list'],
    honors:['Why a firewall can’t hide a service you choose to publish'],
    ap:['Why a stateless firewall needs rules for replies','How logged denies become evidence']},
  matters:'Firewalls sit between almost every network and the internet, from a school to your home router. Many real break-ins came from one rule in the wrong place, and the firewall’s logs are often the first evidence an investigator reads.',
  steps:[
    {key:'zones',title:'Four zones and a firewall',run:seq('firewall','Four zones'),speed:0.5,focus:foc('firewall','Four zones'),
     see:'The library network: guest Wi-Fi, staff, servers and the internet. Every packet between zones passes through the firewall in the middle.',
     why:'A <b>firewall</b> checks each packet against a list of rules and lets it through or drops it, like a security desk between rooms.'},
    {key:'ports',title:'Packets and ports',run:seq('firewall','Four zones'),speed:0.4,focus:foc('firewall','Packets and ports'),
     see:'Each dot is a packet. Its color and number show the service: 443 secure web, 53 DNS (name lookups), 445 file sharing.',
     why:'A <b>port</b> is like an apartment number: it says which service on a computer the packet is for.'},
    {key:'open',title:'Allow everything means everything',run:seq('firewall','Four zones'),speed:0.4,focus:foc('firewall','Allow everything'),
     see:'The only rule is “allow any to any.” Purple 445 packets from the patron laptop reach the staff file server.',
     why:'That is how last week’s break-in happened. The top bar shows 0 of 5 unwanted packets blocked.'},
    {key:'q',title:'Your question: add a deny under it?',run:fwUse(()=>[fwR('allow','any','any'),fwR('deny','guest','servers','445','tcp')]),speed:0.4,focus:foc('firewall','Allow everything'),
     see:'A volunteer adds rule 2 under it: deny Guest Wi-Fi to Servers, port 445. Watch the top bars.',
     why:'Rules are read top-down, and the first match wins. “Allow any to any” matches every packet, so rule 2 never runs.',
     so:'A deny under an allow-everything does nothing.'},
    {key:'order',title:'Rules are checked in order',run:seq('firewall','Four zones','Rules are checked'),speed:0.4,focus:foc('firewall','Rules are checked'),
     see:'A better set of 8 rules (listed below the stage). Denies for guests sit above the allows.',
     why:'The first matching rule wins, like a bouncer working down a list. Guests can look up names and browse the web, but can’t reach staff computers or servers.'},
    {key:'deny',title:'The implicit deny',run:seq('firewall','Four zones','Rules are checked'),speed:0.4,focus:foc('firewall','The implicit deny'),
     see:'The port scan and outside remote-desktop attempts match no rule and are dropped. The bars read 8 of 8 and 5 of 5.',
     why:'Under the last rule waits an invisible “deny everything,” so you list only what should get through.'},
    {key:'scan',lvl:'honors',title:'What a scan still finds',run:seq('firewall','Four zones','Rules are checked'),speed:0.4,focus:foc('firewall','What a scan still'),
     see:'One scan probe gets through: port 443 on the catalog site, which patrons need from home.',
     why:'A firewall can’t hide a service you choose to publish. That service has to be kept patched and watched.'},
    {key:'stateless',lvl:'ap',title:'Stateless: replies need rules too',run:seq('firewall','Four zones','Stateless'),speed:0.4,focus:foc('firewall','Stateless'),
     see:'The firewall is switched to stateless. Web replies return to the laptop’s temporary port, 51515, and are dropped.',
     why:'A stateful firewall remembers each request and lets its reply back in. A stateless one judges every packet alone, so replies need rules of their own.'},
    {key:'log',lvl:'ap',title:'Logging rules',run:seq('firewall','Four zones','Logging rules'),speed:0.4,focus:foc('firewall','Logging rules'),
     see:'Rules marked Log write one line for every packet they match: time, rule number, action, addresses and port.',
     why:'The logged denies are the evidence an investigator reads later, to see who tried to get in and when.'}
  ],
  useIt:[
    {do:'Leave the firewall on in your computer’s security settings, especially on public Wi-Fi.',why:'It drops connections no rule allows, the implicit deny, so strangers on the network can’t reach your files.'},
    {do:'Don’t turn on file sharing or remote desktop unless you need it.',why:'A firewall can’t protect a service you choose to open; every open port is a door that must be watched.'},
    {do:'If a game or app asks you to “allow through the firewall,” check what it is first.',why:'You are adding an allow rule. Allow only programs you trust, and only on private networks.'}],
  tryIt:[{title:'be the firewall (10 minutes)',steps:['Write four rules on a card, in order, like “1. No phones at the table. 2. Water is allowed. 3. Anything else: no.”','A friend hands you items one at a time; check the rules from the top and stop at the first match.','Swap rules 1 and 2 and try again.'],look:'The same items get different answers when the order changes: the first match wins.'}]
};
R.firewall={questions:[
  {id:'order',kind:'test',lvl:'bio',q:'Rule 1 says “allow any to any.” Rule 2 says “deny guests to servers.” Does rule 2 block guests?',choices:['No, rule 1 matches first and allows everything','Yes, deny rules always beat allow rules, wherever they sit','Yes, because rule 2 is more specific','Only on weekends, when traffic is lower'],correct:0,
   steps:['The firewall checks rules from the top.','It stops at the first rule that matches.','Rule 1 matches every packet, so rule 2 is never reached.']},
  {id:'fix',kind:'test',lvl:'bio',q:'How do you fix that rule list so guests can’t reach the servers?',choices:['Move the deny above the allow','Add a second allow rule','Delete the implicit deny','Change the deny to port 443'],correct:0,
   steps:['The first match wins.','A narrow deny must come before a broad allow.','Then guest packets to servers hit the deny first.']},
  {id:'implicit',kind:'test',lvl:'bio',q:'A packet matches none of the listed rules. What happens to it?',choices:['It is dropped by the implicit deny','It is allowed, since nothing stopped it','It is sent back to its sender to try again','It waits until a matching rule is added'],correct:0,
   steps:['Every rule list ends with an invisible “deny everything.”','A packet no rule allows falls through to it.','So it is dropped.']},
  {id:'port',kind:'test',lvl:'bio',q:'What does a packet’s port number, like 443, tell the firewall?',choices:['Which service on the computer it is for','How fast the packet is moving','Which country the packet came from','How many routers it has crossed'],correct:0,
   steps:['A port is like an apartment number on an address.','443 means secure web, 53 means DNS, 445 means file sharing.','Rules can allow or deny by port.']},
  {id:'broad',kind:'test',lvl:'bio',q:'A rule “deny Guest Wi-Fi to Servers” sits first, and the guest DNS server is in the servers zone. What breaks?',choices:['Guests can’t look up website names','Staff can’t send email','The internet can’t reach the catalog','Nothing; the rule only blocks file sharing'],correct:0,
   steps:['The deny covers every packet from guests to the servers zone.','The DNS server is in that zone, so DNS lookups are dropped.','Without DNS, names don’t turn into addresses, so browsing fails.']},
  {id:'publish',kind:'test',lvl:'honors',q:'The library must let people reach its catalog site on port 443 from home. What does that mean for security?',choices:['That service must be kept patched and watched','The firewall hides it from attackers anyway','Port 443 can’t be attacked','The implicit deny protects it'],correct:0,
   steps:['An allow rule opens port 443 on the catalog to everyone.','Scans and attacks can reach it through that rule.','So the service itself has to be secure.']},
  {id:'stateless',kind:'test',lvl:'ap',q:'On a stateless firewall, a laptop’s web requests go out but pages never load. Why?',choices:['The replies to its temporary port have no allow rule','The requests used the wrong port','Stateless firewalls block all web traffic, requests and replies alike','The DNS server was turned off'],correct:0,
   steps:['Replies come back to a temporary (ephemeral) port on the laptop.','A stateless firewall judges each packet alone.','Without a rule allowing those replies, they are dropped.']}
]};
/* ---------- logs (detecting attacks in logs) ---------- */
const lgCard=(ctx,k,rows)=>card(ctx,k,596,78,196,rows);
L.logs={
  goals:{
    bio:['What logs record, and why analysts start with the shape of the day','How searching and filtering cut hundreds of lines to a few','How an alert rule flags suspicious activity automatically','Why a threshold trades caught attacks against false alarms'],
    honors:['How counting by address points to one attacker','How the time window changes what a rule catches'],
    ap:['How precision and recall measure an alert rule','How shared addresses and accounts link separate log lines into one incident']},
  matters:'Every school, bank and hospital writes logs, and most break-ins are discovered by reading them. Choosing alert rules is a real trade-off: too sensitive and people stop paying attention, too relaxed and attacks slip by.',
  steps:[
    {key:'logs',title:'Three logs, one day',run:seq('logs','Three logs'),pause:true,focus:foc('logs','Three logs'),
     see:'One school day of three logs: sign-ins, firewall and web server. Each bar counts 15 minutes of lines; red means failures.',
     why:'A <b>log</b> is a record a system writes as things happen. With 410 lines, analysts start with the shape of the day.'},
    {key:'spike',title:'Spikes are where to look',run:seq('logs','Three logs'),pause:true,focus:foc('logs','Spikes are'),
     see:'A tall red spike in the morning sign-in lane: dozens of failed sign-ins in a few minutes.',
     why:'Most of the day looks like routine school traffic. A spike stands out from normal use, so that is where analysts look first.'},
    {key:'search',title:'Search and filter',run:seq('logs','Three logs','Search and filter'),pause:true,focus:foc('logs','Search and filter'),
     see:'The search keeps only failed sign-ins from 7 to 8 a.m. Matching lines turn blue and fill the table below the stage.',
     why:'Filtering cuts hundreds of lines to the few worth reading, like searching your email instead of scrolling through it.'},
    {key:'count',lvl:'honors',title:'Count by address',run:seq('logs','Three logs','Count by address'),pause:true,focus:foc('logs','Count by address'),
     see:'The same filtered lines, counted by the address they came from. The counts are in the panel below the stage.',
     why:'One address made almost all of the failures. That is the address to report, and to block.'},
    {key:'rule',title:'Write an alert rule',run:seq('logs','Write an alert rule'),pause:true,focus:foc('logs','Write an alert rule'),
     see:'The rule: alert when one address fails 10 sign-ins in 10 minutes. Each dot is one address on one day.',
     why:'Dots right of the red line raise alerts. Green: attacks caught. Red: attacks missed. Orange: <b>false alarms</b>, real people.'},
    {key:'q',title:'Your question: lower the limit to 3?',run:seq('logs','Write an alert rule','Lower threshold'),pause:true,focus:foc('logs','Lower threshold'),
     see:'The threshold drops from 10 to 3. Watch the orange dots, and read the card.',
     why:'It catches no more attacks, 8 of 14 either way. But false alarms jump from 14 to 75, because plenty of real people mistype a password three times.',
     overlay(sim,ctx,LH,k){lgCard(ctx,k,[[FL(sim,'fp',0),{w:800,c:'#b5651d'}],[FL(sim,'fn',0)]]);}},
    {key:'high',title:'Too high misses attacks',set:{mode:'alerts',thr:40},fresh:true,pause:true,focus:[[10,54,782,200]],
     cause:{from:{thr:10},delay:0.8,dur:0.8,label:'Alert threshold N'},
     see:'Now the threshold rises to 40. Watch the green dots turn red.',
     why:'Only 2 of the 14 attacks trip it. A good threshold sits between where people’s typos stop and where attackers start.',
     overlay(sim,ctx,LH,k){lgCard(ctx,k,[[FL(sim,'fn',0),{w:800,c:RED}],[FL(sim,'fp',0)]]);}},
    {key:'pr',lvl:'ap',title:'Precision and recall',run:seq('logs','Precision and recall'),pause:true,focus:foc('logs','Precision and recall'),
     see:'Two curves across every threshold. <b>Precision</b>: the share of alerts that are real. <b>Recall</b>: the share of attacks caught.',
     why:'Raising the threshold raises precision but lowers recall. No setting gets both to 100%, so analysts choose the trade-off they can live with.'},
    {key:'corr',lvl:'ap',title:'Correlate into one incident',run:seq('logs','Correlate into one'),pause:true,focus:foc('logs','Correlate into one'),
     see:'Five log lines from different systems: the morning guessing, a sign-in on jlee, a sign-in from Lisbon, and a gradebook download.',
     why:'They share addresses and an account, so they link into one incident: a stolen password used later from far away. Linking is what turns lines into a story.'}
  ],
  useIt:[
    {do:'Open your email or school account’s recent sign-in activity and look for places or devices you don’t know.',why:'That page is a log of your own account. An unfamiliar sign-in is a spike worth checking.'},
    {do:'When an app sends too many alerts, don’t just mute them all; change the setting.',why:'Too many false alarms trains people to ignore alerts, which is exactly when a real one slips through.'},
    {do:'If you get a “new sign-in” alert you didn’t cause, change your password and turn on MFA.',why:'That alert came from a rule watching the logs for you. Acting fast stops the next step of an attack.'}],
  tryIt:[{title:'your own threshold (10 minutes)',steps:['Ask five people how many times they mistyped their phone passcode in the last week.','Pick a number that would mean “someone else is trying.”','Check how many of the five your rule would have flagged.'],look:'Set it too low and honest people trip it; too high and a real guesser gets many tries.'}]
};
R.logs={questions:[
  {id:'spike',kind:'test',lvl:'bio',q:'A sign-in log shows dozens of failures from one address in five minutes. What is the most likely cause?',choices:['Someone guessing passwords','A student who forgot their password once','The server’s clock running fast','A normal busy morning at school'],correct:0,
   steps:['One person mistyping makes a few failures.','Dozens in minutes from one address is far beyond typos.','That pattern points to password guessing.']},
  {id:'filter',kind:'test',lvl:'bio',q:'Why do analysts filter logs, for example to “failed sign-ins from 7 to 8 a.m.”?',choices:['To cut hundreds of lines to the few worth reading','To delete the evidence they don’t need before the case goes to court','To make the server run faster','To hide the attack from the attacker'],correct:0,
   steps:['Logs hold far too many lines to read one by one.','A filter keeps only lines matching the question.','The few left are the ones worth a close look.']},
  {id:'fp',kind:'test',lvl:'bio',q:'An alert fires on a teacher who mistyped her password 4 times. What is that called?',choices:['A false alarm (false positive)','A missed attack (false negative)','A true alert (true positive)','A correlated incident'],correct:0,
   steps:['The rule raised an alert.','But no attack happened.','An alert with no attack behind it is a false alarm.']},
  {id:'lower',kind:'test',lvl:'bio',q:'Lowering an alert threshold from 10 failed sign-ins to 3 mostly does what?',choices:['Adds false alarms from people who mistype','Catches far more of the real attacks','Stops every attack before it starts','Has no effect on the number of alerts'],correct:0,
   steps:['Attackers make many failures, so most already pass 10.','At 3, ordinary typos also trip the rule.','In the case, false alarms went from 14 to 75 with no more attacks caught.']},
  {id:'high',kind:'test',lvl:'bio',q:'What is the risk of setting the threshold very high, like 40 failures?',choices:['Many real attacks never trip the alert','Every typo raises an alert','The logs fill up and stop recording new lines','Attackers can see the threshold'],correct:0,
   steps:['Careful attackers make fewer, slower guesses.','A high threshold ignores anything below it.','In the case, only 2 of 14 attacks reached 40.']},
  {id:'prec',kind:'test',lvl:'ap',q:'A rule raises 20 alerts in a month, and 5 are real attacks. What is its precision?',num:{ans:25,tol:0.5,unit:'%'},
   steps:['Precision = real alerts ÷ all alerts.','5 ÷ 20 = 0.25.','= 25%.']},
  {id:'corr',kind:'test',lvl:'ap',q:'What links separate log lines from different systems into one incident?',choices:['Shared addresses, accounts and close times','Lines that happen to have the same length','Lines written by the same server','Lines with the most red errors'],correct:0,
   steps:['Each system logs its own events.','The same address or account appearing across systems connects them.','Put in time order, they show one attack from start to finish.']}
]};
BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();

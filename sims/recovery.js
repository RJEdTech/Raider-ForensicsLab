(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,monospace';

/* ---------- SHA-256 (synchronous, UTF-8). Checked against "abc" → ba7816bf…, "" → e3b0c442… ---------- */
const K256=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256Bytes(b){b=b.slice();const l=b.length;b.push(0x80);while(b.length%64!==56)b.push(0);const hi=Math.floor(l*8/4294967296),lo=(l*8)>>>0;
  b.push(hi>>>24&255,hi>>>16&255,hi>>>8&255,hi&255,lo>>>24&255,lo>>>16&255,lo>>>8&255,lo&255);
  let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const w=new Array(64),ror=(x,n)=>x>>>n|x<<(32-n);
  for(let i=0;i<b.length;i+=64){for(let t=0;t<16;t++)w[t]=(b[i+4*t]<<24|b[i+4*t+1]<<16|b[i+4*t+2]<<8|b[i+4*t+3])>>>0;
    for(let t=16;t<64;t++){const s0=ror(w[t-15],7)^ror(w[t-15],18)^w[t-15]>>>3,s1=ror(w[t-2],17)^ror(w[t-2],19)^w[t-2]>>>10;w[t]=(w[t-16]+s0+w[t-7]+s1)>>>0;}
    let a=h[0],bb=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for(let t=0;t<64;t++){const S1=ror(e,6)^ror(e,11)^ror(e,25),ch=e&f^~e&g,t1=(hh+S1+ch+K256[t]+w[t])>>>0,S0=ror(a,2)^ror(a,13)^ror(a,22),mj=a&bb^a&c^bb&c,t2=(S0+mj)>>>0;hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0;}
    h=[h[0]+a,h[1]+bb,h[2]+c,h[3]+d,h[4]+e,h[5]+f,h[6]+g,h[7]+hh].map(x=>x>>>0);}
  return h.map(x=>x.toString(16).padStart(8,'0')).join('');}

/* ---------- file types: real header and trailer bytes ---------- */
const NC=64,CS=4096,COLS=8;
const TYPES={
  jpg:{l:'JPEG photo',head:[0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,0x00,0x48],foot:[0xFF,0xD9],sig:'FF D8 FF',end:'FF D9'},
  png:{l:'PNG image',head:[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52],foot:[0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82],sig:'89 50 4E 47 (.PNG)',end:'IEND AE 42 60 82'},
  pdf:{l:'PDF document',head:[0x25,0x50,0x44,0x46,0x2D,0x31,0x2E,0x37,0x0A,0x25,0xE2,0xE3,0xCF,0xD3,0x0A,0x31],foot:[0x25,0x25,0x45,0x4F,0x46,0x0A],sig:'25 50 44 46 (%PDF)',end:'%%EOF'},
  zip:{l:'Office file (ZIP)',head:[0x50,0x4B,0x03,0x04,0x14,0x00,0x06,0x00,0x08,0x00,0x00,0x00,0x21,0x00,0x62,0xEE],foot:[0x50,0x4B,0x05,0x06,0x00,0x00,0x00,0x00],sig:'50 4B 03 04 (PK)',end:'50 4B 05 06'},
  mp3:{l:'MP3 audio',head:[0x49,0x44,0x33,0x03,0x00,0x00,0x00,0x00,0x0F,0x76,0x54,0x49,0x54,0x32,0x00,0x00],foot:null,sig:'49 44 33 (ID3)',end:'none'},
  txt:{l:'Plain text',head:null,foot:null,sig:'none',end:'none'}};
const extType=n=>{const e=n.split('.').pop();return e==='jpg'?'jpg':e==='png'?'png':e==='pdf'?'pdf':(e==='docx'||e==='xlsx')?'zip':e==='mp3'?'mp3':'txt';};
const TEXT={'chat.txt':'ari: deleting receipts.jpg and the budget tonight\njo: ok. nobody checks the club usb anyway\n','notes.txt':'lab 4 due friday. bring goggles. ask about titration data\n','diary.txt':'today the robotics team finally got the arm to lift the cube\n'};
const PALF=['#2d63c4','#18794a','#a3570f','#7140d6','#0e7c86','#a63d6b','#56658a','#7a6a12','#3d7a3d','#9b4d2b','#4a5fc1','#8a3fa0'];
const TAGS='DEFGHJKLMNPQSUVWXYZ';
const EVID={'receipt.jpg':{tag:'R',col:'#b8122d'},'budget.xlsx':{tag:'B',col:'#1f6f8b'},'chat.txt':{tag:'C',col:'#7a4fb0'}};

/* ---------- the drive model ---------- */
function newDrive(slots){return {cl:Array.from({length:NC},()=>({f:0,part:0,live:false,zero:true,slack:null})),files:{},entries:new Array(slots).fill(0),ptr:0,uid:0,day:0,ssd:false,ntag:0,ntemp:0,destroyed:false,flash:{}};}
const nCl=size=>Math.max(1,Math.ceil(size/CS));
function freeList(d){const out=[];for(let i=0;i<NC;i++){const c=(d.ptr+i)%NC;if(!d.cl[c].live)out.push(c);}return out;}
function pickClusters(d,n){const fr=freeList(d);if(fr.length<n)return null;
  // file systems prefer one contiguous run (next-fit from the roving pointer); otherwise they fragment
  for(let i=0;i<fr.length;i++){const s=fr[i];if(s+n>NC)continue;let ok=true;for(let j=0;j<n;j++)if(d.cl[s+j].live){ok=false;break;}if(ok){const run=[];for(let j=0;j<n;j++)run.push(s+j);return run;}}
  return fr.slice(0,n);}
function takeEntry(d,uid){let e=d.entries.indexOf(0);
  if(e<0){e=d.entries.findIndex(u=>u&&d.files[u].status==='deleted');if(e<0)return -1;d.files[d.entries[e]].entry=null;}
  d.entries[e]=uid;return e;}
function putData(d,uid,c,part,used){const prev=d.cl[c];let slack=null;
  if(used<CS){if(prev.f&&!prev.zero)slack={f:prev.f,part:prev.part,bytes:CS-used};else if(prev.slack)slack={f:prev.slack.f,part:prev.slack.part,bytes:Math.min(prev.slack.bytes,CS-used)};}
  d.cl[c]={f:uid,part,live:true,zero:false,slack};d.flash[c]=1;}
function writeFile(d,o){const n=nCl(o.size);const cls=o.clusters||pickClusters(d,n);if(!cls)return null;const uid=++d.uid;const e=takeEntry(d,uid);if(e<0){d.uid--;return null;}
  const ev=EVID[o.name];const f={uid,name:o.name,type:extType(o.name),size:o.size,n,clusters:cls.slice(),status:'active',entry:e,temp:!!o.temp,evidence:!!ev,born:d.day,
    tag:ev?ev.tag:o.temp?'t':pickTag(d,o.name),col:ev?ev.col:o.temp?'#64707d':PALF[(uid*5)%PALF.length]};
  d.files[uid]=f;cls.forEach((c,j)=>putData(d,uid,c,j,j===n-1?o.size-(n-1)*CS:CS));d.ptr=(cls[cls.length-1]+1)%NC;return f;}
function pickTag(d,name){const used=new Set(Object.values(d.files).filter(f=>f.status==='active').map(f=>f.tag));const first=name[0].toUpperCase();
  if(!'RBCT'.includes(first)&&!used.has(first)&&/[A-Z]/.test(first))return first;for(const t of TAGS)if(!used.has(t))return t;return TAGS[d.ntag++%TAGS.length];}
function appendFile(d,uid,newSize){const f=d.files[uid],add=nCl(newSize)-f.n;const fr=freeList(d).slice(0,add);if(fr.length<add)return;
  const lastOld=f.clusters[f.n-1];d.cl[lastOld].slack=null;f.size=newSize;fr.forEach((c,j)=>{const part=f.n+j;f.clusters.push(c);putData(d,uid,c,part,part===nCl(newSize)-1?newSize-(nCl(newSize)-1)*CS:CS);});
  f.n=nCl(newSize);d.ptr=(fr[fr.length-1]+1)%NC;}
function trim(d,c){d.cl[c]={f:0,part:0,live:false,zero:true,slack:null};d.flash[c]=1;}
function deleteFile(d,uid){const f=d.files[uid];if(!f||f.status!=='active')return;f.status='deleted';f.delDay=d.day;f.clusters.forEach(c=>{if(d.cl[c].f===uid){d.cl[c].live=false;if(d.ssd)trim(d,c);}});}
function dayOfUse(d,seed){d.day++;const r=rng(seed*7919+d.day*104729);
  Object.values(d.files).forEach(f=>{if(f.temp&&f.status==='active'&&d.day-f.born>=3)deleteFile(d,f.uid);});
  const k=r()<0.7?1:2;for(let i=0;i<k;i++){const ty=['jpg','png','txt','pdf'][Math.floor(r()*4)],nm=['cache','tab','update','thumb'][Math.floor(r()*4)]+'_'+(++d.ntemp)+'.'+(ty==='txt'?'log':ty);
    writeFile(d,{name:nm,size:1000+Math.floor(r()*5200),temp:true});}}
function wipeFree(d){for(let c=0;c<NC;c++)if(!d.cl[c].live)trim(d,c);}

/* ---------- recovery methods ---------- */
function intact(d,f,j){const x=d.cl[f.clusters[j]];return !d.destroyed&&x.f===f.uid&&x.part===j&&!x.zero&&(f.status==='active'||!x.live);}
function nIntact(d,f){let k=0;for(let j=0;j<f.n;j++)if(intact(d,f,j))k++;return k;}
function byTable(d,f){if(d.destroyed||f.entry===null)return {found:false,good:0,n:f.n,why:'entry gone'};return {found:true,good:nIntact(d,f),n:f.n};}
function byCarve(d,f){const T=TYPES[f.type];if(!T.head)return {found:false,good:0,n:f.n,why:'no signature'};
  if(!intact(d,f,0)||d.cl[f.clusters[0]].live)return {found:false,good:0,n:f.n,why:'header overwritten'};
  const c0=f.clusters[0];let k=0;while(k<f.n&&c0+k<NC){const x=d.cl[c0+k];if(x.f===f.uid&&x.part===k&&!x.live&&!x.zero)k++;else break;}return {found:true,good:k,n:f.n};}
function byKeyword(d,f){if(f.type!=='txt')return {found:false,good:0,n:f.n,why:'not text'};const g=nIntact(d,f);return {found:g>0,good:g,n:f.n};}
function slackOf(d,f){let b=0;d.cl.forEach(x=>{if(x.slack&&x.slack.f===f.uid&&!d.destroyed&&!x.zero)b+=x.slack.bytes;});return b;}
const rate=r=>!r.found?0:r.good/r.n;
const verdict=r=>!r.found||r.good===0?'none':r.good===r.n?'full':'part';
function bestOf(d,f){const m=[byTable(d,f),byCarve(d,f)];if(atLeast('ap'))m.push(byKeyword(d,f));return m.reduce((a,b)=>rate(b)>rate(a)?b:a);}

/* ---------- the case drive ---------- */
const PERMS=['essay_draft.docx','club_logo.png','song_demo.mp3','flyer.pdf','team_photo.jpg','schedule.xlsx','notes_bio.txt','poster.png','slides.pdf','interview.mp3','map.jpg','minutes.docx','robot_cad.pdf','lab_photo.jpg'];
function caseDrive(fill,ssd,days,seed){const d=newDrive(24),r=rng(seed);const perm=i=>({name:PERMS[i%PERMS.length],size:5000+Math.floor(r()*9000)});const temp=()=>({name:'old_'+(++d.ntemp)+'.tmp',size:1500+Math.floor(r()*5000),temp:true});
  const live=()=>d.cl.filter(x=>x.live).length,temps=[];let pi=0;
  writeFile(d,perm(pi++));writeFile(d,perm(pi++));
  const bud=writeFile(d,{name:'budget.xlsx',size:8000});temps.push(writeFile(d,temp()));writeFile(d,perm(pi++));temps.push(writeFile(d,temp()));
  appendFile(d,bud.uid,15700);const rec=writeFile(d,{name:'receipt.jpg',size:22800});const chat=writeFile(d,{name:'chat.txt',size:3100});
  const target=Math.round(fill/100*NC);let guard=0;
  while(live()<target&&guard++<40){const f=writeFile(d,perm(pi++));if(!f)break;if(r()<0.5&&live()<target-2)temps.push(writeFile(d,temp()));}
  temps.forEach(t=>{if(t)deleteFile(d,t.uid);});
  d.ssd=ssd;[bud,rec,chat].forEach(f=>deleteFile(d,f.uid));
  for(let i=0;i<days;i++)dayOfUse(d,seed);d.flash={};d.ev=[rec.uid,bud.uid,chat.uid];return d;}
function sandboxDrive(){const d=newDrive(12);[['essay.docx',10500],['song.mp3',15000],['vacation.jpg',19000],['notes.txt',900]].forEach(([n,s])=>writeFile(d,{name:n,size:s}));d.flash={};return d;}
function eraseDrive(method,ssd){const d=caseDrive(50,ssd,1,1802);
  if(method==='quick'){d.entries.fill(0);Object.values(d.files).forEach(f=>{f.entry=null;if(f.status==='active')f.status='deleted';});d.cl.forEach((x,c)=>{x.live=false;if(ssd)trim(d,c);});}
  else if(method==='full'){d.entries.fill(0);Object.values(d.files).forEach(f=>{f.entry=null;f.status='deleted';});for(let c=0;c<NC;c++)trim(d,c);}
  else if(method==='destroy'){d.destroyed=true;}
  d.flash={};return d;}

/* ---------- state helpers ---------- */
function drive(sim){const p=sim.p,st=sim.st;
  if(p.mode==='sandbox')return st.sb;
  if(p.mode==='case'){const key=Math.round(p.days)+'|'+Math.round(p.fill)+'|'+p.media;if(st.caseKey!==key){st.caseKey=key;st.cd=caseDrive(Math.round(p.fill),p.media==='ssd',Math.round(p.days),1802);st.res={};st.img=null;st.check=null;}return st.cd;}
  const key=p.method+'|'+p.media;if(st.eraseKey!==key){st.eraseKey=key;st.ed=eraseDrive(p.method,p.media==='ssd');st.res={};}return st.ed;}
const evFiles=d=>(d.ev||[]).map(u=>d.files[u]);
function pct(list,fn){const n=list.reduce((a,f)=>a+f.n,0);if(!n)return 0;return 100*list.reduce((a,f)=>{const r=fn(f);return a+(r.found?r.good:0);},0)/n;}
function driveHash(d){const bytes=[];d.cl.forEach(x=>{bytes.push(x.zero?0:x.f&255,x.part&255,x.live?1:0);});d.entries.forEach(u=>bytes.push(u&255));return sha256Bytes(bytes);}
function byteAt(f,part,off){if(!f)return 0;if(f.type==='txt'){const s=TEXT[f.name]||'log entry: cache refreshed ok\n';const i=part*CS+off;return s.charCodeAt(i%s.length)||32;}
  const T=TYPES[f.type],last=part===f.n-1,used=last?f.size-(f.n-1)*CS:CS;
  if(part===0&&T.head&&off<T.head.length)return T.head[off];if(last&&T.foot&&off>=used-T.foot.length&&off<used)return T.foot[off-(used-T.foot.length)];
  let x=(f.uid*2654435761^(part*40503+off*2246822519))>>>0;x^=x>>>15;x=Math.imul(x,0x2c1b3c6d)>>>0;x^=x>>>12;return x&255;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}
function scanAll(sim,kind){const d=drive(sim),st=sim.st;st.res=st.res||{};const fn=kind==='table'?byTable:kind==='carve'?byCarve:byKeyword;const out={};
  Object.values(d.files).forEach(f=>{if(f.status!=='active')out[f.uid]=fn(d,f);});st.res[kind]=out;st.last=kind;sim.vis.scan={kind,t:0};}
const FT=[{v:'photo.jpg',l:'Photo (JPEG, 18 KB)',s:18500},{v:'report.pdf',l:'Report (PDF, 11 KB)',s:11000},{v:'budget2.xlsx',l:'Spreadsheet (XLSX, 7 KB)',s:7300},{v:'diary.txt',l:'Text note (TXT, 2.6 KB)',s:2600},{v:'scan.png',l:'Scan (PNG, 14 KB)',s:13900}];
function sbSelected(sim){const d=sim.st.sb,f=d.files[sim.st.selF];if(f&&f.status==='active')return f;const act=Object.values(d.files).filter(f=>f.status==='active');return act[act.length-1]||null;}
function doSave(sim){const st=sim.st,d=st.sb,t=FT.find(x=>x.v===sim.p.ftype)||FT[0];d.ssd=sim.p.media==='ssd';st.nsave=(st.nsave||0)+1;
  const base=t.v.split('.'),name=base[0]+'_'+st.nsave+'.'+base[1];const f=writeFile(d,{name,size:t.s});st.last=f?'save':'full';if(f)st.selF=f.uid;st.res={};}
function doDelete(sim){const st=sim.st,d=st.sb;d.ssd=sim.p.media==='ssd';const f=sbSelected(sim);if(!f){st.last='none';return;}deleteFile(d,f.uid);st.lastDel=f.uid;st.last='delete';st.res={};}
function doDay(sim,n){const st=sim.st,d=st.sb;d.ssd=sim.p.media==='ssd';for(let i=0;i<(n||1);i++)dayOfUse(d,77);st.last='day';st.res={};}

/* ---------- layout ---------- */
const GX=16,GY=58,CW=48,GAP=5,RX=458;
const cellXY=c=>[GX+(c%COLS)*(CW+GAP),GY+Math.floor(c/COLS)*(CW+GAP)];

const SIM={
  id:'recovery',hash:'recovery',apUnit:18,order:4,tab:'Deleted file recovery',kind:'Simulation',prereq:['filesig'],next:['metadata','casefile'],
  card:'Delete files from a drawn USB drive, keep using it, then recover what survives with the file table and by carving for file signatures.',
  title:'Deleted files: what survives and how investigators get it back',
  lede:{bio:'Deleting a file does not erase it. Save, delete and keep using a drive to see what really happens, then investigate how much of a suspect’s deleted evidence survives.',
        honors:'Compare recovery from the file table with file carving, see how fragmentation and a fuller drive change the outcome, and find out why SSDs with TRIM are different.',
        ap:'Work at the byte level: header and trailer signatures, slack space at the end of a cluster, and keyword searches for files that have no signature.'},
  scale:{bio:'A tiny 256 KB USB drive drawn as 64 clusters of 4 KB each. Real drives have millions of clusters, so real deleted files often survive for months.',
         ap:'64 clusters × 4,096 bytes = 262,144 bytes. Each square is one cluster, the smallest unit the file system hands out.'},
  timeless:true,animated:true,graph:false,aspect:16/10,chChange:0.6,chReveal:2,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'case',lvl:'bio',noTrial:true,options:[{v:'case',l:'Investigate'},{v:'sandbox',l:'Try it yourself'},{v:'erase',l:'Ways to erase'}],onChange:syncMode},
    {id:'days',label:'Days the suspect used the drive after deleting',type:'range',min:0,max:30,step:1,def:1,unit:' days',lvl:'bio',modes:['case'],help:'Each day of use saves and deletes small temporary files.'},
    {id:'fill',label:'How full the drive was',type:'range',min:30,max:90,step:10,def:50,unit:'%',lvl:'honors',modes:['case'],help:'Space taken by files the suspect kept.'},
    {id:'ftype',label:'File to save',type:'select',def:'photo.jpg',lvl:'bio',noTrial:true,modes:['sandbox'],options:FT.map(t=>({v:t.v,l:t.l}))},
    {id:'method',label:'How the suspect tried to erase it',type:'seg',def:'delete',lvl:'bio',modes:['erase'],options:[{v:'delete',l:'Delete'},{v:'quick',l:'Quick format'},{v:'full',l:'Full format (zeros)'},{v:'destroy',l:'Destroy the drive'}]},
    {id:'media',label:'Kind of drive',type:'seg',def:'hdd',lvl:'honors',modes:['case','sandbox','erase'],options:[{v:'hdd',l:'Hard drive or USB stick'},{v:'ssd',l:'SSD with TRIM'}],help:'With TRIM, the SSD erases freed blocks on its own soon after a delete.'},
    {id:'cl',label:'Cluster to view in hex',type:'range',min:0,max:63,step:1,def:16,unit:'',lvl:'ap',noTrial:true,modes:['case','sandbox','erase'],help:'Or click a square on the drive.'}
  ],
  actions:[
    {id:'image',label:'Image and hash the drive',lvl:'bio',primary:true,modes:['case'],run(sim){const d=drive(sim);sim.st.img={h:driveHash(d),day:d.day};sim.st.last='image';}},
    {id:'table',label:'Recover from the file table',lvl:'bio',modes:['case','sandbox','erase'],run(sim){scanAll(sim,'table');}},
    {id:'carve',label:'Carve free space for signatures',lvl:'bio',modes:['case','sandbox','erase'],run(sim){scanAll(sim,'carve');}},
    {id:'kw',label:'Search free space for text',lvl:'ap',modes:['case','sandbox','erase'],run(sim){scanAll(sim,'kw');}},
    {id:'save',label:'Save the file',lvl:'bio',primary:true,modes:['sandbox'],run(sim){doSave(sim);}},
    {id:'del',label:'Delete the selected file',lvl:'bio',modes:['sandbox'],run(sim){doDelete(sim);}},
    {id:'day',label:'Use the drive for a day',lvl:'bio',modes:['sandbox'],run(sim){doDay(sim,1);}},
    {id:'wipe',label:'Wipe free space',lvl:'honors',modes:['sandbox'],run(sim){wipeFree(sim.st.sb);sim.st.last='wipe';sim.st.res={};}},
    {id:'fresh',label:'Start with a fresh drive',lvl:'bio',modes:['sandbox'],run(sim){sim.st.sb=sandboxDrive();sim.st.selF=3;sim.st.res={};sim.st.last='fresh';sim.st.nsave=0;}}
  ],
  init(){return {sb:sandboxDrive(),selF:3,res:{},last:'',find:{},check:null,img:null,caseKey:'',eraseKey:'',nsave:0};},
  step(sim,dt){const d=drive(sim);for(const c in d.flash){d.flash[c]-=dt*0.9;if(d.flash[c]<=0)delete d.flash[c];}if(sim.vis.scan)sim.vis.scan.t+=dt;},
  metrics:[
    {id:'ondrive',label:'Deleted evidence still on the drive',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['case','erase'],get:s=>{const d=drive(s);return pct(evFiles(d),f=>({found:true,good:nIntact(d,f)}));}},
    {id:'ptable',label:'Recovered with the file table (after you run it)',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['case','erase'],get:s=>{const d=drive(s);if(!s.st.res||!s.st.res.table)return NaN;return pct(evFiles(d),f=>byTable(d,f));}},
    {id:'pcarve',label:'Recovered by carving (after you run it)',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['case','erase'],get:s=>{const d=drive(s);if(!s.st.res||!s.st.res.carve)return NaN;return pct(evFiles(d),f=>byCarve(d,f));}},
    {id:'over',label:'Evidence clusters overwritten',unit:'of 11',lvl:'honors',min:0,max:11,d:0,modes:['case'],get:s=>{const d=drive(s);return evFiles(d).reduce((a,f)=>a+f.n-nIntact(d,f),0);}},
    {id:'slack',label:'Evidence bytes left in slack',unit:'bytes',lvl:'ap',min:0,max:null,d:0,modes:['case'],get:s=>{const d=drive(s);return evFiles(d).reduce((a,f)=>a+slackOf(d,f),0);}},
    {id:'free',label:'Free clusters',unit:'of 64',lvl:'bio',min:0,max:64,d:0,modes:['sandbox'],get:s=>s.st.sb.cl.filter(x=>!x.live).length},
    {id:'remn',label:'Free clusters still holding old data',unit:'clusters',lvl:'bio',min:0,max:64,d:0,modes:['sandbox'],get:s=>s.st.sb.cl.filter(x=>!x.live&&!x.zero&&x.f).length},
    {id:'recov',label:'Deleted files fully recoverable',unit:'files',lvl:'bio',min:0,max:null,d:0,modes:['sandbox'],get:s=>{const d=s.st.sb;return Object.values(d.files).filter(f=>f.status==='deleted'&&verdict(bestOf(d,f))==='full').length;}}
  ],
  narrate(sim){const p=sim.p,st=sim.st,d=drive(sim);
    if(p.mode==='erase'){const ssd=p.media==='ssd';
      if(p.method==='destroy')return 'The drive is physically broken. <b>Nothing can be read with normal tools</b>, which is why investigators photograph and bag damaged media for a specialist lab instead.';
      if(p.method==='full')return 'A full format writes zeros over every cluster. <b>One pass of overwriting is enough</b> on modern drives: no carving or table trick can bring the data back.';
      if(ssd)return p.method==='quick'?'A quick format on an SSD sends TRIM for the whole drive, so the controller erases every block. <b>Almost nothing survives.</b>':'The SSD was told which blocks were freed (TRIM) and erased them in the background. <b>Deleted files read back as zeros.</b>';
      if(p.method==='quick')return 'A quick format only writes a new, empty file table. <b>Every cluster still holds its old data</b>, so carving for signatures brings back files with headers.';
      return 'The files were only deleted: their table entries are marked deleted and their clusters marked free. <b>The data is still there</b> until something overwrites it.';}
    if(p.mode==='sandbox'){const f=d.files[st.lastDel];
      switch(st.last){case 'save':return 'The file system wrote the new file into free clusters, starting from where it last wrote. <b>Anything old in those clusters is overwritten.</b>';
        case 'full':return 'There is no room for that file. Delete something or start with a fresh drive.';
        case 'delete':return d.ssd?'The SSD got a TRIM command and erased <b>'+(f?f.name:'the file')+'</b>’s blocks. Deleted data on an SSD usually reads back as zeros within minutes.':'<b>'+(f?f.name:'The file')+'</b> is now marked deleted in the table and its clusters are marked free, but <b>the data is still there</b> (striped squares) until new files overwrite it.';
        case 'day':return 'A day of normal use saved and deleted temporary files. New data lands in free clusters, so <b>deleted files slowly get overwritten</b>. Day '+d.day+' since the drive was fresh.';
        case 'wipe':return 'Every free cluster was overwritten with zeros. Files you deleted earlier are <b>gone for good</b>; files still in use are untouched.';
        case 'table':return 'The file table still lists deleted files with their clusters. Where those clusters are not yet overwritten, the file comes back <b>complete, with its name</b>.';
        case 'carve':return 'Carving ignores the table and scans free clusters for known <b>header signatures</b>, reading forward until the trailer. It finds files whose table entries are gone, but it loses the names and breaks on fragmented files.';
        case 'kw':return 'A keyword search reads free clusters as text. It finds text files, which have no signature to carve for.';
        case 'fresh':return 'A fresh drive with four files. <b>Select a file in the panel below and delete it</b>, then use the drive and try to get it back.';}
      return 'Save files, delete one, keep using the drive, then try to recover it. Click a square to select its file.';}
    const ev=evFiles(d),gone=ev.filter(f=>nIntact(d,f)===0).length,part=ev.filter(f=>{const k=nIntact(d,f);return k>0&&k<f.n;}).length;
    const days=Math.round(p.days);let s=days===0?'The drive was seized right after the files were deleted. ':'The suspect kept using the drive for '+days+' day'+(days>1?'s':'')+' after deleting. ';
    if(p.media==='ssd')return s+'This drive is an SSD with TRIM, so the freed blocks were erased by the drive itself. <b>The evidence reads back as zeros.</b>';
    if(!gone&&!part)s+='<b>All three deleted files are still physically on the drive</b>: nothing has overwritten their clusters yet.';
    else s+='New files have reused freed clusters: '+(gone?gone+' evidence file'+(gone>1?'s are':' is')+' completely overwritten':'')+(gone&&part?' and ':'')+(part?part+(gone?'':' evidence file')+(part>1?(gone?' are':'s are'):' is')+' partly overwritten':'')+'. <b>The longer a drive is used, the less survives.</b>';
    return s;},
  infoPanel(sim){const p=sim.p,st=sim.st,d=drive(sim);let h='';
    if(p.mode==='case'){h+='<div class="p-head"><h3>Case DF-18-04: the missing prize money</h3></div><p>The Bramblewood Academy robotics club (fictional) is missing its $600 prize money. The treasurer, Ari Penhallow (fictional), says the receipts were never on the club’s USB drive. A teammate saw Ari deleting files. You have the drive. <b>What can you prove was on it?</b></p>';
      h+='<ol style="margin:0 0 8px;padding-left:20px;font-size:15px"><li>Image and hash the drive so you work on an exact copy.'+(st.img?' <span style="color:var(--good);font-weight:600">Done.</span> SHA-256 of the image: <code style="word-break:break-all">'+st.img.h.slice(0,32)+'…</code>'+(st.res&&(st.res.table||st.res.carve)?' Re-hashed after recovery: '+(driveHash(d)===st.img.h?'<b style="color:var(--good)">still matches</b>, so your work did not change the evidence.':'<b style="color:var(--bad)">changed</b>'):''):'')+'</li>'+
        '<li>Recover from the file table.'+(st.res&&st.res.table?' <span style="color:var(--good);font-weight:600">Done.</span>':'')+'</li><li>Carve free space for file signatures.'+(st.res&&st.res.carve?' <span style="color:var(--good);font-weight:600">Done.</span>':'')+'</li>'+
        (atLeast('ap')?'<li>Search free space for text.'+(st.res&&st.res.kw?' <span style="color:var(--good);font-weight:600">Done.</span>':'')+'</li>':'')+'<li>Record your findings below and check them.</li></ol>';
      h+=resultsTable(sim,d,evFiles(d));
      h+='<p style="font-weight:600;margin-top:10px">Your findings</p><div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 10px;align-items:center">';
      evFiles(d).forEach(f=>{const v=st.find[f.name]||'';h+='<label for="rc-f-'+f.tag+'" style="font-family:'+MONO.replace(/"/g,'&quot;')+'">'+f.name+'</label><select class="sel" id="rc-f-'+f.tag+'" data-fn="'+f.name+'"><option value=""'+(v?'':' selected')+'>Choose…</option><option value="full"'+(v==='full'?' selected':'')+'>Fully recovered</option><option value="part"'+(v==='part'?' selected':'')+'>Partly recovered</option><option value="none"'+(v==='none'?' selected':'')+'>Not recovered</option></select>';});
      h+='</div><div class="row" style="margin-top:8px"><button type="button" class="btn primary" id="rc-check">Check my findings</button></div>';
      if(st.check)h+='<p class="verdict '+(st.check.ok?'ok':'no')+'" style="margin-top:8px">'+(st.check.ok?'Correct.':'Not yet.')+'</p><p>'+st.check.msg+'</p>';
      return h;}
    if(p.mode==='erase'){h+='<div class="p-head"><h3>What each method leaves behind</h3></div><p>The same drive, one day after the evidence was deleted. Choose how the suspect tried to erase it, then run the recovery buttons.</p>';
      h+='<ul style="font-size:15px;padding-left:20px;margin:0 0 8px"><li><b>Delete:</b> table entries marked deleted, data untouched.</li><li><b>Quick format:</b> new empty table, data untouched.</li><li><b>Full format:</b> zeros written over every cluster.</li><li><b>Destroy:</b> the drive can no longer be read.</li>'+(atLeast('honors')?'<li><b>SSD with TRIM:</b> the drive erases freed blocks itself, so even a plain delete usually wipes the data.</li>':'')+'</ul>';
      h+=resultsTable(sim,d,evFiles(d));return h;}
    h+='<div class="p-head"><h3>File table</h3></div><p>This is what the computer reads to list files. Select a file, then use the buttons beside the stage.</p>';
    const rows=d.entries.map((u,i)=>u?[i,d.files[u]]:null).filter(Boolean);
    h+='<div class="tbl-wrap"><table><thead><tr><th>Entry</th><th>Name</th><th>Status</th><th>Clusters</th><th>Size</th><th></th></tr></thead><tbody>'+rows.map(([i,f])=>{
      const sel=sbSelected(sim)===f;return '<tr'+(sel?' style="background:var(--card2)"':'')+'><td>'+i+'</td><td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:'+f.col+';margin-right:6px;vertical-align:-1px"></span>'+f.name+'</td><td>'+(f.status==='active'?'In use':'<b style="color:var(--bad)">Deleted</b>')+'</td><td>'+runs(f.clusters)+'</td><td>'+f.size.toLocaleString('en-US')+' B</td><td>'+(f.status==='active'?'<button type="button" class="btn" data-sel="'+f.uid+'">'+(sel?'Selected':'Select')+'</button>':'')+'</td></tr>';}).join('')+'</tbody></table></div>';
    const del=Object.values(d.files).filter(f=>f.status==='deleted'&&!f.temp);if(del.length)h+=resultsTable(sim,d,del);return h;},
  bindInfo(sim,el){el.querySelectorAll('button[data-sel]').forEach(b=>b.addEventListener('click',()=>{sim.st.selF=+b.dataset.sel;const f=sim.st.sb.files[sim.st.selF];if(f){sim.vis.selC=f.clusters[0];if(atLeast('ap'))BioLab.setValues(sim,{cl:f.clusters[0]});}BioLab.refresh(sim);}));
    el.querySelectorAll('select[data-fn]').forEach(s=>s.addEventListener('change',()=>{sim.st.find[s.dataset.fn]=s.value;}));
    const ck=el.querySelector('#rc-check');if(ck)ck.addEventListener('click',()=>{checkFindings(sim);BioLab.refresh(sim);});},
  onClick(sim,x,y){for(let c=0;c<NC;c++){const [cx,cy]=cellXY(c);if(x>=cx&&x<=cx+CW&&y>=cy&&y<=cy+CW){if(atLeast('ap'))BioLab.setValues(sim,{cl:c});sim.vis.selC=c;
      if(sim.p.mode==='sandbox'){const x0=sim.st.sb.cl[c];if(x0.live)sim.st.selF=x0.f;}sim.infoDirty=true;return;}}},
  onLevel(sim){syncMode(sim);},
  tour:[
    {title:'A drive is a grid of clusters',text:{bio:'Each square is one cluster, a 4 KB block of storage. A file takes as many clusters as it needs. The letters and colors show which file each cluster belongs to.',ap:'Files are stored in whole clusters: a 19,000-byte photo needs ⌈19,000 ÷ 4,096⌉ = 5 clusters.'},
      focus:[GX-6,GY-6,8*(CW+GAP)+7,8*(CW+GAP)+7],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'sandbox'});sim.st.sb=sandboxDrive();sim.st.selF=3;sim.st.last='fresh';}},
    {title:'The file table',text:'The file table lists every file’s name, size and clusters. The computer reads it to show you your files. It is listed beside the drive and in the panel below the stage.',
      focus:[RX-6,28,340,300],speed:1,pause:true},
    {title:'Deleting only changes the table',text:'Delete vacation.jpg. Its entry is marked deleted and its clusters are marked free (striped), but the photo’s bytes are still sitting in those clusters.',
      focus:[GX-6,GY-6,8*(CW+GAP)+7,8*(CW+GAP)+7],speed:1,pause:true,setup(sim){sim.st.selF=3;doDelete(sim);}},
    {title:'Using the drive overwrites free space',text:'Every new file goes into free clusters. After many days of saving and deleting temporary files, some of the deleted photo’s clusters have been reused. Those parts are gone.',
      focus:[GX-6,GY-6,8*(CW+GAP)+7,8*(CW+GAP)+7],speed:1,pause:true,setup(sim){doDay(sim,6);}},
    {title:'Recovering from the file table',text:'If the deleted entry is still in the table, investigators follow its cluster list. Clusters that still hold the file come back, with the original name.',
      focus:[RX-6,28,340,300],speed:1,pause:true,setup(sim){scanAll(sim,'table');}},
    {title:'Carving for signatures',text:{bio:'Carving ignores the table. It scans free space for the first bytes that every file of a type starts with, like FF D8 FF for a JPEG photo, and reads forward from there.',ap:'A carver matches header signatures (FF D8 FF, 89 50 4E 47, %PDF, 50 4B 03 04) and stops at the trailer (FF D9, IEND, %%EOF). It assumes the file is contiguous, so fragments break it.'},
      focus:[GX-6,GY-6,8*(CW+GAP)+7,8*(CW+GAP)+7],speed:1,pause:true,setup(sim){scanAll(sim,'carve');}},
    {lvl:'honors',title:'SSDs with TRIM are different',text:'On an SSD, the computer tells the drive which blocks were freed (TRIM). The drive erases them in the background, so a deleted file usually reads back as zeros within minutes.',
      focus:[GX-6,GY-6,8*(CW+GAP)+7,8*(CW+GAP)+7],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{media:'ssd'});sim.st.selF=1;doDelete(sim);}},
    {lvl:'ap',title:'Slack space',text:'A new file rarely fills its last cluster exactly. The unused end, the slack, still holds bytes from whatever was there before. Squares with a striped strip along the bottom hold old data in their slack.',
      focus:[GX-6,GY-6,8*(CW+GAP)+7,8*(CW+GAP)+7],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',media:'hdd',days:14,fill:50});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case',media:'hdd',days:1,fill:50,method:'delete'});sim.st.sb=sandboxDrive();sim.st.selF=3;sim.st.last='';},
  onChallenge(sim,ch,phase){if(ch&&ch.set){BioLab.setValues(sim,ch.set);drive(sim);[].concat(ch.act||[]).forEach(a=>scanAll(sim,a));}},
  challenges:[
    {lvl:'bio',q:'Watch the drive. When you delete vacation.jpg, what happens to the clusters that hold the photo?',choices:['They are erased right away','They are marked free, but the photo’s data stays until something overwrites it','They move to a hidden recycle area'],correct:1,
     baseline:{mode:'sandbox',media:'hdd'},baselineAction:'fresh',changeAction:'del',changeText:'vacation.jpg deleted',
     explain:{bio:'Only the table entry changed: the squares turned striped (free, data still there). The free-cluster count went up, but the clusters still hold the photo. That is why deleted files can be recovered.'}},
    {lvl:'bio',q:'The suspect keeps using the drive for 30 days after deleting instead of 1 day. How much of the deleted evidence will still be on the drive?',choices:['More','Less','The same'],correct:1,
     baseline:{mode:'case',days:1,fill:50,media:'hdd'},change:{days:30},changeText:'Days of use changed from 1 to 30',
     explain:{bio:'New files are written into free clusters, including the ones the evidence used. After 1 day every evidence cluster survives; after 30 days most have been overwritten. Seize devices quickly and stop using them.'}},
    {lvl:'bio',instant:true,set:{mode:'erase',method:'quick',media:'hdd'},act:'carve',q:'The suspect quick-formats the drive instead. Can carving still bring back receipt.jpg?',choices:['No, formatting erased it','Yes: a quick format only writes a new empty table, so the photo’s bytes are still there','Only its file name comes back'],correct:1,
     explain:{bio:'The carving readout shows the result. A quick format replaces the table but leaves the data, so a carver finds the JPEG header FF D8 FF and reads the whole photo back (without its name).'}},
    {lvl:'honors',q:'Same 6 days of use, but the drive was 90% full instead of 40% full. The deleted evidence will…',choices:['survive longer, because there is less room to write','be overwritten sooner','not be affected'],correct:1,
     baseline:{mode:'case',days:6,fill:40,media:'hdd'},change:{fill:90},changeText:'Drive fullness changed from 40% to 90%',
     explain:{honors:'With little free space, new files have nowhere to go except the clusters the evidence just freed. On a 40% full drive the new files go into empty space first. Watch the “Deleted evidence still on the drive” readout drop.'}},
    {lvl:'honors',instant:true,set:{mode:'erase',method:'delete',media:'ssd'},act:['table','carve'],q:'The suspect’s laptop has an SSD with TRIM turned on (the default). A file deleted yesterday is…',choices:['easy to recover, like on a USB stick','usually unrecoverable: the SSD erased the freed blocks itself','recoverable only by carving'],correct:1,
     explain:{honors:'TRIM tells the SSD which blocks are free, and its controller erases them during garbage collection. All three readouts show 0%. Investigators now image SSDs as fast as possible and look for copies elsewhere: cloud sync, backups, phones.'}},
    {lvl:'honors',instant:true,set:{mode:'case',days:1,fill:50,media:'hdd'},act:'carve',q:'budget.xlsx was saved in two separate pieces (fragmented). Carving from its header, what do you get?',choices:['The whole spreadsheet','Only the first piece: carving reads forward from the header and the second piece is somewhere else','Nothing at all'],correct:1,
     explain:{honors:'The results table shows carving got 2 of 4 clusters. The carver found the ZIP header 50 4B 03 04 and read the clusters right after it, but the file continued elsewhere. The file table still knows where the second piece is, so table recovery gets it all.'}},
    {lvl:'ap',instant:true,set:{mode:'case',days:1,fill:50,media:'hdd'},q:'receipt.jpg is 22,800 bytes on 4,096-byte clusters. How many bytes of slack are at the end of its last cluster?',choices:['1,776 bytes','4,096 bytes','2,048 bytes','0 bytes'],correct:0,
     explain:{ap:'⌈22,800 ÷ 4,096⌉ = 6 clusters = 24,576 bytes. 24,576 − 22,800 = 1,776 bytes of slack. Whatever was in those bytes before the photo was saved is still there.'}},
    {lvl:'ap',instant:true,set:{mode:'case',days:14,fill:50,media:'hdd'},act:'kw',q:'chat.txt is plain text, and its table entry has been reused. Which method can still find its words in free space?',choices:['Carving for its header signature','A keyword search of free space','Neither: text cannot be recovered'],correct:1,
     explain:{ap:'Plain text has no header signature, so carving cannot spot it. But text is readable as it sits, so a search for words like “receipts” finds it. The results table shows the keyword search found chat.txt.'}},
    {lvl:'ap',instant:true,set:{mode:'erase',method:'full',media:'hdd'},act:['table','carve'],q:'Is one pass of zeros over a modern hard drive enough to stop recovery, or does it take many passes?',choices:['One pass is enough','At least 7 passes','35 passes'],correct:0,
     explain:{ap:'NIST SP 800-88 says a single overwrite pass “clears” modern drives. The many-pass methods were designed for 1990s drives with much wider tracks. All readouts show 0%.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does using a drive after deleting a file change what investigators can recover?</p><ol><li>In Investigate, set days of use to 0 and record a trial.</li><li>Record trials at 2, 5, 10, 15, 20 and 30 days.</li><li>Use the Trials graph: plot days (x) against evidence still on the drive (y).</li></ol><p>Describe the shape of your graph. Why should police seize a device quickly and avoid turning it on?</p>',
       honors:'<p><b>Question:</b> How do drive fullness and recovery method change the result?</p><ol><li>Set 6 days of use. Record trials at 30%, 50%, 70% and 90% full.</li><li>At 50% full, record trials at 1, 6 and 14 days and compare the file-table and carving readouts.</li><li>Repeat one trial with “SSD with TRIM”.</li></ol><p>Explain when carving beats the file table, and when the table beats carving. Use budget.xlsx and receipt.jpg as examples.</p>',
       ap:'<p><b>Question:</b> What can the bytes themselves prove?</p><ol><li>At 1 day, view cluster by cluster in hex: find the header and trailer of receipt.jpg.</li><li>Calculate the slack in the last cluster of each evidence file from its size.</li><li>Set 14 days and find an evidence fragment surviving in another file’s slack.</li></ol><p><b>Claim–evidence–reasoning:</b> Make a claim about what Ari deleted and when. Cite the recovery method behind each piece of evidence and how reliable it is.</p>'},
  terms:[{t:'Cluster',d:'The smallest block of storage a file system hands out, here 4 KB. A file uses whole clusters.'},{t:'File table',d:'The list of files on a drive: names, sizes, dates and which clusters each file uses (FAT, NTFS’s MFT).'},
    {t:'Deleted file',d:'A file whose table entry is marked deleted and whose clusters are marked free. The data stays until overwritten.'},{t:'Overwriting',d:'Writing new data into a cluster, destroying what was there before.'},
    {t:'File carving',d:'Recovering files from raw clusters by finding header and trailer signatures, without using the file table.'},{t:'Drive image',d:'An exact bit-for-bit copy of a drive, made through a write blocker and verified with a hash.'},
    {lvl:'honors',t:'Fragmentation',d:'A file stored in more than one run of clusters. Table recovery can follow it; simple carving cannot.'},{lvl:'honors',t:'TRIM',d:'A command that tells an SSD which blocks are no longer used, so it can erase them in advance.'},{lvl:'honors',t:'Quick format',d:'Writes a new empty file table but leaves the data in place.'},
    {lvl:'ap',t:'Slack space',d:'The unused bytes between the end of a file and the end of its last cluster. They can hold data from an older file.'},{lvl:'ap',t:'Signature (magic number)',d:'Fixed bytes at the start of a file type, like FF D8 FF for JPEG or 50 4B 03 04 for ZIP and Office files.'}],
  about:'<p><b>The drive.</b> 64 clusters of 4,096 bytes with a file table of 24 entries (12 in the sandbox). New files go in by next-fit: the file system starts at the cluster after its last write, takes the first contiguous run that fits, and fragments the file only when no run fits. Deleting marks the entry deleted and frees the clusters. A new file reuses an empty entry, or else the lowest-numbered deleted one. This is close to how FAT and NTFS behave, simplified.</p>'+
    '<p><b>Recovery.</b> File-table recovery follows a deleted entry’s cluster list and keeps clusters that still hold that file. Carving scans free clusters for real header signatures (JPEG FF D8 FF, PNG 89 50 4E 47, PDF %PDF, ZIP/Office 50 4B 03 04, MP3 ID3) and reads forward through contiguous clusters to the trailer. Real carvers can also use file structure to rejoin fragments; ours cannot. The keyword search (Deep dive) reads free clusters as text.</p>'+
    '<p><b>Time.</b> Each day of use saves one or two small temporary files and deletes temporary files older than 3 days, so the roving write position sweeps across free space. A real drive has millions of clusters, so the same process takes months instead of days.</p>'+
    '<p><b>SSDs.</b> We erase freed blocks at once when TRIM is on. Real SSDs do it during garbage collection, usually within seconds to minutes, and most return zeros for trimmed blocks right away.</p>'+
    '<p><b>Hashes.</b> The image hash is a real SHA-256 computed in this page over the drive’s cluster map. The case, people and files are fictional. Physical destruction here means no recovery with normal tools; specialist labs can sometimes read pieces of damaged chips or platters.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,d=drive(sim),ap=atLeast('ap');ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    // heading
    const head=p.mode==='sandbox'?'Your USB drive':p.mode==='case'?'Seized USB drive (case DF-18-04)':'Seized USB drive after erasing';
    const tag=(p.mode==='case'?(k>1.3?'Day '+Math.round(p.days):'Day '+Math.round(p.days)+' after deletion'):p.mode==='sandbox'?'Day '+d.day:({delete:'Deleted',quick:'Quick format',full:'Full format',destroy:'Destroyed'})[p.method])+(p.media==='ssd'?' · SSD':'');
    ctx.font='700 '+(13*k)+'px '+FONT;const tw=ctx.measureText(tag).width+14*k;pill(ctx,tag,GX+8*(CW+GAP)-5-tw/2,22,(d.ssd||p.media==='ssd')?PAL['s5']:PAL['s2'],'#fff',13*k);
    txt(ctx,fitTxt(ctx,k>1.3?(p.mode==='sandbox'?'Your drive':'Seized drive'):head,8*(CW+GAP)-tw-16,15*k),GX,24,{s:15*k,w:700});
    // clusters
    const selC=ap?Math.round(p.cl):sim.vis.selC;const scan=sim.vis.scan,sweep=scan&&scan.t<1.2&&!RM?Math.floor(scan.t/1.2*NC):-1;
    for(let c=0;c<NC;c++){const [x,y]=cellXY(c),q=d.cl[c],f=q.f?d.files[q.f]:null;
      rr(ctx,x,y,CW,CW,6);
      if(q.zero||!f){ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();if(q.zero&&q.f===0&&d.everWiped)txt(ctx,'0',x+CW/2,y+CW/2,{s:11*k,c:PAL['muted'],a:'center',b:'middle'});}
      else if(q.live){ctx.fillStyle=f.col;ctx.fill();txt(ctx,f.tag,x+CW/2,y+CW/2+1,{s:17*Math.min(k,1.4),w:800,c:'#fff',a:'center',b:'middle'});}
      else{ctx.save();rr(ctx,x,y,CW,CW,6);ctx.clip();ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(x,y,CW,CW);ctx.strokeStyle=f.col;ctx.globalAlpha=0.75;ctx.lineWidth=4;
        for(let s=-CW;s<CW;s+=11){ctx.beginPath();ctx.moveTo(x+s,y+CW);ctx.lineTo(x+s+CW,y);ctx.stroke();}ctx.restore();
        rr(ctx,x,y,CW,CW,6);ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.stroke();
        rr(ctx,x+CW/2-11*Math.min(k,1.4),y+CW/2-11*Math.min(k,1.4),22*Math.min(k,1.4),22*Math.min(k,1.4),5);ctx.fillStyle=PAL['card'];ctx.fill();
        txt(ctx,f.tag,x+CW/2,y+CW/2+1,{s:16*Math.min(k,1.4),w:800,c:PAL['cv-ink'],a:'center',b:'middle'});}
      if(ap&&q.slack&&!q.zero&&d.files[q.slack.f]&&!d.destroyed){const sf=d.files[q.slack.f];ctx.fillStyle=sf.col;ctx.fillRect(x+4,y+CW-9,CW-8,5);}
      const fl=d.flash[c];if(fl>0){rr(ctx,x-2,y-2,CW+4,CW+4,8);ctx.strokeStyle=PAL['s4'];ctx.globalAlpha=clamp(fl,0,1);ctx.lineWidth=3;ctx.stroke();ctx.globalAlpha=1;}
      if(c===sweep){rr(ctx,x-3,y-3,CW+6,CW+6,8);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.stroke();}
      if(selC===c){rr(ctx,x-3,y-3,CW+6,CW+6,8);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.stroke();}}
    if(d.destroyed){ctx.save();ctx.globalAlpha=0.82;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(GX-4,GY-4,8*(CW+GAP)+4,8*(CW+GAP)+4);ctx.restore();
      ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.beginPath();[[60,0],[150,120],[110,210],[230,300],[190,420]].forEach((pt,i)=>{const X=GX+pt[0],Y=GY+pt[1];i?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.moveTo(GX+150,GY+120);ctx.lineTo(GX+330,GY+90);ctx.moveTo(GX+230,GY+300);ctx.lineTo(GX+410,GY+330);ctx.stroke();
      pill(ctx,'Drive physically destroyed',GX+210,GY+210,PAL['s1'],'#fff',15*k);}
    // right panel
    drawSide(sim,ctx,k,d);
    txt(ctx,'Each square: one 4 KB cluster',GX,GY+8*(CW+GAP)+14,{s:12*k,c:PAL['cv-soft']});},
  thumbSetup(sim){sim.p.mode='case';sim.p.days=8;}
};

function runs(cls){const out=[];let s=cls[0],p=cls[0];for(let i=1;i<=cls.length;i++){const c=cls[i];if(c===p+1){p=c;continue;}out.push(s===p?String(s):s+'–'+p);s=c;p=c;}return out.join(', ');}
function resultsTable(sim,d,list){const st=sim.st,res=st.res||{},ap=atLeast('ap');if(!list.length)return '';
  const cell=(r,done)=>{if(!done)return '<span style="color:var(--muted)">not run</span>';if(!r)return '—';const v=verdict(r);
    return v==='full'?'<b style="color:var(--good)">All '+r.n+' clusters</b>':v==='part'?'<b style="color:#b06d00">'+r.good+' of '+r.n+'</b>':'<span style="color:var(--bad)">'+(r.why==='entry gone'?'Entry reused':r.why==='no signature'?'No signature':r.why==='header overwritten'?'Header gone':r.why==='not text'?'Not text':'Nothing')+'</span>';};
  let h='<p style="font-weight:600;margin:10px 0 4px">Recovery results</p><div class="tbl-wrap"><table><thead><tr><th>Deleted file</th><th>File table</th><th>Carving</th>'+(ap?'<th>Text search</th>':'')+'</tr></thead><tbody>';
  list.forEach(f=>{h+='<tr><td style="font-family:'+MONO.replace(/"/g,'&quot;')+'">'+f.name+'</td><td>'+cell(res.table&&res.table[f.uid],!!res.table)+'</td><td>'+cell(res.carve&&res.carve[f.uid],!!res.carve)+'</td>'+(ap?'<td>'+cell(res.kw&&res.kw[f.uid],!!res.kw)+'</td>':'')+'</tr>';});
  return h+'</tbody></table></div>';}
function checkFindings(sim){const st=sim.st,d=drive(sim),res=st.res||{};
  if(!res.table||!res.carve){st.check={ok:false,msg:'Run the file-table recovery and the carving first, so your findings rest on evidence.'};return;}
  const ev=evFiles(d),wrong=[];ev.forEach(f=>{const truth=verdict(bestOf(d,f));if(st.find[f.name]!==truth)wrong.push(f.name);});
  if(!wrong.length){const best=ev.map(f=>{const b=bestOf(d,f),v=verdict(b);return f.name+': '+(v==='full'?'complete':v==='part'?b.good+' of '+b.n+' clusters':'nothing usable');});
    st.check={ok:true,msg:'Your findings match the evidence. '+best.join('; ')+'. Each finding rests on a method you ran on a verified image, so it would stand up in a report.'};}
  else st.check={ok:false,msg:'Check '+wrong.join(' and ')+' again. Use the best result from any method: a file is “fully recovered” if any method got every cluster back.'+(atLeast('ap')?'':' At this level, text search is not available.')};}
function drawSide(sim,ctx,k,d){const p=sim.p,st=sim.st,ap=atLeast('ap'),W=790-RX,ks=Math.min(k,1.5);let y=44;
  const sec=(s)=>{txt(ctx,s,RX,y,{s:13*k,w:700,c:PAL['cv-soft']});y+=10+8*k;};
  if(p.mode==='sandbox'){sec('FILE TABLE');const rows=d.entries.map((u,i)=>u?d.files[u]:null).filter(Boolean),rh=Math.max(20,16*k);
    const selF=sbSelected(sim);rows.slice(0,ap?8:12).forEach(f=>{if(f===selF){rr(ctx,RX-4,y-rh*0.78,W+6,rh,5);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.stroke();}rr(ctx,RX,y-rh*0.62,14,14,3);ctx.fillStyle=f.col;ctx.fill();const del=f.status!=='active';
      txt(ctx,fitTxt(ctx,f.name,W-120*ks,13*k),RX+20,y,{s:13*k,w:600,c:del?PAL['cv-soft']:PAL['cv-ink']});txt(ctx,del?'deleted':'in use',790,y,{s:12*k,w:700,a:'right',c:del?PAL['s1']:PAL['s3']});y+=rh;});
    if(rows.length>(ap?8:12)){txt(ctx,'+'+(rows.length-(ap?8:12))+' more below the stage',RX,y,{s:12*k,c:PAL['cv-soft']});y+=rh;}y+=6;}
  else{sec('DELETED EVIDENCE');evFiles(d).forEach(f=>{const k0=nIntact(d,f),best=bestOf(d,f);
      txt(ctx,f.name,RX,y,{s:14*k,w:700});txt(ctx,k>1.3?k0+'/'+f.n+' intact':k0+' of '+f.n+' cluster'+(f.n>1?'s':'')+' intact',790,y,{s:12*k,c:k0===f.n?PAL['s3']:k0?PAL['s4']:PAL['s1'],a:'right',w:700});y+=8;
      const sw=Math.min(36,(W-(f.n-1)*4)/f.n);for(let j=0;j<f.n;j++){const ok=intact(d,f,j),x=RX+j*(sw+4);rr(ctx,x,y,sw,18,4);
        if(ok){ctx.fillStyle=f.col;ctx.fill();}else{ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+5,y+4);ctx.lineTo(x+sw-5,y+14);ctx.moveTo(x+sw-5,y+4);ctx.lineTo(x+5,y+14);ctx.stroke();}}
      y+=18+16*k;});y+=2;}
  // legend
  const items=[['In use',(x,yy,s)=>{rr(ctx,x,yy,s,s,3);ctx.fillStyle=PALF[0];ctx.fill();}],['Deleted, data still there',(x,yy,s)=>{ctx.save();rr(ctx,x,yy,s,s,3);ctx.clip();ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(x,yy,s,s);ctx.strokeStyle=PALF[0];ctx.lineWidth=3;for(let q=-s;q<s;q+=7){ctx.beginPath();ctx.moveTo(x+q,yy+s);ctx.lineTo(x+q+s,yy);ctx.stroke();}ctx.restore();}],
    ['Empty or zeroed',(x,yy,s)=>{rr(ctx,x,yy,s,s,3);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}]];
  if(!(ap&&k>1.3)){const s=14;items.forEach(([l,fn])=>{fn(RX,y-11,s);txt(ctx,l,RX+s+8,y,{s:12*k,c:PAL['cv-soft']});y+=Math.max(19,15*k);});y+=4;}
  if(ap)drawHex(sim,ctx,k,d,y);}
function fitTxt(ctx,s,maxW,size){ctx.font='700 '+size+'px '+FONT;if(ctx.measureText(s).width<=maxW)return s;let t=s;while(t.length>2&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);return t+'…';}
function drawHex(sim,ctx,k,d,y){const c=Math.round(sim.p.cl),q=d.cl[c],f=q.f&&!q.zero&&!d.destroyed?d.files[q.f]:null,fs=Math.min(12.5*k,20);
  txt(ctx,'CLUSTER '+c+' IN HEX',RX,y,{s:13*k,w:700,c:PAL['cv-soft']});y+=6+fs;
  const desc=d.destroyed?'unreadable':!f?'all zeros':f.name+', part '+(q.part+1)+' of '+f.n+(q.live?'':' (deleted)');txt(ctx,fitTxt(ctx,desc,790-RX,12*k),RX,y,{s:12*k,c:PAL['cv-ink'],w:600});y+=fs+6;
  const hex=v=>v.toString(16).toUpperCase().padStart(2,'0');ctx.font='600 '+fs+'px '+MONO;ctx.textBaseline='alphabetic';ctx.textAlign='left';
  const row=(off,bytes,cols,lab)=>{ctx.fillStyle=PAL['cv-soft'];ctx.fillText(lab,RX,y);let x=RX+ctx.measureText(lab+' ').width;bytes.forEach((b,i)=>{ctx.fillStyle=cols[i];ctx.fillText(hex(b),x,y);x+=ctx.measureText('00 ').width;});y+=fs+6;};
  const at=o=>f?byteAt(f,q.part,o):0,ink=PAL['cv-ink'],sig=PAL['s1'];
  if(d.destroyed){txt(ctx,'The drive cannot be read.',RX,y,{s:12*k,c:PAL['cv-soft']});return;}
  const head0=f&&q.part===0&&TYPES[f.type].head;
  [0,8].forEach(o=>{const b=[],cs=[];for(let i=0;i<8;i++){b.push(at(o+i));cs.push(head0&&o+i<3?sig:ink);}row(o,b,cs,hex(o>>8)+hex(o&255));});
  if(f&&q.part===f.n-1){const used=f.size-(f.n-1)*CS,o=Math.max(0,used-4),b=[],cs=[];const sf=q.slack&&d.files[q.slack.f];
    for(let i=0;i<8;i++){const off=o+i;if(off<used){b.push(at(off));cs.push(TYPES[f.type].foot?sig:ink);}else{b.push(sf?byteAt(sf,q.slack.part,off):0);cs.push(sf?sf.col:PAL['muted']);}}
    row(o,b,cs,(o).toString(16).toUpperCase().padStart(4,'0'));
    txt(ctx,fitTxt(ctx,'File ends at byte '+used.toLocaleString('en-US')+'. Slack: '+(sf?'old '+sf.name+' data':'zeros'),790-RX,11.5*k),RX,y,{s:11.5*k,c:PAL['cv-soft']});}
  else if(head0)txt(ctx,fitTxt(ctx,'Signature '+TYPES[f.type].sig+' marks a '+TYPES[f.type].l,790-RX,11.5*k),RX,y,{s:11.5*k,c:PAL['cv-soft']});}

SIM.controls[0].onChange=syncMode;
BioLab.register(SIM);
})();

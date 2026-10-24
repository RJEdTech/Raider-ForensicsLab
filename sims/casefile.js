(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;
const MONO='ui-monospace,Consolas,"Courier New",monospace';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const enc=s=>{const b=[];for(const c of String(s))b.push(c.charCodeAt(0)&255);return b;};
const hex2=v=>v.toString(16).toUpperCase().padStart(2,'0');

/* ---------- SHA-256 (FIPS 180-4), synchronous; checked against "abc" → ba7816bf… and "" → e3b0c442… ---------- */
const PR=[];for(let n=2;PR.length<64;n++){if(PR.every(p=>n%p))PR.push(n);}
const frac32=x=>Math.floor((x-Math.floor(x))*4294967296)>>>0;
const K256=PR.map(p=>frac32(Math.cbrt(p))),H0=PR.slice(0,8).map(p=>frac32(Math.sqrt(p)));
const rotr=(x,n)=>(x>>>n)|(x<<(32-n));
function sha256(bytes){const l=bytes.length,nb=((l+9+63)>>6)<<6,m=new Uint8Array(nb);m.set(bytes);m[l]=0x80;const dv=new DataView(m.buffer);dv.setUint32(nb-4,(l*8)>>>0);dv.setUint32(nb-8,Math.floor(l/536870912));
  const h=H0.slice(),w=new Uint32Array(64);
  for(let o=0;o<nb;o+=64){for(let i=0;i<16;i++)w[i]=dv.getUint32(o+4*i);
    for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(rotr(a,7)^rotr(a,18)^(a>>>3))+w[i-7]+(rotr(b,17)^rotr(b,19)^(b>>>10)))|0;}
    let a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for(let i=0;i<64;i++){const t1=(hh+(rotr(e,6)^rotr(e,11)^rotr(e,25))+((e&f)^(~e&g))+K256[i]+w[i])|0,t2=((rotr(a,2)^rotr(a,13)^rotr(a,22))+((a&b)^(a&c)^(b&c)))|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
    h[0]=(h[0]+a)|0;h[1]=(h[1]+b)|0;h[2]=(h[2]+c)|0;h[3]=(h[3]+d)|0;h[4]=(h[4]+e)|0;h[5]=(h[5]+f)|0;h[6]=(h[6]+g)|0;h[7]=(h[7]+hh)|0;}
  return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');}
function bitDiff(h1,h2){let n=0;const bits=[];for(let i=0;i<64;i++){const x=parseInt(h1[i],16)^parseInt(h2[i],16);for(let b=3;b>=0;b--){const d=(x>>b)&1;bits.push(d);n+=d;}}return {n,bits};}

/* ---------- the evidence drive: 32 clusters × 64 bytes with real file signatures ---------- */
const CL=64,NCL=32;
const FILES=[
  {name:'lab_photo_1.jpg',ext:'JPG',cl:[0,1,2,3],type:'JPEG',col:'#2f6db5'},
  {name:'periodic_table.png',ext:'PNG',cl:[4,5,6],type:'PNG',col:'#1f8a70'},
  {name:'chem_notes.txt',ext:'TXT',cl:[7,8,9,10],type:'ZIP (DOCX)',col:'#b2452b'},
  {name:'playlist.mp3',ext:'MP3',cl:[11,12,13,14,23],type:'MP3',col:'#7a4fc2'},
  {name:'essay_draft.docx',ext:'DOCX',cl:[15,16,17],type:'ZIP (DOCX)',col:'#9a6a10'},
  {name:'cat.png',ext:'PNG',cl:[18,19],type:'PNG',col:'#c0457e'},
  {name:'readme.pdf',ext:'PDF',cl:[20],type:'PDF',col:'#5a6472'},
  {name:'~draft.txt',ext:'TXT',cl:[21,22,23],type:'Text',col:'#a3741f',deleted:true}];
const EXT_OK={JPG:['JPEG'],PNG:['PNG'],TXT:['Text'],MP3:['MP3'],DOCX:['ZIP (DOCX)'],PDF:['PDF']};
const SIGS=[['JPEG','FF D8 FF'],['PNG','89 50 4E 47'],['PDF','25 50 44 46'],['ZIP / DOCX','50 4B 03 04'],['MP3 (ID3)','49 44 33'],['Plain text','no signature']];
const DRAFT='ok got into LAB-07 with okafors login from the fake help desk email. key is on my usb, renamed so nobody notices. posting it to chem-study-crew tonight from the anon acct. delete this';
const HIDDEN='KEY IS RENAMED CHEM_NOTES.TXT ON MY USB. DELETE AFTER YOU COPY IT. -RM';
function fileBytes(f,r){const n=f.cl.length*CL,b=[];const fill=()=>{while(b.length<n)b.push(Math.floor(r()*256));};
  if(f.type==='JPEG'){b.push(0xFF,0xD8,0xFF,0xE0,0x00,0x10,...enc('JFIF'),0,1,1,0,0,1,0,1,0,0);fill();b[n-2]=0xFF;b[n-1]=0xD9;}
  else if(f.type==='PNG'){b.push(0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0,0,0,0x0D,...enc('IHDR'),0,0,0,0x60,0,0,0,0x40,8,2);fill();}
  else if(f.type==='MP3'){b.push(...enc('ID3'),3,0,0,0,0,0x0F,0x76,...enc('TIT2'),0,0,0,9,0,0,0,...enc('Lab Beats'));fill();}
  else if(f.type==='PDF'){b.push(...enc('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n1 0 obj << /Title (Read me) >>\nendobj\n'));fill();}
  else if(f.type==='ZIP (DOCX)'){b.push(0x50,0x4B,0x03,0x04,0x14,0x00,0x06,0x00,0x08,0x00,0,0,0x21,0,...enc('[Content_Types].xml'));
    b.push(...enc(f.name==='chem_notes.txt'?'..word/document.xml..docProps/core.xml <dc:title>Lab Practical Answer Key</dc:title> <dc:creator>Dana Okafor</dc:creator>':'..word/document.xml..docProps/core.xml <dc:title>Essay draft</dc:title>'));fill();}
  else{b.push(...enc(DRAFT));while(b.length<n)b.push(0x20);}
  return b.slice(0,n);}
const DRIVE=(()=>{const r=rng(1008),d=new Uint8Array(CL*NCL);FILES.forEach(f=>{const b=fileBytes(f,r);f.cl.forEach((c,i)=>{if(f.deleted&&c===23)return;for(let j=0;j<CL;j++)d[c*CL+j]=b[i*CL+j];});});
  // playlist.mp3 later overwrote cluster 23 of the deleted draft
  const mp=FILES[3],mb=fileBytes(mp,rng(77));for(let j=0;j<CL;j++)d[23*CL+j]=mb[4*CL+j];
  // an orphaned JPEG in free space (no file table entry): the photo of the key, with EXIF
  const ex=[0xFF,0xD8,0xFF,0xE1,0x00,0x60,...enc('Exif'),0,0,...enc('MM'),0,0x2A,...enc(' Model=Pixelon 6a  DateTimeOriginal=2026:10:08 21:47:03  OffsetTimeOriginal=+00:00 ')];
  for(let j=0;j<CL*4;j++)d[24*CL+j]=j<ex.length?ex[j]:Math.floor(r()*256);d[28*CL-2]=0xFF;d[28*CL-1]=0xD9;return d;})();
const COPY_B=(()=>{const d=new Uint8Array(DRIVE),s=enc('SYSTEM~1   System Volume Information  IndexerVolumeGuid');for(let j=0;j<s.length;j++)d[30*CL+j]=s[j];return d;})();
const HASH_LOG=sha256(DRIVE),HASH_B=sha256(COPY_B);
let TAMPER=null;const copyA=t=>{if(!t)return DRIVE;if(!TAMPER){TAMPER=new Uint8Array(DRIVE);TAMPER[1500]^=1;}return TAMPER;};
const HASH_T=sha256(copyA(true));
function clusterOwner(c){const f=FILES.find(f=>!f.deleted&&f.cl.includes(c));return f||null;}

/* ---------- timeline (Thursday, October 8, 2026; Colorado is on MDT = UTC−6) ---------- */
const hm=(h,m,s)=>h*60+m+(s||0)/60;
const SYS=[
  {id:'mail',s:'email',lbl:'phishing email arrives',t:hm(20,58,14),utc:true,src:'school mail server log'},
  {id:'pw',s:'password',lbl:'password typed on fake page',t:hm(21,6,40),utc:true,src:'web filter log'},
  {id:'login',s:'login',lbl:'Okafor login on LAB-07',t:hm(21,41,5),utc:true,src:'sign-in log'},
  {id:'copy',s:'USB copy',lbl:'key copied to USB',t:hm(15,44,30),utc:false,src:'USB file system (FAT stores local time)'},
  {id:'photo',s:'photo',lbl:'photo of the key',t:hm(21,47,3),utc:true,src:'EXIF of the carved photo (offset +00:00)'},
  {id:'post',s:'post',lbl:'key posted by labrat_anon',t:hm(27,12,44),utc:true,src:'chat server log'},
  {id:'fwd',s:'forward',lbl:'Jordan forwards it',t:hm(27,15,2),utc:true,src:'chat server log'}];
const PEOPLE=[
  {id:'riley',name:'Riley Moss',ini:'RM',col:'#b2452b',says:'“I left school at 3:30 for soccer practice.”',bars:[[hm(15,38),hm(15,58),'chem lab badge']]},
  {id:'sam',name:'Sam Ortega',ini:'SO',col:'#2f6db5',says:'“I finished my titration in the lab and left around 3:35.”',bars:[[hm(15,20),hm(15,35),'chem lab badge']]},
  {id:'avery',name:'Avery Chen',ini:'AC',col:'#1f8a70',says:'“I was at the debate tournament in Pueblo all afternoon.”',marks:[[hm(15,40,12),'photo in Pueblo']]},
  {id:'jordan',name:'Jordan Pike',ini:'JP',col:'#7a4fc2',says:'“I only forwarded the key after someone else posted it.”',marks:[]}];
const T0=hm(14,45),T1=hm(16,0);
const fmtT=m=>{m=((m%1440)+1440)%1440;let h=Math.floor(m/60),mi=Math.floor(m%60);const ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+String(mi).padStart(2,'0')+' '+ap;};
const fmtUTC=m=>{const d=m>=1440?' Oct 9':'';m=m%1440;const h=Math.floor(m/60),mi=Math.floor(m%60),s=Math.round((m*60)%60);return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0')+':'+String(s).padStart(2,'0')+' UTC'+d;};
const unixOf=m=>Date.UTC(2026,9,8,0,0,0)/1000+Math.round(m*60);
const tzOf=sim=>atLeast('honors')?Math.round(sim.p.tz):-6;
const localOf=(sim,e)=>e.utc?e.t+tzOf(sim)*60:e.t;

/* ---------- the posted photo for the hidden-note station (96 × 64, real 8-bit values) ---------- */
const W=96,H=64,NP=W*H;
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const CAT=(()=>{const r=rng(5150),d=new Uint8ClampedArray(NP*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let c=[70+y*1.2,120+y*0.6,190-y*0.5];
    const hx=(x-48)/22,hy=(y-36)/18,head=hx*hx+hy*hy<1,earL=y>12&&y<26&&x>28&&x<42&&(y-12)>Math.abs(x-35)*1.4,earR=y>12&&y<26&&x>54&&x<68&&(y-12)>Math.abs(x-61)*1.4;
    if(head||earL||earR)c=[232,150,70];if(head&&y>44&&Math.abs(x-48)<9)c=[246,214,170];
    if((Math.hypot(x-40,y-33)<3.2)||(Math.hypot(x-56,y-33)<3.2))c=[40,60,40];if(Math.abs(x-48)<2&&y>=39&&y<=41)c=[200,90,100];
    if(y>=58)c=[150,110,80];const i=(y*W+x)*4;for(let k=0;k<3;k++)d[i+k]=Math.round(c[k]+gauss(r)*2.2);d[i+3]=255;}
  return d;})();
const CAT_POSTED=(()=>{const d=new Uint8ClampedArray(CAT),st=[];enc(HIDDEN).concat([0]).forEach(v=>{for(let b=7;b>=0;b--)st.push((v>>b)&1);});st.forEach((bit,p)=>{d[p*4+2]=(d[p*4+2]&~1)|bit;});return d;})();
const CH={R:0,G:1,B:2},CHN={R:'red',G:'green',B:'blue'};
function extract(img,ch,plane){const out=[];let cur=0,n=0;for(let p=0;p<NP&&out.length<90;p++){cur=(cur<<1)|((img[p*4+ch]>>plane)&1);n++;if(n===8){if(cur===0)break;out.push(cur);cur=0;n=0;}}return out;}
const printable=b=>b.map(v=>v>=32&&v<127?String.fromCharCode(v):'·').join('');
const CV={};
function viewCanvas(key,fill){let c=CV[key];if(c)return c;c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),im=g.createImageData(W,H);fill(im.data);g.putImageData(im,0,0);CV[key]=c;return c;}

/* ---------- evidence cards ---------- */
const CLAIMS=[
  {id:'k1',t:'The evidence is trustworthy: unchanged since it was seized.'},
  {id:'k2',t:'The answer key was taken and carried on the USB drive.'},
  {id:'k3',t:'The accused had the opportunity: at LAB-07 when the key was taken.'},
  {id:'k4',t:'The accused is linked to the stolen login or the hidden note.'}];
function cards(sim){const st=sim.st,trust=st.copy==='A',low=st.copy==='B',out=[];
  const rel=(base)=>low?'Low':base;
  out.push(st.copy?{id:'C1',t:trust?'Verified drive copy':'Unverified copy',p:trust?'Copy A’s SHA-256 matches the custody log: bit-for-bit the seized drive.':'Copy B’s hash does not match the log, so it changed after seizure.',rel:trust?'High':'Low',st:'hash'}:{id:'C1',st:'hash',missing:true});
  out.push(st.flags['chem_notes.txt']?{id:'C2',t:'Key hidden as .txt',p:'chem_notes.txt is really a Word file titled “Lab Practical Answer Key”.',rel:rel('High'),st:'sig'}:{id:'C2',st:'sig',missing:true});
  out.push(st.recovered?{id:'C3',t:'Deleted draft',p:'A deleted note: got into LAB-07 with Okafor’s login, key on the USB. No name, last part overwritten.',rel:rel('Medium'),st:'recover'}:{id:'C3',st:'recover',missing:true});
  out.push(st.timeAns==='riley'?{id:'C4',t:'Riley at LAB-07',p:'Badge puts Riley in the lab at 3:38 PM; login 3:41, copy 3:44, photo 3:47. Riley said 3:30.',rel:'High',st:'time'}:{id:'C4',st:'time',missing:true});
  out.push(st.phish==='phish'?{id:'C5',t:'Phishing reply-to',p:'The fake help-desk email asked for replies at rm.lab42@mailbox.test.',rel:'Medium',st:'phish'}:{id:'C5',st:'phish',missing:true});
  out.push(stegoFound(st)?{id:'C6',t:'Hidden note “-RM”',p:'cat.png hides a note about renaming the key file, signed -RM.',rel:rel('Medium'),st:'stego'}:{id:'C6',st:'stego',missing:true});
  if(st.seenTime){out.push({id:'R1',t:'Sam in the lab',p:'Sam badged into the chem lab 3:20 to 3:35 PM, before the login.',rel:'High',st:'time',herring:true});
    out.push({id:'R2',t:'Jordan forwarded',p:'Jordan forwarded the key at 9:15 PM, 3 minutes after labrat_anon posted it.',rel:'High',st:'time',herring:true});
    out.push({id:'R3',t:'Avery in Pueblo',p:'Avery’s photo: 3:40 PM, GPS at the debate tournament.',rel:'Medium',st:'time',herring:true});}
  else{['R1','R2','R3'].forEach(id=>out.push({id,st:'time',missing:true}));}
  return out;}
const found=sim=>cards(sim).filter(c=>!c.missing);
const stegoFound=st=>st.ext&&st.ext.ch===2&&st.ext.plane===0;
function gradeClaim(sim,i,cid){const st=sim.st,acc=sim.p.accuse,c=found(sim).find(x=>x.id===cid);
  if(!c)return {ok:false,m:'No evidence chosen.'};
  if(c.rel==='Low'&&c.id!=='C1')return {ok:false,m:c.t+' comes from an unverified copy, so a defense lawyer could challenge it.'};
  if(i===0)return c.id==='C1'&&st.copy==='A'?{ok:true,m:'The matching hash shows the drive image is unchanged.'}:{ok:false,m:c.id==='C1'?'Copy B does not match the custody log.':c.t+' says nothing about whether the evidence changed.'};
  if(i===1)return c.id==='C2'?{ok:true,m:'The renamed Word file is the answer key itself.'}:c.id==='C3'?{ok:true,m:'The draft says the key is on the USB (partly overwritten, so the renamed file is stronger).'}:{ok:false,m:c.t+' does not show the key was on the drive.'};
  if(i===2){if(c.id==='C4')return acc==='riley'?{ok:true,m:'Logs and badge agree: Riley was in the lab from 3:38, and the login came at 3:41.'}:{ok:false,m:'That timeline places Riley at LAB-07, not '+nameOf(acc)+'.'};
    if(c.id==='R1')return {ok:false,m:'Sam left at 3:35, six minutes before the login at 3:41.'};
    if(c.id==='R3')return {ok:false,m:'Avery’s photo puts Avery in Pueblo, not at LAB-07.'};
    return {ok:false,m:c.t+' does not show where anyone was at 3:41 PM.'};}
  if(c.id==='C5'||c.id==='C6')return acc==='riley'?{ok:true,m:c.id==='C5'?'rm.lab42 matches Riley Moss’s initials and lab number; a reply-to can be faked, so pair it with other evidence.':'The note is signed -RM and describes the renamed file.'}:{ok:false,m:'RM points to Riley Moss, not '+nameOf(acc)+'.'};
  if(c.id==='R2')return {ok:false,m:'Forwarding at 9:15 PM shows Jordan shared the leak, not that Jordan took the key.'};
  return {ok:false,m:c.t+' does not link anyone to the login or the note.'};}
const nameOf=id=>{const p=PEOPLE.find(p=>p.id===id);return p?p.name:'nobody';};
function strength(sim){if(sim.p.accuse==='none')return 0;return sim.st.claims.reduce((a,cid,i)=>a+(gradeClaim(sim,i,cid).ok?1:0),0);}
function stationsDone(st){return [!!st.copy,!!st.flags['chem_notes.txt'],st.recovered,st.timeAns==='riley',st.phish==='phish',stegoFound(st)].filter(Boolean).length;}

/* ---------- show only what the current station uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.station,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function changed(sim){syncMode(sim);if(sim.st&&sim.p.station==='time')sim.st.seenTime=true;sim.infoDirty=true;}

/* ---------- drawing helpers ---------- */
function panel(ctx,x,y,w,h,fill){rr(ctx,x,y,w,h,10);ctx.fillStyle=fill||PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function fitText(ctx,s,max,size,w,font){ctx.font=(w||400)+' '+size+'px '+(font||FONT);if(ctx.measureText(s).width<=max)return s;let t=s;while(t.length>1&&ctx.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…';}
function mono(ctx,s,x,y,size,col,a,w){ctx.font=(w||600)+' '+size+'px '+MONO;ctx.fillStyle=col||PAL['cv-ink'];ctx.textAlign=a||'left';ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function wrapLines(ctx,s,max,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const words=s.split(' '),out=[];let cur='';words.forEach(wd=>{const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>max&&cur){out.push(cur);cur=wd;}else cur=t;});if(cur)out.push(cur);return out;}
const RELC={High:'#1b7339',Medium:'#a86400',Low:'#b3261e'};

function drawBoard(sim,ctx,k){const st=sim.st,cs=cards(sim),acc=sim.p.accuse,big=k>1.3;
  rr(ctx,8,8,784,300,12);ctx.fillStyle=PAL['cv-bench'];ctx.fill();
  const cw=250,ch=90,gx=10,gy=8;
  cs.forEach((c,i)=>{const x=20+(i%3)*(cw+gx),y=18+Math.floor(i/3)*(ch+gy);
    if(c.missing){rr(ctx,x,y,cw,ch,8);ctx.setLineDash([6,5]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
      const nm={hash:'Station 1',sig:'Station 2',recover:'Station 3',time:'Station 4',phish:'Station 5',stego:'Station 6'}[c.st];
      txt(ctx,'?',x+cw/2,y+ch/2-6*k,{s:22*k,w:800,a:'center',b:'middle',c:PAL['cv-soft']});txt(ctx,(big?'':'Not found yet · ')+nm,x+cw/2,y+ch-12,{s:12*k,a:'center',c:PAL['cv-soft'],w:600});return;}
    const sel=st.claims.includes(c.id);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;rr(ctx,x,y,cw,ch,8);ctx.fillStyle=PAL['card'];ctx.fill();ctx.restore();
    if(sel){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;rr(ctx,x,y,cw,ch,8);ctx.stroke();}
    ctx.fillStyle=c.herring?PAL['s2']:PAL['s1'];ctx.beginPath();ctx.arc(x+cw/2,y+4,5,0,6.29);ctx.fill();
    txt(ctx,fitText(ctx,c.t,cw-20,15*k,800),x+10,y+12+16*k,{s:15*k,w:800});
    if(k<=1.15){const ln=wrapLines(ctx,c.p,cw-20,12*k,500);ln.slice(0,2).forEach((l,j)=>txt(ctx,(j===1&&ln.length>2)?fitText(ctx,l+' …',cw-20,12*k,500):l,x+10,y+46*k+j*14*k,{s:12*k,c:PAL['cv-soft']}));}
    const pl=c.rel+(big?'':' reliability');ctx.font='700 '+(12*k)+'px '+FONT;const pw=ctx.measureText(pl).width+13.2*k;pill(ctx,pl,x+cw-10-pw/2,y+ch-13*k,RELC[c.rel],'#fff',12*k);});
  // suspects
  const sy=322;txt(ctx,'Suspects',20,sy+6,{s:14*k,w:700,c:PAL['cv-soft']});
  PEOPLE.forEach((p,i)=>{const x=20+i*195,y=sy+16,isA=acc===p.id;panel(ctx,x,y,185,450-y-10,isA?PAL['card2']:PAL['card']);if(isA){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;rr(ctx,x,y,185,450-y-10,10);ctx.stroke();}
    ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(x+34,y+36,24,0,6.29);ctx.fill();txt(ctx,p.ini,x+34,y+37,{s:16,w:800,a:'center',b:'middle',c:'#fff'});
    txt(ctx,fitText(ctx,p.name.split(' ')[0],120,15*k,800),x+66,y+32,{s:15*k,w:800});
    txt(ctx,fitText(ctx,p.name.split(' ')[1],120,13*k,600),x+66,y+32+17*k,{s:13*k,c:PAL['cv-soft'],w:600});
    if(isA)pill(ctx,'accused',x+92,y+86,PAL['s1'],'#fff',12*k);});}

function drawHash(sim,ctx,k){const st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),tamp=hon&&sim.p.tamper;
  const show=hon?(ap?64:16):8,hA=tamp?HASH_T:HASH_LOG;
  const boxes=[{t:'Custody log',s:'hash at seizure',h:HASH_LOG,done:true},{t:'Copy A',s:tamp?'one bit changed':'write blocker used',h:hA,done:st.hashed.A,cmp:true},{t:'Copy B',s:'opened on an office PC',h:HASH_B,done:st.hashed.B,cmp:true}];
  const bw=244,gap=14,y=20,bh=ap&&k<=1.3?232:186;
  boxes.forEach((b,i)=>{const x=20+i*(bw+gap),chosen=st.copy===b.t.slice(-1)&&b.cmp;panel(ctx,x,y,bw,bh);if(chosen){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;rr(ctx,x,y,bw,bh,10);ctx.stroke();}
    // drive icon
    ctx.fillStyle=i===0?'#5a6472':'#2f6db5';rr(ctx,x+14,y+14,30,44,5);ctx.fill();ctx.fillStyle='#d9dde3';ctx.fillRect(x+21,y+8,16,9);
    txt(ctx,b.t,x+56,y+30,{s:16*k,w:800});txt(ctx,fitText(ctx,b.s,bw-66,12*k,600),x+56,y+30+17*k,{s:12*k,c:PAL['cv-soft'],w:600});
    const fs=Math.min(15*k,22),per=Math.max(8,Math.floor((bw-28)/(fs*0.62)/8)*8);
    if(!b.done){txt(ctx,'not hashed yet',x+bw/2,y+110,{s:14*k,a:'center',c:PAL['cv-soft'],w:600});return;}
    const s=b.h.slice(0,show),lines=[];for(let j=0;j<s.length;j+=per)lines.push(s.slice(j,j+per));const maxL=Math.floor((bh-(ap?120:110))/(fs*1.3))+1;
    lines.slice(0,Math.max(1,maxL)).forEach((l,j)=>mono(ctx,l+((j===Math.max(1,maxL)-1&&lines.length>maxL)||(show<64&&j===lines.length-1)?'…':''),x+14,y+86+j*fs*1.3,fs,b.cmp&&b.h!==HASH_LOG?PAL['s1']:PAL['cv-ink']));
    if(b.cmp){const ok=b.h===HASH_LOG;pill(ctx,ok?'✓ matches the log':'✗ does not match',x+bw/2,y+bh-20,ok?'#1b7339':'#b3261e','#fff',13*k);}});
  const yb=y+bh+16;
  if(tamp){const bd=bitDiff(HASH_LOG,HASH_T),s=7,gx=20,gy=yb+26*Math.min(k,1.3);txt(ctx,'Which of the 256 hash bits flipped after changing 1 bit of the drive',gx,yb+14*Math.min(k,1.3),{s:13*Math.min(k,1.25),w:700});
    bd.bits.forEach((v,i)=>{ctx.fillStyle=v?PAL['s1']:PAL['cv-bg2'];ctx.fillRect(gx+(i%64)*(s+1),gy+Math.floor(i/64)*(s+1),s,s);});
    txt(ctx,bd.n+' of 256 bits changed ('+(bd.n/2.56).toFixed(0)+'%)',gx+64*(s+1)+14,gy+18,{s:15*k,w:800,c:PAL['s1']});}
  else{const py=yb+4,ph=Math.min(64,450-py-60*Math.min(k,1.3));const steps=[['2,048 bytes',ap?'the whole drive image':'drive image'],['SHA-256','64 mixing rounds'],[ap?'256 bits = 64 hex':'64-character hash','same input, same hash']];const sw=230;
    steps.forEach((q,i)=>{const x=20+i*(sw+36);panel(ctx,x,py,sw,ph,i===1?PAL['card2']:PAL['card']);txt(ctx,fitText(ctx,q[0],sw-20,15*k,800),x+sw/2,py+ph/2-(k>1.3?0:6),{s:15*k,w:800,a:'center',b:'middle'});
      if(k<=1.3)txt(ctx,q[1],x+sw/2,py+ph/2+14,{s:12*k,a:'center',c:PAL['cv-soft'],w:600});if(i<2){ctx.fillStyle=PAL['cv-soft'];ctx.beginPath();ctx.moveTo(x+sw+8,py+ph/2-8);ctx.lineTo(x+sw+28,py+ph/2);ctx.lineTo(x+sw+8,py+ph/2+8);ctx.fill();}});
    const ty=py+ph+20*Math.min(k,1.3);const lines=wrapLines(ctx,st.copy?'You chose copy '+st.copy+' for the investigation.'+(st.copy==='B'?' Its hash does not match, so anything found on it can be challenged.':' Every later station uses this verified copy.'):'Hash both copies, then choose which one to investigate (panel below).',760,15*k,600);
    lines.slice(0,2).forEach((l,i)=>txt(ctx,l,20,ty+i*20*k,{s:15*k,w:600,c:st.copy==='B'?PAL['s1']:PAL['cv-ink']}));}}

function drawSig(sim,ctx,k){const st=sim.st,f=FILES.find(f=>f.name===sim.p.file)||FILES[2],ap=atLeast('ap'),hon=atLeast('honors'),big=k>1.3;
  const off=f.cl[0]*CL,bytes=Array.from(DRIVE.slice(off,off+48)),per=big?8:16,rows=big?2:3;
  panel(ctx,12,10,776,214);txt(ctx,fitText(ctx,f.name+' · first bytes',500,15*k,800),26,36,{s:15*k,w:800});
  const fs=Math.min(15*k,24);
  for(let r=0;r<rows;r++){const y=66+r*fs*1.55,b=bytes.slice(r*per,r*per+per);
    mono(ctx,(off+r*per).toString(16).toUpperCase().padStart(4,'0'),26,y,fs,PAL['cv-soft']);
    const hx=26+fs*3.4;b.forEach((v,i)=>mono(ctx,hex2(v),hx+i*fs*1.62,y,fs,r===0&&i<4?PAL['s1']:PAL['cv-ink'],'left',r===0&&i<4?800:500));
    mono(ctx,b.map(v=>v>=32&&v<127?String.fromCharCode(v):'.').join(''),hx+per*fs*1.62+fs*0.6,y,fs,PAL['s2']);}
  const ok=EXT_OK[f.ext].includes(f.type),flagged=!!st.flags[f.name];
  const vy=66+rows*fs*1.55+8;
  txt(ctx,'Name says: '+f.ext,26,vy+6,{s:15*k,w:700});txt(ctx,'Bytes say: '+f.type,26+(big?0:220),big?vy+6+22*k:vy+6,{s:15*k,w:700,c:PAL['s1']});
  pill(ctx,flagged?(ok?'flagged (but it matches)':'flagged: mismatch'):'not flagged',700,36,flagged?(ok?'#a86400':'#b3261e'):PAL['card2'],flagged?'#fff':PAL['cv-ink'],12*k);
  // signature reference
  txt(ctx,'Signature table: what the first bytes mean',20,252,{s:14*k,w:700});
  const cw=(760)/3;SIGS.forEach((s,i)=>{const x=20+(i%3)*cw,y=270+Math.floor(i/3)*(76*Math.min(k,1.15)),hit=s[0].startsWith(f.type.split(' ')[0]);panel(ctx,x,y,cw-10,64*Math.min(k,1.15),hit?PAL['card2']:PAL['card']);
    if(hit){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;rr(ctx,x,y,cw-10,64*Math.min(k,1.15),10);ctx.stroke();}
    txt(ctx,s[0],x+12,y+24*Math.min(k,1.1),{s:14*k,w:800});mono(ctx,s[1],x+12,y+50*Math.min(k,1.12),Math.min(14*k,22),s[1][0]==='n'?PAL['cv-soft']:PAL['s1']);});}

function drawRecover(sim,ctx,k){const st=sim.st,hon=atLeast('honors'),big=k>1.3;
  txt(ctx,'Drive clusters (64 bytes each)',20,28,{s:14*k,w:700});
  const cs=46,gp=4,x0=20,y0=40;
  for(let c=0;c<NCL;c++){const x=x0+(c%8)*(cs+gp),y=y0+Math.floor(c/8)*(cs+gp),own=clusterOwner(c),draft=FILES[7].cl.includes(c)&&c!==23;
    let fill=PAL['cv-bg2'];if(own){fill=own.col;}if(draft){fill='#a3741f';}if(c>=24&&c<28&&st.carved)fill='#c27a00';
    rr(ctx,x,y,cs,cs,5);ctx.fillStyle=fill;ctx.fill();
    if(draft||!own||(c===23)){ctx.save();rr(ctx,x,y,cs,cs,5);ctx.clip();ctx.strokeStyle=own||draft||(c>=24&&c<28&&st.carved)?'rgba(255,255,255,.35)':PAL['line'];ctx.lineWidth=3;for(let d=-cs;d<cs*2;d+=10){ctx.beginPath();ctx.moveTo(x+d,y);ctx.lineTo(x+d-cs,y+cs);ctx.stroke();}ctx.restore();}
    if(c===23){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;rr(ctx,x+1.5,y+1.5,cs-3,cs-3,5);ctx.stroke();}
    if(draft&&st.recovered){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=3;rr(ctx,x+1.5,y+1.5,cs-3,cs-3,5);ctx.stroke();}
    txt(ctx,String(c),x+cs/2,y+cs/2+1,{s:13*k,w:800,a:'center',b:'middle',c:fill===PAL['cv-bg2']?PAL['cv-soft']:'#fff'});}
  const ly=y0+4*(cs+gp)+18*k;
  [['striped = free space (still holds old data)',PAL['cv-soft']],['orange outline: cluster 23 reused by playlist.mp3',PAL['s4']]].forEach((l,i)=>txt(ctx,fitText(ctx,l[0],390,12*k,600),20,ly+i*18*k,{s:12*k,c:l[1],w:600}));
  // file table
  const X=436;panel(ctx,X-10,12,800-X,428);txt(ctx,'File table',X+4,38,{s:15*k,w:800});
  const rh=Math.max(36,30*k);FILES.forEach((f,i)=>{const y=52+i*rh;ctx.fillStyle=f.col;rr(ctx,X+4,y+4,14,14,3);ctx.fill();
    txt(ctx,fitText(ctx,f.name,big?210:200,14*k,f.deleted?800:600),X+26,y+16,{s:14*k,w:f.deleted?800:600,c:f.deleted?PAL['s4']:PAL['cv-ink']});
    const st2=f.deleted?(st.recovered?'recovered (2 of 3)':'deleted'):'clusters '+f.cl[0]+(f.cl.length>1?'–'+f.cl[f.cl.length-1]:'');
    txt(ctx,fitText(ctx,f.deleted?st2:(big?'':st2),big?120:136,12*k,600),786,y+16,{s:12*k,a:'right',c:f.deleted?PAL['s4']:PAL['cv-soft'],w:600});});
  if(hon){const y=52+FILES.length*rh;txt(ctx,st.carved?'carved: JPEG in clusters 24–27':'clusters 24–27: no table entry',X+4,y+16,{s:13*k,w:700,c:st.carved?PAL['s4']:PAL['cv-soft']});}}

function drawTime(sim,ctx,k){const st=sim.st,tz=tzOf(sim),hon=atLeast('honors'),big=k>1.3;
  const L=big?150:130,R=776,X=m=>L+(m-T0)/(T1-T0)*(R-L);
  txt(ctx,fitText(ctx,'Thursday afternoon, local time'+(hon?' (logs converted with UTC '+(tz>=0?'+':'−')+Math.abs(tz)+')':''),760,14*k,700),20,24,{s:14*k,w:700});
  const laneSys=[46,176],lanes=[[190,232],[236,278],[282,324]];
  // grid
  for(let m=T0;m<=T1+0.01;m+=15){const x=X(m);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,laneSys[0]);ctx.lineTo(x,330);ctx.stroke();txt(ctx,fmtT(m).replace(' PM',''),x,348,{s:13*k,a:'center',c:PAL['cv-soft'],w:600});}
  txt(ctx,'Systems',20,laneSys[0]+70,{s:14*k,w:700});
  PEOPLE.slice(0,3).forEach((p,i)=>{const [a,b]=lanes[i];ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(L,a,R-L,b-a);txt(ctx,p.name.split(' ')[0],20,(a+b)/2,{s:14*k,w:700,b:'middle'});
    (p.bars||[]).forEach(br=>{const x1=X(br[0]),x2=X(br[1]);rr(ctx,x1,a+6,Math.max(4,x2-x1),b-a-12,5);ctx.fillStyle=p.col;ctx.fill();});
    (p.marks||[]).forEach(mk=>{const x=X(mk[0]);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(x,(a+b)/2,8,0,6.29);ctx.fill();txt(ctx,fitText(ctx,mk[1],R-x-14,12*k,700),x+12,(a+b)/2,{s:12*k,b:'middle',w:700,c:PAL['cv-ink']});});
    if(p.id==='riley'){const x=X(hm(15,30));ctx.strokeStyle=PAL['s1'];ctx.setLineDash([4,3]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,a+2);ctx.lineTo(x,b-2);ctx.stroke();ctx.setLineDash([]);
      txt(ctx,'says left',x-6,(a+b)/2,{s:12*k,a:'right',b:'middle',c:PAL['s1'],w:700});}
    if(p.id==='sam'){txt(ctx,'in lab',X(hm(15,20))-6,(a+b)/2,{s:12*k,a:'right',b:'middle',c:PAL['cv-soft'],w:700});}
    if(p.id==='riley'&&!big){txt(ctx,'in lab',X(hm(15,58))+6,(a+b)/2,{s:12*k,b:'middle',c:PAL['cv-soft'],w:700});}});
  // system events
  const ev=SYS.map(e=>({e,m:localOf(sim,e)})),inWin=ev.filter(o=>o.m>=T0&&o.m<=T1).sort((a,b)=>a.m-b.m),out=ev.filter(o=>!(o.m>=T0&&o.m<=T1));
  const nr=k>1.3?3:4,sp=(laneSys[1]-laneSys[0]-40)/(nr-1),rowsY=[...Array(nr)].map((_,i)=>laneSys[0]+16+i*sp),used=rowsY.map(()=>[]);
  inWin.forEach((o,i)=>{const x=X(o.m),lbl=(big?o.e.s:o.e.lbl)+' '+fmtT(o.m).replace(' PM','');ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(lbl).width,right=x+w+6>R;
    const a=right?x-4-w:x+4,b=a+w;let ri=used.findIndex(u=>u.every(q=>b+8<q[0]||a-8>q[1]));if(ri<0)ri=i%nr;used[ri].push([a,b]);const ry=rowsY[ri];
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,ry+4);ctx.lineTo(x,laneSys[1]-4);ctx.stroke();
    ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(x,laneSys[1]-8,6,0,6.29);ctx.fill();
    if(['login','copy'].includes(o.e.id)){ctx.strokeStyle=PAL['s1'];ctx.globalAlpha=0.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,laneSys[1]);ctx.lineTo(x,330);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
    txt(ctx,lbl,right?x-4:x+4,ry,{s:12*k,w:700,a:right?'right':'left',c:PAL['cv-ink']});});
  // outside the window
  panel(ctx,12,366,776,78);txt(ctx,'Not between 2:45 and 4:00 PM',24,388,{s:13*k,w:700,c:PAL['cv-soft']});
  const items=out.map(o=>o.e.lbl.replace(' by labrat_anon','')+' '+fmtT(o.m));let ix=24,iy=388+22*k;
  items.forEach(s=>{ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(s).width+12*k;if(ix+w>776){ix=24;iy+=20*k;}if(iy>440)return;pill(ctx,s,ix+w/2,iy-4*k,PAL['card2'],PAL['cv-ink'],12*k);ix+=w+8;});}

function drawPhish(sim,ctx,k){const st=sim.st,ap=atLeast('ap'),cl=st.clues;
  panel(ctx,12,10,776,430);let y=40;const X=28,mx=760;
  const row=(lab,on)=>{txt(ctx,lab,X,y,{s:13*k,w:700,c:PAL['cv-soft']});if(on){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;rr(ctx,X-8,y-18*k,mx-4,24*k,6);ctx.stroke();}};
  // From: display name then address split into parts
  row('From',cl.from);txt(ctx,'Larkspur IT Help Desk',X+70*k,y,{s:14*k,w:800});y+=26*k;
  const parts=[['it-support@',PAL['card2'],PAL['cv-ink']],['larkspur-ridge.example.org',PAL['card2'],PAL['cv-ink']],['.account-verify.test',cl.from?'#b3261e':PAL['card2'],cl.from?'#fff':PAL['cv-ink']]];
  let px=X+70*k;parts.forEach(p=>{ctx.font='700 '+(13*k)+'px '+MONO;const w=ctx.measureText(p[0]).width+10;if(px+w>mx+20){px=X+70*k;y+=26*k;}rr(ctx,px,y-16*k,w,22*k,5);ctx.fillStyle=p[1];ctx.fill();mono(ctx,p[0],px+5,y,13*k,p[2],'left',700);px+=w+4;});
  if(cl.from)txt(ctx,'real domain = the last part',Math.min(px+6,mx-200),y+20*k,{s:12*k,c:PAL['s1'],w:700});y+=40*k;
  row('Reply-To',cl.reply);mono(ctx,fitText(ctx,'rm.lab42@mailbox.test',mx-90*k,13*k,700,MONO),X+70*k,y,13*k,cl.reply?PAL['s1']:PAL['cv-ink'],'left',700);y+=30*k;
  row('Subject',cl.urgent);txt(ctx,fitText(ctx,'URGENT: Your account closes in 2 hours',mx-90*k,14*k,800),X+70*k,y,{s:14*k,w:800,c:cl.urgent?PAL['s1']:PAL['cv-ink']});y+=34*k;
  const body=wrapLines(ctx,'Dear Ms. Okafor, we detected unusual activity. Verify your password within 2 hours or your account and files will be deleted.',mx-24,14*k,400);
  body.slice(0,k>1.3?2:3).forEach(l=>{txt(ctx,l,X,y,{s:14*k});y+=20*k;});y+=10*k;
  row('Link',cl.link);txt(ctx,'shows:',X+70*k,y,{s:12*k,c:PAL['cv-soft'],w:600});mono(ctx,fitText(ctx,'portal.larkspur-ridge.example.org',mx-150*k,13*k,700,MONO),X+120*k,y,13*k,PAL['s2'],'left',700);y+=24*k;
  txt(ctx,'goes to:',X+70*k,y,{s:12*k,c:PAL['cv-soft'],w:600});mono(ctx,fitText(ctx,'larkspur-ridge.example.org.account-verify.test/login',mx-150*k,13*k,700,MONO),X+132*k,y,13*k,cl.link?PAL['s1']:PAL['cv-ink'],'left',700);y+=30*k;
  if(ap&&y<420){row('Headers',cl.auth);mono(ctx,fitText(ctx,'spf=fail  dkim=none  dmarc=fail',mx-90*k,13*k,700,MONO),X+80*k,y,13*k,cl.auth?PAL['s1']:PAL['cv-ink'],'left',700);}
  if(st.phish)pill(ctx,st.phish==='phish'?'Reported as phishing':'Marked as safe',700,30,st.phish==='phish'?'#1b7339':'#b3261e','#fff',12*k);}

function drawStego(sim,ctx,k){const st=sim.st,ch=CH[sim.p.channel]||0,pl=clamp(Math.round(sim.p.plane),0,7),S=3.6,w=W*S,h=H*S,x1=28,x2=800-28-w,y=44;
  txt(ctx,'cat.png, posted in chem-study-crew',x1,y-12,{s:15*k,w:700});
  const cv=viewCanvas('cat',d=>d.set(CAT_POSTED)),pv=viewCanvas('p'+ch+pl,d=>{for(let p=0;p<NP;p++){const v=((CAT_POSTED[p*4+ch]>>pl)&1)?255:0;d[p*4]=d[p*4+1]=d[p*4+2]=v;d[p*4+3]=255;}});
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(cv,x1,y,w,h);ctx.drawImage(pv,x2,y,w,h);ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.strokeRect(x1,y,w,h);ctx.strokeRect(x2,y,w,h);
  const t=CHN[sim.p.channel]+' bit plane '+pl;txt(ctx,t.charAt(0).toUpperCase()+t.slice(1),x2,y-12,{s:15*k,w:700});
  if(st.anim>0&&st.anim<1){ctx.fillStyle='rgba(255,210,63,.6)';ctx.fillRect(x1,y+6*S*st.anim,w,4);}
  const ly=y+h+28*k;
  if(st.ext){const s=printable(st.ext.bytes),ok=stegoFound(st);txt(ctx,'Extracted from '+CHN[Object.keys(CH)[st.ext.ch]]+' plane '+st.ext.plane+':',x1,ly,{s:13*k,c:PAL['cv-soft'],w:600});
    const lines=wrapLines(ctx,s||'(nothing)',744,15*k,700);lines.slice(0,k>1.3?2:3).forEach((l,i)=>mono(ctx,fitText(ctx,l,744,15*k,700,MONO),x1,ly+22*k+i*21*k,15*k,ok?PAL['s3']:PAL['cv-soft'],'left',700));}
  else txt(ctx,'Pick a color and bit plane, look for a pattern, then press Extract.',x1,ly,{s:14*k,c:PAL['cv-soft'],w:600});}

/* ---------- the definition ---------- */
const SIM={
  id:'casefile',hash:'casefile',apUnit:18,order:8,tab:'Case file: the leaked key',kind:'Virtual lab',
  prereq:['hashing','filesig','metadata','recovery','passwords','phishing','stego'],
  card:'Solve a fictional school case: verify a drive, find a renamed file, recover a deleted draft, rebuild the timeline, then make your case.',
  title:'Digital case file: the Case of the Leaked Lab Results',
  lede:{bio:'Someone leaked the answer key to Ms. Okafor’s chemistry lab practical. Work through six stations of digital evidence, in any order, then name who did it and back each claim with evidence.',
        honors:'Use hashing, file signatures, data recovery, time zones, phishing analysis and steganography to test four suspects’ stories. Some evidence is a red herring.',
        ap:'Read the evidence at the byte level: full SHA-256 hashes and the avalanche effect, hex offsets, Unix timestamps, SPF/DMARC results and bit planes.'},
  scale:{bio:'One seized 2 KB USB drive image (32 clusters of 64 bytes), six log sources and one 96 × 64 photo. Everyone here is fictional.',ap:'Drive image: 2,048 bytes in 32 clusters of 64 bytes; SHA-256 output: 256 bits = 64 hex digits. Everyone here is fictional.'},
  timeless:true,animated:true,chChange:0.8,chReveal:2.4,
  controls:[
    {id:'station',label:'Station',type:'select',def:'board',lvl:'bio',options:[{v:'board',l:'Evidence board'},{v:'hash',l:'1 · Verify the drive image'},{v:'sig',l:'2 · File signatures'},{v:'recover',l:'3 · Deleted files'},{v:'time',l:'4 · Timeline and alibis'},{v:'phish',l:'5 · The email that started it'},{v:'stego',l:'6 · The posted photo'}],help:'Do the stations in any order. Each one can add a card to the evidence board.'},
    {id:'accuse',label:'Who do you accuse?',type:'select',def:'none',lvl:'bio',modes:['board'],options:[{v:'none',l:'Not decided yet'},{v:'riley',l:'Riley Moss'},{v:'sam',l:'Sam Ortega'},{v:'avery',l:'Avery Chen'},{v:'jordan',l:'Jordan Pike'}]},
    {id:'tamper',label:'Change one bit of copy A',type:'toggle',def:false,lvl:'honors',modes:['hash'],help:'See what one flipped bit does to the hash.'},
    {id:'file',label:'File to inspect',type:'select',def:'lab_photo_1.jpg',lvl:'bio',modes:['sig'],options:FILES.filter(f=>!f.deleted).map(f=>({v:f.name,l:f.name}))},
    {id:'tz',label:'UTC offset for converting logs',type:'range',min:-10,max:2,step:1,def:0,unit:' h',lvl:'honors',modes:['time'],help:'Server logs and this phone’s EXIF are in UTC. Colorado in October is on daylight time.'},
    {id:'channel',label:'Color',type:'seg',def:'R',lvl:'bio',modes:['stego'],options:[{v:'R',l:'Red'},{v:'G',l:'Green'},{v:'B',l:'Blue'}]},
    {id:'plane',label:'Bit plane (0 = lowest bit)',type:'range',min:0,max:7,step:1,def:7,unit:'',lvl:'bio',modes:['stego']}
  ],
  actions:[
    {id:'hashA',label:'Hash copy A',lvl:'bio',primary:true,modes:['hash'],run(sim){sim.st.hashed.A=true;}},
    {id:'hashB',label:'Hash copy B',lvl:'bio',modes:['hash'],run(sim){sim.st.hashed.B=true;}},
    {id:'flag',label:'Flag this file as a mismatch',lvl:'bio',primary:true,modes:['sig'],run(sim){const n=sim.p.file;sim.st.flags[n]=!sim.st.flags[n];}},
    {id:'recover',label:'Recover the deleted file',lvl:'bio',primary:true,modes:['recover'],run(sim){sim.st.recovered=true;}},
    {id:'carve',label:'Carve free space for signatures',lvl:'honors',modes:['recover'],run(sim){sim.st.carved=true;}},
    {id:'extract',label:'Extract the hidden bits',lvl:'bio',primary:true,modes:['stego'],run(sim){const ch=CH[sim.p.channel]||0,pl=clamp(Math.round(sim.p.plane),0,7);sim.st.ext={ch,plane:pl,bytes:extract(CAT_POSTED,ch,pl)};sim.st.anim=0.001;}},
    {id:'submit',label:'Submit my case',lvl:'bio',primary:true,modes:['board'],run(sim){sim.st.submitted={acc:sim.p.accuse,score:strength(sim)};}}
  ],
  init(){return {copy:null,hashed:{A:false,B:false},flags:{},recovered:false,carved:false,seenTime:false,timeAns:null,clues:{},phish:null,ext:null,anim:0,claims:['','','',''],submitted:null};},
  step(sim,dt){const st=sim.st;if(st.anim>0){st.anim+=dt/1.4;if(st.anim>=1)st.anim=0;}},
  metrics:[
    {id:'stations',label:'Stations solved',unit:'of 6',lvl:'bio',min:0,max:6,d:0,get:s=>stationsDone(s.st)},
    {id:'ncards',label:'Evidence cards on the board',unit:'of 9',lvl:'bio',min:0,max:9,d:0,get:s=>found(s).length},
    {id:'strength',label:'Claims your evidence supports',unit:'of 4',lvl:'bio',min:0,max:4,d:0,modes:['board'],get:s=>strength(s)},
    {id:'hmatch',label:'Copy A vs the custody log',unit:'',lvl:'bio',text:true,modes:['hash'],get:s=>s.st.hashed.A?((atLeast('honors')&&s.p.tamper)?'No match':'Match'):'not hashed yet'},
    {id:'bits',label:'Hash bits that differ from the log',unit:'of 256',lvl:'ap',min:0,max:256,d:0,modes:['hash'],get:s=>bitDiff(HASH_LOG,(s.p.tamper?HASH_T:HASH_LOG)).n},
    {id:'sigt',label:'This file’s bytes say',unit:'',lvl:'bio',text:true,modes:['sig'],get:s=>{const f=FILES.find(f=>f.name===s.p.file)||FILES[0];return f.type+(EXT_OK[f.ext].includes(f.type)?' (matches .'+f.ext.toLowerCase()+')':' (not .'+f.ext.toLowerCase()+')');}},
    {id:'nflag',label:'Files flagged',unit:'',lvl:'bio',min:0,max:7,d:0,modes:['sig'],get:s=>Object.values(s.st.flags).filter(Boolean).length},
    {id:'survive',label:'Draft bytes recovered',unit:'of 192',lvl:'bio',min:0,max:192,d:0,modes:['recover'],get:s=>s.st.recovered?128:0},
    {id:'login',label:'LAB-07 login, local time',unit:'',lvl:'honors',text:true,modes:['time'],get:s=>fmtT(SYS[2].t+tzOf(s)*60)},
    {id:'unix',label:'Login as Unix time',unit:'s',lvl:'ap',text:true,modes:['time'],get:()=>String(unixOf(SYS[2].t))},
    {id:'nclues',label:'Clues flagged',unit:'',lvl:'bio',min:0,max:5,d:0,modes:['phish'],get:s=>Object.values(s.st.clues).filter(Boolean).length},
    {id:'maxd',label:'Largest change to a pixel value',unit:'of 255',lvl:'ap',min:0,max:4,d:0,modes:['stego'],get:()=>{let m=0;for(let i=0;i<NP*4;i++)m=Math.max(m,Math.abs(CAT_POSTED[i]-CAT[i]));return m;}}
  ],
  graph:false,
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');const s=p.station;
    if(s==='board'){const n=found(sim).length;if(st.submitted){const g=st.submitted;return g.acc==='riley'&&g.score===4?'<b>Case made.</b> Every claim against Riley Moss rests on reliable evidence, and none depends on a red herring.':'<b>'+g.score+' of 4 claims supported.</b> Read the feedback in the panel, change the accused or the evidence, and submit again.';}
      if(!n)return 'Ms. Okafor’s lab practical answer key showed up in a student group chat at 9:12 PM. A USB drive was found in lab computer LAB-07 the next morning. <b>Pick a station</b> to start examining the evidence.';
      return 'You have <b>'+n+' evidence card'+(n>1?'s':'')+'</b>. Each card says what it proves and how reliable it is. Pick a suspect, attach one card to each claim, then submit.';}
    if(s==='hash'){if(!st.hashed.A&&!st.hashed.B)return 'Investigators never work on the seized drive itself. They image it through a <b>write blocker</b> and log its SHA-256 hash. Hash both working copies and compare.';
      if(hon&&p.tamper)return 'Flipping <b>one bit</b> of copy A changed '+bitDiff(HASH_LOG,HASH_T).n+' of the 256 hash bits. Any change at all, even one bit, gives a completely different hash.';
      if(st.hashed.B&&!st.hashed.A)return 'Copy B’s hash does not match the custody log. Someone opened the drive on an office PC without a write blocker, and Windows wrote a folder to it. Now hash copy A.';
      return st.hashed.A&&st.hashed.B?'<b>Copy A matches the log; copy B does not.</b> Copy B changed after seizure, so evidence from it could be thrown out. Choose your copy in the panel.':'Copy A’s hash matches the custody log exactly, so it is bit-for-bit the drive that was seized. Hash copy B too.';}
    if(s==='sig'){const f=FILES.find(f=>f.name===p.file)||FILES[0],ok=EXT_OK[f.ext].includes(f.type);
      return '<b>'+f.name+'</b> starts with '+Array.from(DRIVE.slice(f.cl[0]*CL,f.cl[0]*CL+4)).map(hex2).join(' ')+', the signature of '+f.type+'. '+(ok?'That matches its extension.':'The name says .'+f.ext.toLowerCase()+', but the bytes do not lie: someone renamed it. Flag it.');}
    if(s==='recover'){if(!st.recovered)return 'The file table marks <b>~draft.txt as deleted</b>, but deleting only frees its clusters (21–23). The bytes stay until new data lands on them. Recover it.';
      return 'Clusters 21 and 22 still hold the draft, but <b>cluster 23 was reused</b> by playlist.mp3, so the end of the message is gone.'+(hon&&!st.carved?' Clusters 24–27 have no table entry. Carve them for file signatures.':hon?' Carving found a JPEG with no table entry: the photo of the key, with EXIF time 21:47:03 +00:00.':'');}
    if(s==='time'){const tz=tzOf(sim);if(hon&&tz!==-6)return 'With UTC '+(tz>=0?'+':'−')+Math.abs(tz)+', the login lands at '+fmtT(SYS[2].t+tz*60)+'. The server logs are in UTC, but badges and the USB use Colorado time. <b>Set the offset to Mountain Daylight Time</b> before you compare them.';
      return 'The login on LAB-07 came at <b>3:41 PM</b> and the key was copied at 3:44. Compare each suspect’s statement with where the badges and photos put them, then answer in the panel.';}
    if(s==='phish'){const n=Object.values(st.clues).filter(Boolean).length;return st.phish==='phish'?'This email stole Ms. Okafor’s password at 3:06 PM. Its <b>Reply-To, rm.lab42@mailbox.test</b>, is the first link to a person.':'Check the email the way an analyst does: who really sent it, where replies go, where the link really goes, and how it pressures the reader. '+(n?n+' flagged so far.':'');}
    const e=st.ext;if(e)return stegoFound(st)?'<b>Blue bit plane 0 held a note:</b> it says the key was renamed chem_notes.txt and is signed -RM.':'Those bits decode to gibberish, so nothing readable is hidden in that plane. Try the lowest plane of each color.';
    const pl=clamp(Math.round(p.plane),0,7);return pl>=5?'High bit planes show the picture: plane '+pl+' outlines the cat. Hidden data hides in the lowest plane, where a change of 1 cannot be seen.':(p.channel==='B'&&pl===0?'<b>Blue plane 0 has a striped band across the top rows.</b> That is text, not camera noise. Extract it.':CHN[p.channel]+' plane '+pl+' looks like random static. Try another color.');},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),s=p.station;const mono='font-family:'+MONO.replace(/"/g,'&quot;')+';overflow-wrap:anywhere;font-size:14px';
    const btn=(attr,l,on)=>'<button type="button" class="btn'+(on?' primary':'')+'" '+attr+'>'+l+'</button>';const row=h=>'<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">'+h+'</div>';
    if(s==='board'){let h='<div class="p-head"><h3>Make your case</h3></div><p>Larkspur Ridge High School (fictional). The answer key to Ms. Okafor’s lab practical was posted to the student chat <b>chem-study-crew</b> by an anonymous account at 9:12 PM on Thursday. Pick who you accuse (in Variables), then attach the best card to each claim.</p>';
      const fc=found(sim);
      CLAIMS.forEach((c,i)=>{h+='<div style="margin:8px 0"><label for="cf-claim'+i+'" style="font-weight:600;display:block">'+(i+1)+'. '+c.t+'</label><select class="sel wide" id="cf-claim'+i+'" data-claim="'+i+'"><option value="">(no evidence chosen)</option>'+fc.map(x=>'<option value="'+x.id+'"'+(st.claims[i]===x.id?' selected':'')+'>'+x.t+' · '+x.rel+'</option>').join('')+'</select>';
        if(st.submitted){const g=gradeClaim(sim,i,st.claims[i]);h+='<p style="margin:4px 0 0;font-size:14px;color:'+(g.ok&&p.accuse!=='none'?'var(--good)':'var(--bad)')+'">'+(g.ok&&p.accuse!=='none'?'✓ Supported. ':'✗ Not supported. ')+(p.accuse==='none'?'Choose who you accuse first.':g.m)+'</p>';}
        h+='</div>';});
      h+=row(btn('id="cf-submit"','Submit my case',true));
      if(st.submitted){const g=st.submitted;h+='<p class="verdict '+(g.acc==='riley'&&g.score===4?'ok':'no')+'">'+(g.acc==='riley'&&g.score===4?'Correct.':'Not yet.')+'</p><p>'+(g.acc==='riley'?(g.score===4?'Riley Moss phished Ms. Okafor’s password, logged in at LAB-07, copied the key to the USB as chem_notes.txt and hid a note in cat.png. Sam, Avery and Jordan were red herrings: each was near the case, but no reliable evidence ties them to the login.':'You picked the right person, but '+(4-g.score)+' claim'+(4-g.score>1?'s are':' is')+' not backed by reliable evidence yet. Find more cards.'):g.acc==='none'?'Choose a suspect in Variables.':nameOf(g.acc)+' is a red herring. Check whose badge, initials and alibi line up with the 3:41 PM login.')+'</p>';}
      if(fc.length)h+='<details><summary style="cursor:pointer;font-weight:600">What each card proves</summary>'+fc.map(c=>'<p style="font-size:14px;margin:6px 0"><b>'+c.t+'</b> ('+c.rel+'): '+c.p+'</p>').join('')+'</details>';
      return h;}
    if(s==='hash'){let h='<div class="p-head"><h3>Station 1: verify the drive image</h3></div><p>Officer J. Reyes (fictional) seized the USB drive at 7:52 AM Friday and logged its SHA-256 hash. Two working copies exist: <b>copy A</b>, made through a write blocker, and <b>copy B</b>, made by a volunteer who opened the drive on an office PC.</p>';
      if(ap)h+='<p style="'+mono+'">Logged: '+HASH_LOG+'<br>Copy A: '+(st.hashed.A?(p.tamper?HASH_T:HASH_LOG):'(not hashed)')+'<br>Copy B: '+(st.hashed.B?HASH_B:'(not hashed)')+'</p>';
      h+=row(btn('data-hash="A"','Hash copy A',st.hashed.A)+btn('data-hash="B"','Hash copy B',st.hashed.B));
      if(st.hashed.A&&st.hashed.B){h+='<p><b>Which copy will you investigate?</b></p>'+row(btn('data-copy="A"','Use copy A',st.copy==='A')+btn('data-copy="B"','Use copy B',st.copy==='B'));
        if(st.copy)h+='<p class="verdict '+(st.copy==='A'?'ok':'no')+'">'+(st.copy==='A'?'Correct.':'Risky choice.')+'</p><p>'+(st.copy==='A'?'Copy A matches the hash taken at seizure, so it is identical to the original. A changed hash would mean a changed drive.':'Copy B no longer matches the custody log. Evidence you find on it can be challenged in court. You can switch to copy A.')+'</p>';}
      if(hon)h+='<p style="font-size:14px;color:var(--muted)">A hash is a fingerprint of the bytes, not a lock. You cannot run SHA-256 backwards to get the file, and changing any bit scrambles the whole hash.</p>';return h;}
    if(s==='sig'){let h='<div class="p-head"><h3>Station 2: file signatures</h3></div><p>A file’s name is just a label anyone can change. Its first bytes, the <b>signature</b>, say what it really is. Choose each file in Variables, compare its first bytes with the signature table, and flag any whose name lies.</p><div style="display:grid;gap:4px">';
      FILES.filter(f=>!f.deleted).forEach(f=>{const b=Array.from(DRIVE.slice(f.cl[0]*CL,f.cl[0]*CL+4)).map(hex2).join(' ');h+='<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span style="'+mono+';min-width:11.5em">'+f.name+'</span><span style="'+mono+';color:var(--muted)">'+b+'</span>'+btn('data-flag="'+f.name+'"',st.flags[f.name]?'Flagged':'Flag',st.flags[f.name])+'</div>';});
      h+='</div>';const wrong=Object.keys(st.flags).filter(n=>st.flags[n]&&n!=='chem_notes.txt');
      if(st.flags['chem_notes.txt'])h+='<p style="margin-top:8px"><b style="color:var(--good)">chem_notes.txt is a ZIP-based Word file.</b> '+(hon?'Inside it, the bytes spell docProps/core.xml with the title “Lab Practical Answer Key” and creator Dana Okafor.':'It is the stolen answer key with a fake name.')+'</p>';
      if(wrong.length)h+='<p style="color:var(--bad)">'+wrong.join(', ')+': '+(wrong.includes('essay_draft.docx')?'a .docx really is a ZIP file, so PK (50 4B 03 04) is the right signature. ':'')+'its signature matches its extension. Unflag it.</p>';
      if(ap)h+='<p style="font-size:14px;color:var(--muted)">Hex is base 16: each byte is two digits from 00 to FF. 50 4B is ASCII “PK”, the initials of Phil Katz, who designed the ZIP format.</p>';return h;}
    if(s==='recover'){let h='<div class="p-head"><h3>Station 3: deleted files</h3></div><p>The file table lists ~draft.txt as deleted. Deleting a file only marks its clusters as free; the data stays until something new is written there.</p>';
      h+=row(btn('id="cf-rec"','Recover ~draft.txt',st.recovered)+(hon?btn('id="cf-carve"','Carve free space',st.carved):''));
      if(st.recovered){const t=DRAFT.slice(0,128);h+='<p><b>Recovered (clusters 21–22):</b></p><p style="'+mono+';background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 10px">'+esc(t)+'<span style="color:var(--bad)"> [cluster 23 overwritten: ID3 audio data]</span></p>';}
      if(st.carved)h+='<p><b>Carved from clusters 24–27:</b> a JPEG (starts FF D8 FF E1, ends FF D9) with EXIF: Model Pixelon 6a (fictional), DateTimeOriginal 2026:10:08 21:47:03, OffsetTimeOriginal +00:00. It is a photo of the answer key on a screen. Its time goes in the timeline.</p>';
      if(hon)h+='<p style="font-size:14px;color:var(--muted)">On an SSD, TRIM tells the drive to erase freed blocks soon after deletion, so recovery is much less likely than on this USB flash drive.</p>';return h;}
    if(s==='time'){const tz=tzOf(sim);let h='<div class="p-head"><h3>Station 4: timeline and alibis</h3></div><p>Each suspect gave a statement. Line them up against the logs.</p><ul style="padding-left:18px;margin:0 0 8px">'+PEOPLE.map(q=>'<li><b>'+q.name+':</b> '+q.says+'</li>').join('')+'</ul>';
      h+='<details'+(st.logsOpen?' open':'')+' id="cf-logs"><summary style="cursor:pointer;font-weight:600">Raw log entries</summary><div style="'+mono+';line-height:1.5">'+SYS.map(e=>esc(e.src)+': '+esc(e.lbl)+' at '+(e.utc?(hon?fmtUTC(e.t)+(ap?' (Unix '+unixOf(e.t)+')':''):fmtT(e.t-360)):fmtT(e.t)+' local')).join('<br>')+'</div></details>';
      h+='<p><b>Whose statement does the evidence contradict?</b></p>'+row(PEOPLE.map(q=>btn('data-who="'+q.id+'"',q.name,st.timeAns===q.id)).join(''));
      if(st.timeAns){const ok=st.timeAns==='riley';h+='<p class="verdict '+(ok?'ok':'no')+'">'+(ok?'Correct.':'Not quite.')+'</p><p>'+(ok?'Riley said they left at 3:30, but Riley’s badge opened the chem lab at 3:38 PM, three minutes before the login on LAB-07. The red herrings went on the board too.':st.timeAns==='sam'?'Sam’s badge shows Sam left at 3:35, as Sam said: six minutes before the login.':st.timeAns==='avery'?'Avery’s photo has GPS at the tournament and a 3:40 PM time with offset −06:00. The story holds.':'Jordan forwarded the key at 9:15 PM, after labrat_anon posted it at 9:12. Sharing a leak is wrong, but the story is true.')+(hon&&tz!==-6?' Also set the UTC offset to −6 so the logs line up.':'')+'</p>';}
      return h;}
    if(s==='phish'){const C=[['from','The sender’s real domain is account-verify.test, not the school’s.',true],['reply','Replies go to a different address: rm.lab42@mailbox.test.',true],['link','The link text and the real link target are different sites.',true],['urgent','It pressures the reader: “closes in 2 hours”, “files will be deleted”.',true],['name','It greets Ms. Okafor by name.',false],['day','It arrived on a school day, during work hours.',false]];
      if(ap)C.push(['auth','The headers show SPF fail and DMARC fail.',true]);
      let h='<div class="p-head"><h3>Station 5: the email that started it</h3></div><p>Ms. Okafor received this at 2:58 PM and typed her password on the linked page at 3:06 PM. Flag each detail that is a real warning sign. Links here are shown as text only.</p><div style="display:grid;gap:4px">'+C.map(c=>'<label style="display:flex;gap:8px;align-items:flex-start;font-size:15px"><input type="checkbox" data-clue="'+c[0]+'"'+(st.clues[c[0]]?' checked':'')+'> <span>'+c[1]+'</span></label>').join('')+'</div>';
      h+='<p><b>Your call:</b></p>'+row(btn('data-ph="phish"','Report as phishing',st.phish==='phish')+btn('data-ph="ok"','Trust it',st.phish==='ok'));
      if(st.phish){const ok=st.phish==='phish';const fakes=['name','day'].filter(x=>st.clues[x]);h+='<p class="verdict '+(ok?'ok':'no')+'">'+(ok?'Correct.':'Not quite.')+'</p><p>'+(ok?'It is phishing. The Reply-To address is the lead: rm.lab42. A reply-to can be set by anyone, so it points to an alias, not yet to a person.':'The sender’s domain, the hidden link target and the threat all point to phishing.')+(fakes.length?' A greeting by name or a weekday arrival is not a warning sign by itself: attackers can look up names.':'')+'</p>';}
      if(ap)h+='<p style="font-size:14px;color:var(--muted)">SPF checks whether the sending server is allowed to send for the domain; DKIM checks a signature on the message; DMARC tells receivers what to do when those fail.</p>';return h;}
    let h='<div class="p-head"><h3>Station 6: the posted photo</h3></div><p>Riley’s USB drive and the chat both have <b>cat.png</b>. Look at each color’s bit planes for a pattern that camera noise would not make, then extract the bits.</p>';
    if(st.ext){h+='<p style="'+mono+';background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 10px">'+esc(printable(st.ext.bytes))+'</p>';if(stegoFound(st))h+='<p><b style="color:var(--good)">Found it.</b> The note links the renamed file to someone signing as RM.</p>';}
    if(ap)h+='<p style="font-size:14px;color:var(--muted)">Each character is 8 bits, stored in bit 0 of the blue value of 8 pixels in a row, most significant bit first. Changing bit 0 moves a value by at most 1.</p>';return h;},
  bindInfo(sim,el){const st=sim.st,R=()=>BioLab.refresh(sim);
    el.querySelectorAll('[data-hash]').forEach(b=>b.addEventListener('click',()=>{st.hashed[b.dataset.hash]=true;R();}));
    el.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{st.copy=b.dataset.copy;R();}));
    el.querySelectorAll('[data-flag]').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.flag;st.flags[n]=!st.flags[n];BioLab.setValues(sim,{file:n});R();}));
    const rc=el.querySelector('#cf-rec');if(rc)rc.addEventListener('click',()=>{st.recovered=true;R();});
    const cv=el.querySelector('#cf-carve');if(cv)cv.addEventListener('click',()=>{st.carved=true;R();});
    el.querySelectorAll('[data-who]').forEach(b=>b.addEventListener('click',()=>{st.timeAns=b.dataset.who;R();}));
    const lg=el.querySelector('#cf-logs');if(lg)lg.addEventListener('toggle',()=>{st.logsOpen=lg.open;});
    el.querySelectorAll('[data-clue]').forEach(b=>b.addEventListener('change',()=>{st.clues[b.dataset.clue]=b.checked;sim.infoDirty=false;}));
    el.querySelectorAll('[data-ph]').forEach(b=>b.addEventListener('click',()=>{st.phish=b.dataset.ph;R();}));
    el.querySelectorAll('[data-claim]').forEach(s=>s.addEventListener('change',()=>{st.claims[+s.dataset.claim]=s.value;st.submitted=null;R();}));
    const sb=el.querySelector('#cf-submit');if(sb)sb.addEventListener('click',()=>{st.submitted={acc:sim.p.accuse,score:strength(sim)};R();});},
  tour:[
    {title:'The case',text:'The answer key to a chemistry lab practical leaked into a student group chat. Every station adds evidence cards to this board. At the end you name a suspect and back each claim with a card.',focus:[8,8,784,434],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'board'});}},
    {title:'1 · Verify before you look',text:{bio:'Investigators hash the drive when they seize it. A working copy is trustworthy only if its hash matches the custody log exactly.',ap:'SHA-256 turns the 2,048-byte image into 256 bits. Copy B differs by a few bytes, and its hash shares nothing with the logged one.'},focus:[12,12,776,250],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'hash'});sim.st.hashed.A=true;sim.st.hashed.B=true;}},
    {title:'2 · Names can lie, bytes cannot',text:'chem_notes.txt starts with 50 4B 03 04, the signature of a ZIP file. Word .docx files are ZIP files, so this “text file” is really a document.',focus:[12,10,776,214],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'sig',file:'chem_notes.txt'});}},
    {title:'3 · Deleted is not erased',text:'Deleting ~draft.txt only freed clusters 21–23 in the file table. Two still hold the text; cluster 23 was reused by a song, so the end is gone.',focus:[12,14,416,300],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'recover'});sim.st.recovered=true;}},
    {title:'4 · Line up the times',text:{bio:'Badges, sign-in logs and file times go on one timeline. Riley said they left at 3:30, but Riley’s badge opened the lab at 3:38, just before the login.',honors:'Server logs are in UTC, badges and the USB in local time. Convert with UTC−6 (Mountain Daylight Time) or the login seems to happen at 9:41 PM.'},focus:[12,30,776,330],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'time',tz:-6});}},
    {title:'5 · How the password was stolen',text:'A fake help-desk email: the real domain is the last part, account-verify.test, and the link goes somewhere other than it shows. Replies go to rm.lab42.',focus:[12,10,776,430],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'phish'});sim.st.clues={from:true,reply:true,link:true};}},
    {title:'6 · A note hidden in a photo',text:'Blue bit plane 0 of cat.png has a striped band: text, not noise. Extracting the bits gives a note signed -RM.',focus:[16,20,770,300],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'stego',channel:'B',plane:0});sim.def.actions.find(a=>a.id==='extract').run(sim);}},
    {title:'Make your case',text:'Accuse one suspect and attach one card to each claim. A claim counts only if a reliable card really supports it. Red herrings put people near the case, not at the crime.',focus:[8,8,784,434],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{station:'board'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{station:'board',tz:0,plane:7,channel:'R',file:'lab_photo_1.jpg',tamper:false});BioLab.reset(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.after)ch.after(sim);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',instant:true,set:{station:'hash'},after(sim){sim.st.hashed.A=true;},q:'Copy A’s SHA-256 hash matches the hash written in the custody log when the drive was seized. What does that show?',choices:['Copy A is bit-for-bit identical to the seized drive','The files on the drive are innocent','Nobody has opened the drive since it was seized'],correct:0,
     explain:{bio:'A hash only tells you the bytes are identical. It says nothing about whether the files are innocent, and investigators open copies all the time. The model now shows copy A hashed: it matches the log.'}},
    {lvl:'bio',instant:true,set:{station:'sig',file:'chem_notes.txt'},q:'chem_notes.txt starts with the bytes 50 4B 03 04. What is it really?',choices:['A ZIP-based file, such as a Word .docx','A plain text file, as its name says','A damaged file'],correct:0,
     explain:{bio:'50 4B 03 04 is the ZIP signature, and Word .docx files are ZIP archives. The model now shows the file’s first bytes next to the signature table. Plain text has no signature at all; it starts with readable letters.'}},
    {lvl:'bio',q:'The suspect deleted ~draft.txt, then kept using the drive. When you recover it, how much of the draft survives?',choices:['None: deleting erases the data','Most of it: only clusters that were reused are lost','All of it, perfectly'],correct:1,
     baseline:{station:'recover'},changeAction:'recover',changeText:'Recovering ~draft.txt from the file table',
     explain:{bio:'Deleting only marked clusters 21–23 as free. Clusters 21 and 22 still held the text (128 of 192 bytes). Cluster 23 had been reused by playlist.mp3, so the end of the note is gone for good.'}},
    {lvl:'honors',instant:true,set:{station:'time',tz:-6},q:'The carved photo’s EXIF says 21:47:03 with offset +00:00. In Colorado in October (UTC−6), when was it taken?',choices:['3:47 PM','9:47 PM','3:47 AM'],correct:0,
     explain:{honors:'The offset +00:00 means the time is in UTC. Subtract 6 hours for Mountain Daylight Time: 21:47 − 6:00 = 15:47, or 3:47 PM. The model now uses UTC−6: the photo lands right after the 3:44 PM copy.'}},
    {lvl:'honors',q:'If a single bit of copy A changes, its SHA-256 hash will…',choices:['change in one hex digit','change completely, in about half its bits','stay the same, since one bit is too small to matter'],correct:1,
     baseline:{station:'hash',tamper:false},baselineAction:'hashA',change:{tamper:true},changeText:'One bit of copy A flipped',
     explain:{honors:'This is the avalanche effect: a good hash scrambles every output bit. The model flipped bit 0 of byte 1,500, and '+bitDiff(HASH_LOG,HASH_T).n+' of the 256 hash bits changed. That is why a matching hash is strong evidence that nothing changed.'}},
    {lvl:'ap',instant:true,set:{station:'phish'},after(sim){sim.st.clues.auth=true;},q:'The help-desk email’s headers show spf=fail and dmarc=fail. What does that tell you?',choices:['The sending server was not authorized to send mail for that domain','The email contains a virus','Ms. Okafor’s password was weak'],correct:0,
     explain:{ap:'SPF lists the servers allowed to send for a domain, and DMARC says what to do when SPF or DKIM checks fail. Failing both means the mail did not come from where it claims. The model now highlights the header line.'}},
    {lvl:'ap',instant:true,set:{station:'stego',channel:'B',plane:0},q:'Hiding the note changed some blue values in cat.png. By how much, at most?',choices:['1','128','255'],correct:0,
     explain:{ap:'Only bit 0 (worth 1) was rewritten, so each blue value moved by 0 or 1. The Largest change tile reads 1. Bit 7 would have been worth 128 and would show.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Who leaked the answer key, and how can you prove it?</p><ol><li>Work through all six stations. Each one adds a card to the evidence board.</li><li>For each card, write what it proves and why it is or is not reliable.</li><li>Choose a suspect, attach a card to each claim and submit. Revise until every claim is supported.</li></ol><p>Explain why the three red-herring cards do not prove anything against Sam, Avery or Jordan.</p>',
       honors:'<p><b>Question:</b> Which pieces of evidence would survive a defense lawyer’s challenge?</p><ol><li>Hash both copies and explain why copy B cannot be used.</li><li>In the timeline, set the UTC offset to 0, then to −6. Record the login time each way.</li><li>Recover the draft and carve free space. What survives, and why?</li><li>Rank all nine cards from most to least reliable.</li></ol><p>Write a one-paragraph report that names the suspect and cites one reliable card for each claim.</p>',
       ap:'<p><b>Question:</b> How do byte-level details turn suspicion into proof?</p><ol><li>Turn on “Change one bit of copy A” and record how many hash bits change.</li><li>Convert the login’s Unix time to local time by hand and check it against the tile.</li><li>Record the SPF, DKIM and DMARC results and what each means.</li><li>Extract the hidden note and record the largest pixel change.</li></ol><p><b>Claim–evidence–reasoning:</b> Argue the case against the suspect. For each claim, cite the evidence and explain the reasoning, including the limits (a reply-to can be faked; a draft has no name on it).</p>'},
  terms:[{t:'Chain of custody',d:'The record of who handled evidence, when, and what they did with it.'},{t:'Hash (SHA-256)',d:'A 256-bit fingerprint of a file. Any change to the file gives a different hash.'},{t:'Write blocker',d:'A device that lets investigators read a drive without writing anything to it.'},{t:'File signature',d:'The first bytes of a file, which identify its real type no matter what it is named.'},
    {t:'Cluster',d:'A fixed-size block of a drive. Files are stored in one or more clusters.'},{t:'Phishing',d:'A fake message that tricks someone into giving away a password or clicking a harmful link.'},{t:'Alibi',d:'Evidence that a person was somewhere else when the crime happened.'},{t:'Red herring',d:'Evidence that seems important but does not point to the culprit.'},
    {lvl:'honors',t:'UTC',d:'Coordinated Universal Time, the time zone servers usually log in. Colorado is UTC−6 in summer and fall, UTC−7 in winter.'},{lvl:'honors',t:'File carving',d:'Recovering files from free space by scanning for signatures, without using the file table.'},{lvl:'honors',t:'Avalanche effect',d:'Changing one input bit of a hash flips about half of the output bits.'},{lvl:'honors',t:'EXIF',d:'Metadata stored inside a photo: camera model, date and time, time zone offset, sometimes GPS.'},
    {lvl:'ap',t:'Unix time',d:'Seconds since 00:00:00 UTC on January 1, 1970.'},{lvl:'ap',t:'SPF, DKIM, DMARC',d:'Email checks: which servers may send for a domain, a signature on the message, and the domain’s policy when checks fail.'},{lvl:'ap',t:'Hexadecimal',d:'Base 16. Each byte is written as two digits from 00 to FF.'}],
  about:'<p>Everything is computed in the page. The drive image is 2,048 real bytes in 32 clusters of 64, with real file signatures (JPEG FF D8 FF, PNG 89 50 4E 47, ZIP/DOCX 50 4B 03 04, PDF 25 50 44 46, MP3 ID3). Hashes are real SHA-256, implemented here and checked against the standard test vectors (“abc” → ba7816bf…, the empty string → e3b0c442…). The hidden note uses real least-significant-bit encoding in the blue values of a generated 96 × 64 photo.</p><p>Simplified: a real drive has millions of clusters and a file system such as FAT32 or exFAT; real cases use forensic imaging formats and tools; real email headers are much longer. Times use Mountain Daylight Time (UTC−6) for October in Colorado. The school, students, teacher, officer, accounts and domains (example.org, .test) are fictional. This case teaches how investigators verify and reason about evidence; it does not show how to break into any real system.</p>',
  draw(sim,ctx,vdt,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const s=sim.p.station;
    if(s==='board')drawBoard(sim,ctx,k);else if(s==='hash')drawHash(sim,ctx,k);else if(s==='sig')drawSig(sim,ctx,k);else if(s==='recover')drawRecover(sim,ctx,k);else if(s==='time')drawTime(sim,ctx,k);else if(s==='phish')drawPhish(sim,ctx,k);else drawStego(sim,ctx,k);},
  thumbSetup(sim){sim.st.copy='A';sim.st.flags['chem_notes.txt']=true;sim.st.recovered=true;sim.st.phish='phish';sim.p.accuse='riley';}
};
SIM.controls.forEach(c=>{c.onChange=changed;});
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();

(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const MONO='ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';
const W=800,H=560;

/* ---------- SHA-256 (FIPS 180-4) and MD5 (RFC 1321), synchronous, on byte arrays ---------- */
const SHA_K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
function sha256(bytes){const l=bytes.length,nb=((l+9+63)>>6)<<6,m=new Uint8Array(nb);m.set(bytes);m[l]=0x80;const dv=new DataView(m.buffer),bits=l*8;
  dv.setUint32(nb-4,bits>>>0);dv.setUint32(nb-8,Math.floor(bits/4294967296));const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64);
  const ror=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<nb;o+=64){for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(ror(a,7)^ror(a,18)^(a>>>3))+w[i-7]+(ror(b,17)^ror(b,19)^(b>>>10)))|0;}
    let A=h[0],B=h[1],C=h[2],D=h[3],E=h[4],F=h[5],G=h[6],Hh=h[7];
    for(let i=0;i<64;i++){const t1=(Hh+(ror(E,6)^ror(E,11)^ror(E,25))+((E&F)^(~E&G))+SHA_K[i]+w[i])|0,t2=((ror(A,2)^ror(A,13)^ror(A,22))+((A&B)^(A&C)^(B&C)))|0;Hh=G;G=F;F=E;E=(D+t1)|0;D=C;C=B;B=A;A=(t1+t2)|0;}
    h[0]+=A;h[1]+=B;h[2]+=C;h[3]+=D;h[4]+=E;h[5]+=F;h[6]+=G;h[7]+=Hh;}
  const out=new Uint8Array(32),ov=new DataView(out.buffer);for(let i=0;i<8;i++)ov.setUint32(i*4,h[i]);return out;}
const MD5_S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
const MD5_K=new Uint32Array(64).map((_,i)=>Math.floor(Math.abs(Math.sin(i+1))*4294967296));
function md5(bytes){const l=bytes.length,nb=((l+9+63)>>6)<<6,m=new Uint8Array(nb);m.set(bytes);m[l]=0x80;const dv=new DataView(m.buffer),bits=l*8;
  dv.setUint32(nb-8,bits>>>0,true);dv.setUint32(nb-4,Math.floor(bits/4294967296),true);let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(let o=0;o<nb;o+=64){let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){let F,g;if(i<16){F=(B&C)|(~B&D);g=i;}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16;}else if(i<48){F=B^C^D;g=(3*i+5)%16;}else{F=C^(B|~D);g=(7*i)%16;}
      F=(F+A+MD5_K[i]+dv.getUint32(o+g*4,true))|0;A=D;D=C;C=B;B=(B+((F<<MD5_S[i])|(F>>>(32-MD5_S[i]))))|0;}
    a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0;}
  const out=new Uint8Array(16),ov=new DataView(out.buffer);[a0,b0,c0,d0].forEach((v,i)=>ov.setUint32(i*4,v,true));return out;}
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const utf8=s=>new TextEncoder().encode(s);
const SELFTEST=hex(sha256(utf8('abc')))==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'&&hex(sha256(new Uint8Array(0)))==='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'&&hex(md5(utf8('abc')))==='900150983cd24fb0d6963f7d28e17f72';
const popc=x=>{let c=0;while(x){c+=x&1;x>>>=1;}return c;};
function bitDiff(a,b){let n=0;for(let i=0;i<a.length;i++)n+=popc(a[i]^b[i]);return n;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SUPD={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
const sup=n=>String(n).split('').map(c=>SUPD[c]||c).join('');
function sci(v,d){if(!Number.isFinite(v))return '—';if(v<1e4)return v.toFixed(d||0);const e=Math.floor(Math.log10(v));return (v/Math.pow(10,e)).toFixed(2)+' × 10'+sup(e);}
function pow2sci(b){const lg=b*Math.log10(2),e=Math.floor(lg);return Math.pow(10,lg-e).toFixed(2)+' × 10'+sup(e);}

/* ---------- the evidence: a message export and an uncompressed photo (real BMP bytes) ---------- */
const TEXT0=['Case 26-0314 (fictional) · message export','Phone: Lumen X2 (fictional) · owner D. Reyes','03/14 18:02 D. Reyes: did you get the keys?','03/14 18:05 K. Moss: yes. loading dock at 9:30','03/14 18:06 D. Reyes: ok. bring the blue binder','03/14 18:09 K. Moss: see you there',''].join('\n');
const EDITS=[{from:'03/14 18:09',to:'03/14 19:09',say:'the time of the last message changed from 18:09 to 19:09'},{from:'18:05 K. Moss',to:'18:05 K. Ross',say:'the sender “K. Moss” became “K. Ross”'},{from:'dock at 9:30',to:'dock at 8:30',say:'the meeting time “9:30” became “8:30”'}];
const PW=48,PH=32;
function photoPixels(){const r=rng(314),px=new Uint8Array(PW*PH*3);const put=(x,y,c)=>{const i=(y*PW+x)*3;px[i]=clamp(c[0],0,255);px[i+1]=clamp(c[1],0,255);px[i+2]=clamp(c[2],0,255);};
  for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const n=Math.round((r()-0.5)*10);let c;
    if(y<8)c=[120+y*6+n,160+y*5+n,215+n];                        // evening sky
    else if(y<29)c=[150+n,128+n,104+n];                           // brick wall
    else c=[70+n,72+n,76+n];                                      // asphalt
    if(y>=8&&y<29&&(y%4===0||((x+(y>>2)*3)%8===0)))c=[c[0]-22,c[1]-20,c[2]-18];   // mortar lines
    if(x>=12&&x<30&&y>=12&&y<29)c=(y%2?[176+n,180+n,184+n]:[150+n,154+n,160+n]);  // roll-up door
    if(x>=19&&x<23&&y>=9&&y<12)c=[235,214,60];                    // dock number plate
    if(x>=34&&x<44&&y>=24&&y<29)c=[150+n,110+n,60+n];             // wooden crate
    if(x>=36&&x<41&&y>=21&&y<24)c=[40+n,80+n,190+n];              // blue binder
    if(x===6&&y>=10&&y<29)c=[60,60,64];if(x>=4&&x<9&&y===10)c=[255,236,160];      // lamp post
    put(x,y,c);}
  return px;}
const PX0=photoPixels();
function toBMP(px){const rowB=PW*3,size=54+rowB*PH,b=new Uint8Array(size),dv=new DataView(b.buffer);b[0]=0x42;b[1]=0x4D;dv.setUint32(2,size,true);dv.setUint32(10,54,true);
  dv.setUint32(14,40,true);dv.setInt32(18,PW,true);dv.setInt32(22,PH,true);dv.setUint16(26,1,true);dv.setUint16(28,24,true);dv.setUint32(34,rowB*PH,true);dv.setInt32(38,2835,true);dv.setInt32(42,2835,true);
  for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const s=(y*PW+x)*3,d=54+(PH-1-y)*rowB+x*3;b[d]=px[s+2];b[d+1]=px[s+1];b[d+2]=px[s];}return b;}

/* Five copies, each with its own chain of custody. Entry 0 is the examiner who made the copy. */
const COPIES=[
  {L:'A',dest:'Prosecutor',chain:[['T. Nakamura','Examiner'],['L. Ortiz','Clerk'],['Swift Courier','Courier'],['M. Chen','Prosecutor']]},
  {L:'B',dest:'Defense',chain:[['T. Nakamura','Examiner'],['L. Ortiz','Clerk'],['S. Bloom','Defense']]},
  {L:'C',dest:'Lab archive',chain:[['T. Nakamura','Examiner'],['R. Patel','Archive']]},
  {L:'D',dest:'Detective',chain:[['T. Nakamura','Examiner'],['J. Kerr','Detective'],['A. Fox','Partner']]},
  {L:'E',dest:'Court',chain:[['T. Nakamura','Examiner'],['L. Ortiz','Clerk'],['A. Diaz','Court clerk']]}];
const PEOPLE=['L. Ortiz','Swift Courier','M. Chen','S. Bloom','R. Patel','J. Kerr','A. Fox','A. Diaz'];
const FILES={text:'messages.txt',photo:'IMG_0314.bmp'};
function newCase(seed){const r=rng(seed);const alt=Math.floor(r()*5),file=r()<0.5?'text':'photo',c=COPIES[alt],j=1+Math.floor(r()*(c.chain.length-1)),edit=Math.floor(r()*EDITS.length);
  const pix=[Math.floor(8+r()*32),Math.floor(4+r()*24),Math.floor(r()*3)];
  const times=COPIES.map((cp,ci)=>cp.chain.map((_,i)=>{const d=15+i*2+((ci+i)%2),h=8+((ci*3+i*5)%9),m=(ci*17+i*23)%60;return '03/'+d+' '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}));
  return {seed,alt,file,j,edit,pix,times};}
const caseOf=sim=>{if(!sim.cs)sim.cs=newCase(sim.caseSeed||(sim.caseSeed=26032));return sim.cs;};
const cache={};
function bytesFor(cs,file,altered){if(file==='text')return utf8(altered?TEXT0.replace(EDITS[cs.edit].from,EDITS[cs.edit].to):TEXT0);
  const px=PX0.slice();if(altered){const i=(cs.pix[1]*PW+cs.pix[0])*3+cs.pix[2];px[i]=px[i]>=255?254:px[i]+1;}return toBMP(px);}
function hashOf(cs,file,altered,algo){const key=cs.seed+'|'+file+'|'+(altered?1:0)+'|'+(algo||'sha');if(!cache[key]){const b=bytesFor(cs,file,altered);cache[key]=algo==='md5'?md5(b):sha256(b);}return cache[key];}
const isAlt=(cs,ci,file,stage)=>ci===cs.alt&&file===cs.file&&(stage==='now'||stage>cs.j);
const holderLabel=(ci,i)=>COPIES[ci].chain[i][0];

/* ---------- drive imaging model: 1,024 bytes of a tiny file system ---------- */
const DRV_FILES=[['NOTES   TXT','meeting moved. bring the binder.'],['PLAN    TXT','north door, 9:30, use the side lot'],['IMG_0412JPG','\xFF\xD8\xFF\xE0 JFIF photo data (stand-in)'],['LEDGER  CSV','date,item,amount\n03/02,parts,40\n03/09,parts,65'],['README  TXT','EVIDENCE-USB (fictional) seized 03/16']];
function makeDrive(){const b=new Uint8Array(1024),dv=new DataView(b.buffer),put=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i)&255;};
  put(0,'RJFS1 EVIDENCE-USB (fictional) ');dv.setUint32(40,7,true);dv.setUint32(44,1773590400,true);b[48]=0;
  let data=320;DRV_FILES.forEach((f,i)=>{const o=64+i*32;put(o,f[0]);b[o+11]=0x20;dv.setUint32(o+12,f[1].length,true);dv.setUint32(o+16,1772900000+i*86400,true);dv.setUint32(o+20,1773000000+i*86400,true);dv.setUint16(o+24,data,true);put(data,f[1]);data+=96;});
  const r=rng(77);for(let i=800;i<1024;i++)b[i]=Math.floor(r()*256);return b;}
const DRIVE0=makeDrive(),DRIVE0_H=sha256(DRIVE0);
/* OS writes that happen while the drive is connected without a write blocker */
function osWrite(b,what){const dv=new DataView(b.buffer),put=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i)&255;};
  if(what==='mount'){b[48]=1;dv.setUint32(40,8,true);dv.setUint32(44,1774000000,true);put(64+5*32,'SYSVOLINFO ');b[64+5*32+11]=0x10;}
  if(what==='index'){put(900,'INDEX v2: notes plan img_0412 ledger readme  ');}
  if(what==='atime'){for(let i=0;i<5;i++)dv.setUint32(64+i*32+20,1774000300+i,true);}}
const STEPS=['Connect the drive','Hash the drive (before)','Make the forensic image','Hash the image','Hash the drive again (after)'];
const STEP_DUR=[0.9,1.1,2.6,0.8,1.1];
function imgInit(){return {step:0,busy:false,el:0,drive:DRIVE0.slice(),image:null,hB:null,hI:null,hA:null,packets:[],auto:false,idle:0,events:[],blockedN:0,wroteN:0};}
function sendWrite(sim,what){const im=sim.st.img;im.packets.push({k:'w',p:0,what,blocked:!!sim.p.blocker});}
function imgStart(sim){const im=sim.st.img;if(im.busy||im.step>=5)return false;im.busy=true;im.el=0;im.fired={};return true;}
function imgFinish(sim){const im=sim.st.img,s=im.step;
  if(s===1)im.hB=sha256(im.drive);if(s===3)im.hI=sha256(im.image);if(s===4)im.hA=sha256(im.drive);
  im.step++;im.busy=false;im.idle=0;sim.infoDirty=true;}
function imgTick(sim,dt){const im=sim.st.img;
  im.packets.forEach(pk=>{pk.p+=dt*1.6;if(pk.k==='w'&&!pk.done&&pk.p>=(pk.blocked?0.55:1)){pk.done=true;if(pk.blocked)im.blockedN++;else{osWrite(im.drive,pk.what);im.wroteN++;}}});
  im.packets=im.packets.filter(pk=>pk.p<(pk.k==='w'&&pk.blocked?0.8:1.05));
  if(im.busy){const s=im.step,D=STEP_DUR[s];im.el+=dt;const f=clamp(im.el/D,0,1),F=im.fired;
    if(s===0&&!F.m&&f>0.35){F.m=1;sendWrite(sim,'mount');}
    if((s===1||s===4||s===2)&&Math.random()<dt*9)im.packets.push({k:'r',p:0});
    if(s===2){if(!F.i&&f>0.3){F.i=1;sendWrite(sim,'index');}if(!F.a&&f>0.55){F.a=1;sendWrite(sim,'atime');}
      // the imager copies byte by byte from start to end: bytes behind the read head are already in the image
      if(!im.image)im.image=new Uint8Array(1024);const upto=Math.floor(f*1024);for(let i=im.copied||0;i<upto;i++)im.image[i]=im.drive[i];im.copied=upto;}
    if(f>=1&&!im.packets.some(p=>p.k==='w'&&!p.done)){if(s===2){for(let i=im.copied||0;i<1024;i++)im.image[i]=im.drive[i];im.copied=1024;}imgFinish(sim);}}
  else if(im.auto&&im.step<5){im.idle+=dt;if(im.idle>0.45)imgStart(sim);}}
const imgVerdict=im=>{if(im.step<5)return null;const same=hex(im.hB)===hex(im.hI)&&hex(im.hI)===hex(im.hA);return same?'verified':'changed';};

/* ---------- collision lab: truncate SHA-256 to b bits ---------- */
const fileName=i=>'Exhibit '+String(i).padStart(4,'0');
function colInit(){return {h2:[],queue:0,acc:0};}
const trunc=(h2,b)=>h2>>(16-b);
function colStats(st,b){const c=st.col,seen=new Map();let first=null,pairs=0;c.h2.forEach((h,i)=>{const v=trunc(h,b),n=seen.get(v)||0;pairs+=n;if(n&&first===null)first=i+1;seen.set(v,n+1);});
  return {n:c.h2.length,first,pairs,used:seen.size,seen};}
function colAdd(st){const c=st.col,i=c.h2.length+1,h=sha256(utf8(fileName(i)+' (fictional case file)'));c.h2.push((h[0]<<8)|h[1]);}

/* ---------- the avalanche sandbox ---------- */
const A0='The suspect left the lab at 9:30 pm.';
function flipOne(s,r){if(!s.length)return 'a';const i=Math.floor(r()*s.length),c=s[i];let n;
  if(/[a-y]/.test(c)||/[A-Y]/.test(c)||/[0-8]/.test(c))n=String.fromCharCode(c.charCodeAt(0)+1);else if(c==='z')n='a';else if(c==='Z')n='A';else if(c==='9')n='0';else if(c===' ')n='_';else n='x';
  return s.slice(0,i)+n+s.slice(i+1);}
const algoOf=sim=>atLeast('ap')&&sim.p.algo==='md5'?'md5':'sha';
const H_=(s,algo)=>algo==='md5'?md5(utf8(s)):sha256(utf8(s));

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!atLeast('honors')&&sim.p.mode==='image')BioLab.setValues(sim,{mode:'case'});if(!atLeast('ap')&&sim.p.mode==='collide')BioLab.setValues(sim,{mode:'case'});
  if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}

/* ---------- drawing helpers ---------- */
function mono(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||14)+'px '+MONO;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
/* hex string in lines of `per` characters; characters that differ from `ref` drawn in red */
function hexLines(ctx,h,ref,x,y,size,per,lh,dim){ctx.font='600 '+size+'px '+MONO;const cw=ctx.measureText('0').width;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  for(let i=0;i<h.length;i++){const row=Math.floor(i/per),col=i%per,gx=x+col*cw+Math.floor(col/8)*cw*0.5;const bad=ref&&ref[i]!==h[i];ctx.fillStyle=bad?PAL['s1']:(dim?PAL['cv-soft']:PAL['cv-ink']);ctx.fillText(h[i],gx,y+row*lh);}
  return per*cw+Math.floor((per-1)/8)*cw*0.5;}
function box(ctx,x,y,w,h,o){o=o||{};rr(ctx,x,y,w,h,o.r||10);ctx.fillStyle=o.fill||PAL['card'];ctx.fill();ctx.strokeStyle=o.stroke||PAL['line'];ctx.lineWidth=o.lw||1;ctx.stroke();}
function fitText(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;if(ctx.measureText(s).width<=maxW)return s;while(s.length>1&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);return s+'…';}
const photoCv={};
function photoCanvas(cs,altered){const key=cs.seed+'|'+(altered?1:0);if(photoCv[key])return photoCv[key];const cv=document.createElement('canvas');cv.width=PW;cv.height=PH;const g=cv.getContext('2d'),img=g.createImageData(PW,PH);
  const b=bytesFor(cs,'photo',altered);for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const s=54+(PH-1-y)*PW*3+x*3,d=(y*PW+x)*4;img.data[d]=b[s+2];img.data[d+1]=b[s+1];img.data[d+2]=b[s];img.data[d+3]=255;}
  g.putImageData(img,0,0);photoCv[key]=cv;return cv;}
function arrowR(ctx,x1,y,x2,c){ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2-7,y);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y);ctx.lineTo(x2-8,y-5);ctx.lineTo(x2-8,y+5);ctx.closePath();ctx.fill();}
const okFg=()=>PAL['cv-bg'];
function gmsg(ctx,box,lines){lines.forEach((l,i)=>txt(ctx,l,box.cw/2,box.ch/2+(i-(lines.length-1)/2)*20,{s:14,c:PAL['muted'],a:'center',b:'middle'}));}

/* ---------- case mode ---------- */
function pillW(ctx,s,size){ctx.font='700 '+size+'px '+FONT;return ctx.measureText(s).width+size*1.1;}
function drawCase(sim,ctx,k){const cs=caseOf(sim),p=sim.p,st=sim.st,ci=Math.round(p.copy),file=p.file,cp=COPIES[ci],cmp=k>1.3,L=sim.vis.L={};
  const h0=hex(hashOf(cs,file,false,'sha')),lh=19*k,hs=14*k;let y=12;
  // acquisition record
  const aw=cmp?776:330,ah=Math.round(cmp?24*k+2*lh+14:24*k+21*k+2*lh+16);
  box(ctx,12,y,aw,ah,{});txt(ctx,cmp?'Original hash ('+FILES[file]+')':'Original, hashed at acquisition',26,y+22*k,{s:14*k,w:700});
  let hy=y+22*k+lh+4;if(!cmp){txt(ctx,FILES[file]+'  ·  examiner T. Nakamura  ·  03/15 09:12',26,y+22*k+20,{s:12,c:PAL['cv-soft']});hy+=20;}
  hexLines(ctx,h0,null,26,hy,hs,32,lh);L.acq=[8,y-4,aw+8,ah+8];
  if(!cmp){const px=354,pw=434;box(ctx,px,y,pw,ah,{fill:PAL['card2']});txt(ctx,'What the original shows',px+12,y+20,{s:13,w:700,c:PAL['cv-soft']});
    if(file==='text'){TEXT0.split('\n').slice(2,6).forEach((ln,i)=>{ctx.font='12px '+MONO;mono(ctx,ln,px+12,y+42+i*17,{s:12});});}
    else{ctx.imageSmoothingEnabled=false;const sc=Math.min((pw-24)/PW,(ah-34)/PH),iw=PW*sc,ih=PH*sc;ctx.drawImage(photoCanvas(cs,false),px+(pw-iw)/2,y+28,iw,ih);ctx.imageSmoothingEnabled=true;}
    L.prev=[px-4,y-4,pw+8,ah+8];}
  // the five copies
  y+=ah+12;const cw=(776-4*8)/5,chh=Math.round(cmp?16*k+24*k+12:16+16+26+16);
  COPIES.forEach((c,i)=>{const x=12+i*(cw+8),sel=i===ci,done=st.hashed[i+'|'+file],alt=isAlt(cs,i,file,'now');
    box(ctx,x,y,cw,chh,{fill:sel?PAL['card']:PAL['card2'],stroke:sel?PAL['rj']:PAL['line'],lw:sel?2.5:1});
    txt(ctx,(cmp?'':'Copy ')+c.L,x+cw/2,y+18*k,{s:(cmp?16:14)*k,w:700,a:'center'});if(!cmp)txt(ctx,c.dest,x+cw/2,y+34,{s:12,c:PAL['cv-soft'],a:'center'});
    const py=y+chh-15*k;if(done)pill(ctx,alt?(cmp?'✗':'✗ Changed'):(cmp?'✓':'✓ Match'),x+cw/2,py,alt?PAL['s1']:PAL['s3'],okFg(),12*k);else txt(ctx,cmp?'—':'not hashed',x+cw/2,py+4*k,{s:12*k,c:PAL['cv-soft'],a:'center'});});
  L.cards=[8,y-4,784,chh+8];
  // selected copy: the hash you computed, and its custody log
  y+=chh+12;const dh=H-12-y;box(ctx,12,y,776,dh,{});const done=st.hashed[ci+'|'+file],hn=hex(hashOf(cs,file,isAlt(cs,ci,file,'now'),'sha'));
  txt(ctx,cmp?'Copy '+cp.L+' now':'Copy '+cp.L+' ('+cp.dest+') · SHA-256 of '+FILES[file]+' now',26,y+22*k,{s:14*k,w:700});
  if(done){const same=hn===h0,msg=same?'✓ Exact match':'✗ '+[...hn].filter((c,i)=>c!==h0[i]).length+' of 64 differ',pw=pillW(ctx,msg,13*k);pill(ctx,msg,776-pw/2,y+16*k,same?PAL['s3']:PAL['s1'],okFg(),13*k);}
  hy=y+22*k+lh+4;
  if(done)hexLines(ctx,hn,h0,26,hy,hs,32,lh);
  else{txt(ctx,'Press “Hash this copy” to compute',26,hy,{s:13*k,c:PAL['cv-soft']});txt(ctx,'its SHA-256 and compare.',26,hy+lh,{s:13*k,c:PAL['cv-soft']});}
  L.now=[8,y-4,784,22*k+2*lh+20];
  // custody chain
  const cy=hy+2*lh+6;txt(ctx,cmp?'Custody log':'Custody log: the hash recorded when each person received the copy',26,cy,{s:13*k,w:700,c:PAL['cv-soft']});
  const n=cp.chain.length+1,gap=20,nw=(776-28-(n-1)*gap)/n,ny=cy+10,nh=Math.round(cmp?14*k*2+24:86);
  for(let i=0;i<n;i++){const x=26+i*(nw+gap),last=i===n-1;let logged,who,role,when;
    if(!last){who=cp.chain[i][0];role=cp.chain[i][1];when=cs.times[ci][i];logged=hex(hashOf(cs,file,isAlt(cs,ci,file,i),'sha'));}
    else{who='You';role='Now';when='today';logged=done?hn:null;}
    const ok=logged?logged===h0:null;box(ctx,x,ny,nw,nh,{fill:last?PAL['card2']:PAL['card'],stroke:ok===false?PAL['s1']:PAL['line'],lw:ok===false?2:1,r:8});
    txt(ctx,fitText(ctx,role,nw-14,13*k,700),x+8,ny+17*k,{s:13*k,w:700});
    if(!cmp){txt(ctx,fitText(ctx,who,nw-14,12),x+8,ny+36,{s:12,c:PAL['cv-soft']});txt(ctx,when,x+8,ny+52,{s:12,c:PAL['cv-soft']});}
    const hy2=ny+nh-10;if(logged){mono(ctx,logged.slice(0,cmp?6:8)+'…',x+8,hy2,{s:13*k,w:600,c:ok?PAL['cv-ink']:PAL['s1']});txt(ctx,ok?'✓':'✗',x+nw-8,hy2,{s:15*k,w:800,c:ok?PAL['s3']:PAL['s1'],a:'right'});}
    else mono(ctx,'— —',x+8,hy2,{s:13*k,c:PAL['cv-soft']});
    if(!last)arrowR(ctx,x+nw+3,ny+nh/2,x+nw+gap-3,PAL['cv-soft']);}
  L.chain=[8,cy-18*k,784,nh+18*k+20];
  // results so far (desktop): every copy and file you have hashed
  if(!cmp){let ty=ny+nh+30;txt(ctx,'Your hash results so far',26,ty,{s:13,w:700,c:PAL['cv-soft']});ty+=8;
    ['text','photo'].forEach((f,r)=>{const yy=ty+r*26;txt(ctx,FILES[f],26,yy+18,{s:13});COPIES.forEach((c,i)=>{const x=170+i*92,d=st.hashed[i+'|'+f],a=isAlt(cs,i,f,'now');rr(ctx,x,yy+2,84,22,6);ctx.fillStyle=d?(a?PAL['s1']:PAL['s3']):PAL['card2'];ctx.fill();
      txt(ctx,c.L+(d?(a?'  ✗':'  ✓'):'  ·'),x+42,yy+18,{s:13,w:700,a:'center',c:d?okFg():PAL['cv-soft']});});});
    L.results=[16,ny+nh+12,660,72];
    txt(ctx,'A match proves the bytes are identical. The first ✗ in a custody log shows when a copy changed.',26,H-26,{s:12,c:PAL['cv-soft']});}}

/* ---------- imaging mode ---------- */
function drawImage(sim,ctx,k){const im=sim.st.img,p=sim.p,cmp=k>1.3,L=sim.vis.L={};const blk=!!p.blocker,conn=im.step>=1||(im.busy&&im.step===0);
  const cyl=96,dx=150,bx=400,lx=660;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(dx+60,cyl);ctx.lineTo(conn?lx-90:dx+130,cyl);ctx.stroke();
  box(ctx,dx-62,cyl-36,124,72,{fill:'#3d4a5c',stroke:'#2a3340',r:10});ctx.fillStyle='#9aa7b8';ctx.fillRect(dx+62,cyl-14,20,28);
  txt(ctx,cmp?'USB':'Seized USB',dx,cyl-4,{s:14*k,w:700,c:'#fff',a:'center'});if(!cmp)txt(ctx,'drive',dx,cyl+16,{s:12,c:'#dfe6ee',a:'center'});
  if(blk){box(ctx,bx-74,cyl-44,148,88,{fill:'#5b4a8a',stroke:'#3f3166',r:10});txt(ctx,cmp?'Blocker':'Write blocker',bx,cyl-14,{s:14*k,w:700,c:'#fff',a:'center'});
    ctx.fillStyle='#64d48a';ctx.beginPath();ctx.arc(bx-46,cyl+20,6,0,6.29);ctx.fill();txt(ctx,'read',bx-36,cyl+20,{s:12*k,w:700,c:'#fff',b:'middle'});
    ctx.fillStyle='#ff7b7b';ctx.beginPath();ctx.arc(bx+22,cyl+20,6,0,6.29);ctx.fill();txt(ctx,'write',bx+32,cyl+20,{s:12*k,w:700,c:'#fff',b:'middle'});
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx+17,cyl+15);ctx.lineTo(bx+27,cyl+25);ctx.moveTo(bx+27,cyl+15);ctx.lineTo(bx+17,cyl+25);ctx.stroke();}
  else pill(ctx,'No write blocker',bx,cyl-34,PAL['s4'],okFg(),13*k);
  box(ctx,lx-92,cyl-50,184,100,{fill:'#2f3540',stroke:'#1f242c',r:8});box(ctx,lx-82,cyl-42,164,70,{fill:'#16324a',stroke:'#16324a',r:4});
  txt(ctx,cmp?'Laptop':'Examiner',lx,cyl-10,{s:14*k,w:700,c:'#fff',a:'center'});if(!cmp)txt(ctx,'laptop',lx,cyl+10,{s:12,c:'#cfe2f3',a:'center'});
  im.packets.forEach(pk=>{if(pk.k==='r'){const x=dx+82+(lx-92-dx-82)*Math.min(1,pk.p);ctx.fillStyle=PAL['s2'];rr(ctx,x-7,cyl-5,14,10,3);ctx.fill();}
    else{const f=pk.blocked?Math.min(pk.p,0.55):Math.min(1,pk.p),x=lx-92-(lx-92-dx-82)*f;ctx.fillStyle=PAL['s1'];rr(ctx,x-7,cyl-5,14,10,3);ctx.fill();
      if(pk.blocked&&pk.p>0.5)txt(ctx,'✗ write blocked',x,cyl+64,{s:13*k,w:800,c:PAL['s1'],a:'center'});}});
  L.devices=[70,cyl-58,710,150];
  // what is happening now
  const sy=cyl+90+6*k,v=imgVerdict(im);
  if(v)pill(ctx,v==='verified'?(cmp?'✓ All three hashes match':'✓ Verified: before, image and after all match'):(cmp?'✗ The drive changed':'✗ The drive changed while it was connected'),400,sy-5*k,v==='verified'?PAL['s3']:PAL['s1'],okFg(),14*k);
  else txt(ctx,'Step '+(im.step+1)+' of 5: '+STEPS[im.step],400,sy,{s:15*k,w:700,a:'center'});
  if(im.busy){const f=clamp(im.el/STEP_DUR[im.step],0,1);rr(ctx,250,sy+8,300,8,4);ctx.fillStyle=PAL['card2'];ctx.fill();rr(ctx,250,sy+8,Math.max(8,300*f),8,4);ctx.fillStyle=PAL['rj'];ctx.fill();}
  // sector map: one square per byte
  const cwc=cmp?8:10,cols=64,rows=16,mx=(W-cols*cwc)/2,my=sy+28+12*k;
  txt(ctx,cmp?'Drive bytes (red = changed)':'The drive’s 1,024 bytes, one square each. Red = changed since the drive was seized.',W/2,my,{s:13*k,c:PAL['cv-soft'],a:'center'});
  const gy=my+8;const REG=[[0,64,'s2','boot record'],[64,320,'s5','file table'],[320,800,'s3','file data'],[800,1024,'cv-soft','free space']];
  for(let i=0;i<1024;i++){const x=mx+(i%cols)*cwc,y=gy+Math.floor(i/cols)*cwc,ch=im.drive[i]!==DRIVE0[i],rg=REG.find(r=>i<r[1]);
    ctx.fillStyle=ch?PAL['s1']:PAL[rg[2]];ctx.globalAlpha=ch?1:(0.16+((DRIVE0[i]*37)%60)/220);ctx.fillRect(x+1,y+1,cwc-2,cwc-2);}ctx.globalAlpha=1;
  if(im.busy&&im.step===2&&im.copied!==undefined){const i=Math.min(1023,im.copied),x=mx+(i%cols)*cwc,y=gy+Math.floor(i/cols)*cwc;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.strokeRect(x-1,y-1,cwc+2,cwc+2);}
  let ty=gy+rows*cwc+10;
  if(!cmp){let lx2=mx;REG.forEach(r=>{ctx.fillStyle=PAL[r[2]];ctx.globalAlpha=0.5;ctx.fillRect(lx2,ty+2,12,12);ctx.globalAlpha=1;txt(ctx,r[3],lx2+17,ty+13,{s:12,c:PAL['cv-soft']});ctx.font='12px '+FONT;lx2+=ctx.measureText(r[3]).width+40;});
    ctx.fillStyle=PAL['s1'];ctx.fillRect(lx2,ty+2,12,12);txt(ctx,'changed',lx2+17,ty+13,{s:12,c:PAL['cv-soft']});ty+=22;}
  L.map=[mx-6,my-18*k,cols*cwc+12,rows*cwc+30*k+(cmp?0:22)];
  // hash table
  ty+=22*k;const rowsH=[['Drive before',im.hB],['Image',im.hI],['Drive after',im.hA],['Drive as seized',DRIVE0_H,true]];const ref=im.hB?hex(im.hB):null;L.hashes=[12,ty-22*k,776,H-ty+16*k];
  const hx=cmp?250:150;rowsH.forEach(([n,h,seized],i)=>{const y=ty+i*23*k;txt(ctx,n,26,y,{s:13*k,w:700,c:seized?PAL['cv-soft']:PAL['cv-ink']});
    if(!h){mono(ctx,'not yet',hx,y,{s:13*k,c:PAL['cv-soft']});return;}const hh=hex(h),show=cmp?hh.slice(0,16)+'…':hh;
    hexLines(ctx,show,(seized||i===0||!ref)?null:ref.slice(0,show.length),hx,y,(cmp?13:12.5)*k,show.length,0,seized);
    if(!seized&&i>0)txt(ctx,hh===ref?'✓':'✗',788,y,{s:15*k,w:800,c:hh===ref?PAL['s3']:PAL['s1'],a:'right'});});}

/* ---------- avalanche sandbox ---------- */
function drawSandbox(sim,ctx,k){const st=sim.st,algo=algoOf(sim),cmp=k>1.3,L=sim.vis.L={},nb=algo==='md5'?128:256,name=algo==='md5'?'MD5':'SHA-256';
  const A=H_(st.a,algo),B=H_(st.b,algo),ha=hex(A),hb=hex(B),diff=bitDiff(A,B),lh=19*k,hs=14*k;
  const colW=cmp?776:400;let y=12;
  [['Text A',st.a,ha,null],['Text B',st.b,hb,ha]].forEach(([n,s,h,ref])=>{const nl=Math.ceil(h.length/32),bh=Math.round(cmp?20*k+nl*lh+8:20+18+nl*lh+14);box(ctx,12,y,colW,bh,{});
    txt(ctx,n,26,y+20*k,{s:14*k,w:700});ctx.font='700 '+14*k+'px '+FONT;const nw=ctx.measureText(n+'  ').width;txt(ctx,fitText(ctx,'“'+s+'”',colW-28-nw,13*k),26+nw,y+20*k,{s:13*k,c:PAL['cv-soft']});
    let hy=y+20*k+lh;if(!cmp){txt(ctx,name+' hash',26,y+38,{s:12,w:700,c:PAL['cv-soft']});hy=y+38+lh;}
    hexLines(ctx,h,ref,26,hy,hs,32,lh);y+=bh+10;});
  L.hashes=[8,8,colW+8,y-6];
  // bit grid
  const cols=16,rows=nb/16;let gx,gy,cell;
  if(cmp){cell=Math.min(20,(H-y-56*k)/Math.max(rows,12));gx=(W-cols*cell)/2;gy=y+24*k;}else{cell=22;gx=430;gy=44+(16-rows)*11;}
  txt(ctx,'The '+nb+' bits of the hash: red = differs',gx+cols*cell/2,gy-10,{s:13*k,w:700,a:'center'});
  for(let i=0;i<nb;i++){const byte=i>>3,bit=7-(i&7),d=((A[byte]^B[byte])>>bit)&1,x=gx+(i%cols)*cell,yy=gy+Math.floor(i/cols)*cell;ctx.fillStyle=d?PAL['s1']:PAL['card2'];ctx.fillRect(x+1,yy+1,cell-2,cell-2);}
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(gx,gy,cols*cell,rows*cell);L.grid=[gx-8,gy-28*k,cols*cell+16,rows*cell+36*k+(cmp?24*k:24)];
  const pct=diff/nb*100,ty=gy+rows*cell+22*k;
  txt(ctx,diff+' of '+nb+' bits changed ('+pct.toFixed(0)+'%)',gx+cols*cell/2,ty,{s:14*k,w:700,a:'center',c:diff?PAL['s1']:PAL['s3']});
  if(!cmp){// what changed, in words and numbers
    let yy=y+8;box(ctx,12,yy,colW,H-12-yy,{fill:PAL['card2']});yy+=24;txt(ctx,st.a===st.b?'A and B are identical.':'How different are A and B?',26,yy,{s:14,w:700});yy+=22;
    let dc=0;const la=st.a.length,lb=st.b.length;for(let i=0;i<Math.max(la,lb);i++)if(st.a[i]!==st.b[i])dc++;
    const lines=st.a===st.b?['Identical text always gives the identical hash.','Press “Change one character in B”, or edit','Text B in the panel below the stage.']:
      ['The texts differ in '+dc+' character position'+(dc===1?'':'s')+'.','The hashes differ in '+diff+' of '+nb+' bits ('+pct.toFixed(0)+'%).','A tiny change in, a huge change out: the avalanche effect.'];
    lines.forEach(l=>{txt(ctx,l,26,yy,{s:13,c:PAL['cv-soft']});yy+=19;});
    // bar: share of bits changed, with the 50% mark
    yy+=6;rr(ctx,26,yy,colW-28,14,7);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();rr(ctx,26,yy,Math.max(0,(colW-28)*diff/nb),14,7);ctx.fillStyle=PAL['s1'];ctx.fill();
    const mx=26+(colW-28)/2;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mx,yy-4);ctx.lineTo(mx,yy+18);ctx.stroke();txt(ctx,'50%',mx,yy+32,{s:12,c:PAL['cv-soft'],a:'center'});yy+=50;
    if(atLeast('honors'))txt(ctx,'Input: '+utf8(st.b).length+' bytes of Text B. Output: always '+nb/8+' bytes ('+nb+' bits).',26,yy,{s:13,c:PAL['cv-soft']});
    if(atLeast('ap')){yy+=19;txt(ctx,'First byte of hash B: 0x'+hb.slice(0,2)+' = '+parseInt(hb.slice(0,2),16).toString(2).padStart(8,'0')+' in binary',26,yy,{s:13,c:PAL['cv-soft']});
      yy+=19;txt(ctx,'Expected bits changed: '+nb/2+' ± '+(Math.sqrt(nb)/2).toFixed(0)+' (binomial, p = ½)',26,yy,{s:13,c:PAL['cv-soft']});}
    const fl=st.flips.slice(-10);if(fl.length){yy+=30;txt(ctx,'Your last '+fl.length+' one-character edits changed:',26,yy,{s:13,w:700});yy+=20;txt(ctx,fl.map(e=>e.d).join(', ')+' bits',26,yy,{s:13,c:PAL['cv-soft']});}
    L.words=[8,y+4,colW+8,H-y-12];}}

/* ---------- collision lab ---------- */
function drawCollide(sim,ctx,k){const st=sim.st,b=Math.round(sim.p.bits),S=colStats(st,b),cmp=k>1.3,L=sim.vis.L={};const nb=1<<b,side=Math.round(Math.sqrt(nb)),gsz=cmp?Math.min(400,H-160*k):440,cell=gsz/side,gx=cmp?(W-gsz)/2:24,gy=cmp?44*k:56;
  txt(ctx,(cmp?'':'Each square is one possible '+b+'-bit hash value: ')+nb.toLocaleString()+' squares',cmp?W/2:gx,gy-14,{s:13*k,w:700,a:cmp?'center':'left'});
  const cnt=S.seen,g=cell>4?0.5:0;for(let v=0;v<nb;v++){const x=gx+(v%side)*cell,y=gy+Math.floor(v/side)*cell,n=cnt.get(v)||0;ctx.fillStyle=n>1?PAL['s1']:n===1?PAL['s2']:PAL['card2'];ctx.fillRect(x+g,y+g,cell-2*g,cell-2*g);
    if(n>1&&cell>=24)txt(ctx,String(n),x+cell/2,y+cell/2+1,{s:12*k,w:800,c:okFg(),a:'center',b:'middle'});}
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(gx,gy,gsz,gsz);L.grid=[gx-6,gy-30,gsz+12,gsz+40];
  if(!cmp){const x=492;let y=70;txt(ctx,'Files hashed, newest first',x,y,{s:13,w:700,c:PAL['cv-soft']});y+=22;
    const firstOf=new Map();st.col.h2.forEach((h,i)=>{const v=trunc(h,b);if(!firstOf.has(v))firstOf.set(v,i+1);});
    const list=st.col.h2.map((h,i)=>({i:i+1,v:trunc(h,b)})).slice(-14).reverse();
    list.forEach(e=>{const f=firstOf.get(e.v),col=f!==e.i;mono(ctx,fileName(e.i)+' → '+e.v.toString(16).padStart(Math.ceil(b/4),'0'),x,y,{s:13,c:col?PAL['s1']:PAL['cv-ink'],w:col?700:400});
      if(col)txt(ctx,'same as #'+f,x+196,y,{s:12,c:PAL['s1'],w:700});y+=19;});
    if(!list.length)txt(ctx,'Press “Hash 50 more files”.',x,y,{s:13,c:PAL['cv-soft']});
    L.list=[x-8,52,300,300];}
  const y2=cmp?gy+gsz+26*k:H-64,expFirst=Math.sqrt(Math.PI/2*nb),xx=cmp?W/2:492,al=cmp?'center':'left';
  txt(ctx,S.first?'First collision: file #'+S.first:'No collision yet',xx,y2,{s:14*k,w:700,a:al,c:S.first?PAL['s1']:PAL['cv-ink']});
  txt(ctx,'Birthday estimate ≈ '+expFirst.toFixed(0)+' files',xx,y2+19*k,{s:13*k,a:al,c:PAL['cv-soft']});
  if(!cmp)txt(ctx,'Pigeonhole guarantee: '+(nb+1).toLocaleString()+' files',xx,y2+38,{s:13,c:PAL['cv-soft']});}

/* ---------- the definition ---------- */
const HASH={
  id:'hashing',hash:'hashing',apUnit:18,order:1,tab:'Hashing and chain of custody',kind:'Virtual lab',
  card:'Hash five copies of seized phone evidence, find the one that was altered, and trace when it changed in the custody log.',
  title:'Hashing and chain of custody',
  lede:{bio:'A hash is a fingerprint for a file: the same bytes always give the same hash, and any change gives a different one. Use it to find which copy of the evidence someone altered.',
        honors:'Investigators record a SHA-256 hash at every handoff. Find the altered copy, pin down who held it when it changed, and see why examiners connect drives through a write blocker.',
        ap:'Measure the avalanche effect bit by bit, compare SHA-256 with the broken MD5, and test the pigeonhole and birthday limits on a shortened hash.'},
  scale:{bio:'One phone’s evidence: a 263-byte message export and a 4,662-byte photo. Each SHA-256 hash is 64 hex characters.',ap:'SHA-256 turns any input into 256 bits: 2²⁵⁶ ≈ 1.16 × 10⁷⁷ possible values. MD5 gives 128 bits.'},
  aspect:W/H,timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'case',lvl:'bio',noTrial:false,options:[{v:'case',l:'Investigate'},{v:'image',l:'Image a drive',lvl:'honors'},{v:'sandbox',l:'Try it yourself'},{v:'collide',l:'Collisions',lvl:'ap'}],onChange:syncMode},
    {id:'copy',label:'Examine copy',type:'select',def:0,lvl:'bio',modes:['case'],options:COPIES.map((c,i)=>({v:i,l:'Copy '+c.L+' ('+c.dest+')'})),onChange:s=>{s.infoDirty=true;}},
    {id:'file',label:'File',type:'seg',def:'text',lvl:'bio',modes:['case'],options:[{v:'text',l:'messages.txt'},{v:'photo',l:'IMG_0314.bmp'}]},
    {id:'blocker',label:'Write blocker',type:'toggle',def:true,lvl:'honors',modes:['image'],help:'A hardware device that passes reads to the drive and blocks every write.',onChange:s=>{s.st.img=imgInit();}},
    {id:'algo',label:'Hash algorithm',type:'seg',def:'sha',lvl:'ap',modes:['sandbox'],options:[{v:'sha',l:'SHA-256'},{v:'md5',l:'MD5 (broken)'}]},
    {id:'bits',label:'Shortened hash length',type:'seg',def:8,lvl:'ap',modes:['collide'],options:[{v:6,l:'6 bits'},{v:8,l:'8 bits'},{v:10,l:'10 bits'},{v:12,l:'12 bits'}],help:'Keep only the first few bits of each SHA-256 hash, so collisions become likely.'}
  ],
  actions:[
    {id:'hash',label:'Hash this copy',lvl:'bio',primary:true,modes:['case'],run(sim){sim.st.hashed[Math.round(sim.p.copy)+'|'+sim.p.file]=true;}},
    {id:'hashall',label:'Hash all five copies',lvl:'bio',modes:['case'],run(sim){COPIES.forEach((_,i)=>sim.st.hashed[i+'|'+sim.p.file]=true);}},
    {id:'newcase',label:'New case',lvl:'bio',modes:['case'],run(sim){sim.caseSeed=(sim.caseSeed*7919+13)%100003;sim.cs=null;sim.st.hashed={};sim.st.form={};sim.st.result=null;}},
    {id:'next',label:'Next step',lvl:'honors',primary:true,modes:['image'],run(sim){sim.st.img.auto=false;imgStart(sim);}},
    {id:'runall',label:'Run all steps',lvl:'honors',modes:['image'],run(sim){const im=sim.st.img;if(im.step>=5)sim.st.img=imgInit();sim.st.img.auto=true;imgStart(sim);}},
    {id:'unplug',label:'Unplug and start over',lvl:'honors',modes:['image'],run(sim){sim.st.img=imgInit();}},
    {id:'flip',label:'Change one character in B',lvl:'bio',primary:true,modes:['sandbox'],run(sim){const st=sim.st,algo=algoOf(sim),before=H_(st.b,algo);st.b=flipOne(st.b,st.r);const d=bitDiff(before,H_(st.b,algo));st.flips.push({d,n:algo==='md5'?128:256});}},
    {id:'match',label:'Make B match A',lvl:'bio',modes:['sandbox'],run(sim){sim.st.b=sim.st.a;}},
    {id:'hash1',label:'Hash 1 more file',lvl:'ap',modes:['collide'],run(sim){colAdd(sim.st);}},
    {id:'hash50',label:'Hash 50 more files',lvl:'ap',primary:true,modes:['collide'],run(sim){sim.st.col.queue+=50;}},
    {id:'clear',label:'Start over',lvl:'ap',modes:['collide'],run(sim){sim.st.col=colInit();}}
  ],
  init(sim){caseOf(sim);return {hashed:{},form:{},result:null,img:imgInit(),a:A0,b:A0,flips:[],r:rng(4242),col:colInit()};},
  step(sim,dt){const st=sim.st;if(sim.p.mode==='image')imgTick(sim,dt);
    const c=st.col;if(c.queue>0){c.acc+=dt*24;while(c.acc>=1&&c.queue>0){c.acc-=1;c.queue--;if(c.h2.length<5000)colAdd(st);}}},
  metrics:[
    {id:'nhash',label:'Files you have hashed',unit:'of 10',lvl:'bio',min:0,max:10,d:0,modes:['case'],get:s=>Object.keys(s.st.hashed).length},
    {id:'thiscopy',label:'This copy',lvl:'bio',text:true,modes:['case'],get:s=>{const cs=caseOf(s),ci=Math.round(s.p.copy);if(!s.st.hashed[ci+'|'+s.p.file])return 'Not hashed yet';return isAlt(cs,ci,s.p.file,'now')?'Changed: hash does not match':'Matches the original';}},
    {id:'step',label:'Step',lvl:'honors',text:true,modes:['image'],get:s=>{const im=s.st.img;return im.step>=5?'Done':(im.step+1)+' of 5';}},
    {id:'writes',label:'Writes that reached the drive',unit:'',lvl:'honors',min:0,max:3,d:0,modes:['image'],get:s=>s.st.img.wroteN},
    {id:'blocked',label:'Writes blocked',unit:'',lvl:'honors',min:0,max:3,d:0,modes:['image'],get:s=>s.st.img.blockedN},
    {id:'changedB',label:'Bytes changed on the drive',unit:'bytes',lvl:'honors',min:0,max:120,d:0,modes:['image'],get:s=>{let n=0;const d=s.st.img.drive;for(let i=0;i<1024;i++)if(d[i]!==DRIVE0[i])n++;return n;}},
    {id:'bitsch',label:'Bits changed',unit:'bits',lvl:'bio',min:0,max:256,d:0,modes:['sandbox'],get:s=>{const a=algoOf(s);return bitDiff(H_(s.st.a,a),H_(s.st.b,a));}},
    {id:'pct',label:'Share of the hash changed',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['sandbox'],get:s=>{const a=algoOf(s),n=a==='md5'?128:256;return bitDiff(H_(s.st.a,a),H_(s.st.b,a))/n*100;}},
    {id:'inlen',label:'Text B length',unit:'bytes',lvl:'honors',min:0,max:null,d:0,modes:['sandbox'],get:s=>utf8(s.st.b).length},
    {id:'space',label:'Possible hash values',lvl:'ap',text:true,modes:['sandbox'],get:s=>algoOf(s)==='md5'?'2¹²⁸ ≈ '+pow2sci(128):'2²⁵⁶ ≈ '+pow2sci(256)},
    {id:'reverse',label:'Guesses to reverse by brute force',lvl:'ap',text:true,modes:['sandbox'],get:s=>{const b=algoOf(s)==='md5'?128:256;return '≈ 2'+sup(b-1)+' on average, '+sci(Math.pow(2,b-1)/1e12/3.156e7)+' years at 10¹² guesses/s';}},
    {id:'nfiles',label:'Files hashed',unit:'',lvl:'ap',min:0,max:null,d:0,modes:['collide'],get:s=>s.st.col.h2.length},
    {id:'firstc',label:'First collision at file',lvl:'ap',text:true,modes:['collide'],get:s=>{const S=colStats(s.st,Math.round(s.p.bits));return S.first?'#'+S.first:'none yet';}},
    {id:'pairs',label:'Colliding pairs',unit:'',lvl:'ap',min:0,max:null,d:0,modes:['collide'],get:s=>colStats(s.st,Math.round(s.p.bits)).pairs},
    {id:'exppairs',label:'Expected pairs, n(n−1)/2 ÷ 2ᵇ',unit:'',lvl:'ap',min:0,max:null,d:1,modes:['collide'],get:s=>{const n=s.st.col.h2.length;return n*(n-1)/2/Math.pow(2,Math.round(s.p.bits));}}
  ],
  graphs:[{id:'aval',label:'Bits changed per one-character edit',lvl:'bio',custom:true},{id:'bday',label:'Colliding pairs vs files hashed',lvl:'ap',custom:true}],
  defaultGraph:'aval',
  plot(sim,ctx,box,id){const st=sim.st;
    if(id==='aval'){const f=st.flips;const nb=algoOf(sim)==='md5'?128:256,fl=f.filter(e=>e.n===nb);
      if(!fl.length){gmsg(ctx,box,['In “Try it yourself”, press','“Change one character in B” a few times.']);return;}
      const lo=nb/2-nb/8,hi=nb/2+nb/8,bw=nb/64,nbin=Math.round((hi-lo)/bw),cnt=new Array(nbin).fill(0);fl.forEach(e=>{const i=clamp(Math.floor((e.d-lo)/bw),0,nbin-1);cnt[i]++;});
      const ymax=Math.max(3,...cnt)*1.45,ax=axes(ctx,box,{xmin:lo,xmax:hi,ymin:0,ymax,xl:'Bits changed (of '+nb+')',yl:'Edits'});
      ctx.fillStyle=serColor(1);cnt.forEach((c,i)=>{if(!c)return;const x0=ax.X(lo+i*bw),x1=ax.X(lo+(i+1)*bw);ctx.fillRect(x0+1,ax.Y(c),x1-x0-2,ax.Y(0)-ax.Y(c));});
      const sd=Math.sqrt(nb)/2,N=fl.length;ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();for(let x=lo;x<=hi;x+=0.5){const y=N*bw*Math.exp(-((x-nb/2)**2)/(2*sd*sd))/(sd*Math.sqrt(2*Math.PI));x===lo?ctx.moveTo(ax.X(x),ax.Y(y)):ctx.lineTo(ax.X(x),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
      const mean=fl.reduce((a,e)=>a+e.d,0)/N;legend(ctx,box.L+10,box.T+10,[{label:N+' edits, mean '+mean.toFixed(1),color:serColor(1)}]);legend(ctx,box.L+10,box.T+28,[{label:'expected: '+nb/2+' ± '+sd.toFixed(0),color:PAL['muted'],dash:true}]);return;}
    const b=Math.round(sim.p.bits),nb=1<<b,c=st.col,n=c.h2.length;
    if(!n){gmsg(ctx,box,['In “Collisions”, hash some files','to see the birthday curve.']);return;}
    const pts=[],seen=new Map();let pairs=0;c.h2.forEach((h,i)=>{const v=trunc(h,b),m=seen.get(v)||0;pairs+=m;seen.set(v,m+1);pts.push([i+1,pairs]);});
    const xmax=Math.max(20,n),ymax=Math.max(2,pairs,xmax*(xmax-1)/2/nb)*1.4,ax=axes(ctx,box,{xmin:0,xmax,ymin:0,ymax,xl:'Files hashed',yl:'Colliding pairs'});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=PAL['muted'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=xmax;x+=xmax/80){const y=x*(x-1)/2/nb;x===0?ctx.moveTo(ax.X(x),ax.Y(Math.max(0,y))):ctx.lineTo(ax.X(x),ax.Y(y));}ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(ax.X(q[0]),ax.Y(q[1])):ctx.moveTo(ax.X(q[0]),ax.Y(q[1])));ctx.stroke();ctx.restore();
    legend(ctx,box.L+10,box.T+10,[{label:'your files',color:serColor(0)}]);legend(ctx,box.L+10,box.T+28,[{label:'n(n−1)/2 ÷ 2'+sup(b),color:PAL['muted'],dash:true}]);},
  infoPanel(sim){const p=sim.p,st=sim.st,cs=caseOf(sim),hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const ci=Math.round(p.copy),cp=COPIES[ci],alt=isAlt(cs,ci,p.file,'now'),f=st.form;
      let h='<h3>Case notebook: Case 26-0314 (fictional)</h3><p>Police seized D. Reyes’s phone. Examiner T. Nakamura made a forensic copy, hashed each file, and sent five copies out. At trial, the defense says the evidence was tampered with. One copy really was altered. Find it.</p>';
      h+='<p><b>Copy '+cp.L+', '+FILES[p.file]+'.</b> Original on the left, this copy on the right. Can you see a difference?</p><div style="display:flex;gap:10px;flex-wrap:wrap">';
      const prev=a=>p.file==='text'?'<pre style="margin:0;font:12px/1.35 ui-monospace,Consolas,monospace;white-space:pre-wrap;word-break:break-word;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 8px">'+esc((a?TEXT0.replace(EDITS[cs.edit].from,EDITS[cs.edit].to):TEXT0).split('\n').slice(2).join('\n'))+'</pre>'
        :'<img alt="Loading dock photo'+(a?' (this copy)':' (original)')+'" src="'+photoCanvas(cs,a).toDataURL()+'" style="width:100%;max-width:192px;image-rendering:pixelated;border:1px solid var(--line);border-radius:6px">';
      h+='<div style="flex:1 1 150px;min-width:0"><small>Original</small>'+prev(false)+'</div><div style="flex:1 1 150px;min-width:0"><small>Copy '+cp.L+'</small>'+prev(alt)+'</div></div>';
      const sel=(id,opts,v)=>'<select class="sel" id="hashing-f-'+id+'" style="max-width:100%">'+'<option value="">choose…</option>'+opts.map(o=>'<option value="'+o[0]+'"'+(String(v)===String(o[0])?' selected':'')+'>'+o[1]+'</option>').join('')+'</select>';
      h+='<p style="margin-top:10px"><b>Your findings</b></p><div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 10px;align-items:center;font-size:15px">';
      h+='<label for="hashing-f-copy">Altered copy</label>'+sel('copy',COPIES.map((c,i)=>[i,'Copy '+c.L+' ('+c.dest+')']),f.copy);
      h+='<label for="hashing-f-file">Altered file</label>'+sel('file',[['text','messages.txt'],['photo','IMG_0314.bmp']],f.file);
      if(hon)h+='<label for="hashing-f-who">Changed while held by</label>'+sel('who',PEOPLE.map(n=>[n,n]),f.who);
      h+='</div><div class="row" style="margin-top:8px"><button type="button" class="btn primary" id="hashing-submit">Check my findings</button></div>';
      if(st.result)h+='<p style="margin-top:8px" class="'+(st.result.ok?'verdict ok':'verdict no')+'">'+st.result.msg+'</p>'+(st.result.more?'<p>'+st.result.more+'</p>':'');
      return h;}
    if(p.mode==='image'){const im=st.img;return '<h3>Imaging the seized drive</h3><p>Before examining a drive, investigators make a <b>forensic image</b>: an exact, bit-for-bit copy. They work on the image and lock the original away.</p><ol style="margin:0 0 8px;padding-left:20px;font-size:15px">'+STEPS.map((s,i)=>'<li'+(i<im.step?' style="color:var(--muted)"':'')+'>'+s+(i<im.step?' ✓':'')+'</li>').join('')+'</ol><p>'+(p.blocker?'The write blocker passes read requests to the drive and drops every write request.':'Without a write blocker, the laptop’s operating system writes to any drive you plug in: a “dirty” flag, a system folder, a search index, and new “last accessed” times.')+'</p>'+(ap?'<p>Hash comparison uses all 256 bits. A drive that differs by even one bit gets a completely different hash.</p>':'');}
    if(p.mode==='sandbox'){const alg=algoOf(sim)==='md5'?'MD5':'SHA-256';return '<h3>Try it yourself</h3><p>Type anything. The '+alg+' hash updates as you type. Nothing you type leaves this page.</p>'+
      '<label for="hashing-ta" style="font-weight:700">Text A</label><textarea id="hashing-ta" rows="2" style="width:100%;box-sizing:border-box;font:15px/1.4 ui-monospace,Consolas,monospace;background:var(--card2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;margin:4px 0 8px">'+esc(st.a)+'</textarea>'+
      '<label for="hashing-tb" style="font-weight:700">Text B</label><textarea id="hashing-tb" rows="2" style="width:100%;box-sizing:border-box;font:15px/1.4 ui-monospace,Consolas,monospace;background:var(--card2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;margin:4px 0 8px">'+esc(st.b)+'</textarea>'+
      '<p>Try: change one letter, add a space at the end, or switch a capital letter. Then try a whole book’s worth of text: the hash is still '+(alg==='MD5'?'32':'64')+' hex characters.</p>'+(ap?'<p><b>Self-test:</b> SHA-256(“abc”) = ba7816bf… and SHA-256(“”) = e3b0c442…, MD5(“abc”) = 90015098… '+(SELFTEST?'✓ all match the published test vectors.':'✗ mismatch.')+'</p>':'');}
    const S=colStats(st,Math.round(p.bits)),b=Math.round(p.bits);
    return '<h3>Why collisions must exist</h3><p>A '+b+'-bit hash has only '+(1<<b).toLocaleString()+' possible values, but there are endless possible files. Hash '+((1<<b)+1).toLocaleString()+' files and two <i>must</i> share a value (the <b>pigeonhole principle</b>).</p><p>Collisions show up much sooner than that. Like two students sharing a birthday in a class of 23, the first match is expected after about √(π/2 · 2ᵇ) = '+Math.sqrt(Math.PI/2*(1<<b)).toFixed(0)+' files. '+(S.first?'Yours came at file #'+S.first+'.':'')+'</p><p>For full SHA-256, that estimate is about '+pow2sci(128)+' files. No one has ever found a SHA-256 collision. MD5 collisions can be made on purpose in seconds, so courts and labs moved to SHA-256.</p>';},
  bindInfo(sim,el){const st=sim.st;const ta=el.querySelector('#hashing-ta'),tb=el.querySelector('#hashing-tb');
    if(ta)ta.addEventListener('input',()=>{st.a=ta.value;});if(tb)tb.addEventListener('input',()=>{st.b=tb.value;});
    ['copy','file','who'].forEach(k=>{const s=el.querySelector('#hashing-f-'+k);if(s)s.addEventListener('change',()=>{st.form[k]=s.value;});});
    const sb=el.querySelector('#hashing-submit');if(sb)sb.addEventListener('click',()=>{const cs=caseOf(sim),f=st.form,hon=atLeast('honors'),who=COPIES[cs.alt].chain[cs.j][0];
      const okC=String(f.copy)===String(cs.alt),okF=f.file===cs.file,okW=!hon||f.who===who;const nH=Object.keys(st.hashed).length;
      let msg,more='';if(okC&&okF&&okW){msg='Correct. Copy '+COPIES[cs.alt].L+'’s '+FILES[cs.file]+' was altered'+(hon?' while '+who+' held it':'')+'.';
        more=(cs.file==='text'?'The change: '+EDITS[cs.edit].say+'. One character, and the hash changed completely.':'The change: one pixel at ('+cs.pix[0]+', '+cs.pix[1]+') is one shade '+['redder','greener','bluer'][cs.pix[2]]+'. No one could see it, but the hash caught it.')+(nH<=3?' You found it with only '+nH+' hashes.':'');}
      else{msg='Not yet.';more=(!okC?'Hash every copy of both files and look for the one whose hash does not match the original. ':'')+(okC&&!okF?'Right copy, wrong file: check both files. ':'')+(okC&&okF&&!okW?'Right copy and file. Now read its custody log: the first logged hash that does not match tells you the change happened while the person before it held the copy. ':'');}
      st.result={ok:okC&&okF&&okW,msg,more};sim.infoDirty=true;BioLab.refresh(sim);});},
  narrate(sim){const p=sim.p,st=sim.st,cs=caseOf(sim),hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const ci=Math.round(p.copy),cp=COPIES[ci],key=ci+'|'+p.file;
      if(!st.hashed[key])return 'Copy '+cp.L+' of '+FILES[p.file]+' looks just like the original. <b>Looking is not proof.</b> Hash it and compare all 64 characters with the examiner’s hash.';
      if(!isAlt(cs,ci,p.file,'now'))return '<b>Copy '+cp.L+' matches the original exactly.</b> Every byte is the same, so its hash is the same. Try another copy or the other file.';
      const fi=cp.chain.findIndex((_,i)=>isAlt(cs,ci,p.file,i));
      return '<b>Copy '+cp.L+' has been altered.</b> Its hash differs in almost every character, even though the file looks the same. '+(hon?(fi>0?'The custody log first shows a different hash when '+cp.chain[fi][0]+' received it, so it changed while '+cp.chain[fi-1][0]+' had it.':'Every logged hash matches, so it changed after the last handoff, while '+cp.chain[cp.chain.length-1][0]+' held it.'):'Now check the custody log to see when it changed.');}
    if(p.mode==='image'){const im=st.img,v=imgVerdict(im);
      if(v==='verified')return '<b>Verified.</b> The before hash, the image hash and the after hash all match, so the image is a perfect copy and the original was not touched. The write blocker stopped '+im.blockedN+' writes.';
      if(v==='changed')return '<b>The evidence changed.</b> The operating system wrote to the drive '+im.wroteN+' times, so the before, image and after hashes disagree. A defense lawyer could now argue the evidence was altered.';
      if(im.step===0&&!im.busy)return 'The seized drive is sealed. '+(p.blocker?'It will connect through a <b>write blocker</b>.':'It will connect <b>straight to the laptop</b>, with no write blocker.')+' Press Next step or Run all steps.';
      return (im.wroteN?'<b>'+im.wroteN+' write'+(im.wroteN>1?'s':'')+' reached the drive</b>, changing '+st.img.drive.reduce((a,v,i)=>a+(v!==DRIVE0[i]),0)+' bytes. ':'')+(im.blockedN?'The write blocker has dropped <b>'+im.blockedN+' write'+(im.blockedN>1?'s':'')+'</b> the laptop tried to make. ':'')+'Step '+Math.min(5,im.step+1)+': '+(STEPS[im.step]||'done')+'.';}
    if(p.mode==='sandbox'){const a=algoOf(sim),A=H_(st.a,a),B=H_(st.b,a),d=bitDiff(A,B),n=a==='md5'?128:256;
      if(st.a===st.b)return '<b>Identical text gives an identical hash.</b> Press “Change one character in B” or edit Text B and watch '+(a==='md5'?'MD5':'SHA-256')+' scramble.';
      return '<b>'+d+' of '+n+' bits changed ('+(d/n*100).toFixed(0)+'%).</b> That is the avalanche effect: any change, however small, flips about half the bits, so a near-miss hash never looks “close”.'+(a==='md5'?' MD5 still avalanches, but people can now build two files with the same MD5 on purpose.':'');}
    const S=colStats(st,Math.round(p.bits)),b=Math.round(p.bits);
    return S.first?'<b>Two different files share a '+b+'-bit hash</b> (first at file #'+S.first+'). With only '+(1<<b)+' possible values, collisions come fast. Real SHA-256 has 2²⁵⁶ values, so you would need about 10³⁸ files.':'Hash files one batch at a time and watch for two landing in the same square. With '+(1<<b)+' squares, expect the first collision after about '+Math.sqrt(Math.PI/2*(1<<b)).toFixed(0)+' files.';},
  tour:[
    {title:'The evidence and its fingerprint',text:'An examiner copied the files from a seized phone and ran SHA-256 on each one. The 64-character result is the file’s <b>hash</b>: a fingerprint of every byte.',focus:s=>s.vis.L&&s.vis.L.acq,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',copy:0,file:'text'});}},
    {title:'Five copies went out',text:'Copies went to the prosecutor, the defense expert, the lab archive, the detective and the court. Each copy should still hash to exactly the same value.',focus:s=>s.vis.L&&s.vis.L.cards,speed:1,pause:true},
    {title:'Hash a copy and compare',text:'Hashing copy A gives the same 64 characters as the original. A match means the bytes are identical.',focus:s=>s.vis.L&&s.vis.L.now,speed:1,pause:true,setup(sim){const cs=caseOf(sim),ci=cs.alt===0?1:0;BioLab.setValues(sim,{copy:ci});sim.st.hashed[ci+'|text']=true;}},
    {title:'One character changes everything',text:'Here Text B differs from Text A by one character. About half of the 256 bits flip, shown in red. This <b>avalanche effect</b> is why even a tiny edit cannot hide.',focus:s=>s.vis.L&&[s.vis.L.hashes,s.vis.L.grid],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'sandbox'});sim.st.b=flipOne(sim.st.a,rng(9));}},
    {title:'Follow the chain of custody',text:{bio:'This is the altered copy. Each handoff in its custody log recorded a hash. The first one that does not match shows when the file changed.',honors:'This is the altered copy. The first logged hash that does not match tells you the change happened while the person <i>before</i> that handoff held the copy.'},focus:s=>s.vis.L&&[s.vis.L.now,s.vis.L.chain],speed:1,pause:true,
      setup(sim){const cs=caseOf(sim);BioLab.setValues(sim,{mode:'case',copy:cs.alt,file:cs.file});sim.st.hashed[cs.alt+'|'+cs.file]=true;}},
    {lvl:'honors',title:'Why examiners use a write blocker',text:'With no write blocker, the laptop writes to the drive as soon as it is plugged in. Watch the red squares: those bytes changed, so the hashes no longer match.',focus:s=>s.vis.L&&[s.vis.L.devices,s.vis.L.map],speed:1,setup(sim){BioLab.setValues(sim,{mode:'image',blocker:false});sim.st.img=imgInit();sim.st.img.auto=true;imgStart(sim);}},
    {lvl:'ap',title:'Collisions exist, but you will never find one',text:'Keep only 8 bits of each hash and two files share a value within a few dozen files. That is the birthday effect. With all 256 bits you would need about 4 × 10³⁸ files.',focus:s=>s.vis.L&&s.vis.L.grid,speed:1,setup(sim){BioLab.setValues(sim,{mode:'collide',bits:8});sim.st.col=colInit();sim.st.col.queue=40;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.after)ch.after(sim);}},
  challenges(sim){const cs=caseOf(sim);return [
    {lvl:'bio',q:'Text B is identical to Text A. You change one character in B. How much of B’s SHA-256 hash changes?',choices:['One or two of the 64 hex characters','About half of all its bits, so almost every character looks different','None, because the length stayed the same'],correct:1,
     baseline:{mode:'sandbox'},baselineAction:'match',changeAction:'flip',changeText:'One character of Text B changed',at:0.8,reveal:2.6,
     explain:'Count the red squares: about 128 of the 256 bits flipped. A hash is built so that any change scrambles the whole output. That is why a match proves the files are the same.'},
    {lvl:'bio',instant:true,q:'Hash the copies (Investigate). Which copy of the evidence was altered?',choices:COPIES.map(c=>'Copy '+c.L+' ('+c.dest+')'),correct:cs.alt,set:{mode:'case',copy:cs.alt,file:cs.file},after(sim){sim.st.hashed[cs.alt+'|'+cs.file]=true;},
     explain:'Copy '+COPIES[cs.alt].L+'’s '+FILES[cs.file]+' hashes to a different value; every other copy matches the examiner’s hash exactly. The stage now shows it. The file looks the same, but the bytes are not.'},
    {lvl:'bio',instant:true,q:'Copy B’s SHA-256 matches the examiner’s hash in all 64 characters. What can you conclude?',choices:['Copy B is a bit-for-bit match of the original','Copy B is close to the original but could differ in a few bytes','Nothing, because hashes often match by chance'],correct:0,
     explain:'Any change, even one bit, flips about half of the hash. The chance that a changed file still matches is about 1 in 10⁷⁷. A match is strong proof the bytes are identical.'},
    {lvl:'honors',q:'You plug the seized USB drive straight into your laptop with no write blocker and run all five steps. Will the drive’s hash at the end match its hash at the start?',choices:['Yes, because you only read the drive','No, because the computer wrote to the drive while it was connected'],correct:1,
     baseline:{mode:'image',blocker:false},changeAction:'runall',changeText:'Running all five steps with no write blocker',at:0.3,reveal:11,
     explain:'The operating system wrote a search index and new “last accessed” times while the drive was connected. Those bytes changed, so the before, image and after hashes disagree. A write blocker would have dropped every one of those writes.'},
    {lvl:'honors',instant:true,q:'A custody log shows matching hashes when the clerk and the courier received a copy, and a different hash when the prosecutor received it. Who had the file when it changed?',choices:['The prosecutor','The courier','The examiner who made the copy'],correct:1,
     explain:'Each hash is recorded when a person receives the copy. The courier received a good copy, and the prosecutor received a changed one, so the change happened in between: while the courier held it.'},
    {lvl:'honors',instant:true,q:'You rename IMG_0314.bmp to evidence.bmp. Does its SHA-256 hash change?',choices:['Yes, any change to the file changes the hash','No, the name is stored by the file system, not in the file’s bytes'],correct:1,
     explain:'SHA-256 reads only the file’s contents. The name, folder and dates live in the file system. That is also why investigators record names and dates separately in the evidence log.'},
    {lvl:'ap',instant:true,q:'SHA-256 makes 256-bit hashes; MD5 makes 128-bit hashes. How many times more possible values does SHA-256 have?',choices:['2 times as many','128 times as many','2¹²⁸ times as many, about 3.4 × 10³⁸'],correct:2,set:{mode:'sandbox'},
     explain:'2²⁵⁶ ÷ 2¹²⁸ = 2¹²⁸ ≈ 3.4 × 10³⁸. Each extra bit doubles the count. MD5 is broken for a different reason, though: researchers can build two files with the same MD5 on purpose.'},
    {lvl:'ap',q:'Keep only the first 8 bits of each hash (256 possible values). About how many files can you hash before two share a value?',choices:['About 20','About 128','Exactly 257'],correct:0,
     baseline:{mode:'collide',bits:8},baselineAction:'clear',change:{},changeAction:'hash50',changeText:'Hashing files one after another',at:0.2,reveal:3.6,
     explain:'The first collision came at file #25. The birthday estimate is √(π/2 · 256) ≈ 20. The pigeonhole principle only promises one by file 257; chance makes it happen far sooner.'},
    {lvl:'ap',instant:true,q:'An investigator has only the SHA-256 hash of a deleted message. Can she work backward to the message?',choices:['Yes, by running SHA-256 in reverse','No: hashing throws information away, and guessing would take about 2²⁵⁵ tries on average','Yes, if she switches to MD5'],correct:1,
     explain:'A hash maps endless inputs onto a fixed number of outputs, so the message cannot be recovered from it. Hashes prove that a file you already have is unchanged; they do not store the file.'}];},
  lab:{bio:'<p><b>Question:</b> Which copy of the evidence was altered?</p><ol><li>In Investigate, pick Copy A and messages.txt, then press Hash this copy. Press Record trial.</li><li>Repeat for every copy and both files (10 trials).</li><li>Fill in the case notebook and press Check my findings.</li></ol><p>Explain why looking at the file was not enough, but the hash was.</p>',
       honors:'<p><b>Question:</b> When was the evidence changed, and how do examiners keep it from changing?</p><ol><li>Find the altered copy, then read its custody log. Name the person who held it when it changed.</li><li>In Image a drive, run all steps with the write blocker on, then off. Record a trial after each.</li><li>Compare “Bytes changed on the drive” and the three hashes.</li></ol><p>Write the procedure an examiner should follow, in order, and explain each step.</p>',
       ap:'<p><b>Question:</b> How strong is the avalanche effect, and how often do collisions happen?</p><ol><li>In Try it yourself, press Change one character in B 20 times. Read the mean on the graph and compare it with 128 ± 8 (a binomial with n = 256, p = ½).</li><li>In Collisions, find the first collision at 6, 8, 10 and 12 bits. Record a trial each time.</li><li>Compare each with √(π/2 · 2ᵇ).</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to argue whether a matching SHA-256 hash is enough to prove two files are identical in court.</p>'},
  terms:[{t:'Hash',d:'A fixed-length fingerprint computed from every byte of a file. Same bytes, same hash.'},{t:'SHA-256',d:'A standard hash function that outputs 256 bits, written as 64 hex characters.'},{t:'Chain of custody',d:'The written record of everyone who held a piece of evidence, when, and why.'},{t:'Forensic copy (image)',d:'An exact, bit-for-bit copy of a drive or file, made so the original is never examined directly.'},
    {lvl:'honors',t:'Write blocker',d:'A device between a drive and a computer that allows reads and blocks every write.'},{lvl:'honors',t:'Avalanche effect',d:'A tiny change in the input changes about half the bits of the hash.'},{lvl:'honors',t:'Hexadecimal',d:'Base 16, digits 0–9 and a–f. One hex digit is 4 bits; two make one byte.'},
    {lvl:'ap',t:'MD5',d:'An older 128-bit hash. Collisions can be made on purpose, so it is broken for security, though old case files still list it.'},{lvl:'ap',t:'Collision',d:'Two different inputs with the same hash. They must exist (pigeonhole principle) but are infeasible to find for SHA-256.'},{lvl:'ap',t:'Pigeonhole principle',d:'With more items than boxes, some box holds two items.'},{lvl:'ap',t:'Birthday bound',d:'Collisions in an n-bit hash are expected after about √(π/2 · 2ⁿ) inputs.'},{lvl:'ap',t:'One-way function',d:'Easy to compute forward and infeasible to reverse.'}],
  about:'<p>Every hash on this page is computed in your browser with real SHA-256 (FIPS 180-4) and MD5 (RFC 1321) code, checked against the published test vectors (SHA-256 of “abc” begins ba7816bf, of the empty string e3b0c442; MD5 of “abc” begins 90015098). Nothing is sent anywhere.</p><p>The case, people, phone model and courier are invented. The photo is a 48 × 32 pixel uncompressed BMP generated on the page; the altered version differs in one color value of one pixel. The drive is a simplified 1,024-byte file system. Real operating systems write to a newly mounted drive in similar ways (mount flags, system folders, search indexes, access times), but the exact bytes here are illustrative, and raw imaging tools read sectors rather than files. Real write blockers are hardware or tightly controlled software, and labs follow written procedures such as hashing at every transfer.</p><p>The collision lab keeps only the first 6 to 12 bits of each SHA-256 hash to make collisions visible. Full SHA-256 has no known collision.</p>',
  initVis(sim){sim.vis.L={};},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);const m=sim.p.mode;
    if(m==='image')drawImage(sim,ctx,k);else if(m==='sandbox')drawSandbox(sim,ctx,k);else if(m==='collide')drawCollide(sim,ctx,k);else drawCase(sim,ctx,k);},
  thumbSetup(sim){sim.st.hashed['0|text']=true;sim.st.hashed[caseOf(sim).alt+'|text']=true;sim.p.copy=caseOf(sim).alt;}
};
HASH.onLevel=syncMode;
BioLab.register(HASH);
})();

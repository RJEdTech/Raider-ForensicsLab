(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,axes,legend,serColor}=BioLab.h;
const MONO='ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';
const W=800,H=560;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const h2=v=>v.toString(16).toUpperCase().padStart(2,'0');
const hexStr=(b,a,n)=>Array.from(b.slice(a,a+n),h2).join(' ');
const asc=v=>v>=0x20&&v<0x7f?String.fromCharCode(v):'.';
const enc=s=>new TextEncoder().encode(s);
const cat=arrs=>{const n=arrs.reduce((a,b)=>a+b.length,0),o=new Uint8Array(n);let p=0;arrs.forEach(a=>{o.set(a,p);p+=a.length;});return o;};
const latin=s=>Uint8Array.from(s,c=>c.charCodeAt(0)&255);

/* ---------- real file formats, built in the page ---------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC_T[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
/* ZIP with "stored" (uncompressed) entries: local headers, central directory, end record. All fields little-endian. */
function makeZip(entries){const parts=[],cent=[];let off=0;const T=0x6000,D=0x5A6E;// 12:00:00, 2025-03-14 in DOS format
  entries.forEach(e=>{const name=enc(e.name),data=typeof e.data==='string'?enc(e.data):e.data,crc=crc32(data);
    const lh=new Uint8Array(30),dv=new DataView(lh.buffer);dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint16(6,0,true);dv.setUint16(8,0,true);dv.setUint16(10,T,true);dv.setUint16(12,D,true);
    dv.setUint32(14,crc,true);dv.setUint32(18,data.length,true);dv.setUint32(22,data.length,true);dv.setUint16(26,name.length,true);dv.setUint16(28,0,true);parts.push(lh,name,data);
    const ch=new Uint8Array(46),cv=new DataView(ch.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(12,T,true);cv.setUint16(14,D,true);
    cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,off,true);cent.push(ch,name);off+=30+name.length+data.length;});
  const cd=cat(cent),eo=new Uint8Array(22),ev=new DataView(eo.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,cd.length,true);ev.setUint32(16,off,true);
  return cat([...parts,cd,eo]);}
function parseZip(b){let e=-1;for(let i=b.length-22;i>=Math.max(0,b.length-4000);i--)if(b[i]===0x50&&b[i+1]===0x4B&&b[i+2]===5&&b[i+3]===6){e=i;break;}
  if(e<0)return null;const dv=new DataView(b.buffer,b.byteOffset,b.byteLength),n=dv.getUint16(e+10,true),cdo=dv.getUint32(e+16,true),out=[];let p=cdo;
  for(let k=0;k<n;k++){if(p+46>b.length||dv.getUint32(p,true)!==0x02014b50)return null;const sz=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),lo=dv.getUint32(p+42,true),name=new TextDecoder().decode(b.slice(p+46,p+46+nl));
    let text='';if(lo+30<=b.length){const lnl=dv.getUint16(lo+26,true),ds=lo+30+lnl;text=new TextDecoder().decode(b.slice(ds,ds+Math.min(sz,160)));}out.push({name,size:sz,text});p+=46+nl;}return out;}
function makePDF(title,line){const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 150] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const stream='BT /F1 16 Tf 20 110 Td ('+title+') Tj 0 -26 Td /F1 11 Tf ('+line+') Tj ET';objs[3]='<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream';
  let s='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const offs=[];objs.forEach((o,i)=>{offs.push(s.length);s+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
  const xr=s.length;s+='xref\n0 6\n0000000000 65535 f \n'+offs.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF\n';return latin(s);}
function makeMP3(title,artist){const frame=(id,t)=>{const d=cat([new Uint8Array([0]),enc(t)]),h=new Uint8Array(10),dv=new DataView(h.buffer);for(let i=0;i<4;i++)h[i]=id.charCodeAt(i);dv.setUint32(4,d.length);return cat([h,d]);};
  const fr=cat([frame('TIT2',title),frame('TPE1',artist),frame('TALB','Practice Mix (fictional)')]),n=fr.length,hd=new Uint8Array([0x49,0x44,0x33,3,0,0,(n>>21)&127,(n>>14)&127,(n>>7)&127,n&127]);
  const audio=new Uint8Array(160);audio.set([0xFF,0xFB,0x90,0x44]);const r=rng(5);for(let i=4;i<160;i++)audio[i]=i<40?0:Math.floor(r()*256);return cat([hd,fr,audio]);}
function parseID3(b){if(!(b[0]===0x49&&b[1]===0x44&&b[2]===0x33))return null;const n=((b[6]&127)<<21)|((b[7]&127)<<14)|((b[8]&127)<<7)|(b[9]&127),out={};let p=10;
  while(p+10<=10+n&&p+10<=b.length){const id=String.fromCharCode(b[p],b[p+1],b[p+2],b[p+3]);if(!/^[A-Z0-9]{4}$/.test(id))break;const sz=(b[p+4]<<24)|(b[p+5]<<16)|(b[p+6]<<8)|b[p+7];out[id]=new TextDecoder().decode(b.slice(p+11,p+10+sz));p+=10+sz;}return out;}
/* GIF89a with uncompressed LZW: a Clear code after every two pixels keeps every code 3 bits wide. */
function makeGIF(w,h,pal,px){const out=[0x47,0x49,0x46,0x38,0x39,0x61,w&255,w>>8,h&255,h>>8,0x81,0,0];pal.forEach(c=>out.push(c[0],c[1],c[2]));out.push(0x2C,0,0,0,0,w&255,w>>8,h&255,h>>8,0,2);
  const codes=[];for(let i=0;i<px.length;i++){if(i%2===0)codes.push(4);codes.push(px[i]);}codes.push(5);
  const bytes=[];let acc=0,nb=0;codes.forEach(c=>{acc|=c<<nb;nb+=3;while(nb>=8){bytes.push(acc&255);acc>>=8;nb-=8;}});if(nb)bytes.push(acc&255);
  for(let i=0;i<bytes.length;i+=255){const ch=bytes.slice(i,i+255);out.push(ch.length,...ch);}out.push(0,0x3B);return new Uint8Array(out);}
function dataURLBytes(u){const b=atob(u.split(',')[1]);return latin(b);}
function drawPic(kind,w,h){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  if(kind==='drone'){g.fillStyle='#1d4f91';g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.18)';for(let x=0;x<w;x+=8){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<h;y+=8){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
    g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(26,14);g.lineTo(70,50);g.moveTo(70,14);g.lineTo(26,50);g.stroke();[[26,14],[70,14],[26,50],[70,50]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,10,0,6.29);g.stroke();});
    g.strokeRect(41,25,14,14);g.fillStyle='#fff';g.font='bold 9px sans-serif';g.fillText('V3',80,60);}
  else if(kind==='park'){const sk=g.createLinearGradient(0,0,0,h);sk.addColorStop(0,'#7fb6e8');sk.addColorStop(0.6,'#cfe6f7');g.fillStyle=sk;g.fillRect(0,0,w,h);g.fillStyle='#4f9a45';g.fillRect(0,42,w,h-42);
    g.fillStyle='#6b4a2b';g.fillRect(20,26,5,18);g.fillStyle='#2f7a35';g.beginPath();g.arc(22,22,12,0,6.29);g.fill();g.fillStyle='#c94b4b';g.fillRect(60,36,22,8);g.fillStyle='#5a3a22';g.fillRect(62,44,2,6);g.fillRect(78,44,2,6);g.fillStyle='#ffd34d';g.beginPath();g.arc(84,10,6,0,6.29);g.fill();}
  else if(kind==='logo'){g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#b5122d';g.beginPath();g.arc(w/2,h/2,w/2-3,0,6.29);g.fill();g.fillStyle='#fff';g.font='bold '+Math.round(w*0.55)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('P',w/2,h/2+2);}
  else{g.fillStyle='#2b2f36';g.fillRect(0,0,w,h);g.strokeStyle='#59d0ff';g.lineWidth=1;g.strokeRect(6,6,w-12,h-12);g.beginPath();g.moveTo(14,40);g.lineTo(82,40);g.moveTo(30,40);g.lineTo(24,28);g.moveTo(66,40);g.lineTo(72,28);g.moveTo(12,26);g.lineTo(36,26);g.moveTo(60,26);g.lineTo(84,26);g.stroke();
    g.strokeRect(38,32,20,10);g.fillStyle='#59d0ff';g.font='8px sans-serif';g.fillText('SIDE VIEW',8,58);}
  return cv;}
const CAT_PAL=[[245,240,230],[60,60,66],[230,140,60],[255,200,210]];
const CAT_PX=(()=>{const m=['................','..1..........1..','..11........11..','..121......121..','..1222222222221..'.slice(0,16),'..122222222221..','.12202222202221.','.12222232222221.','.12222222222221.','..122222222221..','...1222222221...','....11111111....','................','................','................','................'];
  return m.flatMap(r=>[...r.padEnd(16,'.')].slice(0,16).map(c=>c==='.'?0:+c));})();

/* ---------- signatures (magic numbers) ---------- */
const SIGS=[
  {id:'jpg',t:'JPEG image',ext:['jpg','jpeg'],hdr:[0xFF,0xD8,0xFF],trl:[0xFF,0xD9],open:'image'},
  {id:'png',t:'PNG image',ext:['png'],hdr:[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A],trl:[0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82],open:'image'},
  {id:'gif',t:'GIF image',ext:['gif'],hdr:[0x47,0x49,0x46,0x38],trl:[0x00,0x3B],open:'image'},
  {id:'pdf',t:'PDF document',ext:['pdf'],hdr:[0x25,0x50,0x44,0x46],trl:[0x25,0x25,0x45,0x4F,0x46],open:'pdf'},
  {id:'zip',t:'ZIP archive (also DOCX, XLSX, PPTX)',ext:['zip','docx','xlsx','pptx'],hdr:[0x50,0x4B,0x03,0x04],trl:[0x50,0x4B,0x05,0x06],open:'zip'},
  {id:'mp3',t:'MP3 audio with ID3 tag',ext:['mp3'],hdr:[0x49,0x44,0x33],open:'audio'}];
const EXT={txt:'plain text',mp3:'MP3 audio',docx:'Word document (a ZIP package)',pdf:'PDF document',gif:'GIF image',png:'PNG image',jpg:'JPEG image',zip:'ZIP archive'};
const startsWith=(b,s,o)=>{o=o||0;for(let i=0;i<s.length;i++)if(b[o+i]!==s[i])return false;return true;};
const printable=b=>{let n=0;const m=Math.min(b.length,512);for(let i=0;i<m;i++){const v=b[i];if((v>=0x20&&v<0x7f)||v===10||v===13||v===9||v>=0xC2)n++;}return n/m;};
function sniff(b){for(const s of SIGS)if(startsWith(b,s.hdr))return s;if(printable(b)>0.97)return {id:'txt',t:'Plain text (no signature: every byte is a printable character)',ext:['txt','csv'],hdr:[],open:'text'};return {id:'unk',t:'Unknown',ext:[],hdr:[],open:null};}
function scanSigs(b){const hits=[];for(let i=0;i<b.length;i++){SIGS.forEach(s=>{if(startsWith(b,s.hdr,i))hits.push({o:i,s,kind:'start'});if(s.trl&&s.id!=='gif'&&startsWith(b,s.trl,i))hits.push({o:i,s,kind:'end'});});}return hits;}
const extOf=n=>n.split('.').pop().toLowerCase();

/* ---------- the seized folder ---------- */
const ESSAY='The Industrial Revolution changed how people worked. Before factories, most goods were made by hand at home. Steam engines moved production into large mills, and workers began to follow the clock instead of the sun.\n\nDraft 2 - due Friday (fictional class assignment)\n';
const SPECS='part,mass_g,notes\nframe,210,carbon fiber\nmotor,48,x4 brushless\nbattery,180,3S 2200 mAh\ncamera,32,gimbal v3\n';
let FILES=null;
function build(){if(FILES)return FILES;const jpg=(k,q)=>dataURLBytes(drawPic(k,96,64).toDataURL('image/jpeg',q||0.82)),png=(k,w,h)=>dataURLBytes(drawPic(k,w,h).toDataURL('image/png'));
  const docx=makeZip([{name:'[Content_Types].xml',data:'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'},{name:'_rels/.rels',data:'<?xml version="1.0"?><Relationships/>'},{name:'word/document.xml',data:'<w:document><w:body><w:p><w:r><w:t>Robotics club notes (fictional): practice Tuesday at 3:30.</w:t></w:r></w:p></w:body></w:document>'}]);
  const secret=makeZip([{name:'drone_specs.csv',data:SPECS},{name:'README.txt',data:'Pinecrest Robotics (fictional) - internal. Do not share.\n'}]);
  const hidden=makeZip([{name:'plans.txt',data:'v3 drawings copied 03/12. Delete originals after upload.\n'}]);
  const park=jpg('park');
  FILES=[
    {n:'essay_draft.txt',b:enc(ESSAY)},
    {n:'homework.txt',b:jpg('drone',0.85),pic:'drone'},
    {n:'playlist.mp3',b:makeMP3('Study Beats (fictional)','DJ Example (fictional)')},
    {n:'notes.docx',b:docx},
    {n:'schedule.pdf',b:makePDF('Pinecrest Robotics practice schedule','Fictional club. Tue 3:30 build night, Sat 10:00 test flight.')},
    {n:'cat.gif',b:makeGIF(16,16,CAT_PAL,CAT_PX)},
    {n:'song2.mp3',b:secret},
    {n:'logo.png',b:png('logo',40,40)},
    {n:'readme.txt',b:png('cad',96,64)},
    {n:'photo_0412.jpg',b:cat([park,hidden]),appendAt:park.length}];
  FILES.forEach(f=>{f.sig=sniff(f.b);f.ext=extOf(f.n);f.match=f.sig.ext.includes(f.ext);f.truth=f.appendAt?'hidden':f.match?'ok':'wrong';});
  return FILES;}
const truthAt=(f)=>f.truth==='hidden'&&!atLeast('ap')?'ok':f.truth;
const FLAGS={none:'Not decided',ok:'Extension matches',wrong:'Extension is wrong',hidden:'Hidden data inside'};

/* image previews for the info panel */
const b64=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return btoa(s);};
const urlCache={};function imgURL(i,b){if(!urlCache[i])urlCache[i]='data:application/octet-stream;base64,'+b64(b);return urlCache[i];}

/* ---------- image dimensions straight from the header bytes ---------- */
function dims(b,sig){const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(sig.id==='png')return {w:dv.getUint32(16),h:dv.getUint32(20),how:'big-endian, bytes 0x10–0x17'};
  if(sig.id==='gif')return {w:dv.getUint16(6,true),h:dv.getUint16(8,true),how:'little-endian, bytes 0x06–0x09'};
  if(sig.id==='jpg'){for(let i=2;i<b.length-9;i++)if(b[i]===0xFF&&(b[i+1]===0xC0||b[i+1]===0xC2))return {h:dv.getUint16(i+5),w:dv.getUint16(i+7),how:'big-endian, in the SOF marker at 0x'+i.toString(16).toUpperCase()};}
  return null;}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});sim.infoDirty=true;}

/* ---------- state helpers ---------- */
const cur=sim=>build()[Math.round(sim.p.file)];
function bytesNow(sim){if(sim.p.mode==='sandbox')return sim.st.sb;return cur(sim).b;}
function perRow(k){return k>1.3?8:16;}
function viewRows(k,sim){if(sim&&sim.p.mode==='sandbox'){const n=Math.ceil(sim.st.sb.length/perRow(k));return clamp(n,3,k>1.3?6:5);}return k>1.3?7:12;}
function startRow(sim,k){const b=bytesNow(sim),per=perRow(k),n=Math.ceil(b.length/per),vr=viewRows(k,sim),maxS=Math.max(0,n-vr);return Math.round(clamp(sim.p.scroll,0,100)/100*maxS);}
function parseHexInput(s){const t=s.replace(/0x/gi,' ').replace(/[^0-9a-fA-F]/g,' ').trim();if(!t)return new Uint8Array(0);const parts=t.split(/\s+/).flatMap(p=>p.length>2?p.match(/.{1,2}/g):[p]);return Uint8Array.from(parts.map(p=>parseInt(p,16)&255));}

/* ---------- drawing ---------- */
function mono(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+MONO;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
function box(ctx,x,y,w,h,o){o=o||{};rr(ctx,x,y,w,h,o.r||10);ctx.fillStyle=o.fill||PAL['card'];ctx.fill();ctx.strokeStyle=o.stroke||PAL['line'];ctx.lineWidth=o.lw||1;ctx.stroke();}
function fitText(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;if(ctx.measureText(s).width<=maxW)return s;while(s.length>1&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);return s+'…';}
/* the hex viewer: offset | 16 (or 8) bytes in hex | the same bytes as ASCII. Highlighted ranges get a tinted background. */
function drawHex(sim,ctx,k,x,y,w,b,hl){const per=perRow(k),rows=viewRows(k,sim),s=12*k,lh=Math.round(s*1.55),sr=startRow(sim,k);
  ctx.font='400 '+s+'px '+MONO;const cw=ctx.measureText('0').width,hexX=x+5.5*cw,ascX=hexX+(per*3-1+(per>8?1:0))*cw+1.2*cw;
  box(ctx,x-8,y-6,w+16,lh*(rows+1)+14,{});
  mono(ctx,'Offset',x,y+s,{s:s*0.8,w:700,c:PAL['cv-soft']});for(let i=0;i<per;i++)mono(ctx,h2(i),hexX+(i*3+(i>=8?1:0))*cw,y+s,{s:s*0.9,w:700,c:PAL['cv-soft']});mono(ctx,'ASCII',ascX,y+s,{s:s*0.9,w:700,c:PAL['cv-soft']});
  const cursor=atLeast('honors')?sim.p.cursor:-1;
  for(let r=0;r<rows;r++){const row=sr+r,off=row*per;if(off>=b.length)break;const yy=y+lh*(r+1)+s;mono(ctx,off.toString(16).toUpperCase().padStart(4,'0'),x,yy,{s,c:PAL['cv-soft']});
    for(let i=0;i<per&&off+i<b.length;i++){const o=off+i,v=b[o],bx=hexX+(i*3+(i>=8?1:0))*cw,ax=ascX+i*cw,h=hl.find(q=>o>=q.a&&o<q.b);
      if(h){ctx.fillStyle=h.c;ctx.globalAlpha=0.28;ctx.fillRect(bx-cw*0.25,yy-s*0.95,cw*2.5,s*1.3);ctx.fillRect(ax,yy-s*0.95,cw,s*1.3);ctx.globalAlpha=1;}
      if(o===cursor){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.strokeRect(bx-cw*0.3,yy-s*1.0,cw*2.6,s*1.4);ctx.strokeRect(ax-1,yy-s*1.0,cw+2,s*1.4);}
      mono(ctx,h2(v),bx,yy,{s,w:h?700:400});mono(ctx,asc(v),ax,yy,{s,c:v>=0x20&&v<0x7f?PAL['cv-ink']:PAL['cv-soft']});}}
  const n=Math.ceil(b.length/per);if(n>rows){const th=lh*rows,tx=x+w+3.5,ty=y+lh+2;ctx.fillStyle=PAL['card2'];ctx.fillRect(tx,ty,5,th);ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(tx,ty+th*sr/n,5,Math.max(8,th*rows/n));}
  sim.vis.hex={x,y,lh,s,cw,hexX,ascX,per,rows,sr,len:b.length};return lh*(rows+1)+8;}
const ICON={txt:'#6b7280',mp3:'#7c3aed',docx:'#2563eb',pdf:'#c2410c',gif:'#0f766e',png:'#0e7490',jpg:'#b45309',zip:'#4b5563'};
function drawCase(sim,ctx,k){const F=build(),f=cur(sim),st=sim.st,cmp=k>1.3,hon=atLeast('honors'),ap=atLeast('ap'),L=sim.vis.L={};const hl=[];
  if(f.sig.hdr.length)hl.push({a:0,b:f.sig.hdr.length,c:PAL['s2']});
  if(hon&&f.sig.trl){const t=f.appendAt?f.appendAt-2:f.b.length-f.sig.trl.length-(f.sig.id==='pdf'?1:0);if(startsWith(f.b,f.sig.trl,t))hl.push({a:t,b:t+f.sig.trl.length,c:PAL['s3']});}
  if(ap&&st.scanned[Math.round(sim.p.file)]&&f.appendAt)hl.push({a:f.appendAt,b:f.appendAt+4,c:PAL['s5']});
  if(!cmp){// file list
    txt(ctx,'Seized USB, exhibit E-07',20,26,{s:14,w:700});const rh=35;L.list=[8,8,228,44+rh*F.length];
    F.forEach((g,i)=>{const y=40+i*rh,sel=i===Math.round(sim.p.file);box(ctx,12,y,220,rh-5,{fill:sel?PAL['card']:PAL['card2'],stroke:sel?PAL['rj']:PAL['line'],lw:sel?2:1,r:7});
      const e=g.ext;rr(ctx,20,y+5,18,rh-15,3);ctx.fillStyle=ICON[e]||'#555';ctx.fill();txt(ctx,e.slice(0,3).toUpperCase(),29,y+rh/2-1,{s:7,w:800,c:'#fff',a:'center',b:'middle'});
      txt(ctx,fitText(ctx,g.n,112,13,sel?700:400),44,y+19,{s:13,w:sel?700:400});txt(ctx,g.b.length.toLocaleString()+' B',196,y+19,{s:12,c:PAL['cv-soft'],a:'right'});
      const fl=st.flags[i]||'none';if(fl!=='none'){const mk=fl==='ok'?'✓':fl==='wrong'?'!':'◆';let col=fl==='ok'?PAL['s3']:fl==='wrong'?PAL['s4']:PAL['s5'];
        if(st.checked){const right=fl===truthAt(g);col=right?PAL['s3']:PAL['s1'];}txt(ctx,mk,222,y+19,{s:15,w:800,c:col,a:'right'});}
      else if(st.checked)txt(ctx,'?',222,y+19,{s:14,w:800,c:PAL['s1'],a:'right'});});
    const ny=40+rh*F.length+18,nf=Object.values(st.flags).filter(v=>v&&v!=='none').length;
    txt(ctx,'Flagged '+nf+' of '+F.length+' files',22,ny,{s:13,w:700});
    if(st.checked){const sc=F.filter((g,i)=>(st.flags[i]||'none')===truthAt(g)).length;txt(ctx,'Correct: '+sc+' of '+F.length,22,ny+20,{s:13,w:700,c:sc===F.length?PAL['s3']:PAL['s1']});}
    else txt(ctx,'✓ matches   ! wrong'+(ap?'   ◆ hidden':''),22,ny+20,{s:12,c:PAL['cv-soft']});}
  // hex viewer
  const hx=cmp?24:248,hw=cmp?752:532;let y=cmp?12:14;
  if(cmp){txt(ctx,f.n,24,y+16*k,{s:15*k,w:700});txt(ctx,f.b.length.toLocaleString()+' bytes',776,y+16*k,{s:12*k,c:PAL['cv-soft'],a:'right'});y+=30*k;}
  const hh=drawHex(sim,ctx,k,hx,y,hw,f.b,hl);L.hex=[hx-12,y-10,hw+24,hh+8];y+=hh+14;
  // signature check
  const lh=19*k,pw=hw+16;box(ctx,hx-8,y,pw,H-12-y,{fill:PAL['card2']});let ty=y+20*k;L.check=[hx-12,y-4,pw+8,H-8-y];
  txt(ctx,'Extension: .'+f.ext+' → should be '+(EXT[f.ext]||'unknown'),hx+4,ty,{s:13*k,w:700});ty+=lh;
  const first=hexStr(f.b,0,cmp?6:8);txt(ctx,'First bytes:',hx+4,ty,{s:13*k,w:700});ctx.font='700 '+13*k+'px '+FONT;const fw=ctx.measureText('First bytes: ').width;mono(ctx,first,hx+4+fw,ty,{s:13*k,w:700,c:PAL['s2']});
  ty+=lh;const fl=st.flags[Math.round(sim.p.file)]||'none';
  if(st.checked){const right=fl===truthAt(f);txt(ctx,'Signature says: '+f.sig.t.split(' (')[0]+(f.appendAt&&ap?', with a ZIP appended':''),hx+4,ty,{s:13*k,c:PAL['cv-ink']});ty+=lh;
    pill(ctx,(right?'✓ ':'✗ ')+'You said: '+FLAGS[fl],hx+4+fitW(ctx,'✓ You said: '+FLAGS[fl],13*k)/2,ty+2,right?PAL['s3']:PAL['s1'],PAL['cv-bg'],13*k);ty+=lh+4;}
  else{txt(ctx,'Your call: '+FLAGS[fl],hx+4,ty,{s:13*k,c:fl==='none'?PAL['cv-soft']:PAL['cv-ink'],w:fl==='none'?400:700});ty+=lh;}
  if(hon){const c=clamp(Math.round(sim.p.cursor),0,f.b.length-1),v=f.b[c];
    txt(ctx,'Byte at 0x'+c.toString(16).toUpperCase().padStart(4,'0')+': '+h2(v)+' = '+v+' = '+v.toString(2).padStart(8,'0')+' → “'+(v>=0x20&&v<0x7f?String.fromCharCode(v):'not printable')+'”',hx+4,ty,{s:12.5*k,c:PAL['cv-soft']});ty+=lh;
    if(ap&&c+1<f.b.length&&!cmp){const be=(f.b[c]<<8)|f.b[c+1],le=(f.b[c+1]<<8)|f.b[c];txt(ctx,'2 bytes from here: big-endian 0x'+h2(f.b[c])+h2(f.b[c+1])+' = '+be+', little-endian 0x'+h2(f.b[c+1])+h2(f.b[c])+' = '+le,hx+4,ty,{s:12.5,c:PAL['cv-soft']});ty+=lh;}}
  if(ap&&st.scanned[Math.round(sim.p.file)]&&!cmp){const hits=scanSigs(f.b).slice(0,4);txt(ctx,'Signature scan: '+hits.map(q=>'0x'+q.o.toString(16).toUpperCase()+' '+q.s.id.toUpperCase()+' '+q.kind).join(', '),hx+4,ty,{s:12.5,c:PAL['s5'],w:700});}
  // signature reference (desktop)
  if(!cmp){const ry=40+35*10+62;txt(ctx,'Signature list',22,ry-6,{s:12,w:700,c:PAL['cv-soft']});L.sigs=[8,ry-22,240,H-ry+18];
    [['JPEG','FF D8 FF'],['PNG','89 50 4E 47'],['GIF','47 49 46 38'],['PDF','25 50 44 46'],['ZIP','50 4B 03 04'],['MP3 (ID3)','49 44 33']].forEach((r,i)=>{const yy=ry+12+i*15;if(yy>H-4)return;txt(ctx,r[0],22,yy,{s:12,w:700});mono(ctx,r[1],104,yy,{s:12,c:PAL['s2']});});}}
function fitW(ctx,s,size){ctx.font='700 '+size+'px '+FONT;return ctx.measureText(s).width+size*1.1;}
function drawSandbox(sim,ctx,k){const st=sim.st,b=st.sb,cmp=k>1.3,L=sim.vis.L={};const sg=sniff(b);let y=12;
  txt(ctx,'Your bytes: '+b.length+' byte'+(b.length===1?'':'s'),24,y+16*k,{s:15*k,w:700});y+=30*k;
  const hl=sg.hdr.length?[{a:0,b:sg.hdr.length,c:PAL['s2']}]:[];const hh=drawHex(sim,ctx,k,24,y,752,b,hl);L.hex=[12,y-10,776,hh+8];y+=hh+16;
  // what the signature says
  const ph=Math.round(cmp?56*k:92);box(ctx,16,y,768,ph,{fill:PAL['card2']});let ty=y+22*k;const lh=19*k;L.id=[12,y-4,776,ph+8];
  if(!b.length)txt(ctx,'Type some text or hex bytes in the panel below the stage.',30,ty,{s:13*k,c:PAL['cv-soft']});
  else{txt(ctx,'First bytes say: '+sg.t.split(' (')[0],30,ty,{s:14*k,w:700,c:sg.id==='unk'?PAL['cv-soft']:PAL['s2']});ty+=lh;
    txt(ctx,sg.hdr.length?'Matched signature: '+hexStr(Uint8Array.from(sg.hdr),0,8):sg.id==='txt'?'No signature. Text files are just characters.':'No known signature at the start.',30,ty,{s:13*k,c:PAL['cv-soft']});ty+=lh;
    if(!cmp){let hi=0;for(const v of b)if(v>=0x80)hi++;let l=hi?hi+(hi===1?' byte is':' bytes are')+' 0x80 or higher, outside ASCII. UTF-8 uses 2 to 4 bytes for letters like é or 漢.':'Every byte is below 0x80, so this is plain ASCII.';
      if(atLeast('honors')&&b.length>=4){const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);l='First 4 bytes as one number: big-endian '+dv.getUint32(0).toLocaleString()+', little-endian '+dv.getUint32(0,true).toLocaleString()+'.';}
      txt(ctx,l,30,ty,{s:12.5,c:PAL['cv-soft']});}}
  y+=ph+14;
  // byte by byte: the same value four ways
  const n=Math.min(b.length,cmp?4:8),cw=cmp?184:92,m=Math.min(k,1.5);
  if(!n)return;txt(ctx,'Byte by byte: hex, decimal, binary, character',24,y+12*k,{s:13*k,w:700,c:PAL['cv-soft']});y+=22*k;
  const ch=Math.min(cmp?150:220,H-12-y),gx=(W-n*cw-(n-1)*6)/2,sc=ch/(cmp?150:112);
  for(let i=0;i<n;i++){const v=b[i],x=gx+i*(cw+6);box(ctx,x,y,cw,ch,{fill:i<sg.hdr.length?PAL['card']:PAL['card2'],stroke:i<sg.hdr.length?PAL['s2']:PAL['line'],r:8});
    const yy=f=>y+ch*f;mono(ctx,h2(v),x+cw/2,yy(0.27),{s:Math.min(30,22*m*Math.min(sc,1.3)),w:700,a:'center'});txt(ctx,'= '+v,x+cw/2,yy(0.47),{s:13*k,a:'center',c:PAL['cv-soft']});
    mono(ctx,v.toString(2).padStart(8,'0'),x+cw/2,yy(0.66),{s:12*k,a:'center',c:PAL['cv-soft']});
    txt(ctx,v>=0x20&&v<0x7f?'“'+String.fromCharCode(v)+'”':v>=0x80?'not ASCII':'control',x+cw/2,yy(0.88),{s:12*k,w:700,a:'center'});}
  L.bytes=[gx-6,y-26*k,n*(cw+6)+6,ch+32*k];}

/* ---------- info panel previews: “open as…” ---------- */
function openAs(f,i,how){const b=f.b;
  if(how==='text'){let s='';const n=Math.min(b.length,220);for(let j=0;j<n;j++){const v=b[j];s+=v===10?'\n':(v>=0x20&&v<0x7f)?String.fromCharCode(v):(v>=0xA0?String.fromCharCode(v):'·');}
    const pr=printable(b);return '<pre style="margin:4px 0;font:12px/1.35 ui-monospace,Consolas,monospace;white-space:pre-wrap;word-break:break-all;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 8px;max-height:9em;overflow:auto">'+esc(s)+(b.length>n?'…':'')+'</pre>'+(pr<0.9?'<p>Mostly unreadable symbols: these bytes are not text.</p>':'<p>Readable text.</p>');}
  if(how==='image')return '<img alt="'+esc(f.n)+' opened as an image" src="'+imgURL(i,b)+'" style="width:192px;max-width:100%;image-rendering:pixelated;border:1px solid var(--line);border-radius:6px;background:#fff" onerror="this.replaceWith(Object.assign(document.createElement(\'p\'),{textContent:\'The image viewer cannot decode these bytes: not an image.\'}))">'+(()=>{const d=dims(b,f.sig);return d?'<p>'+d.w+' × '+d.h+' pixels (read from the header, '+d.how+').</p>':'';})();
  if(how==='zip'){const off=f.appendAt&&atLeast('ap')?f.appendAt:0,z=parseZip(off?b.slice(off):b);if(!z)return '<p>Not a ZIP archive: there is no end-of-archive record (50 4B 05 06).</p>';
    return '<p>'+(off?'Carved from offset 0x'+off.toString(16).toUpperCase()+'. ':'')+'ZIP archive with '+z.length+' file'+(z.length>1?'s':'')+':</p><ul style="margin:4px 0;padding-left:20px">'+z.map(e=>'<li><code>'+esc(e.name)+'</code> ('+e.size+' bytes)'+(e.text&&!/^\s*</.test(e.text)?': <i>'+esc(e.text.split('\n').filter(Boolean).slice(0,3).join(' · '))+'</i>':'')+'</li>').join('')+'</ul>';}
  if(how==='pdf'){if(!startsWith(b,[0x25,0x50,0x44,0x46]))return '<p>Not a PDF: a PDF must start with %PDF (25 50 44 46).</p>';const s=new TextDecoder('latin1').decode(b),m=[...s.matchAll(/\(([^)]*)\)\s*Tj/g)].map(x=>x[1]);return '<p>PDF, 1 page. Text on the page:</p><ul style="margin:4px 0;padding-left:20px">'+m.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>';}
  if(how==='audio'){const t=parseID3(b);if(!t)return '<p>Not an MP3 with an ID3 tag: the file does not start with “ID3” (49 44 33).</p>';return '<p>MP3 audio. ID3 tag says: title <b>'+esc(t.TIT2||'?')+'</b>, artist '+esc(t.TPE1||'?')+', album '+esc(t.TALB||'?')+'.</p>';}
  return '';}

/* ---------- the definition ---------- */
const SIM={
  id:'filesig',hash:'filesig',apUnit:18,order:2,tab:'File signatures and hex',kind:'Virtual lab',
  card:'Read the raw bytes of seized files in a hex viewer and catch the ones a suspect renamed to hide them.',
  title:'File signatures and hex',
  lede:{bio:'A file’s name can lie. Its first few bytes, the file signature, usually cannot. Open each seized file in the hex viewer and flag the ones whose extension does not match.',
        honors:'Read hex and ASCII side by side, inspect single bytes, and see why a .docx starts with the same bytes as a .zip.',
        ap:'Check trailers as well as headers, read multi-byte numbers in both byte orders, and scan a photo for a second signature hidden after its end.'},
  scale:{bio:'Ten files from one seized USB drive, 180 to 3,500 bytes each. One row of the hex viewer is 16 bytes.',ap:'Every byte is 8 bits: two hex digits, 00 to FF (0 to 255). Offsets count bytes from the start of the file, in hex.'},
  aspect:W/H,timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'case',lvl:'bio',options:[{v:'case',l:'Investigate'},{v:'sandbox',l:'Try it yourself'}],onChange:syncMode},
    {id:'file',label:'File',type:'select',def:1,lvl:'bio',modes:['case'],options:['essay_draft.txt','homework.txt','playlist.mp3','notes.docx','schedule.pdf','cat.gif','song2.mp3','logo.png','readme.txt','photo_0412.jpg'].map((n,i)=>({v:i,l:n})),
      onChange(sim){const i=Math.round(sim.p.file);BioLab.setValues(sim,{flag:sim.st.flags[i]||'none',scroll:0,cursor:0});}},
    {id:'flag',label:'Your call for this file',type:'seg',def:'none',lvl:'bio',modes:['case'],noTrial:false,options:[{v:'none',l:'Not decided'},{v:'ok',l:'Extension matches'},{v:'wrong',l:'Extension is wrong'},{v:'hidden',l:'Hidden data inside',lvl:'ap'}],
      onChange(sim){if(sim.p.mode!=='case')return;const i=Math.round(sim.p.file);if((sim.st.flags[i]||'none')!==sim.p.flag){sim.st.flags[i]=sim.p.flag;sim.st.checked=false;}}},
    {id:'scroll',label:'Scroll the hex view',type:'range',min:0,max:100,step:1,def:0,unit:' %',lvl:'bio',noTrial:true,help:'0 % is the start of the file, 100 % the end.'},
    {id:'cursor',label:'Inspect the byte at offset',type:'range',min:0,max:63,step:1,def:0,lvl:'honors',noTrial:true,help:'Or click a byte in the hex viewer.',onChange(sim){sim.p.cursor=Math.round(sim.p.cursor);if(sim.p.cursor<64&&sim.p.scroll!==0)BioLab.setValues(sim,{scroll:0});}},
    {id:'src',label:'Show the bytes of',type:'seg',def:'text',lvl:'bio',modes:['sandbox'],options:[{v:'text',l:'My text'},{v:'hex',l:'My hex bytes'}],onChange(sim){updSandbox(sim);}}
  ],
  actions:[
    {id:'check',label:'Check my flags',lvl:'bio',primary:true,modes:['case'],run(sim){sim.st.checked=true;}},
    {id:'start',label:'Go to start of file',lvl:'bio',modes:['case','sandbox'],run(sim){BioLab.setValues(sim,{scroll:0});}},
    {id:'end',label:'Go to end of file',lvl:'bio',modes:['case','sandbox'],run(sim){BioLab.setValues(sim,{scroll:100});}},
    {id:'scan',label:'Scan the file for signatures',lvl:'ap',modes:['case'],run(sim){sim.st.scanned[Math.round(sim.p.file)]=true;const f=cur(sim);if(f.appendAt){const per=16,n=Math.ceil(f.b.length/per),maxS=Math.max(0,n-12);BioLab.setValues(sim,{scroll:Math.round(clamp((Math.floor(f.appendAt/per)-5)/maxS,0,1)*100)});}}},
    {id:'clearflags',label:'Clear my flags',lvl:'bio',modes:['case'],run(sim){sim.st.flags={};sim.st.checked=false;BioLab.setValues(sim,{flag:'none'});}},
    {id:'ptext',label:'Load: text with é',lvl:'bio',modes:['sandbox'],run(sim){sim.st.txt='Café receipt #12';BioLab.setValues(sim,{src:'text'});}},
    {id:'pjpg',label:'Load: start of a JPEG',lvl:'bio',modes:['sandbox'],run(sim){sim.st.hex='FF D8 FF E0 00 10 4A 46 49 46 00 01';BioLab.setValues(sim,{src:'hex'});}},
    {id:'ppng',label:'Load: start of a PNG',lvl:'bio',modes:['sandbox'],run(sim){sim.st.hex='89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52 00 00 00 60 00 00 00 40';BioLab.setValues(sim,{src:'hex'});}}
  ],
  init(sim){const st={flags:{},checked:false,scanned:{},txt:'Meet at 9:30',hex:'25 50 44 46 2D 31 2E 34',sb:null,open:{}};st.sb=enc(st.txt);return st;},
  step(){},
  metrics:[
    {id:'flagged',label:'Files flagged',unit:'of 10',lvl:'bio',min:0,max:10,d:0,modes:['case'],get:s=>Object.values(s.st.flags).filter(v=>v&&v!=='none').length},
    {id:'score',label:'Correct flags',lvl:'bio',text:true,modes:['case'],get:s=>{if(!s.st.checked)return 'Press Check my flags';const F=build();return F.filter((g,i)=>(s.st.flags[i]||'none')===truthAt(g)).length+' of 10';}},
    {id:'size',label:'File size',unit:'bytes',lvl:'bio',min:0,max:null,d:0,modes:['case'],get:s=>cur(s).b.length},
    {id:'first',label:'First 4 bytes',lvl:'bio',text:true,modes:['case'],get:s=>hexStr(cur(s).b,0,4)},
    {id:'cbyte',label:'Byte at the cursor',lvl:'honors',text:true,modes:['case'],get:s=>{const b=cur(s).b,c=clamp(Math.round(s.p.cursor),0,b.length-1);return '0x'+h2(b[c])+' = '+b[c];}},
    {id:'entropy',label:'Entropy',unit:'bits per byte',lvl:'ap',min:0,max:8,d:2,modes:['case','sandbox'],get:s=>entropy(bytesNow(s))},
    {id:'sbn',label:'Your bytes',unit:'bytes',lvl:'bio',min:0,max:null,d:0,modes:['sandbox'],get:s=>s.st.sb.length},
    {id:'sbid',label:'Signature check',lvl:'bio',text:true,modes:['sandbox'],get:s=>s.st.sb.length?sniff(s.st.sb).t.split(' (')[0]:'No bytes yet'}
  ],
  graphs:[{id:'hist',label:'Byte values in this file',lvl:'bio',custom:true}],defaultGraph:'hist',
  plot(sim,ctx,box,id){const b=bytesNow(sim);if(!b.length){txt(ctx,'No bytes yet.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const bins=new Array(32).fill(0);b.forEach(v=>bins[v>>3]++);const ymax=Math.max(...bins)*1.5,ax=axes(ctx,box,{xmin:0,xmax:256,ymin:0,ymax,xl:'Byte value (0–255), in bins of 8',yl:'Count'});
    bins.forEach((c,i)=>{if(!c)return;const x0=ax.X(i*8),x1=ax.X(i*8+8);ctx.fillStyle=i>=4&&i<16?serColor(1):serColor(3);ctx.fillRect(x0+1,ax.Y(c),x1-x0-2,ax.Y(0)-ax.Y(c));});
    legend(ctx,box.L+10,box.T+10,[{label:'printable ASCII (32–127)',color:serColor(1)}]);legend(ctx,box.L+10,box.T+28,[{label:'other bytes',color:serColor(3)}]);
    if(atLeast('ap'))txt(ctx,'Entropy '+entropy(b).toFixed(2)+' bits/byte',box.L+10,box.T+50,{s:13,w:700,c:PAL['fg']});},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='sandbox')return '<h3>Try it yourself</h3><p>Type text and see the bytes a computer stores, or type hex bytes and see what they spell and whether they match a signature. Nothing leaves this page.</p>'+
      '<label for="filesig-txt" style="font-weight:700">My text</label><input id="filesig-txt" type="text" autocomplete="off" spellcheck="false" value="'+esc(st.txt)+'" style="width:100%;box-sizing:border-box;font:16px ui-monospace,Consolas,monospace;padding:7px 9px;margin:4px 0 10px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)">'+
      '<label for="filesig-hex" style="font-weight:700">My hex bytes</label><input id="filesig-hex" type="text" autocomplete="off" spellcheck="false" value="'+esc(st.hex)+'" style="width:100%;box-sizing:border-box;font:16px ui-monospace,Consolas,monospace;padding:7px 9px;margin:4px 0 10px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)">'+
      '<p>Try: type <code>GIF89a</code> as text, or <code>50 4B 03 04</code> as hex. '+(hon?'Type an accented letter like é and count its bytes (UTF-8 uses two).':'')+'</p>'+sigTable(hon);
    const F=build(),i=Math.round(p.file),f=F[i],how=st.open[i]||'text';
    let h='<h3>'+esc(f.n)+' <small style="font-weight:400;color:var(--muted)">'+f.b.length.toLocaleString()+' bytes</small></h3><p>The case (fictional): Pinecrest Robotics’ drone design leaked. Student M. Pike says this USB holds “only homework and music.” Check every file.</p>';
    h+='<p><b>Open this file as…</b></p><div class="row" role="group" aria-label="Open as">'+[['text','Text'],['image','Image'],['zip','ZIP archive'],['pdf','PDF'],['audio','MP3 audio']].map(o=>'<button type="button" class="btn" data-open="'+o[0]+'" aria-pressed="'+(how===o[0])+'"'+(how===o[0]?' style="border-color:var(--rj)"':'')+'>'+o[1]+'</button>').join('')+'</div>';
    h+='<div style="margin-top:8px">'+openAs(f,i,how)+'</div>';
    if(st.checked)h+='<p><b>Signature:</b> '+f.sig.t+'. '+(truthAt(f)==='ok'?'The extension .'+f.ext+' fits.':truthAt(f)==='wrong'?'The extension .'+f.ext+' does not fit: this file was renamed.':'The JPEG ends with FF D9 at 0x'+(f.appendAt-2).toString(16).toUpperCase()+', but a ZIP (50 4B 03 04) starts right after it. Open it as a ZIP archive to carve it out.')+'</p>';
    return h+sigTable(hon);},
  bindInfo(sim,el){const st=sim.st;el.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{st.open[Math.round(sim.p.file)]=b.dataset.open;sim.infoDirty=true;BioLab.refresh(sim);}));
    const t=el.querySelector('#filesig-txt'),x=el.querySelector('#filesig-hex');
    if(t)t.addEventListener('input',()=>{st.txt=t.value;if(sim.p.src!=='text')BioLab.setValues(sim,{src:'text'});updSandbox(sim);});
    if(x)x.addEventListener('input',()=>{st.hex=x.value;if(sim.p.src!=='hex')BioLab.setValues(sim,{src:'hex'});updSandbox(sim);});},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='sandbox'){const b=st.sb,s=sniff(b);if(!b.length)return 'Type something in the panel below to see its bytes.';
      if(s.hdr.length)return 'Your bytes start with <b>'+hexStr(Uint8Array.from(s.hdr),0,8)+'</b>, the signature of a <b>'+s.t.split(' (')[0]+'</b>. A program reading these first bytes would treat this as that kind of file, whatever its name.';
      return 'Each character you type becomes one or more bytes. <b>“'+esc(String.fromCharCode(b[0]))+'” is stored as 0x'+h2(b[0])+'</b> ('+b[0]+'). '+(s.id==='txt'?'Text has no signature, so only the name says it is text.':'These bytes match no known signature.');}
    const f=cur(sim),fl=st.flags[Math.round(p.file)]||'none';
    if(st.checked){const F=build(),sc=F.filter((g,i)=>(st.flags[i]||'none')===truthAt(g)).length;return sc===F.length?'<b>All ten files flagged correctly.</b> '+(ap?'You caught the renamed files and the ZIP hidden after the end of photo_0412.jpg.':'Three files had the wrong extension. Open each one by its real type to see what Pike was hiding.'):'<b>'+sc+' of 10 flags are right.</b> Files marked ✗ or ? need another look: compare the first bytes with the signature list.';}
    if(f.sig.id==='txt')return '<b>'+esc(f.n)+'</b> has no signature: its bytes are all printable characters, so the ASCII column reads as words. That fits a .txt file.';
    const head='<b>'+esc(f.n)+'</b> begins with <b>'+hexStr(f.b,0,f.sig.hdr.length)+'</b>'+(hon&&Array.from(f.b.slice(0,f.sig.hdr.length)).filter(v=>v>=0x20&&v<0x7f).length>=3?' (ASCII “'+Array.from(f.b.slice(0,f.sig.hdr.length),asc).join('')+'”)':'')+'.';
    if(fl==='none')return head+' Find those bytes in the signature list, then decide whether the extension .'+f.ext+' tells the truth.';
    return head+' You marked it “'+FLAGS[fl].toLowerCase()+'”. '+(ap&&f.appendAt?'Scan the whole file: some files hide a second signature after the end.':'Press Check my flags when every file has a call.');},
  tour:[
    {title:'The seized folder',text:'Police seized a USB drive. Its owner says it holds only homework and music. File names and extensions are easy to change, so investigators never trust them.',focus:s=>s.vis.L&&(s.vis.L.list||s.vis.L.hex),speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',file:0});}},
    {title:'Reading raw bytes',text:{bio:'A hex viewer shows every byte. Left: the offset (position). Middle: each byte as two hex digits. Right: the same byte as a character, or a dot if it is not printable.',honors:'Each byte is 8 bits, written as two hex digits from 00 to FF. The offset column counts bytes from the start in hex, so row 0010 starts at byte 16.'},focus:s=>s.vis.L&&s.vis.L.hex,speed:1,pause:true},
    {title:'The signature',text:'Most file types start with a fixed pattern of bytes called a <b>file signature</b> or magic number. A JPEG starts FF D8 FF. A PDF starts with the characters %PDF.',focus:s=>s.vis.L&&[s.vis.L.hex,s.vis.L.check],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{file:4});}},
    {title:'homework.txt is not homework',text:'This file claims to be text, but it starts FF D8 FF E0: a JPEG. Open it as an image in the panel below the stage and you will see what it really holds.',focus:s=>s.vis.L&&[s.vis.L.hex,s.vis.L.check],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{file:1});sim.st.open[1]='image';}},
    {title:'Flag and check',text:'For each file, set Your call. When every file has one, press Check my flags. Matches get ✓, mistakes get ✗.',focus:s=>s.vis.L&&(s.vis.L.list||s.vis.L.check),speed:1,pause:true},
    {lvl:'honors',title:'One byte, three ways',text:'The cursor byte shows hex, decimal and binary. 0x89 = 137 is not a printable ASCII character, which is why a PNG’s first byte shows as a dot.',focus:s=>s.vis.L&&[s.vis.L.hex,s.vis.L.check],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{file:7,cursor:0});}},
    {lvl:'ap',title:'Something after the end',text:'A JPEG ends with FF D9. In photo_0412.jpg, a ZIP signature (50 4B 03 04) appears right after it. Image viewers stop at FF D9, so the hidden archive never shows.',focus:s=>s.vis.L&&[s.vis.L.hex,s.vis.L.check],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{file:9});sim.st.scanned[9]=true;const f=build()[9],n=Math.ceil(f.b.length/16),maxS=Math.max(0,n-12);BioLab.setValues(sim,{scroll:Math.round(clamp((Math.floor(f.appendAt/16)-5)/maxS,0,1)*100)});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case',scroll:0});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.after)ch.after(sim);}},
  challenges:[
    {lvl:'bio',instant:true,q:'homework.txt ends in .txt, but its first bytes are FF D8 FF E0. What is it really?',choices:['A text file with some odd characters','A JPEG image','A damaged file that cannot be opened'],correct:1,set:{mode:'case',file:1},after(sim){sim.st.open[1]='image';sim.infoDirty=true;},
     explain:'FF D8 FF is the JPEG signature. The stage now shows homework.txt, and the panel opens it as an image: it is a drawing of the drone design. Renaming a file does not change its bytes.'},
    {lvl:'bio',instant:true,q:'You rename cat.gif to cat.txt. What happens to its first bytes?',choices:['They become the text-file signature','They stay 47 49 46 38 (“GIF8”), because the name is not stored in the file’s bytes','They are erased'],correct:1,set:{mode:'case',file:5},
     explain:'The name lives in the file system, not inside the file. The first bytes still spell GIF8, so a forensic tool still sees a GIF.'},
    {lvl:'bio',instant:true,q:'Which of these files is NOT what its extension claims?',choices:['essay_draft.txt','song2.mp3','cat.gif','schedule.pdf'],correct:1,set:{mode:'case',file:6},
     explain:'song2.mp3 starts 50 4B 03 04 (“PK”), the ZIP signature, not ID3 or an MP3 frame. Open it as a ZIP archive: it holds drone_specs.csv.'},
    {lvl:'honors',instant:true,q:'notes.docx starts with 50 4B 03 04, the ZIP signature. Should you flag it as renamed?',choices:['Yes, a Word file should not start with a ZIP signature','No, a .docx file is a ZIP package of XML files, so PK is correct'],correct:1,set:{mode:'case',file:3},after(sim){sim.st.open[3]='zip';sim.infoDirty=true;},
     explain:'DOCX, XLSX and PPTX files are ZIP archives. Opened as a ZIP, notes.docx lists [Content_Types].xml and word/document.xml. Knowing which formats share a signature prevents false flags.'},
    {lvl:'honors',instant:true,q:'logo.png starts with the byte 89, but the ASCII column shows a dot there. Why?',choices:['The byte is damaged','0x89 = 137 is above 127, outside printable ASCII, so the viewer shows a dot','Hex viewers skip the first byte'],correct:1,set:{mode:'case',file:7,cursor:0},
     explain:'ASCII covers 0 to 127, and only 32 to 126 are printable. PNG’s designers chose 0x89 on purpose so text tools would not mistake a PNG for text. The next three bytes, 50 4E 47, spell “PNG”.'},
    {lvl:'ap',instant:true,q:'In notes.docx, the 2 bytes at offset 0x1A give the length of the first file name. They are 13 00. ZIP stores numbers little-endian. What is the length?',choices:['0x1300 = 4,864 characters','0x0013 = 19 characters','13 characters'],correct:1,set:{mode:'case',file:3,cursor:26},
     explain:'Little-endian puts the least significant byte first, so 13 00 means 0x0013 = 19, the length of “[Content_Types].xml”. Read the cursor line: big-endian would give 4,864. PNG stores its width big-endian; GIF stores its width little-endian.'},
    {lvl:'ap',instant:true,q:'photo_0412.jpg starts FF D8 FF and contains FF D9 well before its last byte. What does that tell you?',choices:['Nothing: JPEGs often have extra bytes','Data was appended after the end of the JPEG; scan for another signature','The photo is corrupted and cannot be viewed'],correct:1,set:{mode:'case',file:9},after(sim){sim.def.actions.find(a=>a.id==='scan').run(sim);sim.st.open[9]='zip';sim.infoDirty=true;},
     explain:'FF D9 marks the end of a JPEG, and viewers stop there, so the photo looks normal. The scan finds 50 4B 03 04 right after it: a ZIP holding plans.txt, now carved out in the panel.'},
    {lvl:'ap',instant:true,q:'A recovered file starts 25 50 44 46 (%PDF) but does not end with %%EOF. What is the most likely explanation?',choices:['It is a different file type','The file is incomplete: it was cut short or partly overwritten','PDFs do not need an ending'],correct:1,set:{mode:'case',file:4},
     explain:'The header says PDF and the trailer is missing, so the end of the file is gone. That happens when deleted files are partly overwritten or carved with the wrong length. Checking both ends tells you whether you have the whole file.'}
  ],
  lab:{bio:'<p><b>Question:</b> Which files on the seized USB were renamed to hide what they are?</p><ol><li>Select each file. Compare its first bytes with the signature list.</li><li>Set Your call, then press Record trial.</li><li>When all 10 have a call, press Check my flags. Open each renamed file as its real type.</li></ol><p>Write one sentence for each renamed file: what the extension claimed, what the bytes showed, and what was inside.</p>',
       honors:'<p><b>Question:</b> How do hex, decimal, binary and ASCII describe the same byte?</p><ol><li>Pick logo.png. Inspect offsets 0 to 7 and record each byte in hex, decimal and binary.</li><li>Explain why byte 0 shows as a dot but bytes 1 to 3 spell PNG.</li><li>Open notes.docx as a ZIP and explain why its signature is not a mismatch.</li></ol><p>Make a rule an investigator could use to decide when a signature mismatch matters.</p>',
       ap:'<p><b>Question:</b> What can headers, trailers and byte order reveal?</p><ol><li>Read the width of logo.png (big-endian, offset 0x10) and cat.gif (little-endian, offset 0x06). Show your arithmetic.</li><li>Scan photo_0412.jpg for signatures and record each offset. Carve the hidden ZIP.</li><li>Compare the entropy of essay_draft.txt, logo.png and homework.txt.</li></ol><p><b>Claim–evidence–reasoning:</b> Did Pike hide files on purpose? Support your claim with byte-level evidence.</p>'},
  terms:[{t:'File signature (magic number)',d:'A fixed pattern of bytes at the start of a file that identifies its type.'},{t:'Extension',d:'The letters after the dot in a file name. It is part of the name and can be changed freely.'},{t:'Hex viewer',d:'A tool that shows a file’s raw bytes as hexadecimal, with their offsets and ASCII characters.'},{t:'Byte',d:'8 bits; one value from 0 to 255, written in hex as 00 to FF.'},
    {lvl:'honors',t:'Hexadecimal',d:'Base 16. Digits 0–9 then A–F. Two hex digits make one byte.'},{lvl:'honors',t:'ASCII',d:'A code that gives the characters values 0–127. Printable characters are 32 to 126.'},{lvl:'honors',t:'Offset',d:'A byte’s position counted from the start of the file, usually written in hex.'},{lvl:'honors',t:'Container format',d:'A file that packages other files. DOCX, XLSX and PPTX are ZIP containers.'},
    {lvl:'ap',t:'Trailer (footer)',d:'Bytes that mark the end of a file, like FF D9 for JPEG or %%EOF for PDF.'},{lvl:'ap',t:'Endianness',d:'The byte order of multi-byte numbers. Big-endian puts the most significant byte first; little-endian puts it last.'},{lvl:'ap',t:'File carving',d:'Recovering files from raw bytes by searching for signatures, without using the file system.'},{lvl:'ap',t:'Entropy',d:'How unpredictable the bytes are, from 0 to 8 bits per byte. Compressed or encrypted data is near 8; English text is near 4.5.'}],
  about:'<p>Every file on this page is built in your browser with real bytes. The JPEG and PNG files come from your browser’s own image encoder, the GIF uses a small hand-written encoder, the ZIP files (including the DOCX) are real “stored” archives with CRC-32 checksums, the PDF has a real cross-reference table, and the MP3 has a real ID3v2.3 tag followed by one MPEG frame header. The “Open as” buttons really parse the bytes, and the image sizes are read from the headers.</p><p>Simplifications: the MP3 holds no playable audio, the PDF and DOCX are minimal, and the signature list covers only common types. Real tools such as forensic suites check hundreds of signatures and also look at trailers and internal structure. A signature can be faked too, so investigators treat a match as strong evidence, not proof. The case, names, school and club are invented.</p>',
  onClick(sim,x,y){const L=sim.vis.L||{},hx=sim.vis.hex;
    if(sim.p.mode==='case'&&L.list&&x>=12&&x<=232&&y>=40&&y<40+35*10){const i=Math.floor((y-40)/35);if(i>=0&&i<10)BioLab.setValues(sim,{file:i});return;}
    if(hx&&atLeast('honors')){const r=Math.floor((y-hx.y)/hx.lh)-1;let col=-1;if(x>=hx.hexX&&x<hx.ascX-1.2*hx.cw){const c=Math.floor((x-hx.hexX)/hx.cw);const adj=hx.per>8&&c>=24?c-1:c;col=Math.floor(adj/3);}else if(x>=hx.ascX)col=Math.floor((x-hx.ascX)/hx.cw);
      if(r>=0&&r<hx.rows&&col>=0&&col<hx.per){const o=(hx.sr+r)*hx.per+col;if(o<hx.len){sim.p.cursor=o;if(sim.ui.ctl.cursor)sim.ui.ctl.cursor.set(Math.min(63,o));}}}},
  initVis(sim){sim.vis.L={};},
  draw(sim,ctx,vdt,k){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);if(sim.p.mode==='sandbox')drawSandbox(sim,ctx,k);else drawCase(sim,ctx,k);},
  thumbSetup(sim){sim.p.file=1;}
};
function entropy(b){if(!b.length)return 0;const c=new Array(256).fill(0);b.forEach(v=>c[v]++);let h=0;c.forEach(n=>{if(n){const q=n/b.length;h-=q*Math.log2(q);}});return h;}
function updSandbox(sim){const st=sim.st;st.sb=sim.p.src==='hex'?parseHexInput(st.hex):enc(st.txt);}
function sigTable(hon){return '<details style="margin-top:10px"'+(hon?'':' open')+'><summary style="cursor:pointer;font-weight:700">Signature list</summary><div class="tbl-wrap" style="margin-top:6px"><table><thead><tr><th>Type</th><th>Starts with (hex)</th><th>As ASCII</th>'+(hon?'<th>Ends with</th>':'')+'</tr></thead><tbody>'+
  SIGS.map(s=>'<tr><td>'+s.t+'</td><td><code>'+hexStr(Uint8Array.from(s.hdr),0,8)+'</code></td><td><code>'+esc(Array.from(s.hdr,asc).join(''))+'</code></td>'+(hon?'<td><code>'+(s.trl?hexStr(Uint8Array.from(s.trl),0,8):'—')+'</code></td>':'')+'</tr>').join('')+
  '<tr><td>Plain text</td><td colspan="'+(hon?3:2)+'">No signature: printable characters only</td></tr></tbody></table></div></details>';}
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();

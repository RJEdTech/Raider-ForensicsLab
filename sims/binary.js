(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM}=BioLab.h;
/* ---------- small helpers ---------- */
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,"DejaVu Sans Mono",monospace';
function mt(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||600)+' '+(o.s||13)+'px '+MONO;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
const ON='#2d6bd2',PAR='#7b3fe4',BAD='#c62828',GOOD='#1b7339',WARM='#c27a00';
const SUPD='⁰¹²³⁴⁵⁶⁷⁸⁹';const sup=n=>String(n).split('').map(c=>c==='-'?'⁻':SUPD[+c]).join('');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const P2=n=>Math.pow(2,n);
const bitOf=(v,i)=>Math.floor(v/P2(i))%2;
const pop8=v=>{let c=0;for(let i=0;i<8;i++)c+=bitOf(v,i);return c;};
const bin=(v,w)=>v.toString(2).padStart(w,'0');
const hex=(v,w)=>v.toString(16).toUpperCase().padStart(Math.ceil(w/4),'0');
const grp=(s,n)=>s.replace(new RegExp('(.{'+n+'})(?=.)','g'),'$1 ');
const signedOf=(v,w)=>bitOf(v,w-1)?v-P2(w):v;
const W=sim=>clamp(Math.round(+sim.p.width)||8,8,32);
const shown=sim=>sim.p.signed?signedOf(sim.st.val,W(sim)):sim.st.val;
const MS='font-family:'+MONO.replace(/"/g,"'");
/* the score in Comet Dash (fictional) is kept in w bits, so it wraps around: stored = earned mod 2^w */
function addScore(stored,n,w){const t=stored+n,m=P2(w);return {v:((t%m)+m)%m,wrapped:t>=m};}
/* UTF-8 bytes of one code point (real TextEncoder) */
const ENC=new TextEncoder();
const u8=ch=>[...ENC.encode(ch)];
const cpOf=ch=>ch.codePointAt(0);
const uplus=cp=>'U+'+cp.toString(16).toUpperCase().padStart(4,'0');
/* exact decimal value of a 64-bit double, from its bits */
function bits64(x){const dv=new DataView(new ArrayBuffer(8));dv.setFloat64(0,x);return bin(dv.getUint32(0),32)+bin(dv.getUint32(4),32);}
function exactDec(x){if(!Number.isFinite(x))return String(x);if(x===0)return '0';const dv=new DataView(new ArrayBuffer(8));dv.setFloat64(0,x);
  const hi=dv.getUint32(0),lo=dv.getUint32(4),sign=hi>>>31,ex=(hi>>>20)&0x7ff;let man=(BigInt(hi&0xfffff)<<32n)|BigInt(lo),e;
  if(ex===0)e=-1074;else{man|=1n<<52n;e=ex-1075;}let s;
  if(e>=0)s=(man<<BigInt(e)).toString();else{const n=-e,num=man*(5n**BigInt(n));const str=num.toString().padStart(n+1,'0');s=str.slice(0,str.length-n)+'.'+str.slice(str.length-n);s=s.replace(/0+$/,'').replace(/\.$/,'');}
  return (sign?'−':'')+s;}
/* binary expansion of a typed decimal (exact, with BigInt), finding the repeating part */
function binExp(str,maxD){const m=/^\s*\+?(\d*)(?:\.(\d*))?\s*$/.exec(str);if(!m||(!m[1]&&!m[2]))return null;const ip=BigInt(m[1]||'0'),fs=m[2]||'';
  const den=10n**BigInt(fs.length);let num=fs?BigInt(fs):0n;const seen=new Map();let d='',rep=-1;
  for(let i=0;i<maxD&&num>0n;i++){if(seen.has(num)){rep=seen.get(num);break;}seen.set(num,i);num*=2n;if(num>=den){d+='1';num-=den;}else d+='0';}
  return {ip:ip.toString(2),d,rep,ends:num===0n};}
function shortDec(s,n){const neg=s[0]==='−';if(neg)s=s.slice(1);if(s.length<=n)return (neg?'−':'')+s;return (neg?'−':'')+s.slice(0,n)+'…';}
function parseNum(s,w,signed){s=String(s||'').trim().replace(/[\s_]/g,'');if(!s)return {err:'Type a number first.'};let v;
  if(/^0b[01]+$/i.test(s))v=parseInt(s.slice(2),2);else if(/^0x[0-9a-f]+$/i.test(s))v=parseInt(s.slice(2),16);else if(/^[01]{5,}$/.test(s))v=parseInt(s,2);else if(/^[+\-−]?\d+$/.test(s))v=parseInt(s.replace('−','-'),10);else return {err:'Use digits (165), binary (0b10100101) or hex (0xA5).'};
  const max=P2(w)-1;if(v<0){if(!signed)return {err:'Negative numbers need Signed (two’s complement) turned on.'};if(v<-P2(w-1))return {err:'Too negative for '+w+' signed bits (lowest is −'+P2(w-1)+').'};return {v:v+P2(w)};}
  if(signed&&v>P2(w-1)-1)return {err:'Too big for '+w+' signed bits (highest is '+(P2(w-1)-1)+').'};if(v>max)return {err:'Too big for '+w+' bits. The largest is '+max.toLocaleString('en-US')+'.'};return {v};}
/* ---------- tiny 8×8 picture (fictional sprite) ---------- */
const ART=['..YYYY..','.YYYYYY.','YYKYYKYY','YYYYYYYY','YKYYYYKY','YYKKKKYY','.YYYYYY.','..YYYY..'];
const ACOL={'.':[79,163,224],Y:[255,200,0],K:[58,42,26]};
const artPx=()=>{const a=[];ART.forEach(r=>r.split('').forEach(c=>a.push(ACOL[c].slice())));return a;};
const rgbHex=c=>'#'+c.map(v=>v.toString(16).toUpperCase().padStart(2,'0')).join('');
/* ---------- the investigation: a message with one flipped bit ---------- */
const CASES=[
  {from:'Coach Ortega (fictional)',to:'the Comets team',sent:'MEET AT GATE 3',idx:10,bit:1},
  {from:'the Pinecrest bus desk (fictional)',to:'the away team',sent:'BUS AT 7:15',idx:9,bit:1},
  {from:'Ms. Adeyemi (fictional)',to:'a new student',sent:'LOCKER 42',idx:7,bit:2}];
function newCase(i){i=clamp(Math.round(+i)||0,0,CASES.length-1);const C=CASES[i];const orig=[...C.sent].map(c=>c.charCodeAt(0));const rx=orig.slice();rx[C.idx]^=(1<<C.bit);
  return {i,orig,rx,sel:C.idx===0?1:0,flips:0,touched:{},two:false};}
const rxText=cs=>cs.rx.map(c=>String.fromCharCode(c)).join('');
const parBit=v=>pop8(v)%2;              // even parity: the sender adds a 1 if the byte has an odd number of 1s
const colFail=(cs,c)=>(pop8(cs.rx[c])+parBit(cs.orig[c]))%2===1;
const rowPar=(arr,b)=>arr.reduce((s,v)=>s+bitOf(v,b),0)%2;
const rowFail=(cs,b)=>rowPar(cs.rx,b)!==rowPar(cs.orig,b);
const nFail=cs=>cs.rx.reduce((s,v,c)=>s+(colFail(cs,c)?1:0),0);
const solved=cs=>cs.rx.every((v,c)=>v===cs.orig[c]);
const glyph=c=>c===32?'␣':String.fromCharCode(c);
function flipCase(sim,c,b){const cs=sim.st.cs;if(c<0||c>=cs.rx.length||b<0||b>7)return;cs.rx[c]^=(1<<b);cs.flips++;const k=c+':'+b;if(cs.touched[k])delete cs.touched[k];else cs.touched[k]=1;cs.sel=c;}
function flipTwo(sim){const cs=sim.st.cs;const c=CASES[cs.i].idx===0?1:0;cs.rx[c]^=3;cs.two=true;}

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!atLeast('honors')&&sim.p.mode==='float')BioLab.setValues(sim,{mode:'case'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});sim.infoDirty=true;}

/* ---------- layouts (shared by draw, clicks and tour focus) ---------- */
function bitsLayout(w){if(w===8)return {rows:1,cw:80,ch:64,x0:80,y0:120,gap:0};const rows=w/8;return {rows,cw:76,ch:46,x0:96,y0:rows===2?118:70,gap:30};}
function bitCell(L,w,i){const pos=w-1-i,row=Math.floor(pos/8),col=pos%8;return {x:L.x0+col*L.cw,y:L.y0+row*(L.ch+L.gap),w:L.cw,h:L.ch};}
function caseLayout(cs,grid){const n=cs.rx.length,cols=n+(grid?1:0),cw=Math.min(52,Math.floor(700/cols));return {x0:80,cw,yg:72,yb:96,rh:27,n,cols};}

const BIN={
  id:'binary',hash:'binary',apUnit:20,order:1,tab:'Data is just bits',kind:'Learning tool',
  card:'Flip bit switches, turn text and pixels into bytes, and track down the one flipped bit that changed a team message.',
  title:'Data is just bits',
  lede:{bio:'Every number, letter, color and photo in a computer is stored as switches that are off (0) or on (1). Flip the switches, read text and pixels as numbers, then find the one bit that broke a message.',
        honors:'See the same byte as decimal, binary and hex, watch an 8-bit score overflow, find out why 0.1 + 0.2 is not exactly 0.3, and use a parity bit to catch a transmission error.',
        ap:'Work with two’s complement negatives, UTF-8 byte patterns, the 64 bits of a floating-point number, and 2D parity that pinpoints the exact flipped bit.'},
  scale:{bio:'One switch is one bit. Eight bits make a byte. A text message is a few dozen bytes; a phone photo is a few million.',ap:'1 byte = 8 bits; 1 KiB = 2¹⁰ = 1024 bytes; 1 MiB = 2²⁰ bytes. A 12-megapixel photo is 36 MB before compression.'},
  timeless:true,animated:true,graph:false,
  controls:[
    {id:'mode',label:'Explore',type:'seg',def:'case',options:[{v:'case',l:'Investigate'},{v:'bits',l:'Bits and numbers'},{v:'text',l:'Text'},{v:'image',l:'Pixels'},{v:'overflow',l:'Overflow'},{v:'float',l:'Decimals',lvl:'honors'}],noTrial:true},
    {id:'caseSel',label:'Message',type:'select',def:0,modes:['case'],noTrial:true,options:[{v:0,l:'Coach’s meeting spot'},{v:1,l:'Bus departure time'},{v:2,l:'Locker number'}],
      onChange(sim){sim.st.cs=newCase(sim.p.caseSel);}},
    {id:'parity',label:'Add a parity bit',type:'toggle',def:false,modes:['case'],help:'The sender adds one extra bit to each character so the number of 1s is always even.'},
    {id:'grid',label:'2D parity (rows and columns)',type:'toggle',def:false,lvl:'ap',modes:['case'],help:'Also add a parity bit for each bit position across the whole message.'},
    {id:'width',label:'Number of bits',type:'seg',def:8,modes:['bits','overflow'],options:[{v:8,l:'8 bits'},{v:16,l:'16 bits',lvl:'honors'},{v:32,l:'32 bits',lvl:'ap'}],
      onChange(sim){const m=P2(W(sim));sim.st.val=sim.st.val%m;sim.st.score=sim.st.score%m;}},
    {id:'signed',label:'Signed (two’s complement)',type:'toggle',def:false,lvl:'ap',modes:['bits','overflow'],help:'The leftmost bit counts as negative, so the same switches can hold negative numbers.'},
    {id:'pix',label:'Selected pixel',type:'range',min:0,max:63,step:1,def:18,modes:['image'],help:'Or click a pixel in the picture.',
      onChange(sim){const i=clamp(Math.round(+sim.p.pix)||0,0,63);sim.st.sel=i;const c=sim.st.px[i];BioLab.setValues(sim,{r:c[0],g:c[1],b:c[2]});}},
    {id:'r',label:'Red',type:'range',min:0,max:255,step:1,def:58,modes:['image'],onChange(sim){sim.st.px[sim.st.sel][0]=clamp(Math.round(+sim.p.r)||0,0,255);}},
    {id:'g',label:'Green',type:'range',min:0,max:255,step:1,def:42,modes:['image'],onChange(sim){sim.st.px[sim.st.sel][1]=clamp(Math.round(+sim.p.g)||0,0,255);}},
    {id:'b',label:'Blue',type:'range',min:0,max:255,step:1,def:26,modes:['image'],onChange(sim){sim.st.px[sim.st.sel][2]=clamp(Math.round(+sim.p.b)||0,0,255);}}
  ],
  actions:[
    {id:'add1',label:'Add 1',primary:true,modes:['bits'],run(sim){const st=sim.st,m=P2(W(sim));if(st.val+1>=m)st.carryT=1.4;st.val=(st.val+1)%m;}},
    {id:'shl',label:'Shift left (× 2)',lvl:'honors',modes:['bits'],run(sim){const st=sim.st,m=P2(W(sim));if(st.val*2>=m)st.carryT=1.4;st.val=(st.val*2)%m;}},
    {id:'neg',label:'Negate (flip all, add 1)',lvl:'ap',modes:['bits'],run(sim){const st=sim.st,m=P2(W(sim));st.val=(m-st.val)%m;}},
    {id:'clr',label:'All off',modes:['bits'],run(sim){sim.st.val=0;}},
    {id:'s10',label:'Score +10',primary:true,modes:['overflow'],run(sim){scoreAdd(sim,10);}},
    {id:'s1',label:'Score +1',modes:['overflow'],run(sim){scoreAdd(sim,1);}},
    {id:'s1k',label:'Score +1000',lvl:'honors',modes:['overflow'],run(sim){scoreAdd(sim,1000);}},
    {id:'near',label:'Jump near the limit',modes:['overflow'],run(sim){const st=sim.st,w=W(sim);const top=sim.p.signed?P2(w-1)-1:P2(w)-1;st.score=top-5;st.earned=top-5;st.wraps=0;}},
    {id:'snew',label:'New game',modes:['overflow'],run(sim){const st=sim.st;st.score=0;st.earned=0;st.wraps=0;}},
    {id:'two',label:'Flip two bits (test the check)',lvl:'honors',modes:['case'],run(sim){flipTwo(sim);}},
    {id:'crst',label:'Reset the message',modes:['case'],run(sim){sim.st.cs=newCase(sim.p.caseSel);}},
    {id:'irst',label:'Reset the picture',modes:['image'],run(sim){sim.st.px=artPx();BioLab.setValues(sim,{pix:sim.st.sel});}}
  ],
  init(sim){return {val:165,carryT:0,score:0,earned:0,wraps:0,wrapT:0,text:'Café',px:artPx(),sel:18,fa:'0.1',fb:'0.2',cs:newCase(sim.p.caseSel),msg:''};},
  metrics:[
    {id:'dec',label:'Decimal',lvl:'bio',d:0,modes:['bits'],get:s=>shown(s)},
    {id:'binS',label:'Binary',text:true,modes:['bits'],get:s=>grp(bin(s.st.val,W(s)),4)},
    {id:'hexS',label:'Hex',lvl:'honors',text:true,modes:['bits'],get:s=>'0x'+hex(s.st.val,W(s))},
    {id:'range',label:'This many bits can hold',text:true,modes:['bits','overflow'],get:s=>{const w=W(s);return s.p.signed?'−'+P2(w-1).toLocaleString('en-US')+' to '+(P2(w-1)-1).toLocaleString('en-US'):'0 to '+(P2(w)-1).toLocaleString('en-US');}},
    {id:'earned',label:'Points earned',d:0,modes:['overflow'],get:s=>s.st.earned},
    {id:'stored',label:'Score the game shows',d:0,modes:['overflow'],get:s=>s.p.signed?signedOf(s.st.score,W(s)):s.st.score},
    {id:'wraps',label:'Times it rolled over',lvl:'honors',d:0,modes:['overflow'],get:s=>s.st.wraps},
    {id:'nch',label:'Characters',d:0,modes:['text'],get:s=>[...s.st.text].length},
    {id:'nby',label:'Bytes (UTF-8)',d:0,modes:['text'],get:s=>ENC.encode(s.st.text).length},
    {id:'nbits',label:'Bits',lvl:'honors',d:0,modes:['text'],get:s=>ENC.encode(s.st.text).length*8},
    {id:'pxc',label:'Selected pixel',text:true,modes:['image'],get:s=>{const c=s.st.px[s.st.sel];return (atLeast('honors')?rgbHex(c)+'  ':'')+'R '+c[0]+', G '+c[1]+', B '+c[2];}},
    {id:'isz',label:'Picture size',unit:'bytes',d:0,modes:['image'],get:()=>8*8*3},
    {id:'fsum',label:'Computer’s answer',lvl:'honors',text:true,modes:['float'],get:s=>{const f=floatPair(s);return f?String(f.sum):'—';}},
    {id:'ferr',label:'Off from the true sum by',lvl:'honors',text:true,modes:['float'],get:s=>{const f=floatPair(s);return f?f.errText:'—';}},
    {id:'cerr',label:'Characters failing the check',d:0,modes:['case'],get:s=>s.p.parity?nFail(s.st.cs):null},
    {id:'cflips',label:'Bits you flipped',d:0,modes:['case'],get:s=>s.st.cs.flips},
    {id:'cstat',label:'Message',text:true,modes:['case'],get:s=>{const cs=s.st.cs;if(solved(cs))return 'Fixed: it matches what was sent';if(!s.p.parity)return 'No check bit yet';const n=nFail(cs);return n?'Check fails in '+n+' character'+(n>1?'s':''):'Check passes. Does it read right?';}}
  ],
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),w=W(sim);
    if(p.mode==='case'){const cs=st.cs,C=CASES[cs.i];
      if(solved(cs))return '<b>You fixed it.</b> “'+C.sent+'” is what '+C.from+' sent. You flipped '+cs.flips+' bit'+(cs.flips===1?'':'s')+' to repair one bit that changed on the way.';
      if(!p.parity)return 'Each character is one byte: 8 bits. One bit flipped on the way, so one character changed. <b>Can you tell which one just by reading?</b> Then turn on the parity bit.';
      const n=nFail(cs);if(cs.two&&!n)return 'Two bits flipped in the same character, so the count of 1s is still even. <b>Parity can catch one flip but misses two.</b>';
      if(n&&p.grid){const c=cs.rx.findIndex((v,i)=>colFail(cs,i)),b=[...Array(8).keys()].find(b=>rowFail(cs,b));return 'The failing character (column '+(c+1)+') and the failing bit row ('+P2(b)+'s place) cross at exactly one bit. <b>2D parity points to the bit, so you can fix it without guessing.</b>';}
      if(n)return '<b>Character '+(cs.rx.findIndex((v,i)=>colFail(cs,i))+1)+' fails the check:</b> it has an odd number of 1s. Parity tells you which character broke, not which bit, so flip bits in it until the word makes sense.';
      return 'Every character passes the parity check'+(cs.two?', but two flips inside one character cancel out.':'. Read the message: does it make sense?');}
    if(p.mode==='bits'){const v=shown(sim),on=[];for(let i=w-1;i>=0;i--)if(bitOf(st.val,i))on.push(i);
      if(!on.length)return 'All switches are off, so the value is 0. <b>Click a switch</b> to turn it on.';
      let s='The switches that are on add up: ';s+=(w===8?on.map(i=>(p.signed&&i===w-1?'−':'')+P2(i)).join(' + '):on.length+' switches on')+' = <b>'+v.toLocaleString('en-US')+'</b>.';
      if(p.signed&&bitOf(st.val,w-1))s+=' The leftmost bit is worth −'+P2(w-1).toLocaleString('en-US')+', so the number is negative.';else if(hon)s+=' Each hex digit stands for 4 bits, so 0x'+hex(st.val,w)+' is a short way to write it.';else s+=' Each switch is worth twice the one to its right.';return s;}
    if(p.mode==='text'){const ch=[...st.text],nb=ENC.encode(st.text).length;if(!ch.length)return 'Type some text in the panel below the stage.';
      const multi=ch.filter(c=>u8(c).length>1).length;return 'Each character has a number (its code). <b>'+ch.length+' character'+(ch.length>1?'s':'')+' become '+nb+' bytes</b> in UTF-8.'+(multi?' Letters outside basic English, like é or an emoji, need 2 to 4 bytes.':' Basic English letters, digits and spaces fit in one byte each.');}
    if(p.mode==='image'){const c=st.px[st.sel];return 'Each pixel is three numbers: how much red, green and blue light. This one is R '+c[0]+', G '+c[1]+', B '+c[2]+'. <b>8 × 8 pixels × 3 bytes = 192 bytes</b> for the whole picture.';}
    if(p.mode==='overflow'){const sv=p.signed?signedOf(st.score,w):st.score;if(st.earned===sv)return 'The game keeps the score in '+w+' bits. Press Score +10 or jump near the limit to see what happens at the top.';
      return '<b>The score rolled over.</b> You earned '+st.earned.toLocaleString('en-US')+' points, but '+w+' bits can only count to '+(p.signed?P2(w-1)-1:P2(w)-1).toLocaleString('en-US')+', so the extra carry bit had nowhere to go and the game shows '+sv.toLocaleString('en-US')+'.';}
    const f=floatPair(sim);if(!f)return 'Type two decimal numbers in the panel below.';
    return 'Most decimals have no exact binary form, just like 1/3 has no exact decimal form. The computer stores the closest value it can, so <b>'+st.fa+' + '+st.fb+' = '+f.sum+'</b>'+(f.sum===f.exactSumNum?'.':', a tiny bit off.');},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap'),w=W(sim);let h='';
    if(p.mode==='case'){const cs=st.cs,C=CASES[cs.i],c=clamp(cs.sel,0,cs.rx.length-1),v=cs.rx[c];
      h+='<div class="p-head"><h3>Fix the message</h3></div><p>From '+esc(C.from)+' to '+esc(C.to)+'. Received: <b style="'+MS+';font-size:17px">'+esc(rxText(cs))+'</b></p>';
      h+='<p><label for="binary-ch"><b>Character</b></label> <select class="sel" id="binary-ch">'+cs.rx.map((x,i)=>'<option value="'+i+'"'+(i===c?' selected':'')+'>'+(i+1)+': '+esc(glyph(x))+'</option>').join('')+'</select> = <span style="'+MS+'">'+grp(bin(v,8),4)+'</span> ('+v+')</p>';
      h+='<p style="margin-bottom:4px">Flip a bit in this character:</p><div class="row" style="margin-bottom:10px">'+[7,6,5,4,3,2,1,0].map(b=>'<button type="button" class="btn" data-flip="'+b+'" aria-label="Flip the '+P2(b)+'s bit, now '+bitOf(v,b)+'">'+P2(b)+': '+bitOf(v,b)+'</button>').join('')+'</div>';
      if(solved(cs))h+='<p class="verdict ok">Fixed. The message reads “'+esc(C.sent)+'”.</p>';
      h+='<p><b>Your steps:</b> 1. Read the message. Which character looks wrong? 2. Turn on <b>Add a parity bit</b> and see which character fails. 3. Flip bits in that character until it passes and reads right.'+(hon?' 4. Press <b>Flip two bits</b> to test whether parity catches everything.':'')+'</p>';
      if(ap)h+='<p><b>2D parity:</b> one parity bit per character (column) plus one per bit position (row). A single flipped bit fails exactly one column and one row, so their crossing is the bad bit. This is the idea behind error-correcting codes like Hamming codes.</p>';
      return h;}
    if(p.mode==='bits'){h+='<div class="p-head"><h3>Set the switches</h3></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px"><label for="binary-num" style="font-weight:600">Number</label><input id="binary-num" class="sel" autocomplete="off" style="flex:1 1 120px;min-width:0;max-width:220px;font-size:16px;padding:6px 10px" placeholder="165, 0b1010 or 0xA5"><button type="button" class="btn primary" id="binary-set">Show it</button></div>';
      if(st.msg)h+='<p class="verdict no">'+esc(st.msg)+'</p>';
      h+='<p style="margin-bottom:4px">Or flip one switch:</p><div class="row" style="margin-bottom:10px">'+[...Array(w).keys()].reverse().map(i=>'<button type="button" class="btn" data-bit="'+i+'" aria-label="Flip bit '+i+'">'+(w>8?'bit '+i:(p.signed&&i===w-1?'−':'')+P2(i))+': '+bitOf(st.val,i)+'</button>').join('')+'</div>';
      if(hon)h+='<p><b>Hex</b> groups bits by 4: 0000 = 0 … 1001 = 9, 1010 = A … 1111 = F. Two hex digits always make one byte, which is why hex dumps and color codes use it.</p>';
      if(ap)h+='<p><b>Two’s complement:</b> the top bit is worth −2<sup>'+(w-1)+'</sup>. To negate, flip every bit and add 1. Adding then works the same for positive and negative numbers.</p><p><b>Powers of 2:</b> n bits give 2<sup>n</sup> different values, so n address lines reach 2<sup>n</sup> bytes of memory. That is why memory comes in 8, 16 or 32 GB and why 1 KiB is 1024 bytes, not 1000.</p>';
      return h;}
    if(p.mode==='text'){const ch=[...st.text].slice(0,24);h+='<div class="p-head"><h3>Type any text</h3></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px"><label for="binary-txt" style="font-weight:600">Text</label><input id="binary-txt" class="sel" maxlength="24" autocomplete="off" style="flex:1 1 140px;min-width:0;max-width:260px;font-size:16px;padding:6px 10px" value="'+esc(st.text)+'"><button type="button" class="btn primary" id="binary-enc">Encode</button></div>';
      h+='<div class="row" style="margin-bottom:10px">'+['Hi!','Café','Go 🚀','€5','日本'].map(x=>'<button type="button" class="btn" data-ex="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>';
      h+='<div class="tbl-wrap"><table><thead><tr><th>Char</th><th>Code</th><th>UTF-8 bytes'+(hon?' (hex)':'')+'</th>'+(ap?'<th>Bits</th>':'')+'</tr></thead><tbody>'+ch.map(c=>{const b=u8(c);return '<tr><td>'+esc(c===' '?'space':c)+'</td><td>'+(hon?uplus(cpOf(c)):cpOf(c))+'</td><td style="'+MS+'">'+b.map(x=>hon?hex(x,8):x).join(' ')+'</td>'+(ap?'<td style="'+MS+'">'+b.map(x=>bin(x,8)).join(' ')+'</td>':'')+'</tr>';}).join('')+'</tbody></table></div>';
      if(ap)h+='<p style="margin-top:8px"><b>UTF-8 patterns:</b> 1 byte 0xxxxxxx; 2 bytes 110xxxxx 10xxxxxx; 3 bytes 1110xxxx then two 10xxxxxx; 4 bytes 11110xxx then three 10xxxxxx. The x bits hold the code point. ASCII text (codes below 128) is unchanged.</p>';
      return h;}
    if(p.mode==='image'){const c=st.px[st.sel];h+='<div class="p-head"><h3>Pixel '+st.sel+' (row '+(Math.floor(st.sel/8)+1)+', column '+(st.sel%8+1)+')</h3></div><p>Red '+c[0]+', green '+c[1]+', blue '+c[2]+'. 0 means none of that light, 255 means full.</p>';
      if(hon)h+='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px"><label for="binary-hex" style="font-weight:600">Hex color</label><input id="binary-hex" class="sel" maxlength="7" autocomplete="off" style="flex:1 1 100px;min-width:0;max-width:140px;font-size:16px;padding:6px 10px;'+MS+'" value="'+rgbHex(c)+'"><button type="button" class="btn primary" id="binary-hexset">Apply</button></div>'+(st.msg?'<p class="verdict no">'+esc(st.msg)+'</p>':'')+'<p>A color code like #FFC800 is just three bytes in hex: FF red, C8 green, 00 blue.</p>';
      if(ap)h+='<p>This pixel’s bytes: <span style="'+MS+'">'+c.map(x=>bin(x,8)).join(' ')+'</span></p><p>Row '+(Math.floor(st.sel/8)+1)+' as a hex dump: <span style="'+MS+';word-break:break-all">'+st.px.slice(Math.floor(st.sel/8)*8,Math.floor(st.sel/8)*8+8).map(x=>x.map(v=>hex(v,8)).join(' ')).join(' ')+'</span></p><p>A 1920 × 1080 screen image is 1920 × 1080 × 3 = 6,220,800 bytes ≈ 5.93 MiB before compression.</p>';
      return h;}
    if(p.mode==='overflow'){const sv=p.signed?signedOf(st.score,w):st.score;h+='<div class="p-head"><h3>Comet Dash (fictional) scoreboard</h3></div><p>The game stores the score in <b>'+w+' bits</b>. The largest value is '+(p.signed?P2(w-1)-1:P2(w)-1).toLocaleString('en-US')+'.</p>';
      h+='<p>Stored score = points earned mod 2<sup>'+w+'</sup> = '+st.earned.toLocaleString('en-US')+' mod '+P2(w).toLocaleString('en-US')+' = <b>'+st.score.toLocaleString('en-US')+'</b>'+(p.signed?' (read as signed: '+sv.toLocaleString('en-US')+')':'')+'.</p>';
      if(hon)h+='<p>Real overflow bugs happen: counters, timers and money fields that are too small roll over. A 32-bit count of seconds since 1970 runs out in January 2038.</p>';return h;}
    const f=floatPair(sim);h+='<div class="p-head"><h3>Add two decimals</h3></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px"><input id="binary-fa" class="sel" aria-label="First number" autocomplete="off" style="flex:1 1 80px;min-width:0;max-width:120px;font-size:16px;padding:6px 10px" value="'+esc(st.fa)+'"> + <input id="binary-fb" class="sel" aria-label="Second number" autocomplete="off" style="flex:1 1 80px;min-width:0;max-width:120px;font-size:16px;padding:6px 10px" value="'+esc(st.fb)+'"><button type="button" class="btn primary" id="binary-fadd">Add</button></div>';
    if(st.msg)h+='<p class="verdict no">'+esc(st.msg)+'</p>';
    if(f){h+='<p>Exactly stored values:</p><ul style="'+MS+';font-size:13px;word-break:break-all;padding-left:18px"><li>'+esc(st.fa)+' → '+exactDec(f.a)+'</li><li>'+esc(st.fb)+' → '+exactDec(f.b)+'</li><li>sum → '+exactDec(f.sum)+'</li></ul>';
      if(ap){const b=bits64(f.sum);h+='<p>The sum’s 64 bits: <span style="'+MS+';font-size:13px;word-break:break-all"><b style="color:var(--bad)">'+b[0]+'</b> <b style="color:var(--rj-ink)">'+b.slice(1,12)+'</b> '+b.slice(12)+'</span></p><p>1 sign bit, 11 exponent bits, 52 fraction bits (IEEE 754 double). The fraction has only 52 bits, so a repeating binary fraction must be cut off and rounded.</p>';}}
    return h;},
  bindInfo(sim,el){const st=sim.st,go=()=>BioLab.refresh(sim);
    const ch=el.querySelector('#binary-ch');if(ch)ch.addEventListener('change',()=>{st.cs.sel=+ch.value;go();});
    el.querySelectorAll('[data-flip]').forEach(b=>b.addEventListener('click',()=>{flipCase(sim,st.cs.sel,+b.dataset.flip);go();}));
    el.querySelectorAll('[data-bit]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.bit;st.val+=bitOf(st.val,i)?-P2(i):P2(i);st.msg='';go();}));
    const num=el.querySelector('#binary-num'),set=el.querySelector('#binary-set');
    if(num){const f=()=>{const r=parseNum(num.value,W(sim),sim.p.signed);if(r.err)st.msg=r.err;else{st.val=r.v;st.msg='';}go();};set.addEventListener('click',f);num.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();f();}});}
    const tx=el.querySelector('#binary-txt'),enc=el.querySelector('#binary-enc');
    if(tx){const f=()=>{st.text=[...tx.value].slice(0,24).join('');go();};enc.addEventListener('click',f);tx.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();f();}});
      el.querySelectorAll('[data-ex]').forEach(b=>b.addEventListener('click',()=>{st.text=b.dataset.ex;go();}));}
    const hx=el.querySelector('#binary-hex'),hs=el.querySelector('#binary-hexset');
    if(hx){const f=()=>{const m=/^#?([0-9a-f]{6})$/i.exec(hx.value.trim());if(!m){st.msg='Use six hex digits, like #FFC800.';go();return;}st.msg='';const v=parseInt(m[1],16);BioLab.setValues(sim,{r:(v>>16)&255,g:(v>>8)&255,b:v&255});go();};hs.addEventListener('click',f);hx.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();f();}});}
    const fa=el.querySelector('#binary-fa'),fb=el.querySelector('#binary-fb'),fadd=el.querySelector('#binary-fadd');
    if(fa){const f=()=>{const a=fa.value.trim(),b=fb.value.trim();if(!/^\d*\.?\d+$/.test(a)||!/^\d*\.?\d+$/.test(b)||a.length>18||b.length>18){st.msg='Use plain decimals like 0.1 or 2.75.';go();return;}st.msg='';st.fa=a;st.fb=b;go();};fadd.addEventListener('click',f);[fa,fb].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();f();}}));}},
  onClick(sim,x,y){const p=sim.p,st=sim.st;
    if(p.mode==='case'){const cs=st.cs,L=caseLayout(cs,p.grid&&atLeast('ap'));const c=Math.floor((x-L.x0)/L.cw);if(c<0||c>=cs.rx.length)return;const r=Math.floor((y-L.yb)/L.rh);
      if(y<L.yb&&y>L.yg-30){cs.sel=c;return;}if(r>=0&&r<8)flipCase(sim,c,7-r);else cs.sel=c;return;}
    if(p.mode==='bits'){const w=W(sim),L=bitsLayout(w);for(let i=0;i<w;i++){const c=bitCell(L,w,i);if(x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h){st.val+=bitOf(st.val,i)?-P2(i):P2(i);st.msg='';return;}}return;}
    if(p.mode==='image'){const cx=Math.floor((x-40)/40),cy=Math.floor((y-60)/40);if(cx>=0&&cx<8&&cy>=0&&cy<8)BioLab.setValues(sim,{pix:cy*8+cx});}},
  tour:[
    {title:'A byte is eight switches',text:'Each box is a bit: a switch that is off (0) or on (1). Eight bits make a byte. Click any switch to flip it.',focus:[70,90,660,104],speed:1,setup(sim){BioLab.setValues(sim,{mode:'bits',width:8,signed:false});sim.st.val=5;}},
    {title:'Place values double',text:'Each switch is worth twice the one to its right: 1, 2, 4, 8 … 128. Add the ones that are on. Here 128 + 32 + 4 + 1 = 165.',focus:[30,96,740,240],speed:1,setup(sim){sim.st.val=165;}},
    {lvl:'honors',title:'Hex is shorthand',text:'Split the byte into two groups of 4 bits. Each group is one hex digit, 0–9 then A–F. 1010 0101 is A5.',focus:[70,186,660,64],speed:1},
    {title:'Text is numbers',text:'Every character has a code. “C” is 67 and fits in one byte. “é” needs two bytes in UTF-8, and an emoji needs four.',focus:[20,64,760,300],speed:1,setup(sim){BioLab.setValues(sim,{mode:'text'});sim.st.text='Café';}},
    {title:'Pixels are numbers',text:'Each pixel is three bytes: red, green and blue light from 0 to 255. Change a pixel’s numbers and its color changes.',focus:[[30,50,340,340],[392,52,384,250]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'image',pix:18});}},
    {title:'Counting past the top',text:'Comet Dash (fictional) keeps its score in one byte. 255 is the most 8 bits can hold, so 255 + 1 rolls over to 0. The carry bit falls off the end.',focus:[[40,82,330,330],[392,60,396,300]],speed:1,setup(sim){BioLab.setValues(sim,{mode:'overflow',width:8,signed:false});sim.st.score=250;sim.st.earned=250;sim.st.wraps=0;scoreAdd(sim,10);}},
    {title:'One flipped bit',text:'A message arrived with one bit flipped, so one letter changed. The parity bit makes every character’s count of 1s even. The character with an odd count is the broken one.',focus:[0,40,800,340],speed:1,setup(sim){BioLab.setValues(sim,{mode:'case',caseSel:0,parity:true,grid:false});}},
    {lvl:'ap',title:'Negative numbers',text:'In two’s complement the top bit is worth −128. 11111111 is −128 + 127 = −1. Flip all the bits and add 1 to negate any number.',focus:[30,90,740,250],speed:1,setup(sim){BioLab.setValues(sim,{mode:'bits',width:8,signed:true});sim.st.val=255;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case',caseSel:0,parity:false,grid:false,width:8,signed:false});sim.st.cs=newCase(0);},
  onChallenge(sim,ch,phase){if(ch&&phase==='done'){if(ch.set)BioLab.setValues(sim,ch.set);if(ch.act)ch.act(sim);BioLab.refresh(sim);}},
  challenges(){const c250=addScore(250,10,8).v,c127=signedOf(addScore(127,1,8).v,8),e1=u8('é').length,f=0.1+0.2;
    const C1=CASES[1],bad1=String.fromCharCode(C1.sent.charCodeAt(C1.idx)^(1<<C1.bit));
    return [
    {lvl:'bio',instant:true,q:'Turn on all 8 switches in one byte. What number is that?',choices:['8','128','255','256'],correct:2,set:{mode:'bits',width:8,signed:false},act(s){s.st.val=255;},
     explain:'128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. The model is now showing it. 256 needs a ninth bit, which is why one byte holds 256 different values: 0 to 255.'},
    {lvl:'bio',instant:true,q:'Comet Dash (fictional) saves the score in one byte. You have 250 points and earn 10 more. What does the game show?',choices:['260','255, because it stops at the top','4','An error message'],correct:2,
     set:{mode:'overflow',width:8,signed:false},act(s){s.st.score=250;s.st.earned=250;s.st.wraps=0;scoreAdd(s,10);},
     explain:'250 + 10 = 260, but one byte only counts to 255. The 256s bit has nowhere to go, so the score rolls over: 260 − 256 = '+c250+'. The scoreboard is set up this way now.'},
    {lvl:'bio',instant:true,q:'In the bus message, “7:15” arrived as “7:'+bad1+'5”. Could you tell it was wrong just by reading it?',choices:['Yes, it looks obviously wrong','No, it still looks like a real time, so you need a check bit','Yes, because numbers cannot change'],correct:1,
     set:{mode:'case',caseSel:1,parity:true,grid:false},act(s){s.st.cs=newCase(1);},
     explain:'“7:'+bad1+'5” is a believable time, so reading it cannot catch the error. With the parity bit on, character '+(C1.idx+1)+' now fails the check. Investigators and networks use checks like this instead of trusting how data looks.'},
    {lvl:'honors',instant:true,q:'In UTF-8, how many bytes does the letter é take?',choices:['1','2','4','8'],correct:1,set:{mode:'text'},act(s){s.st.text='é';},
     explain:'é is code point U+00E9, past the 128 one-byte ASCII codes, so UTF-8 uses '+e1+' bytes: C3 A9. The text view is showing it now.'},
    {lvl:'honors',instant:true,q:'Two bits flip inside the same character. Does a single parity bit catch it?',choices:['Yes, any change breaks the parity','No, the two flips cancel out, so the count of 1s stays even','Only if the two bits are next to each other'],correct:1,
     set:{mode:'case',caseSel:0,parity:true,grid:false},act(s){s.st.cs=newCase(0);flipTwo(s);},
     explain:'The first character now has two flipped bits and still passes the check. A parity bit only notices an odd number of flips, so stronger checks (like the hashes investigators use) are needed for real evidence.'},
    {lvl:'honors',instant:true,q:'Does 0.1 + 0.2 equal exactly 0.3 inside the computer?',choices:['Yes','No, it comes out a tiny bit more than 0.3','No, it comes out a tiny bit less than 0.3'],correct:1,set:{mode:'float'},act(s){s.st.fa='0.1';s.st.fb='0.2';},
     explain:'The computer gets '+f+'. 0.1 and 0.2 repeat forever in binary, so each is rounded when stored, and the rounding errors add up to about 4 × 10⁻¹⁷.'},
    {lvl:'ap',instant:true,q:'In 8-bit two’s complement, what does 11111111 mean?',choices:['255','−1','−127','−128'],correct:1,set:{mode:'bits',width:8,signed:true},act(s){s.st.val=255;},
     explain:'The top bit is worth −128 and the rest add to 127: −128 + 127 = '+signedOf(255,8)+'. Adding 1 gives 00000000, just as −1 + 1 = 0 should.'},
    {lvl:'ap',instant:true,q:'A signed 8-bit score is 127. Add 1. What is stored?',choices:['128','0','−128','127, because it stops'],correct:2,set:{mode:'overflow',width:8,signed:true},act(s){s.st.score=127;s.st.earned=127;s.st.wraps=0;scoreAdd(s,1);},
     explain:'01111111 + 1 = 10000000. In two’s complement that pattern means '+c127+', so the score jumps from the highest value to the lowest.'},
    {lvl:'ap',instant:true,q:'With 2D parity on, how do you find the exact flipped bit?',choices:['Where the failing column meets the failing row','Any bit in the failing column will do','You still cannot locate it'],correct:0,set:{mode:'case',caseSel:2,parity:true,grid:true},act(s){s.st.cs=newCase(2);},
     explain:'One flipped bit breaks exactly one character’s parity and one bit position’s parity. The model now marks where they cross. Flip that bit and both checks pass.'}];},
  lab:{bio:'<p><b>Question:</b> Which bit flipped in each message, and how can you prove it?</p><ol><li>In Investigate, read each received message and write down which character you think changed.</li><li>Turn on <b>Add a parity bit</b>. Record which character fails the check.</li><li>Flip bits in that character until the check passes and the message reads right. Press Record trial.</li></ol><p>Which message could you NOT fix by reading alone? Why?</p>',
    honors:'<p><b>Question:</b> What can a parity bit catch, and what does it miss?</p><ol><li>Fix all three messages, recording a trial for each (bits you flipped).</li><li>Reset a message and press <b>Flip two bits</b>. Record whether the check catches it.</li><li>In Overflow, find the score shown after 260, 300 and 1000 points in 8 bits.</li></ol><p>Write a rule for the stored score, and explain why parity misses two flips.</p>',
    ap:'<p><b>Question:</b> How does 2D parity locate an error?</p><ol><li>Turn on 2D parity for each message. Record the failing column and row, then fix the bit in one flip.</li><li>In Bits and numbers with Signed on, find the 8-bit patterns for 5, −5 and −128.</li><li>In Decimals, find a pair of decimals that add exactly (try 0.5 + 0.25) and one that does not.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain which decimals a computer can store exactly, using binary fractions as evidence.</p>'},
  terms:[{t:'Bit',d:'A single 0 or 1: one switch that is off or on.'},{t:'Byte',d:'8 bits. One byte can hold 256 values, 0 to 255.'},{t:'Binary',d:'Writing numbers with only 0 and 1. Each place is worth twice the one to its right.'},
    {t:'Overflow',d:'When a result is too big for the bits that store it, so it rolls over to a small number.'},{t:'Parity bit',d:'An extra bit that makes the count of 1s even, so a single flipped bit shows up.'},{t:'Pixel',d:'One dot of a picture, stored as red, green and blue amounts.'},
    {lvl:'honors',t:'Hexadecimal (hex)',d:'Base 16, digits 0–9 and A–F. One hex digit is 4 bits; two make a byte.'},{lvl:'honors',t:'ASCII',d:'The original code for 128 English characters, one byte each. “A” is 65.'},{lvl:'honors',t:'UTF-8',d:'The code used on the web for every language and emoji: 1 to 4 bytes per character, ASCII unchanged.'},{lvl:'honors',t:'Floating point',d:'How computers store decimals: a binary fraction times a power of 2, rounded to a fixed number of bits.'},
    {lvl:'ap',t:'Two’s complement',d:'The standard way to store negative integers: the top bit has negative weight. Negate by flipping all bits and adding 1.'},{lvl:'ap',t:'IEEE 754 double',d:'64 bits: 1 sign, 11 exponent, 52 fraction. About 15–17 significant decimal digits.'},{lvl:'ap',t:'2D parity',d:'Parity bits for every row and column of a block of data; one flipped bit is located where the failing row and column cross.'},{lvl:'ap',t:'KiB / MiB',d:'Powers of 2: 1 KiB = 1024 bytes, 1 MiB = 1024 KiB.'}],
  about:'<p>Every number here is computed in your browser. Text bytes come from the browser’s real UTF-8 encoder. Decimal sums use real 64-bit floating-point arithmetic, and the “exactly stored” values are worked out from the actual bits with whole-number math, so every digit shown is exact. The binary expansion of a typed decimal is found by exact doubling, which shows where it starts to repeat.</p><p>The messages use 8-bit ASCII with one even-parity bit per character, as early serial links and memory did. Real networks use stronger checks (CRCs and checksums) and real storage uses error-correcting codes; 2D parity is a simple version of the same idea. The parity bits themselves are assumed to arrive correctly. The picture is a tiny fictional 8 × 8 image with no compression. Comet Dash is a made-up game. People and teams in the messages are fictional.</p>',
  initVis(sim){},
  step(sim,dt){const st=sim.st;st.carryT=Math.max(0,st.carryT-dt);st.wrapT=Math.max(0,st.wrapT-dt);},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='case')drawCase(sim,ctx,k,t);else if(p.mode==='bits')drawBits(sim,ctx,k,t);else if(p.mode==='text')drawText(sim,ctx,k);else if(p.mode==='image')drawImage(sim,ctx,k);else if(p.mode==='overflow')drawOverflow(sim,ctx,k,t);else drawFloat(sim,ctx,k);},
  thumbSetup(sim){sim.p.parity=true;}
};
function scoreAdd(sim,n){const st=sim.st,w=W(sim);let r;if(sim.p.signed){const top=P2(w-1)-1,cur=signedOf(st.score,w);r={v:addScore(st.score,n,w).v,wrapped:cur+n>top};}else r=addScore(st.score,n,w);st.score=r.v;st.earned+=n;if(r.wrapped){st.wraps++;st.wrapT=1.6;}}
function floatPair(sim){const st=sim.st,a=parseFloat(st.fa),b=parseFloat(st.fb);if(!Number.isFinite(a)||!Number.isFinite(b))return null;const sum=a+b;
  // the true decimal sum, computed exactly from the typed digits
  const dec=s=>{const m=/^(\d*)\.?(\d*)$/.exec(s);return {i:m[1]||'0',f:m[2]||''};};const A=dec(st.fa),B=dec(st.fb),n=Math.max(A.f.length,B.f.length);
  const big=x=>BigInt(x.i+x.f.padEnd(n,'0'));const tot=big(A)+big(B),ts=tot.toString().padStart(n+1,'0');const exact=n?ts.slice(0,ts.length-n)+'.'+ts.slice(ts.length-n):ts;
  const exactSumNum=parseFloat(exact);const err=Math.abs(sum-exactSumNum);
  // size of the error: compare the exact stored sum with the exact decimal sum using BigInt at 60 places
  const toFix=s=>{s=s.replace('−','-');const neg=s[0]==='-';if(neg)s=s.slice(1);const [i,f='']=s.split('.');return (neg?-1n:1n)*BigInt(i+f.padEnd(80,'0').slice(0,80));};
  const diff=toFix(exactDec(sum))-toFix(exact);const ad=diff<0n?-diff:diff;let errText;
  if(ad===0n)errText='0 (exact)';else{const ds=ad.toString(),e=ds.length-81;errText=(ds[0]+(ds.length>1?'.'+ds.slice(1,3):''))+' × 10'+sup(e)+(diff>0n?' too big':' too small');}
  return {a,b,sum,exact,exactSumNum,err,errText};}

/* ---------- drawing ---------- */
function cellBox(ctx,x,y,w,h,on,col,label,k,o){o=o||{};rr(ctx,x+3,y+3,w-6,h-6,7);if(on){ctx.fillStyle=col||ON;ctx.fill();}else{ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=o.stroke||PAL['line'];ctx.lineWidth=1.5;ctx.stroke();}
  if(label!==undefined)mt(ctx,label,x+w/2,y+h/2+1,{s:(o.s||15)*k,w:700,c:on?'#fff':PAL['cv-soft'],a:'center',b:'middle'});}
function drawCase(sim,ctx,k,t){const p=sim.p,cs=sim.st.cs,C=CASES[cs.i],ap=atLeast('ap'),hon=atLeast('honors'),grid=p.grid&&ap,L=caseLayout(cs,grid);
  txt(ctx,'Received from '+C.from+':',16,30,{s:14*k,w:700,c:PAL['cv-soft']});
  const n=L.n,par=p.parity,failRows=grid?[...Array(8).keys()].filter(b=>rowFail(cs,b)):[];
  // highlight selected column
  const sx=L.x0+cs.sel*L.cw;rr(ctx,sx+1,L.yg-26,L.cw-2,L.yb+8*L.rh+(par?L.rh:0)-L.yg+30,8);ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2.5;ctx.stroke();
  // failing bit rows (2D parity) get a tinted band
  failRows.forEach(b=>{const y=L.yb+(7-b)*L.rh;ctx.fillStyle='rgba(198,40,40,.14)';ctx.fillRect(L.x0,y,L.cols*L.cw,L.rh);});
  for(let c=0;c<n;c++){const x=L.x0+c*L.cw,v=cs.rx[c],fail=par&&colFail(cs,c);
    if(fail){ctx.fillStyle='rgba(198,40,40,.14)';ctx.fillRect(x+1,L.yg-24,L.cw-2,L.yb+8*L.rh+L.rh-L.yg+24);}
    mt(ctx,glyph(v),x+L.cw/2,L.yg,{s:20*k,w:700,a:'center',b:'middle',c:fail?PAL['s1']:PAL['cv-ink']});
    for(let r=0;r<8;r++){const b=7-r,on=bitOf(v,b),y=L.yb+r*L.rh;cellBox(ctx,x,y,L.cw,L.rh+1,on,ON,String(on),k,{s:12});
      if(cs.touched[c+':'+b]){ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(x+L.cw-8,y+7,3.5,0,6.29);ctx.fill();}
      if(grid&&fail&&failRows.includes(b)){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+L.cw/2,y+L.rh/2,Math.min(L.cw,L.rh)/2+3,0,6.29);ctx.stroke();}}
    if(par){const pb=parBit(cs.orig[c]),y=L.yb+8*L.rh;cellBox(ctx,x,y,L.cw,L.rh+1,pb,PAR,String(pb),k,{s:12,stroke:PAR});
      mt(ctx,fail?'✗':'✓',x+L.cw/2,y+L.rh+12*k,{s:15*k,w:700,a:'center',b:'middle',c:fail?PAL['s1']:PAL['s3']});}}
  if(grid){const x=L.x0+n*L.cw;mt(ctx,'P',x+L.cw/2,L.yg,{s:18*k,w:700,a:'center',b:'middle',c:PAL['s5']});
    for(let r=0;r<8;r++){const b=7-r,pb=rowPar(cs.orig,b);cellBox(ctx,x,L.yb+r*L.rh,L.cw,L.rh+1,pb,PAR,String(pb),k,{s:12,stroke:PAR});}}
  // row labels: place values
  for(let r=0;r<8;r++)txt(ctx,String(P2(7-r)),L.x0-8,L.yb+r*L.rh+L.rh/2+1,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle',w:600});
  if(par)txt(ctx,hon?'parity':'check',L.x0-8,L.yb+8*L.rh+L.rh/2+1,{s:12*k,c:PAL['s5'],a:'right',b:'middle',w:700});
  // status
  const y0=par?L.yb+9*L.rh+28*k+13*k:L.yb+8*L.rh+24+13*k;let msg,bg;
  if(solved(cs)){msg='Fixed: “'+C.sent+'”';bg=GOOD;}else if(!par){msg=k>1.3?'Which letter changed?':'One bit flipped. Which character changed?';bg='#5d5d63';}
  else{const nf=nFail(cs);msg=nf?(nf+' character'+(nf>1?'s':'')+' fail'+(nf>1?'':'s')+' the check'):(cs.two?'Check passes, but two flips hid':'Every character passes');bg=nf?BAD:WARM;}
  pill(ctx,msg,400,y0,bg,'#fff',15*k);
  if(k<1.3)txt(ctx,'Click a bit to flip it. Orange dots mark bits you flipped.',400,442,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function drawBits(sim,ctx,k,t){const p=sim.p,st=sim.st,w=W(sim),L=bitsLayout(w),hon=atLeast('honors'),sg=p.signed&&atLeast('ap');
  for(let i=0;i<w;i++){const c=bitCell(L,w,i),on=bitOf(st.val,i);cellBox(ctx,c.x,c.y,c.w,c.h,on,sg&&i===w-1?'#b3261e':ON,String(on),k,{s:w===8?26:18});
    const lab=w===8?(sg&&i===7?'−128':String(P2(i))):((sg&&i===w-1?'−':'')+'2'+sup(i));txt(ctx,lab,c.x+c.w/2,c.y-8,{s:(w===8?14:12)*k,w:600,c:sg&&i===w-1?PAL['s1']:PAL['cv-soft'],a:'center'});}
  if(w>8){for(let r=0;r<L.rows;r++){const y=L.y0+r*(L.ch+L.gap)+L.ch/2;txt(ctx,'byte '+(L.rows-1-r),L.x0-10,y,{s:12*k,c:PAL['cv-soft'],a:'right',b:'middle',w:600});
      if(hon){const bv=Math.floor(st.val/P2(8*(L.rows-1-r)))%256;mt(ctx,hex(bv,8),L.x0+8*L.cw+12,y+1,{s:16*k,w:700,c:PAL['s5'],b:'middle'});}}}
  else if(hon){for(let g=0;g<2;g++){const x0=L.x0+g*4*L.cw+8,x1=x0+4*L.cw-16,y=L.y0+L.ch+12;ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0,y+8);ctx.lineTo(x1,y+8);ctx.lineTo(x1,y);ctx.stroke();
      const nib=Math.floor(st.val/P2(4*(1-g)))%16;mt(ctx,nib.toString(16).toUpperCase(),(x0+x1)/2,y+32,{s:20*k,w:700,c:PAL['s5'],a:'center',b:'middle'});}}
  // carry falling off the left end
  if(st.carryT>0){const c=bitCell(L,w,w-1),f=1-st.carryT/1.4;const x=c.x-18,y=c.y+c.h/2+f*f*50;ctx.globalAlpha=clamp(st.carryT/0.7,0,1);mt(ctx,'1',x,y,{s:22*k,w:800,c:PAL['s1'],a:'center',b:'middle'});pill(ctx,'The carry bit had no room: the value wrapped',400,36,PAL['s1'],'#fff',13*k);ctx.globalAlpha=1;}
  const v=shown(sim);
  if(w===8){const on=[];for(let i=7;i>=0;i--)if(bitOf(st.val,i))on.push((sg&&i===7?'−':'')+P2(i));let eq=on.length?on.join(' + ')+' = '+v:'all off = 0';
    let s=17*k;ctx.font='700 '+s+'px '+MONO;while(ctx.measureText(eq).width>760&&s>12*k){s-=1;ctx.font='700 '+s+'px '+MONO;}mt(ctx,eq,400,hon?310:276,{s,w:700,a:'center',b:'middle'});}
  const yR=w===8?(hon?378:350):Math.min(418,L.y0+L.rows*(L.ch+L.gap)+22);
  const items=[['Decimal',v.toLocaleString('en-US')],['Binary',w===8?grp(bin(st.val,w),4):null],[ 'Hex','0x'+hex(st.val,w)]].filter(a=>a[1]!==null&&(a[0]!=='Hex'||hon));
  if(k>1.3&&items.length>2)items.splice(1,1);const gap=800/(items.length+1);items.forEach((a,i)=>{pill(ctx,a[0]+'  '+a[1],gap*(i+1),yR,PAL['card2'],PAL['cv-ink'],16*k);});}
function drawText(sim,ctx,k){const st=sim.st,hon=atLeast('honors'),ch=[...st.text];const cw=Math.max(80,62*k),maxC=Math.floor(760/cw),shownC=ch.slice(0,maxC),x0=400-shownC.length*cw/2;
  if(!ch.length){txt(ctx,'Type some text in the panel below.',400,225,{s:16*k,c:PAL['cv-soft'],a:'center',b:'middle'});return;}
  shownC.forEach((c,i)=>{const x=x0+i*cw+cw/2,b=u8(c);rr(ctx,x-cw/2+4,62,cw-8,b.length>1?318:300,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=b.length>1?PAL['s4']:PAL['line'];ctx.lineWidth=b.length>1?2:1;ctx.stroke();
    txt(ctx,c===' '?'␣':c,x,104,{s:30*k,w:700,a:'center',b:'middle'});txt(ctx,hon?uplus(cpOf(c)):'code '+cpOf(c),x,142,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle',w:600});
    const bh=34*Math.min(k,1.25);b.forEach((v,j)=>{const y=162+j*(bh+4);cellBox(ctx,x-cw/2+8,y,cw-16,bh,true,ON,hon?hex(v,8):String(v),k,{s:15});});
    txt(ctx,b.length+(b.length>1?' bytes':' byte'),x,364,{s:12*k,w:700,c:b.length>1?PAL['s4']:PAL['cv-soft'],a:'center',b:'middle'});});
  const nb=ENC.encode(st.text).length;txt(ctx,(ch.length>maxC?'First '+maxC+' of '+ch.length+' characters. ':'')+ch.length+' character'+(ch.length>1?'s':'')+' → '+nb+' bytes = '+nb*8+' bits',400,416,{s:15*k,w:700,a:'center',b:'middle'});
  txt(ctx,hon?'UTF-8 bytes in hex':'UTF-8 bytes',400,36,{s:13*k,c:PAL['cv-soft'],a:'center',b:'middle',w:600});}
function drawImage(sim,ctx,k){const st=sim.st,hon=atLeast('honors');
  for(let i=0;i<64;i++){const x=40+(i%8)*40,y=60+Math.floor(i/8)*40,c=st.px[i];ctx.fillStyle='rgb('+c.join(',')+')';ctx.fillRect(x,y,40,40);}
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let i=0;i<=8;i++){ctx.beginPath();ctx.moveTo(40+i*40,60);ctx.lineTo(40+i*40,380);ctx.moveTo(40,60+i*40);ctx.lineTo(360,60+i*40);ctx.stroke();}
  const sx=40+(st.sel%8)*40,sy=60+Math.floor(st.sel/8)*40;ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.strokeRect(sx-1,sy-1,42,42);ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=1.5;ctx.strokeRect(sx+2,sy+2,36,36);
  txt(ctx,'8 × 8 picture: click a pixel',200,36,{s:13*k,c:PAL['cv-soft'],a:'center',b:'middle',w:600});
  const c=st.px[st.sel];ctx.fillStyle='rgb('+c.join(',')+')';rr(ctx,400,64,84,84,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  txt(ctx,'Pixel '+st.sel,500,90,{s:16*k,w:700,b:'middle'});if(hon)mt(ctx,rgbHex(c),500,124,{s:16*k,w:700,c:PAL['s5'],b:'middle'});
  const names=['Red','Green','Blue'],cols=['#d32f2f','#2e7d32','#1f5bbf'];
  names.forEach((nm,j)=>{const y=184+j*48,x0=470,wb=290;txt(ctx,nm,x0-10,y+10,{s:13*k,w:700,a:'right',b:'middle'});rr(ctx,x0,y,wb,22,6);ctx.fillStyle=PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    rr(ctx,x0,y,Math.max(6,wb*c[j]/255),22,6);ctx.fillStyle=cols[j];ctx.fill();const lab=String(c[j]);const inside=c[j]>150;txt(ctx,lab,inside?x0+wb*c[j]/255-8:x0+Math.max(6,wb*c[j]/255)+8,y+12,{s:13*k,w:700,c:inside?'#fff':PAL['cv-ink'],a:inside?'right':'left',b:'middle'});});
  txt(ctx,k>1.3?'64 × 3 = 192 bytes':'8 × 8 pixels × 3 bytes = 192 bytes',580,352,{s:15*k,w:700,a:'center',b:'middle'});txt(ctx,k>1.3?'1 byte per color':'Each color amount is one byte: 0 to 255',580,384,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle'});}
function drawOverflow(sim,ctx,k,t){const p=sim.p,st=sim.st,w=W(sim),sg=p.signed&&atLeast('ap'),M=P2(w);const cx=205,cy=248,R=132;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=16;ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.stroke();
  const ang=v=>-Math.PI/2+(v/M)*Math.PI*2;
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;for(let i=0;i<32;i++){const a=-Math.PI/2+i/32*Math.PI*2,r1=R-8,r2=R+(i%8===0?14:8);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();}
  const lab=v=>{const s=sg?signedOf(v,w):v;return s.toLocaleString('en-US');};
  [[0,'top'],[M/4,'right'],[M/2,'bottom'],[3*M/4,'left']].forEach(([v,pos])=>{const a=ang(v),r=R+30;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;txt(ctx,lab(v),x,y+(pos==='top'?-4:pos==='bottom'?6:0),{s:13*k,w:700,c:PAL['cv-soft'],a:pos==='right'?'left':pos==='left'?'right':'center',b:'middle'});});
  const wv=sg?M/2:0,wa=ang(wv);ctx.strokeStyle=PAL['s1'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx+Math.cos(wa)*(R-12),cy+Math.sin(wa)*(R-12));ctx.lineTo(cx+Math.cos(wa)*(R+12),cy+Math.sin(wa)*(R+12));ctx.stroke();
  txt(ctx,lab(wv-1+(sg?0:M)),cx-(sg?36:14),sg?cy+R+36:cy-R-30,{s:13*k,w:700,c:PAL['s1'],a:'right',b:'middle'});
  // arc filled up to the current score
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=16;ctx.beginPath();ctx.arc(cx,cy,R,-Math.PI/2,ang(st.score)+0.0001);ctx.stroke();
  const a=ang(st.score);ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*(R-26),cy+Math.sin(a)*(R-26));ctx.stroke();ctx.lineCap='butt';
  ctx.fillStyle=PAL['cv-ink'];ctx.beginPath();ctx.arc(cx,cy,7,0,6.29);ctx.fill();
  if(st.wrapT>0&&!RM){ctx.globalAlpha=clamp(st.wrapT/0.8,0,1);pill(ctx,'Rolled over!',cx,cy-34,PAL['s1'],'#fff',15*k);ctx.globalAlpha=1;}
  // scoreboard
  rr(ctx,392,52,394,152,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Comet Dash (fictional)',410,80,{s:14*k,w:700,c:PAL['cv-soft'],b:'middle'});
  txt(ctx,'Points earned',410,120,{s:14*k,b:'middle'});mt(ctx,st.earned.toLocaleString('en-US'),770,120,{s:18*k,w:700,a:'right',b:'middle'});
  const sv=sg?signedOf(st.score,w):st.score;const off=sv!==st.earned;
  txt(ctx,'Score shown',410,166,{s:14*k,w:700,b:'middle'});mt(ctx,sv.toLocaleString('en-US'),770,166,{s:24*k,w:800,a:'right',b:'middle',c:off?PAL['s1']:PAL['s3']});
  // the stored bits
  const rows=w/8,cw=44,ch=34;const by=228;for(let i=0;i<w;i++){const pos=w-1-i,r=Math.floor(pos/8),c=pos%8;const x=416+c*cw,y=by+r*(ch+6);if(r>3)continue;cellBox(ctx,x,y,cw,ch,bitOf(st.score,i),sg&&i===w-1?'#b3261e':ON,String(bitOf(st.score,i)),k,{s:14});}
  const yb=by+Math.min(rows,4)*(ch+6);
  if(st.wrapT>0){const f=1-st.wrapT/1.6;const x=400-f*30,y=by+ch/2+f*f*70;ctx.globalAlpha=clamp(st.wrapT/0.8,0,1);mt(ctx,'1',x,y,{s:22*k,w:800,c:PAL['s1'],a:'center',b:'middle'});ctx.globalAlpha=1;}
  if(yb+24<440)txt(ctx,w+' bits store the score',594,yb+18,{s:12*k,c:PAL['cv-soft'],a:'center',b:'middle'});}
function drawFloat(sim,ctx,k){const st=sim.st,ap=atLeast('ap'),f=floatPair(sim);
  if(!f){txt(ctx,'Type two decimals in the panel below.',400,225,{s:16*k,c:PAL['cv-soft'],a:'center',b:'middle'});return;}
  const head=st.fa+' + '+st.fb+' = '+f.sum;let s=24*k;ctx.font='700 '+s+'px '+MONO;while(ctx.measureText(head).width>760&&s>14*k){s--;ctx.font='700 '+s+'px '+MONO;}
  mt(ctx,head,400,44,{s,w:700,a:'center',b:'middle',c:f.sum===f.exactSumNum&&f.errText.startsWith('0')?PAL['s3']:PAL['s1']});
  const nd=k>1.3?20:34;const rows=[[st.fa+' is stored as',exactDec(f.a)],[st.fb+' is stored as',exactDec(f.b)],['the sum is stored as',exactDec(f.sum)],['the true sum is',f.exact]];
  rows.forEach((r,i)=>{const y=96+i*58;txt(ctx,r[0],40,y,{s:13*k,c:PAL['cv-soft'],b:'middle',w:600});mt(ctx,shortDec(r[1],nd),40,y+24,{s:16*k,w:700,b:'middle',c:i===3?PAL['s3']:PAL['cv-ink']});});
  const be=binExp(st.fa,40);if(be){const fr=be.d.slice(0,k>1.3?18:30);const s2=st.fa+' in binary = '+be.ip+'.'+(fr||'0')+(be.ends&&be.d.length<=fr.length?'':'…')+(be.rep>=0?' (repeats forever)':'');txt(ctx,s2,40,ap?346:360,{s:13*k,w:600,c:PAL['s5'],b:'middle'});}
  if(ap){const b=bits64(f.sum),x0=40,cw=11.5,y=380;for(let i=0;i<64;i++){const col=i===0?'#b3261e':i<12?'#7b3fe4':ON;if(b[i]==='1'){ctx.fillStyle=col;ctx.fillRect(x0+i*cw,y,cw-2,22);}else{ctx.strokeStyle=col;ctx.lineWidth=1;ctx.strokeRect(x0+i*cw+.5,y+.5,cw-3,21);}}
    txt(ctx,'sign',x0,y+40,{s:12*k,c:PAL['s1'],w:700,b:'middle'});txt(ctx,'exponent',x0+cw*1.5+20*k,y+40,{s:12*k,c:PAL['s5'],w:700,b:'middle'});txt(ctx,'52 fraction bits of the sum',x0+cw*12+130,y+40,{s:12*k,c:PAL['s2'],w:700,b:'middle'});}
  else txt(ctx,'Off by '+f.errText,400,410,{s:15*k,w:700,a:'center',b:'middle'});}
BIN.controls[0].onChange=syncMode;
BIN.onLevel=syncMode;
BioLab.register(BIN);
})();

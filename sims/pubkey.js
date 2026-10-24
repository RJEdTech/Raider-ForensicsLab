(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor,rng}=BioLab.h;
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,"DejaVu Sans Mono",monospace';
function mt(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||600)+' '+(o.s||13)+'px '+MONO;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MS='font-family:'+MONO.replace(/"/g,"'");
const ENC=new TextEncoder(),DEC=new TextDecoder('utf-8',{fatal:false});
/* ---------- SHA-256 (FIPS 180-4), checked against "abc", "" and the 448-bit test vector ---------- */
const SK=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
function sha256(bytes){if(typeof bytes==='string')bytes=ENC.encode(bytes);const l=bytes.length,nb=((l+9+63)>>6)<<6,m=new Uint8Array(nb);m.set(bytes);m[l]=0x80;const bl=l*8;for(let i=0;i<8;i++)m[nb-1-i]=Math.floor(bl/Math.pow(2,8*i))&255;
  const H=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64),r=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<nb;o+=64){for(let i=0;i<16;i++)w[i]=(m[o+4*i]<<24)|(m[o+4*i+1]<<16)|(m[o+4*i+2]<<8)|m[o+4*i+3];
    for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
    let [a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=r(e,6)^r(e,11)^r(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+SK[i]+w[i])|0,S0=r(a,2)^r(a,13)^r(a,22),mj=(a&b)^(a&c)^(b&c),t2=(S0+mj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
    H[0]+=a;H[1]+=b;H[2]+=c;H[3]+=d;H[4]+=e;H[5]+=f;H[6]+=g;H[7]+=h;}
  return [...H].map(x=>x.toString(16).padStart(8,'0')).join('');}
/* ---------- number theory with BigInt ---------- */
const MOD=(a,m)=>((a%m)+m)%m;
function mpow(b,e,m){b=MOD(b,m);let r=1n;while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return r;}
function inv(a,m){let r0=MOD(a,m),r1=m,s0=1n,s1=0n;while(r1){const q=r0/r1;[r0,r1]=[r1,r0-q*r1];[s0,s1]=[s1,s0-q*s1];}return r0===1n?MOD(s0,m):null;}
const gcd=(a,b)=>{while(b){[a,b]=[b,a%b];}return a;};
const bits=n=>n.toString(2).length;
const short=(n,len)=>{const s=String(n);return s.length>len?s.slice(0,len-1)+'…':s;};
/* symmetric cipher for the demo: XOR with a SHA-256 keystream derived from the shared key */
function keystream(key,len){let out=[];for(let c=0;out.length<len;c++){const h=sha256(String(key)+':'+c);for(let i=0;i<64;i+=2)out.push(parseInt(h.slice(i,i+2),16));}return out.slice(0,len);}
function encrypt(key,msg){const m=[...ENC.encode(msg)],k=keystream(key,m.length);return m.map((b,i)=>b^k[i]);}
function decrypt(key,c){const k=keystream(key,c.length);return DEC.decode(new Uint8Array(c.map((b,i)=>b^k[i])));}
const hexOf=a=>a.map(b=>b.toString(16).padStart(2,'0')).join('');
const readable=s=>/^[\x20-\x7e]*$/.test(s);
/* ---------- key sizes (all primes checked with Miller–Rabin; g is a primitive root) ---------- */
const DHP={p23:{p:23n,g:5n,l:'p = 23 (textbook)'},b8:{p:251n,g:6n,l:'8-bit prime'},b16:{p:65521n,g:17n,l:'16-bit prime'},b24:{p:16777213n,g:5n,l:'24-bit prime'},b32:{p:4294967291n,g:2n,l:'32-bit prime'},b40:{p:1099511627689n,g:13n,l:'40-bit prime'},b61:{p:2305843009213693951n,g:37n,l:'61-bit prime'}};
const RSAP={r1:{p:61n,q:53n,e:17n,l:'p = 61, q = 53 (textbook)'},r2:{p:251n,q:241n,e:7n,l:'p = 251, q = 241'},r3:{p:65521n,q:65519n,e:65537n,l:'16-bit primes'},r4:{p:1000003n,q:1000033n,e:65537n,l:'20-bit primes'},r5:{p:2147483647n,q:2147483629n,e:65537n,l:'31-bit primes'}};
function rsaKey(o){const n=o.p*o.q,phi=(o.p-1n)*(o.q-1n);let e=o.e;if(gcd(e,phi)!==1n)e=3n;while(gcd(e,phi)!==1n)e+=2n;return {p:o.p,q:o.q,n,phi,e,d:inv(e,phi)};}
const KAVA=rsaKey({p:2147483647n,q:2147483629n,e:65537n}),KEVE=rsaKey({p:2147483587n,q:2147483579n,e:65537n});
const KROOT=rsaKey({p:2147483563n,q:2147483549n,e:65537n}),KINT=rsaKey({p:2147483543n,q:2147483497n,e:65537n}),KSITE=rsaKey({p:1000037n,q:1000039n,e:65537n}),KFAKE=rsaKey({p:1000081n,q:1000099n,e:65537n});
const hnum=(s,n)=>MOD(BigInt('0x'+sha256(s)),n);
const sign=(s,K)=>mpow(hnum(s,K.n),K.d,K.n);
const verify=(s,sig,K)=>mpow(sig,K.e,K.n)===hnum(s,K.n);
/* ---------- paint mixing (geometric mean of reflectances, so the order does not matter) ---------- */
const PAINT={common:[250,214,60],ava:[214,48,49],ben:[40,104,214],eve:[60,170,90]};
function mix(...cs){return [0,1,2].map(i=>Math.round(Math.pow(cs.reduce((a,c)=>a*Math.max(c[i],8)/255,1),1/cs.length)*255));}
const css=c=>'rgb('+c.join(',')+')';
/* ---------- time formatting ---------- */
const SUPD='⁰¹²³⁴⁵⁶⁷⁸⁹';const sup=n=>String(n).split('').map(c=>c==='-'?'⁻':SUPD[+c]).join('');
function sciN(x){if(!Number.isFinite(x))return '∞';if(x<1e6)return Math.round(x).toLocaleString('en-US');const e=Math.floor(Math.log10(x)),m=x/Math.pow(10,e);return m.toFixed(1)+' × 10'+sup(e);}
function dur(sec){if(!Number.isFinite(sec))return 'forever';if(sec<1)return (sec*1000).toFixed(sec<0.01?2:0)+' ms';if(sec<120)return sec.toFixed(1)+' s';if(sec<7200)return (sec/60).toFixed(0)+' min';if(sec<172800)return (sec/3600).toFixed(1)+' hours';const y=sec/3.156e7;if(y<1)return (sec/86400).toFixed(0)+' days';
  if(y<1e6)return Math.round(y).toLocaleString('en-US')+' years';return sciN(y)+' years';}
const AGE_U=4.35e17;

/* ---------- Investigate: Ava, Ben and Eve ---------- */
const MSG='Study group: library, 4 pm Friday';
const SETUPS=[{v:0,l:'No encryption'},{v:1,l:'Send the key first'},{v:2,l:'Agree on a key (Diffie–Hellman)'},{v:3,l:'Eve in the middle, no certificate',lvl:'honors'},{v:4,l:'Eve in the middle, with HTTPS certificate',lvl:'honors'}];
const ITEMS=[['text','the words of the message'],['key','the secret key'],['meta','who is talking to whom, and when'],['len','how long the message is'],['change','change the message without anyone noticing']];
/* run each setup for real: what crosses the wire, and what Eve can actually do with it */
function runCase(setup,sim){const st=sim?sim.st:null,P=DHP.b61,R=rng(7+setup);const rnd=()=>2n+BigInt(Math.floor(R()*1e9))*BigInt(Math.floor(R()*1e9))%(P.p-3n);
  const wire=[],note=[],truth={text:false,key:false,meta:true,len:true,change:false};let benGot=MSG,stopped=false;
  note.push('Ava → Ben, Friday 3:58 pm, '+ENC.encode(MSG).length+'-byte message');
  if(setup===0){wire.push({l:'text',c:'#c27a00',d:'“'+MSG+'”'});note.push('Message: “'+MSG+'”');truth.text=true;truth.change=true;}
  else if(setup===1){const key=hexOf(keystream('ava-key-'+setup,8));const c=encrypt(key,MSG);wire.push({l:'key',c:'#b3261e',d:'key '+key});wire.push({l:'locked',c:'#3f5f7f',d:'locked '+hexOf(c).slice(0,24)+'…'});
    note.push('Key: '+key);note.push('Locked: '+hexOf(c).slice(0,32)+'…');const e=decrypt(key,c);note.push('Eve unlocks it with the key: “'+e+'”');truth.text=e===MSG;truth.key=true;truth.change=true;}
  else if(setup===2){const a=rnd(),b=rnd(),A=mpow(P.g,a,P.p),B=mpow(P.g,b,P.p),s=mpow(B,a,P.p),c=encrypt(s,MSG);wire.push({l:'A',c:'#0f8b8d',d:'A = '+A});wire.push({l:'B',c:'#0f8b8d',d:'B = '+B,back:true});wire.push({l:'locked',c:'#3f5f7f',d:'locked '+hexOf(c).slice(0,24)+'…'});
    note.push('Public: p = 2⁶¹ − 1, g = 37, A = '+short(A,12)+', B = '+short(B,12));note.push('Locked: '+hexOf(c).slice(0,32)+'…');
    const bf=bruteSync(P,A,30000);const guess=decrypt(mpow(A*B,1n,P.p),c);note.push('Tried '+bf.tries.toLocaleString('en-US')+' guesses for a: not found. Needs about '+sciN(Number(P.p)/2)+'.');
    note.push('Guessing the key from A × B gives junk, not words.');truth.text=readable(guess)&&guess===MSG;}
  else if(setup===3){const a=rnd(),b=rnd(),e1=rnd(),e2=rnd(),A=mpow(P.g,a,P.p),B=mpow(P.g,b,P.p),E1=mpow(P.g,e1,P.p),E2=mpow(P.g,e2,P.p);
    const kAva=mpow(E2,a,P.p),kEveA=mpow(A,e2,P.p),kBen=mpow(E1,b,P.p),kEveB=mpow(B,e1,P.p);const c1=encrypt(kAva,MSG);const read=decrypt(kEveA,c1);const changed=read.replace('4 pm','6 pm');const c2=encrypt(kEveB,changed);benGot=decrypt(kBen,c2);
    wire.push({l:'A',c:'#0f8b8d',d:'A (Eve keeps it, sends her own E₁ to Ben)',swap:'E₁'});wire.push({l:'B',c:'#0f8b8d',d:'B (Eve keeps it, sends her own E₂ to Ava)',swap:'E₂',back:true});wire.push({l:'locked',c:'#3f5f7f',d:'locked with Ava–Eve key; Eve re-locks it for Ben',swap:'locked'});
    note.push('Swapped A for E₁ and B for E₂: one key with Ava, another with Ben');note.push('Unlocked Ava’s message: “'+read+'”');note.push('Sent Ben: “'+benGot+'”. His key works, so he trusts it.');
    truth.text=read===MSG;truth.key=kEveA===kAva;truth.change=benGot!==MSG&&decrypt(kBen,c2)===benGot;}
  else{const a=rnd(),b=rnd(),e1=rnd(),A=mpow(P.g,a,P.p),B=mpow(P.g,b,P.p),E=mpow(P.g,e1,P.p);const sigB=sign(String(B),KAVA_SITE()),okReal=verify(String(B),sigB,KAVA_SITE());
    const okFake=verify(String(E),sigB,KAVA_SITE())||verify(String(E),sign(String(E),KEVE),KAVA_SITE());const s=mpow(B,a,P.p),c=encrypt(s,MSG);
    wire.push({l:'cert',c:'#7b3fe4',d:'Ben’s certificate + signed B',back:true});wire.push({l:'A',c:'#0f8b8d',d:'A = '+A});wire.push({l:'locked',c:'#3f5f7f',d:'locked '+hexOf(c).slice(0,24)+'…'});
    note.push('Tried swapping B for her own E: signature check '+(okFake?'passed':'FAILED')+', so Ava would stop');note.push('So Eve forwards it untouched. Locked: '+hexOf(c).slice(0,28)+'…');note.push('Still visible: Ava’s IP talks to Ben’s server, when, how many bytes');
    truth.text=false;truth.change=okFake;stopped=!okReal;}
  const L=ENC.encode(MSG).length,bytes=[L,8+L,16+L,16+L,96+16+L][setup];
  return {wire,note,truth,benGot,stopped,active:setup>=3,bytes};}
const KAVA_SITE=()=>KSITE;  // Ben's server key, vouched for by a certificate
function bruteSync(P,target,max){let cur=1n,x=0;const t0=performance.now();for(;x<max;x++){cur=cur*P.g%P.p;if(cur===target)return {found:x+1,tries:x+1,ms:performance.now()-t0};}return {found:null,tries:max,ms:performance.now()-t0};}

/* ---------- certificates for www.lunarlibrary.test (fictional CA) ---------- */
const TODAY='2026-10-24';
const CERTS={
  ok:{visit:'www.lunarlibrary.test',leaf:{sub:'www.lunarlibrary.test',from:'2026-02-01',to:'2027-02-01'}},
  expired:{visit:'www.lunarlibrary.test',leaf:{sub:'www.lunarlibrary.test',from:'2025-09-01',to:'2026-09-01'}},
  name:{visit:'www.lunarlibrary.test',leaf:{sub:'www.lunar-library.test',from:'2026-02-01',to:'2027-02-01'}},
  untrusted:{visit:'www.lunarlibrary.test',leaf:{sub:'www.lunarlibrary.test',from:'2026-02-01',to:'2027-02-01'},selfRoot:true},
  tampered:{visit:'www.lunarlibrary.test',leaf:{sub:'www.lunarlibrary.test',from:'2026-02-01',to:'2027-02-01'},tamper:true},
  phish:{visit:'lunarlibrary-login.test',leaf:{sub:'lunarlibrary-login.test',from:'2026-10-01',to:'2027-01-01'}}};
function buildChain(sel){const C=CERTS[sel]||CERTS.ok;const rootName=C.selfRoot?'Totally Real Root CA (fictional)':'Granite Root CA (fictional)';
  const root={sub:rootName,iss:rootName,from:'2020-01-01',to:'2035-01-01',key:KROOT};const mid={sub:'Granite Issuing CA 2 (fictional)',iss:rootName,from:'2024-01-01',to:'2029-01-01',key:KINT};
  const leaf={sub:C.leaf.sub,iss:mid.sub,from:C.leaf.from,to:C.leaf.to,key:KSITE};
  const body=c=>c.sub+'|'+c.iss+'|'+c.from+'|'+c.to+'|'+c.key.n+','+c.key.e;
  root.sig=sign(body(root),KROOT);mid.sig=sign(body(mid),KROOT);leaf.sig=sign(body(leaf),KINT);
  if(C.tamper)leaf.key=KFAKE;   // Eve swapped in her own public key after the CA signed it
  const chk={sigLeaf:verify(body(leaf),leaf.sig,mid.key),sigMid:verify(body(mid),mid.sig,root.key),sigRoot:verify(body(root),root.sig,root.key),
    dates:[root,mid,leaf].every(c=>c.from<=TODAY&&TODAY<=c.to),name:leaf.sub===C.visit,trusted:rootName==='Granite Root CA (fictional)'};
  chk.sigs=chk.sigLeaf&&chk.sigMid&&chk.sigRoot;chk.ok=chk.sigs&&chk.dates&&chk.name&&chk.trusted;
  return {C,root,mid,leaf,chk};}

/* ---------- mode visibility ---------- */
function syncMode(sim){if(!atLeast('honors')&&sim.p.mode==='rsa')BioLab.setValues(sim,{mode:'case'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});sim.infoDirty=true;}
function startCase(sim){const st=sim.st;st.run=runCase(clamp(Math.round(+sim.p.setup)||0,0,4),sim);st.ct=0;st.ans=null;st.picks={};}
function newDH(sim){const st=sim.st,P=DHP[sim.p.dhp]||DHP.p23;if(sim.p.dhp==='p23'&&!st.dhRe){st.a=6n;st.b=15n;}else{const R=st.r;const span=P.p-3n;st.a=2n+BigInt(Math.floor(R()*1e15))%span;st.b=2n+BigInt(Math.floor(R()*1e15))%span;}st.dhT=0;st.eve=null;}
function startEve(sim){const st=sim.st,P=DHP[sim.p.dhp]||DHP.p23;st.eve={target:mpow(P.g,st.a,P.p),cur:1n,tries:0,found:null,ms:0,max:3e7,done:false,bits:bits(P.p)};}
function startFactor(sim){const st=sim.st,K=rsaKey(RSAP[sim.p.rsap]||RSAP.r1);st.fac={n:K.n,d:2n,tries:0,found:null,ms:0,max:1e7,done:false,bits:bits(K.n)};}

const PK={
  id:'pubkey',hash:'pubkey',apUnit:20,order:1,prereq:['binary'],next:['hashing','passwords','phishing'],tab:'Public-key crypto and HTTPS',kind:'Simulation',
  card:'Find out what an eavesdropper can learn as Ava and Ben agree on a secret key, sign messages, and check a site’s certificate.',
  title:'Public-key cryptography and HTTPS',
  lede:{bio:'Ava wants to send Ben a private message, but Eve can copy everything on the line. Try different ways of sending it and find out what Eve learns each time.',
        honors:'See how Diffie–Hellman lets two strangers agree on a key in public, how RSA and digital signatures work, and what an HTTPS certificate does and does not prove.',
        ap:'Do the real modular arithmetic: gᵃ mod p, RSA key generation with φ(n) and modular inverses, and how fast brute force and factoring grow with key size.'},
  scale:{bio:'Toy keys a few digits long, so you can watch the math. Real HTTPS keys are hundreds of digits long.',ap:'Keys here are 5 to 62 bits. Real RSA keys are 2048–4096 bits; real elliptic-curve keys are 256 bits (about as strong as 3072-bit RSA).'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Explore',type:'seg',def:'case',noTrial:true,options:[{v:'case',l:'Investigate'},{v:'dh',l:'Agree on a key'},{v:'rsa',l:'RSA',lvl:'honors'},{v:'sign',l:'Signatures'},{v:'cert',l:'HTTPS certificate'}]},
    {id:'setup',label:'How Ava sends it',type:'select',def:0,modes:['case'],options:SETUPS,onChange(sim){startCase(sim);}},
    {id:'dhp',label:'Size of the prime p',type:'select',def:'p23',modes:['dh'],options:[{v:'p23',l:DHP.p23.l},{v:'b8',l:DHP.b8.l,lvl:'honors'},{v:'b16',l:DHP.b16.l,lvl:'honors'},{v:'b24',l:DHP.b24.l,lvl:'ap'},{v:'b32',l:DHP.b32.l,lvl:'ap'},{v:'b40',l:DHP.b40.l,lvl:'ap'},{v:'b61',l:DHP.b61.l,lvl:'ap'}],onChange(sim){sim.st.dhRe=false;newDH(sim);}},
    {id:'rsap',label:'Ben’s primes',type:'select',def:'r1',modes:['rsa'],options:Object.keys(RSAP).map((k,i)=>({v:k,l:RSAP[k].l,lvl:i>1?'ap':undefined})),onChange(sim){sim.st.fac=null;const K=rsaKey(RSAP[sim.p.rsap]||RSAP.r1);if(BigInt(sim.st.m)>=K.n)sim.st.m=65;sim.st.sent=0;}},
    {id:'tamper',label:'What Eve does',type:'seg',def:'none',modes:['sign'],options:[{v:'none',l:'Nothing'},{v:'edit',l:'Changes the message'},{v:'forge',l:'Signs her own version'}]},
    {id:'cert',label:'Certificate you get',type:'select',def:'ok',modes:['cert'],options:[{v:'ok',l:'The real site'},{v:'expired',l:'Expired certificate'},{v:'name',l:'Name doesn’t match'},{v:'untrusted',l:'Unknown certificate authority'},{v:'tampered',l:'Edited after signing',lvl:'honors'},{v:'phish',l:'Look-alike site with its own certificate',lvl:'honors'}]}
  ],
  actions:[
    {id:'send',label:'Send the message',primary:true,modes:['case'],run(sim){startCase(sim);}},
    {id:'dhrun',label:'Run the exchange',primary:true,modes:['dh'],run(sim){sim.st.dhT=0;sim.st.eve=null;}},
    {id:'dhnew',label:'New secrets',modes:['dh'],run(sim){sim.st.dhRe=true;newDH(sim);}},
    {id:'eve',label:'Eve tries every exponent',lvl:'honors',modes:['dh'],run(sim){sim.st.dhT=9;startEve(sim);}},
    {id:'rsend',label:'Encrypt and send',primary:true,modes:['rsa'],run(sim){sim.st.sent=0.001;}},
    {id:'fac',label:'Eve tries to factor n',modes:['rsa'],run(sim){startFactor(sim);}}
  ],
  init(sim){const st={r:rng(424242),run:null,ct:0,ans:null,picks:{},solved:{},a:6n,b:15n,dhT:0,eve:null,dhRe:false,runs:[],m:65,sent:0,fac:null,smsg:'Club dues: $5 by Friday. – Ava (treasurer)'};sim.st=st;newDH(sim);startCase(sim);return st;},
  step(sim,dt){const st=sim.st,p=sim.p;dt=Math.max(0,dt||0);
    if(p.mode==='case'&&st.run)st.ct+=dt;
    if(p.mode==='dh'){if(st.dhT<9)st.dhT+=dt;const E=st.eve;if(E&&!E.done){const P=DHP[p.dhp]||DHP.p23;const t0=performance.now();let n=0;
        while(E.tries<E.max){E.cur=E.cur*P.g%P.p;E.tries++;n++;if(E.cur===E.target){E.found=E.tries;break;}if((n&1023)===0&&performance.now()-t0>12)break;}E.ms+=performance.now()-t0;
        if(E.found||E.tries>=E.max){E.done=true;st.runs.push({kind:'dh',bits:E.bits,sec:E.found?E.ms/1000:null,rate:E.tries/Math.max(E.ms,0.01)*1000});sim.infoDirty=true;}}}
    if(p.mode==='rsa'){if(st.sent>0&&st.sent<1.6)st.sent+=dt;const F=st.fac;if(F&&!F.done){const t0=performance.now();let n=0;while(F.tries<F.max){const d=F.d;F.tries++;n++;if(F.n%d===0n){F.found=d;break;}F.d+=d===2n?1n:2n;if(F.d*F.d>F.n){F.found=F.n;break;}if((n&1023)===0&&performance.now()-t0>12)break;}F.ms+=performance.now()-t0;
        if(F.found||F.tries>=F.max){F.done=true;st.runs.push({kind:'rsa',bits:F.bits,sec:F.found?F.ms/1000:null,rate:F.tries/Math.max(F.ms,0.01)*1000});sim.infoDirty=true;}}}},
  metrics:[
    {id:'solved',label:'Setups you got right',d:0,modes:['case'],get:s=>Object.keys(s.st.solved).length},
    {id:'eveB',label:'Bytes Eve copied',d:0,modes:['case'],get:s=>{const r=s.st.run;return r?r.bytes:0;}},
    {id:'keyS',label:'Shared key (both sides)',lvl:'honors',text:true,modes:['dh'],get:s=>{const P=DHP[s.p.dhp]||DHP.p23,A=mpow(P.g,s.st.a,P.p),B=mpow(P.g,s.st.b,P.p),k1=mpow(B,s.st.a,P.p),k2=mpow(A,s.st.b,P.p);return short(k1,14)+(k1===k2?' = ':' ≠ ')+short(k2,14);}},
    {id:'tries',label:'Eve’s guesses',d:0,lvl:'honors',modes:['dh'],get:s=>s.st.eve?s.st.eve.tries:0},
    {id:'eveT',label:'Eve would need about',lvl:'honors',text:true,modes:['dh'],get:s=>{const P=DHP[s.p.dhp]||DHP.p23;return dur(Number(P.p)/2/rateOf(s,'dh'));}},
    {id:'nb',label:'Size of n',unit:'bits',d:0,modes:['rsa'],get:s=>bits(rsaKey(RSAP[s.p.rsap]||RSAP.r1).n)},
    {id:'dec',label:'Ben decrypts',text:true,modes:['rsa'],get:s=>{const K=rsaKey(RSAP[s.p.rsap]||RSAP.r1),m=BigInt(s.st.m),c=mpow(m,K.e,K.n);return 'm = '+mpow(c,K.d,K.n);}},
    {id:'facT',label:'Eve’s factoring tries',d:0,modes:['rsa'],get:s=>s.st.fac?s.st.fac.tries:0},
    {id:'ver',label:'Ben’s check',text:true,modes:['sign'],get:s=>signState(s).ok?'Valid: from Ava, unchanged':'Invalid: do not trust it'},
    {id:'pad',label:'Browser shows',text:true,modes:['cert'],get:s=>buildChain(s.p.cert).chk.ok?'Padlock (secure connection)':'Warning: not secure'},
    {id:'nfail',label:'Checks failed',d:0,modes:['cert'],get:s=>{const c=buildChain(s.p.cert).chk;return [c.sigs,c.dates,c.name,c.trusted].filter(x=>!x).length;}}
  ],
  graphs:[{id:'crack',label:'How long Eve needs vs key size',lvl:'honors',custom:true}],defaultGraph:'crack',
  plot(sim,ctx,box){const st=sim.st,rsa=sim.p.mode==='rsa';const rate=rateOf(sim,rsa?'rsa':'dh');
    const xmax=rsa?128:64;const f=b=>rsa?Math.log10(Math.pow(2,b/2)/2/rate):Math.log10(Math.pow(2,b-1)/rate);
    const ax=axes(ctx,box,{xmin:0,xmax,ymin:-6,ymax:27,xl:rsa?'Size of n (bits)':'Size of the prime p (bits)',yl:'log₁₀(seconds)'});
    [[0,'1 second'],[7.5,'1 year'],[Math.log10(AGE_U),'age of the universe']].forEach(([y,l])=>{ctx.strokeStyle=PAL['g-grid'];ctx.setLineDash([3,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(y));ctx.lineTo(ax.X(xmax),ax.Y(y));ctx.stroke();ctx.setLineDash([]);txt(ctx,l,ax.X(xmax)-4,ax.Y(y)-5,{s:12,c:PAL['muted'],a:'right'});});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();for(let b=2;b<=xmax;b++){const y=f(b);b===2?ctx.moveTo(ax.X(b),ax.Y(y)):ctx.lineTo(ax.X(b),ax.Y(y));}ctx.stroke();
    st.runs.filter(r=>r.kind===(rsa?'rsa':'dh')).forEach(r=>{ctx.fillStyle=r.sec!==null?serColor(1):serColor(3);const y=r.sec!==null?Math.log10(Math.max(r.sec,1e-6)):f(r.bits);ctx.beginPath();ctx.arc(ax.X(r.bits),ax.Y(y),6,0,6.29);ctx.fill();});
    const cb=rsa?bits(rsaKey(RSAP[sim.p.rsap]||RSAP.r1).n):bits((DHP[sim.p.dhp]||DHP.p23).p);ctx.strokeStyle=serColor(2);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(cb),box.T);ctx.lineTo(ax.X(cb),box.T+box.H);ctx.stroke();ctx.restore();
    legend(ctx,box.L+10,box.T+10,[{label:'brute force at your speed',color:serColor(0)},{label:'Eve’s runs',color:serColor(1)},{label:'your key',color:serColor(2)}]);},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const r=st.run,s=clamp(Math.round(+p.setup)||0,0,4);if(!r)return '';const shown=Math.min(r.wire.length,Math.floor(st.ct/1.1));
      if(shown<r.wire.length)return 'Everything Ava and Ben send crosses a line Eve can copy. <b>Watch what she writes in her notebook.</b>';
      return ['<b>No encryption:</b> Eve reads every word. Anyone on the path (Wi-Fi, a router) can.','<b>Eve copied the key</b> as it went by, so the lock does nothing. The hard part of encryption is sharing the key.','<b>Eve sees only public numbers and locked bytes.</b> Turning A back into Ava’s secret a would take her about '+sciN(Number(DHP.b61.p)/2)+' guesses.','<b>Eve sat in the middle</b> and made a separate key with each of them. Both locks work, so neither notices she read and changed the message.','<b>Ben’s certificate proves the key is really his,</b> so Eve’s swap is caught. She still sees who is talking, when and how much.'][s]+' Then check your answer below.';}
    if(p.mode==='dh'){const P=DHP[p.dhp]||DHP.p23,E=st.eve;if(E&&!E.done)return 'Eve is trying a = 1, 2, 3… and checking whether g to that power gives A. <b>'+E.tries.toLocaleString('en-US')+' tries so far.</b>';
      if(E&&E.done)return E.found?'<b>Eve found Ava’s secret after '+E.found.toLocaleString('en-US')+' tries</b> ('+dur(E.ms/1000)+'). With a prime this small, the math does not protect anything.':'Eve gave up after '+E.tries.toLocaleString('en-US')+' tries. At this speed she needs about <b>'+dur(Number(P.p)/2/rateOf(sim,'dh'))+'</b>. Every extra bit doubles her work.';
      return hon?'Ava and Ben each keep a secret exponent and send only gᵃ mod p and gᵇ mod p. <b>Each raises the other’s number to their own secret</b> and both get the same key; Eve has no easy way to undo the powers.':'Each mixes the common paint with a secret color and sends the mix. <b>Adding your own secret to the other mix gives both the same final color.</b> Eve sees the mixes but can’t un-mix paint.';}
    if(p.mode==='rsa'){const K=rsaKey(RSAP[p.rsap]||RSAP.r1),F=st.fac;if(F&&!F.done)return 'Eve divides n by 2, 3, 5, 7… looking for a factor. <b>'+F.tries.toLocaleString('en-US')+' tries so far.</b>';
      if(F&&F.done)return F.found&&F.found!==F.n?'<b>Eve factored n = '+F.found+' × '+(F.n/F.found)+'.</b> Now she can compute d and read everything. Small primes give no protection.':'Eve stopped after '+F.tries.toLocaleString('en-US')+' tries. Factoring a 2048-bit n is far beyond any computer today.';
      return 'Anyone can lock a message with Ben’s <b>public key (n, e)</b>, but only his <b>private key d</b> unlocks it. Finding d means factoring n, which is easy for small n and impossibly slow for big n.';}
    if(p.mode==='sign'){const S=signState(sim);return S.ok?'Ben hashes the message he got and undoes the signature with Ava’s public key. <b>The two match, so it came from Ava and was not changed.</b>':(p.tamper==='forge'?'Eve signed her version with her own private key. <b>It does not match Ava’s public key</b>, so Ben knows it isn’t from Ava.':'Changing even one character changes the hash completely, <b>so the signature no longer matches</b>. Ben knows the message was altered.');}
    const B=buildChain(p.cert),c=B.chk;if(p.cert==='phish')return '<b>Padlock, but the wrong site.</b> lunarlibrary-login.test got a real certificate for its own name. The padlock only proves your connection is encrypted to that name, not that the site is honest.';
    return c.ok?'Every certificate’s signature checks out, the dates are good, the name matches and the chain ends at a root your browser trusts. <b>So the browser shows a padlock.</b>':'<b>The browser warns you</b> because '+(!c.sigs?'a signature does not match: something was changed after signing.':!c.dates?'the certificate is out of date.':!c.name?'the certificate is for a different name than the address you typed.':'the chain ends at an authority your browser does not trust.');},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');let h='';
    if(p.mode==='case'){const r=st.run,s=clamp(Math.round(+p.setup)||0,0,4);const items=ITEMS.filter(i=>i[0]!=='change'||r.active);
      h+='<div class="p-head"><h3>What can Eve learn?</h3></div><p>Setup: <b>'+esc(SETUPS[s].l)+'</b>. Watch the send, read Eve’s notebook, then tick everything Eve can learn or do.</p>';
      h+='<div style="display:flex;flex-direction:column;gap:6px;margin:6px 0 10px">'+items.map(i=>'<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-it="'+i[0]+'"'+(st.picks[i[0]]?' checked':'')+'> Eve can '+(i[0]==='change'?'':'learn ')+esc(i[1])+'</label>').join('')+'</div><button type="button" class="btn primary" id="pubkey-chk">Check my answer</button>';
      if(st.ans){h+='<p class="verdict '+(st.ans.ok?'ok':'no')+'" style="margin-top:8px">'+(st.ans.ok?'Correct.':'Not quite.')+'</p><ul style="padding-left:18px;margin:0">'+st.ans.lines.map(l=>'<li>'+l+'</li>').join('')+'</ul>';}
      if(hon)h+='<p style="margin-top:8px">Every lock in this tool is computed for real: the message is XORed with a SHA-256 keystream made from the shared key, and Eve’s attempts are real tries in your browser.</p>';return h;}
    if(p.mode==='dh'){const P=DHP[p.dhp]||DHP.p23,A=mpow(P.g,st.a,P.p),B=mpow(P.g,st.b,P.p),k=mpow(B,st.a,P.p);h+='<div class="p-head"><h3>'+(hon?'The math behind the paint':'Paint mixing')+'</h3></div>';
      if(!hon)return h+'<p>The <b>common paint</b> is public. Ava and Ben each add a <b>secret color</b> and swap the mixes in public. Each adds their own secret to the mix they received. Both end with the same color, but Eve, who saw only the common paint and the two mixes, cannot separate them.</p><p>In real life the “paint” is a math operation that is easy to do and very hard to undo.</p>';
      h+='<table style="width:100%;font-size:14px"><tbody>'+[['Public prime p',P.p],['Public base g',P.g],['Ava’s secret a',st.a],['Ben’s secret b',st.b],['A = gᵃ mod p (sent)',A],['B = gᵇ mod p (sent)',B],['Ava computes Bᵃ mod p',k],['Ben computes Aᵇ mod p',mpow(A,st.b,P.p)]].map(r=>'<tr><td style="text-align:left;white-space:normal">'+r[0]+'</td><td style="'+MS+';word-break:break-all;white-space:normal">'+r[1]+'</td></tr>').join('')+'</tbody></table>';
      if(ap)h+='<p style="margin-top:8px">Both get g<sup>ab</sup> mod p, because (g<sup>b</sup>)<sup>a</sup> = (g<sup>a</sup>)<sup>b</sup>. Eve knows g, p, A and B. Finding a from A is the <b>discrete logarithm problem</b>. Brute force needs about p/2 tries; the best known methods are faster but still hopeless for the 2048-bit primes (or 256-bit elliptic curves) real HTTPS uses.</p>';
      else h+='<p style="margin-top:8px">Press <b>Eve tries every exponent</b> and change the size of p to see how fast her job grows.</p>';return h;}
    if(p.mode==='rsa'){const K=rsaKey(RSAP[p.rsap]||RSAP.r1),m=BigInt(st.m),c=mpow(m,K.e,K.n);h+='<div class="p-head"><h3>RSA step by step</h3></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px"><label for="pubkey-m" style="font-weight:600">Ava’s number m</label><input id="pubkey-m" class="sel" inputmode="numeric" autocomplete="off" style="flex:1 1 100px;min-width:0;max-width:200px;font-size:16px;padding:6px 10px" value="'+st.m+'"><button type="button" class="btn primary" id="pubkey-mset">Use it</button></div>'+(st.merr?'<p class="verdict no">'+esc(st.merr)+'</p>':'');
      const rows=[['1. Ben picks secret primes p, q',K.p+', '+K.q],['2. n = p × q (public)',K.n],['3. φ(n) = (p − 1)(q − 1) (secret)',K.phi],['4. e (public), with gcd(e, φ) = 1',K.e],['5. d = e⁻¹ mod φ(n) (secret)',K.d],['Ava: c = mᵉ mod n',c],['Ben: m = cᵈ mod n',mpow(c,K.d,K.n)]].filter((r,i)=>ap||[1,3,5,6].includes(i));
      h+='<table style="width:100%;font-size:14px"><tbody>'+rows.map(r=>'<tr><td style="text-align:left;white-space:normal">'+r[0]+'</td><td style="'+MS+';word-break:break-all;white-space:normal">'+r[1]+'</td></tr>').join('')+'</tbody></table>';
      if(ap)h+='<p style="margin-top:8px">Check: e × d mod φ(n) = '+(K.e*K.d%K.phi)+'. Real RSA also pads the message with random bytes, so the same m never encrypts to the same c twice.</p>';return h;}
    if(p.mode==='sign'){const S=signState(sim);h+='<div class="p-head"><h3>Ava’s signed message</h3></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px"><label for="pubkey-s" style="font-weight:600">Message</label><input id="pubkey-s" class="sel" maxlength="60" autocomplete="off" style="flex:1 1 180px;min-width:0;font-size:15px;padding:6px 10px" value="'+esc(st.smsg)+'"><button type="button" class="btn primary" id="pubkey-sset">Sign it</button></div>';
      h+='<p>Sent: “'+esc(st.smsg)+'”<br>Ben got: “'+esc(S.got)+'”</p>';
      if(hon)h+='<p style="'+MS+';font-size:13px;word-break:break-all">SHA-256 sent: '+sha256(st.smsg)+'<br>SHA-256 got: '+sha256(S.got)+'</p>';
      if(ap)h+='<p style="'+MS+';font-size:13px;word-break:break-all">h = hash mod n = '+S.h+'<br>s = hᵈ mod n = '+S.sig+'<br>Ben: sᵉ mod n = '+S.back+' vs hash of what he got mod n = '+S.h2+'</p>';
      h+='<p>A signature proves <b>who</b> sent a message and that it was <b>not changed</b>. It does not hide the message: anyone can read it.</p>';return h;}
    const B=buildChain(p.cert),c=B.chk;h+='<div class="p-head"><h3>What the browser checks</h3></div><ul style="padding-left:18px;margin:0 0 8px">'+
      [[c.sigs,'Each certificate is signed by the one above it'],[c.dates,'Every certificate is in date (today is '+TODAY+' in this scenario)'],[c.name,'The name on the site’s certificate matches the address bar'],[c.trusted,'The chain ends at a root authority the browser already trusts']].map(x=>'<li>'+(x[0]?'✓ ':'✗ ')+x[1]+'</li>').join('')+'</ul>';
    h+='<p><b>The padlock promises:</b> your connection is encrypted, and the server holds the private key for a certificate issued for that exact name. <b>It does not promise</b> the site is honest, safe or the one you meant: scam sites can get padlocks too.</p>';
    if(ap)h+='<p style="'+MS+';font-size:13px;word-break:break-all">Leaf signature check: sᵉ mod n(issuer) '+(c.sigLeaf?'=':'≠')+' SHA-256(certificate) mod n(issuer)</p>';return h;},
  bindInfo(sim,el){const st=sim.st;
    const chk=el.querySelector('#pubkey-chk');if(chk){el.querySelectorAll('[data-it]').forEach(b=>b.addEventListener('change',()=>{st.picks[b.dataset.it]=b.checked;}));chk.addEventListener('click',()=>{gradeCase(sim);BioLab.refresh(sim);});}
    const mi=el.querySelector('#pubkey-m');if(mi){const go=()=>{const K=rsaKey(RSAP[sim.p.rsap]||RSAP.r1);const v=mi.value.trim();if(!/^\d{1,20}$/.test(v)||BigInt(v)>=K.n||BigInt(v)<2n){st.merr='Use a whole number from 2 to '+(K.n-1n)+'.';}else{st.merr='';st.m=v;st.sent=0.001;}BioLab.refresh(sim);};el.querySelector('#pubkey-mset').addEventListener('click',go);mi.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});}
    const si=el.querySelector('#pubkey-s');if(si){const go=()=>{st.smsg=si.value.slice(0,60)||'(empty)';BioLab.refresh(sim);};el.querySelector('#pubkey-sset').addEventListener('click',go);si.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});}},
  tour:[
    {title:'The problem',text:'Ava wants to send Ben a message, but every message crosses a line Eve can copy. With no encryption, Eve reads it all.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{mode:'case',setup:0});}},
    {title:'Sharing a key out loud fails',text:'If Ava locks the message but sends the key first, Eve copies the key too. The real problem is agreeing on a key when someone is listening.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{setup:1});}},
    {title:'Mixing paint in public',text:{bio:'Ava and Ben each mix a secret color into the common paint and swap the mixes. Each adds their own secret again, and both get the same final color. Eve can’t un-mix paint.',honors:'Diffie–Hellman: each sends g raised to a secret power, mod p. Raising the other’s number to your own secret gives both sides gᵃᵇ mod p.'},focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'dh',dhp:'p23'});}},
    {lvl:'honors',title:'Small keys break',text:'Eve can try every exponent. With p = 23 she finds Ava’s secret instantly. Each extra bit doubles her work; real keys make it take longer than the age of the universe.',focus:[250,320,300,130],speed:1,setup(sim){BioLab.setValues(sim,{dhp:'b16'});sim.st.dhT=9;startEve(sim);}},
    {lvl:'honors',title:'A lock anyone can close',text:'RSA: Ben publishes n and e. Anyone can lock a number with them, but only Ben’s private d unlocks it. Finding d means factoring n.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{mode:'rsa',rsap:'r1'});sim.st.sent=0.001;}},
    {title:'Signatures catch tampering',text:'Ava signs her message with her private key. Eve changes $5 to $9, and Ben’s check fails because the message no longer matches the signature.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{mode:'sign',tamper:'edit'});}},
    {title:'What the padlock means',text:'A site proves its key with a certificate signed by an authority your browser trusts. The padlock means encrypted and the right name, not that the site is honest.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{mode:'cert',cert:'ok'});}},
    {lvl:'ap',title:'Eve in the middle',text:'Without certificates, Eve can run Diffie–Hellman separately with Ava and with Ben, reading and changing everything. Certificates and signatures are what stop this.',focus:[0,40,800,410],speed:1,setup(sim){BioLab.setValues(sim,{mode:'case',setup:3});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case',setup:0,tamper:'none',cert:'ok',dhp:'p23',rsap:'r1'});},
  onChallenge(sim,ch,phase){if(ch&&phase==='done'){if(ch.set)BioLab.setValues(sim,ch.set);if(ch.act)ch.act(sim);BioLab.refresh(sim);}},
  challenges(){const r1=runCase(1),r3=runCase(3),P=DHP.p23,A=mpow(P.g,6n,P.p),B=mpow(P.g,15n,P.p),s=mpow(B,6n,P.p),K=rsaKey(RSAP.r1);
    const tam=sigCheck('Club dues: $5 by Friday. – Ava (treasurer)','edit');
    return [
    {lvl:'bio',instant:true,q:'Ava sends her message with no encryption. What can Eve learn?',choices:['Nothing, it’s too fast to catch','Only who sent it','Everything: the words, who sent it, and when'],correct:2,set:{mode:'case',setup:0},
     explain:'Eve’s notebook now shows the whole message. On shared Wi-Fi or any router on the path, unencrypted data is readable by anyone who looks.'},
    {lvl:'bio',instant:true,q:'Ava sends a secret key first, then the locked message. Can Eve read it?',choices:['No, it’s locked','Yes, she copied the key too','Only if she guesses the key'],correct:1,set:{mode:'case',setup:1},
     explain:'Eve’s notebook shows she unlocked it: “'+r1.note[3].split('“')[1]+' A lock is only as safe as its key, so the key must never cross the line where Eve can see it.'},
    {lvl:'bio',instant:true,q:'In the paint demo, Eve sees the common paint and both mixes. Why can’t she make the final color?',choices:['She can’t un-mix paint to get either secret color','The final color is sent in secret','She doesn’t have any paint'],correct:0,set:{mode:'dh',dhp:'p23'},act(s){s.st.dhT=9;},
     explain:'Eve’s best guess, mixing the two public mixes, comes out a different color from the shared one (shown at the bottom). The math version is the same idea: easy to combine, very hard to undo.'},
    {lvl:'honors',instant:true,q:'Eve can intercept and replace messages, and there are no certificates. Is Diffie–Hellman enough to keep Ava’s message private?',choices:['Yes, the math protects it','No, Eve can make a separate key with each of them and read everything','Only if the prime is big enough'],correct:1,set:{mode:'case',setup:3},
     explain:'In the model Eve read “'+MSG+'” and Ben received “'+r3.benGot+'”. Both locks worked, so nobody noticed. Key exchange needs authentication: a certificate or signature proving whose numbers they are.'},
    {lvl:'honors',instant:true,q:'Eve changes “$5” to “$9” in Ava’s signed message. What does Ben’s check show?',choices:['Valid, because only one character changed','Invalid, because the hash no longer matches the signature','Valid, because Eve didn’t touch the signature'],correct:1,set:{mode:'sign',tamper:'edit'},act(s){s.st.smsg='Club dues: $5 by Friday. – Ava (treasurer)';},
     explain:'The SHA-256 of the changed message starts '+sha256(tam.got).slice(0,12)+'… instead of '+sha256(tam.sent).slice(0,12)+'…, so sᵉ mod n no longer matches. Ben’s check: '+(tam.ok?'valid':'invalid')+'.'},
    {lvl:'honors',instant:true,q:'A look-alike site, lunarlibrary-login.test, shows a padlock. What does the padlock promise?',choices:['The site is safe and honest','Your connection is encrypted to whoever holds a certificate for that exact name','The site is the real lunarlibrary.test'],correct:1,set:{mode:'cert',cert:'phish'},
     explain:'Every check passes for the look-alike: its certificate is real, for its own name. The padlock says nothing about whether the name is the one you meant. Read the address, not just the padlock.'},
    {lvl:'ap',instant:true,q:'p = 23, g = 5, Ava’s secret a = 6, Ben’s b = 15. What shared key do they compute?',choices:[String(s),String(A),String(B),'6'],correct:0,set:{mode:'dh',dhp:'p23'},act(st){st.st.dhRe=false;newDH(st);st.st.dhT=9;},
     explain:'A = 5⁶ mod 23 = '+A+' and B = 5¹⁵ mod 23 = '+B+'. Ava: '+B+'⁶ mod 23 = '+s+'. Ben: '+A+'¹⁵ mod 23 = '+mpow(A,15n,23n)+'. Same key.'},
    {lvl:'ap',instant:true,q:'RSA with p = 61, q = 53 and e = 17. What is the private key d?',choices:[String(K.d),String(K.n),String(K.phi),'17'],correct:0,set:{mode:'rsa',rsap:'r1'},act(s){s.st.sent=0.001;},
     explain:'φ(n) = 60 × 52 = '+K.phi+'. d is the inverse of 17 mod '+K.phi+': 17 × '+K.d+' = '+(17n*K.d)+' = '+(17n*K.d/K.phi)+' × '+K.phi+' + 1. The RSA table now shows each step.'},
    {lvl:'ap',instant:true,q:'Trying every exponent, how much more work is a 64-bit prime than a 32-bit prime?',choices:['2 times','32 times','About 4 billion times (2³²)'],correct:2,set:{mode:'dh',dhp:'b32'},act(s){s.st.dhT=9;startEve(s);},
     explain:'The number of exponents to try is about p/2, so 32 more bits multiply it by 2³² ≈ 4.3 × 10⁹. The graph shows the line climbing one notch per bit; Eve is now trying the 32-bit prime.'}];},
  lab:{bio:'<p><b>Question:</b> What can an eavesdropper learn in each setup?</p><ol><li>In Investigate, try each way of sending. Read Eve’s notebook.</li><li>Tick what Eve can learn and check your answer. Record a trial for each setup.</li><li>Look at the HTTPS certificate cases and write what the browser shows for each.</li></ol><p>What does Eve learn in every setup, even the safest one?</p>',
    honors:'<p><b>Question:</b> How does key size change the time to break a key?</p><ol><li>In Agree on a key, press Eve tries every exponent for the 8-bit and 16-bit primes. Record the time each run takes.</li><li>Use the graph to predict the time for 32 and 64 bits.</li><li>In Investigate, compare “Eve in the middle” with and without a certificate.</li></ol><p>Explain why HTTPS needs both key exchange and certificates.</p>',
    ap:'<p><b>Question:</b> Does brute-force time grow the way the math predicts?</p><ol><li>Run Eve against the 8-, 16- and 24-bit primes and record the time. Then factor the RSA moduli for each prime size.</li><li>Plot log₁₀(time) against bits. Find the slope and compare with log₁₀2 ≈ 0.301 per bit (DH) or 0.15 per bit of n (trial division).</li><li>Compute d by hand for p = 61, q = 53, e = 17 and check it in the table.</li></ol><p><b>Claim–evidence–reasoning:</b> Using your data, estimate whether a 128-bit key could be brute-forced, and explain why real systems use 2048-bit RSA or 256-bit elliptic curves.</p>'},
  terms:[{t:'Encryption',d:'Scrambling data with a key so only someone with the right key can read it.'},{t:'Key',d:'The secret value that locks and unlocks a message.'},{t:'Eavesdropper',d:'Someone who copies data as it travels, like Eve on the line.'},{t:'Public key / private key',d:'A matched pair: the public key can be shared with anyone; the private key is never shared.'},{t:'Digital signature',d:'Proof, made with a private key, that a message came from its owner and was not changed.'},{t:'Certificate',d:'A signed document saying “this public key belongs to this website,” issued by a certificate authority.'},
    {lvl:'honors',t:'Symmetric encryption',d:'One shared key both locks and unlocks (fast; used for the actual data in HTTPS).'},{lvl:'honors',t:'Diffie–Hellman',d:'A way for two parties to agree on a shared key over a public line.'},{lvl:'honors',t:'RSA',d:'A public-key system based on how hard it is to factor n = p × q.'},{lvl:'honors',t:'Hash (SHA-256)',d:'A fixed-length fingerprint of data; any change gives a completely different hash.'},{lvl:'honors',t:'Man-in-the-middle',d:'An attacker who sits between two parties and relays (and can change) their messages.'},{lvl:'honors',t:'Certificate authority (CA)',d:'An organization browsers trust to sign certificates after checking who owns a name.'},
    {lvl:'ap',t:'Modular exponentiation',d:'Computing gᵃ mod p; fast even for huge numbers by repeated squaring.'},{lvl:'ap',t:'Discrete logarithm',d:'Finding a from gᵃ mod p. No fast method is known for well-chosen large p.'},{lvl:'ap',t:'Euler’s totient φ(n)',d:'For n = pq, φ(n) = (p − 1)(q − 1); RSA needs e × d ≡ 1 (mod φ(n)).'},{lvl:'ap',t:'Brute force',d:'Trying every possible key. Each extra bit of key doubles the work.'}],
  about:'<p>All cryptography here is computed in your browser with real algorithms on toy-sized keys: modular exponentiation and inverses with BigInt, SHA-256 (checked against the standard test vectors), and a demo cipher that XORs the message with a SHA-256 keystream. Eve’s brute force and factoring are real loops; their speed is measured on your device and used for the time estimates. The primes are real primes and each g is a primitive root.</p><p>Simplified: real HTTPS (TLS 1.3) uses elliptic-curve Diffie–Hellman, AES or ChaCha20 for the data, and RSA or ECDSA signatures with padding and much larger keys. The best attacks on real keys (index calculus, the number field sieve) are much faster than trying every value but still far too slow; the graph shows only simple brute force. Certificate checks also include revocation and other details left out here. Ava, Ben, Eve, lunarlibrary.test and the Granite certificate authority are fictional, and .test names do not exist on the internet.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='case')drawCase(sim,ctx,k,t);else if(p.mode==='dh')drawDH(sim,ctx,k,t);else if(p.mode==='rsa')drawRSA(sim,ctx,k,t);else if(p.mode==='sign')drawSign(sim,ctx,k);else drawCert(sim,ctx,k);},
  thumbSetup(sim){sim.st.ct=2.6;}
};
function rateOf(sim,kind){const r=sim.st.runs.filter(x=>x.kind===kind);return r.length?r[r.length-1].rate:(kind==='dh'?5e6:1e7);}
function sigCheck(sent,tamper){let got=sent,sig=sign(sent,KAVA);if(tamper==='edit')got=sent.includes('$5')?sent.replace('$5','$9'):sent.slice(0,-1)+(sent.slice(-1)==='!'?'?':'!');
  if(tamper==='forge'){got=sent.includes('$5')?sent.replace('$5','$50'):sent+' (P.S. pay Eve)';sig=sign(got,KEVE);}
  const h=hnum(sent,KAVA.n),h2=hnum(got,KAVA.n),back=mpow(sig,KAVA.e,KAVA.n);return {sent,got,sig,h,h2,back,ok:back===h2};}
function signState(sim){return sigCheck(sim.st.smsg,sim.p.tamper);}
function gradeCase(sim){const st=sim.st,r=st.run,s=clamp(Math.round(+sim.p.setup)||0,0,4);const items=ITEMS.filter(i=>i[0]!=='change'||r.active);let ok=true;const lines=[];
  items.forEach(([id,label])=>{const said=!!st.picks[id],is=!!r.truth[id];if(said!==is)ok=false;
    const why={text:{true:'Eve read the words.',false:'Eve could not read the words.'},key:{true:'Eve has the key.',false:s===0?'There is no key here at all.':'Eve never got the key.'},meta:{true:'Encryption hides content, not who talks to whom or when.'},len:{true:'Locked messages are about the same size as the original.'},change:{true:'Eve can alter it and nobody can tell.',false:'A change would be detected.'}}[id][is];
    lines.push((said===is?'✓ ':'✗ ')+label.charAt(0).toUpperCase()+label.slice(1)+': '+(is?'yes':'no')+'. '+(why||''));});
  if(ok)st.solved[s]=true;st.ans={ok,lines};}

/* ---------- drawing helpers ---------- */
function person(ctx,x,y,name,col,k,sub){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y-14,13,0,6.29);ctx.fill();ctx.beginPath();ctx.moveTo(x-20,y+22);ctx.quadraticCurveTo(x-20,y,x,y);ctx.quadraticCurveTo(x+20,y,x+20,y+22);ctx.closePath();ctx.fill();
  txt(ctx,name,x,y+30+12*k,{s:14*k,w:700,a:'center'});if(sub)txt(ctx,sub,x,y+30+28*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function fitTxt(ctx,s,maxW,font){ctx.font=font;if(ctx.measureText(s).width<=maxW)return s;while(s.length>2&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);return s+'…';}
function card(ctx,x,y,w,h,title,lines,k,o){o=o||{};rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=o.stroke||PAL['line'];ctx.lineWidth=o.stroke?2.5:1;ctx.stroke();
  const ts=13*k;txt(ctx,fitTxt(ctx,title,w-24,'700 '+ts+'px sans-serif'),x+12,y+8+ts*0.8,{s:ts,w:700,c:o.tc||PAL['cv-soft']});const ls=o.ls||13*k,lh=ls*(o.lh||1.45);
  lines.forEach((l,i)=>{const yy=y+14+ts+lh*(i+0.75);if(yy>y+h-4)return;const c=Array.isArray(l)?l[1]:PAL['cv-ink'],s=Array.isArray(l)?l[0]:l;const f=(o.mono?'600 ':'500 ')+ls+'px '+(o.mono?MONO:'sans-serif');txt(ctx,'',0,0);ctx.font=f;ctx.fillStyle=c;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(fitTxt(ctx,s,w-24,f),x+12,yy);});}
function envelope(ctx,x,y,lab,col,k){const s=12*k;ctx.font='700 '+s+'px sans-serif';const w=Math.max(34,ctx.measureText(lab).width+14),h=s+10;rr(ctx,x-w/2,y-h/2,w,h,5);ctx.fillStyle=col;ctx.fill();txt(ctx,lab,x,y+1,{s,w:700,c:'#fff',a:'center',b:'middle'});}
function drawCase(sim,ctx,k,t){const st=sim.st,r=st.run,s=clamp(Math.round(+sim.p.setup)||0,0,4);if(!r)return;const AX=90,BX=710,WY=104,act=r.active;
  pill(ctx,SETUPS[s].l,400,24,'#3f5f7f','#fff',13*k);
  person(ctx,AX,WY,'Ava','#2d6bd2',k);person(ctx,BX,WY,'Ben','#1b8a4a',k);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.globalAlpha=0.6;ctx.beginPath();if(act){ctx.moveTo(AX+30,WY);ctx.lineTo(370,WY);ctx.moveTo(430,WY);ctx.lineTo(BX-30,WY);}else{ctx.moveTo(AX+30,WY);ctx.lineTo(BX-30,WY);ctx.moveTo(400,WY);ctx.lineTo(400,WY+44);}ctx.stroke();ctx.globalAlpha=1;
  const EY=act?WY:WY+70;person(ctx,400,EY,'Eve',act?'#b3261e':'#8a3a3a',k);if(!act){ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(400,WY,6,0,6.29);ctx.fill();}
  txt(ctx,act?'in the middle':'listening',400+30,EY-28,{s:12*k,c:PAL['cv-soft'],w:600});
  // envelopes in flight
  const per=1.1,shown=Math.min(r.wire.length,Math.floor(st.ct/per));const i=Math.max(0,Math.floor(st.ct/per));if(i<r.wire.length){const w=r.wire[i],f=clamp((st.ct-i*per)/0.9,0,1),back=!!w.back;let x=back?BX-40-(BX-AX-80)*f:AX+40+(BX-AX-80)*f;let lab=w.l;if(act&&w.swap&&((back?x<400:x>400)))lab=w.swap;envelope(ctx,x,WY-22*Math.min(k,1.4),lab,w.c,k);}
  // Eve's notebook
  const ny=act?214:232,lines=r.note.slice(0,shown+1);card(ctx,30,ny,740,446-ny-4,'Eve’s notebook',lines.length?lines:['(nothing yet)'],k,{mono:false,ls:(k>1.3?12:15)*k,lh:1.32,tc:PAL['s1']});
  if(shown>=r.wire.length&&s===4){pill(ctx,'Swap caught by the signature check',400,WY+64+14*k,PAL['s3'],'#fff',12*k);}
  if(shown>=r.wire.length&&s===3){pill(ctx,'Ben got: “'+r.benGot+'”',560,WY+64+14*k,'#b3261e','#fff',12*k);}}
function blob(ctx,x,y,col,R){ctx.fillStyle=css(col);ctx.beginPath();ctx.arc(x,y,R,0,6.29);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(x-R*0.35,y-R*0.35,R*0.25,R*0.16,-0.6,0,6.29);ctx.fill();}
function drawDH(sim,ctx,k,t){const st=sim.st,P=DHP[sim.p.dhp]||DHP.p23,hon=atLeast('honors'),T=st.dhT,small=k>1.3;const A=mpow(P.g,st.a,P.p),B=mpow(P.g,st.b,P.p),K1=mpow(B,st.a,P.p),K2=mpow(A,st.b,P.p);
  const R=24,L=10,lab=(s,x,y,c)=>txt(ctx,s,x,y,{s:12*k,w:600,a:'center',c:c||PAL['cv-ink']});const nm=(v)=>short(v,small?5:11);
  ctx.fillStyle=PAL['cv-bg2'];rr(ctx,262,8,276,438,12);ctx.fill();
  txt(ctx,'Ava (private)',130,30,{s:13*k,w:700,a:'center',c:'#2d6bd2'});txt(ctx,small?'Public':'Public: Eve sees this',400,30,{s:13*k,w:700,a:'center',c:PAL['s1']});txt(ctx,'Ben (private)',670,30,{s:13*k,w:700,a:'center',c:'#1b8a4a'});
  const mA=mix(PAINT.common,PAINT.ava),mB=mix(PAINT.common,PAINT.ben),fin=mix(PAINT.common,PAINT.ava,PAINT.ben),eve=mix(PAINT.common,PAINT.common,PAINT.ava,PAINT.ben);
  const ap=(f)=>clamp(f,0,1);const line=(x1,y1,x2,y2,a)=>{if(a<=0)return;ctx.globalAlpha=a;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;};
  // row 1
  blob(ctx,130,90,PAINT.ava,R);blob(ctx,400,90,PAINT.common,R);blob(ctx,670,90,PAINT.ben,R);
  lab(hon?'a = '+nm(st.a):'secret color',130,90+R+12*k+4);lab(hon?(small?'g = '+P.g:'g = '+P.g+', p = '+nm(P.p)):'common paint',400,90+R+12*k+4);lab(hon?'b = '+nm(st.b):'secret color',670,90+R+12*k+4);
  // row 2: mixes
  const f1=ap(T/1.2);line(400,90,130,190,f1);line(400,90,670,190,f1);ctx.globalAlpha=f1;blob(ctx,130,190,mA,R);blob(ctx,670,190,mB,R);lab(hon?(small?'A = ':'A = gᵃ mod p = ')+nm(A):'Ava’s mix',130,190+R+12*k+4);lab(hon?(small?'B = ':'B = gᵇ mod p = ')+nm(B):'Ben’s mix',670,190+R+12*k+4);ctx.globalAlpha=1;
  // public copies travel to the middle
  const f2=ap((T-1.2)/1.4);if(f2>0){const ax=130+(345-130)*f2,bx=670+(455-670)*f2,y=190+(232-190)*f2;blob(ctx,ax,y,mA,R*0.8);blob(ctx,bx,y,mB,R*0.8);if(f2>=1){lab('A',345,232+R+8*k,PAL['cv-soft']);lab('B',455,232+R+8*k,PAL['cv-soft']);}}
  // row 3: finals
  const f3=ap((T-2.8)/1.2);if(f3>0){line(455,232,130,330,f3);line(345,232,670,330,f3);ctx.globalAlpha=f3;blob(ctx,130,340,fin,R+4);blob(ctx,670,340,fin,R+4);
    lab(hon?(small?'key ':'Bᵃ mod p = ')+nm(K1):(small?'shared':'+ own secret = shared'),130,340+R+12*k+8);lab(hon?(small?'key ':'Aᵇ mod p = ')+nm(K2):(small?'shared':'+ own secret = shared'),670,340+R+12*k+8);ctx.globalAlpha=1;}
  // Eve's attempt
  const f4=ap((T-4.2)/1);if(f4>0){ctx.globalAlpha=f4;blob(ctx,400,340,eve,R);const E=st.eve;let s;
    if(!hon)s=small?'Eve: wrong color':'Eve mixes A + B: wrong color';else if(E&&!E.done)s='Eve tried '+E.tries.toLocaleString('en-US')+'…';else if(E&&E.found)s='Eve found a = '+nm(BigInt(E.found))+'!';else if(E)s='Eve gave up: needs ~'+dur(Number(P.p)/2/rateOf(sim,'dh'));else s=(small?'A·B = ':'A·B mod p = ')+nm(A*B%P.p)+' ✗';
    lab(s,400,340+R+12*k+8,E&&E.found?PAL['s1']:PAL['cv-ink']);ctx.globalAlpha=1;}
  if(st.eve&&!st.eve.done&&!RM){const a=t*6;ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(400,340,R+8,a,a+4);ctx.stroke();}}
function drawRSA(sim,ctx,k,t){const st=sim.st,K=rsaKey(RSAP[sim.p.rsap]||RSAP.r1),ap=atLeast('ap'),m=BigInt(st.m),c=mpow(m,K.e,K.n),F=st.fac;
  card(ctx,12,44,376,140,'Ava locks a number',['m = '+m,['c = mᵉ mod n = '+c,PAL['s2']],'uses Ben’s public (n, e)'],k,{mono:true,ls:13*k});
  card(ctx,412,44,376,140,'Ben’s keys',[['public: n = '+K.n+', e = '+K.e,PAL['s3']],['private: d = '+K.d,PAL['s1']],ap?'p = '+K.p+', q = '+K.q+' (secret)':'p and q stay secret'],k,{mono:true,ls:13*k});
  const y=214;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.globalAlpha=0.6;ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(740,y);ctx.stroke();ctx.globalAlpha=1;
  if(st.sent>0){const f=clamp(st.sent/1.4,0,1);envelope(ctx,80+640*f,y,'c = '+short(c,10),'#3f5f7f',k);if(f>=1)txt(ctx,'Ben: cᵈ mod n = '+mpow(c,K.d,K.n),740,y+30*k,{s:13*k,w:700,a:'right',c:PAL['s3']});}
  else txt(ctx,'Press Encrypt and send',400,y+28*k,{s:13*k,c:PAL['cv-soft'],a:'center'});
  const lines=['Eve sees n = '+K.n+', e = '+K.e+(st.sent>0?', c = '+c:'')];
  if(!F)lines.push('To get d she must factor n. Press “Eve tries to factor n”.');
  else{lines.push('Trial division: '+F.tries.toLocaleString('en-US')+' divisors tried'+(F.done?'':'…'));if(F.done&&F.found&&F.found!==F.n){const d=inv(K.e,(F.found-1n)*(F.n/F.found-1n));lines.push(['Found n = '+F.found+' × '+(F.n/F.found)+', so d = '+d,PAL['s1']]);lines.push(['Eve reads m = '+mpow(c,d,K.n),PAL['s1']]);}
    else if(F.done)lines.push('Not found yet. At this speed: about '+dur(Math.sqrt(Number(K.n))/2/rateOf(sim,'rsa'))+'.');}
  card(ctx,40,262,720,180,'Eve',lines,k,{mono:false,ls:(k>1.3?12:15)*k,tc:PAL['s1']});
  if(F&&!F.done){const f=Math.min(F.tries/F.max,Number(F.d*F.d)/Number(F.n));rr(ctx,52,418,696*clamp(f,0.01,1),10,5);ctx.fillStyle=PAL['s1'];ctx.fill();}}
function drawSign(sim,ctx,k){const S=signState(sim),hon=atLeast('honors'),ap=atLeast('ap'),tam=sim.p.tamper;
  card(ctx,12,40,376,150,'Ava signs (private key)',[['“'+S.sent+'”',PAL['cv-ink']],hon?'SHA-256: '+sha256(S.sent).slice(0,16)+'…':'fingerprint of the message',['signature: '+(ap?short(sign(S.sent,KAVA),16):'made with Ava’s private key'),PAL['s2']]],k,{ls:14*k});
  card(ctx,412,40,376,150,'Ben checks (Ava’s public key)',[['“'+S.got+'”',S.got===S.sent?PAL['cv-ink']:PAL['s1']],hon?'SHA-256: '+sha256(S.got).slice(0,16)+'…':'fingerprint of what arrived',ap?'sᵉ mod n = '+short(S.back,16)+(S.ok?' = ':' ≠ ')+'h':'unlock the signature and compare'],k,{ls:14*k,stroke:S.ok?PAL['s3']:PAL['s1']});
  const y=248;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.globalAlpha=0.6;ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(740,y);ctx.stroke();ctx.globalAlpha=1;
  person(ctx,400,y+34,'Eve',tam==='none'?'#8a3a3a':'#b3261e',k,k>1.3?null:tam==='none'?'just watching':tam==='edit'?'changed the message':'signed her own version');
  const ok=S.ok;rr(ctx,150,374,500,66,14);ctx.fillStyle=ok?'#1b7339':'#b3261e';ctx.fill();
  txt(ctx,ok?'✓ Signature valid':'✗ Signature invalid',400,396,{s:18*k>30?30:18*k,w:800,c:'#fff',a:'center',b:'middle'});txt(ctx,ok?'From Ava, and not changed':(tam==='forge'?'Not made with Ava’s key':'The message was changed'),400,423,{s:13*k,w:600,c:'#fff',a:'center',b:'middle'});}
function drawCert(sim,ctx,k){const B=buildChain(sim.p.cert),c=B.chk,hon=atLeast('honors'),small=k>1.3;
  // generic address bar (not any real browser)
  rr(ctx,16,12,768,44,22);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=c.ok?PAL['s3']:PAL['s1'];ctx.lineWidth=2;ctx.stroke();
  const ix=44,iy=34;if(c.ok){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(ix,iy-5,6,Math.PI,0);ctx.stroke();ctx.fillStyle=PAL['s3'];rr(ctx,ix-9,iy-4,18,14,3);ctx.fill();}
  else{ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.moveTo(ix,iy-11);ctx.lineTo(ix+11,iy+9);ctx.lineTo(ix-11,iy+9);ctx.closePath();ctx.fill();txt(ctx,'!',ix,iy+3,{s:13,w:800,c:'#fff',a:'center',b:'middle'});}
  txt(ctx,(small?'':'https://')+B.C.visit,66,35,{s:14*k,w:600,b:'middle'});if(!small)txt(ctx,c.ok?'Connection is secure':'Not secure',770,35,{s:13*k,w:700,a:'right',b:'middle',c:c.ok?PAL['s3']:PAL['s1']});
  const cards=[[B.root,'Root CA'],[B.mid,'Intermediate CA'],[B.leaf,'Site certificate']];const cw=small?380:410,ch=94;
  cards.forEach(([ce,role],i)=>{const y=72+i*(ch+30),bad=(i===2&&(!c.sigLeaf||!c.name))||(i===1&&!c.sigMid)||(i===0&&!c.trusted)||!(ce.from<=TODAY&&TODAY<=ce.to);
    card(ctx,16,y,cw,ch,role+(i===0?' (in the browser’s trust store?)':''),[[ce.sub,PAL['cv-ink']],(hon?'signed by: ':'issued by: ')+ce.iss,'valid '+ce.from+' to '+ce.to],k,{ls:12*k,stroke:bad?PAL['s1']:undefined});
    if(i<2){const ay=y+ch+4;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(60,ay+22);ctx.lineTo(60,ay);ctx.lineTo(54,ay+7);ctx.moveTo(60,ay);ctx.lineTo(66,ay+7);ctx.stroke();txt(ctx,'vouches for the one below',74,ay+13,{s:12*k,c:PAL['cv-soft'],b:'middle'});}});
  const X=cw+40,checks=[[c.sigs,'Signatures check out'],[c.dates,'Dates are valid'],[c.name,'Name matches address'],[c.trusted,'Root is trusted']];
  checks.forEach((q,i)=>{const y=96+i*62;txt(ctx,q[0]?'✓':'✗',X,y,{s:22*k>34?34:22*k,w:800,c:q[0]?PAL['s3']:PAL['s1'],b:'middle'});txt(ctx,q[1],X+30*Math.min(k,1.4),y,{s:14*k,w:700,b:'middle'});});
  {const y=96+4*62;txt(ctx,sim.p.cert==='phish'?(small?'Padlock, wrong site!':'All checks pass, but it is the wrong site!'):c.ok?(small?'Padlock shown':'Padlock: encrypted, right name'):(small?'Warning shown':'Browser shows a warning'),X,y,{s:13*k,w:700,c:sim.p.cert==='phish'?PAL['s4']:c.ok?PAL['s3']:PAL['s1'],b:'middle'});}}
PK.controls[0].onChange=sim=>{syncMode(sim);};
PK.onLevel=syncMode;
BioLab.register(PK);
})();

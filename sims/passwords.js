(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,monospace';

/* ---------- SHA-256 (synchronous, UTF-8). Checked against "abc" → ba7816bf…, "" → e3b0c442… ---------- */
const K256=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function utf8(s){const o=[];for(const ch of s){const c=ch.codePointAt(0);if(c<0x80)o.push(c);else if(c<0x800)o.push(0xc0|c>>6,0x80|c&63);else if(c<0x10000)o.push(0xe0|c>>12,0x80|c>>6&63,0x80|c&63);else o.push(0xf0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63);}return o;}
function sha256(msg){const b=utf8(msg),l=b.length;b.push(0x80);while(b.length%64!==56)b.push(0);const hi=Math.floor(l*8/4294967296),lo=(l*8)>>>0;
  b.push(hi>>>24&255,hi>>>16&255,hi>>>8&255,hi&255,lo>>>24&255,lo>>>16&255,lo>>>8&255,lo&255);
  let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const w=new Array(64),ror=(x,n)=>x>>>n|x<<(32-n);
  for(let i=0;i<b.length;i+=64){for(let t=0;t<16;t++)w[t]=(b[i+4*t]<<24|b[i+4*t+1]<<16|b[i+4*t+2]<<8|b[i+4*t+3])>>>0;
    for(let t=16;t<64;t++){const s0=ror(w[t-15],7)^ror(w[t-15],18)^w[t-15]>>>3,s1=ror(w[t-2],17)^ror(w[t-2],19)^w[t-2]>>>10;w[t]=(w[t-16]+s0+w[t-7]+s1)>>>0;}
    let a=h[0],bb=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for(let t=0;t<64;t++){const S1=ror(e,6)^ror(e,11)^ror(e,25),ch=e&f^~e&g,t1=(hh+S1+ch+K256[t]+w[t])>>>0,S0=ror(a,2)^ror(a,13)^ror(a,22),mj=a&bb^a&c^bb&c,t2=(S0+mj)>>>0;hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0;}
    h=[h[0]+a,h[1]+bb,h[2]+c,h[3]+d,h[4]+e,h[5]+f,h[6]+g,h[7]+hh].map(x=>x>>>0);}
  return h.map(x=>x.toString(16).padStart(8,'0')).join('');}

/* ---------- built-in lists ---------- */
// A short list of the most common leaked passwords (rank = order an attacker tries them).
const COMMON=['123456','password','123456789','12345678','12345','qwerty','1234567','111111','1234567890','123123','abc123','1234','password1','iloveyou','1q2w3e4r','000000','qwerty123','zaq12wsx','dragon','sunshine','princess','letmein','654321','monkey','1qaz2wsx','123321','qwertyuiop','superman','asdfghjkl','football','baseball','welcome','admin','master','shadow','trustno1','starwars','whatever','freedom','hello','charlie','loveme','flower','cheese','computer','soccer','batman','passw0rd','login','access','mustang','ninja','azerty','pokemon','jordan','summer','internet','secret','michael','jennifer','hunter','buster','tigger','pepper','ginger','hockey','yankees','cookie','chocolate','butterfly','purple','orange','banana','sunshine1','welcome1','password123','qwerty1','iloveyou1','admin123','letmein1','111111111','987654321','121212','696969','777777','555555','666666','999999','888888','abcdef','abcd1234','test','test123','guest','default','changeme','blink182','liverpool','arsenal','chelsea'];
const COMMON_RANK=new Map();COMMON.forEach((w,i)=>{if(!COMMON_RANK.has(w))COMMON_RANK.set(w,i+1);});
// Common English words. The passphrase button picks from this same list, so its strength is exact.
const WORDS=[...new Set(('apple acorn actor adult advice agent alarm album alert alley amber angle ankle anvil apron arena armor arrow atlas attic audio autumn avenue award badge bagel baker balance ballet bamboo banjo banner barn barrel basil basket beach beacon beard beaver bedrock beetle bench berry bicycle bird biscuit blanket blaze blender blossom board bonnet border bottle boulder bowl bracket branch brass bread breeze brick bridge bright brook broom bubble bucket buckle budget buffalo bugle bundle burrow button cabin cable cactus camel camera canal candle canoe canvas canyon captain carbon cargo carpet carrot castle cattle cave cedar celery cello cement chalk channel chapel cherry chess chimney chorus cider cinder circle circus citrus clam clay cliff climb clock cloud clover coach coast cobalt cocoa coconut comet compass copper coral cotton cougar county cradle crane crater crayon creek cricket crown crystal cube cupboard curtain cushion dancer daisy dawn debate decade deer delta denim desert diamond diesel dinner dock dolphin domino donkey donut door dragonfly drawer dream drift drum duck dune eagle easel echo eclipse elbow elder ember empire engine envelope espresso falcon fable fabric fairy feather fence ferry fiddle field fig finch fjord flag flame flannel flint flute foam forest fossil fountain fox frost galaxy garden garlic gazelle gecko geyser ginger giraffe glacier glove goblet goose gopher granite grape gravel griddle guitar gully hammer harbor harvest hazel hedge helmet heron hiking hollow honey hornet horse hotel hound island ivory jacket jaguar jasmine jelly jigsaw jungle kayak kettle kitten kiwi koala ladder ladle lagoon lake lantern laptop lattice lava lawn leaf ledge lemon lentil lettuce library lily limestone linen lion lizard llama lobster locket lotus lumber magnet mango manor maple marble market meadow melon mermaid metal meteor mint mirror mitten molasses monsoon moose mosaic moss motor muffin mural museum mustard nectar needle nest nickel noodle north nutmeg oak oasis ocean octave olive onion opal orbit orchard orchid otter oven owl oyster paddle pagoda palace panda panther paper parade parrot pasta pastel peach peanut pebble pecan pelican pencil penguin pepperoni piano pickle pillow pilot pine pinwheel pirate pistachio planet plaza plum pocket polar pond popcorn poppy porch potato pottery prairie pretzel prism pudding pumpkin puppet puzzle quarry quartz quill quilt rabbit raccoon radar radish rainbow raisin ranch raven reef ribbon ridge river robin rocket rodeo rooster rope rose ruby saddle saffron sailor salmon sandal satchel saturn scarf scooter sculpture seagull season sequoia shadowbox shell shelter sherbet shovel signal silver sketch sled slipper snail snorkel snowflake sofa solar sonnet spark sparrow spider spinach sponge spruce squash squid stable stadium stamp starfish statue steam stencil stone stork storm stream studio sugar summit sundial swan sweater syrup table tablet taco tango teapot temple thimble thistle thunder ticket tiger timber toast toffee tomato topaz torch tortoise tower tractor trail trolley trophy trumpet tulip tundra tunnel turnip turtle tuxedo umbrella unicorn valley vapor velvet violin volcano voyage waffle wagon walnut walrus wander warbler wasabi water wave wheat whistle willow window winter wizard wombat wool yacht yarn yogurt zebra zephyr zigzag zinc bold brave calm clever cozy crisp dusty eager early fancy fluffy frozen gentle giant glossy golden grand happy hasty humble icy jolly keen kind lively lucky lunar mellow merry mighty misty modern noble odd plain polite proud quick quiet rapid rare rusty salty sandy shiny silky sleepy smooth snowy soft spicy steady sticky stormy sunny sweet swift tidy tiny vivid warm wild windy witty young zesty brisk chilly cloudy dizzy foggy grumpy hollow nimble prickly rugged scenic tangy breezy cheerful clumsy curly fuzzy jumpy lanky lofty murky perky plucky quirky rosy shaggy sparkly speedy spotted stripy sturdy trouble double simple castle little middle puzzle noodle riddle cradle bundle').split(/\s+/).filter(Boolean))];
const WORDSET=new Set(WORDS),W=WORDS.length;
const LEET={'0':['o'],'1':['i','l'],'!':['i','l'],'3':['e'],'4':['a'],'@':['a'],'$':['s'],'5':['s'],'7':['t'],'+':['t'],'|':['l','i'],'8':['b'],'9':['g']};
const ROWS=['qwertyuiop','asdfghjkl','zxcvbnm','1234567890','1qaz2wsx3edc4rfv5tgb','qazwsxedcrfv'];

/* ---------- attack speeds ---------- */
const RATES=[{id:'online',l:'Online, with lockout',r:10/3600,d:'about 10 guesses per hour before the account locks'},
  {id:'fast',l:'Offline, fast hash',r:1e10,d:'about 10 billion guesses per second on one gaming GPU (SHA-256 or MD5)'},
  {id:'slow',l:'Offline, slow hash',r:1e4,d:'about 10,000 guesses per second (bcrypt, scrypt or Argon2)'}];
const UNIVERSE=4.35e17; // s

/* ---------- analysis ---------- */
function classOf(ch){if(/[a-z]/.test(ch))return 'lower';if(/[A-Z]/.test(ch))return 'upper';if(/[0-9]/.test(ch))return 'digit';const c=ch.codePointAt(0);if(c>=32&&c<127)return 'symbol';return 'other';}
const CLS={lower:{n:26,l:'lowercase letters',c:'#2d63c4',g:'a'},upper:{n:26,l:'uppercase letters',c:'#7140d6',g:'A'},digit:{n:10,l:'digits',c:'#a3570f',g:'9'},symbol:{n:33,l:'symbols and spaces',c:'#18794a',g:'#'},other:{n:100,l:'other characters (accents, emoji)',c:'#5f6b7a',g:'*'}};
function deleet(s){let out=[''];for(const ch of s){const opts=LEET[ch]?[ch].concat(LEET[ch]):[ch];const nx=[];out.forEach(o=>opts.forEach(c=>{if(nx.length<32)nx.push(o+c);}));out=nx;}return out;}
function capFactor(sub){const letters=sub.replace(/[^a-zA-Z]/g,''),u=(letters.match(/[A-Z]/g)||[]).length;if(!u)return 1;if(u===letters.length||(u===1&&/[A-Z]/.test(letters[0])))return 2;
  let s=0,c=1;for(let k=0;k<=u;k++){s+=c;c=c*(letters.length-k)/(k+1);}return s;}
function leetCount(sub,variant){let n=0;for(let i=0;i<sub.length;i++)if(sub[i].toLowerCase()!==variant[i])n++;return n;}
function patternMatches(pw){const out=[],n=pw.length;
  for(let s=0;s<n;s++)for(let e=s+1;e<=Math.min(n,s+24);e++){const sub=pw.slice(s,e),low=sub.toLowerCase(),len=e-s;
    if(len>=3){let best=null;
      deleet(low).forEach(v=>{const lc=leetCount(sub,v),lf=Math.pow(2,lc);
        if(COMMON_RANK.has(v)){const g=COMMON_RANK.get(v)*capFactor(sub)*lf;if(!best||g<best.g)best={g,k:'common',lc};}
        if(WORDSET.has(v)){const g=W*capFactor(sub)*lf;if(!best||g<best.g)best={g,k:'word',lc};}});
      if(best)out.push({s,e,kind:best.k,g:best.g,leet:best.lc,cap:capFactor(sub)>1});}
    if(len===4&&/^(19[5-9]\d|20[0-3]\d)$/.test(sub))out.push({s,e,kind:'year',g:90});
    if(len>=4&&ROWS.some(r=>r.includes(low)||r.split('').reverse().join('').includes(low)))out.push({s,e,kind:'keyboard',g:50*len});
    if(len>=3){let up=true,dn=true;for(let i=1;i<len;i++){const d=low.charCodeAt(i)-low.charCodeAt(i-1);if(d!==1)up=false;if(d!==-1)dn=false;}
      if((up||dn)&&/^([a-z]+|[0-9]+)$/.test(low))out.push({s,e,kind:'sequence',g:20*len});}
    if(len>=3&&low.split('').every(c=>c===low[0]))out.push({s,e,kind:'repeat',g:CLS[classOf(sub[0])].n*len});}
  return out;}
function analyze(pw){const L=[...pw].length;const r={L,pool:0,classes:{},naive:0,segs:[],log2g:0,bits:0};if(!L)return r;
  const chars=[...pw];chars.forEach(c=>{r.classes[classOf(c)]=true;});r.pool=Object.keys(r.classes).reduce((a,k)=>a+CLS[k].n,0);r.naive=L*Math.log2(r.pool);
  if(chars.length!==pw.length){r.log2g=r.naive;r.bits=r.naive;r.segs=[{s:0,e:L,kind:'random',g:Math.pow(2,r.naive)}];return r;}
  const n=pw.length,M=patternMatches(pw),dp=new Array(n+1).fill(Infinity),back=new Array(n+1).fill(null),lp=Math.log2(r.pool);dp[0]=0;
  for(let i=1;i<=n;i++){const ch=pw[i-1],sep=' -_.'.includes(ch)&&i>1&&i<n&&/[a-zA-Z]/.test(pw[i-2])&&/[a-zA-Z]/.test(pw[i]);
    const bc=sep?Math.log2(5):lp;if(dp[i-1]+bc<dp[i]){dp[i]=dp[i-1]+bc;back[i]={s:i-1,e:i,kind:sep?'separator':'random',g:sep?5:r.pool};}
    M.forEach(m=>{if(m.e===i){const v=dp[m.s]+Math.log2(m.g);if(v<dp[i]-1e-9){dp[i]=v;back[i]=m;}}});}
  const segs=[];let i=n;while(i>0){const b=back[i];segs.unshift(Object.assign({},b));i=b.s;}
  // merge neighbouring random characters into one stretch
  const merged=[];segs.forEach(sg=>{const last=merged[merged.length-1];if(last&&last.kind==='random'&&sg.kind==='random'){last.e=sg.e;last.g*=sg.g;}else merged.push(sg);});
  r.segs=merged;r.log2g=Math.min(dp[n],r.naive);r.bits=r.log2g;return r;}
const strengthWord=b=>b<28?'Very weak':b<36?'Weak':b<60?'Fair':b<80?'Strong':'Very strong';
const strengthCol=b=>b<28?PAL['s1']:b<36?PAL['s4']:b<60?PAL['s4']:PAL['s3'];
const KIND={common:'common password',word:'dictionary word',year:'year',keyboard:'keyboard pattern',sequence:'sequence',repeat:'repeated character',separator:'separator',random:'random characters'};

/* ---------- time formatting ---------- */
function fmtBig(n){if(!Number.isFinite(n))return '—';if(n<1e6)return Math.round(n).toLocaleString('en-US');const names=[[1e18,'quintillion'],[1e15,'quadrillion'],[1e12,'trillion'],[1e9,'billion'],[1e6,'million']];
  for(const [v,l] of names)if(n>=v&&n<v*1000)return (n/v).toPrecision(2).replace(/\.0$/,'')+' '+l;const e=Math.floor(Math.log10(n));return (n/Math.pow(10,e)).toFixed(1)+' × 10'+sup(e);}
const SUPD={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','.':'·'};
const sup=v=>String(v).split('').map(c=>SUPD[c]||c).join('');
function fmtTime(s){if(!Number.isFinite(s))return '—';if(s<1)return 'instantly';const Y=3.156e7;
  if(s<60)return Math.round(s)+' second'+(Math.round(s)===1?'':'s');if(s<3600){const m=Math.round(s/60);return m+' minute'+(m===1?'':'s');}
  if(s<86400){const h=Math.round(s/3600);return h+' hour'+(h===1?'':'s');}if(s<Y){const d=Math.round(s/86400);return d+' day'+(d===1?'':'s');}
  if(s>UNIVERSE)return 'longer than the age of the universe';const y=s/Y;if(y<1000)return Math.round(y)+' year'+(Math.round(y)===1?'':'s');return fmtBig(y)+' years';}

/* ---------- the breach case ---------- */
const SITE='Thistledown Pet Supply (fictional)';
const USERS=[{u:'mchen',pw:'sunshine1',salt:'a3f9c2e1'},{u:'aokafor',pw:'Bluebird#Kettle42',salt:'7d04be95'},{u:'jlarsen',pw:'sunshine1',salt:'e18c6a2f'},{u:'pdubois',pw:'123456',salt:'5b27d0c4'},
  {u:'rvega',pw:'maple-Orbit-candle',salt:'c9e3417a'},{u:'tnguyen',pw:'123456',salt:'02fa8d6e'},{u:'kbrooks',pw:'sunshine1',salt:'96b1e0d3'},{u:'sfarouk',pw:'p1zza&Pancake',salt:'4e7c29b8'}];
const ROUNDS=1000;let STORE_CACHE={};
function stored(scheme){if(STORE_CACHE[scheme])return STORE_CACHE[scheme];let v;
  if(scheme==='plain')v=USERS.map(x=>x.pw);else if(scheme==='hash')v=USERS.map(x=>sha256(x.pw));else if(scheme==='salt')v=USERS.map(x=>sha256(x.salt+x.pw));
  else v=USERS.map(x=>{let h=sha256(x.salt+x.pw);for(let i=1;i<ROUNDS;i++)h=sha256(h+x.salt);return h;});
  STORE_CACHE[scheme]=v;return v;}
function groups(scheme){const v=stored(scheme),m={};v.forEach((h,i)=>{(m[h]=m[h]||[]).push(i);});return Object.values(m);}
const RATE_OF={plain:Infinity,hash:1e10,salt:1e10,slow:1e4};
function commonTime(scheme){if(scheme==='plain')return 0;const per=1e7/RATE_OF[scheme];return scheme==='hash'?per:per*USERS.length;}
const RAND8=Math.pow(62,8);
const SCHEME_L={plain:'Plain text',hash:'Fast hash (SHA-256)',salt:'Salted hash',slow:'Salted slow hash'};

/* ---------- examples ---------- */
const EX={own:'',common:'sunshine',season:'Sunshine2024!',leet:'P@ssw0rd',kb:'qwerty123',low8:'hqzmtwrb',low12:'hqzmtwrbkfpd',r6:'tG7#qL',r12:'x9$Kp2!vR7&m',leet2:'Tr0ub!e7',phrase:'maple orbit candle river lantern'};
function setPw(sim,pw,gen){sim.st.pw=pw;sim.st.gen=gen||null;sim.st.an=analyze(pw);}
function curA(sim){return sim.st.an||analyze('');}

/* ---------- mode visibility ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}
function onEx(sim){if(sim.p.ex!=='own')setPw(sim,EX[sim.p.ex]||'');sim.infoDirty=true;}
function genPhrase(n){const out=[],buf=new Uint32Array(n);try{crypto.getRandomValues(buf);}catch(e){for(let i=0;i<n;i++)buf[i]=Math.floor(Math.random()*4294967296);}
  for(let i=0;i<n;i++)out.push(WORDS[buf[i]%W]);return out.join(' ');}

/* ---------- drawing helpers ---------- */
function fitText(ctx,s,maxW,size,weight,font){ctx.font=(weight||400)+' '+size+'px '+(font||FONT);if(ctx.measureText(s).width<=maxW)return s;let t=s;while(t.length>1&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);return t+'…';}
const LOGMIN=-1,LOGMAX=19;

const SIM={
  id:'passwords',hash:'passwords',apUnit:18,order:5,tab:'Passwords and hashing',kind:'Learning tool',prereq:['hashing'],next:['phishing'],
  card:'Test made-up passwords against three kinds of attack, then investigate a fictional breach where identical hashes give users away.',
  title:'Passwords and hashing: how strong is it really?',
  lede:{bio:'Type a made-up password and see how long an attacker would need to guess it. Then investigate a breached store and find out why the way a site stores passwords matters.',
        honors:'Separate the size of the character pool from the patterns people use, see what multi-factor authentication (MFA) adds, and compare plain, hashed, salted and slow-hashed storage.',
        ap:'Compute entropy H = L·log₂N, compare it with a pattern-aware guess count, and work out how salts and slow hashes change the attacker’s cost.'},
  scale:{bio:'One password of up to 64 characters. Attack speeds run from 10 guesses per hour to 10 billion per second, so the time axis is logarithmic.',
         ap:'Guess counts from 1 to more than 2¹²⁸. Each tick on the time axis is a factor of 10 to 1,000 or more.'},
  timeless:true,animated:true,graph:false,aspect:16/10,chChange:0.5,chReveal:1.5,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'test',lvl:'bio',noTrial:true,options:[{v:'test',l:'Try it yourself'},{v:'case',l:'Investigate a breach'}],onChange:syncMode},
    {id:'ex',label:'Start from an example',type:'select',def:'season',lvl:'bio',noTrial:true,modes:['test'],onChange:onEx,
      options:[{v:'own',l:'My own (type below the stage)'},{v:'common',l:'A common word'},{v:'season',l:'Word + year + symbol'},{v:'leet',l:'Word with swapped symbols'},{v:'kb',l:'Keyboard pattern'},{v:'low8',l:'8 random lowercase letters'},{v:'low12',l:'12 random lowercase letters'},{v:'r6',l:'6 random mixed characters'},{v:'r12',l:'12 random mixed characters'},{v:'leet2',l:'Short “complex” password'},{v:'phrase',l:'5 random words (passphrase)'}],
      help:'Examples are made up. To test your own idea, type it in the box below the stage.'},
    {id:'show',label:'Show the characters',type:'toggle',def:false,lvl:'bio',noTrial:true,modes:['test'],help:'Off shows only the kind of each character.',onChange(sim){sim.infoDirty=true;}},
    {id:'nw',label:'Words in a passphrase',type:'range',min:3,max:8,step:1,def:5,lvl:'honors',noTrial:true,modes:['test'],help:'Used by the passphrase button.'},
    {id:'mfa',label:'Account has multi-factor authentication (MFA)',type:'toggle',def:false,lvl:'honors',modes:['test'],help:'A code from your phone or a security key is needed as well as the password.'},
    {id:'store',label:'How the store saved passwords',type:'seg',def:'hash',lvl:'bio',noTrial:true,modes:['case'],options:[{v:'plain',l:'Plain text'},{v:'hash',l:'Fast hash'},{v:'salt',l:'Salted hash'},{v:'slow',l:'Salted slow hash'}],
      help:'Switch between storage methods and compare the stored column.',onChange(sim){sim.infoDirty=true;}}
  ],
  actions:[
    {id:'phrase',label:'Make a random passphrase',lvl:'bio',primary:true,modes:['test'],run(sim){const n=Math.round(sim.p.nw)||5;setPw(sim,genPhrase(n),n);sim.p.ex='own';if(sim.ui.ctl.ex)sim.ui.ctl.ex.set('own');}},
    {id:'clear',label:'Clear the password',lvl:'bio',modes:['test'],run(sim){setPw(sim,'');sim.p.ex='own';if(sim.ui.ctl.ex)sim.ui.ctl.ex.set('own');}},
    {id:'resetq',label:'Restart the case questions',lvl:'bio',modes:['case'],run(sim){sim.st.q={};}}
  ],
  init(sim){const st={pw:'',gen:null,an:null,q:{}};const ex=sim&&sim.p?sim.p.ex:'season';st.pw=EX[ex]||'';st.an=analyze(st.pw);return st;},
  step(){},
  metrics:[
    {id:'len',label:'Length',unit:'characters',lvl:'bio',min:0,max:32,d:0,modes:['test'],get:s=>curA(s).L},
    {id:'pool',label:'Character pool',unit:'symbols',lvl:'bio',min:0,max:195,d:0,modes:['test'],get:s=>curA(s).pool},
    {id:'naive',label:'Entropy if random, L·log₂N',unit:'bits',lvl:'honors',min:0,max:128,d:1,modes:['test'],get:s=>curA(s).naive},
    {id:'bits',label:'Pattern-aware strength',unit:'bits',lvl:'bio',min:0,max:128,d:1,modes:['test'],get:s=>curA(s).bits},
    {id:'word',label:'Rating',unit:'',lvl:'bio',text:true,modes:['test'],get:s=>curA(s).L?strengthWord(curA(s).bits):'Nothing typed'},
    {id:'tfast',label:'Time to guess, offline fast hash',unit:'',lvl:'bio',text:true,modes:['test'],get:s=>curA(s).L?fmtTime(Math.pow(2,curA(s).bits)/1e10):'—'},
    {id:'tslow',label:'Time to guess, offline slow hash',unit:'',lvl:'honors',text:true,modes:['test'],get:s=>curA(s).L?fmtTime(Math.pow(2,curA(s).bits)/1e4):'—'},
    {id:'uniq',label:'Different stored values',unit:'of 8',lvl:'bio',min:0,max:8,d:0,modes:['case'],get:s=>groups(s.p.store).length},
    {id:'shared',label:'Accounts sharing a value',unit:'accounts',lvl:'bio',min:0,max:8,d:0,modes:['case'],get:s=>groups(s.p.store).filter(g=>g.length>1).reduce((a,g)=>a+g.length,0)},
    {id:'tcommon',label:'Test 10 million common passwords on every account',unit:'',lvl:'bio',text:true,modes:['case'],get:s=>s.p.store==='plain'?'No guessing needed':fmtTime(commonTime(s.p.store)).replace('instantly','under a second')},
    {id:'trand',label:'Random 8-character password (letters, digits), one account',unit:'',lvl:'honors',text:true,modes:['case'],get:s=>s.p.store==='plain'?'No guessing needed':fmtTime(RAND8/RATE_OF[s.p.store])}
  ],
  narrate(sim){const p=sim.p,st=sim.st;
    if(p.mode==='case'){const g=groups(p.store),big=g.reduce((m,x)=>x.length>m.length?x:m,[]);
      if(p.store==='plain')return 'The store kept passwords as <b>plain text</b>, so the attacker can read every one with no guessing at all. Never acceptable.';
      if(p.store==='hash')return 'Each password went through SHA-256. Hashes cannot be reversed, but <b>the same password always gives the same hash</b>, so '+big.length+' accounts share one value. They chose the same password, probably a common one.';
      if(p.store==='salt')return 'Each account has its own random <b>salt</b> mixed in before hashing, so all 8 stored values differ, even for users with the same password. The attacker now has to attack each account separately.';
      return 'Salt plus a <b>slow hash</b>: each guess now costs about a million times more work, so testing guesses that took '+fmtTime(RAND8/1e10)+' with a fast hash now takes '+fmtTime(RAND8/1e4)+'.';}
    const a=curA(sim);if(!a.L)return 'Type a made-up password in the box below the stage, or pick an example. <b>Nothing you type is saved or sent.</b>';
    if(st.gen&&st.gen>0)return 'These '+st.gen+' words were picked at random from a list of '+W+' words, so the attacker needs up to '+W+'<sup>'+st.gen+'</sup> ≈ 2<sup>'+(st.gen*Math.log2(W)).toFixed(0)+'</sup> guesses. <b>Length from random words beats a short password full of symbols.</b>';
    const cnt={};a.segs.forEach(s=>{if(s.kind!=='random'&&s.kind!=='separator')cnt[s.kind]=(cnt[s.kind]||0)+1;});const kinds=Object.keys(cnt).map(k=>cnt[k]>1?cnt[k]+' '+KIND[k].replace('password','passwords').replace(/word$/,'words').replace(/year$/,'years').replace(/pattern$/,'patterns').replace(/sequence$/,'sequences').replace(/character$/,'characters'):'a '+KIND[k]);
    let s='Your '+a.L+' characters come from a pool of '+a.pool+', so a truly random password like it would need 2<sup>'+a.naive.toFixed(0)+'</sup> guesses.';
    if(kinds.length&&a.bits<a.naive-4)s+=' But it contains <b>'+(kinds.length>1?kinds.slice(0,-1).join(', ')+' and '+kinds[kinds.length-1]:kinds[0])+'</b>, which attackers try first: about 2<sup>'+a.bits.toFixed(0)+'</sup> guesses is enough.';
    else s+=' No common patterns found, so <b>length and pool size set the strength</b>.';
    if(atLeast('honors')&&p.mfa)s+=' With MFA on, a guessed password alone still cannot sign in.';
    return s;},
  infoPanel(sim){const p=sim.p,st=sim.st;
    if(p.mode==='case')return caseHTML(sim);
    const a=curA(sim);let h='<div class="p-head"><h3>Test a password</h3></div>';
    h+='<p style="padding:8px 10px;border-left:4px solid var(--good);background:var(--card2);border-radius:6px"><b>Private by design.</b> What you type stays in this tab’s memory only. It is never saved, never put in the data table, and never sent anywhere. Even so, type a made-up password, not one you really use.</p>';
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0"><label for="pw-in" style="font-weight:600">Password to test</label>'+
       '<input id="pw-in" type="text" class="sel" maxlength="64" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" aria-describedby="pw-note" style="flex:1 1 180px;min-width:0;font-size:17px;padding:6px 10px;font-family:'+MONO.replace(/"/g,'&quot;')+(p.show?'':';-webkit-text-security:disc')+'">'+
       '<button type="button" class="btn" id="pw-clear">Clear</button></div><p id="pw-note" class="status" style="margin-top:0">Up to 64 characters. The stage updates as you type.</p>';
    h+='<div id="pw-live">'+liveHTML(sim,a)+'</div>';return h;},
  bindInfo(sim,el){const inp=el.querySelector('#pw-in');
    if(inp){inp.value=sim.st.pw;inp.addEventListener('input',()=>{setPw(sim,inp.value);if(sim.p.ex!=='own'){sim.p.ex='own';sim.ui.ctl.ex.set('own');}const live=el.querySelector('#pw-live');if(live)live.innerHTML=liveHTML(sim,curA(sim));});
      el.querySelector('#pw-clear').addEventListener('click',()=>{setPw(sim,'');inp.value='';sim.p.ex='own';sim.ui.ctl.ex.set('own');const live=el.querySelector('#pw-live');if(live)live.innerHTML=liveHTML(sim,curA(sim));inp.focus();});}
    el.querySelectorAll('button[data-q]').forEach(b=>b.addEventListener('click',()=>{const q=CASEQ.find(x=>x.id===b.dataset.q);sim.st.q[q.id]=+b.dataset.i;sim.infoDirty=true;BioLab.refresh(sim);}));},
  onLevel(sim){syncMode(sim);},
  tour:[
    {title:'Every character comes from a pool',text:{bio:'Each box is one character, colored by its kind: lowercase, uppercase, digit or symbol. The pool is how many characters the attacker has to consider for each position.',ap:'Pool N = 26 (a–z) + 26 (A–Z) + 10 (0–9) + 33 (symbols and space) = 95 when all four kinds appear.'},
      focus:s=>[6,34,788,58],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'test',ex:'r6',show:true});}},
    {title:'Length multiplies the guesses',text:{bio:'Twelve random lowercase letters beat eight: each extra letter multiplies the guesses by 26. Watch the bars on the time chart jump to the right.',ap:'Guesses = N<sup>L</sup>, so entropy H = L·log₂N bits. Each extra lowercase letter adds log₂26 ≈ 4.7 bits.'},
      focus:s=>s.vis.rChart,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{ex:'low12'});}},
    {title:'Patterns give passwords away',text:'This one has all four kinds of character, but it is a common password with a capital letter, a year and a symbol. Attackers try exactly these patterns first, so the real strength is far lower than the pool suggests.',
      focus:s=>s.vis.rTop,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{ex:'season'});}},
    {title:'Three kinds of attack',text:{bio:'Online, the site locks the account after a few wrong tries. Offline, the attacker has stolen the stored hashes and guesses on their own computer, as fast as the hash allows.',honors:'Fast hashes like SHA-256 allow about 10 billion guesses per second on one GPU. Slow hashes like bcrypt allow about 10,000.'},
      focus:s=>s.vis.rChart,speed:1,pause:true},
    {title:'Passphrases: length from random words',text:'Five words picked at random from a list are easy to remember and hard to guess, because the attacker has to try every combination of words. Press the passphrase button to make your own.',
      focus:[6,8,788,486],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{ex:'phrase'});}},
    {lvl:'honors',title:'MFA blocks a stolen password',text:'With multi-factor authentication, a correct password is not enough to sign in online. The attacker also needs your phone or security key. Offline cracking can still reveal the password, which is why you should never reuse one.',
      focus:s=>s.vis.rChart,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mfa:true,ex:'season'});}},
    {title:'Investigate: identical hashes',text:'A fictional pet store stored each password as a SHA-256 hash. The same password always gives the same hash, so matching colors in the stored column show customers who share a password.',
      focus:s=>s.vis.rTable,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',store:'hash',mfa:false});}},
    {title:'A salt makes every hash different',text:{bio:'Mixing a random salt into each password before hashing makes every stored value different. The attacker can no longer spot shared passwords or test one guess against all accounts at once.',ap:'Salted: stored = SHA-256(salt ‖ password). One guess now has to be hashed once per account, and precomputed tables are useless.'},
      focus:s=>s.vis.rTable,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{store:'salt'});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'test',ex:'season',show:false,mfa:false,store:'hash'});},
  onChallenge(sim,ch,phase){if(ch&&ch.set)BioLab.setValues(sim,ch.set);},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'test',ex:'low12'},q:'Which is harder to guess: 8 random lowercase letters, or 12 random lowercase letters?',choices:['8 letters, because short passwords are harder to see','12 letters','They are about the same'],correct:1,
     explain:{bio:'26⁸ ≈ 209 billion guesses takes '+fmtTime(Math.pow(26,8)/1e10)+' with a fast hash. 26¹² ≈ 95 quadrillion takes '+fmtTime(Math.pow(26,12)/1e10)+'. Each extra letter multiplies the work by 26.'}},
    {lvl:'bio',instant:true,set:{mode:'test',ex:'season'},q:'“Sunshine2024!” has uppercase, lowercase, digits and a symbol. How strong is it really?',choices:['Very strong: it uses all four kinds of character','Weak: it is a common password plus a year and a symbol','Medium: it is long enough'],correct:1,
     explain:{bio:'If it were random it would have '+analyze(EX.season).naive.toFixed(0)+' bits. But attackers try common passwords with a capital, a year and a symbol first, so it falls after about 2^'+analyze(EX.season).bits.toFixed(0)+' guesses: '+fmtTime(Math.pow(2,analyze(EX.season).bits)/1e10)+' offline.'}},
    {lvl:'bio',instant:true,set:{mode:'test',ex:'phrase'},q:'Which is harder to guess: “Tr0ub!e7” or five words picked at random, like “maple orbit candle river lantern”?',choices:['Tr0ub!e7, because it has symbols','The five random words','Neither: both are weak'],correct:1,
     explain:{bio:'Tr0ub!e7 is a dictionary word with predictable swaps: about 2^'+analyze(EX.leet2).bits.toFixed(0)+' guesses. Five random words from our '+W+'-word list need about 2^'+(5*Math.log2(W)).toFixed(0)+'. Length from random words wins, and it is easier to remember.'}},
    {lvl:'honors',instant:true,set:{mode:'test',ex:'season',mfa:true},q:'Your password leaked in another site’s breach. Your account here has MFA turned on. Can the attacker sign in with the password alone?',choices:['Yes, the password is all they need','No, they also need your second factor','Only if the password is short'],correct:1,
     explain:{honors:'MFA needs something you have (a phone or security key) as well as something you know. The leaked password alone fails. Change it anyway, and anywhere you reused it, because other sites may not have MFA.'}},
    {lvl:'honors',instant:true,set:{mode:'case',store:'hash'},q:'On a site with fast, unsalted hashes, two customers chose the same password. Their stored hashes are…',choices:['different, because each account is hashed separately','identical','partly the same'],correct:1,
     explain:{honors:'A hash function always gives the same output for the same input. In the case table, three accounts share one SHA-256 value, a clear sign of a common password like “sunshine1”.'}},
    {lvl:'honors',instant:true,set:{mode:'case',store:'salt'},q:'The store adds a salt but keeps a fast hash. How long does it take to test the 10 million most common passwords against one account?',choices:['About a millisecond: salt does not slow down each guess','About a year','Forever: salted hashes cannot be guessed'],correct:0,
     explain:{honors:'10⁷ guesses ÷ 10¹⁰ guesses per second = 1 ms per account. Salt stops shared-hash spotting and precomputed tables, but only a slow hash makes each guess expensive.'}},
    {lvl:'ap',instant:true,set:{mode:'test',ex:'r12'},q:'A password is 10 characters chosen at random from a pool of 62 (letters and digits). What is its entropy?',choices:['62 bits','About 59.5 bits','About 6 bits','620 bits'],correct:1,
     explain:{ap:'H = L·log₂N = 10 × log₂62 = 10 × 5.954 = 59.5 bits, so up to 2^59.5 ≈ 8.4 × 10¹⁷ guesses.'}},
    {lvl:'ap',instant:true,set:{mode:'case',store:'slow'},q:'Guessing a random 8-character letters-and-digits password takes about 6 hours against a fast hash (10¹⁰ guesses/s). With a slow hash (10⁴ guesses/s) it takes about…',choices:['6.5 hours','6 days','700 years'],correct:2,
     explain:{ap:'62⁸ = 2.18 × 10¹⁴ guesses. ÷ 10¹⁰/s = 2.18 × 10⁴ s ≈ 6 hours. ÷ 10⁴/s = 2.18 × 10¹⁰ s ≈ 690 years. The slow hash multiplies the cost by 10⁶ while a real user waits only a fraction of a second at sign-in.'}},
    {lvl:'ap',instant:true,set:{mode:'test',ex:'r12'},q:'Adding one more random character from a 95-character pool multiplies the number of guesses by…',choices:['2','95','6.6'],correct:1,
     explain:{ap:'Guesses = N<sup>L</sup>, so one more character multiplies by N = 95. In bits, it adds log₂95 ≈ 6.6 bits.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which matters more for a password: length or using lots of different kinds of characters?</p><ol><li>Pick “8 random lowercase letters” and record a trial.</li><li>Pick “6 random mixed characters” and record.</li><li>Pick “12 random lowercase letters” and “5 random words” and record each.</li><li>Type three made-up passwords of your own, recording each.</li></ol><p>Rank your passwords by strength (bits). Write two rules for making a strong password you can remember.</p>',
       honors:'<p><b>Question:</b> How much do patterns and MFA change real-world strength?</p><ol><li>For each example, record the entropy if random and the pattern-aware strength.</li><li>Compute the gap in bits for each and explain what pattern caused it.</li><li>Switch to the breach investigation and answer the case questions under the stage.</li></ol><p>Write a short advice note to the fictional store’s customers: what they should change and why MFA helps.</p>',
       ap:'<p><b>Question:</b> How do password length, pool size and the hash function combine to set an attacker’s cost?</p><ol><li>Record random lowercase passwords of length 6, 8, 10 and 12 (type them).</li><li>Plot length (x) against pattern-aware bits (y). Find the slope and compare it with log₂26.</li><li>For a 50-bit password, compute the worst-case time against a fast and a slow hash.</li></ol><p><b>Claim–evidence–reasoning:</b> A site can either require 2 more characters or switch to a slow hash. Which raises the attacker’s cost more? Support your claim with numbers.</p>'},
  terms:[{t:'Brute force',d:'Trying every possible password until one works.'},{t:'Dictionary attack',d:'Trying common passwords and words first, with common changes like a capital letter or a year at the end.'},{t:'Passphrase',d:'A password made of several random words. Long, easy to remember, hard to guess.'},
    {t:'Hash',d:'A one-way function that turns any input into a fixed-length value. The same input always gives the same hash, and you cannot run it backward.'},{t:'Salt',d:'A random value stored with each account and mixed into the password before hashing, so identical passwords get different hashes.'},
    {t:'Online vs offline attack',d:'Online: guessing through the real sign-in page, which can lock the account. Offline: guessing against stolen hashes on the attacker’s own computer.'},
    {lvl:'honors',t:'Multi-factor authentication (MFA)',d:'Signing in needs two kinds of proof, such as a password and a code from your phone or a security key.'},{lvl:'honors',t:'Slow hash',d:'A hash designed to take a lot of work per guess (bcrypt, scrypt, Argon2), so offline guessing becomes very expensive.'},
    {lvl:'ap',t:'Entropy',d:'H = L·log₂N bits for a password of L characters chosen at random from a pool of N. Each bit doubles the guesses.'},{lvl:'ap',t:'Credential stuffing',d:'Trying username and password pairs leaked from one site on other sites. Defeated by unique passwords and MFA.'}],
  about:'<p><b>Privacy.</b> The password you type lives only in this page’s memory. It is not saved to the browser, not added to the data table (which records only lengths, bit counts and times), and nothing on this page makes a network request.</p>'+
    '<p><b>Entropy if random</b> is H = L·log₂N, where N adds 26 for lowercase, 26 for uppercase, 10 for digits, 33 for symbols and space, and 100 for any other character. It is correct only if every character was picked at random.</p>'+
    '<p><b>Pattern-aware strength</b> is a simplified version of the estimate used by tools like zxcvbn. The password is split into the cheapest pieces: a common password from a built-in list of about '+COMMON.length+' (guesses = its rank), a dictionary word from a built-in list of '+W+' words (guesses = '+W+'), with ×2 for a capital and ×2 per symbol swap like @ for a; a year (90); a keyboard run (50 per character); a sequence (20 per character); a repeat; and random characters (N each). Guesses multiply. Real attackers use word lists of millions of words and leaked passwords, so a word missing from our short list is scored as random letters and looks stronger here than it really is.</p>'+
    '<p><b>Attack speeds</b> are round numbers: online with lockout about 10 guesses per hour; one current gaming GPU about 10¹⁰ SHA-256 guesses per second; bcrypt at a typical work factor about 10⁴ per second. Times are worst case (every guess tried); on average an attacker succeeds in half that time.</p>'+
    '<p><b>The breach case</b> is fictional. The stored values are real SHA-256 hashes computed in this page. The “slow hash” here repeats SHA-256 '+ROUNDS.toLocaleString('en-US')+' times so you can see it work; real sites use bcrypt, scrypt or Argon2 tuned to take about a tenth of a second per sign-in. This page explains cracking only as arithmetic. It contains no cracking tool.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,H);
    if(sim.p.mode==='case')drawCase(sim,ctx,k);else drawTest(sim,ctx,k);
    txt(ctx,k>1.3?'All made up.':'All people, sites and passwords here are made up.',790,H-8,{s:11*k,c:PAL['cv-soft'],a:'right'});},
  thumbSetup(sim){sim.p.ex='season';setPw(sim,EX.season);}
};

/* ---------- info panel pieces ---------- */
function liveHTML(sim,a){if(!a.L)return '<p class="status">Nothing typed yet.</p>';const ap=atLeast('ap');
  let h='<p><b>What an attacker sees:</b></p><ul style="margin:0 0 8px;padding-left:20px;font-size:15px">';
  a.segs.forEach(sg=>{const len=sg.e-sg.s,ex=[];if(sg.cap)ex.push('×2 for capital letters');if(sg.leet)ex.push('×'+Math.pow(2,sg.leet)+' for symbol swaps');
    h+='<li>'+KIND[sg.kind][0].toUpperCase()+KIND[sg.kind].slice(1)+' ('+len+' character'+(len>1?'s':'')+'): about '+fmtBig(sg.g)+' guess'+(sg.g>=1.5?'es':'')+(ex.length?' ('+ex.join(', ')+')':'')+'</li>';});
  h+='</ul><p>Total: about <b>'+fmtBig(Math.pow(2,a.bits))+'</b> guesses ('+a.bits.toFixed(1)+' bits). Rating: <b>'+strengthWord(a.bits)+'</b>.</p>';
  if(ap){const st=sim.st;h+='<p style="font-size:14px">H = L·log₂N = '+a.L+' × log₂'+a.pool+' = '+a.naive.toFixed(1)+' bits if random. Pattern estimate = log₂(product of the guesses above) = '+a.bits.toFixed(1)+' bits. Time = 2<sup>H</sup> ÷ rate.</p>';
    const hx=sha256(st.pw),hs=sha256('5f1c09ab'+st.pw);
    h+='<p style="font-size:14px">What a site would store:<br>SHA-256(password) = <code style="word-break:break-all">'+hx+'</code><br>SHA-256(salt 5f1c09ab ‖ password) = <code style="word-break:break-all">'+hs+'</code><br>Change one character and both hashes change completely.</p>';}
  return h;}
const CASEQ=[
  {id:'q1',lvl:'bio',need:'hash',q:'1. With the fast hash, how many different passwords do these 8 customers have?',ch:['8','5','3','2'],ans:()=>['8','5','3','2'].indexOf(String(groups('hash').length)),
    ok:()=>'Correct. Only '+groups('hash').length+' different stored values, so only '+groups('hash').length+' different passwords. Same password in, same hash out.'},
  {id:'q2',lvl:'bio',need:'hash',q:'2. Three customers share one hash. What should the store do first?',ch:['Nothing: hashes cannot be reversed','Make those three reset first: a shared password is probably a common one attackers try early','Delete their accounts'],ans:()=>1,
    ok:()=>'Correct. A password many people share is almost always on attackers’ lists. Those accounts fall first, so they reset first.'},
  {id:'q3',lvl:'bio',need:'salt',q:'3. Switch to “Salted hash”. How many stored values match each other now?',ch:['None: every value is different','The same three still match','All eight match'],ans:()=>groups('salt').every(g=>g.length===1)?0:1,
    ok:()=>'Correct. Each salt is different, so even identical passwords give different hashes. An attacker can no longer spot shared passwords or test one guess against every account at once.'},
  {id:'q4',lvl:'honors',need:'slow',q:'4. Switch to “Salted slow hash”. About how long does testing 10 million common passwords take now, for one account?',ch:['Under a second','About 17 minutes','About 100 years'],ans:()=>1,
    ok:()=>'Correct. 10⁷ ÷ 10⁴ guesses per second = 1,000 s ≈ 17 minutes per account, and '+fmtTime(commonTime('slow'))+' for all 8. A strong random password still holds out for centuries.'},
  {id:'q5',lvl:'ap',need:null,q:'5. Can the investigator run SHA-256 backward to read a customer’s password from its hash?',ch:['Yes, with enough computing power','No: a hash is one-way; the only route is guessing inputs and comparing outputs','Only for short passwords'],ans:()=>1,
    ok:()=>'Correct. SHA-256 throws information away (any input becomes 256 bits), so there is no inverse. Attackers can only guess, which is why guess cost is everything.'}];
function caseHTML(sim){const st=sim.st,p=sim.p;let h='<div class="p-head"><h3>Case file: breach at '+SITE+'</h3></div>';
  h+='<p>An attacker copied the store’s customer table. You are the investigator: work out what the attacker can learn and which customers must act first. Use the storage switch beside the stage.</p>';
  CASEQ.filter(q=>atLeast(q.lvl)).forEach(q=>{const pick=st.q[q.id],done=pick!==undefined,right=done&&pick===q.ans();
    h+='<div style="border-top:1px solid var(--line);padding-top:8px;margin-top:8px"><p style="font-weight:600">'+q.q+'</p>';
    if(q.need&&p.store!==q.need&&!done)h+='<p class="status" style="margin:0 0 6px">Set the storage switch to “'+SCHEME_L[q.need]+'” to see the evidence.</p>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:6px">'+q.ch.map((c,i)=>'<button type="button" class="btn'+(done&&i===pick?' primary':'')+'" data-q="'+q.id+'" data-i="'+i+'">'+c+'</button>').join('')+'</div>';
    if(done)h+='<p class="verdict '+(right?'ok':'no')+'" style="margin-top:6px">'+(right?'Correct.':'Not yet.')+'</p><p>'+(right?q.ok():'Look at the stored column again with the switch on “'+SCHEME_L[q.need||'hash']+'”.')+'</p>';
    h+='</div>';});
  const n=CASEQ.filter(q=>atLeast(q.lvl)),ok=n.filter(q=>st.q[q.id]===q.ans()).length;
  h+='<p class="status">Case questions correct: '+ok+' of '+n.length+'.</p>';return h;}

/* ---------- stage: test a password ---------- */
const H=500;
function drawTest(sim,ctx,k){const st=sim.st,p=sim.p,a=curA(sim),hon=atLeast('honors'),chars=[...st.pw],ks=Math.min(k,1.5),small=k>1.3;
  const sw=a.L?strengthWord(a.bits):'';ctx.font='700 '+(13*k)+'px '+FONT;const pw=a.L?ctx.measureText(sw).width+14*k+8:0;
  txt(ctx,fitText(ctx,small?'Kept in memory only, never saved or sent':'Your password · kept in memory only, never saved or sent',800-24-pw-10,13*k,600),12,22,{s:13*k,w:600,c:PAL['cv-soft']});
  if(a.L)pill(ctx,sw,788-pw/2+4,20,strengthCol(a.bits),'#fff',13*k);
  // character boxes
  const L=chars.length,maxN=L>(small?20:32)?(small?19:31):(small?20:32),shown=Math.min(L,maxN),slots=shown+(L>maxN?1:0),bw=slots?Math.min(46,(776-(slots-1)*3)/slots):46,y0=small?48:40,bh=46;
  if(!L){rr(ctx,12,y0,776,bh,8);ctx.strokeStyle=PAL['line'];ctx.setLineDash([6,5]);ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
    txt(ctx,small?'Type below the stage or pick an example':'Type in the box below the stage, or pick an example',400,y0+bh/2+1,{s:15*k,c:PAL['cv-soft'],a:'center',b:'middle'});}
  if(L>maxN){const x=12+shown*(bw+3);rr(ctx,x,y0,bw,bh,6);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();txt(ctx,'+'+(L-maxN),x+bw/2,y0+bh/2+1,{s:Math.min(13*k,bw*0.5),w:700,c:PAL['cv-soft'],a:'center',b:'middle'});}
  for(let i=0;i<shown;i++){const c=chars[i],cl=classOf(c),x=12+i*(bw+3);rr(ctx,x,y0,bw,bh,6);ctx.fillStyle=CLS[cl].c;ctx.fill();
    const g=p.show?(c===' '?'␣':c):CLS[cl].g;txt(ctx,g,x+bw/2,y0+bh/2+1,{s:Math.min(22*ks,bw*0.62),w:700,c:'#fff',a:'center',b:'middle'});}
  // pattern brackets with labels in up to two rows
  let y=y0+bh+8;const lh=15*k;
  if(L){const segs=a.segs.filter(s=>s.s<maxN);const rows=[[],[]];let used=0;
    segs.forEach(sg=>{const x1=12+sg.s*(bw+3),x2=12+Math.min(sg.e,maxN)*(bw+3)-3,cx=(x1+x2)/2;let lab=KIND[sg.kind];if(small&&sg.kind==='random')lab='random';if(small&&sg.kind==='common')lab='common';if(small&&sg.kind==='keyboard')lab='keyboard';if(small&&sg.kind==='dictionary word')lab='word';
      if(sg.kind==='word')lab=small?'word':'dictionary word';
      const col=sg.kind==='random'?PAL['cv-soft']:sg.kind==='separator'?PAL['muted']:PAL['s1'];
      ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1+1,y);ctx.lineTo(x1+1,y+6);ctx.lineTo(x2-1,y+6);ctx.lineTo(x2-1,y);ctx.stroke();
      if(sg.kind==='separator')return;ctx.font='700 '+(12*k)+'px '+FONT;const w=ctx.measureText(lab).width,lx=clamp(cx,12+w/2,788-w/2);
      let row=0;while(row<2&&rows[row].some(r=>!(lx+w/2+8<r[0]||lx-w/2-8>r[1])))row++;if(row>=2)return;rows[row].push([lx-w/2,lx+w/2]);used=Math.max(used,row+1);
      txt(ctx,lab,lx,y+8+lh*(row+1)-3,{s:12*k,w:700,c:col,a:'center'});});
    y+=8+lh*Math.max(1,used)+10;}else y+=8+lh+10;
  // strength bars (bits)
  ctx.font='600 '+(13*k)+'px '+FONT;const labs=hon?['If random','With patterns']:['Strength'],BX=12+Math.max(...labs.map(l=>ctx.measureText(l).width))+12,BW=770-BX,X=b=>BX+clamp(b/128,0,1)*BW,bh2=16*ks;
  const bar=(yy,b,label,col)=>{txt(ctx,label,BX-10,yy+bh2/2,{s:13*k,w:600,a:'right',b:'middle'});rr(ctx,BX,yy,BW,bh2,5);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();
    if(b>0){rr(ctx,BX,yy,Math.max(8,X(b)-BX),bh2,5);ctx.fillStyle=col;ctx.fill();}const lbl=b.toFixed(0)+' bits';ctx.font='700 '+(13*k)+'px '+FONT;const lw=ctx.measureText(lbl).width;
    const inside=X(b)-BX>lw+16;txt(ctx,lbl,inside?X(b)-8:X(b)+8,yy+bh2/2+1,{s:13*k,w:700,c:inside?'#fff':PAL['cv-ink'],a:inside?'right':'left',b:'middle'});};
  if(hon){bar(y,a.naive,labs[0],PAL['s2']);y+=bh2+8;bar(y,a.bits,labs[1],a.L?strengthCol(a.bits):PAL['muted']);y+=bh2;}
  else{bar(y,a.bits,labs[0],a.L?strengthCol(a.bits):PAL['muted']);y+=bh2;}
  sim.vis.rTop=[6,8,788,y+8];y+=4+12*k;[0,32,64,96,128].forEach(b=>txt(ctx,b===128?'128 bits':String(b),X(b),y,{s:11*k,c:PAL['cv-soft'],a:b===128?'right':'center'}));y+=8*k;
  // time chart
  y+=14*k;txt(ctx,'Time to try every possibility',12,y,{s:14*k,w:700});y+=10;
  const rl=small?['Online','Offline, fast','Offline, slow']:RATES.map(r=>r.l);ctx.font='600 '+(13*k)+'px '+FONT;
  const RX=12+Math.max(...rl.map(l=>ctx.measureText(l).width))+12,RW=770-RX,TX=lg=>RX+clamp((lg-LOGMIN)/(LOGMAX-LOGMIN),0,1)*RW,rh=24*ks,gap=clamp((H-28-y-rh*3-18*k-(small?0:26))/3,10,22);
  const T0=y,TH=3*rh+3*gap;sim.vis.rChart=[6,T0-14-14*k,788,TH+30+28*k];
  const marks=small?[[0,'1 s'],[Math.log10(3.156e7),'1 yr'],[Math.log10(UNIVERSE),'universe']]:[[0,'1 s'],[Math.log10(3600),'1 hr'],[Math.log10(3.156e7),'1 yr'],[Math.log10(3.156e10),'1,000 yr'],[Math.log10(UNIVERSE),'age of universe']];
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.setLineDash([3,4]);marks.forEach(m=>{ctx.beginPath();ctx.moveTo(TX(m[0]),T0);ctx.lineTo(TX(m[0]),T0+TH);ctx.stroke();});ctx.setLineDash([]);
  marks.forEach((m,i)=>txt(ctx,m[1],TX(m[0]),T0+TH+14*k,{s:12*k,c:PAL['cv-soft'],a:i===marks.length-1?'right':i===0?'left':'center'}));
  if(!small)txt(ctx,'Speeds: online about 10 guesses per hour · fast hash about 10¹⁰ per second · slow hash about 10⁴ per second',12,T0+TH+40,{s:12*k,c:PAL['cv-soft']});
  const G=a.L?Math.pow(2,a.bits):0;
  RATES.forEach((R,i)=>{const yy=T0+gap/2+i*(rh+gap),col=[PAL['s3'],PAL['s1'],PAL['s2']][i];txt(ctx,rl[i],RX-10,yy+rh/2,{s:13*k,w:600,a:'right',b:'middle'});
    if(!a.L)return;
    if(R.id==='online'&&hon&&sim.p.mfa){rr(ctx,RX,yy,RW,rh,6);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();txt(ctx,small?'Blocked by MFA':'Blocked by MFA: the password alone cannot sign in',RX+10,yy+rh/2+1,{s:13*k,w:700,c:PAL['s3'],b:'middle'});return;}
    const sec=G/R.r,lg=sec>0?Math.log10(sec):LOGMIN,x=TX(lg);rr(ctx,RX,yy,Math.max(10,x-RX),rh,6);ctx.fillStyle=col;ctx.fill();
    if(lg>LOGMAX){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(RX+RW,yy-3);ctx.lineTo(RX+RW+12,yy+rh/2);ctx.lineTo(RX+RW,yy+rh+3);ctx.fill();}
    let lab=fmtTime(sec);if(small&&lab.startsWith('longer'))lab='> age of universe';ctx.font='700 '+(13*k)+'px '+FONT;const lw=ctx.measureText(lab).width,inside=x-RX>lw+18;
    txt(ctx,lab,inside?x-8:Math.min(x+10,RX+RW-lw),yy+rh/2+1,{s:13*k,w:700,c:inside?'#fff':PAL['cv-ink'],a:inside?'right':'left',b:'middle'});});}

/* ---------- stage: breach case ---------- */
function hashCol(h){const v=parseInt(h.slice(0,6),16)||0,hue=v%360;return 'hsl('+hue+',55%,40%)';}
function drawCase(sim,ctx,k){const sc=sim.p.store,vals=stored(sc),gs=groups(sc),hon=atLeast('honors'),small=k>1.3,fs=Math.min(14*k,22);
  ctx.font='700 '+(13*k)+'px '+FONT;const pl=small?{plain:'Plain text',hash:'Fast hash',salt:'Salted',slow:'Slow + salt'}[sc]:SCHEME_L[sc],pw=ctx.measureText(pl).width+14*k+8;
  txt(ctx,fitText(ctx,small?'Copied customer table (fictional store)':'Customer table copied from '+SITE,800-24-pw-10,15*k,700),12,24,{s:15*k,w:700});
  pill(ctx,pl,788-pw/2+4,22,sc==='plain'?PAL['s1']:sc==='slow'?PAL['s3']:PAL['s2'],'#fff',13*k);
  const salted=sc==='salt'||sc==='slow',top=46;ctx.font='600 '+fs+'px '+FONT;let uw=Math.max(...USERS.map(u=>ctx.measureText(u.u).width));ctx.font='700 '+(12*k)+'px '+FONT;uw=Math.max(uw,ctx.measureText('Customer').width-10);
  const xs=12+10+uw+18;ctx.font='600 '+fs+'px '+MONO;const sw=ctx.measureText('a3f9c2e1').width;const xv=salted?xs+sw+18:xs,brW=small?62:150,rowR=800-brW-14;
  const chip=Math.round(fs*0.9),chars=Math.max(6,Math.floor((rowR-xv-chip-18)/ctx.measureText('0').width)-1);
  txt(ctx,'Customer',22,top+12,{s:12*k,w:700,c:PAL['cv-soft']});if(salted)txt(ctx,'Salt',xs,top+12,{s:12*k,w:700,c:PAL['cv-soft']});
  txt(ctx,sc==='plain'?'Stored password':small?'Stored hash (start)':'Stored value (first '+Math.min(16,chars)+' of 64 hex digits)',xv,top+12,{s:12*k,w:700,c:PAL['cv-soft']});
  const rh=Math.max(38,fs+16),y0=top+22;
  USERS.forEach((u,i)=>{const y=y0+i*rh;rr(ctx,12,y,rowR-12,rh-5,6);ctx.fillStyle=i%2?PAL['cv-bg2']:PAL['card'];ctx.fill();const ym=y+(rh-5)/2+1;
    txt(ctx,u.u,22,ym,{s:fs,w:600,b:'middle'});if(salted){ctx.font='500 '+fs+'px '+MONO;ctx.fillStyle=PAL['cv-soft'];ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(u.salt,xs,ym);}
    const v=vals[i];if(sc==='plain'){txt(ctx,v,xv,ym,{s:fs,w:700,c:PAL['s1'],b:'middle'});}
    else{rr(ctx,xv,ym-chip/2,chip,chip,4);ctx.fillStyle=hashCol(v);ctx.fill();ctx.font='600 '+fs+'px '+MONO;ctx.fillStyle=PAL['cv-ink'];ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(v.slice(0,Math.min(16,chars))+'…',xv+chip+10,ym);}});
  const multi=gs.filter(g=>g.length>1);multi.forEach((g,j)=>{const ys=g.map(i=>y0+i*rh+(rh-5)/2),col=j?PAL['s4']:PAL['s1'],bx=rowR+12+j*(small?14:22);ctx.strokeStyle=col;ctx.lineWidth=2.5;
    ctx.beginPath();ys.forEach(y=>{ctx.moveTo(rowR+2,y);ctx.lineTo(bx,y);});ctx.moveTo(bx,Math.min(...ys));ctx.lineTo(bx,Math.max(...ys));ctx.stroke();
    const my=(Math.min(...ys)+Math.max(...ys))/2;txt(ctx,small?'×'+g.length:g.length+' identical',bx+6,my,{s:13*k,w:700,c:col,b:'middle'});});
  if(sc!=='plain'&&!multi.length){ctx.save();ctx.translate(rowR+brW/2+6,y0+4*rh);ctx.rotate(-Math.PI/2);txt(ctx,'No two match',0,0,{s:13*k,w:700,c:PAL['s3'],a:'center',b:'middle'});ctx.restore();}
  let y=y0+8*rh+16*k;sim.vis.rTable=[6,top-6,788,8*rh+30];
  if(sc==='plain')txt(ctx,small?'Every password is readable.':'Every password is readable. The attacker needs no guessing at all.',12,y,{s:14*k,w:700,c:PAL['s1']});
  else{const t=fmtTime(commonTime(sc)).replace('instantly','under a second');txt(ctx,small?'10 million common guesses, all accounts: '+t:'10 million common guesses vs. all 8 accounts: '+t+(sc==='hash'?' (one hash per guess checks every account)':''),12,y,{s:13.5*k,w:600});
    if(hon){y+=18*k;txt(ctx,(small?'Random 8 characters, one account: ':'Random 8-character password, one account: ')+fmtTime(RAND8/RATE_OF[sc]),12,y,{s:13*k,c:PAL['cv-soft']});}}}

SIM.controls[0].onChange=syncMode;
BioLab.register(SIM);
})();

(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,RM,axes,legend,serColor,rng}=BioLab.h;
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,"DejaVu Sans Mono",monospace';
function mt(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||600)+' '+(o.s||13)+'px '+MONO;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MS='font-family:'+MONO.replace(/"/g,"'");
/* ---------- the fictional network ---------- */
const MSPS=30;        // model milliseconds per real second at 1× (slow motion so packets are visible)
const FF=12;          // waiting with nothing moving on a wire runs 12× faster
const NODES={L:{x:52,y:225,host:1},R1:{x:132,y:225},R2:{x:222,y:130},R3:{x:222,y:318},R4:{x:332,y:80},R5:{x:336,y:225},R6:{x:332,y:362},
  R7:{x:452,y:132},R8:{x:452,y:318},R9:{x:566,y:192},R10:{x:664,y:225},S:{x:752,y:225,host:1},D:{x:104,y:342,host:1}};
const ORDER=Object.keys(NODES);const IDX={};ORDER.forEach((n,i)=>IDX[n]=i);
const LINKS=[['L','R1',2],['R1','R2',8],['R1','R3',8],['R2','R4',6],['R2','R5',7],['R3','R5',7],['R3','R6',6],['R4','R7',9],['R5','R7',8],['R5','R8',8],['R6','R8',9],['R7','R8',6],
  ['R7','R9',7],['R8','R9',7],['R9','R10',4],['R8','R10',14],['R10','S',1],['R3','D',3]];
const lk=(a,b)=>IDX[a]<IDX[b]?a+'-'+b:b+'-'+a;
const NB={};ORDER.forEach(n=>NB[n]=[]);LINKS.forEach(([a,b,w])=>{NB[a].push([b,w]);NB[b].push([a,w]);});
const isRouter=n=>n[0]==='R';
const IP={L:'192.168.1.23',NAT:'198.51.100.7',S:'203.0.113.80',D:'198.51.100.53',NS:'203.0.113.53'};
const ipOf=n=>IP[n]||('10.0.'+n.slice(1)+'.1');
const SITE='www.lunarlibrary.test';
const CASES=[
  {t:'The site won’t load',who:'Maya',said:'“www.lunarlibrary.test won’t load. My browser says it can’t find the server.”',dnsDown:true,ans:'dns'},
  {t:'The site is unreachable',who:'Maya',said:'“The page just spins, then says the connection timed out.”',black:['R10'],ans:'r10'},
  {t:'The site is really slow',who:'Maya',said:'“It loads, but it takes forever, and sometimes pictures are missing.”',slow:{'R9-R10':{ms:150,loss:0.15}},ans:'slow'}];
const DIAG=[['dns','The name lookup (DNS) is failing'],['wifi','Maya’s Wi-Fi link is down'],['r5','Router R5 is down'],['r10','Router R10 is down'],['server','The lunarlibrary.test server itself is down'],['slow','The R9–R10 link is congested (slow)'],['slow25','The R2–R5 link is congested (slow)']];
function topo(sim){const p=sim.p,st=sim.st,nd=new Set(),ld=new Set(),black=new Set();let slow={},dnsDown=false;
  if(p.mode==='case'){const C=CASES[clamp(Math.round(+p.caseSel)||0,0,2)];(C.black||[]).forEach(n=>black.add(n));slow=C.slow||{};dnsDown=!!C.dnsDown;}
  else{const f=String(p.fault||'none');if(f.startsWith('N:'))nd.add(f.slice(2));if(f.startsWith('L:'))ld.add(f.slice(2));Object.keys(st.down).forEach(k=>{if(k.includes('-'))ld.add(k);else nd.add(k);});}
  return {nd,ld,black,slow,dnsDown};}
function topoKey(sim){const T=topo(sim);return [...T.nd].sort().join(',')+'|'+[...T.ld].sort().join(',')+'|'+sim.p.mode+sim.p.caseSel;}
function distTo(sim,dst){const key=topoKey(sim)+'>'+dst,st=sim.st;if(st.dcache[key])return st.dcache[key];const T=topo(sim),d={};ORDER.forEach(n=>d[n]=Infinity);d[dst]=0;const done=new Set();
  for(;;){let u=null;ORDER.forEach(n=>{if(!done.has(n)&&d[n]<Infinity&&(u===null||d[n]<d[u]))u=n;});if(u===null)break;done.add(u);if(T.nd.has(u))continue;if(NODES[u].host&&u!==dst)continue;
    NB[u].forEach(([v,w])=>{if(T.ld.has(lk(u,v))||T.nd.has(v))return;if(d[u]+w<d[v])d[v]=d[u]+w;});}
  st.dcache[key]=d;return d;}
function nextHops(sim,at,dst){const T=topo(sim),d=distTo(sim,dst);if(!(d[at]<Infinity))return [];
  return NB[at].filter(([v,w])=>!T.ld.has(lk(at,v))&&!T.nd.has(v)&&(!NODES[v].host||v===dst)&&Math.abs(d[v]+w-d[at])<1e-6).map(a=>a[0]).sort((a,b)=>IDX[a]-IDX[b]);}
function primaryPath(sim,src,dst){const path=[src];let at=src;for(let i=0;i<20&&at!==dst;i++){const nh=nextHops(sim,at,dst);if(!nh.length)return null;at=nh[0];path.push(at);}return at===dst?path:null;}
const wOf=(a,b)=>{const l=NB[a].find(x=>x[0]===b);return l?l[1]:0;};

/* ---------- packets ---------- */
const KIND={dnsq:['#7b3fe4','DNS?'],dnsr:['#7b3fe4','DNS'],syn:['#c27a00','SYN'],synack:['#c27a00','SYN-ACK'],hack:['#c27a00','ACK'],data:['#2d6bd2',''],ack:['#1b7339','ack'],resp:['#0f8b8d','OK'],echo:['#0f8b8d','ping'],echor:['#0f8b8d','reply'],probe:['#5d5d63','TTL'],tex:['#b3261e','!']};
const BIO_LABEL={syn:'hi?',synack:'hi!',hack:'ok',ack:'got',dnsq:'?',dnsr:'IP',probe:'probe'};
function launch(sim,kind,src,dst,o){const st=sim.st;const pk=Object.assign({id:++st.pid,kind,src,dst,at:src,to:null,prog:0,lat:0,wait:0,ttl:64,job:st.job,born:st.now,hops:0,path:[src],lossAt:null},o||{});st.pk.push(pk);forward(sim,pk);return pk;}
function forward(sim,pk){const nh=nextHops(sim,pk.at,pk.dst);if(!nh.length){drop(sim,pk,'noroute');return;}
  const to=pk.pin?nh[0]:nh[Math.floor(sim.st.r()*nh.length)];const T=topo(sim),key=lk(pk.at,to),sl=T.slow[key];
  pk.to=to;pk.prog=0;pk.lat=wOf(pk.at,to);pk.slowQ=!!sl;pk.wait=(sl?sl.ms*(0.75+0.5*sim.st.r()):0)+(isRouter(pk.at)?4*sim.st.r():0);
  const L=sim.p.mode==='send'?clamp((+sim.p.loss||0)/100,0,0.9):0,loss=(1-Math.pow(1-L,1/7))+(sl?sl.loss:0);pk.lossAt=sim.st.r()<loss?pk.lat*(0.25+0.5*sim.st.r()):null;}
function drop(sim,pk,why){pk.dead=true;const st=sim.st;const pos=pkPos(pk);st.fx.push({x:pos[0],y:pos[1],t:1.2,why});
  if(why==='lost'||why==='noroute'||why==='black'){if(pk.kind==='data')st.S.lost++;}
  if(why!=='black'&&why!=='ttl')logOnce(sim,why==='noroute'?'A router had no route to '+(pk.dst==='S'?'the server':pk.dst==='D'?'the DNS resolver':'the laptop')+', so it dropped a packet.':(pk.kind==='data'?'Packet '+pk.seq+' was lost between '+pk.at+' and '+pk.to+'.':null));}
function pkPos(pk){const a=NODES[pk.at];if(!pk.to||pk.wait>0)return [a.x,a.y];const b=NODES[pk.to],f=clamp(pk.prog/pk.lat,0,1);return [a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f];}
function arrive(sim,pk){pk.at=pk.to;pk.to=null;pk.hops++;pk.path.push(pk.at);
  if(pk.at===pk.dst){deliver(sim,pk);pk.dead=true;return;}
  if(isRouter(pk.at)){if(topo(sim).black.has(pk.at)){drop(sim,pk,'black');return;}pk.ttl--;if(pk.ttl<=0){if(pk.kind==='probe')launch(sim,'tex',pk.at,pk.src,{pin:true,hopN:pk.hopN,who:pk.at,t0:pk.born,tr:pk.tr});drop(sim,pk,'ttl');return;}}
  forward(sim,pk);}
function later(sim,ms,fn){const st=sim.st,job=st.job;st.timers.push({at:st.now+ms,fn,job});}
function log(sim,s){const st=sim.st;st.log.push(s);if(st.log.length>40)st.log.shift();sim.infoDirty=true;}
function logOnce(sim,s){if(!s)return;const st=sim.st;if(st.log[st.log.length-1]!==s)log(sim,s);}
function newJob(sim){const st=sim.st;st.job++;st.pk=[];st.timers=[];}
const fms=v=>Math.round(v)+' ms';

/* deliveries: what each machine does when a packet reaches it */
function deliver(sim,pk){const st=sim.st,S=st.S,k=pk.kind;if(pk.job!==st.job)return;
  if(k==='dnsq'){const T=topo(sim);const cached=st.rcache;const wait=T.dnsDown?300:cached?0:68;st.dnsWait={until:st.now+wait,fail:T.dnsDown};
    later(sim,wait,()=>{st.dnsWait=null;if(!T.dnsDown)st.rcache=true;launch(sim,'dnsr','D','L',{ok:!T.dnsDown,t0:pk.born,cached});});return;}
  if(k==='dnsr'){if(st.dnsDone)return;st.dnsDone=true;st.dnsWait=null;const dt=st.now-pk.t0;if(pk.ok){log(sim,'DNS: '+SITE+' → '+IP.S+' ('+fms(dt)+(pk.cached?', from the resolver’s cache':'')+')');st.dnsT=dt;if(st.after)st.after(true);}
    else{log(sim,'DNS: no answer for '+SITE+'. The resolver could not reach the site’s name server ('+fms(dt)+').');if(st.after)st.after(false);}return;}
  if(k==='syn'){launch(sim,'synack','S','L',{t0:pk.born});return;}
  if(k==='synack'){if(S.est||S.fail)return;S.est=true;S.rtt=st.now-pk.t0;S.rto=Math.max(25,2.2*S.rtt);log(sim,'TCP handshake done: SYN, SYN-ACK, ACK (round trip '+fms(S.rtt)+').');launch(sim,'hack','L','S',{});sendData(sim);return;}
  if(k==='hack')return;
  if(k==='data'){if(!S.got[pk.seq]){S.got[pk.seq]=true;S.arr.push(pk.seq);const maxB=S.arr.length>1?Math.max(...S.arr.slice(0,-1)):0;if(pk.seq<maxB){S.ooo++;S.oooSeq[pk.seq]=true;}S.lastHops=pk.path.filter(isRouter).length;}
    launch(sim,'ack','S','L',{seq:pk.seq});
    if(!S.respSent&&S.got.filter(Boolean).length===S.N){S.respSent=true;S.respAt=st.now;launch(sim,'resp','S','L',{});}return;}
  if(k==='ack'){S.acked[pk.seq]=true;return;}
  if(k==='resp'){if(S.done)return;S.done=true;S.tDone=st.now-S.t0;log(sim,'Server: “essay received” (HTTP 200 OK). All '+S.N+' packets delivered in '+fms(S.tDone)+'.');st.status='Delivered in '+fms(S.tDone);if(st.after2)st.after2(true);return;}
  if(k==='echo'){launch(sim,'echor','S','L',{t0:pk.born,n:pk.n,pin:true});return;}
  if(k==='echor'){const pg=st.ping;if(pg&&!pg.done[pk.n]){pg.done[pk.n]=true;pg.rtt[pk.n]=st.now-pk.t0;log(sim,'Reply from '+IP.S+': time = '+fms(st.now-pk.t0));}return;}
  if(k==='probe'){launch(sim,'tex','S','L',{pin:true,hopN:pk.hopN,who:'S',t0:pk.born,tr:pk.tr});return;}
  if(k==='tex'){const h=st.trace[pk.hopN-1];if(h&&pk.tr===st.trId){h.who=pk.who;h.rtts.push(st.now-pk.t0);sim.infoDirty=true;}return;}}
/* sending the essay: DNS, handshake, data, response */
function startSend(sim){const st=sim.st,N=clamp(Math.round(+sim.p.msgSize)||8,2,16);newJob(sim);
  st.S={N,got:[],acked:[],sentAt:[],tries:[],arr:[],ooo:0,oooSeq:{},sent:0,retx:0,lost:0,t0:st.now,tDone:null,est:false,rtt:0,rto:30,done:false,fail:'',respSent:false,lastHops:0,synTries:0,on:true};
  st.log=[];st.after2=null;st.status='Looking up '+SITE+'…';log(sim,'Maya presses Submit. First the laptop needs the server’s IP address.');
  st.after=ok=>{if(!ok){st.S.fail='Server not found (DNS)';st.status=st.S.fail;if(st.after2)st.after2(false);return;}st.status='Connecting (TCP handshake)…';syn(sim);};
  dnsQuery(sim,1);}
function dnsQuery(sim,n){const st=sim.st;if(n===1)st.dnsDone=false;if(st.dnsDone)return;if(n>5){st.dnsDone=true;log(sim,'DNS: the resolver never answered (5 tries).');if(st.after)st.after(false);return;}
  if(n>1)log(sim,'No DNS answer yet. Asking again (try '+n+').');launch(sim,'dnsq','L','D',{});later(sim,topo(sim).dnsDown?420:160,()=>dnsQuery(sim,n+1));}
function syn(sim){const st=sim.st,S=st.S;if(S.est||S.fail)return;if(S.synTries>=5){S.fail='Connection timed out';st.status=S.fail;log(sim,'No SYN-ACK after 5 tries: the connection timed out.');if(st.after2)st.after2(false);return;}
  S.synTries++;if(S.synTries>1)log(sim,'No answer yet. Sending SYN again (try '+S.synTries+').');launch(sim,'syn','L','S',{});later(sim,450,()=>syn(sim));}
function sendData(sim){const st=sim.st,S=st.S;st.status='Sending '+S.N+' packets…';for(let i=1;i<=S.N;i++)later(sim,(i-1)*1.6,()=>sendSeq(sim,i));later(sim,8,()=>retxCheck(sim));}
function sendSeq(sim,i){const st=sim.st,S=st.S;if(S.acked[i]||S.done||S.fail)return;const re=!!S.sentAt[i];S.sentAt[i]=st.now;S.tries[i]=(S.tries[i]||0)+1;S.sent++;if(re){S.retx++;log(sim,'No ack for packet '+i+' yet, so the laptop sends it again.');}launch(sim,'data','L','S',{seq:i});}
function retxCheck(sim){const st=sim.st,S=st.S;if(S.done||S.fail)return;let all=true;for(let i=1;i<=S.N;i++){if(S.acked[i])continue;all=false;if(S.sentAt[i]!==undefined&&st.now-S.sentAt[i]>S.rto){if(S.tries[i]>=12){S.fail='Connection lost';st.status=S.fail;log(sim,'Packet '+i+' failed 12 times. The connection gave up.');return;}sendSeq(sim,i);}}
  if(all&&!S.done&&S.respSent&&st.now-S.respAt>S.rto){S.respAt=st.now;launch(sim,'resp','S','L',{});}
  if(!all||!S.done)later(sim,6,()=>retxCheck(sim));}
function startPing(sim){const st=sim.st;newJob(sim);st.S=blankS();st.ping={done:[],rtt:[],n:4};log(sim,'> ping '+IP.S);st.status='Pinging '+IP.S+'…';
  for(let n=0;n<4;n++)later(sim,n*60,()=>{launch(sim,'echo','L','S',{n,pin:true});later(sim,900,()=>{if(!st.ping.done[n]){st.ping.done[n]='timeout';log(sim,'Request timed out.');}if(n===3)finishTest(sim,'ping');});});}
function startTrace(sim){const st=sim.st;newJob(sim);st.S=blankS();st.trId++;st.trace=[];log(sim,'> traceroute '+IP.S);st.status='Tracing the route…';if(sim.ui&&sim.ui.gm&&atLeast('honors')&&[...sim.ui.gm.options].some(o=>o.value==='trace')){sim.gMetric='trace';sim.ui.gm.value='trace';}traceHop(sim,1,0);}
function traceHop(sim,h,miss){const st=sim.st;if(h>9){finishTest(sim,'trace');return;}const tr=st.trId;st.trace[h-1]={hop:h,who:null,rtts:[]};
  for(let j=0;j<3;j++)later(sim,j*0.6,()=>launch(sim,'probe','L','S',{ttl:h,hopN:h,pin:true,tr}));
  const t0=st.now;const wait=()=>{if(tr!==st.trId)return;const H=st.trace[h-1];if(H.rtts.length>=3||st.now-t0>900){const line=h+'  '+(H.who?(H.who==='S'?'lunarlibrary.test ('+IP.S+')':H.who+' ('+ipOf(H.who)+')')+'  '+H.rtts.map(fms).join('  ')+(H.rtts.length<3?'  *':''):'*  *  *  (no reply)');log(sim,line);
      if(H.who==='S'){finishTest(sim,'trace');return;}const m=H.who?0:miss+1;if(m>=2){log(sim,'Two hops in a row gave no reply. Stopping.');finishTest(sim,'trace');return;}traceHop(sim,h+1,m);return;}later(sim,4,wait);};later(sim,4,wait);}
function startLookup(sim){const st=sim.st;newJob(sim);st.S=blankS();log(sim,'> nslookup '+SITE);st.status='Looking up the name…';st.after=ok=>{finishTest(sim,'dns');};dnsQuery(sim,1);}
function startLoad(sim){startSend(sim);const st=sim.st;st.S.N=6;st.after2=ok=>{finishTest(sim,'load');};}
function finishTest(sim,what){const st=sim.st;st.tests[what]=true;st.status=what==='trace'?'Traceroute finished':what==='ping'?'Ping finished':what==='dns'?'Lookup finished':st.status;sim.infoDirty=true;}

/* ---------- DNS walk (separate diagram) ---------- */
const DBOX={L:{x:96,y:196,n:'Maya’s laptop',s:'Laptop',ip:IP.L},R:{x:316,y:196,n:'DNS resolver',s:'Resolver',ip:IP.D},root:{x:566,y:66,n:'Root server',s:'Root',ip:'(root)'},tld:{x:640,y:196,n:'.test TLD server',s:'.test TLD',ip:'(.test)'},auth:{x:566,y:326,n:'lunarlibrary.test name server',s:'Site’s server',ip:IP.NS}};
const DMS={'L-R':13,'R-root':22,'R-tld':18,'R-auth':28};
function dnsSteps(sim){const p=sim.p,ap=atLeast('ap'),q=ap?'Query: A record for '+SITE+'?':'Where is '+SITE+'?';
  if(p.cache&&atLeast('honors'))return [['L','R',q],['R','L',ap?'Answer from cache: A 203.0.113.80 (TTL left 2950 s)':'From my cache: it’s 203.0.113.80']];
  const s=[['L','R',q],['R','root',q],['root','R',ap?'Referral: try the .test name servers (NS records)':'I don’t know it, but the .test servers do.'],['R','tld',q],['tld','R',ap?'Referral: NS ns1.lunarlibrary.test at '+IP.NS:'Ask lunarlibrary.test’s own name server.'],['R','auth',q]];
  if(p.authDown)return s.concat([['R','auth',q+' (try 2)'],['R','auth',q+' (try 3)'],['R','L',ap?'SERVFAIL: no answer from the authoritative server':'Sorry, I couldn’t get an answer.']]);
  return s.concat([['auth','R',ap?'Answer: A 203.0.113.80, TTL 3600 s':SITE+' is at 203.0.113.80.'],['R','L',ap?'Answer: A 203.0.113.80 (resolver caches it for 3600 s)':'It’s 203.0.113.80.']]);}
const dkey=(a,b)=>{const k=a==='L'||b==='L'?'L-R':'R-'+(a==='R'?b:a);return k;};
function startDns(sim){const st=sim.st;st.dw={steps:dnsSteps(sim),i:0,prog:0,t:0,done:false,lost:false};}
function stepDns(sim,dms){const w=sim.st.dw;if(!w||w.done)return;const s=w.steps[w.i];const toAuthDown=sim.p.authDown&&s[1]==='auth';const ms=toAuthDown?100:DMS[dkey(s[0],s[1])];
  w.prog+=dms;w.t+=dms;if(w.prog>=ms){w.prog=0;w.i++;if(w.i>=w.steps.length){w.done=true;w.i=w.steps.length-1;w.total=w.t;sim.infoDirty=true;}}}

/* ---------- mode visibility ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});sim.infoDirty=true;}
function modeChanged(sim){const st=sim.st;newJob(sim);st.log=[];st.status='';st.S=blankS();st.trace=[];st.trId++;st.tests={};st.diag=null;st.dw=null;st.dcache={};st.after=null;st.after2=null;st.dnsWait=null;syncMode(sim);}
const blankS=()=>({N:0,got:[],acked:[],arr:[],ooo:0,oooSeq:{},sent:0,retx:0,lost:0,tDone:null,on:false,lastHops:0,fail:''});

const NET={
  id:'internet',hash:'internet',apUnit:20,order:1,prereq:['binary'],next:['firewall','logs','pubkey'],tab:'How the internet moves data',kind:'Simulation',
  card:'Send an essay across a network of routers, cut links and watch packets reroute, then troubleshoot a site that won’t load.',
  title:'How the internet moves data',
  lede:{bio:'Your message is chopped into numbered packets. Each one finds its own way through a web of routers, and the server puts them back in order. Break a link and watch the network route around it.',
        honors:'Follow a DNS lookup, the TCP handshake, packet loss and retransmission, and use ping and traceroute to troubleshoot a fictional site that is down or slow.',
        ap:'Read each packet’s IP and TCP headers: addresses, ports, sequence numbers, and the TTL that every router decrements.'},
  scale:{bio:'A city-sized network drawn small. Each wire takes a few milliseconds to cross; animation runs about 30 times slower than real life.',ap:'Link latencies of 1–14 ms; the laptop-to-server path is about 37 ms one way. Animation: 1 s on screen ≈ 30 ms of network time; idle waits are sped up.'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Explore',type:'seg',def:'case',noTrial:true,options:[{v:'case',l:'Investigate'},{v:'send',l:'Send a message'},{v:'dns',l:'DNS lookup'}]},
    {id:'caseSel',label:'Help desk ticket',type:'select',def:0,modes:['case'],noTrial:true,options:[{v:0,l:'Ticket 1: “The site won’t load”'},{v:1,l:'Ticket 2: “Connection timed out”'},{v:2,l:'Ticket 3: “It’s really slow”'}],onChange(sim){modeChanged(sim);}},
    {id:'msgSize',label:'Essay size',type:'range',min:4,max:16,step:1,def:8,unit:' packets',modes:['send'],help:'Big messages are split into more packets.'},
    {id:'loss',label:'Packet loss',type:'range',min:0,max:30,step:5,def:0,unit:'%',lvl:'honors',modes:['send'],help:'Chance that a packet is lost somewhere on its trip across the network.'},
    {id:'fault',label:'Break something',type:'select',def:'none',modes:['send'],help:'Or click a router or wire on the map. Click again to fix it.',options:[{v:'none',l:'Nothing broken'},{v:'L:R5-R7',l:'Cut the R5–R7 wire'},{v:'N:R5',l:'Break router R5'},{v:'N:R9',l:'Break router R9'},{v:'N:R3',l:'Break router R3',lvl:'honors'},{v:'N:R10',l:'Break router R10',lvl:'honors'}],onChange(sim){sim.st.dcache={};}},
    {id:'headers',label:'Show packet headers',type:'toggle',def:false,lvl:'ap',modes:['send'],noTrial:true},
    {id:'cache',label:'Resolver already has the answer cached',type:'toggle',def:false,lvl:'honors',modes:['dns']},
    {id:'authDown',label:'The site’s name server is down',type:'toggle',def:false,modes:['dns']}
  ],
  actions:[
    {id:'send',label:'Send the essay',primary:true,modes:['send'],run(sim){startSend(sim);}},
    {id:'load',label:'Load the site',primary:true,modes:['case'],run(sim){startLoad(sim);}},
    {id:'ping',label:'Ping the server’s IP',modes:['case'],run(sim){startPing(sim);}},
    {id:'nsl',label:'Look up the name (DNS)',modes:['case'],run(sim){startLookup(sim);}},
    {id:'trace',label:'Run traceroute',modes:['case','send'],run(sim){startTrace(sim);}},
    {id:'fix',label:'Repair everything',modes:['send'],run(sim){sim.st.down={};sim.st.dcache={};BioLab.setValues(sim,{fault:'none'});}},
    {id:'look',label:'Look it up',primary:true,modes:['dns'],run(sim){startDns(sim);}}
  ],
  init(sim){return {now:0,pk:[],fx:[],timers:[],job:0,pid:0,r:rng(20261024),down:{},dcache:{},S:blankS(),log:[],status:'',trace:[],trId:0,tests:{},diag:null,diagMsg:'',rcache:false,dw:null,dnsT:null,ping:null,after:null,after2:null,dnsWait:null};},
  step(sim,dt){const st=sim.st;
    if(sim.p.mode==='dns'){stepDns(sim,dt*MSPS);return;}
    let rem=dt*MSPS,it=0;while(rem>1e-9&&it++<500){const moving=st.pk.some(p=>!p.dead&&p.to&&p.wait<=0);const mult=moving?1:FF;const h=Math.min(rem*mult,0.5);advance(sim,h);rem-=h/mult;}},
  metrics:[
    {id:'nsent',label:'Packets sent',d:0,modes:['send'],get:s=>s.st.S.sent},
    {id:'ngot',label:'Server has',text:true,modes:['send'],get:s=>{const S=s.st.S;return S.N?S.got.filter(Boolean).length+' of '+S.N:'—';}},
    {id:'nretx',label:'Resent by TCP',lvl:'honors',d:0,modes:['send'],get:s=>s.st.S.retx},
    {id:'nooo',label:'Arrived out of order',d:0,modes:['send'],get:s=>s.st.S.ooo},
    {id:'tdel',label:'Time to deliver',unit:'ms',d:0,modes:['send'],get:s=>s.st.S.tDone},
    {id:'hopsM',label:'Routers crossed (latest packet)',lvl:'ap',d:0,modes:['send'],get:s=>s.st.S.lastHops||null},
    {id:'ctests',label:'Tests run',d:0,modes:['case'],get:s=>Object.keys(s.st.tests).length},
    {id:'cstat',label:'Your diagnosis',text:true,modes:['case'],get:s=>s.st.diag===null?'Not submitted yet':s.st.diag.ok?'Correct and backed by evidence':'Not supported yet. Try again.'},
    {id:'dnsT',label:'Lookup time',unit:'ms',d:0,modes:['dns'],get:s=>{const w=s.st.dw;return w&&w.done?w.total:null;}},
    {id:'dnsQ',label:'Messages sent',d:0,modes:['dns'],get:s=>{const w=s.st.dw;return w?w.i+(w.done?1:0):0;}}
  ],
  graphs:[{id:'arr',label:'Arrival order of the packets',custom:true},{id:'trace',label:'Traceroute: round-trip time to each hop',lvl:'honors',custom:true}],defaultGraph:'arr',
  plot(sim,ctx,box,id){const st=sim.st,msg=s=>txt(ctx,s,box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});
    if(id==='arr'){const S=st.S;if(!S.arr.length){msg(sim.p.mode==='dns'?'Switch to Send a message, then send the essay.':sim.p.mode==='case'?'Load the site to see the order packets arrive in.':'Send the essay to see the order packets arrive in.');return;}
      const n=Math.max(S.N,S.arr.length);const ax=axes(ctx,box,{xmin:0,xmax:n+1,ymin:0,ymax:n+1,xl:'Arrival (1st, 2nd, …)',yl:'Packet number',xd:0,yd:0});
      ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(n+1),ax.Y(n+1));ctx.stroke();ctx.setLineDash([]);
      S.arr.forEach((q,i)=>{ctx.fillStyle=S.oooSeq[q]?serColor(3):serColor(1);ctx.beginPath();ctx.arc(ax.X(i+1),ax.Y(q),6,0,6.29);ctx.fill();});
      legend(ctx,box.L+10,box.T+10,[{label:'in order',color:serColor(1)},{label:'arrived early',color:serColor(3)},{label:'perfect order',color:PAL['muted'],dash:true}]);return;}
    const tr=st.trace.filter(h=>h);if(!tr.length){msg('Run traceroute to measure the time to each hop.');return;}
    const avg=tr.map(h=>h.rtts.length?h.rtts.reduce((a,b)=>a+b,0)/h.rtts.length:NaN);const ymax=Math.max(20,...avg.filter(Number.isFinite))*1.2;
    const ax=axes(ctx,box,{xmin:0,xmax:tr.length,ymin:0,ymax,xcats:tr.map(h=>String(h.hop)),yl:'Round trip (ms)',xl:'Hop number'});
    avg.forEach((v,i)=>{const x0=ax.X(i+0.2),x1=ax.X(i+0.8);if(Number.isFinite(v)){ctx.fillStyle=serColor(i===avg.length-1&&tr[i].who==='S'?2:1);ctx.fillRect(x0,ax.Y(v),x1-x0,ax.Y(0)-ax.Y(v));txt(ctx,Math.round(v)+'',(x0+x1)/2,ax.Y(v)-5,{s:12,c:PAL['fg'],a:'center',w:600});}
      else txt(ctx,'*',(x0+x1)/2,ax.Y(0)-10,{s:16,c:PAL['muted'],a:'center',w:700});});},
  narrate(sim){const p=sim.p,st=sim.st,S=st.S,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='dns'){const w=st.dw;if(!w)return 'Computers find each other by number (IP address), but people type names. <b>Press Look it up</b> to watch the resolver find the number for '+SITE+'.';
      if(!w.done)return 'Step '+(w.i+1)+' of '+w.steps.length+': '+esc(w.steps[w.i][2]);
      return p.authDown?'<b>The lookup failed.</b> Without an IP address the browser cannot even start a connection, so it says “server not found”, even though the web server itself may be fine.':'<b>Found it in '+fms(w.total)+'.</b> '+(w.steps.length>2?'The resolver asked three servers, each pointing closer to the answer, and it saves the answer so the next lookup is fast.':'The resolver answered from its cache, so it skipped the root, .test and site servers.');}
    if(p.mode==='case'){const C=CASES[clamp(Math.round(+p.caseSel)||0,0,2)];if(st.diag&&st.diag.ok)return '<b>Solved.</b> '+esc(st.diag.msg);
      const moving=st.pk.filter(q=>!q.dead).length;if(moving)return 'Watch where the packets go and where they stop. '+(st.status?esc(st.status):'');
      return 'Ticket: '+esc(C.who)+' says '+esc(C.said)+' <b>Run tests to collect evidence</b>, then submit your diagnosis below.';}
    if(!S.on&&!st.trace.length)return 'Maya’s laptop (left) wants to send her essay to the lunarlibrary.test server (right). <b>Press Send the essay</b>, or click a router or wire to break it first.';
    if(st.trace.length&&!S.on)return 'Traceroute sends probes with TTL 1, 2, 3… Each router that drops a probe at TTL 0 sends back an error, which reveals <b>every hop on the path</b> and how long it took.';
    if(S.fail)return '<b>'+esc(S.fail)+'.</b> '+(S.fail.includes('DNS')?'The laptop could not reach the DNS resolver, so it never learned the server’s address.':'No path reached the server. When the only way in is broken, there is nothing to reroute to.');
    if(S.done)return '<b>All '+S.N+' packets arrived</b> in '+fms(S.tDone)+'. '+(S.ooo?S.ooo+' came in out of order, and TCP put them back in sequence using their numbers.':'They happened to arrive in order this time.')+(S.retx?' TCP resent '+S.retx+' lost packet'+(S.retx>1?'s':'')+'.':'');
    if(!S.est)return st.dnsWait?'The resolver is asking other DNS servers for the address…':(hon?'The laptop and server do the TCP handshake (SYN, SYN-ACK, ACK) so both sides agree to talk.':'The laptop says hello to the server and waits for a hello back before sending the essay.');
    return 'The packets spread out over different routes. Each router sends a packet one step closer, choosing any of the equally short paths, so <b>they can arrive out of order</b>.';},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');let h='';
    const term=lines=>'<div style="'+MS+';font-size:13px;line-height:1.45;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:8px 10px;max-height:240px;overflow:auto;white-space:pre-wrap">'+(lines.length?lines.map(esc).join('\n'):'(nothing yet)')+'</div>';
    if(p.mode==='case'){const C=CASES[clamp(Math.round(+p.caseSel)||0,0,2)];h+='<div class="p-head"><h3>Help desk: '+esc(C.t)+'</h3></div><p>'+esc(C.who)+' says: '+esc(C.said)+'</p><p style="margin-bottom:4px"><b>Your evidence</b> (newest last):</p>'+term(st.log.slice(-14));
      h+='<p style="margin:10px 0 4px"><label for="internet-dg"><b>Diagnosis</b></label></p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select class="sel" id="internet-dg" style="flex:1 1 220px;min-width:0">'+DIAG.map(d=>'<option value="'+d[0]+'"'+(st.diag&&st.diag.pick===d[0]?' selected':'')+'>'+esc(d[1])+'</option>').join('')+'</select><button type="button" class="btn primary" id="internet-sub">Submit diagnosis</button></div>';
      if(st.diag)h+='<p class="verdict '+(st.diag.ok?'ok':'no')+'" style="margin-top:8px">'+(st.diag.ok?'Correct.':'Not yet.')+'</p><p>'+esc(st.diag.msg)+'</p>';
      h+='<p style="margin-top:8px"><b>Tools:</b> <i>Load the site</i> does everything a browser does. <i>Look up the name</i> tests only DNS. <i>Ping</i> tests whether the server’s IP answers. <i>Traceroute</i> lists each router on the way and how long it takes to answer.</p>';return h;}
    if(p.mode==='dns'){const w=st.dw;h+='<div class="p-head"><h3>DNS: turning a name into a number</h3></div>';
      if(w)h+='<ol style="padding-left:20px;margin:0 0 8px">'+w.steps.map((s,i)=>'<li style="'+(i<w.i||w.done?'':i===w.i?'font-weight:700':'color:var(--muted)')+'">'+esc(DBOX[s[0]].n)+' → '+esc(DBOX[s[1]].n)+': '+esc(s[2])+'</li>').join('')+'</ol>';else h+='<p>Press <b>Look it up</b>.</p>';
      h+='<p>The <b>resolver</b> (run by Maya’s internet provider) does the asking. <b>Root</b> servers know where each top-level domain lives, the <b>.test</b> servers know each site’s name server, and the site’s own <b>authoritative</b> server knows the answer.</p>';
      if(ap)h+='<p><b>Records:</b> NS records point to name servers; an A record maps a name to an IPv4 address (AAAA for IPv6). Each answer carries a TTL in seconds that says how long it may be cached. DNS queries usually go to UDP port 53.</p>';return h;}
    h+='<div class="p-head"><h3>What happened</h3></div>'+term(st.log.slice(-12));
    h+='<p style="margin-top:8px">Click a router or wire on the map to break it, then send again. '+(hon?'Raise the packet loss and watch TCP resend what goes missing.':'')+'</p>';
    if(ap)h+='<p><b>Addresses:</b> laptop '+IP.L+' (private; the home router R1 swaps it for '+IP.NAT+' using NAT), resolver '+IP.D+':53, server '+IP.S+':443. These are reserved documentation addresses, not real hosts.</p>';
    return h;},
  bindInfo(sim,el){const b=el.querySelector('#internet-sub');if(b)b.addEventListener('click',()=>{const pick=el.querySelector('#internet-dg').value;grade(sim,pick);BioLab.refresh(sim);});},
  onClick(sim,x,y){if(sim.p.mode!=='send')return;const st=sim.st;
    for(const n of ORDER){if(!isRouter(n))continue;const a=NODES[n];if(Math.hypot(x-a.x,y-a.y)<24){if(st.down[n])delete st.down[n];else st.down[n]=1;st.dcache={};return;}}
    let best=null,bd=12;LINKS.forEach(([a,b])=>{const A=NODES[a],B=NODES[b],dx=B.x-A.x,dy=B.y-A.y,t=clamp(((x-A.x)*dx+(y-A.y)*dy)/(dx*dx+dy*dy),0,1),d=Math.hypot(x-A.x-dx*t,y-A.y-dy*t);if(d<bd&&t>0.15&&t<0.85){bd=d;best=lk(a,b);}});
    if(best){if(st.down[best])delete st.down[best];else st.down[best]=1;st.dcache={};}},
  tour:[
    {title:'A network of routers',text:'Maya’s laptop is on the left and the lunarlibrary.test server (fictional) is on the right. Between them, routers pass data along wires. There are many possible paths.',focus:[0,40,800,350],speed:1,pause:false,setup(sim){BioLab.setValues(sim,{mode:'send',fault:'none',loss:0,msgSize:8});}},
    {title:'First, find the address',text:'People type names; computers need numbers. A DNS lookup asks a chain of servers until one knows that www.lunarlibrary.test is 203.0.113.80.',focus:[0,0,800,450],speed:0.6,setup(sim){BioLab.setValues(sim,{mode:'dns',cache:false,authDown:false});startDns(sim);}},
    {title:'Say hello',text:{bio:'Before sending the essay, the laptop says hello to the server and waits for a reply, so both sides are ready.',honors:'TCP opens a connection with a three-way handshake: SYN, SYN-ACK, ACK. The round trip also tells the laptop how long to wait before resending.'},focus:[0,40,800,350],speed:0.5,setup(sim){BioLab.setValues(sim,{mode:'send',fault:'none',loss:0,msgSize:8});startSend(sim);}},
    {title:'Packets take different paths',text:'The essay is split into numbered packets. Each router sends a packet one step closer, picking any of the equally short paths, so packets spread out.',focus:[100,40,600,350],speed:0.6},
    {title:'Put back in order',text:'Packets arrive out of order. The server uses their numbers to put the essay back together, and acknowledges each one so the laptop knows it arrived.',focus:[0,394,800,56],speed:1},
    {title:'Break a wire',text:'Cut the R5–R7 wire and send again. Routers learn the wire is gone and steer around it. Many paths make the internet hard to break.',focus:[260,100,280,180],speed:0.6,setup(sim){BioLab.setValues(sim,{fault:'L:R5-R7'});startSend(sim);}},
    {lvl:'honors',title:'Traceroute',text:'Traceroute sends probes with a time-to-live of 1, 2, 3… Each router that drops a probe sends an error back, revealing every hop and its round-trip time.',focus:[0,40,800,350],speed:1,setup(sim){BioLab.setValues(sim,{fault:'none'});startTrace(sim);}},
    {lvl:'ap',title:'Inside a packet',text:'Every packet carries headers: source and destination IP addresses and ports, a TCP sequence number, and a TTL that each router lowers by 1. A packet whose TTL hits 0 is dropped, so loops cannot last forever.',focus:[490,6,306,128],speed:0.5,setup(sim){BioLab.setValues(sim,{headers:true,fault:'none'});startSend(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case',caseSel:0,headers:false,fault:'none'});modeChanged(sim);},
  onChallenge(sim,ch,phase){if(ch&&phase==='done'){if(ch.set)BioLab.setValues(sim,ch.set);if(ch.act)ch.act(sim);BioLab.refresh(sim);}},
  challenges(sim){const base=fakeSim(),path=primaryPath(base,'L','S'),H=path.filter(isRouter).length;const C1=fakeSim(1),last=lastAnswering(C1);
    return [
    {lvl:'bio',instant:true,q:'Maya’s essay is split into 8 packets. Do they all take the same path and arrive in order?',choices:['Yes, they follow each other in a line','No, they can take different paths and arrive out of order; the server puts them back in order','Only the first packet makes it; the rest wait'],correct:1,
     set:{mode:'send',fault:'none',loss:0,msgSize:12},act(s){startSend(s);},
     explain:'Watch the 12 packets now on the map: they spread across several equally short routes. The graph below plots arrival order; dots off the dashed line arrived out of order, and their numbers let the server rebuild the essay.'},
    {lvl:'bio',instant:true,q:'The R5–R7 wire is cut while Maya sends her essay. What happens?',choices:['The essay is lost for good','The routers send packets another way, and the essay still arrives','The whole internet stops'],correct:1,set:{mode:'send',fault:'L:R5-R7',loss:0,msgSize:8},act(s){startSend(s);},
     explain:'The model is sending with the R5–R7 wire cut. Routers drop that wire from their routes and use R4–R7 or R8–R9 instead, so the essay arrives. Many paths (redundancy) is why one cut rarely stops the internet.'},
    {lvl:'bio',instant:true,q:'Before Maya’s laptop can send anything to www.lunarlibrary.test, what does it need?',choices:['The server’s IP address, from a DNS lookup','Maya’s password','A direct wire to the server'],correct:0,set:{mode:'dns',cache:false,authDown:false},act(s){startDns(s);},
     explain:'Routers move packets by number, not by name. The DNS lookup now running asks the resolver, which asks the root, .test and lunarlibrary.test servers until it gets 203.0.113.80.'},
    {lvl:'honors',instant:true,q:'Now 20% of packets get lost on the way. Does Maya’s essay still arrive complete?',choices:['No, about 20% of it is missing','Yes, the server tells the laptop what it got, and TCP resends the missing packets','Yes, because routers make copies of every packet'],correct:1,set:{mode:'send',fault:'none',loss:20,msgSize:8},act(s){startSend(s);},
     explain:'Watch the Resent by TCP tile climb. The server acknowledges each packet it gets; any packet without an ack after a timeout is sent again. The essay arrives whole, just later.'},
    {lvl:'honors',instant:true,q:'For Ticket 2, traceroute shows hops 1 to '+last+' answering, then only * * *. What does that point to?',choices:['Maya’s Wi-Fi is down','Something at hop '+(last+1)+' (the next router) is not passing traffic','The DNS lookup failed'],correct:1,set:{mode:'case',caseSel:1},act(s){startTrace(s);},
     explain:'The model is running that traceroute now. Hops 1–'+last+' reply, so the path works that far. The next router on the path, R10, never answers and nothing beyond it does either, so R10 is the likely failure. If only the server were down, R10 would still reply.'},
    {lvl:'honors',instant:true,q:'The resolver already has the answer in its cache. What changes about the lookup?',choices:['Nothing, it always asks the root server','It answers right away, skipping the root, .test and site servers','The answer is less accurate'],correct:1,set:{mode:'dns',cache:true,authDown:false},act(s){startDns(s);},
     explain:'A cached lookup needs only 2 messages (laptop → resolver → laptop, about 26 ms) instead of 8 (about 162 ms). The cached answer is good until its TTL runs out.'},
    {lvl:'ap',instant:true,q:'A packet leaves the laptop with TTL 64 and crosses '+H+' routers to reach the server. What TTL does it arrive with?',choices:['64','65 − '+H+' = '+(65-H),String(64-H),'0'],correct:2,set:{mode:'send',fault:'none',loss:0,headers:true},act(s){startSend(s);},
     explain:'Each router lowers the TTL by 1 before forwarding: 64 − '+H+' = '+(64-H)+'. The header card on the stage shows the TTL dropping hop by hop. Traceroute relies on this: a TTL of 1 dies at the first router.'},
    {lvl:'ap',instant:true,q:'How many messages does the TCP handshake use before the essay’s data flows?',choices:['1','2','3','4'],correct:2,set:{mode:'send',fault:'none',loss:0,headers:true},act(s){startSend(s);},
     explain:'SYN (laptop), SYN-ACK (server), ACK (laptop): three messages. Each side picks a starting sequence number, and the handshake confirms both. The log below lists them as they happen.'},
    {lvl:'ap',instant:true,q:'Maya’s browser sends its HTTPS request to which port on 203.0.113.80?',choices:['53','80','443','3389'],correct:2,set:{mode:'send',headers:true},act(s){startSend(s);},
     explain:'HTTPS uses TCP port 443 by default (plain HTTP is 80, DNS is 53, remote desktop is 3389). The header card shows dst :443 on every data packet.'}];},
  lab:{bio:'<p><b>Question:</b> Do packets of one message all take the same path?</p><ol><li>In Send a message, send the essay three times. Record a trial each time.</li><li>Cut the R5–R7 wire, then break router R9. Send and record each time.</li><li>Look at “Arrived out of order” and “Time to deliver”.</li></ol><p>Does the essay still arrive when something breaks? Can any one of these breaks stop it completely? Why not?</p>',
    honors:'<p><b>Question:</b> How does packet loss change delivery time?</p><ol><li>Set the essay to 8 packets. Send at 0%, 10%, 20% and 30% loss, recording two trials each.</li><li>Plot loss (x) against time to deliver (y), and against packets resent.</li><li>Then solve all three help desk tickets. For each, write which test gave the deciding evidence.</li></ol><p>Explain why TCP can deliver a complete essay over wires that lose packets.</p>',
    ap:'<p><b>Question:</b> What does each header field do on the journey?</p><ol><li>Turn on Show packet headers and send. Record the TTL at the server and the number of routers crossed.</li><li>Run traceroute and record the round-trip time per hop. Compare the jumps with the wire latencies.</li><li>For Ticket 3, find the hop where the time jumps.</li></ol><p><b>Claim–evidence–reasoning:</b> Use traceroute and ping evidence to locate the congested link in Ticket 3 and explain why the routers keep using it.</p>'},
  terms:[{t:'Packet',d:'A small chunk of data with a label saying where it is going and its place in the message.'},{t:'Router',d:'A device that passes each packet one step closer to its destination.'},{t:'IP address',d:'The number that identifies a device on the internet, like 203.0.113.80.'},{t:'DNS',d:'The internet’s phone book: turns names like www.lunarlibrary.test into IP addresses.'},{t:'Redundancy',d:'Having more than one path, so one break does not stop traffic.'},
    {lvl:'honors',t:'TCP',d:'The protocol that numbers packets, acknowledges them, resends lost ones and puts them back in order.'},{lvl:'honors',t:'Three-way handshake',d:'SYN, SYN-ACK, ACK: how TCP opens a connection.'},{lvl:'honors',t:'Packet loss',d:'Packets that never arrive because of congestion, errors or a broken link.'},{lvl:'honors',t:'Ping',d:'A test that sends an echo request and times the reply.'},{lvl:'honors',t:'Traceroute',d:'A tool that lists the routers on a path by sending probes with TTL 1, 2, 3…'},{lvl:'honors',t:'DNS resolver',d:'The server that does a lookup for you by asking root, TLD and authoritative servers, then caches the answer.'},
    {lvl:'ap',t:'TTL (time to live)',d:'A counter in the IP header that each router lowers by 1; at 0 the packet is dropped and an error goes back.'},{lvl:'ap',t:'Port',d:'A number that picks the program on a machine: 443 for HTTPS, 53 for DNS.'},{lvl:'ap',t:'Sequence number',d:'TCP’s count of bytes sent, used to order data and spot gaps.'},{lvl:'ap',t:'NAT',d:'Network address translation: a home router shares one public IP among private addresses.'},{lvl:'ap',t:'Latency and RTT',d:'Latency is one-way delay; round-trip time (RTT) is there and back.'}],
  about:'<p>The network, people and site are fictional. IP addresses come from the ranges reserved for documentation (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), and .test is a top-level domain reserved for testing, so none of them point to real machines.</p><p>Routing is shortest-path by fixed wire latency (like OSPF link costs), recomputed the instant something breaks; real routers take from under a second to minutes to notice. Each packet independently picks among equally short next hops, which shows that every packet is routed on its own; real routers usually keep one connection on one path. Probes for ping and traceroute stay on one path, as real flow hashing would. TCP is simplified: one acknowledgment per packet, a fixed retransmission timeout from the handshake round trip, and no congestion window. DNS upstream servers are not drawn on the map. Time on screen is slowed about 30× so packets are visible, and waits with nothing on a wire run faster. Ticket 2 models a router that is still listed in routes but forwards nothing (a “black hole”).</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);st.fx.forEach(f=>f.t-=vdt);st.fx=st.fx.filter(f=>f.t>0);
    if(p.mode==='dns'){drawDns(sim,ctx,k,t);return;}drawNet(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.mode='send';startSend(sim);for(let i=0;i<60;i++)NET.step(sim,0.05);}
};
function advance(sim,h){const st=sim.st;st.now+=h;
  const due=st.timers.filter(x=>x.at<=st.now);if(due.length){st.timers=st.timers.filter(x=>x.at>st.now);due.forEach(x=>{if(x.job===st.job)x.fn();});}
  st.pk.forEach(pk=>{if(pk.dead)return;if(pk.wait>0){pk.wait-=h;return;}if(!pk.to)return;pk.prog+=h;if(pk.lossAt!==null&&pk.prog>=pk.lossAt){drop(sim,pk,'lost');return;}if(pk.prog>=pk.lat)arrive(sim,pk);});
  if(st.pk.length>60||st.pk.some(q=>q.dead))st.pk=st.pk.filter(q=>!q.dead);}
/* a throwaway state for computing paths in challenge text */
function fakeSim(c){const s={p:{mode:c===undefined?'send':'case',caseSel:c||0,fault:'none',loss:0},st:{down:{},dcache:{}}};return s;}
function lastAnswering(s){const path=primaryPath(s,'L','S');const T=topo(s);let n=0;for(const x of path){if(!isRouter(x))continue;if(T.black.has(x))break;n++;}return n;}
function grade(sim,pick){const st=sim.st,ci=clamp(Math.round(+sim.p.caseSel)||0,0,2),C=CASES[ci],T=st.tests;const ok=pick===C.ans;let msg;
  const have=Object.keys(T).length;
  if(!have){st.diag={ok:false,pick,msg:'Collect evidence first. Run at least one test so you can back up your answer.'};return;}
  if(ok){const need=ci===0?(T.dns||T.load)&&(T.ping||T.trace):ci===1?T.trace:(T.trace||T.ping);
    if(!need){st.diag={ok:false,pick,msg:'That is the right idea, but your evidence does not prove it yet. '+(ci===0?'Show that DNS fails while the server’s IP still answers (ping or traceroute).':ci===1?'Run traceroute to show exactly where the path stops.':'Run traceroute or ping to show where the delay is.')}; return;}
    msg=ci===0?'DNS gets no answer, yet ping and traceroute reach 203.0.113.80 directly. The server and routers are fine; the name cannot be turned into an address, so the browser says “server not found”.':ci===1?'Traceroute gets replies through R9, then nothing. R10 never answers, so it is the break; if only the server were down, R10 would still reply. With R10 down there is no other way in.':'Traceroute times jump by about 150 ms between R9 and R10, and some probes are lost there. That wire is congested: packets queue at R9, and some are dropped, so TCP has to resend.';
    st.diag={ok:true,pick,msg};return;}
  const why={dns:ci===0?'':'The DNS lookup works in this ticket: it returns 203.0.113.80.',wifi:'Maya’s packets reach the first routers, so her Wi-Fi works.',r5:'Routers around R5 can carry traffic another way, and your traceroute does not stop at R5.',
    r10:ci===1?'':'Traceroute gets replies from R10 in this ticket.',server:ci===1?'If only the server were down, R10 would still answer traceroute. Does it?':'The server answers ping and traceroute in this ticket.',slow:ci===2?'':'The times through R9 and R10 look normal in this ticket.',slow25:'Traceroute times do not jump at R2 or R5.'};
  st.diag={ok:false,pick,msg:why[pick]||'Check that idea against your evidence.'};}

/* ---------- drawing ---------- */
function routerR(k){return Math.max(18,11*k);}
function drawNet(sim,ctx,k,t){const p=sim.p,st=sim.st,T=topo(sim),hon=atLeast('honors'),ap=atLeast('ap'),small=k>1.3;
  // wires
  LINKS.forEach(([a,b,w])=>{const A=NODES[a],B=NODES[b],key=lk(a,b),down=T.ld.has(key)||T.nd.has(a)||T.nd.has(b);ctx.strokeStyle=down?PAL['s1']:PAL['cv-soft'];ctx.globalAlpha=down?0.9:0.55;ctx.lineWidth=down?2:3;ctx.setLineDash(down?[6,6]:[]);
    ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    if(T.ld.has(key)){const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;mt(ctx,'✂',mx,my,{s:16*k,c:PAL['s1'],a:'center',b:'middle'});}
    else if(hon&&!small&&a!=='L'&&b!=='S'&&b!=='D'){const mx=(A.x+B.x)/2,my=(A.y+B.y)/2,dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy);txt(ctx,w+' ms',mx-dy/L*13,my+dx/L*13,{s:12,c:PAL['cv-soft'],a:'center',b:'middle'});}});
  // traceroute hop badges
  const hopOf={};st.trace.forEach(hh=>{if(hh&&hh.who&&hh.who!=='S')hopOf[hh.who]=hh.hop;});
  // routers
  ORDER.forEach(n=>{if(!isRouter(n))return;const a=NODES[n],R=routerR(k),down=T.nd.has(n);ctx.fillStyle=down?'#8a8a90':'#3f5f7f';ctx.beginPath();ctx.arc(a.x,a.y,R,0,6.29);ctx.fill();
    txt(ctx,n,a.x,a.y+1,{s:12*k,w:700,c:'#fff',a:'center',b:'middle'});if(down){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x-R*0.7,a.y-R*0.7);ctx.lineTo(a.x+R*0.7,a.y+R*0.7);ctx.moveTo(a.x+R*0.7,a.y-R*0.7);ctx.lineTo(a.x-R*0.7,a.y+R*0.7);ctx.stroke();}
    const q=st.pk.filter(x=>!x.dead&&x.at===n&&x.wait>0&&x.slowQ).length;if(q>1&&!down){pill(ctx,'queue '+q,a.x,a.y-R-14*k,PAL['s4'],'#fff',12*k);}
    if(hopOf[n]){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(a.x,a.y,R+4,0,6.29);ctx.stroke();pill(ctx,String(hopOf[n]),a.x-R-2,a.y-R-2,PAL['s4'],'#fff',12*k);}});
  // hosts
  const L=NODES.L;rr(ctx,L.x-26,L.y-20,52,32,4);ctx.fillStyle='#3a3e45';ctx.fill();rr(ctx,L.x-22,L.y-16,44,24,2);ctx.fillStyle='#9cc4e8';ctx.fill();ctx.fillStyle='#3a3e45';rr(ctx,L.x-32,L.y+12,64,7,3);ctx.fill();
  txt(ctx,small?'Laptop':'Maya’s laptop',6,L.y+42,{s:12*k,w:700});
  const S=NODES.S;for(let i=0;i<3;i++){rr(ctx,S.x-22,S.y-30+i*21,44,18,3);ctx.fillStyle='#3a3e45';ctx.fill();ctx.fillStyle=i===1&&!RM&&Math.sin(t*6)>0?'#5cc27f':'#62d08a';ctx.beginPath();ctx.arc(S.x+14,S.y-21+i*21,2.5,0,6.29);ctx.fill();}
  txt(ctx,small?'Server':'lunarlibrary.test',794,S.y+56,{s:12*k,w:700,a:'right'});if(!small)txt(ctx,IP.S,794,S.y+72,{s:12,c:PAL['cv-soft'],a:'right'});
  const D=NODES.D;rr(ctx,D.x-18,D.y-16,36,32,4);ctx.fillStyle='#5b3fa0';ctx.fill();txt(ctx,'DNS',D.x,D.y+1,{s:11*k>=12?11*k:12,w:700,c:'#fff',a:'center',b:'middle'});
  txt(ctx,small?'Resolver':'DNS resolver',D.x,D.y+30+8*k,{s:12*k,w:700,a:'center'});
  if(st.dnsWait&&!RM){const a=t*5;ctx.strokeStyle=PAL['s5'];ctx.lineWidth=3;ctx.beginPath();ctx.arc(D.x,D.y,26,a,a+4);ctx.stroke();}
  // packets
  const tracked=ap&&p.headers&&p.mode==='send'?(st.pk.find(q=>!q.dead&&q.kind==='data'&&q.to)||st.pk.find(q=>!q.dead&&(q.kind==='syn'||q.kind==='hack'))):null;
  st.pk.forEach(pk=>{if(pk.dead)return;const [x,y]=pkPos(pk);let [col,lab]=KIND[pk.kind]||['#888',''];if(pk.kind==='data')lab=String(pk.seq);if(pk.kind==='probe')lab='TTL '+pk.ttl;if(!hon&&BIO_LABEL[pk.kind])lab=BIO_LABEL[pk.kind];
    if(pk.kind==='ack'&&!hon)lab='';const s=12*k;ctx.font='700 '+s+'px '+MONO;const w=Math.max(16,ctx.measureText(lab).width+8),hh=s+6;
    let ox=0,oy=0;if(pk.wait>0&&pk.slowQ){const i=st.pk.filter(q=>!q.dead&&q.at===pk.at&&q.wait>0&&q.slowQ).indexOf(pk);ox=-(i%4)*6-routerR(k);oy=-(Math.floor(i/4))*6;}
    rr(ctx,x-w/2+ox,y-hh/2+oy,w,hh,4);ctx.fillStyle=col;ctx.fill();if(pk===tracked){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2.5;ctx.stroke();}
    if(lab)mt(ctx,lab,x+ox,y+oy+1,{s,w:700,c:'#fff',a:'center',b:'middle'});});
  st.fx.forEach(f=>{ctx.globalAlpha=clamp(f.t/0.6,0,1);mt(ctx,'✕',f.x,f.y,{s:18*k,w:800,c:PAL['s1'],a:'center',b:'middle'});ctx.globalAlpha=1;});
  // status pill
  if(st.status)pill(ctx,st.status,260,24,st.S.fail&&st.status===st.S.fail?'#b3261e':'#3f5f7f','#fff',13*k);
  else if(p.mode==='case')pill(ctx,'Ticket '+(clamp(Math.round(+p.caseSel)||0,0,2)+1)+': '+CASES[clamp(Math.round(+p.caseSel)||0,0,2)].t,260,24,'#3f5f7f','#fff',13*k);
  // header card
  if(ap&&p.headers&&p.mode==='send'){const x0=492,y0=6,w=302,lh=15*Math.min(k,1.4)+6,hh=lh*4+14;rr(ctx,x0,y0,w,hh,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const f=12*k;if(tracked){const pk=tracked,src=pk.hops>=1?IP.NAT:IP.L,lines=[(pk.kind==='data'?'Packet '+pk.seq:pk.kind.toUpperCase())+'  TTL '+pk.ttl,'src '+src+':50122','dst '+IP.S+':443',pk.kind==='data'?'TCP seq '+(1001+(pk.seq-1)*1460)+' +1460 B':'TCP flags '+(pk.kind==='syn'?'SYN':'ACK')];
      lines.forEach((s,i)=>mt(ctx,s,x0+10,y0+10+lh*i+lh/2,{s:f,w:i?500:700,b:'middle',c:i?PAL['cv-ink']:PAL['s2']}));}
    else txt(ctx,'Send the essay to see headers',x0+w/2,y0+hh/2,{s:f,c:PAL['cv-soft'],a:'center',b:'middle'});}
  // reassembly strip
  if(p.mode==='send'||st.S.on){const SS=st.S,N=SS.N||clamp(Math.round(+p.msgSize)||8,2,16),y=426;txt(ctx,small?'Server:':'Server has:',10,y,{s:13*k,w:700,b:'middle'});
    const x0=small?150:120,cw=Math.min(36,(800-x0-200)/N);for(let i=1;i<=N;i++){const x=x0+(i-1)*cw,got=SS.got[i];rr(ctx,x+2,y-14,cw-4,28,5);if(got){ctx.fillStyle=SS.oooSeq[i]?'#c27a00':'#2d6bd2';ctx.fill();}else{ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();}
      if(cw>=12*k*1.2||i%2===1)mt(ctx,String(i),x+cw/2,y+1,{s:Math.min(12*k,cw*0.7)>=12?Math.min(12*k,cw*0.7):12,w:700,c:got?'#fff':PAL['cv-soft'],a:'center',b:'middle'});}
    const done=SS.done,msg=done?(small?'Essay complete':'Reassembled: essay complete'):SS.fail?SS.fail:SS.N?(SS.got.filter(Boolean).length+'/'+SS.N):'';if(msg)txt(ctx,msg,790,y,{s:13*k,w:700,a:'right',b:'middle',c:done?PAL['s3']:SS.fail?PAL['s1']:PAL['cv-soft']});}}
function boxDims(ctx,b,k){const s=15*Math.min(k,1.5);ctx.font='700 '+s+'px sans-serif';const nm=k>1.3?b.s:b.n;const w=Math.max(ctx.measureText(nm).width+24,110);return {w,h:s*1.6+(atLeast('honors')&&k<=1.3?18:10),nm};}
function drawDns(sim,ctx,k,t){const st=sim.st,w=st.dw,hon=atLeast('honors');
  const ctr=n=>DBOX[n];['root','tld','auth'].forEach(n=>{const A=ctr('R'),B=ctr(n);ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.globalAlpha=1;});
  ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ctr('L').x,ctr('L').y);ctx.lineTo(ctr('R').x,ctr('R').y);ctx.stroke();ctx.globalAlpha=1;
  const used=new Set();if(w)w.steps.slice(0,w.done?w.steps.length:w.i).forEach(s=>{used.add(s[0]);used.add(s[1]);});
  const boxes=()=>Object.keys(DBOX).forEach(n=>{const b=DBOX[n],d=boxDims(ctx,b,k);const down=n==='auth'&&sim.p.authDown;rr(ctx,b.x-d.w/2,b.y-d.h/2,d.w,d.h,10);ctx.fillStyle=down?'#8a8a90':n==='L'?'#3a3e45':n==='R'?'#5b3fa0':'#3f5f7f';ctx.fill();
    if(used.has(n)){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.stroke();}
    txt(ctx,d.nm,b.x,b.y-(hon&&k<=1.3?8:0),{s:15*Math.min(k,1.5),w:700,c:'#fff',a:'center',b:'middle'});if(hon&&k<=1.3)txt(ctx,down?'not answering':b.ip,b.x,b.y+13,{s:13,c:'#e6e6ea',a:'center',b:'middle'});});
  if(w){const s=w.steps[w.i],A=DBOX[s[0]],B=DBOX[s[1]],lostTry=sim.p.authDown&&s[1]==='auth';const ms=lostTry?100:DMS[dkey(s[0],s[1])];let f=w.done?1:clamp(w.prog/ms,0,1);if(lostTry)f=Math.min(f*1.6,0.55);
    if(!w.done){const x=A.x+(B.x-A.x)*f,y=A.y+(B.y-A.y)*f;ctx.fillStyle=lostTry&&f>=0.55?PAL['s1']:'#7b3fe4';ctx.beginPath();ctx.arc(x,y,9*Math.min(k,1.4),0,6.29);ctx.fill();if(lostTry&&f>=0.55)mt(ctx,'✕',x,y-22*k,{s:16*k,c:PAL['s1'],a:'center',b:'middle'});}
    boxes();
    // caption card for the current message
    rr(ctx,16,384,768,58,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    const cap=w.done?(sim.p.authDown?'Lookup failed after '+Math.round(w.total)+' ms: no IP address, so no connection.':'Done in '+Math.round(w.total)+' ms: '+SITE+' = 203.0.113.80'):(w.i+1)+'. '+s[2];let fs=14*k;ctx.font='600 '+fs+'px sans-serif';while(ctx.measureText(cap).width>740&&fs>12*k){fs-=1;ctx.font='600 '+fs+'px sans-serif';}
    let line=cap;if(ctx.measureText(cap).width>740){const words=cap.split(' ');let a='',i=0;while(i<words.length&&ctx.measureText(a+words[i]+' ').width<740){a+=words[i]+' ';i++;}txt(ctx,a.trim(),400,400,{s:fs,w:600,a:'center',b:'middle'});txt(ctx,words.slice(i).join(' '),400,426,{s:fs,w:600,a:'center',b:'middle'});}
    else txt(ctx,line,400,413,{s:fs,w:600,a:'center',b:'middle',c:w.done&&sim.p.authDown?PAL['s1']:PAL['cv-ink']});}
  else{boxes();txt(ctx,'Press Look it up to find '+(k>1.3?'the site’s IP':'the IP address of '+SITE),400,413,{s:14*k,c:PAL['cv-soft'],a:'center',b:'middle'});}}
NET.controls[0].onChange=modeChanged;
NET.onLevel=syncMode;
BioLab.register(NET);
})();

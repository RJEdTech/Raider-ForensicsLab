(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* ================= one day of logs at Northgate Academy (fictional) ================= */
const PLACES={Denver:[39.74,-104.99,'Denver, US'],Aurora:[39.73,-104.83,'Aurora, US'],Lakewood:[39.70,-105.08,'Lakewood, US'],Chicago:[41.88,-87.63,'Chicago, US'],
  Amsterdam:[52.37,4.90,'Amsterdam, NL'],Lisbon:[38.72,-9.14,'Lisbon, PT']};
const CAMPUS='192.0.2.10',SPRAY_IP='198.51.100.77',THIEF_IP='198.51.100.140',SCAN_IP='203.0.113.9',PORTAL='10.20.0.80';
const USERS=['akim','bnguyen','cortiz','dpatel','eokafor','fsantos','gwhite','hlarsen','ijohnson','jlee','kmurphy','lchen','mbrown','nadams','opark','pgarcia','qhassan','rsilva','tnovak','umorales','vwright','wbaker','xli','yrossi','zkhan'];
const hms=(h,m,s)=>h*3600+(m||0)*60+(s||0);
const tstr=t=>{t=Math.floor(t);return String(Math.floor(t/3600)).padStart(2,'0')+':'+String(Math.floor(t/60)%60).padStart(2,'0')+':'+String(t%60).padStart(2,'0');};
function km(a,b){const R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dg=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
function genDay(){const R=rng(2026),E=[];const pick=a=>a[Math.floor(R()*a.length)];
  const S=(t,user,ip,place,app,ok,tag)=>E.push({log:'signin',t,user,ip,place,loc:PLACES[place][2],app,ok,tag});
  const F=(t,src,dst,port,act,tag)=>E.push({log:'fw',t,src,dst,port,proto:port===53?'UDP':'TCP',ok:act==='allow',act,tag});
  const Wb=(t,ip,user,method,path,status,bytes,tag)=>E.push({log:'web',t,ip,user,method,path,status,bytes,ok:status<400,tag});
  USERS.forEach((u,ui)=>{if(u==='jlee'||u==='mbrown')return;const n=2+Math.floor(R()*3);
    for(let i=0;i<n;i++){const t=hms(7,5)+Math.floor(R()*(u==='xli'?5*3600:8.4*3600)),app=pick(['Email','Portal','Portal','Email','Gradebook']);
      if(R()<0.08){const k=1+Math.floor(R()*2);for(let j=k;j>=1;j--)S(t-j*(25+Math.floor(R()*40)),u,CAMPUS,'Denver',app,false);}S(t,u,CAMPUS,'Denver',app,true);}
    if(R()<0.35&&u!=='xli'){const pl=pick(['Denver','Aurora','Lakewood']);S(hms(18)+Math.floor(R()*4.5*3600),u,'192.0.2.'+(30+ui*2),pl,pick(['Email','Portal']),true);}});
  // a teacher who forgot her password (normal, but noisy)
  [hms(8,5,10),hms(8,5,41),hms(8,6,20),hms(8,7,2),hms(8,8,15)].forEach(t=>S(t,'mbrown',CAMPUS,'Denver','Email',false));S(hms(8,9,30),'mbrown',CAMPUS,'Denver','Email',true);S(hms(12,44,3),'mbrown',CAMPUS,'Denver','Gradebook',true);
  // a student signing in from Chicago in the evening (travel that is possible)
  S(hms(19,40,12),'xli','192.0.2.201','Chicago','Portal',true);
  // attack A: password spraying from one address, then a success on jlee
  const tg=['akim','cortiz','gwhite','jlee','opark','tnovak'];let t=hms(7,42,10);for(let i=0;i<34;i++){S(t,tg[i%6],SPRAY_IP,'Amsterdam','Email',false,'spray');t+=11+Math.floor(R()*3);}
  S(hms(7,49,5),'jlee',SPRAY_IP,'Amsterdam','Email',true,'breakin');
  // the real jlee at school, then someone using jlee from far away
  S(hms(7,55,12),'jlee',CAMPUS,'Denver','Portal',true,'jleereal');S(hms(10,31,40),'jlee',CAMPUS,'Denver','Email',true);S(hms(13,2,40),'jlee',CAMPUS,'Denver','Gradebook',true,'jleereal2');
  S(hms(13,19,5),'jlee',THIEF_IP,'Lisbon','Gradebook',true,'travel');
  // firewall: outbound web, inbound portal, background noise, the IT team's scan, the port scan
  for(let i=0;i<70;i++)F(hms(7)+Math.floor(R()*9*3600),'10.10.'+(1+Math.floor(R()*4))+'.'+(10+Math.floor(R()*190)),'198.51.100.'+(200+Math.floor(R()*50)),443,'allow');
  for(let i=0;i<26;i++)F(hms(6)+Math.floor(R()*16*3600),'192.0.2.'+(30+Math.floor(R()*60)),PORTAL,443,'allow');
  for(let h=0;h<24;h+=0.5)if(R()<0.85)F(Math.floor(h*3600+R()*1700),'203.0.113.'+(20+Math.floor(R()*230)),pick(['10.20.0.10',PORTAL]),pick([22,23,445,3389,1433]),'deny');
  [21,22,80,135,139,443,445,3389].forEach((p,i)=>F(hms(2,0,5)+i*9,'10.20.0.250','10.20.0.10',p,'allow','itscan'));
  [21,22,23,25,53,80,110,135,139,143,443,445,1433,3306,3389,5900,8080].forEach((p,i)=>F(hms(11,15,2)+Math.round(i*2.3),SCAN_IP,PORTAL,p,p===443?'allow':'deny','scan'));
  F(hms(13,19,30),THIEF_IP,PORTAL,443,'allow','thieffw');F(hms(13,24,20),THIEF_IP,PORTAL,443,'allow','thieffw');
  // web server log for portal.northgate.test
  const books=['the-giver','animal-farm','chem-lab-manual','us-history-ch7','algebra-2-notes','frankenstein','biology-atlas','spanish-reader'];
  for(let i=0;i<88;i++){const u=pick(USERS.filter(x=>x!=='jlee')),home=R()<0.25,ip=home?'192.0.2.'+(30+USERS.indexOf(u)*2):CAMPUS,tt=home?hms(16)+Math.floor(R()*6*3600):hms(7,10)+Math.floor(R()*8.5*3600);
    const r=R();if(r<0.2)Wb(tt,ip,u,'POST','/login',302,812);else if(r<0.55)Wb(tt,ip,u,'GET','/assignments/'+(100+Math.floor(R()*80)),200,20000+Math.floor(R()*70000));
    else if(r<0.75)Wb(tt,ip,u,'GET','/grades',200,28000+Math.floor(R()*9000));else if(r<0.9)Wb(tt,ip,u,'GET','/calendar',200,15000+Math.floor(R()*5000));else Wb(tt,ip,'','GET','/favicon.ico',404,0);}
  books.forEach((b,i)=>{const u=pick(USERS.filter(x=>x!=='jlee'));Wb(hms(8)+Math.floor(R()*10*3600),R()<0.5?CAMPUS:'192.0.2.'+(30+USERS.indexOf(u)*2),u,'GET','/library/ebooks/'+b+'.pdf',200,3000000+Math.floor(R()*6000000));});
  Wb(hms(13,4,10),CAMPUS,'jlee','GET','/staff/gradebook',200,84211);
  ['/admin','/wp-login.php','/.env','/phpmyadmin/','/backup.zip'].forEach((p,i)=>Wb(hms(11,15,44)+i*3,SCAN_IP,'','GET',p,404,0,'scanweb'));
  Wb(hms(13,19,40),THIEF_IP,'jlee','GET','/staff/gradebook',200,84211,'thief1');Wb(hms(13,24,31),THIEF_IP,'jlee','GET','/staff/gradebook/export?term=fall2026',200,4812331,'download');
  Wb(hms(13,25,2),THIEF_IP,'jlee','GET','/staff/roster/export',200,1204556,'download2');
  E.sort((a,b)=>a.t-b.t);E.forEach((e,i)=>{e.i=i;e.who=e.log==='fw'?e.src:e.ip;
    e.detail=e.log==='signin'?e.user+' · '+e.app+' · '+e.loc:e.log==='fw'?'→ '+e.dst+':'+e.port+' '+e.proto:e.method+' '+e.path+(e.bytes>=1e6?' · '+(e.bytes/1e6).toFixed(1)+' MB':'')+(e.user?' · '+e.user:'');
    e.res=e.log==='signin'?(e.ok?'Success':'Failed'):e.log==='fw'?(e.ok?'Allow':'Deny'):String(e.status);
    e.hay=(tstr(e.t)+' '+e.log+' '+e.who+' '+e.detail+' '+e.res+' '+(e.dst||'')+' '+(e.place||'')).toLowerCase();});
  return E;}
const DAY=genDay();
const byTag=tag=>DAY.find(e=>e.tag===tag);
const TRAVEL=(()=>{const a=byTag('jleereal2'),b=byTag('travel'),d=km(PLACES.Denver,PLACES.Lisbon),h=(b.t-a.t)/3600;return {d,h,v:d/h,a,b};})();
const LOGN={signin:'Sign-in',fw:'Firewall',web:'Web server'};

/* ---------- searching the day ---------- */
function newQ(){return {log:'all',text:'',bad:false,from:0,to:24,sort:'time',group:'none'};}
function parseQuery(s){const toks=String(s||'').toLowerCase().split(/\s+/).filter(Boolean);return toks.map(tk=>{const m=tk.match(/^(ip|user|port|path|status|result|loc|log|app):(.+)$/);return m?{k:m[1],v:m[2]}:{v:tk};});}
function tokOK(e,tk){const v=tk.v;switch(tk.k){
  case 'ip':return [e.ip,e.src,e.dst].some(x=>x&&x.toLowerCase().includes(v));case 'user':return !!e.user&&e.user.toLowerCase().includes(v);
  case 'port':return e.port!==undefined&&String(e.port)===v;case 'path':return !!e.path&&e.path.toLowerCase().includes(v);case 'status':return e.status!==undefined&&String(e.status).startsWith(v);
  case 'result':return v.startsWith('fail')||v.startsWith('den')||v==='bad'?!e.ok:v.startsWith('succ')||v.startsWith('allow')||v==='ok'?e.ok:e.res.toLowerCase().includes(v);
  case 'loc':return !!e.loc&&e.loc.toLowerCase().includes(v);case 'log':return e.log.startsWith(v)||LOGN[e.log].toLowerCase().startsWith(v);case 'app':return !!e.app&&e.app.toLowerCase().includes(v);
  default:return e.hay.includes(v);}}
function filterDay(q){const toks=parseQuery(q.text);return DAY.filter(e=>(q.log==='all'||e.log===q.log)&&(!q.bad||!e.ok)&&e.t>=q.from*3600&&e.t<q.to*3600&&toks.every(tk=>tokOK(e,tk)));}
const qActive=q=>q.log!=='all'||q.text.trim()||q.bad||q.from>0||q.to<24;
function groupOf(e,g){return g==='ip'?e.who:g==='user'?(e.user||null):g==='port'?(e.port!==undefined?String(e.port):null):g==='loc'?(e.loc||null):null;}

/* ================= 30 days of labeled data for alert tuning ================= */
function genMonth(){const R=rng(77),SI=[],SC=[],eps=[];let hid=0;
  for(let d=0;d<30;d++){const wk=d%7<5;const nb=wk?30:9;
    for(let i=0;i<nb;i++){const u='u'+Math.floor(R()*420),camp=wk&&R()<0.72,ip=camp?'CAMPUS':'h'+Math.floor(R()*350);const r=R();
      const k=r<0.55?1:r<0.8?2:r<0.9?3:r<0.97?4+Math.floor(R()*3):7+Math.floor(R()*4);
      let t=camp?(R()<0.45?hms(7,40)+R()*4200:hms(9)+R()*6.5*3600):R()*86400;for(let j=0;j<k;j++){SI.push({d,t,ip,user:u,atk:-1});t+=15+R()*75;}}
    for(let i=0;i<34;i++){const ip='n'+Math.floor(R()*5000),np=R()<0.8?1:2,t0=R()*86400;for(let j=0;j<np;j++)SC.push({d,t:t0+j*4,ip,port:[22,23,445,3389,1433,80,8080][Math.floor(R()*7)],atk:-1});}
    if(wk)for(let j=0;j<6;j++)SC.push({d,t:hms(9+j),ip:'printer',port:[515,631,9100][j%3],atk:-1});
    if(d%7===1){for(let j=0;j<60;j++)SC.push({d,t:hms(2)+j*6,ip:'IT',port:20+j*37,atk:-1,it:true});}}
  const ep=(kind,type)=>{eps.push({id:eps.length,kind,type});return eps.length-1;};
  const days=[2,4,6,8,10,12,15,17,19,21,23,25,27,29];let di=0;const nd=()=>days[(di++)%days.length];
  for(let i=0;i<4;i++){const id=ep('burst','signin'),d=nd(),u='u'+Math.floor(R()*420),ip='a'+id;let t=R()*80000,n=15+Math.floor(R()*45);for(let j=0;j<n;j++){SI.push({d,t,ip,user:u,atk:id});t+=6+R()*8;}}
  for(let i=0;i<4;i++){const id=ep('spray','signin'),d=nd(),ip='a'+id,nu=6+Math.floor(R()*4),us=[];for(let j=0;j<nu;j++)us.push('u'+Math.floor(R()*420));let t=R()*80000;const tries=2+Math.floor(R()*2);
    for(let a=0;a<tries;a++)us.forEach(u=>{SI.push({d,t,ip,user:u,atk:id});t+=10+R()*15;});}
  for(let i=0;i<3;i++){const id=ep('slow','signin'),d=nd(),u='u'+Math.floor(R()*420),ip='a'+id;let t=R()*70000;const n=7+Math.floor(R()*4);for(let j=0;j<n;j++){SI.push({d,t,ip,user:u,atk:id});t+=360+R()*480;}}
  for(let i=0;i<3;i++){const id=ep('dist','signin'),d=nd(),u='u'+Math.floor(R()*420);let t=R()*80000;const n=14+Math.floor(R()*9);for(let j=0;j<n;j++){SI.push({d,t,ip:'b'+id+'-'+j,user:u,atk:id});t+=30+R()*40;}}
  for(let i=0;i<5;i++){const id=ep('fast','scan'),d=nd(),ip='s'+id;let t=R()*80000;const n=20+Math.floor(R()*60);for(let j=0;j<n;j++){SC.push({d,t,ip,port:1+Math.floor(R()*9000),atk:id});t+=0.5+R()*1.5;}}
  for(let i=0;i<3;i++){const id=ep('slowscan','scan'),d=nd(),ip='s'+id;let t=R()*60000;const n=16+Math.floor(R()*9);for(let j=0;j<n;j++){SC.push({d,t,ip,port:1+Math.floor(R()*9000),atk:id});t+=240+R()*180;}}
  [SI,SC].forEach(a=>a.sort((x,y)=>x.d-y.d||x.t-y.t));
  eps.forEach(e=>{const ev=(e.type==='scan'?SC:SI).filter(x=>x.atk===e.id);e.day=ev[0].d+1;e.n=ev.length;e.min=Math.max(1,Math.round((ev[ev.length-1].t-ev[0].t)/60));
    e.keys=new Set(ev.map(x=>e.type==='scan'?x.port:x.user)).size;e.ips=new Set(ev.map(x=>x.ip)).size;});
  return {SI,SC,eps};}
const MONTH=genMonth();
const KIND={burst:'Fast guessing at one account',spray:'Spraying: a few tries on many accounts',slow:'Low and slow guessing',dist:'Many addresses, one account',fast:'Fast port scan',slowscan:'Slow port scan'};
const groupsCache={};
function groups(type,by,M){const key=type+'|'+by+'|'+M;if(groupsCache[key])return groupsCache[key];const src=type==='scan'?MONTH.SC:MONTH.SI,G={};
  src.forEach(e=>{const k=e.d+'|'+(type==='scan'||by==='ip'?e.ip:e.user);(G[k]=G[k]||[]).push(e);});const W=M*60,out=[];
  Object.keys(G).forEach(k=>{const a=G[k];let best=0,lo=0;const cnt={};let distinct=0;
    for(let hi=0;hi<a.length;hi++){if(type==='scan'){if(!cnt[a[hi].port])distinct++;cnt[a[hi].port]=(cnt[a[hi].port]||0)+1;}
      while(a[hi].t-a[lo].t>W){if(type==='scan'){cnt[a[lo].port]--;if(!cnt[a[lo].port])distinct--;}lo++;}best=Math.max(best,type==='scan'?distinct:hi-lo+1);}
    const atk=new Set(a.filter(e=>e.atk>=0).map(e=>e.atk));out.push({k,max:best,atk,it:a.some(e=>e.it),n:a.length});});
  groupsCache[key]=out;return out;}
function alertStats(type,by,M,N,allow){const gs=groups(type,by,M),eps=MONTH.eps.filter(e=>e.type===type);let tp=0,fp=0;const det=new Set();
  gs.forEach(g=>{if(g.max<N||(allow&&g.it))return;if(g.atk.size){tp++;g.atk.forEach(a=>det.add(a));}else fp++;});
  const total=eps.length,found=det.size;return {tp,fp,alerts:tp+fp,found,total,fn:total-found,prec:tp+fp?tp/(tp+fp):null,rec:total?found/total:0,perDay:(tp+fp)/30,det};}
const ruleOf=sim=>({type:atLeast('ap')?sim.p.rtype:'signin',by:atLeast('honors')&&sim.p.rtype!=='scan'?sim.p.by:'ip',M:atLeast('honors')?Math.round(sim.p.win):10,N:Math.round(sim.p.thr),allow:atLeast('ap')&&sim.p.allow});
const stats=sim=>{const r=ruleOf(sim);return alertStats(r.type,r.by,r.M,r.N,r.allow);};

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!atLeast('ap')&&sim.p.mode==='correlate')BioLab.setValues(sim,{mode:'investigate'});if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const e=document.getElementById(d.id+'-'+c.id)||document.getElementById(d.id+'-'+c.id+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{if(!a.modes)return;const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}

/* ---------- panel ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function injectStyle(){if(document.getElementById('lg-style'))return;const s=document.createElement('style');s.id='lg-style';s.textContent=`
.lg h4{margin:14px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.lg h4:first-child{margin-top:0}
.lg .lg-f{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:end}.lg .lg-f label{display:flex;flex-direction:column;font-size:13px;color:var(--muted);gap:2px}
.lg input[type=text],.lg input[type=search],.lg select{border:1px solid var(--line);background:var(--card);border-radius:7px;padding:5px 7px;font-size:15px}
.lg .lg-search{width:min(100%,320px)}.lg .lg-chk{flex-direction:row!important;align-items:center;gap:6px!important;font-size:14px!important;color:var(--fg)!important}
.lg .lg-n{font-size:14px;color:var(--muted);margin:8px 0 4px}.lg .lg-help{font-size:13px;color:var(--muted);margin:4px 0 0}
.lg table{font-size:13px}.lg td,.lg th{padding:4px 7px;text-align:left}.lg td.lg-res{font-weight:700}.lg tr.lg-bad td.lg-res{color:var(--bad)}.lg tr.lg-pin td{background:color-mix(in srgb,var(--rj) 10%,transparent)}
.lg .lg-tbl{max-height:380px;overflow:auto;border:1px solid var(--line);border-radius:8px}.lg .lg-tbl th{position:sticky;top:0;z-index:1}
.lg .lg-ib{border:1px solid var(--line);background:var(--card2);border-radius:6px;padding:1px 7px;cursor:pointer;font-size:13px}
.lg .lg-grp{display:flex;flex-wrap:wrap;gap:6px}.lg .lg-grp button{border:1px solid var(--line);background:var(--card2);border-radius:999px;padding:3px 10px;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}
.lg .lg-grp button b{font-weight:700}.lg .lg-ans{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px 12px}.lg .lg-ans label{display:flex;flex-direction:column;font-size:14px;gap:3px}
.lg .lg-ans input{width:100%}.lg .lg-ok{color:var(--good);font-weight:700}.lg .lg-no{color:var(--bad);font-weight:700}.lg .lg-res-p{font-size:14px;margin:6px 0 0}
.lg ul.lg-list{list-style:none;padding:0;margin:0;font-size:14px}.lg ul.lg-list li{padding:4px 0;border-bottom:1px solid var(--line);display:flex;gap:8px;align-items:baseline}.lg ul.lg-list li:last-child{border-bottom:0}`;
  document.head.appendChild(s);}
const HRS=[...Array(25).keys()];
function filterUI(sim){const q=sim.q,hon=atLeast('honors');
  return `<div class="lg-f"><label>Search<input type="search" class="lg-search" data-a="text" data-fid="text" value="${esc(q.text)}" placeholder="${hon?'e.g. ip:198.51 result:fail':'e.g. jlee, 404, deny'}" aria-describedby="lg-help"></label>
    <label>Log<select data-a="log" data-fid="log">${[['all','All three'],['signin','Sign-in'],['fw','Firewall'],['web','Web server']].map(o=>`<option value="${o[0]}"${q.log===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></label>
    <label>From<select data-a="from" data-fid="from">${HRS.slice(0,24).map(h=>`<option value="${h}"${q.from===h?' selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select></label>
    <label>To<select data-a="to" data-fid="to">${HRS.slice(1).map(h=>`<option value="${h}"${q.to===h?' selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select></label>
    <label>Sort<select data-a="sort" data-fid="sort"><option value="time"${q.sort==='time'?' selected':''}>Time</option><option value="bytes"${q.sort==='bytes'?' selected':''}>Largest download</option></select></label>
    ${hon?`<label>Count by<select data-a="group" data-fid="group">${[['none','Nothing'],['ip','Source address'],['user','Account'],['port','Port'],['loc','Location']].map(o=>`<option value="${o[0]}"${q.group===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select></label>`:''}
    <label class="lg-chk"><input type="checkbox" data-a="bad" data-fid="bad"${q.bad?' checked':''}> Only failures, denies and errors</label>
    <button type="button" class="btn" data-a="clearq" data-fid="clearq">Clear filters</button></div>
    <p class="lg-help" id="lg-help">${hon?'Type words to match anywhere, or field:value. Fields: ip, user, port, path, status, result, loc, log, app. All terms must match.':'Type any word or number to keep only the lines that contain it. Click a time on the stage to zoom to that hour.'}</p>`;}
function tableUI(sim,rows){const q=sim.q,pinMode=sim.p.mode==='correlate';let h='';
  if(q.group!=='none'&&atLeast('honors')){const C={};rows.forEach(e=>{const g=groupOf(e,q.group);if(g===null)return;const c=C[g]=C[g]||{n:0,bad:0};c.n++;if(!e.ok)c.bad++;});
    const top=Object.entries(C).sort((a,b)=>b[1].n-a[1].n).slice(0,14);
    h+=`<p class="lg-n">Counting ${rows.length} matching lines by ${({ip:'source address',user:'account',port:'port',loc:'location'})[q.group]}. Click one to filter to it.</p><div class="lg-grp">`+top.map(([k,c])=>`<button type="button" data-a="drill" data-v="${esc(k)}" data-fid="drill-${esc(k)}"><b>${c.n}</b> ${esc(k)}${c.bad?' ('+c.bad+' failed or denied)':''}</button>`).join('')+'</div>';}
  let list=rows.slice();if(q.sort==='bytes')list.sort((a,b)=>(b.bytes||0)-(a.bytes||0));const shown=list.slice(0,70);
  h+=`<p class="lg-n">${rows.length===DAY.length?'All '+DAY.length+' lines':rows.length+' of '+DAY.length+' lines match'}${rows.length>shown.length?'. Showing the first '+shown.length+'.':'.'}</p>`;
  if(!shown.length)return h+'<p class="lg-n">Nothing matches. Loosen the search.</p>';
  h+=`<div class="lg-tbl"><table><thead><tr><th>Time</th><th>Log</th><th>Source</th><th>Details</th><th>Result</th>${pinMode?'<th>Timeline</th>':''}</tr></thead><tbody>`+shown.map(e=>{const pinned=sim.pins.includes(e.i);
    return `<tr class="${e.ok?'':'lg-bad'}${pinned?' lg-pin':''}"><td>${tstr(e.t)}</td><td>${LOGN[e.log]}</td><td>${e.who}</td><td>${esc(e.detail)}</td><td class="lg-res">${e.res}</td>${pinMode?`<td><button type="button" class="lg-ib" data-a="pin" data-i="${e.i}" data-fid="pin${e.i}">${pinned?'Remove':'Add'}</button></td>`:''}</tr>`;}).join('')+'</tbody></table></div>';
  return h;}
const ANS=[{id:'a',q:'Password guessing: which address made the attempts?',ok:v=>v.replace(/\s/g,'')===SPRAY_IP,hint:'Look for a spike of failed sign-ins on the timeline, then count the failures by source address.'},
  {id:'b',q:'Port scan: which address probed the server?',ok:v=>v.replace(/\s/g,'')===SCAN_IP,hint:'A scan is many denied connections from one address to many different ports in a short time. Filter the firewall log to denies.'},
  {id:'c',q:'Impossible travel: which account signed in from two places too far apart?',ok:v=>v.trim().toLowerCase()==='jlee',hint:'Filter the sign-in log to successes and compare each account’s locations and times.'},
  {id:'d',q:'Suspicious download: which file was taken?',ok:v=>/gradebook\/?export|gradebook-export|export\?term|gradebook/.test(v.trim().toLowerCase())&&!/^\/?staff\/gradebook$/.test(v.trim().toLowerCase()),hint:'Sort the web server log by largest download and look for staff pages fetched from an unusual address.'}];
function correlateCheck(sim){const P=sim.pins.map(i=>DAY[i]);const has=f=>P.some(f);
  const key=[{t:'The password-guessing burst from '+SPRAY_IP,ok:has(e=>e.tag==='spray')},{t:'The break-in: a successful sign-in to jlee from that address',ok:has(e=>e.tag==='breakin')},
    {t:'jlee signing in from Lisbon while the real jlee is at school',ok:has(e=>e.tag==='travel')},{t:'The gradebook export downloaded from the Lisbon address',ok:has(e=>e.tag==='download'||e.tag==='download2')}];
  const ips=new Set([SPRAY_IP,THIEF_IP]),unrelated=P.filter(e=>!(ips.has(e.who)||e.user==='jlee'||(e.dst&&ips.has(e.dst))));return {key,unrelated,n:key.filter(k=>k.ok).length};}
function panelHTML(sim){injectStyle();const mode=sim.p.mode,hon=atLeast('honors'),ap=atLeast('ap');let h='<div class="lg">';
  if(mode==='alerts'){const r=ruleOf(sim),s=stats(sim),eps=MONTH.eps.filter(e=>e.type===r.type);
    h+=`<h4>Try it yourself: your alert rule</h4><p style="margin:0;font-size:15px">Alert when one ${r.type==='scan'?'address is denied on':r.by==='ip'?'address has':'account has'} <b>${r.N} or more ${r.type==='scan'?'different ports':'failed sign-ins'}</b> within <b>${r.M} minute${r.M===1?'':'s'}</b>${r.allow?', ignoring the IT team’s own scanner':''}.</p>
      <p class="lg-help">Tested on 30 days of Northgate’s ${r.type==='scan'?'firewall':'sign-in'} logs, where the security team has already labeled the real attacks. Move the sliders beside the stage.</p>
      <h4>Results</h4><p style="margin:0;font-size:15px">${s.alerts} alert${s.alerts===1?'':'s'} in 30 days (${s.perDay.toFixed(1)} a day): <span class="lg-ok">${s.tp} real</span>, <span class="lg-no">${s.fp} false alarm${s.fp===1?'':'s'}</span>. Attacks caught: <b>${s.found} of ${s.total}</b>.</p>
      <h4>The labeled attacks</h4><ul class="lg-list">`+eps.map((e,i)=>`<li><span class="${s.det.has(e.id)?'lg-ok':'lg-no'}">${s.det.has(e.id)?'Caught':'Missed'}</span> <span>${KIND[e.kind]} <span class="lg-help" style="display:inline">· day ${e.day}: ${e.type==='scan'?e.keys+' ports':e.n+' tries'+(e.keys>1?' on '+e.keys+' accounts':'')+(e.ips>1?' from '+e.ips+' addresses':'')} in ${e.min} min</span></span></li>`).join('')+'</ul>';
    if(ap)h+=`<p class="lg-help">Precision = real ÷ all alerts = ${s.tp} ÷ ${s.alerts||0} = ${s.prec===null?'no alerts yet':Math.round(s.prec*100)+'%'}. Recall = attacks caught ÷ attacks = ${s.found} ÷ ${s.total} = ${Math.round(s.rec*100)}%.</p>`;
    return h+'</div>';}
  const rows=filterDay(sim.q);
  if(mode==='correlate'){const c=correlateCheck(sim);h+=`<h4>Build the incident timeline</h4><p style="margin:0 0 6px;font-size:15px">Add every line that belongs to the same attack. The stage links lines that share an address or an account.</p>
    <ul class="lg-list">`+(sim.pins.length?sim.pins.slice().sort((a,b)=>a-b).map(i=>{const e=DAY[i];return `<li><button type="button" class="lg-ib" data-a="pin" data-i="${i}" data-fid="unpin${i}">Remove</button> ${tstr(e.t)} ${LOGN[e.log]}: ${esc(e.who)} ${esc(e.detail)} (${e.res})</li>`;}).join(''):'<li>No lines added yet. Use the Add buttons in the log table below.</li>')+'</ul>';
    if(sim.checked){h+='<ul class="lg-list" style="margin-top:8px">'+c.key.map(k=>`<li><span class="${k.ok?'lg-ok':'lg-no'}">${k.ok?'✓':'○'}</span> ${k.t}</li>`).join('')+'</ul>';
      if(c.unrelated.length)h+=`<p class="lg-res-p lg-no">${c.unrelated.length} line${c.unrelated.length===1?' does':'s do'} not belong: ${c.unrelated.slice(0,3).map(e=>tstr(e.t)+' '+e.who).join(', ')}. They share no address or account with the attack.</p>`;
      else if(c.n===4)h+='<p class="lg-res-p lg-ok">Every key event is on your timeline, and nothing unrelated. That is the whole incident.</p>';}
    h+=`<div class="row" style="margin-top:8px"><button type="button" class="btn primary" data-a="check" data-fid="check">Check my timeline</button><button type="button" class="btn" data-a="unpinall" data-fid="unpinall">Remove all</button></div>`;}
  else{h+='<h4>Report your findings</h4><div class="lg-ans">'+ANS.map(a=>{const v=sim.ans[a.id]||'',r=sim.res[a.id];return `<label>${a.q}<input type="text" data-a="ans" data-k="${a.id}" data-fid="ans-${a.id}" value="${esc(v)}" autocomplete="off" spellcheck="false">${r===undefined?'':r?'<span class="lg-ok">Correct.</span>':'<span class="lg-no">Not yet. '+a.hint+'</span>'}</label>`;}).join('')+
    '</div><div class="row" style="margin-top:8px"><button type="button" class="btn primary" data-a="checkans" data-fid="checkans">Check my answers</button></div>';
    if(ap){const ok=Object.values(sim.res).filter(Boolean).length;if(ok>=3)h+=`<p class="lg-help">Deep dive: switch the mode to Correlate and build one timeline that connects these clues.</p>`;}}
  h+='<h4>Search the logs</h4>'+filterUI(sim)+tableUI(sim,rows);
  return h+'</div>';}
function rerender(sim,fid,caret){sim._fid=fid;sim._caret=caret;sim.infoDirty=true;BioLab.refresh(sim);}
function bindPanel(sim,el){
  el.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a,q=sim.q;
    if(a==='clearq'){sim.q=newQ();rerender(sim,'clearq');}
    else if(a==='drill'){const pre={ip:'ip:',user:'user:',port:'port:',loc:'loc:'}[q.group]||'';const v=b.dataset.v.toLowerCase().split(',')[0].split(' ')[0];q.text=(q.text.trim()?q.text.trim()+' ':'')+pre+v;q.group='none';rerender(sim,'text');}
    else if(a==='pin'){const i=+b.dataset.i,k=sim.pins.indexOf(i);if(k>=0)sim.pins.splice(k,1);else if(sim.pins.length<14)sim.pins.push(i);rerender(sim,b.dataset.fid);}
    else if(a==='unpinall'){sim.pins=[];sim.checked=false;rerender(sim,'check');}
    else if(a==='check'){sim.checked=true;rerender(sim,'check');}
    else if(a==='checkans'){ANS.forEach(x=>{const v=(sim.ans[x.id]||'').trim();if(v)sim.res[x.id]=x.ok(v);else delete sim.res[x.id];});rerender(sim,'checkans');}};
  el.onchange=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,q=sim.q;
    if(a==='log'||a==='sort'||a==='group'){q[a]=b.value;rerender(sim,b.dataset.fid);}
    else if(a==='from'||a==='to'){q[a]=+b.value;if(q.to<=q.from){if(a==='from')q.to=Math.min(24,q.from+1);else q.from=Math.max(0,q.to-1);}rerender(sim,b.dataset.fid);}
    else if(a==='bad'){q.bad=b.checked;rerender(sim,'bad');}};
  el.oninput=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='text'){sim.q.text=b.value;clearTimeout(sim._tq);const pos=b.selectionStart;sim._tq=setTimeout(()=>rerender(sim,'text',pos),260);}
    else if(a==='ans'){sim.ans[b.dataset.k]=b.value;}};
  el.onkeydown=e=>{const b=e.target.closest('[data-a="ans"]');if(b&&e.key==='Enter'){e.preventDefault();el.querySelector('[data-a="checkans"]').click();}};
  if(sim._fid){const e=el.querySelector('[data-fid="'+CSS.escape(sim._fid)+'"]');if(e){try{e.focus({preventScroll:true});if(sim._caret!=null&&e.setSelectionRange)e.setSelectionRange(sim._caret,sim._caret);}catch(_){}}sim._fid=null;sim._caret=null;}}

/* ---------- drawing ---------- */
const LANES=[{log:'signin',name:'Sign-in log',bad:'failed'},{log:'fw',name:'Firewall log',bad:'denied'},{log:'web',name:'Web server log',bad:'errors'}];
function laneGeom(k){const ph=k>1.4;return {L:ph?16:120,R:786,top:62,h:ph?104:112,gap:ph?30:22,ph};}
function bins(rowsSet,log){const all=new Array(96).fill(0),bad=new Array(96).fill(0),hit=new Array(96).fill(0);
  DAY.forEach(e=>{if(e.log!==log)return;const b=Math.min(95,Math.floor(e.t/900));all[b]++;if(!e.ok)bad[b]++;if(rowsSet&&rowsSet.has(e.i))hit[b]++;});return {all,bad,hit};}
let binCache={key:null,val:null};
function drawDay(sim,ctx,k){const g=laneGeom(k),q=sim.q,act=qActive(q),rows=filterDay(q),set=act?new Set(rows.map(e=>e.i)):null;
  const key=JSON.stringify(q);if(binCache.key!==key){binCache={key,val:LANES.map(l=>bins(set,l.log))};}
  txt(ctx,g.ph?'One school day of logs':'Northgate Academy (fictional): one school day of logs',16,34,{s:16*k,w:700});
  if(!g.ph)txt(ctx,act?rows.length+' of '+DAY.length+' lines match your search':DAY.length+' lines in three logs',786,34,{s:13,c:PAL['cv-soft'],a:'right'});
  const X=t=>g.L+t/86400*(g.R-g.L);
  LANES.forEach((ln,li)=>{const y0=g.top+li*(g.h+g.gap),B=binCache.val[li],mx=Math.max(4,...B.all),bw=(g.R-g.L)/96;const Y=v=>y0+g.h-v/mx*(g.h-18);
    ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(g.L,y0,g.R-g.L,g.h);
    if(g.ph)txt(ctx,ln.name,g.L+4,y0+14*k*0.9,{s:12*k,w:700,c:PAL['cv-soft']});else{txt(ctx,ln.name,g.L-10,y0+18,{s:13,w:700,a:'right'});txt(ctx,'red = '+ln.bad,g.L-10,y0+36,{s:12,c:PAL['cv-soft'],a:'right'});txt(ctx,'tallest bar: '+mx,g.L-10,y0+54,{s:12,c:PAL['cv-soft'],a:'right'});}
    for(let b=0;b<96;b++){if(!B.all[b])continue;const x=g.L+b*bw+0.6,w=bw-1.2;ctx.globalAlpha=act?0.35:1;ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(x,Y(B.all[b]),w,y0+g.h-Y(B.all[b]));
      ctx.fillStyle=PAL['s1'];ctx.fillRect(x,Y(B.bad[b]),w,y0+g.h-Y(B.bad[b]));ctx.globalAlpha=1;
      if(act&&B.hit[b]){ctx.fillStyle=PAL['s2'];ctx.fillRect(x,Y(B.hit[b]),w,y0+g.h-Y(B.hit[b]));}}
    // pinned events (correlate)
    if(sim.p.mode==='correlate')sim.pins.forEach(i=>{const e=DAY[i];if(e.log!==ln.log)return;const x=X(e.t);ctx.strokeStyle=PAL['s5'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+g.h);ctx.stroke();});});
  // time window
  const yA=g.top,yB=g.top+3*g.h+2*g.gap;if(q.from>0||q.to<24){ctx.fillStyle=PAL['cv-bg'];ctx.globalAlpha=0.65;ctx.fillRect(g.L,yA,X(q.from*3600)-g.L,yB-yA);ctx.fillRect(X(q.to*3600),yA,g.R-X(q.to*3600),yB-yA);ctx.globalAlpha=1;
    ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.strokeRect(X(q.from*3600),yA-2,X(q.to*3600)-X(q.from*3600),yB-yA+4);}
  for(let h=0;h<=24;h+=g.ph?6:3){const x=X(h*3600);ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,yA);ctx.lineTo(x,yB);ctx.stroke();txt(ctx,String(h).padStart(2,'0')+':00',clamp(x,g.L+20*k,g.R-20*k),yB+16*k,{s:12*k,c:PAL['cv-soft'],a:'center'});}}
function drawCorrelate(sim,ctx,k){const ph=k>1.4,P=sim.pins.slice().sort((a,b)=>a-b).map(i=>DAY[i]);
  txt(ctx,'Incident timeline',16,34,{s:16*k,w:700});if(!ph)txt(ctx,'Lines that share an address or an account are linked',786,34,{s:13,c:PAL['cv-soft'],a:'right'});
  if(!P.length){const msg='Add log lines from the table below. Each one becomes a card here, in time order.';const lines=wrapT(ctx,msg,600,15*k,600);lines.forEach((l,i)=>txt(ctx,l,400,230+i*20*k,{s:15*k,w:600,a:'center',c:PAL['cv-soft']}));return;}
  const n=P.length,top=60,rowH=Math.min(ph?60:52,(470-top)/n),cardL=ph?16:110,cardR=ph?640:600;
  P.forEach((e,i)=>{const y=top+i*rowH,h=rowH-8;rr(ctx,cardL,y,cardR-cardL,h,8);ctx.fillStyle=e.ok?PAL['card']:'rgba(193,20,48,.12)';ctx.fill();ctx.strokeStyle=e.ok?PAL['line']:PAL['s1'];ctx.lineWidth=1.5;ctx.stroke();
    if(!ph)txt(ctx,tstr(e.t),cardL-10,y+h/2+1,{s:13,w:700,a:'right',b:'middle'});
    const s1=(ph?tstr(e.t).slice(0,5)+' ':'')+LOGN[e.log]+' · '+e.who+' · '+e.res,s2=e.detail;
    const fs=Math.min(13*k,h*0.42);txt(ctx,fit(ctx,s1,cardR-cardL-20,fs,700),cardL+10,y+fs+3,{s:fs,w:700});if(h>2.1*fs+6)txt(ctx,fit(ctx,s2,cardR-cardL-20,Math.max(12,fs*0.92)),cardL+10,y+2*fs+8,{s:Math.max(12,fs*0.92),c:PAL['cv-soft']});});
  // links: shared address (blue) and shared account (purple)
  const lanes=[];const link=(i,j,label,col)=>{let lane=0;while(lanes[lane]&&lanes[lane].some(s=>!(j<s[0]||i>s[1])))lane++;(lanes[lane]=lanes[lane]||[]).push([i,j]);
    const x=Math.min(792,cardR+14+(ph?lane*44:(lane<2?lane*100:200+(lane-2)*14))),y1=top+i*rowH+(rowH-8)/2,y2=top+j*rowH+(rowH-8)/2;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cardR,y1);ctx.lineTo(x,y1);ctx.lineTo(x,y2);ctx.lineTo(cardR,y2);ctx.stroke();
    if(!ph&&lane<2)txt(ctx,label,x+5,(y1+y2)/2,{s:12,c:col,w:700,b:'middle'});};
  const groupsBy=(f)=>{const G={};P.forEach((e,i)=>{f(e).forEach(v=>{if(v)(G[v]=G[v]||[]).push(i);});});return G;};
  const gi=groupsBy(e=>[e.who,e.log==='fw'?e.dst:null]),gu=groupsBy(e=>[e.user]);
  Object.entries(gi).forEach(([v,a])=>{if(a.length>1)link(a[0],a[a.length-1],v,PAL['s2']);});Object.entries(gu).forEach(([v,a])=>{if(a.length>1)link(a[0],a[a.length-1],v,PAL['s5']);});
  if(ph){txt(ctx,'blue = same address, purple = same account',16,492,{s:12*k,c:PAL['cv-soft']});}}
function wrapT(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;const out=[];let cur='';String(s).split(' ').forEach(wd=>{const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;});if(cur)out.push(cur);return out;}
function fit(ctx,s,maxW,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;if(ctx.measureText(s).width<=maxW)return s;while(s.length>3&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);return s+'…';}
function drawAlerts(sim,ctx,k){const ph=k>1.4,r=ruleOf(sim),gs=groups(r.type,r.by,r.M),s=alertStats(r.type,r.by,r.M,r.N,r.allow);
  const unit=r.type==='scan'?'different ports':'failed sign-ins';
  txt(ctx,ph?'Your alert rule, tested':'Your alert rule, tested on 30 days of labeled logs',16,34,{s:16*k,w:700});
  // dot strip
  const L=ph?24:110,Rr=786,maxV=Math.max(60,...gs.map(g=>g.max)),X=v=>L+Math.log(Math.max(1,v))/Math.log(maxV)*(Rr-L);
  const rows=[{y:ph?84:96,h:ph?50:62,name:'Normal activity'},{y:ph?158:174,h:ph?40:46,name:'Labeled attacks'}];
  rows.forEach(rw=>{ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(L,rw.y,Rr-L,rw.h);if(ph)txt(ctx,rw.name,L,rw.y-6,{s:12*k,w:700,c:PAL['cv-soft']});else txt(ctx,rw.name,L-10,rw.y+rw.h/2+4,{s:13,w:700,a:'right'});});
  const J=rng(5);gs.forEach(g=>{if(r.allow&&g.it)return;const atk=g.atk.size>0,rw=rows[atk?1:0],x=X(g.max)+(J()-0.5)*6,y=rw.y+6+J()*(rw.h-12),al=g.max>=r.N;
    ctx.fillStyle=atk?(al?PAL['s3']:PAL['s1']):(al?PAL['s4']:PAL['cv-soft']);ctx.globalAlpha=atk||al?0.95:0.35;ctx.beginPath();ctx.arc(x,y,atk?4.5:3,0,6.29);ctx.fill();});ctx.globalAlpha=1;
  const tx=X(r.N)-3;ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx,rows[0].y-8);ctx.lineTo(tx,rows[1].y+rows[1].h+6);ctx.stroke();
  const ty=ph?246:rows[1].y+rows[1].h+22*Math.min(k,1.3);pill(ctx,'alert at ≥ '+r.N,clamp(tx,L+50*k,Rr-50*k),ty,PAL['rj'],'#fff',12*k);
  [1,2,5,10,20,50,100,200,500].filter(v=>v<=maxV).forEach(v=>{if(ph&&[2,20,200].includes(v))return;txt(ctx,String(v),clamp(X(v),L+8,Rr-12),ph?rows[1].y+rows[1].h+15*k:rows[0].y-6,{s:12*k,c:PAL['cv-soft'],a:'center'});});
  if(!ph)txt(ctx,'Most '+unit+' by one '+(r.type==='scan'||r.by==='ip'?'address':'account')+' in any '+r.M+'-minute window, per day (log scale) →',L,rows[0].y-22,{s:12,c:PAL['cv-soft']});
  // precision / recall vs threshold
  const B={L:ph?60:110,T:ph?300:290,W:ph?712:660,H:ph?140:150};const NX=40,Xn=n=>B.L+(n-1)/(NX-1)*B.W,Yp=v=>B.T+B.H-v*B.H;
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;[0,0.5,1].forEach(v=>{ctx.beginPath();ctx.moveTo(B.L,Yp(v));ctx.lineTo(B.L+B.W,Yp(v));ctx.stroke();txt(ctx,Math.round(v*100)+'%',B.L-8,Yp(v),{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});});
  [1,10,20,30,40].forEach(n=>txt(ctx,String(n),Xn(n),B.T+B.H+16*k,{s:12*k,c:PAL['g-axis'],a:'center'}));
  txt(ctx,'Threshold N ('+unit+')',B.L+B.W/2,B.T+B.H+(ph?52:34),{s:12*k,c:PAL['muted'],a:'center'});
  const curve=(f,col)=>{ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();let first=true;for(let n=1;n<=NX;n++){const v=f(alertStats(r.type,r.by,r.M,n,r.allow));if(v===null){first=true;continue;}if(first){ctx.moveTo(Xn(n),Yp(v));first=false;}else ctx.lineTo(Xn(n),Yp(v));}ctx.stroke();};
  curve(x=>x.prec,PAL['s2']);curve(x=>x.rec,PAL['s3']);
  if(r.N<=NX){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(Xn(r.N),B.T);ctx.lineTo(Xn(r.N),B.T+B.H);ctx.stroke();ctx.setLineDash([]);
    [[s.prec,PAL['s2']],[s.rec,PAL['s3']]].forEach(([v,c])=>{if(v===null)return;ctx.fillStyle=c;ctx.beginPath();ctx.arc(Xn(r.N),Yp(v),5.5,0,6.29);ctx.fill();});}
  const lx=B.L+8,ly=B.T-12*Math.min(k,1.3);ctx.font='700 '+12*k+'px '+FONT;
  const items=[['Precision '+(s.prec===null?'(no alerts)':Math.round(s.prec*100)+'%'),PAL['s2']],['Recall '+Math.round(s.rec*100)+'%',PAL['s3']]];let x=lx;
  items.forEach(([l,c])=>{ctx.fillStyle=c;ctx.fillRect(x,ly-5,16,4);txt(ctx,l,x+22,ly,{s:12*k,w:700,c,b:'middle'});x+=ctx.measureText(l).width+52;});
  if(!ph){let x2=470;[['caught',PAL['s3']],['missed',PAL['s1']],['false alarm',PAL['s4']]].forEach(([l,c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x2,ly-2,4.5,0,6.29);ctx.fill();txt(ctx,l,x2+9,ly,{s:12,c:PAL['cv-soft'],b:'middle'});x2+=ctx.measureText(l).width+30;});}}

/* ---------- challenge answers from the model ---------- */
const S10=alertStats('signin','ip',10,10,false),S3=alertStats('signin','ip',10,3,false),S40=alertStats('signin','ip',10,40,false);
const SU8=alertStats('signin','user',10,8,false),SI8=alertStats('signin','ip',10,8,false);
const sprayIds=MONTH.eps.filter(e=>e.kind==='spray').map(e=>e.id);
const sprayIP=sprayIds.filter(id=>SI8.det.has(id)).length,sprayUser=sprayIds.filter(id=>SU8.det.has(id)).length;
const W5=alertStats('signin','ip',5,6,false),W60=alertStats('signin','ip',60,6,false);
const P10=S10.prec===null?0:Math.round(S10.prec*100);
const pinTags=['spray','breakin','travel','download'];

const LOGS={
  id:'logs',hash:'logs',apUnit:20,order:1,tab:'Detecting attacks in logs',kind:'Virtual lab',
  card:'Search a fictional school’s sign-in, firewall and web logs to find four hidden attacks, then write alert rules and see what they catch.',
  title:'Detecting attacks in logs: one day at Northgate Academy',
  lede:{bio:'Every sign-in, connection and web request leaves a line in a log. Search one day of Northgate Academy’s (fictional) logs to find a password-guessing attack, a port scan, a sign-in from an impossible place and a stolen file.',
        honors:'Filter, count and stack log lines the way analysts do, then write threshold alert rules and measure them on 30 days of labeled data: true positives, false positives and missed attacks.',
        ap:'Tune alert rules for precision and recall, see why counting by address or by account catches different attacks, and correlate events across three logs into one incident timeline.'},
  scale:'One day: '+DAY.length+' log lines from three systems. A real school of 1,500 people writes hundreds of thousands of lines a day, which is why analysts search and alert instead of reading.',
  aspect:1.6,timeless:true,animated:true,graph:false,chChange:1,chReveal:3.5,
  controls:[
    {id:'mode',label:'Mode',type:'seg',def:'investigate',noTrial:true,options:[{v:'investigate',l:'Investigate'},{v:'alerts',l:'Alert rules'},{v:'correlate',l:'Correlate',lvl:'ap'}],onChange:syncMode},
    {id:'rtype',label:'Rule watches',type:'seg',def:'signin',lvl:'ap',modes:['alerts'],options:[{v:'signin',l:'Failed sign-ins'},{v:'scan',l:'Port scans'}],onChange:syncMode},
    {id:'thr',label:'Alert threshold N',type:'range',min:1,max:40,step:1,def:10,modes:['alerts'],help:'Alert when the count reaches N.',onChange(sim){sim.p.thr=Math.round(sim.p.thr);}},
    {id:'win',label:'Time window M',type:'range',min:1,max:120,step:1,def:10,unit:' min',lvl:'honors',modes:['alerts'],onChange(sim){sim.p.win=Math.round(sim.p.win);}},
    {id:'by',label:'Count by',type:'seg',def:'ip',lvl:'honors',modes:['alerts'],options:[{v:'ip',l:'Source address'},{v:'user',l:'Account'}],help:'Port-scan rules always count by address.'},
    {id:'allow',label:'Ignore our own IT scanner',type:'toggle',def:false,lvl:'ap',modes:['alerts'],help:'An allowlist entry for the security team’s weekly scan.'}
  ],
  actions:[
    {id:'spike',label:'Zoom to the busiest hour',modes:['investigate','correlate'],run(sim){const c=new Array(24).fill(0);DAY.forEach(e=>{if(!e.ok)c[Math.floor(e.t/3600)]++;});const h=c.indexOf(Math.max(...c));sim.q.from=h;sim.q.to=h+1;}},
    {id:'all',label:'Show the whole day',modes:['investigate','correlate'],run(sim){sim.q.from=0;sim.q.to=24;}}
  ],
  init(sim){if(!sim.q)sim.q=newQ();if(!sim.ans){sim.ans={};sim.res={};sim.pins=[];sim.checked=false;}return {};},
  step(sim,dt){},
  metrics:[
    {id:'match',label:'Lines matching your search',unit:'',d:0,min:0,max:null,modes:['investigate','correlate'],get:s=>filterDay(s.q).length},
    {id:'found',label:'Findings correct',unit:'of 4',d:0,min:0,max:4,modes:['investigate'],get:s=>Object.values(s.res).filter(Boolean).length},
    {id:'tp',label:'Real alerts (true positives)',unit:'',d:0,min:0,max:null,modes:['alerts'],get:s=>stats(s).tp},
    {id:'fp',label:'False alarms',unit:'',d:0,min:0,max:null,modes:['alerts'],get:s=>stats(s).fp},
    {id:'fn',label:'Attacks missed',unit:'',d:0,min:0,max:null,modes:['alerts'],get:s=>stats(s).fn},
    {id:'perday',label:'Alerts per day',unit:'',d:1,min:0,max:null,lvl:'honors',modes:['alerts'],get:s=>stats(s).perDay},
    {id:'prec',label:'Precision',unit:'%',d:0,min:0,max:100,lvl:'ap',modes:['alerts'],get:s=>{const p=stats(s).prec;return p===null?null:Math.round(p*100);}},
    {id:'rec',label:'Recall',unit:'%',d:0,min:0,max:100,lvl:'ap',modes:['alerts'],get:s=>Math.round(stats(s).rec*100)},
    {id:'pins',label:'Lines on your timeline',unit:'',d:0,min:0,max:null,lvl:'ap',modes:['correlate'],get:s=>s.pins.length}
  ],
  infoPanel:panelHTML,bindInfo:bindPanel,
  onClick(sim,x,y){if(sim.p.mode==='alerts')return;const g=laneGeom(sim.vis.k||1);if(x<g.L||x>g.R||y<g.top||y>g.top+3*g.h+2*g.gap)return;
    const h=clamp(Math.floor((x-g.L)/(g.R-g.L)*24),0,23);if(sim.q.from===h&&sim.q.to===h+1){sim.q.from=0;sim.q.to=24;}else{sim.q.from=h;sim.q.to=h+1;}},
  narrate(sim){const mode=sim.p.mode,hon=atLeast('honors'),ap=atLeast('ap');
    if(mode==='alerts'){const r=ruleOf(sim),s=stats(sim);const what=r.type==='scan'?'different denied ports from one address':'failed sign-ins from one '+(r.by==='ip'?'address':'account');
      let t='Your rule fires on '+r.N+' or more '+what+' in '+r.M+' minutes. Over 30 days it raised <b>'+s.alerts+' alerts</b>: '+s.tp+' real and '+s.fp+' false alarms, and it caught <b>'+s.found+' of '+s.total+' attacks</b>.';
      if(s.fp>60)t+=' That is '+s.perDay.toFixed(1)+' alerts a day: analysts would start ignoring them (alert fatigue).';else if(s.fn>s.total/2)t+=' Most attacks slip under the threshold.';else if(s.fn&&!s.fp)t+=' No false alarms, but some attacks are missed.';
      return t;}
    const q=sim.q,rows=filterDay(q);
    if(mode==='correlate'&&!sim.pins.length)return 'Find the lines that belong to one incident and add them to the timeline. <b>Shared addresses and accounts</b> are the threads that tie separate logs together.';
    if(mode==='correlate'){const c=correlateCheck(sim);return 'Your timeline has '+sim.pins.length+' line'+(sim.pins.length===1?'':'s')+'. Linked lines share an address or an account, so they are probably the same actor. '+(c.n===4&&!c.unrelated.length?'<b>It tells the whole story.</b>':sim.checked&&c.unrelated.length?'<b>'+c.unrelated.length+' line'+(c.unrelated.length===1?' shares':'s share')+' nothing with the rest</b>: no common address or account.':'Press Check my timeline when you think it tells the whole story.');}
    if(!qActive(q))return 'One day at Northgate: '+DAY.length+' lines in three logs. <b>Look for spikes</b>, especially red ones (failures, denies, errors), then search and filter to read the lines behind them.';
    if(!rows.length)return 'Nothing matches that search. Remove a term or widen the time window.';
    const ips=new Set(rows.map(e=>e.who)),us=new Set(rows.filter(e=>e.user).map(e=>e.user)),bad=rows.filter(e=>!e.ok).length,t0=rows[0].t,t1=rows[rows.length-1].t;
    let s='Your search matches <b>'+rows.length+' line'+(rows.length===1?'':'s')+'</b> between '+tstr(t0).slice(0,5)+' and '+tstr(t1).slice(0,5)+', from '+ips.size+' source address'+(ips.size===1?'':'es')+(us.size?' and '+us.size+' account'+(us.size===1?'':'s'):'')+'. '+bad+' failed, denied or errored.';
    if(ips.size===1&&bad>=10&&(t1-t0)<1800)s+=' <b>Many failures from one address in a few minutes is a classic attack pattern.</b>';
    else if(us.size===1&&rows.filter(e=>e.log==='signin'&&e.ok).length>=2){const L=new Set(rows.filter(e=>e.log==='signin'&&e.ok).map(e=>e.loc));if(L.size>1)s+=' This account signs in from '+[...L].join(' and ')+'. Could one person travel that fast?';}
    return s;},
  tour:[
    {title:'Three logs, one day',text:'Each lane is one log: sign-ins, the firewall and the school’s web server. Every bar counts the lines in 15 minutes. Red parts are failures, denied connections or web errors.',focus:[[10,54,782,420]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'investigate'});sim.q=newQ();}},
    {title:'Spikes are where to look',text:'Most of the day looks like routine school traffic. A tall red spike in the morning sign-in lane stands out: dozens of failed sign-ins in a few minutes.',focus:[[110,54,330,140]],pause:true},
    {title:'Search and filter',text:{bio:'The search box keeps only the lines that match. Here the filter keeps failures from 7 to 8 a.m. Matching lines turn blue on the timeline and fill the table under the stage.',honors:'Filters narrow 400 lines to the ones that matter: here, failed sign-ins between 07:00 and 08:00. Analysts filter first, then read.'},focus:[[110,54,680,140]],pause:true,setup(sim){sim.q=Object.assign(newQ(),{bad:true,from:7,to:8,log:'signin'});}},
    {lvl:'honors',title:'Count by address',text:'Counting the filtered lines by source address (stacking) shows one address made almost all of the failures. That is the address to report, and the panel below now shows the counts.',focus:[[110,54,680,140]],pause:true,setup(sim){sim.q=Object.assign(newQ(),{bad:true,from:7,to:8,log:'signin',group:'ip'});}},
    {title:'Write an alert rule',text:{bio:'Nobody can watch logs all day, so analysts write rules: “alert when one address has 10 or more failed sign-ins in 10 minutes.” Each dot is one address on one day. Dots right of the red line raise alerts.',honors:'A threshold rule turns logs into alerts. Green dots are attacks caught, red dots attacks missed, amber dots false alarms on normal people.'},focus:[[10,54,782,200]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'alerts',thr:10,win:10,by:'ip'});}},
    {title:'Lower threshold, more alarms',text:'Drop the threshold to 3 and the rule catches more, but it also fires on people who simply mistype their password. Too many false alarms and analysts stop paying attention.',focus:[[10,54,782,420]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'alerts',thr:3});}},
    {lvl:'ap',title:'Precision and recall',text:'Precision is the share of alerts that are real; recall is the share of attacks caught. Moving the threshold trades one for the other, and the curves show the whole trade-off.',focus:[[10,250,782,240]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'alerts',thr:10});}},
    {lvl:'ap',title:'Correlate into one incident',text:'The morning guessing, the break-in on jlee, the sign-in from Lisbon and the gradebook download share addresses and an account. Linked together they become one incident.',focus:[[10,54,782,420]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'correlate'});sim._tourPins=sim.pins.slice();sim.pins=pinTags.map(t=>byTag(t).i).concat([byTag('jleereal').i]);}}
  ],
  onTourExit(sim){if(sim._tourPins){sim.pins=sim._tourPins;sim._tourPins=null;}sim.q=newQ();BioLab.setValues(sim,{mode:'investigate',thr:10,win:10,by:'ip'});sim.infoDirty=true;},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.show&&phase==='done'){ch.show(sim);sim.infoDirty=true;}},
  challenges:[
    {lvl:'bio',q:'The rule alerts at 10 failed sign-ins from one address in 10 minutes. You lower the threshold to 3. What happens?',
     choices:['Fewer false alarms','Many more false alarms from people who mistype passwords, and no fewer attacks caught','It misses more attacks'],correct:S3.fp>S10.fp&&S3.found>=S10.found?1:S3.fp<S10.fp?0:2,
     baseline:{mode:'alerts',thr:10,win:10,by:'ip',rtype:'signin',allow:false},change:{thr:3},changeText:'Threshold lowered from 10 to 3',
     explain:{bio:'False alarms jump from '+S10.fp+' to '+S3.fp+' in 30 days, because lots of real people fail 3 times. Attacks caught: '+S10.found+' → '+S3.found+' of '+S3.total+'.'}},
    {lvl:'bio',q:'Now raise the threshold to 40 failed sign-ins. What happens?',choices:['It catches more attacks','It misses the slower and smaller attacks','Nothing changes'],correct:S40.found<S10.found?1:S40.found>S10.found?0:2,
     baseline:{mode:'alerts',thr:10,win:10,by:'ip',rtype:'signin',allow:false},change:{thr:40},changeText:'Threshold raised from 10 to 40',
     explain:{bio:'At 40 only attacks with 40 or more tries in 10 minutes trip the rule: '+S40.found+' of '+S40.total+' caught, down from '+S10.found+'. Attackers who go slowly or spread their tries out stay under a high threshold.'}},
    {lvl:'bio',instant:true,q:'The firewall log shows 17 connections from 203.0.113.9 in 40 seconds, each to a different port on the same server, and 16 were denied. What is it?',
     choices:['A port scan, and the firewall blocked almost all of it','A successful break-in','A teacher using the portal'],correct:0,
     show(sim){BioLab.setValues(sim,{mode:'investigate'});sim.q=Object.assign(newQ(),{text:'ip:203.0.113.9',log:'fw'});},
     explain:{bio:'One address trying many ports quickly is a scan: it is looking for open doors. The table now shows it. Denied means the firewall stopped it; only port 443, the public portal, answered.'}},
    {lvl:'honors',instant:true,q:'jlee signs in from Denver at '+tstr(TRAVEL.a.t).slice(0,5)+' and from Lisbon at '+tstr(TRAVEL.b.t).slice(0,5)+'. Denver to Lisbon is about '+Math.round(TRAVEL.d/100)*100+' km. How fast would jlee have to travel?',
     choices:['About 900 km/h, like a jet','About '+(Math.round(TRAVEL.v/1000)*1000).toLocaleString('en-US')+' km/h','About 100 km/h'],correct:1,
     show(sim){BioLab.setValues(sim,{mode:'investigate'});sim.q=Object.assign(newQ(),{text:'user:jlee result:success',log:'signin'});},
     explain:{honors:Math.round(TRAVEL.d).toLocaleString('en-US')+' km in '+Math.round(TRAVEL.h*60)+' minutes is about '+Math.round(TRAVEL.v).toLocaleString('en-US')+' km/h, over 20 times faster than a jet. Two people are using one account: the real jlee at school and someone else in Lisbon (or behind a server there).'}},
    {lvl:'honors',q:'Spraying attacks try 2 or 3 passwords on each of many accounts from one address. Switch the rule (8 in 10 minutes) from counting by address to counting by account. How many of the 4 spraying attacks does it catch?',
     choices:['All 4, the same as before','Fewer: each account only sees a few tries','More: accounts are easier to count'],correct:sprayUser===sprayIP?0:sprayUser<sprayIP?1:2,
     baseline:{mode:'alerts',thr:8,win:10,by:'ip',rtype:'signin',allow:false},change:{by:'user'},changeText:'Rule now counts by account',
     explain:{honors:'By address: '+sprayIP+' of 4 sprays caught. By account: '+sprayUser+' of 4. A spray spreads its tries thin across accounts so no single account crosses the line. Counting by address catches it; counting by account catches many addresses attacking one account. Real systems run both rules.'}},
    {lvl:'honors',q:'Keep the threshold at 6 failed sign-ins from one address, and widen the window from 5 minutes to 60. What happens to the low-and-slow attacks?',
     choices:['More of them get caught','Fewer get caught','No change'],correct:W60.found>W5.found?0:W60.found<W5.found?1:2,
     baseline:{mode:'alerts',thr:6,win:5,by:'ip',rtype:'signin',allow:false},change:{win:60},changeText:'Window widened from 5 to 60 minutes',
     explain:{honors:'Slow attackers wait minutes between tries, so a short window never holds enough of them. With 60 minutes the rule catches '+W60.found+' of '+W60.total+' attacks (up from '+W5.found+'), but false alarms grow from '+W5.fp+' to '+W60.fp+' because normal failures also pile up over an hour.'}},
    {lvl:'ap',instant:true,q:'At 10 failed sign-ins per address in 10 minutes, the rule raised '+S10.alerts+' alerts in 30 days and '+S10.tp+' were real. What is its precision?',
     choices:[Math.max(0,P10-30)+'%',P10+'%',Math.min(100,P10+25)+'%'],correct:1,
     show(sim){BioLab.setValues(sim,{mode:'alerts',thr:10,win:10,by:'ip',rtype:'signin',allow:false});},
     explain:{ap:'Precision = true positives ÷ all alerts = '+S10.tp+' ÷ '+S10.alerts+' = '+P10+'%. Recall asks a different question: attacks caught ÷ attacks = '+S10.found+' ÷ '+S10.total+' = '+Math.round(S10.rec*100)+'%.'}},
    {lvl:'ap',instant:true,q:'Which clue ties the morning password guessing to the afternoon gradebook download?',
     choices:['The account jlee: guessed in the morning, then used from Lisbon by the address that downloaded the file','The address 203.0.113.9, which shows up in both','Nothing: they are separate incidents'],
     correct:(byTag('breakin').user===byTag('travel').user&&byTag('travel').ip===byTag('download').ip)?0:2,
     show(sim){BioLab.setValues(sim,{mode:'correlate'});sim.pins=pinTags.map(t=>byTag(t).i);sim.checked=true;},
     explain:{ap:'The spray from '+SPRAY_IP+' ends with a successful sign-in to jlee at '+tstr(byTag('breakin').t).slice(0,5)+'. At '+tstr(byTag('travel').t).slice(0,5)+' jlee signs in from '+THIEF_IP+' in Lisbon, and that same address downloads the gradebook export. The account is the link; the scan from 203.0.113.9 shares nothing with them.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What attacks are hiding in one day of Northgate’s logs?</p><ol><li>Look at the timeline for red spikes.</li><li>Click a spike (or use From and To) to zoom to that hour, and read the lines in the table.</li><li>Use the search box to follow an address or an account across the logs.</li><li>Type your four findings in the panel and check them.</li></ol><p>For each finding, write the one log line that convinced you.</p>',
       honors:'<p><b>Question:</b> How does an alert threshold trade false alarms for missed attacks?</p><ol><li>Switch to Alert rules. Set the window to 10 minutes and count by address.</li><li>Record a trial at thresholds 2, 4, 6, 8, 10, 15, 20, 30 and 40.</li><li>Copy the table as CSV and plot threshold (x) against false alarms and attacks missed (y).</li></ol><p>Pick the threshold you would deploy and defend it in two sentences.</p>',
       ap:'<p><b>Question:</b> Can one rule catch every kind of attack?</p><ol><li>For each of the four sign-in attack kinds, find a rule (N, M, count by) that catches it, and record the precision and recall.</li><li>Do the same for port scans, with and without the IT scanner allowlisted.</li><li>Switch to Correlate and build the incident timeline for the day.</li></ol><p><b>Claim–evidence–reasoning:</b> Propose a small set of rules for Northgate and justify it with precision, recall and alerts per day.</p>'},
  terms:[{t:'Log',d:'A time-stamped record of events written by a system: sign-ins, connections, web requests.'},{t:'Failed sign-in',d:'A sign-in with the wrong password. A few are normal; many in a burst are suspicious.'},{t:'Port scan',d:'Probing many ports on a server to find services that answer.'},
    {t:'Impossible travel',d:'Sign-ins to one account from places too far apart for the time between them.'},{t:'Alert rule',d:'A rule that raises an alert when log events cross a threshold.'},
    {lvl:'honors',t:'True positive / false positive',d:'An alert on a real attack / an alert on normal activity.'},{lvl:'honors',t:'False negative',d:'An attack the rule did not alert on.'},{lvl:'honors',t:'Password spraying',d:'Trying a few common passwords against many accounts to stay under per-account limits.'},
    {lvl:'honors',t:'Alert fatigue',d:'When analysts see so many false alarms that they start missing real ones.'},
    {lvl:'ap',t:'Precision and recall',d:'Precision = real alerts ÷ all alerts. Recall = attacks caught ÷ all attacks.'},{lvl:'ap',t:'Correlation',d:'Linking events across different logs by shared addresses, accounts or times into one incident.'},{lvl:'ap',t:'Allowlist',d:'Known, approved sources a rule ignores, such as the security team’s own scanner.'}],
  about:'<p>The day’s '+DAY.length+' log lines are generated from a fixed random seed, so every student sees the same day. The people, school, addresses and attacks are fictional; outside addresses come from the ranges reserved for documentation (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), and everyone on campus appears to the sign-in service from one shared address, as they would behind a school’s network address translation.</p><p>The alert lab uses 30 days of generated sign-in and firewall events with labeled attacks (fast guessing, spraying, low-and-slow guessing, many-address attacks on one account, fast and slow port scans) mixed with normal mistakes. A rule alerts at most once per address or account per day, when the count in any sliding window of M minutes reaches N. Real detection also uses device fingerprints, known-bad address lists, machine learning and human judgment, and real attackers adapt to whatever thresholds they can observe. Travel distance is a great-circle distance between city centers.</p>',
  draw(sim,ctx,vdt,k){sim.vis.k=k;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const m=sim.p.mode;if(m==='alerts')drawAlerts(sim,ctx,k);else if(m==='correlate')drawCorrelate(sim,ctx,k);else drawDay(sim,ctx,k);},
  thumbSetup(sim){},
  prereq:['firewall'],next:['casefile','risk']
};
LOGS.onLevel=syncMode;LOGS._data={DAY,MONTH,alertStats};
BioLab.register(LOGS);
})();

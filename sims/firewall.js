(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM}=BioLab.h;

/* ---------- Cedar Hollow Public Library (fictional) network ---------- */
const ZONES={guest:{name:'Guest Wi-Fi',net:'10.30.0.0/24',box:[20,60,250,150],port:[270,135],fw:[335,240]},
  staff:{name:'Staff',net:'10.10.0.0/24',box:[20,300,250,170],port:[270,385],fw:[335,290]},
  internet:{name:'Internet',net:'outside addresses',box:[530,60,250,150],port:[530,135],fw:[465,240]},
  servers:{name:'Servers',net:'10.20.0.0/24',box:[530,300,250,170],port:[530,385],fw:[465,290]}};
const ZK=['guest','staff','internet','servers'];
const HOSTS={
  patron:{z:'guest',name:'Patron laptop',ip:'10.30.0.57',x:110,y:150},
  desk:{z:'staff',name:'Desk PC',ip:'10.10.0.21',x:90,y:390},
  itpc:{z:'staff',name:'IT PC',ip:'10.10.0.5',x:200,y:390,lvl:'honors'},
  news:{z:'internet',name:'News site',ip:'198.51.100.20',x:585,y:122},
  mail:{z:'internet',name:'Mail service',ip:'198.51.100.25',x:660,y:122},
  home:{z:'internet',name:'Home patron',ip:'192.0.2.44',x:735,y:122},
  scanner:{z:'internet',name:'203.0.113.66',ip:'203.0.113.66',x:610,y:178},
  rdpbot:{z:'internet',name:'203.0.113.140',ip:'203.0.113.140',x:710,y:178},
  dns:{z:'servers',name:'DNS server',ip:'10.20.0.53',x:585,y:390},
  files:{z:'servers',name:'File server',ip:'10.20.0.10',x:660,y:390},
  catalog:{z:'servers',name:'Catalog site',ip:'10.20.0.80',x:735,y:390}};
const SVC={443:{n:'web (HTTPS)',c:'s2'},53:{n:'DNS',c:'s6'},445:{n:'file sharing',c:'s5'},587:{n:'email',c:'s4'},3389:{n:'remote desktop',c:'s1'}};
const svcCol=p=>PAL[(SVC[p]||{c:'cv-soft'}).c];
const SCAN_PORTS=[21,22,23,25,80,443,445,3389,8080];
const FLOWS=[
  {id:'guestWeb',name:'Patron browsing the web',src:'patron',dst:'news',proto:'tcp',ports:[443],good:true,needs:'guestDns',every:2.2},
  {id:'guestDns',name:'Patron’s DNS lookups',src:'patron',dst:'dns',proto:'udp',ports:[53],good:true,every:2.9},
  {id:'guestFiles',name:'Patron laptop opening the staff file share',src:'patron',dst:'files',proto:'tcp',ports:[445],good:false,every:3.4},
  {id:'guestStaff',name:'Patron laptop probing a staff PC',src:'patron',dst:'desk',proto:'tcp',ports:[445],good:false,every:4.1,lvl:'honors'},
  {id:'staffWeb',name:'Staff browsing the web',src:'desk',dst:'news',proto:'tcp',ports:[443],good:true,needs:'staffDns',every:2.6},
  {id:'staffMail',name:'Staff sending email',src:'desk',dst:'mail',proto:'tcp',ports:[587],good:true,needs:'staffDns',every:3.8},
  {id:'staffFiles',name:'Staff using the file share',src:'desk',dst:'files',proto:'tcp',ports:[445],good:true,every:3.1},
  {id:'staffDns',name:'Staff DNS lookups',src:'desk',dst:'dns',proto:'udp',ports:[53],good:true,every:3.3},
  {id:'itRdp',name:'IT remote desktop to the file server',src:'itpc',dst:'files',proto:'tcp',ports:[3389],good:true,every:4.4,lvl:'honors'},
  {id:'netRdp',name:'Outside sign-in attempts on remote desktop',src:'rdpbot',dst:'files',proto:'tcp',ports:[3389],good:false,every:2.7},
  {id:'scan',name:'Port scan of the catalog server',src:'scanner',dst:'catalog',proto:'tcp',ports:SCAN_PORTS,okPorts:[443],good:false,every:7,burst:true},
  {id:'homeCat',name:'Patron searching the catalog from home',src:'home',dst:'catalog',proto:'tcp',ports:[443],good:true,every:3.6},
  {id:'unsol',name:'Unsolicited connection to a patron laptop',src:'scanner',dst:'patron',proto:'tcp',ports:[50123],good:false,every:5.2,lvl:'ap'}];
const EPH=51515;            // the client's ephemeral port that replies return to
const flowsFor=()=>FLOWS.filter(f=>atLeast(f.lvl));
const flowById=id=>FLOWS.find(f=>f.id===id);
const R=(act,src,dst,port,proto,log)=>({act,src,dst,port:port||'any',proto:proto||'any',log:!!log});
const STARTER=()=>[R('allow','any','any')];
const GOOD=()=>[R('allow','guest','dns','53','udp'),R('deny','guest','servers'),R('deny','guest','staff'),R('allow','guest','internet','443','tcp'),
  R('allow','staff','internet','443','tcp'),R('allow','staff','internet','587','tcp'),R('allow','staff','servers'),R('allow','internet','catalog','443','tcp')];
const PRESETS={starter:STARTER,none:()=>[],openDeny:()=>[R('allow','any','any'),R('deny','guest','servers','445','tcp')],
  denyFirst:()=>[R('deny','guest','servers'),R('allow','any','any')],good:GOOD,
  rdpOrder:()=>[R('deny','internet','servers','3389','tcp'),R('allow','staff','servers'),R('allow','any','internet')],
  catalogOnly:()=>[R('allow','internet','catalog','443','tcp'),R('allow','staff','any'),R('allow','guest','internet','443','tcp')],
  guestOut:()=>[R('allow','guest','dns','53','udp'),R('allow','guest','internet','443','tcp')],
  guestOutEph:()=>[R('allow','guest','dns','53','udp'),R('allow','guest','internet','443','tcp'),R('allow','internet','guest','49152-65535','tcp'),R('allow','servers','guest','49152-65535','udp')],
  goodLog:()=>{const g=GOOD();g.push(R('deny','internet','any','any','any',true));g[2].log=true;g[1].log=true;return g;}};

/* ---------- rule matching ---------- */
function parsePorts(s){s=String(s).trim().toLowerCase();if(s===''||s==='any'||s==='*')return 'any';const parts=s.split(',').map(x=>x.trim()).filter(Boolean),out=[];
  for(const p of parts){const m=p.match(/^(\d{1,5})(?:\s*-\s*(\d{1,5}))?$/);if(!m)return null;const a=+m[1],b=m[2]!==undefined?+m[2]:a;if(a>65535||b>65535||b<a)return null;out.push([a,b]);}return out.length?out:null;}
const portOK=(spec,p)=>{const ps=parsePorts(spec);return ps==='any'||(Array.isArray(ps)&&ps.some(r=>p>=r[0]&&p<=r[1]));};
const endOK=(sel,hostId)=>sel==='any'||sel===hostId||(ZONES[sel]&&HOSTS[hostId].z===sel);
const matches=(r,pk)=>endOK(r.src,pk.src)&&endOK(r.dst,pk.dst)&&(r.proto==='any'||r.proto===pk.proto)&&portOK(r.port,pk.dport);
function decide(rules,pk){for(let i=0;i<rules.length;i++)if(matches(rules[i],pk))return {i,act:rules[i].act,log:rules[i].log};return {i:-1,act:'deny',log:false};}
function whyNot(r,pk){const bits=[];if(!endOK(r.src,pk.src))bits.push('source is '+HOSTS[pk.src].name+', not '+endName(r.src));if(!endOK(r.dst,pk.dst))bits.push('destination is '+HOSTS[pk.dst].name+', not '+endName(r.dst));
  if(!(r.proto==='any'||r.proto===pk.proto))bits.push('protocol is '+pk.proto.toUpperCase());if(!portOK(r.port,pk.dport))bits.push('port '+pk.dport+' is not '+r.port);return bits.join('; ');}
const endName=s=>s==='any'?'any':ZONES[s]?ZONES[s].name:HOSTS[s]?HOSTS[s].name:s;
const stateful=sim=>sim.forceSF!==undefined?sim.forceSF:(!atLeast('ap')||sim.p.stateful);
function flowResult(sim,rules,f,memo){memo=memo||{};if(memo[f.id])return memo[f.id];const sf=stateful(sim);
  const probes=f.ports.map(port=>{const pk={src:f.src,dst:f.dst,proto:f.proto,dport:port},req=decide(rules,pk);let rep={act:'allow',i:-2};
    if(req.act==='allow'&&!sf)rep=decide(rules,{src:f.dst,dst:f.src,proto:f.proto,dport:EPH});return {port,req,rep};});
  const need=f.needs&&atLeast((flowById(f.needs)||{}).lvl)?flowResult(sim,rules,flowById(f.needs),memo):null;
  const reqOK=probes.every(p=>p.req.act==='allow'),repOK=probes.every(p=>p.rep.act==='allow'),needOK=!need||need.works;
  const reached=probes.filter(p=>p.req.act==='allow'),bad=reached.filter(p=>!(f.okPorts||[]).includes(p.port));
  const res={f,probes,reqOK,repOK,needOK,works:reqOK&&repOK&&needOK,reached:reached.length,blocked:bad.length===0,need};
  memo[f.id]=res;return res;}
function score(sim,rules){rules=rules||rulesOf(sim);const memo={},fl=flowsFor(),rs=fl.map(f=>flowResult(sim,rules,f,memo));
  const good=rs.filter(r=>r.f.good),bad=rs.filter(r=>!r.f.good),get=id=>rs.find(r=>r.f.id===id);const hon=atLeast('honors'),ap=atLeast('ap');
  const missions=[{t:'Patrons can browse the web',ok:get('guestWeb').works},
    {t:'Patrons cannot reach staff files'+(hon?' or staff PCs':''),ok:get('guestFiles').blocked&&(!hon||get('guestStaff').blocked)},
    {t:'Staff web, email and files'+(hon?' and IT remote desktop':'')+' still work',ok:['staffWeb','staffMail','staffFiles'].concat(hon?['itRdp']:[]).every(id=>get(id).works)},
    {t:'The port scan and outside remote desktop are blocked',ok:get('scan').blocked&&get('netRdp').blocked},
    {t:'Patrons at home can still search the catalog',ok:get('homeCat').works}];
  if(ap)missions.push({t:'No unsolicited connection reaches a patron laptop',ok:get('unsol').blocked});
  return {rs,get,goodN:good.length,goodOK:good.filter(r=>r.works).length,badN:bad.length,badOK:bad.filter(r=>r.blocked).length,missions,mOK:missions.filter(m=>m.ok).length};}

/* ---------- state ---------- */
function newFW(){return {rules:STARTER(),sand:[],draft:R('deny','any','any'),tr:{src:'patron',dst:'files',port:'445',proto:'tcp'},trace:null};}
const sandbox=sim=>sim.p.mode==='sandbox';
function rulesOf(sim){if(sim.st&&sim.st.chRules)return sim.st.chRules;return sandbox(sim)?sim.fw.sand:sim.fw.rules;}
function usePreset(sim,name){sim.st.chRules=PRESETS[name]();sim.st.pk=[];sim.infoDirty=true;}

/* ---------- packets on the stage ---------- */
const hostVisible=id=>atLeast(HOSTS[id].lvl);
function pathFor(src,dst){const a=HOSTS[src],b=HOSTS[dst],za=ZONES[a.z],zb=ZONES[b.z];
  if(a.z===b.z)return {pts:[[a.x,a.y],[b.x,b.y]],fwi:-1};
  return {pts:[[a.x,a.y],za.port,za.fw,[400,265],zb.fw,zb.port,[b.x,b.y]],fwi:2};}
function spawn(sim,f,port,o){o=o||{};const st=sim.st,src=o.reply?f.dst:f.src,dst=o.reply?f.src:f.dst,P=pathFor(src,dst);
  st.pk.push({f,port,src,dst,proto:f.proto,reply:!!o.reply,test:!!o.test,pts:P.pts,fwi:P.fwi,seg:0,u:0,state:'go',t:0,dport:o.reply?EPH:port});}
function clockStr(t){const s=Math.floor(9*3600+t);return String(Math.floor(s/3600)%24).padStart(2,'0')+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function step(sim,dt){const st=sim.st;if(sim.p._ch){usePreset(sim,sim.p._ch);sim.p._ch=null;}st.clock+=dt;const rules=rulesOf(sim),sf=stateful(sim),ap=atLeast('ap');
  const sc=score(sim,rules);
  if(!sim.p.quiet||!sandbox(sim))flowsFor().forEach(f=>{st.tm[f.id]=(st.tm[f.id]===undefined?f.every*((FLOWS.indexOf(f)*0.37)%1):st.tm[f.id])-dt;
    if(st.tm[f.id]<=0){st.tm[f.id]=f.every;const r=sc.get(f.id);if(f.needs&&!r.needOK){st.noDns[f.src]=1.6;return;}
      if(st.pk.length>46)return;if(f.burst)f.ports.forEach((p,j)=>st.later.push({f,p,at:st.clock+j*0.18}));else spawn(sim,f,f.ports[0]);}});
  st.later=st.later.filter(l=>{if(st.clock>=l.at){spawn(sim,l.f,l.p);return false;}return true;});
  Object.keys(st.noDns).forEach(k=>{st.noDns[k]-=dt;if(st.noDns[k]<=0)delete st.noDns[k];});
  const sp=180*(RM?2:1);
  st.pk.forEach(p=>{if(p.state!=='go'){p.t+=dt;return;}const a=p.pts[p.seg],b=p.pts[p.seg+1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;p.u+=dt*sp/L;
    while(p.u>=1&&p.state==='go'){p.u-=1;p.seg++;
      if(p.seg===p.fwi){let d;if(p.reply&&sf)d={act:'allow',i:-2,log:false};else d=decide(rules,{src:p.src,dst:p.dst,proto:p.proto,dport:p.dport});
        p.dec=d;st.last={d,p,t:st.clock};if(d.log&&ap){st.log.unshift({t:clockStr(st.clock),rule:d.i+1,act:d.act,src:HOSTS[p.src].ip,dst:HOSTS[p.dst].ip,proto:p.proto.toUpperCase(),port:p.dport,reply:p.reply});if(st.log.length>14)st.log.pop();st.logN++;st.logDirty=true;}
        if(d.act!=='allow'){p.state='drop';p.t=0;p.u=0;break;}}
      if(p.seg>=p.pts.length-1){p.state='arrive';p.t=0;p.u=0;
        if(!p.reply&&!p.test&&ap&&p.f.good&&!(p.f.okPorts&&!p.f.okPorts.includes(p.port)))spawn(sim,p.f,p.port,{reply:true});break;}}});
  st.pk=st.pk.filter(p=>p.state==='go'||p.t<(p.test?2.5:0.9));
  if(st.logDirty&&sim.ui&&sim.ui.info){const e=sim.ui.info.querySelector('#fw-log');if(e){e.innerHTML=logHTML(sim);st.logDirty=false;}}}

/* ---------- panel ---------- */
function injectStyle(){if(document.getElementById('fw-style'))return;const s=document.createElement('style');s.id='fw-style';s.textContent=`
.fw h4{margin:14px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.fw h4:first-child{margin-top:0}
.fw .fw-goals{list-style:none;padding:0;margin:0;font-size:15px}.fw .fw-goals li{padding:2px 0 2px 26px;position:relative}
.fw .fw-goals li::before{content:"○";position:absolute;left:4px;color:var(--muted);font-weight:700}.fw .fw-goals li.ok::before{content:"✓";color:var(--good)}
.fw table{font-size:14px}.fw td,.fw th{padding:5px 6px;text-align:left}.fw td select,.fw td input,.fw .fw-form select,.fw .fw-form input{border:1px solid var(--line);background:var(--card);border-radius:6px;padding:3px 5px;font-size:14px}
.fw td input.fw-port{width:92px}.fw td input.fw-port[aria-invalid="true"]{border-color:var(--bad)}.fw .fw-ib{border:1px solid var(--line);background:var(--card2);border-radius:6px;padding:2px 7px;cursor:pointer;font-size:14px;line-height:1.3}
.fw .fw-ib:disabled{opacity:.35;cursor:default}.fw tr.fw-hit td{background:color-mix(in srgb,var(--rj) 10%,transparent)}.fw tr.fw-implicit td{color:var(--muted);font-style:italic}
.fw .fw-act-allow{color:var(--good);font-weight:700}.fw .fw-act-deny{color:var(--bad);font-weight:700}
.fw .fw-flows{list-style:none;padding:0;margin:0;font-size:14px;line-height:1.35}.fw .fw-flows li{padding:4px 0 4px 24px;position:relative;border-bottom:1px solid var(--line)}
.fw .fw-flows li:last-child{border-bottom:0}.fw .fw-flows li b{font-weight:600}.fw .fw-flows .fw-ic{position:absolute;left:2px;top:4px;font-weight:800}
.fw .fw-ok .fw-ic{color:var(--good)}.fw .fw-no .fw-ic{color:var(--bad)}.fw .fw-sub{display:block;color:var(--muted);font-size:13px}
.fw .fw-note{font-size:14px;color:var(--muted);margin:6px 0 0}.fw .fw-form{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:end}.fw .fw-form label{display:flex;flex-direction:column;font-size:13px;color:var(--muted);gap:2px}
.fw .fw-trace{list-style:none;padding:0;margin:8px 0 0;font-size:14px}.fw .fw-trace li{padding:3px 0}.fw .fw-log{font:13px/1.45 ui-monospace,Consolas,monospace;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 8px;max-height:220px;overflow:auto;white-space:pre}`;
  document.head.appendChild(s);}
function endOptions(sel,forDst){const hon=atLeast('honors');let o=[['any','Any']].concat(ZK.map(z=>[z,ZONES[z].name]));
  if(hon)o=o.concat(['itpc','dns','files','catalog','patron','desk'].map(h=>[h,HOSTS[h].name+' ('+HOSTS[h].ip+')']));
  if(sel&&!o.some(x=>x[0]===sel))o.push([sel,endName(sel)]);return o.map(x=>`<option value="${x[0]}"${x[0]===sel?' selected':''}>${x[1]}</option>`).join('');}
const protoOpts=sel=>[['any','Any'],['tcp','TCP'],['udp','UDP']].map(x=>`<option value="${x[0]}"${x[0]===sel?' selected':''}>${x[1]}</option>`).join('');
const actOpts=sel=>[['allow','Allow'],['deny','Deny']].map(x=>`<option value="${x[0]}"${x[0]===sel?' selected':''}>${x[1]}</option>`).join('');
function logHTML(sim){const L=sim.st.log;if(!L.length)return 'No logged packets yet. Tick Log on a rule to record every packet it matches.';
  return L.map(e=>`${e.t}  rule ${e.rule}  ${e.act.toUpperCase().padEnd(5)}  ${e.proto} ${e.src} → ${e.dst}:${e.port}${e.reply?'  (reply)':''}`).join('\n');}
function panelHTML(sim){injectStyle();const sb=sandbox(sim),hon=atLeast('honors'),ap=atLeast('ap'),rules=rulesOf(sim),sc=score(sim,rules),ch=!!sim.st.chRules,fw=sim.fw;
  const lastI=sim.st.last&&sim.st.clock-sim.st.last.t<3?sim.st.last.d.i:-9;
  let h='<div class="fw">';
  if(ch)h+='<p class="fw-note" style="margin-top:0"><b>Showing a challenge or walkthrough rule set.</b> Press Reset under the stage to go back to your own rules.</p>';
  if(!sb)h+='<h4>The case</h4><p style="margin:0 0 6px;font-size:15px">Last week someone on the library’s guest Wi-Fi opened the staff file share. The firewall has one rule: allow everything. Rewrite the rules so each goal below is met.</p><ul class="fw-goals">'+sc.missions.map(m=>`<li class="${m.ok?'ok':''}">${m.t}</li>`).join('')+'</ul>';
  else h+='<h4>Try it yourself</h4><p class="fw-note" style="margin-top:0">Start from an empty rule list. Write rules, then send your own test packets and watch which rule decides each one.</p>';
  h+='<h4>Firewall rules (checked top to bottom, first match wins)</h4><div class="tbl-wrap"><table><thead><tr><th>#</th><th>Action</th><th>Source</th><th>Destination</th><th>Port</th><th>Protocol</th>'+(ap?'<th>Log</th>':'')+'<th>Order</th></tr></thead><tbody>';
  rules.forEach((r,i)=>{const bad=parsePorts(r.port)===null;h+=`<tr class="${i===lastI?'fw-hit':''}"><td>${i+1}</td><td><select aria-label="Rule ${i+1} action" data-a="act" data-i="${i}" data-fid="act${i}" class="fw-act-${r.act}">${actOpts(r.act)}</select></td>
    <td><select aria-label="Rule ${i+1} source" data-a="src" data-i="${i}" data-fid="src${i}">${endOptions(r.src)}</select></td><td><select aria-label="Rule ${i+1} destination" data-a="dst" data-i="${i}" data-fid="dst${i}">${endOptions(r.dst,true)}</select></td>
    <td><input class="fw-port" aria-label="Rule ${i+1} port" data-a="port" data-i="${i}" data-fid="port${i}" value="${r.port}" aria-invalid="${bad}"></td><td><select aria-label="Rule ${i+1} protocol" data-a="proto" data-i="${i}" data-fid="proto${i}">${protoOpts(r.proto)}</select></td>
    ${ap?`<td><input type="checkbox" aria-label="Log rule ${i+1}" data-a="log" data-i="${i}" data-fid="log${i}"${r.log?' checked':''}></td>`:''}
    <td style="white-space:nowrap"><button type="button" class="fw-ib" data-a="up" data-i="${i}" data-fid="up${i}" aria-label="Move rule ${i+1} up"${i?'':' disabled'}>↑</button> <button type="button" class="fw-ib" data-a="down" data-i="${i}" data-fid="down${i}" aria-label="Move rule ${i+1} down"${i<rules.length-1?'':' disabled'}>↓</button> <button type="button" class="fw-ib" data-a="del" data-i="${i}" data-fid="del${i}" aria-label="Delete rule ${i+1}">✕</button></td></tr>`;});
  h+=`<tr class="fw-implicit${lastI===-1?' fw-hit':''}"><td>${rules.length+1}</td><td><span class="fw-act-deny">Deny</span></td><td>Any</td><td>Any</td><td>Any</td><td>Any</td>${ap?'<td></td>':''}<td>implicit</td></tr></tbody></table></div>`;
  if(rules.some(r=>parsePorts(r.port)===null))h+='<p class="fw-note" style="color:var(--bad)">A port box has an entry the firewall cannot read, so that rule never matches. Use any, a number like 443, a range like 49152-65535, or a list like 80,443.</p>';
  const d=fw.draft;h+=`<div class="fw-form" style="margin-top:8px"><label>Action<select data-a="d-act" data-fid="d-act">${actOpts(d.act)}</select></label><label>Source<select data-a="d-src" data-fid="d-src">${endOptions(d.src)}</select></label><label>Destination<select data-a="d-dst" data-fid="d-dst">${endOptions(d.dst,true)}</select></label>
    <label>Port<input class="fw-port" style="width:92px" data-a="d-port" data-fid="d-port" value="${d.port}"></label><label>Protocol<select data-a="d-proto" data-fid="d-proto">${protoOpts(d.proto)}</select></label>
    <button type="button" class="btn" data-a="add" data-fid="add"${rules.length>=16||ch?' disabled':''}>Add rule at the bottom</button></div>`;
  if(ch)h+='<p class="fw-note">Editing is paused while a challenge or walkthrough set is shown.</p>';
  // traffic outcomes
  h+=`<h4>Traffic (${sc.goodOK} of ${sc.goodN} needed flows work, ${sc.badOK} of ${sc.badN} unwanted flows blocked)</h4><ul class="fw-flows">`;
  sc.rs.forEach(r=>{const f=r.f,ok=f.good?r.works:r.blocked;let why;
    const ruleTxt=d=>d.i===-1?'the implicit deny':'rule '+(d.i+1)+' ('+d.act+')';
    if(f.burst){why=r.reached+' of '+f.ports.length+' probes got through'+(r.reached?' ('+r.probes.filter(p=>p.req.act==='allow').map(p=>p.port).join(', ')+')':'')+'.';}
    else if(!r.reqOK)why='Dropped by '+ruleTxt(r.probes[0].req)+'.';
    else if(!r.repOK)why='Allowed out by '+ruleTxt(r.probes[0].req)+', but the replies are dropped by '+ruleTxt(r.probes[0].rep)+'.';
    else if(!r.needOK)why='Allowed by '+ruleTxt(r.probes[0].req)+', but it never starts: its DNS lookup is blocked, so it cannot find the address.';
    else why='Allowed by '+ruleTxt(r.probes[0].req)+'.';
    const port=f.burst?'ports '+f.ports.join(', '):f.proto.toUpperCase()+' '+f.ports[0]+(SVC[f.ports[0]]?' ('+SVC[f.ports[0]].n+')':'');
    h+=`<li class="${ok?'fw-ok':'fw-no'}"><span class="fw-ic">${ok?'✓':'✕'}</span><b>${f.name}</b> <span class="fw-sub">${HOSTS[f.src].name} → ${HOSTS[f.dst].name}, ${port}. ${f.good?'Needed.':'Unwanted.'} ${why}</span></li>`;});
  h+='</ul>';
  // tracer
  if(sb||hon){const t=fw.tr,hostOpts=sel=>Object.keys(HOSTS).filter(hostVisible).map(k=>`<option value="${k}"${k===sel?' selected':''}>${HOSTS[k].name}${HOSTS[k].name===HOSTS[k].ip?'':' ('+HOSTS[k].ip+')'} · ${ZONES[HOSTS[k].z].name}</option>`).join('');
    h+=`<h4>Packet tracer: test a packet of your own</h4><div class="fw-form"><label>From<select data-a="t-src" data-fid="t-src">${hostOpts(t.src)}</select></label><label>To<select data-a="t-dst" data-fid="t-dst">${hostOpts(t.dst)}</select></label>
      <label>Port<input class="fw-port" style="width:80px" type="number" min="0" max="65535" data-a="t-port" data-fid="t-port" value="${t.port}"></label><label>Protocol<select data-a="t-proto" data-fid="t-proto">${protoOpts(t.proto).replace('<option value="any">Any</option>','')}</select></label>
      <button type="button" class="btn primary" data-a="trace" data-fid="trace">Send test packet</button></div>`;
    if(fw.trace)h+=traceHTML(fw.trace);}
  if(ap)h+=`<h4>Firewall log (${sim.st.logN} logged)</h4><div class="fw-log" id="fw-log">${logHTML(sim)}</div>`;
  return h+'</div>';}
function runTrace(sim){const t=sim.fw.tr,rules=rulesOf(sim),port=clamp(Math.round(+t.port)||0,0,65535),pk={src:t.src,dst:t.dst,proto:t.proto,dport:port};
  if(HOSTS[t.src].z===HOSTS[t.dst].z){sim.fw.trace={same:true,pk};return;}
  const steps=[];let d=null;for(let i=0;i<rules.length;i++){if(matches(rules[i],pk)){steps.push({i,hit:true,r:rules[i]});d={i,act:rules[i].act};break;}steps.push({i,hit:false,why:whyNot(rules[i],pk)});}
  if(!d)d={i:-1,act:'deny'};sim.fw.trace={pk,steps,d};
  const f={id:'test',src:t.src,dst:t.dst,proto:t.proto,ports:[port]};spawn(sim,f,port,{test:true});}
function traceHTML(T){if(T.same)return '<p class="fw-note">Both ends are in the same zone, so the packet never passes through the firewall. Firewalls only see traffic that crosses between zones.</p>';
  const pk=T.pk;return `<ul class="fw-trace"><li>Packet: ${pk.proto.toUpperCase()} ${HOSTS[pk.src].name} → ${HOSTS[pk.dst].name}, port ${pk.dport}</li>`+T.steps.map(s=>s.hit?`<li>Rule ${s.i+1}: <b>matches</b>, so the packet is <span class="fw-act-${s.r.act}">${s.r.act==='allow'?'allowed':'denied'}</span>. Later rules are never checked.</li>`:`<li>Rule ${s.i+1}: no match (${s.why}). Next rule.</li>`).join('')+
    (T.d.i===-1?'<li>No rule matched, so the <span class="fw-act-deny">implicit deny</span> drops it.</li>':'')+'</ul>';}
function rerender(sim,fid){sim._fid=fid;sim.infoDirty=true;BioLab.refresh(sim);}
function bindPanel(sim,el){
  const editable=()=>!sim.st.chRules;
  el.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,rules=rulesOf(sim),i=+b.dataset.i;
    if(a==='trace'){runTrace(sim);rerender(sim,'trace');return;}if(!editable())return;
    if(a==='up'&&i>0){[rules[i-1],rules[i]]=[rules[i],rules[i-1]];rerender(sim,i-1?'up'+(i-1):'down0');}
    else if(a==='down'&&i<rules.length-1){[rules[i+1],rules[i]]=[rules[i],rules[i+1]];rerender(sim,i+1<rules.length-1?'down'+(i+1):'up'+(i+1));}
    else if(a==='del'){rules.splice(i,1);rerender(sim,rules.length?'del'+Math.min(i,rules.length-1):'add');}
    else if(a==='add'){const d=sim.fw.draft;rules.push(Object.assign({},d,{port:String(d.port).trim()||'any'}));rerender(sim,'add');}};
  el.onchange=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,rules=rulesOf(sim),i=+b.dataset.i;
    if(a.startsWith('t-')){sim.fw.tr[a.slice(2)]=b.value;return;}
    if(a.startsWith('d-')){sim.fw.draft[a.slice(2)]=b.value;return;}
    if(!editable()||!rules[i])return;if(a==='log')rules[i].log=b.checked;else rules[i][a]=a==='port'?(b.value.trim()||'any'):b.value;sim.st.pk=[];rerender(sim,b.dataset.fid);};
  el.oninput=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='t-port')sim.fw.tr.port=b.value;if(a==='d-port')sim.fw.draft.port=b.value;};
  if(sim._fid){const e=el.querySelector('[data-fid="'+sim._fid+'"]');if(e)try{e.focus({preventScroll:true});}catch(_){}sim._fid=null;}}

/* ---------- drawing ---------- */
function drawHost(ctx,h,k,ph,showLabel){const x=h.x,y=h.y,srv=h.z==='servers',net=h.z==='internet';ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;
  if(srv){rr(ctx,x-13,y-17,26,32,4);ctx.fill();ctx.stroke();ctx.strokeStyle=PAL['line'];for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-8,y-9+i*8);ctx.lineTo(x+8,y-9+i*8);ctx.stroke();}}
  else if(net){ctx.beginPath();ctx.arc(x,y,13,0,6.29);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x,y,5.5,13,0,0,6.29);ctx.moveTo(x-13,y);ctx.lineTo(x+13,y);ctx.stroke();}
  else{rr(ctx,x-15,y-12,30,20,3);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-19,y+11);ctx.lineTo(x+19,y+11);ctx.stroke();}
  if(showLabel)txt(ctx,h.name,x,y+(net?28:30),{s:12*k,a:'center',c:PAL['cv-soft'],w:600});}
function draw(sim,ctx,vdt,k){const st=sim.st,ph=k>1.4,hon=atLeast('honors'),ap=atLeast('ap'),rules=rulesOf(sim),sc=score(sim,rules);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
  // cables
  ZK.forEach(z=>{const Z=ZONES[z];ctx.strokeStyle=PAL['line'];ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(Z.port[0],Z.port[1]);ctx.lineTo(Z.fw[0],Z.fw[1]);ctx.stroke();});
  // zones
  ZK.forEach(z=>{const Z=ZONES[z],[x,y,w,h]=Z.box;rr(ctx,x,y,w,h,12);ctx.fillStyle=z==='internet'?PAL['cv-bg2']:PAL['card'];ctx.fill();ctx.strokeStyle=z==='internet'?PAL['cv-soft']:PAL['line'];ctx.lineWidth=1.5;if(z==='internet')ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
    txt(ctx,Z.name,x+12,y+22*Math.min(k,1.3),{s:15*k,w:700});if(!ph)txt(ctx,Z.net,x+w-10,y+20,{s:12,c:PAL['cv-soft'],a:'right'});});
  Object.values(HOSTS).forEach(h=>{if(!atLeast(h.lvl))return;drawHost(ctx,h,k,ph,!ph);});
  // DNS failure hints
  Object.keys(st.noDns).forEach(id=>{const h=HOSTS[id];pill(ctx,'DNS failed',h.x+(h.z==='guest'?92:70),h.y-26,PAL['s1'],'#fff',12*k);});
  // firewall
  const fw=[335,215,130,100],lastRecent=st.last&&st.clock-st.last.t<1.2;rr(ctx,fw[0],fw[1],fw[2],fw[3],12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['rj'];ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle=PAL['rj'];for(let i=0;i<4;i++)for(let j=0;j<2;j++){ctx.globalAlpha=0.25;ctx.fillRect(fw[0]+12+i*28+(j%2)*12,fw[1]+60+j*14,22,10);}ctx.globalAlpha=1;
  txt(ctx,'Firewall',400,fw[1]+24*Math.min(k,1.25),{s:15*k,w:700,a:'center'});
  const rl=rules.length+' rule'+(rules.length===1?'':'s')+' + deny';txt(ctx,rl,400,fw[1]+(ph?56:46),{s:12*k,a:'center',c:PAL['cv-soft']});
  // scoreboard (top centre)
  const bx=284,bw=232;const bar=(y,lab,n,N,col)=>{txt(ctx,lab+' '+n+'/'+N,400,y,{s:13*k,w:700,a:'center'});rr(ctx,bx,y+7,bw,9,4);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();rr(ctx,bx,y+7,N?bw*n/N:0,9,4);ctx.fillStyle=col;ctx.fill();};
  bar(ph?84:78,ph?'Needed working':'Needed traffic working',sc.goodOK,sc.goodN,PAL['s3']);bar(ph?140:126,ph?'Unwanted blocked':'Unwanted traffic blocked',sc.badOK,sc.badN,PAL['s2']);
  if(!sandbox(sim)&&!ph)txt(ctx,'Goals met: '+sc.mOK+' of '+sc.missions.length,400,180,{s:13,c:PAL['cv-soft'],a:'center'});
  if(ap&&!ph)txt(ctx,stateful(sim)?'Stateful: replies allowed automatically':'Stateless: replies must match a rule',400,200,{s:12,c:stateful(sim)?PAL['cv-soft']:PAL['s1'],a:'center',w:600});
  // last decision
  if(lastRecent){const d=st.last.d;const lab=d.i===-2?'reply: tracked':d.i===-1?'implicit deny':'rule '+(d.i+1)+': '+d.act;pill(ctx,lab,400,fw[1]+fw[3]+20*k,d.act==='allow'?'#1b7339':'#b3261e','#fff',12*k);}
  // packets
  st.pk.forEach(p=>{let pos;if(p.state==='go'){const a=p.pts[p.seg],b=p.pts[p.seg+1];pos=[lerp(a[0],b[0],p.u),lerp(a[1],b[1],p.u)];}else pos=p.state==='drop'?p.pts[p.fwi]:p.pts[p.pts.length-1];
    const r=(ph?7:5.5)*(p.reply?0.75:1)*(p.test?1.5:1),al=p.state==='go'?1:clamp(1-p.t/(p.test?2.5:0.9),0,1);ctx.globalAlpha=al;
    if(p.state==='drop'){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3.5;const s=8+(p.test?4:0);ctx.beginPath();ctx.moveTo(pos[0]-s,pos[1]-s);ctx.lineTo(pos[0]+s,pos[1]+s);ctx.moveTo(pos[0]+s,pos[1]-s);ctx.lineTo(pos[0]-s,pos[1]+s);ctx.stroke();}
    else{ctx.fillStyle=p.test?PAL['cv-ink']:svcCol(p.f.burst?0:p.port);ctx.beginPath();if(p.reply){ctx.rect(pos[0]-r,pos[1]-r,2*r,2*r);}else ctx.arc(pos[0],pos[1],r,0,6.29);ctx.fill();
      if(p.test){ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=2;ctx.stroke();}
      if(sim.p.ports&&!ph&&p.state==='go'&&!p.reply)txt(ctx,String(p.port),pos[0],pos[1]-r-4,{s:12,w:700,a:'center',c:PAL['cv-ink']});}
    ctx.globalAlpha=1;});
  // legend
  if(!ph){let x=36;const y=488;[[443,'443 web'],[53,'53 DNS'],[445,'445 files'],[587,'587 email'],[3389,'3389 remote desktop'],[0,'scan probe']].forEach(([p,l])=>{ctx.fillStyle=svcCol(p);ctx.beginPath();ctx.arc(x,y-4,5.5,0,6.29);ctx.fill();txt(ctx,l,x+10,y,{s:12,c:PAL['cv-soft']});x+=ctx.measureText(l).width+30;});
    ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-5,y-9);ctx.lineTo(x+5,y+1);ctx.moveTo(x+5,y-9);ctx.lineTo(x-5,y+1);ctx.stroke();txt(ctx,'dropped',x+10,y,{s:12,c:PAL['cv-soft']});}
  else{txt(ctx,'Dots are packets. ✕ = dropped by the firewall.',400,492,{s:12*k,c:PAL['cv-soft'],a:'center'});}}

/* ---------- challenge answers from the model ---------- */
function answer(name,id){const fake={p:{stateful:true},st:{},forceSF:true};const rules=PRESETS[name]();const memo={};return flowResult(fake,rules,flowById(id),memo);}
const A_openDeny=answer('openDeny','guestFiles').reqOK;
const A_none=FLOWS.filter(f=>!f.lvl).every(f=>!answer('none',f.id).reqOK);
const A_denyFirst=answer('denyFirst','guestWeb');
const A_rdp=answer('rdpOrder','itRdp').works;
const A_scan=answer('catalogOnly','scan').reached;
const A_stateless=(()=>{const fake={p:{stateful:false},st:{},forceSF:false};return flowResult(fake,PRESETS.guestOut(),flowById('guestWeb'),{}).works;})();
const A_eph=(()=>{const fake={p:{stateful:false},st:{},forceSF:false};return flowResult(fake,PRESETS.guestOutEph(),flowById('unsol'),{}).reqOK;})();

function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const e=document.getElementById(d.id+'-'+c.id)||document.getElementById(d.id+'-'+c.id+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{if(!a.modes)return;const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}

const FW={
  id:'firewall',hash:'firewall',apUnit:20,order:2,tab:'Firewall rules',kind:'Virtual lab',
  card:'Rewrite a fictional library’s firewall rules so patrons can browse, staff can work and attackers stay out, while live traffic tests every rule.',
  title:'Firewall rules: lock down the library network',
  lede:{bio:'Cedar Hollow Public Library (fictional) has guest Wi-Fi, staff computers and servers. Write rules that let the right traffic through and stop the rest, and watch each packet pass or drop.',
        honors:'Rules match on source, destination, port and protocol. The firewall checks them in order, the first match wins, and anything left over hits the implicit deny.',
        ap:'Compare a stateful firewall (it tracks connections, so replies come back automatically) with a stateless one (every packet, replies included, must match a rule), and log the rules you need evidence from.'},
  scale:'One small building network: four zones, 11 devices and about a dozen kinds of traffic. Real firewalls check millions of packets a second.',
  aspect:1.6,timeless:true,animated:true,graph:false,chChange:1.2,chReveal:5,
  controls:[
    {id:'mode',label:'Mode',type:'seg',def:'case',options:[{v:'case',l:'Investigate'},{v:'sandbox',l:'Try it yourself'}],onChange(sim){sim.st.pk=[];sim.fw.trace=null;syncMode(sim);}},
    {id:'ports',label:'Show port numbers on packets',type:'toggle',def:true},
    {id:'quiet',label:'Pause the background traffic',type:'toggle',def:false,modes:['sandbox'],help:'Leaves only your test packets moving.'},
    {id:'stateful',label:'Stateful firewall',type:'toggle',def:true,lvl:'ap',help:'Off: replies are checked against the rules like any other packet.'}
  ],
  actions:[
    {id:'starter',label:'Load the library’s current rules',modes:['case'],run(sim){sim.fw.rules=STARTER();sim.st.chRules=null;sim.st.pk=[];}},
    {id:'clear',label:'Delete all rules',run(sim){if(sandbox(sim))sim.fw.sand=[];else sim.fw.rules=[];sim.st.chRules=null;sim.st.pk=[];}},
    {id:'test',label:'Send test packet',lvl:'honors',modes:['case','sandbox'],run(sim){runTrace(sim);}}
  ],
  init(sim){if(!sim.fw)sim.fw=newFW();const st={chRules:null,pk:[],tm:{},later:[],clock:0,last:null,noDns:{},log:[],logN:0,logDirty:false};if(sim.p._ch){st.chRules=PRESETS[sim.p._ch]();sim.p._ch=null;}return st;},
  step,
  metrics:[
    {id:'goodpct',label:'Needed traffic working',unit:'%',d:0,min:0,max:100,get:s=>{const c=score(s);return Math.round(100*c.goodOK/c.goodN);}},
    {id:'badpct',label:'Unwanted traffic blocked',unit:'%',d:0,min:0,max:100,get:s=>{const c=score(s);return Math.round(100*c.badOK/c.badN);}},
    {id:'goals',label:'Goals met',unit:'',d:0,min:0,max:6,modes:['case'],get:s=>score(s).mOK},
    {id:'nrules',label:'Rules',unit:'+ implicit deny',d:0,min:0,max:null,get:s=>rulesOf(s).length},
    {id:'logged',label:'Packets logged',unit:'',lvl:'ap',d:0,min:0,max:null,noTrial:true,get:s=>s.st.logN}
  ],
  infoPanel:panelHTML,bindInfo:bindPanel,
  narrate(sim){const rules=rulesOf(sim),sc=score(sim,rules),hon=atLeast('honors'),ap=atLeast('ap'),g=sc.get;
    if(!rules.length)return '<b>No rules at all</b>, so every packet falls through to the implicit deny at the bottom. Nothing gets in or out: perfectly secure and completely useless.';
    const r0=rules[0];if(r0.act==='allow'&&r0.src==='any'&&r0.dst==='any'&&parsePorts(r0.port)==='any'&&r0.proto==='any')return '<b>Rule 1 allows everything</b>, so it matches every packet and no later rule is ever checked. The patron laptop reaches the staff file share'+(rules.length>1?', no matter what rules 2 to '+rules.length+' say.':'.')+' Move narrow rules above broad ones.';
    if(sandbox(sim))return sim.fw.trace&&!sim.fw.trace.same?'Your test packet was '+(sim.fw.trace.d.act==='allow'?'<b>allowed</b>':'<b>denied</b>')+' by '+(sim.fw.trace.d.i===-1?'the implicit deny':'rule '+(sim.fw.trace.d.i+1))+'. The firewall checked '+sim.fw.trace.steps.length+' rule'+(sim.fw.trace.steps.length===1?'':'s')+' to decide.':'Write rules, then <b>send a test packet</b> to see which rule decides it. Rules are checked top to bottom and the first match wins.';
    if(!g('guestDns').works&&g('guestDns').f&&!g('guestWeb').needOK)return 'Patron web traffic is allowed, but <b>their DNS lookups are blocked</b>, so laptops cannot turn names like news.example.org into addresses and browsing fails. The DNS server lives in the Servers zone.';
    if(!stateful(sim)&&!g('guestWeb').repOK)return '<b>Stateless mode:</b> requests go out, but the replies come back to a high-numbered port no rule allows, so they are dropped. A stateful firewall would remember the connection and let the reply in.';
    if(sc.mOK===sc.missions.length)return '<b>Every goal is met.</b> Needed traffic flows and unwanted traffic is dropped. '+(g('scan').reached?'The scan still reaches port 443, because the catalog site has to be public. That is why exposed services must be kept patched.':'');
    const bad=sc.rs.find(r=>!r.f.good&&!r.blocked),miss=sc.rs.find(r=>r.f.good&&!r.works);
    if(bad)return '<b>'+bad.f.name+'</b> still gets through. '+(hon?'Find the rule that allows it and put a narrower deny above it, or narrow the allow.':'Add a deny rule for it above any rule that allows it.');
    if(miss)return '<b>'+miss.f.name+'</b> is blocked. '+(ap&&!stateful(sim)?'Check both the request and its reply.':'Add an allow rule for it above the implicit deny.');
    return 'The firewall checks each packet against the rules from the top. The <b>first match wins</b>.';},
  tour:[
    {title:'Four zones and a firewall',text:'The library network has four zones: guest Wi-Fi for patrons, staff computers, servers, and the internet. Every packet that crosses between zones passes through the firewall in the middle.',focus:[[14,54,772,424]],speed:0.5,setup(sim){usePreset(sim,'starter');}},
    {title:'Packets and ports',text:{bio:'Each dot is a packet. Its color and number tell you the service: 443 is secure web, 53 is DNS (looking up names), 445 is file sharing, 587 is sending email, 3389 is remote desktop.',honors:'A packet header carries the source, destination, protocol (TCP or UDP) and destination port. Firewall rules match on exactly those fields.'},focus:[[14,54,772,424]],speed:0.4},
    {title:'Allow everything means everything',text:'The library’s only rule is “allow any to any.” So the patron laptop’s file-sharing packets (purple, 445) reach the staff file server. That is how last week’s break-in happened.',focus:[[14,54,260,160],[530,300,256,176],[330,210,140,110]],speed:0.4},
    {title:'Rules are checked in order',text:'Here is a better rule set. The firewall reads rules from the top and stops at the first one that matches. A deny for guests sits above the allows, so guest packets to the servers are dropped (red ✕).',focus:[[330,210,140,130]],speed:0.4,setup(sim){usePreset(sim,'good');}},
    {title:'The implicit deny',text:'Anything no rule allows falls through to the bottom, where an invisible “deny everything” rule waits. The port scan and the outside remote desktop attempts die there, without any rule naming them.',focus:[[530,54,256,160],[330,210,140,130]],speed:0.4},
    {lvl:'honors',title:'What a scan still finds',text:'One scan probe gets through: port 443 on the catalog site, because patrons need it from home. A firewall cannot hide a service you choose to publish. That service must be patched and monitored.',focus:[[530,54,256,160],[530,300,256,176]],speed:0.4},
    {lvl:'ap',title:'Stateless: replies need rules too',text:'With the firewall stateless, a web reply returns to the laptop’s temporary port (here 51515). No rule allows it, so the replies (small squares) drop and browsing breaks, even though the request was allowed.',focus:[[14,54,772,424]],speed:0.4,setup(sim){usePreset(sim,'guestOut');BioLab.setValues(sim,{stateful:false});}},
    {lvl:'ap',title:'Logging rules',text:'Rules with Log ticked write a line for every packet they match: time, rule number, action, addresses and port. The logged denies are the evidence an investigator reads later.',focus:[[330,210,140,130]],speed:0.4,setup(sim){BioLab.setValues(sim,{stateful:true});usePreset(sim,'goodLog');}}
  ],
  onTourExit(sim){sim.st.chRules=null;sim.st.pk=[];BioLab.setValues(sim,{stateful:true});sim.infoDirty=true;},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.show&&phase==='done')ch.show(sim);},
  challenges:[
    {lvl:'bio',q:'Rule 1 is “allow any to any.” You add rule 2: “deny Guest Wi-Fi to Servers, port 445.” Will rule 2 stop the patron laptop from opening the staff file share?',
     choices:['Yes, the deny rule blocks it','No, rule 1 already allows it, so rule 2 is never checked'],correct:A_openDeny?1:0,
     baseline:{mode:'case',_ch:'starter'},change:{_ch:'openDeny'},changeText:'Rule 2 (deny guest to servers on 445) added below rule 1',
     explain:{bio:'The firewall stops at the first rule that matches. “Allow any to any” matches every packet, so the deny below it never runs. Put specific denies above broad allows.'}},
    {lvl:'bio',q:'You delete every rule. What happens to the library’s traffic?',choices:['Everything gets through, because nothing is blocked','Everything is dropped, even the traffic people need','Only the attacks are dropped'],correct:A_none?1:0,
     baseline:{mode:'case',_ch:'starter'},change:{_ch:'none'},changeText:'All rules deleted',
     explain:{bio:'Every firewall ends with an implicit deny: if no rule allows a packet, it is dropped. With no rules, nothing is allowed, so web, email and files all stop.'}},
    {lvl:'bio',q:'You put “deny Guest Wi-Fi to Servers” first, then “allow any to any.” Patrons only browse websites on the internet. Can they still browse?',
     choices:['Yes, websites are on the internet, not in Servers','No, their DNS lookups go to the DNS server in the Servers zone, so names never turn into addresses','Only secure sites break'],correct:!A_denyFirst.works&&!A_denyFirst.needOK?1:0,
     baseline:{mode:'case',_ch:'good'},change:{_ch:'denyFirst'},changeText:'Rules changed: deny guest to servers first, then allow everything',
     explain:{bio:'Browsing starts with a DNS lookup. The library’s DNS server is in the Servers zone, so a blanket deny breaks the web for guests. The fix is an allow for DNS (UDP 53) to that one server, placed above the deny.'}},
    {lvl:'honors',instant:true,q:'Rule 1: deny Internet to Servers, port 3389. Rule 2: allow Staff to Servers. Can the IT PC still use remote desktop (3389) on the file server?',
     choices:['No, rule 1 blocks port 3389 for everyone','Yes, rule 1 only matches packets from the internet, so rule 2 allows IT'],correct:A_rdp?1:0,
     show(sim){usePreset(sim,'rdpOrder');BioLab.setValues(sim,{mode:'case'});},
     explain:{honors:'A rule matches only when every field matches: source, destination, port and protocol. IT’s packets come from the Staff zone, so rule 1 does not match and rule 2 allows them. The traffic list now shows this rule set.'}},
    {lvl:'honors',q:'The only rule that lets the internet in is “allow Internet to the catalog site, TCP 443.” A scan probes 9 ports on the catalog server. How many probes get through?',
     choices:['0','1, the probe to port 443','All 9'],correct:A_scan===0?0:A_scan===1?1:2,
     baseline:{mode:'case',_ch:'starter'},change:{_ch:'catalogOnly'},changeText:'Rules set so only TCP 443 to the catalog site is open from the internet',
     explain:{honors:'Probes to 21, 22, 23, 25, 80, 445, 3389 and 8080 hit the implicit deny. The probe to 443 matches the allow rule, because a public website has to answer everyone. The scanner learns the site exists; the server itself must be patched.'}},
    {lvl:'ap',q:'Rules allow guests out to the web (TCP 443) and to DNS. You switch the firewall from stateful to stateless. Does patron browsing still work?',
     choices:['Yes, the requests are still allowed','No, the replies back to the laptop are dropped because no rule allows them'],correct:A_stateless?0:1,
     baseline:{mode:'case',stateful:true,_ch:'guestOut'},change:{stateful:false},changeText:'Firewall switched to stateless',
     explain:{ap:'A stateful firewall keeps a connection table and lets matching replies back in. A stateless one checks each packet alone. The reply goes from port 443 to the laptop’s ephemeral port (49152 to 65535), and the implicit deny drops it.'}},
    {lvl:'ap',instant:true,q:'To fix stateless browsing you add “allow Internet to Guest Wi-Fi, TCP 49152-65535.” What else does that rule let in?',
     choices:['Nothing, it only matches replies','Any outside host can now open new connections to patron laptops on those 16,384 ports','Only DNS replies'],correct:A_eph?1:0,
     show(sim){usePreset(sim,'guestOutEph');BioLab.setValues(sim,{mode:'case',stateful:false});},
     explain:{ap:'A stateless rule cannot tell a reply from a brand-new connection: both are just packets to a high port. The unsolicited connection from 203.0.113.66 now reaches the patron laptop. Stateful inspection allows replies without opening that hole, which is why almost every modern firewall is stateful.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What is the smallest set of rules that meets every goal?</p><ol><li>Read the case and the goals in the panel.</li><li>Add rules one at a time. After each, check the traffic list: which flows changed?</li><li>Record a trial each time a goal turns green.</li></ol><p>Explain why the order of your rules matters, using one example from your list.</p>',
       honors:'<p><b>Question:</b> How do rule order and rule width trade off?</p><ol><li>Solve the case with zone-wide rules.</li><li>Rewrite it using single hosts (the DNS server, the IT PC, the catalog site) wherever you can.</li><li>Use the packet tracer to test a packet you think should be blocked, and one that should pass.</li></ol><p>Which version would you rather defend? Why do security teams prefer the narrowest rule that works?</p>',
       ap:'<p><b>Question:</b> What does stateful inspection buy you?</p><ol><li>Solve the case in stateful mode and record a trial.</li><li>Switch to stateless. Add the fewest rules that make every needed flow work again, and record a trial.</li><li>Tick Log on your deny rules and collect a few log lines.</li></ol><p><b>Claim–evidence–reasoning:</b> Compare unwanted traffic blocked in both modes and explain which ports the stateless fix had to open.</p>'},
  terms:[{t:'Firewall',d:'A device or program that allows or blocks network traffic according to rules.'},{t:'Zone',d:'A group of devices with the same trust level, such as guest Wi-Fi or servers.'},{t:'Port',d:'A number that says which service a packet is for: 443 web, 53 DNS, 445 file sharing.'},
    {t:'First match wins',d:'Rules are checked top to bottom, and the first one that matches decides.'},{t:'Implicit deny',d:'The unwritten last rule: anything not allowed is blocked.'},
    {lvl:'honors',t:'TCP and UDP',d:'Two transport protocols. TCP sets up a connection and checks delivery (web, email); UDP sends single messages (DNS).'},{lvl:'honors',t:'Port scan',d:'Probing many ports to see which services answer.'},{lvl:'honors',t:'Least privilege',d:'Allow only the traffic that is needed, as narrowly as possible.'},
    {lvl:'ap',t:'Stateful inspection',d:'The firewall tracks open connections and allows their replies automatically.'},{lvl:'ap',t:'Ephemeral port',d:'A temporary high port (49152–65535) a client uses for one connection; replies return to it.'},{lvl:'ap',t:'Firewall log',d:'A record of the packets matched by rules marked for logging, used as evidence.'}],
  about:'<p>Each rule matches source (zone or host), destination, protocol and destination port; rules are checked in order and the first match decides, with an implicit deny at the end. Each kind of traffic is one repeating flow, and a flow “works” only if its request is allowed, its reply is allowed (automatically when stateful) and any DNS lookup it depends on also works. The network, people and addresses are fictional; outside addresses come from the ranges reserved for documentation (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24).</p><p>Real firewalls also match source ports, interfaces and directions, track connection state in more detail, inspect application content, and apply network address translation. Real scans and attacks are far more varied than one flow of each.</p>',
  draw,
  thumbSetup(sim){sim.fw.rules=GOOD();},
  prereq:['internet'],next:['logs','risk']
};
FW.onLevel=syncMode;
BioLab.register(FW);
})();

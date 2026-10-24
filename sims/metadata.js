(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const MONO='ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace';
const W=800,H=560;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- time zones with US daylight saving rules (since 2007) ---------- */
const ZONES={UTC:{std:0,n:'UTC',a:['UTC','UTC']},ET:{std:-5,n:'Eastern',a:['EST','EDT']},CT:{std:-6,n:'Central',a:['CST','CDT']},MT:{std:-7,n:'Mountain',a:['MST','MDT']},PT:{std:-8,n:'Pacific',a:['PST','PDT']}};
function nthSunday(y,m,n){const d=new Date(Date.UTC(y,m,1)).getUTCDay();return 1+((7-d)%7)+7*(n-1);}
function isDST(z,ms){if(z==='UTC')return false;const y=new Date(ms).getUTCFullYear(),s=ZONES[z].std;
  return ms>=Date.UTC(y,2,nthSunday(y,2,2),2-s)&&ms<Date.UTC(y,10,nthSunday(y,10,1),2-(s+1));}
const offH=(z,ms)=>ZONES[z].std+(isDST(z,ms)?1:0);
function parts(z,ms){const o=offH(z,ms),d=new Date(ms+o*3600e3);return {y:d.getUTCFullYear(),mo:d.getUTCMonth(),d:d.getUTCDate(),h:d.getUTCHours(),mi:d.getUTCMinutes(),s:d.getUTCSeconds(),wd:d.getUTCDay(),o,ab:ZONES[z].a[isDST(z,ms)?1:0],dst:isDST(z,ms)};}
/* local wall-clock time → UTC. status: ok, gap (never happened) or twice (happened twice) */
function fromLocal(z,y,mo,d,h,mi,s){const naive=Date.UTC(y,mo,d,h,mi,s||0);const c=[ZONES[z].std,ZONES[z].std+1].filter((o,i)=>z!=='UTC'||i===0).map(o=>naive-o*3600e3).filter(ms=>(naive-ms)/3600e3===offH(z,ms));
  if(!c.length)return {status:'gap',ms:naive-ZONES[z].std*3600e3};if(c.length>1)return {status:'twice',ms:Math.min(...c),alt:Math.max(...c)};return {status:'ok',ms:c[0]};}
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DAY=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const p2=n=>String(n).padStart(2,'0');
const h12=(h,mi,s)=>((h+11)%12+1)+':'+p2(mi)+(s!==undefined?':'+p2(s):'')+(h<12?' AM':' PM');
function fmtZ(z,ms,o){o=o||{};const P=parts(z,ms);return (o.day?DAY[P.wd]+' ':'')+MON[P.mo]+' '+P.d+(o.year?', '+P.y:'')+', '+h12(P.h,P.mi,o.sec?P.s:undefined)+' '+P.ab;}
const iso=ms=>new Date(ms).toISOString().replace('.000Z','Z');
const offStr=o=>(o<0?'−':'+')+p2(Math.abs(o))+':00';

/* ---------- the case: Saturday 7 March 2026, Pinecrest Academy (fictional), Mountain Standard Time ---------- */
const T=(h,m,s)=>Date.UTC(2026,2,7,h+7,m,s||0);      // MST wall clock → UTC ms
const T0=T(19,45),T1=T(21,45);
const LANES=['Diner receipt','Hale’s phone','School Wi-Fi','Door badges','Hall camera'];
const unix=ms=>Math.floor(ms/1000);
const CARDS=[
  {id:'receipt',t:'Diner receipt',lane:0,ms:T(20,12,40),raw:()=>['LAKESIDE DINER (fictional), register slip','03/07/2026  8:12 PM','Table 6 · 2 coffees · paid by J. Hale'],why:'The register prints local Mountain time, so 8:12 PM needs no conversion.'},
  {id:'photo1',t:'Photo IMG_2041',lane:1,ms:T(20,31,47),raw:l=>l?['IMG_2041.jpg  EXIF','DateTimeOriginal   2026:03:07 20:31:47','OffsetTimeOriginal −07:00   GPS: Lakeside Diner','Software           Lumen OS 14.2 (phone)']:['IMG_2041.jpg (photo from Hale’s phone)','Taken: Mar 7, 8:31 PM, at Lakeside Diner','Edited with: nothing (phone camera app)'],why:'The EXIF offset −07:00 says this is already Mountain time: 8:31 PM.'},
  {id:'wifi1',t:'Wi-Fi: phone in',lane:2,ms:T(20,44,5),raw:l=>l?['Wi-Fi controller (server clock: Mountain time)','2026-03-07 20:44:05','LUMEN-X2-JHALE joined SSID PinecrestGuest']:['School Wi-Fi log','Mar 7, 8:44 PM','Hale’s phone joined the school network'],why:'The Wi-Fi server keeps local Mountain time: 20:44 is 8:44 PM.'},
  {id:'badge1',t:'Badge: door in',lane:3,ms:T(20,47,30),raw:l=>l==='ap'?['Badge server database row','ts = '+unix(T(20,47,30))+'   (Unix time, seconds since 1970-01-01 UTC)','badge=0457 holder=J.Hale door=ROBOTICS-LAB event=OPEN']:l?['Badge server (logs in UTC)',iso(T(20,47,30)),'badge=0457 holder=J.Hale door=ROBOTICS-LAB event=OPEN']:['Door badge log','Mar 7, 8:47 PM','Hale’s badge opened the robotics lab door'],
    why:'The badge server logs UTC. 03:47 UTC on March 8 minus 7 hours is 8:47 PM on March 7 in Colorado.'},
  {id:'cam',t:'Camera motion',lane:4,ms:T(20,49,2),raw:l=>l?['Hall camera 2 DVR','03-07-2026 22:49:02  MOTION','DVR clock: installer set it to Eastern time (UTC−05:00)']:['Hall camera 2','Motion recorded at 8:49 PM','(time already corrected by the lab)'],why:'The DVR runs on Eastern time, 2 hours ahead of Mountain: 22:49 ET is 8:49 PM MT.'},
  {id:'badge2',t:'Badge: door out',lane:3,ms:T(21,6,10),raw:l=>l==='ap'?['Badge server database row','ts = '+unix(T(21,6,10))+'   (Unix time, seconds)','badge=0457 holder=J.Hale door=ROBOTICS-LAB event=EXIT']:l?['Badge server (logs in UTC)',iso(T(21,6,10)),'badge=0457 holder=J.Hale door=ROBOTICS-LAB event=EXIT']:['Door badge log','Mar 7, 9:06 PM','Hale’s badge exited the robotics lab'],
    why:'04:06 UTC on March 8 minus 7 hours is 9:06 PM on March 7.'},
  {id:'wifi2',t:'Wi-Fi: phone out',lane:2,ms:T(21,8,51),raw:l=>l?['Wi-Fi controller (server clock: Mountain time)','2026-03-07 21:08:51','LUMEN-X2-JHALE left SSID PinecrestGuest']:['School Wi-Fi log','Mar 7, 9:08 PM','Hale’s phone left the school network'],why:'Local server time: 21:08 is 9:08 PM.'},
  {id:'photo2',t:'Photo IMG_2057',lane:1,ms:T(21,15,0),edited:true,raw:l=>l?['IMG_2057.jpg  EXIF  (Hale’s alibi photo)','DateTimeOriginal   2026:03:07 21:15:00   GPS: Lakeside Diner','Software           PhotoForge 9 (fictional editor)','DateTime (modified) 2026:03:09 10:22:51']:['IMG_2057.jpg (Hale’s alibi photo)','Says taken: Mar 7, 9:15 PM, at Lakeside Diner','Edited with: PhotoForge 9 (fictional editor)','File changed: Mar 9, 10:22 AM'],
    why:'Its Software tag shows a photo editor, and it was modified two days later. The date and GPS fields could have been edited, so it cannot support the alibi.'}];
const TOL=4*60e3;
const atToMs=v=>T0+Math.round(v)*60e3,msToAt=ms=>Math.floor((ms-T0)/60e3);
const clockAt=v=>{const P=parts('MT',atToMs(v));return h12(P.h,P.mi);};
const lvlKey=()=>atLeast('ap')?'ap':atLeast('honors')?'honors':'';
function cardOk(st,i){const c=CARDS[i];if(c.edited)return st.trust[i]==='unreliable';const p=st.place[i];return p!=null&&Math.abs(atToMs(p)-c.ms)<=TOL&&st.trust[i]!=='unreliable';}

/* ---------- evidence inspector items ---------- */
const GEO={diner:{lat:39.6012,lon:-104.8423,n:'Lakeside Diner'},school:{lat:39.6205,lon:-104.8150,n:'Pinecrest Academy'},home:{lat:39.6080,lon:-104.8030,n:'Hale home'}};
function km(a,b){const R=6371,r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lon-a.lon)*r,x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
const dms=(v,pos,neg)=>{const a=Math.abs(v),d=Math.floor(a),m=Math.floor((a-d)*60),s=((a-d)*60-m)*60;return d+'° '+m+'′ '+s.toFixed(1)+'″ '+(v>=0?pos:neg);};
const ITEMS=[{id:'photo1',l:'Photo IMG_2041.jpg'},{id:'photo2',l:'Photo IMG_2057.jpg'},{id:'file',l:'File: controller_manual.pdf',lvl:'honors'},{id:'door',l:'Doorbell log, Mar 8',lvl:'ap'}];
const FILE_T={created:Date.UTC(2026,2,9,16,14,2),modified:Date.UTC(2026,1,20,23,2,40),accessed:Date.UTC(2026,2,9,16,15,10)};
const DOOR_LOCAL='2026-03-08 02:30:14';

/* ---------- show only what the current mode uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  setAtOut(sim);sim.infoDirty=true;}
function setAtOut(sim){const o=document.getElementById('metadata-at-out');if(o)o.textContent=clockAt(sim.p.at);}
function selectCard(sim,i){sim._guard=true;const st=sim.st;BioLab.setValues(sim,{card:i});const v={trust:st.trust[i]||'reliable'};if(st.place[i]!=null)v.at=st.place[i];BioLab.setValues(sim,v);sim._guard=false;setAtOut(sim);sim.infoDirty=true;}
function placeCard(sim,i,v){sim.st.place[i]=clamp(Math.round(v),0,120);sim.st.checked=false;}

/* ---------- sandbox converter ---------- */
function convState(sim){const st=sim.st,ap=atLeast('ap');
  if(ap&&sim.p.csrc==='unix'){const n=Number(String(st.unixIn).trim());if(!/^-?\d{1,11}$/.test(String(st.unixIn).trim())||!Number.isFinite(n))return {err:'Type a whole number of seconds, like 1772941650.'};return {ms:n*1000,status:'ok'};}
  const m=String(st.dt).match(/^\s*(\d{4})-(\d{1,2})-(\d{1,2})[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/);if(!m)return {err:'Type a date and time like 2026-03-08 03:47:30.'};
  const [y,mo,d,h,mi,s]=m.slice(1).map(x=>+(x||0));if(mo<1||mo>12||d<1||d>31||h>23||mi>59||s>59)return {err:'That date or time is out of range.'};
  return fromLocal(sim.p.zin,y,mo-1,d,h,mi,s);}

/* ---------- drawing helpers ---------- */
function mono(ctx,s,x,y,o){o=o||{};ctx.font=(o.w||400)+' '+(o.s||13)+'px '+MONO;ctx.fillStyle=o.c||PAL['cv-ink'];ctx.textAlign=o.a||'left';ctx.textBaseline=o.b||'alphabetic';ctx.fillText(s,x,y);}
function box(ctx,x,y,w,h,o){o=o||{};rr(ctx,x,y,w,h,o.r||10);ctx.fillStyle=o.fill||PAL['card'];ctx.fill();ctx.strokeStyle=o.stroke||PAL['line'];ctx.lineWidth=o.lw||1;ctx.stroke();}
function fit(ctx,s,maxW,size,w,font){ctx.font=(w||400)+' '+size+'px '+(font||FONT);if(ctx.measureText(s).width<=maxW)return s;while(s.length>1&&ctx.measureText(s+'…').width>maxW)s=s.slice(0,-1);return s+'…';}
const geoT=k=>{const cmp=k>1.3,X0=cmp?190:168,TW=W-24-X0,LT=cmp?120*Math.min(k,1.5)/1.5+44:122,LH=cmp?36:42;return {X0,TW,LT,LH,X:ms=>X0+(ms-T0)/(T1-T0)*TW};};
function chipGeo(sim,i,k){const g=geoT(k),st=sim.st,c=CARDS[i];if(st.place[i]==null)return null;const x=g.X(atToMs(st.place[i])),y=g.LT+c.lane*g.LH+g.LH/2,w=26*Math.min(k,1.6),h=24*Math.min(k,1.6);return {x,y,w,h};}
function trayGeo(i){const col=i%2,row=Math.floor(i/2);return {x:516+col*137,y:398+row*37,w:131,h:31};}

function drawCase(sim,ctx,k){const st=sim.st,cmp=k>1.3,g=geoT(k),L=sim.vis.L={},sel=Math.round(sim.p.card),lv=lvlKey();
  // alibi claim
  txt(ctx,cmp?'Hale says: “At the diner 8–10 PM.”':'J. Hale (fictional) says: “I was at Lakeside Diner from 8:00 to 10:00 PM. My photos prove it.”',24,30,{s:14*k,w:700});
  if(!cmp)txt(ctx,'Saturday, March 7, 2026 · Colorado, Mountain Standard Time (UTC−07:00) · robot controller went missing 8:30–9:30 PM',24,50,{s:12,c:PAL['cv-soft']});
  // bands
  const by=g.LT-34*Math.min(k,1.3);const bx=(a,b,lab,c,yy,tint)=>{const x1=g.X(a),x2=Math.min(g.X(b),g.X0+g.TW);ctx.fillStyle=c;if(tint){ctx.globalAlpha=0.07;ctx.fillRect(x1,g.LT,x2-x1,LANES.length*g.LH);}else{ctx.globalAlpha=0.6;ctx.setLineDash([4,4]);ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x1,yy);ctx.lineTo(x1,g.LT+LANES.length*g.LH);ctx.stroke();ctx.setLineDash([]);}ctx.globalAlpha=0.85;rr(ctx,x1,yy,x2-x1,13*Math.min(k,1.4)+6,4);ctx.fill();ctx.globalAlpha=1;
    txt(ctx,lab,x1+6,yy+(13*Math.min(k,1.4)+6)/2+1,{s:12*k,w:700,c:PAL['cv-bg'],b:'middle'});};
  LANES.forEach((n,i)=>{const y=g.LT+i*g.LH;ctx.fillStyle=i%2?PAL['cv-bg2']:PAL['card'];ctx.fillRect(g.X0,y,g.TW,g.LH);txt(ctx,fit(ctx,n,g.X0-30,12.5*k,700),20,y+g.LH/2+1,{s:12.5*k,w:700,b:'middle'});});
  bx(T(20,0),T(22,0),cmp?'Hale’s claim: diner':'Hale’s claim: at the diner',PAL['s2'],by-16*Math.min(k,1.3),false);bx(T(20,30),T(21,30),cmp?'Theft window':'Controller went missing',PAL['s1'],by+4,true);
  L.claim=[g.X0-6,by-22*Math.min(k,1.3),g.TW+12,40*Math.min(k,1.3)];
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(g.X0,g.LT,g.TW,LANES.length*g.LH);
  const ly=g.LT+LANES.length*g.LH;for(let m=15;m<120;m+=15){const x=g.X(atToMs(m));ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(x,g.LT);ctx.lineTo(x,ly+4);ctx.stroke();if(m%30===15||!cmp)txt(ctx,clockAt(m).replace(' PM',''),x,ly+17*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
  txt(ctx,'PM',g.X0+g.TW,ly+17*k,{s:12*k,a:'right',c:PAL['cv-soft'],w:700});
  L.timeline=[g.X0-6,g.LT-6,g.TW+12,LANES.length*g.LH+30*k];L.lanes=[12,g.LT-6,W-24,LANES.length*g.LH+12];
  // ghost markers for wrong placements after checking
  if(st.checked)CARDS.forEach((c,i)=>{if(cardOk(st,i)||c.edited)return;const x=g.X(c.ms),y=g.LT+c.lane*g.LH;ctx.setLineDash([4,3]);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x,y+g.LH-3);ctx.stroke();ctx.setLineDash([]);});
  // placed chips
  CARDS.forEach((c,i)=>{const q=chipGeo(sim,i,k);if(!q)return;const un=st.trust[i]==='unreliable';let stroke=i===sel?PAL['rj']:PAL['cv-soft'],lw=i===sel?3:1.5;
    if(st.checked){stroke=cardOk(st,i)?PAL['s3']:PAL['s1'];lw=3;}
    rr(ctx,q.x-q.w/2,q.y-q.h/2,q.w,q.h,6);ctx.fillStyle=un?PAL['card2']:(c.lane===1?'#3a6fb0':c.lane===0?'#8a5a2b':'#5d4a8a');ctx.globalAlpha=un?0.9:1;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();
    txt(ctx,String(i+1),q.x,q.y+1,{s:13*Math.min(k,1.6),w:800,a:'center',b:'middle',c:un?PAL['cv-soft']:'#fff'});
    if(un){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x-q.w/2+3,q.y+q.h/2-3);ctx.lineTo(q.x+q.w/2-3,q.y-q.h/2+3);ctx.stroke();}});
  // selected card's record
  const dy=ly+30*k,dw=cmp?776:490,dh=H-12-dy,c=CARDS[sel];box(ctx,12,dy,dw,dh,{});L.detail=[8,dy-4,dw+8,dh+8];
  const placed=st.place[sel]!=null;txt(ctx,(sel+1)+'. '+c.t,26,dy+20*k,{s:14*k,w:700});
  txt(ctx,placed?'on your timeline at '+clockAt(st.place[sel]):'not placed yet',dw,dy+20*k,{s:12*k,a:'right',c:placed?PAL['cv-ink']:PAL['cv-soft'],w:placed?700:400});
  c.raw(lv).forEach((ln,j)=>{const yy=dy+20*k+(j+1)*(cmp?16:18)*k+2;if(yy>H-16)return;mono(ctx,fit(ctx,ln,dw-32,12*k,j===1?700:400,MONO),26,yy,{s:12*k,w:j===1?700:400,c:j===0?PAL['cv-soft']:PAL['cv-ink']});});
  if(st.checked&&!cmp){const ok=cardOk(st,sel);pill(ctx,ok?'✓ Right':'✗ Look again',dw-40,dh+dy-18,ok?PAL['s3']:PAL['s1'],PAL['cv-bg'],12);}
  // tray: every card and where you put it
  if(!cmp){txt(ctx,'Evidence cards',516,388,{s:12,w:700,c:PAL['cv-soft']});CARDS.forEach((cc,i)=>{const q=trayGeo(i),pl=st.place[i]!=null;box(ctx,q.x,q.y,q.w,q.h,{fill:i===sel?PAL['card']:PAL['card2'],stroke:i===sel?PAL['rj']:PAL['line'],lw:i===sel?2:1,r:6});
      txt(ctx,(i+1)+' '+fit(ctx,cc.t,q.w-30,12,600),q.x+7,q.y+13,{s:12,w:600});txt(ctx,st.trust[i]==='unreliable'?'unreliable':pl?clockAt(st.place[i]):'not placed',q.x+7,q.y+26,{s:11.5,c:PAL['cv-soft']});
      if(st.checked)txt(ctx,cardOk(st,i)?'✓':'✗',q.x+q.w-6,q.y+20,{s:14,w:800,a:'right',c:cardOk(st,i)?PAL['s3']:PAL['s1']});});L.tray=[508,376,284,H-380];}}

function drawPhoto(ctx,x,y,w,h,which){ctx.save();ctx.beginPath();rr(ctx,x,y,w,h,8);ctx.clip();
  if(which==='photo1'){const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#14203a');g.addColorStop(1,'#2c3550');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#3b2f2a';ctx.fillRect(x+w*0.1,y+h*0.42,w*0.8,h*0.45);ctx.fillStyle='#ffd27a';for(let i=0;i<4;i++)ctx.fillRect(x+w*(0.16+i*0.18),y+h*0.56,w*0.12,h*0.16);
    ctx.fillStyle='#ff4f8b';ctx.font='700 '+Math.round(h*0.13)+'px '+FONT;ctx.textAlign='center';ctx.fillText('LAKESIDE DINER',x+w/2,y+h*0.36);ctx.fillStyle='#22262e';ctx.fillRect(x,y+h*0.87,w,h*0.13);}
  else{ctx.fillStyle='#e9d9b8';ctx.fillRect(x,y,w,h);ctx.fillStyle='#1d2a44';ctx.fillRect(x+w*0.08,y+h*0.1,w*0.84,h*0.38);ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.arc(x+w*0.75,y+h*0.25,h*0.05,0,6.29);ctx.fill();
    ctx.fillStyle='#b23a3a';ctx.fillRect(x,y+h*0.55,w,h*0.45);ctx.fillStyle='#f4f1ea';ctx.beginPath();ctx.ellipse(x+w*0.5,y+h*0.72,w*0.16,h*0.08,0,0,6.29);ctx.fill();ctx.fillStyle='#7b4a2a';ctx.fillRect(x+w*0.2,y+h*0.62,w*0.05,h*0.12);
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x+w*0.55,y+h*0.12,w*0.3,h*0.08);}
  ctx.restore();ctx.strokeStyle=PAL['line'];rr(ctx,x,y,w,h,8);ctx.stroke();}
function drawMap(ctx,x,y,w,h,pins,k){box(ctx,x,y,w,h,{fill:PAL['cv-bg2']});const la0=39.590,la1=39.630,lo0=-104.860,lo1=-104.795,X=lo=>x+(lo-lo0)/(lo1-lo0)*w,Y=la=>y+h-(la-la0)/(la1-la0)*h;
  ctx.save();ctx.beginPath();rr(ctx,x,y,w,h,10);ctx.clip();
  ctx.fillStyle=PAL['cv-water'];ctx.beginPath();ctx.ellipse(X(-104.848),Y(39.596),w*0.13,h*0.09,0.3,0,6.29);ctx.fill();
  ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=0.35;ctx.lineWidth=5;[[[-104.86,39.605],[-104.795,39.605]],[[-104.83,39.59],[-104.83,39.63]],[[-104.86,39.622],[-104.795,39.615]],[[-104.812,39.59],[-104.808,39.63]]].forEach(r=>{ctx.beginPath();ctx.moveTo(X(r[0][0]),Y(r[0][1]));ctx.lineTo(X(r[1][0]),Y(r[1][1]));ctx.stroke();});ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let la=39.60;la<la1;la+=0.01){ctx.beginPath();ctx.moveTo(x,Y(la));ctx.lineTo(x+w,Y(la));ctx.stroke();txt(ctx,la.toFixed(2)+'° N',x+4,Y(la)-3,{s:12*k,c:PAL['cv-soft']});}
  for(let lo=-104.85;lo<lo1;lo+=0.02){ctx.beginPath();ctx.moveTo(X(lo),y);ctx.lineTo(X(lo),y+h);ctx.stroke();txt(ctx,Math.abs(lo).toFixed(2)+'° W',X(lo)+3,y+h-5,{s:12*k,c:PAL['cv-soft']});}
  pins.forEach(p=>{const px=X(p.lon),py=Y(p.lat);if(p.photo){ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py-16,9,Math.PI*0.75,Math.PI*0.25);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py-16,3.5,0,6.29);ctx.fill();}
    else{ctx.fillStyle=p.c;rr(ctx,px-7,py-7,14,14,3);ctx.fill();}
    if(p.label)txt(ctx,p.label,px+(p.right?12:-12),py+(p.photo?-24:4),{s:12.5*k,w:700,a:p.right?'left':'right',c:PAL['cv-ink']});});
  ctx.restore();txt(ctx,'Pinecrest (fictional town)',x+w-8,y+18*k,{s:12*k,w:700,a:'right',c:PAL['cv-soft']});}
function drawExif(sim,ctx,k){const it=ITEMS.find(i=>i.id===sim.p.item)||ITEMS[0],cmp=k>1.3,hon=atLeast('honors'),ap=atLeast('ap'),L=sim.vis.L={};
  if(it.id==='photo1'||it.id==='photo2'){const c=CARDS.find(x=>x.id===it.id),ed=it.id==='photo2';const pw=cmp?300:372,ph=pw*0.6;drawPhoto(ctx,20,20,pw,ph,it.id);L.photo=[14,14,pw+12,ph+12];
    const rows=hon?[['Make / Model','Lumen X2 (fictional)'],['DateTimeOriginal','2026:03:07 '+(ed?'21:15:00':'20:31:47')],['OffsetTimeOriginal','−07:00'],['GPSLatitude',dms(GEO.diner.lat,'N','S')],['GPSLongitude',dms(GEO.diner.lon,'E','W')],['Software',ed?'PhotoForge 9 (fictional)':'Lumen OS 14.2'],['DateTime (modified)',ed?'2026:03:09 10:22:51':'2026:03:07 20:31:47']]
      :[['Camera','Lumen X2 phone (fictional)'],['Date taken',ed?'Mar 7, 2026, 9:15 PM':'Mar 7, 2026, 8:31 PM'],['Location','GPS: Lakeside Diner'],['Edited with',ed?'PhotoForge 9 (fictional)':'nothing'],['File last changed',ed?'Mar 9, 2026, 10:22 AM':'Mar 7, 2026, 8:31 PM']];
    let ty=ph+50;const tw=cmp?776:pw+8;box(ctx,12,ty-22*k,tw,Math.min(H-12-(ty-22*k),rows.length*19*k+26),{});L.exif=[8,ty-26*k,tw+8,rows.length*19*k+34];
    if(!cmp)txt(ctx,ed?'Red rows: a photo editor saved this file two days after the photo was taken.':'Software is the phone’s own system: no sign of editing.',24,ty+rows.length*19*k+22,{s:12.5,w:700,c:ed?PAL['s1']:PAL['cv-soft']});
    rows.forEach((r,i)=>{const yy=ty+i*19*k;if(yy>H-14)return;const bad=ed&&/Software|Edited|modified|changed/.test(r[0]);txt(ctx,r[0],24,yy,{s:12.5*k,w:700,c:bad?PAL['s1']:PAL['cv-soft']});mono(ctx,r[1],cmp?330:190,yy,{s:12.5*k,w:bad?700:400,c:bad?PAL['s1']:PAL['cv-ink']});});
    if(!cmp){const mx=414,my=20,mw=372,mh=400;drawMap(ctx,mx,my,mw,mh,[{...GEO.school,c:PAL['s5'],label:'Pinecrest Academy',right:false},{...GEO.diner,photo:true,label:'Photo GPS',right:true},{...GEO.diner,c:PAL['s4'],label:'',right:true}],1);L.map=[mx-4,my-4,mw+8,mh+8];
      const d=km(GEO.diner,GEO.school);let yy=my+mh+26;txt(ctx,'Diner to school: '+d.toFixed(1)+' km, about '+Math.round(d/0.6)+' min by car',mx,yy,{s:13,w:700});yy+=19;
      if(ap){txt(ctx,'GPS decimal: '+GEO.diner.lat.toFixed(4)+', '+GEO.diner.lon.toFixed(4)+' (DMS ÷ 60 ÷ 3600)',mx,yy,{s:12,c:PAL['cv-soft']});yy+=18;}
      txt(ctx,ed?'GPS and time can be retyped in an editor.':'Phone camera wrote these fields itself.',mx,yy,{s:12.5,c:ed?PAL['s1']:PAL['cv-soft'],w:700});}
    return;}
  const note=(lines,hi)=>{const lh=20*k,bh=lines.length*lh+20,y0=H-12-bh;box(ctx,20,y0,760,bh,{fill:PAL['card2']});lines.forEach((l,i)=>txt(ctx,cmp?fit(ctx,l,736,12.5*k):l,36,y0+8+lh*0.8+i*lh,{s:12.5*k,c:i===hi?PAL['cv-ink']:PAL['cv-soft'],w:i===hi?700:400}));L.note=[16,y0-4,768,bh+8];};
  if(it.id==='file'){const x0=cmp?60:40,x1=cmp?740:760,a=Date.UTC(2026,1,16),b=Date.UTC(2026,2,12),X=ms=>x0+(ms-a)/(b-a)*(x1-x0),ay=cmp?236:220;
    box(ctx,20,20,760,cmp?44*k:66,{});txt(ctx,'controller_manual.pdf on Hale’s laptop',36,cmp?20+28*k:46,{s:14*k,w:700});if(!cmp)txt(ctx,'Properties shown by the file system, in Mountain time',36,68,{s:12,c:PAL['cv-soft']});
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,ay);ctx.lineTo(x1,ay);ctx.stroke();
    for(let d=a;d<=b;d+=7*864e5){const x=X(d);ctx.beginPath();ctx.moveTo(x,ay-5);ctx.lineTo(x,ay+5);ctx.stroke();const P=parts('MT',d+12*3600e3);txt(ctx,MON[P.mo]+' '+P.d,x,ay+22*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
    const ev=[['Modified',FILE_T.modified,PAL['s2'],-1,60],['Created',FILE_T.created,PAL['s5'],-1,80],['Accessed',FILE_T.accessed,PAL['s3'],1,70]];
    ev.forEach(([n,ms,c,side,len],i)=>{const x=X(ms)+(i===2?10:0),yy=ay+side*len*Math.min(k,1.3);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,ay);ctx.lineTo(x,yy);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,ay,6,0,6.29);ctx.fill();
      txt(ctx,n+': '+fmtZ('MT',ms),x+(i===0?6:-6),yy+(side<0?-5:16*k),{s:12.5*k,w:700,a:i===0?'left':'right',c});});
    L.mac=[20,ay-110,760,210];
    note(cmp?['Modified (Feb 20) is before Created (Mar 9).','Copying makes a new file with a new Created time','and keeps the old Modified time: a copy artifact.']:atLeast('ap')?['NTFS keeps M (modified), A (accessed), C (record changed) and B (born, or created) for every file.','B and C both read Mar 9, 10:14 AM: the file record was born when the copy was made.','Copying writes a new file (new Created time) but keeps the old content’s Modified time.','So “modified before created” is a normal copy artifact, not proof of tampering.']
      :['Modified (Feb 20) is earlier than Created (Mar 9). That looks impossible, but it is normal:','copying a file makes a new file with a new Created time and keeps the old Modified time.','So this file was copied onto the laptop on March 9, two days after the theft.'],cmp?2:atLeast('ap')?3:2);return;}
  // doorbell: the spring-forward gap
  box(ctx,20,20,760,cmp?44*k:66,{});txt(ctx,cmp?'Doorbell log, Mountain time':'Smart doorbell at the Hale home (fictional), clock set to Mountain time',36,cmp?20+28*k:46,{s:14*k,w:700});if(!cmp)mono(ctx,'Log entry: '+DOOR_LOCAL+'  FRONT DOOR OPENED',36,68,{s:12.5,c:PAL['s1'],w:700});
  const x0=cmp?110:70,x1=cmp?690:730,ay=cmp?220:215,X=ms=>x0+(ms-Date.UTC(2026,2,8,7))/(Date.UTC(2026,2,8,11)-Date.UTC(2026,2,8,7))*(x1-x0),hs=cmp?2:1;
  for(let hU=7;hU<=11;hU+=hs){const ms=Date.UTC(2026,2,8,hU),x=X(ms),P=parts('MT',ms);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,ay-36);ctx.lineTo(x,ay+36);ctx.stroke();
    txt(ctx,p2(hU)+':00 UTC',x,ay-44,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,h12(P.h,0)+' '+P.ab,x,ay+56*Math.min(k,1.3),{s:12.5*k,w:700,a:'center'});}
  const xj=X(Date.UTC(2026,2,8,9));ctx.globalAlpha=0.55;ctx.fillStyle=PAL['s2'];ctx.fillRect(x0,ay-13,xj-x0,26);ctx.fillStyle=PAL['s4'];ctx.fillRect(xj,ay-13,x1-xj,26);ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['s1'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xj,ay-30);ctx.lineTo(xj,ay+30);ctx.stroke();
  txt(ctx,'Clocks jump 1:59:59 → 3:00:00',xj,ay-44-22*k,{s:13*k,w:800,a:'center',c:PAL['s1']});L.jump=[x0-10,ay-80-16*k,x1-x0+20,170+16*k];
  txt(ctx,'MST',(x0+xj)/2,ay+1,{s:12*k,w:800,a:'center',b:'middle',c:PAL['cv-ink']});txt(ctx,'MDT',(xj+x1)/2,ay+1,{s:12*k,w:800,a:'center',b:'middle',c:PAL['cv-ink']});
  const r=fromLocal('MT',2026,2,8,2,30,14);
  note(cmp?['2:30 AM on Mar 8 never happened in MT.','The doorbell ignores daylight saving, so','its 02:30 MST is really 3:30 AM MDT.']:['A Mountain-time clock never shows 2:30 AM on March 8, 2026: that hour is skipped.','So the doorbell does not adjust for daylight saving. Its 02:30 is still MST:','02:30:14 MST = '+iso(r.ms)+' = 3:30:14 AM MDT, an hour later than it looks.'],2);}

function drawClock(ctx,cx,cy,R,P,label,k){ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<12;i++){const a=i/12*6.283;ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*R*0.85,cy-Math.cos(a)*R*0.85);ctx.lineTo(cx+Math.sin(a)*R*0.95,cy-Math.cos(a)*R*0.95);ctx.stroke();}
  const ha=((P.h%12)+P.mi/60)/12*6.283,ma=(P.mi+P.s/60)/60*6.283;ctx.strokeStyle=PAL['cv-ink'];ctx.lineCap='round';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(ha)*R*0.5,cy-Math.cos(ha)*R*0.5);ctx.stroke();
  ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(ma)*R*0.78,cy-Math.cos(ma)*R*0.78);ctx.stroke();ctx.lineCap='butt';ctx.fillStyle=PAL['rj'];ctx.beginPath();ctx.arc(cx,cy,3.5,0,6.29);ctx.fill();
  txt(ctx,label,cx,cy-R-12,{s:13*k,w:700,a:'center'});txt(ctx,h12(P.h,P.mi,P.s),cx,cy+R+20*k,{s:13*k,w:700,a:'center'});txt(ctx,MON[P.mo]+' '+P.d+' · '+P.ab,cx,cy+R+38*k,{s:12*k,a:'center',c:P.dst?PAL['s4']:PAL['cv-soft'],w:P.dst?700:400});}
function drawConvert(sim,ctx,k){const cs=convState(sim),cmp=k>1.3,L=sim.vis.L={},ap=atLeast('ap');
  if(cs.err){box(ctx,40,180,720,80,{fill:PAL['card2']});txt(ctx,cs.err,400,226,{s:15*k,w:700,a:'center',c:PAL['s1']});return;}
  const ms=cs.ms,zs=cmp?['UTC','ET','MT','PT']:['UTC','ET','CT','MT','PT'],R=cmp?62:66,gap=W/zs.length;
  txt(ctx,'One instant, '+zs.length+' clocks',400,28*k,{s:14*k,w:700,a:'center'});
  zs.forEach((z,i)=>drawClock(ctx,gap*(i+0.5),60*k+R+16,R,parts(z,ms),ZONES[z].n,cmp?k*0.95:k));L.clocks=[8,12,784,60*k+2*R+80*k];
  let y=60*k+2*R+90*k;const lh=20*k;box(ctx,12,y,776,H-12-y,{fill:PAL['card2']});L.out=[8,y-4,784,H-8-y];y+=24*k;
  if(cs.status==='gap'){txt(ctx,cmp?'That local time never happened.':'That local time never happened: clocks jumped forward an hour (spring forward).',26,y,{s:13.5*k,w:700,c:PAL['s1']});y+=lh;}
  if(cs.status==='twice'){txt(ctx,cmp?'That local time happened twice.':'That local time happened twice: clocks fell back an hour. The first one is shown.',26,y,{s:13.5*k,w:700,c:PAL['s4']});y+=lh;}
  mono(ctx,'UTC   '+iso(ms),26,y,{s:13*k,w:700});y+=lh;
  if(!cmp){mono(ctx,'Colorado   '+fmtZ('MT',ms,{day:true,year:true,sec:true})+' (UTC'+offStr(offH('MT',ms))+')',26,y,{s:13});y+=lh;}
  if(ap){const u=unix(ms);mono(ctx,'Unix  '+u,26,y,{s:13*k,w:700,c:PAL['s2']});y+=lh;
    if(!cmp&&u>=0&&u<2**32){mono(ctx,'32-bit  '+(u>>>0).toString(2).padStart(32,'0').replace(/(.{8})/g,'$1 '),26,y,{s:12.5,c:PAL['cv-soft']});y+=lh;
      txt(ctx,'A signed 32-bit counter runs out at 2³¹ − 1 = 2,147,483,647: 03:14:07 UTC on Jan 19, 2038.',26,y,{s:12.5,c:PAL['cv-soft']});}}}

/* ---------- the definition ---------- */
const SIM={
  id:'metadata',hash:'metadata',apUnit:18,order:3,tab:'Metadata and timelines',kind:'Virtual lab',
  card:'Pull times and places from photo metadata and system logs, line them up on a timeline, and test a suspect’s alibi.',
  title:'Metadata and timelines',
  lede:{bio:'Photos and computers record when and where things happen. Put eight pieces of evidence on a timeline and decide whether the suspect’s alibi holds.',
        honors:'Raw logs use different clocks: UTC servers, a camera set to the wrong time zone, EXIF offsets. Convert every record to one time zone before you trust the timeline.',
        ap:'Decode Unix timestamps, read MAC times, and catch a time that daylight saving made impossible.'},
  scale:{bio:'Two hours on one Saturday evening in a fictional town. The diner and the school are 3.2 km apart.',honors:'Colorado is on Mountain Standard Time (UTC−07:00) until 2:00 AM on March 8, 2026, then Mountain Daylight Time (UTC−06:00).'},
  aspect:W/H,timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'case',lvl:'bio',options:[{v:'case',l:'Investigate'},{v:'exif',l:'Inspect the evidence'},{v:'convert',l:'Try it yourself'}],onChange:syncMode},
    {id:'card',label:'Evidence card',type:'select',def:0,lvl:'bio',modes:['case'],options:CARDS.map((c,i)=>({v:i,l:(i+1)+'. '+c.t})),onChange(sim){if(!sim._guard)selectCard(sim,Math.round(sim.p.card));}},
    {id:'at',label:'Place the card at',type:'range',min:0,max:120,step:1,def:27,lvl:'bio',modes:['case'],noTrial:true,help:'Drag a card on the timeline, click the timeline, or use this slider.',onChange(sim){sim.p.at=Math.round(sim.p.at);if(!sim._guard&&sim.st)placeCard(sim,Math.round(sim.p.card),sim.p.at);setAtOut(sim);}},
    {id:'trust',label:'This record is',type:'seg',def:'reliable',lvl:'bio',modes:['case'],options:[{v:'reliable',l:'Reliable'},{v:'unreliable',l:'Unreliable'}],onChange(sim){if(sim._guard||!sim.st)return;const i=Math.round(sim.p.card);if((sim.st.trust[i]||'reliable')!==sim.p.trust){sim.st.trust[i]=sim.p.trust;sim.st.checked=false;}}},
    {id:'verdict',label:'Your verdict',type:'seg',def:'none',lvl:'bio',modes:['case'],options:[{v:'none',l:'Not decided'},{v:'holds',l:'Alibi holds'},{v:'fails',l:'Alibi fails'}],onChange(sim){if(sim.st)sim.st.checked=false;}},
    {id:'item',label:'Evidence item',type:'select',def:'photo1',lvl:'bio',modes:['exif'],options:ITEMS.map(i=>({v:i.id,l:i.l,lvl:i.lvl}))},
    {id:'zin',label:'My time is in',type:'select',def:'UTC',lvl:'bio',modes:['convert'],options:Object.keys(ZONES).map(z=>({v:z,l:z==='UTC'?'UTC':ZONES[z].n+' time (US)'}))},
    {id:'csrc',label:'Convert from',type:'seg',def:'date',lvl:'ap',modes:['convert'],options:[{v:'date',l:'Date and time'},{v:'unix',l:'Unix timestamp'}]}
  ],
  actions:[
    {id:'check',label:'Check my timeline',lvl:'bio',primary:true,modes:['case'],run(sim){sim.st.checked=true;}},
    {id:'remove',label:'Take this card off',lvl:'bio',modes:['case'],run(sim){delete sim.st.place[Math.round(sim.p.card)];sim.st.checked=false;}},
    {id:'clearall',label:'Clear the timeline',lvl:'bio',modes:['case'],run(sim){sim.st.place={};sim.st.trust={};sim.st.checked=false;sim._guard=true;BioLab.setValues(sim,{trust:'reliable',verdict:'none'});sim._guard=false;}},
    {id:'solve',label:'Show the answer',lvl:'bio',modes:['case'],run(sim){CARDS.forEach((c,i)=>{if(c.edited){sim.st.trust[i]='unreliable';sim.st.place[i]=msToAt(c.ms);}else{sim.st.place[i]=msToAt(c.ms);sim.st.trust[i]='reliable';}});sim._guard=true;BioLab.setValues(sim,{verdict:'fails'});selectCard(sim,Math.round(sim.p.card));sim._guard=false;sim.st.checked=true;}},
    {id:'pbadge',label:'Load: badge log time',lvl:'bio',modes:['convert'],run(sim){sim.st.dt='2026-03-08 03:47:30';BioLab.setValues(sim,{zin:'UTC',csrc:'date'});}},
    {id:'pdvr',label:'Load: camera DVR time',lvl:'bio',modes:['convert'],run(sim){sim.st.dt='2026-03-07 22:49:02';BioLab.setValues(sim,{zin:'ET',csrc:'date'});}},
    {id:'pdoor',label:'Load: 2:30 AM, March 8',lvl:'honors',modes:['convert'],run(sim){sim.st.dt=DOOR_LOCAL;BioLab.setValues(sim,{zin:'MT',csrc:'date'});}},
    {id:'pfall',label:'Load: 1:30 AM, November 1',lvl:'honors',modes:['convert'],run(sim){sim.st.dt='2026-11-01 01:30:00';BioLab.setValues(sim,{zin:'MT',csrc:'date'});}}
  ],
  init(){return {place:{0:msToAt(CARDS[0].ms)},trust:{},checked:false,dt:'2026-03-08 03:47:30',unixIn:'1772941650'};},
  step(){},
  metrics:[
    {id:'placed',label:'Cards on your timeline',unit:'of 8',lvl:'bio',min:0,max:8,d:0,modes:['case'],get:s=>Object.keys(s.st.place).length},
    {id:'score',label:'Cards placed right',lvl:'bio',text:true,modes:['case'],get:s=>s.st.checked?CARDS.filter((c,i)=>cardOk(s.st,i)).length+' of 8':'Press Check my timeline'},
    {id:'cardt',label:'This card on your timeline',lvl:'bio',text:true,modes:['case'],get:s=>{const i=Math.round(s.p.card);return s.st.trust[i]==='unreliable'?'Marked unreliable':s.st.place[i]!=null?clockAt(s.st.place[i]):'Not placed';}},
    {id:'atschool',label:'Hale’s phone at school, by your timeline',unit:'min',lvl:'honors',min:0,max:60,d:0,modes:['case'],get:s=>{const a=s.st.place[2],b=s.st.place[6];return a!=null&&b!=null&&b>a?b-a:0;}},
    {id:'dist',label:'Photo GPS to the school',unit:'km',lvl:'honors',min:0,max:5,d:2,modes:['exif'],get:()=>km(GEO.diner,GEO.school)},
    {id:'utc',label:'UTC',lvl:'bio',text:true,modes:['convert'],get:s=>{const c=convState(s);return c.err?'—':iso(c.ms);}},
    {id:'mt',label:'Colorado time',lvl:'bio',text:true,modes:['convert'],get:s=>{const c=convState(s);return c.err?'—':fmtZ('MT',c.ms,{year:true,sec:true});}},
    {id:'unix',label:'Unix timestamp',unit:'s',lvl:'ap',min:0,max:null,d:0,modes:['convert'],get:s=>{const c=convState(s);return c.err?0:unix(c.ms);}}
  ],
  graph:false,
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='convert'){return '<h3>Try it yourself: time converter</h3><p>Type a date and time, choose its time zone, and see the same instant everywhere. US daylight saving rules are built in. Nothing leaves this page.</p>'+
      '<label for="metadata-dt" style="font-weight:700">Date and time (YYYY-MM-DD hh:mm:ss, 24-hour)</label><input id="metadata-dt" type="text" autocomplete="off" spellcheck="false" value="'+esc(st.dt)+'" style="width:100%;box-sizing:border-box;font:16px ui-monospace,Consolas,monospace;padding:7px 9px;margin:4px 0 10px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)">'+
      (ap?'<label for="metadata-unix" style="font-weight:700">Unix timestamp (seconds since 1970-01-01 00:00:00 UTC)</label><input id="metadata-unix" type="text" inputmode="numeric" autocomplete="off" value="'+esc(st.unixIn)+'" style="width:100%;box-sizing:border-box;font:16px ui-monospace,Consolas,monospace;padding:7px 9px;margin:4px 0 10px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)">':'')+
      '<p>Try the presets under Variables. '+(hon?'Then try 2:30 AM on March 8, 2026 in Mountain time, and 1:30 AM on November 1, 2026.':'')+'</p>';}
    if(p.mode==='exif'){const it=p.item;
      if(it==='photo1')return '<h3>IMG_2041.jpg</h3><p>Phones write <b>metadata</b> into every photo: when it was taken, the time zone offset, the camera model and, if location is on, GPS coordinates. This standard is called <b>EXIF</b>.</p><p>This photo puts Hale at Lakeside Diner at 8:31 PM. The Software tag is the phone’s own system, so nothing suggests editing.</p>';
      if(it==='photo2')return '<h3>IMG_2057.jpg</h3><p>Hale’s alibi photo says 9:15 PM at the diner. But its <b>Software</b> tag names a photo editor, and its <b>modified</b> date is two days after the theft.</p><p>Editors can change any metadata field, including the date and GPS. This photo is not reliable evidence, and investigators would ask for the original file from the phone.</p>';
      if(it==='file')return '<h3>MAC times</h3><p>File systems keep times for each file: <b>M</b>odified (content last changed), <b>A</b>ccessed (last opened) and <b>C</b>reated. NTFS also keeps the time the file’s record Changed. Together they are called <b>MAC times</b>.</p><p>A Created time later than the Modified time is the classic sign of a <b>copy</b>.</p>';
      return '<h3>A time that never happened</h3><p>On Sunday, March 8, 2026, US clocks sprang forward from 2:00 AM straight to 3:00 AM. In Mountain time, 2:30 AM that day does not exist.</p><p>A device that shows it is not following daylight saving, so its clock is an hour behind. Check the clock settings of every device before you build a timeline.</p>';}
    let h='<h3>Case file: the missing robot controller (fictional)</h3><p>The robotics team’s competition controller vanished from Pinecrest Academy’s lab between 8:30 and 9:30 PM on Saturday, March 7. J. Hale says: “I was at Lakeside Diner from 8:00 to 10:00 PM.”</p>';
    h+='<p><b>Your job:</b> place all eight evidence cards at the time each event really happened, in Colorado time. Mark any record you cannot trust as unreliable. Then give your verdict and press Check my timeline.</p>';
    if(hon)h+='<p><b>Watch the clocks.</b> Some systems log in UTC, and one camera runs on Eastern time. Use Try it yourself to convert.</p>';
    if(st.checked){const n=CARDS.filter((c,i)=>cardOk(st,i)).length,v=p.verdict;h+='<p class="verdict '+(n===8&&v==='fails'?'ok':'no')+'">'+n+' of 8 cards right. Verdict: '+(v==='fails'?'correct, the alibi fails.':v==='holds'?'not supported by the evidence.':'not chosen yet.')+'</p><ul style="margin:4px 0;padding-left:20px">'+
      CARDS.map((c,i)=>{if(cardOk(st,i))return '';const P=parts('MT',c.ms);return '<li><b>'+(i+1)+'. '+c.t+':</b> '+(hon||c.edited?c.why:'The record says '+h12(P.h,P.mi)+'. Put the card at that time.')+'</li>';}).join('')+'</ul>'+(n===8&&v==='fails'?'<p>Hale’s phone joined the school Wi-Fi at 8:44, his badge opened the lab at 8:47, the camera saw motion at 8:49, and he left by 9:08. Three independent systems agree, so a borrowed badge cannot explain it.</p>':'');}
    return h;},
  bindInfo(sim,el){const st=sim.st,d=el.querySelector('#metadata-dt'),u=el.querySelector('#metadata-unix');
    if(d)d.addEventListener('input',()=>{st.dt=d.value;if(sim.p.csrc!=='date')BioLab.setValues(sim,{csrc:'date'});});
    if(u)u.addEventListener('input',()=>{st.unixIn=u.value;if(sim.p.csrc!=='unix')BioLab.setValues(sim,{csrc:'unix'});});},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='convert'){const c=convState(sim);if(c.err)return c.err;
      if(c.status==='gap')return '<b>That time never happened</b> in '+ZONES[p.zin].n+' time: clocks jumped forward an hour. A log that shows it came from a clock that ignores daylight saving.';
      if(c.status==='twice')return '<b>That time happened twice</b> in '+ZONES[p.zin].n+' time, because clocks fell back an hour. Only the UTC offset or a UTC log can tell you which one.';
      const P=parts('MT',c.ms);return 'The same instant is <b>'+h12(P.h,P.mi)+' '+P.ab+'</b> in Colorado and '+iso(c.ms).slice(11,16)+' in UTC. Investigators convert every record to one time zone, usually UTC, before building a timeline.';}
    if(p.mode==='exif'){if(p.item==='photo2')return '<b>The Software tag gives this photo away.</b> A photo editor saved it two days after the theft, so its time and GPS fields could have been changed.';
      if(p.item==='file')return '<b>Modified before created</b> looks impossible, but copying a file does exactly this. The laptop’s copy was created March 9.';
      if(p.item==='door')return '<b>2:30 AM on March 8, 2026 never happened in Mountain time.</b> The doorbell ignores daylight saving, so its times are an hour behind.';
      return 'The phone stamped this photo with the time, the time zone offset (−07:00) and GPS coordinates at <b>Lakeside Diner</b>, '+km(GEO.diner,GEO.school).toFixed(1)+' km from the school.';}
    const i=Math.round(p.card),c=CARDS[i],n=Object.keys(st.place).length;
    if(st.checked){const ok=CARDS.filter((cc,j)=>cardOk(st,j)).length;return ok===8&&p.verdict==='fails'?'<b>Case solved.</b> Phone, badge and camera all put Hale at school from 8:44 to 9:08 PM, inside the theft window. The only evidence for the alibi is an edited photo.':'<b>'+ok+' of 8 cards are right.</b> Green dashed lines show where the wrong ones belong. Read each record’s clock carefully.';}
    if(c.edited&&st.trust[i]!=='unreliable')return 'Card '+(i+1)+' is Hale’s alibi photo. Look at its <b>Software</b> line before you trust it.';
    if(hon&&(c.id==='badge1'||c.id==='badge2'))return 'Card '+(i+1)+' comes from a server that logs <b>'+(ap?'Unix time, counted in UTC':'UTC')+'</b>. Colorado is 7 hours behind UTC in March, so subtract 7 hours before you place it.';
    if(hon&&c.id==='cam')return 'The camera DVR was left on <b>Eastern time</b>, 2 hours ahead of Colorado. Its clock says 22:49.';
    if(st.place[i]!=null)return 'Card '+(i+1)+' sits at '+clockAt(st.place[i])+'. You have placed <b>'+n+' of 8</b> cards. Pick the next card and drag it to the time it really happened.';
    return 'You have placed <b>'+n+' of 8</b> cards. Drag card '+(i+1)+' ('+c.t.toLowerCase()+') to the time it really happened, then check where Hale’s phone was during the theft window.';},
  tour:[
    {title:'The alibi',text:'Hale claims he was at Lakeside Diner from 8 to 10 PM (blue band). The controller went missing between 8:30 and 9:30 PM (red band). Your timeline will test the claim.',focus:s=>s.vis.L&&s.vis.L.claim,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case'});}},
    {title:'Evidence from different systems',text:'Each lane is a different source: a diner receipt, Hale’s phone, the school Wi-Fi, door badges and a hall camera. Different sources that agree make strong evidence.',focus:s=>s.vis.L&&s.vis.L.lanes,speed:1,pause:true},
    {title:'Read the record',text:{bio:'Card 1 is the diner receipt: 8:12 PM. It goes in the Diner lane at 8:12.',honors:'Card 1 is the diner receipt. Its register prints local time, 8:12 PM, so it needs no conversion.'},focus:s=>s.vis.L&&[s.vis.L.detail,s.vis.L.timeline],speed:1,pause:true,setup(sim){selectCard(sim,0);placeCard(sim,0,msToAt(CARDS[0].ms));sim._guard=true;BioLab.setValues(sim,{at:sim.st.place[0]});sim._guard=false;}},
    {title:'Same moment, different clocks',text:{bio:'The badge log shows Hale’s badge opening the lab door at 8:47 PM, while he claims he was at the diner.',honors:'The badge server writes UTC: 03:47 on March 8. Colorado is UTC−07:00, so that is 8:47 PM on March 7. Reading it as 3:47 AM would wreck your timeline.',ap:'The badge server stores Unix time: 1772941650 seconds after 1970-01-01 UTC = 03:47:30 UTC on March 8 = 8:47:30 PM MST.'},focus:s=>s.vis.L&&[s.vis.L.detail,s.vis.L.timeline],speed:1,pause:true,setup(sim){selectCard(sim,3);placeCard(sim,3,msToAt(CARDS[3].ms));sim._guard=true;BioLab.setValues(sim,{at:sim.st.place[3]});sim._guard=false;}},
    {title:'An edited photo',text:'Hale’s alibi photo says 9:15 PM at the diner, but its Software tag names a photo editor and it was modified two days later. Metadata can be edited, so mark it unreliable.',focus:s=>s.vis.L&&[s.vis.L.photo,s.vis.L.exif],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'exif',item:'photo2'});}},
    {lvl:'honors',title:'Modified before created',text:'A manual on Hale’s laptop was modified on Feb 20 but created on Mar 9. Copying makes a new file with a new Created time and keeps the old Modified time: a copy artifact, not tampering.',focus:s=>s.vis.L&&[s.vis.L.mac,s.vis.L.note],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'exif',item:'file'});}},
    {lvl:'ap',title:'Daylight saving traps',text:'At 2:00 AM on March 8, 2026, Mountain time jumps to 3:00 AM. A doorbell log reading 2:30 AM that night means the device ignores daylight saving, so the real time was 3:30 AM MDT.',focus:s=>s.vis.L&&[s.vis.L.jump,s.vis.L.note],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'exif',item:'door'});}},
    {title:'Build the whole timeline',text:'Here is the finished timeline. Phone, badge and camera put Hale at the school from 8:44 to 9:08 PM, inside the theft window. The alibi fails.',focus:s=>s.vis.L&&s.vis.L.lanes,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case'});sim.def.actions.find(a=>a.id==='solve').run(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'case'});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.after)ch.after(sim);}},
  challenges:[
    {lvl:'bio',instant:true,q:'Hale’s second photo says 9:15 PM at the diner. Its Software tag names a photo editor, and the file was changed two days later. How should you treat it?',choices:['As proof he was at the diner at 9:15','As unreliable: an editor can change the date and GPS fields','As proof the photo is fake'],correct:1,set:{mode:'exif',item:'photo2'},
     explain:'Edited metadata is not proof either way. The photo might be real, but its fields could have been changed, so it cannot carry the alibi. Investigators would ask for the original file from the phone.'},
    {lvl:'bio',instant:true,q:'Where was Hale’s phone at 8:44 PM?',choices:['At Lakeside Diner','Joining the school Wi-Fi at Pinecrest Academy','There is no record'],correct:1,set:{mode:'case'},after(sim){selectCard(sim,2);placeCard(sim,2,msToAt(CARDS[2].ms));},
     explain:'The school Wi-Fi log shows Hale’s phone joining the guest network at 8:44 PM. Card 3 is now on the timeline. A phone can be lent out, so look for other records that agree.'},
    {lvl:'bio',instant:true,q:'With every card placed correctly, does the evidence support Hale’s alibi?',choices:['Yes, the photos show he was at the diner','No, his phone, badge and the hall camera put him at school during the theft window','The evidence cannot tell'],correct:1,set:{mode:'case'},after(sim){sim.def.actions.find(a=>a.id==='solve').run(sim);},
     explain:'The finished timeline is now on the stage. He was at the diner until about 8:32 PM, then three separate school systems record him from 8:44 to 9:08 PM. Only the edited photo supports the alibi.'},
    {lvl:'honors',instant:true,q:'The badge server logged 2026-03-08T03:47:30Z (UTC). Colorado is on MST, UTC−07:00. When did the door open in Colorado?',choices:['3:47 AM on March 8','8:47 PM on March 7','10:47 AM on March 8'],correct:1,set:{mode:'convert',zin:'UTC',csrc:'date'},after(sim){sim.st.dt='2026-03-08 03:47:30';},
     explain:'Subtract 7 hours: 03:47 on March 8 becomes 20:47, which is 8:47 PM on March 7. The converter now shows that instant on four clocks.'},
    {lvl:'honors',instant:true,q:'The hall camera’s DVR says 22:49, but its clock was set to Eastern time (UTC−05:00) and never changed. When did the motion happen in Colorado?',choices:['10:49 PM','8:49 PM','12:49 AM'],correct:1,set:{mode:'convert',zin:'ET',csrc:'date'},after(sim){sim.st.dt='2026-03-07 22:49:02';},
     explain:'Eastern time is 2 hours ahead of Mountain time, so 22:49 ET is 20:49 MT: 8:49 PM, two minutes after Hale’s badge opened the lab door.'},
    {lvl:'honors',instant:true,q:'controller_manual.pdf on Hale’s laptop was modified on Feb 20 but created on Mar 9. Does that prove someone faked the timestamps?',choices:['Yes, a file cannot be modified before it exists','No, copying a file gives it a new Created time but keeps its Modified time'],correct:1,set:{mode:'exif',item:'file'},
     explain:'This is a normal copy artifact. It tells you the file arrived on the laptop on March 9, which is itself useful: two days after the controller went missing.'},
    {lvl:'ap',instant:true,q:'A badge record reads ts = 1772941650 (Unix time). Which instant is it?',choices:['2026-03-08 03:47:30 UTC','2026-03-07 03:47:30 UTC','2026-03-08 03:47:30 in Colorado'],correct:0,set:{mode:'convert',csrc:'unix'},after(sim){sim.st.unixIn='1772941650';},
     explain:'Unix time counts seconds since 1970-01-01 00:00:00 UTC, so it is always UTC. 1,772,941,650 s ÷ 86,400 = 20,519 days plus 13,650 s, landing on March 8, 2026 at 03:47:30 UTC: 8:47:30 PM MST on March 7.'},
    {lvl:'ap',instant:true,q:'Hale’s doorbell (set to Mountain time) logged the front door at 02:30:14 on March 8, 2026. What is wrong with that time?',choices:['Nothing, it is a normal time','That time never happened in Mountain time: clocks jumped from 2:00 to 3:00 AM','It happened twice because clocks fell back'],correct:1,set:{mode:'convert',zin:'MT',csrc:'date'},after(sim){sim.st.dt=DOOR_LOCAL;},
     explain:'Spring forward skips 2:00 to 2:59 AM. The converter flags the time as impossible. The doorbell must ignore daylight saving, so the real time was 3:30 AM MDT.'},
    {lvl:'ap',instant:true,q:'Some old systems store Unix time in a signed 32-bit integer. When does that counter run out?',choices:['January 19, 2038','December 31, 1999','It never runs out'],correct:0,set:{mode:'convert',csrc:'unix'},after(sim){sim.st.unixIn='2147483647';},
     explain:'2³¹ − 1 = 2,147,483,647 seconds after 1970 is 03:14:07 UTC on Jan 19, 2038. One second later a signed 32-bit counter wraps to a negative number (1901). Examiners must know how each system stores time.'}
  ],
  lab:{bio:'<p><b>Question:</b> Does the evidence support Hale’s alibi?</p><ol><li>Select each evidence card and read its record.</li><li>Drag it to the time it happened (or use the slider). Mark any record you cannot trust as unreliable.</li><li>Choose your verdict and press Check my timeline. Record a trial.</li></ol><p>Write a paragraph for the detective: where was Hale’s phone from 8:30 to 9:30 PM, and how do you know?</p>',
       honors:'<p><b>Question:</b> How do time zones and device clocks change a timeline?</p><ol><li>For each card, write the raw time, the clock it uses (local, UTC, Eastern) and the converted Colorado time.</li><li>Check your conversions in Try it yourself, then place the cards.</li><li>In Inspect the evidence, explain the edited photo and the copied manual.</li></ol><p>List the two records that would have misled you most if you had not converted them, and why.</p>',
       ap:'<p><b>Question:</b> Can you build a timeline from raw machine data?</p><ol><li>Convert both Unix badge timestamps by hand (seconds ÷ 86,400 for days since 1970). Check with the converter.</li><li>Find the impossible doorbell time and correct it.</li><li>Calculate the minimum travel time from the diner to the school (3.2 km at 50 km/h) and check it fits between cards 2 and 3.</li></ol><p><b>Claim–evidence–reasoning:</b> Argue whether the alibi fails, ranking each record by reliability.</p>'},
  terms:[{t:'Metadata',d:'Data about data: when, where and how a file was made, stored with or alongside it.'},{t:'Timeline',d:'All the evidence put in time order on one clock, so you can see what happened when.'},{t:'Alibi',d:'A claim that a person was somewhere else when the event happened.'},{t:'EXIF',d:'The standard for metadata stored inside photos: date, camera, settings and GPS.'},
    {lvl:'honors',t:'UTC',d:'Coordinated Universal Time, the world reference clock. Servers often log in UTC.'},{lvl:'honors',t:'Time zone offset',d:'How far a local clock is from UTC, like −07:00 for Mountain Standard Time.'},{lvl:'honors',t:'MAC times',d:'A file’s Modified, Accessed and Created (or Changed) times, kept by the file system.'},{lvl:'honors',t:'Copy artifact',d:'A pattern that copying leaves behind, such as a Created time later than the Modified time.'},
    {lvl:'ap',t:'Unix timestamp',d:'Seconds since 00:00:00 UTC on January 1, 1970.'},{lvl:'ap',t:'Daylight saving time',d:'In most of the US, clocks move ahead one hour in March and back one hour in November, so some local times are skipped or repeated.'},{lvl:'ap',t:'Year 2038 problem',d:'A signed 32-bit Unix time counter overflows at 03:14:07 UTC on January 19, 2038.'}],
  about:'<p>The case, people, school, diner, town, devices and coordinates are invented. Time conversions are computed in the page with the US daylight saving rules in force since 2007 (second Sunday in March to first Sunday in November, at 2:00 AM local time); March 8 and November 1 are the 2026 change dates. Unix timestamps are exact.</p><p>Simplifications: real EXIF stores GPS as degree, minute and second fractions and may hold many more tags; real logs are longer and messier; MAC-time behavior differs between file systems and operating systems (some update accessed times rarely or never). Distances use the haversine formula on a sphere. A card counts as placed correctly within 4 minutes of the true time.</p>',
  onClick(sim,x,y){if(sim.p.mode!=='case')return;if(sim._dragT&&performance.now()-sim._dragT<350)return;const k=sim.vis.k||1,hit=hitCard(sim,x,y,k);
    if(hit!=null){selectCard(sim,hit);return;}const g=geoT(k);if(x>=g.X0&&x<=g.X0+g.TW&&y>=g.LT&&y<=g.LT+LANES.length*g.LH){const v=Math.round((x-g.X0)/g.TW*120);placeCard(sim,Math.round(sim.p.card),v);sim._guard=true;BioLab.setValues(sim,{at:v});sim._guard=false;setAtOut(sim);}},
  initVis(sim){sim.vis.L={};const cv=sim.ui&&sim.ui.stage;if(!cv||cv._mdDrag)return;cv._mdDrag=1;
    const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
    cv.addEventListener('pointerdown',e=>{if(sim.p.mode!=='case')return;const [x,y]=pos(e),hit=hitCard(sim,x,y,sim.vis.k||1);if(hit==null)return;sim._drag=hit;selectCard(sim,hit);try{cv.setPointerCapture(e.pointerId);}catch(err){}e.preventDefault();});
    cv.addEventListener('pointermove',e=>{if(sim._drag==null)return;const [x]=pos(e),g=geoT(sim.vis.k||1),v=clamp(Math.round((x-g.X0)/g.TW*120),0,120);placeCard(sim,sim._drag,v);sim._guard=true;BioLab.setValues(sim,{at:v});sim._guard=false;setAtOut(sim);sim.infoDirty=true;});
    const up=()=>{if(sim._drag!=null){sim._drag=null;sim._dragT=performance.now();sim.infoDirty=true;}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    cv.style.touchAction='none';setAtOut(sim);},
  draw(sim,ctx,vdt,k){sim.vis.k=k;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,W,H);const m=sim.p.mode;if(m==='exif')drawExif(sim,ctx,k);else if(m==='convert')drawConvert(sim,ctx,k);else drawCase(sim,ctx,k);},
  thumbSetup(sim){[0,1,2,3].forEach(i=>{sim.st.place[i]=msToAt(CARDS[i].ms);});}
};
function hitCard(sim,x,y,k){for(let i=CARDS.length-1;i>=0;i--){const q=chipGeo(sim,i,k);if(q&&Math.abs(x-q.x)<=q.w/2+3&&Math.abs(y-q.y)<=q.h/2+3)return i;}
  if(k<=1.3)for(let i=0;i<CARDS.length;i++){const q=trayGeo(i);if(x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h)return i;}return null;}
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();

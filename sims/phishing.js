(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,lvText}=BioLab.h;
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,monospace';
const H=600;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- domains: who really owns a host ----------
   In this lab, example.com, example.org and example.net act like top-level domains, so the owner is the label just before them.
   Everything else uses the last two labels (real tools use the Public Suffix List). */
const BRANDS={'pinecrest.example.com':'Pinecrest Credit Union (fictional)','bramblewood.example.org':'Bramblewood Academy (fictional)','velvetfern.example.com':'Velvetfern Video (fictional)','parcelwhisk.example.com':'Parcelwhisk Delivery (fictional)','thistledown.example.com':'Thistledown Pet Supply (fictional)'};
const FREEMAIL=['freemail.test'],SHORTENERS=['tinylink.test','shrt.test'];
function ownerOf(host){host=(host||'').toLowerCase().replace(/\.$/,'');if(/^\d+\.\d+\.\d+\.\d+$/.test(host))return host;const L=host.split('.');
  if(L.length>=3&&L[L.length-2]==='example'&&['com','org','net'].includes(L[L.length-1]))return L.slice(-3).join('.');return L.slice(-2).join('.');}
function domainOf(addr){const m=String(addr).match(/@([^>\s]+)/);return m?m[1].toLowerCase():'';}
function punyDecode(label){ // RFC 3492 decode of a label without its xn-- prefix
  const base=36,tmin=1,tmax=26,skew=38,damp=700;let n=128,i=0,bias=72;const out=[];let b=label.lastIndexOf('-');if(b<0)b=0;
  for(let j=0;j<b;j++)out.push(label.charCodeAt(j));
  const adapt=(delta,num,first)=>{delta=first?Math.floor(delta/damp):delta>>1;delta+=Math.floor(delta/num);let k=0;while(delta>((base-tmin)*tmax)>>1){delta=Math.floor(delta/(base-tmin));k+=base;}return k+Math.floor((base-tmin+1)*delta/(delta+skew));};
  for(let idx=b>0?b+1:0;idx<label.length;){const oldi=i;let w=1;for(let k=base;;k+=base){if(idx>=label.length)return null;const c=label.charCodeAt(idx++);const d=c-48<10?c-22:c-65<26?c-65:c-97<26?c-97:base;if(d>=base)return null;i+=d*w;const t=k<=bias?tmin:k>=bias+tmax?tmax:k-bias;if(d<t)break;w*=base-t;}
    bias=adapt(i-oldi,out.length+1,oldi===0);n+=Math.floor(i/(out.length+1));i%=out.length+1;out.splice(i,0,n);i++;}
  try{return String.fromCodePoint(...out);}catch(e){return null;}}
const CONFUSE=[['rn','m'],['vv','w'],['cl','d'],['0','o'],['1','l'],['l','i'],['5','s'],['3','e'],['4','a']];
function skeleton(s){let t=s.toLowerCase();CONFUSE.forEach(([a,b])=>{t=t.split(a).join(b);});return t.replace(/i/g,'l');}
function editDist(a,b){const m=a.length,n=b.length,d=[];for(let i=0;i<=m;i++){d[i]=[i];}for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n];}
function lookalike(owner){const lab=owner.split('.')[0];for(const b in BRANDS){if(owner===b)return null;const bl=b.split('.')[0];
    if(lab===bl)continue;
    if(skeleton(lab)===skeleton(bl)){const pair=CONFUSE.find(([x,y])=>lab.includes(x)&&bl.includes(y)&&lab.split(x).join(y)===bl);return {brand:b,how:pair?'“'+pair[0]+'” instead of “'+pair[1]+'”':'look-alike letters'};}
    if(editDist(lab,bl)===1&&bl.length>5)return {brand:b,how:'one letter different'};}
  return null;}
function brandInHost(host,owner){const sub=host.slice(0,Math.max(0,host.length-owner.length));for(const b in BRANDS){const bl=b.split('.')[0];if(sub.includes(bl)||(owner!==b&&owner.split('.')[0].includes(bl)&&owner.split('.')[0]!==bl))return b;}return null;}

/* ---------- link inspector: plain parsing, never fetched ---------- */
function inspectLink(text,href,from){const R={ok:true,parts:[],flags:[],owner:'',host:'',red:0,warn:0};href=(href||'').trim();text=(text||'').trim();
  const add=(lvl,msg)=>{R.flags.push({lvl,msg});if(lvl==='red')R.red++;else if(lvl==='warn')R.warn++;};
  if(from&&from.trim()){const addr=(from.match(/<([^>]+)>/)||[null,from.trim()])[1],dom=domainOf(addr.includes('@')?addr:'@'+addr),name=from.replace(/<[^>]*>/,'').replace(/"/g,'').trim().toLowerCase(),fo=ownerOf(dom);
    if(dom){const claimed=Object.keys(BRANDS).find(b=>name.includes(b.split('.')[0]));
      if(FREEMAIL.includes(fo))add('warn','The sender uses a free email account ('+fo+'). Real organizations send from their own domain.');
      if(claimed&&fo!==claimed)add('red','The name says '+claimed.split('.')[0]+' but the address belongs to '+fo+'. Anyone can type any display name.');
      else if(claimed)add('good','The sender’s address belongs to '+claimed+'. (Headers can still reveal a forged From line.)');}}
  if(!href){R.ok=false;add('warn','Type or paste the link target to inspect it.');return R;}
  let u=null;try{u=new URL(/^[a-z][a-z0-9+.-]*:/i.test(href)?href:'http://'+href);}catch(e){u=null;}
  if(!u||!u.hostname){R.ok=false;add('warn','That does not look like a web address.');return R;}
  const host=u.hostname.toLowerCase(),owner=ownerOf(host);R.host=host;R.owner=owner;
  const at=href.indexOf('@'),proto=href.indexOf('//');const rawUser=u.username?decodeURIComponent(u.username):'';
  R.parts.push({k:'scheme',s:u.protocol+'//'});if(rawUser)R.parts.push({k:'user',s:rawUser+(u.password?':'+u.password:'')+'@'});
  if(host!==owner)R.parts.push({k:'sub',s:host.slice(0,host.length-owner.length)});R.parts.push({k:'owner',s:owner});if(u.port)R.parts.push({k:'path',s:':'+u.port});
  const rest=u.pathname+(u.search||'')+(u.hash||'');if(rest&&rest!=='/')R.parts.push({k:'path',s:rest});
  if(u.protocol==='http:')add('warn','No https: anything typed on this page travels unencrypted.');else if(u.protocol==='https:')add('info','https only means the connection is encrypted. Scammers get https certificates too.');
  if(rawUser)add('red','Everything before the @ is ignored. The browser really goes to '+host+'.');
  if(/^\d+\.\d+\.\d+\.\d+$/.test(host))add('red','The site is a bare number (IP address), not a name. Real organizations use their domain.');
  const pl=host.split('.').find(l=>l.startsWith('xn--'));if(pl){const dec=punyDecode(pl.slice(4));add('red','“'+pl+'” is punycode. It displays as “'+(dec||'?')+'”, which mixes in a letter from another alphabet.');R.puny=dec;}
  const la=lookalike(pl&&R.puny?owner.replace(pl,R.puny.normalize('NFKD').replace(/[^\x00-\x7f]/g,'a')):owner),bi=brandInHost(host,owner);
  if(BRANDS[owner])add('good','The owner domain '+owner+' belongs to '+BRANDS[owner]+'.');
  else if(la)add('red','Look-alike of '+la.brand+': '+la.how+'.');
  else if(bi)add('red','“'+bi.split('.')[0]+'” appears only in the wrong place. The site is owned by '+owner+', which anyone can register.');
  else if(SHORTENERS.includes(owner))add('warn','A link shortener hides the real destination. Preview it before clicking.');
  else add('info','The owner domain is '+owner+'. Is that who you expect?');
  const m=text.toLowerCase().match(/([a-z0-9-]+\.)+[a-z]{2,}/);
  if(m){const to=ownerOf(m[0]);if(to!==owner)add('red','The link text shows '+to+' but the link goes to '+owner+'.');else add('good','The link text matches where it goes.');}
  else if(text)add('warn','The link text does not show where it goes. Hover or long-press to see the real address.');
  return R;}
const LINKEX={
  own:{l:'My own (type below the stage)',t:'',h:'',f:''},
  sub:{l:'Brand name in the wrong place',t:'pinecrest.example.com/verify',h:'http://pinecrest.example.com.account-verify.test/login',f:'Pinecrest Credit Union (fictional) <security@pinecrest-alerts.test>'},
  rn:{l:'Look-alike letters (rn)',t:'bramblewood.example.org/login',h:'https://brarnblewood.example.org/sso/login',f:'IT Help Desk <helpdesk@brarnblewood.example.org>'},
  at:{l:'The @ trick',t:'velvetfern.example.com/billing',h:'http://velvetfern.example.com@billing-update.test/pay',f:'Velvetfern Video (fictional) <billing@velvetfern-billing.test>'},
  ip:{l:'Number instead of a name',t:'Pinecrest secure sign-in',h:'http://203.0.113.9/pinecrest/login',f:''},
  puny:{l:'Letter from another alphabet',t:'parcelwhisk.example.com/track',h:'https://xn--prcelwhisk-zqi.example.com/track',f:'Parcelwhisk Delivery (fictional) <noreply@parcelwhisk.example.com>'},
  https:{l:'Padlock but phishing',t:'Confirm your account',h:'https://pinecrest-secure-login.test/verify',f:'Pinecrest Credit Union (fictional) <alerts@pinecrest-secure-login.test>'},
  short:{l:'Shortened link',t:'See your package',h:'https://tinylink.test/a8Xk2',f:''},
  ok:{l:'A legitimate link',t:'pinecrest.example.com/statements',h:'https://pinecrest.example.com/statements',f:'Pinecrest Credit Union (fictional) <alerts@pinecrest.example.com>'}};

/* ---------- the inbox (all fictional) ---------- */
const ME='Jordan Avery <javery@bramblewood.example.org>';
const AUTH=(s,d,m,dom)=>({spf:s,dkim:d,dmarc:m,dom});
const EMAILS=[
  {id:'e1',fromName:'Pinecrest Credit Union (fictional)',from:'alerts@pinecrest.example.com',subject:'Your October statement is ready',date:'Mon 8:02 AM',greet:'Hi Jordan,',
   body:['Your monthly statement for the account ending in 4417 is ready to view.','Sign in through our app or by typing our address into your browser. We will never ask for your password by email.'],
   links:[{t:'pinecrest.example.com/statements',h:'https://pinecrest.example.com/statements'}],att:[],phish:false,clues:[],hot:[],
   hdr:{ip:'198.51.100.21',relay:'mail.pinecrest.example.com',auth:AUTH('pass','pass','pass','pinecrest.example.com')},
   why:{from:'The address is at pinecrest.example.com, the credit union’s real domain.',greet:'It uses your name.',body:'Calm, no deadline, and it reminds you it will never ask for your password.',link0:'The link text matches the real target, which is owned by pinecrest.example.com.',headers:'SPF, DKIM and DMARC all pass for pinecrest.example.com.'},
   sum:'Legitimate. Real domain, your name, no pressure, and the link goes where it says. Even so, typing the address yourself is a good habit.'},
  {id:'e2',fromName:'Pinecrest Credit Union (fictional)',from:'security@pinecrest-alerts.test',reply:'verify.team@freemail.test',subject:'URGENT: Your account will be suspended in 24 hours',date:'Mon 8:47 AM',greet:'Dear Valued Customer,',
   body:['We detected unusual activity on your account. To avoid permanent suspension, you must confirm your identity within 24 hours.','Confirm your username and password using the secure link below. Failure to act will result in loss of access.'],
   links:[{t:'pinecrest.example.com/verify',h:'http://pinecrest.example.com.account-verify.test/login'}],att:[],phish:true,clues:['from','reply','greet','body','link0'],hot:['urgent','24','hours','permanent','suspension','must','password','failure','loss'],
   hdr:{ip:'192.0.2.44',relay:'mx.pinecrest-alerts.test',auth:AUTH('pass','none','none','pinecrest-alerts.test')},
   why:{from:'pinecrest-alerts.test is not pinecrest.example.com. Anyone can register a name that sounds official.',reply:'Replies go to a free email account, not to the bank.',greet:'A generic greeting: the sender does not know your name.',body:'A 24-hour deadline, a threat, and a request for your password. Real banks never ask for passwords by email.',
     link0:'The text shows pinecrest.example.com, but the link goes to account-verify.test. “pinecrest.example.com” is only a subdomain there.',headers:'SPF passes only for pinecrest-alerts.test, the scammer’s own domain. There is no DKIM signature from the bank.'},
   sum:'Phishing. Fake sender domain, replies to a free account, a deadline and a threat, a request for your password, and a link to account-verify.test.'},
  {id:'e3',fromName:'Ms. Okafor-Reyes (fictional)',from:'okafor-reyes@bramblewood.example.org',subject:'Lab 6 rubric and data table',date:'Mon 9:15 AM',greet:'Hi Chem period 3,',
   body:['Attached is the rubric for Lab 6 (calorimetry). Bring your data table to class on Wednesday.','Questions? Reply here or ask me in class.'],links:[],att:[{n:'Lab6_Rubric.pdf'}],phish:false,clues:[],hot:[],
   hdr:{ip:'198.51.100.30',relay:'mail.bramblewood.example.org',auth:AUTH('pass','pass','pass','bramblewood.example.org')},
   why:{from:'A teacher’s address at the school’s real domain.',greet:'Addressed to your class.',body:'Expected content about a lab you are doing, no pressure.',att0:'A plain .pdf you were expecting from your teacher.',headers:'SPF, DKIM and DMARC all pass for bramblewood.example.org.'},
   sum:'Legitimate. Expected message from a known teacher at the real school domain, with an ordinary PDF.'},
  {id:'e4',fromName:'Bramblewood IT Help Desk',from:'helpdesk@bramb1ewood.example.org',subject:'Mailbox full: messages will be deleted today',date:'Mon 10:03 AM',greet:'Dear user,',
   body:['Your mailbox is 98% full. Messages over the limit will be deleted at 5:00 PM today.','Click below and sign in to upgrade your storage for free.'],
   links:[{t:'Upgrade my mailbox',h:'https://bramb1ewood.example.org/mail-upgrade'}],att:[],phish:true,clues:['from','greet','body','link0'],hot:['deleted','5:00','today','sign','in'],
   hdr:{ip:'203.0.113.58',relay:'smtp.bramb1ewood.example.org',auth:AUTH('pass','pass','pass','bramb1ewood.example.org')},
   why:{from:'bramb1ewood uses the digit 1 instead of the letter l. A look-alike domain.',greet:'IT staff would use your name or account.',body:'A same-day deadline and a request to sign in through a link.',link0:'The text hides the destination, and it goes to the look-alike bramb1ewood.example.org.',headers:'Everything passes, but for bramb1ewood.example.org. Authentication proves who sent it, not that they are honest.'},
   sum:'Phishing. A look-alike domain (1 for l), a deadline, and a sign-in link that leads to the fake domain.'},
  {id:'e5',fromName:'Parcelwhisk Delivery (fictional)',from:'noreply@parcelwhisk-delivery.test',subject:'We missed you: delivery label attached',date:'Mon 11:20 AM',greet:'Hello,',
   body:['We tried to deliver your package today but no one was home.','Print the attached label and bring it to your nearest pickup point within 2 days or the package returns to sender.'],links:[],att:[{n:'Delivery_Label.pdf.exe'}],phish:true,clues:['from','greet','body','att0'],hot:['2','days','returns'],
   hdr:{ip:'192.0.2.91',relay:'mail.parcelwhisk-delivery.test',auth:AUTH('softfail','none','none','parcelwhisk-delivery.test')},
   why:{from:'parcelwhisk-delivery.test is not parcelwhisk.example.com.',greet:'No name: a real delivery notice usually has your name and a tracking number.',body:'A package you did not expect, with a deadline.',att0:'“.pdf.exe” is a program pretending to be a PDF. Opening it would run it.',headers:'SPF softfail and no DKIM or DMARC.'},
   sum:'Phishing. Fake domain, no tracking number, a deadline, and a program (.exe) disguised as a PDF.'},
  {id:'e6',fromName:'Bramblewood Student Council',from:'council@bramblewood.example.org',subject:'Club fair sign-ups open Friday',date:'Mon 12:30 PM',greet:'Hi everyone,',
   body:['Want to start or join a club? The sign-up form opens Friday at 3:00 PM.','Every club gets a table at the fair on the 14th.'],links:[{t:'forms.bramblewood.example.org/clubfair',h:'https://forms.bramblewood.example.org/clubfair'}],att:[],phish:false,clues:[],hot:[],
   hdr:{ip:'198.51.100.30',relay:'mail.bramblewood.example.org',auth:AUTH('pass','pass','pass','bramblewood.example.org')},
   why:{from:'The school’s real domain.',greet:'A generic greeting is normal for a message to the whole school. One weak clue is not proof.',body:'Ordinary school news, no pressure, no request for passwords or money.',link0:'Goes to forms.bramblewood.example.org, a subdomain the school owns.',headers:'All pass for bramblewood.example.org.'},
   sum:'Legitimate. The generic greeting is fine for a whole-school message; everything else checks out.'},
  {id:'e7',fromName:'Dr. Imogen Hartwell',from:'hartwell.bramblewood@freemail.test',subject:'Quick favor (keep this between us)',date:'Mon 1:05 PM',greet:'Jordan,',
   body:['Are you on campus? I need you to pick up four $50 gift cards for a staff surprise. I am in meetings all day so I can’t talk on the phone.','Scratch off the codes and email me photos of them. I will pay you back tomorrow. Please keep this quiet.'],links:[],att:[],phish:true,clues:['from','body'],hot:['gift','cards','can’t','talk','codes','photos','quiet'],
   hdr:{ip:'203.0.113.12',relay:'out.freemail.test',auth:AUTH('pass','pass','pass','freemail.test')},
   why:{from:'The principal’s name on a free email account. The real principal writes from bramblewood.example.org.',greet:'Using your first name makes it feel personal; scammers look names up.',body:'Gift cards, secrecy, “can’t talk on the phone” and a rush. Classic gift-card scam.',headers:'All pass, for freemail.test. Anyone can open a free account.'},
   sum:'Phishing with no link at all: an impersonated principal on a free account asking for gift card codes and secrecy. Check by calling or asking in person.'},
  {id:'e8',fromName:'Pinecrest Credit Union (fictional)',from:'alerts@pinecrest.example.com',subject:'New sign-in to your account',date:'Mon 3:40 PM',greet:'Hi Jordan,',
   body:['We noticed a new sign-in to your account from a web browser on a Windows computer, today at 3:38 PM.','If this was you, you don’t need to do anything. If not, open the Pinecrest app or call the number on the back of your card.'],links:[],att:[],phish:false,clues:[],hot:[],
   hdr:{ip:'198.51.100.21',relay:'mail.pinecrest.example.com',auth:AUTH('pass','pass','pass','pinecrest.example.com')},
   why:{from:'The real pinecrest.example.com domain.',greet:'Uses your name.',body:'It alerts you but sends you to the app or the number on your card, not to a link. That is what real alerts do.',headers:'All pass for pinecrest.example.com.'},
   sum:'Legitimate. A security alert can sound scary, but this one has no link and tells you to use the app or call the number you already have.'},
  {id:'e9',fromName:'Velvetfern Video (fictional)',from:'billing@velvetfern-billing.test',subject:'Payment declined: update your card',date:'Mon 5:12 PM',greet:'Dear Member,',
   body:['Your last payment was declined and your membership will be canceled tonight.','Update your card details now to keep watching.'],links:[{t:'velvetfern.example.com/billing',h:'http://velvetfern.example.com@billing-update.test/pay'}],att:[],phish:true,clues:['from','greet','body','link0'],hot:['declined','canceled','tonight','card','now'],
   hdr:{ip:'192.0.2.77',relay:'mx.velvetfern-billing.test',auth:AUTH('pass','none','none','velvetfern-billing.test')},
   why:{from:'velvetfern-billing.test is not velvetfern.example.com.',greet:'Generic greeting.',body:'A same-night deadline and a request for card details.',link0:'The @ trick: the browser ignores everything before @ and goes to billing-update.test.',headers:'SPF passes only for the scammer’s velvetfern-billing.test.'},
   sum:'Phishing. Fake sender domain, a deadline, a request for card details, and a link that uses the @ trick to reach billing-update.test.'},
  {id:'e10',fromName:'Bramblewood Library',from:'library@bramblewood.example.org',subject:'Your library account will be closed',date:'Mon 6:30 PM',greet:'Dear student,',
   body:['Our records show unreturned items. Your library account and school email will be closed tonight unless you verify your login.'],links:[{t:'library.bramblewood.example.org',h:'https://bramblewood-library.test/verify'}],att:[],phish:true,clues:['greet','body','link0','headers'],neutral:['from'],hot:['closed','tonight','verify','login'],
   hdr:{ip:'203.0.113.200',relay:'unknown-host.test',auth:AUTH('fail','none','fail','bramblewood.example.org')},
   why:{from:'The From line shows the real school domain, but a From line can be forged. Only the headers can tell.',greet:'Generic greeting.',body:'A threat to close your school email tonight and a request to “verify your login”.',link0:'The text shows library.bramblewood.example.org, but the link goes to bramblewood-library.test.',
     headers:'SPF fail and DMARC fail: the message came from a server the school never authorized, so the From line is forged.'},
   sum:'Phishing with a forged From line. The link goes to bramblewood-library.test, and at Deep dive the headers show SPF and DMARC failing.'}];
const PARTNAME={from:'From address',reply:'Reply-To address',greet:'Greeting',body:'Message wording',headers:'Message headers'};
function partsOf(e){const p=['from'];if(e.reply)p.push('reply');p.push('greet','body');e.links.forEach((l,i)=>p.push('link'+i));e.att.forEach((a,i)=>p.push('att'+i));if(atLeast('ap'))p.push('headers');return p;}
function partLabel(e,id){if(id.startsWith('link'))return 'Link: “'+e.links[+id.slice(4)].t+'”';if(id.startsWith('att'))return 'Attachment: '+e.att[+id.slice(3)].n;return PARTNAME[id];}
function cluesAt(e){return e.clues.filter(c=>c!=='headers'||atLeast('ap'));}
function inspectText(e,id){if(id==='from')return 'Display name: '+e.fromName+'. Real address: '+e.from+'. Domain: '+domainOf(e.from)+'.';
  if(id==='reply')return 'If you press Reply, your answer goes to '+e.reply+', not to '+e.from+'.';
  if(id==='greet')return 'Greeting: “'+e.greet+'”. Does the sender know your name?';
  if(id==='body')return 'Highlighted words show pressure, threats, secrecy, or requests for passwords, codes or money.';
  if(id==='headers'){const a=e.hdr.auth;return 'Authentication-Results: spf='+a.spf+', dkim='+a.dkim+', dmarc='+a.dmarc+' (for '+a.dom+'). Sent from '+e.hdr.relay+' ['+e.hdr.ip+'].';}
  if(id.startsWith('link')){const l=e.links[+id.slice(4)];return 'Shown: '+l.t+'  →  Really goes to: '+l.h+'  (owner: '+ownerOf(new URL(l.h).hostname)+')';}
  if(id.startsWith('att')){const n=e.att[+id.slice(3)].n,ext=n.split('.').pop().toLowerCase();return 'File name: '+n+'. The real type is the last extension: .'+ext+(['exe','scr','js','bat','com','vbs'].includes(ext)?', a program that runs when opened.':', a document.');}
  return '';}

function hintFor(id){if(id==='from')return 'The sender chooses the display name, so only the <b>domain after the @</b> tells you who really sent it. Does it match the organization?';
  if(id==='reply')return 'A Reply-To that differs from the sender sends your answer somewhere else, often a free account the scammer controls.';
  if(id==='greet')return 'Real organizations usually know your name. A generic greeting is a weak clue on its own.';
  if(id==='body')return 'Scammers <b>rush you</b>: deadlines, threats, secrecy, and requests for passwords, codes or money.';
  if(id==='headers')return 'SPF, DKIM and DMARC show <b>which domain</b> the message is really from and whether the From line was forged.';
  if(id.startsWith('link'))return 'Compare the text with where the link really goes. The <b>owner domain</b> is the name just before the first single slash.';
  if(id.startsWith('att'))return 'Only the <b>last extension</b> sets a file’s type. .exe, .scr and .js files are programs.';return '';}
/* ---------- the investigation (fictional) ---------- */
const CASE={who:'Mr. Tobias Quill (fictional), chemistry teacher',addr:'tquill@bramblewood.example.org'};
const CEM=[
  {id:'c1',t:8*60+5,fromName:'Bramblewood Library',from:'library@bramblewood.example.org',subject:'Overdue: Lab Safety Handbook',date:'Tue 8:05 AM',greet:'Hi Mr. Quill,',body:['The Lab Safety Handbook you borrowed is 3 days overdue. You can renew it online.'],links:[{t:'library.bramblewood.example.org/account',h:'https://library.bramblewood.example.org/account'}],att:[],hot:[]},
  {id:'c2',t:8*60+41,fromName:'Parcelwhisk Delivery (fictional)',from:'noreply@parcelwhisk-delivery.test',subject:'Delivery failed: label attached',date:'Tue 8:41 AM',greet:'Hello,',body:['We could not deliver your package. Print the attached label within 2 days.'],links:[],att:[{n:'Label_8812.pdf.exe'}],hot:['2','days']},
  {id:'c3',t:9*60+2,fromName:'IT Help Desk',from:'helpdesk@brarnblewood.example.org',subject:'Your password expires today',date:'Tue 9:02 AM',greet:'Dear staff member,',body:['Your Bramblewood password expires at noon today. Keep your current password by confirming it below.'],links:[{t:'bramblewood.example.org/password',h:'https://brarnblewood.example.org/sso/login'}],att:[],hot:['expires','noon','today','confirming']},
  {id:'c4',t:9*60+30,fromName:'Dr. Imogen Hartwell',from:'hartwell.bramblewood@freemail.test',subject:'Quick favor',date:'Tue 9:30 AM',greet:'Tobias,',body:['Can you buy four $50 gift cards for a staff surprise and email me the codes? Keep it quiet.'],links:[],att:[],hot:['gift','cards','codes','quiet']},
  {id:'c5',t:9*60+47,fromName:'Velvetfern Video (fictional)',from:'billing@velvetfern.example.com',subject:'Your receipt',date:'Tue 9:47 AM',greet:'Hi Tobias,',body:['Thanks for your payment. Your receipt is in your account.'],links:[{t:'velvetfern.example.com/account',h:'https://velvetfern.example.com/account'}],att:[],hot:[]}];
CEM.forEach(e=>{e.hdr={ip:'',relay:'',auth:AUTH('','','','')};});
const PROXY=[[8*60+7,'GET  https://library.bramblewood.example.org/account'],[9*60+13,'GET  https://brarnblewood.example.org/sso/login'],[9*60+14,'POST https://brarnblewood.example.org/sso/login'],[9*60+50,'GET  https://velvetfern.example.com/account']];
const SIGNIN=[[7*60+52,'sign-in OK   198.51.100.14  campus network, usual laptop'],[9*60+21,'sign-in OK   203.0.113.77   unfamiliar network, new browser'],[9*60+22,'rule created 203.0.113.77   move replies to Archive'],[10*60+42,'300 sent     203.0.113.77   “Invoice overdue” to all parents']];
const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const CASEQ=[
  {id:'q1',lvl:'bio',q:'1. Which email led to the break-in?',ch:CEM.map(e=>e.date.slice(4)+' · '+e.subject),ans:2,ok:'Correct. The 9:02 “password expires” email came from the look-alike brarnblewood.example.org (rn instead of m).'},
  {id:'q2',lvl:'bio',q:'2. Which evidence ties that email to the break-in?',ch:['It arrived before the spam went out at 10:42','The web log shows his laptop sent a form to brarnblewood.example.org at 09:14, and a stranger signed in 7 minutes later','Its link text mentions passwords'],ans:1,
   ok:'Correct. The POST at 09:14 means he typed his password into the fake page. The attacker’s first sign-in came at 09:21. Timing plus the domain makes the link.'},
  {id:'q3',lvl:'bio',q:'3. The Parcelwhisk email had a .pdf.exe attachment. Why is it a red herring here?',ch:['It was phishing, so it must be the cause','The web and sign-in logs show no download or activity linked to it; dangerous, but not what happened','Attachments are always safe'],ans:1,
   ok:'Correct. It was a phishing attempt, but no evidence connects it to the break-in. Investigators report it, then follow the evidence.'},
  {id:'q4',lvl:'honors',q:'4. Why didn’t Mr. Quill see parents replying to the spam?',ch:['Parents never reply','At 09:22 the attacker created a rule that moves replies to Archive','His mailbox was full'],ans:1,
   ok:'Correct. Attackers often add a hidden mailbox rule right after signing in, to hide replies and keep access.'},
  {id:'q5',lvl:'bio',q:'5. What should the school do first?',ch:['Delete the spam and move on','Reset his password, sign out every session, remove the rule, turn on MFA, and warn parents','Ban all email attachments'],ans:1,
   ok:'Correct. Lock the attacker out (new password, end all sessions, delete the rule), add MFA so a stolen password is not enough, and tell parents the invoice email was fake. Report the look-alike domain too.'}];
const caseSolved=st=>CASEQ.filter(q=>atLeast(q.lvl)&&st.q[q.id]===q.ans).length;

/* ---------- canvas text helpers ---------- */
function setF(ctx,s,w,f){ctx.font=(w||400)+' '+s+'px '+(f||FONT);}
function wrap(ctx,text,maxW){const out=[];String(text).split(' ').forEach(w=>{let cur=out.length?out[out.length-1]:null;const t=cur!==null?cur+' '+w:w;
    if(cur!==null&&ctx.measureText(t).width<=maxW){out[out.length-1]=t;return;}
    let piece=w;while(ctx.measureText(piece).width>maxW&&piece.length>1){let n=piece.length;while(n>1&&ctx.measureText(piece.slice(0,n)).width>maxW)n--;out.push(piece.slice(0,n));piece=piece.slice(n);}out.push(piece);});return out;}
function fit(ctx,s,maxW){if(ctx.measureText(s).width<=maxW)return s;let t=s;while(t.length>2&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);return t+'…';}

/* ---------- state ---------- */
const emState=(sim,id)=>sim.st.em[id]||(sim.st.em[id]={flags:{},dec:null});
const curEmail=sim=>EMAILS[clamp(Math.round(sim.p.msg)-1,0,EMAILS.length-1)];
function grade(sim,e){const s=emState(sim,e.id),cl=cluesAt(e),fl=Object.keys(s.flags).filter(k=>s.flags[k]);
  const found=cl.filter(c=>s.flags[c]),falseF=fl.filter(k=>!cl.includes(k)&&!(e.neutral||[]).includes(k)&&!(k==='headers'&&!atLeast('ap')));
  return {decided:s.dec!==null,right:s.dec!==null&&(s.dec==='report')===e.phish,found,missed:cl.filter(c=>!s.flags[c]),falseF};}
function totals(sim){let judged=0,right=0,found=0,clues=0,ff=0;EMAILS.forEach(e=>{const g=grade(sim,e);if(!g.decided)return;judged++;if(g.right)right++;found+=g.found.length;clues+=cluesAt(e).length;ff+=g.falseF.length;});return {judged,right,found,clues,ff};}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});
  sim.infoDirty=true;}
function onLex(sim){const L=LINKEX[sim.p.lex];if(L&&sim.p.lex!=='own'){sim.st.lt=L.t;sim.st.lh=L.h;sim.st.lf=L.f;}sim.st.lr=null;sim.infoDirty=true;}
const linkRes=sim=>sim.st.lr||(sim.st.lr=inspectLink(sim.st.lt,sim.st.lh,sim.st.lf));

const SIM={
  id:'phishing',hash:'phishing',apUnit:18,order:6,tab:'Phishing analysis',kind:'Virtual lab',prereq:['passwords'],next:['casefile'],
  card:'Inspect a fictional inbox clue by clue, decide what to report, then trace which email let an attacker into a teacher’s account.',
  title:'Phishing analysis: inspect, decide, trace',
  lede:{bio:'Real attacks often start with one email. Inspect each message in a fictional inbox, flag the clues, and decide whether to report it or trust it. Then investigate a break-in.',
        honors:'Read domains the way a browser does: find the real owner of a link, spot look-alike letters, the @ trick and brand names in the wrong place.',
        ap:'Open the message headers: follow the Received chain and read SPF, DKIM and DMARC results to tell a forged From line from an honest look-alike.'},
  scale:{bio:'One inbox of 10 fictional emails. Every person, organization and address here is made up; links are shown as text and never open.',ap:'Domains use the reserved example.com, example.org and .test names, and IP addresses come from the ranges set aside for documentation.'},
  timeless:true,animated:true,graph:false,aspect:4/3,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'inbox',lvl:'bio',noTrial:true,options:[{v:'inbox',l:'Sort the inbox'},{v:'case',l:'Investigate'},{v:'links',l:'Try it yourself'}],onChange:syncMode},
    {id:'msg',label:'Email',type:'select',def:1,lvl:'bio',noTrial:true,modes:['inbox'],options:EMAILS.map((e,i)=>({v:i+1,l:(i+1)+'. '+e.subject})),onChange(sim){sim.st.sel=null;sim.infoDirty=true;},help:'Or click a message in the inbox list.'},
    {id:'raw',label:'Show the raw headers',type:'toggle',def:false,lvl:'ap',noTrial:true,modes:['inbox'],help:'Received chain and SPF, DKIM and DMARC results.'},
    {id:'cview',label:'Evidence to view',type:'seg',def:'time',lvl:'bio',noTrial:true,modes:['case'],options:[{v:'time',l:'Timeline and logs'},{v:'mail',l:'Read an email'}]},
    {id:'cmsg',label:'Email from that morning',type:'select',def:1,lvl:'bio',noTrial:true,modes:['case'],options:CEM.map((e,i)=>({v:i+1,l:e.date.slice(4)+' · '+e.subject})),onChange(sim){BioLab.setValues(sim,{cview:'mail'});}},
    {id:'lex',label:'Start from an example',type:'select',def:'sub',lvl:'bio',noTrial:true,modes:['links'],options:Object.keys(LINKEX).map(k=>({v:k,l:LINKEX[k].l})),onChange:onLex,help:'Or type your own below the stage. Nothing is opened or sent.'}
  ],
  actions:[
    {id:'next',label:'Next email',lvl:'bio',primary:true,modes:['inbox'],run(sim){BioLab.setValues(sim,{msg:Math.round(sim.p.msg)%EMAILS.length+1});}},
    {id:'flag',label:'Flag the part you are inspecting',lvl:'bio',modes:['inbox'],run(sim){const e=curEmail(sim),s=emState(sim,e.id);if(sim.st.sel&&s.dec===null)s.flags[sim.st.sel]=!s.flags[sim.st.sel];}},
    {id:'restart',label:'Start the inbox over',lvl:'bio',modes:['inbox'],run(sim){sim.st.em={};sim.st.sel=null;}},
    {id:'cq',label:'Restart the case questions',lvl:'bio',modes:['case'],run(sim){sim.st.q={};}}
  ],
  init(){const st={em:{},sel:null,q:{},lt:LINKEX.sub.t,lh:LINKEX.sub.h,lf:LINKEX.sub.f,lr:null};return st;},
  step(){},
  metrics:[
    {id:'judged',label:'Emails judged',unit:'of 10',lvl:'bio',min:0,max:10,d:0,modes:['inbox'],get:s=>totals(s).judged},
    {id:'right',label:'Correct decisions',unit:'emails',lvl:'bio',min:0,max:10,d:0,modes:['inbox'],get:s=>totals(s).right},
    {id:'cluepct',label:'Clues found',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['inbox'],get:s=>{const t=totals(s);return t.clues?100*t.found/t.clues:0;}},
    {id:'ff',label:'False alarms (innocent parts flagged)',unit:'',lvl:'honors',min:0,max:null,d:0,modes:['inbox'],get:s=>totals(s).ff},
    {id:'qok',label:'Case questions correct',unit:'',lvl:'bio',min:0,max:5,d:0,modes:['case'],get:s=>caseSolved(s.st)},
    {id:'red',label:'Red flags in this link',unit:'',lvl:'bio',min:0,max:6,d:0,modes:['links'],get:s=>linkRes(s).red},
    {id:'warn',label:'Warnings',unit:'',lvl:'bio',min:0,max:6,d:0,modes:['links'],get:s=>linkRes(s).warn},
    {id:'lverd',label:'Verdict',unit:'',lvl:'bio',text:true,modes:['links'],get:s=>{const r=linkRes(s);return !r.host?'Nothing to inspect':r.red?'Likely phishing':r.warn?'Be careful':'No red flags found';}}
  ],
  narrate(sim){const p=sim.p,st=sim.st;
    if(p.mode==='links'){const r=linkRes(sim);if(!r.host)return 'Type a link target below the stage, or pick an example. <b>Nothing is opened</b>: the page only reads the text.';
      return 'A browser reads a web address from the right: the <b>owner domain is '+r.owner+'</b>. '+(r.red?'This link has '+r.red+' red flag'+(r.red>1?'s':'')+'. Do not trust it.':r.warn?'No red flags, but '+r.warn+' warning'+(r.warn>1?'s':'')+'.':'Nothing suspicious found, but stay alert: a real domain can still be misused.');}
    if(p.mode==='case'){const n=caseSolved(st),N=CASEQ.filter(q=>atLeast(q.lvl)).length;
      if(n>=N)return '<b>Case closed.</b> A look-alike “password expires” email at 09:02 led to a password typed into a fake page at 09:14, a stranger’s sign-in at 09:21, and the spam at 10:42.';
      return 'At 10:42 Mr. Quill’s school account sent 300 fake invoices to parents. <b>Line up the emails, the web log and the sign-in log</b> on one timeline to find what happened first. '+n+' of '+N+' questions solved.';}
    const e=curEmail(sim),g=grade(sim,e);
    if(g.decided)return (g.right?'<b>Good call.</b> ':'<b>Not this time.</b> ')+e.sum;
    if(st.sel)return '<b>'+esc(partLabel(e,st.sel))+'.</b> '+hintFor(st.sel);
    return 'Email '+Math.round(p.msg)+' of 10. <b>Click each part of the message to inspect it</b> (or use the list below the stage), flag anything suspicious, then decide: report it or trust it.';},
  infoPanel(sim){const p=sim.p,st=sim.st;
    if(p.mode==='links')return linksHTML(sim);
    if(p.mode==='case')return caseHTML(sim);
    const e=curEmail(sim),s=emState(sim,e.id),g=grade(sim,e);
    let h='<div class="p-head"><h3>Email '+Math.round(p.msg)+' of 10: inspect and decide</h3></div>';
    h+='<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px 8px;align-items:center">';
    partsOf(e).forEach(id=>{const fl=!!s.flags[id],sel=st.sel===id;h+='<span style="'+(sel?'font-weight:700':'')+'">'+esc(partLabel(e,id))+'</span><button type="button" class="btn" data-ins="'+id+'">'+(sel?'Inspecting':'Inspect')+'</button><button type="button" class="btn'+(fl?' primary':'')+'" data-flag="'+id+'"'+(g.decided?' disabled':'')+' aria-pressed="'+fl+'">'+(fl?'Flagged':'Flag')+'</button>';});
    h+='</div>';
    if(st.sel)h+='<p style="margin-top:10px;padding:8px 10px;background:var(--card2);border-radius:6px;font-size:15px;word-break:break-word">'+esc(inspectText(e,st.sel))+'</p>';
    if(!g.decided)h+='<div class="row" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-dec="report">Report as phishing</button><button type="button" class="btn" data-dec="trust">Looks legitimate</button></div>';
    else{h+='<p class="verdict '+(g.right?'ok':'no')+'" style="margin-top:10px">'+(g.right?'Right decision.':'Wrong decision.')+' This email is '+(e.phish?'phishing':'legitimate')+'.</p><p>'+esc(e.sum)+'</p>';
      if(e.phish)h+='<p>You found <b>'+g.found.length+' of '+cluesAt(e).length+'</b> clues.</p>';
      h+='<ul style="font-size:15px;padding-left:20px;margin:0 0 8px">'+partsOf(e).map(id=>{const isC=cluesAt(e).includes(id),fl=!!s.flags[id];const tag=isC?(fl?'<b style="color:var(--good)">Clue, flagged</b>':'<b style="color:var(--bad)">Clue, missed</b>'):fl&&!(e.neutral||[]).includes(id)?'<b style="color:var(--bad)">Flagged, but fine</b>':'<span style="color:var(--muted)">OK</span>';
        return '<li>'+esc(partLabel(e,id))+': '+tag+'. '+esc(e.why[id]||'')+'</li>';}).join('')+'</ul>';
      h+='<div class="row"><button type="button" class="btn primary" data-nextm="1">Next email</button></div>';}
    const t=totals(sim);h+='<p class="status">Inbox so far: '+t.right+' of '+t.judged+' decisions right, '+t.found+' of '+t.clues+' clues found.</p>';
    return h;},
  bindInfo(sim,el){const st=sim.st;
    el.querySelectorAll('[data-ins]').forEach(b=>b.addEventListener('click',()=>{st.sel=b.dataset.ins;BioLab.refresh(sim);}));
    el.querySelectorAll('[data-flag]').forEach(b=>b.addEventListener('click',()=>{const e=curEmail(sim),s=emState(sim,e.id);st.sel=b.dataset.flag;s.flags[b.dataset.flag]=!s.flags[b.dataset.flag];BioLab.refresh(sim);}));
    el.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click',()=>{const e=curEmail(sim);emState(sim,e.id).dec=b.dataset.dec;BioLab.refresh(sim);}));
    const nx=el.querySelector('[data-nextm]');if(nx)nx.addEventListener('click',()=>{BioLab.setValues(sim,{msg:Math.round(sim.p.msg)%EMAILS.length+1});BioLab.refresh(sim);});
    el.querySelectorAll('button[data-q]').forEach(b=>b.addEventListener('click',()=>{st.q[b.dataset.q]=+b.dataset.i;BioLab.refresh(sim);}));
    const upd=()=>{st.lr=null;if(sim.p.lex!=='own'){sim.p.lex='own';sim.ui.ctl.lex.set('own');}const out=el.querySelector('#ph-out');if(out)out.innerHTML=flagsHTML(linkRes(sim));};
    [['#ph-f','lf'],['#ph-t','lt'],['#ph-h','lh']].forEach(([sel,k])=>{const inp=el.querySelector(sel);if(!inp)return;inp.value=st[k]||'';inp.addEventListener('input',()=>{st[k]=inp.value;upd();});});
    // hover over a link on the stage reveals its real target, like a browser status bar
    const cv=sim.ui.stage;if(cv&&!cv._phHover){cv._phHover=true;cv.addEventListener('mousemove',ev=>{const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*800,y=(ev.clientY-r.top)/r.height*H;
        const hit=(sim.vis.hits||[]).find(h=>x>=h.r[0]&&x<=h.r[0]+h.r[2]&&y>=h.r[1]&&y<=h.r[1]+h.r[3]);sim.vis.hover=hit?hit.id:null;});
      cv.addEventListener('mouseleave',()=>{sim.vis.hover=null;});}},
  onClick(sim,x,y){const hit=(sim.vis.hits||[]).find(h=>x>=h.r[0]&&x<=h.r[0]+h.r[2]&&y>=h.r[1]&&y<=h.r[1]+h.r[3]);if(!hit)return;
    if(hit.id.startsWith('row')){BioLab.setValues(sim,{msg:+hit.id.slice(3)+1});return;}
    if(sim.p.mode==='inbox'){sim.st.sel=hit.id;}},
  onLevel(sim){syncMode(sim);},
  tour:[
    {title:'An inbox of fictional emails',text:'Ten messages: some legitimate, some phishing. Every organization, person and address is made up. Your job is to inspect each one before deciding.',focus:s=>s.vis.rList||[6,6,788,588],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'inbox',msg:2,raw:false});sim.st.sel=null;}},
    {title:'The display name can say anything',text:'“Pinecrest Credit Union (fictional)” is only a display name. The real address is security@pinecrest-alerts.test, which is not the credit union’s domain, pinecrest.example.com.',focus:s=>s.vis.rFrom,speed:1,pause:true,setup(sim){sim.st.sel='from';}},
    {title:'Hover to see where a link really goes',text:{bio:'The link text says pinecrest.example.com, but the real target goes to account-verify.test. On a computer, hover over a link; on a phone, press and hold it.',honors:'Read the host from the right: …example.com.account-verify.test is owned by account-verify.test. “pinecrest.example.com” is just a subdomain the scammer made up.'},focus:s=>s.vis.rLink0,speed:1,pause:true,setup(sim){sim.st.sel='link0';}},
    {title:'Pressure is a clue',text:'A short deadline, a threat to close your account, and a request for your password. Scammers rush you so you do not stop to check.',focus:s=>s.vis.rBody,speed:1,pause:true,setup(sim){sim.st.sel='body';}},
    {title:'Attachments can be programs',text:'“Delivery_Label.pdf.exe” ends in .exe, so it is a program, not a PDF. Only the last extension counts.',focus:s=>s.vis.rAtt0||s.vis.rBody,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{msg:5});sim.st.sel='att0';}},
    {title:'Not every scary email is phishing',text:'This sign-in alert comes from the real domain, uses your name, and has no link: it tells you to use the app or call the number on your card. That is a legitimate alert.',focus:s=>s.vis.rPane,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{msg:8});sim.st.sel=null;}},
    {lvl:'ap',title:'Headers reveal forged senders',text:'This email’s From line shows the real school domain. The raw headers show spf=fail and dmarc=fail: the server that sent it is not allowed to send for bramblewood.example.org, so the From line is forged.',focus:s=>s.vis.rPane,speed:1,pause:true,setup(sim){BioLab.setValues(sim,{msg:10,raw:true});sim.st.sel='headers';}},
    {title:'Investigate: put the logs on one timeline',text:'A teacher’s account sent spam. Lining up emails, web visits and sign-ins on one timeline shows which email came right before the stranger’s first sign-in.',focus:s=>s.vis.rTime||[6,6,788,588],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',cview:'time',raw:false});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'inbox',msg:1,raw:false,cview:'time'});sim.st.sel=null;},
  onChallenge(sim,ch,phase){if(ch&&ch.set){BioLab.setValues(sim,ch.set);if(ch.sel!==undefined)sim.st.sel=ch.sel;}},
  challenges:[
    {lvl:'bio',instant:true,set:{mode:'inbox',msg:2,raw:false},sel:'from',q:'Email 2’s From name says “Pinecrest Credit Union (fictional)”. Does that prove the credit union sent it?',choices:['Yes, the name is right there','No: anyone can type any display name; the address is at pinecrest-alerts.test','Only if it has the logo'],correct:1,
     explain:{bio:'The display name is just text the sender chooses. The address after it, security@pinecrest-alerts.test, is not the credit union’s domain pinecrest.example.com.'}},
    {lvl:'bio',instant:true,set:{mode:'links',lex:'sub'},q:'This link goes to pinecrest.example.com.account-verify.test/login. Who owns that site?',choices:['Pinecrest Credit Union (fictional)','Whoever owns account-verify.test','example.com'],correct:1,
     explain:{bio:'Read the host from the right, up to the first slash. The owner domain is account-verify.test (shown in the box on the stage). Everything to its left is a subdomain the owner can make up, including “pinecrest.example.com”.'}},
    {lvl:'bio',instant:true,set:{mode:'inbox',msg:7,raw:false},sel:'body',q:'Email 7 has no links and no attachments. Can it still be phishing?',choices:['No, phishing needs a link or a file','Yes: it impersonates the principal and asks for gift card codes in secret'],correct:1,
     explain:{bio:'Some of the costliest scams use words alone. A known name on a free account, secrecy, a rush, and gift cards are the clues. Check by asking the person face to face or by a number you already have.'}},
    {lvl:'honors',instant:true,set:{mode:'links',lex:'rn'},q:'The link goes to brarnblewood.example.org. Is that the school’s domain, bramblewood.example.org?',choices:['Yes, it is the same','No: “rn” is standing in for “m”, a look-alike domain','It is a subdomain of the school'],correct:1,
     explain:{honors:'In many fonts “rn” looks like “m”. The inspector compares letter shapes and flags it as a look-alike. Registering look-alike domains is cheap, so attackers use them often.'}},
    {lvl:'honors',instant:true,set:{mode:'links',lex:'at'},q:'Where does http://velvetfern.example.com@billing-update.test/pay actually take you?',choices:['velvetfern.example.com','billing-update.test','Both, one after the other'],correct:1,
     explain:{honors:'In a web address, anything before @ is treated as a user name and ignored for finding the site. The browser goes to billing-update.test.'}},
    {lvl:'honors',instant:true,set:{mode:'links',lex:'https'},q:'The link starts with https:// and the browser would show a padlock. Does that mean the site is safe?',choices:['Yes, the padlock means it is checked and safe','No: https only means the connection is encrypted, even to a scammer’s site'],correct:1,
     explain:{honors:'Anyone can get a free certificate for a domain they own, including pinecrest-secure-login.test. The padlock protects the data on its way; it says nothing about who is on the other end.'}},
    {lvl:'ap',instant:true,set:{mode:'inbox',msg:10,raw:true},sel:'headers',q:'Email 10’s From address is library@bramblewood.example.org, but the headers say spf=fail and dmarc=fail. What does that mean?',choices:['The library’s server had a glitch','The message came from a server not authorized for bramblewood.example.org, so the From line is forged','Nothing; those fields are for spam filters only'],correct:1,
     explain:{ap:'SPF checks whether the sending server’s IP is listed by the domain. DMARC checks that SPF or DKIM passed for the same domain shown in From. Both failing means someone typed the school’s address into the From line from their own server (203.0.113.200).'}},
    {lvl:'ap',instant:true,set:{mode:'inbox',msg:4,raw:true},sel:'headers',q:'Email 4 passes SPF, DKIM and DMARC. Does that make it trustworthy?',choices:['Yes, all three passed','No: they passed for bramb1ewood.example.org, a look-alike the attacker owns'],correct:1,
     explain:{ap:'Authentication proves which domain sent a message, not that the domain is honest. An attacker who registers a look-alike can set up SPF, DKIM and DMARC for it. Always check which domain passed.'}},
    {lvl:'ap',instant:true,set:{mode:'links',lex:'puny'},q:'The link host starts with xn--prcelwhisk-zqi. What is going on?',choices:['A tracking code added by the delivery company','Punycode: the name displays as “pаrcelwhisk” with a letter from another alphabet, a look-alike','A broken link'],correct:1,
     explain:{ap:'Domain names with non-Latin letters are stored as punycode (RFC 3492), starting with xn--. Decoded, this one has a Cyrillic “а” in place of the Latin “a”. Many browsers show the xn-- form to protect you.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Which clues best separate phishing from real email?</p><ol><li>Work through all 10 emails: inspect every part, flag anything suspicious, then decide.</li><li>For each email, record which clues you flagged in a table: sender, link, wording, greeting, attachment.</li><li>Record a trial when you finish to save your score.</li></ol><p>Which clue showed up most often in the phishing emails? Which clue appeared in a legitimate email too, so it is not proof on its own?</p>',
       honors:'<p><b>Question:</b> How do attackers make a link look trustworthy?</p><ol><li>In Try it yourself, inspect each example link and record its owner domain and red flags.</li><li>Type three links of your own that use example.com, example.org or .test names: one honest, one look-alike, one with the brand in the wrong place.</li><li>Then solve the Investigate case.</li></ol><p>Write a 5-step checklist a classmate could use before clicking any link.</p>',
       ap:'<p><b>Question:</b> What can headers prove that the visible email cannot?</p><ol><li>Turn on raw headers. For emails 2, 4 and 10, record the sending IP, and the SPF, DKIM and DMARC results and the domain each refers to.</li><li>Compare the authenticated domain with the From domain in each case.</li><li>Solve the Investigate case and build a timeline with each piece of evidence and its source.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why email 4 passes authentication and is still phishing, while email 10 fails it. What does each result prove, and what does it not prove?</p>'},
  terms:[{t:'Phishing',d:'A message that pretends to come from someone you trust to get you to click, open, pay or give away a password.'},{t:'Display name',d:'The name shown for a sender. The sender chooses it, so it proves nothing.'},
    {t:'Domain',d:'The name that identifies who owns a website or email address, like pinecrest.example.com.'},{t:'Look-alike domain',d:'A domain made to resemble a real one: rn for m, 1 for l, extra words, or letters from another alphabet.'},
    {t:'Double extension',d:'A file name like label.pdf.exe. Only the last extension sets the type, so this is a program.'},{t:'Business email compromise',d:'A scam where the attacker poses as a boss or colleague to request money or gift cards, often with no link at all.'},
    {lvl:'honors',t:'Subdomain',d:'Labels to the left of the owner domain (forms.bramblewood.example.org). The owner can create any subdomain it likes.'},{lvl:'honors',t:'MFA',d:'Multi-factor authentication: a password plus a code or key, so a phished password alone is not enough.'},
    {lvl:'ap',t:'SPF',d:'Sender Policy Framework: the domain lists which servers may send its mail. The receiver checks the sending IP against that list.'},{lvl:'ap',t:'DKIM',d:'DomainKeys Identified Mail: a digital signature from the sending domain over the message.'},
    {lvl:'ap',t:'DMARC',d:'Checks that SPF or DKIM passed for the same domain shown in the From line, and tells receivers what to do if not.'},{lvl:'ap',t:'Punycode',d:'The ASCII form of a domain name with non-Latin letters, starting with xn--.'}],
  about:'<p><b>Everything is fictional.</b> Organizations are invented and marked “(fictional)”; domains use the reserved example.com, example.org and .test names; IP addresses come from the ranges set aside for documentation (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24). No page here looks like a real login page, and links are drawn as text: nothing is ever opened or fetched.</p>'+
    '<p><b>The link inspector</b> parses the address with the browser’s URL parser, then finds the owner domain. In this lab, example.com, example.org and example.net are treated like top-level domains, so the owner is the label just before them. Real tools use the Public Suffix List for cases like .co.uk. Look-alikes are found by mapping confusable letters (rn→m, vv→w, 1→l, 0→o) and by one-letter edit distance against the fictional brands. Punycode is decoded with the RFC 3492 algorithm.</p>'+
    '<p><b>Headers</b> are simplified to the sending relay and IP and one Authentication-Results line. Real headers have several Received lines added by each server, read from the bottom up.</p>'+
    '<p><b>Clues are evidence, not proof.</b> One weak clue, like a generic greeting, appears in legitimate email too. When in doubt, contact the sender by a route you already trust and report the message to your IT team.</p>',
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,H);sim.vis.hits=[];const p=sim.p;
    if(p.mode==='links')drawLinks(sim,ctx,k);
    else if(p.mode==='case'){if(p.cview==='mail')drawEmail(sim,ctx,k,CEM[clamp(Math.round(p.cmsg)-1,0,4)],12,12,776,H-24,{plain:true,to:CASE.addr});else drawTimeline(sim,ctx,k);}
    else drawInbox(sim,ctx,k);},
  thumbSetup(sim){sim.p.msg=2;sim.st.sel='link0';}
};

/* ---------- info panel: links and case ---------- */
function flagsHTML(r){const ic={red:['✕','var(--bad)'],warn:['!','#b06d00'],good:['✓','var(--good)'],info:['i','var(--muted)']};
  return '<ul style="list-style:none;padding:0;margin:8px 0;font-size:15px">'+r.flags.map(f=>'<li style="display:flex;gap:8px;margin:0 0 6px"><b style="color:'+ic[f.lvl][1]+';min-width:14px;text-align:center">'+ic[f.lvl][0]+'</b><span>'+esc(f.msg)+'</span></li>').join('')+'</ul>';}
function linksHTML(sim){const st=sim.st,inp=(id,lab,ph)=>'<label for="'+id+'" style="font-weight:600;display:block;margin-top:8px">'+lab+'</label><input id="'+id+'" class="sel" type="text" autocomplete="off" spellcheck="false" placeholder="'+ph+'" style="width:100%;box-sizing:border-box;font-size:16px;padding:6px 10px;font-family:'+MONO.replace(/"/g,'&quot;')+'">';
  return '<div class="p-head"><h3>Link inspector</h3></div><p>Paste or type a link the way it appears in an email. The page only reads the text: <b>nothing is opened, fetched or sent</b>. Use made-up addresses under example.com, example.org or .test.</p>'+
    inp('ph-f','From line (optional)','Name <someone@example.com>')+inp('ph-t','Link text shown in the email','pinecrest.example.com/verify')+inp('ph-h','Where the link really goes','https://…')+
    '<p style="font-weight:600;margin-top:10px">Findings</p><div id="ph-out">'+flagsHTML(linkRes(sim))+'</div>';}
function caseHTML(sim){const st=sim.st;let h='<div class="p-head"><h3>Case DF-18-06: the invoice spam</h3></div><p>At 10:42 on Tuesday, the school account of '+CASE.who+' sent 300 emails with a fake “Invoice overdue” link to parents. He says he never sent them. Use his inbox, the web proxy log and the sign-in log to find out how the attacker got in.</p>';
  CASEQ.filter(q=>atLeast(q.lvl)).forEach(q=>{const pick=st.q[q.id],done=pick!==undefined,right=done&&pick===q.ans;
    h+='<div style="border-top:1px solid var(--line);padding-top:8px;margin-top:8px"><p style="font-weight:600">'+q.q+'</p><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start">'+q.ch.map((c,i)=>'<button type="button" class="btn'+(done&&i===pick?' primary':'')+'" style="text-align:left;white-space:normal" data-q="'+q.id+'" data-i="'+i+'">'+esc(c)+'</button>').join('')+'</div>';
    if(done)h+='<p class="verdict '+(right?'ok':'no')+'" style="margin-top:6px">'+(right?'Correct.':'Not yet.')+'</p><p>'+(right?q.ok:'Look at the timeline again: what happened just before 09:21?')+'</p>';h+='</div>';});
  return h;}

/* ---------- stage: inbox ---------- */
function drawInbox(sim,ctx,k){const small=k>1.3,e=curEmail(sim);let X=12,W=776;
  if(!small){const LW=210;sim.vis.rList=[6,6,LW+12,H-12];setF(ctx,13*k,700);txt(ctx,'INBOX',X,26,{s:12*k,w:700,c:PAL['cv-soft']});
    const rh=(H-44)/EMAILS.length;EMAILS.forEach((m,i)=>{const y=38+i*rh,cur=m===e,g=grade(sim,m);rr(ctx,X,y,LW,rh-4,6);ctx.fillStyle=cur?PAL['card']:PAL['cv-bg2'];ctx.fill();if(cur){ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;ctx.stroke();}
      setF(ctx,12.5*k,700);ctx.fillStyle=PAL['cv-ink'];txt(ctx,fit(ctx,m.fromName.replace(' (fictional)',''),LW-40),X+10,y+18,{s:12.5*k,w:700});setF(ctx,12*k,400);txt(ctx,fit(ctx,m.subject,LW-20),X+10,y+36,{s:12*k,c:PAL['cv-soft']});
      if(g.decided){ctx.fillStyle=g.right?PAL['s3']:PAL['s1'];ctx.beginPath();ctx.arc(X+LW-16,y+14,8,0,6.29);ctx.fill();txt(ctx,g.right?'✓':'✕',X+LW-16,y+15,{s:11,w:800,c:'#fff',a:'center',b:'middle'});}
      sim.vis.hits.push({id:'row'+i,r:[X,y,LW,rh-4]});});
    X=X+LW+14;W=788-X;}
  drawEmail(sim,ctx,k,e,X,12,W,H-24,{});}
function drawEmail(sim,ctx,k,e,X,Y,W,Hh,o){const st=sim.st,ap=atLeast('ap'),s=o.plain?{flags:{}}:emState(sim,e.id),sel=o.plain?null:st.sel,small=k>1.3;
  rr(ctx,X,Y,W,Hh,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();sim.vis.rPane=[X-4,Y-4,W+8,Hh+8];
  const P=14,x0=X+P,w0=W-2*P,dec=!o.plain&&grade(sim,e).decided;let y=Y+P;const barH=o.plain?0:(small?118:84);
  const region=(id,y1,y2,cb)=>{const r=[X+4,y1-4,W-8,y2-y1+8];if(!o.plain){const fl=!!s.flags[id];if(fl){ctx.fillStyle='rgba(193,20,48,0.10)';rr(ctx,r[0],r[1],r[2],r[3],6);ctx.fill();ctx.fillStyle=PAL['s1'];ctx.fillRect(r[0],r[1]+3,4,r[3]-6);}
      if(dec&&!fl&&cluesAt(e).includes(id)){rr(ctx,r[0],r[1],r[2],r[3],6);ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);txt(ctx,'missed clue',r[0]+r[2]-6,r[1]+12*k,{s:11*k,w:700,c:PAL['s4'],a:'right'});}
      if(sel===id){rr(ctx,r[0],r[1],r[2],r[3],6);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.stroke();}}sim.vis.hits.push({id,r});return r;};
  if(ap&&sim.p.raw&&!o.plain){drawHeaders(sim,ctx,k,e,X,Y,W,Hh-barH,region);if(!o.plain)drawBar(sim,ctx,k,e,X,Y+Hh-barH,W,barH);return;}
  // subject
  setF(ctx,16*k,700);wrap(ctx,e.subject,w0).slice(0,2).forEach(l=>{y+=16*k*1.25;txt(ctx,l,x0,y,{s:16*k,w:700});});y+=8;
  // from
  const fs=13*k,mh=fs*1.45;const metaLine=(lab,val,id)=>{const y1=y;setF(ctx,fs,600);const lw=ctx.measureText(lab+' ').width;setF(ctx,fs,400);const lines=wrap(ctx,val,w0-lw);
    lines.slice(0,small?2:1).forEach((l,i)=>{y+=mh;if(!i)txt(ctx,lab,x0,y,{s:fs,w:600,c:PAL['cv-soft']});txt(ctx,l,x0+lw,y,{s:fs,c:PAL['cv-ink']});});if(id){const r=region(id,y1+4,y+4);if(id==='from')sim.vis.rFrom=[r[0]-2,r[1]-2,r[2]+4,r[3]+4];}};
  metaLine('From:',e.fromName+' <'+e.from+'>','from');if(e.reply)metaLine('Reply-To:',e.reply,'reply');metaLine('To:',o.to||ME.replace(/.*</,'').replace('>',''),null);if(!small)metaLine('Date:',e.date,null);
  y+=6;ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x0+w0,y);ctx.stroke();y+=4;
  // greeting and body
  const bs=14*Math.min(k,1.7),bl=bs*1.42;setF(ctx,bs,400);
  {const y1=y;y+=bl;txt(ctx,e.greet,x0,y,{s:bs});region('greet',y1+6,y+4);}
  y+=4;const yb=y,hot=new Set(e.hot||[]),showHot=!o.plain&&(sel==='body'||s.flags.body||(grade(sim,e).decided&&e.phish))||(o.plain&&sim.vis.caseHot);
  e.body.forEach(par=>{wrap(ctx,par,w0).forEach(line=>{y+=bl;let x=x0;line.split(' ').forEach(wd=>{const key=wd.toLowerCase().replace(/[.,:!?$“”()]/g,'');const isH=showHot&&hot.has(key);setF(ctx,bs,isH?700:400);
        const ww=ctx.measureText(wd).width;if(isH){ctx.fillStyle='rgba(194,122,0,0.28)';ctx.fillRect(x-1,y-bs,ww+2,bs*1.25);}txt(ctx,wd,x,y,{s:bs,w:isH?700:400,c:isH?PAL['cv-ink']:PAL['cv-ink']});x+=ww+ctx.measureText(' ').width;});});y+=6;});
  const rb=region('body',yb+6,y);sim.vis.rBody=[rb[0]-2,rb[1]-2,rb[2]+4,rb[3]+4];
  // links, drawn as text only
  e.links.forEach((l,i)=>{y+=6;const y1=y;setF(ctx,bs,700);const lines=wrap(ctx,l.t,w0-30);lines.forEach(line=>{y+=bl;txt(ctx,line,x0+22,y,{s:bs,w:700,c:PAL['s2']});ctx.fillStyle=PAL['s2'];ctx.fillRect(x0+22,y+3,ctx.measureText(line).width,1.5);});
    txt(ctx,'↗',x0+2,y1+bl,{s:bs,w:700,c:PAL['s2']});const r=region('link'+i,y1+6,y+6);if(i===0)sim.vis.rLink0=[r[0]-2,r[1]-2,r[2]+4,r[3]+4];});
  // attachments
  e.att.forEach((a,i)=>{y+=12;const y1=y;setF(ctx,13*k,600);const w=Math.min(w0,ctx.measureText(a.n).width+50);rr(ctx,x0,y1,w,28*Math.min(k,1.4),6);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    txt(ctx,'📎',x0+8,y1+14*Math.min(k,1.4)+1,{s:13*k,b:'middle'});txt(ctx,fit(ctx,a.n,w-44),x0+34,y1+14*Math.min(k,1.4)+1,{s:13*k,w:600,b:'middle'});y+=28*Math.min(k,1.4);const r=region('att'+i,y1+4,y-4);if(i===0)sim.vis.rAtt0=[r[0]-2,r[1]-2,r[2]+4,r[3]+4];});
  if(!o.plain)drawBar(sim,ctx,k,e,X,Y+Hh-barH,W,barH);}
function drawHeaders(sim,ctx,k,e,X,Y,W,Hh,region){const P=14,x0=X+P,w0=W-2*P,fs=12.5*Math.min(k,1.6),lh=fs*1.45,a=e.hdr.auth;let y=Y+P;
  txt(ctx,'Raw headers (simplified)',x0,y+fs,{s:13*k,w:700,c:PAL['cv-soft']});y+=fs+10;
  const lines=[['Return-Path:','<'+e.from+'>'],['Received:','from '+e.hdr.relay+' ['+e.hdr.ip+'] by mx.bramblewood.example.org; '+e.date],['Authentication-Results:','mx.bramblewood.example.org; spf='+a.spf+' smtp.mailfrom='+a.dom+'; dkim='+a.dkim+(a.dkim==='pass'?' header.d='+a.dom:'')+'; dmarc='+a.dmarc+' header.from='+domainOf(e.from)],['From:',e.fromName+' <'+e.from+'>']];
  if(e.reply)lines.push(['Reply-To:',e.reply]);lines.push(['Subject:',e.subject]);if(k>1.3){const keep=['Received:','Authentication-Results:','From:'];for(let i=lines.length-1;i>=0;i--)if(!keep.includes(lines[i][0]))lines.splice(i,1);}
  ctx.save();ctx.beginPath();ctx.rect(X,Y,W,Hh-6);ctx.clip();const y1=y;lines.forEach(([kk,v])=>{y+=lh;setF(ctx,fs,700,MONO);ctx.fillStyle=PAL['cv-soft'];ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(kk,x0,y);
    v.split('; ').forEach(part=>{setF(ctx,fs,400,MONO);wrap(ctx,part,w0-18).forEach(l=>{y+=lh;const bad=kk.startsWith('Auth')&&/=(fail|softfail|none)/.test(l);setF(ctx,fs,bad?700:400,MONO);ctx.fillStyle=bad?PAL['s1']:PAL['cv-ink'];ctx.fillText(l,x0+18,y);});});y+=4;});
  ctx.restore();y=Math.min(y,Y+Hh-12);region('headers',y1,y+6);sim.vis.rBody=[X,y1-6,W,y-y1+16];}
function drawBar(sim,ctx,k,e,X,Y,W,Hb){const st=sim.st,id=sim.vis.hover&&!sim.vis.hover.startsWith('row')?sim.vis.hover:st.sel;
  rr(ctx,X+6,Y,W-12,Hb-6,8);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();sim.vis.rBar=[X,Y-4,W,Hb];
  const fs=12.5*k;let y=Y+fs+8;
  if(!id){txt(ctx,'Click any part of the email to inspect it. Hover a link to see where it really goes.',X+16,y,{s:fs,c:PAL['cv-soft']});return;}
  txt(ctx,'Inspecting: '+partLabel(e,id),X+16,y,{s:fs,w:700,c:PAL['s2']});setF(ctx,fs,400);wrap(ctx,inspectText(e,id),W-32).slice(0,k>1.3?3:2).forEach(l=>{y+=fs*1.4;txt(ctx,l,X+16,y,{s:fs,c:PAL['cv-ink']});});}

/* ---------- stage: case timeline ---------- */
function drawTimeline(sim,ctx,k){const st=sim.st,small=k>1.3,solved1=st.q.q1===2,solved2=st.q.q2===1;
  setF(ctx,15*k,700);txt(ctx,fit(ctx,small?'Case DF-18-06: Tuesday morning':'Case DF-18-06: Mr. Quill’s account, Tuesday morning',776),12,26,{s:15*k,w:700});
  setF(ctx,13*k,600);const lanes=[['Email','#'],['Web',''],['Sign-in','']],LX=12+Math.max(...lanes.map(l=>ctx.measureText(l[0]).width))+14,T0=7.5*60,T1=11*60,TX=m=>LX+(m-T0)/(T1-T0)*(784-LX);
  const sp=small?38:46,ly=[64,64+sp*Math.min(k,1.4),64+2*sp*Math.min(k,1.4)];sim.vis.rTime=[6,40,788,ly[2]+40];
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;for(let h=8;h<=11;h++){const x=TX(h*60);ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,ly[0]-14);ctx.lineTo(x,ly[2]+16);ctx.stroke();ctx.setLineDash([]);txt(ctx,(h<10?'0':'')+h+':00',x,ly[2]+16+13*k,{s:12*k,c:PAL['cv-soft'],a:h===11?'right':'center'});}
  lanes.forEach((l,i)=>{txt(ctx,l[0],LX-10,ly[i],{s:13*k,w:600,a:'right',b:'middle'});ctx.strokeStyle=PAL['line'];ctx.beginPath();ctx.moveTo(LX,ly[i]);ctx.lineTo(784,ly[i]);ctx.stroke();});
  const dot=(m,y,col,lab,big)=>{const x=TX(m);ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,big?8:6,0,6.29);ctx.fill();if(lab)txt(ctx,lab,x,y-11-2*k,{s:11*k,w:700,c:col,a:'center'});};
  CEM.forEach((e,i)=>dot(e.t,ly[0],solved1&&i===2?PAL['s1']:PAL['s2'],String(i+1),solved1&&i===2));
  PROXY.forEach(([m,l],i)=>dot(m,ly[1],solved2&&(i===1||i===2)?PAL['s1']:PAL['s6'],'',solved2&&i===2));
  SIGNIN.forEach(([m,l],i)=>dot(m,ly[2],i?PAL['s1']:PAL['s3'],'',i===1));
  if(solved2){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(TX(CEM[2].t),ly[0]);ctx.lineTo(TX(PROXY[2][0]),ly[1]);ctx.lineTo(TX(SIGNIN[1][0]),ly[2]);ctx.lineTo(TX(SIGNIN[3][0]),ly[2]);ctx.stroke();ctx.setLineDash([]);}
  // logs
  let y=ly[2]+44+13*k;const fs=Math.min(12.5*k,22),lh=fs*(small?1.38:1.5);
  const block=(title,rows,hl)=>{txt(ctx,title,12,y,{s:13*k,w:700,c:PAL['cv-soft']});y+=6;rows.forEach(([m,l],i)=>{y+=lh;const on=hl(i);if(on){ctx.fillStyle='rgba(193,20,48,0.12)';ctx.fillRect(8,y-fs,784,lh);}
      setF(ctx,fs,on?700:500,MONO);ctx.fillStyle=on?PAL['s1']:PAL['cv-ink'];ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(fit(ctx,hm(m)+'  '+l,780),12,y);});y+=lh*0.9;};
  if(!small)block('INBOX (received)',CEM.map(e=>[e.t,e.from+'  “'+e.subject+'”']),i=>solved1&&i===2);
  block('WEB PROXY LOG (his laptop)',PROXY,i=>solved2&&(i===1||i===2));
  block('SIGN-IN LOG (his account)',SIGNIN,i=>solved2&&i===1||(st.q.q4===1&&i===2));
  if(!small)txt(ctx,'Fictional case. Logs simplified.',788,H-8,{s:11*k,c:PAL['cv-soft'],a:'right'});}

/* ---------- stage: link inspector ---------- */
function drawLinks(sim,ctx,k){const st=sim.st,r=linkRes(sim),small=k>1.3;let y=30;
  txt(ctx,'How a browser reads this link',12,y,{s:15*k,w:700});y+=14;
  const meta=(lab,val)=>{if(!val)return;setF(ctx,13*k,600);const lw=ctx.measureText(lab+' ').width;setF(ctx,13*k,400);wrap(ctx,val,776-lw).slice(0,2).forEach((l,i)=>{y+=13*k*1.5;if(!i)txt(ctx,lab,12,y,{s:13*k,w:600,c:PAL['cv-soft']});txt(ctx,l,12+lw,y,{s:13*k});});};
  meta('From:',st.lf);meta('Link text:',st.lt);y+=14;
  if(!r.host){txt(ctx,'Type where the link really goes, below the stage.',400,y+60,{s:15*k,c:PAL['cv-soft'],a:'center'});return;}
  // URL broken into colored chips
  const col={scheme:PAL['cv-soft'],user:PAL['s1'],sub:PAL['cv-soft'],owner:PAL['s2'],path:PAL['cv-soft']},lab={scheme:'protocol',user:'ignored!',sub:'subdomain',owner:'OWNER',path:'path'};
  const fs=Math.min(17*k,26);setF(ctx,fs,600,MONO);let x=12,rowY=y+fs+18;const rows=[];
  r.parts.forEach(pt=>{let s=pt.s;setF(ctx,fs,pt.k==='owner'?800:600,MONO);let w=ctx.measureText(s).width;
    while(w>776){let n=s.length;while(n>1&&ctx.measureText(s.slice(0,n)).width>776-(x-12))n--;rows.push({pt,s:s.slice(0,n),x,y:rowY});s=s.slice(n);x=12;rowY+=fs+40;w=ctx.measureText(s).width;}
    if(x+w>788){x=12;rowY+=fs+40;}rows.push({pt,s,x,y:rowY});x+=w+6;});
  rows.forEach(c=>{const pt=c.pt;setF(ctx,fs,pt.k==='owner'?800:600,MONO);const w=ctx.measureText(c.s).width;
    if(pt.k==='owner'){rr(ctx,c.x-4,c.y-fs-2,w+8,fs+12,6);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.stroke();}
    ctx.fillStyle=col[pt.k];ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(c.s,c.x,c.y);
    if(pt.k==='user'){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(c.x,c.y-fs*0.35);ctx.lineTo(c.x+w,c.y-fs*0.35);ctx.stroke();}
    txt(ctx,lab[pt.k],c.x+w/2,c.y+12+11*k,{s:11.5*k,w:700,c:col[pt.k]===PAL['cv-soft']?PAL['muted']:col[pt.k],a:'center'});});
  y=rowY+24+14*k;
  if(r.puny){txt(ctx,'Displays as: '+r.puny,12,y,{s:14*k,w:700,c:PAL['s1']});y+=14*k*1.6;}
  // findings
  const ic={red:['✕',PAL['s1']],warn:['!',PAL['s4']],good:['✓',PAL['s3']],info:['i',PAL['cv-soft']]};setF(ctx,13*k,400);
  txt(ctx,'Findings',12,y+4,{s:13*k,w:700,c:PAL['cv-soft']});y+=8;
  r.flags.forEach(f=>{const lines=wrap(ctx,f.msg,776-34);if(y+lines.length*13*k*1.45>H-30)return;y+=13*k*1.45;ctx.fillStyle=ic[f.lvl][1];ctx.beginPath();ctx.arc(22,y-13*k*0.35,10*Math.min(k,1.3),0,6.29);ctx.fill();
    txt(ctx,ic[f.lvl][0],22,y-13*k*0.35+1,{s:12*Math.min(k,1.3),w:800,c:'#fff',a:'center',b:'middle'});setF(ctx,13*k,400);lines.forEach((l,i)=>{if(i)y+=13*k*1.45;txt(ctx,l,40,y,{s:13*k});});y+=4;});
  const v=r.red?'Likely phishing':r.warn?'Be careful':'No red flags found';pill(ctx,v,788-ctx.measureText(v).width/2-30,24,r.red?PAL['s1']:r.warn?PAL['s4']:PAL['s3'],'#fff',13*k);
  txt(ctx,'Text only: this link is never opened.',788,H-8,{s:11*k,c:PAL['cv-soft'],a:'right'});}

SIM.controls[0].onChange=syncMode;
SIM.inspectLink=inspectLink;
BioLab.register(SIM);
})();

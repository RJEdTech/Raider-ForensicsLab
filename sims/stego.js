(function(){
'use strict';
const {clamp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,legend,serColor}=BioLab.h;

/* ---------- shared text helpers ---------- */
const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ENG=[8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07]; // % in English text (Lewand)
const ENG_ORDER=A.split('').map((l,i)=>[l,ENG[i]]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
const MONO='ui-monospace,Consolas,"Courier New",monospace';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mod=(a,n)=>((a%n)+n)%n;
const idx=c=>A.indexOf(c);
function caesar(s,k){return String(s).toUpperCase().replace(/[A-Z]/g,c=>A[mod(idx(c)+k,26)]);}
function counts(s){const c=new Array(26).fill(0);for(const ch of String(s).toUpperCase()){const i=idx(ch);if(i>=0)c[i]++;}return c;}
function icOf(c){let N=0,s=0;c.forEach(n=>{N+=n;s+=n*(n-1);});return N>1?s/(N*(N-1)):0;}
function chi2(c){const N=c.reduce((a,b)=>a+b,0);if(!N)return 0;let x=0;c.forEach((o,i)=>{const e=N*ENG[i]/100;x+=(o-e)*(o-e)/e;});return x;}
const COMMON=['THE','AND','AT','ON','TO','OF','IS','IN','IT','ME','DO','NOT','BE','WE','YOU','FOR','ARE','THIS','THAT','WITH','MEET','BRING','FROM','HAVE','WAS','HE','SHE','THEY','AN','A','I','OR','BY','SO','IF','MY','NO','UP'];
function englishScore(s){const w=String(s).toUpperCase().split(/[^A-Z]+/).filter(Boolean);if(!w.length)return 0;return w.filter(x=>COMMON.includes(x)).length/w.length;}

/* ---------- the three cipher texts (all fictional) ---------- */
const INV_PLAIN='MEET AT PIER 9 ON FRIDAY AT 6 PM. BRING THE DRIVE AND THE PRINTED LOGS. DO NOT TEXT ME.';
const INV_SHIFT=7,INV_CIPHER=caesar(INV_PLAIN,INV_SHIFT);
const SUB_PLAIN='MEET BEHIND THE GREENHOUSE AFTER THE GAME ON FRIDAY. THE BANNER IS ROLLED UP INSIDE THE THIRD STORAGE BIN NEXT TO THE GARDEN TOOLS. WE WILL HANG IT FROM THE BELL TOWER BEFORE THE SUN COMES UP, SO EVERYONE SEES IT ON THE WAY IN. DO NOT TEXT ABOUT THIS, BECAUSE THE OFFICE CHECKS THE SCHOOL NETWORK. IF ANYONE ASKS, TELL THEM WE ARE THERE TO WATER THE TOMATO PLANTS. DELETE THIS NOTE AFTER YOU READ IT.';
const VIG_PLAIN='INVESTIGATORS FOUND THE LAPTOP UNDER A PILE OF OLD NEWSPAPERS IN THE GARAGE. THE HARD DRIVE HAD BEEN WIPED, BUT A SECOND DRIVE WAS HIDDEN INSIDE THE CASE BEHIND THE FAN. ON THAT DRIVE THEY FOUND THE MISSING INVOICES, A LIST OF ACCOUNT NUMBERS AND A NOTE THAT SAID THE MONEY WOULD BE MOVED ON MONDAY. THE TEAM MADE AN IMAGE OF THE DRIVE, HASHED IT, AND SEALED THE ORIGINAL IN AN EVIDENCE BAG BEFORE ANYONE OPENED A SINGLE FILE.';
const VIG_KEY='TRACE';
function vigenere(s,key,dir){let j=0;return s.replace(/[A-Z]/g,c=>{const k=idx(key[j%key.length]);j++;return A[mod(idx(c)+dir*k,26)];});}
const VIG_CIPHER=vigenere(VIG_PLAIN,VIG_KEY,1);
const VIG_LET=VIG_CIPHER.replace(/[^A-Z]/g,'');
function subKey(seed){const r=rng(seed),p=A.split('');for(let i=25;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]];}return p.join('');} // plain index → cipher letter
function subEncrypt(s,key){return s.replace(/[A-Z]/g,c=>key[idx(c)]);}
function vigColumns(L){const cols=[];for(let j=0;j<L;j++){let s='';for(let i=j;i<VIG_LET.length;i+=L)s+=VIG_LET[i];cols.push(s);}return cols;}
const IC_BY_L=[1,2,3,4,5,6,7,8].map(L=>{const cs=vigColumns(L);return cs.reduce((a,c)=>a+icOf(counts(c)),0)/L;});
const KASISKI=(()=>{const pos={};for(let i=0;i+3<=VIG_LET.length;i++){const g=VIG_LET.substr(i,3);(pos[g]=pos[g]||[]).push(i);}
  const reps=Object.entries(pos).filter(e=>e[1].length>1).map(e=>({g:e[0],d:e[1].slice(1).map((p,i)=>p-e[1][i])}));
  const f={};reps.forEach(r=>r.d.forEach(d=>{for(let k=2;k<=8;k++)if(d%k===0)f[k]=(f[k]||0)+1;}));
  reps.sort((a,b)=>b.d.length-a.d.length||a.d[0]-b.d[0]);return {reps,f};})();

/* ---------- generated photos (96 × 64 px, real 8-bit RGB values) ---------- */
const W=96,H=64,N=W*H;
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function harborPx(x,y){const HZ=38;let c;
  if(y<HZ){c=mix([58,42,112],[246,152,78],Math.pow(y/HZ,1.3));const d=Math.hypot(x-66,y-27);if(d<8)c=[255,224,146];else if(d<14)c=mix([255,200,120],c,(d-8)/6);
    if((y===12||y===13)&&x>8&&x<40)c=mix(c,[250,190,170],0.45);if(y===19&&x>70&&x<92)c=mix(c,[250,180,140],0.4);}
  else{c=mix([60,70,124],[16,26,60],(y-HZ)/(H-HZ));const half=8-(y-HZ)*0.18;if(Math.abs(x-66)<half&&y%2===0)c=mix(c,[240,156,92],0.75);}
  if(y>=39&&y<=41&&x<40)c=[36,26,32];if(x<40&&x%7===2&&y>41&&y<54)c=[36,26,32];
  if(y>=46&&y<=49&&x>=50+(49-y)&&x<=63-(49-y))c=[30,22,28];if(x===56&&y>=31&&y<46)c=[30,22,28];if(y>=33&&y<45&&x>56&&x<=56+(45-y)*0.55)c=[226,214,204];
  return c;}
function peaksPx(x,y){let c=mix([84,140,210],[196,224,244],y/36);
  const pk=[[22,13,1.05],[56,7,0.85],[86,17,1.2]];let top=99,ty=99;pk.forEach(p=>{const yy=p[1]+p[2]*Math.abs(x-p[0]);if(yy<top){top=yy;ty=p[1];}});
  if(y>=top){c=mix([128,122,140],[86,82,100],clamp((y-top)/18,0,1));if(y<ty+7&&y<top+3.5)c=[242,244,250];}
  const fz=44+3*Math.sin(x/6.5);if(y>=fz){c=[34,84,54];}
  for(let t=0;t<12;t++){const tx=4+t*8+(t%3)*2,tt=fz-9-(t%2)*3;if(y>=tt&&y<fz+2&&Math.abs(x-tx)<=(y-tt)*0.45)c=[22,62,40];}
  if(y>=54)c=mix([104,156,72],[78,128,56],(y-54)/10);
  return c;}
function makePhoto(fn,seed){const r=rng(seed),d=new Uint8ClampedArray(N*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=fn(x,y),i=(y*W+x)*4;for(let k=0;k<3;k++)d[i+k]=Math.round(c[k]+gauss(r)*2.2);d[i+3]=255;}
  return d;}
const PHOTOS={};
function photo(name){if(!PHOTOS[name])PHOTOS[name]=name==='harbor'?makePhoto(harborPx,4242):makePhoto(peaksPx,1876);return PHOTOS[name];}
const CH={R:0,G:1,B:2},CHN={R:'red',G:'green',B:'blue'};
function asciiBytes(s){const b=[];for(const c of String(s)){const v=c.charCodeAt(0);b.push(v>=32&&v<127?v:63);}return b;}
/* write the bytes (then a 0 terminator) into the lowest `bits` bits of one channel, pixel by pixel in reading order, most significant bit of each byte first */
function embed(base,bytes,ch,bits){const out=new Uint8ClampedArray(base),stream=[];bytes.concat([0]).forEach(v=>{for(let b=7;b>=0;b--)stream.push((v>>b)&1);});
  let s=0;for(let p=0;p<N&&s<stream.length;p++){let v=out[p*4+ch];for(let b=bits-1;b>=0;b--){const bit=s<stream.length?stream[s++]:((v>>b)&1);v=(v&~(1<<b))|(bit<<b);}out[p*4+ch]=v;}
  return out;}
/* read bits back: plane mode reads one bit plane; bits mode reads the lowest n bits */
function extract(img,ch,plane,nbits,maxBytes){const out=[];let cur=0,n=0;
  for(let p=0;p<N&&out.length<maxBytes;p++){const v=img[p*4+ch];const planes=nbits?Array.from({length:nbits},(_,i)=>nbits-1-i):[plane];
    for(const b of planes){cur=(cur<<1)|((v>>b)&1);n++;if(n===8){if(cur===0)return out;out.push(cur);cur=0;n=0;if(out.length>=maxBytes)break;}}}
  return out;}
const printable=b=>b.map(v=>v>=32&&v<127?String.fromCharCode(v):'·').join('');
function diffStats(a,b,ch){let changed=0,maxd=0,se=0;const hist={};for(let p=0;p<N;p++){let any=false;for(let k=0;k<3;k++){const d=b[p*4+k]-a[p*4+k];if(d){any=true;maxd=Math.max(maxd,Math.abs(d));se+=d*d;}}if(any)changed++;
  const dc=b[p*4+ch]-a[p*4+ch];hist[dc]=(hist[dc]||0)+1;}
  const mse=se/(N*3);return {changed,maxd,mse,psnr:mse>0?10*Math.log10(255*255/mse):Infinity,hist};}
const INV_ORIG=()=>photo('harbor');
let INV_POSTED=null;const invPosted=()=>INV_POSTED||(INV_POSTED=embed(INV_ORIG(),asciiBytes(INV_CIPHER),0,1));

/* ---------- offscreen canvases for the 96 × 64 views ---------- */
const CV={};
function viewCanvas(key,fill){let c=CV[key];if(c)return c;c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),im=g.createImageData(W,H);fill(im.data);g.putImageData(im,0,0);
  const keys=Object.keys(CV);if(keys.length>40)delete CV[keys[0]];CV[key]=c;return c;}
function rgbCanvas(key,img){return viewCanvas(key,d=>d.set(img));}
function planeCanvas(key,img,ch,plane){return viewCanvas(key,d=>{for(let p=0;p<N;p++){const v=((img[p*4+ch]>>plane)&1)?255:0;d[p*4]=d[p*4+1]=d[p*4+2]=v;d[p*4+3]=255;}});}
function diffCanvas(key,a,b){return viewCanvas(key,d=>{for(let p=0;p<N;p++){let m=0;for(let k=0;k<3;k++)m=Math.max(m,Math.abs(b[p*4+k]-a[p*4+k]));const g=(a[p*4]+a[p*4+1]+a[p*4+2])/3*0.35+20;
  if(m){const t=clamp(0.55+m/30,0,1);d[p*4]=255;d[p*4+1]=Math.round(40*(1-t));d[p*4+2]=Math.round(200+55*t);}else{d[p*4]=d[p*4+1]=d[p*4+2]=g;}d[p*4+3]=255;}});}

/* ---------- state ---------- */
function curImgs(sim){const st=sim.st;if(sim.p.mode==='hide')return {a:photo('peaks'),b:st.hidden?st.hidden.img:photo('peaks'),ak:'peaks',bk:st.hidden?'hid'+st.hidden.ver:'peaks'};
  return {a:INV_ORIG(),b:invPosted(),ak:'harbor',bk:'posted'};}
function stats(sim){const I=curImgs(sim),ch=CH[sim.p.channel]||0,key=I.bk+'|'+ch;if(sim.st._sk!==key){sim.st._sk=key;sim.st._s=diffStats(I.a,I.b,ch);}return sim.st._s;}
const bitsN=sim=>clamp(Math.round(sim.p.bits||1),1,4);
const planeN=sim=>clamp(Math.round(sim.p.plane||0),0,7);
const shiftN=sim=>mod(Math.round(sim.p.shift||0),26);
const klenN=sim=>clamp(Math.round(sim.p.klen||1),1,8);
const colN=sim=>clamp(Math.round(sim.p.col||1),1,klenN(sim));
function subCipher(sim){const st=sim.st;if(st._subSeed!==st.subSeed){st._subSeed=st.subSeed;st.subKey=subKey(st.subSeed);st.subCT=subEncrypt(SUB_PLAIN,st.subKey);st.subCounts=counts(st.subCT);}return st.subCT;}
function subRanked(sim){subCipher(sim);const c=sim.st.subCounts;return A.split('').map((l,i)=>({l,n:c[i]})).sort((a,b)=>b.n-a.n||a.l.localeCompare(b.l));}
function subTruth(sim,cl){subCipher(sim);const i=sim.st.subKey.indexOf(cl);return i>=0?A[i]:'?';}
function subDecoded(sim){const m=sim.st.map;return subCipher(sim).replace(/[A-Z]/g,c=>m[c]?m[c]:c.toLowerCase());}
function vigKey(sim){const L=klenN(sim);return sim.st.vshift.slice(0,L).map(s=>A[s]).join('');}
function invDecoded(sim){const e=sim.st.inv.ext;return e?caesar(printable(e.bytes),-shiftN(sim)):'';}
const invRightPlane=e=>e&&e.ch===0&&e.plane===0;
const invSolved=sim=>invRightPlane(sim.st.inv.ext)&&shiftN(sim)===INV_SHIFT;

/* ---------- show only what the current part uses ---------- */
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const mode=sim.p.mode,d=sim.def;
  if(!atLeast('honors')&&mode==='subst'){BioLab.setValues(sim,{mode:'investigate'});return;}
  if(!atLeast('ap')&&mode==='vig'){BioLab.setValues(sim,{mode:'investigate'});return;}
  d.controls.forEach(c=>{if(!c.modes)return;const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(mode);});
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(mode);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];
  d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!atLeast(a.lvl)||!a.modes.includes(mode);});}
function track(sim){const p=sim.p,st=sim.st;if(!st)return;if(p.mode==='investigate'){if(p.view==='diff')st.inv.diff=true;if(p.view==='plane'&&p.channel==='R'&&planeN(sim)===0)st.inv.found=true;}}
function changed(sim){syncMode(sim);track(sim);sim.infoDirty=true;}

/* ---------- drawing helpers ---------- */
function panel(ctx,x,y,w,h){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}
function drawPic(ctx,cv,x,y,w,h){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(cv,x,y,w,h);ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.strokeRect(x-0.5,y-0.5,w+1,h+1);}
function fitText(ctx,s,max,size,w){ctx.font=(w||400)+' '+size+'px '+FONT;if(ctx.measureText(s).width<=max)return s;let t=s;while(t.length>1&&ctx.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…';}

function drawImages(sim,ctx,k,t){const p=sim.p,st=sim.st,inv=p.mode==='investigate',I=curImgs(sim),ch=CH[p.channel]||0,pl=planeN(sim);
  const S=3.6,w=W*S,h=H*S,x1=28,x2=800-28-w,y=44;
  const lt=inv?'Posted photo':(st.hidden?'Your photo, with message':'Your photo');
  txt(ctx,fitText(ctx,lt,w,15*k,700),x1,y-12,{s:15*k,w:700});
  drawPic(ctx,rgbCanvas(I.bk,I.b),x1,y,w,h);
  let rt,rc;
  if(p.view==='plane'){rt=CHN[p.channel]+' bit plane '+pl;rc=planeCanvas(I.bk+'p'+ch+pl,I.b,ch,pl);}
  else if(p.view==='diff'){rt='Pixels that changed';rc=diffCanvas('d'+I.ak+I.bk,I.a,I.b);}
  else{rt=inv?'Camera original':'Before hiding';rc=rgbCanvas(I.ak,I.a);}
  txt(ctx,fitText(ctx,rt.charAt(0).toUpperCase()+rt.slice(1),w,15*k,700),x2,y-12,{s:15*k,w:700});
  drawPic(ctx,rc,x2,y,w,h);
  // extraction scan line
  if(st.anim>0&&st.anim<1){const src=inv?st.inv.ext:st.read,nbits=src?(src.bytes.length+1)*8/(inv?1:(src.bits||1)):8,rows=Math.max(1,Math.ceil(nbits/W));const yy=y+Math.min(rows,H)*S*st.anim;ctx.fillStyle='rgba(255,210,63,.55)';ctx.fillRect(x1,yy-2,w,4);}
  // how far the message reaches (once found)
  const show=(inv&&(st.inv.found||st.inv.diff))||(!inv&&st.hidden);
  if(show&&p.view!=='image'){const nb=inv?asciiBytes(INV_CIPHER).length+1:st.hidden.len+1,bitsPer=inv?1:st.hidden.bits,rows=Math.ceil(nb*8/bitsPer/W);
    const yb=y+rows*S;ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(x2-3,y-3,w+6,yb-y+6);ctx.setLineDash([]);
    pill(ctx,(inv?'pattern: rows 1–':'message: rows 1–')+rows,x2+w/2,yb+14*k,PAL['s4'],'#fff',12*k);}
  return {y:y+h};}

function drawStrip(sim,ctx,k,y0){const p=sim.p,st=sim.st,I=curImgs(sim),ch=CH[p.channel]||0,pl=planeN(sim),ap=atLeast('ap'),hon=atLeast('honors'),big=k>1.3;
  const hide=p.mode==='hide',nb=hide?bitsN(sim):1;
  const n=8,gap=8,bw=(800-56-gap*(n-1))/n,x0=28;
  txt(ctx,fitText(ctx,'First 8 pixels of the top row: '+CHN[p.channel]+' values',744,13*k,600),x0,y0,{s:13*k,c:PAL['cv-soft'],w:600});
  const by=y0+8;let bitsOut=[];const vy=by+16+18*k,showWas=hon&&!big,sq=Math.min(10,(bw-8)/8),sy=vy+(showWas?20:8);
  for(let i=0;i<n;i++){const x=x0+i*(bw+gap),v=I.b[i*4+ch],v0=I.a[i*4+ch];
    rr(ctx,x,by,bw,14,4);ctx.fillStyle='rgb('+I.b[i*4]+','+I.b[i*4+1]+','+I.b[i*4+2]+')';ctx.fill();
    txt(ctx,String(v),x+bw/2,vy,{s:17*k,w:800,a:'center',c:v!==v0?PAL['s1']:PAL['cv-ink']});
    if(v!==v0&&showWas)txt(ctx,'was '+v0,x+bw/2,vy+15,{s:12*k,a:'center',c:PAL['s1'],w:700});
    for(let b=7;b>=0;b--){const bx=x+bw/2-4*sq+(7-b)*sq,on=(v>>b)&1,sel=hide?b<nb:b===pl;
      ctx.fillStyle=on?PAL['cv-ink']:PAL['cv-bg2'];ctx.fillRect(bx+0.5,sy,sq-1,sq);ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.strokeRect(bx+0.5,sy,sq-1,sq);
      if(sel){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2;ctx.strokeRect(bx,sy-1.5,sq,sq+3);}}
    if(hide){for(let b=nb-1;b>=0;b--)bitsOut.push((v>>b)&1);}else bitsOut.push((v>>pl)&1);}
  const ly=sy+sq+22*k;
  const byte=bitsOut.slice(0,8),val=byte.reduce((a,b)=>a*2+b,0);
  let s=big?(hide?'Lowest '+nb:'Bit '+pl)+' → '+byte.join(''):(hide?'Lowest '+nb+' bit'+(nb>1?'s':'')+' of each (orange)':'Bit '+pl+' of each pixel (orange)')+' → '+byte.join(' ');
  if(byte.length===8){s+=' = '+(ap?val+' = 0x'+val.toString(16).toUpperCase().padStart(2,'0')+' = ':'')+(val>=32&&val<127?'“'+String.fromCharCode(val)+'”':'not a letter');}
  txt(ctx,fitText(ctx,s,744,14*k,700),x0,ly,{s:14*k,w:700});
  return ly;}

function drawCaesar(sim,ctx,k,vdt){const p=sim.p,st=sim.st,sh=shiftN(sim),ap=atLeast('ap'),hon=atLeast('honors'),dec=p.dir==='dec',big=k>1.3;
  const tgt=-sh*2*Math.PI/26;let a=st.wheelA===undefined?tgt:st.wheelA;let d=tgt-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;a=RM||!vdt?tgt:a+d*Math.min(1,vdt*6);st.wheelA=a;
  const cx=212,cy=232,R1=200,R2=152,R3=104;
  ctx.beginPath();ctx.arc(cx,cy,R1,0,6.2832);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,R2,0,6.2832);ctx.fillStyle=PAL['cv-bg2'];ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,R3,0,6.2832);ctx.fillStyle=PAL['card'];ctx.fill();ctx.stroke();
  const fs=Math.min(16*k,24),off=a-tgt;
  for(let i=0;i<26;i++){const th=-Math.PI/2+i*2*Math.PI/26,top=i===0;
    txt(ctx,A[i],cx+Math.cos(th)*(R1+R2)/2,cy+Math.sin(th)*(R1+R2)/2,{s:fs,w:top?800:600,a:'center',b:'middle',c:top?PAL['s2']:PAL['cv-ink']});
    txt(ctx,A[mod(i+sh,26)],cx+Math.cos(th+off)*(R2+R3)/2,cy+Math.sin(th+off)*(R2+R3)/2,{s:fs,w:top?800:600,a:'center',b:'middle',c:top?PAL['s1']:PAL['cv-ink']});}
  ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;rr(ctx,cx-21,cy-R1+2,42,R1-R3-4,10);ctx.stroke();
  txt(ctx,'shift',cx,cy-16*k,{s:14*k,a:'center',c:PAL['cv-soft'],w:600});txt(ctx,String(sh),cx,cy+22*k,{s:34*k,w:800,a:'center'});
  const X=448,RW=332;let y=48;
  txt(ctx,'Outer ring: plain letter',X,y,{s:13*k,c:PAL['s2'],w:700});y+=18*k;txt(ctx,'Inner ring: cipher letter',X,y,{s:13*k,c:PAL['s1'],w:700});y+=30*k;
  pill(ctx,big?'A → '+A[sh]+'   Z → '+A[(sh+25)%26]:'A → '+A[sh]+'    B → '+A[(sh+1)%26]+'    Z → '+A[(sh+25)%26],X+RW/2,y,PAL['card2'],PAL['cv-ink'],15*k);y+=36*k;
  const inp=String(st.ctext||'').toUpperCase(),out=dec?caesar(inp,-sh):caesar(inp,sh);
  const cell=Math.max(19,17*k*0.68),nfit=Math.floor((RW-14)/cell);
  const row=(s,y,col)=>{ctx.font='700 '+(17*k)+'px '+MONO;ctx.fillStyle=col;ctx.textAlign='center';ctx.textBaseline='middle';for(let i=0;i<Math.min(nfit,s.length);i++)ctx.fillText(s[i],X+cell*(i+0.5),y);if(s.length>nfit)txt(ctx,'…',X+RW,y,{s:16*k,a:'right',b:'middle',c:PAL['cv-soft']});};
  txt(ctx,dec?'Cipher text in':'Your message',X,y,{s:13*k,c:PAL['cv-soft'],w:600});row(inp,y+20*k,dec?PAL['s1']:PAL['s2']);y+=48*k;
  txt(ctx,dec?'Plain text out':'Cipher text',X,y,{s:13*k,c:PAL['cv-soft'],w:600});row(out,y+20*k,dec?PAL['s2']:PAL['s1']);y+=52*k;
  if(hon&&!ap){txt(ctx,fitText(ctx,'Only 25 useful shifts: try them all.',RW,14*k,700),X,y,{s:14*k,w:700});}
  if(ap){const m=inp.match(/[A-Z]/);const L=m?m[0]:'M',P=idx(L),C=dec?mod(P-sh,26):mod(P+sh,26);
    txt(ctx,fitText(ctx,dec?'P = (C − '+sh+') mod 26':'C = (P + '+sh+') mod 26',RW,15*k,700),X,y,{s:15*k,w:700,c:PAL['s5']});
    txt(ctx,fitText(ctx,L+' = '+P+' → '+(dec?P+' − '+sh:P+' + '+sh)+' → '+C+' = '+A[C],RW,14*k,600),X,y+22*k,{s:14*k,c:PAL['cv-soft'],w:600});}}

function drawSubst(sim,ctx,k){const st=sim.st,ranked=subRanked(sim),maxn=ranked[0].n,used=new Set(Object.values(st.map)),kk=Math.min(k,1.4);
  const L=30,R=770,sw=(R-L)/26,hits=[],lf=Math.min(15*k,sw*0.85);
  txt(ctx,fitText(ctx,'Cipher letters in the note, most common first',740,14*k,700),L,30,{s:14*k,w:700});
  const T1=46,B1=176;
  ranked.forEach((r,i)=>{const x=L+i*sw,h=(B1-T1)*r.n/maxn,sel=st.sel===r.l;
    ctx.fillStyle=sel?PAL['s4']:PAL['s1'];ctx.fillRect(x+3,B1-h,sw-6,h);
    if(sel){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=2.5;rr(ctx,x+1,T1-6,sw-2,B1-T1+62*kk,6);ctx.stroke();}
    txt(ctx,r.l,x+sw/2,B1+17*kk,{s:lf,w:800,a:'center',c:PAL['s1']});
    const m=st.map[r.l];txt(ctx,m||'·',x+sw/2,B1+40*kk,{s:lf,w:800,a:'center',c:m?PAL['s3']:PAL['muted']});
    hits.push({k:'c',l:r.l,r:[x,T1-6,sw,B1-T1+62]});});
  const T2=292,B2=388;
  txt(ctx,fitText(ctx,'Letters in ordinary English, most common first',740,14*k,700),L,T2-26,{s:14*k,w:700});
  ENG_ORDER.forEach((l,i)=>{const x=L+i*sw,f=ENG[idx(l)],h=(B2-T2)*f/12.7,u=used.has(l);
    ctx.fillStyle=u?PAL['line']:PAL['s2'];ctx.fillRect(x+3,B2-h,sw-6,h);
    txt(ctx,l,x+sw/2,B2+18*kk,{s:lf,w:800,a:'center',c:u?PAL['muted']:PAL['s2']});
    hits.push({k:'p',l,r:[x,T2-4,sw,B2-T2+26]});});
  txt(ctx,fitText(ctx,st.sel?'Cipher '+st.sel+' selected: click the English letter it stands for':'Click a cipher bar, then the English letter it stands for',740,13*k,600),L,444,{s:13*k,c:PAL['cv-soft'],w:600});
  sim.vis.hits=hits;}

function drawVig(sim,ctx,k){const p=sim.p,st=sim.st,L=klenN(sim),c=colN(sim),sh=mod(Math.round(p.cshift||0),26),kk=Math.min(k,1.4);
  const box={L:78,T:52,W:300,H:136};txt(ctx,'Average IC by key length',24,28,{s:14*k,w:700});
  const ymax=0.08,Y=v=>box.T+box.H-v/ymax*box.H,bw=box.W/8;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(box.L,box.T);ctx.lineTo(box.L,box.T+box.H);ctx.lineTo(box.L+box.W,box.T+box.H);ctx.stroke();
  IC_BY_L.forEach((v,i)=>{const x=box.L+i*bw,sel=i+1===L;ctx.fillStyle=sel?PAL['s4']:PAL['s2'];ctx.fillRect(x+6,Y(v),bw-12,box.T+box.H-Y(v));
    txt(ctx,String(i+1),x+bw/2,box.T+box.H+17*kk,{s:13*k,a:'center',w:sel?800:500,c:sel?PAL['s4']:PAL['cv-soft']});});
  ctx.strokeStyle=PAL['s3'];ctx.setLineDash([5,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(box.L,Y(0.066));ctx.lineTo(box.L+box.W,Y(0.066));ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'0.066',box.L-6,Y(0.066),{s:12*k,a:'right',b:'middle',c:PAL['s3'],w:700});txt(ctx,'English',box.L+6,Y(0.066)-6,{s:12*k,c:PAL['s3'],w:700});
  txt(ctx,'0',box.L-6,box.T+box.H,{s:12*k,a:'right',b:'middle',c:PAL['cv-soft']});
  const X=430;panel(ctx,X-12,12,800-X,212);let y=36;
  txt(ctx,'Repeats (Kasiski test)',X,y,{s:14*k,w:700});y+=24*k;
  const reps=KASISKI.reps.slice(0,k>1.3?1:3);
  reps.forEach(r=>{txt(ctx,fitText(ctx,r.g+': '+r.d.join(', ')+' letters apart',344,13*k,600),X,y,{s:13*k,w:600,c:PAL['cv-soft']});y+=20*k;});
  const best=Object.entries(KASISKI.f).sort((a,b)=>b[1]-a[1])[0];
  txt(ctx,fitText(ctx,'Most spacings divide by '+best[0],344,13*k,700),X,y,{s:13*k,w:700,c:PAL['s4']});y+=14*k;
  const key=vigKey(sim),kw=Math.min(40,(344-60*k)/L),bh=26*k;
  txt(ctx,'Key',X,y+bh/2+2,{s:13*k,c:PAL['cv-soft'],w:700,b:'middle'});
  for(let i=0;i<L;i++){const x=X+50*k+i*kw,sel=i+1===c;rr(ctx,x,y,kw-4,bh,6);ctx.fillStyle=sel?PAL['s4']:PAL['card2'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,key[i],x+(kw-4)/2,y+bh/2+1,{s:Math.min(17*k,kw*0.75),w:800,a:'center',b:'middle',c:sel?'#fff':PAL['cv-ink']});}
  const col=vigColumns(L)[c-1],cc=counts(caesar(col,-sh)),Nn=col.length,cl=30,cr=770,sw=(cr-cl)/26,T=272,B=404;
  txt(ctx,'Column '+c+' of '+L+', shift '+sh+' ('+A[sh]+')',cl,254,{s:14*k,w:700});
  ctx.font='700 '+(12*k)+'px '+FONT;const w2=ctx.measureText('English').width,w1=ctx.measureText('column').width;let lx=cr-w2;
  txt(ctx,'English',lx,254,{s:12*k,w:700,c:PAL['s3']});lx-=16*k+6;ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.strokeRect(lx,254-11*k,14*k,11*k);
  lx-=w1+18;txt(ctx,'column',lx,254,{s:12*k,w:700,c:PAL['s5']});ctx.fillStyle=PAL['s5'];ctx.fillRect(lx-16*k-6,254-11*k,14*k,11*k);
  const mx=Math.max(...cc.map(v=>v/Nn*100),12.7);
  for(let i=0;i<26;i++){const x=cl+i*sw,h=(B-T)*(cc[i]/Nn*100)/mx,he=(B-T)*ENG[i]/mx;
    ctx.fillStyle=PAL['s5'];ctx.fillRect(x+4,B-h,sw-8,h);ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ctx.strokeRect(x+2,B-he,sw-4,he);
    txt(ctx,A[i],x+sw/2,B+18*kk,{s:Math.min(14*k,sw*0.8),a:'center',w:700,c:PAL['cv-soft']});}}

/* ---------- the definition ---------- */
const SIM={
  id:'stego',hash:'stego',apUnit:18,order:7,tab:'Ciphers and steganography',kind:'Virtual lab',
  prereq:['hashing','filesig'],next:['casefile'],
  card:'Find a message hidden in the lowest bits of a photo, crack a Caesar cipher, and break a substitution cipher with letter frequencies.',
  title:'Ciphers and steganography: finding hidden messages',
  lede:{bio:'A suspect posted an ordinary-looking photo. Look at the photo’s bits to find a hidden message, then crack the cipher that scrambles it.',
        honors:'Compare bit planes to find data hidden by least-significant-bit steganography, then break a substitution cipher with frequency analysis.',
        ap:'Measure the cost of hiding more bits per pixel, and break a Vigenère cipher by finding its key length from the index of coincidence.'},
  scale:{bio:'A 96 × 64 pixel photo: 6,144 pixels, each with red, green and blue values from 0 to 255.',ap:'A 96 × 64 pixel photo: 6,144 pixels × 3 colors × 8 bits = 147,456 bits, of which 18,432 are least significant bits.'},
  timeless:true,animated:true,chChange:0.8,chReveal:2.4,
  controls:[
    {id:'mode',label:'Part',type:'seg',def:'investigate',lvl:'bio',options:[{v:'investigate',l:'Investigate'},{v:'caesar',l:'Caesar'},{v:'subst',l:'Substitution',lvl:'honors'},{v:'vig',l:'Vigenère',lvl:'ap'},{v:'hide',l:'Hide a message'}]},
    {id:'view',label:'View',type:'seg',def:'image',lvl:'bio',modes:['investigate','hide'],options:[{v:'image',l:'Photos'},{v:'plane',l:'Bit plane'},{v:'diff',l:'Difference'}]},
    {id:'channel',label:'Color',type:'seg',def:'G',lvl:'bio',modes:['investigate','hide'],options:[{v:'R',l:'Red'},{v:'G',l:'Green'},{v:'B',l:'Blue'}],help:'Which color’s bits you look at, or hide in.'},
    {id:'plane',label:'Bit plane (0 = lowest bit)',type:'range',min:0,max:7,step:1,def:0,unit:'',lvl:'bio',modes:['investigate','hide'],help:'Bit 0 changes a value by 1. Bit 7 changes it by 128.'},
    {id:'bits',label:'Bits hidden per pixel',type:'range',min:1,max:4,step:1,def:1,unit:'',lvl:'honors',modes:['hide'],help:'More bits hold a longer message but change each pixel more.'},
    {id:'shift',label:'Caesar shift',type:'range',min:0,max:25,step:1,def:3,unit:'',lvl:'bio',modes:['investigate','caesar'],help:'In Investigate, this is the shift you try for decoding.'},
    {id:'dir',label:'Direction',type:'seg',def:'enc',lvl:'bio',modes:['caesar'],options:[{v:'enc',l:'Encrypt'},{v:'dec',l:'Decrypt'}]},
    {id:'klen',label:'Key length to test',type:'range',min:1,max:8,step:1,def:1,unit:' letters',lvl:'ap',modes:['vig']},
    {id:'col',label:'Key letter (column) to solve',type:'range',min:1,max:8,step:1,def:1,unit:'',lvl:'ap',modes:['vig']},
    {id:'cshift',label:'Shift for this column',type:'range',min:0,max:25,step:1,def:0,unit:'',lvl:'ap',modes:['vig'],help:'Slide until the purple bars line up with the green English outline.'}
  ],
  actions:[
    {id:'extract',label:'Extract the hidden bits',lvl:'bio',primary:true,modes:['investigate'],run(sim){const p=sim.p,ch=CH[p.channel]||0,pl=planeN(sim);sim.st.inv.ext={ch,plane:pl,bytes:extract(invPosted(),ch,pl,0,120)};sim.st.anim=0.001;}},
    {id:'hide',label:'Hide my message',lvl:'bio',primary:true,modes:['hide'],run(sim){hideMsg(sim);}},
    {id:'readback',label:'Read it back',lvl:'bio',modes:['hide'],run(sim){const st=sim.st,img=st.hidden?st.hidden.img:photo('peaks');st.read={bytes:extract(img,CH[sim.p.channel]||0,0,bitsN(sim),80),ch:sim.p.channel,bits:bitsN(sim)};st.anim=0.001;}},
    {id:'restore',label:'Restore the original',lvl:'bio',modes:['hide'],run(sim){sim.st.hidden=null;sim.st.read=null;}},
    {id:'auto',label:'Map by frequency order',lvl:'honors',modes:['subst'],run(sim){const r=subRanked(sim),m={};r.forEach((x,i)=>{if(x.n>0)m[x.l]=ENG_ORDER[i];});sim.st.map=m;sim.st.check=null;}},
    {id:'clearmap',label:'Clear my letter map',lvl:'honors',modes:['subst'],run(sim){sim.st.map={};sim.st.check=null;}},
    {id:'newkey',label:'New secret key',lvl:'honors',modes:['subst'],run(sim){sim.st.subSeed++;sim.st.map={};sim.st.sel=null;sim.st.check=null;}}
  ],
  init(sim){return {inv:{diff:false,found:false,ext:null,ans:null},anim:0,hidden:null,read:null,msg:'LAB NOTES ARE IN LOCKER 12',ctext:'THE EVIDENCE IS IN THE LOCKER',
    subSeed:18,map:{},sel:null,check:null,vshift:[0,0,0,0,0,0,0,0],hver:0};},
  step(sim,dt){const st=sim.st;if(st.anim>0){st.anim+=dt/1.4;if(st.anim>=1)st.anim=0;}},
  metrics:[
    {id:'chg',label:'Pixels changed',unit:'of 6,144',lvl:'bio',min:0,max:6144,d:0,modes:['investigate','hide'],get:s=>stats(s).changed},
    {id:'maxd',label:'Largest change in a value',unit:'of 255',lvl:'bio',min:0,max:16,d:0,modes:['investigate','hide'],get:s=>stats(s).maxd},
    {id:'cap',label:'Room for a message',unit:'characters',lvl:'honors',min:0,max:null,d:0,modes:['hide'],get:s=>Math.floor(N*bitsN(s)/8)-1},
    {id:'psnr',label:'Image quality (PSNR)',unit:'',lvl:'ap',text:true,modes:['investigate','hide'],get:s=>{const v=stats(s).psnr;return Number.isFinite(v)?v.toFixed(1)+' dB':'identical';}},
    {id:'recov',label:'Recovered text',unit:'',lvl:'bio',text:true,modes:['investigate'],noTrial:true,get:s=>{const e=s.st.inv.ext;if(!e)return 'not extracted yet';const t=printable(e.bytes);return t.length>34?t.slice(0,34)+'…':t||'(nothing)';}},
    {id:'keys',label:'Keys to try by brute force',unit:'shifts',lvl:'bio',min:0,max:25,d:0,modes:['caesar'],get:()=>25},
    {id:'amap',label:'The shift sends',unit:'',lvl:'bio',text:true,modes:['caesar'],get:s=>{const k=shiftN(s);return s.p.dir==='dec'?A[k]+' back to A':'A to '+A[k];}},
    {id:'mapped',label:'Letters you have mapped',unit:'of 23 used',lvl:'honors',min:0,max:23,d:0,modes:['subst'],get:s=>{subCipher(s);return Object.keys(s.st.map).filter(c=>s.st.subCounts[idx(c)]>0).length;}},
    {id:'topc',label:'Most common cipher letter',unit:'',lvl:'honors',text:true,modes:['subst'],get:s=>{const r=subRanked(s)[0];return r.l+' ('+(r.n/315*100).toFixed(1)+'% of letters)';}},
    {id:'space',label:'Possible substitution keys',unit:'',lvl:'ap',text:true,modes:['subst'],noTrial:true,get:()=>'26! ≈ 4.0 × 10²⁶'},
    {id:'ic',label:'Average IC at this key length',unit:'',lvl:'ap',min:0,max:0.08,d:3,modes:['vig'],get:s=>IC_BY_L[klenN(s)-1]},
    {id:'chi',label:'χ² for this column vs English',unit:'',lvl:'ap',min:0,max:null,d:0,modes:['vig'],get:s=>chi2(counts(caesar(vigColumns(klenN(s))[colN(s)-1],-mod(Math.round(s.p.cshift||0),26))))},
    {id:'vkey',label:'Key so far',unit:'',lvl:'ap',text:true,modes:['vig'],get:s=>vigKey(s)}
  ],
  graphs:[{id:'freq',label:'Letter frequencies',lvl:'bio',custom:true},{id:'delta',label:'Pixel changes',lvl:'bio',custom:true}],
  defaultGraph:'freq',
  plot(sim,ctx,box,id){const p=sim.p,st=sim.st,mid=(s)=>txt(ctx,s,box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});
    if(id==='delta'){if(p.mode!=='investigate'&&p.mode!=='hide'){mid('Switch to Investigate or Hide a message to see pixel changes.');return;}
      const s=stats(sim),ch=p.channel,keys=Object.keys(s.hist).map(Number).filter(d=>d!==0);
      if(!keys.length){mid('No '+CHN[ch]+' values changed. '+(p.mode==='hide'?'Hide a message first.':'Try another color.'));return;}
      const m=Math.max(1,...keys.map(Math.abs)),cats=[];for(let d=-m;d<=m;d++)if(d!==0)cats.push(d);
      const vals=cats.map(d=>s.hist[d]||0);const ax=axes(ctx,box,{xmin:0,xmax:cats.length,ymin:0,ymax:Math.max(...vals)*1.2,xcats:cats.length>12?cats.map(d=>d%4===0?String(d):''):cats.map(d=>(d>0?'+':'')+d),xl:'Change in '+CHN[ch]+' value (unchanged pixels left out)',yl:'Pixels'});
      bars(ctx,ax,vals,{colors:[serColor(1)]});
      txt(ctx,(s.hist[0]||0).toLocaleString()+' '+CHN[ch]+' values did not change at all',box.L+box.W-6,box.T+12,{s:13,c:PAL['muted'],a:'right'});return;}
    let text,label;
    if(p.mode==='hide'){mid('Switch to a cipher part to compare letter frequencies.');return;}
    if(p.mode==='investigate'){if(!st.inv.ext){mid('Extract the hidden bits first.');return;}text=printable(st.inv.ext.bytes);label='extracted text';}
    else if(p.mode==='caesar'){text=st.ctext||'';if(p.dir!=='dec')text=caesar(text,shiftN(sim));label=p.dir==='dec'?'text you typed':'cipher text';}
    else if(p.mode==='subst'){text=subCipher(sim);label='cipher text';}
    else{text=VIG_CIPHER;label='Vigenère cipher text';}
    const c=counts(text),Nn=c.reduce((a,b)=>a+b,0);if(!Nn){mid('Type some letters to count.');return;}
    const pc=c.map(v=>v/Nn*100),ymax=Math.max(13,...pc)*1.1;const ax=axes(ctx,box,{xmin:0,xmax:26,ymin:0,ymax,xcats:A.split(''),xl:'Letter ('+Nn+' letters counted)',yl:'% of letters'});
    const w=box.W/26;ctx.fillStyle=serColor(1);pc.forEach((v,i)=>{ctx.fillRect(ax.X(i)+w*0.18,ax.Y(v),w*0.64,ax.Y(0)-ax.Y(v));});
    ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2;ENG.forEach((v,i)=>{ctx.strokeRect(ax.X(i)+w*0.08,ax.Y(v),w*0.84,ax.Y(0)-ax.Y(v));});
    legend(ctx,box.L+12,box.T+8,[{label,color:serColor(1)},{label:'English',color:PAL['s3']}]);},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='investigate'){const iv=st.inv,e=iv.ext,s=stats(sim);
      if(e&&invRightPlane(e)){if(invSolved(sim))return '<b>Shift 7 unlocks it:</b> “'+INV_PLAIN.slice(0,46)+'…” Now answer the case question in the case file.';
        return 'The bits from red plane 0 spell letters, but not words: the text was also <b>scrambled with a Caesar cipher</b>. Slide the shift until it reads as English (now trying '+shiftN(sim)+').';}
      if(e)return 'Those '+CHN[Object.keys(CH)[e.ch]]+' plane '+e.plane+' bits decode to gibberish, so nothing readable is hidden there. Find the plane with the pattern, then extract again.';
      if(p.view==='diff')return '<b>'+s.changed+' pixels</b> changed between the camera original and the posted copy, each by at most '+s.maxd+' out of 255. The changes sit in a band across the top rows, not scattered like noise. Someone wrote data there.';
      if(p.view==='plane'){const pl=planeN(sim);
        if(p.channel==='R'&&pl===0)return '<b>Red bit plane 0 shows a striped band across the top rows.</b> Natural sensor noise in the lowest bit looks like static. Text makes stripes, because every letter byte starts with a 0 bit. Extract the bits.';
        if(pl>=5)return 'High bit planes carry the picture itself: bit '+pl+' is worth '+(1<<pl)+', so it outlines the sky, sun and pier. Hidden data goes in the low planes, where a change is too small to see.';
        return CHN[p.channel].charAt(0).toUpperCase()+CHN[p.channel].slice(1)+' bit plane '+pl+' looks like random static from the camera sensor. No pattern here, so try another color or plane.';}
      return 'The posted photo and the camera original look identical to your eye. <b>Change View to Difference</b> to compare them pixel by pixel'+(hon?', or check the bit planes one color at a time.':'.');}
    if(p.mode==='hide'){const s=stats(sim),nb=bitsN(sim);
      if(!st.hidden)return 'Type a message in the panel below the stage and press <b>Hide my message</b>. Each character becomes 8 bits, written into the lowest '+(nb>1?nb+' bits':'bit')+' of the '+CHN[p.channel]+' values.';
      return 'Your '+st.hidden.len+' characters changed <b>'+s.changed+' pixels</b>, each by at most '+s.maxd+'. '+(s.maxd<=1?'A change of 1 out of 255 is far below what your eye can see.':s.maxd<=3?'Still very hard to see.':'With '+st.hidden.bits+' bits per pixel the top rows start to look grainy: more room costs more visible change.')+(ap&&Number.isFinite(s.psnr)?' PSNR '+s.psnr.toFixed(1)+' dB.':'');}
    if(p.mode==='caesar'){const k=shiftN(sim);
      return 'Every letter moves <b>'+k+' places</b> along the alphabet, wrapping from Z back to A. '+(k===0?'A shift of 0 changes nothing.':'Because there are only 25 useful shifts, anyone can try them all in a minute: a Caesar cipher hides nothing from an investigator.');}
    if(p.mode==='subst'){const mapped=Object.keys(st.map).length,top=subRanked(sim)[0];
      if(!mapped)return 'Each letter was swapped for another by a secret key, so there are 26! possible keys, far too many to try. But the swap keeps letter frequencies: <b>'+top.l+' is the most common cipher letter</b>, so it probably stands for E.';
      return 'You have mapped '+mapped+' letters. Look for short words: a one-letter word is A or I, and a common three-letter word is often THE or AND. '+(st.check?st.check.msg:'');}
    const L=klenN(sim),ic=IC_BY_L[L-1];
    return 'With key length '+L+', each column was shifted by a single letter, so its IC should look like English (0.066) if '+L+' is right. Here the average is <b>'+ic.toFixed(3)+'</b>'+(ic>0.058?': the columns look like English, so the key length is '+L+' (or a multiple).':': closer to random letters (0.038), so this is not the key length.');},
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');const mono='font-family:'+MONO.replace(/"/g,'&quot;')+';white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px;line-height:1.5';
    const box=(s,c)=>'<p style="'+mono+';background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 10px'+(c?';color:'+c:'')+'">'+s+'</p>';
    if(p.mode==='investigate'){const iv=st.inv,e=iv.ext,ok=invRightPlane(e),solved=invSolved(sim);
      const step=(done,s)=>'<li style="margin:2px 0">'+(done?'<b style="color:var(--good)">✓</b> ':'○ ')+s+'</li>';
      let h='<div class="p-head"><h3>Case file: the harbor photo</h3></div><p>Detectives think Dex Marlow (fictional) passes messages to a partner by posting photos on PhotoBoard, a made-up photo site. With a warrant, they copied the original photo from Marlow’s camera card. Does the posted copy hide anything?</p><ol style="padding-left:20px;margin:0 0 8px">'+
        step(iv.diff,'Compare the posted photo with the camera original (View: Difference).')+step(iv.found,'Find the color and bit plane that hold a pattern (View: Bit plane).')+step(ok,'Extract the bits from that plane.')+step(solved,'Decode the text: slide the Caesar shift.')+step(iv.ans===0,'Answer: where and when is the meeting?')+'</ol>';
      if(e){h+='<p><b>Extracted from '+CHN[Object.keys(CH)[e.ch]]+' plane '+e.plane+':</b></p>'+box(esc(printable(e.bytes))||'(empty)');
        if(ap)h+='<p style="'+mono+';font-size:13px">'+e.bytes.slice(0,12).map(v=>v.toString(16).toUpperCase().padStart(2,'0')).join(' ')+' …</p>';
        if(ok)h+='<p><b>Decoded with shift '+shiftN(sim)+':</b></p>'+box(esc(invDecoded(sim)),solved?'var(--good)':'');}
      if(solved){const Q=['Pier 9, Friday at 6 PM','Pier 6, Friday at 9 PM','The harbor gate, Saturday at 6 AM'];
        h+='<p><b>Where and when is the meeting?</b></p><div style="display:flex;flex-wrap:wrap;gap:6px">'+Q.map((q,i)=>'<button type="button" class="btn'+(iv.ans===i?' primary':'')+'" data-ans="'+i+'">'+q+'</button>').join('')+'</div>';
        if(iv.ans!==null)h+='<p class="verdict '+(iv.ans===0?'ok':'no')+'" style="margin-top:8px">'+(iv.ans===0?'Correct.':'Not quite.')+'</p><p>'+(iv.ans===0?'The decoded note says Pier 9, Friday, 6 PM. In a report you would state how you found it: red channel, bit plane 0, Caesar shift 7, and keep the hashes of both photo files.':'Read the decoded text again: the numbers were never encrypted, because a Caesar cipher only shifts letters.')+'</p>';}
      if(hon)h+='<p style="font-size:14px;color:var(--muted)">Why stripes? Letters and spaces are ASCII bytes from 32 to 90, so their first bit is always 0. The photo is 96 pixels wide, a multiple of 8, so those 0 bits line up in columns.</p>';
      return h;}
    if(p.mode==='hide'){const r=st.read;let h='<div class="p-head"><h3>Hide your own message</h3></div><p>Type up to 60 characters. Nothing you type is stored or sent anywhere.</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label for="stego-msg" style="font-weight:600">Message</label><input id="stego-msg" class="sel" maxlength="60" autocomplete="off" style="flex:1 1 160px;min-width:0;font-size:16px;padding:6px 10px" value="'+esc(st.msg)+'"><button type="button" class="btn primary" id="stego-hidebtn">Hide it</button></div>'+
      '<p id="stego-msgn" style="font-size:14px;color:var(--muted);margin-top:6px">'+msgInfo(sim)+'</p>';
      if(st.hidden)h+='<p>Hidden: '+st.hidden.len+' characters in the '+CHN[st.hidden.ch]+' channel, '+st.hidden.bits+' bit'+(st.hidden.bits>1?'s':'')+' per pixel, ending with a 0 byte so a reader knows where to stop.</p>';
      if(r){const t=printable(r.bytes);h+='<p><b>Read back from '+CHN[r.ch]+', lowest '+r.bits+' bit'+(r.bits>1?'s':'')+':</b></p>'+box(esc(t)||'(nothing)')+(st.hidden&&(r.ch!==st.hidden.ch||r.bits!==st.hidden.bits)?'<p>That does not match how you hid it, so the bits come out as gibberish. The reader must know the method: the method is the real secret.</p>':'');}
      if(ap)h+='<p style="font-size:14px;color:var(--muted)">LSB hiding is not encryption. Anyone who guesses the method reads the message. Real tools encrypt first (for example with AES), so the hidden bits look random even when found.</p>';
      return h;}
    if(p.mode==='caesar'){const dec=p.dir==='dec',k=shiftN(sim);let h='<div class="p-head"><h3>Caesar cipher</h3></div><p>'+(dec?'Paste or type cipher text, then slide the shift until it reads as English.':'Type a message and pick a shift. Only letters move; spaces, numbers and punctuation stay put.')+'</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label for="stego-ctext" style="font-weight:600">'+(dec?'Cipher text':'Message')+'</label><input id="stego-ctext" class="sel" maxlength="80" autocomplete="off" style="flex:1 1 180px;min-width:0;font-size:16px;padding:6px 10px" value="'+esc(st.ctext)+'"></div>'+
      '<p style="margin-top:8px"><b>'+(dec?'Plain text':'Cipher text')+' (shift '+k+'):</b></p><div id="stego-cout">'+box(esc(dec?caesar(st.ctext,-k):caesar(st.ctext,k)))+'</div>';
      if(hon)h+='<details id="stego-brute"'+(st.bruteOpen?' open':'')+'><summary style="cursor:pointer;font-weight:600">Brute force: decode with all 25 shifts</summary><div id="stego-brutelist">'+bruteList(sim)+'</div></details>';
      return h;}
    if(p.mode==='subst'){const r=subRanked(sim).filter(x=>x.n>0),sel=st.sel||r[0].l;let h='<div class="p-head"><h3>Break a substitution cipher</h3></div><p>An intercepted note (fictional). Each plain letter was swapped for a different letter by a secret key. Mapped letters show in capitals; letters you have not solved stay in lowercase.</p>'+
      box(esc(subDecoded(sim)))+'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label for="stego-cl" style="font-weight:600">Cipher letter</label><select id="stego-cl" class="sel">'+r.map(x=>'<option value="'+x.l+'"'+(x.l===sel?' selected':'')+'>'+x.l+' ('+x.n+')</option>').join('')+'</select>'+
      '<label for="stego-pl" style="font-weight:600">stands for</label><select id="stego-pl" class="sel"><option value="">(none)</option>'+A.split('').map(l=>'<option value="'+l+'"'+(st.map[sel]===l?' selected':'')+'>'+l+'</option>').join('')+'</select>'+
      '<button type="button" class="btn primary" id="stego-map">Map it</button><button type="button" class="btn" id="stego-check">Check my key</button></div>'+(st.check?'<p style="margin-top:8px">'+st.check.msg+'</p>':'');
      return h;}
    const key=vigKey(sim),L=klenN(sim);let h='<div class="p-head"><h3>Break a Vigenère cipher</h3></div><p>A fictional evidence memo, encrypted with a keyword. Letter 1 is shifted by the first key letter, letter 2 by the second, and so on, repeating. That flattens the letter frequencies, so first find the key length, then solve each column like a Caesar cipher.</p>'+
      '<p><b>Cipher text:</b></p>'+box(esc(VIG_CIPHER.slice(0,140))+'…')+'<p><b>Decrypted with key '+key+':</b></p>'+box(esc(vigenere(VIG_CIPHER,key,-1).slice(0,140))+'…',key===VIG_KEY?'var(--good)':'');
    if(key===VIG_KEY)h+='<p class="verdict ok">Correct.</p><p>The key is TRACE. Every column now matches English, and the memo reads clearly.</p>';
    return h;},
  bindInfo(sim,el){const st=sim.st;
    el.querySelectorAll('[data-ans]').forEach(b=>b.addEventListener('click',()=>{st.inv.ans=+b.dataset.ans;BioLab.refresh(sim);}));
    const m=el.querySelector('#stego-msg');if(m){m.addEventListener('input',()=>{st.msg=m.value;const n=el.querySelector('#stego-msgn');if(n)n.innerHTML=msgInfo(sim);});
      const go=()=>{st.msg=m.value;hideMsg(sim);sim.vis.refocus='stego-msg';BioLab.refresh(sim);};m.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});el.querySelector('#stego-hidebtn').addEventListener('click',go);}
    const c=el.querySelector('#stego-ctext');if(c)c.addEventListener('input',()=>{st.ctext=c.value;const k=shiftN(sim),o=el.querySelector('#stego-cout');
      if(o)o.innerHTML='<p style="font-family:'+MONO.replace(/"/g,'&quot;')+';white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px;line-height:1.5;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:6px 10px">'+esc(sim.p.dir==='dec'?caesar(st.ctext,-k):caesar(st.ctext,k))+'</p>';
      const bl=el.querySelector('#stego-brutelist');if(bl)bl.innerHTML=bruteList(sim);});
    const d=el.querySelector('#stego-brute');if(d)d.addEventListener('toggle',()=>{st.bruteOpen=d.open;});
    const cl=el.querySelector('#stego-cl'),pl=el.querySelector('#stego-pl');
    if(cl){cl.addEventListener('change',()=>{st.sel=cl.value;pl.value=st.map[cl.value]||'';});
      el.querySelector('#stego-map').addEventListener('click',()=>{mapLetter(sim,cl.value,pl.value);BioLab.refresh(sim);});
      el.querySelector('#stego-check').addEventListener('click',()=>{const ks=Object.keys(st.map),right=ks.filter(c=>subTruth(sim,c)===st.map[c]).length;
        st.check={msg:ks.length?'<b>'+right+' of your '+ks.length+' mappings are right.</b> '+(right===ks.length&&ks.length>=20?'The note is decoded.':'Fix the wrong ones by testing them against the words around them.'):'Map some letters first.'};BioLab.refresh(sim);});}
    if(sim.vis.refocus){const f=el.querySelector('#'+sim.vis.refocus);sim.vis.refocus=null;if(f)f.focus();}},
  onClick(sim,x,y){if(sim.p.mode!=='subst')return;const h=(sim.vis.hits||[]).find(h=>x>=h.r[0]&&x<=h.r[0]+h.r[2]&&y>=h.r[1]&&y<=h.r[1]+h.r[3]);if(!h)return;
    if(h.k==='c')sim.st.sel=h.l;else if(sim.st.sel)mapLetter(sim,sim.st.sel,h.l);},
  tour:[
    {title:'An ordinary photo?',text:'A suspect posted this harbor photo. Investigators also have the original from the suspect’s camera card. Side by side, the two look the same.',focus:[[18,16,366,266],[416,16,366,266]],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{mode:'investigate',view:'image',channel:'G',plane:0});}},
    {title:'Pixels are numbers',text:{bio:'Every pixel stores three numbers from 0 to 255: how much red, green and blue. Each number is 8 bits. The lowest bit changes the value by only 1.',ap:'Each value is one byte: 8 bits worth 128, 64, 32, 16, 8, 4, 2 and 1. Bit 0, the least significant bit, is worth 1.'},focus:[16,282,768,160],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{channel:'R'});}},
    {title:'Compare the two files',text:'The Difference view marks every pixel that is not identical. Only the top rows changed, each by 1 out of 255: far too small to see, but not random.',focus:[416,16,366,266],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{view:'diff'});}},
    {title:'Look at one bit plane',text:'This view shows only bit 0 of every red value: white for 1, black for 0. Camera noise makes static. The hidden text makes stripes across the top.',focus:[416,16,366,266],speed:1,pause:true,setup(sim){BioLab.setValues(sim,{view:'plane',channel:'R',plane:0});}},
    {title:'Read the bits as letters',text:'Take bit 0 of each pixel in order. Every 8 bits make one byte, and each byte is a character code. The message comes out letter by letter, but it is scrambled.',focus:[16,282,768,160],speed:0.5,setup(sim){sim.def.actions.find(a=>a.id==='extract').run(sim);sim.infoDirty=true;}},
    {title:'Caesar cipher',text:'The suspect also shifted every letter by the same amount. The wheel shows the shift: outer ring plain, inner ring cipher. With only 25 shifts, trying them all takes a minute.',focus:[10,34,410,406],speed:1,setup(sim){BioLab.setValues(sim,{mode:'caesar',shift:7,dir:'enc'});}},
    {lvl:'honors',title:'Frequency analysis',text:'A substitution cipher swaps letters with a secret key. There are too many keys to try, but E is still the most common letter, so the tallest cipher bar probably means E.',focus:[20,10,760,250],speed:1,setup(sim){BioLab.setValues(sim,{mode:'subst'});}},
    {lvl:'ap',title:'Vigenère and key length',text:'A keyword shifts each letter by a different amount, which flattens the frequencies. Split the text into columns for each key length: at the right length, every column looks like English, and the IC jumps.',focus:[14,10,380,232],speed:1,setup(sim){BioLab.setValues(sim,{mode:'vig',klen:5});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'investigate',view:'image',channel:'G',plane:0,shift:3,klen:1,col:1,cshift:0});BioLab.reset(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.after)ch.after(sim);}},
  challenges:[
    {lvl:'bio',q:'You hide a short message in the lowest bit of the red values. Compared with the original, the photo will…',choices:['look grainy where the message is','look exactly the same to your eye','turn slightly redder'],correct:1,
     baseline:{mode:'hide',view:'image',channel:'R',bits:1},changeAction:'hide',changeText:'Message hidden in red bit 0',watch:'delta',
     explain:{bio:'Each red value changed by at most 1 out of 255, and only about half of the message’s pixels changed at all (the rest already had the right bit). The Pixels changed and Largest change tiles show it. Your eye cannot see a 1-in-255 step.'}},
    {lvl:'bio',instant:true,set:{mode:'caesar',shift:7,dir:'enc'},q:'How many different keys does an investigator need to try to break any Caesar cipher by brute force?',choices:['25','26 × 26 = 676','about a million'],correct:0,
     explain:{bio:'There are 26 shifts, and a shift of 0 leaves the text unchanged, so 25 real keys. The model now shows a shift of 7; the Keys to try tile reads 25. That is why a Caesar cipher hides nothing from an investigator.'}},
    {lvl:'bio',instant:true,set:{mode:'investigate',view:'plane',channel:'G',plane:0},q:'Bit plane 0 of the green values looks like random static. Does that prove nothing is hidden anywhere in the photo?',choices:['Yes, the photo is clean','No, the red or blue plane could still hold data'],correct:1,
     explain:{bio:'Each color has its own bit planes. Green plane 0 is clean here, but switch Color to Red: the striped band shows the hidden message is in the red values. Check every color before you rule a file out.'}},
    {lvl:'honors',instant:true,set:{mode:'subst'},q:'In a long English message encrypted with a substitution cipher, the most common cipher letter most likely stands for…',choices:['E','A','The same letter, since substitution keeps letters'],correct:0,
     explain:{honors:'E makes up about 12.7% of English letters. The model now shows the note’s frequencies: the tallest cipher bar really does stand for E in this note (press Check my key after mapping it). Substitution changes which letter you see, not how often it appears.'}},
    {lvl:'honors',q:'You hide the same message using 4 bits per pixel instead of 1. The largest change to a pixel value becomes…',choices:['still at most 1','up to 15','up to 255'],correct:1,
     baseline:{mode:'hide',view:'diff',channel:'R',bits:4},changeAction:'hide',changeText:'Message hidden in the lowest 4 bits',watch:'delta',
     explain:{honors:'The lowest 4 bits are worth 8 + 4 + 2 + 1 = 15, so a value can now change by up to 15. Check the Largest change tile. The message fits in fewer pixels, but each change is bigger and easier to spot.'}},
    {lvl:'ap',instant:true,set:{mode:'investigate',view:'plane',channel:'R',plane:7},q:'Which bit plane of the red channel still shows the outline of the harbor scene?',choices:['Plane 0 (least significant bit)','Plane 7 (most significant bit)','Neither: bits are random'],correct:1,
     explain:{ap:'Bit 7 is worth 128, so it is 1 wherever red is above 127: the bright lower sky and the sun. The model now shows red plane 7. Plane 0 is worth only 1 and looks like noise, which is why data is hidden there.'}},
    {lvl:'ap',instant:true,set:{mode:'vig',klen:5,col:1,cshift:0},q:'The average index of coincidence of the columns is 0.044 for key length 4 and 0.074 for key length 5. The key length is most likely…',choices:['4','5','You cannot tell without the key'],correct:1,
     explain:{ap:'English text has IC ≈ 0.066 and random letters ≈ 0.038. At length 5 each column was shifted by one letter, so it keeps English statistics. The model now shows length 5, and the Kasiski spacings agree: most divide by 5. The key is TRACE.'}}
  ],
  lab:{bio:'<p><b>Question:</b> Can a photo hide a message you cannot see?</p><ol><li>In Investigate, compare the two photos with Photos, then Difference. Record how many pixels changed and the largest change.</li><li>Use Bit plane to check plane 0 of red, green and blue. Which one shows a pattern?</li><li>Extract the bits from that plane and decode them with the Caesar shift.</li><li>In Hide a message, hide your own message and record the same two numbers. Press Record trial.</li></ol><p>Explain why an investigator compares files bit by bit instead of trusting their eyes.</p>',
       honors:'<p><b>Question:</b> How does the number of hidden bits per pixel change what an investigator can detect?</p><ol><li>In Hide a message, hide the same message with 1, 2, 3 and 4 bits per pixel. Record a trial each time.</li><li>For each, note Pixels changed, Largest change and Room for a message.</li><li>Then break the substitution note: map the most common cipher letters first and check your key.</li></ol><p>Describe the trade-off between capacity and how easy the change is to see. Why does frequency analysis beat a key space of 26!?</p>',
       ap:'<p><b>Question:</b> How do you find a Vigenère key without knowing it?</p><ol><li>In Vigenère, step the key length from 1 to 8 and record the average IC for each.</li><li>Check the Kasiski spacings: which factor appears most?</li><li>At the right length, solve each column by sliding its shift to minimize χ². Record each key letter.</li><li>In Hide a message, record PSNR for 1 to 4 bits per pixel.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why both the IC and the Kasiski test point to the same key length, and why neither works against a modern cipher such as AES.</p>'},
  terms:[{t:'Steganography',d:'Hiding the fact that a message exists, for example inside a photo.'},{t:'Cipher',d:'A method that scrambles a message so only someone with the key can read it.'},{t:'Caesar cipher',d:'Shift every letter the same number of places. Only 25 useful keys.'},
    {t:'Pixel',d:'One dot of a digital image, stored as red, green and blue values from 0 to 255.'},{t:'Bit',d:'A single 0 or 1. Eight bits make one byte.'},{t:'Least significant bit (LSB)',d:'The lowest bit of a value. Changing it changes the value by only 1.'},
    {lvl:'honors',t:'Bit plane',d:'An image made from one bit position of every pixel, shown as black (0) and white (1).'},{lvl:'honors',t:'Substitution cipher',d:'Each letter is replaced by another according to a key; 26! possible keys.'},{lvl:'honors',t:'Frequency analysis',d:'Breaking a cipher by matching how often cipher letters appear with how often letters appear in the language.'},{lvl:'honors',t:'ASCII',d:'The code that stores each character as a number, such as A = 65 and space = 32.'},
    {lvl:'ap',t:'Vigenère cipher',d:'A keyword sets a different Caesar shift for each letter position, repeating.'},{lvl:'ap',t:'Index of coincidence (IC)',d:'The chance that two letters picked from a text match: about 0.066 for English, 0.038 for random letters.'},{lvl:'ap',t:'Kasiski test',d:'Repeated groups of cipher letters tend to sit a multiple of the key length apart.'},{lvl:'ap',t:'χ² (chi-squared)',d:'A score for how far observed letter counts are from the counts English predicts. Lower means a better match.'},{lvl:'ap',t:'PSNR',d:'Peak signal-to-noise ratio, a measure of how close a changed image is to the original. Above about 40 dB the change is invisible.'}],
  about:'<p>The photos are generated in the page: 96 × 64 pixels of real 8-bit RGB values, with random sensor-like noise (about ±2) so the low bit planes look like static, as they do in real camera images. Hiding uses least-significant-bit (LSB) replacement: the message is converted to ASCII bytes plus a 0 byte at the end, and each bit, most significant first, overwrites the lowest bit (or bits) of one color in reading order. Extraction reverses this exactly. Real images are usually stored as JPEG, which would destroy LSB data; LSB hiding survives only in lossless formats such as PNG.</p><p>English letter frequencies are standard published values (E 12.7%, T 9.1%, A 8.2% …). The index of coincidence and χ² are computed from the actual cipher text. Every person, site and message is fictional. These classical ciphers are taught because they show how investigators reason about patterns. Modern encryption such as AES-128 has 2¹²⁸ keys and output that looks statistically random, so frequency analysis, Kasiski tests and bit-plane tricks do not work on it.</p>',
  initVis(sim){sim.vis.hits=[];},
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    if(p.mode==='investigate'||p.mode==='hide'){const r=drawImages(sim,ctx,k,t);drawStrip(sim,ctx,k,r.y+20*k+4);return;}
    if(p.mode==='caesar'){drawCaesar(sim,ctx,k,vdt);return;}
    if(p.mode==='subst'){drawSubst(sim,ctx,k);return;}
    drawVig(sim,ctx,k);},
  thumbSetup(sim){sim.p.view='plane';sim.p.channel='R';}
};
function msgInfo(sim){const n=String(sim.st.msg||'').length,cap=Math.floor(N*bitsN(sim)/8)-1;return n+' characters = '+(n+1)*8+' bits (with the end marker). Room in '+CHN[sim.p.channel]+' at '+bitsN(sim)+' bit'+(bitsN(sim)>1?'s':'')+' per pixel: '+cap+' characters.';}
function hideMsg(sim){const st=sim.st,p=sim.p,msg=String(st.msg||'').slice(0,60),ch=CH[p.channel]||0,b=bitsN(sim);st.hver++;
  st.hidden={img:embed(photo('peaks'),asciiBytes(msg),ch,b),len:msg.length,ch:p.channel,bits:b,ver:st.hver+'-'+ch+b};st.read=null;st.anim=0;}
function mapLetter(sim,c,l){const m=sim.st.map;if(!c)return;Object.keys(m).forEach(k=>{if(m[k]===l)delete m[k];});if(l)m[c]=l;else delete m[c];sim.st.sel=c;sim.st.check=null;}
function bruteList(sim){const s=String(sim.st.ctext||'').toUpperCase().slice(0,28),dec=sim.p.dir==='dec',src=dec?s:caesar(s,shiftN(sim));let best=-1,bi=0;const rows=[];
  for(let k=1;k<26;k++){const t=caesar(src,-k),sc=englishScore(t);if(sc>best){best=sc;bi=k;}rows.push([k,t]);}
  return '<p style="font-family:'+MONO.replace(/"/g,'&quot;')+';font-size:13px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:6px">'+rows.map(r=>(r[0]===bi&&best>0?'<b style="color:var(--good)">':'')+String(r[0]).padStart(2,' ')+'  '+esc(r[1])+(r[0]===bi&&best>0?'  ← reads as English</b>':'')).join('\n')+'</p>';}
SIM.controls.forEach(c=>{c.onChange=c.id==='klen'?(sim=>{const L=klenN(sim);if(Math.round(sim.p.col)>L)BioLab.setValues(sim,{col:L});changed(sim);})
  :c.id==='col'?(sim=>{if(sim.st){const v=sim.st.vshift[colN(sim)-1];if(Math.round(sim.p.cshift)!==v){sim.p.cshift=v;if(sim.ui.ctl&&sim.ui.ctl.cshift)sim.ui.ctl.cshift.set(v);}}changed(sim);})
  :c.id==='cshift'?(sim=>{if(sim.st)sim.st.vshift[colN(sim)-1]=mod(Math.round(sim.p.cshift||0),26);changed(sim);})
  :changed;});
SIM.onLevel=syncMode;
BioLab.register(SIM);
})();

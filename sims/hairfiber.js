(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText}=BioLab.h;
const TAU=Math.PI*2;

/* ---------- reference data ----------
   Hairs: classroom reference values (Saferstein; FBI "Forensic Human Hair Examination Guidelines", SWGMAT 2005).
   d = typical shaft diameter (µm); mi = medullary index (medulla width / shaft width). */
const SP={
  human:{l:'Human (head)',d:70,mi:0.16,med:'frag',sc:'imb',pig:'even',col:[112,74,42]},
  dog:{l:'Dog',d:85,mi:0.62,med:'cont',sc:'imbw',pig:'central',col:[156,118,74]},
  cat:{l:'Cat',d:60,mi:0.55,med:'pearls',sc:'spin',pig:'central',col:[128,124,116]},
  deer:{l:'Deer',d:180,mi:0.9,med:'lattice',sc:'imbw',pig:'central',col:[146,114,82]},
  mouse:{l:'Mouse',d:30,mi:0.72,med:'ladder',sc:'cor',pig:'central',col:[112,102,92]},
  rabbit:{l:'Rabbit',d:50,mi:0.8,med:'multi',sc:'spin',pig:'central',col:[152,138,118]}};
const MEDN={none:'absent',frag:'fragmented (broken pieces)',cont:'continuous',pearls:'beaded, like a string of pearls',ladder:'ladder (one row of cells)',multi:'ladder (several rows of cells)',lattice:'lattice, fills the shaft'};
const MEDS={none:'absent',frag:'fragmented',cont:'continuous',pearls:'beaded',ladder:'ladder',multi:'multi-row ladder',lattice:'lattice'};
const SCN={imb:'imbricate: flat, smooth, overlapping',imbw:'imbricate: flat with wavy edges',cor:'coronal: crown-like rings',spin:'spinous: pointed petals'};
const SCS={imb:'imbricate',imbw:'imbricate (wavy)',cor:'coronal',spin:'spinous'};
const HCOL={brown:[112,74,42],dark:[60,40,28],blonde:[196,160,96],black:[40,32,28]};
/* Fibers: refractive indices parallel / perpendicular to the fiber axis (approximate, Robertson & Grieve, Forensic Examination of Fibres). Burn behavior: standard burn-test tables. */
const FIB={
  cotton:{l:'Cotton',cls:'Natural: plant',look:'flat, twisted ribbon',d:16,np:1.578,nv:1.532,near:'does not shrink away',inF:'burns fast, yellow flame',out:'keeps glowing',smell:'burning paper',res:'soft gray ash',melt:false,col:[236,232,218]},
  wool:{l:'Wool',cls:'Natural: animal',look:'scaly, crimped cylinder',d:25,np:1.557,nv:1.547,near:'curls away',inF:'burns slowly, sputters',out:'goes out by itself',smell:'burning hair',res:'crushable black ash',melt:false,col:[232,222,196]},
  silk:{l:'Silk',cls:'Natural: animal',look:'fine smooth strand, no inner structure',d:12,np:1.591,nv:1.538,near:'curls away',inF:'burns slowly',out:'goes out by itself',smell:'burning hair',res:'crushable black bead',melt:false,col:[240,234,214]},
  rayon:{l:'Rayon',cls:'Regenerated: made from wood pulp',look:'smooth rod with lengthwise lines',d:18,np:1.539,nv:1.519,near:'does not shrink away',inF:'burns fast',out:'keeps glowing',smell:'burning paper',res:'little soft ash',melt:false,col:[234,234,230]},
  nylon:{l:'Nylon',cls:'Synthetic',look:'smooth, glassy rod',d:20,np:1.582,nv:1.519,near:'melts and shrinks away',inF:'burns slowly and melts',out:'usually goes out',smell:'like celery',res:'hard cream bead',melt:true,bead:'#e8dfc4',col:[236,236,232]},
  polyester:{l:'Polyester',cls:'Synthetic',look:'smooth rod with tiny specks',d:18,np:1.720,nv:1.537,near:'melts and shrinks away',inF:'melts, black smoke',out:'usually goes out',smell:'sweet chemical smell',res:'hard black bead',melt:true,bead:'#2a2a2e',col:[236,236,236]},
  acrylic:{l:'Acrylic',cls:'Synthetic',look:'smooth rod, faint lines',d:22,np:1.511,nv:1.514,near:'melts and shrinks away',inF:'burns fast, sputters, melts',out:'keeps burning',smell:'harsh, acrid',res:'hard black lump',melt:true,bead:'#2a2a2e',col:[238,236,232]}};
const FCOL={red:[196,40,52],blue:[44,82,188],green:[34,136,72]};
const bire=f=>FIB[f].np-FIB[f].nv;
const retard=f=>Math.abs(bire(f))*FIB[f].d*1000; // nm

/* ---------- cases (all fictional) ---------- */
const CASES={
  c1:{l:'Case 1: garden shed',story:'Someone broke into the Pinecrest Community Garden shed (fictional) through a window. A hair was caught on the latch and a red fiber was snagged on the frame.',
    hair:{sp:'dog'},fiber:{f:'acrylic',c:'red'},
    sus:[{n:'Suspect A',hair:{sp:'cat'},hl:'pet cat',fiber:{f:'wool',c:'red'},fl:'red sweater'},
         {n:'Suspect B',hair:{sp:'dog'},hl:'pet dog',fiber:{f:'acrylic',c:'red'},fl:'red fleece'},
         {n:'Suspect C',hair:{sp:'human',hc:'brown',tr:'natural'},hl:'own head hair',fiber:{f:'acrylic',c:'blue'},fl:'blue hoodie'}]},
  c2:{l:'Case 2: lab supply closet',story:'Supplies went missing from a locked lab closet at Lakeview Prep (fictional). A blonde hair and a blue fiber were found on the closet shelf.',
    hair:{sp:'human',hc:'blonde',tr:'bleached'},fiber:{f:'polyester',c:'blue'},
    sus:[{n:'Suspect A',hair:{sp:'human',hc:'dark',tr:'natural'},hl:'own head hair',fiber:{f:'polyester',c:'blue'},fl:'blue jacket'},
         {n:'Suspect B',hair:{sp:'human',hc:'blonde',tr:'bleached'},hl:'own head hair',fiber:{f:'cotton',c:'blue'},fl:'blue jeans'},
         {n:'Suspect C',hair:{sp:'human',hc:'blonde',tr:'bleached'},hl:'own head hair',fiber:{f:'polyester',c:'blue'},fl:'blue fleece'}]},
  c3:{l:'Case 3: bike shop window',story:'A window at Riverbend Cycles (fictional) was forced open. A cat hair and a green fiber were left on the sill.',
    hair:{sp:'cat'},fiber:{f:'nylon',c:'green'},
    sus:[{n:'Suspect A',hair:{sp:'cat'},hl:'pet cat',fiber:{f:'nylon',c:'green'},fl:'green rain jacket'},
         {n:'Suspect B',hair:{sp:'cat'},hl:'pet cat',fiber:{f:'polyester',c:'green'},fl:'green track jacket'},
         {n:'Suspect C',hair:{sp:'dog'},hl:'pet dog',fiber:{f:'nylon',c:'green'},fl:'green backpack'}]}};
const LET=['A','B','C'];
function hairSame(a,b){if(a.sp!==b.sp)return false;if(a.sp!=='human')return true;return a.hc===b.hc&&a.tr===b.tr;}
const fibSame=(a,b)=>a.f===b.f&&a.c===b.c;
function truth(cs,item,i){const C=CASES[cs],s=C.sus[i];return item==='hair'?hairSame(C.hair,s.hair):fibSame(C.fiber,s.fiber);}
function hairObj(h,p){const S=SP[h.sp];const o={sp:h.sp,d:S.d,mi:S.mi,med:S.med,sc:S.sc,pig:S.pig,col:S.col.slice(),treat:'natural',root:'pulled'};
  if(h.sp==='human'){o.col=HCOL[h.hc||'brown'].slice();o.treat=h.tr||'natural';}
  if(p&&p.root)o.root=p.root;return o;}
function hairName(h){if(h.sp!=='human')return SP[h.sp].l.toLowerCase()+' hair';return (h.tr==='bleached'?'bleached ':h.tr==='dyed'?'dyed ':'')+(h.hc==='dark'?'dark brown':h.hc)+' human hair';}
const fibName=f=>f.c+' '+FIB[f.f].l.toLowerCase();

/* ---------- show only what the current mode uses ---------- */
function vis(sim,c){if(!atLeast(c.lvl||'bio'))return false;if(c.modes&&!c.modes.includes(sim.p.mode))return false;if(c.show&&!c.show(sim))return false;return true;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def;
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(sim,c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(sim,m);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!vis(sim,a);});}

/* ---------- calls the student makes in the case ---------- */
function calls(sim){if(!sim._calls)sim._calls={};return sim._calls;}
const ckey=p=>p.cs+'|'+p.item+'|'+p.suspect;
function loadCall(sim){const v=calls(sim)[ckey(sim.p)]||'unsure';if(sim.p.call!==v)BioLab.setValues(sim,{call:v});syncMode(sim);sim.infoDirty=true;}

/* ---------- drawing helpers ---------- */
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBlock(ctx,lines,x,y,maxW,maxY,k){let ly=y;for(const L of lines){const sz=(L.s||13)*k;const ws=wrapLines(ctx,L.t,maxW,sz,L.w);for(const w of ws){if(ly+sz>maxY)return ly;ly+=sz*1.25;txt(ctx,w,x,ly-sz*0.25,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink']});}ly+=(L.gap||3)*k;}return ly;}
const rgb=(c,a)=>a===undefined?'rgb('+c.map(Math.round).join(',')+')':'rgba('+c.map(Math.round).join(',')+','+a+')';
const mix=(a,b,f)=>a.map((v,i)=>lerp(v,b[i],f));
const FIELD='#f3f0e6',LENS='#16171a',DK='#2a2622';

/* Hair shaft, drawn along +x in a frame already rotated; centered at y=0. */
function drawHairShaft(ctx,H,view,ppu,x0,x1,seed){const D=H.d*ppu,r=rng(seed),h=D/2;
  let cort=H.col.slice(),edge=mix(H.col,[40,30,20],0.35),gran=mix(H.col,[30,20,12],0.55),nGr=Math.round((x1-x0)*D/260);
  if(H.treat==='bleached'){cort=[232,214,160];edge=[196,170,110];gran=[200,170,110];nGr=Math.round(nGr*0.25);}
  if(H.treat==='dyed'){cort=mix(H.col,[150,40,40],0.5);edge=mix(cort,[30,10,10],0.35);gran=mix(cort,[30,10,10],0.4);nGr=Math.round(nGr*0.6);}
  if(view==='scales'){ // a scale cast: the cuticle's imprint, seen as lines
    ctx.fillStyle='#e9e6dc';ctx.fillRect(x0,-h,x1-x0,D);ctx.strokeStyle='#8a8478';ctx.lineWidth=1.5;ctx.strokeRect(x0,-h,x1-x0,D);
    ctx.save();ctx.beginPath();ctx.rect(x0,-h,x1-x0,D);ctx.clip();ctx.strokeStyle='#5d574d';ctx.lineWidth=1.3;
    const step=H.sc==='cor'?Math.max(7,D*0.5):H.sc==='spin'?Math.max(9,D*0.32):H.sc==='imb'?8.5:Math.max(7,Math.min(12,D*0.11));
    for(let x=x0-20,i=0;x<x1+20;x+=step*(0.85+0.3*r()),i++){
      if(H.sc==='imb'||H.sc==='imbw'){const amp=H.sc==='imb'?1.6:Math.max(3,D*0.05),ph=r()*TAU,sl=D*0.18;ctx.beginPath();
        for(let y=-h;y<=h+0.1;y+=Math.max(1.5,D/24)){const xx=x+sl*(y/h)+amp*Math.sin(y/D*TAU*(H.sc==='imb'?1.2:2.4)+ph);y===-h?ctx.moveTo(xx,y):ctx.lineTo(xx,y);}ctx.stroke();}
      else if(H.sc==='cor'){ctx.beginPath();const n=Math.max(3,Math.round(D/9));for(let j=0;j<=n;j++){const y=-h+D*j/n,xx=x+(j%2?step*0.35:0)+Math.abs(y)/h*step*0.5;j?ctx.lineTo(xx,y):ctx.moveTo(xx,y);}ctx.stroke();}
      else{const rows=D>36?2:1;for(let j=0;j<=rows;j++){const yc=-h+D*j/rows+(i%2?D/rows/2:0),pw=D/rows*0.62;if(Math.abs(yc)>h+pw)continue;ctx.beginPath();ctx.moveTo(x-step*0.3,yc-pw);ctx.quadraticCurveTo(x+step*0.7,yc-pw*0.55,x+step*1.25,yc);ctx.quadraticCurveTo(x+step*0.7,yc+pw*0.55,x-step*0.3,yc+pw);ctx.closePath();ctx.fillStyle='#ece9df';ctx.fill();ctx.stroke();}}}
    ctx.restore();return;}
  // transmitted light: cortex, pigment, medulla
  ctx.fillStyle=rgb(cort,H.treat==='natural'?0.55:0.75);ctx.fillRect(x0,-h,x1-x0,D);
  const cu=Math.max(2,4*ppu);ctx.fillStyle=rgb(edge,H.treat==='dyed'?0.75:0.35);ctx.fillRect(x0,-h,x1-x0,cu);ctx.fillRect(x0,h-cu,x1-x0,cu);
  ctx.strokeStyle=rgb(edge);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x0,-h);ctx.lineTo(x1,-h);ctx.moveTo(x0,h);ctx.lineTo(x1,h);ctx.stroke();
  ctx.fillStyle=rgb(gran,0.85);
  for(let i=0;i<nGr;i++){const x=x0+r()*(x1-x0);let y;if(H.pig==='central')y=clamp((r()+r()+r()-1.5)*0.55,-0.95,0.95)*h*0.8;else{const u=r()*2-1;y=Math.sign(u)*Math.pow(Math.abs(u),0.6)*(h-cu-1);}
    ctx.beginPath();ctx.ellipse(x,y,Math.max(1.6,2.6*ppu),Math.max(0.9,0.9*ppu),0,0,TAU);ctx.fill();}
  const M=H.mi*D/2;if(M<0.5||H.med==='none')return;ctx.fillStyle=DK;
  if(H.med==='frag'){for(let x=x0+r()*40;x<x1;){const L=18+r()*50;ctx.globalAlpha=0.85;rr(ctx,x,-M,L,2*M,M);ctx.fill();x+=L+20+r()*70;}ctx.globalAlpha=1;}
  else if(H.med==='cont'){ctx.globalAlpha=0.88;ctx.beginPath();for(let x=x0;x<=x1;x+=6)ctx.lineTo(x,-M+Math.sin(x*0.13)*M*0.12);for(let x=x1;x>=x0;x-=6)ctx.lineTo(x,M+Math.sin(x*0.11+1)*M*0.12);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
  else if(H.med==='pearls'){ctx.globalAlpha=0.85;const s=M*1.5;for(let x=x0;x<x1+s;x+=s){ctx.beginPath();ctx.ellipse(x,0,s*0.52,M,0,0,TAU);ctx.fill();}ctx.globalAlpha=1;}
  else if(H.med==='ladder'){ctx.globalAlpha=0.9;const s=Math.max(6,M*0.9);for(let x=x0;x<x1;x+=s){rr(ctx,x,-M,s-2.2,2*M,1.5);ctx.fill();}ctx.globalAlpha=1;}
  else if(H.med==='multi'){ctx.globalAlpha=0.88;const rows=3,ch=2*M/rows,s=Math.max(6,ch*1.1);for(let j=0;j<rows;j++)for(let x=x0+(j%2)*s/2;x<x1;x+=s){rr(ctx,x,-M+j*ch+0.8,s-2,ch-1.6,1.5);ctx.fill();}ctx.globalAlpha=1;}
  else if(H.med==='lattice'){ctx.fillStyle='rgba(60,52,44,.55)';ctx.fillRect(x0,-M,x1-x0,2*M);ctx.strokeStyle=DK;ctx.lineWidth=1.6;const cs=Math.max(8,M*0.28);
    for(let j=0,y=-M;y<M;y+=cs*0.86,j++)for(let x=x0+(j%2)*cs/2;x<x1;x+=cs){ctx.beginPath();for(let a=0;a<6;a++){const ang=a*TAU/6+Math.PI/6,px=x+Math.cos(ang)*cs*0.55,py=clamp(y+Math.sin(ang)*cs*0.55,-M,M);a?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();}}}
function drawRoot(ctx,H,ppu,xr,x1,k){const D=H.d*ppu,h=D/2,col=H.treat==='bleached'?[232,214,160]:H.col,ed=rgb(mix(col,[30,20,10],0.45)),r=rng(5);
  if(H.root==='shed'){ // telogen: club-shaped, keratinized, no tissue, little pigment at the bulb
    ctx.fillStyle=rgb(col,0.55);ctx.strokeStyle=ed;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x1,-h);ctx.lineTo(xr+D*2.2,-h);ctx.bezierCurveTo(xr+D*1.4,-h*0.8,xr+D*0.9,-h*1.25,xr+D*0.45,-h*1.25);
    ctx.arc(xr+D*0.45,0,h*1.25,-Math.PI/2,Math.PI/2,true);ctx.bezierCurveTo(xr+D*0.9,h*1.25,xr+D*1.4,h*0.8,xr+D*2.2,h);ctx.lineTo(x1,h);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(246,238,214,.9)';ctx.beginPath();ctx.ellipse(xr+D*0.5,0,D*0.85,h*0.95,0,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(160,140,110,.8)';ctx.lineWidth=1;for(let i=0;i<6;i++){const y=(i-2.5)*h*0.3;ctx.beginPath();ctx.moveTo(xr-D*0.15,y);ctx.lineTo(xr+D*0.9,y*0.6);ctx.stroke();}
    ctx.fillStyle=rgb(mix(col,[30,20,10],0.5),0.8);for(let i=0;i<40;i++){const x=xr+D*1.6+r()*(x1-xr-D*1.6),y=(r()*2-1)*h*0.8;ctx.beginPath();ctx.ellipse(x,y,2,0.9,0,0,TAU);ctx.fill();}}
  else{ // anagen: elongated, densely pigmented root wrapped in root-sheath tissue
    ctx.fillStyle='rgba(222,196,176,.6)';ctx.strokeStyle='rgba(150,118,96,.85)';ctx.lineWidth=1.4;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(xr+D*4.2,-h*1.1);ctx.bezierCurveTo(xr+D*2.5,-h*1.9,xr+D*0.4,-h*2.1,xr-D*0.35,-h*0.6);ctx.quadraticCurveTo(xr-D*0.55,0,xr-D*0.35,h*0.6);ctx.bezierCurveTo(xr+D*0.4,h*2.1,xr+D*2.5,h*1.9,xr+D*4.2,h*1.1);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(120,90,80,.65)';for(let i=0;i<34;i++){const x=xr-D*0.2+r()*D*4,y=(r()*2-1)*h*1.7;if(Math.abs(y)<h*1.05)continue;ctx.beginPath();ctx.arc(x,y,1.8,0,TAU);ctx.fill();}
    ctx.fillStyle=rgb(col,0.7);ctx.strokeStyle=ed;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x1,-h);ctx.lineTo(xr+D*2.4,-h);ctx.bezierCurveTo(xr+D*1.5,-h*1.05,xr+D*0.8,-h*1.15,xr+D*0.2,-h*0.6);ctx.quadraticCurveTo(xr-D*0.05,0,xr+D*0.2,h*0.6);ctx.bezierCurveTo(xr+D*0.8,h*1.15,xr+D*1.5,h*1.05,xr+D*2.4,h);ctx.lineTo(x1,h);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=rgb(mix(col,[30,20,10],0.6),0.85);for(let i=0;i<90;i++){const x=xr+r()*(x1-xr),dens=x<xr+D*2.4?1:0.35;if(r()>dens)continue;const y=(r()*2-1)*h*0.8;ctx.beginPath();ctx.ellipse(x,y,2,0.9,0,0,TAU);ctx.fill();}}}
/* Fiber, drawn along +x, centered at y=0. mode: 'long' | 'polar' */
function drawFiber(ctx,F,c,ppu,x0,x1,mode,seed,y0){const f=FIB[F],D=f.d*ppu,h=D/2,r=rng(seed);let fill=c?mix(f.col,FCOL[c],0.75):f.col,edge=mix(fill,[20,20,24],0.45);
  if(mode==='polar'){const ic=interferenceColor(retard(F));fill=ic;edge=mix(ic,[0,0,0],0.3);}
  const a=mode==='polar'?0.95:0.6;ctx.save();ctx.translate(0,y0||0);
  const yAt=x=>F==='wool'?Math.sin(x*0.022+seed)*D*0.35:0;
  if(F==='cotton'){const L=Math.max(38,D*2.6),w=x=>h*(0.42+0.58*Math.abs(Math.cos(Math.PI*(x-x0)/L)));
    ctx.beginPath();for(let x=x0;x<=x1;x+=3)ctx.lineTo(x,-w(x));for(let x=x1;x>=x0;x-=3)ctx.lineTo(x,w(x));ctx.closePath();ctx.fillStyle=rgb(fill,a);ctx.fill();ctx.strokeStyle=rgb(edge);ctx.lineWidth=1.5;ctx.stroke();
    if(mode!=='polar'){ctx.strokeStyle=rgb(edge,0.75);ctx.lineWidth=1.2;ctx.beginPath();for(let x=x0;x<=x1;x+=3)ctx.lineTo(x,-w(x)*0.35);ctx.stroke();ctx.beginPath();for(let x=x0;x<=x1;x+=3)ctx.lineTo(x,w(x)*0.35);ctx.stroke();
      for(let x=x0+L/2;x<x1;x+=L){ctx.beginPath();ctx.moveTo(x-h*0.5,-h*0.42);ctx.lineTo(x+h*0.5,h*0.42);ctx.stroke();}}}
  else{const n=F==='silk'?2:1;for(let s=0;s<n;s++){const off=n>1?(s-0.5)*D*0.95:0,hh=n>1?h*0.5:h;
      ctx.beginPath();for(let x=x0;x<=x1;x+=4){const ww=hh*(F==='silk'?1+0.08*Math.sin(x*0.05+s*3):1);ctx.lineTo(x,yAt(x)+off-ww);}for(let x=x1;x>=x0;x-=4){const ww=hh*(F==='silk'?1+0.08*Math.sin(x*0.05+s*3):1);ctx.lineTo(x,yAt(x)+off+ww);}ctx.closePath();
      ctx.fillStyle=rgb(fill,a);ctx.fill();ctx.strokeStyle=rgb(edge);ctx.lineWidth=1.5;ctx.stroke();
      if(mode!=='polar'&&F!=='silk'){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();for(let x=x0;x<=x1;x+=4)ctx.lineTo(x,yAt(x)+off-hh*0.45);ctx.stroke();}}
    if(mode!=='polar'){ctx.strokeStyle=rgb(edge,0.8);ctx.lineWidth=1.2;
      if(F==='wool'){for(let x=x0;x<x1;x+=Math.max(7,D*0.35)){ctx.beginPath();for(let y=-h;y<=h;y+=3){const xx=x+2*Math.sin(y*0.4)+y*0.2;y===-h?ctx.moveTo(xx,yAt(x)+y):ctx.lineTo(xx,yAt(x)+y);}ctx.stroke();}}
      if(F==='rayon'){[-0.55,-0.2,0.15,0.5].forEach(f=>{ctx.beginPath();ctx.moveTo(x0,f*h);ctx.lineTo(x1,f*h);ctx.stroke();});}
      if(F==='acrylic'){ctx.globalAlpha=0.5;ctx.beginPath();ctx.moveTo(x0,0.1*h);ctx.lineTo(x1,0.1*h);ctx.stroke();ctx.globalAlpha=1;}
      if(F==='polyester'){ctx.fillStyle='rgba(40,40,46,.75)';for(let i=0;i<(x1-x0)/9;i++){ctx.beginPath();ctx.arc(x0+r()*(x1-x0),(r()*2-1)*h*0.75,1.3,0,TAU);ctx.fill();}}}}
  ctx.restore();}
function crossSection(ctx,F,x,y,R,c){const f=FIB[F],fill=c?mix(f.col,FCOL[c],0.75):f.col,edge=mix(fill,[20,20,24],0.5);ctx.fillStyle=rgb(fill,0.8);ctx.strokeStyle=rgb(edge);ctx.lineWidth=1.5;ctx.beginPath();
  if(F==='cotton'){ctx.ellipse(x,y,R*1.1,R*0.6,0.3,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x+R*0.1,y,R*0.55,R*0.12,0.3,0,TAU);ctx.strokeStyle=rgb(edge,0.8);ctx.stroke();return;}
  if(F==='silk'){for(let a=0;a<3;a++){const t=a*TAU/3-Math.PI/2;ctx.lineTo(x+Math.cos(t)*R,y+Math.sin(t)*R);ctx.quadraticCurveTo(x+Math.cos(t+Math.PI/3)*R*0.75,y+Math.sin(t+Math.PI/3)*R*0.75,x+Math.cos(t+TAU/3)*R,y+Math.sin(t+TAU/3)*R);}ctx.closePath();}
  else if(F==='rayon'){for(let a=0;a<=48;a++){const t=a*TAU/48,rr2=R*(1+0.1*(a%2?-1:1));ctx.lineTo(x+Math.cos(t)*rr2,y+Math.sin(t)*rr2);}ctx.closePath();}
  else if(F==='acrylic'){ctx.ellipse(x-R*0.45,y,R*0.6,R*0.62,0,Math.PI*0.35,Math.PI*1.65);ctx.ellipse(x+R*0.45,y,R*0.6,R*0.62,0,Math.PI*1.35,Math.PI*0.65);ctx.closePath();}
  else{ctx.arc(x,y,R,0,TAU);}
  ctx.fill();ctx.stroke();if(F==='wool'){ctx.beginPath();ctx.arc(x,y,R*0.82,0,TAU);ctx.strokeStyle=rgb(edge,0.5);ctx.stroke();}}
/* Interference color between crossed polarizers at 45°: I(λ) = sin²(πΓ/λ), averaged over three wavelength bands. */
function interferenceColor(G){const band=(a,b)=>{let s=0,n=0;for(let l=a;l<=b;l+=5){s+=Math.pow(Math.sin(Math.PI*G/l),2);n++;}return s/n;};
  const R=band(590,680),Gg=band(500,580),B=band(420,490);return [R,Gg,B].map(v=>255*Math.pow(clamp(v,0,1),0.75));}

/* ---------- layout ---------- */
const FX=232,FY=246,FR=176,PX=438,PW=350;
function field(ctx,dark){ctx.fillStyle=LENS;ctx.beginPath();ctx.arc(FX,FY,FR+9,0,TAU);ctx.fill();ctx.fillStyle=dark?'#08080a':FIELD;ctx.beginPath();ctx.arc(FX,FY,FR,0,TAU);ctx.fill();}
function clipField(ctx,half){ctx.save();ctx.beginPath();ctx.arc(FX,FY,FR,0,TAU);ctx.clip();if(half){ctx.beginPath();half==='L'?ctx.rect(FX-FR,FY-FR,FR,2*FR):ctx.rect(FX,FY-FR,FR,2*FR);ctx.clip();}}
const HPPU=0.78,FPPU=2.0; // px per µm: hair at 400× (field ≈ 450 µm), fibers at about 1000× (field ≈ 180 µm)
function scaleBar(ctx,um,ppu,k,dark){const L=um*ppu,x=FX-L/2,y=FY+FR-30;ctx.strokeStyle=dark?'#f2f2f2':'#222';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+L,y);ctx.stroke();
  txt(ctx,um+' µm',FX,y-8,{s:12*k,w:700,a:'center',c:dark?'#f2f2f2':'#222'});}
function panel(ctx,y,h){ctx.fillStyle=PAL['card'];rr(ctx,PX,y,PW,h,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();}

function curHair(sim){const p=sim.p;const h={sp:p.species};if(p.species==='human'){h.hc='brown';h.tr=atLeast('honors')?p.treat:'natural';}return hairObj(h,{root:p.root});}
function measure(H){const sd=H.d/5,md=H.med==='none'?0:H.mi*H.d/5;return {sd,md,mi:md/sd};} // ocular micrometer at 400×: 5 µm per division
function verdictHair(H){return H.mi<1/3?'Human: medulla under 1/3 of the width':'Animal: medulla over 1/3 of the width';}

const HF={
  id:'hairfiber',hash:'hairfiber',apUnit:8,order:1,tab:'Hair and fibers',kind:'Virtual lab',next:['crimescene','dna'],
  card:'Look at hairs and fibers under a microscope, run a burn test, and compare scene evidence with suspects’ samples.',
  title:'Hair and fibers: trace evidence under the microscope',
  lede:{bio:'A single hair or fiber can link a person, a pet or a piece of clothing to a scene. Look at the medulla and the scales to tell human from animal hair, and at shape and burning to tell fibers apart.',
        honors:'Use the medullary index, scale pattern, pigment, treatment and root to describe a hair, and fiber shape, cross section and burn behavior to classify a fiber. Then compare evidence with known samples.',
        ap:'Measure hairs with an ocular micrometer, and confirm fiber types with polarized light: birefringence (n∥ − n⊥) times thickness sets the interference color. Then weigh what class evidence can and cannot prove.'},
  scale:{bio:'Hairs at 400×: the field is about 0.45 mm across, and a human head hair is about 0.07 mm wide. Fibers at about 1000×.',ap:'Hairs at 400× (field ≈ 450 µm; ocular micrometer 5 µm per division). Fibers at about 1000× (field ≈ 180 µm). A human head hair is 50–100 µm wide; a cotton fiber about 16 µm.'},
  timeless:true,animated:true,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'case',lvl:'bio',noTrial:true,options:[{v:'case',l:'Solve the case'},{v:'hair',l:'Hair lab'},{v:'fiber',l:'Fiber lab'}]},
    {id:'cs',label:'Case',type:'select',def:'c1',lvl:'bio',modes:['case'],noTrial:true,options:[{v:'c1',l:CASES.c1.l},{v:'c2',l:CASES.c2.l},{v:'c3',l:CASES.c3.l,lvl:'ap'}]},
    {id:'item',label:'Evidence to compare',type:'seg',def:'hair',lvl:'bio',modes:['case'],noTrial:true,options:[{v:'hair',l:'The hair'},{v:'fiber',l:'The fiber'}]},
    {id:'suspect',label:'Known sample from',type:'seg',def:0,lvl:'bio',modes:['case'],noTrial:true,options:[{v:0,l:'Suspect A'},{v:1,l:'Suspect B'},{v:2,l:'Suspect C'}]},
    {id:'call',label:'Your call for this sample',type:'seg',def:'unsure',lvl:'bio',modes:['case'],noTrial:true,options:[{v:'unsure',l:'Not sure yet'},{v:'consistent',l:'Consistent'},{v:'excluded',l:'Excluded'}],help:'Consistent means every feature you can see agrees. Excluded means at least one clear feature differs.'},
    {id:'species',label:'Hair from',type:'select',def:'human',lvl:'bio',modes:['hair'],options:Object.keys(SP).map(k=>({v:k,l:SP[k].l}))},
    {id:'hview',label:'What to look at',type:'seg',def:'medulla',lvl:'bio',show:s=>s.p.mode==='hair'||(s.p.mode==='case'&&s.p.item==='hair'),options:[{v:'medulla',l:'Medulla (light through it)'},{v:'scales',l:'Scale cast'},{v:'root',l:'Root end',lvl:'honors'}],help:'A scale cast is a print of the hair’s surface pressed into clear nail polish.'},
    {id:'treat',label:'Human hair color treatment',type:'seg',def:'natural',lvl:'honors',modes:['hair'],show:s=>s.p.species==='human',options:[{v:'natural',l:'Natural'},{v:'dyed',l:'Dyed'},{v:'bleached',l:'Bleached'}]},
    {id:'root',label:'How the hair left the body',type:'seg',def:'shed',lvl:'honors',modes:['hair'],options:[{v:'shed',l:'Fell out (shed)'},{v:'pulled',l:'Pulled out'}],help:'Shed hairs have a club-shaped root. Pulled hairs often carry root tissue.'},
    {id:'measure',label:'Measure with the ocular micrometer',type:'toggle',def:false,lvl:'honors',show:s=>(s.p.mode==='hair'||(s.p.mode==='case'&&s.p.item==='hair'))&&s.p.hview==='medulla'},
    {id:'fiber',label:'Fiber',type:'select',def:'cotton',lvl:'bio',modes:['fiber'],options:Object.keys(FIB).map(k=>({v:k,l:FIB[k].l}))},
    {id:'fview',label:'View',type:'seg',def:'long',lvl:'bio',show:s=>s.p.mode==='fiber'||(s.p.mode==='case'&&s.p.item==='fiber'),options:[{v:'long',l:'Lengthwise'},{v:'cross',l:'Cross section',lvl:'honors'},{v:'polar',l:'Polarized light',lvl:'ap'}],help:'Polarized light: the fiber sits between crossed polarizers, so only light its structure rotates gets through.'}
  ],
  actions:[
    {id:'burn',label:'Run the burn test',lvl:'bio',primary:true,modes:['fiber'],run(sim){sim.st.burn=0;sim.st.burnF=sim.p.fiber;sim.infoDirty=true;}},
    {id:'nextsus',label:'Next suspect',lvl:'bio',modes:['case'],run(sim){BioLab.setValues(sim,{suspect:(sim.p.suspect+1)%3});}}
  ],
  init(sim){return {burn:null,burnF:null};},
  step(sim,dt){const st=sim.st;if(st.burn!==null&&st.burn<6.5)st.burn+=dt;},
  metrics:[
    {id:'medulla',label:'Medulla',unit:'',lvl:'bio',text:true,modes:['hair'],get:s=>MEDS[SP[s.p.species].med]},
    {id:'scales',label:'Scale pattern',unit:'',lvl:'bio',text:true,modes:['hair'],get:s=>SCS[SP[s.p.species].sc]},
    {id:'mi',label:'Medullary index',unit:'',lvl:'honors',min:0,max:1,d:2,modes:['hair'],get:s=>SP[s.p.species].mi},
    {id:'width',label:'Shaft width',unit:'µm',lvl:'ap',min:0,max:200,d:0,modes:['hair'],get:s=>SP[s.p.species].d},
    {id:'dna',label:'DNA from this hair',unit:'',lvl:'honors',text:true,modes:['hair'],get:s=>s.p.root==='pulled'?'Nuclear DNA likely (root tissue)':'Mostly mitochondrial DNA only'},
    {id:'fclass',label:'Fiber class',unit:'',lvl:'bio',text:true,modes:['fiber'],get:s=>FIB[s.p.fiber].cls},
    {id:'burnres',label:'Burn test',unit:'',lvl:'bio',text:true,modes:['fiber'],get:s=>{const st=s.st;if(st.burn===null||st.burnF!==s.p.fiber)return 'Not run yet';return st.burn<4?'Burning…':FIB[st.burnF].smell+'; '+FIB[st.burnF].res;}},
    {id:'bire',label:'Birefringence n∥ − n⊥',unit:'',lvl:'ap',min:-0.01,max:0.2,d:3,modes:['fiber'],get:s=>bire(s.p.fiber)},
    {id:'ret',label:'Retardation Γ = Δn × t',unit:'nm',lvl:'ap',min:0,max:null,d:0,modes:['fiber'],get:s=>retard(s.p.fiber)},
    {id:'cmp',label:'This comparison',unit:'',lvl:'bio',text:true,modes:['case'],noTrial:true,get:s=>{const p=s.p;return p.call==='unsure'?'Make your call first':compareText(p.cs,p.item,p.suspect);}},
    {id:'made',label:'Calls made',unit:'',lvl:'bio',text:true,modes:['case'],noTrial:true,get:s=>{const c=calls(s),p=s.p;let n=0,ok=0;['hair','fiber'].forEach(it=>[0,1,2].forEach(i=>{const v=c[p.cs+'|'+it+'|'+i];if(v&&v!=='unsure'){n++;if((v==='consistent')===truth(p.cs,it,i))ok++;}}));return n+' of 6 ('+ok+' supported)';}}
  ],
  graphs:[{id:'migraph',label:'Medullary index by species',lvl:'bio',custom:true},{id:'bgraph',label:'Birefringence by fiber',lvl:'ap',custom:true}],
  defaultGraph:'migraph',
  plot(sim,ctx,box,id){
    if(id==='bgraph'){const ks=Object.keys(FIB),vals=ks.map(bire);const ax=axes(ctx,box,{xmin:0,xmax:ks.length,ymin:-0.02,ymax:0.2,xcats:ks.map(k=>FIB[k].l),yl:'n∥ − n⊥',yd:2});
      bars(ctx,ax,vals,{colors:ks.map(k=>k===sim.p.fiber?PAL['s1']:PAL['g-axis']),d:3});return;}
    const ks=Object.keys(SP),vals=ks.map(k=>SP[k].mi);const ax=axes(ctx,box,{xmin:0,xmax:ks.length,ymin:0,ymax:1,xcats:ks.map(k=>k==='human'?'Human':SP[k].l),yl:'medullary index',yd:1});
    bars(ctx,ax,vals,{colors:ks.map(k=>k===sim.p.species?PAL['s1']:PAL['g-axis']),d:2});
    ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(box.L,ax.Y(1/3));ctx.lineTo(box.L+box.W,ax.Y(1/3));ctx.stroke();ctx.setLineDash([]);
    txt(ctx,'1/3',box.L+6,ax.Y(1/3)-6,{s:12,w:700,c:PAL['muted']});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const C=CASES[p.cs],c=calls(sim);
      const cell=(it,i)=>{const v=c[p.cs+'|'+it+'|'+i]||'unsure';if(v==='unsure')return '<td>?</td>';const ok=(v==='consistent')===truth(p.cs,it,i);return `<td>${v}${ok?' ✓':' <b>(look again)</b>'}</td>`;};
      const rows=C.sus.map((s,i)=>`<tr${i===p.suspect?' style="font-weight:700"':''}><td>${s.n}</td><td>${s.hl}</td>${cell('hair',i)}<td>${s.fl}</td>${cell('fiber',i)}</tr>`).join('');
      return `<h3>${C.l} (fictional)</h3><p>${C.story}</p><p><b>Evidence:</b> one hair and one ${C.fiber.c} fiber from the scene. Identify them by comparing.</p><div class="tbl-wrap"><table><thead><tr><th>Suspect</th><th>Known hair</th><th>Call</th><th>Known fiber</th><th>Call</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p class="help">Compare one feature at a time: ${p.item==='hair'?'species (medulla, scales), then color and treatment.':'fiber type (shape'+(hon?', cross section':'')+(ap?', interference color':'')+'), then color.'} ${hon?'Hair and fibers are class evidence: a match means “consistent with,” never “came from.”':'A ✓ means your call agrees with the evidence.'}</p>`;}
    if(p.mode==='fiber'){const ks=Object.keys(FIB);const rows=ks.map(k=>{const f=FIB[k];return `<tr${k===p.fiber?' style="font-weight:700"':''}><td>${f.l}</td><td>${f.near}</td><td>${f.inF}</td><td>${f.out}</td><td>${f.smell}</td><td>${f.res}</td>${ap?`<td>${f.np.toFixed(3)} / ${f.nv.toFixed(3)}</td>`:''}</tr>`;}).join('');
      return `<h3>Burn test decision table</h3><div class="tbl-wrap"><table><thead><tr><th>Fiber</th><th>Near the flame</th><th>In the flame</th><th>Taken out</th><th>Smell</th><th>Residue</th>${ap?'<th>n∥ / n⊥</th>':''}</tr></thead><tbody>${rows}</tbody></table></div><p class="help">Plant fibers (cellulose) burn like paper. Animal fibers (protein) smell like burning hair and go out. Synthetics melt and leave a hard bead. Labs burn only a known sample, never the one evidence fiber.</p>`;}
    const ks=Object.keys(SP);const rows=ks.map(k=>{const s=SP[k];return `<tr${k===p.species?' style="font-weight:700"':''}><td>${s.l}</td><td>${SCS[s.sc]}</td><td>${MEDS[s.med]}</td>${hon?`<td>${s.mi.toFixed(2)}</td>`:''}<td>${s.pig==='even'?'spread evenly, more toward the edge':'packed toward the center'}</td>${ap?`<td>${s.d}</td>`:''}</tr>`;}).join('');
    return `<h3>Hair identification key</h3><div class="tbl-wrap"><table><thead><tr><th>Source</th><th>Scales</th><th>Medulla</th>${hon?'<th>Medullary index</th>':''}<th>Pigment</th>${ap?'<th>Width (µm)</th>':''}</tr></thead><tbody>${rows}</tbody></table></div><p class="help">Rule of thumb: a human head hair’s medulla is absent or broken and under 1/3 of the shaft width. Most animal hairs have a continuous or patterned medulla wider than 1/2.</p>`;},
  narrate(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const C=CASES[p.cs],s=C.sus[p.suspect],call=p.call;
      if(call==='unsure'){const d=p.item==='hair'?[descHair(C.hair,p.hview),descHair(s.hair,p.hview)]:[descFiber(C.fiber,p.fview),descFiber(s.fiber,p.fview)];
        return 'Left, the scene '+p.item+': '+d[0]+'. Right, '+s.n+'’s '+(p.item==='hair'?s.hl:s.fl)+': '+d[1]+'. <b>Compare them feature by feature, then make your call.</b>';}
      const ok=(call==='consistent')===truth(p.cs,p.item,p.suspect);let why;
      if(p.item==='hair'){const e=C.hair,k=s.hair;why=e.sp!==k.sp?'The scene hair is '+hairName(e)+' and the known sample is '+hairName(k)+': <b>a different species excludes it.</b>':e.sp==='human'&&!hairSame(e,k)?'Both are human, but the scene hair is '+hairName(e)+' and the known one is '+hairName(k)+': <b>color and treatment differ, so it is excluded.</b>':'Both are '+hairName(e)+' and agree in every feature you can see. <b>That makes them consistent, not a proven match</b>: many '+(e.sp==='human'?'people':e.sp+'s')+' have hair like this.'+(atLeast('honors')?' Only DNA could individualize it.':'');}
      else{const e=C.fiber,k=s.fiber;why=e.f!==k.f?'The scene fiber is '+FIB[e.f].l.toLowerCase()+' ('+FIB[e.f].look+'), but the '+s.fl+' is '+FIB[k.f].l.toLowerCase()+'. <b>Same color is not enough: the fiber type differs, so it is excluded.</b>':e.c!==k.c?'Same fiber type, but the scene fiber is '+e.c+' and the '+s.fl+' is '+k.c+'. <b>A different dye excludes it.</b>':'The '+s.fl+' matches in type and color. <b>Consistent</b>: it could have come from this garment, or from any other made of the same fiber and dye.';}
      return (ok?'Your call holds up. ':'Look again. ')+why;}
    if(p.mode==='fiber'){const f=FIB[p.fiber],st=sim.st;
      if(st.burn!==null&&st.burnF===p.fiber&&st.burn<4)return st.burn<1.3?'Moving the fiber toward the flame: it '+f.near+'.':'In the flame it '+f.inF+'. '+(f.melt?'<b>It melts because it is a thermoplastic polymer.</b>':'<b>It chars instead of melting</b>, like other natural fibers.');
      if(p.fview==='polar')return 'Between crossed polarizers the '+f.l.toLowerCase()+' fiber glows with a color set by its retardation, Γ = Δn × t = '+Math.round(retard(p.fiber))+' nm. <b>'+(retard(p.fiber)<150?'Low retardation: it stays nearly dark.':retard(p.fiber)>2000?'High retardation: the colors wash out to a pale, pearly white.':'Different polymers show different colors.')+'</b>';
      if(p.fview==='cross')return 'Cut across, '+f.l.toLowerCase()+' looks '+{cotton:'like a flattened bean with a collapsed central canal (lumen)',wool:'round, with a scaly edge',silk:'like a rounded triangle',rayon:'round with a wavy, notched edge',nylon:'round and solid',polyester:'round and solid',acrylic:'like a dog bone or a bean'}[p.fiber]+'. <b>Shape comes from how the fiber grew or from the spinneret hole it was pushed through.</b>';
      return 'Lengthwise, '+f.l.toLowerCase()+' is a '+f.look+'. <b>'+(f.cls.startsWith('Natural')?'Natural fibers carry structure from the plant or animal they came from.':f.cls.startsWith('Regen')?'Rayon is made from plant cellulose but pushed through a spinneret, so it looks man-made.':'Synthetic fibers are extruded, so they look like smooth, even rods.')+'</b>'+(st.burn===null?' Run the burn test next.':'');}
    const H=curHair(sim),S=SP[p.species];
    if(p.hview==='scales')return 'The scale cast shows the cuticle: '+SCN[S.sc]+'. <b>'+(S.sc==='imb'?'Human hairs have flat, smooth, overlapping (imbricate) scales.':'This pattern points to an animal hair.')+'</b>';
    if(p.hview==='root')return p.root==='pulled'?'This root was pulled out while growing: it is long and pigmented, wrapped in root-sheath tissue. <b>That tissue holds cells with nuclei, so the lab can try for a nuclear DNA profile.</b>':'This hair fell out on its own: its root is a dry, club-shaped bulb with no tissue. <b>Without root cells, labs usually get only mitochondrial DNA</b>, which many relatives share.';
    let s='The medulla, the dark core, is '+MEDN[S.med]+'.';
    s+=S.mi<1/3?' <b>It fills under a third of the shaft, the pattern of a human hair.</b>':' <b>It fills more than half the shaft, the pattern of an animal hair.</b>';
    if(hon&&p.species==='human'&&p.treat!=='natural')s+=p.treat==='dyed'?' The dye colors the cuticle as well as the cortex, so the color looks even all the way to the edge.':' Bleach has broken down most of the pigment granules, leaving a pale yellow shaft.';
    else if(hon&&p.species!=='human')s+=' The pigment is packed toward the center, as in most animal hairs.';
    return s;},
  tour:[
    {title:'A hair under the microscope',text:{bio:'This is a human head hair at 400×. Light passes through it. The darker broken core is the medulla. Around it is the cortex with its pigment grains, and the thin outer edge is the cuticle.',honors:'A hair has three layers: cuticle (scales on the outside), cortex (holds the pigment) and medulla (the core). Each one carries clues.'},focus:[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],pause:true,setup(sim){BioLab.setValues(sim,{mode:'hair',species:'human',hview:'medulla',treat:'natural',measure:false,root:'shed'});syncMode(sim);}},
    {title:'Scales on the surface',text:'Paint a thin layer of clear nail polish on a slide, press the hair in, and peel it out. The cast shows the scales. Human scales are flat and overlap like roof shingles: imbricate.',focus:[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],pause:true,setup(sim){BioLab.setValues(sim,{hview:'scales'});}},
    {title:'An animal hair',text:{bio:'A dog hair has a wide, continuous medulla that fills more than half the shaft. Most animal hairs look like this.',honors:'Medullary index = medulla width ÷ shaft width. Human head hairs are under 1/3; most animals are over 1/2. Here a dog hair measures about 0.6.'},focus:[[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],[PX,40,PW,400]],pause:true,setup(sim){BioLab.setValues(sim,{species:'dog',hview:'medulla',measure:atLeast('honors')});syncMode(sim);}},
    {title:'Fibers: natural or made',text:'Cotton is a flat ribbon that twists back and forth. It grew as a hollow plant hair that collapsed when it dried. Synthetic fibers like nylon are smooth rods, because they are squeezed out of a nozzle.',focus:[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],pause:true,setup(sim){BioLab.setValues(sim,{mode:'fiber',fiber:'cotton',fview:'long'});syncMode(sim);sim.st.burn=null;}},
    {title:'The burn test',text:'Hold a few fibers from a known sample in tweezers and bring them to a flame. Nylon melts and shrinks away, smells like celery and leaves a hard bead. Cotton would burn like paper and leave soft ash.',focus:[PX,40,PW,400],speed:1,setup(sim){BioLab.setValues(sim,{fiber:'nylon'});sim.st.burn=0;sim.st.burnF='nylon';}},
    {title:'Compare with suspects',text:{bio:'A comparison microscope shows two samples side by side. The scene hair is on the left; a suspect’s known sample is on the right. Here the scene hair is a dog hair, and Suspect A’s sample is from a cat.',honors:'Compare feature by feature. One clear difference excludes a sample. Agreement on every feature only means “consistent with”: hair and fibers are class evidence.'},focus:[[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],[PX,40,PW,400]],pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',cs:'c1',item:'hair',suspect:0,hview:'medulla',measure:false});loadCall(sim);}},
    {title:'Make your call',text:'Suspect B’s dog hair agrees with the scene hair in every feature. Mark it Consistent, then check the fiber the same way. The worksheet below the stage tracks your calls.',focus:[[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],[PX,40,PW,400]],pause:true,setup(sim){BioLab.setValues(sim,{suspect:1});loadCall(sim);}},
    {lvl:'ap',title:'Polarized light',text:'Synthetic fibers can look alike in plain light. Between crossed polarizers each polymer shows its own color, because birefringence (n∥ − n⊥) times thickness sets the retardation. Polyester’s Γ ≈ 3300 nm gives a pale, high-order white; nylon’s ≈ 1300 nm shows bright colors.',focus:[FX-FR-10,FY-FR-10,2*FR+20,2*FR+20],pause:true,setup(sim){BioLab.setValues(sim,{mode:'fiber',fiber:'polyester',fview:'polar'});syncMode(sim);}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);sim.st.burn=null;loadCall(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);if(ch.burn){sim.st.burn=0;sim.st.burnF=ch.set.fiber;}syncMode(sim);loadCall(sim);BioLab.refresh(sim);}},
  challenges(sim){const m=measure(hairObj({sp:'cat'})),miC=m.mi;const pe='polyester',ny='nylon';return [
    {lvl:'bio',instant:true,set:{mode:'hair',species:'dog',hview:'medulla'},q:'A hair from a scene has a wide, unbroken dark core running down its middle. What does that suggest?',choices:['A human head hair','An animal hair','A hair that was dyed'],correct:1,
     explain:'The model now shows a dog hair. Its medulla is continuous and fills about '+Math.round(SP.dog.mi*100)+'% of the width. Human head hairs have no medulla or a broken one, under a third of the width.'},
    {lvl:'bio',instant:true,set:{mode:'fiber',fiber:'cotton',fview:'long'},q:'Under the microscope a fiber looks like a flat ribbon that twists back and forth. What is it most likely to be?',choices:['Cotton, a plant fiber','Nylon, a synthetic fiber','Wool, an animal fiber'],correct:0,
     explain:'Cotton grows as a hollow seed hair. When the boll opens it dries, collapses and twists, so it looks like a twisted ribbon. Wool has scales, and nylon is a smooth rod.'},
    {lvl:'bio',instant:true,set:{mode:'case',cs:'c1',item:'fiber',suspect:0,fview:'long'},q:'In Case 1, Suspect A’s sweater is the same red as the evidence fiber. Does that make the sweater the source?',choices:['Yes, the color matches','No: the evidence is acrylic and the sweater is wool, so it is excluded','Only if the fibers are the same length'],correct:1,
     explain:'The comparison microscope shows a smooth acrylic rod beside a scaly wool fiber. Color is only one feature. One clear difference in fiber type excludes the sweater.'},
    {lvl:'bio',instant:true,set:{mode:'fiber',fiber:'nylon',fview:'long'},burn:true,q:'You hold a few nylon fibers in tweezers and move them into a flame. What do you see?',choices:['They burn quickly like paper and leave soft ash','They melt, shrink away and leave a hard bead','Nothing: nylon does not burn'],correct:1,
     explain:'The burn test is running now. Nylon is a thermoplastic: it melts and pulls away from the heat, smells a little like celery and cools into a hard, cream-colored bead.'},
    {lvl:'honors',instant:true,set:{mode:'hair',species:'cat',hview:'medulla',measure:true},q:'With the ocular micrometer, a hair is '+m.sd.toFixed(0)+' divisions wide and its medulla is '+m.md.toFixed(1)+' divisions wide. What is the medullary index, and what does it suggest?',choices:[(1/miC).toFixed(1)+': human',miC.toFixed(2)+': animal',miC.toFixed(2)+': human'],correct:1,
     explain:'Medullary index = medulla ÷ shaft = '+m.md.toFixed(1)+' ÷ '+m.sd.toFixed(0)+' = '+miC.toFixed(2)+'. That is above 1/3 (in fact about 1/2), so the hair is from an animal. The model shows a cat hair with a beaded medulla.'},
    {lvl:'honors',instant:true,set:{mode:'hair',species:'human',hview:'root',root:'shed'},q:'A hair fell out naturally, so it has a dry, club-shaped root. Can the lab get a nuclear DNA profile from it?',choices:['Yes, every hair carries nuclear DNA in its shaft','Usually not: without root tissue, there are few or no cells with nuclei','Only if it is a dark hair'],correct:1,
     explain:'Shed (telogen) hairs lose their root tissue. The shaft is dead keratin, so labs usually recover only mitochondrial DNA, which is shared by everyone in the same maternal line. A pulled hair with root tissue is the best DNA source.'},
    {lvl:'honors',instant:true,set:{mode:'fiber',fiber:'rayon',fview:'long'},burn:true,q:'Rayon burns like cotton: it smells like paper and leaves soft ash. Is rayon a natural fiber?',choices:['Yes, it burns like a plant fiber, so it is natural','No: it is regenerated cellulose, made from wood pulp pushed through a spinneret','No: it is a petroleum plastic like nylon'],correct:1,
     explain:'Rayon is cellulose, so it burns like cotton. But it is dissolved and squeezed through tiny holes, so under the microscope it is a smooth rod with lengthwise lines, not a twisted ribbon. Use two tests, not one.'},
    {lvl:'honors',instant:true,set:{mode:'case',cs:'c2',item:'hair',suspect:0,hview:'medulla'},q:'In Case 2, the scene hair and Suspect A’s hair are both human head hairs. Is Suspect A’s hair consistent with the evidence?',choices:['Yes, both are human','No: the evidence hair is bleached blonde and Suspect A’s is natural dark brown','You cannot compare two human hairs'],correct:1,
     explain:'Species is only the first step. The evidence hair has little pigment left (bleached), while Suspect A’s cortex is full of dark granules. Color and treatment are features you compare too.'},
    {lvl:'ap',instant:true,set:{mode:'fiber',fiber:'polyester',fview:'polar'},q:'A polyester fiber has n∥ = 1.720 and n⊥ = 1.537 and is 18 µm thick. What is its retardation Γ = (n∥ − n⊥) × t?',choices:['About 330 nm','About 3300 nm','About 33,000 nm'],correct:1,
     explain:'Δn = 1.720 − 1.537 = 0.183. Γ = 0.183 × 18 µm = 3.29 µm = '+Math.round(retard(pe))+' nm. At that high order, the colors overlap and the fiber looks a pale, pearly white between crossed polarizers.'},
    {lvl:'ap',instant:true,set:{mode:'case',cs:'c3',item:'fiber',suspect:1,fview:'polar'},q:'In Case 3, the green evidence fiber and Suspect B’s green fiber are both smooth round rods that melt in a flame. What do crossed polarizers show?',choices:['The same color: they are the same fiber','Different colors: the evidence is nylon (Γ ≈ '+Math.round(retard(ny)/100)*100+' nm) and B’s is polyester (Γ ≈ '+Math.round(retard(pe)/100)*100+' nm)','Nothing: dyed fibers cannot be seen in polarized light'],correct:1,
     explain:'Birefringence is set by how the polymer chains line up, so it differs between polymers. Nylon’s Δn ≈ 0.063 and polyester’s ≈ 0.183, so their interference colors differ. Suspect B is excluded. Labs confirm with infrared spectroscopy.'},
    {lvl:'ap',instant:true,set:{mode:'fiber',fiber:'acrylic',fview:'polar'},q:'Which of these fibers stays nearly dark between crossed polarizers?',choices:['Polyester','Acrylic','Nylon'],correct:1,
     explain:'Acrylic’s two refractive indices are almost equal (Δn ≈ −0.003), so its retardation is only about '+Math.round(retard('acrylic'))+' nm: a dark gray. Polyester and nylon have large Δn and show bright colors.'},
    {lvl:'ap',instant:true,set:{mode:'case',cs:'c1',item:'fiber',suspect:1},q:'Every feature of Suspect B’s red acrylic fleece matches the evidence fiber. What can the examiner say in court?',choices:['The fiber came from Suspect B’s fleece','The fiber is consistent with the fleece, or with any other garment made the same way','Nothing at all: fibers are never admitted'],correct:1,
     explain:'Fibers are class evidence. Thousands of fleeces may share the same polymer and dye. The weight of the evidence grows when several independent items (the dog hair and the fiber) all point the same way, and when the fiber type is rare.'}
  ];},
  lab:{bio:'<p><b>Question:</b> Who could have left the hair and the fiber at the garden shed?</p><ol><li>Choose Solve the case, Case 1. Compare the hair with each suspect’s known sample. Look at the medulla and then the scale cast.</li><li>Mark each sample Consistent or Excluded.</li><li>Switch to The fiber and do the same.</li><li>In the Fiber lab, run the burn test on all seven fibers and fill in the decision table in your notes.</li></ol><p>Which suspect is consistent with both pieces of evidence? Why is that still not proof?</p><p class="help">Safety in the real lab: burn tests are done by the teacher with tongs over a nonflammable surface, with a few fibers at a time and good ventilation.</p>',
       honors:'<p><b>Question:</b> How does the medullary index separate human from animal hair?</p><ol><li>Turn on the ocular micrometer. For each of the six sources, record the shaft width and medulla width in divisions.</li><li>Calculate the medullary index for each and press Record trial.</li><li>Then solve Cases 1 and 2. For each excluded sample, write the one feature that excluded it.</li></ol><p>Explain why a pulled hair is more useful than a shed hair, and why “consistent with” is the strongest conclusion for a hair without DNA.</p>',
       ap:'<p><b>Question:</b> Can polarized light separate fibers that look alike in plain light?</p><ol><li>For each fiber, record n∥, n⊥, Δn and the retardation Γ = Δn × t.</li><li>Predict the interference color order (dark gray, white, yellow, red, blue, green, pale) from Γ, then check it in Polarized light.</li><li>Solve Case 3.</li></ol><p><b>Claim–evidence–reasoning:</b> Which suspect in Case 3 is consistent with both items, and what single test excluded Suspect B? Discuss what a fiber match does and does not prove.</p>'},
  terms:[{t:'Medulla',d:'The central core of a hair. In human head hair it is absent or broken; in most animals it is wide and continuous or patterned.'},{t:'Cuticle',d:'The outer layer of overlapping scales on a hair.'},{t:'Cortex',d:'The middle layer of a hair, where the pigment grains are.'},{t:'Natural vs synthetic fiber',d:'Natural fibers come from plants (cotton) or animals (wool, silk). Synthetic fibers (nylon, polyester, acrylic) are made from petroleum chemicals.'},{t:'Trace evidence',d:'Small items transferred by contact, like hairs, fibers, glass or soil.'},
    {lvl:'honors',t:'Medullary index',d:'Medulla width ÷ shaft width. Under 1/3 for human head hair; usually over 1/2 for animals.'},{lvl:'honors',t:'Imbricate, coronal, spinous',d:'Scale patterns: flat overlapping (human and many animals), crown-like rings (rodents, bats), pointed petals (cats, rabbits).'},{lvl:'honors',t:'Anagen / telogen root',d:'A growing root (anagen) pulled out with tissue, or a resting club-shaped root (telogen) that fell out naturally.'},{lvl:'honors',t:'Regenerated fiber',d:'A fiber made by dissolving natural cellulose and extruding it, such as rayon.'},{lvl:'honors',t:'Class evidence',d:'Evidence that can narrow a source to a group but not to one person or object.'},{lvl:'honors',t:'Comparison microscope',d:'Two microscopes joined by an optical bridge, so two samples appear side by side in one view.'},
    {lvl:'ap',t:'Birefringence',d:'The difference between the refractive index parallel and perpendicular to the fiber, Δn = n∥ − n⊥.'},{lvl:'ap',t:'Retardation',d:'Γ = Δn × thickness: how far one light wave lags the other. It sets the interference color between crossed polarizers.'},{lvl:'ap',t:'Ocular micrometer',d:'A scale in the eyepiece, calibrated against a stage micrometer for each objective (here 5 µm per division at 400×).'}],
  about:'<p><b>Hairs.</b> Each source is drawn from typical classroom reference values: shaft width, medullary index, medulla pattern, scale pattern and pigment distribution (after Saferstein’s <i>Criminalistics</i> and the SWGMAT Forensic Human Hair Examination Guidelines, 2005). Real hairs vary along their length and between body areas; a single value per species is a simplification. The ocular micrometer is set to 5 µm per division at 400×.</p><p><b>Fibers.</b> Shapes and burn behavior follow standard textile burn-test tables. Refractive indices are approximate published values (Robertson and Grieve, <i>Forensic Examination of Fibres</i>), and each fiber has one typical thickness. The interference color is computed from Γ = Δn × t with I(λ) = sin²(πΓ/λ) averaged over red, green and blue bands, so the colors follow the Michel-Lévy chart only roughly. Real labs confirm fiber polymers with infrared spectroscopy and compare dyes with microspectrophotometry.</p><p><b>Limits.</b> Microscopic hair comparison cannot identify one person. In 2015 the FBI reported that its examiners had overstated hair-match testimony in most reviewed cases, and labs now pair hair comparisons with mitochondrial or nuclear DNA. All cases, places and people here are fictional.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);syncLight(sim);
    if(p.mode==='case')drawCase(sim,ctx,k,t);else if(p.mode==='fiber')drawFiberLab(sim,ctx,k,t);else drawHairLab(sim,ctx,k,t);},
  thumbSetup(sim){sim.p.mode='hair';sim.p.species='dog';},thumbFrames:10
};
function syncLight(sim){const key=BioLab.level+sim.p.mode+sim.p.item+sim.p.species+sim.p.hview;if(sim._sk!==key){sim._sk=key;syncMode(sim);}}
function descHair(h,view){const S=SP[h.sp];if(view==='scales')return 'scales '+SCS[S.sc];
  return (h.sp==='human'?(h.tr==='bleached'?'pale yellow, few pigment grains':h.hc==='dark'?'dark brown pigment':'brown pigment')+', ':'')+(S.med==='frag'?'a thin, broken medulla':'a '+MEDS[S.med]+' medulla over half the width');}
function descFiber(f,view){const F=FIB[f.f];if(view==='polar')return 'Γ ≈ '+Math.round(retard(f.f)/10)*10+' nm';if(view==='cross')return {cotton:'bean-shaped',wool:'round with a scaly edge',silk:'triangular',rayon:'round with a notched edge',nylon:'round',polyester:'round',acrylic:'dog-bone shaped'}[f.f]+', '+f.c;return f.c+', '+F.look;}
function compareText(cs,item,i){return (truth(cs,item,i)?'Consistent: every feature agrees':'Excluded: '+(item==='hair'?(CASES[cs].hair.sp!==CASES[cs].sus[i].hair.sp?'different species':'different color or treatment'):(CASES[cs].fiber.f!==CASES[cs].sus[i].fiber.f?'different fiber type':'different color')));}

/* ---------- hair lab ---------- */
function hairView(ctx,H,view,half,seed,measureOn,k){const ppu=HPPU;
  ctx.save();ctx.translate(FX,FY);ctx.rotate(-0.1);
  if(view==='root')drawRoot(ctx,H,0.42,-FR*0.62,FR+30,k);
  else drawHairShaft(ctx,H,view,ppu,-FR-30,FR+30,seed);
  if(measureOn&&view==='medulla'){const m=measure(H),x=half==='R'?60:half==='L'?-60:70,div=5*ppu,n=Math.ceil(H.d/5)+8;
    ctx.strokeStyle='#1d3f8a';ctx.lineWidth=1.2;const y0=-n*div/2;ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y0+n*div);ctx.stroke();
    for(let i=0;i<=n;i++){const L=i%10===0?10:i%5===0?7:4;ctx.beginPath();ctx.moveTo(x,y0+i*div);ctx.lineTo(x+L,y0+i*div);ctx.stroke();}
    ctx.strokeStyle='#c11430';ctx.lineWidth=2;const D=H.d*ppu,M=H.mi*D;[[D,-34],[M,-18]].forEach(([w,dx])=>{if(w<1)return;ctx.beginPath();ctx.moveTo(x+dx+6,-w/2);ctx.lineTo(x+dx,-w/2);ctx.lineTo(x+dx,w/2);ctx.lineTo(x+dx+6,w/2);ctx.stroke();});}
  ctx.restore();}
function drawHairLab(sim,ctx,k,t){const p=sim.p,H=curHair(sim),S=SP[p.species],hon=atLeast('honors'),ap=atLeast('ap');
  field(ctx,false);clipField(ctx);hairView(ctx,H,p.hview,null,11,hon&&p.measure,k);
  scaleBar(ctx,p.hview==='root'?200:50,p.hview==='root'?0.42:HPPU,k);ctx.restore();
  txt(ctx,(p.species==='human'?'Human head hair':S.l+' hair')+' · '+(p.hview==='root'?'200×':'400×'),20,30,{s:15*k,w:700});
  // right panel
  panel(ctx,44,392);let y=58;
  if(hon&&p.hview!=='root'){const cx=PX+58,cy=y+50,R=42;ctx.fillStyle=rgb(H.col,0.45);ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=3;ctx.stroke();
    if(S.mi>0){ctx.fillStyle='#2a2622';ctx.beginPath();ctx.arc(cx,cy,R*S.mi,0,TAU);ctx.fill();}
    const lx=PX+118,ls=12.5*k;txt(ctx,'cuticle',lx,cy-ls*1.1,{s:ls,c:PAL['cv-ink'],b:'middle'});txt(ctx,'cortex',lx,cy,{s:ls,c:PAL['cv-ink'],b:'middle'});txt(ctx,'medulla',lx,cy+ls*1.1,{s:ls,c:PAL['cv-ink'],b:'middle'});
    y=cy+R+10;}
  const L=[];
  if(p.hview==='root'){L.push({t:p.root==='pulled'?'Pulled out while growing (anagen)':'Fell out on its own (telogen)',s:14,w:700});L.push({t:p.root==='pulled'?'Long pigmented root wrapped in root-sheath tissue.':'Dry, club-shaped root, no tissue.',s:13,c:PAL['cv-soft']});L.push({t:'DNA: '+(p.root==='pulled'?'nuclear DNA likely':'mostly mitochondrial DNA'),s:13,w:700});}
  else{L.push({t:'Scales: '+SCS[S.sc],s:13.5});L.push({t:'Medulla: '+MEDS[S.med],s:13.5});
    if(hon){const m=measure(H);L.push({t:p.measure?'Micrometer: shaft '+m.sd.toFixed(0)+' div, medulla '+m.md.toFixed(1)+' div':'Turn on the micrometer to measure',s:13,c:PAL['cv-soft']});L.push({t:'Medullary index = '+S.mi.toFixed(2),s:13.5,w:700});}
    if(ap)L.push({t:'Shaft width ≈ '+S.d+' µm',s:13,c:PAL['cv-soft']});
    if(hon&&p.species==='human')L.push({t:'Color: '+(p.treat==='natural'?'natural pigment grains':p.treat==='dyed'?'dye colors cuticle and cortex':'bleached, few grains left'),s:13,c:PAL['cv-soft']});}
  y=textBlock(ctx,L,PX+14,y,PW-28,400,k);
  if(p.hview!=='root'){const v=verdictHair(H),hum=S.mi<1/3;pill(ctx,k>1.35?(hum?'Human pattern':'Animal pattern'):v,PX+PW/2,416,hum?PAL['s2']:PAL['s4'],'#fff',13*k);}}

/* ---------- fiber lab ---------- */
function fiberView(ctx,F,c,view,half,seed,k){if(view==='cross'){const R=FIB[F].d*FPPU*0.5,pts=half?[[-0.3,-0.55],[0.35,-0.25],[-0.35,0.05],[0.3,0.35],[-0.2,0.62]]:[[-0.5,-0.35],[0.15,-0.5],[0.55,-0.05],[-0.2,0.15],[0.3,0.45],[-0.55,0.4],[-0.05,-0.15]];
    pts.forEach((q,i)=>{const x=FX+q[0]*FR*(half?0.55:0.9)+(half==='L'?-FR*0.45:half==='R'?FR*0.45:0),y=FY+q[1]*FR*0.9;crossSection(ctx,F,x,y,R*(0.9+0.2*((i*37)%5)/5),c);});return;}
  ctx.save();ctx.translate(FX,FY);ctx.rotate(-0.12);
  const ys=view==='polar'?[-60,40]:[-55,50];ys.forEach((y0,i)=>{ctx.save();ctx.rotate(i?0.22:0);drawFiber(ctx,F,c,FPPU,-FR-30,FR+30,view,seed+i,y0);ctx.restore();});
  ctx.restore();}
function drawFiberLab(sim,ctx,k,t){const p=sim.p,F=p.fiber,f=FIB[F],ap=atLeast('ap'),dark=p.fview==='polar';
  field(ctx,dark);clipField(ctx);fiberView(ctx,F,null,p.fview,null,3,k);scaleBar(ctx,20,FPPU,k,dark);ctx.restore();
  txt(ctx,f.l+' · '+(p.fview==='cross'?'cross sections':p.fview==='polar'?'crossed polarizers':'about 1000×'),20,30,{s:15*k,w:700});
  if(dark)txt(ctx,'Γ = '+Math.round(retard(F))+' nm',FX,FY-FR+30,{s:13*k,w:700,a:'center',c:'#f2f2f2'});
  // burn test panel
  panel(ctx,44,392);const st=sim.st,bt=st.burn!==null&&st.burnF===F?st.burn:null;
  txt(ctx,'Burn test (known sample)',PX+14,70,{s:14*k,w:700});
  const fx=PX+PW/2,fy=k>1.35?212:232;
  // flame
  const fl=(x,y,s,a)=>{ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#f39a1e';ctx.beginPath();ctx.moveTo(x,y-46*s);ctx.bezierCurveTo(x+22*s,y-14*s,x+18*s,y+10*s,x,y+12*s);ctx.bezierCurveTo(x-18*s,y+10*s,x-22*s,y-14*s,x,y-46*s);ctx.fill();
    ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.moveTo(x,y-26*s);ctx.bezierCurveTo(x+11*s,y-6*s,x+9*s,y+8*s,x,y+9*s);ctx.bezierCurveTo(x-9*s,y+8*s,x-11*s,y-6*s,x,y-26*s);ctx.fill();ctx.restore();};
  ctx.fillStyle=PAL['line'];rr(ctx,fx-26,fy+16,52,14,4);ctx.fill();const flick=RM?1:1+0.06*Math.sin(t*14);fl(fx,fy+6,flick,1);
  const tt=bt===null?0:bt,dip=tt<1.3?tt/1.3:tt<2.6?1:Math.max(0,1-(tt-2.6)/0.8);const ty=fy-100+dip*44;
  // tweezers
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx-42,ty-22);ctx.lineTo(fx-4,ty);ctx.moveTo(fx-38,ty-28);ctx.lineTo(fx+2,ty-6);ctx.stroke();
  // fiber tuft
  const burned=bt===null?0:clamp((tt-1.3)/2.2,0,1)*(f.melt?0.75:(f.out==='goes out by itself'?0.55:1)),shrink=f.melt&&bt!==null?clamp(tt/1.3,0,1):0;
  const len=54*(1-burned)*(1-0.3*shrink);const tc=mix(f.col,[60,50,40],0.45);ctx.strokeStyle=rgb(tc);ctx.lineWidth=2.2;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(fx,ty);const curl=(f.near.includes('away')?shrink*14+(bt!==null&&!f.melt?clamp(tt/1.3,0,1)*10:0):0);ctx.quadraticCurveTo(fx+i*3+Math.sign(i||1)*curl,ty+len*0.5,fx+i*5+Math.sign(i||1)*curl*0.6,ty+len);ctx.stroke();}
  if(bt!==null&&tt>1.3){const end=ty+len;if(f.melt){ctx.fillStyle=f.bead;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1;ctx.beginPath();ctx.arc(fx,end,4+5*burned,0,TAU);ctx.fill();ctx.stroke();}
    else{ctx.fillStyle=f.res.includes('gray')||f.res.includes('little')?'#9a9a9a':'#3a3634';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(fx+((i*13)%9-4)*1.6,end+((i*7)%5),2.2,0,TAU);ctx.fill();}}
    if(tt>2.6&&tt<4&&(f.out.startsWith('keeps')))fl(fx,end+4,0.35,0.9);
    if(F==='polyester'&&tt>1.3&&tt<3.4){ctx.fillStyle='rgba(60,60,64,.35)';for(let i=0;i<6;i++){const yy=end-12-((t*40+i*16)%70);ctx.beginPath();ctx.arc(fx+Math.sin(t*3+i)*8,yy,5+i,0,TAU);ctx.fill();}}}
  // results lines
  const ry=fy+40,L=[];
  if(bt===null)L.push({t:'Press “Run the burn test.”',s:13,c:PAL['cv-soft']});
  else{L.push({t:'Near: '+f.near,s:12.5});if(tt>1.3)L.push({t:'In: '+f.inF,s:12.5});if(tt>2.6)L.push({t:'Out: '+f.out,s:12.5});if(tt>3.6){L.push({t:'Smell: '+f.smell,s:12.5,w:700});L.push({t:'Residue: '+f.res,s:12.5,w:700});}}
  textBlock(ctx,L,PX+14,ry,PW-28,432,k);}

/* ---------- case: comparison microscope ---------- */
function drawCase(sim,ctx,k,t){const p=sim.p,C=CASES[p.cs],S=C.sus[p.suspect],hon=atLeast('honors');
  const dark=p.item==='fiber'&&p.fview==='polar';field(ctx,dark);
  if(p.item==='hair'){const v=p.hview==='root'?'medulla':p.hview;clipField(ctx,'L');hairView(ctx,hairObj(C.hair),v,'L',11,hon&&p.measure,k);ctx.restore();clipField(ctx,'R');hairView(ctx,hairObj(S.hair),v,'R',23,hon&&p.measure,k);ctx.restore();}
  else{clipField(ctx,'L');fiberView(ctx,C.fiber.f,C.fiber.c,p.fview,'L',3,k);ctx.restore();clipField(ctx,'R');fiberView(ctx,S.fiber.f,S.fiber.c,p.fview,'R',9,k);ctx.restore();}
  ctx.strokeStyle=LENS;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(FX,FY-FR);ctx.lineTo(FX,FY+FR);ctx.stroke();
  const phn=k>1.35;txt(ctx,phn?'Scene':'Scene evidence',FX-FR*0.5,FY-FR-14,{s:13*k,w:700,a:'center'});txt(ctx,phn?S.n:S.n+': '+(p.item==='hair'?S.hl:S.fl),FX+FR*0.5,FY-FR-14,{s:13*k,w:700,a:'center'});
  if(!phn)txt(ctx,'Comparison microscope · '+(p.item==='hair'?'400×':'about 1000×'),20,30,{s:15*k,w:700});
  // evidence card and suspect cards
  const c=calls(sim),eh=phn?78:58;ctx.fillStyle=PAL['card2'];rr(ctx,PX,44,PW,eh,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Scene evidence',PX+14,44+18*Math.min(k,1.3),{s:13*k,w:700});txt(ctx,'1 hair and 1 '+C.fiber.c+' fiber',PX+14,44+18*Math.min(k,1.3)+15*k,{s:12.5*k,c:PAL['cv-soft']});
  const gap=8,y0=44+eh+gap,ch=(436-y0-2*gap)/3;
  C.sus.forEach((s,i)=>{const y=y0+i*(ch+gap),sel=i===p.suspect;ctx.fillStyle=PAL['card'];rr(ctx,PX,y,PW,ch,10);ctx.fill();ctx.strokeStyle=sel?PAL['rj']:PAL['line'];ctx.lineWidth=sel?3:1;ctx.stroke();
    const hv=c[p.cs+'|hair|'+i]||'unsure',fv=c[p.cs+'|fiber|'+i]||'unsure',ls=12.5*k,y1=y+20*Math.min(k,1.3);
    txt(ctx,s.n,PX+14,y1,{s:14*k,w:700});
    const line=(lab,yy,cv)=>{txt(ctx,lab,PX+14,yy,{s:ls,c:PAL['cv-ink']});const col=cv==='consistent'?PAL['s3']:cv==='excluded'?PAL['s1']:PAL['cv-soft'];txt(ctx,cv==='unsure'?'?':cv,PX+PW-12,yy,{s:ls,w:700,a:'right',c:col});};
    line(phn?'Hair: '+(s.hair.sp==='human'?'human':s.hair.sp):'Hair: '+s.hl,y1+ls*1.4,hv);
    line(phn?'Fiber: '+s.fiber.c:'Fiber: '+s.fl,y1+ls*2.75,fv);});}

HF.onLevel=syncMode;
const C0=HF.controls;
C0.find(c=>c.id==='mode').onChange=sim=>{syncMode(sim);loadCall(sim);};
['cs','item','suspect'].forEach(id=>{C0.find(c=>c.id===id).onChange=sim=>loadCall(sim);});
C0.find(c=>c.id==='call').onChange=sim=>{calls(sim)[ckey(sim.p)]=sim.p.call;sim.infoDirty=true;};
['species','hview','fview','fiber'].forEach(id=>{C0.find(c=>c.id===id).onChange=sim=>{syncMode(sim);sim.infoDirty=true;};});
BioLab.register(HF);
})();

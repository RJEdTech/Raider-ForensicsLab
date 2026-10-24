(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,bars,lvText}=BioLab.h;
const TAU=Math.PI*2,D2R=Math.PI/180;

/* ---------- a single-stroke lowercase hand ----------
   Glyphs live in x-height units: baseline y = 0, x-height 1, ascender 1.75, descender −0.75.
   A point [x,y,1] is a corner; runs between corners are smoothed with Catmull–Rom splines. */
function A(cx,cy,rx,ry,a0,a1){const n=Math.max(3,Math.ceil(Math.abs(a1-a0)/18)),o=[];for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*D2R;o.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}return o;}
const C=(x,y)=>[x,y,1];
function glyph(ch,W){switch(ch){
  case 'a':return W.aForm==='two'?{w:0.95,s:[[[0.12,0.82],[0.3,0.98],[0.58,1.0],[0.78,0.85],C(0.8,0.6),[0.8,0.12],[0.92,0]],[[0.8,0.58],[0.5,0.6],[0.2,0.5],[0.1,0.28],[0.25,0.04],[0.55,0.04],[0.8,0.22]]]}
                                :{w:0.95,s:[[...A(0.42,0.5,0.4,0.5,25,370),C(0.84,1.0),[0.84,0.12],[0.95,0]]]};
  case 'b':return {w:0.92,s:[[[0.1,1.75],C(0.1,0.0),...A(0.47,0.45,0.37,0.45,195,-165)]]};
  case 'c':return {w:0.82,s:[A(0.45,0.5,0.4,0.5,45,315)]};
  case 'd':return {w:0.95,s:[[...A(0.42,0.5,0.4,0.5,25,370),C(0.84,1.75),[0.84,0.12],[0.95,0]]]};
  case 'e':return W.eForm==='loop'?{w:0.85,s:[[[0.05,0.25],[0.45,0.5],[0.7,0.75],[0.62,0.97],[0.4,0.98],[0.22,0.75],[0.2,0.4],[0.32,0.1],[0.55,0],[0.8,0.12]]]}
                                  :{w:0.88,s:[[[0.1,0.5],C(0.82,0.5),...A(0.46,0.5,0.37,0.5,10,315)]]};
  case 'f':return {w:0.66,s:[[[0.72,1.6],[0.55,1.75],[0.38,1.68],[0.3,1.4],[0.3,0.0]],[[0.05,1.0],[0.62,1.0]]]};
  case 'g':return {w:0.9,s:[[...A(0.42,0.55,0.38,0.45,25,370),C(0.8,1.0),[0.8,-0.4],[0.68,-0.7],[0.4,-0.78],[0.15,-0.6]]]};
  case 'h':return {w:0.92,s:[[[0.1,1.75],C(0.1,0),[0.12,0.5],[0.3,0.88],[0.52,1.0],[0.72,0.88],[0.78,0.6],[0.78,0.12],[0.88,0]]]};
  case 'i':return {w:0.36,s:[[[0.15,1.0],[0.15,0.12],[0.26,0]]],dot:[0.15,1.42]};
  case 'j':return {w:0.45,s:[[[0.32,1.0],[0.32,-0.45],[0.22,-0.72],[0.02,-0.76],[-0.12,-0.6]]],dot:[0.32,1.42]};
  case 'k':return {w:0.8,s:[[[0.1,1.75],[0.1,0]],[[0.7,1.0],C(0.14,0.45),[0.72,0]]]};
  case 'l':return {w:0.36,s:[[[0.15,1.75],[0.15,0.12],[0.27,0]]]};
  case 'm':return {w:1.15,s:[[[0.08,1.0],C(0.08,0),[0.1,0.55],[0.25,0.92],[0.4,0.98],[0.52,0.8],C(0.53,0),[0.55,0.55],[0.7,0.92],[0.85,0.98],[0.97,0.8],[0.97,0.12],[1.06,0]]]};
  case 'n':return {w:0.92,s:[[[0.1,1.0],C(0.1,0),[0.12,0.55],[0.3,0.9],[0.52,1.0],[0.72,0.88],[0.78,0.6],[0.78,0.12],[0.88,0]]]};
  case 'o':return {w:0.88,s:[A(0.45,0.5,0.4,0.5,100,460)]};
  case 'p':return {w:0.92,s:[[[0.1,1.0],[0.1,-0.75]],A(0.47,0.5,0.37,0.48,170,-170)]};
  case 'q':return {w:1.0,s:[[...A(0.42,0.5,0.4,0.5,25,370),C(0.84,1.0),[0.84,-0.75],C(1.0,-0.55)]]};
  case 'r':return {w:0.7,s:[[[0.1,1.0],C(0.1,0),[0.12,0.55],[0.3,0.88],[0.5,1.0],[0.7,0.95]]]};
  case 's':return {w:0.8,s:[[[0.7,0.9],[0.5,1.0],[0.24,0.96],[0.13,0.76],[0.3,0.56],[0.58,0.46],[0.74,0.25],[0.62,0.05],[0.36,0],[0.08,0.12]]]};
  case 't':return {w:0.68,s:[[[0.33,1.6],[0.33,0.15],[0.42,0],[0.62,0.06]]],cross:true};
  case 'u':return {w:0.92,s:[[[0.1,1.0],[0.1,0.35],[0.22,0.06],[0.42,0],[0.64,0.12],[0.76,0.45],C(0.78,1.0),[0.78,0.12],[0.88,0]]]};
  case 'v':return {w:0.84,s:[[C(0.05,1.0),C(0.4,0),C(0.78,1.0)]]};
  case 'w':return {w:1.06,s:[[C(0.03,1.0),C(0.27,0),C(0.52,0.78),C(0.77,0),C(1.0,1.0)]]};
  case 'x':return {w:0.8,s:[[[0.08,1.0],[0.72,0]],[[0.72,1.0],[0.08,0]]]};
  case 'y':return {w:0.86,s:[[[0.08,1.0],[0.43,0.08]],[[0.8,1.0],[0.38,-0.45],[0.22,-0.72],[0.02,-0.72]]]};
  case 'z':return {w:0.8,s:[[C(0.08,1.0),C(0.72,1.0),C(0.08,0),C(0.75,0)]]};
  case '.':return {w:0.32,s:[],dot:[0.12,0.02],period:true};
  case ',':return {w:0.32,s:[[[0.16,0.06],[0.06,-0.3]]]};
  case "'":return {w:0.3,s:[[[0.15,1.7],[0.12,1.25]]]};
  case '!':return {w:0.34,s:[[[0.15,1.7],[0.14,0.45]]],dot:[0.14,0.02],period:true};
  case '?':return {w:0.75,s:[[[0.1,1.4],[0.3,1.7],[0.55,1.68],[0.66,1.42],[0.5,1.12],[0.36,0.9],[0.35,0.45]]],dot:[0.35,0.02],period:true};
  default:return null;}}
const XH=new Set('acemnorsuvwxz'.split('')),ASC=new Set('bdfhklt'.split('')),DESC=new Set('gjpqy'.split(''));
function catmull(pts){if(pts.length<3)return pts.map(p=>[p[0],p[1]]);const o=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
  for(let s=0;s<6;s++){const t=s/6,t2=t*t,t3=t2*t;o.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}
  const L=pts[pts.length-1];o.push([L[0],L[1]]);return o;}
function smooth(pts){const out=[];let run=[];pts.forEach((p,i)=>{run.push(p);if((p[2]&&i>0)||i===pts.length-1){const seg=catmull(run);if(out.length)seg.shift();out.push(...seg);run=[p];}});return out;}
function resample(pts,step){const o=[pts[0]];let acc=0;for(let i=1;i<pts.length;i++){let [x0,y0]=pts[i-1];const [x1,y1]=pts[i],d=Math.hypot(x1-x0,y1-y0);if(d<1e-9)continue;let t=0;
    while(acc+(d*(1-t))>=step){const need=step-acc,f=t+need/d;const x=lerp(pts[i-1][0],x1,f),y=lerp(pts[i-1][1],y1,f);o.push([x,y]);t=f;acc=0;}acc+=d*(1-t);}
  const L=pts[pts.length-1],Q=o[o.length-1];if(Math.hypot(L[0]-Q[0],L[1]-Q[1])>0.3)o.push([L[0],L[1]]);return o;}

/* ---------- write text with a writer's habits ----------
   W: {size (x-height, px), slant (°), spacing (word gap, in x-heights), base ('straight'|'rise'|'fall'|'wavy'), press (line width px),
       connect (bool), aForm, eForm, tCross ('mid'|'high'|'low'|'slant'), iDot ('dot'|'circle'|'dash'), speed ('natural'|'slow'|'traced'), vary (natural variation 0..1)} */
function write(W,text,seed,x0,y0,maxW,lineH){const r=rng(seed),g=()=>(r()+r()+r()-1.5)/1.5;const em=W.size,sl=Math.tan(W.slant*D2R),vary=W.vary===undefined?1:W.vary;
  const out={strokes:[],letters:[],words:[],lines:[],em};let X=x0,Y=y0,line=0,lineX0=x0;
  const base=x=>{const u=x-lineX0;return W.base==='rise'?-u*Math.tan(3.5*D2R):W.base==='fall'?u*Math.tan(3*D2R):W.base==='wavy'?3.2*Math.sin(u/55):0;};
  const words=text.replace(/\n/g,' \n ').split(/ +/).filter(w=>w.length);
  for(const wd of words){if(wd==='\n'){X=x0;Y+=lineH;line++;lineX0=x0;continue;}
    let ww=0;for(const ch of wd){const G=glyph(ch,W);if(G)ww+=G.w*em*0.95+em*0.14;}
    if(X>x0&&X+ww>x0+maxW){X=x0;Y+=lineH;line++;lineX0=x0;}
    const word={x0:X,x1:X,line,letters:[]};let prev=null;
    for(const ch of wd){const G=glyph(ch,W);if(!G)continue;const sf=1+0.045*vary*g(),ls=sl+Math.tan(1.6*vary*g()*D2R),by=Y+base(X)+0.5*vary*g();
      const T=(gx,gy)=>[X+gx*em*0.95*sf+gy*em*sf*ls,by-gy*em*sf];
      const L={ch,x:X,by,em:em*sf,pts:[],word:out.words.length,line,strokes:[]};
      G.s.forEach((sv,si)=>{const pts=smooth(sv.map(p=>p[2]?[...T(p[0],p[1]),1]:T(p[0],p[1])).map(p=>p)).map(p=>[p[0],p[1]]);
        let st={pts,kind:'letter',ch,li:out.letters.length};
        if(si===0&&prev&&W.connect&&!prev.noJoin){const a=prev.pts[prev.pts.length-1],b=pts[0],mx=(a[0]+b[0])/2,my=Math.max(a[1],b[1])+em*0.08;const conn=[];for(let i=1;i<8;i++){const t=i/8;conn.push([(1-t)*(1-t)*a[0]+2*(1-t)*t*mx+t*t*b[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*my+t*t*b[1]]);}
          out.strokes.push({pts:[a,...conn,b],kind:'conn',li:out.letters.length});prev.pts=prev.pts.concat(conn,pts);prev.joined=true;st=prev;st.parts=(st.parts||1)+1;L.strokes.push(st);}
        else{out.strokes.push(st);L.strokes.push(st);}
        if(si===G.s.length-1)prev=st;L.pts.push(...pts);});
      if(G.dot){const [dx,dy]=T(G.dot[0],G.dot[1]);let pts;if(G.period||W.iDot==='dot')pts=[[dx,dy],[dx+0.8,dy+0.4]];else if(W.iDot==='circle')pts=A(dx,dy,em*0.17,em*0.17,0,360).map(p=>[p[0],p[1]]);else pts=[[dx-em*0.16,dy+em*0.06],[dx+em*0.2,dy-em*0.08]];
        out.strokes.push({pts,kind:G.period?'letter':'dot',ch,li:out.letters.length,dot:true});L.dotAt=[dx,dy];}
      if(G.cross){const c=W.tCross;const seg=c==='high'?[[0.02,1.42],[0.66,1.42]]:c==='low'?[[0.06,0.72],[0.6,0.72]]:c==='slant'?[[0.0,0.82],[0.72,1.22]]:[[0.05,1.0],[0.64,1.0]];
        const pts=smooth([T(...seg[0]),T(...seg[1])]);out.strokes.push({pts,kind:'cross',ch,li:out.letters.length});L.crossAt=T((seg[0][0]+seg[1][0])/2,(seg[0][1]+seg[1][1])/2);}
      if(!G.s.length&&!W.connect)prev=null;if(G.period)prev=null;
      L.adv=G.w*em*0.95*sf;out.letters.push(L);word.letters.push(L);X+=G.w*em*0.95*sf+em*(W.connect?0.1:0.16)*(1+0.25*vary*g());word.x1=X;}
    out.words.push(word);X+=W.spacing*em*(1+0.12*vary*g());}
  out.nLines=line+1;
  // line quality: width, taper, tremor, pen lifts
  const fine=out.strokes.filter(s=>s.kind!=='conn'||!W.connect);
  out.ink=[];const seen=new Set();
  out.strokes.forEach(s=>{if(seen.has(s))return;if(s.kind==='conn')return;seen.add(s);
    let pts=resample(s.pts,1.6);if(pts.length<2)pts=[s.pts[0],[s.pts[0][0]+0.6,s.pts[0][1]+0.3]];
    const slow=W.speed==='slow'||W.speed==='traced';
    if(slow){const amp=W.speed==='traced'?0.32:0.42;pts=pts.map((p,i)=>{if(i===0||i===pts.length-1)return p;const a=pts[i-1],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,n=amp*(Math.sin(i*1.9+seed)+0.6*(r()-0.5)*2);return [p[0]-dy/d*n,p[1]+dx/d*n];});}
    // pen lifts: slow writers stop and restart mid-stroke
    const pieces=[];if(slow&&pts.length>40){let a=0;for(let i=28;i<pts.length-12;i++){if(r()<0.02){pieces.push(pts.slice(a,i));a=i+1;i+=24;}}pieces.push(pts.slice(a));}else pieces.push(pts);
    pieces.forEach(pp=>{if(pp.length<2)return;const n=pp.length,w=[];let len=0;const cum=[0];for(let i=1;i<n;i++){len+=Math.hypot(pp[i][0]-pp[i-1][0],pp[i][1]-pp[i-1][1]);cum.push(len);}
      for(let i=0;i<n;i++){let ww=W.press;if(!slow){const dy=(pp[Math.min(n-1,i+1)][1]-pp[Math.max(0,i-1)][1]);ww*=dy>0.3?1.18:0.82;const tp=Math.max(5,len*0.12),a=Math.min(cum[i],len-cum[i]);ww*=s.dot?1:clamp(0.25+0.75*a/tp,0.25,1);}else ww*=0.95+0.05*Math.sin(i*0.7);w.push(ww);}
      out.ink.push({pts:pp,w,blunt:slow&&!s.dot,kind:s.kind,li:s.li});});});
  out.lifts=out.ink.filter(k=>k.kind==='letter').length;
  return out;}

/* ---------- measurements made on the generated writing ---------- */
function measure(S){const em=S.em;let sx=0,sy=0;
  S.letters.forEach(L=>{if(!ASC.has(L.ch))return;L.strokes.forEach(st=>{const p=st.pts;for(let i=1;i<p.length;i++){const dx=p[i][0]-p[i-1][0],dy=p[i][1]-p[i-1][1];if(dy>0&&Math.abs(dx)<dy*0.9){sx+=dx;sy+=dy;}}});});
  const slant=sy>0?Math.atan2(-sx,sy)/D2R:0;
  const hs=[],asc=[];S.letters.forEach(L=>{let lo=1e9,hi=-1e9;L.pts.forEach(p=>{lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);});if(XH.has(L.ch))hs.push(hi-lo);if(ASC.has(L.ch)&&L.ch!=='t')asc.push(hi-lo);L.bot=hi;L.top=lo;
    let x0=1e9,x1=-1e9;L.pts.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);});L.bx0=x0;L.bx1=x1;});
  const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;const xh=mean(hs),ratio=asc.length&&xh?mean(asc)/xh:0;
  const gaps=[];S.words.forEach((w,i)=>{const nx=S.words[i+1];if(!nx||nx.line!==w.line||!w.letters.length||!nx.letters.length)return;const a=Math.max(...w.letters.map(l=>l.bx1)),b=Math.min(...nx.letters.map(l=>l.bx0));gaps.push(b-a);});
  const space=xh?mean(gaps)/xh:0;
  const lines=[];for(let l=0;l<S.nLines;l++){const pts=S.letters.filter(L=>L.line===l&&!DESC.has(L.ch)&&/[a-z]/.test(L.ch)).map(L=>[(L.bx0+L.bx1)/2,L.bot]);if(pts.length<3)continue;
    const mx=mean(pts.map(p=>p[0])),my=mean(pts.map(p=>p[1]));let num=0,den=0;pts.forEach(p=>{num+=(p[0]-mx)*(p[1]-my);den+=(p[0]-mx)**2;});const m=den?num/den:0;
    const res=Math.sqrt(mean(pts.map(p=>(p[1]-(my+m*(p[0]-mx)))**2)));lines.push({m,b:my-m*mx,x0:Math.min(...pts.map(p=>p[0])),x1:Math.max(...pts.map(p=>p[0])),res});}
  const bAng=lines.length?mean(lines.map(L=>-Math.atan(L.m)/D2R)):0,bRes=lines.length?mean(lines.map(L=>L.res)):0;
  const ws=[];S.ink.forEach(k=>{if(k.kind==='letter')k.w.forEach(v=>ws.push(v));});const press=mean(ws);
  let trans=0,joined=0;S.words.forEach(w=>{trans+=Math.max(0,w.letters.length-1);});joined=S.strokes.filter(s=>s.kind==='conn').length;
  return {slant,xh,ratio,space,lines,bAng,bRes,press,conn:trans?joined/trans:0};}
function baseWord(m){return Math.abs(m.bAng)<1.2&&m.bRes<1.5?'straight':m.bRes>=1.5?'wavy':m.bAng>0?'rising':'falling';}
function slantWord(a){return Math.abs(a)<5?'upright':a>0?'leans right':'leans left';}

/* ---------- fictional writers and the case ---------- */
const WR={
  A:{size:17,slant:1,spacing:1.3,base:'straight',press:2.9,connect:false,aForm:'two',eForm:'print',tCross:'mid',iDot:'dot',speed:'natural'},
  B:{size:20,slant:19,spacing:1.55,base:'rise',press:2.0,connect:true,aForm:'one',eForm:'loop',tCross:'high',iDot:'circle',speed:'natural'},
  C:{size:16.5,slant:16,spacing:0.75,base:'wavy',press:1.45,connect:true,aForm:'two',eForm:'loop',tCross:'slant',iDot:'circle',speed:'natural'}};
const QW=WR.C,NOTE='leave fifty dollars by the gym door\nor the trophy stays gone',LET=['A','B','C'];
const FEAT=[
  {id:'slant',l:'Slant',lvl:'bio',how:'Look at the tall letters (l, t, d, h). Do they lean the same way, by about the same amount?'},
  {id:'size',l:'Letter size',lvl:'bio',how:'Compare the height of the small letters (a, o, e, n) between the guide lines.'},
  {id:'spacing',l:'Spacing between words',lvl:'bio',how:'Are the gaps between words wide or tight, compared with the letter size?'},
  {id:'connect',l:'Connecting strokes',lvl:'bio',how:'Does the writer join letters with connecting strokes (highlighted), or lift the pen between letters?'},
  {id:'aForm',l:'Form of the a',lvl:'bio',how:'Is each a round and one-story, or does it have a hood on top (two-story)?'},
  {id:'iDot',l:'i dots',lvl:'bio',how:'Is the i dotted with a dot, a small circle or a dash?'},
  {id:'baseline',l:'Baseline',lvl:'honors',how:'Do the letters sit on a straight line, climb, drop or wander?'},
  {id:'press',l:'Pen pressure',lvl:'honors',how:'Compare the line width in the zoom circles. Heavy pressure makes wide, dark lines.'},
  {id:'tCross',l:'t crossings',lvl:'honors',how:'Where does the t-bar sit: high, in the middle, low, or at a slant?'},
  {id:'eForm',l:'Form of the e',lvl:'honors',how:'Is the e made with a bar and a curve (print) or as a single loop?'}];
const SPACEDESC=v=>v>1.25?'wide':v<0.9?'tight':'medium';
function featVal(id,W,m){switch(id){case 'slant':return slantWord(m.slant)+(atLeast('ap')?' ('+m.slant.toFixed(0)+'°)':'');case 'size':return (m.xh>18.5?'large':m.xh<17?'small':'medium')+(atLeast('ap')?' ('+(m.xh*0.2).toFixed(1)+' mm)':'');
  case 'spacing':return SPACEDESC(m.space)+(atLeast('ap')?' ('+m.space.toFixed(2)+' × x-height)':'');case 'connect':return W.connect?'joined':'printed, pen lifted';case 'aForm':return W.aForm==='two'?'two-story':'one-story';
  case 'iDot':return W.iDot;case 'baseline':return baseWord(m)+(atLeast('ap')?' ('+m.bAng.toFixed(1)+'°)':'');case 'press':return (m.press>2.4?'heavy':m.press<1.7?'light':'medium')+(atLeast('ap')?' ('+(m.press*0.2).toFixed(2)+' mm)':'');
  case 'tCross':return W.tCross==='mid'?'middle':W.tCross;case 'eForm':return W.eForm==='loop'?'looped':'bar and curve';}}
function featSame(id,Wa,ma,Wb,mb){switch(id){case 'slant':return Math.abs(ma.slant-mb.slant)<7;case 'size':return Math.abs(ma.xh-mb.xh)/ma.xh<0.12;case 'spacing':return Math.abs(ma.space-mb.space)<0.3;
  case 'connect':return Wa.connect===Wb.connect;case 'aForm':return Wa.aForm===Wb.aForm;case 'iDot':return Wa.iDot===Wb.iDot;case 'baseline':return baseWord(ma)===baseWord(mb);
  case 'press':return Math.abs(ma.press-mb.press)/ma.press<0.25;case 'tCross':return Wa.tCross===Wb.tCross;case 'eForm':return Wa.eForm===Wb.eForm;}}
/* the note and the exemplars are laid out once */
const NB={x:30,y:100,w:740,lh:54},EB={x:30,y:280,w:740,lh:54};
const cache={};
function sample(key,W,text,seed,box){const k=key+'|'+text+'|'+seed+'|'+box.x+','+box.y+','+box.w;if(!cache[k]){const S=write(W,text,seed,box.x,box.y,box.w,box.lh);S.m=measure(S);S.W=W;cache[k]=S;}return cache[k];}
const noteS=()=>sample('Q',QW,NOTE,101,NB);
const exS=i=>sample(LET[i],WR[LET[i]],NOTE,202+i,EB);
function visFeat(){return FEAT.filter(f=>atLeast(f.lvl));}
function sameCount(i){const q=noteS(),e=exS(i);return visFeat().filter(f=>featSame(f.id,QW,q.m,WR[LET[i]],e.m)).length;}

/* ---------- forgery: permission slips (fictional) ---------- */
const SIGW={size:24,slant:22,spacing:0.9,base:'rise',press:1.9,connect:true,aForm:'one',eForm:'loop',tCross:'mid',iDot:'dot',speed:'natural'};
const SIGT='m avery';
const KB=[{x:40,y:96},{x:300,y:96},{x:560,y:96}];
const known=i=>sample('K'+i,SIGW,SIGT,500+i*17,{x:KB[i].x,y:KB[i].y,w:240,lh:50});
const SLIP={1:'slow',2:'natural',3:'traced'};
const QB={x:60,y:300};
function slipS(n){const how=SLIP[n];if(how==='traced'){const K=known(0),dx=QB.x-KB[0].x,dy=QB.y-KB[0].y;const k='slip3';if(!cache[k]){const W=Object.assign({},SIGW,{speed:'traced'});const S=write(W,SIGT,500,QB.x,QB.y,240,50);S.m=measure(S);S.W=W;cache[k]=S;}return cache[k];}
  if(how==='slow')return sample('S1',Object.assign({},SIGW,{speed:'slow',slant:14,size:25.5,spacing:1.1,base:'straight'}),SIGT,77,{x:QB.x,y:QB.y,w:300,lh:50});
  return sample('S2',SIGW,SIGT,611,{x:QB.x,y:QB.y,w:300,lh:50});}
function overlapPct(S,K,dx,dy){const kp=[];K.ink.forEach(k=>k.pts.forEach(p=>kp.push([p[0]+dx,p[1]+dy])));let n=0,hit=0;S.ink.forEach(k=>k.pts.forEach((p,i)=>{if(i%2)return;n++;for(const q of kp){if(Math.abs(q[0]-p[0])<1.6&&Math.abs(q[1]-p[1])<1.6){hit++;break;}}}));return n?100*hit/n:0;}
const ovCache={};function slipOverlap(n){if(ovCache[n]===undefined)ovCache[n]=overlapPct(slipS(n),known(0),QB.x-KB[0].x,QB.y-KB[0].y);return ovCache[n];}
function tremor(S){let s=0,n=0;S.ink.forEach(k=>{const p=k.pts;for(let i=2;i<p.length-2;i++){const mx=(p[i-2][0]+p[i+2][0])/2,my=(p[i-2][1]+p[i+2][1])/2;s+=Math.hypot(p[i][0]-mx,p[i][1]-my);n++;}});return n?s/n:0;}
const tremCache={};function slipTremor(n){if(tremCache[n]===undefined)tremCache[n]=tremor(slipS(n));return tremCache[n];}

/* ---------- indented writing ---------- */
const IB={x:44,y:120,w:470,lh:74};
const IW=Object.assign({},QW,{size:22});
const indentS=()=>sample('I',IW,NOTE,101,IB);
function depth(p){return 12*Math.pow(0.5,p.sheets-1);} // µm on the sheet below, from a firm ballpoint
function strokeContrast(p,a,f){const d=depth(p)*(f===undefined?1:f);if(p.esda)return clamp(d/5,0,1);const e=Math.max(1,p.elev)*D2R,az=p.azim*D2R;return clamp(d/Math.tan(e)/22*Math.abs(Math.sin(a-az)),0,1);}
function visibleFrac(p){const S=indentS();let tot=0,vis=0;S.ink.forEach(k=>{const q=k.pts;for(let i=1;i<q.length;i++){const L=Math.hypot(q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]);tot+=L;if(strokeContrast(p,Math.atan2(q[i][1]-q[i-1][1],q[i][0]-q[i-1][0]),(k.w[i]+k.w[i-1])/2/IW.press)>0.35)vis+=L;}});return tot?vis/tot:0;}

/* ---------- show only what the current mode uses ---------- */
function vis(sim,c){if(!atLeast(c.lvl||'bio'))return false;if(c.modes&&!c.modes.includes(sim.p.mode))return false;return true;}
function syncMode(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def;
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(sim,c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(sim,m);});
  const btns=[...sim.ui.sec.querySelectorAll('.actions button')];d.actions.forEach(a=>{const b=btns.find(x=>x.textContent===a.label);if(b)b.hidden=!vis(sim,a);});}
function marks(sim){if(!sim._marks)sim._marks={};return sim._marks;}
function fcalls(sim){if(!sim._fc)sim._fc={};return sim._fc;}
function sandW(p){return {size:p.ssize,slant:p.sslant,spacing:p.sspace,base:atLeast('honors')?p.sbase:'straight',press:atLeast('honors')?p.spress:2,connect:p.sconnect,aForm:atLeast('honors')?p.saform:'one',eForm:'print',tCross:atLeast('honors')?p.stcross:'mid',iDot:atLeast('honors')?p.sidot:'dot',speed:atLeast('ap')?p.sspeed:'natural'};}
const SB={x:30,y:110,w:740,lh:62};
function sandS(sim){const p=sim.p,W=sandW(p),t=(sim._text||'the quick brown fox jumps over the lazy dog').toLowerCase().slice(0,90);const key='SB'+JSON.stringify(W);return sample(key,W,t,7,SB);}

/* ---------- drawing ---------- */
const INK='#1f2d6b',PAPER='#fbfaf4',RULE='#c9daea';
function wrapLines(ctx,s,maxW,sz,w){ctx.font=(w||400)+' '+sz+'px '+FONT;if(ctx.measureText(s).width<=maxW)return [s];const words=s.split(' '),out=[];let cur='';
  for(const wd of words){const t=cur?cur+' '+wd:wd;if(ctx.measureText(t).width>maxW&&cur){out.push(cur);cur=wd;}else cur=t;}if(cur)out.push(cur);return out;}
function textBlock(ctx,lines,x,y,maxW,maxY,k){let ly=y;for(const L of lines){const sz=(L.s||13)*k;const ws=wrapLines(ctx,L.t,maxW,sz,L.w);for(const w of ws){if(ly+sz>maxY)return ly;ly+=sz*1.25;txt(ctx,w,x,ly-sz*0.25,{s:sz,w:L.w||400,c:L.c||PAL['cv-ink'],a:L.a});}ly+=(L.gap||3)*k;}return ly;}
function paper(ctx,x,y,w,h,ruled){ctx.fillStyle='rgba(0,0,0,.12)';rr(ctx,x+3,y+4,w,h,6);ctx.fill();ctx.fillStyle=PAPER;rr(ctx,x,y,w,h,6);ctx.fill();ctx.strokeStyle='#d9d4c4';ctx.lineWidth=1;rr(ctx,x,y,w,h,6);ctx.stroke();
  if(ruled){ctx.strokeStyle=RULE;ctx.lineWidth=1;for(const ly of ruled){ctx.beginPath();ctx.moveTo(x+10,ly);ctx.lineTo(x+w-10,ly);ctx.stroke();}}}
function drawInk(ctx,S,col,alpha,dx,dy){ctx.save();if(dx||dy)ctx.translate(dx||0,dy||0);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=alpha===undefined?1:alpha;
  S.ink.forEach(k=>{const p=k.pts,w=k.w;for(let i=1;i<p.length;i++){ctx.lineWidth=(w[i]+w[i-1])/2;ctx.beginPath();ctx.moveTo(p[i-1][0],p[i-1][1]);ctx.lineTo(p[i][0],p[i][1]);ctx.stroke();}
    if(k.blunt){[0,p.length-1].forEach(j=>{ctx.beginPath();ctx.arc(p[j][0],p[j][1],w[j]*0.72,0,TAU);ctx.fill();});}});ctx.restore();}
const imgCache={};
function inkImage(key,S,x,y,w,h){if(imgCache[key])return imgCache[key];const cv=document.createElement('canvas'),sc=2;cv.width=w*sc;cv.height=h*sc;const g=cv.getContext('2d');g.scale(sc,sc);g.translate(-x,-y);drawInk(g,S,INK);imgCache[key]={cv,x,y,w,h};return imgCache[key];}
function blit(ctx,im){ctx.drawImage(im.cv,im.x,im.y,im.w,im.h);}
function ring(ctx,x,y,r,col){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();}
function highlight(ctx,S,f,k){const m=S.m,em=S.em,c1='#c11430',c2='#1f6feb';ctx.save();
  if(f==='slant'){const sl=Math.tan(m.slant*D2R);S.letters.forEach(L=>{if(!ASC.has(L.ch))return;const xc=(L.bx0+L.bx1)/2,yc=(L.top+L.bot)/2,y0=L.top-em*0.15,y1=L.by+em*0.15;
    ctx.strokeStyle=c2;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(xc+(yc-y0)*sl,y0);ctx.lineTo(xc+(yc-y1)*sl,y1);ctx.stroke();});}
  else if(f==='size'||f==='baseline'){m.lines.forEach(L=>{ctx.strokeStyle=f==='size'?c2:c1;ctx.lineWidth=1.4;const y0=L.b+L.m*(L.x0-6),y1=L.b+L.m*(L.x1+6);
    ctx.beginPath();ctx.moveTo(L.x0-6,y0);ctx.lineTo(L.x1+6,y1);ctx.stroke();if(f==='size'){ctx.beginPath();ctx.moveTo(L.x0-6,y0-m.xh);ctx.lineTo(L.x1+6,y1-m.xh);ctx.stroke();}
    else{ctx.setLineDash([4,4]);ctx.strokeStyle='#777';ctx.beginPath();ctx.moveTo(L.x0-6,y0);ctx.lineTo(L.x1+6,y0);ctx.stroke();ctx.setLineDash([]);}});}
  else if(f==='spacing'){S.words.forEach((w,i)=>{const nx=S.words[i+1];if(!nx||nx.line!==w.line||!w.letters.length||!nx.letters.length)return;const a=Math.max(...w.letters.map(l=>l.bx1)),b=Math.min(...nx.letters.map(l=>l.bx0)),y=w.letters[w.letters.length-1].by-em*0.5;
    ctx.fillStyle='rgba(31,111,235,.18)';ctx.fillRect(a,y-em*0.6,b-a,em*1.2);ctx.strokeStyle=c2;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a,y);ctx.lineTo(b,y);ctx.moveTo(a,y-5);ctx.lineTo(a,y+5);ctx.moveTo(b,y-5);ctx.lineTo(b,y+5);ctx.stroke();});}
  else if(f==='connect'){S.strokes.forEach(s=>{if(s.kind!=='conn')return;ctx.strokeStyle=c1;ctx.lineWidth=3.2;ctx.globalAlpha=0.75;ctx.beginPath();s.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});}
  else if(f==='aForm'||f==='eForm'){const ch=f==='aForm'?'a':'e';S.letters.forEach(L=>{if(L.ch!==ch)return;ring(ctx,(L.bx0+L.bx1)/2,L.by-em*0.5,em*0.85,c1);});}
  else if(f==='iDot'){S.letters.forEach(L=>{if(!L.dotAt||L.ch==='.'||L.ch==='!'||L.ch==='?')return;ring(ctx,L.dotAt[0],L.dotAt[1],em*0.42,c1);});}
  else if(f==='tCross'){S.letters.forEach(L=>{if(!L.crossAt)return;ring(ctx,L.crossAt[0],L.crossAt[1],em*0.62,c1);});}
  ctx.restore();}
function zoomInset(ctx,S,sx,sy,mag,cx,cy,R,k,label){ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.clip();ctx.fillStyle=PAPER;ctx.fillRect(cx-R,cy-R,2*R,2*R);ctx.translate(cx,cy);ctx.scale(mag,mag);ctx.translate(-sx,-sy);drawInk(ctx,S,INK);ctx.restore();
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();if(label)txt(ctx,label,cx,cy+R+15*k,{s:12*k,a:'center',c:PAL['cv-soft']});}

const HW={
  id:'handwriting',hash:'handwriting',apUnit:8,order:2,tab:'Handwriting',kind:'Learning tool',prereq:[],next:['chromatography','fingerprints'],
  card:'Compare a fictional ransom note with suspects’ handwriting, spot a forged signature, and read indented writing with a flashlight.',
  title:'Handwriting and questioned documents',
  lede:{bio:'A note was left when the Northfield High (fictional) mascot trophy vanished. Compare its handwriting with samples from three suspects, one feature at a time, and read the pad it was written on.',
        honors:'Document examiners compare class and individual characteristics: slant, size, spacing, baseline, pressure, connecting strokes and letter forms. Line quality reveals forgeries, and oblique light or ESDA reveals indented writing.',
        ap:'Every feature here is measured from the writing itself: slant from the downstrokes, size from the letter heights, baseline from a fitted line. Then face the hard part: handwriting comparison is opinion evidence with known error rates.'},
  scale:{bio:'The note is about 15 cm wide; small letters are about 3 mm tall.',ap:'The note is about 15 cm wide (1 stage px ≈ 0.2 mm); x-height about 3 mm; ballpoint indentations 1–12 µm deep.'},
  timeless:true,
  controls:[
    {id:'mode',label:'Task',type:'seg',def:'case',lvl:'bio',noTrial:true,options:[{v:'case',l:'Compare the note'},{v:'indent',l:'Indented writing'},{v:'forgery',l:'Forged signature?',lvl:'honors'},{v:'sandbox',l:'Write your own'}]},
    {id:'suspect',label:'Exemplar from',type:'seg',def:0,lvl:'bio',modes:['case'],noTrial:true,options:[{v:0,l:'Suspect A'},{v:1,l:'Suspect B'},{v:2,l:'Suspect C'}]},
    {id:'feature',label:'Feature to highlight',type:'select',def:'slant',lvl:'bio',modes:['case'],noTrial:true,options:[{v:'none',l:'Nothing highlighted'}].concat(FEAT.map(f=>({v:f.id,l:f.l,lvl:f.lvl})))},
    {id:'elev',label:'Flashlight angle above the page',type:'range',min:2,max:90,step:1,def:60,unit:'°',lvl:'bio',modes:['indent'],help:'90° shines straight down. A low angle skims across the paper.'},
    {id:'azim',label:'Direction the light comes from',type:'range',min:0,max:180,step:5,def:30,unit:'°',lvl:'honors',modes:['indent'],help:'0° is from the left side, 90° from the top of the page.'},
    {id:'sheets',label:'Sheet under the note',type:'seg',def:1,lvl:'honors',modes:['indent'],options:[{v:1,l:'1st'},{v:2,l:'2nd'},{v:3,l:'3rd'},{v:4,l:'4th'}],help:'Each sheet deeper holds a shallower impression.'},
    {id:'esda',label:'Use ESDA (electrostatic detection)',type:'toggle',def:false,lvl:'honors',modes:['indent'],help:'A charged film and toner find indentations without any light angle.'},
    {id:'slip',label:'Permission slip',type:'seg',def:1,lvl:'honors',modes:['forgery'],noTrial:true,options:[{v:1,l:'Slip 1'},{v:2,l:'Slip 2'},{v:3,l:'Slip 3'}]},
    {id:'fcall',label:'Your call for this slip',type:'seg',def:'unsure',lvl:'honors',modes:['forgery'],noTrial:true,options:[{v:'unsure',l:'Not sure'},{v:'genuine',l:'Genuine'},{v:'forged',l:'Forged'}]},
    {id:'overlay',label:'Lay it over known signature 1',type:'toggle',def:false,lvl:'honors',modes:['forgery'],noTrial:true},
    {id:'sslant',label:'Slant',type:'range',min:-20,max:40,step:1,def:10,unit:'°',lvl:'bio',modes:['sandbox']},
    {id:'ssize',label:'Letter size (x-height)',type:'range',min:12,max:30,step:1,def:20,unit:' px',lvl:'bio',modes:['sandbox']},
    {id:'sspace',label:'Space between words',type:'range',min:0.4,max:2.5,step:0.05,def:1,unit:' × x-height',lvl:'bio',modes:['sandbox']},
    {id:'sconnect',label:'Join the letters',type:'toggle',def:true,lvl:'bio',modes:['sandbox']},
    {id:'sbase',label:'Baseline',type:'seg',def:'straight',lvl:'honors',modes:['sandbox'],options:[{v:'straight',l:'Straight'},{v:'rise',l:'Rising'},{v:'fall',l:'Falling'},{v:'wavy',l:'Wavy'}]},
    {id:'spress',label:'Pen pressure (line width)',type:'range',min:0.8,max:3.6,step:0.1,def:2,unit:' px',lvl:'honors',modes:['sandbox']},
    {id:'saform',label:'Form of the a',type:'seg',def:'one',lvl:'honors',modes:['sandbox'],options:[{v:'one',l:'One-story'},{v:'two',l:'Two-story'}]},
    {id:'stcross',label:'t crossing',type:'seg',def:'mid',lvl:'honors',modes:['sandbox'],options:[{v:'mid',l:'Middle'},{v:'high',l:'High'},{v:'low',l:'Low'},{v:'slant',l:'Slanted'}]},
    {id:'sidot',label:'i dot',type:'seg',def:'dot',lvl:'honors',modes:['sandbox'],options:[{v:'dot',l:'Dot'},{v:'circle',l:'Circle'},{v:'dash',l:'Dash'}]},
    {id:'sspeed',label:'Writing speed',type:'seg',def:'natural',lvl:'ap',modes:['sandbox'],options:[{v:'natural',l:'Natural'},{v:'slow',l:'Slow, careful copy'}]}
  ],
  actions:[
    {id:'nextsus',label:'Next suspect',lvl:'bio',modes:['case'],run(sim){BioLab.setValues(sim,{suspect:(sim.p.suspect+1)%3});}},
    {id:'nextfeat',label:'Next feature',lvl:'bio',modes:['case'],run(sim){const fs=visFeat(),i=fs.findIndex(f=>f.id===sim.p.feature);BioLab.setValues(sim,{feature:fs[(i+1)%fs.length].id});}},
    {id:'sweep',label:'Sweep the light low',lvl:'bio',modes:['indent'],run(sim){BioLab.setValues(sim,{elev:8,esda:false});}}
  ],
  init(sim){return {};},
  metrics:[
    {id:'mk',label:'Features you marked',unit:'',lvl:'bio',text:true,modes:['case'],noTrial:true,get:s=>{const M=marks(s)[s.p.suspect]||{},fs=visFeat();const n=fs.filter(f=>M[f.id]).length,sm=fs.filter(f=>M[f.id]==='same').length;return n+' of '+fs.length+': '+sm+' similar, '+(n-sm)+' different';}},
    {id:'fv',label:'Highlighted feature',unit:'',lvl:'ap',text:true,modes:['case'],noTrial:true,get:s=>{const f=s.p.feature;if(f==='none')return 'none';const q=noteS(),e=exS(s.p.suspect);return 'note '+featVal(f,QW,q.m)+' · '+LET[s.p.suspect]+' '+featVal(f,WR[LET[s.p.suspect]],e.m);}},
    {id:'vis',label:'Indented strokes you can read',unit:'%',lvl:'bio',min:0,max:100,d:0,modes:['indent'],get:s=>100*visibleFrac(s.p)},
    {id:'depth',label:'Indentation depth',unit:'µm',lvl:'honors',min:0,max:12,d:1,modes:['indent'],get:s=>depth(s.p)},
    {id:'shadow',label:'Shadow width d / tan θ',unit:'µm',lvl:'ap',min:0,max:null,d:0,modes:['indent'],get:s=>s.p.esda?0:depth(s.p)/Math.tan(Math.max(1,s.p.elev)*D2R)},
    {id:'lifts',label:'Pen lifts in the name',unit:'',lvl:'honors',min:0,max:null,d:0,modes:['forgery'],noTrial:true,get:s=>slipS(s.p.slip).lifts},
    {id:'trem',label:'Tremor (line wobble)',unit:'mm',lvl:'ap',min:0,max:null,d:2,modes:['forgery'],noTrial:true,get:s=>slipTremor(s.p.slip)*0.2},
    {id:'ovl',label:'Overlap with known signature 1',unit:'%',lvl:'honors',min:0,max:100,d:0,modes:['forgery'],noTrial:true,get:s=>slipOverlap(s.p.slip)},
    {id:'mslant',label:'Measured slant',unit:'°',lvl:'bio',min:-30,max:45,d:0,modes:['sandbox'],get:s=>sandS(s).m.slant},
    {id:'msize',label:'Measured x-height',unit:'mm',lvl:'bio',min:0,max:7,d:1,modes:['sandbox'],get:s=>sandS(s).m.xh*0.2},
    {id:'mspace',label:'Word spacing',unit:'× x-height',lvl:'honors',min:0,max:3,d:2,modes:['sandbox'],get:s=>sandS(s).m.space},
    {id:'mbase',label:'Baseline angle',unit:'°',lvl:'honors',min:-6,max:6,d:1,modes:['sandbox'],get:s=>sandS(s).m.bAng},
    {id:'mratio',label:'Tall-letter ratio',unit:'',lvl:'ap',min:0,max:3,d:2,modes:['sandbox'],get:s=>sandS(s).m.ratio}
  ],
  graphs:[{id:'tally',label:'Your similar marks by suspect',lvl:'bio',custom:true},{id:'light',label:'Readable strokes vs light angle',lvl:'bio',custom:true},{id:'overlap',label:'Overlap with known signature 1',lvl:'honors',custom:true}],
  defaultGraph:'tally',
  plot(sim,ctx,box,id){
    if(id==='light'){const p=Object.assign({},sim.p);const ax=axes(ctx,box,{xmin:0,xmax:90,ymin:0,ymax:100,xl:'light angle above the page (°)',yl:'readable strokes (%)'});
      ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2.5;ctx.beginPath();for(let e=2;e<=90;e+=2){p.elev=e;const v=100*visibleFrac(p);e===2?ctx.moveTo(ax.X(e),ax.Y(v)):ctx.lineTo(ax.X(e),ax.Y(v));}ctx.stroke();
      ctx.fillStyle=PAL['s1'];ctx.beginPath();ctx.arc(ax.X(sim.p.elev),ax.Y(100*visibleFrac(sim.p)),5,0,TAU);ctx.fill();return;}
    if(id==='overlap'){const vals=[1,2,3].map(slipOverlap);const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:100,xcats:['Slip 1','Slip 2','Slip 3'],yl:'overlap with known 1 (%)'});bars(ctx,ax,vals,{colors:[1,2,3].map(n=>n===sim.p.slip?PAL['s1']:PAL['g-axis']),d:0});return;}
    const vals=[0,1,2].map(i=>{const M=marks(sim)[i]||{};return visFeat().filter(f=>M[f.id]==='same').length;});
    const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:visFeat().length,xcats:LET.map(l=>'Suspect '+l),yl:'features you marked similar',yd:0});bars(ctx,ax,vals,{colors:[0,1,2].map(i=>i===sim.p.suspect?PAL['s3']:PAL['g-axis']),d:0});},
  infoPanel(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const i=p.suspect,M=marks(sim)[i]||{},q=noteS(),e=exS(i),fs=visFeat();
      const rows=fs.map(f=>{const mk=M[f.id],ok=mk?((mk==='same')===featSame(f.id,QW,q.m,WR[LET[i]],e.m)):null;
        const bs='font-size:14px;padding:3px 8px';return `<tr${f.id===p.feature?' style="font-weight:700"':''}><td style="text-align:left">${f.l}${ok===null?'':ok?' <span style="color:var(--good)">✓</span>':' <span style="color:var(--bad)">(look again)</span>'}${ap?`<br><span class="help">note: ${featVal(f.id,QW,q.m)}<br>${LET[i]}: ${featVal(f.id,WR[LET[i]],e.m)}</span>`:''}</td><td style="white-space:nowrap"><button type="button" style="${bs}" class="btn${mk==='same'?' primary':''}" data-f="${f.id}" data-v="same">Similar</button> <button type="button" style="${bs}" class="btn${mk==='diff'?' primary':''}" data-f="${f.id}" data-v="diff">Different</button></td></tr>`;}).join('');
      const n=fs.filter(f=>M[f.id]).length,sm=fs.filter(f=>M[f.id]==='same').length;
      return `<h3>Comparison worksheet: note vs Suspect ${LET[i]}</h3><p class="help">The suspects copied the note’s words when asked (requested exemplars), so the same letters can be compared. Pick a feature to highlight it on both samples, then mark it.</p><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Feature</th><th>Your mark</th></tr></thead><tbody>${rows}</tbody></table></div><p>${n?`Tally for Suspect ${LET[i]}: <b>${sm} similar, ${n-sm} different</b>.`:'No marks yet.'} ${hon?'Shared features like slant are class characteristics; rare habits (a slanted t-bar, circle i-dots) carry more weight. One clear, repeated difference that natural variation cannot explain points to a different writer.':'Look for features that are unusual, not just common ones.'}</p><p class="help">The ink itself can be compared too: see <a href="#chromatography">Ink chromatography</a>.</p>`;}
    if(p.mode==='forgery'){const fc=fcalls(sim);const rows=[1,2,3].map(n=>{const v=fc[n]||'unsure';const ok=v==='unsure'?'':((v==='genuine')===(SLIP[n]==='natural')?'✓':'check again');return `<tr${n===p.slip?' style="font-weight:700"':''}><td>Slip ${n}</td><td>${slipS(n).lifts}</td><td>${Math.round(slipOverlap(n))}%</td><td>${v==='unsure'?'not called':v}</td><td>${ok}</td></tr>`;}).join('');
      return `<h3>Permission slips (fictional)</h3><p>Three field-trip slips came back signed “m avery.” The school has three known signatures of the parent, Morgan Avery (fictional), from earlier forms. Which slips did the parent really sign?</p><div class="tbl-wrap"><table><thead><tr><th>Slip</th><th>Pen lifts</th><th>Overlap with known 1</th><th>Your call</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">Signs of forgery: shaky lines (tremor), blunt starts and stops, pen lifts in odd places, and slow, even pressure. A signature that matches a known one exactly is suspicious too: nobody signs the same way twice.</p>`;}
    if(p.mode==='indent')return `<h3>The notepad from the locker</h3><p>A notepad was found in a locker (fictional). Its top sheet was torn off, but the pen pressed into the sheets below. Lower the flashlight to read what was written.</p><p class="help">${hon?'Oblique light: a low beam casts shadows in the grooves, and strokes running across the beam show best. ESDA: an electrostatic charge collects differently in indented areas, and toner makes them dark. ESDA does not damage the page and can read several sheets down.':'Strokes show up as tiny shadows when the light skims the page.'}</p>`;
    return `<h3>Write your own</h3><label class="help" for="hw-text">Type a sentence (letters and . , ! ? only)</label><input id="hw-text" type="text" maxlength="90" value="${(sim._text||'the quick brown fox jumps over the lazy dog').replace(/"/g,'&quot;')}" style="width:100%;font-size:16px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card2);color:var(--fg)"><p class="help">Change one habit at a time and watch the measured values. Examiners say a writer’s habits are hard to change for long: disguised writing tends to slip back to the natural hand.</p>`;},
  bindInfo(sim,el){el.querySelectorAll('button[data-f]').forEach(b=>b.addEventListener('click',()=>{const M=marks(sim),i=sim.p.suspect;M[i]=M[i]||{};M[i][b.dataset.f]=b.dataset.v;BioLab.setValues(sim,{feature:b.dataset.f});BioLab.refresh(sim);}));
    const inp=el.querySelector('#hw-text');if(inp)inp.addEventListener('input',()=>{sim._text=inp.value;});},
  narrate(sim){const p=sim.p,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='case'){const i=p.suspect,L=LET[i],q=noteS(),e=exS(i),f=FEAT.find(x=>x.id===p.feature);
      if(!f)return 'The questioned note is on top; Suspect '+L+'’s exemplar is below. <b>Choose a feature to highlight it on both samples.</b>';
      const same=featSame(f.id,QW,q.m,WR[L],e.m);
      return f.how+' <b>'+(same?'Here the note and Suspect '+L+' agree':'Here the note and Suspect '+L+' differ')+(ap?': note '+featVal(f.id,QW,q.m)+', Suspect '+L+' '+featVal(f.id,WR[L],e.m)+'.':'.')+'</b>';}
    if(p.mode==='indent'){const v=visibleFrac(p);if(p.esda)return 'ESDA charges a thin film laid over the page. Toner sticks where the paper was pressed, so <b>the writing shows up dark no matter where the light is</b>'+(v<0.5?', though this sheet is so deep that only parts show.':'.');
      if(p.elev>60)return 'With the light shining from above, the grooves cast no shadows. <b>The page looks blank.</b> Lower the light.';
      return 'At '+p.elev+'° the light skims the page and each groove casts a shadow. <b>'+Math.round(100*v)+'% of the strokes are readable.</b>'+(hon&&v>0.2&&v<0.95?' Strokes running parallel to the beam cast no shadow, so they stay hidden.':'');}
    if(p.mode==='forgery'){const S=slipS(p.slip),how=SLIP[p.slip],o=slipOverlap(p.slip);
      if(p.overlay)return 'Laid over known signature 1, Slip '+p.slip+' overlaps '+Math.round(o)+'% of its ink. <b>'+(o>80?'That is too perfect: genuine signatures always vary. It was probably traced.':'Close in shape but not identical, as two separate signings should be. Check the line quality to decide.')+'</b>';
      return how==='natural'?'Slip '+p.slip+'’s lines are smooth, with tapered starts and ends and heavier downstrokes. <b>These are signs of fast, fluent writing.</b>':'Slip '+p.slip+'’s lines wobble, start and stop bluntly, and the pen lifted '+S.lifts+' times. <b>These are signs of slow, careful drawing rather than writing.</b>';}
    const m=sandS(sim).m;return 'Your writer leans '+(Math.abs(m.slant)<5?'upright':m.slant>0?'right':'left')+' ('+m.slant.toFixed(0)+'°) with small letters about '+(m.xh*0.2).toFixed(1)+' mm tall. <b>Each habit you set is one feature an examiner would compare.</b>';},
  tour:[
    {title:'The questioned note',text:'This note was left where the trophy used to be. A document examiner never guesses from one look: they compare the note with known writing, one feature at a time.',focus:[16,40,768,170],pause:true,setup(sim){BioLab.setValues(sim,{mode:'case',suspect:0,feature:'none'});syncMode(sim);}},
    {title:'Known writing (exemplars)',text:'Each suspect copied the note’s words when asked. These requested exemplars let the examiner compare the same letters. Here is Suspect A: printed, upright and heavy.',focus:[16,220,768,170],pause:true,setup(sim){BioLab.setValues(sim,{suspect:0});}},
    {title:'Slant',text:'Lines drawn along the tall letters show the slant. The note leans right; Suspect A writes upright. That is one difference.',focus:[16,40,768,350],pause:true,setup(sim){BioLab.setValues(sim,{feature:'slant'});}},
    {title:'A shared feature is not enough',text:'Suspect B’s writing also leans right and joins its letters, like the note. But many people write that way. These are class characteristics.',focus:[16,40,768,350],pause:true,setup(sim){BioLab.setValues(sim,{suspect:1,feature:'connect'});}},
    {title:'Letter forms',text:'Now look at the a. The note uses a two-story a (with a hood) inside joined writing, which is unusual. Suspect B writes a round one-story a.',focus:[16,40,768,350],pause:true,setup(sim){BioLab.setValues(sim,{feature:'aForm'});}},
    {title:'All features together',text:'Suspect C’s exemplar agrees with the note on slant, size, spacing, joins, the a and the circle i-dots. The examiner weighs all the features together.',focus:[16,40,768,350],pause:true,setup(sim){BioLab.setValues(sim,{suspect:2,feature:'iDot'});}},
    {title:'Indented writing',text:'The pen pressed grooves into the sheet below the note. With the light low and to the side, the grooves cast shadows, and the message appears.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'indent',elev:8,azim:30,sheets:1,esda:false});syncMode(sim);}},
    {lvl:'honors',title:'Line quality',text:'Slip 3 was traced. The shape is almost perfect, but the line is shaky, the starts and stops are blunt, and it lies exactly on top of a known signature.',focus:[16,36,768,404],pause:true,setup(sim){BioLab.setValues(sim,{mode:'forgery',slip:3,overlay:true});syncMode(sim);}}
  ],
  onTourExit(sim){const b={};sim.def.controls.forEach(c=>b[c.id]=c.def);BioLab.setValues(sim,b);syncMode(sim);},
  onChallenge(sim,ch,phase){if(ch&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);syncMode(sim);BioLab.refresh(sim);}},
  challenges(sim){const q=noteS(),eB=exS(1),best=[0,1,2].map(i=>[i,sameCount(i)]).sort((a,b)=>b[1]-a[1])[0][0];
    const ds=Math.abs(q.m.slant-eB.m.slant),sh=6/Math.tan(10*D2R);return [
    {lvl:'bio',instant:true,set:{mode:'case',suspect:1,feature:'slant'},q:'Suspect B’s writing leans to the right, just like the note. Does that show Suspect B wrote it?',choices:['Yes, the slant matches','No: lots of people slant right; other features must agree too','Only if B used the same pen'],correct:1,
     explain:'Slant is a class characteristic shared by many writers. Switch to Form of the a or t crossings and you will see B differs from the note in several features.'},
    {lvl:'bio',instant:true,set:{mode:'indent',elev:6,esda:false},q:'You want to read the grooves a pen left on the sheet under a note. Where should you hold the flashlight?',choices:['Straight above the page','Low, almost flat across the page','Behind the page, shining through it'],correct:1,
     explain:'A low, skimming light makes every groove cast a shadow. The model is now at 6°: '+Math.round(100*visibleFrac(Object.assign({},sim.p,{elev:6,azim:30,sheets:1,esda:false})))+'% of the strokes are readable, compared with '+Math.round(100*visibleFrac(Object.assign({},sim.p,{elev:90,azim:30,sheets:1,esda:false})))+'% with the light straight above.'},
    {lvl:'bio',instant:true,set:{mode:'case',suspect:best,feature:'none'},q:'Which suspect’s exemplar agrees with the note in every feature you can compare?',choices:['Suspect A','Suspect B','Suspect C'],correct:best,
     explain:'Suspect '+LET[best]+' agrees on all '+sameCount(best)+' features: slant, size, spacing, joins, the two-story a and circle i-dots. Suspect A agrees on '+sameCount(0)+' and Suspect B on '+sameCount(1)+'. Agreement still means “probably wrote it,” not certainty.'},
    {lvl:'honors',instant:true,set:{mode:'forgery',slip:3,overlay:false},q:'A forger traces a real signature. The shape is almost perfect. What usually gives a traced signature away?',choices:['Nothing: tracing is undetectable','Shaky lines, blunt starts and stops, and pen lifts','It is always much bigger than the real one'],correct:1,
     explain:'Tracing is slow drawing. Look at the zoom circle on Slip 3: the line wobbles, every stroke starts and ends with a blunt blob, and the pen lifted '+slipS(3).lifts+' times. Genuine signatures are written fast, with tapered ends.'},
    {lvl:'honors',instant:true,set:{mode:'forgery',slip:2,overlay:true},q:'You lay two genuine signatures by the same person on top of each other. What do you expect?',choices:['They match exactly, line for line','They are very close but never identical','They look like two different people'],correct:1,
     explain:'Slip 2 is genuine and overlaps known signature 1 by about '+Math.round(slipOverlap(2))+'%. Slip 3 overlaps by '+Math.round(slipOverlap(3))+'%: too perfect. Natural variation is a sign of genuine writing.'},
    {lvl:'honors',instant:true,set:{mode:'indent',elev:20,sheets:3,esda:true},q:'The 3rd sheet under the note has very shallow grooves. Oblique light barely shows them. What will ESDA do?',choices:['Show nothing either','Reveal many strokes, because it does not depend on shadows','Erase the grooves'],correct:1,
     explain:'At the 3rd sheet the grooves are only about '+depth({sheets:3}).toFixed(0)+' µm deep. ESDA reads the electrostatic difference of pressed paper, so it reveals '+Math.round(100*visibleFrac({elev:20,azim:30,sheets:3,esda:true}))+'% of the strokes, against '+Math.round(100*visibleFrac({elev:20,azim:30,sheets:3,esda:false}))+'% with light at 20°.'},
    {lvl:'honors',instant:true,set:{mode:'indent',elev:6,azim:0,sheets:1,esda:false},q:'The flashlight comes straight from the left side of the page (0°). Which strokes stay hardest to see?',choices:['Strokes that run up and down','Strokes that run left to right, along the beam','All strokes show equally'],correct:1,
     explain:'A groove casts a shadow only if light crosses it. Left-to-right strokes, like t-bars, run along the beam and stay hidden. Examiners turn the light to several directions.'},
    {lvl:'ap',instant:true,set:{mode:'indent',elev:10,sheets:2,esda:false},q:'A groove 6 µm deep is lit 10° above the page. About how wide is its shadow (d / tan θ)?',choices:['About 1 µm','About 6 µm','About 34 µm'],correct:2,
     explain:'Shadow width = d / tan θ = 6 µm / tan 10° = 6 / 0.176 ≈ '+sh.toFixed(0)+' µm. At 60° it would be only 3.5 µm. The model reads the 2nd sheet (6 µm) at 10° now.'},
    {lvl:'ap',instant:true,set:{mode:'case',suspect:1,feature:'slant'},q:'The note’s measured slant is '+q.m.slant.toFixed(0)+'° and Suspect B’s is '+eB.m.slant.toFixed(0)+'°. One writer’s slant varies by about ±5° from day to day. Is that difference evidence against B?',choices:['Yes, any difference excludes B','No: a '+ds.toFixed(0)+'° difference is within natural variation','Yes: B must have disguised the slant'],correct:1,
     explain:'A difference of '+ds.toFixed(0)+'° falls inside one writer’s normal range, so slant neither includes nor excludes B. Examiners compare differences with the writer’s own range of variation.'},
    {lvl:'ap',instant:true,q:'In a 2022 study, 86 professional document examiners compared thousands of samples. How often did they wrongly say two different writers’ samples came from the same person?',choices:['Never','About 3% of the time (higher for twins)','About 40% of the time'],correct:1,
     explain:'Hicklin and colleagues (PNAS, 2022) found a false-positive rate of about 3.1% (8.7% for twins’ writing) and a false-negative rate of about 1.1%. Trained examiners do far better than laypeople, but they do make errors.'},
    {lvl:'ap',instant:true,q:'Why do courts treat handwriting comparison as opinion evidence?',choices:['Because examiners are not allowed to measure anything','Because the conclusion rests on the examiner’s trained judgment, not on known frequencies of each feature','Because handwriting never changes'],correct:1,
     explain:'Unlike DNA, there is no population database saying how rare a slanted t-bar is. Examiners weigh features using training and experience. Some courts have limited such testimony to “skilled” rather than scientific opinion.'}
  ];},
  lab:{bio:'<p><b>Question:</b> Which suspect wrote the trophy note?</p><ol><li>For each suspect, step through every feature with Next feature.</li><li>Mark each feature Similar or Different in the worksheet.</li><li>Use the graph to compare your tallies.</li><li>Open Indented writing and find the light angle where you can first read the whole note.</li></ol><p>Which suspect is most likely the writer? Name the two features that convinced you most, and say why they count more than slant.</p>',
       honors:'<p><b>Question:</b> How do examiners tell genuine writing from forgery and read hidden writing?</p><ol><li>In Forged signature?, examine each slip: zoom circle, pen lifts and the overlay. Call each one.</li><li>In Indented writing, record readable strokes at 10°, 30°, 60° and 90°, for the 1st and 3rd sheets, with and without ESDA.</li><li>Try three light directions and note which strokes disappear.</li></ol><p>Explain why a perfect overlap is a warning sign, and why ESDA works where light fails.</p>',
       ap:'<p><b>Question:</b> How large must a difference be before it counts?</p><ol><li>In Write your own, set one writer and record the measured slant, x-height and spacing.</li><li>Repeat with the slant changed by 2°, 5° and 10°. Which changes would you notice by eye?</li><li>Compare with the note and exemplars in Compare the note (Deep dive shows the measured values).</li></ol><p><b>Claim–evidence–reasoning:</b> Using the 2022 error rates, explain how much weight a jury should give an examiner’s opinion, and what makes handwriting evidence stronger or weaker.</p>'},
  terms:[{t:'Questioned document',d:'Any document whose source or authenticity is in doubt, like an anonymous note.'},{t:'Exemplar',d:'Known writing from a suspect, used for comparison.'},{t:'Slant',d:'The angle at which letters lean.'},{t:'Baseline',d:'The imaginary line the letters sit on.'},{t:'Indented writing',d:'Grooves left on the sheet below the one written on.'},
    {lvl:'honors',t:'Requested vs collected exemplar',d:'Writing made on request (often dictated) vs writing made in everyday life, like old letters or forms.'},{lvl:'honors',t:'Class vs individual characteristics',d:'Features many writers share (slant, a copybook style) vs habits rare enough to point to one writer.'},{lvl:'honors',t:'Line quality',d:'How smoothly the line was made. Fast writing has tapered ends; slow forgery shows tremor and blunt ends.'},{lvl:'honors',t:'Natural variation',d:'The small differences between two samples of one person’s writing.'},{lvl:'honors',t:'Oblique lighting',d:'Light held at a low angle so surface grooves cast shadows.'},{lvl:'honors',t:'ESDA',d:'Electrostatic detection apparatus: reveals indentations with a charged film and toner, without harming the page.'},
    {lvl:'ap',t:'Opinion evidence',d:'Testimony based on an expert’s judgment rather than on a measured statistical model.'},{lvl:'ap',t:'False positive rate',d:'How often examiners call two samples the same writer when they are not.'}],
  about:'<p><b>The writing.</b> Every sample is drawn by code from a single-stroke lowercase alphabet, never from real people’s writing. Each fictional writer has habits: slant, size, word spacing, baseline, pen pressure, joined or printed letters, the form of a and e, the t-bar and the i-dot. Each sample adds natural variation (letter size ±5%, slant ±2°, baseline wobble). Slow copying adds tremor, pen lifts and blunt starts and ends; tracing follows a known signature’s path exactly.</p><p><b>Measurements.</b> Slant is the length-weighted angle of downstrokes in tall letters; x-height is the mean height of the small letters; word spacing is the mean gap divided by x-height; the baseline is a least-squares line through the letter bottoms; overlap is the share of a signature’s ink lying within 0.3 mm of known signature 1. The “agrees” tolerances (7° slant, 12% size, 0.3 x-heights spacing, 25% pressure) are teaching choices, not published standards.</p><p><b>Indented writing.</b> Groove depth is 12 µm on the first sheet below a firm ballpoint, halving with each sheet. A stroke is readable when its shadow, (d / tan θ) × |sin(stroke angle − light direction)|, is wide enough; ESDA contrast depends on depth only. These are simplified models of real behavior.</p><p><b>Limits.</b> Real examination uses many more features and many exemplars. Error rates come from Hicklin et al., PNAS 2022 (86 examiners: about 3.1% false positives, 1.1% false negatives). All people, schools and documents are fictional.</p>',
  draw(sim,ctx,vdt,k,t){const p=sim.p;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);syncLight(sim);
    if(p.mode==='indent')drawIndent(sim,ctx,k);else if(p.mode==='forgery')drawForgery(sim,ctx,k);else if(p.mode==='sandbox')drawSandbox(sim,ctx,k);else drawCase(sim,ctx,k);},
  thumbSetup(sim){sim.p.feature='slant';},thumbFrames:4
};
function syncLight(sim){const key=BioLab.level+sim.p.mode;if(sim._sk!==key){sim._sk=key;syncMode(sim);}}

function drawCase(sim,ctx,k){const p=sim.p,i=p.suspect,q=noteS(),e=exS(i),phn=k>1.35;
  paper(ctx,16,34,768,172,[NB.y,NB.y+NB.lh]);paper(ctx,16,216,768,172,[EB.y,EB.y+EB.lh]);
  txt(ctx,'Questioned note',30,58,{s:13*k,w:700,c:'#5a5a62'});txt(ctx,'Exemplar: Suspect '+LET[i],30,240,{s:13*k,w:700,c:'#5a5a62'});
  blit(ctx,inkImage('note',q,16,34,768,172));blit(ctx,inkImage('ex'+i,e,16,216,768,172));
  if(p.feature!=='none'&&p.feature!=='press'){highlight(ctx,q,p.feature,k);highlight(ctx,e,p.feature,k);}
  if(p.feature==='press'){const zq=q.letters.find(L=>L.ch==='l'),ze=e.letters.find(L=>L.ch==='l');const R=phn?40:46;
    if(zq)zoomInset(ctx,q,zq.x+zq.em*0.2,zq.by-zq.em*0.6,4,720,118,R,k);if(ze)zoomInset(ctx,e,ze.x+ze.em*0.2,ze.by-ze.em*0.6,4,720,300,R,k);}
  const f=FEAT.find(x=>x.id===p.feature);
  if(f){const same=featSame(f.id,QW,q.m,WR[LET[i]],e.m),M=(marks(sim)[i]||{})[f.id];
    txt(ctx,f.l+(M?': you marked '+(M==='same'?'similar':'different'):''),16,412,{s:14*k,w:700});
    if(!phn)txt(ctx,'Mark it in the worksheet below',784,412,{s:12.5*k,a:'right',c:PAL['cv-soft']});
    if(atLeast('ap'))txt(ctx,'Note: '+featVal(f.id,QW,q.m)+'   ·   Suspect '+LET[i]+': '+featVal(f.id,WR[LET[i]],e.m),16,436,{s:12.5*k,c:PAL['cv-soft']});}
  else txt(ctx,'Choose a feature to highlight it on both samples',16,420,{s:13*k,c:PAL['cv-soft']});}

function drawIndent(sim,ctx,k){const p=sim.p,S=indentS(),phn=k>1.35,PX0=16,PY0=36,PW0=phn?520:530,PH0=404;
  // the blank sheet, lit from the light direction
  ctx.fillStyle=PAPER;rr(ctx,PX0,PY0,PW0,PH0,6);ctx.fill();
  const shade=clamp(1-Math.cos(p.elev*D2R)*0.55,0.3,1);if(!p.esda){ctx.fillStyle='rgba(30,30,40,'+(0.35*(1-shade)).toFixed(3)+')';rr(ctx,PX0,PY0,PW0,PH0,6);ctx.fill();}
  else{ctx.fillStyle='rgba(120,130,150,.10)';rr(ctx,PX0,PY0,PW0,PH0,6);ctx.fill();}
  ctx.strokeStyle=RULE;ctx.lineWidth=1;[IB.y,IB.y+IB.lh,IB.y+2*IB.lh,IB.y+3*IB.lh].forEach(y=>{ctx.beginPath();ctx.moveTo(PX0+10,y);ctx.lineTo(PX0+PW0-10,y);ctx.stroke();});
  ctx.strokeStyle='#e7a3a3';ctx.beginPath();ctx.moveTo(PX0+24,PY0+6);ctx.lineTo(PX0+24,PY0+PH0-6);ctx.stroke();
  const az=p.azim*D2R,ox=Math.cos(az),oy=Math.sin(az);ctx.lineCap='round';
  S.ink.forEach(kk=>{const q=kk.pts;for(let i=1;i<q.length;i++){const a=Math.atan2(q[i][1]-q[i-1][1],q[i][0]-q[i-1][0]),c=strokeContrast(p,a,(kk.w[i]+kk.w[i-1])/2/IW.press);if(c<0.02)continue;
    if(p.esda){ctx.strokeStyle='rgba(25,25,35,'+(0.9*c).toFixed(3)+')';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(q[i-1][0],q[i-1][1]);ctx.lineTo(q[i][0],q[i][1]);ctx.stroke();continue;}
    const sh=clamp(c*2.2,0.6,2.2);ctx.strokeStyle='rgba(40,36,30,'+(0.85*c).toFixed(3)+')';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(q[i-1][0]+ox*sh,q[i-1][1]+oy*sh);ctx.lineTo(q[i][0]+ox*sh,q[i][1]+oy*sh);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,'+(0.9*c).toFixed(3)+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(q[i-1][0]-ox,q[i-1][1]-oy);ctx.lineTo(q[i][0]-ox,q[i][1]-oy);ctx.stroke();}});
  txt(ctx,(p.esda?'ESDA lift of the ':'')+['1st','2nd','3rd','4th'][p.sheets-1]+' sheet below the note',PX0+34,PY0+26,{s:13*k,w:700,c:'#5a5a62'});
  // side view: light angle
  const bx=PX0+PW0+16,bw=784-bx;ctx.fillStyle=PAL['card'];rr(ctx,bx,36,bw,404,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Side view',bx+12,60,{s:13*k,w:700});
  const gx=bx+bw/2+10,gy=phn?150:170,L=phn?90:100;ctx.fillStyle=PAPER;ctx.fillRect(bx+14,gy,bw-28,8);ctx.strokeStyle=PAL['cv-soft'];ctx.strokeRect(bx+14,gy,bw-28,8);
  // a groove
  ctx.fillStyle=PAL['cv-bg'];ctx.beginPath();ctx.moveTo(gx-8,gy);ctx.lineTo(gx,gy+6);ctx.lineTo(gx+8,gy);ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();
  const e=Math.max(2,p.elev)*D2R,lx=gx-Math.cos(e)*L,ly=gy-Math.sin(e)*L;
  if(!p.esda){ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(gx,gy);ctx.stroke();ctx.setLineDash([]);
    ctx.save();ctx.translate(lx,ly);ctx.rotate(-e);ctx.fillStyle=PAL['cv-soft'];rr(ctx,-26,-8,26,16,4);ctx.fill();ctx.fillStyle=PAL['s4'];ctx.fillRect(-2,-7,4,14);ctx.restore();
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(gx,gy,34,Math.PI,Math.PI+e,false);ctx.stroke();
    const shw=clamp(depth(p)/Math.tan(e)*1.2,0,60);ctx.fillStyle='rgba(20,20,30,.45)';ctx.fillRect(gx,gy+1,Math.min(shw,bw/2-20),5);}
  else{ctx.fillStyle=PAL['s2'];ctx.globalAlpha=0.35;ctx.fillRect(bx+14,gy-6,bw-28,6);ctx.globalAlpha=1;txt(ctx,'charged film + toner',gx,gy-14,{s:12*k,a:'center',c:PAL['cv-soft']});}
  const v=visibleFrac(p),lines=[{t:p.esda?'Toner collects in the pressed paper':(phn?'Light at ':'Flashlight ')+p.elev+'° above the page',s:13,w:700},{t:'Readable strokes: '+Math.round(100*v)+'%',s:13}];
  if(atLeast('honors')&&!phn)lines.push({t:'Groove depth: '+depth(p).toFixed(1)+' µm',s:12.5,c:PAL['cv-soft']});
  if(atLeast('honors')&&!p.esda&&!phn)lines.push({t:'Light from '+(p.azim<20?'the left':p.azim>160?'the right':p.azim>70&&p.azim<110?'the top':'an angle')+' ('+p.azim+'°)',s:12.5,c:PAL['cv-soft']});
  textBlock(ctx,lines,bx+12,gy+22,bw-24,432,k);}

function drawForgery(sim,ctx,k){const p=sim.p,phn=k>1.35;txt(ctx,'Known signatures from school records',16,26,{s:13*k,w:700});
  KB.forEach((b,i)=>{paper(ctx,b.x-24,40,236,78);blit(ctx,inkImage('known'+i,known(i),b.x-24,40,236,78));if(!phn)txt(ctx,'Known '+(i+1),b.x-14,58,{s:12*k,c:'#5a5a62'});});
  const S=slipS(p.slip);paper(ctx,16,136,540,300);txt(ctx,'Slip '+p.slip+': parent signature',30,162,{s:13*k,w:700,c:'#5a5a62'});
  ctx.strokeStyle='#9aa0a8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,QB.y+6);ctx.lineTo(420,QB.y+6);ctx.stroke();
  const sc=1.6;ctx.save();ctx.translate(QB.x,QB.y);ctx.scale(sc,sc);ctx.translate(-QB.x,-QB.y);drawInk(ctx,S,INK);
  if(p.overlay){drawInk(ctx,known(0),'#c11430',0.55,QB.x-KB[0].x,QB.y-KB[0].y);}ctx.restore();
  if(p.overlay)txt(ctx,'red: known signature 1',30,424,{s:12.5*k,c:'#b0122d'});
  // zoom on the line quality: the start of the m
  const st=S.ink[0].pts[0];const zx=st[0]+5,zy=st[1]+9;const R=phn?92:104;
  zoomInset(ctx,S,zx,zy,4.5,672,268,R,k,null);
  const zsx=QB.x+(zx-QB.x)*sc,zsy=QB.y+(zy-QB.y)*sc;ctx.strokeStyle=PAL['rj'];ctx.lineWidth=2;const hb=R/4.5*sc;ctx.strokeRect(zsx-hb,zsy-hb,2*hb,2*hb);
  ctx.strokeStyle=PAL['muted'];ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(zsx+hb,zsy-hb);ctx.lineTo(672-R*0.7,268-R*0.7);ctx.moveTo(zsx+hb,zsy+hb);ctx.lineTo(672-R*0.7,268+R*0.7);ctx.stroke();ctx.setLineDash([]);
  txt(ctx,'Zoom: line quality',672,268-R-12,{s:13*k,w:700,a:'center'});
  const v=fcalls(sim)[p.slip];if(v&&v!=='unsure')pill(ctx,'Your call: '+v,672,268+R+26,v==='genuine'?PAL['s3']:PAL['s1'],'#fff',13*k);}

function drawSandbox(sim,ctx,k){const S=sandS(sim),phn=k>1.35;const rows=[];for(let i=0;i<S.nLines;i++)rows.push(SB.y+i*SB.lh);
  paper(ctx,16,34,768,262,rows);txt(ctx,'Your writer',30,58,{s:13*k,w:700,c:'#5a5a62'});
  ctx.save();ctx.beginPath();ctx.rect(16,34,768,262);ctx.clip();drawInk(ctx,S,INK);highlight(ctx,S,'slant',k);ctx.restore();
  const m=S.m,hon=atLeast('honors'),ap=atLeast('ap');const L=[{t:'Measured from the writing',s:13.5,w:700},{t:'Slant: '+slantWord(m.slant)+' ('+m.slant.toFixed(0)+'°) · x-height '+(m.xh*0.2).toFixed(1)+' mm',s:13}];
  if(hon)L.push({t:'Spacing '+m.space.toFixed(2)+' × x-height · baseline '+baseWord(m)+' ('+m.bAng.toFixed(1)+'°)',s:13});
  if(ap)L.push({t:'Tall letters '+m.ratio.toFixed(2)+' × x-height · line width '+(m.press*0.2).toFixed(2)+' mm',s:13});
  ctx.fillStyle=PAL['card'];rr(ctx,16,308,768,132,10);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();textBlock(ctx,L,30,314,740,436,k);}

HW.onLevel=sim=>{syncMode(sim);sim.infoDirty=true;};
const C0=HW.controls;
C0.find(c=>c.id==='mode').onChange=sim=>{syncMode(sim);sim.infoDirty=true;const v=fcalls(sim)[sim.p.slip]||'unsure';if(sim.p.fcall!==v)BioLab.setValues(sim,{fcall:v});};
C0.find(c=>c.id==='slip').onChange=sim=>{const v=fcalls(sim)[sim.p.slip]||'unsure';if(sim.p.fcall!==v)BioLab.setValues(sim,{fcall:v});sim.infoDirty=true;};
C0.find(c=>c.id==='fcall').onChange=sim=>{fcalls(sim)[sim.p.slip]=sim.p.fcall;sim.infoDirty=true;};
['suspect','feature'].forEach(id=>{C0.find(c=>c.id===id).onChange=sim=>{sim.infoDirty=true;};});
BioLab.register(HW);
})();

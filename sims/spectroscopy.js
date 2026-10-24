(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* ---------- compounds: structure (heavy atoms, H counts), IR bands, EI mass spectrum ----------
   IR band: [wavenumber cm⁻¹, width cm⁻¹, peak absorbance, bond type, assignment]
   MS peak: [m/z, relative abundance %, ion formula, what happened]                                  */
const C={
  ethanol:{name:'Ethanol',f:'C2H6O',
    atoms:[['C',0,0,3],['C',0.87,0.5,2],['O',1.73,0,1]],bonds:[[0,1,1],[1,2,1]],
    ir:[[3340,150,1.0,'O-H','O–H stretch, broad from hydrogen bonding'],[2975,25,0.8,'C-H','C–H stretch'],[2930,18,0.45,'C-H','C–H stretch'],[2885,15,0.35,'C-H','C–H stretch'],[1450,20,0.3,'bend','C–H bend'],[1380,15,0.3,'bend','CH₃ bend'],[1090,18,0.55,'C-O','C–O stretch'],[1050,18,1.0,'C-O','C–O stretch'],[880,15,0.5,'C-C','C–C–O skeletal stretch']],
    ms:[[46,22,'C2H6O','M⁺: the whole molecule minus one electron'],[45,50,'C2H5O','lost H• (1)'],[31,100,'CH3O','CH₂OH⁺: lost •CH₃ (15)'],[29,23,'C2H5','C₂H₅⁺: lost •OH (17)'],[27,18,'C2H3','C₂H₃⁺'],[15,6,'CH3','CH₃⁺']]},
  isopropanol:{name:'Isopropanol',f:'C3H8O',
    atoms:[['C',0,0,3],['C',0.87,0.5,1],['C',1.73,0,3],['O',0.87,1.5,1]],bonds:[[0,1,1],[1,2,1],[1,3,1]],
    ir:[[3350,150,1.0,'O-H','O–H stretch, broad from hydrogen bonding'],[2970,25,0.9,'C-H','C–H stretch'],[2880,15,0.35,'C-H','C–H stretch'],[1465,18,0.3,'bend','C–H bend'],[1380,8,0.35,'bend','CH₃ bend (doublet)'],[1368,8,0.33,'bend','CH₃ bend (doublet)'],[1160,15,0.5,'C-C','C–C skeletal stretch'],[1130,18,0.8,'C-O','C–O stretch'],[950,15,0.6,'C-C','C–C–O skeletal stretch'],[815,12,0.35,'C-C','skeletal stretch']],
    ms:[[60,1,'C3H8O','M⁺: very small, the ion falls apart fast'],[59,4,'C3H7O','lost H• (1)'],[45,100,'C2H5O','CH₃CHOH⁺: lost •CH₃ (15)'],[43,17,'C3H7','C₃H₇⁺: lost •OH (17)'],[41,7,'C3H5','C₃H₅⁺'],[29,10,'C2H5','C₂H₅⁺'],[27,15,'C2H3','C₂H₃⁺'],[19,6,'H3O','H₃O⁺']]},
  acetone:{name:'Acetone',f:'C3H6O',
    atoms:[['C',0,0,3],['C',0.87,0.5,0],['C',1.73,0,3],['O',0.87,1.5,0]],bonds:[[0,1,1],[1,2,1],[1,3,2]],
    ir:[[3005,15,0.25,'C-H','C–H stretch'],[2925,15,0.2,'C-H','C–H stretch'],[1715,18,1.4,'C=O','C=O stretch (ketone)'],[1420,15,0.45,'bend','CH₃ bend'],[1360,12,0.7,'bend','CH₃ bend'],[1220,18,0.8,'C-C','C–C–C stretch'],[1092,12,0.2,'C-C','C–C stretch'],[530,12,0.4,'bend','C–C=O bend']],
    ms:[[58,35,'C3H6O','M⁺: the whole molecule minus one electron'],[43,100,'C2H3O','CH₃CO⁺ (acylium): lost •CH₃ (15)'],[42,8,'C2H2O','lost CH₄ (16)'],[27,6,'C2H3','C₂H₃⁺'],[15,18,'CH3','CH₃⁺']]},
  acetic:{name:'Acetic acid',f:'C2H4O2',
    atoms:[['C',0,0,3],['C',0.87,0.5,0],['O',0.87,1.5,0],['O',1.73,0,1]],bonds:[[0,1,1],[1,2,2],[1,3,1]],
    ir:[[3050,330,0.85,'O-H','O–H stretch of a carboxylic acid: very broad'],[2950,15,0.2,'C-H','C–H stretch'],[1712,20,1.4,'C=O','C=O stretch (carboxylic acid)'],[1410,18,0.5,'bend','O–H and CH₃ bend'],[1290,22,0.9,'C-O','C–O stretch'],[935,30,0.55,'bend','O–H bend, broad'],[620,15,0.4,'bend','O–C=O bend']],
    ms:[[60,75,'C2H4O2','M⁺: the whole molecule minus one electron'],[45,90,'CHO2','COOH⁺: lost •CH₃ (15)'],[43,100,'C2H3O','CH₃CO⁺ (acylium): lost •OH (17)'],[42,13,'C2H2O','lost H₂O (18)'],[29,10,'CHO','CHO⁺'],[15,20,'CH3','CH₃⁺']]},
  ethylacetate:{name:'Ethyl acetate',f:'C4H8O2',
    atoms:[['C',0,0,3],['C',0.87,0.5,0],['O',0.87,1.5,0],['O',1.73,0,0],['C',2.6,0.5,2],['C',3.46,0,3]],bonds:[[0,1,1],[1,2,2],[1,3,1],[3,4,1],[4,5,1]],
    ir:[[2985,18,0.45,'C-H','C–H stretch'],[2940,15,0.25,'C-H','C–H stretch'],[1742,16,1.4,'C=O','C=O stretch (ester)'],[1445,15,0.3,'bend','CH₂ bend'],[1373,12,0.6,'bend','CH₃ bend'],[1240,22,1.3,'C-O','C–O stretch (ester C–O–C)'],[1048,16,0.8,'C-O','O–C₂H₅ stretch'],[938,12,0.3,'C-C','skeletal stretch'],[847,10,0.25,'C-C','skeletal stretch']],
    ms:[[88,8,'C4H8O2','M⁺: the whole molecule minus one electron'],[73,5,'C3H5O2','lost •CH₃ (15)'],[70,12,'C4H6O','lost H₂O (18)'],[61,15,'C2H5O2','CH₃C(OH)₂⁺ (rearrangement)'],[45,15,'C2H5O','C₂H₅O⁺: lost CH₃CO• (43)'],[43,100,'C2H3O','CH₃CO⁺ (acylium): lost •OC₂H₅ (45)'],[29,25,'C2H5','C₂H₅⁺'],[27,12,'C2H3','C₂H₃⁺']]},
  hexane:{name:'Hexane',f:'C6H14',
    atoms:[['C',0,0,3],['C',0.87,0.5,2],['C',1.73,0,2],['C',2.6,0.5,2],['C',3.46,0,2],['C',4.33,0.5,3]],bonds:[[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1]],
    ir:[[2960,14,1.1,'C-H','C–H stretch (CH₃)'],[2930,12,1.2,'C-H','C–H stretch (CH₂)'],[2860,12,0.9,'C-H','C–H stretch'],[1465,15,0.5,'bend','CH₂ bend'],[1380,10,0.35,'bend','CH₃ bend'],[725,10,0.3,'bend','CH₂ rock (four or more CH₂ in a row)']],
    ms:[[86,13,'C6H14','M⁺: the whole molecule minus one electron'],[71,6,'C5H11','lost •CH₃ (15)'],[57,100,'C4H9','C₄H₉⁺: lost •C₂H₅ (29)'],[56,40,'C4H8','lost C₂H₆ (30)'],[43,80,'C3H7','C₃H₇⁺: lost •C₃H₇ (43)'],[41,60,'C3H5','C₃H₅⁺ (allyl)'],[29,40,'C2H5','C₂H₅⁺'],[27,35,'C2H3','C₂H₃⁺']]},
  caffeine:{name:'Caffeine',f:'C8H10N4O2',simple:true,
    atoms:[['N',-0.87,-0.5,0],['C',-0.87,0.5,0],['N',0,1,0],['C',0.87,0.5,0],['C',0.87,-0.5,0],['C',0,-1,0],['N',1.82,-0.81,0],['C',2.4,0,1],['N',1.82,0.81,0],['O',-1.73,1,0],['O',0,-2,0],['C',-1.73,-1,3],['C',0,2,3],['C',2.1,-1.76,3]],
    bonds:[[0,1,1],[1,2,1],[2,3,1],[3,4,2],[4,5,1],[5,0,1],[4,6,1],[6,7,1],[7,8,2],[8,3,1],[1,9,2],[5,10,2],[0,11,1],[2,12,1],[6,13,1]],
    ir:[[3110,15,0.2,'C-H','ring C–H stretch'],[2955,18,0.2,'C-H','C–H stretch (N–CH₃)'],[1700,15,1.2,'C=O','C=O stretch (amide)'],[1658,15,1.3,'C=O','C=O stretch (amide)'],[1600,12,0.5,'C=C','C=C and C=N ring stretch'],[1548,12,0.7,'C=C','C=N ring stretch'],[1455,14,0.45,'bend','CH₃ bend'],[1360,12,0.4,'C-N','C–N stretch'],[1240,12,0.55,'C-N','C–N stretch'],[1025,10,0.3,'C-N','C–N stretch'],[745,10,0.5,'bend','ring bend'],[610,10,0.35,'bend','ring bend']],
    ms:[[194,100,'C8H10N4O2','M⁺ is the base peak: the ring system holds together'],[165,6,'C7H9N4O','lost HCO• (29)'],[109,55,'C5H7N3','ring fragment: lost C₃H₃NO₂ (85)'],[82,30,'C3H4N3','five-membered ring fragment'],[67,25,'C3H3N2','C₃H₃N₂⁺'],[55,25,'C2H3N2','small ring fragment'],[42,15,'C2H4N','CH₂=N–CH₃⁺']]},
  aspirin:{name:'Aspirin',f:'C9H8O4',simple:true,
    atoms:[['C',0.87,-0.5,0],['C',0.87,0.5,0],['C',0,1,1],['C',-0.87,0.5,1],['C',-0.87,-0.5,1],['C',0,-1,1],['C',1.73,-1,0],['O',1.73,-2,0],['O',2.6,-0.5,1],['O',1.73,1,0],['C',1.73,2,0],['O',0.87,2.5,0],['C',2.6,2.5,3]],
    bonds:[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[0,6,1],[6,7,2],[6,8,1],[1,9,1],[9,10,1],[10,11,2],[10,12,1]],
    ir:[[3000,300,0.6,'O-H','O–H stretch (carboxylic acid), broad'],[1755,14,1.2,'C=O','C=O stretch (ester)'],[1690,16,1.3,'C=O','C=O stretch (carboxylic acid)'],[1605,12,0.6,'C=C','aromatic C=C stretch'],[1485,12,0.4,'C=C','aromatic C=C stretch'],[1305,15,0.7,'C-O','C–O stretch (acid)'],[1185,16,1.0,'C-O','C–O stretch (ester)'],[915,12,0.4,'bend','O–H bend'],[755,10,0.6,'bend','aromatic C–H bend']],
    ms:[[180,12,'C9H8O4','M⁺: the whole molecule minus one electron'],[138,60,'C7H6O3','salicylic acid ion: lost CH₂=C=O (42)'],[121,25,'C7H5O2','lost •OH from m/z 138'],[120,100,'C7H4O2','lost CH₃COOH (60)'],[92,45,'C6H4O','lost CO (28) from m/z 120'],[63,15,'C5H3','C₅H₃⁺'],[43,40,'C2H3O','CH₃CO⁺ (acylium)']]},
  acetaminophen:{name:'Acetaminophen',f:'C8H9NO2',simple:true,
    atoms:[['C',0.87,-0.5,1],['C',0.87,0.5,1],['C',0,1,0],['C',-0.87,0.5,1],['C',-0.87,-0.5,1],['C',0,-1,0],['O',0,-2,1],['N',0,2,1],['C',0.87,2.5,0],['O',1.73,2,0],['C',0.87,3.5,3]],
    bonds:[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],[5,6,1],[2,7,1],[7,8,1],[8,9,2],[8,10,1]],
    ir:[[3325,30,0.9,'N-H','N–H stretch (amide), fairly sharp'],[3160,140,0.8,'O-H','O–H stretch (phenol), broad'],[1655,15,1.3,'C=O','C=O stretch (amide)'],[1610,12,0.6,'C=C','aromatic C=C stretch'],[1565,14,0.8,'N-H','N–H bend (amide II)'],[1505,12,0.7,'C=C','aromatic C=C stretch'],[1260,15,0.6,'C-O','C–O stretch (phenol)'],[1225,14,0.6,'C-N','C–N stretch'],[835,10,0.5,'bend','aromatic C–H bend']],
    ms:[[151,55,'C8H9NO2','M⁺: the whole molecule minus one electron'],[109,100,'C6H7NO','4-aminophenol ion: lost CH₂=C=O (42)'],[108,15,'C6H6NO','lost CH₂=C=O and H•'],[81,12,'C5H7N','lost CO (28) from m/z 109'],[80,15,'C5H6N','C₅H₆N⁺'],[53,10,'C4H5','C₄H₅⁺'],[43,25,'C2H3O','CH₃CO⁺ (acylium)']]}
};
const KEYS=Object.keys(C);
/* Hooke's-law constants for stretches: k (N/m) and the two atoms */
const SPRING={'O-H':[745,'O','H'],'N-H':[640,'N','H'],'C-H':[480,'C','H'],'C=O':[1190,'C','O'],'C-O':[490,'C','O'],'C=C':[905,'C','C'],'C-N':[595,'C','N'],'C-C':[355,'C','C']};
const BNAME={'O-H':'O–H','N-H':'N–H','C-H':'C–H','C=O':'C=O','C-O':'C–O','C=C':'C=C (ring)','C-N':'C–N','C-C':'C–C','bend':'bending'};
const AMU=1.66054e-27,C_CM=2.99792458e10;
function hooke(type){const s=SPRING[type];if(!s)return null;const m1=CL.el(s[1]).mass,m2=CL.el(s[2]).mass,mu=m1*m2/(m1+m2);return {k:s[0],mu,nu:Math.sqrt(s[0]/(mu*AMU))/(2*Math.PI*C_CM),a:s[1],b:s[2]};}

/* ---------- spectra ---------- */
const NU0=4000,NU1=500;
function absorb(cmp,nu){let A=0;cmp.ir.forEach(b=>{const z=(nu-b[0])/b[1];A+=0.8*b[2]*Math.exp(-z*z/2);});return A;}
function trans(sim,key,nu){const A=absorb(C[key],nu);let T=96*Math.pow(10,-A);if(sim&&key===sim.st.unk&&sim.p.sample==='unk'){const s=sim.st.round;T+=1.2*Math.sin(nu*0.37+s)+0.8*Math.sin(nu*0.091+2*s);}return clamp(T,0,100);}
function msOf(sim,key,noisy){return C[key].ms.map(p=>{let r=p[1];if(noisy){const s=sim.st.round;r=clamp(r*(1+0.06*Math.sin(p[0]*1.7+s)),0.5,100);}return [p[0],r,p[2],p[3]];});}
function isoPeaks(peaks){return peaks.map(p=>{const c=CL.parse(p[2]);const f=(c.C||0)*0.0107+(c.N||0)*0.00364+(c.H||0)*0.000115+(c.O||0)*0.00038;return [p[0]+1,p[1]*f,p[2],'M+1'];}).filter(p=>p[1]>=0.3);}
const curKey=sim=>sim.p.sample==='unk'?sim.st.unk:sim.p.sample;
function irVec(sim,key){const v=[];for(let n=NU0;n>=NU1;n-=10)v.push(100-trans(sim,key,n));return v;}
function msVec(sim,key,noisy){const v=new Array(201).fill(0);msOf(sim,key,noisy).forEach(p=>{if(p[0]<=200)v[p[0]]=p[1];});return v;}
function cosSim(a,b){let ab=0,aa=0,bb=0;for(let i=0;i<a.length;i++){ab+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?ab/Math.sqrt(aa*bb):0;}
function score(sim,ref){const k=curKey(sim),noisy=sim.p.sample==='unk';return {ir:100*cosSim(irVec(sim,k),irVec(null,ref)),ms:100*cosSim(msVec(sim,k,noisy),msVec(sim,ref,false))};}
function best(sim){let b=null;KEYS.forEach(r=>{const s=score(sim,r),v=(s.ir+s.ms)/2;if(!b||v>b.v)b={r,v,s};});return b;}

/* peaks list for the current view: IR bands (strongest first by position) or MS bars */
function peaks(sim){const cmp=C[curKey(sim)];if(sim.p.view==='ms'){let ps=msOf(sim,curKey(sim),sim.p.sample==='unk');if(sim.p.iso&&atLeast('ap'))ps=ps.concat(isoPeaks(ps));return ps.sort((a,b)=>b[0]-a[0]);}
  return cmp.ir.filter(b=>b[2]>=0.3).slice().sort((a,b)=>b[0]-a[0]);}
function selPeak(sim){const ps=peaks(sim);return ps[((sim.st.pk%ps.length)+ps.length)%ps.length];}
function groups(key){const seen=[];C[key].ir.forEach(b=>{if(b[2]>=0.45&&b[3]!=='bend'&&!seen.includes(b[3]))seen.push(b[3]);});
  const ord=['O-H','N-H','C-H','C=O','C=C','C-O','C-N','C-C'];return ord.filter(t=>seen.includes(t)).map(t=>t==='O-H'?(C[key].ir.find(b=>b[3]==='O-H')[1]>200?'O–H (very broad)':'O–H (broad)'):BNAME[t].replace(' (ring)',''));}
const molIon=(sim,key)=>{const ps=msOf(sim,key,false);return ps.reduce((a,b)=>b[0]>a[0]?b:a)[0];};
const basePk=(sim,key)=>{const ps=msOf(sim,key,false);return ps.reduce((a,b)=>b[1]>a[1]?b:a)[0];};
function pickUnknown(sim){const r=rng(sim.st.round*131+7),pool=KEYS.slice();let k=pool[Math.floor(r()*pool.length)];if(sim.st.round===1)k='isopropanol';if(k===sim.st.unk&&sim.st.round>1)k=pool[(pool.indexOf(k)+1)%pool.length];sim.st.unk=k;}

/* ---------- molecule layout (auto-placed hydrogens) ---------- */
function layout(key){const m=C[key];if(m._lay)return m._lay;const at=m.atoms.map(a=>({s:a[0],x:a[1],y:a[2]})),bd=m.bonds.map(b=>({a:b[0],b:b[1],o:b[2]}));
  m.atoms.forEach((a,i)=>{const nH=a[3];if(!nH)return;const angs=bd.filter(b=>b.a===i||b.b===i).map(b=>{const j=b.a===i?b.b:b.a;return Math.atan2(at[j].y-at[i].y,at[j].x-at[i].x);});let dirs=[];
    if(!angs.length)dirs=[0,2.09,4.19].slice(0,nH);
    else if(angs.length===1){const o=angs[0]+Math.PI;dirs=nH===1?[a[0]==='O'||a[0]==='N'?o-0.6:o]:nH===2?[o-0.95,o+0.95]:[o,o-1.25,o+1.25];}
    else{const s=angs.slice().sort((p,q)=>p-q);let gap=0,mid=0;for(let j=0;j<s.length;j++){const a1=s[j],a2=j<s.length-1?s[j+1]:s[0]+2*Math.PI;if(a2-a1>gap){gap=a2-a1;mid=(a1+a2)/2;}}dirs=nH===1?[mid]:[mid-0.5,mid+0.5];}
    dirs.forEach(d=>{at.push({s:'H',x:at[i].x+Math.cos(d)*0.6,y:at[i].y+Math.sin(d)*0.6});bd.push({a:i,b:at.length-1,o:1});});});
  const xs=at.map(a=>a.x),ys=at.map(a=>a.y);m._lay={at,bd,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};return m._lay;}
function bondType(at,b){const s1=at[b.a].s,s2=at[b.b].s,pair=[s1,s2].sort().join('');
  if(pair==='HO')return 'O-H';if(pair==='HN')return 'N-H';if(pair==='CH')return 'C-H';if(pair==='CO')return b.o===2?'C=O':'C-O';if(pair==='CN')return 'C-N';if(pair==='CC')return b.o===2?'C=C':'C-C';return '';}

function syncView(sim){if(!atLeast('honors')&&sim.p.view==='ms'){sim.p.view='ir';if(sim.ui&&sim.ui.ctl&&sim.ui.ctl.view)sim.ui.ctl.view.set('ir');}
  if(!sim.ui||!sim.ui.sec)return;const d=sim.def,v=sim.p.view;
  d.metrics.forEach(m=>{if(!m.modes)return;const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!atLeast(m.lvl)||!m.modes.includes(v);});
  d.controls.forEach(c=>{if(!c.modes)return;const e=document.getElementById(d.id+'-'+c.id);if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!atLeast(c.lvl)||!c.modes.includes(v);});}
function newScan(sim){if(sim.st){sim.st.scan=0;sim.st.pk=0;sim.infoDirty=true;}}

/* plot geometry */
const PL=58,PR=522,PT=44;let PB=300;
const xNu=nu=>PL+(NU0-nu)/(NU0-NU1)*(PR-PL);
const yT=T=>PB-T/100*(PB-PT);
function msRange(sim){const m=molIon(sim,curKey(sim));return {x0:10,x1:Math.max(70,Math.ceil((m+12)/10)*10)};}

const SPEC={
  id:'spectroscopy',hash:'spectroscopy',apUnit:16,order:6,kind:'Virtual lab',tab:'IR and mass spectra',
  prereq:['spottest','light'],next:['chromatography','beerslaw','imf'],
  card:'Read infrared and mass spectra of nine compounds, watch the bonds vibrate, and confirm the identity of an evidence sample.',
  title:'Spectroscopy: confirm the evidence',
  lede:{bio:'Every bond vibrates at its own frequency and absorbs infrared light at that frequency. An IR spectrum shows which bonds a molecule has, so you can match an unknown to a known compound.',
        honors:'Add mass spectrometry: find the molecular ion and the fragments, and compare the evidence with library spectra.',
        ap:'Predict stretching frequencies from Hooke’s law, use the M+1 isotope peak to count carbons, and explain why the confirmatory match is stronger than a color test.'},
  scale:{bio:'Molecules about 0.5 nm long. Infrared light from 2.5 to 20 µm in wavelength (4000 to 500 cm⁻¹) makes their bonds stretch and bend about 10¹³ times a second.',
         honors:'Infrared wavelengths of 2.5–20 µm (4000–500 cm⁻¹). The mass spectrometer sorts ions by mass-to-charge ratio, from m/z 10 to about 200.'},
  timeless:true,animated:true,graph:false,chReveal:3,controlsTitle:'Instrument',
  controls:[
    {id:'view',label:'Spectrum',type:'seg',def:'ir',lvl:'bio',options:[{v:'ir',l:'Infrared (IR)'},{v:'ms',l:'Mass spectrum',lvl:'honors'}],onChange(sim){syncView(sim);newScan(sim);}},
    {id:'sample',label:'Sample',type:'select',def:'unk',lvl:'bio',options:[{v:'unk',l:'Evidence sample (unknown)'}].concat(KEYS.map(k=>({v:k,l:C[k].name+(C[k].simple?' (simplified)':'')}))),onChange:newScan},
    {id:'ref',label:'Library spectrum to overlay',type:'select',def:'none',lvl:'honors',options:[{v:'none',l:'None'}].concat(KEYS.map(k=>({v:k,l:C[k].name}))),help:'Dashed line (IR) or hollow bars (MS).'},
    {id:'iso',label:'Show isotope (M+1) peaks',type:'toggle',def:false,lvl:'ap',modes:['ms'],help:'¹³C (1.07% of carbon) makes a small peak one unit above each fragment.',onChange(sim){sim.st.pk=0;}}
  ],
  actions:[
    {id:'prev',label:'◂ Previous peak',run(sim){sim.st.pk--;}},
    {id:'next',label:'Next peak ▸',primary:true,run(sim){sim.st.pk++;}},
    {id:'newunk',label:'New evidence sample',run(sim){sim.st.round++;pickUnknown(sim);if(sim.p.sample==='unk')newScan(sim);}}
  ],
  init(sim){const st={round:(sim.st&&sim.st.round)||1,unk:'isopropanol',pk:0,scan:0};sim.st=st;pickUnknown(sim);return st;},
  step(sim,dt){sim.st.scan=Math.min(1,sim.st.scan+dt/1.3);},
  onLevel:syncView,
  metrics:[
    {id:'selpk',label:'Selected peak',unit:'',lvl:'bio',text:true,get:s=>{const p=selPeak(s);if(s.p.view==='ms')return 'm/z '+p[0]+' ('+Math.round(p[1]*10)/10+'%)'+(p[3]==='M+1'?': ¹³C isotope peak':'');return p[0]+' cm⁻¹: '+p[4];}},
    {id:'groups',label:'Strong bands show these bonds',unit:'',lvl:'bio',text:true,modes:['ir'],get:s=>groups(curKey(s)).join(', ')},
    {id:'mion',label:'Molecular ion M⁺',unit:'m/z',lvl:'honors',min:0,max:200,d:0,modes:['ms'],get:s=>molIon(s,curKey(s))},
    {id:'base',label:'Base peak (tallest)',unit:'m/z',lvl:'honors',min:0,max:200,d:0,modes:['ms'],get:s=>basePk(s,curKey(s))},
    {id:'match',label:'Match with the library spectrum',unit:'',lvl:'honors',text:true,get:s=>{if(s.p.ref==='none')return 'Choose a library spectrum';const r=score(s,s.p.ref);return 'IR '+r.ir.toFixed(0)+'% · MS '+r.ms.toFixed(0)+'% ('+C[s.p.ref].name+')';}},
    {id:'best',label:'Best library match (IR + MS)',unit:'',lvl:'ap',text:true,get:s=>{const b=best(s);return C[b.r].name+', '+b.v.toFixed(0)+'%';}},
    {id:'nu',label:'Hooke’s law prediction',unit:'cm⁻¹',lvl:'ap',min:0,max:4000,d:0,modes:['ir'],get:s=>{const h=hooke(selPeak(s)[3]);return h?h.nu:null;}}
  ],
  infoPanel(sim){const ap=atLeast('ap');let h='<div class="p-head"><h3>IR correlation table</h3></div><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Bond</th><th style="text-align:left">Where (cm⁻¹)</th><th style="text-align:left">What it looks like</th>'+(ap?'<th>k (N/m)</th>':'')+'</tr></thead><tbody>';
    [['O–H (alcohol)','3200–3550','strong, broad','O-H'],['O–H (carboxylic acid)','2500–3300','very broad, under C–H','O-H'],['N–H','3300–3500','medium, sharper than O–H','N-H'],['C–H','2850–3000','medium to strong','C-H'],['C=O','1650–1780','very strong, sharp','C=O'],['C=C (aromatic)','1450–1600','medium, often two bands','C=C'],['C–O','1000–1300','strong','C-O'],['Fingerprint region','below 1500','many bands, unique to each compound','']]
      .forEach(r=>{h+='<tr><td style="text-align:left">'+r[0]+'</td><td style="text-align:left">'+r[1]+'</td><td style="text-align:left">'+r[2]+'</td>'+(ap?'<td>'+(SPRING[r[3]]?SPRING[r[3]][0]:'')+'</td>':'')+'</tr>';});
    h+='</tbody></table></div>';
    if(atLeast('honors'))h+='<p class="help" style="margin-top:8px"><b>Reading a mass spectrum.</b> The peak farthest right is usually the molecular ion M⁺ (the molar mass). The tallest peak is the base peak, set to 100%. Gaps between peaks show what broke off: 15 = CH₃, 17 = OH, 29 = C₂H₅ or CHO, 43 = CH₃CO or C₃H₇.</p>';
    return h;},
  challenges(sim){const iso=molIon(sim,'isopropanol'),ib=basePk(sim,'isopropanol'),unk=sim.st.unk,r=rng(sim.st.round*7+5);
    const pool=KEYS.filter(k=>k!==unk).sort(()=>r()-0.5).slice(0,3),opts=[unk].concat(pool).map(k=>({k,s:r()})).sort((a,b)=>a.s-b.s).map(o=>o.k);
    const hx=isoPeaks(msOf(sim,'hexane',false)).find(p=>p[0]===87),hxr=hx?hx[1]/13*100:0;
    const hco=hooke('C=O'),hc_o=hooke('C-O');
    return [
    {lvl:'bio',instant:true,set:{view:'ir',sample:'acetone'},q:'Acetone has a very strong, sharp band near 1715 cm⁻¹ and no broad band near 3300 cm⁻¹. Which bond makes the 1715 cm⁻¹ band?',choices:['O–H','C=O','N–H'],correct:1,
     explain:{bio:'The sample is now acetone. Bands between about 1650 and 1780 cm⁻¹ come from C=O double bonds. No broad valley near 3300 means no O–H.',ap:'C=O is a stiff bond (k ≈ 1190 N/m), and Hooke’s law puts its stretch near '+hco.nu.toFixed(0)+' cm⁻¹. Its large dipole change makes the band very strong.'}},
    {lvl:'bio',q:'Hexane has only C–H and C–C bonds. You switch the sample to ethanol. What new band appears?',choices:['A broad, deep band near 3300 cm⁻¹','A sharp band near 1715 cm⁻¹','No new band: both are carbon chains'],correct:0,
     baseline:{view:'ir',sample:'hexane'},change:{sample:'ethanol'},at:0.8,changeText:'Sample changed to ethanol',reveal:3.2,
     explain:{bio:'Ethanol has an O–H group. Its O–H stretch makes a broad valley centered near 3340 cm⁻¹. Both spectra share the C–H bands just below 3000 cm⁻¹.'}},
    {lvl:'bio',instant:true,set:{view:'ir',sample:'ethanol'},q:'On an IR spectrum, a valley that dips to 10% transmittance means the sample…',choices:['absorbed very little of that light','absorbed most of that light','gave off light'],correct:1,
     explain:{bio:'The graph shows how much light gets <b>through</b>. 10% transmittance means 90% was absorbed, because bonds in the sample vibrate at that frequency.'}},
    {lvl:'honors',instant:true,set:{view:'ms',sample:'isopropanol'},q:'Isopropanol’s molar mass is 60 g/mol. Which peak in its mass spectrum is the tallest?',choices:['m/z 60','m/z '+ib,'m/z 43','m/z 15'],correct:1,
     explain:{honors:'The tallest (base) peak is m/z '+ib+', CH₃CHOH⁺, made when the ion loses a CH₃ group. The molecular ion at m/z '+iso+' is tiny because it breaks apart so fast. The tallest peak is the most stable fragment, not the molar mass.'}},
    {lvl:'honors',instant:true,set:{view:'ms',sample:'ethanol',ref:'isopropanol'},q:'Ethanol and isopropanol have very similar IR spectra. What tells them apart best?',choices:['The O–H band','The mass spectrum: M⁺ at 46 vs 60 and base peaks at 31 vs 45','Their color'],correct:1,
     explain:{honors:'Both are alcohols, so both IR spectra show broad O–H, C–H and C–O bands. The mass spectra differ clearly. The panel now overlays isopropanol (hollow bars) on ethanol.'}},
    {lvl:'honors',instant:true,set:{view:'ir',sample:'ethylacetate',ref:'acetone'},q:'Acetone and ethyl acetate both have a C=O band near 1715–1740 cm⁻¹. Which band shows that ethyl acetate is an ester?',choices:['A strong C–O band near 1240 cm⁻¹','A broad O–H band near 3300 cm⁻¹','A band at 725 cm⁻¹'],correct:0,
     explain:{honors:'An ester has C(=O)–O–C. Its C–O stretch makes a strong band near 1240 cm⁻¹ (and another near 1050). Acetone, a ketone, has no C–O single bond. The overlay shows acetone dashed.'}},
    {lvl:'honors',instant:true,set:{sample:'unk'},q:'The evidence sample shows IR bands for '+groups(unk).join(', ')+'. Its mass spectrum has M⁺ at m/z '+molIon(sim,unk)+' and a base peak at m/z '+basePk(sim,unk)+'. What is it?',choices:opts.map(k=>C[k].name),correct:opts.indexOf(unk),
     explain:{honors:C[unk].name+' ('+CL.fmt(C[unk].f)+', '+CL.molarMass(C[unk].f).toFixed(1)+' g/mol) gives exactly these features. Overlay its library spectrum: the match should be above 95% for both IR and MS. Two independent spectra that match a reference make this a confirmatory identification.'}},
    {lvl:'ap',instant:true,set:{view:'ir',sample:'ethylacetate'},q:'C=O and C–O join the same two atoms, but C=O has a force constant of about 1190 N/m and C–O about 490 N/m. If C–O stretches near '+hc_o.nu.toFixed(0)+' cm⁻¹, where does C=O stretch?',choices:['Lower, near '+(hc_o.nu*Math.sqrt(490/1190)).toFixed(0)+' cm⁻¹','Higher, near '+hco.nu.toFixed(0)+' cm⁻¹','The same, since the atoms are the same'],correct:1,
     explain:{ap:'ν̃ = (1/2πc)·√(k/μ). The reduced mass μ = (12.01 × 16.00)/(28.01) = '+hco.mu.toFixed(2)+' u is the same, so ν̃ scales with √k: '+hc_o.nu.toFixed(0)+' × √(1190/490) = '+hco.nu.toFixed(0)+' cm⁻¹. Ethyl acetate shows both bands, at 1742 and 1240 cm⁻¹.'}},
    {lvl:'ap',instant:true,set:{view:'ms',sample:'hexane',iso:true},q:'Hexane’s molecular ion (m/z 86) has an M+1 peak '+hxr.toFixed(1)+'% as tall. Each carbon adds about 1.1% (from ¹³C). How many carbons does hexane have?',choices:['4','5','6','8'],correct:2,
     explain:{ap:hxr.toFixed(1)+'% ÷ 1.1% ≈ '+(hxr/1.1).toFixed(1)+', so 6 carbons. The model adds 1.07% per C plus 0.012% per H, which is why the answer is not a whole number. Isotope peaks are now shown.'}},
    {lvl:'ap',instant:true,set:{view:'ir',sample:'ethanol'},q:'Why is the O–H band of liquid ethanol so broad?',choices:['Hydrogen bonds give each O–H a slightly different strength, so a range of wavenumbers is absorbed','O–H bonds vibrate in every direction at once','The sample is impure'],correct:0,
     explain:{ap:'A free O–H stretches near 3650 cm⁻¹ (Hooke’s law gives '+hooke('O-H').nu.toFixed(0)+'). In the liquid, each O–H is hydrogen-bonded to a neighbor by a different amount, which weakens it and lowers its frequency. The overlapping absorptions merge into one broad band centered near 3340 cm⁻¹.'}},
    {lvl:'ap',instant:true,set:{view:'ms',sample:'caffeine'},q:'Caffeine’s tallest peak is its molecular ion (m/z 194), but hexane’s molecular ion is only 13%. Why?',choices:['Caffeine’s fused rings spread out the charge, so its ion holds together','Caffeine is heavier','Hexane has no electrons to remove'],correct:0,
     explain:{ap:'Ionization removes one electron. In caffeine, the conjugated ring system delocalizes the charge and the radical, so the ion survives. Hexane’s ion breaks easily at C–C bonds into stable carbocations like C₄H₉⁺ (m/z 57).'}}];},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,Object.assign({ref:'none'},ch.set));sim.st.scan=1;}},
  narrate(sim){const v=sim.p.view,k=curKey(sim),unk=sim.p.sample==='unk',nm=unk?'The evidence sample':C[k].name,p=selPeak(sim);
    if(sim.st.scan<1)return v==='ms'?'The spectrometer is ionizing the sample and sorting the fragments by mass…':'The spectrometer is sweeping infrared light from 4000 cm⁻¹ down to 500 cm⁻¹…';
    if(v==='ms'){const mi=molIon(sim,k),bp=basePk(sim,k);return nm+'’s molecular ion is at <b>m/z '+mi+'</b>'+(unk?', so its molar mass is about '+mi+' g/mol':'')+'. The tallest peak, m/z '+bp+', is the most stable fragment. '+(p[3]==='M+1'?'The selected bar is a ¹³C isotope peak.':'Selected: m/z '+p[0]+', '+p[3].replace(/^M⁺: /,'')+'.');}
    const h=hooke(p[3]);return nm+' absorbs at <b>'+p[0]+' cm⁻¹</b>: '+p[4]+'. '+(h?'Stiffer bonds and lighter atoms vibrate faster, so they absorb higher wavenumbers.':'Bending motions need less energy than stretches, so they sit at lower wavenumbers.');},
  tour:[
    {title:'An infrared spectrum',text:'The spectrometer shines infrared light through the sample and measures how much gets through at each wavenumber. <b>Valleys</b> are where the sample absorbs.',focus:[8,24,526,296],speed:1,setup(sim){BioLab.setValues(sim,{view:'ir',sample:'ethanol',ref:'none'});}},
    {title:'Bonds absorb their own frequency',text:'Ethanol’s broad valley near 3340 cm⁻¹ is the O–H bond stretching. Watch it vibrate in the molecule.',focus:[[8,24,526,296],[536,60,256,240]],speed:1,setup(sim){BioLab.setValues(sim,{sample:'ethanol'});sim.st.scan=1;setPk(sim,'O-H');}},
    {title:'C=O: a strong, sharp clue',text:'Acetone absorbs strongly at 1715 cm⁻¹. The C=O double bond is a stiffer spring, so it vibrates faster than C–O.',focus:[[8,24,526,296],[536,60,256,240]],speed:1,setup(sim){BioLab.setValues(sim,{sample:'acetone'});sim.st.scan=1;setPk(sim,'C=O');}},
    {title:'C–H and the fingerprint region',text:'Almost every organic compound has C–H stretches just below 3000 cm⁻¹. Below 1500 cm⁻¹ is the <b>fingerprint region</b>, a pattern unique to each molecule.',focus:[8,24,526,370],speed:1,setup(sim){BioLab.setValues(sim,{sample:'hexane'});sim.st.scan=1;setPk(sim,'C-H');}},
    {title:'Match the evidence',text:'Compare the evidence spectrum with the known compounds. Bands in the same places mean the same bonds, and a matching fingerprint region means the same molecule.',focus:[8,24,526,370],speed:1,setup(sim){BioLab.setValues(sim,{sample:'unk'});sim.st.scan=1;}},
    {lvl:'honors',title:'Mass spectrometry',text:'The mass spectrometer knocks an electron off each molecule, and the ions break apart. Each bar is a fragment, placed by its mass-to-charge ratio (m/z).',focus:[8,24,526,296],speed:1,setup(sim){BioLab.setValues(sim,{view:'ms',sample:'ethanol'});}},
    {lvl:'honors',title:'Molecular ion and base peak',text:'The bar farthest right is the molecular ion, M⁺ = 46, the molar mass of ethanol. The tallest bar (m/z 31, CH₂OH⁺) is the most stable fragment.',focus:[8,24,526,296],speed:1,setup(sim){sim.st.scan=1;setPk(sim,null,31);}},
    {lvl:'ap',title:'Isotope peaks',text:'With isotope peaks on, ¹³C adds a small M+1 bar about 1.1% per carbon. Caffeine’s M+1 at m/z 195 is about 10% of M⁺: 8 carbons plus a little from 4 nitrogens.',focus:[8,24,526,296],speed:1,setup(sim){BioLab.setValues(sim,{view:'ms',sample:'caffeine',iso:true});sim.st.scan=1;setPk(sim,null,195);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'ir',sample:'unk',ref:'none',iso:false});BioLab.reset(sim);},
  lab:{bio:'<p><b>Question:</b> Which compound is the evidence sample?</p><ol><li>Look at the evidence IR spectrum. Click each deep valley (or use Next peak) and write down the bond it shows.</li><li>Look at four known compounds and list their bonds the same way.</li><li>Find the known compound whose spectrum has the same bands in the same places.</li></ol><p>Write: “The evidence is ___ because its spectrum shows ___.”</p>',
       honors:'<p><b>Question:</b> Can you confirm the evidence with two techniques?</p><ol><li>From the IR spectrum, list the functional groups present.</li><li>From the mass spectrum, record M⁺ and the base peak. Work out what was lost to make the two biggest fragments.</li><li>Overlay library spectra until both IR and MS match above 95%.</li><li>Press New evidence sample and repeat.</li></ol><p>Explain why ethanol and isopropanol need the mass spectrum to tell apart.</p>',
       ap:'<p><b>Question:</b> How well does Hooke’s law predict IR bands?</p><ol><li>For each bond type (O–H, N–H, C–H, C=O, C–O), record the Hooke’s law prediction and the observed band in two compounds.</li><li>Calculate percent difference and explain any O–H gap with hydrogen bonding.</li><li>Turn on isotope peaks. Use the M+1 / M⁺ ratio to estimate the number of carbons in three compounds.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why a spectroscopic match is confirmatory while a color spot test is only presumptive.</p>'},
  terms:[{t:'Infrared (IR) spectroscopy',d:'Measuring which infrared frequencies a sample absorbs. Each bond type absorbs in its own range.'},{t:'Wavenumber',d:'1/wavelength, in cm⁻¹. Higher wavenumber means higher energy and frequency.'},
    {t:'Transmittance',d:'The percent of light that passes through. A valley means light was absorbed.'},{t:'Functional group',d:'A group of atoms (–OH, C=O, –COOH) that gives a molecule its properties and IR bands.'},
    {t:'Fingerprint region',d:'Below about 1500 cm⁻¹: many overlapping bands that are unique to each compound.'},
    {lvl:'honors',t:'Mass spectrometry',d:'Ionizes molecules, breaks them into fragments, and sorts the ions by mass-to-charge ratio (m/z).'},{lvl:'honors',t:'Molecular ion (M⁺)',d:'The whole molecule minus one electron; its m/z equals the molar mass.'},
    {lvl:'honors',t:'Base peak',d:'The tallest peak in a mass spectrum, set to 100%. It is the most stable or most common fragment.'},{lvl:'honors',t:'Confirmatory test',d:'A test that identifies a specific compound, like a spectrum matched to a reference.'},
    {lvl:'ap',t:'Hooke’s law for bonds',d:'ν̃ = (1/2πc)·√(k/μ): stiffer bonds (larger k) and lighter atoms (smaller μ) vibrate at higher wavenumbers.'},{lvl:'ap',t:'Reduced mass μ',d:'μ = m₁m₂/(m₁ + m₂) for the two bonded atoms.'},{lvl:'ap',t:'M+1 peak',d:'An isotope peak one unit above M⁺, mostly from ¹³C (1.07% of carbon atoms).'}],
  about:'<p><b>IR model.</b> Each spectrum is built from a list of bands at real positions for that compound (gas-phase and liquid reference spectra, NIST/SDBS style), each a Gaussian valley with its own width and depth. Transmittance = 96% × 10^(−absorbance). The Hooke’s law readout uses typical force constants (O–H 745, N–H 640, C–H 480, C=O 1190, C–O 490 N/m) and real atomic masses. It predicts the free stretch; hydrogen bonding lowers real O–H bands.</p><p><b>Mass spectra.</b> Electron-ionization peaks and relative heights are rounded from reference spectra. M+1 isotope peaks are calculated from the fragment formula (1.07% per C, 0.36% per N, 0.012% per H, 0.04% per O). Match scores are cosine similarities between the evidence and the library spectrum.</p><p><b>Simplified.</b> Caffeine, aspirin and acetaminophen keep only their main bands and fragments, and real spectra have many more small features. The evidence spectrum has small random noise added, as a real instrument would. Molecules are drawn flat (2D), and only one bond type vibrates at a time; really, whole groups of atoms move together in each vibration.</p>',
  initVis(sim){},
  onClick(sim,x,y){if(x<PL||x>PR||y<PT-10||y>PB+20)return;const ps=peaks(sim);let bi=-1,bd=1e9;
    if(sim.p.view==='ms'){const R=msRange(sim);ps.forEach((p,i)=>{const px=PL+(p[0]-R.x0)/(R.x1-R.x0)*(PR-PL),d=Math.abs(px-x);if(d<bd){bd=d;bi=i;}});}
    else ps.forEach((p,i)=>{const d=Math.abs(xNu(p[0])-x);if(d<bd){bd=d;bi=i;}});if(bi>=0&&bd<24)sim.st.pk=bi;},
  draw(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,v=p.view,key=curKey(sim),unk=p.sample==='unk',hon=atLeast('honors'),ap=atLeast('ap'),small=k>1.4,sel=selPeak(sim);
    PB=k>1.4?262:300;ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    // plot frame
    ctx.fillStyle=PAL['card'];rr(ctx,8,8,526,434,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
    txt(ctx,small?(v==='ms'?'Mass spectrum (%)':'IR spectrum (% T)'):(v==='ms'?'Mass spectrum':'Infrared spectrum'),small?12:PL,26,{s:14*k,w:700});
    if(v==='ms')drawMS(sim,ctx,k,t,sel);else drawIR(sim,ctx,k,t,sel);
    // molecule panel
    ctx.fillStyle=PAL['card'];rr(ctx,544,8,248,434,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.stroke();
    const title=unk?(small?'Evidence sample':'Evidence sample (unknown)'):C[key].name;txt(ctx,title,668,32,{s:14*k,w:700,a:'center'});
    if(hon)txt(ctx,unk?'Formula unknown':CL.fmt(C[key].f)+' · '+CL.molarMass(C[key].f).toFixed(1)+' g/mol',668,54,{s:12*k,c:PAL['cv-soft'],a:'center'});
    if(unk)drawSpring(ctx,sel,v,k,t);else drawMolecule(ctx,key,v==='ir'?sel[3]:null,k,t);
    // bottom-right info
    const lines=[];if(v==='ir'){const h=hooke(sel[3]);lines.push([sel[0]+' cm⁻¹: '+BNAME[sel[3]]+(h?' stretch':''),700]);
      if(ap&&h&&small)lines.push(['Hooke’s law: '+h.nu.toFixed(0)+' cm⁻¹',400]);else if(ap&&h){lines.push(['k = '+h.k+' N/m, μ = '+h.mu.toFixed(2)+' u',400]);lines.push(['ν̃ = √(k/μ) / 2πc = '+h.nu.toFixed(0)+' cm⁻¹',400]);}
      else if(h&&!small)lines.push([h.a+' and '+h.b+' atoms on a spring: '+(sel[0]>2500?'light H, fast':'heavier atoms, slower'),400]);else if(!h)lines.push(['Atoms swing side to side',400]);}
    else{lines.push(['m/z '+sel[0]+(hon?': '+(sel[3]==='M+1'?'¹³C isotope peak':CL.fmt(sel[2])+'⁺'):''),700]);if(sel[3]!=='M+1')lines.push([sel[3].replace('M⁺: ',''),400]);}
    let ly=small?338:330;lines.forEach(([s,w])=>{wrap(ctx,s,230,12.5*k,w).forEach(l=>{if(ly<432)txt(ctx,l,668,ly,{s:12.5*k,w,a:'center',c:w>500?PAL['cv-ink']:PAL['cv-soft']});ly+=17*Math.min(k,1.45);});});},
  thumbSetup(sim){BioLab.setValues(sim,{sample:'acetone'});sim.st.scan=1;setPk(sim,'C=O');}
};
function keyRow(ctx,x,y,items,k){items.forEach(it=>{ctx.strokeStyle=it.color;ctx.lineWidth=3;ctx.setLineDash(it.dash?[5,4]:[]);ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+20,y-5);ctx.stroke();ctx.setLineDash([]);ctx.font='600 '+(12*k)+'px '+FONT;txt(ctx,it.label,x+26,y,{s:12*k,w:600,c:PAL['cv-ink']});x+=ctx.measureText(it.label).width+46;});}
function setPk(sim,type,mz){const ps=peaks(sim);const i=ps.findIndex(p=>type?p[3]===type:p[0]===mz);if(i>=0)sim.st.pk=i;}
function wrap(ctx,s,W,fs,w){ctx.font=(w||400)+' '+fs+'px '+FONT;const words=s.split(' '),out=[];let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(ctx.measureText(tr).width>W&&cur){out.push(cur);cur=wd;}else cur=tr;});if(cur)out.push(cur);return out;}

function drawIR(sim,ctx,k,t,sel){const p=sim.p,st=sim.st,key=curKey(sim),hon=atLeast('honors'),small=k>1.4;
  // grid and axes
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;for(let n=4000;n>=500;n-=500){const x=Math.round(xNu(n))+.5;ctx.beginPath();ctx.moveTo(x,PT);ctx.lineTo(x,PB);ctx.stroke();if(!small||n%1000===0)txt(ctx,String(n),x,PB+17*k,{s:12*k,c:PAL['g-axis'],a:'center'});}
  [0,50,100].forEach(T=>{const y=Math.round(yT(T))+.5;ctx.beginPath();ctx.moveTo(PL,y);ctx.lineTo(PR,y);ctx.stroke();txt(ctx,String(T),PL-6,y,{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});});
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(PL+.5,PT);ctx.lineTo(PL+.5,PB+.5);ctx.lineTo(PR,PB+.5);ctx.stroke();
  txt(ctx,'Wavenumber (cm⁻¹)',(PL+PR)/2,PB+36*k,{s:12*k,c:PAL['muted'],a:'center'});
  if(!small){ctx.save();ctx.translate(22,(PT+PB)/2);ctx.rotate(-Math.PI/2);txt(ctx,'% transmittance',0,0,{s:12*k,c:PAL['muted'],a:'center',b:'middle'});ctx.restore();}
  // selected band marker
  const sx=xNu(sel[0]);ctx.fillStyle=PAL['s4'];ctx.globalAlpha=0.16;ctx.fillRect(sx-Math.max(6,sel[1]/(NU0-NU1)*(PR-PL)),PT,2*Math.max(6,sel[1]/(NU0-NU1)*(PR-PL)),PB-PT);ctx.globalAlpha=1;
  // reference overlay
  if(hon&&p.ref!=='none'){ctx.strokeStyle=serColor(1);ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();for(let n=NU0;n>=NU1;n-=4){const x=xNu(n),y=yT(trans(null,p.ref,n));n===NU0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);}
  // spectrum, drawn up to the scan position
  const nEnd=NU0-(NU0-NU1)*st.scan;ctx.strokeStyle=PAL['g-line'];ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.beginPath();for(let n=NU0;n>=nEnd;n-=4){const x=xNu(n),y=yT(trans(sim,key,n));n===NU0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  if(st.scan<1){const x=xNu(nEnd);ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,PT);ctx.lineTo(x,PB);ctx.stroke();}
  else{const y=yT(trans(sim,key,sel[0]));ctx.fillStyle=PAL['s4'];ctx.beginPath();ctx.arc(sx,y,6,0,6.29);ctx.fill();ctx.strokeStyle=PAL['card'];ctx.lineWidth=2;ctx.stroke();
    const lab=sel[0]+' cm⁻¹';ctx.font='700 '+(12.5*k)+'px '+FONT;const w=ctx.measureText(lab).width;const lx=clamp(sx,PL+w/2+4,PR-w/2-4);pill(ctx,lab,lx,y+(y>PB-40?-24:24)*Math.min(k,1.3),PAL['s4'],'#fff',12.5*k);}
  if(hon&&p.ref!=='none')keyRow(ctx,small?12:PL+190,small?PB+56*k+4:24,[{label:'library: '+C[p.ref].name,color:serColor(1),dash:true}],k);
  // correlation strip
  if(hon&&p.ref!=='none'&&small)return;const RG=[[3600,3200,'O–H, N–H',0],[3000,2850,'C–H',1],[1780,1650,'C=O',0],[1300,1000,'C–O',1],[1500,500,'fingerprint',2]];const y0=PB+36*k+20,rh=16*Math.min(k,1.4);
  RG.forEach(([a,b,l,row])=>{const x1=xNu(a),x2=xNu(b),yy=y0+row*rh;ctx.fillStyle=row===2?PAL['cv-bg2']:PAL['s6'];ctx.globalAlpha=row===2?1:0.25;ctx.fillRect(x1,yy-rh*0.75,x2-x1,rh*0.85);ctx.globalAlpha=1;
    txt(ctx,l,(x1+x2)/2,yy,{s:12*k,w:600,a:'center',c:PAL['cv-ink'],b:'alphabetic'});});}
function drawMS(sim,ctx,k,t,sel){const p=sim.p,st=sim.st,key=curKey(sim),unk=p.sample==='unk',hon=atLeast('honors'),ap=atLeast('ap'),small=k>1.4,R=msRange(sim);
  const X=m=>PL+(m-R.x0)/(R.x1-R.x0)*(PR-PL),Y=r=>PB-r/112*(PB-PT);
  ctx.strokeStyle=PAL['g-grid'];ctx.lineWidth=1;const stp=R.x1>120?(small?40:20):(small?20:10);for(let m=Math.ceil(R.x0/stp)*stp;m<=R.x1;m+=stp){const x=Math.round(X(m))+.5;ctx.beginPath();ctx.moveTo(x,PT);ctx.lineTo(x,PB);ctx.stroke();txt(ctx,String(m),x,PB+17*k,{s:12*k,c:PAL['g-axis'],a:'center'});}
  [0,50,100].forEach(r=>{const y=Math.round(Y(r))+.5;ctx.beginPath();ctx.moveTo(PL,y);ctx.lineTo(PR,y);ctx.stroke();txt(ctx,String(r),PL-6,y,{s:12*k,c:PAL['g-axis'],a:'right',b:'middle'});});
  ctx.strokeStyle=PAL['g-axis'];ctx.beginPath();ctx.moveTo(PL+.5,PT);ctx.lineTo(PL+.5,PB+.5);ctx.lineTo(PR,PB+.5);ctx.stroke();
  txt(ctx,'Mass-to-charge ratio (m/z)',(PL+PR)/2,PB+36*k,{s:12*k,c:PAL['muted'],a:'center'});
  if(!small){ctx.save();ctx.translate(22,(PT+PB)/2);ctx.rotate(-Math.PI/2);txt(ctx,'Relative abundance (%)',0,0,{s:12*k,c:PAL['muted'],a:'center',b:'middle'});ctx.restore();}
  const bw=Math.max(3,Math.min(8,(PR-PL)/(R.x1-R.x0)*0.7));
  if(hon&&p.ref!=='none'){ctx.strokeStyle=serColor(1);ctx.lineWidth=1.8;msOf(sim,p.ref,false).forEach(q=>{if(q[0]>R.x1)return;ctx.strokeRect(X(q[0])-bw/2+3,Y(q[1]),bw,PB-Y(q[1]));});}
  let ps=msOf(sim,key,unk);if(p.iso&&ap)ps=ps.concat(isoPeaks(ps));const grow=clamp(st.scan*1.4,0,1);
  ps.forEach(q=>{const isSel=q[0]===sel[0];ctx.fillStyle=isSel?PAL['s4']:q[3]==='M+1'?PAL['s5']:PAL['g-line'];const h=(PB-Y(q[1]))*grow;ctx.fillRect(X(q[0])-bw/2,PB-h,bw,h);});
  // labels: biggest peaks first, skip any that would overlap
  if(grow>=1){const placed=[];ctx.font='600 '+(12*k)+'px '+FONT;ps.filter(q=>q[3]!=='M+1'||q[0]===sel[0]).sort((a,b)=>(b[0]===sel[0])-(a[0]===sel[0])||b[1]-a[1]).forEach(q=>{const s=String(q[0]),w=ctx.measureText(s).width+6,x=X(q[0]),y=Y(q[1])-6;
      if(placed.some(o=>Math.abs(o.x-x)<(o.w+w)/2&&Math.abs(o.y-y)<14*k))return;if(placed.length>=(small?4:7)&&q[0]!==sel[0])return;placed.push({x,y,w});txt(ctx,s,x,y,{s:12*k,w:q[0]===sel[0]?800:600,a:'center',c:q[0]===sel[0]?PAL['s4']:PAL['cv-ink']});});}
  const items=[];if(hon&&p.ref!=='none')items.push({label:'library: '+C[p.ref].name,color:serColor(1)});if(p.iso&&ap)items.push({label:'¹³C isotope peaks',color:PAL['s5']});if(items.length)keyRow(ctx,small?12:PL+200,PB+56*k+4,items,k);
  if(!small){const mi=molIon(sim,key);txt(ctx,'M⁺ = m/z '+mi+(unk?'':' ≈ '+CL.molarMass(C[key].f).toFixed(0)+' g/mol'),PL,PB+62,{s:13*k,w:600,c:PAL['cv-ink']});}}
function drawMolecule(ctx,key,type,k,t){const L=layout(key),bx=552,by=66,bw=232,bh=230;const sc=Math.min(46,bw/(L.x1-L.x0+1.1),bh/(L.y1-L.y0+1.1));
  const ox=bx+bw/2-(L.x0+L.x1)/2*sc,oy=by+bh/2-(L.y0+L.y1)/2*sc;const pos=L.at.map(a=>({x:ox+a.x*sc,y:oy+a.y*sc}));
  const f=type?(type==='bend'?2.2:clamp((C[key].ir.find(b=>b[3]===type)||[2000])[0]/700,1.5,6)):0,ph=RM?0:Math.sin(t*f*2*Math.PI);
  const disp=pos.map(q=>({x:q.x,y:q.y}));
  if(type){L.bd.forEach(b=>{const bt=bondType(L.at,b);const isBend=type==='bend'&&bt==='C-H';if(bt!==type&&!isBend)return;const A=pos[b.a],B=pos[b.b],dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    const hEnd=L.at[b.b].s==='H'?b.b:L.at[b.a].s==='H'?b.a:-1;
    if(isBend){if(hEnd>=0){disp[hEnd].x+=-uy*5*ph;disp[hEnd].y+=ux*5*ph;}}
    else if(hEnd>=0){const s=hEnd===b.b?1:-1;disp[hEnd].x+=ux*6*ph*s;disp[hEnd].y+=uy*6*ph*s;}
    else{disp[b.a].x-=ux*3*ph;disp[b.a].y-=uy*3*ph;disp[b.b].x+=ux*3*ph;disp[b.b].y+=uy*3*ph;}});}
  L.bd.forEach(b=>{const A=disp[b.a],B=disp[b.b],bt=bondType(L.at,b),hi=type&&(bt===type||(type==='bend'&&bt==='C-H'));ctx.strokeStyle=hi?PAL['s4']:PAL['cv-soft'];ctx.lineWidth=hi?4:2.5;
    if(b.o===2){const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*3.5,ny=dx/len*3.5;ctx.beginPath();ctx.moveTo(A.x+nx,A.y+ny);ctx.lineTo(B.x+nx,B.y+ny);ctx.moveTo(A.x-nx,A.y-ny);ctx.lineTo(B.x-nx,B.y-ny);ctx.stroke();}
    else{ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}});
  const lbl=sc*0.3>=12*k*0.5;L.at.forEach((a,i)=>{const r=a.s==='H'?sc*0.2:sc*0.3;CL.drawAtom(ctx,disp[i].x,disp[i].y,r,a.s,{label:a.s!=='H'&&lbl&&r*1.9>=12*k?a.s:'',s:Math.max(12*k,r*0.95)});});
  // CPK key
  const used=['C','H','O','N'].filter(s=>L.at.some(a=>a.s===s));let x=668-used.length*24;const y=306;used.forEach(s=>{CL.drawAtom(ctx,x,y-4,7,s,{label:''});txt(ctx,s,x+11,y,{s:12*k,w:700,c:PAL['cv-ink']});x+=48;});
  }
function drawSpring(ctx,sel,view,k,t){const cx=668,cy=170;
  if(view==='ms'){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,cx-30,cy-50,60,90,10);ctx.stroke();ctx.fillStyle=PAL['cv-water'];rr(ctx,cx-27,cy-5,54,42,8);ctx.fill();txt(ctx,'?',cx,cy-12,{s:30*k,w:800,a:'center',c:PAL['cv-soft']});
    txt(ctx,'Structure unknown',cx,cy+72,{s:12*k,c:PAL['cv-soft'],a:'center'});return;}
  const h=hooke(sel[3]);const pair=h?[h.a,h.b]:['C','H'];const f=h?clamp(sel[0]/700,1.5,6):2.2,ph=RM?0:Math.sin(t*f*2*Math.PI),L0=86;
  const mA=CL.el(pair[0]).mass,mB=CL.el(pair[1]).mass,ext=h?ph*12:0,xa=cx-L0/2-ext*mB/(mA+mB),xb=cx+L0/2+ext*mA/(mA+mB),yb=h?cy:cy+ph*10;
  ctx.strokeStyle=PAL['s4'];ctx.lineWidth=3;ctx.beginPath();const n=10;for(let i=0;i<=n;i++){const x=lerp(xa,xb,i/n),y=lerp(cy,yb,i/n)+(i%2?-9:9)*(i>0&&i<n?1:0);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
  const rA=pair[0]==='H'?16:24,rB=pair[1]==='H'?16:24;CL.drawAtom(ctx,xa,cy,rA,pair[0],{s:Math.max(12*k,rA*0.9)});CL.drawAtom(ctx,xb,yb,rB,pair[1],{s:Math.max(12*k,rB*0.9)});
  txt(ctx,h?BNAME[sel[3]]+' bond stretching':'a bending vibration',cx,cy+70,{s:12.5*k,w:700,a:'center'});if(k<=1.4)txt(ctx,'Structure unknown',cx,cy+92,{s:12*k,c:PAL['cv-soft'],a:'center'});}

SPEC.controls[0].onChange=function(sim){syncView(sim);newScan(sim);};
BioLab.register(SPEC);
})();

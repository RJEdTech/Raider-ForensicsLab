/* Raider ChemLab: shared chemistry data and helpers (global ChemLab).
   Loaded after engine.js and before the sims. Every sim reads element data, formulas,
   ions and constants from here, so numbers agree across the whole site. */
(function(){
'use strict';
const CL={};window.ChemLab=CL;

/* ---------- constants (SI unless noted) ---------- */
CL.K={NA:6.02214076e23,R:8.314,Ratm:0.08206,RkPa:8.314,h:6.62607015e-34,c:2.99792458e8,F:96485,kB:1.380649e-23,e:1.602176634e-19,
  amu:1.66053907e-27,me:9.1093837e-31,RH:2.178e-18,cWater:4.184,Kw:1.0e-14,atm:101.325,mmHg:760};

/* ---------- elements ----------
   Z order. Fields: sym|name|mass|group|period|category|EN (Pauling)|covalent radius (pm)|IE1 (kJ/mol)|state at 25 °C
   category: alkali, alkaline, transition, post, metalloid, nonmetal, halogen, noble, lanthanide, actinide */
const RAW=`H|Hydrogen|1.008|1|1|nonmetal|2.20|31|1312|g
He|Helium|4.0026|18|1|noble||28|2372|g
Li|Lithium|6.94|1|2|alkali|0.98|128|520|s
Be|Beryllium|9.0122|2|2|alkaline|1.57|96|900|s
B|Boron|10.81|13|2|metalloid|2.04|84|801|s
C|Carbon|12.011|14|2|nonmetal|2.55|76|1086|s
N|Nitrogen|14.007|15|2|nonmetal|3.04|71|1402|g
O|Oxygen|15.999|16|2|nonmetal|3.44|66|1314|g
F|Fluorine|18.998|17|2|halogen|3.98|57|1681|g
Ne|Neon|20.180|18|2|noble||58|2081|g
Na|Sodium|22.990|1|3|alkali|0.93|166|496|s
Mg|Magnesium|24.305|2|3|alkaline|1.31|141|738|s
Al|Aluminum|26.982|13|3|post|1.61|121|578|s
Si|Silicon|28.085|14|3|metalloid|1.90|111|787|s
P|Phosphorus|30.974|15|3|nonmetal|2.19|107|1012|s
S|Sulfur|32.06|16|3|nonmetal|2.58|105|1000|s
Cl|Chlorine|35.45|17|3|halogen|3.16|102|1251|g
Ar|Argon|39.948|18|3|noble||106|1521|g
K|Potassium|39.098|1|4|alkali|0.82|203|419|s
Ca|Calcium|40.078|2|4|alkaline|1.00|176|590|s
Sc|Scandium|44.956|3|4|transition|1.36|170|633|s
Ti|Titanium|47.867|4|4|transition|1.54|160|659|s
V|Vanadium|50.942|5|4|transition|1.63|153|651|s
Cr|Chromium|51.996|6|4|transition|1.66|139|653|s
Mn|Manganese|54.938|7|4|transition|1.55|139|717|s
Fe|Iron|55.845|8|4|transition|1.83|132|763|s
Co|Cobalt|58.933|9|4|transition|1.88|126|760|s
Ni|Nickel|58.693|10|4|transition|1.91|124|737|s
Cu|Copper|63.546|11|4|transition|1.90|132|746|s
Zn|Zinc|65.38|12|4|transition|1.65|122|906|s
Ga|Gallium|69.723|13|4|post|1.81|122|579|s
Ge|Germanium|72.630|14|4|metalloid|2.01|120|762|s
As|Arsenic|74.922|15|4|metalloid|2.18|119|947|s
Se|Selenium|78.971|16|4|nonmetal|2.55|120|941|s
Br|Bromine|79.904|17|4|halogen|2.96|120|1140|l
Kr|Krypton|83.798|18|4|noble|3.00|116|1351|g
Rb|Rubidium|85.468|1|5|alkali|0.82|220|403|s
Sr|Strontium|87.62|2|5|alkaline|0.95|195|550|s
Y|Yttrium|88.906|3|5|transition|1.22|190|600|s
Zr|Zirconium|91.224|4|5|transition|1.33|175|640|s
Nb|Niobium|92.906|5|5|transition|1.6|164|652|s
Mo|Molybdenum|95.95|6|5|transition|2.16|154|684|s
Tc|Technetium|98|7|5|transition|1.9|147|702|s
Ru|Ruthenium|101.07|8|5|transition|2.2|146|710|s
Rh|Rhodium|102.91|9|5|transition|2.28|142|720|s
Pd|Palladium|106.42|10|5|transition|2.20|139|804|s
Ag|Silver|107.87|11|5|transition|1.93|145|731|s
Cd|Cadmium|112.41|12|5|transition|1.69|144|868|s
In|Indium|114.82|13|5|post|1.78|142|558|s
Sn|Tin|118.71|14|5|post|1.96|139|709|s
Sb|Antimony|121.76|15|5|metalloid|2.05|139|834|s
Te|Tellurium|127.60|16|5|metalloid|2.1|138|869|s
I|Iodine|126.90|17|5|halogen|2.66|139|1008|s
Xe|Xenon|131.29|18|5|noble|2.6|140|1170|g
Cs|Cesium|132.91|1|6|alkali|0.79|244|376|s
Ba|Barium|137.33|2|6|alkaline|0.89|215|503|s
La|Lanthanum|138.91|3|6|lanthanide|1.10|207|538|s
Ce|Cerium|140.12|3|6|lanthanide|1.12|204|534|s
Pr|Praseodymium|140.91|3|6|lanthanide|1.13|203|527|s
Nd|Neodymium|144.24|3|6|lanthanide|1.14|201|533|s
Pm|Promethium|145|3|6|lanthanide|1.13|199|540|s
Sm|Samarium|150.36|3|6|lanthanide|1.17|198|545|s
Eu|Europium|151.96|3|6|lanthanide|1.2|198|547|s
Gd|Gadolinium|157.25|3|6|lanthanide|1.2|196|593|s
Tb|Terbium|158.93|3|6|lanthanide|1.1|194|566|s
Dy|Dysprosium|162.50|3|6|lanthanide|1.22|192|573|s
Ho|Holmium|164.93|3|6|lanthanide|1.23|192|581|s
Er|Erbium|167.26|3|6|lanthanide|1.24|189|589|s
Tm|Thulium|168.93|3|6|lanthanide|1.25|190|597|s
Yb|Ytterbium|173.05|3|6|lanthanide|1.1|187|603|s
Lu|Lutetium|174.97|3|6|lanthanide|1.27|187|524|s
Hf|Hafnium|178.49|4|6|transition|1.3|175|659|s
Ta|Tantalum|180.95|5|6|transition|1.5|170|761|s
W|Tungsten|183.84|6|6|transition|2.36|162|770|s
Re|Rhenium|186.21|7|6|transition|1.9|151|760|s
Os|Osmium|190.23|8|6|transition|2.2|144|840|s
Ir|Iridium|192.22|9|6|transition|2.20|141|880|s
Pt|Platinum|195.08|10|6|transition|2.28|136|870|s
Au|Gold|196.97|11|6|transition|2.54|136|890|s
Hg|Mercury|200.59|12|6|transition|2.00|132|1007|l
Tl|Thallium|204.38|13|6|post|1.62|145|589|s
Pb|Lead|207.2|14|6|post|2.33|146|716|s
Bi|Bismuth|208.98|15|6|post|2.02|148|703|s
Po|Polonium|209|16|6|metalloid|2.0|140|812|s
At|Astatine|210|17|6|halogen|2.2|150|899|s
Rn|Radon|222|18|6|noble||150|1037|g
Fr|Francium|223|1|7|alkali|0.7|260|393|s
Ra|Radium|226|2|7|alkaline|0.9|221|509|s
Ac|Actinium|227|3|7|actinide|1.1|215|499|s
Th|Thorium|232.04|3|7|actinide|1.3|206|587|s
Pa|Protactinium|231.04|3|7|actinide|1.5|200|568|s
U|Uranium|238.03|3|7|actinide|1.38|196|598|s
Np|Neptunium|237|3|7|actinide|1.36|190|605|s
Pu|Plutonium|244|3|7|actinide|1.28|187|585|s
Am|Americium|243|3|7|actinide|1.3|180|578|s
Cm|Curium|247|3|7|actinide|1.3|169|581|s
Bk|Berkelium|247|3|7|actinide|1.3||601|s
Cf|Californium|251|3|7|actinide|1.3||608|s
Es|Einsteinium|252|3|7|actinide|1.3||619|s
Fm|Fermium|257|3|7|actinide|1.3||627|s
Md|Mendelevium|258|3|7|actinide|1.3||635|s
No|Nobelium|259|3|7|actinide|1.3||642|s
Lr|Lawrencium|266|3|7|actinide|1.3||470|s
Rf|Rutherfordium|267|4|7|transition||||s
Db|Dubnium|268|5|7|transition||||s
Sg|Seaborgium|269|6|7|transition||||s
Bh|Bohrium|270|7|7|transition||||s
Hs|Hassium|269|8|7|transition||||s
Mt|Meitnerium|278|9|7|transition||||s
Ds|Darmstadtium|281|10|7|transition||||s
Rg|Roentgenium|282|11|7|transition||||s
Cn|Copernicium|285|12|7|transition||||s
Nh|Nihonium|286|13|7|post||||s
Fl|Flerovium|289|14|7|post||||s
Mc|Moscovium|290|15|7|post||||s
Lv|Livermorium|293|16|7|post||||s
Ts|Tennessine|294|17|7|halogen||||s
Og|Oganesson|294|18|7|noble||||s`;
const num=s=>s===''||s===undefined?null:parseFloat(s);
CL.elements=RAW.split('\n').map((line,i)=>{const f=line.split('|');return {Z:i+1,sym:f[0],name:f[1],mass:parseFloat(f[2]),group:+f[3],period:+f[4],cat:f[5],
  en:num(f[6]),radius:num(f[7]),ie1:num(f[8]),state:f[9],synthetic:i+1>=93||i+1===43||i+1===61};});
CL.bySym={};CL.elements.forEach(e=>CL.bySym[e.sym]=e);
CL.el=x=>typeof x==='number'?CL.elements[x-1]:CL.bySym[x];
CL.CAT_NAMES={alkali:'Alkali metal',alkaline:'Alkaline earth metal',transition:'Transition metal',post:'Post-transition metal',metalloid:'Metalloid',
  nonmetal:'Nonmetal',halogen:'Halogen',noble:'Noble gas',lanthanide:'Lanthanide',actinide:'Actinide'};
CL.isMetal=e=>{e=typeof e==='object'?e:CL.el(e);return ['alkali','alkaline','transition','post','lanthanide','actinide'].includes(e.cat);};
/* Standard periodic-table grid position (lanthanides/actinides in rows 9 and 10). Returns {row,col} 1-based. */
CL.gridPos=e=>{e=typeof e==='object'?e:CL.el(e);if(e.cat==='lanthanide'&&e.Z!==57&&e.Z<=71)return {row:9,col:e.Z-57+3};if(e.cat==='actinide'&&e.Z!==89&&e.Z<=103)return {row:10,col:e.Z-89+3};
  if(e.Z===57||e.Z===89)return {row:e.period,col:3};return {row:e.period,col:e.group};};
/* Valence electrons for main-group elements (groups 1-2, 13-18); He = 2. Transition metals return null. */
CL.valence=e=>{e=typeof e==='object'?e:CL.el(e);if(e.Z===2)return 2;if(e.group<=2)return e.group;if(e.group>=13)return e.group-10;return null;};

/* ---------- electron configurations ---------- */
const ORDER=[[1,0],[2,0],[2,1],[3,0],[3,1],[4,0],[3,2],[4,1],[5,0],[4,2],[5,1],[6,0],[4,3],[5,2],[6,1],[7,0],[5,3],[6,2],[7,1]];
const LCH='spdf',CAP=[2,6,10,14];
const EXC={24:{'3d':5,'4s':1},29:{'3d':10,'4s':1},41:{'4d':4,'5s':1},42:{'4d':5,'5s':1},44:{'4d':7,'5s':1},45:{'4d':8,'5s':1},46:{'4d':10,'5s':0},47:{'4d':10,'5s':1},
  57:{'4f':0,'5d':1},58:{'4f':1,'5d':1},64:{'4f':7,'5d':1},78:{'5d':9,'6s':1},79:{'5d':10,'6s':1},89:{'5f':0,'6d':1},90:{'5f':0,'6d':2},91:{'5f':2,'6d':1},92:{'5f':3,'6d':1},93:{'5f':4,'6d':1},96:{'5f':7,'6d':1}};
/* Returns [{n,l,label:'3d',e}] in filling (Aufbau) order, with the well-known exceptions applied (Cr, Cu, Mo, Ag, Au, ...). */
CL.config=function(Z,opts){opts=opts||{};let left=Z;const out=[];for(const [n,l] of ORDER){if(left<=0)break;const e=Math.min(CAP[l],left);out.push({n,l,label:n+LCH[l],e});left-=e;}
  if(!opts.aufbauOnly&&EXC[Z]){const fix=EXC[Z];for(const lab in fix){let s=out.find(o=>o.label===lab);if(!s){const n=+lab[0],l=LCH.indexOf(lab[1]);s={n,l,label:lab,e:0};out.push(s);}s.e=fix[lab];}
    const tot=out.reduce((a,o)=>a+o.e,0);if(tot!==Z){/* rebalance on highest s */const s=out.filter(o=>o.l===0).pop();s.e+=Z-tot;}}
  return out.filter(o=>o.e>0||opts.keepEmpty);};
const SUPD={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻'};
const SUBD={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
CL.sup=s=>String(s).split('').map(c=>SUPD[c]||c).join('');
CL.sub=s=>String(s).split('').map(c=>SUBD[c]||c).join('');
/* "1s² 2s² 2p⁶ 3s¹"; opts.noble:true gives "[Ne] 3s¹"; opts.order:'shell' sorts by n then l. */
CL.configText=function(Z,opts){opts=opts||{};let cfg=CL.config(Z);const nobles=[2,10,18,36,54,86];let core='';
  if(opts.noble){const ng=nobles.filter(z=>z<Z).pop();if(ng){const inner=CL.config(ng).map(o=>o.label);core='['+CL.el(ng).sym+'] ';cfg=cfg.filter(o=>!inner.includes(o.label)||o.e!==CL.config(ng).find(x=>x.label===o.label).e);}}
  if(opts.order==='shell')cfg=cfg.slice().sort((a,b)=>a.n-b.n||a.l-b.l);
  return core+cfg.map(o=>o.label+CL.sup(o.e)).join(' ');};

/* ---------- formulas ---------- */
/* Charges: write them with ^ or a space ("SO4^2-", "SO4 2-"); a bare trailing sign ("MnO4-") is dropped and the digits are kept as a subscript.
   Parse "Ca(OH)2", "CuSO4·5H2O", "CuSO4*5H2O", "Fe2(SO4)3", "[Cu(NH3)4]2+" → {Ca:1,O:2,H:2}. Charges and states are ignored. */
CL.parse=function(f){f=String(f).replace(/\((aq|s|l|g)\)/g,'').replace(/[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+$/,'').replace(/(\^\d*|\s+\d*)[+\-−]$/,'').replace(/[+\-−]$/,'').trim();
  f=f.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c));
  const parts=f.split(/[·*•]/);const total={};
  parts.forEach(p=>{let m=p.match(/^(\d+)(.*)$/),mult=1;if(m){mult=+m[1];p=m[2];}const c=parseGroup(p);for(const k in c)total[k]=(total[k]||0)+c[k]*mult;});
  return total;};
function parseGroup(s){const stack=[{}];let i=0;
  while(i<s.length){const ch=s[i];
    if(ch==='('||ch==='['){stack.push({});i++;}
    else if(ch===')'||ch===']'){i++;let n='';while(i<s.length&&/\d/.test(s[i]))n+=s[i++];const top=stack.pop(),k=n?+n:1;const t=stack[stack.length-1];for(const e in top)t[e]=(t[e]||0)+top[e]*k;}
    else if(/[A-Z]/.test(ch)){let sym=ch;i++;while(i<s.length&&/[a-z]/.test(s[i]))sym+=s[i++];let n='';while(i<s.length&&/\d/.test(s[i]))n+=s[i++];
      if(!CL.bySym[sym])throw new Error('Unknown element '+sym);const t=stack[stack.length-1];t[sym]=(t[sym]||0)+(n?+n:1);}
    else i++;}
  return stack[0];}
CL.molarMass=f=>{const c=typeof f==='string'?CL.parse(f):f;let m=0;for(const k in c)m+=CL.bySym[k].mass*c[k];return m;};
/* Mass percent of each element: [{sym,count,mass,pct}] */
CL.percentComp=f=>{const c=typeof f==='string'?CL.parse(f):f,M=CL.molarMass(c);return Object.keys(c).map(s=>({sym:s,count:c[s],mass:CL.bySym[s].mass*c[s],pct:100*CL.bySym[s].mass*c[s]/M}));};
/* Pretty formula with unicode subscripts and a charge: fmt('SO4',-2) → SO₄²⁻ ; fmt('CuSO4*5H2O') → CuSO₄·5H₂O */
CL.fmt=function(f,charge){let s=String(f).replace(/\*/g,'·').replace(/([A-Za-z)\]])(\d+)/g,(m,a,n)=>a+CL.sub(n));
  if(charge){const a=Math.abs(charge);s+=CL.sup((a===1?'':a)+(charge>0?'+':'-'));}return s;};
/* HTML formula: html('H2SO4') → H<sub>2</sub>SO<sub>4</sub> */
CL.html=function(f,charge){let s=String(f).replace(/\*/g,'·').replace(/([A-Za-z)\]])(\d+)/g,'$1<sub>$2</sub>');if(charge){const a=Math.abs(charge);s+='<sup>'+(a===1?'':a)+(charge>0?'+':'−')+'</sup>';}return s;};
/* Hill-order formula string from counts (C first, then H, then alphabetical) */
CL.hill=c=>{const ks=Object.keys(c).filter(k=>c[k]>0);const ord=ks.includes('C')?['C','H',...ks.filter(k=>k!=='C'&&k!=='H').sort()].filter(k=>ks.includes(k)):ks.sort();return ord.map(k=>k+(c[k]>1?c[k]:'')).join('');};

/* ---------- numbers ---------- */
/* Scientific notation with unicode: sci(6.022e23,'',4) → "6.022 × 10²³" */
CL.sci=function(v,unit,sig){sig=sig||3;if(!Number.isFinite(v))return '—';if(v===0)return '0'+(unit?' '+unit:'');const e=Math.floor(Math.log10(Math.abs(v)));
  if(e>=-2&&e<4){const d=Math.max(0,sig-1-e);return v.toFixed(Math.min(d,6))+(unit?' '+unit:'');}
  let m=v/Math.pow(10,e);let ms=m.toFixed(sig-1);if(Math.abs(parseFloat(ms))>=10){m/=10;ms=m.toFixed(sig-1);return ms+' × 10'+CL.sup(e+1)+(unit?' '+unit:'');}
  return ms+' × 10'+CL.sup(String(e).replace('-','−'))+(unit?' '+unit:'');};
/* Count significant figures in a typed number string ("0.00450" → 3, "1200" → 2, "1200." → 4, "1.20e3" → 3) */
CL.sigFigs=function(str){str=String(str).trim().replace(/^[+\-−]/,'');let m=str.match(/^([\d.]+)(?:[eE×x][\s\S]*)?$/);if(!m)return NaN;let s=m[1];
  const hasDot=s.includes('.');let digits=s.replace('.','');digits=digits.replace(/^0+/,'');if(!digits.length)return hasDot?Math.max(1,(s.split('.')[1]||'').length):1;
  if(!hasDot)digits=digits.replace(/0+$/,'');return digits.length;};
CL.roundSig=(v,n)=>{if(!Number.isFinite(v)||v===0)return v;const d=Math.ceil(Math.log10(Math.abs(v)));const p=Math.pow(10,n-d);return Math.round(v*p)/p;};
/* String with exactly n significant figures (keeps trailing zeros) */
CL.toSig=(v,n)=>{if(!Number.isFinite(v))return '—';if(v===0)return (0).toFixed(Math.max(0,n-1));v=CL.roundSig(v,n);let e=Math.floor(Math.log10(Math.abs(v)));
  if(e>=n||e<-4){const m=v/Math.pow(10,e);return m.toFixed(n-1)+' × 10'+CL.sup(String(e).replace('-','−'));}
  const s=v.toFixed(Math.max(0,n-1-e));return (e===n-1&&/0$/.test(s))?s+'.':s;};

/* ---------- ions ---------- */
/* Common monatomic ions: sym → [charges] (first = most common) */
CL.monatomic={H:[1,-1],Li:[1],Na:[1],K:[1],Rb:[1],Cs:[1],Be:[2],Mg:[2],Ca:[2],Sr:[2],Ba:[2],Al:[3],Ga:[3],Zn:[2],Cd:[2],Ag:[1],
  Sc:[3],Ti:[4,3],V:[3,5],Cr:[3,2],Mn:[2,4],Fe:[3,2],Co:[2,3],Ni:[2],Cu:[2,1],Au:[3,1],Hg:[2,1],Sn:[2,4],Pb:[2,4],
  N:[-3],P:[-3],O:[-2],S:[-2],Se:[-2],F:[-1],Cl:[-1],Br:[-1],I:[-1]};
CL.anionName={N:'nitride',P:'phosphide',O:'oxide',S:'sulfide',Se:'selenide',F:'fluoride',Cl:'chloride',Br:'bromide',I:'iodide',H:'hydride',C:'carbide'};
CL.ROMAN=['','I','II','III','IV','V','VI','VII','VIII'];
CL.polyatomic=[
  {name:'ammonium',f:'NH4',q:1},{name:'hydronium',f:'H3O',q:1},{name:'mercury(I)',f:'Hg2',q:2},
  {name:'acetate',f:'C2H3O2',q:-1,alt:'CH3COO'},{name:'nitrate',f:'NO3',q:-1},{name:'nitrite',f:'NO2',q:-1},{name:'hydroxide',f:'OH',q:-1},{name:'cyanide',f:'CN',q:-1},
  {name:'permanganate',f:'MnO4',q:-1},{name:'hydrogen carbonate',f:'HCO3',q:-1,alt2:'bicarbonate'},{name:'hydrogen sulfate',f:'HSO4',q:-1,alt2:'bisulfate'},{name:'dihydrogen phosphate',f:'H2PO4',q:-1},
  {name:'perchlorate',f:'ClO4',q:-1},{name:'chlorate',f:'ClO3',q:-1},{name:'chlorite',f:'ClO2',q:-1},{name:'hypochlorite',f:'ClO',q:-1},
  {name:'thiocyanate',f:'SCN',q:-1},
  {name:'sulfate',f:'SO4',q:-2},{name:'sulfite',f:'SO3',q:-2},{name:'carbonate',f:'CO3',q:-2},{name:'chromate',f:'CrO4',q:-2},{name:'dichromate',f:'Cr2O7',q:-2},
  {name:'hydrogen phosphate',f:'HPO4',q:-2},{name:'oxalate',f:'C2O4',q:-2},{name:'peroxide',f:'O2',q:-2},{name:'thiosulfate',f:'S2O3',q:-2},
  {name:'phosphate',f:'PO4',q:-3},{name:'phosphite',f:'PO3',q:-3}];
/* Name of the ionic compound with formula units from cation and anion: ionicFormula({f:'Ca',q:2},{f:'PO4',q:-3}) → "Ca3(PO4)2" */
CL.ionicFormula=function(cat,an){const g=(a,b)=>b?g(b,a%b):a;const a=Math.abs(cat.q),b=Math.abs(an.q),d=g(a,b),nc=b/d,na=a/d;
  const poly=x=>x.f.length>2||/[A-Z].*[A-Z]/.test(x.f)||/\d/.test(x.f);const part=(x,n)=>n===1?x.f:(poly(x)&&!/^[A-Z][a-z]?$/.test(x.f)?'('+x.f+')'+n:x.f+n);
  return part(cat,nc)+part(an,na);};
/* Solubility in water by the standard rules: true = soluble, false = insoluble (precipitate). cation/anion as formula strings ('Ag','NO3'). */
CL.soluble=function(cat,an){if(['Li','Na','K','Rb','Cs','NH4'].includes(cat))return true;if(['NO3','C2H3O2','ClO4','ClO3'].includes(an))return cat!=='Ag'||an!=='C2H3O2';
  if(['Cl','Br','I'].includes(an))return !['Ag','Pb','Hg2','Cu+'].includes(cat);
  if(an==='SO4')return !['Ba','Sr','Pb','Ca','Ag','Hg2'].includes(cat);
  if(an==='OH')return ['Ba','Sr'].includes(cat);
  if(an==='S')return ['Ca','Sr','Ba'].includes(cat);
  if(['CO3','PO4','CrO4','SO3','C2O4','O'].includes(an))return false;
  return true;};
/* Activity series of metals (most reactive first). H included for acids. */
CL.activity=['Li','K','Ba','Sr','Ca','Na','Mg','Al','Mn','Zn','Cr','Fe','Cd','Co','Ni','Sn','Pb','H','Cu','Ag','Hg','Pt','Au'];
CL.moreActive=(a,b)=>CL.activity.indexOf(a)>=0&&CL.activity.indexOf(b)>=0&&CL.activity.indexOf(a)<CL.activity.indexOf(b);
/* Standard reduction potentials at 25 °C (V) */
CL.E0=[
  {half:'F₂ + 2e⁻ → 2F⁻',ox:'F2',red:'F',n:2,E:2.87},{half:'Au³⁺ + 3e⁻ → Au',ox:'Au',ion:'Au',q:3,n:3,E:1.50},{half:'Cl₂ + 2e⁻ → 2Cl⁻',ox:'Cl2',n:2,E:1.36},
  {half:'O₂ + 4H⁺ + 4e⁻ → 2H₂O',n:4,E:1.23},{half:'Br₂ + 2e⁻ → 2Br⁻',n:2,E:1.07},{half:'Ag⁺ + e⁻ → Ag',metal:'Ag',q:1,n:1,E:0.80},
  {half:'Fe³⁺ + e⁻ → Fe²⁺',n:1,E:0.77},{half:'I₂ + 2e⁻ → 2I⁻',n:2,E:0.54},{half:'Cu²⁺ + 2e⁻ → Cu',metal:'Cu',q:2,n:2,E:0.34},
  {half:'2H⁺ + 2e⁻ → H₂',metal:'H',q:1,n:2,E:0.00},{half:'Pb²⁺ + 2e⁻ → Pb',metal:'Pb',q:2,n:2,E:-0.13},{half:'Sn²⁺ + 2e⁻ → Sn',metal:'Sn',q:2,n:2,E:-0.14},
  {half:'Ni²⁺ + 2e⁻ → Ni',metal:'Ni',q:2,n:2,E:-0.25},{half:'Co²⁺ + 2e⁻ → Co',metal:'Co',q:2,n:2,E:-0.28},{half:'Fe²⁺ + 2e⁻ → Fe',metal:'Fe',q:2,n:2,E:-0.44},
  {half:'Zn²⁺ + 2e⁻ → Zn',metal:'Zn',q:2,n:2,E:-0.76},{half:'Al³⁺ + 3e⁻ → Al',metal:'Al',q:3,n:3,E:-1.66},{half:'Mg²⁺ + 2e⁻ → Mg',metal:'Mg',q:2,n:2,E:-2.37},
  {half:'Na⁺ + e⁻ → Na',metal:'Na',q:1,n:1,E:-2.71},{half:'Ca²⁺ + 2e⁻ → Ca',metal:'Ca',q:2,n:2,E:-2.87},{half:'K⁺ + e⁻ → K',metal:'K',q:1,n:1,E:-2.93},{half:'Li⁺ + e⁻ → Li',metal:'Li',q:1,n:1,E:-3.04}];
/* Weak acids at 25 °C: Ka (and pKa) */
CL.acids=[{name:'acetic acid',f:'HC2H3O2',Ka:1.8e-5},{name:'formic acid',f:'HCHO2',Ka:1.8e-4},{name:'hydrofluoric acid',f:'HF',Ka:6.8e-4},{name:'nitrous acid',f:'HNO2',Ka:4.5e-4},
  {name:'hypochlorous acid',f:'HClO',Ka:3.0e-8},{name:'hydrocyanic acid',f:'HCN',Ka:4.9e-10},{name:'benzoic acid',f:'HC7H5O2',Ka:6.3e-5},{name:'carbonic acid',f:'H2CO3',Ka:4.3e-7},
  {name:'ammonium ion',f:'NH4+',Ka:5.6e-10}];
CL.strongAcids=['HCl','HBr','HI','HNO3','H2SO4','HClO4','HClO3'];
CL.strongBases=['LiOH','NaOH','KOH','RbOH','CsOH','Ca(OH)2','Sr(OH)2','Ba(OH)2'];
/* Natural isotopes (mass number: [exact mass amu, % abundance]) */
CL.isotopes={H:{1:[1.00783,99.985],2:[2.01410,0.015]},He:{3:[3.01603,0.0001],4:[4.00260,99.9999]},Li:{6:[6.01512,7.59],7:[7.01600,92.41]},
  B:{10:[10.01294,19.9],11:[11.00931,80.1]},C:{12:[12.00000,98.93],13:[13.00335,1.07]},N:{14:[14.00307,99.636],15:[15.00011,0.364]},
  O:{16:[15.99491,99.757],17:[16.99913,0.038],18:[17.99916,0.205]},Ne:{20:[19.99244,90.48],21:[20.99385,0.27],22:[21.99139,9.25]},
  Mg:{24:[23.98504,78.99],25:[24.98584,10.00],26:[25.98259,11.01]},Si:{28:[27.97693,92.223],29:[28.97649,4.685],30:[29.97377,3.092]},
  S:{32:[31.97207,94.99],33:[32.97146,0.75],34:[33.96787,4.25],36:[35.96708,0.01]},Cl:{35:[34.96885,75.76],37:[36.96590,24.24]},
  Ar:{36:[35.96755,0.3336],38:[37.96273,0.0629],40:[39.96238,99.6035]},K:{39:[38.96371,93.258],40:[39.96400,0.0117],41:[40.96183,6.730]},
  Cu:{63:[62.92960,69.15],65:[64.92779,30.85]},Zn:{64:[63.92914,49.17],66:[65.92603,27.73],67:[66.92713,4.04],68:[67.92484,18.45],70:[69.92532,0.61]},
  Br:{79:[78.91834,50.69],81:[80.91629,49.31]},Ag:{107:[106.90509,51.839],109:[108.90476,48.161]},Rb:{85:[84.91179,72.17],87:[86.90918,27.83]},
  Sr:{84:[83.91342,0.56],86:[85.90926,9.86],87:[86.90888,7.00],88:[87.90561,82.58]},U:{234:[234.04095,0.0054],235:[235.04393,0.7204],238:[238.05079,99.2742]}};

/* ---------- drawing ---------- */
/* CPK / Jmol atom colors */
CL.CPK={H:'#ffffff',He:'#d9ffff',Li:'#cc80ff',Be:'#c2ff00',B:'#ffb5b5',C:'#5a5a5a',N:'#3050f8',O:'#ff0d0d',F:'#90e050',Ne:'#b3e3f5',Na:'#ab5cf2',Mg:'#8aff00',
  Al:'#bfa6a6',Si:'#f0c8a0',P:'#ff8000',S:'#ffff30',Cl:'#1ff01f',Ar:'#80d1e3',K:'#8f40d4',Ca:'#3dff00',Ti:'#bfc2c7',Cr:'#8a99c7',Mn:'#9c7ac7',Fe:'#e06633',
  Co:'#f090a0',Ni:'#50d050',Cu:'#c88033',Zn:'#7d80b0',Br:'#a62929',Kr:'#5cb8d1',Ag:'#c0c0c0',Sn:'#668080',I:'#940094',Xe:'#429eb0',Ba:'#00c900',Pt:'#d0d0e0',Au:'#ffd123',Hg:'#b8b8d0',Pb:'#575961'};
CL.cpk=s=>CL.CPK[s]||'#ff1493';
/* Ink color (black or white) that reads on a fill color */
CL.inkOn=hex=>{const h=hex.replace('#','');const f=h.length===3?h.split('').map(c=>c+c).join(''):h;const r=parseInt(f.slice(0,2),16),g=parseInt(f.slice(2,4),16),b=parseInt(f.slice(4,6),16);
  return (0.299*r+0.587*g+0.114*b)>150?'#111':'#fff';};
/* Shaded ball atom with its symbol. opts: {color, label (default sym), s (font px), alpha, ring} */
CL.drawAtom=function(ctx,x,y,r,sym,opts){opts=opts||{};const col=opts.color||CL.cpk(sym);ctx.save();if(opts.alpha!==undefined)ctx.globalAlpha=opts.alpha;
  const g=ctx.createRadialGradient(x-r*0.35,y-r*0.35,r*0.1,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(0.25,col);g.addColorStop(1,shade(col,-0.35));
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=Math.max(1,r*0.06);ctx.strokeStyle=shade(col,-0.5);ctx.stroke();
  if(opts.ring){ctx.lineWidth=3;ctx.strokeStyle=opts.ring;ctx.beginPath();ctx.arc(x,y,r+3,0,Math.PI*2);ctx.stroke();}
  const lab=opts.label===undefined?sym:opts.label;if(lab&&r>=7){const fs=opts.s||Math.max(10,Math.min(r*0.95,26));ctx.font='700 '+fs+'px '+(BioLab.h.FONT);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=CL.inkOn(col);ctx.fillText(lab,x,y+1);}
  ctx.restore();};
function shade(hex,amt){const h=hex.replace('#','');const f=h.length===3?h.split('').map(c=>c+c).join(''):h;let r=parseInt(f.slice(0,2),16),g=parseInt(f.slice(2,4),16),b=parseInt(f.slice(4,6),16);
  const t=amt<0?0:255,p=Math.abs(amt);r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');}
CL.shade=shade;
/* Draw a beaker outline with liquid. o: {x,y (top-left),w,h,fill (0-1),liquid color,ink,label,ticks:true} returns the liquid rect */
CL.drawBeaker=function(ctx,o){const {x,y,w,h}=o,P=BioLab.h.PAL,fill=BioLab.h.clamp(o.fill===undefined?0.6:o.fill,0,1);const ly=y+h-(h-6)*fill;
  ctx.save();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+h-8);ctx.quadraticCurveTo(x,y+h,x+8,y+h);ctx.lineTo(x+w-8,y+h);ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-8);ctx.lineTo(x+w,y);ctx.closePath();
  ctx.save();ctx.clip();ctx.fillStyle=o.liquid||P['cv-water'];ctx.fillRect(x,ly,w,y+h-ly);ctx.restore();
  ctx.lineWidth=2.5;ctx.strokeStyle=o.ink||P['cv-glass'];ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x,y);ctx.lineTo(x,y+h-8);ctx.quadraticCurveTo(x,y+h,x+8,y+h);ctx.lineTo(x+w-8,y+h);ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-8);ctx.lineTo(x+w,y);ctx.stroke();
  if(o.ticks!==false){ctx.lineWidth=1.5;for(let i=1;i<=4;i++){const ty=y+h-(h-6)*i/5;ctx.beginPath();ctx.moveTo(x+4,ty);ctx.lineTo(x+(i%2?14:22),ty);ctx.stroke();}}
  if(o.label)BioLab.h.txt(ctx,o.label,x+w/2,y+h+18,{s:o.s||13,c:P['cv-soft'],a:'center'});
  ctx.restore();return {x,y:ly,w,h:y+h-ly};};
/* Mid-tone fills that work in both themes for labeled objects (white text on top) */
CL.FILL={acid:'#c2185b',base:'#3949ab',neutral:'#2e7d32',metal:'#6d7a88',nonmetal:'#2d8a6e',noble:'#7b5ea7',halogen:'#b0781c',cation:'#3f6fb0',anion:'#c0392b',electron:'#d4a017',proton:'#c0392b',neutron:'#7f8c8d'};
CL.CAT_FILL={alkali:'#c0392b',alkaline:'#d35400',transition:'#b8860b',post:'#5d8a3a',metalloid:'#16a085',nonmetal:'#2471a3',halogen:'#7d3c98',noble:'#6c3483',lanthanide:'#a04060',actinide:'#8e5a2a'};
})();

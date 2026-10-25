/** ПРИЗНАК БЕЗ УГАДЫВАНИЯ ИМЁН.
 *  Три вещи выводятся ЧТЕНИЕМ, а не списком:
 *   1. столбцы, которые пишет человек — из схемы базы;
 *   2. словарь — местная переменная, которой присвоен объект-литерал или
 *      `KSLT_YAZYK.выбрать(...)`;
 *   3. ЭКРАН — функция, у которой КАЖДЫЙ путь выдачи обёрнут в экранирование;
 *      считается замыканием по зовам, пока список не перестанет расти. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
function всеJS(д,и){и=и||[];for(const э of fs.readdirSync(д,{withFileTypes:true})){const п=path.join(д,э.name);
 if(э.isDirectory())всеJS(п,и);else if(э.name.endsWith('.js'))и.push(path.relative(КОРЕНЬ,п).split(path.sep).join('/'));}return и;}
const схема=fs.readdirSync(path.join(КОРЕНЬ,'supabase','migrations')).filter(и=>и.endsWith('.sql'))
 .map(и=>fs.readFileSync(path.join(КОРЕНЬ,'supabase','migrations',и),'utf8')).join('\n')
 +fs.readFileSync(path.join(КОРЕНЬ,'supabase','schema.sql'),'utf8');
const ПИШЕТ=new Set();
схема.split('\n').forEach(с=>{
 const м=/["']?([a-z][a-z0-9_]*)["']?\s+["']?(?:text|character varying|varchar|citext)["']?/i.exec(с);
 if(!м)return; const имя=м[1];
 if(/\bCHECK\b/i.test(с))return;
 if(имя==='id'||/_id$/.test(имя)||/uuid/i.test(с))return;
 ПИШЕТ.add(имя);});
const БАЗА=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом','encodeURIComponent'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','KSLT_RULES','A'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
const ФУНК=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'];
function имяЗова(у){if(!у.callee)return null;if(у.callee.type==='Identifier')return у.callee.name;
 if(у.callee.type==='MemberExpression'){const об=у.callee.object,св=у.callee.property;
  const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
  return (и?и+'.':'')+(св.type==='Identifier'?св.name:'');}return null;}
function корень(x){while(x&&(x.type==='MemberExpression'||x.type==='CallExpression'))x=x.object||x.callee;return x&&x.type==='Identifier'?x.name:null;}
function обход(у,дело){ if(!у||typeof у!=='object')return;
 if(Array.isArray(у))return у.forEach(н=>обход(н,дело));
 дело(у);
 for(const к in у) if(к!=='loc'&&к!=='start'&&к!=='end') обход(у[к],дело);}

const деревья={};
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 try{деревья[ф]={т:т,д:acorn.parse(т,{ecmaVersion:2020,locations:true})};}catch(e){}});

/* ---- 2. словари: местные переменные с объектом-литералом ---- */
const словари={};
for(const ф in деревья){ const н=new Set();
 обход(деревья[ф].д,у=>{
  if(у.type==='VariableDeclarator'&&у.id.type==='Identifier'&&у.init){
   const и=у.init;
   if(и.type==='ObjectExpression') н.add(у.id.name);
   if(и.type==='CallExpression'&&(имяЗова(и)||'').indexOf('выбрать')!==-1) н.add(у.id.name);
   if(и.type==='CallExpression'&&/^get[A-Z]|Labels$/.test(имяЗова(и)||'')) н.add(у.id.name);
  }});
 словари[ф]=н;}

/* ---- 3. экраны: функции, у которых выдача обёрнута в экранирование ---- */
const экраны={};
for(const ф in деревья) экраны[ф]=new Set(БАЗА);
let росло=true, кругов=0;
while(росло&&кругов<6){ росло=false; кругов++;
 for(const ф in деревья){
  обход(деревья[ф].д,у=>{
   if(!(у.type==='FunctionDeclaration'&&у.id))return;
   const имя=у.id.name;
   if(экраны[ф].has(имя))return;
   const выдачи=[];
   (function своё(н){ if(!н||typeof н!=='object')return;
    if(Array.isArray(н))return н.forEach(своё);
    if(н!==у&&ФУНК.indexOf(н.type)!==-1)return;
    if(н.type==='ReturnStatement'&&н.argument)выдачи.push(н.argument);
    for(const к in н)if(к!=='loc'&&к!=='start'&&к!=='end')своё(н[к]);})(у.body);
   if(!выдачи.length)return;
   const доводы=new Set(у.params.filter(п=>п.type==='Identifier').map(п=>п.name));
   if(!доводы.size)return;
   /* каждый ДОВОД, попадающий в выдачу, обёрнут в экран */
   let чисто=true, встретился=false;
   выдачи.forEach(в=>обход(в,н=>{
    if(н.type==='Identifier'&&доводы.has(н.name)){ встретился=true;
     /* ищем, обёрнут ли он: поднимаемся по выдаче заново */ }}));
   if(!встретился)return;
   выдачи.forEach(в=>{ (function пров(н,подЭкраном){ if(!н||typeof н!=='object')return;
     if(Array.isArray(н))return н.forEach(x=>пров(x,подЭкраном));
     let под=подЭкраном;
     if(н.type==='CallExpression'){ const и=имяЗова(н)||'';
      const п=и.indexOf('.')!==-1?и.split('.')[1]:и;
      if(экраны[ф].has(п)||экраны[ф].has(и)||ДОМА.indexOf(корень(н))!==-1) под=true; }
     if(н.type==='Identifier'&&доводы.has(н.name)&&!под) чисто=false;
     for(const к in н)if(к!=='loc'&&к!=='start'&&к!=='end')пров(н[к],под);})(в,false);});
   if(чисто){ экраны[ф].add(имя); росло=true; }
  });}}

/* ---- находки ---- */
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}
const дыры=[];
for(const ф in деревья){ const {т,д}=деревья[ф];
 const мойЭкран=экраны[ф], мойСловарь=словари[ф];
 function чужое(у,итог){ if(!у||typeof у!=='object')return итог;
  if(Array.isArray(у)){у.forEach(н=>чужое(н,итог));return итог;}
  if(у.type==='ConditionalExpression'){чужое(у.consequent,итог);чужое(у.alternate,итог);return итог;}
  if(у.type==='LogicalExpression'&&у.operator==='&&'){чужое(у.right,итог);return итог;}
  if(у.type==='CallExpression'){const и=имяЗова(у)||'';const п=и.indexOf('.')!==-1?и.split('.')[1]:и;
   if(мойЭкран.has(п)||мойЭкран.has(и))return итог;
   if(ДОМА.indexOf(корень(у))!==-1)return итог;}
  if(у.type==='MemberExpression'&&у.property&&у.property.type==='Identifier'&&ПИШЕТ.has(у.property.name)){
   const к=корень(у);
   if(!(к&&(мойСловарь.has(к)||ДОМА.indexOf(к)!==-1))) итог.push(у);}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')чужое(у[к],итог);
  return итог;}
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп))сп.forEach(ч=>чужое(ч,[]).forEach(н=>
    дыры.push(ф+':'+н.loc.start.line+'  '+т.slice(н.start,н.end).replace(/\s+/g,' ').slice(0,42))));}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);}
const у=[...new Set(дыры)];
const публ=у.filter(с=>!с.startsWith('js/admin/'));
console.log('столбцов, которые пишет человек:',ПИШЕТ.size);
console.log('выведено экранов (кругов '+кругов+'):',Object.values(экраны).reduce((s,n)=>s+n.size,0)-БАЗА.length*Object.keys(экраны).length);
console.log('выведено словарей:',Object.values(словари).reduce((s,n)=>s+n.size,0));
console.log('ДЫР:',у.length,'| публичная часть:',публ.length,'| админка:',у.length-публ.length);
console.log('\n--- ПУБЛИЧНАЯ ЧАСТЬ ---');
публ.forEach((д,i)=>console.log(String(i+1).padStart(3)+'. '+д));

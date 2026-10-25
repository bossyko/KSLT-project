/** ЗАМЕР 159 — что лежит в голых переменных, попадающих в разметку.
 *  Признак 158 видит `t.image`, но не видит `var постер = t.image`.
 *  Здесь переменная ПРОСЛЕЖИВАЕТСЯ до присваивания внутри своей функции. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
const П=require(path.join(__dirname,'..','priznak-dannye-v-razmetke.js'));

/* столбцы, которые пишет человек — тем же чтением схемы */
const схема=fs.readdirSync(path.join(КОРЕНЬ,'supabase','migrations')).filter(и=>и.endsWith('.sql'))
 .map(и=>fs.readFileSync(path.join(КОРЕНЬ,'supabase','migrations',и),'utf8')).join('\n')
 +fs.readFileSync(path.join(КОРЕНЬ,'supabase','schema.sql'),'utf8');
const ПИШЕТ=new Set();
схема.split('\n').forEach(с=>{
 const м=/["']?([a-z_][a-z0-9_]*)["']?\s+["']?(?:text|character varying|varchar|citext)["']?/i.exec(с);
 if(!м)return; const и=м[1];
 if(/\bCHECK\b/i.test(с))return;
 if(и==='id'||/_id$/.test(и)||/uuid/i.test(с))return;
 ПИШЕТ.add(и);});

const ЭКРАНЫ=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом','encodeURIComponent'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','KSLT_RULES','KSLT_TFEATURED','A'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
const ФУНК=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'];
function имяЗова(у){if(!у.callee)return null;if(у.callee.type==='Identifier')return у.callee.name;
 if(у.callee.type==='MemberExpression'){const о=у.callee.object,с=у.callee.property;
  const и=о.type==='Identifier'?о.name:(о.type==='MemberExpression'&&о.property.type==='Identifier'?о.property.name:null);
  return (и?и+'.':'')+(с.type==='Identifier'?с.name:'');}return null;}
function корень2(x){const п=[];let н=x;
 while(н&&(н.type==='MemberExpression'||н.type==='CallExpression')){
  if(н.type==='MemberExpression'&&н.property&&н.property.type==='Identifier')п.unshift(н.property.name);
  н=н.object||н.callee;}
 if(н&&н.type==='Identifier')п.unshift(н.name);
 while(п.length>1&&(п[0]==='window'||п[0]==='globalThis'))п.shift();
 return п[0]||null;}
function обход(у,д){if(!у||typeof у!=='object')return;
 if(Array.isArray(у))return у.forEach(н=>обход(н,д));
 д(у); for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')обход(у[к],д);}
function свои(у,д){(function х(н){if(!н||typeof н!=='object')return;
 if(Array.isArray(н))return н.forEach(х);
 if(н!==у&&ФУНК.indexOf(н.type)!==-1)return;
 д(н); for(const к in н)if(к!=='loc'&&к!=='start'&&к!=='end')х(н[к]);})(у.body);}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}

/** что положили в переменную внутри этой функции: список выражений */
function источники(ф){
 const карта=new Map();
 const добавить=(и,в)=>{ if(!карта.has(и))карта.set(и,[]); карта.get(и).push(в); };
 свои(ф,н=>{
  if(н.type==='VariableDeclarator'&&н.id.type==='Identifier'&&н.init) добавить(н.id.name,н.init);
  if(н.type==='AssignmentExpression'&&н.left.type==='Identifier'){
   if(н.operator==='=') добавить(н.left.name,н.right);
   else if(н.operator==='+=') добавить(н.left.name,н.right);
  }
 });
 ф.params.forEach(п=>{ if(п.type==='Identifier') добавить(п.name,{type:'ДОВОД'}); });
 return карта;
}
/** разбор выражения: 'поле' | 'экран' | 'литерал' | 'зов' | 'довод' | 'иное' */
function чтоЭто(в,карта,глубина){
 if(!в)return 'иное';
 if(в.type==='ДОВОД')return 'довод';
 if(в.type==='Literal'||в.type==='TemplateLiteral')return 'литерал';
 if(в.type==='BinaryExpression'&&в.operator==='+'){
  const л=чтоЭто(в.left,карта,глубина),п=чтоЭто(в.right,карта,глубина);
  return л==='поле'||п==='поле'?'поле':(л==='литерал'&&п==='литерал'?'литерал':'иное');}
 if(в.type==='ConditionalExpression'||в.type==='LogicalExpression'){
  const а=чтоЭто(в.type==='LogicalExpression'?в.left:в.consequent,карта,глубина);
  const б=чтоЭто(в.type==='LogicalExpression'?в.right:в.alternate,карта,глубина);
  return а==='поле'||б==='поле'?'поле':(а==='литерал'&&б==='литерал'?'литерал':'иное');}
 if(в.type==='CallExpression'){const и=имяЗова(в)||'';
  const х=и.indexOf('.')!==-1?и.split('.')[1]:и;
  if(ЭКРАНЫ.indexOf(х)!==-1||ЭКРАНЫ.indexOf(и)!==-1)return 'экран';
  if(ДОМА.indexOf(корень2(в))!==-1)return 'экран';
  return 'зов';}
 if(в.type==='MemberExpression'){
  const св=в.property&&в.property.type==='Identifier'?в.property.name:null;
  const к=корень2(в);
  if(к&&ДОМА.indexOf(к)!==-1)return 'экран';
  if(св&&ПИШЕТ.has(св))return 'поле';
  return 'иное';}
 if(в.type==='Identifier'){
  if(глубина>4)return 'иное';
  const ист=карта.get(в.name);
  if(!ист||!ист.length)return 'иное';
  const виды=ист.map(и=>чтоЭто(и,карта,глубина+1));
  const к=виды.indexOf('поле');
  if(к!==-1){ ВИНОВНИК=ист[к]; return 'поле'; }
  if(viдыВсе(виды,'литерал'))return 'литерал';
  if(виды.indexOf('довод')!==-1)return 'довод';
  return 'иное';}
 return 'иное';}
let ВИНОВНИК=null;
function viдыВсе(с,что){return с.length>0&&с.every(э=>э===что);}

const найдено=[];
const счёт={переменных:0,поле:0,литерал:0,довод:0,зов:0,иное:0};
П.всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 const картаФункции=new Map();
 /* СКЛЕЙКА ОТНОСИТСЯ К БЛИЖАЙШЕЙ ОБЪЕМЛЮЩЕЙ ФУНКЦИИ, И ТОЛЬКО К НЕЙ.
    Иначе она считается столько раз, сколько над ней функций: прибор дал
    22966 вместо 1554. Стек держится одним проходом. */
 (function ход(у,стек,родитель){
  if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>ход(н,стек,родитель));
  let мой=стек;
  if(ФУНК.indexOf(у.type)!==-1){
   if(!картаФункции.has(у))картаФункции.set(у,источники(у));
   мой=у;
  }
  if(у.type==='BinaryExpression'&&у.operator==='+'&&
     !(родитель&&родитель.type==='BinaryExpression'&&родитель.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп)){
    const карта=мой?картаФункции.get(мой):new Map();
    сп.forEach(ч=>{
     if(ч.type!=='Identifier')return;
     счёт.переменных++;
     const вид=чтоЭто(ч,карта||new Map(),0);
     счёт[вид]=(счёт[вид]||0)+1;
     if(вид==='поле'){
      const в=ВИНОВНИК;
      const куда=в&&в.loc?(' <- '+ф.split('/').pop()+':'+в.loc.start.line+' '+т.slice(в.start,в.end).replace(/\s+/g,' ').slice(0,60)):'';
      найдено.push(ф+':'+ч.loc.start.line+'  '+ч.name+куда);
     }
    });
   }
  }
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')ход(у[к],мой,у);
 })(д,null,null);
});
const у=[...new Set(найдено)];
console.log(JSON.stringify(счёт,null,1));
console.log('\nПЕРЕМЕННАЯ, В КОТОРОЙ ЛЕЖИТ ПОЛЕ ЧЕЛОВЕКА:',у.length,'мест');
const пф={};у.forEach(с=>{const ф=с.split(':')[0];пф[ф]=(пф[ф]||0)+1;});
Object.entries(пф).sort((a,b)=>b[1]-a[1]).forEach(([ф,н])=>console.log('  '+String(н).padStart(3)+'  '+ф));
console.log('\n--- все места ---');
у.forEach((с,i)=>console.log(String(i+1).padStart(3)+'. '+с));

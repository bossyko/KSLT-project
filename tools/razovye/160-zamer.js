/** ЗАМЕР 160 — что зовущие кладут в ДОВОДЫ функций, чьи доводы идут в разметку.
 *  Признак 159 останавливается на доводе: за него отвечает зовущий. Здесь
 *  зовущие СЧИТАЮТСЯ, по файлу, и разбираются тем же признаком. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
const П=require(path.join(__dirname,'..','priznak-dannye-v-razmetke.js'));
const ФУНК=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function обход(у,д){if(!у||typeof у!=='object')return;
 if(Array.isArray(у))return у.forEach(н=>обход(н,д));
 д(у); for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')обход(у[к],д);}
function свои(у,д){(function х(н){if(!н||typeof н!=='object')return;
 if(Array.isArray(н))return н.forEach(х);
 if(н!==у&&ФУНК.indexOf(н.type)!==-1)return;
 д(н); for(const к in н)if(к!=='loc'&&к!=='start'&&к!=='end')х(н[к]);})(у.body);}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}

const итог={функций:0,доводов:0,зовов:0,зововНайдено:0,безЗовов:0};
const список=[];
П.всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 /* 1. функции с ИМЕНЕМ, у которых довод попадает в склейку с разметкой */
 const интересные=new Map();   /* имя -> Set номеров доводов */
 обход(д,у=>{
  if(!(у.type==='FunctionDeclaration'&&у.id))return;
  const доводы=у.params.map(п=>п.type==='Identifier'?п.name:null);
  if(!доводы.filter(Boolean).length)return;
  const вРазметке=new Set();
  свои(у,н=>{
   if(!(н.type==='BinaryExpression'&&н.operator==='+'))return;
   const сп=части(н);
   if(!естьРазметка(сп))return;
   сп.forEach(ч=>{ if(ч.type==='Identifier'){ const и=доводы.indexOf(ч.name); if(и!==-1)вРазметке.add(и); } });
  });
  if(вРазметке.size) интересные.set(у.id.name,вРазметке);
 });
 if(!интересные.size)return;
 itog: {
  itog2: {}
 }
 /* 2. зовы этих функций в том же файле */
 const зовы=new Map();
 обход(д,у=>{
  if(у.type!=='CallExpression'||!у.callee||у.callee.type!=='Identifier')return;
  const имя=у.callee.name;
  if(!интересные.has(имя))return;
  if(!зовы.has(имя))зовы.set(имя,[]);
  зовы.get(имя).push(у);
 });
 интересные.forEach((номера,имя)=>{
  итог.функций++; итог.доводов+=номера.size;
  const мои=зовы.get(имя)||[];
  итог.зовов+=мои.length;
  if(!мои.length){ итог.безЗовов++; список.push(ф+'  '+имя+'  доводов '+номера.size+'  ЗОВОВ В ФАЙЛЕ НЕТ'); }
  else { итог.зововНайдено++; список.push(ф+'  '+имя+'  доводов '+номера.size+'  зовов '+мои.length); }
 });
});
console.log(JSON.stringify(итог,null,1));
console.log('\n--- функции, чьи доводы идут в разметку ---');
список.sort().forEach((с,i)=>console.log(String(i+1).padStart(3)+'. '+с));

/** ЗАМЕР 161 — какие файлы СТРОГО чисты: в склейках с разметкой безопасно
 *  только названное безопасным. Белый список без имён вовсе. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
const П=require(path.join(__dirname,'..','priznak-dannye-v-razmetke.js'));
const ЭКРАНЫ=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом','encodeURIComponent'];
const СЛОВАРИ=['L','L2','SUB','labels','ТЕКСТЫ','T','LB','EMPTY','SL','texts','EMOJI_MAP','getLabels','LH','CL','ICON','L_labels'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','KSLT_RULES','KSLT_TFEATURED','KSLT_PHONE','KSLT_POINTS','A'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
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
function строго(у){if(!у)return true;
 if(у.type==='Literal'||у.type==='TemplateLiteral')return true;
 if(у.type==='BinaryExpression'&&у.operator==='+')return строго(у.left)&&строго(у.right);
 if(у.type==='BinaryExpression')return true;              /* сравнение — не подстановка */
 if(у.type==='ConditionalExpression')return строго(у.consequent)&&строго(у.alternate);
 if(у.type==='LogicalExpression')return строго(у.left)&&строго(у.right);
 if(у.type==='UnaryExpression')return строго(у.argument);
 if(у.type==='CallExpression'){const и=имяЗова(у)||'';const х=и.indexOf('.')!==-1?и.split('.')[1]:и;
  if(ЭКРАНЫ.indexOf(х)!==-1||ЭКРАНЫ.indexOf(и)!==-1)return true;
  if(ДОМА.indexOf(корень2(у))!==-1)return true;
  if(СЛОВАРИ.indexOf(и)!==-1)return true; return false;}
 if(у.type==='MemberExpression'){const к=корень2(у);
  return !!(к&&(СЛОВАРИ.indexOf(к)!==-1||ДОМА.indexOf(к)!==-1));}
 return false;}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}
const поФайлу={};let всего=0,небез=0;
П.всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 поФайлу[ф]={склеек:0,небез:0};
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп)){поФайлу[ф].склеек++;всего++;
    сп.forEach(ч=>{if(!строго(ч)){поФайлу[ф].небез++;небез++;}});}}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);
});
const со=Object.entries(поФайлу).filter(([,о])=>о.склеек>0);
const чистые=со.filter(([,о])=>о.небез===0);
console.log('файлов со склейками разметки:',со.length);
console.log('СТРОГО ЧИСТЫХ:',чистые.length,'| склеек всего:',всего,'| небезопасных частей:',небез);
console.log('\n--- строго чистые (цена запирания = 0 правок) ---');
чистые.forEach(([ф,о])=>console.log('  '+String(о.склеек).padStart(3)+' склеек  '+ф));
console.log('\n--- ближайшие к чистоте ---');
со.filter(([,о])=>о.небез>0).sort((a,b)=>a[1].небез-b[1].небез).slice(0,12)
 .forEach(([ф,о])=>console.log('  '+String(о.небез).padStart(3)+' небез  '+String(о.склеек).padStart(3)+' склеек  '+ф));

console.log('\n--- что мешает ближайшим ---');
П.всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 if(['js/account-restore.js','js/admin/core/telegram-strip.js','js/my-match-buttons.js','js/kslt-otsechka.js'].indexOf(ф)===-1)return;
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп))сп.forEach(ч=>{if(!строго(ч))
    console.log('  '+ф+':'+ч.loc.start.line+'  '+ч.type+'  '+т.slice(ч.start,ч.end).replace(/\s+/g,' ').slice(0,56));});}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);
});

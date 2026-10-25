/** ПОДСТАНОВКА В АТРИБУТЕ. Признак — ПОЛОЖЕНИЕ, а не имя поля: часть стоит
 *  в атрибуте, если литерал слева кончается на `="` или `='`. Кавычка в
 *  атрибуте даёт обработчик, поэтому атрибут — первая очередь. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
function всеJS(д,и){и=и||[];for(const э of fs.readdirSync(д,{withFileTypes:true})){const п=path.join(д,э.name);
 if(э.isDirectory())всеJS(п,и);else if(э.name.endsWith('.js'))и.push(path.relative(КОРЕНЬ,п).split(path.sep).join('/'));}return и;}
const ЭКРАНЫ=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом','encodeURIComponent'];
const СЛОВАРИ=['L','L2','SUB','labels','ТЕКСТЫ','T','LB','EMPTY','SL','texts','EMOJI_MAP','getLabels','LH','CL','ICON','L_labels'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','A'];
const ЧИСЛО=/(_id$|_count$|_participants$|_spots$|^fee_|_duration$|_per_group$|_at$|_percent$|_order$|^birth_|_day$|_month$|_year$|^sort_|_number$|_earned$|_sent$|_change$|^per_|^current_game|_wins$|_losses$|^best_of$|^ntrp|^length$|^index$)/;
function имяЗова(у){if(!у.callee)return null;if(у.callee.type==='Identifier')return у.callee.name;
 if(у.callee.type==='MemberExpression'){const об=у.callee.object,св=у.callee.property;
  const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
  return (и?и+'.':'')+(св.type==='Identifier'?св.name:'');}return null;}
function корень(x){while(x&&(x.type==='MemberExpression'||x.type==='CallExpression'))x=x.object||x.callee;return x&&x.type==='Identifier'?x.name:null;}
function безопасно(у){if(!у)return true;
 if(у.type==='Literal'||у.type==='TemplateLiteral')return true;
 if(у.type==='BinaryExpression'&&у.operator==='+')return безопасно(у.left)&&безопасно(у.right);
 if(у.type==='ConditionalExpression')return безопасно(у.consequent)&&безопасно(у.alternate);
 if(у.type==='LogicalExpression')return безопасно(у.left)&&безопасно(у.right);
 if(у.type==='UnaryExpression')return безопасно(у.argument);
 if(у.type==='CallExpression'){const имя=имяЗова(у)||'';const п=имя.indexOf('.')!==-1?имя.split('.')[1]:имя;
  if(ЭКРАНЫ.indexOf(п)!==-1||ЭКРАНЫ.indexOf(имя)!==-1)return true;
  if(ДОМА.indexOf(корень(у))!==-1)return true;
  if(СЛОВАРИ.indexOf(имя)!==-1)return true;
  return 'зов';}
 if(у.type==='MemberExpression'){const к=корень(у);
  if(к&&(СЛОВАРИ.indexOf(к)!==-1||ДОМА.indexOf(к)!==-1))return true;
  const св=у.property&&у.property.type==='Identifier'?у.property.name:null;
  if(св&&ЧИСЛО.test(св))return true;
  return false;}
 if(у.type==='Identifier')return 'перем';
 return false;}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
const ВАТРИБУТЕ=/=\s*["']$/;
const дыры=[],зовы=[],перем=[];
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   сп.forEach((ч,и)=>{
    const слева=сп[и-1];
    const хвост=слева&&слева.type==='Literal'&&typeof слева.value==='string'?слева.value
     :(слева&&слева.type==='TemplateLiteral'?слева.quasis[слева.quasis.length-1].value.raw:null);
    if(!хвост||!ВАТРИБУТЕ.test(хвост))return;
    const о=безопасно(ч);
    const м=ф+':'+ч.loc.start.line+'  '+т.slice(ч.start,ч.end).replace(/\s+/g,' ').slice(0,44);
    if(о===false)дыры.push(м);else if(о==='зов')зовы.push(м);else if(о==='перем')перем.push(м);});}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);
});
const пф=о=>{const m={};о.forEach(с=>{const ф=с.split(':')[0];m[ф]=(m[ф]||0)+1;});return m;};
console.log('В АТРИБУТЕ, чтение поля не из словаря:',дыры.length,'в',Object.keys(пф(дыры)).length,'файлах');
console.log('в атрибуте, зов своей функции:',зовы.length,'| голая переменная:',перем.length);
console.log('\n--- по файлам ---');
console.log(Object.entries(пф(дыры)).sort((a,b)=>b[1]-a[1]).map(([ф,н])=>'  '+String(н).padStart(3)+'  '+ф).join('\n'));
console.log('\n--- все места ---');
[...new Set(дыры)].forEach((д,i)=>console.log(String(i+1).padStart(3)+'. '+д));

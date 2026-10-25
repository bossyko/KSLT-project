/** ПОЛЯ, КОТОРЫЕ ПИШЕТ НЕ АДМИН, — в разметке без экранирования.
 *  Список полей взят из политик записи базы, а не из головы:
 *  profiles / challenges / tournament_registrations / discount_vouchers /
 *  loyalty_transactions — единственные таблицы с текстом, куда пишет игрок. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
function всеJS(д,и){и=и||[];for(const э of fs.readdirSync(д,{withFileTypes:true})){const п=path.join(д,э.name);
 if(э.isDirectory())всеJS(п,и);else if(э.name.endsWith('.js'))и.push(path.relative(КОРЕНЬ,п).split(path.sep).join('/'));}return и;}
const ЧУЖИЕ=['full_name','avatar_url','instagram','telegram','telegram_username','play_level',
 'preferred_time','whatsapp_phone','proposed_venue','message','counter_venue','battle_title',
 'banner_url','score_draft','external_name','partner_external_name','external_country',
 'player_name','entity_name','service_name','note','phone','email'];
const ЭКРАНЫ=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','A'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function имяЗова(у){if(!у.callee)return null;if(у.callee.type==='Identifier')return у.callee.name;
 if(у.callee.type==='MemberExpression'){const об=у.callee.object,св=у.callee.property;
  const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
  return (и?и+'.':'')+(св.type==='Identifier'?св.name:'');}return null;}
function корень(x){while(x&&(x.type==='MemberExpression'||x.type==='CallExpression'))x=x.object||x.callee;return x&&x.type==='Identifier'?x.name:null;}
/** ищем ЧТЕНИЕ чужого поля, не завёрнутое в экранирование/дом */
function чужиеВнутри(у,итог){ if(!у||typeof у!=='object')return итог;
 if(Array.isArray(у)){у.forEach(н=>чужиеВнутри(н,итог));return итог;}
 /* ПРОВЕРКА НА ПУСТОТУ — НЕ ПОДСТАНОВКА. Считается то, что попадает в
    строку: ветки вывода. Условие `x ? …` само в разметку не идёт. */
 if(у.type==='ConditionalExpression'){чужиеВнутри(у.consequent,итог);чужиеВнутри(у.alternate,итог);return итог;}
 if(у.type==='LogicalExpression'&&у.operator==='&&'){чужиеВнутри(у.right,итог);return итог;}
 if(у.type==='CallExpression'){const имя=имяЗова(у)||'';const п=имя.indexOf('.')!==-1?имя.split('.')[1]:имя;
  if(ЭКРАНЫ.indexOf(п)!==-1||ЭКРАНЫ.indexOf(имя)!==-1)return итог;
  if(ДОМА.indexOf(корень(у))!==-1)return итог;}
 if(у.type==='MemberExpression'&&у.property&&у.property.type==='Identifier'&&ЧУЖИЕ.indexOf(у.property.name)!==-1)
  итог.push(у);
 for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')чужиеВнутри(у[к],итог);
 return итог;}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}
const дыры=[];
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп))сп.forEach(ч=>чужиеВнутри(ч,[]).forEach(н=>
    дыры.push(ф+':'+н.loc.start.line+'  '+т.slice(н.start,н.end).replace(/\s+/g,' ').slice(0,46))));}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);
});
const пф={};дыры.forEach(д=>{const ф=д.split(':')[0];пф[ф]=(пф[ф]||0)+1;});
console.log('ЧУЖОЕ ПОЛЕ В РАЗМЕТКЕ БЕЗ ЭКРАНИРОВАНИЯ:',дыры.length,'в',Object.keys(пф).length,'файлах\n');
Object.entries(пф).sort((a,b)=>b[1]-a[1]).forEach(([ф,н])=>console.log('  '+String(н).padStart(3)+'  '+ф));
console.log('\n--- все места ---');
dedup=[...new Set(дыры)];dedup.forEach((д,i)=>console.log(String(i+1).padStart(3)+'. '+д));

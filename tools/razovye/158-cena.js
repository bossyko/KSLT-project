/** ЦЕНА ТРЁХ ВАРИАНТОВ — считается ДО правки файла, одним прогоном. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
function всеJS(д,и){и=и||[];for(const э of fs.readdirSync(д,{withFileTypes:true})){const п=path.join(д,э.name);
 if(э.isDirectory())всеJS(п,и);else if(э.name.endsWith('.js'))и.push(path.relative(КОРЕНЬ,п).split(path.sep).join('/'));}return и;}
const ЭКРАНЫ=['KSLT_экранировать','esc','escH','escUsrHtml','dbEsc','escHtml','экр','текстом'];
const СЛОВАРИ=['L','L2','SUB','labels','ТЕКСТЫ','T','LB','EMPTY','SL','texts','EMOJI_MAP','getLabels','LH','CL','ICON','L_labels'];
const ДОМА=['KSLT_LICO','KSLT_SLOY','KSLT_VAUCHER','KSLT_MESTA','KSLT_STATUS','KSLT_TBLOCK','KSLT_SLOTS','KSLT_LENTA','KSLT_VIDEO','KSLT_KARTA','KSLT_OTSECHKA','KSLT_CONTACT_ICONS','KSLT_YAZYK','A'];
const РАЗМЕТКА=/<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function имяЗова(у){if(!у.callee)return null;if(у.callee.type==='Identifier')return у.callee.name;
 if(у.callee.type==='MemberExpression'){const об=у.callee.object,св=у.callee.property;
  const и=об.type==='Identifier'?об.name:(об.type==='MemberExpression'&&об.property.type==='Identifier'?об.property.name:null);
  return (и?и+'.':'')+(св.type==='Identifier'?св.name:'');}return null;}
function корень(x){while(x&&(x.type==='MemberExpression'||x.type==='CallExpression'))x=x.object||x.callee;return x&&x.type==='Identifier'?x.name:null;}
function строго(у){if(!у)return true;
 if(у.type==='Literal'||у.type==='TemplateLiteral')return true;
 if(у.type==='BinaryExpression'&&у.operator==='+')return строго(у.left)&&строго(у.right);
 if(у.type==='ConditionalExpression')return строго(у.consequent)&&строго(у.alternate);
 if(у.type==='LogicalExpression')return строго(у.left)&&строго(у.right);
 if(у.type==='UnaryExpression')return строго(у.argument);
 if(у.type==='CallExpression'){const имя=имяЗова(у)||'';const п=имя.indexOf('.')!==-1?имя.split('.')[1]:имя;
  if(ЭКРАНЫ.indexOf(п)!==-1||ЭКРАНЫ.indexOf(имя)!==-1)return true;
  if(ДОМА.indexOf(корень(у))!==-1)return true; if(СЛОВАРИ.indexOf(имя)!==-1)return true; return false;}
 if(у.type==='MemberExpression'){const к=корень(у);return !!(к&&(СЛОВАРИ.indexOf(к)!==-1||ДОМА.indexOf(к)!==-1));}
 return false;}
function части(у,и){и=и||[];if(у.type==='BinaryExpression'&&у.operator==='+'){части(у.left,и);части(у.right,и);}else и.push(у);return и;}
function естьРазметка(с){return с.some(ч=>(ч.type==='Literal'&&typeof ч.value==='string'&&РАЗМЕТКА.test(ч.value))||(ч.type==='TemplateLiteral'&&ч.quasis.some(q=>РАЗМЕТКА.test(q.value.raw))));}

const поФайлу={}; let всегоСклеек=0, всегоНебезопасных=0;
всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 поФайлу[ф]={склеек:0,небезопасных:0};
 (function х(у,р){if(!у||typeof у!=='object')return;
  if(Array.isArray(у))return у.forEach(н=>х(н,р));
  if(у.type==='BinaryExpression'&&у.operator==='+'&&!(р&&р.type==='BinaryExpression'&&р.operator==='+')){
   const сп=части(у);
   if(естьРазметка(сп)){поФайлу[ф].склеек++;всегоСклеек++;
    сп.forEach(ч=>{if(!строго(ч)){поФайлу[ф].небезопасных++;всегоНебезопасных++;}});}}
  for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')х(у[к],у);})(д,null);
});
const файлы=Object.entries(поФайлу).filter(([,о])=>о.склеек>0);
const чистые=файлы.filter(([,о])=>о.небезопасных===0);
console.log('файлов со склейками разметки:',файлы.length);
console.log('из них СТРОГО ЧИСТЫХ уже сейчас:',чистые.length,'— их можно запереть бесплатно');
console.log('склеек всего:',всегоСклеек,'| небезопасных частей по строгому признаку:',всегоНебезопасных);
console.log('\n--- чистые файлы (цена запирания = 0 правок) ---');
console.log(чистые.map(([ф,о])=>'  '+String(о.склеек).padStart(3)+' склеек  '+ф).join('\n'));
console.log('\n--- грязные, по возрастанию цены ---');
console.log(файлы.filter(([,о])=>о.небезопасных>0).sort((a,b)=>a[1].небезопасных-b[1].небезопасных)
 .map(([ф,о])=>'  '+String(о.небезопасных).padStart(4)+'  '+ф).join('\n'));

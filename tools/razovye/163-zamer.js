/** ЗАМЕР 163 — все копии понятия «отсчёт до старта».
 *  Признак: тело, где из разницы во времени считаются сутки/часы/минуты/секунды
 *  (деление на 86400000 или 1000*60*60*24), либо секундный setInterval по узлам
 *  с data-cd-date. Имена не угадываются. */
const fs=require('fs'),path=require('path');
const acorn=require(path.join(__dirname,'..','..','node_modules','acorn'));
const КОРЕНЬ=path.join(__dirname,'..','..');
const П=require(path.join(__dirname,'..','priznak-dannye-v-razmetke.js'));
const ФУНК=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'];
function обход(у,д){if(!у||typeof у!=='object')return;
 if(Array.isArray(у))return у.forEach(н=>обход(н,д));
 д(у); for(const к in у)if(к!=='loc'&&к!=='start'&&к!=='end')обход(у[к],д);}
const СУТКИ=/86400000|1000\s*\*\s*60\s*\*\s*60\s*\*\s*24/;
const ТИК=/setInterval\s*\(/;
const УЗЕЛ=/data-cd-date/;
const итог=[];
П.всеJS(path.join(КОРЕНЬ,'js')).forEach(ф=>{
 const т=fs.readFileSync(path.join(КОРЕНЬ,ф),'utf8');
 let д;try{д=acorn.parse(т,{ecmaVersion:2020,locations:true});}catch(e){return;}
 обход(д,у=>{
  if(ФУНК.indexOf(у.type)===-1)return;
  const тело=т.slice(у.start,у.end);
  const имя=(у.id&&у.id.name)||'(без имени)';
  const строк=тело.split('\n').length;
  const разметка=СУТКИ.test(тело)&&/<span|<div/.test(тело);
  const тик=ТИК.test(тело)&&УЗЕЛ.test(тело);
  const обновляет=СУТКИ.test(тело)&&/innerHTML|classList/.test(тело)&&!/return '</.test(тело);
  if(разметка||тик||обновляет)
   итог.push({ф:ф,имя:имя,строка:у.loc.start.line,строк:строк,
    вид:(разметка?'разметка ':'')+(обновляет?'обновление ':'')+(тик?'тикер':'')});
 });
});
/* САМАЯ ВНЕШНЯЯ ФУНКЦИЯ — ЭТО ОБЁРТКА ФАЙЛА (беда куска 156, повторённая
   здесь заново): фильтр по «самым внешним» давал десять копий по 700-6700
   строк — то есть сами файлы. Берём самые ВНУТРЕННИЕ подходящие тела. */
const внешние=итог.filter(a=>!итог.some(b=>b!==a&&b.ф===a.ф&&
    b.строка>=a.строка&&(b.строка+b.строк)<=(a.строка+a.строк)&&b.строк<a.строк));
console.log('копий понятия «отсчёт»:',внешние.length,'в',new Set(внешние.map(x=>x.ф)).size,'файлах');
console.log('строк всего:',внешние.reduce((s,x)=>s+x.строк,0));
console.log();
внешние.sort((a,b)=>a.ф.localeCompare(b.ф)).forEach(x=>
 console.log('  %-30s %-20s стр %-6s %3d строк  %s'.replace('%-30s',x.ф.split('/').pop().padEnd(30)).replace('%-20s',x.имя.padEnd(20)).replace('%-6s',String(x.строка).padEnd(6)).replace('%3d',String(x.строк).padStart(3)).replace('%s',x.вид)));

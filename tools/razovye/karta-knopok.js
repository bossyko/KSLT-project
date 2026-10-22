/* КАРТА КНОПОК: тело обработчика берётся РАЗБОРОМ СКОБОК, а не окном.
   ОКНО ИЗ ЗНАКОВ — НЕ ТЕЛО ОБРАБОТЧИКА. */
const fs=require('fs'),path=require('path');
const {маска}=require('/sessions/rcw-01eqzz2ogg7gqcbobq7hmbdn/mnt/KSLT/tools/razovye/maska.js');
function файлы(д){let r=[];for(const и of fs.readdirSync(д)){const п=path.join(д,и);
  const s=fs.statSync(п); if(s.isDirectory())r=r.concat(файлы(п)); else if(и.endsWith('.js'))r.push(п);}return r;}
/* ПРИЗНАК ЗАПИСИ — УЗКИЙ. Широкий `remove(` ловил `overlay.remove()`,
   то есть закрытие окна, и записывал в «пишущие» все кнопки «Отмена» и
   «Закрыть». ПРИЗНАК, НАПИСАННЫЙ ШИРОКО, ЛОВИТ НЕ ТО.
   Хранилище узнаётся по своему входу `storage.from(...)`. */
const ПИШЕТ=/\.(insert|update|delete|upsert)\s*\(|\.rpc\s*\(|storage\.from\([^)]*\)\s*\.\s*(upload|remove)\s*\(/;
const ФАЙЛЫ=файлы('js/admin');
function парная(m,от,о,з){let г=0;for(let i=от;i<m.length;i++){if(m[i]===о)г++;else if(m[i]===з){г--;if(!г)return i;}}return -1;}

/* 1. тела всех функций */
const тела={};
for(const ф of ФАЙЛЫ){
  const t=fs.readFileSync(ф,'utf8'), m=маска(t);
  const обр=/(?:async\s+)?function\s+([\wЀ-ӿ$]+)\s*\(/g; let мм;
  while((мм=обр.exec(m))){
    const о=m.indexOf('{',мм.index+мм[0].length-1); if(о===-1)continue;
    const з=парная(m,о,'{','}'); if(з===-1)continue;
    тела[мм[1]]=t.slice(о,з+1);
  }
}
const пишетФ={};
for(const и in тела) пишетФ[и]=ПИШЕТ.test(тела[и]);
for(let к=0;к<4;к++) for(const и in тела) if(!пишетФ[и])
  for(const д in пишетФ) if(пишетФ[д]&&д!==и&&new RegExp('\\b'+д.replace(/\$/g,'\\$')+'\\s*\\(').test(тела[и])){пишетФ[и]=true;break;}

/* 2. обработчики клика: тело разбором скобок */
const кнопки=[];
for(const ф of ФАЙЛЫ){
  const t=fs.readFileSync(ф,'utf8'), m=маска(t);
  const обр=/getElementById\(\s*['"]([\w-]+)['"]\s*\)\s*\??\.\s*addEventListener\(\s*'click'\s*,/g;
  let мм;
  /* ИМЯ ИЩЕТСЯ В СЫРОМ ТЕКСТЕ: в маске строки погашены, и `'adTrnSave'`
     превращается в пробелы. Скобки считаются по МАСКЕ — длины совпадают
     знак в знак, поэтому позиции общие. */
  while((мм=обр.exec(t))){
    const послеЗапятой=мм.index+мм[0].length;
    const о=m.indexOf('{',послеЗапятой);
    if(о===-1||о-послеЗапятой>80){ кнопки.push({ф,ид:мм[1],тело:'',ссылка:true}); continue; }
    const з=парная(m,о,'{','}'); if(з===-1)continue;
    кнопки.push({ф,ид:мм[1],тело:t.slice(о,з+1)});
  }
}
/* ТРАНЗИТИВНОЕ ЗАМЫКАНИЕ БЕЗ ГРАНИЦЫ КРАСИТ ВЕСЬ ГРАФ: почти всякая
   кнопка зовёт перерисовку, а перерисовка где-то в глубине пишет. Такой
   список запрещает и «Назад», то есть не говорит ничего.
   Поэтому ДВА списка:
     ПРЯМО  — запись стоит в теле самого обработчика;
     ЧЕРЕЗ ОДНУ — обработчик зовёт функцию, которая пишет САМА. */
кнопки.forEach(к=>{
  if(!к.тело){к.пишет=null;return;}
  к.прямо = ПИШЕТ.test(к.тело);
  к.через = !к.прямо && Object.keys(тела).some(д=>
    ПИШЕТ.test(тела[д]) && new RegExp('\\b'+д.replace(/\$/g,'\\$')+'\\s*\\(').test(к.тело));
  к.пишет = к.прямо || к.через;
});
const прямо=кнопки.filter(к=>к.прямо);
const через=кнопки.filter(к=>к.через);
const пишут=кнопки.filter(к=>к.пишет===true);
const читают=кнопки.filter(к=>к.пишет===false);
const неясно=кнопки.filter(к=>к.пишет===null);
console.log('КНОПОК С ОБРАБОТЧИКОМ КЛИКА:',кнопки.length);
console.log('  ПИШУТ В БАЗУ:',пишут.length);
console.log('  только читают:',читают.length);
console.log('  не разобрано (обработчик именем):',неясно.length, неясно.map(к=>к.ид).slice(0,8).join(', '));
console.log('\n  ПРЯМО ПИШУТ (запись в теле обработчика):',прямо.length);
const поП={};прямо.forEach(к=>(поП[к.ф]=поП[к.ф]||[]).push(к.ид));
Object.entries(поП).sort((a,b)=>b[1].length-a[1].length).forEach(([ф,сп])=>
  console.log('    '+ф.replace('js/admin/','').padEnd(26)+сп.join(', ')));
console.log('\n  ЧЕРЕЗ ОДНУ (зовут пишущую функцию):',через.length);
console.log('\nПИШУЩИЕ — НЕ НАЖИМАТЬ:');
const поФ={};пишут.forEach(к=>(поФ[к.ф]=поФ[к.ф]||[]).push(к.ид));
Object.entries(поФ).sort((a,b)=>b[1].length-a[1].length).forEach(([ф,сп])=>
  console.log('  '+ф.replace('js/admin/','').padEnd(28)+сп.join(', ')));

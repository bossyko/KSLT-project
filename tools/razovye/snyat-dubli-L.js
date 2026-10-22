/* Снять РАННИЕ половины повторённых ключей словаря L админки.
   В литерале объекта поздняя запись перетирает раннюю — ранняя
   недостижима НИКАКИМ путём, ни именем, ни склейкой `L['x'+y]`.
   Поэтому снятие не требует знания о зовах.
   Прибор мерит ДО среза и отказывается писать при расхождении.
   Маска общая (`maska.js`) и знает регулярные литералы. */
const fs=require('fs');
const ПИСАТЬ=process.argv.includes('--писать');
const { маска } = require('./maska.js');
function парная(m,от){let г=0;for(let i=от;i<m.length;i++){if(m[i]==='{')г++;else if(m[i]==='}'){г--;if(!г)return i;}}return -1;}
const ф='js/admin/core/constants.js';
const t=fs.readFileSync(ф,'utf8'), m=маска(t);
const н=m.indexOf('var L ='); const о=m.indexOf('{',н), з=парная(m,о);
/* собрать записи верхнего уровня: имя + границы всей записи `имя: значение,` */
const записи=[]; let г=0;
for(let i=о;i<=з;i++){
  const c=m[i];
  if(c==='{'||c==='[')г++; else if(c==='}'||c===']')г--;
  if(г===1){
    const мм=/^[\s,]*([A-Za-z_$][\w$]*)\s*:/.exec(m.slice(i));
    if(мм){
      const имяОт=i+мм[0].length-мм[1].length-(/\s*:$/.exec(мм[0])[0].length)-0;
      /* начало записи — первый непробельный знак имени */
      const от=i+(/^[\s,]*/.exec(мм[0])[0].length);
      /* конец записи — запятая того же уровня или закрывающая скобка */
      let j=i+мм[0].length, гг=0;
      for(;j<=з;j++){const d=m[j];
        if('{(['.includes(d))гг++; else if('})]'.includes(d)){if(гг===0)break; гг--;}
        else if(d===','&&гг===0){j++;break;}}
      записи.push({имя:мм[1],от,до:j,строка:t.slice(0,от).split('\n').length});
      i=i+мм[0].length-1;
    }
  }
}
const счёт={}; записи.forEach(з2=>(счёт[з2.имя]=счёт[з2.имя]||[]).push(з2));
const ранние=Object.entries(счёт).filter(([,с])=>с.length>1).map(([,с])=>с.slice(0,-1)).flat();
console.log('записей верхнего уровня:',записи.length);
console.log('повторённых имён:',Object.values(счёт).filter(с=>с.length>1).length);
console.log('РАННИХ ПОЛОВИН К СНЯТИЮ:',ранние.length,'\n');
ранние.forEach(р=>console.log('  '+String(р.строка).padStart(5)+'  '+JSON.stringify(t.slice(р.от,р.до).trim())));
if(!ПИСАТЬ){console.log('\n  сухой прогон — ничего не записано\n');process.exit(0);}
let out=t;
ранние.slice().sort((a,b)=>b.от-a.от).forEach(р=>{
  /* снять запись вместе с её строкой, если на строке больше ничего нет */
  let a=р.от,b=р.до;
  const началоСтроки=out.lastIndexOf('\n',a-1)+1;
  if(!out.slice(началоСтроки,a).trim()){a=началоСтроки;
    const конецСтроки=out.indexOf('\n',b);
    if(конецСтроки!==-1&&!out.slice(b,конецСтроки).trim()) b=конецСтроки+1;}
  out=out.slice(0,a)+out.slice(b);
});
/* ПРОВЕРКА ДО ЗАПИСИ */
const m2=маска(out); const н2=m2.indexOf('var L ='); const о2=m2.indexOf('{',н2), з22=парная(m2,о2);
if(з22===-1){console.log('\n  ОТКАЗ ПИСАТЬ: словарь перестал быть целым');process.exit(1);}
const снятоСтрок=t.split('\n').length-out.split('\n').length;
if(снятоСтрок!==ранние.length){console.log('\n  ОТКАЗ ПИСАТЬ: снято строк '+снятоСтрок+', а записей '+ранние.length);process.exit(1);}
fs.writeFileSync(ф,out);
console.log('\n  снято '+ранние.length+' записей, '+снятоСтрок+' строк\n');

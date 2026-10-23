/* ДОКАЗАТЕЛЬСТВО: каждая замена несёт ТЕ ЖЕ три ветви в том же порядке.
   Разбираем получившийся код парсером и сверяем доводы зова с тем, что
   стояло в тернарнике. Текст ветви сравнивается ЗНАК В ЗНАК. */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const сверка = JSON.parse(fs.readFileSync('/tmp/137-сверка.json', 'utf8'));

function обойти(у, дело) {
  if (!у || typeof у.type !== 'string') return;
  дело(у);
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, дело));
    else if (v && typeof v.type === 'string') обойти(v, дело);
  }
}
const поФайлам = {};
сверка.forEach(с => { (поФайлам[с.ф] = поФайлам[с.ф] || []).push(с); });

let сошлось = 0; const беды = []; const лишние = [];
Object.keys(поФайлам).forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  const зовы = [];
  обойти(д, у => {
    if (у.type !== 'CallExpression' || !у.callee) return;
    if (т.slice(у.callee.start, у.callee.end) !== 'KSLT_YAZYK.выбрать') return;
    зовы.push(у);
  });
  const ждём = поФайлам[ф];
  /* сверяем по набору, а не по порядку: строки файла сместились */
  const осталось = ждём.slice();
  зовы.forEach(з => {
    if (з.arguments.length !== 3) {
      беды.push(path.basename(ф) + ':' + з.loc.start.line + ' доводов ' + з.arguments.length + ', а не 3');
      return;
    }
    const [a, b, c] = з.arguments.map(x => т.slice(x.start, x.end));
    const i = осталось.findIndex(о => о.en === a && о.kg === b && о.ru === c);
    if (i === -1) {
      /* ЗОВ, ЗАВЕДЁННЫЙ РАНЬШЕ, — НЕ РАСХОЖДЕНИЕ. Кусок 133 уже перевёл
         сюда два места: ссылку «Все турниры» и адрес «назад». Сверялка о
         них не знала и объявила бедой чужую работу. */
      лишние.push(path.basename(ф) + ':' + з.loc.start.line);
    } else { осталось.splice(i, 1); сошлось++; }
  });
  осталось.forEach(о => беды.push(path.basename(ф) + ':' + о.стр + ' замена не найдена на месте'));
});
console.log(JSON.stringify({ 'замен проверено': сверка.length,
  'ветви совпали ЗНАК В ЗНАК и по порядку': сошлось,
  'расходятся': беды.length,
  'зовы, заведённые прежними кусками': лишние.length }, null, 1));
лишние.forEach(л => console.log('  (прежний зов: ' + л + ')'));
беды.slice(0, 8).forEach(б => console.log('  x ' + б));
if (беды.length) process.exit(1);

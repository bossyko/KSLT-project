/* РАЗОВЫЙ ПРИБОР куска 138, шаг 2 — ПРОСТЫЕ ТЕКСТЫ.
   Пара `isEn ? 'Text' : 'Текст'` превращается в тройной зов с кыргызским
   из таблицы /tmp/138-teksty.json. Текста нет в таблице — прибор ПАДАЕТ,
   а не пропускает: ПРИБОР СО ЗНАЧЕНИЕМ ПО УМОЛЧАНИЮ МОЛЧА ПРОПУСКАЕТ
   НЕИЗВЕСТНОЕ (кусок 135). */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const ТАБЛИЦА = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/138-teksty.json', 'utf8'));
const файлы = [];
(function обход(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/^node_modules$/.test(э.name)) обход(п); }
    else if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');
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
let заменено = 0;
const безПеревода = [];
файлы.forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  const т = fs.readFileSync(полный, 'utf8');
  let д;
  try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }
  const правки = [];
  обойти(д, у => {
    if (у.type !== 'ConditionalExpression') return;
    if (т.slice(у.test.start, у.test.end).trim() !== 'isEn') return;
    if (у.alternate.type === 'ConditionalExpression') return;
    const en = у.consequent, ru = у.alternate;
    if (en.type !== 'Literal' || ru.type !== 'Literal') return;
    if (typeof en.value !== 'string' || typeof ru.value !== 'string') return;
    if (!/[А-Яа-яЁё]/.test(ru.value)) return;          /* не текст, а код */
    if (!Object.prototype.hasOwnProperty.call(ТАБЛИЦА, ru.value)) {
      безПеревода.push(ф + ':' + у.loc.start.line + '  ' + JSON.stringify(ru.value));
      return;
    }
    const кг = ТАБЛИЦА[ru.value];
    правки.push([у, 'KSLT_YAZYK.выбрать(' + т.slice(en.start, en.end) + ', ' +
                 JSON.stringify(кг) + ', ' + т.slice(ru.start, ru.end) + ')']);
  });
  if (!правки.length) return;
  let н = т;
  правки.sort((a, b) => b[0].start - a[0].start).forEach(([у, текст]) => {
    н = н.slice(0, у.start) + текст + н.slice(у.end);
    заменено++;
  });
  acorn.parse(н, { ecmaVersion: 2020 });
  fs.writeFileSync(полный, н, 'utf8');
  console.log('  ' + ф + '  ' + правки.length);
});
console.log('заменено: ' + заменено);
if (безПеревода.length) {
  console.error('БЕЗ ПЕРЕВОДА В ТАБЛИЦЕ: ' + безПеревода.length);
  безПеревода.forEach(с => console.error('  ' + с));
  process.exit(1);
}

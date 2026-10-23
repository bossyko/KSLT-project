/* РАЗОВЫЙ ПРИБОР куска 138: ВСТАВИТЬ КЫРГЫЗСКУЮ ВЕТВЬ В СЛОВАРЬ.
 *   node tools/razovye/138-slovar-vstavit.js <файл> <строка> <перевод.json>
 *
 * Пара `isEn ? {en} : {ru}` становится `KSLT_YAZYK.выбрать({en}, {kg}, {ru})`.
 * Кыргызская ветвь собирается ПО КЛЮЧАМ РУССКОЙ, в том же порядке:
 *   · есть перевод — берётся он;
 *   · значение не литерал (вычисление, вызов) — переносится ЗНАК В ЗНАК;
 *   · перевода нет — ПРИБОР ПАДАЕТ и называет ключи. Молчаливого отката к
 *     русскому нет: именно так кыргызский и стал русским.
 */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const [ф, стр, таблица] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
const ПЕР = JSON.parse(fs.readFileSync(таблица, 'utf8'));
const полный = path.join(__dirname, '..', '..', ф);
const т = fs.readFileSync(полный, 'utf8');
const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
let цель = null;
(function обойти(у) {
  if (!у || typeof у.type !== 'string' || цель) return;
  if (у.type === 'ConditionalExpression' && у.loc.start.line === стр &&
      т.slice(у.test.start, у.test.end).trim() === 'isEn') { цель = у; return; }
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x));
    else if (v && typeof v.type === 'string') обойти(v);
  }
})(д);
if (!цель) { console.error('пара isEn на строке ' + стр + ' не найдена'); process.exit(1); }
const ru = цель.alternate;
if (ru.type !== 'ObjectExpression') { console.error('русская ветвь не объект'); process.exit(1); }

const нет = [];
const строки = ru.properties.map(p => {
  const имя = p.key.name || p.key.value;
  const ключ = p.key.type === 'Identifier' ? имя : JSON.stringify(имя);
  if (p.value.type !== 'Literal' || typeof p.value.value !== 'string') {
    return '        ' + ключ + ': ' + т.slice(p.value.start, p.value.end);
  }
  if (!Object.prototype.hasOwnProperty.call(ПЕР, имя)) { нет.push(имя); return null; }
  return '        ' + ключ + ': ' + JSON.stringify(ПЕР[имя]);
});
if (нет.length) {
  console.error('НЕТ ПЕРЕВОДА для ' + нет.length + ' ключей: ' + нет.join(', '));
  process.exit(1);
}
const кг = '{\n' + строки.join(',\n') + '\n    }';
const новое = 'KSLT_YAZYK.выбрать(' + т.slice(цель.consequent.start, цель.consequent.end) +
              ', ' + кг + ', ' + т.slice(ru.start, ru.end) + ')';
const н = т.slice(0, цель.start) + новое + т.slice(цель.end);
acorn.parse(н, { ecmaVersion: 2020 });
fs.writeFileSync(полный, н, 'utf8');
console.log(ф + ':' + стр + ' — кыргызская ветвь вставлена, ключей ' + ru.properties.length);

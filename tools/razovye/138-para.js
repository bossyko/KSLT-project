/* РАЗОВЫЙ ПРИБОР куска 138: одна пара `isEn ? A : B` → тройной зов.
 *   node tools/razovye/138-para.js <файл> <строка> '<код кыргызской ветви>'
 * Довод `=ru` означает «кыргызская ветвь совпадает с русской ЗНАК В ЗНАК» —
 * так бывает законно: сокращения месяцев в кыргызском те же кириллические,
 * и порядок даты тот же (число, потом месяц). Совпадение при этом СКАЗАНО
 * ВСЛУХ, а не оставлено парой, в которой не видно, забыт язык или нет.
 */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const [ф, стр, кг] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
const полный = path.join(__dirname, '..', '..', ф);
const т = fs.readFileSync(полный, 'utf8');
const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
let цель = null;
(function обойти(у) {
  if (!у || typeof у.type !== 'string' || цель) return;
  if (у.type === 'ConditionalExpression' && у.loc.start.line === стр &&
      т.slice(у.test.start, у.test.end).trim() === 'isEn' &&
      у.alternate.type !== 'ConditionalExpression') { цель = у; return; }
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x));
    else if (v && typeof v.type === 'string') обойти(v);
  }
})(д);
if (!цель) { console.error('пара на строке ' + стр + ' не найдена в ' + ф); process.exit(1); }
const en = т.slice(цель.consequent.start, цель.consequent.end);
const ru = т.slice(цель.alternate.start, цель.alternate.end);
const ветвь = кг === '=ru' ? ru : кг;
const новое = 'KSLT_YAZYK.выбрать(' + en + ', ' + ветвь + ', ' + ru + ')';
const н = т.slice(0, цель.start) + новое + т.slice(цель.end);
acorn.parse(н, { ecmaVersion: 2020 });
fs.writeFileSync(полный, н, 'utf8');
console.log('  ' + ф + ':' + стр + ' — тройной зов' + (кг === '=ru' ? ' (кыргызская = русская, сказано вслух)' : ''));

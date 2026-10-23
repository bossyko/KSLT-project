/* РАЗОВЫЙ ПРИБОР куска 138: СХЛОПНУТЬ `isKg ? X : …` В ОДИН ЗОВ.
 *
 * ЧТО СЛУЧИЛОСЬ. Я померил «пары `isEn ? en : ru`, где кыргызский падает
 * в русскую ветвь» — и НЕ ПОСМОТРЕЛ НА РОДИТЕЛЯ. У 29 из них родитель был
 * `isKg ? <кыргызский> : (…)`: кыргызский стоял ОДНИМ УРОВНЕМ ВЫШЕ, и его
 * словари полны — 361 ключ в кабинете, 48 во входе, 27 в ваучере, 8 в
 * сравнении, ноль пропусков. Мои вставки оказались НЕДОСТИЖИМЫ: второе
 * определение того же понятия.
 *
 * ПРАВИЛО ЦЕНОЙ ЭТОЙ ОШИБКИ: СМОТРИ НА РОДИТЕЛЯ, А НЕ ТОЛЬКО НА УЗЕЛ.
 *
 * Прибор оставляет ЗАМЕРЕННОЕ — внешнюю кыргызскую ветвь, ту, что видна
 * на экране сегодня, — и выбрасывает мою недостижимую.
 */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const файлы = [];
(function обход(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/^node_modules$/.test(э.name)) обход(п); }
    else if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');
let схлопнуто = 0;
файлы.forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  let т = fs.readFileSync(полный, 'utf8');
  for (;;) {
    let д;
    try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { break; }
    let цель = null;
    (function обойти(у) {
      if (!у || typeof у.type !== 'string' || цель) return;
      if (у.type === 'ConditionalExpression' && т.slice(у.test.start, у.test.end).trim() === 'isKg') {
        const вн = у.alternate;
        if (вн && вн.type === 'CallExpression' && вн.callee &&
            т.slice(вн.callee.start, вн.callee.end) === 'KSLT_YAZYK.выбрать' &&
            вн.arguments.length === 3) {
          цель = { у: у, en: вн.arguments[0], ru: вн.arguments[2] };
          return;
        }
        if (вн && вн.type === 'ConditionalExpression' &&
            т.slice(вн.test.start, вн.test.end).trim() === 'isEn') {
          цель = { у: у, en: вн.consequent, ru: вн.alternate };
          return;
        }
      }
      for (const к of Object.keys(у)) {
        if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
        const v = у[к];
        if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x));
        else if (v && typeof v.type === 'string') обойти(v);
      }
    })(д);
    if (!цель) break;
    const { у, en, ru } = цель;
    const кг = т.slice(у.consequent.start, у.consequent.end);
    const новое = 'KSLT_YAZYK.выбрать(' + т.slice(en.start, en.end) + ', ' + кг +
                  ', ' + т.slice(ru.start, ru.end) + ')';
    const н = т.slice(0, у.start) + новое + т.slice(у.end);
    acorn.parse(н, { ecmaVersion: 2020 });
    т = н;
    схлопнуто++;
    console.log('  ' + ф + ':' + у.loc.start.line);
  }
  fs.writeFileSync(полный, т, 'utf8');
});
console.log('схлопнуто: ' + схлопнуто);
/* ЗАМЕР 23.10: 29. Повторный прогон обязан найти ноль. */
if (схлопнуто !== 29 && схлопнуто !== 0) { console.error('ЖДАЛИ 29 или 0'); process.exit(1); }

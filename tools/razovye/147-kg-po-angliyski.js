/**
 * ГДЕ КЫРГЫЗУ ДАЮТ АНГЛИЙСКОЕ — замер куска 147.
 * Ищутся зовы `KSLT_YAZYK.выбрать(en, kg, ru)`, где кыргызская ветвь
 * РАВНА английской: значит кыргыз читает английский текст.
 * Плюс словари: `выбрать({...}, {...}, {...})` — ключи, где kg === en.
 *   node tools/razovye/147-kg-po-angliyski.js
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');

const файлы = [];
(function о(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/node_modules/.test(э.name)) о(п); return; }
    if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');

function обойти(у, дело) {
  if (!у || typeof у.type !== 'string') return;
  дело(у);
  for (const к of Object.keys(у)) {
    if (['type','start','end','loc'].includes(к)) continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, дело));
    else if (v && typeof v.type === 'string') обойти(v, дело);
  }
}

let строкПар = 0, словарных = 0;
const места = [];
файлы.forEach(ф => {
  const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
  let дер;
  try { дер = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }
  обойти(дер, у => {
    if (у.type !== 'CallExpression' || !у.callee) return;
    if (т.slice(у.callee.start, у.callee.end) !== 'KSLT_YAZYK.выбрать') return;
    if (у.arguments.length !== 3) return;
    const [en, kg] = у.arguments;
    /* строки: кыргызская равна английской слово в слово */
    if (en.type === 'Literal' && kg.type === 'Literal' &&
        typeof en.value === 'string' && en.value === kg.value &&
        /[A-Za-z]{3}/.test(en.value)) {
      строкПар++;
      места.push(ф + ':' + у.loc.start.line + '  «' + String(en.value).slice(0, 60) + '»');
    }
    /* словари: сравниваем значения по ключам */
    if (en.type === 'ObjectExpression' && kg.type === 'ObjectExpression') {
      const карта = н => {
        const о = {};
        н.properties.forEach(с => {
          if (!с.key || !с.value || с.value.type !== 'Literal') return;
          о[с.key.name || с.key.value] = с.value.value;
        });
        return о;
      };
      const e = карта(en), k = карта(kg);
      const равные = Object.keys(e).filter(ключ =>
        typeof e[ключ] === 'string' && e[ключ] === k[ключ] && /[A-Za-z]{3}/.test(e[ключ]));
      if (равные.length) {
        словарных += равные.length;
        места.push(ф + ':' + у.loc.start.line + '  словарь, ключей ' + равные.length +
                   ': ' + равные.slice(0, 8).join(', '));
      }
    }
  });
});
места.forEach(м => console.log('  ' + м));
console.log('');
console.log('  строковых пар, где кыргызу дан английский: ' + строкПар);
console.log('  ключей словарей, где кыргызу дан английский: ' + словарных);

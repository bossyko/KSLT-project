const fs = require('fs'), path = require('path');
const acorn = require('acorn');

const файлы = [];
(function о_(д) {
  fs.readdirSync(д, { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/admin|^node_modules$/.test(э.name)) о_(п); }
    else if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');

function обойти(у, р, дело) {
  if (!у || typeof у.type !== 'string') return;
  дело(у, р);
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, у, дело));
    else if (v && typeof v.type === 'string') обойти(v, у, дело);
  }
}
const ФЛАГ = /^(isEn|isKg)$/;
let всего = 0, неразобран = [];
const поФайлам = {}, виды = {}, образцы = [];
файлы.forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  let д;
  try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); }
  catch (e) { неразобран.push(ф); return; }
  обойти(д, null, (у, р) => {
    if (у.type !== 'ConditionalExpression') return;
    /* условие опирается на языковой флаг? */
    const усл = т.slice(у.test.start, у.test.end);
    if (!/\bis(?:En|Kg)\b/.test(усл)) return;
    всего++;
    поФайлам[ф] = (поФайлам[ф] || 0) + 1;
    /* что отдают ветви */
    const ветвь = у_ => у_.type === 'Literal' && typeof у_.value === 'string' ? 'строка'
                  : у_.type === 'ConditionalExpression' ? 'ещё тернарник'
                  : у_.type === 'MemberExpression' || у_.type === 'Identifier' ? 'переменная'
                  : у_.type === 'CallExpression' ? 'вызов' : у_.type;
    const вид = ветвь(у.consequent) + ' / ' + ветвь(у.alternate);
    виды[вид] = (виды[вид] || 0) + 1;
    if (образцы.length < 10) образцы.push(path.basename(ф) + ':' + у.loc.start.line + '  ' +
      т.slice(у.start, у.end).replace(/\s+/g, ' ').slice(0, 110));
  });
});
console.log(JSON.stringify({
  'файлов сайта': файлы.length, 'не разобрано': неразобран.length,
  'тернарников по языку': всего,
  'по виду ветвей': виды
}, null, 1));
console.log('\n--- файлы, топ-12 ---');
Object.entries(поФайлам).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([ф, n]) => console.log('  ' + String(n).padStart(4) + '  ' + ф));
console.log('\n--- образцы ---');
образцы.forEach(о => console.log('  ' + о));

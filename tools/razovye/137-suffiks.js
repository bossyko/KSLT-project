/* РАЗОВЫЙ ПРИБОР куска 137: 13 зовов `выбрать('-en','-kg','')` → `KSLT_YAZYK.суффикс`.
   Падает, если найдено не 13: ПРИБОР, ВИДЯЩИЙ ЧАСТЬ, МОЛЧА ОСТАВЛЯЕТ ОСТАЛЬНОЕ. */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const файлы = [];
(function обход(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/^(admin|node_modules)$/.test(э.name)) обход(п); }
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
let всего = 0;
файлы.forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  const т = fs.readFileSync(полный, 'utf8');
  let д;
  try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }
  const замены = [];
  обойти(д, у => {
    if (у.type !== 'CallExpression' || !у.callee) return;
    if (т.slice(у.callee.start, у.callee.end) !== 'KSLT_YAZYK.выбрать') return;
    if (у.arguments.length !== 3) return;
    const зн = у.arguments.map(a => a.type === 'Literal' ? a.value : undefined);
    if (зн[0] === '-en' && зн[1] === '-kg' && зн[2] === '') замены.push(у);
  });
  if (!замены.length) return;
  let н = т;
  замены.sort((a, b) => b.start - a.start).forEach(у => {
    н = н.slice(0, у.start) + 'KSLT_YAZYK.суффикс' + н.slice(у.end);
  });
  acorn.parse(н, { ecmaVersion: 2020 });   /* синтаксис обязан быть цел */
  fs.writeFileSync(полный, н, 'utf8');
  всего += замены.length;
  console.log('  ' + ф + ': ' + замены.length);
});
console.log('всего заменено: ' + всего);
if (всего !== 13) { console.error('ЖДАЛИ 13'); process.exit(1); }

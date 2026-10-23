/* Выгрузка русской ветви словаря: ключ, русский текст, кыргызский из
   продуктового словаря, если он там уже есть. Остальное — руками. */
const fs = require('fs'), acorn = require('acorn');
const словарь = new Map(fs.readFileSync('/tmp/slovar-kg.txt', 'utf8').split('\n')
  .filter(Boolean).map(с => { const i = с.indexOf(' || '); return [с.slice(0, i), с.slice(i + 4)]; }));
const [ф, стр] = [process.argv[2], Number(process.argv[3])];
const т = fs.readFileSync(ф, 'utf8');
const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
let цель = null;
(function обойти(у) {
  if (!у || typeof у.type !== 'string' || цель) return;
  if (у.type === 'ConditionalExpression' && у.loc.start.line === стр) { цель = у; return; }
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x));
    else if (v && typeof v.type === 'string') обойти(v);
  }
})(д);
if (!цель) { console.error('не найдено'); process.exit(1); }
const из = {};
цель.alternate.properties.forEach(p => {
  const к = p.key.name || p.key.value;
  if (p.value.type !== 'Literal' || typeof p.value.value !== 'string') { из[к] = null; return; }
  из[к] = { ru: p.value.value, kg: словарь.get(p.value.value) || '' };
});
console.log(JSON.stringify(из, null, 0));

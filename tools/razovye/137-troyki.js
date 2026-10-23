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
const формы = { 'тройка en/kg/ru': [], 'пара en/прочее': [], 'пара kg/прочее': [], 'иное': [] };
файлы.forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  обойти(д, null, (у, р) => {
    if (у.type !== 'ConditionalExpression') return;
    const усл = т.slice(у.test.start, у.test.end).trim();
    if (!/\bis(?:En|Kg)\b/.test(усл)) return;
    /* вложенный тернарник внешней тройки не считаем отдельно */
    if (р && р.type === 'ConditionalExpression' && р.alternate === у &&
        /\bisEn\b/.test(т.slice(р.test.start, р.test.end))) return;
    const зап = { ф, стр: у.loc.start.line, нач: у.start, кон: у.end,
                  код: т.slice(у.start, у.end).replace(/\s+/g, ' ').slice(0, 150) };
    const внутр = у.alternate;
    if (/^isEn$/.test(усл) && внутр && внутр.type === 'ConditionalExpression' &&
        /^isKg$/.test(т.slice(внутр.test.start, внутр.test.end).trim())) {
      зап.en = т.slice(у.consequent.start, у.consequent.end);
      зап.kg = т.slice(внутр.consequent.start, внутр.consequent.end);
      зап.ru = т.slice(внутр.alternate.start, внутр.alternate.end);
      формы['тройка en/kg/ru'].push(зап);
    } else if (/^isEn$/.test(усл)) формы['пара en/прочее'].push(зап);
    else if (/^isKg$/.test(усл)) формы['пара kg/прочее'].push(зап);
    else формы['иное'].push(зап);
  });
});
console.log(JSON.stringify(Object.fromEntries(
  Object.entries(формы).map(([к, v]) => [к, v.length])), null, 1));
Object.entries(формы).forEach(([к, v]) => {
  console.log('\n--- ' + к + ' (' + v.length + ') ---');
  v.slice(0, 5).forEach(x => console.log('   ' + path.basename(x.ф) + ':' + x.стр + '  ' + x.код.slice(0, 118)));
});
fs.writeFileSync('/tmp/137-формы.json', JSON.stringify(формы, null, 1));

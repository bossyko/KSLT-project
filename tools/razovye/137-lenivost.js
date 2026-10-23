/* ЛЕНИВОСТЬ ПРОВЕРЯЕТСЯ ПО ДЕРЕВУ, А НЕ ПО ТЕКСТУ. Регулярка принимала
   скобку ВНУТРИ СТРОКИ («Башталгыч (1.0–2.5)») за вызов функции —
   третий раз одна и та же ошибка за два куска. */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
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
function есть(у, типы) {
  let да = false;
  обойти(у, null, x => { if (типы.indexOf(x.type) !== -1) да = true; });
  return да;
}
const ЛЕНЬ = ['CallExpression', 'NewExpression', 'AssignmentExpression',
               'UpdateExpression', 'AwaitExpression', 'YieldExpression'];
const тройки = [];
файлы.forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  обойти(д, null, (у, р) => {
    if (у.type !== 'ConditionalExpression') return;
    const усл = т.slice(у.test.start, у.test.end).trim();
    if (усл !== 'isEn') return;
    const вн = у.alternate;
    if (!вн || вн.type !== 'ConditionalExpression') return;
    if (т.slice(вн.test.start, вн.test.end).trim() !== 'isKg') return;
    const ветви = [у.consequent, вн.consequent, вн.alternate];
    тройки.push({ ф, стр: у.loc.start.line, нач: у.start, кон: у.end,
      en: т.slice(у.consequent.start, у.consequent.end),
      kg: т.slice(вн.consequent.start, вн.consequent.end),
      ru: т.slice(вн.alternate.start, вн.alternate.end),
      ленива: ветви.some(в => есть(в, ЛЕНЬ)),
      код: т.slice(у.start, у.end).replace(/\s+/g, ' ').slice(0, 120) });
  });
});
const чистые = тройки.filter(т_ => !т_.ленива);
const ленивые = тройки.filter(т_ => т_.ленива);
console.log(JSON.stringify({ 'троек en/kg/ru': тройки.length,
  'ветви без вызовов — замена безопасна': чистые.length,
  'в ветвях есть вызов — ленивость важна': ленивые.length }, null, 1));
console.log('\n--- где ленивость важна (не трогаем) ---');
ленивые.slice(0, 8).forEach(x => console.log('  ' + path.basename(x.ф) + ':' + x.стр + '  ' + x.код.slice(0, 104)));
fs.writeFileSync('/tmp/137-тройки.json', JSON.stringify({ чистые, ленивые }, null, 1));

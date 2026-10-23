/* РАЗОВЫЙ ПРИБОР куска 137: убрать МЁРТВЫЕ объявления `isEn`/`isKg`.
   Мёртвым объявление называется ПОСЛЕ ПРОВЕРКИ: число вхождений имени в
   дереве равно числу его объявлений — значит ни одного чтения нет.
   После каждой правки файл разбирается заново и имя обязано исчезнуть. */
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
function мёртвые(т) {
  const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  const счёт = { isEn: 0, isKg: 0 }, об = { isEn: [], isKg: [] };
  const родители = new Map();
  обойти(д, null, (у, р) => {
    родители.set(у, р);
    if (у.type === 'Identifier' && (у.name === 'isEn' || у.name === 'isKg')) {
      счёт[у.name]++;
      if (р && р.type === 'VariableDeclarator' && р.id === у) об[у.name].push(р);
    }
  });
  const из = [];
  ['isEn', 'isKg'].forEach(и => {
    if (об[и].length && счёт[и] === об[и].length) об[и].forEach(д_ => из.push([и, д_, родители.get(д_)]));
  });
  return из;
}
let убрано = 0;
файлы.forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  let т = fs.readFileSync(полный, 'utf8');
  let список;
  try { список = мёртвые(т); } catch (e) { return; }
  if (!список.length) return;
  /* резать с конца, чтобы смещения не поехали */
  список.sort((a, b) => b[1].start - a[1].start).forEach(([и, дек, объяв]) => {
    if (объяв.declarations.length === 1) {
      /* всё объявление, вместе со строкой и её отступом */
      let s = объяв.start, e = объяв.end;
      while (s > 0 && /[ \t]/.test(т[s - 1])) s--;
      if (т[e] === '\n') e++;
      т = т.slice(0, s) + т.slice(e);
    } else {
      const i = объяв.declarations.indexOf(дек);
      const пред = объяв.declarations[i - 1], след = объяв.declarations[i + 1];
      if (след) т = т.slice(0, дек.start) + т.slice(след.start);
      else т = т.slice(0, пред.end) + т.slice(дек.end);
    }
    убрано++;
    console.log('  ' + ф + '  ' + и);
  });
  acorn.parse(т, { ecmaVersion: 2020 });
  if (/\bis(?:En|Kg)\b/.test(т)) {
    const ост = мёртвые(т);
    if (ост.length) { console.error('ОСТАЛОСЬ МЁРТВОЕ в ' + ф); process.exit(1); }
  }
  fs.writeFileSync(полный, т, 'utf8');
});
console.log('убрано мёртвых объявлений: ' + убрано);
/* 29 — замер 23.10. Повторный прогон обязан найти ноль: прибор idempotent. */
if (убрано !== 29 && убрано !== 0) { console.error("ЖДАЛИ 29 или 0"); process.exit(1); }

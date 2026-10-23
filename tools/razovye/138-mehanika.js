/* РАЗОВЫЙ ПРИБОР куска 138, шаг 1 — МЕХАНИКА, ПЕРЕВОДА НЕ ТРЕБУЕТ.
   Три класса пар, где кыргызский падал в русскую ветвь:
     · код локали  `isEn ? 'en-US' : 'ru-RU'`  → выбрать(..., 'ky-KG', ...)
     · код языка   `isEn ? 'en' : 'ru'`        → KSLT_YAZYK.код
     · адрес       `isEn ? 'x-en.html' : 'x.html'` → выбрать(..., 'x-kg.html', ...)
   Каждый класс считается отдельно и падает на расхождении с замером. */
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
const счёт = { локали: 0, код: 0, адреса: 0 };
файлы.forEach(ф => {
  const полный = path.join(КОРЕНЬ, ф);
  const т = fs.readFileSync(полный, 'utf8');
  let д;
  try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }
  const правки = [];
  обойти(д, у => {
    if (у.type !== 'ConditionalExpression') return;
    if (т.slice(у.test.start, у.test.end).trim() !== 'isEn') return;
    if (у.alternate.type === 'ConditionalExpression') return;
    const en = у.consequent, ru = у.alternate;
    if (en.type !== 'Literal' || ru.type !== 'Literal') return;
    if (typeof en.value !== 'string' || typeof ru.value !== 'string') return;

    if (ru.value === 'ru-RU' && en.value === 'en-US') {
      правки.push([у, "KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU')", 'локали']);
      return;
    }
    if (ru.value === 'ru' && en.value === 'en') {
      /* КОД ЯЗЫКА УЖЕ ЕСТЬ В ДОМЕ — это он и есть, записанный заново. */
      правки.push([у, 'KSLT_YAZYK.код', 'код']);
      return;
    }
    const м = /^(.*)-en(\.html.*)$/.exec(en.value);
    if (м && ru.value === м[1] + м[2]) {
      const кг = м[1] + '-kg' + м[2];
      if (!fs.existsSync(path.join(КОРЕНЬ, 'pages', path.basename(кг).split('?')[0]))) {
        console.error('НЕТ СТРАНИЦЫ ' + кг + ' — ' + ф + ':' + у.loc.start.line);
        process.exit(1);
      }
      правки.push([у, "KSLT_YAZYK.выбрать('" + en.value + "', '" + кг + "', '" + ru.value + "')", 'адреса']);
    }
  });
  if (!правки.length) return;
  let н = т;
  правки.sort((a, b) => b[0].start - a[0].start).forEach(([у, текст, класс]) => {
    н = н.slice(0, у.start) + текст + н.slice(у.end);
    счёт[класс]++;
  });
  acorn.parse(н, { ecmaVersion: 2020 });
  fs.writeFileSync(полный, н, 'utf8');
  console.log('  ' + ф + '  ' + правки.length);
});
console.log('локали ' + счёт.локали + ', код языка ' + счёт.код + ', адреса ' + счёт.адреса);
/* ЗАМЕР 23.10: 12 локалей, 10 кодов языка, 4 адреса. Повтор даёт нули. */
const ждём = JSON.stringify({ локали: 12, код: 10, адреса: 4 });
const нули = JSON.stringify({ локали: 0, код: 0, адреса: 0 });
if (JSON.stringify(счёт) !== ждём && JSON.stringify(счёт) !== нули) {
  console.error('ЖДАЛИ ' + ждём + ' или нули, вышло ' + JSON.stringify(счёт));
  process.exit(1);
}

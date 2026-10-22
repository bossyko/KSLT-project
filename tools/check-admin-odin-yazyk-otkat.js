/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 118.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО: правила ходят в
 * `js/admin`, `pages`, `maket` и `tools/razovye/maska.js`.
 *
 *   node tools/check-admin-odin-yazyk-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-118-'));
['js', 'pages', 'maket', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CONST = 'js/admin/core/constants.js';
const PLR = 'js/admin/sections/players.js';
const ANG = 'pages/admin-en.html';

const ОТКАТЫ = [
  ['вернуть тернарник подписи', CONST,
   "        dashboard: 'Дашборд',",
   "        dashboard: isEn ? 'Dashboard' : 'Дашборд',",
   'в админке нет ни одного тернарника `isEn ?`'],

  /* ОСЛЕПИТЬ МАСКУ — ЭТО ДВЕ ПРАВКИ, А НЕ ОДНА. Нынешняя маска знает
     регулярные литералы, и одной спрятанной веткой её не обманешь — это
     и доказал первый вариант отката, НЕ уронив правило. Поэтому откат
     возвращает ПРЕЖНЮЮ маску (без знания о регулярках) И кладёт ветку за
     регулярку с кавычкой: ровно та пара, что спрятала 376 тернарников от
     первой версии прибора куска 118. Сырой счёт их видит, масочный нет. */
  ['ослепить маску и спрятать ветку за регулярку',
   [['tools/razovye/maska.js',
     "        if (c === '/') {",
     "        if (false) {"],
    [PLR,
     '    function plural(n, kind) {',
     '    var _слепень = String(1).replace(/"/g, \'\');\n    var _ветка = isEn ? 1 : 2;\n    function plural(n, kind) {']],
   null, null,
   'маска прибора видит столько же, сколько сырой поиск'],

  ['вернуть объявление флага', CONST,
   '    var L = {',
   "    var isEn = window.location.pathname.indexOf('-en') !== -1;\n    var L = {",
   'флаг `isEn` в админке не объявляется нигде'],

  ['вернуть вывод флага наружу', CONST,
   '    window.KSLT_ADMIN = {\n        L: L,',
   '    window.KSLT_ADMIN = {\n        isEn: false,\n        L: L,',
   'флаг не выводится наружу через window.KSLT_ADMIN'],

  ['перестать называть язык графику', PLR,
   '            isEn: false,',
   '',
   'общему с сайтом графику язык назван словом'],

  ['снять перенаправление с английской страницы', ANG,
   "window.location.replace('admin.html')",
   "window.console.log('admin.html')",
   'admin-en.html остаётся перенаправлением и не грузит админских скриптов'],

  ['завести английскую страницу, грузящую админку', null, null, null,
   'ни одна страница с `-en` в пути не грузит админских скриптов'],

  ['повторить ключ в словаре', CONST,
   "        dashboard: 'Дашборд',",
   "        dashboard: 'Дашборд',\n        dashboard: 'Главная',",
   'в словаре админки нет повторённых ключей'],

  ['похудеть словарю ниже замера', CONST,
   "        dashboard: 'Дашборд',\n",
   '',
   'имён в словаре не меньше замеренных 1596'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-admin-odin-yazyk.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /✗/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

/* база: на чистой копии правило обязано проходить */
if (прогон().length) {
  console.log('\n  ✗ БАЗА: правило не проходит на ЧИСТОЙ копии — песок неполон\n');
  console.log('    ' + прогон().join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    исходный код правила проходит\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  let вернуть = null;
  if (Array.isArray(ф)) {
    /* СПИСОК ПРАВОК ЗА ОДИН ОТКАТ: есть беды, которые одной правкой не
       заводятся — доказать такое правило можно только парой. */
    const сохранённые = [];
    let сорвалось = null;
    for (const [фф, б, с] of ф) {
      const путь = path.join(ВРЕМ, фф);
      const ориг = fs.readFileSync(путь, 'utf8');
      const n = ориг.split(б).length - 1;
      if (n !== 1) { сорвалось = фф + ': якорь встречается ' + n + ' раз'; break; }
      сохранённые.push([путь, ориг]);
      fs.writeFileSync(путь, ориг.split(б).join(с));
    }
    if (сорвалось) {
      сохранённые.forEach(([п, о]) => fs.writeFileSync(п, о));
      console.log('  ✗ откат ' + (i + 1) + ' (' + сорвалось + ')');
      плохо++; return;
    }
    вернуть = () => сохранённые.forEach(([п, о]) => fs.writeFileSync(п, о));
  } else if (ф === null) {
    /* особый откат: заводим английскую страницу, грузящую админку */
    const путь = path.join(ВРЕМ, 'pages/admin-en-proba.html');
    fs.writeFileSync(путь, '<script src="../js/admin/core/constants.js?v=1"></script>');
    вернуть = () => fs.rmSync(путь, { force: true });
  } else {
    const путь = path.join(ВРЕМ, ф);
    const ориг = fs.readFileSync(путь, 'utf8');
    const n = ориг.split(было).length - 1;
    if (n !== 1) {
      console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
      console.log('      ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
      плохо++; return;
    }
    fs.writeFileSync(путь, ориг.split(было).join(стало));
    вернуть = () => fs.writeFileSync(путь, ориг);
  }
  const упали = прогон();
  вернуть();
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ ' + имя);
    console.log('      ждали «' + ждём + '»');
    console.log('      упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else {
    console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не трогались — работа шла на копии\n');

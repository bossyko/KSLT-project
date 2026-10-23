/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 139. На КОПИИ нужных файлов плюс acorn.
 *   node tools/check-tri-dolga-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-139-'));
['js', 'css', 'maket'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.copyFileSync(path.join(КОРЕНЬ, 'tools', 'check-tri-dolga.js'),
                path.join(ВРЕМ, 'tools', 'check-tri-dolga.js'));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(ВРЕМ, 'node_modules', 'acorn'), { recursive: true });

const LAY = 'js/admin/core/layout.js', CON = 'js/admin/core/constants.js',
      BR = 'js/admin/sections/bracket.js', PL = 'js/admin/sections/players.js',
      CSS = 'css/admin.css', СТ = 'maket/polosa-filtrov-zamer.html',
      LOY = 'js/admin/sections/loyalty.js';

const ОТКАТЫ = [
  ['снять у ссылки собранное имя', LAY,
   " aria-labelledby=\"' + id + 'Link ' + id + 'Title\"",
   "",
   'ссылка «Все →» собирает имя из своего заголовка'],

  ['отнять у заголовка его имя', LAY,
   "'<span id=\"' + id + 'Title\">' + title + '</span>' +",
   "title +",
   'заголовок таблицы несёт имя, на которое ссылается ссылка'],

  ['убрать одну таблицу активности', LAY,
   "                buildActivityTableHtml('adDashRecentNews'",
   "                false ? '' : ТАБЛИЦА_СНЯТА('adDashRecentNews'",
   'таблиц активности на дашборде шесть — замерено'],

  ['вернуть второй ключ на тот же случай', CON,
   "        brkLoading: 'Загрузка...',",
   "        brkPlayersNeNotFound2: 'Игроков не найдено',\n        brkLoading: 'Загрузка...',",
   'ключ «игроки не найдены» в админке один'],

  /* ЯКОРЬ РАСШИРЕН СОСЕДНЕЙ СТРОКОЙ: после сведения двух ключей в один
     зов стал одинаковым в ОБОИХ местах сетки, и короткий якорь встречался
     дважды. Это не беда прувера, а признак, что дубликат действительно
     сведён. */
  ['отнять у одного места зов ключа', BR,
   "список.innerHTML = '<div style=\"padding:8px;color:var(--text-muted);font-size:var(--fs-sm);\">' +\n                        L.brkPlayersNeNotFound",
   "список.innerHTML = '<div style=\"padding:8px;color:var(--text-muted);font-size:var(--fs-sm);\">' +\n                        'Игроков не найдено'",
   'все три места зовут этот ключ, а не свой текст'],

  ['зашить текст обратно в уведомление', PL,
   "A.showToast(L.brkPlayersNeNotFound, 'error')",
   "A.showToast('Игроки не найдены', 'error')",
   'зашитого «Игроки не найдены» в админке не осталось'],

  ['снять липкость с одной полосы фильтров', LOY,
   '<div class="ad-filter-row ad-filter-sticky">',
   '<div class="ad-filter-row">',
   'все полосы фильтров админки липкие — 12, и ни одной без'],

  ['прибить полосу к своему числу вместо высоты шапки', CSS,
   ".ad-filter-sticky {\n    position: sticky;\n    top: var(--header-h);",
   ".ad-filter-sticky {\n    position: sticky;\n    top: 64px;",
   'полоса липнет к высоте шапки, а не к своему числу'],

  ['сделать секцию прокручиваемым предком', CSS,
   ".ad-section.active {\n    display: block;\n    padding-top: 0;\n    overflow: visible;",
   ".ad-section.active {\n    display: block;\n    padding-top: 0;\n    overflow-x: hidden;",
   'секция не делается прокручиваемым предком'],

  ['укоротить список на стенде до удобного', СТ,
   "i <= 60",
   "i <= 3",
   'стенд доказывает липкость продуктовой цепочкой, а не удобной'],

  ['сломать разбор словаря админки', CON,
   "        brkLoading: 'Загрузка...',",
   "        brkLoading: 'Загрузка...',\n        ) : ,",
   'словарь админки разбирается парсером']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-tri-dolga.js')],
                 { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*x\s/.test(с)).map(с => с.replace(/^\s*x\s*/, '').trim());
  }
}

const БАЗА = прогон();
if (БАЗА.length) {
  console.log('\n  x БАЗА: правила не проходят на ЧИСТОЙ копии\n    ' + БАЗА.join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    все правила проходят на чистой копии\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  x откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало), 'utf8');
  const упало = прогон();
  fs.writeFileSync(путь, ориг, 'utf8');
  if (упало.indexOf(ждём) !== -1) {
    console.log('  v ' + имя + '  ->  «' + ждём + '»');
  } else {
    console.log('  x ' + имя + '\n      ждали «' + ждём + '», упало: ' +
                (упало.length ? '«' + упало.join('», «') + '»' : '— ничего —'));
    плохо++;
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) {
  console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
  process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');

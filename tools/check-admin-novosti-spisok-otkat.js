/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СПИСКА НОВОСТЕЙ В АДМИНКЕ ОТКАТОМ.
 *
 * Каждое правило check-admin-novosti-spisok.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ: оригиналы не трогаются.
 *
 *   node tools/check-admin-novosti-spisok-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-novosti-spisok-'));
['css', 'tools', 'js', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ADM = 'css/admin.css';
const NJS = 'js/admin/sections/news.js';
const TJS = 'js/admin/sections/tournaments.js';
const UJS = 'js/admin/core/utils.js';
const СТД = 'maket/stend-admin-novosti-spisok.html';

const ОТКАТЫ = [

  [NJS, `                '<div class="ad-news-stat-card ad-news-stat-card--popular">' +
                    '<div class="ad-news-stat-icon">&#128293; ' + L.newsStatPopular + '</div>' +
                    '<div class="ad-news-stat-top-list" id="adNewsStatTopList">' +
                        '<div class="ad-news-stat-top-pusto">...</div>' +
                    '</div>' +
                '</div>' +
`,          ``,
   'карточки аналитики остались тремя — состав не менялся'],

  [ADM, `    padding: var(--space-3) var(--space-4);
    text-align: center;
}`,     `    padding: 14px 16px;
    text-align: center;
}`,
   'поля карточки аналитики стоят на шкале отступов'],

  [ADM, `    gap: var(--space-3);
    margin-bottom: var(--space-6);
}`,     `    gap: 12px;
    margin-bottom: 20px;
}`,
   'отбивка полосы карточек стоит на шкале'],

  [ADM, `    grid-template-columns: repeat(3, minmax(0, 1fr));`,
        `    grid-template-columns: 1fr 1fr 1fr;`,
   'три карточки аналитики РАВНЫ между собой'],

  [ADM, `    font-size: var(--fs-2xs);
    color: var(--text-muted);
    margin-top: var(--space-1);
}`,     `    font-size: var(--fs-2xs);
    color: var(--text-dim);
    margin-top: var(--space-1);
}`,
   'тихий текст куска не зовёт `--text-dim`'],

  [NJS, `'<div class="ad-news-stat-top-pusto">' + L.newsStatNoArticles + '</div>'`,
        `'<div style="color:var(--text-muted);font-size:0.8rem;">' + L.newsStatNoArticles + '</div>'`,
   'пустое у популярных — классом, а не кеглем из разметки'],

  [ADM, `.ad-table tbody tr {
    height: 48px;
}`,     `.ad-table tbody tr {
    min-height: 48px;
}`,
   'высоту ряда задаёт свойство, а не сумма полей'],

  [ADM, `    display: block;
    width: 48px;
    height: 32px;
    border-radius: 4px;`,
        `    width: 48px;
    height: 32px;
    border-radius: 4px;`,
   'миниатюра не стоит на базовой линии строки'],

  [ADM, `    white-space: nowrap;
}

/* ---- News Image Thumbnail in Table ---- */`,
        `}

/* ---- News Image Thumbnail in Table ---- */`,
   'значок категории живёт в одну строку'],

  [ADM, `    width: 100%;
    max-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}`,     `    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}`,
   'название в таблице — одна строка с отсечкой, и клетка даёт себя сузить'],

  [NJS, `'<td class="ad-nazvanie" style="font-weight:500;color:var(--text-primary);" title="' + A.esc(a.title || L.noData) + '">'`,
        `'<td class="ad-nazvanie" style="font-weight:500;color:var(--text-primary);">'`,
   'полное название приходит подсказкой, раз видна его часть'],

  [NJS, `'<td class="ad-chislo">' + reactionsCell + '</td>'`,
        `'<td style="text-align:center;color:var(--text-secondary);">' + reactionsCell + '</td>'`,
   'числовая клетка — классом, а не инлайновым стилем'],

  [ADM, `    transform: translate(-50%, -50%);
    width: 44px;
    height: 44px;
}`,     `    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
}`,
   'у галочки есть прозрачный слой цели 44'],

  [ADM, `    transform: translateY(-50%);
    height: 44px;
}`,     `    transform: translateY(-50%);
    height: 24px;
}`,
   'у шапки колонки есть прозрачный слой цели 44'],

  [UJS, `                    btnWrap.style.display = 'none';`,
        `                    btnWrap.style.display = '';`,
   'полоса выбора гаснет по событию, а не по пересчёту DOM'],

  [TJS, `reloadFn: loadTournamentsList });`,
        `reloadFn: function() { loadTournamentsList(); } });`,
   'ни одна обёртка `reloadFn` не прячет промис'],

  [UJS, `            checkAll.indeterminate = count > 0 && count < total.length;`,
        `            checkAll.indeterminate = false;`,
   'неполный выбор отличим от пустого'],

  [TJS, `'<input type="text" class="ad-field-input ad-filter-search" id="adTrnSearch"`,
        `'<input type="text" class="ad-field-input ad-trn-poisk" id="adTrnSearch"`,
   'поиск и кнопка новостей — те же классы, что у турниров'],

  [ADM, `    flex: 0 1 auto;
    width: 320px;
    max-width: 100%;
    height: 44px;`,
        `    flex: 0 1 auto;
    min-width: 240px;
    max-width: 300px;
    height: 44px;`,
   'поле поиска берётся из компонента целиком — 320 × 44'],

  [ADM, `    flex: 0 1 auto;
    width: 320px;`,
        `    flex: 1 1 240px;
    width: 320px;`,
   'ширину поиска держит `width`, а не `flex-basis`'],

  [ADM, `    .ad-filter-row--dvoe {
        flex-direction: row;
    }`,
        `    .ad-filter-row--dvoe {
        flex-direction: column;
    }`,
   'полоса из двух элементов не ломается в колонку'],

  [СТД, `    A.renderNewsList().then(function() {`,
        `    A.renderNewsSection(); Promise.resolve().then(function() {`,
   'стенд списка рисует НАСТОЯЩИЙ модуль, а не копию разметки'],

  [СТД, `  body { opacity: 1 !important; }`,
        `  body { opacity: 0.99; }`,
   'стенд зажигает `body` сам'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-admin-novosti-spisok.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*✗\s/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

console.log('');
const база = прогон();
if (база.length) {
  console.log('  НЕ ТАК  копия падает ещё ДО откатов — ' + база.length + ' правил');
  база.forEach(п => console.log('          ✗ ' + п));
  console.log('');
  process.exit(1);
}

let плохо = 0;
ОТКАТЫ.forEach(([ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ откат ' + (i + 1) + ': ждали «' + ждём + '»');
    console.log('    упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else {
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём + (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });

console.log('');
if (плохо) {
  console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило\n');
  process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии\n');

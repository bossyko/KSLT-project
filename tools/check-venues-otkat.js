/**
 * ПРУВЕР ЗАМОРОЗКИ ВИТРИНЫ «ГДЕ ИГРАТЬ И У КОГО УЧИТЬСЯ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. «У меня зелёное»
 * ничего не доказывает: правило может быть зелёным, читаемым и мёртвым.
 *
 *   node tools/check-venues-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-venues-'));

['css', 'tools', 'js'].forEach(д => fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, 'index.html'), path.join(ВРЕМ, 'index.html'));

/* [файл, что стоит сейчас, чем было до 24.09, какое правило обязано упасть] */
const ОТКАТЫ = [
  ['css/style.css',
   '.vn-four > .court-card:nth-child(n+5),\n.vn-four > .coach-card:nth-child(n+5) { display: none; }',
   '',
   'у базового вида есть потолок, кратный четырём колонкам'],

  ['css/style.css',
   '    .coaches-grid.vn-four { grid-template-columns: repeat(3, 1fr); }',
   '    .coaches-grid.vn-four { grid-template-columns: repeat(2, 1fr); }',
   'планшет — три колонки и потолок, кратный трём'],

  ['css/style.css',
   '    .vn-four > .court-card:nth-child(n+4),\n    .vn-four > .coach-card:nth-child(n+4) { display: none; }',
   '',
   'планшет — три колонки и потолок, кратный трём'],

  ['css/style.css',
   '    .vn-four > .court-card:nth-child(odd):nth-last-child(1):not(:first-child),\n    .vn-four > .coach-card:nth-child(odd):nth-last-child(1):not(:first-child) { display: none; }',
   '    .vn-four > .court-card:nth-child(odd):nth-last-child(1),\n    .vn-four > .coach-card:nth-child(odd):nth-last-child(1) { display: none; }',
   'хвост не гасит единственную запись'],

  ['css/style.css',
   '    .vn-four > .court-card:nth-child(n+4),\n    .vn-four > .coach-card:nth-child(n+4) { display: flex; }\n\n    .vn-four > .court-card:nth-child(n+5),\n    .vn-four > .coach-card:nth-child(n+5) { display: none; }\n\n    /* :not(:first-child)',
   '    /* :not(:first-child)',
   'телефон — две колонки, два полных ряда, и хвост считается ОТ КОНЦА'],

  ['css/style.css',
   '    .coaches-grid.vn-four { grid-template-columns: repeat(4, 1fr); }',
   '    .coaches-grid.vn-four { grid-template-columns: repeat(3, 1fr); }',
   'телефон боком — четыре в ряд и ровно один ряд'],

  ['css/style.css',
   '@media (orientation: landscape) and (max-height: 500px) {\n    .courts-grid.vn-four,',
   '@media (max-height: 500px) {\n    .courts-grid.vn-four,',
   'слой поворота стоит ПОСЛЕ телефона и планшета'],

  ['css/style.css',
   '    aspect-ratio: 4 / 3;',
   '    height: 168px;',
   'отношение сторон объявлено ОДИН раз и общее у корта и тренера'],

  ['css/style.css',
   '    object-fit: cover;\n    border: 0;\n    border-radius: 0;\n}',
   '    object-fit: cover;\n    border: 0;\n    border-radius: 0;\n    height: 92px;\n}',
   'ни у одной картинки витрины высота не задана числом'],

  ['css/style.css',
   '.vn-row-head h3 {\n    font-size: var(--fs-lg);',
   '.vn-row-head h3 {\n    font-size: var(--fs-base);',
   'подзаголовок ряда стоит на своей ступени, а не на ступени имени'],

  ['css/style.css',
   '    .vn-row-head h3 { font-size: var(--fs-md); }\n',
   '',
   'подзаголовок строго крупнее имени карточки на каждом виде'],

  ['css/style.css',
   '.vn-four .coach-info h4 {\n    font-size: var(--fs-base);\n    line-height: 1.25;\n    display: -webkit-box;\n    -webkit-line-clamp: 2;',
   '.vn-four .coach-info h4 {\n    font-size: var(--fs-base);\n    line-height: 1.25;\n    display: -webkit-box;',
   'имя карточки — две строки с многоточием, и правило одно на обе карточки'],

  ['css/style.css',
   '    .vn-four .coach-info h4 { font-size: var(--fs-sm); }',
   '    .vn-four .coach-info h4 { font-size: var(--fs-sm); line-height: 1.3; }',
   'один уровень — один межстрочный: у имени он объявлен ровно раз'],

  ['css/style.css',
   '.vn-notice {\n    grid-column: 1 / -1;\n    padding: var(--space-6) var(--space-4);\n    text-align: center;\n    color: var(--text-muted);',
   '.vn-notice {\n    grid-column: 1 / -1;\n    padding: var(--space-6) var(--space-4);\n    text-align: center;\n    color: var(--text-dim);',
   'внутри витрины нет --text-dim'],

  ['css/style.css',
   '.vn-four .vn-foot .vn-go {\n    font-size: var(--fs-md);',
   '.vn-four .vn-go {\n    font-size: var(--fs-md);',
   'стрелка и метка объявлены тяжелее общего правила меты'],

  ['css/style.css',
   '.vn-four .coach-card:focus-visible {\n    outline: 3px solid var(--accent);',
   '.vn-four .coach-card:focus-visible {\n    outline: 0;',
   'кольцо фокуса есть у обеих карточек'],

  ['css/style.css',
   '\n    .vn-four .court-card:hover,\n    .vn-four .coach-card:hover { transform: none; }',
   '',
   'движение спрашивает разрешения'],

  ['css/style.css',
   '.vn-four .court-card-actions,\n.vn-four .coach-card-actions { display: none; }',
   '',
   'кнопки-обманки в витрине нет ни в css, ни в разметке'],

  ['css/style.css',
   '.vn-four .coach-info .vn-partner {\n    position: static;',
   '.vn-four .coach-info .vn-partner {\n    position: absolute;',
   'метка партнёра не лежит на фотографии'],

  ['css/style.css',
   '.vn-four .coach-photo { object-position: 50% top; }\n',
   '',
   'портрет тренера кадрируется от верха'],

  ['css/style.css',
   '@media (max-width: 640px) {\n    .courts-grid.vn-four,',
   '@media (max-width: 560px) {\n    .courts-grid.vn-four,',
   'у витрины нет ни одной границы мимо лестницы 640 · 992'],

  ['css/style.css',
   '.court-price {\n    color: var(--text-primary) !important;',
   '.court-card-cta:hover {\n    opacity: 0.85;\n}\n\n.court-price {\n    color: var(--text-primary) !important;',
   'мёртвых .court-card-cta и .coach-card-cta нет нигде'],

  ['js/home-courts-coaches.js',
   "            grid.innerHTML = '<div class=\"vn-notice\">' + L.failed + '</div>';",
   "            grid.innerHTML = '<div class=\"vn-notice\">' + empty + '</div>';",
   'сбой и пустота говорят разными словами на всех трёх языках'],

  ['js/home-courts-coaches.js',
   "        var line = части.join(' · ');",
   "        var line = surfaces.join(', ') + (total ? ' · ' + total + ' ' + L.courts : '');",
   'умолчание — свойство данных, а не разметки'],

  ['js/home-courts-coaches.js',
   '    var SURFACE_PHOTO = {',
   '    var SURFACE_PHOTO_OFF = {',
   'заглушка фотографии — три ступени, и третья не даёт битой рамки'],

  /* Якорь на версию style.css уехал, как только соседний кусок поднял её
     до 363: откат держался на ЧИСЛЕ, а число растёт при каждой правке.
     Держимся за версию своего файла — она меняется только вместе с ним. */
  ['index.html',
   'home-courts-coaches.js?v=13',
   'home-courts-coaches.js?v=12',
   'версии подняты — иначе браузер отдаст старое из кеша']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-venues.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    return (e.stdout || '').split('\n')
      .filter(с => с.indexOf('✗ ') !== -1)
      .map(с => с.replace(/^\s*✗\s*/, '').trim());
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
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём +
                (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо === 0) {
  console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
  console.log('');
  process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);

/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ УЗКИХ ВИДОВ ОТКАТОМ.
 *
 * Каждое правило check-telefon-razdela.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ, оригиналы не трогаем.
 *
 *   node tools/check-telefon-razdela-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-telefon-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const РЕЙТ  = 'css/players.css';
const ОБЗОР = 'css/tournaments-overview.css';
const ТУРН  = 'css/tournaments.css';

/* [файл, что ищем, на что меняем, какое правило обязано упасть] */
const ОТКАТЫ = [

  [РЕЙТ, `@media (max-height: 500px) and (orientation: landscape) {`,
         `@media (max-height: 500px) and (orientation: portrait-staroe) {`,
   'узкий вид рейтинга задан высотой и поворотом, а не новой шириной'],

  [РЕЙТ, `@media (max-width: 640px) {

    .pl-guest-mark { display: none; }`,
         `@media (max-width: 480px) {

    .pl-guest-mark { display: none; }`,
   'в рейтинге не завелось третьей границы по ширине'],

  [РЕЙТ, `        min-height: var(--btn-h-sm);
        padding: 7px 16px;`,
         `        min-height: var(--btn-h-md);
        padding: 7px 16px;`,
   'чип пола сходит на ступень ниже ТОЛЬКО вместе со слоем цели 44'],

  [РЕЙТ, `    .pl-gender-tab {
        position: relative;
        min-height: var(--btn-h-sm);`,
         `    .pl-gender-tab {
        min-height: var(--btn-h-sm);`,
   'слой цели у чипа умеет лежать поверх — у чипа есть точка отсчёта'],

  [РЕЙТ, `    .pl-filters-section {
        padding-block: var(--space-xs) var(--space-xs);
    }`,
         `    .pl-filters-section {
        padding-block: 10px 10px;
    }`,
   'воздух полосы в узком виде — ступени шкалы, а не числа'],

  [РЕЙТ, `        grid-template-columns: minmax(0, auto) auto;
        align-items: center;`,
         `        grid-template-columns: 1fr;
        align-items: center;`,
   'пилюли и «Показать всех» стоят ОДНОЙ строкой'],

  [РЕЙТ, `    .pl-category-pills {
        grid-column: 1;
        justify-content: start;
    }`,
         `    .pl-category-pills {
        justify-content: start;
    }`,
   'место каждого элемента названо колонкой, а не порядком'],

  [РЕЙТ, `.pl-filters-searching .pl-category-row {`,
         `.pl-filters-searching-staroe .pl-category-row {`,
   'режим поиска под правило узкого вида не попадает'],

  [ОБЗОР, `    .trn-block .to-card-grid {
        grid-template-columns: 1fr;`,
          `    .trn-block-staroe .to-card-grid {
        grid-template-columns: 1fr;`,
   'исключение названо АДРЕСНО — блоком раздела, а не всем подряд'],

  [ОБЗОР, `    .to-card-grid {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
    }`,
          `    .to-card-grid-vitrina {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
    }`,
   'правило витрины осталось витрине — его не сняли заодно'],

  [ОБЗОР, `    .trn-block .to-featured,
    .trn-block .to-featured-side {
        height: auto;`,
          `    .trn-block .to-featured,
    .trn-block .to-featured-side {
        height: 200px;`,
   'карточка раздела берёт высоту от содержимого, а не от ступени плитки'],

  [ОБЗОР, `    .trn-block .to-side-stack .to-compact-thumb {
        display: grid;
    }`,
          `    .trn-block .to-side-stack .to-compact-thumb {
        display: none;
    }`,
   'полоса второго турнира ВИДНА на странице разряда'],

  [ОБЗОР, `        padding-left: calc(var(--to-thumb) + var(--space-sm));`,
          `        padding-left: 112px;`,
   'место под афишу считается ИЗ ЕЁ ШИРИНЫ, а не повторяет число'],

  [ОБЗОР, `        --to-thumb: 96px;`,
          `        --to-thumb: 100px;`,
   'ширина афиши на телефоне — ступень шкалы'],

  [ОБЗОР, `        grid-template-columns: minmax(0, 1fr);
    }

    .trn-block .to-side-stack .to-compact-thumb .to-compact-left {`,
          `        grid-template-columns: auto minmax(0, 1fr);
    }

    .trn-block .to-side-stack .to-compact-thumb .to-compact-left {`,
   'на телефоне карточка идёт ОДНОЙ колонкой'],

  [ОБЗОР, `    .trn-block .to-side-stack .to-compact-thumb .to-compact-left {
        width: auto;`,
          `    .trn-block .to-side-stack .to-compact-thumb .to-compact-left {
        width: var(--to-meta, 104px);`,
   'колонка меты на телефоне не держит ширину широкого вида'],

  [ТУРН, `    .tournament-hero {
        margin-bottom: var(--space-xs);
    }`,
         `    .tournament-hero {
        margin-bottom: 0;
    }`,
   'воздух между обложкой и полосой — ступень шкалы, а не ноль'],

  [ТУРН, `    .trn-sticky-sentinel + .trn-filters {
        padding-top: var(--space-xs);
    }`,
         `    .trn-filters {
        padding-top: var(--space-xs);
    }`,
   'поле полосы фильтров поднято у ТОЙ полосы, что стоит под обложкой'],

  [ТУРН, `    .trn-filters .trn-back {
        padding-top: 0;
    }`,
         `    .trn-filters .trn-back {
        padding-top: 20px;
    }`,
   'ссылка «назад» подняла текст, не тронув цель нажатия'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-telefon-razdela.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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
if (плохо === 0) {
  console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
  console.log('');
  process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);

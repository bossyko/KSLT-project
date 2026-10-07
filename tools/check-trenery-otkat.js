/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ТРЕНЕРОВ» ОТКАТОМ.
 *
 * Каждое правило check-trenery.js проверяем обратным ходом — возвращаем
 * прежнее значение, и ИМЕННО ТО правило обязано упасть. Работаем на КОПИИ.
 *
 *   node tools/check-trenery-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-trenery-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/coaches.css';
const СТИ = 'css/style.css';
const JS  = 'js/coaches.js';
const ПОЛ = 'js/polosa-stranic.js';
const EN  = 'pages/coaches-en.html';

const ОТКАТЫ = [

  [CSS, `    min-height: var(--oblozhka-pol);`, `    min-height: 460px;`,
   'пол обложки берётся из общей крутилки раздела'],

  [CSS, `    padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);`,
         `    padding: var(--section-y) var(--pad-x) var(--section-y);`,
   'воздух обложки — тоже крутилки, а не --section-y'],

  [CSS, `.co-hero-title {
    font-size: var(--fs-hero);`,
         `.co-hero-title {
    font-size: var(--fs-2xl);`,
   'заголовок и подзаголовок обложки — ступени, а не доли ширины'],

  [CSS, `.co-hero-subtitle {
    font-size: var(--fs-hero-sub);`,
         `.co-hero-subtitle {
    font-size: clamp(1.05rem, 2.2vw, 1.3rem);`,
   'в обложке не осталось ни одного clamp'],

  /* Откат ВОЗВРАЩАЕТ блок ≤480 со своим кеглем — ровно то, что было */
  [CSS, `@media (max-width: 375px) {`,
         `@media (max-width: 375px) {
    .co-hero-title {
        font-size: clamp(1.35rem, 5.8vw, 1.7rem);
    }`,
   'кегль обложки не переопределяется ширинами'],

  [JS, `        container.className = 'trn-filters';`,
       `        container.className = 'co-filters-wrap';`,
   'полоса размечена ОБЩИМИ классами, а не своими'],

  [JS, `'<div class="trn-search-wrap">' +`, `'<div class="co-search-wrap">' +`,
   'назад, поиск и чипы берутся из общего листа'],

  [CSS, `.co-container {`,
         `#coachesFilters { position: sticky; }\n\n.co-container {`,
   'полоса фильтров описана ОДИН раз, и не по идентификатору'],

  [CSS, `.co-card-img-wrap {`, `.co-search-input { border-radius: 100px; }\n\n.co-card-img-wrap {`,
   'своей полосы в css тренеров не осталось ни одного класса'],


  /* Потерять выпадашку можно и наполовину — только при перерисовке */




  [CSS, `    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));`,
         `    grid-template-columns: repeat(4, 1fr);`,
   'число колонок — следствие ширины карточки, а не границы экрана'],

  [CSS, `        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-3);`,
         `        gap: var(--space-3);`,
   'две в ряд на телефоне заведены СВОИМ минимумом на 640'],

  [CSS, `.co-container {
    max-width: var(--container-max);`,
         `.co-container {
    max-width: var(--container-narrow);`,
   'витрина идёт по ШИРОКОЙ коробке'],

  [CSS, `    --co-ryadov: 4;`, `    --co-ryadov: 3;`,
   'рядов на странице — крутилка, 4 на широких и 3 на узких'],

  [JS, `        PER_PAGE = шаг;`, `        PER_PAGE = 20;`,
   'шаг страницы — колонок × рядов, и колонки считаются по раскладке'],

  [JS, `        new ResizeObserver(function () {
            if (пересчитатьШаг()) renderGrid();
        }).observe(коробка);`,
       `        window.addEventListener('resize', function () {
            if (пересчитатьШаг()) renderGrid();
        });`,
   'пересчёт шага висит на ResizeObserver, а не на resize окна'],

  [JS, `        if (!_шагИдёт && пересчитатьШаг()) {`, `        if (пересчитатьШаг()) {`,
   'повтор отрисовки ровно один — у него есть сторож'],

  [JS, `        window.KSLT_полосаСтраниц(container, total, page, PER_PAGE, L);`,
       `        container.innerHTML = '<div class="co-pagination"></div>';`,
   'полоса страниц у тренеров — общий компонент, а не своя'],

  [CSS, `.co-pagination-section {`, `.co-page-btn { min-width: 40px; }\n\n.co-pagination-section {`,
   'своих кнопок страниц в css тренеров не осталось'],

  [CSS, `    --polosa-shirina: 100%;`, `    --polosa-shirina: 1100px;`,
   'полоса страниц идёт по ширине СВОЕЙ витрины'],

  [CSS, `    aspect-ratio: 4 / 3;
    object-fit: cover;
    object-position: 50% top;`,
         `    width: 100px;
    height: 100px;
    object-fit: cover;
    object-position: 50% top;`,
   'портрет тренера — ОТНОШЕНИЕМ 4:3, как у корта'],

  [CSS, `.co-card-name {
    font-size: var(--fs-base);`,
         `.co-card-name {
    font-size: var(--fs-md);`,
   'имя карточки — ступень card title и всегда две строки'],

  [CSS, `.co-card-spec {
    color: var(--text-secondary);
    font-size: var(--fs-xs);`,
         `.co-card-spec {
    color: var(--text-secondary);
    font-size: var(--fs-sm);`,
   'мета карточки — один кегль на все виды'],

  [CSS, `.co-card-body {
    padding: var(--space-3);`,
         `.co-card-body {
    padding: 24px;`,
   'плотность карточки — Dense 12 и один ритм, а не поля у каждой строки'],

  [CSS, `    font-size: var(--fs-xs);
    line-height: 1.4;
    font-weight: 600;
}`,
         `    font-size: var(--fs-xs);
    line-height: 1.4;
    font-weight: 600;
    color: var(--accent);
}`,
   'внутри витрины лайма нет — ни у меты, ни у числа'],

  [JS, `            var contactHtml = '<div class="co-card-actions">' +`,
       `            var contactHtml = '<div class="co-card-actions">' +\n                '<span class="co-card-btn">x</span>' +`,
   '«Подробнее →» убрано вместе со своим правилом'],

  [CSS, `    min-height: var(--btn-h-md);
    padding: 0 var(--space-3);`,
         `    padding: 10px 0;`,
   'у «Забронировать» настоящая высота, а не следствие полей'],

  [СТИ, `    max-width: var(--polosa-shirina, 1100px);`, `    max-width: 1100px;`,
   'полоса страниц идёт по ширине СВОЕЙ витрины'],

  [ПОЛ, `    function полосаСтраниц(container, total, page, шаг, labels) {`,
        `    function полосаСтраниц(total, page, шаг) {`,
   'полоса страниц у тренеров — общий компонент, а не своя'],

  [EN, `coaches.css?v=`, `coaches.css?v=1`,
   'страница подключает свои файлы одной версией на три языка'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-trenery.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

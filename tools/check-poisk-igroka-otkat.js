/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ПОИСКА ИГРОКА» ОТКАТОМ.
 *
 * Каждое правило check-poisk-igroka.js проверяем обратным ходом — возвращаем
 * прежнее значение, и ИМЕННО ТО правило обязано упасть. Работаем на КОПИИ.
 *
 *   node tools/check-poisk-igroka-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-poisk-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/partners.css';
const СТИ = 'css/style.css';
const JS  = 'js/partners.js';
const ПОЛ = 'js/polosa-stranic.js';
const EN  = 'pages/partners-en.html';

const ОТКАТЫ = [

  [CSS, `    min-height: var(--oblozhka-pol);`, `    min-height: 460px;`,
   'пол обложки берётся из общей крутилки раздела'],

  [CSS, `    padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);`,
         `    padding: var(--section-y) var(--pad-x) var(--section-y);`,
   'воздух обложки — тоже крутилки, а не --section-y'],

  [CSS, `.pt-hero h1 {
    font-size: var(--fs-hero);`,
         `.pt-hero h1 {
    font-size: var(--fs-2xl);`,
   'заголовок и подзаголовок обложки — ступени, а не доли ширины'],

  [CSS, `.pt-hero p {
    font-size: var(--fs-hero-sub);`,
         `.pt-hero p {
    font-size: clamp(1.05rem, 2.2vw, 1.3rem);`,
   'в обложке не осталось ни одного clamp'],

  /* Откат ВОЗВРАЩАЕТ блок ≤480 со своим кеглем — ровно то, что было */
  [CSS, `@media (max-width: 640px) {
    .pt-card {`,
         `@media (max-width: 640px) {
    .pt-hero h1 {
        font-size: clamp(1.35rem, 5.8vw, 1.7rem);
    }
    .pt-card {`,
   'кегль обложки не переопределяется ширинами'],

  [JS, `        el.className = 'trn-filters';`,
       `        el.className = 'pt-filters';`,
   'полоса размечена ОБЩИМИ классами, а не своими'],

  [JS, `'<div class="trn-search-wrap">' +`, `'<div class="pt-search-wrap">' +`,
   'назад, поиск и чипы берутся из общего листа'],



  /* Потерять выпадашку можно и наполовину — только при перерисовке */




  [CSS, `    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));`,
         `    grid-template-columns: repeat(4, 1fr);`,
   'число колонок — следствие ширины карточки, а не границы экрана'],

  [CSS, `        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-3);`,
         `        gap: var(--space-3);`,
   'две в ряд на телефоне заведены СВОИМ минимумом на 640'],

  [CSS, `.pt-grid-wrap {
    max-width: var(--container-max);`,
         `.pt-grid-wrap {
    max-width: var(--container-narrow);`,
   'витрина идёт по ШИРОКОЙ коробке'],

  [CSS, `    --pt-ryadov: 4;`, `    --pt-ryadov: 3;`,
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
       `        container.innerHTML = '<div class="pt-pagination"></div>';`,
   'полоса страниц — общий компонент, а не своя'],

  [CSS, `.pt-pagination-section {`, `.pt-page-btn { min-width: 40px; }\n\n.pt-pagination-section {`,
   'своих кнопок страниц в css кортов не осталось'],

  [CSS, `    --polosa-shirina: 100%;`, `    --polosa-shirina: 1100px;`,
   'полоса страниц идёт по ширине СВОЕЙ витрины'],


  [CSS, `.pt-name {
    font-size: var(--fs-base);`,
         `.pt-name {
    font-size: var(--fs-md);`,
   'у витрины ОДИН уровень текста на все виды'],

  [CSS, `@media (max-width: 640px) {
    .pt-card {`,
         `@media (max-width: 640px) {
    .pt-badge { font-size: var(--fs-2xs); }
    .pt-card {`,
   'у витрины ОДИН уровень текста на все виды'],





  [СТИ, `    max-width: var(--polosa-shirina, 1100px);`, `    max-width: 1100px;`,
   'полоса страниц идёт по ширине СВОЕЙ витрины'],

  [ПОЛ, `    function полосаСтраниц(container, total, page, шаг, labels) {`,
        `    function полосаСтраниц(total, page, шаг) {`,
   'полоса страниц — общий компонент, а не своя'],

  [EN, `partners.css?v=`, `partners.css?v=1`,
   'страница подключает свои файлы одной версией на три языка'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-poisk-igroka.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

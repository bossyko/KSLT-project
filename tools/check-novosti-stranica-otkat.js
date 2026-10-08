/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «НОВОСТЕЙ» ОТКАТОМ.
 *
 * Каждое правило check-novosti.js проверяем обратным ходом — возвращаем
 * прежнее значение, и ИМЕННО ТО правило обязано упасть. Работаем на КОПИИ.
 *
 *   node tools/check-novosti-stranica-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-novosti-str-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/news.css';
const СТИ = 'css/style.css';
const JS  = 'js/news.js';
const EN  = 'pages/news-en.html';

const ОТКАТЫ = [

  [CSS, `    min-height: var(--oblozhka-pol);
    overflow: hidden;`,
         `    min-height: 460px;
    overflow: hidden;`,
   'пол обложки списка берётся из общей крутилки раздела'],

  [CSS, `    padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);
    min-height: var(--oblozhka-pol);`,
         `    padding: var(--section-y) var(--gutter) 0;
    min-height: var(--oblozhka-pol);`,
   'воздух обложки — тоже крутилки, а не --section-y'],

  [CSS, `    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);`,
         `    padding: var(--section-y) var(--gutter);
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);`,
   'у содержимого обложки своего вертикального воздуха нет'],

  [CSS, `.news-list-header h1 {`, `.news-list-header h1 { font-size: var(--fs-2xl); }
.news-list-header h1-было {`,
   'заголовок обложки — ступень шкалы, а не доля ширины'],

  [СТИ, `    .news-hero-list.news-hero-list,`, `    .news-hero-list.news-hero-list-было,`,
   'обложка списка входит в общий список обложек разделов'],

  [CSS, `    .news-hero:not(:has(.news-hero-content-list)) {
        height: 50vh;
    }`,
         `    .news-hero {
        height: 50vh;
    }`,
   'доля высоты окна принадлежит обложке ОТДЕЛЬНОЙ новости'],

  [JS, `' class="tc' + (isLarge ? ' tc-featured' : '')`,
       `' class="nc' + (isLarge ? ' nc-featured' : '')`,
   'карточку новости рисует общий компонент .tc'],

  [CSS, `.news-list { padding: var(--space-6) var(--pad-x) var(--section-y); text-align: left; }`,
         `.news-list { padding: var(--space-6) var(--pad-x) var(--section-y); text-align: left; }
.news-bento-card { display: flex; }`,
   'своей вёрстки карточки (бенто) в коде не осталось'],

  [JS, `'<div class="tournaments-grid news-grid" id="newsBento"></div>'`,
       `'<div class="news-grid" id="newsBento"></div>'`,
   'витрина несёт ОБА класса: правила карточки и свою раскладку'],

  [CSS, `.news-grid .tc-title { text-transform: none; }`,
         `.news-grid .tc-title { text-transform: uppercase; }`,
   'название карточки не берёт капс у заголовка секции'],

  [JS, `(isLarge ? '<h2 class="tc-title">' : '<h3 class="tc-title">')`,
       `('<h3 class="tc-title">')`,
   'крупная — h2, боковая — h3: уровень не пропускается'],

  [CSS, `.news-outside .tc-title::after,`, `.news-outside .tc-title-было::after,`,
   'внешняя новость уходит в новую вкладку и помечена стрелкой'],

  [CSS, `.news-grid.news-grid > .tc { grid-column: span 3; }`,
         `.news-grid > .tc { grid-column: span 3; }
.news-grid.news-grid > .tc { grid-column: span 3 ; }`,
   'раскладка списка записана УДВОЕННЫМ классом'],

  [CSS, `.news-grid.news-grid > .tc:nth-child(1) {
    grid-column: span 6;
    grid-row: span 2;
}`,
         `.news-grid.news-grid > .tc:nth-child(1) {
    grid-column: span 6;
    grid-row: auto;
}`,
   'крупная занимает половину ширины и ОБА ряда боковых'],

  [CSS, `    .news-grid.news-grid > .tc { grid-column: span 12; }`,
         `    .news-grid.news-grid > .tc { grid-column: span 6; }`,
   'на телефоне новости идут ПО ОДНОЙ'],

  [CSS, `        -webkit-line-clamp: 3;`, `        -webkit-line-clamp: 2;`,
   'на телефоне у заголовка списка три строки, а не две'],

  [CSS, `.news-list-page {
    max-width: var(--container-max);`,
         `.news-list-page {
    max-width: var(--container-narrow);`,
   'витрина идёт по ширине общего ящика'],

  [CSS, `    .news-paragraph {
        font-size: var(--fs-sm);
    }`,
         `    .news-paragraph {
        font-size: var(--fs-sm);
    }
    .news-grid { gap: 10px; }`,
   'правила СПИСКА живут только на границах 640 и 992'],

  [CSS, `    --novostey: 9;`, `    --novostey-было: 9;`,
   'шаг страницы читается из живой сетки крутилкой'],

  [JS, `window.KSLT_полосаСтраниц(полоса`, `window.KSLT_полосаСтраниц_было(полоса`,
   'полосу страниц рисует общий компонент'],

  [JS, `        return a.переведена !== false;`, `        return true;`,
   'статья без перевода не уходит на чужой язык'],

  [JS, `    kg: {`, `    kg_было: {`,
   'подписи страницы есть на всех трёх языках'],

  [JS, `esc(searchQuery ? (labels.emptySearchHint || 'Проверьте написание или очистите поиск')`,
       `esc((`,
   'пустые состояния говорят РАЗНОЕ про поиск и про категорию'],

  [CSS, `@media (prefers-reduced-motion: reduce) {`, `@media (max-width: 992px) {`,
   'движение выключается по просьбе системы'],

  [EN, `news.css?v=`, `news.css?v=1`,
   'страница подключает свои файлы одной версией на три языка'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-novosti-stranica.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

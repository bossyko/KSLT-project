/**
 * ПРУВЕР ЗАМОРОЗКИ СТРАНИЦЫ ТУРНИРОВ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 * «У меня зелёное» ничего не доказывает.
 *
 * Якорь держится на СОДЕРЖИМОМ блока, а не на его положении и не на номере
 * версии: номер меняется при каждой правке, это как раз то, что уезжает.
 *
 *   node tools/check-turniry-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-turniry-'));
['css', 'tools', 'js', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
/* Тесты копируются ТОЛЬКО своей папкой: в tests/ лежат ещё и отчёты со
   следами прогонов, и копировать их целиком — это минуты и гигабайты. */
fs.cpSync(path.join(КОРЕНЬ, 'tests/e2e/design-system'),
          path.join(ВРЕМ, 'tests/e2e/design-system'), { recursive: true });

const CSS = 'css/tournaments-overview.css';
const JSФ = 'js/tournaments-overview.js';
const ТОК = 'css/tokens.css';
const HTML = 'pages/tournaments-overview.html';
const СТАТ = 'js/stats.js';
const HTMLen = 'pages/tournaments-overview-en.html';
const СТЕНД = 'maket/turniry-zamer.html';
const ТЕСТ  = 'tests/e2e/design-system/44-turniry.spec.js';
const КРУПФ = 'js/tournament-featured.js';
const БЛОКФ = 'js/tournament-blocks.js';

const ОТКАТЫ = [
  /* ── отношения ─────────────────────────────────────────────────────── */
  [CSS, `.to-categories .to-card-grid {\n    /* СТУПЕНЬ ВЫВЕДЕНА`,
        `.to-card-grid {\n    /* СТУПЕНЬ ВЫВЕДЕНА`,
   'ступень слота живёт в разделе турниров, а не в общем .to-card-grid'],

  [CSS, `--to-featured-h: calc(var(--to-slot) * 3 + var(--space-md) * 2);`,
        `--to-featured-h: 720px;`,
   'рост крупной карточки ВЫВЕДЕН из ступени слота, а не задан числом'],

  [CSS, `    min-height: var(--to-featured-h, 380px);`,
        `    min-height: var(--to-featured-h);`,
   'у соседа остаётся запасное значение, если переменной нет'],

  [CSS, `    grid-template-rows: repeat(3, var(--to-slot));`,
        `    grid-auto-rows: var(--to-slot);`,
   'столб — сетка с ПОСТОЯННЫМ числом рядов, а не список переменной длины'],

  [CSS, `        grid-template-rows: repeat(2, var(--to-slot));`,
        `        grid-template-rows: repeat(3, var(--to-slot));`,
   'на планшете рядов ДВА — целые ряды по два, а не три с хвостом'],

  [CSS, `    .to-categories .to-card-grid {\n        --to-featured-h: 320px;\n    }`,
        `    .to-categories .to-card-grid {\n        min-width: 0;\n    }`,
   'отношение «крупная равна столбу» снимается там, где столб уходит вниз'],

  [CSS, `.to-categories .to-side-stack .to-compact {\n    height: 100%;`,
        `.to-categories .to-side-stack .to-compact {\n    min-height: 0;`,
   'высота боковой строки — свойство слота, а не содержимого'],

  [CSS, `    --to-thumb: 120px;`,
        `    --to-thumb-unused: 120px;`,
   'ширина миниатюры задана ОДИН раз переменной'],

  /* ── число слотов ──────────────────────────────────────────────────── */
  [JSФ, `    function слотов() {`,
        `    function слотовНеИспользуется() {`,
   'число слотов считает функция, а не константа в цикле'],

  [JSФ, `        if (window.matchMedia('(min-width: 641px)').matches) return 4;`,
        `        if (window.matchMedia('(min-width: 641px)').matches) return 2;`,
   'слотов становится меньше вместе с шириной: 3 → 4 → лента'],

  [JSФ, `var МЕСТ_В_КАТЕГОРИИ = 5;`,
        `var МЕСТ_В_КАТЕГОРИИ = 4;`,
   'мест в категории пять, а не четыре'],

  /* ── две ширины и поворот ──────────────────────────────────────────── */
  [CSS, `@media (max-width: 992px) {`,
        `@media (max-width: 1024px) {`,
   'точек останова по ширине ровно две — 640 и 992'],

  [JSФ, `        ? window.matchMedia('(max-width: 640px), (max-height: 500px) and (orientation: landscape)')`,
        `        ? window.matchMedia('(max-width: 640px)')`,
   'узкая ветка в js включает низкий горизонтальный, а не только ширину'],

  [CSS, `        min-height: 0;\n        --to-hero-vozduh:     var(--section-y-sm);`,
        `        min-height: 60dvh;\n        --to-hero-vozduh:     var(--section-y-sm);`,
   'обложка на низком горизонтальном НЕ заперта в высоту окна'],

  [CSS, `    --to-hero-shag: var(--space-lg);`,
        `    --to-hero-shag-unused: var(--space-lg);`,
   'воздух и шаг обложки — крутилки, а не вторые объявления'],

  /* ── лестница ──────────────────────────────────────────────────────── */
  [CSS, `    font-size: var(--fs-3xl);\n    font-weight: 800;\n    line-height: var(--lh-tight);`,
        `    font-size: clamp(1.9rem, 4.4vw, 3.1rem);\n    font-weight: 800;\n    line-height: 1.1;`,
   'заголовок и подзаголовок обложки стоят на ступенях, а не на clamp'],

  [CSS, `.to-hero .tournament-hero-stats .hero-stat-value {\n    font-size: var(--fs-3xl);\n}`,
        `.to-hero .tournament-hero-stats .hero-stat-value {\n    font-weight: 800;\n}`,
   'цифры обложки получили ступени в своём разделе'],

  [CSS, `    .to-hero-sub { font-size: var(--fs-base); }`,
        `    .to-hero-sub { font-weight: 600; }`,
   'пара «заголовок и подзаголовок» отстоит на ступень на каждом виде'],

  /* ── высота свойством ──────────────────────────────────────────────── */
  [ТОК, `  --chip-h: 24px;`,
        `  --chip-h-unused: 24px;`,
   'ступень чипа заведена в компоненте, а не зашита в секцию'],

  [CSS, `    height: var(--btn-h-md);\n    /* Справа место под лупу`,
        `    padding: 14px 50px 14px 20px;\n    /* Справа место под лупу`,
   'поле поиска держит ступень кнопки, а не считается из полей'],

  [CSS, `.to-search-field {\n    position: relative;`,
        `.to-search-field {\n    display: block;`,
   'лупа стоит ВНУТРИ поля, а не держится на отрицательном отступе'],

  [CSS, `    min-height: var(--btn-h-md);\n    gap: var(--space-2);`,
        `    gap: var(--space-2);`,
   'цель нажатия у ссылки категории не меньше ступени md'],

  /* ── пустое и порядок ──────────────────────────────────────────────── */
  [JSФ, `                        : '<div class="to-slot-empty"></div>';`,
        `                        : '';`,
   'пустой слот держит место'],

  [JSФ, `        slotEmpty: 'здесь появится следующий турнир категории',`,
        ``,
   'подпись пустого слота живёт в словаре на трёх языках'],

  [JSФ, `            if (список.some(function(t) { return t.status === 'ongoing'; })) return 2;`,
        `            if (false) return 2;`,
   'порядок категорий трёхуровневый: идёт → предстоящие → остальное'],

  /* ── доступность ───────────────────────────────────────────────────── */
  [CSS, `.to-phone-cards .tc:focus-visible {`,
        `.to-phone-cards .tc:hover {`,
   'на странице есть правило фокуса, и оно :focus-visible'],

  [CSS, `@media (prefers-reduced-motion: reduce) {`,
        `@media (min-width: 1px) {`,
   'настройка «меньше движения» учитывается'],

  [CSS, `.to-search-input::placeholder {\n    color: var(--text-muted);\n}`,
        `.to-search-input::placeholder {\n    color: var(--text-dim);\n}`,
   'подсказка поиска читаема: не --text-dim'],

  [CSS, `    border: 1px solid var(--alpha-white-35);`,
        `    border: 1px solid var(--border-subtle);`,
   'граница поля ввода видна: не --border-subtle'],

  [HTMLen, `id="overviewSearch" aria-label=`,
           `id="overviewSearch" data-label=`,
   'у поля поиска есть имя для диктора на всех трёх языках'],

  /* ── лента ─────────────────────────────────────────────────────────── */
  [CSS, `        scroll-snap-type: x mandatory;\n        -webkit-overflow-scrolling: touch;`,
        `        -webkit-overflow-scrolling: touch;`,
   'лента листается со снапом, а не рассыпается сеткой'],

  [CSS, `        flex: 0 0 44%;`,
        `        flex: 0 0 158px;`,
   'ширина карточки в ленте — доля экрана, чтобы следующая выглядывала'],

  [JSФ, `        items.slice(0, 6).forEach(function(it) {`,
        `        items.slice(0, 4).forEach(function(it) {`,
   'в ленту идёт до шести карточек, а не до четырёх'],

  /* ── сторож чисел ──────────────────────────────────────────────────── */
  [CSS, `    --to-slot: 160px;`,
        `    --to-slot: 160px;\n    margin-top: 17px;`,
   'в файле не осталось чисел мимо шкалы'],

  /* ── стенд и версии ────────────────────────────────────────────────── */
  [СТЕНД, `    function раскладка(ш, в) {`,
          `    function раскладкаНеИспользуется(ш, в) {`,
   'стенд подписывает вид и раскладку прямо на экране'],

  [СТЕНД, `    window.supabaseClient = {`,
          `    window.supabaseClientЗаглушка = {`,
   'стенд не ходит в живую базу'],

  [HTMLen, /tournaments-overview\.css\?v=\d+/,
           `tournaments-overview.css?v=999`,
   'версия css одинакова на всех трёх языках'],

  /* ── порядок медиаблоков ───────────────────────────────────────────── */
  [CSS, `@media (prefers-reduced-motion: reduce) {`,
        `.to-category-title { font-size: var(--fs-xl); }\n@media (prefers-reduced-motion: reduce) {`,
   'ни одно правило узких видов не перебито базой ниже по файлу'],

  [CSS, `@media (max-height: 500px) and (orientation: landscape) {`,
        `@media (max-height: 501px) and (orientation: landscape) {`,
   'низкий горизонтальный стоит ПОСЛЕ ширин — иначе 992 перебивает ленту'],

  /* ── три языка ─────────────────────────────────────────────────────── */
  [СТЕНД, `history.replaceState(null, '', настоящий);`,
          `void настоящий;`,
   'стенд берёт язык из ?lang= и возвращает адрес на настоящий файл'],

  [ТЕСТ, `    { имя: 'kg', адрес: СТЕНД + '?lang=kg' }`,
         `    { имя: 'ru2', адрес: СТЕНД }`,
   'тест ходит по ТРЁМ языкам, а не по одному'],

  /* ── 28.09 · статус над датой и плитка по своей ширине ─────────────── */
  [CSS, `.to-compact-thumb .to-compact-status {\n    max-width: 100%;`,
        `.to-compact-thumb .to-compact-status {\n    position: absolute;\n    max-width: 100%;`,
   'статус стоит в колонке сведений, а не плашкой поверх афиши'],

  [CSS, `    width: var(--to-meta, 104px);`,
        `    width: auto;`,
   'колонка «статус над датой» одной ширины во всех строках'],

  [CSS, `    container-type: inline-size;`,
        `    container-type: normal;`,
   'карточка перестраивается по СВОЕЙ ширине, а не по ширине окна'],

  [CSS, `@container (max-width: 480px) {`,
        `@media (max-width: 1100px) {`,
   'третьей точки останова по ширине не завелось'],

  [CSS, `        grid-template-columns: minmax(0, 1fr);\n        align-content: start;`,
        `        grid-template-columns: minmax(0, 1fr);\n        align-content: start;\n    }\n    .to-side-stack .to-compact-thumb {\n        grid-template-columns: minmax(0, 1fr);\n        align-content: start;`,
   'плитка описана ОДИН раз, а не отдельно под каждый планшет'],

  [CSS, `        --to-slot: 216px;`,
        `        --to-slot: 160px;`,
   'ступень слота на планшете поднята, а кнопка записи не сжата'],

  [ТЕСТ, `'переливает из карточки: '`,
         `'переливает из кармана: '`,
   'тест меряет перелив из карточки, а не только высоты блоков'],

/* ── ЧЕТЫРЕ ЧИСЛА ОБЛОЖКИ, 04.10 ─────────────────────────────────────── */
  /* Форма записи здесь СВОЯ: [файл, ищем, меняем, какое правило упадёт].
     Первый заход 04.10 написал пятиэлементную, с именем впереди, — и прувер
     принял имя за путь к файлу: ENOENT на «увести имя общей формулы». ФОРМА
     ОТКАТА ЧИТАЕТСЯ У СОСЕДА, А НЕ ВСПОМИНАЕТСЯ. */

  [СТАТ, `window.KSLT_STATS.турнировВсего = function(изБазы) {`,
         `window.KSLT_STATS.турнировИтого = function(изБазы) {`,
   'счёт турниров — ОДНО определение, и оно названо именем'],

  [СТАТ, `apply('statTournaments', null, window.KSLT_STATS.турнировВсего(d.tournaments));`,
         `apply('statTournaments', null, ARCHIVE_TOURNAMENTS + (d.tournaments || 0));`,
   'главная читает имя, а не повторяет сложение'],

  /* Второе объявление ТОГО ЖЕ имени, а не похожего: правило считает
     вхождения `ARCHIVE_TOURNAMENTS =`, и `ARCHIVE_TOURNAMENTS_OLD =` под него
     не попадало — откат проходил незамеченным. Прувер сказал об этом прямо. */
  [СТАТ, `    var ARCHIVE_TOURNAMENTS = 300;`,
         `    var ARCHIVE_TOURNAMENTS = 300;\n    var ARCHIVE_TOURNAMENTS = 300;`,
   'архив клуба заведён ОДНИМ числом'],

  [JSФ, `            var elВсего = document.getElementById('toStatTotal');`,
        `            var el = document.getElementById('toStatTotal');\n            if (el) el.textContent = all.length;\n            var elВсего = document.getElementById('toStatTotal');`,
   'обзорная не считает турниры своим all.length'],

  [HTML, `<script src="../js/stats.js?v=5"></script>`,
         `<!-- stats.js otklyuchen -->`,
   'обзорная ru подключает js/stats.js'],

  [JSФ, `                if (totalPrize > 0) {`,
        `                if (totalPrize >= 0) {`,
   'нулевой призовой фонд прячет ВЕСЬ показатель'],

  /* ── вход на турнир: ссылка, а не обработчик ──────────────────────── */

  [КРУПФ, `    function слойСсылки(href, имя) {`,
          `    function слойВхода(href, имя) {`,
   'слой входа объявлен ОДИН раз и вынесен в общий модуль'],

  [КРУПФ, `return '<a class="to-compact-cover" href="' + экр(href) + '"'`,
          `return '<div class="to-compact-cover" data-href="' + экр(href) + '"'`,
   'слой входа отдаёт ССЫЛКУ с адресом, а не div с обработчиком'],

  [КРУПФ, `               ' aria-label="' + экр(имя) + '"></a>';`,
          `               '></a>';`,
   'у слоя есть имя для диктора'],

  [КРУПФ, `            .replace(/&/g, '&amp;').replace(/"/g, '&quot;')`,
          `            .replace(/&/g, '&amp;')`,
   'имя турнира экранируется перед подстановкой в атрибут'],

  [БЛОКФ, `            ' data-status="' + t.status + '" data-gender="' + (t._gender || 'all') + '"' +`,
          `            ' data-status="' + t.status + '" data-gender="' + (t._gender || 'all') + '"' +\n            ' data-href="' + detailPage + '?id=' + t.id + '"' +`,
   'полоса общего модуля не носит data-href'],

  [БЛОКФ, `            window.KSLT_TFEATURED.слойСсылки(detailPage + '?id=' + t.id, t.name) +`,
          `            '' +`,
   'полоса общего модуля зовёт ОБЩИЙ слой входа'],

  [JSФ, `            '" data-cat="' + catKey + '" data-idx="' + idx + '"' +`,
        `            '" data-cat="' + catKey + '" data-idx="' + idx + '" data-href="' + compactHref + '"' +`,
   'полоса обзорной не носит data-href'],

  [JSФ, `            window.KSLT_TFEATURED.слойСсылки(compactHref, t.name) +`,
        `            '' +`,
   'полоса обзорной зовёт ТОТ ЖЕ слой входа'],

  [CSS, `.to-compact > .to-compact-cover {\n    position: absolute;\n    inset: 0;`,
        `.to-compact > .to-compact-cover {\n    position: static;`,
   'слой растянут на всю полосу, а не на своё содержимое'],

  [CSS, `    z-index: 2;\n    border-radius: inherit;`,
        `    z-index: 0;\n    border-radius: inherit;`,
   'слой лежит ВЫШЕ содержимого, а не под ним'],

  [CSS, `.to-compact > .to-compact-right {\n    z-index: 3;\n}`,
        `.to-compact > .to-compact-right {\n    z-index: 1;\n}`,
   'то, у чего своё действие, стоит ВЫШЕ слоя'],

  [CSS, `.to-compact > .to-compact-cover:focus-visible {`,
        `.to-compact > .to-compact-cover:hover {`,
   'у слоя виден фокус с клавиатуры'],

  [CSS, `    padding: 2px var(--space-2);\n    line-height: var(--lh-snug);`,
        `    padding: 2px var(--space-2);\n    line-height: 1.2;`,
   'межстрочных числами в файле не осталось ни одного'],

  [CSS, `       «название + мета» ехала двумя разными границами */\n    line-height: var(--lh-snug);`,
        `       «название + мета» ехала двумя разными границами */\n    line-height: 1.5;`,
   'название полосы держит ОДНУ ступень на все виды'],

  /* ── мёртвая краска состояний ──────────────────────────────────────── */

  [CSS, `.to-slots-tight {`,
        `.btn-register.is-refused { color: #f44336; }\n\n.to-slots-tight {`,
   'нет краски для состояния, которое никто не ставит'],

  [CSS, `.to-compact-right {\n    display: flex;`,
        `.to-compact-right {\n    display: flex !important;`,
   '!important остался только там, где он часть приёма'],

  /* ── стенд не расходится со страницей ──────────────────────────────── */

  [СТЕНД, `<script src="../js/tournament-status.js?v=1"></script>\n`, ``,
   'стенд грузит КАЖДЫЙ модуль, который зовёт страница'],

  [СТЕНД, `tournaments-overview.css?v=106`, `tournaments-overview.css?v=102`,
   'версии в стенде те же, что на странице'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-turniry.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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
  const строковый = typeof было === 'string';
  const n = строковый
    ? ориг.split(было).length - 1
    : (ориг.match(new RegExp(было.source, (было.flags || '').replace('g', '') + 'g')) || []).length;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + String(строковый ? было : было.source).replace(/\n/g, ' ⏎ ').slice(0, 90));
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

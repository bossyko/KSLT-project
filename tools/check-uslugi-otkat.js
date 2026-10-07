/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «УСЛУГ» ОТКАТОМ.
 *
 * Каждое правило check-uslugi.js проверяем обратным ходом — возвращаем
 * прежнее значение, и ИМЕННО ТО правило обязано упасть. Работаем на КОПИИ.
 *
 *   node tools/check-uslugi-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-uslugi-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/services.css';
const JS  = 'js/services.js';
const EN  = 'pages/services-en.html';

const ОТКАТЫ = [

  [CSS, `    min-height: var(--oblozhka-pol);`, `    min-height: 460px;`,
   'пол обложки берётся из общей крутилки раздела'],

  [CSS, `    padding: var(--oblozhka-vozduh) var(--pad-x) var(--oblozhka-vozduh-niz);`,
        `    padding: var(--section-y) var(--pad-x) var(--section-y);`,
   'воздух обложки — тоже крутилки, а не --section-y'],

  [CSS, `.sv-hero h1 {
    font-size: var(--fs-hero);`,
        `.sv-hero h1 {
    font-size: clamp(1.9rem, 4.4vw, 3.1rem);`,
   'заголовок обложки — ступень, а не доля ширины'],

  [CSS, `.sv-hero p {
    font-size: var(--fs-hero-sub);`,
        `.sv-hero p {
    font-size: var(--fs-md);`,
   'подзаголовок обложки — ступень'],

  [CSS, `@media (max-width: 640px) {

    .sv-column-title {`,
        `@media (max-width: 480px) {

    .sv-column-title {`,
   'точек останова по ширине ровно две — 640 и 992'],

  [CSS, `@media (max-height: 500px) and (orientation: landscape) {
    .sv-columns {`,
        `@media (max-height: 500px) and (orientation: portrait) {
    .sv-columns {`,
   'телефон лёжа возвращает две колонки ВЫСОТОЙ И ПОВОРОТОМ'],

  [CSS, `    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));`,
        `    grid-template-columns: repeat(5, minmax(0, 1fr));`,
   'число колонок у поиска игрока — следствие ширины карточки'],

  [CSS, `.sv-carousel[data-type="coaches"] .sv-compact-img-wrap {`,
        `.sv-carousel[data-type="coaches"] .sv-compact { width: 200px; }\n.sv-carousel[data-type="coaches"] .sv-compact-img-wrap {`,
   'отдельных размеров у карточки тренера в коде нет'],

  [CSS, `    aspect-ratio: 4 / 3;
    height: auto;
    display: block;
    object-fit: cover;`,
        `    height: 100px;
    object-fit: cover;`,
   'фото ленты — ОТНОШЕНИЕМ, и коробка портрета тренера та же'],

  [CSS, `    min-height: calc(2 * var(--lh-snug) * 1em);`,
        `    white-space: nowrap;`,
   'имени в карточке ленты ВСЕГДА отведены две строки'],

  [CSS, `    /* Правило имени на ≤640 снято: оно ставило \`--fs-sm\`, то же, что стоит
       в самом компоненте. Проверено чтением, а не по виду — объявление
       было мёртвым. */`,
        `    .sv-compact h4 {
        font-size: var(--fs-sm);
    }`,
   'две строки имени объявлены ОДИН раз'],

  [CSS, `    min-width: 220px;
    max-width: 220px;`,
        `    min-width: 220px;
    max-width: 220px;
    height: 244px;`,
   'высота карточки ленты не прибита числом'],

  [JS, `        return '<a class="sv-compact" href="' + courtPage + '?id=' + c.id + '"' +
            ' data-type="courts" data-idx="' + idx + '">' +`,
       `        return '<div class="sv-compact" data-type="courts" data-idx="' + idx + '">' +`,
   'карточки лент — настоящие ссылки'],

  [JS, `            '<a class="sv-player-cover" href="' + partnersPage + '" aria-label="' +
                name.replace(/"/g, '&quot;') + '"></a>' +`,
       ``,
   'карточка игрока несёт СЛОЙ-ссылку, а не обёрнута ею'],

  [JS, `            var btn = e.target.closest('.sv-player-btn');
            if (btn) {
                e.preventDefault();
                window.location.href = partnersPage;
            }`,
       `            var compact = e.target.closest('.sv-compact');
            if (compact) {
                e.preventDefault();
                window.location.href = partnersPage;
            }`,
   'обработчик больше не перехватывает переход'],

  [JS, `            html += '<div class="sv-carousel-pass"' +
                (pass ? ' aria-hidden="true"' : '') + '>';`,
       `            html += '<div class="sv-carousel-pass">';`,
   'клон ленты виден глазу и не виден дереву доступности'],

  [CSS, `.sv-player-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;`,
        `.sv-player-top {
    display: flex;
    align-items: flex-start;`,
   'верх карточки игрока — РЯД, а не два угла'],

  [CSS, `    padding-block: var(--space-3);
    margin-block: calc(-1 * var(--space-3));`,
        `    padding-block: 0;`,
   'цель нажатия у «Все корты» — высотой, а место в потоке возвращено'],

  [CSS, `.sv-player-btn {
    width: 100%;
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--btn-h-md);`,
        `.sv-player-btn {
    width: 100%;
    margin-top: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;`,
   'обе кнопки стоят на ступени шкалы, а не на полях'],

  [CSS, `    /* было --text-dim: 3.21 при норме 4.5 */
    color: var(--text-muted);`,
        `    color: var(--text-dim);`,
   'тихого текста 3.21 на странице не осталось'],

  [CSS, `@media (prefers-reduced-motion: reduce) {`,
        `@media (prefers-reduced-motion: no-preference-staroe) {`,
   'движение — с разрешения'],

  [CSS, `.sv-compact:focus-visible,`, `.sv-compact-staroe:focus-visible,`,
   'у страницы есть своё кольцо фокуса'],

  [CSS, `.sv-featured-content h3 {
    font-size: var(--fs-md);`,
        `.sv-featured-content h3 {
    font-size: var(--fs-lg);`,
   'лестница: заголовок колонки ВЫШЕ имени главной карточки'],

  [JS, `heroDesc: 'Courts, coaches and hitting partners',`,
       `heroDesc: 'Best courts and professional coaches in Kyrgyzstan',`,
   'подзаголовок обложки переведён на все три языка'],

  [EN, `services.css?v=`, `services.css?v=1`,
   'страница подключает свои файлы одной версией на три языка'],

  /* ── витрина игроков и скорость ленты, 07.10 ───────────────────────── */

  [CSS, `        grid-template-columns: repeat(2, minmax(0, 1fr));`,
         `        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));`,
   'на телефоне витрина игроков — ДВЕ в ряд'],

  /* Откат возвращает ровно прежнюю ошибку: телефонное правило стоит ВЫШЕ
     объявлений компонента. Переименование тут ничего бы не доказало —
     правило про ПОРЯДОК, значит и откат должен двигать блок. */
  [CSS, `.sv-player {
    position: relative;`,
         `@media (max-width: 640px) {
    .sv-players-box {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.sv-player {
    position: relative;`,
   'блок телефона стоит ПОСЛЕ объявлений компонента — порядок решает'],

  [CSS, `        scroll-snap-type: x mandatory;`, `        scroll-snap-type: none;`,
   'витрина игроков лёжа — полоса с прилипанием, как новости лендинга'],

  [CSS, `    .sv-players-box[data-vidno] > .sv-player:nth-child(n) {
        display: flex;`,
         `    .sv-players-box[data-vidno] > .sv-player:nth-child(n) {
        display: grid;`,
   'в ленте лёжа показываются ВСЕ — цепкость та же, побеждает порядком'],

  [CSS, `.sv-players-box[data-vidno="6"] > .sv-player:nth-child(n+7),`,
         `.sv-players-box[data-vidno="6"] > .sv-player:nth-child(n+8),`,
   'потолок витрины — ровно два ряда при любом числе колонок'],

  [JS, `                box.setAttribute('data-vidno', String(колонок * 2));`,
        `                box.setAttribute('data-vidno', String(колонок));`,
   'колонки считает js и пишет их числом, а не числом карточек'],

  [JS, `                new ResizeObserver(пересчитать).observe(box);`,
        `                window.addEventListener('resize', пересчитать);`,
   'пересчёт висит на ResizeObserver, а не на resize окна'],

  [CSS, `    animation: svScroll calc(var(--sv-shag) * var(--sv-karto4ek)) linear infinite;`,
         `    animation: svScroll 90s linear infinite;`,
   'скорость ленты — время на КАРТОЧКУ, а не время на ленту'],

  [CSS, `    .sv-carousel {
        --sv-shag: 11s;
    }`,
         `    .sv-carousel {
        --sv-shag: 9s;
    }`,
   'узкие виды едут 11 с на карточку, телефон лёжа — снова 9'],

  [JS, `                car.style.setProperty('--sv-karto4ek', String(count));`,
        `                car.style.animationDuration = (count * 12) + 's';`,
   'js сообщает ленте только число карточек ОДНОГО прохода'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-uslugi.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

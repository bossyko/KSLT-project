/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ АДМИНКИ «НОВОСТИ» ОТКАТОМ.
 *
 * Каждое правило check-admin-novosti.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ: оригиналы не трогаются.
 *
 *   node tools/check-admin-novosti-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-admin-novosti-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ADM = 'css/admin.css';
const NJS = 'js/admin/sections/news.js';
const EJS = 'js/admin/core/editor.js';
const CJS = 'js/admin/core/constants.js';
const HTM = 'pages/admin.html';
const UJS = 'js/admin/core/utils.js';

const ОТКАТЫ = [

  [NJS, `        zone.innerHTML = oblozhkaSplitHtml(src);`,
        `        zone.innerHTML = '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adNewsImgPreview">';`,
   'обложка новости показывается двумя коробами, а не одним'],

  [NJS, `'<div class="ad-afisha-split ad-afisha-split--novost">'`,
        `'<div class="ad-novost-split">'`,
   'короба обложки берут компонент афиши турнира, а не заводят свой'],

  [ADM, `    aspect-ratio: 10 / 3;`,
        `    aspect-ratio: 16 / 9;`,
   'короб шапки ШИРЕ короба карточки — заморожено отношение, не число'],

  [ADM, `    aspect-ratio: 16 / 9;
    object-fit: contain;`,
        `    aspect-ratio: 16 / 9;
    object-fit: cover;`,
   'шапка РЕЖЕТ, карточка ВПИСЫВАЕТ'],

  [ADM, `    object-fit: cover;
    border-radius: 0;
    transform: scale(1.1);`,
        `    object-fit: cover;
    border-radius: 0;
    transform: none;`,
   'превью шапки повторяет приближение страницы'],

  [ADM, `.ad-afisha-split--novost { --afisha-h: 160px; }`,
        `.ad-afisha-split--novost { --afisha-h: 164px; }`,
   'высота пары — одна крутилка, и на узком виде ступень ниже'],

  [CJS, `        newsImgCapHero: 'Вверху страницы новости',`,
        `        newsImgCapHero: 'Карточка в списке',`,
   'у каждого короба своя подпись, и подписи разные'],

  [NJS, `                newsImageOriginalFile = null;
                newsImageOriginalUrl = '';`,
        `                newsImageOriginalFile = null;`,
   'снятие обложки уносит и исходник'],

  [NJS, `                newsImageOriginalUrl = url;`,
        `                newsImageUrl = url;`,
   'вставка обложки ссылкой задаёт и исходник'],

  [NJS, `                zone.innerHTML = oblozhkaPustoHtml();`,
        `                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div>' + L.uploadImage + '</div>' +
                    '</div>';`,
   'пустое окно обложки описано один раз'],

  [NJS, `            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsImage + '</div>' +`,
        `            '<div class="ad-form-card ad-news-meta-preview"><span id="adMetaDate"></span></div>' +
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsImage + '</div>' +`,
   'порядок блоков формы = порядок, в котором читают страницу'],

  [NJS, `                '<div class="ad-form-card-title">' + L.newsPublication + '</div>' +
`,
        ``,
   'безымянных блоков в форме не осталось'],

  [ADM, `.ad-news-meta-preview .ad-news-meta-row {
    margin-top: var(--space-3);
}`,
        `.ad-news-meta-preview {
    padding: 10px 16px;
}`,
   'полоске меты не задано своё поле мимо шкалы'],

  [NJS, `        container.innerHTML = '<div class="news-article-page">' +`,
        `        container.innerHTML = '<div class="ad-news-preview-wrap">' +`,
   'предпросмотр несёт классы страницы, а не свои'],

  /* ЯКОРЬ БЕЗ НОМЕРА ВЕРСИИ: с номером откат умер на первой же правке
     css — версия поднялась, и якорь перестал находиться. */
  [HTM, `"../css/news.css`,
        `"../css/news-ne-podklyuchen.css`,
   'стили статьи подключены в админку и идут ПОСЛЕ admin.css'],

  [ADM, `.ad-afisha-ramka {`,
        `.ad-prev-carousel { margin: var(--space-4) 0; }
.ad-afisha-ramka {`,
   'второй вёрстки галереи в админке не осталось'],

  [NJS, `            ряд.className = 'news-thumbs-row';`,
        `            ряд.className = 'ad-thumbs-row';`,
   'карусель предпросмотра — компонент страницы'],

  [ADM, `    padding: 0 var(--space-sm);
    border: 0;
    border-radius: 0;`,
        `    padding: 0 var(--space-sm);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-full);`,
   'языковая вкладка подчёркивается, а не наливается таблеткой'],

  [ADM, `    box-shadow: inset 0 -2px 0 var(--accent);`,
        `    background: rgba(204, 255, 0, 0.1);`,
   'активная вкладка подчёркнута, а не залита'],

  [ADM, `    font-size: var(--fs-sm);
    font-weight: var(--fw-medium);`,
        `    font-size: var(--fs-xs);
    font-weight: 600;`,
   'кегль и вес вкладки взяты у компонента, а не выбраны'],

  [ADM, `    /* Черта, по которой стоят вкладки: без неё подчёркивание активной
       висит в пустоте */
    border-bottom: 1px solid var(--border-subtle);
`,
        ``,
   'у полосы вкладок есть черта, по которой они стоят'],

  [ADM, `       держит height, не она */
    line-height: var(--lh-snug);`,
        `       держит height, не она */
    line-height: 1.2;`,
   'межстрочный однострочного поля стоит на ступени лестницы'],

  [ADM, `.ad-field-hint {
    font-size: var(--fs-xs);
    color: var(--text-muted);`,
        `.ad-field-hint {
    font-size: var(--fs-xs);
    color: var(--text-dim);`,
   'подсказку поля читают: цвет --text-muted, а не --text-dim'],

  [ADM, `.ad-editor-btn::after,
`,
        ``,
   'кнопка полосы редактора — ступень шкалы плюс прозрачная цель 44'],

  [ADM, `    min-height: 260px;
    max-height: 520px;
    max-width: min(80ch, 100%);`,
        `    min-height: 260px;
    max-height: 520px;`,
   'мера редактора — та же, что у статьи'],

  [NJS, `    var ПРЕДЕЛ_ОПИСАНИЯ = 240;`,
        `    var ПРЕДЕЛ_ОПИСАНИЯ = 680;`,
   'у подзаголовка есть предел и живой счётчик остатка'],

  [EJS, `                A.showToast('Не разобрал ссылку. Нужна ссылка на ОДНУ публикацию: ' +`,
        `                alert('Не разобрал ссылку. Нужна ссылка на ОДНУ публикацию: ' +`,
   'редактор не зовёт системные окна браузера'],

  /* Откат возвращает ПРЕЖНЕЕ ПОВЕДЕНИЕ — чистку, срезающую классы целиком.
     Якорь без обратных косых: в шаблонной строке `\\s` превращается в `s`,
     и первый вариант этого отката не нашёл ровно поэтому. */
  [UJS, `        h = оставитьСвоиКлассы(h);
        h = h.replace(/<\\/?span[^>]*>/gi, '');
        h = h.replace(/<\\/?font[^>]*>/gi, '');
        h = h.replace(/<div>/gi, '<p>').replace(/<\\/div>/gi, '</p>');`,
        `        h = h.replace(/\\s*class="[^"]*"/gi, '');
        h = h.replace(/<\\/?span[^>]*>/gi, '');
        h = h.replace(/<\\/?font[^>]*>/gi, '');
        h = h.replace(/<div>/gi, '<p>').replace(/<\\/div>/gi, '</p>');`,
   'чистка при сохранении не срезает НАШИ классы'],

  [NJS, `    if (window.KSLT_VIDEO) window.KSLT_VIDEO.починитьКадры(container);`,
        `    /* кадры не чиним */`,
   'разбор ссылки на видео — одно определение на обе стороны'],

  [NJS, `data-ru="adNewsTitle" data-en="adNewsTitleEn" data-kg="adNewsTitleKg"><span aria-hidden="true">&#127760;</span>`,
        `data-ru="adNewsTitle" data-en="adNewsTitleEn" data-kg="adNewsTitleKg">&#127760; <span>`,
   'значок и подпись кнопки перевода — два узла, и зазор живой'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-admin-novosti.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

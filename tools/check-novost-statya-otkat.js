/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СТРАНИЦЫ НОВОСТИ ОТКАТОМ.
 *
 * Каждое правило check-novost-statya.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ: оригиналы не трогаются.
 *
 *   node tools/check-novost-statya-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-novost-statya-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/news.css';
const СТИ = 'css/style.css';
const JS  = 'js/news.js';

const ОТКАТЫ = [

  [CSS, `    --oblozhka-potolok: min(46vh, 420px);`,
         `    --oblozhka-potolok: 420px;`,
   'у обложки статьи нет пола — только потолок долей окна'],

  [CSS, `    .news-statya-hero { --oblozhka-potolok: 30vh; }`,
         `    .news-statya-hero { --oblozhka-potolok: 46vh; }`,
   'на низком горизонтальном экране потолок обложки ниже'],

  [CSS, `    width: 100%;
    height: auto;
    max-height: var(--oblozhka-potolok);`,
         `    width: 100%;
    height: 420px;
    max-height: var(--oblozhka-potolok);`,
   'высоту обложки даёт содержимое, а не число'],

  [CSS, `    max-height: var(--oblozhka-potolok);
    object-fit: cover;`,
         `    max-height: var(--oblozhka-potolok);
    object-fit: fill;`,
   'потолок режет кадр по центру, а не по краю'],

  [CSS, `.news-statya-hero h1 {
    font-size: var(--fs-hero);`,
         `.news-statya-hero h1 {
    font-size: clamp(1.8rem, 4.5vw, 3rem);`,
   'заголовок статьи — ступени шкалы, а не плавающий кегль'],

  [CSS, `.news-subtitle {
    font-size: var(--fs-hero-sub);`,
         `.news-subtitle {
    font-size: var(--fs-md);`,
   'подзаголовок стоит на крутилке того же семейства'],

  [CSS, `.news-paragraph {
    font-size: var(--fs-md);
    line-height: var(--lh-relaxed);`,
         `.news-paragraph {
    font-size: var(--fs-md);
    line-height: 1.8;`,
   'веса и межстрочные берутся из системы, а не числом'],

  [CSS, `    --statya-kolonka: min(calc(80ch + 2 * var(--gutter)), 100%);`,
         `    --statya-kolonka: min(80ch, 100%);`,
   'мера строки считается по коробке содержимого'],

  [CSS, `.news-reactions {
    max-width: var(--statya-kolonka);`,
         `.news-reactions {
    max-width: 900px;`,
   'мера объявлена один раз и достаётся всем, кто её несёт'],

  [JS, `                    (article.ownCover ? '<img class="news-znak" src="../images/kslt-logo.svg" alt="" aria-hidden="true">' : '') +`,
       `                    /* откат: на витрине знака нет */`,
   'знак нашей подмены стоит ВО ВСЕХ ТРЁХ местах и одним способом'],

  [CSS, `.news-own-cover {
    position: relative;
}`,
         `.news-own-cover {
    display: block;
}`,
   'знак своей обложки отсчитывается от своего кадра'],

  [CSS, `    font-size: var(--fs-2xs);
    font-weight: var(--fw-medium);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--space-3);`,
         `    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--space-3);`,
   'значок категории — это Badge 27:53, а не свой прямоугольник'],

  [CSS, `    width: min(100%, calc(var(--galereya-potolok) * var(--kadr-shirina-k, 1.3333)));`,
         `    width: 100%;`,
   'коробка галереи берёт отношение первого кадра'],

  [JS, `    отношениеКоробки(wrap, photos[0]);`,
       `    /* откат: отношение не снимаем */`,
   'отношение снимается с ПЕРВОГО кадра, и его ставит js'],

  [CSS, `    justify-content: center;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    overflow: hidden;`,
         `    justify-content: center;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    overflow: hidden;`,
   'подложка галереи — ступень выше карточки'],

  [CSS, `    height: 64px;
    aspect-ratio: var(--kadr-shirina-k, 1.3333);`,
         `    height: 64px;
    flex-basis: 88px;`,
   'миниатюра берёт то же отношение, что главный кадр'],

  [CSS, `.news-carousel-next { right: var(--space-3); }`,
         `.news-carousel-next { right: var(--space-3); }
@media (max-width: 640px) { .news-carousel-nav { width: 36px; height: 36px; } }`,
   'стрелки карусели — 44 на всех видах'],

  [JS, `    листалкаМиниатюр(wrap);`,
       `    листалкаМиниатюр(wrap);
    setInterval(function () { show(index + 1); }, 9000);`,
   'движения в карусели нет вовсе'],

  [JS, `    собратьПобедителей(container);`,
       `    /* откат: список не собираем */`,
   'список победителей собирается настоящим списком'],

  [JS, `            if (ход.filter(медаль).length < 3) { ход = []; return; }`,
       `            if (ход.filter(медаль).length < 1) { ход = []; return; }`,
   'порог эвристики — не меньше трёх значков места'],

  [JS, `var ДЛИНА_СТРОКИ_СПИСКА = 60;`,
       `var ДЛИНА_СТРОКИ_СПИСКА = 600;`,
   'в список идут только короткие строки'],

  [CSS, `    .news-pobediteli { columns: 1; }`,
         `    .news-pobediteli { columns: 2; }`,
   'список идёт в две колонки, а на 640 — в одну'],

  [CSS, `    column-span: all;`,
         `    column-span: none;`,
   'заголовок категории на всю ширину, а строка не разорвана'],

  [CSS, `.news-html .news-pobediteli-gruppa {`,
         `.news-pobediteli-gruppa {`,
   'уровень заголовка категории объявлен один раз, с родителем в селекторе'],

  [CSS, `    color: var(--text-secondary);
    font-family: inherit;
    background: var(--bg-card);`,
         `    font-family: inherit;
    background: var(--bg-card);`,
   'цвет текста кнопки оценки берётся из токена, а не от браузера'],

  [СТИ, `.kslt-back::after {`, `.kslt-back::after-было {`,
   'цель нажатия «назад» даётся прозрачным слоем, а не высотой'],

  [CSS, `    height: 44px;
    padding: 0 var(--space-4);`,
         `    padding: var(--space-2) var(--space-4);`,
   '«Афиша целиком» держит высоту свойством, а не полями'],

  [JS, `        overlay.setAttribute('role', 'dialog');`,
       `        /* откат: окно не объявляет себя окном */`,
   'просмотрщик объявляет себя окном'],

  [CSS, `.news-carousel-kadr:focus-visible {`, `.news-carousel-kadr-было:focus-visible {`,
   'крупный кадр галереи — кнопка, а не картинка'],

  [JS, `    открытьСКлавиатуры(container);`,
       `    /* откат: с клавиатуры не открыть */`,
   'снимок в тексте открывается с клавиатуры'],

  [JS, `        if (закрыть) закрыть.focus();`,
       `        /* откат: фокус в окно не въезжает */`,
   'фокус въезжает в окно и возвращается тому, кто его открыл'],

  [JS, `            if (e.key !== 'Tab') return;`,
       `            if (e.key !== 'Tab' || true) return;`,
   'у окна есть ловушка Tab'],

  [CSS, `    transition: border-color 0.2s, background 0.2s;
    text-align: left;`,
         `    transition: all 0.2s;
    text-align: left;`,
   '`transition: all` в файле нет'],

  [JS, `                renderNetPerevoda(article);`,
       `                renderNotFound();`,
   'статья без перевода показывает пустое состояние, а не «не найдено»'],

  [JS, `        noTranslationText: "Здесь появится перевод, когда редакция его опубликует. Пока новость есть только по-русски.",`,
       `        noTranslationText2: "откат",`,
   'пустое состояние говорит, что здесь появится, и ведёт на русскую версию'],

  [JS, `'<ul class="news-tekst-spisok news-animate" style="'`,
       `'<ul class="news-list news-animate" style="'`,
   'вставка-список в тексте и витрина списка не делят одно имя'],

  [CSS, `.news-thumbs-row.news-thumbs-fits .news-thumbs-nav { display: none; }`,
         `.news-thumbs-row.news-thumbs-fits .news-thumbs-nav { display: none; }
.news-html figure:has(> img) img { width: 100%; }`,
   'фото в тексте описано один раз'],

];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-novost-statya.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

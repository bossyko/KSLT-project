/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СТРАНИЦЫ ИГРОКА ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что
 * оно зелёное всегда. Каждое правило check-stranica-igroka.js проверяем
 * обратным ходом — возвращаем прежнее значение, и ИМЕННО ТО правило
 * обязано упасть. Работаем на КОПИИ, оригиналы не трогаем.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ БЛОКА, а не на порядке в списке, не на
 * номере версии и не на соседе, который может уехать.
 *
 *   node tools/check-stranica-igroka-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-igrok-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/player.css';
const JSФ = 'js/player.js';
const RU  = 'pages/player.html';
const ГРФ = 'js/rating-chart.js';
const ПРВ = 'js/kslt-rules.js';
const EN  = 'pages/player-en.html';

const ОТКАТЫ = [
  /* ── одна мера страницы ── */
  [CSS, '.pp-hero,\n.pp-container { --pp-gutter: 24px; }',
        '.pp-hero { --pp-gutter: 24px; }\n.pp-container { --pp-gutter: 20px; }',
   'боковое поле страницы — одно определение на обе коробки'],

  [CSS, '    margin: 0 auto;\n    padding: 0 var(--pp-gutter);\n}',
        '    margin: 0 auto;\n}',
   'шапка и тело держат поле ВНУТРИ своих 900'],

  /* ── воздух над заголовками ── */
  [CSS, '    margin-top: var(--space-10);\n    margin-bottom: 20px;',
        '    margin-top: 36px;\n    margin-bottom: 20px;',
   'межсекционный воздух стоит на ступени шкалы'],

  [CSS, '.pp-container > .pp-section-title:first-child {\n    margin-top: 0;\n}',
        '.pp-header + .pp-section-title {\n    margin-top: 0;\n}',
   'у первого заголовка воздух не удваивается'],

  /* ── один уровень — одно объявление ── */
  [CSS, '.pp-pair-title,\n.pp-cat-name {',
        '.pp-cat-name {\n    font-size: var(--fs-base);\n    font-weight: 700;\n}\n.pp-pair-title {',
   'название блока внутри раздела объявлено один раз на два класса'],

  /* ── цифра показателя ── */
  [CSS, '    .pp-stat-num { font-size: var(--fs-md); }',
        '    .pp-stat-num-net { font-size: var(--fs-md); }',
   'цифра показателя на телефоне строго мельче, чем на широких видах'],

  [CSS, '    color: var(--text-muted);\n    font-size: var(--fs-xs);\n    text-transform: uppercase;',
        '    color: var(--text-muted);\n    font-size: var(--fs-lg);\n    text-transform: uppercase;',
   'цифра показателя строго крупнее своей подписи'],

  [CSS, '    color: var(--text-muted);\n    font-size: var(--fs-xs);\n    text-transform: uppercase;\n    letter-spacing: 0.04em;',
        '    color: var(--text-dim);\n    font-size: var(--fs-xs);\n    text-transform: uppercase;\n    letter-spacing: 0.04em;',
   'подпись показателя не красится краской ниже порога AA'],

  /* ── лестница заголовков ── */
  [CSS, '.pp-name {\n    font-size: var(--fs-2xl);',
        '.pp-name {\n    font-size: var(--fs-lg);',
   'имя игрока строго крупнее заголовка раздела'],

  [CSS, '    line-height: 1.1;\n    letter-spacing: -0.02em;',
        '    line-height: 1.5;\n    letter-spacing: -0.02em;',
   'межстрочный заголовков — ступень, а не общие 1.5'],

  [CSS, '    font-weight: 700;\n    color: var(--text-primary);\n}',
        '    font-weight: 800;\n    color: var(--text-primary);\n}',
   'вес берётся из системы 400·500·600·700'],

  /* ── имя игрока — заголовок ── */
  [JSФ, "'<h1 class=\"pp-name\">'",
        "'<div class=\"pp-name\">'",
   'имя игрока — заголовок первого уровня'],

  /* ── полоса «Назад» ── */
  [CSS, '.kslt-back-wrap.pp-back-float::before {\n    content: none;\n}',
        '.kslt-back-wrap.pp-back-float-net::before {\n    content: none;\n}',
   'полоса «Назад» на этой странице не рисует вторую подложку'],

  /* ── отсечка ── */
  [JSФ, "    var lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');",
        "    var lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');\n    var СТРОК_СРАЗУ = 10;",
   'страница зовёт общую отсечку, а не заводит свою'],

  [EN, '<script src="../js/kslt-otsechka.js?v=1"></script>',
       '<script src="../js/kslt-otsechka-net.js?v=1"></script>',
   'общий механизм подключён на всех трёх языках'],

  [JSФ, 'window.KSLT_OTSECHKA.кнопка(past.length, lang)',
        'window.KSLT_OTSECHKA.кнопка(past.length)',
   'кнопка отсечки берёт язык страницы, а не русский по умолчанию'],

  /* ── строка матча ── */
  [CSS, '    grid-template-columns: 80px 190px minmax(0, 1fr) 96px 44px 48px;',
        '    grid-template-columns: 80px 190px minmax(0, 1fr) 96px 44px 48px;\n    grid-template-columns: 80px 190px minmax(0, 1fr) 96px 44px 48px;',
   'строка матча — один шаблон колонок на все состояния'],

  /* ── цель нажатия, фокус, движение ── */
  [CSS, '.pp-match-h2h::after,',
        '.pp-match-h2h-net::after,',
   'мелкие кнопки добирают цель нажатия 44 прозрачным слоем'],

  [CSS, '.pp-tournament:focus-visible,\n.h2h-close:focus-visible,',
        '.pp-tournament:focus-visible,',
   'видимый фокус есть, и не у одного элемента'],

  // якорь на ОДИН из четырёх блоков: перечисление встречается трижды с
  // одними и теми же долями, поэтому берём соседнюю строку в придачу
  [CSS, '    transition: background-color 0.2s ease,',
        '    transition: all 0.2s ease; /*',
   'переходы перечислены поимённо, а не «all»'],

  
  /* ── окно H2H ── */
  [JSФ, "        overlay.setAttribute('role', 'dialog');",
        "        overlay.className = 'h2h-overlay';",
   'окно H2H называет себя окном'],

  [JSФ, "        overlay.addEventListener('keydown', ловушка);",
        "        overlay.addEventListener('keydown', function(){});",
   'окно держит Tab внутри и возвращает фокус туда, откуда позвали'],

  /* ── портрет ── */
  /* 15.10 (B3 круг 1): число стало именем — якорь переведён следом.
     ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ: тихая рамка портрета против акцента. */
  [CSS, '    border: var(--bw-heavy) solid var(--alpha-white-08);',
        '    border: var(--bar-accent) solid var(--accent);',
   'портрет не берёт ни акцент, ни цвет статуса'],

  /* ── мёртвое ── */
  /* 14.10 (B2): комментарий ушёл вместе со снесёнными соседями. Якорь — на
     живом блоке отсечки, которому эта кнопка и принадлежала. */
  [CSS, '.pp-badges-expand::after{',
        '.pp-show-all-btn { display: block; }\n.pp-badges-expand::after{',
   'мёртвой кнопки отсечки в файле нет'],

  /* ── версии ── */
  /* 13.10: якорь держался за НОМЕР версии — его поднимает каждая правка.
     Ту же беду ловили 09.10 у двух чужих откатов. Держимся за ИМЯ ФАЙЛА. */
  [RU, '<link rel="stylesheet" href="../css/player.css?v=',
       '<link rel="stylesheet" href="../css/player.css?v=9',
   'версия player.css одна на все три языка'],

  /* 13.10: якорь держался за НОМЕР версии. Держимся за имя файла. */
  [RU, '<script src="../js/player.js?v=',
       '<script src="../js/player.js?v=9',
   'версия player.js одна на все три языка'],

  /* ЯКОРЬ ДЕРЖИТСЯ НА ИМЕНИ, А НЕ НА НОМЕРЕ ВЕРСИИ: номер поднимается
     при каждой правке файла, и якорь на нём отваливается сам собой. */
  [RU, 'href="../css/kslt-otsechka.css?v=',
       'href="../css/kslt-otsechka.css?v=9',
   'версия kslt-otsechka.css одна на все три языка'],

  /* ── лестница категорий ── */
  [ПРВ, 'R.поСилеКатегорий = function (а, б) {',
        'R.поСилеКатегорийДругая = function (а, б) {',
   'правило силы категорий объявлено ровно один раз'],

  [JSФ, "select('id, name, name_en, name_kg, sort_order')",
        "select('id, name, name_en, name_kg')",
   'страница игрока строит карточки по ступени, а не по очкам'],

  [ГРФ, 'return window.KSLT_RULES.поСилеКатегорий(cats[a], cats[b]);',
        'return ((cats[b] && cats[b].sort) || 0) - ((cats[a] && cats[a].sort) || 0);',
   'график линий зовёт общее правило, а не сравнивает ступень руками'],

  /* ── легенда графика ── */
  [ГРФ, 'fillStyle: ds.borderColor,',
        'fillStyle: ds.pointBackgroundColor,',
   'запись легенды собирается сама и красится цветом линии'],

  [ГРФ, 'color: ЦВЕТ_ПОДПИСИ, usePointStyle: true',
        "color: '#ccc', usePointStyle: true",
   'подпись легенды названа одним именем, а не двумя числами'],

  /* ── парные игры видны и напарнику ── */
  [JSФ, ".eq('partner_id', pid)",
        ".eq('player_id', pid)",
   'матчи берутся и там, где за пару записан капитан'],

  [JSФ, ".or('player_id.eq.' + _playerId + ',partner_id.eq.' + _playerId)",
        ".eq('player_id', _playerId)",
   'турниры берутся и по заявке напарником'],

  [JSФ, 'var isP1 = m.player1_id === мойКапитан;',
        'var isP1 = m.player1_id === _playerId;',
   'своя сторона считается от капитана пары, а не от самого игрока'],

  /* ── одни слова со страницей кабинета ── */
  [JSФ, "var словоВПаре = isEn ? 'with' : (isKg ? 'жупташы' : 'в паре с');",
        "var словоВПаре = isEn ? 'with' : (isKg ? 'жуптук' : 'в паре с');",
   'слова «в паре с» на странице и в кабинете одни и те же'],

  /* ── строка напарника ── */
  [CSS, '    white-space: nowrap;\n    font-size: var(--fs-2xs);\n    line-height: 1.3;\n    color: var(--text-muted);',
        '    white-space: nowrap;\n    font-size: var(--fs-xs);\n    line-height: 1.3;\n    color: var(--text-muted);',
   'строка напарника строго мельче названия турнира'],

  [CSS, '.pp-match-mate-name {\n    color: var(--text-secondary);',
        '.pp-match-mate-name {\n    color: var(--text-dim);',
   'строка напарника не красится в --text-dim'],

  /* ── пара соперников ── */
  [CSS, '.pp-match-opponent-pair {',
        '.pp-match-opponent-dvoe {',
   'у пары соперников рисуются оба, а не один за двоих'],

  [CSS, '    margin-left: -8px;\n    box-shadow: 0 0 0 2px var(--bg-primary);',
        '    margin-left: -5px;\n    box-shadow: 0 0 0 2px var(--bg-primary);',
   'нахлёст кружков стоит на ступени шкалы'],

  /* ── кружок без фотографии ── */
  [JSФ, "        return фото\n            ? '<img src=\"' + esc(фото) + '\" alt=\"' + esc(имя || '') + '\" class=\"' + кл + '\">'",
        "        return фото\n            ? '<img src=\"' + esc(фото) + '\" class=\"pp-match-opponent-photo\" alt=\"\">'",
   'кружок игрока строится ОДНИМ местом'],

  /* 13.10: откат держался за САМУ ФОРМУЛУ, а она переехала в общий модуль
     js/kslt-lico.js. Роняем ОТНОШЕНИЕ: страница перестала звать общее
     правило и завела своё. */
  [JSФ, 'function инициалыИмени(имя) { return window.KSLT_LICO.инициалы(имя); }',
        "function инициалыИмени(имя) { return String(имя || '').charAt(0); }",
   'инициалы страницы игрока и кабинета считает одно правило'],

  [CSS, '    background: var(--alpha-white-08);\n    color: var(--text-secondary);',
        '    background: var(--alpha-white-08);\n    color: var(--accent);',
   'портрет не берёт ни акцент, ни цвет статуса'],

  /* 13.10: якорь держался за ЧИСЛО прозрачности лайма — она переехала на
     шкалу токенов. Держимся за токен. */
  [CSS, '    background: var(--alpha-lime-12);\n    color: var(--accent);\n    font-size: var(--fs-sm);',
        '    background: var(--alpha-lime-12);\n    color: var(--text-dim);\n    font-size: var(--fs-sm);',
   'буквы в кружке читаемы и весом из системы'],

  [RU, '<script src="../js/kslt-otsechka.js?v=1"></script>',
       '<script src="../js/kslt-otsechka.js?v=2"></script>',
   'версия kslt-otsechka.js одна на все три языка']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-stranica-igroka.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = String(e.stdout || '');
    return текст.split('\n').filter(с => с.trim().startsWith('✗')).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

let плохо = 0;
console.log('');
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

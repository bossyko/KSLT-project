/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ РАЗДЕЛА #live ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило может быть написано так, что
 * оно зелёное всегда. Каждое правило check-live.js проверяем обратным ходом:
 * возвращаем прежнее значение — правило ОБЯЗАНО упасть.
 *
 * Работаем на КОПИИ. Оригиналы не трогаем вообще.
 *
 *   node tools/check-live-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'index.html', 'index-en.html', 'index-kg.html',
               'js/rankings-data.js', 'js/battle-cards.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-live.js'), 'utf8');

/* [имя, файл, что ищем, на что меняем, какое правило должно упасть] */
const ОТКАТЫ = [
['вернуть секции плавающий clamp', 'css/style.css',
 '--section-vozduh: var(--space-10);   /* 40 */\n    padding: var(--section-vozduh) var(--pad-x);',
 'padding: var(--section-y-sm) var(--pad-x);',
 'воздух секции задаёт крутилка --section-vozduh'],

['добавить второе объявление padding у section', 'css/style.css',
 '\nsection:not(.hero) {',
 '\nsection {\n    padding: 20px var(--pad-x);\n}\n\nsection:not(.hero) {',
 'вертикальную отбивку секции задаёт ровно одно объявление'],

/* ТОТ САМЫЙ ОТКАТ, которого не хватало 22.09: сокращённая запись внутри
   медиазапроса. Правило её не видело, поймал Playwright. */
['вернуть сырой padding внутрь @media 768 — ТОТ, что я проглядел', 'css/style.css',
 '        padding-inline: var(--pad-x);',
 '        padding: 40px 26px;',
 'вертикальную отбивку секции задаёт ровно одно объявление'],

['опустить сенсорный слой ниже телефонного', 'css/style.css',
 '        --section-vozduh: var(--space-10);   /* 40 */\n    }\n}\n\n/* ====',
 '        --section-vozduh: var(--space-10);\n    }\n}\n\n@media (any-pointer: coarse) and (max-height: 820px) {\n    section { --section-vozduh: var(--space-6); }\n}\n\n/* ====',
 'слой телефона стоит НИЖЕ сенсорного'],

['сменить воздух телефона', 'css/style.css',
 '        --section-vozduh: var(--space-10);   /* 40 */\n    }\n}\n\n/* ====',
 '        --section-vozduh: var(--space-6);\n    }\n}\n\n/* ====',
 'телефонный слой задаёт воздух 40'],

['вернуть --section-y-sm в базовый section', 'css/style.css',
 '--section-vozduh: var(--space-10);   /* 40 */\n    padding: var(--section-vozduh) var(--pad-x);',
 '--section-vozduh: var(--section-y-sm);\n    padding: var(--section-vozduh) var(--pad-x);',
 'section больше не берёт --section-y-sm'],

['вернуть ноутбучному слою прежний воздух', 'css/style.css',
 '--section-vozduh: var(--space-8);   /* 32 */',
 '--section-vozduh: var(--space-10);',
 'ноутбучный слой сжимает воздух до 32'],

['дать ноутбучному слою собственный padding', 'css/style.css',
 '    section {\n        --section-vozduh: var(--space-8);   /* 32 */\n    }',
 '    section {\n        --section-vozduh: var(--space-8);\n        padding-top: 30px;\n    }',
 'ноутбучный слой не трогает у section ничего, кроме воздуха'],

['вернуть сенсорному слою прежний воздух', 'css/style.css',
 '--section-vozduh: var(--space-6);   /* 24 */',
 '--section-vozduh: var(--space-10);',
 'сенсорный тесный слой сжимает воздух до 24'],

['поднять сенсорный слой выше ноутбучного', 'css/style.css',
 '@media (min-width: 993px) and (max-height: 880px) {',
 '@media (any-pointer: coarse) and (max-height: 820px) {\n    .nichego {}\n}\n\n@media (min-width: 993px) and (max-height: 880px) {',
 'сенсорный тесный слой стоит НИЖЕ ноутбучного'],

['вернуть мёртвое объявление .section-header в базу', 'css/style.css',
 '\n/* Здесь было второе объявление .section-header',
 '\n.section-header {\n    margin-bottom: var(--space-lg);\n}\n\n/* Здесь было второе объявление .section-header',
 '.section-header объявлен в базе ровно один раз'],

['вернуть спорящий .section-header на телефоне', 'css/style.css',
 '    /* Здесь было .section-header { flex-direction: column }',
 '    .section-header {\n        flex-direction: column;\n        align-items: flex-start;\n    }\n\n    /* Здесь было .section-header { flex-direction: column }',
 '.section-header на телефоне объявлен один раз'],

['вернуть заголовку раздела плавающий кегль', 'css/style.css',
 'font-size: var(--fs-lg);   /* 21 */\n        font-weight: 800;          /* Extra Bold */',
 'font-size: clamp(1.15rem, 5vw, 1.32rem);\n        font-weight: 700;',
 'заголовок раздела на телефоне — 21 / Extra Bold'],

/* ЯКОРЬ БЫЛ НА .badges-cta-text h2 — чужом селекторе, который 24.09 вынесли из
   этого правила вместе с секцией значков. Откат перестал находить своё место.
   Теперь держимся за сами заголовки разделов. */
['вернуть жёсткое поле 26 вместо системного --pad-x', 'css/style.css',
 '        padding-inline: var(--pad-x);',
 '        padding-inline: 26px;',
 'поле от края экрана задаёт --pad-x, и только оно'],

/* ПЕРЕПИСАН 24.09, вечер: решение отменено Костей (доска 437:9). Блок
   «Станьте спонсором» стал разделом, получил h2 и встал в это правило
   НАМЕРЕННО. Откат теперь возвращает прежнее состояние — свой h3 вместо
   общего h2 — и должен уронить новое правило. */
['вернуть блоку спонсорам собственный h3 вместо общей ступени', 'css/style.css',
 '    .sp-offer h2,\n',
 '    .sp-offer h3,\n',
 'заголовок блока спонсорам стоит в том же правиле, а не в своём'],

['сдвинуть ряд в центр', 'css/style.css',
 '    justify-content: start;\n    gap: var(--space-md);',
 '    justify-content: center;\n    gap: var(--space-md);',
 'ряд матчей идёт слева направо'],

['вернуть карточке padding 16/18', 'css/style.css',
 'padding: var(--space-4);\n    display: flex;\n    flex-direction: column;\n    gap: 10px;',
 'padding: 16px 18px;\n    display: flex;\n    flex-direction: column;\n    gap: 10px;',
 'padding карточки — var(--space-4) (16)'],

/* Якорь ведём ОТ ИМЕНИ СЕЛЕКТОРА. 23.09 бейдж турнира тоже привели к
   компоненту Badge 27:53, и три строки геометрии стали встречаться дважды —
   откат начал править чужое правило. Прувер это поймал сам: «якорь встречается
   2 раз». Уникальность якоря держится на имени, а не на форме. */
['вернуть бейджу прежнюю форму', 'css/style.css',
 '.live-badge {\n    display: inline-flex;\n    align-items: center;\n    height: 24px;\n    padding: 0 var(--space-2);\n    border-radius: var(--radius-full);',
 '.live-badge {\n    display: inline-flex;\n    align-items: center;\n    padding: 4px 10px;\n    border-radius: var(--radius-sm);',
 'бейдж собран по компоненту Badge 27:53'],

['вернуть пульсацию всем статусам', 'css/style.css',
 '    background: var(--danger-subtle);\n    color: var(--danger);\n}',
 '    background: var(--danger-subtle);\n    color: var(--danger);\n    animation: livePulse 1.5s ease-in-out infinite;\n}',
 'в базовом бейдже нет пульсации'],

['вернуть LIVE сырой цвет вместо токена', 'css/style.css',
 '.live-badge.is-live {\n    background: var(--danger);',
 '.live-badge.is-live {\n    background: #FF3B30;',
 'пульсирует и доминирует только LIVE'],

['покрасить разминку как идущую игру', 'css/style.css',
 '.live-badge.is-warmup {\n    background: var(--warning-subtle);',
 '.live-badge.is-warmup {\n    background: var(--danger);',
 'у разминки и паузы свои тона'],

['подменить подложку аватара сырым цветом', 'css/style.css',
 '    background: var(--surface-glass-hover);\n    color: var(--text-primary);\n    font-size: var(--fs-xs);',
 '    background: #333;\n    color: #888;\n    font-size: var(--fs-xs);',
 'заглушка аватара — инициалы, кружок 32, НЕ лаймовый'],

/* 23.09: заглушка стала нейтральной на всём сайте. Откат возвращает лайм. */
['вернуть лайм в общую заглушку аватара', 'css/style.css',
 '    background: var(--surface-glass-hover);\n    color: var(--text-primary);\n    font-weight: 700;',
 '    background: var(--accent-subtle);\n    color: var(--accent);\n    font-weight: 700;',
 'заглушка аватара нигде не лаймовая'],

['вернуть турниры выше live на английской', 'index-en.html',
 '        <section id="live" class="section-live" style="display:none">',
 '        <section id="tournaments-fake"></section>\n        <section id="live" class="section-live" style="display:none">',
 'порядок секций одинаков на трёх языках'],

['вернуть сырой px в отбивку раздела', 'css/style.css',
 '.live-match {\n    background: var(--bg-card);',
 '.live-match {\n    margin-top: 7px;\n    background: var(--bg-card);',
 'в отбивках раздела нет сырых пикселей']
];

/* те же два отката, но по каждой из трёх главных — правил тоже по три */
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф => {
    ОТКАТЫ.push(['вернуть placehold.co в ' + ф, ф,
        'return фото\n                                ? ',
        "var placeholder = 'https://placehold.co/80x80/1a1a1a/888?text=?';\n                            return фото\n                                ? ",
        'в разделе live у ' + ф + ' нет запросов на чужой CDN']);
    ОТКАТЫ.push(['убрать класс тона у бейджа в ' + ф, ф,
        '\'<span class="live-badge\' + statusClass + \'">\'',
        '\'<span class="live-badge">\'',
        'бейдж в ' + ф + ' получает класс тона']);
});

/* заглушка рейтинга — та, что уронила Playwright 23.09 */
ОТКАТЫ.push(['вернуть placehold.co в СЛОЙ ДАННЫХ рейтинга', 'js/rankings-data.js',
    "photo: p.photo || null,",
    "photo: p.photo || 'https://placehold.co/80x80/1a1a1a/888?text=?',",
    'index.html и её скрипты не ходят за картинками наружу']);

ОТКАТЫ.push(['вернуть placehold.co в карточку баттла', 'js/battle-cards.js',
    "                ? '<img src=\"' + esc(src) + '\" alt=\"\">'",
    "                ? '<img src=\"' + esc(src || 'https://placehold.co/60x60/1a1a1a/666?text=?') + '\" alt=\"\">'",
    'index.html и её скрипты не ходят за картинками наружу']);

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'live-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'js'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-live.js'), ПРАВИЛО);

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-live.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-live.js.');
    console.log('          Сначала почини код, потом доказывай откатом.');
    console.log(база.вывод);
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(о => {
    const [имя, ф, что, на, ждём] = о;
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) {
        console.log('  ? ' + имя); console.log('      якоря нет в ' + ф + '. Правило НЕ доказано.'); плохих++; return;
    }
    if (сколько > 1) {
        /* 22.09: прувер первого экрана дважды отчитался «правило ничего не держит»,
           а на деле откат правил не то место — якорь встречался несколько раз. */
        console.log('  ! ' + имя); console.log('      якорь в ' + ф + ' встречается ' + сколько + ' раз — откат правит не то место.'); плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало, но ДРУГОЕ правило. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
    console.log('');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

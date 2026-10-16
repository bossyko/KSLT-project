/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ОДНО ОПРЕДЕЛЕНИЕ» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ровно то состояние, из которого беда и росла, —
 * и требует, чтобы упало ИМЕННО то правило, которое за это отвечает.
 * Якоря держатся на СОДЕРЖИМОМ: на объявлении токена, на групповом
 * селекторе, на вызове модуля, — а не на положении строки и не на
 * соседе, который может уехать.
 *
 *   node tools/check-odno-opredelenie-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = [
    'css/tokens.css', 'css/style.css', 'css/admin.css', 'css/dashboard.css',
    'css/pricing.css', 'css/sponsors.css', 'css/player.css',
    'js/kslt-mesta.js', 'js/rating-points.js', 'js/player.js',
    'js/kslt-toast.js', 'js/courts.js',
    'js/tournament-generator.js', 'js/admin/sections/bracket.js',
    'pages/player.html', 'pages/courts.html'
];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const T = 'css/tokens.css', S = 'css/style.css', A = 'css/admin.css',
      D = 'css/dashboard.css', PR = 'css/pricing.css', SP = 'css/sponsors.css',
      PC = 'css/player.css', M = 'js/kslt-mesta.js', RP = 'js/rating-points.js',
      PJ = 'js/player.js', TJ = 'js/kslt-toast.js', CJ = 'js/courts.js',
      PH = 'pages/player.html', CH = 'pages/courts.html',
      TG = 'js/tournament-generator.js', BR = 'js/admin/sections/bracket.js';

const ОТКАТЫ = [

/* ── толщина рамки ── */
['убрать шкалу толщины', T,
 '--bw-hair:  1px;',
 '--bw-volosok:  1px;',
 'шкала толщины рамки объявлена'],

['назвать полосу-метку ступенью рамки', T,
 '--bar-accent: 4px;',
 '--bw-xl: 4px;',
 'полоса-метка носит своё имя'],

['вернуть толщину числом', S,
 'border: var(--bw-hair) solid var(--border-subtle);',
 'border: 1px solid var(--border-subtle);',
 'толщина рамки всегда ступень, а не число'],

['вернуть половину пиксела в шеврон', S,
 'border-right: var(--bw-thick) solid currentColor;',
 'border-right: 1.5px solid currentColor;',
 'половины пиксела в толщине не осталось'],

/* ── семейство шрифта ── */
['завести второе объявление семейства', T,
 "  --font-sans: 'Inter',",
 "  --font-sans: 'Inter', sans-serif;\n  --font-sans: 'Inter',",
 'семейство шрифта объявлено один раз'],

['назвать семейство словами', S,
 'font-family: var(--font-sans);',
 "font-family: 'Inter', sans-serif;",
 'семейство шрифта нигде не названо словами'],

['вернуть обращение к синониму', PC,
 'font-family: var(--font-sans);',
 'font-family: var(--font-primary);',
 'синоним семейства не используется'],

['вернуть счёт матча моноширинному семейству', PC,
 '    font-family: var(--font-sans);\n    font-variant-numeric: tabular-nums;',
 "    font-family: 'Inter', monospace;",
 'ширину цифр держит свойство, а не второе семейство'],

['снять табличные цифры со счёта в панели', D,
 '    font-family: var(--font-sans);\n    font-variant-numeric: tabular-nums;\n    font-weight: 600;',
 '    font-family: var(--font-sans);\n    font-weight: 600;',
 'счёт матча просит табличные цифры'],

/* ── галочка и шеврон ── */
['убрать токены глифа', T,
 '--check-box:   16px;',
 '--chk-size:   16px;',
 'размеры глифов объявлены токенами'],

['развести чекбокс по двум определениям', S,
 '.auth-checkbox input[type="checkbox"],\n.ad-reg-check,\n.ad-reg-check-all {',
 '.auth-checkbox input[type="checkbox"] {',
 'чекбокс объявлен один раз, на обоих потребителей'],

['завести свою коробку чекбокса в админке', A,
 '.ad-reg-check,\n.ad-reg-check-all {\n    accent-color: var(--accent);',
 '.ad-reg-check,\n.ad-reg-check-all {\n    width: 16px;\n    border-radius: 3px;\n    accent-color: var(--accent);',
 'админка не заводит своей коробки чекбокса'],

['вернуть мёртвый третий чекбокс', D,
 '/* ---- Checkbox ---- */',
 '/* ---- Checkbox ---- */\n.db-checkbox input[type="checkbox"] { width: 13px; }',
 'мёртвый третий чекбокс не вернулся'],

['вернуть подобранные пикселы вместо центрирования', S,
 'transform: translate(-50%, -60%) rotate(45deg);',
 'transform: rotate(45deg);',
 'галочка центрируется трансформом, а не пикселами'],

['развести маркер списка по трём определениям', S,
 '.sp-gives li::before,\n.pm-feats li::before,\n.sn-tier li::before {',
 '.sp-gives li::before {',
 'маркер списка объявлен один раз, на три списка'],

['вернуть свою копию маркера на страницу цен', PR,
 '/* ГАЛОЧКА-МАРКЕР ЖИВЁТ В `style.css`',
 '.pm-feats li::before {\n    width: 14px;\n}\n/* ГАЛОЧКА-МАРКЕР ЖИВЁТ В `style.css`',
 'страницы цен и спонсоров не заводят своих маркеров'],

['вернуть свою копию маркера на страницу спонсоров', SP,
 '/* ГАЛОЧКА-МАРКЕР ЖИВЁТ В `style.css`',
 '.sn-tier li::before {\n    width: 14px;\n}\n/* ГАЛОЧКА-МАРКЕР ЖИВЁТ В `style.css`',
 'страницы цен и спонсоров не заводят своих маркеров'],

['выровнять маркер пикселами', S,
 '    left: 0;\n    top: 0.35em;\n    width: var(--tick-w);',
 '    left: 0;\n    top: 6px;\n    width: var(--tick-w);',
 'выравнивание маркера — в долях кегля, а не в пикселах'],

/* ── название места ── */
['унести словарь названий места', M, null, null,
 'словарь названий места лежит в своём файле'],

['вернуть копию словаря в очки', RP,
 '    /* СЛОВАРЬ НАЗВАНИЙ МЕСТА ПЕРЕЕХАЛ',
 "    var ПОДПИСИ_СВОИ = { ru: { R16: '1/8 финала' } };\n    /* СЛОВАРЬ НАЗВАНИЙ МЕСТА ПЕРЕЕХАЛ",
 'словарь названий места объявлен один раз'],

['перестать звать словарь из очков', RP,
 'if (window.KSLT_MESTA) return window.KSLT_MESTA.подпись(язык, код);',
 'if (false) return null;',
 'очки зовут словарь, а не держат свой'],

['перестать звать словарь со страницы игрока', PJ,
 'window.KSLT_MESTA ? window.KSLT_MESTA.подпись(ЯЗЫК, код) : код',
 'код',
 'страница игрока зовёт словарь, а не держит свой'],

['снять геттер экспорта словаря раундов', RP,
 '        get ПОДПИСИ_РАУНДА() {',
 '        ПОДПИСИ_РАУНДА: {},\n        неПОДПИСИ() {',
 'экспорт словаря раундов указывает на модуль'],

['завести второе объявление занятого имени', RP,
 '    function подписьМеста(код) {',
 '    function подписьМеста(язык, код) { return код; }\n    function подписьМеста(код) {',
 'имя `подписьМеста` в очках занято одним понятием'],

/* ── уведомление ── */
['унести тело уведомления', TJ,
 'T.показать = function',
 'T.показатьОкно = function',
 'тело уведомления одно'],

['завести второй перевод тона', TJ,
 'T.тон = function',
 'T.тон = function (в) { return в; };\n    T.тон = function',
 'перевод тона объявлен один раз'],

['перестать звать модуль из кортов', CJ,
 'window.KSLT_TOAST.показать(message, { тон: window.KSLT_TOAST.тон(type) });',
 'console.log(message, type);',
 'все семь потребителей зовут модуль'],

['вернуть своё окно уведомления в корты', CJ,
 '    function showToast(message, type) {',
 "    function showToastСвой(message) {\n        var toast = document.createElement('div');\n        toast.className = 'toast';\n        document.body.appendChild(toast);\n    }\n    function showToast(message, type) {",
 'потребители не строят своего окна уведомления'],

/* ── подключение ── */
['снять подключение словаря со страницы игрока', PH,
 '<script src="../js/kslt-mesta.js?v=2"></script>\n',
 '',
 'словарь подключён везде, где его зовут'],

['снять подключение модуля уведомления со страницы кортов', CH,
 '<script src="../js/kslt-toast.js?v=2"></script>\n',
 '',
 'модуль уведомления подключён везде, где его зовут'],

/* ЯКОРЬ НА ИМЕНИ ФАЙЛА, А НЕ НА НОМЕРЕ ВЕРСИИ. Третий случай подряд:
   версия поднимается каждым куском, и откат, прибитый к `?v=2`, перестаёт
   находить свою строку молча — прувер говорит «якоря нет», а выглядит это
   как поломка правила. */
['снять стиль уведомления со страницы кортов', CH,
 'css/kslt-toast.css',
 'css/НЕТ-ТАКОГО-ФАЙЛА.css',
 'у модуля уведомления подключён его стиль'],

/* ── позиции сеяных (сведено 16.10) ── */
['завести второе объявление позиций сеяных', BR,
 '    var A = window.KSLT_ADMIN;',
 '    var A = window.KSLT_ADMIN;\n    var SEED_POSITIONS = { 8: [1, 8, 5, 4] };',
 'позиции сеяных объявлены ровно один раз'],

['вернуть чтение с запасным списком', BR,
 '        var позицииПосева = SEED_POSITIONS[размер] || [];',
 '        var позицииПосева = (typeof SEED_POSITIONS !== \'undefined\' && SEED_POSITIONS[размер])\n            ? SEED_POSITIONS[размер] : [9, 9];',
 'позиции сеяных читаются без запасного списка'],

['вернуть литерал позиций в потребителя', BR,
 '        var seedPositions = SEED_POSITIONS[drawSize] || [];\n\n        // Build draw array',
 '        var seedPositions = SEED_POSITIONS[drawSize] || [1, 16, 9, 8, 5];\n\n        // Build draw array',
 'списка позиций сеяных нет нигде, кроме его дома'],

/* ── имя переменной существует (заведено 16.10) ── */
['позвать переменную, которой нет, с запасным значением', PC,
 '.pp-hero {',
 '.pp-nesushchestvuyushchiy { gap: var(--net-takogo-tokena, 12px); }\n.pp-hero {',
 'каждая переменная в css где-то объявлена'],

['убрать сетку 4 из дома — запасных списков больше нет', TG,
 '    4:  [1, 4, 3, 2],                       // 4 сеяных',
 '',
 'в доме есть позиции для всех размеров сетки'],
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-odno-'));
['css', 'js', 'pages', 'tools', 'maket', 'index.html', 'index-en.html', 'index-kg.html']
    .forEach(д => {
        const от = path.join(КОРЕНЬ, д), до = path.join(песок, д);
        if (fs.existsSync(от)) fs.cpSync(от, до, { recursive: true });
    });

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            const цель = path.join(песок, ф);
            if (замена && замена.файл === ф && замена.текст === null) {
                /* УНЕСЁННЫЙ ФАЙЛ — тоже откат: модуль может не доехать */
                if (fs.existsSync(цель)) fs.rmSync(цель);
                return;
            }
            fs.writeFileSync(цель, замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-odno-opredelenie.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-odno-opredelenie.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    let замена;
    if (что === null) {
        замена = { файл: ф, текст: null };
    } else {
        const сколько = исходник[ф].split(что).length - 1;
        if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
        замена = { файл: ф, текст: исходник[ф].split(что).join(на) };
    }
    const р = прогон(замена);
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

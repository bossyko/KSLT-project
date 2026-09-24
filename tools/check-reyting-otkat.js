/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ РЕЙТИНГА ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее значение и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает. «У меня зелёное» ничего не доказывает.
 *
 * Якорь держится на содержимом — на том, что живёт в блоке постоянно, — а не
 * на положении и не на соседе, который может уехать.
 *
 *   node tools/check-reyting-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'css/podium.css', 'css/players.css',
               'js/home-rankings.js', 'js/players.js', 'js/script.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-reyting.js'), 'utf8');

const ОТКАТЫ = [

/* ── одно определение на одно понятие ─────────────────────────────────── */

['вернуть ленте чипов перенос строки', 'css/style.css',
 '    flex-wrap: nowrap;\n    justify-content: flex-start;\n    width: fit-content;',
 '    flex-wrap: wrap;\n    justify-content: center;\n    width: fit-content;',
 'лента чипов листается, а не переносится'],

['завести второе определение ленты чипов', 'css/style.css',
 '.rankings-tab { flex: 0 0 auto; }',
 '.rankings-tabs { gap: var(--space-3); }\n\n.rankings-tab { flex: 0 0 auto; }',
 'лента чипов объявлена ровно один раз'],

['вернуть ленте центрирование через justify-content', 'css/style.css',
 '    width: fit-content;\n    max-width: 100%;\n    margin-inline: auto;',
 '    max-width: 100%;',
 'лента центрируется шириной по содержимому, а не justify-content'],

['вернуть пьедестал внутрь стилей страницы рейтинга', 'css/players.css',
 '/* === FILTERS === */',
 '.pl-podium-first .pl-podium-photo { width: 110px; }\n\n/* === FILTERS === */',
 'пьедестал живёт в отдельном файле, а не в стилях страницы'],

/* ── вкладка = Filter chip 49:77 ──────────────────────────────────────── */

['вернуть вкладке самодельную высоту 32', 'css/style.css',
 '    min-height: var(--btn-h-sm);          /* 36 */',
 '    min-height: 32px;',
 'вкладка берёт высоту, поля и кегль у компонента Filter chip 49:77'],

['снять с вкладки замеренный межстрочный', 'css/style.css',
 '    line-height: var(--lh-snug);\n    border: 1px solid var(--border-light);',
 '    border: 1px solid var(--border-light);',
 'у вкладки есть ЗАМЕРЕННЫЙ межстрочный'],

['вернуть вкладке transition: all', 'css/style.css',
 '    transition: background-color 0.2s ease, border-color 0.2s ease,\n                color 0.2s ease;',
 '    transition: all 0.2s ease;',
 'переход вкладки идёт только по цветам, а не по всему'],

['снова сделать наведение неотличимым от выбранной', 'css/style.css',
 '.rankings-tab:hover:not(.active) {\n    color: var(--text-primary);\n    border-color: var(--accent);\n}',
 '.rankings-tab:hover {\n    background: var(--accent);\n    color: #000;\n    font-weight: 600;\n}',
 'наведение на вкладку НЕ равно выбранной вкладке'],

/* ── строка таблицы ───────────────────────────────────────────────────── */

['вернуть строке отбивку 8/10', 'css/style.css',
 '    padding: var(--space-2) var(--space-3);   /* 8 12; было 8 10 */',
 '    padding: 8px 10px;',
 'отбивка и скругление строки стоят на шкале'],

['вернуть просвет между строками на четвёрку', 'css/style.css',
 '.rk-row + .rk-row { margin-top: var(--space-2); }',
 '.rk-row + .rk-row { margin-top: 4px; }',
 'просвет между строками — ступень шкалы, а не четвёрка'],

['вернуть Δ кегль 12 в строке из 14', 'css/style.css',
 '.rk-change { text-align: center; font-size: var(--fs-sm); }',
 '.rk-change { text-align: center; font-size: var(--fs-xs); }',
 'Δ набрана тем же кеглем, что и остальные ячейки строки'],

['вернуть разрядку заголовка колонки в пикселях', 'css/style.css',
 '    letter-spacing: 0.08em;\n    text-transform: uppercase;',
 '    letter-spacing: 1.5px;\n    text-transform: uppercase;',
 'разрядка заголовка колонки задана в em, а не числом'],

/* ── туман ────────────────────────────────────────────────────────────── */

['вернуть туману счёт от начала списка', 'css/style.css',
 '.is-guest .rankings-panel .rk-row:not(.rk-head):nth-last-child(2) {',
 '.is-guest .rankings-panel .rk-row:nth-child(n+7) {',
 'туман считается ОТ КОНЦА списка, а не от начала'],

['вернуть голову таблицы под туман', 'css/style.css',
 '.is-guest .rankings-panel .rk-row:not(.rk-head):nth-last-child(1) {',
 '.is-guest .rankings-panel .rk-row:nth-last-child(1) {',
 'голова таблицы из тумана исключена'],

/* ── лайм принадлежит действию ────────────────────────────────────────── */

['вернуть лайм на номера первой тройки', 'css/style.css',
 '.rk-rank {\n    font-weight: 700;',
 '.rk-rank.top { color: var(--accent); }\n\n.rk-rank {\n    font-weight: 700;',
 'лайм снят с номеров первой тройки'],

['вернуть кольцу первого места лайм', 'css/podium.css',
 '    border: 3px solid rgba(233, 184, 36, 0.85);',
 '    border: 3px solid var(--accent);',
 'кольцо первого места золотое, а не лаймовое'],

['вернуть очкам пьедестала лайм', 'css/podium.css',
 '    color: var(--text-primary);\n    /* Число с подписью держим одной строкой',
 '    color: var(--accent);\n    /* Число с подписью держим одной строкой',
 'очки на пьедестале не лаймовые'],

/* ── пьедестал ────────────────────────────────────────────────────────── */

['вернуть таблицу к первому месту — тройка задвоится', 'js/home-rankings.js',
 '        for (var i = ПЬЕДЕСТАЛ; i < Math.min(list.length, ROWS); i++) {',
 '        for (var i = 0; i < Math.min(list.length, ROWS); i++) {',
 'таблица начинается с ЧЕТВЁРТОГО места'],

['вернуть порядок мест в разметку', 'js/players.js',
 '        var order = [0, 1, 2];',
 '        var order = [1, 0, 2];',
 'разметка пьедестала идёт по местам, порядок на экране задаёт css'],

['вернуть тумбе жёсткую высоту через ::after', 'css/podium.css',
 '.pl-podium-first .pl-podium-base {',
 '.pl-podium-first::after { height: 120px; }\n\n.pl-podium-first .pl-podium-base {',
 'тумба — коробка с содержимым, а не полоса жёсткой высоты'],

['переложить лесенку тумб обратно на верхнее поле', 'css/podium.css',
 '    padding-bottom: 56px;\n    background: linear-gradient(to top, rgba(233, 184, 36, 0.12)',
 '    padding-top: 56px;\n    background: linear-gradient(to top, rgba(233, 184, 36, 0.12)',
 'лесенку тумб держит НИЖНЕЕ поле, а не верхнее'],

['оторвать кегль инициалов от диаметра кружка', 'css/podium.css',
 '.pl-podium-first .avatar-initials { font-size: var(--fs-3xl); }',
 '',
 'кегль инициалов стоит рядом с КАЖДЫМ диаметром кружка'],

['вернуть пьедесталу на главной привязку к окну', 'css/podium.css',
 '    container-type: inline-size;\n    container-name: rk-col;',
 '    min-width: 0;',
 'на главной размер пьедестала считается от КОЛОНКИ, а не от окна'],

['отпустить имя на главной — тумбы разъедутся', 'css/podium.css',
 '    min-height: calc(2em * 1.25);',
 '    min-height: 0;',
 'имя на главной занимает ровно две строки всегда'],

/* ── движение ─────────────────────────────────────────────────────────── */

['снять с пьедестала уважение к prefers-reduced-motion', 'css/podium.css',
 '    .rk-iskra { display: none; }',
 '    .rk-iskra { opacity: 0.99; }',
 'движение пьедестала подчиняется prefers-reduced-motion'],

['сделать вспышку кольца бесконечной', 'css/podium.css',
 '    animation: rk-zoloto 1.1s ease 0.6s 2;',
 '    animation: rk-zoloto 1.1s ease 0.6s infinite;',
 'вспышка колец конечная, а не бесконечная'],

['сбить порядок вспышек в общую кучу', 'css/podium.css',
 '    animation: rk-bronza 1.1s ease 0.42s 2;',
 '    animation: rk-bronza 1.1s ease 0.6s 2;',
 'порядок вспышек повторяет порядок приезда тумб'],

['уравнять искры по местам', 'js/home-rankings.js',
 "        'pl-podium-second': { цвет: 'rgba(210, 210, 210, 0.90)', сколько: 6, пауза: 0.41 },",
 "        'pl-podium-second': { цвет: 'rgba(210, 210, 210, 0.90)', сколько: 10, пауза: 0.41 },",
 'искр у золота больше, чем у серебра и бронзы'],

/* ── возврат прокрутки ────────────────────────────────────────────────── */

['вернуть прокрутку браузеру', 'js/script.js',
 "    history.scrollRestoration = 'manual';",
 "    history.scrollRestoration = 'auto';",
 'прокруткой управляем мы, а не браузер'],

['перестать спрашивать браузер, что это было', 'js/script.js',
 "        var зап = performance.getEntriesByType('navigation')[0];",
 "        var зап = null;",
 'обновление и «назад» различаются'],

['возвращать прокрутку, не дожидаясь разделов', 'js/script.js',
 '        var доросла = document.documentElement.scrollHeight >= сохр.h - 4;',
 '        var доросла = true;',
 '«назад» ждёт, пока разделы дорисуются'],

['снова стирать ключ записи при чистке адреса', 'js/script.js',
 "        history.replaceState(history.state, '', window.location.pathname + window.location.search);",
 "        history.replaceState(null, '', window.location.pathname + window.location.search);",
 'чистка токенов из адреса не стирает ключ записи истории']
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'reyting-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'js'));
fs.mkdirSync(path.join(песок, 'pages'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-reyting.js'), ПРАВИЛО);
/* Разметку правило только читает, поэтому кладём как есть. */
fs.writeFileSync(path.join(песок, 'index.html'), fs.readFileSync(path.join(КОРЕНЬ, 'index.html')));
fs.writeFileSync(path.join(песок, 'pages', 'players.html'), fs.readFileSync(path.join(КОРЕНЬ, 'pages/players.html')));

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-reyting.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-reyting.js.');
    console.log(база.вывод); process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)  { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ УЗКИХ ВИДОВ ОТКАТОМ.
 * Работаем на КОПИИ, оригиналы не трогаем.
 *   node tools/check-turniry-vidy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'js/home-tournaments.js', 'index.html', 'index-en.html', 'index-kg.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-turniry-vidy.js'), 'utf8');

const ОТКАТЫ = [
['вернуть четыре одинаковых плитки на телефоне', 'css/style.css',
 '    .tournaments-grid > .tc:nth-child(n+2) { grid-column: span 6; }\n    .tournaments-grid > .tc:nth-child(1)   { grid-column: span 12; }',
 '    .tournaments-grid > .tc { grid-column: span 6 !important; }',
 'на телефоне главная карточка на всю ширину'],

['вернуть !important в раскладку телефона', 'css/style.css',
 '    .tournaments-grid > .tc:nth-child(1)   { grid-column: span 12; }',
 '    .tournaments-grid > .tc:nth-child(1)   { grid-column: span 12 !important; }',
 'в раскладке телефона нет !important'],

['показать на телефоне четвёртую карточку', 'css/style.css',
 '    /* Три карточки: ряды заполнены целиком, четвёртая ушла бы одна в ряд */\n    .tournaments-grid > .tc:nth-child(n+4) { display: none; }',
 '    .tournaments-grid > .tc:nth-child(n+5) { display: none; }',
 'на телефоне видно ровно три карточки'],

['показать на планшете все шесть', 'css/style.css',
 '    .tournaments-grid > .tc:nth-child(n+6) { display: none; }',
 '    .tournaments-grid > .tc:nth-child(n+7) { display: none; }',
 'на планшете видно пять карточек'],

['снять границы с правила высоты планшета — тот самый протёк', 'css/style.css',
 '@media (min-width: 641px) and (max-width: 992px) and (orientation: portrait) {',
 '@media (max-width: 992px) {',
 'высота обычной карточки планшета объявлена в СВОИХ границах'],

['убрать из условия ленты ширину', 'css/style.css',
 '@media (max-width: 992px) and (orientation: landscape) and (max-height: 500px) {',
 '@media (orientation: landscape) and (max-height: 500px) {',
 'лента объявлена условием из трёх частей'],

['отнять у ленты снап', 'css/style.css',
 '        scroll-snap-type: x mandatory;\n        -webkit-overflow-scrolling: touch;',
 '        -webkit-overflow-scrolling: touch;',
 'в ленте сетка становится полосой'],

['сделать карточку ленты резиновой', 'css/style.css',
 '        flex: 0 0 340px;\n        width: 340px;\n        height: 270px;',
 '        flex: 1 1 auto;\n        height: 270px;',
 'в ленте карточка 340 × 270 и прилипает'],

['спрятать в ленте всё после третьей', 'css/style.css',
 '    .tournaments-grid > .tc:nth-child(n+4) { display: flex; }',
 '    .tournaments-grid > .tc:nth-child(n+4) { display: none; }',
 'в ленте показаны ВСЕ карточки'],

['вернуть ленте кегли широкого экрана', 'css/style.css',
 '    .tournaments-grid > .tc:nth-child(1) .tc-title { font-size: var(--fs-base); }\n    .tournaments-grid .tc .tc-meta,',
 '    .tournaments-grid .tc .tc-meta,',
 'в ленте кегли телефонные'],

['показать плитку «Все турниры» в сетке', 'css/style.css',
 '\n.tc-more {\n    display: none;',
 '\n.tc-more {\n    display: flex;',
 'плитка «Все турниры» по умолчанию скрыта'],

['вернуть вес числом в кнопку карточки', 'css/style.css',
 '.tc-btn {\n    align-self: flex-start;',
 '.tc-btn {\n    font-weight: 700;\n    align-self: flex-start;',
 'веса внутри карточки — токенами, не числами'],

['вернуть мету одиночным селектором', 'css/style.css',
 '    .tournaments-grid .tc .tc-meta,\n    .tournaments-grid .tc-featured .tc-meta { font-size: var(--fs-2xs); }\n\n    /* Значок',
 '    .tc-meta { font-size: var(--fs-2xs); }\n\n    /* Значок',
 'мета на телефоне объявлена селектором с родителем'],

['сравнять главную карточку телефона с обычной', 'css/style.css',
 '    .tournaments-grid > .tc:nth-child(1) .tc-title { font-size: var(--fs-base); }\n\n    /* Карточки были вытянутыми',
 '\n    /* Карточки были вытянутыми',
 'на телефоне главная карточка крупнее обычной'],

['уронить цель нажатия на телефоне', 'css/style.css',
 '        min-height: 44px;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n    }\n}\n\n/* ====',
 '        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n    }\n}\n\n/* ====',
 'цель нажатия кнопки 44 — телефон'],

['вернуть первому ряду высоту 380', 'css/style.css',
 '.tournaments-grid > .tc:nth-child(-n+3) {\n    height: 320px;\n}',
 '.tournaments-grid > .tc:nth-child(-n+3) {\n    height: 380px;\n}',
 'высота первого ряда 320'],

['снять с шапки раздела общую высоту', 'css/style.css',
 '    min-height: 44px;\n    margin-bottom: var(--space-md);',
 '    margin-bottom: var(--space-md);',
 'шапка раздела одной высоты во всех секциях'],

['убрать плитку из скрипта', 'js/home-tournaments.js',
 '<a class="tc-more" href="',
 '<a class="tc-none" href="',
 'плитку «Все турниры» рисует js/home-tournaments.js'],

['увести плитку на другой адрес в кыргызской', 'js/home-tournaments.js',
 "? { href: 'pages/tournaments-overview-kg.html', текст: 'Бардык мелдештер' }",
 "? { href: 'pages/tournaments.html', текст: 'Бардык мелдештер' }",
 'плитка ведёт туда же, куда ссылка раздела в index-kg.html']
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'turniry-vidy-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'js'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-turniry-vidy.js'), ПРАВИЛО);

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-turniry-vidy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-turniry-vidy.js.');
    console.log(база.вывод);
    process.exit(1);
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

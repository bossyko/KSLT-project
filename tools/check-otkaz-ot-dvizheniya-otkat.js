/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ОТКАЗА ОТ ДВИЖЕНИЯ. На КОПИИ.
 *
 * Откаты ломают отказ ровно теми способами, какими его можно сломать
 * молча: убрать псевдоэлементы из общего блока, снять важность, перебить
 * своим `!important`, увести страницу от токенов, завести движение в js и
 * убрать эталон вопроса.
 *
 *   node tools/check-otkaz-ot-dvizheniya-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-dvizh-'));
['js', 'tools', 'css', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/css'), path.join(песок, 'mobile/www/css'), { recursive: true });
for (const ф of fs.readdirSync(КОРЕНЬ)) {
    if (ф.endsWith('.html')) fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф));
}

const TK = 'css/tokens.css', ST = 'css/style.css', HR = 'js/home-rankings.js',
      PG = 'pages/courts.html', AP = 'mobile/www/css/app.css', SC = 'js/script.js';
const ФАЙЛЫ = [TK, ST, HR, PG, AP, SC];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-otkaz-ot-dvizheniya.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. псевдоэлементы — ими рисуются искры и бегущие полосы */
    ['убрать псевдоэлементы из общего блока', TK,
     '    *,\n    *::before,\n    *::after {',
     '    * {',
     'общий блок отказа накрывает все элементы и их псевдоэлементы'],

    /* 2. снять важность — специфичность `*` ниже любого правила */
    ['снять важность у гашения повторов', TK,
     'animation-iteration-count: 1 !important;',
     'animation-iteration-count: 1;',
     'в общем блоке все четыре свойства и все с важностью'],

    /* 3. убрать гашение прокрутки */
    ['убрать гашение плавной прокрутки', TK,
     '        scroll-behavior: auto !important;\n',
     '',
     'в общем блоке все четыре свойства и все с важностью'],

    /* 4. перебить отказ своим important вне блока */
    ['перебить отказ важностью вне блока', ST,
     '.kslt-role {\n    display: inline-flex;',
     '.kslt-role {\n    animation: spin 2s linear infinite !important;\n    display: inline-flex;',
     'важностью на анимации отказ никто не перебивает'],

    /* 5. увести страницу от токенов, оставив вид продукта */
    ['увести страницу кортов от токенов', PG,
     'tokens.css',
     'tokens-NET.css',
     'общий блок отказа доходит до каждой страницы с содержимым'],

    /* 6. завести своё движение в js, минуя css.
       ЯКОРЬ УНИКАЛЕН: `(function() {` встречается в script.js ОДИННАДЦАТЬ
       раз, и прувер это поймал — откат на неуникальном якоре доказывает
       не правило, а везение. */
    ['завести движение через Web Animations API', SC,
     "    if (!('scrollRestoration' in history)) return;",
     "    if (!('scrollRestoration' in history)) return;\n    function въезд(el) {\n        el.animate([{opacity: 0}, {opacity: 1}], {duration: 400});\n    }",
     'js не рисует движение сам, минуя отказ'],

    /* 7. убрать эталон вопроса */
    ['убрать вопрос об отказе из эталона', HR,
     "window.matchMedia('(prefers-reduced-motion: reduce)').matches",
     'false',
     'эталон вопроса об отказе в js на месте'],

    /* 8. снять блок отказа в приложении.
       ЗАМЕНА НЕ ДОЛЖНА СОДЕРЖАТЬ ИСКОМОГО: сперва я подставил
       `prefers-reduced-motion-NET`, и правило осталось зелёным — искомая
       строка в нём ЕСТЬ как подстрока. Откат, чья замена содержит то, что
       ищет правило, не ломает ничего. */
    ['снять блок отказа в css приложения', AP,
     '@media (prefers-reduced-motion: reduce) {',
     '@media (min-width: 99999px) {',
     'в css приложения блок отказа есть']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правила падают на ЧИСТОМ коде — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const n = исходник[ф].split(что).length - 1;
    if (n !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз в ' + ф);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}

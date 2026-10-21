/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА СЧЁТА. На КОПИИ.
 *
 * Среди откатов есть два особых: возврат копии ПОД ПРЕФИКСОМ `db` (по имени
 * её родство не видно) и снятие проверки BYE — она не меняет ни одной
 * строки вида, но превращает пропуск круга в нулевую победу.
 *
 *   node tools/check-schyot-doma-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-schyot-'));
['js', 'tools', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
for (const ф of fs.readdirSync(КОРЕНЬ)) {
    if (ф.endsWith('.html')) fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф));
}

const RU = 'js/kslt-rules.js', PL = 'js/player.js', DB = 'js/dashboard.js',
      CH = 'js/admin/sections/challenges.js', ST = 'maket/schyot-zamer.html',
      PG = 'pages/player.html';
const ФАЙЛЫ = [RU, PL, DB, CH, ST, PG];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-schyot-doma.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. вернуть копию на страницу игрока */
    ['вернуть копию показа счёта игроку', PL,
     '    var показатьСчёт = function (с) { return window.KSLT_RULES.показатьСчёт(с); };',
     '    function formatScore(score) {\n        if (!score) return \'\\u2014\';\n        return score.replace(/(\\d+)\\/(\\d+)/g, \'$1:$2\');\n    }',
     'своих определений счёта нет ни под одним именем'],

    /* 2. вернуть копию ПОД ПРЕФИКСОМ db — по имени родство не видно */
    ['вернуть копию под префиксом db в кабинет', DB,
     '    var dbПоказатьСчёт = function (с) { return window.KSLT_RULES.показатьСчёт(с); };',
     '    function dbFormatScore(score) {\n        if (!score) return \'\\u2014\';\n        return score.replace(/(\\d+)\\/(\\d+)/g, \'$1:$2\');\n    }',
     'своих определений счёта нет ни под одним именем'],

    /* 3. вернуть копию годности сета в админку */
    ['вернуть копию годности сета в вызовы', CH,
     '    var isValidSet = function (a, b, формат) { return window.KSLT_RULES.сетГоден(a, b, формат); };',
     '    function isValidSet(a, b, format) { return true; }',
     'своих определений счёта нет ни под одним именем'],

    /* 4. выкинуть объявление из дома */
    ['выкинуть разбор счёта из дома', RU,
     '    R.разборСчёта = function (счёт) {',
     '    R.разборСчётаNETU = function (счёт) {',
     'дом правил объявляет все четыре понятия счёта'],

    /* 5. СНЯТЬ ПРОВЕРКУ BYE — вида не меняет, статистику ломает */
    ['снять проверку BYE в разборе счёта', RU,
     "        if (!счёт || счёт === 'BYE') return null;",
     '        if (!счёт) return null;',
     'BYE не считается матчем: разбор счёта возвращает ничего'],

    /* 6. разрешить короткому формату семёрки */
    ['разрешить короткому формату семь геймов', RU,
     'if (a < 0 || b < 0 || a > 6 || b > 6) return false;',
     'if (a < 0 || b < 0 || a > 9 || b > 9) return false;',
     'короткий формат ограничен шестью, а не семью'],

    /* 7. снять дом со страницы, которая зовёт счёт */
    ['снять дом правил со страницы игрока', PG,
     'kslt-rules.js',
     'kslt-rules-NETU.js',
     'дом подключён на каждой странице, где зовут счёт'],

    /* 8. завести стенду свою копию — тогда он мерит себя */
    ['завести стенду свою копию счёта', ST,
     '    var R = window.KSLT_RULES;',
     '    function показатьСчёт(с) { return с; }\n    var R = window.KSLT_RULES;',
     'стенд счёта подключает дом и своей копии не держит']
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

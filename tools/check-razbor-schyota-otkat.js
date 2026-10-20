/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА РАЗБОРА СЧЁТА. На КОПИИ.
 *
 *   node tools/check-razbor-schyota-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-schyot-'));
['js', 'tools', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'index.html'), path.join(песок, 'index.html'));

const ФАЙЛЫ = ['js/admin/sections/bracket.js', 'js/group-standings.js',
                'js/kslt-rules.js', 'pages/admin.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-razbor-schyota.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const СК = 'js/admin/sections/bracket.js', ГР = 'js/group-standings.js',
      ДМ = 'js/kslt-rules.js', АД = 'pages/admin.html';

const ОТКАТЫ = [
    /* 1. вторая копия parseSets */
    ['вернуть вторую копию parseSets', СК,
     "    function parseSets(score) {",
     "        function parseSets(score) {\n            return { p1: [], p2: [], outcome: '' };\n        }\n\n    function parseSets(score) {",
     'parseSets объявлена в сетке один раз'],

    /* 2. тире снова только дефис — в сетке и в группах */
    ['вернуть только дефис в разборе сетки', СК,
     "var m = s.match(/^(\\d+)\\/(\\d+)(?:\\((\\d+)\\s*[-–—]\\s*(\\d+)\\))?$/);\n            if (m) {\n                p1Sets.push",
     "var m = s.match(/^(\\d+)\\/(\\d+)(?:\\((\\d+)-(\\d+)\\))?$/);\n            if (m) {\n                p1Sets.push",
     'тай-брейк с двумя числами принимает любое тире'],

    ['вернуть только дефис в групповой таблице', ГР,
     "var ч = сет.match(/^(\\d+)\\/(\\d+)(?:\\((\\d+)\\s*[-–—]\\s*(\\d+)\\))?/);",
     "var ч = сет.match(/^(\\d+)\\/(\\d+)(?:\\((\\d+)-(\\d+)\\))?/);",
     'тай-брейк с двумя числами принимает любое тире'],

    /* 3. признак супер-ТБ: убрать из дома */
    ['убрать признак супер-ТБ из дома правил', ДМ,
     "    R.этоСуперТБ = function (сеты, индекс) {",
     "    R.этоСуперТБнет = function (сеты, индекс) {",
     'признак супер-тай-брейка объявлен в доме правил'],

    /* 4. снова считать признак своими руками — второе определение */
    ['вернуть свой расчёт признака в групповую таблицу', ГР,
     "    function этоСуперТБ(сеты, индекс) {\n        return window.KSLT_RULES.этоСуперТБ(сеты, индекс);\n    }",
     "    function этоСуперТБ(сеты, индекс) {\n        if (индекс !== 2) return false;\n        var м = String(сеты[индекс] || '').match(/^(\\d+)\\/(\\d+)$/);\n        return !!(м && (+м[1] >= 10 || +м[2] >= 10));\n    }",
     'признак супер-ТБ больше нигде не считается своими руками'],

    ['вернуть свой расчёт признака в окно ввода счёта', СК,
     "        var _суперТБ = window.KSLT_RULES.этоСуперТБ(existingSets);",
     "        var _суперТБ = (function() {\n            var третий = existingSets[2];\n            if (!третий) return false;\n            var м = третий.match(/^(\\d+)\\/(\\d+)$/);\n            return !!(м && (+м[1] >= 10 || +м[2] >= 10));\n        })();",
     'признак супер-ТБ больше нигде не считается своими руками'],

    /* 5. перестать звать дом */
    ['отключить групповую таблицу от дома правил', ГР,
     "        return window.KSLT_RULES.этоСуперТБ(сеты, индекс);",
     "        return false;",
     'оба прежних места зовут дом правил'],

    /* 6. страница без дома правил */
    ['снять дом правил со страницы админки', АД,
     /<script src="\.\.\/js\/kslt-rules\.js\?v=\d+"><\/script>\n/,
     '',
     'страница, зовущая дом правил без проверки, его подключает']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правило падает на ЧИСТОМ коде — чинить сторож, а не код\n');
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

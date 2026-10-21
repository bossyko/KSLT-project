/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КОПИЙ ФУНКЦИЙ. На КОПИИ.
 *
 * Откаты возвращают по одной из снятых копий — и отдельно возвращают
 * СЛАБУЮ версию там, где взята устойчивая: правило о том, что сведено на
 * лучшую копию, а не на первую попавшуюся, иначе ничего не доказывает.
 *
 *   node tools/check-kopii-funkciy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kopii-'));
['js', 'tools', 'css', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
for (const ф of fs.readdirSync(КОРЕНЬ)) {
    if (ф.endsWith('.html')) fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф));
}

const BR = 'js/admin/sections/bracket.js', KT = 'js/kslt-toast.js',
      KK = 'js/kslt-karta.js', CO = 'js/courts.js', MS = 'js/match-score.js',
      TD = 'js/tournament-detail.js', PG = 'pages/court.html',
      PL = 'js/player.js', PS = 'pages/player.html';
const ФАЙЛЫ = [BR, KT, KK, CO, MS, TD, PG, PL, PS];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-kopii-funkciy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. вернуть вторую копию времени расписания */
    ['вернуть вторую копию timeToMin', BR,
     '    function minToTime(m) {',
     '    function timeToMin(t) {\n        var parts = t.split(\':\');\n        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);\n    }\n\n    function minToTime(m) {',
     'время расписания определено один раз, и устойчиво к числу'],

    /* 2. ВЗЯТЬ СЛАБУЮ ВЕРСИЮ — копий по-прежнему одна, но она падает на числе */
    ['подменить устойчивую версию слабой', BR,
     'function timeToMin(t) {\n        var parts = String(t).split(\':\');',
     'function timeToMin(t) {\n        var parts = t.split(\':\');',
     'время расписания определено один раз, и устойчиво к числу'],

    /* 3. вернуть замыкание вместо параметров */
    ['вернуть группам замыкание вместо параметров', BR,
     'function getGroupsInHalf(halfIdx, draw, halfSize) {',
     'function getGroupsInHalf(halfIdx) {',
     'группы в половине сетки: одно определение, сетка параметром'],

    /* 4. вернуть свою копию карты в файл */
    ['вернуть courts.js свою копию карты', CO,
     '    var isEn = window.location.pathname.indexOf(\'-en\') !== -1;',
     '    function getMapEmbed(url) {\n        return url || null;\n    }\n\n    var isEn = window.location.pathname.indexOf(\'-en\') !== -1;',
     'карта определена только в доме kslt-karta.js'],

    /* 5. снять дом карты со страницы, которая его зовёт */
    ['снять дом карты со страницы корта', PG,
     'kslt-karta.js',
     'kslt-karta-NET.js',
     'дом карты подключён на каждой странице, где его зовут'],

    /* 6. вернуть седьмую копию уведомления */
    ['вернуть match-score.js свою обёртку уведомления', MS,
     '    var toast = window.showToast || function () {};',
     '    function toast(текст, вид) {\n        if (window.KSLT_TOAST) {\n            window.KSLT_TOAST.показать(текст, { тон: window.KSLT_TOAST.тон(вид) });\n        }\n    }',
     'уведомление: ярлык в доме, у потребителей своего определения нет'],

    /* 7. убрать ярлык из дома */
    ['убрать ярлык showToast из дома', KT,
     '    window.showToast = T.ярлык;',
     '    /* ярлыка нет */',
     'уведомление: ярлык в доме, у потребителей своего определения нет'],

    /* 8. прибавить побайтовую копию — храповик */
    ['прибавить новую побайтовую копию', TD,
     '/* КАРТА ЖИВЁТ В ДОМЕ',
     'function человечно(д) {\n    var м = String(д).split(\'-\');\n    return м[2] + \'.\' + м[1];\n}\nfunction человечноТоже(д) {\n    var м = String(д).split(\'-\');\n    return м[2] + \'.\' + м[1];\n}\n\n/* КАРТА ЖИВЁТ В ДОМЕ',
     'побайтовых копий не больше замеренного'],

    /* ВЕРНУТЬ СВОЮ ЛОВУШКУ ФОКУСА — и именно БЕДНУЮ, ту, что стояла здесь
       до 21.10: без полей в списке. Правило обязано упасть на ней так же,
       как на полной: копия опасна не тем, что она копия, а тем, что
       расходится. */
    ['вернуть свою ловушку фокуса, и бедную', PL,
     '        var ловушка = window.KSLT_FOKUS.ловушка(overlay);',
     '        var ловушка = function(e) {\n' +
     "            if (e.key !== 'Tab') return;\n" +
     '            var сп = overlay.querySelectorAll(\'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])\');\n' +
     '            if (!сп.length) return;\n' +
     '            var пер = сп[0], посл = сп[сп.length - 1];\n' +
     '            if (e.shiftKey && document.activeElement === пер) { e.preventDefault(); посл.focus(); }\n' +
     '            else if (!e.shiftKey && document.activeElement === посл) { e.preventDefault(); пер.focus(); }\n' +
     '        };',
     'ловушка фокуса определена только в доме kslt-fokus.js'],

    /* СНЯТЬ ПОДКЛЮЧЕНИЕ ДОМА СО СТРАНИЦЫ. Дом без подключения — тихая
       поломка: окно откроется, а Tab уйдёт под него, и узнает об этом
       только человек с клавиатуры. */
    ['снять подключение дома ловушки со страницы игрока', PS,
     '<script src="../js/kslt-fokus.js?v=1"></script>\n',
     '',
     'дом ловушки подключён на каждой странице, где его зовут']
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

/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА СТАТУСА ТУРНИРА. На КОПИИ.
 *
 *   node tools/check-status-turnira-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-status-'));
['js', 'tools', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
for (const ф of fs.readdirSync(КОРЕНЬ)) {
    if (ф.endsWith('.html')) fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф));
}

const TO = 'js/tournaments-overview.js', TD = 'js/tournament-detail.js',
      CO = 'js/admin/core/constants.js', ST = 'js/tournament-status.js',
      PG = 'pages/tournaments-overview.html', IX = 'index.html';
const ФАЙЛЫ = [TO, TD, CO, ST, PG, IX];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-status-turnira.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. вернуть обёртку на сайте */
    ['вернуть обёртку статуса в обзор турниров', TO,
     '    /* СТАТУС БЕРЁТСЯ У ДОМА НАПРЯМУЮ (19.10).',
     '    function computeStatus(a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); }\n\n    /* СТАТУС БЕРЁТСЯ У ДОМА НАПРЯМУЮ (19.10).',
     'статус турнира определён только в доме'],

    /* 2. вернуть обёртку под ВТОРЫМ именем — по имени её не видно */
    ['вернуть обёртку под именем computeTournamentStatus', TD,
     '/* СТАТУС БЕРЁТСЯ У ДОМА НАПРЯМУЮ (19.10): обёртка была второй из четырёх. */',
     'function computeTournamentStatus(a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); }',
     'статус турнира определён только в доме'],

    /* 3. снять дом со страницы, которая его зовёт */
    ['снять дом статуса со страницы обзора', PG,
     'tournament-status.js',
     'tournament-status-NETU.js',
     'дом статуса подключён на каждой странице, где его зовут'],

    /* 4. развести версии дома — ровно то, что было до 19.10.
       ЗАМЕНА НЕ СОДЕРЖИТ ИСКОМОГО ПРАВИЛОМ ЧИСЛА: иначе откат ничего не
       ломает (поймано прувером куска 109). */
    ['развести версии дома статуса', IX,
     'tournament-status.js?v=12',
     'tournament-status.js?v=1',
     'дом статуса подключён ОДНОЙ версией на всю разметку'],

    /* 5. вернуть админке своё тело */
    ['вернуть админке своё тело статуса', CO,
     'computeTournamentStatus: function (a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); },',
     'computeTournamentStatus: function (a, b, c, d) { var н = new Date(); return н < new Date(c) ? \'upcoming\' : \'completed\'; },',
     'посредник админки зовёт дом, а своего тела не держит'],

    /* 6. выкинуть вычисление из дома.
       ЯКОРЬ УНИКАЛЕН: слово `вычислить` встречается в доме ТРИ раза
       (объявление, запись в API и упоминание в описании), и прувер это
       поймал. Берётся объявление целиком. */
    ['выкинуть вычисление из дома', ST,
     '    function вычислить(regStart, regEnd, dateStart, dateEnd) {',
     '    function вычислитьNETU(regStart, regEnd, dateStart, dateEnd) {',
     'статус турнира определён только в доме']
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

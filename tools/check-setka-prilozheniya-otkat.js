#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ СЕТКИ ПЛЕЙ-ОФФ (кусок 217). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-setka-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'js/kslt-setka.js', 'js/tournament-detail.js',
 'tools/check-setka-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-setka-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз в ' + отн;
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}
function вернуть(отн) { fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн)); }

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const D = 'js/kslt-setka.js';
const DK = 'mobile/www/js/kslt-setka.js';
const T = 'js/tournament-detail.js';
const G = 'mobile/www/js/screens/home.js';
const C = 'mobile/www/css/app.css';

const ОТКАТЫ = [
    ['дом клетки снят', D,
     '    S.матч = function (м, опции) {',
     '    S.матчБыл = function (м, опции) {',
     'дом рисует клетку матча'],

    ['дом сетки снят', D,
     '    S.сетка = function (круги, опции) {',
     '    S.сеткаБыла = function (круги, опции) {',
     'дом рисует сетку столбцами'],

    ['дом потянул предсказание сайта', D,
     "        if (опции.подвал) h += опции.подвал(м) || '';",
     "        if (опции.подвал) h += calculatePrediction(м) || '';",
     'дом не тянет за собой предсказание сайта'],

    ['сайт снова рисует клетку сам', T,
     '    return KSLT_SETKA.матч({',
     '    return \'<div class="td-match-player ">\' + JSON.stringify({',
     'сайт рисует клетку домом'],

    ['полоса предсказания потеряна', T,
     'function полосаПредсказания(tournament, match, predOpts) {',
     'function полосаПредсказанияБыла(tournament, match, predOpts) {',
     'полоса предсказания осталась у сайта отдельной функцией'],

    ['приложение снова рисует таблетками', G,
     '    var h = KSLT_SETKA.сетка(круги, опции);',
     '    var h = \'\';',
     'приложение рисует плей-офф сеткой из дома'],

    ['таблетки вернулись в плей-офф', G,
     '  /* 28.10, КУСОК 217: `renderPlayoffWithPills` снесена',
     '  function renderPlayoffWithPills() {}\n  /* 28.10, КУСОК 217: снесена',
     'таблетки кругов в плей-офф снесены'],

    ['круги поехали задом наперёд', G,
     '    номера.sort(function (a, b) { return a - b; });',
     '    номера.sort(function (a, b) { return b - a; });',
     'круги идут слева направо к финалу'],

    ['подложка сетки снова сплошным цветом', C,
     '.td-match-player.winner { background: var(--accent-subtle); }',
     '.td-match-player.winner { background: var(--accent-dim); }',
     'подложки сетки взяты `--accent-subtle`, а не `--accent-dim`'],

    ['строка прошедшего снова залита целиком', C,
     '.td-gt-qualified .td-gt-name,',
     '.td-gt-qualified { background: var(--accent-subtle); }\n.td-gt-qualified .td-gt-nameБыло,',
     'у прошедшего из группы выделено имя, а не полоса'],

    ['имя в клетке снова обрезается', C,
     '.td-player-name {\n  flex: 1; min-width: 0;',
     '.td-player-name {\n  flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;',
     'имя в клетке сетки переносится, а не обрезается'],

    ['копия дома уехала', DK,
     '    var ИСХОДЫ =',
     '    var ИСХОДЫ = [] ||',
     'копия общего дома совпадает до байта']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    const стр = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(стр + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0) {
        console.log(стр + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(стр + '\n      ✗ ждали падения «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 3)
            .map(с => '        ' + с.trim()).join('\n'));
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не уронило своё правило: ' + плохо + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили ИМЕННО своё правило\n');
}

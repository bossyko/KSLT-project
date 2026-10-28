#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ СТАТУСА И ИМЁН (кусок 218). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-status-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'js/tournament-status.js',
 'tools/check-status-i-imena-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-status-i-imena-prilozheniya.js')],
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

const H = 'mobile/www/index.html';
const G = 'mobile/www/js/screens/home.js';
const T = 'mobile/www/js/screens/tournaments.js';
const C = 'mobile/www/css/app.css';
const S = 'mobile/www/js/tournament-status.js';

const ОТКАТЫ = [
    ['дом статуса не подключён', H,
     '<script src="js/tournament-status.js?v=1"></script>\n',
     '',
     'дом статуса лежит в приложении и подключён'],

    ['копия дома статуса уехала', S,
     "    var ПОРЯДОК = ['upcoming',",
     "    var ПОРЯДОК = [].concat(['upcoming',",
     'копия дома статуса совпадает до байта'],

    ['окно турнира снова зовёт свою карту', G,
     '                  esc(KSLT_STATUS.подпись(t.status, I18N.lang)) + \'</span>\';',
     '                  esc(t.status) + \'</span>\';',
     'подпись статуса берётся из дома: окно турнира'],

    ['своя карта вернулась в окно турнира', G,
     '    if (t.status) {\n        badges +=',
     '    var statusMap = {};\n    if (t.status) {\n        badges +=',
     'своя карта статусов снесена: окно турнира'],

    ['список турниров снова зовёт свою карту', T,
     '                  esc(KSLT_STATUS.подпись(t.status, I18N.lang)) + \'</span>\';',
     '                  esc(t.status) + \'</span>\';',
     'подпись статуса берётся из дома: список турниров'],

    ['дом полного имени снят', G,
     '  function полноеИмя(playerId, regsMap, playersMap, isDbl) {',
     '  function полноеИмяБыло(playerId, regsMap, playersMap, isDbl) {',
     'имя без сокращения заведено отдельным домом'],

    ['таблица группы снова сокращает имя', G,
     '      имя: function (id) { return полноеИмя(id, regsMap, playersMap, isDbl); },',
     '      имя: function (id) { return getMobileTeamName(id, regsMap, playersMap, isDbl); },',
     'таблица группы берёт полное имя'],

    ['участники снова сокращают имя', G,
     '        ? полноеИмя(reg.player_id, regsMap, playersMap, isDbl)',
     '        ? getMobileTeamName(reg.player_id, regsMap, playersMap, isDbl)',
     'список участников берёт полное имя'],

    ['клетка сетки взяла полное имя', G,
     '        имя: getMobileTeamName(id, regsMap, playersMap, isDbl),',
     '        имя: полноеИмя(id, regsMap, playersMap, isDbl),',
     'в клетке сетки имя остаётся сокращённым'],

    ['таблица группы снова по содержимому', C,
     '.td-group-table {\n  min-width: 100%;',
     '.td-group-table {',
     'таблица группы тянется на всю ширину, когда влезает'],

    ['посев снова уезжает строкой', C,
     '  color: var(--accent-text); font-size: var(--fs-2xs); font-weight: 700;\n  white-space: nowrap;\n}',
     '  color: var(--accent-text); font-size: var(--fs-2xs); font-weight: 700;\n}',
     'посев не уезжает отдельной строкой']
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

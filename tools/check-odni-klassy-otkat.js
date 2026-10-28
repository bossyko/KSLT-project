#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ЕДИНЫХ КЛАССОВ (кусок 231). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-klassy-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['css', 'mobile/www/css', 'tools/check-odni-klassy.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-odni-klassy.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function заменить(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    if (т.indexOf(было) < 0) return 'ЯКОРЯ НЕТ в ' + отн;
    fs.writeFileSync(п, т.split(было).join(стало));
    return null;
}
function вернуть(отн) { fs.cpSync(path.join(КОРЕНЬ, отн), path.join(песок, отн), { recursive: true }); }

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

/* Откат переименовывает понятие В ПРИЛОЖЕНИИ — ровно та беда, от которой
   сторож и стоит: имена разъехались, и общий дом перестал быть общим. */
const ОТКАТЫ = [
    ['группа переименована в приложении', 'mobile/www/css/app.css',
     'td-gt-', 'td-grupa-', 'понятие «круговая таблица группы» зовётся одинаково'],
    ['клетка матча переименована', 'mobile/www/css/app.css',
     'td-match', 'td-kletka', 'понятие «клетка матча» зовётся одинаково'],
    ['сетка переименована', 'mobile/www/css/app.css',
     'td-bracket', 'td-setka', 'понятие «сетка плей-офф» зовётся одинаково'],
    ['третье место переименовано', 'mobile/www/css/app.css',
     'td-third-place', 'td-tretye', 'понятие «матч за третье место» зовётся одинаково'],
    ['расписание переименовано', 'mobile/www/css/app.css',
     'td-sched-', 'td-raspisanie-', 'понятие «расписание запусков» зовётся одинаково'],
    ['лента кадров переименована', 'mobile/www/css/app.css',
     'news-carousel', 'news-lenta', 'понятие «лента кадров новости» зовётся одинаково']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = заменить(файл, было, стало);
    const стр = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(стр + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf(ждём) >= 0) {
        console.log(стр + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(стр + '\n      ✗ ждали падения «' + ждём + '», код ' + р.код);
    }
});

/* Отдельно: храповик долгов не должен молчать при третьем долге. */
const беда = заменить('tools/check-odni-klassy.js',
    'const ПОТОЛОК_ДОЛГОВ = 2;', 'const ПОТОЛОК_ДОЛГОВ = 1;');
if (беда) { console.log('   7. храповик долгов\n      ✗ ' + беда); плохо++; }
else {
    const р = прогон();
    if (р.код !== 0 && р.вывод.indexOf('названных долгов не больше прочитанного') >= 0) {
        console.log('   7. храповик долгов опущен ниже списка\n' +
                    '      ✓ упало своё правило: названных долгов не больше прочитанного');
    } else { плохо++; console.log('   7. храповик долгов\n      ✗ не упал, код ' + р.код); }
}

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не уронило своё правило: ' + плохо + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все 7 откатов уронили ИМЕННО своё правило\n');
}

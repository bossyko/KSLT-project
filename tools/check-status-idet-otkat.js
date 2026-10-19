/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА СТАТУСА «ИДЁТ». На КОПИИ.
 *
 *   node tools/check-status-idet-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-idet-'));
['css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ФАЙЛЫ = ['css/admin.css', 'css/tournament-detail.css',
               'css/tournaments-overview.css', 'css/tournaments.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-status-idet.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const AD = 'css/admin.css', TD = 'css/tournament-detail.css',
      TO = 'css/tournaments-overview.css', T2 = 'css/tournaments.css';

const ОТКАТЫ = [
    ['вернуть голубой числом на страницу турнира', TD,
     '.td-status-badge.ongoing {\n    background: var(--role-manager-subtle);\n    color: var(--role-manager);',
     '.td-status-badge.ongoing {\n    background: rgba(0, 163, 255, 0.2);\n    color: #00A3FF;',
     'статус «идёт» нигде не красится числом'],

    ['вернуть лайм форме админки — одно понятие, две краски в одном файле', AD,
     '.ad-trn-status-field.ad-status-ongoing { color: var(--role-manager); }',
     '.ad-trn-status-field.ad-status-ongoing { color: var(--accent); }',
     'статус турнира не говорит краской эфира и чужих ролей'],

    ['покрасить статус турнира краской ЭФИРА — спутать два состояния', TO,
     '.to-compact-status.ongoing {\n    background: var(--alpha-black-60);\n    border: var(--bw-hair) solid var(--role-manager-ring-sm);\n    color: var(--role-manager);',
     '.to-compact-status.ongoing {\n    background: var(--alpha-black-60);\n    border: var(--bw-hair) solid var(--danger-border);\n    color: var(--danger);',
     'статус турнира не говорит краской эфира и чужих ролей'],

    ['увести статус с роли на нейтральный серый', T2,
     '.tournament-status.ongoing {\n    background: var(--alpha-black-60);\n    border: var(--bw-hair) solid var(--role-manager-ring);\n    color: var(--role-manager);',
     '.tournament-status.ongoing {\n    background: var(--alpha-black-60);\n    border: var(--bw-hair) solid var(--border-subtle);\n    color: var(--text-secondary);',
     'статус «идёт» говорит одной ролью'],

    /* ЯКОРЬ СУЖЕН: `.ad-status-ongoing {` встречается в файле ДВАЖДЫ —
       отдельным правилом и в составном `.ad-trn-status-field…`. Берём
       строку вместе с телом: она уникальна. */
    ['переименовать селектор — сторож должен сказать, а не промолчать', AD,
     '.ad-status-ongoing {\n    background: var(--role-manager-subtle);',
     '.ad-status-ongoing-net {\n    background: var(--role-manager-subtle);',
     'все места статуса «идёт» на месте'],
];

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    if (исходник[ф].indexOf(что) === -1) {
        console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return;
    }
    if (исходник[ф].split(что).length - 1 !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' +
                    (исходник[ф].split(что).length - 1) + ' раз'); плохих++; return;
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

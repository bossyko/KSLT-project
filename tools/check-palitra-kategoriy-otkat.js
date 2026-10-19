/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПАЛИТРЫ РАЗЛИЧИТЕЛЕЙ. На КОПИИ.
 *
 * Правило СЧИТАЕТ контраст и ΔE, поэтому откаты подсовывают настоящие
 * краски: роль вместо различителя, тёмную вместо проходящей AA, двойника
 * вместо отличимой. Если правило считает верно — каждая упадёт.
 *
 *   node tools/check-palitra-kategoriy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-palitra-'));
['css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛИ = { tokens: 'css/tokens.css', admin: 'css/admin.css' };
const чистые = {};
Object.entries(ЦЕЛИ).forEach(([к, п]) => {
    чистые[к] = fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8');
});

function прогон(правки) {
    Object.entries(ЦЕЛИ).forEach(([к, п]) => {
        fs.writeFileSync(path.join(песок, п), (правки && правки[к]) ? правки[к] : чистые[к]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-palitra-kategoriy.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['убрать палитру из токенов',
     { tokens: чистые.tokens.replace('--cat-1:        var(--cyan-500);', '--cat-1-net:    var(--cyan-500);') },
     'палитра различителей объявлена в токенах'],

    ['поставить различителем краску РОЛИ «сведения» — тип снова как состояние',
     { tokens: чистые.tokens.replace('--cyan-500:   #00BCD4;', '--cyan-500:   #60A5FA;') },
     'различители не похожи ни на одну роль состояния'],

    ['поставить различителем тёмную краску — ниже AA на своей подложке',
     { tokens: чистые.tokens.replace('--pink-400:   #F472B6;', '--pink-400:   #7A3B55;') },
     'каждый различитель проходит AA на своей подложке'],

    ['сделать второй различитель двойником первого',
     { tokens: чистые.tokens.replace('--sand-300:   #BCAAA4;', '--sand-300:   #06B6D4;') },
     'различители отличимы друг от друга'],

    ['вернуть типу корта краску числом',
     { admin: чистые.admin.replace(
         '.ad-type-indoor {\n    background: var(--cat-1-subtle);\n    color: var(--cat-1);\n}',
         '.ad-type-indoor {\n    background: rgba(100, 180, 255, 0.15);\n    color: #64B4FF;\n}') },
     'различители берут краску у палитры, а не числом и не у роли'],

    ['дать различителю краску роли прямо в правиле',
     { admin: чистые.admin.replace(
         '.ad-pay-type-player {\n    background: var(--cat-3-subtle);\n    color: var(--cat-3);\n}',
         '.ad-pay-type-player {\n    background: var(--warning-subtle);\n    color: var(--warning);\n}') },
     'различители берут краску у палитры, а не числом и не у роли'],
];

console.log('');
if (прогон(null).упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let плохих = 0;
    ОТКАТЫ.forEach(([имя, правки, ждём]) => {
        const тронуто = Object.entries(правки).some(([к, т]) => т !== чистые[к]);
        if (!тронуто) {
            console.log('  ? ' + имя + '  ->  якорь не сработал, откат не сделан'); плохих++;
            return;
        }
        const р = прогон(правки);
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
}

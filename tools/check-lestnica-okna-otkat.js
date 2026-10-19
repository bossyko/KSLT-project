/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ЛЕСТНИЦЫ ОКНА. На КОПИИ.
 *
 *   node tools/check-lestnica-okna-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-okno-'));
['css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛИ = { admin: 'css/admin.css', style: 'css/style.css' };
const чистые = {};
Object.entries(ЦЕЛИ).forEach(([к, п]) => {
    чистые[к] = fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8');
});

function прогон(правки) {
    Object.entries(ЦЕЛИ).forEach(([к, п]) => {
        fs.writeFileSync(path.join(песок, п), (правки && правки[к]) ? правки[к] : чистые[к]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-lestnica-okna.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЬ — общее правило заголовка, то самое отношение. Счётом проверено. */
const ЯКОРЬ = '.ad-confirm-title,\n.ad-modal-header h3 {';
const разЯкорь = чистые.admin.split(ЯКОРЬ).length - 1;

const ОТКАТЫ = [
    ['развести заголовок окна на два определения снова',
     { admin: чистые.admin.replace(ЯКОРЬ, '.ad-confirm-title {')
                          .replace('.ad-confirm-title {\n    margin-bottom: var(--space-2);\n}',
                                   '.ad-confirm-title { margin-bottom: var(--space-2); }\n' +
                                   '.ad-modal-header h3 { font-size: var(--fs-base); }') },
     'заголовок окна объявлен одним правилом на все окна'],

    ['вернуть телу окна ступень вторичного текста — пара на две ступени',
     { admin: чистые.admin.replace('.ad-confirm-text {\n    font-size: var(--fs-base);',
                                   '.ad-confirm-text {\n    font-size: var(--fs-sm);') },
     'пара «заголовок окна + тело» отстоит ровно на ступень'],

    ['задать вес заголовка числом вместо ступени системы',
     /* ЯКОРЬ СУЖЕН: голая строка `font-weight: var(--fw-semibold);`
        встречается в файле 16 раз, и откат правил чужое место, а правило
        смотрело на целый заголовок окна. Держимся за ПАРУ строк кегля и
        веса — она живёт только в блоке заголовка окна. */
     { admin: чистые.admin.replace('    font-size: var(--fs-md);\n    font-weight: var(--fw-semibold);',
                                   '    font-size: var(--fs-md);\n    font-weight: 600;') },
     'вес заголовка окна берётся у системы'],

    ['вернуть межстрочный тела числом',
     { admin: чистые.admin.replace('.ad-modal-note {\n    margin: 0 0 var(--space-3);\n    font-size: var(--fs-base);\n    line-height: var(--lh-normal);',
                                   '.ad-modal-note {\n    margin: 0 0 var(--space-3);\n    font-size: var(--fs-base);\n    line-height: 1.5;') },
     'межстрочный тела окна стоит ступенью лестницы'],

    ['завести ЧЕТВЁРТОЕ написание заголовка окна — храповик',
     { style: чистые.style + '\n.xx-modal-title { font-size: var(--fs-lg); }\n' },
     'написаний заголовка окна не больше потолка'],
];

console.log('');
if (разЯкорь !== 1) {
    console.log('  БЕДА    якорь встречается ' + разЯкорь + ' раз — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else if (прогон(null).упало) {
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

/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПОЛЯ СОДЕРЖИМОГО. На КОПИИ.
 *
 * Каждый откат возвращает ровно то, от чего правило бережёт, — и требует,
 * чтобы упало ИМЕННО оно.
 *
 *   node tools/check-pole-soderzhimogo-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-pole-'));
['css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛЬ = 'css/admin.css';
const чистый = fs.readFileSync(path.join(КОРЕНЬ, ЦЕЛЬ), 'utf8');

function прогон(текст) {
    fs.writeFileSync(path.join(песок, ЦЕЛЬ), текст === null ? чистый : текст);
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-pole-soderzhimogo.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЬ — блок обёртки, который и держит отношение. Проверено счётом. */
const ЯКОРЬ = 'margin-inline: calc(-1 * var(--ad-content-pad));';
const разЯкорь = чистый.split(ЯКОРЬ).length - 1;

const ОТКАТЫ = [
    ['вернуть минус числом -16px — он сойдётся лишь на одном виде',
     т => т.replace(ЯКОРЬ, 'margin-inline: -16px;'),
     'минусовое поле обёртки таблицы равно полю содержимого'],

    ['снять отступ, возвращающий содержимое внутрь',
     т => т.replace('padding-inline: var(--ad-content-pad);', 'padding-inline: 0;'),
     'обёртка возвращает содержимое внутрь тем же полем'],

    ['задать поле телефона числом рядом с переменной',
     т => т.replace('        --ad-content-pad: var(--space-3);\n        padding: var(--ad-content-pad);',
                    '        --ad-content-pad: var(--space-3);\n        padding: var(--space-3);'),
     'боковой отступ содержимого берётся у переменной'],

    ['убрать переменную вовсе — поле снова живёт числами',
     т => т.replace(/--ad-content-pad:\s*var\(--space-[^)]*\);\n\s*/g, ''),
     'боковое поле содержимого объявлено переменной'],
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
    ОТКАТЫ.forEach(([имя, порча, ждём]) => {
        const испорчен = порча(чистый);
        if (испорчен === чистый) {
            console.log('  ? ' + имя + '  ->  якорь не сработал, откат не сделан'); плохих++;
            return;
        }
        const р = прогон(испорчен);
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

/**
 * ДОКАЗАТЕЛЬСТВО ХРАПОВИКА АДМИНКИ. На КОПИИ.
 *
 *   node tools/check-admin-sloy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-admin-'));
['css', 'js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const C = 'css/admin.css', J = 'js/admin/sections/players.js';
const исходник = {};
[C, J].forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    [C, J].forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-admin-sloy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЬ — живое правило файла, а не номер строки */
const ЯКОРЬ_CSS = '.ad-content {';
const ЯКОРЬ_JS = 'var A = window.KSLT_ADMIN;';

const ОТКАТЫ = [
    ['дописать правило с голой краской сверх потолка', C,
     т => т.replace(ЯКОРЬ_CSS, '.ad-порча { color: #f44336; }\n' + ЯКОРЬ_CSS),
     'голых красок в admin.css не больше потолка'],

    ['завести НОВОЕ написание краски', C,
     т => т.replace(ЯКОРЬ_CSS, '.ad-порча { color: #e81123; }\n' + ЯКОРЬ_CSS),
     'написаний краски в admin.css не больше замеренного'],

    ['завести краску в записи rgba — прибор видит и её', C,
     т => т.replace(ЯКОРЬ_CSS, '.ad-порча { color: rgba(12,34,56,0.5); }\n' + ЯКОРЬ_CSS),
     'голых красок в admin.css не больше потолка'],

    ['дописать отступ мимо шкалы сверх потолка', C,
     т => т.replace(ЯКОРЬ_CSS, '.ad-порча { padding: 7px; }\n' + ЯКОРЬ_CSS),
     'отступов мимо шкалы в admin.css не больше потолка'],

    ['завести лишний инлайн в разделе игроков', J,
     т => т.replace(ЯКОРЬ_JS, 'var _порча = \'<i style="display:block"></i>\';\n    ' + ЯКОРЬ_JS),
     'инлайнов в js/admin не больше потолка'],

    ['дописать кегль числом сверх потолка', J,
     т => т.replace(ЯКОРЬ_JS, 'var _порча3 = \'<i style="font-size:14px"></i>\';\n    ' + ЯКОРЬ_JS),
     'кеглей числом в js/admin не больше потолка'],

    ['дописать кегль МИМО ШКАЛЫ', J,
     т => т.replace(ЯКОРЬ_JS, 'var _порча4 = \'<i style="font-size:0.83rem"></i>\';\n    ' + ЯКОРЬ_JS),
     'кеглей МИМО ШКАЛЫ в js/admin не больше потолка'],

    ['завести лишний инлайн с голой краской', J,
     т => т.replace(ЯКОРЬ_JS, 'var _порча2 = \'<i style="color:#f44336"></i>\';\n    ' + ЯКОРЬ_JS),
     'голых красок в инлайнах js/admin не больше потолка'],
];

console.log('');
if (исходник[C].indexOf(ЯКОРЬ_CSS) === -1 || исходник[J].indexOf(ЯКОРЬ_JS) === -1) {
    console.log('  БЕДА    якоря нет — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else if (прогон(null).упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let плохих = 0;
    ОТКАТЫ.forEach(([имя, ф, порча, ждём]) => {
        const испорчен = порча(исходник[ф]);
        if (испорчен === исходник[ф]) {
            console.log('  ? ' + имя + '  ->  якорь не сработал'); плохих++; return;
        }
        const р = прогон({ файл: ф, текст: испорчен });
        if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
        else if (р.вывод.indexOf(ждём) === -1) {
            console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
        } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
    });
    прогон(null);
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

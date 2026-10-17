/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА РАДИУСОВ. На КОПИИ.
 *
 *   node tools/check-radiusy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-radiusy-'));
['css', 'js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const T = 'css/tokens.css', C = 'css/admin.css', J = 'js/admin/sections/players.js',
      P = 'css/dashboard.css';
const исходник = {};
[T, C, J, P].forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    [T, C, J, P].forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-radiusy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЯ — на содержимом, которое живёт в этих блоках постоянно */
const Я_2XS = '  --radius-2xs:  2px;';
const Я_SM = '  --radius-sm:   8px;';
const Я_CSS = '\n.ad-status-badge {';
const Я_JS = 'var A = window.KSLT_ADMIN;';
const Я_ПУБ = '.db-cat-bar {';

const ОТКАТЫ = [
    ['снять ступень 2 — ту, из-за пропуска которой микро держали число', T,
     т => т.replace(Я_2XS, ''),
     'шкала радиусов объявлена целиком'],

    ['сдвинуть ступень sm с 8 на 10', T,
     т => т.replace(Я_SM, '  --radius-sm:   10px;'),
     'шкала радиусов объявлена целиком'],

    ['вернуть радиус числом в admin.css', C,
     т => т.replace(Я_CSS, '\n.ad-порча { border-radius: 10px; }\n.ad-status-badge {'),
     'в слое админки нет радиуса мимо шкалы'],

    ['вернуть радиус числом в инлайн js/admin', J,
     т => т.replace(Я_JS, 'var _порча = \'<i style="border-radius:6px"></i>\';\n    ' + Я_JS),
     'в слое админки нет радиуса мимо шкалы'],

    ['записать капсулу половиной высоты в админке', C,
     т => т.replace(Я_CSS, '\n.ad-порча2 { height: 20px; border-radius: 10px; }\n.ad-status-badge {'),
     'в админке капсула зовётся --radius-full'],

    ['завести лишнюю капсулу числом в публичной части', P,
     т => т.replace(Я_ПУБ, '.db-порча { height: 12px; border-radius: 6px; }\n' + Я_ПУБ),
     'капсул, записанных числом, в остальном продукте не больше потолка'],

    ['завести лишний радиус мимо шкалы в публичной части', P,
     т => т.replace(Я_ПУБ, '.db-порча3 { border-radius: 7px; }\n' + Я_ПУБ),
     'радиусов мимо шкалы в остальном продукте не больше потолка'],
];

console.log('');
const якорей = [[T, Я_2XS], [T, Я_SM], [C, Я_CSS], [J, Я_JS], [P, Я_ПУБ]];
const нетЯкоря = якорей.filter(([ф, я]) => исходник[ф].split(я).length !== 2);
if (нетЯкоря.length) {
    console.log('  БЕДА    якорь не единственный или отсутствует: ' +
        нетЯкоря.map(([ф, я]) => ф + ' / ' + я.trim()).join(' | ') + '\n');
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
        if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
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

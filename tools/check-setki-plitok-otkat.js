/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА СЕТОК ПЛИТОК. На КОПИИ.
 *
 * Каждый откат возвращает ровно то, от чего правило бережёт, — и требует,
 * чтобы упало ИМЕННО оно. Якоря держатся на содержимом блока, а не на
 * положении строки и не на числе, которое правка может сменить верно.
 *
 *   node tools/check-setki-plitok-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-setki-'));
['css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛЬ = 'css/admin.css';
const чистый = fs.readFileSync(path.join(КОРЕНЬ, ЦЕЛЬ), 'utf8');

function прогон(текст) {
    fs.writeFileSync(path.join(песок, ЦЕЛЬ), текст === null ? чистый : текст);
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-setki-plitok.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЬ ОДИН НА ВСЕ ОТКАТЫ — объявление потолка у сетки кортов: живёт в
   блоке постоянно и от способа записи раскладки не зависит. Проверено
   счётом, что встречается ровно один раз. */
const ЯКОРЬ = '.ad-crt-stats-grid {\n    --ad-plitok: 2;';
const разЯкорь = чистый.split(ЯКОРЬ).length - 1;

const ОТКАТЫ = [
    ['вернуть раскладку в саму сетку, убрав потолок',
     т => т.replace(ЯКОРЬ, '.ad-crt-stats-grid {\n    grid-template-columns: 1fr 1fr;'),
     'у каждой сетки плиток потолок колонок задан параметром'],

    ['вернуть раскладку плиток в точку останова',
     т => т.replace(ЯКОРЬ,
         '@media (max-width: 768px) {\n    .ad-crt-stats-grid { grid-template-columns: 1fr; }\n}\n' + ЯКОРЬ),
     'сетки плиток не упоминаются в медиа-запросах'],

    ['завести auto-fit без потолка — сетка снова соврёт о размере',
     т => т.replace(ЯКОРЬ,
         '.ad-novaya-setka { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }\n' + ЯКОРЬ),
     'auto-fit нигде не заведён без потолка колонок'],

    ['завести ЕЩЁ одну точку останова мимо шкалы — храповик',
     т => т.replace(ЯКОРЬ,
         '@media (max-width: 820px) {\n    .ad-nekaya-polosa { display: none; }\n}\n' + ЯКОРЬ),
     'точек останова мимо шкалы не больше потолка'],

    ['поставить порог переноса мимо восьмёрки',
     т => т.replace('--ad-plitka-min: 160px;', '--ad-plitka-min: 150px;'),
     'порог переноса плитки стоит на шкале восьмёрки'],

    ['разобрать компонент — вернуть каждой сетке свою раскладку',
     т => т.replace(/grid-template-columns:\s*repeat\(auto-fit, minmax\(max\(var\(--ad-plitka-min\)[\s\S]*?1fr\)\);/,
                    'grid-template-columns: repeat(3, 1fr);'),
     'раскладка плиток объявлена в компоненте, а не в каждой сетке'],
];

console.log('');
if (разЯкорь !== 1) {
    console.log('  БЕДА    якорь встречается ' + разЯкорь + ' раз в ' + ЦЕЛЬ +
                ' — откаты бессмысленны\n');
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

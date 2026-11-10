/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ТЕЛЕФОН: КАРТОЧКА И СЕТКА». На КОПИИ.
 *   node tools/check-telefon-karta-i-setka-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ, а не на номере строки.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-telefon-'));
/* КОПИЯ, НЕПОЛНАЯ ОТНОСИТЕЛЬНО ПРОВЕРЯЕМОГО, НИЧЕГО НЕ ДОКАЗЫВАЕТ:
   сторож читает css и лежит в tools — берём обе папки целиком. */
['css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ОБЗОР = 'css/tournaments-overview.css';
const ТУРНИР = 'css/tournament-detail.css';
const ФАЙЛЫ = [ОБЗОР, ТУРНИР];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правки) {
    ФАЙЛЫ.forEach(ф => {
        const п = (правки || []).find(([и]) => и === ф);
        let текст = исходник[ф];
        if (п) текст = текст.split(п[1]).join(п[2]);
        fs.writeFileSync(path.join(песок, ф), текст);
    });
    try {
        const вывод = execFileSync(process.execPath,
            [path.join(песок, 'tools/check-telefon-karta-i-setka.js')],
            { encoding: 'utf8' });
        return { упало: false, вывод };
    } catch (e) {
        return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') };
    }
}

const ОТКАТЫ = [
    ['убрать отступы через переменные', [[ОБЗОР,
      'padding: var(--to-pad-y) var(--to-pad-x) var(--to-pad-y) var(--to-pad-left);',
      'padding: var(--space-md) var(--space-lg);']],
     'отступ карточки объявлен через переменные'],

    ['вернуть место под афишу на padding-left', [[ОБЗОР,
      '--to-pad-left: calc(var(--to-thumb, 120px) + var(--space-md));',
      'padding-left: calc(var(--to-thumb, 120px) + var(--space-md));']],
     'место под афишу задаётся переменной, а не padding-left'],

    ['вернуть сокращённый padding в медиа', [[ОБЗОР,
      '.to-compact {\n        --to-pad-y: var(--space-sm);\n        --to-pad-x: var(--space-md);\n    }',
      '.to-compact {\n        padding: var(--space-sm) var(--space-md);\n    }']],
     'точки останова меняют переменные, а не свойство'],

    ['сузить колонку сетки обратно до 150', [[ТУРНИР,
      'flex: 0 0 192px;\n        width: 192px;\n        min-width: 192px;',
      'flex: 0 0 150px;\n        width: 150px;\n        min-width: 150px;']],
     'ни одна ступень колонки сетки не уже замеренной'],

    ['вернуть колонке clamp вместо ступени', [[ТУРНИР,
      '.td-bracket-round {\n        min-width: 200px;',
      '.td-bracket-round {\n        min-width: clamp(160px, 42.7vw, 180px);']],
     'в лестнице нет ступеней мимо шкалы'],

    ['сузить клетку сетки обратно до 150', [[ТУРНИР,
      'box-sizing: border-box;\n        width: 184px;',
      'box-sizing: border-box;\n        width: 150px;']],
     'клетка сетки не уже колонки минус зазор'],

    ['вернуть обрезку имени многоточием', [[ТУРНИР,
      '        -webkit-line-clamp: 2;\n        -webkit-box-orient: vertical;\n        overflow: hidden;',
      '        -webkit-line-clamp: 2;\n        text-overflow: ellipsis;\n        -webkit-box-orient: vertical;\n        overflow: hidden;']],
     'имя в сетке не обрезается многоточием'],
];

console.log('\n  ПРУВЕР «ТЕЛЕФОН: КАРТОЧКА И СЕТКА» — на копии\n');
let плохих = 0;
/* ЧИСТАЯ КОПИЯ ОБЯЗАНА БЫТЬ ЗЕЛЁНОЙ: иначе откаты «падают» сами по себе. */
const чистый = прогон(null);
if (чистый.упало) { console.log('  x чистая копия уже падает:\n' + чистый.вывод); плохих++; }
else console.log('  v чистая копия зелёная');

ОТКАТЫ.forEach(([имя, правки, ждём]) => {
    let беда = null;
    правки.forEach(([ф, было]) => {
        const n = исходник[ф].split(было).length - 1;
        if (n !== 1) беда = 'якорь встречается ' + n + ' раз в ' + ф;
    });
    if (беда) { console.log('  ? ' + имя + '  ->  ' + беда); плохих++; return; }
    const р = прогон(правки);
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
    console.log('  НЕ ТАК  ' + плохих + ' не доказали правило\n');
    process.exitCode = 1;
}

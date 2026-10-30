/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА РАЗДЕЛИТЕЛЯ ТЫСЯЧ (кусок 192). На КОПИИ.
 *   node tools/check-razdelitel-tysyach-otkat.js
 *
 * Три отката возвращают ровно то, что стояло в коде до 27.10: свою копию
 * разделителя, обычный пробел вместо неразрывного и страницу без дома.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-chisla-'));
['js', 'tools', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ДОМ = 'js/kslt-chisla.js',
      OVL = 'js/tournaments-overlay.js',
      СТР = 'pages/tournaments-overview.html';
const ФАЙЛЫ = [ДОМ, OVL, СТР];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

/* Откат — это либо пара «найти/заменить», либо ФУНКЦИЯ над текстом:
   перестановка скрипта одной заменой не выражается, а откат, который
   делает не то, что обещает, не доказывает ничего. */
function прогон(правка) {
    ФАЙЛЫ.forEach(ф => {
        let т = исходник[ф];
        if (правка && правка[0] === ф) {
            т = typeof правка[1] === 'function' ? правка[1](т) : т.replace(правка[1], правка[2]);
        }
        fs.writeFileSync(path.join(песок, ф), т);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-razdelitel-tysyach.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть свою копию разделителя в наложение (как было до 27.10)',
     [OVL, 'var str = KSLT_CHISLA.тысячи(num);',
           "var str = String(num).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ');"],
     'разделитель тысяч назван только в доме'],

    ['вернуть ОБЫЧНЫЙ пробел разделителем',
     [ДОМ, 'var РАЗДЕЛИТЕЛЬ = String.fromCharCode(0xA0);',
           "var РАЗДЕЛИТЕЛЬ = ' ';"],
     'разделитель — неразрывный пробел'],

    ['снять отказ на пустом значении',
     [ДОМ, "    Ч.деньги = function (n) {\n        if (n === null || n === undefined || n === '') return '';",
           '    Ч.деньги = function (n) {'],
     'пустота остаётся пустотой'],

    ['снять дом со страницы обзора турниров',
     [СТР, '<script src="../js/kslt-chisla.js?v=1"></script>\n    ', ''],
     'дом чисел подключён на каждой странице, где его зовут'],

    /* ЯКОРЬ БЕРЁТСЯ ИЗ ФАЙЛА — см. `tools/yakor-tega.js`. Здесь стояли
       оба тега с версиями (`kslt-chisla.js?v=1`, `tournaments-overview.js?v=54`),
       и обе уже другие: откат ронял ДРУГОЕ правило, потому что первая
       замена не срабатывала, а вторая — срабатывала. */
    ['поставить дом ПОСЛЕ его читателя',
     [СТР, т => {
         const Я = require('./yakor-tega.js');
         const пара = Я.переставить(КОРЕНЬ, СТР, 'kslt-chisla.js', 'tournaments-overview.js');
         return пара ? т.replace(пара.было, пара.станет) : т;
     }],
     'дом чисел подключён РАНЬШЕ тех, кто его зовёт'],

    ['отнять у дома приём «деньги»',
     [ДОМ, '    Ч.деньги = function (n) {', '    Ч.денег = function (n) {'],
     'дом чисел есть и отдаёт два приёма']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, правка, ждём]) => {
    if (typeof правка[1] !== 'function') {
        const n = исходник[правка[0]].split(правка[1]).length - 1;
        if (n !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз'); плохих++; return; }
    } else if (правка[1](исходник[правка[0]]) === исходник[правка[0]]) {
        console.log('  ? ' + имя + '  ->  правка ничего не изменила'); плохих++; return;
    }
    const р = прогон(правка);
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
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

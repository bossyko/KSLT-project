/**
 * ПРУВЕР ЗАМОРОЗКИ «ПРОГНОЗ ВЫКЛЮЧЕН».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-prognoz-vyklyuchen-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-prognoz-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const МОДУЛЬ = 'js/match-prediction.js';
const ТУРНИР = 'js/tournament-detail.js';
const ВЫЗОВ  = 'js/challenge-detail.js';

const ОТКАТЫ = [
    /* 1. Выключатель убрали из модуля — каждый экран решает сам. */
    [МОДУЛЬ, '    P.ВКЛЮЧЁН = false;', '    var ВКЛЮЧЁН = false;',
     'выключатель живёт в общем модуле'],

    /* 2. Полосу включили обратно, не дождавшись данных. */
    [МОДУЛЬ, 'P.ВКЛЮЧЁН = false;', 'P.ВКЛЮЧЁН = true;',
     'полоса выключена'],

    /* 3. Страница турнира перестала спрашивать выключатель. */
    [ТУРНИР, 'var predOpts = (isDbl || !предсказаниеВидно) ? null : {',
             'var predOpts = isDbl ? null : {',
     'страница турнира спрашивает общий выключатель'],

    /* 4. Страница вызова — то же самое. */
    [ВЫЗОВ, "        if (!window.KSLT_PREDICTION.показывать()) return '';\n", '',
     'страница вызова спрашивает общий выключатель'],

    /* 5. Выключенный код вынесли «как мёртвый». */
    [МОДУЛЬ, '    function streak(form) {', '    function серия_(form) {',
     'формула осталась на месте'],

    /* 6. Из страницы вызова пропал отбор по разряду. */
    [ВЫЗОВ, "        if (b.format && b.format !== 'singles') return '';\n", '',
     'в парных прогноз выключен своей причиной']
];

let провалов = 0;

ОТКАТЫ.forEach(([файл, было, стало, ждём], и) => {
    const путь = path.join(ВРЕМ, файл);
    const исходный = fs.readFileSync(путь, 'utf8');

    const встреч = исходный.split(было).length - 1;
    if (встреч !== 1) {
        console.log('✗ откат ' + (и + 1) + ': якорь встречается ' + встреч +
            ' раз — нужен ровно один\n    ' + было.slice(0, 70).replace(/\n/g, ' ⏎ '));
        провалов++;
        return;
    }

    fs.writeFileSync(путь, исходный.replace(было, стало));

    let вывод = '', упало = false;
    try {
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-prognoz-vyklyuchen.js')],
            { cwd: ВРЕМ, encoding: 'utf8' });
    } catch (e) {
        упало = true;
        вывод = (e.stdout || '') + (e.stderr || '');
    }

    fs.writeFileSync(путь, исходный);

    if (!упало) {
        console.log('✗ откат ' + (и + 1) + ' («' + ждём + '»): правило НЕ упало — оно ничего не держит');
        провалов++;
    } else if (вывод.indexOf(ждём) === -1) {
        console.log('✗ откат ' + (и + 1) + ': упало не то правило. Ждали «' + ждём + '», а в выводе:\n' +
            вывод.split('\n').filter(с => с.indexOf('•') !== -1).join('\n'));
        провалов++;
    } else {
        console.log('✓ откат ' + (и + 1) + ' уронил «' + ждём + '»');
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });

if (провалов) {
    console.log('\n✗ Прувер: ' + провалов + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
    process.exit(1);
}
console.log('\n✓ Прувер: все ' + ОТКАТЫ.length + ' откатов уронили свои правила');

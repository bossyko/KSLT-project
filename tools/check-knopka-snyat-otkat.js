/**
 * ПРУВЕР ЗАМОРОЗКИ «КНОПКА СНЯТЬ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откат 1 — то, что жило в коде до 01.10 и не работало ни одного дня.
 *
 *   node tools/check-knopka-snyat-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-snyat-'));

['js', 'tools', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS   = 'css/admin.css';
const СЕТКА = 'js/admin/sections/bracket.js';

const ОТКАТЫ = [
    /* 1. Краска «Снять» уезжает обратно НАД `.ad-brk-edit` — ровно то
       положение, в котором она лежала до 01.10 и проигрывала. Текст в
       файле есть, глазами всё хорошо, а кнопка лаймовая. */
    [CSS,
     '.ad-brk-clear {\n    color: var(--text-secondary);\n    background: rgba(255,255,255,0.03);\n}',
     '',
     'краска «Снять» объявлена ниже краски «Изм.»'],

    /* 2. Вернулась краска, проваливающая WCAG: 3.21 при кегле 11. */
    [CSS,
     '.ad-brk-clear {\n    color: var(--text-secondary);',
     '.ad-brk-clear {\n    color: var(--text-dim);',
     '«Снять» взяла померенную краску'],

    /* 3. Горячая кнопка завела свою краску вместо краски пометки. */
    [CSS,
     '.ad-brk-clear.ad-brk-clear-hot {\n    color: var(--warning);\n    background: var(--warning-subtle);',
     '.ad-brk-clear.ad-brk-clear-hot {\n    color: #ff8a8a;\n    background: rgba(255,138,138,0.10);',
     'у горячей «Снять» краска пометки, а не своя'],

    /* 4. Акцент сузили до одного тона — дубль остался без лечения. */
    [СЕТКА,
     "(пометка.тон === 'dup' || пометка.тон === 'mismatch')",
     "(пометка.тон === 'mismatch')",
     'горячей кнопка становится по ДВУМ тонам, а не по одному'],

    /* 5. Пометку снова читают после кнопок. */
    [СЕТКА,
     "                var пометка = пометки[match.id];\n                var лечитПометку",
     "                var пометка = (пометки || {})['нет'];\n                var лечитПометку",
     'пометка читается ДО кнопок']
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
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-knopka-snyat.js')],
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

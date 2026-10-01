/**
 * ПРУВЕР ЗАМОРОЗКИ «ПРОХОД БЕЗ ИГРЫ НЕ ЗАПИРАЕТ КЛЕТКУ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. «У меня
 * зелёное» ничего не доказывает.
 *
 * Откаты — ровно то, что жило в коде до 01.10, и ровно те способы, какими
 * беда может вернуться незаметно.
 *
 *   node tools/check-bye-ne-zapiraet-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-bye-'));

/* Копируем только то, что читает проверка */
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const СЕТКА = 'js/admin/sections/bracket.js';

const ОТКАТЫ = [
    /* 1. Прежний вид функции: отбоя по BYE нет вовсе. Именно так и было
       до 01.10, и именно так человек оказался в сетке дважды. */
    [СЕТКА,
     "        if (m.score === 'BYE') return false;\n        if (m.status === 'completed') return true;",
     "        if (m.status === 'completed') return true;",
     'проход без игры не запирает клетку'],

    /* 2. Отбой на месте, но уехал ВНИЗ — за проверку completed. Строка в
       файле есть, глазами всё хорошо, а клетка снова заперта. Ровно та
       ловушка, ради которой правило смотрит на порядок, а не на наличие. */
    [СЕТКА,
     "        if (m.score === 'BYE') return false;\n        if (m.status === 'completed') return true;",
     "        if (m.status === 'completed') return true;\n        if (m.score === 'BYE') return false;",
     'отбой по BYE проверяется раньше прочих'],

    /* 3. Пересчёт завёл свою проверку вместо общей — пятое определение
       одного понятия. */
    [СЕТКА,
     '            if (клеткаЗаперта(m)) return;',
     "            if (m.status === 'completed') return;",
     'пересчёт сетки спрашивает клеткаЗаперта'],

    /* 4. Судья «уже сыграл» перестал отличать проход без игры: человека,
       не выходившего на корт, стало нельзя заменить. */
    [СЕТКА,
     "            return m.status === 'completed' && m.score && m.score !== 'BYE';",
     "            return m.status === 'completed' && m.score;",
     'сыгранность стороны исключает проход без игры']
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
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-bye-ne-zapiraet.js')],
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

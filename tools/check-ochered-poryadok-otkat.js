/**
 * ПРУВЕР ЗАМОРОЗКИ «ПОРЯДОК ОЧЕРЕДИ — ВРЕМЯ ПОСТАНОВКИ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — то, что жило в коде до 01.10, по одной двери за раз: правка
 * одной двери не чинила остальные, и прувер держит каждую отдельно.
 *
 *   node tools/check-ochered-poryadok-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ochered-'));

['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'supabase/functions/tournament-register'),
          path.join(ВРЕМ, 'supabase/functions/tournament-register'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'sql/функции'), path.join(ВРЕМ, 'sql/функции'), { recursive: true });

const СЕТКА  = 'js/admin/sections/bracket.js';
const СЕРВЕР = 'supabase/functions/tournament-register/index.ts';
const SQL    = 'sql/функции/ochered-vremya-postanovki.sql';

const ОТКАТЫ = [
    /* 1. Подъём снова читает очередь по времени подачи — прежнее
       поведение: «Снять» не снимает. */
    [СЕТКА,
     ".order('queue_at', { ascending: true }).limit(свободно);",
     ".order('registered_at', { ascending: true }).limit(свободно);",
     'подъём сортирует очередь по queue_at'],

    /* 2. Дверь «окно три исхода» перестала ставить отметку. */
    [СЕТКА,
     ".update({ status: 'waitlist', waitlisted_at: new Date().toISOString() })\n                    .eq('id', regId);",
     ".update({ status: 'waitlist' }).eq('id', regId);",
     'дверь «админка: окно «три исхода» и меню строки»: отметка времени постановки'],

    /* 3. Дверь «меню строки» перестала ставить отметку — ровно та, через
       которую беда и прошла после починки первой. */
    [СЕТКА,
     ".update({ status: 'waitlist', waitlisted_at: new Date().toISOString() })\n                            .eq('id', regId);",
     ".update({ status: 'waitlist' }).eq('id', regId);",
     'дверь «админка: окно «три исхода» и меню строки»: отметка времени постановки'],

    /* 4. Сервер вытесняет игрока нижней категории без отметки. */
    [СЕРВЕР,
     ".update({ status: 'waitlist', waitlisted_at: new Date().toISOString() })",
     ".update({ status: 'waitlist' })",
     'дверь «сервер: вытеснение игроком своей категории»: отметка времени постановки'],

    /* 5. queue_at перестал быть генерируемым: порядок снова можно
       записать руками. */
    [SQL,
     'GENERATED ALWAYS AS (COALESCE(waitlisted_at, registered_at)) STORED',
     'DEFAULT now()',
     'queue_at заведён генерируемым'],

    /* 6. Напарник заменяемой пары снова выпал из списка занятых: поиск
       предложит поставить капитаном того, кто уже стоит напарником. */
    [СЕТКА,
     '        [reg.player_id, reg.partner_id].forEach(function(ид) {',
     '        [].forEach(function(ид) {',
     'обе стороны заменяемой заявки недоступны для выбора'],

    /* 7. Сторож «разные игроки» снят с записи: список обойти можно
       выбором из очереди, он кладётся в то же поле мимо поиска. */
    [СЕТКА,
     '            if (selectedId && другаяСторона && selectedId === другаяСторона) {',
     '            if (false) {',
     'сторож «разные игроки» стоит и на записи, а не только в списке']
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
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-ochered-poryadok.js')],
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

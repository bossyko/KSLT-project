/**
 * ПРУВЕР СТОРОЖА ПОКАЗА ДАТЫ.
 *
 * Берёт КОПИЮ дерева, возвращает прежнее значение и требует, чтобы упало
 * ИМЕННО то правило, которое за это отвечает.
 *
 * Второй откат — настоящая находка 11.11: пояс, переставленный на место
 * языка, не бросает и не ругается, а молча отбрасывается, и день
 * съезжает на сутки. Правило обязано ловить МЕСТО аргумента, а не слово
 * `timeZone` где-нибудь в скобках.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'daty-'));
    fs.cpSync(path.join(корень, 'js'), path.join(двор, 'js'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-pokaz-daty.js'), path.join(двор, 'tools/check-pokaz-daty.js'));
    return двор;
}

const ЯКОРЬ = ".toLocaleDateString(undefined, { timeZone: (window.KSLT_VREMYA && window.KSLT_VREMYA.зона) || 'Asia/Bishkek' })";

const ОТКАТЫ = [
    {
        имя: 'пояс переставлен на место языка — день съезжает на сутки',
        правка(двор) {
            const ф = path.join(двор, 'js/admin/sections/live.js');
            let т = fs.readFileSync(ф, 'utf8');
            if (т.split(ЯКОРЬ).length - 1 !== 1) return 'якорь не единственный';
            fs.writeFileSync(ф, т.replace(ЯКОРЬ, ЯКОРЬ.replace('(undefined, {', '({')));
        },
        ждём: /пояс стоит ПЕРВЫМ аргументом/,
    },
    {
        имя: 'пояс убран вовсе — день берётся у смотрящего',
        правка(двор) {
            const ф = path.join(двор, 'js/admin/sections/live.js');
            let т = fs.readFileSync(ф, 'utf8');
            if (т.split(ЯКОРЬ).length - 1 !== 1) return 'якорь не единственный';
            fs.writeFileSync(ф, т.replace(ЯКОРЬ, '.toLocaleDateString()'));
        },
        ждём: /момент показывается без пояса/,
    },
    {
        имя: 'дом времени перестал отдавать зону',
        правка(двор) {
            const ф = path.join(двор, 'js/kslt-vremya.js');
            let т = fs.readFileSync(ф, 'utf8');
            if (т.split('В.зона =').length - 1 !== 1) return 'якорь не единственный';
            fs.writeFileSync(ф, т.replace('В.зона =', 'В.зонаСтарая ='));
        },
        ждём: /дом времени больше не отдаёт зону/,
    },
    {
        имя: 'зона рассыпана руками по файлам, мимо дома',
        правка(двор) {
            const где = ['js/coaches.js', 'js/courts.js', 'js/news.js', 'js/player.js'];
            for (const ф of где) {
                const п = path.join(двор, ф);
                let т = fs.readFileSync(п, 'utf8');
                fs.writeFileSync(п, "var зона = 'Asia/Bishkek';\n" + т);
            }
        },
        ждём: /'Asia\/Bishkek' написан руками вне дома времени/,
    },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error(`  ✗ ${о.имя}: ${беда}`); fs.rmSync(двор, { recursive: true, force: true }); continue; }

    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-pokaz-daty.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });

    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер показа даты: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

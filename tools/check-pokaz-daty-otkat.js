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

/* ЯКОРЬ ПЕРЕВЕШЕН 12.11. Он держался на строке
   `.toLocaleDateString(undefined, { timeZone: (window.KSLT_VREMYA && …) })`
   в live.js. Починка пояса 11.11 увела семнадцать таких мест в дом времени
   (`KSLT_VREMYA.показДня`), и строки в файле не стало вовсе: прувер честно
   сказал «якорь не единственный» — его ноль. ОТКАТ, КОТОРЫЙ НЕ СОСТОЯЛСЯ,
   НИЧЕГО НЕ ДОКАЗЫВАЕТ.
   Берём место, которое ЖИВО и которое сторож действительно судит: срок
   закрытия доступа на странице турнира. Оно одно на весь файл. */
const ФАЙЛ_ПОКАЗА = 'js/tournament-detail.js';
const ЯКОРЬ = "new Date(plRes.data.banned_until).toLocaleDateString(KSLT_YAZYK.локаль,\n                            { timeZone: window.KSLT_VREMYA.зона })";

const ОТКАТЫ = [
    {
        имя: 'пояс переставлен на место языка — день съезжает на сутки',
        правка(двор) {
            const ф = path.join(двор, ФАЙЛ_ПОКАЗА);
            let т = fs.readFileSync(ф, 'utf8');
            if (т.split(ЯКОРЬ).length - 1 !== 1) return 'якорь не единственный';
            /* Пояс переезжает на место языка: язык выброшен, объект стал
               первым доводом — язык его не читает, пояс молча пропадает. */
            fs.writeFileSync(ф, т.replace(ЯКОРЬ,
                "new Date(plRes.data.banned_until).toLocaleDateString({ timeZone: window.KSLT_VREMYA.зона })"));
        },
        ждём: /пояс стоит ПЕРВЫМ аргументом/,
    },
    {
        имя: 'пояс убран вовсе — день берётся у смотрящего',
        правка(двор) {
            const ф = path.join(двор, ФАЙЛ_ПОКАЗА);
            let т = fs.readFileSync(ф, 'utf8');
            if (т.split(ЯКОРЬ).length - 1 !== 1) return 'якорь не единственный';
            fs.writeFileSync(ф, т.replace(ЯКОРЬ,
                "new Date(plRes.data.banned_until).toLocaleDateString(KSLT_YAZYK.локаль)"));
        },
        ждём: /момент показывается без пояса/,
    },
    {
        имя: 'в доме доводы показа переставлены — пояс встал на место языка',
        правка(двор) {
            const ф = path.join(двор, 'js/kslt-vremya.js');
            let т = fs.readFileSync(ф, 'utf8');
            const я = 'return d.toLocaleDateString(речь || undefined, сПоясом(вид));';
            if (т.split(я).length - 1 !== 1) return 'якорь не единственный';
            fs.writeFileSync(ф, т.replace(я, 'return d.toLocaleDateString(сПоясом(вид));'));
        },
        ждём: /показ в доме времени идёт без пояса вторым доводом/,
    },
    {
        имя: 'сПоясом ставит зону ПЕРЕД видом — зовущий перебивает дом',
        правка(двор) {
            const ф = path.join(двор, 'js/kslt-vremya.js');
            let т = fs.readFileSync(ф, 'utf8');
            const я = '        о.timeZone = ЗОНА;\n        return о;';
            if (т.split(я).length - 1 !== 1) return 'якорь не единственный';
            /* Зона уезжает в начало — теперь её перебивает вид зовущего. */
            fs.writeFileSync(ф, т
                .replace('        var о = {};\n', '        var о = { timeZone: ЗОНА };\n')
                .replace(я, '        return о;'));
        },
        ждём: /сПоясом ставит зону НЕ ПОСЛЕ вида/,
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

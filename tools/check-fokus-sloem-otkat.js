/**
 * ПРУВЕР СТОРОЖА ФОКУСА.
 *
 * Первый откат — состояние до 11.11: общего правила нет вовсе, и 53
 * элемента главной остаются без кольца. Остальные — обходы, на которых
 * правило обязано падать.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'fokus-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-fokus-sloem.js'), path.join(двор, 'tools/check-fokus-sloem.js'));
    fs.mkdirSync(path.join(двор, 'css'));
    for (const ф of fs.readdirSync(path.join(корень, 'css')).filter(ф => ф.endsWith('.css'))) {
        fs.copyFileSync(path.join(корень, 'css', ф), path.join(двор, 'css', ф));
    }
    return двор;
}

function замена(файл, было, стало) {
    return function (двор) {
        const п = path.join(двор, файл);
        const т = fs.readFileSync(п, 'utf8');
        const n = т.split(было).length - 1;
        if (n !== 1) return `якорь встречается ${n} раз`;
        fs.writeFileSync(п, т.replace(было, стало));
    };
}

const ОТКАТЫ = [
    {
        /* ОТКАТ УБИРАЕТ ПРАВИЛО ЦЕЛИКОМ. Первая редакция срезала два
           селектора из девяти, правило оставалось — и сторож честно
           говорил «не покрывает button», а я считал это промахом
           сторожа. ОТКАТ, СНЯВШИЙ ЧАСТЬ, ДОКАЗЫВАЕТ ДРУГОЕ ПРАВИЛО. */
        имя: 'общего правила фокуса снова нет',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.indexOf('a:focus-visible,\nbutton:focus-visible,');
            if (i < 0) return 'общего правила нет в исходнике';
            const j = т.indexOf('}', i);
            fs.writeFileSync(п, т.slice(0, i) + т.slice(j + 1));
        },
        ждём: /общего правила фокуса на слой нет/,
    },
    {
        имя: 'кольцо задано числом мимо шкалы',
        правка: замена('css/style.css', '[tabindex]:not([tabindex="-1"]):focus-visible {\n    outline: var(--bw-heavy) solid var(--accent);', '[tabindex]:not([tabindex="-1"]):focus-visible {\n    outline: 3px solid var(--accent);'),
        ждём: /не ставит кольцо толщиной со шкалы/,
    },
    {
        имя: 'кнопки выпали из общего правила',
        правка: замена('css/style.css', 'a:focus-visible,\nbutton:focus-visible,\ninput:focus-visible,', 'a:focus-visible,\ninput:focus-visible,'),
        ждём: /не покрывает button:focus-visible/,
    },
    {
        имя: 'карусель снова без своего кольца',
        правка: замена('css/style.css', '.carousel-slide-infinite:focus-visible {\n    outline: var(--bw-heavy) solid var(--accent);\n    outline-offset: 3px;\n}', '.carousel-slide-infinite:focus-visible {\n    text-decoration: none;\n}'),
        ждём: /carousel-slide-infinite без своего кольца/,
    },
    {
        имя: 'правило гасит кольцо и не возвращает его',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            if (!/\.trn-chip:focus-visible/.test(т)) return 'парного правила .trn-chip нет';
            fs.writeFileSync(п, т.replace(/\.trn-chip:focus-visible/g, '.trn-chip-staroe:focus-visible'));
        },
        ждём: /гасит кольцо и не даёт его обратно/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-fokus-sloem.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер фокуса: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

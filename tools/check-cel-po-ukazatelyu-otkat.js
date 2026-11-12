/**
 * ПРУВЕР СТОРОЖА «ЦЕЛЬ ПО УКАЗАТЕЛЮ».
 *
 * Второй откат — настоящее состояние до 11.11: переключатель согласия
 * поднимался до 44 ТОЛЬКО в медиа по ширине, и на планшете боком с
 * пальцем оставался 36. Этот же откат показывает, что правило 4 не
 * мёртвое: оно ловит ровно такие случаи.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'ukaz-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-cel-po-ukazatelyu.js'), path.join(двор, 'tools/check-cel-po-ukazatelyu.js'));
    fs.mkdirSync(path.join(двор, 'css'));
    fs.copyFileSync(path.join(корень, 'css/style.css'), path.join(двор, 'css/style.css'));
    return двор;
}

function замена(было, стало) {
    return function (двор) {
        const п = path.join(двор, 'css/style.css');
        const т = fs.readFileSync(п, 'utf8');
        const n = т.split(было).length - 1;
        if (n !== 1) return `якорь встречается ${n} раз`;
        fs.writeFileSync(п, т.replace(было, стало));
    };
}

const ОТКАТЫ = [
    {
        имя: 'вкладки разряда снова без правила под указателем',
        правка: замена('    .rankings-tab {\n        min-height: var(--btn-h-md);\n    }\n', ''),
        ждём: /\.rankings-tab: нет правила под указателем/,
    },
    {
        имя: 'переключатель согласия снова поднимается только по ширине',
        правка: замена('@media (any-pointer: coarse), (max-width: 992px) {\n    .de-switch button {', '@media (max-width: 640px) {\n    .de-switch button {'),
        ждём: /\.de-switch button: цель поднята до ступени только в медиа по ширине/,
    },
    {
        имя: 'соцсети получают размер числом мимо ступени',
        правка: замена('    .social-link {\n        width: var(--btn-h-md);\n        height: var(--btn-h-md);\n    }', '    .social-link {\n        width: 44px;\n        height: 44px;\n    }'),
        ждём: /\.social-link: размер цели задан мимо ступени/,
    },
    {
        имя: 'блоки с указателем вычищены — возврат к ширине',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            fs.writeFileSync(п, т.replace(/any-pointer: coarse/g, 'min-width: 1px'));
        },
        ждём: /блоков с указателем/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-cel-po-ukazatelyu.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер цели по указателю: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

/**
 * ПРУВЕР СТОРОЖА РЯДА ДЕЙСТВИЙ (.ad-form-actions).
 *
 * Прежнее состояние, замеренное 11.11: класс стоял в трёх формах, а в
 * css его не было ВОВСЕ — display оставался block, кнопки шли стопкой и
 * слипались. Откаты возвращают именно это, плюс двойное объявление и
 * числа мимо шкалы.
 *
 * ПРАВКА ИДЁТ ВНУТРЬ БЛОКА: `gap: var(--space-3)` встречается в файле
 * многократно, и замена «первого совпадения» 11.11 уже один раз сделала
 * прувер зелёным на четырёх несработавших откатах.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'ryad-'));
    fs.cpSync(path.join(корень, 'css'), path.join(двор, 'css'), { recursive: true });
    fs.cpSync(path.join(корень, 'js'), path.join(двор, 'js'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-ryad-deystviy.js'), path.join(двор, 'tools/check-ryad-deystviy.js'));
    return двор;
}

/** Правка ВНУТРИ блока .ad-form-actions, а не где попало в файле. */
function вБлоке(двор, менять) {
    const п = path.join(двор, 'css/admin.css');
    const т = fs.readFileSync(п, 'utf8');
    const i = т.indexOf('.ad-form-actions {');
    if (i < 0) return 'блока .ad-form-actions нет';
    const j = т.indexOf('}', i);
    if (j < 0) return 'блок не закрыт';
    const блок = т.slice(i, j + 1);
    const новый = менять(блок);
    if (новый === блок) return 'откат ничего не поменял';
    fs.writeFileSync(п, т.slice(0, i) + новый + т.slice(j + 1));
}

const ОТКАТЫ = [
    {
        имя: 'класса снова нет в css — вернулась болезнь h133',
        правка: д => вБлоке(д, б => '/* ' + б.replace(/\*\//g, '') + ' */'),
        ждём: /не объявлен в css\/admin\.css/,
    },
    {
        имя: 'ряд перестал быть flex — кнопки слипнутся',
        правка: д => вБлоке(д, б => б.replace('display: flex;', 'display: block;')),
        ждём: /не flex/,
    },
    {
        имя: 'зазор убран',
        правка: д => вБлоке(д, б => б.replace(/\n\s*gap: var\(--space-3\);/, '')),
        ждём: /без gap/,
    },
    {
        имя: 'зазор задан числом мимо шкалы',
        правка: д => вБлоке(д, б => б.replace('gap: var(--space-3);', 'gap: 13px;')),
        ждём: /зазор задан числом мимо шкалы/,
    },
    {
        имя: 'отступ сверху задан числом мимо шкалы',
        правка: д => вБлоке(д, б => б.replace('margin-top: var(--space-6);', 'margin-top: 26px;')),
        ждём: /отступ сверху задан числом мимо шкалы/,
    },
    {
        имя: 'класс объявлен дважды',
        правка(двор) {
            const п = path.join(двор, 'css/admin.css');
            const т = fs.readFileSync(п, 'utf8');
            fs.writeFileSync(п, т + '\n.ad-form-actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); }\n');
        },
        ждём: /объявлен 2 раза/,
    },
    {
        имя: 'класс исчез из форм — правило стало мёртвым',
        правка(двор) {
            for (const ф of fs.readdirSync(path.join(двор, 'js/admin/sections'))) {
                const п = path.join(двор, 'js/admin/sections', ф);
                const т = fs.readFileSync(п, 'utf8');
                if (т.includes('ad-form-actions')) fs.writeFileSync(п, т.replace(/ad-form-actions/g, 'ad-ryad-knopok'));
            }
            for (const ф of fs.readdirSync(path.join(двор, 'js/admin/core'))) {
                const п = path.join(двор, 'js/admin/core', ф);
                const т = fs.readFileSync(п, 'utf8');
                if (т.includes('ad-form-actions')) fs.writeFileSync(п, т.replace(/ad-form-actions/g, 'ad-ryad-knopok'));
            }
        },
        ждём: /не встречается ни в одной форме/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-ryad-deystviy.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер ряда действий: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

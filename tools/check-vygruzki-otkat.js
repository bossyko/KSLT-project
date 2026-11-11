/**
 * ПРУВЕР СТОРОЖА ВЫГРУЗОК.
 *
 * Берёт КОПИЮ файлов, возвращает каждому прежнее — настоящее, бывшее в
 * коде до 11.11, — значение и требует, чтобы упало ИМЕННО то правило,
 * которое за это отвечает. «У меня зелёное» ничего не доказывает.
 *
 * ПРАВКА ИДЁТ ВНУТРЬ БЛОКА, А НЕ В ПЕРВОЕ ПОХОЖЕЕ МЕСТО: `var items =
 * usrОтобрано;` стоит и в выгрузке, и в листе печати, и замена «первого
 * совпадения» откатила бы не то, что проверяется.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const корень = path.resolve(__dirname, '..');
const ФАЙЛЫ = [
    'tools/check-vygruzki.js',
    'js/admin/core/utils.js',
    'js/admin/sections/users.js',
    'js/admin/sections/finances.js',
    'js/admin/sections/vouchers.js',
    'js/admin/sections/players.js',
];

function тело(текст, имя) {
    const м = текст.match(new RegExp('function\\s+' + имя + '\\s*\\('));
    if (!м) return null;
    const i = текст.indexOf('{', м.index);
    let гл = 0;
    for (let j = i; j < текст.length; j++) {
        if (текст[j] === '{') гл++;
        else if (текст[j] === '}') { гл--; if (!гл) return { от: i, до: j + 1, текст: текст.slice(i, j + 1) }; }
    }
    return null;
}

const ОТКАТЫ = [
    {
        имя: 'выгрузка пользователей снова берёт всё, минуя поиск',
        файл: 'js/admin/sections/users.js', внутри: 'exportUsrExcel',
        было: 'usrОтобрано', стало: 'usrAllItems',
        ждём: /не читает отбор раздела/,
    },
    {
        имя: 'финансы снова отбирают по датам своей копией',
        файл: 'js/admin/sections/finances.js', внутри: 'exportFinExcel',
        было: 'var filtered = finОтобрано;',
        стало: "var filtered = finAllData.slice();\n        if (finDateFrom) { filtered = filtered.filter(function(p) { return p.created_at >= finDateFrom; }); }",
        ждём: /отбирает сама \(\.filter\)/,
    },
    {
        имя: 'выгрузка игроков снова делает свой запрос без фильтров',
        файл: 'js/admin/sections/players.js', внутри: 'exportPlayersExcel',
        было: 'плрФильтры(A.client.from(', стало: '(A.client.from(',
        ждём: /делает свой запрос в базу мимо/,
    },
    {
        имя: 'ваучеры перестали ставить число на кнопки',
        файл: 'js/admin/sections/vouchers.js',
        было: "A.подписьВыгрузки(['adVchExportPdf', 'adVchExcelBtn'], filtered.length);", стало: '',
        ждём: /adVchExportPdf не получает числа строк/,
    },
    {
        имя: 'кнопка пользователей снова подписана Excel',
        файл: 'js/admin/sections/users.js',
        было: ">\u{1F4CA} CSV</button>", стало: ">\u{1F4CA} Excel</button>",
        ждём: /подписана Excel, а файл отдаётся csv/,
    },
    {
        имя: 'подпись перестала гасить кнопку на нуле',
        файл: 'js/admin/core/utils.js', внутри: 'подписьВыгрузки',
        было: 'б.disabled = !n;', стало: '',
        ждём: /не гасит кнопку на нуле/,
    },
    {
        имя: 'лист печати ваучеров переехал и правило ослепло',
        файл: 'js/admin/sections/vouchers.js',
        было: 'function openPdfReport()', стало: 'function openPdfReportНовый()',
        ждём: /функции openPdfReport нет/,
    },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'vygr-'));
    for (const ф of ФАЙЛЫ) {
        const куда = path.join(двор, ф);
        fs.mkdirSync(path.dirname(куда), { recursive: true });
        fs.copyFileSync(path.join(корень, ф), куда);
    }
    const путь = path.join(двор, о.файл);
    let т = fs.readFileSync(путь, 'utf8');

    if (о.внутри) {
        const б = тело(т, о.внутри);
        if (!б || б.текст.indexOf(о.было) === -1) {
            console.error(`  ✗ ${о.имя}: в теле ${о.внутри} нет «${о.было}» — откат не состоялся`);
            continue;
        }
        т = т.slice(0, б.от) + б.текст.replace(о.было, о.стало) + т.slice(б.до);
    } else {
        const n = т.split(о.было).length - 1;
        if (n !== 1) {
            console.error(`  ✗ ${о.имя}: якорь встречается ${n} раз — откат ненадёжен`);
            continue;
        }
        т = т.replace(о.было, о.стало);
    }
    fs.writeFileSync(путь, т);

    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-vygruzki.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        код = 1;
        вывод = (e.stdout || '') + (e.stderr || '');
    }
    fs.rmSync(двор, { recursive: true, force: true });

    if (код && о.ждём.test(вывод)) {
        упало++;
        console.log(`  ✓ ${о.имя}`);
    } else if (!код) {
        console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    } else {
        console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').map(с => '      ' + с).join('\n')}`);
    }
}

console.log(`прувер выгрузок: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

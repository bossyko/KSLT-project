/**
 * ПРУВЕР СТОРОЖА «ШАПКА ВОШЕДШЕГО».
 *
 * Каждый откат возвращает ровно то состояние, которое было до правки
 * 12.11, и требует, чтобы упало ИМЕННО своё правило. Якоря держатся на
 * содержимом блока, а не на положении строк и не на соседях.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'shapka-vosh-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-shapka-voshedshego.js'),
        path.join(двор, 'tools/check-shapka-voshedshego.js'));
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
        имя: 'пункт панели снова считает высоту из отступов (было 37 и 33)',
        правка: замена('    min-height: var(--btn-h-sm);\n    line-height: 1.2;\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    width: 100%;\n    padding: 9px 12px;',
                       '    display: flex;\n    align-items: center;\n    gap: 10px;\n    width: 100%;\n    padding: 9px 12px;'),
        ждём: /высота пункта — ступень кнопок/,
    },
    {
        имя: 'у пункта снята высота строки — ссылка и кнопка снова разъедутся',
        правка: замена('    min-height: var(--btn-h-sm);\n    line-height: 1.2;',
                       '    min-height: var(--btn-h-sm);'),
        ждём: /высота строки пункта задана/,
    },
    {
        имя: 'панель снова без предела высоты — уезжает ниже окна',
        правка: замена('    max-height: calc(100dvh - var(--header-h) - var(--space-4));\n    overflow-y: auto;\n', ''),
        ждём: /предел высоты панели считается от ступени шапки/,
    },
    {
        имя: 'предел панели зашит числом мимо ступени шапки',
        правка: замена('max-height: calc(100dvh - var(--header-h) - var(--space-4));',
                       'max-height: calc(100dvh - 64px - 16px);'),
        ждём: /предел высоты панели считается от ступени шапки/,
    },
    {
        имя: 'у панели предел есть, а прокрутки нет — пункты просто обрежутся',
        правка: замена('    overflow-y: auto;\n    min-width: 200px;', '    min-width: 200px;'),
        ждём: /панель прокручивается сама/,
    },
    {
        имя: 'кнопка аватара снова поднята только по высоте (было 38x44)',
        правка: замена('        min-height: var(--btn-h-md);\n        min-width: var(--btn-h-md);\n        justify-content: center;',
                       '        min-height: var(--btn-h-md);'),
        ждём: /у кнопки аватара заданы ОБЕ стороны/,
    },
    {
        имя: 'кнопка аватара выпала из указателя целиком',
        /* ЯКОРЬ НЕ ПЕРЕПИСЫВАЕТ КОММЕНТАРИЙ БЛОКА СЛОВО В СЛОВО: он
           берёт начало правила и его конец, а всё между ними — любое.
           Первая редакция якоря не совпала ни разу именно потому, что
           внутри блока стоит пояснение. */
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            const рег = /\n\s*\.user-dropdown-toggle \{[\s\S]*?\n\s*\}\n/g;
            const все = т.match(рег) || [];
            const вБлоке = все.filter(к => /min-width:\s*var\(--btn-h-/.test(к));
            if (вБлоке.length !== 1) return `якорь встречается ${вБлоке.length} раз`;
            fs.writeFileSync(п, т.replace(вБлоке[0], '\n'));
        },
        ждём: /кнопка аватара переведена под указатель/,
    },
    {
        имя: 'логотип снова без нижнего предела ширины (было 31 на kg)',
        правка: замена('    .logo {\n        min-width: var(--btn-h-md);\n    }\n', ''),
        ждём: /логотип имеет нижний предел ширины под указателем/,
    },
    {
        имя: 'предел логотипа зашит числом мимо ступени',
        правка: замена('    .logo {\n        min-width: var(--btn-h-md);\n    }', '    .logo {\n        min-width: 44px;\n    }'),
        ждём: /логотип имеет нижний предел ширины под указателем/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-shapka-voshedshego.js')],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер шапки вошедшего: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

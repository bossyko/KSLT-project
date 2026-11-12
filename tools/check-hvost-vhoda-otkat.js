/**
 * ПРУВЕР СТОРОЖА ХВОСТА ВХОДА.
 *
 * Откаты — настоящее прежнее состояние 11.11 (экран без раскладки,
 * выбор пола 43 вместо 44, обёртки нет) плюс три беды, на которых я
 * сегодня же и попался: лишняя скобка, обёртка не во всех языках,
 * обёртка перестала быть колонкой.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
const ФАЙЛЫ = ['tools/check-hvost-vhoda.js', 'css/style.css',
               'pages/auth.html', 'pages/auth-en.html', 'pages/auth-kg.html'];

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'hvost-'));
    for (const ф of ФАЙЛЫ) {
        const к = path.join(двор, ф);
        fs.mkdirSync(path.dirname(к), { recursive: true });
        fs.copyFileSync(path.join(корень, ф), к);
    }
    return двор;
}

function замена(файл, было, стало, всеЛи) {
    return function (двор) {
        const п = path.join(двор, файл);
        const т = fs.readFileSync(п, 'utf8');
        const n = т.split(было).length - 1;
        if (!n) return 'якоря нет';
        if (!всеЛи && n !== 1) return `якорь встречается ${n} раз`;
        fs.writeFileSync(п, всеЛи ? т.split(было).join(стало) : т.replace(было, стало));
    };
}

const ОТКАТЫ = [
    {
        имя: 'экран регистрации снова без раскладки на низком экране',
        правка: замена('css/style.css', '.auth-card:has(#signupForm.active) {', '.auth-card:has(#signupFormStaroe.active) {'),
        ждём: /#signupForm остался без раскладки/,
    },
    {
        имя: 'правило экрана есть, а сетки в нём нет',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.indexOf('.auth-card:has(#signupForm.active) {');
            if (i < 0) return 'правила нет';
            const j = т.indexOf('}', i);
            fs.writeFileSync(п, т.slice(0, i) + т.slice(i, j).replace('display: grid;', 'display: block;') + т.slice(j));
        },
        ждём: /сетки в нём нет/,
    },
    {
        имя: 'выбор пола вернулся к 43 вместо 44',
        правка: замена('css/style.css', '    min-height: var(--btn-h-md);\n    display: flex;', '    display: flex;'),
        ждём: /не берёт высоту со шкалы кнопок/,
    },
    {
        имя: 'обёртка главной колонки перестала быть колонкой',
        правка: замена('css/style.css', '.auth-col-glavnoe {\n    display: flex;\n    flex-direction: column;', '.auth-col-glavnoe {\n    display: block;'),
        ждём: /перестала быть колонкой/,
    },
    {
        имя: 'ритм обёртки задан числом мимо шкалы',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.indexOf('.auth-col-glavnoe {\n    display: flex;');
            if (i < 0) return 'объявления нет';
            const j = т.indexOf('}', i);
            fs.writeFileSync(п, т.slice(0, i) + т.slice(i, j).replace('gap: var(--space-4);', 'gap: 15px;') + т.slice(j));
        },
        ждём: /ритм числом мимо шкалы/,
    },
    {
        имя: 'обёртку забыли в английской версии',
        правка: замена('pages/auth-en.html', 'auth-col-glavnoe', 'auth-col-staroe', true),
        ждём: /auth-en\.html: обёрток \.auth-col-glavnoe 0/,
    },
    {
        имя: 'лишняя скобка в css',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            fs.writeFileSync(п, fs.readFileSync(п, 'utf8') + '\n}\n');
        },
        ждём: /скобок \{ \d+, \} \d+/,
    },
    {
        имя: 'первая клетка кода потеряла autocomplete',
        правка: замена('pages/auth.html', ' autocomplete="one-time-code"', ''),
        ждём: /без autocomplete="one-time-code"/,
    },
    {
        имя: 'у клеток кода пропала цифровая клавиатура',
        правка: замена('pages/auth.html', 'inputmode="numeric" maxlength="1" class="otp-digit" aria-label="Цифра 3', 'maxlength="1" class="otp-digit" aria-label="Цифра 3'),
        ждём: /не у всех клеток кода inputmode/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-hvost-vhoda.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер хвоста входа: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

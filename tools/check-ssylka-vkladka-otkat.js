#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «ССЫЛКА НА ВКЛАДКУ». */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'ssylka-vkladka-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-ssylka-vkladka.js'), path.join(двор, 'tools/check-ssylka-vkladka.js'));
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: сторож обходит ВЕСЬ продукт в
       поисках ссылок, значит везём корневые html, js и страницы. */
    fs.mkdirSync(path.join(двор, 'js'));
    fs.mkdirSync(path.join(двор, 'pages'));
    for (const и of fs.readdirSync(корень).filter(и => и.endsWith('.html'))) {
        fs.copyFileSync(path.join(корень, и), path.join(двор, и));
    }
    for (const и of fs.readdirSync(path.join(корень, 'js')).filter(и => и.endsWith('.js'))) {
        fs.copyFileSync(path.join(корень, 'js', и), path.join(двор, 'js', и));
    }
    fs.copyFileSync(path.join(корень, 'pages/auth.html'), path.join(двор, 'pages/auth.html'));
    return двор;
}
const замена = (файл, было, стало) => function (двор) {
    const п = path.join(двор, файл);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n < 1) return 'якорь не найден';
    if (n > 1) return 'якорь встречается ' + n + ' раз';
    fs.writeFileSync(п, т.replace(было, стало));
};

const ОТКАТЫ = [
    { имя: 'адрес снова не читается — обработчика tab нет',
      правка: замена('js/auth.js', "var просят = ИМЕНА_ВКЛАДОК[(params.get('tab') || '').toLowerCase()];",
          "var просят = null;"),
      ждём: /читает имя вкладки из адреса/ },

    { имя: 'словарь имён убран',
      правка: замена('js/auth.js', 'var ИМЕНА_ВКЛАДОК = {', 'var ИМЕНА_УБРАНЫ = {'),
      ждём: /словарь имён вкладок объявлен|понимается словарём/ },

    { имя: 'ссылка зовёт имя, которого словарь не знает',
      правка: замена('index.html', 'pages/auth.html?tab=register', 'pages/auth.html?tab=registraciya'),
      ждём: /понимается словарём/ },

    { имя: 'словарь ведёт к вкладке, которой нет в разметке',
      правка: замена('js/auth.js', "register: 'signup',", "register: 'registration',"),
      ждём: /ведёт к вкладкам, которые есть в разметке/ },

    { имя: 'открытие переписано копией работы вкладки',
      правка: замена('js/auth.js', 'if (вкладка) вкладка.click();',
          "if (вкладка) { вкладка.classList.add('active'); document.getElementById('signupForm').classList.add('active'); }"),
      ждём: /её же нажатием/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-ssylka-vkladka.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер ссылки на вкладку: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);

/**
 * ПРУВЕР СТОРОЖА ОКНА СПОНСОРА.
 *
 * Первый откат — настоящее состояние до 11.11: окно без предела высоты.
 * Именно так «Мульти Спорт» давал 592 при экране 390 и срезался с обеих
 * сторон, оставляя человека в окне без единой видимой кнопки закрытия.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
const ФАЙЛЫ = ['tools/check-okno-sponsora.js', 'css/style.css', 'js/sponsors-loader.js'];

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'spon-'));
    for (const ф of ФАЙЛЫ) {
        const к = path.join(двор, ф);
        fs.mkdirSync(path.dirname(к), { recursive: true });
        fs.copyFileSync(path.join(корень, ф), к);
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
        имя: 'окно снова без предела высоты',
        правка: замена('css/style.css', '    max-height: calc(100dvh - var(--space-8));', ''),
        ждём: /без предела высоты в dvh/,
    },
    {
        имя: 'предел задан в vh вместо dvh',
        правка: замена('css/style.css', 'max-height: calc(100dvh - var(--space-8));', 'max-height: calc(100vh - 32px);'),
        ждём: /без предела высоты в dvh/,
    },
    {
        имя: 'середина перестала прокручиваться',
        правка: замена('css/style.css', '.spon-modal-body {\n    overflow-y: auto;', '.spon-modal-body {\n    overflow-y: visible;'),
        ждём: /не прокручивается/,
    },
    {
        имя: 'у середины убрали min-height: 0 — предел молча перестаёт работать',
        правка: замена('css/style.css', '    min-height: 0;\n    -webkit-overflow-scrolling: touch;', '    -webkit-overflow-scrolling: touch;'),
        ждём: /без min-height: 0/,
    },
    {
        имя: 'нижняя кнопка снова может сжаться',
        правка: замена('css/style.css', '.spon-modal-close-btn {\n    flex-shrink: 0;', '.spon-modal-close-btn {'),
        ждём: /\.spon-modal-close-btn может сжаться/,
    },
    {
        имя: 'крестик вернулся к размеру мимо шкалы',
        правка: замена('css/style.css', '    width: var(--btn-h-md);\n    height: var(--btn-h-md);\n    background: none;', '    width: 21px;\n    height: 30px;\n    background: none;'),
        ждём: /\.spon-modal-close берёт размер мимо шкалы/,
    },
    {
        имя: 'заголовок и крестик снова разъехались по строкам',
        правка: замена('js/sponsors-loader.js',
            "'<div class=\"spon-modal-head\">' +\n                    '<div class=\"spon-modal-name\">' + KSLT_экранировать(s.name) + '</div>' +",
            "'<div class=\"spon-modal-head\">' +"),
        ждём: /нет пары «имя \+ крестик»/,
    },
    {
        имя: 'страница под окном снова листается',
        правка: замена('js/sponsors-loader.js', "document.body.style.overflow = 'hidden';", "document.body.style.overflow = 'visible';"),
        ждём: /не запирается/,
    },
    {
        имя: 'фокус остаётся под окном',
        правка(двор) {
            const п = path.join(двор, 'js/sponsors-loader.js');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.indexOf("var первый = overlay.querySelector('.spon-modal-close');");
            if (i < 0) return 'места фокуса нет';
            const j = т.indexOf('\n', т.indexOf('первый.focus()', i));
            fs.writeFileSync(п, т.slice(0, i) + т.slice(j));
        },
        ждём: /фокус не уводится в окно/,
    },
    {
        имя: 'окно перестало быть окном для диктора',
        правка: замена('js/sponsors-loader.js', 'role="dialog" aria-modal="true"', 'class="dialog-staroe"'),
        ждём: /role="dialog"/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-okno-sponsora.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер окна спонсора: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);

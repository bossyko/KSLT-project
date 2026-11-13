#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «КНОПКА НАВЕРХ». */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'knopka-naverh-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-knopka-naverh.js'), path.join(двор, 'tools/check-knopka-naverh.js'));
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: сторож читает js и css целиком. */
    fs.mkdirSync(path.join(двор, 'js'));
    fs.mkdirSync(path.join(двор, 'css'));
    fs.copyFileSync(path.join(корень, 'js/script.js'), path.join(двор, 'js/script.js'));
    fs.copyFileSync(path.join(корень, 'css/style.css'), path.join(двор, 'css/style.css'));
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
    { имя: 'кнопка снова заводится в админке',
      правка: замена('js/script.js', "if (document.querySelector('.ad-layout')) return;", ''),
      ждём: /в админке кнопка наверх не заводится/ },

    { имя: 'подпись диктору вернулась зашитой по-английски',
      правка: замена('js/script.js',
          "btn.setAttribute('aria-label', KSLT_YAZYK.выбрать('Scroll to top', 'Жогору көтөрүлүү', 'Наверх'));",
          "btn.setAttribute('aria-label', 'Scroll to top');"),
      ждём: /подпись для диктора/ },

    { имя: 'уход от подвала снят',
      правка: замена('js/script.js', 'var overFooter = подвалВКадре();', 'var overFooter = false;'),
      ждём: /уход от подвала/ },

    { имя: 'размер снова перебит в узком виде на 40',
      правка(двор) {
          const п = path.join(двор, 'css/style.css');
          const т = fs.readFileSync(п, 'utf8');
          /* ЯКОРЬ НА СОДЕРЖИМОМ УЗКОГО БЛОКА: правим ту его часть, что
             живёт только там — отступы 20/16 у этой кнопки. */
          const было = '        right: 16px;\n        bottom: 20px;';
          if (т.split(было).length - 1 !== 1) return 'якорь не один';
          fs.writeFileSync(п, т.replace(было, было + '\n        width: 40px;\n        height: 40px;'));
      },
      ждём: /не мельче ступени касания/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-knopka-naverh.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер кнопки наверх: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);

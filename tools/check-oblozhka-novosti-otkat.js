#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «ОБЛОЖКА НОВОСТИ». Каждый откат возвращает прежнее
 *  поведение и должен уронить ИМЕННО своё правило. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'oblozhka-novosti-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-oblozhka-novosti.js'),
        path.join(двор, 'tools/check-oblozhka-novosti.js'));
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: везём все три читаемых файла. */
    fs.mkdirSync(path.join(двор, 'js/admin/sections'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'js/admin/core'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'pages'), { recursive: true });
    fs.copyFileSync(path.join(корень, 'js/admin/sections/news.js'), path.join(двор, 'js/admin/sections/news.js'));
    fs.copyFileSync(path.join(корень, 'js/admin/core/cover-crop.js'), path.join(двор, 'js/admin/core/cover-crop.js'));
    fs.copyFileSync(path.join(корень, 'pages/admin.html'), path.join(двор, 'pages/admin.html'));
    return двор;
}
const замена = (файл, было, стало) => function (двор) {
    const п = path.join(двор, файл);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n < 1) return 'якорь не найден';
    if (n > 1) return 'якорь встречается ' + n + ' раз';
    fs.writeFileSync(п, т.split(было).join(стало));
};

const ОТКАТЫ = [
    { имя: 'поле «или вставьте ссылку» вернулось в форму',
      правка: замена('js/admin/sections/news.js',
          "'<input class=\"ad-skryt\" type=\"file\" accept=\"image/jpeg,image/png\" id=\"adNewsImgInput\">' +",
          "'<input class=\"ad-skryt\" type=\"file\" accept=\"image/jpeg,image/png\" id=\"adNewsImgInput\">' +\n" +
          "            '<div class=\"ad-image-url-row\"><input id=\"adNewsImgUrl\"></div>' +"),
      ждём: /нет второго пути/ },

    { имя: 'форма перестала звать кадрирование',
      правка: замена('js/admin/sections/news.js', 'await A.cropCover(file)', 'await Promise.resolve(file)'),
      ждём: /проходит через кадрирование/ },

    { имя: 'кадрирование завели второй раз внутри раздела',
      правка: замена('js/admin/sections/news.js', '        async function pickCover(file) {',
          '        function cropCover(f) { return f; }\n        async function pickCover(file) {'),
      ждём: /живёт в доме, а не в разделе/ },

    { имя: 'дом кадрирования переехал ПОСЛЕ новостей',
      правка(двор) {
          const п = path.join(двор, 'pages/admin.html');
          const т = fs.readFileSync(п, 'utf8');
          /* ЯКОРЬ НЕ НА НОМЕРЕ ВЕРСИИ: он слепнет при первом подъёме. */
          const м = т.match(/[ \t]*<script src="\.\.\/js\/admin\/core\/cover-crop\.js[^"]*"><\/script>\n/);
          if (!м) return 'строки подключения дома нет';
          if (т.split(м[0]).length - 1 !== 1) return 'якорь встречается не один раз';
          fs.writeFileSync(п, т.replace(м[0], '').replace('</body>', м[0] + '</body>'));
      },
      ждём: /подключён ДО новостей/ },

    { имя: 'из формы пропал выбор файла',
      правка: замена('js/admin/sections/news.js', 'id="adNewsImgInput"', 'id="adNewsImgInputUbran"'),
      ждём: /поле выбора файла/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-oblozhka-novosti.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер обложки новости: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);

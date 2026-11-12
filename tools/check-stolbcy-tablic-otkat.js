#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «СТОЛБЦЫ ТАБЛИЦ». */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'stolbcy-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-stolbcy-tablic.js'), path.join(двор, 'tools/check-stolbcy-tablic.js'));
    fs.cpSync(path.join(корень, 'js/admin/sections'), path.join(двор, 'js/admin/sections'), { recursive: true });
    return двор;
}

const ОТКАТЫ = [
    { имя: 'у Тренеров вернулся лишний девятый <col> (беда h158)',
      правка(двор) {
          const п = path.join(двор, 'js/admin/sections/coaches.js');
          const т = fs.readFileSync(п, 'utf8');
          const было = "'<colgroup>' +\n                            '<col style=\"width:36px;\">' +";
          if (т.split(было).length - 1 !== 1) return 'якорь встречается ' + (т.split(было).length - 1) + ' раз';
          fs.writeFileSync(п, т.replace(было, "'<colgroup>' +\n                            '<col style=\"width:40px;\">' +\n                            '<col style=\"width:36px;\">' +"));
      },
      ждём: /coaches\.js:\d+ — <col> 9, <th> 8/ },

    { имя: 'у Кортов потеряли один <col>',
      правка(двор) {
          const п = path.join(двор, 'js/admin/sections/courts.js');
          const т = fs.readFileSync(п, 'utf8');
          const было = "'<col style=\"width:55px;\">' +\n";
          if (т.split(было).length - 1 !== 1) return 'якорь встречается ' + (т.split(было).length - 1) + ' раз';
          fs.writeFileSync(п, т.replace(было, ''));
      },
      ждём: /courts\.js:\d+ — <col> 9, <th> 10/ },

    { имя: 'colgroup снесены вовсе — прибору нечего мерить',
      правка(двор) {
          for (const ф of ['coaches.js', 'courts.js']) {
              const п = path.join(двор, 'js/admin/sections', ф);
              fs.writeFileSync(п, fs.readFileSync(п, 'utf8').split('<colgroup>').join('<colgroup-ubran>'));
          }
      },
      ждём: /прибор ослеп либо раздел снесли/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-stolbcy-tablic.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер столбцов таблиц: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);

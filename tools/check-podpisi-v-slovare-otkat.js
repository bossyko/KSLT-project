/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 135. На КОПИИ.
 *   node tools/check-podpisi-v-slovare-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-135-'));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.mkdirSync(path.join(ВРЕМ, 'pages'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(ВРЕМ, 'js'), { recursive: true });
fs.copyFileSync(path.join(КОРЕНЬ, 'pages/admin.html'), path.join(ВРЕМ, 'pages/admin.html'));
fs.copyFileSync(path.join(КОРЕНЬ, 'tools/check-podpisi-v-slovare.js'),
                path.join(ВРЕМ, 'tools/check-podpisi-v-slovare.js'));

const СЛ = 'js/admin/core/constants.js';
const CRT = 'js/admin/sections/courts.js';
const VCH = 'js/admin/sections/vouchers.js';
const UT = 'js/admin/core/utils.js';

const ОТКАТЫ = [
  ['вернуть зов ключа с чужой приставкой', VCH,
   'L.vchStatusActive',
   'L.payStatusActive',
   'ни одного зова L.<ключ> без ключа в словаре'],

  ['снять ключ, который зовут', СЛ,
   "        expDownload: 'Скачать',\n",
   '',
   'ни одного зова L.<ключ> без ключа в словаре'],

  ['опустошить значение ключа', СЛ,
   "        expPrint: 'Печать',",
   "        expPrint: '',",
   'ни один ключ словаря не пуст'],

  ['вернуть подпись зашитой в код', CRT,
   'L.crtTotal',
   "('всего')",
   'зашитых русских в собственных скобках не больше 155'],

  ['вернуть запасной текст рядом с ключом', UT,
   'L.confirm)',
   "L.confirm || 'OK')",
   'у ключа нет запасного текста в коде']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-podpisi-v-slovare.js')],
                 { encoding: 'utf8', stdio: 'pipe' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*x\s/.test(с)).map(с => с.replace(/^\s*x\s*/, '').trim());
  }
}

const БАЗА = прогон();
if (БАЗА.length) {
  console.log('\n  x БАЗА: правила не проходят на ЧИСТОЙ копии\n    ' + БАЗА.join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    все 5 правил проходят на чистой копии\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n < 1) {
    console.log('  x откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    плохо++; return;
  }
  fs.writeFileSync(путь, ориг.split(было).join(стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  x ' + имя);
    console.log('      ждали «' + ждём + '», упало: ' + (упали.join(' · ') || '— ничего —'));
    плохо++;
  } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');

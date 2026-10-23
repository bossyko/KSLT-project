/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 131. На КОПИИ.
 *   node tools/check-sem-nahodok-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-131-'));
['js', 'css', 'tools', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, 'index.html'), path.join(ВРЕМ, 'index.html'));

const AD = 'css/admin.css', UT = 'js/admin/core/utils.js',
      CN = 'js/admin/core/constants.js', LAY = 'js/admin/core/layout.js',
      PG = 'pages/admin.html', SP = 'js/admin/sections/sponsors.js';

const ОТКАТЫ = [
  ['вернуть манифесту адрес от корня домена', PG,
   'rel="manifest" href="../manifest.json"',
   'rel="manifest" href="/manifest.json"',
   'ни одна страница не просит manifest от корня домена'],

  ['убрать дом заголовка со значком', UT,
   '    A.столбецЗнаком = столбецЗнаком;\n',
   '',
   'дом заголовка со значком есть и прячет знак от диктора'],

  ['спрятать текст диктора через display none', AD,
   '.ad-tolko-diktoru {\n    position: absolute;',
   '.ad-tolko-diktoru {\n    display: none;\n    position: static;',
   'текст для диктора вынесен за экран, а не спрятан совсем'],

  ['вернуть голый значок в заголовок спонсоров', SP,
   '<th style="text-align:center;width:50px">\' + A.столбецЗнаком(\'&#128065;\', L.thViews) + \'</th>',
   '<th style="text-align:center;width:50px">&#128065;</th>',
   'ни одна колонка не названа голым значком'],

  ['снять слой нажатия у мелкой кнопки', AD,
   '.ad-btn-sm::before {',
   '.ad-btn-NETU-sm::before {',
   'у мелкой кнопки есть слой нажатия 44'],

  ['завести второй ключ со значением «Статус»', CN,
   "        thStatus: 'Статус',",
   "        thStatus: 'Статус',\n        vtoroyStatus: 'Статус',",
   'слово «Статус» живёт в словаре ровно одним ключом'],

  ['вернуть ссылкам дашборда одинаковое имя', LAY,
   "L.viewAll + ' ' + (L[tabTarget] || '').toLowerCase() + ' →' +",
   "L.viewAll + ' →' +",
   'ссылки дашборда называют свой раздел'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-sem-nahodok.js')], { encoding: 'utf8' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*✗/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

/* ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО: правило счёта страниц
   ходит по всему дереву, и на копии страниц меньше. Эту проверку на
   копии пропускаем, а остальные держим. */
const БАЗА = прогон().filter(п => п.indexOf('страницы с манифестом найдены') === -1);
if (БАЗА.length) {
  console.log('\n  ✗ БАЗА: правило не проходит на ЧИСТОЙ копии\n');
  console.log('    ' + БАЗА.join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    исходный код правила проходит (счёт страниц на копии не проверяется)\n');

let плохо = 0;
ОТКАТЫ.forEach(([имя, ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    плохо++; return;
  }
  fs.writeFileSync(путь, ориг.split(было).join(стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ ' + имя);
    console.log('      ждали «' + ждём + '», упало: ' + (упали.join(' · ') || '— ничего —'));
    плохо++;
  } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила\n');

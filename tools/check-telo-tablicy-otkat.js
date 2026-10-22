/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 127. На КОПИИ.
 *   node tools/check-telo-tablicy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-127-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const UT = 'js/admin/core/utils.js', CR = 'js/admin/sections/courts.js',
      TR = 'js/admin/sections/tournaments.js';

const ОТКАТЫ = [
  ['вернуть «Корты» к своему слушателю', CR,
   "A.наТелоТаблицы(tbody, function(e) {\n            if (e.target.closest('.ad-bulk-cell')) return;",
   "tbody.addEventListener('click', function(e) {\n            if (e.target.closest('.ad-bulk-cell')) return;",
   'ни один раздел не вешает слушатель на тело таблицы сам'],

  ['вернуть «Турниры» к своему onclick', TR,
   'A.наТелоТаблицы(tbody, async function(e) {',
   'tbody.onclick = async function(e) {',
   'ни один раздел не вешает слушатель на тело таблицы сам'],

  ['научить дом ДОБАВЛЯТЬ слушатель вместо замены', UT,
   '        тело.onclick = обработчик;',
   "        тело.addEventListener('click', обработчик);",
   'дом слушателя на теле таблицы есть и ставит его заменой'],

  ['снять дом из вывода наружу', UT,
   '    A.наТелоТаблицы = наТелоТаблицы;\n',
   '',
   'дом слушателя на теле таблицы есть и ставит его заменой'],

  ['унести один зов из семи', CR,
   'A.наТелоТаблицы(tbody, function(e) {',
   'A.наТелоТаблицыNETU(tbody, function(e) {',
   'дом зовут все семь мест'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-telo-tablicy.js')], { encoding: 'utf8' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*✗/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

if (прогон().length) {
  console.log('\n  ✗ БАЗА: правило не проходит на ЧИСТОЙ копии\n');
  console.log('    ' + прогон().join('\n    '));
  fs.rmSync(ВРЕМ, { recursive: true, force: true });
  process.exit(1);
}
console.log('\n  база    исходный код правила проходит\n');

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

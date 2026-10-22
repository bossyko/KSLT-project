/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 129. На КОПИИ.
 *   node tools/check-pustoe-sostoyanie-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-129-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const UT = 'js/admin/core/utils.js', CN = 'js/admin/core/constants.js',
      AD = 'css/admin.css', CR = 'js/admin/sections/courts.js';

const ОТКАТЫ = [
  ['свести два состояния обратно в одно', UT,
   'var вБазеПусто = о.фильтры !== undefined ? !о.фильтры : !о.всего;',
   'var вБазеПусто = true;',
   'дом пустого состояния есть и различает базу от выборки'],

  ['убрать дом из вывода наружу', UT,
   '    A.пустоеСостояние = пустоеСостояние;\n',
   '',
   'дом пустого состояния есть и различает базу от выборки'],

  ['снять ключ «ничего не найдено» из словаря', CN,
   "        pustoNeNaydeno: 'Ничего не найдено',\n",
   '',
   'ключ `pustoNeNaydeno` заведён в словаре'],

  ['снять ключ сброса фильтров из словаря', CN,
   "        pustoSbrosFiltry: 'Измените поиск или сбросьте фильтры',\n",
   '',
   'ключ `pustoSbrosFiltry` заведён в словаре'],

  ['вернуть «Кортам» свою разметку пустоты', CR,
   "            tbody.innerHTML = A.пустоеСостояние({",
   "            tbody.innerHTML = '<tr><td colspan=\"12\" style=\"text-align:center;padding:60px 20px;\">x</td></tr>'; if (0) A.пустоеСостояние({",
   'ни одно табличное место не рисует пустоту своими инлайнами'],

  ['унести один зов дома из восьми', CR,
   'A.пустоеСостояние({',
   'A.пустоеСостояниеNETU({',
   'дом зовут все восемь табличных мест'],

  ['опустошить правило вида пустоты', AD,
   '.ad-pusto {\n    text-align: center;\n    padding: var(--space-10) var(--space-5);\n    color: var(--text-secondary);\n}',
   '.ad-pusto {\n}',
   '`.ad-pusto` не просто есть, а что-то задаёт'],

  ['унести правило знака', AD,
   '.ad-pusto-znak {',
   '.ad-pusto-NETU-znak {',
   '`.ad-pusto-znak` не просто есть, а что-то задаёт'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-pustoe-sostoyanie.js')], { encoding: 'utf8' });
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

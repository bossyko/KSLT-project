/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 119. На КОПИИ.
 *   node tools/check-chekboks-i-imena-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-119-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const UT = 'js/admin/core/utils.js', AD = 'css/admin.css',
      CN = 'js/admin/core/constants.js', CR = 'js/admin/sections/courts.js',
      CH = 'js/admin/sections/challenges.js';

const ОТКАТЫ = [
  ['вернуть инлайн чекбоксу шапки', UT,
   '<input type="checkbox" class="ad-bulk-all">',
   '<input type="checkbox" class="ad-bulk-all" style="width:18px;height:18px;">',
   'ни у одного чекбокса массового выбора нет инлайна'],

  ['вернуть инлайн чекбоксу строки', UT,
   '<input type="checkbox" class="ad-bulk-item" data-bulk-id=',
   '<input type="checkbox" class="ad-bulk-item" style="cursor:pointer;" data-bulk-id=',
   'ни у одного чекбокса массового выбора нет инлайна'],

  ['снять оба чекбокса — правилу станет нечего проверять', UT,
   '<input type="checkbox" class="ad-bulk-all">',
   '<input type="checkbox">',
   'оба чекбокса массового выбора рисуются, и их ровно два'],

  ['вернуть важность размеру', AD,
   '.ad-bulk-item,\n.ad-bulk-all {\n    appearance: none;\n    -webkit-appearance: none;\n    width: 18px;',
   '.ad-bulk-item,\n.ad-bulk-all {\n    appearance: none;\n    -webkit-appearance: none;\n    width: 18px !important;',
   'у чекбокса нет важностей — перебивать больше нечего'],

  ['увести размер со ступени', AD,
   '.ad-bulk-item,\n.ad-bulk-all {\n    appearance: none;\n    -webkit-appearance: none;\n    width: 18px;',
   '.ad-bulk-item,\n.ad-bulk-all {\n    appearance: none;\n    -webkit-appearance: none;\n    width: 20px;',
   'размер чекбокса остался замеренным — 18 и рамка 2'],

  ['унести блок чекбокса целиком', AD,
   '.ad-bulk-item,\n.ad-bulk-all {',
   '.ad-bulk-NETU-item,\n.ad-bulk-NETU-all {',
   'блок чекбокса массового выбора на месте'],

  /* ОДНО ИЗ ДВУХ МЕСТ. Первая версия отката ломала одну подсказку из
     двух, и правило НЕ упало — оно спрашивало «есть ли хоть одна».
     Правило переведено на СЧЁТ, и теперь одного места хватает. */
  ['свести обратно ОДНУ подсказку из двух', CR,
   "placeholder=\"' + L.crtServiceNameHint + '...\"",
   "placeholder=\"' + L.crtServiceName + '...\"",
   '`подсказка поля ввода услуги` зовёт своё имя во всех 2 местах'],

  ['снять ключ подсказки из словаря', CN,
   "        crtServiceNameHint: 'Название услуги',\n",
   '',
   'ключ `crtServiceNameHint` заведён в словаре'],

  ['свести имена обратно: заголовок окна берёт общий ключ', CH,
   "'<h3>' + L.chalCancelBattleTitle + '</h3>'",
   "'<h3>' + L.chalCancelBattle + '</h3>'",
   '`заголовок окна отмены баттла` зовёт своё имя во всех 1 местах'],

  ['снять ключ заголовка из словаря', CN,
   "        chalCancelBattleTitle: 'Отменить баттл',\n",
   '',
   'ключ `chalCancelBattleTitle` заведён в словаре'],

  ['переименовать, а не развести: заголовок колонки ушёл на новый ключ', CR,
   "'<span>' + L.crtServiceName + '</span>'",
   "'<span>' + L.crtServiceNameHint + '</span>'",
   'общие имена остались у своих понятий'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-chekboks-i-imena.js')], { encoding: 'utf8' });
    return [];
  } catch (e) {
    const т = (e.stdout || '') + (e.stderr || '');
    return т.split('\n').filter(с => /^\s*✗/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

if (прогон().length) {
  console.log('\n  ✗ БАЗА: правило не проходит на ЧИСТОЙ копии — песок неполон\n');
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
    console.log('      ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++; return;
  }
  fs.writeFileSync(путь, ориг.split(было).join(стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ ' + имя);
    console.log('      ждали «' + ждём + '»');
    console.log('      упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не трогались — работа шла на копии\n');

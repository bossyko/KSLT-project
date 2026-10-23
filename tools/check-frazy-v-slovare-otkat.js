/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 136. На КОПИИ.
 *   node tools/check-frazy-v-slovare-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-136-'));
fs.mkdirSync(path.join(ВРЕМ, 'tools'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(ВРЕМ, 'js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(ВРЕМ, 'node_modules', 'acorn'), { recursive: true });
fs.copyFileSync(path.join(КОРЕНЬ, 'tools/check-frazy-v-slovare.js'),
                path.join(ВРЕМ, 'tools/check-frazy-v-slovare.js'));

const UT = 'js/admin/core/utils.js';
const BRK = 'js/admin/sections/bracket.js';
const СЛ = 'js/admin/core/constants.js';

const ОТКАТЫ = [
  ['снять дом подстановки', UT,
   'A.фраза = function (шаблон, значения) {',
   'A.фразаНЕТ = function (шаблон, значения) {',
   'дом A.фраза заведён'],

  ['отнять у дома знание кириллицы', UT,
   '/\\{([A-Za-zА-Яа-яЁё0-9_$]+)\\}/g',
   '/\\{(\\w+)\\}/g',
   'дом знает кириллические имена подстановки'],

  ['прятать пропущенную подстановку', UT,
   'return всё;',
   "return '';",
   'пропущенная подстановка остаётся видимой'],

  ['вернуть фразу складыванием кусков', BRK,
   "A.фраза(L.brkDrawCancelledV, { буква: буква })",
   "('Жеребьёвка отменена: в группе ') + буква + (' пара встречается дважды')",
   'зашитых русских фраз в коде админки не осталось'],

  ['не дать подстановке значения', BRK,
   'A.фраза(L.brkDrawCancelledV, { буква: буква })',
   'A.фраза(L.brkDrawCancelledV)',
   'каждое место подстановки заполняется в зове'],

  /* ОТКАТ БЕРЁТ КЛЮЧ, КОТОРОГО НЕ ЗОВУТ (таких девять из 96). Первая
     попытка переименовала званый — и упало чужое правило, о подстановках,
     а не своё. ОТКАТ РОНЯЕТ ИМЕННО СВОЁ ПРАВИЛО. */
  ['снять вид из имён ключей', СЛ,
   "        doublesNtrpCombinedError:",
   "        doublesNtrpCombined2:",
   'ключей с видом в имени не меньше замеренных 96']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-frazy-v-slovare.js')],
                 { encoding: 'utf8', stdio: 'pipe', cwd: ВРЕМ });
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
console.log('\n  база    все 6 правил проходят на чистой копии\n');

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

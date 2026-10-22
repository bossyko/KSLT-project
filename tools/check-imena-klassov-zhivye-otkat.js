/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 128. На КОПИИ.
 *   node tools/check-imena-klassov-zhivye-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-128-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const LO = 'js/admin/sections/loyalty.js', AD = 'css/admin.css';

const ОТКАТЫ = [
  ['вернуть двойное тире мелкой кнопке', LO,
   '<button class="ad-btn ad-btn-sm" data-loyedit=',
   '<button class="ad-btn ad-btn--sm" data-loyedit=',
   'ни одно имя класса в js не пишется через двойное тире'],

  ['вернуть мёртвое имя пагинации', LO,
   'class="ad-crt-page-btn',
   'class="ad-page-btn',
   'кнопки «Лояльности» зовут живые имена'],

  ['завести правило под мёртвое имя — у понятия снова два', AD,
   '.ad-btn-sm { --ad-btn-h: var(--btn-h-sm);',
   '.ad-btn--sm { --ad-btn-h: var(--btn-h-sm); }\n.ad-btn-sm { --ad-btn-h: var(--btn-h-sm);',
   'правила `.ad-btn--sm` в css по-прежнему нет'],

  ['унести правило живой мелкой кнопки', AD,
   '.ad-btn-sm { --ad-btn-h: var(--btn-h-sm); padding: 0 var(--space-sm); }',
   '.ad-btn-NETU-sm { --ad-btn-h: var(--btn-h-sm); padding: 0 var(--space-sm); }',
   '`.ad-btn-sm` не просто существует, а задаёт высоту мелкой кнопки'],

  ['снять разрушительный тон у удаления правила', LO,
   'class="ad-btn ad-btn-sm ad-btn-danger" data-loyruledel=',
   'class="ad-btn ad-btn-sm" data-loyruledel=',
   'кнопки «Лояльности» зовут живые имена'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-imena-klassov-zhivye.js')], { encoding: 'utf8' });
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

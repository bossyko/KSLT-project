/**
 * ПРУВЕР ЗАМОРОЗКИ ВЁРСТКИ ВКЛАДКИ «ЗАЯВКИ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — ровно то, что жило в коде до 03.10: значки инлайном на 10.4,
 * подпись на --text-dim, номер с отступом 4x6, шапка таблиц на --text-dim,
 * галочка без обёртки, окно без role и без фокуса.
 *
 *   node tools/check-zayavki-verstka-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-zayavki-'));

['js', 'css', 'tools', 'pages'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  /* ─── значки ─── */
  ['js/admin/sections/bracket.js',
   "' <span class=\"ad-reg-mark ad-reg-mark-dolg\">' + L.regDebt + '</span>'",
   "' <span style=\"font-size:0.7rem;\">' + L.regDebt + '</span>'",
   'значки строки заявки — классом, а не инлайном'],

  ['js/admin/sections/bracket.js',
   "' <span class=\"ad-reg-mark ad-reg-mark-ext\">' + (reg.external_country || 'EXT') + '</span>'",
   "' <span style=\"display:inline-block;font-size:0.65rem;\">' + (reg.external_country || 'EXT') + '</span>'",
   'в строке заявки нет кеглей 0.65rem'],

  ['css/admin.css',
   '    min-height: var(--chip-h);\n    padding: 0 var(--space-2);',
   '    min-height: 19px;\n    padding: 0 var(--space-2);',
   'значок стоит на ступени чипа и шкале кеглей'],

  /* ─── подпись ─── */
  ['css/admin.css',
   '.ad-table-sub {',
   '.ad-table-user-email {',
   'подпись под именем — одно определение'],

  ['css/admin.css',
   '    line-height: var(--lh-normal);\n    color: var(--text-muted);\n    white-space: nowrap;',
   '    line-height: var(--lh-normal);\n    color: var(--text-dim);\n    white-space: nowrap;',
   'подпись не на --text-dim'],

  ['js/admin/sections/bracket.js',
   "'<div class=\"ad-table-sub ad-reg-sub-inline\">' + подписьСтроки + '</div></td>'",
   "(window.innerWidth <= 992 ? '<div class=\"ad-table-sub\">' + подписьСтроки + '</div>' : '') + '</td>'",
   'подпись рисуется всегда, а показывается медиа-правилом'],

  ['css/admin.css',
   '    .ad-col-cat,\n    .ad-col-dt { display: none; }',
   '    .ad-col-cat { display: none; }',
   'на узком виде прячутся ровно категория и дата'],

  /* ─── числа со шкалы ─── */
  ['js/admin/sections/bracket.js',
   "'<td class=\"ad-reg-num\">' + num + '</td>' +\n                '<td class=\"ad-reg-mesto\">'",
   "'<td style=\"text-align:center;padding:4px 6px;\">' + num + '</td>' +\n                '<td class=\"ad-reg-mesto\">'",
   'номер строки без инлайн-отступа'],

  ['css/admin.css',
   '    color: var(--text-muted);\n    border-bottom: 1px solid var(--border-subtle);\n    white-space: nowrap;',
   '    color: var(--text-dim);\n    border-bottom: 1px solid var(--border-subtle);\n    white-space: nowrap;',
   'шапка таблиц админки читается'],

  /* ─── цель нажатия ─── */
  ['css/admin.css',
   '.ad-reg-check-wrap,\n.ad-confirm-cancel {\n    position: relative;\n}',
   '.ad-confirm-cancel {\n    position: relative;\n}',
   'галочка и «Отмена» в списке слоя цели'],

  ['js/admin/sections/bracket.js',
   "'<td><span class=\"ad-reg-check-wrap\"><input type=\"checkbox\" class=\"ad-reg-check\" data-group=\"' + group + '\" data-reg-id=\"' + reg.id + '\" data-player-name=\"' + A.esc(pName) + '\"' + (заморожено ? ' disabled' : '') + '></span></td>' +\n                '<td class=\"ad-reg-num\">' + num + '</td>' +\n                '<td class=\"ad-reg-mesto\">'",
   "'<td><input type=\"checkbox\" class=\"ad-reg-check\" data-group=\"' + group + '\" data-reg-id=\"' + reg.id + '\" data-player-name=\"' + A.esc(pName) + '\"' + (заморожено ? ' disabled' : '') + '></td>' +\n                '<td class=\"ad-reg-num\">' + num + '</td>' +\n                '<td class=\"ad-reg-mesto\">'",
   'ни одной галочки строки без обёртки'],

  /* ─── окно подтверждения ─── */
  ['js/admin/core/utils.js',
   "'<div class=\"ad-confirm-modal\" role=\"dialog\" aria-modal=\"true\" ' +",
   "'<div class=\"ad-confirm-modal\" data-bylo=\"1\" ' +",
   'окно подтверждения называет себя диктору'],

  ['js/admin/core/utils.js',
   "        if (окно && окно.focus) окно.focus();",
   "        if (окно && окно.querySelector) окно.querySelector('button').focus();",
   'окно берёт фокус на себя, а не на кнопку'],

  ['js/admin/core/utils.js',
   "    var счётчикОкон = 0;",
   "    var счётчикОконБыло = 0;",
   'подпись окна уникальна'],

  /* ─── версии ─── */
  ['pages/admin.html',
   /* ЯКОРЬ БЕЗ НОМЕРА: держится на имени файла, а число подставляем
      заведомо старое. Якорь на номере версии ломается при каждом подъёме —
      на этом куске уже попадались. */
   'sections/bracket.js?v=',
   'sections/bracket.js?v=200&bylo=',
   'версии подняты — иначе браузер отдаст старое из кеша']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-zayavki-verstka.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*·\s/.test(с))
                .map(с => с.replace(/^\s*·\s*/, '').trim());
  }
}

let плохо = 0;
console.log('');
ОТКАТЫ.forEach(([ф, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, ф);
  const ориг = fs.readFileSync(путь, 'utf8');
  const n = ориг.split(было).length - 1;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + было.replace(/\n/g, ' ⏎ ').slice(0, 90));
    плохо++;
    return;
  }
  fs.writeFileSync(путь, ориг.replace(было, стало));
  const упали = прогон();
  fs.writeFileSync(путь, ориг);
  if (упали.indexOf(ждём) === -1) {
    console.log('  ✗ откат ' + (i + 1) + ': ждали «' + ждём + '»');
    console.log('    упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
    плохо++;
  } else {
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём + (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
  }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо === 0) {
  console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
  console.log('');
  process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);

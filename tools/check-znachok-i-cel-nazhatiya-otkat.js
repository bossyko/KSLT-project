/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 124. На КОПИИ.
 *   node tools/check-znachok-i-cel-nazhatiya-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-124-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const AD = 'css/admin.css', NT = 'js/admin/sections/notifications.js',
      PL = 'js/admin/sections/players.js', VC = 'js/admin/sections/vouchers.js',
      CR = 'js/admin/sections/courts.js', CO = 'js/admin/sections/coaches.js';

const ОТКАТЫ = [
  /* ── два определения вернулись ── */
  ['завести второе определение значка', AD,
   '.ad-btn-danger-icon:hover {',
   '.ad-btn-icon {\n    border: none;\n}\n\n.ad-btn-danger-icon:hover {',
   '`.ad-btn-icon` определён ровно один раз'],

  ['завести второе наведение', AD,
   '.ad-btn-danger-icon:hover {',
   '.ad-btn-icon:hover {\n    background: none;\n}\n\n.ad-btn-danger-icon:hover {',
   '`.ad-btn-icon:hover` объявлен ровно один раз'],

  ['унести блок значка целиком — правилам станет нечего проверять', AD,
   '\n.ad-btn-icon {\n    position: relative;',
   '\n.ad-btn-NETU-icon {\n    position: relative;',
   'блок значковой кнопки найден'],

  /* ── размер и ступень ── */
  ['увести размер со ступени обратно на 32', AD,
   '    width: var(--btn-h-sm);\n    height: var(--btn-h-sm);',
   '    width: 32px;\n    height: 32px;',
   'размер значка — ступень шкалы, а не число'],

  ['снять `flex-shrink` — значок снова начнёт жаться', AD,
   '    height: var(--btn-h-sm);\n    flex-shrink: 0;',
   '    height: var(--btn-h-sm);',
   'значок держит ширину в тесной строке формы'],

  ['снять опору слоя', AD,
   '.ad-btn-icon {\n    position: relative;\n',
   '.ad-btn-icon {\n',
   'значок — опора для своего слоя нажатия'],

  /* ── цель нажатия ── */
  ['унести слой нажатия', AD,
   '.ad-btn-icon::before {',
   '.ad-btn-NETU-icon::before {',
   'у значка есть прозрачный слой нажатия'],

  ['сжать слой нажатия до размера значка', AD,
   '    width: var(--btn-h-md);\n    height: var(--btn-h-md);\n}',
   '    width: var(--btn-h-sm);\n    height: var(--btn-h-sm);\n}',
   'слой нажатия ровно 44 на 44, ступенью, а не числом'],

  /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ СВОЕГО БЛОКА. Первая версия отката
     цеплялась за `content: ''` плюс `position: absolute` — такая пара
     встречается в admin.css ОДИННАДЦАТЬ раз, и прувер это показал. */
  ['вернуть слой в поток — он станет flex-элементом и толкнёт знак', AD,
   ".ad-btn-icon::before {\n    content: '';\n    position: absolute;",
   ".ad-btn-icon::before {\n    content: '';\n    position: static;",
   'слой вынут из потока и не толкает значок'],

  /* ── ряд значков ── */
  ['снять зазор у ряда — слои соседей наедут друг на друга', AD,
   '.ad-icon-row {\n    display: flex;\n    justify-content: flex-end;\n    gap: var(--space-2);',
   '.ad-icon-row {\n    display: flex;\n    justify-content: flex-end;',
   'обёртка ряда значков есть и даёт зазор'],

  /* ТРИ МЕСТА — ТРИ ОТКАТА. Правило, которому хватает одного места,
     сторожит треть, и поймать это может только откат каждого по
     отдельности. */
  ['снять обёртку в журнале рассылок', NT,
   '\'<td style="text-align:right;"><div class="ad-icon-row">\' + actions + \'</div></td>\'',
   '\'<td style="text-align:right;white-space:nowrap;">\' + actions + \'</td>\'',
   'все три ячейки с двумя значками обёрнуты в ряд'],

  ['снять обёртку в истории рейтинга', PL,
   '<div class="ad-icon-row">\' +\n',
   '\' +\n',
   'все три ячейки с двумя значками обёрнуты в ряд'],

  ['снять обёртку в списке ваучеров', VC,
   '\'<td><div class="ad-icon-row">\' + actionHtml + \'</div></td>\'',
   '\'<td style="white-space:nowrap;">\' + actionHtml + \'</td>\'',
   'все три ячейки с двумя значками обёрнуты в ряд'],

  /* ── подписи ── */
  ['снять подпись у значка удаления рассылки', NT,
   '" title="\' + delLabel + \'" aria-label="\' + delLabel + \'">&times;',
   '" title="\' + delLabel + \'">&times;',
   'у каждой значковой кнопки есть доступное имя'],

  ['развести подпись и подсказку на разные слова', VC,
   'data-vch-view="\' + v.id + \'" title="\' + L.vchView + \'" aria-label="\' + L.vchView + \'"',
   'data-vch-view="\' + v.id + \'" title="\' + L.vchView + \'" aria-label="\' + L.vchCancel + \'"',
   'подпись и подсказка значка — один текст, а не два'],

  ['зашить подпись литералом вместо ключа словаря', CR,
   'title="\' + L.crtTypeRemove + \'" aria-label="\' + L.crtTypeRemove + \'"',
   'title="\' + L.crtTypeRemove + \'" aria-label="Убрать тип корта"',
   'подписи значков берутся из словаря, а не зашиты в разметке'],

  /* ЯКОРЬ ВЗЯТ УНИКАЛЬНЫЙ. Отрисовка достижений тренера живёт в
     coaches.js В ДВУХ КОПИЯХ — по три языка в каждой, — и якорь на ней
     встречался дважды. Прувер это показал. Сами копии — своя находка. */
  ['унести значковую кнопку раздела — правилам станет нечего считать', CO,
   'class="ad-btn-icon ad-psvc-remove"',
   'class="ad-btn-NETU-icon ad-psvc-remove"',
   'значковые кнопки найдены, и их 22'],

  /* ОТДЕЛЬНОЕ ПРАВИЛО — ОТДЕЛЬНЫЙ ОТКАТ. `nowrap` может вернуться и
     ВМЕСТЕ с обёрткой: тогда правило обёртки держится, а мусор стоит. */
  ['вернуть `nowrap` в ячейку, оставив обёртку', NT,
   '\'<td style="text-align:right;"><div class="ad-icon-row">\' + actions',
   '\'<td style="text-align:right;white-space:nowrap;"><div class="ad-icon-row">\' + actions',
   '`white-space: nowrap` не вернулся туда, где он ничего не держал'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-znachok-i-cel-nazhatiya.js')], { encoding: 'utf8' });
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

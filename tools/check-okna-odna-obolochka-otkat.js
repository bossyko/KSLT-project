/**
 * ПРУВЕР ЗАМОРОЗКИ КУСКА 126. На КОПИИ.
 *   node tools/check-okna-odna-obolochka-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-126-'));
['js', 'css', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const UT = 'js/admin/core/utils.js', AD = 'css/admin.css',
      CH = 'js/admin/sections/challenges.js', VC = 'js/admin/sections/vouchers.js',
      LV = 'js/admin/sections/live.js', CN = 'js/admin/core/constants.js';

const ОТКАТЫ = [
  /* ЯКОРЬ ВЗЯТ ИЗ ФАЙЛА, А НЕ ПО ПАМЯТИ. Первая версия цеплялась за
     соседнюю строку, которой там нет: после зова идёт пустая строка и
     `document.getElementById(...)`. ЯКОРЬ, НАПИСАННЫЙ ПО ПАМЯТИ, — ВЫДУМКА. */
  ['вернуть окно «Вызовов» к самостоятельной вставке', CH,
   "A.оболочкаОкна({ узел: overlay });\n\n        document.getElementById('dcCompClose')",
   "document.body.appendChild(overlay);\n\n        document.getElementById('dcCompClose')",
   'ни одно окно админки не встаёт в страницу мимо оболочки'],

  ['сузить признак окна до двух семейств', UT,
   "querySelector('.ad-confirm-modal, .ad-modal, .ad-crop-modal')",
   "querySelector('.ad-confirm-modal, .ad-modal')",
   'оболочка узнаёт окно всех трёх семейств'],

  ['вернуть снос только своего семейства', UT,
   "querySelectorAll('.ad-confirm-overlay, .ad-modal-overlay')",
   "querySelectorAll('.ad-confirm-overlay')",
   'оболочка сносит подложку любого семейства — одно окно за раз'],

  ['заменять класс подложки вместо добавления', UT,
   "overlay.classList.add('ad-confirm-overlay');",
   "overlay.className = 'ad-confirm-overlay';",
   'готовый узел принимается, а его класс добавляется, а не заменяет'],

  ['убрать вход готового узла', UT,
   "var overlay = о.узел || document.createElement('div');",
   "var overlay = document.createElement('div');",
   'готовый узел принимается, а его класс добавляется, а не заменяет'],

  ['снять защиту от закрытия мимо оболочки', UT,
   '            if (!overlay.isConnected) {',
   '            if (false) {',
   'слушатель клавиш снимает себя, если окно закрыли мимо оболочки'],

  /* ЭТОТ ОТКАТ НАПИСАН ПО ЖИВОЙ БЕДЕ: ключ `modalClose` не завёлся с
     первого раза, разметка его звала, и на боевой диктор читал
     «undefined». Правило наличия атрибута этого не видело. */
  ['снять ключ подписи из словаря — атрибут останется, слово пропадёт', CN,
   "        modalClose: 'Закрыть',\n",
   '',
   'каждый ключ подписи закрывашки заведён в словаре'],

  ['зашить подпись закрывашки литералом мимо словаря', LV,
   'id="liveModalClose" aria-label="\' + L.modalClose + \'"',
   'id="liveModalClose" aria-label="Закрыть"',
   'подпись закрывашки берётся из словаря, а не зашита'],

  ['снять подпись у закрывашки окна «Эфира»', LV,
   'id="liveModalClose" aria-label="\' + L.modalClose + \'"',
   'id="liveModalClose"',
   'у каждой закрывашки окна есть доступное имя'],

  ['унести закрывашку окна «Скидок» — правилу станет нечего считать', VC,
   'class="ad-modal-close" id="adVchModalClose"',
   'class="ad-modal-NETU-close" id="adVchModalClose"',
   'закрывашки окон найдены, и их 12'],

  ['сжать слой нажатия закрывашки', AD,
   '.ad-modal-close::before {\n    content: \'\';\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    width: var(--btn-h-md);',
   '.ad-modal-close::before {\n    content: \'\';\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    transform: translate(-50%, -50%);\n    width: var(--btn-h-xs);',
   'у закрывашки окна есть прозрачный слой нажатия 44'],

  ['снять опору у закрывашки', AD,
   '.ad-modal-close {\n    position: relative;\n',
   '.ad-modal-close {\n',
   'закрывашка осталась опорой для своего слоя'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-okna-odna-obolochka.js')], { encoding: 'utf8' });
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

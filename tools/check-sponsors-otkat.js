/**
 * ПРУВЕР ЗАМОРОЗКИ СЕКЦИИ СПОНСОРОВ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-sponsors-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sponsors-'));

['css', 'tools', 'js'].forEach(д => fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф)));

const ВЕРСИЯ_СЕЙЧАС = 'style.css?v=' + (fs.readFileSync(path.join(КОРЕНЬ, 'index.html'), 'utf8').match(/style\.css\?v=(\d+)/) || [0, 0])[1];

const ОТКАТЫ = [
  ['css/style.css',
   '    height: 88px;\n    padding: var(--space-3);\n    background: var(--bg-card);',
   '    height: 88px;\n    padding: var(--space-3);',
   'у плитки есть своя поверхность: заливка, контур и радиус'],

  ['css/style.css',
   '.sponsor-hero-logo img,\n.sponsors-cloud .sponsor-logo-link img,\n.sponsors-cloud .spon-static img {\n    max-width: 70%;\n    max-height: 58%;',
   '.sponsor-hero-logo img,\n.sponsors-cloud .sponsor-logo-link img,\n.sponsors-cloud .spon-static img {\n    max-width: 100%;\n    max-height: 100%;',
   'потолок логотипа внутри плитки один на всех'],

  ['css/style.css',
   '.sponsors-cloud {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: center;',
   '.sponsors-cloud {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;',
   'ряд заполняется целиком, последний неполный встаёт по центру'],

  ['css/style.css',
   '    height: 88px;\n    padding: var(--space-3);',
   '    height: 36px;\n    padding: var(--space-3);',
   'высота плитки выше порога нажатия на каждом слое'],

  ['css/style.css',
   '.sponsors-cloud .sponsor-logo-link:focus-visible,\n.sponsor-hero-logo:focus-visible {\n    outline: 3px solid var(--accent);\n    outline-offset: 3px;\n}',
   '.sponsors-cloud .sponsor-logo-link:focus-visible,\n.sponsor-hero-logo:focus-visible {\n    outline-offset: 3px;\n}',
   'у плитки есть кольцо фокуса'],

  ['css/style.css',
   '    .sponsor-hero-logo:hover,\n    .sponsors-cloud .sponsor-logo-link:hover { transform: none; }',
   '    .sponsor-hero-logo:hover { transform: none; }',
   'движение гасится по просьбе системы'],

  ['css/style.css',
   '    color: var(--text-muted);\n}\n\n/* ── СТЕНА ЛОГОТИПОВ',
   '    color: var(--accent);\n}\n\n/* ── СТЕНА ЛОГОТИПОВ',
   'лайма в секции нет нигде, кроме кольца фокуса'],

  ['css/style.css',
   '@media (max-width: 640px) {\n    .sponsors-cloud { gap: var(--space-3); }',
   '@media (max-width: 768px) {\n    .sponsors-cloud { gap: var(--space-3); }',
   'в секции нет ни одной ширины, кроме 640 и 992'],

  ['css/style.css',
   '.spon-modal-close {\n    position: absolute;\n    top: var(--space-2); right: var(--space-2);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    width: var(--btn-h-md);\n    height: var(--btn-h-md);',
   '.spon-modal-close {\n    position: absolute;\n    top: var(--space-2); right: var(--space-2);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    padding: 4px;',
   'крестик и «Закрыть» — высотой-свойством и не ниже порога'],

  ['css/style.css',
   '.spon-modal-close:focus-visible,\n.spon-modal-close-btn:focus-visible,\n.spon-modal-action:focus-visible {\n    outline: 3px solid var(--accent);',
   '.spon-modal-close:focus-visible,\n.spon-modal-close-btn:focus-visible,\n.spon-modal-action:focus-visible {\n    outline-offset: 3px;\n    color: inherit;',
   'у окна есть кольцо фокуса на всех трёх видах управления'],

  ['js/sponsors-loader.js',
   '            _cache = главные.concat(прочие);',
   '            _cache = список;',
   'перемешивание одно, и стоит там, где список приходит из базы'],

  ['js/sponsors-loader.js',
   '            список.forEach(function(s) { (s.is_hero ? главные : прочие).push(s); });',
   '            список.forEach(function(s) { прочие.push(s); });',
   'генеральный в перемешивание не попадает'],

  ['js/sponsors-loader.js',
   '            data.forEach(function(s) {\n                var inner = (s.logo',
   '            data.slice().sort(function(a, b) { return 0; }).forEach(function(s) {\n                var inner = (s.logo',
   'у карусели больше нет своей сортировки'],

  ['js/sponsors-loader.js',
   'role="dialog" aria-modal="true" aria-label=',
   'data-dialog="1" aria-hidden="false" data-label=',
   'окно объявляет себя окном и называет себя'],

  ['js/sponsors-loader.js',
   "        document.body.style.overflow = 'hidden';",
   "        document.body.style.overflow = '';",
   'страница под окном заперта'],

  ['js/sponsors-loader.js',
   '            if (первый) первый.focus();',
   '            if (первый) { /* фокус не уводим */ }',
   'фокус уходит внутрь окна и возвращается тому, кто открыл'],

  ['js/sponsors-loader.js',
   "            if (e.key === 'Escape') { closeSponsorModal(overlay); }",
   "            if (e.key === 'Enter') { closeSponsorModal(overlay); }",
   'Escape закрывает окно, и слушатель снимается при закрытии'],

  ['js/sponsors-loader.js',
   "            if (e.key !== 'Tab') return;",
   "            if (e.key !== 'Escape') return;",
   'табуляция не выходит за пределы открытого окна'],

  /* ЯКОРЬ НА ЧИСЛО, КОТОРОЕ РАСТЁТ, — ТАКОЙ ЖЕ ЯКОРЬ НА СОСЕДА. */
  ['index.html',
   ВЕРСИЯ_СЕЙЧАС,
   'style.css?v=1',
   'версии подняты'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-sponsors.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*✗\s/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}

console.log('');
const база = прогон();
if (база.length) {
  console.log('  НЕ ТАК  копия падает ещё ДО откатов — ' + база.length + ' правил');
  база.forEach(п => console.log('          ✗ ' + п));
  console.log('');
  process.exit(1);
}

let плохо = 0;
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

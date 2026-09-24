/**
 * ПРУВЕР ЗАМОРОЗКИ ШАПКИ.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Заведён 24.09, последним из всех: check-header.js — самая большая проверка
 * в проекте, 51 правило, и она единственная оставалась без доказательства и
 * вне общего бегунка. У подвала, который был в том же положении час назад,
 * прувер нашёл четыре пустых правила из семнадцати.
 *
 *   node tools/check-header-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-header-'));

['css', 'tools', 'js', 'partials'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
['index.html'].forEach(ф => fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф)));

const ОТКАТЫ = [
  ['css/tokens.css',
   '  --header-h: 64px;',
   '  --header-h: clamp(56px, 6vw, 64px);',
   'токен --header-h держит число, а не формулу'],

  ['css/tokens.css',
   '    --header-h: 56px;',
   '    --header-h: 60px;',
   'у шапки есть вторая, узкая высота'],

  ['css/tokens.css',
   '  --header-gap: 24px;',
   '  --header-gap: 20px;',
   'зазор под шапкой живёт в токене --header-gap'],

  ['css/style.css',
   'main > section:first-child:not(.hero) {\n    padding-top: var(--header-gap);',
   'main > section:first-child:not(.hero) {\n    padding-top: calc(var(--header-h) + 24px);',
   'первая секция берёт зазор из токена, а не считает его сама'],

  ['css/style.css',
   '.floating-header {\n    position: fixed;\n    top: 0;',
   '.floating-header {\n    border-bottom: 1px solid transparent;\n    position: fixed;\n    top: 0;',
   'у шапки нет невидимой рамки, съедающей пиксель'],

  ['css/style.css',
   '.nav-dropdown-menu {\n    position: absolute;\n    top: 100%;',
   '.nav-dropdown-menu {\n    min-width: 260px;\n    position: absolute;\n    top: 100%;',
   'панель не носит общую min-width: 260px'],

  ['css/style.css',
   '.nav-dropdown-menu {\n    position: absolute;\n    top: 100%;\n',
   '.nav-dropdown-menu {\n    transform: translateX(-50%);\n    position: absolute;\n    top: 100%;\n',
   'панель выровнена под заголовок, а не центрована по нему'],

  ['css/style.css',
   '@media (any-pointer: coarse) {\n    .nav-dropdown.open .nav-dropdown-menu {',
   '@media (pointer: coarse) {\n    .nav-dropdown.open .nav-dropdown-menu {',
   'условие сенсорного ввода — any-pointer, а не pointer'],

  ['css/style.css',
   '@media (max-width: 992px) {\n    .nav-links {\n        display: none;\n    }\n\n    .burger-menu {\n        display: flex;\n    }',
   '@media (max-width: 768px) {\n    .nav-links {\n        display: none;\n    }\n\n    .burger-menu {\n        display: flex;\n    }',
   'бургер включается с 992, а не с 768'],


  ['css/style.css',
   '    .mobile-dropdown-menu li a {\n        display: flex;\n        align-items: center;\n        min-height: 44px;',
   '    .mobile-dropdown-menu li a {\n        align-items: center;\n        min-height: 44px;',
   'вложенной ссылке бургера дан display: flex, иначе 44 не работает'],

  ['css/style.css',
   '    .floating-header .btn-auth,\n    .floating-header .lang-toggle {\n        min-height: 44px;',
   '    .floating-header .btn-auth,\n    .floating-header .lang-toggle {\n        min-height: 40px;',
   'под пальцем каждая цель в шапке не меньше 44'],

  ['css/style.css',
   '    color: var(--text-secondary);\n    text-decoration: none;\n    min-height: 36px;',
   '    color: var(--text-secondary);\n    text-decoration: none;',
   'ряд шапки на мыши держит одну высоту 36'],

  ['css/style.css',
   '.nav-item:focus-visible,\n.btn-auth:focus-visible,',
   '.nav-item:focus,\n.btn-auth:focus,',
   'в шапке есть видимый фокус с клавиатуры'],

  ['js/script.js',
   "            панель.classList.add('open');",
   "            панель.classList.add('opened');",
   'класс .open вешает скрипт, а не только описан в стилях'],

  ['js/script.js',
   "            if (e.key === 'Escape' && листОткрыт()) переключитьЛист(false, true);",
   "            if (e.key === 'Enter' && листОткрыт()) переключитьЛист(false, true);",
   'Esc закрывает лист и возвращает фокус на бургер'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-header.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s{2}НЕ ТАК\s{2}/.test(с))
                .map(с => с.replace(/^\s*НЕ ТАК\s*/, '').trim());
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

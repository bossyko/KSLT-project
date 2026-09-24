/**
 * ПРУВЕР ЗАМОРОЗКИ ПОДВАЛА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Заведён 24.09: у check-footer.js его не было вовсе. Это старейшая проверка
 * в проекте и единственная, которая жила без доказательства — и она же
 * оказалась красной с коммита c4d7e88, чего никто не видел, потому что она
 * не входила в общий бегунок.
 *
 *   node tools/check-footer-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-footer-'));

['css', 'tools', 'js', 'partials'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  ['js/script.js',
   '        var УЗКО = 768;',
   '        var УЗКО = 640;',
   'гармошка включается до 768'],

  ['js/script.js',
   'window.innerHeight - 20;',
   'window.innerHeight;',
   'кнопка «наверх» уходит от подвала'],

  ['js/script.js',
   "                    заголовок.removeAttribute('role');",
   "                    заголовок.removeAttribute('data-role');",
   'role/tabindex снимаются там, где гармошки нет'],

  ['js/script.js',
   "                    заголовок.setAttribute('role', 'button');",
   "                    заголовок.setAttribute('data-role', 'button');",
   'role/tabindex ставятся там, где гармошка есть'],

  ['js/script.js',
   "        document.querySelectorAll('.footer-year')",
   "        document.querySelectorAll('.footer-godik')",
   'год в копирайте подставляется'],

  ['js/script.js',
   "            return (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches)",
   "            return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)",
   'скрипт и стили используют ОДНО условие'],

  ['css/style.css',
   '.footer-legal-nav {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    height: auto;',
   '.footer-legal-nav {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    height: var(--header-h);',
   'своя навигация подвала не наследует высоту шапки'],

  ['css/style.css',
   '.footer-bottom-links a:focus-visible {\n    outline: 2px solid var(--accent);',
   '.footer-bottom-links a:focus-visible {\n    outline-offset: 2px;\n    border: 0;',
   'видимый фокус с клавиатуры'],

  ['css/style.css',
   '.footer-legal-short { display: none; }',
   '.footer-legal-short { opacity: 0; }',
   'переключатель длинных и коротких названий'],

  ['css/style.css',
   '@media (max-width: 600px) {\n    .footer-legal-full { display: none; }',
   '@media (max-width: 768px) {\n    .footer-legal-full { display: none; }',
   'короткие подписи включаются на 600, а не на 768'],

  ['css/style.css',
   '@media (any-pointer: coarse) {\n    .footer-bottom-links a {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        min-height: 44px;',
   '@media (min-width: 1px) {\n    .footer-bottom-links a {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        min-height: 44px;',
   'цель 44 задана по УКАЗАТЕЛЮ, а не только по ширине'],

  ['partials/footer-ru.html',
   '<nav class="footer-legal-nav" aria-label="Правовая информация">',
   '<div class="footer-legal-nav">',
   'ru: ссылки в nav со списком'],

  ['partials/footer-ru.html',
   '© <span class="footer-year">2026</span>',
   '© 2026',
   'ru: год отдельным элементом'],

  /* ПЕРЕПИСАНО 24.09 по решению Кости: значков в строке нет вовсе. Откат
     возвращает эмодзи-сердце и обязан уронить правило. */
  ['partials/footer-ru.html',
   '<p class="footer-made">Сделано в Кыргызстане</p>',
   '<p class="footer-made">Сделано с <span aria-hidden="true">❤️</span> в Кыргызстане</p>',
   'ru: в строке подвала нет значков вовсе'],

  ['partials/footer-ru.html',
   '<span class="footer-legal-short">Оферта</span>',
   '<span class="footer-legal-kratko">Оферта</span>',
   'ru: обе подписи на месте'],

  ['partials/footer-ru.html',
   'ОСОЗНАННЫЙ ДУБЛЬ',
   'Дубль',
   'ru: объяснение дубля не удалено из разметки'],

  ['css/style.css',
   '/* ОСОЗНАННЫЙ ДУБЛЬ',
   '/* Дубль',
   'объяснение дубля не удалено из стилей'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-footer.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*✗\s/.test(с))
                .map(с => с.replace(/^\s*✗\s*/, '').trim());
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

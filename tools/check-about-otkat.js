/**
 * ПРУВЕР ЗАМОРОЗКИ РАЗДЕЛА «О ПРОЕКТЕ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-about-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-about-'));

['css', 'tools', 'js'].forEach(д => fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф)));

const ОТКАТЫ = [
  ['css/style.css',
   '    grid-column: 1 / -1;\n    grid-row: 2;\n',
   '',
   'сетка плиток идёт во всю ширину, а не в колонке рядом с фото'],

  ['css/style.css',
   '    aspect-ratio: 1400 / 691;\n    max-height: 320px;',
   '    height: 340px;',
   'фотография держит отношение файла, а не высоту числом'],

  ['css/style.css',
   '    .about-image img { max-height: 240px; }',
   '',
   'потолок высоты фотографии падает по видам'],

  ['css/style.css',
   '    .about-image    { grid-column: 1; grid-row: auto; order: 3; }',
   '    .about-image    { grid-column: 1; grid-row: auto; order: -1; }',
   'на узком порядок по смыслу: вступление → плитки → снимок'],

  ['css/style.css',
   '.feature h3 {\n    font-size: var(--fs-base);',
   '.feature h3 {\n    font-size: var(--fs-sm);',
   'имя плитки стоит на ступени card title, а не вровень со строкой'],

  ['css/style.css',
   '.feature p {\n    font-size: var(--fs-sm);\n    line-height: 1.5;\n    color: var(--text-muted);',
   '.feature p {\n    font-size: var(--fs-sm);\n    line-height: 1.5;\n    color: var(--text-dim);',
   'внутри раздела нет --text-dim'],

  ['css/style.css',
   '    .feature p {\n        font-size: var(--fs-xs);\n        font-weight: 500;\n    }',
   '    .feature p {\n        font-size: var(--fs-xs);\n    }',
   'на телефоне строка плитки — caption, то есть Medium'],

  ['css/style.css',
   '.about-lead {\n    grid-column: 1;\n    grid-row: 1;\n    font-size: var(--fs-lg);',
   '.about-lead {\n    grid-column: 1;\n    grid-row: 1;\n    font-size: var(--fs-base);',
   'вступление стоит на ступени lead 21 · 16'],

  ['css/style.css',
   '.feature:focus-visible {\n    outline: 3px solid var(--accent);',
   '.feature:focus-visible {\n    outline: 0;',
   'кольцо фокуса есть у плитки'],

  ['css/style.css',
   '\n    .feature:hover .feature-icon,\n    .feature:focus-visible .feature-icon { transform: none; }',
   '',
   'движение спрашивает разрешения'],

  ['css/style.css',
   '.about-features > li {\n    display: flex;\n}\n\n',
   '',
   'пункт списка тянет ссылку на всю высоту'],

  ['css/style.css',
   '    height: 44px;\n    border-radius: var(--radius-lg);',
   '    height: 44px;\n    border-radius: 14px;',
   'плашка иконки — 44 и радиус со шкалы'],

  ['css/style.css',
   '.feature-icon svg {\n    width: 24px;',
   '.feature-icon svg {\n    width: 20px;',
   'иконка внутри плашки — 24'],

  ['css/style.css',
   '    .about-features { grid-column: 1; grid-row: auto; order: 2; grid-template-columns: repeat(2, 1fr); }',
   '    .about-features { grid-column: 1; grid-row: auto; order: 2; grid-template-columns: repeat(2, 1fr); }\n    .about-features { grid-template-columns: 1fr; }',
   'у сетки плиток ОДНО определение колонок на вид'],

  ['index.html',
   '<a class="feature" href="pages/tournaments-overview.html">',
   '<a class="feature">',
   'плитки — ссылки, все шесть · ru'],

  ['index.html',
   '<h3>Турниры</h3>',
   '<h4>Турниры</h4>',
   'имя плитки — h3, уровень не пропущен · ru'],

  ['index-en.html',
   ' width="1400" height="691"',
   '',
   'у фотографии объявлены ширина и высота · en'],

  ['index-kg.html',
   '<span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 3.5h8v5.5a4 4 0 0 1-8 0V3.5Z"/>',
   '<span class="feature-icon">🎾<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 3.5h8v5.5a4 4 0 0 1-8 0V3.5Z"/>',
   'эмодзи в разделе нет, есть шесть иконок · kg'],

  ['index.html',
   'style.css?v=363',
   'style.css?v=357',
   'версии подняты']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-about.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    return (e.stdout || '').split('\n').filter(с => с.indexOf('✗ ') !== -1).map(с => с.replace(/^\s*✗\s*/, '').trim());
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

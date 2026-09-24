/**
 * ПРУВЕР ЗАМОРОЗКИ БЛОКА «СТАНЬТЕ СПОНСОРОМ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-sponsor-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sponsor-'));

['css', 'tools', 'js'].forEach(д => fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф)));


/* ЯКОРЬ НА ЧИСЛО, КОТОРОЕ РАСТЁТ, — ТАКОЙ ЖЕ ЯКОРЬ НА СОСЕДА. Здесь стояли
   версии числом, и откат умирал каждый раз, когда соседний кусок поднимал
   версию. Теперь число читается из файла в момент прогона. */
const ВЕРСИЯ_СЕЙЧАС = 'style.css?v=' + (fs.readFileSync(path.join(КОРЕНЬ, 'index.html'), 'utf8').match(/style\.css\?v=(\d+)/) || [0, 0])[1];
/* Откат уводит версию заведомо ниже порога: минус единица порог не пробивает,
   а правило проверяет именно «не ниже». */
const ВЕРСИЯ_НАЗАД = 'style.css?v=1';

const ОТКАТЫ = [
  ['css/style.css',
   '.sp-offer h2 {\n    font-size: var(--fs-xl);',
   '.sp-offer h2 {\n    font-size: var(--fs-lg);',
   'на широком число СТРОГО мельче заголовка блока'],

  ['css/style.css',
   '.sp-num-val {\n    font-size: var(--fs-lg);',
   '.sp-num-val {\n    font-size: var(--fs-xl);',
   'на широком число СТРОГО мельче заголовка блока'],

  ['css/style.css',
   '    .sp-num-val { font-size: var(--fs-md); }',
   '    .sp-num-val { font-size: var(--fs-lg); }',
   'на узком число тоже строго мельче заголовка'],

  ['css/style.css',
   '        font-size: var(--fs-sm);\n        line-height: var(--lh-normal);\n        margin-bottom: var(--space-4);',
   '        font-size: var(--fs-xs);\n        line-height: var(--lh-normal);\n        margin-bottom: var(--space-4);',
   'вступление никогда не мельче пункта списка'],

  ['css/style.css',
   '.sp-offer-lead {\n    color: var(--text-secondary);\n    font-size: var(--fs-base);',
   '.sp-offer-lead {\n    color: var(--text-secondary);\n    font-size: var(--fs-lg);',
   'вступление — это body, а не ступень lead'],

  ['css/style.css',
   '.sp-offer {\n    padding: var(--space-6) var(--space-8);',
   '.sp-offer {\n    max-width: var(--container-narrow);\n    margin: 0 auto;\n    padding: var(--space-6) var(--space-8);',
   'у коробки нет своей ширины — её задаёт обёртка, как всем секциям'],

  ['css/style.css',
   '    gap: var(--space-2);\n    height: var(--btn-h-md);\n    padding: 0 var(--space-6);',
   '    gap: var(--space-2);\n    padding: 12px 26px;',
   'высота кнопки — свойством, и это минимальная цель нажатия'],

  ['css/style.css',
   '.sp-cta-btn:focus-visible {\n    outline: 3px solid var(--accent);\n    outline-offset: 3px;\n}',
   '.sp-cta-btn:focus-visible {\n    outline-offset: 3px;\n}',
   'у кнопки есть кольцо фокуса'],

  ['css/style.css',
   '    color: var(--accent-on);\n    font-family: inherit;',
   '    color: #0a0a0a;\n    font-family: inherit;',
   'текст на лайме берётся токеном, а не литералом'],

  ['css/style.css',
   '    .sp-cta-btn { transition: none; }\n    .sp-cta-btn:hover { transform: none; }',
   '    .sp-cta-btn { transition: none; }',
   'движение гасится по просьбе системы'],

  ['css/style.css',
   '    .sp-offer { padding: var(--space-4); }',
   '    .sp-offer { padding: 16px 14px; }',
   'отступов мимо шкалы в блоке нет'],

  ['css/style.css',
   '@media (max-width: 640px) {\n    .sp-gives { grid-template-columns: 1fr; }\n}',
   '@media (max-width: 480px) {\n    .sp-gives { grid-template-columns: 1fr; }\n}',
   'в блоке нет ни одной ширины, кроме 768 и 640'],

  ['css/style.css',
   '@media (orientation: landscape) and (max-height: 500px) {\n    .sp-offer { padding: var(--space-4) var(--space-6); }\n    .sp-offer-lead { margin-bottom: var(--space-4); }\n    .sp-nums { margin-bottom: var(--space-4); }\n    .sp-gives { margin-bottom: var(--space-4); }\n}',
   '',
   'слоёв ровно четыре: ≤768, ≤640, поворот и движение'],

  ['css/style.css',
   '    .sp-offer h2,\n',
   '',
   'заголовок блока объявлен ТЕМ ЖЕ правилом, что заголовки разделов'],

  ['css/sponsors.css',
   'border-radius: var(--radius-xl);\n    background: var(--surface-glass); border: 1px solid rgba(204,255,0,0.25);',
   'border-radius: var(--radius-lg);\n    background: var(--surface-glass); border: 1px solid rgba(204,255,0,0.25);',
   'обе коробки согласны по радиусу и свечению'],

  ['js/stats.js',
   "var els = document.querySelectorAll('#' + id + ', [data-stat=\"' + id + '\"]');",
   'var els = [document.getElementById(id)].filter(Boolean);',
   'число турниров считает ОДИН счётчик, а не два'],

  ['index.html',
   '<h2>Станьте спонсором КСЛТ</h2>',
   '<h3>Станьте спонсором КСЛТ</h3>',
   'заголовок блока — h2 · ru'],

  ['index-en.html',
   '<span class="sp-num-val" data-stat="statTournaments">&mdash;</span><span class="sp-num-cap">tournaments played</span>',
   '<span class="sp-num-val">120+</span><span class="sp-num-cap">rated tournaments</span>',
   'третье число приходит из базы · en'],

  ['index-kg.html',
   '<section class="sp-offer-wrap">',
   '<section class="sp-offer-wrap-OFF">',
   'блок есть на языке · kg'],

  /* Перевод страницы спонсоров закрыт 24.09: кнопка ведёт на свой язык. */
  ['index-en.html',
   'href="pages/sponsors-en.html"',
   'href="pages/sponsors.html"',
   'в блоке одна ссылка, и она ведёт на страницу СВОЕГО языка · en'],

  ['index.html',
   ВЕРСИЯ_СЕЙЧАС,
   ВЕРСИЯ_НАЗАД,
   'версии подняты'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-sponsor.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => s_упало(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
}
function s_упало(с) { return /^\s*✗\s/.test(с); }

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

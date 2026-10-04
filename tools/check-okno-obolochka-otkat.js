/**
 * ПРУВЕР ЗАМОРОЗКИ ОБОЛОЧКИ ОКНА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — ровно то, что жило в коде до 04.10: окно без оболочки, без
 * ловушки фокуса, без предела высоты, с порогом выхода на четырёх кнопках.
 *
 *   node tools/check-okno-obolochka-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-okno-'));

['js', 'css', 'tools', 'pages'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  ['js/admin/core/utils.js',
   '    A.оболочкаОкна = оболочкаОкна;',
   '    A.оболочкаОкнаБыло = оболочкаОкна;',
   'оболочка объявлена одна и отдана разделам'],

  /* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ ОКНА: в users.js их три, и общее
     начало встречалось трижды. Берём окно бана — по его заголовку. */
  ['js/admin/sections/users.js',
   "var окноГот = A.оболочкаОкна({ сырое:\n            '<div class=\"ad-confirm-modal\" style=\"max-width:440px;\">' +\n                '<div class=\"ad-confirm-title\">' + L.usrBanConfirm",
   "var overlay = document.createElement('div');\n        overlay.className = 'ad-confirm-overlay';\n        overlay.innerHTML =\n            '<div class=\"ad-confirm-modal\" style=\"max-width:440px;\">' +\n                '<div class=\"ad-confirm-title\">' + L.usrBanConfirm",
   'ни одно окно в разделах не строит подложку само'],

  ['js/admin/sections/players.js',
   'var окноГот = A.оболочкаОкна({ сырое:',
   'var окноГот = ({ сырое:',
   'все девять окон разделов зовут оболочку'],

  ['js/admin/core/utils.js',
   "            окно.setAttribute('role', 'dialog');",
   "            окно.setAttribute('data-bylo', '1');",
   'готовой разметке доставляется то, чего в ней нет'],

  ['js/admin/core/utils.js',
   "        if (окно && окно.focus) окно.focus();",
   "        if (окно && окно.querySelector) окно.querySelector('button').focus();",
   'фокус уходит в окно, а не на кнопку'],

  ['js/admin/core/utils.js',
   "            if (e.key !== 'Tab') return;",
   "            if (e.key !== 'ТabНет') return;",
   'ловушка фокуса держит Tab внутри окна'],

  ['js/admin/core/utils.js',
   "            if (e.key === 'Escape') { закрыть(); return; }",
   "            if (e.key === 'EscapeНет') { закрыть(); return; }",
   'Esc закрывает окно'],

  /* ЗАМЕР ВМЕСТО ПРИСУТСТВИЯ: возвращаем ту самую проверку, что держала
     фокус на скрытой кнопке из закрытого меню. */
  ['js/admin/core/utils.js',
   '            var звалЖив = звал && document.body.contains(звал) &&\n                          звал.getBoundingClientRect().height > 0;',
   '            var звалЖив = звал && document.body.contains(звал);',
   'фокус возвращается только живому и видимому'],

  ['js/admin/core/utils.js',
   "    var счётчикОкон = 0;",
   "    var счётчикОконБыло = 0;",
   'подпись окна уникальна'],

  ['js/admin/core/utils.js',
   '            if (input) input.focus();',
   '            if (input) input.blur();',
   'в окне ввода фокус уезжает в поле, а не в окно'],

  /* `max-height: 90vh` есть и у второго семейства — держимся за СВОЙ
     блок по строкам, которые стоят рядом только у него. */
  ['css/admin.css',
   '    display: flex;\n    flex-direction: column;\n    max-height: 90vh;',
   '    display: flex;\n    flex-direction: column;\n    max-height: none;',
   'окно не рвёт экран: предел высоты и прокрутка тела'],

  ['css/admin.css',
   '    line-height: var(--lh-snug);\n    color: var(--text-primary);\n    margin-bottom: 8px;',
   '    color: var(--text-primary);\n    margin-bottom: 8px;',
   'заголовок окна стоит на ступени заголовка'],

  ['css/admin.css',
   '.ad-confirm-modal-wide { max-width: 540px; }',
   '.ad-confirm-modal-shirokoe { max-width: 540px; }',
   'ширина окна со списком — классом, а не числом'],

  ['css/admin.css',
   '.ad-confirm-actions:has(> :nth-child(3)) {',
   '.ad-confirm-actions:has(> :nth-child(4)) {',
   'выход уходит вниз уже при трёх кнопках'],

  /* ─── полоса вкладок турнира ─── */
  ['js/admin/core/utils.js',
   "    A.полосаВкладокТурнира = function(о) {",
   "    A.полосаВкладокТурнираБыло = function(о) {",
   'полоса вкладок турнира объявлена один раз'],

  /* Возвращаем ту самую копию, что жила в форме и не знала «Новостей». */
  ['js/admin/sections/tournaments.js',
   "                A.полосаВкладокТурнира({",
   "                '<div class=\"ad-tabs\"><button class=\"ad-tab active\" data-trn-nav=\"edit\">x</button></div>' + ({",
   'ни один раздел не рисует вкладки сам'],

  ['js/admin/core/utils.js',
   "(завершён ? вкладка('news'",
   "(false ? вкладка('news'",
   'состав вкладок выводится из турнира, а не из маршрута'],

  /* ЯКОРЬ НЕ ДЕРЖИТСЯ ЗА НОМЕР: он меняется при каждой правке файла, и
     откат устаревал сам собой. Ломаем САМ ПРИЗНАК версии — правило ищет
     `?v=` и не находит его. */
  ['pages/admin.html',
   'core/utils.js?v=',
   'core/utils.js?бeз=',
   'версии подняты — иначе браузер отдаст старое из кеша']
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools', 'check-okno-obolochka.js')],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return [];
  } catch (e) {
    const вывод = String(e.stdout || '') + String(e.stderr || '');
    return вывод.split('\n').filter(с => с.trim().startsWith('· '))
                .map(с => с.trim().slice(2).trim());
  }
}

let плохо = 0;
console.log('');
ОТКАТЫ.forEach(([файл, было, стало, ждём], i) => {
  const путь = path.join(ВРЕМ, файл);
  const ориг = fs.readFileSync(путь, 'utf8');
  const сколько = ориг.split(было).length - 1;
  if (сколько !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + файл + '): якорь встречается ' + сколько + ' раз');
    console.log('    ' + было.split('\n')[0].slice(0, 90));
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

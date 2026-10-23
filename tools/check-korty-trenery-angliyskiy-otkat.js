/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ АНГЛИЙСКОЙ ВЕТКИ ОТКАТОМ. 12.10, кусок 63-й.
 *
 * Каждое правило check-korty-trenery-angliyskiy.js проверяем обратным
 * ходом — возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ. «У меня зелёное» ничего не доказывает.
 *
 *   node tools/check-korty-trenery-angliyskiy-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-angl-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
/* ACORN В ПЕСОК: с 23.10 сторож читает ДЕРЕВО словаря, а не скобки.
   Без парсера он падает целиком, и прувер видит «упало: — ничего —» у
   всех откатов разом. ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО. */
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(ВРЕМ, 'node_modules', 'acorn'), { recursive: true });

const K = 'js/courts.js';
const T = 'js/coaches.js';
const ОБЩ = 'css/style.css';
const CSS = 'css/courts.css';
const EN = 'pages/courts-en.html';

const ОТКАТЫ = [
  /* ── английской ветки нет вовсе ──
     ОТКАТ ОСТАВЛЯЕТ ФАЙЛ РАЗБИРАЕМЫМ. Прежний ставил `false ? {` на место
     зова — после куска 137 это сломало бы синтаксис, и правило упало бы
     не по делу: ОТКАТ, ЛОМАЮЩИЙ РАЗБОР, НЕ ДОКАЗЫВАЕТ ПРАВИЛО. Здесь
     первым доводом встаёт НЕ ОБЪЕКТ — ровно то, что значит «английской
     ветки нет»: доводов становится четыре, и три объекта-ветви больше не
     читаются. Файл при этом цел. */
  [K, 'var L_labels = KSLT_YAZYK.выбрать({', 'var L_labels = KSLT_YAZYK.выбрать(НЕТ_АНГЛИЙСКОЙ_ВЕТКИ, {',
   'у словаря «корты» есть английская ветка'],

  [T, 'var L = KSLT_YAZYK.выбрать({', 'var L = KSLT_YAZYK.выбрать(НЕТ_АНГЛИЙСКОЙ_ВЕТКИ, {',
   'у словаря «тренеры» есть английская ветка'],

  /* ── перевод забыт в одной ветке ── */
  [K, '        filterCarpet: "Carpet",\n', '',
   'состав ключей «корты» одинаков во всех трёх ветках'],

  [T, '        filterKids: "Kids",\n', '',
   'состав ключей «тренеры» одинаков во всех трёх ветках'],

  /* ── русское слово осталось в английской ветке ── */
  [K, '        heroTitle: "Courts",', '        heroTitle: "Корты",',
   'в английской ветке «корты» нет кириллицы'],

  [T, '        heroTitle: "Coaches",', '        heroTitle: "Тренеры",',
   'в английской ветке «тренеры» нет кириллицы'],

  /* ── покрытие снова названо дважды ── */
  [K, '    var ПОКРЫТИЯ = KSLT_YAZYK.выбрать(SURFACE_MAP_EN, SURFACE_MAP_KG, SURFACE_MAP);',
      '    var ПОКРЫТИЯ_нет = null;',
   'покрытие выбирается по языку ОДНОЙ картой'],

  [K, '            var sLabel = ПОКРЫТИЯ[ct.surface] || ct.surface;',
      '            var sLabel = isEn ? (SURFACE_MAP_EN[ct.surface] || ct.surface) : isKg ? (SURFACE_MAP_KG[ct.surface] || ct.surface) : (SURFACE_MAP[ct.surface] || ct.surface);',
   'выбор языка покрытия не повторяется по файлу'],

  /* ── подпись опыта ── */
  [T, '        experienceFull: "years of experience",\n', '',
   'у подписи опыта есть короткая и полная запись в английской ветке'],

  [T, 'co-detail-stat-label">\' + L.experienceFull +', 'co-detail-stat-label">\' + L.experience +',
   'карточка берёт короткую подпись, страница — полную'],

  /* ── что читает диктор ── */
  [K, ' aria-haspopup="listbox" aria-expanded="false"', '',
   'раскрывашка называет себя раскрывашкой'],

  [K, "                toggle.setAttribute('aria-expanded', String(!wasOpen));\n", '',
   'aria-expanded переключается при открытии И при закрытии'],

  [K, "        var ГАЛКА = '<svg class=\"ct-dd-tick\"", "        var ГАЛКА = '<svg class=\"ct-dd-nothing\"",
   'у выбранного пункта меню есть галочка, а не только краска'],

  /* ── фокус ── */
  /* `.ct-search-input` и `.co-search-input` сняты 14.10 как мёртвые, и
     запятая после .pl-page-btn ушла вместе с ними */
  [ОБЩ, '.pl-page-btn:focus-visible{', '.net-takogo:focus-visible{',
   'фокус виден у чипов, карточек и ОБЩЕЙ полосы страниц'],

  /* ── межстрочные ── */
  [CSS, '    line-height: 1.3;\n    display: -webkit-box;', '    line-height: 1.25;\n    display: -webkit-box;',
   'межстрочный .ct-card-name стоит на ступени лестницы'],

  [CSS, '.ct-card-type {\n    font-size: var(--fs-xs);\n    /* 1.4 мимо лестницы — замер 12.10 */\n    line-height: 1.5;',
        '.ct-card-type {\n    font-size: var(--fs-xs);\n    line-height: 1.4;',
   'межстрочный .ct-card-type стоит на ступени лестницы'],

  /* ── версии ── */
  /* Имя правила стало адресным: 13.10 оно перестало склеивать
     js/courts.js и js/admin/sections/courts.js в одну подстроку. */
  [EN, 'courts.js?v=', 'courts.js?v=1&bylo=',
   'версия js/courts.js одна на все страницы, включая админку']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools', 'check-korty-trenery-angliyskiy.js')],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return [];
  } catch (e) {
    const текст = String(e.stdout || '');
    return текст.split('\n').filter(с => с.trim().startsWith('✗')).map(с => с.replace(/^\s*✗\s*/, '').trim());
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

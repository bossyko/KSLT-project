/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СТРАНИЦЫ ТУРНИРА ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что
 * оно зелёное всегда. Каждое правило check-stranica-turnira.js проверяем
 * обратным ходом — возвращаем прежнее значение, и ИМЕННО ТО правило
 * обязано упасть. Работаем на КОПИИ, оригиналы не трогаем.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ БЛОКА, а не на порядке в списке, не на
 * номере версии и не на соседе, который может уехать.
 *
 *   node tools/check-stranica-turnira-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-strturn-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
/* ВТОРАЯ КОПИЯ ПРАВИЛ ПРОДУКТА — В КОПИЮ ТОЖЕ. Без неё `чит` падает, и
   КАЖДЫЙ откат «роняет правило» по чужой причине: прибор обязан называть
   свою причину, а не соседскую. */
fs.mkdirSync(path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js'), path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });

const CSS = 'css/tournament-detail.css';
const JSФ = 'js/tournament-detail.js';
const RU  = 'pages/tournament.html';
const EN  = 'pages/tournament-en.html';
const ГЕН = 'js/tournament-generator.js';
const ПРАВ = 'js/kslt-rules.js';

const ОТКАТЫ = [
  /* ── подпись круга и пустая сетка (06.10) ── */
  [JSФ, '                            Math.pow(2, plTotalRounds), pr, plTotalRounds);',
        "                            0, pr, plTotalRounds); prName = 'Раунд ' + pr;",
   'подпись круга берётся из одного места, а не из трёх'],

  [ГЕН, '    kg: {', '    kgБыло: {',
   'словарь кругов знает три языка, а не два'],

  [ГЕН, '        64: [\n            { name: "1/32 Финала"', '        640: [\n            { name: "1/32 Финала"',
   'каждый из трёх языков знает все четыре размера сетки'],

  [JSФ, "            var lang = (isEn ? 'en' : (isKg ? 'kg' : 'ru'));",
        "            var lang = isEn ? 'en' : 'ru';",
   'киргизский не падает в русский при выборе словаря'],

  [JSФ, "                    '<p class=\"td-empty-title\">' + L.drawNotYet + '</p>' +",
        "                    '<h3>' + L.description + '</h3>' +",
   'под заголовком «Турнирная сетка» лежит сетка, а не описание'],

  [JSФ, "        drawNotYet: 'Сетка ещё не сформирована',",
        "        drawNotYetБыло: 'Сетка ещё не сформирована',",
   'пустая сетка называет причину и срок, а не молчит'],

  [CSS, '.td-empty-title {\n    font-size: var(--fs-base);',
        '.td-empty-title {\n    font-size: 17px;',
   'у пустого состояния два уровня текста, и оба на ступенях шкалы'],

  [ПРАВ, '                ? KSLT_ROUNDS.подпись(lang, 0, 1, кругов)',
         "                ? (isEn ? 'Semifinal' : 'Полуфинал')",
   'блок «все места» не называет круг своими словами'],

  [ПРАВ, '    R.ficSections = function(drawSize, lang) {',
         '    R.ficSections = function(drawSize, lang) { /* разошлись */',
   'две копии правил продукта не разошлись'],

  /* ── мера абзаца ── */
  [CSS, '    max-width: 80ch;', '    max-width: 900px;',
   'мера абзаца считается в ЗНАКАХ, а не в пикселях'],

  [CSS, '    max-width: 80ch;\n    font-size: var(--fs-base);',
        '    max-width: 80ch;\n    margin: 0 auto;\n    font-size: var(--fs-base);',
   'заголовок раздела и его текст стоят на ОДНОЙ левой границе'],

  [CSS, '    line-height: var(--lh-relaxed);\n    color: var(--text-secondary);',
        '    line-height: 1.7;\n    color: var(--text-secondary);',
   'межстрочный абзаца — ступень лестницы, а не число'],

  /* ── лента выбора блока ── */
  [JSФ, 'if (ficВидимые.length > 1) {\n                var подписьЛенты',
        'if (ficВидимые.length > 0) {\n                var подписьЛенты',
   'лента рисуется, только когда блоков больше одного'],

  [JSФ, '                ficВидимые.push(section.label);',
        '                ficВидимые.push(String(section.label));',
   'подписи ленты берутся по ходу отрисовки, а не вторым списком'],

  [CSS, '    min-height: var(--btn-h-sm);\n    padding: 0 var(--space-md);\n    border: 1px solid var(--border-subtle);\n    border-radius: var(--radius-full);',
        '    height: 32px;\n    padding: 0 var(--space-md);\n    border: 1px solid var(--border-subtle);\n    border-radius: var(--radius-full);',
   'чип ленты стоит на ступени кнопки'],

  [CSS, '.td-fic-chip::after {\n    content: \'\';', '.td-fic-chip-net::after {\n    content: \'\';',
   'цель нажатия чипа — прозрачный слой, и он не знает высоты кнопки'],

  [JSФ, 'role="radiogroup" aria-label="', 'class="radiogroup" aria-label="',
   'чип называет себя диктору выбором из набора'],

  [CSS, '.td-fic-section.td-fic-skryt {\n    display: none;\n}',
        '.td-fic-section.td-fic-skryt {\n    height: 0;\n    overflow: hidden;\n}',
   'скрытый блок УБРАН из раскладки, а не сжат'],

  [JSФ, "б.classList.toggle('td-fic-skryt', б.getAttribute('data-fic-blok') !== нужен);\n                    });\n                    requestAnimationFrame(function() {\n                        выровнятьМатчиЗаМеста(bracketContainer);\n                    });",
        "б.classList.toggle('td-fic-skryt', б.getAttribute('data-fic-blok') !== нужен);\n                    });",
   'сдвиг матчей за места считается ЗАНОВО при показе блока'],

  /* ── пустая ветка: решение Кости 05.10 ── */
  [JSФ, 'if (section.первоеМесто > участниковВСетке) return;',
        'if (false && section.первоеМесто > участниковВСетке) return;',
   'ветка, в которой мест не бывает, не рисуется'],

  [JSФ, 'if (!ficВБлокеЕстьЛюди(section, matches)) return;',
        'if (false) return;',
   'блок без людей не рисуется тоже'],

  /* ── полоса «Сыгранные» ── */
  [JSФ, 'if (сыграноШтук && ждутШтук) {', 'if (сыграноШтук) {',
   'у полосы «Сыгранные» ДВА условия, а не одно'],

  [JSФ, "(вСыгранные ? ' data-sygran=\"1\"' : '')",
        "(вСыгранные ? ' data-byl=\"1\"' : '')",
   'строки расписания не переставляются — прячутся на своём месте'],

  [JSФ, "'<td class=\"td-sched-num\">' + (i + 1) + '</td>'",
        "'<td class=\"td-sched-num\">' + (i) + '</td>'",
   'номер в расписании сквозной по всему турниру'],

  [JSФ, "'aria-expanded=\"false\" aria-controls=\"tdSchedTable\">'",
        "'data-expanded=\"false\">'",
   'полоса называет диктору, чем управляет'],

  /* ── прыжок по вкладке ── */
  [JSФ, '    function смещениеПодПолосу() {', '    var SCROLL_OFFSET = 120;\n    function смещениеПодПолосуНет() {',
   'смещение прыжка СЧИТАЕТСЯ, а не пишется числом'],

  [JSФ, "window.scrollTo({ top: getDocTop(next) - смещениеПодПолосу(), behavior: 'smooth' });",
        "window.scrollTo({ top: getDocTop(next) - 120, behavior: 'smooth' });",
   'высота полосы спрашивается при КАЖДОМ прыжке'],

  [JSФ, "                    t.classList.toggle('active', своя);",
        "                    t.classList.toggle('active', своя); var _ = 1;\n                    if (0)",
   'пометка для диктора стоит ТАМ ЖЕ, где класс подсветки'],

  [RU, '<button class="td-tab active" data-target="description" aria-current="true">',
       '<button class="td-tab active" data-target="description">',
   'активная вкладка помечена в разметке ВСЕХ трёх языков'],

  [CSS, '    .td-fic-chip {\n        transition: none;\n    }',
        '    .td-fic-chip-net {\n        transition: none;\n    }',
   'у новых переходов есть отказ от движения'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-stranica-turnira.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

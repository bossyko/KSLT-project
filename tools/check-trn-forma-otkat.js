/**
 * ПРУВЕР ЗАМОРОЗКИ ВКЛАДКИ «РЕДАКТИРОВАНИЕ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты — ровно то, что жило в коде до 28.09: инлайн-сетки вместо
 * готовых классов, высота кнопки из полей, слой цели нажатия копией,
 * скрытие полей в разметке, уровень турнира у дружеского турнира.
 *
 *   node tools/check-trn-forma-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-trnforma-'));

['js', 'css', 'tools', 'pages'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  /* ─── одна точка входа в раздел ─── */
  ['js/admin/core/init.js',
   '        A.renderNewsSection();',
   '        A.renderNewsSection();\n        A.renderTournamentsSection();',
   'раздел турниров рисуется только через switchTab'],

  ['js/admin/core/layout.js',
   'tournaments: A.renderTournamentsSection,',
   'tournaments: A.renderTournamentsList,',
   'вкладка зовёт секцию, а не список напрямую'],

  /* ─── сетка формы ─── */
  ['js/admin/sections/tournaments.js',
   "'<div class=\"ad-field-row ad-field-row-4\">' +\n                    '<div class=\"ad-field\">' +\n                        '<label class=\"ad-field-label\">' + L.trnCategory",
   "'<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:12px;\">' +\n                    '<div class=\"ad-field\">' +\n                        '<label class=\"ad-field-label\">' + L.trnCategory",
   'сетка формы одна: инлайн-гридов в секции нет'],

  ['js/admin/sections/tournaments.js',
   "'<div class=\"ad-field-row ad-field-flow\">' +\n                    '<div class=\"ad-field ad-pole-srednee\" id=\"adTrnBracketTypeWrap\">'",
   "'<div class=\"ad-field-row ad-field-row-4\">' +\n                    '<div class=\"ad-field ad-pole-srednee\" id=\"adTrnBracketTypeWrap\">'",
   'ряд полей сетки идёт потоком, а не колонками'],

  /* ─── ширина поля ─── */
  ['css/admin.css',
   '.ad-pole-uzkoe { --pole-shirina: 160px; }',
   '.ad-pole-uzkoe { --pole-shirina: 150px; }',
   'ступени ширины стоят на шкале восьмёрки'],

  ['css/admin.css',
   '.ad-pole-shirokoe { --pole-shirina: 360px; }',
   '.ad-pole-shirokoe-net { --pole-shirina: 360px; }',
   'ступени ширины поля заведены в компоненте'],

  /* ─── кнопки ─── */
  ['css/admin.css',
   '    height: var(--ad-btn-h, var(--btn-h-md));\n    padding: 0 24px;',
   '    padding: 10px 24px;',
   'высота кнопки — свойством, а не полями'],

  ['css/admin.css',
   '.ad-btn-sm { --ad-btn-h: var(--btn-h-sm); padding: 0 var(--space-sm); }',
   '.ad-btn-sm { --ad-btn-h: 36px; padding: 0 var(--space-sm); }',
   'ступени кнопки берут переменные, а не числа'],

  ['css/admin.css',
   /* ЯКОРЬ ПЕРЕВЯЗАН 03.10: тот же приём — слой 44 — завёлся вторым
      блоком для парных кнопок, и якорь стал встречаться дважды. Держимся
      за ОДИН конкретный блок, называя его последний селектор.
      ПРИЁМ, ПОВТОРЁННЫЙ В ДВУХ БЛОКАХ, ЛОМАЕТ ЯКОРЬ НА СВОЙСТВЕ. */
   '.ad-confirm-cancel::after {\n    content: \'\';\n    position: absolute;\n    left: 0;\n    right: 0;\n    top: 50%;\n    height: var(--btn-h-md);',
   '    height: 44px;\n    transform: translateY(-50%);',
   'слой цели ростом со ступени 44, а не числом'],

  /* Слой, написанный вторым блоком: ровно так он и размножался раньше */
  ['css/admin.css',
   '.ad-lang-tab:focus-visible,',
   '.ad-btn-translate-all::after { top: -4px; bottom: -4px; }\n\n.ad-lang-tab:focus-visible,',
   'цель нажатия 44 определена ОДИН раз'],

  /* Класс получил relative, а слой ему нарисовать забыли — шов, на котором
     кнопка молча остаётся без цели нажатия */
  ['css/admin.css',
   /* ЯКОРЬ ПОПРАВЛЕН 03.10: список классов слоя цели вырос — в него
      вошли `.ad-reg-check-wrap` и `.ad-confirm-cancel`. Старый якорь
      держался на ПОСЛЕДНЕЙ паре списка и перестал находиться, как только
      после неё встали новые строки. Теперь держится на `.ad-reg-menu-btn`
      и самом свойстве, а не на том, кто стоит в конце.
      ЯКОРЬ, ДЕРЖАЩИЙСЯ ЗА КОНЕЦ СПИСКА, ЛОМАЕТСЯ ПРИ ПЕРВОМ ДОПОЛНЕНИИ. */
   '.ad-reg-menu-btn,\n.ad-reg-act-vynos,',
   '.ad-reg-menu-btn {\n    position: relative;',
   'слой цели и position: relative перечисляют одни и те же классы'],

  ['css/admin.css',
   '.ad-btn:focus-visible {',
   '.ad-btn-net:focus-visible {',
   'кольцо фокуса стоит на базовом классе кнопки'],

  /* ─── уровень и очки ─── */
  ['js/admin/sections/tournaments.js',
   'var безОчков = isDbl || дружескийТурнир();',
   'var безОчков = isDbl;',
   'уровень турнира скрыт там, где очков не дают'],

  ['js/admin/sections/tournaments.js',
   "if (безОчков && lvlField) lvlField.value = '';",
   "if (безОчков && lvlField) lvlField.title = '';",
   'скрытый уровень обнуляется, а не уезжает в базу'],

  /* ЯКОРЬ ПЕРЕВЯЗАН 04.10: полоса вкладок уехала в `A.полосаВкладокТурнира`
     вместе с этой проверкой — в форме её больше нет. Вторую копию заводим
     там, где вызов `безОчковЗаКатегорию` в форме ещё остался. */
  ['js/admin/sections/tournaments.js',
   "return A.безОчковЗаКатегорию(поле ? поле.value : '');",
   "return (поле ? поле.value : '') === 'friendly';",
   '«дружеский» определён в одном месте'],

  ['js/admin/sections/tournaments.js',
   "document.getElementById('adTrnCat').addEventListener('change', toggleFormatDependentFields);",
   "document.getElementById('adTrnCat').addEventListener('input', function() {});",
   'смена категории перерисовывает форму'],

  /* ─── умолчание — свойство данных ─── */
  ['js/admin/sections/tournaments.js',
   "'<div class=\"ad-field ad-pole-uzkoe\" id=\"adTrnGroupCountWrap\">'",
   "'<div class=\"ad-field ad-pole-uzkoe\" id=\"adTrnGroupCountWrap\" style=\"display:none;\">'",
   'скрытие полей сетки не зашито в разметку'],

  ['js/admin/sections/tournaments.js',
   "'<div id=\"adTrnDrawHint\" class=\"ad-sched-note ad-sched-note-wide\"></div>'",
   "'<div id=\"adTrnDrawHint\" class=\"ad-sched-note ad-sched-note-wide\" style=\"margin-top:-4px;\"></div>'",
   'подсказка расчёта без инлайн-стиля'],

  ['css/admin.css',
   '    padding: 12px 16px;\n    margin-bottom: 16px;',
   '    padding: 10px 14px;\n    margin-bottom: 14px;',
   'отступы подсказки расчёта со шкалы'],

  /* ─── версии ─── */
  ['pages/admin.html',
   /* ЯКОРЬ БЕЗ НОМЕРА. Держался на 'v=50' и ломался при каждом подъёме
      версии — 29.09 поймано на 51. Теперь цепляемся за имя файла, а число
      подставляем заведомо старое: правило требует 50 и выше. */
   'sections/tournaments.js?v=',
   'sections/tournaments.js?v=45&bylo=',
   'версии подняты — иначе браузер отдаст старое из кеша'],
  /* ─── афиша: два представления и ни одной чужой ссылки (03.10) ─── */
  ['js/admin/sections/tournaments.js',
   "'<input type=\"file\" accept=\"image/jpeg,image/png\" id=\"adTrnImgInput\" style=\"display:none\">' +",
   "'<input type=\"url\" class=\"ad-field-input\" id=\"adTrnImgUrl\" placeholder=\"https://...\">' +\n                '<input type=\"file\" accept=\"image/jpeg,image/png\" id=\"adTrnImgInput\" style=\"display:none\">' +",
   'карточка афиши берёт только свой файл'],

  ['js/admin/sections/tournaments.js',
   'ad-afisha-pane--thumb',
   'ad-afisha-pane--crop',
   'афиша показана двумя створками'],

  ['js/admin/sections/tournaments.js',
   'A.esc(fullSrc || cropSrc)',
   'A.esc(cropSrc)',
   'у створок разные источники'],

  ['js/admin/sections/tournaments.js',
   'image_full: trnImageFullUrl || null,',
   'image_full: null,',
   'кадр и полная афиша пишутся в базу'],

  ['js/tournaments-overview.js',
   "imageFull: t.image_full || '',",
   "imageFull: t.image || '',",
   'публичная сторона читает полную афишу'],

  /* ─── лестница: межстрочный ступенью, а не от шрифта (03.10) ─── */
  ['css/tokens.css',
   '  --lh-none:    1;',
   '  --lh-odnoy-strokoy: 1;',
   'ступень --lh-none объявлена один раз'],

  ['css/admin.css',
   '    line-height: var(--lh-none);\n    border: none;',
   '    line-height: normal;\n    border: none;',
   'межстрочный управляющих уровней — ступенью лестницы'],

  ['css/admin.css',
   '       height, текст центрируется flex\'ом — ступень лестницы здесь --lh-none */\n    line-height: var(--lh-none);',
   '       height, текст центрируется flex\'ом — ступень лестницы здесь --lh-none */\n    line-height: 1.2;',
   'межстрочный управляющих уровней — ступенью лестницы'],

  ['css/admin.css',
   /* ЯКОРЬ ПЕРЕВЯЗАН 04.10: ту же ступень получил заголовок окна, и
      голая строка стала встречаться дважды. Держимся за блок афиши —
      за его кегль, который рядом и в окне не встречается. */
   '    font-size: var(--fs-xs);\n    /* Было 1.4 — мимо лестницы. Подпись переносится на узком виде,\n       значит ступень подзаголовка, а не одной строки */\n    line-height: var(--lh-snug);',
   '    font-size: var(--fs-xs);\n    /* Было 1.4 — мимо лестницы. Подпись переносится на узком виде,\n       значит ступень подзаголовка, а не одной строки */\n    line-height: 1.4;',
   'межстрочный текста афиши — ступенью лестницы'],

  ['css/admin.css',
   '    min-height: var(--btn-h-sm);',
   '    height: var(--btn-h-sm);',
   'вкладка раздела держит высоту порогом'],

  ['css/admin.css',
   '    line-height: var(--lh-tight);',
   '    line-height: 1.5;',
   'заголовок раздела — на ступени заголовка'],

  /* Вернуть 128 в список размеров: подписи его круга в продукте нет, и
     правило обязано упасть. Якорь держится на строке размера 64 — она
     живёт в блоке постоянно; встречается ровно один раз (проверено
     счётом, а не на вид). */
  ['js/admin/sections/tournaments.js',
   "'<option value=\"64\"' + (item && +item.draw_size === 64 ? ' selected' : '') + '>64</option>' +",
   "'<option value=\"64\"' + (item && +item.draw_size === 64 ? ' selected' : '') + '>64</option>' +\n                            '<option value=\"128\"' + (item && +item.draw_size === 128 ? ' selected' : '') + '>128</option>' +",
   'размер сетки предлагается только тот, чей круг умеют подписать'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-trn-forma.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*·\s/.test(с))
                .map(с => с.replace(/^\s*·\s*/, '').trim());
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

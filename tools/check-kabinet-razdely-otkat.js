/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ШЕСТИ РАЗДЕЛОВ КАБИНЕТА ОТКАТОМ.
 *
 * Каждое правило check-kabinet-razdely.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ. «У меня зелёное» ничего не доказывает.
 *
 *   node tools/check-kabinet-razdely-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-razdely-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/dashboard.css';
const ОБЩ = 'css/style.css';
const JSФ = 'js/dashboard.js';
const ГРФ = 'js/rating-chart.js';
const EN  = 'pages/dashboard-en.html';

const ОТКАТЫ = [
  /* ── высота ступенью ── */
  [CSS, '    min-height: var(--btn-h-md, 44px);\n    padding: 0 32px;',
        '    padding: 12px 32px;',
   'кнопка кабинета держит высоту ступенью компонента'],

  [CSS, '.db-field-input {\n    width: 100%;\n    min-height: 44px;',
        '.db-field-input {\n    width: 100%;',
   'поле ввода держит высоту явно — Input 25:5 велит это прямо'],

  [CSS, '.db-chip {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    min-height: 36px;',
        '.db-chip {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    min-height: 32px;',
   'чип фильтра стоит на ступени своего компонента'],

  [CSS, '.db-badges-expand-btn {\n    position: relative;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 36px;',
        '.db-badges-expand-btn {\n    position: relative;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 39px;',
   'кнопка значков стоит на ступени Utility, а не Button'],

  [CSS, '.db-tg-btn {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 36px;',
        '.db-tg-btn {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;',
   'кнопка Телеграма стоит на ступени'],

  /* ── чужая шкала ── */
  /* `.hn-card-btn` снят 14.10 как мёртвый; ступень держит .btn-secondary */
  [ОБЩ, '    .btn-secondary.btn-secondary{\n        min-height: 40px;',
        '    .btn-secondary.btn-secondary,\n    .db-btn.db-btn {\n        min-height: 40px;',
   'кнопка кабинета вынута из чужой шкалы кнопок сайта'],

  [ОБЩ, '    /* .db-chip ВЫНУТ 12.10 — шестой записью',
        '    .db-chip.db-chip {\n        min-height: 32px;\n    }\n    /* .db-chip ВЫНУТ 12.10 — шестой записью',
   'чип фильтра вынут из чужой шкалы «мелкая ступень»'],

  [CSS, '    .db-games-table tbody tr {\n        display: grid;',
        '    .db-games-table tbody tr {\n        display: table-row;',
   'таблица матчей называет себя своим классом'],

  /* ── слои цели ── */
  [CSS, '.db-btn-sm::after,\n.db-matches-table .db-opp-link::after,\n.db-matches-table .db-tour-link::after {',
        '.db-matches-table .db-opp-link::after,\n.db-matches-table .db-tour-link::after {',
   'слой цели 44 объявлен одним списком на все ступени ниже 44'],

  [ОБЩ, '    min-width: var(--btn-h-md);\n    width: 100%;\n    height: var(--btn-h-md);',
        '    width: 100%;\n    height: var(--btn-h-md);',
   'у общей полосы страниц слой 44 по ОБЕИМ сторонам'],

  /* ── крупная цифра ── */
  [CSS, '.db-stat-value {\n    font-size: var(--db-fs-cifra);\n    font-weight: 700;',
        '.db-stat-value {\n    font-size: var(--fs-xl);\n    font-weight: 700;',
   'крупная цифра не заводит своих ступеней помимо вторичных чисел'],

  [CSS, '.db-stats-grid-mini .db-stat-card:first-child .db-stat-value {\n    font-size: var(--db-fs-cifra);',
        '.db-stats-grid-mini .db-stat-card:first-child .db-stat-value {\n    font-size: var(--fs-2xl);',
   'все три места крупной цифры зовут одну переменную'],

  /* ── межстрочные ── */
  [CSS, '    .db-contacts-note {\n        font-size: var(--fs-xs);',
        '    .db-contacts-note {\n        line-height: 1.5;\n        font-size: var(--fs-xs);',
   'ни один уровень кабинета не несёт два межстрочных'],

  [CSS, '.db-choice {\n    padding: 0 16px;\n    font-size: var(--fs-xs);\n    font-weight: 600;\n    line-height: var(--lh-none);',
        '.db-choice {\n    padding: 0 16px;\n    font-size: var(--fs-xs);\n    font-weight: 600;',
   'у управляющих элементов межстрочный назван значением'],

  /* ── краска ── */
  [CSS, '    font-size: var(--fs-xs);\n    color: var(--text-muted);\n}\n\n.db-voucher-side {',
        '    font-size: var(--fs-xs);\n    color: rgba(255, 255, 255, 0.35);\n}\n\n.db-voucher-side {',
   'срок действия ваучера красится токеном'],

  [CSS, '    background: rgba(0, 136, 204, 0.28);',
        '    background: rgba(0, 136, 204, 0.15);',
   'кнопка Телеграма читается на своём фоне'],

  /* ── график ── */
  [ГРФ, '    function назватьГрафик(canvas, подпись) {',
        '    function назватьГрафикНЕТ(canvas, подпись) {',
   'у графиков есть общая назвалка'],

  [ГРФ, "        canvas.setAttribute('role', 'img');",
        "        canvas.setAttribute('roleНЕТ', 'img');",
   'назвалка ставит роль, имя и запасной текст разом'],

  [ГРФ, "        назватьГрафик(canvas,\n            t(opts, 'График уровня NTRP: от '",
        "        назватьГрафикПропуск(canvas,\n            t(opts, 'График уровня NTRP: от '",
   'назвалку зовут ОБА графика — рейтинговый и NTRP'],

  /* ── окно QR ── */
  [JSФ, "        overlay.className = 'db-modal-back';\n\n        var размерQR",
        "        overlay.className = 'db-modal-back';\n        overlay.style.cssText = 'position:fixed;inset:0';\n\n        var размерQR",
   'накладка окна QR — общий класс, а не семь свойств инлайном'],

  [JSФ, "            '<div class=\"db-qr-modal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"' + идЗаголовкаQR + '\">' +",
        "            '<div class=\"db-qr-modal\">' +",
   'окно QR называет себя окном и несёт имя'],

  /* ОТКАТ ПЕРЕВЯЗАН КУСКОМ 152: своего слушателя Escape у окна больше нет,
     клавиша приходит доводом `поEsc`. */
  [JSФ, "        var снятьQR = window.KSLT_FOKUS.запереть(overlay, { поEsc: закрытьQR });",
        "        var снятьQR = window.KSLT_FOKUS.запереть(overlay, { поEsc: null });",
   'окно QR выходит по Escape доводом дому и возвращает фокус'],

  [JSФ, "            снятьQR();",
        "            /* снятие не зовём */",
   'окно QR запирает фокус домом и снимает запирание'],

  [CSS, '    max-width: 340px;\n    width: 90%;', '    width: 90%;',
   'размеры окна QR живут в классах, а не в ветке по ширине окна'],

  /* ── отступы ── */
  [CSS, '.db-qr-code {\n    display: inline-block;\n    padding: 12px;',
        '.db-qr-code {\n    display: inline-block;\n    padding: 13px;',
   'отступы своих разделов не уходят со шкалы'],

  /* ── версии ── */
  [EN, '../css/dashboard.css?v=', '../css/dashboard.css?v=1&bylo=',
   'версия dashboard.css одна на все три языка'],

  [EN, '../js/dashboard.js?v=', '../js/dashboard.js?v=1&bylo=',
   'версия dashboard.js одна на все три языка'],

  [EN, '../js/rating-chart.js?v=', '../js/rating-chart.js?v=1&bylo=',
   'версия rating-chart.js одна на все три языка'],

  [EN, '../css/style.css?v=', '../css/style.css?v=1&bylo=',
   'версия style.css одна на все три языка'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-kabinet-razdely.js')],
      { cwd: ВРЕМ, encoding: 'utf8' });
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

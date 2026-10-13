/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ БАЛЛОВ И ПЛАТЕЖЕЙ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает. Каждое правило
 * check-kabinet-bally-platezhi.js проверяем обратным ходом — возвращаем
 * прежнее значение, и ИМЕННО ТО правило обязано упасть. Работаем на КОПИИ.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ своего блока, а не на соседе, не на номере
 * версии и не на положении в файле.
 *
 *   node tools/check-kabinet-bally-platezhi-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-bally-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/dashboard.css';
const JSФ = 'js/dashboard.js';
const EN  = 'pages/dashboard-en.html';

const ОТКАТЫ = [
  /* ── крупная цифра: одно определение ── */
  [CSS, '    --db-fs-cifra: var(--fs-xl);', '    --db-fs-cifra-net: var(--fs-xl);',
   'крупная цифра кабинета объявлена одной переменной'],

  [CSS, '.db-loy-balance-value {\n    font-size: var(--db-fs-cifra);',
        '.db-loy-balance-value {\n    font-size: var(--fs-3xl);',
   'цифру зовёт \\.db-loy-balance-value, а не своё число'],

  [CSS, '.db-redeem-balance-value {\n    font-size: var(--db-fs-cifra);',
        '.db-redeem-balance-value {\n    font-size: var(--fs-2xl);',
   'цифру зовёт \\.db-redeem-balance-value, а не своё число'],

  [CSS, '#db-payments .db-stat-value {\n    font-size: var(--db-fs-cifra);',
        '#db-payments .db-stat-value {\n    font-size: var(--fs-xl);',
   'плитки платежей берут ту же единственную ступень'],

  [CSS, '#db-payments .db-stat-value {\n    font-size: var(--db-fs-cifra);\n    line-height: var(--lh-tight);',
        '#db-payments .db-stat-value {\n    font-size: var(--db-fs-cifra);\n    line-height: var(--lh-normal);',
   'цифра плитки платежей несёт межстрочный заголовка на всех видах'],

  /* второй кегль в медиа — ровно то, что сняли */
  [CSS, '    /* Кегля здесь больше нет: цифра одна на всех видах, --db-fs-cifra */\n',
        '    .db-loy-balance-value {\n        font-size: var(--fs-2xl);\n    }\n',
   'у баланса баллов ровно один кегль на все виды'],

  [CSS, '    .db-redeem-item {\n        padding: 12px;\n        margin-bottom: 8px;\n    }',
        '    .db-redeem-balance-value {\n        font-size: var(--fs-2xl);\n    }\n\n    .db-redeem-item {\n        padding: 12px;\n        margin-bottom: 8px;\n    }',
   'у баланса в окне обмена ровно один кегль на все виды'],

  /* ── краска подписей ── */
  [CSS, '.db-loy-balance-label {\n    font-size: var(--fs-2xs);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    color: var(--text-muted);',
        '.db-loy-balance-label {\n    font-size: var(--fs-2xs);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    color: rgba(255, 255, 255, 0.4);',
   'подпись баланса красится токеном, а не своей альфой'],

  [CSS, '.db-loy-balance-unit {\n    margin-top: 4px;\n    font-size: var(--fs-xs);\n    color: var(--text-muted);',
        '.db-loy-balance-unit {\n    margin-top: 4px;\n    font-size: var(--fs-xs);\n    color: rgba(255, 255, 255, 0.35);',
   'единица «баллов» красится токеном'],

  [CSS, '.db-redeem-balance-label {\n    margin-top: 4px;\n    font-size: var(--fs-xs);\n    color: var(--text-muted);',
        '.db-redeem-balance-label {\n    margin-top: 4px;\n    font-size: var(--fs-xs);\n    color: rgba(255, 255, 255, 0.45);',
   'подпись баланса в окне обмена красится токеном'],

  /* ── межстрочные заголовков ── */
  [CSS, '.db-loy-history-title {\n    margin: 20px 0 12px;\n    font-size: var(--fs-base);\n    line-height: var(--lh-tight);',
        '.db-loy-history-title {\n    margin: 20px 0 12px;\n    font-size: var(--fs-base);\n    line-height: var(--lh-normal);',
   'заголовок истории баллов несёт межстрочный заголовка'],

  [CSS, '.db-redeem-title {\n    margin: 0;\n    font-size: var(--fs-md);\n    line-height: var(--lh-tight);',
        '.db-redeem-title {\n    margin: 0;\n    font-size: var(--fs-md);\n    line-height: var(--lh-normal);',
   'заголовок окна обмена несёт межстрочный заголовка'],

  /* ── приход и расход ── */
  [CSS, '.db-loy-points.is-plus  { color: var(--green-500); }',
        '.db-loy-points.is-plus  { color: #4caf50; }',
   'приход и расход красятся классами из системы'],

  [JSФ, "            var ptsClass = '';", "            var ptsStyle = '';",
   'разметка ставит класс, а не инлайн-цвет'],

  [JSФ, "                ptsClass = ' is-plus';", "                ptsClass = ' is-plus'; var цвет = '#4caf50';",
   'Material-цветов в кабинете не осталось'],

  /* ── третье окно ── */
  [JSФ, "var html = '<div class=\"db-redeem-modal\" role=\"dialog\" aria-modal=\"true\"'",
        "var html = '<div class=\"db-redeem-modal\"'",
   'окно обмена называет себя окном и несёт имя'],

  [JSФ, "        function поКлавишеОбмена(e) { if (e.key === 'Escape') закрытьОбмен(); }",
        "        function поКлавишеОбмена(e) { if (e.key === 'EscapeНЕТ') закрытьОбмен(); }",
   'окно обмена выходит по Escape'],

  [JSФ, "        overlay.addEventListener('keydown', ловушкаОбмена);",
        "        overlay.addEventListener('keydownНЕТ', ловушкаОбмена);",
   'окно обмена держит Tab внутри себя'],

  [JSФ, '        var фокусДоОбмена = document.activeElement;',
        '        var фокусДоОбмена = null;',
   'окно обмена возвращает фокус туда, откуда позвали'],

  [JSФ, '        кнопкаЗакрытьОбмен.focus();', '        /* фокус не переводим */',
   'фокус при открытии уходит в окно, а не остаётся на странице'],

  [JSФ, '                закрытьОбмен();\n                // Refresh loyalty tab',
        '                overlay.remove();\n                // Refresh loyalty tab',
   'все выходы из окна идут через одно закрытие'],

  [JSФ, "        overlay.className = 'db-modal-back';\n\n        /* ОКНО НАЗЫВАЕТ СЕБЯ ЗАГОЛОВКОМ",
        "        overlay.className = 'db-modal-back';\n        overlay.style.cssText = 'position:fixed;inset:0';\n\n        /* ОКНО НАЗЫВАЕТ СЕБЯ ЗАГОЛОВКОМ",
   'накладка окна обмена — общий класс, а не семь свойств инлайном'],

  /* ── цели нажатия ── */
  [CSS, '    min-width: 44px;\n    min-height: 44px;\n    padding: 0;\n    font-size: var(--fs-md);',
        '    min-width: 30px;\n    min-height: 26px;\n    padding: 0;\n    font-size: var(--fs-md);',
   'крестик окна обмена берёт ступень под палец'],

  [CSS, '.db-loy-redeem {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 44px;',
        '.db-loy-redeem {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    padding-top: 10px;',
   'кнопка обмена держит высоту свойством, а не полями'],

  [CSS, '.db-loy-redeem-item {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 28px;',
        '.db-loy-redeem-item {\n    position: relative;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 31px;',
   'кнопка награды стоит на ступени xs'],

  [CSS, '.db-loy-redeem-item::after {', '.db-loy-redeem-item::before {',
   'у кнопки награды есть прозрачный слой цели 44'],

  [CSS, '    font-weight: 700;\n    line-height: var(--lh-none);\n    color: #000;\n    background: var(--accent);\n    border: none;\n    border-radius: 8px;\n    cursor: pointer;\n    white-space: nowrap;\n}',
        '    font-weight: 700;\n    color: #000;\n    background: var(--accent);\n    border: none;\n    border-radius: 8px;\n    cursor: pointer;\n    white-space: nowrap;\n}',
   'у кнопок куска межстрочный назван значением, а не ссылкой на шрифт'],

  /* ── окно: ступени компонента ── */
  [CSS, '    max-width: 400px;\n    width: 90%;\n    max-height: 90vh;',
        '    max-width: 420px;\n    width: 90%;\n    max-height: 90vh;',
   'окно обмена стоит на ступени sm компонента Modal'],

  [CSS, '    border-radius: 16px;\n    padding: 20px;\n    max-width: 400px;',
        '    border-radius: 16px;\n    padding: 28px 24px;\n    max-width: 400px;',
   'поля окна названы один раз и равны полю компонента'],

  [CSS, '    max-width: 400px;\n    width: 90%;\n    max-height: 90vh;\n    overflow-y: auto;',
        '    max-width: 400px;\n    width: 90%;\n    max-height: 80vh;\n    overflow-y: auto;',
   'потолок высоты окна — тот, что велит компонент'],

  /* ── акцент строки ── */
  [CSS, '.db-pay-amount {\n    font-weight: 600;\n}', '.db-pay-amount {\n    font-weight: 400;\n}',
   'сумма платежа несёт вес на всех видах'],

  [CSS, '    .db-pay-amount {\n        grid-area: amount;\n        text-align: right;\n        font-size: var(--fs-base);',
        '    .db-pay-amount {\n        grid-area: amount;\n        text-align: right;\n        font-weight: 700;\n        font-size: var(--fs-base);',
   'в режиме списка сумма не заводит своего веса'],

  /* ── ширины колонок платежей ── */
  [CSS, '.db-pay-table.db-matches-table th:nth-child(2),\n.db-pay-table.db-matches-table td:nth-child(2) {',
        '.db-pay-table.db-matches-table td:nth-child(2) {',
   'ширина колонки суммы правится ПАРОЙ «заголовок + клетка»'],

  [CSS, '.db-pay-table.db-matches-table th:nth-child(5),\n.db-pay-table.db-matches-table td:nth-child(5) {',
        '.db-pay-table.db-matches-table td:nth-child(5) {',
   'ширина колонки примечания правится ПАРОЙ'],

  [CSS, '    width: 140px;\n    white-space: nowrap;', '    width: 1%;\n    white-space: nowrap;',
   'ширина суммы названа числом, а не процентом'],

  [CSS, '.db-pay-note {\n    overflow-wrap: anywhere;\n}', '.db-pay-note {\n    overflow-wrap: normal;\n}',
   'длинное слово в примечании переносится, а не едет вбок'],

  /* ── строк на страницу ── */
  [JSФ, '    var LOY_PER_PAGE = GAMES_PAGE;', '    var LOY_PER_PAGE = 20;',
   'история баллов листается тем же числом, что остальные списки'],

  [JSФ, '    var PAY_PER_PAGE = GAMES_PAGE;', '    var PAY_PER_PAGE = 10;',
   'платежи листаются тем же числом'],

  /* ── пустое состояние ── */
  [JSФ, "                        '<div class=\"db-empty-text\">' + L.payNoPaymentsText + '</div>' +",
        "                        '' +",
   'пустые платежи говорят, что здесь появится'],

  [JSФ, "        payNoPaymentsText: 'Your club and tournament payments will appear here',",
        "        payNoPaymentsTextНЕТ: 'Your club and tournament payments will appear here',",
   'подпись пустых платежей заведена на всех трёх языках'],

  /* ── версии ── */
  [EN, '../css/dashboard.css?v=', '../css/dashboard.css?v=1&bylo=',
   'версия dashboard.css одна на все три языка'],

  [EN, '../js/dashboard.js?v=', '../js/dashboard.js?v=1&bylo=',
   'версия dashboard.js одна на все три языка'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-kabinet-bally-platezhi.js')],
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

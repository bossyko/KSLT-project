/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СПИСКОВ КАБИНЕТА ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает. Каждое правило
 * check-kabinet-spiski.js проверяем обратным ходом — возвращаем прежнее
 * значение, и ИМЕННО ТО правило обязано упасть. Работаем на КОПИИ.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, а не на соседе и не на номере версии.
 *
 *   node tools/check-kabinet-spiski-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-spiski-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/dashboard.css';
const JSФ = 'js/dashboard.js';
const EN  = 'pages/dashboard-en.html';
const KG  = 'pages/dashboard-kg.html';

const ОТКАТЫ = [
  /* ── пара вместо номера ── */
  [CSS, '    .db-matches-table th.db-th-tournament,\n    .db-matches-table td.db-match-tournament {',
        '    .db-matches-table th:nth-child(5),\n    .db-matches-table td.db-match-tournament {',
   'прячется пара «заголовок + ячейка», а не номер колонки'],

  [JSФ, "            html += '<th class=\"db-th-tournament\">' + L.matchTournament + '</th>';",
        "            html += '<th>' + L.matchTournament + '</th>';",
   'заголовок колонки турнира назван во всех трёх таблицах матчей'],

  /* ── список ── */
  [CSS, '    .db-battles-table tbody tr,\n    .db-invites-table tbody tr {\n        display: grid;',
        '    .db-battles-table tbody tr,\n    .db-invites-table tbody tr {\n        display: table-row;',
   'на узком виде строка — список, а не строка таблицы'],

  [CSS, '            "who  who   who  who status"',
        '            "who  who   who  who stat2"',
   'области грида названы именами, а не номерами дорожек'],

  [CSS, '    .db-battles-table.db-battles-table tbody td:nth-child(1),',
        '    .db-battles-table tbody td:nth-child(1),',
   'клетка списка снимает ширину прежней колонки'],

  [CSS, '    .db-battles-table .db-opp-link,\n    .db-invites-table .db-opp-link {',
        '    .db-battles-table .db-opp-link-net,\n    .db-invites-table .db-opp-link {',
   'имя стоит в одну строку и обрезается, а не переносится'],

  [CSS, '    .db-battles-table .db-match-avatar,\n    .db-battles-table .db-match-avatar-ph,',
        '    .db-battles-table .db-match-avatar-net,\n    .db-battles-table .db-match-avatar-ph,',
   'кружок в списке стоит на своей ступени'],

  /* ── клетка называет содержимое ── */
  [JSФ, "'<td class=\"' + (actions ? 'db-cell-actions' : 'db-cell-status') +",
        "'<td class=\"' + (actions ? 'db-cell-act' : 'db-cell-stat') +",
   'клетка статуса и клетка кнопок различаются по имени'],

  /* ── значок ── */
  [CSS, '.db-status-badge {\n    min-height: 24px;',
        '.db-status-badge {\n    min-height: 23px;',
   'значок статуса собран по компоненту Badge'],

  [CSS, '    background: var(--danger-surface);',
        '    background: rgba(255, 71, 87, 0.13);',
   'фон значка — непрозрачная ступень, а не прозрачный тинт'],

  [CSS, '.db-invite-declined {\n    color: var(--red-500);',
        '.db-invite-declined {\n    color: #f44336;',
   'тона значка берутся из шкалы, а не свои'],

  /* ── цели и высоты ── */
  [CSS, '.db-match-h2h::after,\n.db-chal-btn::after {',
        '.db-match-h2h::after,\n.db-chal-btn-net::after {',
   'у H2H и кнопки ответа есть прозрачный слой цели 44'],

  [CSS, '    min-height: 28px;\n    line-height: 1;\n    padding: 4px 10px;',
        '    padding: 4px 10px;',
   'высота кнопки ответа держится свойством, а не суммой полей'],

  [CSS, '    .h2h-close {\n        min-width: 44px;\n        min-height: 44px;\n    }',
        '    .h2h-close {\n        min-width: 44px;\n    }',
   'закрытие окна H2H на узких видах — ступень под палец'],

  [CSS, '    line-height: 1;\n    padding: 3px 8px;',
        '    padding: 3px 8px;',
   'межстрочный H2H стоит на ступени лестницы'],

  /* ── одно объявление ── */
  [CSS, '.db-chal-actions {\n    display: flex;\n    justify-content: center;',
        '.db-chal-actions {\n    justify-content: center;\n}\n\n.db-chal-actions {\n    display: flex;',
   '.db-chal-actions объявлен один раз'],

  [CSS, '.db-invites-table th:nth-child(1),\n.db-invites-table td:nth-child(1) { width: 76px; }',
        '.db-invites-table th:nth-child(1),\n.db-invites-table td:nth-child(1) { width: 76px; }\n.db-invites-table th:nth-child(2),\n.db-invites-table td:nth-child(2) { width: 90px; }',
   'ширины колонок не разрослись сверх трёх известных наборов'],

  /* ── версии ── */
  [EN, 'dashboard.css?v=', 'dashboard.css?v=1',
   'версия dashboard.css одна на все три языка'],
  [KG, 'dashboard.js?v=', 'dashboard.js?v=1',
   'версия dashboard.js одна на все три языка'],
];

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-kabinet-spiski.js')],
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

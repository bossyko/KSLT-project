/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ШРИФТА УПРАВЛЕНИЙ ОТКАТОМ. 12.10, кусок 62-й.
 *
 * Каждое правило check-shrift-upravleniy.js проверяем обратным ходом —
 * возвращаем прежнее значение, и ИМЕННО ТО правило обязано упасть.
 * Работаем на КОПИИ. «У меня зелёное» ничего не доказывает.
 *
 *   node tools/check-shrift-upravleniy-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-shrift-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/dashboard.css';
const ОБЩ = 'css/tokens.css';   /* дом правила переехал 13.10 */
const JSФ = 'js/dashboard.js';
const EN  = 'pages/dashboard-en.html';

const ОТКАТЫ = [
  /* ── шрифт управлений ── */
  [ОБЩ, 'input, button, select, textarea {\n  font-family: inherit;\n}',
        'input, button, select, textarea {\n  letter-spacing: normal;\n}',
   'шрифт управлений наследуется общим правилом'],

  [ОБЩ, 'input, button, select, textarea {\n  font-family: inherit;\n}',
        'input, button, select, textarea {\n  font-family: inherit;\n}\n\ninput, button, select, textarea {\n  font-family: inherit;\n}',
   'общее правило шрифта объявлено ровно один раз'],

  [CSS, '.db-profile-card-empty {\n    font-size: var(--fs-sm);',
        '.db-profile-card-empty {\n    font-family: inherit;\n    font-size: var(--fs-sm);',
   'поштучных копий наследования не осталось ни одной'],

  /* ОХВАТ. Страница, потерявшая дом правила, роняет сторож охвата — ровно
     так и подвело судейское окно, пока дом стоял в `style.css`. */
  ['pages/players.html', 'tokens.css?v=', 'tokens-NET.css?v=',
   'дом общего правила подключают ВСЕ страницы продукта'],

  /* ── подчёркивание ── */
  [CSS, '    text-decoration: none;\n    transition: var(--transition-fast);\n}\n\n.db-btn-primary {',
        '    transition: var(--transition-fast);\n}\n\n.db-btn-primary {',
   'кнопка кабинета гасит подчёркивание в своём объявлении'],

  /* ── лестница карточки ── */
  [CSS, '.db-profile-card-name {\n    font-size: var(--fs-base);\n    font-weight: 700;',
        '.db-profile-card-name {\n    font-size: var(--fs-sm);\n    font-weight: 700;',
   'имя карточки крупнее её строк на широких видах'],

  [CSS, '    .db-profile-card-name {\n        font-size: var(--fs-base);\n    }',
        '    .db-profile-card-name {\n        font-size: var(--fs-sm);\n    }',
   'имя карточки крупнее строк НА КАЖДОМ виде, а не только на широком'],

  /* ── кнопка карточки ── */
  [CSS, '    .db-profile-card-actions .db-btn {\n        padding: 0 12px;\n        font-size: var(--fs-sm);\n    }',
        '    .db-profile-card-actions .db-btn {\n        padding: 0 12px;\n        font-size: var(--fs-xs);\n    }',
   'подпись кнопки карточки — ступень компонента Button 17:82'],

  [CSS, '    .db-profile-card-actions .db-btn {\n        padding: 0 12px;',
        '    .db-profile-card-actions .db-btn {\n        padding: 8px 8px;',
   'высоту кнопки карточки не задаёт вертикальное поле'],

  /* ── одно направление ряда ── */
  [CSS, '    .db-profile-card-actions {\n        flex-direction: row;\n        gap: 8px;\n    }',
        '    .db-profile-card-actions {\n        flex-direction: row;\n        gap: 8px;\n    }\n\n    .db-profile-card-actions {\n        flex-direction: column;\n    }',
   'направление ряда действий объявлено один раз'],

  /* ── кнопка QR достижима ── */
  [JSФ, 'id="dbProfileQr"', 'id="dbProfileQrX"',
   'кнопка QR есть в карточке профиля, а не только в боковом меню'],

  /* ── имя не объявляется дважды ── */
  [JSФ, '                        var ступень = window.KSLT_RULES && KSLT_RULES.местоВКатегории',
        '                        var место = window.KSLT_RULES && KSLT_RULES.местоВКатегории',
   'в карточке профиля ни одно имя не объявлено дважды'],

  /* ── версии ── */
  [EN, 'dashboard.js?v=', 'dashboard.js?v=1&bylo=',
   'версия dashboard.js одна на все три языка'],

  [EN, 'dashboard.css?v=', 'dashboard.css?v=1&bylo=',
   'версия dashboard.css одна на все три языка'],

  [EN, 'style.css?v=', 'style.css?v=1&bylo=',
   'версия style.css одна на все три языка']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools', 'check-shrift-upravleniy.js')],
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

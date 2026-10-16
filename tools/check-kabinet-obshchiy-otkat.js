/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ОБЩЕГО СЛОЯ КАБИНЕТА ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает: правило можно написать так, что
 * оно зелёное всегда. Каждое правило check-kabinet-obshchiy.js проверяем
 * обратным ходом — возвращаем прежнее значение, и ИМЕННО ТО правило
 * обязано упасть. Работаем на КОПИИ, оригиналы не трогаем.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ БЛОКА, а не на порядке в списке, не на
 * номере версии и не на соседе, который может уехать.
 *
 *   node tools/check-kabinet-obshchiy-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kabinet-'));
['css', 'tools', 'js', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const CSS = 'css/dashboard.css';
const JSФ = 'js/dashboard.js';
const RU  = 'pages/dashboard.html';
const EN  = 'pages/dashboard-en.html';
const KG  = 'pages/dashboard-kg.html';

/* Семнадцать нажимаемых мест — каждое со своим откатом: правило на класс
   должно падать именно на своём классе, а не «где-то в списке». */
const НАЖИМАЕМЫЕ = ['.db-sidebar-link', '.db-mobile-tab', '.db-subsection-toggle',
    '.db-btn', '.db-btn-sm', '.db-chip', '.db-notif-all-read', '.db-avatar-btn',
    '.db-choice', '.db-tg-off', '.db-pw-eye', '.db-loy-redeem', '.db-loy-redeem-item',
    '.db-modal-close', '.db-opp-link', '.db-match-h2h', '.db-field-input'];

const ОТКАТЫ = [
  /* ── краска ── */
  [CSS, '.db-stats-note {\n    margin: -8px 0 16px;\n    color: var(--text-muted);',
        '.db-stats-note {\n    margin: -8px 0 16px;\n    color: var(--text-dim);',
   'краска текста не падает ниже порога AA'],

  /* ── вес ── */
  [CSS, '.db-section-title {\n    font-size: var(--fs-xl);\n    font-weight: 700;',
        '.db-section-title {\n    font-size: var(--fs-xl);\n    font-weight: 800;',
   'вес берётся из системы 400 · 500 · 600 · 700'],

  /* ── лестница межстрочных ── */
  [CSS, '    /* 1.25 не ступень лестницы 1 · 1.1 · 1.3 · 1.5 · 1.65 — замер 11.10 */\n    line-height: 1.3;',
        '    line-height: 1.25;',
   'каждый межстрочный стоит на ступени лестницы'],

  [CSS, '.db-section select,\n.db-section textarea {\n    font-size: var(--fs-base);\n    line-height: 1.3;\n}',
        '.db-section select,\n.db-section textarea {\n}',
   'select и textarea стоят на той же лестнице, что поле ввода'],

  /* ── границы медиа ── */
  [CSS, '@media (max-width: 640px) { /* было 768px: границы в медиа — только 640 и 992 */\n    .db-field-row {',
        '@media (max-width: 768px) {\n    .db-field-row {',
   'граница медиа — только 640 и 992'],

  [CSS, '@media (max-width: 992px) and (max-height: 480px) {',
        '@media (max-width: 992px) and (orientation: landscape) {',
   'короткий вид делится высотой, а не новой шириной'],

  /* ── отказ от движения ── */
  
  
  /* ── цели нажатия ── */
  [CSS, '    min-height: 44px;\n    line-height: 1;\n}\n\n.db-sidebar-link,\n.db-subsection-toggle {',
        '    min-height: 42px;\n    line-height: 1;\n}\n\n.db-sidebar-link,\n.db-subsection-toggle {',
   'высота нажимаемого места — ступень шкалы кнопок'],

  [CSS, '.db-chip,\n.db-notif-all-read,\n.db-choice,\n.db-btn-sm {\n    display: inline-flex;\n    align-items: center;\n    min-height: 36px;',
        '.db-chip,\n.db-notif-all-read,\n.db-btn-sm {\n    display: inline-flex;\n    align-items: center;\n    min-height: 36px;',
   'цель нажатия .db-choice стоит на 36'],

  [CSS, '    .db-mobile-tab {\n        flex-direction: row;\n        gap: 8px;\n        padding: 8px 12px;\n        min-height: 44px;\n    }',
        '    .db-mobile-tab {\n        flex-direction: row;\n        gap: 8px;\n        padding: 8px 12px;\n    }',
   'плитка раздела стоит на ступени шкалы кнопок'],

  /* ── глазок пароля ── */
  [CSS, '.db-chip,\n.db-notif-all-read,\n.db-choice,\n.db-tg-off {\n    position: relative;\n}',
        '.db-chip,\n.db-notif-all-read,\n.db-choice,\n.db-tg-off,\n.db-pw-eye {\n    position: relative;\n}',
   'глазок пароля позиционирован сам и остаётся внутри поля'],

  [CSS, '    font-size: var(--fs-sm);\n    line-height: 1;\n    transition: var(--transition-fast);\n}',
        '    line-height: 1;\n    transition: var(--transition-fast);\n}',
   'у глазка пароля свой кегль со шкалы'],

  /* ── уведомление ── */
  [JSФ, "    function сказать(текст, тон) {\n        if (window.KSLT_TOAST && window.KSLT_TOAST.показать) {",
        "    function сказать(текст, тон) {\n        alert(текст);\n        if (window.KSLT_TOAST && window.KSLT_TOAST.показать) {",
   'ни одного браузерного alert() мимо обёртки'],

  [JSФ, "            window.KSLT_TOAST.показать(текст, { тон: тон || 'info' });",
        "            window.KSLT_ТОСТ_СТАРЫЙ(текст, { тон: тон || 'info' });",
   'уведомление зовётся через общий файл'],

  [RU, 'js/kslt-toast.js', 'js/kslt-toast-net.js',
   'уведомление подключено на странице ru'],
  [EN, 'js/kslt-toast.js', 'js/kslt-toast-net.js',
   'уведомление подключено на странице en'],
  [KG, 'js/kslt-toast.js', 'js/kslt-toast-net.js',
   'уведомление подключено на странице kg'],

  /* ── полоса страниц ── */
  [JSФ, "        var полоса = container.querySelector('.db-polosa');",
        "        var полоса = container.querySelector('.db-polosa');\n        html += '<button class=\"pl-page-num\">1</button>';",
   'своей полосы страниц в кабинете нет'],

  [JSФ, "            window.KSLT_полосаСтраниц(полоса, items.length, page + 1, GAMES_PAGE, L);",
        "            window.KSLT_полосаСтраницНЕТ(полоса, items.length, page + 1, GAMES_PAGE, L);",
   'каждая коробка полосы зовёт общий компонент'],

  [RU, 'js/polosa-stranic.js', 'js/polosa-stranic-net.js',
   'общая полоса подключена на странице ru'],
  [EN, 'js/polosa-stranic.js', 'js/polosa-stranic-net.js',
   'общая полоса подключена на странице en'],
  [KG, 'js/polosa-stranic.js', 'js/polosa-stranic-net.js',
   'общая полоса подключена на странице kg'],

  [JSФ, "        shownOf: 'из', pageOf: 'из',", "        pageOf: 'из',",
   'подпись полосы shownOf есть во всех трёх словарях'],
  [JSФ, "        shownOf: 'of', pageOf: 'of',", "        shownOf: 'of',",
   'подпись полосы pageOf есть во всех трёх словарях'],
  [JSФ, "prevPage: '\\u2190 Артка', nextPage: 'Кийинки \\u2192',",
        "nextPage: 'Кийинки \\u2192',",
   'подпись полосы prevPage есть во всех трёх словарях'],
  [JSФ, "prevPage: '\\u2190 Previous', nextPage: 'Next \\u2192',",
        "prevPage: '\\u2190 Previous',",
   'подпись полосы nextPage есть во всех трёх словарях'],

  /* ── окно ── */
  [JSФ, "'<div class=\"db-modal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"' + идЗаголовка + '\">' +",
        "'<div class=\"db-modal\" role=\"dialog\" aria-modal=\"true\">' +",
   'окно называет себя своим заголовком'],

  [JSФ, "        back.addEventListener('keydown', ловушка);",
        "        back.addEventListener('keyup', ловушка);",
   'оба окна кабинета держат Tab внутри себя'],

  [JSФ, '        var фокусДоОкна = document.activeElement;\n        var кнопкаЗакрыть = back.querySelector',
        '        var фокусДоОкна = null;\n        var кнопкаЗакрыть = back.querySelector',
   'оба окна кабинета возвращают фокус туда, откуда их позвали'],

  [JSФ, "        overlay.addEventListener('keydown', ловушка);",
        "        overlay.addEventListener('keyup', ловушка);",
   'оба окна кабинета держат Tab внутри себя'],

  [JSФ, '        var фокусДоОкна = document.activeElement;\n        var closeOverlay',
        '        var фокусДоОкна = null;\n        var closeOverlay',
   'оба окна кабинета возвращают фокус туда, откуда их позвали'],

  [JSФ, "        document.addEventListener('keydown', onKey);\n        кнопкаЗакрыть.focus();",
        "        document.addEventListener('keydown', onKey);",
   'оба окна кабинета открываются с фокусом на себе'],

  /* ── один уровень — одно объявление ── */
  [CSS, '    line-height: 1.1;\n    /* КАПС СНЯТ',
        '    /* КАПС СНЯТ',
   'заголовок раздела держит свой межстрочный'],

  [CSS, '    text-transform: none;\n    color: var(--text-primary);\n    margin-bottom: var(--space-md);',
        '    color: var(--text-primary);\n    margin-bottom: var(--space-md);',
   'заголовок раздела не кричит капсом'],

  /* ── версии ── */
  [EN, 'dashboard.css?v=', 'dashboard.css?v=1',
   'версия dashboard.css одна на все три языка'],
  [KG, 'dashboard.js?v=', 'dashboard.js?v=1',
   'версия dashboard.js одна на все три языка']
];

/* Фокус — по одному откату на каждый класс: правило на класс обязано
   падать именно на своём классе. */
НАЖИМАЕМЫЕ.forEach(кл => {
    ОТКАТЫ.push([CSS, кл + ':focus-visible', кл + '-net:focus-visible',
        'фокус виден у ' + кл]);
});

ОТКАТЫ.push([CSS, '.db-sidebar-link:focus-visible,', '.db-sidebar-link:focus,',
    'фокус держится на :focus-visible, а не на :focus']);

ОТКАТЫ.push([CSS,
    '    outline-offset: 1px;\n    transition: outline-color var(--transition-fast),',
    '    outline-offset: 1px;\n    transition: var(--transition-fast); /*',
    'переходы контура перечислены, а не «all»']);

function прогон() {
  try {
    execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-kabinet-obshchiy.js')],
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

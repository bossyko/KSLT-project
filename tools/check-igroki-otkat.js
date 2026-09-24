/**
 * ПРУВЕР ЗАМОРОЗКИ «ДАВАЙ СЫГРАЕМ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. «У меня зелёное»
 * ничего не доказывает: правило может быть зелёным, читаемым и мёртвым.
 *
 *   node tools/check-igroki-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-igroki-'));

['css', 'tools', 'js'].forEach(д => fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, 'index.html'), path.join(ВРЕМ, 'index.html'));

/* [файл, что стоит сейчас, чем было до 24.09, какое правило обязано упасть] */
const ОТКАТЫ = [
  ['css/style.css',
   '#players .pt-grid > .pt-card:nth-child(n+6) { display: none; }',
   '',
   'у широкого вида есть потолок, и он равен числу колонок'],

  ['css/style.css',
   '@media (min-width: 641px) and (max-width: 992px) and (min-height: 501px) {',
   '@media (max-width: 992px) {',
   'слой планшета НЕ ПЕРЕСЕКАЕТСЯ с телефоном и с поворотом'],

  ['css/style.css',
   '    #players .pt-grid > .pt-card:nth-child(3n+1):nth-last-child(2),\n',
   '',
   'хвост из трёх ловит ОБА остатка — и один лишний, и два'],

  ['css/style.css',
   '#players .pt-grid { grid-template-columns: repeat(4, 1fr); }',
   '#players .pt-grid { grid-template-columns: repeat(3, 1fr); }',
   'телефон боком — четыре в ряд и ровно один ряд'],

  ['css/style.css',
   '    #players .pt-grid > .pt-card:nth-child(odd):nth-last-child(1) { display: none; }',
   '',
   'телефон — два ряда по две, и одинокая пятая прячется'],

  ['css/partners.css',
   '    .pt-avatar, .pt-avatar-placeholder {',
   '    .pt-avatar, .pt-avatar-placeholder,\n    #players .pt-avatar, #players .pt-avatar-placeholder {',
   'размеры карточек главной живут только в style.css'],

  ['css/partners.css',
   '.pt-ntrp-badge {\n    order: 1;\n    margin-top: var(--space-2);          /* 8 */',
   '.pt-ntrp-badge {\n    position: absolute;\n    top: var(--space-2);\n    right: var(--space-2);',
   'метка NTRP — строка, а не угол'],

  ['css/partners.css',
   '.pt-invite-btn { order: 2; }',
   '',
   'кнопка стоит после метки, а не перед'],

  ['css/partners.css',
   '.pt-avatar {\n    display: block;\n    width: 72px;',
   '.pt-avatar {\n    width: 72px;',
   'кружок с фотографией блочный'],

  ['css/partners.css',
   '    min-height: calc(var(--btn-h-md) + 12px);   /* красится 44, цель 56 */\n    padding: 0;',
   '    min-height: var(--btn-h-md);\n    padding: 0;',
   'высота кнопки задана свойством, а не полями'],

  ['css/style.css',
   '    .btn-secondary.btn-secondary,\n    .ct-card-btn.ct-card-btn,',
   '    .btn-secondary.btn-secondary,\n    .pt-invite-btn.pt-invite-btn,\n    .ct-card-btn.ct-card-btn,',
   'кнопка не ловит общую ступень «обычной» из блока 768'],

  ['css/partners.css',
   '.pt-card .pt-invite-btn {',
   '.pt-card .pt-invite-btn-mertvyy {',
   '«Пригласить» поднята над растянутой ссылкой'],

  ['css/partners.css',
   '.pt-name-link:focus-visible,\n.pt-invite-btn:focus-visible {',
   '.pt-name-link:hover,\n.pt-invite-btn:hover {',
   'видимый фокус есть И у ссылки, И у кнопки'],

  ['js/home-partners.js',
   'role="img" aria-label="\' +\n                    esc(L.online',
   'data-rol="img" data-label="\' +\n                    esc(L.online',
   'точка «онлайн» подписана'],

  ['css/style.css',
   '    .pg-sub { font-size: var(--fs-base); }   /* 16 */',
   '',
   'подзаголовок падает на той же границе, что и заголовок раздела'],

  ['css/partners.css',
   '    .pt-name {\n        font-size: var(--fs-sm);\n    }',
   '    .pt-name {\n        font-size: var(--fs-sm);\n        line-height: 1.25;\n    }',
   'межстрочный имени не задан НИГДЕ и потому один на все виды'],
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-igroki.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    return (e.stdout || '').split('\n').filter(l => l.trim().startsWith('✗')).map(l => l.trim().slice(2).trim());
  }
}

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
    console.log('  ок  ' + String(i + 1).padStart(2) + '  ' + ждём +
                (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
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

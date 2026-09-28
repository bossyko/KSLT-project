/**
 * ПРУВЕР ЗАМОРОЗКИ СТАТУСА ТУРНИРА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты здесь — это ровно те расхождения, которые жили в коде до 28.09:
 * «Скоро открытие» вместо «Скоро», «Предстоящий» в админке, своя карта
 * подписей и своя копия вычисления в каждом файле.
 *
 *   node tools/check-status-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-status-'));

['js', 'tools', 'pages'].forEach(д =>
  fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  ['js/tournament-status.js',
   "            upcoming: 'Скоро',",
   "            upcoming: 'Скоро открытие',",
   'по-русски upcoming — «Скоро»'],

  ['js/tournament-status.js',
   "            registration_open: 'Рег. открыта',",
   "            registration_open: 'Регистрация открыта',",
   'по-русски registration_open — «Рег. открыта»'],

  ['js/tournament-status.js',
   "            registration_closed: 'Рег. закрыта',",
   "            registration_closed: 'Регистрация закрыта',",
   'по-русски registration_closed — «Рег. закрыта»'],

  ['js/tournament-status.js',
   "            ongoing: 'Идёт',\n            completed: 'Завершён',",
   "            ongoing: 'Идет',\n            completed: 'Завершен',",
   'по-русски ongoing — «Идёт»'],

  ['js/tournament-status.js',
   "            cancelled: 'Отменён'\n        },\n        en:",
   "            cancelled: 'Отменен'\n        },\n        en:",
   'по-русски cancelled — «Отменён»'],

  ['js/tournament-status.js',
   "            upcoming: 'Жакында',",
   "            upcoming: '',",
   'состояние upcoming названо на всех трёх языках'],

  ['js/tournament-status.js',
   "    window.KSLT_STATUS = {",
   "    window.KSLT_STATUS_2 = {",
   'источник статусов существует и объявляет KSLT_STATUS'],

  ['js/tournament-status.js',
   "'ongoing', 'completed', 'cancelled'];",
   "'ongoing', 'completed'];",
   'в источнике ровно шесть состояний, столько же, сколько в базе'],

  ['js/tournaments-overlay.js',
   "            var statusLabels = window.KSLT_STATUS.подписи(",
   "            var statusLabels = { registration_open: 'Регистрация открыта' } || window.KSLT_STATUS.подписи(",
   'js/tournaments-overlay.js берёт подписи у источника, а не держит свою карту'],

  ['js/tournament-detail.js',
   "function computeStatus(a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); }",
   "function computeStatus(regStart) { var now = ''; if (regStart && now < regStart) return 'upcoming'; return 'upcoming'; }",
   'js/tournament-detail.js не держит своей копии вычисления статуса'],

  ['js/admin/core/constants.js',
   "    var TOURNAMENT_STATUSES = window.KSLT_STATUS.подписи(",
   "    var TOURNAMENT_STATUSES = { registration_open: 'Регистрация открыта' } || Ф.подписи(",
   'js/admin/core/constants.js берёт подписи у источника, а не держит свою карту'],

  ['pages/tournaments.html',
   '<script src="../js/tournament-status.js?v=1"></script>\n',
   '',
   'pages/tournaments.html подключает источник статусов'],

  ['pages/admin.html',
   '    <script src="../js/tournament-status.js?v=1"></script>\n    <script src="../js/admin/core/constants.js',
   '    <script src="../js/admin/core/constants.js',
   'pages/admin.html подключает источник статусов']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-status.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*✗\s/.test(с))
                .map(с => с.replace(/^\s*✗\s*/, '').trim());
  }
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

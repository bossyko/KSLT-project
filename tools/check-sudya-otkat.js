/**
 * ПРУВЕР ЗАМОРОЗКИ СУДЕЙСКОГО ОКНА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-sudya-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sudya-'));
['css', 'tools', 'js', 'sql', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  ['css/umpire.css', '--um-bg:     var(--bg-base);', '--um-bg: #0a0a0a;',
   'свои имена красок ведут к токенам, а не к своим числам'],

  ['css/umpire.css', '    --um-p1: #4FC3F7;', '    --um-p1: #4FC3F7;\n    --um-p3: #AB47BC;',
   'своих красок ровно две — по одной на игрока'],

  ['css/umpire.css', '.um-marks {\n    display: flex;', '.um-marks {\n    background: rgba(0,0,0,0.5);\n    display: flex;',
   'в файле не осталось ни одной rgba'],

  ['css/umpire.css', '.um-btn-p1 { background: var(--um-p1); }',
   '.um-btn-p1 { background: linear-gradient(135deg, #1565C0, #42A5F5); }',
   'градиентов у кнопок очка нет'],

  ['css/umpire.css', '    color: var(--accent-on);\n    min-height: 140px;', '    color: #ffffff;\n    min-height: 140px;',
   'текст на кнопке очка почти-чёрный, а не белый'],

  ['css/umpire.css', '    line-height: 1.2;\n    overflow-wrap: anywhere;',
   '    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;',
   'имя игрока НИКОГДА не обрезается'],

  ['css/umpire.css', '    .um-player-row { padding: var(--space-3) var(--space-2); grid-template-columns: 24px 1fr 44px 44px; }',
   '    .um-player-row { padding: var(--space-3) var(--space-2); grid-template-columns: 24px 1fr 44px 44px; }\n    .um-player-name { font-size: var(--fs-base); }',
   'СТОРОЖ: на телефоне кегли счёта и имени НЕ уменьшаются'],

  ['css/umpire.css', '@media (max-width: 640px) {', '@media (max-width: 375px) {',
   'по ширине одна граница, и это 640'],

  ['css/umpire.css', '@media (orientation: landscape) and (max-height: 500px) {', '@media (max-width: 900px) and (max-height: 500px) {',
   'тесная высота делится поворотом, а не ещё одной шириной'],

  ['js/umpire.js', "'<div class=\"um-match-head\">' +", "'<div class=\"um-match-head\">🎾' +",
   'в судейском модуле не осталось ни одного эмодзи'],

  ['css/umpire.css', '.um-serve-dot::before {\n    content: \'\';\n    width: 12px;\n    height: 12px;\n    border-radius: var(--radius-full);',
   '.um-serve-dot::before {\n    content: \'\';\n    width: 12px;\n    height: 12px;',
   'значок подачи рисуется стилем, а не буквой'],

  ['js/umpire.js', "'<div class=\"um-match-players\">'", "'<div class=\"um-x\">'",
   'судья видит, какой матч ведёт'],

  ['sql/схема/live-match-point-mark.sql', '       AND seq = p_seq\n    RETURNING seq INTO v_seq;',
   '       AND seq = (SELECT MAX(seq) FROM public.live_match_points WHERE match_id = v_match_id)\n    RETURNING seq INTO v_seq;',
   'метка ставится ПО НОМЕРУ розыгрыша, а не на «последний»'],

  ['js/umpire.js', "{ p_key: umpireKey, p_seq: markSeq, p_mark: markSet }", "{ p_key: umpireKey, p_mark: markSet }",
   'судейский модуль передаёт номер розыгрыша'],

  ['js/umpire.js', '        markSeq = null;          // новый розыгрыш — прежний номер недействителен\n', '',
   'новое очко обнуляет прежний номер'],

  ['js/umpire.js', '            markSeq = null; markSet = null; markUntil = 0;\n            clearTimeout(markTimer);\n', '',
   'отмена очка уносит и метку'],

  ['js/umpire.js', "'<button class=\"um-btn um-btn-mark' + (markSet === 'ace' ? ' is-set' : '') + '\" id=\"umAce\">Эйс</button>' +",
   "'<button class=\"um-btn um-btn-mark\" id=\"umPlain\">Обычный</button>' +",
   'метка необязательна: кнопки «обычный розыгрыш» нет'],

  ['js/umpire.js', '        markUntil = Date.now() + 3000;', '        markUntil = Number.MAX_SAFE_INTEGER;',
   'окно метки закрывается само'],

  ['js/umpire.js', "'<button class=\"um-btn um-btn-mark' + (markSet === 'double' ? ' is-set' : '') + '\" id=\"umDouble\">Двойная</button>' +",
   "'<button class=\"um-btn um-btn-mark\" id=\"umUnf\">Невынужденная</button>' +",
   'спрашиваем только то, что судья объявляет вслух'],

  ['js/live-match.js', "'seq,set_no,game_no,winner,p1,p2,g1,g2,game_won,is_break,is_tiebreak,mark'",
   "'seq,set_no,game_no,winner,p1,p2,g1,g2,game_won,is_break,is_tiebreak'",
   'лента зрителя показывает метку и молчит, когда её нет'],

  ['css/umpire.css', '.um-btn:focus-visible {\n    outline: 3px solid var(--um-accent);',
   '.um-btn:focus-visible {\n    outline-offset: 3px;\n    opacity: 0.9;',
   'у кнопок есть кольцо фокуса'],

  ['css/umpire.css', '    .um-status-live { animation: none; }', '    .um-status-live { opacity: 1; }',
   'движение выключается по просьбе системы'],

  ['js/umpire.js', '        if (!navigator.wakeLock) return;\n        navigator.wakeLock.request', '        if (!navigator.screenLock) return;\n        navigator.screenLock.request',
   'экран держится незаснувшим, пока идёт матч'],

  ['js/umpire.js', "    document.addEventListener('visibilitychange', function() {", "    document.addEventListener('focus', function() {",
   'блокировка возвращается, когда судья вернулся во вкладку'],

  ['pages/umpire.html', 'href="../css/umpire.css?v=3"', 'href="../css/umpire.css"',
   'у стиля и скрипта судьи есть версия']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-sudya.js')], { cwd: ВРЕМ, encoding: 'utf8' });
    return [];
  } catch (e) {
    const текст = (e.stdout || '') + (e.stderr || '');
    return текст.split('\n').filter(с => /^\s*✗\s/.test(с)).map(с => с.replace(/^\s*✗\s*/, '').trim());
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

/**
 * ПРУВЕР ЗАМОРОЗКИ СТРАНИЦЫ МАТЧА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 * «У меня зелёное» ничего не доказывает.
 *
 *   node tools/check-live-stranica-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-live-str-'));

['css', 'tools', 'js', 'sql', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));

const ОТКАТЫ = [
  ['css/live-match.css',
   'padding: calc(var(--header-h) + var(--space-10)) var(--pad-x) var(--space-10);',
   'padding: 80px 20px 40px;',
   'поле от края экрана берётся у страницы, а не задаётся своим числом'],

  ['css/live-match.css',
   '    padding: calc(var(--header-h) + var(--space-10)) var(--pad-x) var(--space-10);\n}',
   '    padding: var(--space-10) var(--pad-x);\n}',
   'отбивка сверху считается от высоты шапки, а не числом'],

  ['css/live-match.css',
   '.lm-container {\n',
   '.lm-container {\n    max-width: var(--container-narrow);\n',
   'своей ширины у страницы нет — ширину держит та же формула, что у лендинга'],

  ['css/live-match.css',
   '@media (max-width: 992px) {',
   '@media (max-width: 991px) {',
   'по ширине ровно две границы, и это 992 и 640'],

  ['css/live-match.css',
   '@media (orientation: landscape) and (max-height: 500px) {',
   '@media (min-width: 700px) and (max-height: 500px) {',
   'тесная высота делится поворотом и высотой, а не ещё одной шириной'],

  ['css/live-match.css',
   '.lm-points-score {\n    min-width: 56px;\n    text-align: center;\n    font-size: var(--fs-3xl);',
   '.lm-points-score {\n    min-width: 56px;\n    text-align: center;\n    font-size: var(--fs-xl);',
   'очки строго крупнее счёта сета'],

  ['css/live-match.css',
   '.lm-set-score {\n    min-width: 26px;\n    text-align: center;\n    font-size: var(--fs-xl);',
   '.lm-set-score {\n    min-width: 26px;\n    text-align: center;\n    font-size: var(--fs-lg);',
   'счёт сета строго крупнее имени игрока'],

  ['css/live-match.css',
   '.lm-title {\n    font-size: var(--fs-2xl);',
   '.lm-title {\n    font-size: var(--fs-xl);',
   'заголовок матча стоит на ступени H1'],

  ['css/live-match.css',
   '    .lm-points-score { font-size: var(--fs-2xl); min-width: 44px; }',
   '    .lm-points-score { font-size: var(--fs-3xl); min-width: 44px; }',
   'на телефоне очки опускается по шкале'],

  ['css/live-match.css',
   '    font-size: var(--fs-xl);\n    font-weight: var(--fw-extrabold);\n    font-variant-numeric: tabular-nums;',
   '    font-size: var(--fs-xl);\n    font-weight: var(--fw-extrabold);',
   'цифры счёта сета моноширинные'],

  ['css/live-match.css',
   '.lm-players { padding: 0; }',
   '.lm-players { padding: 0; }\n.lm-live-badge { height: 43px; }',
   'у страницы НЕТ своего бейджа статуса'],

  ['js/live-match.js',
   '<span class="live-badge ',
   '<span class="lm-live-badge ',
   'страница выдаёт общие классы бейджа'],

  ['css/style.css',
   '.live-badge.is-completed {\n    background: var(--surface-glass-hover);\n    color: var(--text-secondary);\n}',
   '.live-badge.is-completed {\n    background: var(--success-subtle);\n    color: var(--success);\n}',
   'СТОРОЖ: пауза и завершён держат один тон'],

  ['css/live-match.css',
   '.lm-avatar,\n.lm-avatar-placeholder {\n    width: 40px;\n    height: 40px;',
   '.lm-avatar,\n.lm-avatar-placeholder {\n    width: 44px;\n    height: 44px;',
   'аватар стоит на ступенях Avatar 29:82, а не на своих'],

  ['css/live-match.css',
   '    width: fit-content;\n    min-height: var(--btn-h-md);',
   '    width: fit-content;',
   'цель нажатия у «назад» дотягивает до 44'],

  ['css/live-match.css',
   '.lm-back-link:focus-visible {\n    outline: 3px solid var(--accent);',
   '.lm-back-link:focus-visible {\n    outline-offset: 3px;\n    text-decoration: underline;\n    color: inherit;',
   'у «назад» есть кольцо фокуса'],

  ['js/live-match.js',
   '        backHome:   isEn',
   '        backToList:   isEn',
   '«назад» ведёт на главную и так и называется'],

  ['css/live-match.css',
   '.lm-sponsor-name { color: var(--text-secondary);',
   '.lm-sponsor-name { color: #8A8A8A;',
   'в файле не осталось ни одного цвета числом'],

  ['js/live-match.js',
   ' aria-live="polite" aria-atomic="false"',
   '',
   'табло объявлено живой областью'],

  ['css/live-match.css',
   '    .live-badge.is-live { animation: none; }',
   '    .live-badge.is-live { opacity: 1; }',
   'движение выключается у того, кто просил систему его убрать'],

  ['js/live-match.js',
   '    function loadPoints() {',
   '    function loadList() { return null; }\n\n    function loadPoints() {',
   'режим списка убран из скрипта'],

  ['css/live-match.css',
   '.lm-feed {\n',
   '.lm-card { display: block; }\n.lm-feed {\n',
   'раскладка списка убрана из стилей'],

  ['js/live-match.js',
   "        client.from('live_match_points')",
   "        client.from('live_matches_history_stub')",
   'лента читает журнал розыгрышей, а не судейский стек отмены'],

  ['css/live-match.css',
   '.lm-chip {\n    height: var(--btn-h-sm);',
   '.lm-tab {\n    height: var(--btn-h-sm);',
   'сеты переключаются ЧИПОМ, а не табом'],

  ['css/live-match.css',
   '.lm-feed-item:last-child::after { display: none; }',
   '.lm-feed-item:last-child::after { opacity: 0.5; }',
   'рельс ленты обрывается на последней записи'],

  ['css/live-match.css',
   '.lm-point-w2 { box-shadow: inset -2px 0 0 var(--warning); }',
   '.lm-point-w2 { box-shadow: inset 2px 0 0 var(--warning); }',
   'кто взял очко, видно не одним цветом'],

  ['js/live-match.js',
   "alt=\"' + esc(m.sponsor_name || L.sponsor) + '\"",
   "alt=\"Sponsor\"",
   'логотип спонсора подписан именем, а не словом «спонсор»'],

  ['js/admin/sections/live.js',
   '                sponsor_name: (document.getElementById(\'liveSponsorName2\') || {}).value || null,\n',
   '',
   'в админке есть поле имени спонсора и оно сохраняется'],

  ['js/umpire.js',
   '        if (scoreFingerprint(state) !== было) undoPoint();',
   '        undoPoint();',
   'отмена судьи убирает розыгрыш ТОЛЬКО когда счёт изменился'],

  ['js/umpire.js',
   "        client.rpc('umpire_log_point', { p_key: umpireKey, p_entry: entry })",
   "        client.rpc('umpire_save_state', { p_key: umpireKey, p_state: entry })",
   'судья пишет журнал розыгрышей отдельной функцией'],

  ['sql/схема/live-match-point-log.sql',
   '        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_points;',
   '        RAISE NOTICE \'realtime не трогаем\';',
   'журнал приходит на страницу живым'],

  ['sql/схема/live-match-point-log.sql',
   'CREATE POLICY "live_match_points_public_read"',
   'CREATE POLICY "live_match_points_public_insert" ON public.live_match_points FOR INSERT TO anon WITH CHECK (true);\nCREATE POLICY "live_match_points_public_read"',
   'писать в журнал может только функция, а читать — все'],

  ['pages/live-match.html',
   'href="../css/live-match.css?v=2"',
   'href="../css/live-match.css"',
   'стиль страницы подключён с версией · ru'],

  ['js/live-match.js',
   "isKg ? 'Мелдеш' : 'Турнир'",
   "isKg ? 'Турнир' : 'Турнир'",
   'кыргызские подписи переведены, а не повторяют русские'],

  ['css/live-match.css',
   '.lm-sponsor {\n    display: flex; align-items: center; gap: var(--space-3);',
   '.lm-sponsor {\n    color: var(--accent);\n    display: flex; align-items: center; gap: var(--space-3);',
   'у блока спонсора нет лайма']
];

function прогон() {
  try {
    execFileSync('node', [path.join(ВРЕМ, 'tools/check-live-stranica.js')], { cwd: ВРЕМ, encoding: 'utf8' });
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

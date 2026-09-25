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
   'padding: var(--space-10) var(--pad-x) var(--space-10);',
   'padding: 40px 20px 40px;',
   'поле от края экрана берётся у страницы, а не задаётся своим числом'],

  /* Откат возвращает ДВОЙНОЙ счёт высоты шапки — ту самую поломку,
     из-за которой под шапкой было 104 вместо 40. */
  ['css/live-match.css',
   '    padding: var(--space-10) var(--pad-x) var(--space-10);',
   '    padding: calc(var(--header-h) + var(--space-10)) var(--pad-x) var(--space-10);',
   'страница НЕ отбивает шапку второй раз'],

  /* Якорь ужат до объявления с max-width: после 25.09 .lm-container
     объявлен дважды — второй раз в медиазапросе «экран целиком». */
  /* У .lm-container своей ширины НЕТ вовсе — её держит --pad-x и общая
     формула лендинга. Поэтому откат её ДОБАВЛЯЕТ: возвращает узкий
     контейнер 1100, из-за которого у страницы было три левых края. */
  ['css/live-match.css',
   '.lm-container {\n',
   '.lm-container {\n    max-width: var(--container-narrow);\n',
   'своей ширины у страницы нет — ширину держит та же формула, что у лендинга'],

  ['css/live-match.css',
   '(min-width: 641px) and (max-width: 992px)',
   '(min-width: 641px) and (max-width: 991px)',
   'по ширине ровно две границы, и это 992 и 640'],

  ['css/live-match.css',
   '@media (orientation: landscape) and (max-height: 500px) {',
   '@media (min-width: 700px) and (max-height: 500px) {',
   'тесная высота делится поворотом и высотой, а не ещё одной шириной'],

  /* Откат возвращает РАЗНЫЕ ступени — решение, отменённое Костей 25.09. */
  ['css/live-match.css',
   '.lm-points-score {\n    min-width: 40px;\n    text-align: center;\n    font-size: var(--fs-xl);',
   '.lm-points-score {\n    min-width: 40px;\n    text-align: center;\n    font-size: var(--fs-3xl);',
   'очки и счёт сета стоят на ОДНОЙ ступени и различаются цветом'],

  /* Ронять надо ИМЯ, а не сет: сет теперь связан ещё и с очками, и его
     откат валил сразу два правила. Якорь переехал на имя. */
  ['css/live-match.css',
   '.lm-player-name {\n    display: flex; align-items: center; gap: var(--space-2);\n    font-size: var(--fs-md);',
   '.lm-player-name {\n    display: flex; align-items: center; gap: var(--space-2);\n    font-size: var(--fs-xl);',
   'счёт сета строго крупнее имени игрока'],

  ['css/live-match.css',
   '.lm-title {\n    font-size: var(--fs-2xl);',
   '.lm-title {\n    font-size: var(--fs-xl);',
   'заголовок матча стоит на ступени H1'],

  ['css/live-match.css',
   '    .lm-points-score { font-size: var(--fs-lg); min-width: 32px; }',
   '    .lm-points-score { font-size: var(--fs-3xl); min-width: 32px; }',
   'на телефоне очки опускается по шкале'],

  /* Якорь удлинён до цвета: с 25.09 сет и очки на ОДНОЙ ступени, и
     прежний кусок встречался в файле дважды. Различает их краска. */
  ['css/live-match.css',
   '    font-variant-numeric: tabular-nums;\n    color: var(--text-muted);\n}\n.lm-set-score.lm-current',
   '    color: var(--text-muted);\n}\n.lm-set-score.lm-current',
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
   '\n.lm-feed {\n    background: var(--bg-card);',
   '\n.lm-card { display: block; }\n.lm-feed {\n    background: var(--bg-card);',
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
   'у грубой ленты рельс обрывается на последней записи'],

  /* Два правила — два отката. Один роняет «цвет значит кто есть кто»,
     другой — «победителя очка видно без цвета». */
  ['css/live-match.css',
   '.lm-player-row { box-shadow: inset 3px 0 0 var(--player-1); }',
   '.lm-player-row { opacity: 1; }',
   'краска игрока значит ровно одно — кто есть кто'],

  ['css/live-match.css',
   '.lm-cell.is-won {\n    background: var(--bg-elevated);',
   '.lm-cell.is-won {\n    background: var(--player-1);',
   'кто взял очко, видно БЕЗ цвета — весом и подложкой'],

  ['css/live-match.css',
   '.lm-right .lm-score-panel { flex: 0 0 auto; }',
   '.lm-right .lm-score-panel { flex: 1 1 auto; }',
   'табло в колонке НЕ сжимается'],

  ['css/live-match.css',
   '    flex: 1 1 0;\n    min-width: 0;\n    overflow-x: auto;',
   '    overflow-x: auto;',
   'ряд ячеек в узкой колонке не схлопывается'],

  ['css/live-match.css',
   '    align-self: center;\n    width: auto;',
   '    width: 100%;',
   'кадр держит 16:9, а ширину ему ведёт высота'],

  ['js/live-match.js',
   'var естьВидео = !!ytId;',
   'var естьВидео = false;',
   'состояний раскладки ровно два, и оба выводятся из youtube_url'],

  ['js/live-match.js',
   "alt=\"' + esc(m.sponsor_name || L.sponsor) + '\"",
   "alt=\"Sponsor\"",
   'логотип спонсора подписан именем, а не словом «спонсор»'],

  ['js/admin/sections/live.js',
   '                sponsor_name: (document.getElementById(\'liveSponsorName2\') || {}).value || null,\n',
   '',
   'в админке есть поле имени спонсора и оно сохраняется'],

  /* Откат переписан ВТОРОЙ РАЗ, 25.09: блок снова стал строкой — метка ушла
     в саму запись розыгрыша, и убирать её отдельно больше нечего. Правило
     держится за ОТНОШЕНИЕ (снятие только под проверкой отпечатка), поэтому
     оно устояло; переехал только якорь отката. Это и есть цена якоря,
     который держится за форму записи, а не за её смысл. */
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
   /href="\.\.\/css\/live-match\.css\?v=\d+"/,
   'href="../css/live-match.css"',
   'стиль страницы подключён с версией · ru'],

  ['js/live-match.js',
   "isKg ? 'Мелдеш' : 'Турнир'",
   "isKg ? 'Турнир' : 'Турнир'",
   'кыргызские подписи переведены, а не повторяют русские'],

  ['css/live-match.css',
   '.lm-sponsor {\n    display: flex; align-items: center; gap: var(--space-3);',
   '.lm-sponsor {\n    color: var(--accent);\n    display: flex; align-items: center; gap: var(--space-3);',
   'у блока спонсора нет лайма'],

  /* ── УЗКИЕ ВИДЫ, 25.09 ──────────────────────────────────────────────── */

  ['css/live-match.css',
   '    height: calc(100dvh - var(--header-h));\n    display: flex;',
   '    display: flex;',
   'страница живёт в экране НА ВСЕХ ВИДАХ, а не только выше 992'],

  ['css/live-match.css',
   'calc(100dvh - var(--header-h))',
   'calc(100vh - var(--header-h))',
   'высота экрана считается в dvh, а не в vh'],

  ['css/live-match.css',
   '@media (min-width: 993px) {',
   '@media (min-width: 993px) {\n    .lm-container { height: calc(100dvh - var(--header-h)); }',
   'высота экрана задана ОДИН раз и не повторяется в медиа'],

  ['css/live-match.css',
   '    grid-template-rows: minmax(0, 1fr);\n}',
   '}',
   'сетка забирает остаток экрана и разрешает ряду сжиматься'],

  ['css/live-match.css',
   '\n/* ── ТЕЛЕФОН СТОЯ',
   '\n@media (max-width: 992px) { .lm-grid { grid-template-columns: 1fr; } }\n/* ── ТЕЛЕФОН СТОЯ',
   'одна колонка только до 640, а не до 992'],

  ['css/live-match.css',
   ' and (orientation: portrait) {',
   ' {',
   'планшет стоя делится ПОВОРОТОМ, а не третьей шириной'],

  ['css/live-match.css',
   '.lm-feed { order: 2;',
   '.lm-feed { order: 9;',
   'на телефоне порядок: журнал, счёт, сведения, спонсоры'],

  ['js/live-match.js',
   "document.body.classList.toggle('lm-video-idet', естьВидео);",
   "document.body.classList.toggle('lm-video-idet', естьВидео);\n        document.body.classList.toggle('lm-video-idet', !!ytId);",
   'признак «идёт трансляция» один на весь продукт'],

  ['js/live-match.js',
   'scorePanelHtml + infoHtml',
   'scorePanelHtml',
   'сведения стоят ПОСЛЕ табло, а не внутри него'],

  ['css/live-match.css',
   '    border-top: 0;\n    background: transparent;',
   '    border-top: 1px solid var(--border-subtle);',
   'у сведений нет ни рамки, ни подложки'],

  ['css/live-match.css',
   '    --lm-game-h: 128px;',
   '    --lm-game-h: 128px;\n    --lm-game-h: 128px;',
   'ступени журнала заведены в компоненте и ровно один раз'],

  ['css/live-match.css',
   '    .lm-video-idet .lm-feed { min-height: var(--lm-feed-min-video); }',
   '    .lm-video-idet .lm-feed { min-height: 167px; }',
   'пол журнала при трансляции считается из ступеней, а не числом'],

  ['css/live-match.css',
   'min-height: var(--lm-game-h);',
   'min-height: 112px;',
   'СТОРОЖ: пол высоты задаётся ступенью, а не числом'],

  ['css/live-match.css',
   '    body > footer, .site-footer { display: none; }\n',
   '',
   'на телефоне боком уходит и шапка, и подвал'],

  ['css/live-match.css',
   '.lm-grid { gap: var(--space-4); grid-template-columns: 2fr 1fr; }',
   '.lm-grid { gap: var(--space-4); grid-template-columns: 1fr 1fr; }',
   'на телефоне боком журнал шире счёта той же пропорцией 2 : 1'],

  ['css/live-match.css',
   '.lm-right .lm-sponsors { flex: 1 1 0;',
   '.lm-right .lm-sponsors { flex: 0 0 auto;',
   'на телефоне боком спонсоры строго НИЖЕ счёта, и это отношение'],

  ['css/live-match.css',
   '    .lm-video-idet .lm-right,\n',
   '',
   'при полноэкранном кадре пустая правая колонка прячется ЦЕЛИКОМ'],

  ['css/live-match.css',
   '        grid-row: 2 / 3;',
   '        grid-row: 2;',
   'журнал в клетке с кадром ограничен ОБЕИМИ границами'],

  ['css/live-match.css',
   '        width: 100%;\n        max-width: 100%;\n        height: auto;\n        flex: 0 0 auto;',
   '        width: auto;\n        max-width: 100%;\n        height: auto;\n        flex: 0 0 auto;',
   'кадр выше 992 идёт во всю ширину колонки — вровень с полосой'],

  ['css/live-match.css',
   '.lm-video-idet .lm-live-badge-wrap { display: none; }',
   '.lm-video-idet .lm-live-badge-wrap { display: none; }\n.lm-live-badge-wrap { display: none; }',
   'бейдж статуса прячется ТОЛЬКО при идущей трансляции'],

  ['css/live-match.css',
   '.lm-back-link { min-height: var(--btn-h-md); position: absolute; opacity: .9; }',
   '.lm-back-link { min-height: var(--btn-h-sm); position: absolute; opacity: .9; }',
   'цель нажатия «назад» — 44 на ВСЕХ видах, поворот её не отменяет'],

  ['css/live-match.css',
   '{ width: 120px; margin: 0 var(--space-3); gap: 0; }\n    .lm-sponsors .carousel-slide-infinite img { height: 56px; padding: 6px; }',
   '{ width: 100px; margin: 0 var(--space-3); gap: 0; }\n    .lm-sponsors .carousel-slide-infinite img { height: 56px; padding: 6px; }',
   'СТОРОЖ: полоса спонсоров на узких видах совпадает с is-strip'],

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
  /* ЯКОРЬ МОЖЕТ БЫТЬ ВЫРАЖЕНИЕМ, А НЕ ТОЛЬКО СТРОКОЙ.
     Три раза подряд откат ломался об одно и то же: он держался за НОМЕР
     версии файла, а номер меняется при каждой правке — это не «содержимое
     блока», это как раз то, что уезжает. Теперь версия ловится выражением,
     и поднятие номера её не рвёт. */
  const строковый = typeof было === 'string';
  const n = строковый
    ? ориг.split(было).length - 1
    : (ориг.match(new RegExp(было.source, было.flags.replace('g','') + 'g')) || []).length;
  if (n !== 1) {
    console.log('  ✗ откат ' + (i + 1) + ' (' + ф + '): якорь встречается ' + n + ' раз');
    console.log('    ' + String(строковый ? было : было.source).replace(/\n/g, ' ⏎ ').slice(0, 90));
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

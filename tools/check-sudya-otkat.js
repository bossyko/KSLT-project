/**
 * ПРУВЕР ЗАМОРОЗКИ СУДЕЙСКОГО ЭКРАНА.
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 * «У меня зелёное» ничего не доказывает.
 *
 * Переписан 25.09 вместе с правилами: прежние откаты возвращали код,
 * которого больше нет.
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

const CSS = 'css/umpire.css', JSФ = 'js/umpire.js', HTML = 'pages/umpire.html';
const SQLМ = 'sql/схема/live-match-point-mark.sql', SQLП = 'sql/схема/live-pereryvy.sql';
const СЛОВ = 'js/live-texts.js', СТР = 'js/live-match.js';

const ОТКАТЫ = [
  [CSS, `--um-bg:     var(--bg-base);`,
   `--um-bg: #0a0a0a;`,
   'свои имена красок ведут к токенам, а не к своим числам'],

  [CSS, `    --um-p1: var(--player-1);`,
   `    --um-p1: #4FC3F7;`,
   'своих красок числом не осталось вовсе'],

  [CSS, `    --um-p2: var(--player-2);`,
   `    --um-p2: var(--um-accent);`,
   'краски игроков берутся из общих токенов'],

  [CSS, `.um-marks { display: flex; gap: var(--space-3); }`,
   `.um-marks { display: flex; gap: var(--space-3); background: rgba(0,0,0,0.5); }`,
   'в файле не осталось ни одной rgba'],

  [CSS, `.um-btn-p1 { background: var(--um-p1); }`,
   `.um-btn-p1 { background: linear-gradient(135deg, var(--um-p1), var(--um-accent)); }`,
   'градиентов у кнопок очка нет'],

  [CSS, `    line-height: 1.3;
    color: var(--accent-on);`,
   `    line-height: 1.3;
    color: var(--text-primary);`,
   'текст на кнопке очка почти-чёрный, а не белый'],

  [CSS, `    line-height: 1.2;
    overflow-wrap: anywhere;`,
   `    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;`,
   'имя игрока НИКОГДА не обрезается'],

  [CSS, `    --um-target: 38dvh;`,
   `    --um-target: 321px;`,
   'мишень — ДОЛЯ ЭКРАНА, а не число'],

  [CSS, `.um-btn-p1, .um-btn-p2 {
    flex: 1;
    font-size: var(--fs-lg);`,
   `.um-btn-p1, .um-btn-p2 {
    flex: 1;
    min-height: 140px;
    font-size: var(--fs-lg);`,
   'у кнопки очка нет собственной высоты числом'],

  [CSS, `    gap: var(--space-3);
    margin-top: auto;
}`,
   `    gap: var(--space-3);
}`,
   'воздух собирается НАД мишенью, а нижний ряд к ней прижат'],

  [CSS, `        --um-target: 34dvh;`,
   `        --um-target: 44dvh;`,
   'на планшете мишень строго НИЖЕ, чем на телефоне'],

  [JSФ, `setsHtml && !идётПерерыв`,
   `setsHtml`,
   'в перерыве чипы сетов уходят, а мишень не мельчает'],

  [CSS, `@media (min-width: 641px) {`,
   `@media (min-width: 700px) {`,
   'в медиа ровно одна ширина, и это 641'],

  [CSS, `@media (orientation: landscape) and (max-height: 500px) {`,
   `@media (max-height: 500px) {`,
   'тесная высота делится поворотом, а не ещё одной шириной'],

  [CSS, `    #um-app { display: none; }`,
   `    #um-app { display: flex; }`,
   'ТЕЛЕФОН БОКОМ — ОДНА РАСКЛАДКА: экран прячется, встаёт «поверните»'],

  [HTML, `<p>Поверните телефон</p>`,
   `<p></p>`,
   'экран «поверните телефон» есть в разметке, а не только в стиле'],

  [CSS, `.um-turn { display: none; }`,
   `.um-turn { display: flex; }`,
   'по умолчанию «поверните» спрятан'],

  [CSS, `    .um-player-row { grid-template-columns: 28px 1fr 52px 52px; }`,
   `    .um-player-row { grid-template-columns: 28px 1fr 52px 52px; }
    .um-player-name { font-size: var(--fs-base); }`,
   'КЕГЛЬ НЕ МЕНЯЕТСЯ ОТ ПОВОРОТА'],

  [CSS, `    font-size: var(--fs-xl);
    font-weight: 800;`,
   `    font-size: 26px;
    font-weight: 800;`,
   'ни одного кегля числом — все со ступени шкалы'],

  [JSФ, `'<b>Эйс</b><span>очко · '`,
   `'<b>Эйс 🎾</b><span>очко · '`,
   'в судейском модуле не осталось ни одного эмодзи'],

  [CSS, `    border-radius: var(--radius-full);
    background: var(--um-accent);`,
   `    border-radius: 50%;
    background: var(--um-accent);`,
   'значок подачи рисуется стилем, а не буквой'],

  [JSФ, `<div class="um-match-players">`,
   `<div class="um-match-title">`,
   'судья видит, какой матч ведёт'],

  [JSФ, `handleScore(state.serving_player, 'ace');`,
   `handleScore(1, 'ace');`,
   'ЭЙС — ОЧКО ПОДАЮЩЕМУ'],

  [JSФ, `handleScore(state.serving_player === 1 ? 2 : 1, 'double');`,
   `handleScore(state.serving_player, 'double');`,
   'ДВОЙНАЯ — ОЧКО ПРИНИМАЮЩЕМУ'],

  [JSФ, `mark: метка || null`,
   `mark: null`,
   'метка едет ВНУТРИ записи розыгрыша, а не отдельным вызовом'],

  [JSФ, `    var выборПричины = false;`,
   `    var выборПричины = false;
    var markSeq = null;`,
   'СТОРОЖ: окна метки на таймере больше нет'],

  [SQLМ, `DROP FUNCTION IF EXISTS public.umpire_mark_point(text, integer, text);`,
   `-- DROP убран`,
   'отдельной функции метки нет и в базе'],

  [SQLМ, `v_mark NOT IN ('ace', 'double')`,
   `v_mark NOT IN ('ace')`,
   'запись розыгрыша принимает метку и проверяет её'],

  [JSФ, `(!isCompleted && !isWarmup && !идётПерерыв`,
   `(!isCompleted && !isWarmup && Date.now() < 0`,
   'кнопки метки стоят постоянно, а не выскакивают после очка'],

  [JSФ, `подающий   = state.serving_player === 2 ? p2Name : p1Name;`,
   `подающий   = p1Name;`,
   'под меткой стоит имя того, кому идёт очко'],

  [JSФ, `'<button class="um-btn um-btn-mark' + кП + '" id="umAce">' +
                            '<b>Эйс</b><span>очко · ' + esc(подающий) + '</span></button>' +
                        '<button class="um-btn um-btn-mark' + кПр + '" id="umDouble">' +
                            '<b>Двойная</b><span>очко · ' + esc(принимающий) + '</span></button>'`,
   `'<button class="um-btn um-btn-mark' + кПр + '" id="umDouble">' +
                            '<b>Двойная</b><span>очко · ' + esc(принимающий) + '</span></button>' +
                        '<button class="um-btn um-btn-mark' + кП + '" id="umAce">' +
                            '<b>Эйс</b><span>очко · ' + esc(подающий) + '</span></button>'`,
   'ПОЛОЖЕНИЕ кнопок метки от подачи НЕ зависит'],

  [JSФ, `'<b>Двойная</b><span>очко · '`,
   `'<b>Виннер</b><span>очко · '`,
   'спрашиваем только то, что судья объявляет вслух'],

  [JSФ, `{ код: 'other',   имя: 'Другое' }`,
   `{ код: 'other',   имя: 'Обычный розыгрыш' }`,
   'кнопки «обычный розыгрыш» нет'],

  [JSФ, `    var serveChosen = false;`,
   `    var serveChosen = false;
    var challenge = null;`,
   'судейский экран не растёт в сторону тура'],

  [JSФ, `var CHANGEOVER_GAME = 120;`,
   `var CHANGEOVER_GAME = 200;`,
   'СМЕНА СТОРОН СТРОГО КОРОЧЕ ПЕРЕРЫВА МЕЖДУ СЕТАМИ'],

  [JSФ, `var CHANGEOVER_SET = 180;`,
   `var CHANGEOVER_SET = 300;`,
   'перерывы не длиннее двойного правила ITF'],

  [JSФ, `        state.break_until = new Date(changeoverEndTime).toISOString();`,
   ``,
   'перерыв по счёту едет в базу'],

  [JSФ, `            state.break_kind = null;`,
   `            ;`,
   'перерыв, который кончился, убирается из базы'],

  [JSФ, `            pause_reason: state.pause_reason || null,`,
   `            pause_reason: ИМЯ_ПРИЧИНЫ[state.pause_reason] || null,`,
   'ПРИЧИНА ПАУЗЫ ХРАНИТСЯ КОДОМ, А НЕ СЛОВОМ'],

  [SQLП, `CHECK (pause_reason IN ('medical', 'toilet', 'weather', 'other'))`,
   `CHECK (pause_reason IN ('medical', 'toilet', 'weather', 'other', 'tech'))`,
   'СТОРОЖ: причины в модуле и в базе — один список'],

  [JSФ, `        { код: 'weather', имя: 'Погода' },`,
   `        { код: 'weather', имя: 'Погода' },
        { код: 'tech',    имя: 'Технический' },`,
   'пятой причины нет'],

  [JSФ, `        if (state.status === 'paused') { state.status = 'live'; state.pause_reason = null; }`,
   ``,
   'ОЧКО СНИМАЕТ И ПЕРЕРЫВ, И ПАУЗУ — одним правилом'],

  [SQLП, `        pause_reason = CASE WHEN COALESCE(p_state->>'status', status) = 'paused'
                            THEN NULLIF(p_state->>'pause_reason', '') END,`,
   `        pause_reason = COALESCE(NULLIF(p_state->>'pause_reason', ''), pause_reason),`,
   'причина не переживает снятие паузы'],

  [SQLП, `    ADD COLUMN IF NOT EXISTS break_until timestamptz;`,
   `    ADD COLUMN IF NOT EXISTS break_seconds integer;`,
   'перерыв хранит МОМЕНТ ОКОНЧАНИЯ, а не длительность'],

  [СЛОВ, `toilet:  { ru: 'Туалет',      en: 'Toilet break', kg: 'Даараткана' },`,
   `toilet:  { ru: 'Туалет',      en: 'Toilet break' },`,
   'в словаре есть все три языка у каждого кода'],

  [СТР, `        loading:   isEn ? 'Loading...'      : isKg ? 'Жүктөлүүдө...'   : 'Загрузка...',`,
   `        loading:   isEn ? 'Loading...'      : isKg ? 'Жүктөлүүдө...'   : 'Загрузка...',
        paused2:   isEn ? 'PAUSED' : isKg ? 'ТЫНЫМ' : 'ПАУЗА',`,
   'СТОРОЖ: подписи статусов живут ТОЛЬКО в словаре'],

  [СТР, `: isPaused ? Т.пауза(m.pause_reason)`,
   `: isPaused ? 'ПАУЗА'`,
   'страница матча берёт перерыв и причину из словаря'],

  [СТР, `                      : идётПерерыв ? Т.слово(m.break_kind || 'changeover')`,
   `                      : идётПерерыв ? Т.слово(m.break_kind || 'changeover') + ' · ' + Т.часы(остатокПерерыва)`,
   'зрителю не показываем отсчёт, которого не можем обновить'],

  [CSS, `    outline: 3px solid var(--um-accent);`,
   `    outline: none;`,
   'у кнопок есть кольцо фокуса'],

  [CSS, `    .um-status-live { animation: none; }`,
   ``,
   'движение выключается по просьбе системы'],

  [JSФ, `um-scoreboard" role="group" aria-live="polite"`,
   `um-scoreboard"`,
   'табло — живая область: диктор читает изменившийся счёт'],

  [JSФ, `(state.serving_player === 1 ? ' aria-label="подаёт"' : '')`,
   `''`,
   'значок подачи называет себя диктору в ОБЕИХ строках'],

  [HTML, `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`,
   `content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover"`,
   'ЗУМ СТРАНИЦЕ ВЕРНУЛИ'],

  [CSS, `    touch-action: manipulation;`,
   ``,
   'двойной тап забран у кнопок, а не у страницы'],

  [JSФ, `navigator.wakeLock.request('screen')`,
   `navigator.wakeLockOld.request('screen')`,
   'экран держится незаснувшим, пока идёт матч'],

  [JSФ, `document.addEventListener('visibilitychange'`,
   `document.addEventListener('focus'`,
   'блокировка возвращается, когда судья вернулся во вкладку'],

  [HTML, /href="\.\.\/css\/umpire\.css\?v=\d+"/,
   `href="../css/umpire.css"`,
   'у стиля и скрипта судьи есть версия, и она не первая'],
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

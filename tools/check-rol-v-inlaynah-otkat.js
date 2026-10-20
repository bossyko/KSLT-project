/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА РОЛИ В ИНЛАЙНАХ. На КОПИИ.
 *
 * Откаты возвращают ВСЕ ПЯТЬ красных, какие жили в продукте до 19.10,
 * зелёный iOS и число вместо `--accent-on`.
 *
 *   node tools/check-rol-v-inlaynah-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-rol-'));
['js', 'tools', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js'), path.join(песок, 'mobile/www/js'),
          { recursive: true });

const ФАЙЛЫ = ['js/auth.js', 'js/dashboard.js', 'js/doubles-entry.js',
                'js/tournament-register.js', 'js/players.js',
                'js/admin/sections/users.js', 'css/tokens.css',
                'mobile/www/js/screens/partners.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-rol-v-inlaynah.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const АУ = 'js/auth.js', КБ = 'js/dashboard.js', ПЗ = 'js/doubles-entry.js',
      РГ = 'js/tournament-register.js', ИГ = 'js/players.js',
      ПЛ = 'js/admin/sections/users.js', ТК = 'css/tokens.css',
      МБ = 'mobile/www/js/screens/partners.js';

const ОТКАТЫ = [
    /* пять красных, каждый своим местом */
    ['вернуть #ff4444 границе поля в форме входа', АУ,
     "el.style.borderColor = bad ? 'var(--danger)' : '';",
     "el.style.borderColor = bad ? '#ff4444' : '';",
     'на сайте роль в инлайнах js не пишется числом'],

    ['вернуть #ff4444 границе поля в кабинете', КБ,
     "el.style.borderColor = bad ? 'var(--danger)' : '';",
     "el.style.borderColor = bad ? '#ff4444' : '';",
     'на сайте роль в инлайнах js не пишется числом'],

    ['вернуть #f44336 Material неверному вводу', ПЗ,
     "'.de-bad-note{margin:6px 0 0;font-size:.78rem;color:var(--danger)}'",
     "'.de-bad-note{margin:6px 0 0;font-size:.78rem;color:#f44336}'",
     'на сайте роль в инлайнах js не пишется числом'],

    /* тот, что давал контраст 3.55 при пороге 4.5 */
    ['вернуть белый на красном кнопке ошибки — контраст 3.55', РГ,
     "'.trn-register-modal-btn.is-error{background:var(--danger);color:var(--danger-on)}' +",
     "'.trn-register-modal-btn.is-error{background:#ff3b30;color:#fff}' +",
     'на сайте роль в инлайнах js не пишется числом'],

    /* ЯКОРЬ СУЖЕН СОСЕДНЕЙ СТРОКОЙ: бейдж «Заблок.» стоит в `players.js`
       ДВАЖДЫ одинаково — это часть самой находки. Берём тот, что идёт за
       строкой со значками игрока: она есть только у второго. */
    ['вернуть #ff3b30 бейджу «Заблок.»', ИГ,
     "'<span class=\"pl-player-badges\">' + badgesHtml + '</span>' : '') +\n                            (p.banned_until && new Date(p.banned_until) > new Date() ? '<span style=\"display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;background:var(--danger-subtle);color:var(--danger);",
     "'<span class=\"pl-player-badges\">' + badgesHtml + '</span>' : '') +\n                            (p.banned_until && new Date(p.banned_until) > new Date() ? '<span style=\"display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;",
     'на сайте роль в инлайнах js не пишется числом'],

    ['вернуть зелёный iOS статусу блокировки', ПЛ,
     "var statusColor = isBlocked ? 'var(--danger)' : 'var(--success)';",
     "var statusColor = isBlocked ? '#ff3b30' : '#34c759';",
     'на сайте роль в инлайнах js не пишется числом'],

    ['вернуть #34c759 статусу «одобрена»', ПЛ,
     "approved: { текст: L.linkStApproved, цвет: 'var(--success)' },",
     "approved: { текст: L.linkStApproved, цвет: '#34c759' },",
     'на сайте роль в инлайнах js не пишется числом'],

    /* текст на акценте */
    ['вернуть #000 тексту на акценте', ПЗ,
     "'.de-send{background:var(--accent);color:var(--accent-on)}',",
     "'.de-send{background:var(--accent);color:#000}',",
     'текст поверх акцента берёт --accent-on, а не число'],

    /* роли должны быть объявлены */
    ['убрать --danger-on из токенов', ТК,
     "  --danger-on:      var(--neutral-950);",
     "  --danger-onet:    var(--neutral-950);",
     'роли и их пары объявлены в токенах'],

    /* ХРАПОВИК ПРИЛОЖЕНИЯ: РОСТ РОНЯЕТ. Первая редакция этого отката
       ПОДМЕНЯЛА краску в существующем месте — и число не росло, а падало:
       строка уходила из «текста на акценте», а слова роли в ней нет, так
       что она не попадала никуда. Упал храповик с другой стороны («потолок
       завышен»), и это было верно, но доказывало не то правило.
       ОТКАТ ОБЯЗАН ДОБАВИТЬ МЕСТО, а не переложить его. */
    ['добавить приложению ещё одну краску роли', МБ,
     "'<div style=\"display:inline-block;background:var(--accent);color:#0A0A0A;",
     "'<div data-status=\"bad\" style=\"color:#ff3b30\"></div>' +\n        '<div style=\"display:inline-block;background:var(--accent);color:#0A0A0A;",
     'в приложении краски роли числом не прибавилось']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правило падает на ЧИСТОМ коде — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const n = исходник[ф].split(что).length - 1;
    if (n !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз в ' + ф);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}

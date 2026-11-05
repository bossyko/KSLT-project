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

const ФАЙЛЫ = ['js/auth.js', 'js/dashboard.js', 'js/auth-guard.js',
                'js/doubles-entry.js',
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

const АУ = 'js/auth.js', КБ = 'js/dashboard.js', ОХ = 'js/auth-guard.js',
      ПЗ = 'js/doubles-entry.js',
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

    /* ДВА ОТКАТА СНЯТЫ 29.10, И ВОТ ПОЧЕМУ. Они держались на строках
       инлайнового css ВНУТРИ js — `.de-bad-note{…}` в
       `js/doubles-entry.js` и `.trn-register-modal-btn.is-error{…}` в
       `js/tournament-register.js`. Обеих строк в js больше нет: стили
       переехали в `css/style.css` (например `:11972` для `is-error`), и
       якорь стал встречаться НОЛЬ раз. Это не починка правила и не
       ослабление: ПРАВИЛО «на сайте роль в инлайнах js не пишется
       числом» доказывают ПЯТЬ других откатов ниже, живых. Держать
       мёртвый якорь — значит каждый прогон получать «?» вместо ответа,
       а «?» ничего не доказывает. */

    /* тот, что давал контраст 3.55 при пороге 4.5 */


    /* ЯКОРЬ ПЕРЕПИСАН 05.11 — И ЭТО ОТСТАВАНИЕ ПРУВЕРА, А НЕ КОДА.
       Прежний держался за инлайновый стиль бейджа «Заблок.», который
       стоял в `players.js` ДВАЖДЫ одинаково, и сужался соседней строкой
       со значками игрока. 04.11 обе копии сведены в `меткаЗакрыт`, а
       стиль уехал в класс `.pl-zakryt` — якоря не стало, и прувер
       молчал про своё же правило.
       Теперь порча бьёт по тому, что живёт: возвращает цвет ЧИСЛОМ в
       инлайн ровно туда, где теперь класс. */
    /* ПОРЧА НЕСЁТ ИМЯ РОЛИ В ТОЙ ЖЕ СТРОКЕ, ЧТО И КРАСКУ, и это не
       украшение отката. Прибор ловит не «любое число», а число ИМЕННО В
       РОЛИ: краска и слово состояния должны стоять в одной строке
       (`check-rol-v-inlaynah.js:76`). Первая редакция этого отката
       красила метку голым `#ff3b30` без слова роли рядом — правило
       честно молчало, и прувер показал, что доказывал он не то.
       Прежний код имя роли в строке имел: условие читало `banned_until`
       прямо перед стилем. */
    ['вернуть цвет числом метке «Заблок.»', ИГ,
     "        return '<span class=\"pl-zakryt\">' + слово + '</span>';",
     "        return '<span class=\"pl-zakryt\" data-banned=\"1\" style=\"background:rgba(255,59,48,0.15);color:#ff3b30\">' + слово + '</span>';",
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
    /* ПОНЯТИЕ ПЕРЕЕХАЛО — ОТКАТ ПЕРЕЕХАЛ ЗА НИМ. Якорь стоял на
       `.de-send{…}` в `js/doubles-entry.js`; эта строка css ушла из js.
       Правило «текст поверх акцента берёт --accent-on» держит ОДИН
       откат, и снять его нельзя — без него правило не доказано ничем.
       Взято живое место, прочитанное по строке:
       `js/auth-guard.js:73` — единственное вхождение в файле. */
    ['вернуть #000 тексту на акценте', ОХ,
     'background:var(--accent);color:var(--accent-on)',
     'background:var(--accent);color:#000',
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

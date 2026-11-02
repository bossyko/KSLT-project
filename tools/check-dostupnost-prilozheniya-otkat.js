#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ДОСТУПНОСТИ ПРИЛОЖЕНИЯ (кусок 215). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-dostup-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'tools/check-dostupnost-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-dostupnost-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз в ' + отн;
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}
function вернуть(отн) { fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн)); }

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const H = 'mobile/www/index.html';
const A = 'mobile/www/js/app.js';
const I = 'mobile/www/js/i18n.js';
const L = 'mobile/www/js/screens/live.js';
const T = 'mobile/www/js/screens/tournaments.js';
const C = 'mobile/www/js/screens/courts.js';
const P = 'mobile/www/js/screens/partners.js';
const R = 'mobile/www/js/screens/rating.js';

/* Якоря держатся на содержимом блока, а не на его месте и не на соседе:
   имя класса, имя ключа, имя столбца — то, что живёт в блоке постоянно. */
const ОТКАТЫ = [
    ['шапка перестала быть областью', H,
     '<header class="header" role="banner">',
     '<header class="header">',
     'шапка — область `banner`'],

    ['экраны снова в безымянном `div`', H,
     '<main class="screens" id="appMain">',
     '<div class="screens" id="appMain">',
     'экраны лежат в `main`'],

    ['имя полосы вкладок снова зашито', H,
     '<nav class="tab-bar" role="navigation" data-i18n-aria="menu.sections" aria-label="Разделы">',
     '<nav class="tab-bar" role="navigation" aria-label="Разделы">',
     'полоса вкладок — область `navigation` с переводимым именем'],

    ['активная вкладка снова только цветом', H,
     '<button class="tab-item active" data-screen="screenHome" aria-current="page">',
     '<button class="tab-item active" data-screen="screenHome">',
     'активная вкладка помечена `aria-current` в разметке'],

    ['признак вкладки уехал от класса', A,
     "      t.removeAttribute('aria-current');\n",
     '',
     '`aria-current` ставится и снимается там же, где класс вкладки'],

    ['ряд фильтров перестал быть группой', H,
     '<div class="filters-row" id="newsChips" role="group" data-i18n-aria="a11y.fSection" aria-label="Раздел новостей">',
     '<div class="filters-row" id="newsChips">',
     'каждый ряд фильтров — группа'],

    /* ЯКОРЬ ПЕРЕЕХАЛ 02.11: ряда `courtTypeChips` больше нет — три ряда
       чипов кортов стали тремя выпадашками в одной полосе. Берём ряд,
       который никуда не денется. */
    ['имя ряда фильтров снова зашито', H,
     'id="newsChips" role="group" data-i18n-aria="a11y.fSection"',
     'id="newsChips" role="group"',
     'имя каждого ряда берётся из словаря'],

    ['кнопка фильтра перестала говорить о нажатости', H,
     '<button class="filter-chip" data-tag="club" aria-pressed="false" data-i18n="news.club">КСЛТ</button>',
     '<button class="filter-chip" data-tag="club" data-i18n="news.club">КСЛТ</button>',
     'каждая кнопка фильтра в разметке говорит, нажата ли она'],

    ['нажатость уехала от класса кнопки', A,
     "        c.setAttribute('aria-pressed', 'false');",
     '',
     'нажатость переставляется там же, где класс кнопки'],

    /* ПРАВИЛО ПЕРЕЕХАЛО ВМЕСТЕ С ОРГАНОМ 02.11. Кнопок-чипов у кортов
       больше нет, нажатости у пункта списка не бывает — у него
       `aria-selected`, и стережёт его `check-vypadashka.js`. Здесь
       проверяется, что корты действительно ушли на дом: вернутся свои
       чипы — вернётся и беда без признака. */
    ['корты снова рисуют свои чипы вместо дома', C,
     'KSLT_VYPADASHKA.разметка({ вид: \'type\'',
     'var чип = \'<button class="filter-chip"></button>\'; KSLT_NET.разметка({ вид: \'type\'',
     'фильтры кортов рисует дом выпадашки, а не свои чипы'],

    ['контейнер списка турниров лишился имени', T,
     "    el.setAttribute('aria-label', I18N.t('tournaments.title'));",
     '',
     'контейнер списка назван: турниры'],

    ['карточка Live перестала быть пунктом', L,
     " role=\"listitem\" tabindex=\"0\" aria-label=\"' + esc(p1Name + ' — ' + p2Name) + '\">' +",
     "'>' +",
     'карточка — пункт списка: Live'],

    ['сетка спонсоров лишилась списка', P,
     'class="sponsors-grid" role="list" aria-label="',
     'class="sponsors-grid" aria-label="',
     'сетка спонсоров — тоже названный список'],

    ['окно гостя на кортах снова чужое в списке', C,
     'class="rr-guest-overlay" role="listitem"',
     'class="rr-guest-overlay"',
     'окно гостя — пункт списка: courts'],

    ['окно гостя рейтинга уехало внутрь таблицы', R,
     "    html += '</div>';\n\n    if (!isGuest && displayPlayers.length > visibleCount) {",
     "    if (!isGuest && displayPlayers.length > visibleCount) {",
     'окно гостя рейтинга лежит ВНЕ таблицы'],

    ['Live снова сортируется по несуществующему столбцу', L,
     "      .order('created_at', { ascending: false })",
     "      .order('updated_at', { ascending: false })",
     'Live не сортируется по `updated_at`'],

    ['ошибка запроса Live снова проглатывается', L,
     "        if (r.error) {",
     "        if (false) {",
     'ошибка запроса Live не проглатывается'],

    ['имя группы осталось в одном языке', I,
     "    'a11y.fGender':    { ru: 'Пол',                en: 'Gender',            kg: 'Жынысы' },",
     "    'a11y.fGender':    { ru: 'Пол' },",
     'ключ заведён на трёх языках: a11y.fGender'],

    ['подпись для диктора перестала переводиться', I,
     "      ariaEls[a].setAttribute('aria-label', I18N.t(ariaEls[a].getAttribute('data-i18n-aria')));",
     '',
     'подпись для диктора переводится вместе с текстом'],

    ['версия правленого файла не поднята', H,
     'js/screens/news.js?v=2',
     'js/screens/news.js?v=1',
     'версии правленых файлов подняты']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    const стр = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(стр + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0) {
        console.log(стр + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(стр + '\n      ✗ ждали падения «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 3)
            .map(с => '        ' + с.trim()).join('\n'));
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не уронило своё правило: ' + плохо + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили ИМЕННО своё правило\n');
}

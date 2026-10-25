/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КУСКА 163. На КОПИИ.
 *   node tools/check-otschet-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-otschet-'));
['js', 'tools', 'css', 'pages', 'partials', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.readdirSync(КОРЕНЬ).forEach(и => {
    if (и.endsWith('.html')) fs.copyFileSync(path.join(КОРЕНЬ, и), path.join(песок, и));
});
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ФАЙЛЫ = ['js/tournament-featured.js', 'js/tournament-card.js',
               'js/battles-overview.js', 'js/tournament-blocks.js',
               'js/tournaments-overview.js', 'index.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-otschet.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* Вернуть карточке её собственное тело разметки — то, что было до куска */
    ['вернуть карточке своё тело разметки отсчёта', 'js/tournament-card.js',
     "    function countdown(t) {\n        if (!t.date_start) return '';",
     "    function countdownText(diff) {\n        var d = Math.floor(diff / 86400000);\n        var h = Math.floor((diff % 86400000) / 3600000);\n        return '<span data-cd-date=\"x\">' + d + h + '</span>';\n    }\n    function countdown(t) {\n        if (!t.date_start) return '';",
     'разметка отсчёта существует ОДНИМ телом, и оно в доме'],

    ['вернуть карточке свой тикер', 'js/tournament-card.js',
     "    function startTicker() { window.KSLT_TFEATURED.пустить(); }",
     "    var _ticker = null;\n    function startTicker() {\n        _ticker = setInterval(function () {\n            document.querySelectorAll('.tc-countdown[data-cd]').forEach(function (el) { el.remove(); });\n        }, 1000);\n    }",
     'тикер отсчёта существует ОДИН, и он в доме'],

    ['разобрать таблицу семей', 'js/tournament-featured.js',
     "    var СЕМЬИ = {",
     "    var СЕМЕЙСТВА = {",
     'семьи отсчёта перечислены одной таблицей'],

    /* СЕМЬЯ ДОЛЖНА БЫТЬ В РАЗМЕТКЕ: без неё тикер угадывает, и `bo`/`tc`
       на первом же тике становятся турнирными. */
    ['перестать писать семью в разметку', 'js/tournament-featured.js',
     "data-cd-semya=\"' + имяСемьи + '\"",
     "data-cd-net=\"' + имяСемьи + '\"",
     'семья пишется В РАЗМЕТКУ, а не угадывается тикером'],

    /* ЯКОРЬ НА ТАБЛИЦЕ, А НЕ НА ОДНОМ ЗОВЕ: первая моя попытка меняла только
       строку тикера, а правило смотрит и таблицу, и зов — и не падало.
       ОТКАТ ОБЯЗАН УБРАТЬ ТО, НА ЧЁМ ПРАВИЛО ДЕРЖИТСЯ. Якорь взят с соседями
       по семье, чтобы встречался один раз: `снять` в таблице стоит дважды. */
    ['отнять у семей поведение по истечении', 'js/tournament-featured.js',
     "              срочно: 'bo-cd-urgent', живой: 'bo-cd-live', точка: 'bo-cd-dot',\n              поИстечении: 'снять' },",
     "              срочно: 'bo-cd-urgent', живой: 'bo-cd-live', точка: 'bo-cd-dot' },",
     'по истечении два поведения, и оба приходят таблицей семей'],

    ['вернуть баттлам своё тело вместо зова дома', 'js/battles-overview.js',
     "        return window.KSLT_TFEATURED.отсчёт(dateStr, t, null, { семья: 'bo' });",
     "        return '';",
     'все четыре зовущих идут в дом, своего тела ни у кого нет'],

    /* ЦЕНА СВЕДЕНИЯ ПОСЧИТАНА ДО ПРАВКИ: семь тегов. Снять один — и страница,
       которая зовёт дом, его не получит. */
    ['снять тег дома с главной', 'index.html',
     '<script src="js/tournament-featured.js?v=12"></script>\n',
     '',
     'дом отсчёта подключён на всех страницах, где его зовут'],

    /* ЯКОРЬ НА СОДЕРЖИМОМ СЛОВАРЯ: возвращаем карточке её пятый ключ — тот
       самый, из-за которого кыргызская приставка расходилась. */
    ['вернуть карточке свои слова отсчёта', 'js/tournament-card.js',
     "        participants: 'участников'",
     "        participants: 'участников', cdPrefix: 'Старт через'",
     'словарь отсчёта один, своих слов ни у кого нет'],

    ['вернуть карточке единицы на `<b>`', 'js/tournament-featured.js',
     "            return '<span class=\"' + к.единица + '\">' + значение + '<small>' + буква + '</small></span>';",
     "            return '<b>' + значение + '<small>' + буква + '</small></b>';",
     'единицы отсчёта свёрстаны одним узлом на все семьи']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return; }
    if (сколько !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
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

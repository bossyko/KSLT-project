/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КУСКА 155. На КОПИИ.
 *   node tools/check-sluchaynyy-poryadok-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ, а не на номерах строк.
 *
 * ПЕСОК НЕСЁТ И СТРАНИЦЫ: пять правил этого сторожа проверяют теги на
 * страницах, и на урезанном дереве они зеленели бы молча — страниц нет,
 * значит и страниц без дома нет. СТОРОЖ, СМОТРЯЩИЙ ЧАСТЬ ПРОДУКТА, НЕ
 * СТОРОЖИТ НИЧЕГО.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-poryadok-'));
['js', 'tools', 'maket', 'pages', 'partials', 'tests'].forEach(д => {
    const от = path.join(КОРЕНЬ, д);
    if (fs.existsSync(от)) fs.cpSync(от, path.join(песок, д), { recursive: true });
});
fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html')).forEach(ф =>
    fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф)));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ФАЙЛЫ = [
    'js/kslt-tasovka.js', 'js/kslt-vitrina.js', 'js/kslt-lico.js', 'js/kslt-yazyk.js',
    'js/partners.js', 'js/services.js', 'js/home-courts-coaches.js',
    'js/battles-overview.js', 'js/match-score.js', 'js/my-match-actions.js',
    'js/tournament-slots.js', 'js/admin/sections/bracket.js', 'js/tournament-detail.js',
    'js/tournament-register.js', 'index.html', 'pages/dashboard.html',
    'pages/tournament.html', 'pages/admin.html', 'pages/partners.html',
    'tests/e2e/design-system/155-sluchaynyy-poryadok.spec.js'
];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-sluchaynyy-poryadok.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть своё перемешивание в «Партнёров»', 'js/partners.js',
     "    /* «В СЕТИ» И СЛУЧАЙНЫЙ ПОРЯДОК — ДОМА (кусок 155)",
     "    function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random() * (i + 1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}\n    /* «В СЕТИ» И СЛУЧАЙНЫЙ ПОРЯДОК — ДОМА (кусок 155)",
     'перемешивание вне дома — только в загрузчике спонсоров, и это названо'],

    ['отнять у дома перемешивание', 'js/kslt-tasovka.js',
     '    Т.перемешать = function (список) {',
     '    Т.перемешатьНЕТ = function (список) {',
     'дом перемешивания объявляет оба понятия'],

    ['снять дом перемешивания с главной', 'index.html',
     'js/kslt-tasovka.js?v=1',
     'js/kslt-tasovka-НЕТ.js?v=1',
     'дом перемешивания подключён на каждой странице, где его зовут'],

    ['вернуть витрине её вписанное тело', 'js/kslt-vitrina.js',
     "        return window.KSLT_TASOVKA.продвинутыеПервыми(список, '_promoted');",
     "        var в=[],о=[];список.forEach(function(x){(x._promoted?в:о).push(x);});for(var j=о.length-1;j>0;j--){var k=Math.floor(Math.random() * (j + 1));var t=о[j];о[j]=о[k];о[k]=t;}return в.concat(о);",
     'витрина зовёт дом перемешивания, а не держит своё тело'],

    ['отнять у главной её признак продвинутости', 'js/home-courts-coaches.js',
     "продвинутыеПервыми(rows, 'partner', SLOTS)",
     "продвинутыеПервыми(rows, function (r) { return !!r.partner; }, SLOTS)",
     'три зовущих передают свой признак продвинутости доводом'],

    ['перестать перемешивать продвинутых', 'js/kslt-tasovka.js',
     '        var п1 = Т.перемешать(вперёд), п2 = Т.перемешать(прочие);',
     '        var п1 = вперёд.slice(), п2 = Т.перемешать(прочие);',
     'продвинутые перемешиваются между собой — решение названо в доме'],

    ['вернуть порог «в сети» числом в «Партнёров»', 'js/partners.js',
     "    var GUEST_VISIBLE = 8;",
     "    var ONLINE_THRESHOLD = 5 * 60 * 1000;\n    var GUEST_VISIBLE = 8;",
     'порог «в сети» объявлен только в доме лица'],

    ['отнять у дома лица «в сети»', 'js/kslt-lico.js',
     '                         имяНаЯзыке: имяНаЯзыке, вСети: вСети,',
     '                         имяНаЯзыке: имяНаЯзыке, вСетиНЕТ: вСети,',
     'дом лица отдаёт «в сети», имя на языке и сам порог'],

    /* СТРАНИЦА БЕРЁТСЯ ТА, ГДЕ ЕСТЬ ЗОВУЩИЙ. Первый откат снимал дом лица
       с `pages/dashboard.html` — и правило не падало, потому что ни один
       из шести зовущих дома лица на кабинете не подключён. Откат, который
       ничего не ломает, НИЧЕГО И НЕ ДОКАЗЫВАЕТ. */
    ['снять дом лица со страницы «Партнёров»', 'pages/partners.html',
     'js/kslt-lico.js?v=5',
     'js/kslt-lico-НЕТ.js?v=5',
     'дом лица подключён на каждой странице, где его зовут'],

    ['вернуть правило счёта в «Баттлы»', 'js/battles-overview.js',
     '        return window.KSLT_YAZYK.счёт(n, one, few, many);',
     '        var n10 = n % 10, n100 = n % 100;\n        if (n10 === 1 && n100 !== 11) return one;\n        return many;',
     'правило русского счёта вне дома языка — только два названных места'],

    ['отнять у дома языка счёт', 'js/kslt-yazyk.js',
     '    Я.счёт = function (н, один, немного, много) {',
     '    Я.счётНЕТ = function (н, один, немного, много) {',
     'дом языка отдаёт счёт, а два потребителя зовут его ярлыком'],

    ['отнять у дома окна счёта «человечно»', 'js/match-score.js',
     '    MS.человечно = человечно;',
     '    MS.человечноНЕТ = человечно;',
     'дом окна счёта отдаёт «человечно», а кабинет зовёт его'],

    ['снять дом окна счёта со страницы кабинета', 'pages/dashboard.html',
     'js/match-score.js?v=13',
     'js/match-score-НЕТ.js?v=13',
     'дом окна счёта подключён там, где зовут «человечно»'],

    ['отнять у дома мест карту заявок', 'js/tournament-slots.js',
     '        картаЗаявок: картаЗаявок,',
     '        картаЗаявокНЕТ: картаЗаявок,',
     'карта заявок живёт в доме свободных мест, а два зовущих — ярлыки'],

    ['снять дом мест с админки', 'pages/admin.html',
     'js/tournament-slots.js?v=6',
     'js/tournament-slots-НЕТ.js?v=6',
     'дом свободных мест подключён там, где зовут карту заявок'],

    ['вернуть сетке одно своё замыкание имени', 'js/admin/sections/bracket.js',
     '        /* СВЕДЕНО (155): отдавало сырой номер вместо прочерка. */\n        var имя = function(id) { return имяИгрока(playersMap, id); };',
     '        var имя = function(id) {\n            if (!id) return \'—\';\n            var p = playersMap[id] || {};\n            return p.name || id;\n        };',
     'имя игрока по номеру объявлено в сетке один раз, и зовут его четыре места'],

    ['вернуть одному окну записи своё закрытие числом', 'js/tournament-register.js',
     '        function close() { закрытьОкно(overlay); }\n        overlay.querySelector(\'.trn-register-modal-close\').addEventListener(\'click\', close);\n        overlay.querySelector(\'.trn-register-modal-btn\').addEventListener(\'click\', close);',
     '        function close() {\n            overlay.classList.remove(\'active\');\n            setTimeout(function() { overlay.remove(); }, 200);\n        }\n        overlay.querySelector(\'.trn-register-modal-close\').addEventListener(\'click\', close);\n        overlay.querySelector(\'.trn-register-modal-btn\').addEventListener(\'click\', close);',
     'закрытие окна объявлено в файле записи один раз, и 200 не стоит числом'],

    /* ОТКАТ НА ПРАВИЛО ВИДОВ: проба — файл в песке, и её надо туда нести. */
    ['вернуть пробе свою таблицу видов', 'tests/e2e/design-system/155-sluchaynyy-poryadok.spec.js',
     'const ЯЗЫКИ = [',
     "test.use({ viewport: { width: 1280, height: 800 } });\n\nconst ЯЗЫКИ = [",
     'проба этого куска вид себе не задаёт, а чужих таких — замеренные четыре'],

    ['вернуть в «Услуги» второе объявление одного имени', 'js/services.js',
     '    /* СЛУЧАЙНЫЙ ПОРЯДОК — ДОМ `js/kslt-tasovka.js` (кусок 155). */\n    function shuffle(arr) { return window.KSLT_TASOVKA.перемешать(arr); }',
     '    function shuffle(list) { var o = list.slice(); return o; }\n\n    /* СЛУЧАЙНЫЙ ПОРЯДОК — ДОМ `js/kslt-tasovka.js` (кусок 155). */\n    function shuffle(arr) { return window.KSLT_TASOVKA.перемешать(arr); }',
     'ни одно имя не объявлено дважды в одной области']
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

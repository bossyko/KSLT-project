/**
 * ПРУВЕР ЗАМОРОЗКИ «МЕТКА ГРУППЫ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * Откаты 3 и 11 — то, что лежало в коде до 02.10: карта меток строилась
 * в админке ДВАЖДЫ, и две копии применяли ручные места по-разному.
 *
 *   node tools/check-metka-gruppy-otkat.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-metka-'));

['js', 'tools', 'css', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.mkdirSync(path.join(ВРЕМ, 'mobile/www/js'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js/group-standings.js'),
          path.join(ВРЕМ, 'mobile/www/js/group-standings.js'));
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф =>
    fs.cpSync(path.join(КОРЕНЬ, ф), path.join(ВРЕМ, ф)));

const ГРУППЫ = 'js/group-standings.js';
const МОБ    = 'mobile/www/js/group-standings.js';
const СЕТКА  = 'js/admin/sections/bracket.js';
const СТРАН  = 'js/tournament-detail.js';
const CSSА   = 'css/admin.css';
const CSSС   = 'css/tournament-detail.css';
const HTML   = 'pages/tournament.html';

const ОТКАТЫ = [
    /* 1. Модуль перестал отдавать карту наружу. */
    [ГРУППЫ, 'меткиИгроков: меткиИгроков,', '',
     'общий модуль отдаёт карту меток'],

    /* 2. Карта считает места СВОИМ способом — мимо общей перестановки. */
    [ГРУППЫ,
     'var места = ручныеМеста(расчёт(ид, свои), (ручныеПоГруппам || {})[String(г)]);',
     'var места = расчёт(ид, свои);',
     'карта считает места общим расчётом и общей перестановкой'],

    /* 3. В админку вернулось СВОЁ построение карты — как было до 02.10. */
    [СЕТКА,
     'var playerGroupLabel = KSLT_GROUPS.меткиИгроков(\n            grpMatches, groupCount, tournament.manual_group_places);\n\n        // Состав разошёлся с заявками',
     'var playerGroupLabel = {};\n        for (var gL = 1; gL <= groupCount; gL++) {\n            playerGroupLabel[gL] = String(gL);\n        }\n\n        // Состав разошёлся с заявками',
     'админка не строит карту своим циклом'],

    /* 4. Страница турнира перестала брать карту из модуля. */
    [СТРАН,
     'tdМеткиГрупп = KSLT_GROUPS.меткиИгроков(\n                    grpMatches, groupCount, t.manual_group_places);',
     'tdМеткиГрупп = {};',
     'страница турнира берёт карту из общего модуля'],

    /* 5. Сброс карты уехал ПОСЛЕ заполнения. */
    [СТРАН,
     '            tdМеткиГрупп = {};\n',
     '',
     'карта сбрасывается перед отрисовкой, а не после'],

    /* 6. Метка осталась у одного игрока из двух. */
    [СТРАН,
     "        (p2Grp ? '<span class=\"td-grp-label\">' + p2Grp + '</span>' : '') +\n",
     '',
     'метка рисуется обоим игрокам клетки'],

    /* 7. Вернулся запасной вариант: девятая группа назовётся `91`. */
    [ГРУППЫ,
     'var буква = правила.букваГруппы(г);\n            if (!буква) continue;',
     'var буква = правила.букваГруппы(г) || String(г);',
     'без списка букв метка не выдумывается номером'],

    /* 8. Модуль перестал отдавать перестановку. */
    [ГРУППЫ, 'ручныеМеста: ручныеМеста,', '',
     'перестановка мест живёт в общем модуле'],

    /* 9. Перестановка применяется на веру — «два вторых» снова возможны. */
    [ГРУППЫ,
     '        if (было !== стало) return места;',
     '        if (false) return места;',
     'перестановка проверяется, а не применяется на веру'],

    /* 10. На странице турнира вернулась своя копия ручных мест. */
    [СТРАН,
     '                    KSLT_GROUPS.ручныеМеста(ggStandings,\n                        (t.manual_group_places || {})[String(gg)]);',
     '                    var ggOv = (t.manual_group_places || {})[String(gg)] || {};\n                    ggStandings.forEach(function(st) {\n                        if (ggOv[st.playerId] !== undefined) st.place = ggOv[st.playerId];\n                    });',
     'страница турнира не присваивает места сама'],

    /* 11. В админке у перестановки снова своё тело. */
    [СЕТКА,
     '    function применитьРучныеМеста(standings, overrides) {\n        KSLT_GROUPS.ручныеМеста(standings, overrides);\n    }',
     '    function применитьРучныеМеста(standings, overrides) {\n        if (!overrides) return;\n        var было = 1, стало = 2;\n        if (было !== стало) return;\n    }',
     'админка зовёт общую перестановку, а не держит свою'],

    /* 12. Копии модуля разошлись. */
    [МОБ, 'меткиИгроков: меткиИгроков,', 'меткиИгроков: меткиИгроков, /* копия ушла */',
     'копии модуля не разошлись'],

    /* 13. Ширина плашки разошлась с админской. */
    [CSSС, '.td-grp-label {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n    width: 22px;',
           '.td-grp-label {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n    width: 26px;',
     'плашка метки одной ширины в админке и на сайте'],

    /* 14. Плашка начала сжиматься и перестала читаться. */
    [CSSС, '    flex-shrink: 0;\n    width: 22px;', '    width: 22px;',
     'метка не отнимает ширину у имени'],

    /* 18. Метки слотов снимаются в двух местах вместо одного. */
    [СТРАН,
     "            tdМеткиСлотов = {};\n            matches.forEach(function(м) {",
     "            tdМеткиСлотов = {};\n            matches.forEach(function(м) { tdМеткиСлотов[м.id] = {}; });\n            matches.forEach(function(м) {",
     'метки слотов снимаются одной точкой, а не в семи местах'],

    /* 19. Метка слота пропала у второго игрока клетки. */
    [СТРАН,
     "        if (!match.player2Id && p2.name === 'TBD') {",
     "        if (false) {",
     'пустая клетка на сайте показывает метку слота'],

    /* 20. Подстановка метки уехала ПЕРЕД разбором BYE — настоящей
       перестановкой, а не комментарием: правило читает файл без
       комментариев, и пометка в них ничего бы не доказала. */
    [СТРАН,
     "    var этоПроход = tdИтоги[match.roundNum + ':' + match.matchOrder] === 1;",
     "    var слоты = tdМеткиСлотов[match.matchId] || {};\n" +
     "    if (слоты.s1) p1 = { name: слоты.s1, seed: null, country: '' };\n" +
     "    var этоПроход = tdИтоги[match.roundNum + ':' + match.matchOrder] === 1;",
     'BYE метка не перебивает'],

    /* 21. Краска метки слота ушла мимо замера: 3.21 вместо 9.98. */
    [CSSС,
     ".td-slot-wait {\n    color: var(--text-secondary);",
     ".td-slot-wait {\n    color: var(--text-dim);",
     'метка слота взяла померенную краску'],

    /* 22. В админку вернулось BYE поверх метки — как было до 02.10. */
    [СЕТКА,
     "var byeСторона1 = (isByeMatch || (безДопМатчей && isR1 && !match.slot1_label)) && !match.player1_id;",
     "var byeСторона1 = (isByeMatch || (безДопМатчей && isR1)) && !match.player1_id;",
     'в админке BYE не закрывает слот с меткой'],

    /* 23. На сайте свободное место снова стало «ждём» вместо BYE. */
    [СТРАН,
     "                : { name: 'BYE', seed: null, country: '' };\n        }\n        if (!match.player2Id",
     "                : p1;\n        }\n        if (!match.player2Id",
     'на сайте свободное место — BYE, а не «ждём»'],

    /* 15–17. Версия файла поднята не везде. */
    [HTML, 'group-standings.js?v=8', 'group-standings.js?v=7',
     'версия group-standings.js одна на все страницы'],
    [HTML, 'tournament-detail.js?v=95', 'tournament-detail.js?v=94',
     'версия tournament-detail.js одна на все страницы'],
    [HTML, 'tournament-detail.css?v=89', 'tournament-detail.css?v=88',
     'версия tournament-detail.css одна на все страницы']
];

let провалов = 0;

ОТКАТЫ.forEach(([файл, было, стало, ждём], и) => {
    const путь = path.join(ВРЕМ, файл);
    const исходный = fs.readFileSync(путь, 'utf8');

    const встреч = исходный.split(было).length - 1;
    if (встреч !== 1) {
        console.log('✗ откат ' + (и + 1) + ': якорь встречается ' + встреч +
            ' раз — нужен ровно один\n    ' + было.slice(0, 70).replace(/\n/g, ' ⏎ '));
        провалов++;
        return;
    }

    fs.writeFileSync(путь, исходный.replace(было, стало));

    let вывод = '', упало = false;
    try {
        execFileSync(process.execPath, [path.join(ВРЕМ, 'tools/check-metka-gruppy.js')],
            { cwd: ВРЕМ, encoding: 'utf8' });
    } catch (e) {
        упало = true;
        вывод = (e.stdout || '') + (e.stderr || '');
    }

    fs.writeFileSync(путь, исходный);

    if (!упало) {
        console.log('✗ откат ' + (и + 1) + ' («' + ждём + '»): правило НЕ упало — оно ничего не держит');
        провалов++;
    } else if (вывод.indexOf(ждём) === -1) {
        console.log('✗ откат ' + (и + 1) + ': упало не то правило. Ждали «' + ждём + '», а в выводе:\n' +
            вывод.split('\n').filter(с => с.indexOf('•') !== -1).join('\n'));
        провалов++;
    } else {
        console.log('✓ откат ' + (и + 1) + ' уронил «' + ждём + '»');
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });

if (провалов) {
    console.log('\n✗ Прувер: ' + провалов + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
    process.exit(1);
}
console.log('\n✓ Прувер: все ' + ОТКАТЫ.length + ' откатов уронили свои правила');

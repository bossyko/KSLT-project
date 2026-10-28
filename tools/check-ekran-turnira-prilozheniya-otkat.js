#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ЭКРАНА ТУРНИРА В ПРИЛОЖЕНИИ (кусок 216). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-turnir-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'js/kslt-setka.js', 'js/kslt-rules.js', 'js/tournament-detail.js',
 'tools/check-ekran-turnira-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-ekran-turnira-prilozheniya.js')],
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
const G = 'mobile/www/js/screens/home.js';
const P = 'mobile/www/js/screens/player-detail.js';
const C = 'mobile/www/css/app.css';
const D = 'js/kslt-setka.js';
const DK = 'mobile/www/js/kslt-setka.js';
const R = 'js/kslt-rules.js';
const T = 'js/tournament-detail.js';

/* Якоря держатся на содержимом: имя класса, имя ключа, имя столбца. */
const ОТКАТЫ = [
    ['вкладка участников снесена', H,
     '<button class="td-tab" data-tab="tdPart" role="tab" aria-selected="false" aria-controls="tdPart" data-i18n="td.participants">Участники</button>\n',
     '',
     'вкладок шесть и у каждой своё поле'],

    ['поле расписания снесено', H,
     '  <div class="td-tab-content" id="tdSched" role="tabpanel"></div>\n',
     '',
     'вкладка на месте: tdSched'],

    ['вкладки перестали быть вкладками для диктора', H,
     '<div class="td-tabs" id="tdTabs" role="tablist"',
     '<div class="td-tabs" id="tdTabs"',
     'вкладки размечены для диктора'],

    ['признак выбранной вкладки уехал от класса', G,
     "        tab.setAttribute('aria-selected', 'true');\n",
     '',
     'признак выбранной вкладки переставляется там же, где класс'],

    ['правило очков вынуто из общего дома', R,
     '    R.идутОчки = function (турнир) {',
     '    R.идутОчкиБыло = function (турнир) {',
     'правило «идут ли очки» живёт в общем доме'],

    ['сайт снова считает очки сам', T,
     '    return window.KSLT_RULES.идутОчки(t);',
     "    if (t.category_id === 'friendly') return false;\n    return true;",
     'сайт зовёт общий дом, а не считает сам'],

    ['приложение перестало прятать вкладку очков', G,
     '    if (вкладкаОчков) вкладкаОчков.hidden = !сОчками;\n',
     '',
     'приложение прячет вкладку очков тем же правилом'],

    ['копия общего дома уехала', DK,
     '    var S = {};',
     '    var S = {}; // уехало',
     'копия общего файла совпадает: рисунок группы и сетки'],

    ['дом круговой таблицы снят', D,
     '    S.круговаяГруппа = function (опции) {',
     '    S.круговаяГруппаБыла = function (опции) {',
     'дом круговой таблицы объявлен'],

    ['дом потянул за собой язык сайта', D,
     '        var имя = опции.имя;',
     '        var имя = опции.имя || KSLT_YAZYK.выбрать;',
     'дом не знает ни про язык сайта, ни про словарь приложения'],

    ['приложение снова рисует таблицу само', G,
     '      groupsHtml += KSLT_SETKA.круговаяГруппа({',
     '      groupsHtml += \'<table class="td-group-table">\' + KSLT_SETKA.круговаяГруппа({',
     'круговую таблицу не рисует сам: приложение'],

    ['заявки снова сортируются по несуществующему столбцу', G,
     "      .order('registered_at', { ascending: true })",
     "      .order('created_at', { ascending: true })",
     'заявки сортируются по существующему столбцу: участники турнира'],

    ['турниры игрока снова падают на том же столбце', P,
     "      .order('registered_at', { ascending: false })",
     "      .order('created_at', { ascending: false })",
     'заявки сортируются по существующему столбцу: турниры игрока'],

    ['описание снова теряет абзацы', G,
     "      var текст = esc(I18N.поле(t, 'description')).replace(",
     "      var текст = esc(t.description); var нет = (",
     'описание турнира сохраняет абзацы и берёт перевод'],

    ['у окна-экрана снова безусловная ширина', C,
     '.td-overlay {\n  position: fixed;\n  top: 0; bottom: 0;\n  left: 0; right: 0;\n  margin: 0 auto;',
     '.td-overlay {\n  position: fixed;\n  top: 0; bottom: 0;\n  left: 0; right: 0;\n  max-width: 440px;\n  margin: 0 auto;',
     'у окна-экрана нет безусловной границы ширины'],

    ['пара снова склеена одной строкой', G,
     "  function имяПарыТекстом(playerId, regsMap, playersMap, isDbl) {",
     "  function имяПарыТекстомБыло(playerId, regsMap, playersMap, isDbl) {",
     'имя пары рисуется блоками по игроку'],

    ['порог отсечки развели по месту', G,
     '  var ПОРОГ_ОТСЕЧКИ = 10;',
     '  var ПОРОГ_ОТСЕЧКИ_БЫЛО = 10;',
     'порог отсечки один на все списки'],

    ['обводка фокуса вкладки снова браузерная', C,
     '.td-tab:focus { outline: none; }',
     '.td-tab:focus-was { outline: none; }',
     'у вкладок и таблеток кругов своя обводка фокуса'],

    ['версия правленого файла не поднята', H,
     'js/screens/home.js?v=8',
     'js/screens/home.js?v=1',
     'версии правленых файлов подняты'],

    ['общий дом не подключён', H,
     '<script src="js/kslt-setka.js?v=1"></script>\n',
     '',
     'общий дом подключён в приложении']
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

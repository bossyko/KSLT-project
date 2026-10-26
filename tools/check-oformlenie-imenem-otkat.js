/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ОФОРМЛЕНИЕ ИМЕНЕМ». На КОПИИ. Кусок 175.
 *
 *   node tools/check-oformlenie-imenem-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-oform-'));
['css', 'tools', 'js'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛИ = { js: 'js/admin/sections/bracket.js', css: 'css/admin.css' };
const чистые = {};
Object.entries(ЦЕЛИ).forEach(([к, п]) => { чистые[к] = fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8'); });

function прогон(правки) {
    Object.entries(ЦЕЛИ).forEach(([к, п]) => {
        fs.writeFileSync(path.join(песок, п), (правки && правки[к]) ? правки[к] : чистые[к]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-oformlenie-imenem.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЯ — на содержимом, которое живёт постоянно, и НЕ на хвосте списка:
   в хвост дописывают (урок куска 164). */
const Я = {
    окноСчёта: '    function openScoreModal(',
    карта: 'var ПАНЕЛИ = { registrations:',
    проход: 'Object.keys(ПАНЕЛИ).forEach(function (ключ) {',
    панельЗаявок: "html += '<div class=\"ad-brk-panel' + (activeTab !== 'registrations' ? ' ad-skryt' : '') + '\" id=\"adBrkRegPanel\">';",
    отступПанели: '.ad-brk-panel {\n    padding-top: var(--space-2);\n}',
    утилита: '.ad-bez-polya.ad-bez-polya { margin: 0; }',
    tbРаскладка: '.ad-tb-wrap {\n    display: inline-flex;',
    tbСостояние: '.ad-tb-wrap:not(.ad-vidno) {\n    display: none;\n}',
    классОкна: '.ad-score-head {',
    полеXslot: 'class=\"ad-field-input ad-xslot-select\"',
};
Object.entries(Я).forEach(([имя, як]) => {
    const сколько = Object.values(чистые).reduce((с, т) => с + т.split(як).length - 1, 0);
    if (сколько !== 1) {
        console.log('  ЯКОРЬ НЕГОДЕН: «' + имя + '» встречается ' + сколько + ' раз');
        process.exitCode = 1;
    }
});

const ОТКАТЫ = [
    ['вернуть инлайн в файл сетки',
     { js: чистые.js.replace(Я.окноСчёта,
        "    var _порча = '<i style=\"padding:10px\"></i>';\n" + Я.окноСчёта) },
     'в файле сетки не осталось инлайн-стилей'],

    ['вернуть запись состояния через style.display',
     { js: чистые.js.replace(Я.окноСчёта,
        "    function _порча(e) { e.style.display = 'none'; }\n" + Я.окноСчёта) },
     'состояние не пишется через style.display'],

    ['развести переключение панелей обратно по id',
     { js: чистые.js.replace(Я.карта, 'var ПАНЕЛИ_БЫЛО = { registrations:') },
     'панели вкладок переключаются одной картой'],

    ['снять проход по карте панелей',
     { js: чистые.js.replace(Я.проход, 'Object.keys(ПАНЕЛИ).map(function (ключ) {') },
     'панели вкладок переключаются одной картой'],

    ['вернуть панели инлайн вместо класса',
     { js: чистые.js.replace(Я.панельЗаявок,
        "html += '<div class=\"ad-brk-panel\" id=\"adBrkRegPanel\" style=\"padding-top:8px;\">';") },
     'состояние панели ставится классом при сборке разметки'],

    ['унести отступ панели из css',
     { css: чистые.css.replace(Я.отступПанели, '.ad-brk-panel-bylo {\n    padding-top: var(--space-2);\n}') },
     'верхний отступ панели вкладки задан в css'],

    ['объявить утилиту одним именем',
     { css: чистые.css.replace(Я.утилита, '.ad-bez-polya { margin: 0; }') },
     'новые утилиты объявлены удвоенным именем'],

    ['вернуть мёртвое имя `ad-input` в разметку',
     { js: чистые.js.replace(Я.полеXslot, 'class="ad-input ad-xslot-select"') },
     'мёртвое имя `ad-input` не вернулся'.replace('не вернулся', 'не вернулось')],

    ['завести тай-брейку второе определение раскладки',
     { css: чистые.css.replace(Я.tbРаскладка, '.ad-tb-wrap {\n    display: inline;\n}\n\n.ad-tb-wrap {\n    display: inline-flex;') },
     'у тай-брейка одно определение раскладки'],

    ['снять у тай-брейка состояние отдельным селектором',
     { css: чистые.css.replace(Я.tbСостояние, '.ad-tb-wrap-bylo {\n    display: none;\n}') },
     'у тай-брейка одно определение раскладки'],

    ['унести класс окна счёта из css',
     { css: чистые.css.replace(Я.классОкна, '.ad-score-head-bylo {') },
     'классы окна ввода счёта объявлены в css'],

    ['завести в разметке класс, которого не знает ни css, ни js',
     { js: чистые.js.replace(Я.окноСчёта,
        "    var _порча = '<i class=\"ad-nikomu-ne-izvesten\"></i>';\n" + Я.окноСчёта) },
     'новых классов без правила и без крючка не завелось'],
];

console.log('');
console.log('  ПРУВЕР СТОРОЖА «ОФОРМЛЕНИЕ ИМЕНЕМ» — песок ' + песок);
console.log('');

const чисто = прогон(null);
if (чисто.упало) {
    console.log('  НЕ ТАК  сторож падает на ЧИСТОЙ копии — песок неполон');
    console.log(чисто.вывод.split('\n').slice(0, 14).join('\n'));
    process.exit(1);
}
console.log('  v чистая копия зелена');

let беда = 0;
ОТКАТЫ.forEach(([имя, правки, ждём]) => {
    const р = прогон(правки);
    const тоСамое = р.упало && р.вывод.includes(ждём);
    if (!тоСамое) {
        беда++;
        console.log('  x ' + имя + '  ->  ' + (р.упало ? 'упало ДРУГОЕ' : 'НЕ УПАЛО') + ' (ждали «' + ждём + '»)');
        if (р.упало) {
            const свои = (р.вывод.match(/^          x .*$/gm) || []).map(с => с.trim());
            console.log('      упали: ' + свои.join(' · '));
        }
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (беда === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии');
    console.log('');
    process.exit(process.exitCode || 0);
}
console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило');
console.log('');
process.exit(1);

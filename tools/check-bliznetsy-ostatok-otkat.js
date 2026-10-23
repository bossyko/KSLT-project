/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ОСТАТОК БЛИЗНЕЦОВ». На КОПИИ.
 *
 *   node tools/check-bliznetsy-ostatok-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-bliz-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/kslt-vitrina.js', ТР = 'js/coaches.js', КТ = 'js/courts.js',
      ИГ = 'js/player.js';
const ФАЙЛЫ = [ДОМ, ТР, КТ, ИГ];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-bliznetsy-ostatok.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1–7: каждое понятие уходит из дома по очереди. Переименование — а не
       снос: так падает ровно правило об объявлении, а не разбор файла. */
    ['отнять у дома появление', ДОМ, '    В.появление = function', '    В.появлениеИначе = function',
     '`появление` объявлено в доме витрины'],
    ['отнять у дома пересчёт шага', ДОМ, '    В.пересчётШага = function', '    В.пересчётШагаИначе = function',
     '`пересчётШага` объявлено в доме витрины'],
    ['отнять у дома поле поиска', ДОМ, '    В.поиск = function', '    В.поискИначе = function',
     '`поиск` объявлено в доме витрины'],
    ['отнять у дома обложку', ДОМ, '    В.обложка = function', '    В.обложкаИначе = function',
     '`обложка` объявлено в доме витрины'],
    ['отнять у дома липкость полосы', ДОМ, '    В.липнетПолоса = function', '    В.липнетПолосаИначе = function',
     '`липнетПолоса` объявлено в доме витрины'],
    ['отнять у дома членское окно', ДОМ, '    В.членскоеОкно = function', '    В.членскоеОкноИначе = function',
     '`членскоеОкно` объявлено в доме витрины'],
    ['отнять у дома нажатия карточки', ДОМ, '    В.нажатияКарточки = function', '    В.нажатияКарточкиИначе = function',
     '`нажатияКарточки` объявлено в доме витрины'],

    /* 8–9: свой наблюдатель вернулся к близнецам */
    ['вернуть тренерам свой наблюдатель', ТР,
     "    function initScrollAnimations() {\n        KSLT_VITRINA.появление('co');",
     "    function initScrollAnimations() {\n        var н = new IntersectionObserver(function () {});\n        н.observe(document.body);\n        KSLT_VITRINA.появление('co');",
     'у тренеров своего наблюдателя нет'],
    ['вернуть кортам свой наблюдатель', КТ,
     "    function initScrollAnimations() {\n        KSLT_VITRINA.появление('ct');",
     "    function initScrollAnimations() {\n        var н = new IntersectionObserver(function () {});\n        н.observe(document.body);\n        KSLT_VITRINA.появление('ct');",
     'у кортов своего наблюдателя нет'],

    /* 10: своя разметка членского окна у страницы */
    ['вернуть кортам своё тело членского окна', КТ,
     "    function showMembershipModal(level) {",
     "    function showMembershipModal(level) {\n" +
     "        var п = document.createElement('div');\n" +
     "        п.innerHTML = '<button class=\"ct-membership-close\">&times;</button>';\n" +
     "        document.body.appendChild(п);\n        return;",
     'членское окно собирается только в доме'],

    /* 11: дом узнал о разделе */
    ['научить дом приставке раздела', ДОМ,
     "    В.появление = function (приставка) {",
     "    В.появление = function (приставка) {\n        приставка = приставка || 'co-grid';",
     'дом витрины не знает о разделах'],

    /* 12: пересчёт снова ставит наблюдателя */
    ['завести наблюдателя внутрь пересчёта шага', ДОМ,
     "    В.пересчётШага = function (о) {\n        return function () {",
     "    В.пересчётШага = function (о) {\n        new ResizeObserver(function () {}).observe(document.body);\n        return function () {",
     'пересчёт шага отдаёт функцию и не ставит наблюдателя'],

    /* 13: вторая копия наблюдателя появления по сайту — храповик вверх */
    /* ЯКОРЬ ВЗЯТ УНИКАЛЬНЫЙ: `(function() {` встречается в `player.js`
       ДЕСЯТЬ раз, и прувер это сказал сам, а не промолчал. */
    ['завести вторую копию появления', ИГ,
     "        document.querySelectorAll('.pp-fade-in:not(.visible)').forEach(function (el) {",
     "        if (window.__нет) document.querySelectorAll('.pl-fade-in:not(.visible)');\n" +
     "        document.querySelectorAll('.pp-fade-in:not(.visible)').forEach(function (el) {",
     'наблюдателей появления вне дома не прибавилось'],

    /* 14: копий появления стало меньше — храповик ОПУСКАЕТСЯ */
    ['снять единственную копию появления', ИГ,
     "-fade-in:not(.visible)",
     "-fade-in:not(.vidimo)",
     'потолок наблюдателей появления не завышен'],

    /* 15: отступ липкости написан дважды */
    ['написать отступ липкости вторым числом', ДОМ,
     "    var ОТСТУП_ЛИПКОСТИ = '-65px 0px 0px 0px';",
     "    var ОТСТУП_ЛИПКОСТИ = '-65px 0px 0px 0px';\n    var ОТСТУП_ЕЩЁ = '-65px 0px 0px 0px';",
     'отступ липкости объявлен один раз и равен замеренному']
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
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return; }
    if (сколько !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return; }
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

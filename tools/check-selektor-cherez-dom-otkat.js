/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ СЕЛЕКТОРА ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-selektor-cherez-dom-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/kslt-ekranirovanie.js', 'js/auth.js', 'js/stats.js',
               'js/dashboard.js', 'pages/auth.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Д = 'js/kslt-ekranirovanie.js', А = 'js/auth.js', С = 'js/stats.js',
      К = 'js/dashboard.js', П = 'pages/auth.html';

const ОТКАТЫ = [

['завести второй дом селектора', Д,
 '    window.KSLT_селектор = function (значение) {',
 '    window.KSLT_селектор = function (з) { return з; };\n' +
 '    window.KSLT_селектор = function (значение) {',
 'дом селектора объявлен ровно один раз'],

/* ПОРЯДОК ЗАМЕН — НЕ УКРАШЕНИЕ. Закрой сперва кавычку, и косая,
   подставленная следом, съест её же экран: `a\\"` снова закроет значение. */
['поменять порядок замен: кавычка раньше косой', Д,
 ".replace(/\\\\/g, '\\\\\\\\').replace(/\"/g, '\\\\\"');",
 ".replace(/\"/g, '\\\\\"').replace(/\\\\/g, '\\\\\\\\');",
 'обратная косая закрывается ПЕРВОЙ, кавычка следом'],

['отнять у дома защиту от пустого', Д,
 "    window.KSLT_селектор = function (значение) {\n        return String(значение == null ? '' : значение)",
 '    window.KSLT_селектор = function (значение) {\n        return String(значение)',
 'пустое значение даёт пусто, а не слово'],

['вернуть одно место к строке', К,
 "'[data-vg-hidden=\"' + window.KSLT_селектор(type) + '\"]'",
 "'[data-vg-hidden=\"' + type + '\"]'",
 'подстановок значения атрибута мимо дома нет'],

/* ОТКАТ СНИМАЕТ ЗОВ ТАМ, КУДА ПРИЗНАК ВЫШЕ НЕ СМОТРИТ: подстановка в
   `'#' + …` не является значением атрибута, и правило про «мимо дома»
   её не видит. Падает именно замер числа — он и страхует признак. */
['снять зов дома там, где признак его не ищет', С,
 "'#' + window.KSLT_селектор(id) + ', [data-stat=\"'",
 "'#' + id + ', [data-stat=\"'",
 'зовов дома не меньше замеренных 30'],

/* ЗОВ ДОМА ОСТАЁТСЯ, чтобы упало ИМЕННО правило про чужой дом, а не
   заодно правило про подстановку мимо дома. */
['позвать в селектор экранирование разметки', А,
 "'.pw-rule[data-rule=\"' + window.KSLT_селектор(key) + '\"]'",
 "'.pw-rule[data-rule=\"' + window.KSLT_селектор(KSLT_экранировать(key)) + '\"]'",
 'экранирование разметки в селектор не зовут'],

['отнять дом у страницы, которая его зовёт', П,
 '<script src="../js/kslt-ekranirovanie.js?v=',
 '<script src="../js/kslt-ekranirovanie-net.js?v=',
 'дом подключают все страницы, которым он нужен'],

['поставить дом ПОЗЖЕ его зовущего', П,
 '    <script src="../js/kslt-ekranirovanie.js?v=2"></script>\n' +
 '    <script src="../js/auth.js?v=55"></script>\n',
 '    <script src="../js/auth.js?v=55"></script>\n' +
 '    <script src="../js/kslt-ekranirovanie.js?v=2"></script>\n',
 'дом стоит раньше своих зовущих']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sel-'));
['css', 'js', 'pages', 'maket', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-selektor-cherez-dom.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят правило.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].split(что).join(на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

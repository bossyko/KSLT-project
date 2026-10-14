/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ РОВНЫХ РЯДОВ ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-rovnye-ryady-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/players.css', 'css/news.css',
                'tests/e2e/design-system/90-rovnye-ryady.spec.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Р = 'css/players.css', Н = 'css/news.css',
      П = 'tests/e2e/design-system/90-rovnye-ryady.spec.js';

const ОТКАТЫ = [

['снять свойство высоты у ряда', Р,
 '    min-height: var(--btn-h-lg);\n    padding: 6px 16px;',
 '    padding: 6px 16px;',
 'высоту ряда держит свойство, а не сумма полей'],

['вернуть разделитель ряда бордером', Р,
 '    box-shadow: inset 0 -1px 0 var(--border-subtle);\n    transition: all 0.2s;',
 '    border-bottom: var(--bw-hair) solid var(--border-subtle);\n    transition: all 0.2s;',
 'разделитель ряда не занимает места в потоке'],

['снимать у последнего ряда не ту линию', Р,
 '.pl-row:last-child {\n    box-shadow: none;\n}',
 '.pl-row:last-child {\n    border-bottom: none;\n}',
 'последний ряд снимает тот же разделитель, которым он нарисован'],

['вернуть значку NTRP перенос', Р,
 '.pl-col-ntrp {\n    text-align: center;\n    white-space: nowrap;\n}',
 '.pl-col-ntrp {\n    text-align: center;\n}',
 'значок NTRP стоит в одну строку'],

['вернуть дорожкам бенто свою высоту', Н,
 '.news-grid.news-grid {\n    grid-auto-rows: 1fr;\n}',
 '.news-grid.news-grid {\n    grid-auto-rows: auto;\n}',
 'дорожки бенто равны между собой'],

['отнять у крупной карточки второй ряд', Н,
 '    grid-column: span 6;\n    grid-row: span 2;',
 '    grid-column: span 6;\n    grid-row: auto;',
 'отношение «крупная = два ряда боковых» не тронуто'],

['вернуть оговорку на первые три карточки', Н,
 '.news-grid.tournaments-grid > .tc { height: auto; min-height: 0; }',
 '.news-grid.tournaments-grid > .tc:nth-child(-n+3) { height: auto; min-height: 0; }',
 'оговорка о высоте накрывает ВСЕ карточки списка'],

['завести вторую отсечку по номеру ребёнка', Н,
 '.news-grid.tournaments-grid > .tc { height: auto; min-height: 0; }',
 '.news-grid.tournaments-grid > .tc { height: auto; min-height: 0; }\n.news-grid.tournaments-grid > .tc:nth-child(-n+5) { height: 300px; }',
 'высота не снимается у первых N карточек по счёту'],

['списать пробную витрину новостей второй копией', П,
 "const витрина = require('../../podstava-novostey');",
 "const витрина = { ВИТРИНА: `(сколько) => {\n    const a = document.createElement('a');\n    a.className = 'tc проба';\n    return { было: сколько };\n}` };",
 'пробная витрина новостей существует одной копией']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ryady-'));
fs.mkdirSync(path.join(песок, 'css'), { recursive: true });
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
fs.mkdirSync(path.join(песок, 'tests', 'e2e', 'design-system'), { recursive: true });
/* Сторож на копии пробной витрины считает вхождения по всей папке tests.
   В песок кладём те файлы, где разметка вообще может встретиться: модуль
   витрины и пробу, которая его берёт. Остальные файлы прогона якоря не
   содержат — от их отсутствия счёт не меняется. */
fs.copyFileSync(path.join(КОРЕНЬ, 'tests', 'podstava-novostey.js'),
                path.join(песок, 'tests', 'podstava-novostey.js'));
fs.copyFileSync(path.join(__dirname, 'check-rovnye-ryady.js'),
                path.join(песок, 'tools', 'check-rovnye-ryady.js'));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-rovnye-ryady.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-rovnye-ryady.js.');
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
    if (сколько > 1)   { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

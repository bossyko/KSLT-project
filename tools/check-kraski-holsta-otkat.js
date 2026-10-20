/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КРАСОК ХОЛСТА. На КОПИИ.
 *
 * Каждый откат возвращает ровно то, что было в продукте до круга 17, и
 * требует, чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-kraski-holsta-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-holst-'));
['css', 'js', 'tools', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ФАЙЛЫ = ['js/rating-chart.js', 'js/admin/sections/analytics.js',
                'js/admin/sections/users.js', 'js/admin/sections/finances.js',
                'js/kslt-kraska.js', 'css/tokens.css', 'pages/player.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-kraski-holsta.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const RC = 'js/rating-chart.js', AN = 'js/admin/sections/analytics.js',
      US = 'js/admin/sections/users.js', FI = 'js/admin/sections/finances.js',
      KR = 'js/kslt-kraska.js', TK = 'css/tokens.css', PL = 'pages/player.html';

const ОТКАТЫ = [
    /* 1. краска ЧИСЛОМ в настройках графика — как было до круга */
    ['вернуть бирюзу числом на ось NTRP', RC,
     "ticks: { color: window.KSLT_KRASKA.цвет('--cat-1'), stepSize: 1",
     "ticks: { color: '#00BFFF', stepSize: 1",
     'внутри new Chart() краска не пишется ни числом, ни var()'],

    ['вернуть фон подсказки числом — третье написание одного понятия', US,
     "backgroundColor: window.KSLT_KRASKA.цвет('--chart-tip-bg'),",
     "backgroundColor: 'rgba(20,24,36,0.95)',",
     'внутри new Chart() краска не пишется ни числом, ни var()'],

    /* 2. var() в холсте — молчаливый провал, хуже числа */
    ['вернуть var() в заливку графика — холст нарисует ничем', US,
     "backgroundColor: window.KSLT_KRASKA.цвет('--accent', 0.12),",
     "backgroundColor: 'var(--alpha-lime-12)',",
     'внутри new Chart() краска не пишется ни числом, ни var()'],

    ['вернуть var() в обводку подсказки аналитики', AN,
     "borderColor: window.KSLT_KRASKA.цвет('--chart-tip-border'),",
     "borderColor: 'var(--accent-glow)',",
     'внутри new Chart() краска не пишется ни числом, ни var()'],

    ['вернуть краску Material роли успеха — чужая палитра', FI,
     "color: window.KSLT_KRASKA.цвет('--neutral-white', 0.72),",
     "color: 'rgba(76,175,80,1)',",
     'внутри new Chart() краска не пишется ни числом, ни var()'],

    /* 3. склейка hex-хвоста: по виду безобидна, ломает график целиком */
    ['вернуть склейку hex-хвоста в градиент заливки', RC,
     "g.addColorStop(0, window.KSLT_KRASKA.сАльфой(c.color, 0.22));",
     "g.addColorStop(0, c.color + '38');",
     'прозрачность даётся сАльфой, а не склейкой hex-хвоста'],

    ['вернуть склейку в линию закрытой категории', RC,
     "borderColor: closed[s.cat] ? window.KSLT_KRASKA.сАльфой(c.color, 0.40) : c.color,",
     "borderColor: closed[s.cat] ? c.color + '66' : c.color,",
     'прозрачность даётся сАльфой, а не склейкой hex-хвоста'],

    /* 4. дом без сАльфой — склейке некуда уйти */
    ['убрать сАльфой из дома', KR,
     "        сАльфой: function (цв, альфа) {",
     "        сАльфойНет: function (цв, альфа) {",
     'дом красок умеет сАльфой'],

    ['посчитать прозрачность в цвет() своими руками — второе определение', KR,
     "            return this.сАльфой(знач, альфа);",
     "            var ч = разобрать(знач);\n            if (!ч) return знач;\n            return 'rgba(' + ч[0] + ', ' + ч[1] + ', ' + ч[2] + ', ' + альфа + ')';",
     'цвет() с альфой идёт через сАльфой — одно определение'],

    /* 5. имена подсказки */
    ['убрать имя фона подсказки из токенов', TK,
     "  --chart-tip-bg:     rgba(20, 20, 20, 0.95);",
     "  --chart-tip-fon:    rgba(20, 20, 20, 0.95);",
     'имена подсказки графика объявлены в tokens.css'],

    ['объявить фон подсказки дважды', TK,
     "  --chart-tip-body:   var(--text-secondary);",
     "  --chart-tip-body:   var(--text-secondary);\n  --chart-tip-bg:     rgba(26, 26, 26, 0.95);",
     'подсказка графика определена один раз'],

    /* 6. страница без дома */
    ['снять дом красок со страницы игрока', PL,
     '    <script src="../js/kslt-kraska.js?v=5"></script>\n',
     '',
     'страница, зовущая дом красок, его подключает'],

    /* 7. дом молчит о ненайденном токене */
    ['вернуть молчаливый провал дома', KR,
     "                    try {\n                        console.warn('KSLT_KRASKA: токен ' + имя +",
     "                    try {\n                        var тихо = ('KSLT_KRASKA: токен ' + имя +",
     'дом жалуется на ненайденный токен, а не молчит']
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
    if (исходник[ф].indexOf(что) === -1) {
        console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return;
    }
    if (исходник[ф].split(что).length - 1 !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' +
                    (исходник[ф].split(что).length - 1) + ' раз'); плохих++; return;
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

/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ПЕЧАТНОЙ КАРТОЧКИ. На КОПИИ.
 *
 * Каждый откат возвращает ровно то, что стояло в продукте до круга 18, и
 * требует, чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-kartochka-holsta-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kartochka-'));
['css', 'js', 'tools', 'pages', 'maket'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
/* index.html лежит в корне, а не в папке — он тоже нужен: правило о
   расшифровке сверяет карточку с титулом главной. */
fs.cpSync(path.join(КОРЕНЬ, 'index.html'), path.join(песок, 'index.html'));

const ФАЙЛЫ = ['js/kslt-vaucher-kartochka.js', 'js/courts.js', 'js/coaches.js',
                'js/dashboard.js', 'pages/courts.html', 'index.html',
                'js/admin/core/export.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-kartochka-holsta.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const Д = 'js/kslt-vaucher-kartochka.js', КТ = 'js/courts.js',
      ТР = 'js/coaches.js', КБ = 'js/dashboard.js', СТР = 'pages/courts.html';

const ОТКАТЫ = [
    /* 1. зовущий снова рисует сам — как было до круга */
    ['вернуть кортам своё рисование градиента', КТ,
     "                var qrCanvas = qrContainer.querySelector('canvas');\n                if (!qrCanvas) return;\n                var карточка = window.KSLT_VAUCHER.нарисовать({",
     "                var qrCanvas = qrContainer.querySelector('canvas');\n                if (!qrCanvas) return;\n                var ctx = document.createElement('canvas').getContext('2d');\n                var grad = ctx.createLinearGradient(0, 0, 0, 520);\n                var карточка = window.KSLT_VAUCHER.нарисовать({",
     'карточку рисует только дом, зовущие её не рисуют'],

    ['вернуть тренерам свой fillText', ТР,
     "                var qrCanvas = qrContainer.querySelector('canvas');\n                if (!qrCanvas) return;\n                var карточка = window.KSLT_VAUCHER.нарисовать({",
     "                var qrCanvas = qrContainer.querySelector('canvas');\n                if (!qrCanvas) return;\n                qrCanvas.getContext('2d').fillText('KSLT', 190, 42);\n                var карточка = window.KSLT_VAUCHER.нарисовать({",
     'карточку рисует только дом, зовущие её не рисуют'],

    ['вернуть кабинету свой fillStyle числом', КБ,
     "                var qrCanvas = qrEl.querySelector('canvas');\n                if (!qrCanvas) return;\n                var catEl = document.getElementById('dbQrCategory');",
     "                var qrCanvas = qrEl.querySelector('canvas');\n                if (!qrCanvas) return;\n                qrCanvas.getContext('2d').fillStyle = '#0f0f0f';\n                var catEl = document.getElementById('dbQrCategory');",
     'карточку рисует только дом, зовущие её не рисуют'],

    /* 2. вторая копия скругления */
    ['вернуть вторую копию скругления в корты', КТ,
     "(function() {\n    'use strict';",
     "(function() {\n    'use strict';\n\n    function roundRect(ctx, x, y, w, h, r) {\n        ctx.beginPath();\n        ctx.closePath();\n    }",
     'скругление объявлено один раз, и это дом'],

    /* 3. краска мимо дома красок: число и var() */
    ['вернуть градиент числом', Д,
     "        переход.addColorStop(0, краска('--vch-card-top'));",
     "        переход.addColorStop(0, '#0f0f0f');",
     'краска в доме берётся домом красок'],

    ['вернуть var() в разделитель — холст нарисует ничем', Д,
     "        ctx.strokeStyle = краска('--accent', 0.20);",
     "        ctx.strokeStyle = 'var(--alpha-lime-20)';",
     'краска в доме берётся домом красок'],

    /* 4. проверки пустых значений */
    ['убрать проверку пустой скидки — вернуть «-undefined%»', Д,
     "            if (o.скидка || o.скидка === 0) {",
     "            if (true) {",
     'пустая скидка и пустой срок проверяются в доме'],

    ['убрать проверку пустого срока', Д,
     "            if (o.срок) {\n                ctx.fillStyle = краска('--neutral-white', СРЕДНЕ);",
     "            if (1) {\n                ctx.fillStyle = краска('--neutral-white', СРЕДНЕ);",
     'пустая скидка и пустой срок проверяются в доме'],

    /* 5. ступень тихого текста. ОТКАТ ПЕРЕСЕКАЕТ ГРАНИЦУ, А НЕ КАСАЕТСЯ:
          0.40 — прежнее число подзаголовка, контраст 3.81 при пороге 4.5. */
    ['вернуть тихому тексту прежнюю ступень 0.40', Д,
     "    var ТИХО = 0.50;",
     "    var ТИХО = 0.40;",
     'тихий текст карточки не ниже ступени 0.50'],

    ['вернуть адресу сайта прежнюю ступень 0.25 числом', Д,
     "        ctx.fillStyle = краска('--neutral-white', ТИХО);\n        ctx.font = шрифт(11);\n        ctx.fillText(window.KSLT_SAYT.подпись, ш / 2, в - 14);",
     "        ctx.fillStyle = краска('--neutral-white', 0.25);\n        ctx.font = шрифт(11);\n        ctx.fillText(window.KSLT_SAYT.подпись, ш / 2, в - 14);",
     'тихий текст карточки не ниже ступени 0.50'],

    /* 6. кегли мимо шкалы */
    ['вернуть кегль 15 названию услуги', Д,
     "            ctx.font = шрифт(16, true);\n            ctx.fillText(o.услуга || '', Ш / 2, 138);",
     "            ctx.font = шрифт(15, true);\n            ctx.fillText(o.услуга || '', Ш / 2, 138);",
     'кегли карточки стоят на шкале продукта'],

    ['вернуть кегль 10 адресу сайта', Д,
     "        ctx.fillStyle = краска('--neutral-white', ТИХО);\n        ctx.font = шрифт(11);\n        ctx.fillText(window.KSLT_SAYT.подпись, ш / 2, в - 14);",
     "        ctx.fillStyle = краска('--neutral-white', ТИХО);\n        ctx.font = шрифт(10);\n        ctx.fillText(window.KSLT_SAYT.подпись, ш / 2, в - 14);",
     'кегли карточки стоят на шкале продукта'],

    /* 7. страница без дома */
    /* 8. знак и расшифровка */
    ['разойтись с продуктом в расшифровке — второе имя клуба', Д,
     "        ru: 'Кыргызстанское Сообщество Любителей Тенниса',",
     "        ru: 'Кыргызское общество любителей тенниса',",
     'расшифровка на карточке — та же, что в титуле, герое и печати'],

    ['поставить латиницу знаку на русском — против правила обложки', Д,
     "    var ЗНАК = { ru: 'КСЛТ', en: 'KSLT', kg: 'KSLT' };",
     "    var ЗНАК = { ru: 'KSLT', en: 'KSLT', kg: 'KSLT' };",
     'знак на карточке кириллицей на русском и латиницей на прочих'],

    ['вписать аббревиатуру в строку расшифровки — она вылезет на линию', Д,
     "        ru: 'Кыргызстанское Сообщество Любителей Тенниса',",
     "        ru: 'КСЛТ — Кыргызстанское Сообщество Любителей Тенниса',",
     'аббревиатура не повторяется в строке расшифровки'],

    ['снять дом карточки со страницы кортов', СТР,
     '    <script src="../js/kslt-vaucher-kartochka.js?v=1"></script>\n',
     '',
     'страница, зовущая дом карточки, подключает его и дом красок'],

    ['снять дом красок со страницы кортов', СТР,
     '    <script src="../js/kslt-kraska.js?v=5"></script>\n',
     '',
     'страница, зовущая дом карточки, подключает его и дом красок']
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

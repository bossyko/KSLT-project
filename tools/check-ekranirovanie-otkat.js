/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ЭКРАНИРОВАНИЯ. На КОПИИ.
 *
 * Откаты возвращают ВСЕ ТРИ написания слабого приёма, какие нашлись в
 * продукте 19.10, плюс частичное экранирование — то, что гасит двойную
 * кавычку и пропускает одинарную.
 *
 *   node tools/check-ekranirovanie-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-ekran-'));
['js', 'tools', 'tests'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js'), path.join(песок, 'mobile/www/js'),
          { recursive: true });
/* ACORN В ПЕСОК: с 23.10 правило «экранирование объявлено один раз»
   читает ДЕРЕВО. ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО. */
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ФАЙЛЫ = ['js/live-match.js', 'js/scoreboard.js', 'js/sponsors-loader.js',
                'js/player.js', 'js/kslt-ekranirovanie.js',
                'mobile/www/js/screens/home.js', 'js/kslt-sloy.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-ekranirovanie.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ЛМ = 'js/live-match.js', ТБ = 'js/scoreboard.js', СП = 'js/sponsors-loader.js',
      ИГ = 'js/player.js', ЭТ = 'js/kslt-ekranirovanie.js', МБ = 'mobile/www/js/screens/home.js',
      СЛ = 'js/kslt-sloy.js';

/* Полная замена тела — одним куском, чтобы якорь не держался за отступ. */
const ПОЛНОЕ_ЛМ = "    function esc(s) {\n        return String(s == null ? '' : s)\n            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')\n            .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');\n    }";

const ОТКАТЫ = [
    /* ИМЯ БЕЗ КОРНЯ — то, чего правило не видело вовсе до 21.10.
       `экр` не содержит ни `esc`, ни `экран`, и прежний отбор по написанию
       имени пропускал такую функцию молча: докладывал «на сайте слабых
       НОЛЬ», когда их было три. Этот откат доказывает, что кандидата
       теперь находит ТЕЛО, а не имя. */
    ['вернуть слабое экранирование под именем без корня', СЛ,
     ".replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')\n            .replace(/\"/g, '&quot;').replace(/'/g, '&#39;');",
     ".replace(/&/g, '&amp;').replace(/\"/g, '&quot;')\n            .replace(/</g, '&lt;').replace(/>/g, '&gt;');",
     'экранирование на сайте гасит обе кавычки'],

    /* ПОСЛЕ КУСКА 141 СВОИХ ОБЪЯВЛЕНИЙ НА САЙТЕ НЕТ ВОВСЕ, и откаты,
       портившие их тела, остались без якорей — это не поломка прувера, а
       признак, что копии действительно сведены. Откаты переписаны: теперь
       они ЗАВОДЯТ своё объявление заново, каждое своим написанием. */

    /* написание 1: textContent */
    ['завести своё слабое экранирование через textContent', ЛМ,
     "(function() {\n    'use strict';",
     "(function() {\n    'use strict';\n    function esc(s) {\n        if (!s) return '';\n        var d = document.createElement('div');\n        d.textContent = s;\n        return d.innerHTML;\n    }",
     'экранирование на сайте гасит обе кавычки'],

    /* написание 2: createTextNode — его прибор по написанию пропускал */
    ['завести своё слабое через createTextNode', СП,
     "(function() {\n    'use strict';",
     "(function() {\n    'use strict';\n    function esc(str) {\n        if (!str) return '';\n        var d = document.createElement('div');\n        d.appendChild(document.createTextNode(str));\n        return d.innerHTML;\n    }",
     'экранирование на сайте гасит обе кавычки'],

    /* написание 3: ПОЛНОЕ тело рядом с домом — второе определение */
    ['завести на сайте второе полное объявление', ИГ,
     "(function () {",
     "(function () {\n" + ПОЛНОЕ_ЛМ + "\n",
     'экранирование объявлено один раз на весь продукт'],

    /* дом: одинарная кавычка пропущена */
    ['отнять у дома одинарную кавычку', ЭТ,
     ".replace(/\"/g, '&quot;').replace(/'/g, '&#39;');",
     ".replace(/\"/g, '&quot;');",
     'эталон экранирования на месте'],

    /* дом: двойная кавычка пропущена */
    ['отнять у дома двойную кавычку', ЭТ,
     ".replace(/\"/g, '&quot;').replace(/'/g, '&#39;');",
     ".replace(/'/g, '&#39;');",
     'эталон экранирования на месте'],

    /* храповик приложения: рост роняет */
    /* ОТСТУП В ПРИЛОЖЕНИИ ДРУГОЙ — два пробела, не четыре. Якорь взят
       с его собственным отступом, а не с отступом сайта. */
    ['добавить приложению ещё одно слабое — храповик должен упасть', МБ,
     "  function esc(s) {",
     "  function escЕщёОдно(s) {\n    if (!s) return '';\n    var d = document.createElement('div');\n    d.textContent = s;\n    return d.innerHTML;\n  }\n  function esc(s) {",
     'в приложении слабых экранирований не прибавилось']
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

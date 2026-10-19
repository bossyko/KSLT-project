/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ЯЗЫКА ВКЛАДКИ. На КОПИИ.
 *
 *   node tools/check-yazyk-vkladki-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-yazyk-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛИ = { utils: 'js/admin/core/utils.js', news: 'js/admin/sections/news.js' };
const чистые = {};
Object.entries(ЦЕЛИ).forEach(([к, п]) => {
    чистые[к] = fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8');
});

function прогон(правки) {
    Object.entries(ЦЕЛИ).forEach(([к, п]) => {
        fs.writeFileSync(path.join(песок, п), (правки && правки[к]) ? правки[к] : чистые[к]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-yazyk-vkladki.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['убрать общее определение языка вкладки',
     { utils: чистые.utils.replace('function языкВкладки(карта) {', 'function языкВкладкиНет(карта) {') },
     'язык открытой вкладки определён один раз'],

    ['вернуть переводу свой разбор активной вкладки',
     { utils: чистые.utils.replace(
         'var activeLang = card ? языкВкладки(card) : \'\';',
         'var activeLang = \'\';\n        if (card) {\n            var activeTab = card.querySelector(\'.ad-lang-tab.active\');\n            if (activeTab) activeLang = activeTab.dataset.lang;\n        }') },
     'перевод берёт язык у общего определения'],

    ['вернуть предпросмотру жёсткое русское поле',
     { news: чистые.news.replace(
         /var textEl = \(A\.полеВкладки && A\.полеВкладки\([\s\S]*?\)\) \|\| якорьТекста;/,
         'var textEl = якорьТекста;') },
     'предпросмотр читает поле открытой вкладки'],

    ['вернуть времени чтения жёсткое русское поле',
     { news: чистые.news.replace(
         /var contentInput = \(A\.полеВкладки && A\.полеВкладки\([\s\S]*?\)\) \|\| якорьМеты;/,
         'var contentInput = якорьМеты;') },
     'время чтения считается по открытой вкладке'],

    ['навесить слушатель правок только на русское поле',
     { news: чистые.news.replace(
         /\['adNewsContent', 'adNewsContentEn', 'adNewsContentKg'\]\.forEach\(function\(id\) \{\s*\n\s*var поле = document\.getElementById\(id\);/,
         "['adNewsContent'].forEach(function(id) {\n            var поле = document.getElementById(id);") },
     'правки слушаются во всех трёх языковых полях'],

    ['прибить перерисовку к разделу, которого вокруг предпросмотра нет',
     { news: чистые.news.replace(
         "var якорь = document.getElementById('adNewsContent');\n            var коробТекста = якорь && якорь.closest('.ad-form-card');",
         "var коробТекста = document.getElementById('adNewsPreview');\n            коробТекста = коробТекста && коробТекста.closest('.ad-section');") },
     'перерисовка при смене вкладки висит на коробе текста'],

    ['выкинуть языковые поля из сохранения — беда данных',
     { news: чистые.news.replace(/content_en\s*:/g, 'content_en_net:') },
     'сохранение пишет все три языка'],
];

console.log('');
if (прогон(null).упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let плохих = 0;
    ОТКАТЫ.forEach(([имя, правки, ждём]) => {
        const тронуто = Object.entries(правки).some(([к, т]) => т !== чистые[к]);
        if (!тронуто) {
            console.log('  ? ' + имя + '  ->  якорь не сработал, откат не сделан'); плохих++;
            return;
        }
        const р = прогон(правки);
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
}

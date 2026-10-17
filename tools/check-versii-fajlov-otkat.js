/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ВЕРСИИ ФАЙЛОВ» ОТКАТОМ. Работа на КОПИИ.
 *
 * Этот прувер легко подпереть обманом: снять версию у ЧУЖОЙ библиотеки —
 * правило честно промолчит, и откат «пройдёт», ничего не доказав. Поэтому
 * один откат нарочно такой, и от него ждётся МОЛЧАНИЕ.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ ПОДКЛЮЧЕНИЯ, а не на строке: номер версии
 * в якорь не берётся — он поднимается при каждой правке файла, и якорь с
 * номером отваливался бы сам (этой бедой кусок 71 уже болел).
 *
 *   node tools/check-versii-fajlov-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

/* ── копия продукта: только html, js, css, data ──────────────────────── */
const врем = fs.mkdtempSync(path.join(os.tmpdir(), 'versii-'));
function копировать(отн) {
    const ист = path.join(КОРЕНЬ, отн), цель = path.join(врем, отн);
    const ст = fs.statSync(ист);
    if (ст.isDirectory()) {
        fs.mkdirSync(цель, { recursive: true });
        fs.readdirSync(ист).forEach(ф => копировать(path.join(отн, ф)));
    } else fs.copyFileSync(ист, цель);
}
['js', 'css', 'data', 'pages', 'partials', 'maket'].forEach(д => {
    if (fs.existsSync(path.join(КОРЕНЬ, д))) копировать(д);
});
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф => {
    if (fs.existsSync(path.join(КОРЕНЬ, ф))) fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(врем, ф));
});
fs.mkdirSync(path.join(врем, 'tools'));
fs.copyFileSync(path.join(__dirname, 'check-versii-fajlov.js'), path.join(врем, 'tools', 'check-versii-fajlov.js'));

const исходник = {};
function прочесть(отн) { return fs.readFileSync(path.join(врем, отн), 'utf8'); }
function записать(отн, т) { fs.writeFileSync(path.join(врем, отн), т); }

function прогон() {
    try {
        return { код: 0, вывод: execFileSync('node', [path.join(врем, 'tools', 'check-versii-fajlov.js')], { encoding: 'utf8' }) };
    } catch (e) {
        return { код: 1, вывод: (e.stdout || '') + (e.stderr || '') };
    }
}

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    console.log(база.вывод);
    fs.rmSync(врем, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    исходный код правила проходит\n');

/* Откат описан ФУНКЦИЕЙ над текстом, а не парой строк: беда этого захода —
   не подмена значения, а ОТСУТСТВИЕ и РАСХОЖДЕНИЕ номера. */
const ОТКАТЫ = [

['снять версию у своего js', 'index.html',
 т => т.replace(/(src\s*=\s*"[^"]*?\/?scroll-spy\.js)\?v=\d+"/, '$1"'),
 'у своего файла версия есть в каждом подключении'],

['снять версию у своего css', path.join('pages', 'coaches.html'),
 т => т.replace(/(href\s*=\s*"[^"]*?\/?coaches\.css)\?v=\d+"/, '$1"'),
 'у своего файла версия есть в каждом подключении'],

/* ЯКОРЬ СМЕНЁН 17.10. Был `coaches.js`, но после починки прибора имя
   файла — это его ПУТЬ, и `js/admin/sections/coaches.js` подключён
   ровно на одной странице: понизив ему номер, расхождения не получишь.
   Берём `admin.css` — он подключён на двенадцати страницах. */
['отстать одной страницей на старом номере', path.join('pages', 'admin.html'),
 т => т.replace(/(href\s*=\s*"[^"]*?\/?admin\.css\?v=)(\d+)"/, (_, п, в) => п + (Number(в) - 1) + '"'),
 'версия файла одна на весь продукт'],

['отстать СТЕНДОМ — он читает те же css', path.join('maket', '_b3-lestnica.html'),
 т => т.replace(/(href\s*=\s*"[^"]*?\/?tokens\.css\?v=)(\d+)"/, (_, п, в) => п + (Number(в) - 1) + '"'),
 'версия файла одна на весь продукт'],

['подключить один файл дважды', path.join('pages', 'courts.html'),
 т => т.replace(/(<script[^>]*src\s*=\s*"[^"]*?\/?courts\.js\?v=\d+"[^>]*>\s*<\/script>)/, '$1\n$1'),
 'один файл подключён на странице один раз'],

/* ── ОБМАН, КОТОРЫЙ НЕ ПРОЙДЁТ ──
   Чужая библиотека подключается БЕЗ версии и с НАШИМ именем файла. Если
   правило отличает своё от чужого по имени, а не по адресу, оно здесь
   заговорит — и будет неправо: номер библиотеки живёт в адресе CDN. */
['подключить чужую библиотеку с нашим именем и без версии', path.join('pages', 'admin.html'),
 т => т.replace('</head>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/x/1.0.0/scroll-spy.js"></script>\n</head>'),
 null]

];

let бед = 0;
ОТКАТЫ.forEach(([имя, файл, порча, ждём]) => {
    const было = прочесть(файл);
    const стало = порча(было);
    if (стало === было) {
        console.log('  ✗ ' + имя + '  ->  порча не применилась: якорь не найден в ' + файл);
        бед++;
        return;
    }
    записать(файл, стало);
    const р = прогон();
    записать(файл, было);

    if (ждём === null) {
        if (р.код === 0) console.log('  v ' + имя + '  ->  молчит, и это верно');
        else { console.log('  ✗ ' + имя + '  ->  правило заговорило там, где не его дело'); бед++; }
        return;
    }
    if (р.код === 0) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало, откат ничего не доказал'); бед++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ✗ ' + имя + '  ->  упало ДРУГОЕ правило, не «' + ждём + '»'); бед++; }
    else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});

fs.rmSync(врем, { recursive: true, force: true });

if (бед === 0) {
    console.log('\n  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('\n  НЕ ТАК  ' + бед + ' откатов не доказали ничего\n');
    process.exitCode = 1;
}

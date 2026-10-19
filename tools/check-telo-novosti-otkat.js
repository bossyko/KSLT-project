/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ТЕЛА НОВОСТИ. На КОПИИ.
 *
 * Каждый откат возвращает ровно то, от чего правило бережёт, — и требует,
 * чтобы упало ИМЕННО оно. Якоря держатся на содержимом, а не на числе.
 *
 *   node tools/check-telo-novosti-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-telo-'));
['css', 'js', 'pages', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ЦЕЛИ = {
    admin: 'css/admin.css',
    news: 'css/news.css',
    js: 'js/admin/sections/news.js',
    html: 'pages/admin.html'
};
const чистые = {};
Object.entries(ЦЕЛИ).forEach(([к, п]) => {
    чистые[к] = fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8');
});

function прогон(правки) {
    Object.entries(ЦЕЛИ).forEach(([к, п]) => {
        const т = (правки && правки[к]) ? правки[к] : чистые[к];
        fs.writeFileSync(path.join(песок, п), т);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-telo-novosti.js')],
                     { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЬ в admin.css — заголовок блока, который снёс круг 11. Держится на
   пояснении, живущем в файле постоянно. Проверено счётом. */
const ЯКОРЬ_AD = 'ПРЕДПРОСМОТР НОВОСТИ НЕ ОПРЕДЕЛЯЕТ ТЕЛО СТАТЬИ ЗАНОВО';
const разЯкорь = чистые.admin.split(ЯКОРЬ_AD).length - 1;

const ОТКАТЫ = [
    ['вернуть предпросмотру свой кегль заголовка — он снова соврёт',
     { admin: чистые.admin + '\n.ad-news-preview-body h3 { font-size: var(--fs-base); }\n' },
     'предпросмотр не объявляет уровни текста заново'],

    ['вернуть предпросмотру свой цвет тела',
     { admin: чистые.admin + '\n.ad-news-preview-body { color: var(--text-secondary); }\n' },
     'предпросмотр не объявляет уровни текста заново'],

    ['снять с предпросмотра класс читателя — правда не дойдёт',
     { js: чистые.js.replace('class="news-html ad-news-preview-body"',
                             'class="ad-news-preview-body"') },
     'предпросмотр рисуется классом читателя'],

    ['отключить news.css от админки — класс стоит, лестницы нет',
     { html: чистые.html.replace(/<link[^>]*news\.css\?v=\d+[^>]*>/, '') },
     'news.css подключён к странице админки'],

    ['вернуть маркер списка числом мимо восьмёрки',
     { admin: чистые.admin.replace('.ad-editor-area ol { margin: 0 0 var(--space-3); padding-left: var(--space-6); }',
                                   '.ad-editor-area ol { margin: 0 0 var(--space-3); padding-left: 22px; }') },
     'отступы слева в админке стоят на шкале восьмёрки'],

    ['растворить лестницу у читателя — предпросмотру нечего наследовать',
     { news: чистые.news.replace(/\.news-html/g, '.news-html-net') },
     'лестница тела статьи объявлена у читателя'],
];

console.log('');
if (разЯкорь !== 1) {
    console.log('  БЕДА    якорь встречается ' + разЯкорь + ' раз — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else if (прогон(null).упало) {
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

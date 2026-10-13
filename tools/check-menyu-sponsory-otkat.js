/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ПУНКТА «СТАТЬ СПОНСОРОМ» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Каждый откат возвращает ОДНО прежнее состояние и обязан уронить ИМЕННО ТО
 * правило, которое за него отвечает. Якорь держится на содержимом своего
 * блока, а не на положении и не на соседе.
 *
 *   node tools/check-menyu-sponsory-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = [
    'partials/header-ru.html', 'partials/header-en.html', 'partials/header-kg.html',
    'partials/footer-ru.html', 'partials/footer-en.html', 'partials/footer-kg.html',
    'tools/build-partials.js', 'css/style.css',
    'index.html', 'pages/about.html', 'pages/about-en.html', 'pages/about-kg.html',
    'pages/admin.html',
    'pages/sponsors.html', 'pages/sponsors-en.html', 'pages/sponsors-kg.html',
];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const ШР = 'partials/header-ru.html', ШЕ = 'partials/header-en.html', ШК = 'partials/header-kg.html';
const ПР = 'partials/footer-ru.html', ПЕ = 'partials/footer-en.html', ПК = 'partials/footer-kg.html';
const СБ = 'tools/build-partials.js', СТ = 'css/style.css', АД = 'pages/admin.html';

const П = '                        ';   // отступ пункта в образце

const ОТКАТЫ = [

['убрать пункт из десктопной панели (ru)', ШР,
 П + '<a href="{{P}}sponsors.html" class="nav-dropdown-item">Стать спонсором</a>\n',
 '',
 'в десктопной панели «Инфо» (ru) есть пункт спонсоров'],

['убрать пункт из мобильного списка (en)', ШЕ,
 П + '<li><a href="{{P}}sponsors-en.html">Become a sponsor</a></li>\n',
 '',
 'в мобильном списке «Инфо» (en) есть пункт спонсоров'],

['убрать пункт из десктопной панели (kg)', ШК,
 П + '<a href="{{P}}sponsors-kg.html" class="nav-dropdown-item">Демөөрчү болуу</a>\n',
 '',
 'в десктопной панели «Инфо» (kg) есть пункт спонсоров'],

['вернуть подвал en без ссылки на спонсоров', ПЕ,
 '                    <li><a href="{{P}}sponsors-en.html">Become a sponsor</a></li>\n' +
 '                    <li><a href="{{P}}sponsors-en.html#current">Our sponsors</a></li>\n',
 '',
 'подвал (en) ведёт на страницу спонсоров'],

['вернуть подвал kg без ссылки на спонсоров', ПК,
 '                    <li><a href="{{P}}sponsors-kg.html">Демөөрчү болуу</a></li>\n' +
 '                    <li><a href="{{P}}sponsors-kg.html#current">Биздин демөөрчүлөр</a></li>\n',
 '',
 'подвал (kg) ведёт на страницу спонсоров'],

['убрать ссылку спонсоров из русского подвала', ПР,
 '                    <li><a href="{{P}}sponsors.html">Стать спонсором</a></li>\n' +
 '                    <li><a href="{{P}}sponsors.html#current">Наши спонсоры</a></li>\n',
 '',
 'подвал (ru) ведёт на страницу спонсоров'],

['переставить пункт за «скачать» в панели (ru)', ШР,
 П + '<a href="{{P}}sponsors.html" class="nav-dropdown-item">Стать спонсором</a>\n' +
 П + '<a href="{{P}}download.html" class="nav-dropdown-item">',
 П + '<a href="{{P}}download.html" class="nav-dropdown-item">',
 'пункт спонсоров стоит перед «скачать» в панели (ru)'],

['переставить пункт за «скачать» в мобильном списке (en)', ШЕ,
 П + '<li><a href="{{P}}sponsors-en.html">Become a sponsor</a></li>\n' +
 П + '<li><a href="{{P}}download-en.html">',
 П + '<li><a href="{{P}}download-en.html">',
 'пункт спонсоров стоит перед «скачать» в мобильном списке (en)'],

['потерять один пункт «Инфо» на kg', ШК,
 П + '<a href="{{P}}faq-kg.html" class="nav-dropdown-item">FAQ</a>\n',
 '',
 'наборы пунктов «Инфо» на трёх языках равной длины'],

['вернуть пределу панели прежние 400', СТ,
 '.mobile-nav-dropdown.active .mobile-dropdown-menu {\n    max-height: 500px;',
 '.mobile-nav-dropdown.active .mobile-dropdown-menu {\n    max-height: 400px;',
 'предел мобильной панели вмещает список «Инфо» целиком'],

['зашить путь к спонсорам мимо подстановки', ШР,
 '<a href="{{P}}sponsors.html" class="nav-dropdown-item">Стать спонсором</a>',
 '<a href="pages/sponsors.html" class="nav-dropdown-item">Стать спонсором</a>',
 'путь к спонсорам в образцах идёт через {{P}}'],

['убрать страницу спонсоров из карты разделов', СБ,
 "    'sponsors': 'info',\n",
 '',
 'карта разделов знает страницу спонсоров'],

['вернуть en аренду кортов в блок партнёров', ПЕ,
 '                    <li><a href="{{P}}sponsors-en.html#current">Our sponsors</a></li>\n',
 '                    <li><a href="{{P}}sponsors-en.html#current">Our sponsors</a></li>\n' +
 '                    <li><a href="{{P}}courts-en.html">Court rental</a></li>\n',
 'блок партнёров несёт один набор ссылок на трёх языках'],

['вернуть kg заголовок «Өнөктөштөргө»', ПК,
 '<h4>Демөөрчүлөргө жана өнөктөштөргө</h4>',
 '<h4>Өнөктөштөргө</h4>',
 'блок партнёров (kg) называет спонсоров в заголовке'],

['оставить админку с панелью, но без пункта', АД,
 '<a href="sponsors.html" class="nav-dropdown-item">Стать спонсором</a>\n',
 '',
 'ни одна страница с панелью «Инфо» не осталась без пункта'],

['оставить админку с мобильным меню, но без пункта', АД,
 '<li><a href="sponsors.html">Стать спонсором</a></li>\n',
 '',
 'ни одна страница с мобильным «Инфо» не осталась без пункта'],

];

/** Отдельный откат: страницы просто нет на диске. */
const ПРОПУСК = ['убрать с диска киргизскую страницу спонсоров',
                 'pages/sponsors-kg.html',
                 'страница спонсоров есть на всех трёх языках'];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-menyu-'));
['css', 'js', 'pages', 'partials', 'tools'].forEach(д =>
    fs.mkdirSync(path.join(песок, д), { recursive: true }));
fs.writeFileSync(path.join(песок, 'tools', 'check-menyu-sponsory.js'),
                 fs.readFileSync(path.join(__dirname, 'check-menyu-sponsory.js')));

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        const цель = path.join(песок, ф);
        if (замена && замена.пропустить === ф) { if (fs.existsSync(цель)) fs.rmSync(цель); return; }
        fs.writeFileSync(цель, замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-menyu-sponsory.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-menyu-sponsory.js.');
    console.log(база.вывод); process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)  { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

(function () {
    const [имя, ф, ждём] = ПРОПУСК;
    const р = прогон({ пропустить: ф });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
})();

const ВСЕГО = ОТКАТЫ.length + 1;
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ВСЕГО + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ВСЕГО + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

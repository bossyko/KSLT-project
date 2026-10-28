#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ЛЕНТЫ И ГРУППЫ (кусок 220). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lenta-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'js/kslt-lenta.js', 'js/kslt-ekranirovanie.js', 'js/kslt-setka.js',
 'tools/check-lenta-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-lenta-prilozheniya.js')],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'ЯКОРЬ встречается ' + n + ' раз в ' + отн;
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}
function вернуть(отн) { fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн)); }

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const H = 'mobile/www/index.html';
const M = 'mobile/www/js/news-media.js';
const G = 'mobile/www/js/screens/home.js';
const C = 'mobile/www/css/app.css';
const L = 'mobile/www/js/kslt-lenta.js';
const E = 'mobile/www/js/kslt-ekranirovanie.js';
const S = 'js/kslt-setka.js';

const ОТКАТЫ = [
    ['дом ленты не подключён', H,
     '<script src="js/kslt-lenta.js?v=1"></script>\n',
     '',
     'дом ленты лежит в приложении и подключён'],

    ['копия дома ленты уехала', L,
     "    var ПОДПИСЬ = 'Открыть';",
     "    var ПОДПИСЬ = 'Открыть'; // уехало",
     'копия общего файла совпадает: лента кадров'],

    ['копия экранирования уехала', E,
     '    window.KSLT_экранировать = function (значение) {',
     '    window.KSLT_экранировать = function (значение) { /* уехало */',
     'копия общего файла совпадает: экранирование'],

    ['приложение снова собирает ленту само', M,
     '      KSLT_LENTA.собрать(root, подпись);',
     '      function собратьСнимкиВТексте() {}',
     'ленту собирает дом, а не приложение'],

    ['ленты рисуются, но не заводятся', M,
     '        KSLT_LENTA.завести(wrap, кадры, подпись);',
     '',
     'каждая лента заводится, а не только рисуется'],

    ['просмотр отвязан от ленты', M,
     "    var КАДР_ЛЕНТЫ = '.news-carousel-kadr, .news-carousel-main';",
     "    var КАДР_ЛЕНТЫ = '.net-takogo';",
     'просмотр открывается с кадра ленты'],

    ['крупный кадр снова обрезается', C,
     '.news-carousel-main { width: 100%; height: 100%; object-fit: contain; display: block; }',
     '.news-carousel-main { width: 100%; height: 100%; object-fit: cover; display: block; }',
     'крупный кадр ленты показывается целиком'],

    ['миниатюра снова обрезается', C,
     '.news-carousel-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; }',
     '.news-carousel-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }',
     'миниатюра показывает тот же кадр целиком'],

    ['порядок колонок снова зашит', S,
     '        h += итогВперёд ? (шапкаИтога + шапкаВстреч) : (шапкаВстреч + шапкаИтога);',
     '        h += шапкаВстреч + шапкаИтога;',
     'порядок колонок — настройка дома, а не его жёсткий вид'],

    ['приложение вернуло итог в хвост', G,
     '        итогВперёд: true,',
     '',
     'приложение ставит итог вперёд'],

    ['имя снова уезжает при ходе вбок', C,
     '  position: sticky;\n  z-index: 1;\n  background: var(--bg);',
     '  position: static;\n  z-index: 1;\n  background: var(--bg);',
     'номер и имя не уезжают при боковом ходе'],

    ['сетка снова открывается слева', G,
     "      if (поКругам[rn].some(function (m) { return m.status === 'completed'; })) последний = i;",
     '      последний = -1;',
     'сетка подводится к последнему сыгранному кругу'],

    ['прокрутка считается до показа', G,
     '    if (!полоса || !полоса.clientWidth) return;   // ещё скрыта',
     '    if (!полоса) return;',
     'прокрутка применяется при ПОКАЗЕ вкладки']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    const стр = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) { console.log(стр + '\n      ✗ ' + беда); плохо++; return; }
    const р = прогон();
    вернуть(файл);
    if (р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0) {
        console.log(стр + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(стр + '\n      ✗ ждали падения «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 3)
            .map(с => '        ' + с.trim()).join('\n'));
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не уронило своё правило: ' + плохо + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили ИМЕННО своё правило\n');
}

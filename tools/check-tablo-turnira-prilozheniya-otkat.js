#!/usr/bin/env node
/** ПРУВЕР ЗАМОРОЗКИ ТАБЛО ТУРНИРА (куски 221-225). Работает на КОПИИ. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-tablo-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}
['mobile/www', 'js/kslt-setka.js', 'js/kslt-rules.js',
 'tools/check-tablo-turnira-prilozheniya.js'].forEach(копировать);

function прогон() {
    const з = spawnSync(process.execPath,
        [path.join(песок, 'tools', 'check-tablo-turnira-prilozheniya.js')],
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

const CSS = 'mobile/www/css/app.css';
const ГЛ = 'mobile/www/js/screens/home.js';
const ОБ = 'mobile/www/js/app.js';
const СЕТ = 'js/kslt-setka.js';
const ПРВ = 'js/kslt-rules.js';
const КОПИЯ = 'mobile/www/js/kslt-setka.js';

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const ОТКАТЫ = [
    ['косая между партнёрами убрана', CSS,
     ".tm-p:not(:last-child)::after { content: ' /'; color: var(--text-muted); }",
     ".tm-p:not(:last-child)::after { content: ''; }",
     'пара разделена косой, а не просто двумя строками'],

    ['имя снова не один блок', CSS,
     '.tm-pair { display: block; overflow: hidden; text-align: inherit; }',
     '.tm-pair { display: inline; text-align: inherit; }',
     'имя — один блок, иначе посев уезжает над ним'],

    ['посев перестал плавать', CSS,
     '.td-gt-name .td-gt-seed { float: left; margin-right: var(--space-1); }',
     '.td-gt-name .td-gt-seed { margin-right: var(--space-1); }',
     'посев плавает слева, а имя обтекает его справа'],

    ['колонка имени вернулась к 120', CSS,
     '  min-width: 152px; color: var(--text);',
     '  min-width: 120px; color: var(--text);',
     'колонка имени 152 — ЗАМЕРЕННАЯ, а не задуманная'],

    ['пара снова пишется полными именами', ГЛ,
     "'<span class=\"tm-pair\"><span class=\"tm-p\">' + коротко(капитан) + '</span>' +",
     "'<span class=\"tm-pair\"><span class=\"tm-p\">' + капитан + '</span>' +",
     'пара в таблице группы пишется сокращённо, одиночник — целиком'],

    ['третье место снова дописывается после сетки', ГЛ,
     '      опции.хвост = хвост + \'</div>\';',
     '      var брошенныйХвост = хвост + \'</div>\';',
     'матч за третье место отдаётся ХВОСТОМ последнего круга'],

    ['дом перестал вставлять хвост в последний столбец', СЕТ,
     '            if (i === круги.length - 1 && опции.хвост) h += опции.хвост;\n',
     '',
     'дом вставляет хвост ВНУТРЬ последнего столбца'],

    ['BYE снова печатается дважды', СЕТ,
     "        if (этоПроход) { сырые = []; исход = ''; }\n",
     '',
     'при проходе BYE пишется ОДИН раз'],

    ['отсечка снята с Очков', ГЛ,
     'data-cut-block="results"',
     'data-cut-block="rezultaty"',
     'отсечка стоит и на Очках'],

    ['число строк снова считается по DOM', ГЛ,
     "' data-total=\"' + всего + '\" aria-expanded=\"false\">' +",
     "' aria-expanded=\"false\">' +",
     'число строк в кнопке отсечки кладётся ПРИ СБОРКЕ, а не считается по DOM'],

    ['накладка снова закрывает нижнюю панель', CSS,
     '  top: 0; bottom: calc(var(--tab-height) + var(--safe-bottom));\n  left: 0; right: 0;\n  margin: 0 auto;',
     '  top: 0; bottom: 0;\n  left: 0; right: 0;\n  margin: 0 auto;',
     'накладка-подробность не закрывает нижнюю панель'],

    ['Live снова во весь экран', CSS,
     '  top: 0; bottom: calc(var(--tab-height) + var(--safe-bottom));\n  left: 0; right: 0;\n  max-width: 440px;',
     '  top: 0; bottom: 0;\n  left: 0; right: 0;\n  max-width: 440px;',
     'полноэкранный Live тоже оставляет панель'],

    ['кнопка перестала закрывать Live', ОБ,
     "querySelectorAll('.td-overlay.open, .live-full.open')",
     "querySelectorAll('.td-overlay.open')",
     'нижняя кнопка закрывает и накладки, и Live'],

    ['подпись меню снова по центру', CSS,
     '\n  text-align: left;\n}\n.menu-item .menu-badge {',
     '\n}\n.menu-item .menu-badge {',
     'подпись в боковом меню по левому краю'],

    ['мировая запись убрана из дома правил', ПРВ,
     '    R.сетПоМировому = function (a, b) {',
     '    R.сетПоСвоему = function (a, b) {',
     'мировая запись тай-брейка живёт в доме правил'],

    ['новый счёт снова сохраняется как ввели', ПРВ,
     '            var п = R.сетПоМировому(a, b);\n            сеты.push(п[0] + \'/\' + п[1]);',
     "            сеты.push(a + '/' + b);",
     'новый счёт сохраняется сразу по мировой записи'],

    ['клетка сетки перестала приводить счёт', СЕТ,
     '            ? global.KSLT_RULES.счётПоМировому(м.score) : м.score;',
     '            ? м.score : м.score;',
     'клетка сетки показывает счёт по мировой записи'],

    ['переворот снова по парам цифр', ПРВ,
     "        return String(счёт).trim().split(/\\s+/).map(function (с) {\n            var i = с.indexOf('/');\n            return i < 0 ? с : с.slice(i + 1) + '/' + с.slice(0, i);\n        }).join(' ');",
     "        return String(счёт).replace(/(\\d+)\\/(\\d+)/g, '$2/$1');",
     'переворот счёта переставляет СТОРОНЫ, а не пары цифр'],

    ['копия дома разошлась с сайтом', КОПИЯ,
     '    global.KSLT_SETKA = S;',
     '    global.KSLT_SETKA = S; /* шов */',
     'копии домов в приложении совпадают с сайтом до байта']
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

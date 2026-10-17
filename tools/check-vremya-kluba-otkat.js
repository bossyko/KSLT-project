/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ВРЕМЕНИ КЛУБА. На КОПИИ.
 *
 *   node tools/check-vremya-kluba-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vremya-'));
['js', 'pages', 'maket', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
['index.html', 'index-en.html', 'index-kg.html'].forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, ф), path.join(песок, ф)));

const ДОМ = 'js/kslt-vremya.js', АДМ = 'js/admin/sections/finances.js',
      ПУБ = 'js/player.js', КАБ = 'js/dashboard.js', СТР = 'pages/admin.html';
const исходник = {};
[ДОМ, АДМ, ПУБ, КАБ, СТР].forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    [ДОМ, АДМ, ПУБ, КАБ, СТР].forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-vremya-kluba.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const Я_ЗОНА = "    var ЗОНА = 'Asia/Bishkek';";
const Я_ДЕНЬ = '        return d.toLocaleDateString(\'sv-SE\', { timeZone: ЗОНА });';
const Я_СЕГОДНЯ = '    В.сегодня = function () { return В.деньПоБишкеку(); };';
const Я_АДМ = 'var today = KSLT_VREMYA.сегодня();';
const Я_ПУБ = 'var today = KSLT_VREMYA.сегодня();';
const Я_КАБ = '    var DB_TZ = window.KSLT_VREMYA.зона;';
/* ЯКОРЬ БЕЗ НОМЕРА ВЕРСИИ: он растёт с каждой правкой дома, и откат,
   держащийся за число, умрёт на первой же. */
const Я_СТР = (исходник => {
    const m = исходник.match(/[ \t]*<script src="\.\.\/js\/kslt-vremya\.js\?v=\d+"><\/script>\n/);
    return m ? m[0] : '';
})(fs.readFileSync(path.join(КОРЕНЬ, 'pages/admin.html'), 'utf8'));

const ОТКАТЫ = [
    ['вернуть зашитое смещение вместо имени зоны', ДОМ,
     т => т.replace(Я_ДЕНЬ,
        '        var СМЕЩЕНИЕ_МИНУТ = 360;\n' +
        '        return new Date(d.getTime() + СМЕЩЕНИЕ_МИНУТ * 60000).toISOString().slice(0, 10);'),
     'дом времени считает день ПО ИМЕНИ ЗОНЫ'],

    ['снять у дома «сегодня»', ДОМ,
     т => т.replace(Я_СЕГОДНЯ, ''),
     'дом отдаёт и «сегодня», и день любого момента'],

    ['вернуть день по Гринвичу в админку', АДМ,
     т => т.replace(Я_АДМ, "var today = new Date().toISOString().slice(0, 10);"),
     'день нигде не берётся по Гринвичу'],

    ['вернуть день по Гринвичу в публичную часть', ПУБ,
     т => т.replace(Я_ПУБ, "var today = new Date().toISOString().split('T')[0];"),
     'день нигде не берётся по Гринвичу'],

    ['завести ВТОРОЕ имя зоны в кабинете', КАБ,
     т => т.replace(Я_КАБ, "    var DB_TZ = 'Asia/Bishkek';"),
     'имя зоны живёт в одном файле'],

    ['снять дом со страницы админки', СТР,
     т => т.replace(Я_СТР, ''),
     'дом времени подключён на каждой странице, где его зовут'],
];

console.log('');
const якорей = [[ДОМ, Я_ДЕНЬ], [ДОМ, Я_СЕГОДНЯ], [КАБ, Я_КАБ], [СТР, Я_СТР]];
const нет = якорей.filter(([ф, я]) => исходник[ф].split(я).length !== 2);
if (нет.length) {
    console.log('  БЕДА    якорь не единственный или отсутствует: ' +
        нет.map(([ф, я]) => ф + ' / ' + я.trim().slice(0, 40)).join(' | ') + '\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else if (прогон(null).упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let плохих = 0;
    ОТКАТЫ.forEach(([имя, ф, порча, ждём]) => {
        const испорчен = порча(исходник[ф]);
        if (испорчен === исходник[ф]) {
            console.log('  ? ' + имя + '  ->  якорь не сработал'); плохих++; return;
        }
        const р = прогон({ файл: ф, текст: испорчен });
        if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
        else if (р.вывод.indexOf(ждём) === -1) {
            console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
        } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
    });
    прогон(null);
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

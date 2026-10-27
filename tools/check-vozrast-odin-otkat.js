/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ВОЗРАСТА (кусок 189). На КОПИИ.
 *   node tools/check-vozrast-odin-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Три из пяти откатов возвращают ровно те числа, что стояли в
 * документах до 27.10: 14 в русских Условиях, 13 в английских, 13 в
 * кыргызских.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vozrast-'));
['pages', 'tools', 'mobile'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const RU = 'pages/terms.html', EN = 'pages/terms-en.html', KG = 'pages/terms-kg.html',
      OFF = 'pages/offer.html', МОБ = 'mobile/www/index.html';
const ФАЙЛЫ = [RU, EN, KG, OFF, МОБ];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правка) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            правка && правка[0] === ф ? исходник[ф].replace(правка[1], правка[2]) : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-vozrast-odin.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть 14 в русские Условия',
     [RU, 'достигшим 18 лет', 'достигшим 14 лет'],
     'во всех документах возраст ОДИН И ТОТ ЖЕ'],

    ['вернуть 13 в английские Условия',
     [EN, 'persons aged 18 and older', 'persons aged 13 and older'],
     'во всех документах возраст ОДИН И ТОТ ЖЕ'],

    ['вернуть 13 в кыргызские Условия',
     [KG, 'Платформа 18 жаштан', 'Платформа 13 жаштан'],
     'во всех документах возраст ОДИН И ТОТ ЖЕ'],

    /* Все пять разом на одно и то же чужое число: правило равенства
       молчит — падает ровно правило «совпадает с решением». */
    ['увести ВСЕ документы на одно чужое число',
     null, 'возраст совпадает с решением'],

    ['переписать фразу о возрасте в английских Условиях',
     [EN, 'The platform is available to persons aged', 'This service may be used by people aged'],
     'фраза о возрасте на месте во всех названных документах'],

    ['заставить приложение называть возраст само',
     [МОБ, '</body>', '<p>16 лет</p>\n</body>'],
     'приложение не называет возраст само']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, правка, ждём]) => {
    if (правка) {
        const n = исходник[правка[0]].split(правка[1]).length - 1;
        if (n !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз в ' + правка[0]); плохих++; return; }
    }
    let р;
    if (правка) { р = прогон(правка); }
    else {
        /* пятый откат: меняем решение в самом стороже на копии */
        const сп = path.join(песок, 'tools', 'check-vozrast-odin.js');
        const было = fs.readFileSync(sp_путь(), 'utf8');
        fs.writeFileSync(сп, было.replace("const РЕШЕНО = '18';", "const РЕШЕНО = '16';"));
        ФАЙЛЫ.forEach(ф => fs.writeFileSync(path.join(песок, ф), исходник[ф]));
        try { execFileSync(process.execPath, [сп], { encoding: 'utf8' }); р = { упало: false, вывод: '' }; }
        catch (e) { р = { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
        fs.writeFileSync(сп, было);
    }
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
function sp_путь() { return path.join(песок, 'tools', 'check-vozrast-odin.js'); }
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}

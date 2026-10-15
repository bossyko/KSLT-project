/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «МЁРТВОЕ И ЛИШНЕЕ» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Якоря держатся на СОДЕРЖИМОМ. Это правило особенно легко подпереть
 * обманом: достаточно вернуть класс, который прибор сочтёт живым по
 * склейке, — и откат «пройдёт», ничего не доказав. Поэтому возвращаемые
 * имена нарочно такие, под которые в коде нет ни одного префикса.
 *
 *   node tools/check-mertvoe-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'css/tournaments.css', 'css/player.css', 'js/player.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const S = 'css/style.css', T = 'css/tournaments.css', PC = 'css/player.css', PJ = 'js/player.js';

const ОТКАТЫ = [

/* ── пересчёт мёртвых классов ── */
['вернуть мёртвый класс в общий файл', S,
 '\nh2 {',
 '\n.pozabytyy-klass-bez-razmetki { color: red; }\nh2 {',
 'мёртвых классов в публичной части не осталось'],

['вернуть мёртвое семейство на страницу турниров', T,
 '.trn-block-empty',
 '.past-tournament-card { display: grid; }\n.trn-block-empty',
 'мёртвых классов в публичной части не осталось'],

['вернуть мёртвый класс на страницу игрока', PC,
 '.pp-badges-empty {',
 '.pp-challenge-venue { color: red; }\n.pp-badges-empty {',
 'мёртвых классов в публичной части не осталось'],

/* ── выдуманные данные ── */
['вернуть выдуманные турниры', PJ,
 '    function loadRealTournaments(data) {',
 '    function generateTournaments(data) {\n' +
 '        var results = L.tournamentResults;\n' +
 '        return L.tournamentNames.map(function (name) { return { name: name }; });\n' +
 '    }\n' +
 '    function loadRealTournaments(data) {',
 'выдуманных турниров на странице игрока нет'],

['вернуть мок-историю матчей', PJ,
 '    function loadRealTournaments(data) {',
 '    function generateMatchHistory(data) { return []; }\n' +
 '    function loadRealTournaments(data) {',
 'выдуманной истории матчей нет'],

['увести язык из пустого состояния турниров', PJ,
 "Турнирлер учурда жеткиликсиз",
 "Tournaments are not available right now",
 'пустое состояние говорит, ПОЧЕМУ пусто'],

/* ── словарь ── */
['сделать словарь одноязычным', PJ,
 'var L = window.playerProfileLabels || (isEn ? {',
 'var L = window.playerProfileLabels || ({',
 'словарь страницы игрока знает три языка'],

['завести в словаре ключ, которого никто не зовёт', PJ,
 "    var L = window.playerProfileLabels || (isEn ? {\n        online: 'Online',",
 "    var L = window.playerProfileLabels || (isEn ? {\n        nikomuNeNuzhnyyKlyuch: 'nobody calls me',\n        online: 'Online',",
 'в словаре нет ключей, которых не зовёт никто']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-mertvoe-'));
['css', 'js', 'pages', 'tools', 'maket', 'partials', 'index.html', 'index-en.html', 'index-kg.html']
    .forEach(д => {
        const от = path.join(КОРЕНЬ, д), до = path.join(песок, д);
        if (fs.existsSync(от)) fs.cpSync(от, до, { recursive: true });
    });

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф),
                замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-mertvoe.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-mertvoe.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].split(что).join(на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «СТОРОНА — ОДНО ОПРЕДЕЛЕНИЕ» ОТКАТОМ. На КОПИИ.
 *
 * Правило про тона ПЕРЕСЧИТЫВАЕТ, поэтому главный откат здесь — не
 * возврат старого числа, а ЛЮБАЯ новая краска, вставшая рядом со
 * стороной. Если правило держит только прежний `#FF7043`, оно ничего не
 * сторожит: завтра кто-то заведёт свой оранжевый под другим именем.
 *
 *   node tools/check-storona-odno-opredelenie-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tokens.css', 'css/battle-cards.css', 'css/battles-overview.css', 'css/challenge-detail.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const T = 'css/tokens.css', BC = 'css/battle-cards.css',
      BO = 'css/battles-overview.css', CH = 'css/challenge-detail.css';

const ОТКАТЫ = [

['вернуть красный полосе стороны', BC,
 '.bc-bar-p1 {\n    height: 100%;\n    background: var(--player-1);',
 '.bc-bar-p1 {\n    height: 100%;\n    background: #DC2828;',
 'сторона игрока определена ОДИН раз'],

['вернуть синий второй стороне', BO,
 '.bo-bar-p2 {\n    background: var(--player-2);',
 '.bo-bar-p2 {\n    background: #2563EB;',
 'сторона игрока определена ОДИН раз'],

['вернуть тёмную краску процентам', BC,
 '.bc-pct-p1 { color: var(--player-1); }',
 '.bc-pct-p1 { color: #B91C1C; }',
 'проценты голосования читаются на тёмном'],

['увести полосу вызова на синий из шкалы', CH,
 '.ch-bar-right {\n    background: var(--player-2);',
 '.ch-bar-right {\n    background: var(--blue-500);',
 'сторона игрока определена ОДИН раз'],

/* ── тона: правило ПЕРЕСЧИТЫВАЕТ ── */
['вернуть прежний оранжевый второй стороне', T,
 '  --player-2: #D050F7;',
 '  --player-2: #FF7043;',
 'стороны стоят в свободных тонах'],

['поставить сторону вплотную к опасности', T,
 '  --player-2: #D050F7;',
 '  --player-2: #F75069;',
 'стороны стоят в свободных тонах'],

['поставить сторону вплотную к успеху', T,
 '  --player-2: #D050F7;',
 '  --player-2: #50F77E;',
 'стороны стоят в свободных тонах'],

['объявить токен стороны второй раз', T,
 '  --player-2: #D050F7;',
 '  --player-2: #D050F7;\n  --player-2: #FF7043;',
 '--player-1 и --player-2 объявлены по одному разу'],

/* ── МОЛЧАНИЕ ── */
['сторона в другом свободном тоне — правило МОЛЧИТ', T,
 '  --player-2: #D050F7;',
 '  --player-2: #F750CD;',
 null],

['красный в ОТКАЗЕ — правило МОЛЧИТ', BC,
 '.bc-dt-item',
 '.bc-dt-item-ПРОБА { color: #ef4444; background: rgba(220, 40, 40, 0.12); }\n.bc-dt-item',
 null]

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-storona-'));
['css', 'tools'].forEach(д => {
    const от = path.join(КОРЕНЬ, д), до = path.join(песок, д);
    if (fs.existsSync(от)) fs.cpSync(от, до, { recursive: true });
});

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф),
                замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-storona-odno-opredelenie.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят правило.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    if (исходник[ф].indexOf(что) === -1) {
        console.log('  ? ' + имя); console.log('      якоря нет в ' + ф + ': ' + что.split('\n')[0]); плохих++; return;
    }
    const i = исходник[ф].indexOf(что);
    const текст = исходник[ф].slice(0, i) + на + исходник[ф].slice(i + что.length);
    const р = прогон({ файл: ф, текст });
    if (ждём === null) {
        if (р.упало) { console.log('  x ' + имя); console.log('      правило упало там, где должно МОЛЧАТЬ'); плохих++; }
        else console.log('  v ' + имя + '  ->  молчит, и это верно');
        return;
    }
    if (!р.упало) { console.log('  x ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

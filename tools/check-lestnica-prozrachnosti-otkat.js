/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ЛЕСТНИЦА ПРОЗРАЧНОСТИ» ОТКАТОМ. Работа на КОПИИ.
 *
 * Этот прувер легко подпереть обманом: вернуть число, основа которого вне
 * шкалы (красный, золото), — правило честно промолчит, и откат «пройдёт»,
 * ничего не доказав. Поэтому один откат нарочно такой, и от него ждётся
 * МОЛЧАНИЕ, а остальные возвращают ровно то явление, за которое отвечает
 * названное правило.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ блока, а не на положении: все пять правил
 * ПЕРЕСЧИТЫВАЮТ файлы целиком.
 *
 *   node tools/check-lestnica-prozrachnosti-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tokens.css', 'css/coaches.css', 'css/services.css',
                'css/battle-cards.css', 'css/battles-overview.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const T = 'css/tokens.css', C = 'css/coaches.css', S = 'css/services.css',
      B = 'css/battle-cards.css', BO = 'css/battles-overview.css';

const ОТКАТЫ = [

/* ── число вместо имени ── */
['вернуть белую прозрачность числом', C,
 '    border: var(--bw-hair) solid var(--alpha-white-04);\n    font-size: var(--fs-sm);',
 '    border: var(--bw-hair) solid rgba(255,255,255,0.04);\n    font-size: var(--fs-sm);',
 'белая и чёрная прозрачность записана именем'],

['вернуть чёрное затемнение числом', S,
 '        var(--alpha-black-50) 0%,',
 '        rgba(0,0,0,0.5) 0%,',
 'белая и чёрная прозрачность записана именем'],

/* ── ступень чужой роли ── */
['дать подложке ступень, которой у подложки нет', S,
 '        var(--alpha-black-50) 0%,',
 '        var(--alpha-black-90) 0%,',
 'ступень берётся по РОЛИ, а не одна на всё'],

['дать границе ступень текста', C,
 '    border: var(--bw-hair) solid var(--alpha-white-04);\n    font-size: var(--fs-sm);',
 '    border: var(--bw-hair) solid var(--alpha-white-72);\n    font-size: var(--fs-sm);',
 'ступень берётся по РОЛИ, а не одна на всё'],

/* ── текст ниже порога ── */
['опустить имя игрока на тихую ступень', B,
 '    color: var(--alpha-white-72);\n}',
 '    color: var(--alpha-white-35);\n}',
 'прозрачный текст не падает ниже AA'],

/* ── второе имя на одну ступень ── */
['завести ступени второе имя', T,
 '  --alpha-white-20:',
 '  --alpha-white-20-bis: rgba(255, 255, 255, 0.20);\n  --alpha-white-20:',
 'у ступени шкалы одно имя'],

/* ── долг по контролам ── */
['завести новую границу контрола числом мимо списка', BO,
 '.bo-vote-btn {\n    flex: 1;',
 '.bo-vote-nado input[type="checkbox"] {\n    border: 1px solid rgba(255,255,255,0.07);\n}\n\n.bo-vote-btn {\n    flex: 1;',
 'долг по границам контролов не растёт молча'],

['поменять альфу у места из списка долга', BO,
 'border: var(--bw-hair) solid rgba(255,255,255,0.15);',
 'border: var(--bw-hair) solid rgba(255,255,255,0.45);',
 'долг по границам контролов не растёт в значении'],

/* ── ОБМАН, КОТОРЫЙ НЕ ПРОЙДЁТ: основа вне шкалы ── */
['число с основой вне шкалы правило НЕ трогает', C,
 '    border: var(--bw-hair) solid var(--alpha-white-04);\n    font-size: var(--fs-sm);',
 '    border: var(--bw-hair) solid rgba(233,184,36,0.08);\n    font-size: var(--fs-sm);',
 null]

];

/* ── прогон на копии ──────────────────────────────────────────────────── */

const врем = fs.mkdtempSync(path.join(os.tmpdir(), 'lestnica-'));
fs.mkdirSync(path.join(врем, 'css'));
fs.mkdirSync(path.join(врем, 'tools'));
fs.readdirSync(path.join(КОРЕНЬ, 'css')).forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, 'css', ф), path.join(врем, 'css', ф)));
fs.copyFileSync(path.join(__dirname, 'check-lestnica-prozrachnosti.js'),
                path.join(врем, 'tools', 'check-lestnica-prozrachnosti.js'));

const чистый = {};
ФАЙЛЫ.forEach(ф => { чистый[ф] = fs.readFileSync(path.join(врем, ф), 'utf8'); });

function прогон() {
    try {
        return { код: 0, вывод: execFileSync('node',
            [path.join(врем, 'tools', 'check-lestnica-prozrachnosti.js')],
            { encoding: 'utf8' }) };
    } catch (e) {
        return { код: 1, вывод: (e.stdout || '') + (e.stderr || '') };
    }
}

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    console.log(база.вывод);
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
}

let бед = 0;
ОТКАТЫ.forEach(([имя, ф, якорь, замена, ждём]) => {
    const было = чистый[ф];
    const сколько = было.split(якорь).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + имя + '  ->  якорь встречается ' + сколько + ' раз, нужен ровно один');
        бед++;
        return;
    }
    fs.writeFileSync(path.join(врем, ф), было.replace(якорь, замена));
    const р = прогон();
    fs.writeFileSync(path.join(врем, ф), было);

    if (ждём === null) {
        if (р.код === 0) console.log('  v ' + имя + '  ->  молчит, и это верно');
        else { console.log('  ✗ ' + имя + '  ->  правило заговорило там, где не его дело'); бед++; }
        return;
    }
    if (р.код === 0) {
        console.log('  ✗ ' + имя + '  ->  правило НЕ упало, откат ничего не доказал');
        бед++;
    } else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ✗ ' + имя + '  ->  упало ДРУГОЕ правило, не «' + ждём + '»');
        бед++;
    } else {
        console.log('  v ' + имя + '  ->  «' + ждём + '»');
    }
});

fs.rmSync(врем, { recursive: true, force: true });

ФАЙЛЫ.forEach(ф => {
    if (fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8') !== исходник[ф]) {
        console.log('\n  БЕДА    оригинал ' + ф + ' изменился — этого быть не должно');
        бед++;
    }
});

if (бед === 0) {
    console.log('\n  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не изменялись — работа шла на копии\n');
} else {
    console.log('\n  НЕ ТАК  ' + бед + ' откатов не доказали ничего\n');
    process.exitCode = 1;
}

/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ЦВЕТ С ИМЕНЕМ» ОТКАТОМ. Работаем на КОПИИ.
 *
 * Якоря держатся на СОДЕРЖИМОМ, а не на положении: все три правила
 * ПЕРЕСЧИТЫВАЮТ, поэтому откат возвращает не строку на месте, а ЯВЛЕНИЕ —
 * число вместо имени, второе объявление токена, блок <style> в разметке.
 *
 * Этот прувер особенно легко подпереть обманом: достаточно вернуть число,
 * у которого имени НЕТ, — правило честно промолчит, и откат «пройдёт»,
 * ничего не доказав. Поэтому возвращаемые числа взяты из тех самых 242
 * мест, а одно — нарочно безымянное, и от него ждётся МОЛЧАНИЕ.
 *
 *   node tools/check-cvet-imenem-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'css/tokens.css', 'css/player.css', 'css/coaches.css', 'index.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const S = 'css/style.css', T = 'css/tokens.css', PC = 'css/player.css', C = 'css/coaches.css', H = 'index.html';

const ОТКАТЫ = [

/* ── число вместо живого имени ── */
['вернуть белое число вместо имени', S,
 'color: var(--neutral-white);',
 'color: #ffffff;',
 'цвет, у которого есть имя, записан именем'],

['вернуть чёрное число вместо имени', S,
 'var(--neutral-black)',
 '#000000',
 'цвет, у которого есть имя, записан именем'],

['вернуть прозрачную белую восьмёрку числом', C,
 'solid var(--alpha-white-08)',
 'solid rgba(255,255,255,0.08)',
 'цвет, у которого есть имя, записан именем'],

['вернуть число в сокращённой записи — #FFF это тоже #ffffff', PC,
 'var(--neutral-white)',
 '#FFF',
 'цвет, у которого есть имя, записан именем'],

['вернуть число с хвостовым нулём — 0.7 это тоже 0.70', C,
 'linear-gradient(180deg, var(--modal-bg-heavy) 0%',
 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%',
 'цвет, у которого есть имя, записан именем'],

/* ── второе объявление цветового токена ── */
['объявить цветовой токен второй раз', T,
 '  --neutral-white:',
 '  --neutral-white: #fefefe;\n  --neutral-white:',
 'цветовой токен объявлен один раз'],

/* ── css внутри html ── */
['вернуть блок <style> на главную', H,
 '</head>',
 '<style>.site-header { background: #000000; }</style>\n</head>',
 'css не живёт внутри html'],

/* ── МОЛЧАНИЕ: число без имени правило не трогает ── */
['число, у которого имени нет, правило НЕ трогает', S,
 'color: var(--neutral-white);',
 'color: #7a3b1c;',
 null]

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-cvet-'));
['css', 'js', 'pages', 'tools', 'partials', 'index.html', 'index-en.html', 'index-kg.html']
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
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-cvet-imenem.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-cvet-imenem.js.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф + ': ' + что); плохих++; return; }
    /* ПЕРВОЕ вхождение, а не все: замена всех копий белого числом сделала бы
       откат неотличимым от сноса половины файла */
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

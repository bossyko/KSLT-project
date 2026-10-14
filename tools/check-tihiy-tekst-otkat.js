/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ТИХОГО ТЕКСТА ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-tihiy-tekst-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/tokens.css', 'css/style.css', 'css/players.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Т = 'css/tokens.css', С = 'css/style.css', И = 'css/players.css';

const ОТКАТЫ = [

['вернуть тихий текст на --text-dim', С,
 '.sponsor-label {\n    font-size: var(--fs-2xs);\n    color: var(--text-muted);',
 '.sponsor-label {\n    font-size: var(--fs-2xs);\n    color: var(--text-dim);',
 'тихий текст не красится --text-dim'],

/* ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ БЛОКА: имя `.pl-guest-mark` встречается в
   файле дважды — объявление и медиазапрос. */
['завести неактивное мимо списка', И,
 '.pl-guest-mark {\n    display: inline-block;',
 '.pl-nekto-novoe { color: var(--text-dim); }\n\n.pl-guest-mark {\n    display: inline-block;',
 'тихий текст не красится --text-dim'],

['поднять альфу dim выше muted', Т,
 '  --text-dim:       var(--alpha-white-35);',
 '  --text-dim:       var(--alpha-white-72);',
 'тихие уровни стоят лестницей'],

['уронить тихий уровень ниже порога AA', Т,
 '  --text-muted:     var(--alpha-white-50);',
 '  --text-muted:     var(--alpha-white-35);',
 'тихий уровень проходит AA на фоне страницы'],

/* В js цвет пишется БЕЗ пробела — инлайном в строке разметки. */
['вернуть инлайн тихого текста в js', 'js/player.js',
 "color:var(--text-muted);text-align:center;padding:20px;font-size:0.9rem;",
 "color:var(--text-dim);text-align:center;padding:20px;font-size:0.9rem;",
 'в js токена тихого текста нет']

];

/* Пятый откат трогает js — кладём и его. */
ФАЙЛЫ.push('js/player.js');
исходник['js/player.js'] = fs.readFileSync(path.join(КОРЕНЬ, 'js/player.js'), 'utf8');

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-tihiy-'));
fs.mkdirSync(path.join(песок, 'css'), { recursive: true });
fs.mkdirSync(path.join(песок, 'js'), { recursive: true });
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'check-tihiy-tekst.js'),
                path.join(песок, 'tools', 'check-tihiy-tekst.js'));
/* Чекер читает ВСЮ папку css и ВСЮ папку js — кладём их целиком, иначе
   он посчитает не то, что есть на деле. */
fs.cpSync(path.join(КОРЕНЬ, 'css'), path.join(песок, 'css'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'js'), path.join(песок, 'js'), { recursive: true });

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-tihiy-tekst.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-tihiy-tekst.js.');
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
    if (сколько > 1 && ф !== 'js/player.js') {
        console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

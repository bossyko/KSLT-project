/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ КРАСКИ АКЦЕНТА ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-kraska-akcenta-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'css/pricing.css', 'js/kslt-kraska.js',
               'js/courts.js', 'js/admin/core/export.js', 'pages/courts.html',
               'css/tokens.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const С = 'css/style.css', Ц = 'css/pricing.css', Ч = 'js/kslt-kraska.js',
      К = 'js/courts.js', В = 'js/admin/core/export.js', П = 'pages/courts.html';

const ОТКАТЫ = [

['вернуть число акцента в css', С,
 '    background: var(--gradient-logo);',
 '    background: linear-gradient(90deg, #F0FF7A 0%, #CCFF00 40%, #9ED900 100%);',
 'числа акцента в коде нет'],

['вернуть число акцента на холст', К,
 "ctx.fillStyle = window.KSLT_KRASKA.цвет('--accent');",
 "ctx.fillStyle = '#CCFF00';",
 'числа акцента в коде нет'],

['завести второе число в выгрузке', В,
 "'th { background: #ccff00; font-weight: bold; text-align: left; }' +",
 "'th { background: #ccff00; } td { color: #CCFF00; }' +",
 'у выгрузки число одно и названо'],

['вернуть запасное значение токену', Ц,
 '    color: var(--accent-on);',
 '    color: var(--accent-on, #0A0A0A);',
 'запасного значения у токена акцента нет'],

['завести вторую читалку', Ч,
 '    window.KSLT_KRASKA = {',
 '    window.KSLT_KRASKA = {};\n    window.KSLT_KRASKA = {',
 'читалка токена одна на продукт'],

['отнять читалку у страницы, которая её зовёт', П,
 '<script src="../js/kslt-kraska.js?v=',
 '<script src="../js/kslt-kraska-net.js?v=',
 'читалку подключают все страницы, которым она нужна'],

['вернуть число вместо токена прозрачности', С,
 'var(--accent-subtle)',
 'rgba(204, 255, 0, 0.15)',
 'прозрачности, у которых есть токен, записаны токеном'],

['вернуть прозрачность мимо шкалы', С,
 'var(--alpha-lime-12)',
 'rgba(204, 255, 0, 0.11)',
 'прозрачность акцента берётся со шкалы'],

['слепить две соседние ступени', 'css/tokens.css',
 '  --alpha-lime-12:   rgba(204, 255, 0, 0.12);',
 '  --alpha-lime-12:   rgba(204, 255, 0, 0.08);',
 'ступени прозрачности не слипаются']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kraska-'));
['css', 'js', 'pages', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-kraska-akcenta.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-kraska-akcenta.js.');
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

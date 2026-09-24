/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КОРОБКИ ОТКАТОМ. Работаем на КОПИИ.
 *   node tools/check-korobka-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/style.css', 'css/players.css', 'css/partners.css', 'css/tokens.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });
const ПРАВИЛО = fs.readFileSync(path.join(__dirname, 'check-korobka.js'), 'utf8');

/* пятая копия — целиком новый файл */
const ПЯТАЯ = `.xx-guest-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: conic-gradient(from var(--guest-angle, 0deg), transparent 0%, var(--accent) 10%, transparent 20%);
}
`;

const ОТКАТЫ = [
['завести пятую копию коробки', 'css/players.css',
 '/* Rotating gradient border */\n.pl-guest-cta::before {',
 ПЯТАЯ + '\n/* Rotating gradient border */\n.pl-guest-cta::before {',
 'копий коробки ровно четыре, и это те самые четыре'],

['вернуть эталону поля 22/34', 'css/style.css',
 '    padding: var(--space-6) var(--space-8);   /* 24 / 32 */',
 '    padding: 22px 34px;',
 'поля эталона стоят на шкале'],

['развести заливку у копии на рейтинге', 'css/players.css',
 '    max-width: 460px;\n    background: rgba(18, 18, 18, 0.85);',
 '    max-width: 460px;\n    background: rgba(20, 20, 20, 0.85);',
 '.pl-guest-cta держит общую форму: background'],

['развести радиус у копии партнёров', 'css/partners.css',
 '    border-radius: 24px;\n    overflow: hidden;\n    isolation: isolate;',
 '    border-radius: 20px;\n    overflow: hidden;\n    isolation: isolate;',
 '.pt-guest-cta держит общую форму: border-radius'],

/* ЯКОРЬ ПЕРЕПИСАН 24.09: он держался на max-width: 420px, а 24.09 копия
   подключена к эталону и ширина стала 340 — общей у обеих секций. Держится
   теперь на трёх строках общей формы, которые правило и сторожит. */
['снять размытие фона у карточки гостя', 'css/style.css',
 '    width: 100%;\n    background: rgba(18, 18, 18, 0.85);\n    border-radius: 24px;\n    backdrop-filter: blur(20px);',
 '    width: 100%;\n    background: rgba(18, 18, 18, 0.85);\n    border-radius: 24px;\n    backdrop-filter: blur(12px);',
 '.guest-cta-card держит общую форму: backdrop-filter'],

['снять регистрацию угла — обводка встанет молча', 'css/style.css',
 '@property --guest-angle {',
 '@property --guest-angle-unused {',
 '@property для угла объявлен — без него обводка не крутится вовсе'],

['завести третье имя переменной угла', 'css/partners.css',
 'from var(--pt-angle, 0deg),',
 'from var(--pt-angle-2, 0deg),',
 'имён у переменной угла не больше двух — и оба известны'],

['убрать защиту от движения у эталона', 'css/style.css',
 '@media (prefers-reduced-motion: reduce) {\n    .badges-cta-box::before,',
 '@media (prefers-reduced-motion: no-preference) {\n    .badges-cta-box::before,',
 'у эталона есть защита prefers-reduced-motion']
];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'korobka-otkat-'));
fs.mkdirSync(path.join(песок, 'css'));
fs.mkdirSync(path.join(песок, 'tools'));
fs.writeFileSync(path.join(песок, 'tools', 'check-korobka.js'), ПРАВИЛО);

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-korobka.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) { console.log('  НЕ ТАК  исходники сами не проходят.'); console.log(база.вывод); process.exit(1); }
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    if (сколько > 1)  { console.log('  ! ' + имя); console.log('      якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('');

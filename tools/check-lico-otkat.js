/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ЛИЦА ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-lico-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/kslt-lico.js', 'js/players.js', 'js/battles-overview.js',
               'pages/players.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Л = 'js/kslt-lico.js', И = 'js/players.js',
      Б = 'js/battles-overview.js', П = 'pages/players.html';

const ОТКАТЫ = [

['завести второй модуль лица', Л,
 '    window.KSLT_LICO = {',
 '    window.KSLT_LICO = {};\n    window.KSLT_LICO = {',
 'модуль лица объявлен ровно один раз'],

['вернуть свой подсчёт инициалов', И,
 'function инициалы(имя) { return window.KSLT_LICO.инициалы(имя); }',
 "function инициалы(имя) { return (имя || '').trim().charAt(0); }",
 'своих подсчётов инициалов не осталось'],

['вернуть заглушку с чужого сайта', Б,
 "window.KSLT_LICO.лицо(src, (side.names || [])[i] || '', 'bo-player-img')",
 "'<img src=\"' + esc(src || 'https://placehold.co/80x80') + '\">'",
 'заглушки с чужого сайта нет'],

['отнять модуль у страницы, которая его зовёт', П,
 '<script src="../js/kslt-lico.js?v=',
 '<script src="../js/kslt-lico-net.js?v=',
 'модуль подключают все страницы, которым он нужен'],

['оторвать заглушку от класса фотографии', Л,
 "return '<div class=\"' + экр(класс || '') + ' avatar-initials\" aria-hidden=\"true\">' +",
 "return '<div class=\"avatar-initials\" aria-hidden=\"true\">' +",
 'заглушка берёт класс фотографии и общий класс кружка'],

['отдать кружок диктору', Л,
 ' aria-hidden="true">',
 '>',
 'кружок скрыт от диктора'],

['вернуть пустой кружок вместо знака вопроса', Л,
 "        if (слова.length === 0) return '?';",
 "        if (слова.length === 0) return '';",
 'пустое имя даёт знак вопроса, а не пустой кружок'],

['считать по первым двум словам вместо имени и фамилии', Л,
 '        return (слова[0].charAt(0) + слова[слова.length - 1].charAt(0)).toUpperCase();',
 '        return (слова[0].charAt(0) + слова[1].charAt(0)).toUpperCase();',
 'инициалы берутся от первого и ПОСЛЕДНЕГО слова'],

['перестать поднимать регистр', Л,
 '.toUpperCase();',
 ';',
 'регистр поднимается']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lico-'));
['css', 'js', 'pages', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-lico.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-lico.js.');
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
    else if (р.вывод.indexOf(ждём) === -1) { console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++; }
    else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');

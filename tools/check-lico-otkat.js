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
               'js/player.js', 'js/auth-nav.js', 'pages/players.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Л = 'js/kslt-lico.js', И = 'js/players.js',
      Б = 'js/battles-overview.js', П = 'pages/players.html',
      Г = 'js/player.js', Н = 'js/auth-nav.js';

const ОТКАТЫ = [

['завести второй модуль лица', Л,
 '    window.KSLT_LICO = {',
 '    window.KSLT_LICO = {};\n    window.KSLT_LICO = {',
 'модуль лица объявлен ровно один раз'],

/* ОТКАТ ОТНИМАЕТ У ФАЙЛА ПОСЛЕДНЮЮ ДВЕРЬ ДОМА — и рисует буквы формой,
   которой общий признак не ищет, иначе упало бы заодно правило про
   подсчёт во всех файлах. */
['вернуть свой подсчёт инициалов', Г,
 "            : window.KSLT_LICO.кружок(имя, кл + ' pp-photo-ph', 'span');",
 "            : '<span class=\"' + кл + ' pp-photo-ph\">' + String(имя || '?').trim().charAt(0) + '</span>';",
 'своих подсчётов инициалов не осталось'],

/* КУСОК 194. Откат рисует разметку кружка на месте — но ДВЕРЬ дома в
   файле оставляет, иначе упало бы заодно правило про свой подсчёт, и
   откат доказывал бы не то, что обещает. */
['вернуть свою разметку кружка в список', И,
 "            : window.KSLT_LICO.кружок(p.name, класс + ' avatar-initials', 'span');",
 "            : '<span class=\"pl-photo avatar-initials\" aria-hidden=\"true\">'\n" +
 "              + window.KSLT_LICO.инициалы(p.name) + '</span>';",
 'разметку кружка рисует только дом'],

/* ТРИ ОТКАТА КУСКА 194 НА НОВЫЕ ПРАВИЛА. Каждый оставляет в файле дверь
   дома, иначе упало бы заодно поимённое правило, и откат доказывал бы не
   то, что обещает. */
['вернуть свой подсчёт первых букв всех слов', Н,
 "                    var avatarHtml = userAvatar",
 "                    var initials = userName.split(' ').map(function(n) { return n.charAt(0); }).join('');\n" +
 "                    var avatarHtml = userAvatar",
 'своего подсчёта инициалов нет ни в одном файле'],

['выдать буквы наружу', И,
 "            : window.KSLT_LICO.кружок(p.name, класс + ' avatar-initials', 'span');",
 "            : window.KSLT_LICO.кружок(window.KSLT_LICO.инициалы(p.name), класс, 'span');",
 'буквы наружу не выдаются — только внутри кружка'],

['зашить имя узла вместо довода', Л,
 "        var и = ид ? ' id=\"' + экр(ид) + '\"' : '';",
 "        var и = '';",
 'имя узла называет зовущий'],

['зашить тег кружка вместо довода', Л,
 "        var т = тег || 'div';",
 "        var т = 'div';",
 'тег кружка называет зовущий, умолчание — div'],

['навесить общий класс всем от дома', Л,
 "        var к = класс ? ' class=\"' + экр(класс) + '\"' : '';",
 "        var к = ' class=\"' + экр(класс || '') + ' avatar-initials\"';",
 'общий класс кружка приходит доводом, а не от дома'],

['вернуть заглушку с чужого сайта', Б,
 "window.KSLT_LICO.лицо(src, (side.names || [])[i] || '', 'bo-player-img')",
 "'<img src=\"' + esc(src || 'https://placehold.co/80x80') + '\">'",
 'заглушки с чужого сайта нет'],

/* КУСОК 194: порядок проверяется отдельным правилом, значит и доказывать
   его надо отдельным откатом — дом остаётся на странице, но уезжает
   ВЫШЕ экранирования, которое сам же и зовёт. */
['поставить дом раньше экранирования, которое он зовёт', П,
 '    <script src="../js/kslt-ekranirovanie.js?v=1"></script>\n' +
 '    <script src="../js/kslt-lico.js?v=8"></script>\n',
 '    <script src="../js/kslt-lico.js?v=8"></script>\n' +
 '    <script src="../js/kslt-ekranirovanie.js?v=1"></script>\n',
 'дом стоит раньше своих зовущих и позже экранирования'],

['отнять модуль у страницы, которая его зовёт', П,
 '<script src="../js/kslt-lico.js?v=',
 '<script src="../js/kslt-lico-net.js?v=',
 'модуль подключают все страницы, которым он нужен'],

['оторвать заглушку у `лицо` от класса фотографии', Л,
 "        if (!фото) return кружок(имя, (класс ? класс + ' ' : '') + 'avatar-initials', тег);",
 "        if (!фото) return кружок(имя, 'avatar-initials', тег);",
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
['css', 'js', 'pages', 'maket', 'tools'].forEach(д =>
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

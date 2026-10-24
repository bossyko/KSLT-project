/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КУСКА 156. На КОПИИ.
 *   node tools/check-osnastka-okon-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ, а не на номерах строк.
 *
 * ПЕСОК НЕСЁТ СТРАНИЦЫ: правило о подключении дома смотрит теги, и на
 * урезанном дереве оно зеленело бы молча — страниц нет, значит и страниц
 * без дома нет.
 *
 * ОДИН ОТКАТ ЗАВОДИТ НОВОЕ ОКНО, А НЕ ПОРТИТ СТАРОЕ: храповик «незапертых
 * 17» иначе не проверить — снятие оснастки у публичного окна роняет ДРУГОЕ
 * правило, то, что считает зовы по файлам.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-okna-'));
['js', 'tools', 'maket', 'pages', 'partials'].forEach(д => {
    const от = path.join(КОРЕНЬ, д);
    if (fs.existsSync(от)) fs.cpSync(от, path.join(песок, д), { recursive: true });
});
fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html')).forEach(ф =>
    fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф)));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ФАЙЛЫ = ['js/kslt-fokus.js', 'js/news.js', 'js/players.js', 'js/match-score.js',
                'js/battle-cards.js', 'js/kslt-vremya.js', 'js/tournament-register.js',
                'pages/tournament.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-osnastka-okon.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['отнять у дома оснастку', 'js/kslt-fokus.js',
     '        оснастить: оснастить,',
     '        оснаститьНЕТ: оснастить,',
     'дом объявляет `оснастить` и отдаёт его наружу'],

    ['перезаписывать уже объявленную роль', 'js/kslt-fokus.js',
     "        if (!подложка.getAttribute('role')) подложка.setAttribute('role', 'dialog');",
     "        подложка.setAttribute('role', 'dialog');",
     'оснастка даёт роль диктору и не перезаписывает уже объявленную'],

    ['перестать связывать подпись с заголовком', 'js/kslt-fokus.js',
     "            var заголовок = подложка.querySelector('h1, h2, h3, h4, [class*=\"-title\"]');",
     "            var заголовок = null; var неИщем = ('h1, h2, h3, h4');",
     'подпись берётся у заголовка окна, а не пишется второй раз'],

    ['отнять фокус у пустого окна', 'js/kslt-fokus.js',
     "            подложка.setAttribute('tabindex', '-1');",
     "            подложка.setAttribute('data-пусто', '1');",
     'фокус переводится внутрь, и пустое окно берёт его на себя'],

    ['возвращать фокус узлу, которого уже нет в документе', 'js/kslt-fokus.js',
     '            if (былФокус && былФокус.isConnected &&',
     '            if (былФокус &&',
     'снятие возвращает фокус, и только живому узлу'],

    ['отнять оснастку у гостевого окна новостей', 'js/news.js',
     '    overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, { поEsc: закрыть });',
     '    overlay.__ksltНеСнять = null;',
     'шестнадцать публичных окон зовут оснастку — по файлам и числам'],

    ['перестать звать снятие в окне счёта', 'js/match-score.js',
     '        if (overlay.__ksltСнять) { overlay.__ksltСнять(); overlay.__ksltСнять = null; }\n        overlay.remove();',
     '        overlay.remove();',
     'у каждого оснащённого файла снятие не просто присвоено, а позвано'],

    ['завести новое окно без оснастки', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function новоеОкно() {\n        var overlay = document.createElement('div');\n        overlay.className = 'vr-modal-overlay';\n        document.body.appendChild(overlay);\n    }\n    window.__новоеОкно = новоеОкно;",
     'незапертых окон замеренные 17: 14 админских и 3 под вопросом, публичных ноль'],

    ['снять дом со страницы турнира', 'pages/tournament.html',
     'js/kslt-fokus.js?v=4',
     'js/kslt-fokus-НЕТ.js?v=4',
     'дом подключён на каждой странице, где окна зовут оснастку'],

    ['вернуть воротам профиля свой слушатель Escape', 'js/players.js',
     '        overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, {\n            поEsc: function () { closeModal(overlay); }\n        });',
     "        document.addEventListener('keydown', function handler(e) {\n            if (e.key === 'Escape') { closeModal(overlay); document.removeEventListener('keydown', handler); }\n        });\n        overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, {\n            поEsc: function () { closeModal(overlay); }\n        });",
     'ворота профиля не держат своего слушателя Escape на документе'],

    ['вернуть новостям второе тело закрытия', 'js/news.js',
     '    overlay.addEventListener(\'click\', function(e) {\n        if (e.target === overlay) закрыть();\n    });',
     "    overlay.addEventListener('click', function(e) {\n        if (e.target === overlay) {\n            overlay.classList.remove('visible');\n            setTimeout(function() { overlay.remove(); }, 250);\n        }\n    });",
     'окно в новостях и карточках баттла удаляется только своей функцией закрытия']
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
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return; }
    if (сколько !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}

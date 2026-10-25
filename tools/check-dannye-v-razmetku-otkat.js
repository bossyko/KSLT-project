/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КУСКА 157. На КОПИИ.
 *   node tools/check-dannye-v-razmetku-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-razmetka-'));
/* СХЕМА БАЗЫ ТОЖЕ ЕДЕТ В ПЕСОК: признак куска 158 читает из неё, какие
   столбцы пишет человек, и без неё сторож в песке не поднимется. */
['js', 'tools', 'supabase'].forEach(д => fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ФАЙЛЫ = ['js/news.js', 'js/tournament-register.js', 'js/dashboard.js',
                'js/tournament-detail.js', 'js/kslt-vremya.js', 'js/partners.js',
                'js/courts.js', 'js/tournaments-overview.js', 'supabase/schema.sql'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-dannye-v-razmetku.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* Файл для этого отката берётся ВНЕ списка названных исключений: внутри
       него правило молчит по решению, и откат бы ничего не доказал. */
    ['вернуть сырое поле человека в разметку', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function дыра(о) { document.body.innerHTML = '<p>' + o.title + '</p>'; }\n    window.__дыра = дыра;",
     'поле, которое пишет человек, не идёт в разметку мимо дома экранирования'],

    ['отнять экранирование у заголовка окна записи', 'js/tournament-register.js',
     "'<h3 class=\"trn-register-modal-title\">' + текстом(info.title) + '</h3>' +",
     "'<h3 class=\"trn-register-modal-title\">' + info.title + '</h3>' +",
     'окно записи экранирует заголовок, текст, заметку и подписи кнопок'],

    ['отнять экранирование у заголовка окна кабинета', 'js/dashboard.js',
     "(opts.title == null ? '' : KSLT_экранировать(String(opts.title))) + '</h3>' +",
     "(opts.title == null ? '' : String(opts.title)) + '</h3>' +",
     'окно кабинета экранирует заголовок, а тело остаётся разметкой по замыслу'],

    ['убрать довод `textHtml` у окна записи', 'js/tournament-register.js',
     '(info.textHtml != null ? info.textHtml : текстом(info.text))',
     'текстом(info.text)',
     'намеренная разметка уходит доводом `textHtml`, и данные в ней экранированы'],

    ['перестать экранировать название внутри намеренной разметки', 'js/tournament-detail.js',
     "var имя = '<b>' + KSLT_экранировать(tName) + '</b>';",
     "var имя = '<b>' + tName + '</b>';",
     'намеренная разметка уходит доводом `textHtml`, и данные в ней экранированы'],

    ['вернуть ручное экранирование перед домом', 'js/dashboard.js',
     "                        title: n.title || '',",
     "                        title: KSLT_экранировать(n.title || ''),",
     'ручного экранирования перед домом не осталось — иначе текст экранируется дважды'],

    ['вернуть переходнику перечисление полей руками', 'js/tournament-register.js',
     '        var о = {};\n        for (var к in opts) {',
     "        var о = { icon: opts.icon || '', title: opts.title, text: opts.text || '', note: '', tone: opts.tone || '' };\n        if (false) for (var к in opts) {",
     'переходник окна переносит поля целиком, а не перечисляет их руками'],

    ['завести ещё зовов функций, отдающих разметку', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function р1() { return ''; }\n    function много(э) {\n        э.innerHTML = р1() + р1() + р1() + р1();\n    }\n    window.__много = много;",
     'зовов функций, отдающих разметку, не больше замеренного'],

    /* ── КУСОК 158 ── */

    /* Столбец `full_name` объявлен текстом в схеме, CHECK у него нет, и это не
       идентификатор — значит его пишет человек. Признак 157 про него не знал. */
    ['вернуть сырое поле из схемы базы в разметку', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function дыра158(о) { document.body.innerHTML = '<p>' + o.full_name + '</p>'; }\n    window.__дыра158 = дыра158;",
     'столбец, который пишет человек, не идёт в разметку мимо экранирования'],

    ['отнять экранирование у ссылки на лицо в атрибуте', 'js/partners.js',
     "'<img class=\"pt-avatar\" src=\"' + KSLT_экранировать(p.avatar_url) + '\" alt=\"\" loading=\"lazy\">'",
     "'<img class=\"pt-avatar\" src=\"' + p.avatar_url + '\" alt=\"\" loading=\"lazy\">'",
     'подстановка в атрибуте экранирована — кавычка там даёт обработчик'],

    ['отнять экранирование у телефона корта в ссылке tel:', 'js/courts.js',
     "<a href=\"tel:' + KSLT_экранировать(court.phone.split(',')[0].replace(/\\s/g, '')) + '\">",
     "<a href=\"tel:' + court.phone.split(',')[0].replace(/\\s/g, '') + '\">",
     'подстановка в атрибуте экранирована — кавычка там даёт обработчик'],

    /* СТОРОЖ СТОРОЖИТ И ТО, НА ЧЁМ СТОИТ САМ: поле с подчерка признак считает
       нашим вычисленным. Появился такой столбец в базе — соглашение сломано. */
    /* Якорь — заголовок файла, он здесь один. `CREATE TABLE` встречается
       десять раз, и прувер это поймал: ЯКОРЬ ДЕРЖИТСЯ НА ТОМ, ЧТО
       ВСТРЕЧАЕТСЯ ОДИН РАЗ, иначе откат подменяет не то, что думал. */
    ['завести в схеме столбец с подчерка', 'supabase/schema.sql',
     '-- KSLT Database Schema',
     '-- KSLT Database Schema\nCREATE TABLE _проба (\n    "_tajnoe" "text"\n);',
     'ни один столбец базы не начинается с подчерка'],

    ['завести ещё функцию, отдающую разметку', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function отдаёт158() { return '<b>1</b>'; }\n    window.__отдаёт158 = отдаёт158;",
     'функций, отдающих разметку, не больше замеренного'],

    /* Этот откат роняет ЗАОДНО храповик склеек: любая новая склейка растит и
       его. Так и есть — склеек стало больше, и это правда про меру. */
    ['завести ещё функцию, копящую разметку через +=', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function копит158() { var h = ''; h += '<u>' + 1; return h.length; }\n    window.__копит158 = копит158;",
     'функций, копящих разметку через +=, не больше замеренного'],

    /* ── КУСОК 159: признак разворачивает переменные ── */

    ['положить поле в переменную и подставить её в разметку', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function через159(о) { var имя = o.full_name; document.body.innerHTML = '<p>' + имя + '</p>'; }\n    window.__через159 = через159;",
     'столбец, который пишет человек, не идёт в разметку мимо экранирования'],

    /* БЛИЗНЕЦ ТОЙ ЖЕ БЕДЫ: адрес афиши в style="…url(…)" живёт в двух
       файлах, и кусок 158 починил только один. ПОЧИНИЛ ОДИН — ПРОВЕРЬ
       БЛИЗНЕЦА. */
    ['отнять экранирование у афиши турнира в style', 'js/tournaments-overview.js',
     "постер ? ' style=\"--poster:url(' + KSLT_экранировать(постер) + ')\"' : ''",
     "постер ? ' style=\"--poster:url(' + постер + ')\"' : ''",
     'подстановка в атрибуте экранирована — кавычка там даёт обработчик'],

    ['завести ещё голую переменную в склейке с разметкой', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function перем158(x) { var п = x.full_name; document.title = '<i>' + п + '</i>'; }\n    window.__перем158 = перем158;",
     'голых переменных в склейках с разметкой не больше замеренного'],

    ['завести ещё склейку, несущую разметку', 'js/kslt-vremya.js',
     "    'use strict';",
     "    'use strict';\n    function склейка158(x) { document.title = '<i>' + x.length + '</i>'; }\n    window.__склейка158 = склейка158;",
     'склеек, несущих разметку, не больше замеренного']
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

/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА МЁРТВЫХ КЛАССОВ. На КОПИИ.
 *
 *   node tools/check-mertvye-klassy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-mert-'));
['js', 'tools', 'css', 'pages', 'partials'].forEach(д => {
    const п = path.join(КОРЕНЬ, д);
    if (fs.existsSync(п)) fs.cpSync(п, path.join(песок, д), { recursive: true });
});
/* КОРНЕВЫЕ СТРАНИЦЫ КОПИРУЮТСЯ ТОЖЕ. Без них в песке весь лендинг
   выглядит мёртвым, и правило падает НА ЧИСТОМ КОДЕ — прувер это и
   сказал. ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО. */
fs.readdirSync(КОРЕНЬ)
    .filter(ф => ф.endsWith('.html'))
    .forEach(ф => fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф)));

const CSS = 'css/dashboard.css', JS = 'js/dashboard.js', AD = 'css/admin.css';
const ФАЙЛЫ = [CSS, JS, AD];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-mertvye-klassy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. ВЕРНУТЬ МЁРТВЫЙ КЛАСС — один из 28 снятых 21.10 */
    ['вернуть мёртвый класс в css', CSS,
     '.db-status-badge {\n    min-height: 24px;',
     '.db-notif-item {\n    padding: 12px;\n}\n\n.db-status-badge {\n    min-height: 24px;',
     'ни одного мёртвого класса в css кабинета'],

    /* 2. СЛОМАТЬ СКЛЕЙКУ — и это главный откат куска.
       Если правило снова станет искать ПОЛНОЕ ИМЯ, живые стили трёх
       статусов приглашения окажутся «мёртвыми», и следующая уборка их
       снесёт. Откат убирает склейку из js: класс перестаёт собираться, и
       сторож ОБЯЗАН сказать, что он мёртв, — именно это и значит, что
       признак смотрит на склейку, а не на написание. */
    ['сломать склейку, которой живут статусы приглашения', JS,
     ["'<td><span class=\"db-status-badge db-invite-' + statusClass + '\">'",
      "'<span class=\"db-status-badge db-invite-' + cls + '\">'",
      "'<span class=\"db-status-badge db-invite-' + st.cls + '\">'"],
     ["'<td><span class=\"db-status-badge\">'",
      "'<span class=\"db-status-badge\">'",
      "'<span class=\"db-status-badge2\">'"],
     'ни одного мёртвого класса в css кабинета'],

    /* 3б. МЁРТВЫЙ КЛАСС В ЧУЖОМ ФАЙЛЕ — правило смотрит ВСЕ файлы css,
       а не только кабинет. Семьдесят семь мёртвых 22.10 нашлись в
       `admin.css`, и правило обязано видеть их там же. */
    ['вернуть мёртвый класс в admin.css', AD,
     '.ad-badge {\n    font-size: var(--fs-xs);',
     '.ad-trn-photo-grid { display: grid; }\n\n.ad-badge {\n    font-size: var(--fs-xs);',
     'ни одного мёртвого класса во всём css продукта'],

    /* 3. ПОТОЛОК КЛАССОВ: новая семья не копится молча */
    ['завести новую семью классов мимо потолка', CSS,
     '.db-status-badge {\n    min-height: 24px;',
     '.db-novaya-semya { color: red; }\n.db-novaya-semya-dva { color: blue; }\n' +
     '.db-status-badge {\n    min-height: 24px;',
     'ни одного мёртвого класса в css кабинета']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правила падают на ЧИСТОМ коде — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
/* ОТКАТ НА СКЛЕЙКУ — ЭТО ТРИ ПРАВКИ, А НЕ ОДНА. `'db-invite-' + …` стоит в
   `dashboard.js` ТРИЖДЫ (2401, 3613, 3983), и сломать одну значит не
   сломать ничего: класс продолжает собираться двумя другими. Первая
   попытка так и не уронила правило, и прувер это сказал.
   Поэтому `что`/`на` могут быть списками пар; каждый якорь всё равно
   проверяется на единственность. */
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const пары = Array.isArray(что) ? что.map((з, i) => [з, на[i]]) : [[что, на]];
    let текст = исходник[ф], плохойЯкорь = null;
    for (const [з, п] of пары) {
        const n = текст.split(з).length - 1;
        if (n !== 1) { плохойЯкорь = 'якорь встречается ' + n + ' раз в ' + ф; break; }
        текст = текст.replace(з, п);
    }
    if (плохойЯкорь) {
        console.log('  ? ' + имя + '  ->  ' + плохойЯкорь);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: текст });
    прогон(null);
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
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

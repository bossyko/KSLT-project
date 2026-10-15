/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ПОРЯДКА БЛОКОВ ОТКАТОМ. Работаем на КОПИИ.
 *
 * Якоря держатся на СОДЕРЖИМОМ — на том, что живёт в блоке постоянно, —
 * а не на положении строки и не на соседе, который может уехать.
 *
 *   node tools/check-poryadok-blokov-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/tournament-detail.js', 'css/tournament-detail.css',
               'sql/функции/cifry-v-reytinge.sql', 'sql/схема/testovaya-klubnye-cifry.sql'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const J = 'js/tournament-detail.js', C = 'css/tournament-detail.css',
      SБ = 'sql/функции/cifry-v-reytinge.sql', SТ = 'sql/схема/testovaya-klubnye-cifry.sql';

const ОТКАТЫ = [

['вернуть безусловную склейку круговой', J,
 'bHtml += allGroupDone ? (плейоффHtml + группы) : (группы + плейоффHtml);',
 'bHtml += группы + плейоффHtml;',
 'круговая: порядок блоков решает состояние'],

['переставить ветки склейки местами', J,
 'bHtml += allGroupDone ? (плейоффHtml + группы) : (группы + плейоффHtml);',
 'bHtml += allGroupDone ? (группы + плейоффHtml) : (плейоффHtml + группы);',
 'круговая: живое выше законченного'],

['вернуть безусловную склейку двух лиг', J,
 'glHtml += glAllGroupDone ? (лиги + группыЛиг) : (группыЛиг + лиги);',
 'glHtml += лиги + группыЛиг;',
 'две лиги: порядок блоков решает состояние'],

['считать закрытый этап по статусу турнира', J,
 "var allGroupDone = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });",
 "var allGroupDone = t.status === 'completed';",
 'признак закрытого этапа считается по матчам'],

['протащить статус турнира в склейку', J,
 'bHtml += allGroupDone ? (плейоффHtml + группы) : (группы + плейоффHtml);',
 "bHtml += (t.status === 'completed') ? (плейоффHtml + группы) : (группы + плейоффHtml);",
 'порядок блоков не смотрит на статус турнира'],

['завести второе объявление признака', J,
 'var allGroupDone = grpMatches.length > 0',
 'var allGroupDone = false;\n                var allGroupDone = grpMatches.length > 0',
 'признак закрытого этапа объявлен по одному разу на ветку'],

['убрать накопитель групп в круговой', J,
 "var группы = '';",
 "var группыНет = '';",
 'круговая: группы копятся отдельно от плей-оффа'],

['убрать накопитель сеток лиг', J,
 "var лиги = '';",
 "var лигиНет = '';",
 'две лиги: сетки и группы копятся отдельно'],

['снять общее правило кегля подзаголовка', C,
 /* два селектора из четырёх (.td-tab-content, .td-content) сняты 14.10
   как мёртвые: класса нет в продукте, он жил только в этом списке */
 '.td-section-header h3,\n.td-section h3{\n    font-size: var(--fs-lg);',
 '.td-section-header h3,\n.td-section h3{\n    font-size: 1.1rem;',
 'кегль подзаголовка раздела объявлен один раз на широких видах'],

['вернуть кегль классу блока сетки', C,
 '.td-bracket-subtitle {\n    color: var(--accent);',
 '.td-bracket-subtitle {\n    font-size: 1.1rem;\n    color: var(--accent);',
 'подзаголовок блока сетки не задаёт кегль сам'],

['вернуть свой кегль подзаголовку участников', C,
 '.td-participants-subtitle {\n    /* Кегль и вес НЕ объявлены',
 '.td-participants-subtitle {\n    font-size: var(--fs-md);\n    /* Кегль и вес НЕ объявлены',
 'подзаголовок участников не задаёт кегль сам'],

['сдвинуть название группы со ступени', C,
 '.td-group-name {\n    font-size: var(--fs-base);',
 '.td-group-name {\n    font-size: 0.95rem;',
 'название группы стоит на ступени card title'],

['снять шаг названия группы на узких', C,
 '    .td-group-name {\n        font-size: var(--fs-sm);\n    }',
 '    .td-group-name {\n        letter-spacing: 0;\n    }',
 'название группы на узких — ступень ниже'],

['вернуть инлайновый кегль подзаголовка', J,
 '<h3 class="td-bracket-subtitle">',
 '<h3 class="td-bracket-subtitle" style="font-size:1.1rem;">',
 'инлайновых кеглей блока сетки в js не осталось'],

['вернуть кегль числом', J,
 'font-size:var(--fs-xs)',
 'font-size:0.8rem',
 'кеглей числом мимо токенов в js не осталось'],

['вернуть ширину мимо шкалы', J,
 'min-width:48px',
 'min-width:46px',
 'ширины шапки таблицы стоят на шкале'],

['разорвать пару «гашение + короткая подпись»', C,
 '    .td-sched-round::after,\n    .td-sched-court-cell::after {\n        content: attr(data-short);',
 '    .td-sched-round::after,\n    .td-sched-court-cell::after {\n        content: none;',
 'короткая подпись расписания живёт псевдоэлементом']

,

['вернуть боевой счётчик к числу членств', SБ,
 '    ranked       integer,',
 '    members      integer,',
 'все определения счётчика начинаются колонкой ranked'],

['вернуть тестовый счётчик к числу членств', SТ,
 '    ranked       integer,',
 '    members      integer,',
 'все определения счётчика начинаются колонкой ranked'],

['развести условие «в рейтинге» между базами', SТ,
 'is_guest IS NOT TRUE AND category_id IS NOT NULL',
 'is_guest IS NOT TRUE',
 'боевая и тестовая считают «в рейтинге» одинаково']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-poryadok-'));
['css', 'js', 'pages', 'tools', 'sql'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-poryadok-blokov.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят check-poryadok-blokov.js.');
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

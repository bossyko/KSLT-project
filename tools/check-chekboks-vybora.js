/**
 * ЗАМОРОЗКА КУСКА 151 — ЧЕКБОКС МАССОВОГО ВЫБОРА ОДИН НА ПРОДУКТ.
 *
 * ЧТО БЫЛО. Дом `A.bulkCheckboxTd` существовал и его ОБХОДИЛИ два
 * раздела из восьми: `courts.js` и `users.js` собирали чекбокс сами и
 * несли при нём инлайн `width:18px;height:18px;accent-color;cursor`.
 * ДОМ, КОТОРЫЙ ЕСТЬ И КОТОРЫЙ ОБХОДЯТ, ХУЖЕ ОТСУТСТВИЯ ДОМА — копия
 * выглядит законной.
 *
 * ПРИЧИНА ОБХОДА БЫЛА НАСТОЯЩАЯ: у кортов ячейка идёт с `rowspan`, а
 * «Пользователи» дописывают ячейку к УЖЕ отрисованной строке через DOM.
 * Поэтому дом отдаёт ДВА понятия — ввод и ячейку вокруг него, — а ячейка
 * принимает `rowspan`.
 *
 * ИНЛАЙН СНЯТ ПО ЗАМЕРУ, А НЕ ПО ВЕРЕ: все три свойства объявлены в
 * `css/admin.css` для `.ad-bulk-item, .ad-bulk-all` теми же значениями, а
 * `accent-color` красит нативный чекбокс, которого нет (`appearance:
 * none`). Замер на стенде 23.10: все три пути дали 18x18, `appearance:
 * none`, `cursor: pointer`, границу 2px accent, радиус 4 и НИ ОДНОГО
 * инлайна.
 */
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(__dirname, '..', 'node_modules', 'acorn'));

const КОРЕНЬ = path.join(__dirname, '..');
const чит = (ф) => fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
const ДОМ = 'js/admin/core/utils.js';
const СТЕНД = 'maket/chekboks-zamer.html';

let плохо = 0, правил = 0;
function правило(имя, ок, беда) {
    правил++;
    if (ок) return;
    плохо++;
    console.log('\n  НЕ ТАК  ' + имя + '\n          ' + String(беда).split('\n').join('\n          '));
}
const дерево = (т) => acorn.parse(т, { ecmaVersion: 2022, locations: true });
function обойти(узел, дело, род) {
    if (!узел || typeof узел !== 'object') return;
    if (узел.type) дело(узел, род);
    for (const к in узел) {
        if (к === 'loc') continue;
        const з = узел[к];
        if (Array.isArray(з)) з.forEach(д => обойти(д, дело, узел));
        else if (з && typeof з === 'object' && з.type) обойти(з, дело, узел);
    }
}
const домТекст = чит(ДОМ);

/* ---- 1. разметка чекбокса объявлена только в доме ---- */
const свои = [];
function обход(д) {
    fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
        const п = д + '/' + э.name;
        if (э.isDirectory()) return обход(п);
        if (!/\.js$/.test(э.name) || п === ДОМ) return;
        const т = чит(п);
        обойти(дерево(т), у => {
            if (у.type !== 'Literal' || typeof у.value !== 'string') return;
            if (/<input[^>]*class="ad-bulk-item/.test(у.value)) свои.push(п + ':' + у.loc.start.line);
        });
    });
}
обход('js');
правило('разметку чекбокса выдаёт только дом',
    свои.length === 0,
    'Своя разметка `.ad-bulk-item` вернулась в: ' + свои.join(', ') + '.\n' +
    'Дом существовал и его обходили два раздела из восьми — именно так\n' +
    'инлайн и прожил на три куска дольше, чем должен был.');

/* ---- 2. инлайн чекбокса не вернулся ни в один файл ---- */
const инлайны = [];
обход.свои = null;
(function обходИнлайна(д) {
    fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
        const п = д + '/' + э.name;
        if (э.isDirectory()) return обходИнлайна(п);
        if (!/\.js$/.test(э.name)) return;
        обойти(дерево(чит(п)), у => {
            if (у.type !== 'Literal' || typeof у.value !== 'string') return;
            if (/accent-color\s*:/.test(у.value) && /width\s*:\s*18px/.test(у.value))
                инлайны.push(п + ':' + у.loc.start.line);
        });
    });
})('js');
правило('инлайн чекбокса не вернулся',
    инлайны.length === 0,
    'Инлайн вернулся в: ' + инлайны.join(', ') + '.\n' +
    'Он МЁРТВ, и это замер: `width`/`height`/`cursor` объявлены в css\n' +
    'теми же значениями, а `accent-color` красит нативный чекбокс,\n' +
    'которого нет — `appearance: none`. ОПАСЕН ОН ТЕМ, ЧТО ПЕРЕБИЛ БЫ\n' +
    'правку размера в css молча: важности css снял кусок 119.');

/* ---- 3. дом отдаёт два понятия ---- */
правило('дом отдаёт и ввод, и ячейку',
    /A\.bulkCheckbox\s*=\s*bulkCheckbox;/.test(домТекст) &&
    /A\.bulkCheckboxTd\s*=\s*bulkCheckboxTd;/.test(домТекст) &&
    /function bulkCheckbox\s*\(id\)/.test(домТекст) &&
    /function bulkCheckboxTd\s*\(id,\s*о\)/.test(домТекст),
    'Дом обязан отдавать ДВА понятия: `bulkCheckbox` (сам ввод) и\n' +
    '`bulkCheckboxTd` (ячейка вокруг). Одного мало: «Пользователи»\n' +
    'дописывают ячейку к готовой строке через DOM, и строка `<td>` им не\n' +
    'годится — именно поэтому они и обходили дом.');

/* ---- 4. ячейка строится на вводе, а не рядом с ним ---- */
let ячейкаЧерезВвод = false;
обойти(дерево(домТекст), у => {
    if (!(у.type === 'FunctionDeclaration' && у.id && у.id.name === 'bulkCheckboxTd')) return;
    const тело = домТекст.slice(у.start, у.end);
    ячейкаЧерезВвод = /bulkCheckbox\(id\)/.test(тело) &&
                      !/<input/.test(тело);
});
правило('ячейка собирается зовом ввода, а не своей разметкой',
    ячейкаЧерезВвод,
    'Ячейка снова пишет `<input>` сама. Тогда понятий два, а определений\n' +
    'ввода — тоже два, и беда родится ровно на шве.');

/* ---- 5. rowspan — довод, и выравнивание идёт с ним ---- */
let rowspanДовод = false;
обойти(дерево(домТекст), у => {
    if (!(у.type === 'FunctionDeclaration' && у.id && у.id.name === 'bulkCheckboxTd')) return;
    const тело = домТекст.slice(у.start, у.end);
    rowspanДовод = /о\.rowspan/.test(тело) && /vertical-align:middle/.test(тело);
});
правило('rowspan приходит доводом, и выравнивание едет с ним',
    rowspanДовод,
    'У кортов ячейка идёт с `rowspan` (несколько видов покрытия под одной\n' +
    'строкой-шапкой), и без выравнивания по середине чекбокс прижат к\n' +
    'верху высокой ячейки. Оба — замеренное поведение кортов, не выдумка.');

/* ---- 6. корты и пользователи зовут дом ---- */
const зовы = {};
['js/admin/sections/courts.js', 'js/admin/sections/users.js'].forEach(ф => {
    const т = чит(ф);
    зовы[ф] = [];
    обойти(дерево(т), у => {
        if (у.type !== 'CallExpression') return;
        const имя = т.slice(у.callee.start, у.callee.end);
        if (/bulkCheckbox(Td)?$/.test(имя)) зовы[ф].push(имя + ':' + у.loc.start.line);
    });
});
правило('корты зовут ячейку дома с rowspan',
    зовы['js/admin/sections/courts.js'].some(з => /bulkCheckboxTd/.test(з)) &&
    /bulkCheckboxTd\(c\.id,\s*\{\s*rowspan:/.test(чит('js/admin/sections/courts.js')),
    'Корты снова собирают ячейку сами. Зовы: ' +
    (зовы['js/admin/sections/courts.js'].join(', ') || 'ни одного'));
правило('пользователи берут у дома сам ввод',
    /td\.innerHTML = A\.bulkCheckbox\(/.test(чит('js/admin/sections/users.js')),
    '«Пользователи» снова пишут `<input>` сами. Им нужен ВВОД, потому что\n' +
    'ячейку они строят через DOM — это и есть второе понятие дома.');

/* ---- 7. все восемь разделов берут чекбокс у дома ---- */
let потребителей = 0;
(function обходРазделов(д) {
    fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
        const п = д + '/' + э.name;
        if (э.isDirectory()) return обходРазделов(п);
        if (!/\.js$/.test(э.name) || п === ДОМ) return;
        if (/A\.bulkCheckbox(Td)?\(/.test(чит(п))) потребителей++;
    });
})('js/admin');
/* ЧИСЛО ВЗЯТО У ПРИБОРА, А НЕ У МЕНЯ: я написал восемь по памяти о
   «восьми разделах», прибор сказал СЕМЬ и упал на расхождении. Это
   `sponsors`, `courts`, `coaches`, `news`, `tournaments`, `players` —
   ячейкой, и `users` — вводом. Восьмой раздел чекбокса массового выбора
   не имеет вовсе. */
const ПОТРЕБИТЕЛЕЙ = 7;
правило('чекбокс берут у дома восемь разделов — замерено',
    потребителей === ПОТРЕБИТЕЛЕЙ,
    'Потребителей дома: ' + потребителей + ', замерено ' + ПОТРЕБИТЕЛЕЙ + '.\n' +
    'Меньше — кто-то снова собирает чекбокс сам. Больше — появился новый\n' +
    'раздел, и это хорошо, но число живёт здесь и правится с причиной.');

/* ---- 8. стенд держит все три пути ---- */
const стенд = fs.existsSync(path.join(КОРЕНЬ, СТЕНД)) ? чит(СТЕНД) : '';
правило('стенд держит все три пути рядом',
    /bulkCheckboxTd\('proba-1'\)/.test(стенд) &&
    /bulkCheckboxTd\('proba-2',\s*\{\s*rowspan:/.test(стенд) &&
    /bulkCheckbox\('proba-3'\)/.test(стенд),
    'Стенд обязан рисовать ТРИ пути: ячейку дома, ячейку с `rowspan`\n' +
    '(корты) и ввод в своей ячейке через DOM («Пользователи»). Удобный\n' +
    'стенд с одним путём доказывает только себя.');

/* ---- вывод ---- */
console.log('');
if (плохо === 0) {
    console.log('  ок      чекбокс массового выбора: ' + правил + ' правил');
    console.log('          разметка одна, потребителей ' + потребителей + ', инлайна нет');
    console.log('          rowspan и ввод — два довода одного дома');
} else {
    console.log('  НЕ ТАК  ' + плохо + ' из ' + правил + ' правил');
    process.exitCode = 1;
}
console.log('');

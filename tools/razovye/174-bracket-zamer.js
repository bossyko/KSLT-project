/* РАЗОВЫЙ ПРИБОР КУСКА 78: ЗАМЕР `js/admin/sections/bracket.js`.
   Считает ТЕМ ЖЕ способом, что сторож `tools/check-inlayn-stili.js`
   (инлайны по всему тексту, не построчно), и группирует по ВМЕЩАЮЩИМ
   скобкам — урок круга 3 ветки C: группировка «по ближайшему объявлению
   сверху» врёт на вложенных функциях. */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const КОРЕНЬ = path.join(__dirname, '..', '..');
const ФАЙЛ = 'js/admin/sections/bracket.js';
const т = fs.readFileSync(path.join(КОРЕНЬ, ФАЙЛ), 'utf8');

const ШКАЛА = new Set(['0', '0px', '4px', '8px', '12px', '16px', '24px', '32px', '40px']);
const ОТСТУПЫ = new Set(['padding', 'margin', 'margin-top', 'margin-bottom',
    'margin-left', 'margin-right', 'gap', 'row-gap', 'column-gap', 'border-radius']);
const КРАСКИ = new Set(['color', 'background', 'background-color', 'border',
    'border-bottom', 'border-top', 'border-left', 'border-right', 'box-shadow', 'fill']);

/* инлайны С ПОЛОЖЕНИЕМ в тексте — положение нужно для группировки */
function инлайны(т) {
    const из = [];
    let м;
    const дв = /style="([^"]*)"/gs;
    while ((м = дв.exec(т))) из.push({ тело: м[1], где: м.index });
    const од = /style='([^']*)'/gs;
    while ((м = од.exec(т))) из.push({ тело: м[1], где: м.index });
    const ct = /style\.cssText\s*=\s*'([^']*)'/gs;
    while ((м = ct.exec(т))) из.push({ тело: м[1], где: м.index });
    return из;
}
function разбор(тело) {
    const из = [];
    тело.split(';').forEach(об => {
        const и = об.indexOf(':');
        if (и === -1) return;
        из.push([об.slice(0, и).trim(), об.slice(и + 1).trim()]);
    });
    return из;
}

const все = инлайны(т);
let краска = 0, мимо = 0;
const написания = {};
const свойства = {};
все.forEach(и => {
    let к = false, м = false;
    разбор(и.тело).forEach(([имя, v]) => {
        свойства[имя] = (свойства[имя] || 0) + 1;
        if (КРАСКИ.has(имя) && /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(v)) {
            к = true;
            (v.match(/#[0-9a-fA-F]{3,8}\b/g) || []).forEach(ц => {
                написания[ц.toLowerCase()] = (написания[ц.toLowerCase()] || 0) + 1;
            });
        }
        if (ОТСТУПЫ.has(имя)) v.split(/\s+/).forEach(ч => {
            if (/^\d+(\.\d+)?px$/.test(ч) && !ШКАЛА.has(ч)) м = true;
        });
    });
    и.краска = к; и.мимо = м;
    if (к) краска++;
    if (м) мимо++;
});

/* ГРУППИРОВКА ПО ВМЕЩАЮЩИМ СКОБКАМ */
const дерево = acorn.parse(т, { ecmaVersion: 2022, ranges: true });
const функции = [];
(function обход(узел, родитель) {
    if (!узел || typeof узел !== 'object') return;
    if (Array.isArray(узел)) { узел.forEach(у => обход(у, родитель)); return; }
    if (!узел.type) return;
    if (/Function(Declaration|Expression)|ArrowFunctionExpression/.test(узел.type)) {
        let имя = узел.id && узел.id.name;
        if (!имя && родитель) {
            if (родитель.type === 'VariableDeclarator' && родитель.id) имя = родитель.id.name;
            else if (родитель.type === 'Property' && родитель.key) имя = родитель.key.name || родитель.key.value;
            else if (родитель.type === 'AssignmentExpression' && родитель.left) {
                имя = т.slice(родитель.left.range[0], родитель.left.range[1]);
            }
        }
        функции.push({ имя: имя || '(без имени)', от: узел.range[0], до: узел.range[1],
                       строка: т.slice(0, узел.range[0]).split('\n').length });
    }
    for (const к of Object.keys(узел)) {
        if (к === 'range' || к === 'type') continue;
        обход(узел[к], узел);
    }
})(дерево, null);

/* вмещающая = САМАЯ УЗКАЯ функция, в которую попало положение */
const поФункциям = {};
все.forEach(и => {
    let лучшая = null;
    функции.forEach(ф => {
        if (и.где >= ф.от && и.где < ф.до) {
            if (!лучшая || (ф.до - ф.от) < (лучшая.до - лучшая.от)) лучшая = ф;
        }
    });
    const ключ = лучшая ? лучшая.имя + ' :' + лучшая.строка : '(вне функций)';
    поФункциям[ключ] = (поФункциям[ключ] || 0) + 1;
});

/* ОКНА И ТАЙМЕРЫ */
const зововОболочки = (т.match(/A\.оболочкаОкна/g) || []).length;
const запереть = (т.match(/KSLT_FOKUS|запереть/g) || []).length;
const таймеры = [];
let м2;
const re = /setTimeout\s*\(/g;
while ((м2 = re.exec(т))) {
    const кусок = т.slice(м2.index, м2.index + 400);
    const задержка = (кусок.match(/,\s*(\d+)\s*\)/) || [])[1] || '?';
    таймеры.push({ строка: т.slice(0, м2.index).split('\n').length, задержка: задержка,
                   слушатель: /addEventListener|onclick|onkeydown/.test(кусок) });
}

console.log('ФАЙЛ  ' + ФАЙЛ + '  строк ' + т.split('\n').length + ', байт ' + т.length);
console.log('');
console.log('ИНЛАЙНОВ ВСЕГО         ' + все.length);
console.log('  с голой краской      ' + краска);
console.log('  с отступом мимо шкалы ' + мимо);
console.log('  написания красок:    ' + JSON.stringify(написания));

/* КЕГЛИ И ОТСТУПЫ ПОИМЁННО — шкала кеглей 11·12·14·16·18·21·26·32·40 */
const ШКАЛА_КЕГЛЕЙ = new Set(['11px','12px','14px','16px','18px','21px','26px','32px','40px']);
const кегли = {}, отступыМимо = {}, иныеЧисла = {};
все.forEach(и => разбор(и.тело).forEach(([имя, v]) => {
    if (имя === 'font-size') кегли[v] = (кегли[v] || 0) + 1;
    if (ОТСТУПЫ.has(имя)) v.split(/\s+/).forEach(ч => {
        if (/^\d+(\.\d+)?px$/.test(ч) && !ШКАЛА.has(ч)) отступыМимо[ч] = (отступыМимо[ч] || 0) + 1;
    });
    if (/^(width|height|min-width|max-width|min-height|max-height)$/.test(имя)) иныеЧисла[имя + ': ' + v] = (иныеЧисла[имя + ': ' + v] || 0) + 1;
}));
console.log('');
console.log('КЕГЛИ В ИНЛАЙНАХ (мимо шкалы помечены ✗):');
Object.entries(кегли).sort((a, b) => b[1] - a[1]).forEach(([v, н]) =>
    console.log('  ' + String(н).padStart(4) + '  ' + v +
        (/^\d+(\.\d+)?px$/.test(v) ? (ШКАЛА_КЕГЛЕЙ.has(v) ? '  ступень' : '  ✗ МИМО ШКАЛЫ') : '  (не px)')));
console.log('');
console.log('ОТСТУПЫ МИМО ШКАЛЫ (значения):');
Object.entries(отступыМимо).sort((a, b) => b[1] - a[1]).forEach(([v, н]) =>
    console.log('  ' + String(н).padStart(4) + '  ' + v));
console.log('');
console.log('РАЗМЕРЫ В ИНЛАЙНАХ:');
Object.entries(иныеЧисла).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([v, н]) =>
    console.log('  ' + String(н).padStart(4) + '  ' + v));
console.log('');
console.log('СВОЙСТВА В ИНЛАЙНАХ (сверху частые):');
Object.entries(свойства).sort((a, b) => b[1] - a[1]).slice(0, 25)
    .forEach(([к, н]) => console.log('  ' + String(н).padStart(4) + '  ' + к));
console.log('');
console.log('ПО ВМЕЩАЮЩИМ ФУНКЦИЯМ (сверху тяжёлые):');
Object.entries(поФункциям).sort((a, b) => b[1] - a[1]).slice(0, 25)
    .forEach(([к, н]) => console.log('  ' + String(н).padStart(4) + '  ' + к));
console.log('');
console.log('ФУНКЦИЙ В ФАЙЛЕ        ' + функции.length);
console.log('ЗОВОВ A.оболочкаОкна   ' + зововОболочки);
console.log('УПОМИНАНИЙ запирания   ' + запереть);

/* ТАЙМЕРЫ ЧИТАЮТСЯ ДЕРЕВОМ, А НЕ РЕГУЛЯРКОЙ: тело многострочное, и
   `setTimeout([^)]*, *100)` его не видит — на этом я ошибся первым замером. */
const таймеры2 = [];
(function обход2(узел, родитель) {
    if (!узел || typeof узел !== 'object') return;
    if (Array.isArray(узел)) { узел.forEach(у => обход2(у, родитель)); return; }
    if (!узел.type) return;
    if (узел.type === 'CallExpression' && узел.callee &&
        ((узел.callee.name === 'setTimeout') ||
         (узел.callee.property && узел.callee.property.name === 'setTimeout'))) {
        const д = узел.arguments[1];
        const тело = узел.arguments[0] ? т.slice(узел.arguments[0].range[0], узел.arguments[0].range[1]) : '';
        таймеры2.push({
            строка: т.slice(0, узел.range[0]).split('\n').length,
            задержка: д ? т.slice(д.range[0], д.range[1]) : '(нет)',
            слушатель: /addEventListener|\.onclick|\.onkeydown|\.oninput/.test(тело),
            поиск: /getElementById/.test(тело)
        });
    }
    for (const к of Object.keys(узел)) {
        if (к === 'range' || к === 'type') continue;
        обход2(узел[к], узел);
    }
})(дерево, null);

console.log('ТАЙМЕРОВ (деревом)     ' + таймеры2.length);
таймеры2.sort((a, b) => a.строка - b.строка).forEach(т2 => console.log('  :' + т2.строка +
    '  задержка ' + т2.задержка + (т2.слушатель ? '  НАВЕШИВАЕТ СЛУШАТЕЛЬ' : '') +
    (т2.поиск ? '  ИЩЕТ УЗЕЛ ПО ID' : '')));

/* ОКНА: функция, которая показывает окно — ставит active/appendChild подложки */
const окна = [];
функции.forEach(ф => {
    const тело = т.slice(ф.от, ф.до);
    const показ = /classList\.add\('active'\)|classList\.add\("active"\)|\.style\.display\s*=\s*'flex'|appendChild\(/.test(тело);
    const разметка = /(modal|overlay|подлож|окно)/i.test(тело) && /innerHTML/.test(тело);
    if (показ && разметка) {
        окна.push({
            имя: ф.имя, строка: ф.строка, длина: тело.split('\n').length,
            оболочка: /A\.оболочкаОкна/.test(тело),
            escape: /Escape/.test(тело),
            роль: /role\s*=\s*.dialog|aria-modal/.test(тело),
            фокус: /\.focus\(/.test(тело)
        });
    }
});
/* оставляем только САМЫЕ УЗКИЕ: вмещающая функция тоже проходит признак */
const свои = окна.filter(о => !окна.some(д => д !== о && д.строка >= о.строка &&
    (д.строка + д.длина) <= (о.строка + о.длина) && д.длина < о.длина));
console.log('');
console.log('ОКНА ФАЙЛА (показывают окно своей разметкой): ' + свои.length);
свои.sort((a, b) => a.строка - b.строка).forEach(о => console.log('  :' + о.строка + '  ' +
    о.имя + '  строк ' + о.длина +
    (о.оболочка ? '  ОБОЛОЧКА' : '  своё') +
    (о.роль ? '  role' : '') + (о.escape ? '  Escape' : '') + (о.фокус ? '  focus' : '')));


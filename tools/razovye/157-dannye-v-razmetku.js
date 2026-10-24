/**
 * ДАННЫЕ, УХОДЯЩИЕ В РАЗМЕТКУ БЕЗ ЭКРАНИРОВАНИЯ. Разовый прибор куска 157.
 *
 * ПОЧЕМУ СТОРОЖ ЭКРАНИРОВАНИЯ ЭТОГО НЕ ВИДИТ. `check-ekranirovanie.js`
 * зелёный и проверяет КАЧЕСТВО функций: гасит ли экранирование обе кавычки,
 * нет ли слабых написаний. Он не спрашивает, ПРИМЕНЕНО ли оно к данным.
 * Функция может быть безупречной, а имя турнира идти в разметку мимо неё —
 * ровно это кусок 154 нашёл в админке СТЕНДОМ, а не чтением.
 *
 * ПРИЗНАК. Берём места, где строка становится разметкой (`innerHTML`,
 * `insertAdjacentHTML`, `outerHTML`), разбираем склейку и смотрим КАЖДУЮ
 * подставленную часть:
 *   безопасно — литерал; зов экранирования; слово из словаря (`L.*`,
 *     `labels.*`, `SUB.*`, `L2.*`); число; зов дома, который сам
 *     экранирует; тернарник, у которого безопасны ОБЕ ветви;
 *   опасно — всё остальное: поле объекта данных, переменная со стороны.
 *
 * ПРИБОР ОТДАЁТ КАНДИДАТОВ, А НЕ ПРИГОВОР: переменная может нести готовую
 * разметку по замыслу (список потерь турнира, кадры ленты), и это
 * разбирается ЧТЕНИЕМ. Числа ниже — повод читать, а не считать беду.
 *
 *   node tools/razovye/157-dannye-v-razmetku.js [--все]
 */
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(__dirname, '..', '..', 'node_modules', 'acorn'));

const КОРЕНЬ = path.join(__dirname, '..', '..');
const чит = о => fs.readFileSync(path.join(КОРЕНЬ, о), 'utf8');
const всё = process.argv.indexOf('--все') !== -1;

function всеJS(дир, итог) {
    итог = итог || [];
    for (const э of fs.readdirSync(дир, { withFileTypes: true })) {
        const п = path.join(дир, э.name);
        if (э.isDirectory()) всеJS(п, итог);
        else if (э.name.endsWith('.js')) итог.push(path.relative(КОРЕНЬ, п).split(path.sep).join('/'));
    }
    return итог;
}

const ЭКРАНЫ = ['KSLT_экранировать', 'esc', 'escH', 'escUsrHtml', 'dbEsc', 'escHtml', 'экр'];
const СЛОВАРИ = ['L', 'L2', 'SUB', 'labels', 'ТЕКСТЫ', 'T', 'LB'];
/* Текстовые поля без подчёркивания, которые пишет человек. Остальные поля
   базы ловятся по `snake_case`. */
const ТЕКСТОВЫЕ_ПОЛЯ = ['title', 'name', 'message', 'description', 'venue', 'comment',
    'email', 'phone', 'text', 'note', 'city', 'club', 'address', 'nickname', 'bio',
    'label', 'reason', 'slug'];
const ДОМА_БЕЗОПАСНЫЕ = ['KSLT_LICO', 'KSLT_SLOY', 'KSLT_VAUCHER', 'KSLT_MESTA',
                          'KSLT_STATUS', 'KSLT_TBLOCK', 'KSLT_SLOTS', 'KSLT_LENTA',
                          'KSLT_VIDEO', 'KSLT_KARTA', 'KSLT_OTSECHKA', 'KSLT_CONTACT_ICONS'];

function имяЗова(у) {
    if (!у.callee) return null;
    if (у.callee.type === 'Identifier') return у.callee.name;
    if (у.callee.type === 'MemberExpression') {
        const об = у.callee.object, св = у.callee.property;
        const имяОб = об.type === 'Identifier' ? об.name :
            (об.type === 'MemberExpression' && об.property.type === 'Identifier' ? об.property.name : null);
        const имяСв = св.type === 'Identifier' ? св.name : null;
        return (имяОб ? имяОб + '.' : '') + (имяСв || '');
    }
    return null;
}

/* Безопасна ли подстановка. Рекурсивно: склейка, тернарник, логическое ИЛИ. */
function безопасно(у, т) {
    if (!у) return true;
    if (у.type === 'Literal' || у.type === 'TemplateLiteral') return true;
    if (у.type === 'BinaryExpression' && у.operator === '+')
        return безопасно(у.left, т) && безопасно(у.right, т);
    if (у.type === 'ConditionalExpression')
        return безопасно(у.consequent, т) && безопасно(у.alternate, т);
    if (у.type === 'LogicalExpression')
        return безопасно(у.left, т) && безопасно(у.right, т);
    if (у.type === 'CallExpression') {
        const имя = имяЗова(у) || '';
        const послеТочки = имя.indexOf('.') !== -1 ? имя.split('.')[1] : имя;
        if (ЭКРАНЫ.indexOf(послеТочки) !== -1 || ЭКРАНЫ.indexOf(имя) !== -1) return true;
        const доТочки = имя.split('.')[0];
        if (ДОМА_БЕЗОПАСНЫЕ.indexOf(доТочки) !== -1) return true;
        /* `String(x)`, `Number(x)`, `n.toFixed(1)` — не разметка. */
        if (['String', 'Number', 'parseInt', 'parseFloat', 'toFixed', 'Math.round',
             'Math.max', 'Math.min', 'Math.abs'].indexOf(имя) !== -1) return true;
        if (['toFixed', 'length', 'toString', 'padStart', 'join', 'map'].indexOf(послеТочки) !== -1) return false;
        /* ЗОВ СВОЕЙ ФУНКЦИИ СЧИТАЕТСЯ БЕЗОПАСНЫМ, И ЭТО СЛЕПОТА ПРИЗНАКА,
           НАЗВАННАЯ ВСЛУХ. `trnColHeader('title', L.trnTitle)`,
           `A.пустоеСостояние({…})`, `renderStatCard(…)` возвращают готовую
           разметку, и их подстановка — не подстановка данных. Но если дыра
           внутри ТАКОЙ функции, прибор увидит её лишь когда та сама пишет в
           `innerHTML`; функция, ОТДАЮЩАЯ строку наружу, для него невидима.
           Это следующий заход, и число 320 (с зовами) против 45 (без) — его
           мера. СЧИТАЕТСЯ ТО, ЧТО МОЖНО ПРОЧИТАТЬ ГЛАЗАМИ ЗА ОДИН КУСОК. */
        return true;
    }
    if (у.type === 'MemberExpression') {
        const корневое = (function корень(x) {
            while (x && x.type === 'MemberExpression') x = x.object;
            return x && x.type === 'Identifier' ? x.name : null;
        })(у);
        if (корневое && СЛОВАРИ.indexOf(корневое) !== -1) return true;
        if (корневое && ДОМА_БЕЗОПАСНЫЕ.indexOf(корневое) !== -1) return true;
        /* ПРИЗНАК СУЖЕН ДО ТЕКСТОВЫХ ПОЛЕЙ БАЗЫ, И ЭТО ПОСЧИТАНО: широкий
           признак дал 950 кандидатов в 67 файлах, и большинство — переменные
           с ГОТОВОЙ разметкой (`html`, собранные строки карточек). Читать 950
           мест нельзя, а значит и беды в них не видно.
           Опасно то, что ПИШЕТ ЧЕЛОВЕК и что лежит в базе: имя, название,
           сообщение, место, заметка. Признак — имя поля: `snake_case` (так
           названы все поля базы) либо известное текстовое поле. */
        const свойство = у.property && у.property.type === 'Identifier' ? у.property.name : null;
        if (!свойство) return true;
        const полеБазы = свойство.indexOf('_') !== -1 ||
            ТЕКСТОВЫЕ_ПОЛЯ.indexOf(свойство) !== -1;
        return !полеБазы;
    }
    if (у.type === 'Identifier') {
        /* Одиночная переменная чаще несёт ГОТОВУЮ разметку: собранные
           карточки, строки таблицы, список потерь. Прибор её не считает —
           иначе числа тонут. Такие места разбираются чтением окна. */
        return true;
    }
    if (у.type === 'UnaryExpression') return безопасно(у.argument, т);
    return false;
}

function частиСклейки(у, итог) {
    итог = итог || [];
    if (у.type === 'BinaryExpression' && у.operator === '+') {
        частиСклейки(у.left, итог);
        частиСклейки(у.right, итог);
    } else итог.push(у);
    return итог;
}

const находки = [];
всеJS(path.join(КОРЕНЬ, 'js')).forEach(ф => {
    const т = чит(ф);
    let д;
    try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }
    (function поДереву(у) {
        if (!у || typeof у !== 'object') return;
        if (Array.isArray(у)) { у.forEach(поДереву); return; }

        let выражение = null, куда = null;
        if (у.type === 'AssignmentExpression' && у.left.type === 'MemberExpression' &&
            у.left.property.type === 'Identifier' &&
            ['innerHTML', 'outerHTML'].indexOf(у.left.property.name) !== -1) {
            выражение = у.right; куда = у.left.property.name;
        }
        if (у.type === 'CallExpression' && имяЗова(у) &&
            имяЗова(у).indexOf('insertAdjacentHTML') !== -1 && у.arguments.length > 1) {
            выражение = у.arguments[1]; куда = 'insertAdjacentHTML';
        }
        if (выражение) {
            частиСклейки(выражение).forEach(часть => {
                if (безопасно(часть, т)) return;
                находки.push({
                    файл: ф,
                    строка: часть.loc.start.line,
                    куда: куда,
                    текст: т.slice(часть.start, часть.end).replace(/\s+/g, ' ').slice(0, 76)
                });
            });
        }
        for (const к in у) if (к !== 'loc' && к !== 'start' && к !== 'end') поДереву(у[к]);
    })(д);
});

/* РОД ПОЛЯ РЕШАЕТ ЦЕНУ. Кавычка в числе базы невозможна: столбец целый. А
   название турнира, заметку и имя пишет ЧЕЛОВЕК в админке, и там кавычка
   закрывает атрибут, а `<img src=x onerror=…>` становится внедрением. */
const ПИШЕТ_ЧЕЛОВЕК = /(title|name|text|note|message|description|venue|comment|address|city|club|reason|nickname|bio|label|slug|email|phone)/i;
const ЧИСЛО_ИЛИ_ДАТА = /(_count|_participants|_spots|fee_|duration|per_group|_at$|_start$|_end$|^date|_id$|price|amount|points|rating|ntrp)/i;
находки.forEach(н => {
    н.род = ПИШЕТ_ЧЕЛОВЕК.test(н.текст) ? 'ЧЕЛОВЕК'
          : (ЧИСЛО_ИЛИ_ДАТА.test(н.текст) ? 'число/дата' : 'разобрать');
});
const поФайлам = {};
находки.forEach(н => { (поФайлам[н.файл] = поФайлам[н.файл] || []).push(н); });
const счёт = { 'ЧЕЛОВЕК': 0, 'число/дата': 0, 'разобрать': 0 };
находки.forEach(н => счёт[н.род]++);
console.log('ПОДСТАНОВОК В РАЗМЕТКУ МИМО ЭКРАНИРОВАНИЯ: ' + находки.length +
            ' в ' + Object.keys(поФайлам).length + ' файлах');
console.log('   пишет ЧЕЛОВЕК (цена высока): ' + счёт['ЧЕЛОВЕК'] +
            '   ·   число или дата базы: ' + счёт['число/дата'] +
            '   ·   разобрать чтением: ' + счёт['разобрать']);
console.log('(прибор отдаёт КАНДИДАТОВ: часть несёт готовую разметку по замыслу)');
console.log('');
Object.keys(поФайлам).sort((a, b) => поФайлам[b].length - поФайлам[a].length).forEach(ф => {
    console.log(ф + '  ·  ' + поФайлам[ф].length);
    (всё ? поФайлам[ф] : поФайлам[ф].slice(0, 3)).forEach(н =>
        console.log('        :' + н.строка + '  [' + н.род + ']  ' + н.текст));
    if (!всё && поФайлам[ф].length > 3) console.log('        … и ещё ' + (поФайлам[ф].length - 3));
});

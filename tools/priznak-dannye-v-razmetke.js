/**
 * ПРИЗНАК «ДАННЫЕ В РАЗМЕТКЕ» — ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ.
 *
 * Отдельный файл, потому что признак нужен и сторожу, и прувер его не должен
 * переписывать: два определения одного понятия родят беду ровно на шве.
 *
 * ЧТО ВЫВОДИТСЯ ЧТЕНИЕМ, А НЕ СПИСКОМ ИМЁН (кусок 158):
 *
 *  1. СТОЛБЕЦ ПИШЕТ ЧЕЛОВЕК — из схемы базы: тип текстовый, CHECK со списком
 *     значений нет, и это не идентификатор. Имена больше не угадываются:
 *     признак 157 гадал по списку слов и не видел `block.author`, потому что
 *     слова `author` в списке не было.
 *
 *  2. СЛОВАРЬ — местная переменная, которой присвоен объект-литерал,
 *     `KSLT_YAZYK.выбрать(...)` или зов вида `getLabels()`.
 *
 *  3. ЭКРАНИРОВАННЫЙ ДОВОД — по ДОВОДУ, А НЕ ПО ФУНКЦИИ. `кружокИгрока`
 *     экранирует имя и фото, но не класс; считать её целиком экраном — врать,
 *     не считать вовсе — потерять шесть переходников. Для каждой функции
 *     вычисляется НАБОР НОМЕРОВ доводов, обёрнутых на КАЖДОМ пути выдачи;
 *     замыкание по зовам считается, пока набор растёт.
 *
 *  4. ПРОВЕРКА НА ПУСТОТУ — НЕ ПОДСТАНОВКА. `(x ? экр(x) : '')` безопасно:
 *     в строку идут ветки вывода, а не условие. Прибор, считавший условие,
 *     давал 29 дыр вместо 17.
 */
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(__dirname, '..', 'node_modules', 'acorn'));
const КОРЕНЬ = path.join(__dirname, '..');

const БАЗОВЫЕ_ЭКРАНЫ = ['KSLT_экранировать', 'esc', 'escH', 'escUsrHtml', 'dbEsc',
                        'escHtml', 'экр', 'текстом', 'encodeURIComponent'];
const ДОМА = ['KSLT_LICO', 'KSLT_SLOY', 'KSLT_VAUCHER', 'KSLT_MESTA', 'KSLT_STATUS',
              'KSLT_TBLOCK', 'KSLT_SLOTS', 'KSLT_LENTA', 'KSLT_VIDEO', 'KSLT_KARTA',
              'KSLT_OTSECHKA', 'KSLT_CONTACT_ICONS', 'KSLT_YAZYK', 'KSLT_RULES',
              'KSLT_TFEATURED', 'A'];
const РАЗМЕТКА = /<\/?[a-z][a-z0-9-]*[\s>\/]/i;
const ФУНК = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
const В_АТРИБУТЕ = /=\s*["']$/;

function всеJS(дир, итог) {
    итог = итог || [];
    for (const э of fs.readdirSync(дир, { withFileTypes: true })) {
        const п = path.join(дир, э.name);
        if (э.isDirectory()) всеJS(п, итог);
        else if (э.name.endsWith('.js')) итог.push(path.relative(КОРЕНЬ, п).split(path.sep).join('/'));
    }
    return итог;
}

/** Столбцы, которые пишет человек — ЧИТАЮТСЯ ИЗ СХЕМЫ. */
function столбцыЧеловека() {
    const дир = path.join(КОРЕНЬ, 'supabase', 'migrations');
    let схема = fs.readdirSync(дир).filter(и => и.endsWith('.sql'))
        .map(и => fs.readFileSync(path.join(дир, и), 'utf8')).join('\n');
    схема += fs.readFileSync(path.join(КОРЕНЬ, 'supabase', 'schema.sql'), 'utf8');
    const набор = new Set();
    const сПодчерком = [];
    схема.split('\n').forEach(с => {
        const м = /["']?([a-z_][a-z0-9_]*)["']?\s+["']?(?:text|character varying|varchar|citext)["']?/i.exec(с);
        if (!м) return;
        const имя = м[1];
        if (имя.charAt(0) === '_') сПодчерком.push(имя);
        if (/\bCHECK\b/i.test(с)) return;
        if (имя === 'id' || /_id$/.test(имя) || /uuid/i.test(с)) return;
        набор.add(имя);
    });
    return { набор: набор, сПодчерком: сПодчерком };
}

function имяЗова(у) {
    if (!у.callee) return null;
    if (у.callee.type === 'Identifier') return у.callee.name;
    if (у.callee.type === 'MemberExpression') {
        const об = у.callee.object, св = у.callee.property;
        const и = об.type === 'Identifier' ? об.name
            : (об.type === 'MemberExpression' && об.property.type === 'Identifier' ? об.property.name : null);
        return (и ? и + '.' : '') + (св.type === 'Identifier' ? св.name : '');
    }
    return null;
}
function корень(x) {
    while (x && (x.type === 'MemberExpression' || x.type === 'CallExpression')) x = x.object || x.callee;
    const имя = x && x.type === 'Identifier' ? x.name : null;
    return имя;
}
/** Корень БЕЗ `window`: `window.KSLT_SLOY.слой` — это дом, а не `window`. */
function корень2(x) {
    const путь = [];
    let н = x;
    while (н && (н.type === 'MemberExpression' || н.type === 'CallExpression')) {
        if (н.type === 'MemberExpression' && н.property && н.property.type === 'Identifier') путь.unshift(н.property.name);
        н = н.object || н.callee;
    }
    if (н && н.type === 'Identifier') путь.unshift(н.name);
    while (путь.length > 1 && (путь[0] === 'window' || путь[0] === 'globalThis')) путь.shift();
    return путь[0] || null;
}
function обход(у, дело) {
    if (!у || typeof у !== 'object') return;
    if (Array.isArray(у)) return у.forEach(н => обход(н, дело));
    дело(у);
    for (const к in у) if (к !== 'loc' && к !== 'start' && к !== 'end') обход(у[к], дело);
}
function свои(у, дело) {           /* обход тела функции БЕЗ вложенных функций */
    (function х(н) {
        if (!н || typeof н !== 'object') return;
        if (Array.isArray(н)) return н.forEach(х);
        if (н !== у && ФУНК.indexOf(н.type) !== -1) return;
        дело(н);
        for (const к in н) if (к !== 'loc' && к !== 'start' && к !== 'end') х(н[к]);
    })(у.body);
}
function части(у, и) {
    и = и || [];
    if (у.type === 'BinaryExpression' && у.operator === '+') { части(у.left, и); части(у.right, и); }
    else и.push(у);
    return и;
}
function естьРазметка(с) {
    return с.some(ч => (ч.type === 'Literal' && typeof ч.value === 'string' && РАЗМЕТКА.test(ч.value)) ||
        (ч.type === 'TemplateLiteral' && ч.quasis.some(q => РАЗМЕТКА.test(q.value.raw))));
}

function разобрать(файлы) {
    const деревья = {};
    (файлы || всеJS(path.join(КОРЕНЬ, 'js'))).forEach(ф => {
        const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
        try { деревья[ф] = { т: т, д: acorn.parse(т, { ecmaVersion: 2020, locations: true }) }; }
        catch (e) { /* файл не разбирается — его считает другой сторож */ }
    });
    return деревья;
}

/**
 * Словари файла. Три вида, и все три ЧИТАЮТСЯ:
 *  - переменная, которой присвоен объект-литерал или `KSLT_YAZYK.выбрать(...)`;
 *  - перечисление-литерал (массив объектов) — его пункты тоже свои;
 *  - ДОВОД ОБХОДЧИКА такого перечисления: `ПУНКТЫ.forEach(function (s) {…})`
 *    даёт `s`, у которого данных базы нет. Без этого правила «ярлык из своего
 *    перечисления» признак считал полем человека: имена `label`, `icon`,
 *    `title` есть и в базе.
 */
function словариФайла(д) {
    const н = new Set();
    const свои_перечисления = new Set();
    обход(д, у => {
        if (у.type !== 'VariableDeclarator' || у.id.type !== 'Identifier' || !у.init) return;
        const и = у.init;
        if (и.type === 'ObjectExpression') н.add(у.id.name);
        else if (и.type === 'ArrayExpression') свои_перечисления.add(у.id.name);
        else if (и.type === 'ConditionalExpression' &&
                 и.consequent.type === 'ArrayExpression' && и.alternate.type === 'ArrayExpression')
            свои_перечисления.add(у.id.name);
        else if (и.type === 'CallExpression') {
            const зов = имяЗова(и) || '';
            if (зов.indexOf('выбрать') !== -1 || /^get[A-Z]|[Ll]abels$/.test(зов)) н.add(у.id.name);
            /* `[{…}].concat(что-то)` перечислением своим НЕ становится:
               данные приходят вторым слагаемым. Проверено на новостях. */
        }
    });
    /* доводы обходчиков своих перечислений */
    обход(д, у => {
        if (у.type !== 'CallExpression' || !у.callee || у.callee.type !== 'MemberExpression') return;
        const метод = у.callee.property && у.callee.property.type === 'Identifier' ? у.callee.property.name : '';
        if (['forEach', 'map', 'filter', 'some', 'every', 'find'].indexOf(метод) === -1) return;
        const корешок = у.callee.object;
        const имяПеречисления = корешок && корешок.type === 'Identifier' ? корешок.name : null;
        if (!имяПеречисления || !свои_перечисления.has(имяПеречисления)) return;
        const тело = у.arguments[0];
        if (!тело || ФУНК.indexOf(тело.type) === -1) return;
        тело.params.forEach(п => { if (п.type === 'Identifier') н.add(п.name); });
    });
    свои_перечисления.forEach(и => н.add(и));
    return н;
}

/**
 * Для каждой функции файла — НАБОР НОМЕРОВ доводов, экранированных на каждом
 * пути выдачи. Замыкание: функция, зовущая другую с экранированным доводом,
 * сама становится экраном для своего.
 */
function экраныФайла(д, словарь) {
    /* MAP, А НЕ ОБЪЕКТ: у объекта есть `toString` из прототипа, и признак
       принимал зов `toString` за экран — падал на `набор.has`.
       СПИСОК ПО ИМЕНИ ЖИВЁТ В MAP, ИНАЧЕ В НЁМ УЖЕ ЕСТЬ ЧУЖИЕ ИМЕНА. */
    const экраны = new Map();          /* имя -> 'все' | Set номеров доводов */
    БАЗОВЫЕ_ЭКРАНЫ.forEach(и => экраны.set(и, 'все'));
    const функции = [];
    обход(д, у => { if (у.type === 'FunctionDeclaration' && у.id) функции.push(у); });

    function подЭкраном(выдача, довод) {
        let обёрнут = true, встретился = false;
        (function х(н, под) {
            if (!н || typeof н !== 'object') return;
            if (Array.isArray(н)) return н.forEach(э => х(э, под));
            /* ПРОВЕРКА НА ПУСТОТУ — НЕ ПОДСТАНОВКА, и при выводе экранов тоже:
               `фото ? '<img src=' + экр(фото) : …` — довод обёрнут, хотя в
               условии он стоит как есть. Без этого шесть переходников,
               экранирующих своё, экранами не считались. */
            if (н.type === 'ConditionalExpression') { х(н.consequent, под); х(н.alternate, под); return; }
            if (н.type === 'LogicalExpression' && н.operator === '&&') { х(н.right, под); return; }
            let п = под;
            if (н.type === 'CallExpression') {
                const зов = имяЗова(н) || '';
                const хвост = зов.indexOf('.') !== -1 ? зов.split('.')[1] : зов;
                const набор = экраны.get(зов) || экраны.get(хвост);
                if (набор === 'все' || ДОМА.indexOf(корень2(н)) !== -1) п = true;
                else if (набор) {
                    /* экран только для своих номеров: остальные доводы идут как есть */
                    н.arguments.forEach((а, и) => х(а, под || набор.has(и)));
                    х(н.callee, под);
                    return;
                }
            }
            if (н.type === 'Identifier' && н.name === довод) {
                встретился = true;
                if (!п) обёрнут = false;
            }
            for (const к in н) if (к !== 'loc' && к !== 'start' && к !== 'end') х(н[к], п);
        })(выдача, false);
        return { обёрнут: обёрнут, встретился: встретился };
    }

    let росло = true, круг = 0;
    while (росло && круг < 8) {
        росло = false; круг++;
        функции.forEach(ф => {
            const имя = ф.id.name;
            if (экраны.get(имя) === 'все') return;
            const выдачи = [];
            свои(ф, н => { if (н.type === 'ReturnStatement' && н.argument) выдачи.push(н.argument); });
            if (!выдачи.length) return;
            const набор = экраны.get(имя) ? new Set(экраны.get(имя)) : new Set();
            ф.params.forEach((п, и) => {
                if (п.type !== 'Identifier' || набор.has(и)) return;
                let виден = false, чисто = true;
                выдачи.forEach(в => {
                    const р = подЭкраном(в, п.name);
                    if (р.встретился) { виден = true; if (!р.обёрнут) чисто = false; }
                });
                if (виден && чисто) { набор.add(и); росло = true; }
            });
            if (набор.size) экраны.set(имя, набор);
        });
    }
    void словарь;
    return экраны;
}

/**
 * Находки файла. Возвращает { дыры, вАтрибуте, зовы, отдают, копят, склеек }.
 * Дыра — чтение столбца, который пишет человек, попавшее в строку с разметкой
 * не под экраном и не из словаря.
 */
function находкиФайла(ф, т, д, ПИШЕТ) {
    const словарь = словариФайла(д);
    const экраны = экраныФайла(д, словарь);
    const дыры = [], вАтрибуте = [];
    let зовы = 0, отдают = 0, копят = 0, склеек = 0, переменных = 0;

    обход(д, у => {
        if (ФУНК.indexOf(у.type) === -1) return;
        let отдаёт = false, копит = false;
        свои(у, н => {
            if (н.type === 'ReturnStatement' && н.argument && естьРазметка(части(н.argument))) отдаёт = true;
            if (н.type === 'AssignmentExpression' && н.operator === '+=' && естьРазметка(части(н.right))) копит = true;
        });
        if (отдаёт) отдают++;
        else if (копит) копят++;
    });

    function чужое(у, итог) {
        if (!у || typeof у !== 'object') return итог;
        if (Array.isArray(у)) { у.forEach(н => чужое(н, итог)); return итог; }
        /* проверка на пустоту — не подстановка */
        if (у.type === 'ConditionalExpression') { чужое(у.consequent, итог); чужое(у.alternate, итог); return итог; }
        if (у.type === 'LogicalExpression' && у.operator === '&&') { чужое(у.right, итог); return итог; }
        if (у.type === 'CallExpression') {
            const зов = имяЗова(у) || '';
            const хвост = зов.indexOf('.') !== -1 ? зов.split('.')[1] : зов;
            const набор = экраны.get(зов) || экраны.get(хвост);
            if (набор === 'все' || ДОМА.indexOf(корень2(у)) !== -1) return итог;
            if (набор) {
                у.arguments.forEach((а, и) => { if (!набор.has(и)) чужое(а, итог); });
                return итог;
            }
            /* ЗОВ НЕ ЧИТАЕТ ДАННЫЕ СВОИМ ИМЕНЕМ: `Math.round(x)` — это не
               чтение столбца `round`. Смотрим доводы, имя зова пропускаем. */
            у.arguments.forEach(а => чужое(а, итог));
            return итог;
        }
        /* `item.bio.length` — это число, а не текст поля. ДЛИНА — НЕ ЗНАЧЕНИЕ. */
        if (у.type === 'MemberExpression' && у.property && у.property.type === 'Identifier' &&
            у.property.name === 'length') { чужое(у.object.object || {}, итог); return итог; }
        if (у.type === 'MemberExpression' && у.property && у.property.type === 'Identifier' &&
            ПИШЕТ.has(у.property.name)) {
            const к = корень2(у);
            if (!(к && (словарь.has(к) || ДОМА.indexOf(к) !== -1))) itog(итог, у);
        }
        for (const к in у) if (к !== 'loc' && к !== 'start' && к !== 'end') чужое(у[к], итог);
        return итог;
    }
    function itog(итог, у) { итог.push(у); }

    (function х(у, р) {
        if (!у || typeof у !== 'object') return;
        if (Array.isArray(у)) return у.forEach(н => х(н, р));
        if (у.type === 'BinaryExpression' && у.operator === '+' &&
            !(р && р.type === 'BinaryExpression' && р.operator === '+')) {
            const сп = части(у);
            if (естьРазметка(сп)) {
                склеек++;
                сп.forEach((ч, и) => {
                    /* ПЕРЕМЕННАЯ, В КОТОРУЮ ПОЛОЖИЛИ ПОЛЕ, ДЛЯ ПРИЗНАКА
                       НЕВИДИМА. Так в `tournament-blocks.js` адрес афиши
                       попал в `style="…url(` мимо экранирования: поле
                       положили в `постер`. Число — мера этой слепоты. */
                    if (ч.type === 'Identifier') переменных++;
                    if (ч.type === 'CallExpression') {
                        const зов = имяЗова(ч) || '';
                        const хвост = зов.indexOf('.') !== -1 ? зов.split('.')[1] : зов;
                        if (!(экраны.get(зов) || экраны.get(хвост)) && ДОМА.indexOf(корень2(ч)) === -1) зовы++;
                    }
                    const метка = ч => ф + ':' + ч.loc.start.line + '  ' +
                        т.slice(ч.start, ч.end).replace(/\s+/g, ' ').slice(0, 42);
                    чужое(ч, []).forEach(н => дыры.push(метка(н)));
                    const слева = сп[и - 1];
                    const хвостЛит = слева && слева.type === 'Literal' && typeof слева.value === 'string'
                        ? слева.value
                        : (слева && слева.type === 'TemplateLiteral'
                            ? слева.quasis[слева.quasis.length - 1].value.raw : null);
                    if (хвостЛит && В_АТРИБУТЕ.test(хвостЛит)) чужое(ч, []).forEach(н => вАтрибуте.push(метка(н)));
                });
            }
        }
        for (const к in у) if (к !== 'loc' && к !== 'start' && к !== 'end') х(у[к], у);
    })(д, null);

    return { дыры: дыры, вАтрибуте: вАтрибуте, зовы: зовы, отдают: отдают, копят: копят,
             склеек: склеек, переменных: переменных };
}

function собрать() {
    const { набор, сПодчерком } = столбцыЧеловека();
    const деревья = разобрать();
    const итог = { дыры: [], вАтрибуте: [], зовы: 0, отдают: 0, копят: 0, склеек: 0,
                   переменных: 0, столбцов: набор.size, сПодчерком: сПодчерком };
    for (const ф in деревья) {
        const н = находкиФайла(ф, деревья[ф].т, деревья[ф].д, набор);
        итог.дыры = итог.дыры.concat(н.дыры);
        итог.вАтрибуте = итог.вАтрибуте.concat(н.вАтрибуте);
        итог.зовы += н.зовы; итог.отдают += н.отдают; итог.копят += н.копят;
        итог.склеек += н.склеек; итог.переменных += н.переменных;
    }
    итог.дыры = [...new Set(итог.дыры)];
    итог.вАтрибуте = [...new Set(итог.вАтрибуте)];
    return итог;
}

module.exports = { собрать: собрать, всеJS: всеJS, КОРЕНЬ: КОРЕНЬ };

if (require.main === module) {
    const и = собрать();
    const публ = и.дыры.filter(с => !с.startsWith('js/admin/'));
    console.log('столбцов, которые пишет человек:', и.столбцов);
    console.log('склеек с разметкой:', и.склеек, '| отдают:', и.отдают, '| копят:', и.копят, '| зовов:', и.зовы);
    console.log('ДЫР:', и.дыры.length, '| публичных:', публ.length, '| админских:', и.дыры.length - публ.length);
    console.log('в атрибуте:', и.вАтрибуте.length);
    console.log('\n--- ПУБЛИЧНЫЕ ---');
    публ.forEach((д, i) => console.log(String(i + 1).padStart(3) + '. ' + д));
}

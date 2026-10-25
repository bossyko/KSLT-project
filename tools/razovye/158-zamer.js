/** ЗАМЕР 158 — чем слеп признак 157. Разовый прибор, только счёт. */
const fs = require('fs'), path = require('path');
const acorn = require(path.join(__dirname, '..', '..', 'node_modules', 'acorn'));
const КОРЕНЬ = path.join(__dirname, '..', '..');

function всеJS(дир, итог) {
    итог = итог || [];
    for (const э of fs.readdirSync(дир, { withFileTypes: true })) {
        const п = path.join(дир, э.name);
        if (э.isDirectory()) всеJS(п, итог);
        else if (э.name.endsWith('.js')) итог.push(path.relative(КОРЕНЬ, п).split(path.sep).join('/'));
    }
    return итог;
}
const РАЗМЕТКА = /<\/?[a-z][a-z0-9-]*[\s>\/]/i;
function несётРазметку(у) {
    let да = false;
    (function х(н) {
        if (!н || typeof н !== 'object' || да) return;
        if (Array.isArray(н)) return н.forEach(х);
        if (н.type === 'Literal' && typeof н.value === 'string' && РАЗМЕТКА.test(н.value)) { да = true; return; }
        if (н.type === 'TemplateLiteral') н.quasis.forEach(q => { if (РАЗМЕТКА.test(q.value.raw)) да = true; });
        for (const к in н) if (к !== 'loc' && к !== 'start' && к !== 'end') х(н[к]);
    })(у);
    return да;
}
const ФУНК = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];

const счёт = { отдаютРазметку: 0, шаблонВРазметку: 0, вставокВШаблонах: 0, накопители: 0 };
const поФайлам = {};
всеJS(path.join(КОРЕНЬ, 'js')).forEach(ф => {
    const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
    let д; try { д = acorn.parse(т, { ecmaVersion: 2020, locations: true }); } catch (e) { return; }
    (function поДереву(у) {
        if (!у || typeof у !== 'object') return;
        if (Array.isArray(у)) return у.forEach(поДереву);

        if (ФУНК.indexOf(у.type) !== -1) {
            // свои return, не считая вложенных функций
            let отдаёт = false, накопитель = false;
            (function своё(н) {
                if (!н || typeof н !== 'object' || отдаёт) return;
                if (Array.isArray(н)) return н.forEach(своё);
                if (н !== у && ФУНК.indexOf(н.type) !== -1) return;
                if (н.type === 'ReturnStatement' && н.argument && несётРазметку(н.argument)) отдаёт = true;
                if (н.type === 'AssignmentExpression' && н.operator === '+=' && несётРазметку(н.right)) накопитель = true;
                for (const к in н) if (к !== 'loc' && к !== 'start' && к !== 'end') своё(н[к]);
            })(у.body);
            if (отдаёт) { счёт.отдаютРазметку++; поФайлам[ф] = (поФайлам[ф] || 0) + 1; }
            if (накопитель && !отдаёт) счёт.накопители++;
        }

        // шаблонная строка, несущая разметку, со вставками
        if (у.type === 'TemplateLiteral' && у.expressions.length &&
            у.quasis.some(q => РАЗМЕТКА.test(q.value.raw))) {
            счёт.шаблонВРазметку++;
            счёт.вставокВШаблонах += у.expressions.length;
        }
        for (const к in у) if (к !== 'loc' && к !== 'start' && к !== 'end') поДереву(у[к]);
    })(д);
});
console.log(JSON.stringify(счёт, null, 1));
console.log('файлов с функциями, отдающими разметку:', Object.keys(поФайлам).length);
console.log(Object.entries(поФайлам).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([ф, н]) => '  ' + н + '  ' + ф).join('\n'));

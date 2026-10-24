/**
 * ОДНО ИМЯ, ДВА ТЕЛА В ОДНОЙ ОБЛАСТИ. Разовый прибор куска 155.
 *
 * Повод: замер остатка копий нашёл в `js/services.js` функцию `shuffle`,
 * объявленную ДВА РАЗА на одном уровне одного IIFE, с РАЗНЫМИ телами.
 * В javascript объявления поднимаются, и побеждает последнее — значит
 * первое тело недостижимо. Прибор копий этого не видит: он группирует по
 * ТЕЛУ, и две разные записи одного имени для него просто не копии.
 *
 * МЁРТВЫМ КОД НАЗЫВАЕТСЯ ПОСЛЕ ПРОВЕРКИ: область берётся у парсера, а не
 * по отступу.
 *
 *   node tools/razovye/155-odno-imya-dva-tela.js
 */
const fs = require('fs');
const path = require('path');
const acorn = require(path.join(__dirname, '..', '..', 'node_modules', 'acorn'));

const КОРЕНЬ = path.join(__dirname, '..', '..');

function всеJS(дир, итог) {
    итог = итог || [];
    for (const э of fs.readdirSync(дир, { withFileTypes: true })) {
        const п = path.join(дир, э.name);
        if (э.isDirectory()) всеJS(п, итог);
        else if (э.name.endsWith('.js')) итог.push(п);
    }
    return итог;
}

let всего = 0;
for (const п of всеJS(path.join(КОРЕНЬ, 'js'))) {
    const текст = fs.readFileSync(п, 'utf8');
    let дерево;
    try { дерево = acorn.parse(текст, { ecmaVersion: 2020, locations: true }); }
    catch (e) { console.log('  ? не разобрался: ' + path.relative(КОРЕНЬ, п) + ' — ' + e.message); continue; }

    /* Одна область — одно тело функции или программа. Объявления собираем
       ТОЛЬКО с её собственного уровня блоков, не заходя внутрь вложенных
       функций: у них своя область. */
    (function область(узел, имяОбласти) {
        const объявления = {};
        (function блок(у) {
            if (!у || typeof у !== 'object') return;
            if (Array.isArray(у)) { у.forEach(блок); return; }
            if (у.type === 'FunctionDeclaration') {
                const и = у.id && у.id.name;
                if (и) (объявления[и] = объявления[и] || []).push(у);
                область(у.body, и);
                /* В тело не идём как в блок: это своя область. */
                return;
            }
            if (у.type === 'FunctionExpression' || у.type === 'ArrowFunctionExpression') {
                область(у.body, имяОбласти + '→аноним');
                return;
            }
            for (const к in у) if (к !== 'loc' && к !== 'start' && к !== 'end') блок(у[к]);
        })(узел.body || узел);

        for (const и in объявления) {
            const с = объявления[и];
            if (с.length < 2) continue;
            const тела = {};
            с.forEach(у => { тела[текст.slice(у.body.start, у.body.end).replace(/\s+/g, ' ')] = 1; });
            всего++;
            console.log('  x ' + path.relative(КОРЕНЬ, п) + ' · `' + и + '` объявлена ' +
                с.length + ' раза в одной области (' + имяОбласти + '), разных тел ' +
                Object.keys(тела).length);
            с.forEach(у => console.log('        строка ' + у.loc.start.line +
                ', тело ' + (текст.slice(у.body.start, у.body.end).split('\n').length) + ' стр'));
        }
    })(дерево, 'файл');
}
console.log('');
console.log('ИТОГ: имён, объявленных дважды в одной области: ' + всего);

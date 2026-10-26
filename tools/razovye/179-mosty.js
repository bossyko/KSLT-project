/**
 * ЗАМЕР 26.10: ТОКЕНЫ-МОСТЫ (`--X: var(--Y)`) — СКОЛЬКО ИХ И СКОЛЬКО МЁРТВЫХ.
 *
 * Запись 72д трекера называла ДВА примера (`--font-primary`, `--ad-accent`).
 * Прибор считает ВСЕ: мост — это второе имя на одно понятие, и беда родится
 * ровно на шве, когда два имени разъедутся.
 *
 *   node tools/razovye/179-mosty.js
 */
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..', '..');
const токены = fs.readFileSync(path.join(КОРЕНЬ, 'css/tokens.css'), 'utf8');

const мосты = [];
const признак = /^[ \t]*(--[a-z0-9-]+):[ \t]*var\((--[a-z0-9-]+)\)[ \t]*;/gm;
let м;
while ((м = признак.exec(токены)) !== null) мосты.push([м[1], м[2]]);

function собрать(корень, кроме) {
    const итог = [];
    (function идти(д) {
        let сп = [];
        try { сп = fs.readdirSync(д, { withFileTypes: true }); } catch (e) { return; }
        сп.forEach(э => {
            const ф = path.join(д, э.name);
            if (кроме.some(к => ф.indexOf(к) !== -1)) return;
            if (э.isDirectory()) идти(ф);
            else if (/\.(css|js|html)$/.test(э.name)) итог.push(ф);
        });
    })(корень);
    return итог;
}
/* МОБИЛЬНОЕ СЧИТАЕТСЯ ТОЖЕ: его tokens.css теперь тот же файл (кусок 177),
   и мост, мёртвый на сайте, может быть живым в приложении. */
const файлы = собрать(КОРЕНЬ, ['node_modules', '.git', 'test-results', 'tools', 'tests']);
const весь = файлы.map(ф => { try { return fs.readFileSync(ф, 'utf8'); } catch (e) { return ''; } }).join('\n');

const мёртвые = [], живые = [];
мосты.forEach(([имя, куда]) => {
    /* ПРИЗНАК ЗОВА БЫЛ СЛЕПЫМ ДВАЖДЫ, И ЭТО ПОЙМАЛИ ЧУЖИЕ СТОРОЖА:
       `var(--имя, запасное)` — зов с запасным значением, закрывающей
       скобки сразу нет; и `getPropertyValue('--имя')` — чтение из js, где
       имя идёт строкой, а не через `var(`. ПРИЗНАК, НЕ ВИДЯЩИЙ ЗАПАСНОГО
       ЗНАЧЕНИЯ, НАЗОВЁТ ЖИВОЕ МЁРТВЫМ. */
    const зовов = (весь.split('var(' + имя).length - 1)
                + (весь.split("'" + имя + "'").length - 1)
                + (весь.split('"' + имя + '"').length - 1);
    (зовов === 0 ? мёртвые : живые).push({ имя, куда, зовов });
});

console.log('');
console.log('  ТОКЕНЫ-МОСТЫ (второе имя на одно понятие): ' + мосты.length);
console.log('    мёртвых, ни одного зова: ' + мёртвые.length);
console.log('    живых: ' + живые.length);
console.log('');
console.log('  МЁРТВЫЕ — снимаются без последствий:');
мёртвые.forEach(м => console.log('    ' + м.имя.padEnd(26) + ' -> ' + м.куда));
console.log('');
console.log('  ЖИВЫЕ — каждый зов надо перевести на настоящее имя:');
живые.sort((a, b) => a.зовов - b.зовов)
     .forEach(м => console.log('    ' + String(м.зовов).padStart(4) + ' зовов  ' +
         м.имя.padEnd(26) + ' -> ' + м.куда));
console.log('');

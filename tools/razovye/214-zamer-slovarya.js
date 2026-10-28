/* Прибор: русский текст в коде приложения — БЕЗ комментариев, и отдельно
   тот, что доходит до человека. */
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..', 'mobile', 'www');

const СЛОВАРИ = ['i18n.js', 'site-content.js', 'match-score-texts.js',
                 'country-utils.js', 'kslt-rules.js', 'news-covers.js'];

function файлы(дир, список) {
    список = список || [];
    for (const э of fs.readdirSync(дир, { withFileTypes: true })) {
        const п = path.join(дир, э.name);
        if (э.isDirectory()) { файлы(п, список); continue; }
        if (!э.name.endsWith('.js')) continue;
        if (СЛОВАРИ.includes(э.name)) continue;
        список.push(п);
    }
    return список;
}

function безКомментариев(т) {
    return т.replace(/\/\*[\s\S]*?\*\//g, с => ' '.repeat(с.length))
            .replace(/(^|[^:])\/\/[^\n]*/g, (с, п) => п + ' '.repeat(с.length - п.length));
}

const итог = {};
let всего = 0, вРазметке = 0;
файлы(path.join(КОРЕНЬ, 'js')).forEach(п => {
    const т = безКомментариев(fs.readFileSync(п, 'utf8'));
    const строки = т.match(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g) || [];
    const свои = строки.filter(с => /[А-Яа-яЁё]/.test(с));
    if (!свои.length) return;
    const отн = path.relative(КОРЕНЬ, п);
    итог[отн] = свои;
    всего += свои.length;
    /* доходит до человека: строка склеивается в html или ставится текстом */
    свои.forEach(с => {
        const и = т.indexOf(с);
        const вокруг = т.slice(Math.max(0, и - 160), и + с.length + 60);
        if (/innerHTML|textContent|html \+=|\+ '<|'><|placeholder|title=|alert\(|toast\(/.test(вокруг)) вРазметке++;
    });
});

console.log('файлов с русским в коде: ' + Object.keys(итог).length);
console.log('строк всего: ' + всего + ', из них доходят до человека: ' + вРазметке);
console.log('\nпо файлам:');
Object.entries(итог).sort((a, b) => b[1].length - a[1].length).slice(0, 16)
    .forEach(([ф, с]) => console.log('  ' + String(с.length).padStart(3) + '  ' + ф));
console.log('\nпримеры:');
Object.entries(итог).sort((a, b) => b[1].length - a[1].length).slice(0, 4).forEach(([ф, с]) => {
    console.log('  ' + ф + ':');
    с.slice(0, 5).forEach(x => console.log('     ' + x.slice(0, 80)));
});

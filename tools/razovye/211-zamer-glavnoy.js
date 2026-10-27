/* Разовый прибор: числа главной экрана приложения мимо шкалы.
   Считает ПО ОБЪЯВЛЕНИЮ, а не по строке. */
const fs = require('fs');
const path = require('path');
const файл = path.join(__dirname, '..', '..', 'mobile', 'www', 'css', 'app.css');
const текст = fs.readFileSync(файл, 'utf8');

const КЕГЕЛЬ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const КНОПКА = [28, 36, 44, 52];
const РАЗДЕЛ = /\.(hh-|hb-|tcv-|news-|section-title|see-all|home-)/;

const блоки = [];
const рег = /(^|\n)([^\n{}]*\{)([^}]*)\}/g;
let м;
while ((м = рег.exec(текст)) !== null) {
    const сел = м[2].replace('{', '').trim();
    if (!РАЗДЕЛ.test(сел)) continue;
    if (/@media|@keyframes|@supports/.test(сел)) continue;
    блоки.push({ сел, тело: м[3].replace(/\/\*[\s\S]*?\*\//g, '') });
}

const кегли = [], отступы = [], размеры = [], дроби = [];
блоки.forEach(б => {
    (б.тело.match(/font-size:\s*([^;]+);/g) || []).forEach(з => {
        if (/var\(--fs-/.test(з)) return;
        (з.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat).forEach(v => {
            if (v % 1 !== 0) дроби.push(б.сел + ' → ' + v);
            if (!КЕГЕЛЬ.includes(v)) кегли.push(б.сел + ' → ' + v);
        });
    });
    (б.тело.match(/(?:^|\n)\s*(?:margin|padding|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left))?:\s*([^;]+);/g) || [])
        .forEach(з => {
            if (/var\(--space-/.test(з) || /calc\(/.test(з)) return;
            (з.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat).forEach(v => {
                if (v !== 0 && v % 8 !== 0 && ![12, 24, 40].includes(v)) отступы.push(б.сел + ' → ' + v);
            });
        });
    (б.тело.match(/(?:^|\n)\s*(?:width|height|min-height|min-width|max-width):\s*([^;]+);/g) || [])
        .forEach(з => {
            if (/var\(--|%|calc\(|auto|none|100/.test(з)) return;
            (з.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat).forEach(v => {
                if (!КНОПКА.includes(v) && !КЕГЕЛЬ.includes(v) && v % 8 !== 0) размеры.push(б.сел + ' → ' + v);
            });
        });
});

function свод(имя, сп) {
    const зн = {};
    сп.forEach(с => { const v = с.split(' → ')[1]; зн[v] = (зн[v] || 0) + 1; });
    console.log('\n' + имя + ': ' + сп.length + ' мест');
    console.log('  значения: ' + Object.entries(зн).sort((a, b) => b[1] - a[1])
        .map(([v, n]) => v + '×' + n).join(' · '));
    console.log('  ' + sp(сп));
}
function sp(сп) { return сп.slice(0, 14).join('; '); }

console.log('блоков главной в app.css: ' + блоки.length);
свод('КЕГЛИ мимо шкалы', кегли);
свод('из них ДРОБНЫЕ', дроби);
свод('ОТСТУПЫ мимо сетки', отступы);
свод('РАЗМЕРЫ мимо сетки', размеры);

/* медиа-границы, где упоминается главная */
const строки = текст.split('\n');
let г = '', вм = false, гл = 0, найдено = {};
строки.forEach(с => {
    const мм = с.match(/@media \((?:min|max)-width:\s*(\d+)px\)/);
    if (мм) { вм = true; г = мм[1]; гл = 0; }
    if (вм) {
        for (const ч of с) { if (ч === '{') гл++; if (ч === '}') гл--; }
        if (РАЗДЕЛ.test(с)) найдено[г] = (найдено[г] || 0) + 1;
        if (гл === 0) вм = false;
    }
});
console.log('\nГРАНИЦЫ ШИРИНЫ, задевающие главную: ' +
    (Object.keys(найдено).length ? Object.entries(найдено).map(([г, n]) => г + 'px → ' + n + ' правил').join(' · ') : 'ни одной'));

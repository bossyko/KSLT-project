/* Прибор: ВЕСЬ mobile/www/css/app.css против шкал. По объявлению. */
const fs = require('fs');
const path = require('path');
const файл = path.join(__dirname, '..', '..', 'mobile', 'www', 'css', 'app.css');
const текст = fs.readFileSync(файл, 'utf8');

const КЕГЕЛЬ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const КНОПКА = [28, 36, 44, 52];

const блоки = [];
const рег = /(^|\n)([^\n{}]*)\{([^}]*)\}/g;
let м;
while ((м = рег.exec(текст)) !== null) {
    const сел = м[2].trim();
    if (!сел || /@/.test(сел)) continue;
    блоки.push({ сел, тело: м[3].replace(/\/\*[\s\S]*?\*\//g, '') });
}

const кегли = [], дроби = [], отступы = [], размеры = [];
блоки.forEach(б => {
    (б.тело.match(/font-size:\s*([^;]+);/g) || []).forEach(з => {
        if (/var\(--fs-|rem|em\b|%/.test(з)) return;
        (з.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat).forEach(v => {
            if (v % 1 !== 0) дроби.push(б.сел + ' → ' + v);
            if (!КЕГЕЛЬ.includes(v)) кегли.push(б.сел + ' → ' + v);
        });
    });
    (б.тело.match(/(?:^|\n)\s*(?:margin|padding|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left))?:\s*([^;]+);/g) || [])
        .forEach(з => {
            if (/var\(--space-|calc\(|%|auto/.test(з)) return;
            (з.match(/(-?\d+(?:\.\d+)?)px/g) || []).map(x => Math.abs(parseFloat(x))).forEach(v => {
                if (v !== 0 && v !== 2 && v % 8 !== 0 && ![12, 24, 40].includes(v)) отступы.push(б.сел + ' → ' + v);
            });
        });
    (б.тело.match(/(?:^|\n)\s*(?:width|height|min-height|min-width|max-width|max-height):\s*([^;]+);/g) || [])
        .forEach(з => {
            if (/var\(--|%|calc\(|auto|none|vw|vh|rem/.test(з)) return;
            (з.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat).forEach(v => {
                if (v % 8 !== 0 && !КНОПКА.includes(v) && !КЕГЕЛЬ.includes(v)) размеры.push(б.сел + ' → ' + v);
            });
        });
});

function свод(имя, сп, сколько) {
    const зн = {};
    сп.forEach(с => { const v = с.split(' → ')[1]; зн[v] = (зн[v] || 0) + 1; });
    console.log('\n' + имя + ': ' + сп.length + ' мест, ' + Object.keys(зн).length + ' значений');
    console.log('  ' + Object.entries(зн).sort((a, b) => b[1] - a[1]).map(([v, n]) => v + '×' + n).join(' · '));
    if (сколько) console.log('  ' + сп.slice(0, сколько).join('; '));
}

console.log('блоков в файле: ' + блоки.length);
свод('КЕГЛИ мимо шкалы', кегли);
свод('из них ДРОБНЫЕ', дроби, 20);
свод('ОТСТУПЫ мимо сетки', отступы);
свод('РАЗМЕРЫ мимо сетки', размеры);

const гр = {};
текст.split('\n').forEach(с => {
    const м2 = с.match(/@media \((?:min|max)-(width|height):\s*(\d+)px\)/);
    if (м2) гр[м2[1] + ' ' + м2[2]] = (гр[м2[1] + ' ' + м2[2]] || 0) + 1;
});
console.log('\nМЕДИА-ЗАПРОСЫ: ' + Object.entries(гр).map(([k, n]) => k + '×' + n).join(' · '));

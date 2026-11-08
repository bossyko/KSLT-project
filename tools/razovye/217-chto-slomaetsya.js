#!/usr/bin/env node
/**
 * ЧТО СЛОМАЕТСЯ В СВЕТЛОЙ ТЕМЕ — СЧЁТОМ, А НЕ ГЛАЗОМ (08.11, вторая
 * редакция).
 *
 * ЗАЧЕМ. Сводить на роли все 98 сырых цветов — работа ради работы.
 * Светлая тема обязана переопределить только те, что на светлом фоне
 * СЛОМАЮТСЯ. Разница измеряется, а не угадывается.
 *
 * ПОЧЕМУ ПЕРВАЯ РЕДАКЦИЯ ВРАЛА. Она требовала 3:1 от КАЖДОГО
 * нетекстового цвета — и насчитала 46 бед, записав туда полупрозрачную
 * заливку бейджа. WCAG 1.4.11 требует 3:1 от того, что НЕСЁТ СМЫСЛ:
 * граница поля ввода, иконка-орган, разделитель. Заливка под текстом
 * смысла не несёт — его несёт ТЕКСТ, и считать надо контраст текста к
 * получившейся заливке.
 * ПРИБОР, КОТОРЫЙ КРИЧИТ ВОЛКАМИ, ВЫКЛЮЧАЮТ ЦЕЛИКОМ.
 *
 * Вторая поправка: свойство читается для КАЖДОГО цвета по его месту в
 * строке, а не одно на строку. В `background: X; color: Y` первая
 * редакция приписывала оба цвета свойству `color`.
 *
 * ПОРОГИ ВЗЯТЫ У APPLE: «Sufficient Contrast» в критериях доступности
 * App Store — 4.5:1 текст, 3:1 нетекстовые элементы, проверять в
 * светлом И тёмном режиме.
 *
 * Запуск: node tools/razovye/217-chto-slomaetsya.js <корень> [#фон]
 */
const fs = require('fs');
const path = require('path');
const корень = process.argv[2] || path.join(__dirname, '..', '..');
const ФОН = process.argv[3] || '#FFFFFF';

const текст = fs.readFileSync(path.join(корень, 'mobile/www/css/app.css'), 'utf8');
const код = текст.replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[^\n]/g, ' '));
const строки = код.split('\n');

function разобрать(ц) {
    let м = ц.match(/^#([0-9a-fA-F]{3,8})$/);
    if (м) {
        let s = м[1];
        if (s.length === 3) s = s.split('').map(x => x + x).join('');
        return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16),
                 b: parseInt(s.slice(4, 6), 16),
                 a: s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1 };
    }
    м = ц.match(/rgba?\(([^)]+)\)/i);
    if (м) {
        const ч = м[1].split(',').map(x => parseFloat(x.trim()));
        if (ч.some(isNaN)) return null;
        return { r: ч[0], g: ч[1], b: ч[2], a: ч.length > 3 ? ч[3] : 1 };
    }
    return null;
}

/* АЛЬФА-КОМПОЗИЦИЯ: глаз видит результат наложения, а не исходник. */
const наложить = (ц, ф) => ({
    r: ц.r * ц.a + ф.r * (1 - ц.a),
    g: ц.g * ц.a + ф.g * (1 - ц.a),
    b: ц.b * ц.a + ф.b * (1 - ц.a), a: 1 });

const лин = в => { const s = Math.max(0, Math.min(255, в)) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const яркость = ц => 0.2126 * лин(ц.r) + 0.7152 * лин(ц.g) + 0.0722 * лин(ц.b);
const контраст = (а, б) => {
    const я1 = яркость(а), я2 = яркость(б);
    return (Math.max(я1, я2) + 0.05) / (Math.min(я1, я2) + 0.05); };

const фон = разобрать(ФОН);
const ЦВЕТ = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

/* СВОЙСТВО ЧИТАЕТСЯ ПО МЕСТУ ЦВЕТА В СТРОКЕ: ближайшее `имя:` слева. */
function свойствоДля(строка, позиция) {
    const до = строка.slice(0, позиция);
    const все = [...до.matchAll(/([-a-z]+)\s*:/g)];
    return все.length ? все[все.length - 1][1] : '';
}

function сел(и) {
    for (let j = и; j >= 0 && и - j < 40; j--) {
        const м = строки[j].match(/^([^{}]*?)\s*{/);
        if (м && м[1].trim() && !/^@/.test(м[1].trim())) return м[1].trim().slice(0, 40);
    }
    return '(?)';
}

/* НЕСЁТ СМЫСЛ или украшает. Граница поля, обводка фокуса, разделитель,
   полоса-указатель — несут. Заливка под текстом, свечение, тень,
   градиент и фильтр — украшают: за них отвечает текст сверху. */
const НЕСЁТ = /^(border|border-color|border-top|border-bottom|border-left|border-right|outline|outline-color|stroke)$/;
const УКРАШАЕТ = /^(box-shadow|text-shadow|filter|backdrop-filter|letter-spacing|opacity|background-image)$/;

const буквы = [], смысл = [], украшение = [], целые = [], бренды = [];
const БРЕНД = /telegram|apple|google|whatsapp|instagram|\bwa\b|\big\b|\btg\b/i;

строки.forEach((с, и) => {
    const s = сел(и);
    /* Сплэш и слой поверх фотографии темы не знают нарочно. */
    if (/\.splash|\.hh[\s.{,-]|--on-image/.test(s)) return;
    let м;
    ЦВЕТ.lastIndex = 0;
    while ((м = ЦВЕТ.exec(с)) !== null) {
        const ц = м[0];
        const р = разобрать(ц);
        if (!р) continue;
        const св = свойствоДля(с, м.index);
        const виден = наложить(р, фон);
        const к = контраст(виден, фон);
        const з = { строка: и + 1, цвет: ц, сел: s, св: св, к: к.toFixed(2) };
        if (БРЕНД.test(s)) { бренды.push(з); continue; }
        if (св === 'color') { if (к < 4.5) буквы.push(з); else целые.push(з); continue; }
        if (НЕСЁТ.test(св)) { if (к < 3) смысл.push(з); else целые.push(з); continue; }
        if (УКРАШАЕТ.test(св)) { украшение.push(з); continue; }
        /* фон: беда только если он ИСЧЕЗАЕТ совсем (разница ниже 1.05) —
           бледная заливка бейджа законна, невидимая нет. */
        if (к < 1.05) смысл.push(з); else украшение.push(з);
    }
});

console.log('\nЧТО СЛОМАЕТСЯ НА ФОНЕ ' + ФОН + ' — СЧЁТОМ\n');
console.log('  БУКВЫ ниже 4.5 — ' + буквы.length + ' (обязаны быть переопределены)');
console.log('  ЧТО НЕСЁТ СМЫСЛ ниже 3, и фон, исчезающий совсем — ' + смысл.length);
console.log('  украшение (тень, свечение, бледная заливка) — ' + украшение.length + ' (не беда)');
console.log('  бренд чужой — ' + бренды.length + ' (темы не знает)');
console.log('  выдерживает как есть — ' + целые.length + '\n');

console.log('── БУКВЫ, КОТОРЫЕ ПРОПАДУТ');
буквы.forEach(б => console.log('   ' + String(б.строка).padStart(5) + '  к=' +
    String(б.к).padStart(5) + '  ' + б.цвет.padEnd(24) + '  ' + б.сел));

console.log('\n── СМЫСЛ, КОТОРЫЙ ПРОПАДЁТ');
смысл.forEach(б => console.log('   ' + String(б.строка).padStart(5) + '  к=' +
    String(б.к).padStart(5) + '  ' + б.св.padEnd(13) + '  ' + б.цвет.padEnd(24) + '  ' + б.сел));

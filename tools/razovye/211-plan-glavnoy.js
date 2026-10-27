/* План перевода главной на шкалу: печатает КАЖДУЮ правку до того, как её
   сделать. Варианты меряются ДО правки файла, одним прогоном. */
const fs = require('fs');
const path = require('path');
const файл = path.join(__dirname, '..', '..', 'mobile', 'www', 'css', 'app.css');
const текст = fs.readFileSync(файл, 'utf8');
const РАЗДЕЛ = /\.(hh-|hb-|tcv-|news-|section-title|see-all|home-)/;

const КЕГЛЬ = { 8: 11, 9: 11, 10: 11, 10.5: 11, 11.5: 11, 12.5: 12,
                13: 14, 13.5: 14, 14.5: 14, 15: 16, 17: 18, 36: 32, 42: 40, 48: 40 };

const блоки = [];
const рег = /(^|\n)([^\n{}]*)\{([^}]*)\}/g;
let м;
while ((м = рег.exec(текст)) !== null) {
    const сел = м[2].trim();
    if (!РАЗДЕЛ.test(сел) || /@/.test(сел)) continue;
    блоки.push({ сел, тело: м[3] });
}

console.log('=== КЕГЛИ ===');
блоки.forEach(б => {
    (б.тело.match(/font-size:\s*([^;]+);/g) || []).forEach(з => {
        const п = з.match(/(\d+(?:\.\d+)?)px/);
        if (!п) return;
        const v = parseFloat(п[1]);
        if (КЕГЛЬ[v]) console.log('  ' + б.сел + ': ' + v + ' → ' + КЕГЛЬ[v]);
    });
});

console.log('\n=== ОТСТУПЫ (каждое объявление целиком) ===');
блоки.forEach(б => {
    (б.тело.match(/(?:^|\n)\s*((?:margin|padding|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left))?:\s*[^;]+);/g) || [])
        .forEach(з => {
            const чистое = з.trim();
            if (/var\(--space-/.test(чистое) || /calc\(/.test(чистое)) return;
            const плохие = (чистое.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat)
                .filter(v => v !== 0 && v % 8 !== 0 && ![12, 24, 40].includes(v));
            if (плохие.length) console.log('  ' + б.сел + ':  ' + чистое + '   ← ' + плохие.join(','));
        });
});

console.log('\n=== РАЗМЕРЫ ===');
блоки.forEach(б => {
    (б.тело.match(/(?:^|\n)\s*((?:width|height|min-height|min-width|max-width):\s*[^;]+);/g) || [])
        .forEach(з => {
            const чистое = з.trim();
            if (/var\(--|%|calc\(|auto|none|100/.test(чистое)) return;
            const плохие = (чистое.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat)
                .filter(v => v % 8 !== 0 && ![11,12,14,16,18,21,26,44,52].includes(v));
            if (плохие.length) console.log('  ' + б.сел + ':  ' + чистое + '   ← ' + плохие.join(','));
        });
});

#!/usr/bin/env node
/**
 * РАЗВЕДКА ЦВЕТА В ПРИЛОЖЕНИИ (08.11). Одноразовая.
 *
 * Считает сырые цвета в css приложения и раскладывает по кучам: что
 * мешает теме, а что от темы не зависит и зашито правильно.
 */
const fs = require('fs');
const path = require('path');
const корень = process.argv[2] || '.';
const файл = path.join(корень, 'mobile/www/css/app.css');
const текст = fs.readFileSync(файл, 'utf8');

/* Примечания выбрасываем: цвет в пояснении — не цвет на экране. */
const код = текст.replace(/\/\*[\s\S]*?\*\//g, '');

const ЦВЕТ = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

const строки = код.split('\n');
const находки = [];
строки.forEach((с, i) => {
    const м = с.match(ЦВЕТ);
    if (!м) return;
    м.forEach(ц => находки.push({ строка: i + 1, цвет: ц, текст: с.trim() }));
});

/* ── КУЧИ ──────────────────────────────────────────────────────────
   НА КАРТИНКЕ — цвет лежит поверх фотографии и от темы не зависит
   (правило заведено вчера: `--on-image-*`).
   ВУАЛЬ — полупрозрачное белое или чёрное: при смене темы обязано
   меняться, иначе светлая тема получит белую вуаль на белом.
   ТЕНЬ — тень в box-shadow: тоже зависит от темы, но отдельно.
   ЦВЕТ СМЫСЛА — лайм, красный, жёлтый: одинаков в обеих темах.
   ПРОЧЕЕ — то, ради чего кусок и затеян. */
function куча(н) {
    const с = н.текст;
    if (/--on-image|\.hh\b|\.hh-/.test(с)) return 'на картинке';
    if (/box-shadow|text-shadow|drop-shadow/.test(с)) return 'тень';
    if (/^(background|border|outline)?-?image|gradient/.test(с) && /rgba\(0,\s*0,\s*0/.test(с)) return 'затемнение фото';
    if (/rgba\((255,\s*255,\s*255|0,\s*0,\s*0)/.test(н.цвет)) return 'вуаль';
    if (/#(ccff00|CCFF00|c3f53c|b8e600)/i.test(н.цвет)) return 'лайм';
    if (/#(ff|f)[0-9a-f]{0,5}\b/i.test(н.цвет) && /danger|error|warning|success|live/.test(с)) return 'цвет смысла';
    return 'прочее';
}

const кучи = {};
находки.forEach(н => {
    const к = куча(н);
    (кучи[к] = кучи[к] || []).push(н);
});

console.log('\nСЫРЫЕ ЦВЕТА В app.css ПРИЛОЖЕНИЯ\n');
console.log('  всего: ' + находки.length + ' в ' + строки.length + ' строках\n');
Object.keys(кучи).sort((a, b) => кучи[b].length - кучи[a].length).forEach(к => {
    console.log('  ' + String(кучи[к].length).padStart(4) + '  ' + к);
});

console.log('\n── ПРОЧЕЕ (то, ради чего кусок): первые 20');
(кучи['прочее'] || []).slice(0, 20).forEach(н => {
    console.log('  ' + String(н.строка).padStart(5) + ': ' + н.цвет + '   ' + н.текст.slice(0, 68));
});

console.log('\n── ВУАЛИ: первые 10');
(кучи['вуаль'] || []).slice(0, 10).forEach(н => {
    console.log('  ' + String(н.строка).padStart(5) + ': ' + н.цвет + '   ' + н.текст.slice(0, 68));
});

/* Сколько правил вообще знают о теме */
const темных = (текст.match(/\[data-theme="dark"\]/g) || []).length;
const светлых = (текст.match(/\[data-theme="light"\]/g) || []).length;
console.log('\n  правил под тёмную тему: ' + темных + ', под светлую: ' + светлых);

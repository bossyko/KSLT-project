/* Перевод ВСЕГО mobile/www/css/app.css на шкалы.
   Печатает каждую замену; с --делать пишет файл. */
const fs = require('fs');
const path = require('path');
const файл = path.join(__dirname, '..', '..', 'mobile', 'www', 'css', 'app.css');
let текст = fs.readFileSync(файл, 'utf8');
const делать = process.argv.includes('--делать');

const КЕГЕЛЬ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ОТСТУП = [2, 8, 12, 16, 24, 32, 40];
const КНОПКА = [28, 36, 44, 52];

/* ПРИ РАВНОМ РАССТОЯНИИ ОКРУГЛЯЕМ ВВЕРХ. 13 стоит ровно между 12 и 14,
   14 — между 12 и 16, 10 — между 8 и 12. Вниз значит мельче текст и
   теснее воздух; так уже сделано в кусках 208 и 211, и разнобой между
   разделами был бы хуже любого из двух выборов. */
function ближний(v, шкала) {
    return шкала.reduce((a, b) =>
        Math.abs(b - v) < Math.abs(a - v) ||
        (Math.abs(b - v) === Math.abs(a - v) && b > a) ? b : a);
}
function кегльК(v) { return v > 40 ? 40 : ближний(v, КЕГЕЛЬ); }
function отступК(v) {
    /* 2 — оптическая правка: её СОХРАНЯЕМ там, где она уже стоит, и
       никогда не округляем К ней. Поднять её до 8 значило бы раздуть
       тридцать шесть мест, где двойка стоит осознанно (отрыв подписи от
       числа, зазор в бейдже); округлять к ней — схлопнуть вдвое сорок
       четыре отступа по четыре пикселя. */
    if (v === 2) return 2;
    if (v <= 40) return ближний(v, [8, 12, 16, 24, 32, 40]);
    return Math.round(v / 8) * 8;
}
function размерК(v) {
    if (КНОПКА.includes(v) || КЕГЕЛЬ.includes(v) || v % 8 === 0) return v;
    if (v < 8) return 8;
    return Math.round(v / 8) * 8;
}

const счёт = { кегли: 0, отступы: 0, размеры: 0 };
const журнал = [];

/* Идём по блокам, но правим ИСХОДНЫЙ текст по смещениям — с конца,
   чтобы смещения не поехали. */
const правки = [];
const рег = /(^|\n)([^\n{}]*)\{([^}]*)\}/g;
let м;
while ((м = рег.exec(текст)) !== null) {
    const сел = м[2].trim();
    if (!сел || /@/.test(сел)) continue;
    const начало = м.index + м[0].indexOf('{') + 1;
    const тело = м[3];
    const безКом = тело.replace(/\/\*[\s\S]*?\*\//g, с => ' '.repeat(с.length));

    const объяв = /([-a-z]+)\s*:\s*([^;]+);/g;
    let о;
    while ((о = объяв.exec(безКом)) !== null) {
        const свойство = о[1];
        const значение = о[2];
        if (/var\(--|calc\(|rem|vw|vh|%/.test(значение)) continue;
        let вид = null;
        if (свойство === 'font-size') вид = 'кегли';
        else if (/^(margin|padding|gap|row-gap|column-gap)(-(top|right|bottom|left))?$/.test(свойство)) вид = 'отступы';
        else if (/^(width|height|min-width|min-height|max-width|max-height)$/.test(свойство)) вид = 'размеры';
        if (!вид) continue;

        const новое = значение.replace(/(-?)(\d+(?:\.\d+)?)px/g, (всё, знак, ч) => {
            const v = parseFloat(ч);
            let n = v;
            if (вид === 'кегли') n = кегльК(v);
            else if (вид === 'отступы') n = (v === 0 ? 0 : отступК(v));
            else n = размерК(v);
            if (n !== v) {
                счёт[вид]++;
                журнал.push(сел + '  ' + свойство + ': ' + v + ' → ' + n);
            }
            return знак + n + 'px';
        });
        if (новое !== значение) {
            правки.push({ от: начало + о.index + о[0].indexOf(значение), до: начало + о.index + о[0].indexOf(значение) + значение.length, новое });
        }
    }
}

правки.sort((a, b) => b.от - a.от).forEach(п => {
    текст = текст.slice(0, п.от) + п.новое + текст.slice(п.до);
});

console.log('замен: кегли ' + счёт.кегли + ', отступы ' + счёт.отступы + ', размеры ' + счёт.размеры);
const по = {};
журнал.forEach(с => { const k = с.split('  ')[1]; по[k] = (по[k] || 0) + 1; });
console.log('\nсамые частые:');
Object.entries(по).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, n]) => console.log('  ' + k + '  ×' + n));

if (делать) { fs.writeFileSync(файл, текст); console.log('\nФАЙЛ ЗАПИСАН'); }
else console.log('\n(прогон вхолостую — для записи добавьте --делать)');

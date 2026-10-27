/* Разовый прибор: что в mobile/www/css/app.css стоит мимо шкалы.
   Числа берутся ИЗ ОБЪЯВЛЕНИЯ, а не из строки: в одной строке объявлений
   бывает несколько, и свойство соседа врёт за это. */
const fs = require('fs');
const path = require('path');
const файл = path.join(__dirname, '..', '..', 'mobile', 'www', 'css', 'app.css');
const текст = fs.readFileSync(файл, 'utf8');

const ШКАЛА_ОТСТУП = [0, 8, 12, 16, 24, 32, 40];
const ШКАЛА_КЕГЕЛЬ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ШКАЛА_КНОПКА = [28, 36, 44, 52];

const ОТСТУП = /^(margin|padding|gap|row-gap|column-gap|inset)(-(top|right|bottom|left|block|inline))?$/;
const РАЗМЕР = /^(width|height|min-width|min-height|max-width|max-height)$/;

/* строка каждого места — считаем по смещению в тексте */
function номерСтроки(поз) { return текст.slice(0, поз).split('\n').length; }

const объявления = [];
/* грубый разбор: внутри блоков { … } объявления разделены ; */
const рег = /([-a-zA-Z]+)\s*:\s*([^;{}]+)[;}]/g;
let м;
while ((м = рег.exec(текст)) !== null) {
    объявления.push({ свойство: м[1].toLowerCase(), значение: м[2], поз: м.index });
}

const итог = { кегли: [], отступы: [], размеры: [], краска: [] };

объявления.forEach(о => {
    if (/var\(--/.test(о.значение)) return;      /* уже на токене */
    const пикс = (о.значение.match(/(-?\d+(?:\.\d+)?)px/g) || [])
        .map(x => Math.abs(parseFloat(x)));
    const н = номерСтроки(о.поз);
    if (о.свойство === 'font-size') {
        пикс.forEach(v => { if (!ШКАЛА_КЕГЕЛЬ.includes(v)) итог.кегли.push([н, v]); });
    } else if (ОТСТУП.test(о.свойство)) {
        пикс.forEach(v => { if (!ШКАЛА_ОТСТУП.includes(v)) итог.отступы.push([н, v]); });
    } else if (РАЗМЕР.test(о.свойство)) {
        пикс.forEach(v => {
            if (!ШКАЛА_КНОПКА.includes(v) && !ШКАЛА_ОТСТУП.includes(v)) итог.размеры.push([н, v]);
        });
    }
    const краска = о.значение.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g);
    if (краска) краска.forEach(c => итог.краска.push([н, c.replace(/\s+/g, ' ')]));
});

function свод(имя, список, сколько) {
    const по = {};
    список.forEach(([, v]) => { по[v] = (по[v] || 0) + 1; });
    const пары = Object.entries(по).sort((a, b) => b[1] - a[1]);
    console.log('\n' + имя + ': ' + список.length + ' мест, ' + пары.length + ' разных значений');
    console.log('  ' + пары.slice(0, сколько || 20).map(([v, c]) => v + ' → ' + c).join(' · '));
}

console.log('объявлений разобрано: ' + объявления.length);
свод('КЕГЛИ мимо шкалы', итог.кегли);
свод('ОТСТУПЫ мимо шкалы', итог.отступы);
свод('РАЗМЕРЫ мимо шкал', итог.размеры, 24);
свод('ГОЛАЯ КРАСКА', итог.краска, 14);

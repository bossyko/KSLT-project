/**
 * ЗАМЕР 26.10: ГДЕ ПАРА «--danger НА --danger-subtle» СТОИТ, И НА ЧЁМ.
 * Кусок 186, запись 72ж.
 *
 * Прибор НЕ решает, беда это или нет. Он печатает СПИСОК МЕСТ и для
 * каждого — имя селектора, файл и строку, чтобы подложку можно было
 * прочитать глазами: подложка живёт в РАЗМЕТКЕ, а не в блоке, и
 * вывести её признаком нельзя.
 *
 *   node tools/razovye/186-otkaz-na-vozvyshenii.js
 */
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const безКом = т => т.replace(/\/\*[\s\S]*?\*\//g, '');

/* НОМЕР СТРОКИ СЧИТАЕТСЯ ОТ МЕСТА СОВПАДЕНИЯ, А НЕ ПОИСКОМ ИМЕНИ: одно и
   то же имя встречается в файле несколько раз, и поиск показал бы первое
   вхождение вместо этого блока. Комментарии гасятся ПРОБЕЛАМИ, чтобы
   смещения в гашёном тексте совпадали с сырым знак в знак. */
const гасить = т => т.replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[^\n]/g, ' '));
const места = [];
fs.readdirSync(path.join(КОРЕНЬ, 'css')).filter(ф => ф.endsWith('.css')).forEach(ф => {
    const сырой = fs.readFileSync(path.join(КОРЕНЬ, 'css', ф), 'utf8');
    const т = гасить(сырой);
    const при = /([^\n{}]*)\{([^}]*)\}/g;
    let м;
    while ((м = при.exec(т)) !== null) {
        const сел = м[1].trim().replace(/\s+/g, ' '), тело = м[2];
        if (!сел || !/background[^;:]*:\s*var\(--danger-subtle\)/.test(тело)) continue;
        if (!/color:\s*var\(--danger\)/.test(тело)) continue;
        const строка = т.slice(0, м.index + м[0].indexOf(сел.split(',')[0].trim().slice(0, 12)))
            .split('\n').length;
        места.push({ файл: 'css/' + ф, строка, сел });
    }
});

console.log('');
console.log('  ПАРА «--danger на --danger-subtle» — ' + места.length + ' мест');
console.log('');
let прежний = '';
места.forEach(м => {
    if (м.файл !== прежний) { console.log('  ' + м.файл); прежний = м.файл; }
    console.log('     ' + String(м.строка).padStart(5) + '  ' + м.сел);
});
console.log('');
console.log('  ПОДЛОЖКА КАЖДОГО ЧИТАЕТСЯ ГЛАЗАМИ. Пороги замерены куском 185:');
console.log('     фон страницы --bg-base      5.14  AA');
console.log('     карточка     --bg-card      4.82  AA');
console.log('     модалка      --bg-elevated  4.20  ниже AA');
console.log('     окно H2H     --neutral-800  4.39  ниже AA');
console.log('     строка в окне (+белый 04)   3.95  ниже AA');
console.log('');

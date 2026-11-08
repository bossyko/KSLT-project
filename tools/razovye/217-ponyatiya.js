#!/usr/bin/env node
/**
 * СВОД СЫРЫХ ЦВЕТОВ ПО ПОНЯТИЯМ (08.11). Одноразовый, замерочный.
 *
 * ЗАЧЕМ. Разбирать 98 мест по одному — не работа, а перебор. Разбор по
 * назначению (`217-razbor-po-smyslu.js`) показал, что мест много, а
 * ПОНЯТИЙ мало: буквы поверх акцента, вуаль, подложка окна, цвет смысла,
 * бренд, заглушка картинки, поверх фото. Каждое понятие — одна роль и
 * один приём на все свои места.
 *
 * ПОЧЕМУ ЭТО НЕ ТО ЖЕ, ЧТО ПРЕЖНИЙ ПРИБОР. Тот считал по СВОЙСТВУ
 * (`color`, `background`), а свойство понятия не называет: `#0A0A0A` в
 * `color` — это буквы поверх акцента, а в `background` — фон страницы.
 * ЗНАЧЕНИЕ СОВПАЛО, А СМЫСЛ РАЗНЫЙ: понятие видно только по ОКРУЖЕНИЮ.
 *
 * Запуск: node tools/razovye/217-ponyatiya.js <корень>
 */
const fs = require('fs');
const path = require('path');
const корень = process.argv[2] || path.join(__dirname, '..', '..');
const текст = fs.readFileSync(path.join(корень, 'mobile/www/css/app.css'), 'utf8');
/* Длину примечаний сохраняем — иначе номера строк соврут. */
const код = текст.replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[^\n]/g, ' '));
const строки = код.split('\n');

const ЦВЕТ = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

/* БЛОК ЧИТАЕТСЯ ЦЕЛИКОМ: понятие «буквы поверх акцента» видно только
   если в том же блоке стоит `background: var(--accent)`. */
function блок(и) {
    let н = и, к = и, г = 0;
    for (let j = и; j >= 0 && и - j < 40; j--) {
        if (строки[j].indexOf('{') !== -1 && г === 0) { н = j; break; }
        г += (строки[j].match(/}/g) || []).length - (строки[j].match(/{/g) || []).length;
    }
    г = 0;
    for (let j = и; j < строки.length && j - и < 40; j++) {
        if (строки[j].indexOf('}') !== -1 && г === 0) { к = j; break; }
        г += (строки[j].match(/{/g) || []).length - (строки[j].match(/}/g) || []).length;
    }
    return строки.slice(н, к + 1).join('\n');
}

const БРЕНДЫ = /#(2AABEE|0088cc|25D366|E1306C|1f1f1f|000000|000|fff|ffffff)\b/i;

function понятие(цвет, строка, бл, сел) {
    const св = (строка.match(/([-a-z]+)\s*:[^:]*$/) || [])[1] || '';
    if (/\.splash|--on-image|\.hh[\s.{,-]/.test(сел)) return '7. поверх фото и сплэш — темы не знает';
    if (/telegram|apple|google|whatsapp|instagram|\.auth-social|\.gi-contact|\.pd-contact/i.test(сел + bl0(бл))) return '5. бренд чужой — краской, с пометкой';
    if (/^color$/.test(св) && /background:\s*var\(--accent\)/.test(бл)) return '1. буквы поверх акцента';
    if (/^color$/.test(св) && /^#0?[aA]?0a0a0a$/i.test(цвет.replace('#0A0A0A', '#0a0a0a'))) return '1. буквы поверх акцента (проверить фон)';
    if (/shadow/.test(строка)) return '6. тень — своя в каждой теме';
    if (/rgba\(\s*0,\s*0,\s*0|rgba\(\s*10,\s*10,\s*10/.test(цвет) && /overlay|viewer|confirm|-nav|zoom/i.test(сел)) return '3. подложка окна — тёмная в обеих темах';
    if (/rgba\(\s*255,\s*255,\s*255/.test(цвет)) return '2. вуаль поверх фона — переворачивается темой';
    if (/rgba\(\s*0,\s*0,\s*0|rgba\(\s*10,\s*10,\s*10/.test(цвет)) return '2. вуаль поверх фона — переворачивается темой';
    if (/#(1a1a2e|16213e)/i.test(цвет)) return '4. заглушка картинки — свой фон в каждой теме';
    if (/rgba\(/.test(цвет)) return '8. цвет смысла с прозрачностью — ступень шкалы';
    if (БРЕНДЫ.test(цвет)) return '5. бренд чужой — краской, с пометкой';
    return '9. разобрать по одному';
}
function bl0(б) { return б.split('\n')[0] || ''; }

function сел(и) {
    for (let j = и; j >= 0 && и - j < 40; j--) {
        const м = строки[j].match(/^([^{}]*?)\s*{/);
        if (м && м[1].trim() && !/^@/.test(м[1].trim())) return м[1].trim().slice(0, 44);
    }
    return '(?)';
}

const кучи = {};
строки.forEach((с, и) => {
    const м = с.match(ЦВЕТ);
    if (!м) return;
    const бл = блок(и), s = сел(и);
    м.forEach(ц => {
        const п = понятие(ц, с, бл, s);
        (кучи[п] = кучи[п] || []).push({ строка: и + 1, цвет: ц, сел: s });
    });
});

const всего = Object.values(кучи).reduce((с, к) => с + к.length, 0);
console.log('\nСЫРЫЕ ЦВЕТА ПО ПОНЯТИЯМ — ' + всего + ' мест, ' +
            Object.keys(кучи).length + ' понятий\n');
Object.keys(кучи).sort().forEach(к => {
    console.log('── ' + к + '  (' + кучи[к].length + ')');
    кучи[к].forEach(н => console.log('     ' + String(н.строка).padStart(5) + '  ' +
        н.цвет.padEnd(25) + '  ' + н.сел));
    console.log('');
});

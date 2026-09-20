#!/usr/bin/env node
/**
 * Сравнение снимков шапки: «до» против «после».
 *
 * ПЕРВОЕ, ЧТО ОНА ДЕЛАЕТ, — ПРОВЕРЯЕТ, ЧТО СРАВНИВАТЬ ВООБЩЕ МОЖНО.
 *
 * 21.09.2026 я сравнил тридцать шесть свежих снимков с двадцатью четырьмя
 * старыми и увидел «два проекта не изменились». Их просто не перезапускали:
 * прогон шёл на трёх проектах из пяти, а файлы двух остальных лежали с
 * прошлого раза. Дефекта не было — было смешение двух прогонов.
 *
 * Поэтому здесь: все снимки «после» обязаны нести одну метку прогона, и
 * набор страниц с проектами должен совпасть с «до». Иначе — отказ, без
 * единой цифры сравнения. Половинчатое сравнение хуже, чем никакого.
 *
 * Запуск:  node tools/compare-header.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ДО = path.join(ROOT, 'tests/reports/header-snapshot-before');
const ПОСЛЕ = path.join(ROOT, 'tests/reports/header-snapshot');

function взять(папка) {
    const m = new Map();
    for (const f of fs.readdirSync(папка).filter(f => f.endsWith('.json'))) {
        m.set(f, JSON.parse(fs.readFileSync(path.join(папка, f), 'utf8')));
    }
    return m;
}
const до = взять(ДО), после = взять(ПОСЛЕ);

// --- отказ, если сравнивать нельзя ---
const метки = new Set();
const безМетки = [];
for (const [f, v] of после.entries()) {
    if (v.прогон) метки.add(v.прогон); else безМетки.push(f);
}
const беда = [];
// Снимок без метки — это снимок, про который нельзя сказать, из какого он
// прогона. Сравнивать с ним значит гадать. Отказ, а не «наверное свежий».
if (безМетки.length) {
    беда.push(безМетки.length + ' снимков «после» без метки прогона — ' +
        'они сделаны прибором старой версии, и какого они прогона, узнать негде.');
}
if (метки.size > 1) {
    беда.push('снимки «после» из разных прогонов: ' + [...метки].join(', ') +
        '. Это значит, что часть проектов не перезапускали, и их числа — старые.');
}
for (const k of до.keys()) if (!после.has(k)) беда.push('нет снимка «после» для ' + k);
for (const k of после.keys()) if (!до.has(k)) беда.push('нет снимка «до» для ' + k);

if (беда.length) {
    console.log('\n  СРАВНИВАТЬ НЕЛЬЗЯ:\n');
    for (const b of беда) console.log('    · ' + b);
    console.log('\n  Прогони набор на ВСЕХ проектах:');
    console.log('    npx playwright test tests/e2e/design-system/20-header-offsets.spec.js\n');
    process.exit(1);
}

// --- собственно сравнение ---
const строки = [];
for (const [f, a] of [...до.entries()].sort()) {
    const b = после.get(f);
    const низА = a.снято.шапка ? a.снято.шапка.низ : null;
    const низБ = b.снято.шапка ? b.снято.шапка.низ : null;
    const мимо = (s) => {
        const низ = s.шапка ? s.шапка.низ : 0;
        let n = 0, всего = 0;
        for (const l of s.липкие) {
            if (l.ключ.indexOf('scroll-to-top') >= 0) continue;
            const t = parseFloat(l.top);
            if (!t) continue;
            всего++;
            if (Math.abs(t - низ) >= 0.5) n++;
        }
        return всего ? n + '/' + всего : '—';
    };
    строки.push([f.replace('.json', ''), низА, низБ, мимо(a.снято), мимо(b.снято)]);
}
console.log('\n  файл'.padEnd(40) + 'шапка до  шапка после   панели мимо до  после');
for (const [n, a, b, ma, mb] of строки) {
    const знак = (a !== b || ma !== mb) ? ' *' : '  ';
    console.log(знак + ' ' + n.padEnd(38) + String(a).padEnd(10) + String(b).padEnd(13) + ma.padEnd(16) + mb);
}
console.log('\n  * — изменилось. Метка прогона «после»: ' + [...метки][0] + '\n');

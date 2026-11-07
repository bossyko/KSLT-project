#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПРОБА НЕ ПРОПУСКАЕТ САМУ СЕБЯ МОЛЧА».
 *
 * Берёт КОПИЮ проб, возвращает по одному прежнему значению и требует,
 * чтобы прибор упал. Последние два отката — на МОЛЧАНИЕ: уборка после
 * пробы и развилка по языку прогона условиями наличия не являются, и
 * прибор, который зовёт их бедой, назвал бы бедой верный код.
 *
 *   node tools/check-molchashchie-proby-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-molchashchie-proby.js';

const ОТКАТЫ = [
    { имя: 'обложка снова сверяет кегли под условием наличия',
      падает: true,
      файл: 'tests/e2e/design-system/55-oblozhka-razdela.spec.js',
      было: "        expect(!!кат.цифра, 'цифра есть на категории, но не на обзорной')\n            .toBe(!!обз.цифра);",
      станет: "        if (кат.цифра && обз.цифра) expect(кат.цифра.кегль, 'цифра').toBe(обз.цифра.кегль);" },

    { имя: 'счёт на живой странице снова под молчаливым if',
      падает: true,
      файл: 'tests/e2e/design-system/42-live-stranica.spec.js',
      было: "        test.skip(!л.очки || !л.сет, 'на этом стенде нет счёта: нечего сравнивать');\n        {",
      станет: "        if (л.очки && л.сет) {" },

    { имя: 'со счётчика колец снят итоговый expect',
      падает: true,
      файл: 'tests/e2e/design-system/36-reyting.spec.js',
      было: "            expect(колец, 'ни одного кольца первого места не нашлось — проба ничего не проверила')\n                .toBeGreaterThan(0);",
      станет: "" },

    { имя: 'уборка после пробы осталась уборкой',
      падает: false,
      файл: 'tests/e2e/design-system/156-osnastka-okon.spec.js',
      было: "            p: { if (п && п.__ksltСнять) { п.__ksltСнять(); п.__ksltСнять = null; } }",
      станет: "            p: { if (п && п.__ksltСнять) { п.__ksltСнять(); п.__ksltСнять = null; } } // уборка" },

    { имя: 'развилка по языку прогона названа исключением с причиной',
      падает: false,
      файл: 'tools/check-molchashchie-proby.js',
      было: "        '`Я.чужой` — язык прогона, он задан списком языков в самом файле, '",
      станет: "        '`Я.чужой` — язык прогона задан списком языков в самом файле, '" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-molch-'));
    for (const о of ['tools', 'tests']) fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: МОЛЧАЩИЕ ПРОБЫ\n');
{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n' + вывод);
        process.exit(1);
    }
    console.log('  база    исходные пробы проходят\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия();
    const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
    catch (e) {
        console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС');
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    const упал = вывод.indexOf('НЕ ТАК') !== -1;
    if (о.падает && !упал) { console.log('  ✗ ' + о.имя + ' → прибор НЕ УПАЛ'); беда++; }
    else if (!о.падает && упал) { console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать'); беда++; }
    else console.log('  ок  ' + о.имя + (о.падает ? ' → прибор упал' : ' → прибор молчит, и это верно'));
}

console.log('');
if (беда) { console.log('  ИТОГ  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали своё правило\n'); process.exit(1); }
console.log('  ИТОГ  все ' + ОТКАТЫ.length + ' откатов сработали как задумано\n');

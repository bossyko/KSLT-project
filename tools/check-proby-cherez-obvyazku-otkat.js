#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПРОБА ИДЁТ ЧЕРЕЗ ОБВЯЗКУ» (31.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ХРАПОВИК ПРОВЕРЯЕТСЯ С ОБЕИХ СТОРОН: одна проба уходит мимо обвязки —
 * падает потолок; одна возвращается на обвязку — падает правило «потолок
 * не завышен». ПОРОГ С ЗАПАСОМ НЕ СТОРОЖИТ НИЧЕГО.
 *
 *   node tools/check-proby-cherez-obvyazku-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
/* Проба, уже идущая ЧЕРЕЗ обвязку, — её уводим мимо. */
const ЧЕРЕЗ = 'tests/e2e/design-system/33-turniry-vidy.spec.js';
/* Проба, идущая МИМО, — её возвращаем на обвязку. */
const МИМО = 'tests/e2e/design-system/34-novosti.spec.js';

const ОТКАТЫ = [
    { имя: 'увести одну пробу мимо обвязки',
      ждём: 'проб мимо обвязки не больше замеренных',
      файл: ЧЕРЕЗ,
      было: "const { test, expect } = require('../../fixtures');",
      станет: "const { test, expect } = require('@playwright/test');" },

    { имя: 'вернуть одну пробу на обвязку — потолок обязан опуститься',
      ждём: 'потолок не завышен',
      файл: МИМО,
      было: "require('@playwright/test')",
      станет: "require('../../fixtures')" },

    { имя: 'отнять у обвязки подстановку тестовой базы',
      ждём: 'обвязка объявляет то, ради чего в неё ходят',
      файл: 'tests/fixtures.js',
      было: 'window.KSLT_DB = cfg;',
      станет: 'window.KSLT_DB_OTKLYUCHENO = cfg;' },

    { имя: 'отнять у обвязки отсечку тяжёлых файлов',
      ждём: 'обвязка объявляет то, ради чего в неё ходят',
      файл: 'tests/fixtures.js',
      было: 'const type = req.resourceType();',
      станет: "const type = 'document';" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-obvyazka-'));
    for (const о of ['tests', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-proby-cherez-obvyazku.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПРОБЫ ЧЕРЕЗ ОБВЯЗКУ\n');

{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n');
        console.log(вывод);
        process.exit(1);
    }
    console.log('  база    исходный код правил проходит\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия();
    const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        беда++;
        fs.rmSync(к, { recursive: true, force: true });
        continue;
    }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (вывод.indexOf('НЕ ТАК') === -1) {
        console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    } else if (вывод.indexOf(о.ждём) === -1) {
        console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»');
        беда++;
    } else {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    }
}

console.log('');
if (беда) {
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');

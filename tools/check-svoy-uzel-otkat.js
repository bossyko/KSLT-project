#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «УЗЕЛ ИЩЕТ СВОЁ В СЕБЕ» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ, и они здесь главные. Первая редакция
 * правила назвала бедой ШЕСТНАДЦАТЬ мест, из которых настоящих было
 * четыре: она считала частью окна всякое имя, встреченное в файле.
 * ПРИБОР, КРИЧАЩИЙ ВОЛКАМИ, СНИМАЮТ ЦЕЛИКОМ — вместе с проверкой.
 *
 *   node tools/check-svoy-uzel-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-svoy-uzel.js';
const ОБОЛОЧКА = 'mobile/www/js/app.js';
const КАБИНЕТ = 'mobile/www/js/screens/profile.js';

const ОТКАТЫ = [
    { имя: 'знакомство снова ищет кнопку по всему дому',
      ждём: 'окно, собранное кодом, ищет свои части в себе',
      файл: ОБОЛОЧКА,
      было: "      overlay.querySelector('#onbNext').addEventListener('click', function() {",
      станет: "      document.getElementById('onbNext').addEventListener('click', function() {" },

    { имя: 'подокно кабинета снова ищет возврат по всему дому',
      ждём: 'окно, собранное кодом, ищет свои части в себе',
      файл: КАБИНЕТ,
      было: "    overlay.querySelector('#profSubBack')",
      станет: "    document.getElementById('profSubBack')" },

    { имя: 'у знакомства отняли защиту от второго окна',
      ждём: 'знакомство не создаётся дважды',
      файл: ОБОЛОЧКА,
      было: "    if (document.getElementById('onboardingOverlay')) return;\n",
      станет: '' },

    { имя: 'прибор перестал обрезать полосу концом функции',
      ждём: 'прибор отличает зов за частью от зова за самим окном',
      файл: ПРИБОР,
      было: '            if (конец > 0) кусок = кусок.slice(0, конец);',
      станет: '            if (конец > 1e9) кусок = кусок.slice(0, конец);' },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: окно проверяет само себя по документу',
      ждём: null,
      файл: КАБИНЕТ,
      было: "  function openSubOverlay(title, contentHtml) {",
      станет: "  function openSubOverlay(title, contentHtml) {\n" +
              "    if (document.getElementById('profSubOverlay')) { /* уже открыто */ }" },

    { имя: 'МОЛЧАНИЕ: зов за разметкой экрана, далеко от вставки',
      ждём: null,
      файл: ОБОЛОЧКА,
      было: "  // === Auth change handler ===",
      станет: "  function взятьЭкран() {\n" +
              "    return document.getElementById('screenHome');\n" +
              "  }\n\n" +
              "  // === Auth change handler ===" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-uzel-'));
    for (const о of ['mobile/www/js', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: СВОЙ УЗЕЛ\n');

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
    try {
        execFileSync('node', ['--check', п], { encoding: 'utf8' });
    } catch (e) {
        console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
        беда++;
        fs.rmSync(к, { recursive: true, force: true });
        continue;
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) {
            console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        } else {
            console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать');
            беда++;
        }
        continue;
    }
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

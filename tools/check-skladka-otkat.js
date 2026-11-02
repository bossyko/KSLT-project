#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «СКЛАДКА» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ: слова `details` и `kslt-skryta` встречаются
 * и в подписях к коду, и прибор, читающий их как код, падал бы на
 * верных файлах.
 *
 *   node tools/check-skladka-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-skladka.js';
const ДОМ = 'mobile/www/js/kslt-skladka.js';
const ИГРОК = 'mobile/www/js/screens/player-detail.js';
const ОДЕЖДА = 'mobile/www/css/app.css';

const ОТКАТЫ = [
    { имя: 'сворачивание переписали своим узлом',
      ждём: 'сворачивание осталось на `<details>`',
      файл: ДОМ,
      было: "return '<details class=\"kslt-skladka'",
      станет: "return '<div class=\"kslt-skladka'" },

    { имя: 'достижения перестали быть складкой',
      ждём: 'все три раздела игрока — складки',
      файл: ИГРОК,
      было: "        id: 'pdAchievements'",
      станет: "        id: 'pdAchievementsNet'" },

    { имя: 'пустая ветка перестала ставить счёт',
      ждём: 'у каждой складки ставится счёт',
      файл: ИГРОК,
      было: "          if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, 0);\n          return;\n        }\n        if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, r.data.length);\n        renderMatches(container, r.data);",
      станет: "          return;\n        }\n        renderMatches(container, r.data);" },

    { имя: 'у шапки отняли цель нажатия',
      ждём: 'шапка складки — цель нажатия 44',
      файл: ОДЕЖДА,
      было: "  min-height: 44px;\n  padding: 8px 0;\n  cursor: pointer;\n  list-style: none;",
      станет: "  min-height: 36px;\n  padding: 8px 0;\n  cursor: pointer;\n  list-style: none;" },

    { имя: 'складка узнала про отсечку',
      ждём: 'складка не путается с отсечкой',
      файл: ДОМ,
      было: "    var S = window.KSLT_SKLADKA = {};",
      станет: "    var S = window.KSLT_SKLADKA = {};\n    var СТРОК_СРАЗУ = 10;\n    void СТРОК_СРАЗУ;" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: отсечка названа в подписи к складке',
      ждём: null,
      файл: ДОМ,
      было: "    var S = window.KSLT_SKLADKA = {};",
      станет: "    /* не путать с kslt-skryta и СТРОК_СРАЗУ из отсечки */\n" +
              "    var S = window.KSLT_SKLADKA = {};" },

    { имя: 'МОЛЧАНИЕ: лишний зов счёта сверх нужных',
      ждём: null,
      файл: ИГРОК,
      было: "        if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, r.data.length);\n        renderMatches(container, r.data);",
      станет: "        if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, r.data.length);\n        if (window.KSLT_SKLADKA) KSLT_SKLADKA.счёт(container, r.data.length);\n        renderMatches(container, r.data);" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-skladka-'));
    for (const о of ['mobile/www/js', 'mobile/www/css', 'tools']) {
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

console.log('\n  ПРУВЕР: СКЛАДКА\n');

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
    if (о.файл.endsWith('.js')) {
        try {
            execFileSync('node', ['--check', п], { encoding: 'utf8' });
        } catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
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

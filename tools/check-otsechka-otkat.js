#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ДЛИННЫЙ СПИСОК РЕЖЕТ ОДИН ДОМ» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ, и они здесь главные. Первая редакция
 * правила ловила любой `slice(0, число)` и выдала девять мест, из
 * которых настоящих было НОЛЬ: обрезка даты, инициалы, первые три тега.
 * ПРИБОР, КРИЧАЩИЙ ВОЛКАМИ, СНИМАЮТ ЦЕЛИКОМ.
 *
 *   node tools/check-otsechka-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-otsechka.js';
const ДОМ = 'js/kslt-otsechka.js';
const ИГРОК = 'mobile/www/js/screens/player-detail.js';
const ОДЕЖДА = 'mobile/www/css/app.css';

const ОТКАТЫ = [
    { имя: 'матчи снова режут список на месте',
      ждём: 'своей отсечки в приложении нет',
      файл: ИГРОК,
      было: '    var visible = matches;',
      станет: '    var LIMIT = 10;\n    var visible = matches.slice(0, LIMIT);' },

    { имя: 'у матчей отняли кнопку дома',
      ждём: 'матчи игрока режет дом',
      файл: ИГРОК,
      было: "    html += О.кнопка(всего, I18N.lang);",
      станет: "    html += '';" },

    { имя: 'дом начал резать список',
      ждём: 'дом прячет строку, а не выбрасывает',
      файл: ДОМ,
      было: '    O.СТРОК_СРАЗУ = 10;',
      станет: '    O.СТРОК_СРАЗУ = 10;\n    O.резать = function (с) { return с.slice(0, 10); };' },

    { имя: 'из одежды пропала скрытая строка',
      ждём: 'одежда отсечки есть в приложении',
      файл: ОДЕЖДА,
      было: '.kslt-skryta { display: none !important; }',
      станет: '.kslt-skryta-net { display: none !important; }' },

    { имя: 'прибор снова ловит любой срез по числу',
      ждём: 'прибор отличает отсечку от обычного slice',
      файл: ПРИБОР,
      было: "        /\\.slice\\(\\s*0\\s*,\\s*(?:LIMIT|ПРЕДЕЛ)\\s*\\)/.test(с) ||",
      станет: "        /\\.slice\\(\\s*0\\s*,\\s*(?:LIMIT|ПРЕДЕЛ|\\d+)\\s*\\)/.test(с) ||" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: обрезка даты и инициалы',
      ждём: null,
      файл: ИГРОК,
      было: '    var visible = matches;',
      станет: "    var день = String(Date()).slice(0, 10);\n" +
              "    var буквы = String('Иван Петров').slice(0, 2);\n" +
              "    void день; void буквы;\n" +
              '    var visible = matches;' },

    { имя: 'МОЛЧАНИЕ: прежняя отсечка названа в подписи',
      ждём: null,
      файл: ИГРОК,
      было: '    var visible = matches;',
      станет: "    /* было: var LIMIT = 10; matches.slice(0, LIMIT) */\n" +
              '    var visible = matches;' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-otsechka-'));
    for (const о of ['js', 'mobile/www/js', 'mobile/www/css', 'tools']) {
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

console.log('\n  ПРУВЕР: ОТСЕЧКА ДЛИННОГО СПИСКА\n');

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

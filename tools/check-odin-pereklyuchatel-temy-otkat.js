#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ОДИН» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Оригиналы не
 * трогаются: «у меня зелёное» ничего не доказывает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Прибор обязан молчать там, где имя органа
 * поменяли, и там, где `data-theme` стоит не на кнопке: ПРИБОР, ЗНАЮЩИЙ
 * ИМЯ КЛАССА НАИЗУСТЬ, ОТСТАЁТ ОТ РАЗМЕТКИ, а прибор, считающий корень
 * документа за кнопку, кричит волками.
 *
 *   node tools/check-odin-pereklyuchatel-temy-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-odin-pereklyuchatel-temy.js';
const ДОМ = 'mobile/www/index.html';
const КАБИНЕТ = 'mobile/www/js/screens/profile.js';

/* Якорь держится на СОДЕРЖИМОМ — на кнопке, которая живёт в блоке
   постоянно, — а не на номере строки и не на соседе, который уедет. */
/* ЯКОРЬ ДЕРЖИТСЯ НА РЕЖИМЕ, А НЕ НА ПОЛНОЙ СТРОКЕ КНОПКИ: 08.11 в разметку
   добавлено `aria-pressed`, и прежний якорь уехал целиком. Режим — то, что
   живёт в кнопке постоянно. */
const КНОПКА_СИСТЕМЫ = '<button class="seg-btn active" data-theme="system"';

const ОТКАТЫ = [
    { имя: 'вернуть в кабинет второй переключатель темы',
      ждём: 'переключатель темы в приложении один',
      файл: КАБИНЕТ,
      было: '       оно в боковом окне меню». */\n',
      станет: '       оно в боковом окне меню». */\n' +
              "    html += '<div class=\"seg-control\" id=\"themeControl\">';\n" +
              "    html += '<button class=\"seg-btn\" data-theme=\"light\">a</button>';\n" +
              "    html += '<button class=\"seg-btn\" data-theme=\"dark\">b</button>';\n" +
              "    html += '<button class=\"seg-btn\" data-theme=\"system\">c</button>';\n" +
              "    html += '</div>';\n" },

    { имя: 'дописать четвёртый режим кнопкой в разметку',
      ждём: 'кнопок темы ровно три',
      файл: ДОМ,
      было: КНОПКА_СИСТЕМЫ,
      станет: '<button class="seg-btn" data-theme="sepia">S</button>\n            ' +
              КНОПКА_СИСТЕМЫ },

    { имя: 'ослепить признак кнопки в приборе',
      ждём: 'прибор отличает кнопку от корневого data-theme',
      файл: ПРИБОР,
      было: "        if (кусок.indexOf('<button') === -1) continue;",
      станет: "        if (кусок.indexOf('<button-net') === -1 && false) continue;" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: орган переименован — имени прибор не знает',
      ждём: null,
      файл: ДОМ,
      было: 'id="menuThemeControl"',
      станет: 'id="perekluchatelTemy"' },

    { имя: 'МОЛЧАНИЕ: data-theme на корне, а не на кнопке',
      ждём: null,
      файл: ДОМ,
      было: '<html lang="ru" data-theme="dark">',
      станет: '<html lang="ru" data-theme="dark" data-theme-ready="1">\n' +
              '<!-- <section data-theme="dark"> это не кнопка -->' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-tema-'));
    for (const о of ['mobile/www', 'tools']) {
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

console.log('\n  ПРУВЕР: ОДИН ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ\n');

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

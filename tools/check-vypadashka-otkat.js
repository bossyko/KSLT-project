#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ВЫПАДАЮЩИЙ ФИЛЬТР СТРОИТ ДОМ» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ, и один из них главный: имя класса в
 * КОММЕНТАРИИ. На этом приборы КСЛТ попадались дважды — подпись к коду
 * ловилась как код. ПРИБОР ЧИТАЕТ КОД, А НЕ РАССКАЗ О БЕДЕ.
 *
 *   node tools/check-vypadashka-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-vypadashka.js';
const ДОМ = 'js/kslt-vypadashka.js';
const КОРТЫ_САЙТ = 'js/courts.js';
const КОРТЫ_ПРИЛОЖЕНИЕ = 'mobile/www/js/screens/courts.js';

const ОТКАТЫ = [
    { имя: 'вернуть мёртвое имя ct-dd в код',
      ждём: 'мёртвое имя ct-dd не вернулось',
      файл: КОРТЫ_САЙТ,
      было: "        chips.querySelectorAll('.kslt-dd').forEach(function(el) { el.remove(); });",
      станет: "        chips.querySelectorAll('.ct-dd').forEach(function(el) { el.remove(); });" },

    { имя: 'корты приложения перестали звать дом',
      ждём: 'корты обоих продуктов зовут дом',
      файл: КОРТЫ_ПРИЛОЖЕНИЕ,
      было: 'KSLT_VYPADASHKA',
      станет: 'KSLT_VYPADASHKA_NET',
      всеВхождения: true },

    { имя: 'завести шестую свою выпадашку',
      ждём: 'своих выпадашек не прибавилось',
      файл: КОРТЫ_ПРИЛОЖЕНИЕ,
      было: "  CT.filterCity = function(v) { currentCity = v; render(); };",
      станет: "  var своя = '<div class=\"f-dd\"><button class=\"f-dd-toggle\"></button></div>';\n" +
              "  CT.filterCity = function(v) { currentCity = v; render(); };" },

    { имя: 'дом потерял aria-haspopup',
      ждём: 'дом не растерял доступность',
      файл: ДОМ,
      было: " aria-haspopup=\"listbox\" aria-expanded=\"false\"",
      станет: " aria-expanded=\"false\"" },

    { имя: 'прибор перестал вычищать комментарии',
      ждём: 'прибор отличает код от рассказа о коде',
      файл: ПРИБОР,
      было: "    return т.replace(/\\/\\*[\\s\\S]*?\\*\\//g, ' ').replace(/^\\s*\\/\\/.*$/gm, ' ');",
      станет: "    return т;" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: имя ct-dd в комментарии, а не в коде',
      ждём: null,
      файл: КОРТЫ_ПРИЛОЖЕНИЕ,
      было: "  CT.filterCity = function(v) { currentCity = v; render(); };",
      станет: "  /* прежде здесь одевались .ct-dd и .f-dd-item */\n" +
              "  CT.filterCity = function(v) { currentCity = v; render(); };" },

    /* ДОЛГ ЗАКРЫТ 02.11, и откат на молчание переехал: прежде он держался
       за свою выпадашку тренеров, а её больше нет. Теперь молчание
       доказывается иначе — ИМЕНЕМ В ПОДПИСИ, которое прибор обязан
       пропустить, и файлом, вписанным в долг заново. */
    { имя: 'МОЛЧАНИЕ: имя f-dd в подписи к коду',
      ждём: null,
      файл: 'js/coaches.js',
      было: "    function ddРазметка(g) {",
      станет: "    /* прежде тут строилась своя .f-dd-item руками */\n" +
              "    function ddРазметка(g) {" },

    { имя: 'МОЛЧАНИЕ: файл, заново вписанный в долг',
      ждём: null,
      файл: ПРИБОР,
      было: "const ДОЛГ = [];",
      станет: "const ДОЛГ = ['js/coaches.js'];" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-dd-'));
    for (const о of ['js', 'css', 'pages', 'mobile/www', 'tools']) {
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

console.log('\n  ПРУВЕР: ВЫПАДАЮЩИЙ ФИЛЬТР\n');

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
    if (о.всеВхождения ? сколько === 0 : сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        беда++;
        fs.rmSync(к, { recursive: true, force: true });
        continue;
    }
    fs.writeFileSync(п, о.всеВхождения
        ? было.split(о.было).join(о.станет)
        : было.replace(о.было, о.станет));
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

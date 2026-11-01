#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «КЛАСС КАРТИНКИ НЕ НОСИТ ДАННЫЕ» (01.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ТРИ ОТКАТА — НА МОЛЧАНИЕ, и они здесь главные. Первая редакция правила
 * назвала бедой ПЯТЬ законных мест, вторая — ОДНО. Прибор, который кричит
 * волками, снимают целиком, и вместе с ним уходит настоящая проверка.
 *
 *   node tools/check-klass-kartinki-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-klass-kartinki.js';
const ЗАГРУЗЧИК = 'js/sponsors-loader.js';

const ОТКАТЫ = [
    { имя: 'вернуть надписи спонсора класс картинки',
      ждём: 'класс картинки не носит данные',
      файл: ЗАГРУЗЧИК,
      было: ": '<span class=\"sponsor-logo-text\">' + KSLT_экранировать(hero.name) + '</span>';",
      станет: ": '<span class=\"sponsor-logo-img\">' + KSLT_экранировать(hero.name) + '</span>';" },

    { имя: 'снять у надписи обрезку в одну строку',
      ждём: 'у надписи спонсора своя одна строка',
      файл: 'css/style.css',
      было: '    white-space: nowrap;\n    text-overflow: ellipsis;\n    font-weight: 600;\n    color: var(--accent);\n}',
      станет: '    font-weight: 600;\n    color: var(--accent);\n}' },

    { имя: 'ослепить признак классов картинок',
      ждём: 'классы картинок вообще нашлись',
      файл: ПРИБОР,
      было: "        const re = /object-fit\\s*:/g;",
      станет: "        const re = /object-fit-net\\s*:/g;" },

    { имя: 'прибор снова читает css вместе с комментариями',
      ждём: 'разбор css не путает блоки и не читает подписи',
      файл: ПРИБОР,
      /* ОТКАТ БЬЁТ В САМУ ДВЕРЬ, А НЕ РЯДОМ С НЕЙ: снятие комментариев
         делается одной функцией, и образец внутри прибора ходит через
         неё же. Первая редакция этого отката правила только чтение
         файлов — и образец, зовущий функцию напрямую, оставался зорким,
         то есть откат доказывал не то. */
      было: "    return текст.replace(/\\/\\*[\\s\\S]*?\\*\\//g, с => с.replace(/[^\\n]/g, ' '));",
      станет: "    return текст;" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════════
       Прибор обязан МОЛЧАТЬ там, где рамка держит содержимое, и там, где
       содержимое — литерал известной длины. Иначе «ноль мест» ничего не
       значит. */
    { имя: 'МОЛЧАНИЕ: рамка с данными, но выровненная инлайном',
      ждём: null,
      файл: ЗАГРУЗЧИК,
      было: ": '<span class=\"sponsor-logo-text\">' + KSLT_экранировать(hero.name) + '</span>';",
      станет: ": '<span class=\"sponsor-logo-img\" style=\"display:flex;align-items:center\">'" +
              " + KSLT_экранировать(hero.name) + '</span>';" },

    { имя: 'МОЛЧАНИЕ: рамка с данными, но с overflow: hidden инлайном',
      ждём: null,
      файл: ЗАГРУЗЧИК,
      было: ": '<span class=\"sponsor-logo-text\">' + KSLT_экранировать(hero.name) + '</span>';",
      станет: ": '<span class=\"sponsor-logo-img\" style=\"overflow:hidden\">'" +
              " + KSLT_экранировать(hero.name) + '</span>';" },

    { имя: 'МОЛЧАНИЕ: рамка с ЛИТЕРАЛОМ, а не с данными',
      ждём: null,
      файл: ЗАГРУЗЧИК,
      было: ": '<span class=\"sponsor-logo-text\">' + KSLT_экранировать(hero.name) + '</span>';",
      станет: ": '<span class=\"sponsor-logo-img\">\\u0026nbsp;</span>';" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-klass-'));
    for (const о of ['js', 'css', 'mobile/www', 'tools']) {
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

console.log('\n  ПРУВЕР: КЛАСС КАРТИНКИ НА ТЕКСТЕ\n');

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

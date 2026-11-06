#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ИМЯ ЛИГИ — ОДНО ОПРЕДЕЛЕНИЕ» (06.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ПОСЛЕДНИЙ ОТКАТ — НА МОЛЧАНИЕ. Название приложения «KSLT Tennis»
 * латинское на всех языках, и прибор, который считает его именем лиги,
 * назвал бы бедой верную страницу.
 *
 *   node tools/check-imya-ligi-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-imya-ligi.js';

const ОТКАТЫ = [
    { имя: 'заголовок корта снова собирается из литерала',
      ждём: 'заголовок вкладки не собирается из литерала',
      файл: 'js/courts.js',
      было: 'document.title = KSLT_YAZYK.заголовок(court.name);',
      станет: "document.title = 'KSLT \\u2014 ' + court.name;" },

    { имя: 'кыргызский рейтинг снова назван латиницей',
      ждём: 'имя в заголовке страницы отвечает её языку',
      файл: 'pages/players-kg.html',
      было: '<title>КСЛТ — Рейтинг</title>',
      станет: '<title>KSLT — Рейтинг</title>' },

    { имя: 'имя лиги определено в доме второй раз',
      ждём: 'имя лиги определено один раз и в доме языка',
      файл: 'js/kslt-yazyk.js',
      было: "    Я.имя = Я.выбрать('KSLT', 'КСЛТ', 'КСЛТ');",
      станет: "    Я.имя = Я.выбрать('KSLT', 'КСЛТ', 'КСЛТ');\n    Я.имя = 'KSLT';" },

    { имя: 'у страницы пропал заголовок',
      ждём: 'у каждой страницы есть заголовок',
      файл: 'pages/faq.html',
      было: '<title>КСЛТ — Часто задаваемые вопросы</title>',
      станет: '' },

    { имя: 'страница «Скачать» несёт имя приложения латиницей',
      ждём: null,
      файл: 'pages/download.html',
      было: '<title>Скачать KSLT Tennis</title>',
      станет: '<title>Скачать KSLT Tennis — KSLT Tennis</title>' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-imya-'));
    for (const о of ['tools', 'js', 'pages']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    for (const и of fs.readdirSync(КОРЕНЬ)) {
        if (и.endsWith('.html')) fs.cpSync(path.join(КОРЕНЬ, и), path.join(к, и));
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ИМЯ ЛИГИ\n');
{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n' + вывод);
        process.exit(1);
    }
    console.log('  база    исходные файлы правил проходят\n');
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
    if (о.файл.endsWith('.js')) {
        try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
        catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС');
            беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
        }
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        else { console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать'); беда++; }
        continue;
    }
    if (вывод.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (вывод.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) { console.log('  ИТОГ  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали своё правило\n'); process.exit(1); }
console.log('  ИТОГ  все ' + ОТКАТЫ.length + ' откатов уронили ровно своё правило\n');

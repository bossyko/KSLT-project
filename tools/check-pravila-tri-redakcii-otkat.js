#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПРАВИЛА ЛИГИ — ОДИН ДОКУМЕНТ НА ТРЁХ ЯЗЫКАХ».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ПЕРВЫЙ ОТКАТ — ТА САМАЯ БЕДА: пункт есть по-русски и пропал в
 * переводе. Прибор, который на нём молчит, не стережёт ничего.
 *
 *   node tools/check-pravila-tri-redakcii-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-pravila-tri-redakcii.js';
const EN = 'pages/rules-en.html';
const KG = 'pages/rules-kg.html';

const ОТКАТЫ = [
    { имя: 'пункт пропал в английском переводе',
      ждём: 'три редакции держат одну структуру',
      файл: EN,
      было: '                    <li>Official languages of the community: Russian, Kyrgyz, English.</li>\n',
      станет: '' },

    { имя: 'раздел пропал в кыргызском переводе',
      ждём: 'три редакции держат одну структуру',
      файл: KG,
      было: '<div class="ip-rules-section ip-fade-in" id="rules-match">',
      станет: '<div class="ip-rules-section-ubrana" id="rules-match-ubran">' },

    { имя: 'оглавление осталось со старым разделом',
      ждём: 'оглавление отвечает разделам страницы',
      файл: EN,
      было: '<li><a href="#rules-match">Match Format</a></li>',
      станет: '<li><a href="#rules-sanctions">Sanctions &amp; Disqualification</a></li>' },

    { имя: 'пункт остался пустым после правки',
      ждём: 'ни один пункт не пуст',
      файл: KG,
      было: '                    <li>КСЛТ коммерциялык уюм эмес.</li>',
      станет: '                    <li></li>' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-pravila-'));
    for (const о of ['tools', 'pages']) fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПРАВИЛА ЛИГИ НА ТРЁХ ЯЗЫКАХ\n');
{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n' + вывод);
        process.exit(1);
    }
    console.log('  база    исходные страницы правил сходятся\n');
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
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (вывод.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (вывод.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) { console.log('  ИТОГ  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали своё правило\n'); process.exit(1); }
console.log('  ИТОГ  все ' + ОТКАТЫ.length + ' откатов уронили ровно своё правило\n');

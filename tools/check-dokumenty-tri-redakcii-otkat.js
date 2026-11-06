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
const ПРИБОР = 'tools/check-dokumenty-tri-redakcii.js';
const EN = 'pages/rules-en.html';
const KG = 'pages/rules-kg.html';

const ОТКАТЫ = [
    { имя: 'пункт пропал в английском переводе',
      ждём: 'правила лиги: три редакции держат одну структуру',
      файл: EN,
      было: '                    <li>Official languages of the community: Russian, Kyrgyz, English.</li>\n',
      станет: '' },

    { имя: 'раздел пропал в кыргызском переводе',
      ждём: 'правила лиги: три редакции держат одну структуру',
      файл: KG,
      было: '<div class="ip-rules-section ip-fade-in" id="rules-match">',
      станет: '<div class="ip-rules-section-ubrana" id="rules-match-ubran">' },

    { имя: 'оглавление осталось со старым разделом',
      ждём: 'правила лиги: оглавление отвечает разделам',
      файл: EN,
      было: '<li><a href="#rules-match">Match Format</a></li>',
      станет: '<li><a href="#rules-sanctions">Sanctions &amp; Disqualification</a></li>' },

    { имя: 'пункт остался пустым после правки',
      ждём: 'правила лиги: ни один кусок не пуст',
      файл: KG,
      было: '                    <li>КСЛТ коммерциялык уюм эмес.</li>',
      станет: '                    <li></li>' },

    { имя: 'абзац условий пропал в английском переводе',
      ждём: 'условия использования: три редакции держат одну структуру',
      файл: 'pages/terms-en.html',
      было: '                <p class="ip-about-text">\n                    KSLT sends a notification when your account is accessed from a new device.\n                </p>\n',
      станет: '' },

    { имя: 'хвост оферты снова пропал в кыргызском переводе',
      ждём: 'публичная оферта: три редакции держат одну структуру',
      файл: 'pages/offer-kg.html',
      было: '<p><strong>4.10.</strong>',
      станет: '<p><strong>4.10-ubran.</strong>' },

    { имя: 'тринадцать пунктов оферты свёрнуты в отписку',
      ждём: 'публичная оферта: нет заглушек вместо перевода',
      файл: 'pages/offer-kg.html',
      было: '<p><strong>4.5.</strong> Катышуучу милдеттенет:</p>',
      станет: '<p><strong>4.5-4.10.</strong> Катышуучунун милдеттенмелери расмий документте баяндалган.</p>' },

    { имя: 'сторонний сервис пропал в английской политике',
      ждём: 'политика конфиденциальности: три редакции держат одну структуру',
      файл: 'pages/privacy-policy-en.html',
      было: '<strong>4.1.6.</strong>',
      станет: '<strong>4.1.6-ubran.</strong>' },

    { имя: 'пометка о черновике убрана из кыргызской редакции',
      ждём: 'условия использования: пометка о черновике есть на всех языках',
      файл: 'pages/terms-kg.html',
      было: 'ip-draft-note ip-fade-in',
      станет: 'ip-draft-note-ubrana ip-fade-in' }
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

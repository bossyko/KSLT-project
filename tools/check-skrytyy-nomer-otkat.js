#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «СКРЫТЫЙ ТЕЛЕФОН НЕ УХОДИТ ПОД ВИДОМ WHATSAPP».
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Три отката —
 * по одному на рубеж: база и две разметки.
 *
 *   node tools/check-skrytyy-nomer-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-skrytyy-nomer.js';

const ОТКАТЫ = [
    { имя: 'база снова подставляет телефон под WhatsApp',
      ждём: 'функция базы `kslt_kontakty`: телефон не подставляется мимо разрешения',
      файл: 'sql/схема/vacap-ne-vydayot-skrytyy-nomer-06nov.sql',
      было: "             'whatsapp_phone',  CASE WHEN p.show_whatsapp\n                                     THEN coalesce(p.whatsapp_phone,\n                                                   CASE WHEN p.show_phone THEN p.phone END)\n                                END,",
      станет: "             'whatsapp_phone',  CASE WHEN p.show_whatsapp  THEN coalesce(p.whatsapp_phone, p.phone) END," },

    { имя: 'карточка на сайте снова падает на основной телефон',
      ждём: 'карточка игрока на сайте: телефон не подставляется мимо разрешения',
      файл: 'js/player.js',
      было: "        var wa = contacts.show_whatsapp\n            ? (contacts.whatsapp_phone ||\n               (contacts.show_phone ? (contacts.phone || '') : ''))\n            : '';",
      станет: "        var wa = contacts.show_whatsapp\n            ? (contacts.whatsapp_phone || contacts.phone || '')\n            : '';" },

    { имя: 'карточка в приложении снова падает на основной телефон',
      ждём: 'карточка игрока в приложении: телефон не подставляется мимо разрешения',
      файл: 'mobile/www/js/screens/player-detail.js',
      было: "      var cWa = contacts.show_whatsapp\n        ? (contacts.whatsapp_phone || (contacts.show_phone ? (contacts.phone || '') : ''))\n        : '';",
      станет: "      var cWa = contacts.show_whatsapp ? (contacts.whatsapp_phone || contacts.phone || '') : '';" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-nomer-'));
    for (const о of ['tools', 'js', 'sql']) fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    fs.mkdirSync(path.join(к, 'mobile/www/js/screens'), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, 'mobile/www/js/screens'), path.join(к, 'mobile/www/js/screens'), { recursive: true });
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: СКРЫТЫЙ НОМЕР ПОД WHATSAPP\n');
{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n' + вывод);
        process.exit(1);
    }
    console.log('  база    исходники проходят\n');
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
    if (вывод.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (вывод.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) { console.log('  ИТОГ  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали своё правило\n'); process.exit(1); }
console.log('  ИТОГ  все ' + ОТКАТЫ.length + ' откатов уронили ровно своё правило\n');

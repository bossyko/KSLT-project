#!/usr/bin/env node
/**
 * ЗАМОРОЗКА «СКРЫТЫЙ ТЕЛЕФОН НЕ УХОДИТ ПОД ВИДОМ WHATSAPP» (06.11).
 *
 * ЧТО БЫЛО ПОМЕРЕНО. И база, и обе разметки подставляли основной телефон
 * под кнопку WhatsApp, когда своего номера WhatsApp нет:
 *     coalesce(p.whatsapp_phone, p.phone)                 — функция `kslt_kontakty`
 *     contacts.whatsapp_phone || contacts.phone || ''     — `js/player.js`
 *     contacts.whatsapp_phone || contacts.phone || ''     — `screens/player-detail.js`
 * `show_phone` при этом не спрашивался НИГДЕ. Человек выключал показ
 * телефона, а номер вставал в ссылку `wa.me/<номер>`: на экране его не
 * видно, но он есть в разметке и в ответе функции.
 *
 * ЧЕМ ЭТО ХУЖЕ ОБЫЧНОЙ ОШИБКИ. В анкете Data safety для Play мы
 * отвечаем, что телефон виден другим ПО РЕШЕНИЮ САМОГО ЧЕЛОВЕКА. Это
 * решение обходилось соседним переключателем, то есть ответ был неверен.
 *
 * ЧТО СТЕРЕЖЁТ. Подстановку основного телефона под WhatsApp — в трёх
 * местах сразу: в тексте функции базы и в обеих разметках. Везде она
 * законна ТОЛЬКО под проверкой `show_phone`.
 *
 * ПОЧЕМУ ТРИ МЕСТА, А НЕ ОДНО. Заслон стоит в базе, разметки — второй
 * рубеж. Прибор держит все три: убрать можно любой, и дыра вернётся
 * ровно там, где её перестанут ждать.
 *
 *   node tools/check-skrytyy-nomer.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = process.env.KSLT_KOREN || path.join(__dirname, '..');

const МЕСТА = [
    { файл: 'sql/схема/vacap-ne-vydayot-skrytyy-nomer-06nov.sql', что: 'функция базы `kslt_kontakty`',
      падение: /coalesce\s*\(\s*p\.whatsapp_phone\s*,\s*p\.phone\s*\)/,
      заслон: /coalesce\s*\(\s*p\.whatsapp_phone\s*,\s*CASE\s+WHEN\s+p\.show_phone\s+THEN\s+p\.phone\s+END\s*\)/i },
    { файл: 'js/player.js', что: 'карточка игрока на сайте',
      падение: /whatsapp_phone\s*\|\|\s*contacts\.phone/,
      заслон: /whatsapp_phone\s*\|\|\s*\n?\s*\(\s*contacts\.show_phone\s*\?/ },
    { файл: 'mobile/www/js/screens/player-detail.js', что: 'карточка игрока в приложении',
      падение: /whatsapp_phone\s*\|\|\s*contacts\.phone/,
      заслон: /whatsapp_phone\s*\|\|\s*\(\s*contacts\.show_phone\s*\?/ }
];

function чит(ф) {
    const п = path.join(КОРЕНЬ, ф);
    return fs.existsSync(п) ? fs.readFileSync(п, 'utf8') : null;
}
function безКом(т) {
    return (т || '')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ')
        .replace(/^\s*--.*$/gm, ' ');
}

const ошибки = [];
function правило(имя, держится, подсказка) {
    if (!держится) ошибки.push({ имя: имя, подсказка: подсказка });
}

for (const м of МЕСТА) {
    const сырое = чит(м.файл);
    правило(м.что + ': файл на месте', сырое !== null, 'Нет файла `' + м.файл + '`.');
    if (сырое === null) continue;
    /* Комментарии срезаются: в этих самых файлах прежний вид записан
       словами, и правило, ищущее его где угодно, падало бы всегда. */
    const т = безКом(сырое);
    правило(м.что + ': телефон не подставляется мимо разрешения',
        !м.падение.test(т),
        'В `' + м.файл + '` основной телефон снова падает под WhatsApp без\n' +
        'проверки `show_phone`. Человек выключил показ номера — значит номера\n' +
        'нет и в ссылке `wa.me`. Свой номер WhatsApp показывается как и прежде.');
    правило(м.что + ': заслон на месте',
        м.заслон.test(т),
        'В `' + м.файл + '` пропала проверка `show_phone` у подстановки\n' +
        'WhatsApp. Либо её убрали, либо запись переписали так, что прибор её\n' +
        'не узнаёт — и то и другое чинится здесь, а не в приборе.');
}

if (ошибки.length) {
    console.log('НЕ ТАК  скрытый номер: ' + ошибки.length + ' из ' + (МЕСТА.length * 3) + ' правил упало\n');
    for (const о of ошибки) console.log('  ✗ ' + о.имя + '\n    ' + о.подсказка.replace(/\n/g, '\n    ') + '\n');
    process.exit(1);
}
console.log('ок      скрытый номер: ' + (МЕСТА.length * 3) + ' правил, три рубежа (база и две разметки)');

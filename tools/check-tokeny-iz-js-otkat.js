#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ТОКЕН ИЗ JS ОБЪЯВЛЕН В CSS» (30.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ОДИН ОТКАТ ЗДЕСЬ ОСОБЫЙ — НА МОЛЧАНИЕ. Прибор обязан МОЛЧАТЬ там, где
 * js сам объявляет токен на узле (`setProperty`): первая редакция на этом
 * и соврала. Откат проверяет именно молчание — иначе правило снова начнёт
 * называть законное беспризорным.
 *
 *   node tools/check-tokeny-iz-js-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ТОКЕНЫ = 'css/tokens.css';
const КАРТОЧКА = 'js/kslt-vaucher-kartochka.js';
const ПОДИУМ = 'js/home-rankings.js';

const ОТКАТЫ = [
    { имя: 'верх перехода карточки снова снят как «мёртвый»',
      ждём: 'верх перехода печатной карточки объявлен',
      файл: ТОКЕНЫ,
      было: '  --vch-card-top:    var(--neutral-900);',
      станет: '' },

    { имя: 'дом карточки зовёт токен, которого нет',
      ждём: 'каждый токен, названный из js строкой, объявлен в css',
      файл: КАРТОЧКА,
      было: "        переход.addColorStop(1, краска('--vch-card-bottom'));",
      станет: "        переход.addColorStop(1, краска('--vch-card-niz'));" },

    { имя: 'МОЛЧАНИЕ: js объявляет токен сам — это не беспризорный зов',
      ждём: null,
      файл: ПОДИУМ,
      было: "            и.style.setProperty('--iskra', м.цвет);",
      станет: "            и.style.setProperty('--iskra-novaya', м.цвет);" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-tokeny-'));
    for (const о of ['js', 'css', 'mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-tokeny-iz-js.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ТОКЕНЫ ИЗ JS\n');

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
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        /* ОТКАТ НА МОЛЧАНИЕ: правило НЕ должно падать. */
        if (вывод.indexOf('НЕ ТАК') === -1) {
            console.log('  ок  ' + о.имя + ' → правило молчит, и это верно');
        } else {
            console.log('  ✗ ' + о.имя + ' → правило УПАЛО на законном месте');
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

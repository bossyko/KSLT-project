#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ССЫЛКУ YOUTUBE РАЗБИРАЕТ ОДИН ДОМ» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ, и оба про одно: прибор ищет РАЗБОР, а не
 * упоминание. Адрес YouTube стоит в коде и строкой (`'…/embed/' + id`),
 * и в подписях — считать их за свой разборщик значит кричать волками
 * там, где всё верно.
 *
 *   node tools/check-youtube-odin-razbor-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-youtube-odin-razbor.js';
const ДОМ = 'js/kslt-video.js';
const САЙТ = 'js/live-match.js';
const ПРИЛОЖЕНИЕ = 'mobile/www/js/screens/live.js';
const АДМИНКА = 'js/admin/sections/live.js';

const ОТКАТЫ = [
    { имя: 'вернуть свой разборщик на сайт',
      ждём: 'разбор ссылки YouTube живёт только в доме',
      файл: САЙТ,
      /* ЗОВ ДОМА ОСТАЁТСЯ НА МЕСТЕ: иначе откат снимает сразу два
         признака и роняет соседнее правило — проверяется не то, что
         хотели. Здесь свой разбор ДОБАВЛЕН рядом, как это и бывает в
         жизни: кто-то дописал «на всякий случай». */
      было: '        return window.KSLT_VIDEO ? window.KSLT_VIDEO.ytId(url) : null;',
      станет: '        var m = url && url.match(/(?:youtube\\.com\\/(?:watch\\?v=|embed\\/|live\\/)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/);\n' +
              '        if (m) return m[1];\n' +
              '        return window.KSLT_VIDEO ? window.KSLT_VIDEO.ytId(url) : null;' },

    { имя: 'приложение перестало звать дом',
      ждём: 'оба экрана Live зовут дом',
      файл: ПРИЛОЖЕНИЕ,
      было: 'window.KSLT_VIDEO.ytId(url)',
      станет: 'null /* не зовём */' },

    { имя: 'дом разучился понимать ссылку трансляции',
      ждём: 'дом понимает все виды ссылок, которые отдаёт YouTube',
      файл: ДОМ,
      было: '(?:live|embed|shorts|video|v)?',
      станет: '(?:embed|shorts|video|v)?' },

    { имя: 'дом стал принимать битую ссылку',
      ждём: 'дом понимает все виды ссылок, которые отдаёт YouTube',
      файл: ДОМ,
      было: '([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);\n        if (п) return п[1];',
      станет: '([A-Za-z0-9_-]{3,})/);\n        if (п) return п[1];' },

    { имя: 'админка перестала проверять ссылку',
      ждём: 'админка проверяет ссылку той же функцией, что и зритель',
      файл: АДМИНКА,
      было: '            if (!ytПроверить()) return A.showToast(L.liveYoutubeBad, \'error\');\n',
      станет: '' },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: адрес YouTube строкой, а не регуляркой',
      ждём: null,
      файл: САЙТ,
      было: '        return window.KSLT_VIDEO ? window.KSLT_VIDEO.ytId(url) : null;',
      станет: "        var а = 'https://www.youtube.com/embed/';\n" +
              '        return а && window.KSLT_VIDEO ? window.KSLT_VIDEO.ytId(url) : null;' },

    { имя: 'МОЛЧАНИЕ: адрес YouTube в подписи к коду',
      ждём: null,
      файл: ПРИЛОЖЕНИЕ,
      было: '  function extractYoutubeId(url) {',
      станет: '  /* прежде тут стояло /youtube\\.com\\/watch\\?v=/ своим разбором */\n' +
              '  function extractYoutubeId(url) {' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-yt-'));
    for (const о of ['js', 'mobile/www/js', 'tools']) {
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

console.log('\n  ПРУВЕР: РАЗБОР ССЫЛКИ YOUTUBE\n');

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
    try {
        execFileSync('node', ['--check', п], { encoding: 'utf8' });
    } catch (e) {
        console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
        беда++;
        fs.rmSync(к, { recursive: true, force: true });
        continue;
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

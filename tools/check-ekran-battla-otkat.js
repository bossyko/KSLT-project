#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ЭКРАН БАТТЛА В ПРИЛОЖЕНИИ» (30.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ЯКОРЯ ДЕРЖАТСЯ НА СОДЕРЖИМОМ, А НЕ НА НОМЕРЕ ВЕРСИИ: 29.10 прогон
 * нашёл 42 прувера, сгнивших именно на версиях в якорях.
 *
 *   node tools/check-ekran-battla-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ЭКРАН = 'mobile/www/js/screens/home.js';
const ДОМ_П = 'mobile/www/js/kslt-karta.js';
const СЛОВАРЬ = 'mobile/www/js/i18n.js';
const РАЗМЕТКА = 'mobile/www/index.html';
const CSS = 'mobile/www/css/app.css';

const ОТКАТЫ = [
    { имя: 'проверка статуса уехала ПОСЛЕ отрисовки',
      ждём: 'отменённый баттл отсекается ДО отрисовки и голосования',
      файл: ЭКРАН,
      было: "      if (_battleData.status === 'cancelled') {",
      станет: "      if (_battleData.статусОтключён === 'cancelled') {" },

    { имя: 'ветка отмены перестала выходить из функции',
      ждём: 'ветка отмены выходит из функции, а не просто рисует',
      файл: ЭКРАН,
      было: "        overlay.classList.add('open');\n        return;\n      }\n\n      _battleVotes = {};",
      станет: "        overlay.classList.add('open');\n      }\n\n      _battleVotes = {};" },

    { имя: 'у слова отмены пропал кыргызский',
      ждём: 'слово battles.cancelled есть на всех трёх языках',
      файл: СЛОВАРЬ,
      было: "'battles.cancelled':     { ru: 'Баттл отменён',      en: 'Battle cancelled', kg: 'Баттл жокко чыгарылды' },",
      станет: "'battles.cancelled':     { ru: 'Баттл отменён',      en: 'Battle cancelled' }," },

    { имя: 'слово отмены разошлось с сайтом',
      ждём: 'слова отмены совпадают с сайтом',
      файл: СЛОВАРЬ,
      было: "en: 'Battle cancelled', kg: 'Баттл жокко чыгарылды' },",
      станет: "en: 'Battle is cancelled', kg: 'Баттл жокко чыгарылды' }," },

    { имя: 'экран снова собирает адрес карты сам',
      ждём: 'экран берёт адрес карты у дома, а не собирает сам',
      файл: ЭКРАН,
      было: "    var адрес = K ? (K.встроить(gm) || K.встроить(tg)) : null;",
      станет: "    var адрес = gm ? 'https://maps.google.com/maps?q=' + encodeURIComponent(gm) + '&output=embed' : null;" },

    { имя: 'второй дом карты в приложении',
      ждём: 'дом карты объявлен ровно один раз на продукт',
      файл: ЭКРАН,
      было: "  function renderBattleMap(b) {",
      станет: "  window.KSLT_KARTA = { встроить: function () { return null; } };\n\n  function renderBattleMap(b) {" },

    { имя: 'копии дома карты разошлись',
      ждём: 'копии дома карты побайтово равны',
      файл: ДОМ_П,
      было: '    K.встроить = function (ссылка, адрес) {',
      станет: '    K.встроить = function (ссылка, адрес) { /* уехало */' },

    { имя: 'дом карты поставлен ПОСЛЕ экрана',
      ждём: 'дом карты подключён в приложение раньше экрана',
      файл: РАЗМЕТКА,
      было: '<script src="js/kslt-karta.js?v=1"></script>\n',
      станет: '' },

    { имя: 'блок карты рисуется и без ссылок',
      ждём: 'без ссылок блок карты не рисуется вовсе',
      файл: ЭКРАН,
      было: "    if (!gm && !tg) return '';",
      станет: "    if (false) return '';" },

    { имя: 'ссылку перестали экранировать',
      ждём: 'ссылки экранируются, как и все данные',
      файл: ЭКРАН,
      было: "'<a class=\"bd-map-link\" href=\"' + esc(gm) + '\"",
      станет: "'<a class=\"bd-map-link\" href=\"' + gm + '\"" },

    { имя: 'у отменённого баттла отняли вид',
      ждём: 'у карты и отмены есть свой вид в css',
      файл: CSS,
      было: '.bd-cancelled {',
      станет: '.bd-cancelled-otkl {' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-battle-'));
    for (const о of ['js', 'mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-ekran-battla.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ЭКРАН БАТТЛА В ПРИЛОЖЕНИИ\n');

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
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
console.log('          оригиналы не трогались — работа шла на копии\n');

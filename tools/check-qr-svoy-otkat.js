#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ВАУЧЕР: СВОЙ QR» (03.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ОТКАТ, МЕНЯЮЩИЙ БОЛЬШЕ, ЧЕМ ОБЕЩАЛ, ДОКАЗЫВАЕТ НЕ ТО: каждый откат
 * здесь меняет РОВНО одну вещь, а синтаксис копии проверяется до прогона.
 *
 *   node tools/check-qr-svoy-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-qr-svoy.js';
const ОКНО = 'mobile/www/js/screens/profile.js';
const СТРАНИЦА = 'mobile/www/index.html';

const ОТКАТЫ = [
    { имя: 'картинка снова берётся с чужого сервера',
      ждём: 'ваучер не рисуется на чужом сервере',
      файл: ОКНО,
      было: "'<div id=\"voucherQRBox\"",
      станет: "'<img src=\"https://api.qrserver.com/v1/create-qr-code/?size=200x200\"><div id=\"voucherQRBox\"" },

    { имя: 'дом QR не подключён вовсе',
      ждём: 'дом QR подключён на странице приложения',
      файл: СТРАНИЦА,
      было: '<script src="js/vendor/qrcode.js?v=1"></script>\n',
      станет: '' },

    { имя: 'подключение дома QR без версии',
      ждём: 'у подключения дома QR есть версия',
      файл: СТРАНИЦА,
      было: 'js/vendor/qrcode.js?v=1',
      станет: 'js/vendor/qrcode.js' },

    { имя: 'дом QR подключён ПОСЛЕ окна ваучера',
      ждём: 'дом QR подключён раньше окна ваучера',
      файл: СТРАНИЦА,
      было: '<script src="js/vendor/qrcode.js?v=1"></script>\n<script src="js/screens/home.js',
      станет: '<script src="js/screens/home.js' },

    { имя: 'окно ваучера перестало звать свою отрисовку',
      ждём: 'окно ваучера зовёт свою отрисовку',
      файл: ОКНО,
      было: "    рисоватьQR(modal.querySelector('#voucherQRBox'), code);\n",
      станет: '' },

    { имя: 'запасного пути без дома больше нет',
      ждём: 'у отрисовки есть запасной путь без дома',
      файл: ОКНО,
      было: "    if (typeof window.qrcode !== 'function') {",
      станет: '    if (false) {' },

    { имя: 'запасной путь молчит вместо кода словами',
      ждём: 'запасной путь показывает сам код',
      файл: ОКНО,
      было: '      узел.textContent = String(код);',
      станет: "      узел.textContent = '';" },

    { имя: 'отрисовка снова ходит в сеть',
      ждём: 'отрисовка QR не ходит в сеть',
      файл: ОКНО,
      было: '    var q = window.qrcode(0, \'M\');',
      станет: "    fetch('https://example.com/qr');\n    var q = window.qrcode(0, 'M');" },

    /* ── ОТКАТ НА МОЛЧАНИЕ ──
       Подпись о том, почему дом свой, — не код. Переписав её, правило
       ронять нельзя: прибор обязан мерить поведение, а не слова о нём.
       Заодно это ловит прибор, который ищет чужой адрес ПО ВСЕМУ ТЕКСТУ,
       не сняв комментарии: в подписи адрес назван нарочно. */
    { имя: 'МОЛЧАНИЕ: подпись к отрисовке переписана',
      ждём: null,
      файл: ОКНО,
      было: '  /* QR РИСУЕТСЯ В ТЕЛЕФОНЕ, А НЕ НА ЧУЖОМ СЕРВЕРЕ (03.11).',
      станет: '  /* Рисование QR. Что-то про ваучеры.' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-qr-'));
    fs.cpSync(path.join(КОРЕНЬ, 'tools'), path.join(к, 'tools'), { recursive: true });
    fs.mkdirSync(path.join(к, 'mobile'), { recursive: true });
    fs.cpSync(path.join(КОРЕНЬ, 'mobile/www'), path.join(к, 'mobile/www'), { recursive: true });
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ВАУЧЕР — СВОЙ QR\n');

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

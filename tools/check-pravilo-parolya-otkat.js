#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПРАВИЛО ПАРОЛЯ ОДНО» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Голая длина (код из письма — шесть цифр) не
 * правило пароля, и прибор, считающий её бедой, падал бы на верном
 * коде; имя правила в подписи — тоже не код.
 *
 *   node tools/check-pravilo-parolya-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-pravilo-parolya.js';
const ДОМ = 'js/kslt-parol.js';
const ВХОД = 'mobile/www/js/auth.js';
const СЛОВАРЬ = 'mobile/www/js/i18n.js';

const ОТКАТЫ = [
    { имя: 'смена пароля снова проверяет сама',
      ждём: 'правило пароля не написано заново',
      файл: ВХОД,
      было: '        if (!window.KSLT_PAROL.годится(newPw)) {',
      станет: "        if (newPw.length < 8 || !/[A-Z]/.test(newPw)) {" },

    { имя: 'длину опустили до шести',
      ждём: 'длина не опускается ниже восьми',
      файл: ДОМ,
      было: '    P.ДЛИНА = 8;',
      станет: '    P.ДЛИНА = 6;' },

    { имя: 'дом стал отвечать только да/нет',
      ждём: 'дом отвечает, ЧЕГО не хватает, а не только да/нет',
      файл: ДОМ,
      было: '    P.чегоНеХватает = function (пароль) {',
      станет: '    P.проверить = function (пароль) {' },

    { имя: 'подпись снова обещает шесть знаков',
      ждём: 'подпись в словаре говорит то же, что проверяет код',
      файл: СЛОВАРЬ,
      было: "    'profile.passRule':       { ru: '8 символов, заглавная, цифра и знак', en: '8 characters, uppercase, digit and symbol', kg: '8 белги, баш тамга, сан жана белги' },",
      станет: "    'profile.passRule':       { ru: 'Минимум 6 символов', en: 'Min 6 characters', kg: 'Жок дегенде 6 белги' }," },

    { имя: 'прибор перестал требовать вида знаков',
      ждём: 'прибор отличает правило пароля от проверки длины кода',
      файл: ПРИБОР,
      было: "        /\\[A-Z|A-ZА-Я|0-9\\]|!@#\\$/.test(с)",
      станет: "        /./.test(с)" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: проверка длины кода из письма',
      ждём: null,
      файл: ВХОД,
      было: '        if (!window.KSLT_PAROL.годится(newPw)) {',
      станет: "        if (String(newPw).length < 6) { /* не правило пароля */ }\n" +
              '        if (!window.KSLT_PAROL.годится(newPw)) {' },

    { имя: 'МОЛЧАНИЕ: прежнее правило названо в подписи к коду',
      ждём: null,
      файл: ВХОД,
      было: '        if (!window.KSLT_PAROL.годится(newPw)) {',
      станет: "        /* было: newPw.length < 8 || !/[A-Z]/.test(newPw) */\n" +
              '        if (!window.KSLT_PAROL.годится(newPw)) {' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-parol-'));
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

console.log('\n  ПРУВЕР: ПРАВИЛО ПАРОЛЯ\n');

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

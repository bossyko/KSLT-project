#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ОДИН ВЫБОР СТРАНЫ И ГЛАЗ У КАЖДОГО ПАРОЛЯ» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Оригиналы не
 * трогаются: «у меня зелёное» ничего не доказывает — тем более что этот
 * прибор дал пять зелёных правил с первого прогона.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Прибор, который считает бедой всякий
 * `<option>` и всякое упоминание кода, не отличает второй список стран
 * от обычного выбора, и «ноль мест» у него ничего не значит.
 *
 * ЯКОРЯ ДЕРЖАТСЯ НА СОДЕРЖИМОМ, А НЕ НА НОМЕРЕ ВЕРСИИ: номер растёт при
 * каждой правке файла, и откат, привязанный к `?v=1`, развалился бы на
 * следующий же день.
 *
 *   node tools/check-strana-i-glaz-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-strana-i-glaz.js';
const ДОМ = 'mobile/www/index.html';
const КАБИНЕТ = 'mobile/www/js/screens/profile.js';

const ОТКАТЫ = [
    { имя: 'вернуть в разметку свой список стран',
      ждём: 'своего списка стран в приложении нет',
      файл: ДОМ,
      было: '<div id="forgotCountryBox"></div>',
      станет: '<select id="forgotCountry">' +
              '<option value="+996">KG</option>' +
              '<option value="+7">RU</option>' +
              '</select>' },

    { имя: 'вернуть кабинету нативный селект страны',
      ждём: 'нативного селекта под страну в приложении нет',
      файл: КАБИНЕТ,
      было: "KSLT_PHONE.pickerHtml(phoneParts.iso, I18N.lang, 'prof-phone-country')",
      станет: "KSLT_PHONE.selectHtml('profPhoneCountry', phoneParts.iso, I18N.lang, 'prof-phone-country')" },

    { имя: 'снять подключение глаза в доме',
      ждём: 'глаз подключён в доме приложения',
      файл: ДОМ,
      было: 'kslt-glaz-parolya.js?v=',
      станет: 'kslt-glaz-parolya-snyat.js?v=' },

    { имя: 'экран с паролем перестал звать глаз',
      ждём: 'каждый экран с паролем знает про глаз',
      файл: КАБИНЕТ,
      было: '    if (window.KSLT_GLAZ) KSLT_GLAZ.применить(ov || document);\n',
      станет: '' },

    { имя: 'ослепить признак телефонного кода в приборе',
      ждём: 'прибор отличает свой список стран от чужого option',
      файл: ПРИБОР,
      было: 'const м = т.match(/<option[^>]*value\\s*=\\s*["\']\\+\\d+["\']/g);',
      станет: 'const м = т.match(/<option[^>]*value\\s*=\\s*["\'][^"\']*["\']/g);' },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: обычный выбор, а не страна',
      ждём: null,
      файл: ДОМ,
      было: '<div id="forgotCountryBox"></div>',
      станет: '<div id="forgotCountryBox"></div>' +
              '<select id="poryadok"><option value="new">Новые</option>' +
              '<option value="old">Старые</option></select>' },

    { имя: 'МОЛЧАНИЕ: телефонный код в тексте, а не в значении',
      ждём: null,
      файл: ДОМ,
      было: '<div id="forgotCountryBox"></div>',
      станет: '<div id="forgotCountryBox"></div><p>Звоните: +996 555 123 456</p>' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-strana-'));
    for (const о of ['mobile/www', 'tools']) {
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

console.log('\n  ПРУВЕР: СТРАНА И ГЛАЗ\n');

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

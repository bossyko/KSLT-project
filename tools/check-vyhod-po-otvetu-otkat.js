#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ВЫХОД ИЗ АККАУНТА — ТОЛЬКО ПО ОТВЕТУ СЕРВЕРА» (31.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Оригиналы не
 * трогаются: «у меня зелёное» ничего не доказывает.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ — на том, что живёт в блоке постоянно, — а
 * не на номере строки, не на версии файла и не на соседе, который может
 * уехать.
 *
 *   node tools/check-vyhod-po-otvetu-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-baza.js';
const ОХРАНА = 'js/auth-guard.js';

const ОТКАТЫ = [
    { имя: 'дом больше не объявляет «вход отозван»',
      ждём: 'дом базы объявляет «вход отозван»',
      файл: ДОМ,
      было: '    API.входОтозван = function (токен, пределМс) {',
      станет: '    API.входОтозванПоНовому = function (токен, пределМс) {' },

    { имя: 'щуп снова считает отозванным и беду сервера (5xx)',
      ждём: '«вход отозван» отвечает да только на 401 и 403',
      файл: ДОМ,
      было: '            return о.status === 401 || о.status === 403;',
      станет: '            return о.status === 401 || о.status === 403 || о.status === 500;' },

    { имя: 'отсутствие ответа снова считается «входа нет»',
      ждём: 'отсутствие ответа отвечает «не отозван»',
      файл: ДОМ,
      было: '        }).catch(function () {\n            return false;\n        }).then(function (о) {',
      станет: '        }).catch(function () {\n            return true;\n        }).then(function (о) {' },

    { имя: 'у щупа отобрали срок',
      ждём: 'у щупа есть свой срок',
      файл: ДОМ,
      было: '        var прервать = (typeof global.AbortController === \'function\')\n' +
            '            ? new global.AbortController() : null;\n' +
            '        var часы = прервать\n' +
            '            ? global.setTimeout(function () { прервать.abort(); }, пределМс || 8000)\n' +
            '            : null;',
      станет: '        var прервать = null;\n        var часы = null;' },

    { имя: 'дом сам чистит запись сессии',
      ждём: 'дом не выходит из аккаунта сам',
      файл: ДОМ,
      было: "        if (!токен || typeof global.fetch !== 'function') return Promise.resolve(false);",
      станет: "        if (!токен || typeof global.fetch !== 'function') return Promise.resolve(false);\n" +
              '        global.localStorage.removeItem(API.имяЗаписи());' },

    { имя: 'повторы отобраны — решение по первой же ошибке',
      ждём: 'охрана переживает короткий сбой повторами',
      файл: ОХРАНА,
      было: '    var ПОВТОРЫ = [400, 1200];',
      станет: '    var ПОВТОРЫ = [];' },

    { имя: 'охрана снова спрашивает сервер напрямую, мимо повторов',
      ждём: 'охрана спрашивает вход через повторы, а не напрямую',
      файл: ОХРАНА,
      было: '            var живой = await живЛиВход();',
      станет: '            var живой = await client.auth.getUser();' },

    { имя: 'перед выходом больше не спрашивают, отозван ли вход',
      ждём: 'перед выходом из аккаунта спрашивают, отозван ли вход',
      файл: ОХРАНА,
      было: '                var отозван = await window.KSLT_BAZA.входОтозван(\n' +
            '                    result.data.session.access_token);\n' +
            '                if (!отозван) {',
      станет: '                var отозван = true;\n' +
              '                if (false) {' },

    { имя: '«без связи» снова уводит со страницы',
      ждём: 'без связи вход не стирается',
      файл: ОХРАНА,
      было: "        document.body.classList.add('auth-ready', 'kslt-bez-svyazi');\n" +
            "        console.warn('Auth Guard: связи с сервером входа нет (' + почему +",
      станет: "        document.body.classList.add('auth-ready', 'kslt-bez-svyazi');\n" +
              '        window.location.href = authPage;\n' +
              "        console.warn('Auth Guard: связи с сервером входа нет (' + почему +" },

    { имя: 'без связи страница остаётся скрытой',
      ждём: 'без связи страница всё равно показывается',
      файл: ОХРАНА,
      было: "        document.body.classList.add('auth-ready', 'kslt-bez-svyazi');",
      станет: "        document.body.classList.add('kslt-bez-svyazi');" },

    { имя: 'ошибка чтения профиля снова выдаётся за «профиля нет»',
      ждём: 'ошибка чтения профиля отделена от пустого ответа',
      файл: ОХРАНА,
      было: '                if (profileResult.error) {',
      станет: '                if (false && profileResult.error) {' },

    { имя: 'сторож прав снова смотрит в пустой профиль',
      ждём: 'роль решается одной функцией',
      файл: ОХРАНА,
      было: '        if (staffRoles.indexOf(рольСейчас()) === -1) {',
      станет: '        if (!window.ksltProfile || staffRoles.indexOf(window.ksltProfile.role) === -1) {' },

    { имя: 'роль из хранилища берётся и при живой связи',
      ждём: 'роль из хранилища берётся только без связи',
      файл: ОХРАНА,
      было: "        if (document.body.classList.contains('kslt-bez-svyazi')) {\n" +
            "            try { return localStorage.getItem('kslt_role'); } catch (e) { return null; }\n" +
            '        }',
      станет: "        try { return localStorage.getItem('kslt_role'); } catch (e) { return null; }" },

    { имя: 'про отсутствие связи сказано не по-кыргызски',
      ждём: 'про отсутствие связи сказано на трёх языках',
      файл: ОХРАНА,
      было: "                'Серверге байланыш жок. Сиз чыккан жоксуз, бирок бет бош же эскирген болушу мүмкүн.',\n",
      станет: '' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vyhod-'));
    for (const о of ['js', 'css', 'mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-vyhod-po-otvetu.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ВЫХОД ПО ОТВЕТУ СЕРВЕРА\n');

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
    /* ОТКАТ ОБЯЗАН ОСТАВИТЬ ФАЙЛ РАЗБОРНЫМ: правило, упавшее на сломанном
       синтаксисе, доказывает не себя, а поломку. */
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

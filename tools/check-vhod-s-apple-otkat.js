#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ВХОД С APPLE» (04.11).
 *
 *   node tools/check-vhod-s-apple-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-vhod-s-apple.js';
const ВХОД = 'mobile/www/js/auth.js';
const КОНФИГ = 'mobile/www/js/supabase-config.js';
const СТР = 'mobile/www/index.html';
const СЛОВ = 'mobile/www/js/i18n.js';

const ОТКАТЫ = [
    { имя: 'вход с Apple снят, Google остался',
      ждём: 'при стороннем входе предложен и вход с Apple',
      файл: ВХОД,
      было: "      provider: 'apple',",
      станет: "      provider: 'google'," },

    { имя: 'кнопка входа Apple убрана с экрана',
      ждём: 'кнопка Apple стоит рядом с кнопкой входа Google',
      файл: СТР,
      было: '<button class="auth-social-btn apple" id="authApple" hidden aria-label="Apple">',
      станет: '<button class="auth-social-btn apple" id="appleLater" hidden aria-label="Apple">' },

    { имя: 'кнопка регистрации Apple убрана',
      ждём: 'кнопка Apple стоит рядом с кнопкой регистрации Google',
      файл: СТР,
      было: '<button type="button" class="auth-option-btn auth-option-apple" id="regApple" hidden>',
      станет: '<button type="button" class="auth-option-btn auth-option-apple" id="regAppleLater" hidden>' },

    { имя: 'кнопка входа показана до настройки провайдера',
      ждём: 'кнопка authApple спрятана в разметке',
      файл: СТР,
      было: 'id="authApple" hidden aria-label="Apple"',
      станет: 'id="authApple" aria-label="Apple"' },

    { имя: 'флаг включён по умолчанию',
      ждём: 'флаг входа с Apple объявлен и по умолчанию выключен',
      файл: КОНФИГ,
      было: 'window.KSLT_APPLE = window.KSLT_APPLE || false;',
      станет: 'window.KSLT_APPLE = true;' },

    { имя: 'прятки снимаются мимо флага',
      ждём: 'кнопки показываются только под флагом',
      файл: ВХОД,
      было: '    if (window.KSLT_APPLE) {',
      станет: '    if (true) {' },

    { имя: 'подпись кнопки потеряла кыргызский',
      ждём: 'подпись кнопки переведена на три языка',
      файл: СЛОВ,
      было: "    'auth.regApple':    { ru: 'Регистрация через Apple', en: 'Sign up with Apple', kg: 'Apple аркылуу каттоо' },",
      станет: "    'auth.regApple':    { ru: 'Регистрация через Apple', en: 'Sign up with Apple' }," },

    { имя: 'значок Apple нарисован по памяти',
      ждём: 'значок Apple не нарисован по памяти',
      файл: СТР,
      было: '<span class="auth-apple-mark" aria-hidden="true">Apple</span>\n    </button>\n    <button class="auth-social-btn telegram"',
      станет: '<svg viewBox="0 0 24 24"><path d="M12 2c1 2 0 4-1 5"/></svg>\n    </button>\n    <button class="auth-social-btn telegram"' },

    /* ── ОТКАТ НА МОЛЧАНИЕ ──
       Появился ЕЩЁ один сторонний вход, и Apple рядом уже есть. Правило
       ронять нельзя: оно про «есть ли Apple при чужом входе», а не про
       «сколько чужих входов вообще». */
    { имя: 'МОЛЧАНИЕ: добавлен ещё один сторонний вход при живом Apple',
      ждём: null,
      файл: ВХОД,
      было: "  AUTH.loginApple = function() {",
      станет: "  AUTH.loginFacebook = function() {\n    return supabaseClient.auth.signInWithOAuth({ provider: 'facebook' });\n  };\n\n  AUTH.loginApple = function() {" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-apl-'));
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

console.log('\n  ПРУВЕР: ВХОД С APPLE\n');

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
        try { execFileSync('node', ['--check', п], { encoding: 'utf8' }); }
        catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
    }
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        else { console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать'); беда++; }
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

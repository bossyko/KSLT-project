#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ШТОРКА ПРИЛОЖЕНИЯ» (06.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ: английская надпись в СЛОВАРЕ (там она
 * законна — это перевод) и комментарий про класс в чужом файле.
 *
 *   node tools/check-shtorka-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-shtorka.js';
const ДОМ = 'mobile/www/js/kslt-shtorka.js';
const ИГРОК = 'mobile/www/js/screens/player-detail.js';
const СЛОВАРЬ = 'mobile/www/js/i18n.js';
const ОДЕЖДА = 'mobile/www/css/app.css';

const ОТКАТЫ = [
    { имя: 'вернуть сборку шторки руками во второе место',
      ждём: 'шторку собирает один дом',
      файл: ИГРОК,
      было: '    return window.KSLT_SHTORKA.окно({ id: id, заголовок: заголовок, тело: тело, родитель: родитель });',
      станет: "    var у = document.createElement('div'); у.className = 'pd-h2h-modal';\n" +
              '    родитель.appendChild(у); return у;' },

    { имя: 'вписать роль диалога в разметку шторки',
      ждём: 'роль диалога ставит дом окон',
      файл: ДОМ,
      было: "      '<div class=\"pd-h2h-content\"'",
      станет: "      '<div class=\"pd-h2h-content\" role=\"dialog\"'" },

    { имя: 'вернуть открытие по кадру вместо часов',
      ждём: 'класс открытия вешается по часам',
      файл: ДОМ,
      было: "    setTimeout(function () { узел.classList.add('open'); }, 20);",
      станет: "    requestAnimationFrame(function () { узел.classList.add('open'); });" },

    { имя: 'удалять прежнюю шторку, не сняв класс',
      ждём: 'прежняя шторка снимает класс open',
      файл: ДОМ,
      было: "    if (прежнее) { прежнее.classList.remove('open'); прежнее.remove(); }",
      станет: '    if (прежнее) { прежнее.remove(); }' },

    { имя: 'вернуть шторке фон страницы вместо поверхности окна',
      ждём: 'поверхность окна — токен',
      файл: ОДЕЖДА,
      было: '  background: var(--bg-elevated); border-radius: 20px 20px 0 0;',
      станет: '  background: var(--bg); border-radius: 20px 20px 0 0;' },

    { имя: 'вернуть кнопке закрытия 28 пикселей',
      ждём: 'кнопки в окнах не мельче ступени 44',
      файл: ОДЕЖДА,
      было: '  width: 44px; height: 44px; border-radius: 50%;\n  background-clip: padding-box;',
      станет: '  width: 28px; height: 28px; border-radius: 50%;' },

    { имя: 'зашить английский заголовок мимо словаря',
      ждём: 'заголовок личных встреч берётся из словаря',
      файл: ИГРОК,
      было: "    var modal = окно('pdH2HModal', I18N.t('pd.h2h'),",
      станет: "    var modal = окно('pdH2HModal', 'Head-to-Head'," },

    { имя: 'ослепить прибор: пусть читает комментарии как код',
      ждём: 'прибор не принимает комментарий за код',
      файл: ПРИБОР,
      было: "    return т.replace(/\\/\\*[\\s\\S]*?\\*\\//g, ' ').replace(/(^|[^:])\\/\\/[^\\n]*/g, '$1 ');",
      станет: '    return т;' },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: английская надпись живёт в словаре как перевод',
      ждём: null,
      файл: СЛОВАРЬ,
      было: "'pd.h2h':            { ru: 'Личные встречи',      en: 'Head to Head',     kg: 'Жеке жолугушуулар' },",
      станет: "'pd.h2h':            { ru: 'Личные встречи',      en: 'Head-to-Head',     kg: 'Жеке жолугушуулар' }," },

    { имя: 'МОЛЧАНИЕ: класс помянут в комментарии чужого файла',
      ждём: null,
      файл: ИГРОК,
      было: '  function окно(id, заголовок, тело) {',
      станет: "  /* окно собирается домом: className = 'pd-h2h-modal' там */\n" +
              '  function окно(id, заголовок, тело) {' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-shtorka-'));
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

console.log('\n  ПРУВЕР: ШТОРКА ПРИЛОЖЕНИЯ\n');

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
    if (вывод.indexOf('НЕ ТАК') === -1) { console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    else if (вывод.indexOf(о.ждём) === -1) { console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»'); беда++; }
    else console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
}

console.log('');
if (беда) {
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');

#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ОКНО-ВОПРОС ПРИЛОЖЕНИЯ» (05.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Оригиналы не
 * трогаются: «у меня зелёное» ничего не доказывает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Прибор обязан молчать там, где слово
 * `confirm` стоит в комментарии, и там, где оно сидит внутри ключа
 * перевода (`profile.redeemConfirm`): ПРИБОР, ЧИТАЮЩИЙ СОБСТВЕННОЕ
 * ОБЪЯСНЕНИЕ КАК УЛИКУ, кричит волками и его выключают целиком.
 *
 *   node tools/check-okno-vopros-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-okno-vopros.js';
const ДОМ = 'mobile/www/js/kslt-vopros.js';
const ПРОФИЛЬ = 'mobile/www/js/screens/profile.js';
const ТУРНИРЫ = 'mobile/www/js/screens/tournaments.js';
const ОДЕЖДА = 'mobile/www/css/app.css';
const РАЗМЕТКА = 'mobile/www/index.html';

/* Якоря держатся на СОДЕРЖИМОМ — на объявлениях и зовах, которые живут
   в своём месте постоянно, — а не на номерах строк и не на соседях. */
const КНОПКА = '  border: none; border-radius: 999px; padding: 12px 24px;\n' +
               '  min-height: 44px;\n' +
               '  display: inline-flex; align-items: center; justify-content: center;';
const ФОКУС = '.gi-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }';
const УБОРКА = "if (старое) { старое.classList.remove('open'); старое.remove(); }";
const КОРОБКА = '\'<div class="gi-box">\' +';
const ТЕГ = (имя) => {
    const р = new RegExp('<script src="js/' + имя + '\\.js\\?v=\\d+"></script>');
    const м = fs.readFileSync(path.join(КОРЕНЬ, РАЗМЕТКА), 'utf8').match(р);
    if (!м) { console.log('\n  ОСТАНОВ  тега ' + имя + ' в разметке нет\n'); process.exit(1); }
    return м[0];
};
const ПОДКЛЮЧЕНИЕ = ТЕГ('kslt-vopros');
const ЗОВУЩИЙ = ТЕГ('game-invites');

const ОТКАТЫ = [
    { имя: 'вернуть системный confirm в профиль',
      ждём: 'системных окон в приложении нет',
      файл: ПРОФИЛЬ,
      было: "title: I18N.t('profile.redeemTitle'),",
      станет: "title: (confirm('?') ? 'a' : 'b')," },

    { имя: 'вернуть системный alert в турниры',
      ждём: 'системных окон в приложении нет',
      файл: ТУРНИРЫ,
      было: "window.KSLT_VOPROS.сказать(I18N.t('trn.mixedGender'), '');",
      станет: "alert(I18N.t('trn.mixedGender'));" },

    { имя: 'завести второй дом окна в чужом файле',
      ждём: 'дом окна-вопроса один',
      файл: ПРОФИЛЬ,
      было: "title: I18N.t('profile.redeemTitle'),",
      станет: "title: (window.KSLT_VOPROS = window.KSLT_VOPROS || {}) && I18N.t('profile.redeemTitle')," },

    { имя: 'вернуть обёртку под старым именем',
      ждём: 'дом окна-вопроса один',
      файл: ДОМ,
      было: '  global.KSLT_VOPROS = { окно: окно, сказать: сказать };',
      станет: '  global.KSLT_VOPROS = { окно: окно, сказать: сказать };\n' +
              '  global.KSLT_INVITES = global.KSLT_INVITES || {};\n' +
              '  global.KSLT_INVITES.modal = окно;' },

    { имя: 'вписать роль диалога прямо в разметку дома',
      ждём: 'роль диалога ставит дом окон',
      файл: ДОМ,
      было: КОРОБКА,
      станет: '\'<div class="gi-box" role="dialog" aria-modal="true">\' +' },

    { имя: 'удалять прежнее окно, не сняв класс open',
      ждём: 'старое окно снимает класс open',
      файл: ДОМ,
      было: УБОРКА,
      станет: 'if (старое) { старое.remove(); }' },

    { имя: 'снять у кнопки окна пол высоты 44',
      ждём: 'кнопка окна держит цель нажатия 44',
      файл: ОДЕЖДА,
      было: КНОПКА,
      станет: '  border: none; border-radius: 999px; padding: 12px 24px;\n' +
              '  display: inline-flex; align-items: center; justify-content: center;' },

    { имя: 'снять у кнопки окна обводку фокуса',
      ждём: 'кнопка окна держит цель нажатия 44',
      файл: ОДЕЖДА,
      было: ФОКУС,
      станет: '/* обводка фокуса снята */' },

    { имя: 'подключить дом ПОСЛЕ того, кто его зовёт',
      ждём: 'дом подключён раньше тех, кто его зовёт',
      файл: РАЗМЕТКА,
      было: ПОДКЛЮЧЕНИЕ,
      станет: '<!-- дом переставлен прувером -->' },

    { имя: 'ослепить в приборе отличие слова от имени',
      ждём: 'прибор отличает системное окно',
      файл: ПРИБОР,
      было: '    const re = /(^|[^\\w.$-])(confirm|alert|prompt)\\s*\\(/g;',
      станет: '    const re = /(confirm|alert|prompt)\\s*\\(/g;' },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: слово confirm в комментарии',
      ждём: null,
      файл: ПРОФИЛЬ,
      было: "title: I18N.t('profile.redeemTitle'),",
      станет: "// здесь когда-то стоял confirm( и его убрали\n            title: I18N.t('profile.redeemTitle')," },

    { имя: 'МОЛЧАНИЕ: слово confirm внутри ключа перевода',
      ждём: null,
      файл: ПРОФИЛЬ,
      было: "title: I18N.t('profile.redeemTitle'),",
      станет: "title: I18N.t('profile.redeemConfirm')," }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vopros-'));
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

console.log('\n  ПРУВЕР: ОКНО-ВОПРОС ПРИЛОЖЕНИЯ\n');

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

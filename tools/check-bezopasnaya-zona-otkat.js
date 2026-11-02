#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «БЕЗОПАСНАЯ ЗОНА» (02.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Один из них главный: `@supports` обязан
 * остаться разрешённым, иначе прибор потребует убрать вопрос, который
 * нельзя задать иначе, и его снимут целиком вместе с проверкой.
 *
 *   node tools/check-bezopasnaya-zona-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-bezopasnaya-zona.js';
const APP = 'mobile/www/css/app.css';
const ТОКЕНЫ = 'mobile/www/css/tokens.css';

const ОТКАТЫ = [
    { имя: 'величина снова считается на месте',
      ждём: 'в одежде приложения нет своего счёта безопасной зоны',
      файл: APP,
      было: '  padding: var(--safe-top) 12px var(--safe-bottom);',
      станет: '  padding: env(safe-area-inset-top) 12px env(safe-area-inset-bottom);' },

    { имя: 'у панели уведомлений отняли отступ',
      ждём: 'панель уведомлений держит безопасную зону',
      файл: APP,
      было: '  padding-top: var(--safe-top);\n  padding-bottom: var(--safe-bottom);\n  transform: translateX(100%); transition: transform 0.3s ease;',
      станет: '  transform: translateX(100%); transition: transform 0.3s ease;' },

    { имя: 'боковое меню снова прокручивает само себя',
      ждём: 'боковое меню прокручивает внутренний блок, а не себя',
      файл: APP,
      было: '  padding-bottom: var(--safe-bottom);\n  overflow: hidden;\n}\n.menu-scroll {',
      станет: '  padding-bottom: var(--safe-bottom);\n  overflow-y: auto;\n}\n.menu-scroll {' },

    { имя: 'кнопка возврата снова мельче цели нажатия',
      ждём: 'кнопка возврата из уведомлений — цель нажатия 44',
      файл: APP,
      было: '  min-width: 44px; min-height: 44px;',
      станет: '  min-width: 36px; min-height: 36px;' },

    { имя: 'токен безопасной зоны снят',
      ждём: 'величина безопасной зоны определена один раз',
      файл: ТОКЕНЫ,
      было: '--safe-top:    env(safe-area-inset-top, 0px);',
      станет: '--safe-top-pereimenovan: env(safe-area-inset-top, 0px);' },

    { имя: 'прибор перестал вычищать комментарии',
      ждём: 'прибор читает правило, а не подпись к нему',
      файл: ПРИБОР,
      было: "    return (т || '').replace(/\\/\\*[\\s\\S]*?\\*\\//g, ' ');",
      станет: "    return (т || '');" },

    /* ══ ОТКАТЫ НА МОЛЧАНИЕ ══════════════════════════════════════════ */
    { имя: 'МОЛЧАНИЕ: `@supports` спрашивает браузер про env',
      ждём: null,
      файл: APP,
      было: '@supports (padding: env(safe-area-inset-top)) {',
      станет: '@supports (padding: env(safe-area-inset-top)) {\n  /* вопрос браузеру, а не величина */' },

    { имя: 'МОЛЧАНИЕ: env упомянут в подписи к правилу',
      ждём: null,
      файл: APP,
      было: '  padding-top: var(--safe-top);\n  padding-bottom: var(--safe-bottom);\n  transform: translateX(100%); transition: transform 0.3s ease;',
      станет: '  /* прежде тут стоял env(safe-area-inset-top) */\n' +
              '  padding-top: var(--safe-top);\n  padding-bottom: var(--safe-bottom);\n  transform: translateX(100%); transition: transform 0.3s ease;' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-zona-'));
    for (const о of ['mobile/www/css', 'tools']) {
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

console.log('\n  ПРУВЕР: БЕЗОПАСНАЯ ЗОНА\n');

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

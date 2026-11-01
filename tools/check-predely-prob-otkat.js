#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «ПРЕДЕЛ ТЕСТА БОЛЬШЕ СУММЫ ОЖИДАНИЙ» (01.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Оригиналы не
 * трогаются: «у меня зелёное» ничего не доказывает.
 *
 * ДВА ОТКАТА — НА МОЛЧАНИЕ. Прибор, который падает всегда, не отличает
 * тесную пробу от свободной: «ноль тесных мест» тогда ничего не значит.
 *
 *   node tools/check-predely-prob-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ТЕСНАЯ = 'tests/e2e/design-system/149-polosa-nazhatiya.spec.js';
const ПРИБОР = 'tools/check-predely-prob.js';

const ОТКАТЫ = [
    { имя: 'отнять у тесной пробы её предел',
      ждём: 'предел пробы больше суммы её именованных ожиданий',
      файл: ТЕСНАЯ,
      было: '            test.setTimeout(75000);',
      станет: '            /* предела нет */' },

    { имя: 'понизить предел ровно до суммы — границы мало',
      ждём: 'предел пробы больше суммы её именованных ожиданий',
      файл: ТЕСНАЯ,
      было: '            test.setTimeout(75000);',
      станет: '            test.setTimeout(65000);' },

    /* ОТКАТ НА МОЛЧАНИЕ: предел больше суммы ровно на единицу — этого
       ДОСТАТОЧНО, и прибор обязан молчать. Правило говорит «больше», а не
       «с запасом в полтора раза»: запас — дело живого прогона, а не
       прибора. */
    { имя: 'МОЛЧАНИЕ: предел больше суммы на единицу',
      ждём: null,
      файл: ТЕСНАЯ,
      было: '            test.setTimeout(75000);',
      станет: '            test.setTimeout(65001);' },

    { имя: 'тело пробы считать от первой скобки, а не от стрелки',
      ждём: 'прибор читает пробы, а не всё подряд со словом test',
      файл: ПРИБОР,
      было: `        const стрелка = т.indexOf('=>', м.index);
        if (стрелка === -1) continue;
        const i = т.indexOf('{', стрелка);`,
      станет: `        const стрелка = м.index;
        if (стрелка === -1) continue;
        const i = т.indexOf('{', стрелка);` },

    { имя: 'снять с признака пробы запрет точки слева',
      ждём: 'прибор читает пробы, а не всё подряд со словом test',
      файл: ПРИБОР,
      было: '    const re = /(?<![.\\w$])test\\(/g;',
      станет: '    const re = /\\btest\\(/g;' },

    { имя: 'зашить предел по умолчанию вторым числом',
      ждём: 'предел по умолчанию взят из конфига, а не зашит',
      файл: 'playwright.config.js',
      было: '    timeout: 30000,',
      станет: '    testTimeoutPereimenovan: 30000,' }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-predely-'));
    for (const о of ['tests', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    fs.copyFileSync(path.join(КОРЕНЬ, 'playwright.config.js'),
                    path.join(к, 'playwright.config.js'));
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПРЕДЕЛЫ ПРОБ\n');

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

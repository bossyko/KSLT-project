#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ ПРАВИЛ КЛУБА (заведён 07.11, кусок «полнота прогона»).
 *
 * `tools/check-rules.js` стоит с весны и до 07.11 жил БЕЗ ПРУВЕРА и ВНЕ
 * общего прогона. Он сам об этом и написал: «этот сторож НЕ ВХОДИЛ в
 * check-vse.js, то есть его падение никто не видел» — а внутри него
 * тогда лежала проверка версий, падавшая НА ПРАВИЛЬНОМ КОДЕ, и это
 * обнаружилось случайно, куском 197.
 *
 * ЧТО ЗДЕСЬ НЕ ПРОВЕРЯЕТСЯ И ПОЧЕМУ НАЗВАНО. Линтерная часть сторожа
 * (храповик числа находок) откатами не трогается: в песочнице нет
 * `node_modules`, и сторож честно печатает «линтер не установлен»,
 * пропуская эту часть. Откатывать её значило бы ставить в песочницу весь
 * `node_modules` ради одного правила — цена больше пользы, а сам храповик
 * гоняется общим прогоном на живом дереве.
 *
 * Корень сторож берёт из `__dirname/..`, поэтому запускается КОПИЯ из
 * песочницы.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
  { имя: 'копии дома правил разошлись',
    ждём: 'сайт и приложение разошлись',
    действие: (к) => {
        const п = path.join(к, 'mobile/www/js/kslt-rules.js');
        if (!fs.existsSync(п)) return false;
        fs.appendFileSync(п, '\n/* уехало */\n');
        return true;
    } },

  { имя: 'в приложении не стало копии общего файла',
    ждём: 'в приложении нет копии',
    действие: (к) => {
        const п = path.join(к, 'mobile/www/js/tournament-slots.js');
        if (!fs.existsSync(п)) return false;
        fs.rmSync(п);
        return true;
    } },

  { имя: 'в витрине завёлся свой список женских разрядов',
    ждём: 'свой список женских разрядов',
    действие: (к) => {
        const п = path.join(к, 'js/players.js');
        if (!fs.existsSync(п)) return false;
        fs.writeFileSync(п,
            "var WOMEN_CATEGORIES = ['masters', 'tour', 'futures'];\n" +
            fs.readFileSync(п, 'utf8'));
        return true;
    } }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-rules-'));
    for (const о of ['js', 'mobile/www', 'tools']) {
        const и = path.join(КОРЕНЬ, о);
        if (fs.existsSync(и)) fs.cpSync(и, path.join(к, о), { recursive: true });
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-rules.js')], { encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПРАВИЛА КЛУБА\n');
let беда = 0;
{
    const к = копия();
    const в = прогон(к);
    if (!/Правила в порядке/.test(в)) {
        console.log('  ✗ песочница красная ДО откатов — прувер ничего не докажет:');
        console.log(в.split('\n').slice(-12).map(с => '    ' + с).join('\n'));
        беда++;
    }
    fs.rmSync(к, { recursive: true, force: true });
}

for (const о of ОТКАТЫ) {
    const к = копия();
    let вышло = false;
    try { вышло = о.действие(к); } catch (e) { вышло = false; }
    if (!вышло) {
        console.log('  ✗ ' + о.имя + ' — ОТКАТ НЕ ПРИМЕНИЛСЯ (нет файла?)');
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    const в = прогон(к);
    if (в.indexOf(о.ждём) !== -1) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    fs.rmSync(к, { recursive: true, force: true });
}

console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }

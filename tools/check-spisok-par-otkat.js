#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ «СПИСОК ПАР ПОЛОН». Работает на КОПИИ.
 *
 * Прувер берёт копию `tools/`, возвращает в неё прежнее значение и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ, А НЕ НА ПОЛОЖЕНИИ: порча идёт по именам
 * файлов и по строке `const КУСКИ = [`, которые живут в бегунке постоянно.
 * Числа в якорях не стоят НИГДЕ — на них этот прувер уже спотыкался в двух
 * других местах 04.11.
 *
 *   node tools/check-spisok-par-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-spisok-'));

/* Копируется ТОЛЬКО `tools/` — больше правилу ничего не нужно: оно читает
   список пар и имена файлов в той же папке. */
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
for (const ф of fs.readdirSync(path.join(КОРЕНЬ, 'tools'))) {
    const ист = path.join(КОРЕНЬ, 'tools', ф);
    if (!fs.statSync(ист).isFile()) continue;
    fs.copyFileSync(ист, path.join(песок, 'tools', ф));
}

const ПРАВИЛО = path.join(песок, 'tools', 'check-spisok-par.js');
const БЕГУНОК = 'tools/check-vse.js';
const СВОЙ = 'tools/check-spisok-par.js';

function прогон() {
    const з = spawnSync(process.execPath, [ПРАВИЛО],
        { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}
function чит(отн) { return fs.readFileSync(path.join(песок, отн), 'utf8'); }
function пиши(отн, т) { fs.writeFileSync(path.join(песок, отн), т); }
function вернуть(отн) {
    fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн));
}

console.log('\n  ПРУВЕР: СПИСОК ПАР ПОЛОН\n');

const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят\n' + база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

/* ── ОТКАТЫ ────────────────────────────────────────────────────────────
   Каждый — это ПРЕЖНЕЕ состояние, то есть беда, которая однажды была. */
const ОТКАТЫ = [

/* 04.11: ровно это и лежало на диске — пара есть, в списке её нет. */
['выкинуть пару из списка — как было с двадцатью', () => {
    const т = чит(БЕГУНОК);
    const м = т.match(/\n\s*\['[^']*',\s*\n?\s*'check-zhaloby-i-blokirovki\.js',\s*'check-zhaloby-i-blokirovki-otkat\.js'\],?/);
    if (!м) return 'якорь пары «жалобы и блокировки» не найден в ' + БЕГУНОК;
    пиши(БЕГУНОК, т.replace(м[0], ''));
    return null;
}, 'каждый прувер с диска стоит в списке'],

/* 04.11: `check-znachki` стояла в списке дважды, под двумя именами. */
['поставить одну пару дважды', () => {
    const т = чит(БЕГУНОК);
    const м = т.match(/\n(\s*)\['[^']*',\s*\n?\s*'check-znachki\.js',\s*'check-znachki-otkat\.js'\],/);
    if (!м) return 'якорь пары «значки» не найден в ' + БЕГУНОК;
    пиши(БЕГУНОК, т.replace(м[0],
        м[0] + '\n' + м[1] + "['значки — вторая запись',\n" + м[1] +
        " 'check-znachki.js', 'check-znachki-otkat.js'],"));
    return null;
}, 'в списке нет двух записей на один кусок'],

/* Пара ссылается в пустоту: файл переименовали, список отстал. */
['увести пару на файл, которого нет', () => {
    const т = чит(БЕГУНОК);
    if (т.split("'check-header-otkat.js'").length - 1 < 1) return 'якорь не найден';
    пиши(БЕГУНОК, т.replace("'check-header-otkat.js'", "'check-header-otkata.js'"));
    return null;
}, 'у каждой пары оба файла на диске'],

/* Сторож завёлся без прувера и без записи в поимённый список. */
['завести сторожа без пары', () => {
    fs.writeFileSync(path.join(песок, 'tools', 'check-novyy-storozh.js'),
        '#!/usr/bin/env node\nprocess.exit(0);\n');
    return null;
}, 'у каждого сторожа есть пара, кроме названных'],

/* Разрешение пережило свой файл. */
['оставить в разрешении имя, которого нет на диске', () => {
    const т = чит(СВОЙ);
    if (т.indexOf("    'check-shkala.js'") === -1) return 'якорь разрешения не найден';
    пиши(СВОЙ, т.replace("    'check-shkala.js'",
        "    'check-shkala.js',\n    'check-ushedshiy-storozh.js'"));
    return null;
}, 'поимённый список без прувера не отстал от диска'],

/* ПРИБОР СЛОМАН — правило обязано сказать это ПЕРЕД остальными сверками,
   а не замолчать на пустом списке. */
['сломать разбор списка в бегунке', () => {
    const т = чит(БЕГУНОК);
    if (т.indexOf('const КУСКИ = [') === -1) return 'якорь списка не найден';
    пиши(БЕГУНОК, т.replace('const КУСКИ = [', 'const КУСКИ_ИНОЕ = ['));
    return null;
}, 'список пар читается из бегунка']

];

let плохо = 0;
for (const [имя, портить, ждём] of ОТКАТЫ) {
    const беда = портить();
    if (беда) {
        console.log('  ✗ ' + имя + '  ->  порча не применилась: ' + беда);
        плохо++;
        вернуть(БЕГУНОК); вернуть(СВОЙ);
        continue;
    }
    const р = прогон();
    const упало = р.код !== 0 && р.вывод.indexOf(ждём) !== -1;
    console.log((упало ? '  v ' : '  ✗ ') + имя + '  ->  ' +
        (упало ? '«' + ждём + '»'
               : 'ждали «' + ждём + '», а получили:\n' + р.вывод));
    if (!упало) плохо++;
    вернуть(БЕГУНОК); вернуть(СВОЙ);
    fs.rmSync(path.join(песок, 'tools', 'check-novyy-storozh.js'), { force: true });
}

console.log('');
if (плохо) console.log('  НЕ ТАК  ' + плохо + ' откатов не доказали ничего\n');
else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили ИМЕННО своё правило');
    console.log('          оригиналы не трогались — работа шла на копии\n');
}
fs.rmSync(песок, { recursive: true, force: true });
process.exitCode = плохо ? 1 : 0;

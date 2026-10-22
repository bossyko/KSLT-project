/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА БЕЙДЖА АДМИНКИ. На КОПИИ.
 *
 * Откаты возвращают все четыре беды куска — включая ту, что я завёл сам:
 * два имени на один тон.
 *
 *   node tools/check-badge-tona-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-badge-'));
['js', 'tools', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const CSS = 'css/admin.css', BR = 'js/admin/sections/bracket.js',
      CH = 'js/admin/sections/challenges.js';
const ФАЙЛЫ = [CSS, BR, CH];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-badge-tona.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. вернуть имя по цвету в css */
    ['вернуть имя по цвету в css', CSS,
     '.ad-badge-success {',
     '.ad-badge-green {',
     'ни один бейдж не назван по цвету'],

    /* 2. вернуть зов по цвету в js */
    /* ЯКОРЬ УНИКАЛЕН: `ad-badge-success` встречается в challenges.js ТРИ
       раза, и прувер это поймал — откат на неуникальном якоре доказывает
       везение, а не правило. Берём строку с её соседом. */
    ['вернуть зов по цвету в js', CH,
     "'<span class=\"ad-badge ad-badge-success\">' + L.chalCompleted",
     "'<span class=\"ad-badge ad-badge-green\">' + L.chalCompleted",
     'ни один бейдж не назван по цвету'],

    /* 3. ВТОРОЕ ИМЯ НА ТОТ ЖЕ ТОН — беда, которую я завёл сам */
    ['завести второе имя на тот же тон', CSS,
     '.ad-badge-info {',
     '.ad-badge-err {\n    background: var(--danger-subtle);\n    color: var(--danger);\n}\n\n.ad-badge-info {',
     'один тон — одно имя'],

    /* 4. зов в пустоту — бейдж рисуется серым */
    ['завести зов в пустоту', BR,
     "'<span class=\"ad-badge ad-badge-success\">' + L.schedStDone + '</span>'",
     "'<span class=\"ad-badge ad-badge-gotovo\">' + L.schedStDone + '</span>'",
     'ни один зовущийся бейдж не бьёт в пустоту'],

    /* 5. поднять модификатор ВЫШЕ базового — он умирает по каскаду */
    ['поднять модификатор выше базового класса', CSS,
     '.ad-badge {\n    font-size: var(--fs-xs);',
     '.ad-badge-proba { background: var(--info-subtle); color: var(--info); }\n.ad-badge {\n    font-size: var(--fs-xs);',
     'все модификаторы объявлены ниже базового класса'],

    /* 5б. ВЕРНУТЬ РАЗМЕР НА ПРЕЖНЕЕ МЕСТО — беда, которую нашёл замер.
       Откат ставит `-sm` обратно выше базового: правило обязано упасть
       именно на положении, а не на чём-то ещё. */
    ['вернуть размер на прежнее место — выше базового', CSS,
     ['.ad-badge-sm { font-size: var(--fs-2xs); }\n',
      '.ad-badge {\n    font-size: var(--fs-xs);'],
     ['',
      '.ad-badge-sm { font-size: var(--fs-2xs); }\n\n.ad-badge {\n    font-size: var(--fs-xs);'],
     'все модификаторы объявлены ниже базового класса'],

    /* 5в. вернуть вложенный повтор базового кегля — ловушка для `-sm` */
    ['вернуть вложенный повтор кегля', CSS,
     '.ad-badge {\n    font-size: var(--fs-xs);',
     '.ad-reg-section-title .ad-badge {\n    font-size: var(--fs-xs);\n}\n\n.ad-badge {\n    font-size: var(--fs-xs);',
     'базовый кегль не повторяется вложенным селектором'],

    /* 7. сбить кегль базового бейджа с токена на число */
    /* Решение Кости 21.10 — оставить 12/400/22 — заморожено ОТКАТОМ, а не
       комментарием: если кегль однажды напишут числом, правило упадёт. */
    ['сбить кегль базового бейджа на число', CSS,
     '.ad-badge {\n    font-size: var(--fs-xs);',
     '.ad-badge {\n    font-size: 12px;',
     'лестница базового бейджа стоит на ступенях'],

    /* 8. задать бейджу вес — он должен наследоваться */
    ['задать базовому бейджу вес', CSS,
     '.ad-badge {\n    font-size: var(--fs-xs);',
     '.ad-badge {\n    font-weight: var(--fw-medium);\n    font-size: var(--fs-xs);',
     'лестница базового бейджа стоит на ступенях'],

    /* 6б. ОБЪЯВИТЬ ТОН, КОТОРОГО НИКТО НЕ ЗОВЁТ — обратная сторона шва.
       `.ad-badge-accent` прожил так до 22.10 и был найден уборкой мёртвых
       классов, а не правилом о зове в пустоту. */
    ['объявить тон без зова', CSS,
     '.ad-badge-info {',
     '.ad-badge-nikto { background: var(--info-subtle); color: var(--info); }\n\n.ad-badge-info {',
     'ни один объявленный тон не стоит без зова'],

    /* 6. объявить одно имя дважды — столкновение понятий */
    ['объявить одно имя дважды', CSS,
     '.ad-badge-info {',
     '.ad-badge-info { background: transparent; }\n\n.ad-badge-info {',
     'у каждого имени бейджа ровно одно определение']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правила падают на ЧИСТОМ коде — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
/* ОТКАТ ПЕРЕНОСА — ЭТО ДВЕ ПРАВКИ, А НЕ ОДНА. Снятие строки с нового места
   и возврат её на старое по отдельности НЕ ВОССТАНАВЛИВАЮТ беду: удаление
   модификатора положения не нарушает. Поэтому `что`/`на` могут быть
   списками пар — каждый якорь всё равно проверяется на единственность. */
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const пары = Array.isArray(что) ? что.map((з, i) => [з, на[i]]) : [[что, на]];
    let текст = исходник[ф], плохойЯкорь = null;
    for (const [з, п] of пары) {
        const n = текст.split(з).length - 1;
        if (n !== 1) { плохойЯкорь = 'якорь встречается ' + n + ' раз в ' + ф; break; }
        текст = текст.replace(з, п);
    }
    if (плохойЯкорь) {
        console.log('  ? ' + имя + '  ->  ' + плохойЯкорь);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: текст });
    прогон(null);
    if (!р.упало) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
});
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
} else {
    console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exitCode = 1;
}

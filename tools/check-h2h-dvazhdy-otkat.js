/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ОКНО H2H В ДВУХ КОПИЯХ» (кусок 185). На КОПИИ.
 *   node tools/check-h2h-dvazhdy-otkat.js
 *
 * «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ. Каждый откат возвращает ОДНО
 * прежнее значение и обязан уронить ИМЕННО то правило, которое за него
 * отвечает. Якоря держатся на СОДЕРЖИМОМ блока, а не на номере строки.
 *
 * Откат умеет править СРАЗУ НЕСКОЛЬКО файлов: иначе правило «обе копии
 * говорят одно и то же» невозможно проверить отдельно от правила «краска
 * названа именем» — одна правка роняет оба, и доказательство размывается.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-h2h-'));
['css', 'js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const PL = 'css/player.css', DB = 'css/dashboard.css', PLS = 'css/players.css',
      JPL = 'js/player.js';
const ФАЙЛЫ = [PL, DB, PLS, JPL];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правки) {
    const карта = {};
    (правки || []).forEach(([ф, что, на]) => {
        карта[ф] = (карта[ф] === undefined ? исходник[ф] : карта[ф]).replace(что, на);
    });
    ФАЙЛЫ.forEach(ф => fs.writeFileSync(path.join(песок, ф),
        карта[ф] === undefined ? исходник[ф] : карта[ф]));
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-h2h-dvazhdy.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['завести третью копию понятия в чужом файле',
     [[PLS, '.pl-change-down {', '.h2h-zaraza { color: #fff; }\n.pl-change-down {']],
     'у понятия H2H ровно два дома в css'],

    ['переименовать роль «победа» в странице игрока',
     [[PL, '.h2h-match-result.win {', '.h2h-match-result.pobeda {']],
     'роль «победа и проигрыш» стоит в обоих домах'],

    ['переименовать роль «проигрыш» в кабинете',
     [[DB, '.h2h-match-result.loss { background: var(--danger-subtle)',
           '.h2h-match-result.proigrysh { background: var(--danger-subtle)']],
     'роль «победа и проигрыш» стоит в обоих домах'],

    /* Число в ОБЕИХ копиях разом: копии согласны между собой, и правило
       равенства остаётся зелёным — падает ровно правило имени. */
    ['вернуть краску роли числом СРАЗУ В ОБЕИХ копиях',
     [[PL, '.h2h-match-result.loss {\n    background: var(--danger-subtle);\n    color: var(--danger);',
           '.h2h-match-result.loss {\n    background: rgba(255, 71, 87, 0.15);\n    color: #FF4757;'],
      [DB, '.h2h-match-result.loss { background: var(--danger-subtle); color: var(--danger); }',
           '.h2h-match-result.loss { background: rgba(255, 71, 87, 0.15); color: #FF4757; }']],
     'краска роли названа именем, а не числом'],

    /* Другой ТОКЕН в одной копии: имя на месте, чужих красок нет —
       падает ровно правило равенства копий. */
    ['развести копии роли разными токенами',
     [[DB, '.h2h-match-result.loss { background: var(--danger-subtle); color: var(--danger); }',
           '.h2h-match-result.loss { background: var(--danger-subtle); color: var(--danger-hover); }']],
     'обе копии роли говорят одно и то же'],

    ['вернуть литерал #1a1a1a фоном окна в кабинете',
     [[DB, '.h2h-modal {\n    background: var(--neutral-800);',
           '.h2h-modal {\n    background: #1a1a1a;']],
     'фон окна назван одним токеном в обеих копиях'],

    ['развести копии роли фоном, оставив краску текста общей',
     [[DB, '.h2h-match-result.win { background: var(--success-subtle); color: var(--success); }',
           '.h2h-match-result.win { background: var(--success-faint); color: var(--success); }']],
     'обе копии роли говорят одно и то же'],

    /* Свойство добавляется селектору, который УЖЕ расходится: число
       расхождений растёт на один, число совпавших не меняется. */
    ['развести копии ещё на одно свойство',
     [[DB, '.h2h-name {\n    font-size: var(--fs-sm);',
           '.h2h-name {\n    letter-spacing: 0.01em;\n    font-size: var(--fs-sm);']],
     'копии не расходятся дальше замеренного'],

    /* Совпадавший селектор уходит из общих: совпавших меньше, а
       расхождений столько же — падает ровно нижнее правило. */
    ['увести совпадавший селектор из общих',
     [[DB, '.h2h-overlay.visible { opacity: 1; }', '.h2h-overlay.vidno { opacity: 1; }']],
     'совпавших знак в знак не становится меньше'],

    ['отнять у страницы игрока рисование окна',
     [[JPL, "overlay.className = 'h2h-overlay';\n        // ОКНО НАЗЫВАЕТ СЕБЯ ОКНОМ",
            "overlay.className = 'h2h-okno';\n        // ОКНО НАЗЫВАЕТ СЕБЯ ОКНОМ"],
      [JPL, "overlay.className = 'h2h-overlay';\n        overlay.setAttribute('role', 'dialog');\n        overlay.setAttribute('aria-modal', 'true');\n        overlay.setAttribute('aria-label', заголовок);",
            "overlay.className = 'h2h-okno';\n        overlay.setAttribute('role', 'dialog');\n        overlay.setAttribute('aria-modal', 'true');\n        overlay.setAttribute('aria-label', заголовок);"]],
     'окно H2H рисуют ровно два дома'],

    ['вернуть зелёный iOS в кабинет',
     [[DB, '.h2h-val-right { text-align: right; color: var(--text-primary); }',
           '.h2h-val-right { text-align: right; color: #34c759; }']],
     'чужие краски не вернулись в блоки H2H'],

    ['вернуть зелёный Tailwind на страницу игрока',
     [[PL, '.h2h-val-left {', '.h2h-val-left { color: #22c55e; }\n.h2h-val-levyy {']],
     'чужие краски не вернулись в блоки H2H']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правила падают на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит\n');

let плохих = 0;
ОТКАТЫ.forEach(([имя, правки, ждём]) => {
    let беда = '';
    правки.forEach(([ф, что]) => {
        const сколько = исходник[ф].split(что).length - 1;
        if (сколько === 0) беда = 'якоря нет в ' + ф;
        else if (сколько !== 1) беда = 'якорь встречается ' + сколько + ' раз в ' + ф;
    });
    if (беда) { console.log('  ? ' + имя + '  ->  ' + беда); плохих++; return; }
    const р = прогон(правки);
    прогон(null);
    if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
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

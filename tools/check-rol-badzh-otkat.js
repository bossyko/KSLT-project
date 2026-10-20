/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА БЕЙДЖА РОЛИ. На КОПИИ.
 *
 * Каждый откат возвращает ОДНУ из четырёх форм, что жили до 19.10:
 * копию в admin.css, высоту числом, border вместо внутренней тени,
 * роль без своей краски, красного админа, инлайн в users.js и боковую
 * панель, красящую любую роль лаймом.
 *
 * ЯКОРЬ ДЕРЖИТСЯ НА СОДЕРЖИМОМ БЛОКА, а не на соседе и не на номере
 * строки: номер стареет, сосед уезжает. Проверено 19.10 дважды.
 *
 *   node tools/check-rol-badzh-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-badzh-'));
['js', 'tools', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ST = 'css/style.css', AD = 'css/admin.css', DB = 'css/dashboard.css',
      LY = 'js/admin/core/layout.js', US = 'js/admin/sections/users.js',
      DJ = 'js/dashboard.js';
const ФАЙЛЫ = [ST, AD, DB, LY, US, DJ];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-rol-badzh.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. второе определение того же понятия — ровно беда, которую чиним */
    ['завести второе определение бейджа роли', ST,
     '.kslt-role {\n    display: inline-flex;',
     '.kslt-role {\n    letter-spacing: 1px;\n}\n\n.kslt-role {\n    display: inline-flex;',
     'определение бейджа роли стоит в style.css, и ровно одно'],

    /* 2. вернуть копию в admin.css */
    ['вернуть admin.css свою копию бейджа роли', AD,
     '/* БЕЙДЖ РОЛИ ЖИВЁТ В style.css',
     '.ad-role-badge-admin { background: var(--alpha-lime-12); color: var(--accent); }\n\n/* БЕЙДЖ РОЛИ ЖИВЁТ В style.css',
     'своих копий бейджа роли в admin.css и dashboard.css нет'],

    /* 3. вернуть боковой панели кабинета её краску и кегль */
    ['вернуть боковой панели кабинета краску и кегль', DB,
     '.db-sidebar-role {\n    margin-top: var(--space-2);',
     '.db-sidebar-role {\n    margin-top: var(--space-2);\n    font-size: var(--fs-2xs);\n    background: var(--alpha-lime-12);',
     'своих копий бейджа роли в admin.css и dashboard.css нет'],

    /* 4. высота числом вместо имени */
    ['написать высоту бейджа числом вместо --chip-h', ST,
     '    min-height: var(--chip-h);\n    padding: 0 var(--space-2);',
     '    min-height: 24px;\n    padding: 0 var(--space-2);',
     'высота, кегль и вес бейджа роли названы именами, а не числами'],

    /* 5. вес числом */
    ['написать вес бейджа числом вместо --fw-medium', ST,
     '    font-weight: var(--fw-medium);\n    letter-spacing: 0.5px;',
     '    font-weight: 500;\n    letter-spacing: 0.5px;',
     'высота, кегль и вес бейджа роли названы именами, а не числами'],

    /* 6. border вместо внутренней тени — это +2px к высоте */
    ['вернуть border вместо внутренней тени у менеджера', ST,
     '    color: var(--role-manager);\n    box-shadow: inset 0 0 0 var(--bw-hair) var(--role-manager-border);',
     '    color: var(--role-manager);\n    border: var(--bw-hair) solid var(--role-manager-border);',
     'обводка бейджа роли — внутренняя тень, а не border'],

    /* 7. роль «игрок» без своей краски — как было в инлайне */
    ['оставить роль «игрок» без своей краски', ST,
     '.kslt-role-player {\n    background: var(--info-subtle);\n    color: var(--info);',
     '.kslt-role-player {\n    box-shadow: none;\n    opacity: 1;',
     'каждая из четырёх ролей названа своей краской'],

    /* 8. админ красным — то, что стояло в users.js до 19.10 */
    ['покрасить админа краской опасности', ST,
     '.kslt-role-admin {\n    background: var(--alpha-lime-12);\n    color: var(--accent);',
     '.kslt-role-admin {\n    background: var(--danger-subtle);\n    color: var(--danger);',
     'админ назван акцентом, а не краской опасности'],

    /* 9. вернуть инлайн в users.js */
    ['вернуть инлайн бейджа роли в users.js', US,
     "var roleBadge = '<span class=\"kslt-role kslt-role-' + (u.role || 'user') + '\">' + roleLabel + '</span>';",
     "var roleColor = u.role === 'admin' ? 'var(--danger)' : 'var(--text-secondary)';\n            var roleBadge = '<span style=\"font-size:var(--fs-xs);color:' + roleColor + ';\">' + roleLabel + '</span>';",
     'роль в разметке зовётся классом, а не инлайном'],

    /* 10. боковая панель админки снова красит любую роль лаймом.
       ЯКОРЬ НА СОДЕРЖИМОМ: подстановка роли, а не класс положения —
       класс .ad-sidebar-role остаётся на месте и в откате. */
    ['вернуть боковой панели админки лайм для любой роли', LY,
     "'<div class=\"kslt-role kslt-role-' + (profile.role || 'user') + ' ad-sidebar-role\">'",
     "'<div class=\"kslt-role kslt-role-admin ad-sidebar-role\">'",
     'боковые панели подставляют роль, а не красят любую лаймом'],

    /* 11. то же в кабинете */
    ['вернуть боковой панели кабинета лайм для любой роли', DJ,
     "'<div class=\"kslt-role kslt-role-' + profile.role + ' db-sidebar-role\">'",
     "'<div class=\"kslt-role kslt-role-admin db-sidebar-role\">'",
     'боковые панели подставляют роль, а не красят любую лаймом']
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
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const n = исходник[ф].split(что).length - 1;
    if (n !== 1) {
        console.log('  ? ' + имя + '  ->  якорь встречается ' + n + ' раз в ' + ф);
        плохих++; return;
    }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
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

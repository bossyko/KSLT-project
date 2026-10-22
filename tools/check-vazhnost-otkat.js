/**
 * ДОКАЗАТЕЛЬСТВО ХРАПОВИКА ВАЖНОСТИ. На КОПИИ.
 *
 * Откаты добавляют важность там, где её не было, и УБИРАЮТ там, где она
 * обязательна. Второе важнее первого: потолок ловит прибавление, минимум —
 * исчезновение нужного, и без обоих храповик держал бы половину.
 *
 *   node tools/check-vazhnost-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vazh-'));
['js', 'tools', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ST = 'css/style.css', TK = 'css/tokens.css', AD = 'css/admin.css',
      BR = 'js/admin/sections/bracket.js', TD = 'css/tournament-detail.css',
      UT = 'js/admin/core/utils.js';
const ФАЙЛЫ = [ST, TK, AD, BR, TD, UT];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-vazhnost.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЬ НА СОДЕРЖИМОМ БЛОКА. Номер строки стареет, сосед уезжает — за эту
   сессию на том попались тринадцать чужих откатов и два моих. */
const ОТКАТЫ = [
    ['прибавить важность в обычном правиле', ST,
     '.kslt-role {\n    display: inline-flex;',
     '.kslt-role {\n    display: inline-flex !important;',
     'важностей в css не больше замеренного'],

    ['прибавить важность, перебивающую наше же правило', AD,
     '.ad-sidebar-role {\n    margin-top: var(--space-2);',
     '.ad-sidebar-role {\n    margin-top: var(--space-2) !important;',
     'важностей «свой css» не больше замеренного'],

    /* УБРАТЬ НУЖНОЕ. Отказ от движения без важности проигрывает любому
       правилу с анимацией — и экран поедет у того, кто просил покоя. */
    ['снять важность у отказа от движения', TK,
     'animation-iteration-count: 1 !important',
     'animation-iteration-count: 1',
     'отказ от движения держится важностью, и её не убавилось'],

    ['снять важность у второго правила отказа от движения', TK,
     'scroll-behavior: auto !important',
     'scroll-behavior: auto',
     'отказ от движения держится важностью, и её не убавилось'],

    /* ВЕРНУТЬ ВАЖНОСТЬ, КОТОРАЯ НЕ ПЕРЕБИВАЕТ НИЧЕГО. Одна из двадцати,
       снятых 21.10: другого объявления `text-align` на этот элемент нет
       ни в css, ни инлайном. Потолок такого не ловит — он считает число. */
    /* ЯКОРЬ ПЕРЕВЯЗАН 22.10: `.td-rr-player-header` снят куском 117 как
       мёртвый — круговая на странице турнира переписана на `td-grp-*`.
       Берём живую шапку заявок: у неё `text-align: left` тоже без
       конкурента, и смысл отката тот же. */
    ['вернуть важность без конкурента', TD,
     '.td-reg-table th,\n.td-reg-table td {\n    padding: 8px 6px;\n    border-bottom: var(--bw-hair) solid var(--border-subtle);\n    font-size: var(--fs-sm);\n    text-align: left;',
     '.td-reg-table th,\n.td-reg-table td {\n    padding: 8px 6px;\n    border-bottom: var(--bw-hair) solid var(--border-subtle);\n    font-size: var(--fs-sm);\n    text-align: left !important;',
     'ни одна важность «свой css» не стоит без конкурента'],

    /* ВЕТКА «КОНКУРЕНТ — ИНЛАЙН» ОТКАТОМ СЕГОДНЯ НЕ ДОКАЗЫВАЕТСЯ, И Я ЭТО
       ГОВОРЮ, А НЕ ВЕШАЮ ПРОВЕРКУ, КОТОРАЯ НЕ МОЖЕТ УПАСТЬ.
       Замер 21.10 с ВЫКЛЮЧЕННЫМ знанием об инлайне: беспризорных НОЛЬ, то
       есть у каждой из 50 важностей есть конкурент В CSS, и инлайн ни в
       одном месте не решает вердикт. Доказать ветку можно было бы только
       снятием И css-конкурента, И инлайна разом — это две правки, а этот
       прувер применяет одну.
       Ветка оставлена: она сторожит БУДУЩЕЕ — первую важность, которая
       будет держаться только инлайном. Пробовать было чем: откат
       «снять инлайн» сказал «якорь встречается 2 раза» и НАШЁЛ ДУБЛИКАТ —
       тот же инлайн чекбокса написан дважды, для `.ad-bulk-all` (строка 30)
       и `.ad-bulk-item` (149). Записано в находки.
       НЕДОКАЗАННАЯ ВЕТКА ПРАВИЛА — ЭТО ДОЛГ, А НЕ ЗЕЛЁНЫЙ СВЕТ. */

    ['прибавить важность в js', BR,
     "'.ad-retired-btn.active{background:var(--accent) !important;",
     "'.ad-retired-btn.active{background:var(--accent) !important;color:red !important;",
     'важностей в js не больше замеренного']
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

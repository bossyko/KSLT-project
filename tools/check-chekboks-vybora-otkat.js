/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ЧЕКБОКСА МАССОВОГО ВЫБОРА. На КОПИИ.
 *   node tools/check-chekboks-vybora-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-chek-'));
['js', 'tools', 'maket', 'css'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/admin/core/utils.js', CT = 'js/admin/sections/courts.js',
      US = 'js/admin/sections/users.js', SP = 'js/admin/sections/sponsors.js',
      СТЕНД = 'maket/chekboks-zamer.html';
const ФАЙЛЫ = [ДОМ, CT, US, SP, СТЕНД];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-chekboks-vybora.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть кортам свою разметку чекбокса', CT,
     "                        A.bulkCheckboxTd(c.id, { rowspan: rowCount }) +",
     "                        '<td class=\"ad-bulk-cell\"><input type=\"checkbox\" class=\"ad-bulk-item\" data-bulk-id=\"' + c.id + '\"></td>' +",
     'разметку чекбокса выдаёт только дом'],

    ['вернуть пользователям инлайн', US,
     "                    td.innerHTML = A.bulkCheckbox(items[idx].id);",
     "                    td.innerHTML = '<span style=\"width:18px;height:18px;accent-color:var(--accent);cursor:pointer;\"></span>' + A.bulkCheckbox(items[idx].id);",
     'инлайн чекбокса не вернулся'],

    ['снести второе понятие из дома', ДОМ,
     '    A.bulkCheckbox = bulkCheckbox;',
     '    A.bulkCheckboxВвод = bulkCheckbox;',
     'дом отдаёт и ввод, и ячейку'],

    ['заставить ячейку писать ввод самой', ДОМ,
     '            bulkCheckbox(id) +',
     '            \'<input type="checkbox" class="ad-bulk-item" data-bulk-id="\' + id + \'">\' +',
     'ячейка собирается зовом ввода, а не своей разметкой'],

    ['отнять у ячейки выравнивание под rowspan', ДОМ,
     "        var поСередине = о.rowspan ? 'vertical-align:middle;' : '';",
     "        var поСередине = '';",
     'rowspan приходит доводом, и выравнивание едет с ним'],

    ['отнять у кортов довод rowspan', CT,
     'A.bulkCheckboxTd(c.id, { rowspan: rowCount })',
     'A.bulkCheckboxTd(c.id)',
     'корты зовут ячейку дома с rowspan'],

    ['заставить пользователей звать ячейку вместо ввода', US,
     '                    td.innerHTML = A.bulkCheckbox(items[idx].id);',
     '                    td.innerHTML = A.bulkCheckboxTd(items[idx].id);',
     'пользователи берут у дома сам ввод'],

    ['отнять дом у одного раздела', SP,
     '                A.bulkCheckboxTd(s.id) +',
     "                '' +",
     'чекбокс берут у дома восемь разделов — замерено'],

    ['сделать стенд удобным — один путь вместо трёх', СТЕНД,
     "        A.bulkCheckboxTd('proba-2', { rowspan: 2 }) + '<td>вид покрытия</td>';",
     "        '<td>путь кортов не показан</td>';",
     'стенд держит все три пути рядом']
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
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя + '  ->  якоря нет в ' + ф); плохих++; return; }
    if (сколько !== 1) { console.log('  ? ' + имя + '  ->  якорь встречается ' + сколько + ' раз'); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].replace(что, на) });
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

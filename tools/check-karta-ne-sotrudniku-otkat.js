/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «КАРТОЧКА НЕ ЗАВОДИТСЯ СОТРУДНИКУ». На КОПИИ.
 *
 *   node tools/check-karta-ne-sotrudniku-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-karta-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const УТ = 'js/admin/core/utils.js', ЛЮ = 'js/admin/sections/users.js',
      СЛ = 'js/admin/core/constants.js', КБ = 'js/dashboard.js',
      ВА = 'js/admin/sections/vouchers.js';
const ФАЙЛЫ = [УТ, ЛЮ, СЛ, КБ, ВА];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-karta-ne-sotrudniku.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. предикат ушёл из дома админки */
    ['отнять у дома админки предикат сотрудника', УТ,
     '    A.сотрудник = function (роль) {',
     '    A.сотрудникИначе = function (роль) {',
     'предикат сотрудника объявлен в доме админки'],

    /* 2. связка двух ролей написана на месте — об одном и том же человеке */
    ['написать связку двух ролей на месте', ЛЮ,
     "        var сотрудник = A.сотрудник(user.role);",
     "        var сотрудник = user.role === 'admin' || user.role === 'manager';",
     'связка двух ролей вне дома не пишется'],

    /* 3. шестое одиночное сравнение — храповик должен упасть.
          ВАЖНО: берётся ИМЕННО ОДИНОЧНОЕ, иначе упало бы правило о связке */
    /* ЯКОРЬ ВЗЯТ УНИКАЛЬНЫЙ: `var isAdm = A.currentRole === 'admin';`
       встречается в `players.js` ТРИЖДЫ, и прувер это поймал сам. */
    ['завести шестое одиночное сравнение с ролью', ВА,
     "        var isAdmin = A.currentRole === 'admin';",
     "        var _ктоТо = window.ksltProfile && window.ksltProfile.role === 'manager';\n" +
     "        var isAdmin = A.currentRole === 'admin';",
     'одиночных сравнений с ролью не прибавилось'],

    /* 4. одним сравнением меньше — храповик ОПУСКАЕТСЯ */
    ['снять одно из пяти законных сравнений', ЛЮ,
     "        if (user.role === 'manager') {",
     "        if (user.role === 'менеджер') {",
     'потолок сравнений не завышен'],

    /* 5. страж карточки снят */
    ['снять в админке запрет заводить карточку сотруднику', ЛЮ,
     "        if (A.сотрудник(user.role)) {\n            A.showToast(L.usrStaffNoCardErr, 'error');\n            return;\n        }\n",
     "",
     'карточка игрока не заводится сотруднику'],

    /* 6. отказ стал тихим — страж на месте, а слова нет */
    ['сделать отказ тихим', ЛЮ,
     "            A.showToast(L.usrStaffNoCardErr, 'error');\n            return;",
     "            return;",
     'отказ говорится, а не молчит'],

    /* 7. кнопка одобрения заявки снова рисуется всем */
    ['вернуть кнопку одобрения заявки всем', ЛЮ,
     "                    (A.сотрудник(ч.role)\n" +
     "                        ? '<span class=\"ad-podpis\">' + A.esc(L.linkStaffNo) + '</span> '\n" +
     "                        : '<button class=\"ad-btn ad-btn-primary ad-btn-sm ad-link-yes\" data-id=\"' + z.id + '\">' + L.linkApprove + '</button> ') +",
     "                    '<button class=\"ad-btn ad-btn-primary ad-btn-sm ad-link-yes\" data-id=\"' + z.id + '\">' + L.linkApprove + '</button> ' +",
     'заявку на привязку от сотрудника не одобряют'],

    /* 8. фраза отказа вынута из словаря */
    ['вынуть из словаря фразу отказа', СЛ,
     "        usrStaffNoCardErr:",
     "        usrStaffNoCardErrИначе:",
     'фраза `usrStaffNoCardErr` лежит в словаре'],

    /* 9. вторая фраза вынута из словаря */
    ['вынуть из словаря фразу о заявке', СЛ,
     "        linkStaffNo:",
     "        linkStaffNoИначе:",
     'фраза `linkStaffNo` лежит в словаре'],

    /* 10. роль перестала читаться в запросе заявок */
    ['перестать читать роль в запросе заявок', ЛЮ,
     "select('id, full_name, email, phone, role')",
     "select('id, full_name, email, phone')",
     'роль читается в запросе заявок на карточку'],

    /* 11. кабинет снова предлагает привязку сотруднику */
    ['вернуть кабинету подсказку о карточке для сотрудника', КБ,
     "        if (!profile.player_id && !сотрудник) нарисоватьПривязку(profile);",
     "        if (!profile.player_id) нарисоватьПривязку(profile);",
     'кабинет не предлагает сотруднику привязать карточку']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  ✗ база: правило падает на ЧИСТОМ коде — чинить сторож, а не код\n');
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

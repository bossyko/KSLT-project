/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «СОТРУДНИК НЕ ЧЛЕН КЛУБА». На КОПИИ.
 *
 * Каждый откат возвращает ОДНО из снятого — и должен уронить ИМЕННО то
 * правило, которое за это отвечает. Якоря взяты на содержимом: на зовах и
 * на начальных значениях, а не на положении строки.
 *
 *   node tools/check-sotrudnik-ne-chlen-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sotrudnik-'));
['js', 'tools', 'pages'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
/* ПЕСОК ОБЯЗАН СОДЕРЖАТЬ ВСЁ, ЧТО ЧИТАЕТ ПРАВИЛО: правила читают дерево. */
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ЧЛ = 'js/membership.js', ТУ = 'js/tournament-detail.js', ДМ = 'js/kslt-dostup.js',
      КБ = 'js/dashboard.js', АВ = 'js/auth.js', ИГ = 'js/players.js',
      ЦЕ = 'pages/pricing.html', СТР = 'pages/dashboard.html';
const ФАЙЛЫ = [ЧЛ, ТУ, ДМ, КБ, АВ, ИГ, ЦЕ, СТР];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-sotrudnik-ne-chlen.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    /* 1. обход по роли в членстве — ровно то, что снято куском */
    ['вернуть обход членства по роли', ЧЛ,
     "        /* СОТРУДНИК КЛУБА НЕ ЧЛЕН КЛУБА",
     "        var роль = window.ksltProfile && window.ksltProfile.role;\n" +
     "        if (роль === 'admin' || роль === 'manager') {\n" +
     "            return { active: true, paid: true, membership: {}, daysLeft: 999 };\n" +
     "        }\n\n        /* СОТРУДНИК КЛУБА НЕ ЧЛЕН КЛУБА",
     'членство не выдаётся по роли'],

    /* 2. мёртвая проверка признака обхода на странице цен */
    ['вернуть проверку staff_bypass на странице цен', ЦЕ,
     "if (!m.active || !m.membership) return;   /* обход по роли снят куском 142 */",
     "if (!m.active || !m.membership || m.membership.staff_bypass) return;",
     'следов обхода по роли не осталось'],

    /* 3. заявка снова начинает с «членство есть» */
    ['вернуть заявке членство по умолчанию', ТУ,
     "                var membershipOk = false;",
     "                var membershipOk = true;",
     'турнирная заявка начинает с «членства нет»'],

    /* 4. своё сравнение роли в заявке */
    ['завести в заявке своё сравнение роли', ТУ,
     "            window.ksltProfileName = profRes.data.full_name || '';",
     "            var isStaff = profRes.data.role === 'admin';\n" +
     "            window.ksltProfileName = profRes.data.full_name || '';",
     'в турнирной заявке нет своего предиката роли'],

    /* 5. предикат уходит из дома — кабинету нечего звать */
    ['отнять у дома предикат сотрудника', ДМ,
     "    Д.сотрудникПоРоли = function (роль) {",
     "    Д.сотрудникПоРолиИначе = function (роль) {",
     'предикат сотрудника объявлен в доме доступа'],

    /* 6. один зов предиката в кабинете исчез */
    ['убрать в кабинете один зов предиката', КБ,
     "        var сотрудник = KSLT_DOSTUP.сотрудникПоРоли(profile.role);",
     "        var сотрудник = false;",
     'кабинет зовёт предикат дома'],

    /* 7. кабинет снова пишет предикат сам — зовы при этом целы */
    ['завести в кабинете своё сравнение роли', КБ,
     "        var сотрудник = KSLT_DOSTUP.сотрудникПоРоли(profile.role);",
     "        var сотрудник = KSLT_DOSTUP.сотрудникПоРоли(profile.role);\n" +
     "        var сотрудник2 = profile.role === 'manager';",
     'кабинет не пишет предикат роли сам'],

    /* 8. членство снова предлагается всем — зов предиката остаётся на
          месте, чтобы упало ОДНО правило, а не два */
    ['снять в кабинете условие вокруг карточки членства', КБ,
     "        if (!KSLT_DOSTUP.сотрудникПоРоли(profile.role)) {",
     "        if (true) {\n            var _с = KSLT_DOSTUP.сотрудникПоРоли(profile.role);",
     'кабинет не предлагает членство сотруднику'],

    /* 9. четвёртая копия предиката по сайту — храповик должен упасть */
    ['завести четвёртую копию предиката', ИГ,
     "(function() {\n    /** Ячейка NTRP",
     "(function() {\n    var _сотр = window.ksltProfile && window.ksltProfile.role === 'admin';\n    /** Ячейка NTRP",
     'копий предиката роли по сайту не прибавилось'],

    /* 10. копий стало меньше — храповик ОПУСКАЕТСЯ, и правило говорит об этом */
    ['снять одну из трёх законных копий', АВ,
     "        if (role === 'admin' || role === 'manager') {\n            return 'admin.html';",
     "        if (role === 'админка') {\n            return 'admin.html';",
     'потолок копий не завышен'],

    /* 11. дом ушёл со страницы кабинета */
    ['убрать дом доступа со страницы кабинета', СТР,
     '    <script src="../js/kslt-dostup.js?v=3"></script>\n',
     '',
     'дом доступа стоит в кабинете раньше dashboard.js']
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

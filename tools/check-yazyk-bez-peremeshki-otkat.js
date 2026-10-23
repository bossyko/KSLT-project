/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ПО ЯЗЫКАМ, А НЕ ВПЕРЕМЕШКУ». На КОПИИ.
 *   node tools/check-yazyk-bez-peremeshki-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-peremeshka-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.cpSync(path.join(КОРЕНЬ, 'node_modules', 'acorn'),
          path.join(песок, 'node_modules', 'acorn'), { recursive: true });

const ДОМ = 'js/kslt-yazyk.js', НОВ = 'js/news.js', ТУР = 'js/tournament-detail.js',
      СТАТ = 'js/stats.js';
const ФАЙЛЫ = [ДОМ, НОВ, ТУР, СТАТ];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-yazyk-bez-peremeshki.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['отнять у дома локаль', ДОМ,
     "    Я.локаль = код === 'en' ? 'en-US' : 'ru-RU';",
     "    Я.локальИначе = код === 'en' ? 'en-US' : 'ru-RU';",
     'локаль страницы объявлена в доме языка один раз'],

    ['объявить локаль в доме дважды', ДОМ,
     "    Я.локаль = код === 'en' ? 'en-US' : 'ru-RU';",
     "    Я.локаль = код === 'en' ? 'en-US' : 'ru-RU';\n    Я.локаль = 'ru-RU';",
     'локаль страницы объявлена в доме языка один раз'],

    /* главное: вернуть кыргызу английскую локаль */
    ['вернуть в новости локаль `ky-KG`', НОВ,
     "        dateStr = d.toLocaleDateString(KSLT_YAZYK.локаль, {",
     "        dateStr = d.toLocaleDateString(KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU'), {",
     'локали `ky-KG` в коде продукта нет'],

    /* потребитель отвалился, а `ky-KG` не завёлся — ловит счётчик */
    ['снять в статистике зов локали', СТАТ,
     "    var LOCALE = KSLT_YAZYK.локаль;",
     "    var LOCALE = 'ru-RU';",
     'потребителей локали ровно столько, сколько замерено'],

    /* кыргызу снова английское слово там, где у русского перевод */
    ['вернуть кыргызу английское слово в расписании', ТУР,
     "                        done: 'Аяктады', live: 'Жүрүп жатат', soon: 'Күтүүдө' }",
     "                        done: 'Аяктады', live: 'Live', soon: 'Күтүүдө' }",
     'кыргызу дают английское не больше, чем в именах собственных'],

    /* имён собственных стало меньше — храповик ОПУСКАЕТСЯ */
    ['перевести одно имя собственное', ТУР,
     "    var подписиСтатуса = ",
     "    var подписиСтатуса = ",
     'ПРОПУСК'],

    /* вернуть вторую карту подписей статуса */
    ['вернуть свою карту подписей статуса', ТУР,
     "/* СНЕСЕНО КУСКОМ 147, 23.10 — МЁРТВОЕ, И ЭТО ПРОВЕРЕНО, А НЕ ПО ВИДУ.",
     "function getStatusLabel(status) {\n    var labels = { completed: 'Завершён', live: 'Live', upcoming: 'Предстоит' };\n    return labels[status] || status;\n}\n/* СНЕСЕНО КУСКОМ 147, 23.10 — МЁРТВОЕ, И ЭТО ПРОВЕРЕНО, А НЕ ПО ВИДУ.",
     'своей карты подписей статуса в странице турнира нет'],

    /* страница перестала звать дом статусов */
    ['отнять у страницы турнира зов дома статусов', ТУР,
     "window.KSLT_STATUS.подписи(языкСтраницы())",
     "window.KSLT_STATUS.подписиИначе(языкСтраницы())",
     'страница турнира берёт подписи статуса у дома']
].filter(о => о[4] !== 'ПРОПУСК');

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

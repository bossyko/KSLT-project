#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ ДАННЫХ ГРАФИКА (шаг A3.3, 29.10).
 *
 * Берёт КОПИЮ файлов, возвращает прежнее значение и требует, чтобы упало
 * ИМЕННО то правило, которое за это отвечает. Правило, потерявшее место,
 * не падает — оно молчит, и это хуже падения.
 *
 * Запуск: node tools/check-grafik-dannye-otkat.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'копии дома разошлись',
      ждём: 'копии дома побайтово равны',
      файл: 'mobile/www/js/kslt-grafik-dannye.js',
      было: "    API.началоСезона = function (сейчас) {",
      станет: "    API.началоСезона = function (сейчас /* копия уехала */) {" },

    { имя: 'в доме убрали второй ключ сортировки',
      ждём: 'в доме есть: второй ключ сортировки created_at',
      файл: 'js/kslt-grafik-dannye.js',
      было: "            .order('created_at', { ascending: true })",
      станет: "" },

    { имя: 'в доме перестали читать оценку',
      ждём: 'в доме есть: оценка ntrp_after читается',
      файл: 'js/kslt-grafik-dannye.js',
      было: ", is_doubles, ntrp_after')",
      станет: ", is_doubles')" },

    { имя: 'в доме вернули friendly в зачёт',
      ждём: 'в доме есть: friendly выброшен из зачёта',
      файл: 'js/kslt-grafik-dannye.js',
      было: "r.category_id !== 'friendly' && ",
      станет: "" },

    { имя: 'в доме вернули мягкий откат вместо падения',
      ждём: 'дом ПАДАЕТ без правила порядка',
      файл: 'js/kslt-grafik-dannye.js',
      было: "            throw new Error('KSLT_GRAFIK_DANNYE: нет KSLT_RULES.поСилеКатегорий — ' +",
      станет: "            return Object.keys(byCat); // тихо и неверно\n            /* " },

    { имя: 'сайт снова читает историю сам',
      ждём: "в `rating-chart.js` (сайт) нет своего: своё чтение rating_history",
      файл: 'js/rating-chart.js',
      было: "        return window.KSLT_GRAFIK_DANNYE.rows(client, playerId);",
      станет: "        return client.from('rating_history').select('*');" },

    { имя: 'приложение снова выбрасывает парные само',
      ждём: "в `rating-chart.js` (прил) нет своего: свой отбор парных",
      файл: 'mobile/www/js/rating-chart.js',
      было: "    return window.KSLT_GRAFIK_DANNYE.rows(supabaseClient, playerId);",
      станет: "    return window.KSLT_GRAFIK_DANNYE.rows(supabaseClient, playerId)\n      .then(function (r) { return r.filter(function (x) { return x.is_doubles !== true; }); });" },

    { имя: 'приложение перестало звать дом',
      ждём: "`rating-chart.js` (прил) зовёт дом",
      файл: 'mobile/www/js/rating-chart.js',
      было: "window.KSLT_GRAFIK_DANNYE",
      станет: "window.КАКОЙ_ТО_ДРУГОЙ",
      всеВхождения: true },

    { имя: 'в доме убрали отбор точек оценки',
      ждём: 'в доме есть: отбор точек оценки',
      файл: 'js/kslt-grafik-dannye.js',
      было: "    API.ntrpPoints = function (rows) {",
      станет: "    API.ntrpТочкиОценки = function (rows) {" },

    { имя: 'приложение снова отбирает точки оценки само',
      ждём: "в `rating-chart.js` (прил) нет своего: свой отбор точек оценки",
      файл: 'mobile/www/js/rating-chart.js',
      было: "    var точки = Д.ntrpPoints(rows);",
      станет: "    var точки = (rows || []).filter(function (r) { return r.ntrp_after == null ? false : true; });" },

    { имя: 'график оценки из приложения убрали',
      ждём: 'в приложении есть график оценки',
      файл: 'mobile/www/js/rating-chart.js',
      было: "  API.ntrpSvg = function (rows) {",
      станет: "  API.ntrpSvgОтключён = function (rows) {" },

    { имя: 'одно измерение снова рисуют графиком',
      ждём: 'одно измерение показано числом, а не графиком',
      файл: 'mobile/www/css/app.css',
      было: ".rc-single",
      станет: ".rc-odinochnoe",
      всеВхождения: true },

    { имя: 'подписи зашили мимо словаря',
      ждём: 'подписи графика оценки есть в словаре',
      файл: 'mobile/www/js/i18n.js',
      было: "    'pd.ntrpPoints':     { ru: 'измерений',",
      станет: "    'pd.izmereniy':      { ru: 'измерений'," },

    { имя: 'страница грузит график без дома',
      ждём: 'дом подключён везде, где подключён график',
      файл: 'pages/dashboard.html',
      было: '<script src="../js/kslt-grafik-dannye.js?v=2"></script>',
      станет: '' }
];

function копияДерева() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-grafik-'));
    for (const отн of ['js', 'mobile/www', 'pages', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}

function прогон(корень) {
    try {
        return execFileSync('node',
            [path.join(корень, 'tools/check-grafik-dannye.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
}

console.log('\n  ПРУВЕР: ДАННЫЕ ГРАФИКА РЕЙТИНГА\n');

let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копияДерева();
    const п = path.join(корень, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;

    if (сколько === 0 || (!о.всеВхождения && сколько !== 1)) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        console.log('    Якорь: ' + JSON.stringify(о.было.slice(0, 70)));
        беда++;
        fs.rmSync(корень, { recursive: true, force: true });
        continue;
    }

    fs.writeFileSync(п, о.всеВхождения
        ? было.split(о.было).join(о.станет)
        : было.replace(о.было, о.станет));

    const вывод = прогон(корень);
    if (вывод.includes('✗ ' + о.ждём)) {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    } else {
        console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        console.log('      значит сторож смотрит не туда');
        беда++;
    }
    fs.rmSync(корень, { recursive: true, force: true });
}

console.log('');
if (беда) {
    console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
}

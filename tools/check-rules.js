#!/usr/bin/env node
/**
 * Сверка общих правил клуба.
 *
 * Правила лежат в двух местах: js/kslt-rules.js для сайта и копией в
 * mobile/www/js/ для приложения — Capacitor раскладывает эту папку в
 * Android и iOS. Копии обязаны совпадать до знака.
 *
 * Заодно проверяем данные: не оказался ли игрок в разряде, который его полу
 * не положен. Именно это однажды и не проверили — женщины в Masters были, а
 * приложение показывало им пять разрядов вместо трёх.
 *
 * Запуск:  node tools/check-rules.js
 * С базой: node tools/check-rules.js --data
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Файлы, которые обязаны совпадать в сайте и приложении
const SHARED = ['kslt-rules.js', 'site-content.js', 'contact-icons.js', 'tournament-slots.js', 'country-utils.js', 'match-score-texts.js', 'news-covers.js', 'bracket-draw.js'];

const SITE = path.join(ROOT, 'js', 'kslt-rules.js');
const APP = path.join(ROOT, 'mobile', 'www', 'js', 'kslt-rules.js');

let failed = false;

function fail(msg) {
    console.error('  ✗ ' + msg);
    failed = true;
}


// ---- Один и тот же ?v= во всех страницах -------------------------------
//
// CLAUDE.md: «Поднимать ?v= при каждой правке. CSS и JS кэшируются
// раздельно». Правило было, проверки не было — и 21.09 нашлось сразу два
// следствия:
//   1) я правил css/style.css и js/script.js и не поднял версию ни разу.
//      На живой странице у Кости остался старый лист: выглядело как
//      поломка вёрстки, а была невыкаченная правка;
//   2) index-en.html и index-kg.html сидели на script.js?v=10, когда все
//      остальные 75 страниц были на 15. Английская и кыргызская главные
//      отдавали браузеру скрипт пятью версиями старше.
//
// Второе прибор бы поймал сразу. Первое — нет: «подняли ли версию вместе
// с правкой» статически не проверить. Но РАЗНОБОЙ проверить можно, и
// именно разнобой держится месяцами незамеченным.
(function версииОдинаковы() {
    const пропустить = ['node_modules', 'backups', 'archive', 'builds', 'exports', 'import', 'mobile'];
    const страницы = [];
    (function обойти(каталог) {
        for (const имя of fs.readdirSync(каталог)) {
            if (имя.startsWith('.') || пропустить.indexOf(имя) !== -1) continue;
            const полный = path.join(каталог, имя);
            const это = fs.statSync(полный);
            if (это.isDirectory()) обойти(полный);
            else if (имя.endsWith('.html')) страницы.push(полный);
        }
    })(ROOT);

    const версии = {};   // файл -> { версия: [страницы] }
    for (const стр of страницы) {
        const текст = fs.readFileSync(стр, 'utf8');
        let м;
        const ре = /([\w.-]+\.(?:css|js))\?v=(\d+)/g;
        while ((м = ре.exec(текст)) !== null) {
            if (!версии[м[1]]) версии[м[1]] = {};
            if (!версии[м[1]][м[2]]) версии[м[1]][м[2]] = [];
            версии[м[1]][м[2]].push(path.relative(ROOT, стр));
        }
    }

    let разнобой = 0;
    for (const файл of Object.keys(версии).sort()) {
        const найденные = Object.keys(версии[файл]);
        if (найденные.length > 1) {
            разнобой++;
            const по = найденные
                .sort((a, b) => версии[файл][b].length - версии[файл][a].length)
                .map(в => 'v=' + в + ' в ' + версии[файл][в].length + ' стр.');
            fail(файл + ' идёт с разными версиями: ' + по.join(', '));
            // отстающие называем поимённо — их всегда мало
            найденные
                .sort((a, b) => версии[файл][b].length - версии[файл][a].length)
                .slice(1)
                .forEach(в => версии[файл][в].slice(0, 6)
                    .forEach(с => console.error('      v=' + в + '  ' + с)));
        }
    }
    if (!разнобой) {
        console.log('  ✓ ?v= одинаков во всех страницах (' + страницы.length +
                    ' стр., ' + Object.keys(версии).length + ' файлов)');
    }
})();

// ---- Копии совпадают? -------------------------------------------------

const siteSrc = fs.readFileSync(SITE, 'utf8');

SHARED.forEach(function (name) {
    const a = path.join(ROOT, 'js', name);
    const b = path.join(ROOT, 'mobile', 'www', 'js', name);
    if (!fs.existsSync(a)) return;
    if (!fs.existsSync(b)) {
        fail('в приложении нет копии: mobile/www/js/' + name);
    } else if (fs.readFileSync(a, 'utf8') !== fs.readFileSync(b, 'utf8')) {
        fail(name + ': сайт и приложение разошлись — скопируйте js/' + name + ' в mobile/www/js/');
    } else {
        console.log('  ✓ ' + name + ' — совпадает');
    }
});

// ---- Никто не завёл вторую копию правил? ------------------------------

const STALE = [
    ['mobile/www/js/screens/player-detail.js', /var CAT_MAP\s*=/, 'своя карта категорий вместо общего свода'],
    ['mobile/www/js/screens/partners.js', /var CAT_MAP\s*=/, 'своя карта категорий вместо общего свода'],
    ['js/players.js', /var WOMEN_CATEGORIES\s*=/, 'свой список женских разрядов вместо общего свода']
];

STALE.forEach(function (item) {
    const file = path.join(ROOT, item[0]);
    if (!fs.existsSync(file)) return;
    if (item[1].test(fs.readFileSync(file, 'utf8'))) fail(item[0] + ': ' + item[2]);
});

// ---- Код: имена, которых нет в области видимости? ---------------------
//
// `node --check` ловит только сломанный синтаксис. Ошибку в имени —
// сослался на переменную из соседней функции, оставил кусок от прежней
// правки — он пропускает, а в браузере это падает при первом же клике.
// Дважды за один день так ломалась админка: заявки переставали
// открываться, и находил это только линтер.
//
// Гоняем по коду сайта и приложения. Настройки в lint.config.mjs, там же
// перечислены глобалы вроде A и KSLT_POINTS.

// Старый долг: столько мест линтер находил на 17.09.2026. Чинить их —
// отдельная работа, но новые появляться не должны. Разберём долг —
// уменьшите число, и оно станет новым потолком.
const ДОЛГ_ЛИНТЕРА = 54;

(function проверитьИмена() {
    const { spawnSync } = require('child_process');
    const линтер = path.join(ROOT, 'node_modules', '.bin', 'eslint');

    if (!fs.existsSync(линтер)) {
        console.log('  ? линтер не установлен — npm i -D eslint');
        return;
    }

    const запуск = spawnSync(линтер, ['js', 'mobile/www/js', 'tools'],
        { cwd: ROOT, encoding: 'utf8' });

    if (запуск.status === 0) {
        console.log('  ✓ имена в коде на месте' +
            (ДОЛГ_ЛИНТЕРА > 0 ? ' (долг разобран — поставьте ДОЛГ_ЛИНТЕРА = 0)' : ''));
        return;
    }

    const вывод = запуск.stdout || '';
    const итог = вывод.match(/✖ (\d+) problems?/);
    const сколько = итог ? parseInt(итог[1], 10) : 0;

    if (сколько > ДОЛГ_ЛИНТЕРА) {
        fail('линтер нашёл ' + сколько + ' мест, было ' + ДОЛГ_ЛИНТЕРА + ' — появились новые:');
        вывод.split('\n')
            .filter(function (с) { return /error/.test(с); })
            .slice(0, 12)
            .forEach(function (с) { console.error('      ' + с.trim()); });
    } else if (сколько < ДОЛГ_ЛИНТЕРА) {
        console.log('  ✓ имена: ' + сколько + ' мест вместо ' + ДОЛГ_ЛИНТЕРА +
            ' — долг уменьшился, поправьте ДОЛГ_ЛИНТЕРА');
    } else {
        console.log('  ✓ имена: новых ошибок нет (старый долг ' + сколько + ')');
    }
})();

// ---- Данные: игроки стоят в положенных разрядах? ----------------------

if (process.argv.includes('--data')) {
    // Свод — обычный файл для браузера, поэтому подсовываем ему window
    const sandbox = { window: {} };
    new Function('window', siteSrc)(sandbox.window);
    const RULES = sandbox.window.KSLT_RULES;

    const CFG = fs.readFileSync(path.join(ROOT, 'js', 'supabase-config.js'), 'utf8');
    const url = (CFG.match(/https:\/\/[a-z0-9]+\.supabase\.co/) || [])[0];
    const key = (CFG.match(/(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]{40,})/) || [])[0];

    if (!url || !key) {
        fail('не нашёл адрес базы или ключ в js/supabase-config.js');
    } else {
        const req = url + '/rest/v1/players?select=id,name,gender,category_id';
        fetch(req, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
            .then(function (r) { return r.json(); })
            .then(function (rows) {
                const bad = (rows || []).filter(function (p) {
                    if (!p.gender || !p.category_id) return false;
                    return !RULES.allowsCategory(p.gender, p.category_id);
                });
                if (bad.length) {
                    fail('игроки в чужом разряде — ' + bad.length + ':');
                    bad.slice(0, 10).forEach(function (p) {
                        console.error('      ' + p.name + ' (' + p.gender + ') → ' + p.category_id);
                    });
                } else {
                    console.log('  ✓ все игроки стоят в разрядах, положенных их полу');
                }
                done();
            })
            .catch(function (e) {
                fail('не смог опросить базу: ' + e.message);
                done();
            });
    }
} else {
    done();
}

function done() {
    if (failed) {
        console.error('\nПравила разошлись.');
        process.exit(1);
    }
    console.log('\nПравила в порядке.');
}

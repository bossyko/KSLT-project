#!/usr/bin/env node
/**
 * ПОДНЯТЬ ВЕРСИЮ ФАЙЛА ВО ВСЕХ ТЕГАХ ВСЕХ СТРАНИЦ.
 *
 * ЗАЧЕМ ОН ЕСТЬ. Правка js или css без подъёма `?v=` означает, что у
 * всех, кто уже был на сайте, в кеше остаётся старый файл. Делалось это
 * руками, а имён бывает по двадцать на кусок.
 *
 * ПОЧЕМУ ПУТЬ, А НЕ ИМЯ ФАЙЛА — ПОЙМАНО НА СЕБЕ 30.10. Первая редакция
 * (одноразовый скрипт) искала имя файла ПОДСТРОКОЙ. На куске с
 * `tournaments.js` она подняла заодно `js/admin/sections/tournaments.js`
 * и `js/home-tournaments.js`, которых правка не касалась, и — хуже —
 * СЛИЛА СЧЁТЧИКИ двух разных файлов с одним именем: `js/match-score.js`
 * (18) и `mobile/www/js/match-score.js` (5) стали оба 19. Версия, которая
 * говорит «я изменился», когда файл не менялся, — это ложь в разметке, а
 * слитые счётчики ещё и прячут настоящее расхождение.
 * То же самое уже ловил сторож версий 17.10: он сводил `js/players.js` и
 * `js/admin/sections/players.js` в один «файл» по базовому имени. ПОЧТИ
 * ТОЧНЫЙ ПРИБОР — ЭТО НЕТОЧНЫЙ ПРИБОР, и ключ здесь — ПУТЬ.
 *
 * Номер берётся МАКСИМАЛЬНЫЙ из встреченных у этого пути и растёт на
 * один: в продукте остаётся одно значение на файл — ровно то, что
 * требует `tools/check-versii-fajlov.js`.
 *
 *   node tools/podnyat-versiyu.js js/match-score.js css/match-score.css
 *   node tools/podnyat-versiyu.js --proверка js/dashboard.js   (не писать)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');
const доводы = process.argv.slice(2);
const тихо = доводы.indexOf('--проверка') !== -1;
const ЦЕЛИ = доводы.filter(д => д.indexOf('--') !== 0);

if (!ЦЕЛИ.length) {
    console.log('\n  Нечего поднимать. Пути пишутся от корня репозитория:');
    console.log('    node tools/podnyat-versiyu.js js/match-score.js\n');
    process.exit(2);
}

/* СТРАНИЦЫ, ПАРТИАЛЫ И СТЕНДЫ СЧИТАЮТСЯ НАРАВНЕ: отставший номер на
   стенде показывает НЕ ТО, по чему принимают решение глазами. */
const ПРОПУСК = /^(node_modules|\.git|android|ios|build|test-results|playwright-report|slepki|_figma)$/;
function всеHtml(д, вых) {
    вых = вых || [];
    fs.readdirSync(path.join(КОРЕНЬ, д || '.'), { withFileTypes: true }).forEach(э => {
        const п = д ? д + '/' + э.name : э.name;
        if (э.isDirectory()) {
            if (!ПРОПУСК.test(э.name) && !э.name.startsWith('.')) всеHtml(п, вых);
        } else if (э.name.endsWith('.html')) вых.push(п);
    });
    return вых;
}

/**
 * КАЖДЫЙ ТЕГ ПРИВОДИТСЯ К ПУТИ ОТ КОРНЯ РЕПОЗИТОРИЯ.
 *
 * Сравнивать строку `src` с путём нельзя: на странице сайта тот же файл
 * записан как `../js/match-score.js`, а в приложении СВОЙ файл записан
 * как `js/match-score.js`. Одна строка — два разных файла, и это ровно
 * та беда, из-за которой счётчики слились. Поэтому `src` разрешается
 * ОТНОСИТЕЛЬНО СТРАНИЦЫ, и ключом служит получившийся путь.
 */
const ТЕГ = /(src|href)="([^"]+?\.(?:js|css))\?v=(\d+)"/g;
function путьТега(страница, src) {
    const д = path.posix.dirname(страница.split(path.sep).join('/'));
    return path.posix.normalize((д === '.' ? '' : д + '/') + src);
}

const страницы = всеHtml('');

/* Сначала ЗАМЕР по всему продукту, потом правка: номер должен быть один
   на файл, а не свой в каждой странице. */
const было = {};
const нетТегов = [];
страницы.forEach(с => {
    const т = fs.readFileSync(path.join(КОРЕНЬ, с), 'utf8');
    let m; ТЕГ.lastIndex = 0;
    while ((m = ТЕГ.exec(т))) {
        const п = путьТега(с, m[2]);
        if (ЦЕЛИ.indexOf(п) === -1) continue;
        было[п] = Math.max(было[п] || 0, Number(m[3]));
    }
});
ЦЕЛИ.forEach(ц => { if (было[ц] === undefined) нетТегов.push(ц); });

if (нетТегов.length) {
    console.log('\n  БЕДА    у этих путей не нашлось ни одного тега с ?v=:');
    нетТегов.forEach(ц => console.log('          · ' + ц));
    console.log('\n  Либо путь написан не от корня, либо файл подключён без версии —\n' +
                '  второе ловит tools/check-versii-fajlov.js.\n');
    process.exit(1);
}

const станет = {};
ЦЕЛИ.forEach(ц => { станет[ц] = было[ц] + 1; });

let замен = 0; const тронуто = new Set();
if (!тихо) {
    страницы.forEach(с => {
        const п = path.join(КОРЕНЬ, с);
        let т = fs.readFileSync(п, 'utf8');
        const д = т;
        т = т.replace(ТЕГ, (всё, свойство, src, номер) => {
            const п = путьТега(с, src);
            if (ЦЕЛИ.indexOf(п) === -1) return всё;
            замен++;
            return свойство + '="' + src + '?v=' + станет[п] + '"';
        });
        if (т !== д) { fs.writeFileSync(п, т); тронуто.add(с); }
    });
}

console.log('');
ЦЕЛИ.forEach(ц => console.log('  ' + ц + ': ' + было[ц] + ' → ' + станет[ц] +
    (тихо ? '  (не записано)' : '')));
if (!тихо) console.log('  замен: ' + замен + ' в ' + тронуто.size + ' страницах');
console.log('');

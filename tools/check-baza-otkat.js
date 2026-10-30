#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ НАСТРОЕК БАЗЫ (30.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. Зелёный сторож
 * без такого доказательства не значит ничего: 29.10 прогон нашёл сорок
 * два прувера, которые отвечали «якоря нет» — то есть не доказывали и не
 * опровергали.
 *
 * ЯКОРЯ ДЕРЖАТСЯ НА СОДЕРЖИМОМ, А НЕ НА ВЕРСИИ: теги скриптов
 * вычитываются из разметки домом `tools/yakor-tega.js`. Версия в якоре —
 * это якорь на положении, и 24 прувера сгнили на этом.
 *
 *   node tools/check-baza-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const Я = require('./yakor-tega.js');

const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-baza.js';
const ДОМ_П = 'mobile/www/js/kslt-baza.js';
const КОНФИГ = 'js/supabase-config.js';
const КОНФИГ_П = 'mobile/www/js/supabase-config.js';
const ШАПКА = 'js/auth-nav.js';
const ТРЕНЕРЫ = 'js/coaches.js';
const ИГРОКИ = 'js/players.js';
const ГЛАВНАЯ = 'js/home-rankings.js';
const ПРОСТОЙ = 'js/session-monitor.js';

const ОТКАТЫ = [
    { имя: 'второй дом настроек',
      ждём: 'дом настроек базы объявлен ровно один раз на продукт',
      файл: ШАПКА,
      было: "(function() {\n    'use strict';",
      станет: "(function() {\n    'use strict';\n    window.KSLT_BAZA = { адрес: '', ключ: '' };" },

    { имя: 'копии дома разошлись',
      ждём: 'копии дома побайтово равны',
      файл: ДОМ_П,
      было: '    API.проект = function () {',
      станет: '    API.проект = function () { /* уехало */' },

    { имя: 'адрес базы вписан в шапку заново',
      ждём: 'адрес базы написан буквами только в доме',
      файл: ШАПКА,
      было: '    var DB_URL = window.KSLT_BAZA.адрес;',
      станет: "    var DB_URL = window.KSLT_BAZA.адрес || 'https://qqkzszesviukopgjbead.supabase.co';" },

    { имя: 'ключ вписан в конфиг заново',
      ждём: 'публикуемый ключ написан буквами только в доме',
      файл: КОНФИГ,
      было: 'var SUPABASE_ANON_KEY = window.KSLT_BAZA.ключ;',
      станет: "var SUPABASE_ANON_KEY = window.KSLT_BAZA.ключ || 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G';" },

    { имя: 'имя записи с сессией вписано в читателя',
      ждём: 'имя записи с сессией собирается только в доме',
      файл: ГЛАВНАЯ,
      было: '    function isGuest() {\n        return window.KSLT_BAZA.гость();',
      станет: "    function isGuest() {\n        var с = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');\n        return !с;" },

    { имя: 'имя записи перестало считаться из адреса',
      ждём: 'имя записи считается из адреса, а не вписывается',
      файл: ДОМ,
      было: "        return 'sb-' + API.проект() + '-auth-token';",
      станет: "        return 'sb-' + 'qqkzszesviukopgjbead' + '-auth-tok' + 'en';" },

    { имя: 'подстановку базы читает ещё и шапка',
      ждём: 'подставленную базу читает один дом',
      файл: ШАПКА,
      было: '    var DB_KEY = window.KSLT_BAZA.ключ;',
      станет: '    var DB_KEY = (window.KSLT_DB && window.KSLT_DB.key) || window.KSLT_BAZA.ключ;' },

    { имя: 'просроченный токен снова считается входом',
      ждём: 'просроченный токен дом считает выходом',
      файл: ДОМ,
      было: '        return з.expires_at > Math.floor(Date.now() / 1000);',
      станет: '        return !!з.expires_at;' },

    { имя: 'разбор записи перестал ловить закрытое хранилище',
      ждём: 'закрытое хранилище даёт «не вошёл», а не падение',
      файл: ДОМ,
      было: '        try {\n            var сырое = global.localStorage.getItem(API.имяЗаписи());',
      станет: '        {\n            var сырое = global.localStorage.getItem(API.имяЗаписи());' },

    { имя: 'конфиг завёл своё значение по умолчанию',
      ждём: 'оба конфига берут адрес и ключ у дома',
      файл: КОНФИГ_П,
      было: 'var SUPABASE_URL = window.KSLT_BAZA.адрес;',
      станет: "var SUPABASE_URL = (window.KSLT_BAZA && window.KSLT_BAZA.адрес) || window.location.origin;" },

    { имя: 'шапка снова считает имя записи сама',
      ждём: 'шапка берёт настройки у дома и своего имени записи не считает',
      файл: ШАПКА,
      было: '        var session = window.KSLT_BAZA.запись();',
      станет: "        var DB_REF = DB_URL.replace(/^https:\\/\\//, '').split('.')[0];\n        var session = JSON.parse(localStorage.getItem('sb-' + DB_REF + '-auth-tok' + 'en') || 'null');" },

    { имя: 'страница тренера снова разбирает запись сама',
      ждём: 'четыре места про вход спрашивают дом, а не разбирают запись сами',
      файл: ТРЕНЕРЫ,
      было: '    var isLoggedIn = window.KSLT_BAZA.вошёл();',
      станет: "    var isLoggedIn = !!localStorage.getItem('sb-' + 'x' + '-auth-tok' + 'en');" },

    { имя: 'раздел «Игроки» перестал спрашивать дом',
      ждём: 'четыре места про вход спрашивают дом, а не разбирают запись сами',
      файл: ИГРОКИ,
      было: '    function isLoggedIn() {\n        return window.KSLT_BAZA.вошёл();',
      станет: '    function isLoggedIn() {\n        return false;' },

    { имя: 'сторож простоя считает имя записи на загрузке',
      ждём: 'сторож простоя спрашивает имя записи функцией, а не на загрузке',
      файл: ПРОСТОЙ,
      было: '    function записьСессии() { return window.KSLT_BAZA.имяЗаписи(); }',
      станет: '    var _имя = window.KSLT_BAZA.имяЗаписи();\n    function записьСессии() { return _имя; }' }
];

/* ТРИ ОТКАТА ПРО РАЗМЕТКУ — ЯКОРЬ ИЗ ФАЙЛА, БЕЗ НОМЕРА ВЕРСИИ. */
{
    const тег = Я.тегСтрокой(КОРЕНЬ, 'pages/coaches.html', 'kslt-baza.js');
    if (тег) {
        ОТКАТЫ.push({ имя: 'страница грузит тренеров без дома',
            ждём: 'дом подключён на каждой странице, где его зовут',
            файл: 'pages/coaches.html', было: тег, станет: '' });

        ОТКАТЫ.push({ имя: 'дом подключён дважды',
            ждём: 'дом подключён ровно одним тегом на страницу',
            файл: 'pages/coaches.html', было: тег, станет: тег + '\n' + тег });
    }

    const пара = Я.переставить(КОРЕНЬ, 'pages/coaches.html', 'kslt-baza.js', 'coaches.js');
    if (пара) ОТКАТЫ.push({ имя: 'дом поставлен ПОСЛЕ зовущего',
        ждём: 'дом стоит раньше своих зовущих',
        файл: 'pages/coaches.html', было: пара.было, станет: пара.станет });
}

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-baza-'));
    for (const о of ['js', 'mobile/www', 'pages', 'tools', 'maket']) {
        fs.cpSync(path.join(КОРЕНЬ, о), path.join(к, о), { recursive: true });
    }
    for (const ф of fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html'))) {
        fs.cpSync(path.join(КОРЕНЬ, ф), path.join(к, ф));
    }
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-baza.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: НАСТРОЙКИ БАЗЫ\n');

/* БАЗА: на чистой копии правила обязаны проходить, иначе откаты
   доказывают неизвестно что. */
{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n');
        console.log(вывод);
        process.exit(1);
    }
    console.log('  база    исходный код правил проходит\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия();
    const п = path.join(к, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;
    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        беда++;
        fs.rmSync(к, { recursive: true, force: true });
        continue;
    }
    fs.writeFileSync(п, было.replace(о.было, о.станет));
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (вывод.indexOf('НЕ ТАК') === -1) {
        console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    } else if (вывод.indexOf(о.ждём) === -1) {
        console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»');
        беда++;
    } else {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    }
}

console.log('');
if (беда) {
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
console.log('          оригиналы не трогались — работа шла на копии\n');

#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ ЗОВА СЕРВЕРНОЙ ФУНКЦИИ (30.10).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает. «Зелёный
 * сторож» без такого доказательства не значит ничего: 29.10 прогон нашёл
 * сорок два прувера, которые отвечали «якоря нет» — то есть не
 * доказывали и не опровергали.
 *
 * ЯКОРЯ ДЕРЖАТСЯ НА СОДЕРЖИМОМ, А НЕ НА ВЕРСИИ: теги скриптов
 * вычитываются из разметки домом `tools/yakor-tega.js`. Версия в якоре —
 * это якорь на положении, и 24 прувера сгнили на этом.
 *
 *   node tools/check-zov-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const Я = require('./yakor-tega.js');

const КОРЕНЬ = path.join(__dirname, '..');
const ДОМ = 'js/kslt-zov.js';
const ДОМ_П = 'mobile/www/js/kslt-zov.js';
const ВХОД = 'js/kslt-vhod.js';
const КАБИНЕТ = 'js/dashboard.js';
const АДМИНКА = 'js/admin/sections/broadcast.js';
const КОЛОКОЛЬЧИК = 'js/auth-nav.js';

const ОТКАТЫ = [
    { имя: 'второй дом зова',
      ждём: 'дом зова объявлен ровно один раз на продукт',
      файл: КОЛОКОЛЬЧИК,
      было: "(function() {\n    'use strict';",
      станет: "(function() {\n    'use strict';\n    window.KSLT_ZOV = { зов: function () {} };" },

    { имя: 'копии дома разошлись',
      ждём: 'копии дома побайтово равны',
      файл: ДОМ_П,
      было: '    API.настройки = настройки;',
      станет: '    API.настройки = настройки; /* уехало */' },

    { имя: 'в дом вписан адрес базы',
      ждём: 'адрес базы и ключ дом берёт у настроек, а не вписывает',
      файл: ДОМ,
      было: '            адрес: global.SUPABASE_URL,',
      станет: "            адрес: global.SUPABASE_URL || 'https://qqkzszesviukopgjbead.supabase.co'," },

    { имя: 'разбор стал слепым',
      ждём: 'ответ разбирается через текст, а не слепым json',
      файл: ДОМ,
      было: '        return resp.text().then(function (текст) {',
      станет: '        return resp.json().then(function (текст) {' },

    { имя: 'о не-JSON дом перестал говорить',
      ждём: 'о не-JSON дом говорит вслух и называет функцию',
      файл: ДОМ,
      было: "                throw new Error(имя + ': HTTP ' + resp.status);",
      станет: "                throw new Error('ошибка');" },

    /* ОТКАТ ЦЕЛИТ В САМО УТВЕРЖДЕНИЕ, А НЕ РЯДОМ. Первая редакция
       ДОБАВЛЯЛА бросок перед `return данные;` — и правило про отказ
       оставалось верным (возврат-то на месте), зато падало соседнее.
       Прувер честно сказал «упало ДРУГОЕ». Теперь возврат данных
       ЗАМЕНЯЕТСЯ броском: именно это правило и держит. */
    { имя: 'отказ сервера стал исключением',
      ждём: 'отказ сервера возвращается ДАННЫМИ, а не исключением',
      файл: ДОМ,
      было: '            return данные;',
      станет: "            if (данные.error) throw new Error(данные.error);\n            return данные.ok;" },

    { имя: 'зов уходит и без токена',
      ждём: 'без токена дом не зовёт сервер вовсе',
      файл: ДОМ,
      /* ЯКОРЬ ПЕРЕВЯЗАН 30.10: ответ «не вошёл» стал нести и код
         (`{ ok, статус, данные }`) — его просит одно место админки. */
      было: '        if (!токен) {\n            return Promise.resolve({\n                ok: false, статус: 0, данные: { error: \'not_logged_in\' }\n            });\n        }',
      станет: '        if (false) {\n            return Promise.resolve({ ok: false, статус: 0, данные: {} });\n        }' },

    { имя: 'зов от имени перестал спрашивать сессию',
      ждём: 'зов от имени спрашивает сессию у клиента, а не у зовущего',
      файл: ДОМ,
      было: '        return client.auth.getSession().then(function (сессия) {',
      станет: '        return Promise.resolve({ data: { session: null } }).then(function (сессия) {' },

    { имя: 'кабинет снова зовёт функцию сам',
      ждём: 'во всём продукте зова мимо дома нет ни одного',
      файл: КАБИНЕТ,
      было: '    function notifyChallengeAuthor(challengeId) {',
      станет: "    function notifyChallengeAuthor2(challengeId) {\n        fetch(window.SUPABASE_URL + '/functions/v1/challenge-notify', { method: 'POST' });\n    }\n    function notifyChallengeAuthor(challengeId) {" },

    { имя: 'в доме завёлся третий зов',
      ждём: 'сам дом собирает адрес функции ровно в одном месте на копию',
      файл: ДОМ,
      было: '    API.отИмени = function (client, имя, тело) {',
      станет: "    API.ещёОдин = function (имя) {\n        return fetch(настройки().адрес + '/functions/v1/' + имя);\n    };\n\n    API.отИмени = function (client, имя, тело) {" },

    /* ПОСЛЕ СВЕДЕНИЯ АДМИНКИ (30.10) её рукописных зовов НОЛЬ, и
       стережёт это общее правило — «во всём продукте зова мимо дома нет
       ни одного». Откат остался тем же: заводим рукописный зов в
       админке, — но ждём теперь общее правило, а не снятый потолок. */
    { имя: 'в админке завёлся рукописный зов',
      ждём: 'во всём продукте зова мимо дома нет ни одного',
      файл: АДМИНКА,
      было: "(function() {\n    'use strict';\n\n    var A = window.KSLT_ADMIN;",
      станет: "(function() {\n    'use strict';\n\n    var A = window.KSLT_ADMIN;\n    function зовЕщё() { return fetch(SUPABASE_URL + '/functions/v1/ещё'); }" },

    { имя: 'на ответе дома снова зовут json',
      ждём: 'на ответе дома никто не зовёт json ещё раз',
      файл: КАБИНЕТ,
      было: '        window.KSLT_ZOV.отИмени(client, \'challenge-notify\',',
      станет: '        window.KSLT_ZOV.отИмени(client, \'challenge-notify\').then(function (r) { return r.json(); });\n        window.KSLT_ZOV.отИмени(client, \'challenge-notify\',' },

    { имя: 'вход завёл свой разбор и свой ключ',
      ждём: 'дом входа зовёт дом зова и своего разбора не держит',
      файл: ВХОД,
      было: '    function разобрать(resp, имя) { return дом().разобрать(resp, имя); }',
      станет: "    function разобрать(resp, имя) {\n        return resp.text().then(function (т) { return JSON.parse(т); });\n    }\n    var _ключ = { 'apikey': 1 };" }
];

/* ДВА ОТКАТА ПРО РАЗМЕТКУ — ЯКОРЬ ИЗ ФАЙЛА, БЕЗ НОМЕРА ВЕРСИИ. */
{
    const тег = Я.тегСтрокой(КОРЕНЬ, 'pages/dashboard.html', 'kslt-zov.js');
    if (тег) ОТКАТЫ.push({ имя: 'страница грузит кабинет без дома',
        ждём: 'дом подключён на каждой странице, где его зовут',
        файл: 'pages/dashboard.html', было: тег, станет: '' });

    const пара = Я.переставить(КОРЕНЬ, 'pages/dashboard.html', 'kslt-zov.js', 'dashboard.js');
    if (пара) ОТКАТЫ.push({ имя: 'дом поставлен ПОСЛЕ зовущего',
        ждём: 'дом стоит раньше своих зовущих',
        файл: 'pages/dashboard.html', было: пара.было, станет: пара.станет });
}

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-zov-'));
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
        return execFileSync('node', [path.join(к, 'tools/check-zov.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ЗОВ СЕРВЕРНОЙ ФУНКЦИИ\n');

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

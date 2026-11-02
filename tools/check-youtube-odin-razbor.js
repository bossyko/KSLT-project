#!/usr/bin/env node
/**
 * ЗАМОРОЗКА «ССЫЛКУ YOUTUBE РАЗБИРАЕТ ОДИН ДОМ» (02.11).
 *
 * ЗАЧЕМ ОН ЕСТЬ — ЗАМЕР, А НЕ ОПАСЕНИЕ. Разборщиков ссылки YouTube в
 * продукте было ТРИ, и знали они РАЗНОЕ:
 *   · дом `js/kslt-video.js` — `watch?v=`, `embed/`, `shorts/`;
 *   · `js/live-match.js:676` — `watch?v=`, `embed/`, `live/`;
 *   · `mobile/www/js/screens/live.js:368` — то же, своей копией.
 *
 * ТО ЕСТЬ ДОМ НЕ ЗНАЛ ИМЕННО ТОГО ВИДА ССЫЛКИ, КОТОРЫЙ АДМИНКА САМА И
 * ПРЕДЛАГАЕТ ВВЕСТИ: в поле трансляции стоит подсказка
 * `https://youtube.com/live/...`. Трансляция, вставленная в новость,
 * не открылась бы ни разу, и узнали бы мы об этом в эфире.
 *
 * ВТОРАЯ ПОЛОВИНА БЕДЫ — МОЛЧАНИЕ. Поле в админке принимало что угодно
 * и ничего не отвечало: ошибку видели зрители, когда вместо матча
 * открывался пустой кадр. Теперь ссылка проверяется при вводе ТОЙ ЖЕ
 * функцией дома, которой пользуется зритель: если админка сочла ссылку
 * годной, а зритель нет — виновата разница между ними, и её нет.
 *
 * ЧЕГО НЕ СТЕРЕЖЁТ. Прибор читает код как текст. Он не проверяет, что
 * ролик существует и что трансляция идёт: это знает только YouTube.
 *
 *   node tools/check-youtube-odin-razbor.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = process.env.KSLT_KOREN || path.join(__dirname, '..');
const ДОМ = 'js/kslt-video.js';
const ЗОВУЩИЕ = ['js/live-match.js', 'mobile/www/js/screens/live.js'];
const АДМИНКА = 'js/admin/sections/live.js';

function чит(ф) {
    const п = path.join(КОРЕНЬ, ф);
    return fs.existsSync(п) ? fs.readFileSync(п, 'utf8') : null;
}
function безКом(т) {
    return (т || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

/**
 * СВОЙ РАЗБОР — ЭТО СТРОКА, ГДЕ ДОМЕН YOUTUBE ВСТРЕЧАЕТСЯ ВМЕСТЕ С
 * РАЗБОРОМ (`match`, `test`, `exec`, `replace`). Адрес, собранный
 * строкой (`'…/embed/' + id`), и упоминание в подписи — не разбор, и
 * прибор обязан их пропускать: иначе он кричит волками на верном коде.
 *
 * ПЕРВАЯ РЕДАКЦИЯ ИСКАЛА ЛИТЕРАЛ РЕГУЛЯРКИ ЦЕЛИКОМ и не находила его
 * ВОВСЕ: внутри полно экранированных косых, а шаблон их не допускал.
 * Откат «вернуть свой разборщик» не уронил правило — поймано своим же
 * прувером 02.11.
 *
 * ЧЕГО НЕ ВИДИТ: разбор, разнесённый на две строки. Названо вслух.
 */
function свойРазбор(т) {
    return безКом(т).split('\n').filter(с =>
        /youtu\.?be|youtube[\\]?\.com/.test(с) &&
        /\.(?:match|test|exec|replace)\s*\(/.test(с)
    ).length;
}

function файлы(д, вых) {
    вых = вых || [];
    const п = path.join(КОРЕНЬ, д);
    if (!fs.existsSync(п)) return вых;
    for (const э of fs.readdirSync(п, { withFileTypes: true })) {
        const о = д + '/' + э.name;
        if (э.isDirectory()) файлы(о, вых);
        else if (э.name.endsWith('.js')) вых.push(о);
    }
    return вых;
}

const все = [].concat(файлы('js'), файлы('mobile/www/js'));
const свои = [];
for (const ф of все) {
    if (ф === ДОМ || ф === 'mobile/www/' + ДОМ) continue;
    const н = свойРазбор(чит(ф));
    if (н) свои.push({ ф, н });
}

const ошибки = [];
function правило(имя, держится, подсказка) {
    if (!держится) ошибки.push({ имя, подсказка });
}

правило('разбор ссылки YouTube живёт только в доме',
    свои.length === 0,
    'Свой разбор ссылки YouTube: ' +
    свои.map(о => '\n  ' + о.ф + ' — ' + о.н + ' мест').join('') +
    '\nДо 02.11 их было три, и знали они разное: дом понимал `shorts/`,\n' +
    'но не `live/`, а Live — наоборот, при том что `live/` и предлагает\n' +
    'ввести сама админка. Зови `KSLT_VIDEO.ytId(url)`.');

правило('оба экрана Live зовут дом',
    ЗОВУЩИЕ.every(ф => {
        const т = безКом(чит(ф));
        return т && /KSLT_VIDEO\s*\.\s*ytId/.test(т);
    }),
    'Экран Live перестал звать `KSLT_VIDEO.ytId`. Сайт и приложение\n' +
    'показывают одну и ту же трансляцию: разойдутся разборщики —\n' +
    'разойдётся и то, у кого она открылась.');

правило('дом понимает все виды ссылок, которые отдаёт YouTube',
    (function () {
        /* ОБРАЗЕЦ ВНУТРЬ ПРИБОРА: не «есть ли слово live в файле», а
           РАЗБИРАЕТ ЛИ ОН. Прибор поднимает сам дом и спрашивает. */
        const т = чит(ДОМ);
        if (!т) return false;
        const окно = {};
        const песочница = {
            window: окно,
            document: { createElement: () => ({ classList: { add() {}, contains: () => false } }) }
        };
        try {
            new Function('window', 'document', т)(песочница.window, песочница.document);
        } catch (e) { return false; }
        const f = окно.KSLT_VIDEO && окно.KSLT_VIDEO.ytId;
        if (!f) return false;
        const И = 'dQw4w9WgXcQ';
        const пробы = [
            ['https://youtube.com/live/' + И, И],
            ['https://www.youtube.com/watch?v=' + И, И],
            ['https://www.youtube.com/watch?app=desktop&v=' + И, И],
            ['https://youtu.be/' + И + '?si=AbCdEf', И],
            ['https://m.youtube.com/watch?v=' + И + '&t=10s', И],
            ['https://www.youtube.com/shorts/' + И, И],
            ['https://www.youtube.com/embed/' + И, И],
            ['https://studio.youtube.com/video/' + И + '/livestreaming', И],
            /* И МОЛЧАНИЕ ТАМ, ГДЕ ССЫЛКА ЧУЖАЯ ИЛИ БИТАЯ: без этого
               «понимает всё» означало бы «отдаёт что угодно». */
            ['https://vimeo.com/123456', null],
            ['https://youtu.be/korotko', null],
            ['', null]
        ];
        return пробы.every(п => f(п[0]) === п[1]);
    })(),
    'Дом не разобрал один из видов ссылки, которые отдаёт сам YouTube\n' +
    '(live, watch, youtu.be, shorts, embed, адрес студии), либо принял\n' +
    'чужую или битую. Прибор поднимает дом и спрашивает его, а не ищет\n' +
    'слова в файле: «есть слово live» и «разбирает live» — разное.');

правило('админка проверяет ссылку той же функцией, что и зритель',
    (function () {
        const т = безКом(чит(АДМИНКА));
        if (!т || !/KSLT_VIDEO\s*\.\s*ytId/.test(т)) return false;
        /* ДВА МЕСТА, А НЕ ОДНО: подсказка под полем И отказ при
           сохранении. Одной подсказки мало — она говорит, но не
           удерживает, и битая ссылка всё равно уедет в базу.
           Имя функции в признак не годится: её ОБЪЯВЛЕНИЕ содержит то
           же `ytПроверить()`, и правило оставалось зелёным, когда зов
           при сохранении сняли. Поймано своим же прувером 02.11. */
        return (т.match(/liveYoutubeBad/g) || []).length >= 2;
    })(),
    'В `' + АДМИНКА + '` нет проверки ссылки домом. Поле принимало что\n' +
    'угодно и молчало, а ошибку видели зрители: вместо матча пустой\n' +
    'кадр. Проверять обязана ТА ЖЕ функция, что смотрит зритель, иначе\n' +
    'админка и зритель разойдутся во мнении о той же ссылке.');

console.log('');
if (!ошибки.length) {
    const всего = (fs.readFileSync(__filename, 'utf8').match(/^правило\('/gm) || []).length;
    console.log('  ок      разбор YouTube: все ' + всего + ' правил держатся');
    console.log('          дом один, своих разборов 0, админка спрашивает его же');
    console.log('');
    process.exit(0);
}
console.log('  НЕ ТАК  разбор YouTube — ' + ошибки.length + ' правил не держится');
console.log('');
ошибки.forEach(е => {
    console.log('          ✗ ' + е.имя);
    console.log('            ' + е.подсказка.replace(/\n\s*/g, '\n            '));
    console.log('');
});
process.exit(1);

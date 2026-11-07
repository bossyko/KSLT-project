/**
 * ВСТРОИТЬ ТЕЛО ПОЛИТИКИ В СТРАНИЦУ — 06.11.2026.
 *
 * Тело лежит отдельным файлом в `tools/dokumenty/`, потому что едет в
 * ДВА места: в страницу (запасной вариант) и в базу `site_documents`
 * (то, что видят люди). Один источник на оба — иначе они разойдутся,
 * как уже разошлись 06.11.
 *
 * ГРАНИЦЫ ТЕЛА — ПО РАЗМЕТКЕ: от строки с `data-document` до `</main>`.
 * Номера строк разъедутся на первой правке шапки.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..');

/* Какой документ в какие страницы встраивается. Источник один на
   страницу и на базу: `tools/sobrat-perenos-dokumentov.js` берёт тело
   из той же страницы, куда его положил этот сборщик. */
const ЯЗЫКИ = [
    { код: 'ru', тело: 'tools/dokumenty/politika-ru.html',    страница: 'pages/privacy-policy.html' },
    { код: 'en', тело: 'tools/dokumenty/politika-en.html',    страница: 'pages/privacy-policy-en.html' },
    { код: 'kg', тело: 'tools/dokumenty/politika-kg.html',    страница: 'pages/privacy-policy-kg.html' },
    { код: 'ru', тело: 'tools/dokumenty/soglashenie-ru.html', страница: 'pages/terms.html' },
    { код: 'en', тело: 'tools/dokumenty/soglashenie-en.html', страница: 'pages/terms-en.html' },
    { код: 'kg', тело: 'tools/dokumenty/soglashenie-kg.html', страница: 'pages/terms-kg.html' },
    { код: 'ru', тело: 'tools/dokumenty/udalenie-ru.html',    страница: 'pages/delete-account.html' },
    { код: 'en', тело: 'tools/dokumenty/udalenie-en.html',    страница: 'pages/delete-account-en.html' },
    { код: 'kg', тело: 'tools/dokumenty/udalenie-kg.html',    страница: 'pages/delete-account-kg.html' }
];

const ВЕРСИЯ_ДОК_JS = 1;

let сделано = 0;

for (const я of ЯЗЫКИ) {
    const путьТела = path.join(КОРЕНЬ, я.тело);
    if (!fs.existsSync(путьТела)) {
        console.log('  пропускаю ' + я.код + ': тела ещё нет (' + я.тело + ')');
        continue;
    }

    const тело = fs.readFileSync(путьТела, 'utf8').replace(/\s+$/, '');
    const путьСтраницы = path.join(КОРЕНЬ, я.страница);
    const строки = fs.readFileSync(путьСтраницы, 'utf8').split('\n');

    const от = строки.findIndex(с => с.includes('data-document'));
    const до = строки.findIndex((с, i) => i > от && с.includes('</main>'));
    if (от === -1 || до === -1) throw new Error(я.страница + ': не нашёл границы тела');

    /* Отступ берём у самого контейнера, чтобы разметка осталась
       читаемой при чтении файла глазами. */
    const отступ = (строки[от].match(/^\s*/) || [''])[0];
    const сОтступом = тело.split('\n')
        .map(с => (с.trim() === '' ? '' : отступ + '    ' + с))
        .join('\n');

    const новые = строки.slice(0, от + 1)
        .concat(сОтступом.split('\n'))
        .concat([отступ + '</div>'])
        .concat(строки.slice(до));

    let текст = новые.join('\n');

    /* Скрипт документа — рядом с остальными, после дома языка:
       он спрашивает `KSLT_YAZYK`, а порядок на страницах строгий. */
    if (!текст.includes('kslt-dokument.js')) {
        /* ПОСЛЕ ДОМА ЯЗЫКА, А НЕ ПЕРЕД: надпись кнопки спрашивает
           `KSLT_YAZYK`, и сторож `check-yazyk-odin-dom.js` требует,
           чтобы дом стоял раньше всех, кто его спрашивает. */
        const якорь = /(\s*)<script src="\.\.\/js\/kslt-yazyk\.js\?v=\d+"><\/script>/;
        if (!якорь.test(текст)) throw new Error(я.страница + ': не нашёл, куда подключить скрипт документа');
        текст = текст.replace(якорь, (всё, пробелы) =>
            всё + пробелы + `<script src="../js/kslt-dokument.js?v=${ВЕРСИЯ_ДОК_JS}"></script>`);
    }

    fs.writeFileSync(путьСтраницы, текст, 'utf8');
    console.log('  встроено: ' + я.страница + ' (' + тело.split('\n').length + ' строк тела)');
    сделано++;
}

console.log('страниц изменено:', сделано);

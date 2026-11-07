/**
 * СБОРЩИК ПЕРЕНОСА ДОКУМЕНТОВ ИЗ ФАЙЛОВ В БАЗУ (06.11.2026).
 *
 * ПОВОД. Текст Условий, Оферты и Политики на сайте и в приложении
 * приходит из таблицы `site_documents`, а не из файла: ответ базы
 * замещает разметку (`js/site-content.js:186`). Правки 06.11 легли в
 * файлы — то есть в запасной вариант, которого люди не видят.
 *
 * ЧТО ДЕЛАЕТ. Вырезает тело документа из страницы (всё между
 * `data-document` и `</main>`) и собирает ОДИН файл с запросами UPDATE.
 * Сам в базу не ходит и ничего не меняет: отдаёт текст запросов.
 *
 * ПОЧЕМУ НЕ РУКАМИ. Тело каждого документа — десятки тысяч знаков;
 * переписывать его в запрос руками значит однажды потерять строку и не
 * заметить. Сборщик берёт ровно то, что лежит в файле.
 *
 * ГРАНИЦА ТЕЛА — ПО РАЗМЕТКЕ, А НЕ ПО НОМЕРУ СТРОКИ: начало — строка с
 * `data-document`, конец — `</main>`. Номера строк разъедутся при первой
 * же правке, разметка — нет.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');

/* Какой документ из каких файлов собирается. Источник один и тот же
   для страницы и для базы — иначе они разойдутся снова. */
const ДОКУМЕНТЫ = [
    { slug: 'offer',   ru: 'pages/offer.html',          en: 'pages/offer-en.html',          kg: 'pages/offer-kg.html'          },
    { slug: 'terms',   ru: 'pages/terms.html',          en: 'pages/terms-en.html',          kg: 'pages/terms-kg.html'          },
    { slug: 'privacy', ru: 'pages/privacy-policy.html', en: 'pages/privacy-policy-en.html', kg: 'pages/privacy-policy-kg.html' },
    { slug: 'delete-account', ru: 'pages/delete-account.html', en: 'pages/delete-account-en.html', kg: 'pages/delete-account-kg.html',
      название: ['Удаление аккаунта', 'Account deletion', 'Аккаунтту өчүрүү'] }
];

/* Незаполненные места, с которыми документ выкладывать нельзя.
   Заглушка видна глазами и ловится здесь: собранный файл до базы не
   доедет, пока на её место не встанет настоящее сведение. */
const ЗАГЛУШКИ = ['ХОСТИНГ_НЕ_ЗАПОЛНЕН'];

/** Тело документа: от строки с `data-document` до `</main>`, без них самих. */
function тело(относительный) {
    const строки = fs.readFileSync(path.join(КОРЕНЬ, относительный), 'utf8').split('\n');
    const от = строки.findIndex(с => с.includes('data-document'));
    if (от === -1) throw new Error(относительный + ': нет `data-document` — текст не из базы?');
    const до = строки.findIndex((с, i) => i > от && с.includes('</main>'));
    if (до === -1) throw new Error(относительный + ': не нашёл `</main>`');

    /* Закрывающий `</div>` контейнера остаётся снаружи: внутри базы
       лежит СОДЕРЖИМОЕ контейнера, сам контейнер рисует страница. */
    const внутри = строки.slice(от + 1, до);
    while (внутри.length && внутри[внутри.length - 1].trim() === '') внутри.pop();
    if (внутри.length && внутри[внутри.length - 1].trim() === '</div>') внутри.pop();
    return внутри.join('\n');
}

/** Сколько абзацев — тем же счётом, что и запрос к базе. */
const абзацев = т => (т.match(/<p/g) || []).length;

const куски = [];
const отчёт = [];
const отложены = [];

for (const д of ДОКУМЕНТЫ) {
    const ru = тело(д.ru), en = тело(д.en), kg = тело(д.kg);

    let отложить = false;
    for (const [язык, т] of [['ru', ru], ['en', en], ['kg', kg]]) {
        if (т.includes('$kslt$')) {
            throw new Error(д.slug + '/' + язык + ': в тексте встречается ограничитель $kslt$');
        }
        if (/www\.tennis\.kg/.test(т)) {
            throw new Error(д.slug + '/' + язык + ': в файле остался www.tennis.kg — сперва почини файл');
        }
        /* НЕЗАПОЛНЕННЫЙ ДОКУМЕНТ ПРОПУСКАЕТСЯ, А НЕ РОНЯЕТ ВСЮ СБОРКУ.
           Иначе одна незаполненная строка в политике держала бы в
           файлах и Соглашение, и Оферту, которые готовы. */
        for (const заглушка of ЗАГЛУШКИ) {
            if (т.includes(заглушка)) {
                отложены.push(д.slug + '/' + язык + ': ' + заглушка);
                отложить = true;
            }
        }
    }

    if (отложить) continue;
    отчёт.push(`  ${д.slug}: ru ${абзацев(ru)} · en ${абзацев(en)} · kg ${абзацев(kg)}`);

    /* INSERT ... ON CONFLICT, А НЕ UPDATE. Строки `delete-account` в
       таблице ещё нет: UPDATE по ней молча не сделал бы ничего и
       отчитался «Success». Название трогаем только при создании —
       у заведённых документов оно уже выверено. */
    const [нру, нen, нkg] = д.название || [];
    куски.push(
`-- ---- ${д.slug} ----------------------------------------------------
INSERT INTO public.site_documents (slug, title, title_en, title_kg, body, body_en, body_kg)
VALUES ('${д.slug}',
        ${нру ? `'${нру}'` : 'NULL'}, ${нen ? `'${нen}'` : 'NULL'}, ${нkg ? `'${нkg}'` : 'NULL'},
        $kslt$${ru}$kslt$,
        $kslt$${en}$kslt$,
        $kslt$${kg}$kslt$)
ON CONFLICT (slug) DO UPDATE SET
    body    = EXCLUDED.body,
    body_en = EXCLUDED.body_en,
    body_kg = EXCLUDED.body_kg,
    title    = COALESCE(public.site_documents.title,    EXCLUDED.title),
    title_en = COALESCE(public.site_documents.title_en, EXCLUDED.title_en),
    title_kg = COALESCE(public.site_documents.title_kg, EXCLUDED.title_kg);`);
}

const шапка = `-- ============================================================
-- ПЕРЕНОС ДОКУМЕНТОВ ИЗ ФАЙЛОВ В БАЗУ — 06.11.2026
-- ============================================================
--
-- СОБРАНО: tools/sobrat-perenos-dokumentov.js. Руками не правится:
-- поправь файл страницы и собери заново, иначе файл и база разойдутся
-- снова, а именно от этого весь кусок.
--
-- ПОВОД. На сайте и в приложении текст документов берётся из
-- site_documents (js/site-content.js:177), и ответ базы ЗАМЕЩАЕТ
-- разметку страницы. Работа 06.11 — выравнивание трёх редакций,
-- 13 дописанных пунктов кыргызской оферты, снятие черновой пометки,
-- адрес без www — легла в файлы, то есть в запасной вариант.
--
-- ЗАМЕР БАЗЫ 06.11 (до переноса):
--   offer   ru 64 · en 63 · kg 52   www: во всех трёх
--   terms   ru 35 · en 31 · kg 31   www: нет
--   privacy ru 60 · en 54 · kg 54   www: во всех трёх, редакция августа
-- В ФАЙЛАХ ПОСЛЕ ПРАВОК 06.11:
--   offer   ru 64 · en 63 · kg 64
--   terms   ru 35 · en 35 · kg 35
--
-- PRIVACY СЮДА НЕ ВХОДИТ НАМЕРЕННО: политика переписывается по
-- редакции, утверждённой приказом № 1 от 3 ноября 2026, и поедет
-- отдельным файлом.
--
-- ЭТОТ ФАЙЛ МЕНЯЕТ БАЗУ. Прогонять по слову Кости.
-- ПОСЛЕ ПРОГОНА — перечитать базу: sql/схема/dokumenty-chto-v-baze-06nov.sql

`;

const хвост = `

-- ---- ПРОВЕРКА СРАЗУ ПОСЛЕ ПРАВКИ ----------------------------------
-- Читает то, что легло. Абзацы должны совпасть с «в файлах» выше,
-- а www — исчезнуть.
SELECT  slug,
        (length(body)    - length(replace(body,    '<p', ''))) / 2 AS ru_abzacev,
        (length(body_en) - length(replace(body_en, '<p', ''))) / 2 AS en_abzacev,
        (length(body_kg) - length(replace(body_kg, '<p', ''))) / 2 AS kg_abzacev,
        (body    LIKE '%www.tennis.kg%'
         OR body_en LIKE '%www.tennis.kg%'
         OR body_kg LIKE '%www.tennis.kg%')                        AS gde_to_ostalsya_www,
        updated_at
FROM    public.site_documents
WHERE   slug IN ('offer', 'terms', 'privacy', 'delete-account')
ORDER BY slug;
`;

/* ИМЯ ФАЙЛА — ЭТО ДАТА РЕДАКЦИИ, А НЕ ПОСТОЯННОЕ ИМЯ (07.11).
   Прогон 06.11 залил три документа; политика тогда не вошла — в ней
   стояла пометка о незаполненном хостинге. 07.11 пометка снята, и
   собирается ЧЕТВЁРТЫЙ документ. Если писать в прежний файл, Костя
   увидит знакомое имя и решит, что уже прогонял. Файл с новой датой —
   признак того, что это другая редакция. */
const куда = path.join(КОРЕНЬ, 'sql', 'схема', 'dokumenty-perenos-v-bazu-07nov.sql');
fs.writeFileSync(куда, шапка + куски.join('\n\n') + хвост, 'utf8');

if (отложены.length) {
    console.log('ОТЛОЖЕНЫ (незаполненные места, в базу не едут):');
    [...new Set(отложены)].forEach(о => console.log('  ' + о));
    console.log('');
}
console.log('собрано:', path.relative(КОРЕНЬ, куда));
console.log('абзацев в собранном:');
отчёт.forEach(с => console.log(с));
console.log('знаков в файле:', fs.statSync(куда).size);

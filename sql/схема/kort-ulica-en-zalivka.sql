-- РАЗОВАЯ ЗАЛИВКА street_en ПО ВСЕЙ БАЗЕ КОРТОВ.
--
-- Повод, замерено 28.09: street_en пусто у ВСЕХ 31 кортов, то есть
-- английская версия сайта показывала русскую улицу везде, а не только
-- у нового корта. Код (utils.js v26) заполняет поле при создании и
-- правке — существующие корты он не тронет, пока их кто-то не откроет.
--
-- Значения посчитаны ТЕМ ЖЕ КОДОМ, что работает в браузере:
-- js/court-address.js (транслит) + js/admin/core/utils.js (streetEn).
-- Правило: родовое слово переводится и уезжает в конец, собственное имя
-- транслитерируется. «улица Ахунбаева» → «Akhunbaeva St».
--
-- НЕ ТРОГАЕМ два корта, намеренно:
--   otshibnik                          — улица уже латиницей («2550
--                                        Waterview Dr»), копия не нужна:
--                                        показ откатится на оригинал;
--   unnamed-tennis-court-cholpon-ata   — в поле улицы лежит заметка, а не
--                                        адрес. Решение Кости 28.09:
--                                        ничего не писать.
--
-- Заполняем ТОЛЬКО пустое: свой перевод человека не трогаем (WHERE ниже).

-- 1. ДО
SELECT count(*) FILTER (WHERE street_en IS NOT NULL AND street_en <> '') AS zapolneno,
       count(*) AS vsego
FROM courts;

-- 2. ЗАЛИВКА
UPDATE courts AS c
SET street_en = v.street_en
FROM (VALUES
    ('olimpus', 'Microdistrict 12'),
    ('sdyusshor-po-tennisu-i-silovym-vidam-sporta', 'Microdistrict 4'),
    ('k2', 'Anarbeka Bakaeva St'),
    ('karven-sport-club', 'Gogolya St'),
    ('akademiya-tennisa-kr', 'Isakeeva St'),
    ('family-sport', 'Isy Akhunbaeva St'),
    ('ervin-tennis-school', 'Isy Akhunbaeva St'),
    ('sportshkola-po-tennisu-i-legkoy-atletike-im-s-zh', 'Logvinenko St'),
    ('tay-breyk', 'Togolok Moldo St'),
    ('t-club', 'Toktogula St'),
    ('fok-gazprom-dzhalal-abad', 'Danielbeka Malashova St'),
    ('tri-korony', 'Aytmatova Alley'),
    ('kyrgyzskoe-vzmorye', 'Akmatova Alley'),
    ('marco-polo-resort-hotel', 'Boz-Beshik'),
    ('baytur-rezort-end-spa', 'Bosteri'),
    ('solemar', 'Korumdu'),
    ('raduga', 'Sary-Oy'),
    ('ak-maral', 'Ak-Maral St'),
    ('akun-issyk-kul-hotel', 'Zhusupa Abdrakhmanova St'),
    ('kapriz-issyk-kul-resort-hotel', 'Kyrgyzskaya St'),
    ('karven-issyk-kul', 'Lenina St'),
    ('issyk-kul-aurora-sanatorium', 'Lenina St'),
    ('karven-four-seasons', 'Nurdoolot St'),
    ('meridian', 'Segettu St'),
    ('azur-sport-rezort', 'Segettu St'),
    ('solnyshko-vip', 'Erdeneeva St'),
    ('muras', 'Erdeneeva St'),
    ('tennisnyy-kort-osh', 'Leningradskaya St'),
    ('tennisnyy-kort-otuz-adyr', 'Otuz-Adyr')
) AS v(id, street_en)
WHERE c.id = v.id
  AND (c.street_en IS NULL OR c.street_en = '');

-- 3. ПОСЛЕ: должно стать 29 из 31
SELECT count(*) FILTER (WHERE street_en IS NOT NULL AND street_en <> '') AS zapolneno,
       count(*) FILTER (WHERE street_en ~ '[а-яёА-ЯЁ]')                  AS kirillicey,
       count(*) AS vsego
FROM courts;

-- 4. ГЛАЗАМИ: что теперь покажет английская страница
SELECT id, street, street_en, building, city
FROM courts ORDER BY city, street_en;

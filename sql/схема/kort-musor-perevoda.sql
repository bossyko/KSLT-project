-- Чистка машинного мусора в переводах корта.
-- Повод: 28.09 автоперевод при создании корта из окна турнира перевёл
-- не только город и страну, но и название с улицей. Замер на «Отшибнике»:
--   name_en  = 'Outfitter'            -- имя собственное переведено словом
--   name_kg  = 'Outfitter'            -- то же, да ещё и латиницей в кыргызском
--   street_kg= '2550 Waterview Доктор'-- сокращение Dr прочитано как «доктор»
--   city_en  = 'chicago'              -- сервис отдаёт со строчной
-- Код уже сужен до города и страны (tournaments.js v45), данные — здесь.
--
-- Правило, по которому чиню:
--   en  — латиница: название транслитом (это же теперь делает код,
--        tournaments.js v45), город с прописной;
--   kg  — кириллица: машинного значения нет, поле пустое, откат на ru.

-- 1. ДО
SELECT id, name, name_en, name_kg, street, street_kg, city, city_en, country, country_en
FROM courts WHERE id = 'otshibnik';

-- 2. ПРАВКА
UPDATE courts SET
    name_en   = 'Otshibnik',
    name_kg   = NULL,
    street_kg = NULL,
    city_en   = 'Chicago'
WHERE id = 'otshibnik';

-- 3. ПОСЛЕ
SELECT id, name, name_en, name_kg, street, street_kg, city, city_en, country, country_en
FROM courts WHERE id = 'otshibnik';

-- 4. СТОРОЖ: города и страны со строчной буквы по всей базе
SELECT count(*) AS strochnye
FROM courts
WHERE city_en    ~ '^[a-zа-яё]'
   OR city_kg    ~ '^[a-zа-яё]'
   OR country_en ~ '^[a-zа-яё]';

-- 5. ПЕРЕПИСЬ УЛИЦ: по ним проверяется словарь родовых слов
--    (utils.js: улица·проспект·переулок·бульвар·шоссе·площадь·
--     набережная·микрорайон). Слова, которого тут нет в словаре,
--     не будет и в английском адресе — увижу по этому списку.
SELECT street, count(*) AS skolko
FROM courts WHERE street IS NOT NULL AND street <> ''
GROUP BY street ORDER BY skolko DESC, street;

-- 6. ЧТО СЕЙЧАС ЛЕЖИТ В АНГЛИЙСКИХ ПОЛЯХ УЛИЦ
SELECT count(*) FILTER (WHERE street_en IS NOT NULL AND street_en <> '') AS s_en,
       count(*) FILTER (WHERE street_kg IS NOT NULL AND street_kg <> '') AS s_kg,
       count(*) FILTER (WHERE street_en ~ '[а-яёА-ЯЁ]')                 AS en_kirillicey,
       count(*) AS vsego
FROM courts;

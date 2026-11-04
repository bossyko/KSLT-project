-- КТО ЭТИ ЧЕТВЕРО. ТОЛЬКО ЧТЕНИЕ, НИЧЕГО НЕ ПИШЕТ.
-- Четыре строки файла не сошлись с базой по набору слов. Прежде чем
-- заводить карточку, ищем, нет ли их под другим написанием: ПРИБОР
-- РАСКЛАДЫВАЕТ, СВОДИТ ЧЕЛОВЕК (правило 14.10).
--
-- Признак — общее слово длиной от четырёх знаков, с ё→е и в нижнем
-- регистре. Короткие слова («б», «уулу») отброшены нарочно: они дали бы
-- пол базы.

WITH искомые(строка, имя) AS (VALUES
                                  (6,  'Салман Б'),
                                  (15, 'Даниил Орлов'),
                                  (21, 'K.u.Azat'),
                                  (42, 'Кожобаев Самат')
),
     слова_искомых AS (
         SELECT и.строка, и.имя, с AS слово
         FROM искомые и,
              unnest(regexp_split_to_array(
                      translate(lower(regexp_replace(btrim(и.имя), '[^[:alnum:]]+', ' ', 'g')),
                                'ё', 'е'),
                      ' ')) AS с
         WHERE length(с) >= 4
     ),
     слова_базы AS (
         SELECT p.id, p.name, p.gender, p.category_id, p.ntrp_singles, p.is_guest,
                с AS слово
         FROM players p,
              unnest(regexp_split_to_array(
                      translate(lower(regexp_replace(btrim(p.name), '[^[:alnum:]]+', ' ', 'g')),
                                'ё', 'е'),
                      ' ')) AS с
         WHERE length(с) >= 4
     )
SELECT и.строка,
       и.имя                 AS v_fayle,
       и.слово               AS po_kakomu_slovu,
       б.id                  AS kandidat,
       б.name                AS imya_v_baze,
       б.gender              AS pol,
       б.category_id         AS razryad,
       б.ntrp_singles        AS ntrp,
       б.is_guest            AS gost
FROM слова_искомых и
         JOIN слова_базы б ON б.слово = и.слово
ORDER BY и.строка, б.name;

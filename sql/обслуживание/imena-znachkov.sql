
-- КСЛТ · названия значков по одному правилу
-- Подготовлено 24.09.2026. ЗАПУСКАЕТ КОСТЯ. Я в базу не пишу.
--
-- ПРАВИЛО (решение Кости 24.09, анализ FAANG):
--   1. Считаемый значок называется ЦИФРОЙ и существительным: «10 матчей».
--      Цифра, а не слово: на плитке в 111 пикселей она читается быстрее и
--      переживает обрезку. Пояснение под названием на узких видах скрыто
--      (решение 24.09), поэтому название обязано говорить само.
--   2. Значки-вехи остаются словами: «Первый матч», «Первая победа».
--   3. Регистр один на весь набор. Смешивать сленг и буквальность нельзя.
--   4. Три языка отличаются только существительным, цифра одна и та же.
--
-- ЧТО БЫЛО: из 33 считаемых значков цифру в названии имели 24 английских,
-- 14 русских и 13 кыргызских; языки расходились между собой на 18 значках.
-- Русский до сотни говорил денежным сленгом — «Четвертак», «Полтинник», —
-- а с 250 переходил на слова. Ни у одного языка правила не было.
--
-- Запрос написан ПО УСЛОВИЯМ значка, а не по списку id: если завтра добавят
-- «300 матчей», он получит имя по тому же правилу без правки этого файла.

BEGIN;

-- на всякий случай: посмотреть, что изменится, ДО фиксации
-- (раскомментируй, выполни, посмотри, потом COMMIT или ROLLBACK)
-- SELECT id, name AS было_ru, name_en AS было_en, name_kg AS было_kg
--   FROM badge_definitions
--  WHERE condition_type IN ('matches_played','wins','tournaments_played','season_count')
--    AND condition_value > 1
--  ORDER BY condition_type, condition_value;

UPDATE badge_definitions
   SET name = condition_value || ' ' || CASE condition_type
                WHEN 'matches_played'     THEN 'матчей'
                WHEN 'wins'               THEN 'побед'
                WHEN 'tournaments_played' THEN 'турниров'
                WHEN 'season_count'       THEN CASE
                        WHEN condition_value % 100 BETWEEN 11 AND 14 THEN 'сезонов'
                        WHEN condition_value % 10 = 1                THEN 'сезон'
                        WHEN condition_value % 10 BETWEEN 2 AND 4    THEN 'сезона'
                        ELSE 'сезонов' END
              END,
       name_en = condition_value || ' ' || CASE condition_type
                WHEN 'matches_played'     THEN 'matches'
                WHEN 'wins'               THEN 'wins'
                WHEN 'tournaments_played' THEN 'tournaments'
                WHEN 'season_count'       THEN 'seasons'
              END,
       name_kg = condition_value || ' ' || CASE condition_type
                WHEN 'matches_played'     THEN 'матч'
                WHEN 'wins'               THEN 'жеңиш'
                WHEN 'tournaments_played' THEN 'мелдеш'
                WHEN 'season_count'       THEN 'сезон'
              END
 WHERE condition_type IN ('matches_played','wins','tournaments_played','season_count')
   AND condition_value > 1;

-- ожидается: 18 строк
COMMIT;

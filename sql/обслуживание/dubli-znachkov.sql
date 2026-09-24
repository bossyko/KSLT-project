-- КСЛТ · четыре значка-двойника
-- Подготовлено 24.09.2026. ЗАПУСКАЕТ КОСТЯ. Я в базу не пишу.
--
-- ЧТО СЛУЧИЛОСЬ
--   sql/схема/badges-migration.sql (март) завёл champion_x3, dominator,
--   top_1, top_10.
--   sql/схема/badges-44.sql (август, полный посев на 44 значка) завёл те же
--   четыре достижения под НОВЫМИ id: champion_3, domination, rank_1, rank_10.
--   Старые строки при этом никто не удалил.
--
--   Выдача перебирает badge_definitions и сопоставляет по УСЛОВИЮ, а не по id.
--   Поэтому на каждое из четырёх достижений срабатывали оба определения.
--
-- ЗАМЕРЕНО 24.09 ЧТЕНИЕМ БАЗЫ, не предположение:
--   champion_count 3  champion_x3   2 выдано  /  champion_3   2 выдано
--   rank 1            top_1         7 выдано  /  rank_1       7 выдано
--   rank 10           top_10       51 выдано  /  rank_10     51 выдано
--   domination 5      dominator     0 выдано  /  domination   0 выдано
--   Игроки в каждой паре ОДНИ И ТЕ ЖЕ, earned_at совпадает до секунды.
--   Значит выданные дубли — чистый дубль, и никто ничего не теряет.
--
--   ЧИСЛА РАСТУТ. При первом чтении 24.09 было 6/6 и 50/50, через час у Кости
--   уже 7/7 и 51/51: выдача отработала ещё раз и СНОВА записала оба id. Дубль
--   не застывшая история, он размножается при каждом пересчёте. Поэтому шаг 3
--   удаляет не только строки, но и сами определения — иначе всё вернётся.
--   Точное число строк бери из шага 1, а не из этой шапки.
--
-- КАКОЙ ID ОСТАЁТСЯ И ПОЧЕМУ
--   Остаются id из badges-44.sql: champion_3, domination, rank_1, rank_10.
--   Не по вкусу к именам, а по устойчивости: badges-44.sql — это посев,
--   который прогоняется на чистом окружении. Оставь мы старые id — следующий
--   его прогон создаст дубли заново. Оставляем те, что объявлены в живом
--   файле посева, и старый badges-migration.sql после этого надо увести в
--   архив, чтобы он больше не запускался.
--
-- ПОБОЧНОЕ, СКАЗАТЬ ВСЛУХ: у остающихся id sort_order 51 / 61 / 63 / 64, а у
--   удаляемых был 16 / 19 / 20 / 27. Четыре значка уедут из начала сетки в
--   конец. Если порядок важен — правится отдельной строкой, см. шаг 4.

-- ═══ ШАГ 1. ПОСМОТРЕТЬ, НИЧЕГО НЕ МЕНЯЯ ═══════════════════════════════════
-- Прогнать ОТДЕЛЬНО и убедиться, что числа те же, что в шапке.

SELECT d.condition_type, d.condition_value, d.id, d.name, d.sort_order,
       count(pb.badge_id) AS выдано,
       CASE WHEN d.id IN ('champion_3','domination','rank_1','rank_10')
            THEN 'ОСТАЁТСЯ' ELSE 'удаляется' END AS судьба
  FROM badge_definitions d
  LEFT JOIN player_badges pb ON pb.badge_id = d.id
 WHERE d.id IN ('champion_3','champion_x3','dominator','domination',
                'rank_1','top_1','rank_10','top_10')
 GROUP BY d.id, d.condition_type, d.condition_value, d.name, d.sort_order
 ORDER BY d.condition_type, d.condition_value, судьба;

-- ═══ ШАГ 2. СТРАХОВКА: убедиться, что удаляем ТОЛЬКО дубли ════════════════
-- Должно вернуть НОЛЬ строк. Если вернёт хоть одну — СТОП, не продолжать:
-- значит у кого-то есть старый значок БЕЗ парного нового, и удаление отнимет
-- у человека достижение.

SELECT pb.player_id, pb.badge_id
  FROM player_badges pb
 WHERE pb.badge_id IN ('champion_x3','dominator','top_1','top_10')
   AND NOT EXISTS (
       SELECT 1 FROM player_badges p2
        WHERE p2.player_id = pb.player_id
          AND p2.badge_id = CASE pb.badge_id
                WHEN 'champion_x3' THEN 'champion_3'
                WHEN 'dominator'   THEN 'domination'
                WHEN 'top_1'       THEN 'rank_1'
                WHEN 'top_10'      THEN 'rank_10'
              END);

-- ═══ ШАГ 3. УДАЛЕНИЕ ══════════════════════════════════════════════════════
-- Только после того, как шаг 2 вернул ноль строк.

BEGIN;

-- 3.1 выданные дубли: столько, сколько показал шаг 1 в сумме по
--     удаляемым (на 24.09 это 2 + 0 + 7 + 51 = 60)
DELETE FROM player_badges
 WHERE badge_id IN ('champion_x3','dominator','top_1','top_10');

-- 3.2 сами определения: ожидается 4 строки
DELETE FROM badge_definitions
 WHERE id IN ('champion_x3','dominator','top_1','top_10');

COMMIT;

-- ═══ ШАГ 4. ВЕРНУТЬ ЧЕТВЁРКУ НА ПРЕЖНИЕ МЕСТА В СЕТКЕ ═════════════════════
-- РЕШЕНО КОСТЕЙ 24.09: вернуть. Удалённые id стояли в начале сетки
-- (16 / 19 / 20 / 27), у оставшихся номера с конца (51 / 61 / 63 / 64), и без
-- этого шага «Чемпион х3» уехал бы с 12 места на 29, «Топ-10» с 13 на 35,
-- «Первый номер» с 14 на 37, «Доминатор» с 23 на 38.
--
-- БЕЗОПАСНО ДЛЯ ВЫДАЧИ, проверено по коду: sort_order участвует в функции
-- выдачи только как порядок обхода — «FOR badge IN SELECT * FROM
-- badge_definitions WHERE condition_type != 'manual' ORDER BY sort_order»
-- (badges-count-battles.sql:49, fix-badges-score-parse.sql:38,
-- badges-44.sql:128, baseline.sql:156 и :410). Выдачу решает CASE по
-- condition_type (строка 52), повтор закрыт NOT EXISTS (211). Ни одно условие
-- не зависит от того, выдан ли другой значок, поэтому порядок обхода на
-- результат не влияет — только на порядок плиток на экране.

BEGIN;
UPDATE badge_definitions SET sort_order = 16 WHERE id = 'champion_3';
UPDATE badge_definitions SET sort_order = 19 WHERE id = 'rank_10';
UPDATE badge_definitions SET sort_order = 20 WHERE id = 'rank_1';
UPDATE badge_definitions SET sort_order = 27 WHERE id = 'domination';
COMMIT;

-- Проверка порядка после шага 4: четвёрка снова в начале.
SELECT sort_order, id, name FROM badge_definitions
 WHERE sort_order BETWEEN 10 AND 30 ORDER BY sort_order;

-- ═══ ШАГ 5. ПРОВЕРКА ══════════════════════════════════════════════════════
-- Должно остаться 47 определений (было 51) и ни одной пары
-- «одно условие — два определения», кроме manual 0.
-- Число выданных не проверяем числом: оно растёт само по ходу турниров.

SELECT condition_type, condition_value, count(*) AS определений,
       string_agg(id, ' + ' ORDER BY id) AS какие
  FROM badge_definitions
 WHERE NOT (condition_type = 'manual' AND condition_value = 0)
 GROUP BY condition_type, condition_value
HAVING count(*) > 1;

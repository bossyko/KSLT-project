-- ============================================================
-- Futures: что не так в группах B и C — только смотрим
-- ============================================================
--
-- В группах B и C одна пара встречается дважды, а другой встречи нет
-- вовсе. Из-за этого в таблице стоит глухой прочерк: счёт вводится
-- только там, где матч есть в базе, — а матча между этими парами нет.
-- Места при этом посчитались досрочно: формально три матча на три пары,
-- круг «закрыт».
--
-- Этот файл ничего не меняет. Запустите его до и после правки, чтобы
-- увидеть, что изменилось.
--
-- Турнир: Дружеский турнир в мужском парном разряде Futures
--   7094e2bd-02e6-476b-9e0c-efc7bffc8418

-- ---- 1. Все матчи групп B и C: кто с кем и с каким счётом ----

SELECT CASE m.group_number WHEN 2 THEN 'B' WHEN 3 THEN 'C' END AS группа,
       m.round_number  AS круг,
       p1.name         AS первый,
       p2.name         AS второй,
       m.status        AS состояние,
       COALESCE(m.score, '—') AS счёт
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND m.group_number IN (2, 3)
 ORDER BY m.group_number, m.match_order;

-- Ожидаем до правки:
--   B: Азат — Шавкат (6/0), Эрбол — Шавкат (6/0), Шавкат — Азат (пусто)
--   C: Салман — Бексултан (6/1), Алымбек — Бексултан (6/0), Бексултан — Салман (пусто)

-- ---- 2. Каких пар не хватает, а какие задвоены ----
--
-- Слева — все возможные пары группы, справа — сколько матчей на пару.
-- Ноль означает, что встречи нет; двойка — что она заведена дважды.

WITH состав AS (
    SELECT m.group_number AS гр, m.player1_id AS игрок
      FROM public.matches m
     WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
       AND m.group_number IN (2, 3)
    UNION
    SELECT m.group_number, m.player2_id
      FROM public.matches m
     WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
       AND m.group_number IN (2, 3)
),
пары AS (
    SELECT a.гр,
           LEAST(a.игрок, b.игрок)    AS первый,
           GREATEST(a.игрок, b.игрок) AS второй
      FROM состав a
      JOIN состав b ON b.гр = a.гр AND b.игрок > a.игрок
)
SELECT CASE п.гр WHEN 2 THEN 'B' WHEN 3 THEN 'C' END AS группа,
       p1.name AS первый,
       p2.name AS второй,
       (SELECT count(*)
          FROM public.matches m
         WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
           AND m.group_number = п.гр
           AND LEAST(m.player1_id, m.player2_id) = п.первый
           AND GREATEST(m.player1_id, m.player2_id) = п.второй) AS матчей
  FROM пары п
  LEFT JOIN public.players p1 ON p1.id = п.первый
  LEFT JOIN public.players p2 ON p2.id = п.второй
 ORDER BY п.гр, матчей, p1.name;

-- Ожидаем до правки: по одной строке с 0 и по одной с 2 в каждой группе.
-- После правки: у всех пар ровно 1.

-- ---- 3. Сыгранные результаты — их правка не трогает ----

SELECT count(*) FILTER (WHERE m.status = 'completed' AND m.score IS NOT NULL) AS сыгранных,
       count(*) FILTER (WHERE m.status <> 'completed' OR m.score IS NULL)     AS без_счёта
  FROM public.matches m
 WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND m.group_number IS NOT NULL;
-- На 12 сентября: сыгранных 11, без счёта 7 (всего 18 матчей в шести
-- группах). Правка меняет только игрока в двух пустых записях, поэтому
-- обе цифры после неё остаются прежними — ни один счёт не теряется.

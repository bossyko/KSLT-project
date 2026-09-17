-- ============================================================
-- Повторы в группах — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Один запрос — одна таблица: редактор Supabase показывает
-- результат последнего запроса, и находки из первых просто не видно.
--
-- Три вида беды в одной выдаче:
--
--   «две группы»       — один человек стоит сразу в двух группах;
--   «пара дважды»      — одна и та же встреча заведена не один раз;
--   «состав разошёлся» — в матче стоит не тот, кто записан в его заявке
--                        (след слепой замены по всему турниру);
--   «группы неровные»  — разница между самой большой и самой маленькой
--                        группой больше одного человека.
--
-- Пусто — значит сетки чистые.

WITH участники AS (
    SELECT DISTINCT m.tournament_id, m.group_number, m.player1_id AS игрок
      FROM public.matches m
     WHERE m.group_number IS NOT NULL AND m.player1_id IS NOT NULL
    UNION
    SELECT DISTINCT m.tournament_id, m.group_number, m.player2_id
      FROM public.matches m
     WHERE m.group_number IS NOT NULL AND m.player2_id IS NOT NULL
),
две_группы AS (
    SELECT у.tournament_id,
           'две группы'::text AS беда,
           p.name             AS кто,
           string_agg(DISTINCT у.group_number::text, ', ') AS где
      FROM участники у
      JOIN public.players p ON p.id = у.игрок
     GROUP BY у.tournament_id, у.игрок, p.name
    HAVING count(DISTINCT у.group_number) > 1
),
пара_дважды AS (
    SELECT m.tournament_id,
           'пара дважды'::text AS беда,
           COALESCE(p1.name, '—') || ' — ' || COALESCE(p2.name, '—') AS кто,
           'группа ' || m.group_number || ', записей ' || count(*)   AS где
      FROM public.matches m
      LEFT JOIN public.players p1 ON p1.id = LEAST(m.player1_id, m.player2_id)
      LEFT JOIN public.players p2 ON p2.id = GREATEST(m.player1_id, m.player2_id)
     WHERE m.group_number IS NOT NULL
       AND m.player1_id IS NOT NULL AND m.player2_id IS NOT NULL
     GROUP BY m.tournament_id, m.group_number,
              LEAST(m.player1_id, m.player2_id), GREATEST(m.player1_id, m.player2_id),
              p1.name, p2.name
    HAVING count(*) > 1
),
состав_разошёлся AS (
    SELECT m.tournament_id,
           'состав разошёлся'::text AS беда,
           COALESCE(p1.name, '—') || ' vs ' || COALESCE(p2.name, '—') AS кто,
           'группа ' || m.group_number || ', встреча ' || m.match_order AS где
      FROM public.matches m
      LEFT JOIN public.players p1 ON p1.id = m.player1_id
      LEFT JOIN public.players p2 ON p2.id = m.player2_id
      JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
      JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
     WHERE m.group_number IS NOT NULL
       AND (m.player1_id IS DISTINCT FROM r1.player_id
         OR m.player2_id IS DISTINCT FROM r2.player_id)
),
размеры AS (
    SELECT tournament_id, group_number, count(*) AS человек
      FROM участники
     GROUP BY tournament_id, group_number
),
неровные AS (
    SELECT р.tournament_id,
           'группы неровные'::text AS беда,
           'от ' || min(р.человек) || ' до ' || max(р.человек) AS кто,
           string_agg(р.group_number || ': ' || р.человек, ', ' ORDER BY р.group_number) AS где
      FROM размеры р
     GROUP BY р.tournament_id
    HAVING max(р.человек) - min(р.человек) > 1
),
всё AS (
    SELECT * FROM две_группы
    UNION ALL SELECT * FROM пара_дважды
    UNION ALL SELECT * FROM состав_разошёлся
    UNION ALL SELECT * FROM неровные
)
SELECT t.title AS турнир, в.беда, в.кто, в.где
  FROM всё в
  JOIN public.tournaments t ON t.id = в.tournament_id
 ORDER BY t.title, в.беда, в.кто;

-- ============================================================
-- Микст FUTURES: состав групп вернулся — ПРОВЕРКА
-- ============================================================
--
-- Что ожидаем после правки:
--   расхождений с заявками — 0
--   в каждой группе ровно свои пары и полный круг встреч
--   триггер продвижения включён
--
-- Запрос читающий, ничего не меняет.

WITH стороны AS (
    SELECT m.group_number AS группа, m.match_order AS номер,
           m.player1_id AS игрок, m.reg1_id AS заявка
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL
    UNION ALL
    SELECT m.group_number, m.match_order, m.player2_id, m.reg2_id
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL
),
расхождения AS (
    SELECT count(*) AS n
      FROM стороны с
      LEFT JOIN public.tournament_registrations z ON z.id = с.заявка
     WHERE с.игрок IS NOT NULL
       AND (z.id IS NULL
            OR (с.игрок IS DISTINCT FROM z.player_id
                AND (z.partner_id IS NULL OR с.игрок IS DISTINCT FROM z.partner_id)))
),
чужие AS (
    SELECT count(*) AS n
      FROM стороны с
      LEFT JOIN public.tournament_registrations r
             ON r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
            AND (r.player_id = с.игрок OR r.partner_id = с.игрок)
     WHERE с.игрок IS NOT NULL
       AND r.group_number IS DISTINCT FROM с.группа
),
круги AS (
    -- Встреч в группе должно быть столько, сколько пар по заявкам:
    -- n * (n - 1) / 2, каждая пара ровно по разу
    SELECT string_agg(п.буква || ': ' || п.матчей || ' из ' || п.надо, ', '
                      ORDER BY п.группа) AS свод
      FROM (
        SELECT z.group_number AS группа,
               chr(64 + z.group_number) AS буква,
               (SELECT count(*) FROM public.matches m
                 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
                   AND m.group_number = z.group_number) AS матчей,
               count(*) * (count(*) - 1) / 2 AS надо
          FROM public.tournament_registrations z
         WHERE z.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
           AND z.group_number IS NOT NULL
         GROUP BY z.group_number
      ) п
),
триггер AS (
    SELECT CASE tgenabled WHEN 'O' THEN 'включён'
                          ELSE 'ВЫКЛЮЧЕН: ' || tgenabled::text END AS сост
      FROM pg_trigger
     WHERE tgname = 'trg_advance_bracket'
       AND tgrelid = 'public.matches'::regclass
)
SELECT (SELECT n FROM расхождения)    AS матч_разошёлся_с_заявкой,
       (SELECT n FROM чужие)          AS игрок_из_чужой_группы,
       (SELECT свод FROM круги)       AS встреч_в_группах,
       (SELECT сост FROM триггер)     AS триггер_продвижения;

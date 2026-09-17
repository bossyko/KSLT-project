-- ============================================================
-- Микст FUTURES: сетка против мест в группах — ПРОВЕРКА
-- ============================================================
--
-- Пока в группах стояли чужие пары, места считались от неверного состава,
-- а плей-офф собирался по этим местам. Состав вернули — места
-- пересчитались, и сетка могла им больше не соответствовать.
--
-- Клетка сетки помнит, кого ждёт: метка `A1` — первое место группы A.
-- Сверяем, кто в клетке стоит, с тем, кто это место занимает.
--
-- Места считаем по победам — этого хватает, чтобы увидеть расхождение.
-- Где побед поровну, место решала личная встреча, сеты, геймы или жребий:
-- такие строки помечены «поровну побед», их смотреть глазами в админке.
-- Метки `Q` (добор) и `IG` (доп. матчи) не про место в группе — пропускаем.
--
-- Что ожидаем: у всех строк «сходится».
--
-- Запрос читающий, ничего не меняет.

WITH участники AS (
    SELECT m.group_number AS группа, m.player1_id AS игрок
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL AND m.player1_id IS NOT NULL
    UNION
    SELECT m.group_number, m.player2_id
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL AND m.player2_id IS NOT NULL
),
победы AS (
    SELECT у.группа, у.игрок,
           (SELECT count(*) FROM public.matches m
             WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
               AND m.group_number = у.группа
               AND m.winner_id = у.игрок) AS побед
      FROM участники у
),
места AS (
    SELECT п.группа, п.игрок, п.побед,
           rank() OVER (PARTITION BY п.группа ORDER BY п.побед DESC) AS место,
           count(*) OVER (PARTITION BY п.группа, п.побед) AS поровну
      FROM победы п
),
клетки AS (
    SELECT m.match_order AS матч, 1 AS сторона,
           m.slot1_label AS метка, m.player1_id AS стоит
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NULL AND m.round IS DISTINCT FROM 'IG'
       AND m.round_number = 1 AND m.slot1_label IS NOT NULL
    UNION ALL
    SELECT m.match_order, 2, m.slot2_label, m.player2_id
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NULL AND m.round IS DISTINCT FROM 'IG'
       AND m.round_number = 1 AND m.slot2_label IS NOT NULL
),
разбор AS (
    SELECT к.матч, к.сторона, к.метка, к.стоит,
           ascii(upper(left(к.метка, 1))) - 64                  AS группа,
           NULLIF(regexp_replace(к.метка, '\D', '', 'g'), '')::int AS место
      FROM клетки к
     WHERE upper(left(к.метка, 1)) BETWEEN 'A' AND 'Z'
       AND upper(left(к.метка, 1)) NOT IN ('Q', 'I')
)
SELECT р.матч                                    AS матч_сетки,
       р.сторона,
       р.метка,
       COALESCE(pс.name, '— клетка пуста —')     AS стоит_в_клетке,
       COALESCE(string_agg(DISTINCT pм.name, ' / '), '—') AS на_этом_месте,
       CASE
           WHEN р.стоит IS NULL            THEN 'клетка пуста'
           WHEN bool_or(м.игрок = р.стоит) THEN 'сходится'
           -- Свой, но по победам место не различить: решала личная
           -- встреча, сеты, геймы или жребий. rank() при равенстве
           -- пропускает номера, поэтому места может не быть вовсе
           WHEN bool_or(св.игрок = р.стоит) THEN 'поровну побед — смотреть глазами'
           ELSE 'РАЗОШЛОСЬ: из другой группы'
       END                                       AS состояние
  FROM разбор р
  LEFT JOIN места м  ON м.группа = р.группа AND м.место = р.место
  -- Все свои по этой группе: по ним отличаем чужака от неразличимого места
  LEFT JOIN места св ON св.группа = р.группа
  LEFT JOIN public.players pм ON pм.id = м.игрок
  LEFT JOIN public.players pс ON pс.id = р.стоит
 GROUP BY р.матч, р.сторона, р.метка, р.стоит, pс.name
 ORDER BY CASE WHEN bool_or(м.игрок = р.стоит) THEN 2
               WHEN bool_or(св.игрок = р.стоит) THEN 1 ELSE 0 END,
          р.матч, р.сторона;

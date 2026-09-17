-- ============================================================
-- Кто проехал вперёд, не сыграв — ПРОВЕРКА по всем турнирам
-- ============================================================
--
-- Только читает. Пока клетка первого круга стояла пустой — имя в неё
-- встаёт по мере готовности групп и доп. матчей, — она считалась проходом
-- без игры, и соперник уезжал в следующий круг.
--
-- Ищем след: человек стоит в клетке второго круга, а встреча первого,
-- которая его туда ведёт, не сыграна.
--
-- Заодно показываем ложные проходы в самом первом круге: матч закрыт как
-- BYE, хотя у пустой стороны есть метка — значит соперник ещё придёт.
--
-- Пусто в обеих частях — сетки чистые.

WITH ложные_проходы AS (
    SELECT t.title                                   AS турнир,
           'ложный проход'::text                     AS беда,
           m.round || '-' || m.match_order           AS клетка,
           COALESCE(p.name, '—')                     AS кто,
           'ждали ' || COALESCE(m.slot1_label, m.slot2_label) AS пояснение
      FROM public.matches m
      JOIN public.tournaments t ON t.id = m.tournament_id
      LEFT JOIN public.players p ON p.id = m.winner_id
     WHERE m.group_number IS NULL
       AND m.round IS DISTINCT FROM 'IG'
       AND m.score = 'BYE'
       AND ((m.player1_id IS NULL AND m.slot1_label IS NOT NULL)
         OR (m.player2_id IS NULL AND m.slot2_label IS NOT NULL))
),
проехали AS (
    SELECT t.title                                   AS турнир,
           'проехал без игры'::text                  AS беда,
           сл.round || '-' || сл.match_order         AS клетка,
           COALESCE(p.name, '—')                     AS кто,
           'встреча ' || пр.round || '-' || пр.match_order || ' не сыграна' AS пояснение
      FROM public.matches сл
      JOIN public.tournaments t ON t.id = сл.tournament_id
      JOIN public.matches пр
        ON пр.tournament_id = сл.tournament_id
       AND пр.group_number IS NULL
       AND пр.round IS DISTINCT FROM 'IG'
       AND пр.round_number = сл.round_number - 1
       AND пр.match_order IN (сл.match_order * 2 - 1, сл.match_order * 2)
      LEFT JOIN public.players p
        ON p.id = CASE WHEN пр.match_order = сл.match_order * 2 - 1
                       THEN сл.player1_id ELSE сл.player2_id END
     WHERE сл.group_number IS NULL
       AND сл.round IS DISTINCT FROM 'IG'
       AND сл.round_number >= 2
       AND пр.status <> 'completed'
       AND CASE WHEN пр.match_order = сл.match_order * 2 - 1
                THEN сл.player1_id ELSE сл.player2_id END IS NOT NULL
)
SELECT * FROM ложные_проходы
UNION ALL
SELECT * FROM проехали
 ORDER BY турнир, беда, клетка;

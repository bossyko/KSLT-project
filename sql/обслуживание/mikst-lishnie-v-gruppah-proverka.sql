-- ============================================================
-- Микст FUTURES: откуда в группах лишние пары — ПРОВЕРКА
-- ============================================================
--
-- В таблице группы A шесть пар вместо четырёх, и среди них те, кто играет
-- в группе E. Состав группы в админке собирается из матчей, а не из
-- заявок: кто попал в матч с номером группы, тот и в таблице. Значит
-- где-то завёлся матч с чужим составом.
--
-- Показываем каждую сторону каждого группового матча: в той ли она
-- группе по заявке. Жеребьёвка проставляет ссылку на заявку, матч,
-- заведённый кликом по пустой клетке, ссылок не имеет — это видно в
-- колонке «как_заведён».
--
-- Что ожидаем: у всех строк «свой» в колонке «сходится». Строки с
-- «ЧУЖОЙ» — те самые лишние пары.
--
-- Запрос читающий, ничего не меняет.

WITH стороны AS (
    SELECT m.id, m.group_number AS группа, m.match_order AS номер,
           m.player1_id AS игрок, 1 AS сторона,
           m.reg1_id AS заявка_матча, m.reg2_id AS заявка_другой,
           COALESCE(m.score, m.status) AS счёт, m.created_at
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL
    UNION ALL
    SELECT m.id, m.group_number, m.match_order,
           m.player2_id, 2,
           m.reg2_id, m.reg1_id,
           COALESCE(m.score, m.status), m.created_at
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL
)
SELECT с.группа                                   AS матч_в_группе,
       с.номер,
       с.сторона,
       COALESCE(p.name, '—')                      AS игрок,
       r.group_number                             AS заявка_в_группе,
       CASE WHEN r.group_number = с.группа THEN 'свой' ELSE 'ЧУЖОЙ' END AS сходится,
       с.счёт,
       CASE WHEN с.заявка_матча IS NULL OR с.заявка_другой IS NULL
            THEN 'руками' ELSE 'жеребьёвка' END   AS как_заведён,
       с.created_at                               AS заведён_когда
  FROM стороны с
  LEFT JOIN public.players p ON p.id = с.игрок
  LEFT JOIN public.tournament_registrations r
         ON r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
        AND (r.player_id = с.игрок OR r.partner_id = с.игрок)
 WHERE с.игрок IS NOT NULL
 ORDER BY (r.group_number IS DISTINCT FROM с.группа) DESC,
          с.группа, с.created_at, с.номер, с.сторона;

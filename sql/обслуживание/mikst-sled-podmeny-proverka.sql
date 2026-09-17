-- ============================================================
-- Микст FUTURES: чем подменили состав матчей — ПРОВЕРКА
-- ============================================================
--
-- Жеребьёвка раздала группы верно: все матчи заведены одной вставкой и
-- ссылаются на заявки. Потом в четырёх матчах игрок оказался из другой
-- группы. created_at при правке не меняется, поэтому по нему подмену не
-- увидеть — смотрим на расхождение матча со своей же заявкой.
--
-- Матч помнит заявку (reg1_id/reg2_id). Если игрок в матче не тот, кого
-- заявка называет капитаном, — состав переписали после жеребьёвки.
--
-- Что ожидаем: «сходится» у всех сторон. «ПЕРЕПИСАН» — след подмены.
--
-- Внизу той же выборкой идёт история замен по турниру: кто, кого и когда.
--
-- Запрос читающий, ничего не меняет.

WITH стороны AS (
    SELECT m.group_number AS группа, m.match_order AS номер, 1 AS сторона,
           m.player1_id AS игрок, m.reg1_id AS заявка
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL
    UNION ALL
    SELECT m.group_number, m.match_order, 2, m.player2_id, m.reg2_id
      FROM public.matches m
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND m.group_number IS NOT NULL
),
разбор AS (
    SELECT 'матч'                                   AS что,
           с.группа::text                           AS группа,
           с.номер::text                            AS номер,
           COALESCE(p.name, '—')                    AS кто_в_матче,
           COALESCE(pz.name, '—')                   AS кто_по_заявке,
           COALESCE(z.group_number::text, '—')      AS группа_заявки,
           CASE
               WHEN с.заявка IS NULL                THEN 'ссылки нет'
               WHEN z.player_id = с.игрок           THEN 'сходится'
               WHEN z.partner_id = с.игрок          THEN 'сходится (напарник)'
               ELSE 'ПЕРЕПИСАН'
           END                                      AS состояние,
           NULL::timestamptz                        AS когда
      FROM стороны с
      LEFT JOIN public.players p  ON p.id = с.игрок
      LEFT JOIN public.tournament_registrations z ON z.id = с.заявка
      LEFT JOIN public.players pz ON pz.id = z.player_id
     WHERE с.игрок IS NOT NULL
    UNION ALL
    SELECT 'замена',
           COALESCE(z.group_number::text, '—'),
           ч.side,
           COALESCE(pн.name, ч.new_name, '—'),
           COALESCE(pс.name, ч.old_name, '—'),
           COALESCE(z.group_number::text, '—'),
           'замена в заявке',
           ч.created_at
      FROM public.registration_changes ч
      LEFT JOIN public.players pс ON pс.id = ч.old_player_id
      LEFT JOIN public.players pн ON pн.id = ч.new_player_id
      LEFT JOIN public.tournament_registrations z ON z.id = ч.registration_id
     WHERE ч.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
)
SELECT * FROM разбор
 ORDER BY CASE WHEN состояние = 'ПЕРЕПИСАН' THEN 0
               WHEN что = 'замена' THEN 1 ELSE 2 END,
          когда, группа, номер, кто_в_матче;

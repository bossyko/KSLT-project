-- ============================================================
-- Мужские очки: две отложенные строки
-- ============================================================
--
-- При заливке мужских файлов две строки я отложил — было неясно, чьи они.
-- Разобрались:
--
--   «Мусаев Азат» из Challengers — это Азатбек Мусаев, записанный коротко.
--   Азат Мукаев в том же файле стоит отдельной строкой со своими 565, и в
--   сетке ТБШ Challengers они идут двумя разными ветками — это разные люди.
--
--   «Эсенбеков Сапарбек» из Tour — это Сабырбек Эсенбеков. Правильное
--   написание — Сабырбек.
--
-- Запускать после sql/ochki-muzhskie.sql; можно повторно.

BEGIN;

-- ---- 1. Строки истории ----

DELETE FROM public.rating_history
 WHERE tournament_id IS NULL
   AND player_id IN ('azatbek-musaev', 'sabyrbek-esenbekov')
   AND category_id IN ('challenger', 'tour')
   AND tournament_name IN ('Вторая категория, сентябрь 2025',
                           'Вторая категория, октябрь 2025',
                           'Вторая категория, сентябрь 2026');

INSERT INTO public.rating_history (player_id, tournament_name, points_earned, recorded_at, category_id)
VALUES
       ('azatbek-musaev',     'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'challenger'),
       ('sabyrbek-esenbekov', 'Вторая категория, октябрь 2025',  10, DATE '2025-10-31', 'tour'),
       ('sabyrbek-esenbekov', 'Вторая категория, сентябрь 2026', 25, DATE '2026-09-30', 'tour');

-- ---- 2. ТБШ Challengers: 15 очков Азатбеку ----

UPDATE public.tournament_results
   SET points_earned = 15
 WHERE tournament_id = 'tbsh-challengers-2026'
   AND player_id = 'azatbek-musaev';

INSERT INTO public.tournament_results (tournament_id, player_id, points_earned, season, category_id, round_reached)
SELECT 'tbsh-challengers-2026', 'azatbek-musaev', 15, 2026, 'challenger', ''
 WHERE NOT EXISTS (SELECT 1 FROM public.tournament_results
                    WHERE tournament_id = 'tbsh-challengers-2026'
                      AND player_id = 'azatbek-musaev');

UPDATE public.rating_history
   SET points_earned = 15, category_id = 'challenger'
 WHERE tournament_id = 'tbsh-challengers-2026'
   AND player_id = 'azatbek-musaev';

-- ---- 3. Очки разрядов ----
--
-- У Азатбека в Challengers 25 (10 + 15 за ТБШ), у Сабырбека в Tour 35.

DELETE FROM public.player_categories
 WHERE (player_id = 'azatbek-musaev'     AND category_id = 'challenger')
    OR (player_id = 'sabyrbek-esenbekov' AND category_id = 'tour');

INSERT INTO public.player_categories (player_id, category_id, points)
VALUES ('azatbek-musaev', 'challenger', 25),
       ('sabyrbek-esenbekov', 'tour', 35);

-- ---- 4. Общий рейтинг ----

UPDATE public.players p
   SET points = COALESCE((SELECT sum(pc.points) FROM public.player_categories pc
                           WHERE pc.player_id = p.id AND pc.closed_at IS NULL), 0)
 WHERE p.id IN ('azatbek-musaev', 'sabyrbek-esenbekov');

COMMIT;

-- ---- Проверка ----

SELECT p.name AS игрок, p.points AS общий,
       string_agg(pc.category_id || ' ' || pc.points, ', ' ORDER BY pc.points DESC) AS по_разрядам
  FROM public.players p
  JOIN public.player_categories pc ON pc.player_id = p.id
 WHERE p.id IN ('azatbek-musaev', 'sabyrbek-esenbekov', 'azat-mukaev')
 GROUP BY p.name, p.points
 ORDER BY p.name;
-- Ожидаем: Азат Мукаев — свои очки отдельно, Азатбек Мусаев — futures 175 и
-- challenger 25, Сабырбек Эсенбеков — challenger 70 и tour 35.

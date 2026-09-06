-- ============================================================
-- Проба: сетка «все места» на восемь человек
-- ============================================================
--
-- ТОЛЬКО ДЛЯ ТЕСТОВОЙ БАЗЫ.
--
-- В начале стоит защита: в боевой файл упадёт с понятной ошибкой и ничего
-- не сделает. Она нужна не для порядка — этот файл играет выдуманные матчи
-- за настоящие карточки, и в боевой они попали бы в историю встреч и в
-- значки. Одной надписи в шапке мало, окном редактора ошибиться легко.
--
-- Зачем проба: в боевой базе нет ни одного турнира с сеткой «все места»,
-- то есть на живых данных её никто не видел. Прежде чем переносить восемь
-- настоящих турниров, надо посмотреть, как она рисуется.
--
-- Восемь мест, а не шестнадцать: в тестовой базе всего пять мужских
-- карточек, поэтому берём игроков любого пола. Для отрисовки этого хватит:
-- три круга и семь мест.
--
-- Убрать за собой:
--   DELETE FROM tournaments WHERE id = 'trial-fic-8';
--   DELETE FROM players WHERE id LIKE 'trial-p%';

DO $$
BEGIN
    -- В боевой игроков сотни, в тестовой — единицы. Примета простая, зато
    -- честная.
    IF (SELECT count(*) FROM players) > 60 THEN
        RAISE EXCEPTION 'Похоже, это боевая база (% карточек игроков). Файл только для тестовой.',
            (SELECT count(*) FROM players);
END IF;
END $$;

BEGIN;

DELETE FROM matches WHERE tournament_id = 'trial-fic-8';
DELETE FROM tournament_registrations WHERE tournament_id = 'trial-fic-8';
DELETE FROM tournaments WHERE id = 'trial-fic-8';

INSERT INTO tournaments (
    id, title, description, date_start, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
             'trial-fic-8',
             'ПРОБА · сетка за все места',
             'Проверочный турнир: смотрим, как рисуется сетка «все места» и подписаны ли места.',
             current_date, 'masters', 'men', 'singles',
             'fic', 8, 8, 'ongoing', now()
         );

-- ---- Восемь карточек для пробы ----
-- В тестовой базе всего пять игроков, сетка на восемь из них не сложится.
-- Заводим своих, с отдельными опознавателями — их легко убрать за собой.

INSERT INTO players (id, name, gender, points)
SELECT 'trial-p' || n, 'Пробный игрок ' || n, 'men', 100 - n
  FROM generate_series(1, 8) AS n
ON CONFLICT (id) DO NOTHING;

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number)
SELECT 'trial-fic-8', 'trial-p' || n, 'approved', n
  FROM generate_series(1, 8) AS n;

-- ---- Первый круг: 1-8, 4-5, 3-6, 2-7 ----

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status)
SELECT 'trial-fic-8', 'FIC-R1', 1, пара.n,
       a.player_id, b.player_id, a.seed_number, b.seed_number, 'upcoming'
FROM (VALUES (1,1,8),(2,4,5),(3,3,6),(4,2,7)) AS пара(n, s1, s2)
         JOIN tournament_registrations a
              ON a.tournament_id = 'trial-fic-8' AND a.seed_number = пара.s1
         JOIN tournament_registrations b
              ON b.tournament_id = 'trial-fic-8' AND b.seed_number = пара.s2;

-- ---- Второй и третий круги: пустые, база расставит сама ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'trial-fic-8', 'FIC-R' || r, r, m, 'upcoming'
FROM generate_series(2, 3) AS r, generate_series(1, 4) AS m;

COMMIT;

-- ============================================================
-- Играем турнир до конца
-- ============================================================
-- Победителем везде первый: важна не правдоподобность, а то, как сетка
-- нарисуется и разложатся ли места.

DO $$
DECLARE
к integer;
    м record;
BEGIN
FOR к IN 1..3 LOOP
        FOR м IN
SELECT id, player1_id FROM matches
WHERE tournament_id = 'trial-fic-8' AND round_number = к
  AND player1_id IS NOT NULL AND player2_id IS NOT NULL
  AND winner_id IS NULL
ORDER BY match_order
    LOOP
UPDATE matches
SET score = '6/4 6/3', winner_id = м.player1_id,
    status = 'completed', played_at = now()
WHERE id = м.id;
END LOOP;
END LOOP;
END $$;

SELECT round_number,
       count(*) AS матчей,
       count(*) FILTER (WHERE winner_id IS NOT NULL) AS сыграно,
    count(*) FILTER (WHERE player1_id IS NULL OR player2_id IS NULL) AS неполных
FROM matches
WHERE tournament_id = 'trial-fic-8'
GROUP BY round_number
ORDER BY round_number;

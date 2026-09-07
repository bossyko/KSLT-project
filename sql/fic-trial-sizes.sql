-- ============================================================
-- Проба сетки «все места» на 8, 16, 32 и 64
-- ============================================================
--
-- ТОЛЬКО ДЛЯ ТЕСТОВОЙ БАЗЫ.
--
-- Сетки заполняются целиком и доигрываются до конца. Победителем везде
-- становится первый — так проверяется не правдоподобие, а расстановка:
-- куда база уводит победителя и проигравшего.
--
-- Убрать за собой:
--   DELETE FROM tournaments WHERE id LIKE 'trial-fic-%';
--   DELETE FROM players WHERE id LIKE 'trial-p%';

DO $$
BEGIN
    IF (SELECT count(*) FROM players WHERE id NOT LIKE 'trial-p%') > 60 THEN
        RAISE EXCEPTION 'Похоже, это боевая база. Файл только для тестовой.';
    END IF;
END $$;

BEGIN;

INSERT INTO players (id, name, gender)
SELECT 'trial-p' || n, 'Пробный игрок ' || n, 'men'
  FROM generate_series(1, 64) AS n
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    размер integer;
    кругов integer;
    ид     text;
BEGIN
    FOREACH размер IN ARRAY ARRAY[8, 16, 32, 64] LOOP
        ид := 'trial-fic-' || размер;
        кругов := log(2, размер::numeric)::int;

        DELETE FROM matches WHERE tournament_id = ид;
        DELETE FROM tournament_registrations WHERE tournament_id = ид;
        DELETE FROM tournaments WHERE id = ид;

        INSERT INTO tournaments (id, title, description, date_start, date_end,
                                 category_id, gender, format, bracket_type,
                                 draw_size, max_participants, status, published_at)
        VALUES (ид, 'ПРОБА · все места, ' || размер, 'Проверка расстановки.',
                current_date, current_date + 30, 'masters', 'men', 'singles',
                'fic', размер, размер, 'ongoing', now());

        INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number)
        SELECT ид, 'trial-p' || n, 'approved', n FROM generate_series(1, размер) AS n;

        INSERT INTO matches (tournament_id, round, round_number, match_order,
                             player1_id, player2_id, seed1, seed2, status)
        SELECT ид, 'FIC-R1', 1, n,
               'trial-p' || (2 * n - 1), 'trial-p' || (2 * n),
               2 * n - 1, 2 * n, 'upcoming'
          FROM generate_series(1, размер / 2) AS n;

        INSERT INTO matches (tournament_id, round, round_number, match_order, status)
        SELECT ид, 'FIC-R' || r, r, m, 'upcoming'
          FROM generate_series(2, кругов) AS r,
               generate_series(1, размер / 2) AS m;
    END LOOP;
END $$;

COMMIT;

DO $$
DECLARE
    ид text;
    к  integer;
    м  record;
BEGIN
    FOREACH ид IN ARRAY ARRAY['trial-fic-8','trial-fic-16','trial-fic-32','trial-fic-64'] LOOP
        FOR к IN 1..6 LOOP
            FOR м IN
                SELECT id, player1_id FROM matches
                 WHERE tournament_id = ид AND round_number = к
                   AND player1_id IS NOT NULL AND player2_id IS NOT NULL
                   AND winner_id IS NULL
                 ORDER BY match_order
            LOOP
                UPDATE matches SET score = '6/4 6/3', winner_id = м.player1_id,
                       status = 'completed', played_at = now()
                 WHERE id = м.id;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ---- Итог ----
-- Неполных должно быть ноль везде.

SELECT tournament_id AS турнир, round_number AS круг,
       count(*) AS матчей, count(winner_id) AS сыграно,
       count(*) FILTER (WHERE player1_id IS NULL OR player2_id IS NULL) AS неполных
  FROM matches WHERE tournament_id LIKE 'trial-fic-%'
 GROUP BY tournament_id, round_number ORDER BY tournament_id, round_number;

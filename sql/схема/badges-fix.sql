-- ============================================
-- Значки: чемпион/финалист не тем людям + значки не снимаются
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- ЧТО БЫЛО НЕ ТАК
--
-- 1. Финалом считался матч с round_number = 1 AND match_order = 1.
--    Нумерация раундов в базе растёт: 1 — первый круг, финал — последний.
--    То есть «финалом» назначался первый матч сетки. На живом турнире
--    (сетка 8) это дало: «Чемпион» — Азату Жаныбекову, который финал
--    проиграл 2:6, «Финалист» — Ивану Иванову, вылетевшему в первом же
--    четвертьфинале. Настоящий чемпион, Константин Хан, не получил ничего.
--
--    Правильный источник лежит рядом и уже заполнен: tournament_results,
--    где round_reached = 'W' — чемпион, 'F' — проигравший финал.
--
-- 2. Функция умела только выдавать значки. Если условие переставало
--    выполняться, значок оставался навсегда: у Ивана висит «Первая победа»
--    при нуле побед — победа была в тестовых данных, матчи удалили.
--    Теперь значки синхронизируются: заслуженные выдаются, незаслуженные
--    снимаются. Ручные (condition_type = 'manual') не трогаются.
--
-- 3. Одиночный рейтинг: парные результаты в зачёт чемпионства не идут.

-- ---- Куда я попал? ----------------------------------------------------
-- Выполнить первым делом. Боевая база — три сотни игроков и знакомые
-- фамилии. Тестовая — три строки с именами вида test-*. Файлы ниже
-- рассчитаны на боевую.
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;

CREATE OR REPLACE FUNCTION "public"."check_and_award_badges"("p_player_id" "text")
RETURNS "text"[]
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    new_badges TEXT[] := '{}';
    player_rec RECORD;
    badge RECORD;
    val INTEGER;
    earned BOOLEAN;
    has_badge BOOLEAN;
    t_id TEXT;
    lost_set BOOLEAN;
    m_rec RECORD;
    sets_arr TEXT[];
    s_item TEXT;
    parts TEXT[];
    p1_games INTEGER;
    p2_games INTEGER;
    i INTEGER;
BEGIN
    SELECT * INTO player_rec FROM players WHERE id = p_player_id;
    IF NOT FOUND THEN RETURN new_badges; END IF;

    FOR badge IN SELECT * FROM badge_definitions WHERE condition_type != 'manual' ORDER BY sort_order LOOP
        earned := false;

        CASE badge.condition_type

            WHEN 'matches_played' THEN
                SELECT COUNT(*) INTO val FROM matches
                    WHERE (player1_id = p_player_id OR player2_id = p_player_id)
                    AND status = 'completed' AND winner_id IS NOT NULL;
                earned := val >= badge.condition_value;

            WHEN 'wins' THEN
                earned := COALESCE(player_rec.wins, 0) >= badge.condition_value;

            WHEN 'tournaments_played' THEN
                SELECT COUNT(DISTINCT tournament_id) INTO val FROM tournament_registrations
                    WHERE player_id = p_player_id AND status IN ('approved', 'draw');
                earned := val >= badge.condition_value;

            WHEN 'streak' THEN
                -- Серия побед подряд с начала формы (свежие матчи идут первыми)
                val := 0;
                IF player_rec.form IS NOT NULL AND array_length(player_rec.form, 1) > 0 THEN
                    FOR i IN 1..array_length(player_rec.form, 1) LOOP
                        IF player_rec.form[i] = 'W' THEN val := val + 1;
                        ELSE EXIT;
                        END IF;
                    END LOOP;
                END IF;
                earned := val >= badge.condition_value;

            WHEN 'champion' THEN
                SELECT COUNT(*) INTO val FROM tournament_results
                    WHERE player_id = p_player_id AND round_reached = 'W'
                    AND COALESCE(is_doubles, false) = false;
                earned := val >= badge.condition_value;

            WHEN 'champion_count' THEN
                SELECT COUNT(*) INTO val FROM tournament_results
                    WHERE player_id = p_player_id AND round_reached = 'W'
                    AND COALESCE(is_doubles, false) = false;
                earned := val >= badge.condition_value;

            WHEN 'finalist' THEN
                -- Именно проигранный финал: у победителя есть свой значок
                SELECT COUNT(*) INTO val FROM tournament_results
                    WHERE player_id = p_player_id AND round_reached = 'F'
                    AND COALESCE(is_doubles, false) = false;
                earned := val >= badge.condition_value;

            WHEN 'no_set_loss' THEN
                -- Выигранный турнир, в котором не отдан ни один сет
                FOR t_id IN
                    SELECT tr.tournament_id FROM tournament_results tr
                    WHERE tr.player_id = p_player_id AND tr.round_reached = 'W'
                    AND COALESCE(tr.is_doubles, false) = false
                LOOP
                    lost_set := false;
                    FOR m_rec IN
                        SELECT score, player1_id FROM matches
                        WHERE tournament_id = t_id
                        AND (player1_id = p_player_id OR player2_id = p_player_id)
                        AND status = 'completed' AND score IS NOT NULL AND score != 'BYE'
                    LOOP
                        sets_arr := string_to_array(m_rec.score, ' ');
                        IF sets_arr IS NOT NULL THEN
                            FOREACH s_item IN ARRAY sets_arr LOOP
                                parts := string_to_array(s_item, '/');
                                IF array_length(parts, 1) = 2 THEN
                                    p1_games := safe_int(parts[1]);
                                    p2_games := safe_int(parts[2]);
                                    IF p1_games IS NOT NULL AND p2_games IS NOT NULL THEN
                                        IF (m_rec.player1_id = p_player_id AND p1_games < p2_games)
                                        OR (m_rec.player1_id != p_player_id AND p2_games < p1_games) THEN
                                            lost_set := true;
                                        END IF;
                                    END IF;
                                END IF;
                            END LOOP;
                        END IF;
                    END LOOP;
                    IF NOT lost_set THEN
                        earned := true;
                        EXIT;
                    END IF;
                END LOOP;

            WHEN 'upset' THEN
                SELECT COUNT(*) INTO val FROM matches m
                    JOIN players p1 ON p1.id = m.player1_id
                    JOIN players p2 ON p2.id = m.player2_id
                    WHERE m.winner_id = p_player_id AND m.status = 'completed'
                    AND (
                        (m.player1_id = p_player_id AND p2.points - p1.points >= badge.condition_value)
                        OR (m.player2_id = p_player_id AND p1.points - p2.points >= badge.condition_value)
                    );
                earned := val > 0;

            WHEN 'rank' THEN
                -- Игрок может держать очки сразу в двух категориях, и очки
                -- лежат в двух местах: player_categories заполнена не для
                -- всех, у остальных они в самой карточке игрока. Считать
                -- место по одной таблице нельзя — в player_categories два
                -- десятка человек, и каждый из них выглядел бы первым.
                -- Сводим оба источника, карточка идёт в ход только там, где
                -- отдельной записи по категории нет.
                WITH standings AS (
                    SELECT pc.player_id, pc.category_id, pc.points
                    FROM player_categories pc WHERE pc.points > 0
                    UNION ALL
                    SELECT p.id, p.category_id, p.points
                    FROM players p
                    WHERE p.points > 0 AND p.category_id IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM player_categories pc2
                          WHERE pc2.player_id = p.id AND pc2.category_id = p.category_id)
                )
                SELECT MIN(pos) INTO val FROM (
                    SELECT (SELECT COUNT(*) + 1 FROM standings o
                            WHERE o.category_id = s.category_id AND o.points > s.points) AS pos
                    FROM standings s WHERE s.player_id = p_player_id
                ) ranks;
                earned := val IS NOT NULL AND val <= badge.condition_value;

            WHEN 'membership' THEN
                earned := EXISTS (SELECT 1 FROM memberships
                    WHERE profile_id IN (SELECT id FROM profiles WHERE player_id = p_player_id)
                    AND status = 'active');

            WHEN 'first_year' THEN
                earned := player_rec.created_at < '2026-01-01'::timestamptz;

            WHEN 'season_count' THEN
                val := EXTRACT(YEAR FROM age(now(), player_rec.created_at))::int;
                earned := val >= badge.condition_value;

            WHEN 'domination' THEN
                SELECT MAX(cnt) INTO val FROM (
                    SELECT COUNT(*) cnt FROM matches
                    WHERE winner_id = p_player_id AND status = 'completed'
                    GROUP BY CASE WHEN player1_id = p_player_id THEN player2_id ELSE player1_id END
                ) sub;
                earned := COALESCE(val, 0) >= badge.condition_value;

            ELSE
                earned := false;

        END CASE;

        has_badge := EXISTS (SELECT 1 FROM player_badges
            WHERE player_id = p_player_id AND badge_id = badge.id);

        IF earned AND NOT has_badge THEN
            INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
            new_badges := array_append(new_badges, badge.id);
        ELSIF NOT earned AND has_badge THEN
            -- Условие больше не выполняется: значок снимаем
            DELETE FROM player_badges
                WHERE player_id = p_player_id AND badge_id = badge.id;
        END IF;

    END LOOP;

    RETURN new_badges;
END;
$$;

ALTER FUNCTION "public"."check_and_award_badges"("p_player_id" "text") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("p_player_id" "text") TO "service_role";


-- ---- Второй, никем не читаемый механизм значков ----------------------
--
-- Триггер recalculate_badges на каждую запись в players перезаписывал
-- колонку players.badges своими обозначениями (top1, streak, newbie,
-- breakthrough, champion). В badge_definitions таких нет, и кабинет их
-- никогда не показывал — он читает таблицу player_badges. Колонка
-- нигде не используется.

DROP TRIGGER IF EXISTS "trg_recalculate_badges" ON "public"."players";
DROP FUNCTION IF EXISTS "public"."recalculate_badges"();
ALTER TABLE "public"."players" DROP COLUMN IF EXISTS "badges";

-- Копия check_and_award_badges, которую никто не вызывает
DROP FUNCTION IF EXISTS "public"."check_player_badges"("p_player_id" "text");


-- Пересчёт по игрокам — отдельным файлом: sql/badges-recalc.sql
-- В боевой базе игроков три сотни, и одним запросом он не успевает
-- вернуться — редактор отваливается с «Failed to fetch».

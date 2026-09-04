-- ============================================================
-- Значки считают и баттлы
-- ============================================================
--
-- Константин выиграл баттл 6/3 6/4 и получил значок «Первый матч», а
-- «Первую победу» — нет. Потому что победы значок брал из счётчика в
-- карточке игрока, а туда идут только рейтинговые турниры: баттлы и
-- дружеские матчи в зачёт рейтинга не входят, и это правильно.
--
-- Получалось, что два соседних значка живут по разным правилам. «Первый
-- матч» баттл засчитывал, «Первая победа» не засчитала бы никогда, даже
-- если человек выиграл.
--
-- Решили: значок — про сыгранное, а не про очки. Победы и серию побед
-- считаем по самим матчам, включая баттлы. Рейтинг при этом не трогаем:
-- он как считался по турнирам, так и считается.
--
-- Меняются два условия из пятнадцати, остальное в функции — без изменений.
--
-- Функция сама снимает значки, которые больше не заслужены, поэтому
-- пересчёт после выкладки безопасен.
--
-- Файл меняет базу. Читающие запросы — в badges-count-battles-check.sql.

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
                -- Считаем по сыгранным матчам, а не по счётчику в карточке.
                -- В карточке лежат только рейтинговые турниры: баттл туда не
                -- идёт намеренно, и человек, выигравший баттл, никогда не
                -- получал бы «Первую победу». Значок — про сыгранное, а не
                -- про очки
                SELECT COUNT(*) INTO val FROM matches
                    WHERE winner_id = p_player_id AND status = 'completed';
                earned := val >= badge.condition_value;

            WHEN 'tournaments_played' THEN
                SELECT COUNT(DISTINCT tournament_id) INTO val FROM tournament_registrations
                    WHERE player_id = p_player_id AND status IN ('approved', 'draw');
                earned := val >= badge.condition_value;

            WHEN 'streak' THEN
                -- Серия побед подряд, считая с последнего матча. Раньше брали
                -- поле «форма» из карточки, а туда попадают только рейтинговые
                -- турниры — баттлы серию не продолжали и не обрывали
                val := 0;
                FOR m_rec IN
                    SELECT winner_id FROM matches
                     WHERE (player1_id = p_player_id OR player2_id = p_player_id)
                       AND status = 'completed' AND winner_id IS NOT NULL
                     ORDER BY played_at DESC NULLS LAST, created_at DESC
                LOOP
                    IF m_rec.winner_id = p_player_id THEN val := val + 1;
                    ELSE EXIT;
                    END IF;
                END LOOP;
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

ALTER FUNCTION public.check_and_award_badges(text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.check_and_award_badges(text) TO authenticated;
GRANT ALL ON FUNCTION public.check_and_award_badges(text) TO service_role;

-- ---- Пересчёт для всех, у кого есть сыгранные матчи ----
-- Тем, кто выиграл баттл, значок выдастся задним числом.
DO $recalc$
DECLARE
    p RECORD;
BEGIN
    FOR p IN
        SELECT DISTINCT pl.id
          FROM players pl
          JOIN matches m ON (m.player1_id = pl.id OR m.player2_id = pl.id)
         WHERE m.status = 'completed'
    LOOP
        PERFORM public.check_and_award_badges(p.id);
    END LOOP;
END
$recalc$;

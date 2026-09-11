-- ============================================
-- Достижения: сорок четыре вместо шести
-- ============================================
--
-- В справочнике было шесть достижений, а на главной обещали двадцать семь —
-- список висел прямо в разметке и ни к чему не был привязан. Человек читал
-- про «Сенсацию» и «Доминатора», которых никто никогда не получал.
--
-- Здесь заводим все сорок четыре по-настоящему: с правилом выдачи, с
-- названиями и описаниями на трёх языках. Справочник один, из него читают и
-- сайт, и приложение.
--
-- Почти все правила функция начисления уже умеет считать. Новое одно —
-- «Первый вызов»; ради него функция переписана с добавленной веткой.
--
-- Ещё добавляем отметку о показе: без неё поздравление всплывало бы при
-- каждом входе, а не один раз.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT (SELECT count(*) FROM players)           AS игроков,
       (SELECT count(*) FROM badge_definitions) AS достижений_сейчас,
       (SELECT count(*) FROM player_badges)     AS выдано_сейчас;


-- ---- 2. Отметка о показе ----------------------------------------------
ALTER TABLE public.player_badges
    ADD COLUMN IF NOT EXISTS seen_at timestamptz;

COMMENT ON COLUMN public.player_badges.seen_at IS
    'Когда игроку показали поздравление. NULL — ещё не показывали.';

-- Уже выданные считаем показанными: иначе при первом же входе на игрока
-- вывалится десяток поздравлений разом
UPDATE public.player_badges SET seen_at = now() WHERE seen_at IS NULL;


-- ---- 3. Справочник ------------------------------------------------------
INSERT INTO public.badge_definitions
    (id, name, name_en, name_kg, icon, description, description_en, description_kg,
     condition_type, condition_value, sort_order)
VALUES
    ('first_match', 'Первый матч', 'First match', 'Биринчи матч', '🎾', 'Сыграть первый матч', 'Play your first match', 'Биринчи оюнуңду ойно', 'matches_played', 1, 1),
    ('first_win', 'Первая победа', 'First win', 'Биринчи жеңиш', '🥇', 'Выиграть первый матч', 'Win your first match', 'Биринчи матчты утуп ал', 'wins', 1, 2),
    ('first_tournament', 'Первый турнир', 'First tournament', 'Биринчи мелдеш', '🎯', 'Сыграть в турнире', 'Play in a tournament', 'Мелдеште ойно', 'tournaments_played', 1, 3),
    ('member', 'Член КСЛТ', 'KSLT member', 'КСЛТ мүчөсү', '💚', 'Действующее членство', 'Active membership', 'Активдүү мүчөлүк', 'membership', 0, 4),
    ('first_challenge', 'Первый вызов', 'First challenge', 'Биринчи чакырык', '🤝', 'Принять или отправить вызов', 'Accept or send a challenge', 'Чакырык кабыл ал же жөнөт', 'challenges', 1, 5),
    ('matches_10', 'Десятка', 'Ten matches', 'Ондук', '🔟', 'Сыграть 10 матчей', 'Play 10 matches', '10 матч ойно', 'matches_played', 10, 10),
    ('matches_25', 'Четвертак', '25 matches', 'Чейрек жүз', '🎿', 'Сыграть 25 матчей', 'Play 25 matches', '25 матч ойно', 'matches_played', 25, 11),
    ('matches_50', 'Полтинник', '50 matches', 'Элүүлүк', '💪', 'Сыграть 50 матчей', 'Play 50 matches', '50 матч ойно', 'matches_played', 50, 12),
    ('matches_100', 'Сотня', '100 matches', 'Жүздүк', '💯', 'Сыграть 100 матчей', 'Play 100 matches', '100 матч ойно', 'matches_played', 100, 13),
    ('matches_250', 'Двести пятьдесят', '250 matches', 'Эки жүз элүү', '🗿', 'Сыграть 250 матчей', 'Play 250 matches', '250 матч ойно', 'matches_played', 250, 14),
    ('matches_500', 'Пятьсот', '500 matches', 'Беш жүз', '🧱', 'Сыграть 500 матчей', 'Play 500 matches', '500 матч ойно', 'matches_played', 500, 15),
    ('wins_5', 'Пятёрка побед', '5 wins', 'Беш жеңиш', '⭐', 'Одержать 5 побед', 'Win 5 matches', '5 жеңишке жет', 'wins', 5, 20),
    ('wins_10', 'Десять побед', '10 wins', 'Он жеңиш', '🌟', 'Одержать 10 побед', 'Win 10 matches', '10 жеңишке жет', 'wins', 10, 21),
    ('wins_25', 'Двадцать пять', '25 wins', 'Жыйырма беш', '🏅', 'Одержать 25 побед', 'Win 25 matches', '25 жеңишке жет', 'wins', 25, 22),
    ('wins_50', 'Полсотни', '50 wins', 'Элүү жеңиш', '👑', 'Одержать 50 побед', 'Win 50 matches', '50 жеңишке жет', 'wins', 50, 23),
    ('wins_100', 'Сотня побед', '100 wins', 'Жүз жеңиш', '🦁', 'Одержать 100 побед', 'Win 100 matches', '100 жеңишке жет', 'wins', 100, 24),
    ('streak_3', 'Серия 3', 'Streak 3', 'Катар 3', '🔥', 'Три победы подряд', 'Three wins in a row', 'Катары менен үч жеңиш', 'streak', 3, 30),
    ('streak_5', 'Серия 5', 'Streak 5', 'Катар 5', '⚡', 'Пять побед подряд', 'Five wins in a row', 'Катары менен беш жеңиш', 'streak', 5, 31),
    ('streak_10', 'Серия 10', 'Streak 10', 'Катар 10', '🚀', 'Десять побед подряд', 'Ten wins in a row', 'Катары менен он жеңиш', 'streak', 10, 32),
    ('streak_15', 'Серия 15', 'Streak 15', 'Катар 15', '☄️', 'Пятнадцать побед подряд', 'Fifteen wins in a row', 'Катары менен он беш жеңиш', 'streak', 15, 33),
    ('tour_5', 'Завсегдатай', '5 tournaments', 'Туруктуу катышуучу', '📅', 'Сыграть 5 турниров', 'Play 5 tournaments', '5 мелдеште ойно', 'tournaments_played', 5, 40),
    ('tour_10', 'Постоянный', '10 tournaments', 'Он мелдеш', '🗓️', 'Сыграть 10 турниров', 'Play 10 tournaments', '10 мелдеште ойно', 'tournaments_played', 10, 41),
    ('tour_25', 'Ветеран кортов', '25 tournaments', 'Корттордун ветераны', '🎪', 'Сыграть 25 турниров', 'Play 25 tournaments', '25 мелдеште ойно', 'tournaments_played', 25, 42),
    ('tour_50', 'Пятьдесят турниров', '50 tournaments', 'Элүү мелдеш', '🏟️', 'Сыграть 50 турниров', 'Play 50 tournaments', '50 мелдеште ойно', 'tournaments_played', 50, 43),
    ('champion', 'Чемпион', 'Champion', 'Чемпион', '🏆', 'Выиграть турнир', 'Win a tournament', 'Мелдешти утуп ал', 'champion', 1, 50),
    ('champion_3', 'Чемпион х3', 'Champion x3', 'Чемпион х3', '👑', 'Выиграть три турнира', 'Win three tournaments', 'Үч мелдешти утуп ал', 'champion_count', 3, 51),
    ('champion_5', 'Чемпион х5', 'Champion x5', 'Чемпион х5', '💫', 'Выиграть пять турниров', 'Win five tournaments', 'Беш мелдешти утуп ал', 'champion_count', 5, 52),
    ('champion_10', 'Чемпион х10', 'Champion x10', 'Чемпион х10', '🔱', 'Выиграть десять турниров', 'Win ten tournaments', 'Он мелдешти утуп ал', 'champion_count', 10, 53),
    ('finalist', 'Финалист', 'Finalist', 'Финалист', '🥈', 'Дойти до финала', 'Reach a final', 'Финалга чык', 'finalist', 1, 54),
    ('no_set_loss', 'Безупречный', 'Flawless', 'Мүлтүксүз', '💎', 'Выиграть турнир, не отдав ни сета', 'Win a tournament without losing a set', 'Бир да сет жоготпой мелдешти ут', 'no_set_loss', 1, 55),
    ('upset', 'Сенсация', 'Upset', 'Сенсация', '😱', 'Обыграть соперника намного выше по рейтингу', 'Beat an opponent ranked far above you', 'Рейтингде алда канча жогору каршылашты ут', 'upset', 1, 60),
    ('rank_10', 'Топ-10', 'Top 10', 'Топ-10', '📈', 'Войти в десятку своей категории', 'Reach the top 10 of your category', 'Категорияңдын ондугуна кир', 'rank', 10, 61),
    ('rank_3', 'Топ-3', 'Top 3', 'Топ-3', '🎖️', 'Войти в тройку своей категории', 'Reach the top 3 of your category', 'Категорияңдын үчтүгүнө кир', 'rank', 3, 62),
    ('rank_1', 'Первый номер', 'Number one', 'Биринчи номер', '🥇', 'Стать первым в своей категории', 'Become number one in your category', 'Категорияңда биринчи бол', 'rank', 1, 63),
    ('domination', 'Доминатор', 'Dominator', 'Доминатор', '😤', 'Пять побед над одним соперником', 'Five wins over the same opponent', 'Бир каршылашты беш жолу ут', 'domination', 5, 64),
    ('pioneer', 'Пионер', 'Pioneer', 'Пионер', '⏰', 'Вступил в первый год КСЛТ', 'Joined in the first year of KSLT', 'КСЛТтин биринчи жылында кошулган', 'first_year', 1, 70),
    ('season_1', 'Сезон', 'One season', 'Бир сезон', '🎗️', 'Отыграть один полный сезон', 'Play a full season', 'Бир толук сезон ойно', 'season_count', 1, 71),
    ('veteran_3', 'Ветеран 3', 'Veteran 3', 'Ветеран 3', '🏵️', 'Три сезона в КСЛТ', 'Three seasons in KSLT', 'КСЛТте үч сезон', 'season_count', 3, 72),
    ('veteran_5', 'Ветеран 5', 'Veteran 5', 'Ветеран 5', '🎀', 'Пять сезонов в КСЛТ', 'Five seasons in KSLT', 'КСЛТте беш сезон', 'season_count', 5, 73),
    ('veteran_10', 'Ветеран 10', 'Veteran 10', 'Ветеран 10', '🕰️', 'Десять сезонов в КСЛТ', 'Ten seasons in KSLT', 'КСЛТте он сезон', 'season_count', 10, 74),
    ('fair_play', 'Дух игры', 'Spirit of the game', 'Оюндун руху', '🫱', 'За честную игру и поведение на корте', 'For fair play and conduct on court', 'Адилет оюн жана корттогу жүрүм-турум үчүн', 'manual', 0, 80),
    ('organizer', 'Организатор', 'Organizer', 'Уюштуруучу', '🎤', 'Помог провести турнир', 'Helped run a tournament', 'Мелдеш өткөрүүгө жардам берди', 'manual', 0, 81),
    ('umpire', 'Судья', 'Umpire', 'Калыс', '⚖️', 'Судил матчи КСЛТ', 'Umpired KSLT matches', 'КСЛТ матчтарын калыстады', 'manual', 0, 82),
    ('international', 'Международник', 'International', 'Эл аралык', '🌍', 'Сыграл за КСЛТ на международном турнире', 'Played for KSLT at an international tournament', 'Эл аралык мелдеште КСЛТ үчүн ойноду', 'manual', 0, 83)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    name_kg = EXCLUDED.name_kg,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    description_en = EXCLUDED.description_en,
    description_kg = EXCLUDED.description_kg,
    condition_type = EXCLUDED.condition_type,
    condition_value = EXCLUDED.condition_value,
    sort_order = EXCLUDED.sort_order;


-- ---- 4. Функция начисления: добавлена ветка «Первый вызов» --------------
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

            -- Вызовы: считаем и отправленные, и принятые. Игрок здесь виден
            -- по карточке, а не по аккаунту: аккаунт может быть удалён
            WHEN 'challenges' THEN
                SELECT COUNT(*) INTO val FROM challenges
                WHERE (challenger_player_id = p_player_id OR opponent_player_id = p_player_id)
                  AND status IN ('accepted', 'completed');
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

ALTER FUNCTION "public"."check_and_award_badges"("text") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("text") TO "service_role";


-- ---- 5. Отметка о показе: ставит сам игрок -----------------------------
--
-- У таблицы достижений право менять есть только у администраторов, и это
-- правильно: иначе игрок мог бы подправить себе дату получения. Но отметку
-- «поздравление показано» ставит он сам, заходя на сайт.
--
-- Поэтому не открываем ему таблицу, а даём одну функцию, которая делает
-- ровно одно действие и только со своими записями.

CREATE OR REPLACE FUNCTION public.mark_badges_seen()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    pid text;
    n   integer;
BEGIN
    SELECT player_id INTO pid FROM profiles WHERE id = auth.uid();
    IF pid IS NULL THEN
        RETURN 0;
    END IF;

    UPDATE player_badges
    SET seen_at = now()
    WHERE player_id = pid AND seen_at IS NULL;

    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
END;
$$;

ALTER FUNCTION public.mark_badges_seen() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.mark_badges_seen() TO authenticated;


-- ---- 6. Пересчёт по всем игрокам ---------------------------------------
DO $do$
DECLARE p record;
BEGIN
    FOR p IN SELECT id FROM players LOOP
        PERFORM check_and_award_badges(p.id);
    END LOOP;
END $do$;

-- Всё, что выдалось прямо сейчас, тоже помечаем показанным: это не новые
-- достижения игрока, а наведение порядка в справочнике
UPDATE public.player_badges SET seen_at = now() WHERE seen_at IS NULL;


-- ---- 7. ПРОВЕРКА -------------------------------------------------------
SELECT
    (SELECT count(*) FROM badge_definitions)                          AS достижений_всего,
    (SELECT count(*) FROM badge_definitions WHERE name_en IS NULL
        OR name_kg IS NULL)                                           AS без_перевода,
    (SELECT count(*) FROM badge_definitions
        WHERE condition_type NOT IN ('matches_played','wins','tournaments_played',
            'streak','champion','champion_count','finalist','no_set_loss','upset',
            'rank','membership','first_year','season_count','domination',
            'challenges','manual'))                                   AS правил_без_обработки,
    (SELECT count(*) FROM player_badges)                              AS выдано_после,
    (SELECT count(*) FROM player_badges WHERE seen_at IS NULL)        AS непоказанных,
    (SELECT count(*) FROM pg_proc WHERE proname = 'mark_badges_seen')  AS функция_отметки;

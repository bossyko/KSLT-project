-- ============================================
-- KSLT Badges System Migration
-- Tables: badge_definitions, player_badges
-- Function: check_and_award_badges
-- Trigger: on players UPDATE
-- ============================================

-- ============================================
-- 1a. Badge Definitions Table
-- ============================================
CREATE TABLE IF NOT EXISTS badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  name_kg TEXT,
  icon TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  description_kg TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 1b. Insert 27 Badges
-- ============================================
INSERT INTO badge_definitions (id, icon, name, name_en, name_kg, description, description_en, description_kg, condition_type, condition_value, sort_order) VALUES
  ('first_match',    '🎾', 'Первый матч',    'First Match',     'Биринчи матч',    'Сыграть первый матч',                    'Play your first match',                  'Биринчи матчыңызды ойноңуз',           'matches_played', 1,   1),
  ('first_win',      '🏅', 'Первая победа',  'First Win',       'Биринчи жеңиш',   'Одержать первую победу',                 'Win your first match',                   'Биринчи жеңишке жетиңиз',              'wins',           1,   2),
  ('first_tournament','🎯','Первый турнир',   'First Tournament','Биринчи мелдеш',   'Принять участие в турнире',              'Participate in a tournament',             'Мелдешке катышуу',                     'tournaments_played', 1, 3),
  ('matches_10',     '🔟', 'Десятка',         'Ten Games',       'Ондук',            'Сыграть 10 матчей',                      'Play 10 matches',                        '10 матч ойноо',                        'matches_played', 10,  4),
  ('matches_50',     '💪', 'Полтинник',       'Fifty Games',     'Элүүлүк',          'Сыграть 50 матчей',                      'Play 50 matches',                        '50 матч ойноо',                        'matches_played', 50,  5),
  ('matches_100',    '💯', 'Сотня',           'Century',         'Жүздүк',           'Сыграть 100 матчей',                     'Play 100 matches',                       '100 матч ойноо',                       'matches_played', 100, 6),
  ('wins_5',         '⭐', '5 побед',         '5 Wins',          '5 жеңиш',          'Одержать 5 побед',                       'Win 5 matches',                          '5 жеңишке жетүү',                      'wins',           5,   7),
  ('wins_10',        '🌟', '10 побед',        '10 Wins',         '10 жеңиш',         'Одержать 10 побед',                      'Win 10 matches',                         '10 жеңишке жетүү',                     'wins',           10,  8),
  ('wins_25',        '🏆', '25 побед',        '25 Wins',         '25 жеңиш',         'Одержать 25 побед',                      'Win 25 matches',                         '25 жеңишке жетүү',                     'wins',           25,  9),
  ('wins_50',        '👑', '50 побед',        '50 Wins',         '50 жеңиш',         'Одержать 50 побед',                      'Win 50 matches',                         '50 жеңишке жетүү',                     'wins',           50,  10),
  ('streak_3',       '🔥', 'Серия 3',         'Streak 3',        '3 жеңиш сериясы',  'Выиграть 3 матча подряд',               'Win 3 matches in a row',                 '3 матчты катары менен жеңүү',          'streak',         3,   11),
  ('streak_5',       '⚡', 'Серия 5',         'Streak 5',        '5 жеңиш сериясы',  'Выиграть 5 матчей подряд',              'Win 5 matches in a row',                 '5 матчты катары менен жеңүү',          'streak',         5,   12),
  ('streak_10',      '🚀', 'Серия 10',        'Streak 10',       '10 жеңиш сериясы', 'Выиграть 10 матчей подряд',             'Win 10 matches in a row',                '10 матчты катары менен жеңүү',         'streak',         10,  13),
  ('champion',       '🏆', 'Чемпион',         'Champion',        'Чемпион',          'Выиграть турнир',                        'Win a tournament',                       'Мелдешти жеңүү',                       'champion',       1,   14),
  ('finalist',       '🥈', 'Финалист',        'Finalist',        'Финалист',         'Дойти до финала турнира',                'Reach a tournament final',               'Мелдештин финалына чыгуу',             'finalist',       1,   15),
  ('champion_x3',    '👑', 'Чемпион х3',      'Triple Champion', '3x Чемпион',       'Выиграть 3 турнира',                     'Win 3 tournaments',                      '3 мелдешти жеңүү',                     'champion_count', 3,   16),
  ('no_set_loss',    '💎', 'Без потерь',      'Flawless',        'Жоготуусуз',       'Выиграть турнир без потери сета',         'Win a tournament without losing a set',  'Сет жоготпой мелдешти жеңүү',          'no_set_loss',    0,   17),
  ('upset',          '😱', 'Сенсация',        'Giant Killer',    'Сенсация',         'Обыграть соперника с 500+ очков больше', 'Beat an opponent with 500+ more points', '500+ упай көп оппонентти жеңүү',       'upset',          500, 18),
  ('top_10',         '📈', 'Топ-10',          'Top 10',          'Топ-10',           'Войти в топ-10 категории',               'Reach top 10 in your category',          'Категорияңызда топ-10го кирүү',        'rank',           10,  19),
  ('top_1',          '🥇', 'Первый',          'Number One',      'Биринчи',          'Стать первым в категории',               'Become #1 in your category',             'Категорияңызда #1 болуу',              'rank',           1,   20),
  ('first_year',     '⏰', 'Первопроходец',   'Pioneer',         'Пионер',           'Зарегистрироваться в первый год KSLT',   'Register in KSLT''s first year',         'KSLT биринчи жылында катталуу',        'first_year',     0,   21),
  ('member',         '💚', 'Член КСЛТ',       'KSLT Member',     'КСЛТ мүчөсү',     'Оформить членство KSLT',                 'Get KSLT membership',                    'KSLT мүчөлүгүн алуу',                 'membership',     0,   22),
  ('veteran_3',      '🎖️','Ветеран 3',       'Veteran 3y',      '3 жыл ветеран',    'Играть в KSLT 3 года',                   'Play in KSLT for 3 years',               'KSLT де 3 жыл ойноо',                 'season_count',   3,   23),
  ('veteran_5',      '🏅', 'Ветеран 5',       'Veteran 5y',      '5 жыл ветеран',    'Играть в KSLT 5 лет',                    'Play in KSLT for 5 years',               'KSLT де 5 жыл ойноо',                 'season_count',   5,   24),
  ('challenge_accept','🤝','Принял вызов',    'Challenge Accepted','Чакырууну кабыл алды','Принять 5 вызовов на матч',          'Accept 5 match challenges',              '5 чакырууну кабыл алуу',              'manual',         5,   25),
  ('challenger',     '⚔️', 'Challenger',      'Challenger',       'Чакыруучу',        'Бросить 10 вызовов на матч',             'Send 10 match challenges',               '10 чакырууну жөнөтүү',                'manual',         10,  26),
  ('dominator',      '😤', 'Доминатор',       'Dominator',        'Доминатор',        'Обыграть одного соперника 5+ раз',       'Beat the same opponent 5+ times',        'Бир эле оппонентти 5+ жолу жеңүү',    'domination',     5,   27)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 1c. Player Badges Table
-- ============================================
CREATE TABLE IF NOT EXISTS player_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_player_badges_player ON player_badges(player_id);

-- ============================================
-- 1d. RLS Policies
-- ============================================
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badge_definitions' AND policyname = 'Public read badges') THEN
    CREATE POLICY "Public read badges" ON badge_definitions FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_badges' AND policyname = 'Public read player badges') THEN
    CREATE POLICY "Public read player badges" ON player_badges FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_badges' AND policyname = 'Staff manage badges') THEN
    CREATE POLICY "Staff manage badges" ON player_badges FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager')));
  END IF;
END $$;

-- ============================================
-- 1e. Function: check_and_award_badges
-- Returns array of newly awarded badge IDs
-- ============================================
CREATE OR REPLACE FUNCTION check_and_award_badges(p_player_id TEXT)
RETURNS TEXT[] AS $$
DECLARE
  new_badges TEXT[] := '{}';
  player_rec RECORD;
  val INTEGER;
  badge RECORD;
  t_id TEXT;
  lost_set BOOLEAN;
  m_rec RECORD;
  sets_arr TEXT[];
  s_item TEXT;
  parts TEXT[];
BEGIN
  -- Load player data
  SELECT * INTO player_rec FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN new_badges; END IF;

  FOR badge IN SELECT * FROM badge_definitions WHERE condition_type != 'manual' ORDER BY sort_order LOOP
    -- Skip if already earned
    IF EXISTS (SELECT 1 FROM player_badges WHERE player_id = p_player_id AND badge_id = badge.id) THEN
      CONTINUE;
    END IF;

    CASE badge.condition_type

      WHEN 'matches_played' THEN
        SELECT COUNT(*) INTO val FROM matches
          WHERE (player1_id = p_player_id OR player2_id = p_player_id)
          AND status = 'completed' AND winner_id IS NOT NULL;
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'wins' THEN
        IF player_rec.wins >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'tournaments_played' THEN
        SELECT COUNT(DISTINCT tournament_id) INTO val FROM tournament_registrations
          WHERE player_id = p_player_id AND status IN ('approved', 'draw');
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'streak' THEN
        val := 0;
        IF player_rec.form IS NOT NULL AND array_length(player_rec.form, 1) > 0 THEN
          FOR i IN 1..array_length(player_rec.form, 1) LOOP
            IF player_rec.form[i] = 'W' THEN val := val + 1;
            ELSE EXIT;
            END IF;
          END LOOP;
        END IF;
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'champion' THEN
        -- Player won a tournament = has a match in final round where they are the winner
        SELECT COUNT(*) INTO val FROM matches
          WHERE winner_id = p_player_id AND status = 'completed'
          AND round_number = 1
          AND match_order = 1
          AND tournament_id IN (
            SELECT id FROM tournaments WHERE status = 'completed'
          );
        -- Alternative: check tournament_registrations with draw status finalized
        -- For now count final-round wins
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'finalist' THEN
        -- Lost in the final round
        SELECT COUNT(*) INTO val FROM matches
          WHERE status = 'completed' AND round_number = 1 AND match_order = 1
          AND (player1_id = p_player_id OR player2_id = p_player_id)
          AND winner_id IS NOT NULL AND winner_id != p_player_id;
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'champion_count' THEN
        SELECT COUNT(*) INTO val FROM matches
          WHERE winner_id = p_player_id AND status = 'completed'
          AND round_number = 1 AND match_order = 1
          AND tournament_id IN (
            SELECT id FROM tournaments WHERE status = 'completed'
          );
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'no_set_loss' THEN
        -- Check if won any tournament without losing a set
        FOR t_id IN
          SELECT m.tournament_id FROM matches m
          WHERE m.winner_id = p_player_id AND m.status = 'completed'
          AND m.round_number = 1 AND m.match_order = 1
          AND m.tournament_id IN (SELECT id FROM tournaments WHERE status = 'completed')
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
                  IF (m_rec.player1_id = p_player_id AND parts[1]::int < parts[2]::int)
                  OR (m_rec.player1_id != p_player_id AND parts[2]::int < parts[1]::int) THEN
                    lost_set := true;
                  END IF;
                END IF;
              END LOOP;
            END IF;
          END LOOP;
          IF NOT lost_set THEN
            INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
            new_badges := array_append(new_badges, badge.id);
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
        IF val > 0 THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'rank' THEN
        SELECT COUNT(*) + 1 INTO val FROM players
          WHERE category_id = player_rec.category_id
          AND points > player_rec.points;
        IF val <= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'membership' THEN
        IF EXISTS (SELECT 1 FROM memberships
          WHERE user_id IN (SELECT id FROM profiles WHERE player_id = p_player_id)
          AND status = 'active') THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'first_year' THEN
        -- Registered in 2025 (first year of KSLT)
        IF EXISTS (SELECT 1 FROM players
          WHERE id = p_player_id
          AND created_at < '2026-01-01'::timestamptz) THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'season_count' THEN
        val := EXTRACT(YEAR FROM age(now(), player_rec.created_at))::int;
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'domination' THEN
        SELECT MAX(cnt) INTO val FROM (
          SELECT COUNT(*) cnt FROM matches
          WHERE winner_id = p_player_id AND status = 'completed'
          GROUP BY CASE WHEN player1_id = p_player_id THEN player2_id ELSE player1_id END
        ) sub;
        IF COALESCE(val, 0) >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      ELSE
        -- Unknown condition_type, skip
        NULL;

    END CASE;
  END LOOP;

  RETURN new_badges;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1f. Trigger on players UPDATE
-- ============================================
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_player_badges ON players;

CREATE TRIGGER trg_player_badges
  AFTER UPDATE ON players
  FOR EACH ROW
  WHEN (OLD.wins IS DISTINCT FROM NEW.wins
     OR OLD.losses IS DISTINCT FROM NEW.losses
     OR OLD.form IS DISTINCT FROM NEW.form
     OR OLD.points IS DISTINCT FROM NEW.points)
  EXECUTE FUNCTION trigger_check_badges();

-- ============================================
-- 1g. Migrate old data from players.badges
-- ============================================
-- Only migrates badge IDs that exist in badge_definitions
INSERT INTO player_badges (player_id, badge_id)
SELECT sub.player_id, sub.badge_id
FROM (
  SELECT p.id AS player_id, unnest(p.badges) AS badge_id
  FROM players p
  WHERE p.badges IS NOT NULL AND array_length(p.badges, 1) > 0
) sub
WHERE sub.badge_id IN (SELECT id FROM badge_definitions)
ON CONFLICT DO NOTHING;

-- ============================================
-- Fix: safe integer parsing in check_and_award_badges
-- Problem: score values like "167-0" or tiebreak "7/6(5)" crash parts[1]::int
-- Solution: helper safe_int() + use it in no_set_loss block
-- ============================================

-- Helper: safe cast text to int (returns NULL on bad input)
CREATE OR REPLACE FUNCTION safe_int(val TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN val::integer;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recreate check_and_award_badges with safe score parsing
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
  p1_games INTEGER;
  p2_games INTEGER;
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
        SELECT COUNT(*) INTO val FROM matches
          WHERE winner_id = p_player_id AND status = 'completed'
          AND round_number = 1
          AND match_order = 1
          AND tournament_id IN (
            SELECT id FROM tournaments WHERE status = 'completed'
          );
        IF val >= badge.condition_value THEN
          INSERT INTO player_badges(player_id, badge_id) VALUES (p_player_id, badge.id);
          new_badges := array_append(new_badges, badge.id);
        END IF;

      WHEN 'finalist' THEN
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
                  p1_games := safe_int(parts[1]);
                  p2_games := safe_int(parts[2]);
                  -- Skip unparseable scores (tiebreaks, dashes, etc.)
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

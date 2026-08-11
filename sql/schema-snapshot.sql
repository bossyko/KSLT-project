


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cast_battle_vote"("p_challenge_id" "uuid", "p_player_id" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_challenge RECORD;
    v_existing TEXT;
    v_tg_chat_id TEXT;
    v_tg_vote TEXT;
    v_match_dt TIMESTAMPTZ;
BEGIN
    -- Get challenge
    SELECT battle_published, voting_closed,
           COALESCE(counter_date, proposed_date) AS match_date,
           COALESCE(counter_time, proposed_time) AS match_time
    INTO v_challenge
    FROM challenges WHERE id = p_challenge_id;

    IF v_challenge IS NULL OR v_challenge.battle_published = false THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;

    IF v_challenge.voting_closed THEN
        RETURN json_build_object('ok', false, 'error', 'voting_closed');
    END IF;

    -- Auto-close: check if match time has passed (Asia/Bishkek timezone)
    IF v_challenge.match_date IS NOT NULL AND v_challenge.match_time IS NOT NULL THEN
        v_match_dt := (v_challenge.match_date::text || ' ' || v_challenge.match_time)::timestamp AT TIME ZONE 'Asia/Bishkek';
        IF NOW() >= v_match_dt THEN
            -- Auto-close voting
            UPDATE challenges SET voting_closed = true WHERE id = p_challenge_id;
            RETURN json_build_object('ok', false, 'error', 'voting_closed');
        END IF;
    END IF;

    -- Check if already voted on site (one vote only!)
    SELECT predicted_winner_id INTO v_existing
    FROM challenge_predictions
    WHERE challenge_id = p_challenge_id
      AND voter_type = 'site'
      AND voter_id = auth.uid()::text;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object('ok', false, 'error', 'already_voted');
    END IF;

    -- Cross-check: did this user already vote via Telegram?
    SELECT telegram_chat_id INTO v_tg_chat_id
    FROM profiles WHERE id = auth.uid();

    IF v_tg_chat_id IS NOT NULL THEN
        SELECT predicted_winner_id INTO v_tg_vote
        FROM challenge_predictions
        WHERE challenge_id = p_challenge_id
          AND voter_type = 'telegram'
          AND voter_id = v_tg_chat_id;

        IF v_tg_vote IS NOT NULL THEN
            RETURN json_build_object('ok', false, 'error', 'already_voted_tg');
        END IF;
    END IF;

    -- Insert vote
    INSERT INTO challenge_predictions (challenge_id, voter_type, voter_id, predicted_winner_id)
    VALUES (p_challenge_id, 'site', auth.uid()::text, p_player_id);

    RETURN json_build_object('ok', true);
END;
$$;


ALTER FUNCTION "public"."cast_battle_vote"("p_challenge_id" "uuid", "p_player_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_award_badges"("p_player_id" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    SELECT * INTO player_rec FROM players WHERE id = p_player_id;
    IF NOT FOUND THEN RETURN new_badges; END IF;

    FOR badge IN SELECT * FROM badge_definitions WHERE condition_type != 'manual' ORDER BY sort_order LOOP
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
            AND round_number = 1 AND match_order = 1
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
            WHERE profile_id IN (SELECT id FROM profiles WHERE player_id = p_player_id)
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
          NULL;

      END CASE;
    END LOOP;

    RETURN new_badges;
  END;
  $$;


ALTER FUNCTION "public"."check_and_award_badges"("p_player_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_doubles_unique"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If this registration has a partner_id (KSLT player as partner)
  IF NEW.partner_id IS NOT NULL THEN
    -- Partner must not be registered as captain in the same tournament
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND player_id = NEW.partner_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Partner already registered as captain in this tournament';
    END IF;

    -- Partner must not be listed as partner in another registration
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND partner_id = NEW.partner_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Partner already in another team in this tournament';
    END IF;
  END IF;

  -- Captain must not be listed as partner in another registration
  IF NEW.player_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM tournament_registrations
      WHERE tournament_id = NEW.tournament_id
        AND partner_id = NEW.player_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Player already registered as partner in another team';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_doubles_unique"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_player_badges"("p_player_id" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    SELECT * INTO player_rec FROM players WHERE id = p_player_id;
    IF NOT FOUND THEN RETURN new_badges; END IF;

    FOR badge IN SELECT * FROM badge_definitions WHERE condition_type != 'manual' ORDER BY sort_order LOOP
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
            AND round_number = 1 AND match_order = 1
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
            WHERE profile_id IN (SELECT id FROM profiles WHERE player_id = p_player_id)
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
          NULL;

      END CASE;
    END LOOP;

    RETURN new_badges;
  END;
  $$;


ALTER FUNCTION "public"."check_player_badges"("p_player_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_registration_available"("p_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_email_taken boolean := false;
BEGIN
  -- Check email in auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = lower(p_email)
  ) INTO v_email_taken;

  RETURN jsonb_build_object('email_taken', v_email_taken);
END;
$$;


ALTER FUNCTION "public"."check_registration_available"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_otp"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < now() - interval '24 hours';
    DELETE FROM otp_blocks WHERE blocked_until < now() - interval '24 hours' AND admin_unblocked = false;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_otp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_voucher"("p_token" "text", "p_pin" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v RECORD;
    v_correct_pin TEXT;
BEGIN
    SELECT * INTO v
    FROM discount_vouchers
    WHERE qr_token = p_token;

    IF v IS NULL THEN
        RETURN json_build_object('status', 'invalid');
    END IF;

    -- Auto-expire
    IF v.status = 'active' AND v.expires_at < NOW() THEN
        UPDATE discount_vouchers SET status = 'expired' WHERE id = v.id;
        RETURN json_build_object('status', 'expired');
    END IF;

    IF v.status <> 'active' THEN
        RETURN json_build_object('status', v.status);
    END IF;

    -- Check PIN
    IF v.entity_type = 'court' THEN
        SELECT partner_pin INTO v_correct_pin FROM courts WHERE id = v.entity_id;
    ELSE
        SELECT partner_pin INTO v_correct_pin FROM coaches WHERE id = v.entity_id;
    END IF;

    IF v_correct_pin IS NULL OR p_pin <> v_correct_pin THEN
        RETURN json_build_object('status', 'wrong_pin');
    END IF;

    -- Mark as used
    UPDATE discount_vouchers
    SET status = 'used', used_at = NOW()
    WHERE id = v.id;

    RETURN json_build_object('status', 'confirmed');
END;
$$;


ALTER FUNCTION "public"."confirm_voucher"("p_token" "text", "p_pin" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_voucher"("p_entity_type" "text", "p_entity_id" "text", "p_service_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      v_user_id UUID;
      v_player_name TEXT;
      v_entity_name TEXT;
      v_service RECORD;
      v_existing INT;
      v_voucher RECORD;
      v_is_member BOOLEAN;
  BEGIN
      v_user_id := auth.uid();
      IF v_user_id IS NULL THEN
          RETURN json_build_object('error', 'not_authenticated');
      END IF;

      SELECT EXISTS (
          SELECT 1 FROM memberships
          WHERE profile_id = v_user_id
            AND status = 'active'
            AND expires_at > NOW()
      ) INTO v_is_member;

      IF NOT v_is_member THEN
          RETURN json_build_object('error', 'not_member');
      END IF;

      SELECT COALESCE(full_name, 'Member')
      INTO v_player_name
      FROM profiles WHERE id = v_user_id;

      SELECT * INTO v_service
      FROM partner_services
      WHERE id = p_service_id
        AND entity_type = p_entity_type
        AND entity_id = p_entity_id
        AND is_active = true;

      IF v_service IS NULL THEN
          RETURN json_build_object('error', 'service_not_found');
      END IF;

      IF p_entity_type = 'court' THEN
          SELECT name INTO v_entity_name FROM courts WHERE id = p_entity_id AND partner = true;
      ELSE
          SELECT COALESCE(last_name || ' ' || first_name, name) INTO v_entity_name
          FROM coaches WHERE id = p_entity_id AND partner = true;
      END IF;

      IF v_entity_name IS NULL THEN
          RETURN json_build_object('error', 'entity_not_partner');
      END IF;

      UPDATE discount_vouchers
      SET status = 'expired'
      WHERE profile_id = v_user_id
        AND entity_type = p_entity_type
        AND entity_id = p_entity_id
        AND service_id = p_service_id
        AND status = 'active'
        AND expires_at < NOW();

      SELECT COUNT(*) INTO v_existing
      FROM discount_vouchers
      WHERE profile_id = v_user_id
        AND entity_type = p_entity_type
        AND entity_id = p_entity_id
        AND service_id = p_service_id
        AND status = 'active'
        AND expires_at > NOW();

      IF v_existing > 0 THEN
          RETURN json_build_object('error', 'active_voucher_exists');
      END IF;

      SELECT COUNT(*) INTO v_existing
      FROM discount_vouchers
      WHERE profile_id = v_user_id
        AND entity_type = p_entity_type
        AND entity_id = p_entity_id
        AND service_id = p_service_id
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status IN ('active', 'used');

      IF v_existing > 0 THEN
          RETURN json_build_object('error', 'daily_limit');
      END IF;

      INSERT INTO discount_vouchers (
          profile_id, player_name, entity_type, entity_id, entity_name,
          service_id, service_name, discount_percent
      ) VALUES (
          v_user_id, v_player_name, p_entity_type, p_entity_id, v_entity_name,
          p_service_id, v_service.service_name, v_service.discount_percent
      )
      RETURNING * INTO v_voucher;

      RETURN json_build_object(
          'success', true,
          'voucher', json_build_object(
              'id', v_voucher.id,
              'qr_token', v_voucher.qr_token,
              'player_name', v_voucher.player_name,
              'entity_name', v_voucher.entity_name,
              'service_name', v_voucher.service_name,
              'discount_percent', v_voucher.discount_percent,
              'expires_at', v_voucher.expires_at,
              'created_at', v_voucher.created_at
          )
      );
  END;
  $$;


ALTER FUNCTION "public"."generate_voucher"("p_entity_type" "text", "p_entity_id" "text", "p_service_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_analytics_overview"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'courts_views', (SELECT COALESCE(SUM(view_count), 0) FROM courts),
    'courts_views_app', (SELECT COALESCE(SUM(view_count_app), 0) FROM courts),
    'coaches_views', (SELECT COALESCE(SUM(view_count), 0) FROM coaches),
    'coaches_views_app', (SELECT COALESCE(SUM(view_count_app), 0) FROM coaches),
    'players_views', (SELECT COALESCE(SUM(view_count), 0) FROM players),
    'players_views_app', (SELECT COALESCE(SUM(view_count_app), 0) FROM players),
    'news_views', (SELECT COALESCE(SUM(view_count), 0) FROM news),
    'news_views_app', (SELECT COALESCE(SUM(view_count_app), 0) FROM news),
    'tournaments_views', (SELECT COALESCE(SUM(view_count), 0) FROM tournaments),
    'tournaments_views_app', (SELECT COALESCE(SUM(view_count_app), 0) FROM tournaments),
    'sponsors_views', (SELECT COALESCE(SUM(view_count), 0) FROM sponsors),
    'sponsors_views_app', (SELECT COALESCE(SUM(view_count_app), 0) FROM sponsors),
    'pages_views', (SELECT COALESCE(SUM(view_count), 0) FROM page_views),
    'site_visits', (SELECT COALESCE(view_count, 0) FROM page_views WHERE page_name = 'site_visit'),
    'app_visits', (SELECT COALESCE(view_count, 0) FROM page_views WHERE page_name = 'app_visit')
  ) INTO result;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_analytics_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_battle_public"("p_challenge_id" "uuid") RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.counter_date, c.counter_time, c.counter_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.battle_published_at, c.banner_url,
               -- Challenge-level overrides
               c.challenger_ntrp, c.opponent_ntrp,
               c.challenger_country, c.opponent_country,
               c.challenger_category, c.opponent_category,
               c.set_format,
               -- Player data
               p1.name AS challenger_name, p1.name_en AS challenger_name_en, p1.name_kg AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses,
               p1.points AS challenger_points,
               p1.ntrp_rating AS challenger_player_ntrp,
               p1.country AS challenger_player_country,
               p2.name AS opponent_name, p2.name_en AS opponent_name_en, p2.name_kg AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses,
               p2.points AS opponent_points,
               p2.ntrp_rating AS opponent_player_ntrp,
               p2.country AS opponent_player_country,
               -- Court map links
               ct.google_maps_url AS court_google_maps,
               ct.twogis_url AS court_twogis
        FROM challenges c
        JOIN players p1 ON p1.id = c.challenger_player_id
        JOIN players p2 ON p2.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$;


ALTER FUNCTION "public"."get_battle_public"("p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_battle_votes"("p_challenge_id" "uuid") RETURNS TABLE("player_id" "text", "votes" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT predicted_winner_id AS player_id, COUNT(*) AS votes
    FROM challenge_predictions
    WHERE challenge_id = p_challenge_id
    GROUP BY predicted_winner_id;
$$;


ALTER FUNCTION "public"."get_battle_votes"("p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_live_by_umpire_key"("p_key" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_match RECORD;
    v_p1 RECORD;
    v_p2 RECORD;
BEGIN
    SELECT * INTO v_match FROM live_matches WHERE umpire_key = p_key;
    IF v_match IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Not found');
    END IF;

    -- Get player info
    SELECT id, name, name_en, photo INTO v_p1 FROM players WHERE id = v_match.player1_id;
    SELECT id, name, name_en, photo INTO v_p2 FROM players WHERE id = v_match.player2_id;

    RETURN jsonb_build_object(
        'ok', true,
        'match', jsonb_build_object(
            'id', v_match.id,
            'match_id', v_match.match_id,
            'best_of', v_match.best_of,
            'youtube_url', v_match.youtube_url,
            'serving_player', v_match.serving_player,
            'points_p1', v_match.points_p1,
            'points_p2', v_match.points_p2,
            'current_set', v_match.current_set,
            'sets_data', v_match.sets_data,
            'current_game_p1', v_match.current_game_p1,
            'current_game_p2', v_match.current_game_p2,
            'is_tiebreak', v_match.is_tiebreak,
            'tiebreak_p1', v_match.tiebreak_p1,
            'tiebreak_p2', v_match.tiebreak_p2,
            'status', v_match.status,
            'winner_player', v_match.winner_player,
            'final_score', v_match.final_score,
            'history', v_match.history,
            'tournament_label', v_match.tournament_label,
            'player1_name', COALESCE(v_match.player1_name, v_p1.name),
            'player2_name', COALESCE(v_match.player2_name, v_p2.name),
            'player1_name_en', v_p1.name_en,
            'player2_name_en', v_p2.name_en,
            'player1_photo', v_p1.photo,
            'player2_photo', v_p2.photo
        )
    );
END;
$$;


ALTER FUNCTION "public"."get_live_by_umpire_key"("p_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_loyalty_balance"("p_profile_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
    SELECT COALESCE(
        SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) -
        SUM(CASE WHEN type IN ('redeem', 'expire') THEN points ELSE 0 END) -
        SUM(CASE WHEN type = 'admin_adjust' AND points < 0 THEN ABS(points) ELSE 0 END) +
        SUM(CASE WHEN type = 'admin_adjust' AND points > 0 THEN points ELSE 0 END),
    0)
    FROM loyalty_transactions
    WHERE profile_id = p_profile_id;
$$;


ALTER FUNCTION "public"."get_loyalty_balance"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_challenges"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      result JSON;
  BEGIN
      SELECT json_agg(row_to_json(t)) INTO result
      FROM (
          SELECT
              c.id, c.status, c.proposed_date, c.proposed_time,
              c.proposed_venue, c.counter_date, c.counter_time, c.counter_venue,
              c.message, c.created_at, c.expires_at, c.accepted_at,
              c.countered_at, c.match_id,
              CASE WHEN c.challenger_id = auth.uid() THEN 'sent' ELSE 'received' END AS direction,
              c.challenger_player_id,
              cp.full_name AS challenger_name,
              cp.avatar_url AS challenger_avatar,
              c.opponent_player_id,
              op.full_name AS opponent_name,
              op.avatar_url AS opponent_avatar,
              ct.name AS court_name,
              cct.name AS counter_court_name,
              COALESCE(m.score, c.score_draft) AS match_score,
              m.winner_id AS match_winner_id
          FROM challenges c
          LEFT JOIN profiles cp ON cp.id = c.challenger_id
          LEFT JOIN profiles op ON op.id = c.opponent_profile_id
          LEFT JOIN courts ct ON ct.id = c.proposed_court_id
          LEFT JOIN courts cct ON cct.id = c.counter_court_id
          LEFT JOIN matches m ON m.id = c.match_id
          WHERE c.challenger_id = auth.uid()
             OR c.opponent_profile_id = auth.uid()
          ORDER BY c.created_at DESC
          LIMIT 50
      ) t;
      RETURN COALESCE(result, '[]'::json);
  END;
  $$;


ALTER FUNCTION "public"."get_my_challenges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_game_invites"() RETURNS TABLE("id" "uuid", "status" "text", "created_at" timestamp with time zone, "responded_at" timestamp with time zone, "direction" "text", "partner_name" "text", "partner_avatar" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    -- Отправленные
    SELECT gi.id, gi.status, gi.created_at, gi.responded_at,
        'sent'::TEXT, pl.name, COALESCE(pr2.avatar_url, pl.photo)
    FROM game_invites gi
    JOIN players pl ON pl.id = gi.receiver_player_id
    LEFT JOIN profiles pr2 ON pr2.player_id = pl.id
    WHERE gi.sender_id = auth.uid()
    UNION ALL
    -- Полученные
    SELECT gi.id, gi.status, gi.created_at, gi.responded_at,
        'received'::TEXT, pr_s.full_name, pr_s.avatar_url
    FROM game_invites gi
    JOIN profiles pr_s ON pr_s.id = gi.sender_id
    WHERE gi.receiver_profile_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 20;
$$;


ALTER FUNCTION "public"."get_my_game_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_news_engagement"("p_news_ids" "text"[]) RETURNS TABLE("news_id" "text", "total_reactions" bigint, "total_votes" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT
        n.id AS news_id,
        (SELECT COUNT(*) FROM news_reactions r WHERE r.news_id = n.id) AS total_reactions,
        (SELECT COUNT(*) FROM news_poll_votes v WHERE v.news_id = n.id) AS total_votes
    FROM unnest(p_news_ids) AS n(id);
$$;


ALTER FUNCTION "public"."get_news_engagement"("p_news_ids" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_news_stats"() RETURNS TABLE("published_count" bigint, "last_published" timestamp with time zone, "draft_count" bigint, "last_draft" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT
        COUNT(*) FILTER (WHERE published_at IS NOT NULL) AS published_count,
        MAX(published_at) FILTER (WHERE published_at IS NOT NULL) AS last_published,
        COUNT(*) FILTER (WHERE published_at IS NULL) AS draft_count,
        MAX(created_at) FILTER (WHERE published_at IS NULL) AS last_draft
    FROM news;
$$;


ALTER FUNCTION "public"."get_news_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_page_view_stats"() RETURNS TABLE("page_name" "text", "view_count" integer, "updated_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT page_name, view_count, updated_at
    FROM page_views
    ORDER BY view_count DESC;
$$;


ALTER FUNCTION "public"."get_page_view_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_avatar"("p_player_id" "text") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT avatar_url FROM profiles
  WHERE player_id = p_player_id LIMIT 1;
$$;


ALTER FUNCTION "public"."get_player_avatar"("p_player_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_challenges"("p_player_id" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      result JSON;
  BEGIN
      SELECT json_agg(row_to_json(t)) INTO result
      FROM (
          SELECT
              c.id, c.status, c.proposed_date, c.proposed_time,
              c.proposed_venue, c.counter_date, c.counter_time, c.counter_venue,
              c.created_at, c.accepted_at,
              c.challenger_player_id,
              COALESCE(cp.name, lm.player1_name) AS challenger_name,
              COALESCE(cp.name_en, lm.player1_name) AS challenger_name_en,
              COALESCE(cp.name_kg, lm.player1_name) AS challenger_name_kg,
              cp.photo AS challenger_photo,
              c.opponent_player_id,
              COALESCE(op.name, lm.player2_name) AS opponent_name,
              COALESCE(op.name_en, lm.player2_name) AS opponent_name_en,
              COALESCE(op.name_kg, lm.player2_name) AS opponent_name_kg,
              op.photo AS opponent_photo,
              ct.name AS court_name,
              cct.name AS counter_court_name,
              COALESCE(m.score, c.score_draft) AS match_score,
              m.winner_id AS match_winner_id
          FROM challenges c
          LEFT JOIN players cp ON cp.id = c.challenger_player_id
          LEFT JOIN players op ON op.id = c.opponent_player_id
          LEFT JOIN courts ct ON ct.id = c.proposed_court_id
          LEFT JOIN courts cct ON cct.id = c.counter_court_id
          LEFT JOIN matches m ON m.id = c.match_id
          LEFT JOIN live_matches lm ON lm.id = c.live_match_id
          WHERE (c.challenger_player_id = p_player_id OR c.opponent_player_id = p_player_id)
            AND c.status IN ('accepted', 'completed')
          ORDER BY c.created_at DESC
          LIMIT 25
      ) t;
      RETURN COALESCE(result, '[]'::json);
  END;
  $$;


ALTER FUNCTION "public"."get_player_challenges"("p_player_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_poll_results"("p_news_id" "text") RETURNS TABLE("option_index" integer, "count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT option_index, COUNT(*) AS count
    FROM news_poll_votes
    WHERE news_id = p_news_id
    GROUP BY option_index;
$$;


ALTER FUNCTION "public"."get_poll_results"("p_news_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_partners"() RETURNS TABLE("id" "text", "full_name" "text", "avatar_url" "text", "gender" "text", "last_seen" timestamp with time zone, "category_name" "text", "category_name_en" "text", "has_telegram" boolean, "play_level" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$                                                                                                                                                                  
      SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),                                                                                                              
          CASE WHEN c.gender = 'men' THEN 'male' ELSE 'female' END,
          pr.last_seen, c.name, c.name_en,
          (pr.telegram_chat_id IS NOT NULL) AS has_telegram,
          pr.play_level
      FROM players pl
      LEFT JOIN categories c ON pl.category_id = c.id
      LEFT JOIN profiles pr ON pr.player_id = pl.id
      WHERE pl.name IS NOT NULL AND pl.name != ''
      ORDER BY pr.last_seen DESC NULLS LAST;
  $$;


ALTER FUNCTION "public"."get_public_partners"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_reaction_counts"("p_news_id" "text") RETURNS TABLE("reaction_type" "text", "count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT reaction_type, COUNT(*)::BIGINT AS count
    FROM news_reactions
    WHERE news_id = p_news_id
    GROUP BY reaction_type;
$$;


ALTER FUNCTION "public"."get_reaction_counts"("p_news_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_news"("p_limit" integer DEFAULT 3) RETURNS TABLE("news_id" "text", "title" "text", "score" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT
        n.id AS news_id,
        n.title,
        (COALESCE(n.view_count, 0) +
         COALESCE((SELECT COUNT(*) FROM news_reactions r WHERE r.news_id = n.id), 0) +
         COALESCE((SELECT COUNT(*) FROM news_poll_votes v WHERE v.news_id = n.id), 0)
        )::BIGINT AS score
    FROM news n
    WHERE n.published_at IS NOT NULL
    ORDER BY score DESC
    LIMIT p_limit;
$$;


ALTER FUNCTION "public"."get_top_news"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tournament_stats"() RETURNS TABLE("total_count" bigint, "active_count" bigint, "completed_count" bigint, "total_views" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT
        COUNT(*)::BIGINT AS total_count,
        COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') OR status IS NULL)::BIGINT AS active_count,
        COUNT(*) FILTER (WHERE status IN ('completed','cancelled'))::BIGINT AS completed_count,
        COALESCE(SUM(view_count), 0)::BIGINT AS total_views
    FROM tournaments
    WHERE published_at IS NOT NULL;
$$;


ALTER FUNCTION "public"."get_tournament_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_reactions"("p_news_id" "text", "p_user_id" "uuid") RETURNS TABLE("reaction_type" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT reaction_type
    FROM news_reactions
    WHERE news_id = p_news_id AND user_id = p_user_id;
$$;


ALTER FUNCTION "public"."get_user_reactions"("p_news_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    gender,
    birth_day,
    birth_month,
    birth_year,
    role,
    created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'gender', ''),
    (NEW.raw_user_meta_data->>'birth_day')::int,
    (NEW.raw_user_meta_data->>'birth_month')::int,
    (NEW.raw_user_meta_data->>'birth_year')::int,
    'user',
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_coach_view"("p_id" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    UPDATE coaches SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;


ALTER FUNCTION "public"."increment_coach_view"("p_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_coach_view"("p_id" "text", "p_source" "text" DEFAULT 'site'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE coaches SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE coaches SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_coach_view"("p_id" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_court_view"("p_id" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    UPDATE courts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;


ALTER FUNCTION "public"."increment_court_view"("p_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_court_view"("p_id" "text", "p_source" "text" DEFAULT 'site'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE courts SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE courts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_court_view"("p_id" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_news_view"("p_news_id" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    UPDATE news SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_news_id;
$$;


ALTER FUNCTION "public"."increment_news_view"("p_news_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_news_view"("p_news_id" "text", "p_source" "text" DEFAULT 'site'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE news SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_news_id;
  ELSE
    UPDATE news SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_news_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_news_view"("p_news_id" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_page_view"("p_page_name" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    INSERT INTO page_views (page_name, view_count, updated_at)
    VALUES (p_page_name, 1, now())
    ON CONFLICT (page_name) DO UPDATE
    SET view_count = page_views.view_count + 1, updated_at = now();
$$;


ALTER FUNCTION "public"."increment_page_view"("p_page_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_player_view"("p_id" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    UPDATE players SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;


ALTER FUNCTION "public"."increment_player_view"("p_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_player_view"("p_id" "text", "p_source" "text" DEFAULT 'site'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE players SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE players SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_player_view"("p_id" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_sponsor_view"("p_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    UPDATE sponsors SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
$$;


ALTER FUNCTION "public"."increment_sponsor_view"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_sponsor_view"("p_id" "uuid", "p_source" "text" DEFAULT 'site'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE sponsors SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE sponsors SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_sponsor_view"("p_id" "uuid", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    UPDATE tournaments SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_tournament_id;
$$;


ALTER FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text", "p_source" "text" DEFAULT 'site'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE tournaments SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_tournament_id;
  ELSE
    UPDATE tournaments SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_tournament_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    );
$$;


ALTER FUNCTION "public"."is_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_deleted_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_has_mem BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM memberships WHERE profile_id = OLD.id AND status = 'active'
    ) INTO v_has_mem;

    INSERT INTO deleted_accounts (profile_id, full_name, email, role, phone, telegram_chat_id, player_id, had_membership)
    VALUES (OLD.id, OLD.full_name, OLD.email, OLD.role, OLD.phone, OLD.telegram_chat_id, OLD.player_id, v_has_mem);

    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."log_deleted_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_all_player_points"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    DECLARE
      oldest_date DATE;
      cur_year INT;
      rec RECORD;
      home_points INT;
      doubles INT;
    BEGIN
      cur_year := EXTRACT(YEAR FROM NOW());
      IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
        oldest_date := make_date(cur_year - 1, 9, 1);
      ELSE
        oldest_date := make_date(cur_year - 2, 9, 1);
      END IF;

      PERFORM recalc_player_categories(ARRAY(SELECT id FROM players));

      FOR rec IN SELECT id, category_id FROM players LOOP
        IF rec.category_id IS NULL THEN
          home_points := 0;
        ELSE
          SELECT COALESCE(points, 0) INTO home_points
          FROM player_categories
          WHERE player_id = rec.id AND category_id = rec.category_id;
          home_points := COALESCE(home_points, 0);
        END IF;

        SELECT COALESCE(SUM(points_earned), 0) INTO doubles
        FROM rating_history
        WHERE player_id = rec.id
          AND is_doubles = TRUE
          AND recorded_at >= oldest_date;

        UPDATE players
        SET points = home_points, doubles_points = doubles
        WHERE id = rec.id;
      END LOOP;
    END;
    $$;


ALTER FUNCTION "public"."recalc_all_player_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    DECLARE
      oldest_date DATE;
      cur_year INT;
    BEGIN
      cur_year := EXTRACT(YEAR FROM NOW());
      IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
        oldest_date := make_date(cur_year - 1, 9, 1);
      ELSE
        oldest_date := make_date(cur_year - 2, 9, 1);
      END IF;

      DELETE FROM player_categories WHERE player_id = ANY(p_ids);

      INSERT INTO player_categories (player_id, category_id, points, updated_at)
      SELECT rh.player_id, rh.category_id, SUM(rh.points_earned), now()
      FROM rating_history rh
      WHERE rh.player_id = ANY(p_ids)
        AND rh.category_id IS NOT NULL
        AND (rh.is_doubles IS NOT TRUE)
        AND rh.recorded_at >= oldest_date
      GROUP BY rh.player_id, rh.category_id
      HAVING SUM(rh.points_earned) > 0;

      -- Победы и поражения в одиночных турнирах этой категории
      UPDATE player_categories pc
      SET wins = COALESCE(st.w, 0), losses = COALESCE(st.l, 0)
      FROM (
        SELECT pl.id AS player_id, t.category_id,
               count(*) FILTER (WHERE m.winner_id = pl.id) AS w,
               count(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> pl.id) AS l
        FROM players pl
        JOIN matches m ON (m.player1_id = pl.id OR m.player2_id = pl.id)
        JOIN tournaments t ON t.id = m.tournament_id
        WHERE pl.id = ANY(p_ids)
          AND t.category_id IS NOT NULL
          AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
        GROUP BY pl.id, t.category_id
      ) st
      WHERE pc.player_id = st.player_id AND pc.category_id = st.category_id;
    END;
    $$;


ALTER FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_badges"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$                                                                                                                                                               
  DECLARE
      new_badges text[] := '{}';
      max_points integer;
      form_streak integer := 0;
      i integer;
  BEGIN
      SELECT MAX(points) INTO max_points
      FROM players WHERE category_id = NEW.category_id AND id != NEW.id;
      IF NEW.points > COALESCE(max_points, 0) THEN
          new_badges := array_append(new_badges, 'top1');
      END IF;
      IF NEW.form IS NOT NULL AND array_length(NEW.form, 1) >= 5 THEN
          form_streak := 0;
          FOR i IN 1..array_length(NEW.form, 1) LOOP
              IF NEW.form[i] = 'W' THEN form_streak := form_streak + 1;
              ELSE form_streak := 0; END IF;
          END LOOP;
          IF form_streak >= 5 THEN
              new_badges := array_append(new_badges, 'streak');
          END IF;
      END IF;
      IF NEW.created_at > NOW() - INTERVAL '30 days' THEN
          new_badges := array_append(new_badges, 'newbie');
      END IF;
      IF NEW.rank_change >= 10 THEN
          new_badges := array_append(new_badges, 'breakthrough');
      END IF;
      IF OLD IS NOT NULL AND OLD.badges IS NOT NULL AND 'champion' = ANY(OLD.badges) THEN
          new_badges := array_append(new_badges, 'champion');
      END IF;
      NEW.badges := new_badges;
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."recalculate_badges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrations_guard_self_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Отметка времени снятия ставится здесь, а не на клиенте: так её нельзя
  -- подделать и она появляется, откуда бы заявку ни сняли
  IF NEW.status = 'withdrawn' AND OLD.status IS DISTINCT FROM 'withdrawn' THEN
    NEW.withdrawn_at := now();
  ELSIF NEW.status IS DISTINCT FROM 'withdrawn' THEN
    NEW.withdrawn_at := NULL;
  END IF;

  -- Сервер ходит под service_role: это наши Edge Functions, у них своя проверка.
  -- Ограничиваем только браузер с пользовательским токеном.
  IF auth.uid() IS NULL OR COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Админ и менеджер правят заявку как раньше
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) THEN
    RETURN NEW;
  END IF;

  -- Игроку оставляем партнёра и снятие заявки
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'withdrawn' THEN
    RAISE EXCEPTION 'Заявку можно только снять';
  END IF;

  IF NEW.tournament_id  IS DISTINCT FROM OLD.tournament_id
  OR NEW.player_id      IS DISTINCT FROM OLD.player_id
  OR NEW.seed_number    IS DISTINCT FROM OLD.seed_number
  OR NEW.draw_position  IS DISTINCT FROM OLD.draw_position
  OR NEW.group_number   IS DISTINCT FROM OLD.group_number
  OR NEW.registered_at  IS DISTINCT FROM OLD.registered_at
  OR NEW.block_reason   IS DISTINCT FROM OLD.block_reason
  OR NEW.is_external    IS DISTINCT FROM OLD.is_external THEN
    RAISE EXCEPTION 'Эти поля меняет только организатор';
  END IF;

  -- Снимать заявку после жеребьёвки нельзя: игрок уже в сетке
  IF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn'
     AND (OLD.draw_position IS NOT NULL OR OLD.group_number IS NOT NULL) THEN
    RAISE EXCEPTION 'Жеребьёвка проведена, снять заявку может только организатор';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."registrations_guard_self_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_int"("val" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN val::integer;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."safe_int"("val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_player_name"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.player_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Имя: следует за профилем, перевод пересчитывается
    IF NEW.full_name IS NOT NULL
       AND btrim(NEW.full_name) <> ''
       AND NEW.full_name IS DISTINCT FROM OLD.full_name
    THEN
        UPDATE players
        SET name    = NEW.full_name,
            name_en = translit_ru(NEW.full_name),
            name_kg = NULL
        WHERE id = NEW.player_id
          AND name IS DISTINCT FROM NEW.full_name;
    END IF;

    -- Фото: список рейтинга и поиск партнёра читают карточку игрока
    IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
        UPDATE players
        SET photo = NEW.avatar_url
        WHERE id = NEW.player_id
          AND photo IS DISTINCT FROM NEW.avatar_url;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_player_name"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_player_name"() IS 'Имя в рейтинге следует за именем в профиле: его задаёт сам игрок';



CREATE OR REPLACE FUNCTION "public"."translit_ru"("src" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    -- Буквы, дающие несколько латинских: их заменяем по одной
    pairs CONSTANT TEXT[][] := ARRAY[
        ['щ','shch'], ['ж','zh'], ['ч','ch'], ['ш','sh'], ['ц','ts'],
        ['х','kh'],   ['ю','yu'], ['я','ya'], ['ё','e'],  ['ң','ng']
    ];
    out TEXT;
    i INT;
BEGIN
    IF src IS NULL OR btrim(src) = '' THEN
        RETURN NULL;
    END IF;

    out := lower(src);

    FOR i IN 1 .. array_length(pairs, 1) LOOP
        out := replace(out, pairs[i][1], pairs[i][2]);
    END LOOP;

    -- Остальные — одна к одной. Твёрдый и мягкий знаки исчезают: в конце
    -- строки замен их пары нет, и translate такие буквы удаляет.
    out := translate(
        out,
        'абвгдезийклмнопрстуфыэөүъь',
        'abvgdeziyklmnoprstufyeou'
    );

    RETURN initcap(out);
END;
$$;


ALTER FUNCTION "public"."translit_ru"("src" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."translit_ru"("src" "text") IS 'Кириллица латиницей для имён. Кыргызские буквы тоже: ң, ө, ү';



CREATE OR REPLACE FUNCTION "public"."trigger_check_badges"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_check_badges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."umpire_save_state"("p_key" "text", "p_state" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      v_id UUID;
      v_live RECORD;
      v_prof1_id UUID;
      v_prof2_id UUID;
      v_score TEXT;
  BEGIN
      SELECT id INTO v_id FROM live_matches WHERE umpire_key = p_key;
      IF v_id IS NULL THEN
          RETURN jsonb_build_object('ok', false, 'error', 'Invalid umpire key');
      END IF;

      UPDATE live_matches SET
          serving_player = COALESCE((p_state->>'serving_player')::int, serving_player),
          points_p1 = COALESCE(p_state->>'points_p1', points_p1),
          points_p2 = COALESCE(p_state->>'points_p2', points_p2),
          current_set = COALESCE((p_state->>'current_set')::int, current_set),
          sets_data = COALESCE(p_state->'sets_data', sets_data),
          current_game_p1 = COALESCE((p_state->>'current_game_p1')::int, current_game_p1),
          current_game_p2 = COALESCE((p_state->>'current_game_p2')::int, current_game_p2),
          is_tiebreak = COALESCE((p_state->>'is_tiebreak')::boolean, is_tiebreak),
          tiebreak_p1 = COALESCE((p_state->>'tiebreak_p1')::int, tiebreak_p1),
          tiebreak_p2 = COALESCE((p_state->>'tiebreak_p2')::int, tiebreak_p2),
          status = COALESCE(p_state->>'status', status),
          winner_player = (p_state->>'winner_player')::int,
          final_score = p_state->>'final_score',
          history = COALESCE(p_state->'history', history),
          started_at = CASE
              WHEN p_state->>'status' = 'live' AND started_at IS NULL THEN now()
              ELSE started_at
          END,
          completed_at = CASE
              WHEN p_state->>'status' = 'completed' THEN now()
              ELSE completed_at
          END
      WHERE id = v_id;

      IF p_state->>'status' = 'completed' THEN
          SELECT match_id, player1_id, player2_id, final_score
          INTO v_live
          FROM live_matches WHERE id = v_id;

          v_score := COALESCE(p_state->>'final_score', v_live.final_score);

          IF v_live.match_id IS NULL
             AND (v_live.player1_id IS NOT NULL OR v_live.player2_id IS NOT NULL)
             AND NOT EXISTS (SELECT 1 FROM challenges WHERE live_match_id = v_id)
          THEN
              SELECT p.id INTO v_prof1_id FROM profiles p WHERE p.player_id = v_live.player1_id LIMIT 1;
              SELECT p.id INTO v_prof2_id FROM profiles p WHERE p.player_id = v_live.player2_id LIMIT 1;

              INSERT INTO challenges (
                  challenger_id, challenger_player_id, opponent_player_id,
                  opponent_profile_id, proposed_date, proposed_time,
                  status, score_draft, live_match_id,
                  created_at, expires_at, accepted_at
              ) VALUES (
                  v_prof1_id, v_live.player1_id, v_live.player2_id,
                  v_prof2_id, CURRENT_DATE,
                  to_char(now() AT TIME ZONE 'Asia/Bishkek', 'HH24:MI'),
                  'completed', v_score, v_id,
                  now(), now() + interval '72 hours', now()
              );
          END IF;
      END IF;

      RETURN jsonb_build_object('ok', true, 'id', v_id);
  END;
  $$;


ALTER FUNCTION "public"."umpire_save_state"("p_key" "text", "p_state" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_voucher"("p_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v RECORD;
BEGIN
    SELECT * INTO v
    FROM discount_vouchers
    WHERE qr_token = p_token;

    IF v IS NULL THEN
        RETURN json_build_object('status', 'invalid');
    END IF;

    -- Auto-expire
    IF v.status = 'active' AND v.expires_at < NOW() THEN
        UPDATE discount_vouchers SET status = 'expired' WHERE id = v.id;
        RETURN json_build_object('status', 'expired');
    END IF;

    IF v.status = 'used' THEN
        RETURN json_build_object(
            'status', 'already_used',
            'used_at', v.used_at
        );
    END IF;

    IF v.status = 'expired' THEN
        RETURN json_build_object('status', 'expired');
    END IF;

    IF v.status = 'cancelled' THEN
        RETURN json_build_object('status', 'invalid');
    END IF;

    -- Active voucher
    RETURN json_build_object(
        'status', 'valid',
        'player_name', v.player_name,
        'entity_type', v.entity_type,
        'entity_name', v.entity_name,
        'service_name', v.service_name,
        'discount_percent', v.discount_percent,
        'expires_at', v.expires_at,
        'created_at', v.created_at
    );
END;
$$;


ALTER FUNCTION "public"."verify_voucher"("p_token" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."badge_definitions" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "name_kg" "text",
    "icon" "text" NOT NULL,
    "description" "text",
    "description_en" "text",
    "description_kg" "text",
    "condition_type" "text" NOT NULL,
    "condition_value" integer DEFAULT 0,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."badge_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "name_kg" "text",
    "gender" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "color" "text",
    CONSTRAINT "categories_gender_check" CHECK ((("gender" IS NULL) OR ("gender" = ANY (ARRAY['men'::"text", 'women'::"text"]))))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "voter_type" "text" NOT NULL,
    "voter_id" "text" NOT NULL,
    "predicted_winner_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenge_predictions_voter_type_check" CHECK (("voter_type" = ANY (ARRAY['site'::"text", 'telegram'::"text"])))
);


ALTER TABLE "public"."challenge_predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenger_id" "uuid",
    "challenger_player_id" "text" NOT NULL,
    "opponent_player_id" "text" NOT NULL,
    "opponent_profile_id" "uuid",
    "proposed_date" "date" NOT NULL,
    "proposed_time" "text" NOT NULL,
    "proposed_venue" "text",
    "proposed_court_id" "text",
    "message" "text",
    "counter_date" "date",
    "counter_time" "text",
    "counter_venue" "text",
    "counter_court_id" "text",
    "counter_step" "text",
    "status" "text" DEFAULT 'active'::"text",
    "match_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '72:00:00'::interval),
    "accepted_at" timestamp with time zone,
    "countered_at" timestamp with time zone,
    "battle_title" "text",
    "battle_published" boolean DEFAULT false,
    "battle_published_at" timestamp with time zone,
    "voting_closed" boolean DEFAULT false,
    "banner_url" "text",
    "battle_notified_at" timestamp with time zone,
    "score_draft" "text",
    "live_match_id" "uuid",
    "challenger_ntrp" numeric(4,2),
    "opponent_ntrp" numeric(4,2),
    "challenger_country" "text",
    "opponent_country" "text",
    "challenger_category" "text",
    "opponent_category" "text",
    "set_format" "text" DEFAULT 'standard'::"text",
    CONSTRAINT "challenges_counter_step_check" CHECK (("counter_step" = ANY (ARRAY['date'::"text", 'time'::"text", 'venue'::"text", NULL::"text"]))),
    CONSTRAINT "challenges_message_check" CHECK (("char_length"("message") <= 150)),
    CONSTRAINT "challenges_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'negotiating'::"text", 'countered'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coaches" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "name_kg" "text",
    "photo" "text",
    "specialization" "text",
    "specialization_en" "text",
    "experience" "text",
    "experience_en" "text",
    "phone" "text",
    "email" "text",
    "price" "text",
    "rating" numeric(2,1),
    "bio" "text",
    "bio_en" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "students" integer DEFAULT 0,
    "member_price" integer,
    "short_desc" "text",
    "short_desc_en" "text",
    "achievements" "text"[] DEFAULT '{}'::"text"[],
    "achievements_en" "text"[] DEFAULT '{}'::"text"[],
    "court" "text",
    "court_en" "text",
    "telegram" "text",
    "whatsapp" "text",
    "partner" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_name" "text",
    "first_name" "text",
    "patronymic" "text",
    "position" "text",
    "position_en" "text",
    "last_name_en" "text",
    "first_name_en" "text",
    "promoted" boolean DEFAULT false,
    "partner_pin" "text",
    "view_count" integer DEFAULT 0,
    "last_name_kg" "text",
    "first_name_kg" "text",
    "position_kg" "text",
    "short_desc_kg" "text",
    "bio_kg" "text",
    "achievements_kg" "jsonb" DEFAULT '[]'::"jsonb",
    "court_kg" "text",
    "view_count_app" integer DEFAULT 0
);


ALTER TABLE "public"."coaches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courts" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "name_kg" "text",
    "photo" "text",
    "gallery" "text"[] DEFAULT '{}'::"text"[],
    "rating" numeric(2,1) DEFAULT 0,
    "address" "text",
    "address_en" "text",
    "lat" numeric(8,4),
    "lng" numeric(8,4),
    "phone" "text",
    "short_desc" "text",
    "short_desc_en" "text",
    "description" "text",
    "description_en" "text",
    "amenities" "text"[] DEFAULT '{}'::"text"[],
    "amenities_en" "text"[] DEFAULT '{}'::"text"[],
    "schedule" "jsonb" DEFAULT '{}'::"jsonb",
    "schedule_en" "jsonb" DEFAULT '{}'::"jsonb",
    "partner" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "court_types" "jsonb" DEFAULT '[]'::"jsonb",
    "email" "text",
    "slogan" "text",
    "slogan_en" "text",
    "street" "text",
    "street_en" "text",
    "building" "text",
    "district" "text",
    "district_en" "text",
    "city" "text" DEFAULT 'Бишкек'::"text",
    "city_en" "text" DEFAULT 'Bishkek'::"text",
    "postal_code" "text",
    "google_maps_url" "text",
    "twogis_url" "text",
    "promoted" boolean DEFAULT false,
    "description_kg" "text",
    "slogan_kg" "text",
    "street_kg" "text",
    "district_kg" "text",
    "city_kg" "text",
    "partner_pin" "text",
    "view_count" integer DEFAULT 0,
    "additional_services" "jsonb" DEFAULT '[]'::"jsonb",
    "view_count_app" integer DEFAULT 0
);


ALTER TABLE "public"."courts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deleted_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "role" "text" DEFAULT 'user'::"text",
    "phone" "text",
    "telegram_chat_id" "text",
    "player_id" "text",
    "had_membership" boolean DEFAULT false,
    "deleted_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text"
);


ALTER TABLE "public"."deleted_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discount_vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "player_name" "text",
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" "text" NOT NULL,
    "service_id" "uuid",
    "service_name" "text" NOT NULL,
    "discount_percent" integer NOT NULL,
    "qr_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text") NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "used_at" timestamp with time zone,
    "confirmed_by_ip" "text",
    CONSTRAINT "discount_vouchers_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['court'::"text", 'coach'::"text"]))),
    CONSTRAINT "discount_vouchers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'used'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."discount_vouchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "entity_name" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'KGS'::"text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "payment_method" "text" NOT NULL,
    "purpose" "text" NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "entity_payments_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['court'::"text", 'coach'::"text", 'player'::"text", 'club'::"text"]))),
    CONSTRAINT "entity_payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'transfer'::"text", 'card'::"text"]))),
    CONSTRAINT "entity_payments_purpose_check" CHECK (("purpose" = ANY (ARRAY['promoted'::"text", 'sponsorship'::"text", 'rental'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."entity_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_player_id" "text" NOT NULL,
    "receiver_profile_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    CONSTRAINT "game_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."game_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."live_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid",
    "player1_id" "text",
    "player2_id" "text",
    "player1_name" "text",
    "player2_name" "text",
    "best_of" integer DEFAULT 3 NOT NULL,
    "youtube_url" "text",
    "umpire_key" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(16), 'hex'::"text") NOT NULL,
    "serving_player" integer DEFAULT 1,
    "points_p1" "text" DEFAULT '0'::"text",
    "points_p2" "text" DEFAULT '0'::"text",
    "current_set" integer DEFAULT 1,
    "sets_data" "jsonb" DEFAULT '[]'::"jsonb",
    "current_game_p1" integer DEFAULT 0,
    "current_game_p2" integer DEFAULT 0,
    "is_tiebreak" boolean DEFAULT false,
    "tiebreak_p1" integer DEFAULT 0,
    "tiebreak_p2" integer DEFAULT 0,
    "status" "text" DEFAULT 'warmup'::"text",
    "winner_player" integer,
    "final_score" "text",
    "history" "jsonb" DEFAULT '[]'::"jsonb",
    "tournament_label" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "sponsor_logo" "text",
    "set_format" "text" DEFAULT 'standard'::"text",
    CONSTRAINT "live_matches_best_of_check" CHECK (("best_of" = ANY (ARRAY[1, 3, 5]))),
    CONSTRAINT "live_matches_serving_player_check" CHECK (("serving_player" = ANY (ARRAY[1, 2]))),
    CONSTRAINT "live_matches_set_format_check" CHECK (("set_format" = ANY (ARRAY['standard'::"text", 'short'::"text"]))),
    CONSTRAINT "live_matches_status_check" CHECK (("status" = ANY (ARRAY['warmup'::"text", 'live'::"text", 'paused'::"text", 'completed'::"text"]))),
    CONSTRAINT "live_matches_winner_player_check" CHECK (("winner_player" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."live_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loyalty_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "title_en" "text",
    "cost" integer NOT NULL,
    "active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."loyalty_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loyalty_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "label" "text",
    "label_en" "text",
    "active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."loyalty_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loyalty_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "points" integer NOT NULL,
    "action" "text",
    "source_id" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "loyalty_transactions_type_check" CHECK (("type" = ANY (ARRAY['earn'::"text", 'redeem'::"text", 'expire'::"text", 'admin_adjust'::"text"])))
);


ALTER TABLE "public"."loyalty_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "text",
    "player1_id" "text",
    "player2_id" "text",
    "score" "text",
    "winner_id" "text",
    "round" "text",
    "played_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "match_order" integer,
    "round_number" integer,
    "court" integer,
    "scheduled_time" "text",
    "scheduled_day" "date",
    "status" "text" DEFAULT 'upcoming'::"text",
    "seed1" integer,
    "seed2" integer,
    "group_number" integer,
    "notified_at" timestamp with time zone,
    "match_type" "text" DEFAULT 'tournament'::"text"
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."membership_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "status" "text" DEFAULT 'select_period'::"text",
    "months" integer,
    "amount" numeric(10,2),
    "category_id" "text",
    "receipt_file_id" "text",
    "manager_message_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "membership_requests_status_check" CHECK (("status" = ANY (ARRAY['select_period'::"text", 'select_category'::"text", 'pending_receipt'::"text", 'pending_approval'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."membership_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "starts_at" "date",
    "expires_at" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "note" "text",
    CONSTRAINT "memberships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "title_en" "text",
    "title_kg" "text",
    "slug" "text",
    "content" "text",
    "content_en" "text",
    "excerpt" "text",
    "excerpt_en" "text",
    "image" "text",
    "category" "text",
    "author" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "executor" "text",
    "content_kg" "text",
    "excerpt_kg" "text",
    "gallery" "jsonb" DEFAULT '[]'::"jsonb",
    "content_images" "jsonb" DEFAULT '[]'::"jsonb",
    "poll" "jsonb",
    "view_count" integer DEFAULT 0,
    "tournament_id" "text",
    "results_notified_at" timestamp with time zone,
    "reactions_config" "jsonb",
    "view_count_app" integer DEFAULT 0,
    "image_original" "text"
);


ALTER TABLE "public"."news" OWNER TO "postgres";


COMMENT ON COLUMN "public"."news"."image" IS 'Обложка для карточек: кадрирована 16:9 при загрузке';



COMMENT ON COLUMN "public"."news"."image_original" IS 'Исходная афиша без обрезки — показывается в шапке новости';



CREATE TABLE IF NOT EXISTS "public"."news_poll_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "news_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "option_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."news_poll_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "news_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reaction_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "news_reactions_reaction_type_check" CHECK (("reaction_type" = ANY (ARRAY['tennis'::"text", 'fire'::"text", 'clap'::"text", 'star'::"text", 'heart'::"text", 'like'::"text", 'trophy'::"text", 'muscle'::"text", 'target'::"text", 'wow'::"text"])))
);


ALTER TABLE "public"."news_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'system'::"text" NOT NULL,
    "title" "text",
    "message" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."otp_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "block_key" "text" NOT NULL,
    "request_count" integer DEFAULT 1,
    "blocked_until" timestamp with time zone,
    "escalation" integer DEFAULT 0,
    "admin_unblocked" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."otp_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."otp_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "code" "text" NOT NULL,
    "flow" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "attempts" integer DEFAULT 0,
    "used" boolean DEFAULT false,
    "expires_at" timestamp with time zone NOT NULL,
    "ip" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "otp_codes_channel_check" CHECK (("channel" = ANY (ARRAY['telegram'::"text", 'email'::"text"]))),
    CONSTRAINT "otp_codes_flow_check" CHECK (("flow" = ANY (ARRAY['forgot_password'::"text", 'register'::"text", 'telegram_register'::"text"])))
);


ALTER TABLE "public"."otp_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "page_name" "text" NOT NULL,
    "view_count" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "service_name" "text" NOT NULL,
    "service_name_en" "text",
    "service_name_kg" "text",
    "discount_percent" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "partner_services_discount_percent_check" CHECK ((("discount_percent" >= 1) AND ("discount_percent" <= 100))),
    CONSTRAINT "partner_services_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['court'::"text", 'coach'::"text"])))
);


ALTER TABLE "public"."partner_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "membership_id" "uuid",
    "amount" numeric(10,2),
    "currency" "text" DEFAULT 'KGS'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "payment_method" "text",
    "external_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "note" "text",
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "text" NOT NULL,
    "badge_id" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_categories" (
    "player_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."player_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_promotions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "text",
    "from_category_id" "text",
    "to_category_id" "text",
    "season" integer NOT NULL,
    "status" "text" DEFAULT 'eligible'::"text",
    "eligible_date" timestamp with time zone DEFAULT "now"(),
    "completed_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_promotions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "name_kg" "text",
    "photo" "text",
    "country" "text" DEFAULT '🇰🇬'::"text",
    "category_id" "text",
    "points" integer DEFAULT 0,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "rank_change" integer DEFAULT 0,
    "form" "text"[] DEFAULT '{}'::"text"[],
    "badges" "text"[] DEFAULT '{}'::"text"[],
    "is_online" boolean DEFAULT false,
    "bio" "text",
    "bio_en" "text",
    "phone" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "show_phone" boolean DEFAULT false,
    "ntrp_rating" numeric(3,1),
    "banned_until" timestamp without time zone,
    "ban_reason" "text",
    "view_count" integer DEFAULT 0,
    "gender" character varying(10),
    "doubles_points" integer DEFAULT 0,
    "bio_kg" "text",
    "doubles_wins" integer DEFAULT 0,
    "doubles_losses" integer DEFAULT 0,
    "doubles_rank_change" integer DEFAULT 0,
    "doubles_form" "jsonb" DEFAULT '[]'::"jsonb",
    "view_count_app" integer DEFAULT 0
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."points_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "level_id" "uuid",
    "round" "text" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."points_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "phone" "text",
    "player_id" "text",
    "role" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gender" "text",
    "instagram" "text" DEFAULT ''::"text",
    "telegram" "text" DEFAULT ''::"text",
    "show_socials" boolean DEFAULT false,
    "birth_day" integer,
    "birth_month" integer,
    "birth_year" integer,
    "telegram_chat_id" bigint,
    "last_seen" timestamp with time zone,
    "play_level" "text",
    "preferred_time" "text",
    "telegram_username" "text",
    "banned_until" timestamp without time zone,
    "ban_reason" "text",
    "notify_preferences" "jsonb",
    "fcm_token" "text",
    "phone_e164" "text" GENERATED ALWAYS AS (
CASE
    WHEN ("regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text") = ''::"text") THEN ''::"text"
    WHEN ("length"("regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text")) = 9) THEN ('996'::"text" || "regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text"))
    WHEN (("length"("regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text")) = 10) AND ("left"("regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text"), 1) = '0'::"text")) THEN ('996'::"text" || "right"("regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text"), 9))
    ELSE "regexp_replace"(COALESCE("phone", ''::"text"), '[^0-9]'::"text", ''::"text", 'g'::"text")
END) STORED,
    "phone_country" "text",
    "show_phone" boolean DEFAULT false,
    "whatsapp_phone" "text",
    "whatsapp_country" "text",
    "show_whatsapp" boolean DEFAULT false,
    "show_telegram" boolean DEFAULT false,
    "show_instagram" boolean DEFAULT false,
    CONSTRAINT "profiles_birth_day_check" CHECK ((("birth_day" >= 1) AND ("birth_day" <= 31))),
    CONSTRAINT "profiles_birth_month_check" CHECK ((("birth_month" >= 1) AND ("birth_month" <= 12))),
    CONSTRAINT "profiles_play_level_check" CHECK (("play_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "profiles_preferred_time_check" CHECK (("preferred_time" = ANY (ARRAY['morning'::"text", 'afternoon'::"text", 'evening'::"text", 'weekend'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'player'::"text", 'manager'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."phone_e164" IS 'Телефон одними цифрами в международном виде. Местные номера достроены до 996. Для поиска при восстановлении доступа';



COMMENT ON COLUMN "public"."profiles"."phone_country" IS 'Страна телефона, код ISO 3166-1 alpha-2 (KG, RU, KZ). Выбирается человеком, а не выводится из номера';



COMMENT ON COLUMN "public"."profiles"."show_phone" IS 'Показывать телефон другим членам клуба на карточке игрока. Ставит сам игрок';



COMMENT ON COLUMN "public"."profiles"."whatsapp_phone" IS 'Номер WhatsApp, если отличается от основного. Пусто — используется phone';



COMMENT ON COLUMN "public"."profiles"."whatsapp_country" IS 'Страна номера WhatsApp, код ISO 3166-1 alpha-2';



COMMENT ON COLUMN "public"."profiles"."show_whatsapp" IS 'Показывать WhatsApp членам клуба. Не зависит от показа самого телефона';



COMMENT ON COLUMN "public"."profiles"."show_telegram" IS 'Показывать телеграм членам клуба';



COMMENT ON COLUMN "public"."profiles"."show_instagram" IS 'Показывать инстаграм членам клуба';



CREATE TABLE IF NOT EXISTS "public"."push_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "title" "text",
    "message" "text",
    "type" "text" DEFAULT 'system'::"text",
    "audience" "text",
    "recipients_count" integer DEFAULT 0,
    "fcm_sent" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "limit_key" "text" NOT NULL,
    "action" "text" NOT NULL,
    "ip" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rating_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "text" NOT NULL,
    "tournament_name" "text" NOT NULL,
    "tournament_id" "text",
    "points_earned" integer DEFAULT 0 NOT NULL,
    "recorded_at" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ntrp_before" numeric(4,2),
    "ntrp_after" numeric(4,2),
    "is_doubles" boolean DEFAULT false,
    "category_id" "text"
);


ALTER TABLE "public"."rating_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_reset_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"(),
    "season" "text" NOT NULL,
    "player_id" "text",
    "category_id" "text",
    "gender" "text",
    "points_before" integer,
    "points_after" integer,
    "rank_before" integer,
    "rank_after" integer,
    "notified" boolean DEFAULT false
);


ALTER TABLE "public"."season_reset_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo" "text",
    "url" "text",
    "is_hero" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "whatsapp" "text",
    "instagram" "text",
    "telegram" "text",
    "email" "text",
    "address" "text",
    "description" "text",
    "description_en" "text",
    "description_kg" "text",
    "phone" "text",
    "view_count" integer DEFAULT 0,
    "view_count_app" integer DEFAULT 0
);


ALTER TABLE "public"."sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tournament_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "text" NOT NULL,
    "player_id" "text",
    "seed_number" integer,
    "draw_position" integer,
    "status" "text" DEFAULT 'pending'::"text",
    "registered_at" timestamp with time zone DEFAULT "now"(),
    "group_number" integer,
    "is_external" boolean DEFAULT false,
    "external_name" "text",
    "external_country" "text",
    "external_ntrp" numeric,
    "partner_id" "text",
    "partner_external_name" "text",
    "partner_external_ntrp" numeric,
    "partner_gender" "text",
    "block_reason" "text",
    "withdrawn_at" timestamp with time zone,
    CONSTRAINT "tournament_registrations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'withdrawn'::"text", 'waitlist'::"text", 'blocked'::"text", 'draw'::"text"])))
);


ALTER TABLE "public"."tournament_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournament_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tournament_id" "text",
    "player_id" "text",
    "round_reached" "text" NOT NULL,
    "points_earned" integer DEFAULT 0,
    "season" integer NOT NULL,
    "category_id" "text",
    "is_transition" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_doubles" boolean DEFAULT false,
    "partner_id" "text"
);


ALTER TABLE "public"."tournament_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "title_en" "text",
    "title_kg" "text",
    "description" "text",
    "description_en" "text",
    "date_start" "date" NOT NULL,
    "date_end" "date",
    "location" "text",
    "location_en" "text",
    "category_id" "text" NOT NULL,
    "status" "text" DEFAULT 'upcoming'::"text",
    "max_participants" integer NOT NULL,
    "prize_fund" "text",
    "image" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "format" "text" DEFAULT 'singles'::"text",
    "level_id" "uuid",
    "draw_size" integer,
    "bracket_type" "text",
    "court_count" integer DEFAULT 2,
    "match_duration" integer DEFAULT 90,
    "registration_end" "date",
    "court_id" "text",
    "registration_start" "date",
    "description_kg" "text",
    "published_at" timestamp with time zone,
    "start_time" "text",
    "buffer_minutes" integer DEFAULT 15,
    "group_count" integer,
    "qualifiers_per_group" integer DEFAULT 2,
    "notified_at" timestamp with time zone,
    "view_count" integer DEFAULT 0,
    "reminded_3d_at" timestamp with time zone,
    "reminded_1d_at" timestamp with time zone,
    "ntrp_min" numeric,
    "ntrp_max" numeric,
    "ntrp_combined_max" numeric,
    "gender" "text" NOT NULL,
    "manual_group_places" "jsonb" DEFAULT '{}'::"jsonb",
    "reserved_spots" integer DEFAULT 0,
    "ig_meta" "jsonb",
    "set_format" "text" DEFAULT 'standard'::"text",
    "view_count_app" integer DEFAULT 0,
    CONSTRAINT "tournaments_format_check" CHECK (("format" = ANY (ARRAY['singles'::"text", 'doubles'::"text", 'mixed_doubles'::"text"]))),
    CONSTRAINT "tournaments_gender_check" CHECK (("gender" = ANY (ARRAY['men'::"text", 'women'::"text", 'mixed'::"text"]))),
    CONSTRAINT "tournaments_set_format_check" CHECK (("set_format" = ANY (ARRAY['standard'::"text", 'short'::"text"]))),
    CONSTRAINT "tournaments_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'registration_open'::"text", 'registration_closed'::"text", 'ongoing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "device_hash" "text" NOT NULL,
    "user_agent" "text",
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_devices" OWNER TO "postgres";


ALTER TABLE ONLY "public"."badge_definitions"
    ADD CONSTRAINT "badge_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_predictions"
    ADD CONSTRAINT "challenge_predictions_challenge_id_voter_type_voter_id_key" UNIQUE ("challenge_id", "voter_type", "voter_id");



ALTER TABLE ONLY "public"."challenge_predictions"
    ADD CONSTRAINT "challenge_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coaches"
    ADD CONSTRAINT "coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courts"
    ADD CONSTRAINT "courts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deleted_accounts"
    ADD CONSTRAINT "deleted_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_vouchers"
    ADD CONSTRAINT "discount_vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discount_vouchers"
    ADD CONSTRAINT "discount_vouchers_qr_token_key" UNIQUE ("qr_token");



ALTER TABLE ONLY "public"."entity_payments"
    ADD CONSTRAINT "entity_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_invites"
    ADD CONSTRAINT "game_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."live_matches"
    ADD CONSTRAINT "live_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."live_matches"
    ADD CONSTRAINT "live_matches_umpire_key_key" UNIQUE ("umpire_key");



ALTER TABLE ONLY "public"."loyalty_rewards"
    ADD CONSTRAINT "loyalty_rewards_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."loyalty_rewards"
    ADD CONSTRAINT "loyalty_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loyalty_rules"
    ADD CONSTRAINT "loyalty_rules_action_key" UNIQUE ("action");



ALTER TABLE ONLY "public"."loyalty_rules"
    ADD CONSTRAINT "loyalty_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."membership_requests"
    ADD CONSTRAINT "membership_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_poll_votes"
    ADD CONSTRAINT "news_poll_votes_news_id_user_id_key" UNIQUE ("news_id", "user_id");



ALTER TABLE ONLY "public"."news_poll_votes"
    ADD CONSTRAINT "news_poll_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_reactions"
    ADD CONSTRAINT "news_reactions_news_id_user_id_reaction_type_key" UNIQUE ("news_id", "user_id", "reaction_type");



ALTER TABLE ONLY "public"."news_reactions"
    ADD CONSTRAINT "news_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp_blocks"
    ADD CONSTRAINT "otp_blocks_block_key_key" UNIQUE ("block_key");



ALTER TABLE ONLY "public"."otp_blocks"
    ADD CONSTRAINT "otp_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp_codes"
    ADD CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("page_name");



ALTER TABLE ONLY "public"."partner_services"
    ADD CONSTRAINT "partner_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_badges"
    ADD CONSTRAINT "player_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_badges"
    ADD CONSTRAINT "player_badges_player_id_badge_id_key" UNIQUE ("player_id", "badge_id");



ALTER TABLE ONLY "public"."player_categories"
    ADD CONSTRAINT "player_categories_pkey" PRIMARY KEY ("player_id", "category_id");



ALTER TABLE ONLY "public"."player_promotions"
    ADD CONSTRAINT "player_promotions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."points_rules"
    ADD CONSTRAINT "points_rules_level_id_round_key" UNIQUE ("level_id", "round");



ALTER TABLE ONLY "public"."points_rules"
    ADD CONSTRAINT "points_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_unique" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_telegram_chat_id_unique" UNIQUE ("telegram_chat_id");



ALTER TABLE ONLY "public"."push_log"
    ADD CONSTRAINT "push_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_reset_log"
    ADD CONSTRAINT "season_reset_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_levels"
    ADD CONSTRAINT "tournament_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_results"
    ADD CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_results"
    ADD CONSTRAINT "tournament_results_tournament_id_player_id_key" UNIQUE ("tournament_id", "player_id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_profile_id_device_hash_key" UNIQUE ("profile_id", "device_hash");



CREATE INDEX "idx_challenges_battle" ON "public"."challenges" USING "btree" ("battle_published") WHERE ("battle_published" = true);



CREATE INDEX "idx_challenges_challenger" ON "public"."challenges" USING "btree" ("challenger_id");



CREATE INDEX "idx_challenges_expires" ON "public"."challenges" USING "btree" ("expires_at") WHERE ("status" = ANY (ARRAY['active'::"text", 'negotiating'::"text", 'countered'::"text"]));



CREATE UNIQUE INDEX "idx_challenges_live_match" ON "public"."challenges" USING "btree" ("live_match_id") WHERE ("live_match_id" IS NOT NULL);



CREATE INDEX "idx_challenges_opponent" ON "public"."challenges" USING "btree" ("opponent_profile_id");



CREATE INDEX "idx_challenges_status" ON "public"."challenges" USING "btree" ("status");



CREATE INDEX "idx_deleted_accounts_date" ON "public"."deleted_accounts" USING "btree" ("deleted_at");



CREATE INDEX "idx_entity_payments_entity" ON "public"."entity_payments" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_entity_payments_promoted" ON "public"."entity_payments" USING "btree" ("purpose", "period_start", "period_end");



CREATE INDEX "idx_game_invites_receiver" ON "public"."game_invites" USING "btree" ("receiver_profile_id");



CREATE INDEX "idx_game_invites_sender" ON "public"."game_invites" USING "btree" ("sender_id");



CREATE INDEX "idx_game_invites_status" ON "public"."game_invites" USING "btree" ("status");



CREATE INDEX "idx_live_matches_status" ON "public"."live_matches" USING "btree" ("status");



CREATE INDEX "idx_live_matches_umpire_key" ON "public"."live_matches" USING "btree" ("umpire_key");



CREATE INDEX "idx_loyalty_expires" ON "public"."loyalty_transactions" USING "btree" ("expires_at") WHERE ("type" = 'earn'::"text");



CREATE INDEX "idx_loyalty_profile" ON "public"."loyalty_transactions" USING "btree" ("profile_id");



CREATE INDEX "idx_matches_group" ON "public"."matches" USING "btree" ("group_number");



CREATE INDEX "idx_matches_played_at" ON "public"."matches" USING "btree" ("played_at" DESC);



CREATE INDEX "idx_matches_player1" ON "public"."matches" USING "btree" ("player1_id");



CREATE INDEX "idx_matches_player2" ON "public"."matches" USING "btree" ("player2_id");



CREATE INDEX "idx_matches_round" ON "public"."matches" USING "btree" ("round_number");



CREATE INDEX "idx_matches_status" ON "public"."matches" USING "btree" ("status");



CREATE INDEX "idx_matches_tournament" ON "public"."matches" USING "btree" ("tournament_id");



CREATE INDEX "idx_membership_requests_profile" ON "public"."membership_requests" USING "btree" ("profile_id");



CREATE INDEX "idx_membership_requests_status" ON "public"."membership_requests" USING "btree" ("status");



CREATE INDEX "idx_memberships_profile" ON "public"."memberships" USING "btree" ("profile_id");



CREATE INDEX "idx_news_poll_votes_news_id" ON "public"."news_poll_votes" USING "btree" ("news_id");



CREATE INDEX "idx_news_poll_votes_user_id" ON "public"."news_poll_votes" USING "btree" ("user_id");



CREATE INDEX "idx_news_published" ON "public"."news" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_news_reactions_news_id" ON "public"."news_reactions" USING "btree" ("news_id");



CREATE INDEX "idx_news_reactions_user_id" ON "public"."news_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_news_slug" ON "public"."news" USING "btree" ("slug");



CREATE INDEX "idx_news_tournament_id" ON "public"."news" USING "btree" ("tournament_id");



CREATE INDEX "idx_notification_log_profile" ON "public"."notification_log" USING "btree" ("profile_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_otp_blocks_key" ON "public"."otp_blocks" USING "btree" ("block_key");



CREATE INDEX "idx_otp_blocks_until" ON "public"."otp_blocks" USING "btree" ("blocked_until");



CREATE INDEX "idx_otp_codes_lookup" ON "public"."otp_codes" USING "btree" ("identifier", "flow", "used", "expires_at");



CREATE INDEX "idx_partner_services_entity" ON "public"."partner_services" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_payments_profile" ON "public"."payments" USING "btree" ("profile_id");



CREATE INDEX "idx_player_badges_player" ON "public"."player_badges" USING "btree" ("player_id");



CREATE INDEX "idx_player_categories_cat" ON "public"."player_categories" USING "btree" ("category_id", "points" DESC);



CREATE INDEX "idx_player_promotions_player" ON "public"."player_promotions" USING "btree" ("player_id");



CREATE INDEX "idx_player_promotions_season" ON "public"."player_promotions" USING "btree" ("season");



CREATE INDEX "idx_players_category" ON "public"."players" USING "btree" ("category_id");



CREATE INDEX "idx_players_points" ON "public"."players" USING "btree" ("points" DESC);



CREATE INDEX "idx_predictions_challenge" ON "public"."challenge_predictions" USING "btree" ("challenge_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_phone_e164" ON "public"."profiles" USING "btree" ("phone_e164") WHERE ("phone_e164" <> ''::"text");



CREATE INDEX "idx_rate_limits_key_time" ON "public"."rate_limits" USING "btree" ("limit_key", "created_at" DESC);



CREATE INDEX "idx_rating_history_category" ON "public"."rating_history" USING "btree" ("player_id", "category_id");



CREATE INDEX "idx_rating_history_date" ON "public"."rating_history" USING "btree" ("recorded_at");



CREATE INDEX "idx_rating_history_player" ON "public"."rating_history" USING "btree" ("player_id");



CREATE INDEX "idx_registrations_blocked" ON "public"."tournament_registrations" USING "btree" ("tournament_id") WHERE ("status" = 'blocked'::"text");



CREATE INDEX "idx_registrations_player" ON "public"."tournament_registrations" USING "btree" ("player_id");



CREATE INDEX "idx_registrations_status" ON "public"."tournament_registrations" USING "btree" ("status");



CREATE INDEX "idx_registrations_tournament" ON "public"."tournament_registrations" USING "btree" ("tournament_id");



CREATE INDEX "idx_season_reset_player" ON "public"."season_reset_log" USING "btree" ("player_id");



CREATE INDEX "idx_season_reset_run" ON "public"."season_reset_log" USING "btree" ("run_at" DESC);



CREATE INDEX "idx_tournament_results_category" ON "public"."tournament_results" USING "btree" ("category_id");



CREATE INDEX "idx_tournament_results_player" ON "public"."tournament_results" USING "btree" ("player_id");



CREATE INDEX "idx_tournament_results_season" ON "public"."tournament_results" USING "btree" ("season");



CREATE INDEX "idx_tournament_results_tournament" ON "public"."tournament_results" USING "btree" ("tournament_id");



CREATE INDEX "idx_tournaments_date" ON "public"."tournaments" USING "btree" ("date_start" DESC);



CREATE INDEX "idx_tournaments_status" ON "public"."tournaments" USING "btree" ("status");



CREATE INDEX "idx_vouchers_entity" ON "public"."discount_vouchers" USING "btree" ("entity_type", "entity_id", "status");



CREATE INDEX "idx_vouchers_profile_status" ON "public"."discount_vouchers" USING "btree" ("profile_id", "status");



CREATE INDEX "idx_vouchers_qr_token" ON "public"."discount_vouchers" USING "btree" ("qr_token");



CREATE UNIQUE INDEX "tournament_registrations_tournament_player_unique" ON "public"."tournament_registrations" USING "btree" ("tournament_id", "player_id") WHERE ("player_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "registrations_guard_self_update" BEFORE UPDATE ON "public"."tournament_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."registrations_guard_self_update"();



CREATE OR REPLACE TRIGGER "set_updated_at_players" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_check_doubles_unique" BEFORE INSERT OR UPDATE ON "public"."tournament_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."check_doubles_unique"();



CREATE OR REPLACE TRIGGER "trg_log_deleted_profile" BEFORE DELETE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_deleted_profile"();



CREATE OR REPLACE TRIGGER "trg_player_badges" AFTER UPDATE ON "public"."players" FOR EACH ROW WHEN ((("old"."wins" IS DISTINCT FROM "new"."wins") OR ("old"."losses" IS DISTINCT FROM "new"."losses") OR ("old"."form" IS DISTINCT FROM "new"."form") OR ("old"."points" IS DISTINCT FROM "new"."points"))) EXECUTE FUNCTION "public"."trigger_check_badges"();



CREATE OR REPLACE TRIGGER "trg_recalculate_badges" BEFORE INSERT OR UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_badges"();



CREATE OR REPLACE TRIGGER "trg_sync_player_name" AFTER UPDATE OF "full_name", "avatar_url" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_player_name"();



ALTER TABLE ONLY "public"."challenge_predictions"
    ADD CONSTRAINT "challenge_predictions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_predictions"
    ADD CONSTRAINT "challenge_predictions_predicted_winner_id_fkey" FOREIGN KEY ("predicted_winner_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_challenger_player_id_fkey" FOREIGN KEY ("challenger_player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_counter_court_id_fkey" FOREIGN KEY ("counter_court_id") REFERENCES "public"."courts"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_live_match_id_fkey" FOREIGN KEY ("live_match_id") REFERENCES "public"."live_matches"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_opponent_player_id_fkey" FOREIGN KEY ("opponent_player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_opponent_profile_id_fkey" FOREIGN KEY ("opponent_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_proposed_court_id_fkey" FOREIGN KEY ("proposed_court_id") REFERENCES "public"."courts"("id");



ALTER TABLE ONLY "public"."discount_vouchers"
    ADD CONSTRAINT "discount_vouchers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."discount_vouchers"
    ADD CONSTRAINT "discount_vouchers_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."partner_services"("id");



ALTER TABLE ONLY "public"."entity_payments"
    ADD CONSTRAINT "entity_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."game_invites"
    ADD CONSTRAINT "game_invites_receiver_profile_id_fkey" FOREIGN KEY ("receiver_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."game_invites"
    ADD CONSTRAINT "game_invites_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."live_matches"
    ADD CONSTRAINT "live_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."live_matches"
    ADD CONSTRAINT "live_matches_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."live_matches"
    ADD CONSTRAINT "live_matches_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."membership_requests"
    ADD CONSTRAINT "membership_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_poll_votes"
    ADD CONSTRAINT "news_poll_votes_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_poll_votes"
    ADD CONSTRAINT "news_poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_reactions"
    ADD CONSTRAINT "news_reactions_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_reactions"
    ADD CONSTRAINT "news_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."player_badges"
    ADD CONSTRAINT "player_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_badges"
    ADD CONSTRAINT "player_badges_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_categories"
    ADD CONSTRAINT "player_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_categories"
    ADD CONSTRAINT "player_categories_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_promotions"
    ADD CONSTRAINT "player_promotions_from_category_id_fkey" FOREIGN KEY ("from_category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."player_promotions"
    ADD CONSTRAINT "player_promotions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_promotions"
    ADD CONSTRAINT "player_promotions_to_category_id_fkey" FOREIGN KEY ("to_category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."points_rules"
    ADD CONSTRAINT "points_rules_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."tournament_levels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."push_log"
    ADD CONSTRAINT "push_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rating_history"
    ADD CONSTRAINT "rating_history_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."season_reset_log"
    ADD CONSTRAINT "season_reset_log_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "tournament_registrations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "tournament_registrations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_registrations"
    ADD CONSTRAINT "tournament_registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_results"
    ADD CONSTRAINT "tournament_results_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."tournament_results"
    ADD CONSTRAINT "tournament_results_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."tournament_results"
    ADD CONSTRAINT "tournament_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_results"
    ADD CONSTRAINT "tournament_results_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."tournament_levels"("id");



ALTER TABLE ONLY "public"."user_devices"
    ADD CONSTRAINT "user_devices_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin full access categories" ON "public"."categories" USING ("public"."is_admin"());



CREATE POLICY "Admin full access coaches" ON "public"."coaches" USING ("public"."is_admin"());



CREATE POLICY "Admin full access matches" ON "public"."matches" USING ("public"."is_admin"());



CREATE POLICY "Admin full access news" ON "public"."news" USING ("public"."is_admin"());



CREATE POLICY "Admin full access players" ON "public"."players" USING ("public"."is_admin"());



CREATE POLICY "Admin full access profiles" ON "public"."profiles" USING ("public"."is_admin"());



CREATE POLICY "Admin full access tournaments" ON "public"."tournaments" USING ("public"."is_admin"());



CREATE POLICY "Admins can read push_log" ON "public"."push_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Anyone can read page_views" ON "public"."page_views" FOR SELECT USING (true);



CREATE POLICY "Anyone can read reactions" ON "public"."news_reactions" FOR SELECT USING (true);



CREATE POLICY "Anyone can read votes" ON "public"."news_poll_votes" FOR SELECT USING (true);



CREATE POLICY "Anyone reads player categories" ON "public"."player_categories" FOR SELECT USING (true);



CREATE POLICY "Auth users insert reactions" ON "public"."news_reactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Auth users insert vote" ON "public"."news_poll_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Coaches: admin write" ON "public"."coaches" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Coaches: public read" ON "public"."coaches" FOR SELECT USING (true);



CREATE POLICY "Courts editable by admins" ON "public"."courts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Courts visible to all" ON "public"."courts" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."rating_history" FOR SELECT USING (true);



CREATE POLICY "Public read badges" ON "public"."badge_definitions" FOR SELECT USING (true);



CREATE POLICY "Public read categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public read coaches" ON "public"."coaches" FOR SELECT USING (true);



CREATE POLICY "Public read matches" ON "public"."matches" FOR SELECT USING (true);



CREATE POLICY "Public read news" ON "public"."news" FOR SELECT USING (true);



CREATE POLICY "Public read player badges" ON "public"."player_badges" FOR SELECT USING (true);



CREATE POLICY "Public read players" ON "public"."players" FOR SELECT USING (true);



CREATE POLICY "Public read published news" ON "public"."news" FOR SELECT TO "anon" USING (("published_at" IS NOT NULL));



CREATE POLICY "Public read tournaments" ON "public"."tournaments" FOR SELECT USING (true);



CREATE POLICY "Service can insert notifications" ON "public"."notification_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert push_log" ON "public"."push_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service insert notifications" ON "public"."notification_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Staff can manage page_views" ON "public"."page_views" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Staff delete" ON "public"."rating_history" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Staff full access entity_payments" ON "public"."entity_payments" USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());



CREATE POLICY "Staff full access memberships" ON "public"."memberships" USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());



CREATE POLICY "Staff full access payments" ON "public"."payments" USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());



CREATE POLICY "Staff full access season reset" ON "public"."season_reset_log" USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());



CREATE POLICY "Staff insert" ON "public"."rating_history" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Staff manage badges" ON "public"."player_badges" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Staff read notifications" ON "public"."notification_log" FOR SELECT USING ("public"."is_staff"());



CREATE POLICY "Staff update" ON "public"."rating_history" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "Staff writes player categories" ON "public"."player_categories" USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own notifications" ON "public"."notification_log" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notification_log" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users delete own reactions" ON "public"."news_reactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own devices" ON "public"."user_devices" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users read own devices" ON "public"."user_devices" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users read own membership" ON "public"."memberships" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users read own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users read own season reset" ON "public"."season_reset_log" FOR SELECT USING (("player_id" = ( SELECT "profiles"."player_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users update own devices" ON "public"."user_devices" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."badge_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "challenges_challenger_read" ON "public"."challenges" FOR SELECT USING (("challenger_id" = "auth"."uid"()));



CREATE POLICY "challenges_completed_read" ON "public"."challenges" FOR SELECT TO "authenticated" USING (("status" = 'completed'::"text"));



CREATE POLICY "challenges_insert" ON "public"."challenges" FOR INSERT WITH CHECK (("challenger_id" = "auth"."uid"()));



CREATE POLICY "challenges_opponent_read" ON "public"."challenges" FOR SELECT USING (("opponent_profile_id" = "auth"."uid"()));



CREATE POLICY "challenges_public_battles" ON "public"."challenges" FOR SELECT USING (("battle_published" = true));



CREATE POLICY "challenges_staff_all" ON "public"."challenges" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."coaches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deleted_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deleted_accounts_staff_read" ON "public"."deleted_accounts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."discount_vouchers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."live_matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "live_matches_public_read" ON "public"."live_matches" FOR SELECT USING (true);



CREATE POLICY "live_matches_staff_delete" ON "public"."live_matches" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "live_matches_staff_insert" ON "public"."live_matches" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "live_matches_staff_update" ON "public"."live_matches" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."loyalty_rewards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "loyalty_rewards_staff_all" ON "public"."loyalty_rewards" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "loyalty_rewards_user_read" ON "public"."loyalty_rewards" FOR SELECT USING (("active" = true));



ALTER TABLE "public"."loyalty_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "loyalty_rules_staff_all" ON "public"."loyalty_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "loyalty_rules_user_read" ON "public"."loyalty_rules" FOR SELECT USING (("active" = true));



ALTER TABLE "public"."loyalty_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "loyalty_transactions_staff_all" ON "public"."loyalty_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "loyalty_transactions_user_read" ON "public"."loyalty_transactions" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "loyalty_transactions_user_redeem" ON "public"."loyalty_transactions" FOR INSERT WITH CHECK ((("profile_id" = "auth"."uid"()) AND ("type" = 'redeem'::"text")));



CREATE POLICY "managers_update_players" ON "public"."players" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "membership_requests_own_insert" ON "public"."membership_requests" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "membership_requests_own_read" ON "public"."membership_requests" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "membership_requests_own_update" ON "public"."membership_requests" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "membership_requests_staff_read" ON "public"."membership_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "membership_requests_staff_update" ON "public"."membership_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_poll_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partner_services_public_read" ON "public"."partner_services" FOR SELECT USING (true);



CREATE POLICY "partner_services_staff_delete" ON "public"."partner_services" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "partner_services_staff_insert" ON "public"."partner_services" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "partner_services_staff_update" ON "public"."partner_services" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_promotions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_promotions_admin_delete" ON "public"."player_promotions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "player_promotions_admin_insert" ON "public"."player_promotions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "player_promotions_admin_update" ON "public"."player_promotions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "player_promotions_read" ON "public"."player_promotions" FOR SELECT USING (true);



ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."points_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "points_rules_admin_delete" ON "public"."points_rules" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "points_rules_admin_insert" ON "public"."points_rules" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "points_rules_admin_update" ON "public"."points_rules" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "points_rules_read" ON "public"."points_rules" FOR SELECT USING (true);



CREATE POLICY "predictions_insert_auth" ON "public"."challenge_predictions" FOR INSERT TO "authenticated" WITH CHECK ((("voter_type" = 'site'::"text") AND ("voter_id" = ("auth"."uid"())::"text")));



CREATE POLICY "predictions_select_all" ON "public"."challenge_predictions" FOR SELECT USING (true);



CREATE POLICY "predictions_staff_all" ON "public"."challenge_predictions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "predictions_update_auth" ON "public"."challenge_predictions" FOR UPDATE TO "authenticated" USING ((("voter_type" = 'site'::"text") AND ("voter_id" = ("auth"."uid"())::"text"))) WITH CHECK ((("voter_type" = 'site'::"text") AND ("voter_id" = ("auth"."uid"())::"text")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rating_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "receiver_read" ON "public"."game_invites" FOR SELECT USING (("receiver_profile_id" = "auth"."uid"()));



CREATE POLICY "registrations_admin_delete" ON "public"."tournament_registrations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "registrations_admin_update" ON "public"."tournament_registrations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "registrations_insert" ON "public"."tournament_registrations" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "registrations_read" ON "public"."tournament_registrations" FOR SELECT USING (true);



CREATE POLICY "registrations_self_add_partner" ON "public"."tournament_registrations" FOR UPDATE USING (("player_id" IN ( SELECT "profiles"."player_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))) WITH CHECK (("player_id" IN ( SELECT "profiles"."player_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."season_reset_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sender_read" ON "public"."game_invites" FOR SELECT USING (("sender_id" = "auth"."uid"()));



ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sponsors_admin_delete" ON "public"."sponsors" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "sponsors_admin_insert" ON "public"."sponsors" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "sponsors_admin_update" ON "public"."sponsors" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "sponsors_read" ON "public"."sponsors" FOR SELECT USING (true);



ALTER TABLE "public"."tournament_levels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tournament_levels_admin_delete" ON "public"."tournament_levels" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "tournament_levels_admin_insert" ON "public"."tournament_levels" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "tournament_levels_admin_update" ON "public"."tournament_levels" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "tournament_levels_read" ON "public"."tournament_levels" FOR SELECT USING (true);



ALTER TABLE "public"."tournament_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tournament_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tournament_results_admin_delete" ON "public"."tournament_results" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "tournament_results_admin_insert" ON "public"."tournament_results" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "tournament_results_admin_update" ON "public"."tournament_results" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "tournament_results_read" ON "public"."tournament_results" FOR SELECT USING (true);



ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vouchers_staff_read_all" ON "public"."discount_vouchers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "vouchers_staff_update" ON "public"."discount_vouchers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "vouchers_user_insert_own" ON "public"."discount_vouchers" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "vouchers_user_read_own" ON "public"."discount_vouchers" FOR SELECT USING (("profile_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."live_matches";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."cast_battle_vote"("p_challenge_id" "uuid", "p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cast_battle_vote"("p_challenge_id" "uuid", "p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cast_battle_vote"("p_challenge_id" "uuid", "p_player_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_award_badges"("p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_award_badges"("p_player_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_doubles_unique"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_doubles_unique"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_doubles_unique"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_player_badges"("p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_player_badges"("p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_player_badges"("p_player_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_registration_available"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_registration_available"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_registration_available"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_otp"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_otp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_otp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_voucher"("p_token" "text", "p_pin" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_voucher"("p_token" "text", "p_pin" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_voucher"("p_token" "text", "p_pin" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_voucher"("p_entity_type" "text", "p_entity_id" "text", "p_service_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_voucher"("p_entity_type" "text", "p_entity_id" "text", "p_service_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_voucher"("p_entity_type" "text", "p_entity_id" "text", "p_service_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_analytics_overview"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_analytics_overview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_analytics_overview"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_battle_public"("p_challenge_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_battle_public"("p_challenge_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_battle_public"("p_challenge_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_battle_votes"("p_challenge_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_battle_votes"("p_challenge_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_battle_votes"("p_challenge_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_live_by_umpire_key"("p_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_live_by_umpire_key"("p_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_live_by_umpire_key"("p_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_loyalty_balance"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_loyalty_balance"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_loyalty_balance"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_game_invites"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_game_invites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_game_invites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_news_engagement"("p_news_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_news_engagement"("p_news_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_news_engagement"("p_news_ids" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_news_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_news_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_news_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_page_view_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_page_view_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_page_view_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_avatar"("p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_avatar"("p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_avatar"("p_player_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_challenges"("p_player_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_challenges"("p_player_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_challenges"("p_player_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_poll_results"("p_news_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_poll_results"("p_news_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_poll_results"("p_news_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_partners"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_partners"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_partners"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reaction_counts"("p_news_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_reaction_counts"("p_news_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reaction_counts"("p_news_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_news"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_news"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_news"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tournament_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_tournament_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tournament_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_reactions"("p_news_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_reactions"("p_news_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_reactions"("p_news_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_coach_view"("p_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_coach_view"("p_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_coach_view"("p_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_coach_view"("p_id" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_coach_view"("p_id" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_coach_view"("p_id" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_court_view"("p_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_court_view"("p_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_court_view"("p_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_court_view"("p_id" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_court_view"("p_id" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_court_view"("p_id" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_news_view"("p_news_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_news_view"("p_news_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_news_view"("p_news_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_news_view"("p_news_id" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_news_view"("p_news_id" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_news_view"("p_news_id" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_page_view"("p_page_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_page_view"("p_page_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_page_view"("p_page_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_player_view"("p_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_player_view"("p_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_player_view"("p_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_player_view"("p_id" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_player_view"("p_id" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_player_view"("p_id" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_sponsor_view"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_sponsor_view"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_sponsor_view"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_sponsor_view"("p_id" "uuid", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_sponsor_view"("p_id" "uuid", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_sponsor_view"("p_id" "uuid", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_tournament_view"("p_tournament_id" "text", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_deleted_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_deleted_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_deleted_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_all_player_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_all_player_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_all_player_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_player_categories"("p_ids" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_badges"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_badges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_badges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."registrations_guard_self_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."registrations_guard_self_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrations_guard_self_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_int"("val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_int"("val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_int"("val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_player_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_player_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_player_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."translit_ru"("src" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translit_ru"("src" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translit_ru"("src" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_check_badges"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_check_badges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_check_badges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."umpire_save_state"("p_key" "text", "p_state" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."umpire_save_state"("p_key" "text", "p_state" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."umpire_save_state"("p_key" "text", "p_state" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_voucher"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_voucher"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_voucher"("p_token" "text") TO "service_role";
























GRANT ALL ON TABLE "public"."badge_definitions" TO "anon";
GRANT ALL ON TABLE "public"."badge_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."badge_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_predictions" TO "anon";
GRANT ALL ON TABLE "public"."challenge_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_predictions" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."coaches" TO "anon";
GRANT ALL ON TABLE "public"."coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."coaches" TO "service_role";



GRANT ALL ON TABLE "public"."courts" TO "anon";
GRANT ALL ON TABLE "public"."courts" TO "authenticated";
GRANT ALL ON TABLE "public"."courts" TO "service_role";



GRANT ALL ON TABLE "public"."deleted_accounts" TO "anon";
GRANT ALL ON TABLE "public"."deleted_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."deleted_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."discount_vouchers" TO "anon";
GRANT ALL ON TABLE "public"."discount_vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."discount_vouchers" TO "service_role";



GRANT ALL ON TABLE "public"."entity_payments" TO "anon";
GRANT ALL ON TABLE "public"."entity_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_payments" TO "service_role";



GRANT ALL ON TABLE "public"."game_invites" TO "anon";
GRANT ALL ON TABLE "public"."game_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."game_invites" TO "service_role";



GRANT ALL ON TABLE "public"."live_matches" TO "anon";
GRANT ALL ON TABLE "public"."live_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."live_matches" TO "service_role";



GRANT ALL ON TABLE "public"."loyalty_rewards" TO "anon";
GRANT ALL ON TABLE "public"."loyalty_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."loyalty_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."loyalty_rules" TO "anon";
GRANT ALL ON TABLE "public"."loyalty_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."loyalty_rules" TO "service_role";



GRANT ALL ON TABLE "public"."loyalty_transactions" TO "anon";
GRANT ALL ON TABLE "public"."loyalty_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."loyalty_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."membership_requests" TO "anon";
GRANT ALL ON TABLE "public"."membership_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_requests" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."news_poll_votes" TO "anon";
GRANT ALL ON TABLE "public"."news_poll_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."news_poll_votes" TO "service_role";



GRANT ALL ON TABLE "public"."news_reactions" TO "anon";
GRANT ALL ON TABLE "public"."news_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."news_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."notification_log" TO "anon";
GRANT ALL ON TABLE "public"."notification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_log" TO "service_role";



GRANT ALL ON TABLE "public"."otp_blocks" TO "anon";
GRANT ALL ON TABLE "public"."otp_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."otp_codes" TO "anon";
GRANT ALL ON TABLE "public"."otp_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_codes" TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."partner_services" TO "anon";
GRANT ALL ON TABLE "public"."partner_services" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_services" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."player_badges" TO "anon";
GRANT ALL ON TABLE "public"."player_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."player_badges" TO "service_role";



GRANT ALL ON TABLE "public"."player_categories" TO "anon";
GRANT ALL ON TABLE "public"."player_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."player_categories" TO "service_role";



GRANT ALL ON TABLE "public"."player_promotions" TO "anon";
GRANT ALL ON TABLE "public"."player_promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."player_promotions" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."points_rules" TO "anon";
GRANT ALL ON TABLE "public"."points_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."points_rules" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_log" TO "anon";
GRANT ALL ON TABLE "public"."push_log" TO "authenticated";
GRANT ALL ON TABLE "public"."push_log" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."rating_history" TO "anon";
GRANT ALL ON TABLE "public"."rating_history" TO "authenticated";
GRANT ALL ON TABLE "public"."rating_history" TO "service_role";



GRANT ALL ON TABLE "public"."season_reset_log" TO "anon";
GRANT ALL ON TABLE "public"."season_reset_log" TO "authenticated";
GRANT ALL ON TABLE "public"."season_reset_log" TO "service_role";



GRANT ALL ON TABLE "public"."sponsors" TO "anon";
GRANT ALL ON TABLE "public"."sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_levels" TO "anon";
GRANT ALL ON TABLE "public"."tournament_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_levels" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_registrations" TO "anon";
GRANT ALL ON TABLE "public"."tournament_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_results" TO "anon";
GRANT ALL ON TABLE "public"."tournament_results" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_results" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



GRANT ALL ON TABLE "public"."user_devices" TO "anon";
GRANT ALL ON TABLE "public"."user_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."user_devices" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































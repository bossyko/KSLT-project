-- ============================================
-- Раздел «Мои игры»: баттлы и фото соперника в вызовах
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- 1. Баттл — это тот же вызов, только опубликованный (battle_published).
--    Функция про это не сообщала, и в кабинете баттл выглядел обычным
--    вызовом: ни отметки, ни ссылки на страницу баттла.
--
-- 2. Фото соперника бралось только из profiles.avatar_url. У части игроков
--    оно пусто, а рабочее фото лежит в players.photo — карточка вызова
--    показывала сломанную картинку вместо лица.

-- ---- Куда я попал? ----------------------------------------------------
-- Выполнить первым делом. Боевая база — три сотни игроков и знакомые
-- фамилии. Тестовая — три строки с именами вида test-*. Файлы ниже
-- рассчитаны на боевую.
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;

CREATE OR REPLACE FUNCTION "public"."get_my_challenges"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      result json;
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
              COALESCE(cp.avatar_url, cpl.photo) AS challenger_avatar,
              c.opponent_player_id,
              op.full_name AS opponent_name,
              COALESCE(op.avatar_url, opl.photo) AS opponent_avatar,
              ct.name AS court_name,
              cct.name AS counter_court_name,
              COALESCE(m.score, c.score_draft) AS match_score,
              m.winner_id AS match_winner_id,
              c.battle_published,
              c.battle_title
          FROM challenges c
          LEFT JOIN profiles cp ON cp.id = c.challenger_id
          LEFT JOIN profiles op ON op.id = c.opponent_profile_id
          LEFT JOIN players cpl ON cpl.id = c.challenger_player_id
          LEFT JOIN players opl ON opl.id = c.opponent_player_id
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
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "service_role";

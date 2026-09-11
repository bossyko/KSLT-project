-- Update get_battle_public to include court map links
CREATE OR REPLACE FUNCTION get_battle_public(p_challenge_id UUID)
RETURNS JSON AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.counter_date, c.counter_time, c.counter_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.battle_published_at, c.banner_url,
               p1.name AS challenger_name, p1.name_en AS challenger_name_en, p1.name_kg AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses,
               p1.points AS challenger_points,
               p2.name AS opponent_name, p2.name_en AS opponent_name_en, p2.name_kg AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses,
               p2.points AS opponent_points,
               ct.google_maps_url AS court_google_maps,
               ct.twogis_url AS court_twogis
        FROM challenges c
        JOIN players p1 ON p1.id = c.challenger_player_id
        JOIN players p2 ON p2.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RPC: get player avatar from linked profile
-- Returns only avatar_url, no personal data exposed
-- SECURITY DEFINER bypasses RLS — works for anonymous users too

CREATE OR REPLACE FUNCTION get_player_avatar(p_player_id TEXT)
RETURNS TEXT AS $$
  SELECT avatar_url FROM profiles
  WHERE player_id = p_player_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

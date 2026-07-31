-- ============================================
-- App View Counter Migration
-- Adds view_count_app to all 6 entity tables,
-- recreates RPCs with p_source parameter,
-- adds site_visit/app_visit to page_views,
-- updates get_analytics_overview()
-- ============================================

-- 1. Add view_count_app column to all 6 tables
ALTER TABLE courts ADD COLUMN IF NOT EXISTS view_count_app INT DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS view_count_app INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS view_count_app INT DEFAULT 0;
ALTER TABLE news ADD COLUMN IF NOT EXISTS view_count_app INT DEFAULT 0;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS view_count_app INT DEFAULT 0;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS view_count_app INT DEFAULT 0;

-- 2. Recreate all 6 RPCs with p_source parameter

CREATE OR REPLACE FUNCTION increment_court_view(p_id TEXT, p_source TEXT DEFAULT 'site')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE courts SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE courts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_coach_view(p_id TEXT, p_source TEXT DEFAULT 'site')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE coaches SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE coaches SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_player_view(p_id TEXT, p_source TEXT DEFAULT 'site')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE players SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE players SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_news_view(p_news_id TEXT, p_source TEXT DEFAULT 'site')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE news SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_news_id;
  ELSE
    UPDATE news SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_news_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_tournament_view(p_tournament_id TEXT, p_source TEXT DEFAULT 'site')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE tournaments SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_tournament_id;
  ELSE
    UPDATE tournaments SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_tournament_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_sponsor_view(p_id UUID, p_source TEXT DEFAULT 'site')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_source = 'app' THEN
    UPDATE sponsors SET view_count_app = COALESCE(view_count_app, 0) + 1 WHERE id = p_id;
  ELSE
    UPDATE sponsors SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
  END IF;
END;
$$;

-- 3. Add site_visit / app_visit rows to page_views
INSERT INTO page_views (page_name, view_count)
VALUES ('site_visit', 0), ('app_visit', 0)
ON CONFLICT DO NOTHING;

-- 4. Update get_analytics_overview() to include _app views
DROP FUNCTION IF EXISTS get_analytics_overview();
CREATE OR REPLACE FUNCTION get_analytics_overview()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
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

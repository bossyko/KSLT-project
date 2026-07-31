    -- ============================================
    -- Analytics Overview RPC
    -- Run in Supabase SQL Editor
    -- ============================================

    -- Aggregated view counts across all 6 entity tables + page_views
    CREATE OR REPLACE FUNCTION get_analytics_overview()
    RETURNS TABLE(
        courts_views BIGINT,
        coaches_views BIGINT,
        players_views BIGINT,
        news_views BIGINT,
        tournaments_views BIGINT,
        sponsors_views BIGINT,
        pages_views BIGINT
    )
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
        SELECT
            (SELECT COALESCE(SUM(view_count), 0) FROM courts)::BIGINT AS courts_views,
            (SELECT COALESCE(SUM(view_count), 0) FROM coaches)::BIGINT AS coaches_views,
            (SELECT COALESCE(SUM(view_count), 0) FROM players)::BIGINT AS players_views,
            (SELECT COALESCE(SUM(view_count), 0) FROM news)::BIGINT AS news_views,
            (SELECT COALESCE(SUM(view_count), 0) FROM tournaments)::BIGINT AS tournaments_views,
            (SELECT COALESCE(SUM(view_count), 0) FROM sponsors)::BIGINT AS sponsors_views,
            (SELECT COALESCE(SUM(view_count), 0) FROM page_views)::BIGINT AS pages_views;
    $$;

    GRANT EXECUTE ON FUNCTION get_analytics_overview() TO authenticated;

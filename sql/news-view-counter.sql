-- ============================================
-- News View Counter + Stats RPCs
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add view_count column
ALTER TABLE news ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 2. RPC: increment view count (anonymous + authenticated)
CREATE OR REPLACE FUNCTION increment_news_view(p_news_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE news SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_news_id;
$$;

GRANT EXECUTE ON FUNCTION increment_news_view(TEXT) TO anon, authenticated;

-- 3. RPC: get news stats (published count + last date, draft count + last date)
CREATE OR REPLACE FUNCTION get_news_stats()
RETURNS TABLE(published_count BIGINT, last_published TIMESTAMPTZ, draft_count BIGINT, last_draft TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        COUNT(*) FILTER (WHERE published_at IS NOT NULL) AS published_count,
        MAX(published_at) FILTER (WHERE published_at IS NOT NULL) AS last_published,
        COUNT(*) FILTER (WHERE published_at IS NULL) AS draft_count,
        MAX(created_at) FILTER (WHERE published_at IS NULL) AS last_draft
    FROM news;
$$;

GRANT EXECUTE ON FUNCTION get_news_stats() TO authenticated;

-- 4. RPC: get top news by engagement score (views + reactions + poll votes)
CREATE OR REPLACE FUNCTION get_top_news(p_limit INT DEFAULT 3)
RETURNS TABLE(news_id TEXT, title TEXT, score BIGINT)
LANGUAGE sql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION get_top_news(INT) TO authenticated;

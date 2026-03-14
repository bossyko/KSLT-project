-- ============================================
-- Tournament & Page View Counters
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add view_count column to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 2. RPC: increment tournament view count
CREATE OR REPLACE FUNCTION increment_tournament_view(p_tournament_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE tournaments SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_tournament_id;
$$;

GRANT EXECUTE ON FUNCTION increment_tournament_view(TEXT) TO anon, authenticated;

-- 3. Page views table (for category pages, overview, etc.)
CREATE TABLE IF NOT EXISTS page_views (
    page_name TEXT PRIMARY KEY,
    view_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-populate category pages
INSERT INTO page_views (page_name, view_count) VALUES
    ('tournaments-overview', 0),
    ('tournaments-promasters', 0),
    ('tournaments-masters', 0),
    ('tournaments-challenger', 0),
    ('tournaments-futures', 0),
    ('tournaments-tour', 0),
    ('tournaments-friendly', 0)
ON CONFLICT (page_name) DO NOTHING;

-- 4. RPC: increment page view
CREATE OR REPLACE FUNCTION increment_page_view(p_page_name TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
    INSERT INTO page_views (page_name, view_count, updated_at)
    VALUES (p_page_name, 1, now())
    ON CONFLICT (page_name) DO UPDATE
    SET view_count = page_views.view_count + 1, updated_at = now();
$$;

GRANT EXECUTE ON FUNCTION increment_page_view(TEXT) TO anon, authenticated;

-- 5. RPC: get page view stats (for admin)
CREATE OR REPLACE FUNCTION get_page_view_stats()
RETURNS TABLE(page_name TEXT, view_count INT, updated_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT page_name, view_count, updated_at
    FROM page_views
    ORDER BY view_count DESC;
$$;

GRANT EXECUTE ON FUNCTION get_page_view_stats() TO authenticated;

-- 6. RPC: get tournament stats (for admin dashboard)
CREATE OR REPLACE FUNCTION get_tournament_stats()
RETURNS TABLE(
    total_count BIGINT,
    active_count BIGINT,
    completed_count BIGINT,
    total_views BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        COUNT(*)::BIGINT AS total_count,
        COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') OR status IS NULL)::BIGINT AS active_count,
        COUNT(*) FILTER (WHERE status IN ('completed','cancelled'))::BIGINT AS completed_count,
        COALESCE(SUM(view_count), 0)::BIGINT AS total_views
    FROM tournaments
    WHERE published_at IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION get_tournament_stats() TO authenticated;

-- 7. RLS for page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read page_views" ON page_views
    FOR SELECT USING (true);

CREATE POLICY "Staff can manage page_views" ON page_views
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
    );

-- ============================================
-- NEWS REACTIONS & POLL VOTES — Supabase migration
-- Run in Supabase SQL Editor
-- news.id is TEXT, not UUID
-- ============================================

-- 1. Reactions table
CREATE TABLE IF NOT EXISTS news_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id TEXT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('tennis', 'fire', 'clap')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(news_id, user_id, reaction_type)
);

-- 2. Poll votes table
CREATE TABLE IF NOT EXISTS news_poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id TEXT NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(news_id, user_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_news_reactions_news_id ON news_reactions(news_id);
CREATE INDEX IF NOT EXISTS idx_news_reactions_user_id ON news_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_news_poll_votes_news_id ON news_poll_votes(news_id);
CREATE INDEX IF NOT EXISTS idx_news_poll_votes_user_id ON news_poll_votes(user_id);

-- 4. RLS — news_reactions
ALTER TABLE news_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions"
    ON news_reactions FOR SELECT
    USING (true);

CREATE POLICY "Auth users insert reactions"
    ON news_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions"
    ON news_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- 5. RLS — news_poll_votes
ALTER TABLE news_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes"
    ON news_poll_votes FOR SELECT
    USING (true);

CREATE POLICY "Auth users insert vote"
    ON news_poll_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. RPC: get_reaction_counts(p_news_id TEXT)
-- Returns {tennis, fire, clap} counts for a single article
CREATE OR REPLACE FUNCTION get_reaction_counts(p_news_id TEXT)
RETURNS TABLE(tennis BIGINT, fire BIGINT, clap BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT
        COALESCE(SUM(CASE WHEN reaction_type = 'tennis' THEN 1 ELSE 0 END), 0) AS tennis,
        COALESCE(SUM(CASE WHEN reaction_type = 'fire' THEN 1 ELSE 0 END), 0) AS fire,
        COALESCE(SUM(CASE WHEN reaction_type = 'clap' THEN 1 ELSE 0 END), 0) AS clap
    FROM news_reactions
    WHERE news_id = p_news_id;
$$;

-- 7. RPC: get_user_reactions(p_news_id TEXT, p_user_id UUID)
-- Returns array of reaction_type strings the user has on this article
CREATE OR REPLACE FUNCTION get_user_reactions(p_news_id TEXT, p_user_id UUID)
RETURNS TABLE(reaction_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT reaction_type
    FROM news_reactions
    WHERE news_id = p_news_id AND user_id = p_user_id;
$$;

-- 8. RPC: get_poll_results(p_news_id TEXT)
-- Returns [{option_index, count}] for a single article poll
CREATE OR REPLACE FUNCTION get_poll_results(p_news_id TEXT)
RETURNS TABLE(option_index INT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT option_index, COUNT(*) AS count
    FROM news_poll_votes
    WHERE news_id = p_news_id
    GROUP BY option_index;
$$;

-- 9. RPC: get_news_engagement(p_news_ids TEXT[])
-- Returns total reactions + total votes per article (for admin list)
CREATE OR REPLACE FUNCTION get_news_engagement(p_news_ids TEXT[])
RETURNS TABLE(news_id TEXT, total_reactions BIGINT, total_votes BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT
        n.id AS news_id,
        (SELECT COUNT(*) FROM news_reactions r WHERE r.news_id = n.id) AS total_reactions,
        (SELECT COUNT(*) FROM news_poll_votes v WHERE v.news_id = n.id) AS total_votes
    FROM unnest(p_news_ids) AS n(id);
$$;

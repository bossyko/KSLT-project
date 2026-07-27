-- ============================================
-- News Reactions Config Migration
-- Adds optional reactions configuration per article
-- + Dynamic get_reaction_counts RPC
-- ============================================

-- reactions_config JSONB column:
--   NULL                     → show default reactions (backward compat)
--   []                       → reactions disabled
--   ["tennis","fire"]        → only selected types shown
--   ["tennis","fire","star"] → any combination of available types

ALTER TABLE news ADD COLUMN IF NOT EXISTS reactions_config JSONB DEFAULT NULL;

-- Drop old CHECK constraint that only allowed tennis/fire/clap
-- and replace with expanded list of reaction types
ALTER TABLE news_reactions DROP CONSTRAINT IF EXISTS news_reactions_reaction_type_check;
ALTER TABLE news_reactions ADD CONSTRAINT news_reactions_reaction_type_check
    CHECK (reaction_type IN ('tennis', 'fire', 'clap', 'star', 'heart', 'like', 'trophy', 'muscle', 'target', 'wow'));

-- Replace old hardcoded RPC with dynamic GROUP BY version
-- Old: RETURNS TABLE(tennis BIGINT, fire BIGINT, clap BIGINT)
-- New: RETURNS TABLE(reaction_type TEXT, count BIGINT)
DROP FUNCTION IF EXISTS get_reaction_counts(TEXT);
CREATE OR REPLACE FUNCTION get_reaction_counts(p_news_id TEXT)
RETURNS TABLE(reaction_type TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT reaction_type, COUNT(*)::BIGINT AS count
    FROM news_reactions
    WHERE news_id = p_news_id
    GROUP BY reaction_type;
$$;

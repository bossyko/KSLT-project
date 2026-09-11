-- ============================================
-- News ↔ Tournament link
-- Adds tournament_id FK to news table
-- + results_notified_at for TG deduplication
-- ============================================

ALTER TABLE news ADD COLUMN IF NOT EXISTS tournament_id TEXT REFERENCES tournaments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_news_tournament_id ON news(tournament_id);

ALTER TABLE news ADD COLUMN IF NOT EXISTS results_notified_at TIMESTAMPTZ;

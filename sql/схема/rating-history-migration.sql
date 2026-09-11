-- ============================================
-- Rating History — migration
-- ============================================

CREATE TABLE rating_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE SET NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  recorded_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rating_history_player ON rating_history(player_id);
CREATE INDEX idx_rating_history_date ON rating_history(recorded_at);

-- RLS
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON rating_history FOR SELECT USING (true);

CREATE POLICY "Staff insert" ON rating_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

CREATE POLICY "Staff update" ON rating_history FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

CREATE POLICY "Staff delete" ON rating_history FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager')));

-- ============================================
-- FIX: Типы TEXT вместо UUID для FK на существующие таблицы
-- Выполнить ПОСЛЕ первой миграции (levels + rules уже созданы)
-- ============================================

-- 4. Результаты турниров (TEXT FK для tournaments, players, categories)
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  round_reached TEXT NOT NULL,
  points_earned INT DEFAULT 0,
  season INT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  is_transition BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- 5. Промоушен игроков (TEXT FK для players, categories)
CREATE TABLE IF NOT EXISTS player_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  from_category_id TEXT REFERENCES categories(id),
  to_category_id TEXT REFERENCES categories(id),
  season INT NOT NULL,
  status TEXT DEFAULT 'eligible',
  eligible_date TIMESTAMPTZ DEFAULT now(),
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_results_read" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "player_promotions_read" ON player_promotions FOR SELECT USING (true);
CREATE POLICY "tournament_results_write" ON tournament_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "player_promotions_write" ON player_promotions FOR ALL USING (true) WITH CHECK (true);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_tournament_results_player ON tournament_results(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_season ON tournament_results(season);
CREATE INDEX IF NOT EXISTS idx_tournament_results_category ON tournament_results(category_id);
CREATE INDEX IF NOT EXISTS idx_player_promotions_player ON player_promotions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_promotions_season ON player_promotions(season);

-- ============================================
-- KSLT — Player Ban Migration
-- Adds ban fields to players table + manager UPDATE RLS
-- ============================================

-- 1. Add ban columns to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL;

-- 2. Allow manager to UPDATE players (for ban/unban)
-- Drop existing policy if any, then create new one
DROP POLICY IF EXISTS "managers_update_players" ON players;
CREATE POLICY "managers_update_players"
  ON players FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

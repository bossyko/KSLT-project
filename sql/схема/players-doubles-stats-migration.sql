-- Add doubles stats columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS doubles_wins integer DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS doubles_losses integer DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS doubles_rank_change integer DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS doubles_form jsonb DEFAULT '[]'::jsonb;

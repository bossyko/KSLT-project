-- Add manual_group_places JSONB column to tournaments
-- Format: { "1": { "player_id_a": 1, "player_id_b": 2 }, "2": { ... } }
-- Key = group_number, value = { player_id: manual_place }
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS manual_group_places JSONB DEFAULT '{}';

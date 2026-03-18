-- Notify preferences: opt-out per category per channel
-- Default NULL = all notifications enabled
-- Structure: { "tg": { "membership": true, "tournaments": true, "matches": true, "challenges": true }, "email": { ... } }

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_preferences JSONB;

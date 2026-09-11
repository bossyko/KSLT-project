-- Unique constraints for profiles: prevent duplicate telegram/phone
-- NULL values do NOT conflict in PostgreSQL (multiple NULLs allowed)

-- Before adding constraints, clean up any existing duplicates:

-- 1. Clear duplicate telegram_chat_id (keep the most recently updated)
WITH dupes AS (
  SELECT id, telegram_chat_id,
    ROW_NUMBER() OVER (PARTITION BY telegram_chat_id ORDER BY updated_at DESC NULLS LAST, created_at DESC) AS rn
  FROM profiles
  WHERE telegram_chat_id IS NOT NULL
)
UPDATE profiles SET telegram_chat_id = NULL
WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- 2. Clear duplicate phone (keep the most recently updated)
WITH dupes AS (
  SELECT id, phone,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY updated_at DESC NULLS LAST, created_at DESC) AS rn
  FROM profiles
  WHERE phone IS NOT NULL
)
UPDATE profiles SET phone = NULL
WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- 3. Add UNIQUE constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_telegram_chat_id_unique UNIQUE (telegram_chat_id);
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

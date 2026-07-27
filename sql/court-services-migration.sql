-- Court Additional Services migration
-- Adds jsonb column for additional services (pool, sauna, etc.) with prices

ALTER TABLE courts ADD COLUMN IF NOT EXISTS additional_services jsonb DEFAULT '[]'::jsonb;

-- Element format:
-- { "name": "Бассейн", "name_en": "Pool", "name_kg": "Бассейн", "price": 500, "partner": true }

-- ============================================
-- Categories Gender Cleanup Migration
-- Remove gender from categories, use separate gender fields
-- ============================================

-- 1. Add gender column to players table (to store player gender independently)
ALTER TABLE players ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Populate player gender from current category_id prefix
UPDATE players SET gender = 'men' WHERE category_id LIKE 'men-%' AND (gender IS NULL OR gender = '');
UPDATE players SET gender = 'women' WHERE category_id LIKE 'women-%' AND (gender IS NULL OR gender = '');

-- 2. Alter categories: allow NULL gender
ALTER TABLE categories ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_gender_check;
ALTER TABLE categories ADD CONSTRAINT categories_gender_check CHECK (gender IS NULL OR gender IN ('men', 'women'));

-- 3. Insert new gender-neutral categories
INSERT INTO categories (id, name, name_en, name_kg, gender, sort_order) VALUES
    ('tour', 'Tour', 'Tour', 'Tour', NULL, 1),
    ('futures', 'Futures', 'Futures', 'Futures', NULL, 2),
    ('challenger', 'Challenger', 'Challenger', 'Challenger', NULL, 3),
    ('masters', 'Masters', 'Masters', 'Masters', NULL, 4),
    ('promasters', 'Pro-Masters', 'Pro-Masters', 'Pro-Masters', NULL, 5),
    ('friendly', 'Friendly', 'Friendly', 'Friendly', NULL, 6)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    name_kg = EXCLUDED.name_kg,
    gender = EXCLUDED.gender,
    sort_order = EXCLUDED.sort_order;

-- 4. Migrate players: men-tour → tour, women-masters → masters, etc.
UPDATE players SET category_id = 'tour' WHERE category_id IN ('men-tour', 'women-tour');
UPDATE players SET category_id = 'futures' WHERE category_id IN ('men-futures', 'women-futures');
UPDATE players SET category_id = 'challenger' WHERE category_id IN ('men-challenger', 'women-challenger');
UPDATE players SET category_id = 'masters' WHERE category_id IN ('men-masters', 'women-masters');
UPDATE players SET category_id = 'promasters' WHERE category_id IN ('men-promasters', 'women-promasters');
UPDATE players SET category_id = 'friendly' WHERE category_id IN ('men-friendly', 'women-friendly');

-- 5. Migrate tournaments: transfer gender from category_id to gender field, then simplify category_id
UPDATE tournaments SET gender = 'men' WHERE category_id LIKE 'men-%' AND (gender IS NULL OR gender = '');
UPDATE tournaments SET gender = 'women' WHERE category_id LIKE 'women-%' AND (gender IS NULL OR gender = '');
UPDATE tournaments SET category_id = 'tour' WHERE category_id IN ('men-tour', 'women-tour');
UPDATE tournaments SET category_id = 'futures' WHERE category_id IN ('men-futures', 'women-futures');
UPDATE tournaments SET category_id = 'challenger' WHERE category_id IN ('men-challenger', 'women-challenger');
UPDATE tournaments SET category_id = 'masters' WHERE category_id IN ('men-masters', 'women-masters');
UPDATE tournaments SET category_id = 'promasters' WHERE category_id IN ('men-promasters', 'women-promasters');
UPDATE tournaments SET category_id = 'friendly' WHERE category_id IN ('men-friendly', 'women-friendly');

-- 6. Migrate tournament_results
UPDATE tournament_results SET category_id = 'tour' WHERE category_id IN ('men-tour', 'women-tour');
UPDATE tournament_results SET category_id = 'futures' WHERE category_id IN ('men-futures', 'women-futures');
UPDATE tournament_results SET category_id = 'challenger' WHERE category_id IN ('men-challenger', 'women-challenger');
UPDATE tournament_results SET category_id = 'masters' WHERE category_id IN ('men-masters', 'women-masters');
UPDATE tournament_results SET category_id = 'promasters' WHERE category_id IN ('men-promasters', 'women-promasters');
UPDATE tournament_results SET category_id = 'friendly' WHERE category_id IN ('men-friendly', 'women-friendly');

-- 7. Delete old gender-prefixed categories
DELETE FROM categories WHERE id LIKE 'men-%' OR id LIKE 'women-%';

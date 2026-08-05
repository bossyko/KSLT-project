-- ============================================
-- KSLT — цвет категории (#20 / история рейтинга)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Цвет нужен графику «История рейтинга»: линия на категорию своим цветом.
-- Держим его в базе, а не в коде, чтобы он был один и тот же везде —
-- в графике, в блоках очков по категориям и там, где понадобится дальше.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;

-- От сильных к слабым. Лайм у Pro-Masters — он же главный акцент сайта.
UPDATE categories SET color = '#CCFF00' WHERE id = 'promasters' AND color IS NULL;
UPDATE categories SET color = '#B76BFF' WHERE id = 'masters'    AND color IS NULL;
UPDATE categories SET color = '#00BFFF' WHERE id = 'tour'       AND color IS NULL;
UPDATE categories SET color = '#FF9F40' WHERE id = 'challenger' AND color IS NULL;
UPDATE categories SET color = '#8A8A8F' WHERE id = 'futures'    AND color IS NULL;
UPDATE categories SET color = '#5A5A60' WHERE id = 'friendly'   AND color IS NULL;

-- Категории, заведённые позже и без цвета, получают серый —
-- график не должен падать из-за пустого поля
UPDATE categories SET color = '#8A8A8F' WHERE color IS NULL;

SELECT id, name, sort_order, color FROM categories ORDER BY sort_order DESC;

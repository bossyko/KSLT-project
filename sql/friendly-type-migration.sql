-- ============================================
-- KSLT — иерархия категорий
-- Статус: ПРИМЕНЕНО в Supabase 4 августа 2026
-- ============================================
--
-- Иерархия от низшей к высшей:
--   Futures < Challenger < Tour < Masters < Pro-Masters
--
-- Friendly остаётся обычной категорией (sort_order 6), но:
--   - НЕ участвует в сравнении "выше/ниже" при допуске на турнир
--   - НЕ начисляет рейтинговые очки
--   - допуск в ней только по NTRP: ntrp_max (одиночка),
--     ntrp_combined_max (пары и микст)

UPDATE categories SET sort_order = 1 WHERE id = 'futures';
UPDATE categories SET sort_order = 2 WHERE id = 'challenger';
UPDATE categories SET sort_order = 3 WHERE id = 'tour';
UPDATE categories SET sort_order = 4 WHERE id = 'masters';
UPDATE categories SET sort_order = 5 WHERE id = 'promasters';
UPDATE categories SET sort_order = 6 WHERE id = 'friendly';

-- Разовая чистка: дружеский турнир «Какашки атакуют» начислил 172 очка
-- по таблице «Категория 2». Friendly очков давать не должен — обнулено.
UPDATE tournament_results r
SET points_earned = 0
FROM tournaments t
WHERE t.id = r.tournament_id AND t.category_id = 'friendly' AND r.points_earned <> 0;

-- Проверка
SELECT sort_order, id, name FROM categories ORDER BY sort_order;

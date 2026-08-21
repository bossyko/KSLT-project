-- ============================================
-- У женщин три категории: Masters, Tour, Futures
-- ============================================
--
-- Так у клуба и так написано в FAQ. В базе же женщины разложены по всем
-- пяти мужским категориям: 59 в Pro-Masters, 15 в Challengers. На сайте
-- эти две больше не показываются, и данные надо привести в порядок —
-- иначе игрок числится в категории, которой нет.
--
-- Переводим в категорию выше:
--   Pro-Masters → Masters   (верхняя из женских)
--   Challengers → Tour      (Challengers стоит между Tour и Futures)
--
-- Очки не трогаем: они начислены за сыгранные турниры и от смены
-- категории не меняются.

-- 1. Как было
SELECT 'до' AS когда, category_id AS категория, COUNT(*) AS игроков
FROM players
WHERE gender = 'women'
GROUP BY category_id;

-- 2. Перевод
UPDATE players SET category_id = 'masters'
 WHERE gender = 'women' AND category_id = 'promasters';

UPDATE players SET category_id = 'tour'
 WHERE gender = 'women' AND category_id = 'challenger';

-- Раскладка очков по категориям хранится отдельно — переносим и её,
-- иначе очки останутся висеть в категории, которой у женщин нет
UPDATE player_categories pc SET category_id = 'masters'
 WHERE pc.category_id = 'promasters'
   AND EXISTS (SELECT 1 FROM players p WHERE p.id = pc.player_id AND p.gender = 'women');

UPDATE player_categories pc SET category_id = 'tour'
 WHERE pc.category_id = 'challenger'
   AND EXISTS (SELECT 1 FROM players p WHERE p.id = pc.player_id AND p.gender = 'women');

-- 3. Как стало: должны остаться только masters, tour и futures
SELECT 'после' AS когда, category_id AS категория, COUNT(*) AS игроков
FROM players
WHERE gender = 'women'
GROUP BY category_id;

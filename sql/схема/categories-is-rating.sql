-- Рейтинговая категория — явным полем, а не догадкой по названию
-- ==============================================================
--
-- Сайт и приложение выкидывали дружеские турниры из рейтинга так: искали
-- слово «friendly» в названии категории (js/rankings-data.js,
-- mobile/www/js/screens/rating.js). Переименуй категорию или переведи её на
-- киргизский — и дружеские полезут в рейтинговые таблицы.
--
-- Теперь это отдельное поле. Оно же закрывает просьбу клиента про парные
-- турниры: снял галочку — категория перестала быть рейтинговой, и на карточке
-- турнира появилась метка «Без рейтинга».

BEGIN;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_rating boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN categories.is_rating IS
  'Идут ли турниры этой категории в рейтинг. false — карточка получает метку «Без рейтинга», а сама категория не показывается в таблицах рейтинга.';

UPDATE categories SET is_rating = false WHERE id = 'friendly';

SELECT sort_order, id, name, is_rating FROM categories ORDER BY sort_order DESC;

COMMIT;

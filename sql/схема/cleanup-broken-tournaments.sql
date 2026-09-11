-- ============================================
-- Чистка турниров с незаполненными полями
-- Запускать в Supabase SQL Editor по шагам, не целиком.
-- ============================================
--
-- Категория, пол и число участников теперь обязательны в админке, но старые
-- записи это не лечит. Пока они лежат в базе, дыра для них открыта:
-- турнир без категории не виден на страницах категорий и не проверяется
-- правилами допуска — записаться может кто угодно из любой категории.

-- ---- ШАГ 1. Что именно поедет ----
SELECT t.id, t.title, t.category_id, t.gender, t.date_start, t.max_participants, t.status,
       (SELECT count(*) FROM tournament_registrations r WHERE r.tournament_id = t.id) AS заявок,
       (SELECT count(*) FROM matches m WHERE m.tournament_id = t.id) AS матчей,
       (SELECT count(*) FROM rating_history h WHERE h.tournament_id = t.id) AS очков
FROM tournaments t
WHERE t.category_id IS NULL OR t.gender IS NULL
   OR t.date_start IS NULL OR t.max_participants IS NULL
ORDER BY t.title;

-- Ожидаются две строки:
--   «Тест - группа на 21 пару»  — пусто всё, заявок нет, матчей нет
--   «Summer Breeze Cup 2026»    — нет только пола, но 28 заявок
--
-- Вторую удалять не надо: 28 заявок — это живые люди в сетке. Ей достаточно
-- проставить пол. Мужской или женский — смотри по составу участников.

-- ---- ШАГ 2. Проставить пол Summer Breeze Cup ----
-- Подставь нужное значение, 'men' или 'women', и выполни:
-- UPDATE tournaments SET gender = 'men'
-- WHERE id = 'fbf4dc26-d6dc-43b1-9627-c8bfeb41db4a';

-- ---- ШАГ 3. Удалить пустой тестовый турнир ----
-- Ни заявок, ни матчей, ни очков — удаляется без последствий.
DELETE FROM tournaments WHERE id = 'd12b9028-1465-46ea-859d-51991d0b9053';

-- ---- ШАГ 4. Убедиться, что незаполненных не осталось ----
SELECT count(*) AS осталось_проблемных
FROM tournaments
WHERE category_id IS NULL OR gender IS NULL
   OR date_start IS NULL OR max_participants IS NULL;

-- ---- ШАГ 5. Запретить пустые поля на уровне базы ----
-- Выполнять, только когда ШАГ 4 показал ноль. Иначе миграция упадёт.
-- После этого правило нельзя будет обойти ни через админку, ни через API.
--
ALTER TABLE tournaments ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE tournaments ALTER COLUMN gender SET NOT NULL;
ALTER TABLE tournaments ALTER COLUMN date_start SET NOT NULL;
ALTER TABLE tournaments ALTER COLUMN max_participants SET NOT NULL;

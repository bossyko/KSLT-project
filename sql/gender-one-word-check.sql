-- ============================================================
-- Проверка единого словаря пола — только чтение
-- ============================================================
--
-- Запускать до и после gender-one-word.sql. Ничего не меняет.

-- 1. Какими словами записан пол в каждой таблице.
--    До правки у профилей будет male/female, после — men/women.
SELECT 'profiles' AS таблица, COALESCE(gender, '(пусто)') AS пол, count(*) AS сколько
  FROM profiles GROUP BY gender
UNION ALL
SELECT 'players', COALESCE(gender, '(пусто)'), count(*)
  FROM players GROUP BY gender
UNION ALL
SELECT 'categories', COALESCE(gender, '(пусто)'), count(*)
  FROM categories GROUP BY gender
 ORDER BY таблица, пол;

-- 2. Не осталось ли старого слова где-нибудь ещё.
--    После правки должно вернуть ноль строк.
SELECT id, full_name, gender
  FROM profiles
 WHERE gender IN ('male', 'female');

-- 3. Что отдаёт поиск партнёра.
--    Ждём men/women, а не male/female. И ни одного пустого у тех,
--    у кого пол проставлен в карточке.
SELECT gender AS пол, count(*) AS сколько
  FROM public.get_public_partners()
 GROUP BY gender
 ORDER BY gender;

-- 4. Поимённо — сверить с карточками
SELECT p.id, p.full_name AS имя, p.gender AS пол_из_поиска
  FROM public.get_public_partners() p
 ORDER BY p.full_name;

-- 5. Стоит ли запрет на старое слово.
--    Ждём одну строку с проверкой на men/women.
SELECT conname AS проверка, pg_get_constraintdef(oid) AS условие
  FROM pg_constraint
 WHERE conrelid = 'public.profiles'::regclass
   AND conname = 'profiles_gender_check';

-- ============================================================
-- Пол в профилях: проверка
-- ============================================================
-- Только читает. Правку делает gender-accept-old-words.sql.

-- ---- 1. Какой запрет стоит ----

SELECT conname, pg_get_constraintdef(oid) AS правило
  FROM pg_constraint
 WHERE conrelid = 'profiles'::regclass AND conname LIKE '%gender%';

-- ---- 2. Стоит ли перевод старых слов ----
-- Строк нет — значит старые сборки по-прежнему не могут сохранить профиль.

SELECT tgname AS перевод_включён
  FROM pg_trigger
 WHERE tgrelid = 'profiles'::regclass AND tgname = 'trg_перевести_пол';

-- ---- 3. Что сейчас лежит в профилях ----

SELECT gender, count(*) FROM profiles GROUP BY gender ORDER BY count(*) DESC;

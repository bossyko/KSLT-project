-- ============================================================
-- Очистить год рождения-заглушку
-- ============================================================
--
-- Перед запуском посмотреть god-rozhdeniya-1900.sql: он показывает, у кого
-- стоит такой год и нет ли рядом других заглушек.
--
-- Правило: год раньше 1930 в клубе невозможен, значит это не дата, а след
-- переноса. День и месяц не трогаем — они могут быть настоящими.
--
-- Запускать файл целиком. Повторный запуск ничего не сломает.

BEGIN;

UPDATE public.profiles
   SET birth_year = NULL
 WHERE birth_year IS NOT NULL
   AND birth_year < 1930;

COMMIT;

-- ---- Проверка ----

SELECT count(*) AS осталось_заглушек
  FROM public.profiles
 WHERE birth_year IS NOT NULL AND birth_year < 1930;
-- Ожидаем 0.

SELECT full_name, birth_day, birth_month, birth_year
  FROM public.profiles
 WHERE email = 'bossyko@gmail.com';
-- Ожидаем: день и месяц на месте, год пустой.

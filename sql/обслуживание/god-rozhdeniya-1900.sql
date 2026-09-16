-- ============================================================
-- Год рождения 1900 — заглушка, а не дата
-- ============================================================
--
-- В профиле Costa стоял birth_year = 1900. Это не чья-то дата рождения,
-- а значение, оставшееся от переноса: живых людей 1900 года в клубе нет.
--
-- Пустой год честнее выдуманного: поле в кабинете необязательное, и
-- незаполненное оно выглядит как незаполненное, а не как ошибка.
--
-- Файл только читает. Правку запускать отдельным файлом, ниже.

-- Сколько таких записей и чьи они:
SELECT id, full_name, email, birth_day, birth_month, birth_year
  FROM public.profiles
 WHERE birth_year IS NOT NULL
   AND birth_year < 1930
 ORDER BY birth_year, full_name;

-- Сводка по годам — не окажется ли рядом других заглушек (1901, 1970-01-01
-- и подобных):
SELECT birth_year, count(*) AS сколько
  FROM public.profiles
 WHERE birth_year IS NOT NULL
 GROUP BY birth_year
 ORDER BY birth_year
 LIMIT 20;

-- Где вообще в базе хранится год рождения — кроме profiles. Проверяем по
-- схеме, а не по памяти: в players такой колонки нет
SELECT table_name, column_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND column_name IN ('birth_year', 'birth_date', 'birthday')
 ORDER BY table_name;

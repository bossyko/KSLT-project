-- ============================================================
-- ПОЧЕМУ ХРАНИЛИЩЕ ОТКАЗЫВАЕТ: «new row violates row-level security policy»
-- 14.10.2026. ТОЛЬКО ЧТЕНИЕ — ни одной строки не меняется.
-- ============================================================
--
-- ЧТО ИЗВЕСТНО ТОЧНО, БЕЗ ДОГАДОК:
--   · отказ рождается в js/admin/core/utils.js:984 — загрузка в бакет
--     `news` через A.client.storage.from('news').upload(...);
--   · правило на вставку описано в sql/доступ/storage-policies-cleanup.sql
--     (строки 52–61): в `news` пускает вошедшего, у которого в `profiles`
--     роль admin или manager;
--   · раньше это работало: в бакете лежат 18 обложек, последняя загружена
--     09.10.2026 в 00:11 UTC (имя файла — метка времени);
--   · файлы правил в репозитории с августа не менялись.
--
-- Значит разошлось что-то в самой базе. Четыре запроса ниже различают
-- четыре причины. Прогнать в SQL-редакторе Supabase ОТ СВОЕГО ИМЕНИ
-- (через «Run as» = authenticated, если редактор это умеет; иначе первые
-- три запроса всё равно ответят).

-- 1. КАКИЕ ПРАВИЛА СЕЙЧАС ЖИВУТ НА ХРАНИЛИЩЕ
--    Ждём одно правило на вставку. Ноль — правило не прогнано или снесено.
--    Несколько — проверить, нет ли среди них запрещающего.
SELECT cmd AS операция, policyname AS правило, roles AS роли,
       qual AS условие_чтения, with_check AS условие_записи
  FROM pg_policies
 WHERE schemaname = 'storage' AND tablename = 'objects'
 ORDER BY cmd, policyname;

-- 2. ЕСТЬ ЛИ БАКЕТ И КАКОЙ ОН
--    Ждём строку `news`. Если `public` = false, чтение обложек на сайте
--    шло бы через подписанные ссылки — проверить заодно.
SELECT id, name, public, file_size_limit, allowed_mime_types
  FROM storage.buckets
 WHERE id IN ('news', 'avatars');

-- 3. ЧТО БАЗА ДУМАЕТ О МОЕЙ РОЛИ
--    Бейдж «АДМИНИСТРАТОР» в кабинете рисуется из profiles.role
--    (js/admin/core/layout.js:24), и auth-guard.js:130 пускает в админку
--    только при role = 'admin'. Если здесь другое — расходятся экран и база.
SELECT id, email, role
  FROM profiles
 WHERE email = 'bossyko.co@gmail.com';

-- 4. ВИДИТ ЛИ ПРАВИЛО ХРАНИЛИЩА МОЮ СТРОКУ В `profiles`
--    Правило вставки читает profiles ВНУТРИ себя, а на profiles стоит свой
--    RLS. Если он перестал пускать роль authenticated к собственной строке,
--    подзапрос вернёт ноль — и хранилище откажет, хотя роль admin на месте.
--    Этот запрос показывает правила самой таблицы profiles.
SELECT cmd AS операция, policyname AS правило, roles AS роли,
       qual AS условие_чтения
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'profiles'
 ORDER BY cmd, policyname;

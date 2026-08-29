-- ============================================================
-- Проверка счётчиков клуба — только чтение
-- ============================================================
-- Запускать после public-club-stats.sql.

-- 1. Что отдаёт функция
SELECT * FROM public.get_club_stats();

-- 2. То же самое напрямую — числа обязаны совпасть
SELECT
    (SELECT count(*) FROM memberships
      WHERE status = 'active' AND expires_at >= CURRENT_DATE) AS члены,
    (SELECT count(*) FROM profiles)                            AS учётные_записи,
    (SELECT count(*) FROM tournaments
      WHERE status = 'completed' AND date_start >= DATE '2025-01-01') AS турниры_с_2025,
    (SELECT count(*) FROM courts)                              AS центры,
    (SELECT count(*) FROM coaches)                             AS тренеры;

-- 3. Кому разрешено вызывать. Ожидаем anon и authenticated
SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_name = 'get_club_stats';

-- 4. Есть ли тренеры вообще. Если строки тут есть, а на сайте раздел
--    пустой — значит их прячут правила доступа, а не отсутствие данных
SELECT count(*) AS всего_тренеров FROM coaches;

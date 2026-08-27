-- ============================================
-- Членства: по одному на человека
-- ============================================
--
-- Записей 29 на семь учётных записей: у одной девятнадцать, у другой три.
-- Так выходит, когда проверяют продление — каждая попытка заводит новое
-- членство, а прежнее остаётся.
--
-- Оставляем у каждого самое позднее по сроку: оно и есть действующее.
-- Записи двух тестовых учётных записей убираем целиком — игроков, к
-- которым они относились, в базе уже нет.

BEGIN;

-- 1. Что было
SELECT 'до' AS когда, COUNT(*) AS членств,
       COUNT(DISTINCT profile_id) AS у_скольких_людей
FROM memberships;

-- 2. Тестовые учётные записи
DELETE FROM memberships m
 USING profiles p
 WHERE p.id = m.profile_id
   AND p.email LIKE '%.test@kslt.kg';

-- 3. У каждого остаётся одно — с самым поздним сроком.
--    При равных сроках берём то, что завели позже
DELETE FROM memberships m
 WHERE m.id NOT IN (
     SELECT DISTINCT ON (profile_id) id
       FROM memberships
      ORDER BY profile_id, expires_at DESC NULLS LAST, created_at DESC
 );

-- 4. Что осталось
SELECT p.email AS учётная_запись,
       m.status,
       m.expires_at AS действует_до,
       CASE WHEN m.expires_at < CURRENT_DATE THEN 'срок вышел' ELSE 'действует' END AS состояние
FROM memberships m
LEFT JOIN profiles p ON p.id = m.profile_id
ORDER BY m.expires_at DESC NULLS LAST;

COMMIT;

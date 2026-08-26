-- ============================================
-- Чистка финансовых записей
-- ============================================
--
-- Платежи, скидки и начисления баллов остались от проверок работы
-- разделов: настоящих денег через сайт не проходило, платёжного шлюза
-- пока нет.
--
-- Членства разбираем отдельно и осторожно: от них зависит доступ к
-- скидкам и закрытым разделам. Удаляем только осиротевшие — те, что
-- привязаны к игрокам и учётным записям, которых уже нет.

BEGIN;

-- 1. Что было
SELECT 'до' AS когда,
       (SELECT COUNT(*) FROM entity_payments)      AS платежи_партнёров,
       (SELECT COUNT(*) FROM payments)             AS платежи,
       (SELECT COUNT(*) FROM discount_vouchers)    AS скидки,
       (SELECT COUNT(*) FROM loyalty_transactions) AS баллы,
       (SELECT COUNT(*) FROM memberships)          AS членства;

-- 2. Платежи, скидки и баллы — начисто
DELETE FROM loyalty_transactions;
DELETE FROM discount_vouchers;
DELETE FROM entity_payments;
DELETE FROM payments;

-- 3. Членства: смотрим, к кому они привязаны
--    Связь идёт через profile_id — учётную запись, а не игрока напрямую
SELECT m.id,
       m.status,
       m.expires_at AS действует_до,
       p.email      AS учётная_запись,
       CASE WHEN p.id IS NULL THEN 'учётной записи нет' ELSE 'на месте' END AS состояние
FROM memberships m
LEFT JOIN profiles p ON p.id = m.profile_id
ORDER BY состояние, m.expires_at DESC NULLS LAST;

-- 4. Осиротевшие членства — от удалённых учётных записей
DELETE FROM memberships m
 WHERE m.profile_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = m.profile_id);

-- 5. Что осталось
SELECT 'после' AS когда,
       (SELECT COUNT(*) FROM entity_payments)      AS платежи_партнёров,
       (SELECT COUNT(*) FROM payments)             AS платежи,
       (SELECT COUNT(*) FROM discount_vouchers)    AS скидки,
       (SELECT COUNT(*) FROM loyalty_transactions) AS баллы,
       (SELECT COUNT(*) FROM memberships)          AS членства;

COMMIT;

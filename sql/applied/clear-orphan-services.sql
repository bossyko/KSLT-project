-- ============================================
-- Услуги партнёров без владельца
-- ============================================
--
-- В таблице двенадцать записей, и все висят в пустоте: три относятся к
-- удалённым тренерам, девять — к тестовым кортам Grand Slam Bishkek,
-- Champion Arena и «Корты для всех», которых нет с позавчера.
--
-- Обходом внешних ключей их было не поймать: связь здесь хранится парой
-- «тип и идентификатор», а не настоящей ссылкой, поэтому база о ней не
-- знает и удаление владельца её не задело.
--
-- Именно из этих записей собираются скидки для членов клуба. Настоящие
-- заведём заново, когда появятся договорённости с кортами.

BEGIN;

-- 1. Что было
SELECT entity_type AS тип, COUNT(*) AS услуг
FROM partner_services GROUP BY entity_type ORDER BY entity_type;

-- 2. Убираем те, чьего владельца в базе нет
DELETE FROM partner_services ps
 WHERE (ps.entity_type = 'coach'
        AND NOT EXISTS (SELECT 1 FROM coaches c WHERE c.id = ps.entity_id))
    OR (ps.entity_type = 'court'
        AND NOT EXISTS (SELECT 1 FROM courts ct WHERE ct.id = ps.entity_id));

-- 3. Что осталось
SELECT 'после' AS когда,
       (SELECT COUNT(*) FROM partner_services) AS услуг,
       (SELECT COUNT(*) FROM courts WHERE partner) AS партнёрских_кортов,
       (SELECT COUNT(*) FROM coaches) AS тренеров;

COMMIT;

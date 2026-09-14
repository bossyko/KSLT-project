-- ============================================================
-- Удалить тестового тренера «Петров Петр» вместе с хвостами
-- ============================================================
--
-- Перед запуском посмотреть trener-petrov-proverka.sql: там видно,
-- сколько записей за ним тянется.
--
-- Порядок важен: сперва связанные записи, потом сама карточка.
-- Внешних ключей нет, база бы не возразила и против обратного порядка,
-- но тогда хвосты остались бы висеть на несуществующем тренере.
--
-- Всё в одной транзакции: либо уходит целиком, либо ничего.
-- Запускать файл целиком.

BEGIN;

DELETE FROM public.discount_vouchers
 WHERE entity_type = 'coach' AND entity_id = 'petrov-petr';

DELETE FROM public.partner_services
 WHERE entity_type = 'coach' AND entity_id = 'petrov-petr';

DELETE FROM public.entity_payments
 WHERE entity_type = 'coach' AND entity_id = 'petrov-petr';

DELETE FROM public.coaches
 WHERE id = 'petrov-petr';

COMMIT;

-- ---- Проверка ----

SELECT count(*) AS осталось_тренеров FROM public.coaches;

SELECT count(*) AS хвосты
  FROM (
    SELECT 1 FROM public.partner_services  WHERE entity_type = 'coach' AND entity_id = 'petrov-petr'
    UNION ALL
    SELECT 1 FROM public.discount_vouchers WHERE entity_type = 'coach' AND entity_id = 'petrov-petr'
    UNION ALL
    SELECT 1 FROM public.entity_payments   WHERE entity_type = 'coach' AND entity_id = 'petrov-petr'
  ) t;

-- Ожидаем: тренеров 0, хвостов 0.
--
-- После этого раздел «Тренеры» на «Услугах» покажет пустое состояние
-- («Список тренеров скоро появится»), а не карточку с шахматами.

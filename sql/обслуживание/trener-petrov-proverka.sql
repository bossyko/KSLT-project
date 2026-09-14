-- ============================================================
-- Тестовый тренер «Петров Петр»: что за ним тянется
-- ============================================================
--
-- Запись видно на страницах «Услуги» и «Тренеры»: тренер по шахматам,
-- 50 лет опыта, 100 000 сом в час. Данные явно пробные.
--
-- Внешних ключей на coaches в базе нет: связанные записи хранят
-- идентификатор тренера строкой в entity_id. Поэтому удаление самой
-- карточки пройдёт, но хвосты останутся — сперва смотрим, какие.
--
-- Просмотры лежат не отдельной таблицей, а счётчиком в самой карточке
-- (coaches.view_count и view_count_app) — уйдут вместе с ней.
--
-- Этот файл только читает. Ничего не меняет.

SELECT 'карточка тренера' AS что, count(*) AS сколько
  FROM public.coaches
 WHERE id = 'petrov-petr'

UNION ALL
SELECT 'услуги со скидкой', count(*)
  FROM public.partner_services
 WHERE entity_type = 'coach' AND entity_id = 'petrov-petr'

UNION ALL
SELECT 'выданные ваучеры', count(*)
  FROM public.discount_vouchers
 WHERE entity_type = 'coach' AND entity_id = 'petrov-petr'

UNION ALL
SELECT 'платежи', count(*)
  FROM public.entity_payments
 WHERE entity_type = 'coach' AND entity_id = 'petrov-petr'
;

-- Сама карточка — посмотреть, точно ли она пробная
SELECT id, name, position, experience, price, partner, court
  FROM public.coaches
 WHERE id = 'petrov-petr';

-- Не остался ли в базе кто-то ещё, кроме него
SELECT id, name, position
  FROM public.coaches
 ORDER BY name;

-- ============================================================
-- MASTERS 11.10 — СНЕСТИ СЕТКУ И ОСВОБОДИТЬ ПОСЕВ
-- ============================================================
--
-- СРОЧНОЕ, турнир сегодня.
--
-- ПОЧЕМУ КОЛОНКА ПОСЕВА НЕ НАЖИМАЕТСЯ. Пока у турнира есть матчи, панель
-- заявок рисуется замороженной: `сеткаЕсть` (bracket.js:2726) приходит в
-- `renderRegistrationsPanel` как `заморожено`, и тем же флагом выключается
-- `select` посева (bracket.js:4800). Ни поставить номер, ни снять.
--
-- Поэтому посев ставится ДО жеребьёвки. Этот запрос возвращает турнир в то
-- состояние: матчей нет, заявки в составе, номера свободны.
--
-- ОТЛИЧИЕ ОТ ПРОШЛОГО СБРОСА. Тот оставлял `seed_number` — по слову Кости
-- «заявки оставь как есть». Из-за этого новая жеребьёвка снова принимала
-- старые номера за ручной выбор и ничего не пересчитывала. Здесь номера
-- снимаются: колонка оживёт, и можно будет либо расставить их самому, либо
-- сразу нажать «Сгенерировать сетку» — тогда продукт посеет по силе.
--
-- ЧТО НЕ ТРОГАЕМ: сами заявки, составы пар, лист ожидания, настройки
-- турнира (3 группы, 10 мест).
--
-- Запускать можно повторно.

BEGIN;

-- ---- ШАГ 0: СЛЕПОК ----
DROP TABLE IF EXISTS public.slepok_m2_matches_1010;
CREATE TABLE public.slepok_m2_matches_1010 AS
SELECT * FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

DROP TABLE IF EXISTS public.slepok_m2_reg_1010;
CREATE TABLE public.slepok_m2_reg_1010 AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- ---- ШАГ 1: СЫГРАННОЕ НЕ СНОСИТСЯ ----
DO $$
DECLARE сыграно integer;
BEGIN
    SELECT count(*) INTO сыграно
      FROM public.matches
     WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
       AND (status = 'completed' OR winner_id IS NOT NULL OR score IS NOT NULL);
    IF сыграно > 0 THEN
        RAISE EXCEPTION 'СТОП: сыгранных матчей %, сносить нельзя', сыграно;
    END IF;
END $$;

-- ---- ШАГ 2: СНОС СЕТКИ ----
DELETE FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- ---- ШАГ 3: ЗАЯВКИ В СОСТАВ, ПОСЕВ СВОБОДЕН ----
UPDATE public.tournament_registrations
   SET status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END,
       group_number = NULL,
       draw_position = NULL,
       seed_number = NULL
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- ---- ШАГ 4: ТУРНИР ВОЗВРАЩАЕТСЯ НА СТАДИЮ ЗАЯВОК ----
-- Слово Кости 10.10: «и сетку надо будет сбросить до заявок».
-- Так же делает сам продукт, когда пережеребливает (bracket.js:7353):
-- статус уходит в registration_open. Жребий обнуляется, иначе новый бросок
-- повторил бы прежний расклад (bracket.js:7335).
--
-- ПРИЁМ ЗАЯВОК ПРИ ЭТОМ ОТКРЫВАЕТСЯ. Жеребьёвка сама закроет его обратно,
-- когда отработает (bracket.js:8399).
UPDATE public.tournaments
   SET draw_seed = NULL,
       status = 'registration_open'
 WHERE id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ
-- ============================================================

-- 1. Матчей нет: ждём 0. Пока тут не ноль, колонка посева не нажмётся.
SELECT count(*) AS matchey_ostalos
  FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- 2. Заявки на месте: ждём 10 approved и 1 waitlist, ни одного посева,
--    ни одной группы.
SELECT status, count(*) AS skolko,
       count(*) FILTER (WHERE seed_number  IS NOT NULL) AS s_posevom,
       count(*) FILTER (WHERE group_number IS NOT NULL) AS s_gruppoy
  FROM public.tournament_registrations
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
 GROUP BY status ORDER BY status;

-- 3. Турнир на стадии заявок: ждём registration_open, жребий пуст,
--    3 группы и 10 мест на месте.
SELECT status, draw_seed AS zhrebiy, group_count AS grupp, max_participants AS mest
  FROM public.tournaments
 WHERE id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- 4. Составы пар не изменились ни на строку: ждём три нуля.
SELECT (SELECT count(*) FROM public.slepok_m2_reg_1010 s
         WHERE NOT EXISTS (SELECT 1 FROM public.tournament_registrations r WHERE r.id = s.id)) AS propalo,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
           AND NOT EXISTS (SELECT 1 FROM public.slepok_m2_reg_1010 s WHERE s.id = r.id)) AS pribylo,
       (SELECT count(*) FROM public.tournament_registrations r
          JOIN public.slepok_m2_reg_1010 s USING (id)
         WHERE r.player_id IS DISTINCT FROM s.player_id
            OR r.partner_id IS DISTINCT FROM s.partner_id) AS sostav_izmenilsya;

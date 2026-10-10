-- ============================================================
-- СБРОС ЖЕРЕБЬЁВКИ — ДРУЖЕСКИЙ ПАРНЫЙ MASTERS 11.10
-- ============================================================
--
-- Слово Кости 10.10: «сбрось жеребьёвку, заявки оставь как сейчас есть —
-- они сами сделают, может там они вручную выберут».
--
-- ПОЧЕМУ НЕ КНОПКОЙ ПРОДУКТА. «Пережеребить» (`regenerateDraw`,
-- js/admin/sections/bracket.js:7316) делает две вещи сразу: сбрасывает И
-- ТУТ ЖЕ ЖЕРЕБИТ ЗАНОВО. Нужен только сброс — чтобы посев и состав остались
-- за админом турнира. Вдобавок кнопка чистит `seed_number`, а Костя просил
-- заявки не трогать: номера 1, 2, 3 он проставлял руками.
--
-- ЧТО СНОСИТСЯ: только следы жеребьёвки.
--
--   матчи турнира            — 21 штука, ни одного сыгранного
--   status заявок            — draw → approved (лист ожидания не трогаем)
--   group_number             — очищается: это раскладка по группам
--   draw_position            — очищается: это место в сетке
--   draw_seed турнира        — обнуляется
--
-- ЧТО ОСТАЁТСЯ НЕТРОНУТЫМ: сами заявки, составы пар, `seed_number` 1-2-3,
-- лист ожидания (Азамат Джумабаев), настройки турнира — 3 группы, 10 мест.
--
-- ПОЧЕМУ ОБНУЛЯЕТСЯ ЖРЕБИЙ. Словами самого продукта (bracket.js:7335):
-- «Пережеребить — это именно новый бросок, иначе расклад повторится тот же».
-- Жребий турнира сейчас № 1 005 374 857; с ним новая жеребьёвка выдала бы
-- те же группы, и кнопка ничего бы не изменила.
--
-- СТАТУС ТУРНИРА НЕ ТРОГАЮ. Сейчас `registration_closed`; жеребьёвка
-- ставит его сама, когда отработает (bracket.js:8399). Открывать приём
-- заявок обратно незачем — заявки собраны.
--
-- Запускать можно повторно: второй прогон не найдёт что сносить.

BEGIN;

-- ---- ШАГ 0: СЛЕПОК ДО СНОСА ----
-- Сыгранных матчей нет, терять нечего — но раскладку по группам
-- восстановить потом будет нечем, если слепка не снять.
DROP TABLE IF EXISTS public.slepok_matches_masters_1010;
CREATE TABLE public.slepok_matches_masters_1010 AS
SELECT * FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

DROP TABLE IF EXISTS public.slepok_reg_masters_1010;
CREATE TABLE public.slepok_reg_masters_1010 AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- ---- ШАГ 1: ПРОВЕРКА, ЧТО СНОСИТЬ БЕЗОПАСНО ----
-- СЫГРАННОЕ НЕ ПЕРЕЖЕРЕБЛИВАЕТСЯ. Если тут окажется не ноль — запрос
-- упадёт, и это правильно: результаты не вернуть ничем.
DO $$
DECLARE сыграно integer;
BEGIN
    SELECT count(*) INTO сыграно
      FROM public.matches
     WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
       AND (status = 'completed' OR winner_id IS NOT NULL OR score IS NOT NULL);
    IF сыграно > 0 THEN
        RAISE EXCEPTION 'СТОП: в турнире % сыгранных матчей — сбрасывать нельзя', сыграно;
    END IF;
END $$;

-- ---- ШАГ 2: СНОС МАТЧЕЙ ----
DELETE FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- ---- ШАГ 3: ЗАЯВКИ ВОЗВРАЩАЮТСЯ В СОСТАВ, НО НЕ ТЕРЯЮТ ПОСЕВ ----
UPDATE public.tournament_registrations
   SET status = 'approved',
       group_number = NULL,
       draw_position = NULL
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
   AND status = 'draw';

-- ---- ШАГ 4: НОВЫЙ ЖРЕБИЙ ----
UPDATE public.tournaments
   SET draw_seed = NULL
 WHERE id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»
-- ============================================================

-- 1. Матчей не осталось: ждём 0.
SELECT count(*) AS matchey_ostalos
  FROM public.matches
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- 2. Заявки на месте и в составе: ждём 10 approved и 1 waitlist,
--    ни одной draw, групп ни у кого нет.
SELECT status,
       count(*)                                        AS skolko,
       count(*) FILTER (WHERE group_number IS NOT NULL) AS s_gruppoy,
       count(*) FILTER (WHERE seed_number IS NOT NULL)  AS s_posevom
  FROM public.tournament_registrations
 WHERE tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
 GROUP BY status ORDER BY status;

-- 3. Посев НЕ ТРОНУТ — те же три номера, что были: ждём 1, 2, 3.
SELECT r.seed_number, p.name AS kapitan, p2.name AS partnyor
  FROM public.tournament_registrations r
  LEFT JOIN public.players p  ON p.id  = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
   AND r.seed_number IS NOT NULL
 ORDER BY r.seed_number;

-- 4. Состав заявок не изменился ни на строку — сверка со слепком.
--    Ждём: propalo 0, pribylo 0, par_izmenilos 0.
SELECT (SELECT count(*) FROM public.slepok_reg_masters_1010 s
         WHERE NOT EXISTS (SELECT 1 FROM public.tournament_registrations r WHERE r.id = s.id)) AS propalo,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290'
           AND NOT EXISTS (SELECT 1 FROM public.slepok_reg_masters_1010 s WHERE s.id = r.id)) AS pribylo,
       (SELECT count(*) FROM public.tournament_registrations r
          JOIN public.slepok_reg_masters_1010 s USING (id)
         WHERE r.player_id IS DISTINCT FROM s.player_id
            OR r.partner_id IS DISTINCT FROM s.partner_id
            OR r.seed_number IS DISTINCT FROM s.seed_number) AS par_izmenilos;

-- 5. Жребий обнулён, настройки турнира целы: ждём пусто в zhrebiy,
--    3 группы, 10 мест, статус registration_closed.
SELECT draw_seed AS zhrebiy, group_count AS grupp,
       max_participants AS mest, status
  FROM public.tournaments
 WHERE id = '5e628a79-43f3-491e-bbf5-363d67d4c290';

-- 6. Слепки на месте, пока Костя не посмотрит глазами.
SELECT (SELECT count(*) FROM public.slepok_matches_masters_1010) AS bylo_matchey,
       (SELECT count(*) FROM public.slepok_reg_masters_1010)     AS bylo_zayavok;

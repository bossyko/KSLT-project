-- ============================================================
-- Одиночный FUTURES: Эрен и Санжар меняются группами — ПРАВКА
-- ============================================================
--
-- Эрен Камчибеков — группа D, четвёртое место.
-- Санжар Эргешалиев — группа G, четвёртое место.
-- Меняем их местами: Санжар идёт в D, Эрен в G.
--
-- Места в группе, время запусков и корты остаются как есть: они лежат на
-- матчах, а мы правим только, кто в матче записан. Сетка плей-офф ещё не
-- собрана — трогать её нечего.
--
-- Счёта ни в одной из этих встреч нет, поэтому обмен ничего не переписывает
-- задним числом.
--
--   D: встречи 1, 4, 6 — вместо Эрена встаёт Санжар
--   G: встречи 2, 4, 5 — вместо Санжара встаёт Эрен
--
-- Меняем одним проходом через CASE: подставлять временное значение нельзя,
-- игрок в матче держится ссылкой на карточку.
--
-- Запускать можно повторно: второй запуск вернёт их обратно, поэтому
-- запускать ровно один раз.

BEGIN;

UPDATE public.matches
   SET player1_id = CASE player1_id
                        WHEN 'eren-kamchibekov'    THEN 'sanzhar-ergeshaliev'
                        WHEN 'sanzhar-ergeshaliev' THEN 'eren-kamchibekov'
                        ELSE player1_id
                    END,
       player2_id = CASE player2_id
                        WHEN 'eren-kamchibekov'    THEN 'sanzhar-ergeshaliev'
                        WHEN 'sanzhar-ergeshaliev' THEN 'eren-kamchibekov'
                        ELSE player2_id
                    END,
       reg1_id    = CASE reg1_id
                        WHEN '17c6a221-8a8a-4862-8bdb-6f0460edc53d'::uuid THEN 'adee51e5-a25d-49fc-8bb8-9dc5e2ffad7a'::uuid
                        WHEN 'adee51e5-a25d-49fc-8bb8-9dc5e2ffad7a'::uuid THEN '17c6a221-8a8a-4862-8bdb-6f0460edc53d'::uuid
                        ELSE reg1_id
                    END,
       reg2_id    = CASE reg2_id
                        WHEN '17c6a221-8a8a-4862-8bdb-6f0460edc53d'::uuid THEN 'adee51e5-a25d-49fc-8bb8-9dc5e2ffad7a'::uuid
                        WHEN 'adee51e5-a25d-49fc-8bb8-9dc5e2ffad7a'::uuid THEN '17c6a221-8a8a-4862-8bdb-6f0460edc53d'::uuid
                        ELSE reg2_id
                    END
 WHERE tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND group_number IN (4, 7)
   AND ('eren-kamchibekov' IN (player1_id, player2_id)
     OR 'sanzhar-ergeshaliev' IN (player1_id, player2_id));

-- Заявки: у каждого своя новая группа
UPDATE public.tournament_registrations
   SET group_number = CASE player_id
                          WHEN 'eren-kamchibekov'    THEN 7
                          WHEN 'sanzhar-ergeshaliev' THEN 4
                      END
 WHERE tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND player_id IN ('eren-kamchibekov', 'sanzhar-ergeshaliev');

COMMIT;

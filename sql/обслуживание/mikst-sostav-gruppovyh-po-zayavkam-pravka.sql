-- ============================================================
-- Микст FUTURES: состав групповых матчей по заявкам — ПРАВКА
-- ============================================================
--
-- В шести групповых матчах игрок разошёлся со своей заявкой: в матче
-- записан один человек, а заявка, которой принадлежит это место, — за
-- другим. След старой замены: она переписывала матчи по всему турниру и
-- часть строк пропустила.
--
-- На экране таблица группы читает состав из заявок и выглядит доигранной,
-- а счётчик считает по матчам и показывает недоигранные встречи. Отсюда
-- «осталось записать счёт: 9», когда на вид всё сыграно.
--
-- Приводим матчи к заявкам: место в сетке принадлежит заявке, а кто в ней
-- сегодня — дело самой заявки.
--
-- Запускать можно повторно: строки, где всё сходится, не тронутся.

BEGIN;

UPDATE public.matches m
   SET player1_id = r1.player_id
  FROM public.tournament_registrations r1
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.group_number IS NOT NULL
   AND m.reg1_id = r1.id
   AND m.player1_id IS DISTINCT FROM r1.player_id;

UPDATE public.matches m
   SET player2_id = r2.player_id
  FROM public.tournament_registrations r2
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.group_number IS NOT NULL
   AND m.reg2_id = r2.id
   AND m.player2_id IS DISTINCT FROM r2.player_id;

-- Победитель мог остаться за тем, кого в матче больше нет
UPDATE public.matches
   SET winner_id = CASE
           WHEN score IS NULL OR score = '' THEN NULL
           WHEN winner_id IS DISTINCT FROM player1_id
            AND winner_id IS DISTINCT FROM player2_id THEN NULL
           ELSE winner_id
       END
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND group_number IS NOT NULL;

COMMIT;

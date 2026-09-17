-- ============================================================
-- Микст FUTURES: победитель доп. матча в свою клетку — ПРАВКА
-- ============================================================
--
-- Автоматическая расстановка искала любую пустую клетку первого круга и
-- сажала победителя туда, где сильнее соперник. После отмены первого доп.
-- матча освободилась ещё одна клетка — и победитель второго уехал в неё, к
-- первому номеру. Его собственная клетка осталась пустой и закрылась
-- проходом без игры.
--
-- Приводим к правилу: победитель доп. матча стоит в клетке со своей меткой,
-- а место отменённого матча не достаётся никому — там проход без игры.
--
--   встреча 1: Искендер / Яна (A1) — проход без игры (IG1 отменён)
--   встреча 8: Табалдиева / Азат Базаркулов (IG2) против Азата Мукаева (B1)
--
-- Сама причина исправлена в админке.
--
-- Запускать можно повторно.

BEGIN;

-- Встреча 1: клетка отменённого матча пустеет, Искендер проходит без игры
UPDATE public.matches
   SET player2_id = NULL,
       reg2_id    = NULL,
       status     = 'completed',
       score      = 'BYE',
       winner_id  = player1_id
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND round = 'R1' AND match_order = 1;

-- Встреча 8: победитель доп. матча занимает свою клетку, прохода нет
UPDATE public.matches m
   SET status    = 'upcoming',
       score     = NULL,
       winner_id = NULL,
       reg1_id   = (SELECT id FROM public.tournament_registrations
                     WHERE tournament_id = m.tournament_id
                       AND (player_id = 'tabaldieva-aykanysh' OR partner_id = 'tabaldieva-aykanysh')
                       AND status NOT IN ('withdrawn', 'rejected') LIMIT 1)
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.round = 'R1' AND m.match_order = 8;

COMMIT;

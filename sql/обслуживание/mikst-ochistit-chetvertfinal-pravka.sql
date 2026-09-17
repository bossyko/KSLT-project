-- ============================================================
-- Микст FUTURES: убрать из четвертьфинала тех, кто ещё не сыграл — ПРАВКА
-- ============================================================
--
-- Пока клетки первого круга стояли пустыми (имена в них подставляются по
-- мере готовности групп и доп. матчей), они считались проходом без игры, и
-- соперник уезжал в следующий круг, не сыграв матча. Так в четвертьфинале
-- оказались Денис, Эрлан, Леонид, Айжан и Азат — при том что их встречи
-- первого круга ещё впереди.
--
-- Пересобираем второй круг по правде: в клетке стоит победитель своей
-- встречи первого круга, а если она не сыграна — клетка пустая.
--
-- Встреча первого круга с номером 2k-1 ведёт в первую сторону
-- четвертьфинала k, встреча 2k — во вторую.
--
-- Причина исправлена в админке: проход без игры теперь закрывается только
-- там, где у клетки нет метки, то есть соперника не будет вовсе.
--
-- Запускать можно повторно.

BEGIN;

UPDATE public.matches qf
   SET player1_id = п1.winner_id,
       reg1_id    = п1.reg_победителя,
       player2_id = п2.winner_id,
       reg2_id    = п2.reg_победителя,
       -- Состав поменялся — счёт и победитель этого круга больше не наши
       status     = CASE WHEN qf.status = 'completed' AND qf.score = 'BYE'
                         THEN 'upcoming' ELSE qf.status END,
       score      = CASE WHEN qf.score = 'BYE' THEN NULL ELSE qf.score END,
       winner_id  = CASE WHEN qf.score = 'BYE' THEN NULL ELSE qf.winner_id END
  FROM (
        SELECT m.match_order,
               CASE WHEN m.status = 'completed' THEN m.winner_id END AS winner_id,
               CASE WHEN m.status = 'completed'
                    THEN CASE WHEN m.winner_id = m.player1_id THEN m.reg1_id ELSE m.reg2_id END
               END AS reg_победителя
          FROM public.matches m
         WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
           AND m.group_number IS NULL AND m.round = 'R1'
       ) п1,
       (
        SELECT m.match_order,
               CASE WHEN m.status = 'completed' THEN m.winner_id END AS winner_id,
               CASE WHEN m.status = 'completed'
                    THEN CASE WHEN m.winner_id = m.player1_id THEN m.reg1_id ELSE m.reg2_id END
               END AS reg_победителя
          FROM public.matches m
         WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
           AND m.group_number IS NULL AND m.round = 'R1'
       ) п2
 WHERE qf.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND qf.group_number IS NULL
   AND qf.round = 'QF'
   AND п1.match_order = qf.match_order * 2 - 1
   AND п2.match_order = qf.match_order * 2;

COMMIT;

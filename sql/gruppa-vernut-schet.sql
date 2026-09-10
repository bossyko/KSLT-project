-- ============================================================
-- Групповой турнир: вернуть счёт, стёртый правкой сетки
-- ============================================================
--
-- Правка результата написана для олимпийской сетки: там победитель едет
-- дальше, и зависимые клетки надо чистить. В группе такой зависимости нет —
-- каждая пара играет с каждой, — но матчи там нумеруются так же, по кругам и
-- порядку. Правка приняла групповые матчи за сетку и стёрла счета у встреч с
-- теми же номерами в других группах.
--
-- В коде это уже закрыто: в группе счёт правится только у своего матча.
-- Здесь возвращаем то, что стёрлось: встречу Кайыпов — Джумабаев.
--
-- Запускать один раз.

UPDATE public.matches
   SET score = '6/3',
       winner_id = 'bakyt-kayypov',
       status = 'completed',
       played_at = COALESCE(played_at, now())
 WHERE tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
   AND group_number = 1
   AND round_number = 2
   AND match_order = 4;

-- ---- Проверка ----

SELECT m.group_number AS группа, m.round_number AS круг, m.match_order AS номер,
       p1.name AS игрок_1, p2.name AS игрок_2, m.score AS счёт, pw.name AS победитель
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
  LEFT JOIN public.players pw ON pw.id = m.winner_id
 WHERE m.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
 ORDER BY m.group_number, m.round_number, m.match_order;

-- ============================================================
-- Futures: убрать пустые записи встреч, которые уже сыграны
-- ============================================================
--
-- В группах B и C остались лишние записи матчей: пара встречается
-- дважды, один матч сыгран, второй пустой. Часть из них была в базе
-- изначально, часть появилась из-за того, что клетку матрицы нажали
-- с обеих сторон — тогда заводились две записи одной встречи.
--
-- Удаляем только записи, у которых:
--   * нет счёта и нет победителя,
--   * состояние upcoming,
--   * и у этой же пары в этой же группе уже есть сыгранный матч.
--
-- То есть ни один результат и ни одна живая встреча не пострадают.
-- Пустая запись пары, у которой сыгранного матча нет, останется на месте.
--
-- В админке поведение уже поправлено: повторное нажатие открывает
-- существующий матч, а не заводит второй. Этот файл — про уборку того,
-- что успело накопиться.
--
-- Запускать можно повторно.

BEGIN;

DELETE FROM public.matches m
 WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND m.group_number IS NOT NULL
   AND m.score IS NULL
   AND m.winner_id IS NULL
   AND m.status = 'upcoming'
   AND EXISTS (
        SELECT 1
          FROM public.matches s
         WHERE s.tournament_id = m.tournament_id
           AND s.group_number  = m.group_number
           AND s.id <> m.id
           AND s.status = 'completed'
           AND s.score IS NOT NULL
           AND LEAST(s.player1_id, s.player2_id)    = LEAST(m.player1_id, m.player2_id)
           AND GREATEST(s.player1_id, s.player2_id) = GREATEST(m.player1_id, m.player2_id)
   );

-- ---- Вторая уборка: пара задвоена двумя пустыми записями ----
--
-- Так вышло в группе B с парой «Эрбол — Азат»: клетку нажали с обеих
-- сторон матрицы, завелись две записи одной встречи, и обе пустые.
-- Сыгранного матча у пары нет, поэтому первый запрос их не трогает.
--
-- Оставляем самую раннюю запись пары (по номеру в группе), лишние убираем.
-- Если хоть в одной из них есть счёт — не трогаем вовсе.

DELETE FROM public.matches m
 WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND m.group_number IS NOT NULL
   AND m.score IS NULL
   AND m.winner_id IS NULL
   AND m.status = 'upcoming'
   AND EXISTS (
        SELECT 1
          FROM public.matches s
         WHERE s.tournament_id = m.tournament_id
           AND s.group_number  = m.group_number
           AND s.id <> m.id
           AND s.score IS NULL
           AND s.winner_id IS NULL
           AND s.status = 'upcoming'
           AND LEAST(s.player1_id, s.player2_id)    = LEAST(m.player1_id, m.player2_id)
           AND GREATEST(s.player1_id, s.player2_id) = GREATEST(m.player1_id, m.player2_id)
           AND (s.match_order < m.match_order
                OR (s.match_order = m.match_order AND s.id < m.id))
   );

COMMIT;

-- ---- Проверка ----

SELECT CASE m.group_number WHEN 1 THEN 'A' WHEN 2 THEN 'B' WHEN 3 THEN 'C'
                           WHEN 4 THEN 'D' WHEN 5 THEN 'E' ELSE 'F' END AS группа,
       p1.name AS первый,
       p2.name AS второй,
       m.status AS состояние,
       COALESCE(m.score, '—') AS счёт
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND m.group_number IS NOT NULL
 ORDER BY m.group_number, m.match_order;

-- Ожидаем: в каждой группе по три встречи, каждая пара ровно один раз.
-- В группе C все три сыграны — места станут окончательными, лаймовыми,
-- а победители встанут в плей-офф.

SELECT count(*) AS всего_матчей,
       count(*) FILTER (WHERE status = 'completed' AND score IS NOT NULL) AS сыгранных
  FROM public.matches
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND group_number IS NOT NULL;
-- Сыгранных должно остаться столько же, сколько было до запуска.

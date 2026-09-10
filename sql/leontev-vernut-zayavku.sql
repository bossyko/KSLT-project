-- ============================================================
-- Вернуть пару Леонтьева в состав турнира Masters
-- ============================================================
--
-- Заявка Кирилла Леонтьева с Муратом Норзубаевым оказалась в отклонённых —
-- нажали случайно. Из-за этого в сетку попали одиннадцать пар вместо
-- двенадцати. Возвращаем её в основной состав.
--
-- Следы прежней жеребьёвки снимаем: группу, посев и место в сетке проставит
-- новая. Сетку после этого пересоздай во вкладке «Группа».
--
-- Запускать можно повторно.

BEGIN;

UPDATE public.tournament_registrations
   SET status        = 'approved',
       group_number  = NULL,
       seed_number   = NULL,
       draw_position = NULL
 WHERE tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
   AND player_id = 'kirill-leontev';

COMMIT;

-- ---- Проверка ----

SELECT r.status AS состояние, count(*) AS заявок
  FROM public.tournament_registrations r
 WHERE r.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
 GROUP BY r.status
 ORDER BY 1;
-- Ожидаем: двенадцать заявок, все в «approved» или «draw», отклонённых нет.

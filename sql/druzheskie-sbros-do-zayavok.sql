-- ============================================================
-- Оба дружеских турнира: вернуть к состоянию «только заявки»
-- ============================================================
--
-- После проверок в турнирах остаются следы: сетка, расписание, отказы и
-- снятия. Этот файл возвращает оба турнира к началу — когда заявки поданы,
-- а жеребьёвки ещё не было.
--
-- Что делаем:
--   * сносим матчи, результаты и запись для отката жеребьёвки;
--   * снимаем с заявок группу, посев и место в сетке;
--   * возвращаем в строй всех, кому отказали или кто снялся во время проверок;
--   * очередь (waitlist) не трогаем — это честный порядок подачи, а не след;
--   * турниру возвращаем «регистрация открыта» и забываем про расписание.
--
-- Сами заявки не удаляем: их переносили из формы клуба, и второй раз их никто
-- заводить не будет.
--
-- Masters — b8a6de7b-a146-4168-aaea-b56fb5dbd135
-- Futures — 7094e2bd-02e6-476b-9e0c-efc7bffc8418
--
-- Запускать можно повторно.

BEGIN;

-- Записи других таблиц держат матчи и не дают их удалить. Находим такие связи
-- сами: перечислять таблицы руками — значит однажды забыть новую
DO $$
DECLARE
    св record;
    турниры text[] := ARRAY['b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                            '7094e2bd-02e6-476b-9e0c-efc7bffc8418'];
BEGIN
    FOR св IN
        SELECT c.conrelid::regclass AS таблица, a.attname AS поле
          FROM pg_constraint c
          JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
         WHERE c.contype = 'f'
           AND c.confrelid = 'public.matches'::regclass
           AND c.conrelid <> 'public.matches'::regclass
    LOOP
        EXECUTE format(
            'DELETE FROM %s WHERE %I IN (SELECT id FROM public.matches WHERE tournament_id = ANY($1))',
            св.таблица, св.поле) USING турниры;
    END LOOP;
END $$;

DELETE FROM public.matches
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

DELETE FROM public.tournament_results
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

DELETE FROM public.bracket_undo
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- Заявки: снимаем следы жеребьёвки и возвращаем в строй выбывших.
-- Лист ожидания оставляем как есть — это не след проверок, а очередь
UPDATE public.tournament_registrations
   SET group_number  = NULL,
       seed_number   = NULL,
       draw_position = NULL,
       status = CASE WHEN status IN ('draw', 'rejected', 'withdrawn', 'blocked')
                     THEN 'approved' ELSE status END
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

UPDATE public.tournaments
   SET status               = 'registration_open',
       schedule_saved_at    = NULL,
       schedule_notified_at = NULL
 WHERE id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
              '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

COMMIT;

-- ---- Проверка ----

SELECT t.title AS турнир,
       t.status AS состояние,
       (SELECT count(*) FROM public.matches m WHERE m.tournament_id = t.id) AS матчей,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'approved') AS в_составе,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'waitlist') AS в_очереди,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id
           AND r.status IN ('rejected', 'withdrawn', 'blocked')) AS вне_турнира,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.seed_number IS NOT NULL) AS сеяных
  FROM public.tournaments t
 WHERE t.id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                '7094e2bd-02e6-476b-9e0c-efc7bffc8418');
-- Ожидаем: матчей 0, сеяных 0, вне_турнира 0, регистрация открыта.
-- Masters — 12 в составе, Futures — 19, и по одному в очереди у каждого.

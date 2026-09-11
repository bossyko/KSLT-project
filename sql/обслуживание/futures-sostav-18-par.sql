-- ============================================================
-- Futures: собрать состав из 18 пар и снять сетку под пережеребьёвку
-- ============================================================
--
-- Две заявки без напарника (Салих Исмаилов и Тимур Узагалиев) подали раньше
-- остальных и заняли два места из восемнадцати. Играть им не с кем: в
-- жеребьёвку заявка без пары не идёт — сетка вышла на 16 пар вместо 18, а две
-- готовые пары в это время ждали в очереди.
--
-- Место должно доставаться тому, кто выйдет на корт. Поэтому заявки без пары
-- уходят в очередь — не отменяются: найдут напарника, вернутся. А их места
-- занимают первые полные пары листа ожидания.
--
-- Сетку снимаем: она разложена на 16 пар, и дораскидать в неё ещё две нельзя.
-- После запуска расставь посев заново (6 сеяных) и запусти жеребьёвку.
--
-- Futures — 7094e2bd-02e6-476b-9e0c-efc7bffc8418
--
-- Запускать можно повторно.

BEGIN;

-- ---- 1. Снять сетку ----

DO $$
DECLARE
    св record;
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
            'DELETE FROM %s WHERE %I IN (SELECT id FROM public.matches WHERE tournament_id = $1)',
            св.таблица, св.поле) USING '7094e2bd-02e6-476b-9e0c-efc7bffc8418';
    END LOOP;
END $$;

DELETE FROM public.matches
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

DELETE FROM public.bracket_undo
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

UPDATE public.tournament_registrations
   SET group_number  = NULL,
       seed_number   = NULL,
       draw_position = NULL,
       status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

-- ---- 2. Заявки без пары уступают место ----

UPDATE public.tournament_registrations
   SET status = 'waitlist'
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
   AND status = 'approved'
   AND partner_id IS NULL
   AND partner_external_name IS NULL;

-- ---- 3. Освободившиеся места — первым парам из очереди ----

WITH свободно AS (
    SELECT t.max_participants - t.reserved_spots -
           (SELECT count(*) FROM public.tournament_registrations r
             WHERE r.tournament_id = t.id
               AND r.status IN ('approved', 'pending', 'draw')) AS мест
      FROM public.tournaments t
     WHERE t.id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
),
очередь AS (
    SELECT r.id,
           row_number() OVER (ORDER BY r.registered_at) AS номер
      FROM public.tournament_registrations r
     WHERE r.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
       AND r.status = 'waitlist'
       -- Поднимаем только готовые пары: одиночку поднять — значит вернуть
       -- ровно ту дыру, из-за которой всё и затевалось
       AND (r.partner_id IS NOT NULL OR r.partner_external_name IS NOT NULL)
)
UPDATE public.tournament_registrations r
   SET status = 'approved'
  FROM очередь о, свободно с
 WHERE r.id = о.id
   AND о.номер <= с.мест;

UPDATE public.tournaments
   SET status = 'registration_open',
       schedule_saved_at = NULL,
       schedule_notified_at = NULL
 WHERE id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

COMMIT;

-- ---- Проверка ----

SELECT count(*) FILTER (WHERE status = 'approved') AS в_составе,
       count(*) FILTER (WHERE status = 'approved'
                          AND partner_id IS NULL
                          AND partner_external_name IS NULL) AS в_составе_без_пары,
       count(*) FILTER (WHERE status = 'waitlist') AS в_очереди,
       (SELECT count(*) FROM public.matches
         WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418') AS матчей
  FROM public.tournament_registrations
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';
-- Ожидаем: в составе 18, из них без пары 0, в очереди 2, матчей 0.

SELECT row_number() OVER (ORDER BY r.registered_at) AS "№",
       p1.name AS участник,
       coalesce(p2.name, '—') AS напарник,
       r.status AS состояние,
       to_char(r.registered_at, 'DD.MM HH24:MI') AS подана
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
 ORDER BY r.registered_at;
-- Ожидаем: 18 пар в составе, а Салих Исмаилов и Тимур Узагалиев — в очереди.

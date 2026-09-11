-- ============================================================
-- Оба дружеских турнира: сбросить сетки перед проверкой посева
-- ============================================================
--
-- Правила посева переписаны: сеяных ставит менеджер руками, жеребьёвка
-- разводит их по группам и не запускается, пока не набрана норма. Чтобы
-- проверить это на живых данных, снимаем обе сетки.
--
-- Заявки остаются — их переносили из формы клуба. Снимаем только следы
-- жеребьёвки: группу, место в сетке и прежний посев, который проставлялся
-- автоматически. Новый посев ты расставишь сам во вкладке «Заявки».
--
-- Masters — 12 пар, три группы, значит трое сеяных.
-- Futures — 18 пар, три группы, значит тоже трое.
--
-- Запускать можно повторно.

BEGIN;

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

-- Заявки: следы жеребьёвки снимаем, сами заявки не трогаем
UPDATE public.tournament_registrations
   SET group_number  = NULL,
       seed_number   = NULL,
       draw_position = NULL,
       status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END
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
       t.group_count AS групп,
       (SELECT count(*) FROM public.matches m WHERE m.tournament_id = t.id) AS матчей,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'approved') AS заявок_принято,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.seed_number IS NOT NULL) AS сеяных
  FROM public.tournaments t
 WHERE t.id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                '7094e2bd-02e6-476b-9e0c-efc7bffc8418');
-- Ожидаем: матчей 0, сеяных 0, заявок 12 и 18.

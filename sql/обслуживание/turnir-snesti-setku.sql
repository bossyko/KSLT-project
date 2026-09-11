-- ============================================================
-- Снести сетку и результаты, оставив заявки
-- ============================================================
--
-- Проверяли жеребьёвку и запуски на двух дружеских парных турнирах. Теперь
-- начинаем заново: убираем матчи, расписание и итоги, а заявки остаются —
-- их переносили из формы клуба, второй раз заливать незачем.
--
-- Заодно снимаем у заявок посев и место в сетке: они проставляются при
-- жеребьёвке и к следующей отношения не имеют.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Матчи ----
--
-- На матч ссылаются живые матчи, ставки зрителей и прочее. Что именно —
-- спрашиваем у самой базы: перебираем все связи, ведущие на matches, и
-- очищаем их сами, чтобы удаление не упёрлось в запрет.

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
        RAISE NOTICE 'очищено: %.%', св.таблица, св.поле;
    END LOOP;
END $$;

DELETE FROM public.matches
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- ---- Итоги ----

DELETE FROM public.tournament_results
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

DELETE FROM public.rating_history
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- ---- Снимок для отката больше не нужен ----

DELETE FROM public.bracket_undo
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- ---- Заявки: чистим следы жеребьёвки ----

UPDATE public.tournament_registrations
   SET seed_number = NULL,
       draw_position = NULL,
       group_number = NULL,
       -- Жеребьёвка переводит заявку в «в сетке». Сетки больше нет — значит
       -- заявка снова просто принята
       status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- Настройки турнира не трогаем: число кортов, длительность матча, перерыв,
-- тип сетки и число групп ты уже выставил, и жеребить заново удобнее по ним.

COMMIT;

-- ---- Проверка ----

SELECT t.title AS турнир,
       (SELECT count(*) FROM public.matches m WHERE m.tournament_id = t.id) AS матчей,
       (SELECT count(*) FROM public.tournament_results r WHERE r.tournament_id = t.id) AS итогов,
       (SELECT count(*) FROM public.tournament_registrations r WHERE r.tournament_id = t.id) AS заявок
  FROM public.tournaments t
 WHERE t.id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                '7094e2bd-02e6-476b-9e0c-efc7bffc8418');
-- Ожидаем: матчей 0, итогов 0, заявок 12 и 19.

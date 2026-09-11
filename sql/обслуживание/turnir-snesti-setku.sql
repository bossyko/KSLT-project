-- ============================================================
-- Снести сетку и результаты одного турнира, оставив заявки
-- ============================================================
--
-- Начинаем турнир заново: убираем матчи, расписание и итоги. Заявки
-- остаются — их переносили из формы клуба, второй раз заливать незачем.
--
-- Заодно снимаем с заявок посев, группу и место в сетке: они проставляются
-- при жеребьёвке и к следующей отношения не имеют. Лист ожидания не трогаем:
-- это очередь по времени подачи, а не след прошлой сетки.
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │  ПОМЕНЯЙТЕ ЗДЕСЬ id турнира — он один на весь файл            │
-- └──────────────────────────────────────────────────────────────┘
--
-- Где взять: в адресе админки после /bracket/
--   Futures — 7094e2bd-02e6-476b-9e0c-efc7bffc8418
--   Masters — b8a6de7b-a146-4168-aaea-b56fb5dbd135
--
-- Запускать можно повторно.

BEGIN;

DO $$
DECLARE
    турнир text := 'b8a6de7b-a146-4168-aaea-b56fb5dbd135';   -- ← сюда
    св record;
BEGIN
    -- На матч ссылаются живые матчи, ставки зрителей и прочее. Что именно —
    -- спрашиваем у самой базы: перебираем все связи, ведущие на matches, и
    -- очищаем их сами, чтобы удаление не упёрлось в запрет
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
            св.таблица, св.поле) USING турнир;
    END LOOP;

    DELETE FROM public.matches            WHERE tournament_id = турнир;
    DELETE FROM public.tournament_results WHERE tournament_id = турнир;
    DELETE FROM public.bracket_undo       WHERE tournament_id = турнир;

    -- Очки, если их успели начислить: турнир играется заново, и старые
    -- начисления к новому результату отношения не имеют
    DELETE FROM public.rating_history     WHERE tournament_id = турнир;

    UPDATE public.tournament_registrations
       SET group_number  = NULL,
           seed_number   = NULL,
           draw_position = NULL,
           status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END
     WHERE tournament_id = турнир;

    UPDATE public.tournaments
       SET status               = 'registration_open',
           schedule_saved_at    = NULL,
           schedule_notified_at = NULL
     WHERE id = турнир;
END $$;

COMMIT;

-- ---- Проверка ----

SELECT t.title AS турнир,
       t.status AS состояние,
       (SELECT count(*) FROM public.matches m WHERE m.tournament_id = t.id) AS матчей,
       (SELECT count(*) FROM public.tournament_results r WHERE r.tournament_id = t.id) AS итогов,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'approved') AS в_составе,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'waitlist') AS в_очереди,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.seed_number IS NOT NULL) AS сеяных
  FROM public.tournaments t
 WHERE t.id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135';          -- ← и сюда, для проверки
-- Ожидаем: матчей 0, итогов 0, сеяных 0, регистрация открыта.
-- Masters: 12 в составе, очередь пуста.

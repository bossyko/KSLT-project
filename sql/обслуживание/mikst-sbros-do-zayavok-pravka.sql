    -- ============================================================
    -- Микст FUTURES: вернуть к состоянию «только заявки» — ПРАВКА
    -- ============================================================
    --
    -- Сносим всё, что появилось после жеребьёвки: группы, доп. матчи, сетку,
    -- результаты, начисления и запись для отката. Заявки остаются на месте —
    -- их переносили из формы клуба, заводить заново никто не будет.
    --
    -- Ручные места в группах тоже убираем: групп больше нет, а раскладка
    -- осталась бы висеть и подмешалась бы в новую жеребьёвку.
    --
    -- Лист ожидания не трогаем: это честная очередь подачи, а не след проверок.
    --
    -- Турнир — Дружеский микст-турнир в категории FUTURES
    --          c0a30bae-30ee-4a38-a26a-4c6b339bd695
    --
    -- Запускать можно повторно.

    BEGIN;

    -- Записи других таблиц держат матчи и не дают их удалить. Находим такие
    -- связи сами: перечислять таблицы руками — значит однажды забыть новую
    DO $$
    DECLARE
        св record;
        турнир text := 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';
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
                св.таблица, св.поле) USING турнир;
        END LOOP;
    END $$;

    DELETE FROM public.matches
     WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

    DELETE FROM public.tournament_results
     WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

    DELETE FROM public.bracket_undo
     WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

    DELETE FROM public.rating_history
     WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

    -- Заявки: снимаем следы жеребьёвки
    --
    -- Снятых и отклонённых в строй не возвращаем. Их место мог занять другой:
    -- при замене из листа ожидания прежняя заявка снимается, а человек уходит
    -- в чужую пару. Вернув снятую заявку, мы сделали бы его участником двух
    -- пар разом — на этом и останавливает правило «один игрок — одна пара»
    -- Правило «один игрок — одна пара» стережёт состав пар. Здесь состав не
    -- меняется ни на строку — снимаем только группу, посев и место, — но
    -- проверка всё равно перебирает соседние заявки и спотыкается на следах
    -- замен. На время сброса выключаем её
    ALTER TABLE public.tournament_registrations DISABLE TRIGGER USER;

    UPDATE public.tournament_registrations
       SET group_number  = NULL,
           seed_number   = NULL,
           draw_position = NULL,
           status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END
     WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

    ALTER TABLE public.tournament_registrations ENABLE TRIGGER USER;

    UPDATE public.tournaments
       SET status               = 'registration_open',
           manual_group_places  = '{}'::jsonb,
           schedule_saved_at    = NULL,
           schedule_notified_at = NULL
     WHERE id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

    COMMIT;

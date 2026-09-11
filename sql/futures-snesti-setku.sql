-- ============================================================
-- Futures: снести сетку, заявки оставить
-- ============================================================
--
-- Жеребьёвка отработала дважды подряд, и в турнире лежат две раскладки разом:
-- 90 матчей вместо 45, пары стоят сразу в двух группах. Заявки при этом
-- целые — их перезаписала последняя раскладка, и они правильные.
--
-- Убираем матчи и следы жеребьёвки в заявках. После этого обнови админку и
-- пережеребь: кнопка теперь гаснет на время работы, и второй запуск не
-- пройдёт.
--
-- Запускать можно повторно.

BEGIN;

DO $$
DECLARE
    св record;
    турнир constant text := '7094e2bd-02e6-476b-9e0c-efc7bffc8418';
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
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

DELETE FROM public.bracket_undo
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

-- Заявки: снимаем группу, посев и место в сетке — их проставит новая жеребьёвка
UPDATE public.tournament_registrations
   SET group_number  = NULL,
       seed_number   = NULL,
       draw_position = NULL,
       status = CASE WHEN status = 'draw' THEN 'approved' ELSE status END
 WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

UPDATE public.tournaments
   SET status               = 'registration_open',
       schedule_saved_at    = NULL,
       schedule_notified_at = NULL
 WHERE id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418';

COMMIT;

-- ---- Проверка ----

SELECT (SELECT count(*) FROM public.matches
         WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418') AS матчей,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
           AND status = 'approved') AS заявок_принято;
-- Ожидаем: матчей 0, заявок принято 18.
-- После жеребьёвки должно стать 45 матчей: три группы по шесть пар,
-- в каждой круговая — по пятнадцать игр.

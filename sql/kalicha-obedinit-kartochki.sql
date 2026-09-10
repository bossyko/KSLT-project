-- ============================================================
-- Калича Тайгурова: две карточки на одного человека
-- ============================================================
--
-- В базе она лежит дважды. В списке NTRP записана как «Калича Тайгурова» —
-- с рейтингом 3.5 / 3, но без единого матча. В турнирной сетке её завели как
-- «Калича Тайгуронова» — с пятью матчами ТБШ Masters, но без рейтинга.
--
-- Правильная фамилия — Тайгурова, так в таблице. Её карточку и оставляем:
-- переносим на неё матчи, заявку, историю рейтинга и счёт побед, а вторую
-- удаляем.
--
-- Связи перебираем не списком, а по самой базе: берём все поля,
-- которые
-- ссылаются на игрока, и переводим их разом. Так ничего не забудется, даже
-- если завтра появится новая таблица.
--
-- Строки переносим по одной, потому что кое-что у обеих карточек уже есть в
-- одном экземпляре — например значок «первый матч», он один на игрока. Такую
-- строку переносить некуда: она у правильной карточки и так стоит, поэтому
-- дубликат просто убираем.
--
-- Запускать можно повторно: после первого раза переносить будет нечего.

BEGIN;

DO $$
DECLARE
    дубль constant text := 'kalicha-tayguronova';
    цель  constant text := 'kalicha-taygurova';
    св    record;
    строки tid[];
    стр   tid;
    перенесено int;
    убрано int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE id = дубль) THEN
        RAISE NOTICE 'Лишней карточки уже нет — переносить нечего';
        RETURN;
    END IF;

    -- Счёт побед и поражений забираем себе: матчи-то её
    UPDATE public.players ц
       SET wins   = ц.wins   + д.wins,
           losses = ц.losses + д.losses
      FROM public.players д
     WHERE ц.id = цель AND д.id = дубль;

    -- Все ссылки на игрока — со старой карточки на правильную
    FOR св IN
        SELECT c.conrelid::regclass AS таблица, a.attname AS поле
          FROM pg_constraint c
          JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
         WHERE c.contype = 'f'
           AND c.confrelid = 'public.players'::regclass
    LOOP
        EXECUTE format('SELECT array_agg(ctid) FROM %s WHERE %I = %L',
                       св.таблица, св.поле, дубль)
           INTO строки;
        CONTINUE WHEN строки IS NULL;

        перенесено := 0;
        убрано := 0;

        FOREACH стр IN ARRAY строки LOOP
            BEGIN
                EXECUTE format('UPDATE %s SET %I = %L WHERE ctid = %L',
                               св.таблица, св.поле, цель, стр);
                перенесено := перенесено + 1;
            EXCEPTION WHEN unique_violation THEN
                -- У правильной карточки такая запись уже есть
                EXECUTE format('DELETE FROM %s WHERE ctid = %L', св.таблица, стр);
                убрано := убрано + 1;
            END;
        END LOOP;

        RAISE NOTICE '%.% — перенесено %, убрано как повтор %',
                     св.таблица, св.поле, перенесено, убрано;
    END LOOP;

    DELETE FROM public.players WHERE id = дубль;
    RAISE NOTICE 'Лишняя карточка удалена';
END $$;

COMMIT;

-- ---- Проверка ----

SELECT p.id, p.name, p.ntrp_singles AS одиночный, p.ntrp_doubles AS парный,
       p.wins, p.losses,
       (SELECT count(*) FROM public.matches m
         WHERE m.player1_id = p.id OR m.player2_id = p.id) AS матчей
  FROM public.players p
 WHERE p.id IN ('kalicha-taygurova', 'kalicha-tayguronova');
-- Ожидаем одну строку: Калича Тайгурова, 3.5 / 3, 2 победы, 3 поражения, 5 матчей.

-- ============================================================
-- Мураталиев: двойник, заведённый при мужской заливке
-- ============================================================
--
-- В базе он был как «Ильдияр Мураталиев» — с матчами ТБШ Pro-Masters. В файле
-- Masters записан как «Мураталиев Эльдияр», и сверка имён его не узнала:
-- расходится первая буква имени. Так появилась вторая карточка с очками
-- Masters.
--
-- Оставляем ту, что стоит в сетке, — её адрес прописан во всех матчах.
-- Очки Masters и строки истории переезжают на неё, лишняя удаляется.
--
-- Имя оставляю как в базе и в сетке: «Ильдияр Мураталиев». Если правильное
-- всё-таки «Эльдияр» — поменяй строчку с UPDATE name ниже.
--
-- Запускать можно повторно.

BEGIN;

DO $$
DECLARE
    дубль constant text := 'eldiyar-muratalyev';
    цель  constant text := 'ildiyar-murataliev';
    св    record;
    строки tid[];
    стр   tid;
    перенесено int;
    убрано int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.players WHERE id = дубль) THEN
        RAISE NOTICE 'Лишней карточки уже нет';
        RETURN;
    END IF;

    UPDATE public.players ц
       SET ntrp_singles = COALESCE(ц.ntrp_singles, д.ntrp_singles),
           ntrp_doubles = COALESCE(ц.ntrp_doubles, д.ntrp_doubles),
           wins         = ц.wins + д.wins,
           losses       = ц.losses + д.losses
      FROM public.players д
     WHERE ц.id = цель AND д.id = дубль;

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

-- Имя как в сетке. Если правильное «Эльдияр» — поменяй здесь
UPDATE public.players SET name = 'Ильдияр Мураталиев' WHERE id = 'ildiyar-murataliev';

-- Домашний разряд и общий рейтинг пересчитываем: разрядов стало два
UPDATE public.players p
   SET points = COALESCE((SELECT sum(pc.points) FROM public.player_categories pc
                           WHERE pc.player_id = p.id AND pc.closed_at IS NULL), 0)
 WHERE p.id = 'ildiyar-murataliev';

COMMIT;

-- ---- Проверка ----

SELECT p.id, p.name, p.category_id AS разряд, p.points AS общий,
       (SELECT string_agg(pc.category_id || ' ' || pc.points, ', ')
          FROM public.player_categories pc WHERE pc.player_id = p.id) AS по_разрядам,
       (SELECT count(*) FROM public.matches m
         WHERE m.player1_id = p.id OR m.player2_id = p.id) AS матчей
  FROM public.players p
 WHERE p.id IN ('ildiyar-murataliev', 'eldiyar-muratalyev');
-- Ожидаем одну строку: Ильдияр Мураталиев, Masters из файла и матчи ТБШ.

-- ============================================================
-- Двойники: одна карточка на человека
-- ============================================================
--
-- После заливки списка NTRP у шестерых оказалось по две карточки: в списке
-- человек записан одним написанием, в турнирной сетке — другим. Отсюда и
-- расхождения: рейтинг на одной карточке, сыгранные матчи на другой.
--
-- Оставляем ту карточку, при которой матчи и заявки, — её id стоит во всех
-- сетках, и трогать его нельзя. Имя правим на верное, рейтинг забираем со
-- второй карточки, если у оставшейся его нет. Вторую удаляем.
--
--   Рахматулина  — остаётся карточка из сетки, имя «Лилия Рахматулина»,
--                  рейтинг 3.7 / 3.5 переезжает со второй
--   Бондарь      — остаётся карточка клуба «Данил Бондарь», гость уходит
--   Титова       — остаётся карточка клуба, имя правим на «Екатерина Титова»
--                  (в базе была опечатка «Екатериа»), гость уходит
--   Тимирбаева   — остаётся карточка с десятью матчами, рейтинг 3.7 / 3.7
--                  переезжает с «Темирбаевой»
--   Покарел      — остаётся карточка клуба, имя правим на «Света Покарел»
--   Джанибекова  — остаётся карточка клуба с матчами, гость уходит
--
-- Равиль и Рамиль Мифтахутдиновы, Айдай Орозбаева и Айдар Орозбаев, Амир и
-- Аман Канаевы — разные люди, их не трогаем.
--
-- Связи перебираем по самой базе, строку за строкой: где у оставшейся
-- карточки такая запись уже есть (например значок «первый матч»), дубликат
-- убираем, а не переносим.
--
-- Запускать можно повторно.

BEGIN;

DO $$
DECLARE
    пара  record;
    св    record;
    строки tid[];
    стр   tid;
    перенесено int;
    убрано int;
BEGIN
    FOR пара IN
        SELECT * FROM (VALUES
            ('rahmatulina-liliya',     'liliya-rahmatulina',     'Лилия Рахматулина'),
            ('daniil-bondar',          'danil-bondar',           'Данил Бондарь'),
            ('ekaterina-titova',       'ekateria-titova',        'Екатерина Титова'),
            ('natalya-temirbaeva',     'natalya-timirbaeva',     'Наталья Тимирбаева'),
            ('sveta-pokarel',          'sveta-poharel',          'Света Покарел'),
            ('nurzhamal-dzhanybekova', 'nurzhamal-dzhanibekova', 'Нуржамал Джанибекова')
        ) AS t(дубль, цель, имя)
    LOOP
        IF NOT EXISTS (SELECT 1 FROM public.players WHERE id = пара.дубль) THEN
            RAISE NOTICE '% — уже слито', пара.имя;
            CONTINUE;
        END IF;

        -- Рейтинг и счёт: берём со второй карточки то, чего нет у первой
        UPDATE public.players ц
           SET name         = пара.имя,
               ntrp_singles = COALESCE(ц.ntrp_singles, д.ntrp_singles),
               ntrp_doubles = COALESCE(ц.ntrp_doubles, д.ntrp_doubles),
               photo        = COALESCE(ц.photo, д.photo),
               country      = COALESCE(ц.country, д.country),
               wins         = ц.wins + д.wins,
               losses       = ц.losses + д.losses
          FROM public.players д
         WHERE ц.id = пара.цель AND д.id = пара.дубль;

        -- Все ссылки на игрока — со второй карточки на оставшуюся
        FOR св IN
            SELECT c.conrelid::regclass AS таблица, a.attname AS поле
              FROM pg_constraint c
              JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
             WHERE c.contype = 'f'
               AND c.confrelid = 'public.players'::regclass
        LOOP
            EXECUTE format('SELECT array_agg(ctid) FROM %s WHERE %I = %L',
                           св.таблица, св.поле, пара.дубль)
               INTO строки;
            CONTINUE WHEN строки IS NULL;

            перенесено := 0;
            убрано := 0;

            FOREACH стр IN ARRAY строки LOOP
                BEGIN
                    EXECUTE format('UPDATE %s SET %I = %L WHERE ctid = %L',
                                   св.таблица, св.поле, пара.цель, стр);
                    перенесено := перенесено + 1;
                EXCEPTION WHEN unique_violation THEN
                    EXECUTE format('DELETE FROM %s WHERE ctid = %L', св.таблица, стр);
                    убрано := убрано + 1;
                END;
            END LOOP;

            RAISE NOTICE '  %.% — перенесено %, убрано как повтор %',
                         св.таблица, св.поле, перенесено, убрано;
        END LOOP;

        DELETE FROM public.players WHERE id = пара.дубль;
        RAISE NOTICE '% — слито', пара.имя;
    END LOOP;
END $$;

COMMIT;

-- ---- Проверка ----

SELECT p.id, p.name, p.category_id AS разряд,
       p.ntrp_singles AS одиночный, p.ntrp_doubles AS парный,
       p.wins, p.losses,
       (SELECT count(*) FROM public.matches m
         WHERE m.player1_id = p.id OR m.player2_id = p.id) AS матчей
  FROM public.players p
 WHERE p.id IN ('liliya-rahmatulina', 'danil-bondar', 'ekateria-titova',
                'natalya-timirbaeva', 'sveta-poharel', 'nurzhamal-dzhanibekova')
 ORDER BY p.name;
-- Ожидаем шесть строк с верными именами и рейтингами.

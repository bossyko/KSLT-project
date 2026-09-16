-- ============================================================
-- Снести плей-офф одного турнира, оставив группы и их результаты
-- ============================================================
--
-- Нужно, когда сетка плей-офф собралась неверно, а группы доиграны и счета
-- вводить заново незачем. Убираем доп. матчи, все круги плей-офф и матч за
-- третье место. Групповые матчи, заявки и посев не трогаем.
--
-- После этого в админке жмём «Сформировать плей-офф»: группы доиграны, люди
-- известны, и сетка соберётся сразу с живыми парами.
--
-- ВНИМАНИЕ: сыгранные доп. матчи тоже уйдут. В мужском парном Futures и в
-- рейтинговом одиночном их по два — счета придётся ввести заново.
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │  ПОМЕНЯЙТЕ ЗДЕСЬ список турниров — он один на весь файл       │
-- └──────────────────────────────────────────────────────────────┘
--
-- Где взять: в адресе админки после /bracket/
--
-- Запускать можно повторно.

BEGIN;

DO $$
DECLARE
    турниры text[] := ARRAY[                                  -- ← сюда
        'c0a30bae-30ee-4a38-a26a-4c6b339bd695',   -- микст Futures 19.09
        '7094e2bd-02e6-476b-9e0c-efc7bffc8418',   -- мужской парный Futures
        'c6883b98-eaf9-4bc4-a09e-6174f11afb26'    -- рейтинговый одиночный Futures
    ];
    турнир  text;
    св record;
BEGIN
  FOREACH турнир IN ARRAY турниры LOOP
    -- На матч ссылаются живые матчи, ставки зрителей и прочее. Что именно —
    -- спрашиваем у самой базы, чтобы удаление не упёрлось в запрет
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
            'DELETE FROM %s WHERE %I IN (SELECT id FROM public.matches ' ||
            'WHERE tournament_id = $1 AND group_number IS NULL)',
            св.таблица, св.поле) USING турнир;
    END LOOP;

    -- Плей-офф — это всё, что вне групп: доп. матчи, круги, матч за третье
    DELETE FROM public.matches
     WHERE tournament_id = турнир
       AND group_number IS NULL;

    -- Расписание плей-оффа ушло вместе с матчами
    UPDATE public.tournaments
       SET schedule_saved_at    = NULL,
           schedule_notified_at = NULL
     WHERE id = турнир;
  END LOOP;
END $$;

COMMIT;

-- ---- Проверка ----

SELECT t.title AS турнир,
       count(*) FILTER (WHERE m.group_number IS NOT NULL)                  AS матчей_в_группах,
       count(*) FILTER (WHERE m.group_number IS NOT NULL
                          AND m.status = 'completed')                      AS сыграно_в_группах,
       count(*) FILTER (WHERE m.group_number IS NULL)                      AS осталось_плейофф
  FROM public.tournaments t
  LEFT JOIN public.matches m ON m.tournament_id = t.id
 WHERE t.id IN ('c0a30bae-30ee-4a38-a26a-4c6b339bd695',        -- ← и сюда, для проверки
                '7094e2bd-02e6-476b-9e0c-efc7bffc8418',
                'c6883b98-eaf9-4bc4-a09e-6174f11afb26')
 GROUP BY t.title
 ORDER BY t.title;
-- Ожидаем у всех трёх: плей-офф 0, а группы целы —
-- микст 21 из 21, мужской парный 18 из 18, одиночный 39 из 39.

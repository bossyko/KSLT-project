-- ============================================================
-- Микст FUTURES: что осталось после сброса — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Ожидаем: матчей 0, сеяных 0, вне турнира 0, ручных мест
-- нет, регистрация открыта. Заявки на месте — основной состав и очередь.
--
-- Последние три колонки — про то, что сброс не должен был трогать вовсе:
-- правила базы остаются на месте. Ожидаем «на месте» и «включены».

SELECT t.title                                                    AS турнир,
       t.status                                                   AS состояние,
       COALESCE(t.manual_group_places, '{}'::jsonb)                AS ручные_места,
       (SELECT count(*) FROM public.matches m
         WHERE m.tournament_id = t.id)                             AS матчей,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'approved')    AS в_составе,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.status = 'waitlist')    AS в_очереди,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id
           AND r.status IN ('rejected', 'withdrawn', 'blocked'))    AS вне_турнира,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.seed_number IS NOT NULL) AS сеяных,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = t.id AND r.group_number IS NOT NULL) AS с_группой,
       -- Правила базы: сброс их не касается, но проверить дешевле, чем гадать
       (SELECT CASE WHEN count(*) = 4 THEN 'на месте'
                    ELSE 'НЕТ: ' || count(*) || ' из 4' END
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname IN ('fic_заменить_дальше', 'advance_bracket_winner',
                             'fic_итоги', 'fic_закрыть_проходы')
           AND pg_get_functiondef(p.oid) LIKE '%group_number IS NULL%') AS функции_сетки,
       (SELECT CASE WHEN bool_and(tgenabled = 'O') THEN 'включены'
                    ELSE 'ЕСТЬ ВЫКЛЮЧЕННЫЕ' END
          FROM pg_trigger
         WHERE NOT tgisinternal
           AND tgrelid IN ('public.matches'::regclass,
                           'public.tournament_registrations'::regclass)) AS триггеры
  FROM public.tournaments t
 WHERE t.id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

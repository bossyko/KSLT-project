-- ============================================================
-- Микст FUTURES: что осталось после сброса — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Ожидаем: матчей 0, сеяных 0, вне турнира 0, ручных мест
-- нет, регистрация открыта. Заявки на месте — основной состав и очередь.

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
         WHERE r.tournament_id = t.id AND r.group_number IS NOT NULL) AS с_группой
  FROM public.tournaments t
 WHERE t.id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

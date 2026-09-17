-- ============================================================
-- MASTERS: заявки из формы — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Ожидаем 11 заявок в составе, очередь пустая, и три пары
-- с пометкой «нужно решение» — те, что собраны из двоих мужчин.

SELECT row_number() OVER (ORDER BY r.registered_at)          AS nn,
       p1.name || '  +  ' || COALESCE(p2.name, '—')          AS пара,
       COALESCE(p1.gender, '?') || ' + ' || COALESCE(p2.gender, '?') AS пол,
       r.status                                              AS состояние,
       CASE WHEN r.gender_confirmed THEN '' ELSE 'нужно решение' END AS пометка,
       CASE WHEN p1.is_guest OR COALESCE(p2.is_guest, false)
            THEN 'есть гость' ELSE '' END                    AS гости
  FROM public.tournament_registrations r
  JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id = '153bc688-41c3-475a-9b5f-31f2cca1c5c6'
 ORDER BY r.registered_at;

-- Итоги одной строкой
SELECT count(*)                                              AS всего,
       count(*) FILTER (WHERE status = 'approved')           AS в_составе,
       count(*) FILTER (WHERE status = 'waitlist')           AS в_очереди,
       count(*) FILTER (WHERE NOT gender_confirmed)          AS ждут_решения
  FROM public.tournament_registrations
 WHERE tournament_id = '153bc688-41c3-475a-9b5f-31f2cca1c5c6';

-- ПРОВЕРКА КУСКА «ЗАЯВКИ» ПОСЛЕ ВЫКЛАДКИ ФУНКЦИИ.
-- Читаем базу, а не верим ответу «Success».
--
-- ЗАПРОС 1 — где можно проверять: парные турниры с выставленным пределом
-- суммы NTRP, приём заявок открыт.

SELECT t.id,
       t.title,
       t.format,
       t.ntrp_combined_max                               AS predel,
       t.max_participants                                AS setka,
       coalesce(t.reserved_spots, 0)                     AS rezerv,
       t.max_participants - coalesce(t.reserved_spots,0) AS mest_online,
       count(r.id) FILTER (WHERE r.seat_pool = 'online'
                             AND r.status IN ('approved','pending','draw'))  AS zanyato_online,
       count(r.id) FILTER (WHERE r.seat_pool = 'reserved'
                             AND r.status IN ('approved','pending','draw'))  AS zanyato_rezerv,
       count(r.id) FILTER (WHERE r.status = 'waitlist')                      AS v_ocheredi
FROM public.tournaments t
LEFT JOIN public.tournament_registrations r ON r.tournament_id = t.id
WHERE t.format IN ('doubles','mixed_doubles')
  AND t.ntrp_combined_max IS NOT NULL
  AND t.status IN ('upcoming','registration_open','registration_closed')
GROUP BY t.id, t.title, t.format, t.ntrp_combined_max, t.max_participants, t.reserved_spots
ORDER BY t.title;

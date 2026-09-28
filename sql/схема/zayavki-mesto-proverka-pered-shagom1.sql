-- ЗАЯВКИ: что сейчас стоит в основе сверх онлайн-предела.
-- Прогнать ДО шага 1. Молча ничего не проставляю: миграция всем ставит
-- seat_pool='online', и если где-то в основе людей больше, чем «макс − резерв»,
-- это и есть те, кого админ сажал руками на места клуба. Их надо пометить
-- reserved вручную — кто именно, знаешь только ты.
--
-- Пусто в ответе — значит перенос чистый и помечать нечего.

SELECT t.id,
       t.title,
       t.max_participants                                   AS setka,
       coalesce(t.reserved_spots, 0)                        AS rezerv,
       t.max_participants - coalesce(t.reserved_spots, 0)    AS mest_online,
       count(r.id)                                          AS v_osnove,
       count(r.id) - (t.max_participants - coalesce(t.reserved_spots, 0)) AS sverh
FROM public.tournaments t
JOIN public.tournament_registrations r
     ON r.tournament_id = t.id
    AND r.status IN ('approved', 'pending', 'draw')
WHERE t.max_participants > 0
GROUP BY t.id, t.title, t.max_participants, t.reserved_spots
HAVING count(r.id) > t.max_participants - coalesce(t.reserved_spots, 0)
ORDER BY sverh DESC;

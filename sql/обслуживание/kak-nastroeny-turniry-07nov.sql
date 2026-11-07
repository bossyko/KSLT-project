-- ОДИН ЗАПРОС. ТОЛЬКО ЧИТАЕТ. Отдай мне вывод целиком.
--
-- Как настроены два турнира из формы 07.11. По ответу видно, почему
-- десять мужских пар в MASTERS легли с `gender_confirmed = false`:
-- признак считается по формату ТУРНИРА, а не по разнице полов в паре.
--   format = 'mixed_doubles' → пара обязана быть смешанной
--   gender  = 'men'/'women'  → оба игрока того же пола

SELECT  t.id,
        t.title,
        t.category_id,
        t.format,
        t.gender,
        t.status,
        t.max_participants,
        (SELECT count(*) FROM public.tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'approved')        AS v_osnove,
        (SELECT count(*) FROM public.tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'waitlist')        AS v_ozhidanii,
        (SELECT count(*) FROM public.tournament_registrations r
          WHERE r.tournament_id = t.id AND r.gender_confirmed = false)   AS zhdut_resheniya_po_polu
  FROM  public.tournaments t
 WHERE  t.id IN ('abeac952-0736-42d5-8203-51c524b5a715',
                 '064c6018-a3cd-4abb-95e8-ed818274c86a');

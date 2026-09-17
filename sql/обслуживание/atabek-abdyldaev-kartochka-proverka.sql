-- ============================================================
-- Одиночный FUTURES, группа D — ПРОВЕРКА
-- ============================================================
--
-- Только читает. Ожидаем: карточка заведена, заявка на неё ссылается,
-- в группе шесть встреч и в каждой обе стороны заполнены.

SELECT id, name, country, category_id, ntrp_singles, is_guest, is_member
  FROM public.players
 WHERE id = 'atabek-abdyldaev';

SELECT r.id            AS заявка,
       p.name          AS игрок,
       r.is_external   AS внешний,
       r.group_number  AS группа,
       r.status        AS состояние
  FROM public.tournament_registrations r
  LEFT JOIN public.players p ON p.id = r.player_id
 WHERE r.id = '99fa4f43-f44e-4e5d-bd9e-1dcaa0890577';

SELECT m.match_order                                        AS встреча,
       COALESCE(p1.name, '—') || '  vs  ' || COALESCE(p2.name, '—') AS пара,
       m.status                                             AS состояние,
       CASE WHEN m.player1_id IS NULL OR m.player2_id IS NULL
            THEN 'сторона пустая' ELSE '' END               AS замечание
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND m.group_number = 4
 ORDER BY m.match_order;

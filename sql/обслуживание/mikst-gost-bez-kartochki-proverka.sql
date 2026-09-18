-- ============================================================
-- Микст FUTURES: гостья без карточки — ПРОВЕРКА
-- ============================================================
--
-- В группе B четыре пары, а на экране три. Пропала пара Айсулуу Ленаровой:
-- её заявка заведена как гостевая, без карточки игрока. Матч же помнит
-- игрока, а не заявку, и сторона без карточки остаётся пустой — ни в
-- таблице группы, ни в запусках её не видно.
--
-- Показываем три вещи: саму заявку, её матчи и есть ли карточка. Карточка
-- у Айсулуу заводилась под Masters, и если она на месте, правка сводится
-- к тому, чтобы её подставить.
--
-- Запрос читающий, ничего не меняет.

WITH заявка AS (
    SELECT r.id, r.player_id, r.partner_id, r.external_name,
           r.is_external, r.status, r.group_number
      FROM public.tournament_registrations r
     WHERE r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND r.player_id IS NULL
),
матчи AS (
    SELECT m.group_number, m.match_order,
           COALESCE(p1.name, '— пусто —') AS сторона_1,
           COALESCE(p2.name, '— пусто —') AS сторона_2,
           m.status
      FROM public.matches m
      LEFT JOIN public.players p1 ON p1.id = m.player1_id
      LEFT JOIN public.players p2 ON p2.id = m.player2_id
     WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
       AND (m.reg1_id IN (SELECT id FROM заявка)
         OR m.reg2_id IN (SELECT id FROM заявка))
)
SELECT 'заявка'::text AS что,
       з.external_name AS кто,
       'группа ' || з.group_number || ', состояние ' || з.status ||
       ', напарник ' || COALESCE(з.partner_id, '—') AS подробности
  FROM заявка з
UNION ALL
SELECT 'матч', м.сторона_1 || ' vs ' || м.сторона_2,
       'группа ' || м.group_number || ', встреча ' || м.match_order ||
       ', ' || м.status
  FROM матчи м
UNION ALL
SELECT 'карточка', p.name, 'id ' || p.id || ', гость: ' || p.is_guest
  FROM public.players p
 WHERE p.id = 'aysuluu-lenarova'
 ORDER BY 1, 3;

-- Ожидаем: одна заявка без карточки, три её матча с пустой стороной
-- и строка «карточка» — значит подставлять есть что.

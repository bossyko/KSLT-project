-- ============================================================
-- Микст FUTURES: подставить гостье карточку — ПРАВКА
-- ============================================================
--
-- Пара Айсулуу Ленаровой стоит в группе B и в запусках, но на экране её
-- нет: заявка гостевая, без карточки, а матч помнит игрока. Подставляем
-- карточку — ту самую, что заводилась под Masters.
--
-- Жеребьёвку не трогаем: ни группы, ни порядок запусков, ни время, ни
-- корты. Меняется только то, на кого ссылается заявка и три её матча.
--
-- Повторный запуск ничего не испортит: обновляем только пустое.

BEGIN;

-- ---- Карточка на случай, если её нет ----
--
-- Заводилась под Masters. Если уже есть — строка молча пропускается,
-- и ни разряд, ни рейтинг ей не переписываются.
INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES ('aysuluu-lenarova', 'Айсулуу Ленарова', '🇰🇬', 'futures', 'women',
        false, true, false)
ON CONFLICT (id) DO NOTHING;

-- ---- Заявка ----
--
-- Была внешней записью с одним именем, становится обычной заявкой с
-- карточкой. Напарник, состояние, группа и время подачи остаются свои.
UPDATE public.tournament_registrations
   SET player_id     = 'aysuluu-lenarova',
       is_external   = false,
       external_name = NULL
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND external_name = 'Айсулуу Ленарова'
   AND player_id IS NULL;

-- ---- Матчи ----
--
-- Три встречи группы B, где её сторона пустая. Ищем по ссылке на заявку:
-- она проставлена жеребьёвкой и говорит, кто там должен стоять.
UPDATE public.matches m
   SET player1_id = r.player_id
  FROM public.tournament_registrations r
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.reg1_id = r.id
   AND m.player1_id IS NULL
   AND r.player_id IS NOT NULL;

UPDATE public.matches m
   SET player2_id = r.player_id
  FROM public.tournament_registrations r
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.reg2_id = r.id
   AND m.player2_id IS NULL
   AND r.player_id IS NOT NULL;

COMMIT;

-- ---- Проверка ----

SELECT m.group_number AS группа,
       m.match_order  AS встреча,
       COALESCE(p1.name, '— пусто —') AS сторона_1,
       COALESCE(p2.name, '— пусто —') AS сторона_2,
       m.status       AS состояние
  FROM public.matches m
  LEFT JOIN public.players p1 ON p1.id = m.player1_id
  LEFT JOIN public.players p2 ON p2.id = m.player2_id
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.group_number = 2
 ORDER BY m.match_order;

-- Ожидаем: шесть встреч группы B, пустых сторон не осталось.

-- ============================================================
-- Микст FUTURES: вернуть группам их состав — ПРАВКА
-- ============================================================
--
-- Шесть групповых матчей получили чужих игроков: смена победителя в
-- плей-офф переписывала состав по номеру круга, не отличая сетку от
-- групп. Корень вылечен в sql/функции/fic-zameny-tolko-setka.sql —
-- сначала нужно запустить его, иначе следующая правка счёта наделает
-- то же самое заново.
--
-- Гадать, кто где стоял, не нужно: ссылка матча на заявку (reg1_id,
-- reg2_id) цела, а заявка знает своего игрока. Возвращаем его на место.
--
-- Что правим (по проверке от 17.09.2026):
--   группа 1, матч 3  Адхам Убайдуллаев   → Анвар Насыров
--   группа 1, матч 6  Виктория Хан        → Анвар Насыров
--   группа 3, матч 2  Нурсултан Улукбеков → Эрлан Сыдыков
--   группа 3, матч 3  Алина Жакыпова      → Эрлан Сыдыков
--   группа 4, матч 3  Алина Жакыпова      → Нурсултан Улукбеков
--   группа 5, матч 3  Виктория Хан        → Адхам Убайдуллаев
--
-- Счета не трогаем: их вписывали настоящим парам, до подмены. Если
-- победителем записан подменённый игрок, ставим на его место вернувшегося.
--
-- Запускать можно повторно: правятся только расхождения.

BEGIN;

-- Триггер продвижения на время правки снимаем. Он ходит по матчам сам, а
-- нам нужно ровно то, что написано здесь.
ALTER TABLE public.matches DISABLE TRIGGER trg_advance_bracket;

-- ---- Первая сторона ----

UPDATE public.matches m
   SET player1_id = z.player_id,
       winner_id  = CASE WHEN m.winner_id = m.player1_id
                         THEN z.player_id ELSE m.winner_id END
  FROM public.tournament_registrations z
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.group_number IS NOT NULL
   AND z.id = m.reg1_id
   AND m.player1_id IS DISTINCT FROM z.player_id
   AND (z.partner_id IS NULL OR m.player1_id IS DISTINCT FROM z.partner_id);

-- ---- Вторая сторона ----

UPDATE public.matches m
   SET player2_id = z.player_id,
       winner_id  = CASE WHEN m.winner_id = m.player2_id
                         THEN z.player_id ELSE m.winner_id END
  FROM public.tournament_registrations z
 WHERE m.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND m.group_number IS NOT NULL
   AND z.id = m.reg2_id
   AND m.player2_id IS DISTINCT FROM z.player_id
   AND (z.partner_id IS NULL OR m.player2_id IS DISTINCT FROM z.partner_id);

ALTER TABLE public.matches ENABLE TRIGGER trg_advance_bracket;

COMMIT;

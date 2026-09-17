-- ============================================================
-- Микст FUTURES: состав после правки — ПРОВЕРКА
-- ============================================================
--
-- Только читает, один запрос. Ожидаем 22 пары в составе и 6 заявок в
-- очереди; у Виктории Хан, Бекжана Кылычбекова, Леонида Цоя и Табалдиевой
-- напарника нет — так в файле.

SELECT CASE r.status WHEN 'approved' THEN '1 состав'
                     WHEN 'waitlist' THEN '2 очередь'
                     ELSE '3 ' || r.status END            AS раздел,
       row_number() OVER (PARTITION BY r.status ORDER BY r.registered_at) AS nn,
       p1.name                                            AS подал,
       COALESCE(p2.name, '—')                             AS напарник,
       COALESCE(r.group_number::text, '—')                AS группа,
       to_char(r.registered_at, 'DD.MM HH24:MI')          AS подана
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
 ORDER BY раздел, r.registered_at;

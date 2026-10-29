-- ОДИН ЗАПРОС, ОДНА ТАБЛИЦА. Supabase показывает только последний
-- результат — поэтому все проверки сведены в UNION ALL.
WITH ц AS (
  SELECT id FROM tournaments
   WHERE format = 'doubles' AND gender = 'men'
     AND title ILIKE '%дружеск%' AND date_start >= DATE '2026-10-25'
), з AS (
  SELECT r.*, p.name AS имя1, p2.name AS имя2
    FROM tournament_registrations r
    JOIN ц ON ц.id = r.tournament_id
    LEFT JOIN players p  ON p.id  = r.player_id
    LEFT JOIN players p2 ON p2.id = r.partner_id
)
SELECT * FROM (
  SELECT 1 AS раз, 0 AS ряд, 'ТУРНИРОВ ПОЙМАНО: ' || (SELECT count(*) FROM ц)::text AS строка
  UNION ALL
  SELECT 2, 0, 'ВСЕГО ЗАЯВОК: ' || (SELECT count(*) FROM з)::text
  UNION ALL
  SELECT 3, 0, 'ЖДЁМ approved 22 / waitlist 4 — ВЫШЛО: ' ||
         coalesce((SELECT string_agg(s.status || ' ' || s.c::text, ', ' ORDER BY s.status)
                     FROM (SELECT status, count(*) c FROM з GROUP BY status) s), 'ПУСТО')
  UNION ALL
  SELECT 4, row_number() OVER (ORDER BY registered_at),
         'СЕТКА ' || lpad(row_number() OVER (ORDER BY registered_at)::text, 2, ' ') ||
         '. ' || coalesce(имя1, '?') || ' / ' || coalesce(имя2, '?') ||
         '   ' || to_char(registered_at, 'DD.MM HH24:MI:SS')
    FROM з WHERE status = 'approved'
  UNION ALL
  SELECT 5, row_number() OVER (ORDER BY queue_at),
         'ОЧЕРЕДЬ ' || row_number() OVER (ORDER BY queue_at)::text ||
         '. ' || coalesce(имя1, '?') || ' / ' || coalesce(имя2, '?') ||
         '   ' || to_char(queue_at, 'DD.MM HH24:MI:SS')
    FROM з WHERE status = 'waitlist'
  UNION ALL
  SELECT 6, 0, 'ПОЛ ПАРЫ ПОДТВЕРЖДЁН (ждём 26 true): ' ||
         coalesce((SELECT string_agg(coalesce(gender_confirmed::text,'null') || ' ' || c::text, ', ')
                     FROM (SELECT gender_confirmed, count(*) c FROM з GROUP BY gender_confirmed) g), '—')
  UNION ALL
  SELECT 7, 0, 'КТО СТОИТ ДВАЖДЫ (ждём «нет»): ' ||
         coalesce((SELECT string_agg(кто || ' ×' || c::text, ', ') FROM (
                    SELECT кто, count(*) c FROM (
                      SELECT player_id AS кто FROM з
                      UNION ALL SELECT partner_id FROM з WHERE partner_id IS NOT NULL) y
                     GROUP BY кто HAVING count(*) > 1) z), 'нет')
  UNION ALL
  SELECT 8, 0, 'КАРТОЧКА БЕКА: ' ||
         coalesce((SELECT string_agg(id || ' = ' || name, ', ') FROM players
                    WHERE lower(translate(name,'ёЁ','ее')) LIKE '%кыдыргыч%'), 'НЕТ')
  UNION ALL
  SELECT 9, 0, 'БЕК В ЗАЯВКЕ: ' ||
         coalesce((SELECT string_agg(coalesce(имя1,'?') || ' / ' || coalesce(имя2,'?'), ', ')
                     FROM з WHERE lower(translate(coalesce(имя1,'')||coalesce(имя2,''),'ёЁ','ее'))
                                  LIKE '%кыдыргыч%'), 'НЕ НАШЁЛСЯ')
) x ORDER BY раз, ряд;

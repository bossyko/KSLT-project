-- ============================================
-- Очистка заявок игрока ivan-ivanov (тестовые данные)
-- Запускать в Supabase SQL Editor по шагам, не целиком.
-- ============================================
--
-- Удаляются только заявки на несыгранные турниры. Заявка на сыгранный
-- «Тестовый турнир (Match Notify)» остаётся: игрок стоял в сетке
-- (draw_position = 2), по нему есть матч и 9 очков в rating_history.
-- Если снести и её, история разъедется с рейтингом.

-- ---- ШАГ 1. Посмотреть, что удалится ----
SELECT r.id, r.status, r.draw_position, t.title, t.status AS tournament_status
FROM tournament_registrations r
JOIN tournaments t ON t.id = r.tournament_id
WHERE r.player_id = 'ivan-ivanov'
  AND t.status IN ('registration_open', 'registration_closed', 'upcoming')
ORDER BY t.date_start;

-- Ожидаемые 4 строки:
--   waitlist   KSLT Demo Cup — Challenger
--   rejected   KSLT Masters Open — FIC
--   rejected   Проверка турнира и его функционала
--   withdrawn  ТЕСТ допуска — Masters мужской одиночный

-- ---- ШАГ 2. Удалить ----
-- Выполнять, только если ШАГ 1 показал ровно то, что ожидалось.
DELETE FROM tournament_registrations r
USING tournaments t
WHERE t.id = r.tournament_id
  AND r.player_id = 'ivan-ivanov'
  AND t.status IN ('registration_open', 'registration_closed', 'upcoming');

-- ---- ШАГ 3. Проверить, что осталось ----
SELECT r.id, r.status, t.title, t.status AS tournament_status
FROM tournament_registrations r
JOIN tournaments t ON t.id = r.tournament_id
WHERE r.player_id = 'ivan-ivanov';

-- Должна остаться одна строка — сыгранный «Тестовый турнир (Match Notify)».

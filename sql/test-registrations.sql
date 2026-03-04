-- Тестовые регистрации для турнира "Какашки атакуют"
-- 25 игроков: первые 16 (по времени) → approved, остальные 9 → pending (waitlist)
-- Принцип: кто первый зарегистрировался — тот играет

-- Очистить предыдущие регистрации для этого турнира
DELETE FROM tournament_registrations
WHERE tournament_id = '2209807f-ad48-4bbd-80fa-f0121d616381';

-- Вставить 25 регистраций — время регистрации с интервалом 15-45 мин
WITH random_players AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) AS rn
  FROM players
  LIMIT 25
)
INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number, registered_at)
SELECT
  '2209807f-ad48-4bbd-80fa-f0121d616381',
  id,
  CASE WHEN rn <= 16 THEN 'approved' ELSE 'pending' END,
  NULL,  -- без посева, посев назначается позже вручную
  -- Имитация: регистрация открылась 01.03.2026 10:00, каждый следующий +15..45 мин
  '2026-03-01 10:00:00+06'::timestamptz + (interval '1 minute' * (rn - 1) * 25)
FROM random_players;

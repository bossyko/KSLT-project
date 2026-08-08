-- ============================================
-- Турниры для проверки правил допуска (#6 / #30)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- На старых турнирах правило не проверить: заявки там заведены заранее и уже
-- одобрены. Нужны чистые, с открытой регистрацией и без единой заявки.
--
-- Категории от сильных к слабым: Pro-Masters, Masters, Tour, Challenger, Futures.
-- Проверяем на игроке категории Masters (Ivan Ivanov):
--
--   Pro-Masters  — на ступень выше  → пускает по месту в рейтинге Masters
--   Masters      — своя категория   → пускает сразу
--   Tour         — на ступень ниже  → отказ
--   Challenger   — на две ниже      → отказ
--
-- Все мужские одиночные, чтобы категория действительно проверялась: в парных
-- и в Friendly она не смотрится вовсе.

INSERT INTO tournaments (
  id, title, title_en, description,
  date_start, date_end, location,
  category_id, status, format, gender,
  max_participants, reserved_spots, court_count, match_duration,
  registration_start, registration_end, published_at
) VALUES
  ('test-admit-promasters', 'ПРОВЕРКА допуска — Pro-Masters мужской одиночный', 'ADMISSION test — Pro-Masters men singles',
   'Ступень выше Masters: игрок Masters должен проходить по месту в рейтинге.',
   '2026-10-05', '2026-10-06', 'Бишкек',
   'promasters', 'registration_open', 'singles', 'men',
   16, 0, 2, 90, CURRENT_DATE, '2026-10-01', now()),

  ('test-admit-tour', 'ПРОВЕРКА допуска — Tour мужской одиночный', 'ADMISSION test — Tour men singles',
   'Ступень ниже Masters: игрок Masters проходить не должен.',
   '2026-10-12', '2026-10-13', 'Бишкек',
   'tour', 'registration_open', 'singles', 'men',
   16, 0, 2, 90, CURRENT_DATE, '2026-10-08', now()),

  ('test-admit-challenger', 'ПРОВЕРКА допуска — Challenger мужской одиночный', 'ADMISSION test — Challenger men singles',
   'Две ступени ниже Masters: игрок Masters проходить не должен.',
   '2026-10-19', '2026-10-20', 'Бишкек',
   'challenger', 'registration_open', 'singles', 'men',
   16, 0, 2, 90, CURRENT_DATE, '2026-10-15', now())
ON CONFLICT (id) DO NOTHING;

-- Проверка: три турнира на месте, заявок нет
SELECT t.id, t.title, t.category_id, t.status,
       (SELECT count(*) FROM tournament_registrations r WHERE r.tournament_id = t.id) AS заявок
FROM tournaments t
WHERE t.id LIKE 'test-admit-%'
ORDER BY t.date_start;

-- ---- Как убрать после проверки ----
-- DELETE FROM tournament_registrations WHERE tournament_id LIKE 'test-admit-%';
-- DELETE FROM tournaments WHERE id LIKE 'test-admit-%';

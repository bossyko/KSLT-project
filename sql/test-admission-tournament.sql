-- ============================================
-- KSLT — тестовый турнир под правила допуска (#5)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Турнир категории Masters, сетка на 6 мест и заполнена полностью:
--   4 игрока Masters (своя категория) + 2 игрока Tour из первой десятки.
--
-- Так проверяется вытеснение: когда заявку подаёт игрок категории турнира,
-- из сетки в лист ожидания уезжает игрок НИЖНЕЙ категории с самым поздним
-- временем подачи — то есть один из двух Tour. Поэтому Tour записаны позже.
--
-- Игрок аккаунта bossyko@gmail.com в заливку не попадает: заявку он подаёт
-- сам через сайт, чтобы видеть настоящую работу правил.

-- 1. Пересоздаём турнир
DELETE FROM tournament_registrations WHERE tournament_id = 'test-dopusk-masters';
DELETE FROM tournaments WHERE id = 'test-dopusk-masters';

INSERT INTO tournaments (
    id, title, title_en, description, location,
    category_id, gender, format, status,
    registration_start, registration_end,
    date_start, date_end,
    max_participants, reserved_spots,
    published_at
) VALUES (
    'test-dopusk-masters',
    'ТЕСТ допуска — Masters мужской одиночный',
    'TEST admission — Masters men singles',
    'Тестовый турнир: заявки заведены по всем веткам правил допуска, сетка заполнена.',
    'Бишкек',
    'masters', 'men', 'singles', 'registration_open',
    '2026-08-01', '2026-09-10',
    '2026-09-15', '2026-09-16',
    6, 0,
    now()
);

-- 2. Место игрока внутри своей категории, без твоего аккаунта
WITH ranked AS (
    SELECT id, name, category_id,
           row_number() OVER (PARTITION BY category_id ORDER BY points DESC) AS место
    FROM players
    WHERE gender = 'men'
),
pool AS (
    SELECT * FROM ranked
    WHERE id <> COALESCE((SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com'), '—')
)

INSERT INTO tournament_registrations (tournament_id, player_id, status, block_reason, registered_at)

-- Своя категория Masters → основная сетка. Записаны раньше всех.
SELECT 'test-dopusk-masters', id, 'approved', NULL, now() - interval '3 hours'
FROM pool WHERE category_id = 'masters' AND место <= 4

UNION ALL
-- Tour, место 1-2 → основная сетка автоматом. Записаны позже — их и вытеснит.
SELECT 'test-dopusk-masters', id, 'approved', NULL, now() - interval '1 hour'
FROM pool WHERE category_id = 'tour' AND место <= 2

UNION ALL
-- Tour, места 11-20 → лист ожидания
SELECT 'test-dopusk-masters', id, 'waitlist', NULL, now() - interval '2 hours'
FROM pool WHERE category_id = 'tour' AND место BETWEEN 11 AND 12

UNION ALL
-- Tour, места 21+ → заблокирована по рейтингу.
-- Подзапрос нужен, потому что ORDER BY в конце UNION относился бы ко всему
-- объединению, а колонки «место» в его результате уже нет.
SELECT 'test-dopusk-masters', low.id, 'blocked',
       'Турнир категории Masters. Принимаются первые 20 рейтинга Tour, место игрока — ' || low.место || '.',
       now() - interval '2 hours'
FROM (
    SELECT id, место FROM pool
    WHERE category_id = 'tour' AND место >= 21
    ORDER BY место LIMIT 2
) low;

-- Pro-Masters → категория выше турнирной
INSERT INTO tournament_registrations (tournament_id, player_id, status, block_reason, registered_at)
SELECT 'test-dopusk-masters', id, 'blocked',
       'Турнир категории Masters. Игрок категории Pro-Masters — участие в турнирах категорией ниже не допускается.',
       now() - interval '2 hours'
FROM players
WHERE gender = 'men' AND category_id = 'promasters'
  AND id <> COALESCE((SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com'), '—')
ORDER BY points DESC LIMIT 2;

-- Challenger → две ступени ниже
INSERT INTO tournament_registrations (tournament_id, player_id, status, block_reason, registered_at)
SELECT 'test-dopusk-masters', id, 'blocked',
       'Турнир категории Masters. Категория Challenger ниже допустимой — принимаются только на одну ступень ниже.',
       now() - interval '2 hours'
FROM players
WHERE gender = 'men' AND category_id = 'challenger'
  AND id <> COALESCE((SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com'), '—')
ORDER BY points DESC LIMIT 2;

-- Отклонена администратором и отозвана игроком — берём Masters ниже пятого места
INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at)
SELECT 'test-dopusk-masters', id, 'rejected', now() - interval '4 hours'
FROM players
WHERE gender = 'men' AND category_id = 'masters'
  AND id NOT IN (SELECT player_id FROM tournament_registrations WHERE tournament_id = 'test-dopusk-masters')
  AND id <> COALESCE((SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com'), '—')
ORDER BY points DESC LIMIT 1;

INSERT INTO tournament_registrations (tournament_id, player_id, status, registered_at)
SELECT 'test-dopusk-masters', id, 'withdrawn', now() - interval '4 hours'
FROM players
WHERE gender = 'men' AND category_id = 'masters'
  AND id NOT IN (SELECT player_id FROM tournament_registrations WHERE tournament_id = 'test-dopusk-masters')
  AND id <> COALESCE((SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com'), '—')
ORDER BY points DESC LIMIT 1;

-- 3. Отчёт: разделы + сколько мужчин есть в каждой категории
SELECT 'ЗАЯВКИ: ' || r.status AS строка,
       count(*) AS сколько,
       string_agg(p.name || ' [' || p.category_id || ']', ', ' ORDER BY p.name) AS кто
FROM tournament_registrations r
JOIN players p ON p.id = r.player_id
WHERE r.tournament_id = 'test-dopusk-masters'
GROUP BY r.status

UNION ALL

SELECT 'мужчин в категории ' || category_id, count(*), NULL
FROM players
WHERE gender = 'men' AND category_id IS NOT NULL
GROUP BY category_id
ORDER BY 1;

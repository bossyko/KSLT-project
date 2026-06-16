-- ============================================
-- TEST: Match Notify — Проверка и подготовка
-- ============================================
-- Запускать по частям в Supabase SQL Editor

-- ============================================
-- ШАГ 1: Кто из игроков имеет Telegram?
-- ============================================
SELECT p.id   AS player_id,
       p.name AS player_name,
       pr.telegram_chat_id,
       pr.email
FROM players p
         JOIN profiles pr ON pr.player_id = p.id
WHERE pr.telegram_chat_id IS NOT NULL
ORDER BY p.name;

-- ============================================
-- ШАГ 2: Сколько всего игроков с профилями?
-- ============================================
SELECT p.id   AS player_id,
       p.name AS player_name,
       pr.telegram_chat_id,
       pr.email
FROM players p
         JOIN profiles pr ON pr.player_id = p.id
ORDER BY p.name LIMIT 20;

-- ============================================
-- ШАГ 3: Создать тестовый турнир (после проверки шагов 1-2)
-- ============================================
-- Раскомментировать и подставить реальные значения:

INSERT INTO tournaments (
    title, title_en, status, bracket_type, draw_size,
    date_start, date_end, registration_start, registration_end,
    max_participants, court_count, match_duration,
    category_id, level_id
) VALUES (
    'Тестовый турнир (Match Notify)',
    'Test Tournament (Match Notify)',
    'registration_open',
    'single_elimination',
    8,
    CURRENT_DATE,           -- сегодня
    CURRENT_DATE,           -- сегодня
    CURRENT_DATE - 1,       -- регистрация вчера
    CURRENT_DATE,           -- регистрация до сегодня
    8,
    2,                      -- 2 корта
    60,                     -- 60 мин на матч
    NULL,                   -- подставить category_id
    NULL                    -- подставить level_id
)
RETURNING id, title;


-- ============================================
-- ШАГ 4: Добавить 8 игроков в турнир (после создания)
-- ============================================
-- Подставить tournament_id из шага 3 и player_id из шагов 1-2

INSERT INTO tournament_registrations (tournament_id, player_id, status)
VALUES
    ('TOURNAMENT_ID', PLAYER_1_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_2_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_3_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_4_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_5_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_6_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_7_ID, 'approved'),
    ('TOURNAMENT_ID', PLAYER_8_ID, 'approved');

-- ============================================
-- ШАГ 5: После генерации сетки и расписания в админке,
-- обновить scheduled_day и scheduled_time на "сейчас + 10 мин"
-- чтобы протестировать auto-notify
-- ============================================
/*
-- Посмотреть матчи турнира:
SELECT id, player1_id, player2_id, scheduled_time, scheduled_day, court, status, notified_at
FROM matches
WHERE tournament_id = 'TOURNAMENT_ID'
ORDER BY scheduled_time;

-- Обновить время на "через 10 минут" (Бишкек UTC+6):
UPDATE matches
SET
    scheduled_day = CURRENT_DATE,
    scheduled_time = TO_CHAR((NOW() AT TIME ZONE 'Asia/Bishkek') + INTERVAL '10 minutes', 'HH24:MI'),
    notified_at = NULL
WHERE tournament_id = 'TOURNAMENT_ID'
AND round_number = 1;
*/

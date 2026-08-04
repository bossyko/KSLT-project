-- ============================================
-- KSLT — проверка двух категорий у игрока (#7)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Ivan Ivanov относится к Masters. Даём ему результат в турнире Tour —
-- то есть он сыграл в другой категории. После этого у него должно стать
-- ДВЕ строки в player_categories: Masters со своими очками и Tour с новыми.
--
-- Так же это работает и в жизни: очки идут в категорию турнира, а не игрока.

-- 1. Тестовый турнир категории Tour, уже завершённый
DELETE FROM rating_history WHERE tournament_id = 'test-two-cats-tour';
DELETE FROM tournaments WHERE id = 'test-two-cats-tour';

INSERT INTO tournaments (
    id, title, title_en, description, location,
    category_id, gender, format, status,
    date_start, date_end, max_participants,
    published_at
) VALUES (
    'test-two-cats-tour',
    'ТЕСТ второй категории — Tour мужской одиночный',
    'TEST second category — Tour men singles',
    'Тестовый турнир: проверяем, что игрок Masters получает очки в категории Tour.',
    'Бишкек',
    'tour', 'men', 'singles', 'completed',
    '2026-07-10', '2026-07-11', 16,
    now()
);

-- 2. Результат Ivan Ivanov в этом турнире: 150 очков
INSERT INTO rating_history (player_id, tournament_id, tournament_name, category_id, points_earned, recorded_at)
SELECT pr.player_id, 'test-two-cats-tour',
       'ТЕСТ второй категории — Tour мужской одиночный',
       'tour', 150, '2026-07-10'
FROM profiles pr
WHERE pr.email = 'bossyko@gmail.com' AND pr.player_id IS NOT NULL;

-- 3. Пересчёт категорий для него — то же самое делает завершение турнира
SELECT recalc_player_categories(ARRAY(
    SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com' AND player_id IS NOT NULL
));

-- 4. players.points — очки домашней категории, обновляем вручную,
--    потому что здесь мы не проходим через админку
UPDATE players p
SET points = COALESCE((
    SELECT pc.points FROM player_categories pc
    WHERE pc.player_id = p.id AND pc.category_id = p.category_id
), 0)
WHERE p.id = (SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com');

-- 5. Результат
SELECT pl.name,
       pl.category_id AS домашняя,
       pl.points AS очки_домашней,
       pc.category_id AS категория,
       pc.points AS очки
FROM player_categories pc
JOIN players pl ON pl.id = pc.player_id
WHERE pc.player_id = (SELECT player_id FROM profiles WHERE email = 'bossyko@gmail.com')
ORDER BY pc.points DESC;

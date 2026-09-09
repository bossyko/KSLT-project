-- ============================================================
-- Перенос турнира: ТБШ Futures 2026 (женский)
-- ============================================================
--
-- Турнир идёт по таблице ТБШ, а на сайте его нет. Заводится черновиком:
-- не опубликован, виден только в админке. Обложку и описание добавит
-- менеджер.
--
-- Переносим участников с посевами и пары первого круга, как в таблице.
-- Дальше ничего не заполняем: остальные круги пустые, счета проставит
-- менеджер. Так база сама разведёт людей по веткам своим правилом, и
-- перенос не зависит от того, как в таблице нарисованы дальние круги.
--
-- Сетка «все места» строится на степень двойки: 32 слотов при 29
-- участниках, 3 мест пустуют — в таблице они отмечены номером без имени.
-- Сеяным с проходом победителя не проставляем: это сделает менеджер.
--
-- Расстановка взята из таблицы как есть, жеребьёвка не запускается: турнир
-- уже сыгран наполовину, и посевы менять нельзя.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-futures-women-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-futures-women-2026';
DELETE FROM tournaments WHERE id = 'tbsh-futures-women-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-futures-women-2026',
    'ТБШ Futures 2026 (женский)',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'futures', 'women', 'singles',
    'fic', 32, 32, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-futures-women-2026', 'asel-orokova', 'approved', 1),
    ('tbsh-futures-women-2026', 'ayzat-torobekova', 'approved', 17),
    ('tbsh-futures-women-2026', 'tatyana-mashenskaya', 'approved', 16),
    ('tbsh-futures-women-2026', 'nailya-osmonova', 'approved', 9),
    ('tbsh-futures-women-2026', 'burul-rakisheva', 'approved', 24),
    ('tbsh-futures-women-2026', 'ekaterina-saveleva', 'approved', 25),
    ('tbsh-futures-women-2026', 'zuhra-muralieva', 'approved', 8),
    ('tbsh-futures-women-2026', 'aliya-abaskanova', 'approved', 5),
    ('tbsh-futures-women-2026', 'tolgonay-aytkulova', 'approved', 28),
    ('tbsh-futures-women-2026', 'asel-abdygulova', 'approved', 21),
    ('tbsh-futures-women-2026', 'yrysgul-sakebaeva', 'approved', 12),
    ('tbsh-futures-women-2026', 'sonya-orokova', 'approved', 13),
    ('tbsh-futures-women-2026', 'erkaim-shambetova', 'approved', 20),
    ('tbsh-futures-women-2026', 'ayday-akmatalieva', 'approved', 29),
    ('tbsh-futures-women-2026', 'diana-imanahunova', 'approved', 4),
    ('tbsh-futures-women-2026', 'kasiet-samsalieva', 'approved', 3),
    ('tbsh-futures-women-2026', 'kanyshay-badretdinova', 'approved', 19),
    ('tbsh-futures-women-2026', 'aysuluu-erkulova', 'approved', 14),
    ('tbsh-futures-women-2026', 'asel-ashimova', 'approved', 11),
    ('tbsh-futures-women-2026', 'nargiza-sakebaeva', 'approved', 22),
    ('tbsh-futures-women-2026', 'ramina-ushur', 'approved', 27),
    ('tbsh-futures-women-2026', 'aida-nogoybaeva', 'approved', 6),
    ('tbsh-futures-women-2026', 'aleksandra-panfilova', 'approved', 7),
    ('tbsh-futures-women-2026', 'tahmina-gaparova', 'approved', 26),
    ('tbsh-futures-women-2026', 'dana-kurmanalieva', 'approved', 23),
    ('tbsh-futures-women-2026', 'viktoriya-han', 'approved', 10),
    ('tbsh-futures-women-2026', 'saykal-niyazova', 'approved', 15),
    ('tbsh-futures-women-2026', 'narmina-ahmatova', 'approved', 18),
    ('tbsh-futures-women-2026', 'kanykey-tursunbaeva', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 1, 'asel-orokova', NULL, 1, NULL, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 2, 'ayzat-torobekova', 'tatyana-mashenskaya', 17, 16, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 3, 'nailya-osmonova', 'burul-rakisheva', 9, 24, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 4, 'ekaterina-saveleva', 'zuhra-muralieva', 25, 8, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 5, 'aliya-abaskanova', 'tolgonay-aytkulova', 5, 28, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 6, 'asel-abdygulova', 'yrysgul-sakebaeva', 21, 12, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 7, 'sonya-orokova', 'erkaim-shambetova', 13, 20, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 8, 'ayday-akmatalieva', 'diana-imanahunova', 29, 4, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 9, 'kasiet-samsalieva', NULL, 3, NULL, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 10, 'kanyshay-badretdinova', 'aysuluu-erkulova', 19, 14, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 11, 'asel-ashimova', 'nargiza-sakebaeva', 11, 22, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 12, 'ramina-ushur', 'aida-nogoybaeva', 27, 6, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 13, 'aleksandra-panfilova', 'tahmina-gaparova', 7, 26, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 14, 'dana-kurmanalieva', 'viktoriya-han', 23, 10, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 15, 'saykal-niyazova', 'narmina-ahmatova', 15, 18, 'upcoming'),
    ('tbsh-futures-women-2026', 'FIC-R1', 1, 16, 'kanykey-tursunbaeva', NULL, 2, NULL, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-futures-women-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-futures-women-2026'
 GROUP BY round_number ORDER BY round_number;

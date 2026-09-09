-- ============================================================
-- Перенос турнира: ТБШ Masters 2026
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
-- Сетка «все места» строится на степень двойки: 32 слотов при 32
-- участниках, 0 мест пустуют — в таблице они отмечены номером без имени.
-- Сеяным с проходом победителя не проставляем: это сделает менеджер.
--
-- Расстановка взята из таблицы как есть, жеребьёвка не запускается: турнир
-- уже сыгран наполовину, и посевы менять нельзя.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-masters-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-masters-2026';
DELETE FROM tournaments WHERE id = 'tbsh-masters-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-masters-2026',
    'ТБШ Masters 2026',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'masters', 'men', 'singles',
    'fic', 32, 32, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-masters-2026', 'rashid-seyitov', 'approved', 1),
    ('tbsh-masters-2026', 'anvar-askarov', 'approved', 32),
    ('tbsh-masters-2026', 'igor-hanganu', 'approved', 17),
    ('tbsh-masters-2026', 'iskender-kurmanov', 'approved', 16),
    ('tbsh-masters-2026', 'erbol-kylychev', 'approved', 9),
    ('tbsh-masters-2026', 'aydar-usmanov', 'approved', 24),
    ('tbsh-masters-2026', 'zakir-gudadzhanov', 'approved', 25),
    ('tbsh-masters-2026', 'konstantin-lazarev', 'approved', 8),
    ('tbsh-masters-2026', 'ravil-miftahutdinov', 'approved', 5),
    ('tbsh-masters-2026', 'ravil-rahmatulin', 'approved', 28),
    ('tbsh-masters-2026', 'hamit-karaketov', 'approved', 21),
    ('tbsh-masters-2026', 'zakir-nazarov', 'approved', 12),
    ('tbsh-masters-2026', 'murat-noruzbaev', 'approved', 13),
    ('tbsh-masters-2026', 'iskender-seydimatov', 'approved', 20),
    ('tbsh-masters-2026', 'dmitriy-bondarev', 'approved', 29),
    ('tbsh-masters-2026', 'ulugbek-salymbekov', 'approved', 4),
    ('tbsh-masters-2026', 'furkat-sadykov', 'approved', 3),
    ('tbsh-masters-2026', 'sergey-sokolov', 'approved', 30),
    ('tbsh-masters-2026', 'azamat-dzhumabaev', 'approved', 19),
    ('tbsh-masters-2026', 'erlan-sydykov', 'approved', 14),
    ('tbsh-masters-2026', 'abdikiim-mahmutov', 'approved', 11),
    ('tbsh-masters-2026', 'ivan-korabelnikov', 'approved', 22),
    ('tbsh-masters-2026', 'ilya-velikorodnyy', 'approved', 27),
    ('tbsh-masters-2026', 'roman-gudi', 'approved', 6),
    ('tbsh-masters-2026', 'azim-isakov', 'approved', 7),
    ('tbsh-masters-2026', 'alymbek-orokov', 'approved', 26),
    ('tbsh-masters-2026', 'ernest-takirov', 'approved', 23),
    ('tbsh-masters-2026', 'yura-yun', 'approved', 10),
    ('tbsh-masters-2026', 'vladislav-kim', 'approved', 15),
    ('tbsh-masters-2026', 'daniyar-atahanov', 'approved', 18),
    ('tbsh-masters-2026', 'avtandil-ernest', 'approved', 31),
    ('tbsh-masters-2026', 'ramil-miftahutdinov', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-masters-2026', 'FIC-R1', 1, 1, 'rashid-seyitov', 'anvar-askarov', 1, 32, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 2, 'igor-hanganu', 'iskender-kurmanov', 17, 16, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 3, 'erbol-kylychev', 'aydar-usmanov', 9, 24, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 4, 'zakir-gudadzhanov', 'konstantin-lazarev', 25, 8, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 5, 'ravil-miftahutdinov', 'ravil-rahmatulin', 5, 28, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 6, 'hamit-karaketov', 'zakir-nazarov', 21, 12, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 7, 'murat-noruzbaev', 'iskender-seydimatov', 13, 20, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 8, 'dmitriy-bondarev', 'ulugbek-salymbekov', 29, 4, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 9, 'furkat-sadykov', 'sergey-sokolov', 3, 30, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 10, 'azamat-dzhumabaev', 'erlan-sydykov', 19, 14, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 11, 'abdikiim-mahmutov', 'ivan-korabelnikov', 11, 22, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 12, 'ilya-velikorodnyy', 'roman-gudi', 27, 6, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 13, 'azim-isakov', 'alymbek-orokov', 7, 26, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 14, 'ernest-takirov', 'yura-yun', 23, 10, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 15, 'vladislav-kim', 'daniyar-atahanov', 15, 18, 'upcoming'),
    ('tbsh-masters-2026', 'FIC-R1', 1, 16, 'avtandil-ernest', 'ramil-miftahutdinov', 31, 2, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-masters-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-masters-2026'
 GROUP BY round_number ORDER BY round_number;

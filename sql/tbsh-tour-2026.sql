-- ============================================================
-- Перенос турнира: ТБШ Tour 2026
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

DELETE FROM matches WHERE tournament_id = 'tbsh-tour-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-tour-2026';
DELETE FROM tournaments WHERE id = 'tbsh-tour-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-tour-2026',
    'ТБШ Tour 2026',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'tour', 'men', 'singles',
    'fic', 32, 32, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-tour-2026', 'vladislav-kim', 'approved', 1),
    ('tbsh-tour-2026', 'sardar-umarov', 'approved', 32),
    ('tbsh-tour-2026', 'amir-bazhanov', 'approved', 17),
    ('tbsh-tour-2026', 'denis-li', 'approved', 16),
    ('tbsh-tour-2026', 'temirbek-musaev', 'approved', 9),
    ('tbsh-tour-2026', 'ruslan-kalimov', 'approved', 24),
    ('tbsh-tour-2026', 'mirbek-dyushenaliev', 'approved', 25),
    ('tbsh-tour-2026', 'ulukbek-bekbosunov', 'approved', 8),
    ('tbsh-tour-2026', 'alymbek-orokov', 'approved', 5),
    ('tbsh-tour-2026', 'igor-hanganu', 'approved', 28),
    ('tbsh-tour-2026', 'edil-dzhanybekov', 'approved', 21),
    ('tbsh-tour-2026', 'ilzat-husainov', 'approved', 12),
    ('tbsh-tour-2026', 'kadyrbek-adiev', 'approved', 13),
    ('tbsh-tour-2026', 'eldiyar-boruev', 'approved', 20),
    ('tbsh-tour-2026', 'syngyz-ismatov', 'approved', 29),
    ('tbsh-tour-2026', 'ernest-takirov', 'approved', 4),
    ('tbsh-tour-2026', 'zakir-nazarov', 'approved', 3),
    ('tbsh-tour-2026', 'baatyr-bakytbek', 'approved', 30),
    ('tbsh-tour-2026', 'erkin-kerimbaev', 'approved', 19),
    ('tbsh-tour-2026', 'yaroslav-mironov', 'approved', 14),
    ('tbsh-tour-2026', 'ivan-korabelnikov', 'approved', 11),
    ('tbsh-tour-2026', 'iskender-seydimatov', 'approved', 22),
    ('tbsh-tour-2026', 'aydar-usmanov', 'approved', 27),
    ('tbsh-tour-2026', 'esen-azimov', 'approved', 6),
    ('tbsh-tour-2026', 'murat-noruzbaev', 'approved', 7),
    ('tbsh-tour-2026', 'baatyr-akimaliev', 'approved', 26),
    ('tbsh-tour-2026', 'abdikiim-mahmutov', 'approved', 23),
    ('tbsh-tour-2026', 'bek-kydyrgychov', 'approved', 10),
    ('tbsh-tour-2026', 'ermamat-matosmonov', 'approved', 15),
    ('tbsh-tour-2026', 'iskender-kurmanov', 'approved', 18),
    ('tbsh-tour-2026', 'zakir-gudadzhanov', 'approved', 31),
    ('tbsh-tour-2026', 'erlan-sydykov', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-tour-2026', 'FIC-R1', 1, 1, 'vladislav-kim', 'sardar-umarov', 1, 32, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 2, 'amir-bazhanov', 'denis-li', 17, 16, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 3, 'temirbek-musaev', 'ruslan-kalimov', 9, 24, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 4, 'mirbek-dyushenaliev', 'ulukbek-bekbosunov', 25, 8, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 5, 'alymbek-orokov', 'igor-hanganu', 5, 28, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 6, 'edil-dzhanybekov', 'ilzat-husainov', 21, 12, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 7, 'kadyrbek-adiev', 'eldiyar-boruev', 13, 20, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 8, 'syngyz-ismatov', 'ernest-takirov', 29, 4, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 9, 'zakir-nazarov', 'baatyr-bakytbek', 3, 30, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 10, 'erkin-kerimbaev', 'yaroslav-mironov', 19, 14, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 11, 'ivan-korabelnikov', 'iskender-seydimatov', 11, 22, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 12, 'aydar-usmanov', 'esen-azimov', 27, 6, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 13, 'murat-noruzbaev', 'baatyr-akimaliev', 7, 26, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 14, 'abdikiim-mahmutov', 'bek-kydyrgychov', 23, 10, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 15, 'ermamat-matosmonov', 'iskender-kurmanov', 15, 18, 'upcoming'),
    ('tbsh-tour-2026', 'FIC-R1', 1, 16, 'zakir-gudadzhanov', 'erlan-sydykov', 31, 2, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-tour-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-tour-2026'
 GROUP BY round_number ORDER BY round_number;

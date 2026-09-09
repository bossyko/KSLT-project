-- ============================================================
-- Перенос турнира: ТБШ Tour 2026 (женский)
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
-- Сетка «все места» строится на степень двойки: 32 слотов при 24
-- участниках, 8 мест пустуют — в таблице они отмечены номером без имени.
-- Сеяным с проходом победителя не проставляем: это сделает менеджер.
--
-- Расстановка взята из таблицы как есть, жеребьёвка не запускается: турнир
-- уже сыгран наполовину, и посевы менять нельзя.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-tour-women-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-tour-women-2026';
DELETE FROM tournaments WHERE id = 'tbsh-tour-women-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-tour-women-2026',
    'ТБШ Tour 2026 (женский)',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'tour', 'women', 'singles',
    'fic', 32, 32, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-tour-women-2026', 'anastasiya-adzhibekova', 'approved', 1),
    ('tbsh-tour-women-2026', 'nurzhamal-dzhanibekova', 'approved', 17),
    ('tbsh-tour-women-2026', 'asel-orokova', 'approved', 16),
    ('tbsh-tour-women-2026', 'malika-shamil', 'approved', 9),
    ('tbsh-tour-women-2026', 'svetlana-hanazhenko', 'approved', 24),
    ('tbsh-tour-women-2026', 'asel-isabekova', 'approved', 8),
    ('tbsh-tour-women-2026', 'keremet-begmatova', 'approved', 5),
    ('tbsh-tour-women-2026', 'aysuluu-orokova', 'approved', 21),
    ('tbsh-tour-women-2026', 'zarima-baygubatova', 'approved', 12),
    ('tbsh-tour-women-2026', 'anayat-abithanova', 'approved', 13),
    ('tbsh-tour-women-2026', 'akzholtoy-bolotbekova', 'approved', 20),
    ('tbsh-tour-women-2026', 'natalya-timirbaeva', 'approved', 4),
    ('tbsh-tour-women-2026', 'adel-dzhayloeva', 'approved', 3),
    ('tbsh-tour-women-2026', 'akzholtoy-isabekova', 'approved', 19),
    ('tbsh-tour-women-2026', 'narmina-ahmatova', 'approved', 14),
    ('tbsh-tour-women-2026', 'nazgul-kerimalieva', 'approved', 11),
    ('tbsh-tour-women-2026', 'shoola-baysaeva', 'approved', 22),
    ('tbsh-tour-women-2026', 'aleksandra-muchkina', 'approved', 6),
    ('tbsh-tour-women-2026', 'amina-kurbanova', 'approved', 7),
    ('tbsh-tour-women-2026', 'meerim-zhumabekova', 'approved', 23),
    ('tbsh-tour-women-2026', 'ayzhan-temiralieva', 'approved', 10),
    ('tbsh-tour-women-2026', 'nataliya-tsurban', 'approved', 15),
    ('tbsh-tour-women-2026', 'aziza-musaeva', 'approved', 18),
    ('tbsh-tour-women-2026', 'valeriya-pak', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 1, 'anastasiya-adzhibekova', NULL, 1, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 2, 'nurzhamal-dzhanibekova', 'asel-orokova', 17, 16, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 3, 'malika-shamil', 'svetlana-hanazhenko', 9, 24, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 4, 'asel-isabekova', NULL, 8, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 5, 'keremet-begmatova', NULL, 5, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 6, 'aysuluu-orokova', 'zarima-baygubatova', 21, 12, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 7, 'anayat-abithanova', 'akzholtoy-bolotbekova', 13, 20, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 8, 'natalya-timirbaeva', NULL, 4, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 9, 'adel-dzhayloeva', NULL, 3, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 10, 'akzholtoy-isabekova', 'narmina-ahmatova', 19, 14, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 11, 'nazgul-kerimalieva', 'shoola-baysaeva', 11, 22, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 12, 'aleksandra-muchkina', NULL, 6, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 13, 'amina-kurbanova', NULL, 7, NULL, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 14, 'meerim-zhumabekova', 'ayzhan-temiralieva', 23, 10, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 15, 'nataliya-tsurban', 'aziza-musaeva', 15, 18, 'upcoming'),
    ('tbsh-tour-women-2026', 'FIC-R1', 1, 16, 'valeriya-pak', NULL, 2, NULL, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-tour-women-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-tour-women-2026'
 GROUP BY round_number ORDER BY round_number;

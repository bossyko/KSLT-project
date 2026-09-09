-- ============================================================
-- Перенос турнира: ТБШ Masters 2026 (женский)
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
-- Сетка «все места» строится на степень двойки: 32 слотов при 21
-- участниках, 11 мест пустуют — в таблице они отмечены номером без имени.
-- Сеяным с проходом победителя не проставляем: это сделает менеджер.
--
-- Расстановка взята из таблицы как есть, жеребьёвка не запускается: турнир
-- уже сыгран наполовину, и посевы менять нельзя.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-masters-women-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-masters-women-2026';
DELETE FROM tournaments WHERE id = 'tbsh-masters-women-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-masters-women-2026',
    'ТБШ Masters 2026 (женский)',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'masters', 'women', 'singles',
    'fic', 32, 32, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-masters-women-2026', 'anastasiya-trofimushkina', 'approved', 1),
    ('tbsh-masters-women-2026', 'meerim-zhumabekova', 'approved', 17),
    ('tbsh-masters-women-2026', 'kalicha-tayguronova', 'approved', 16),
    ('tbsh-masters-women-2026', 'liliya-rahmatulina', 'approved', 9),
    ('tbsh-masters-women-2026', 'natalya-timirbaeva', 'approved', 8),
    ('tbsh-masters-women-2026', 'tat-yana-nechaeva', 'approved', 5),
    ('tbsh-masters-women-2026', 'aleksandra-muchkina', 'approved', 21),
    ('tbsh-masters-women-2026', 'adel-dzhayloeva', 'approved', 12),
    ('tbsh-masters-women-2026', 'zulayka-talasbek-kyzy', 'approved', 13),
    ('tbsh-masters-women-2026', 'anastasiya-adzhibekova', 'approved', 20),
    ('tbsh-masters-women-2026', 'marianna-proskurina', 'approved', 4),
    ('tbsh-masters-women-2026', 'aysuluu-chokoeva', 'approved', 3),
    ('tbsh-masters-women-2026', 'amina-kurbanova', 'approved', 19),
    ('tbsh-masters-women-2026', 'keremet-begmatova', 'approved', 14),
    ('tbsh-masters-women-2026', 'elena-kan', 'approved', 11),
    ('tbsh-masters-women-2026', 'gulmira-orozalieva', 'approved', 6),
    ('tbsh-masters-women-2026', 'shirin-karimova', 'approved', 7),
    ('tbsh-masters-women-2026', 'valeriya-pak', 'approved', 10),
    ('tbsh-masters-women-2026', 'kalima-askarova', 'approved', 15),
    ('tbsh-masters-women-2026', 'ayday-orozbaeva', 'approved', 18),
    ('tbsh-masters-women-2026', 'roza-isabekova', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 1, 'anastasiya-trofimushkina', NULL, 1, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 2, 'meerim-zhumabekova', 'kalicha-tayguronova', 17, 16, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 3, 'liliya-rahmatulina', NULL, 9, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 4, 'natalya-timirbaeva', NULL, 8, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 5, 'tat-yana-nechaeva', NULL, 5, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 6, 'aleksandra-muchkina', 'adel-dzhayloeva', 21, 12, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 7, 'zulayka-talasbek-kyzy', 'anastasiya-adzhibekova', 13, 20, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 8, 'marianna-proskurina', NULL, 4, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 9, 'aysuluu-chokoeva', NULL, 3, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 10, 'amina-kurbanova', 'keremet-begmatova', 19, 14, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 11, 'elena-kan', NULL, 11, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 12, 'gulmira-orozalieva', NULL, 6, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 13, 'shirin-karimova', NULL, 7, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 14, 'valeriya-pak', NULL, 10, NULL, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 15, 'kalima-askarova', 'ayday-orozbaeva', 15, 18, 'upcoming'),
    ('tbsh-masters-women-2026', 'FIC-R1', 1, 16, 'roza-isabekova', NULL, 2, NULL, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-masters-women-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-masters-women-2026'
 GROUP BY round_number ORDER BY round_number;

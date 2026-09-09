-- ============================================================
-- Перенос турнира: ТБШ Futures 2026
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
-- Сетка «все места» строится на степень двойки: 64 слотов при 52
-- участниках, 12 мест пустуют — в таблице они отмечены номером без имени.
-- Сеяным с проходом победителя не проставляем: это сделает менеджер.
--
-- Расстановка взята из таблицы как есть, жеребьёвка не запускается: турнир
-- уже сыгран наполовину, и посевы менять нельзя.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-futures-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-futures-2026';
DELETE FROM tournaments WHERE id = 'tbsh-futures-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-futures-2026',
    'ТБШ Futures 2026',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'futures', 'men', 'singles',
    'fic', 64, 64, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-futures-2026', 'sergey-levin', 'approved', 1),
    ('tbsh-futures-2026', 'sultan-ibragimov', 'approved', 33),
    ('tbsh-futures-2026', 'bekzhan-kylychbekov', 'approved', 32),
    ('tbsh-futures-2026', 'timofey-kim', 'approved', 17),
    ('tbsh-futures-2026', 'dmitriy-pak', 'approved', 48),
    ('tbsh-futures-2026', 'altynbek-zhoogachiev', 'approved', 49),
    ('tbsh-futures-2026', 'alier-mahmuthodzhaev', 'approved', 16),
    ('tbsh-futures-2026', 'imar-kamalov', 'approved', 9),
    ('tbsh-futures-2026', 'ravil-sayfutdinov', 'approved', 41),
    ('tbsh-futures-2026', 'aleksandr-kim', 'approved', 24),
    ('tbsh-futures-2026', 'nursultan-zhunusov', 'approved', 25),
    ('tbsh-futures-2026', 'rustam-ushur', 'approved', 40),
    ('tbsh-futures-2026', 'ahmedzhan-adzhuev', 'approved', 8),
    ('tbsh-futures-2026', 'nurbek-nurbekov', 'approved', 5),
    ('tbsh-futures-2026', 'timur-uzagaliev', 'approved', 37),
    ('tbsh-futures-2026', 'allayar-nasyrov', 'approved', 28),
    ('tbsh-futures-2026', 'sanzhar-ergeshaliev', 'approved', 21),
    ('tbsh-futures-2026', 'bakyt-kapakov', 'approved', 44),
    ('tbsh-futures-2026', 'eren-kamchibekov', 'approved', 53),
    ('tbsh-futures-2026', 'sultan-ayylchiev', 'approved', 12),
    ('tbsh-futures-2026', 'askar-abaskanov', 'approved', 13),
    ('tbsh-futures-2026', 'iskender-kadyrov', 'approved', 52),
    ('tbsh-futures-2026', 'atay-begaliev', 'approved', 45),
    ('tbsh-futures-2026', 'vladimir-antonenko', 'approved', 20),
    ('tbsh-futures-2026', 'zhakshylyk-aytbaev', 'approved', 29),
    ('tbsh-futures-2026', 'omurbek-zholdoshev', 'approved', 36),
    ('tbsh-futures-2026', 'shavkat-mihmanov', 'approved', 4),
    ('tbsh-futures-2026', 'amir-kanaev', 'approved', 3),
    ('tbsh-futures-2026', 'beksultan-rustamov', 'approved', 35),
    ('tbsh-futures-2026', 'suvar-ayylchiev', 'approved', 19),
    ('tbsh-futures-2026', 'azatbek-musaev', 'approved', 46),
    ('tbsh-futures-2026', 'bekmamat-nurmamat-uulu', 'approved', 51),
    ('tbsh-futures-2026', 'nur-tulebaev', 'approved', 14),
    ('tbsh-futures-2026', 'aydin-daniyarov', 'approved', 11),
    ('tbsh-futures-2026', 'erbol-abdyakimov', 'approved', 54),
    ('tbsh-futures-2026', 'altynbek-zhanybekov', 'approved', 43),
    ('tbsh-futures-2026', 'roman-valyaev', 'approved', 22),
    ('tbsh-futures-2026', 'musa-zhanybekov', 'approved', 27),
    ('tbsh-futures-2026', 'salih-ismailov', 'approved', 38),
    ('tbsh-futures-2026', 'murat-alaychyev', 'approved', 6),
    ('tbsh-futures-2026', 'bahram-mambetov', 'approved', 7),
    ('tbsh-futures-2026', 'nursultan-ulukbekov', 'approved', 39),
    ('tbsh-futures-2026', 'atay-isaev', 'approved', 26),
    ('tbsh-futures-2026', 'salman-beyshenaliev', 'approved', 23),
    ('tbsh-futures-2026', 'aydar-orozbaev', 'approved', 42),
    ('tbsh-futures-2026', 'elnur-omurzakov', 'approved', 55),
    ('tbsh-futures-2026', 'adil-valimamedov', 'approved', 10),
    ('tbsh-futures-2026', 'azat-kubanychbek-uulu', 'approved', 50),
    ('tbsh-futures-2026', 'adlet-mamyrov', 'approved', 47),
    ('tbsh-futures-2026', 'nurmat-sakebaev', 'approved', 18),
    ('tbsh-futures-2026', 'ulan-tagaybek-uulu', 'approved', 34),
    ('tbsh-futures-2026', 'azat-bazarkulov', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-futures-2026', 'FIC-R1', 1, 1, 'sergey-levin', NULL, 1, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 2, 'sultan-ibragimov', 'bekzhan-kylychbekov', 33, 32, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 3, 'timofey-kim', 'dmitriy-pak', 17, 48, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 4, 'altynbek-zhoogachiev', 'alier-mahmuthodzhaev', 49, 16, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 5, 'imar-kamalov', NULL, 9, 56, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 6, 'ravil-sayfutdinov', 'aleksandr-kim', 41, 24, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 7, 'nursultan-zhunusov', 'rustam-ushur', 25, 40, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 8, 'ahmedzhan-adzhuev', NULL, 8, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 9, 'nurbek-nurbekov', NULL, 5, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 10, 'timur-uzagaliev', 'allayar-nasyrov', 37, 28, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 11, 'sanzhar-ergeshaliev', 'bakyt-kapakov', 21, 44, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 12, 'eren-kamchibekov', 'sultan-ayylchiev', 53, 12, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 13, 'askar-abaskanov', 'iskender-kadyrov', 13, 52, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 14, 'atay-begaliev', 'vladimir-antonenko', 45, 20, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 15, 'zhakshylyk-aytbaev', 'omurbek-zholdoshev', 29, 36, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 16, 'shavkat-mihmanov', NULL, 4, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 17, 'amir-kanaev', NULL, 3, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 18, 'beksultan-rustamov', NULL, 35, 30, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 19, 'suvar-ayylchiev', 'azatbek-musaev', 19, 46, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 20, 'bekmamat-nurmamat-uulu', 'nur-tulebaev', 51, 14, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 21, 'aydin-daniyarov', 'erbol-abdyakimov', 11, 54, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 22, 'altynbek-zhanybekov', 'roman-valyaev', 43, 22, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 23, 'musa-zhanybekov', 'salih-ismailov', 27, 38, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 24, 'murat-alaychyev', NULL, 6, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 25, 'bahram-mambetov', NULL, 7, NULL, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 26, 'nursultan-ulukbekov', 'atay-isaev', 39, 26, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 27, 'salman-beyshenaliev', 'aydar-orozbaev', 23, 42, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 28, 'elnur-omurzakov', 'adil-valimamedov', 55, 10, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 29, NULL, 'azat-kubanychbek-uulu', 15, 50, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 30, 'adlet-mamyrov', 'nurmat-sakebaev', 47, 18, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 31, NULL, 'ulan-tagaybek-uulu', 31, 34, 'upcoming'),
    ('tbsh-futures-2026', 'FIC-R1', 1, 32, 'azat-bazarkulov', NULL, 2, NULL, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-futures-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 6) AS r, generate_series(1, 32) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-futures-2026'
 GROUP BY round_number ORDER BY round_number;

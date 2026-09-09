-- ============================================================
-- Перенос турнира: ТБШ Challengers 2026
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
-- Сетка «все места» строится на степень двойки: 64 слотов при 58
-- участниках, 6 мест пустуют — в таблице они отмечены номером без имени.
-- Сеяным с проходом победителя не проставляем: это сделает менеджер.
--
-- Расстановка взята из таблицы как есть, жеребьёвка не запускается: турнир
-- уже сыгран наполовину, и посевы менять нельзя.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-challengers-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-challengers-2026';
DELETE FROM tournaments WHERE id = 'tbsh-challengers-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-challengers-2026',
    'ТБШ Challengers 2026',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'challenger', 'men', 'singles',
    'fic', 64, 64, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-challengers-2026', 'askar-zhumagulov', 'approved', 1),
    ('tbsh-challengers-2026', 'azat-bazarkulov', 'approved', 64),
    ('tbsh-challengers-2026', 'yaroslav-mironov', 'approved', 33),
    ('tbsh-challengers-2026', 'azamat-nurdinov', 'approved', 17),
    ('tbsh-challengers-2026', 'zamir-borubaev', 'approved', 48),
    ('tbsh-challengers-2026', 'vladimir-antonenko', 'approved', 49),
    ('tbsh-challengers-2026', 'dmitriy-rakov', 'approved', 16),
    ('tbsh-challengers-2026', 'denis-ens', 'approved', 9),
    ('tbsh-challengers-2026', 'ilzat-husainov', 'approved', 41),
    ('tbsh-challengers-2026', 'faruh-suleymanov', 'approved', 24),
    ('tbsh-challengers-2026', 'vitaliy-valyaev', 'approved', 25),
    ('tbsh-challengers-2026', 'dmitriy-pak', 'approved', 40),
    ('tbsh-challengers-2026', 'aleksandr-kim', 'approved', 57),
    ('tbsh-challengers-2026', 'kamil-yakupov', 'approved', 8),
    ('tbsh-challengers-2026', 'erkin-kerimbaev', 'approved', 5),
    ('tbsh-challengers-2026', 'iskender-kadyrov', 'approved', 60),
    ('tbsh-challengers-2026', 'denis-li', 'approved', 37),
    ('tbsh-challengers-2026', 'evgeniy-osipov', 'approved', 28),
    ('tbsh-challengers-2026', 'tilegen-mamyrkaliev', 'approved', 21),
    ('tbsh-challengers-2026', 'ilyas-kydyraliev', 'approved', 44),
    ('tbsh-challengers-2026', 'mark-garreta-navo', 'approved', 53),
    ('tbsh-challengers-2026', 'yakov-yudin', 'approved', 12),
    ('tbsh-challengers-2026', 'nurlan-azygaliev', 'approved', 13),
    ('tbsh-challengers-2026', 'igor-kan', 'approved', 52),
    ('tbsh-challengers-2026', 'sergey-levin', 'approved', 45),
    ('tbsh-challengers-2026', 'sabyrbek-esenbekov', 'approved', 20),
    ('tbsh-challengers-2026', 'ermek-abakirov', 'approved', 29),
    ('tbsh-challengers-2026', 'taalay-esenamanov', 'approved', 61),
    ('tbsh-challengers-2026', 'stanislav-shumilin', 'approved', 4),
    ('tbsh-challengers-2026', 'azat-mukaev', 'approved', 3),
    ('tbsh-challengers-2026', 'adilet-kanatbekov', 'approved', 62),
    ('tbsh-challengers-2026', 'sanzhar-sultanov', 'approved', 35),
    ('tbsh-challengers-2026', 'ulan-tagaybek-uulu', 'approved', 30),
    ('tbsh-challengers-2026', 'dzhantay-otorbaev', 'approved', 19),
    ('tbsh-challengers-2026', 'ibragim-koshoybekov', 'approved', 46),
    ('tbsh-challengers-2026', 'ivan-shvyrov', 'approved', 51),
    ('tbsh-challengers-2026', 'azat-sakebaev', 'approved', 14),
    ('tbsh-challengers-2026', 'salih-ismailov', 'approved', 11),
    ('tbsh-challengers-2026', 'daniyar-dzhaylokeev', 'approved', 54),
    ('tbsh-challengers-2026', 'bekzat-imenov', 'approved', 43),
    ('tbsh-challengers-2026', 'eren-kamchibekov', 'approved', 27),
    ('tbsh-challengers-2026', 'amir-bazhanov', 'approved', 6),
    ('tbsh-challengers-2026', 'bek-kydyrgychov', 'approved', 7),
    ('tbsh-challengers-2026', 'suvar-ayylchiev', 'approved', 58),
    ('tbsh-challengers-2026', 'aleksandr-gabaguev', 'approved', 39),
    ('tbsh-challengers-2026', 'dilshat-nurdinov', 'approved', 26),
    ('tbsh-challengers-2026', 'argen-shakidiev', 'approved', 23),
    ('tbsh-challengers-2026', 'atay-begaliev', 'approved', 42),
    ('tbsh-challengers-2026', 'murat-alaychyev', 'approved', 55),
    ('tbsh-challengers-2026', 'azatbek-musaev', 'approved', 10),
    ('tbsh-challengers-2026', 'ravil-sayfutdinov', 'approved', 15),
    ('tbsh-challengers-2026', 'ruslan-kalimov', 'approved', 50),
    ('tbsh-challengers-2026', 'shavkat-mihmanov', 'approved', 47),
    ('tbsh-challengers-2026', 'aman-kanaev', 'approved', 18),
    ('tbsh-challengers-2026', 'chingis-chukin', 'approved', 31),
    ('tbsh-challengers-2026', 'nurbek-nurbekov', 'approved', 34),
    ('tbsh-challengers-2026', 'alan-adzhibekov', 'approved', 63),
    ('tbsh-challengers-2026', 'ermamat-matosmonov', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных с проходом соперника нет; пустая линия оставляет свой номер.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-challengers-2026', 'FIC-R1', 1, 1, 'askar-zhumagulov', 'azat-bazarkulov', 1, 64, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 2, 'yaroslav-mironov', NULL, 33, 32, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 3, 'azamat-nurdinov', 'zamir-borubaev', 17, 48, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 4, 'vladimir-antonenko', 'dmitriy-rakov', 49, 16, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 5, 'denis-ens', NULL, 9, 56, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 6, 'ilzat-husainov', 'faruh-suleymanov', 41, 24, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 7, 'vitaliy-valyaev', 'dmitriy-pak', 25, 40, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 8, 'aleksandr-kim', 'kamil-yakupov', 57, 8, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 9, 'erkin-kerimbaev', 'iskender-kadyrov', 5, 60, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 10, 'denis-li', 'evgeniy-osipov', 37, 28, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 11, 'tilegen-mamyrkaliev', 'ilyas-kydyraliev', 21, 44, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 12, 'mark-garreta-navo', 'yakov-yudin', 53, 12, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 13, 'nurlan-azygaliev', 'igor-kan', 13, 52, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 14, 'sergey-levin', 'sabyrbek-esenbekov', 45, 20, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 15, 'ermek-abakirov', NULL, 29, 36, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 16, 'taalay-esenamanov', 'stanislav-shumilin', 61, 4, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 17, 'azat-mukaev', 'adilet-kanatbekov', 3, 62, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 18, 'sanzhar-sultanov', 'ulan-tagaybek-uulu', 35, 30, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 19, 'dzhantay-otorbaev', 'ibragim-koshoybekov', 19, 46, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 20, 'ivan-shvyrov', 'azat-sakebaev', 51, 14, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 21, 'salih-ismailov', 'daniyar-dzhaylokeev', 11, 54, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 22, 'bekzat-imenov', NULL, 43, 22, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 23, 'eren-kamchibekov', NULL, 27, 38, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 24, NULL, 'amir-bazhanov', 59, 6, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 25, 'bek-kydyrgychov', 'suvar-ayylchiev', 7, 58, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 26, 'aleksandr-gabaguev', 'dilshat-nurdinov', 39, 26, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 27, 'argen-shakidiev', 'atay-begaliev', 23, 42, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 28, 'murat-alaychyev', 'azatbek-musaev', 55, 10, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 29, 'ravil-sayfutdinov', 'ruslan-kalimov', 15, 50, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 30, 'shavkat-mihmanov', 'aman-kanaev', 47, 18, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 31, 'chingis-chukin', 'nurbek-nurbekov', 31, 34, 'upcoming'),
    ('tbsh-challengers-2026', 'FIC-R1', 1, 32, 'alan-adzhibekov', 'ermamat-matosmonov', 63, 2, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-challengers-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 6) AS r, generate_series(1, 32) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-challengers-2026'
 GROUP BY round_number ORDER BY round_number;

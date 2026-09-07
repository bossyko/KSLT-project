-- ============================================================
-- ТБШ ProMasters 2026 — только первый круг
-- ============================================================
--
-- Переносим участников с посевами и пары первого круга, как в таблице.
-- Дальше ничего не заполняем: остальные круги остаются пустыми, счета
-- проставит менеджер руками.
--
-- Почему так. Сетка в базе строится на степень двойки: под 24 участников
-- берётся 32 места, и восемь остаются выдуманными. У выдуманных мест нет
-- проигравших, поэтому нижние ветки за места заполнялись наполовину — с
-- пустой стороной в каждой паре. Пока нет настоящей сетки на 24, честнее
-- вписать первый круг и дать человеку заполнить остальное.
--
-- Проходы сеяных оставлены: у восьми первых номеров первый круг без
-- соперника, как в таблице. Победителя им не проставляем — это сделает
-- менеджер, и тогда база разведёт людей по второму кругу.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-promasters-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-promasters-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-promasters-2026';
DELETE FROM tournaments WHERE id = 'tbsh-promasters-2026';

INSERT INTO tournaments (
    id, title, description, date_start, date_end, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-promasters-2026',
    'ТБШ ProMasters 2026',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', '2026-09-30', 'promasters', 'men', 'singles',
    'fic', 32, 32, 'ongoing', NULL
);

-- ---- Участники с посевами из таблицы ----

INSERT INTO tournament_registrations (tournament_id, player_id, status, seed_number) VALUES
    ('tbsh-promasters-2026', 'roman-dolgushin', 'approved', 1),
    ('tbsh-promasters-2026', 'tengiz-atahanov', 'approved', 17),
    ('tbsh-promasters-2026', 'nikita-boykov', 'approved', 16),
    ('tbsh-promasters-2026', 'mirdias-tumenbaev', 'approved', 9),
    ('tbsh-promasters-2026', 'ildiyar-murataliev', 'approved', 24),
    ('tbsh-promasters-2026', 'atham-israilov', 'approved', 8),
    ('tbsh-promasters-2026', 'eldar-safiullin', 'approved', 5),
    ('tbsh-promasters-2026', 'kirill-leontev', 'approved', 21),
    ('tbsh-promasters-2026', 'rashid-seyitov', 'approved', 12),
    ('tbsh-promasters-2026', 'ilya-velikorodnyy', 'approved', 13),
    ('tbsh-promasters-2026', 'ruslan-kuldzhaev', 'approved', 20),
    ('tbsh-promasters-2026', 'arsen-umurzakov', 'approved', 4),
    ('tbsh-promasters-2026', 'aziz-bazakov', 'approved', 3),
    ('tbsh-promasters-2026', 'roman-gudi', 'approved', 19),
    ('tbsh-promasters-2026', 'ermek-aratov', 'approved', 14),
    ('tbsh-promasters-2026', 'azim-isakov', 'approved', 11),
    ('tbsh-promasters-2026', 'rufat-mirdzhaliev', 'approved', 6),
    ('tbsh-promasters-2026', 'furkat-sadykov', 'approved', 7),
    ('tbsh-promasters-2026', 'karim-imanhodzhaev', 'approved', 10),
    ('tbsh-promasters-2026', 'kamil-murakov', 'approved', 15),
    ('tbsh-promasters-2026', 'ruslan-andreev', 'approved', 18),
    ('tbsh-promasters-2026', 'erlan-shekerbekov', 'approved', 2);

-- ---- Первый круг: пары как в таблице ----
-- У сеяных вторым игроком пусто — они проходят дальше без игры.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, status) VALUES
    ('tbsh-promasters-2026', 'FIC-R1', 1, 1, 'roman-dolgushin', NULL, 1, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 2, 'tengiz-atahanov', 'nikita-boykov', 17, 16, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 3, 'mirdias-tumenbaev', 'ildiyar-murataliev', 9, 24, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 4, 'atham-israilov', NULL, 8, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 5, 'eldar-safiullin', NULL, 5, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 6, 'kirill-leontev', 'rashid-seyitov', 21, 12, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 7, 'ilya-velikorodnyy', 'ruslan-kuldzhaev', 13, 20, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 8, 'arsen-umurzakov', NULL, 4, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 9, 'aziz-bazakov', NULL, 3, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 10, 'roman-gudi', 'ermek-aratov', 19, 14, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 11, 'azim-isakov', NULL, 11, 22, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 12, 'rufat-mirdzhaliev', NULL, 6, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 13, 'furkat-sadykov', NULL, 7, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 14, NULL, 'karim-imanhodzhaev', 23, 10, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 15, 'kamil-murakov', 'ruslan-andreev', 15, 18, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 16, 'erlan-shekerbekov', NULL, 2, NULL, 'upcoming');

-- ---- Остальные круги: пустые ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-promasters-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- Что получилось
SELECT round_number AS круг, count(*) AS матчей,
       count(*) FILTER (WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL) AS с_людьми
  FROM matches WHERE tournament_id = 'tbsh-promasters-2026'
 GROUP BY round_number ORDER BY round_number;

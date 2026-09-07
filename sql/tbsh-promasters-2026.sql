-- ============================================================
-- Перенос турнира: ТБШ ProMasters 2026
-- ============================================================
--
-- Турнир играется по таблице ТБШ третий месяц, а на сайте его нет. Здесь он
-- заводится черновиком: без публикации, виден только в админке. Обложку,
-- описание и рейтинговую категорию проставит Costa — без категории очки не
-- считаются, и это нарочно.
--
-- Сетка «все места»: 32 слота на 24 участника, из них два места пустые (в
-- таблице отмечены «Х»). Восемь сеяных первый круг не играют.
--
-- Расстановка первого круга взята из таблицы как есть, случайная жеребьёвка
-- не запускается: турнир уже сыгран наполовину, и посевы менять нельзя.
--
-- Счета вписываются не по местам, а по парам: находим матч, где сошлись эти
-- двое, и ставим счёт. Кто куда пойдёт дальше, решает сама база — тот же
-- механизм, что работает на сайте. Так перенос не зависит от того, как наш
-- построитель нумерует матчи.
--
-- «bye» в таблице означает снятие: матч назначили, но игры не было. В нашей
-- админке это исход W/O, счёта у него нет.
--
-- Запускать можно повторно: турнир пересоздаётся с нуля.
--
-- Файл меняет базу. Читающие запросы — в tbsh-promasters-2026-check.sql.

BEGIN;

DELETE FROM matches WHERE tournament_id = 'tbsh-promasters-2026';
DELETE FROM tournament_registrations WHERE tournament_id = 'tbsh-promasters-2026';
DELETE FROM tournaments WHERE id = 'tbsh-promasters-2026';

INSERT INTO tournaments (
    id, title, description, date_start, category_id, gender, format,
    bracket_type, draw_size, max_participants, status, published_at
) VALUES (
    'tbsh-promasters-2026',
    'ТБШ ProMasters 2026',
    'Перенесён из таблицы ТБШ. Описание и обложку добавит менеджер.',
    '2026-06-01', 'promasters', 'men', 'singles',
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
-- У сеяных вторым игроком пусто: они проходят дальше без игры.

INSERT INTO matches (tournament_id, round, round_number, match_order,
                     player1_id, player2_id, seed1, seed2, winner_id, score, status) VALUES
    ('tbsh-promasters-2026', 'FIC-R1', 1, 1, 'roman-dolgushin', NULL, 1, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 2, 'tengiz-atahanov', 'nikita-boykov', 17, 16, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 3, 'mirdias-tumenbaev', 'ildiyar-murataliev', 9, 24, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 4, 'atham-israilov', NULL, 8, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 5, 'eldar-safiullin', NULL, 5, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 6, 'kirill-leontev', 'rashid-seyitov', 21, 12, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 7, 'ilya-velikorodnyy', 'ruslan-kuldzhaev', 13, 20, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 8, 'arsen-umurzakov', NULL, 4, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 9, 'aziz-bazakov', NULL, 3, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 10, 'roman-gudi', 'ermek-aratov', 19, 14, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 11, 'azim-isakov', NULL, 11, 22, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 12, 'rufat-mirdzhaliev', NULL, 6, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 13, 'furkat-sadykov', NULL, 7, NULL, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 14, NULL, 'karim-imanhodzhaev', 23, 10, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 15, 'kamil-murakov', 'ruslan-andreev', 15, 18, NULL, NULL, 'upcoming'),
    ('tbsh-promasters-2026', 'FIC-R1', 1, 16, 'erlan-shekerbekov', NULL, 2, NULL, NULL, NULL, 'upcoming');

-- ---- Остальные круги: пустые, база расставит сама ----

INSERT INTO matches (tournament_id, round, round_number, match_order, status)
SELECT 'tbsh-promasters-2026', 'FIC-R' || r, r, m, 'upcoming'
  FROM generate_series(2, 5) AS r, generate_series(1, 16) AS m;

COMMIT;

-- ============================================================
-- Счета из таблицы
-- ============================================================
-- Ищем матч по паре игроков и ставим счёт. После каждого прохода база
-- расставляет людей по следующему кругу, поэтому проходим несколько раз,
-- пока не перестанут находиться новые.

CREATE TEMP TABLE итоги_тбш (победитель text, проигравший text, счёт text);

INSERT INTO итоги_тбш VALUES
    ('tengiz-atahanov', 'nikita-boykov', '6/3 6/4'),
    ('ildiyar-murataliev', 'mirdias-tumenbaev', '6/4 6/4'),
    ('rashid-seyitov', 'kirill-leontev', '6/7 6/2 7/6'),
    ('ruslan-kuldzhaev', 'ilya-velikorodnyy', '6/4 6/4'),
    ('roman-gudi', 'ermek-aratov', '6/1 6/3'),
    ('ruslan-andreev', 'kamil-murakov', '6/3 6/3'),
    ('roman-dolgushin', 'tengiz-atahanov', '6/1 7/6'),
    ('atham-israilov', 'ildiyar-murataliev', '6/4 6/0'),
    ('eldar-safiullin', 'rashid-seyitov', '7/6 6/2'),
    ('ruslan-kuldzhaev', 'arsen-umurzakov', 'W/O'),
    ('aziz-bazakov', 'roman-gudi', '6/2 6/3'),
    ('rufat-mirdzhaliev', 'azim-isakov', '6/1 6/0'),
    ('karim-imanhodzhaev', 'furkat-sadykov', '6/2 7/5'),
    ('erlan-shekerbekov', 'ruslan-andreev', '7/5 6/3'),
    ('atham-israilov', 'roman-dolgushin', '7/5 6/4'),
    ('eldar-safiullin', 'ruslan-kuldzhaev', '7/5 6/4'),
    ('rufat-mirdzhaliev', 'aziz-bazakov', '7/6 5/7 6/4'),
    ('erlan-shekerbekov', 'karim-imanhodzhaev', '6/4 6/4'),
    ('tengiz-atahanov', 'ildiyar-murataliev', 'W/O'),
    ('rashid-seyitov', 'arsen-umurzakov', '7/5 6/3'),
    ('roman-gudi', 'azim-isakov', '5/7 6/2 10/7'),
    ('ruslan-andreev', 'furkat-sadykov', 'W/O'),
    ('mirdias-tumenbaev', 'nikita-boykov', 'W/O'),
    ('kirill-leontev', 'ilya-velikorodnyy', 'W/O'),
    ('atham-israilov', 'eldar-safiullin', '6/1 6/2'),
    ('erlan-shekerbekov', 'rufat-mirdzhaliev', '6/2 6/4'),
    ('ruslan-kuldzhaev', 'roman-dolgushin', 'W/O'),
    ('aziz-bazakov', 'karim-imanhodzhaev', '6/3 6/7 7/5'),
    -- В таблице счёт записан как 6/4 2/6 3/6, но по нему выигрывает Атаханов,
    -- а победителем там стоит Сейитов. Costa сверил: верный счёт 6/4 2/6 6/3.
    ('rashid-seyitov', 'tengiz-atahanov', '6/4 2/6 6/3'),
    ('kirill-leontev', 'mirdias-tumenbaev', 'W/O'),
    ('kamil-murakov', 'ermek-aratov', 'W/O'),
    ('ilya-velikorodnyy', 'nikita-boykov', 'W/O');

-- ---- Проходы без игры ----
-- Ставим победителя отдельным изменением, а не при вставке: расстановка в
-- базе срабатывает на изменение матча. Записанный сразу победитель никуда
-- не двигался, и восемь сеяных так и остались в первом круге.

UPDATE matches
   SET winner_id = COALESCE(player1_id, player2_id),
       score = 'BYE',
       status = 'completed',
       played_at = now()
 WHERE tournament_id = 'tbsh-promasters-2026'
   AND round_number = 1
   AND winner_id IS NULL
   AND (player1_id IS NULL) <> (player2_id IS NULL);

DO $$
DECLARE
    поставлено integer;
    заход integer := 0;
    и record;
BEGIN
    LOOP
        заход := заход + 1;
        поставлено := 0;

        FOR и IN SELECT * FROM итоги_тбш LOOP
            UPDATE matches m
               SET winner_id = и.победитель,
                   score = CASE WHEN и.счёт IN ('', 'W/O') THEN NULL ELSE и.счёт END,
                   status = 'completed',
                   played_at = now()
             WHERE m.tournament_id = 'tbsh-promasters-2026'
               AND m.winner_id IS NULL
               AND ((m.player1_id = и.победитель AND m.player2_id = и.проигравший)
                 OR (m.player2_id = и.победитель AND m.player1_id = и.проигравший));
            IF FOUND THEN поставлено := поставлено + 1; END IF;
        END LOOP;

        EXIT WHEN поставлено = 0 OR заход > 8;
    END LOOP;

    RAISE NOTICE 'заходов: %', заход;
END $$;

-- Что получилось
SELECT round_number AS круг,
       count(*) AS матчей,
       count(winner_id) AS с_победителем,
       count(*) FILTER (WHERE player1_id IS NULL AND player2_id IS NULL) AS пустых
  FROM matches
 WHERE tournament_id = 'tbsh-promasters-2026'
 GROUP BY round_number
 ORDER BY round_number;

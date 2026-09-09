-- ============================================================
-- ТБШ 2026 — сброс результатов, жеребьёвка остаётся
-- ============================================================
--
-- Все семь турниров возвращаются к состоянию «сетка собрана, никто не
-- играл»: люди стоят в первом круге по линиям из таблицы, с посевами, а
-- счетов, победителей и проходов нет нигде. Дальше результаты вносит
-- менеджер руками.
--
-- Первый круг не трогаем по составу — только снимаем с него результаты.
-- Круги со второго очищаются полностью: люди туда приедут сами, когда
-- появятся счета.
--
-- Проходы не закрываются: у сеяного без соперника в первом круге останется
-- кнопка «Провести дальше», и решение за менеджером.
--
-- Pro Masters не трогаем: он доигран и очки за него начислены.
--
-- Запускать можно повторно.
--
-- Файл меняет базу. Читающие запросы — в tbsh-2026-check.sql.

BEGIN;

-- ---- Первый круг: снимаем результаты, состав оставляем ----

UPDATE matches
   SET winner_id = NULL, score = NULL, status = 'upcoming', played_at = NULL
 WHERE tournament_id IN (
        'tbsh-challengers-2026',
        'tbsh-masters-2026',
        'tbsh-tour-2026',
        'tbsh-futures-2026',
        'tbsh-masters-women-2026',
        'tbsh-futures-women-2026',
        'tbsh-tour-women-2026')
   AND round_number = 1;

-- ---- Остальные круги: пусто ----

UPDATE matches
   SET player1_id = NULL, player2_id = NULL, seed1 = NULL, seed2 = NULL,
       winner_id = NULL, score = NULL, status = 'upcoming', played_at = NULL
 WHERE tournament_id IN (
        'tbsh-challengers-2026',
        'tbsh-masters-2026',
        'tbsh-tour-2026',
        'tbsh-futures-2026',
        'tbsh-masters-women-2026',
        'tbsh-futures-women-2026',
        'tbsh-tour-women-2026')
   AND round_number > 1;

COMMIT;

-- Что получилось: в первом круге стоят люди, дальше пусто
SELECT tournament_id,
       count(*) FILTER (WHERE round_number = 1
                          AND (player1_id IS NOT NULL OR player2_id IS NOT NULL)) AS r1_cells,
       count(*) FILTER (WHERE score IS NOT NULL) AS with_score,
       count(*) FILTER (WHERE round_number > 1
                          AND (player1_id IS NOT NULL OR player2_id IS NOT NULL)) AS ahead
  FROM matches
 WHERE tournament_id LIKE 'tbsh-%-2026' AND tournament_id <> 'tbsh-promasters-2026'
 GROUP BY tournament_id ORDER BY tournament_id;

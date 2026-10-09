-- ПЕРЕСБОРКА ПЛЕЙ-ОФФА ОДНОГО ТУРНИРА: ЗЕМЛЯКИ РАСХОДЯТСЯ ПО ПОЛОВИНАМ
--
-- ЗАЧЕМ. Правило расстановки, которое я написал раньше, разводило игроков
-- из одной группы ТОЛЬКО в первом круге: смотрело на прямого соперника по
-- паре и дальше по ветке не смотрело. Замер на этом турнире (5 групп, по
-- двое из группы): A1 слот 0 и A2 слот 3 — встреча в КРУГЕ 2, C1 и C2 —
-- тоже в круге 2. В международном теннисе из одной группы разводят по
-- РАЗНЫМ ПОЛОВИНАМ: встреча не раньше финала.
--
-- Правило починено в js/admin/sections/bracket.js (версия 279). Новый
-- расклад для этого турнира посчитан ТОЙ ЖЕ функцией в браузере и даёт
-- A:4 B:4 C:4 D:4 E:4 — все пять групп встречаются только в финале.
--
-- ЧТО ТРОГАЕМ: восемь матчей первого круга (round = 'R1') — только метки
-- слотов и номера посева. Ни игроков, ни счёта, ни статусов. Матчи
-- четвертьфиналов и дальше не трогаем вовсе: они связаны порядком, а не
-- метками.
--
-- ПОРЯДОК: шаг 0, шаг 1, и только если шаг 1 показал, что ничего не
-- сыграно, — шаг 2 и шаг 3. Каждый отдельным прогоном.

-- ===========================================================
-- ШАГ 0. СЛЕПОК. Копия того, что собираемся тронуть.
-- ===========================================================

CREATE TABLE IF NOT EXISTS public.slepok_setka_24cad8f2 AS
SELECT id, tournament_id, round, round_number, match_order,
       slot1_label, slot2_label, seed1, seed2,
       player1_id, player2_id, score, winner_id, status, now() AS snyato
  FROM public.matches
 WHERE tournament_id = '24cad8f2-58a4-4e4f-997f-e4c967321da8';

SELECT count(*) AS vsego_matchey,
       count(*) FILTER (WHERE round = 'R1')              AS pervyy_krug,
       count(*) FILTER (WHERE score IS NOT NULL)          AS so_schyotom,
       count(*) FILTER (WHERE player1_id IS NOT NULL
                           OR player2_id IS NOT NULL)     AS s_igrokami
  FROM public.slepok_setka_24cad8f2;

-- Ожидаем: pervyy_krug = 8, so_schyotom = 0, s_igrokami = 0.
-- Если счёт или игроки есть — ШАГ 2 НЕ ЗАПУСКАТЬ и сказать мне.

-- ===========================================================
-- ШАГ 1. ЧТО СТОИТ СЕЙЧАС — чтобы было с чем сравнить.
-- ===========================================================

SELECT match_order, slot1_label, seed1, slot2_label, seed2, status
  FROM public.matches
 WHERE tournament_id = '24cad8f2-58a4-4e4f-997f-e4c967321da8'
   AND round = 'R1'
 ORDER BY match_order;

-- ===========================================================
-- ШАГ 2. ПРАВКА. Новый расклад, посчитанный живой функцией.
-- ===========================================================

UPDATE public.matches m
   SET slot1_label = n.slot1,
       slot2_label = n.slot2,
       seed1       = n.seed1,
       seed2       = n.seed2
  FROM (VALUES
        (1, 'A1'::text, 1::int,    NULL::text, NULL::int),
        (2, 'B2',       NULL,      'C2',       NULL),
        (3, 'E1',       5,         'Q4',       NULL),
        (4, 'Q3',       NULL,      'D1',       4),
        (5, 'C1',       3,         'Q2',       NULL),
        (6, 'Q5',       NULL,      'A2',       NULL),
        (7, 'D2',       NULL,      'E2',       NULL),
        (8, 'Q1',       NULL,      'B1',       2)
       ) AS n(match_order, slot1, seed1, slot2, seed2)
 WHERE m.tournament_id = '24cad8f2-58a4-4e4f-997f-e4c967321da8'
   AND m.round = 'R1'
   AND m.match_order = n.match_order;

-- ===========================================================
-- ШАГ 3. ПРОВЕРКА ЧТЕНИЕМ. «Success» ничего не доказывает.
-- ===========================================================

SELECT m.match_order, m.slot1_label, m.seed1, m.slot2_label, m.seed2,
       s.slot1_label AS bylo_slot1, s.slot2_label AS bylo_slot2,
       m.player1_id IS NULL AND m.player2_id IS NULL AS igrokov_net,
       m.score IS NULL                                AS schyota_net
  FROM public.matches m
  JOIN public.slepok_setka_24cad8f2 s ON s.id = m.id
 WHERE m.tournament_id = '24cad8f2-58a4-4e4f-997f-e4c967321da8'
   AND m.round = 'R1'
 ORDER BY m.match_order;

-- Ждём по всем восьми строкам: igrokov_net = true, schyota_net = true,
-- и новые метки из шага 2. Пары 1-8 читаются сверху вниз, как в сетке:
-- A1 и A2 оказываются в РАЗНЫХ половинах (пары 1 и 8), B1 и B2 — тоже
-- (пары 8 и 4), и так по всем пяти группам.

-- ===========================================================
-- ОТКАТ, если что-то не так. Слепок на месте.
-- ===========================================================
--
-- UPDATE public.matches m
--    SET slot1_label = s.slot1_label, slot2_label = s.slot2_label,
--        seed1 = s.seed1, seed2 = s.seed2
--   FROM public.slepok_setka_24cad8f2 s
--  WHERE m.id = s.id;
--
-- Слепок НЕ УДАЛЯТЬ, пока не посмотрим сетку глазами.

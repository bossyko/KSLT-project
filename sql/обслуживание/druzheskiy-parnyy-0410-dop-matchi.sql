-- ============================================================
-- ДРУЖЕСКИЙ ПАРНЫЙ 04.10 — ОТКРЫТЬ ДОП. МАТЧИ, ПЛЕЙ-ОФФ ПО СЛОВУ КОСТИ
-- turnir: 66f22aa4-424b-4a1e-8b51-5a2bb7c19c44
-- ============================================================
--
-- СЛОВО КОСТИ 11.10: «снять слепок и оставить только счета в группах,
-- открыть доп. матчи только для этого турнира. C2 против D3, C3 против D2.
-- Плей-офф: A1/B2, Q1(IG1)/D1, C1/Q2(IG2), A2/B1. Основной код и раскладку
-- не трогать».
--
-- ЧТО ЗДЕСЬ ПРОИСХОДИТ. Группы остаются как есть — все 18 матчей сыграны,
-- их счета не трогаются ни одной строкой. Снимается ВЕСЬ плей-офф (8
-- записей: R1, SF, F, 3RD) и собирается заново: два доп. матча плюс сетка
-- на восемь по раскладу Кости.
--
-- ПОЧЕМУ ЭТО ДАННЫЕ, А НЕ КОД. Продукт сам доп. матчей здесь не завёл бы:
-- 4 группы x 2 выхода = 8 слотов, сетка закрывается ровно, свободных мест
-- нет (bracket.js:8565 — `свободно = размер - прямые.length`). И метки
-- претендентов продукт раздаёт БЕЗ привязки к группе — Q1, Q2 по силе
-- (bracket.js:8584), а Костя привязал: C2-D3 и D2-C3. Поэтому расклад
-- вписывается прямо в записи одного турнира, а `раскладСлотов` не меняется.
--
-- ЧТО СТИРАЕТСЯ НАСОВСЕМ (слепок остаётся):
--   R1#1 Боруев/Сулейманов 6/2 Валимамедов/Кылычев  (A1-B2)
--   R1#2 Адылов/Мукаев 2/6 Ким/Курманов             (C2-D1)
--   R1#4 Товкеев/Бакытбек 1/6 Каракетов/Кыдралиев   (A2-B1)
--   SF#1 Боруев 6/5(9-7) Ким
--
-- ПОСЕВ НЕ ВЫДУМАН. В записях уже стоит s1=1 у R1#1, s2=2 у R1#4, s1=3 у
-- R1#3, s2=4 у R1#2 — то есть ровно позиции 1, 8, 5, 4 шаблона на восемь
-- (bracket.js SEED_POSITIONS[8]). Расклад Кости ложится на тот же шаблон:
-- A1-1, B1-2, C1-3, D1-4, а два слота, где раньше стояли C2 и D2, уходят
-- победителям доп. матчей.
--
-- ИМЁН ЗДЕСЬ НЕТ, И ЭТО НАМЕРЕНО. В клетки пишутся метки — C2, D3, A1,
-- IG1. Имена подставит сам продукт при первом открытии сетки:
-- `заполнитьСлоты` (bracket.js:9414) читает места группы своей же функцией
-- `calculateGroupStandings` и учитывает ручные правки мест. Так расклад не
-- спорит с тем, что видит менеджер.
--
-- МАТЧ ЗА ТРЕТЬЕ МЕСТО завожу как `upcoming`, хотя сейчас он `cancelled`:
-- отменить его можно одной кнопкой (bracket.js:6366), а вернуть отменённый
-- кнопки нет. Пусть решение остаётся за тобой.
--
-- СТАТУС ТУРНИРА НЕ ТРОГАЮ — остаётся `completed`. Ввод счёта от него не
-- зависит (кнопка «Счёт» смотрит только на обоих участников,
-- bracket.js:6058); спрятана им одна кнопка — «отменить доп. матч»
-- (bracket.js:6073).
--
-- Запускать можно повторно.

BEGIN;

-- ---- ШАГ 0: СЛЕПОК ----
DROP TABLE IF EXISTS public.slepok_dpr_1110_matches;
CREATE TABLE public.slepok_dpr_1110_matches AS
SELECT * FROM public.matches
 WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44';

DROP TABLE IF EXISTS public.slepok_dpr_1110_reg;
CREATE TABLE public.slepok_dpr_1110_reg AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44';

DROP TABLE IF EXISTS public.slepok_dpr_1110_turnir;
CREATE TABLE public.slepok_dpr_1110_turnir AS
SELECT * FROM public.tournaments
 WHERE id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44';

-- ---- ШАГ 1: ПРОВЕРКИ ДО ПРАВКИ ----
DO $$
DECLARE
    групповых     integer;
    недоигранных  integer;
    вызовов       integer;
BEGIN
    SELECT count(*) INTO групповых
      FROM public.matches
     WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
       AND group_number IS NOT NULL;
    IF групповых <> 18 THEN
        RAISE EXCEPTION 'СТОП: групповых матчей %, ждали 18', групповых;
    END IF;

    SELECT count(*) INTO недоигранных
      FROM public.matches
     WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
       AND group_number IS NOT NULL
       AND status <> 'completed';
    IF недоигранных > 0 THEN
        RAISE EXCEPTION 'СТОП: в группах не доиграно %, метки мест не сложатся', недоигранных;
    END IF;

    -- Вызов на матч ссылается на матч без ON DELETE: снос упал бы на связи
    SELECT count(*) INTO вызовов
      FROM public.challenges c
      JOIN public.matches m ON m.id = c.match_id
     WHERE m.tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
       AND m.group_number IS NULL;
    IF вызовов > 0 THEN
        RAISE EXCEPTION 'СТОП: на сносимые матчи ссылается вызовов %', вызовов;
    END IF;
END $$;

-- ---- ШАГ 2: СНОС ПЛЕЙ-ОФФА И ДОП. МАТЧЕЙ. ГРУППЫ НЕ ТРОГАЕМ ----
DELETE FROM public.matches
 WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
   AND group_number IS NULL;

-- ---- ШАГ 3: ДВА ДОП. МАТЧА ----
-- Поля те же, что ставит сам продукт (bracket.js:8812): round 'IG',
-- round_number 1, номер матча даёт метку IG1 / IG2 (bracket.js:6035).
INSERT INTO public.matches
    (tournament_id, player1_id, player2_id, slot1_label, slot2_label,
     round, round_number, match_order, group_number, status)
VALUES
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'C2', 'D3', 'IG', 1, 1, NULL, 'upcoming'),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'C3', 'D2', 'IG', 1, 2, NULL, 'upcoming');

-- ---- ШАГ 4: ПЕРВЫЙ КРУГ ПО РАСКЛАДУ КОСТИ ----
INSERT INTO public.matches
    (tournament_id, player1_id, player2_id, slot1_label, slot2_label,
     round, round_number, match_order, group_number, status, seed1, seed2)
VALUES
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'A1',  'B2',  'R1', 1, 1, NULL, 'upcoming', 1,    NULL),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'IG1', 'D1',  'R1', 1, 2, NULL, 'upcoming', NULL, 4),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'C1',  'IG2', 'R1', 1, 3, NULL, 'upcoming', 3,    NULL),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'A2',  'B1',  'R1', 1, 4, NULL, 'upcoming', NULL, 2);

-- ---- ШАГ 5: ПОЛУФИНАЛЫ, ФИНАЛ, ТРЕТЬЕ МЕСТО ----
-- Без меток: сюда приходят победители круга, их ставит продукт.
INSERT INTO public.matches
    (tournament_id, player1_id, player2_id,
     round, round_number, match_order, group_number, status)
VALUES
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'SF',  2, 1,  NULL, 'upcoming'),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'SF',  2, 2,  NULL, 'upcoming'),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, 'F',   3, 1,  NULL, 'upcoming'),
    ('66f22aa4-424b-4a1e-8b51-5a2bb7c19c44', NULL, NULL, '3RD', 3, 99, NULL, 'upcoming');

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ
-- ============================================================

-- 1. Группы целы: ждём 18 строк, все completed, и ни одного расхождения
--    со слепком по счёту и победителю (три нуля).
SELECT (SELECT count(*) FROM public.matches
         WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
           AND group_number IS NOT NULL) AS gruppovyh,
       (SELECT count(*) FROM public.matches
         WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
           AND group_number IS NOT NULL AND status = 'completed') AS igrano,
       (SELECT count(*) FROM public.slepok_dpr_1110_matches s
         WHERE s.group_number IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.id = s.id)) AS propalo,
       (SELECT count(*) FROM public.matches m
          JOIN public.slepok_dpr_1110_matches s ON s.id = m.id
         WHERE m.group_number IS NOT NULL
           AND (m.score IS DISTINCT FROM s.score
             OR m.winner_id IS DISTINCT FROM s.winner_id)) AS scheta_uehali;

-- 2. Доп. матчи и сетка: ждём 2 IG, 4 R1, 2 SF, 1 F, 1 3RD.
SELECT round, count(*) AS skolko
  FROM public.matches
 WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
   AND group_number IS NULL
 GROUP BY round ORDER BY round;

-- 3. Расклад по меткам — читается глазами и сверяется со словом Кости:
--    IG1 = C2 vs D3, IG2 = D2 vs C3,
--    R1: A1/B2, IG1/D1, C1/IG2, A2/B1.
SELECT round, match_order, slot1_label, slot2_label, seed1, seed2, status
  FROM public.matches
 WHERE tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
   AND group_number IS NULL
 ORDER BY round_number, round, match_order;

-- 4. Заявки не тронуты ни на строку: ждём три нуля.
SELECT (SELECT count(*) FROM public.slepok_dpr_1110_reg s
         WHERE NOT EXISTS (SELECT 1 FROM public.tournament_registrations r WHERE r.id = s.id)) AS propalo,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.tournament_id = '66f22aa4-424b-4a1e-8b51-5a2bb7c19c44'
           AND NOT EXISTS (SELECT 1 FROM public.slepok_dpr_1110_reg s WHERE s.id = r.id)) AS pribylo,
       (SELECT count(*) FROM public.tournament_registrations r
          JOIN public.slepok_dpr_1110_reg s USING (id)
         WHERE r.player_id    IS DISTINCT FROM s.player_id
            OR r.partner_id   IS DISTINCT FROM s.partner_id
            OR r.group_number IS DISTINCT FROM s.group_number) AS sostav_izmenilsya;

-- 5. Турнир не тронут: ждём ноль расхождений.
SELECT count(*) AS turnir_izmenilsya
  FROM public.tournaments t
  JOIN public.slepok_dpr_1110_turnir s ON s.id = t.id
 WHERE t.status            IS DISTINCT FROM s.status
    OR t.group_count       IS DISTINCT FROM s.group_count
    OR t.qualifiers_per_group IS DISTINCT FROM s.qualifiers_per_group
    OR t.match_duration    IS DISTINCT FROM s.match_duration;

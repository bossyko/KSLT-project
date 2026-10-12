-- ============================================================
-- ТЕСТОВАЯ БАЗА: ЗАВЕСТИ ИГРОКА, У КОТОРОГО ОЧКИ СПОРЯТ С ЛЕСТНИЦЕЙ
-- ============================================================
--
-- ГОНЯТЬ ТОЛЬКО В ТЕСТОВОЙ БАЗЕ (itlanqwcwygxchitaatt). В боевой этому
-- запросу делать нечего: он правит рейтинг.
--
-- ЗАЧЕМ. Проверка «карточки категорий идут по лестнице, а не по очкам»
-- (tests/e2e/design-system/76-stranica-igroka.spec.js) уходит в ПРОПУСК на
-- всех пятнадцати запусках: в тестовой базе нет ни одного игрока с двумя
-- открытыми категориями. Пропуск — это непроверенный код, и правило, ради
-- которого проверка написана, сейчас держит только заморозка.
--
-- Нужен один человек, у которого:
--   • две открытые категории,
--   • и очки СПОРЯТ со ступенью: в категории пониже набрано больше.
-- Тогда страница, сортирующая по очкам, поставит карточки наоборот, и
-- проверка упадёт — как ей и положено.
--
-- КОГО БЕРЁМ. Выбирается сам: игрок не-гость, у которого ровно ОДНА
-- открытая не-дружеская категория и у этой категории есть ступень ниже.
-- Ничего не угадываю — выбор делает запрос.
--
-- ЧТО ТРОГАЕМ. Одну строку в player_categories — добавляем вторую
-- категорию. Существующие строки не правятся ни одна.
--
-- Запускать можно повторно: вторая строка заводится один раз.

BEGIN;

-- ---- ШАГ 0: СЛЕПОК ----
DROP TABLE IF EXISTS public.slepok_pc_test_1110;
CREATE TABLE public.slepok_pc_test_1110 AS
SELECT * FROM public.player_categories;

-- ---- ШАГ 1: ЕСЛИ ТАКОЙ ИГРОК УЖЕ ЕСТЬ — НИЧЕГО НЕ ДЕЛАЕМ ----
DO $$
DECLARE уже integer;
BEGIN
    SELECT count(*) INTO уже FROM (
        SELECT pc.player_id
          FROM public.player_categories pc
          JOIN public.categories c ON c.id = pc.category_id
         WHERE pc.closed_at IS NULL AND pc.category_id <> 'friendly'
         GROUP BY pc.player_id
        HAVING count(*) >= 2
    ) т;
    IF уже > 0 THEN
        RAISE NOTICE 'Игроков с двумя открытыми категориями уже %, ничего не добавляю', уже;
    END IF;
END $$;

-- ---- ШАГ 2: ЗАВЕСТИ ВТОРУЮ КАТЕГОРИЮ ТОМУ, У КОГО ОНА ОДНА ----
-- Ступень ниже, а очков БОЛЬШЕ: ровно тот спор, который проверяется.
INSERT INTO public.player_categories (player_id, category_id, points, wins, losses)
SELECT кандидат.player_id, ниже.id, кандидат.points + 500, 3, 1
  FROM (
        SELECT pc.player_id, pc.category_id, pc.points, c.sort_order
          FROM public.player_categories pc
          JOIN public.categories c ON c.id = pc.category_id
          JOIN public.players p ON p.id = pc.player_id
         WHERE pc.closed_at IS NULL
           AND pc.category_id <> 'friendly'
           AND p.is_guest IS NOT TRUE
           AND NOT EXISTS (
               SELECT 1 FROM public.player_categories вторая
                WHERE вторая.player_id = pc.player_id
                  AND вторая.category_id <> pc.category_id
                  AND вторая.closed_at IS NULL
                  AND вторая.category_id <> 'friendly')
         ORDER BY c.sort_order DESC, pc.player_id
         LIMIT 1
       ) кандидат
  JOIN LATERAL (
        SELECT c2.id FROM public.categories c2
         WHERE c2.id <> 'friendly' AND c2.sort_order < кандидат.sort_order
         ORDER BY c2.sort_order DESC LIMIT 1
       ) ниже ON true
 WHERE NOT EXISTS (
        SELECT 1 FROM public.player_categories pc3
          JOIN public.categories c3 ON c3.id = pc3.category_id
         WHERE pc3.closed_at IS NULL AND pc3.category_id <> 'friendly'
         GROUP BY pc3.player_id HAVING count(*) >= 2)
ON CONFLICT (player_id, category_id) DO NOTHING;

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ
-- ============================================================

-- 1. Есть ли теперь игрок с двумя открытыми категориями и спором очков со
--    ступенью: ждём хотя бы одну строку, и в ней spor = true.
SELECT pc.player_id,
       string_agg(c.name || ' ' || pc.points || ' (ступень ' || c.sort_order || ')',
                  ' · ' ORDER BY c.sort_order DESC) AS kategorii,
       (array_agg(pc.points ORDER BY c.sort_order DESC))[1]
         < (array_agg(pc.points ORDER BY c.sort_order DESC))[2] AS spor
  FROM public.player_categories pc
  JOIN public.categories c ON c.id = pc.category_id
 WHERE pc.closed_at IS NULL AND pc.category_id <> 'friendly'
 GROUP BY pc.player_id
HAVING count(*) >= 2
 ORDER BY pc.player_id
 LIMIT 5;

-- 2. Старых строк не тронуто ни одной: ждём два нуля.
SELECT (SELECT count(*) FROM public.slepok_pc_test_1110 s
         WHERE NOT EXISTS (SELECT 1 FROM public.player_categories pc
                            WHERE pc.player_id = s.player_id
                              AND pc.category_id = s.category_id)) AS propalo,
       (SELECT count(*) FROM public.player_categories pc
          JOIN public.slepok_pc_test_1110 s
            ON s.player_id = pc.player_id AND s.category_id = pc.category_id
         WHERE pc.points IS DISTINCT FROM s.points
            OR pc.wins   IS DISTINCT FROM s.wins
            OR pc.losses IS DISTINCT FROM s.losses) AS izmenilos;

-- 3. Сколько строк прибыло: ждём 1 на первом прогоне и 0 на повторном.
SELECT (SELECT count(*) FROM public.player_categories)
     - (SELECT count(*) FROM public.slepok_pc_test_1110) AS pribylo;

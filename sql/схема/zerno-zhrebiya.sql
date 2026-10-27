-- ============================================================
-- ЗЕРНО ЖРЕБЬЁВКИ
-- ============================================================
--
-- Сегодня жеребьёвка зовёт Math.random() в семи местах (bracket.js: 6534,
-- 6588, 7238, 8299, 8700, 11259, 11489) и нигде не сохраняет результат.
-- Пересоздал жеребьёвку — расклад другой, и доказать, что первый был
-- честным, нечем.
--
-- Одно число всё меняет: та же цифра плюс тот же список заявок дают ту же
-- сетку, всегда и на любой машине. Отсюда три вещи:
--   ПОВТОРИТЬ — пересобрать сетку после замены, не перетасовав всех заново;
--   ПОКАЗАТЬ  — «жребий № 481 273 906» в уведомлении и в карточке турнира;
--   ПРОВЕРИТЬ — любой человек с тем же списком получит тот же расклад.
--
-- Слово «жребий» в коде уже занято: js/group-standings.js:138 помечает им
-- места, разведённые жребием при полном равенстве в группе. Поэтому столбец
-- называется draw_seed, а не zhrebiy: одно слово не должно значить двух вещей.
--
-- Запускать можно повторно.

-- 1. ДО
SELECT count(*) AS vsego_turnirov,
       count(*) FILTER (WHERE bracket_type = 'round_robin') AS gruppovyh
FROM public.tournaments;

-- 2. ПРАВКА
-- ТИП — integer, А НЕ bigint (правка 27.10, кусок 197).
-- Здесь стоял `bigint`, а в базе столбец `integer` — и файл об этом молчал:
-- `IF NOT EXISTS` на боевой не отработал (столбец уже был), а на чистой базе
-- дал бы bigint. ДВА ТИПА НА ОДНО ПОНЯТИЕ, и какой выйдет — зависит от
-- порядка применения файлов.
-- ЗАМЕР РЕШИЛ СПОР: зерно пишет `js/admin/sections/bracket.js:7412` в
-- диапазоне 1..2147483000, а генератор `js/bracket-draw.js:61` берёт
-- `% 2147483647`. Это ровно предел `integer`, и bigint тут ничего не даёт.
-- Второй объявитель того же столбца — `sql/схема/tournament-draw-seed.sql:18`,
-- там уже `integer`.
ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS draw_seed integer;

COMMENT ON COLUMN public.tournaments.draw_seed IS
  'Зерно жеребьёвки. То же зерно + тот же список заявок = тот же расклад. Пусто — жеребьёвки ещё не было';

-- 3. ПОСЛЕ: столбец есть, тип bigint, значений пока нет
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'draw_seed';

SELECT count(*) AS s_zernom
FROM public.tournaments
WHERE draw_seed IS NOT NULL;

-- 4. СТОРОЖ: зерно не должно появиться у турнира без сетки
SELECT t.id, t.title, t.draw_seed,
       (SELECT count(*) FROM public.matches m WHERE m.tournament_id = t.id) AS matchey
FROM public.tournaments t
WHERE t.draw_seed IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.tournament_id = t.id);

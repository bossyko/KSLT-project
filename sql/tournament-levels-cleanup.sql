-- Дубли в справочнике уровней турнира
-- =====================================
--
-- В tournament_levels лежат два одинаковых набора: «Категория 1–4» и
-- «Grand (ТБШ)», залитые 31 июля и 5 августа 2026 года. В админке каждое
-- название стоит в списке дважды, и от того, какое из двух выберет
-- организатор, зависит начисление очков.
--
-- Очки в обоих наборах одинаковые. Разница только в мусоре: у июльского
-- набора есть строки на 0 очков для стадий, которых не бывает, и стадии
-- продублированы в двух регистрах — '3RD' и '3rd'. Оставляем августовский.
--
-- Ни один из 127 турниров на уровень не ссылается (level_id у всех пустой),
-- так что удаление ничего не рвёт.
--
-- Перед запуском: резервная копия обеих таблиц снята 18 августа 2026.

BEGIN;

-- Смотрим, что удаляем: должно быть 5 уровней и 70 правил
SELECT count(*) AS levels_to_delete FROM tournament_levels
 WHERE created_at::date = '2026-07-31';

SELECT count(*) AS rules_to_delete FROM points_rules
 WHERE level_id IN (SELECT id FROM tournament_levels
                     WHERE created_at::date = '2026-07-31');

-- Никакой турнир на них не ссылается: должно быть 0
SELECT count(*) AS tournaments_affected FROM tournaments
 WHERE level_id IN (SELECT id FROM tournament_levels
                     WHERE created_at::date = '2026-07-31');

DELETE FROM points_rules
 WHERE level_id IN (SELECT id FROM tournament_levels
                     WHERE created_at::date = '2026-07-31');

DELETE FROM tournament_levels
 WHERE created_at::date = '2026-07-31';

-- Должно остаться 5 уровней и 30 правил
SELECT count(*) AS levels_left FROM tournament_levels;
SELECT count(*) AS rules_left FROM points_rules;

COMMIT;

-- Убрать «Четвертую»
-- ==================
--
-- Она попала в базу из первой версии переименования: в таблице начисления
-- очков пять колонок, и я завёл пятый уровень. Решили не заводить — Положение
-- описывает четыре категории, а документ ещё будет редактироваться.
--
-- Ни один турнир на неё не ссылается, правил очков у неё тоже нет.

BEGIN;

SELECT count(*) AS tournaments_affected FROM tournaments
 WHERE level_id IN (SELECT id FROM tournament_levels WHERE name = 'Четвертая');

DELETE FROM points_rules
 WHERE level_id IN (SELECT id FROM tournament_levels WHERE name = 'Четвертая');

DELETE FROM tournament_levels WHERE name = 'Четвертая';

UPDATE tournament_levels SET sort_order = 5 WHERE name = 'Итоговый турнир года (ТБШ)';

-- Проверка: пять уровней, ТБШ последним
SELECT sort_order, name, name_en FROM tournament_levels ORDER BY sort_order;

COMMIT;

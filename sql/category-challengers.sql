-- Challenger → Challengers
-- ========================
--
-- В телеграм-боте КСЛТ категория называется «Challengers», во множественном
-- числе — это тот вариант, который видят игроки. На сайте было в единственном.
-- Идентификатор остаётся прежним, меняется только видимое название.

BEGIN;

UPDATE categories
   SET name    = 'Challengers',
       name_en = 'Challengers',
       name_kg = 'Challengers'
 WHERE id = 'challenger';

SELECT sort_order, id, name FROM categories ORDER BY sort_order DESC;

COMMIT;

-- ============================================================
-- Микст FUTURES: вернуть состав групповых матчей как было — ОТКАТ
-- ============================================================
--
-- Возвращаем прежних игроков ровно в те четыре строки, которые изменила
-- правка «состав по заявкам». Счёт и победители в этих матчах не
-- трогались, поэтому таблицы групп вернутся к прежнему виду.
--
-- Запускать можно повторно.

BEGIN;

-- Группа A: в двух встречах вторым номером стоял Адхам Убайдуллаев
UPDATE public.matches
   SET player2_id = 'adham-ubaydullaev'
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND group_number = 1 AND match_order IN (4, 5);

-- Группа C: третья встреча — вторым номером Азат Мукаев
UPDATE public.matches
   SET player2_id = 'azat-mukaev'
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND group_number = 3 AND match_order = 3;

-- Группа D: третья встреча — вторым номером Алина Жакыпова
UPDATE public.matches
   SET player2_id = 'alina-zhakypova'
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND group_number = 4 AND match_order = 3;

-- Победитель — по счёту первого сета: за первым номером, если он выиграл,
-- иначе за вторым
UPDATE public.matches
   SET winner_id = CASE
           WHEN split_part(split_part(score, ' ', 1), '/', 1)::int >
                split_part(split_part(score, ' ', 1), '/', 2)::int
           THEN player1_id ELSE player2_id
       END
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
   AND ((group_number = 1 AND match_order IN (4, 5))
     OR (group_number = 3 AND match_order = 3)
     OR (group_number = 4 AND match_order = 3))
   AND status = 'completed'
   AND score ~ '^[0-9]+/[0-9]+';

COMMIT;

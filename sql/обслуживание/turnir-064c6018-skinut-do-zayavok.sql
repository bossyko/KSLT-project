-- ============================================================
-- СКИНУТЬ ТУРНИР 064c6018 ДО ЗАЯВОК. МЕНЯЕТ БАЗУ.
-- ============================================================
--
-- ДЕЛАЕТ ТО ЖЕ, ЧТО КНОПКА «ПЕРЕЖЕРЕБИТЬ» в админке, но
-- останавливается на полпути: снимает сетку и НЕ бросает новый жребий.
-- Образец читан построчно — `js/admin/sections/bracket.js:7695-7711`:
--   1. `draw_seed` в null — иначе новый бросок повторит прежний расклад
--   2. трансляции ОТВЯЗЫВАЮТСЯ от матчей, а не удаляются: они живут
--      своей жизнью (`bracket.js:7621`)
--   3. матчи сносятся
--   4. заявки `draw` → `approved`, групп, посевов и мест нет
--   5. турнир → `registration_open`
--
-- ЗАЩИТА ТА ЖЕ, ЧТО У АДМИНКИ (`bracket.js:7688`): при сыгранных матчах
-- админка пережеребить отказывается, и этот запрос тоже. Счёт
-- восстановить было бы нечем.
--
--
-- ТИП КЛЮЧА ТУРНИРА — `text`, А НЕ `uuid`. Выдумал `uuid` и получил
-- «operator does not exist: text = uuid». Померено по снимку схемы
-- `sql/схема/schema-snapshot.sql`: `tournaments.id : text`,
-- `matches.tournament_id : text`, `matches.winner_id : text`;
-- `uuid` здесь только у `matches.id` и `live_matches.match_id`.
-- ТИП СТОЛБЦА — ТАКОЕ ЖЕ ЧИСЛО, КОТОРОЕ НЕЛЬЗЯ ВЫДУМЫВАТЬ: снимок лежит
-- в репозитории, и смотреть в него дешевле, чем править после отказа.
--
-- ЧЕГО ЗАПРОС НЕ ДЕЛАЕТ НАРОЧНО: не трогает `tournament_results` и
-- `rating_history`. Если турнир подводили, очки уже разошлись по
-- карточкам игроков, и снимать их — отдельный разговор с отдельным
-- разбором, а не побочное действие сброса.

DO $$
DECLARE
    т text := '064c6018-a3cd-4abb-95e8-ed818274c86a';
    сыграно int;
    снесено int;
    вернулось int;
BEGIN
    SELECT count(*) INTO сыграно FROM matches
     WHERE tournament_id = т AND (score IS NOT NULL OR winner_id IS NOT NULL);
    IF сыграно > 0 THEN
        RAISE EXCEPTION 'В турнире % сыгранных матчей — сброс остановлен. Это та же защита, что в админке: счёт восстановить нечем.', сыграно;
    END IF;

    UPDATE tournaments SET draw_seed = NULL WHERE id = т;

    UPDATE live_matches SET match_id = NULL
     WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = т);

    WITH снятые AS (DELETE FROM matches WHERE tournament_id = т RETURNING 1)
    SELECT count(*) INTO снесено FROM снятые;

    WITH возвращённые AS (
        UPDATE tournament_registrations
           SET status = 'approved', group_number = NULL,
               seed_number = NULL, draw_position = NULL
         WHERE tournament_id = т AND status = 'draw'
        RETURNING 1)
    SELECT count(*) INTO вернулось FROM возвращённые;

    UPDATE tournaments SET status = 'registration_open' WHERE id = т;

    RAISE NOTICE 'Снесено матчей: %, заявок возвращено в approved: %', снесено, вернулось;
END $$;

-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»:
SELECT  t.status                                        AS status_turnira,
        t.draw_seed,
        (SELECT count(*) FROM matches m
          WHERE m.tournament_id = t.id)                 AS matchey_ostalos,
        (SELECT count(*) FROM tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'draw')     AS v_setke,
        (SELECT count(*) FROM tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'approved') AS v_zayavkah,
        (SELECT count(*) FROM tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'waitlist') AS v_ozhidanii
FROM    tournaments t
WHERE   t.id = '064c6018-a3cd-4abb-95e8-ed818274c86a';

-- ЖДЁМ: status_turnira = registration_open, draw_seed пусто,
--       matchey_ostalos = 0, v_setke = 0, заявки на месте.

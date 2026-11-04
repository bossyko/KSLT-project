-- СЛИТЬ ДВЕ КАРТОЧКИ МУРАТА В ОДНУ. 04.11
--
-- Слово Кости 04.11: «он один — играл в 2 категориях». Подтверждено
-- замером: вместе в одном турнире они не стоят НИГДЕ, а это и есть
-- признак двух разных людей (правило 30.09). Его нет — значит один.
--
-- ОСТАЁТСЯ `murat-noruzbaev` («Мурат Норзубаев», 725 очков): за ней 10
-- матчей и 13 строк истории против 4 и 1. Имя оставляем как есть —
-- слово Кости.
-- ПРЕДПОЛОЖЕНИЕ, И Я ЕГО НАЗЫВАЮ: домашний разряд остаётся `tour`, как у
-- принимающей карточки. Очки по ОБЕИМ категориям сольются — они лежат в
-- `player_categories` и пересчитываются из истории в конце.
--
-- ПЕРЕНОСИТСЯ ВСЁ ДЕСЯТЬ МЕСТ, найденных по каталогу внешних ключей, а
-- не те, про которые я помню:
--   matches ×3 · player_badges · player_categories · profiles ·
--   rating_history · tournament_registrations ×2 · tournament_results
--
-- ДВА МЕСТА С ПОДВОХОМ. `player_badges` уникальна по (игрок, значок),
-- `player_categories` — по (игрок, категория). Общий значок или общая
-- категория уронили бы прямой перенос, поэтому: что у принимающей уже
-- есть — удаляется у второй, остальное переносится.
--
-- ПОРЯДОК ВАЖЕН: история переносится ДО пересчёта. Наоборот — очки лягут
-- мимо; ровно эту беду чинили коммитом `4c3dca9` 06.10.
--
-- ВСЁ ОДНОЙ СДЕЛКОЙ. Любая осечка отменяет её целиком.

BEGIN;

-- ---- 0. ЗАСЛОН: ОНИ НЕ ИГРАЛИ ДРУГ С ДРУГОМ ----
-- Если найдётся матч, где стоят обе, — это ДВА человека, и сливать
-- нельзя. Сделка остановится, не тронув ничего.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.matches
                WHERE (player1_id = 'murat-noruzbaev'   AND player2_id = 'murat-noruzbaev-2')
                   OR (player1_id = 'murat-noruzbaev-2' AND player2_id = 'murat-noruzbaev')) THEN
        RAISE EXCEPTION 'ОСТАНОВ: эти двое играли ДРУГ С ДРУГОМ — значит это разные люди';
    END IF;
END $$;

-- ---- 1. МАТЧИ ----
UPDATE public.matches SET player1_id = 'murat-noruzbaev' WHERE player1_id = 'murat-noruzbaev-2';
UPDATE public.matches SET player2_id = 'murat-noruzbaev' WHERE player2_id = 'murat-noruzbaev-2';
UPDATE public.matches SET winner_id  = 'murat-noruzbaev' WHERE winner_id  = 'murat-noruzbaev-2';

-- ---- 2. ЗНАЧКИ ----
-- Общий значок у принимающей уже есть — второй экземпляр просто лишний.
DELETE FROM public.player_badges b
 WHERE b.player_id = 'murat-noruzbaev-2'
   AND EXISTS (SELECT 1 FROM public.player_badges o
                WHERE o.player_id = 'murat-noruzbaev' AND o.badge_id = b.badge_id);
UPDATE public.player_badges SET player_id = 'murat-noruzbaev'
 WHERE player_id = 'murat-noruzbaev-2';

-- ---- 3. КАТЕГОРИИ ----
-- Общая категория пересчитается из истории в конце, поэтому лишнюю
-- строку убираем, а не складываем числа руками.
DELETE FROM public.player_categories c
 WHERE c.player_id = 'murat-noruzbaev-2'
   AND EXISTS (SELECT 1 FROM public.player_categories o
                WHERE o.player_id = 'murat-noruzbaev' AND o.category_id = c.category_id);
UPDATE public.player_categories SET player_id = 'murat-noruzbaev'
 WHERE player_id = 'murat-noruzbaev-2';

-- ---- 4. УЧЁТНАЯ ЗАПИСЬ ----
-- Вход человека был привязан ко ВТОРОЙ карточке, а игры — к первой.
-- Это и есть главный шов: без переноса человек вошёл бы и не увидел
-- своих матчей.
UPDATE public.profiles SET player_id = 'murat-noruzbaev'
 WHERE player_id = 'murat-noruzbaev-2';

-- ---- 5. ИСТОРИЯ, ЗАЯВКИ, РЕЗУЛЬТАТЫ ----
UPDATE public.rating_history SET player_id = 'murat-noruzbaev'
 WHERE player_id = 'murat-noruzbaev-2';
UPDATE public.tournament_registrations SET player_id = 'murat-noruzbaev'
 WHERE player_id = 'murat-noruzbaev-2';
UPDATE public.tournament_registrations SET partner_id = 'murat-noruzbaev'
 WHERE partner_id = 'murat-noruzbaev-2';
UPDATE public.tournament_results SET player_id = 'murat-noruzbaev'
 WHERE player_id = 'murat-noruzbaev-2';

-- ---- 6. ПУСТАЯ КАРТОЧКА УХОДИТ ----
DELETE FROM public.players WHERE id = 'murat-noruzbaev-2';

-- ---- 7. ПЕРЕСЧЁТ — ПОСЛЕ ПЕРЕНОСА ИСТОРИИ, А НЕ ДО ----
SELECT public.recalc_player_categories(ARRAY['murat-noruzbaev']);

COMMIT;


-- ---- ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА ТАБЛИЦА ------------------------
-- Ждём: vtoroy_net = 0, sledov_vtorogo = 0, uchyotka = 1,
-- matchey = 14, istorii = 14, zayavok = 6, kategoriy = 2 или 3.

SELECT (SELECT count(*) FROM public.players WHERE id = 'murat-noruzbaev-2')        AS vtoroy_net,
       (SELECT count(*) FROM public.matches
         WHERE 'murat-noruzbaev-2' IN (player1_id, player2_id, winner_id))         AS sledov_vtorogo,
       (SELECT name   FROM public.players WHERE id = 'murat-noruzbaev')            AS imya,
       (SELECT points FROM public.players WHERE id = 'murat-noruzbaev')            AS ochki,
       (SELECT count(*) FROM public.profiles  WHERE player_id = 'murat-noruzbaev') AS uchyotka,
       (SELECT count(*) FROM public.matches
         WHERE 'murat-noruzbaev' IN (player1_id, player2_id))                      AS matchey,
       (SELECT count(*) FROM public.rating_history
         WHERE player_id = 'murat-noruzbaev')                                      AS istorii,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE player_id = 'murat-noruzbaev' OR partner_id = 'murat-noruzbaev')    AS zayavok,
       (SELECT count(*) FROM public.player_categories
         WHERE player_id = 'murat-noruzbaev')                                      AS kategoriy;

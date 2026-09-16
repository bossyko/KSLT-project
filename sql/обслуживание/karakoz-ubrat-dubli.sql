-- ============================================================
-- Каракөз и Жакшылык — это Каракоз Болотбекова и Жакшылык Айтбаев
-- ============================================================
--
-- В форме на микст-Futures эта пара записалась одними именами, без фамилий,
-- да ещё кыргызской раскладкой: «Каракөз». Сверка с карточками искала по
-- совпадению слов и никого не нашла — пару завели гостями, хотя карточки в
-- клубе есть. Получились двойники одних и тех же людей.
--
-- Переставляем заявку на настоящие карточки и убираем двойников. Никаких
-- матчей за ними не числится: пара стоит в листе ожидания и в сетку не
-- попадала — проверка ниже это подтвердит.
--
-- Запускать можно повторно.

BEGIN;

UPDATE public.tournament_registrations
   SET player_id  = 'karakoz-bolotbekova'
 WHERE player_id  = 'karakoz';

UPDATE public.tournament_registrations
   SET partner_id = 'zhakshylyk-aytbaev'
 WHERE partner_id = 'zhakshylyk';

-- Двойники уходят только если за ними ничего не осталось: чужой след важнее
-- нашей уборки
DELETE FROM public.players p
 WHERE p.id IN ('karakoz', 'zhakshylyk')
   AND NOT EXISTS (SELECT 1 FROM public.matches m
                    WHERE m.player1_id = p.id OR m.player2_id = p.id)
   AND NOT EXISTS (SELECT 1 FROM public.tournament_registrations r
                    WHERE r.player_id = p.id OR r.partner_id = p.id);

COMMIT;

-- ---- Проверка ----

SELECT 'двойники остались' AS что, count(*) AS сколько
  FROM public.players WHERE id IN ('karakoz', 'zhakshylyk')
UNION ALL
SELECT 'заявка на настоящих карточках', count(*)
  FROM public.tournament_registrations
 WHERE player_id = 'karakoz-bolotbekova' AND partner_id = 'zhakshylyk-aytbaev';
-- Ожидаем: двойников 0, заявка 1.

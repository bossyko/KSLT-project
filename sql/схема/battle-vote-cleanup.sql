-- ПРИМЕНЁН 09.10. БОЛЬШЕ НЕ ГОНЯТЬ.
--
-- Прогнал Костя, тремя отдельными прогонами (редактор Supabase спотыкается
-- на теле функции в `$$`, если давать всё одним куском). ПРОВЕРЕНО ЧТЕНИЕМ
-- БАЗЫ, а не ответом «Success»: столбца predicted_winner_id — 0, моста
-- trg_fill_prediction_side — 0, голосов — 0, форма get_battle_votes стала
-- `TABLE(side smallint, votes bigint)`.
--
-- Слепок slepok_predictions_winner_0810 вышел ПУСТЫМ: голосов в базе не
-- было ни одного. Удалять столбец было нечему, но слепок всё равно снят
-- первым — порядок не зависит от того, чем он окажется.
--
-- Сторож «голос ни за одну из сторон» не исчез, а ПЕРЕЕХАЛ из правила в
-- столбец: predicted_side стал NOT NULL. В столбце надёжнее.
--
-- Ниже — что именно делалось, как есть.
--
-- --------------------------------------------------------------------
-- КОД ЭТОТ ФАЙЛ БОЛЬШЕ НЕ ДЕРЖАЛ — НО ОН УДАЛЯЛ СТОЛБЕЦ, И ЭТО НАВСЕГДА.
--
-- ЧТО БЫЛО. 09.10 файл гонять было нельзя: он меняет форму
-- `get_battle_votes` на `(side, votes)`, БЕЗ `player_id`, а по `player_id`
-- читали два места — js/admin/sections/challenges.js (голоса во «Вызовах»)
-- и js/challenge-detail.js (точность прогноза). Оба переведены на сторону
-- 09.10, и теперь в проекте НИ ОДНОГО читателя по игроку: заморожено
-- правилами в tools/check-golosa-storony.js, прувер 4 из 4. Столбца
-- `predicted_winner_id` в коде нет вовсе — тоже под правилом.
--
-- ЧТО ОСТАЛОСЬ. Шаг 2 делает `DROP COLUMN predicted_winner_id` —
-- НЕВОЗВРАТНО. Поэтому ниже добавлен ШАГ 0: слепок. Урок 01.10 стоил 58
-- счетов, которые восстановить было нечем.
--
-- ПОРЯДОК: шаг 0, шаг 1, и только если шаг 1 показал ноль — шаги 2, 3, 4.
-- Каждый отдельным прогоном. Решение о прогоне — за Костей.
--

-- ---- 0. СЛЕПОК. Копия того, что столбец унесёт с собой ------------------
CREATE TABLE IF NOT EXISTS public.slepok_predictions_winner_0810 AS
SELECT id, challenge_id, predicted_winner_id, predicted_side, now() AS snyato
  FROM public.challenge_predictions;

SELECT count(*)                                            AS golosov,
       count(predicted_winner_id)                          AS s_igrokom,
       count(*) FILTER (WHERE predicted_side IS NULL)       AS bez_storony
  FROM public.slepok_predictions_winner_0810;

-- `bez_storony` обязан быть НОЛЬ. Иначе шаг 2 поставит NOT NULL и упадёт,
-- а голоса без стороны останутся без игрока И без стороны.

-- ============================================
-- Уборка после перехода голосования на стороны
-- ============================================
--
-- Запускать ТОЛЬКО когда обновлены сайт, приложение и Edge Functions.
-- До этого момента старый код пишет и читает predicted_winner_id, и правило
-- в базе переводит одно в другое.
--
-- Проверить, что можно: в challenge_predictions за последние дни у всех
-- новых строк заполнен predicted_side. Если да — мост больше не нужен.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter.


-- ---- 1. Точно ли можно ---------------------------------------------------
-- Голоса, у которых сторона проставлена только правилом, а не кодом,
-- отличить нельзя. Поэтому смотрим проще: есть ли вообще голоса без стороны
SELECT count(*) AS голосов_без_стороны
FROM challenge_predictions WHERE predicted_side IS NULL;


-- ---- 2. Убираем мост -----------------------------------------------------
DROP TRIGGER IF EXISTS trg_fill_prediction_side ON public.challenge_predictions;
DROP FUNCTION IF EXISTS public.fill_prediction_side();

ALTER TABLE challenge_predictions ALTER COLUMN predicted_side SET NOT NULL;
ALTER TABLE challenge_predictions DROP COLUMN IF EXISTS predicted_winner_id;


-- ---- 3. Подсчёт голосов без лишней колонки -------------------------------
DROP FUNCTION IF EXISTS public.get_battle_votes(uuid);

CREATE OR REPLACE FUNCTION public.get_battle_votes(p_challenge_id uuid)
RETURNS TABLE(side smallint, votes bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT predicted_side AS side, count(*) AS votes
    FROM challenge_predictions
    WHERE challenge_id = p_challenge_id
    GROUP BY predicted_side;
$$;

ALTER FUNCTION public.get_battle_votes(uuid) OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_battle_votes(uuid) TO anon;
GRANT ALL ON FUNCTION public.get_battle_votes(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_battle_votes(uuid) TO service_role;


-- ---- 4. ПРОВЕРКА ---------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenge_predictions'
        AND column_name = 'predicted_winner_id')          AS старая_колонка,
    (SELECT count(*) FROM pg_trigger
      WHERE tgrelid = 'public.challenge_predictions'::regclass
        AND tgname = 'trg_fill_prediction_side')          AS мост,
    (SELECT count(*) FROM challenge_predictions)          AS голосов;

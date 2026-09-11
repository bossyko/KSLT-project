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

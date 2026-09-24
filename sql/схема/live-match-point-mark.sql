-- ═════════════════════════════════════════════════════════════════════════
-- КСЛТ · МЕТКА РОЗЫГРЫША: ЭЙС И ДВОЙНАЯ
-- Решение Кости 24.09. Запускать ПОСЛЕ live-match-point-log.sql.
--
-- ПОЧЕМУ ТОЛЬКО ЭЙС И ДВОЙНАЯ. Проверено, как устроено у больших: судья на
-- вышке ведёт журнал розыгрышей и данные подачи, а «виннер» и «невынужденную»
-- считают ОТДЕЛЬНЫЕ логгеры у корта. У нас один человек с телефоном. Просить
-- его судить ещё и качество удара — значит получить медленного судью и
-- данные, которым нельзя верить. Берём только то, что судья и так объявляет
-- вслух и где суждения не требуется.
--
-- ПОЧЕМУ БЕЗ ПЕРВОЙ И ВТОРОЙ ПОДАЧИ. Решение Кости: одно касание на розыгрыш
-- остаётся одним. Значит двойная отмечается судьёй прямо, а не выводится из
-- двух промахов.
--
-- ПОЧЕМУ МЕТКА НЕОБЯЗАТЕЛЬНА. Судья может не успеть. NULL здесь значит
-- «не отмечено», а НЕ «обычный розыгрыш»: лента зрителя обязана молчать, а не
-- утверждать, что эйса не было.
-- ═════════════════════════════════════════════════════════════════════════

ALTER TABLE public.live_match_points
    ADD COLUMN IF NOT EXISTS mark text
    CHECK (mark IN ('ace', 'double'));

COMMENT ON COLUMN public.live_match_points.mark IS
    'Метка розыгрыша: ace — эйс, double — двойная ошибка. NULL значит «судья не отметил», а не «ничего из этого не было».';

-- МЕТКА СТАВИТСЯ ПО НОМЕРУ РОЗЫГРЫША, А НЕ НА «ПОСЛЕДНИЙ».
-- Первым заходом я написал «последний» — и это была дыра: запись розыгрыша
-- уходит в базу асинхронно, а судья жмёт метку сразу. Если сеть чуть
-- задержала вставку, «последним» оказывалось ПРЕДЫДУЩЕЕ очко, и эйс
-- доставался не тому розыгрышу. Номер судейский модуль получает от
-- umpire_log_point и передаёт сюда — промахнуться больше негде.
--
-- Отмена очка уносит метку вместе со строкой: отдельной уборки не нужно.
CREATE OR REPLACE FUNCTION public.umpire_mark_point(p_key text, p_seq integer, p_mark text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_id uuid;
    v_seq      integer;
BEGIN
    IF p_mark IS NOT NULL AND p_mark NOT IN ('ace', 'double') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'неизвестная метка');
    END IF;

    SELECT id INTO v_match_id FROM public.live_matches WHERE umpire_key = p_key;
    IF v_match_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ключ не найден');
    END IF;

    UPDATE public.live_match_points
       SET mark = p_mark
     WHERE match_id = v_match_id
       AND seq = p_seq
    RETURNING seq INTO v_seq;

    IF v_seq IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'розыгрыш не найден');
    END IF;

    RETURN jsonb_build_object('ok', true, 'seq', v_seq, 'mark', p_mark);
END;
$$;

ALTER FUNCTION public.umpire_mark_point(text, integer, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.umpire_mark_point(text, integer, text) TO anon;
GRANT EXECUTE ON FUNCTION public.umpire_mark_point(text, integer, text) TO authenticated;

-- ── ПРОВЕРКА ЧТЕНИЕМ, а не ответом «Success» ─────────────────────────────
SELECT 'колонка mark' AS что, count(*)::text AS сколько
  FROM information_schema.columns
 WHERE table_name = 'live_match_points' AND column_name = 'mark'
UNION ALL
SELECT 'функция umpire_mark_point', count(*)::text
  FROM pg_proc WHERE proname = 'umpire_mark_point';
-- Ждём: колонка 1, функция 1.

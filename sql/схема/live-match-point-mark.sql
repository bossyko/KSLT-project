-- ═════════════════════════════════════════════════════════════════════════
-- КСЛТ · ЭЙС И ДВОЙНАЯ
-- Запускать ПОСЛЕ live-match-point-log.sql.
--
-- ПЕРЕПИСАНО 25.09 — ПОПРАВКА К СЕБЕ. В первой редакции этого файла метка
-- была ОТДЕЛЬНЫМ действием: судья жал очко, потом успевал нажать «эйс», и
-- функция umpire_mark_point ставила метку ПО НОМЕРУ розыгрыша. Проверено
-- руками на стенде 25.09: окно метки не открывалось НИ РАЗУ — экран
-- перерисовывался раньше, чем база возвращала номер.
--
-- Решение Кости 25.09: ЭЙС И ДВОЙНАЯ — ЭТО САМО ОЧКО.
--   эйс     → очко ПОДАЮЩЕМУ;
--   двойная → очко ПРИНИМАЮЩЕМУ.
-- Метка едет внутри той же записи розыгрыша. Номер больше не нужен, гонки с
-- сетью нет, отдельной функции нет. Файл ДО ЭТОГО ДНЯ НЕ ЗАПУСКАЛСЯ, так что
-- мёртвая функция в базе не осталась — но DROP ниже стоит на случай, если
-- старая редакция где-то успела примениться.
--
-- ПОЧЕМУ ТОЛЬКО ЭЙС И ДВОЙНАЯ. У больших турниров «виннер» и «невынужденную»
-- считает ОТДЕЛЬНЫЙ логгер у корта, а судья в кресле ведёт счёт и подачу. У
-- нас один человек с телефоном. Берём только то, что судья и так объявляет
-- вслух и где суждения не требуется.
--
-- ПОЧЕМУ БЕЗ ПЕРВОЙ И ВТОРОЙ ПОДАЧИ. Решение Кости 24.09: одно касание на
-- розыгрыш остаётся одним. Двойная отмечается прямо, а не выводится из двух
-- промахов.
--
-- ПОЧЕМУ NULL. Метка необязательна: обычный розыгрыш судья отмечает обычной
-- кнопкой очка. NULL значит «ничего не отмечено», а НЕ «эйса не было» —
-- лента зрителя обязана молчать, а не утверждать.
-- ═════════════════════════════════════════════════════════════════════════

ALTER TABLE public.live_match_points
    ADD COLUMN IF NOT EXISTS mark text
    CHECK (mark IN ('ace', 'double'));

COMMENT ON COLUMN public.live_match_points.mark IS
    'Метка розыгрыша: ace — эйс (очко подающему), double — двойная (очко принимающему). NULL значит «не отмечено», а не «ничего из этого не было».';

-- ── ЗАПИСЬ РОЗЫГРЫША ПРИНИМАЕТ МЕТКУ ────────────────────────────────────
-- Единственное отличие от live-match-point-log.sql — колонка mark. Функция
-- переписана целиком, потому что CREATE OR REPLACE иначе не умеет.
CREATE OR REPLACE FUNCTION public.umpire_log_point(p_key text, p_entry jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_id uuid;
    v_seq      integer;
    v_mark     text;
BEGIN
    SELECT id INTO v_match_id FROM public.live_matches WHERE umpire_key = p_key;
    IF v_match_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ключ не найден');
    END IF;

    v_mark := NULLIF(p_entry->>'mark', '');
    IF v_mark IS NOT NULL AND v_mark NOT IN ('ace', 'double') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'неизвестная метка');
    END IF;

    SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq
      FROM public.live_match_points WHERE match_id = v_match_id;

    INSERT INTO public.live_match_points
        (match_id, seq, set_no, game_no, winner, p1, p2, g1, g2, game_won, is_break, is_tiebreak, mark)
    VALUES (
        v_match_id,
        v_seq,
        COALESCE((p_entry->>'set_no')::smallint, 1),
        COALESCE((p_entry->>'game_no')::smallint, 1),
        (p_entry->>'winner')::smallint,
        COALESCE(p_entry->>'p1', '0'),
        COALESCE(p_entry->>'p2', '0'),
        COALESCE((p_entry->>'g1')::smallint, 0),
        COALESCE((p_entry->>'g2')::smallint, 0),
        NULLIF(p_entry->>'game_won', '')::smallint,
        COALESCE((p_entry->>'is_break')::boolean, false),
        COALESCE((p_entry->>'is_tiebreak')::boolean, false),
        v_mark
    );

    RETURN jsonb_build_object('ok', true, 'seq', v_seq);
END;
$$;

ALTER FUNCTION public.umpire_log_point(text, jsonb) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.umpire_log_point(text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.umpire_log_point(text, jsonb) TO authenticated;

-- ── ОТДЕЛЬНАЯ ФУНКЦИЯ МЕТКИ БОЛЬШЕ НЕ НУЖНА ─────────────────────────────
-- Она и была источником беды: метка уходила вторым вызовом и ждала номер.
DROP FUNCTION IF EXISTS public.umpire_mark_point(text, integer, text);

-- ── ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS» ────────────────────────────
-- Колонка на месте, старой функции нет, новая принимает mark.
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'live_match_points' AND column_name = 'mark')          AS колонка_mark,
    (SELECT count(*) FROM pg_proc WHERE proname = 'umpire_mark_point')          AS старая_функция_должна_быть_0,
    (SELECT count(*) FROM pg_proc WHERE proname = 'umpire_log_point')           AS функция_записи;

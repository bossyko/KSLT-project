-- ═════════════════════════════════════════════════════════════════════════
-- КСЛТ · ЖУРНАЛ РОЗЫГРЫШЕЙ ЖИВОГО МАТЧА
-- Заводится 24.09.2026. Запускает Костя.
--
-- ЗАЧЕМ. Странице матча нужен «ход матча» — что происходило, а не только
-- какой счёт сейчас. Поля points_p1 / points_p2 хранят ОДНО значение и
-- затираются каждым следующим розыгрышем.
--
-- ПОЧЕМУ НЕ ПОЛЕ history. Оно уже есть в live_matches, но это судейский
-- СТЕК ОТМЕНЫ (js/umpire.js:41-52): полные снимки состояния, потолок 200,
-- и снимок кладётся туда на каждое действие, включая смену статуса.
-- Строить на нём ленту зрителя — значит показывать людям внутренности
-- кнопки «отменить». Журнал заводится отдельно и хранит РОЗЫГРЫШИ.
--
-- ОТМЕНА СУДЬИ ЧЕСТНО УБИРАЕТ ЗАПИСЬ. Если судья нажал «отменить», этого
-- розыгрыша не было — он уходит и из ленты. Это не потеря истории, это её
-- правка тем, кто её ведёт.
--
-- ЗАПИСЬ ТОЛЬКО ФУНКЦИЕЙ. Судейский модуль работает анонимно и
-- удостоверяется ключом umpire_key, как и umpire_save_state. Поэтому
-- anon не получает права писать в таблицу: он вызывает функцию, а она
-- сама проверяет ключ.
-- ═════════════════════════════════════════════════════════════════════════

-- ── 1. ТАБЛИЦА ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_match_points (
    id          bigserial PRIMARY KEY,
    match_id    uuid        NOT NULL REFERENCES public.live_matches(id) ON DELETE CASCADE,
    seq         integer     NOT NULL,             -- порядковый номер розыгрыша в матче
    set_no      smallint    NOT NULL,
    game_no     smallint    NOT NULL,             -- номер гейма внутри сета
    winner      smallint    NOT NULL CHECK (winner IN (1, 2)),
    p1          text        NOT NULL,             -- счёт в гейме ПОСЛЕ розыгрыша
    p2          text        NOT NULL,
    g1          smallint    NOT NULL,             -- геймов в текущем сете ПОСЛЕ
    g2          smallint    NOT NULL,
    game_won    smallint             CHECK (game_won IN (1, 2)),  -- этим очком взят гейм
    is_break    boolean     NOT NULL DEFAULT false,
    is_tiebreak boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (match_id, seq)
);

COMMENT ON TABLE public.live_match_points IS
    'Журнал розыгрышей живого матча. Пишется судейским модулем через umpire_log_point, отменяется через umpire_undo_point. Не путать с live_matches.history — то стек отмены.';

CREATE INDEX IF NOT EXISTS live_match_points_match_seq_idx
    ON public.live_match_points (match_id, seq);

-- ── 2. ДОСТУП ────────────────────────────────────────────────────────────
ALTER TABLE public.live_match_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_match_points_public_read" ON public.live_match_points;
CREATE POLICY "live_match_points_public_read"
    ON public.live_match_points FOR SELECT USING (true);

-- Прямой записи нет ни у кого: только функции ниже, они SECURITY DEFINER.
-- Уборка за собой — у персонала, теми же правами, что и у самих матчей.
DROP POLICY IF EXISTS "live_match_points_staff_delete" ON public.live_match_points;
CREATE POLICY "live_match_points_staff_delete"
    ON public.live_match_points FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
    ));

-- ── 3. ЗАПИСЬ РОЗЫГРЫША ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.umpire_log_point(p_key text, p_entry jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_id uuid;
    v_seq      integer;
BEGIN
    SELECT id INTO v_match_id FROM public.live_matches WHERE umpire_key = p_key;
    IF v_match_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ключ не найден');
    END IF;

    SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq
      FROM public.live_match_points WHERE match_id = v_match_id;

    INSERT INTO public.live_match_points
        (match_id, seq, set_no, game_no, winner, p1, p2, g1, g2, game_won, is_break, is_tiebreak)
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
        COALESCE((p_entry->>'is_tiebreak')::boolean, false)
    );

    RETURN jsonb_build_object('ok', true, 'seq', v_seq);
END;
$$;

ALTER FUNCTION public.umpire_log_point(text, jsonb) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.umpire_log_point(text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.umpire_log_point(text, jsonb) TO authenticated;

-- ── 4. ОТМЕНА ПОСЛЕДНЕГО РОЗЫГРЫША ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.umpire_undo_point(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_match_id uuid;
    v_seq      integer;
BEGIN
    SELECT id INTO v_match_id FROM public.live_matches WHERE umpire_key = p_key;
    IF v_match_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ключ не найден');
    END IF;

    DELETE FROM public.live_match_points
     WHERE match_id = v_match_id
       AND seq = (SELECT MAX(seq) FROM public.live_match_points WHERE match_id = v_match_id)
    RETURNING seq INTO v_seq;

    RETURN jsonb_build_object('ok', true, 'removed', v_seq);
END;
$$;

ALTER FUNCTION public.umpire_undo_point(text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.umpire_undo_point(text) TO anon;
GRANT EXECUTE ON FUNCTION public.umpire_undo_point(text) TO authenticated;

-- ── 5. ЖИВОЕ ОБНОВЛЕНИЕ ──────────────────────────────────────────────────
-- Чтобы страница матча получала новый розыгрыш сразу, а не ждала опроса.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'live_match_points'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_points;
    END IF;
END $$;

-- ── 6. ИМЯ СПОНСОРА МАТЧА ────────────────────────────────────────────────
-- Логотип в базе был с самого начала (sponsor_logo) и рисовался только на
-- табло для зала. Имени не было, и картинка подписывалась alt="Sponsor" —
-- диктор читал «Sponsor». Решение Кости 24.09: имя завести.
ALTER TABLE public.live_matches
    ADD COLUMN IF NOT EXISTS sponsor_name text;

COMMENT ON COLUMN public.live_matches.sponsor_name IS
    'Имя спонсора матча. Может не быть в таблице sponsors: матч бывает спонсирован кем угодно, админка просто вписывает имя и грузит логотип.';

-- ── 7. ПРОВЕРКА ЧТЕНИЕМ ──────────────────────────────────────────────────
-- Результат запроса проверяется ЧТЕНИЕМ БАЗЫ, а не ответом «Success».
SELECT 'таблица' AS что, count(*)::text AS сколько FROM public.live_match_points
UNION ALL
SELECT 'функции', count(*)::text FROM pg_proc
 WHERE proname IN ('umpire_log_point', 'umpire_undo_point')
UNION ALL
SELECT 'колонка sponsor_name', count(*)::text FROM information_schema.columns
 WHERE table_name = 'live_matches' AND column_name = 'sponsor_name'
UNION ALL
SELECT 'в realtime', count(*)::text FROM pg_publication_tables
 WHERE pubname = 'supabase_realtime' AND tablename = 'live_match_points';
-- Ждём: функции 2, колонка 1, в realtime 1.

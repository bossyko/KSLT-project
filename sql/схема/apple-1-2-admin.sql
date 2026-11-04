-- ============================================================================
-- КСЛТ · Apple 1.2 — ЧТО ВИДИТ РАЗБИРАЮЩИЙ
-- 04.11.2026. Прогонять ПОСЛЕ `apple-1-2-zaslon.sql`. Повторно — можно.
-- ============================================================================
--
-- ЗАЧЕМ. Право читать жалобы у сотрудника уже есть (политика
-- `content_reports_select_own_or_staff`), но ЧИТАТЬ ИХ НЕЧЕМ: имя
-- пожаловавшегося лежит в `profiles`, имя того, на кого жалуются, — в
-- `players`, а связывает их `profiles.player_id`. Собирать это в админке
-- значит завести три запроса и порядок между ними.
--
-- ЗАЩИТА, КОТОРУЮ НИКТО НЕ МОЖЕТ ПРОЧИТАТЬ, НЕ ЗАЩИЩАЕТ — правило Кости
-- от 03.11, которым мы убрали спрос причины при перестановке мест. Здесь
-- оно же: без этих функций требование Apple «timely responses» выполнить
-- нечем, потому что отвечать не на что смотреть.

BEGIN;

-- ── 1. ОЧЕРЕДЬ ЖАЛОБ ─────────────────────────────────────────────────────
-- СТАРЫЕ СВЕРХУ, И ЭТО НЕ ВКУС: срок разбора — трое суток, значит первым
-- показывается то, что ближе всего к его нарушению.
CREATE OR REPLACE FUNCTION public.kslt_zhaloby(p_status text DEFAULT 'new')
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v jsonb;
BEGIN
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    SELECT coalesce(jsonb_agg(ряд ORDER BY ряд->>'created_at'), '[]'::jsonb)
      INTO v
      FROM (
        SELECT jsonb_build_object(
                 'id',          r.id,
                 'created_at',  r.created_at,
                 'chasov',      floor(extract(epoch FROM now() - r.created_at) / 3600),
                 'reason',      r.reason,
                 'note',        r.note,
                 'status',      r.status,
                 'target_kind', r.target_kind,
                 'kto',         coalesce(kto.full_name, '—'),
                 'na_kogo',     coalesce(pl.name, cel.full_name, '—'),
                 'player_id',   cel.player_id,
                 'battle_id',   CASE WHEN r.target_kind = 'battle' THEN r.target_id END
               ) AS ряд
          FROM content_reports r
          LEFT JOIN profiles kto ON kto.id = r.reporter_profile_id
          LEFT JOIN profiles cel ON cel.id = r.target_id
          LEFT JOIN players  pl  ON pl.id  = cel.player_id
         WHERE (p_status IS NULL OR p_status = '' OR r.status = p_status)
      ) s;

    RETURN v;
END;
$function$;

-- ── 2. РЕШЕНИЕ ПО ЖАЛОБЕ ─────────────────────────────────────────────────
-- СЛЕД ОСТАЁТСЯ ВСЕГДА: кто разобрал и когда. Это не журнал ради журнала —
-- Apple спрашивает именно о сроке ответа, и доказывать его нечем, если
-- время решения нигде не записано.
CREATE OR REPLACE FUNCTION public.kslt_razobrat_zhalobu(p_id uuid, p_reshenie text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_bylo text;
BEGIN
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;
    IF p_reshenie NOT IN ('reviewed', 'removed', 'rejected') THEN
        RETURN jsonb_build_object('error', 'bad_reshenie');
    END IF;

    SELECT status INTO v_bylo FROM content_reports WHERE id = p_id;
    IF v_bylo IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    UPDATE content_reports
       SET status = p_reshenie, reviewed_at = now(), reviewed_by = auth.uid()
     WHERE id = p_id;

    RETURN jsonb_build_object('ok', true, 'bylo', v_bylo, 'stalo', p_reshenie);
END;
$function$;

-- ── 3. ВСЕ БЛОКИРОВКИ — ТОЛЬКО ЧТЕНИЕ ────────────────────────────────────
-- СНИМАТЬ ЧУЖУЮ БЛОКИРОВКУ АДМИН НЕ МОЖЕТ, И ФУНКЦИИ ДЛЯ ЭТОГО НЕТ.
-- Это выбор человека, а не наш: видеть картину — да, вмешиваться — нет.
CREATE OR REPLACE FUNCTION public.kslt_blokirovki_vse()
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v jsonb;
BEGIN
    IF NOT public.is_staff() THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    SELECT coalesce(jsonb_agg(ряд ORDER BY ряд->>'created_at' DESC), '[]'::jsonb)
      INTO v
      FROM (
        SELECT jsonb_build_object(
                 'created_at', b.created_at,
                 'kto',        coalesce(pa.name, a.full_name, '—'),
                 'kogo',       coalesce(pb.name, bb.full_name, '—'),
                 'kogo_id',    bb.player_id
               ) AS ряд
          FROM user_blocks b
          LEFT JOIN profiles a  ON a.id  = b.blocker_profile_id
          LEFT JOIN profiles bb ON bb.id = b.blocked_profile_id
          LEFT JOIN players  pa ON pa.id = a.player_id
          LEFT JOIN players  pb ON pb.id = bb.player_id
      ) s;

    RETURN v;
END;
$function$;

-- ── 4. СКОЛЬКО ЛЮДЕЙ ЗАБЛОКИРОВАЛИ ЭТОГО ИГРОКА ──────────────────────────
-- РАННИЙ СИГНАЛ: если человека блокируют пятеро, а жалоб ещё нет, беда уже
-- есть — просто никто не написал. Число идёт в карточку игрока в админке.
CREATE OR REPLACE FUNCTION public.kslt_skolko_zablokirovali(p_player_id text)
  RETURNS integer
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_him uuid;
    v_n   integer;
BEGIN
    IF NOT public.is_staff() THEN RETURN 0; END IF;
    SELECT id INTO v_him FROM profiles WHERE player_id = p_player_id;
    IF v_him IS NULL THEN RETURN 0; END IF;
    SELECT count(*) INTO v_n FROM user_blocks WHERE blocked_profile_id = v_him;
    RETURN coalesce(v_n, 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.kslt_zhaloby(text) FROM public;
REVOKE ALL ON FUNCTION public.kslt_razobrat_zhalobu(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.kslt_blokirovki_vse() FROM public;
REVOKE ALL ON FUNCTION public.kslt_skolko_zablokirovali(text) FROM public;
GRANT EXECUTE ON FUNCTION public.kslt_zhaloby(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_razobrat_zhalobu(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_blokirovki_vse() TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_skolko_zablokirovali(text) TO authenticated;

COMMIT;

-- ============================================================================
-- ПРОВЕРКА ЧТЕНИЕМ. Скопировать и выполнить — раскомментировать не надо.
-- Ждём ЧЕТЫРЕ строки, у всех `definer = t`, `anon = f`, `auth = t`.
--
--   SELECT p.proname, p.prosecdef AS definer,
--          has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth
--     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      AND p.proname IN ('kslt_zhaloby','kslt_razobrat_zhalobu',
--                        'kslt_blokirovki_vse','kslt_skolko_zablokirovali')
--    ORDER BY 1;
--
-- И ГЛАВНОЕ, ЧЕГО ТУТ БЫТЬ НЕ ДОЛЖНО: функции снятия ЧУЖОЙ блокировки.
-- Ждём ПУСТО — ни одной строки.
--
--   SELECT p.proname
--     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public'
--      -- `prokind = 'f'` ОБЯЗАТЕЛЕН: без него запрос падает на первой же
--      -- агрегатной функции схемы — `pg_get_functiondef` их не печатает.
--      -- Найдено прогоном 04.11, а не придумано.
--      AND p.prokind = 'f'
--      AND pg_get_functiondef(p.oid) ~* 'DELETE\s+FROM\s+user_blocks'
--      AND p.proname <> 'kslt_razblokirovat';

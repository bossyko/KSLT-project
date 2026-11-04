-- ============================================================================
-- КСЛТ · Apple 1.2 — ЗАСЛОН: заблокированный не зовёт и не приглашает
-- 04.11.2026. Прогонять ПОСЛЕ `apple-1-2-funkcii.sql`. Повторно — можно.
-- ============================================================================
--
-- ПОЧЕМУ ЭТОТ ФАЙЛ ВООБЩЕ ПОЯВИЛСЯ. Окно блокировки обещает человеку:
-- «не сможет вызвать вас на матч и пригласить поиграть». Я прочитал
-- `create_challenge` (`schema-snapshot.sql:2456-2489`) и ПРОВЕРКИ БЛОКИРОВКИ
-- ТАМ НЕТ — ни одной. То есть без этого файла кнопка нажималась бы, запись
-- в `user_blocks` появлялась бы, а вызовы продолжали приходить.
-- ОБЕЩАНИЕ, КОТОРОЕ НЕ ПОДКРЕПЛЕНО КОДОМ, ХУЖЕ ОТСУТСТВИЯ КНОПКИ: человек
-- считает себя защищённым и перестаёт смотреть.
--
-- ПОЧЕМУ ТРИГГЕР, А НЕ ПРАВКА `create_challenge`. Правило выведено на
-- стоп-словах 04.11 и применяется без нового разбора: ЗАПИСЬ ИДЁТ НЕ ТОЛЬКО
-- ЧЕРЕЗ НАШУ ФУНКЦИЮ. `game_invites` приложение пишет прямым запросом, а
-- `challenges` — через функцию; завтра появится третий путь. Триггер стоит
-- на таблице и ловит все пути сразу, включая те, которых ещё нет.
--
-- ЗАСЛОН ДЕЙСТВУЕТ В ОБЕ СТОРОНЫ, И ЭТО НАРОЧНО. Если Петя заблокировал
-- Васю, то и сам Петя не позовёт Васю: иначе блокировка превращается в
-- «я тебя не слышу, а ты меня слушай», и первым же вызовом Петя сам себе
-- её отменит.

BEGIN;

-- ── 1. ЕСТЬ ЛИ БЛОКИРОВКА МЕЖДУ ДВОИМИ ───────────────────────────────────
-- Одно определение на одно понятие: оба триггера и приложение спрашивают
-- ОДНУ функцию, а не повторяют условие трижды.
CREATE OR REPLACE FUNCTION public.kslt_est_blokirovka(a uuid, b uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM user_blocks
         WHERE (blocker_profile_id = a AND blocked_profile_id = b)
            OR (blocker_profile_id = b AND blocked_profile_id = a)
    );
$function$;

REVOKE ALL ON FUNCTION public.kslt_est_blokirovka(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.kslt_est_blokirovka(uuid, uuid) TO authenticated;

-- Приложению удобнее спрашивать по `players.id` — текстом, как в карточке.
CREATE OR REPLACE FUNCTION public.kslt_zablokirovan_li(p_player_id text)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_me  uuid := auth.uid();
    v_him uuid;
BEGIN
    IF v_me IS NULL THEN RETURN false; END IF;
    SELECT id INTO v_him FROM profiles WHERE player_id = p_player_id;
    IF v_him IS NULL THEN RETURN false; END IF;
    RETURN kslt_est_blokirovka(v_me, v_him);
END;
$function$;

REVOKE ALL ON FUNCTION public.kslt_zablokirovan_li(text) FROM public;
GRANT EXECUTE ON FUNCTION public.kslt_zablokirovan_li(text) TO authenticated;

-- ── 2. ЗАСЛОН НА ВЫЗОВЫ ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.kslt_vyzov_ne_zablokirovan()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
    IF NEW.challenger_id IS NOT NULL
       AND NEW.opponent_profile_id IS NOT NULL
       AND kslt_est_blokirovka(NEW.challenger_id, NEW.opponent_profile_id) THEN
        -- Текст ловит приложение и переводит на язык человека. Само слово
        -- «заблокирован» ему НЕ показывается: тот, кого заблокировали, об
        -- этом не узнаёт — он видит обычный отказ.
        RAISE EXCEPTION 'kslt_blocked' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS challenges_block_trg ON public.challenges;
CREATE TRIGGER challenges_block_trg
    BEFORE INSERT ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION public.kslt_vyzov_ne_zablokirovan();

-- ── 3. ЗАСЛОН НА ПРИГЛАШЕНИЯ ─────────────────────────────────────────────
-- `game_invites.receiver_profile_id` может быть пуст (приглашают карточку
-- без учётной записи) — тогда добираем его по `receiver_player_id`.
CREATE OR REPLACE FUNCTION public.kslt_priglashenie_ne_zablokirovano()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_him uuid := NEW.receiver_profile_id;
BEGIN
    IF v_him IS NULL AND NEW.receiver_player_id IS NOT NULL THEN
        SELECT id INTO v_him FROM profiles WHERE player_id = NEW.receiver_player_id;
    END IF;

    IF NEW.sender_id IS NOT NULL AND v_him IS NOT NULL
       AND kslt_est_blokirovka(NEW.sender_id, v_him) THEN
        RAISE EXCEPTION 'kslt_blocked' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS game_invites_block_trg ON public.game_invites;
CREATE TRIGGER game_invites_block_trg
    BEFORE INSERT ON public.game_invites
    FOR EACH ROW EXECUTE FUNCTION public.kslt_priglashenie_ne_zablokirovano();

-- ── 4. МОИ БЛОКИРОВКИ, СПИСКОМ С ИМЕНАМИ ─────────────────────────────────
-- КНОПКА «ЗАБЛОКИРОВАТЬ» БЕЗ ЭКРАНА СНЯТИЯ — ЭТО ДОРОГА В ОДИН КОНЕЦ.
-- Одним запросом, потому что имя живёт в `players`, а блокировка — в
-- `user_blocks`, и связывает их `profiles.player_id`: собирать это
-- приложению значит завести три запроса и порядок между ними.
CREATE OR REPLACE FUNCTION public.kslt_moi_blokirovki()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
    SELECT coalesce(jsonb_agg(ряд ORDER BY ряд->>'created_at' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
                 'player_id',  pr.player_id,
                 'name',       pl.name,
                 'name_en',    pl.name_en,
                 'name_kg',    pl.name_kg,
                 'photo',      pl.photo,
                 'created_at', b.created_at
               ) AS ряд
          FROM user_blocks b
          JOIN profiles pr ON pr.id = b.blocked_profile_id
          LEFT JOIN players pl ON pl.id = pr.player_id
         WHERE b.blocker_profile_id = auth.uid()
      ) s;
$function$;

REVOKE ALL ON FUNCTION public.kslt_moi_blokirovki() FROM public;
GRANT EXECUTE ON FUNCTION public.kslt_moi_blokirovki() TO authenticated;

COMMIT;

-- ============================================================================
-- ПРОВЕРКА ЧТЕНИЕМ. Выполнить ПОСЛЕ прогона — запросы готовы, их НЕ надо
-- раскомментировать: просто скопируй блок ниже в SQL Editor и выполни.
-- ============================================================================
--
-- Ждём ДВЕ строки: challenges_block_trg и game_invites_block_trg,
-- обе `BEFORE INSERT`, обе `enabled = O` (включён).
--
--   SELECT c.relname AS tablica, t.tgname AS trigger,
--          t.tgenabled AS enabled
--     FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
--    WHERE NOT t.tgisinternal
--      AND t.tgname IN ('challenges_block_trg','game_invites_block_trg')
--    ORDER BY 1;

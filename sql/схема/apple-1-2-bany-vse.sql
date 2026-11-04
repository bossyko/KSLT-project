-- ============================================================================
-- КСЛТ · ДВА БАНА, ОДИН СПИСОК
-- 04.11.2026. Прогонять после `apple-1-2-kto-zabanil.sql`. Повторно — можно.
-- ============================================================================
--
-- НАХОДКА 04.11, ЗАМЕРЕНА КОСТЕЙ ГЛАЗАМИ: он забанил человека из раздела
-- «Пользователи», а вкладка «Баны клуба» осталась пустой.
--
-- ПРИЧИНА: БАН ОПРЕДЕЛЁН В КСЛТ ДВАЖДЫ, и это разные вещи с одним именем.
--   · `ban_user`   → `profiles.banned_until` + блокировка входа в Supabase
--     Auth (`admin-manage-user/index.ts:150-159`). Человек не войдёт вовсе.
--     Кнопка — в разделе «Пользователи».
--   · `ban_player` → `players.banned_until` (`:332`). Войти он может,
--     закрыта карточка игрока. Кнопка — в разделе «Игроки».
-- Моя вкладка читала только `players` и честно показывала пусто.
--
-- ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ — правило нарушено НЕ ЗДЕСЬ, а раньше:
-- два бана живут в продукте с разных дней. Свести их — отдельная работа,
-- она трогает Auth и обе кнопки; записано долгом. СЕГОДНЯ ЧИНИМ ТО, ЧТО
-- ВРЁТ: список обязан показывать оба и называть, что именно закрыто.

BEGIN;

-- Автор бана учётной записи — такой же след, как у бана карточки.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS banned_at timestamptz;

CREATE OR REPLACE FUNCTION public.kslt_bany_vse()
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

    SELECT coalesce(jsonb_agg(ряд ORDER BY ряд->>'do'), '[]'::jsonb) INTO v
      FROM (
        -- Бан учётной записи: человек не войдёт вовсе.
        SELECT jsonb_build_object(
                 'vid',       'uchyotka',
                 'cel_id',    pr.id::text,
                 'kto',       coalesce(pl.name, pr.full_name, '—'),
                 'do',        pr.banned_until,
                 'prichina',  pr.ban_reason,
                 'kem',       kem.full_name,
                 'kogda',     pr.banned_at
               ) AS ряд
          FROM profiles pr
          LEFT JOIN players  pl  ON pl.id = pr.player_id
          LEFT JOIN profiles kem ON kem.id = pr.banned_by
         WHERE pr.banned_until IS NOT NULL AND pr.banned_until > now()

        UNION ALL

        -- Бан карточки игрока: войти может, карточка закрыта.
        SELECT jsonb_build_object(
                 'vid',       'kartochka',
                 'cel_id',    p.id,
                 'kto',       coalesce(p.name, p.id),
                 'do',        p.banned_until,
                 'prichina',  p.ban_reason,
                 'kem',       kem.full_name,
                 'kogda',     p.banned_at
               ) AS ряд
          FROM players p
          LEFT JOIN profiles kem ON kem.id = p.banned_by
         WHERE p.banned_until IS NOT NULL AND p.banned_until > now()
      ) s;

    RETURN v;
END;
$function$;

REVOKE ALL ON FUNCTION public.kslt_bany_vse() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kslt_bany_vse() FROM anon;
GRANT EXECUTE ON FUNCTION public.kslt_bany_vse() TO authenticated;

COMMIT;

-- ============================================================================
-- ПРОВЕРКА ЧТЕНИЕМ. Скопировать и выполнить.
--
-- 1) Колонки следа у профиля — ждём две строки:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='profiles'
--      AND column_name IN ('banned_by','banned_at') ORDER BY 1;
--
-- 2) Функция закрыта для анонима — ждём anon=false, auth=true:
--   SELECT has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth
--     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--    WHERE n.nspname='public' AND p.proname='kslt_bany_vse';
--
-- 3) САМОЕ ВАЖНОЕ: оба бана видны одним списком. Ждём строку с
--    `vid: uchyotka` для того, кого забанили из «Пользователей»:
--   SELECT jsonb_pretty(kslt_bany_vse());

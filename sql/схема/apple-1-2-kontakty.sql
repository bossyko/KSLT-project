-- КОНТАКТЫ ПРЯЧЕТ БАЗА, А НЕ ПРИЛОЖЕНИЕ (04.11). Долг E4.14 закрыт.
--
-- ЧТО БЫЛО. И сайт, и приложение читали контакты ПРЯМЫМ запросом к
-- `profiles` (`mobile/www/js/screens/player-detail.js:159`,
-- `js/player.js:369`), а блокировку учитывали уже у себя, при отрисовке:
-- `var contacts = _zablokirovan ? {} : _contacts`. То есть обещание окна
-- блокировки «он не увидит твоих контактов» держала РАЗМЕТКА. Любой, кто
-- умеет послать запрос руками, получал телефон заблокировавшего его
-- человека. Предел был назван честно в подписи к коду и записан долгом —
-- теперь он закрыт.
--
-- ПОЧЕМУ ФУНКЦИЯ, А НЕ ПРАВИЛА СТРОК. Правила доступа на `profiles`
-- Костя прописывал сам и просил не трогать. Функция ничего в них не
-- меняет: она сама проверяет, кто спрашивает, и отдаёт либо контакты,
-- либо пусто. И она становится ЕДИНСТВЕННЫМ местом, где это решается —
-- одно определение на одно понятие вместо двух разметок.
--
-- В ОБЕ СТОРОНЫ. Прячем и когда он заблокировал меня, и когда я его:
-- `kslt_est_blokirovka` уже умеет обе, и переписывать это второй раз
-- здесь нельзя.

BEGIN;

CREATE OR REPLACE FUNCTION public.kslt_kontakty(p_player_id text)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $function$
DECLARE
    v_me   uuid := auth.uid();
    v_him  uuid;
    v      jsonb;
BEGIN
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;

    SELECT id INTO v_him FROM profiles WHERE player_id = p_player_id;
    IF v_him IS NULL THEN
        RETURN jsonb_build_object('error', 'no_profile');
    END IF;

    -- СВОИ КОНТАКТЫ ВИДНЫ ВСЕГДА: себя не блокируют.
    IF v_him <> v_me AND public.kslt_est_blokirovka(v_me, v_him) THEN
        RETURN jsonb_build_object('error', 'blocked');
    END IF;

    SELECT jsonb_build_object(
             'phone',           CASE WHEN p.show_phone     THEN p.phone           END,
             'whatsapp_phone',  CASE WHEN p.show_whatsapp  THEN coalesce(p.whatsapp_phone, p.phone) END,
             'telegram',        CASE WHEN p.show_telegram  THEN p.telegram        END,
             'instagram',       CASE WHEN p.show_instagram THEN p.instagram       END,
             'show_phone',      coalesce(p.show_phone, false),
             'show_whatsapp',   coalesce(p.show_whatsapp, false),
             'show_telegram',   coalesce(p.show_telegram, false),
             'show_instagram',  coalesce(p.show_instagram, false)
           ) INTO v
      FROM profiles p
     WHERE p.id = v_him
       -- УШЁЛ ИЗ КЛУБА — КОНТАКТОВ НЕ ДАЁМ, даже если разрешения остались
       AND p.deleted_at IS NULL
       AND p.account_deleted_at IS NULL;

    RETURN coalesce(v, '{}'::jsonb);
END;
$function$;

COMMENT ON FUNCTION public.kslt_kontakty(text) IS
    'Контакты игрока по его карточке. Прячет их САМА БАЗА при блокировке в любую сторону и при уходе из клуба — разметке это больше не поручено.';

-- ПРАВА ПОИМЁННО. `REVOKE ALL ... FROM public` не снимает прямой грант
-- роли anon, который ставит supabase-овский ALTER DEFAULT PRIVILEGES —
-- это уже была настоящая дыра 03.11.
REVOKE ALL ON FUNCTION public.kslt_kontakty(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kslt_kontakty(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.kslt_kontakty(text) TO authenticated;

COMMIT;


-- ---- ПРОВЕРКА 1: встало и закрыто анониму ------------------------
-- Ждём: est = 1, definer = true, anon = false, authenticated = true.

SELECT count(*)                                          AS est,
       bool_and(p.prosecdef)                             AS definer,
       bool_and(has_function_privilege('anon', p.oid, 'EXECUTE'))          AS anon,
       bool_and(has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'kslt_kontakty';


-- ---- ПРОВЕРКА 2: постороннему она ничего не отдаёт ---------------
-- В SQL Editor `auth.uid()` пуст — значит ждём error = not_logged_in.
-- Это и есть доказательство, что заслон стоит в самой базе.

SELECT public.kslt_kontakty('kamil-yakupov') ->> 'error' AS error;

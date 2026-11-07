-- СКРЫТЫЙ ТЕЛЕФОН УХОДИЛ НАРУЖУ ПОД ВИДОМ WHATSAPP (06.11).
--
-- ЧТО ПОМЕРЕНО ЧТЕНИЕМ. `sql/схема/apple-1-2-kontakty.sql:52` отдавал
-- контакт так:
--     'whatsapp_phone', CASE WHEN p.show_whatsapp
--                            THEN coalesce(p.whatsapp_phone, p.phone) END
-- То есть при включённом WhatsApp и НЕ заполненном своём номере база
-- подставляла основной телефон — НЕ СПРАШИВАЯ `show_phone`. Человек
-- выключал показ телефона, а номер уходил в ответе и вставал в ссылку
-- `wa.me/<номер>` на сайте (`js/player.js:413`) и в приложении
-- (`mobile/www/js/screens/player-detail.js:378`). Визуально номера не
-- видно, но он есть в разметке: достаточно скопировать ссылку.
--
-- ЧЕМ ЭТО ХУЖЕ ОБЫЧНОЙ ОШИБКИ. В анкете Data safety для Play мы
-- отвечаем: «телефон виден другим ПО РЕШЕНИЮ САМОГО ЧЕЛОВЕКА»
-- (`claude/kslt-data-safety-play.md`, раздел 1). Это решение здесь
-- обходилось, то есть ответ в анкете был неверен.
--
-- ПОЧЕМУ ЧИНИТСЯ В БАЗЕ. Разметку чинить мало: тот же ответ приходит
-- любому, кто позовёт функцию руками. Заслон стоит там же, где стоял
-- заслон блокировки, — в самой функции. Правка во фронте остаётся
-- ВТОРЫМ рубежом, а не единственным.
--
-- ЧТО ОСТАЁТСЯ КАК БЫЛО. Свой номер WhatsApp, указанный отдельно,
-- по-прежнему показывается по своему переключателю: «номер можно
-- скрыть, а WhatsApp оставить» — это задумано и сохранено. Меняется
-- ровно один случай: своего номера WhatsApp нет И показ телефона
-- выключен.

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
             /* ОСНОВНОЙ ТЕЛЕФОН ПОДСТАВЛЯЕТСЯ ПОД WHATSAPP ТОЛЬКО ТОГДА,
                КОГДА ОН И САМ РАЗРЕШЁН К ПОКАЗУ. Без этого выключенный
                `show_phone` обходился через соседний переключатель. */
             'whatsapp_phone',  CASE WHEN p.show_whatsapp
                                     THEN coalesce(p.whatsapp_phone,
                                                   CASE WHEN p.show_phone THEN p.phone END)
                                END,
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
    'Контакты игрока по его карточке. Прячет их САМА БАЗА при блокировке в любую сторону и при уходе из клуба. Основной телефон подставляется под WhatsApp только при включённом show_phone: иначе выключенный показ телефона обходился соседним переключателем.';

REVOKE ALL ON FUNCTION public.kslt_kontakty(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kslt_kontakty(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.kslt_kontakty(text) TO authenticated;

COMMIT;


-- ---- ПРОВЕРКА: ЧИТАЕМ БАЗУ, А НЕ ОТВЕТ «Success» -----------------
--
-- Считаем людей, у кого показ телефона ВЫКЛЮЧЕН, WhatsApp ВКЛЮЧЁН,
-- своего номера WhatsApp НЕТ, а телефон есть. Это ровно те, чей номер
-- утекал. Ждём:
--   utekalo  — сколько их (может быть и ноль, тогда утечки не случилось);
--   tech_est — true: правка в тексте функции стоит;
--   anon     — false, authenticated — true: права не тронуты.

SELECT (SELECT count(*) FROM public.profiles p
         WHERE coalesce(p.show_whatsapp, false)
           AND NOT coalesce(p.show_phone, false)
           AND p.whatsapp_phone IS NULL
           AND p.phone IS NOT NULL)                                        AS utekalo,
       (SELECT position('CASE WHEN p.show_phone THEN p.phone END' in pg_get_functiondef(p.oid)) > 0
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'kslt_kontakty')       AS tech_est,
       (SELECT has_function_privilege('anon', p.oid, 'EXECUTE')
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'kslt_kontakty')       AS anon,
       (SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE')
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname = 'kslt_kontakty')       AS authenticated;

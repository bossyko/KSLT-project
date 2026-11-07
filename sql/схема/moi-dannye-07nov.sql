-- ============================================================
-- Ю4. МОИ ДАННЫЕ — ФУНКЦИЯ ВЫГРУЗКИ. МЕНЯЕТ БАЗУ: одна функция.
-- ============================================================
--
-- ОБЕЩАНО В ДВУХ ДОКУМЕНТАХ, УТВЕРЖДЁННЫХ ПРИКАЗОМ № 1:
--   политика, п. 9.2 — «получить доступ ко всем своим данным или их
--   копию (ч. 4 ст. 73)» и «получить свои данные в машиночитаемом
--   формате» (ст. 76);
--   Соглашение, п. 11.2 — то же.
--
-- ПОЧЕМУ ФУНКЦИЯ, А НЕ ЗАПРОСЫ ИЗ КЛИЕНТА. Таблиц полтора десятка, и
-- у каждой свои правила доступа. Запрос, которому правило не дало
-- строк, возвращает ПУСТО — без ошибки. Выгрузка вышла бы неполной
-- молча, а документ обещает ВСЕ данные. Здесь полнота обеспечена
-- одним местом: `SECURITY DEFINER` читает мимо правил, но отдаёт
-- ТОЛЬКО строки звонящего — `auth.uid()`, подменить его нельзя.
--
-- ЧУЖОГО В ВЫГРУЗКЕ НЕТ. Берутся лишь те строки, где человек —
-- субъект: его заявки, его результаты, его платежи. Переписка с
-- другими игроками и жалобы на него не отдаются: в них есть вторая
-- сторона, и её данные не его.

CREATE OR REPLACE FUNCTION public.мои_данные()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    кто   uuid := auth.uid();
    карта text;
    итог  jsonb;
BEGIN
    IF кто IS NULL THEN
        RAISE EXCEPTION 'Нужен вход: выгрузка отдаётся только самому человеку';
    END IF;

    SELECT player_id INTO карта FROM profiles WHERE id = кто;

    SELECT jsonb_build_object(
        'собрано_в',        now(),
        'кому',             кто,
        'пояснение',        'Выгрузка персональных данных по ст. 73 и 76 Цифрового кодекса КР. Данные других людей в неё не входят.',

        'учётная_запись',   (SELECT to_jsonb(p) - 'id' FROM profiles p WHERE p.id = кто),
        'карточка_игрока',  (SELECT to_jsonb(pl) FROM players pl WHERE pl.id = карта),

        'согласия',         (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.created_at), '[]'::jsonb)
                               FROM consents c WHERE c.user_id = кто),

        'заявки_на_турниры',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.registered_at), '[]'::jsonb)
                               FROM tournament_registrations r WHERE r.player_id = карта),

        'результаты',       (SELECT coalesce(jsonb_agg(to_jsonb(tr)), '[]'::jsonb)
                               FROM tournament_results tr WHERE tr.player_id = карта),

        'история_рейтинга', (SELECT coalesce(jsonb_agg(to_jsonb(rh) ORDER BY rh.created_at), '[]'::jsonb)
                               FROM rating_history rh WHERE rh.player_id = карта),

        'членство',         (SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
                               FROM memberships m WHERE m.profile_id = кто),

        'платежи',          (SELECT coalesce(jsonb_agg(to_jsonb(pay)), '[]'::jsonb)
                               FROM payments pay WHERE pay.profile_id = кто),

        'баллы',            (SELECT coalesce(jsonb_agg(to_jsonb(lt) ORDER BY lt.created_at), '[]'::jsonb)
                               FROM loyalty_transactions lt WHERE lt.profile_id = кто),

        'ваучеры',          (SELECT coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb)
                               FROM discount_vouchers v WHERE v.profile_id = кто),

        'устройства',       (SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
                               FROM user_devices d WHERE d.profile_id = кто),

        'уведомления',      (SELECT coalesce(jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC), '[]'::jsonb)
                               FROM notification_log n WHERE n.profile_id = кто)
    ) INTO итог;

    RETURN итог;
END $$;

COMMENT ON FUNCTION public.мои_данные() IS
    'Ю4: выгрузка своих данных (ст. 73, 76 Цифрового кодекса). Отдаёт только строки звонящего.';

REVOKE ALL ON FUNCTION public.мои_данные() FROM public;
GRANT EXECUTE ON FUNCTION public.мои_данные() TO authenticated;

-- ПРОВЕРКА ЧТЕНИЕМ: функция заведена и доступна только вошедшим.
SELECT  (SELECT count(*) FROM pg_proc WHERE proname = 'мои_данные')        AS funkciy,
        has_function_privilege('authenticated', 'public.мои_данные()', 'EXECUTE') AS mozhet_voshedshiy,
        has_function_privilege('anon', 'public.мои_данные()', 'EXECUTE')          AS mozhet_gost;

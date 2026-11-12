-- ============================================
-- СЛЕД ОТМЕНЫ СКИДКИ: кто, когда и почему
-- ============================================
--
-- ЗАМЕР 11.11. В `discount_vouchers` тринадцать колонок, и ни одной про
-- отмену. Админка (js/admin/sections/vouchers.js:452) пишет при отмене
-- ровно одно поле — `status = 'cancelled'`. Кто отменил, когда и почему,
-- не остаётся нигде. Ниже в той же таблице стоит кнопка удаления
-- (:480), которая делает физический DELETE: после неё не остаётся даже
-- строки со статусом.
--
-- ЭТО УЖЕ РЕШЕНО — ДЛЯ ВЫЗОВОВ. В `challenges` есть cancelled_at,
-- cancelled_by и cancel_reason, отмена идёт серверной функцией, и там же
-- записано словами: «Запись не удаляем: у обеих сторон в истории
-- остаётся, что вызов был и кто передумал». Скидка — обязательство
-- перед человеком ровно так же. ПРАВИЛО, ВЫВЕДЕННОЕ НА ОДНОМ КУСКЕ,
-- ПРИМЕНЯЕТСЯ К СЛЕДУЮЩЕМУ БЕЗ НОВОГО РАЗБОРА: берём те же имена.
--
-- ПОЧЕМУ ФУНКЦИЯ, А НЕ UPDATE ИЗ БРАУЗЕРА. Время и имя обязан ставить
-- сервер. Поставь их клиент — `cancelled_by` подделывается, а
-- `cancelled_at` берётся с часов смотрящего. Сегодня же, 11.11, мы на
-- этом поймали ровно сутки разницы: админка показывала чикагский день
-- вместо бишкекского. ВРЕМЯ И ИМЯ БЕРЁТ СЕРВЕР, А НЕ БРАУЗЕР.
--
-- ЧТО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ: не трогает кнопку удаления и политику DELETE.
-- Это решение Кости, и оно отдельным файлом.

-- ---- 1. Три колонки ------------------------------------------------
ALTER TABLE public.discount_vouchers
    ADD COLUMN IF NOT EXISTS cancelled_at  timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cancel_reason text;

COMMENT ON COLUMN public.discount_vouchers.cancelled_at  IS 'Когда отменена. Ставит сервер в cancel_voucher().';
COMMENT ON COLUMN public.discount_vouchers.cancelled_by  IS 'Кто отменил. auth.uid() на сервере, не из браузера.';
COMMENT ON COLUMN public.discount_vouchers.cancel_reason IS 'Почему. Необязательна, как у вызовов.';

-- ---- 2. Отмена одной дорогой ---------------------------------------
--
-- SECURITY DEFINER, потому что право решает сама функция: отменять может
-- админ или менеджер. Пустой ответ без ошибки — беда, на которой мы уже
-- обжигались с файлами хранилища и с правилом удаления скидок, поэтому
-- функция ВСЕГДА говорит словами, что произошло.
CREATE OR REPLACE FUNCTION public.cancel_voucher(p_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me     uuid := auth.uid();
    v_role   text;
    v_status text;
    v_reason text;
BEGIN
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('error', 'not_authenticated');
    END IF;

    SELECT role INTO v_role FROM profiles WHERE id = v_me;
    IF v_role IS DISTINCT FROM 'admin' AND v_role IS DISTINCT FROM 'manager' THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    SELECT status INTO v_status FROM discount_vouchers WHERE id = p_id;
    IF v_status IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;
    -- Отменяют только действующую: использованную или уже отменённую
    -- трогать нечего, и молчать об этом нельзя.
    IF v_status <> 'active' THEN
        RETURN jsonb_build_object('error', 'not_cancellable', 'status', v_status);
    END IF;

    -- Пустая строка и строка из пробелов — это НЕ причина.
    v_reason := nullif(btrim(coalesce(p_reason, '')), '');

    UPDATE discount_vouchers
       SET status        = 'cancelled',
           cancelled_at  = now(),
           cancelled_by  = v_me,
           cancel_reason = v_reason
     WHERE id = p_id;

    RETURN jsonb_build_object('ok', true, 'cancelled_at', now(), 'cancel_reason', v_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_voucher(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_voucher(uuid, text) TO authenticated;

-- ---- 3. Проверка ЧТЕНИЕМ БАЗЫ, а не ответом «Success» ---------------
--
-- РЕЗУЛЬТАТ ЗАПРОСА ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ. Прогнать после применения:

-- Колонки на месте?
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'discount_vouchers'
   AND column_name IN ('cancelled_at', 'cancelled_by', 'cancel_reason')
 ORDER BY column_name;

-- Функция одна, не две (ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: две перегрузки
-- дали бы PGRST203 — ровно то, из-за чего шесть счётчиков просмотров
-- молчали два месяца).
SELECT p.oid::regprocedure AS функция, p.prosecdef AS security_definer
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'cancel_voucher';

-- Сколько отменённых скидок уже лежит без следа (их прошлое не
-- восстановить — колонки останутся пустыми, и это честно):
SELECT count(*) AS otmenennyh_bez_sleda
  FROM discount_vouchers
 WHERE status = 'cancelled' AND cancelled_at IS NULL;

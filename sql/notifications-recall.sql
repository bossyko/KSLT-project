-- ============================================
-- Отзыв рассылки и удаление записи из журнала
-- ============================================
--
-- push_log — журнал отправок: кто, когда, с каким текстом и скольким людям.
-- Сами уведомления лежат отдельно, у каждого получателя своё, в
-- notification_log. Связи между ними до сих пор не было: по записи журнала
-- нельзя было понять, какие именно уведомления она породила.
--
-- Отсюда два действия, которые теперь становятся возможными:
--
--   ОТОЗВАТЬ (менеджер и админ) — убрать уведомление у всех, кому оно ушло,
--   а строку в журнале пометить отозванной, с датой и тем, кто отозвал.
--   История отправки остаётся: журнал на то и журнал.
--
--   УДАЛИТЬ ЗАПИСЬ (только админ) — убрать саму строку журнала. Это стирает
--   след того, что рассылка была, поэтому доступно только администратору.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Связь рассылки с уведомлениями и отметка отзыва ----------------
ALTER TABLE public.notification_log
    ADD COLUMN IF NOT EXISTS push_id uuid;

CREATE INDEX IF NOT EXISTS notification_log_push_id_idx
    ON public.notification_log (push_id);

ALTER TABLE public.push_log
    ADD COLUMN IF NOT EXISTS recalled_at timestamptz,
    ADD COLUMN IF NOT EXISTS recalled_by uuid;

COMMENT ON COLUMN public.notification_log.push_id IS
    'Рассылка, из которой пришло уведомление. Нужна, чтобы её можно было отозвать.';


-- ---- 3. Отзыв рассылки ------------------------------------------------
-- Правило живёт в базе: интерфейс можно обойти запросом напрямую.
CREATE OR REPLACE FUNCTION "public"."recall_push"("p_push_id" "uuid")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    removed int;
BEGIN
    SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'manager') THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM push_log WHERE id = p_push_id) THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    DELETE FROM notification_log WHERE push_id = p_push_id;
    GET DIAGNOSTICS removed = ROW_COUNT;

    UPDATE push_log
    SET recalled_at = now(), recalled_by = auth.uid()
    WHERE id = p_push_id;

    RETURN jsonb_build_object('ok', true, 'removed', removed);
END;
$$;

ALTER FUNCTION "public"."recall_push"("uuid") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."recall_push"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recall_push"("uuid") TO "service_role";


-- ---- 4. Удаление записи журнала — только администратор -----------------
CREATE POLICY "Admins can delete push_log" ON "public"."push_log"
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    ));

-- Отзыв идёт через функцию, но обновление строки журнала должно быть
-- разрешено и напрямую сотруднику — иначе функция упрётся в правило
CREATE POLICY "Staff can update push_log" ON "public"."push_log"
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
    ));


-- ---- 5. ПРОВЕРКА ------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'notification_log' AND column_name = 'push_id') AS связь_есть,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'push_log' AND column_name = 'recalled_at') AS отметка_есть,
    (SELECT count(*) FROM pg_proc WHERE proname = 'recall_push') AS функция_есть;

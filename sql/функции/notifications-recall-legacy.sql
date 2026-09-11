-- ============================================
-- Отзыв не работает для рассылок, отправленных раньше
-- ============================================
--
-- Отзыв ищет уведомления по push_id — связи с записью журнала. Связь завёл
-- send-push, и она есть только у того, что отправлено после его обновления.
-- У всего, что лежало в базе до этого, push_id пустой: отзыв не находил
-- ничего, удалял ноль строк, но запись всё равно помечал отозванной. В
-- админке «отозвана», у человека сообщение на месте.
--
-- Чиним две вещи:
--
--   1. Для рассылок без связи ищем их уведомления по совпадению заголовка,
--      текста и времени отправки — именно так send-push их и заводил: одна
--      строка на получателя, с тем же текстом, в ту же секунду. Окно берём
--      в две минуты: рассылка на три сотни человек идёт пакетом.
--
--   2. Разово проставляем push_id всему, что удаётся однозначно связать.
--      Дальше отзыв работает по связи, без угадывания.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Связать старые уведомления с их рассылками ---------------------
-- Связываем только там, где рассылка одна: если два одинаковых сообщения
-- ушли в одну минуту, угадывать нельзя — такие оставляем как есть, их
-- разберёт запасной путь при самом отзыве.
UPDATE notification_log n
SET push_id = p.id
FROM push_log p
WHERE n.push_id IS NULL
  AND n.title IS NOT DISTINCT FROM p.title
  AND n.message IS NOT DISTINCT FROM p.message
  AND n.created_at BETWEEN p.created_at - interval '2 minutes'
                       AND p.created_at + interval '2 minutes'
  AND NOT EXISTS (
      SELECT 1 FROM push_log p2
      WHERE p2.id <> p.id
        AND p2.title IS NOT DISTINCT FROM n.title
        AND p2.message IS NOT DISTINCT FROM n.message
        AND n.created_at BETWEEN p2.created_at - interval '2 minutes'
                             AND p2.created_at + interval '2 minutes');


-- ---- 3. Отзыв: запасной путь и честный ответ ---------------------------
CREATE OR REPLACE FUNCTION "public"."recall_push"("p_push_id" "uuid")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
    removed int;
    p push_log%ROWTYPE;
BEGIN
    SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'manager') THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    SELECT * INTO p FROM push_log WHERE id = p_push_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    DELETE FROM notification_log WHERE push_id = p_push_id;
    GET DIAGNOSTICS removed = ROW_COUNT;

    -- Связи нет — ищем по тексту и времени. Трогаем только несвязанные:
    -- у чужой рассылки push_id уже проставлен, её не заденет
    IF removed = 0 THEN
        DELETE FROM notification_log n
        WHERE n.push_id IS NULL
          AND n.title IS NOT DISTINCT FROM p.title
          AND n.message IS NOT DISTINCT FROM p.message
          AND n.created_at BETWEEN p.created_at - interval '2 minutes'
                               AND p.created_at + interval '2 minutes';
        GET DIAGNOSTICS removed = ROW_COUNT;
    END IF;

    UPDATE push_log
    SET recalled_at = now(), recalled_by = auth.uid()
    WHERE id = p_push_id;

    RETURN jsonb_build_object('ok', true, 'removed', removed);
END;
$$;

ALTER FUNCTION "public"."recall_push"("uuid") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."recall_push"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recall_push"("uuid") TO "service_role";


-- ---- 4. ПРОВЕРКА ------------------------------------------------------
-- «без_связи» — уведомления, которые так и не удалось привязать. Отозвать
-- их всё равно можно: сработает поиск по тексту.
SELECT
    (SELECT count(*) FROM notification_log WHERE push_id IS NOT NULL) AS связанных,
    (SELECT count(*) FROM notification_log WHERE push_id IS NULL) AS без_связи,
    (SELECT count(*) FROM notification_log n JOIN push_log p ON p.id = n.push_id
      WHERE p.recalled_at IS NOT NULL) AS осталось_у_отозванных;

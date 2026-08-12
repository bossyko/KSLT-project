-- ============================================
-- Разбор: почему колокольчик не показывает уведомления
-- ============================================
--
-- Ничего не меняет, только читает. Запусти целиком (курсор в текст,
-- Ctrl+Enter) и пришли мне последний ответ — он и есть разбор.
--
-- Колокольчик считает так: берёт из notification_log записи, где
-- profile_id совпадает с вошедшим пользователем и is_read = false.
-- Если ответ пустой, причина одна из трёх, и запросы ниже её называют.


-- ---- 1. Есть ли уведомления вообще ------------------------------------
SELECT count(*) AS всего_уведомлений,
       count(*) FILTER (WHERE NOT is_read) AS непрочитанных,
       max(created_at) AS последнее
FROM notification_log;


-- ---- 2. Последние десять: кому и от какой рассылки ---------------------
SELECT n.created_at, n.title, n.is_read, n.profile_id,
       p.full_name, p.role, p.email
FROM notification_log n
LEFT JOIN profiles p ON p.id = n.profile_id
ORDER BY n.created_at DESC
LIMIT 10;


-- ---- 3. Совпадает ли получатель с учётной записью ----------------------
-- profile_id уведомления должен быть тем же, что и id учётной записи.
-- Если строки ниже есть — уведомления адресованы «в никуда», и никакой
-- колокольчик их не покажет: правило доступа их не отдаст.
SELECT n.id, n.title, n.profile_id AS адресат
FROM notification_log n
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = n.profile_id)
LIMIT 10;


-- ---- 4. Журнал рассылок -----------------------------------------------
SELECT created_at, title, audience, recipients_count, fcm_sent
FROM push_log
ORDER BY created_at DESC
LIMIT 5;


-- ---- 5. ОТВЕТ ---------------------------------------------------------
-- Пришли мне эту строку.
SELECT
    (SELECT count(*) FROM notification_log) AS уведомлений_всего,
    (SELECT count(*) FROM notification_log WHERE NOT is_read) AS непрочитанных,
    (SELECT count(*) FROM notification_log n
       WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = n.profile_id)) AS адресатов_нет_в_учётных_записях,
    (SELECT count(*) FROM push_log) AS рассылок_в_журнале,
    (SELECT count(*) FROM notification_log n
       JOIN profiles p ON p.id = n.profile_id
      WHERE p.email = 'bossyko.co@gmail.com' AND NOT n.is_read) AS непрочитанных_у_тебя;

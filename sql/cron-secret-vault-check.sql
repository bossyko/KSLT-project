-- ============================================================
-- Задания по расписанию: живы ли
-- ============================================================
--
-- Только читает, ключей наружу не показывает. Правку делает
-- cron-secret-vault.sql.

-- ---- 1. Ключ на месте? ----
-- Показываем длину, а не сам ключ. У служебного ключа она больше двухсот.

SELECT count(*) AS секретов_с_таким_именем,
       length(public.cron_secret()) AS длина_ключа
  FROM vault.secrets WHERE name = 'cron_secret';

-- ---- 2. Ключ никому лишнему не доступен? ----
-- Строк быть не должно: ни гость, ни вошедший пользователь вызвать функцию
-- не могут. Если строка есть — ключ можно достать через API, чинить сразу.

SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_name IN ('cron_secret', 'позвать_функцию')
   AND grantee IN ('anon', 'authenticated', 'PUBLIC');

-- ---- 3. Какие задания заведены ----

SELECT jobid, jobname, schedule, active, left(command, 60) AS что_делает
  FROM cron.job ORDER BY jobid;

-- ---- 4. Чем закончились последние запуски ----
-- Тут и смотрим, ожило ли: у match-start-notify должно появиться succeeded
-- в течение пяти минут после правки.

SELECT j.jobname, d.status, left(d.return_message, 90) AS ответ, d.start_time
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
 ORDER BY d.start_time DESC
 LIMIT 15;

-- ---- 5. Сводка по каждому заданию ----
-- «последний успех» пустой — значит задание не срабатывало ни разу.

SELECT j.jobname,
       count(*) FILTER (WHERE d.status = 'failed')             AS падений,
       max(d.start_time) FILTER (WHERE d.status = 'succeeded') AS последний_успех,
       max(d.start_time) FILTER (WHERE d.status = 'failed')    AS последнее_падение
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
 GROUP BY j.jobname
 ORDER BY падений DESC;

-- ---- 6. Что ответили функции ----
-- 401 — не сходится ключ, 404 — функция не выложена, 200 — всё дошло.

SELECT id, status_code, left(content, 200) AS ответ, created
  FROM net._http_response
 ORDER BY id DESC
 LIMIT 10;

-- ============================================================
-- ЧТО ЛЕЖИТ В РАСПИСАНИИ — ТОЛЬКО ЧТЕНИЕ, ОДИН ЗАПРОС
-- ============================================================
--
-- ОТДЕЛЬНЫМ ФАЙЛОМ, ПОТОМУ ЧТО РЕДАКТОР ПОКАЗЫВАЕТ ОТВЕТ ТОЛЬКО НА
-- ПОСЛЕДНИЙ ЗАПРОС. 07.11 два запроса лежали в одном файле, и первый
-- ответ не доходил до глаз вовсе — дважды.
-- Правило: ЗАПРОС, ОТВЕТ НА КОТОРЫЙ НУЖЕН, ЕДЕТ В ФАЙЛЕ ОДИН.
--
-- Сам ключ не печатается — только признаки.
--   kluch_v_tekste = true  → секрет лежит строкой в расписании
--   beret_iz_vault = true  → задание читает секрет из хранилища (так надо)
--
-- В 04:00 по UTC три задания отработали разом: 200, 500 и 401.
-- Здесь видно, какие это задания.

SELECT  jobid,
        jobname,
        schedule,
        active,
        (command ILIKE '%sb_secret%'
         OR command ILIKE '%service_role%'
         OR command ILIKE '%Bearer %'
         OR command ILIKE '%apikey%')        AS kluch_v_tekste,
        (command ILIKE '%vault%')            AS beret_iz_vault,
        (command ILIKE '%net.http%')         AS hodit_po_seti,
        length(command)                      AS dlina_komandy
FROM    cron.job
ORDER BY jobid;

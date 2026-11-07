-- ОДИН ЗАПРОС. ТОЛЬКО ЧИТАЕТ. Отдай мне вывод целиком.
--
-- Какую функцию зовёт каждое задание. Секретов в командах нет — это
-- уже померено 07.11: `kluch_v_tekste` ложь у всех четырнадцати.
--
-- ЧТО ИЩЕМ:
--   404 в 03:30 — задание `membership-auto-expire` зовёт имя, которого
--       среди edge-функций нет; в коде лежит `membership-expire`
--   таймаут 5 с в 00:00, 01:00, 03:00 — кто именно не укладывается.
--       Моё первое предположение (`expire-challenges`) НЕ подтвердилось:
--       его команда — чистый UPDATE, по сети он не ходит вовсе
--
-- `adres_funkcii` вырезан из команды: по нему и видно, к какому имени
-- задание обращается.

SELECT  j.jobid,
        j.jobname,
        j.schedule,
        j.active,
        substring(j.command from 'functions/v1/([a-z0-9-]+)')  AS adres_funkcii,
        (j.command ILIKE '%net.http%')                         AS hodit_po_seti,
        (j.command ILIKE '%cron_secret%')                       AS beret_kluch_iz_vault,
        left(regexp_replace(j.command, '\s+', ' ', 'g'), 160)   AS nachalo_komandy
  FROM  cron.job j
 ORDER BY j.jobid;

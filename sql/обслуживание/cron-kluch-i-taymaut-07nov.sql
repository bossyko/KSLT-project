-- ЧИНИМ РАСПИСАНИЕ — 07.11. ГНАТЬ ПО ОДНОМУ, СВЕРХУ ВНИЗ.
--
-- ЧТО ПОМЕРЕНО 07.11 (`net._http_response` + `cron.job`):
--   401 у `news-fetch` и `news-offer` — ключ из Vault не равен
--       `SUPABASE_SERVICE_ROLE_KEY`, который сверяют сами функции.
--       Остальные задания отвечают 200 не потому, что ключ верен, а
--       потому, что ключ НЕ ПРОВЕРЯЮТ: сверяют его всего четыре функции
--       из тридцати трёх — news-fetch, news-offer, score-dispute-notify,
--       send-email.
--   таймаут 5 с — `match-start-notify` (*/5), единственное сетевое
--       задание в 00:00, 01:00 и 03:00. Пять секунд — умолчание
--       `net.http_post`, а не наш выбор.
--   404 — задание зовёт ПРАВИЛЬНОЕ имя `membership-expire`; значит сама
--       функция в Supabase не развёрнута. Это не правится запросом —
--       смотреть в панели Edge Functions, шаг 3 ниже.


-- ── 1. КЛЮЧ В ХРАНИЛИЩЕ ──────────────────────────────────────────────
-- ПОДСТАВЬ СВОЙ ТЕКУЩИЙ СЛУЖЕБНЫЙ КЛЮЧ вместо <КЛЮЧ> и не присылай его
-- мне: показывать ключ второй раз значит повторить беду 27.10.
-- Берётся: Supabase → Settings → API → service_role / secret key.
--
-- Сначала смотрим, что там лежит сейчас — БЕЗ показа самого значения:

SELECT  s.name,
        length(ds.decrypted_secret)                      AS dlina,
        left(ds.decrypted_secret, 3)                     AS nachalo,
        (ds.decrypted_secret LIKE 'eyJ%')                AS staryy_format_jwt,
        (ds.decrypted_secret LIKE 'sb_secret_%')         AS novyy_format,
        s.created_at,
        s.updated_at
  FROM  vault.secrets s
  JOIN  vault.decrypted_secrets ds ON ds.id = s.id
 WHERE  s.name = 'cron_secret';

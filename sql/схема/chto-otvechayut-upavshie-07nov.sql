-- ============================================================
-- ЧТО ОТВЕЧАЮТ УПАВШИЕ ЗАПРОСЫ — ТОЛЬКО ЧТЕНИЕ, ОДИН ЗАПРОС
-- ============================================================
--
-- ПОВОД (07.11). В 04:00 UTC два запроса получили 401 и 500. В расписании
-- на это время стоят `membership-expiry-notify` и `news-offer-morning`.
--
-- АДРЕСА В ТАБЛИЦЕ ОТВЕТОВ НЕТ — замерено составом столбцов: id,
-- status_code, content_type, headers, content, timed_out, error_msg,
-- created. Поэтому смотрим ТЕЛО ответа и заголовки: Supabase возвращает
-- в них и причину отказа, и опознание функции.
--
-- КАК ЧИТАТЬ:
--   401 с «Invalid JWT» или «invalid claim» → ключ из хранилища Vault
--       больше не принимается. После отзыва служебного ключа 27.10 там
--       мог остаться старый: лечится обновлением секрета `cron_secret`
--   500 → запрос дошёл, функция упала внутри; тело ответа назовёт место

SELECT  r.created                                        AS kogda,
        r.status_code,
        left(coalesce(r.content, ''), 300)               AS telo_otveta,
        left(coalesce(r.error_msg, ''), 150)             AS oshibka,
        r.headers ->> 'x-served-by'                      AS kto_otvetil,
        r.headers ->> 'sb-request-id'                    AS nomer_zaprosa,
        r.timed_out
FROM    net._http_response r
WHERE   r.status_code IS DISTINCT FROM 200
ORDER BY r.created DESC
LIMIT   20;

-- ОБНОВИТЬ КЛЮЧ В ХРАНИЛИЩЕ — 07.11. МЕНЯЕТ БАЗУ.
--
-- ПОДСТАВЬ СВОЙ ТЕКУЩИЙ СЛУЖЕБНЫЙ КЛЮЧ вместо <КЛЮЧ>.
-- Supabase → Settings → API → service_role (secret) key.
-- Ключ сюда не вписывается и в переписку не отдаётся.
--
-- Почему это чинит 401: `позвать_функцию` шлёт
-- `Authorization: Bearer <секрет из Vault>`, а `news-fetch` и
-- `news-offer` сверяют его НА РАВЕНСТВО с
-- `SUPABASE_SERVICE_ROLE_KEY`. Не равны — отказ.

SELECT vault.update_secret(
    (SELECT id FROM vault.secrets WHERE name = 'cron_secret'),
    '<КЛЮЧ>',
    'cron_secret',
    'Служебный ключ для заданий по расписанию. Обновлён 07.11.2026.'
);

-- Проверка: длина и формат должны совпасть с тем, что в панели.
SELECT length(ds.decrypted_secret) AS dlina,
       (ds.decrypted_secret LIKE 'sb_secret_%') AS novyy_format,
       s.updated_at
  FROM vault.secrets s
  JOIN vault.decrypted_secrets ds ON ds.id = s.id
 WHERE s.name = 'cron_secret';

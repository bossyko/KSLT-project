-- ============================================================
-- Задания по расписанию берут ключ из хранилища секретов
-- ============================================================
--
-- Шесть заданий не срабатывали ни разу с 15 марта 2026 года.
-- match-start-notify падал почти пятьдесят тысяч раз подряд, каждые пять
-- минут. Молчали напоминания о начале матча, уведомления о записи на
-- турнир, ежедневное напоминание о турнирах, снятие блокировки, истечение
-- членства и письмо о том, что членство кончается.
--
-- Причина одна: задание брало служебный ключ из настройки базы
-- app.settings.cron_secret, а её в боевой базе никто не завёл. Ошибка
-- оставалась в журнале pg_cron и наружу не выходила — оттого полгода никто
-- и не замечал.
--
-- Завести эту настройку теперь нельзя: Supabase закрыл правку параметров
-- и на уровне базы, и на уровне роли. Поэтому ключ переезжает в Vault —
-- хранилище секретов Supabase, оно для этого и сделано: значение лежит
-- зашифрованным, а достаёт его отдельная функция.
--
-- Перед запуском ключ должен быть в хранилище под именем cron_secret:
--   SELECT vault.create_secret('<служебный ключ>', 'cron_secret', 'описание');
--
-- Файл меняет базу. Читающие запросы — в cron-secret-vault-check.sql.

BEGIN;

-- ---- Откуда задания берут ключ ----
--
-- Отдельная функция, а не запрос к хранилищу прямо в задании: так адрес
-- секрета записан в одном месте, и менять его при случае придётся тоже
-- в одном.
--
-- SECURITY DEFINER нужен, чтобы функция дотянулась до хранилища. Права у
-- всех остальных отобраны сразу ниже: иначе любой вошедший пользователь
-- смог бы вызвать её через API и получить служебный ключ, а он обходит
-- все правила доступа.

CREATE OR REPLACE FUNCTION public.cron_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
    SELECT decrypted_secret
      FROM vault.decrypted_secrets
     WHERE name = 'cron_secret'
     LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.cron_secret() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_secret() FROM anon, authenticated;

COMMENT ON FUNCTION public.cron_secret() IS
    'Служебный ключ для вызовов из расписания. Доступна только владельцу базы: наружу этот ключ отдавать нельзя.';

-- ---- Общий вызов функции ----
--
-- Адрес проекта вписан прямо здесь. Раньше он брался из настройки
-- app.settings.supabase_url, но её теперь тоже не завести, а в прежних
-- заданиях он и так стоял открытым текстом.

CREATE OR REPLACE FUNCTION public.позвать_функцию(p_имя text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT net.http_post(
        url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/' || p_имя,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || public.cron_secret(),
            'Content-Type', 'application/json'),
        body := '{}'::jsonb);
$$;

REVOKE ALL ON FUNCTION public.позвать_функцию(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.позвать_функцию(text) FROM anon, authenticated;

COMMENT ON FUNCTION public.позвать_функцию(text) IS
    'Вызов Edge-функции из расписания со служебным ключом. Только для pg_cron.';

COMMIT;

-- ============================================================
-- Переписываем задания
-- ============================================================
-- Время запуска у каждого прежнее — меняется только способ добыть ключ.

-- Снимаем старые, чтобы не остались две записи с одним именем
SELECT cron.unschedule(jobname)
  FROM cron.job
 WHERE jobname IN ('tournament-registration-notify', 'match-start-notify',
                   'auto-unban-expired', 'membership-auto-expire',
                   'membership-expiry-notify', 'tournament-reminder-daily',
                   'news-fetch', 'news-offer-morning', 'news-offer-evening');

SELECT cron.schedule('tournament-registration-notify', '0 5 * * *',
    $$SELECT public.позвать_функцию('tournament-notify');$$);

SELECT cron.schedule('match-start-notify', '*/5 * * * *',
    $$SELECT public.позвать_функцию('match-notify');$$);

SELECT cron.schedule('auto-unban-expired', '0 3 * * *',
    $$SELECT public.позвать_функцию('auto-unban');$$);

SELECT cron.schedule('membership-auto-expire', '30 3 * * *',
    $$SELECT public.позвать_функцию('membership-expire');$$);

SELECT cron.schedule('membership-expiry-notify', '0 4 * * *',
    $$SELECT public.позвать_функцию('membership-notify');$$);

SELECT cron.schedule('tournament-reminder-daily', '0 2 * * *',
    $$SELECT public.позвать_функцию('tournament-reminder');$$);

-- ---- Мировые новости ----
-- Сбор раз в три часа, предложение дважды в день: в 10:00 и 18:00
-- по Бишкеку, то есть в 04:00 и 12:00 по Гринвичу.

SELECT cron.schedule('news-fetch', '13 */3 * * *',
    $$SELECT public.позвать_функцию('news-fetch');$$);

SELECT cron.schedule('news-offer-morning', '0 4 * * *',
    $$SELECT public.позвать_функцию('news-offer');$$);

SELECT cron.schedule('news-offer-evening', '0 12 * * *',
    $$SELECT public.позвать_функцию('news-offer');$$);

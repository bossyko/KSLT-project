-- ============================================================
-- Окончательное удаление учётных записей через 30 дней
-- ============================================================
--
-- Удаление аккаунта у нас отложенное: человек просит удалить, запись
-- получает метку и пропадает из общих списков, а тридцать дней её ещё
-- можно вернуть. Так обещано в политике конфиденциальности.
--
-- Потом запись должна исчезнуть. А стирать её было **некому**: ни задачи,
-- ни функции. Помеченные копились с меткой и жили дальше — то есть
-- обещание «потом удалится навсегда» не выполнялось вовсе.
--
-- Здесь и делается уборка. Запускается раз в сутки.
--
-- Порядок важен: сначала обезличиваем то, что должно пережить человека
-- (деньги, история турниров), потом удаляем сам профиль. Остальное
-- утянется за ним само — это задано в profile-delete-behavior.sql, и без
-- него уборка упрётся в те же связи.
--
-- Файл меняет базу. Читающие запросы — в profile-delete-behavior-check.sql:
-- уборка и связи проверяются вместе, порознь смысла не имеют.

CREATE OR REPLACE FUNCTION public.purge_deleted_accounts()
RETURNS TABLE (удалено integer, обезличено_платежей integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    просроченные uuid[];
    n_профилей integer := 0;
    n_платежей integer := 0;
BEGIN
    -- Кому вышел срок. Тридцать дней считаем от метки, а не от последнего
    -- входа: человек мог передумать и вернуться — тогда метку снимут
    SELECT array_agg(id) INTO просроченные
      FROM profiles
     WHERE deleted_at IS NOT NULL
       AND deleted_at < now() - interval '30 days';

    IF просроченные IS NULL OR array_length(просроченные, 1) IS NULL THEN
        RETURN QUERY SELECT 0, 0;
        RETURN;
    END IF;

    -- Деньги остаются, имя уходит. Отчётность клуба не должна зависеть от
    -- того, ушёл человек или нет.
    --
    -- В платеже сохраняем след в примечании: сумма без всякой привязки
    -- через год никому ничего не скажет, а «удалённая учётная запись»
    -- объясняет, почему строка ничья
    UPDATE payments
       SET profile_id = NULL,
           note = COALESCE(NULLIF(note, ''), '') ||
                  CASE WHEN COALESCE(note, '') = '' THEN '' ELSE ' · ' END ||
                  'плательщик удалил учётную запись'
     WHERE profile_id = ANY(просроченные);
    GET DIAGNOSTICS n_платежей = ROW_COUNT;

    -- Карточка игрока переживает учётную запись: очки, история матчей и
    -- место в рейтинге принадлежат клубу, а не аккаунту. Просто разрываем
    -- связь — карточка становится фоновой, как у тех, кто не регистрировался
    UPDATE players
       SET is_member = false
     WHERE id IN (SELECT player_id FROM profiles
                   WHERE id = ANY(просроченные) AND player_id IS NOT NULL);

    UPDATE profiles SET player_id = NULL WHERE id = ANY(просроченные);

    -- Сам профиль. Приглашения, вызовы, членства, устройства и уведомления
    -- уйдут вместе с ним — так задано в связях
    DELETE FROM profiles WHERE id = ANY(просроченные);
    GET DIAGNOSTICS n_профилей = ROW_COUNT;

    RETURN QUERY SELECT n_профилей, n_платежей;
END;
$$;

COMMENT ON FUNCTION public.purge_deleted_accounts() IS
    'Стирает учётные записи, помеченные на удаление больше тридцати дней назад. Деньги обезличивает, карточку игрока оставляет клубу.';

REVOKE ALL ON FUNCTION public.purge_deleted_accounts() FROM PUBLIC;

-- ---- Запуск раз в сутки ----
-- Ночью, когда людей на сайте нет.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('purge-deleted-accounts')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-accounts');

SELECT cron.schedule(
    'purge-deleted-accounts',
    '17 3 * * *',                      -- 03:17 каждую ночь
    $$SELECT public.purge_deleted_accounts()$$
);

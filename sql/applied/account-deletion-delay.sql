-- ============================================
-- Удаление учётной записи с отсрочкой в 30 дней
-- ============================================
--
-- Раньше кнопка «Удалить аккаунт» в кабинете не работала совсем: функция
-- delete-account первым делом писала в profiles.deleted_at, а такого поля
-- в базе не было — обращение обрывалось ошибкой, и до удаления дело не
-- доходило.
--
-- Заводим отметку об уходе.
--
--   deleted_at — учётная запись сразу пропадает из общих списков и
--   контактов, но живёт ещё 30 дней. Всё это время можно войти и вернуть
--   её обратно: люди передумывают, а восстановить стёртое нельзя. По
--   истечении срока запись удаляется насовсем.
--
-- Карточка игрока при удалении остаётся: результаты матчей, очки и
-- история игр принадлежат турнирам, а не учётной записи. Меняется одно —
-- на карточке появляется метка, что человек ушёл, и связь с учётной
-- записью обрывается.

BEGIN;

-- 1. Отметка об уходе
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.deleted_at IS
    'Когда человек попросил удалить учётную запись. 30 дней можно вернуть, потом удаляется насовсем';

-- 2. Отбор для ежедневной уборки: строк с меткой немного,
--    поэтому индекс только по ним
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
    ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. Метка на карточке игрока.
--    Держим на самом игроке, а не тянем из профиля: профиль через 30 дней
--    исчезнет, а карточка останется, и метка должна остаться вместе с ней
ALTER TABLE players ADD COLUMN IF NOT EXISTS account_deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN players.account_deleted_at IS
    'Когда учётная запись игрока была удалена. Карточка живёт дальше, но помечена';

COMMIT;

-- ============================================
-- Проверка
-- ============================================
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE (table_name = 'profiles' AND column_name = 'deleted_at')
--     OR (table_name = 'players'  AND column_name = 'account_deleted_at');

-- ============================================
-- Ежедневная уборка
-- ============================================
-- Раз в сутки в 03:20 UTC (09:20 по Бишкеку) — доводит до конца удаление
-- тех, у кого 30 дней вышли. Отдельно от снятия блокировок в 03:00, чтобы
-- две задачи не начинались в одну минуту.
--
-- Нужны расширения pg_cron и pg_net (Dashboard → Database → Extensions).

SELECT cron.schedule(
  'purge-deleted-accounts',
  '20 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qqkzszesviukopgjbead.supabase.co/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

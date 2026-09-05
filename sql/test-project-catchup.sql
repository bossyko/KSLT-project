-- ============================================================
-- Догнать тестовый проект до боевого
-- ============================================================
--
-- ЗАПУСКАТЬ ТОЛЬКО В ТЕСТОВОМ ПРОЕКТЕ (itlanqwcwygxchitaatt).
-- В боевом всё это уже стоит, второй раз не нужно.
--
-- Автопроверки ходят в отдельный проект Supabase. Правки базы туда всё
-- это время не переносились: файлы выкладывались в боевой, а тестовый
-- отставал. Расхождение вылезло, когда gender-one-word.sql упёрся в
-- отсутствующий столбец is_member.
--
-- Сверил схемы двух проектов по-настоящему, а не по памяти: в тестовом
-- не хватает шести столбцов из четырёх выкладок. Собрал их сюда одним
-- файлом, чтобы не гонять по одному и не ловить ошибки по очереди.
--
-- Каждая строка написана так, что повторный запуск ничего не сломает.
--
-- Порядок: сначала этот файл, потом gender-one-word.sql, потом
-- battle-manual-player-fields.sql, потом `node tests/seed.js`.

BEGIN;

-- ---- Счёт в миксте (из doubles-mixed-stats.sql) ----
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS mixed_wins   integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mixed_losses integer DEFAULT 0;

-- ---- След удалённой учётной записи (из account-deletion-delay.sql) ----
-- Карточка игрока переживает аккаунт: очки и история принадлежат клубу.
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS account_deleted_at timestamptz;

-- ---- Отметка члена клуба (из player-membership-flag.sql) ----
-- На неё опирается поиск партнёра: в списке только члены клуба.
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS is_member boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_players_is_member ON players (is_member);

-- ---- Взносы за турнир (из tournament-fees.sql) ----
-- Разная цена для членов клуба и гостей.
ALTER TABLE tournaments
    ADD COLUMN IF NOT EXISTS fee_member numeric,
    ADD COLUMN IF NOT EXISTS fee_guest  numeric;

-- ---- Вызовы и баттлы ----
--
-- Здесь отставание самое большое: пятнадцать столбцов из трёх выкладок.
-- Без них не встают ни парные баттлы, ни приглашённые со стороны игроки,
-- ни отмена — и файл battle-manual-player-fields.sql упирается в них же.

-- Отмена баттла (из challenges-rework.sql и battle-cancel.sql)
ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS cancelled_at  timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_by  uuid,
    ADD COLUMN IF NOT EXISTS cancel_reason text;

-- Игрок, которого нет в базе клуба (из battle-external-players.sql).
-- Заодно снимаем обязательность карточки: гостю её не заводят
ALTER TABLE public.challenges ALTER COLUMN challenger_player_id DROP NOT NULL;
ALTER TABLE public.challenges ALTER COLUMN opponent_player_id   DROP NOT NULL;

ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS challenger_external_name text,
    ADD COLUMN IF NOT EXISTS opponent_external_name   text,
    ADD COLUMN IF NOT EXISTS challenger_gender        text,
    ADD COLUMN IF NOT EXISTS opponent_gender          text;

-- Парные и микст (из battle-doubles.sql)
ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS format                    text DEFAULT 'singles',
    ADD COLUMN IF NOT EXISTS challenger_partner_id     text,
    ADD COLUMN IF NOT EXISTS challenger_partner_name   text,
    ADD COLUMN IF NOT EXISTS challenger_partner_gender text,
    ADD COLUMN IF NOT EXISTS opponent_partner_id       text,
    ADD COLUMN IF NOT EXISTS opponent_partner_name     text,
    ADD COLUMN IF NOT EXISTS opponent_partner_gender   text,
    ADD COLUMN IF NOT EXISTS allow_any_pair            boolean DEFAULT false;

ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_format_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_format_check
    CHECK (format IN ('singles', 'doubles', 'mixed_doubles'));

-- ---- Уведомление, ведущее к делу (из challenges-rework.sql) ----
-- Без этих двух столбцов строка в колокольчике не знает, к чему ведёт,
-- и нажатие открывает раздел вместо нужного матча.
ALTER TABLE public.notification_log
    ADD COLUMN IF NOT EXISTS action_type text,
    ADD COLUMN IF NOT EXISTS action_id   uuid;

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================
-- Должно вернуть двадцать одну строку.
--
-- SELECT table_name AS таблица, column_name AS столбец
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND (
--      (table_name = 'players'     AND column_name IN
--        ('mixed_wins','mixed_losses','account_deleted_at','is_member'))
--      OR
--      (table_name = 'tournaments' AND column_name IN ('fee_member','fee_guest'))
--      OR
--      (table_name = 'challenges'  AND column_name IN
--        ('cancelled_at','cancelled_by','cancel_reason',
--         'challenger_external_name','opponent_external_name',
--         'challenger_gender','opponent_gender','format','allow_any_pair',
--         'challenger_partner_id','challenger_partner_name','challenger_partner_gender',
--         'opponent_partner_id','opponent_partner_name','opponent_partner_gender'))
--    )
--  ORDER BY таблица, столбец;

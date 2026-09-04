-- ============================================================
-- Что делать со связанными записями, когда удаляют профиль
-- ============================================================
--
-- Профиль нельзя было удалить вовсе. База по умолчанию запрещает удалять
-- строку, на которую кто-то ссылается, а на профиль ссылаются восемь
-- связей — и ни у одной не было сказано, как поступать. Первым упирался
-- в приглашение поиграть, следом упёрся бы в вызовы, платежи и рассылки.
--
-- Это ломало не только ручное удаление из админки. Удаление аккаунта у нас
-- отложено на тридцать дней: метка ставится, а стирать должна уборка. Она
-- упиралась бы в ту же стену.
--
-- Решаем по-разному, потому что записи разные.
--
--   Приглашения и вызовы — удаляем вместе с человеком. Без него они
--   бессмысленны: играть некому.
--
--   Платежи и членства — не удаляем, а отвязываем. Это денежные записи,
--   они нужны для отчётности и после ухода человека. Останутся суммы и
--   даты без имени — ровно то обезличивание, которое обещано в политике
--   конфиденциальности.
--
--   Кто завёл запись — менеджер в платеже, админ в рассылке — тоже
--   отвязываем. Уволился сотрудник, учётную запись убрали, а платежи
--   клуба должны остаться.
--
-- Файл меняет базу. Читающие запросы — в profile-delete-behavior-check.sql.

-- ---- Приглашения поиграть ----
-- Отправитель обязателен, отвязать нельзя — только удалить вместе с ним.

ALTER TABLE public.game_invites
    DROP CONSTRAINT IF EXISTS game_invites_sender_id_fkey;
ALTER TABLE public.game_invites
    ADD CONSTRAINT game_invites_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.game_invites
    DROP CONSTRAINT IF EXISTS game_invites_receiver_profile_id_fkey;
ALTER TABLE public.game_invites
    ADD CONSTRAINT game_invites_receiver_profile_id_fkey
    FOREIGN KEY (receiver_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ---- Вызовы на матч ----
-- Оба поля необязательны, но вызов без обеих сторон — мусор. Удаляем.

ALTER TABLE public.challenges
    DROP CONSTRAINT IF EXISTS challenges_challenger_id_fkey;
ALTER TABLE public.challenges
    ADD CONSTRAINT challenges_challenger_id_fkey
    FOREIGN KEY (challenger_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.challenges
    DROP CONSTRAINT IF EXISTS challenges_opponent_profile_id_fkey;
ALTER TABLE public.challenges
    ADD CONSTRAINT challenges_opponent_profile_id_fkey
    FOREIGN KEY (opponent_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ---- Платежи ----
-- Деньги остаются. Кто заплатил — обезличивается.

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_profile_id_fkey;
ALTER TABLE public.payments
    ADD CONSTRAINT payments_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE public.payments
    ADD CONSTRAINT payments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---- Членства: кто завёл ----
-- Само членство уже удаляется вместе с человеком (ON DELETE CASCADE стоял
-- изначально). Здесь только след сотрудника, который его оформил.

ALTER TABLE public.memberships
    DROP CONSTRAINT IF EXISTS memberships_created_by_fkey;
ALTER TABLE public.memberships
    ADD CONSTRAINT memberships_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---- Журнал рассылок ----
-- Рассылка остаётся в истории, даже если админа больше нет. Служебные
-- рассылки и так идут без него — поле давно необязательное.

ALTER TABLE public.push_log
    DROP CONSTRAINT IF EXISTS push_log_admin_id_fkey;
ALTER TABLE public.push_log
    ADD CONSTRAINT push_log_admin_id_fkey
    FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

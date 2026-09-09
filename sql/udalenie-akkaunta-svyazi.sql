-- ============================================================
-- Удаление аккаунта: убрать то, что его держит
-- ============================================================
--
-- Supabase не давал удалить человека: «Database error deleting user». Причина
-- в двух связях, у которых не прописано, что делать при удалении, — база в
-- таком случае просто запрещает удалять.
--
-- Разбираем их по смыслу:
--
--   discount_vouchers.profile_id — ваучеры принадлежат человеку. Уходит он —
--   уходят и они. Поле обязательное, обнулить нельзя, поэтому удаляем следом.
--
--   entity_payments.created_by — это пометка, кто внёс платёж. Сам платёж
--   принадлежит клубу и остаётся в бухгалтерии; пометка обнуляется.
--
-- Остальные тринадцать связей уже настроены верно: удаляются следом.
--
-- После этого файла аккаунты удаляются и кнопкой в Supabase, и запросом.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Ваучеры уходят вместе с человеком ----

ALTER TABLE public.discount_vouchers
    DROP CONSTRAINT IF EXISTS discount_vouchers_profile_id_fkey;

ALTER TABLE public.discount_vouchers
    ADD CONSTRAINT discount_vouchers_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---- У платежа остаётся сам платёж, пометка о вносившем обнуляется ----

ALTER TABLE public.entity_payments
    DROP CONSTRAINT IF EXISTS entity_payments_created_by_fkey;

ALTER TABLE public.entity_payments
    ADD CONSTRAINT entity_payments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;

-- ---- Проверить, что держащих связей не осталось ----

SELECT c.conname AS связь,
       n.nspname || '.' || t.relname AS таблица,
       CASE c.confdeltype
            WHEN 'a' THEN 'запрещает удаление'
            WHEN 'c' THEN 'удаляет следом'
            WHEN 'n' THEN 'обнуляет'
            WHEN 'r' THEN 'ограничивает'
            ELSE c.confdeltype::text
       END AS при_удалении
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
 WHERE c.contype = 'f'
   AND c.confrelid = 'auth.users'::regclass
   AND c.confdeltype IN ('a', 'r')
 ORDER BY таблица;
-- Ожидаем пусто.

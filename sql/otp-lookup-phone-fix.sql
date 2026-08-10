-- ============================================
-- Поиск по телефону: полный номер вместо хвоста
-- Запустить в Supabase SQL Editor целиком, после otp-lookup-indexes.sql.
-- ============================================
--
-- В прошлой миграции для поиска брались последние девять цифр номера —
-- по кыргызским номерам это ровно номер без кода страны. Но у американского
-- номера после кода страны десять цифр, и правило отрезало лишнее:
-- +1 240 974 0690 превращалось в 409740690, теряя первую цифру кода региона.
--
-- Считаем полный номер в международном виде, одними цифрами. Местные записи
-- без кода страны достраиваем до кыргызского: у нас их пишут либо «0555…»,
-- либо просто «555…».

ALTER TABLE profiles DROP COLUMN IF EXISTS phone_tail;

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS phone_e164 TEXT
    GENERATED ALWAYS AS (
        CASE
            WHEN regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = ''
                THEN ''
            -- 555123456 — местный номер без нуля и без кода страны
            WHEN length(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')) = 9
                THEN '996' || regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
            -- 0555123456 — местный номер с нулём
            WHEN length(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')) = 10
                 AND left(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 1) = '0'
                THEN '996' || right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 9)
            -- всё остальное уже с кодом страны
            ELSE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
        END
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_profiles_phone_e164 ON profiles (phone_e164)
    WHERE phone_e164 <> '';

COMMENT ON COLUMN profiles.phone_e164 IS
    'Телефон одними цифрами в международном виде. Местные номера достроены до 996. Для поиска при восстановлении доступа';

-- --- Проверка ----------------------------------------------------------
-- Американский номер должен остаться целым, кыргызские — начинаться с 996,
-- а записанные по-разному — совпасть между собой.

SELECT phone, phone_e164, length(phone_e164) AS цифр
FROM profiles
WHERE phone IS NOT NULL AND phone <> ''
ORDER BY phone_e164
LIMIT 20;

-- Не появилось ли одинаковых номеров у разных людей
SELECT phone_e164, count(*) AS профилей
FROM profiles
WHERE phone_e164 <> ''
GROUP BY phone_e164
HAVING count(*) > 1;

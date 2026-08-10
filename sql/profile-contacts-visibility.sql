-- ============================================
-- Каждый способ связи открывается отдельно
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Разрешений было два, и оба грубые: одно открывало телефон вместе с
-- WhatsApp, другое — телеграм вместе с инстаграмом. А это разные вещи:
-- телеграм может быть рабочий, WhatsApp личный. Человек не мог открыть один
-- и скрыть другой.
--
-- Теперь по разрешению на каждый способ связи.
--
-- И отдельный номер для WhatsApp: он не всегда совпадает с основным. Поле
-- необязательное — пустое значит «тот же, что телефон», и вводить номер
-- дважды никого не заставляем.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_country TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_telegram BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_instagram BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.whatsapp_phone IS
    'Номер WhatsApp, если отличается от основного. Пусто — используется phone';
COMMENT ON COLUMN profiles.whatsapp_country IS
    'Страна номера WhatsApp, код ISO 3166-1 alpha-2';
COMMENT ON COLUMN profiles.show_whatsapp IS
    'Показывать WhatsApp членам клуба. Не зависит от показа самого телефона';
COMMENT ON COLUMN profiles.show_telegram IS
    'Показывать телеграм членам клуба';
COMMENT ON COLUMN profiles.show_instagram IS
    'Показывать инстаграм членам клуба';

-- Переносим то, что человек уже разрешил: общее согласие на соцсети
-- превращается в согласие на оба канала по отдельности.
UPDATE profiles
SET show_telegram  = COALESCE(show_socials, false),
    show_instagram = COALESCE(show_socials, false)
WHERE show_socials IS TRUE;

-- WhatsApp раньше открывался вместе с телефоном — сохраняем это состояние,
-- чтобы у людей ничего не пропало без их ведома.
UPDATE profiles
SET show_whatsapp = true
WHERE show_phone IS TRUE;

-- show_socials остаётся в таблице, но больше не используется: старые сборки
-- приложения могут его ещё читать, и обнулять его сейчас незачем.

-- --- Проверка -----------------------------------------------------------

SELECT full_name AS профиль,
       show_phone     AS телефон,
       show_whatsapp  AS whatsapp,
       show_telegram  AS телеграм,
       show_instagram AS инстаграм,
       CASE WHEN whatsapp_phone IS NULL OR whatsapp_phone = ''
            THEN 'тот же' ELSE whatsapp_phone END AS номер_whatsapp
FROM profiles
ORDER BY full_name;

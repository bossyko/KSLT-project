-- ============================================
-- Страна телефона в профиле
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Телефон вводился строкой в свободном виде, и страна из него только
-- угадывалась по коду. На +7 угадывание не работает вовсе: этот код общий
-- у России и Казахстана, и различить их по номеру невозможно.
--
-- Теперь человек выбирает страну из списка, а код подставляется сам.
-- Выбранная страна хранится здесь — двухбуквенным кодом, как в ISO 3166:
-- KG, RU, KZ. По нему показывается флаг при следующем открытии формы, и
-- он же пригодится для СМС: тарифы и маршруты у операторов разные.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country TEXT;

COMMENT ON COLUMN profiles.phone_country IS
    'Страна телефона, код ISO 3166-1 alpha-2 (KG, RU, KZ). Выбирается человеком, а не выводится из номера';

-- Существующим записям проставляем страну там, где код однозначен.
-- +7 намеренно пропускаем: Россия и Казахстан неразличимы, пусть человек
-- выберет сам при следующем сохранении.
UPDATE profiles
SET phone_country = CASE
        WHEN phone_e164 LIKE '996%' THEN 'KG'
        WHEN phone_e164 LIKE '998%' THEN 'UZ'
        WHEN phone_e164 LIKE '992%' THEN 'TJ'
        WHEN phone_e164 LIKE '380%' THEN 'UA'
        WHEN phone_e164 LIKE '90%'  THEN 'TR'
        WHEN phone_e164 LIKE '971%' THEN 'AE'
        WHEN phone_e164 LIKE '86%'  THEN 'CN'
        WHEN phone_e164 LIKE '82%'  THEN 'KR'
        WHEN phone_e164 LIKE '44%'  THEN 'GB'
        WHEN phone_e164 LIKE '49%'  THEN 'DE'
        WHEN phone_e164 LIKE '1%'   THEN 'US'
    END
WHERE phone_e164 IS NOT NULL
  AND phone_e164 <> ''
  AND phone_country IS NULL;

-- Проверка
SELECT phone, phone_e164, phone_country
FROM profiles
WHERE phone IS NOT NULL AND phone <> ''
ORDER BY phone_country NULLS LAST
LIMIT 20;

SELECT count(*) FILTER (WHERE phone_country IS NOT NULL) AS со_страной,
       count(*) FILTER (WHERE phone_e164 <> '' AND phone_country IS NULL) AS страна_не_определилась,
       count(*) AS всего
FROM profiles;

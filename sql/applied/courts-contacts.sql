-- ============================================
-- Инстаграм и WhatsApp у кортов
-- ============================================
--
-- Телефон в таблице был один на всё, а в реестре у кортов отдельно
-- обычный номер и отдельно WhatsApp — иногда это разные номера.
-- Заводим два поля и заполняем тем, что есть.
--
-- Инстаграм: аккаунт указан у пятнадцати кортов из тридцати одного.
-- Чужие аккаунты не берём: у корта в Оше в источнике стоит аккаунт
-- Федерации тенниса — это не аккаунт корта.
--
-- WhatsApp: только там, где номер написан прямо. Формат хранения тот же,
-- что пишет админка: код страны слитно с номером. У части кортов в
-- источнике сказано просто «есть (2ГИС)» — это не номер, оставляем пусто.

ALTER TABLE courts ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS whatsapp text;

-- Инстаграм
UPDATE courts SET instagram = '@tclubkg' WHERE id = 't-club';
UPDATE courts SET instagram = '@tennis_academy_kg' WHERE id = 'akademiya-tennisa-kr';
UPDATE courts SET instagram = '@sportclubk2' WHERE id = 'k2';
UPDATE courts SET instagram = '@karven_sportclub' WHERE id = 'karven-sport-club';
UPDATE courts SET instagram = '@family.sport' WHERE id = 'family-sport';
UPDATE courts SET instagram = '@ervin.tennisclub' WHERE id = 'ervin-tennis-school';
UPDATE courts SET instagram = '@tiebreak.kg' WHERE id = 'tay-breyk';
UPDATE courts SET instagram = '@tennis.bishkek' WHERE id = 'tennis-bishkek-trener-gruppy';
UPDATE courts SET instagram = '@kapriz_resort' WHERE id = 'kapriz-issyk-kul-resort-hotel';
UPDATE courts SET instagram = '@karven4seasons_official' WHERE id = 'karven-four-seasons';
UPDATE courts SET instagram = '@akun_issyk_kul' WHERE id = 'akun-issyk-kul-hotel';
UPDATE courts SET instagram = '@marcopolo.kg' WHERE id = 'marco-polo-resort-hotel';
UPDATE courts SET instagram = '@3korony.kg' WHERE id = 'tri-korony';
UPDATE courts SET instagram = '@baytur_resort_spa' WHERE id = 'baytur-rezort-end-spa';
UPDATE courts SET instagram = '@jfa_jalalabad' WHERE id = 'fok-gazprom-dzhalal-abad';

-- WhatsApp
UPDATE courts SET whatsapp = '+996770891464' WHERE id = 't-club';
UPDATE courts SET whatsapp = '+996700519254' WHERE id = 'family-sport';
UPDATE courts SET whatsapp = '+996995176762' WHERE id = 'ervin-tennis-school';
UPDATE courts SET whatsapp = '+996770072111' WHERE id = 'azur-sport-rezort';
UPDATE courts SET whatsapp = '+996772502310' WHERE id = 'karven-issyk-kul';
UPDATE courts SET whatsapp = '+996505581681' WHERE id = 'meridian';
UPDATE courts SET whatsapp = '+996772502310' WHERE id = 'issyk-kul-aurora-sanatorium';
UPDATE courts SET whatsapp = '+996772502310' WHERE id = 'ak-maral';
UPDATE courts SET whatsapp = '+996551990000' WHERE id = 'baytur-rezort-end-spa';
UPDATE courts SET whatsapp = '+996772502310' WHERE id = 'kyrgyzskoe-vzmorye';

SELECT COUNT(*) FILTER (WHERE instagram IS NOT NULL) AS with_instagram,
       COUNT(*) FILTER (WHERE whatsapp IS NOT NULL)  AS with_whatsapp,
       COUNT(*) FILTER (WHERE phone IS NOT NULL)     AS with_phone,
       COUNT(*) AS total
FROM courts;

-- ============================================================
-- Почта клуба: info@tennis.kg → kslt.kyrgyzstan@gmail.com
-- ============================================================
--
-- Приём почты на info@tennis.kg так и не заработал: нужна была пересылка
-- на Gmail, а её настройка упиралась то в Cloudflare, то в хостинг.
-- Решили не городить пересылку вовсе, а сразу указывать почтовый ящик,
-- который читают.
--
-- В коде адрес заменён: подвал на всех страницах, страница спонсорства,
-- админка, запасная разметка правовых документов. Здесь остаётся то, что
-- живёт в базе — сами документы, которые читают и сайт, и приложение.
--
-- Замена идёт по тексту: адрес встречается и в ссылке mailto, и рядом
-- обычным текстом, а в трёх языках по-разному свёрстан.
--
-- Файл меняет базу. Читающие запросы — в contact-email-gmail-check.sql.

BEGIN;

UPDATE public.site_documents
   SET body       = replace(body,       'info@tennis.kg', 'kslt.kyrgyzstan@gmail.com'),
       body_en    = replace(body_en,    'info@tennis.kg', 'kslt.kyrgyzstan@gmail.com'),
       body_kg    = replace(body_kg,    'info@tennis.kg', 'kslt.kyrgyzstan@gmail.com'),
       updated_at = now()
 WHERE body    LIKE '%info@tennis.kg%'
    OR body_en LIKE '%info@tennis.kg%'
    OR body_kg LIKE '%info@tennis.kg%';

-- Заглавный экран и прочие подписи — на случай, если адрес попал и туда
UPDATE public.site_content
   SET value    = replace(value,    'info@tennis.kg', 'kslt.kyrgyzstan@gmail.com'),
       value_en = replace(value_en, 'info@tennis.kg', 'kslt.kyrgyzstan@gmail.com'),
       value_kg = replace(value_kg, 'info@tennis.kg', 'kslt.kyrgyzstan@gmail.com'),
       updated_at = now()
 WHERE value    LIKE '%info@tennis.kg%'
    OR value_en LIKE '%info@tennis.kg%'
    OR value_kg LIKE '%info@tennis.kg%';

COMMIT;


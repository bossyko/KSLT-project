-- ============================================================
-- Проверка замены почты — только чтение
-- ============================================================
--
-- Запускать до и после contact-email-gmail.sql. Ничего не меняет.

-- 1. Где ещё остался старый адрес. После правки — ноль строк.
SELECT 'site_documents' AS таблица, slug AS ключ,
       (body    LIKE '%info@tennis.kg%') AS в_русском,
       (body_en LIKE '%info@tennis.kg%') AS в_английском,
       (body_kg LIKE '%info@tennis.kg%') AS в_кыргызском
  FROM site_documents
 WHERE body LIKE '%info@tennis.kg%' OR body_en LIKE '%info@tennis.kg%'
    OR body_kg LIKE '%info@tennis.kg%'
UNION ALL
SELECT 'site_content', key,
       (value    LIKE '%info@tennis.kg%'),
       (value_en LIKE '%info@tennis.kg%'),
       (value_kg LIKE '%info@tennis.kg%')
  FROM site_content
 WHERE value LIKE '%info@tennis.kg%' OR value_en LIKE '%info@tennis.kg%'
    OR value_kg LIKE '%info@tennis.kg%';

-- 2. Где стоит новый. После правки должны появиться строки документов.
SELECT slug AS документ,
       (body    LIKE '%kslt.kyrgyzstan@gmail.com%') AS в_русском,
       (body_en LIKE '%kslt.kyrgyzstan@gmail.com%') AS в_английском,
       (body_kg LIKE '%kslt.kyrgyzstan@gmail.com%') AS в_кыргызском,
       updated_at                                   AS правился
  FROM site_documents
 ORDER BY slug;

-- ============================================================
-- Проверка правовых документов — только чтение
-- ============================================================
-- Запускать после site-documents.sql.

-- 1. Что легло: три документа, у каждого три языка
SELECT slug,
       length(body)    AS ru_знаков,
       length(body_en) AS en_знаков,
       length(body_kg) AS kg_знаков,
       title
  FROM public.site_documents
 ORDER BY slug;

-- 2. Нет ли пустых языков — тогда в приложении покажется прочерк
SELECT slug,
       (body    IS NULL OR body    = '') AS пусто_ru,
       (body_en IS NULL OR body_en = '') AS пусто_en,
       (body_kg IS NULL OR body_kg = '') AS пусто_kg
  FROM public.site_documents
 ORDER BY slug;

-- 3. Кто может читать. Ожидаем, что видно всем
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS условие
  FROM pg_policy
 WHERE polrelid = 'public.site_documents'::regclass;

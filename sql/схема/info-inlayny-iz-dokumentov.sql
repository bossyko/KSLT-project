-- ============================================================================
-- ИНФО · ДОКУМЕНТЫ: ИНЛАЙНОВЫЕ КЕГЛИ УХОДЯТ ИЗ ДАННЫХ. 09.10.2026
--
-- ПОЧЕМУ ЭТО ПРАВКА ДАННЫХ, А НЕ СТИЛЕЙ. Текст «Оферты» и «Политики»
-- приходит из этой таблицы (js/site-content.js:173), и прямо в теле
-- документа лежит инлайновый стиль с кеглем. Инлайн весит больше любого
-- селектора — из файла стилей его не перебить вовсе. Замер 09.10: на
-- «Оферте» и «Политике» вводный абзац шёл 16.8 с межстрочным 1.8, строка о
-- редакции — 15.2; ни одно из этих чисел не стоит на шкале
-- 11 · 12 · 14 · 16 · 18 · 21 · 26 · 32 · 40.
--
-- ОФОРМЛЕНИЕ У ЭТИХ АБЗАЦЕВ УЖЕ ЕСТЬ: классы `ip-doc-lead` и
-- `ip-doc-revision` (css/info-pages.css) задают кегль, цвет и межстрочный
-- по шкале. Инлайн их просто перебивал.
--
-- ЧТО ТРОГАЕМ: ровно восемь вхождений, по счёту чтением базы —
--   `1.05rem` : offer/body, offer/body_kg, privacy/body, privacy/body_en,
--               privacy/body_kg  — пять;
--   `0.95rem` : privacy/body, privacy/body_en, privacy/body_kg — три.
-- Остальные инлайны тел НЕ ТРОГАЕМ: 157 отступов списка и 38 цветов —
-- отдельная находка, записана, ждёт своей очереди.
--
-- ПРОГНАТЬ ЭТО — тремя шагами, по порядку.
-- ============================================================================

-- --- ШАГ 0. СЛЕПОК. Правка данных без слепка не начинается ---------------
CREATE TABLE IF NOT EXISTS public.slepok_site_documents_0910 AS
SELECT * FROM public.site_documents;

SELECT count(*) AS strok_v_slepke FROM public.slepok_site_documents_0910;


-- --- ШАГ 1. ПРАВКА -------------------------------------------------------
UPDATE public.site_documents
SET body    = replace(replace(coalesce(body, ''),    ' style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;"', ''), ' style="color: rgba(255,255,255,0.6); font-size: 0.95rem; text-align: center; padding: 20px 0;"', ''),
    body_en = replace(replace(coalesce(body_en, ''), ' style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;"', ''), ' style="color: rgba(255,255,255,0.6); font-size: 0.95rem; text-align: center; padding: 20px 0;"', ''),
    body_kg = replace(replace(coalesce(body_kg, ''), ' style="color: rgba(255,255,255,0.8); font-size: 1.05rem; line-height: 1.8;"', ''), ' style="color: rgba(255,255,255,0.6); font-size: 0.95rem; text-align: center; padding: 20px 0;"', '')
WHERE slug IN ('offer', 'privacy');


-- --- ШАГ 2. ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS» ---------------------
SELECT slug,
       (body    LIKE '%1.05rem%') AS ru_kegl_ostalsya,
       (body_en LIKE '%1.05rem%') AS en_kegl_ostalsya,
       (body_kg LIKE '%1.05rem%') AS kg_kegl_ostalsya,
       (body    LIKE '%0.95rem%') AS ru_revizia_ostalas,
       (body_en LIKE '%0.95rem%') AS en_revizia_ostalas,
       (body_kg LIKE '%0.95rem%') AS kg_revizia_ostalas,
       length(body)    AS ru_znakov,
       length(body_en) AS en_znakov,
       length(body_kg) AS kg_znakov
FROM public.site_documents
WHERE slug IN ('offer', 'terms', 'privacy')
ORDER BY slug;

-- Сверка с слепком: текст должен укоротиться ровно на снятые инлайны и
-- больше ни на знак.
SELECT d.slug,
       length(s.body)    - length(d.body)    AS ru_ubylo,
       length(s.body_en) - length(d.body_en) AS en_ubylo,
       length(s.body_kg) - length(d.body_kg) AS kg_ubylo
FROM public.site_documents d
JOIN public.slepok_site_documents_0910 s ON s.slug = d.slug
WHERE d.slug IN ('offer', 'terms', 'privacy')
ORDER BY d.slug;

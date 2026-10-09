-- ============================================================
-- АДРЕС САЙТА И ИНЛАЙНОВЫЙ ЦВЕТ — В ДАННЫХ ДОКУМЕНТОВ
-- ============================================================
--
-- Слово Кости 09.10: сайт — www.tennis.kg.
--
-- ПОЧЕМУ ПРАВКА ИДЁТ В БАЗУ, А НЕ В РАЗМЕТКУ. Тело «Политики»,
-- «Условий» и «Оферты» приходит из site_documents (js/site-content.js:173)
-- и ПЕРЕКРЫВАЕТ то, что написано в html. 09.10 адрес в
-- pages/privacy-policy*.html уже исправлен — на экране он всё равно
-- старый, потому что побеждают данные. Замер боевой базы 09.10:
--
--   документ   язык   kslt.kg   инлайнов style="color:"
--   privacy    ru        8          12
--   privacy    en        8          12
--   privacy    kg        8          12
--   terms      en        0           1
--   terms      kg        0           1
--   offer      —         0           0
--
-- Итого 24 адреса и 38 инлайнов — ровно столько же, сколько снято из
-- разметки: данные и html были копиями друг друга.
--
-- ВТОРОЕ ИЗМЕНЕНИЕ — ЦВЕТ. Инлайн в разметке бьёт правило по весу, и
-- починить его из файла стилей нельзя вовсе. Цвет ссылки в теле
-- документа теперь задан одним правилом (css/info-pages.css,
-- .ip-rules-section p a — accent #CCFF00, 16.85:1 к фону) и проверен
-- в браузере: со снятым инлайном ссылка остаётся лаймовой и
-- подчёркнутой. Поэтому инлайны можно убирать, не теряя читаемости.
--
-- Запускать можно повторно: после первого прогона замены ничего не
-- находят и строки не меняются.

BEGIN;

-- ---- ШАГ 0: СЛЕПОК ДО ПРАВКИ ----
-- Невозвратного здесь нет, но текст документов — не то, что
-- восстанавливают по памяти.
DROP TABLE IF EXISTS public.slepok_site_documents_0910;
CREATE TABLE public.slepok_site_documents_0910 AS
SELECT * FROM public.site_documents;

-- ---- ШАГ 1: АДРЕС ----
-- Одна замена покрывает все три вида записи: https://kslt.kg,
-- текст ссылки kslt.kg и путь kslt.kg/pages/...
UPDATE public.site_documents SET
    body    = replace(body,    'kslt.kg', 'www.tennis.kg'),
    body_en = replace(body_en, 'kslt.kg', 'www.tennis.kg'),
    body_kg = replace(body_kg, 'kslt.kg', 'www.tennis.kg'),
    updated_at = now()
WHERE body    LIKE '%kslt.kg%'
   OR body_en LIKE '%kslt.kg%'
   OR body_kg LIKE '%kslt.kg%';

-- ---- ШАГ 2: ИНЛАЙНОВЫЙ ЦВЕТ ----
UPDATE public.site_documents SET
    body    = replace(body,    ' style="color: #CCFF00;"', ''),
    body_en = replace(body_en, ' style="color: #CCFF00;"', ''),
    body_kg = replace(body_kg, ' style="color: #CCFF00;"', ''),
    updated_at = now()
WHERE body    LIKE '%style="color: #CCFF00;"%'
   OR body_en LIKE '%style="color: #CCFF00;"%'
   OR body_kg LIKE '%style="color: #CCFF00;"%';

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»
-- ============================================================

-- 1. Старого адреса и инлайнов не осталось: все шесть чисел ждём НОЛЬ.
SELECT slug,
       (length(body)    - length(replace(body,    'kslt.kg', ''))) / length('kslt.kg') AS adres_ru,
       (length(body_en) - length(replace(body_en, 'kslt.kg', ''))) / length('kslt.kg') AS adres_en,
       (length(body_kg) - length(replace(body_kg, 'kslt.kg', ''))) / length('kslt.kg') AS adres_kg,
       (length(body)    - length(replace(body,    'style="color:', ''))) / length('style="color:') AS inlayn_ru,
       (length(body_en) - length(replace(body_en, 'style="color:', ''))) / length('style="color:') AS inlayn_en,
       (length(body_kg) - length(replace(body_kg, 'style="color:', ''))) / length('style="color:') AS inlayn_kg
  FROM public.site_documents
 ORDER BY slug;

-- 2. Новый адрес на месте: ждём по 8 у privacy на каждом языке.
SELECT slug,
       (length(body)    - length(replace(body,    'www.tennis.kg', ''))) / length('www.tennis.kg') AS novyy_ru,
       (length(body_en) - length(replace(body_en, 'www.tennis.kg', ''))) / length('www.tennis.kg') AS novyy_en,
       (length(body_kg) - length(replace(body_kg, 'www.tennis.kg', ''))) / length('www.tennis.kg') AS novyy_kg
  FROM public.site_documents
 ORDER BY slug;

-- 3. Текст не потерян, а только укоротился на снятые инлайны и
--    удлинился на шесть букв адреса. Ждём: tekst_cel = true везде.
SELECT d.slug,
       left(d.body, 80) = left(s.body, 80) AS nachalo_celo,
       length(s.body)    AS bylo_ru,  length(d.body)    AS stalo_ru,
       length(s.body_en) AS bylo_en,  length(d.body_en) AS stalo_en,
       length(s.body_kg) AS bylo_kg,  length(d.body_kg) AS stalo_kg
  FROM public.site_documents d
  JOIN public.slepok_site_documents_0910 s USING (slug)
 ORDER BY d.slug;

-- 4. Слепок на месте, пока Костя не посмотрит страницы глазами.
SELECT count(*) AS strok_v_slepke FROM public.slepok_site_documents_0910;

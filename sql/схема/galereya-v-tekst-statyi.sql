-- ПЕРЕНОС ГАЛЕРЕИ В ТЕКСТ СТАТЬИ
--
-- ЗАЧЕМ. Фотография в статье жила в двух местах: блок «Фото с турнира»
-- писал в `news.gallery`, редактор — в текст. На странице это были два
-- разных устройства с двумя разными поведениями: ОДНО ПОНЯТИЕ, ДВА
-- ПОВЕДЕНИЯ. Блок снят 09.10; в базе остались 36 снимков у девяти статей,
-- и писать в `gallery` больше некому (проверено: ни одного `gallery:` в
-- js/admin — только `courts.gallery`, это другая таблица).
--
-- ЧТО ДЕЛАЕТ. Дописывает каждый снимок из `gallery` в КОНЕЦ текста той же
-- статьи — на всех трёх языках — ровно той разметкой, которую ставит
-- редактор (js/admin/core/editor.js:329):
--     <figure><img src="…" alt=""></figure>
-- Подряд идущие фигуры страница собирает в одну ленту сама
-- (js/kslt-lenta.js, зовётся из js/news.js:638) — отдельная нижняя
-- галерея больше не нужна. Замер подтвердил: текст всех девяти статей
-- кончается на `</p>`, значит фигуры образуют свою группу и не
-- приклеятся к снимку, стоящему в середине текста.
--
-- ПОРЯДОК. Три шага, каждый отдельным прогоном, СВЕРХУ ВНИЗ. Шаг 2 не
-- запускать, пока шаг 1 не показал слепок. Шаг 1 безопасен: он только
-- читает и создаёт копию.

-- ===========================================================
-- ШАГ 1. СЛЕПОК. Копия того, что собираемся тронуть.
-- ===========================================================

CREATE TABLE IF NOT EXISTS public.slepok_news_gallery_0810 AS
SELECT id, title, gallery, content, content_en, content_kg, now() AS snyato
  FROM public.news
 WHERE jsonb_typeof(gallery) = 'array'
   AND jsonb_array_length(gallery) > 0;

SELECT count(*)                                  AS statey,
       sum(jsonb_array_length(gallery))          AS fotografiy
  FROM public.slepok_news_gallery_0810;

-- Ожидаем: statey = 9, fotografiy = 36.
-- Другие числа — НЕ ЗАПУСКАТЬ ШАГ 2, сказать мне.

-- ===========================================================
-- ШАГ 2. ПРАВКА. Фотографии — в текст, галерея — в пусто.
-- ===========================================================

WITH razmetka AS (
    SELECT n.id,
           string_agg('<figure><img src="' || f.adres || '" alt=""></figure>',
                      '' ORDER BY f.nomer) AS kadry
      FROM public.news n,
           jsonb_array_elements_text(n.gallery) WITH ORDINALITY AS f(adres, nomer)
     WHERE jsonb_typeof(n.gallery) = 'array'
       AND jsonb_array_length(n.gallery) > 0
     GROUP BY n.id
)
UPDATE public.news n
   SET content    = CASE WHEN coalesce(n.content, '')    <> '' THEN n.content    || r.kadry ELSE n.content    END,
       content_en = CASE WHEN coalesce(n.content_en, '') <> '' THEN n.content_en || r.kadry ELSE n.content_en END,
       content_kg = CASE WHEN coalesce(n.content_kg, '') <> '' THEN n.content_kg || r.kadry ELSE n.content_kg END,
       gallery    = '[]'::jsonb
  FROM razmetka r
 WHERE n.id = r.id;

-- ===========================================================
-- ШАГ 3. ПРОВЕРКА ЧТЕНИЕМ. «Success» ничего не доказывает.
-- ===========================================================

SELECT s.title,
       jsonb_array_length(s.gallery)                                     AS bylo_foto,
       jsonb_array_length(coalesce(n.gallery, '[]'::jsonb))              AS ostalos_v_galeree,
       (length(n.content)    - length(s.content))                        AS dopisano_znakov,
       (length(n.content_en) - length(coalesce(s.content_en, ''))) > 0   AS tekst_en_vyros,
       (length(n.content_kg) - length(coalesce(s.content_kg, ''))) > 0   AS tekst_kg_vyros,
       left(n.content, length(s.content)) = s.content                    AS staryy_tekst_cel,
       right(n.content, 9)                                               AS chem_konchaetsya
  FROM public.slepok_news_gallery_0810 s
  JOIN public.news n USING (id)
 ORDER BY s.title;

-- Ждём по каждой строке: ostalos_v_galeree = 0, staryy_tekst_cel = true,
-- tekst_en_vyros и tekst_kg_vyros = true, chem_konchaetsya = '</figure>'.
-- `dopisano_znakov` — ПОСЧИТАНО: обёртка без адреса весит 36 знаков,
-- значит прирост не меньше 36 × число снимков. Точное число фигур
-- считает второй запрос ниже.

SELECT s.title,
       jsonb_array_length(s.gallery) AS bylo_foto,
       (length(n.content)    - length(replace(n.content,    '<figure><img', ''))) / 12 AS figur_ru,
       (length(n.content_en) - length(replace(n.content_en, '<figure><img', ''))) / 12 AS figur_en,
       (length(n.content_kg) - length(replace(n.content_kg, '<figure><img', ''))) / 12 AS figur_kg
  FROM public.slepok_news_gallery_0810 s
  JOIN public.news n USING (id)
 ORDER BY s.title;

-- Фигур в каждом языке должно быть НЕ МЕНЬШЕ bylo_foto (в тексте могли
-- уже стоять свои снимки — тогда больше). Сумма figur_ru по девяти
-- строкам минус то, что стояло до правки, равна 36.

-- ===========================================================
-- ОТКАТ, если что-то не так. Слепок на месте — откат не на словах.
-- ===========================================================
--
-- UPDATE public.news n
--    SET content    = s.content,
--        content_en = s.content_en,
--        content_kg = s.content_kg,
--        gallery    = s.gallery
--   FROM public.slepok_news_gallery_0810 s
--  WHERE n.id = s.id;
--
-- Слепок НЕ УДАЛЯТЬ, пока не посмотрим девять статей глазами на сайте.

-- СТУПЕНЬ НОВОЙ КАТЕГОРИИ — СВОЯ, А НЕ ЧУЖАЯ (07.11.2026)
--
-- ЧТО ПОЙМАЛ ПРОГОН. Проба «порядок разрядов в базе совпадает с домом»
-- сказала: «ступени sort_order без повторов: 5 · 3 · 0 · 0» — ждали
-- четыре разных, получили три. Я завёл `open-friendly` со ступенью 0, а
-- нулевая в базе уже была занята.
--
-- ПОЧЕМУ ЭТО НЕ МЕЛОЧЬ. `sort_order` задаёт, какая категория ВЫШЕ.
-- Две одинаковые ступени — это «выше» без ответа: порядок начинает
-- зависеть от того, кто первым вернулся из базы, а по нему считается и
-- посев, и порядок вкладок в витрине. ОДНО ПОНЯТИЕ — ОДНА СТУПЕНЬ.
--
-- ЧТО ДЕЛАЕТ ФАЙЛ. Ставит новой категории ступень НИЖЕ всех занятых:
-- она нерейтинговая, её место в конце. Число не придумано — оно
-- посчитано из того, что уже лежит в базе, поэтому файл можно гонять в
-- любой базе и повторно.

BEGIN;

UPDATE public.categories
   SET sort_order = (SELECT COALESCE(MIN(sort_order), 0) - 1
                       FROM public.categories
                      WHERE id <> 'open-friendly')
 WHERE id = 'open-friendly'
   AND EXISTS (SELECT 1 FROM public.categories c2
                WHERE c2.id <> 'open-friendly'
                  AND c2.sort_order = public.categories.sort_order);

COMMIT;

-- ПРОВЕРКА — ЧИТАЕТСЯ ИЗ БАЗЫ. Ждём: повторов ступеней 0, а строка
-- новой категории стоит последней.
SELECT 'povtorov stupeney' AS chto,
       (SELECT count(*)::text FROM (
            SELECT sort_order FROM public.categories
             GROUP BY sort_order HAVING count(*) > 1) t) AS skolko
UNION ALL
SELECT 'stupen open-friendly',
       COALESCE((SELECT sort_order::text FROM public.categories WHERE id = 'open-friendly'), 'нет строки')
UNION ALL
SELECT 'samaya nizkaya stupen',
       (SELECT min(sort_order)::text FROM public.categories);

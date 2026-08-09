-- ============================================
-- Новость от 24 мая: заголовок в описание
-- Запустить в Supabase SQL Editor.
-- ============================================
--
-- В источнике заголовком стоит целое предложение, а описание пустое.
-- В списке новостей такая карточка ломает ряд. Переносим предложение
-- в описание, заголовком оставляем название турнира.
--
-- То же самое поправлено в import/build-news-sql.py — при повторной сборке
-- переноса менять руками не придётся.

UPDATE news
SET excerpt = title,
    title   = 'Рейтинговый турнир КСЛТ — женский парный разряд',
    slug    = 'reytingovyy-turnir-kslt-zhenskiy-parnyy-razryad'
WHERE title LIKE '24 мая на кортах СК Тай-брейк%';

-- Проверка
SELECT published_at::date AS дата, title, left(excerpt, 60) AS описание
FROM news
WHERE slug = 'reytingovyy-turnir-kslt-zhenskiy-parnyy-razryad';

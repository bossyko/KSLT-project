-- ЗАГОЛОВКИ НОВОСТЕЙ, НАБРАННЫЕ КАПСОМ — ПРАВКА ДАННЫХ, 08.10.2026
--
-- ЗАМЕР: из 35 заголовков 13 набраны капсом целиком и ещё у 6 капсом одно
-- слово. Это не вёрстка: CSS капс у названия карточки уже снят
-- (.news-grid .tc-title { text-transform: none }), и строчными он сделать
-- не может — у `text-transform: lowercase` нет понятия «имя собственное».
--
-- ПРАВИМ СЕМЬ, ОСТАЛЬНЫЕ ШЕСТЬ НЕ ТРОГАЕМ. Шесть — это НАЗВАНИЯ турниров
-- латиницей (SUMMER BREEZE CUP, BOOBLIK OPEN, FRIENDS' CUP, ABDYSH-ATA
-- SPRING CUP, NIGHT FRIENDS' CUP, SUMMER BREEZE CUP-2025): там капс —
-- свойство имени, а не крик. Семь русских — это предложения, набранные
-- капсом, и читаются они на треть медленнее обычного текста.
--
-- ЗАПУСКАЕТ КОСТЯ. Перед UPDATE — SELECT, после — SELECT: результат
-- запроса проверяется чтением базы, а не ответом «Success».

-- 1. ДО: посмотреть, что изменится (ждём 7 строк)
SELECT slug, title FROM news WHERE slug IN (
  'druzheskiy-parnyy-turnir-brk-group',
  'druzheskiy-parnyy-turnir-tay-breyk-27-maya',
  'reytingovyy-turnir-futures-tay-breyk',
  'reytingovye-turniry-kslt-zhenskiy-odinochnyy-futures-i-tour',
  'mayskiy-chempionat-kslt-itogi',
  'mayskiy-chempionat-kslt',
  '4-goda-vmeste-s-kslt-2'
) ORDER BY slug;

-- 2. ПРАВКА. Каждая строка своя: автозаменой тут не обойтись —
--    КСЛТ, FUTURES и TOUR обязаны остаться капсом.
UPDATE news SET title = 'Дружеский парный турнир — BRK GROUP'
  WHERE slug = 'druzheskiy-parnyy-turnir-brk-group';

UPDATE news SET title = 'Дружеский парный турнир — тай-брейк, 27 мая'
  WHERE slug = 'druzheskiy-parnyy-turnir-tay-breyk-27-maya';

UPDATE news SET title = 'Рейтинговый турнир FUTURES — тай-брейк'
  WHERE slug = 'reytingovyy-turnir-futures-tay-breyk';

UPDATE news SET title = 'Рейтинговые турниры КСЛТ — женский одиночный FUTURES и TOUR'
  WHERE slug = 'reytingovye-turniry-kslt-zhenskiy-odinochnyy-futures-i-tour';

UPDATE news SET title = 'Майский чемпионат КСЛТ — итоги'
  WHERE slug = 'mayskiy-chempionat-kslt-itogi';

UPDATE news SET title = 'Майский чемпионат КСЛТ'
  WHERE slug = 'mayskiy-chempionat-kslt';

UPDATE news SET title = '4 года вместе с КСЛТ'
  WHERE slug = '4-goda-vmeste-s-kslt-2';

-- 3. ПОСЛЕ: прочитать базу (ждём те же 7 строк, уже строчными)
SELECT slug, title FROM news WHERE slug IN (
  'druzheskiy-parnyy-turnir-brk-group',
  'druzheskiy-parnyy-turnir-tay-breyk-27-maya',
  'reytingovyy-turnir-futures-tay-breyk',
  'reytingovye-turniry-kslt-zhenskiy-odinochnyy-futures-i-tour',
  'mayskiy-chempionat-kslt-itogi',
  'mayskiy-chempionat-kslt',
  '4-goda-vmeste-s-kslt-2'
) ORDER BY slug;

-- 4. СТОРОЖ НА БУДУЩЕЕ: сколько заголовков набрано капсом целиком
SELECT count(*) AS kapsom FROM news
 WHERE title = upper(title) AND length(regexp_replace(title, '[^[:alpha:]]', '', 'g')) > 8;

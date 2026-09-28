-- КСЛТ — чистка перевода, оставшегося от умолчания.
--
-- Что случилось: умолчания «Бишкек» / «Bishkek» / «Кыргызстан» /
-- «Kyrgyzstan» были зашиты в разметку формы корта. Форма подставляла их
-- молча, сохранение записывало как настоящие значения. Корт в Чикаго
-- получил по-английски «Bishkek, Kyrgyzstan».
--
-- Код уже починен: форма ничего не досочиняет, умолчание ставит база
-- (sql/схема/kort-umolchaniya.sql). Но записи, испорченные до правки,
-- код не вылечит: при сохранении без изменений оригинал не меняется, и
-- чистить переводу нечего. ПОЛОМКА В ДАННЫХ ЧИНИТСЯ ДАННЫМИ.
--
-- Признак мусора узкий и проверяемый: перевод равен умолчанию, а
-- оригинал от умолчания отличается. Бишкекские корты не трогаются —
-- у них «Bishkek» настоящий.
--
-- Замерено 28.09 перед прогоном: 31 корт, под правило подходит 1
-- («Отшибник»: Чикаго → Bishkek, США → Kyrgyzstan).
--
-- Пустой перевод не беда: сборщик адреса откатится на русское значение.
-- Устаревший перевод хуже его отсутствия.

-- Сколько записей затронет — до правки
SELECT count(*) FILTER (WHERE city    IS NOT NULL AND city    <> 'Бишкек'     AND city_en    = 'Bishkek')    AS город_мимо,
       count(*) FILTER (WHERE country IS NOT NULL AND country <> 'Кыргызстан' AND country_en = 'Kyrgyzstan') AS страна_мимо
FROM courts;

UPDATE courts SET city_en = NULL
WHERE city IS NOT NULL AND city <> 'Бишкек' AND city_en = 'Bishkek';

UPDATE courts SET country_en = NULL
WHERE country IS NOT NULL AND country <> 'Кыргызстан' AND country_en = 'Kyrgyzstan';

-- Проверка: под правило больше не подходит ни одна запись
SELECT count(*) FILTER (WHERE city    IS NOT NULL AND city    <> 'Бишкек'     AND city_en    = 'Bishkek')    AS город_мимо,
       count(*) FILTER (WHERE country IS NOT NULL AND country <> 'Кыргызстан' AND country_en = 'Kyrgyzstan') AS страна_мимо
FROM courts;

-- ============================================
-- Города кортов: настоящие названия и переводы
-- ============================================
--
-- Две вещи разом:
--
-- 1. Три корта шли под общей пометкой «Другие регионы». Как город это
--    выглядит странно: человек ищет Ош, а не «другие регионы». Ставим то,
--    что написано в адресе. Отуз-Адыр — село, поэтому область.
--
-- 2. У колонки city_en в таблице стоит значение по умолчанию «Bishkek»,
--    и на английской версии сайта все 31 корт оказались в Бишкеке —
--    включая семнадцать иссык-кульских. Заполняем переводы честно.

-- 1. Настоящие города вместо «Другие регионы»
UPDATE courts SET city = 'Ош'             WHERE id = 'tennisnyy-kort-osh';
UPDATE courts SET city = 'Джалал-Абад'    WHERE id = 'fok-gazprom-dzhalal-abad';
UPDATE courts SET city = 'Ошская область' WHERE id = 'tennisnyy-kort-otuz-adyr';

-- 2. Переводы названий городов
UPDATE courts SET city_en = 'Bishkek',     city_kg = 'Бишкек'         WHERE city = 'Бишкек';
UPDATE courts SET city_en = 'Issyk-Kul',   city_kg = 'Ысык-Көл'       WHERE city = 'Иссык-Куль';
UPDATE courts SET city_en = 'Osh',         city_kg = 'Ош'             WHERE city = 'Ош';
UPDATE courts SET city_en = 'Jalal-Abad',  city_kg = 'Жалал-Абад'     WHERE city = 'Джалал-Абад';
UPDATE courts SET city_en = 'Osh region',  city_kg = 'Ош облусу'      WHERE city = 'Ошская область';

-- 3. Проверка: на всех трёх языках должно быть одинаковое распределение
SELECT city, city_en, city_kg, COUNT(*) AS courts_count
FROM courts
GROUP BY city, city_en, city_kg
ORDER BY courts_count DESC;

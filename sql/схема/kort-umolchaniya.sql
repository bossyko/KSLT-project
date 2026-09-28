-- КСЛТ — умолчания города и страны у корта.
--
-- Зачем: умолчания «Бишкек», «Bishkek», «Кыргызстан», «Kyrgyzstan» были
-- зашиты в разметку формы корта четырьмя строками. Форма подставляла их
-- молча, а сохранение записывало как настоящие значения — так корт в
-- Чикаго получил по-английски «Bishkek, Kyrgyzstan».
--
-- Сквозное правило проекта: УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ.
-- Здесь оно и заводится. Форма больше ничего не досочиняет: незаполненное
-- поле у нового корта не отправляется, и значение ставит база.
--
-- Существующие записи НЕ трогаем: у них значения уже проставлены, и
-- переписывать их умолчанием значило бы стереть чужой ввод.

ALTER TABLE courts ALTER COLUMN city       SET DEFAULT 'Бишкек';
ALTER TABLE courts ALTER COLUMN city_en    SET DEFAULT 'Bishkek';
ALTER TABLE courts ALTER COLUMN country    SET DEFAULT 'Кыргызстан';
ALTER TABLE courts ALTER COLUMN country_en SET DEFAULT 'Kyrgyzstan';

-- Проверка: умолчания стоят у всех четырёх столбцов
SELECT column_name AS столбец, column_default AS умолчание
FROM information_schema.columns
WHERE table_name = 'courts'
  AND column_name IN ('city', 'city_en', 'country', 'country_en')
ORDER BY column_name;

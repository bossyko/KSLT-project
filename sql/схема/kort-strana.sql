-- КСЛТ — страна у корта.
--
-- Зачем: клуб возит турниры за границу (Алматы, Ташкент), а в справочнике
-- кортов страны нет вовсе — есть город, район, индекс и адрес строкой.
-- Померено 28.09: 30 кортов, все в Кыргызстане, поле негде хранить.
--
-- Умолчание — свойство данных, а не разметки: тридцати существующим кортам
-- страна проставляется здесь, а не подставляется формой при каждом показе.

ALTER TABLE courts ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Кыргызстан';
ALTER TABLE courts ADD COLUMN IF NOT EXISTS country_en TEXT DEFAULT 'Kyrgyzstan';

COMMENT ON COLUMN courts.country IS 'Страна корта. Умолчание — Кыргызстан: клуб играет здесь, заграница — исключение';
COMMENT ON COLUMN courts.country_en IS 'То же по-английски, для англоязычных страниц сайта';

UPDATE courts SET country = 'Кыргызстан' WHERE country IS NULL;
UPDATE courts SET country_en = 'Kyrgyzstan' WHERE country_en IS NULL;

-- Проверка: ни одного корта без страны
SELECT count(*) AS всего,
       count(country) AS со_страной,
       count(*) FILTER (WHERE country IS NULL) AS без_страны
FROM courts;

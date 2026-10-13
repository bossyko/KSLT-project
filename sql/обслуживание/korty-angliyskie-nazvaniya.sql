-- АНГЛИЙСКИЕ НАЗВАНИЯ КОРТОВ — courts.name_en. 12.10.2026
--
-- Слово Кости 12.10: «да мне нравится можешь перевести так».
--
-- ОТКУДА СПИСОК. Замер английской витрины (`pages/courts-en.html`): из
-- тридцати кортов пятнадцать показывали кириллицу, потому что код берёт
-- `row.name_en || row.name` (`js/courts.js:468`), а поле `name_en` у них
-- пустое. Семь из пятнадцати уже несут латинское имя внутри русской
-- строки — им нужно только снять русский дубль. Восьми остальным имя
-- транслитерировано, а тип заведения переведён.
--
-- ЗАПУСКАЕТ КОСТЯ. Результат проверяется ЧТЕНИЕМ БАЗЫ, а не ответом
-- «Success» — проверочные запросы в конце файла.

BEGIN;

-- ── 1. Латинское имя уже есть в строке — снимаем русский дубль ──────────

UPDATE courts SET name_en = 'KARVEN Sport Club'
 WHERE id = 'karven-sport-club';

UPDATE courts SET name_en = 'T-CLUB Sports Complex'
 WHERE id = 't-club';

UPDATE courts SET name_en = 'Olimpus Sports Complex'
 WHERE id = 'olimpus';

UPDATE courts SET name_en = 'Family Sport Health & Sports Complex'
 WHERE id = 'family-sport';

UPDATE courts SET name_en = 'Ervin Tennis School'
 WHERE id = 'ervin-tennis-school';

UPDATE courts SET name_en = 'Tie-Break Tennis Courts'
 WHERE id = 'tay-breyk';

UPDATE courts SET name_en = 'K2 Sports Club'
 WHERE id = 'k2';

-- ── 2. Транслитерация имени плюс перевод типа заведения ────────────────

UPDATE courts SET name_en = 'AZUR Sport Resort'
 WHERE id = 'azur-sport-rezort';

UPDATE courts SET name_en = 'Baitur Resort & Spa'
 WHERE id = 'baytur-rezort-end-spa';

UPDATE courts SET name_en = 'Gazprom Sports Complex, Jalal-Abad'
 WHERE id = 'fok-gazprom-dzhalal-abad';

UPDATE courts SET name_en = 'Kyrgyz Republic Tennis Academy'
 WHERE id = 'akademiya-tennisa-kr';

UPDATE courts SET name_en = 'S. Zhumanazarov Tennis & Athletics School'
 WHERE id = 'sportshkola-po-tennisu-i-legkoy-atletike-im-s-zh';

UPDATE courts SET name_en = 'Tennis & Strength Sports School (4th microdistrict)'
 WHERE id = 'sdyusshor-po-tennisu-i-silovym-vidam-sporta';

UPDATE courts SET name_en = 'Tennis Court, Otuz-Adyr (Osh region)'
 WHERE id = 'tennisnyy-kort-otuz-adyr';

UPDATE courts SET name_en = 'Tennis Court, Osh (Osh Open venue)'
 WHERE id = 'tennisnyy-kort-osh';

COMMIT;

-- ── ПРОВЕРКА ЧТЕНИЕМ БАЗЫ ──────────────────────────────────────────────
-- Должно вернуть 15 строк, и ни в одной name_en не содержит кириллицы.

SELECT id, name, name_en
  FROM courts
 WHERE id IN (
   'karven-sport-club','t-club','olimpus','family-sport','ervin-tennis-school',
   'tay-breyk','k2','azur-sport-rezort','baytur-rezort-end-spa',
   'fok-gazprom-dzhalal-abad','akademiya-tennisa-kr',
   'sportshkola-po-tennisu-i-legkoy-atletike-im-s-zh',
   'sdyusshor-po-tennisu-i-silovym-vidam-sporta',
   'tennisnyy-kort-otuz-adyr','tennisnyy-kort-osh'
 )
 ORDER BY id;

-- Сколько опубликованных кортов ОСТАЛОСЬ без английского имени — ждём 0.
-- Кириллица внутри name_en считается недоделкой наравне с пустым полем.

SELECT count(*) AS bez_name_en
  FROM courts
 WHERE published_at IS NOT NULL
   AND (name_en IS NULL OR name_en = '' OR name_en ~ '[А-Яа-яЁё]');

-- Friendly → Friendly Weekend
-- ===========================
--
-- Клиент просил убрать слово Friendly из списка рейтинговых категорий: это не
-- рейтинг, а турниры выходного дня — потренироваться и поразвлечься. Саму
-- категорию не трогаем: к ней привязаны 15 турниров и ссылка вида
-- tournaments.html?category=friendly. Меняем только видимое название — id
-- остаётся техническим.
--
-- Заодно порядок: friendly стоял с sort_order 6 и на странице Турниров
-- всплывал первым, выше Pro-Masters. Ставим 0, чтобы шёл последним, как в меню.

BEGIN;

UPDATE categories
   SET name    = 'Friendly Weekend',
       name_en = 'Friendly Weekend',
       name_kg = 'Friendly Weekend',
       sort_order = 0
 WHERE id = 'friendly';

-- Проверка: сверху Pro-Masters, снизу Friendly Weekend
SELECT sort_order, id, name FROM categories ORDER BY sort_order DESC;

COMMIT;

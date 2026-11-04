-- ВСЕ СЛЕДЫ ДВУХ МУРАТОВ, ПО ВСЕМ ВНЕШНИМ КЛЮЧАМ. ТОЛЬКО ЧИТАЕТ.
--
-- ЗАЧЕМ. На `players.id` висит два десятка внешних ключей. Слить
-- карточки, зная только про заявки и матчи, — значит оборвать остальное
-- МОЛЧА. Здесь прибор сам находит КАЖДУЮ колонку, которая ссылается на
-- `players.id`, и считает строки для обеих карточек.
--
-- ПРИБОР НЕ ПЕРЕЧИСЛЯЕТ ТАБЛИЦЫ РУКАМИ: список рукой отстанет от базы на
-- первой же миграции. Он читает каталог — значит видит и те связи, про
-- которые я не знаю.
--
-- Пустые строки отброшены: показаны только места, где кто-то из двоих
-- действительно записан.

WITH связи AS (
    SELECT c.conrelid::regclass::text AS tablica,
           a.attname                  AS kolonka
      FROM pg_constraint c
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'f'
       AND c.confrelid = 'public.players'::regclass
),
счёт AS (
    SELECT с.tablica, с.kolonka, ч.kto,
           (xpath('/row/c/text()',
                  query_to_xml(
                    format('SELECT count(*) AS c FROM %s WHERE %I = %L',
                           с.tablica, с.kolonka, ч.kto),
                    false, true, '')))[1]::text::bigint AS strok
      FROM связи с
     CROSS JOIN (VALUES ('murat-noruzbaev'), ('murat-noruzbaev-2')) ч(kto)
)
SELECT tablica, kolonka,
       max(strok) FILTER (WHERE kto = 'murat-noruzbaev')   AS u_725,
       max(strok) FILTER (WHERE kto = 'murat-noruzbaev-2') AS u_25
  FROM счёт
 GROUP BY tablica, kolonka
HAVING max(strok) > 0
 ORDER BY tablica, kolonka;

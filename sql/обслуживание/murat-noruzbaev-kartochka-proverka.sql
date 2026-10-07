-- ПРОВЕРКА карточки Мурата Норузбаева — ЧТЕНИЕМ, а не ответом «Success»

SELECT id, name, gender, category_id, is_guest, is_member, has_account
  FROM public.players
 WHERE id = 'murat-noruzbaev-2';
-- ЖДЁМ: name = «Мурат Норузбаев», gender = men.
-- category_id остаётся пустым — это открытый вопрос, не ошибка правки.

-- Нет ли в базе второго Норузбаева, с которым карточка могла разойтись
SELECT id, name, gender, category_id
  FROM public.players
 WHERE lower(name) LIKE '%норузбаев%' OR lower(name) LIKE '%noruzbaev%';
-- ЖДЁМ: ровно одну строку.

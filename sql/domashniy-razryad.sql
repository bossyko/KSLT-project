-- ============================================================
-- Домашний разряд — низший из тех, где игрок набирал очки
-- ============================================================
--
-- Правило клуба: играть можно в своём разряде и на ступень выше, а домашним
-- считается низший. До сих пор он стоял в карточке как придётся: у кого-то не
-- проставлен вовсе, у кого-то остался с прошлых лет.
--
-- Теперь выводим его из очков: берём разряды, где у человека есть очки, и
-- ставим домашним самый низкий из них. Кто ещё ничего не набрал — остаётся
-- без разряда, выводить не из чего.
--
-- Ставим всем, у кого есть очки, — и пустым карточкам, и тем, где разряд
-- расходится с игрой. Очки говорят точнее: разряд в карточках проставлялся при
-- переносе списков NTRP, а где человек играет на самом деле, видно по турнирам.
--
-- Первый запрос показывает, что именно изменится.
--
-- Ступени сверху вниз: Pro-Masters, Masters, Tour, Challenger, Futures.
--
-- Запускать после заливки очков; можно повторно.

-- ---- 1. Что изменится (только смотрим) ----

SELECT p.name AS игрок,
       COALESCE(p.category_id, 'нет') AS было,
       н.низший AS станет
  FROM public.players p
  JOIN (
        SELECT DISTINCT ON (pc.player_id)
               pc.player_id,
               pc.category_id AS низший
          FROM public.player_categories pc
          JOIN (VALUES ('promasters', 1), ('masters', 2), ('tour', 3),
                       ('challenger', 4), ('futures', 5)) AS o(cat, ступень)
            ON o.cat = pc.category_id
         WHERE pc.closed_at IS NULL
           AND pc.points > 0
         ORDER BY pc.player_id, o.ступень DESC
       ) н ON н.player_id = p.id
 WHERE NOT p.is_guest
   AND p.category_id IS DISTINCT FROM н.низший
 ORDER BY 3, 1;

-- ---- 2. Проставить ----

UPDATE public.players p
   SET category_id = н.низший
  FROM (
        SELECT DISTINCT ON (pc.player_id)
               pc.player_id,
               pc.category_id AS низший
          FROM public.player_categories pc
          JOIN (VALUES ('promasters', 1), ('masters', 2), ('tour', 3),
                       ('challenger', 4), ('futures', 5)) AS o(cat, ступень)
            ON o.cat = pc.category_id
         WHERE pc.closed_at IS NULL
           AND pc.points > 0
         ORDER BY pc.player_id, o.ступень DESC
       ) н
 WHERE p.id = н.player_id
   AND NOT p.is_guest
   AND p.category_id IS DISTINCT FROM н.низший;

-- ---- 3. Проверка ----

SELECT p.gender AS пол,
       COALESCE(p.category_id, 'без разряда') AS разряд,
       count(*) AS игроков
  FROM public.players p
 WHERE NOT p.is_guest
 GROUP BY 1, 2
 ORDER BY 1, 2;

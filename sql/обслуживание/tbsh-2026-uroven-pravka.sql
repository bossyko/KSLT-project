-- ============================================================
-- ТБШ 2026: ПРАВКА УРОВНЯ — СО СЛЕПКОМ И ОТКАТОМ
-- ============================================================
--
-- НЕ ПРОГОНЯТЬ, ПОКА НЕ ПРОГНАНА `tbsh-2026-uroven-proverka.sql` И ВЫВОД
-- НЕ ПРИСЛАН. Правка трогает данные.
--
-- ЧТО ДЕЛАЕТ: ставит восьми турнирам ТБШ 2026 уровень «Высшая категория».
-- Числа уже начисленных очков НЕ МЕНЯЕТ — их не трогает ни одна строка
-- ниже. Правка возвращает турнирам признак рейтингового, и только.
--
-- СЛЕПОК СНИМАЕТСЯ ПЕРВЫМ ДЕЛОМ, В ТАБЛИЦУ, А НЕ В ПАМЯТЬ. Откат берёт
-- значения из неё, а не из моего предположения, что «там был null».
--
-- ПОРОГ: правка отказывается, если под отбор попало не ровно 8 турниров
-- или если уровней с sort_order = 5 не ровно один. Отбор держится на
-- содержимом — название, год, формат, сетка, пустой уровень.

BEGIN;

-- ---- 1. Слепок ----

CREATE TABLE IF NOT EXISTS public.slepok_tbsh_uroven (
    снято    timestamptz NOT NULL DEFAULT now(),
    id       text        NOT NULL,
    title    text,
    level_id uuid,
    PRIMARY KEY (снято, id)
);

INSERT INTO public.slepok_tbsh_uroven (id, title, level_id)
SELECT т.id, т.title, т.level_id
  FROM public.tournaments т
 WHERE т.level_id IS NULL
   AND т.title LIKE 'ТБШ %'
   AND т.date_start >= DATE '2026-01-01'
   AND т.format = 'singles'
   AND т.bracket_type = 'fic';

-- ---- 2. Порог: отказываемся, если число не то ----

DO $$
DECLARE
    сколько integer;
    уровней integer;
BEGIN
    SELECT count(*) INTO сколько
      FROM public.slepok_tbsh_uroven
     WHERE снято = (SELECT max(снято) FROM public.slepok_tbsh_uroven);

    IF сколько <> 8 THEN
        RAISE EXCEPTION
            'Под отбор попало % турниров вместо восьми — правка не выполнена', сколько;
    END IF;

    SELECT count(*) INTO уровней
      FROM public.tournament_levels WHERE sort_order = 5;

    IF уровней <> 1 THEN
        RAISE EXCEPTION
            'Уровней с sort_order = 5 найдено % вместо одного — правка не выполнена', уровней;
    END IF;
END $$;

-- ---- 3. Правка ----
--
-- Идём по слепку, а не по отбору заново: между слепком и правкой отбор
-- мог бы перестать совпадать, и правка легла бы не туда.

UPDATE public.tournaments т
   SET level_id = (SELECT id FROM public.tournament_levels WHERE sort_order = 5)
 WHERE т.id IN (SELECT id FROM public.slepok_tbsh_uroven
                 WHERE снято = (SELECT max(снято) FROM public.slepok_tbsh_uroven));

-- ---- 4. Перечитка ВНУТРИ транзакции ----
--
-- Ответ «UPDATE 8» ничего не доказывает: он говорит, сколько строк
-- тронуто, а не что в них лежит. Спрашиваем базу.

DO $$
DECLARE
    стало integer;
BEGIN
    SELECT count(*) INTO стало
      FROM public.tournaments т
      JOIN public.tournament_levels у ON у.id = т.level_id
     WHERE т.id IN (SELECT id FROM public.slepok_tbsh_uroven
                     WHERE снято = (SELECT max(снято) FROM public.slepok_tbsh_uroven))
       AND у.sort_order = 5;

    IF стало <> 8 THEN
        RAISE EXCEPTION
            'После правки уровень стоит у % турниров вместо восьми — откатываемся', стало;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- ПРОВЕРИТЬ ЧТЕНИЕМ ПОСЛЕ ПРОГОНА
-- ============================================================
--
-- SELECT т.title, у.name AS уровень, count(и.id) AS строк, sum(и.points_earned) AS очков
--   FROM public.tournaments т
--   JOIN public.tournament_levels у ON у.id = т.level_id
--   LEFT JOIN public.tournament_results и ON и.tournament_id = т.id
--  WHERE т.title LIKE 'ТБШ %' AND т.date_start >= DATE '2026-01-01'
--  GROUP BY т.title, у.name ORDER BY т.title;
--
-- Ждём восемь строк, у всех «Высшая категория», и суммы очков ТЕ ЖЕ, что
-- были в замере: 5135 · 4677 · 4335 · 4281 · 5120 · 4535 · 4450 · 4648.
--
-- ============================================================
-- ОТКАТ — если что-то не так
-- ============================================================
--
-- BEGIN;
-- UPDATE public.tournaments т
--    SET level_id = с.level_id
--   FROM public.slepok_tbsh_uroven с
--  WHERE с.id = т.id
--    AND с.снято = (SELECT max(снято) FROM public.slepok_tbsh_uroven);
-- COMMIT;
--
-- Слепок НЕ удаляется правкой: он остаётся в базе как след. Снести его
-- можно только отдельным словом Кости.

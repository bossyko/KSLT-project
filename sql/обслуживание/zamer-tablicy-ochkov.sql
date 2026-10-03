-- ============================================================
-- ЗАМЕР ТАБЛИЦЫ ОЧКОВ: что в ней на самом деле стоит
-- ============================================================
--
-- ЧИТАЕТ, НЕ МЕНЯЕТ. Прогонять в БОЕВОЙ (qqkzszesviukopgjbead) —
-- истина живёт там. В тестовой можно прогнать тем же файлом для сверки.
--
-- ЗАЧЕМ. Экран «Рейтинговые очки» в админке правит `points_rules` — очки
-- ПО РАУНДАМ (`settings.js:309`). Начисление же читает `points_by_place` —
-- очки ПО МЕСТАМ (`bracket.js:2328`). Два определения одного понятия:
-- экран правит не ту таблицу, и 64 места никогда не имели экрана.
--
-- Прежде чем заводить версии и переписывать экран, надо знать ЦИФРАМИ:
-- сколько мест заполнено у каждого уровня и есть ли вообще 64 строки.
--
-- ОСТОРОЖНО С ИМЕНАМИ. `sql/схема/kategorii-i-ochki.sql:179` привязывал
-- строки по НАЗВАНИЮ уровня — 'Высшая', 'Первая', 'Вторая', 'Третья',
-- 'Четвёртая'. 30.09 и 02.10 уровни переименованы: «Высшая категория»,
-- «1 категория», «2 категория», «3 категория», «Итоговый турнир».
-- Значит привязка по имени больше не сработает, и ПРОВЕРИТЬ надо не
-- название, а что строки доехали до нынешних уровней по `id`.

-- ---- Шаг 0. Колонки, на которые ссылается этот файл ----
--
-- ПЕРВАЯ РЕДАКЦИЯ ЭТОГО ФАЙЛА УПАЛА НА ШАГЕ 5: я написал
-- `tournaments.start_date`, а колонка зовётся `date_start`
-- (`supabase/migrations/20260210000000_baseline.sql:2830`). Редактор
-- Supabase останавливается на первой ошибке, и четыре правильных шага до неё
-- вывода не дали — весь прогон пропал из-за одного имени.
--
-- Поэтому шаг нулевой: сначала база САМА перечисляет, что у неё есть. Пусто
-- в строке «есть» — дальше читать незачем, имя не то.

SELECT 'ШАГ 0 · КОЛОНКИ' AS шаг;

WITH нужно(таблица, колонка) AS (
  VALUES ('tournament_levels','sort_order'), ('tournament_levels','name'),
         ('tournament_levels','on_ladder'),
         ('points_by_place','level_id'),     ('points_by_place','place'),
         ('points_by_place','points'),
         ('points_rules','level_id'),        ('points_rules','round'),
         ('points_rules','points'),
         ('tournaments','date_start'),  ('tournaments','title'),
         ('tournaments','format'),      ('tournaments','bracket_type'),
         ('tournaments','gender'),      ('tournaments','status'),
         ('tournament_results','tournament_id'),
         ('tournament_results','points_earned')
)
SELECT н.таблица, н.колонка,
       CASE WHEN к.column_name IS NULL THEN 'НЕТ — имя не то' ELSE 'есть: ' || к.data_type END AS состояние
  FROM нужно н
  LEFT JOIN information_schema.columns к
         ON к.table_schema = 'public'
        AND к.table_name = н.таблица
        AND к.column_name = н.колонка
 ORDER BY (к.column_name IS NULL) DESC, н.таблица, н.колонка;

-- ---- Шаг 1. Уровни: сколько их и в каком порядке ----
SELECT 'ШАГ 1 · УРОВНИ' AS шаг;

SELECT sort_order,
       name,
       name_en,
       on_ladder,
       id
  FROM public.tournament_levels
 ORDER BY sort_order DESC;

-- ---- Шаг 2. Сколько мест заполнено у каждого уровня ----
--
-- Ждём: четыре категории по 64 строки, итоговый турнир — 8.
-- Любое другое число означает, что таблица неполна, и экран на 64 места
-- показал бы дыры.

SELECT 'ШАГ 2 · МЕСТ НА УРОВЕНЬ' AS шаг;

SELECT у.sort_order,
       у.name,
       count(п.place)        AS строк,
       min(п.place)          AS первое_место,
       max(п.place)          AS последнее_место,
       count(*) FILTER (WHERE п.points = 0) AS нулевых,
       -- дыры: сколько мест между первым и последним пропущено
       (max(п.place) - min(п.place) + 1) - count(п.place) AS пропущено
  FROM public.tournament_levels у
  LEFT JOIN public.points_by_place п ON п.level_id = у.id
 GROUP BY у.sort_order, у.name
 ORDER BY у.sort_order DESC;

-- ---- Шаг 3. Первые десять мест — числами ----
--
-- Чтобы на макете и на экране стояли те же цифры, что в базе, а не
-- переписанные с бумаги.

SELECT 'ШАГ 3 · МЕСТА 1–10' AS шаг;

SELECT п.place AS место,
       max(п.points) FILTER (WHERE у.sort_order = 5) AS "Высшая",
       max(п.points) FILTER (WHERE у.sort_order = 4) AS "1 кат",
       max(п.points) FILTER (WHERE у.sort_order = 3) AS "2 кат",
       max(п.points) FILTER (WHERE у.sort_order = 2) AS "3 кат",
       max(п.points) FILTER (WHERE у.sort_order = 1) AS "Итоговый"
  FROM public.points_by_place п
  JOIN public.tournament_levels у ON у.id = п.level_id
 WHERE п.place <= 10
 GROUP BY п.place
 ORDER BY п.place;

-- ---- Шаг 4. Старая таблица по раундам: жива ли ----
--
-- Её правит нынешний экран. Если в ней есть строки, значит экран писал
-- в неё — и надо знать, читает ли её хоть кто-нибудь.
-- Читателя я нашёл один: `players.js:142` (список игроков).
--
-- ЕСЛИ ШАГ 0 НАПИСАЛ ПРО `points_rules` «НЕТ» — этот шаг пропусти, таблицы в
-- базе нет; остальные шаги от этого не страдают.

SELECT 'ШАГ 4 · ТАБЛИЦА ПО РАУНДАМ' AS шаг;

SELECT у.name,
       count(п.*) AS строк,
       string_agg(п.round || '=' || п.points, ', ' ORDER BY п.points DESC) AS содержимое
  FROM public.tournament_levels у
  LEFT JOIN public.points_rules п ON п.level_id = у.id
 GROUP BY у.name
 ORDER BY у.name;

-- ---- Шаг 5. Кто уже начислен: турниры с итогами ----
--
-- Версии нужны ровно затем, чтобы эти турниры НЕ пересчитывались при
-- правке таблицы. Надо знать, сколько их и с какой даты.

SELECT 'ШАГ 5 · ТУРНИРЫ С НАЧИСЛЕННЫМИ ОЧКАМИ' AS шаг;

SELECT count(DISTINCT и.tournament_id) AS турниров,
       count(*)                        AS строк_итогов,
       min(т.date_start)               AS самый_ранний,
       max(т.date_start)               AS самый_поздний
  FROM public.tournament_results и
  JOIN public.tournaments т ON т.id = и.tournament_id;

-- ---- Шаг 6. Кому сейчас разрешено писать в таблицу ----
--
-- Слово Кости 02.10: «изменить очки может только администратор, не
-- менеджер». В базе политика пускает обоих
-- (`sql/схема/kategorii-i-ochki.sql:89`) — проверяем текстом политики,
-- а не памятью.

SELECT 'ШАГ 6 · ПОЛИТИКИ ДОСТУПА' AS шаг;

SELECT tablename, policyname, cmd, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('points_by_place', 'points_rules')
 ORDER BY tablename, policyname;

-- ---- Шаг 7. Платила ли кому-нибудь кривая таблица по раундам ----
--
-- Замер 02.10 показал: в `points_rules` первые четыре строки (W, F, 3RD,
-- 4TH) совпадают с таблицей мест до числа у всех пяти уровней, а дальше
-- шкала ПЕРЕВЁРНУТА: SF платит 8 в первой категории, 18 во второй и 36 в
-- третьей — чем ниже категория, тем дороже. У итогового SF=70 стоит между
-- F=80 и 3RD=55, то есть полуфиналист дороже третьего места.
--
-- Этой таблицей платит ручной ввод прошлых результатов
-- (`players.js:2821`). Вопрос, на который отвечает только база: ПОПАЛИ ЛИ
-- эти числа кому-нибудь в `tournament_results`.
--
-- Колонка «совпало» и есть ответ:
--   «место»          — начислено по таблице мест, всё в порядке;
--   «РАУНД — чинить» — начислено по кривой таблице;
--   «ни с чем»       — начислено мимо обеих, разбирать отдельно.

SELECT 'ШАГ 7 · ЧЕМ НАЧИСЛЕНО НА САМОМ ДЕЛЕ' AS шаг;

WITH разбор AS (
  SELECT coalesce(у.name, '— без уровня —') AS уровень,
         и.round_reached                    AS раунд,
         и.points_earned                    AS начислено,
         пр.points                          AS по_раундам,
         пм.points                          AS по_месту
    FROM public.tournament_results и
    JOIN public.tournaments т        ON т.id = и.tournament_id
    LEFT JOIN public.tournament_levels у ON у.id = т.level_id
    LEFT JOIN public.points_rules пр ON пр.level_id = т.level_id
                                    AND пр.round    = и.round_reached
    LEFT JOIN public.points_by_place пм ON пм.level_id = т.level_id
         AND пм.place = CASE и.round_reached
                            WHEN 'W'   THEN 1
                            WHEN 'F'   THEN 2
                            WHEN '3RD' THEN 3
                            WHEN '4TH' THEN 4
                        END
)
SELECT уровень, раунд,
       count(*)                                   AS строк,
       min(начислено) || '…' || max(начислено)    AS начислено,
       max(по_месту)                              AS таблица_мест,
       max(по_раундам)                            AS таблица_раундов,
       CASE WHEN bool_and(начислено = по_месту)   THEN 'место'
            WHEN bool_and(начислено = по_раундам) THEN 'РАУНД — чинить'
            ELSE 'ни с чем' END                   AS совпало
  FROM разбор
 GROUP BY уровень, раунд
 ORDER BY уровень, раунд;

-- ---- Шаг 8. Кто такие 408 строк «без уровня» ----
--
-- Шаг 7 нашёл в боевой 408 строк итогов, у чьих турниров `level_id` пуст.
-- Таблица очков к ним неприменима по определению: `isUnrankedTournament`
-- (`bracket.js`) считает нерейтинговыми дружеские и всё парное, а признак
-- рейтингового требует непустого `level_id`. Тогда очков у них быть не
-- должно вовсе — а в выводе стоит «начислено 15…1000».
--
-- ДВЕ РАЗНЫЕ ПРИЧИНЫ, И РАЗЛИЧАЕТ ИХ ТОЛЬКО ЭТОТ ЗАПРОС:
--   · турнир парный или дружеский — уровня у него и не было, а очки
--     остались от старого кода: `stripFriendlyPoints` обнуляет их при
--     ЧТЕНИИ, в базе они как лежали, так и лежат;
--   · турнир был РЕЙТИНГОВЫМ, а уровень под ним удалили: `deleteLevel`
--     (`settings.js:283`) ставит турнирам `level_id = null`, но
--     `tournament_results` не трогает. 30.09 удалён прежний уровень
--     «Итоговый турнир» — и если под ним были турниры, их история
--     осиротела: очки начислены, а по какой таблице — больше не узнать.
--
-- Вторая причина — настоящая беда, первая — мусор в данных.

SELECT 'ШАГ 8 · ТУРНИРЫ БЕЗ УРОВНЯ' AS шаг;

SELECT coalesce(у.name, '— без уровня —') AS уровень,
       т.format,
       т.bracket_type,
       count(DISTINCT т.id)               AS турниров,
       count(и.id)                        AS строк_итогов,
       sum(и.points_earned)               AS очков_всего,
       max(и.points_earned)               AS самое_большое,
       min(т.date_start)                  AS с,
       max(т.date_start)                  AS по
  FROM public.tournaments т
  JOIN public.tournament_results и ON и.tournament_id = т.id
  LEFT JOIN public.tournament_levels у ON у.id = т.level_id
 GROUP BY у.name, т.format, т.bracket_type
 ORDER BY (у.name IS NULL) DESC, у.name, т.format, т.bracket_type;

-- Поимённо — те, у кого уровня нет, а очки начислены: это и есть список на
-- разбор. Парные и дружеские в нём ожидаемы; одиночный в этом списке —
-- осиротевший рейтинговый.

SELECT 'ШАГ 8б · ПОИМЁННО' AS шаг;

SELECT т.title, т.format, т.gender, т.status, т.date_start,
       count(и.id)          AS строк,
       sum(и.points_earned) AS очков
  FROM public.tournaments т
  JOIN public.tournament_results и ON и.tournament_id = т.id
 WHERE т.level_id IS NULL
   AND и.points_earned > 0
 GROUP BY т.id, т.title, т.format, т.gender, т.status, т.date_start
 ORDER BY т.format, т.date_start;

-- ---- Шаг 9. Очки победителя сами называют таблицу ----
--
-- Шаг 8б назвал восьмерых осиротевших: ТБШ ProMasters · Masters ·
-- Masters (женский) · Challengers · Futures · Futures (женский) · Tour ·
-- Tour (женский), все 2026, все `completed`, 269 строк, 37 181 очко.
--
-- В названии стоит КАТЕГОРИЯ ИГРОКА (ProMasters…Tour), а уровень турнира —
-- другая ось (Высшая…Итоговый). Поэтому по имени уровень не выводится, и
-- догадку писать нельзя.
--
-- НО ОЧКИ ПОБЕДИТЕЛЯ ИЗМЕРИМЫ. За первое место каждая таблица платит своё
-- число: Высшая 1000, 1 категория 600, 2 категория 360, 3 категория 215,
-- Итоговый 130 (замер, шаг 3). Если победителю начислено ровно одно из них —
-- таблица известна. Если больше на кратное 25 — это старое правило «таблица
-- плюс победы» (отменено 30.09, `rating-points.js`, комментарий перед
-- `очки`), и таблица всё равно узнаётся по остатку.
--
-- Колонка «ровно» и есть ответ. Пусто в ней — ни одна таблица не подошла
-- даже с поправкой на победы, и тогда это разбор поимённо, а не вывод.

SELECT 'ШАГ 9 · ЧЬЕЙ ТАБЛИЦЕЙ ПЛАТИЛИ ОСИРОТЕВШИМ' AS шаг;

WITH победители AS (
  SELECT т.id, т.title, т.gender, и.points_earned AS очки
    FROM public.tournaments т
    JOIN public.tournament_results и ON и.tournament_id = т.id
   WHERE т.level_id IS NULL
     AND и.round_reached = 'W'
     AND и.points_earned > 0
),
за_первое AS (
  SELECT у.name, у.sort_order, п.points AS очки
    FROM public.tournament_levels у
    JOIN public.points_by_place п ON п.level_id = у.id AND п.place = 1
)
SELECT п.title,
       п.gender,
       п.очки                                            AS начислено_победителю,
       max(ф.name) FILTER (WHERE ф.очки = п.очки)        AS ровно,
       string_agg(ф.name || ' +' || ((п.очки - ф.очки) / 25) || '×25',
                  ', ' ORDER BY (п.очки - ф.очки))
           FILTER (WHERE ф.очки < п.очки
                     AND (п.очки - ф.очки) % 25 = 0)     AS или_с_победами
  FROM победители п
  LEFT JOIN за_первое ф
         ON ф.очки <= п.очки
        AND (п.очки - ф.очки) % 25 = 0
 GROUP BY п.title, п.gender, п.очки
 ORDER BY п.очки DESC, п.title;

-- ---- Шаг 10. Вся лестница осиротевших, а не только первое место ----
--
-- Шаг 9 дал ответ, который формально верен и по сути ведёт не туда: у
-- СЕМИ победителей из восьми ровно 1000 — и у ТБШ Tour, и у ТБШ
-- ProMasters. Семь турниров разного уровня не могут все быть Высшей
-- категорией. Значит одинаковое число у всех — не доказательство уровня,
-- а признак того, что уровень не при чём: очки поставлены мимо таблиц.
--
-- ОДНО ЧИСЛО НЕ ОТЛИЧАЕТ ТАБЛИЦУ ОТ РУЧНОГО ВВОДА — отличает ЛЕСТНИЦА.
-- Если за второе место везде 600, за третье 420, за четвёртое 360 — платила
-- таблица Высшей. Если второе место у турниров разное — таблицы были разные.
-- Если «разных_чисел» единица или два — числа ставили руками.
--
-- Восьмой, «ТБШ Futures 2026» мужской, в шаг 9 не попал вовсе: у него нет
-- строки `W` с очками, хотя турнир `completed` и несёт 50 строк итогов.
-- Колонка `за_1` покажет это пустотой.

SELECT 'ШАГ 10 · ЛЕСТНИЦА ОСИРОТЕВШИХ' AS шаг;

SELECT т.title,
       т.gender,
       count(*)                                                   AS строк,
       max(и.points_earned) FILTER (WHERE и.round_reached = 'W')   AS за_1,
       max(и.points_earned) FILTER (WHERE и.round_reached = 'F')   AS за_2,
       max(и.points_earned) FILTER (WHERE и.round_reached = '3RD') AS за_3,
       max(и.points_earned) FILTER (WHERE и.round_reached = '4TH') AS за_4,
       max(и.points_earned) FILTER (WHERE и.round_reached = 'SF')  AS sf,
       max(и.points_earned) FILTER (WHERE и.round_reached = 'QF')  AS qf,
       count(DISTINCT и.points_earned)                            AS разных_чисел,
       min(и.points_earned)                                       AS самое_малое,
       max(и.points_earned)                                       AS самое_большое
  FROM public.tournaments т
  JOIN public.tournament_results и ON и.tournament_id = т.id
 WHERE т.level_id IS NULL
   AND и.points_earned > 0
 GROUP BY т.id, т.title, т.gender
 ORDER BY т.title;

-- И какие вообще этапы в них записаны: если вместо W/F/SF стоят G1…G6 или
-- пусто — лестницы там нет, и сравнивать не с чем.

SELECT 'ШАГ 10б · КАКИЕ ЭТАПЫ ЗАПИСАНЫ' AS шаг;

SELECT coalesce(и.round_reached, '— пусто —') AS этап,
       count(*)                               AS строк,
       count(DISTINCT т.id)                   AS турниров,
       min(и.points_earned)                   AS от,
       max(и.points_earned)                   AS до
  FROM public.tournaments т
  JOIN public.tournament_results и ON и.tournament_id = т.id
 WHERE т.level_id IS NULL
 GROUP BY 1
 ORDER BY count(*) DESC;

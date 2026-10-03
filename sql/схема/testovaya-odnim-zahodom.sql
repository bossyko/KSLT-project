-- ============================================================
-- ТЕСТОВАЯ, ОДНИМ ЗАХОДОМ: уровни + версии + все перечитки
-- ============================================================
--
-- ТОЛЬКО ТЕСТОВАЯ (itlanqwcwygxchitaatt). Прогнать ЦЕЛИКОМ, одним
-- выделением, «No limit». Прислать последние таблицы — они и есть ответ.
--
-- ЗАЧЕМ ОДНИМ ФАЙЛОМ. Каждый факт из базы стоит одного круга через Костю:
-- базу я не читаю и не пишу. Пошаговая переписка съела вечер, и две дыры —
-- пустая таблица мест и один уровень вместо пяти — вскрылись по одной за
-- прогон. Здесь всё подряд, а в конце ПРИГОВОР таблицей: сошлось или нет.
--
-- ВСЁ ИДЕМПОТЕНТНО: повторный прогон ничего не задвоит. Источник частей —
-- sql/схема/testovaya-urovni-turnirov.sql и sql/схема/versii-tablicy-ochkov.sql,
-- склеены файлом, а не перенабраны.

-- ============================================================
-- ЧАСТЬ 1. ЧЕТЫРЕ НЕДОСТАЮЩИЕ КАТЕГОРИИ
-- ============================================================

BEGIN;

-- ---- 1. Заводим то, чего нет. Существующее не трогаем ----
--
-- Привязка по `sort_order`, а не по названию: имена переименовывались
-- дважды, и привязка по имени — ровно то, из-за чего старый файл сегодня
-- не положил бы ни строки.

INSERT INTO public.tournament_levels (name, name_en, sort_order, on_ladder)
SELECT н.name, н.name_en, н.sort_order, н.on_ladder
  FROM (VALUES
          ('Высшая категория', 'Top category', 5, true),
          ('1 категория',      'Category 1',   4, true),
          ('2 категория',      'Category 2',   3, true),
          ('3 категория',      'Category 3',   2, true)
       ) AS н(name, name_en, sort_order, on_ladder)
 WHERE NOT EXISTS (SELECT 1 FROM public.tournament_levels у
                    WHERE у.sort_order = н.sort_order);

-- ---- 2. Порог: должно стать ровно пять ----

DO $$
DECLARE
    сколько integer;
    налестнице integer;
BEGIN
    SELECT count(*) INTO сколько
      FROM public.tournament_levels WHERE sort_order BETWEEN 1 AND 5;
    IF сколько <> 5 THEN
        RAISE EXCEPTION
            'Уровней со sort_order 1…5 стало % вместо пяти — откатываемся', сколько;
    END IF;

    SELECT count(*) INTO налестнице
      FROM public.tournament_levels WHERE on_ladder AND sort_order BETWEEN 1 AND 5;
    IF налестнице <> 4 THEN
        RAISE EXCEPTION
            'На лестнице % уровней вместо четырёх — откатываемся', налестнице;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- ЧАСТЬ 2. ВЕРСИИ ТАБЛИЦЫ ОЧКОВ
-- ============================================================

BEGIN;

-- ---- Шаг 1. Версии ----

CREATE TABLE IF NOT EXISTS public.points_versions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_from date NOT NULL UNIQUE,
    per_win        integer NOT NULL DEFAULT 25  CHECK (per_win   >= 0),
    per_entry      integer NOT NULL DEFAULT 10  CHECK (per_entry >= 0),
    note           text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.points_versions IS
    'Версии таблицы очков. Турнир считается по версии на дату своего начала';
COMMENT ON COLUMN public.points_versions.effective_from IS
    'С какой даты версия в силе. Уникальна: две версии в один день не бывает';
COMMENT ON COLUMN public.points_versions.per_win IS
    'Очки за выигранную встречу в группе. Было зашито в js/rating-points.js:18';
COMMENT ON COLUMN public.points_versions.per_entry IS
    'Очки тому, кто не выиграл ни одной. Было зашито в js/rating-points.js:19';

-- ---- Шаг 2. Первая версия — то, что уже лежит в базе ----
--
-- Дата первой версии — заведомо раньше самого раннего турнира в базе,
-- иначе у старых турниров не нашлось бы версии. Берём 1 января года
-- Положения: цифры в таблице — Приложение 2 к Положению КСЛТ 2021.

INSERT INTO public.points_versions (effective_from, per_win, per_entry, note)
SELECT DATE '2021-01-01', 25, 10,
       'Приложение 2 к Положению КСЛТ 2021 — первая версия, собрана из базы'
 WHERE NOT EXISTS (SELECT 1 FROM public.points_versions);

-- ---- Шаг 3. Места привязываются к версии ----

ALTER TABLE public.points_by_place
    ADD COLUMN IF NOT EXISTS version_id uuid REFERENCES public.points_versions(id) ON DELETE CASCADE;

-- Всё, что уже лежит, — это первая версия
UPDATE public.points_by_place
   SET version_id = (SELECT id FROM public.points_versions ORDER BY effective_from LIMIT 1)
 WHERE version_id IS NULL;

ALTER TABLE public.points_by_place
    ALTER COLUMN version_id SET NOT NULL;

-- Уникальность переезжает: место неповторимо внутри версии, а не вообще.
-- Старое ограничение снимаем ПОСЛЕ заполнения колонки, иначе вставка
-- второй версии упала бы на нём.
ALTER TABLE public.points_by_place
    DROP CONSTRAINT IF EXISTS points_by_place_level_id_place_key;

CREATE UNIQUE INDEX IF NOT EXISTS points_by_place_version_level_place
    ON public.points_by_place (version_id, level_id, place);

COMMENT ON COLUMN public.points_by_place.version_id IS
    'Версия таблицы. Место неповторимо внутри версии, а не вообще';

-- ---- Шаг 3а. Сторож снимается ПЕРЕД наполнением ----
--
-- Файл должен быть прогоняем ПОВТОРНО, в том числе на базе, где он уже
-- проходил. Ровно такой случай у Кости в тестовой: версия заведена,
-- сторож стоит, а таблица мест пуста — и наполнение из шага 3б упёрлось
-- бы в собственный сторож.
--
-- Поэтому порядок: снять сторож, наполнить, поставить сторож заново
-- (шаг 4). Снятие безопасно: оно внутри транзакции, и если дальше что-то
-- упадёт, сторож вернётся вместе с откатом всей транзакции.

DROP TRIGGER IF EXISTS ochki_mesta_storozh  ON public.points_by_place;
DROP TRIGGER IF EXISTS ochki_versii_storozh ON public.points_versions;

-- ---- Шаг 3б. Уровни без мест наполняются тут же ----
--
-- ПОЙМАЛ ПРОГОН КОСТИ В ТЕСТОВОЙ 02.10. Там `points_by_place` пуста, и
-- после миграции наполнить её стало НЕЧЕМ: сторож из шага 4 запрещает
-- вставку в действующую версию, а версия действует с 2021 года. Я написал
-- миграцию так, будто таблица всегда непуста — в боевой это так (320
-- строк), в тестовой нет.
--
-- ПОЧЕМУ НАПОЛНЕНИЕ ЗДЕСЬ, А НЕ ЛАЗЕЙКА В СТОРОЖЕ. Первая моя попытка
-- разрешала вставку в ПУСТУЮ действующую версию. Прибор её уронил: вставка
-- идёт 320 строками, первая проходит, вторая уже видит первую — и версия
-- перестаёт быть пустой на середине своего же наполнения. Условие
-- «пусто или нет» для построчного сторожа непригодно.
--
-- ПОРЯДОК РЕШАЕТ ЗАДАЧУ БЕЗ ИСКЛЮЧЕНИЙ: наполняем ДО того, как сторож
-- встал. Сторож остаётся строгим — ни одной лазейки.
--
-- ЧИСЛА — Приложение 2 к Положению КСЛТ 2021, те же, что лежат в боевой
-- (замер 02.10, шаг 3: 1000·600·420·360 у Высшей, 130·80·55·48 у
-- итогового). ПРИВЯЗКА ПО `sort_order`, А НЕ ПО НАЗВАНИЮ: имена уровней
-- переименовывались дважды (30.09 и 02.10), и привязка по имени — ровно то,
-- из-за чего `kategorii-i-ochki.sql:179` сегодня не положил бы ни строки.

WITH таблица(место, "5", "4", "3", "2", "1") AS (
      VALUES
        (1, 1000, 600, 360, 215, 130),
        (2, 600, 360, 215, 130, 80),
        (3, 420, 250, 150, 90, 55),
        (4, 360, 215, 130, 77, 48),
        (5, 250, 150, 90, 55, 33),
        (6, 215, 130, 78, 45, 28),
        (7, 180, 110, 65, 38, 23),
        (8, 180, 110, 65, 38, 23),
        (9, 145, 90, 50, 30, 18),
        (10, 125, 75, 45, 27, 16),
        (11, 110, 65, 40, 23, 13),
        (12, 110, 65, 40, 23, 13),
        (13, 90, 55, 32, 19, 11),
        (14, 90, 55, 32, 19, 11),
        (15, 90, 55, 32, 19, 11),
        (16, 90, 55, 32, 19, 11),
        (17, 80, 50, 29, 17, 10),
        (18, 65, 38, 22, 13, 8),
        (19, 45, 27, 16, 9, 6),
        (20, 45, 27, 16, 9, 6),
        (21, 35, 21, 12, 8, 4),
        (22, 35, 21, 12, 8, 4),
        (23, 35, 21, 12, 8, 4),
        (24, 35, 21, 12, 8, 4),
        (25, 33, 18, 10, 6, 3),
        (26, 32, 18, 10, 6, 3),
        (27, 31, 18, 10, 6, 3),
        (28, 31, 18, 10, 6, 3),
        (29, 30, 18, 10, 6, 3),
        (30, 30, 18, 10, 6, 3),
        (31, 30, 18, 10, 6, 3),
        (32, 30, 18, 10, 6, 3),
        (33, 30, 18, 10, 6, 3),
        (34, 20, 12, 6, 4, 2),
        (35, 15, 8, 4, 3, 0),
        (36, 15, 8, 4, 3, 0),
        (37, 10, 5, 3, 2, 0),
        (38, 10, 5, 3, 2, 0),
        (39, 10, 4, 3, 2, 0),
        (40, 10, 4, 3, 2, 0),
        (41, 8, 3, 2, 1, 0),
        (42, 7, 3, 2, 1, 0),
        (43, 5, 3, 2, 1, 0),
        (44, 5, 3, 2, 1, 0),
        (45, 5, 3, 2, 1, 0),
        (46, 5, 3, 2, 1, 0),
        (47, 5, 3, 2, 1, 0),
        (48, 5, 3, 2, 1, 0),
        (49, 4, 2, 1, 1, 0),
        (50, 4, 2, 1, 1, 0),
        (51, 4, 2, 1, 1, 0),
        (52, 4, 2, 1, 1, 0),
        (53, 3, 2, 1, 1, 0),
        (54, 3, 2, 1, 1, 0),
        (55, 3, 2, 1, 1, 0),
        (56, 3, 2, 1, 1, 0),
        (57, 2, 1, 1, 1, 0),
        (58, 2, 1, 1, 1, 0),
        (59, 2, 1, 1, 1, 0),
        (60, 2, 1, 1, 1, 0),
        (61, 2, 1, 1, 1, 0),
        (62, 2, 1, 1, 1, 0),
        (63, 2, 1, 1, 1, 0),
        (64, 2, 1, 1, 1, 0)
),
разложено AS (
    SELECT (SELECT id FROM public.points_versions ORDER BY effective_from LIMIT 1) AS version_id,
           у.id AS level_id,
           т.место,
           CASE у.sort_order
               WHEN 5 THEN т."5" WHEN 4 THEN т."4" WHEN 3 THEN т."3"
               WHEN 2 THEN т."2" WHEN 1 THEN т."1"
           END AS очки
      FROM public.tournament_levels у
      CROSS JOIN таблица т
     WHERE у.sort_order BETWEEN 1 AND 5
)
INSERT INTO public.points_by_place (version_id, level_id, place, points)
SELECT р.version_id, р.level_id, р.место, р.очки
  FROM разложено р
 WHERE р.очки IS NOT NULL
   /* НАПОЛНЯЕМ ПО КАЖДОМУ УРОВНЮ ОТДЕЛЬНО, А НЕ «ЕСЛИ ТАБЛИЦА ПУСТА».
      Поймал второй прогон Кости: в тестовой нашёлся ОДИН уровень вместо
      пяти, наполнение дало ему 64 строки — и условие «таблица пуста»
      закрылось. Добавь после этого четыре категории — места им уже не
      завести. «Пять уровней с sort_order 1…5» было фактом БОЕВОЙ, а я
      принял его за факт продукта; стенд, собранный по боевой, промолчал.

      Уровень без мест наполняется, уровень со своими местами не
      трогается — условие измеримо и не зависит от числа уровней. */
   AND NOT EXISTS (SELECT 1 FROM public.points_by_place п
                    WHERE п.level_id   = р.level_id
                      AND п.version_id = р.version_id);

-- ---- Шаг 4. Сторож: прошлое не переписывается ----
--
-- Два запрета в одной функции, потому что это одно правило:
--   · версию нельзя завести задним числом — иначе поиск по дате начала
--     турнира нашёл бы её и переписал уже начисленное;
--   · у версии, которая уже в силе, нельзя править числа — поправка
--     заводится новой версией.
--
-- Версия, которая ещё не вступила, правится свободно: ею никто не
-- считал.

CREATE OR REPLACE FUNCTION public.ochki_proshloe_ne_pishetsya()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    дата    date;
    сегодня date := (now() AT TIME ZONE 'Asia/Bishkek')::date;
BEGIN
    /* СЕГОДНЯ СЧИТАЕТСЯ ПО БИШКЕКУ, А НЕ ПО UTC.
       Дата вступления стоит в одном календаре с `tournaments.date_start` —
       это дата турнира в клубе, а клуб в Бишкеке. Сервер базы живёт в UTC и
       с 06:00 по Бишкеку показывает уже завтрашний день: администратор,
       заводящий версию «с завтра», получил бы отказ «дата уже наступила».
       Костя работает по Чикаго — тем хуже, там расхождение целый вечер. */
    IF TG_TABLE_NAME = 'points_versions' THEN
        IF TG_OP = 'INSERT' THEN
            -- Первую версию (сборку из базы) пускаем: она и есть прошлое
            IF EXISTS (SELECT 1 FROM public.points_versions)
               AND NEW.effective_from <= сегодня THEN
                RAISE EXCEPTION
                    'Версия очков заводится только с будущей даты: % уже наступила',
                    NEW.effective_from;
            END IF;
            RETURN NEW;
        END IF;

        IF OLD.effective_from <= сегодня THEN
            RAISE EXCEPTION
                'Версия очков от % уже в силе — поправка заводится новой версией',
                OLD.effective_from;
        END IF;
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- points_by_place
    SELECT effective_from INTO дата
      FROM public.points_versions
     WHERE id = COALESCE(NEW.version_id, OLD.version_id);

    IF дата <= сегодня THEN
        RAISE EXCEPTION
            'Таблица очков версии от % уже в силе — поправка заводится новой версией',
            дата;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.ochki_proshloe_ne_pishetsya() IS
    'Версия очков заводится только с будущей даты, вступившая не правится';

DROP TRIGGER IF EXISTS ochki_versii_storozh ON public.points_versions;
CREATE TRIGGER ochki_versii_storozh
    BEFORE INSERT OR UPDATE OR DELETE ON public.points_versions
    FOR EACH ROW EXECUTE FUNCTION public.ochki_proshloe_ne_pishetsya();

DROP TRIGGER IF EXISTS ochki_mesta_storozh ON public.points_by_place;
CREATE TRIGGER ochki_mesta_storozh
    BEFORE INSERT OR UPDATE OR DELETE ON public.points_by_place
    FOR EACH ROW EXECUTE FUNCTION public.ochki_proshloe_ne_pishetsya();

-- ---- Шаг 5. Права: пишет только администратор ----
--
-- Слово Кости 02.10: «изменить очки может только администратор, не
-- менеджер». Сегодня политика пускает обоих
-- (`sql/схема/kategorii-i-ochki.sql:89`). Менеджер остаётся читателем:
-- экран он видит, поля у него заблокированы.
--
-- `public.is_admin()` уже есть (`sql/схема/schema-snapshot.sql:1430`),
-- второго определения роли не заводим.

ALTER TABLE public.points_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS points_versions_read ON public.points_versions;
CREATE POLICY points_versions_read ON public.points_versions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS points_versions_admin ON public.points_versions;
CREATE POLICY points_versions_admin ON public.points_versions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS points_by_place_staff ON public.points_by_place;
DROP POLICY IF EXISTS points_by_place_admin ON public.points_by_place;
CREATE POLICY points_by_place_admin ON public.points_by_place
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Чтение остаётся открытым: очки за место — открытая часть правил
DROP POLICY IF EXISTS points_by_place_read ON public.points_by_place;
CREATE POLICY points_by_place_read ON public.points_by_place
    FOR SELECT USING (true);

COMMIT;

-- ============================================================
-- ЧАСТЬ 3. ПЕРЕЧИТКА — ОТВЕТ «SUCCESS» НИЧЕГО НЕ ДОКАЗЫВАЕТ
-- ============================================================

SELECT 'ОТВЕТ 1 · УРОВНИ И МЕСТА' AS что;

SELECT у.sort_order, у.name, у.on_ladder,
       count(п.place)                           AS строк,
       max(п.points) FILTER (WHERE п.place = 1) AS за_первое,
       count(*) FILTER (WHERE п.points = 0)     AS нулевых
  FROM public.tournament_levels у
  LEFT JOIN public.points_by_place п ON п.level_id = у.id
 GROUP BY у.sort_order, у.name, у.on_ladder
 ORDER BY у.sort_order DESC;

SELECT 'ОТВЕТ 2 · ВЕРСИЯ' AS что;

SELECT в.effective_from, в.per_win, в.per_entry,
       count(п.id) AS строк_под_версией, в.note
  FROM public.points_versions в
  LEFT JOIN public.points_by_place п ON п.version_id = в.id
 GROUP BY в.id, в.effective_from, в.per_win, в.per_entry, в.note
 ORDER BY в.effective_from;

SELECT 'ОТВЕТ 3 · ПРАВА' AS что;

SELECT tablename, policyname, cmd,
       CASE WHEN coalesce(qual,'') || coalesce(with_check,'') LIKE '%manager%'
            THEN 'ПУСКАЕТ МЕНЕДЖЕРА' ELSE 'ok' END AS проверка
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('points_by_place','points_versions')
 ORDER BY tablename, policyname;

-- Сторож пробуем ВНУТРИ блока и отказ ловим сами: иначе файл обрывается
-- на ошибке, и приговор до нас не доезжает.
DO $$
DECLARE
    тронуто integer;
BEGIN
    DROP TABLE IF EXISTS приговор_сторож;
    BEGIN
        UPDATE public.points_by_place SET points = points WHERE place = 1;
        GET DIAGNOSTICS тронуто = ROW_COUNT;
        CREATE TEMP TABLE приговор_сторож AS
            SELECT ('НЕ СРАБОТАЛ: правка прошла, тронуто ' || тронуто)::text AS сторож;
    EXCEPTION WHEN raise_exception THEN
        CREATE TEMP TABLE приговор_сторож AS
            SELECT ('упал: ' || SQLERRM)::text AS сторож;
    END;
END $$;

SELECT 'ОТВЕТ 4 · СТОРОЖ' AS что;
SELECT * FROM приговор_сторож;

-- ============================================================
-- ПРИГОВОР
-- ============================================================

SELECT 'ПРИГОВОР' AS что;

WITH з AS (
  SELECT (SELECT count(*) FROM public.tournament_levels
           WHERE sort_order BETWEEN 1 AND 5)                        AS уровней,
         (SELECT count(*) FROM public.tournament_levels
           WHERE on_ladder AND sort_order BETWEEN 1 AND 5)           AS на_лестнице,
         (SELECT count(*) FROM public.points_by_place)               AS мест,
         (SELECT count(*) FROM public.points_versions)               AS версий,
         (SELECT count(*) FROM public.points_by_place
           WHERE version_id IS NULL)                                 AS без_версии,
         (SELECT count(*) FROM pg_policies
           WHERE tablename IN ('points_by_place','points_versions')
             AND coalesce(qual,'') || coalesce(with_check,'') LIKE '%manager%') AS менеджер,
         (SELECT сторож FROM приговор_сторож)                         AS сторож
)
SELECT 'уровней 1…5'           AS проверка, уровней::text     AS есть, '5'    AS ждём, (уровней = 5)::text     AS сошлось FROM з
UNION ALL SELECT 'на лестнице',          на_лестнице::text, '4',    (на_лестнице = 4)::text FROM з
UNION ALL SELECT 'строк мест',           мест::text,        '320',  (мест = 320)::text      FROM з
UNION ALL SELECT 'версий',               версий::text,      '1',    (версий = 1)::text      FROM з
UNION ALL SELECT 'мест без версии',      без_версии::text,  '0',    (без_версии = 0)::text  FROM з
UNION ALL SELECT 'политик с менеджером', менеджер::text,    '0',    (менеджер = 0)::text    FROM з
UNION ALL SELECT 'сторож',               сторож,            'упал', (сторож LIKE 'упал%')::text FROM з;

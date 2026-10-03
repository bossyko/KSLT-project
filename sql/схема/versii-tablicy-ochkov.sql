-- ============================================================
-- ВЕРСИИ ТАБЛИЦЫ ОЧКОВ: прошлое не трогается
-- ============================================================
--
-- НЕ ПРОГОНЯТЬ БЕЗ СЛОВА КОСТИ. Файл написан для чтения глазами.
-- Сначала тестовая (itlanqwcwygxchitaatt), потом боевая
-- (qqkzszesviukopgjbead) — и обе читаются после прогона.
--
-- ЗАЧЕМ. Слово Кости 02.10: «таблица в админке должна быть истиной и
-- применяться к начислению на всех турнирах, которые прошли через
-- платформу; новые изменения по начислению не должны касаться
-- прошедших турниров, только предстоящие».
--
-- Сегодня таблица одна и без даты (`points_by_place`, заведена
-- `sql/схема/kategorii-i-ochki.sql:67`). Правка числа меняет его
-- НАВСЕГДА — и для будущих турниров, и для любого пересчёта старого.
-- Пересчёт старого бывает: админка правит счёт и снимает результат.
--
-- ЧТО ДЕЛАЕМ. У таблицы появляется ВЕРСИЯ с датой вступления.
-- Турнир считается по версии, действовавшей на дату его НАЧАЛА.
-- Правка будущего = новая версия с будущей датой. Старая остаётся
-- лежать как лежала, и пересчёт старого турнира даёт те же числа.
--
-- ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. Версия НЕ дублируется в турнир.
-- Она находится по дате начала турнира — одним запросом, в одном
-- месте. Поэтому и нужен сторож из шага 4: если бы версию можно было
-- завести задним числом, поиск по дате переписал бы прошлое.
--
-- ЦЕНА, НАЗВАННАЯ ВСЛУХ:
--   1. Опечатку в действующей версии нельзя поправить на месте —
--      только новой версией с завтрашней даты. Для той версии, что
--      ещё не вступила, правка свободна.
--   2. Строк в `points_by_place` станет в разы больше: каждая версия
--      несёт свои 4×64 + 8 = 264 строки. Для экрана это не беда
--      (читается одна версия), для выгрузки базы — вес.
--   3. 25 и 10 (победа и участие) переезжают в версию. Значит эти два
--      числа тоже становятся историей, и это правильно: сегодня они
--      зашиты в код (`js/rating-points.js:18–19`) и правке недоступны.

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
       Дата вступления стоит в одном календаре с `tournaments.start_date` —
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
-- ЧТО ПРОВЕРИТЬ ЧТЕНИЕМ ПОСЛЕ ПРОГОНА
-- ============================================================
--
-- Ответ «Success» ничего не доказывает. Прогнать и прислать вывод:
--
-- SELECT effective_from, per_win, per_entry, note FROM public.points_versions;
--
-- SELECT в.effective_from, count(*) AS строк
--   FROM public.points_by_place п
--   JOIN public.points_versions в ON в.id = п.version_id
--  GROUP BY в.effective_from;
--
-- -- сторож должен УПАСТЬ, а не промолчать:
-- UPDATE public.points_by_place SET points = points WHERE place = 1;
-- -- ждём: «Таблица очков версии от 2021-01-01 уже в силе»
--
-- SELECT policyname, cmd, qual FROM pg_policies
--  WHERE tablename IN ('points_by_place', 'points_versions');
-- -- ждём: запись только is_admin(), чтение true

-- ============================================================
-- NTRP: обновить рейтинги и свести карточки-дубли
-- ============================================================
--
-- Списки от клуба: «Мужской список NTRP» и «Рейтинг жен NTRP_Кыргызстан».
-- Заливать заново нельзя — на карточках висят заявки, матчи, очки и история.
-- Поэтому обновляем существующие, а новых не заводим: в списках нет ни одного
-- игрока, которого не было бы в базе.
--
-- Шкала идёт шагом 0.25, и значение 3.7 из таблиц читается как 3.75.
--
-- Расхождения в написании имён разобраны вручную: где право написание клуба —
-- переименовываем карточку, где право база — оставляем как есть.
--
-- Запускать можно повторно: обновление и переименование идемпотентны, а
-- сведение дублей пропускается, если карточки уже нет.

BEGIN;

-- ---- 1. Свести карточки-дубли ----
--
-- У каждого из троих в базе оказалось по две карточки: на одной вся история,
-- вторая пустая. Переставляем все ссылки на главную и удаляем пустую, иначе
-- человек так и будет числиться дважды.

DO $$
DECLARE
    пара record;
    св record;
BEGIN
    FOR пара IN
        SELECT * FROM (VALUES
            -- лишняя карточка, главная карточка
            ('kerimbaev-erkin',                 'erkin-kerimbaev'),
            ('tagaybek-uulu-ulan',              'ulan-tagaybek-uulu'),
            ('elizaveta-aleksandra-ponomareva', 'aleksandra-elizaveta-ponomareva')
        ) AS t(лишний, главный)
    LOOP
        CONTINUE WHEN NOT EXISTS (SELECT 1 FROM public.players WHERE id = пара.лишний);

        -- Все внешние ключи на players — не перечисляем таблицы руками,
        -- иначе забытая связь оборвётся при удалении карточки
        FOR св IN
            SELECT c.conrelid::regclass AS таблица, a.attname AS поле
              FROM pg_constraint c
              JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
             WHERE c.contype = 'f'
               AND c.confrelid = 'public.players'::regclass
        LOOP
            EXECUTE format('UPDATE %s SET %I = $1 WHERE %I = $2',
                           св.таблица, св.поле, св.поле)
              USING пара.главный, пара.лишний;
        END LOOP;

        DELETE FROM public.players WHERE id = пара.лишний;
    END LOOP;
END $$;

-- ---- 2. Имена, где право написание клуба ----

UPDATE public.players SET name = 'Закир Гудаджанов' WHERE id = 'zakir-gudadzhanov';
UPDATE public.players SET name = 'Бек Кыдыргычев'   WHERE id = 'bek-kydyrgychov';

-- ---- 3. Рейтинги ----

UPDATE public.players p
   SET ntrp_singles = н.од,
       ntrp_doubles = н.пар,
       updated_at   = now()
  FROM (VALUES
    ('adel-dzhayloeva', 4.0, 3.75),
    ('adilya-mammadova', 2.5, 2.5),
    ('aisha-nurbekova', 2.5, 2.5),
    ('aybek-zholdoshbekov', 3.5, 3.75),
    ('ayday-orozbaeva', 4.0, 3.75),
    ('aydana-abishova', 2.5, 2.5),
    ('aydar-usmanov', 3.75, 3.75),
    ('ayzhan-temiralieva', 3.75, 3.0),
    ('aleksandr-fomin', 3.75, 3.75),
    ('aleksandra-muchkina', 3.75, 3.5),
    ('aleksandra-samaganova', 2.5, 2.5),
    ('aleksandra-elizaveta-ponomareva', 3.75, 3.5),
    ('alina-zhakypova', 2.5, 2.5),
    ('alina-osmonova', 2.5, 2.5),
    ('alina-fasahutdinova', 2.5, 2.5),
    ('aliya-orokova', 2.5, 2.5),
    ('altynay-dzhamanbaeva', 2.5, 2.5),
    ('alymbek-orokov', 3.75, 3.75),
    ('amina-kurbanova', 3.75, 3.5),
    ('amir-bazhanov', 3.75, 3.5),
    ('anastasiya-adzhibekova', 4.0, 3.75),
    ('asel-ashimova', 3.5, 3.5),
    ('asel-isabekova', 3.75, 3.5),
    ('baatyr-bakytbek', 3.5, 3.5),
    ('barno-tursunova', 3.75, 4.0),
    ('bulat-tsoy', 3.75, 3.75),
    ('valeriya-pak', 3.75, 3.5),
    ('valeriya-hegay', 3.75, 3.5),
    ('viktoriya-han', 2.5, 2.5),
    ('vladislav-kim', 3.75, 3.75),
    ('gulsan-galieva', 3.0, 2.5),
    ('dana-kurmanalieva', 3.0, 3.0),
    ('dana-kurmanalieva', 2.5, 2.5),
    ('dastan-omuraliev', 3.75, 3.5),
    ('diana-aytova', 2.5, 2.5),
    ('diana-dzhanusakova', 2.5, 2.5),
    ('ekaterina-saveleva', 2.5, 2.5),
    ('ekateria-titova', 3.75, 3.75),
    ('elena-kan', 3.75, 3.5),
    ('zakir-gudadzhanov', 3.75, 3.5),
    ('zakir-nazarov', 4.0, 3.75),
    ('zarima-baygubatova', 3.75, 3.5),
    ('ivan-korabelnikov', 3.5, 3.75),
    ('iskender-kadyrov', 3.5, 3.0),
    ('iskender-kurmanov', 3.75, 3.5),
    ('kadyrbek-adiev', 3.75, 3.5),
    ('kalima-askarova', 4.0, 3.75),
    ('kanat-abdrahmanov', 3.5, 3.75),
    ('keremet-begmatova', 3.75, 3.5),
    ('larisa-safronova', 4.0, 3.75),
    ('liliya-rahmatulina', 3.75, 3.5),
    ('mirbek-dyushenaliev', 3.5, 3.5),
    ('murat-noruzbaev', 3.75, 3.75),
    ('nazgul-kerimalieva', 3.75, 3.5),
    ('narmina-ahmatova', 3.75, 3.5),
    ('nataliya-tsurban', 3.75, 3.5),
    ('natalya-timirbaeva', 3.75, 3.75),
    ('nuriza-momunova', 2.5, 2.5),
    ('ravil-galinurov', 4.0, 4.0),
    ('rustam-suleymanov', 3.75, 3.75),
    ('sanzhar-sultanov', 3.5, 3.5),
    ('sveta-poharel', 3.75, 3.5),
    ('tatyana-andreevskaya', 3.75, 3.75),
    ('ulan-tagaybek-uulu', 3.0, 3.0),
    ('faruh-suleymanov', 3.5, 3.0),
    ('feyruza-ikram', 2.5, 2.5),
    ('firuza-chinshaylo', 2.5, 2.5),
    ('hamit-karaketov', 4.0, 3.75),
    ('yrysgul-sakebaeva', 2.5, 2.5),
    ('elina-samanova', 2.5, 2.5),
    ('eldiyar-boruev', 3.75, 3.5),
    ('erkin-kerimbaev', 3.5, 3.5),
    ('erlan-sydykov', 3.75, 3.75),
    ('ernest-takirov', 3.75, 3.75),
    ('esen-azimov', 3.75, 3.75),
    ('yura-yun', 4.0, 3.75)
       ) AS н(id, од, пар)
 WHERE p.id = н.id
   AND (p.ntrp_singles IS DISTINCT FROM н.од OR p.ntrp_doubles IS DISTINCT FROM н.пар);

-- Хвост: значения 3.7 у тех, кого в списках клуба нет
UPDATE public.players
   SET ntrp_singles = CASE WHEN ntrp_singles = 3.7 THEN 3.75 ELSE ntrp_singles END,
       ntrp_doubles = CASE WHEN ntrp_doubles = 3.7 THEN 3.75 ELSE ntrp_doubles END,
       updated_at   = now()
 WHERE ntrp_singles = 3.7 OR ntrp_doubles = 3.7;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ---- Проверка ----

SELECT count(*) AS всего_карточек,
       count(*) FILTER (WHERE ntrp_singles IS NULL) AS без_одиночного,
       count(*) FILTER (WHERE ntrp_doubles IS NULL) AS без_парного,
       count(*) FILTER (WHERE (ntrp_singles * 4) % 1 <> 0
                           OR (ntrp_doubles * 4) % 1 <> 0) AS не_по_шкале
  FROM public.players;
-- Ожидаем: карточек 388 (три дубля ушли), не_по_шкале 0.

SELECT id, name, ntrp_singles, ntrp_doubles
  FROM public.players
 WHERE id IN ('erkin-kerimbaev', 'ulan-tagaybek-uulu', 'aleksandra-elizaveta-ponomareva',
              'zakir-gudadzhanov', 'bek-kydyrgychov')
 ORDER BY name;
-- Ожидаем: пять карточек, у всех проставлен NTRP, имена в новом написании.

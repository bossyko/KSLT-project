-- ============================================================
-- NTRP: что изменится (ничего не меняет)
-- ============================================================
--
-- Читающий файл. Показывает три вещи перед обновлением рейтинга:
-- кому меняется NTRP, какие карточки сводим в одну и что у них внутри.
--
-- Запускать можно сколько угодно раз.

-- ---- 1. Кому меняется рейтинг ----

WITH новые(id, од, пар) AS (VALUES
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
)
SELECT p.name AS игрок,
       p.ntrp_singles AS одиночный_был, н.од AS одиночный_станет,
       p.ntrp_doubles AS парный_был,    н.пар AS парный_станет
  FROM новые н
  JOIN public.players p ON p.id = н.id
 ORDER BY p.name;
-- Ожидаем: 76 строк.

-- ---- 2. Карточки-дубли: что на них висит ----

SELECT p.id,
       p.name AS имя,
       p.ntrp_singles AS одиночный,
       p.ntrp_doubles AS парный,
       p.points AS очки,
       (SELECT count(*) FROM public.tournament_registrations r WHERE r.player_id = p.id) AS заявок,
       (SELECT count(*) FROM public.tournament_results t WHERE t.player_id = p.id) AS результатов,
       (SELECT count(*) FROM public.rating_history h WHERE h.player_id = p.id) AS истории,
       (SELECT count(*) FROM public.profiles pr WHERE pr.player_id = p.id) AS аккаунтов
  FROM public.players p
 WHERE p.id IN ('kerimbaev-erkin', 'tagaybek-uulu-ulan', 'elizaveta-aleksandra-ponomareva', 'erkin-kerimbaev', 'ulan-tagaybek-uulu', 'aleksandra-elizaveta-ponomareva')
 ORDER BY p.name;
-- Ожидаем: шесть карточек — по две на человека. Оставляем ту, на которой
-- висит история; пустую удаляем.

-- ---- 3. Значения не по шкале ----

SELECT id, name, ntrp_singles, ntrp_doubles
  FROM public.players
 WHERE (ntrp_singles * 4) % 1 <> 0
    OR (ntrp_doubles * 4) % 1 <> 0
 ORDER BY name;
-- Шаг шкалы — 0.25. После обновления здесь должно быть пусто.

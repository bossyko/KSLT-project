-- ============================================================
-- MASTERS мужской одиночный, 9 октября: заявки из формы — ПРАВКА
-- Турнир 24cad8f2-58a4-4e4f-997f-e4c967321da8, мест 24, круговая, 6 групп
-- ============================================================
--
-- Из формы 27 строк: 20 чёрных (состав) и 7 КРАСНЫХ (лист ожидания).
-- Красный шрифт в файле — признак очереди, он и задаёт статус.
-- ЛИСТ ОЖИДАНИЯ — РЕШЕНИЕ КЛУБА, А НЕ ПОРЯДОК ВРЕМЕНИ: Гильфанов подал
-- заявку второй по счёту и стоит в очереди.
--
-- Сверка с базой: 487 карточек, ключ без учёта порядка слов, ё сведена к е,
-- латиница переведена в кириллицу. Совпало точно 25 из 27.
--
-- ТРИ СТРОКИ СВЕДЕНЫ СО СЛОВА КОСТИ, а не прибором:
--   «Азим»            -> azim-isakov        (единственный Азим среди мужчин)
--   «Сейдиматов И.М»  -> iskender-seydimatov (единственный Сейдиматов)
--   «Атабаев Илан»    -> ilan-aatabaev      (похожесть 0.92, в базе «Аатабаев»)
--
-- ОДНА КАРТОЧКА ЗАВОДИТСЯ: Гильфанов Руслан. В форме у него стоит «нет
-- членства в КСЛТ», но слово Кости 07.10: «там не гостей, все члены КСЛТ».
-- Поэтому is_guest = false — и ТОЛЬКО ЭТО пускает человека в рейтинг:
-- `KSLT_RULES.вРейтинге` (js/kslt-rules.js:888) смотрит ровно на этот признак
-- и больше ни на что. is_member ставим true по его же слову, хотя продукт
-- этот признак сегодня не читает нигде.
--
-- Запускать можно повторно: заявки не задвоятся.

BEGIN;

-- ---- Карточка ----

INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('ruslan-gilfanov', 'Руслан Гильфанов', '🇰🇬', 'masters', 'men', true, false, false)
ON CONFLICT (id) DO NOTHING;

-- ---- Заявки ----
--
-- Время — из отметки формы, часовой пояс Бишкека.

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, status, registered_at)
SELECT '24cad8f2-58a4-4e4f-997f-e4c967321da8', з.игрок, з.статус, з.подано::timestamptz
  FROM (VALUES
    -- состав
    ('denis-li',                 'approved', '2026-10-01 11:15:34+06'),
    ('esen-azimov',              'approved', '2026-10-01 11:16:12+06'),
    ('murat-noruzbaev-2',        'approved', '2026-10-01 11:16:20+06'),
    ('vladislav-kim',            'approved', '2026-10-01 11:17:09+06'),
    ('zakir-nazarov',            'approved', '2026-10-01 11:17:23+06'),
    ('alymbek-orokov',           'approved', '2026-10-01 11:23:20+06'),
    ('azamat-dzhumabaev',        'approved', '2026-10-01 11:39:06+06'),
    ('erlan-sydykov',            'approved', '2026-10-01 11:47:28+06'),
    ('azim-isakov',              'approved', '2026-10-01 11:56:25+06'),
    ('ravil-rahmatulin',         'approved', '2026-10-01 12:06:23+06'),
    ('kadyrbek-adiev',           'approved', '2026-10-01 12:12:27+06'),
    ('ulugbek-salymbekov',       'approved', '2026-10-01 12:13:14+06'),
    ('daniyar-atahanov',         'approved', '2026-10-01 13:39:53+06'),
    ('ernest-takirov',           'approved', '2026-10-01 15:01:05+06'),
    ('eldiyar-boruev',           'approved', '2026-10-01 15:18:21+06'),
    ('avtandil-ernest',          'approved', '2026-10-01 16:09:12+06'),
    ('rustam-suleymanov',        'approved', '2026-10-01 16:46:48+06'),
    ('iskender-seydimatov',      'approved', '2026-10-05 21:14:20+06'),
    ('bulat-tsoy',               'approved', '2026-10-06 11:25:29+06'),
    ('roman-gudi',               'approved', '2026-10-06 12:40:49+06'),
    -- лист ожидания (красные в форме)
    ('ruslan-gilfanov',          'waitlist', '2026-10-01 11:16:06+06'),
    ('dzhantay-otorbaev',        'waitlist', '2026-10-01 11:52:04+06'),
    ('esendiyar-adylov',         'waitlist', '2026-10-01 12:24:55+06'),
    ('baatyr-bakytbek',          'waitlist', '2026-10-01 13:51:15+06'),
    ('abdikiim-mahmutov',        'waitlist', '2026-10-05 18:10:26+06'),
    ('ilan-aatabaev',            'waitlist', '2026-10-06 11:45:54+06'),
    ('azat-mukaev',              'waitlist', '2026-10-06 11:47:31+06')
  ) AS з(игрок, статус, подано)
 WHERE NOT EXISTS (
     SELECT 1 FROM public.tournament_registrations r
      WHERE r.tournament_id = '24cad8f2-58a4-4e4f-997f-e4c967321da8'
        AND r.player_id = з.игрок
 );

COMMIT;

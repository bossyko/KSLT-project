-- ============================================================
-- ДРУЖЕСКИЕ ПАРНЫЕ ТУРНИРЫ 11.10 — ЗАЯВКИ ИЗ ФОРМЫ
-- ============================================================
--
-- Выгрузка гугл-формы от 09.10: один лист, два турнира подряд, лист
-- ожидания лежит ВНУТРИ данных строкой-разделителем «Лист ожидания:».
--
--   FUTURES  2ac4e503  микст-пары, 18 мест — 18 пар в сетке, 1 в ожидании
--   MASTERS  5e628a79  мужские пары, 12 мест — 11 пар, ожидания нет
--
-- Оба турнира пусты: заявок в них НОЛЬ, проверено чтением 09.10.
--
-- ЛИСТ ОЖИДАНИЯ — РЕШЕНИЕ КЛУБА, А НЕ ПОРЯДОК ВРЕМЕНИ. Статус взят из
-- разделителя в файле, а не из времени подачи.
--
-- СВЕРКА С БАЗОЙ. Из 57 имён 47 опознаны точно (ключ не зависит от порядка
-- слов, ё сводится к е, латиница переводится в кириллицу). Пять опознаны
-- похожестью и подтверждены Костей словом:
--
--   Цурбан Наташа      → Наталия Цурбан      nataliya-tsurban
--   Тайгуронова Калича → Калича Тайгурова    kalicha-taygurova
--   Мусаев Т           → Темирбек Мусаев     temirbek-musaev
--   Сейдиматов И       → Искендер Сейдиматов iskender-seydimatov
--   Сардар             → Сардар Умаров       sardar-umarov  (в базе двое)
--   Влад               → Владислав Ким       vladislav-kim  (в базе два Кима)
--
-- ПОХОЖЕСТЬ — ЭТО ВОПРОС, А НЕ ОТВЕТ: ни одну пару я не свёл сам.
--
-- ЧЕТЫРЕ КАРТОЧКИ ЗАВОДЯТСЯ. id собран ТЕМ ЖЕ slugify, что у продукта
-- (js/admin/core/utils.js:234) — иначе карточка, заведённая руками, и
-- карточка, заведённая продуктом, разошлись бы адресами.
--
-- ПРЕДПОЛОЖЕНИЯ, КОТОРЫЕ Я СДЕЛАЛ САМ (проверь до прогона):
--
--   1. Напарник, которого в форме НЕТ («+», «определяется», «К»), Напарник, которого в форме НЕТ («+», «определяется», «К»),
--      заводится пустым: partner_id = NULL. Карточку на «К» и «+» не
--      создаю — это не имена. Место за парой занято, напарник впишется
--      в админке.
--   3. Категория новых карточек взята по турниру: futures у участника
--      FUTURES, masters у участников MASTERS. is_guest = false: пометки
--      о членстве в форме нет.
--
-- ПОЛ ПАРЫ НЕ ВЫДУМАН, А ВЫЧИСЛЕН ИЗ ДАННЫХ. gender_confirmed считается
-- запросом по таблице players: у микста — полы разные, у мужских пар —
-- оба men. Где напарника нет, стоит false: состав решает клуб.
-- УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ.
--
-- Запускать можно повторно: заявки не задваиваются, карточки тоже.

BEGIN;

-- ---- ШАГ 0: СЛЕПОК ДО ПРАВКИ ----
DROP TABLE IF EXISTS public.slepok_registrations_1010;
CREATE TABLE public.slepok_registrations_1010 AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id IN ('2ac4e503-2936-4a3f-8591-29abbe168186', '5e628a79-43f3-491e-bbf5-363d67d4c290');

DROP TABLE IF EXISTS public.slepok_players_1010;
CREATE TABLE public.slepok_players_1010 AS
SELECT id FROM public.players;

-- ---- ШАГ 1: ЧЕТЫРЕ КАРТОЧКИ ----
INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('sanzhar-abdubaliev',   'Санжар Абдубалиев',   '🇰🇬', 'futures', 'men',   false, false, false),
    ('nursultan-shakiraliev','Нурсултан Шакиралиев','🇰🇬', 'masters', 'men',   false, false, false),
    ('stepan-pashko',        'Степан Пашко',        '🇰🇬', 'masters', 'men',   false, false, false),
    ('valeriya-babenko',     'Валерия Бабенко',     '🇰🇬', 'masters', 'women', false, false, false)
ON CONFLICT (id) DO NOTHING;

-- ---- ШАГ 2: ЗАЯВКИ FUTURES ----
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT '2ac4e503-2936-4a3f-8591-29abbe168186', з.игрок, з.напарник, з.статус,
       CASE WHEN з.напарник IS NULL THEN false
            ELSE (SELECT p1.gender <> p2.gender
                    FROM public.players p1, public.players p2
                   WHERE p1.id = з.игрок AND p2.id = з.напарник)
       END,
       з.подано::timestamptz
  FROM (VALUES
    ('esendiyar-adylov', 'aysuluu-lenarova', 'approved', '2026-10-07 18:35:57.748'),
    ('nataliya-tsurban', 'omuradil-sydykov', 'approved', '2026-10-07 18:36:15.534'),
    ('denis-li', 'larisa-safronova', 'approved', '2026-10-07 18:36:47.367'),
    ('nursultan-ulukbekov', 'ayday-orozbaeva', 'approved', '2026-10-07 18:39:34.195'),
    ('elnur-omurzakov', 'karakoz-bolotbekova', 'approved', '2026-10-07 18:42:37.798'),
    ('saykal-niyazova', 'sanzhar-abdubaliev', 'approved', '2026-10-07 18:52:08.362'),
    ('ibragim-koshoybekov', 'asel-orokova', 'approved', '2026-10-07 18:53:01.661'),
    ('kamil-yakupov', 'viktoriya-han', 'approved', '2026-10-07 18:54:30.334'),
    ('shavkat-mihmanov', 'tat-yana-nechaeva', 'approved', '2026-10-07 19:11:30.769'),
    ('nailya-osmonova', 'altynbek-zhanybekov', 'approved', '2026-10-07 19:21:01.372'),
    ('erlan-sydykov', 'kalicha-taygurova', 'approved', '2026-10-07 19:53:26.725'),
    ('bekzhan-kylychbekov', 'altynay-dzhamanbaeva', 'approved', '2026-10-07 19:54:41.002'),
    ('asel-ashimova', 'elzar-azhibaev', 'approved', '2026-10-07 22:07:40.542'),
    ('dzhantay-otorbaev', 'aysha-turdumambetova', 'approved', '2026-10-07 22:54:05.960'),
    ('tolgonay-aytkulova', 'rustam-suleymanov', 'approved', '2026-10-07 23:29:10.939'),
    ('gulsan-galieva', 'aman-kanaev', 'approved', '2026-10-08 08:24:52.006'),
    ('alan-adzhibekov', 'anastasiya-adzhibekova', 'approved', '2026-10-08 13:04:40.553'),
    ('salih-ismailov', 'eliza-omurzakova', 'approved', '2026-10-08 13:25:02.147'),
    ('temirbek-musaev', NULL, 'waitlist', '2026-10-08 23:28:40.280')
       ) AS з(игрок, напарник, статус, подано)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = '2ac4e503-2936-4a3f-8591-29abbe168186' AND r.player_id = з.игрок);

-- ---- ШАГ 3: ЗАЯВКИ MASTERS ----
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT '5e628a79-43f3-491e-bbf5-363d67d4c290', з.игрок, з.напарник, з.статус,
       CASE WHEN з.напарник IS NULL THEN false
            ELSE (SELECT p1.gender = 'men' AND p2.gender = 'men'
                    FROM public.players p1, public.players p2
                   WHERE p1.id = з.игрок AND p2.id = з.напарник)
       END,
       з.подано::timestamptz
  FROM (VALUES
    ('vladislav-kim', 'azim-isakov', 'approved', '2026-10-07 18:52:18.528'),
    ('iskender-kurmanov', 'ermek-aratov', 'approved', '2026-10-07 18:53:41.258'),
    ('iskender-seydimatov', 'atham-israilov', 'approved', '2026-10-07 19:48:34.949'),
    ('sadyrbek-tovkeev', 'nursultan-shakiraliev', 'approved', '2026-10-07 20:52:54.007'),
    ('abdikiim-mahmutov', 'aziz-bazakov', 'approved', '2026-10-07 21:44:36.047'),
    ('karim-imanhodzhaev', 'baatyr-bakytbek', 'approved', '2026-10-07 22:31:25.305'),
    ('evgeniy-gorskih', 'ruslan-andreev', 'approved', '2026-10-07 23:13:25.741'),
    ('azat-mukaev', 'erlan-shekerbekov', 'approved', '2026-10-08 11:46:44.160'),
    ('stepan-pashko', 'valeriya-babenko', 'approved', '2026-10-08 16:54:37.239'),
    ('sardar-umarov', NULL, 'approved', '2026-10-08 16:55:55.997'),
    ('azamat-dzhumabaev', NULL, 'approved', '2026-10-09 16:17:31.559')
       ) AS з(игрок, напарник, статус, подано)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = '5e628a79-43f3-491e-bbf5-363d67d4c290' AND r.player_id = з.игрок);

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»
-- ============================================================

-- 1. Числа по турнирам. Ждём: FUTURES 18 approved и 1 waitlist,
--    MASTERS 11 approved и 0 waitlist.
SELECT t.title,
       count(*) FILTER (WHERE r.status = 'approved') AS v_setke,
       count(*) FILTER (WHERE r.status = 'waitlist') AS v_ozhidanii,
       count(*) AS vsego
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.tournament_id IN ('2ac4e503-2936-4a3f-8591-29abbe168186', '5e628a79-43f3-491e-bbf5-363d67d4c290')
 GROUP BY t.title ORDER BY t.title;

-- 2. Четыре карточки на месте: ждём 4.
SELECT count(*) AS novyh_kartochek
  FROM public.players
 WHERE id IN ('sanzhar-abdubaliev','nursultan-shakiraliev',
              'stepan-pashko','valeriya-babenko');

-- 3. Никого не завели лишнего: ждём ровно 4.
SELECT count(*) AS pribylo_kartochek
  FROM public.players p
 WHERE NOT EXISTS (SELECT 1 FROM public.slepok_players_1010 s WHERE s.id = p.id);

-- 4. Пол пары — вычислен, а не выдуман. У микста ждём 18 строк true;
--    у мужских пар 8 true, у Пашко с Бабенко false, и false у двух
--    заявок без напарника.
SELECT t.title, r.gender_confirmed, count(*) AS skolko
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.tournament_id IN ('2ac4e503-2936-4a3f-8591-29abbe168186', '5e628a79-43f3-491e-bbf5-363d67d4c290')
 GROUP BY t.title, r.gender_confirmed ORDER BY t.title, r.gender_confirmed;

-- 5. Три заявки без напарника — именно те три, и только они.
SELECT t.title, r.player_id, r.status
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.tournament_id IN ('2ac4e503-2936-4a3f-8591-29abbe168186', '5e628a79-43f3-491e-bbf5-363d67d4c290')
   AND r.partner_id IS NULL
 ORDER BY t.title, r.player_id;

-- 6. Один человек не стоит в одном турнире дважды — ни как участник,
--    ни как напарник. Ждём ПУСТО.
SELECT tournament_id, kto, count(*) AS raz
  FROM (SELECT tournament_id, player_id AS kto
          FROM public.tournament_registrations
         WHERE tournament_id IN ('2ac4e503-2936-4a3f-8591-29abbe168186', '5e628a79-43f3-491e-bbf5-363d67d4c290')
        UNION ALL
        SELECT tournament_id, partner_id
          FROM public.tournament_registrations
         WHERE tournament_id IN ('2ac4e503-2936-4a3f-8591-29abbe168186', '5e628a79-43f3-491e-bbf5-363d67d4c290')
           AND partner_id IS NOT NULL) AS x
 GROUP BY tournament_id, kto HAVING count(*) > 1;

-- 7. Слепки на месте, пока Костя не посмотрит глазами.
SELECT (SELECT count(*) FROM public.slepok_registrations_1010) AS bylo_zayavok,
       (SELECT count(*) FROM public.slepok_players_1010)       AS bylo_kartochek;

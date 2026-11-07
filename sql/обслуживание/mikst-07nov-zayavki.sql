-- ЗАЯВКИ ИЗ ФОРМЫ 07.11 — ДВА ТУРНИРА. ГНАТЬ ПО ОДНОМУ, СВЕРХУ ВНИЗ.
--
--   FUTURES микст → abeac952-0736-42d5-8203-51c524b5a715   17 пар + 5 ожидание
--   MASTERS парный → 064c6018-a3cd-4abb-95e8-ed818274c86a  12 пар + 4 ожидание
--
-- ТУРНИРЫ РАЗНЫЕ ПО ТИПУ, И ЭТО ЗАМЕР, А НЕ ДОГАДКА. В форме у первого
-- категория «Микст турнир - FUTURES», у второго просто «MASTERS». Пол
-- это подтвердил: в FUTURES все 17 пар смешанные, в MASTERS смешанных
-- только две из двенадцати. Поэтому `gender_confirmed` считается по
-- типу турнира, а не по разнице полов — формула взята из заливки 05.11,
-- где эта же ошибка уже стоила перезаливки.
--
-- СЕМЬ МЕСТ В ФОРМЕ ПУСТЫЕ («Нету», «-», «Пока не нашел», «Ищу
-- напарницу», «определяется» дважды). Напарник не выдумывается:
-- `partner_id` остаётся пустым.
--
-- ЧТО СВЕДЕНО, И ЭТО ЖДЁТ ТВОЕГО «ДА» ДО ПРОГОНА:
--   Бондарь Даниил      → Данил Бондарь          (совпал скелет без гласных)
--   Табалдыев Раимбек   → Раимбек Табалдиев      (совпал скелет)
--   Мурат Норузбаев     → Мурат Норзубаев        (совпал скелет)
--   Эльдар Кульджаев    → Элдар Кульджаев        (совпал скелет)
--   Кани Бадретдинова   → Канышай Бадретдинова   (сведено твоим словом 04.11)
--   Barno Tursunova     → Барно Турсунова        (найдена по-русски)
--   Allayar Nasirov     → Аллаяр Насыров         (найден по-русски, «Насиров» — опечатка)
--   K.u.Azat            → Азат Кубанычбек уулу   (совпал по ОБОИМ словам, как 04.11)
--   Тенгиз              → Тенгиз Атаханов        (в форме только имя, в базе один такой)
--   Руфат               → Руфат Мирджалиев       (в форме только имя, в базе один такой)
--
-- ЧТО НЕ СВЕДЕНО НАМЕРЕННО: Миргияз Мирджалиев и Сардар Товкеев —
-- совпала только фамилия при разных именах; Игорь Хан — твоё слово
-- 07.11 «Хан и Кан разные». Все трое заводятся новыми.
--
--   sql/обслуживание/mikst-07nov-zayavki.sql


-- ── 1. СЛЕПОК ДЛЯ ОТКАТА ─────────────────────────────────────────────
DROP TABLE IF EXISTS public.slepok_mikst_07nov;

CREATE TABLE public.slepok_mikst_07nov AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id IN ('abeac952-0736-42d5-8203-51c524b5a715',
                         '064c6018-a3cd-4abb-95e8-ed818274c86a');

SELECT count(*) AS bylo_zayavok FROM public.slepok_mikst_07nov;


-- ── 2. ВОСЕМЬ НОВЫХ КАРТОЧЕК ─────────────────────────────────────────
-- Остальные 61 имя найдены в базе. Гостями не заводим: только
-- `is_guest = false` пускает человека в рейтинг (`js/kslt-rules.js`).
-- Имя впереди фамилии — правило 14.10.
--
-- ПРЕДПОЛОЖЕНИЕ, И Я ЕГО НАЗЫВАЮ: разряд всем поставлен `futures` —
-- новая карточка без известного рейтинга встаёт на нижнюю ступень.
-- Шестеро из них заявлены в MASTERS, но разряд — это рейтинговая
-- ступень, а не турнир, в который подали. Не так — хвост файла меняет
-- одной строкой.

INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('mariya-leypi',         'Мария Лейпи',         '🇰🇬', 'futures', 'women', true, false, false),
    ('igor-han',             'Игорь Хан',           '🇰🇬', 'futures', 'men',   true, false, false),
    ('kirill-kistanov',      'Кирилл Кистанов',     '🇰🇬', 'futures', 'men',   true, false, false),
    ('ridvan-loyanov',       'Ридван Лоянов',       '🇰🇬', 'futures', 'men',   true, false, false),
    ('ivan-pritula',         'Иван Притула',        '🇰🇬', 'futures', 'men',   true, false, false),
    ('kalys-kazakbaev',      'Калыс Казакбаев',     '🇰🇬', 'futures', 'men',   true, false, false),
    ('mirgiyaz-mirdzhaliev', 'Миргияз Мирджалиев',  '🇰🇬', 'futures', 'men',   true, false, false),
    ('sardar-tovkeev',       'Сардар Товкеев',      '🇰🇬', 'futures', 'men',   true, false, false)
ON CONFLICT (id) DO NOTHING;


-- ── 3. СНОС ПРЕЖНИХ ЗАЯВОК ЭТИХ ДВУХ ТУРНИРОВ ────────────────────────
-- Только заявки и только этих турниров. Карточки, очки и история
-- игроков не трогаются ничем. Слепок выше уже снят.
DELETE FROM public.tournament_registrations
 WHERE tournament_id IN ('abeac952-0736-42d5-8203-51c524b5a715',
                         '064c6018-a3cd-4abb-95e8-ed818274c86a');


-- ── 4. FUTURES МИКСТ: 17 ПАР + 5 В ЛИСТЕ ОЖИДАНИЯ ────────────────────
-- `registered_at` — настоящее время подачи из формы, пояс Бишкека.
--
-- `waitlisted_at` — НАМЕРЕНО, и вот почему он нужен обоим листам.
-- Очередь считает база: `queue_at` = COALESCE(waitlisted_at,
-- registered_at). У листа ожидания FUTURES время подачи РАНЬШЕ, чем у
-- последних пар основы (10:53 третьего против 23:29 пятого), и без
-- отметки ожидание встало бы ВПЕРЕДИ основы. ПОСЧИТАНО: якорь
-- 2026-11-07 06:00+06 — позже самой поздней отметки формы (06.11 18:27),
-- шаг минута. Числа служат только порядку.

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed,
     registered_at, waitlisted_at)
SELECT т.id, з.игрок, з.напарник, з.статус,
       CASE WHEN т.gender IN ('men', 'women') THEN
                 COALESCE(p1.gender = т.gender, true)
             AND COALESCE(p2.gender = т.gender, з.напарник IS NULL)
            WHEN т.format = 'mixed_doubles' THEN
                 COALESCE(p1.gender <> p2.gender, з.напарник IS NULL)
            ELSE true
       END,
       з.подано::timestamptz,
       з.очередь::timestamptz
  FROM (VALUES
    -- основа, порядок строго по форме: время растёт сверху вниз
    ('danil-bondar',          'mariya-leypi',         'approved', '2026-11-03T10:39:40+06', NULL),
    ('timur-baygubatov',      'zarima-baygubatova',   'approved', '2026-11-03T10:42:21+06', NULL),
    ('adilet-kanatbekov',     'ariana-kasymbekova',   'approved', '2026-11-03T10:42:42+06', NULL),
    ('ruslan-gilfanov',       'saykal-niyazova',      'approved', '2026-11-03T10:43:05+06', NULL),
    ('ibragim-koshoybekov',   'asel-orokova',         'approved', '2026-11-03T10:47:05+06', NULL),
    ('shavkat-mihmanov',      'adel-dzhayloeva',      'approved', '2026-11-03T10:54:27+06', NULL),
    ('dana-kurmanalieva',     'igor-han',             'approved', '2026-11-03T11:05:01+06', NULL),
    ('kanyshay-badretdinova', 'esen-azimov',          'approved', '2026-11-03T11:16:07+06', NULL),
    ('chingis-chukin',        'kanykey-tursunbaeva',  'approved', '2026-11-03T11:46:45+06', NULL),
    ('elzar-azhibaev',        'asel-ashimova',        'approved', '2026-11-03T12:40:31+06', NULL),
    ('esendiyar-adylov',      'aysuluu-lenarova',     'approved', '2026-11-03T12:43:30+06', NULL),
    ('salman-beyshenaliev',   'yana-belekova',        'approved', '2026-11-03T12:48:50+06', NULL),
    ('temirbek-musaev',       'aziza-musaeva',        'approved', '2026-11-03T13:14:30+06', NULL),
    ('raimbek-tabaldiev',     'aynel-kazybaeva',      'approved', '2026-11-04T13:43:57+06', NULL),
    ('barno-tursunova',       'allayar-nasyrov',      'approved', '2026-11-04T16:38:25+06', NULL),
    ('zakir-nazarov',         'alina-zhakypova',      'approved', '2026-11-04T23:29:38+06', NULL),
    ('sejtek-irsaliev',       'ayday-orozbaeva',      'approved', '2026-11-05T23:29:38+06', NULL),
    -- лист ожидания, порядок по форме; напарника нет ни у кого, кроме
    -- четвёртого — там «Ищу напарницу» стоит ПЕРВЫМ полем, а человек
    -- записан напарником, поэтому заявителем ставится он
    ('azat-kubanychbek-uulu', NULL,                   'waitlist', '2026-11-03T10:53:02+06', '2026-11-07T06:00+06'),
    ('kamil-atykanov',        NULL,                   'waitlist', '2026-11-03T11:11:54+06', '2026-11-07T06:01+06'),
    ('leonid-tsoy',           NULL,                   'waitlist', '2026-11-03T11:26:21+06', '2026-11-07T06:02+06'),
    ('azat-bazarkulov',       NULL,                   'waitlist', '2026-11-03T11:44:59+06', '2026-11-07T06:03+06'),
    ('bakyt-kapakov',         NULL,                   'waitlist', '2026-11-04T18:14:00+06', '2026-11-07T06:04+06')
  ) AS з(игрок, напарник, статус, подано, очередь)
  CROSS JOIN public.tournaments т
  LEFT JOIN public.players p1 ON p1.id = з.игрок
  LEFT JOIN public.players p2 ON p2.id = з.напарник
 WHERE т.id = 'abeac952-0736-42d5-8203-51c524b5a715';


-- ── 5. MASTERS ПАРНЫЙ: 12 ПАР + 4 В ЛИСТЕ ОЖИДАНИЯ ───────────────────
-- В листе ожидания MASTERS время подачи СПОРИТ с порядком строк: идёт
-- 06.11, 03.11, 04.11, 05.11. Поэтому очередь задаёт `waitlisted_at`
-- по порядку формы, шаг минута от того же якоря.

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed,
     registered_at, waitlisted_at)
SELECT т.id, з.игрок, з.напарник, з.статус,
       CASE WHEN т.gender IN ('men', 'women') THEN
                 COALESCE(p1.gender = т.gender, true)
             AND COALESCE(p2.gender = т.gender, з.напарник IS NULL)
            WHEN т.format = 'mixed_doubles' THEN
                 COALESCE(p1.gender <> p2.gender, з.напарник IS NULL)
            ELSE true
       END,
       з.подано::timestamptz,
       з.очередь::timestamptz
  FROM (VALUES
    ('arina-belyaeva',           'vladimir-antonenko',   'approved', '2026-11-03T11:26:36+06', NULL),
    ('maksim-serko',             'arsen-umurzakov',      'approved', '2026-11-03T11:48:01+06', NULL),
    ('azim-isakov',              'aziz-bazakov',         'approved', '2026-11-03T14:31:40+06', NULL),
    ('furkat-sadykov',           'sardar-umarov',        'approved', '2026-11-03T16:03:31+06', NULL),
    ('dzhantay-otorbaev',        'kirill-kistanov',      'approved', '2026-11-03T19:33:22+06', NULL),
    ('ridvan-loyanov',           'rustam-ushur',         'approved', '2026-11-03T21:00:52+06', NULL),
    ('murat-noruzbaev',          'ivan-pritula',         'approved', '2026-11-03T22:18:16+06', NULL),
    ('atham-israilov',           'azamat-dzhumabaev',    'approved', '2026-11-03T22:57:05+06', NULL),
    ('anastasiya-trofimushkina', 'malik-kamalov',        'approved', '2026-11-04T00:38:09+06', NULL),
    ('iskender-seydimatov',      'mirgiyaz-mirdzhaliev', 'approved', '2026-11-04T18:27:23+06', NULL),
    ('ruslan-kuldzhaev',         'eldar-kuldzhaev',      'approved', '2026-11-05T18:27:23+06', NULL),
    -- напарник не назван: в форме «определяется»
    ('erlan-shekerbekov',        NULL,                   'approved', '2026-11-06T18:27:23+06', NULL),
    -- лист ожидания: очередь по порядку формы, время подачи ей перечит
    ('erlan-sydykov',            'kalys-kazakbaev',      'waitlist', '2026-11-06T18:27:23+06', '2026-11-07T06:10+06'),
    ('sardar-tovkeev',           'ildiyar-murataliev',   'waitlist', '2026-11-03T13:24:04+06', '2026-11-07T06:11+06'),
    ('tengiz-atahanov',          'rufat-mirdzhaliev',    'waitlist', '2026-11-04T13:24:04+06', '2026-11-07T06:12+06'),
    ('ruslan-andreev',           NULL,                   'waitlist', '2026-11-05T13:24:04+06', '2026-11-07T06:13+06')
  ) AS з(игрок, напарник, статус, подано, очередь)
  CROSS JOIN public.tournaments т
  LEFT JOIN public.players p1 ON p1.id = з.игрок
  LEFT JOIN public.players p2 ON p2.id = з.напарник
 WHERE т.id = '064c6018-a3cd-4abb-95e8-ed818274c86a';


-- ── 6. ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success» ─────────────────
-- Ждём 38 строк: FUTURES 17 approved + 5 waitlist, MASTERS 12 + 4.
-- `pol_soshyolsya` = true у ВСЕХ. Ни одного «???» в именах: вопросы
-- означали бы, что карточки с таким адресом в базе нет и заявка висит
-- в пустоту.
-- Очередь читается по `queue_at`, как её считает сама база.

SELECT CASE r.tournament_id
         WHEN 'abeac952-0736-42d5-8203-51c524b5a715' THEN 'FUTURES микст'
         ELSE 'MASTERS парный'
       END                                                      AS turnir,
       row_number() OVER (PARTITION BY r.tournament_id
                          ORDER BY COALESCE(r.waitlisted_at, r.registered_at)) AS nom,
       r.status,
       COALESCE(p1.name, '??? ' || r.player_id)                 AS igrok,
       COALESCE(p2.name, CASE WHEN r.partner_id IS NULL THEN '— нет напарника —'
                              ELSE '??? ' || r.partner_id END)  AS naparnik,
       p1.gender || ' / ' || COALESCE(p2.gender, '—')           AS pol_pary,
       r.gender_confirmed                                       AS pol_soshyolsya,
       to_char(r.registered_at AT TIME ZONE 'Asia/Bishkek', 'DD.MM HH24:MI') AS podano
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id IN ('abeac952-0736-42d5-8203-51c524b5a715',
                           '064c6018-a3cd-4abb-95e8-ed818274c86a')
 ORDER BY turnir, nom;


-- ── ХВОСТ: ЕСЛИ РАЗРЯД НОВЫМ НУЖЕН ДРУГОЙ ────────────────────────────
-- Шестеро новых заявлены в MASTERS, а разряд им поставлен `futures`
-- (нижняя ступень для карточки без известного рейтинга). Если решишь
-- иначе — одна строка, выполнять отдельно:
--
-- UPDATE public.players SET category_id = 'masters', updated_at = now()
--  WHERE id IN ('kirill-kistanov','ridvan-loyanov','ivan-pritula',
--               'kalys-kazakbaev','mirgiyaz-mirdzhaliev','sardar-tovkeev');
--
-- ── ОТКАТ, ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК ──────────────────────────────────
-- DELETE FROM public.tournament_registrations
--  WHERE tournament_id IN ('abeac952-0736-42d5-8203-51c524b5a715',
--                          '064c6018-a3cd-4abb-95e8-ed818274c86a');
-- INSERT INTO public.tournament_registrations
-- SELECT * FROM public.slepok_mikst_07nov;

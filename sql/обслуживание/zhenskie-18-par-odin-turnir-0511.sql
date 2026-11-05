-- ЖЕНСКИЕ ПАРЫ — 18 ПАР В ОДИН ТУРНИР. 05.11
--
-- Слово Кости 05.11: «да, в один турнир, и при этом сохранить порядок
-- заявок, и лист ожидания включить; я уже поставил 18 пар в данном
-- турнире».
--
--   турнир → 6c6a7913-6b55-4af4-af9b-f0419ba69363
--            «Дружеский женский парный MASTERS и FUTURES», group_league
--
-- ПОЧЕМУ ПРОШЛАЯ ЗАЛИВКА ПОЛОЖИЛА ТОЛЬКО ДЕВЯТЬ. Я разложил пары на два
-- турнира по колонке «КАТЕГОРИЯ» и взял второй id из прибора 04.11 —
-- ИЗ ПАМЯТИ, А НЕ ЧТЕНИЕМ. Турнира `eb6f50cd` в базе нет вовсе, запрос
-- взял его через `CROSS JOIN ... WHERE id = …`, не нашёл и вставил НОЛЬ
-- СТРОК МОЛЧА. Здесь турнир берётся так же, но добавлена проверка: шаг 4
-- читает, сколько строк легло, и расхождение видно числом.
--
-- ПОРЯДОК ЗАЯВОК СОХРАНЁН — он и есть порядок формы: `registered_at`
-- взят из колонки «Отметка времени», пояс Бишкека. Время в форме растёт
-- по строкам, значит очередь совпадает со списком.
--
-- КАРТОЧКИ НЕ ЗАВОДЯТСЯ НИ ОДНОЙ, все 38 имён сведены сверкой 05.11 и
-- записаны так, как стоят в базе (слово Кости: «сводишь, как у нас в
-- базе записаны»).
--
-- ЛИСТ ОЖИДАНИЯ: Айдай Орозбаева / Наталья Тимирбаева. Времени подачи у
-- них в форме НЕТ — они вписаны вручную под списком, — поэтому ставится
-- время прогона: очередь считает база по `COALESCE(waitlisted_at,
-- registered_at)`, и они встают последними. Выдуманного времени здесь
-- нет.
--
-- ГНАТЬ ПО ОДНОМУ, СВЕРХУ ВНИЗ.
--
--   sql/обслуживание/zhenskie-18-par-odin-turnir-0511.sql


-- ── 1. СЛЕПОК ДЛЯ ОТКАТА ─────────────────────────────────────────────
DROP TABLE IF EXISTS public.slepok_zhenskie_18_0511;

CREATE TABLE public.slepok_zhenskie_18_0511 AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

SELECT count(*) AS bylo_zayavok FROM public.slepok_zhenskie_18_0511;


-- ── 2. СНОС ТЕКУЩИХ ЗАЯВОК ЭТОГО ТУРНИРА ─────────────────────────────
-- Только заявки и только этого турнира. Карточки, очки и история игроков
-- не трогаются ничем.
DELETE FROM public.tournament_registrations
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';


-- ── 3. ВОСЕМНАДЦАТЬ ПАР И ЛИСТ ОЖИДАНИЯ ──────────────────────────────
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed,
     registered_at, waitlisted_at)
SELECT т.id, з.игрок, з.напарник, з.статус,
       /* СОСТАВ СОШЁЛСЯ — ПО ПОЛУ ТУРНИРА, А НЕ ПО РАЗНИЦЕ ПОЛОВ.
          04.11 здесь стояло `p1.gender <> p2.gender` — формула микста,
          и в женском турнире она давала ровно обратное: все заявки
          легли «ждут решения по полу». Одно определение живёт в коде
          (`составСошёлся`), и оно смотрит на `gender` ТУРНИРА. */
       CASE WHEN т.gender IN ('men', 'women') THEN
                 COALESCE(p1.gender = т.gender, true)
             AND COALESCE(p2.gender = т.gender, з.напарник IS NULL)
            WHEN т.format = 'mixed_doubles' THEN
                 COALESCE(p1.gender <> p2.gender, true)
            ELSE true
       END,
       COALESCE(з.подано::timestamptz, now()),
       CASE WHEN з.статус = 'waitlist' THEN now() ELSE NULL END
  FROM (VALUES
    -- порядок строго по форме: «Отметка времени» растёт сверху вниз
    ('kanykey-tursunbaeva',     'zuhra-muralieva',        'approved', '2026-11-02T14:22:36.885+06'),
    ('nataliya-tsurban',        'kalicha-taygurova',      'approved', '2026-11-02T14:23:36.992+06'),
    ('adel-dzhayloeva',         'anastasiya-adzhibekova', 'approved', '2026-11-02T14:32:39.189+06'),
    ('aysuluu-lenarova',        'aida-nogoybaeva',        'approved', '2026-11-02T14:36:51.298+06'),
    ('zarima-baygubatova',      'asel-ashimova',          'approved', '2026-11-02T14:49:26.113+06'),
    ('tolgonay-aytkulova',      'asel-orokova',           'approved', '2026-11-02T15:04:30.613+06'),
    ('kalima-askarova',         'aziza-musaeva',          'approved', '2026-11-02T15:50:30.717+06'),
    ('kanyshay-badretdinova',   'leyla-ilyasova',         'approved', '2026-11-02T16:59:19.811+06'),
    ('nurzhamal-dzhanibekova',  'aliya-makeshova',        'approved', '2026-11-02T17:22:25.209+06'),
    ('karakoz-bolotbekova',     'erakyym-ismatova',       'approved', '2026-11-02T18:34:18.046+06'),
    ('leyli-blagovisnaya',      'tatyana-andreevskaya',   'approved', '2026-11-03T10:05:44.894+06'),
    ('barno-tursunova',         'roza-isabekova',         'approved', '2026-11-03T10:06:04.029+06'),
    ('alina-fasahutdinova',     'nuriza-momunova',        'approved', '2026-11-03T10:33:59.495+06'),
    ('anastasiya-trofimushkina','gulmira-orozalieva',     'approved', '2026-11-03T12:52:18.276+06'),
    ('aziza-sultanalieva',      'leysan-ilyasova',        'approved', '2026-11-03T16:34:56.688+06'),
    ('roza-berdieva',           'binazir-ulanbekova',     'approved', '2026-11-03T18:06:52.889+06'),
    ('zulayka-talasbek-kyzy',   'valeriya-babenko',       'approved', '2026-11-04T15:38:30+06'),
    ('kseniya-han',             'valeriya-pak',           'approved', '2026-11-04T21:20:24+06'),
    -- лист ожидания: времени подачи в форме нет, ставится время прогона
    ('ayday-orozbaeva',         'natalya-timirbaeva',     'waitlist', NULL)
  ) AS з(игрок, напарник, статус, подано)
  CROSS JOIN public.tournaments т
  LEFT JOIN public.players p1 ON p1.id = з.игрок
  LEFT JOIN public.players p2 ON p2.id = з.напарник
 WHERE т.id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';


-- ── 4. ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success» ─────────────────
-- Ждём: 19 строк — 18 `approved` в порядке формы и одна `waitlist` в
-- конце; `pol_soshyolsya` = true у ВСЕХ; ни одного «???» в именах.
SELECT row_number() OVER (ORDER BY COALESCE(r.waitlisted_at, r.registered_at)) AS nom,
       COALESCE(p1.name, '??? ' || r.player_id)                 AS igrok,
       COALESCE(p2.name, '??? ' || COALESCE(r.partner_id, '—')) AS naparnik,
       r.status,
       r.gender_confirmed                                       AS pol_soshyolsya,
       to_char(r.registered_at AT TIME ZONE 'Asia/Bishkek', 'DD.MM HH24:MI') AS podano
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363'
 ORDER BY nom;

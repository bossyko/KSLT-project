-- ЖЕНСКИЕ ПАРЫ 7 НОЯБРЯ — ЗАЛИВКА В ДВА ТУРНИРА. 04.11
--
-- Список в форме ОДИН, турнира ДВА, и делит их колонка «КАТЕГОРИЯ»:
--   FUTURES → eb6f50cd-4845-4943-b664-64c07e9dff81   (8 пар)
--   MASTERS → 6c6a7913-6b55-4af4-af9b-f0419ba69363   (8 пар)
--
-- Порядок пар внутри турнира — по строкам файла; время подачи взято из
-- формы, пояс Бишкека. Время в форме растёт по строкам (проверено), так
-- что порядок и время не спорят и `waitlisted_at` здесь не нужен: очередь
-- считает база по `queue_at` = COALESCE(waitlisted_at, registered_at).
--
-- Сверено одним читающим запросом (`zayavki-sverka-imen.sql`): 18 имён из
-- 32 сошлись по ключу, шесть сведены СЛОВОМ КОСТИ 04.11, семь карточек
-- заводятся здесь. ПОХОЖЕСТЬ — ЭТО ВОПРОС, А НЕ ОТВЕТ: ни одну пару я не
-- сводил сам.
--
-- ЗАПУСКАТЬ МОЖНО ПОВТОРНО: карточки не перезапишутся, заявки не
-- задвоятся.

BEGIN;

-- ---- ШАГ 1: СЕМЬ КАРТОЧЕК ----
--
-- ИМЯ ВПЕРЕДИ ФАМИЛИИ — правило Кости 14.10. Написание трёх имён он
-- поправил сам 04.11: Эркеайым Исаматова → Эркайым Исматова; у
-- Биназир Уланбековой отчество убрано; Sweta Pokharel записана
-- по-русски — Светлана Похарел.
--
-- СВЕТЛАНА ПОХАРЕЛ ЗАВОДИТСЯ ГОСТЕМ — прямое слово Кости 04.11.
-- Это РАСХОДИТСЯ с правилом 14.10 «гостями не заводим, идёт бесплатный
-- период», и расхождение названо, а не спрятано: признак гостя — решение
-- клуба на день заливки, и сегодня оно такое.
-- Гость в рейтинг не идёт: `KSLT_RULES.вРейтинге` смотрит ровно на него.

INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('svetlana-poharel',    'Светлана Похарел',   '🇰🇬', 'futures', 'women', false, true,  false),
    ('roza-berdieva',       'Роза Бердиева',      '🇰🇬', 'futures', 'women', true,  false, false),
    ('binazir-ulanbekova',  'Биназир Уланбекова', '🇰🇬', 'futures', 'women', true,  false, false),
    ('leyla-ilyasova',      'Лейла Ильясова',     '🇰🇬', 'masters', 'women', true,  false, false),
    ('leysan-ilyasova',     'Лейсан Ильясова',    '🇰🇬', 'masters', 'women', true,  false, false),
    ('erkayym-ismatova',    'Эркайым Исматова',   '🇰🇬', 'masters', 'women', true,  false, false),
    ('aziza-sultanalieva',  'Азиза Султаналиева', '🇰🇬', 'masters', 'women', true,  false, false)
ON CONFLICT (id) DO NOTHING;

-- ---- ШАГ 2: ЗАЯВКИ FUTURES ----
--
-- `gender_confirmed` считается из пола ОБОИХ, а не ставится рукой: турнир
-- женский, и смешанной пары здесь быть не должно. Тот же образец, что
-- 11.10 (`druzheskie-pary-1110-zayavki.sql`) — не рисовать заново то, что
-- уже сделано.

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT 'eb6f50cd-4845-4943-b664-64c07e9dff81', з.игрок, з.напарник, з.статус,
       CASE WHEN з.напарник IS NULL THEN false
            ELSE (SELECT p1.gender <> p2.gender
                    FROM public.players p1, public.players p2
                   WHERE p1.id = з.игрок AND p2.id = з.напарник)
       END,
       з.подано::timestamptz
  FROM (VALUES
    ('kanykey-tursunbaeva', 'zuhra-muralieva', 'approved', '2026-11-02T14:22:36.885+06'),
    ('nataliya-tsurban', 'kalicha-taygurova', 'approved', '2026-11-02T14:23:36.992+06'),
    ('aysuluu-lenarova', 'aida-nogoybaeva', 'approved', '2026-11-02T14:36:51.298+06'),
    ('zarima-baygubatova', 'asel-ashimova', 'approved', '2026-11-02T14:49:26.113+06'),
    ('tolgonay-aytkulova', 'asel-orokova', 'approved', '2026-11-02T15:04:30.613+06'),
    ('nurzhamal-dzhanibekova', 'svetlana-poharel', 'approved', '2026-11-02T17:22:25.209+06'),
    ('alina-fasahutdinova', 'nuriza-momunova', 'approved', '2026-11-03T10:33:59.495+06'),
    ('roza-berdieva', 'binazir-ulanbekova', 'approved', '2026-11-03T18:06:52.889+06')
       ) AS з(игрок, напарник, статус, подано)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = 'eb6f50cd-4845-4943-b664-64c07e9dff81'
          AND r.player_id = з.игрок);

-- ---- ШАГ 3: ЗАЯВКИ MASTERS ----
--
-- У пары Барно Турсуновой напарница в форме не названа — стоит
-- «определяется». Пары нет, и выдумывать её нельзя: заявка идёт с
-- пустым напарником, как 11.10 шла заявка без пары. Имя допишется, когда
-- Костя его назовёт.

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT '6c6a7913-6b55-4af4-af9b-f0419ba69363', з.игрок, з.напарник, з.статус,
       CASE WHEN з.напарник IS NULL THEN false
            ELSE (SELECT p1.gender <> p2.gender
                    FROM public.players p1, public.players p2
                   WHERE p1.id = з.игрок AND p2.id = з.напарник)
       END,
       з.подано::timestamptz
  FROM (VALUES
    ('adel-dzhayloeva', 'anastasiya-adzhibekova', 'approved', '2026-11-02T14:32:39.189+06'),
    ('kalima-askarova', 'aziza-musaeva', 'approved', '2026-11-02T15:50:30.717+06'),
    ('kanyshay-badretdinova', 'leyla-ilyasova', 'approved', '2026-11-02T16:59:19.811+06'),
    ('karakoz-bolotbekova', 'erkayym-ismatova', 'approved', '2026-11-02T18:34:18.046+06'),
    ('leyli-blagovisnaya', 'tatyana-andreevskaya', 'approved', '2026-11-03T10:05:44.894+06'),
    ('barno-tursunova', NULL, 'approved', '2026-11-03T10:06:04.029+06'),
    ('anastasiya-trofimushkina', 'gulmira-orozalieva', 'approved', '2026-11-03T12:52:18.276+06'),
    ('aziza-sultanalieva', 'leysan-ilyasova', 'approved', '2026-11-03T16:34:56.688+06')
       ) AS з(игрок, напарник, статус, подано)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363'
          AND r.player_id = з.игрок);

COMMIT;


-- ---- ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА ТАБЛИЦА ------------------------
-- Ждём: futures 8, masters 8, kartochek 7, gostey 1, bez_pary 1,
-- smeshannyh 0, poryadok_sovpal true.

WITH з AS (
  SELECT r.tournament_id AS т, r.player_id, r.partner_id, r.registered_at,
         row_number() OVER (PARTITION BY r.tournament_id ORDER BY r.queue_at) AS место
    FROM public.tournament_registrations r
   WHERE r.tournament_id IN ('eb6f50cd-4845-4943-b664-64c07e9dff81',
                             '6c6a7913-6b55-4af4-af9b-f0419ba69363')
)
SELECT (SELECT count(*) FROM з WHERE т = 'eb6f50cd-4845-4943-b664-64c07e9dff81') AS futures,
       (SELECT count(*) FROM з WHERE т = '6c6a7913-6b55-4af4-af9b-f0419ba69363') AS masters,
       (SELECT count(*) FROM public.players
         WHERE id IN ('svetlana-poharel','roza-berdieva','binazir-ulanbekova',
                      'leyla-ilyasova','leysan-ilyasova','erkayym-ismatova',
                      'aziza-sultanalieva'))                                     AS kartochek,
       (SELECT count(*) FROM public.players
         WHERE id IN ('svetlana-poharel','roza-berdieva','binazir-ulanbekova',
                      'leyla-ilyasova','leysan-ilyasova','erkayym-ismatova',
                      'aziza-sultanalieva') AND is_guest)                        AS gostey,
       (SELECT count(*) FROM з WHERE partner_id IS NULL)                         AS bez_pary,
       (SELECT count(*) FROM з
          JOIN public.players p1 ON p1.id = з.player_id
          JOIN public.players p2 ON p2.id = з.partner_id
         WHERE p1.gender <> p2.gender)                                           AS smeshannyh,
       (SELECT bool_and(ок) FROM (
          SELECT з.место = row_number() OVER (PARTITION BY з.т ORDER BY з.registered_at) AS ок
            FROM з) s)                                                           AS poryadok_sovpal;

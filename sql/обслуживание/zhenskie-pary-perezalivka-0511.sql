-- ЖЕНСКИЕ ПАРЫ — ПЕРЕЗАЛИВКА В ДВА ТУРНИРА. 05.11
--
-- Слово Кости 05.11: «можно те заявки, что есть в данном турнире,
-- удалить и вставить то, что в файле — это финальная версия», и
-- «ссылку дал на мастерс и фьючерс», то есть ОБА турнира.
--
--   FUTURES → eb6f50cd-4845-4943-b664-64c07e9dff81   (9 пар)
--   MASTERS → 6c6a7913-6b55-4af4-af9b-f0419ba69363   (9 пар)
--
-- НОВЫХ КАРТОЧЕК НЕ ЗАВОДИТСЯ НИ ОДНОЙ. Сверка 05.11
-- (`zayavki-sverka-imen-0511.sql`): 30 имён из 38 сошлись по ключу,
-- восемь сведены СЛОВОМ КОСТИ — «сводишь, как у нас в базе записаны».
-- Поэтому ниже всюду стоит написание ИЗ БАЗЫ, а не из формы:
--   Каныкей                        → Каныкей Турсунбаева
--   Зухра                          → Зухра Муралиева
--   Цурбан Наташа                  → Наталия Цурбан
--   Тайгуронова Калича             → Калича Тайгурова
--   Уланбекова Биназир Уланбековна → Биназир Уланбекова
--   Кани Бадретдинова              → Канышай Бадретдинова
--   Эркеайым Исаматова             → Эркайым Исматова (`erakyym-ismatova`)
--   Лейли Благовистная             → Лейли Благовисная
--
-- ПОЧЕМУ `erakyym-ismatova`, А НЕ `erkayym-ismatova`: 04.11 я завёл
-- вторую карточку при живой с 360 очками, её снесли, и в базе осталась
-- эта. Идентификатор взят ИЗ СВЕРКИ, то есть прочитан, а не вспомнен.
--
-- ─────────────────────────────────────────────────────────────────────
-- БЕДА В МОЕЙ ЖЕ ЗАЛИВКЕ 04.11, НАЙДЕННАЯ ЗДЕСЬ И ИСПРАВЛЕННАЯ.
--
-- Там `gender_confirmed` считался как `p1.gender <> p2.gender`. Формула
-- верна для МИКСТА (откуда и скопирована — `druzheskie-pary-1110`), но в
-- ЖЕНСКОМ турнире она даёт ровно обратное: обе women, значит `<>` ложно,
-- и все шестнадцать заявок легли «ждут решения по полу».
-- ОДНО ОПРЕДЕЛЕНИЕ ЖИВЁТ В КОДЕ (`составСошёлся`,
-- `js/admin/sections/bracket.js:2000`), и оно читает ПОЛ ТУРНИРА, а не
-- сравнивает пары между собой. Здесь теперь то же самое, и турнир
-- читается из базы, а не зашивается.
-- Перезаливка это чинит сама: старые строки сносятся.
-- ─────────────────────────────────────────────────────────────────────
--
-- Порядок пар внутри турнира — по строкам файла; время подачи из формы,
-- пояс Бишкека. Время растёт по строкам, значит порядок и время не
-- спорят, и `waitlisted_at` не нужен.
--
-- ЛИСТА ОЖИДАНИЯ ЗДЕСЬ НЕТ НАМЕРЕННО: в форме у пары
-- Айдай Орозбаева / Наталья Тимирбаева категория не указана, и в какой
-- из двух турниров она идёт — вопрос к Косте, а не ко мне.
-- Карточки у обеих есть, заводить ничего не придётся.
--
-- ГНАТЬ ПО ОДНОМУ, СВЕРХУ ВНИЗ. Последний запрос — проверка чтением.
--
--   sql/обслуживание/zhenskie-pary-perezalivka-0511.sql


-- ── 1. СЛЕПОК СТАРЫХ ЗАЯВОК — ДО ЕДИНОЙ ПРАВКИ ───────────────────────
-- Ждём: число строк, которое сейчас лежит в обоих турнирах.
DROP TABLE IF EXISTS public.slepok_zhenskie_zayavki_0511;

CREATE TABLE public.slepok_zhenskie_zayavki_0511 AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id IN ('eb6f50cd-4845-4943-b664-64c07e9dff81',
                         '6c6a7913-6b55-4af4-af9b-f0419ba69363');

SELECT tournament_id, count(*) AS zayavok,
       count(*) FILTER (WHERE gender_confirmed) AS pol_soshyolsya
  FROM public.slepok_zhenskie_zayavki_0511
 GROUP BY tournament_id;


-- ── 2. СНОС СТАРЫХ ЗАЯВОК ОБОИХ ТУРНИРОВ ─────────────────────────────
-- Сносятся ТОЛЬКО заявки и ТОЛЬКО этих двух турниров. Карточки игроков,
-- их очки и история не трогаются ничем.
DELETE FROM public.tournament_registrations
 WHERE tournament_id IN ('eb6f50cd-4845-4943-b664-64c07e9dff81',
                         '6c6a7913-6b55-4af4-af9b-f0419ba69363');


-- ── 3. ЗАЯВКИ FUTURES — 9 ПАР ────────────────────────────────────────
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT т.id, з.игрок, з.напарник, з.статус,
       /* СОСТАВ СОШЁЛСЯ — ПО ПОЛУ ТУРНИРА, А НЕ ПО РАЗНИЦЕ ПОЛОВ.
          Одно определение: `составСошёлся` в коде смотрит на `gender`
          турнира; здесь он читается из базы той же строкой. */
       CASE WHEN т.gender IN ('men', 'women') THEN
                 COALESCE(p1.gender = т.gender, true)
             AND COALESCE(p2.gender = т.gender, з.напарник IS NULL)
            WHEN т.format = 'mixed_doubles' THEN
                 COALESCE(p1.gender <> p2.gender, true)
            ELSE true
       END,
       з.подано::timestamptz
  FROM (VALUES
    ('kanykey-tursunbaeva',    'zuhra-muralieva',    'approved', '2026-11-02T14:22:36.885+06'),
    ('nataliya-tsurban',       'kalicha-taygurova',  'approved', '2026-11-02T14:23:36.992+06'),
    ('aysuluu-lenarova',       'aida-nogoybaeva',    'approved', '2026-11-02T14:36:51.298+06'),
    ('zarima-baygubatova',     'asel-ashimova',      'approved', '2026-11-02T14:49:26.113+06'),
    ('tolgonay-aytkulova',     'asel-orokova',       'approved', '2026-11-02T15:04:30.613+06'),
    ('nurzhamal-dzhanibekova', 'aliya-makeshova',    'approved', '2026-11-02T17:22:25.209+06'),
    ('alina-fasahutdinova',    'nuriza-momunova',    'approved', '2026-11-03T10:33:59.495+06'),
    ('roza-berdieva',          'binazir-ulanbekova', 'approved', '2026-11-03T18:06:52.889+06'),
    ('zulayka-talasbek-kyzy',  'valeriya-babenko',   'approved', '2026-11-04T15:38:30+06')
  ) AS з(игрок, напарник, статус, подано)
  CROSS JOIN public.tournaments т
  LEFT JOIN public.players p1 ON p1.id = з.игрок
  LEFT JOIN public.players p2 ON p2.id = з.напарник
 WHERE т.id = 'eb6f50cd-4845-4943-b664-64c07e9dff81';


-- ── 4. ЗАЯВКИ MASTERS — 9 ПАР ────────────────────────────────────────
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT т.id, з.игрок, з.напарник, з.статус,
       CASE WHEN т.gender IN ('men', 'women') THEN
                 COALESCE(p1.gender = т.gender, true)
             AND COALESCE(p2.gender = т.gender, з.напарник IS NULL)
            WHEN т.format = 'mixed_doubles' THEN
                 COALESCE(p1.gender <> p2.gender, true)
            ELSE true
       END,
       з.подано::timestamptz
  FROM (VALUES
    ('adel-dzhayloeva',          'anastasiya-adzhibekova', 'approved', '2026-11-02T14:32:39.189+06'),
    ('kalima-askarova',          'aziza-musaeva',          'approved', '2026-11-02T15:50:30.717+06'),
    ('kanyshay-badretdinova',    'leyla-ilyasova',         'approved', '2026-11-02T16:59:19.811+06'),
    ('karakoz-bolotbekova',      'erakyym-ismatova',       'approved', '2026-11-02T18:34:18.046+06'),
    ('leyli-blagovisnaya',       'tatyana-andreevskaya',   'approved', '2026-11-03T10:05:44.894+06'),
    ('barno-tursunova',          'roza-isabekova',         'approved', '2026-11-03T10:06:04.029+06'),
    ('anastasiya-trofimushkina', 'gulmira-orozalieva',     'approved', '2026-11-03T12:52:18.276+06'),
    ('aziza-sultanalieva',       'leysan-ilyasova',        'approved', '2026-11-03T16:34:56.688+06'),
    ('kseniya-han',              'valeriya-pak',           'approved', '2026-11-04T21:20:24+06')
  ) AS з(игрок, напарник, статус, подано)
  CROSS JOIN public.tournaments т
  LEFT JOIN public.players p1 ON p1.id = з.игрок
  LEFT JOIN public.players p2 ON p2.id = з.напарник
 WHERE т.id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';


-- ── 5. ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success» ─────────────────
-- Ждём: по 9 строк на турнир, у ВСЕХ `pol_soshyolsya` = 9, пустых
-- напарников 0, неизвестных карточек 0, порядок по времени подачи.
SELECT CASE r.tournament_id
         WHEN 'eb6f50cd-4845-4943-b664-64c07e9dff81' THEN 'FUTURES'
         ELSE 'MASTERS' END                                   AS turnir,
       row_number() OVER (PARTITION BY r.tournament_id ORDER BY r.registered_at) AS nom,
       COALESCE(p1.name, '??? ' || r.player_id)                AS igrok,
       COALESCE(p2.name, '??? ' || COALESCE(r.partner_id, '—')) AS naparnik,
       r.status,
       r.gender_confirmed                                      AS pol_soshyolsya,
       to_char(r.registered_at AT TIME ZONE 'Asia/Bishkek', 'DD.MM HH24:MI') AS podano
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id IN ('eb6f50cd-4845-4943-b664-64c07e9dff81',
                           '6c6a7913-6b55-4af4-af9b-f0419ba69363')
 ORDER BY turnir, nom;

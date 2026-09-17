-- ============================================================
-- Дружеский турнир в категории MASTERS: заявки из формы — ПРАВКА
-- ============================================================
--
-- 11 пар из формы клуба. Порядок заявок — как в выгрузке, по времени
-- подачи: он и решает, кто в составе, а кто в очереди.
--
-- Вместимость турнира — 12 пар, значит все 11 идут в состав, очередь
-- пустая.
--
-- Из 22 человек 19 нашлись в базе. Трое заводятся гостями:
--
--   Эракйым Исматова   — женщина, пара с Азаматом Джумабаевым
--   Айсулуу Ленарова   — женщина, пара с Эсендияром Адыловым
--                        (однофамилиц в базе нет: Чокоева, Эркулова и
--                         Орокова — другие люди)
--   Элдар Кульджаев    — мужчина, пара с Омурадилом Сыдыковым
--                        (в базе есть Руслан Кульджаев — это не он)
--
-- Три пары собраны из двоих мужчин, хотя турнир смешанный:
--
--   Фуркат Садыков   + Сардар Умаров
--   Хамит Каракетов  + Камиль Якупов
--   Омурадил Сыдыков + Элдар Кульджаев
--
-- Им ставим gender_confirmed = false: состав решает клуб, а не система.
-- В админке такая заявка попросит решения.
--
-- Запускать можно повторно: заявки не задвоятся.

BEGIN;

-- ---- Гости ----

INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('erakyym-ismatova',  'Эракйым Исматова', '🇰🇬', 'masters', 'women', false, true, false),
    ('aysuluu-lenarova',  'Айсулуу Ленарова', '🇰🇬', 'masters', 'women', false, true, false),
    ('eldar-kuldzhaev',   'Элдар Кульджаев',  '🇰🇬', 'masters', 'men',   false, true, false)
ON CONFLICT (id) DO NOTHING;

-- ---- Заявки ----
--
-- gender_confirmed: true у смешанных пар, false там, где состав требует
-- решения клуба

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, gender_confirmed, registered_at)
SELECT '153bc688-41c3-475a-9b5f-31f2cca1c5c6', з.игрок, з.напарник, 'approved', з.пол_сошёлся, з.подано
  FROM (VALUES
    ('iskender-seydimatov',      'nelli-buyuklyanova',       true,  '2026-09-14 09:39:00+06'::timestamptz),
    ('azim-isakov',              'anastasiya-trofimushkina', true,  '2026-09-14 10:31:00+06'),
    ('narmina-ahmatova',         'atham-israilov',           true,  '2026-09-14 11:23:00+06'),
    ('maksim-serko',             'gulsan-galieva',           true,  '2026-09-14 19:22:00+06'),
    ('ruslan-kuldzhaev',         'darya-zinina',             true,  '2026-09-17 11:32:00+06'),
    ('ildiyar-murataliev',       'meerim-zhumabekova',       true,  '2026-09-17 17:24:00+06'),
    ('furkat-sadykov',           'sardar-umarov',            false, '2026-09-18 12:24:00+06'),
    ('erakyym-ismatova',         'azamat-dzhumabaev',        true,  '2026-09-18 14:00:00+06'),
    ('hamit-karaketov',          'kamil-yakupov',            false, '2026-09-19 13:18:00+06'),
    ('esendiyar-adylov',         'aysuluu-lenarova',         true,  '2026-09-19 16:42:00+06'),
    ('omuradil-sydykov',         'eldar-kuldzhaev',          false, '2026-09-19 17:46:00+06')
  ) AS з(игрок, напарник, пол_сошёлся, подано)
 WHERE NOT EXISTS (
     SELECT 1 FROM public.tournament_registrations r
      WHERE r.tournament_id = '153bc688-41c3-475a-9b5f-31f2cca1c5c6'
        AND r.player_id = з.игрок
 );

COMMIT;

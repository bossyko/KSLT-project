-- ============================================================
-- MASTERS женский одиночный, 10 октября: заявки из формы — ПРАВКА
-- Турнир 5b5e2260-8a6c-4a52-8f8f-7a63872a0951, мест 24, круговая, 6 групп
-- ============================================================
--
-- Из формы 23 строки: 22 чёрных (состав) и 1 КРАСНАЯ (лист ожидания).
--
-- Сверка с базой: совпало точно 20 из 23.
--
-- ДВЕ СТРОКИ СВЕДЕНЫ СО СЛОВА КОСТИ, а не прибором:
--   «Тайгуронова Калича»  -> kalicha-taygurova  (похожесть 0.89, в базе «Тайгурова»)
--   «Эркеайым Исаматова»  -> erakyym-ismatova   (похожесть 0.89, в базе «Эркайым Исматова»)
--
-- ОДНА КАРТОЧКА ЗАВОДИТСЯ: Хан Ксения. В форме «нет членства в КСЛТ», но
-- слово Кости 07.10: «там не гостей, все члены КСЛТ». is_guest = false —
-- и ТОЛЬКО ЭТО пускает человека в рейтинг (js/kslt-rules.js:888).
--
-- «Barno Tursunova» написана латиницей и в базе есть кириллицей —
-- barno-tursunova «Барно Турсунова». Сведена ключом, а не словом:
-- латиница переводится в кириллицу перед сравнением.
--
-- Запускать можно повторно: заявки не задвоятся.

BEGIN;

-- ---- Карточка ----

INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('kseniya-han', 'Ксения Хан', '🇰🇬', 'masters', 'women', true, false, false)
ON CONFLICT (id) DO NOTHING;

-- ---- Заявки ----

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, status, registered_at)
SELECT '5b5e2260-8a6c-4a52-8f8f-7a63872a0951', з.игрок, з.статус, з.подано::timestamptz
  FROM (VALUES
    -- состав
    ('ayday-orozbaeva',          'approved', '2026-10-01 11:47:50+06'),
    ('karakoz-bolotbekova',      'approved', '2026-10-01 11:57:35+06'),
    ('valeriya-pak',             'approved', '2026-10-01 13:10:43+06'),
    ('nataliya-tsurban',         'approved', '2026-10-01 14:42:40+06'),
    ('marianna-proskurina',      'approved', '2026-10-01 15:16:13+06'),
    ('anastasiya-adzhibekova',   'approved', '2026-10-01 15:18:39+06'),
    ('kalicha-taygurova',        'approved', '2026-10-01 16:17:33+06'),
    ('darya-zinina',             'approved', '2026-10-01 17:10:03+06'),
    ('amina-kurbanova',          'approved', '2026-10-01 17:14:02+06'),
    ('larisa-safronova',         'approved', '2026-10-02 13:24:28+06'),
    ('erakyym-ismatova',         'approved', '2026-10-03 10:56:32+06'),
    ('eliza-omurzakova',         'approved', '2026-10-03 11:13:37+06'),
    ('anayat-abithanova',        'approved', '2026-10-03 14:33:55+06'),
    ('elena-kan',                'approved', '2026-10-03 22:15:20+06'),
    ('tat-yana-nechaeva',        'approved', '2026-10-03 23:11:12+06'),
    ('asel-isabekova',           'approved', '2026-10-04 12:29:28+06'),
    ('anastasiya-trofimushkina', 'approved', '2026-10-04 16:04:27+06'),
    ('liliya-rahmatulina',       'approved', '2026-10-05 09:37:58+06'),
    ('kalima-askarova',          'approved', '2026-10-06 11:54:21+06'),
    ('nazgul-kerimalieva',       'approved', '2026-10-06 13:45:12+06'),
    ('gulmira-orozalieva',       'approved', '2026-10-06 21:35:12+06'),
    ('barno-tursunova',          'approved', '2026-10-07 10:26:37+06'),
    -- лист ожидания (красная в форме)
    ('kseniya-han',              'waitlist', '2026-10-02 14:58:30+06')
  ) AS з(игрок, статус, подано)
 WHERE NOT EXISTS (
     SELECT 1 FROM public.tournament_registrations r
      WHERE r.tournament_id = '5b5e2260-8a6c-4a52-8f8f-7a63872a0951'
        AND r.player_id = з.игрок
 );

COMMIT;

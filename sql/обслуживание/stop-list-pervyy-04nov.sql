-- ПЕРВЫЙ СТОП-ЛИСТ (04.11). Apple 1.2, требование «фильтр до публикации».
--
-- ГДЕ ОН РАБОТАЕТ — померено чтением, четыре таблицы и семь полей
-- (`sql/схема/apple-1-2-zhaloby-blokirovki.sql:149`):
--   profiles.full_name · players.name, bio, bio_en, bio_kg ·
--   challenges.battle_title · tournament_registrations.partner_external_name
-- Переписки в продукте НЕТ, и фильтр не про неё: общение идёт в Телеграме
-- и на почте, вне платформы. Apple требует фильтровать то, что
-- ПУБЛИКУЕТСЯ внутри — имя, «о себе», название баттла, имя напарника.
-- Поэтому список короткий и узкий, а не словарь.
--
-- КАК СРАВНИВАЕТСЯ: `word` подставляется в регулярное выражение с
-- границами слова, поэтому «сукно» не падает из-за «сук»
-- (`kslt_tekst_chist`). Значит в `word` можно класть корень с хвостом
-- `[а-яё]*` — одно правило вместо двадцати форм.
-- ВЕРХНЕГО `|` В СЛОВЕ БЫТЬ НЕ ДОЛЖНО: он разорвал бы выражение снаружи.
-- Нужна развилка — только в скобках.
--
-- КЫРГЫЗСКИЙ ЗДЕСЬ ПУСТ, И ЭТО НАЗВАННЫЙ ДОЛГ, А НЕ ДЫРА. Слово Кости
-- 04.11: он этих слов не знает. Фильтр работает с первого дня на русском
-- и английском; кыргызские слова дописываются в эту же таблицу одной
-- строкой, без правки кода.
--
-- ЗАПУСКАТЬ МОЖНО ПОВТОРНО.

BEGIN;

INSERT INTO public.banned_words (word) VALUES
    -- русские корни, с хвостом на любые формы
    ('ху[еёийя][а-яё]*'),
    ('пизд[а-яё]*'),
    ('ебл?[а-яё]*'),
    ('[её]б[аиуы][а-яё]*'),
    ('бл[яa]д?[а-яё]*'),
    ('муд[аио][а-яё]*'),
    ('сволоч[а-яё]*'),
    ('ублюд[ока][а-яё]*'),
    ('гнид[а-яё]*'),
    ('дебил[а-яё]*'),
    ('даун[а-яё]*'),
    ('урод[а-яё]*'),
    ('тварь'),
    ('твар[еи][а-яё]*'),
    ('шлюх[а-яё]*'),
    ('шалав[а-яё]*'),
    ('пидор[а-яё]*'),
    ('пидар[а-яё]*'),
    ('гомик[а-яё]*'),
    ('ничтожеств[а-яё]*'),
    ('придур[ока][а-яё]*'),
    ('скотин[а-яё]*'),
    ('падл[а-яё]*'),
    ('мраз[ьи][а-яё]*'),
    ('чмо'),
    -- английские
    ('fuck[a-z]*'),
    ('shit[a-z]*'),
    ('bitch[a-z]*'),
    ('cunt[a-z]*'),
    ('asshole[a-z]*'),
    ('bastard[a-z]*'),
    ('dickhead[a-z]*'),
    ('motherfucker[a-z]*'),
    ('retard[a-z]*'),
    ('faggot[a-z]*'),
    ('whore[a-z]*'),
    ('slut[a-z]*'),
    ('nigger[a-z]*'),
    ('scumbag[a-z]*')
ON CONFLICT (word) DO NOTHING;

COMMIT;


-- ---- ПРОВЕРКА 1: НИ ОДИН ЖИВОЙ ЧЕЛОВЕК НЕ ЗАБРАКОВАН -------------
--
-- ГЛАВНАЯ ПРОВЕРКА, И ОНА ВАЖНЕЕ САМОГО СПИСКА. Слово, которое валит
-- настоящую фамилию, будет снято целиком — вместе с ним уйдёт и
-- настоящая защита, потому что админ выключит фильтр, а не слово.
-- ЖДЁМ НОЛЬ СТРОК. Если строки есть — прислать их, уберу это слово.

SELECT 'players.name' AS gde, p.id, p.name AS tekst
  FROM public.players p
 WHERE NOT public.kslt_tekst_chist(p.name)
UNION ALL
SELECT 'players.bio', p.id, p.bio
  FROM public.players p
 WHERE p.bio IS NOT NULL AND NOT public.kslt_tekst_chist(p.bio)
UNION ALL
SELECT 'players.bio_en', p.id, p.bio_en
  FROM public.players p
 WHERE p.bio_en IS NOT NULL AND NOT public.kslt_tekst_chist(p.bio_en)
UNION ALL
SELECT 'players.bio_kg', p.id, p.bio_kg
  FROM public.players p
 WHERE p.bio_kg IS NOT NULL AND NOT public.kslt_tekst_chist(p.bio_kg)
UNION ALL
SELECT 'profiles.full_name', pr.id::text, pr.full_name
  FROM public.profiles pr
 WHERE pr.full_name IS NOT NULL AND NOT public.kslt_tekst_chist(pr.full_name)
UNION ALL
SELECT 'challenges.battle_title', c.id::text, c.battle_title
  FROM public.challenges c
 WHERE c.battle_title IS NOT NULL AND NOT public.kslt_tekst_chist(c.battle_title)
UNION ALL
SELECT 'regs.partner_external_name', r.id::text, r.partner_external_name
  FROM public.tournament_registrations r
 WHERE r.partner_external_name IS NOT NULL
   AND NOT public.kslt_tekst_chist(r.partner_external_name)
 ORDER BY 1, 3;


-- ---- ПРОВЕРКА 2: ФИЛЬТР ВООБЩЕ РАБОТАЕТ --------------------------
--
-- ПУСТОЕ ПРАВИЛО ХУЖЕ ОТСУТСТВУЮЩЕГО: «ноль забракованных» выше ничего
-- не значит, если фильтр молчит на всём подряд. Образец различает.
-- Ждём: slov > 0, lovit = false, propuskaet = true, granica = true.

SELECT (SELECT count(*) FROM public.banned_words)        AS slov,
       public.kslt_tekst_chist('ты придурок')            AS lovit,
       public.kslt_tekst_chist('Эрмек Абакиров')         AS propuskaet,
       public.kslt_tekst_chist('сукно и ракетка')        AS granica;

-- КЫРГЫЗСКИЙ СТОП-ЛИСТ, ПЕРВЫЙ ЗАХОД. 04.11
--
-- ЧЕСТНО О ПРОИСХОЖДЕНИИ, И ЭТО ВАЖНЕЕ САМОГО СПИСКА: Я НЕ НОСИТЕЛЬ.
-- Костя 04.11: «не знаю, напиши что-нибудь, какие у тебя есть». Значит
-- это ПРЕДПОЛОЖЕНИЕ, а не знание, и список нужно показать человеку,
-- который язык знает. До тех пор он работает, но считается черновым.
--
-- ПОЭТОМУ ОСТОРОЖНО, А НЕ ШИРОКО:
--   · только явные бранные корни, не короче пяти букв;
--   · короткие слова («ит», «ам», «ээ») НЕ БЕРУ вовсе — они встретятся
--     внутри имён и фамилий, и первое же ложное срабатывание заставит
--     админа выключить ВЕСЬ фильтр, а не одну строку;
--   · хвост `[а-яёөүң]*` учитывает кыргызские буквы ө, ү, ң — без них
--     формы слова прошли бы мимо.
--
-- ПРОВЕРКА ВНИЗУ ВАЖНЕЕ СПИСКА. Если хоть одно живое имя забраковано —
-- слово снимается, а не оставляется «на всякий случай».
--
-- ЗАПУСКАТЬ МОЖНО ПОВТОРНО.

BEGIN;

INSERT INTO public.banned_words (word) VALUES
    ('жалап[а-яёөүң]*'),
    ('канчык[а-яёөүң]*'),
    ('көтөк[а-яёөүң]*'),
    ('көтөн[а-яёөүң]*'),
    ('акмак[а-яёөүң]*'),
    ('келесоо[а-яёөүң]*'),
    ('макоо[а-яёөүң]*'),
    ('оңбогон[а-яёөүң]*'),
    ('сасык[а-яёөүң]*'),
    ('баңги[а-яёөүң]*'),
    ('жинди[а-яёөүң]*'),
    ('шылуун[а-яёөүң]*')
ON CONFLICT (word) DO NOTHING;

COMMIT;


-- ---- ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА ТАБЛИЦА ------------------------
-- Ждём: zabrakovano = 0 и slov = 51 (39 русских и английских + 12
-- кыргызских). Если zabrakovano больше нуля — присылай `kogo`, уберу
-- это слово: оно валит живого человека, и это опаснее его отсутствия.

WITH плохие AS (
    SELECT p.name AS tekst FROM public.players p
     WHERE NOT public.kslt_tekst_chist(p.name)
    UNION ALL
    SELECT p.bio FROM public.players p
     WHERE p.bio IS NOT NULL AND NOT public.kslt_tekst_chist(p.bio)
    UNION ALL
    SELECT p.bio_kg FROM public.players p
     WHERE p.bio_kg IS NOT NULL AND NOT public.kslt_tekst_chist(p.bio_kg)
    UNION ALL
    SELECT pr.full_name FROM public.profiles pr
     WHERE pr.full_name IS NOT NULL AND NOT public.kslt_tekst_chist(pr.full_name)
    UNION ALL
    SELECT c.battle_title FROM public.challenges c
     WHERE c.battle_title IS NOT NULL AND NOT public.kslt_tekst_chist(c.battle_title)
    UNION ALL
    SELECT r.partner_external_name FROM public.tournament_registrations r
     WHERE r.partner_external_name IS NOT NULL
       AND NOT public.kslt_tekst_chist(r.partner_external_name)
)
SELECT (SELECT count(*) FROM public.banned_words)              AS slov,
       (SELECT count(*) FROM плохие)                           AS zabrakovano,
       (SELECT string_agg(tekst, ' · ') FROM плохие)            AS kogo,
       public.kslt_tekst_chist('Эркайым Исматова')             AS propuskaet_imya,
       public.kslt_tekst_chist('Жалал-Абад шаары')             AS propuskaet_gorod;

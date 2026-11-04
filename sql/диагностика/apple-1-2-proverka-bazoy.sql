-- ПРОВЕРКА БАЗОЙ: встал ли кусок 1.2 целиком (04.11).
--
-- РЕЗУЛЬТАТ ЗАПРОСА ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success».
-- Эти три запроса ничего не меняют: только читают каталог и права.
-- Гнать по одному, присылать таблицы.
--
--   sql/диагностика/apple-1-2-proverka-bazoy.sql


-- ── 1. ВСТАЛО ЛИ ТО, ЧТО ДОЛЖНО СТОЯТЬ ───────────────────────────────────
-- Ждём: stolbcov_profiles = 2, stolbcov_players = 2, funkcij = 11,
--       bany_vse_definer = true.
SELECT
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'profiles'
       AND column_name IN ('banned_by', 'banned_at'))        AS stolbcov_profiles,
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'players'
       AND column_name IN ('banned_by', 'banned_at'))        AS stolbcov_players,
  (SELECT count(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('kslt_pozhalovatsya', 'kslt_zablokirovat',
                        'kslt_razblokirovat', 'kslt_est_blokirovka',
                        'kslt_zablokirovan_li', 'kslt_moi_blokirovki',
                        'kslt_zhaloby', 'kslt_razobrat_zhalobu',
                        'kslt_blokirovki_vse', 'kslt_skolko_zablokirovali',
                        'kslt_bany_vse'))                     AS funkcij,
  (SELECT p.prosecdef FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'kslt_bany_vse')
                                                              AS bany_vse_definer;


-- ── 2. ПРАВА: АНОНИМУ НЕЛЬЗЯ НИ ОДНОЙ ────────────────────────────────────
-- Ждём: у ВСЕХ одиннадцати anon = false, authenticated = true.
-- 03.11 здесь была настоящая дыра: `REVOKE ALL ... FROM public` не снимает
-- прямой грант роли `anon`, который ставит supabase-овский
-- `ALTER DEFAULT PRIVILEGES`, и `kslt_est_blokirovka` отвечала анониму про
-- любую пару. Правило проверяется ПОИМЁННО, а не «вроде отозвали».
SELECT p.proname AS funkciya,
       has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('kslt_pozhalovatsya', 'kslt_zablokirovat',
                     'kslt_razblokirovat', 'kslt_est_blokirovka',
                     'kslt_zablokirovan_li', 'kslt_moi_blokirovki',
                     'kslt_zhaloby', 'kslt_razobrat_zhalobu',
                     'kslt_blokirovki_vse', 'kslt_skolko_zablokirovali',
                     'kslt_bany_vse')
 ORDER BY p.proname;


-- ── 3. ЧТО ФУНКЦИЯ ОТДАЁТ НА САМОМ ДЕЛЕ ──────────────────────────────────
-- Ждём: ошибки нет; в `vidy` — только `uchyotka` и `kartochka`; `banov`
-- равно числу живых банов. Пустой список — ТОЖЕ ответ: значит банов нет,
-- а не значит, что функция сломана (это видно по `error`).
WITH о AS (SELECT public.kslt_bany_vse() AS v)
SELECT (SELECT v->>'error' FROM о)                          AS error,
       jsonb_typeof((SELECT v FROM о))                      AS tip_otveta,
       jsonb_array_length((SELECT v FROM о))                AS banov,
       (SELECT string_agg(DISTINCT э->>'vid', ', ')
          FROM о, jsonb_array_elements((SELECT v FROM о)) э) AS vidy;

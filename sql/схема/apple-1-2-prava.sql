-- ============================================================================
-- КСЛТ · Apple 1.2 — ПОЧИНКА ПРАВ: `anon` не зовёт наши функции
-- 04.11.2026. Прогонять ПОСЛЕ трёх предыдущих файлов. Повторно — можно.
-- ============================================================================
--
-- ЧТО СЛУЧИЛОСЬ. В трёх файлах стояло `REVOKE ALL ... FROM public` плюс
-- `GRANT ... TO authenticated`, и я считал, что этого довольно. ЗАМЕР
-- КОСТИ 04.11 ПОКАЗАЛ `anon = true` У ВСЕХ ЧЕТЫРНАДЦАТИ ФУНКЦИЙ.
--
-- ПОЧЕМУ. В Supabase на схеме `public` стоят `ALTER DEFAULT PRIVILEGES`,
-- которые дают `EXECUTE` на КАЖДУЮ НОВУЮ функцию ролям `anon` и
-- `authenticated`. Это ПРЯМОЙ грант роли, а `REVOKE FROM public` снимает
-- права псевдо-роли PUBLIC — другую вещь с похожим именем. Воспроизведено
-- на пустом PostgreSQL 16: стоит добавить те же DEFAULT PRIVILEGES — и
-- дыра появляется, убрать — исчезает.
--
-- ПРАВИЛО В КОПИЛКУ: СНЯТЬ ПРАВА У PUBLIC — НЕ ЗНАЧИТ СНЯТЬ ИХ У РОЛИ.
-- Проверяется только `has_function_privilege`, а не чтением своего же
-- `REVOKE`.
--
-- ЧЕМ ЭТО ГРОЗИЛО. Внутри почти каждой функции стоит своя проверка
-- (`auth.uid() IS NULL` → `not_logged_in`, `is_staff()` → `forbidden`),
-- поэтому аноним не записал бы ни жалобы, ни блокировки. Но одна
-- функция отвечала БЕЗ проверки вызывающего — `kslt_est_blokirovka(a, b)`
-- принимает два uuid и говорит, есть ли между ними блокировка. Для
-- анонима это утечка: перебирая пары, можно собрать всю картину, кто с
-- кем в ссоре. ЗАЩИТА ВНУТРИ ФУНКЦИИ НЕ ОТМЕНЯЕТ ПРАВ НА ЕЁ ЗОВ.

BEGIN;

-- ── 1. СНЯТЬ У `anon` И У PUBLIC — У ВСЕХ НАШИХ ФУНКЦИЙ СРАЗУ ────────────
-- Перечислять руками нельзя: список растёт, а забытая строка — это та
-- самая, что потом и окажется открытой. Идём по каталогу.
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN
        SELECT p.oid::regprocedure AS подпись
          FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.prokind = 'f'
           AND p.proname LIKE 'kslt\_%'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.подпись);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f.подпись);
        /* И У `authenticated` ТОЖЕ. Тот же DEFAULT PRIVILEGES дал право
           и ему, поэтому без этой строки функции, про которые ниже
           написано «не возвращаем никому», остаются зовомыми вошедшим.
           Поймано прогоном 04.11: файл говорил одно, база делала другое. */
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f.подпись);
    END LOOP;
END $$;

-- ── 2. ВЕРНУТЬ ТО, ЧТО НУЖНО ВОШЕДШЕМУ ───────────────────────────────────
-- ПЕРЕЧИСЛЕНО ПОИМЁННО, А НЕ ЦИКЛОМ: право звать — это решение про каждую
-- функцию отдельно, и список, собранный маской, однажды подберёт лишнюю.
GRANT EXECUTE ON FUNCTION public.kslt_pozhalovatsya(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_zablokirovat(text)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_razblokirovat(text)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_zablokirovan_li(text)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_moi_blokirovki()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_zhaloby(text)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_razobrat_zhalobu(uuid, text)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_blokirovki_vse()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.kslt_skolko_zablokirovali(text)            TO authenticated;

-- Проверка текста перед отправкой — её зовёт приложение, чтобы сказать
-- человеку о стоп-слове ДО нажатия. Настоящий заслон стоит триггером.
GRANT EXECUTE ON FUNCTION public.kslt_tekst_chist(text) TO authenticated;

-- ── 3. ЧЕГО НЕ ВОЗВРАЩАЕМ НИКОМУ, И ЭТО РЕШЕНИЕ ──────────────────────────
--   · `kslt_est_blokirovka(uuid, uuid)` — отвечает про ЛЮБУЮ пару людей,
--     не спрашивая, кто пришёл. Её зовут только наши же функции и
--     триггеры, а они работают от владельца: права зовущему не нужны.
--   · `kslt_vyzov_ne_zablokirovan()`, `kslt_priglashenie_ne_zablokirovano()`
--     — триггерные. Их вызывает база, а не человек.
--   · `kslt_proverit_tekst()` — триггерная, из первой миграции.
-- Они остаются без EXECUTE у обеих ролей: снято циклом выше и не возвращено.

COMMIT;

-- ============================================================================
-- ПРОВЕРКА ЧТЕНИЕМ. Скопировать и выполнить — раскомментировать не надо.
--
-- Ждём: `anon = false` У ВСЕХ строк без исключения, а `auth = true` —
-- у девяти, зовомых приложением, плюс `kslt_tekst_chist`.
-- У четырёх триггерных и у `kslt_est_blokirovka` обе колонки false.
--
--   SELECT p.proname,
--          has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth
--     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--    WHERE n.nspname = 'public' AND p.proname LIKE 'kslt\_%'
--    ORDER BY anon DESC, 1;

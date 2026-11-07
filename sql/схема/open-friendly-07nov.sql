-- КАТЕГОРИЯ «OPEN FRIENDLY» И ПРИЗНАК БЕЗ РЕЙТИНГА КАК СВОЙСТВО ДАННЫХ
-- (07.11.2026, слово Кости: «завести категорию Open Friendly, без
-- проверок и ограничений, без начисления очков»)
--
-- ЧТО БЫЛО, ИЗМЕРЕНО ЧТЕНИЕМ 07.11:
--   • признак «дружеский турнир» держался на ЗАШИТОМ СЛОВЕ `'friendly'` —
--     33 живых места в `js/`, `mobile/www/js/` и серверной функции заявок,
--     плюс СЕМЬ мест внутри `recalc_player_categories`;
--   • столбца `categories.is_rating` в базе НЕТ ВОВСЕ. Файл
--     `sql/схема/categories-is-rating.sql` написан, но не прогнан: снимок
--     схемы от 07.11 показывает у `categories` восемь столбцов без него.
--     Код при этом его уже читает (`js/rankings-data.js`,
--     `mobile/www/js/screens/rating.js`) и всегда получает `undefined` —
--     то есть работает один запасной литерал. ПОЛЕ, КОТОРОЕ ЧИТАЮТ, НО НЕ
--     ЗАВЕЛИ, — ЭТО МОЛЧАЛИВОЕ «НЕТ» НА КАЖДЫЙ ВОПРОС.
--
-- ЧЕМ ЭТО ГРОЗИЛО ЗАДАНИЮ. Заведи мы вторую дружескую категорию при таком
-- устройстве — она стала бы для всего продукта РЕЙТИНГОВОЙ: включились бы
-- отказ по полу, проверка разряда и NTRP при заявке, турнир пошёл бы в
-- таблицы и начислил очки. Ровно обратное тому, зачем категорию заводят.
--
-- ЧТО ДЕЛАЕТ ЭТОТ ФАЙЛ:
--   1. заводит столбец `categories.is_rating` (если его ещё нет);
--   2. ставит `is_rating = false` действующей категории `friendly` —
--      чтобы данные сказали то, что до сих пор говорил код;
--   3. заводит категорию `open-friendly`;
--   4. заводит ОДНО ОПРЕДЕЛЕНИЕ признака в базе —
--      `public.нерейтинговая_категория(text)`;
--   5. переписывает `recalc_player_categories`: семь литералов `'friendly'`
--      заменены зовом этого определения.
--
-- ЗАПРОС ТРОГАЕТ ДАННЫЕ (новая строка в `categories`, правка одной
-- существующей). Согласие Кости получено 07.11.

BEGIN;

-- ----------------------------------------------------------------------
-- 1. СТОЛБЕЦ ПРИЗНАКА
-- ----------------------------------------------------------------------
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS is_rating boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.categories.is_rating IS
'Идут ли турниры этой категории в рейтинг. false — очки не начисляются, проверки пола и разряда при заявке не применяются, категория не показывается в таблицах рейтинга.';

-- ----------------------------------------------------------------------
-- 2. ДЕЙСТВУЮЩАЯ ДРУЖЕСКАЯ КАТЕГОРИЯ — ПРИЗНАК В ДАННЫЕ
--
-- До сих пор это знал только код. Теперь знают данные, и код спрашивает их.
-- ----------------------------------------------------------------------
UPDATE public.categories SET is_rating = false WHERE id = 'friendly';

-- ----------------------------------------------------------------------
-- 3. НОВАЯ КАТЕГОРИЯ «OPEN FRIENDLY»
--
-- ПОЛА У КАТЕГОРИИ НЕТ НАРОЧНО (`gender` пуст): слово Кости — «тут можно
-- будет ПОЛ убрать, так как без разницы кто, там все играют». У турнира
-- столбец `gender` обязателен (NOT NULL, CHECK men/women/mixed), поэтому
-- админка подставит ему `mixed` и само поле прячет.
--
-- `sort_order` = 0: в витрине вкладки идут по убыванию, значит категория
-- встанет рядом с «Friendly Weekend», в конце. Порядок правится в админке,
-- если захочется иначе.
-- ----------------------------------------------------------------------
INSERT INTO public.categories (id, name, name_en, name_kg, gender, sort_order, is_rating)
VALUES ('open-friendly', 'Open Friendly', 'Open Friendly', 'Open Friendly', NULL, 0, false)
ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        name_kg = EXCLUDED.name_kg,
        is_rating = EXCLUDED.is_rating;

-- ----------------------------------------------------------------------
-- 4. ОДНО ОПРЕДЕЛЕНИЕ ПРИЗНАКА ДЛЯ БАЗЫ
--
-- `is_rating IS NULL` считается рейтинговой: пустое значение у старой
-- строки значит «как раньше», а не «без очков».
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public."нерейтинговая_категория"(ид text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    SELECT COALESCE((SELECT c.is_rating = false FROM public.categories c WHERE c.id = ид), false);
$$;

COMMENT ON FUNCTION public."нерейтинговая_категория"(text) IS
'Один ответ на весь продукт: идут ли турниры этой категории в рейтинг. Читается из categories.is_rating, а не из списка имён в коде.';

-- ----------------------------------------------------------------------
-- 5. ПЕРЕСЧЁТ РАЗРЯДОВ — БЕЗ ЗАШИТОГО СЛОВА
--
-- Тело взято из снимка схемы от 07.11 и изменено ТОЛЬКО в семи местах:
-- `<> 'friendly'` → `NOT нерейтинговая_категория(...)`. Остальное — знак
-- в знак прежнее: эта функция считает очки, победы, поражения и форму, и
-- переписывать её «заодно» нельзя.
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_player_categories(p_ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
    DECLARE
      oldest_date DATE;
      cur_year INT;
    BEGIN
      cur_year := EXTRACT(YEAR FROM NOW());
      IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
        oldest_date := make_date(cur_year - 1, 9, 1);
      ELSE
        oldest_date := make_date(cur_year - 2, 9, 1);
      END IF;

      -- Убираем то, чего в истории больше нет. Закрытые не трогаем: строка
      -- нужна, чтобы запрет на заявки не исчез вместе с ней
      DELETE FROM player_categories pc
      WHERE pc.player_id = ANY(p_ids)
        AND pc.closed_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM rating_history rh
            WHERE rh.player_id = pc.player_id AND rh.category_id = pc.category_id
              AND NOT public."нерейтинговая_категория"(rh.category_id)
              AND (rh.is_doubles IS NOT TRUE) AND rh.recorded_at >= oldest_date
            GROUP BY rh.player_id, rh.category_id
            HAVING SUM(rh.points_earned) > 0);

      -- Заводим новые и обновляем очки у существующих. Признак закрытия
      -- лежит в других колонках и остаётся нетронутым
      INSERT INTO player_categories (player_id, category_id, points, updated_at)
      SELECT rh.player_id, rh.category_id, SUM(rh.points_earned), now()
      FROM rating_history rh
      WHERE rh.player_id = ANY(p_ids)
        AND rh.category_id IS NOT NULL
        AND NOT public."нерейтинговая_категория"(rh.category_id)
        AND (rh.is_doubles IS NOT TRUE)
        AND rh.recorded_at >= oldest_date
      GROUP BY rh.player_id, rh.category_id
      HAVING SUM(rh.points_earned) > 0
      ON CONFLICT (player_id, category_id) DO UPDATE
        SET points = EXCLUDED.points, updated_at = now();

      -- Очки закрытой категории, выпавшей из сезона, обнуляем: в зачёт они
      -- больше не идут, но сама строка остаётся
      UPDATE player_categories pc
      SET points = 0, updated_at = now()
      WHERE pc.player_id = ANY(p_ids)
        AND pc.closed_at IS NOT NULL
        AND pc.points <> 0
        AND NOT EXISTS (
            SELECT 1 FROM rating_history rh
            WHERE rh.player_id = pc.player_id AND rh.category_id = pc.category_id
              AND NOT public."нерейтинговая_категория"(rh.category_id)
              AND (rh.is_doubles IS NOT TRUE) AND rh.recorded_at >= oldest_date
            GROUP BY rh.player_id, rh.category_id
            HAVING SUM(rh.points_earned) > 0);

      -- Победы и поражения в одиночных турнирах этой категории
      UPDATE player_categories pc
      SET wins = COALESCE(st.w, 0), losses = COALESCE(st.l, 0)
      FROM (
        SELECT pl.id AS player_id, t.category_id,
               count(*) FILTER (WHERE m.winner_id = pl.id) AS w,
               count(*) FILTER (WHERE m.winner_id IS NOT NULL AND m.winner_id <> pl.id) AS l
        FROM players pl
        JOIN matches m ON (m.player1_id = pl.id OR m.player2_id = pl.id)
        JOIN tournaments t ON t.id = m.tournament_id
        WHERE pl.id = ANY(p_ids)
          AND t.category_id IS NOT NULL
          AND NOT public."нерейтинговая_категория"(t.category_id)
          AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
        GROUP BY pl.id, t.category_id
      ) st
      WHERE pc.player_id = st.player_id AND pc.category_id = st.category_id;

      -- Общий счёт игрока по всем турнирам. Это то, что видно на публичной
      -- странице: «Всего матчей» и «% побед». Баттлы сюда не входят —
      -- у них нет tournament_id.
      --
      -- Считаем подзапросом на каждого игрока, а не соединением: при
      -- соединении игрок, у которого ВСЕ матчи нетурнирные, выпадал из
      -- выборки целиком и оставался со старыми, накрученными числами
      -- вместо нуля.
      UPDATE players p
      SET wins = (
            SELECT count(*) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            WHERE m.winner_id = p.id
              AND (m.player1_id = p.id OR m.player2_id = p.id)
              AND COALESCE(m.score, '') <> 'BYE'
              AND NOT public."нерейтинговая_категория"(COALESCE(t.category_id, ''))
              AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')),
          losses = (
            SELECT count(*) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            WHERE m.winner_id IS NOT NULL AND m.winner_id <> p.id
              AND (m.player1_id = p.id OR m.player2_id = p.id)
              AND COALESCE(m.score, '') <> 'BYE'
              AND NOT public."нерейтинговая_категория"(COALESCE(t.category_id, ''))
              AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles'))
      WHERE p.id = ANY(p_ids);

      -- Форма — последние пять рейтинговых одиночных встреч, свежая первой
      UPDATE players p
      SET form = COALESCE(f.form, '{}'::text[])
      FROM (
        SELECT pl.id AS player_id,
               ARRAY(
                 SELECT CASE WHEN m.winner_id = pl.id THEN 'W' ELSE 'L' END
                 FROM matches m
                 JOIN tournaments t ON t.id = m.tournament_id
                 WHERE (m.player1_id = pl.id OR m.player2_id = pl.id)
                   AND m.winner_id IS NOT NULL
                   AND COALESCE(m.score, '') <> 'BYE'
                   AND NOT public."нерейтинговая_категория"(COALESCE(t.category_id, ''))
                   AND COALESCE(t.format, 'singles') NOT IN ('doubles', 'mixed_doubles')
                 ORDER BY COALESCE(m.played_at, m.created_at) DESC
                 LIMIT 5
               ) AS form
        FROM players pl
        WHERE pl.id = ANY(p_ids)
      ) f
      WHERE p.id = f.player_id;
    END;
    $function$;

COMMIT;

-- ----------------------------------------------------------------------
-- ПРОВЕРКА — ЧИТАЕТСЯ ИЗ БАЗЫ, А НЕ ИЗ ОТВЕТА «Success»
--
-- Ждём: столбец 1 · категорий без рейтинга 2 (friendly и open-friendly) ·
-- признак у open-friendly true · признак у tour false · литералов в теле
-- функции 0.
-- ----------------------------------------------------------------------
SELECT 'stolbec is_rating'       AS chto,
       count(*)::text            AS skolko
  FROM information_schema.columns
 WHERE table_name = 'categories' AND column_name = 'is_rating'
UNION ALL
SELECT 'kategoriy bez reytinga', count(*)::text
  FROM public.categories WHERE is_rating = false
UNION ALL
SELECT 'open-friendly ne reytingovaya',
       public."нерейтинговая_категория"('open-friendly')::text
UNION ALL
SELECT 'tour ne reytingovaya',
       public."нерейтинговая_категория"('tour')::text
UNION ALL
SELECT 'literal friendly v recalc',
       (length(pg_get_functiondef(p.oid))
        - length(replace(pg_get_functiondef(p.oid), '''friendly''', '')))::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'recalc_player_categories';

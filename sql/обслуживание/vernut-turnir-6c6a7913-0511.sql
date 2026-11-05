-- ВЕРНУТЬ ТУРНИР К СОСТОЯНИЮ ДО ЖЕРЕБЬЁВКИ. 05.11
--
-- Один прогон — и всё как было: заявки, матчи, итоги, история рейтинга,
-- очки игроков и сама строка турнира.
--
--   турнир → 6c6a7913-6b55-4af4-af9b-f0419ba69363
--   слепок → sql/обслуживание/slepok-turnira-6c6a7913-0511.sql
--
-- ГНАТЬ ТОЛЬКО ПОСЛЕ ТОГО, КАК СЛЕПОК СНЯТ. Первый запрос это проверяет
-- и говорит словом, а не падает молча.
--
-- ПОРЯДОК ВАЖЕН: сперва сносится всё наработанное, потом возвращается
-- запомненное. Матчи сносятся ПЕРВЫМИ — на них висит
-- `trg_advance_bracket`, и снос заявок под живыми матчами заставил бы
-- триггеры работать по полупустым данным.
--
-- ЧТО НЕ ВОЗВРАЩАЕТСЯ, И ЭТО НАЗВАНО, А НЕ СПРЯТАНО: баллы лояльности,
-- начисленные участникам за турнир (`loyalty_transactions`). Они
-- привязаны к профилю, а не к игроку, и снимать чужие баллы запросом я
-- не берусь — скажи, если нужно, сделаю отдельно и покажу прежде.
--
-- ГНАТЬ ПО ОДНОМУ, СВЕРХУ ВНИЗ. Последний запрос — проверка чтением.
--
--   sql/обслуживание/vernut-turnir-6c6a7913-0511.sql


-- ── 1. ЕСТЬ ЛИ ЧТО ВОЗВРАЩАТЬ ────────────────────────────────────────
-- Ждём: `est`. Если `NET` — слепка нет, дальше НЕ ГНАТЬ: снос без
-- слепка не отменить ничем.
/* Имени таблицы в ветках нет по той же причине, что в слепке:
   Postgres разбирает все ветки `CASE`, и проверка падала бы раньше,
   чем проверит. */
SELECT CASE WHEN to_regclass('public.slepok6c_zayavki') IS NULL
            THEN 'NET — слепка нет, дальше НЕ ГНАТЬ'
            ELSE 'est — слепок на месте' END AS mozhno_li;


-- ── 2. СНЕСТИ НАРАБОТАННОЕ ───────────────────────────────────────────
DELETE FROM public.matches
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

DELETE FROM public.tournament_results
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

DELETE FROM public.rating_history
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

DELETE FROM public.tournament_registrations
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';


-- ── 3. ВЕРНУТЬ ЗАПОМНЕННОЕ ───────────────────────────────────────────
/* КОЛОНКИ ПЕРЕЧИСЛЯЮТСЯ, А НЕ БЕРУТСЯ ЗВЁЗДОЧКОЙ.
   БЕДА, ПОЙМАННАЯ ПРОГОНОМ 05.11: `INSERT ... SELECT *` упал на
   `cannot insert a non-DEFAULT value into column "queue_at"` —
   очередь заявок ВЫЧИСЛЯЕТСЯ базой из `COALESCE(waitlisted_at,
   registered_at)`, и своего значения не принимает.
   ЗВЁЗДОЧКА БЕРЁТ И ТО, ЧЕГО ПИСАТЬ НЕЛЬЗЯ. Руками список тоже не
   пишется: в `tournament_registrations` под тридцать колонок, и
   забытая при следующей правке схемы молча потеряла бы данные.
   Поэтому список колонок спрашивается У САМОЙ БАЗЫ и из него
   выбрасываются вычисляемые (`is_generated <> 'NEVER'`). Это
   переживёт и новые колонки, и новые вычисляемые. */
DO $возврат$
DECLARE
    пара  record;
    поля  text;
BEGIN
    FOR пара IN
        SELECT * FROM (VALUES
            ('tournament_registrations', 'slepok6c_zayavki'),
            ('matches',                  'slepok6c_matchi'),
            ('tournament_results',       'slepok6c_itogi'),
            ('rating_history',           'slepok6c_istoriya')
        ) AS п(куда, откуда)
    LOOP
        SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.ordinal_position)
          INTO поля
          FROM information_schema.columns c
         WHERE c.table_schema = 'public'
           AND c.table_name   = пара.куда
           AND c.is_generated = 'NEVER'
           /* Колонка есть в слепке — значит её и возвращаем. Если схема
              с тех пор обросла новой, в слепке её нет, и подставлять
              туда нечего. */
           AND EXISTS (SELECT 1 FROM information_schema.columns s
                        WHERE s.table_schema = 'public'
                          AND s.table_name   = пара.откуда
                          AND s.column_name  = c.column_name);

        EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM public.%I',
                       пара.куда, поля, поля, пара.откуда);
    END LOOP;
END
$возврат$;


-- ── 4. ВЕРНУТЬ СТРОКУ ТУРНИРА ────────────────────────────────────────
-- Статус, число групп, вместимость, ручной выбор лиги и зерно жребия —
-- всё, что прогон мог тронуть.
UPDATE public.tournaments t
   SET status              = s.status,
       group_count         = s.group_count,
       qualifiers_per_group = s.qualifiers_per_group,
       max_participants    = s.max_participants,
       draw_size           = s.draw_size,
       draw_seed           = s.draw_seed,
       manual_group_places = s.manual_group_places,
       manual_league_sides = s.manual_league_sides
  FROM public.slepok6c_turnir s
 WHERE t.id = s.id;


-- ── 5. ВЕРНУТЬ ОЧКИ ИГРОКОВ ──────────────────────────────────────────
-- Завершение турнира пересчитывает очки, победы, поражения и форму.
-- Без этого шага турнир исчез бы, а очки за него остались.
/* NTRP ВОЗВРАЩАЕТСЯ ТОЖЕ — слово Кости 05.11. Колонки дописаны в
   слепок отдельным файлом (`slepok-dopisat-ntrp-0511.sql`), потому что
   сам слепок уже был снят. Если тот файл не гнали, колонок нет, и этот
   запрос откажет по имени — это лучше, чем молча вернуть половину. */
UPDATE public.players p
   SET points       = s.points,
       wins         = s.wins,
       losses       = s.losses,
       form         = s.form,
       rank_change  = s.rank_change,
       ntrp_doubles = s.ntrp_doubles,
       ntrp_singles = s.ntrp_singles
  FROM public.slepok6c_igroki s
 WHERE p.id = s.id;


-- ── 6. ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success» ─────────────────
-- Ждём: у всех шести строк `rashozhdenie` = 0. Любое другое число —
-- что-то не вернулось, и видно, что именно.
SELECT 'заявки' AS chto,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363')
       - (SELECT count(*) FROM public.slepok6c_zayavki)  AS rashozhdenie
UNION ALL SELECT 'матчи',
       (SELECT count(*) FROM public.matches
         WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363')
       - (SELECT count(*) FROM public.slepok6c_matchi)
UNION ALL SELECT 'итоги',
       (SELECT count(*) FROM public.tournament_results
         WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363')
       - (SELECT count(*) FROM public.slepok6c_itogi)
UNION ALL SELECT 'история',
       (SELECT count(*) FROM public.rating_history
         WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363')
       - (SELECT count(*) FROM public.slepok6c_istoriya)
UNION ALL SELECT 'очки и NTRP разошлись у скольких',
       (SELECT count(*) FROM public.players p
          JOIN public.slepok6c_igroki s ON s.id = p.id
         WHERE p.points       IS DISTINCT FROM s.points
            OR p.wins         IS DISTINCT FROM s.wins
            OR p.losses       IS DISTINCT FROM s.losses
            OR p.ntrp_doubles IS DISTINCT FROM s.ntrp_doubles
            OR p.ntrp_singles IS DISTINCT FROM s.ntrp_singles)
UNION ALL SELECT 'статус турнира вернулся',
       (SELECT CASE WHEN t.status = s.status AND t.group_count = s.group_count
                    THEN 0 ELSE 1 END
          FROM public.tournaments t, public.slepok6c_turnir s WHERE t.id = s.id)
ORDER BY 1;

-- ============================================
-- Очки записаны днём начала турнира вместо дня окончания
-- ============================================
--
-- Очки присуждаются по итогу турнира, а в историю рейтинга они попадали
-- датой его начала. Из сорока пяти сыгранных турниров сорок два идут больше
-- одного дня, поэтому на графике рост начинался раньше, чем турнир кончался.
--
-- В коде уже исправлено (js/admin/sections/bracket.js): новые записи ставятся
-- датой окончания. Здесь чиним те 90, что уже лежат в базе.
--
-- Границу сезона (1 сентября) сдвиг не задевает: турниров, которые
-- начинаются в августе и заканчиваются в сентябре, нет — проверено.
--
-- КАК ЗАПУСКАТЬ. Ничего не выделяй мышью — если в редакторе есть выделение,
-- Supabase выполняет только его. Поставь курсор в текст и нажми Ctrl+Enter
-- (Cmd+Enter). Выполнится весь файл, а на экране покажется результат
-- последнего запроса — он и есть проверка.


-- ---- 1. Куда я попал -------------------------------------------------
-- Боевая база — три сотни игроков. Тестовая — три строки с именами test-*.
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Перенести очки на дату окончания -----------------------------
-- Supabase покажет «Success. N rows» — N и есть число исправленных записей.
UPDATE rating_history rh
SET recorded_at = t.date_end
FROM tournaments t
WHERE t.id = rh.tournament_id
  AND t.date_end IS NOT NULL
  AND rh.recorded_at <> t.date_end;


-- ---- 3. Пересчитать очки и победы ------------------------------------
SELECT recalc_player_categories(array_agg(DISTINCT player_id)) FROM rating_history;
SELECT recalc_all_player_points();


-- ---- 4. ПРОВЕРКА -----------------------------------------------------
-- Это последний запрос, его ответ и увидишь на экране.
-- Должно быть: осталось_несовпадений = 0, а перенесено — сколько исправлено.
SELECT
    (SELECT count(*) FROM rating_history rh
       JOIN tournaments t ON t.id = rh.tournament_id
      WHERE t.date_end IS NOT NULL AND rh.recorded_at <> t.date_end) AS осталось_несовпадений,
    (SELECT count(*) FROM rating_history rh
       JOIN tournaments t ON t.id = rh.tournament_id
      WHERE t.date_end IS NOT NULL AND rh.recorded_at = t.date_end
        AND t.date_end <> t.date_start) AS перенесено_на_дату_окончания;

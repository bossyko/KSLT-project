-- ============================================
-- Удалили турнир — очки за него уходят вместе с ним
-- ============================================
--
-- Заявки и результаты турнира удаляются вместе с ним, а записи о
-- начислении очков — нет: у них стояло «обнулить ссылку». Турнира больше
-- нет, а строка в истории рейтинга живёт, и в профиле игрока висят
-- турниры с бессмысленными названиями. Ровно это мы и увидели у Ивана
-- Иванова: «Акш», «ррывдд», «враоржы» — следы отладочных турниров,
-- удалённых месяц назад.
--
-- Хуже другое. Очки по категориям собираются из этой самой истории
-- функцией recalc_player_categories. Пока строка висит, очки за
-- несуществующий турнир продолжают считаться, и игрок стоит в рейтинге
-- выше, чем заслужил.
--
-- Меняем правило: запись истории уходит вместе с турниром. Пересчёт
-- очков после удаления зовёт админка — она знает, кого затронуло.

BEGIN;

ALTER TABLE rating_history
    DROP CONSTRAINT IF EXISTS rating_history_tournament_id_fkey;

ALTER TABLE rating_history
    ADD CONSTRAINT rating_history_tournament_id_fkey
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;

COMMIT;

-- ============================================
-- Проверка
-- ============================================
-- Должно вернуть 'c' (cascade) вместо 'n' (set null):
--
-- SELECT conname, confdeltype
--   FROM pg_constraint
--  WHERE conname = 'rating_history_tournament_id_fkey';
--
-- Расшифровка confdeltype: a — ничего, r — запретить,
-- c — удалить следом, n — обнулить ссылку, d — поставить умолчание.

-- ============================================
-- Осиротевшие записи, оставшиеся от прежнего правила
-- ============================================
-- Ссылка на турнир пуста, но это не оценка NTRP, которую заводят вручную
-- без всякого турнира. Такие строки — следы уже удалённых турниров.
--
-- SELECT player_id, tournament_name, points_earned, recorded_at
--   FROM rating_history
--  WHERE tournament_id IS NULL
--    AND tournament_name <> 'Оценка NTRP'
--  ORDER BY recorded_at DESC;
--
-- Убрать их и пересчитать очки затронутым игрокам:
--
-- WITH gone AS (
--   DELETE FROM rating_history
--    WHERE tournament_id IS NULL AND tournament_name <> 'Оценка NTRP'
--   RETURNING player_id
-- )
-- SELECT public.recalc_player_categories(array_agg(DISTINCT player_id)) FROM gone;

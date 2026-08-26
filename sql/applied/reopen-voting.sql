-- ============================================
-- Вернуть голосование баттлам, у которых счёт так и не сохранился
-- ============================================
--
-- Пока ввод счёта падал, админка успевала поставить voting_closed = true
-- ещё до записи матча. Каждая неудачная попытка закрывала голосование при
-- незавершённом баттле. Порядок в коде исправлен: сначала матч, потом флаг.
--
-- Здесь возвращаем голосование тем баттлам, которые ещё не сыграны:
-- статус не «завершён», матча нет, а дата матча ещё впереди.

UPDATE challenges
SET voting_closed = false
WHERE voting_closed = true
  AND status <> 'completed'
  AND status <> 'cancelled'
  AND match_id IS NULL
  AND proposed_date IS NOT NULL
  AND (proposed_date || ' ' || COALESCE(proposed_time, '23:59'))::timestamp
      AT TIME ZONE 'Asia/Bishkek' > now();

-- Что получилось
SELECT battle_title AS баттл,
       proposed_date AS дата,
       proposed_time AS время,
       status AS статус,
       voting_closed AS голосование_закрыто
FROM challenges
WHERE battle_published = true
ORDER BY proposed_date DESC;

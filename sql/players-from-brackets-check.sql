-- ============================================================
-- Карточки из турнирных сеток: проверка
-- ============================================================
-- Только читает. Правку делает players-from-brackets.sql.

-- ---- Сколько всего карточек и сколько из них пустых ----
-- Пустая — заведена под перенос сеток: есть имя и пол, больше ничего.

SELECT count(*) AS всего,
       count(*) FILTER (WHERE ntrp_rating IS NULL AND category_id IS NULL) AS без_ntrp_и_категории,
       count(*) FILTER (WHERE points = 0 OR points IS NULL) AS без_очков
  FROM players;

-- ---- Заведённые сегодня ----

SELECT id, name, gender, created_at
  FROM players
 WHERE created_at > now() - interval '1 hour'
 ORDER BY name;

-- ---- Описки: остались ли старые написания ----
-- Строк быть не должно.

SELECT id, name FROM players
 WHERE name IN ('Закир Гудаджанов', 'Лилия Рахматулина', 'Мурат Алайчыев',
                'Мурат Норузбаев', 'Сынгыз Исматов');

-- ---- Однофамильцы с одинаковым именем ----
-- Если тут строки — значит кого-то завели дважды, разными опознавателями.

SELECT name, count(*), array_agg(id) FROM players
 GROUP BY name HAVING count(*) > 1;

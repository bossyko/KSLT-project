-- ============================================================
-- Приглашения самому себе — только чтение
-- ============================================================
--
-- Запускать перед self-invites-cleanup.sql, чтобы увидеть, что уйдёт.
-- Ничего не меняет.

-- 1. Кто кого позвал и совпадает ли это с ним самим.
--    Собственное приглашение — когда карточка отправителя и карточка
--    получателя одна и та же.
SELECT
    gi.id,
    p.full_name                       AS отправитель,
    pl.name                           AS получатель,
    gi.status                         AS состояние,
    gi.created_at                     AS когда,
    (p.player_id = gi.receiver_player_id) AS сам_себе
  FROM game_invites gi
  JOIN profiles p  ON p.id = gi.sender_id
  LEFT JOIN players pl ON pl.id = gi.receiver_player_id
 ORDER BY gi.created_at DESC;

-- 2. Только те, что уйдут. Именно эти строки удалит второй файл.
SELECT
    gi.id,
    p.full_name   AS кто,
    gi.status     AS состояние,
    gi.created_at AS когда
  FROM game_invites gi
  JOIN profiles p ON p.id = gi.sender_id
 WHERE p.player_id IS NOT NULL
   AND p.player_id = gi.receiver_player_id
 ORDER BY gi.created_at DESC;

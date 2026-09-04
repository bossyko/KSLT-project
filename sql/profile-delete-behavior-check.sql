-- ============================================================
-- Проверка удаления профиля — только чтение
-- ============================================================
--
-- Запускать до и после profile-delete-behavior.sql и
-- purge-deleted-accounts.sql. Ничего не меняет.

-- 1. Что сейчас задано у связей на профиль.
--    До правки в столбце «при удалении» у восьми строк будет «запрещать».
--    После — «удалять вместе» или «отвязывать».
SELECT
    src.relname                    AS таблица,
    con.conname                    AS связь,
    CASE con.confdeltype
        WHEN 'a' THEN 'запрещать (по умолчанию)'
        WHEN 'r' THEN 'запрещать явно'
        WHEN 'c' THEN 'удалять вместе'
        WHEN 'n' THEN 'отвязывать'
        WHEN 'd' THEN 'ставить значение по умолчанию'
    END                            AS при_удалении
  FROM pg_constraint con
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_class tgt ON tgt.oid = con.confrelid
 WHERE con.contype = 'f'
   AND tgt.relname = 'profiles'
 ORDER BY при_удалении, таблица;

-- 2. Сколько записей помечено на удаление и кому уже вышел срок
SELECT
    count(*)                                                        AS всего_помечено,
    count(*) FILTER (WHERE deleted_at < now() - interval '30 days') AS срок_вышел,
    min(deleted_at)                                                 AS самая_старая_метка
  FROM profiles
 WHERE deleted_at IS NOT NULL;

-- 3. Что потянется за такой записью, если её удалить
SELECT
    p.id,
    p.full_name,
    p.deleted_at::date                                              AS помечен,
    (SELECT count(*) FROM game_invites g
      WHERE g.sender_id = p.id OR g.receiver_profile_id = p.id)     AS приглашений,
    (SELECT count(*) FROM challenges c
      WHERE c.challenger_id = p.id OR c.opponent_profile_id = p.id) AS вызовов,
    (SELECT count(*) FROM payments pay WHERE pay.profile_id = p.id) AS платежей,
    (SELECT count(*) FROM memberships m WHERE m.profile_id = p.id)  AS членств
  FROM profiles p
 WHERE p.deleted_at IS NOT NULL
 ORDER BY p.deleted_at;

-- 4. Заведена ли ночная уборка и когда запускалась
SELECT jobname, schedule, active FROM cron.job
 WHERE jobname = 'purge-deleted-accounts';

SELECT status, start_time, return_message
  FROM cron.job_run_details
 WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'purge-deleted-accounts')
 ORDER BY start_time DESC
 LIMIT 5;

-- 5. Прогон вручную, не дожидаясь ночи.
--    Стирает только тех, у кого срок вышел. Раскомментировать осознанно.
-- SELECT * FROM public.purge_deleted_accounts();

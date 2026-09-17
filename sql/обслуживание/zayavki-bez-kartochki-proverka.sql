-- ============================================================
-- Заявки без карточки игрока — ПРОВЕРКА по всем турнирам
-- ============================================================
--
-- Только читает. Заявка может хранить человека двумя способами: ссылкой на
-- карточку (player_id, partner_id) или просто именем (is_external). Матчи
-- же хранят игрока, поэтому у заявки без карточки сторона в матче остаётся
-- пустой — счёт туда не вписать, и группа не доигрывается.
--
-- Так было в одиночном FUTURES: Атабек Абдылдаев числился именем, и три
-- встречи группы D повисли.
--
-- Пусто — значит у всех участников живых турниров есть карточки.

SELECT t.title                                    AS турнир,
       t.status                                   AS состояние_турнира,
       COALESCE(r.external_name, r.partner_external_name) AS кто_без_карточки,
       CASE WHEN r.external_name IS NOT NULL THEN 'подал заявку'
            ELSE 'напарник' END                   AS роль,
       r.status                                   AS состояние_заявки,
       COALESCE(r.group_number::text, '—')        AS группа,
       r.id                                       AS id_заявки
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE t.status NOT IN ('completed', 'cancelled')
   AND r.status NOT IN ('withdrawn', 'rejected')
   AND (
        (r.player_id IS NULL)
     OR (r.partner_id IS NULL AND r.partner_external_name IS NOT NULL)
   )
 ORDER BY t.date_start DESC, r.registered_at;

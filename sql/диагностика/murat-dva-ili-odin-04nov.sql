-- МУРАТ НОРУЗБАЕВ: ОДИН ЧЕЛОВЕК ИЛИ ДВА. ТОЛЬКО ЧИТАЕТ.
--
-- Две карточки с одним скелетом имени:
--   `murat-noruzbaev`   = «Мурат Норзубаев», 725 очков
--   `murat-noruzbaev-2` = «Мурат Норузбаев», 25 очков
-- Имя и адрес у первой РАЗОШЛИСЬ: адрес говорит `noruzbaev`, имя —
-- «Норзубаев». Суффикс `-2` у второй значит, что её заводили, уже зная
-- о совпадении, — то есть кто-то когда-то счёл их разными.
--
-- СНАЧАЛА ПОМЕРИТЬ, ПОТОМ НАЗЫВАТЬ. Слить не ту сторону — значит
-- потерять игры и очки, а это необратимо. Здесь только чтение: где
-- каждая стоит, что за ней записано и в каких турнирах они встречались.
-- ЕСЛИ ОБЕ ИГРАЛИ В ОДНОМ ТУРНИРЕ — ЭТО ДВА РАЗНЫХ ЧЕЛОВЕКА, и вопрос
-- закрыт без слов: один человек в одном турнире дважды не стоит.

WITH пара(id) AS (VALUES ('murat-noruzbaev'), ('murat-noruzbaev-2')),
данные AS (
  SELECT p.id, p.name, p.points, p.category_id, p.gender,
         p.is_guest, p.has_account, p.created_at::date AS zavedena,
         (SELECT count(*) FROM public.tournament_registrations r
           WHERE r.player_id = p.id OR r.partner_id = p.id)   AS zayavok,
         (SELECT count(*) FROM public.matches m
           WHERE m.player1_id = p.id OR m.player2_id = p.id)  AS matchey,
         (SELECT count(*) FROM public.rating_history h
           WHERE h.player_id = p.id)                          AS strok_istorii,
         (SELECT count(*) FROM public.profiles pr
           WHERE pr.player_id = p.id)                         AS uchyotok,
         (SELECT string_agg(DISTINCT t.title, ' · ')
            FROM public.tournament_registrations r
            JOIN public.tournaments t ON t.id = r.tournament_id
           WHERE r.player_id = p.id OR r.partner_id = p.id)   AS turniry
    FROM пара JOIN public.players p ON p.id = пара.id
)
SELECT д.*,
       /* ГЛАВНЫЙ ПРИЗНАК: турниры, где стоят ОБЕ. Непусто — два разных
          человека, и сливать нельзя. */
       (SELECT string_agg(DISTINCT t.title, ' · ')
          FROM public.tournament_registrations r1
          JOIN public.tournament_registrations r2
            ON r2.tournament_id = r1.tournament_id
          JOIN public.tournaments t ON t.id = r1.tournament_id
         WHERE (r1.player_id = 'murat-noruzbaev'   OR r1.partner_id = 'murat-noruzbaev')
           AND (r2.player_id = 'murat-noruzbaev-2' OR r2.partner_id = 'murat-noruzbaev-2')
       ) AS vmeste_v_turnire
  FROM данные д
 ORDER BY д.points DESC;

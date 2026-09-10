-- ============================================================
-- Санжаров / Султанов: что в базе на самом деле
-- ============================================================
--
-- Только читает. Прежде чем переименовывать и сливать карточки, смотрим,
-- сколько их и что за каждой стоит: очки, матчи, заявки, аккаунт. Слить
-- вслепую мы уже пробовали — получили двойника.

SELECT p.id, p.name,
       p.ntrp_singles AS одиночный, p.ntrp_doubles AS парный,
       p.category_id  AS разряд, p.points AS очки,
       p.is_guest AS гость,
       (SELECT count(*) FROM public.matches m
         WHERE m.player1_id = p.id OR m.player2_id = p.id) AS матчей,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.player_id = p.id OR r.partner_id = p.id) AS заявок,
       (SELECT count(*) FROM public.rating_history h WHERE h.player_id = p.id) AS строк_истории,
       (SELECT count(*) FROM public.profiles pr WHERE pr.player_id = p.id) AS аккаунтов
  FROM public.players p
 WHERE p.name ILIKE '%санжар%' OR p.name ILIKE '%султан%'
 ORDER BY p.name;

-- В каких турнирах каждая карточка заявлена
SELECT r.player_id AS первый, r.partner_id AS второй,
       t.title AS турнир, r.status AS состояние
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.player_id IN (SELECT id FROM public.players
                        WHERE name ILIKE '%санжар%' OR name ILIKE '%султан%')
    OR r.partner_id IN (SELECT id FROM public.players
                         WHERE name ILIKE '%санжар%' OR name ILIKE '%султан%')
 ORDER BY t.title;

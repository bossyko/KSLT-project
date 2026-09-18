-- ============================================================
-- Исматова: одна карточка или две — ПРОВЕРКА
-- ============================================================
--
-- «Эракйым Исматова» заведена гостем при переносе заявок Masters. Если в
-- клубе она уже была, в базе теперь два человека вместо одного: у одного
-- очки и история, у другого — сегодняшний турнир.
--
-- Тогда правка другая. Переименование ничего не решит: надо перевести
-- заявки и матчи на настоящую карточку, а гостевую убрать. Иначе рейтинг
-- будет считать двоих, а история матчей разойдётся по половинкам.
--
-- Ищем широко: по фамилии кириллицей и латиницей, по опознавателю.
--
-- Запрос читающий, ничего не меняет.

SELECT p.id                                   AS опознаватель,
       p.name                                 AS имя,
       p.name_en                              AS латиницей,
       CASE WHEN p.is_guest THEN 'гость' ELSE '' END ||
       CASE WHEN p.is_member THEN ' член клуба' ELSE '' END ||
       CASE WHEN p.has_account THEN ' есть учётка' ELSE '' END AS кто,
       p.points                               AS очки,
       p.ntrp_singles                         AS ntrp,
       (SELECT count(*) FROM public.tournament_registrations r
         WHERE r.player_id = p.id OR r.partner_id = p.id)      AS заявок,
       (SELECT count(*) FROM public.matches m
         WHERE m.player1_id = p.id OR m.player2_id = p.id)     AS матчей,
       (SELECT count(*) FROM public.rating_history h
         WHERE h.player_id = p.id)                             AS строк_рейтинга,
       p.created_at                            AS заведена
  FROM public.players p
 WHERE p.name ILIKE '%сматов%'
    OR p.name_en ILIKE '%smatov%'
    OR p.id ILIKE '%ismatov%'
 ORDER BY p.created_at;

-- Одна строка — это опечатка, правим именем.
-- Две и больше — это двойники: смотрим, у кого история, и сливаем на неё.

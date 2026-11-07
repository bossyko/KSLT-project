-- ОДИН ЗАПРОС. ТОЛЬКО ЧИТАЕТ. Отдай мне вывод целиком.
--
-- ПОВОД (07.11). При снятии игрока из очереди в поле «внешний напарник»
-- попадал ИДЕНТИФИКАТОР карточки вместо имени: `имяИгрокаИзЗаявок`
-- искала человека только среди первых номеров, а тот стоял напарником,
-- и функция возвращала сам идентификатор. На экране это выглядело как
-- `kalys-kazakbaev` с меткой EXT.
--
-- ПРИЗНАК БЕДЫ ТОЧНЫЙ, А НЕ ПОХОЖИЙ: во «внешнем» поле лежит строка,
-- которая СОВПАДАЕТ С АДРЕСОМ СУЩЕСТВУЮЩЕЙ КАРТОЧКИ. У настоящего
-- внешнего участника там человеческое имя, и с `players.id` оно не
-- совпадает.

SELECT  r.id                              AS zayavka,
        r.tournament_id,
        t.title                            AS turnir,
        r.status,
        p1.name                            AS igrok,
        r.partner_external_name            AS chto_lezhit_v_naparnike,
        pp.name                            AS eto_na_samom_dele,
        r.partner_id                       AS partner_id_pustoy_li,
        to_char(r.registered_at AT TIME ZONE 'Asia/Bishkek', 'DD.MM HH24:MI') AS podano
  FROM  public.tournament_registrations r
  JOIN  public.players pp ON pp.id = r.partner_external_name
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.tournaments t ON t.id = r.tournament_id
 ORDER BY r.registered_at DESC;

-- УБРАТЬ ДУБЛЬ «ЭРКАЙЫМ ИСМАТОВА». 04.11
--
-- МОЯ ОШИБКА, И ОНА НАЗВАНА. 04.11 при заливке женских пар я завёл
-- карточку `erkayym-ismatova` при живой `erakyym-ismatova` — у той 360
-- очков и 6/1 побед. Прибор сверки сравнивает слова ПОБУКВЕННО: в форме
-- стояло «Эркеайым Исаматова», в базе «Эркайым Исматова», ни одно слово
-- не совпало, кандидатов он не показал.
-- КЛЮЧ НЕ ЛОВИТ ОПЕЧАТОК — это записано ещё 30.09, и там их ловила
-- похожесть, которой у нынешнего SQL-прибора нет. Слепое место названо.
--
-- Костя 04.11 дал написание «Эркайым Исматова» — он называл СУЩЕСТВУЮЩУЮ
-- карточку, а я принял это за написание новой.
--
-- ПРОВЕРЕНО ПО ВСЕЙ БАЗЕ: дубль РОВНО ОДИН. Остальные шесть карточек,
-- заведённых в тот же день, двойников не имеют.
--
-- УДАЛЕНИЕ НЕОБРАТИМО. Поэтому порядок такой: сперва заявки
-- переставляются на живую карточку, и только потом пустая удаляется.
-- Всё в одной сделке: если на пустую карточку ссылается что-то ещё,
-- внешний ключ не даст её удалить и ОТМЕНИТ ВСЮ сделку целиком —
-- испорченного состояния не останется.

BEGIN;

-- ---- 1. ЗАЯВКИ ПЕРЕСТАВЛЯЮТСЯ НА ЖИВУЮ КАРТОЧКУ ----
-- И капитаном, и напарницей: в парном турнире человек может стоять
-- любой из двух сторон, и чинить надо обе.

UPDATE public.tournament_registrations
   SET partner_id = 'erakyym-ismatova'
 WHERE partner_id = 'erkayym-ismatova';

UPDATE public.tournament_registrations
   SET player_id = 'erakyym-ismatova'
 WHERE player_id = 'erkayym-ismatova';

-- ---- 2. ПУСТАЯ КАРТОЧКА УДАЛЯЕТСЯ ----
-- Условие `points = 0` — страховка от опечатки в адресе: живую карточку
-- с очками этот запрос не тронет, даже если имя адреса перепутать.

DELETE FROM public.players
 WHERE id = 'erkayym-ismatova'
   AND points = 0;

COMMIT;


-- ---- ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА ТАБЛИЦА ------------------------
-- Ждём: pustoy_net = 0, zhivaya_na_meste = 1, ochki = 360,
-- v_turnire = 1, obshchiy_ntrp — сумма NTRP пары, а не половина.

SELECT (SELECT count(*) FROM public.players WHERE id = 'erkayym-ismatova')   AS pustoy_net,
       (SELECT count(*) FROM public.players WHERE id = 'erakyym-ismatova')   AS zhivaya_na_meste,
       (SELECT points   FROM public.players WHERE id = 'erakyym-ismatova')   AS ochki,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363'
           AND (player_id = 'erakyym-ismatova' OR partner_id = 'erakyym-ismatova')) AS v_turnire,
       (SELECT coalesce(p1.ntrp_doubles, 0) + coalesce(p2.ntrp_doubles, 0)
          FROM public.tournament_registrations r
          JOIN public.players p1 ON p1.id = r.player_id
          JOIN public.players p2 ON p2.id = r.partner_id
         WHERE r.tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363'
           AND r.partner_id = 'erakyym-ismatova')                            AS obshchiy_ntrp;

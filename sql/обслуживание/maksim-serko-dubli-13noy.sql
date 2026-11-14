-- СЛИЯНИЕ ДУБЛЕЙ «МАКСИМ СЕРКО». 13.11
--
-- Пятый случай той же породы после Эрмека Абакирова (04.11), Эрлана
-- Шекербекова (12.11), Данияра Атаханова и Каличи Тайгуроновой (13.11):
-- человек зарегистрировался на сайте, аккаунту завели НОВУЮ карточку, а
-- его прежняя — с матчами и значками — осталась в стороне.
--
-- ОТЛИЧИЕ ОТ ЧЕТЫРЁХ ПРЕЖНИХ: имя в профиле — не имя, а ник. Человек
-- записался как «MaKsIm NiGa», поэтому поиск по имени не нашёл
-- «Максима Серко» ни точным ключом, ни по фамилии, и завёл третью
-- карточку. Связь между ними знает только Костя — он её и назвал.
--
-- ЗАМЕРЕНО В БОЕВОЙ 13.11 (чтением, до правки):
--   maksim-serko   «Максим Серко»   0 очков  0/0   заведена 10.09
--                  матчей 9 (5 как первый, 4 как второй), побед 7,
--                  значков 5, заявок 2 (одна из них — MASTERS
--                  064c6018, статус draw), напарником 1 раз,
--                  NTRP 6 / 5.5, пол men, аккаунтов 0
--   maksim-niga    «MaKsIm NiGa»    0 очков  0/0   заведена 13.11 08:34
--                  матчей 0, значков 0, заявок 0, истории 0,
--                  аккаунт 1 (maksn807@gmail.com), пол не указан
--
-- ЖИВОЙ ОСТАЁТСЯ maksim-serko. На ней вся история; у новой нет ничего,
-- кроме аккаунта. Очков нет НИ У ОДНОЙ — девять матчей не дали очков,
-- и это отдельный вопрос, не этого куска. Карточка живёт не из-за
-- очков, а из-за матчей, значков и заявок.
--
-- ОПАСНОСТЬ ТА ЖЕ: у `tournament_registrations.player_id` внешний ключ
-- с ON DELETE CASCADE. Удали мы пустую карточку, не переведя ссылки, —
-- ушло бы молча. Здесь на пустой висит только профиль, но порядок
-- остаётся прежним: сперва перевод, удаление последним, одной сделкой.
--
-- ИМЯ ПРОФИЛЯ НЕ ТРОГАЕМ. «MaKsIm NiGa» человек написал сам; менять
-- чужое имя без его слова нельзя. Карточка при этом зовётся «Максим
-- Серко» — после слияния в админке будет видно и то, и другое.
--
-- ФАЙЛ СХЕМЫ — НЕ ИСТОЧНИК ПРАВДЫ О БОЕВОЙ (урок 13.11). Поэтому
-- шаг 0 — список связей из information_schema живой базы.

-- ---- 0. КТО ССЫЛАЕТСЯ НА players И ЧТО УЙДЁТ КАСКАДОМ ----------------
SELECT tc.table_name, kcu.column_name, rc.delete_rule
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name AND kcu.constraint_schema = tc.constraint_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
  JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.constraint_schema
 WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'players'
 ORDER BY tc.table_name, kcu.column_name;

-- ---- 1. ПРАВКА, ОДНОЙ СДЕЛКОЙ ----------------------------------------
BEGIN;

UPDATE public.profiles
   SET player_id = 'maksim-serko'
 WHERE player_id = 'maksim-niga';

UPDATE public.tournament_registrations
   SET player_id = 'maksim-serko'
 WHERE player_id = 'maksim-niga';

UPDATE public.tournament_registrations
   SET partner_id = 'maksim-serko'
 WHERE partner_id = 'maksim-niga';

UPDATE public.player_link_requests
   SET player_id = 'maksim-serko'
 WHERE player_id = 'maksim-niga';

UPDATE public.registration_changes
   SET old_player_id = 'maksim-serko'
 WHERE old_player_id = 'maksim-niga';

UPDATE public.registration_changes
   SET new_player_id = 'maksim-serko'
 WHERE new_player_id = 'maksim-niga';

-- ПРИЗНАК УЧЁТКИ СТАВИТСЯ ТРИГГЕРОМ `trg_признак_учётки` на profiles,
-- но он срабатывает на изменение profiles — проверка ниже это и
-- покажет. Если окажется false, поправить одной строкой:
--   UPDATE public.players SET has_account = true WHERE id = 'maksim-serko';

DELETE FROM public.players
 WHERE id = 'maksim-niga'
   AND points = 0
   AND NOT EXISTS (SELECT 1 FROM public.matches
                    WHERE player1_id = 'maksim-niga' OR player2_id = 'maksim-niga');

COMMIT;

-- ---- 2. ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА СТРОКА ---------------------------
-- Ждём: 0, 1, 1, 9, 5, 2, true
SELECT (SELECT count(*) FROM public.players  WHERE id = 'maksim-niga')          AS pustoy_net,
       (SELECT count(*) FROM public.players  WHERE id = 'maksim-serko')         AS zhivaya,
       (SELECT count(*) FROM public.profiles WHERE player_id = 'maksim-serko')  AS akkaunt,
       (SELECT count(*) FROM public.matches
         WHERE player1_id = 'maksim-serko' OR player2_id = 'maksim-serko')      AS matchey,
       (SELECT count(*) FROM public.player_badges WHERE player_id = 'maksim-serko') AS znachkov,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE player_id = 'maksim-serko')                                      AS zayavok,
       (SELECT has_account FROM public.players WHERE id = 'maksim-serko')       AS est_uchetka;

-- ---- 3. ЧТО ОСТАЁТСЯ ОТКРЫТЫМ ----------------------------------------
-- 1) У профиля maksn807@gmail.com не указан пол — он не указан у
--    тридцати трёх профилей из восьмидесяти восьми, и это общая беда,
--    а не его. Разбирается отдельно.
-- 2) Девять матчей не дали карточке ни одного очка. Проверить, почему:
--    либо матчи дружеские, либо очки не начислялись.

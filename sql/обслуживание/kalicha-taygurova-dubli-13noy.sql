-- СЛИЯНИЕ ДУБЛЕЙ «КАЛИЧА ТАЙГУРОНОВА». 13.11, ШАГ 1 — ТОЛЬКО ЧТЕНИЕ
--
-- Четвёртый случай той же породы после Эрмека Абакирова (04.11), Эрлана
-- Шекербекова (12.11) и Данияра Атаханова (13.11). Видно в админке
-- (admin.html#players, поиск «Калича»):
--
--   Калича Тайгурова     Tour   175 очков   2/3   написание НЕВЕРНОЕ
--   Калича Тайгуронова    —       0 очков   0/0   написание ВЕРНОЕ
--
-- ПРАВИЛЬНОЕ НАПИСАНИЕ — «Калича Тайгуронова», слово Кости 13.11.
--
-- ОТЛИЧИЕ ОТ ТРЁХ ПРЕЖНИХ СЛУЧАЕВ, И ОНО МЕНЯЕТ ПОРЯДОК ДЕЙСТВИЙ.
-- Раньше верным было имя той карточки, где лежали очки, и хватало
-- перевести ссылки и удалить пустую. Здесь наоборот: очки лежат на
-- карточке с ОПЕЧАТКОЙ, а верное написание — у пустой. Значит после
-- слияния оставшуюся карточку надо ещё и ПЕРЕИМЕНОВАТЬ.
--
-- ЖИВОЙ ОСТАЁТСЯ КАРТОЧКА С ОЧКАМИ, А НЕ С ВЕРНЫМ ИМЕНЕМ. Имя — одно
-- поле, его легко поправить; очки, матчи, история рейтинга и форма
-- висят на id, и перенести их запросом значит переписать половину
-- таблиц. Поэтому живёт карточка Tour со 175 очками, а верное имя
-- переезжает на неё.
--
-- ID НЕ ПЕРЕИМЕНОВЫВАЕТСЯ ВМЕСТЕ С ИМЕНЕМ. На `players.id` висят
-- внешние ключи, и часть из них с ON DELETE CASCADE. Менять id значит
-- трогать каждую ссылку; выгоды никакой — id человеку не показывается.
--
-- ФАЙЛ СХЕМЫ — НЕ ИСТОЧНИК ПРАВДЫ О БОЕВОЙ (урок 13.11: три запроса
-- подряд упали на колонках, которых в боевой нет). Поэтому шаг 0 —
-- список связей из information_schema живой базы, и только по нему
-- пишется правка.
--
-- ЭТОТ ФАЙЛ НИЧЕГО НЕ МЕНЯЕТ. Здесь только чтение. Правка будет
-- написана по его ответу — с настоящими id, а не с угаданными.

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

-- ---- 1. ОБЕ КАРТОЧКИ ЦЕЛИКОМ -----------------------------------------
-- Ищем по корню «айгур», чтобы поймать оба написания сразу и не
-- промахнуться на «о» в середине.
SELECT id, name, name_en, name_kg, category_id, points, wins, losses,
       gender, is_guest, has_account, is_member, country, photo IS NOT NULL AS est_foto,
       created_at
  FROM public.players
 WHERE name ILIKE '%айгур%'
 ORDER BY points DESC;

-- ---- 2. ЧТО ВИСИТ НА КАЖДОЙ ИЗ НИХ -----------------------------------
-- Одна таблица, одна строка на карточку: сразу видно, кто из двух
-- пустой на самом деле, а не по виду в списке.
SELECT p.id,
       p.name,
       p.points,
       (SELECT count(*) FROM public.profiles                 WHERE player_id = p.id) AS akkaunty,
       (SELECT count(*) FROM public.tournament_registrations WHERE player_id = p.id) AS zayavki,
       (SELECT count(*) FROM public.tournament_registrations WHERE partner_id = p.id) AS zayavki_partner,
       (SELECT count(*) FROM public.matches
         WHERE player1_id = p.id OR player2_id = p.id)                               AS matchi,
       (SELECT count(*) FROM public.player_link_requests     WHERE player_id = p.id) AS zayavki_privyazki
  FROM public.players p
 WHERE p.name ILIKE '%айгур%'
 ORDER BY p.points DESC;

-- ---- 3. ЕСТЬ ЛИ У НЕЁ ЗАЯВКИ НА ТУРНИРЫ, И В КАКОМ ОНИ СОСТОЯНИИ -----
-- У Данияра здесь и была опасность: заявка висела на пустой карточке и
-- ушла бы каскадом при удалении, молча и без ошибки.
SELECT r.player_id, r.partner_id, r.status, t.name AS turnir, r.tournament_id
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.player_id IN (SELECT id FROM public.players WHERE name ILIKE '%айгур%')
    OR r.partner_id IN (SELECT id FROM public.players WHERE name ILIKE '%айгур%');

-- РАЗБОР 29.09: «старая пара выходит из группы после замены»
-- и «поменяли счёт — плей-офф поехал».
--
-- ТОЛЬКО ЧТЕНИЕ. Ни одного UPDATE, INSERT или DELETE.
-- id подставлены прямо: редактор Supabase не знает psql-овского \set.
--
-- ПОПРАВКА К ПЕРВОЙ ВЕРСИИ: у турнира столбец `title`, а не `name` —
-- я написал по памяти и получил 42703. Теперь все имена сверены с кодом
-- и со схемой: tournaments.title (tournaments.js:787), reserved_spots
-- (tournaments.js:1784), registration_changes (sql/схема/zameny-istoriya.sql).
--
-- Что проверяем. В коде видно место, где замена может не доехать до матча:
-- bracket.js:303 `if (м.player1_id === новый || м.player2_id === новый) continue;`
-- матч, где новый игрок УЖЕ стоит, пропускается целиком — и в нём остаётся
-- ПРЕЖНИЙ. Одного такого матча хватает, чтобы старая пара попала в таблицу
-- группы: места считаются из player1_id/player2_id матчей (bracket.js:4724).

-- 1. ЧТО ЭТО ЗА ТУРНИРЫ
SELECT id, title, format, bracket_type, status,
       max_participants, reserved_spots,
       group_count, qualifiers_per_group, playoff_format
FROM tournaments
WHERE id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
             'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
             '153bc688-41c3-475a-9b5f-31f2cca1c5c6');

-- 2. БЫЛИ ЛИ ЗАМЕНЫ И КАКИЕ
SELECT tournament_id, registration_id, side,
       old_name, new_name, old_player_id, new_player_id, created_at
FROM registration_changes
WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                        'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
                        '153bc688-41c3-475a-9b5f-31f2cca1c5c6')
ORDER BY tournament_id, created_at;

-- 3. ГЛАВНАЯ ПРОВЕРКА: игрок стоит в матче, но его нет в составе своей заявки
SELECT m.tournament_id, m.group_number, m.round, m.match_order,
       m.status, m.score, 'player1' AS сторона,
       m.player1_id AS игрок_в_матче,
       r.id AS заявка, r.player_id AS основной_в_заявке, r.partner_id AS напарник
FROM matches m
JOIN tournament_registrations r ON r.id = m.reg1_id
WHERE m.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                          'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
                          '153bc688-41c3-475a-9b5f-31f2cca1c5c6')
  AND m.player1_id IS NOT NULL
  AND m.player1_id <> r.player_id
  AND (r.partner_id IS NULL OR m.player1_id <> r.partner_id)
UNION ALL
SELECT m.tournament_id, m.group_number, m.round, m.match_order,
       m.status, m.score, 'player2',
       m.player2_id,
       r.id, r.player_id, r.partner_id
FROM matches m
JOIN tournament_registrations r ON r.id = m.reg2_id
WHERE m.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                          'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
                          '153bc688-41c3-475a-9b5f-31f2cca1c5c6')
  AND m.player2_id IS NOT NULL
  AND m.player2_id <> r.player_id
  AND (r.partner_id IS NULL OR m.player2_id <> r.partner_id)
ORDER BY 1, 2, 4;

-- 4. СКОЛЬКО РАЗНЫХ ИГРОКОВ ВИДИТ ТАБЛИЦА ГРУППЫ.
--    Лишний игрок здесь = лишняя строка в таблице мест.
SELECT tournament_id, group_number,
       count(DISTINCT p)  AS игроков_в_матчах,
       count(DISTINCT rg) AS заявок_в_матчах
FROM (
    SELECT tournament_id, group_number, player1_id AS p, reg1_id AS rg
    FROM matches
    WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                            'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
                            '153bc688-41c3-475a-9b5f-31f2cca1c5c6')
      AND group_number > 0
    UNION ALL
    SELECT tournament_id, group_number, player2_id, reg2_id
    FROM matches
    WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                            'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
                            '153bc688-41c3-475a-9b5f-31f2cca1c5c6')
      AND group_number > 0
) x
WHERE p IS NOT NULL
GROUP BY tournament_id, group_number
ORDER BY 1, 2;

-- 5. ТРЕТИЙ ТУРНИР: плей-офф. Клетка ждёт метку, а метку никто не заполнил —
--    вот и «поехало криво косо».
SELECT round, round_number, match_order, status, score,
       slot1_label, slot2_label, player1_id, player2_id, winner_id
FROM matches
WHERE tournament_id = '153bc688-41c3-475a-9b5f-31f2cca1c5c6'
  AND (group_number IS NULL OR group_number = 0)
ORDER BY round_number, match_order;

-- 6. ТРЕТИЙ ТУРНИР: группы целиком, чтобы сверить места руками
SELECT group_number, round_number, match_order, status, score,
       player1_id, player2_id, winner_id, reg1_id, reg2_id
FROM matches
WHERE tournament_id = '153bc688-41c3-475a-9b5f-31f2cca1c5c6'
  AND group_number > 0
ORDER BY group_number, round_number, match_order;

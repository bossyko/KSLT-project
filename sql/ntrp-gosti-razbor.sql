-- ============================================================
-- Разбор гостей после заливки NTRP
-- ============================================================
--
-- После загрузки списков часть карточек осталась в гостях. Costa прошёлся по
-- ним и решил:
--
--   • шестнадцать человек — члены клуба, просто в файлы не попали. Возвращаем
--     их в игроки; рейтинг проставим, когда он появится в списке;
--   • Константин Хан, Тенниса Ракетовна и Иван Иванов — пробные записи.
--     Их матч был тестовым, карточки удаляем. Учётная запись Константина
--     остаётся: она админская и к карточке игрока отношения не имеет;
--   • остальные двадцать — настоящие гости, их не трогаем.
--
-- Запускать можно повторно.

BEGIN;

-- ---- 1. Шестнадцать человек — снова игроки клуба ----

UPDATE players SET is_guest = false
 WHERE id IN (
        'ruslan-kalimov',
        'erkin-kerimbaev',
        'natalya-timirbaeva',
        'ulan-tagaybek-uulu',
        'adilet-kanatbekov',
        'daniyar-dzhaylokeev',
        'dmitriy-rakov',
        'igor-kan',
        'sanzhar-sultanov',
        'chingis-chukin',
        'anayat-abithanova',
        'baatyr-akimaliev',
        'baatyr-bakytbek',
        'kalicha-tayguronova',
        'liliya-rahmatulina',
        'mirbek-dyushenaliev'
 );

-- ---- 2. Пробный матч ----
-- Он вне турнира: tournament_id пустой, счёт 6/3 6/4 между двумя пробными
-- карточками. Удаляем и его, и записи рейтинга, которые он породил.

-- Сначала вызов на баттл, из которого этот матч вырос: он ссылается на
-- матч, и пока ссылка жива, база удалить не даст.

DELETE FROM challenge_predictions
 WHERE challenge_id IN (
        SELECT c.id FROM challenges c
         WHERE c.challenger_player_id IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov')
            OR c.opponent_player_id  IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov')
            OR c.match_id IN (SELECT id FROM matches
                               WHERE tournament_id IS NULL
                                 AND (player1_id IN ('han-konstantin', 'tennisa-raketovna')
                                   OR player2_id IN ('han-konstantin', 'tennisa-raketovna'))));

DELETE FROM challenges
 WHERE challenger_player_id IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov')
    OR opponent_player_id  IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov')
    OR match_id IN (SELECT id FROM matches
                     WHERE tournament_id IS NULL
                       AND (player1_id IN ('han-konstantin', 'tennisa-raketovna')
                         OR player2_id IN ('han-konstantin', 'tennisa-raketovna')));

DELETE FROM matches
 WHERE tournament_id IS NULL
   AND (player1_id IN ('han-konstantin', 'tennisa-raketovna')
     OR player2_id IN ('han-konstantin', 'tennisa-raketovna'));

DELETE FROM rating_history
 WHERE player_id IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov');

-- ---- 3. Пробные карточки ----
-- Сперва отвязываем от них учётные записи, иначе база не даст удалить.

UPDATE profiles SET player_id = NULL
 WHERE player_id IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov');

DELETE FROM players
 WHERE id IN ('han-konstantin', 'tennisa-raketovna', 'ivan-ivanov');

COMMIT;

-- Что получилось
SELECT count(*) FILTER (WHERE NOT is_guest) AS игроков_клуба,
       count(*) FILTER (WHERE is_guest)     AS гостей,
       count(*) FILTER (WHERE ntrp_singles IS NOT NULL) AS с_рейтингом,
       count(*) AS всего
  FROM players;

-- Кто остался без рейтинга среди игроков клуба
SELECT name, gender FROM players
 WHERE NOT is_guest AND ntrp_singles IS NULL
 ORDER BY name;

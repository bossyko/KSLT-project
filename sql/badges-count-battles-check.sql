-- ============================================================
-- Проверка: значки считают баттлы — только чтение
-- ============================================================
--
-- Запускать до и после badges-count-battles.sql. Ничего не меняет.

-- 1. Кто сколько сыграл и выиграл по самим матчам, и что стоит в карточке.
--    Расхождение между «выиграл» и «побед_в_карточке» — это баттлы:
--    в рейтинг они не идут, а в значки теперь идут.
SELECT p.id,
       p.name                                                        AS игрок,
       COUNT(m.id)                                                   AS сыграл,
       COUNT(*) FILTER (WHERE m.winner_id = p.id)                    AS выиграл,
       p.wins                                                        AS побед_в_карточке,
       COUNT(*) FILTER (WHERE m.tournament_id IS NULL)               AS из_них_баттлов
  FROM players p
  JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
                AND m.status = 'completed'
 GROUP BY p.id, p.name, p.wins
 ORDER BY сыграл DESC;

-- 2. Значки, связанные с матчами и победами, — у кого стоят.
--    После правки у выигравшего баттл должна появиться «Первая победа».
SELECT pb.player_id,
       p.name       AS игрок,
       pb.badge_id  AS значок,
       bd.name      AS название,
       pb.earned_at AS получен
  FROM player_badges pb
  JOIN players p ON p.id = pb.player_id
  JOIN badge_definitions bd ON bd.id = pb.badge_id
 WHERE bd.condition_type IN ('matches_played', 'wins', 'streak')
 ORDER BY pb.earned_at DESC;

-- 3. Поимённо по конкретному человеку — подставить свой номер.
--
-- SELECT * FROM public.check_and_award_badges('han-konstantin');
--
-- Функция возвращает список только что выданных значков. Пустой список
-- значит, что всё нужное уже стоит.

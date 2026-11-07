-- ============================================================
-- ЧТО СЕЙЧАС У ТУРНИРА 064c6018 — ТОЛЬКО ЧТЕНИЕ, ОДИН ЗАПРОС
-- ============================================================
--
-- ПОВОД: просьба скинуть турнир до заявок. Удаление матчей необратимо,
-- поэтому сначала видно, ЧТО именно снесётся.
--
-- КАК ЧИТАТЬ:
--   sygrano > 0  → есть матчи со счётом. Сама админка в этом случае
--       пережеребить ОТКАЗЫВАЕТСЯ (bracket.js:7688). Сброс тоже
--       откажется — и это правильно: счёт восстановить будет нечем
--   rezultatov или reytinga > 0 → турнир уже подводили: очки разошлись
--       по карточкам. Это отдельный разговор, одним сбросом не лечится

SELECT  t.title,
        t.status                                            AS status_turnira,
        t.draw_seed,
        (SELECT count(*) FROM matches m
          WHERE m.tournament_id = t.id)                     AS matchey,
        (SELECT count(*) FROM matches m
          WHERE m.tournament_id = t.id
            AND (m.score IS NOT NULL OR m.winner_id IS NOT NULL)) AS sygrano,
        (SELECT count(*) FROM tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'draw')     AS zayavok_v_setke,
        (SELECT count(*) FROM tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'approved') AS zayavok_approved,
        (SELECT count(*) FROM tournament_registrations r
          WHERE r.tournament_id = t.id AND r.status = 'waitlist') AS v_ozhidanii,
        (SELECT count(*) FROM tournament_results tr
          WHERE tr.tournament_id = t.id)                    AS rezultatov,
        (SELECT count(*) FROM rating_history rh
          WHERE rh.tournament_id = t.id)                    AS zapisey_reytinga
FROM    tournaments t
WHERE   t.id = '064c6018-a3cd-4abb-95e8-ed818274c86a';

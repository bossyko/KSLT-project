-- СЛЕПОК ТУРНИРА ДО ЖЕРЕБЬЁВКИ. 05.11
--
-- Слово Кости 05.11: «сделай слепок данного турнира — я хочу прогнать
-- его и посмотреть, что там у нас есть выбор, кто в высшую пойдёт, кто
-- вниз уйдёт, и потом сбросить результаты и жеребьёвку; надо запомнить
-- до момента жеребьёвки, потом я сделаю один прогон в базе и всё
-- вернётся».
--
--   турнир → 6c6a7913-6b55-4af4-af9b-f0419ba69363
--
-- ЧТО ЗАПОМИНАЕТСЯ, И ПОЧЕМУ НЕ ТОЛЬКО ЗАЯВКИ. Прогон турнира целиком
-- трогает ПЯТЬ мест, а не одно: жеребьёвка меняет заявки и заводит
-- матчи, завершение пишет итоги, историю рейтинга и ОЧКИ САМИХ
-- ИГРОКОВ, а лояльность начисляет участникам. Вернуть одни заявки
-- значит оставить игрокам очки за турнир, которого больше нет.
--
--   1. строка турнира целиком (статус, группы, ручной выбор лиги, жребий)
--   2. все заявки
--   3. все матчи
--   4. итоги турнира
--   5. очки, победы, поражения и форма ВСЕХ его участников
--   6. строки истории рейтинга по этому турниру
--
-- СЛЕПОК СНИМАЕТСЯ ОДИН РАЗ И ПЕРЕЗАПИСЫВАТЬСЯ НЕ ДОЛЖЕН: второй прогон
-- этого файла ПОСЛЕ жеребьёвки запомнит уже испорченное состояние.
-- Поэтому таблицы создаются с проверкой и говорят, если уже есть.
--
-- ВОЗВРАТ ЛЕЖИТ ОТДЕЛЬНЫМ ФАЙЛОМ:
--   sql/обслуживание/vernut-turnir-6c6a7913-0511.sql
--
--   sql/обслуживание/slepok-turnira-6c6a7913-0511.sql


-- ── 1. ОТКАЗАТЬСЯ, ЕСЛИ СЛЕПОК УЖЕ ЕСТЬ ──────────────────────────────
-- Ждём: `net` — можно снимать. `EST` — слепок уже снят, ВТОРОЙ РАЗ НЕ
-- ГНАТЬ: он запомнит состояние после жеребьёвки вместо нужного.
/* ИМЕНИ ТАБЛИЦЫ ЗДЕСЬ НЕТ НАМЕРЕННО, И ЭТО ПОПРАВКА 05.11.
   Первая редакция считала в ветке `ELSE` строки слепка — и запрос падал
   `relation does not exist` ещё ДО того, как что-то проверил: Postgres
   разбирает имена во ВСЕХ ветках `CASE`, а не только в той, что
   выполнится. ПРОВЕРКА, КОТОРАЯ ПАДАЕТ РАНЬШЕ, ЧЕМ ПРОВЕРИТ, НЕ
   ПРОВЕРЯЕТ НИЧЕГО. `to_regclass` спрашивает каталог и не трогает
   саму таблицу. */
SELECT CASE WHEN to_regclass('public.slepok6c_turnir') IS NULL
            THEN 'net — слепка нет, гони дальше'
            ELSE 'EST — слепок уже снят, второй раз НЕ ГНАТЬ' END AS mozhno_li;


-- ── 2. СНЯТЬ СЛЕПОК ──────────────────────────────────────────────────
-- Шесть таблиц. Все поля целиком — `SELECT *`, чтобы вернулось и то,
-- о чём я сегодня не подумал.
CREATE TABLE IF NOT EXISTS public.slepok6c_turnir AS
SELECT * FROM public.tournaments
 WHERE id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

CREATE TABLE IF NOT EXISTS public.slepok6c_zayavki AS
SELECT * FROM public.tournament_registrations
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

CREATE TABLE IF NOT EXISTS public.slepok6c_matchi AS
SELECT * FROM public.matches
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

CREATE TABLE IF NOT EXISTS public.slepok6c_itogi AS
SELECT * FROM public.tournament_results
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

CREATE TABLE IF NOT EXISTS public.slepok6c_istoriya AS
SELECT * FROM public.rating_history
 WHERE tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363';

/* ОЧКИ ИГРОКОВ — ПО ВСЕМ УЧАСТНИКАМ, И КАПИТАНАМ, И НАПАРНИЦАМ.
   Завершение турнира пересчитывает `points`, `wins`, `losses` и `form`
   (`bracket.js:14230`). Без этой таблицы возврат снёс бы турнир, а очки
   за него остались бы висеть на карточках. */
CREATE TABLE IF NOT EXISTS public.slepok6c_igroki AS
SELECT p.id, p.points, p.wins, p.losses, p.form, p.rank_change
  FROM public.players p
 WHERE p.id IN (
       SELECT r.player_id FROM public.tournament_registrations r
        WHERE r.tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363'
          AND r.player_id IS NOT NULL
       UNION
       SELECT r.partner_id FROM public.tournament_registrations r
        WHERE r.tournament_id = '6c6a7913-6b55-4af4-af9b-f0419ba69363'
          AND r.partner_id IS NOT NULL);


-- ── 3. ПРОВЕРКА ЧТЕНИЕМ: ЧТО ИМЕННО ЗАПОМНЕНО ────────────────────────
-- Ждём: турнир 1, заявок 19, матчей 0, итогов 0, истории 0, игроков 38.
-- Матчей НОЛЬ — это и значит «до жеребьёвки».
SELECT 'турнир'   AS chto, count(*) AS strok FROM public.slepok6c_turnir
UNION ALL SELECT 'заявки',   count(*) FROM public.slepok6c_zayavki
UNION ALL SELECT 'матчи',    count(*) FROM public.slepok6c_matchi
UNION ALL SELECT 'итоги',    count(*) FROM public.slepok6c_itogi
UNION ALL SELECT 'история',  count(*) FROM public.slepok6c_istoriya
UNION ALL SELECT 'игроки',   count(*) FROM public.slepok6c_igroki
ORDER BY 1;

-- ====================================================================
-- ДРУЖЕСКИЙ МУЖСКОЙ ПАРНЫЙ 29.10 — ШАГ 2: ЗАЛИВКА ЗАЯВОК.
-- Турнир ОДИН (слово Кости 29.10). 22 пары в сетку, 4 в лист ожидания.
-- Запускать можно повторно: заявки не задваиваются, карточка тоже.
--
-- ИМЕНА СВЕДЕНЫ по выводу zayavki-sverka-imen.sql: 44 из 52 точно,
-- семь опознаны похожестью в одну букву и ПОКАЗАНЫ Косте списком,
-- один — Бек Кыдыргычов — карточки не имел вовсе и заводится ниже.
--
-- ПОРЯДОК. Принятые сортируются по registered_at (bracket.js:2586,
-- :4539, :7352), лист ожидания — по queue_at (:888, :4543). Отметки
-- взяты из формы, КРОМЕ ОДНОЙ: у №21 (Байгубатов + Юнусов) в форме
-- 21:42:01.125, что РАНЬШЕ №20 (22:12:27). Костя сказал «порядок
-- оставить такой какой стоит», поэтому у №21 стоит 22:12:28. Это
-- единственное число не из формы.
-- ====================================================================

-- ---- КУДА КЛАДЁМ: видно глазами до правки ----
SELECT id, title, date_start, max_participants, reserved_spots, status
  FROM tournaments
 WHERE format = 'doubles' AND gender = 'men'
 ORDER BY date_start DESC NULLS LAST LIMIT 10;

BEGIN;

-- Турнир один. Если признак поймал не ровно один — падаем, ничего не
-- записав: лучше упасть, чем залить не туда.
CREATE TEMP TABLE цель ON COMMIT DROP AS
SELECT id FROM tournaments
 WHERE format = 'doubles' AND gender = 'men'
   AND title ILIKE '%дружеск%' AND date_start >= DATE '2026-10-25';
DO $$ BEGIN
  IF (SELECT count(*) FROM цель) <> 1 THEN
    RAISE EXCEPTION 'Турниров поймано %, нужен ровно один — уточни признак',
                    (SELECT count(*) FROM цель);
  END IF;
END $$;

-- ---- СЛЕПОК ДО ПРАВКИ ----
DROP TABLE IF EXISTS public.slepok_registrations_2910;
CREATE TABLE public.slepok_registrations_2910 AS
SELECT r.* FROM public.tournament_registrations r
 WHERE r.tournament_id IN (SELECT id FROM цель);

-- ---- БЕК КЫДЫРГЫЧОВ: СНАЧАЛА ИЩЕМ, ПОТОМ ЗАВОДИМ ----
-- Костя сказал: «Бек Кыдыргычев посмотри может есть он». Сверка его не
-- показала даже кандидатом, потому что ключ ищет СЛОВО ЦЕЛИКОМ, а
-- «кыдыргычов» и «кыдыргычев» — разные слова. ПРИЗНАК, ИЩУЩИЙ СЛОВО
-- ЦЕЛИКОМ, НЕ ВИДИТ РАСХОЖДЕНИЯ В ОДНОЙ БУКВЕ ВНУТРИ СЛОВА.
-- Поэтому ищем по началу фамилии.
CREATE TEMP TABLE бек (id text) ON COMMIT DROP;
INSERT INTO бек SELECT id FROM public.players
 WHERE lower(translate(name, 'ёЁ', 'ее')) LIKE '%%кыдыргыч%%';

DO $$
DECLARE сколько int;
BEGIN
  SELECT count(*) INTO сколько FROM бек;
  IF сколько > 1 THEN
    RAISE EXCEPTION 'Карточек с «Кыдыргыч» нашлось % — сводить сам не буду, покажи их', сколько;
  ELSIF сколько = 0 THEN
    INSERT INTO public.players (id, name, country, category_id, gender)
    VALUES ('bek-kydyrgychov', 'Бек Кыдыргычов', '🇰🇬', 'masters', 'men');
    INSERT INTO бек VALUES ('bek-kydyrgychov');
  END IF;
END $$;

-- ---- 22 ПАРЫ В СЕТКУ ----
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, registered_at,
     seat_pool, gender_confirmed)
SELECT ц.id, игр.id, нап.id, з.статус, з.подано, 'online',
       (SELECT p1.gender = 'men' AND p2.gender = 'men'
          FROM public.players p1, public.players p2
         WHERE p1.id = игр.id AND p2.id = нап.id)
  FROM цель ц, (VALUES
  ('azamat-dzhumabaev','iskender-kurmanov','approved',TIMESTAMPTZ '2026-10-27 16:15:11.772',1,'masters'),
  ('chingis-chukin','ilzat-husainov','approved',TIMESTAMPTZ '2026-10-27 16:15:31.567',2,'futures'),
  ('mirbek-dyushenaliev','baatyr-bakytbek','approved',TIMESTAMPTZ '2026-10-27 16:21:42.563',3,'futures'),
  ('ernest-takirov','zamir-borubaev','approved',TIMESTAMPTZ '2026-10-27 16:22:09.160',4,'masters'),
  ('azim-isakov','vladislav-kim','approved',TIMESTAMPTZ '2026-10-27 16:29:26.561',5,'masters'),
  ('bek-kydyrgychov','ulukbek-bekbosunov','approved',TIMESTAMPTZ '2026-10-27 16:44:16.248',6,'masters'),
  ('furkat-sadykov','abdikiim-mahmutov','approved',TIMESTAMPTZ '2026-10-27 17:33:10.947',7,'masters'),
  ('ildiyar-murataliev','murat-noruzbaev-2','approved',TIMESTAMPTZ '2026-10-27 17:53:16.923',8,'masters'),
  ('ruslan-kuldzhaev','zhanat-kydraliev','approved',TIMESTAMPTZ '2026-10-27 17:53:29.355',9,'masters'),
  ('sadyrbek-tovkeev','karim-imanhodzhaev','approved',TIMESTAMPTZ '2026-10-27 18:05:42.998',10,'masters'),
  ('omuradil-sydykov','mirdias-tumenbaev','approved',TIMESTAMPTZ '2026-10-27 18:14:57.989',11,'masters'),
  ('iskender-kadyrov','tilegen-mamyrkaliev','approved',TIMESTAMPTZ '2026-10-27 18:28:56.364',12,'futures'),
  ('ulan-kasenov','eren-kamchibekov','approved',TIMESTAMPTZ '2026-10-27 18:40:02.310',13,'futures'),
  ('adilet-asanov','pogorelov-roman','approved',TIMESTAMPTZ '2026-10-27 18:46:41.947',14,'futures'),
  ('azat-mukaev','iskender-seydimatov','approved',TIMESTAMPTZ '2026-10-27 18:56:56.391',15,'futures'),
  ('bekzhan-kylychbekov','adham-ubaydullaev','approved',TIMESTAMPTZ '2026-10-27 19:04:14.230',16,'futures'),
  ('esendiyar-adylov','daniyar-lyamin','approved',TIMESTAMPTZ '2026-10-27 19:18:26.550',17,'masters'),
  ('dzhantay-otorbaev','eldar-kuldzhaev','approved',TIMESTAMPTZ '2026-10-27 20:34:51.336',18,'masters'),
  ('raimbek-tabaldiev','batyr-mavlyanov','approved',TIMESTAMPTZ '2026-10-27 21:57:10.488',19,'futures'),
  ('avtandil-ernest','dmitriy-bondarev','approved',TIMESTAMPTZ '2026-10-27 22:12:27.134',20,'masters'),
  ('timur-baygubatov','ruslan-yunusov','approved',TIMESTAMPTZ '2026-10-27 22:12:28',21,'futures'),
  ('temirbek-musaev','aleksandr-fomin','approved',TIMESTAMPTZ '2026-10-27 22:15:08.195',22,'masters')
       ) AS з(игрок, напарник, статус, подано, ном, кат)
  -- Бек мог лежать под другим написанием фамилии: берём найденный id
  CROSS JOIN LATERAL (SELECT CASE WHEN з.игрок = 'bek-kydyrgychov'
                                  THEN (SELECT id FROM бек) ELSE з.игрок END) AS игр(id)
  CROSS JOIN LATERAL (SELECT CASE WHEN з.напарник = 'bek-kydyrgychov'
                                  THEN (SELECT id FROM бек) ELSE з.напарник END) AS нап(id)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = ц.id AND r.player_id = игр.id);

-- ---- 4 ПАРЫ В ЛИСТ ОЖИДАНИЯ ----
-- waitlisted_at = время формы: здесь оно растёт по строкам файла,
-- выправлять нечего. registered_at не переписываем смыслом очереди.
INSERT INTO public.tournament_registrations
    (tournament_id, player_id, partner_id, status, registered_at,
     waitlisted_at, seat_pool, gender_confirmed)
SELECT ц.id, игр.id, нап.id, з.статус, з.подано, з.подано, 'online',
       (SELECT p1.gender = 'men' AND p2.gender = 'men'
          FROM public.players p1, public.players p2
         WHERE p1.id = игр.id AND p2.id = нап.id)
  FROM цель ц, (VALUES
  ('bulat-tsoy','salman-beyshenaliev','waitlist',TIMESTAMPTZ '2026-10-27 22:51:17.101',1,'masters'),
  ('argen-shakidiev','elzar-azhibaev','waitlist',TIMESTAMPTZ '2026-10-28 01:12:51.548',2,'futures'),
  ('ahmedzhan-adzhuev','kamil-yakupov','waitlist',TIMESTAMPTZ '2026-10-28 14:08:48.279',3,'futures'),
  ('erlan-sydykov','denis-li','waitlist',TIMESTAMPTZ '2026-10-28 14:10:57.596',4,'masters')
       ) AS з(игрок, напарник, статус, подано, ном, кат)
  -- Бек мог лежать под другим написанием фамилии: берём найденный id
  CROSS JOIN LATERAL (SELECT CASE WHEN з.игрок = 'bek-kydyrgychov'
                                  THEN (SELECT id FROM бек) ELSE з.игрок END) AS игр(id)
  CROSS JOIN LATERAL (SELECT CASE WHEN з.напарник = 'bek-kydyrgychov'
                                  THEN (SELECT id FROM бек) ELSE з.напарник END) AS нап(id)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = ц.id AND r.player_id = игр.id);

COMMIT;

-- ====================================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»
-- ====================================================================

-- 1. Числа. Ждём: approved 22, waitlist 4.
SELECT t.title, r.status, count(*)
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE t.format = 'doubles' AND t.gender = 'men'
   AND t.title ILIKE '%дружеск%' AND t.date_start >= DATE '2026-10-25'
 GROUP BY 1, 2 ORDER BY 1, 2;

-- 2. ПОРЯДОК СОВПАЛ С ФАЙЛОМ. Ждём 1..22 подряд без пропусков и без
--    перестановок — это и есть «порядок как в файле».
SELECT row_number() OVER (ORDER BY r.registered_at) AS место_в_админке,
       p.name AS первый, p2.name AS второй,
       r.registered_at
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
  LEFT JOIN public.players p  ON p.id  = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE t.format = 'doubles' AND t.gender = 'men'
   AND t.title ILIKE '%дружеск%' AND t.date_start >= DATE '2026-10-25'
   AND r.status = 'approved'
 ORDER BY r.registered_at;

-- 3. Очередь ожидания — по queue_at. Ждём 4 строки в порядке файла.
SELECT row_number() OVER (ORDER BY r.queue_at) AS место_в_очереди,
       p.name AS первый, p2.name AS второй, r.queue_at
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
  LEFT JOIN public.players p  ON p.id  = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE t.format = 'doubles' AND t.gender = 'men'
   AND t.title ILIKE '%дружеск%' AND t.date_start >= DATE '2026-10-25'
   AND r.status = 'waitlist'
 ORDER BY r.queue_at;

-- 4. Пол пары вычислен, а не выдуман. Ждём 26 строк true.
SELECT r.gender_confirmed, count(*)
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE t.format = 'doubles' AND t.gender = 'men'
   AND t.title ILIKE '%дружеск%' AND t.date_start >= DATE '2026-10-25'
 GROUP BY 1;

-- 5. Никто не стоит дважды — ни участником, ни напарником. Ждём ПУСТО.
SELECT кто, count(*) FROM (
  SELECT r.player_id AS кто FROM public.tournament_registrations r
    JOIN public.tournaments t ON t.id = r.tournament_id
   WHERE t.format='doubles' AND t.gender='men' AND t.title ILIKE '%дружеск%'
     AND t.date_start >= DATE '2026-10-25'
  UNION ALL
  SELECT r.partner_id FROM public.tournament_registrations r
    JOIN public.tournaments t ON t.id = r.tournament_id
   WHERE t.format='doubles' AND t.gender='men' AND t.title ILIKE '%дружеск%'
     AND t.date_start >= DATE '2026-10-25' AND r.partner_id IS NOT NULL) x
 GROUP BY кто HAVING count(*) > 1;

-- 6. Карточка Бека — какая взялась и как называется в базе.
SELECT id, name, gender, category_id FROM public.players
 WHERE lower(translate(name, 'ёЁ', 'ее')) LIKE '%кыдыргыч%';

-- 7. Слепок цел, пока ты не посмотрел глазами.
SELECT count(*) AS было_заявок_до_правки FROM public.slepok_registrations_2910;

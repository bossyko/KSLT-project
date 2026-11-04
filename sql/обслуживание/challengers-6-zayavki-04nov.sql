-- ЗАЯВКИ CHALLENGERS 6 — ЗАЛИВКА. 04.11
-- Турнир 382222ba-e396-4ece-9807-7358594d256c
-- Порядок и правила те же, что 14.10 (claude/kslt-zayavki-futures-14okt.md).
--
-- 27 в основу, 13 в лист ожидания. Сверено с базой тремя запросами:
-- 38 карточек из 40 уже есть, две заводятся здесь.
--
-- ЗАПУСКАТЬ МОЖНО ПОВТОРНО: заявки не задвоятся (NOT EXISTS), карточки
-- не перезапишутся (ON CONFLICT DO NOTHING), переименование и снятие
-- гостя привязаны к прежнему значению и второй раз просто не сработают.

BEGIN;

-- ---- 1. ДВЕ НОВЫЕ КАРТОЧКИ ----------------------------------------
-- Остальные 38 найдены в базе. Гостями не заводим: слово Кости 14.10 и
-- 04.11 — он же велел снять гостя с двоих ниже. ТОЛЬКО `is_guest = false`
-- пускает человека в рейтинг (`js/kslt-rules.js:888`).
--
-- ПРЕДПОЛОЖЕНИЕ, И Я ЕГО НАЗЫВАЮ: разряд обоим поставлен `futures` —
-- новая карточка без известного рейтинга встаёт на нижнюю ступень. В
-- файле у этих двоих колонка рейтинга пуста, померить негде. Не так —
-- хвост этого файла меняет одной строкой.
-- Имя впереди фамилии — правило Кости 14.10.

INSERT INTO public.players (id, name, country, category_id, gender,
                            is_member, is_guest, has_account)
VALUES
    ('daniil-orlov',   'Даниил Орлов',   '🇰🇬', 'futures', 'men', true, false, false),
    ('samat-kozhobaev','Самат Кожобаев', '🇰🇬', 'futures', 'men', true, false, false)
ON CONFLICT (id) DO NOTHING;

-- ---- 2. ИМЯ ВПЕРЕДИ ФАМИЛИИ ---------------------------------------
-- Слово Кости 04.11: отчество убираем. АДРЕС КАРТОЧКИ НЕ МЕНЯЕТСЯ —
-- на `players.id` двадцать внешних ключей без ON UPDATE CASCADE.
-- Старый сторож имён эту карточку не видел: он требует РОВНО два слова.

UPDATE public.players
   SET name = 'Эрмек Абакиров', updated_at = now()
 WHERE id = 'abakirov-ermek-kurmanbekovich'
   AND name = 'Абакиров Эрмек Курманбекович';

-- ---- 3. СНЯТЬ ГОСТЯ -----------------------------------------------
-- Слово Кости 04.11. Бесплатный период идёт, в рейтинг идут как все.

UPDATE public.players
   SET is_guest = false, updated_at = now()
 WHERE id IN ('batyr-mavlyanov', 'ruslan-yunusov')
   AND is_guest = true;

-- ---- 4. ЗАЯВКИ ----------------------------------------------------
-- `registered_at` — настоящее время подачи из формы, пояс Бишкека.
-- `waitlisted_at` — НАМЕРЕНО: порядок строк листа ожидания, как в файле
-- (там он стоит по рейтингу, а не по времени: challengers, Top Futures,
-- затем Futures по возрастанию). ПОСЧИТАНО: якорь 2026-11-04 11:00 —
-- позже самой поздней отметки файла (03.11 10:23:47), шаг минута. Числа
-- служат только порядку. Очередь считает база: `queue_at` =
-- COALESCE(waitlisted_at, registered_at), `sql/функции/ochered-vremya-postanovki.sql`.
-- Самат — последним в листе ожидания, слово Кости 04.11.

INSERT INTO public.tournament_registrations
    (tournament_id, player_id, status, registered_at, waitlisted_at)
SELECT '382222ba-e396-4ece-9807-7358594d256c',
       з.игрок, з.статус, з.подано::timestamptz, з.очередь::timestamptz
  FROM (VALUES
    ('kamil-yakupov', 'approved', '2026-11-02T14:15:33+06', NULL),
    ('elzar-azhibaev', 'approved', '2026-11-02T14:15:37+06', NULL),
    ('salih-ismailov', 'approved', '2026-11-02T14:15:39+06', NULL),
    ('zamir-borubaev', 'approved', '2026-11-02T14:15:39+06', NULL),
    ('salman-beyshenaliev', 'approved', '2026-11-02T14:15:45+06', NULL),
    ('sejtek-irsaliev', 'approved', '2026-11-02T14:15:50+06', NULL),
    ('adilet-kanatbekov', 'approved', '2026-11-02T14:15:52+06', NULL),
    ('stanislav-shumilin', 'approved', '2026-11-02T14:16:21+06', NULL),
    ('batyr-mavlyanov', 'approved', '2026-11-02T14:17:16+06', NULL),
    ('eren-kamchibekov', 'approved', '2026-11-02T14:17:41+06', NULL),
    ('iskender-kadyrov', 'approved', '2026-11-02T14:18:03+06', NULL),
    ('tilegen-mamyrkaliev', 'approved', '2026-11-02T14:18:54+06', NULL),
    ('esendiyar-adylov', 'approved', '2026-11-02T14:19:39+06', NULL),
    ('daniil-orlov', 'approved', '2026-11-02T14:22:10+06', NULL),
    ('aman-kanaev', 'approved', '2026-11-02T14:23:09+06', NULL),
    ('zhakshylyk-aytbaev', 'approved', '2026-11-02T14:24:17+06', NULL),
    ('taalay-esenamanov', 'approved', '2026-11-02T14:25:42+06', NULL),
    ('dzhantay-otorbaev', 'approved', '2026-11-02T14:33:36+06', NULL),
    ('nurbek-nurbekov', 'approved', '2026-11-02T14:37:24+06', NULL),
    ('azat-kubanychbek-uulu', 'approved', '2026-11-02T14:39:24+06', NULL),
    ('ibragim-koshoybekov', 'approved', '2026-11-02T14:46:48+06', NULL),
    ('ruslan-yunusov', 'approved', '2026-11-02T14:51:46+06', NULL),
    ('anvar-nasyrov', 'approved', '2026-11-02T15:22:04+06', NULL),
    ('adham-ubaydullaev', 'approved', '2026-11-02T16:38:22+06', NULL),
    ('abakirov-ermek-kurmanbekovich', 'approved', '2026-11-02T16:43:50+06', NULL),
    ('altynbek-zhanybekov', 'approved', '2026-11-02T18:17:59+06', NULL),
    ('azamat-nurdinov', 'approved', '2026-11-02T20:42:33+06', NULL),
    ('evgeniy-osipov', 'waitlist', '2026-11-02T21:14:15+06', '2026-11-04T11:00:00+06'),
    ('alan-adzhibekov', 'waitlist', '2026-11-03T10:23:47+06', '2026-11-04T11:01:00+06'),
    ('ahmedzhan-adzhuev', 'waitlist', '2026-11-02T18:05:21+06', '2026-11-04T11:02:00+06'),
    ('bahram-mambetov', 'waitlist', '2026-11-02T14:15:59+06', '2026-11-04T11:03:00+06'),
    ('dmitriy-pak', 'waitlist', '2026-11-02T15:06:46+06', '2026-11-04T11:04:00+06'),
    ('bakyt-kapakov', 'waitlist', '2026-11-02T16:08:23+06', '2026-11-04T11:05:00+06'),
    ('musa-zhanybekov', 'waitlist', '2026-11-02T14:18:54+06', '2026-11-04T11:06:00+06'),
    ('ulan-tagaybek-uulu', 'waitlist', '2026-11-02T14:21:13+06', '2026-11-04T11:07:00+06'),
    ('ashat-kerimbekov', 'waitlist', '2026-11-02T14:17:27+06', '2026-11-04T11:08:00+06'),
    ('aleksandr-kim', 'waitlist', '2026-11-03T08:48:10+06', '2026-11-04T11:09:00+06'),
    ('damirbek-kydykov', 'waitlist', '2026-11-03T01:42:08+06', '2026-11-04T11:10:00+06'),
    ('omuradil-sydykov', 'waitlist', '2026-11-02T14:22:20+06', '2026-11-04T11:11:00+06'),
    ('samat-kozhobaev', 'waitlist', '2026-11-02T15:19:48+06', '2026-11-04T11:12:00+06')
  ) AS з(игрок, статус, подано, очередь)
 WHERE NOT EXISTS (
     SELECT 1 FROM public.tournament_registrations r
      WHERE r.tournament_id = '382222ba-e396-4ece-9807-7358594d256c'
        AND r.player_id = з.игрок
 );

COMMIT;


-- ---- ПРОВЕРКА 1: сколько и каких --------------------------------
-- Ждём: approved 27, waitlist 13, всего 40.

SELECT status, count(*) AS skolko
  FROM public.tournament_registrations
 WHERE tournament_id = '382222ba-e396-4ece-9807-7358594d256c'
 GROUP BY status
 ORDER BY status;


-- ---- ПРОВЕРКА 2: очередь встала по файлу -------------------------
-- Ждём тринадцать строк в том же порядке, что в листе ожидания файла:
-- Осипов, Аджибеков, Аджуев, Мамбетов, Пак, Капаков, Жаныбеков,
-- Тагайбек уулу, Керимбеков, Ким, Кыдыков, Сыдыков, Кожобаев.

SELECT row_number() OVER (ORDER BY r.queue_at) AS mesto,
       p.name, r.registered_at, r.waitlisted_at
  FROM public.tournament_registrations r
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = '382222ba-e396-4ece-9807-7358594d256c'
   AND r.status = 'waitlist'
 ORDER BY r.queue_at;


-- ---- ПРОВЕРКА 3: карточки, имя и гость ---------------------------
-- Ждём: две новые на месте; «Эрмек Абакиров»; у обоих снятых gost = false.

SELECT id, name, category_id, is_guest, is_member
  FROM public.players
 WHERE id IN ('daniil-orlov', 'samat-kozhobaev',
              'abakirov-ermek-kurmanbekovich',
              'batyr-mavlyanov', 'ruslan-yunusov')
 ORDER BY name;


-- ---- ЕСЛИ РАЗРЯД НОВЫМ ДРУГОЙ ------------------------------------
-- Одной строкой, подставить нужный:
-- UPDATE public.players SET category_id = 'challenger'
--  WHERE id IN ('daniil-orlov', 'samat-kozhobaev');

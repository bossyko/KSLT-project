-- ============================================================
-- Заявки на дружеский микст-турнир Futures, 19 сентября
-- ============================================================
--
-- Перенос ответов из формы клуба («Микст — 19 сентября») в турнир
-- «Дружеский микст-турнир в категории FUTURES» — 24 места, пар в форме 28.
--
-- Порядок заявок сохранён: время подачи берём из формы, поэтому в админке
-- они лягут так же, как приходили. Кто стоит в форме выше отметки «Лист
-- ожидания» — «принята», ниже — «лист ожидания». Получается 19 принятых
-- и 9 ожидающих; места ещё есть, но очередь ведёт клуб, а не мы.
--
-- В форме две подкатегории — NTRP 7 (+0.25) и NTRP 7.5. Турнир на них не
-- делится, поэтому заявки идут в один общий список.
--
-- Имена сверены с карточками игроков: из 48 человек нашлись 42. Трое были
-- записаны с опечаткой и привязаны по совпадению: Норузбаев Мурат — это
-- Мурат Норзубаев, Табалдыев Раимбек — Раимбек Табалдиев, Табалдыева
-- Айканыш — Табалдиева Айканыш.
--
-- Шестерых в клубе нет — им заводим карточки гостя: в рейтинг такие не
-- идут, но в паре и в сетке они живые игроки, а не строка с именем.
-- Категория futures — по турниру, NTRP не ставим, его определит клуб.
--
-- Пара «Каракөз и Жакшылык» записалась одними именами, без фамилий, и
-- сверка их не нашла — сперва завели дублями. На деле это Каракоз
-- Болотбекова и Жакшылык Айтбаев, карточки в клубе есть.
--
-- «Определяется», «Ищу», «Нет» напарником не считаются: у восьми заявок
-- партнёр пустой, и в админке рядом будет кнопка «+ Добавить партнёра».
--
-- Посев не проставляем: пары сеются по сумме NTRP, когда жеребишь сетку.
--
-- Запускать можно повторно: прежние заявки этого турнира удаляются,
-- карточки гостей не задваиваются.

BEGIN;

-- ---- Карточки гостей ----

INSERT INTO public.players (id, name, gender, country, category_id,
                            is_member, is_guest, has_account)
VALUES
       ('eliza-omurzakova', 'Элиза Омурзакова', 'women', '🇰🇬', 'futures', false, true, false),
       ('urmat-alabaev', 'Урмат Алабаев', 'men', '🇰🇬', 'futures', false, true, false),
       ('aydar-aydarov', 'Айдар Айдаров', 'men', '🇰🇬', 'futures', false, true, false),
       ('ariana-kasymbekova', 'Ариана Касымбекова', 'women', '🇰🇬', 'futures', false, true, false),
       ('aynel-kazybaeva', 'Айнель Казыбаева', 'women', '🇰🇬', 'futures', false, true, false),
       ('aazhara-koychumanova', 'Аажара Койчуманова', 'women', '🇰🇬', 'futures', false, true, false)
ON CONFLICT (id) DO NOTHING;

-- ---- Заявки ----

DELETE FROM public.tournament_registrations
 WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695';

INSERT INTO public.tournament_registrations
       (tournament_id, player_id, external_name, is_external,
        partner_id, partner_external_name, partner_gender, status, registered_at)
VALUES
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'ibragim-koshoybekov', NULL, false, 'asel-orokova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 09:17:08'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'azat-mukaev', NULL, false, 'eliza-omurzakova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 09:18:05'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'alymbek-orokov', NULL, false, 'sonya-orokova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 09:39:37'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'alan-adzhibekov', NULL, false, 'anastasiya-adzhibekova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 10:06:52'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'aygerim-alizhanova', NULL, false, NULL, NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 10:20:44'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'denis-li', NULL, false, 'elena-kan', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 11:19:09'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'burul-rakisheva', NULL, false, 'murat-noruzbaev', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 11:19:09'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'anvar-nasyrov', NULL, false, 'kanyshay-badretdinova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 11:24:55'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'tolgonay-aytkulova', NULL, false, 'askar-zhumagulov', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 12:25:14'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'iskender-kurmanov', NULL, false, 'yana-belekova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 13:15:02'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'ayzhan-temiralieva', NULL, false, 'azat-kubanychbek-uulu', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 14:21:59'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'adham-ubaydullaev', NULL, false, 'tat-yana-nechaeva', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 15:05:34'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'nuriza-momunova', NULL, false, 'urmat-alabaev', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 18:08:24'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'aida-nogoybaeva', NULL, false, 'elzar-azhibaev', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 18:39:29'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'alina-zhakypova', NULL, false, 'aydar-aydarov', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-10 19:22:05'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'adilet-kanatbekov', NULL, false, 'ariana-kasymbekova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-11 03:38:50'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'raimbek-tabaldiev', NULL, false, 'aynel-kazybaeva', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-11 03:39:04'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'erlan-sydykov', NULL, false, 'adel-dzhayloeva', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-11 12:26:10'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'dzhantay-otorbaev', NULL, false, 'aysha-turdumambetova', NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-12 12:05:21'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'viktoriya-han', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-10 19:45:08'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'bekzhan-kylychbekov', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-10 12:56:16'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'leonid-tsoy', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-10 14:40:30'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'nursultan-ulukbekov', NULL, false, 'aazhara-koychumanova', NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-14 12:33:30'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'tabaldieva-aykanysh', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-14 14:50:18'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'karakoz-bolotbekova', NULL, false, 'zhakshylyk-aytbaev', NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-14 14:51:36'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'azat-bazarkulov', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-15 08:21:51'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'ahmedzhan-adzhuev', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-15 13:04:28'),
       ('c0a30bae-30ee-4a38-a26a-4c6b339bd695', 'evgeniy-gorskih', NULL, false, NULL, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-16 13:27:44');

COMMIT;

-- ---- Проверка ----

SELECT r.status                                     AS состояние,
       count(*)                                     AS пар,
       count(*) FILTER (WHERE r.partner_id IS NULL
                          AND r.partner_external_name IS NULL) AS без_напарника,
       count(*) FILTER (WHERE p.is_guest OR pp.is_guest)       AS с_гостями
  FROM public.tournament_registrations r
  LEFT JOIN public.players p  ON p.id  = r.player_id
  LEFT JOIN public.players pp ON pp.id = r.partner_id
 WHERE r.tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
 GROUP BY 1
 ORDER BY 1;

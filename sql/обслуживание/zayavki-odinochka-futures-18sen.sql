-- ============================================================
-- Заявки на рейтинговый одиночный турнир Futures, 18 сентября
-- ============================================================
--
-- Перенос ответов из формы клуба («Муж Futures — 18 сентября») в турнир
-- «Рейтинговый одиночный турнир в категори FUTURES» — 32 места, заявок 30.
--
-- Порядок сохранён: время подачи берём из формы, в админке заявки лягут
-- так же, как приходили. Двадцать семь человек из основного списка —
-- «принята», трое из-под отметки «Лист ожидания» — «лист ожидания».
-- Места в турнире ещё есть, но очередь ведёт клуб, а не мы.
--
-- Имена сверены с карточками: из 30 человек нашлись 21, многие записаны
-- фамилией вперёд — привязаны по совпадению слов.
--
-- Девятерых в клубе нет — им заводим карточки гостя: в рейтинг такие не
-- идут, но в сетке они живые игроки. Категория futures — по турниру,
-- NTRP не ставим, его определит клуб.
--
-- Пометки клуба про оплату («нет оплаты за сент», «нет оплаты ч/в») не
-- переносим: это учёт членских взносов, а не состояние заявки. Кого не
-- допускать — решает клуб кнопкой в админке.
--
-- Посев не проставляем: сеются по рейтингу, когда жеребишь сетку.
--
-- Запускать можно повторно: прежние заявки этого турнира удаляются,
-- карточки гостей не задваиваются.

BEGIN;

-- ---- Карточки гостей ----

INSERT INTO public.players (id, name, gender, country, category_id,
                            is_member, is_guest, has_account)
VALUES
       ('daniyar-bakchiev', 'Данияр Бакчиев', 'men', '🇰🇬', 'futures', false, true, false),
       ('ruslan-yunusov', 'Руслан Юнусов', 'men', '🇰🇬', 'futures', false, true, false),
       ('nurtazin-dzhetybaev', 'Нуртазин Джетыбаев', 'men', '🇰🇬', 'futures', false, true, false),
       ('batyr-mavlyanov', 'Батыр Мавлянов', 'men', '🇰🇬', 'futures', false, true, false),
       ('atay-akmatov', 'Атай Акматов', 'men', '🇰🇬', 'futures', false, true, false),
       ('dastan-muratbaev', 'Дастан Муратбаев', 'men', '🇰🇬', 'futures', false, true, false),
       ('alihan-kuvanyshev', 'Алихан Куванышев', 'men', '🇰🇬', 'futures', false, true, false),
       ('chyngyz-usenov', 'Чынгыз Усенов', 'men', '🇰🇬', 'futures', false, true, false),
       ('adilet-koombaev', 'Адилет Коомбаев', 'men', '🇰🇬', 'futures', false, true, false)
ON CONFLICT (id) DO NOTHING;

-- ---- Заявки ----

DELETE FROM public.tournament_registrations
 WHERE tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26';

INSERT INTO public.tournament_registrations
       (tournament_id, player_id, status, registered_at)
VALUES
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'ulan-tagaybek-uulu', 'approved', TIMESTAMPTZ '2026-09-15 18:10:37'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'eren-kamchibekov', 'approved', TIMESTAMPTZ '2026-09-15 18:10:39'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'ahmedzhan-adzhuev', 'approved', TIMESTAMPTZ '2026-09-15 18:10:40'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'iskender-kadyrov', 'approved', TIMESTAMPTZ '2026-09-15 18:10:44'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'dmitriy-pak', 'approved', TIMESTAMPTZ '2026-09-15 18:10:49'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'salih-ismailov', 'approved', TIMESTAMPTZ '2026-09-15 18:10:58'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'daniyar-bakchiev', 'approved', TIMESTAMPTZ '2026-09-15 18:11:05'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'zhanybek-kaparov', 'approved', TIMESTAMPTZ '2026-09-15 18:12:11'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'timur-uzagaliev', 'approved', TIMESTAMPTZ '2026-09-15 18:12:58'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'bahram-mambetov', 'approved', TIMESTAMPTZ '2026-09-15 18:15:22'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'rustam-ushur', 'approved', TIMESTAMPTZ '2026-09-15 18:17:13'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'suvar-ayylchiev', 'approved', TIMESTAMPTZ '2026-09-15 18:20:15'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'elzar-azhibaev', 'approved', TIMESTAMPTZ '2026-09-15 18:32:52'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'temirlan-tulegenov', 'approved', TIMESTAMPTZ '2026-09-15 18:33:09'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'azat-bazarkulov', 'approved', TIMESTAMPTZ '2026-09-15 18:34:22'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'musa-zhanybekov', 'approved', TIMESTAMPTZ '2026-09-15 18:59:11'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'bakyt-kapakov', 'approved', TIMESTAMPTZ '2026-09-15 19:23:45'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'ashat-kerimbekov', 'approved', TIMESTAMPTZ '2026-09-15 19:27:48'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'sardar-artykbaev', 'approved', TIMESTAMPTZ '2026-09-15 19:28:37'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'timur-baygubatov', 'approved', TIMESTAMPTZ '2026-09-15 21:02:09'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'ruslan-yunusov', 'approved', TIMESTAMPTZ '2026-09-15 21:45:41'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'nurtazin-dzhetybaev', 'approved', TIMESTAMPTZ '2026-09-16 10:26:02'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'batyr-mavlyanov', 'approved', TIMESTAMPTZ '2026-09-16 10:48:22'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'atay-akmatov', 'approved', TIMESTAMPTZ '2026-09-16 11:29:42'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'beksultan-rustamov', 'approved', TIMESTAMPTZ '2026-09-16 13:19:16'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'sanzhar-ergeshaliev', 'approved', TIMESTAMPTZ '2026-09-16 15:08:38'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'dastan-muratbaev', 'approved', TIMESTAMPTZ '2026-09-17 15:08:38'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'alihan-kuvanyshev', 'waitlist', TIMESTAMPTZ '2026-09-15 22:32:49'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'chyngyz-usenov', 'waitlist', TIMESTAMPTZ '2026-09-16 00:50:27'),
       ('c6883b98-eaf9-4bc4-a09e-6174f11afb26', 'adilet-koombaev', 'waitlist', TIMESTAMPTZ '2026-09-16 01:29:08');

COMMIT;

-- ---- Проверка ----

SELECT r.status                                AS состояние,
       count(*)                                AS заявок,
       count(*) FILTER (WHERE p.is_guest)      AS гостей
  FROM public.tournament_registrations r
  LEFT JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
 GROUP BY 1
 ORDER BY 1;

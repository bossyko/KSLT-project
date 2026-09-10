-- ============================================================
-- Заявки на дружеские парные турниры
-- ============================================================
--
-- Перенос ответов из формы клуба («Муж пара») в два турнира:
--
--   Masters — «Дружеский турнир в мужском парном разряде», 12 пар;
--   Futures — «Дружеский турнир в мужском парном разряде Futures», 19 пар.
--
-- Порядок заявок сохранён: время подачи берём из формы, поэтому в админке
-- они лягут так же, как приходили. Кто поместился в заявленное число мест —
-- «принята», остальные — «лист ожидания». В Futures мест 18, поэтому в
-- ожидании оказывается последняя, девятнадцатая пара.
--
-- Имена сверены с карточками игроков: 59 из 60 нашлись и привязаны, поэтому
-- у пары будет живой рейтинг, а не строка с именем. Не нашёлся один — Максим
-- Серко, он идёт как приглашённый. «Если найдётся» и «Не определился»
-- напарником не считаются: у таких заявок партнёр пустой, и в админке рядом
-- будет кнопка «+ Добавить партнёра».
--
-- Посев не проставляем: пары сеются по сумме NTRP, когда жеребишь сетку.
--
-- Запускать можно повторно: прежние заявки этих турниров удаляются.

BEGIN;

DELETE FROM public.tournament_registrations
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

INSERT INTO public.tournament_registrations
       (tournament_id, player_id, external_name, is_external,
        partner_id, partner_external_name, status, registered_at)
VALUES
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'azamat-dzhumabaev', NULL, false, 'ruslan-andreev', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:11:01'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'hamit-karaketov', NULL, false, 'ruslan-kuldzhaev', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:39:28'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'iskender-seydimatov', NULL, false, 'atham-israilov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 20:02:50'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'abdikiim-mahmutov', NULL, false, 'aziz-bazakov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 20:07:57'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'furkat-sadykov', NULL, false, 'azim-isakov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 20:34:04'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'nurlan-azygaliev', NULL, false, 'aymen-azygaliev', NULL, 'approved', TIMESTAMPTZ '2026-09-07 23:23:29'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'roman-dolgushin', NULL, false, 'rustam-suleymanov', NULL, 'approved', TIMESTAMPTZ '2026-09-08 11:05:17'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'bakyt-kayypov', NULL, false, 'ulugbek-salymbekov', NULL, 'approved', TIMESTAMPTZ '2026-09-08 13:35:08'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'ibragim-koshoybekov', NULL, false, NULL, 'Максим Серко', 'approved', TIMESTAMPTZ '2026-09-08 13:39:31'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'esendiyar-adylov', NULL, false, 'ildiyar-murataliev', NULL, 'approved', TIMESTAMPTZ '2026-09-08 15:47:52'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'kirill-leontev', NULL, false, 'murat-noruzbaev', NULL, 'approved', TIMESTAMPTZ '2026-09-08 17:26:38'),
       ('b8a6de7b-a146-4168-aaea-b56fb5dbd135', 'arsen-umurzakov', NULL, false, 'ramil-miftahutdinov', NULL, 'approved', TIMESTAMPTZ '2026-09-09 17:26:38'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'iskender-kurmanov', NULL, false, 'danil-bondar', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:16:16'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'vladislav-kim', NULL, false, 'abdurahman-niyazov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:32:13'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'bek-kydyrgychov', NULL, false, 'ermek-abakirov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:35:16'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'salman-beyshenaliev', NULL, false, 'bulat-tsoy', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:38:06'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'zamir-borubaev', NULL, false, 'kamil-yakupov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 19:45:33'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'elnur-omurzakov', NULL, false, 'sanzhar-sultanov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 20:09:39'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'dzhantay-otorbaev', NULL, false, 'denis-li', NULL, 'approved', TIMESTAMPTZ '2026-09-07 20:12:47'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'alymbek-orokov', NULL, false, 'ilzat-husainov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 20:14:33'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'stanislav-shumilin', NULL, false, 'eldiyar-boruev', NULL, 'approved', TIMESTAMPTZ '2026-09-07 21:00:14'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'erbol-kylychev', NULL, false, 'adil-valimamedov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 21:20:58'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'beksultan-rustamov', NULL, false, 'erbol-abdyakimov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 22:33:29'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'mirbek-dyushenaliev', NULL, false, 'baatyr-bakytbek', NULL, 'approved', TIMESTAMPTZ '2026-09-07 22:44:36'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'shavkat-mihmanov', NULL, false, 'bekzat-imenov', NULL, 'approved', TIMESTAMPTZ '2026-09-07 23:06:25'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'evgeniy-gorskih', NULL, false, 'daniyar-lyamin', NULL, 'approved', TIMESTAMPTZ '2026-09-08 10:47:46'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'azat-mukaev', NULL, false, 'altynbek-zhanybekov', NULL, 'approved', TIMESTAMPTZ '2026-09-08 13:36:25'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'zhakshylyk-aytbaev', NULL, false, 'adham-ubaydullaev', NULL, 'approved', TIMESTAMPTZ '2026-09-08 16:13:52'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'azat-bazarkulov', NULL, false, 'ulukbek-bekbosunov', NULL, 'approved', TIMESTAMPTZ '2026-09-08 13:40:34'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'salih-ismailov', NULL, false, NULL, NULL, 'approved', TIMESTAMPTZ '2026-09-07 23:21:45'),
       ('7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'timur-uzagaliev', NULL, false, NULL, NULL, 'waitlist', TIMESTAMPTZ '2026-09-08 09:03:05');

COMMIT;

-- ---- Проверка ----

SELECT t.title AS турнир,
       r.status AS состояние,
       count(*) AS пар,
       count(*) FILTER (WHERE r.partner_id IS NULL AND r.partner_external_name IS NULL) AS без_напарника,
       count(*) FILTER (WHERE r.is_external) AS приглашённых
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                           '7094e2bd-02e6-476b-9e0c-efc7bffc8418')
 GROUP BY 1, 2
 ORDER BY 1, 2;

-- ============================================================
-- Очки рейтинга: женские Tour и Futures
-- ============================================================
--
-- Второй заход после женского Masters, по тем же правилам:
--
--   каждая колонка файла — турнир, каждая клетка — строка в истории игрока;
--   сумма колонок ложится в очки разряда;
--   строка про ТБШ привязана к настоящему турниру, поэтому в карточке она
--   кликабельная и открывает сетку с обводкой матчей игрока;
--   у каждой строки свой сезон — по нему очки спишутся в свой срок.
--
-- Даты у турниров прошлых лет проставлены по месяцу из названия: точных дней
-- не сохранилось, а для списания и порядка в карточке важен месяц.
--
-- Две колонки «Вторая категория, май 2026» в обоих файлах названы одинаково,
-- поэтому здесь они помечены как первый и второй турнир. Если один из них на
-- самом деле другого года — скажи, поправлю название и сезон.
--
-- Имена сверены со списком игроков; расхождения в написании приведены к тому,
-- что стоит в базе. Sweta Pokharel — это Света Покарел. «Курманалиева Дана» и
-- «Курманалиева Айдана» — один человек, их очки сложены.
--
-- Запускать можно повторно: строки заливки при повторе переписываются.

BEGIN;

-- ---- 1. Четверо, кого в базе не было ----
--
-- Они есть в рейтинге клуба, но карточки не заводили. NTRP на них нет —
-- проставите позже, из админки.

INSERT INTO public.players (id, name, gender, category_id)
VALUES
       ('aliya-makeshova', 'Алия Макешова', 'women', 'tour'),
       ('deniz-rahmatova', 'Дениз Рахматова', 'women', 'tour'),
       ('kyzzhibek-batyrkanova', 'Кызжибек Батырканова', 'women', 'futures'),
       ('amal-breneman', 'Амаль Бренеман', 'women', 'futures')
ON CONFLICT (id) DO NOTHING;

-- ---- 2. Турниры без сетки: строки истории ----
--
-- Сначала убираем прежнюю заливку этих же турниров, чтобы при повторном
-- запуске строки не задвоились.

DELETE FROM public.rating_history
 WHERE tournament_id IS NULL
   AND tournament_name IN (
        'Вторая категория, август 2026',
        'Вторая категория, май 2025',
        'Вторая категория, май 2026 (второй)',
        'Вторая категория, май 2026 (первый)',
        'Вторая категория, сентябрь 2025',
        'Вторая категория, февраль 2025',
        'Высшая категория 2025',
        'Первая категория, февраль 2026',
        'Третья категория, апрель 2025',
        'Третья категория, февраль 2025'
);

INSERT INTO public.rating_history (player_id, tournament_name, points_earned, recorded_at, category_id)
VALUES
       ('adel-dzhayloeva', 'Третья категория, апрель 2025', 215, DATE '2025-04-30', 'tour'),
       ('adel-dzhayloeva', 'Высшая категория 2025', 600, DATE '2025-12-31', 'tour'),
       ('adel-dzhayloeva', 'Вторая категория, сентябрь 2025', 360, DATE '2025-09-30', 'tour'),
       ('adel-dzhayloeva', 'Вторая категория, май 2026 (второй)', 130, DATE '2026-05-31', 'tour'),
       ('anastasiya-adzhibekova', 'Вторая категория, февраль 2025', 75, DATE '2025-02-28', 'tour'),
       ('anastasiya-adzhibekova', 'Третья категория, апрель 2025', 90, DATE '2025-04-30', 'tour'),
       ('anastasiya-adzhibekova', 'Высшая категория 2025', 420, DATE '2025-12-31', 'tour'),
       ('anastasiya-adzhibekova', 'Вторая категория, сентябрь 2025', 215, DATE '2025-09-30', 'tour'),
       ('anastasiya-adzhibekova', 'Вторая категория, май 2026 (первый)', 360, DATE '2026-05-31', 'tour'),
       ('anastasiya-adzhibekova', 'Вторая категория, май 2026 (второй)', 215, DATE '2026-05-31', 'tour'),
       ('valeriya-pak', 'Вторая категория, февраль 2025', 75, DATE '2025-02-28', 'tour'),
       ('valeriya-pak', 'Третья категория, апрель 2025', 10, DATE '2025-04-30', 'tour'),
       ('valeriya-pak', 'Высшая категория 2025', 1000, DATE '2025-12-31', 'tour'),
       ('valeriya-pak', 'Вторая категория, сентябрь 2025', 75, DATE '2025-09-30', 'tour'),
       ('valeriya-pak', 'Вторая категория, май 2026 (первый)', 150, DATE '2026-05-31', 'tour'),
       ('natalya-timirbaeva', 'Вторая категория, февраль 2025', 150, DATE '2025-02-28', 'tour'),
       ('natalya-timirbaeva', 'Третья категория, апрель 2025', 130, DATE '2025-04-30', 'tour'),
       ('natalya-timirbaeva', 'Высшая категория 2025', 360, DATE '2025-12-31', 'tour'),
       ('natalya-timirbaeva', 'Вторая категория, сентябрь 2025', 130, DATE '2025-09-30', 'tour'),
       ('amina-kurbanova', 'Вторая категория, февраль 2025', 130, DATE '2025-02-28', 'tour'),
       ('amina-kurbanova', 'Высшая категория 2025', 145, DATE '2025-12-31', 'tour'),
       ('amina-kurbanova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('amina-kurbanova', 'Вторая категория, май 2026 (второй)', 150, DATE '2026-05-31', 'tour'),
       ('amina-kurbanova', 'Вторая категория, август 2026', 100, DATE '2026-08-31', 'tour'),
       ('keremet-begmatova', 'Вторая категория, февраль 2025', 50, DATE '2025-02-28', 'tour'),
       ('keremet-begmatova', 'Третья категория, апрель 2025', 50, DATE '2025-04-30', 'tour'),
       ('keremet-begmatova', 'Высшая категория 2025', 180, DATE '2025-12-31', 'tour'),
       ('keremet-begmatova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('keremet-begmatova', 'Вторая категория, май 2026 (первый)', 75, DATE '2026-05-31', 'tour'),
       ('keremet-begmatova', 'Вторая категория, май 2026 (второй)', 50, DATE '2026-05-31', 'tour'),
       ('keremet-begmatova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'tour'),
       ('nataliya-tsurban', 'Третья категория, апрель 2025', 10, DATE '2025-04-30', 'tour'),
       ('nataliya-tsurban', 'Высшая категория 2025', 125, DATE '2025-12-31', 'tour'),
       ('nataliya-tsurban', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('nataliya-tsurban', 'Вторая категория, май 2026 (первый)', 50, DATE '2026-05-31', 'tour'),
       ('kalima-askarova', 'Вторая категория, сентябрь 2025', 75, DATE '2025-09-30', 'tour'),
       ('kalima-askarova', 'Вторая категория, май 2026 (второй)', 360, DATE '2026-05-31', 'tour'),
       ('kalima-askarova', 'Вторая категория, август 2026', 150, DATE '2026-08-31', 'tour'),
       ('asel-isabekova', 'Вторая категория, февраль 2025', 215, DATE '2025-02-28', 'tour'),
       ('asel-isabekova', 'Вторая категория, сентябрь 2025', 100, DATE '2025-09-30', 'tour'),
       ('asel-isabekova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'tour'),
       ('nazgul-kerimalieva', 'Вторая категория, февраль 2025', 50, DATE '2025-02-28', 'tour'),
       ('nazgul-kerimalieva', 'Третья категория, апрель 2025', 50, DATE '2025-04-30', 'tour'),
       ('nazgul-kerimalieva', 'Вторая категория, май 2026 (первый)', 215, DATE '2026-05-31', 'tour'),
       ('nazgul-kerimalieva', 'Вторая категория, май 2026 (второй)', 50, DATE '2026-05-31', 'tour'),
       ('liliya-rahmatulina', 'Вторая категория, февраль 2025', 75, DATE '2025-02-28', 'tour'),
       ('liliya-rahmatulina', 'Третья категория, апрель 2025', 90, DATE '2025-04-30', 'tour'),
       ('liliya-rahmatulina', 'Высшая категория 2025', 180, DATE '2025-12-31', 'tour'),
       ('liliya-rahmatulina', 'Вторая категория, сентябрь 2025', 150, DATE '2025-09-30', 'tour'),
       ('aleksandra-muchkina', 'Вторая категория, февраль 2025', 100, DATE '2025-02-28', 'tour'),
       ('aleksandra-muchkina', 'Третья категория, апрель 2025', 10, DATE '2025-04-30', 'tour'),
       ('aleksandra-muchkina', 'Высшая категория 2025', 110, DATE '2025-12-31', 'tour'),
       ('aleksandra-muchkina', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'tour'),
       ('barno-tursunova', 'Вторая категория, февраль 2025', 360, DATE '2025-02-28', 'tour'),
       ('barno-tursunova', 'Вторая категория, сентябрь 2025', 75, DATE '2025-09-30', 'tour'),
       ('zarima-baygubatova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'tour'),
       ('elena-kan', 'Третья категория, апрель 2025', 50, DATE '2025-04-30', 'tour'),
       ('elena-kan', 'Высшая категория 2025', 250, DATE '2025-12-31', 'tour'),
       ('elena-kan', 'Вторая категория, сентябрь 2025', 75, DATE '2025-09-30', 'tour'),
       ('elena-kan', 'Вторая категория, май 2026 (первый)', 25, DATE '2026-05-31', 'tour'),
       ('karakoz-bolotbekova', 'Вторая категория, август 2026', 360, DATE '2026-08-31', 'tour'),
       ('aysuluu-orokova', 'Высшая категория 2025', 215, DATE '2025-12-31', 'tour'),
       ('aysuluu-orokova', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'tour'),
       ('akzholtoy-bolotbekova', 'Высшая категория 2025', 110, DATE '2025-12-31', 'tour'),
       ('akzholtoy-bolotbekova', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'tour'),
       ('akzholtoy-bolotbekova', 'Вторая категория, май 2026 (второй)', 50, DATE '2026-05-31', 'tour'),
       ('akzholtoy-bolotbekova', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'tour'),
       ('narmina-ahmatova', 'Вторая категория, август 2026', 130, DATE '2026-08-31', 'tour'),
       ('larisa-safronova', 'Вторая категория, август 2026', 215, DATE '2026-08-31', 'tour'),
       ('meerim-zhumabekova', 'Высшая категория 2025', 90, DATE '2025-12-31', 'tour'),
       ('meerim-zhumabekova', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'tour'),
       ('meerim-zhumabekova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'tour'),
       ('malika-shamil', 'Высшая категория 2025', 90, DATE '2025-12-31', 'tour'),
       ('nurzhamal-dzhanibekova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'tour'),
       ('bermet-samsalieva', 'Вторая категория, февраль 2025', 50, DATE '2025-02-28', 'tour'),
       ('bermet-samsalieva', 'Высшая категория 2025', 90, DATE '2025-12-31', 'tour'),
       ('bermet-samsalieva', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'tour'),
       ('sveta-poharel', 'Вторая категория, февраль 2025', 75, DATE '2025-02-28', 'tour'),
       ('sveta-poharel', 'Третья категория, апрель 2025', 50, DATE '2025-04-30', 'tour'),
       ('akzholtoy-isabekova', 'Вторая категория, май 2026 (первый)', 50, DATE '2026-05-31', 'tour'),
       ('akzholtoy-isabekova', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'tour'),
       ('ayzhan-temiralieva', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'tour'),
       ('ayzhan-temiralieva', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'tour'),
       ('anayat-abithanova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'tour'),
       ('elizaveta-pilipenko', 'Вторая категория, февраль 2025', 50, DATE '2025-02-28', 'tour'),
       ('elizaveta-pilipenko', 'Третья категория, апрель 2025', 10, DATE '2025-04-30', 'tour'),
       ('elizaveta-pilipenko', 'Вторая категория, сентябрь 2025', 50, DATE '2025-09-30', 'tour'),
       ('aydina-aytmatova', 'Вторая категория, сентябрь 2025', 100, DATE '2025-09-30', 'tour'),
       ('darya-zinina', 'Третья категория, апрель 2025', 10, DATE '2025-04-30', 'tour'),
       ('darya-zinina', 'Высшая категория 2025', 90, DATE '2025-12-31', 'tour'),
       ('adelya-kamchybekova', 'Вторая категория, сентябрь 2025', 50, DATE '2025-09-30', 'tour'),
       ('adelya-kamchybekova', 'Вторая категория, май 2026 (первый)', 50, DATE '2026-05-31', 'tour'),
       ('kalicha-taygurova', 'Вторая категория, февраль 2025', 50, DATE '2025-02-28', 'tour'),
       ('kalicha-taygurova', 'Третья категория, апрель 2025', 10, DATE '2025-04-30', 'tour'),
       ('kalicha-taygurova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('tatyana-andreevskaya', 'Вторая категория, февраль 2025', 75, DATE '2025-02-28', 'tour'),
       ('zulayka-talasbek-kyzy', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('zulayka-talasbek-kyzy', 'Вторая категория, май 2026 (первый)', 25, DATE '2026-05-31', 'tour'),
       ('zulayka-talasbek-kyzy', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'tour'),
       ('svetlana-hanazhenko', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'tour'),
       ('shoola-baysaeva', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'tour'),
       ('altynay-omuralieva', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('altynay-omuralieva', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'tour'),
       ('natalya-seytmuratova', 'Вторая категория, май 2026 (второй)', 50, DATE '2026-05-31', 'tour'),
       ('ayzat-torobekova', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'tour'),
       ('burul-rakisheva', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'tour'),
       ('kanyshay-badretdinova', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'tour'),
       ('nella-kotelnikova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'tour'),
       ('aliya-makeshova', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'tour'),
       ('zuhra-muralieva', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'tour'),
       ('nailya-osmonova', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'tour'),
       ('saykal-niyazova', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'tour'),
       ('saykal-niyazova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'tour'),
       ('aygerim-sarieva', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'tour'),
       ('deniz-rahmatova', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'tour'),
       ('yana-eresko', 'Вторая категория, май 2026 (первый)', 10, DATE '2026-05-31', 'tour'),
       ('aygerim-alizhanova', 'Вторая категория, май 2026 (первый)', 10, DATE '2026-05-31', 'tour'),
       ('kanykey-tursunbaeva', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'tour'),
       ('aleksandra-panfilova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'tour'),
       ('gulsan-galieva', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'tour'),
       ('aysha-turdumambetova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'tour');

INSERT INTO public.rating_history (player_id, tournament_name, points_earned, recorded_at, category_id)
VALUES
       ('aygerim-sarieva', 'Третья категория, февраль 2025', 50, DATE '2025-02-28', 'futures'),
       ('aygerim-sarieva', 'Вторая категория, май 2025', 75, DATE '2025-05-31', 'futures'),
       ('aygerim-sarieva', 'Высшая категория 2025', 180, DATE '2025-12-31', 'futures'),
       ('aygerim-sarieva', 'Вторая категория, сентябрь 2025', 50, DATE '2025-09-30', 'futures'),
       ('yana-eresko', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('yana-eresko', 'Вторая категория, май 2025', 75, DATE '2025-05-31', 'futures'),
       ('yana-eresko', 'Высшая категория 2025', 600, DATE '2025-12-31', 'futures'),
       ('yana-eresko', 'Вторая категория, май 2026 (первый)', 130, DATE '2026-05-31', 'futures'),
       ('yana-eresko', 'Вторая категория, май 2026 (второй)', 75, DATE '2026-05-31', 'futures'),
       ('kanykey-tursunbaeva', 'Первая категория, февраль 2026', 250, DATE '2026-02-28', 'futures'),
       ('kanykey-tursunbaeva', 'Вторая категория, май 2026 (второй)', 130, DATE '2026-05-31', 'futures'),
       ('aygerim-alizhanova', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('aygerim-alizhanova', 'Вторая категория, май 2025', 25, DATE '2025-05-31', 'futures'),
       ('aygerim-alizhanova', 'Высшая категория 2025', 420, DATE '2025-12-31', 'futures'),
       ('aygerim-alizhanova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('aygerim-alizhanova', 'Вторая категория, май 2026 (первый)', 75, DATE '2026-05-31', 'futures'),
       ('aygerim-alizhanova', 'Вторая категория, май 2026 (второй)', 75, DATE '2026-05-31', 'futures'),
       ('aygerim-alizhanova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'futures'),
       ('asel-orokova', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('asel-orokova', 'Вторая категория, май 2025', 150, DATE '2025-05-31', 'futures'),
       ('asel-orokova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('asel-orokova', 'Первая категория, февраль 2026', 215, DATE '2026-02-28', 'futures'),
       ('asel-orokova', 'Вторая категория, май 2026 (первый)', 50, DATE '2026-05-31', 'futures'),
       ('asel-orokova', 'Вторая категория, май 2026 (второй)', 50, DATE '2026-05-31', 'futures'),
       ('asel-orokova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'futures'),
       ('asel-ashimova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('asel-ashimova', 'Вторая категория, май 2026 (второй)', 75, DATE '2026-05-31', 'futures'),
       ('asel-ashimova', 'Вторая категория, август 2026', 360, DATE '2026-08-31', 'futures'),
       ('ayday-akmatalieva', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'futures'),
       ('aliya-abaskanova', 'Высшая категория 2025', 180, DATE '2025-12-31', 'futures'),
       ('narmina-ahmatova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('narmina-ahmatova', 'Первая категория, февраль 2026', 25, DATE '2026-02-28', 'futures'),
       ('narmina-ahmatova', 'Вторая категория, август 2026', 150, DATE '2026-08-31', 'futures'),
       ('zuhra-muralieva', 'Вторая категория, май 2025', 25, DATE '2025-05-31', 'futures'),
       ('zuhra-muralieva', 'Вторая категория, сентябрь 2025', 50, DATE '2025-09-30', 'futures'),
       ('zuhra-muralieva', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('zuhra-muralieva', 'Вторая категория, август 2026', 130, DATE '2026-08-31', 'futures'),
       ('burul-rakisheva', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'futures'),
       ('burul-rakisheva', 'Вторая категория, август 2026', 215, DATE '2026-08-31', 'futures'),
       ('saliya-ustemirova', 'Третья категория, февраль 2025', 25, DATE '2025-02-28', 'futures'),
       ('saliya-ustemirova', 'Вторая категория, май 2025', 25, DATE '2025-05-31', 'futures'),
       ('saliya-ustemirova', 'Высшая категория 2025', 145, DATE '2025-12-31', 'futures'),
       ('saliya-ustemirova', 'Вторая категория, сентябрь 2025', 50, DATE '2025-09-30', 'futures'),
       ('saliya-ustemirova', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'futures'),
       ('kasiet-samsalieva', 'Третья категория, февраль 2025', 25, DATE '2025-02-28', 'futures'),
       ('kasiet-samsalieva', 'Высшая категория 2025', 90, DATE '2025-12-31', 'futures'),
       ('kasiet-samsalieva', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('kasiet-samsalieva', 'Первая категория, февраль 2026', 25, DATE '2026-02-28', 'futures'),
       ('kasiet-samsalieva', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'futures'),
       ('ayzat-torobekova', 'Вторая категория, май 2026 (первый)', 50, DATE '2026-05-31', 'futures'),
       ('aida-nogoybaeva', 'Высшая категория 2025', 90, DATE '2025-12-31', 'futures'),
       ('aida-nogoybaeva', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'futures'),
       ('aida-nogoybaeva', 'Первая категория, февраль 2026', 25, DATE '2026-02-28', 'futures'),
       ('aida-nogoybaeva', 'Вторая категория, май 2026 (первый)', 25, DATE '2026-05-31', 'futures'),
       ('aleksandra-panfilova', 'Высшая категория 2025', 110, DATE '2025-12-31', 'futures'),
       ('aleksandra-panfilova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('aleksandra-panfilova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'futures'),
       ('aysha-turdumambetova', 'Вторая категория, май 2025', 10, DATE '2025-05-31', 'futures'),
       ('aysha-turdumambetova', 'Высшая категория 2025', 90, DATE '2025-12-31', 'futures'),
       ('aysha-turdumambetova', 'Вторая категория, май 2026 (первый)', 25, DATE '2026-05-31', 'futures'),
       ('aysha-turdumambetova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('sonya-orokova', 'Вторая категория, май 2026 (первый)', 10, DATE '2026-05-31', 'futures'),
       ('sonya-orokova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('sonya-orokova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'futures'),
       ('asel-abdygulova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('feyruza-ikram', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('feyruza-ikram', 'Вторая категория, май 2025', 10, DATE '2025-05-31', 'futures'),
       ('feyruza-ikram', 'Высшая категория 2025', 90, DATE '2025-12-31', 'futures'),
       ('tolgonay-aytkulova', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'futures'),
       ('tolgonay-aytkulova', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'futures'),
       ('madina-kadyrova', 'Вторая категория, май 2025', 50, DATE '2025-05-31', 'futures'),
       ('madina-kadyrova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('madina-kadyrova', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'futures'),
       ('tabaldieva-aykanysh', 'Вторая категория, сентябрь 2025', 50, DATE '2025-09-30', 'futures'),
       ('tabaldieva-aykanysh', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'futures'),
       ('dana-kurmanalieva', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'futures'),
       ('saykal-niyazova', 'Вторая категория, август 2026', 50, DATE '2026-08-31', 'futures'),
       ('diana-imanahunova', 'Вторая категория, сентябрь 2025', 75, DATE '2025-09-30', 'futures'),
       ('nuriza-momunova', 'Вторая категория, август 2026', 75, DATE '2026-08-31', 'futures'),
       ('nargiza-sakebaeva', 'Вторая категория, май 2026 (первый)', 10, DATE '2026-05-31', 'futures'),
       ('ayzana-toguzbaeva', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'futures'),
       ('ayzana-toguzbaeva', 'Вторая категория, май 2026 (первый)', 50, DATE '2026-05-31', 'futures'),
       ('ramina-ushur', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('ekaterina-saveleva', 'Вторая категория, май 2026 (первый)', 25, DATE '2026-05-31', 'futures'),
       ('aysuluu-erkulova', 'Вторая категория, май 2026 (второй)', 10, DATE '2026-05-31', 'futures'),
       ('altynay-dzhamanbaeva', 'Первая категория, февраль 2026', 10, DATE '2026-02-28', 'futures'),
       ('altynay-dzhamanbaeva', 'Вторая категория, май 2026 (первый)', 25, DATE '2026-05-31', 'futures'),
       ('aliya-orokova', 'Вторая категория, май 2026 (первый)', 10, DATE '2026-05-31', 'futures'),
       ('aliya-orokova', 'Вторая категория, май 2026 (второй)', 25, DATE '2026-05-31', 'futures'),
       ('kyzzhibek-batyrkanova', 'Вторая категория, сентябрь 2025', 25, DATE '2025-09-30', 'futures'),
       ('gulsan-galieva', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'futures'),
       ('alina-zhakypova', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'futures'),
       ('alina-fasahutdinova', 'Вторая категория, август 2026', 25, DATE '2026-08-31', 'futures'),
       ('aleksandra-samaganova', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('alina-osmonova', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('amal-breneman', 'Третья категория, февраль 2025', 10, DATE '2025-02-28', 'futures'),
       ('diana-aytova', 'Вторая категория, май 2025', 10, DATE '2025-05-31', 'futures'),
       ('aisha-nurbekova', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'futures'),
       ('elina-samanova', 'Вторая категория, сентябрь 2025', 10, DATE '2025-09-30', 'futures'),
       ('dana-kurmanalieva', 'Вторая категория, май 2026 (первый)', 10, DATE '2026-05-31', 'futures'),
       ('aydana-abishova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'futures'),
       ('adilya-mammadova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'futures'),
       ('firuza-chinshaylo', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'futures'),
       ('diana-dzhanusakova', 'Вторая категория, август 2026', 10, DATE '2026-08-31', 'futures');

-- ---- 3. ТБШ Tour 2026 (женский) ----

UPDATE public.tournament_results r
   SET points_earned = v.ochki
  FROM (VALUES
        ('adel-dzhayloeva', 1000),
        ('akzholtoy-bolotbekova', 45),
        ('akzholtoy-isabekova', 45),
        ('aleksandra-muchkina', 180),
        ('amina-kurbanova', 250),
        ('anastasiya-adzhibekova', 600),
        ('anayat-abithanova', 90),
        ('asel-isabekova', 180),
        ('asel-orokova', 35),
        ('aysuluu-orokova', 45),
        ('ayzhan-temiralieva', 80),
        ('aziza-musaeva', 35),
        ('keremet-begmatova', 125),
        ('malika-shamil', 110),
        ('meerim-zhumabekova', 90),
        ('narmina-ahmatova', 90),
        ('nataliya-tsurban', 420),
        ('natalya-timirbaeva', 215),
        ('nazgul-kerimalieva', 145),
        ('nurzhamal-dzhanibekova', 90),
        ('shoola-baysaeva', 45),
        ('svetlana-hanazhenko', 65),
        ('valeriya-pak', 110),
        ('zarima-baygubatova', 360)
  ) AS v(igrok, ochki)
 WHERE r.tournament_id = 'tbsh-tour-women-2026' AND r.player_id = v.igrok;

INSERT INTO public.tournament_results (tournament_id, player_id, points_earned, season, category_id, round_reached)
SELECT 'tbsh-tour-women-2026', v.igrok, v.ochki, 2026, 'tour', ''
  FROM (VALUES
        ('adel-dzhayloeva', 1000),
        ('akzholtoy-bolotbekova', 45),
        ('akzholtoy-isabekova', 45),
        ('aleksandra-muchkina', 180),
        ('amina-kurbanova', 250),
        ('anastasiya-adzhibekova', 600),
        ('anayat-abithanova', 90),
        ('asel-isabekova', 180),
        ('asel-orokova', 35),
        ('aysuluu-orokova', 45),
        ('ayzhan-temiralieva', 80),
        ('aziza-musaeva', 35),
        ('keremet-begmatova', 125),
        ('malika-shamil', 110),
        ('meerim-zhumabekova', 90),
        ('narmina-ahmatova', 90),
        ('nataliya-tsurban', 420),
        ('natalya-timirbaeva', 215),
        ('nazgul-kerimalieva', 145),
        ('nurzhamal-dzhanibekova', 90),
        ('shoola-baysaeva', 45),
        ('svetlana-hanazhenko', 65),
        ('valeriya-pak', 110),
        ('zarima-baygubatova', 360)
  ) AS v(igrok, ochki)
 WHERE NOT EXISTS (SELECT 1 FROM public.tournament_results r
                    WHERE r.tournament_id = 'tbsh-tour-women-2026' AND r.player_id = v.igrok);

UPDATE public.rating_history h
   SET points_earned = v.ochki, category_id = 'tour'
  FROM (VALUES
        ('adel-dzhayloeva', 1000),
        ('akzholtoy-bolotbekova', 45),
        ('akzholtoy-isabekova', 45),
        ('aleksandra-muchkina', 180),
        ('amina-kurbanova', 250),
        ('anastasiya-adzhibekova', 600),
        ('anayat-abithanova', 90),
        ('asel-isabekova', 180),
        ('asel-orokova', 35),
        ('aysuluu-orokova', 45),
        ('ayzhan-temiralieva', 80),
        ('aziza-musaeva', 35),
        ('keremet-begmatova', 125),
        ('malika-shamil', 110),
        ('meerim-zhumabekova', 90),
        ('narmina-ahmatova', 90),
        ('nataliya-tsurban', 420),
        ('natalya-timirbaeva', 215),
        ('nazgul-kerimalieva', 145),
        ('nurzhamal-dzhanibekova', 90),
        ('shoola-baysaeva', 45),
        ('svetlana-hanazhenko', 65),
        ('valeriya-pak', 110),
        ('zarima-baygubatova', 360)
  ) AS v(igrok, ochki)
 WHERE h.tournament_id = 'tbsh-tour-women-2026' AND h.player_id = v.igrok;

-- ---- 4. ТБШ Futures 2026 (женский) ----

UPDATE public.tournament_results r
   SET points_earned = v.ochki
  FROM (VALUES
        ('aida-nogoybaeva', 110),
        ('aleksandra-panfilova', 45),
        ('aliya-abaskanova', 180),
        ('asel-abdygulova', 110),
        ('asel-ashimova', 215),
        ('asel-orokova', 125),
        ('ayday-akmatalieva', 600),
        ('aysuluu-erkulova', 35),
        ('ayzat-torobekova', 215),
        ('burul-rakisheva', 80),
        ('dana-kurmanalieva', 90),
        ('ekaterina-saveleva', 30),
        ('erkaim-shambetova', 90),
        ('kanykey-tursunbaeva', 420),
        ('kanyshay-badretdinova', 1000),
        ('kasiet-samsalieva', 90),
        ('nailya-osmonova', 360),
        ('nargiza-sakebaeva', 65),
        ('narmina-ahmatova', 145),
        ('ramina-ushur', 35),
        ('saykal-niyazova', 40),
        ('sonya-orokova', 35),
        ('tahmina-gaparova', 180),
        ('tatyana-mashenskaya', 40),
        ('tolgonay-aytkulova', 45),
        ('viktoriya-han', 30),
        ('yrysgul-sakebaeva', 35),
        ('zuhra-muralieva', 90)
  ) AS v(igrok, ochki)
 WHERE r.tournament_id = 'tbsh-futures-women-2026' AND r.player_id = v.igrok;

INSERT INTO public.tournament_results (tournament_id, player_id, points_earned, season, category_id, round_reached)
SELECT 'tbsh-futures-women-2026', v.igrok, v.ochki, 2026, 'futures', ''
  FROM (VALUES
        ('aida-nogoybaeva', 110),
        ('aleksandra-panfilova', 45),
        ('aliya-abaskanova', 180),
        ('asel-abdygulova', 110),
        ('asel-ashimova', 215),
        ('asel-orokova', 125),
        ('ayday-akmatalieva', 600),
        ('aysuluu-erkulova', 35),
        ('ayzat-torobekova', 215),
        ('burul-rakisheva', 80),
        ('dana-kurmanalieva', 90),
        ('ekaterina-saveleva', 30),
        ('erkaim-shambetova', 90),
        ('kanykey-tursunbaeva', 420),
        ('kanyshay-badretdinova', 1000),
        ('kasiet-samsalieva', 90),
        ('nailya-osmonova', 360),
        ('nargiza-sakebaeva', 65),
        ('narmina-ahmatova', 145),
        ('ramina-ushur', 35),
        ('saykal-niyazova', 40),
        ('sonya-orokova', 35),
        ('tahmina-gaparova', 180),
        ('tatyana-mashenskaya', 40),
        ('tolgonay-aytkulova', 45),
        ('viktoriya-han', 30),
        ('yrysgul-sakebaeva', 35),
        ('zuhra-muralieva', 90)
  ) AS v(igrok, ochki)
 WHERE NOT EXISTS (SELECT 1 FROM public.tournament_results r
                    WHERE r.tournament_id = 'tbsh-futures-women-2026' AND r.player_id = v.igrok);

UPDATE public.rating_history h
   SET points_earned = v.ochki, category_id = 'futures'
  FROM (VALUES
        ('aida-nogoybaeva', 110),
        ('aleksandra-panfilova', 45),
        ('aliya-abaskanova', 180),
        ('asel-abdygulova', 110),
        ('asel-ashimova', 215),
        ('asel-orokova', 125),
        ('ayday-akmatalieva', 600),
        ('aysuluu-erkulova', 35),
        ('ayzat-torobekova', 215),
        ('burul-rakisheva', 80),
        ('dana-kurmanalieva', 90),
        ('ekaterina-saveleva', 30),
        ('erkaim-shambetova', 90),
        ('kanykey-tursunbaeva', 420),
        ('kanyshay-badretdinova', 1000),
        ('kasiet-samsalieva', 90),
        ('nailya-osmonova', 360),
        ('nargiza-sakebaeva', 65),
        ('narmina-ahmatova', 145),
        ('ramina-ushur', 35),
        ('saykal-niyazova', 40),
        ('sonya-orokova', 35),
        ('tahmina-gaparova', 180),
        ('tatyana-mashenskaya', 40),
        ('tolgonay-aytkulova', 45),
        ('viktoriya-han', 30),
        ('yrysgul-sakebaeva', 35),
        ('zuhra-muralieva', 90)
  ) AS v(igrok, ochki)
 WHERE h.tournament_id = 'tbsh-futures-women-2026' AND h.player_id = v.igrok;

-- ---- 5. Очки разрядов ----

DELETE FROM public.player_categories
 WHERE category_id = 'tour'
   AND player_id IN (SELECT v.igrok FROM (VALUES
        ('adel-dzhayloeva', 2305),
        ('adelya-kamchybekova', 100),
        ('akzholtoy-bolotbekova', 265),
        ('akzholtoy-isabekova', 120),
        ('aleksandra-muchkina', 450),
        ('aleksandra-panfilova', 10),
        ('aliya-makeshova', 25),
        ('altynay-omuralieva', 50),
        ('amina-kurbanova', 800),
        ('anastasiya-adzhibekova', 1975),
        ('anayat-abithanova', 115),
        ('asel-isabekova', 520),
        ('asel-orokova', 35),
        ('aydina-aytmatova', 100),
        ('aygerim-alizhanova', 10),
        ('aygerim-sarieva', 10),
        ('aysha-turdumambetova', 10),
        ('aysuluu-orokova', 270),
        ('ayzat-torobekova', 50),
        ('ayzhan-temiralieva', 115),
        ('aziza-musaeva', 35),
        ('barno-tursunova', 435),
        ('bermet-samsalieva', 150),
        ('burul-rakisheva', 50),
        ('darya-zinina', 100),
        ('deniz-rahmatova', 10),
        ('elena-kan', 400),
        ('elizaveta-pilipenko', 110),
        ('gulsan-galieva', 10),
        ('kalicha-taygurova', 85),
        ('kalima-askarova', 585),
        ('kanykey-tursunbaeva', 10),
        ('kanyshay-badretdinova', 50),
        ('karakoz-bolotbekova', 360),
        ('keremet-begmatova', 630),
        ('larisa-safronova', 215),
        ('liliya-rahmatulina', 495),
        ('malika-shamil', 200),
        ('meerim-zhumabekova', 215),
        ('nailya-osmonova', 25),
        ('narmina-ahmatova', 220),
        ('nataliya-tsurban', 630),
        ('natalya-seytmuratova', 50),
        ('natalya-timirbaeva', 985),
        ('nazgul-kerimalieva', 510),
        ('nella-kotelnikova', 25),
        ('nurzhamal-dzhanibekova', 165),
        ('saykal-niyazova', 20),
        ('shoola-baysaeva', 55),
        ('sveta-poharel', 125),
        ('svetlana-hanazhenko', 75),
        ('tatyana-andreevskaya', 75),
        ('valeriya-pak', 1420),
        ('yana-eresko', 10),
        ('zarima-baygubatova', 435),
        ('zuhra-muralieva', 25),
        ('zulayka-talasbek-kyzy', 75)
   ) AS v(igrok, ochki));

INSERT INTO public.player_categories (player_id, category_id, points)
SELECT v.igrok, 'tour', v.ochki FROM (VALUES
        ('adel-dzhayloeva', 2305),
        ('adelya-kamchybekova', 100),
        ('akzholtoy-bolotbekova', 265),
        ('akzholtoy-isabekova', 120),
        ('aleksandra-muchkina', 450),
        ('aleksandra-panfilova', 10),
        ('aliya-makeshova', 25),
        ('altynay-omuralieva', 50),
        ('amina-kurbanova', 800),
        ('anastasiya-adzhibekova', 1975),
        ('anayat-abithanova', 115),
        ('asel-isabekova', 520),
        ('asel-orokova', 35),
        ('aydina-aytmatova', 100),
        ('aygerim-alizhanova', 10),
        ('aygerim-sarieva', 10),
        ('aysha-turdumambetova', 10),
        ('aysuluu-orokova', 270),
        ('ayzat-torobekova', 50),
        ('ayzhan-temiralieva', 115),
        ('aziza-musaeva', 35),
        ('barno-tursunova', 435),
        ('bermet-samsalieva', 150),
        ('burul-rakisheva', 50),
        ('darya-zinina', 100),
        ('deniz-rahmatova', 10),
        ('elena-kan', 400),
        ('elizaveta-pilipenko', 110),
        ('gulsan-galieva', 10),
        ('kalicha-taygurova', 85),
        ('kalima-askarova', 585),
        ('kanykey-tursunbaeva', 10),
        ('kanyshay-badretdinova', 50),
        ('karakoz-bolotbekova', 360),
        ('keremet-begmatova', 630),
        ('larisa-safronova', 215),
        ('liliya-rahmatulina', 495),
        ('malika-shamil', 200),
        ('meerim-zhumabekova', 215),
        ('nailya-osmonova', 25),
        ('narmina-ahmatova', 220),
        ('nataliya-tsurban', 630),
        ('natalya-seytmuratova', 50),
        ('natalya-timirbaeva', 985),
        ('nazgul-kerimalieva', 510),
        ('nella-kotelnikova', 25),
        ('nurzhamal-dzhanibekova', 165),
        ('saykal-niyazova', 20),
        ('shoola-baysaeva', 55),
        ('sveta-poharel', 125),
        ('svetlana-hanazhenko', 75),
        ('tatyana-andreevskaya', 75),
        ('valeriya-pak', 1420),
        ('yana-eresko', 10),
        ('zarima-baygubatova', 435),
        ('zuhra-muralieva', 25),
        ('zulayka-talasbek-kyzy', 75)
) AS v(igrok, ochki);

DELETE FROM public.player_categories
 WHERE category_id = 'futures'
   AND player_id IN (SELECT v.igrok FROM (VALUES
        ('adilya-mammadova', 10),
        ('aida-nogoybaeva', 260),
        ('aisha-nurbekova', 10),
        ('aleksandra-panfilova', 190),
        ('aleksandra-samaganova', 10),
        ('alina-fasahutdinova', 25),
        ('alina-osmonova', 10),
        ('alina-zhakypova', 25),
        ('aliya-abaskanova', 360),
        ('aliya-orokova', 35),
        ('altynay-dzhamanbaeva', 35),
        ('amal-breneman', 10),
        ('asel-abdygulova', 135),
        ('asel-ashimova', 675),
        ('asel-orokova', 700),
        ('aydana-abishova', 10),
        ('ayday-akmatalieva', 625),
        ('aygerim-alizhanova', 705),
        ('aygerim-sarieva', 355),
        ('aysha-turdumambetova', 150),
        ('aysuluu-erkulova', 45),
        ('ayzana-toguzbaeva', 60),
        ('ayzat-torobekova', 265),
        ('burul-rakisheva', 305),
        ('dana-kurmanalieva', 110),
        ('diana-aytova', 10),
        ('diana-dzhanusakova', 10),
        ('diana-imanahunova', 75),
        ('ekaterina-saveleva', 55),
        ('elina-samanova', 10),
        ('erkaim-shambetova', 90),
        ('feyruza-ikram', 110),
        ('firuza-chinshaylo', 10),
        ('gulsan-galieva', 25),
        ('kanykey-tursunbaeva', 800),
        ('kanyshay-badretdinova', 1000),
        ('kasiet-samsalieva', 265),
        ('kyzzhibek-batyrkanova', 25),
        ('madina-kadyrova', 100),
        ('nailya-osmonova', 360),
        ('nargiza-sakebaeva', 75),
        ('narmina-ahmatova', 345),
        ('nuriza-momunova', 75),
        ('ramina-ushur', 60),
        ('saliya-ustemirova', 295),
        ('saykal-niyazova', 90),
        ('sonya-orokova', 145),
        ('tabaldieva-aykanysh', 100),
        ('tahmina-gaparova', 180),
        ('tatyana-mashenskaya', 40),
        ('tolgonay-aytkulova', 105),
        ('viktoriya-han', 30),
        ('yana-eresko', 890),
        ('yrysgul-sakebaeva', 35),
        ('zuhra-muralieva', 320)
   ) AS v(igrok, ochki));

INSERT INTO public.player_categories (player_id, category_id, points)
SELECT v.igrok, 'futures', v.ochki FROM (VALUES
        ('adilya-mammadova', 10),
        ('aida-nogoybaeva', 260),
        ('aisha-nurbekova', 10),
        ('aleksandra-panfilova', 190),
        ('aleksandra-samaganova', 10),
        ('alina-fasahutdinova', 25),
        ('alina-osmonova', 10),
        ('alina-zhakypova', 25),
        ('aliya-abaskanova', 360),
        ('aliya-orokova', 35),
        ('altynay-dzhamanbaeva', 35),
        ('amal-breneman', 10),
        ('asel-abdygulova', 135),
        ('asel-ashimova', 675),
        ('asel-orokova', 700),
        ('aydana-abishova', 10),
        ('ayday-akmatalieva', 625),
        ('aygerim-alizhanova', 705),
        ('aygerim-sarieva', 355),
        ('aysha-turdumambetova', 150),
        ('aysuluu-erkulova', 45),
        ('ayzana-toguzbaeva', 60),
        ('ayzat-torobekova', 265),
        ('burul-rakisheva', 305),
        ('dana-kurmanalieva', 110),
        ('diana-aytova', 10),
        ('diana-dzhanusakova', 10),
        ('diana-imanahunova', 75),
        ('ekaterina-saveleva', 55),
        ('elina-samanova', 10),
        ('erkaim-shambetova', 90),
        ('feyruza-ikram', 110),
        ('firuza-chinshaylo', 10),
        ('gulsan-galieva', 25),
        ('kanykey-tursunbaeva', 800),
        ('kanyshay-badretdinova', 1000),
        ('kasiet-samsalieva', 265),
        ('kyzzhibek-batyrkanova', 25),
        ('madina-kadyrova', 100),
        ('nailya-osmonova', 360),
        ('nargiza-sakebaeva', 75),
        ('narmina-ahmatova', 345),
        ('nuriza-momunova', 75),
        ('ramina-ushur', 60),
        ('saliya-ustemirova', 295),
        ('saykal-niyazova', 90),
        ('sonya-orokova', 145),
        ('tabaldieva-aykanysh', 100),
        ('tahmina-gaparova', 180),
        ('tatyana-mashenskaya', 40),
        ('tolgonay-aytkulova', 105),
        ('viktoriya-han', 30),
        ('yana-eresko', 890),
        ('yrysgul-sakebaeva', 35),
        ('zuhra-muralieva', 320)
) AS v(igrok, ochki);

-- ---- 6. Общий рейтинг ----
--
-- В карточке очки показываются по разрядам отдельно, но общее число тоже
-- где-то нужно — например в подборе партнёра и в выгрузках. Считаем его как
-- сумму по всем разрядам, у кого они есть.

UPDATE public.players p
   SET points = COALESCE((SELECT sum(pc.points) FROM public.player_categories pc
                           WHERE pc.player_id = p.id AND pc.closed_at IS NULL), 0)
 WHERE EXISTS (SELECT 1 FROM public.player_categories pc WHERE pc.player_id = p.id);

COMMIT;

-- ---- Проверка ----

SELECT c.name AS разряд,
       count(*) AS игроков,
       max(pc.points) AS лучший
  FROM public.player_categories pc
  JOIN public.categories c ON c.id = pc.category_id
 GROUP BY c.name
 ORDER BY 1;

SELECT p.name AS игрок, p.points AS общий,
       string_agg(pc.category_id || ' ' || pc.points, ', ' ORDER BY pc.points DESC) AS по_разрядам
  FROM public.players p
  JOIN public.player_categories pc ON pc.player_id = p.id
 GROUP BY p.name, p.points
HAVING count(*) > 1
 ORDER BY p.points DESC
 LIMIT 10;
-- Вторая таблица — те, кто набирал очки в двух разрядах.

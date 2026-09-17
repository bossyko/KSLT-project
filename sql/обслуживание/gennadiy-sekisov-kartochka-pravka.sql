-- ============================================================
-- Парный FUTURES: карточка Геннадию Секисову — ПРАВКА
-- ============================================================
--
-- В заявке Евгения Горских напарник записан именем, без карточки: поле
-- partner_external_name. Матчи хранят игрока, поэтому после жеребьёвки его
-- сторона осталась бы пустой — счёт некуда вписать, группа не доиграется.
-- Ровно это случилось в одиночном FUTURES с Атабеком Абдылдаевым.
--
-- Заводим карточку гостя и ставим её напарником в заявку. Данные берём из
-- самой заявки: NTRP 3.5, Кыргызстан. Разряд мужской парный, значит
-- мужчина.
--
-- Жеребьёвки в этом турнире ещё не было, матчи править не нужно.
--
-- Запускать можно повторно.

BEGIN;

INSERT INTO public.players (id, name, country, category_id, gender,
                            ntrp_doubles, is_member, is_guest, has_account)
VALUES ('gennadiy-sekisov', 'Геннадий Секисов', '🇰🇬', 'futures', 'men',
        3.5, false, true, false)
ON CONFLICT (id) DO NOTHING;

UPDATE public.tournament_registrations
   SET partner_id              = 'gennadiy-sekisov',
       partner_external_name   = NULL,
       partner_external_ntrp   = NULL,
       partner_external_country = NULL
 WHERE id = '1b70a12c-9ad0-4814-aac5-784fd4c390ae';

COMMIT;

-- СЛИЯНИЕ ДУБЛЕЙ «ДАНИЯР АТАХАНОВ». 13.11, СДЕЛАНО
--
-- Третий случай той же породы после Эрмека Абакирова (04.11) и Эрлана
-- Шекербекова (12.11): человек зарегистрировался на сайте, аккаунту
-- завели НОВУЮ карточку, а его прежняя — с очками и матчами — осталась
-- в стороне. Отличие в написании: старая `daniyar-atahanov`, новая
-- `daniyar-atakhanov` (atakh вместо atah).
--
-- ЧТО БЫЛО ЗАМЕРЕНО ДО ПРАВКИ:
--   daniyar-atahanov   masters       630 очков  8/4  матчей 12  заявок 2
--                      результатов 2  история 9  аккаунтов 0
--   daniyar-atakhanov  open-friendly   0 очков  0/0  матчей  0  заявок 1
--                      аккаунт 1 (d.atahanov@gmail.com), заведена 13.11 05:56
--
-- ЗАЯВКУ НАДО БЫЛО СОХРАНИТЬ. Слово Кости: «он подал на турнир ещё
-- заявку, надо будет её сохранить — подача была с новой карточки».
-- Заявка на «Итоговый турнир TOP 8 MASTERS-2026»
-- (c3cc68d1-d649-4c08-b17a-30cac3f1dfb0), status = waitlist: её положили
-- в лист ожидания, пока карточка была Open Friendly с нулём очков и в
-- Masters не проходила.
--
-- ЗДЕСЬ И БЫЛА ОПАСНОСТЬ. У `tournament_registrations.player_id` внешний
-- ключ стоит с ON DELETE CASCADE. Удали мы пустую карточку, не переведя
-- заявку, — заявка исчезла бы ВМЕСТЕ С НЕЙ, молча, без ошибки. Тем же
-- каскадом уходят результаты, история рейтинга, значки, категории,
-- переходы, сброс сезона и заявка на привязку. Поэтому порядок: сперва
-- перевод всех ссылок, удаление последним, всё в одной сделке.
--
-- СПИСОК СВЯЗЕЙ ВЗЯТ ИЗ БОЕВОЙ БАЗЫ, А НЕ ИЗ ФАЙЛА СХЕМЫ. Три запроса
-- подряд упали на колонках, которых в боевой нет, хотя в
-- `supabase/migrations/20260210000000_baseline.sql` они есть:
-- players.doubles_points (снята в sql/схема/doubles-mixed-stats.sql:216),
-- challenge_predictions.predicted_winner_id (таблицы нет вовсе),
-- tournament_registrations.created_at (там registered_at).
-- И наоборот: в боевой есть player_link_requests и registration_changes,
-- которых baseline не знает. ФАЙЛ СХЕМЫ — НЕ ИСТОЧНИК ПРАВДЫ О БОЕВОЙ.
-- Правильный источник — information_schema живой базы (запрос ниже).

-- ---- 0. КТО ССЫЛАЕТСЯ НА players И ЧТО УЙДЁТ КАСКАДОМ ----------------
SELECT tc.table_name, kcu.column_name, rc.delete_rule
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name AND kcu.constraint_schema = tc.constraint_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
  JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.constraint_schema
 WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'players'
 ORDER BY tc.table_name, kcu.column_name;

-- ---- 1. ПРАВКА, ОДНОЙ СДЕЛКОЙ ----------------------------------------
BEGIN;

UPDATE public.profiles
   SET player_id = 'daniyar-atahanov'
 WHERE player_id = 'daniyar-atakhanov';

UPDATE public.tournament_registrations
   SET player_id = 'daniyar-atahanov'
 WHERE player_id = 'daniyar-atakhanov';

UPDATE public.tournament_registrations
   SET partner_id = 'daniyar-atahanov'
 WHERE partner_id = 'daniyar-atakhanov';

UPDATE public.player_link_requests
   SET player_id = 'daniyar-atahanov'
 WHERE player_id = 'daniyar-atakhanov';

UPDATE public.registration_changes
   SET old_player_id = 'daniyar-atahanov'
 WHERE old_player_id = 'daniyar-atakhanov';

UPDATE public.registration_changes
   SET new_player_id = 'daniyar-atahanov'
 WHERE new_player_id = 'daniyar-atakhanov';

DELETE FROM public.players
 WHERE id = 'daniyar-atakhanov'
   AND points = 0;

COMMIT;

-- ---- 2. ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА ТАБЛИЦА --------------------------
-- Ждали: 0, 1, 630, 1, 1, waitlist.  ПОЛУЧЕНО РОВНО ЭТО.
SELECT (SELECT count(*) FROM public.players   WHERE id = 'daniyar-atakhanov')       AS pustoy_net,
       (SELECT count(*) FROM public.players   WHERE id = 'daniyar-atahanov')        AS zhivaya,
       (SELECT points   FROM public.players   WHERE id = 'daniyar-atahanov')        AS ochki,
       (SELECT count(*) FROM public.profiles  WHERE player_id = 'daniyar-atahanov') AS akkaunt,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE tournament_id = 'c3cc68d1-d649-4c08-b17a-30cac3f1dfb0'
           AND player_id = 'daniyar-atahanov')                                      AS zayavka_itogovyy,
       (SELECT status    FROM public.tournament_registrations
         WHERE tournament_id = 'c3cc68d1-d649-4c08-b17a-30cac3f1dfb0'
           AND player_id = 'daniyar-atahanov')                                      AS status_zayavki;

-- ---- 3. ПОСЛЕДНИЙ ШАГ ДЕЛАЕТСЯ НЕ ЗАПРОСОМ ---------------------------
-- Перевод заявки из листа ожидания в основную сетку — кнопкой в админке,
-- а не UPDATE status. У кнопки висит уведомление игроку
-- (`сообщитьОЗаявке`) и запись в историю заявки: сделай это запросом —
-- человек ничего не получит, а история соврёт.

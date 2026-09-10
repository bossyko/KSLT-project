-- ============================================================
-- Два дружеских парных турнира: вернуть в исходное состояние
-- ============================================================
--
-- Мы гоняли на них проверки: жеребьёвка, расписание, вызовы на корт, ручное
-- добавление игроков и гостей, снятие и возврат заявок. Всё это надо убрать
-- и вернуть турниры к тому, с чего начинали, — к заявкам из формы клуба.
--
-- Что делает файл:
--   1. сносит матчи, расписание, итоги и снимок для отката;
--   2. удаляет ВСЕ заявки обоих турниров, включая заведённые при проверках;
--   3. возвращает турнирам приём заявок и снимает отметки о сохранении
--      расписания и рассылке.
--
-- Порядок запуска — три файла подряд:
--   1) sql/sbros-druzheskih-turnirov.sql   (этот)
--   2) sql/zayavki-parnye-druzheskie.sql   (заливает 12 и 19 пар из формы)
--   3) sql/serko-kartochka.sql             (ставит карточку Максима Серко)
--
-- Настройки самих турниров — число кортов, длительность, тип сетки, взнос —
-- не трогаем: они выставлены правильно.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Матчи ----
--
-- На матч могут ссылаться трансляции и прочие записи. Что именно — спрашиваем
-- у базы: перебираем все связи, ведущие на matches, и чистим их сами, иначе
-- удаление упрётся в запрет.

DO $$
DECLARE
    св record;
    турниры text[] := ARRAY['b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                            '7094e2bd-02e6-476b-9e0c-efc7bffc8418'];
BEGIN
    FOR св IN
        SELECT c.conrelid::regclass AS таблица, a.attname AS поле
          FROM pg_constraint c
          JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
         WHERE c.contype = 'f'
           AND c.confrelid = 'public.matches'::regclass
           AND c.conrelid <> 'public.matches'::regclass
    LOOP
        EXECUTE format(
            'DELETE FROM %s WHERE %I IN (SELECT id FROM public.matches WHERE tournament_id = ANY($1))',
            св.таблица, св.поле) USING турниры;
        RAISE NOTICE 'очищено: %.%', св.таблица, св.поле;
    END LOOP;
END $$;

DELETE FROM public.matches
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- ---- Итоги и следы ----

DELETE FROM public.tournament_results
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

DELETE FROM public.rating_history
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

DELETE FROM public.bracket_undo
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- ---- Заявки ----
--
-- Удаляем все: заведённые при проверках гости и добавленные руками игроки
-- уйдут вместе с ними, а настоящие вернутся следующим файлом — ровно так,
-- как приходили из формы, с прежним временем подачи.

DELETE FROM public.tournament_registrations
 WHERE tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                         '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

-- ---- Сами турниры ----

UPDATE public.tournaments
   SET status               = 'registration_open',
       schedule_saved_at    = NULL,
       schedule_notified_at = NULL
 WHERE id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
              '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

COMMIT;

-- ---- Проверка ----

SELECT t.title AS турнир,
       t.status AS состояние,
       (SELECT count(*) FROM public.matches m WHERE m.tournament_id = t.id) AS матчей,
       (SELECT count(*) FROM public.tournament_results r WHERE r.tournament_id = t.id) AS итогов,
       (SELECT count(*) FROM public.tournament_registrations r WHERE r.tournament_id = t.id) AS заявок
  FROM public.tournaments t
 WHERE t.id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                '7094e2bd-02e6-476b-9e0c-efc7bffc8418');
-- Ожидаем: матчей 0, итогов 0, заявок 0, состояние «registration_open».
-- После второго файла заявок станет 12 и 19.

-- ============================================================
-- Заявки дружеских турниров: привести к форме клуба
-- ============================================================
--
-- Сверено с таблицей «Муж пара (Ответы)» от 10 сентября. Заявки переносили
-- из формы вручную, и за это время в ней поменялись пары: кто-то нашёл
-- другого напарника, кто-то остался без пары, одна пара записалась позже.
--
-- Что делаем:
--   * Masters, заявка 08.09 17:26 — первым номером Кирилл Леонтьев вместо
--     Тенгиза Атаханова, напарник Мурат Норзубаев остаётся;
--   * Futures, Владислав Ким — напарник Абдурахман Ниязов;
--   * Futures, Азат Мукаев — напарник Алтынбек Жаныбеков;
--   * Futures, Салих Исмаилов — напарника нет, в форме «если найдётся»;
--   * Futures — добавляем пару Элзар Ажибаев и Муса Жаныбеков, она подала
--     заявку 10 сентября, позже остальных.
--
-- Новая заявка встаёт в очередь: в Futures 18 мест, и они заняты. Порядок
-- очереди — по времени подачи, как у всех.
--
-- Карточки всех участников в базе есть, новых не заводим.
--
-- Запускать можно повторно.

BEGIN;

-- ---- Masters: заявку ведёт другой человек ----

UPDATE public.tournament_registrations
   SET player_id = 'kirill-leontev'
 WHERE id = '62cd0bcc-9d59-49b2-b43a-2701a1f641c0'
   AND player_id = 'tengiz-atahanov';

-- ---- Futures: сменились напарники ----

UPDATE public.tournament_registrations
   SET partner_id = 'abdurahman-niyazov'
 WHERE id = '4732fb7c-f655-48fa-8565-ecffbd5cecec';

UPDATE public.tournament_registrations
   SET partner_id = 'altynbek-zhanybekov'
 WHERE id = '0de28c8b-c992-4ea6-8a19-e473683c2b99';

-- Пары нет: в форме написано «если найдётся». Место за игроком остаётся,
-- напарника он приведёт сам или поставит менеджер
UPDATE public.tournament_registrations
   SET partner_id             = NULL,
       partner_external_name  = NULL,
       partner_external_ntrp  = NULL,
       partner_gender         = NULL,
       guest_confirmed        = false
 WHERE id = 'ce183ca4-8040-40a0-a914-076d12ffcb99';

-- ---- Futures: новая пара из формы ----

INSERT INTO public.tournament_registrations
       (tournament_id, player_id, partner_id, status, registered_at)
SELECT '7094e2bd-02e6-476b-9e0c-efc7bffc8418', 'elzar-azhibaev', 'musa-zhanybekov',
       'waitlist', '2026-09-10 17:58:00+00'
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations
        WHERE tournament_id = '7094e2bd-02e6-476b-9e0c-efc7bffc8418'
          AND player_id = 'elzar-azhibaev');

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ---- Проверка ----

SELECT CASE WHEN r.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
            THEN 'MASTERS' ELSE 'FUTURES' END AS турнир,
       row_number() OVER (PARTITION BY r.tournament_id ORDER BY r.registered_at) AS "№",
       p1.name AS участник,
       coalesce(p2.name, r.partner_external_name, '—') AS напарник,
       r.status AS состояние,
       to_char(r.registered_at, 'DD.MM HH24:MI') AS подана
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                           '7094e2bd-02e6-476b-9e0c-efc7bffc8418')
 ORDER BY турнир, r.registered_at;
-- Ожидаем: Masters 12 заявок, Futures 20 — 18 в составе и 2 в очереди.
-- В Masters №11 — Кирилл Леонтьев, в Futures Салих Исмаилов без напарника,
-- последняя строка — Элзар Ажибаев с Мусой Жаныбековым.

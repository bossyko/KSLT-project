    -- ============================================================
    -- Убрать тестовые заявки из дружеских турниров
    -- ============================================================
    --
    -- Заявки, поданные при проверке уведомлений и отказов. Клубного состава они
    -- не касаются: поданы 10 сентября, без напарника, а составы переносили из
    -- формы клуба ещё в начале месяца.
    --
    -- Удаляем только заявки Константина Хана в двух дружеских турнирах — чтобы
    -- составы стали такими, какими их собрал клуб: Masters 12 пар, Futures 18
    -- плюс очередь. Освободившееся место сразу отдаём первому из очереди.
    --
    -- Ни матчей, ни результатов на них не висит: турниры сброшены до заявок.
    --
    -- Masters — b8a6de7b-a146-4168-aaea-b56fb5dbd135
    -- Futures — 7094e2bd-02e6-476b-9e0c-efc7bffc8418
    --
    -- Запускать можно повторно.

    BEGIN;

    DELETE FROM public.tournament_registrations
     WHERE player_id = 'konstantin-han'
       AND tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                             '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

    -- Место освободилось — первый из очереди занимает его сам.
    --
    -- В Masters мест ровно 12, и тестовая заявка держала последнее: 12-я пара
    -- клуба (Арсен Умурзаков с Рамилем Мифтахутдиновым) из-за этого стояла в
    -- очереди. В Futures мест 18 при 19 заявках, поэтому там очередь останется —
    -- и это правильно, одна пара действительно не помещается.
    WITH места AS (
        SELECT t.id,
               t.max_participants - t.reserved_spots -
                   (SELECT count(*) FROM public.tournament_registrations r
                     WHERE r.tournament_id = t.id
                       AND r.status IN ('approved', 'pending', 'draw')) AS свободно
          FROM public.tournaments t
         WHERE t.id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                        '7094e2bd-02e6-476b-9e0c-efc7bffc8418')
    ),
    очередь AS (
        SELECT r.id,
               row_number() OVER (PARTITION BY r.tournament_id ORDER BY r.registered_at) AS номер,
               м.свободно
          FROM public.tournament_registrations r
          JOIN места м ON м.id = r.tournament_id
         WHERE r.status = 'waitlist'
    )
    UPDATE public.tournament_registrations r
       SET status = 'approved'
      FROM очередь о
     WHERE r.id = о.id
       AND о.номер <= о.свободно;

    COMMIT;

    -- ---- Проверка ----

    SELECT t.title AS турнир,
           (SELECT count(*) FROM public.tournament_registrations r
             WHERE r.tournament_id = t.id AND r.status = 'approved') AS в_составе,
           (SELECT count(*) FROM public.tournament_registrations r
             WHERE r.tournament_id = t.id AND r.status = 'waitlist') AS в_очереди,
           (SELECT count(*) FROM public.tournament_registrations r
             WHERE r.tournament_id = t.id AND r.player_id = 'konstantin-han') AS тестовых
      FROM public.tournaments t
     WHERE t.id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                    '7094e2bd-02e6-476b-9e0c-efc7bffc8418');
    -- Ожидаем: тестовых 0.
    -- Masters — 12 в составе, очередь пуста: 12-я пара заняла освободившееся место.
    -- Futures — 18 в составе и 1 в очереди: мест 18, а заявок клуба 19.

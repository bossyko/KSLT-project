    -- ============================================================
    -- Вернуть заявкам статус «принята» после сноса сетки
    -- ============================================================
    --
    -- Жеребьёвка переводит заявку из «принята» в «в сетке». Мы снесли матчи, а
    -- статус остался — и раздел «Заявки» показывал пусто при счётчике 12 из 12.
    --
    -- Запускать можно повторно.

    UPDATE public.tournament_registrations
       SET status = 'approved'
     WHERE status = 'draw'
       AND tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                             '7094e2bd-02e6-476b-9e0c-efc7bffc8418');

    SELECT t.title AS турнир, r.status AS состояние, count(*) AS заявок
      FROM public.tournament_registrations r
      JOIN public.tournaments t ON t.id = r.tournament_id
     WHERE r.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                               '7094e2bd-02e6-476b-9e0c-efc7bffc8418')
     GROUP BY 1, 2 ORDER BY 1, 2;

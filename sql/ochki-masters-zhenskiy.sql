-- ============================================================
-- Очки рейтинга: женский Masters
-- ============================================================
--
-- Первая заливка очков. Берём таблицу клуба «Рейтинг: женская категория
-- MASTERS»: три турнира-колонки и сумма по каждому игроку.
--
--   Вторая категория женский Masters 2025  — сезон 2025
--   Высшая категория женский Masters 2025  — сезон 2025
--   ТБШ Masters 2026 (женский)             — сезон 2026, турнир есть в базе
--
-- У турниров 2025 года дат не сохранилось, ставим 31 декабря 2025: на списание
-- это не влияет — важен сезон, а он у обоих 2025. Первого сентября 2027 очки
-- сезона 2025 перестанут считаться, и сумма пересчитается сама; сезон в каждой
-- строке для этого и проставлен.
--
-- Очки кладём в разряд Masters. Домашний разряд никому не меняем: игрок стоит
-- в своём и виден в том, где играл и набрал очки, — так устроен рейтинг.
--
-- ТБШ 2026 привязан к настоящему турниру, поэтому в карточке эта строка будет
-- кликабельной: откроется сетка с подсветкой матчей игрока. Две строки 2025
-- года — просто название и очки, сеток за тот год у нас нет.
--
-- Запускать можно повторно: старые строки заливки удаляются и пишутся заново.

BEGIN;

-- ---- Заливка ----
--
-- Всё одним блоком: редактор выполняет каждый запрос отдельной сессией, и
-- временная таблица между запросами не доживает — на этом файл уже спотыкался.

DO $$
BEGIN
    CREATE TEMP TABLE _ochki (
        igrok     text PRIMARY KEY,
        vtoraya   int,   -- Вторая категория 2025
        vysshaya  int,   -- Высшая категория 2025
        tbsh      int    -- ТБШ Masters 2026
    ) ON COMMIT DROP;

    INSERT INTO _ochki (igrok, vtoraya, vysshaya, tbsh) VALUES
            ('anastasiya-trofimushkina', 360, 1000, 1000),
            ('roza-isabekova', 50, 600, 600),
            ('tat-yana-nechaeva', 215, 360, 180),
            ('marianna-proskurina', 25, 250, 420),
            ('aysuluu-chokoeva', 150, 420, 90),
            ('gulmira-orozalieva', 50, 180, 360),
            ('shirin-karimova', 150, 0, 250),
            ('liliya-rahmatulina', 0, 145, 215),
            ('valeriya-pak', 0, 215, 110),
            ('keremet-begmatova', 0, 90, 180),
            ('aleksandra-muchkina', 0, 180, 45),
            ('natalya-timirbaeva', 0, 110, 110),
            ('elena-kan', 0, 90, 125),
            ('anastasiya-adzhibekova', 0, 125, 90),
            ('adel-dzhayloeva', 0, 0, 145),
            ('malika-shamil', 0, 110, 0),
            ('nazgul-kerimalieva', 0, 90, 0),
            ('aygerim-alizhanova', 0, 90, 0),
            ('kalima-askarova', 0, 0, 90),
            ('kalicha-taygurova', 0, 0, 90),
            ('amina-kurbanova', 0, 0, 80),
            ('ayday-orozbaeva', 0, 0, 65),
            ('barno-tursunova', 50, 0, 0),
            ('meerim-zhumabekova', 0, 0, 45),
            ('zulayka-talasbek-kyzy', 0, 0, 45);

    -- Все ли карточки на месте
    DECLARE потеряшки text;
    BEGIN
        SELECT string_agg(o.igrok, ', ') INTO потеряшки
          FROM _ochki o LEFT JOIN public.players p ON p.id = o.igrok
         WHERE p.id IS NULL;
        IF потеряшки IS NOT NULL THEN
            RAISE EXCEPTION 'Нет таких карточек: %', потеряшки;
        END IF;
    END;

    -- 1. Турниры 2025 года: строки истории без привязки к турниру.
    -- Именно такие карточка показывает как обычные записи, без перехода
    DELETE FROM public.rating_history
     WHERE tournament_id IS NULL
       AND tournament_name IN ('Вторая категория женский Masters 2025',
                               'Высшая категория женский Masters 2025');

    INSERT INTO public.rating_history (player_id, tournament_name, points_earned, recorded_at, category_id)
    SELECT igrok, 'Вторая категория женский Masters 2025', vtoraya, DATE '2025-12-31', 'masters'
      FROM _ochki WHERE vtoraya > 0;

    INSERT INTO public.rating_history (player_id, tournament_name, points_earned, recorded_at, category_id)
    SELECT igrok, 'Высшая категория женский Masters 2025', vysshaya, DATE '2025-12-31', 'masters'
      FROM _ochki WHERE vysshaya > 0;

    -- 2. ТБШ Masters 2026: результаты уже есть, их завела сетка при
    -- завершении турнира — только очки стояли нулями
    UPDATE public.tournament_results r
       SET points_earned = o.tbsh
      FROM _ochki o
     WHERE r.tournament_id = 'tbsh-masters-women-2026'
       AND r.player_id = o.igrok;

    INSERT INTO public.tournament_results (tournament_id, player_id, points_earned, season, category_id, round_reached)
    SELECT 'tbsh-masters-women-2026', o.igrok, o.tbsh, 2026, 'masters', ''
      FROM _ochki o
     WHERE o.tbsh > 0
       AND NOT EXISTS (SELECT 1 FROM public.tournament_results r
                        WHERE r.tournament_id = 'tbsh-masters-women-2026'
                          AND r.player_id = o.igrok);

    UPDATE public.rating_history h
       SET points_earned = o.tbsh,
           category_id   = 'masters'
      FROM _ochki o
     WHERE h.tournament_id = 'tbsh-masters-women-2026'
       AND h.player_id = o.igrok;

    -- 3. Сумма: разряд Masters и общий рейтинг
    DELETE FROM public.player_categories
     WHERE category_id = 'masters'
       AND player_id IN (SELECT igrok FROM _ochki);

    INSERT INTO public.player_categories (player_id, category_id, points)
    SELECT igrok, 'masters', vtoraya + vysshaya + tbsh
      FROM _ochki;

    UPDATE public.players p
       SET points = o.vtoraya + o.vysshaya + o.tbsh
      FROM _ochki o
     WHERE p.id = o.igrok;

    DROP TABLE _ochki;
END $$;

COMMIT;

-- ---- Проверка ----

SELECT p.name AS игрок,
       pc.points AS в_разряде_masters,
       p.points  AS общий,
       (SELECT count(*) FROM public.rating_history h
         WHERE h.player_id = p.id AND h.points_earned > 0) AS строк_истории
  FROM public.players p
  JOIN public.player_categories pc ON pc.player_id = p.id AND pc.category_id = 'masters'
 ORDER BY pc.points DESC;
-- Ожидаем 25 строк: сверху Трофимушкина 2360, следом Исабекова 1250.

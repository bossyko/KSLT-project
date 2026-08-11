-- ============================================
-- NTRP в карточке игрока хранится грубее, чем его выставляют
-- ============================================
--
-- В админке оценка выбирается с шагом в четверть балла: 4.0, 4.25, 4.5.
-- А колонка players.ntrp_rating объявлена numeric(3,1) — один знак после
-- запятой, — и база молча округляет: 4.25 превращается в 4.3.
--
-- Из-за этого одно и то же значение хранилось в двух видах: в карточке 4.3,
-- в истории (там numeric(4,2)) — 4.25. Форма показывала 4.25, база держала
-- 4.3, и понять, менялась оценка или нет, было нельзя.
--
-- Проверка на боевой базе: han-konstantin — в карточке 4.3, в истории 4.25.
--
-- Делаем точность одинаковой: два знака, как в истории.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Что сейчас расходится -----------------------------------------
-- Карточка против последней записи в истории.
SELECT p.id, p.ntrp_rating AS в_карточке, h.ntrp_after AS в_истории
FROM players p
JOIN LATERAL (
    SELECT ntrp_after FROM rating_history
    WHERE player_id = p.id AND ntrp_after IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
) h ON true
WHERE p.ntrp_rating IS DISTINCT FROM h.ntrp_after;


-- ---- 3. Расширить колонку ---------------------------------------------
ALTER TABLE public.players
    ALTER COLUMN ntrp_rating TYPE numeric(4,2);


-- ---- 4. Подтянуть карточки к истории ----------------------------------
-- Там, где оценка уже записывалась, карточка берёт точное значение.
UPDATE players p
SET ntrp_rating = (
    SELECT ntrp_after FROM rating_history
    WHERE player_id = p.id AND ntrp_after IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM rating_history
    WHERE player_id = p.id AND ntrp_after IS NOT NULL
);


-- ---- 5. ПРОВЕРКА ------------------------------------------------------
-- Должно быть 0: карточка и история сошлись.
SELECT count(*) AS осталось_расхождений
FROM players p
JOIN LATERAL (
    SELECT ntrp_after FROM rating_history
    WHERE player_id = p.id AND ntrp_after IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
) h ON true
WHERE p.ntrp_rating IS DISTINCT FROM h.ntrp_after;

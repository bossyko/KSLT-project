-- ============================================================
-- Мировые новости: что предлагать первым
-- ============================================================
--
-- Первый живой сбор дал 73 находки: 34 русские и 39 английских. Выбор шёл
-- только по свежести, и менеджеру прилетало вперемешку — а на сайте
-- заголовок публикуется как есть, без перевода. Английский заголовок в
-- ленте клуба половина читателей просто пролистает.
--
-- Теперь два правила:
--
--   1. Русская находка идёт вперёд. Английскую предлагаем, только когда
--      русских не осталось.
--   2. Ничего старше трёх дней. BBC держит в ленте подборки недельной
--      давности — «лучшие удары Уимблдона» новостью дня выглядят странно.
--
-- Дата у находки бывает пустой: не все ленты её отдают. Тогда считаем по
-- времени, когда мы её нашли.
--
-- Файл меняет базу. Читающие запросы — в world-news-feed-check.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.next_news_suggestion()
RETURNS SETOF public.news_suggestions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
      FROM news_suggestions
     WHERE (status = 'new'
            OR (status = 'offered' AND offers < 3 AND offered_at < now() - interval '24 hours'))
       AND COALESCE(published_at, created_at) > now() - interval '3 days'
     ORDER BY (lang = 'ru') DESC,        -- русские вперёд
              (status = 'new') DESC,     -- новое раньше повторного показа
              COALESCE(published_at, created_at) DESC
     LIMIT 1;
$$;

-- ---- Прибираем то, что уже не предложим ----
-- Находка старше трёх дней под правило выбора не подходит и будет висеть
-- в базе мёртвым грузом. Помечаем сразу, чтобы таблица не пухла.

CREATE OR REPLACE FUNCTION public.expire_old_suggestions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
    -- Предлагали трижды, никто не ответил
    UPDATE news_suggestions
       SET status = 'expired'
     WHERE status = 'offered'
       AND offers >= 3
       AND offered_at < now() - interval '24 hours';
    GET DIAGNOSTICS n = ROW_COUNT;

    -- И всё, что старше отсечки: предложить это мы уже не сможем
    UPDATE news_suggestions
       SET status = 'expired'
     WHERE status IN ('new', 'offered')
       AND COALESCE(published_at, created_at) < now() - interval '3 days';

    RETURN n;
END;
$$;

COMMIT;

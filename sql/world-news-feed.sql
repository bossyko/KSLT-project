-- ============================================================
-- Мировые новости: лента находок и её подтверждение
-- ============================================================
--
-- В разделе новостей есть категория «Мировые новости», и она пустая:
-- заполнять её значит каждый день искать статьи руками, а на это ни у кого
-- нет времени. Поэтому она так и стоит незаполненной.
--
-- Здесь заготовка под другой порядок: машина ищет, человек одобряет.
--
--   1. Раз в несколько часов обходим ленты источников и складываем находки
--      сюда. На сайте их не видно — это черновики.
--   2. Дважды в день одна находка уходит менеджерам в Telegram с двумя
--      кнопками.
--   3. Нажали «Опубликовать» — появляется обычная новость категории world.
--      Нажали «Пропустить» — находка больше не предлагается.
--
-- Чужой текст не перепечатываем: берём заголовок, ставим ссылку на
-- первоисточник и его название. Картинки не трогаем вовсе — они отдельный
-- объект права, и именно за них прилетает чаще всего.
--
-- Шлём всем менеджерам сразу, для надёжности: кто первый нажал, того и
-- решение. Второму бот скажет, что уже обработано.
--
-- Непринятое за сутки предлагаем снова — до трёх раз, дальше забываем:
-- новость недельной давности уже не новость.
--
-- Файл меняет базу. Читающие запросы — в world-news-feed-check.sql.

BEGIN;

-- ---- Источники ----
-- Список правится в админке, без правки кода.

CREATE TABLE IF NOT EXISTS public.news_sources (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    feed_url   text NOT NULL UNIQUE,
    site_url   text,
    lang       text NOT NULL DEFAULT 'ru',
    active     boolean NOT NULL DEFAULT true,
    last_fetch timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT news_sources_lang_check CHECK (lang IN ('ru', 'en'))
);

COMMENT ON TABLE public.news_sources IS
    'Ленты, из которых берём мировые новости. Выключается флажком, а не удалением.';

-- ---- Находки ----

CREATE TABLE IF NOT EXISTS public.news_suggestions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id    uuid REFERENCES public.news_sources(id) ON DELETE SET NULL,
    title        text NOT NULL,
    link         text NOT NULL,
    -- Один и тот же материал приходит в ленте не раз: ключ бережёт от повторов
    link_key     text NOT NULL UNIQUE,
    source_name  text,
    lang         text,
    published_at timestamptz,
    status       text NOT NULL DEFAULT 'new',
    offered_at   timestamptz,
    offers       integer NOT NULL DEFAULT 0,
    decided_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    decided_at   timestamptz,
    news_id      text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT news_suggestions_status_check
        CHECK (status IN ('new', 'offered', 'published', 'skipped', 'expired'))
);

COMMENT ON COLUMN public.news_suggestions.status IS
    'new — нашли, ещё не предлагали; offered — ушла менеджерам, ждём ответа; published — одобрена; skipped — отклонена; expired — предлагали трижды, больше не будем.';

CREATE INDEX IF NOT EXISTS idx_news_suggestions_status
    ON public.news_suggestions (status, published_at DESC);

-- ---- Кого предложить следующим ----
--
-- Сначала новые, потом те, что уже предлагали, но никто не ответил сутки.
-- Свежие вперёд: новость двухдневной давности хуже вчерашней.

CREATE OR REPLACE FUNCTION public.next_news_suggestion()
RETURNS SETOF public.news_suggestions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM news_suggestions
     WHERE status = 'new'
        OR (status = 'offered' AND offers < 3 AND offered_at < now() - interval '24 hours')
     ORDER BY (status = 'new') DESC, published_at DESC NULLS LAST
     LIMIT 1;
$$;

-- ---- Что предлагали трижды — забываем ----

CREATE OR REPLACE FUNCTION public.expire_old_suggestions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
    UPDATE news_suggestions
       SET status = 'expired'
     WHERE status = 'offered'
       AND offers >= 3
       AND offered_at < now() - interval '24 hours';
    GET DIAGNOSTICS n = ROW_COUNT;

    -- И совсем старые находки, до которых руки не дошли
    UPDATE news_suggestions
       SET status = 'expired'
     WHERE status = 'new'
       AND created_at < now() - interval '7 days';

    RETURN n;
END;
$$;

-- ---- Права ----
-- Читает персонал, пишет только служебный ключ: находки заводит машина.

ALTER TABLE public.news_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS news_sources_staff ON public.news_sources;
CREATE POLICY news_sources_staff ON public.news_sources
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS news_suggestions_staff ON public.news_suggestions;
CREATE POLICY news_suggestions_staff ON public.news_suggestions
    FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---- Первые источники ----
-- Русские вперёд: половина читателей английский не откроет.

INSERT INTO public.news_sources (name, feed_url, site_url, lang) VALUES
    ('Sports.ru · теннис', 'https://www.sports.ru/rss/rubric.xml?s=113', 'https://www.sports.ru/tennis/', 'ru'),
    ('Championat · теннис', 'https://www.championat.com/rss/news/tennis/', 'https://www.championat.com/tennis/', 'ru'),
    ('ATP Tour',            'https://www.atptour.com/en/media/rss-feed/xml-feed', 'https://www.atptour.com', 'en'),
    ('WTA',                 'https://www.wtatennis.com/rss.xml', 'https://www.wtatennis.com', 'en'),
    ('BBC Sport · теннис',  'https://feeds.bbci.co.uk/sport/tennis/rss.xml', 'https://www.bbc.com/sport/tennis', 'en')
ON CONFLICT (feed_url) DO NOTHING;

COMMIT;

-- ============================================================
-- Расписание
-- ============================================================
-- Сбор — раз в три часа. Предложение — дважды в день, в 10:00 и 18:00 по
-- Бишкеку, то есть в 04:00 и 12:00 по Гринвичу.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('news-fetch')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'news-fetch');
SELECT cron.unschedule('news-offer-morning')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'news-offer-morning');
SELECT cron.unschedule('news-offer-evening')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'news-offer-evening');

SELECT cron.schedule('news-fetch', '13 */3 * * *', $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/news-fetch',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'),
    body := '{}'::jsonb);
$$);

SELECT cron.schedule('news-offer-morning', '0 4 * * *', $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/news-offer',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'),
    body := '{}'::jsonb);
$$);

SELECT cron.schedule('news-offer-evening', '0 12 * * *', $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/news-offer',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'),
    body := '{}'::jsonb);
$$);

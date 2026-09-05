-- ============================================================
-- Мировые новости: правим список лент
-- ============================================================
--
-- Первый живой сбор показал, что две ленты из пяти мертвы, а третья
-- отвечает пустотой:
--
--   ATP Tour   — 403, закрылись от чтения роботами;
--   WTA        — 404, адреса больше нет;
--   Sports.ru  — 200, но ни одной записи: у рубрики 113 ленты нет.
--
-- Адреса я брал по памяти, живьём не проверял — на этом и погорел.
-- Теперь каждый проверен запросом: код ответа и число записей.
--
-- Работают: Championat (31 запись), BBC Sport (54), ESPN (9).
--
-- У ATP и WTA открытых лент нет вовсе, замена им — ESPN: он пишет и про
-- мужской тур, и про женский.
--
-- Sports.ru отдаёт только общую ленту главных новостей. Это не беда:
-- сбор просеивает такие ленты по теме и берёт из них лишь теннис.
--
-- Мёртвые ленты не удаляем, а выключаем: если ATP когда-нибудь откроется,
-- достаточно будет вернуть флажок.
--
-- Файл меняет базу. Читающие запросы — в world-news-feed-check.sql.

BEGIN;

UPDATE public.news_sources SET active = false
 WHERE feed_url IN ('https://www.atptour.com/en/media/rss-feed/xml-feed',
                    'https://www.wtatennis.com/rss.xml');

-- Sports.ru: рубричная лента пуста, берём общую и просеиваем по теме
UPDATE public.news_sources
   SET feed_url = 'https://www.sports.ru/rss/topnews.xml',
       name     = 'Sports.ru · главные новости'
 WHERE feed_url = 'https://www.sports.ru/rss/rubric.xml?s=113';

INSERT INTO public.news_sources (name, feed_url, site_url, lang) VALUES
    ('ESPN · теннис', 'https://www.espn.com/espn/rss/tennis/news',
     'https://www.espn.com/tennis/', 'en')
ON CONFLICT (feed_url) DO NOTHING;

COMMIT;

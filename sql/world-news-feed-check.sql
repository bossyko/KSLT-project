-- ============================================================
-- Мировые новости: что происходит со сбором
-- ============================================================
--
-- Только читает. Ничего не меняет — можно запускать в любой базе
-- и сколько угодно раз. Правку делает world-news-feed.sql.
--
-- Запускать целиком: ответом придут несколько таблиц подряд.

-- ---- 1. Расписание: заведено ли и где ----
-- В тестовой базе расписания быть не должно: бот один на две базы,
-- и предложения пойдут вперемешку.

SELECT jobid, jobname, schedule, active
  FROM cron.job
 WHERE jobname LIKE 'news-%'
 ORDER BY jobname;

-- ---- 2. Источники: кто отвечает, кто молчит ----
-- last_fetch пустой — сбор до этой ленты ни разу не доходил.
-- Стоит давно — лента отвечает ошибкой, смотри пункт 5.

SELECT name,
       lang,
       active,
       last_fetch,
       CASE
           WHEN last_fetch IS NULL THEN 'ни разу не читали'
           WHEN last_fetch < now() - interval '6 hours' THEN 'молчит больше шести часов'
           ELSE 'свежая'
       END AS состояние,
       feed_url
  FROM news_sources
 ORDER BY (last_fetch IS NULL) DESC, name;

-- ---- 3. Сколько находок и в каком они состоянии ----

SELECT status,
       count(*) AS сколько,
       min(created_at) AS самая_старая,
       max(created_at) AS самая_свежая
  FROM news_suggestions
 GROUP BY status
 ORDER BY сколько DESC;

-- ---- 4. Последние двадцать находок ----

SELECT s.created_at,
       s.status,
       s.source_name,
       s.offers AS сколько_раз_предлагали,
       left(s.title, 70) AS заголовок,
       p.full_name AS решил
  FROM news_suggestions s
  LEFT JOIN profiles p ON p.id = s.decided_by
 ORDER BY s.created_at DESC
 LIMIT 20;

-- ---- 5. Что уйдёт менеджерам следующим ----

SELECT left(title, 80) AS заголовок, source_name, published_at
  FROM next_news_suggestion();

-- ---- 6. Ответы на вызовы функций ----
-- Сюда падают ответы расписания. 401 — не сходится ключ, 404 — функция
-- не выложена, 200 с текстом внутри — смотреть, что вернул сбор.

SELECT r.id,
       r.status_code,
       left(r.content, 300) AS ответ,
       r.created
  FROM net._http_response r
 ORDER BY r.id DESC
 LIMIT 10;

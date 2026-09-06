-- ============================================================
-- Сборки приложения: проверка
-- ============================================================
-- Только читает. Правку делает app-releases.sql.

-- ---- Что записано ----

SELECT platform, version_code AS номер, version_name AS название,
       url AS ссылка, notes AS примечание, published_at AS выпущена
  FROM app_releases
 ORDER BY platform, version_code DESC;

-- ---- Видно ли это гостю ----
-- Полоску надо показать и тому, кто не вошёл, поэтому чтение открыто всем.

SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS кому_видно
  FROM pg_policy
 WHERE polrelid = 'app_releases'::regclass;

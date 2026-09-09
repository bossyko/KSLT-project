-- ============================================================
-- Кто может звать функции сетки «все места»
-- ============================================================
--
-- Функции пересборки и проведения проходов меняют сетку и написаны с правами
-- владельца — иначе они не смогли бы править чужие строки. Но по умолчанию в
-- Postgres звать функцию может кто угодно, а через Supabase «кто угодно» —
-- это любой гость сайта: достаточно знать номер турнира, чтобы пересобрать
-- его сетку.
--
-- Здесь право вызова снимается с гостей и оставляется только вошедшим:
-- проверка на администратора остаётся внутри админки.
--
-- fic_адрес трогать незачем: он ничего не меняет, только считает адрес.
--
-- Запускать можно повторно.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.fic_пересобрать(text)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fic_закрыть_проходы(text)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fic_заменить_дальше(text, integer, text, text)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fic_пересобрать(text)      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fic_закрыть_проходы(text)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fic_заменить_дальше(text, integer, text, text)
    TO authenticated, service_role;

COMMIT;

-- Кто теперь может звать
SELECT p.proname AS функция,
       coalesce(array_to_string(p.proacl, ', '), 'права по умолчанию') AS права
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('fic_пересобрать', 'fic_закрыть_проходы', 'fic_заменить_дальше')
 ORDER BY p.proname;

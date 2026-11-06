-- СЧЁТЧИКИ ПРОСМОТРОВ НЕ СЧИТАЛИ НИЧЕГО: ПОНЯТИЕ ОПРЕДЕЛЕНО ДВАЖДЫ (06.11).
--
-- ЧТО ПОМЕРЕНО. Открытие карточки корта, тренера, турнира, игрока или
-- новости на сайте дёргает `increment_*_view` и получает от базы
-- 300 Multiple Choices. Проверено обходом new.tennis.kg: падают все
-- вызовы с сайта, на всех трёх языках.
--
-- ПРИЧИНА, НАЗВАННАЯ ФАЙЛОМ И СТРОКОЙ. В базе каждая из шести функций
-- живёт В ДВУХ ВАРИАНТАХ (`sql/схема/schema-snapshot.sql`, строки
-- 3948–4101):
--     increment_court_view(p_id text)
--     increment_court_view(p_id text, p_source text DEFAULT 'site')
-- Старую завела `sql/схема/views-counter-migration.sql`, новую —
-- `sql/схема/app-view-counter.sql`, и вторая не убрала за собой первую.
-- Сайт зовёт с ОДНИМ аргументом (`js/courts.js:326`, `js/coaches.js:713`,
-- `js/tournament-detail.js:900`, `js/player.js:2310`), и PostgREST не
-- может выбрать между двумя подходящими — отсюда 300.
--
-- ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: беда родилась ровно на шве.
--
-- ПОЧЕМУ ПРИЛОЖЕНИЕ СЧИТАЛО, А САЙТ НЕТ. Приложение зовёт с двумя
-- аргументами (`mobile/www/js/app.js:734`, `p_source = 'app'`) — там
-- выбор однозначен. Поэтому поломка пряталась: просмотры из приложения
-- шли, а с сайта нет, и общий счётчик выглядел живым.
--
-- ЧЕМ ЧИНИМ. Удаляем ШЕСТЬ старых однопараметровых версий. Вызов с одним
-- аргументом после этого попадёт в двухпараметровую, где источник имеет
-- значение по умолчанию 'site' — ровно то, что сайту и нужно.
--
-- ЧЕГО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ: не трогает `increment_page_view` — она в
-- единственном числе, и дубля у неё нет. Не меняет тела оставшихся
-- функций, не трогает права и не трогает сами счётчики в таблицах.

BEGIN;

DROP FUNCTION IF EXISTS public.increment_court_view(p_id text);
DROP FUNCTION IF EXISTS public.increment_coach_view(p_id text);
DROP FUNCTION IF EXISTS public.increment_player_view(p_id text);
DROP FUNCTION IF EXISTS public.increment_news_view(p_news_id text);
DROP FUNCTION IF EXISTS public.increment_tournament_view(p_tournament_id text);
DROP FUNCTION IF EXISTS public.increment_sponsor_view(p_id uuid);

COMMIT;


-- ---- ПРОВЕРКА: ЧИТАЕМ БАЗУ, А НЕ ОТВЕТ «Success» ------------------
--
-- Ждём ШЕСТЬ строк, и у каждой versiy = 1. Любая двойка значит, что
-- дубль остался и 300 вернётся. Седьмой строкой идёт increment_page_view
-- — она и была одна, её не трогали.

SELECT p.proname                                   AS funkciya,
       count(*)                                    AS versiy,
       string_agg(pg_get_function_identity_arguments(p.oid), ' | ' ORDER BY p.oid) AS argumenty
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname LIKE 'increment=_%=_view' ESCAPE '='
 GROUP BY p.proname
 ORDER BY p.proname;

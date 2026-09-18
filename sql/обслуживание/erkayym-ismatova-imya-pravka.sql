-- ============================================================
-- Опечатка в имени: Эракйым → Эркайым — ПРАВКА
-- ============================================================
--
-- Было «Эракйым Исматова», стало «Эркайым Исматова».
--
-- Порядок важен. Имя карточки следует за кабинетом: триггер
-- `trg_sync_player_name` переписывает `players.name` при смене
-- `profiles.full_name`. Поэтому сперва правим профиль — если он есть, —
-- а карточку трогаем только там, где кабинета нет: иначе следующий вход
-- человека вернёт старое написание.
--
-- Опознаватель карточки (`erakyym-ismatova`) остаётся прежним: на него
-- ссылаются заявки, матчи и история очков. Человеку он не виден.
--
-- Запускать можно повторно: правится только то, что ещё со старым именем.

BEGIN;

-- ---- Кабинет ----

UPDATE public.profiles
   SET full_name = 'Эркайым Исматова'
 WHERE full_name ILIKE '%ракйым%';

-- ---- Карточка ----
--
-- Триггер уже поправил её тем, у кого есть кабинет. Остальным правим сами,
-- заодно латиницу: она показывается на английской версии сайта.

UPDATE public.players
   SET name    = 'Эркайым Исматова',
       name_en = 'Erkayym Ismatova'
 WHERE (name ILIKE '%ракйым%' OR id = 'erakyym-ismatova')
   AND name IS DISTINCT FROM 'Эркайым Исматова';

-- ---- Заявки, где имя осталось строкой ----
--
-- Гостя заводят карточкой, но старые заявки могли сохранить одно имя.

UPDATE public.tournament_registrations
   SET external_name = 'Эркайым Исматова'
 WHERE external_name ILIKE '%ракйым%';

UPDATE public.tournament_registrations
   SET partner_external_name = 'Эркайым Исматова'
 WHERE partner_external_name ILIKE '%ракйым%';

COMMIT;

-- ---- Проверка ----

SELECT 'карточка'::text AS где, p.id AS опознаватель, p.name AS написано, p.name_en AS латиницей
  FROM public.players p
 WHERE p.id = 'erakyym-ismatova' OR p.name ILIKE '%ркайым%'
UNION ALL
SELECT 'кабинет', pr.player_id, pr.full_name, pr.email
  FROM public.profiles pr
 WHERE pr.full_name ILIKE '%ркайым%'
UNION ALL
SELECT 'старое написание осталось', p.id, p.name, '—'
  FROM public.players p
 WHERE p.name ILIKE '%ракйым%'
ORDER BY 1;

-- Ожидаем: «Эркайым Исматова» в карточке и в кабинете,
-- строк «старое написание осталось» нет.

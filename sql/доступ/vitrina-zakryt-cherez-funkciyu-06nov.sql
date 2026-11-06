-- ВИТРИНА ИГРОКОВ ОТДАВАЛА ГОСТЮ ОТКАЗ, А НЕ СПИСОК (06.11). ПОЧИНКА.
--
-- ЧТО ПОМЕРЕНО. Гость на сайте и в приложении получал от базы
--     42501 permission denied for table players
-- на ЛЮБОЙ запрос к `players_public` — даже на `select id,name,points`.
-- Проверено в браузере на двух адресах, на обоих одинаково. Вошедший
-- при этом видел всё, поэтому в админке поломка была не видна.
--
-- ПРИЧИНА, НАЗВАННАЯ ФАЙЛОМ И СТРОКОЙ. 04.11 файл
-- `sql/доступ/players-public-zakryt-04nov.sql` пересоздал витрину и
-- добавил в неё признак `zakryt`, который читает `p.banned_until` и
-- таблицу `public.profiles`. Витрина стоит на `security_invoker = on`,
-- то есть читает ПРАВАМИ СПРАШИВАЮЩЕГО. А гостю столбец `banned_until`
-- не выдан намеренно — `sql/доступ/players-public-view.sql`, строки
-- 61–72: колоночный GRANT без него. Витрина упёрлась в собственный
-- запрет.
--
-- ПРАВИЛО, КОТОРОЕ ИЗ ЭТОГО СЛЕДУЕТ:
--   ВИТРИНА С security_invoker ТРЕБУЕТ ПРАВ НА ВСЁ СВОЁ ОПРЕДЕЛЕНИЕ,
--   А НЕ НА ЗАПРОШЕННЫЕ СТОЛБЦЫ.
-- Поэтому `select id` падал так же, как `select *`: Postgres проверяет
-- права по телу витрины целиком, до того как отбросит лишние столбцы.
--
-- ЧЕМ ЧИНИМ И ЧЕМ ЗА ЭТО ПЛАТИМ. Признак «закрыт» выносится в функцию
-- SECURITY DEFINER: она считает его правами владельца и отдаёт ОДНО
-- булево значение по одному игроку. Витрина остаётся на
-- security_invoker — правила строк по-прежнему действуют на гостя, —
-- а гостю выдаётся только право ВЫЗВАТЬ функцию. Срок бана и причина
-- гостю не отдаются, как и было задумано.
-- Платим вызовом функции на строку: два поиска по ключу. Для списка
-- игроков это дешевле, чем отдавать гостю столбец `banned_until`.
--
-- ЧЕГО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ: не трогает правила строк, не трогает роли,
-- не меняет набор столбцов витрины и не выдаёт никому новых прав на
-- `players` и `profiles`.

BEGIN;

CREATE OR REPLACE FUNCTION public.igrok_zakryt(p_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
    SELECT (p.banned_until IS NOT NULL AND p.banned_until > now())
        OR EXISTS (SELECT 1 FROM public.profiles pr
                    WHERE pr.player_id = p.id
                      AND pr.banned_until IS NOT NULL
                      AND pr.banned_until > now())
      FROM public.players p
     WHERE p.id = p_id;
$fn$;

COMMENT ON FUNCTION public.igrok_zakryt(text) IS
    'Один признак на ОБА вида бана: закрыта учётная запись (profiles.banned_until) или закрыта карточка (players.banned_until). Считает правами владельца, чтобы витрина players_public могла отдавать признак гостю, не отдавая ему сам срок и причину.';

REVOKE ALL ON FUNCTION public.igrok_zakryt(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.igrok_zakryt(text) TO anon;
GRANT EXECUTE ON FUNCTION public.igrok_zakryt(text) TO authenticated;

DROP VIEW IF EXISTS public.players_public;

CREATE VIEW public.players_public
WITH (security_invoker = on) AS
SELECT p.id,
       p.name, p.name_en, p.name_kg,
       p.photo, p.country, p.category_id,
       p.points, p.wins, p.losses, p.rank_change, p.form,
       p.doubles_wins, p.doubles_losses, p.mixed_wins, p.mixed_losses,
       p.ntrp_singles, p.ntrp_doubles,
       p.gender, p.bio, p.bio_en, p.bio_kg,
       p.is_online, p.is_member, p.is_guest, p.has_account,
       p.view_count, p.view_count_app,
       p.created_at, p.updated_at,
       public.igrok_zakryt(p.id) AS zakryt
  FROM public.players p;

COMMENT ON VIEW public.players_public IS
    'Карточки игроков для гостей: без email, phone, show_phone, banned_until, ban_reason и отметки об удалении аккаунта. Столбец zakryt — один признак на ОБА вида бана, считается функцией igrok_zakryt правами владельца. Срок и причина не отдаются.';

GRANT SELECT ON public.players_public TO anon;
GRANT SELECT ON public.players_public TO authenticated;

COMMIT;


-- ---- ПРОВЕРКА: одна строка, читается база, а не ответ «Success» -----
--
-- Ждём ровно это:
--   gost_vidit_vitrinu = true   — право гостя на витрину есть
--   gost_ne_vidit_ban  = true   — столбец banned_until гостю НЕ выдан
--   est_stolbec        = true   — признак zakryt на месте
--   strok              > 0      — витрина РЕАЛЬНО читается и отдаёт игроков
--   zakrytyh           = сколько есть сейчас (ноль — это не беда)
--
-- `strok` — главное число: до починки этот же счёт падал с 42501.

SELECT has_table_privilege('anon', 'public.players_public', 'SELECT')      AS gost_vidit_vitrinu,
       NOT has_column_privilege('anon', 'public.players', 'banned_until', 'SELECT')
                                                                           AS gost_ne_vidit_ban,
       (SELECT count(*) > 0 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'players_public'
           AND column_name = 'zakryt')                                     AS est_stolbec,
       (SELECT count(*) FROM public.players_public)                        AS strok,
       (SELECT count(*) FROM public.players_public WHERE zakryt)           AS zakrytyh;


-- ---- ПРОВЕРКА ГЛАЗАМИ ГОСТЯ ----------------------------------------
--
-- Счёт выше выполняется ТВОИМИ правами, а поломка была именно у гостя:
-- «у меня зелёное» ничего не доказывает. Поэтому второй счёт идёт
-- ПОД РОЛЬЮ anon. Ждём strok_glazami_gostya > 0 и ни одной ошибки.
-- Блок ничего не меняет: он откатывается.

BEGIN;
SET LOCAL ROLE anon;
SELECT count(*) AS strok_glazami_gostya FROM public.players_public;
ROLLBACK;

-- ============================================================
-- Гость не должен видеть почту, телефон и причину бана
-- ============================================================
--
-- Таблица players открыта анонимному ключу целиком: запрос из консоли
-- браузера без входа возвращает все колонки, включая email, phone,
-- show_phone, banned_until и ban_reason. Сейчас они пусты у всех, но
-- колонки открыты — как только клуб начнёт их заполнять, они утекут. RLS
-- тут не поможет: она отбирает строки, а не столбцы.
--
-- Лечим правами на столбцы: гостю выдаём чтение только безопасных колонок.
-- Тогда `select=*` от анонима упирается в отказ, а `select=id,name` работает
-- как прежде. Поверх — вьюха players_public: тот же набор колонок с именем,
-- по которому сразу видно, что это витрина для гостя.
--
-- Вьюха читает от имени того, кто спрашивает (security_invoker). Так она не
-- добавляет никаких прав и не обходит правила строк — только убирает лишние
-- столбцы из выдачи. Без этого Supabase справедливо ругается: вьюха без
-- security_invoker работает от владельца и обходит RLS.
--
-- Запускать можно повторно.

BEGIN;

-- ---- 1. Витрина ----

DROP VIEW IF EXISTS public.players_public;

CREATE VIEW public.players_public
WITH (security_invoker = on) AS
SELECT id,
       name, name_en, name_kg,
       photo, country, category_id,
       points, wins, losses, rank_change, form,
       doubles_wins, doubles_losses, mixed_wins, mixed_losses,
       ntrp_singles, ntrp_doubles,
       gender, bio, bio_en, bio_kg,
       is_online, is_member, is_guest, has_account,
       view_count, view_count_app,
       created_at, updated_at
  FROM public.players;

COMMENT ON VIEW public.players_public IS
    'Карточки игроков для гостей: без email, phone, show_phone, banned_until, ban_reason и отметки об удалении аккаунта.';

-- ---- 2. Права гостя ----
--
-- Сначала снимаем всё. В схеме стоит раздача по умолчанию: каждый новый
-- объект получает полные права для anon и authenticated — так их получила и
-- сама players, и эта вьюха. Гостю карточки менять незачем ни при каких
-- условиях, а вьюха из одной таблицы вдобавок обновляемая.

REVOKE ALL ON public.players_public FROM anon, authenticated;
REVOKE ALL ON public.players        FROM anon;

GRANT SELECT ON public.players_public TO anon, authenticated;

-- Чтение по столбцам: всё, кроме почты, телефона, признака показа телефона,
-- бана и отметки об удалении аккаунта. Без этого вьюха от имени гостя
-- упрётся в тот же запрет, ради которого заводилась
GRANT SELECT (
    id,
    name, name_en, name_kg,
    photo, country, category_id,
    points, wins, losses, rank_change, form,
    doubles_wins, doubles_losses, mixed_wins, mixed_losses,
    ntrp_singles, ntrp_doubles,
    gender, bio, bio_en, bio_kg,
    is_online, is_member, is_guest, has_account,
    view_count, view_count_app,
    created_at, updated_at
) ON public.players TO anon;

-- ---- 3. Права вошедшего ----
--
-- Вошедшему таблица была открыта целиком. Контактов в ней всё равно нет —
-- телефон и почта живут в profiles, и там своя защита: человек читает только
-- собственную строку. А колонки players.email, players.phone, show_phone и
-- account_deleted_at пусты у всех и не читаются ниоткуда: это мёртвый след,
-- и держать его открытым незачем.
--
-- Бан оставляем: его показывает админка и по нему объясняют отказ в записи
-- на турнир.

REVOKE ALL ON public.players FROM authenticated;

GRANT SELECT (
    id,
    name, name_en, name_kg,
    photo, country, category_id,
    points, wins, losses, rank_change, form,
    doubles_wins, doubles_losses, mixed_wins, mixed_losses,
    ntrp_singles, ntrp_doubles,
    gender, bio, bio_en, bio_kg,
    is_online, is_member, is_guest, has_account,
    view_count, view_count_app,
    created_at, updated_at,
    banned_until, ban_reason
) ON public.players TO authenticated;

-- Карточки ведут админ и менеджер — через админку, под своей ролью. Записи
-- проверяет политика строк, поэтому права на запись возвращаем целиком
GRANT INSERT, UPDATE, DELETE ON public.players TO authenticated;

COMMIT;

-- ---- Проверка ----

SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS колонки_вьюхи
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'players_public';

-- Права на таблицу целиком: у anon остаться не должно ничего
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name IN ('players', 'players_public')
   AND grantee IN ('anon', 'authenticated')
 ORDER BY table_name, grantee, privilege_type;

-- А по столбцам: что читает гость и что вошедший
SELECT grantee AS кто,
       string_agg(column_name, ', ' ORDER BY column_name) AS столбцы
  FROM information_schema.column_privileges
 WHERE table_schema = 'public' AND table_name = 'players'
   AND grantee IN ('anon', 'authenticated') AND privilege_type = 'SELECT'
 GROUP BY grantee;
-- Ожидаем: ни у гостя, ни у вошедшего нет email, phone, show_phone и
-- account_deleted_at. Бан виден только вошедшему.

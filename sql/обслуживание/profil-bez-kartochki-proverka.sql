-- ============================================================
-- «У вас нет карточки игрока» — кто к кому привязан
-- ============================================================
--
-- Такой отказ функция даёт, когда у профиля, под которым вошёл человек, поле
-- player_id пустое. Значит, дело не в самой карточке, а в связи между ней и
-- учётной записью.
--
-- Запрос только читает, ничего не меняет.

-- 1. Профили с похожей почтой или именем: под каким входим и что у него стоит
SELECT p.id               AS профиль,
       p.email,
       p.full_name        AS имя,
       p.player_id        AS привязанная_карточка,
       p.telegram_chat_id AS телеграм,
       p.role             AS роль,
       p.created_at       AS заведён
  FROM public.profiles p
 WHERE p.email ILIKE '%bossyko%'
    OR p.full_name ILIKE '%Хан%'
 ORDER BY p.created_at;

-- 1a. Главное: у кого привязан телеграм и есть ли у него карточка.
-- Бот ищет профиль по telegram_chat_id — и если карточки нет, дальше не идёт
SELECT p.id               AS профиль,
       p.email,
       p.full_name        AS имя,
       p.telegram_chat_id AS телеграм,
       p.player_id        AS карточка
  FROM public.profiles p
 WHERE p.telegram_chat_id IS NOT NULL
   AND p.player_id IS NULL
 ORDER BY p.created_at;

-- 2. Кто ссылается на карточку konstantin-han
SELECT p.id AS профиль, p.email, p.full_name AS имя
  FROM public.profiles p
 WHERE p.player_id = 'konstantin-han';

-- 3. Сама карточка: жива ли и с чем
SELECT id, name, gender, category_id, is_member, is_guest, has_account
  FROM public.players
 WHERE id = 'konstantin-han';

-- ============================================
-- Показ телефона на карточке игрока
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Телефон хранился в двух местах, никак не связанных между собой:
--
--   profiles.phone  — то, что игрок вводит в кабинете
--   players.phone   — то, что читала публичная карточка
--
-- Игрок вводил номер в кабинете, а карточка смотрела в другую колонку и
-- показывала пусто. Так было всегда, независимо от настроек.
--
-- Разрешение на показ лежало на players.show_phone, и включить его игроку
-- было негде: в админке галочка заблокирована, в кабинете и в приложении её
-- не существовало.
--
-- Переносим разрешение туда же, где живёт сам телефон и где уже есть точно
-- такая же настройка для соцсетей — show_socials.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.show_phone IS
    'Показывать телефон другим членам клуба на карточке игрока. Ставит сам игрок';

-- Переносим то, что было выставлено у игроков
UPDATE profiles p
SET show_phone = pl.show_phone
FROM players pl
WHERE p.player_id = pl.id
  AND pl.show_phone IS TRUE;

-- --- Проверка -----------------------------------------------------------

SELECT count(*) FILTER (WHERE show_phone) AS разрешили_показ,
       count(*) FILTER (WHERE phone IS NOT NULL AND phone <> '') AS с_телефоном,
       count(*) AS профилей
FROM profiles;

-- Тестовые номера в players.phone: карточка их больше не читает, но они
-- путают при разборе. Смотрим, что там осталось.
SELECT id, name, phone, show_phone
FROM players
WHERE phone IS NOT NULL AND phone <> '';

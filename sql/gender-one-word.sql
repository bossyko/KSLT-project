-- ============================================================
-- Пол — одним словом на весь проект
-- ============================================================
--
-- Пол хранился двумя разными словарями. В карточках игроков и в категориях
-- — men/women, в учётных записях — male/female. Ровно то же самое слово,
-- записанное по-разному в соседних таблицах.
--
-- Держалось это на переводчиках. Их четыре в коде и один прямо в базе:
-- функция поиска партнёра переводила men → male, чтобы страница поняла.
-- Каждый работал сам по себе, и один уже успел сломаться: пол в поиске
-- брался у категории, а у категорий он не заполнен ни у одной — все 292
-- игрока попадали в женщины. Чинили отдельным файлом, добавив ещё один
-- переводчик поверх.
--
-- Сводим к одному словарю: men/women. Он уже стоит в карточках игроков
-- (183 и 109 записей) и закреплён проверкой у категорий. В учётных записях
-- записей несколько — их и переписываем.
--
-- Файл меняет базу. Читающие запросы — в gender-one-word-check.sql.

BEGIN;

-- ---- 1. Учётные записи переходят на общий словарь ----

UPDATE profiles
   SET gender = CASE gender
                    WHEN 'male'   THEN 'men'
                    WHEN 'female' THEN 'women'
                    ELSE gender
                END
 WHERE gender IN ('male', 'female');

-- Чтобы старое слово не вернулось через забытую форму
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_gender_check
    CHECK (gender IS NULL OR gender = '' OR gender IN ('men', 'women'));

COMMENT ON COLUMN public.profiles.gender IS
    'men или women — тот же словарь, что в players.gender и categories.gender.';

-- ---- 2. Поиск партнёра больше ничего не переводит ----
--
-- Осталась только развилка «сначала карточка игрока, если там пусто —
-- учётная запись»: это не перевод, а выбор источника.

CREATE OR REPLACE FUNCTION public.get_public_partners()
RETURNS TABLE("id" text, "full_name" text, "avatar_url" text, "gender" text,
              "last_seen" timestamp with time zone, "category_name" text,
              "category_name_en" text, "has_telegram" boolean, "play_level" text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),
      COALESCE(NULLIF(pl.gender, ''), NULLIF(pr.gender, '')),
      pr.last_seen, c.name, c.name_en,
      (pr.telegram_chat_id IS NOT NULL) AS has_telegram,
      pr.play_level
  FROM players pl
  LEFT JOIN categories c ON pl.category_id = c.id
  LEFT JOIN profiles pr ON pr.player_id = pl.id
  WHERE pl.name IS NOT NULL AND pl.name != ''
    AND (
      pl.is_member
      OR EXISTS (
        SELECT 1 FROM memberships m
         WHERE m.profile_id = pr.id
           AND m.status = 'active'
           AND m.expires_at >= CURRENT_DATE
      )
    )
  ORDER BY pr.last_seen DESC NULLS LAST;
$$;

ALTER FUNCTION public.get_public_partners() OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_public_partners() TO anon;
GRANT ALL ON FUNCTION public.get_public_partners() TO authenticated;

COMMIT;

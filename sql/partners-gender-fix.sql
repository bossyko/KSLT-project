-- ============================================
-- Пол в поиске игрока брался у категории, а не у человека
-- ============================================
--
-- Функция определяла пол так: если у категории турнира стоит «мужская» —
-- мужчина, иначе женщина. Но пол у категорий не заполнен ни у одной из
-- шести: раньше категории делились по полу, теперь пол хранится у самого
-- игрока, а поле у категории осталось пустым.
--
-- В итоге все 292 игрока попадали в женщины, включая 183 мужчин. Фильтр
-- по полу в поиске партнёра показывал ерунду: Иван Иванов, у которого и в
-- профиле, и в карточке стоит «мужской», находился среди женщин.
--
-- Берём пол у игрока. Если у него не проставлен — смотрим в учётную
-- запись, где он хранится словами male/female.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_partners()
RETURNS TABLE("id" text, "full_name" text, "avatar_url" text, "gender" text,
              "last_seen" timestamp with time zone, "category_name" text,
              "category_name_en" text, "has_telegram" boolean, "play_level" text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),
      CASE
        WHEN pl.gender = 'men'   THEN 'male'
        WHEN pl.gender = 'women' THEN 'female'
        WHEN pr.gender IN ('male', 'female') THEN pr.gender
        ELSE NULL
      END,
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

COMMIT;

-- ============================================
-- Проверка
-- ============================================
-- У Ивана Иванова должно быть male:
--
-- SELECT full_name, gender FROM public.get_public_partners();

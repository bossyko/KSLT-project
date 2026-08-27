-- ============================================
-- Поиск игрока — только члены клуба
-- ============================================
--
-- Страница «Поиск игрока» нужна, чтобы найти партнёра и списаться с ним.
-- Сейчас она отдаёт все 292 карточки, включая перенесённые из списков
-- NTRP: у тех нет ни учётной записи, ни Телеграма — написать им некуда,
-- а карточка выглядит рабочей.
--
-- Разница с рейтингом намеренная. Рейтинг показывает силу игроков, там
-- фоновые уместны — просто приглушены и без права вызова. Поиск партнёра
-- имеет смысл только среди тех, кто на платформе и в клубе.
--
-- Членом считаем так же, как везде: отметка в карточке игрока либо
-- действующее членство у привязанной учётной записи.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_partners()
RETURNS TABLE("id" text, "full_name" text, "avatar_url" text, "gender" text,
              "last_seen" timestamp with time zone, "category_name" text,
              "category_name_en" text, "has_telegram" boolean, "play_level" text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),
      CASE WHEN c.gender = 'men' THEN 'male' ELSE 'female' END,
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
-- Должно вернуть пятерых вместо 292:
--
-- SELECT count(*) FROM public.get_public_partners();

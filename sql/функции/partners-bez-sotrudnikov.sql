-- ============================================================
-- Поиск игрока: без рабочих учётных записей
-- ============================================================
--
-- Администратор и менеджер ведут клуб, а играют под своим личным аккаунтом.
-- Рабочей учётке в поиске партнёра делать нечего.
--
-- Сейчас они туда и не попадают — просто потому, что карточки игрока у них
-- нет. Но это случайность: стоит сотруднику зайти в кабинет, как карточка
-- заводится сама. В функции ensure-player-card это уже закрыто, здесь
-- закрываем со стороны выборки — на случай, если карточка уже привязана.
--
-- Остальные условия прежние: член клуба, действующее членство либо
-- бесплатный период с учётной записью.
--
-- Запускать можно повторно.

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
    AND (pr.role IS NULL OR pr.role NOT IN ('admin', 'manager'))
    AND (
      pl.is_member
      OR EXISTS (
        SELECT 1 FROM memberships m
         WHERE m.profile_id = pr.id
           AND m.status = 'active'
           AND m.expires_at >= CURRENT_DATE
      )
      OR (public.бесплатный_доступ() AND pr.id IS NOT NULL)
    )
  ORDER BY pr.last_seen DESC NULLS LAST;
$$;

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================

-- Сколько игроков в поиске сейчас:
SELECT count(*) AS в_поиске FROM public.get_public_partners();

-- Не осталось ли в выдаче рабочих учёток:
SELECT p.id, p.full_name
  FROM public.get_public_partners() g
  JOIN public.profiles p ON p.player_id = g.id
 WHERE p.role IN ('admin', 'manager');
-- Ожидаем пустой ответ.

-- Кто из сотрудников уже держит карточку игрока (если такие есть, карточку
-- стоит отвязать вручную — под своим личным аккаунтом человек привяжет её
-- заново):
SELECT p.id, p.full_name, p.role, p.player_id
  FROM public.profiles p
 WHERE p.role IN ('admin', 'manager')
   AND p.player_id IS NOT NULL;

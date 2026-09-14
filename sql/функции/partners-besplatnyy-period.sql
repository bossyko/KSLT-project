-- ============================================================
-- Поиск игрока: учитываем бесплатный период
-- ============================================================
--
-- Сейчас список отдаёт только членов клуба: отметка в карточке игрока либо
-- действующее членство. Пока идёт бесплатный период, платить не нужно —
-- значит и в поиске должны быть видны все, кто на платформе.
--
-- Почему не «показывать всех подряд»: в карточках игроков лежат и те, кого
-- перенесли из списков NTRP. У них нет ни учётной записи, ни Телеграма —
-- написать им некуда, а карточка выглядит рабочей. Поэтому на время
-- бесплатного периода берём тех, у кого есть привязанная учётная запись.
--
-- Условие целиком: член клуба ИЛИ действующее членство
--                  ИЛИ (идёт бесплатный период И есть учётная запись).
--
-- Функция бесплатный_доступ() уже есть в базе — её завели для скидок и
-- вызовов на баттл (см. besplatnyy-dostup-server.sql).
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
--
-- Идёт ли бесплатный период и до какой даты:
SELECT public.бесплатный_доступ() AS бесплатный_период,
       (SELECT value #>> '{}' FROM public.app_settings WHERE key = 'free_access_until') AS до_даты;

-- Сколько игроков попадёт в поиск сейчас:
SELECT count(*) AS в_поиске FROM public.get_public_partners();

-- Для сравнения — сколько карточек всего и сколько из них с учётной записью:
SELECT
  (SELECT count(*) FROM public.players WHERE name IS NOT NULL AND name <> '') AS карточек_всего,
  (SELECT count(*) FROM public.profiles WHERE player_id IS NOT NULL)          AS с_учётной_записью,
  (SELECT count(*) FROM public.players WHERE is_member)                        AS с_отметкой_член;

-- Ожидаем: «в_поиске» примерно равно числу игроков с учётной записью.
-- Когда бесплатный период кончится, функция сама вернётся к прежнему
-- правилу — останутся только члены клуба.

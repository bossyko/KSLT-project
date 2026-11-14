-- ПОИСК ИГРОКА: ПОЛ БЕРЁТСЯ У ЧЕЛОВЕКА, А НЕ У КАТЕГОРИИ ТУРНИРА. 13.11
--
-- НАЙДЕНО СЛОВОМ КОСТИ: «в поиск игрока фильтры не работают по гендеру,
-- а по NTRP отрабатывает».
--
-- ЗАМЕР ДО ПРАВКИ (чтением боевой): `get_public_partners()` вернула 100
-- строк, и У ВСЕХ СТА `gender = 'female'`. Две причины разом:
--
--   1. Пол брался у КАТЕГОРИИ ТУРНИРА, а не у человека:
--        CASE WHEN c.gender = 'men' THEN 'male' ELSE 'female' END
--      У всех семи категорий `gender` равен NULL — его вычистили ещё
--      `sql/схема/categories-gender-cleanup.sql`. Значит ветка ELSE
--      срабатывала ВСЕГДА, и мужчины приходили женщинами.
--      КАТЕГОРИЯ — ЭТО УРОВЕНЬ ИГРЫ, А НЕ ПОЛ ЧЕЛОВЕКА.
--
--   2. Слова разошлись: функция отдавала `male/female`, а экран
--      (`js/partners.js:376`) отбирает по `men/women`. Даже будь пол
--      верным, совпадений не нашлось бы ни одного — отсюда «Нет
--      партнёров по выбранному фильтру» при любом выборе.
--
-- NTRP работал именно потому, что брался у карточки напрямую.
--
-- У КАРТОЧЕК ПОЛ ЕСТЬ И ОН ВЕРНЫЙ: 359 men, 155 women, 2 без пола.
-- Поэтому источник — `players.gender`, а профиль только подстраховывает
-- (у карточки без аккаунта профиля нет вовсе).
--
-- ПОСЛЕ ПРАВКИ, ЗАМЕР В БОЕВОЙ: men 68, women 30, null 2.
-- Фильтр проверен на живой странице: «Женщины» дают женские имена,
-- «Мужчины» — мужские, «Все» — вперемешку.

CREATE OR REPLACE FUNCTION public.get_public_partners()
 RETURNS TABLE(id text, full_name text, avatar_url text, gender text, last_seen timestamp with time zone, category_name text, category_name_en text, has_telegram boolean, play_level text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT pl.id, pl.name, COALESCE(pr.avatar_url, pl.photo),
      COALESCE(pl.gender, pr.gender),
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
$function$;

-- ПРОВЕРКА
SELECT gender, count(*) FROM public.get_public_partners() GROUP BY gender;

-- ЧТО ОСТАЁТСЯ ОТКРЫТЫМ: два партнёра без пола не попадают ни в один
-- отбор, кроме «Все». Пол им ставит админ — решение Кости 13.11.

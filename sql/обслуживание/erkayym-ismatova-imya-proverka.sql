-- ============================================================
-- Опечатка в имени: Эракйым → Эркайым — ПРОВЕРКА
-- ============================================================
--
-- Имя записано с перестановкой букв. Показываем все места, где оно
-- встречается: карточка игрока, кабинет и заявки, где имя могло остаться
-- строкой.
--
-- Правим не везде одинаково. Имя в карточке следует за профилем: триггер
-- `trg_sync_player_name` переписывает `players.name` при смене
-- `profiles.full_name`. Есть кабинет — правим профиль, и карточка
-- подтянется сама. Нет кабинета — правим карточку напрямую.
--
-- Опознаватель карточки (`erakyym-ismatova`) не трогаем: на него ссылаются
-- заявки и матчи. Он не показывается человеку, а переименование порвало бы
-- историю.
--
-- Запрос читающий, ничего не меняет.

SELECT 'карточка'::text AS где,
       p.id             AS опознаватель,
       p.name           AS написано,
       p.name_en        AS латиницей,
       CASE WHEN pr.id IS NULL THEN 'кабинета нет' ELSE 'есть кабинет' END AS учётка
  FROM public.players p
  LEFT JOIN public.profiles pr ON pr.player_id = p.id
 WHERE p.name ILIKE '%ракйым%' OR p.name ILIKE '%ркайым%' OR p.id = 'erakyym-ismatova'

UNION ALL

SELECT 'кабинет', pr.player_id, pr.full_name, pr.email,
       'профиль ' || pr.id::text
  FROM public.profiles pr
 WHERE pr.full_name ILIKE '%ракйым%' OR pr.full_name ILIKE '%ркайым%'

UNION ALL

SELECT 'заявка (имя строкой)', r.tournament_id,
       COALESCE(r.external_name, r.partner_external_name),
       r.status, t.title
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.external_name ILIKE '%ракйым%' OR r.external_name ILIKE '%ркайым%'
    OR r.partner_external_name ILIKE '%ракйым%' OR r.partner_external_name ILIKE '%ркайым%'

ORDER BY 1, 3;

-- Ожидаем: строка «карточка» — и по ней видно, есть ли кабинет.
-- Строки «заявка» быть не должно: гостя заводили карточкой.

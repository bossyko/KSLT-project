-- ============================================================
-- Пропавшие профили: проверить и вернуть
-- ============================================================
--
-- Вход и профиль — две разные записи. Вход живёт в auth.users, профиль на
-- сайте — в public.profiles, и заводится он триггером при регистрации.
--
-- Если профиль пропал, а вход остался, человека начинает мотать по кругу:
-- личный кабинет не находит профиль и отправляет на страницу входа, та видит
-- живой вход и отправляет обратно в кабинет. Со стороны это выглядит как
-- бесконечная перезагрузка — и при входе, и при регистрации.
--
-- Здесь: посмотреть, у кого нет профиля, вернуть его и проверить, что
-- триггер на месте.
--
-- Файл меняет базу (третий шаг).

-- ---- 1. У кого есть вход, но нет профиля ----

SELECT u.id, u.email, u.created_at, u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
 WHERE p.id IS NULL
 ORDER BY u.created_at DESC;

-- ---- 2. Жив ли триггер, который заводит профиль ----

SELECT t.tgname AS триггер, p.proname AS функция, t.tgenabled AS включён
  FROM pg_trigger t
  JOIN pg_proc p ON p.oid = t.tgfoid
 WHERE t.tgrelid = 'auth.users'::regclass
   AND NOT t.tgisinternal;
-- Ожидаем строку on_auth_user_created / handle_new_user / O (включён).
-- Если строки нет — профиль при регистрации не создаётся ни у кого, и
-- надо заново прогнать sql/applied/fix-registration-migration.sql.

-- ---- 3. Вернуть профили тем, у кого их нет ----
--
-- Телефон не переносим. В базе стоит запрет «один номер — одна учётная
-- запись», и номер из старой регистрации может оказаться уже занят другим
-- человеком: тогда восстановление обрывается на первом же таком случае.
-- Профиль возвращаем без номера, человек впишет его сам в личном кабинете.

INSERT INTO public.profiles (id, full_name, email, gender,
                             birth_day, birth_month, birth_year, role, created_at)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', ''),
       u.email,
       NULLIF(u.raw_user_meta_data->>'gender', ''),
       (u.raw_user_meta_data->>'birth_day')::int,
       (u.raw_user_meta_data->>'birth_month')::int,
       (u.raw_user_meta_data->>'birth_year')::int,
       'user',
       now()
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
 WHERE p.id IS NULL;

-- ---- 3a. Чей номер оказался занят ----
-- Только смотрим: у этих людей в регистрации был номер, но он уже за кем-то
-- закреплён. Профиль им вернулся без телефона.

SELECT u.email,
       u.raw_user_meta_data->>'phone' AS номер_из_регистрации,
       (SELECT string_agg(p2.email, ', ')
          FROM public.profiles p2
         WHERE p2.phone_e164 <> ''
           AND p2.phone_e164 = regexp_replace(coalesce(u.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g')
       ) AS уже_у_кого
  FROM auth.users u
 WHERE NULLIF(u.raw_user_meta_data->>'phone', '') IS NOT NULL
   AND EXISTS (SELECT 1 FROM public.profiles p2
                WHERE p2.phone_e164 <> ''
                  AND p2.phone_e164 = regexp_replace(coalesce(u.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g'));

-- ---- 4. Вернуть роль администратора ----

UPDATE public.profiles SET role = 'admin' WHERE email = 'bossyko@gmail.com';

-- ---- 5. Проверить, что не осталось входов без профиля ----

SELECT count(*) AS входов_без_профиля
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
 WHERE p.id IS NULL;

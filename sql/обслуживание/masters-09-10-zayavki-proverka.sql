-- ============================================================
-- MASTERS 9 и 10 октября: ПРОВЕРКА заявок ЧТЕНИЕМ БАЗЫ
-- ============================================================
-- Запускать ПОСЛЕ правок. Ответ «Success» ничего не значит —
-- значат только эти строки.

-- 1 · Сколько заявок и в каких статусах
SELECT t.title,
       r.status,
       count(*) AS сколько
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
 WHERE r.tournament_id IN ('24cad8f2-58a4-4e4f-997f-e4c967321da8',
                           '5b5e2260-8a6c-4a52-8f8f-7a63872a0951')
 GROUP BY t.title, r.status
 ORDER BY t.title, r.status;
-- ЖДЁМ: мужской — approved 20, waitlist 7; женский — approved 22, waitlist 1.

-- 2 · Поимённо, в порядке подачи
SELECT t.gender,
       r.status,
       p.name,
       p.gender AS пол_карточки,
       p.category_id AS разряд,
       p.is_guest,
       r.registered_at
  FROM public.tournament_registrations r
  JOIN public.tournaments t ON t.id = r.tournament_id
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id IN ('24cad8f2-58a4-4e4f-997f-e4c967321da8',
                           '5b5e2260-8a6c-4a52-8f8f-7a63872a0951')
 ORDER BY t.gender, r.status, r.registered_at;
-- СМОТРИМ ГЛАЗАМИ: пол карточки совпадает с полом турнира у всех 50 строк.

-- 3 · НИ ОДНОГО ГОСТЯ СРЕДИ ЗАЯВЛЕННЫХ — это и есть «попали в рейтинг»
SELECT p.id, p.name, p.is_guest, p.is_member, p.category_id
  FROM public.tournament_registrations r
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id IN ('24cad8f2-58a4-4e4f-997f-e4c967321da8',
                           '5b5e2260-8a6c-4a52-8f8f-7a63872a0951')
   AND (p.is_guest OR p.category_id IS NULL)
 ORDER BY p.id;
-- ЖДЁМ: ноль строк. Строка здесь = человека в рейтинге не видно.

-- 4 · Две новые карточки
SELECT id, name, gender, category_id, is_guest, is_member, has_account
  FROM public.players
 WHERE id IN ('ruslan-gilfanov', 'kseniya-han');
-- ЖДЁМ: две строки, is_guest = false, is_member = true, разряд masters.

-- 5 · Никто не попал в турнир дважды
SELECT tournament_id, player_id, count(*)
  FROM public.tournament_registrations
 WHERE tournament_id IN ('24cad8f2-58a4-4e4f-997f-e4c967321da8',
                         '5b5e2260-8a6c-4a52-8f8f-7a63872a0951')
 GROUP BY tournament_id, player_id
HAVING count(*) > 1;
-- ЖДЁМ: ноль строк.

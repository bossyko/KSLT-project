-- МЕТКА БАНА В СПИСКАХ: ОДИН ПРИЗНАК НА ОБА ВИДА (04.11).
--
-- ЧТО БЫЛО, ПОМЕРЕНО ЧТЕНИЕМ. Метка «Заблок.» в списке игроков
-- (`js/players.js:631` и `:1001`) смотрела ТОЛЬКО `players.banned_until`,
-- то есть видела лишь бан КАРТОЧКИ. Бан УЧЁТНОЙ ЗАПИСИ, который ставит
-- `ban_user` в `profiles` плюс Supabase Auth, она не видела вовсе:
-- человек не мог войти, а в списке стоял как ни в чём не бывало.
--
-- БАН В КСЛТ ОПРЕДЕЛЁН ДВАЖДЫ, И ЭТО НЕ ОШИБКА, А ДВА РАЗНЫХ ПОНЯТИЯ:
--   · бан учётки   — человек не войдёт вовсе;
--   · бан карточки — карточка закрыта, войти он может.
-- Сводить их в одно нельзя. Но СПИСКУ всё равно, каким именно способом
-- человека закрыли: он показывает статус. Значит нужен ОДИН признак
-- «закрыт», считаемый из обоих, и считать его должна база — иначе
-- каждый список посчитает по-своему, и они разойдутся.
--
-- СЛОВО КОСТИ 04.11: «не прятать, просто там будет стоять статус, что
-- заблокирован админом». Никого не прячем — показываем метку.
--
-- ЧЕГО ЭТОТ ФАЙЛ НЕ ДЕЛАЕТ: не трогает правила строк и роли. Витрина
-- пересоздаётся с тем же набором столбцов плюс один вычисляемый, гранты
-- выдаются заново тем же, кому были.

BEGIN;

DROP VIEW IF EXISTS public.players_public;

-- ОПРЕДЕЛЕНИЕ УСТАРЕЛО, И ИМЕННО ОНО ЗАКРЫЛО ГОСТЮ ВИТРИНУ. Признак
-- `zakryt` здесь читает `p.banned_until` и `profiles`, а витрина стоит на
-- `security_invoker` — гость получал 42501 на любой запрос. Заменено
-- 06.11 на `sql/доступ/vitrina-zakryt-cherez-funkciyu-06nov.sql`.
-- НЕ ПРОГОНЯТЬ.
CREATE VIEW public.players_public
WITH (security_invoker = on) AS
SELECT p.id,
       p.name, p.name_en, p.name_kg,
       p.photo, p.country, p.category_id,
       p.points, p.wins, p.losses, p.rank_change, p.form,
       p.doubles_wins, p.doubles_losses, p.mixed_wins, p.mixed_losses,
       p.ntrp_singles, p.ntrp_doubles,
       p.gender, p.bio, p.bio_en, p.bio_kg,
       p.is_online, p.is_member, p.is_guest, p.has_account,
       p.view_count, p.view_count_app,
       p.created_at, p.updated_at,
       /* ОДИН ПРИЗНАК НА ОБА ВИДА. Сам срок и причина НЕ отдаются —
          витрина для гостей, и «за что закрыли» её не касается. */
       (p.banned_until IS NOT NULL AND p.banned_until > now())
         OR EXISTS (SELECT 1 FROM public.profiles pr
                     WHERE pr.player_id = p.id
                       AND pr.banned_until IS NOT NULL
                       AND pr.banned_until > now())            AS zakryt
  FROM public.players p;

COMMENT ON VIEW public.players_public IS
    'Карточки игроков для гостей: без email, phone, show_phone, banned_until, ban_reason и отметки об удалении аккаунта. Столбец zakryt — один признак на ОБА вида бана: закрыта учётная запись или закрыта карточка. Срок и причина не отдаются.';

GRANT SELECT ON public.players_public TO anon;
GRANT SELECT ON public.players_public TO authenticated;

COMMIT;


-- ---- ПРОВЕРКА: всё в одной строке, одна таблица -----------------
-- Ждём: est_stolbec = true, vidit_oba = true, zakrytyh — сколько есть
-- сейчас (может быть и ноль, это не беда), anon = true.
-- `vidit_oba` считает тех, у кого закрыта учётка, НО карточка цела:
-- именно их старая метка и не видела. Ноль здесь — значит таких сейчас
-- просто нет, а не значит, что признак сломан: его проверяет est_stolbec.

SELECT (SELECT count(*) > 0 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'players_public'
           AND column_name = 'zakryt')                                AS est_stolbec,
       (SELECT count(*) FROM public.players_public WHERE zakryt)       AS zakrytyh,
       (SELECT count(*) FROM public.profiles pr
          JOIN public.players p ON p.id = pr.player_id
         WHERE pr.banned_until > now()
           AND (p.banned_until IS NULL OR p.banned_until <= now()))    AS tolko_uchyotka,
       has_table_privilege('anon', 'public.players_public', 'SELECT')  AS anon;

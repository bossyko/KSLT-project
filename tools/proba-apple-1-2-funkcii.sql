-- ############################################################################
-- #  НЕ ПРОГОНЯТЬ В SUPABASE. ЭТО ПРОБА ДЛЯ ПУСТОЙ ОДНОРАЗОВОЙ БАЗЫ.        #
-- #  Файл создаёт ЗАГЛУШКИ таблиц и ломает настоящие данные, если           #
-- #  запустить его там, где они есть.                                        #
-- ############################################################################
--
-- Чем это: доказательство, что `sql/схема/apple-1-2-funkcii.sql` делает то,
-- что обещает. Прогнано 04.11 на настоящем PostgreSQL 16, двенадцать
-- проверок, все дали ожидаемое. «У меня зелёное» ничего не доказывает —
-- доказывает вот этот прогон.
--
-- Как прогнать заново (на пустой базе):
--   psql -f tools/proba-apple-1-2-funkcii.sql -f sql/схема/apple-1-2-funkcii.sql -f <этот файл, часть 2>
-- Проще: части каркаса и пробы лежат тут подряд, между ними прогоняется
-- сам файл функций.
--
-- ЧТО ИМЕННО ДОКАЗАНО:
--   · жалоба на себя не проходит;
--   · вторая жалоба на тот же объект отвечает «already», а не падает;
--   · мусор вместо uuid — это «не найдено», а не ошибка базы;
--   · блокировка снимает ОДИНОЧНЫЕ живые баттлы (принятый и висящий) и
--     НЕ ТРОГАЕТ парный: парный матч — договорённость четверых;
--   · сыгранный матч не трогается вовсе;
--   · в `push_log` НОЛЬ строк — клубу блокировка не трубит;
--   · в уведомлениях нет слова «заблокировал»: тексты неотличимы от
--     честного отказа;
--   · разблокировка снимает строку и НЕ воскрешает отменённый матч.

-- ── ЧАСТЬ 1: КАРКАС (прогнать ПЕРВОЙ) ───────────────────────────────────
-- Каркас, чтобы прогнать функции НА САМОМ ДЕЛЕ, а не проверить синтаксис.
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.kto (id uuid);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT id FROM auth.kto LIMIT 1 $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, player_id text, full_name text, role text DEFAULT 'user');
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid, opponent_profile_id uuid,
  challenger_player_id text, opponent_player_id text,
  status text DEFAULT 'active', format text DEFAULT 'singles',
  accepted_at timestamptz, battle_title text, battle_published boolean DEFAULT false,
  cancelled_at timestamptz, cancelled_by uuid, cancel_reason text);
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'system', title text, message text,
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE public.push_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text);
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_profile_id uuid NOT NULL REFERENCES profiles(id),
  target_kind text NOT NULL CHECK (target_kind IN ('player','battle','avatar','bio')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('offensive','spam','fake','foreign_photo','other')),
  note text CHECK (note IS NULL OR length(note) <= 1000),
  status text NOT NULL DEFAULT 'new', created_at timestamptz DEFAULT now(),
  UNIQUE (reporter_profile_id, target_kind, target_id));
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_profile_id uuid NOT NULL REFERENCES profiles(id),
  blocked_profile_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_profile_id, blocked_profile_id),
  CHECK (blocker_profile_id <> blocked_profile_id));

-- ── ЧАСТЬ 2: ПРОБА (прогнать ПОСЛЕ файла функций) ───────────────────────
\set QUIET on
-- Трое: я (Петя), он (Вася), третий (Айпери, для парного)
INSERT INTO profiles (id, player_id, full_name) VALUES
 ('11111111-1111-1111-1111-111111111111','p-petya','Петя'),
 ('22222222-2222-2222-2222-222222222222','p-vasya','Вася'),
 ('33333333-3333-3333-3333-333333333333','p-ayperi','Айпери');
-- одиночный принятый матч Петя→Вася
INSERT INTO challenges (challenger_id, opponent_profile_id, status, format, accepted_at, battle_title, battle_published)
 VALUES ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','accepted','singles',now(),'Петя — Вася',true);
-- одиночный висящий вызов Вася→Петя
INSERT INTO challenges (challenger_id, opponent_profile_id, status, format)
 VALUES ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','active','singles');
-- ПАРНЫЙ принятый — трогать нельзя
INSERT INTO challenges (challenger_id, opponent_profile_id, status, format, accepted_at)
 VALUES ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','accepted','doubles',now());
-- уже сыгранный — трогать нельзя
INSERT INTO challenges (challenger_id, opponent_profile_id, status, format)
 VALUES ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','completed','singles');
INSERT INTO auth.kto VALUES ('11111111-1111-1111-1111-111111111111');
\set QUIET off

\echo '--- 1. ЖАЛОБА на себя — отказ "self"'
SELECT kslt_pozhalovatsya('player','p-petya','offensive',NULL);
\echo '--- 2. ЖАЛОБА на Васю — ok'
SELECT kslt_pozhalovatsya('player','p-vasya','offensive','написал гадость');
\echo '--- 3. ТА ЖЕ ЖАЛОБА второй раз — "already", а не падение'
SELECT kslt_pozhalovatsya('player','p-vasya','spam',NULL);
\echo '--- 4. ЖАЛОБА на баттл с мусором вместо uuid — "not_found", а не ошибка базы'
SELECT kslt_pozhalovatsya('battle','не-uuid-вовсе','other',NULL);
\echo '--- 5. БЛОКИРОВКА Васи: ждём otmeneno=2 (принятый + висящий), parnyh=1'
SELECT kslt_zablokirovat('p-vasya');
\echo '--- 6. ЧТО СТАЛО С БАТТЛАМИ (чтением, а не по ответу функции)'
SELECT format, status, cancel_reason, battle_published FROM challenges ORDER BY format, status;
\echo '--- 7. УВЕДОМЛЕНИЯ: два, оба Васе, слова "заблок" НЕТ нигде'
SELECT profile_id = '22222222-2222-2222-2222-222222222222' AS vase, title, message FROM notification_log ORDER BY title;
\echo '--- 8. ПУШ КЛУБУ: ждём 0 строк'
SELECT count(*) AS push_strok FROM push_log;
\echo '--- 9. ПОВТОРНАЯ БЛОКИРОВКА: не падает, отменять уже нечего'
SELECT kslt_zablokirovat('p-vasya');
\echo '--- 10. СЕБЯ — отказ'
SELECT kslt_zablokirovat('p-petya');
\echo '--- 11. КАРТОЧКА БЕЗ УЧЁТНОЙ ЗАПИСИ — "no_account"'
SELECT kslt_zablokirovat('p-nikogo');
\echo '--- 12. РАЗБЛОКИРОВКА: строка ушла, баттл НЕ воскрес'
SELECT kslt_razblokirovat('p-vasya');
SELECT count(*) AS blokirovok FROM user_blocks;
SELECT count(*) AS otmenennyh FROM challenges WHERE status='cancelled';

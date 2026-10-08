-- КАСКАД ПРИ УДАЛЕНИИ ТУРНИРА ДЛЯ `matches`
--
-- БЕДА. Турнир, у которого есть матчи, не удаляется вовсе:
--   update or delete on table "tournaments" violates foreign key
--   constraint "matches_tournament_id_fkey" on table "matches"
-- Поймано Костей 08.10 на «ТЕСТ — одиночка, прогон замен».
--
-- ПРИЧИНА — ДВА ИСТОЧНИКА ОДНОГО ПРАВИЛА, и беда родилась ровно на шве.
--   `sql/схема/bracket-system-migration.sql:9` объявляет связь
--      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE
--   `sql/схема/schema-snapshot.sql:3586` показывает, что в боевой базе
--      ADD CONSTRAINT "matches_tournament_id_fkey"
--        FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id");
--   — БЕЗ `ON DELETE` вовсе, то есть NO ACTION по умолчанию.
--
-- Все пять соседей правило имеют:
--   tournament_registrations — CASCADE      tournament_results — CASCADE
--   news — SET NULL                         rating_history — SET NULL
--   matches — НИЧЕГО. Единственная без правила.
--
-- ЧТО ДЕЛАЕТ ЭТОТ ФАЙЛ: приводит боевую базу к тому, что уже написано в
-- миграции. Матчи принадлежат турниру и без него не значат ничего —
-- поэтому CASCADE, а не SET NULL.
--
-- РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ ЧТЕНИЕМ, А НЕ ОТВЕТОМ «Success»: шаги 1 и 3
-- показывают правило до и после. До правки в колонке `правило` должно
-- стоять `a` (NO ACTION), после — `c` (CASCADE).

-- ── 1. ЧИТАЕМ, КАК ЕСТЬ ──────────────────────────────────────────────
SELECT conname AS имя,
       confdeltype AS правило   -- a = нет правила, c = каскад, n = обнулить
  FROM pg_constraint
 WHERE conname = 'matches_tournament_id_fkey';

-- ── 2. МЕНЯЕМ ────────────────────────────────────────────────────────
ALTER TABLE public.matches
  DROP CONSTRAINT matches_tournament_id_fkey;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_tournament_id_fkey
  FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id)
  ON DELETE CASCADE;

-- ── 3. ЧИТАЕМ СНОВА ──────────────────────────────────────────────────
SELECT conname AS имя,
       confdeltype AS правило
  FROM pg_constraint
 WHERE conname = 'matches_tournament_id_fkey';

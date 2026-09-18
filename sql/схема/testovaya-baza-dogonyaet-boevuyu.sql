-- ============================================================
-- Тестовая база догоняет боевую: недостающие столбцы
-- ============================================================
--
-- ЗАПУСКАТЬ В ТЕСТОВОМ ПРОЕКТЕ, НЕ В БОЕВОМ.
-- Тестовый: itlanqwcwygxchitaatt. Боевой: qqkzszesviukopgjbead.
--
-- Тестовая база отстала: в ней нет столбцов, на которых держится турнирная
-- цепочка. Метки слотов (`slot1_label`) говорят клетке плей-офф, кого она
-- ждёт — «A1», «Q2», «IG1». Ссылки на заявки (`reg1_id`) говорят матчу, чья
-- это заявка: по ним сверяется состав и работает замена напарника. Без них
-- жеребьёвка не соберётся вовсе.
--
-- Список составлен не по памяти, а сравнением: столбцы боевых таблиц против
-- тестовых, через API обеих баз.
--
-- Запускать можно повторно: всё через IF NOT EXISTS.
--
-- Функции турнира этот файл не заводит — они лежат отдельно, порядок в
-- конце файла.

BEGIN;

-- ---- Турниры ----

ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS draw_seed integer,
    ADD COLUMN IF NOT EXISTS schedule_saved_at timestamptz,
    ADD COLUMN IF NOT EXISTS schedule_notified_at timestamptz,
    ADD COLUMN IF NOT EXISTS playoff_format text,
    ADD COLUMN IF NOT EXISTS director_name text,
    ADD COLUMN IF NOT EXISTS referee_name text;

-- ---- Матчи ----
--
-- Метки и ссылки на заявки: на них стоит и сборка сетки, и отмена доп.
-- матча, и сверка состава групп с заявками.

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS slot1_label text,
    ADD COLUMN IF NOT EXISTS slot2_label text,
    ADD COLUMN IF NOT EXISTS reg1_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reg2_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS called_ready_at timestamptz,
    ADD COLUMN IF NOT EXISTS called_go_at timestamptz;

-- ---- Заявки ----

ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS gender_confirmed boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS guest_confirmed boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS external_gender text,
    ADD COLUMN IF NOT EXISTS partner_external_country text;

-- ---- Карточки игроков ----
--
-- Жеребьёвка читает карточки запросом с NTRP: нет столбца — падает весь
-- запрос, а с ним и сборка сетки. Гость и учётка нужны там, где сетка
-- отличает члена клуба от приглашённого.

ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS ntrp_singles numeric(3,2),
    ADD COLUMN IF NOT EXISTS ntrp_doubles numeric(3,2),
    ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_account boolean NOT NULL DEFAULT false;

COMMIT;

-- PostgREST иначе не узнает о новых столбцах, и запись в них пройдёт молча
NOTIFY pgrst, 'reload schema';

-- ---- Проверка ----

SELECT table_name AS таблица, count(*) AS столбцов
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name IN ('tournaments', 'matches', 'tournament_registrations')
 GROUP BY table_name
 ORDER BY table_name;

-- Ожидаем: tournaments 53, matches 33, tournament_registrations 22 —
-- столько же, сколько в боевой.

-- ---- Что запустить следом, в этом же порядке ----
--
--   sql/схема/fic-pravka-rezultata.sql
--   sql/функции/fic-advance-by-round.sql
--   sql/функции/fic-itogi-po-metkam.sql
--   sql/функции/fic-tolko-setka-v-raschyotah.sql
--   sql/функции/fic-zatronutye-tolko-setka.sql
--   sql/функции/fic-zameny-tolko-setka.sql
--
-- Порядок важен: поздние файлы переписывают функции из ранних, и последним
-- должен лечь тот, где матч сетки отбирается по `group_number IS NULL`.
-- Проверить итог: sql/функции/fic-zameny-tolko-setka-proverka.sql —
-- у всех четырёх функций ждём «есть».

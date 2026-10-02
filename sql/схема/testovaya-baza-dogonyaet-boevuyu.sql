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

-- ---- Заявки: место и очередь (боевая, 28.09 и 01.10) ----
--
-- Чего не хватало 02.10: проверка окна замены падала на
-- «column tournament_registrations.waitlisted_at does not exist», а до неё
-- тихо брала порядок очереди по времени ПОДАЧИ — колонки для порядка
-- постановки в базе не было вовсе.
--
-- `seat_pool`      — чьё место занимает заявка: онлайн или резерв клуба
--                    (`sql/схема/zayavki-mesto-i-prichiny-shag1.sql`)
-- `review_reasons` — почему заявка ждёт решения, списком, а не одной
--                    причиной
-- `waitlisted_at`  — когда заявка попала в очередь; пусто у тех, кто в ней
--                    с подачи
-- `queue_at`       — ОДИН порядок очереди на продукт, считает база
--                    (`sql/функции/ochered-vremya-postanovki.sql`)
--
-- ПОРЯДОК ЗДЕСЬ ОБЯЗАТЕЛЕН: `queue_at` генерируемый и считается из
-- `waitlisted_at`, а индекс очереди стоит на `seat_pool` — обе колонки
-- должны лежать раньше. Именно на этом 02.10 откатилась вся правка
-- целиком: индекс завели одной транзакцией со столбцами, которых ещё не
-- было.

ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS seat_pool text NOT NULL DEFAULT 'online',
    ADD COLUMN IF NOT EXISTS review_reasons text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS waitlisted_at timestamptz;

ALTER TABLE public.tournament_registrations
    DROP CONSTRAINT IF EXISTS tournament_registrations_seat_pool_check;
ALTER TABLE public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_seat_pool_check
    CHECK (seat_pool = ANY (ARRAY['online'::text, 'reserved'::text]));

ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS queue_at timestamptz
    GENERATED ALWAYS AS (COALESCE(waitlisted_at, registered_at)) STORED;

CREATE INDEX IF NOT EXISTS idx_registrations_seat_pool
    ON public.tournament_registrations (tournament_id, seat_pool, status);

CREATE INDEX IF NOT EXISTS tournament_registrations_queue_idx
    ON public.tournament_registrations (tournament_id, seat_pool, queue_at)
    WHERE status = 'waitlist';

-- ---- Профили ----
--
-- Чего не хватало 02.10: проверка допуска падала на `profile_not_found`, и
-- выглядело это как беда продукта. На деле функция читает профиль списком
-- `id, full_name, player_id, role, gender, lang`
-- (`tournament-register/index.ts:143`) — нет ОДНОЙ колонки, падает ВЕСЬ
-- запрос, функция видит пустоту и честно отвечает «профиля нет».
--
-- `lang` — язык человека, на нём пишутся отказы и уведомления: ru · en · kg,
-- пусто читается как ru (`языкИз`, там же, :66).

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS lang text;

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

-- ---- Двадцать одна колонка из сверки 02.10 ----
--
-- Сведено двумя списками колонок — боевым и тестовым; типы прочитаны из
-- боевой схемы, не выведены из кода. Половина из них держит живые куски:
-- перерывы судейского экрана, отзыв рассылки, кадрированная афиша,
-- новости из внешних источников. Пока их нет в тестовой, эти экраны
-- прогоном не проверяются вовсе.

ALTER TABLE public.courts
    ADD COLUMN IF NOT EXISTS country      text,
    ADD COLUMN IF NOT EXISTS country_en   text,
    ADD COLUMN IF NOT EXISTS instagram    text,
    ADD COLUMN IF NOT EXISTS whatsapp     text,
    ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.live_matches
    ADD COLUMN IF NOT EXISTS break_kind   text,
    ADD COLUMN IF NOT EXISTS pause_reason text,
    ADD COLUMN IF NOT EXISTS sponsor_name text,
    ADD COLUMN IF NOT EXISTS break_until  timestamptz;

ALTER TABLE public.news
    ADD COLUMN IF NOT EXISTS source_name text,
    ADD COLUMN IF NOT EXISTS source_url  text;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payer_email text,
    ADD COLUMN IF NOT EXISTS payer_name  text;

ALTER TABLE public.push_log
    ADD COLUMN IF NOT EXISTS recalled_at timestamptz,
    ADD COLUMN IF NOT EXISTS recalled_by uuid;

ALTER TABLE public.tournaments
    ADD COLUMN IF NOT EXISTS image_full text,
    ADD COLUMN IF NOT EXISTS image_crop jsonb;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.notification_log
    ADD COLUMN IF NOT EXISTS push_id uuid;

ALTER TABLE public.player_badges
    ADD COLUMN IF NOT EXISTS seen_at timestamptz;

ALTER TABLE public.challenge_predictions
    ADD COLUMN IF NOT EXISTS predicted_side smallint;

-- ---- Чистки, которые в тестовую не доехали ----
--
-- Эти десять колонок боевая не «потеряла», а УДАЛИЛА миграциями:
-- challenges-rework.sql:59–64, ntrp-staroe-pole-udalit.sql:99,
-- doubles-mixed-stats.sql:216–218. Живой код их не читает ни строкой.
-- Отстаёт тестовая, и в обе стороны: ей не доехали и новые столбцы, и
-- чистки. Применено Костей 02.10.

ALTER TABLE public.challenges
    DROP COLUMN IF EXISTS counter_date,
    DROP COLUMN IF EXISTS counter_time,
    DROP COLUMN IF EXISTS counter_venue,
    DROP COLUMN IF EXISTS counter_court_id,
    DROP COLUMN IF EXISTS counter_step,
    DROP COLUMN IF EXISTS countered_at;

ALTER TABLE public.players
    DROP COLUMN IF EXISTS ntrp_rating,
    DROP COLUMN IF EXISTS doubles_points,
    DROP COLUMN IF EXISTS doubles_rank_change,
    DROP COLUMN IF EXISTS doubles_form;

-- ---- Таблицы, которых в тестовой не было вовсе ----
--
-- Сверка 02.10 (`sql/обслуживание/sverka-shem.sql`): в тестовой не хватало
-- девяти таблиц боевой. Здесь заведены четыре, на которые опирается то, что
-- мы проверяем; остальные пять — `live_match_points`, `news_sources`,
-- `news_suggestions`, `player_link_requests`, `app_releases` — ждут своих
-- кусков.
--
-- Колонки и типы взяты ЧТЕНИЕМ БОЕВОЙ СХЕМЫ, а не выведены из кода.
-- Политик доступа здесь нет намеренно: тестовая база живёт под служебным
-- ключом сева и под учётками проверок.

-- Таблица ЖИВЫХ очков: по ней считает начисление при завершении турнира
-- (`bracket.js:2286`). Без неё прогон начисления невозможен в принципе.
CREATE TABLE IF NOT EXISTS public.points_by_place (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id uuid NOT NULL REFERENCES public.tournament_levels(id) ON DELETE CASCADE,
    place    integer NOT NULL,
    points   integer NOT NULL DEFAULT 0,
    UNIQUE (level_id, place)
);

-- Журнал замен: `записатьЗамену` (`bracket.js:689`) пишет сюда, и без
-- таблицы запись уходит в никуда — молча.
CREATE TABLE IF NOT EXISTS public.registration_changes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   text,
    registration_id uuid,
    side            text,
    old_player_id   text,
    new_player_id   text,
    old_name        text,
    new_name        text,
    changed_by      uuid,
    created_at      timestamptz DEFAULT now()
);

-- Настройки доступа: бесплатный период читает функция допуска
-- (`tournament-register/index.ts:273`).
CREATE TABLE IF NOT EXISTS public.app_settings (
    key        text PRIMARY KEY,
    value      jsonb,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid
);

-- Тексты уведомлений и отказов, три языка в колонках
-- (`tournament-register/index.ts:40`).
CREATE TABLE IF NOT EXISTS public.notification_texts (
    key        text PRIMARY KEY,
    ru         text,
    kg         text,
    en         text,
    updated_at timestamptz DEFAULT now()
);

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

-- Ожидаем: tournaments 53, matches 33, tournament_registrations 26,
-- и четыре новые таблицы на месте.
-- Было 22: четыре столбца очереди и места добавлены выше 02.10. Числа
-- сверены со списком столбцов тестовой базы, а не взяты по памяти;
-- боевую сверять тем же запросом.

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

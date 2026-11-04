-- ═════════════════════════════════════════════════════════════════════════
-- КСЛТ · ЖАЛОБЫ, БЛОКИРОВКИ И СТОП-СЛОВА
-- Заводится 04.11.2026. ЗАПУСКАЕТ КОСТЯ.
--
-- ЗАЧЕМ. Правило Apple 1.2 дословно: приложения, где люди создают,
-- загружают или делятся содержимым, ОБЯЗАНЫ иметь четыре вещи:
--   · фильтр недопустимого ДО публикации,
--   · способ пожаловаться и своевременный ответ,
--   · возможность заблокировать нарушителя,
--   · опубликованные контакты.
-- Четвёртое у нас есть, первых трёх нет. Это ПРЯМОЙ ОТКАЗ при подаче.
--
-- ЧТО ЛЮДИ ПИШУТ СВОИМИ РУКАМИ (замер 29.10): «о себе» на трёх языках
-- (players.bio/bio_en/bio_kg), имя и фамилию (profiles.full_name),
-- название баттла (challenges.battle_title), имя напарника со стороны
-- (tournament_registrations.partner_external_name), фото профиля.
--
-- ПОЧЕМУ ФИЛЬТР ЖИВЁТ ЗДЕСЬ, А НЕ В ПРИЛОЖЕНИИ. Запись в profiles и
-- players идёт ПРЯМЫМ запросом к базе, а не через нашу функцию. Значит
-- проверка в приложении — вежливая подсказка, которую обходят за минуту.
-- Честное место — триггер: его не обойти ничем, что мы пишем на стороне
-- человека. В приложении ту же проверку делаем ДО отправки, но ради
-- понятного сообщения, а не ради защиты.
--
-- РЕШЕНИЕ, КОТОРОЕ НАЗЫВАЮ ПРЕДПОЛОЖЕНИЕМ (жду слова Кости):
-- БЛОКИРОВКА НЕ ПРЯЧЕТ ТУРНИРНЫЕ РЕЗУЛЬТАТЫ. Играли в одной группе —
-- матч остаётся в сетке, в таблице и в истории обоих. Это не переписка,
-- а результат соревнования: он принадлежит турниру, а не двум людям.
-- Спрятав его, мы соврали бы остальным участникам о том, как турнир
-- прошёл. То же решение уже принято при удалении аккаунта: карточка
-- остаётся с меткой «Аккаунт удалён» ровно по этой причине.
--
-- СРОК РАЗБОРА ЖАЛОБЫ — ТРОЕ СУТОК, тоже предположение. Apple требует
-- «timely responses», срок называем мы сами, и он пишется в Правила.
-- ═════════════════════════════════════════════════════════════════════════


-- ── 1. ЖАЛОБЫ ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_reports (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_kind         text        NOT NULL CHECK (target_kind IN ('player', 'battle', 'avatar', 'bio')),
    target_id           uuid        NOT NULL,
    reason              text        NOT NULL CHECK (reason IN ('offensive', 'spam', 'fake', 'foreign_photo', 'other')),
    note                text                 CHECK (note IS NULL OR length(note) <= 1000),
    status              text        NOT NULL DEFAULT 'new'
                                    CHECK (status IN ('new', 'reviewed', 'removed', 'rejected')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    reviewed_at         timestamptz,
    reviewed_by         uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- ОДИН ЧЕЛОВЕК — ОДНА ЖАЛОБА НА ОДИН ОБЪЕКТ. Без этого кнопка
    -- превращается в способ закидать жалобами: сто нажатий — сто строк,
    -- и разбирающий тонет в одном и том же.
    UNIQUE (reporter_profile_id, target_kind, target_id)
);

COMMENT ON TABLE public.content_reports IS
    'Жалобы на содержимое (Apple 1.2). Один человек — одна жалоба на один объект. Срок разбора: трое суток, записан в Правилах.';

CREATE INDEX IF NOT EXISTS content_reports_new_idx
    ON public.content_reports (status, created_at DESC) WHERE status = 'new';
CREATE INDEX IF NOT EXISTS content_reports_target_idx
    ON public.content_reports (target_kind, target_id);


-- ── 2. БЛОКИРОВКИ ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (blocker_profile_id, blocked_profile_id),
    -- Себя заблокировать нельзя: это не защита, а способ сломать себе
    -- вызовы и приглашения, не поняв почему.
    CHECK (blocker_profile_id <> blocked_profile_id)
);

COMMENT ON TABLE public.user_blocks IS
    'Кого человек заблокировал. Заблокированный не вызовет его на баттл, не позовёт играть и не увидит контакты. ТУРНИРНЫЕ РЕЗУЛЬТАТЫ НЕ ПРЯЧУТСЯ: они принадлежат турниру, а не двум людям.';

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON public.user_blocks (blocker_profile_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks (blocked_profile_id);


-- ── 3. СТОП-СЛОВА ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banned_words (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word       text        NOT NULL UNIQUE CHECK (length(btrim(word)) >= 2),
    lang       text        NOT NULL DEFAULT 'any' CHECK (lang IN ('ru', 'en', 'kg', 'any')),
    added_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.banned_words IS
    'Стоп-слова для триггера-фильтра. Хранятся в НИЖНЕМ регистре. Таблица заводится ПУСТОЙ: первый список на трёх языках наполняет клуб — я не знаю, что считается оскорблением на кыргызском.';

-- Нижний регистр — свойство данных, а не того, кто их вписывает.
CREATE OR REPLACE FUNCTION public.banned_words_lower()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.word := lower(btrim(NEW.word));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS banned_words_lower_trg ON public.banned_words;
CREATE TRIGGER banned_words_lower_trg
    BEFORE INSERT OR UPDATE ON public.banned_words
    FOR EACH ROW EXECUTE FUNCTION public.banned_words_lower();


-- ── 4. ФИЛЬТР ────────────────────────────────────────────────────────────
--
-- ПУСТОЙ СПИСОК НИЧЕГО НЕ ЗАПРЕЩАЕТ, И ЭТО НАРОЧНО: пока клуб не внёс
-- слова, продукт работает как прежде. Иначе миграция остановила бы
-- регистрацию до того, как кто-то успел наполнить таблицу.
CREATE OR REPLACE FUNCTION public.kslt_tekst_chist(t text)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM public.banned_words b
        -- Границы слова: «сукно» не должно падать из-за «сук».
        WHERE lower(coalesce(t, '')) ~ ('(^|[^[:alnum:]])' || b.word || '([^[:alnum:]]|$)')
    );
$$;

COMMENT ON FUNCTION public.kslt_tekst_chist(text) IS
    'true — в тексте нет стоп-слов. Границы слова учитываются: «сукно» не падает из-за «сук».';

CREATE OR REPLACE FUNCTION public.kslt_proverit_tekst()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    pole text;
    znach text;
BEGIN
    FOREACH pole IN ARRAY TG_ARGV LOOP
        EXECUTE format('SELECT ($1).%I::text', pole) INTO znach USING NEW;
        IF znach IS NOT NULL AND NOT public.kslt_tekst_chist(znach) THEN
            RAISE EXCEPTION 'KSLT_STOP_WORD: %', pole
                USING HINT = 'Текст содержит недопустимое слово';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.kslt_proverit_tekst() IS
    'Триггер-фильтр. Поля перечисляются доводами триггера. Отказ помечен KSLT_STOP_WORD — по нему приложение отличит его от прочих ошибок и скажет человеку понятное.';

DROP TRIGGER IF EXISTS profiles_stop_words_trg ON public.profiles;
CREATE TRIGGER profiles_stop_words_trg
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.kslt_proverit_tekst('full_name');

DROP TRIGGER IF EXISTS players_stop_words_trg ON public.players;
CREATE TRIGGER players_stop_words_trg
    BEFORE INSERT OR UPDATE ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.kslt_proverit_tekst('bio', 'bio_en', 'bio_kg', 'name');

DROP TRIGGER IF EXISTS challenges_stop_words_trg ON public.challenges;
CREATE TRIGGER challenges_stop_words_trg
    BEFORE INSERT OR UPDATE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION public.kslt_proverit_tekst('battle_title');

DROP TRIGGER IF EXISTS regs_stop_words_trg ON public.tournament_registrations;
CREATE TRIGGER regs_stop_words_trg
    BEFORE INSERT OR UPDATE ON public.tournament_registrations
    FOR EACH ROW EXECUTE FUNCTION public.kslt_proverit_tekst('partner_external_name');


-- ── 5. ДОСТУП ────────────────────────────────────────────────────────────
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_words    ENABLE ROW LEVEL SECURITY;

-- Жалобы: пишет вошедший о себе, читает он же и сотрудник.
-- ЧУЖИЕ ЖАЛОБЫ НЕ ВИДНЫ НИКОМУ, КРОМЕ СОТРУДНИКОВ: знать, что на тебя
-- пожаловались и кто именно, — это способ свести счёты вне приложения.
DROP POLICY IF EXISTS "content_reports_insert_own" ON public.content_reports;
CREATE POLICY "content_reports_insert_own"
    ON public.content_reports FOR INSERT
    WITH CHECK (reporter_profile_id = auth.uid());

DROP POLICY IF EXISTS "content_reports_select_own_or_staff" ON public.content_reports;
CREATE POLICY "content_reports_select_own_or_staff"
    ON public.content_reports FOR SELECT
    USING (reporter_profile_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "content_reports_staff_manage" ON public.content_reports;
CREATE POLICY "content_reports_staff_manage"
    ON public.content_reports FOR UPDATE
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Блокировки: человек распоряжается только своими.
-- ЗАБЛОКИРОВАННЫЙ НЕ ВИДИТ, ЧТО ЕГО ЗАБЛОКИРОВАЛИ — иначе блокировка
-- становится сообщением, а она задумана как тишина.
DROP POLICY IF EXISTS "user_blocks_own_all" ON public.user_blocks;
CREATE POLICY "user_blocks_own_all"
    ON public.user_blocks FOR ALL
    USING (blocker_profile_id = auth.uid() OR public.is_staff())
    WITH CHECK (blocker_profile_id = auth.uid());

-- Стоп-слова: читать могут все вошедшие (приложение проверяет текст до
-- отправки), менять — только сотрудники.
DROP POLICY IF EXISTS "banned_words_read" ON public.banned_words;
CREATE POLICY "banned_words_read"
    ON public.banned_words FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "banned_words_staff_manage" ON public.banned_words;
CREATE POLICY "banned_words_staff_manage"
    ON public.banned_words FOR ALL
    USING (public.is_staff()) WITH CHECK (public.is_staff());


-- ── 6. ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS» ──────────────────────────
-- Выполнить ПОСЛЕ миграции и сверить глазами:
--
--   select table_name from information_schema.tables
--    where table_schema = 'public'
--      and table_name in ('content_reports','user_blocks','banned_words');
--   -- ждём три строки
--
--   select tgname from pg_trigger
--    where tgname like '%stop_words_trg';
--   -- ждём четыре строки
--
--   select public.kslt_tekst_chist('обычное имя');   -- ждём true

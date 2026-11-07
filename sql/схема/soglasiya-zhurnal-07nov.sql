-- ============================================================
-- Ю1. ЖУРНАЛ СОГЛАСИЙ. МЕНЯЕТ БАЗУ: новые столбцы, таблица, триггер.
-- ============================================================
--
-- ОСНОВАНИЕ — НЕ КОД, А ДОКУМЕНТ. Поля взяты из «Согласия на обработку
-- персональных данных», утверждённого приказом № 1 от 03.11.2026,
-- раздел «Журнал согласий — что фиксируется» (п. 15-16 Порядка № 27):
-- ID пользователя, e-mail, время, цель 1-4, действие, редакция текста,
-- платформа, версия приложения, IP. Записи НЕ ИЗМЕНЯЮТСЯ, хранятся
-- 3 года после прекращения Соглашения.
--
-- ЦЕЛЕЙ РОВНО ЧЕТЫРЕ, И ИХ НАЗЫВАЕТ ЮРИСТ:
--   1 — уведомления на контактные данные (e-mail, Telegram)
--   2 — связь с другими игроками (показ телефона и Telegram)
--   3 — фото и видео с турниров
--   4 — новости и предложения
-- Аналитики среди них НЕТ: она идёт по законному интересу (политика,
-- п. 5 ч. 1 ст. 79), и согласия на неё не спрашивают.
--
-- ГДЕ ЖИВЁТ СОСТОЯНИЕ — ТАМ И ОСТАЁТСЯ, ВТОРОГО НАБОРА НЕТ:
--   цель 2 — уже живущие `show_phone`, `show_telegram`, `show_whatsapp`,
--            `show_instagram`: цель считается данной, если включён хоть
--            один показ контакта;
--   цели 1, 3, 4 — своих столбцов не было, заводятся ниже.
-- `notify_preferences` НЕ ЗАМЕНЯЕТСЯ: это тонкая настройка ВНУТРИ
-- согласия (какие разделы), а само согласие — `consent_notify`.
-- ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ.
--
-- ЖУРНАЛ ПИШЕТ ТРИГГЕР, А НЕ JS. Иначе на первом же новом месте, где
-- меняют согласие, журнал забудут позвать, и два источника правды
-- разойдутся молча.

-- ── 1. Состояние целей 1, 3, 4 ────────────────────────────────────
-- УМОЛЧАНИЕ — «НЕ ДАНО». Так требует документ: «Если вы ничего не
-- отметите, вы всё равно сможете пользоваться... Переключатели по
-- умолчанию ВСЕ ВЫКЛЮЧЕНЫ».
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS consent_notify  boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS consent_media   boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS consent_news    boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.consent_notify IS
    'Цель 1 согласия: уведомления на e-mail и в Telegram. Умолчание — не дано.';
COMMENT ON COLUMN public.profiles.consent_media IS
    'Цель 3 согласия: фото и видео с турниров. Срок — 3 года с даты согласия.';
COMMENT ON COLUMN public.profiles.consent_news IS
    'Цель 4 согласия: новости и предложения. Умолчание — не дано.';

-- ── 2. Журнал ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consents (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email         text,                      -- e-mail учётной записи на момент записи
    created_at    timestamptz NOT NULL DEFAULT now(),
    purpose       smallint    NOT NULL CHECK (purpose BETWEEN 1 AND 4),
    action        text        NOT NULL CHECK (action IN ('given', 'revoked')),
    doc_revision  text,                      -- редакция текста согласия
    platform      text,                      -- web / android / ios
    app_version   text,
    ip            text
);

COMMENT ON TABLE public.consents IS
    'Журнал согласий (Ю1). Только добавление: правка и удаление запрещены правилом ниже. Хранить 3 года после прекращения Соглашения.';

CREATE INDEX IF NOT EXISTS consents_user_idx    ON public.consents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS consents_purpose_idx ON public.consents (purpose, created_at DESC);

-- ── 3. ЗАПИСИ НЕ ИЗМЕНЯЮТСЯ — ЭТО ТРЕБОВАНИЕ ДОКУМЕНТА ────────────
-- Запрет ставится в базе, а не договорённостью: журнал, который можно
-- поправить, ничего не доказывает.
CREATE OR REPLACE FUNCTION public.журнал_согласий_не_правится()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Журнал согласий только добавляется: % запрещён (п. 15-16 Порядка № 27)', TG_OP;
END $$;

DROP TRIGGER IF EXISTS consents_bez_pravki ON public.consents;
CREATE TRIGGER consents_bez_pravki
    BEFORE UPDATE OR DELETE ON public.consents
    FOR EACH ROW EXECUTE FUNCTION public.журнал_согласий_не_правится();

-- ── 4. Триггер следа ──────────────────────────────────────────────
-- ПЛАТФОРМА, ВЕРСИЯ И IP БЕРУТСЯ ИЗ ЗАГОЛОВКОВ ЗАПРОСА. PostgREST
-- кладёт их в `request.headers`; при вызове не через него (прогон в
-- редакторе, серверная функция) заголовков нет, и поля остаются
-- пустыми — это честнее выдуманного значения.
CREATE OR REPLACE FUNCTION public.записать_согласие()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    з  jsonb := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
    пл text  := coalesce(з ->> 'x-kslt-platform', 'web');
    вер text := з ->> 'x-kslt-app-version';
    ип text  := coalesce(split_part(з ->> 'x-forwarded-for', ',', 1), з ->> 'cf-connecting-ip');
    ред text := з ->> 'x-kslt-consent-revision';

    /* Цель 2 — «связь с другими игроками»: она считается данной, если
       показан хоть один контакт. Своего столбца у неё нет и не должно
       быть: переключатели уже живут в кабинете. */
    было2 boolean := coalesce(OLD.show_phone, false) OR coalesce(OLD.show_telegram, false)
                  OR coalesce(OLD.show_whatsapp, false) OR coalesce(OLD.show_instagram, false);
    стало2 boolean := coalesce(NEW.show_phone, false) OR coalesce(NEW.show_telegram, false)
                   OR coalesce(NEW.show_whatsapp, false) OR coalesce(NEW.show_instagram, false);

BEGIN
    IF coalesce(OLD.consent_notify, false) IS DISTINCT FROM coalesce(NEW.consent_notify, false) THEN
        INSERT INTO public.consents (user_id, email, purpose, action, doc_revision, platform, app_version, ip)
        VALUES (NEW.id, NEW.email, 1, CASE WHEN NEW.consent_notify THEN 'given' ELSE 'revoked' END, ред, пл, вер, ип);
    END IF;

    IF было2 IS DISTINCT FROM стало2 THEN
        INSERT INTO public.consents (user_id, email, purpose, action, doc_revision, platform, app_version, ip)
        VALUES (NEW.id, NEW.email, 2, CASE WHEN стало2 THEN 'given' ELSE 'revoked' END, ред, пл, вер, ип);
    END IF;

    IF coalesce(OLD.consent_media, false) IS DISTINCT FROM coalesce(NEW.consent_media, false) THEN
        INSERT INTO public.consents (user_id, email, purpose, action, doc_revision, platform, app_version, ip)
        VALUES (NEW.id, NEW.email, 3, CASE WHEN NEW.consent_media THEN 'given' ELSE 'revoked' END, ред, пл, вер, ип);
    END IF;

    IF coalesce(OLD.consent_news, false) IS DISTINCT FROM coalesce(NEW.consent_news, false) THEN
        INSERT INTO public.consents (user_id, email, purpose, action, doc_revision, platform, app_version, ip)
        VALUES (NEW.id, NEW.email, 4, CASE WHEN NEW.consent_news THEN 'given' ELSE 'revoked' END, ред, пл, вер, ип);
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_sled_soglasiy ON public.profiles;
CREATE TRIGGER profiles_sled_soglasiy
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.записать_согласие();

-- ── 5. Доступ ─────────────────────────────────────────────────────
-- Человек видит СВОЙ журнал (это его право по ст. 73), пишет только
-- триггер. Админские правила не трогаются: их Костя заводил сам.
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consents_svoi_chitaet ON public.consents;
CREATE POLICY consents_svoi_chitaet ON public.consents
    FOR SELECT USING (auth.uid() = user_id);

-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»:
SELECT  (SELECT count(*) FROM information_schema.columns
          WHERE table_name = 'profiles'
            AND column_name IN ('consent_notify','consent_media','consent_news')) AS stolbcov_iz_3,
        (SELECT count(*) FROM information_schema.tables
          WHERE table_name = 'consents')                                          AS tablica_est,
        (SELECT count(*) FROM pg_trigger
          WHERE tgname IN ('profiles_sled_soglasiy','consents_bez_pravki'))        AS triggerov_iz_2,
        (SELECT count(*) FROM public.consents)                                     AS zapisey;

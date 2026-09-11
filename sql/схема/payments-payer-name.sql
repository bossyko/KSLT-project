-- ============================================
-- Плательщик в самой оплате, а не по ссылке
-- ============================================
--
-- Что не так сейчас.
--
-- В таблице payments лежит только ссылка на аккаунт. Имя плательщика админка
-- достаёт через эту ссылку, из профиля. Значит имя в отчёте — не то, что было
-- на дату платежа, а то, что в профиле прямо сейчас.
--
-- Отсюда две беды. Человек сменил фамилию — и все прошлогодние оплаты задним
-- числом переписались на новую. А когда мы включим удаление аккаунта, первый
-- же удалившийся член унесёт своё имя из бухгалтерии: сумма останется, а кто
-- платил — неизвестно.
--
-- Документ об оплате должен помнить плательщика на дату платежа и больше не
-- меняться. Так уже сделано в соседней таблице entity_payments: там имя
-- получателя хранится прямо в записи (entity_name).
--
-- Что делаем.
--
--   payer_name, payer_email — имя и почта плательщика в самой записи.
--   По старым оплатам проставим один раз из профилей.
--   Дальше их заполняет триггер: оплаты создаются из трёх разных мест
--   (админка пользователей, админка финансов, бот в Телеграме), и полагаться
--   на то, что каждое из них не забудет, нельзя — забудут.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_оплат,
       count(*) FILTER (WHERE profile_id IS NULL) AS без_плательщика
FROM payments;


-- ---- 2. Колонки --------------------------------------------------------
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payer_name  text,
    ADD COLUMN IF NOT EXISTS payer_email text;

COMMENT ON COLUMN public.payments.payer_name IS
    'ФИО плательщика на дату платежа. Снимок: не меняется вслед за профилем и переживает удаление аккаунта.';
COMMENT ON COLUMN public.payments.payer_email IS
    'Почта плательщика на дату платежа. Снимок, см. payer_name.';


-- ---- 3. Старые оплаты --------------------------------------------------
-- Тем, у кого профиль ещё жив, проставляем один раз. Если профиля уже нет,
-- имя восстановить неоткуда — оставляем пустым, честнее, чем выдумывать
UPDATE public.payments p
SET payer_name  = pr.full_name,
    payer_email = pr.email
FROM public.profiles pr
WHERE pr.id = p.profile_id
  AND p.payer_name IS NULL;


-- ---- 4. Дальше заполняет база ------------------------------------------
CREATE OR REPLACE FUNCTION public.fill_payment_payer()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- Переданное вручную не трогаем: вдруг платил не владелец аккаунта
    IF NEW.payer_name IS NULL AND NEW.profile_id IS NOT NULL THEN
        SELECT full_name, email
          INTO NEW.payer_name, NEW.payer_email
          FROM public.profiles
         WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.fill_payment_payer() OWNER TO postgres;

DROP TRIGGER IF EXISTS trg_fill_payment_payer ON public.payments;
CREATE TRIGGER trg_fill_payment_payer
    BEFORE INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.fill_payment_payer();


-- ---- 5. ПРОВЕРКА -------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'payer_name')  AS колонка_имя,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'payer_email') AS колонка_почта,
    (SELECT count(*) FROM pg_trigger
      WHERE tgname = 'trg_fill_payment_payer')                        AS триггер,
    (SELECT count(*) FROM payments WHERE payer_name IS NOT NULL)      AS оплат_с_именем,
    (SELECT count(*) FROM payments WHERE payer_name IS NULL)          AS осталось_без_имени;

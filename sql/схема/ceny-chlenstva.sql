-- ============================================================
-- Цены членства КСЛТ
-- ============================================================
--
-- Страница «Цены» (pages/pricing.html:548) читает таблицу
-- public.pricing_plans с 09.10, а таблицы в базе нет вовсе: запрос падает
-- молча, и все три строки прайса навсегда показывают «уточняется», а
-- кнопка в окне оплаты навсегда выключена. Эта правка заводит таблицу.
--
-- Суммы лежат в базе, а не в коде, по той же причине, что и дата
-- бесплатного доступа: приложение у людей установлено, и правка в коде
-- дойдёт до них только с новой сборкой. Сумма в базе действует сразу и на
-- сайте, и в приложении, и разом на всех трёх языках — источник один.
--
-- Ставит и меняет их АДМИНИСТРАТОР в админке: Настройки → Цены.
-- Менеджеру прав на запись не даётся — слово Кости 09.10.
--
-- Строки заводятся с пустой суммой: пока сумма не названа, страница честно
-- говорит «уточняется». Это НЕ заглушка в разметке, а умолчание данных.
--
-- Запускать можно повторно: таблица и строки создаются, если их нет,
-- существующие суммы не трогаются.

BEGIN;

-- ---- Таблица ----
--
-- kind — что именно платят. Три вида, больше страница не показывает:
--   join  — вступительный взнос, платится один раз
--   year  — годовое членство
--   month — помесячное членство
-- amount пустой — сумма не названа, страница пишет «уточняется».
-- Турнирный взнос сюда НЕ входит: он свой у каждого турнира и живёт в
-- tournaments (поля взноса), а на странице стоит отдельной строкой фактом.

CREATE TABLE IF NOT EXISTS public.pricing_plans (
    kind       text PRIMARY KEY
               CHECK (kind IN ('join', 'year', 'month')),
    amount     numeric(10, 2),
    currency   text NOT NULL DEFAULT 'сом',
    is_active  boolean NOT NULL DEFAULT true,
    note       text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.pricing_plans IS
    'Суммы членства КСЛТ. Меняет администратор в админке, без выкладки: их читают и сайт, и приложение.';
COMMENT ON COLUMN public.pricing_plans.kind IS
    'join — вступительный взнос, year — годовое членство, month — помесячное.';
COMMENT ON COLUMN public.pricing_plans.amount IS
    'Пусто — сумма не названа; страница показывает «уточняется», кнопка оплаты выключена.';

-- ---- Слепок — ПОСЛЕ создания таблицы, а не до ----
--
-- ПЕРВАЯ РЕДАКЦИЯ ЭТОГО ФАЙЛА УПАЛА РОВНО ЗДЕСЬ: слепок стоял выше и читал
-- public.pricing_plans, которой ещё не было. Оговорка EXISTS не спасает —
-- постгрес разбирает имена ДО того, как доходит до условия, и отвечает
-- 42P01. Разбор грамматики этого не ловит: он проверяет синтаксис, а не
-- существование. СНАЧАЛА СОЗДАТЬ, ПОТОМ ЧИТАТЬ.
--
-- Если таблица уже была и в ней стоят утверждённые суммы, слепок позволит
-- вернуть их. На первом прогоне он выйдет пустым, и это правильно.

CREATE TABLE IF NOT EXISTS public.slepok_pricing_plans_0910 (
    kind       text,
    amount     numeric,
    currency   text,
    is_active  boolean,
    note       text,
    snyat      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.slepok_pricing_plans_0910 (kind, amount, currency, is_active, note)
SELECT p.kind, p.amount, p.currency, p.is_active, p.note
  FROM public.pricing_plans p;

-- ---- Три вида платежа ----

INSERT INTO public.pricing_plans (kind, amount, currency, is_active)
VALUES ('join',  NULL, 'сом', true),
       ('year',  NULL, 'сом', true),
       ('month', NULL, 'сом', true)
ON CONFLICT (kind) DO NOTHING;

-- ---- Права ----
--
-- Читать нужно всем, включая гостя: страница «Цены» открыта без входа.
-- Менять — ТОЛЬКО администратору. Менеджер, в отличие от таблицы очков,
-- прав на запись здесь не имеет.

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_plans_read ON public.pricing_plans;
CREATE POLICY pricing_plans_read ON public.pricing_plans
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS pricing_plans_admin ON public.pricing_plans;
CREATE POLICY pricing_plans_admin ON public.pricing_plans
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                         WHERE p.id = auth.uid() AND p.role = 'admin'));

COMMIT;

-- ============================================================
-- ПРОВЕРКА ЧТЕНИЕМ, А НЕ ОТВЕТОМ «SUCCESS»
-- ============================================================

-- 1. Что лежит в таблице. Ждём три строки, суммы пустые.
SELECT kind, amount, currency, is_active, updated_at
  FROM public.pricing_plans
 ORDER BY CASE kind WHEN 'join' THEN 1 WHEN 'year' THEN 2 ELSE 3 END;

-- 2. Права: ждём две политики — чтение всем, запись только админу.
SELECT polname,
       pg_get_expr(polqual, polrelid)      AS komu_vidno,
       pg_get_expr(polwithcheck, polrelid) AS komu_mozhno_pisat
  FROM pg_policy
 WHERE polrelid = 'public.pricing_plans'::regclass
 ORDER BY polname;

-- 3. RLS включена? Ждём true.
SELECT relname, relrowsecurity
  FROM pg_class
 WHERE oid = 'public.pricing_plans'::regclass;

-- 4. Слепок: сколько строк он сохранил. На первом прогоне ждём 0.
SELECT count(*) AS strok_v_slepke FROM public.slepok_pricing_plans_0910;

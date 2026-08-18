-- Тарифы членства
-- ===============
--
-- Суммы были вбиты в разметку страницы Цен, в трёх языковых копиях. Меняешь
-- цену — правишь три файла и не забываешь ни одного. Теперь они в базе:
-- страница читает их сама, а пока сумма не заведена, показывает
-- «уточняется» и держит кнопку оплаты неактивной.
--
-- kind — что именно оплачивают:
--   join  — вступительный взнос, разово при вступлении
--   year  — членство на год
--   month — членство на месяц

BEGIN;

CREATE TABLE IF NOT EXISTS pricing_plans (
    kind        text PRIMARY KEY,
    amount      numeric,
    currency    text NOT NULL DEFAULT 'сом',
    is_active   boolean NOT NULL DEFAULT true,
    sort_order  int NOT NULL DEFAULT 0,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE pricing_plans IS 'Тарифы членства КСЛТ. amount = NULL — сумма ещё не утверждена, страница пишет «уточняется».';

INSERT INTO pricing_plans (kind, amount, sort_order) VALUES
    ('join',  NULL, 1),
    ('year',  NULL, 2),
    ('month', NULL, 3)
ON CONFLICT (kind) DO NOTHING;

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_plans_read ON pricing_plans;
CREATE POLICY pricing_plans_read ON pricing_plans FOR SELECT USING (true);

SELECT kind, amount, currency, is_active FROM pricing_plans ORDER BY sort_order;

COMMIT;

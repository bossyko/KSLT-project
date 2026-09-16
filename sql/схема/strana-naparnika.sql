-- ============================================================
-- Страна напарника-гостя
-- ============================================================
--
-- У гостя-участника страна в заявке есть — по ней рядом с именем встаёт
-- флаг: на турнирах клуба играли приезжие, и это видно в сетке. А у
-- напарника-гостя такого поля не было вовсе, поэтому заявка, поданная
-- игроком с сайта, страну не спрашивала, а та же заявка из админки —
-- спрашивала. Одно и то же место в базе, разные формы.
--
-- Заводим поле и напарнику. По умолчанию флаг Кыргызстана: приезжие редки,
-- и в обычном случае вводить ничего не придётся.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS partner_external_country text;

COMMENT ON COLUMN public.tournament_registrations.partner_external_country IS
    'Страна напарника-гостя — флагом, как external_country у основного участника';

-- Уже заведённым напарникам-гостям ставим флаг клуба: все они местные
UPDATE public.tournament_registrations
   SET partner_external_country = '🇰🇬'
 WHERE partner_external_name IS NOT NULL
   AND partner_external_country IS NULL;

COMMIT;

-- ---- Проверка ----

SELECT count(*) FILTER (WHERE partner_external_name IS NOT NULL)            AS напарников_гостей,
       count(*) FILTER (WHERE partner_external_name IS NOT NULL
                          AND partner_external_country IS NULL)             AS без_страны
  FROM public.tournament_registrations;
-- Ожидаем: без страны 0.

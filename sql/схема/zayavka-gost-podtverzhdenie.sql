-- ============================================================
-- Пара с гостем: заявка ждёт подтверждения менеджера
-- ============================================================
--
-- Игрок может позвать напарником человека без карточки — «гостя». Такую пару
-- нельзя принимать молча: клуб не знает ни его рейтинга, ни того, придёт ли
-- он вообще. Поэтому место за парой держим, но помечаем заявку как ждущую
-- решения, а менеджер подтверждает или убирает гостя.
--
-- Убирает — значит первый номер остаётся один и ищет другого напарника;
-- заявку целиком не снимаем, человек не виноват.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS guest_confirmed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tournament_registrations.guest_confirmed IS
    'Гостя в паре подтвердил менеджер. Для заявок без гостя значения не имеет';

-- Прошлые заявки с гостем считаем подтверждёнными: их заводил менеджер сам,
-- и новое правило задним числом к ним не применяется
UPDATE public.tournament_registrations
   SET guest_confirmed = true
 WHERE partner_external_name IS NOT NULL
   AND guest_confirmed = false;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ---- Проверка ----

SELECT count(*) FILTER (WHERE partner_external_name IS NOT NULL) AS заявок_с_гостем,
       count(*) FILTER (WHERE partner_external_name IS NOT NULL AND guest_confirmed) AS подтверждено,
       count(*) FILTER (WHERE partner_external_name IS NOT NULL AND NOT guest_confirmed) AS ждут_решения
  FROM public.tournament_registrations;
-- Ожидаем: все прежние заявки с гостем подтверждены, ждущих решения нет.

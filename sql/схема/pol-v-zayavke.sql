-- ============================================================
-- Пол в заявке: у гостя он есть, а несовпадение ждёт решения
-- ============================================================
--
-- Два поля.
--
-- external_gender — пол гостя, которого заводит менеджер. У игрока с
-- карточкой пол известен, у гостя его записать было некуда: в заявке жил
-- только пол напарника-гостя, а пол самого гостя нигде. Из-за этого в
-- одиночном турнире гостя нельзя было проверить вовсе.
--
-- gender_confirmed — решение клуба по составу. По умолчанию true: обычная
-- заявка ничего не ждёт. Ставим false, когда пол не сошёлся с турниром —
-- мужская пара в миксте, женщина в мужском парном. Такую заявку клуб
-- принимает: место держится по времени подачи, как у всех, но в сетку она
-- не идёт, пока менеджер не решит. Отказал — заявка снимается, и место
-- уходит первому в очереди.
--
-- Рейтинговых одиночных это не касается: там очки идут в мужской или
-- женский рейтинг, и несовпадение отклоняется сразу, без рассмотрения.
--
-- Тот же приём уже работает для гостя в паре — guest_confirmed. Поля
-- раздельные нарочно: причины разные, и решать их можно по отдельности.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS external_gender text,
    ADD COLUMN IF NOT EXISTS gender_confirmed boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.tournament_registrations.external_gender IS
    'Пол гостя без карточки: men | women. У игрока с карточкой берётся из players.gender';
COMMENT ON COLUMN public.tournament_registrations.gender_confirmed IS
    'false — состав не сошёлся с турниром по полу и ждёт решения менеджера. Место держится, в сетку заявка не идёт';

-- Гости, заведённые до этой правки, пол в заявке не хранят — берём его из
-- карточки, она у всех заполнена
UPDATE public.tournament_registrations r
   SET external_gender = p.gender
  FROM public.players p
 WHERE r.external_gender IS NULL
   AND r.is_external
   AND p.id = r.player_id;

COMMIT;

-- ---- Проверка ----

SELECT count(*) FILTER (WHERE NOT gender_confirmed) AS ждут_решения,
       count(*) FILTER (WHERE is_external AND external_gender IS NULL) AS гостей_без_пола,
       count(*) AS всего_заявок
  FROM public.tournament_registrations;
-- Ожидаем: ждут решения 0, гостей без пола 0.

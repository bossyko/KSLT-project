-- ЗАЯВКИ: место и причины. ШАГ 1 из 2 — ДОБАВИТЬ И НАПОЛНИТЬ.
--
-- Старое не удаляется: gender_confirmed остаётся на месте, и обе колонки
-- живут рядом, пока код не переведён. Убирает его ШАГ 2, отдельным файлом.
--
-- ЗАЧЕМ. Замер 28.09 по коду:
--   • «сколько мест в основе» определено ТРИЖДЫ и по-разному:
--       index.ts:476            max − reserved   верно
--       tournament-slots.js:113 taken + reserved верно
--       bracket.js:780          max              НЕВЕРНО — съедает резерв
--     Турнир на 16 с резервом 4: снялась одна пара из двенадцати — автоподъём
--     поднимет пятерых вместо одного и отдаст очереди все четыре места клуба.
--   • отличить спецгостя, посаженного админом на резервное место, от
--     онлайн-заявки СЕГОДНЯ НЕЧЕМ: ручное добавление (bracket.js:2857) кладёт
--     status='approved' и ничего про источник. Значит правило «резерв
--     заполняет человек, очередь его не трогает» посчитать невозможно.
--   • причина, по которой заявка ждёт решения, хранится булевым
--     gender_confirmed. Причин стало три — пол, сумма NTRP, нет парного
--     рейтинга, — и они бывают у одной пары РАЗОМ. Булев вмещает одну.

BEGIN;

-- 1. КАКОЕ МЕСТО ЗАНИМАЕТ ЗАЯВКА
--    online   — пришла через сайт или приложение, считается в «макс − резерв»
--    reserved — посажена админом на место клуба, очередью не трогается
ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS seat_pool text NOT NULL DEFAULT 'online';

ALTER TABLE public.tournament_registrations
    DROP CONSTRAINT IF EXISTS tournament_registrations_seat_pool_check;
ALTER TABLE public.tournament_registrations
    ADD CONSTRAINT tournament_registrations_seat_pool_check
    CHECK (seat_pool = ANY (ARRAY['online'::text, 'reserved'::text]));

-- 2. ПОЧЕМУ ЗАЯВКА ЖДЁТ РЕШЕНИЯ — СПИСКОМ, А НЕ ОДНОЙ ПРИЧИНОЙ
--    пусто          — проверять нечего
--    gender         — состав не совпал по полу
--    ntrp_combined  — сумма NTRP пары выше предела турнира
--    ntrp_doubles   — у кого-то из пары нет парного рейтинга
ALTER TABLE public.tournament_registrations
    ADD COLUMN IF NOT EXISTS review_reasons text[] NOT NULL DEFAULT '{}';

-- 3. ПЕРЕНОС ДАННЫХ: единственная причина, которая сегодня существует
UPDATE public.tournament_registrations
SET review_reasons = ARRAY['gender']
WHERE gender_confirmed IS FALSE
  AND review_reasons = '{}';

-- 4. Очередь ищет по этим двум полям — индекс на пару
CREATE INDEX IF NOT EXISTS idx_registrations_seat_pool
    ON public.tournament_registrations (tournament_id, seat_pool, status);

COMMIT;

-- 5. ПРОВЕРКА ПЕРЕНОСА
SELECT count(*) FILTER (WHERE seat_pool = 'online')            AS mest_online,
       count(*) FILTER (WHERE seat_pool = 'reserved')          AS mest_rezerv,
       count(*) FILTER (WHERE gender_confirmed IS FALSE)       AS bylo_po_polu,
       count(*) FILTER (WHERE 'gender' = ANY(review_reasons))  AS stalo_gender,
       count(*)                                                AS vsego
FROM public.tournament_registrations;

-- ============================================================
-- Два хвоста по одиночному Futures: очередь и NTRP
-- ============================================================
--
-- Турнир 1ab0b15e-d8e4-4183-94b1-ba7ff59723f3.
-- Слово Кости 14.10: «1 надо как в файле порядок заявок чтобы был
-- 2 по файлу сделай 3 не надо». Телефоны WhatsApp не заносим.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ============================================================
-- 1. ОЧЕРЕДЬ — В ПОРЯДКЕ ФАЙЛА
-- ============================================================
--
-- Порядок в листе ожидания база считает ТОЛЬКО по queue_at, а это
-- считаемая колонка COALESCE(waitlisted_at, registered_at)
-- (sql/функции/ochered-vremya-postanovki.sql:61). Значит порядок задаётся
-- единственным способом — заполнением waitlisted_at.
--
-- НАМЕРЕНО: порядок строк — такой же, как в листе ожидания файла клуба.
--           Это решение клуба, а не время подачи: вниз опущены те, у кого
--           «нет членства в КСЛТ».
--
-- ПОСЧИТАНО: сами отметки времени. Якорь — 2026-10-14 11:00, это позже
--            самой поздней отметки в файле (Ирсалиев, 10:24:03.881),
--            шаг одна минута. Числа служат только порядку; измерить их
--            негде, потому и помечены.
--
-- registered_at НЕ ТРОГАЕМ: время подачи остаётся настоящим, из формы.

BEGIN;

UPDATE public.tournament_registrations r
   SET waitlisted_at = д.когда
  FROM (VALUES
         ('omuradil-sydykov'::text,     timestamptz '2026-10-14 11:00'),  --  1
         ('sardar-artykbaev'::text,     timestamptz '2026-10-14 11:01'),  --  2
         ('bekzhan-kylychbekov'::text,  timestamptz '2026-10-14 11:02'),  --  3
         ('asankulov-timur'::text,      timestamptz '2026-10-14 11:03'),  --  4
         ('sejtek-irsaliev'::text,      timestamptz '2026-10-14 11:04'),  --  5
         ('pogorelov-roman'::text,      timestamptz '2026-10-14 11:05'),  --  6
         ('alihan-kuvanyshev'::text,    timestamptz '2026-10-14 11:06'),  --  7
         ('atabek-abdyldaev'::text,     timestamptz '2026-10-14 11:07'),  --  8
         ('ilgiz-kuvatbek'::text,       timestamptz '2026-10-14 11:08'),  --  9
         ('ulukbek-malikov'::text,      timestamptz '2026-10-14 11:09'),  -- 10
         ('majnazarov-nursultan'::text, timestamptz '2026-10-14 11:10'),  -- 11
         ('bekbolot-ukubaev'::text,     timestamptz '2026-10-14 11:11'),  -- 12
         ('isabekov-tsken'::text,       timestamptz '2026-10-14 11:12'),  -- 13
         ('sultan-doolotov'::text,      timestamptz '2026-10-14 11:13')   -- 14
       ) AS д (player_id, когда)
 WHERE r.tournament_id = '1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'
   AND r.player_id     = д.player_id
   AND r.status        = 'waitlist';


-- ============================================================
-- 2. ЧЕТЫРЕ ОЦЕНКИ NTRP — ПО ФАЙЛУ
-- ============================================================
--
-- Форма клуба против карточки. Берём форму — слово Кости.
--
--   Никита Нищук         база 2.5 → файл 3
--   Темирлан Тулегенов   база 2.5 → файл 3
--   Артур Аманбеков      база 2.5 → файл 3
--   Атабек Абдылдаев     база 3   → файл 2.5
--
-- ПОМЕРЕНО: записей в rating_history с ntrp_after у этих четверых НОЛЬ,
-- значит правка карточки ни с какой историей не разойдётся.
--
-- «0» в колонке NTRP у Сыдыкова, Артыкбаева и Кылычбекова НЕ трогаем:
-- это «не указано», а не оценка — в их карточках стоят 2.5, 3 и 3.
--
-- Условие на старое значение — чтобы повторный прогон не перебил оценку,
-- если клуб к тому времени поправит её руками.

UPDATE public.players p
   SET ntrp_singles = д.стало,
       updated_at   = now()
  FROM (VALUES
         ('nikita-nischuk'::text,     2.5::numeric(3,2), 3::numeric(3,2)),
         ('temirlan-tulegenov'::text, 2.5::numeric(3,2), 3::numeric(3,2)),
         ('artur-amanbekov'::text,    2.5::numeric(3,2), 3::numeric(3,2)),
         ('atabek-abdyldaev'::text,   3::numeric(3,2),   2.5::numeric(3,2))
       ) AS д (id, было, стало)
 WHERE p.id           = д.id
   AND p.ntrp_singles = д.было;

COMMIT;


-- ---- ПРОВЕРКА 1: очередь ровно как в файле ------------------------
-- Ждём 14 строк в этом порядке: Сыдыков, Артыкбаев, Кылычбеков,
-- Асанкулов, Ирсалиев, Погарелов, Куванышев, Абдылдаев, Куватбек,
-- Маликов, Майназаров, Укубаев, Исабеков, Доолотов.

SELECT row_number() OVER (ORDER BY r.queue_at) AS место,
       p.name,
       r.queue_at,
       r.registered_at AS подал
  FROM public.tournament_registrations r
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = '1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'
   AND r.status = 'waitlist'
 ORDER BY r.queue_at;


-- ---- ПРОВЕРКА 2: четыре оценки -----------------------------------
-- Ждём: Нищук 3, Тулегенов 3, Аманбеков 3, Абдылдаев 2.5.

SELECT id, name, ntrp_singles
  FROM public.players
 WHERE id IN ('nikita-nischuk', 'temirlan-tulegenov',
              'artur-amanbekov', 'atabek-abdyldaev')
 ORDER BY name;


-- ---- ПРОВЕРКА 3: сетка не поехала --------------------------------
-- Ждём одну строку: approved 32, waitlist 14, у всех 14 waitlisted_at
-- заполнен, у 32 допущенных — пуст.

SELECT count(*) FILTER (WHERE status = 'approved')                              AS допущено,
       count(*) FILTER (WHERE status = 'waitlist')                              AS в_очереди,
       count(*) FILTER (WHERE status = 'waitlist' AND waitlisted_at IS NOT NULL) AS очередь_с_отметкой,
       count(*) FILTER (WHERE status = 'approved' AND waitlisted_at IS NOT NULL) AS лишняя_отметка
  FROM public.tournament_registrations
 WHERE tournament_id = '1ab0b15e-d8e4-4183-94b1-ba7ff59723f3';

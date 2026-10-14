-- ============================================================
-- Заявки на одиночный Futures, 14 октября
-- ============================================================
--
-- Турнир: 1ab0b15e-d8e4-4183-94b1-ba7ff59723f3
--   «Рейтинговый турнир КСЛТ в мужском одиночном разряде FUTURES»
--   men · futures · round_robin · 32 места · registration_open
-- Заявок в нём сейчас: 0 (померено чтением базы 14.10).
--
-- Из формы клуба 46 человек: 32 из основного списка (№1–32) и 14
-- из-под отметки «Лист ожидания:». В файле 47 строк — Асанкулов Тимур
-- записан дважды с одной отметкой времени, это одна заявка.
--
-- Имена сверены с 493 карточками базы: 38 нашлись, 8 заводим.
-- «Мамыров Адлет» привязан к карточке «Адилет Мамыров» (adlet-mamyrov)
-- по твоему слову — один и тот же человек.
--
-- Имя в новой карточке пишем ТАК ЖЕ, как клуб записал в форме, чтобы
-- адрес карточки (id) и имя не расходились: id делается из имени тем же
-- кодом, что у продукта (utils.js:234 slugify). Где клуб написал фамилию
-- вперёд — так и остаётся. «Исабеков Тскен» — написание клуба, не правлю.
--
-- Карточки НЕ гостевые (is_guest = false): идёт бесплатный период,
-- в рейтинг такие идут как все. Пол men и категория futures — из турнира.
--
-- NTRP ставим ТОЛЬКО там, где в базе пусто. «0» в файле означает
-- «не указано»: у Сыдыкова, Артыкбаева и Кылычбекова в базе уже стоит
-- своя оценка, её не трогаем.
--
-- РАЗНОЧТЕНИЯ, которые НЕ правим (в базе уже есть значение):
--   Никита Нищук        файл 3    / база 2.5
--   Темирлан Тулегенов  файл 3    / база 2.5
--   Артур Аманбеков     файл 3    / база 2.5
--   Атабек Абдылдаев    файл 2.5  / база 3
--
-- Отметки клуба про оплату и членство («нет оплаты за окт», «нет
-- членства в КСЛТ») не переносим: это учёт взносов, а не состояние
-- заявки. Кого не допускать — решает клуб кнопкой в админке.
--
-- Посев и группы не проставляем: сеются при жеребьёвке.
--
-- У «Бекжан Кылычбеков» отметки времени в файле НЕТ (пустая клетка).
-- Ему подаётся now() — время заливки; в очереди он встанет последним.
--
-- Порядок очереди база считает по queue_at = COALESCE(waitlisted_at,
-- registered_at). waitlisted_at не заполняем, поэтому очередь выйдет
-- ПО ВРЕМЕНИ ПОДАЧИ, а не по порядку строк в файле — а в файле они
-- идут не по времени. Если нужен порядок файла — скажи, допишу.
--
-- Запускать можно повторно: карточки не задваиваются (ON CONFLICT),
-- заявки не задваиваются (WHERE NOT EXISTS). Ничего не удаляется.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и
-- нажми Ctrl+Enter. Ответ последнего запроса и есть проверка.

BEGIN;

-- ---- 1. Восемь новых карточек ------------------------------------
-- Тип каждой колонки назван явно, а не угадывается из первой строки.

INSERT INTO public.players (id, name, gender, country, category_id,
                            is_member, is_guest, has_account, ntrp_singles)
SELECT д.id, д.name, д.gender, д.country, д.category_id,
       д.is_member, д.is_guest, д.has_account, д.ntrp_singles
  FROM (VALUES
         ('kanybek-uulu-belek'::text, 'Каныбек уулу Белек'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, NULL::numeric(3,2)),
         ('asankulov-timur'::text, 'Асанкулов Тимур'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, 2.50::numeric(3,2)),
         ('pogorelov-roman'::text, 'Погорелов Роман'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, NULL::numeric(3,2)),
         ('ilgiz-kuvatbek'::text, 'Илгиз Куватбек'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, 2.50::numeric(3,2)),
         ('ulukbek-malikov'::text, 'Улукбек Маликов'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, 2.50::numeric(3,2)),
         ('majnazarov-nursultan'::text, 'Майназаров Нурсултан'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, 2.50::numeric(3,2)),
         ('bekbolot-ukubaev'::text, 'Бекболот Укубаев'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, 2.50::numeric(3,2)),
         ('isabekov-tsken'::text, 'Исабеков Тскен'::text, 'men'::varchar(10), '🇰🇬'::text, 'futures'::text, false::boolean, false::boolean, false::boolean, 2.50::numeric(3,2))
       ) AS д (id, name, gender, country, category_id,
               is_member, is_guest, has_account, ntrp_singles)
ON CONFLICT (id) DO NOTHING;

-- ---- 2. NTRP тем, у кого в базе пусто ----------------------------
-- Условие ntrp_singles IS NULL — чтобы повторный прогон не перебил
-- оценку, если клуб её к тому времени поставит руками.

UPDATE public.players p
   SET ntrp_singles = д.ntrp_singles,
       updated_at   = now()
  FROM (VALUES
         ('ruslan-yunusov'::text, 3.00::numeric(3,2)),   -- Руслан Юнусов
         ('alihan-kuvanyshev'::text, 2.50::numeric(3,2)),   -- Алихан Куванышев
         ('sultan-doolotov'::text, 3.00::numeric(3,2))   -- Султан Доолотов
       ) AS д (id, ntrp_singles)
 WHERE p.id = д.id
   AND p.ntrp_singles IS NULL;

-- ---- 3. Сорок шесть заявок ---------------------------------------
-- Время подачи — «Отметка времени» из формы, как пришло.

INSERT INTO public.tournament_registrations
       (tournament_id, player_id, status, registered_at)
SELECT д.tournament_id, д.player_id, д.status, д.registered_at
  FROM (VALUES
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'ulan-tagaybek-uulu'::text, 'approved'::text, '2026-10-13 15:02:29.159'::timestamptz),        -- №1  Тагайбек уулу Улан
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'batyr-mavlyanov'::text, 'approved'::text, '2026-10-13 15:02:29.369'::timestamptz),        -- №2  Мавлянов Батыр
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'bahram-mambetov'::text, 'approved'::text, '2026-10-13 15:02:39.045'::timestamptz),        -- №3  Бахрам Мамбетов
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'kanybek-uulu-belek'::text, 'approved'::text, '2026-10-13 15:02:40.102'::timestamptz),        -- №4  Каныбек уулу Белек
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'amir-kanaev'::text, 'approved'::text, '2026-10-13 15:02:43.294'::timestamptz),        -- №5  Канаев Амир
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'nurtazin-dzhetybaev'::text, 'approved'::text, '2026-10-13 15:02:50.254'::timestamptz),        -- №6  Джетыбаев Нуртазин
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'saliev-aziz'::text, 'approved'::text, '2026-10-13 15:02:53.800'::timestamptz),        -- №7  Азиз Салиев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'salman-beyshenaliev'::text, 'approved'::text, '2026-10-13 15:03:05.216'::timestamptz),        -- №8  Салман Бейшеналиев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'rustam-ushur'::text, 'approved'::text, '2026-10-13 15:03:41.440'::timestamptz),        -- №9  Ушур Рустам
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'beksultan-rustamov'::text, 'approved'::text, '2026-10-13 15:04:41.825'::timestamptz),        -- №10 Бексултан Рустамов
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'ulan-nurbekov'::text, 'approved'::text, '2026-10-13 15:05:01.341'::timestamptz),        -- №11 Улан Нурбеков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'sultan-ibragimov'::text, 'approved'::text, '2026-10-13 15:05:03.312'::timestamptz),        -- №12 Ибрагимов Султан
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'daniyar-bakchiev'::text, 'approved'::text, '2026-10-13 15:05:09.269'::timestamptz),        -- №13 Данияр Бакчиев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'ahmedzhan-adzhuev'::text, 'approved'::text, '2026-10-13 15:05:11.259'::timestamptz),        -- №14 Аджуев Ахмеджан
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'dmitriy-pak'::text, 'approved'::text, '2026-10-13 15:05:30.171'::timestamptz),        -- №15 Дмитрий Пак
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'musa-zhanybekov'::text, 'approved'::text, '2026-10-13 15:05:30.591'::timestamptz),        -- №16 Муса Жаныбеков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'timur-uzagaliev'::text, 'approved'::text, '2026-10-13 15:05:57.232'::timestamptz),        -- №17 Тимур Узагалиев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'nursultan-ulukbekov'::text, 'approved'::text, '2026-10-13 15:06:04.471'::timestamptz),        -- №18 Нурсултан Улукбеков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'bolot-duyshenbekov'::text, 'approved'::text, '2026-10-13 15:07:22.586'::timestamptz),        -- №19 Дуйшенбеков Болот
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'damirbek-kydykov'::text, 'approved'::text, '2026-10-13 15:12:24.186'::timestamptz),        -- №20 Дамирбек Кыдыков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'adilet-asanov'::text, 'approved'::text, '2026-10-13 15:12:32.066'::timestamptz),        -- №21 Асанов Адилет
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'adlet-mamyrov'::text, 'approved'::text, '2026-10-13 15:13:45.376'::timestamptz),        -- №22 Мамыров Адлет
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'roman-valyaev'::text, 'approved'::text, '2026-10-13 15:15:26.763'::timestamptz),        -- №23 Валяев Роман
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'timur-baygubatov'::text, 'approved'::text, '2026-10-13 15:16:38.507'::timestamptz),        -- №24 Байгубатов Тимур
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'ruslan-yunusov'::text, 'approved'::text, '2026-10-13 15:21:06.060'::timestamptz),        -- №25 Юнусов Руслан
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'nikita-nischuk'::text, 'approved'::text, '2026-10-13 15:23:07.646'::timestamptz),        -- №26 Никита Нищук
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'temirlan-tulegenov'::text, 'approved'::text, '2026-10-13 15:23:13.177'::timestamptz),        -- №27 Темирлан Тулегенов
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'aydin-daniyarov'::text, 'approved'::text, '2026-10-13 15:25:28.527'::timestamptz),        -- №28 Данияров Айдин
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'artur-amanbekov'::text, 'approved'::text, '2026-10-13 15:33:15.044'::timestamptz),        -- №29 Артур Аманбеков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'bakyt-kapakov'::text, 'approved'::text, '2026-10-13 16:47:51.090'::timestamptz),        -- №30 Бакыт Капаков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'allayar-nasyrov'::text, 'approved'::text, '2026-10-13 17:29:55.910'::timestamptz),        -- №31 Насыров Аллаяр
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'azatbek-musaev'::text, 'approved'::text, '2026-10-13 17:48:33.407'::timestamptz),        -- №32 Мусаев Азатбек
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'omuradil-sydykov'::text, 'waitlist'::text, '2026-10-13 17:36:53.279'::timestamptz),        -- ож  Сыдыков Омурадил
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'sardar-artykbaev'::text, 'waitlist'::text, '2026-10-13 21:05:28.710'::timestamptz),        -- ож  Сардар Артыкбаев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'bekzhan-kylychbekov'::text, 'waitlist'::text, now()::timestamptz),        -- ож  Бекжан Кылычбеков
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'asankulov-timur'::text, 'waitlist'::text, '2026-10-13 16:22:05.328'::timestamptz),        -- ож  Асанкулов Тимур
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'sejtek-irsaliev'::text, 'waitlist'::text, '2026-10-14 10:24:03.881'::timestamptz),        -- ож  Сейтек Ирсалиев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'pogorelov-roman'::text, 'waitlist'::text, '2026-10-13 16:01:28.451'::timestamptz),        -- ож  Погорелов Роман
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'alihan-kuvanyshev'::text, 'waitlist'::text, '2026-10-13 15:05:09.095'::timestamptz),        -- ож  Куванышев Алихан
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'atabek-abdyldaev'::text, 'waitlist'::text, '2026-10-13 15:14:04.684'::timestamptz),        -- ож  Атабек Абдылдаев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'ilgiz-kuvatbek'::text, 'waitlist'::text, '2026-10-13 15:26:17.745'::timestamptz),        -- ож  Илгиз Куватбек
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'ulukbek-malikov'::text, 'waitlist'::text, '2026-10-13 17:45:23.806'::timestamptz),        -- ож  Улукбек Маликов
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'majnazarov-nursultan'::text, 'waitlist'::text, '2026-10-13 17:54:45.841'::timestamptz),        -- ож  Майназаров Нурсултан
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'bekbolot-ukubaev'::text, 'waitlist'::text, '2026-10-13 21:25:11.634'::timestamptz),        -- ож  Бекболот Укубаев
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'isabekov-tsken'::text, 'waitlist'::text, '2026-10-13 23:21:57.347'::timestamptz),        -- ож  Исабеков Тскен
         ('1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'::text, 'sultan-doolotov'::text, 'waitlist'::text, '2026-10-14 01:06:07.068'::timestamptz)        -- ож  Султан Доолотов
       ) AS д (tournament_id, player_id, status, registered_at)
 WHERE NOT EXISTS (
       SELECT 1 FROM public.tournament_registrations r
        WHERE r.tournament_id = д.tournament_id
          AND r.player_id     = д.player_id)
   AND EXISTS (
       SELECT 1 FROM public.players p WHERE p.id = д.player_id);

COMMIT;


-- ---- ПРОВЕРКА 1: сколько заявок и кто гость ----------------------
-- Ждём: approved 32, waitlist 14, гостей 6 (старые карточки клуба).

SELECT r.status                           AS состояние,
       count(*)                           AS заявок,
       count(*) FILTER (WHERE p.is_guest) AS гостей,
       count(*) FILTER (WHERE p.ntrp_singles IS NULL) AS без_ntrp
  FROM public.tournament_registrations r
  LEFT JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = '1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'
 GROUP BY 1
 ORDER BY 1;


-- ---- ПРОВЕРКА 2: восемь новых карточек на месте ------------------
-- Ждём 8 строк.

SELECT id, name, gender, category_id, ntrp_singles, is_guest, is_member
  FROM public.players
 WHERE id IN ('kanybek-uulu-belek', 'asankulov-timur', 'pogorelov-roman', 'ilgiz-kuvatbek', 'ulukbek-malikov', 'majnazarov-nursultan', 'bekbolot-ukubaev', 'isabekov-tsken')
 ORDER BY id;


-- ---- ПРОВЕРКА 3: у кого в турнире так и нет NTRP -----------------
-- Ждём 6: Мавлянов, Джетыбаев, Бакчиев, Ирсалиев — пусто и в файле;
-- Каныбек уулу Белек и Погорелов — новые, в файле тоже пусто.

SELECT p.id, p.name, r.status
  FROM public.tournament_registrations r
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = '1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'
   AND p.ntrp_singles IS NULL
 ORDER BY r.status, p.name;


-- ---- ПРОВЕРКА 4: очередь листа ожидания в том порядке, --------
-- в каком её покажет админка.

SELECT row_number() OVER (ORDER BY r.queue_at) AS место,
       p.name, r.queue_at
  FROM public.tournament_registrations r
  JOIN public.players p ON p.id = r.player_id
 WHERE r.tournament_id = '1ab0b15e-d8e4-4183-94b1-ba7ff59723f3'
   AND r.status = 'waitlist'
 ORDER BY r.queue_at;

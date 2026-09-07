-- ============================================================
-- Карточки игроков из турнирных сеток ТБШ
-- ============================================================
--
-- В таблице ТБШ за 2026 год играли 219 человек. Карточки в базе нашлись у
-- 149 — остальные играли, но в рейтинге их нет вовсе. Без карточек сетки
-- перенести нельзя: матч не к кому привязать.
--
-- Заводим недостающих. Карточка пустая: имя, пол и опознаватель латиницей,
-- как у прочих. Ни NTRP, ни категории, ни очков — это заполнит менеджер,
-- когда дойдут руки. Пустая карточка лучше отсутствующей: человек уже
-- играл, и след его игр должен где-то жить.
--
-- Пол определён по тому, в мужской или женской сетке человек играл.
--
-- Запускать можно сколько угодно: повторный запуск ничего не добавит.
--
-- Файл меняет базу. Читающие запросы — в players-from-brackets-check.sql.

BEGIN;

-- ---- Описки в написании ----
-- В базе имя записано с ошибкой, в таблице ТБШ — верно. Правим по таблице,
-- как решил Costa. Остальные «похожие» пары трогать нельзя: там разные
-- люди (Айдар Орозбаев и Айдай Орозбаева, Дмитрий Раков и Дмитрий Пак,
-- Бакыт Капаков и Бакыт Кайыпов, Азатбек Мусаев и Азат Мусаев).

UPDATE players SET name = 'Закир Гудажанов'  WHERE name = 'Закир Гудаджанов';
UPDATE players SET name = 'Лиля Рахматулина' WHERE name = 'Лилия Рахматулина';
UPDATE players SET name = 'Мурат Алайчиев'   WHERE name = 'Мурат Алайчыев';
UPDATE players SET name = 'Мурат Норзубаев'  WHERE name = 'Мурат Норузбаев';
UPDATE players SET name = 'Чынгыз Исматов'   WHERE name = 'Сынгыз Исматов';

-- ---- Недостающие карточки ----

INSERT INTO players (id, name, gender) VALUES
    ('adilet-kanatbekov', 'Адилет Канатбеков', 'men'),
    ('adlet-mamyrov', 'Адлет Мамыров', 'men'),
    ('azat-kubanychbek-uulu', 'Азат Кубанычбек уулу', 'men'),
    ('azatbek-musaev', 'Азатбек Мусаев', 'men'),
    ('ayday-akmatalieva', 'Айдай Акматалиева', 'women'),
    ('aydar-orozbaev', 'Айдар Орозбаев', 'men'),
    ('aydin-daniyarov', 'Айдин Данияров', 'men'),
    ('ayzat-torobekova', 'Айзат Торобекова', 'women'),
    ('alier-mahmuthodzhaev', 'Алиёр Махмутходжаев', 'men'),
    ('altynbek-zhanybekov', 'Алтынбек Жаныбеков', 'men'),
    ('altynbek-zhoogachiev', 'Алтынбек Жоогачиев', 'men'),
    ('anayat-abithanova', 'Анаят Абитханова', 'women'),
    ('atay-isaev', 'Атай Исаев', 'men'),
    ('baatyr-akimaliev', 'Баатыр Акималиев', 'men'),
    ('baatyr-bakytbek', 'Баатыр Бакытбек', 'men'),
    ('bakyt-kapakov', 'Бакыт Капаков', 'men'),
    ('bek-kydyrgychov', 'Бек Кыдыргычов', 'men'),
    ('bekmamat-nurmamat-uulu', 'Бекмамат Нурмамат уулу', 'men'),
    ('beksultan-rustamov', 'Бексултан Рустамов', 'men'),
    ('viktoriya-han', 'Виктория Хан', 'women'),
    ('vladimir-antonenko', 'Владимир Антоненко', 'men'),
    ('dana-kurmanalieva', 'Дана Курманалиева', 'women'),
    ('daniyar-dzhaylokeev', 'Данияр Джайлокеев', 'men'),
    ('dmitriy-rakov', 'Дмитрий Раков', 'men'),
    ('evgeniy-osipov', 'Евгений Осипов', 'men'),
    ('ekaterina-saveleva', 'Екатерина Савельева', 'women'),
    ('zhakshylyk-aytbaev', 'Жакшылык Айтбаев', 'men'),
    ('igor-hanganu', 'Игорь Хангану', 'men'),
    ('ilyas-kydyraliev', 'Ильяс Кыдыралиев', 'men'),
    ('kamil-murakov', 'Камиль Мураков', 'men'),
    ('kanykey-tursunbaeva', 'Каныкей Турсунбаева', 'women'),
    ('kanyshay-badretdinova', 'Канышай Бадретдинова', 'women'),
    ('karim-imanhodzhaev', 'Карим Иманходжаев', 'men'),
    ('mirbek-dyushenaliev', 'Мирбек Дюшеналиев', 'men'),
    ('mirdias-tumenbaev', 'Мирдиас Туменбаев', 'men'),
    ('musa-zhanybekov', 'Муса Жаныбеков', 'men'),
    ('nailya-osmonova', 'Наиля Осмонова', 'women'),
    ('nursultan-zhunusov', 'Нурсултан Жунусов', 'men'),
    ('nursultan-ulukbekov', 'Нурсултан Улукбеков', 'men'),
    ('omurbek-zholdoshev', 'Омурбек Жолдошев', 'men'),
    ('ravil-sayfutdinov', 'Равиль Сайфутдинов', 'men'),
    ('ramina-ushur', 'Рамина Ушур', 'women'),
    ('roman-valyaev', 'Роман Валяев', 'men'),
    ('ruslan-andreev', 'Руслан Андреев', 'men'),
    ('ruslan-kalimov', 'Руслан Калимов', 'men'),
    ('sabyrbek-esenbekov', 'Сабырбек Эсенбеков', 'men'),
    ('saykal-niyazova', 'Сайкал Ниязова', 'women'),
    ('salih-ismailov', 'Салих Исмаилов', 'men'),
    ('salman-beyshenaliev', 'Салман Бейшеналиев', 'men'),
    ('sonya-orokova', 'Соня Орокова', 'women'),
    ('suvar-ayylchiev', 'Сувар Айылчиев', 'men'),
    ('sultan-ayylchiev', 'Султан Айылчиев', 'men'),
    ('tahmina-gaparova', 'Тахмина Гапарова', 'women'),
    ('tengiz-atahanov', 'Тенгиз Атаханов', 'men'),
    ('timofey-kim', 'Тимофей Ким', 'men'),
    ('tolgonay-aytkulova', 'Толгонай Айткулова', 'women'),
    ('ulan-tagaybek-uulu', 'Улан Тагайбек уулу', 'men'),
    ('yrysgul-sakebaeva', 'Ырысгуль Сакебаева', 'women'),
    ('erbol-abdyakimov', 'Эрбол Абдыакимов', 'men'),
    ('eren-kamchibekov', 'Эрен Камчибеков', 'men'),
    ('erkaim-shambetova', 'Эркаим Шамбетова', 'women'),
    ('erkin-kerimbaev', 'Эркин Керимбаев', 'men'),
    ('ernest-avtandil', 'Эрнэст Автандил', 'men'),
    ('yura-yun', 'Юра Юн', 'men'),
    ('yakov-yudin', 'Яков Юдин', 'men')
ON CONFLICT (id) DO NOTHING;

COMMIT;

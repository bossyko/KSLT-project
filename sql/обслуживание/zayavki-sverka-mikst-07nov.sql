-- ОДИН ЗАПРОС. ТОЛЬКО ЧИТАЕТ. Отдай мне вывод целиком.
--
-- МИКСТ 07.11 из формы: 38 заявок, 69 имён — два турнира и два листа
-- ожидания. Список в файле ОДИН, делит его колонка «КАТЕГОРИЯ».
--   FUTURES → abeac952-0736-42d5-8203-51c524b5a715   17 пар + 5 ожидание
--   MASTERS → 064c6018-a3cd-4abb-95e8-ed818274c86a   12 пар + 4 ожидание
--
-- ЗАМЕР ПОРЯДКА, А НЕ ПРЕДПОЛОЖЕНИЕ: в основе обоих турниров время
-- растёт по строкам, а в ЛИСТАХ ОЖИДАНИЯ спорит — у masters-wait оно
-- идёт 06.11, 03.11, 04.11, 05.11. Значит очередь ожидания встанет не
-- сама, и `waitlisted_at` понадобится (как 04.11 на challengers-6).
--
-- СЕМЬ МЕСТ В ФОРМЕ ПУСТЫЕ и в сверку не идут: «Пока не нашел», «Нету»,
-- «-» (трижды), «Ищу напарницу», «определяется» (дважды). Выдумывать
-- напарника нельзя — заявка заливается с пустым местом.
--
-- Ключ имени не зависит от порядка слов. Не сошёлся ключ — показываются
-- кандидаты С ЧИСЛОМ совпавших слов, и отдельной колонкой — совпадение
-- БЕЗ ГЛАСНЫХ: опечатка в гласной перестаёт быть различием.
-- ПОХОЖЕСТЬ — ЭТО ВОПРОС, А НЕ ОТВЕТ: ни одну пару я не свожу сам.

WITH форма(блок,ном,кат,роль,фио) AS (VALUES
  ('futures',1,'futures','1','Бондарь Даниил'),
  ('futures',1,'futures','2','Лейпи Мария'),
  ('futures',2,'futures','1','Байгубатов Тимур'),
  ('futures',2,'futures','2','Байгубатова Зарима'),
  ('futures',3,'futures','1','Канатбеков Адилет'),
  ('futures',3,'futures','2','Касымбекова Ариана'),
  ('futures',4,'futures','1','Гильфанов Руслан'),
  ('futures',4,'futures','2','Сайкал Ниязова'),
  ('futures',5,'futures','1','Ибрагим Кошойбеков'),
  ('futures',5,'futures','2','Асель Орокова'),
  ('futures',6,'futures','1','Михманов Шавкат'),
  ('futures',6,'futures','2','Адель Джайлоева'),
  ('futures',7,'futures','1','Курманалиева Дана'),
  ('futures',7,'futures','2','Игорь Хан'),
  ('futures',8,'futures','1','Кани Бадретдинова'),
  ('futures',8,'futures','2','Эсен Азимов'),
  ('futures',9,'futures','1','Чингис Чукин'),
  ('futures',9,'futures','2','Каныкей Турсунбаева'),
  ('futures',10,'futures','1','Элзар Ажибаев'),
  ('futures',10,'futures','2','Асель Ашимова'),
  ('futures',11,'futures','1','Эсендияр Адылов'),
  ('futures',11,'futures','2','Айсулуу Ленарова'),
  ('futures',12,'futures','1','Салман Бейшеналиев'),
  ('futures',12,'futures','2','Яна Белекова'),
  ('futures',13,'futures','1','Темирбек Мусаев'),
  ('futures',13,'futures','2','Азиза Мусаева'),
  ('futures',14,'futures','1','Табалдыев Раимбек'),
  ('futures',14,'futures','2','Казыбаева Айнель'),
  ('futures',15,'futures','1','Barno Tursunova'),
  ('futures',15,'futures','2','Allayar Nasirov'),
  ('futures',16,'futures','1','Закир Назаров'),
  ('futures',16,'futures','2','Жакыпова Алина'),
  ('futures',17,'futures','1','Ирсалиев Сейтек'),
  ('futures',17,'futures','2','Айдай Орозбаева'),
  ('futures-wait',1,'futures','1','K.u.Azat'),
  ('futures-wait',2,'futures','1','Атыканов Камиль'),
  ('futures-wait',3,'futures','1','Цой леонид'),
  ('futures-wait',4,'futures','2','Азат Базаркулов'),
  ('futures-wait',5,'futures','1','Бакыт Капаков'),
  ('masters',1,'masters','1','Беляева Арина'),
  ('masters',1,'masters','2','Владимир Антоненко'),
  ('masters',2,'masters','1','Максим Серко'),
  ('masters',2,'masters','2','Арсен Умурзаков'),
  ('masters',3,'masters','1','Азим Исаков'),
  ('masters',3,'masters','2','Азиз Базаков'),
  ('masters',4,'masters','1','Фуркат Садыков'),
  ('masters',4,'masters','2','Сардар Умаров'),
  ('masters',5,'masters','1','Джантай Оторбаев'),
  ('masters',5,'masters','2','Кирилл Кистанов'),
  ('masters',6,'masters','1','Лоянов Ридван'),
  ('masters',6,'masters','2','Ушур Рустам'),
  ('masters',7,'masters','1','Мурат Норузбаев'),
  ('masters',7,'masters','2','Иван Притула'),
  ('masters',8,'masters','1','Атхам Исраилов'),
  ('masters',8,'masters','2','Азамат Джумабаев'),
  ('masters',9,'masters','1','Анастасия Трофимушкина'),
  ('masters',9,'masters','2','Малик Камалов'),
  ('masters',10,'masters','1','Искендер Сейдиматов'),
  ('masters',10,'masters','2','Миргияз Мирджалиев'),
  ('masters',11,'masters','1','Руслан Кульджаев'),
  ('masters',11,'masters','2','Эльдар Кульджаев'),
  ('masters',12,'masters','1','Эрлан Шекербеков'),
  ('masters-wait',1,'masters','1','Сыдыков Эрлан'),
  ('masters-wait',1,'masters','2','Казакбаев Калыс'),
  ('masters-wait',2,'masters','1','Сардар Товкеев'),
  ('masters-wait',2,'masters','2','Мураталиев Ильдияр'),
  ('masters-wait',3,'masters','1','Тенгиз'),
  ('masters-wait',3,'masters','2','Руфат'),
  ('masters-wait',4,'masters','1','Руслан Андреев')
), к AS (
  SELECT ф.*, (SELECT string_agg(w,' ' ORDER BY w) FROM unnest(string_to_array(
           regexp_replace(lower(translate(фио,'ёЁ','ее')),'[^[:alnum:]]+',' ','g'),' ')) t(w)
         WHERE w<>'') AS ключ,
         (SELECT string_agg(w,' ' ORDER BY w) FROM unnest(string_to_array(
           regexp_replace(lower(translate(фио,'ёЁ','ее')),'[аеиоуыэюяьъ]','','g'),' ')) t(w)
         WHERE length(w)>=3) AS скелет
    FROM форма ф
), и AS (
  SELECT p.id, p.name, p.gender, (SELECT string_agg(w,' ' ORDER BY w) FROM unnest(string_to_array(
           regexp_replace(lower(translate(p.name,'ёЁ','ее')),'[^[:alnum:]]+',' ','g'),' ')) t(w)
         WHERE w<>'') AS ключ,
         (SELECT string_agg(w,' ' ORDER BY w) FROM unnest(string_to_array(
           regexp_replace(lower(translate(p.name,'ёЁ','ее')),'[аеиоуыэюяьъ]','','g'),' ')) t(w)
         WHERE length(w)>=3) AS скелет
    FROM players p
)
SELECT к.блок, к.ном, к.роль, к.фио,
       т.id AS карточка, т.gender AS пол,
       (SELECT string_agg(x.id||' = '||x.name||' ['||x.сошлось||']', ' · ' ORDER BY x.сошлось DESC, x.name)
          FROM (SELECT и.id, и.name,
                       (SELECT count(*) FROM unnest(string_to_array(к.ключ,' ')) a(w)
                          JOIN unnest(string_to_array(и.ключ,' ')) b(w) ON b.w=a.w
                         WHERE length(a.w)>=4) AS сошлось
                  FROM и) x
         WHERE т.id IS NULL AND x.сошлось>0) AS кандидаты,
       (SELECT string_agg(с.id||' = '||с.name, ' · ' ORDER BY с.name)
          FROM и с WHERE т.id IS NULL AND с.скелет = к.скелет) AS тот_же_без_гласных
  FROM к LEFT JOIN и т ON т.ключ = к.ключ
 ORDER BY к.блок, к.ном, к.роль;

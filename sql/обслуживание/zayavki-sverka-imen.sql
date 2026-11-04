-- ОДИН ЗАПРОС. ТОЛЬКО ЧИТАЕТ. Отдай мне вывод целиком.
--
-- Женские пары из формы «7 ноября»: 16 пар, 32 имени — FUTURES 8 и
-- MASTERS 8. Список в файле ОДИН, турнира ДВА, и делит их колонка
-- «КАТЕГОРИЯ»: `блок` здесь и есть турнир.
--   FUTURES → eb6f50cd-4845-4943-b664-64c07e9dff81
--   MASTERS → 6c6a7913-6b55-4af4-af9b-f0419ba69363
--
-- Порядок пар внутри каждого турнира — по строкам файла; время в форме
-- растёт по строкам (проверено), значит порядок и время не спорят, и
-- `waitlisted_at` здесь не понадобится.
--
-- Ключ имени не зависит от порядка слов: «Цурбан Наташа» = «Наташа
-- Цурбан». Не сошёлся ключ — показываются кандидаты С ЧИСЛОМ совпавших
-- слов: два слова — скорее тот же человек, одно — скорее шум.
-- ПОХОЖЕСТЬ — ЭТО ВОПРОС, А НЕ ОТВЕТ: ни одну пару я не свожу сам.

WITH форма(блок,ном,кат,роль,фио) AS (VALUES
  ('futures',1,'futures','1','Каныкей'),
  ('futures',1,'futures','2','Зухра'),
  ('futures',2,'futures','1','Цурбан Наташа'),
  ('futures',2,'futures','2','Тайгуронова Калича'),
  ('masters',1,'masters','1','Адель Джайлоева'),
  ('masters',1,'masters','2','Анастасия Аджибекова'),
  ('futures',3,'futures','1','Ленарова Айсулуу'),
  ('futures',3,'futures','2','Аида Ногойбаева'),
  ('futures',4,'futures','1','Байгубатова Зарима'),
  ('futures',4,'futures','2','Ашимова Асель'),
  ('futures',5,'futures','1','Толгонай Айткулова'),
  ('futures',5,'futures','2','Асель Орокова'),
  ('masters',2,'masters','1','Калима Аскарова'),
  ('masters',2,'masters','2','Азиза Мусаева'),
  ('masters',3,'masters','1','Кани Бадретдинова'),
  ('masters',3,'masters','2','Лейла Ильясова'),
  ('futures',6,'futures','1','Нуржамал Джанибекова'),
  ('futures',6,'futures','2','Sweta Pokharel'),
  ('masters',4,'masters','1','Болотбекова Каракоз'),
  ('masters',4,'masters','2','Эркеайым Исаматова'),
  ('masters',5,'masters','1','Лейли Благовистная'),
  ('masters',5,'masters','2','Татьяна Андреевская'),
  ('masters',6,'masters','1','Барно Турсунова'),
  ('masters',6,'masters','2','определяется'),
  ('futures',7,'futures','1','Фасахутдинова Алина'),
  ('futures',7,'futures','2','Момунова Нуриза'),
  ('masters',7,'masters','1','Трофимушкина Анастасия'),
  ('masters',7,'masters','2','Орозалиева Гульмира'),
  ('masters',8,'masters','1','Султаналиева Азиза'),
  ('masters',8,'masters','2','Ильясова Лейсан'),
  ('futures',8,'futures','1','Роза Бердиева'),
  ('futures',8,'futures','2','Уланбекова Биназир Уланбековна')
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
         /* СКЕЛЕТ — ИМЯ БЕЗ ГЛАСНЫХ. Добавлен 04.11 после двух дублей за
            один день: «Эркеайым Исаматова» из формы и «Эркайым Исматова»
            из базы не совпали НИ ОДНИМ словом, кандидатов прибор не
            показал, и я завёл вторую карточку при живой с 360 очками.
            КЛЮЧ НЕ ЛОВИТ ОПЕЧАТОК — записано ещё 30.09, где их ловила
            похожесть; здесь её не было. Скелет её заменяет: гласные
            выброшены, и опечатка в гласной перестаёт быть различием. */
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
       /* ОПЕЧАТКА В ГЛАСНОЙ — ОТДЕЛЬНОЙ КОЛОНКОЙ, а не в общей куче:
          совпавший скелет при несовпавшем ключе почти всегда значит
          «тот же человек, написан иначе». Пусто здесь — настоящая
          новая карточка. */
       (SELECT string_agg(с.id||' = '||с.name, ' · ' ORDER BY с.name)
          FROM и с WHERE т.id IS NULL AND с.скелет = к.скелет) AS тот_же_без_гласных
  FROM к LEFT JOIN и т ON т.ключ = к.ключ
 ORDER BY к.блок, к.ном, к.роль;

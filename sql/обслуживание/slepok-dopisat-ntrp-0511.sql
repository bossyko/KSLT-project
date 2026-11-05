-- ДОПИСАТЬ NTRP В УЖЕ СНЯТЫЙ СЛЕПОК. 05.11
--
-- Слово Кости 05.11: «давай, чтобы сброс тоже возвращал» — про NTRP.
--
-- ГНАТЬ ДО ТОГО, КАК ПРОСТАВИШЬ NTRP. Этот запрос запоминает ТЕКУЩИЕ
-- значения, то есть пустые. Прогонишь после простановки — слепок
-- запомнит уже новые, и сброс вернёт их же, то есть не вернёт ничего.
--
-- ПОЧЕМУ ОТДЕЛЬНЫМ ФАЙЛОМ, А НЕ ПРАВКОЙ СЛЕПКА. Слепок уже снят, и
-- таблицы в нём созданы через `CREATE TABLE IF NOT EXISTS`: повторный
-- прогон того файла НИЧЕГО БЫ НЕ ИЗМЕНИЛ — он увидел бы таблицу и
-- прошёл мимо. Поэтому колонка добавляется к существующей таблице.
--
-- Берутся ОБА рейтинга — и парный, и одиночный. Турнир парный, но
-- возвращать половину поля значит возвращаться сюда ещё раз.
--
--   sql/обслуживание/slepok-dopisat-ntrp-0511.sql


-- ── 1. ДОБАВИТЬ КОЛОНКИ И ЗАПОМНИТЬ ТЕКУЩЕЕ ──────────────────────────
ALTER TABLE public.slepok6c_igroki
  ADD COLUMN IF NOT EXISTS ntrp_doubles numeric(3,2),
  ADD COLUMN IF NOT EXISTS ntrp_singles numeric(3,2);

UPDATE public.slepok6c_igroki s
   SET ntrp_doubles = p.ntrp_doubles,
       ntrp_singles = p.ntrp_singles
  FROM public.players p
 WHERE p.id = s.id;


-- ── 2. ПРОВЕРКА ЧТЕНИЕМ: СКОЛЬКО БЫЛО ПУСТЫХ ─────────────────────────
-- Ждём: `igrokov` = 38. `bez_parnogo` — сколько карточек сейчас БЕЗ
-- парного рейтинга; ровно столько и вернётся пустыми при сбросе.
SELECT count(*)                                              AS igrokov,
       count(*) FILTER (WHERE ntrp_doubles IS NULL)          AS bez_parnogo,
       count(*) FILTER (WHERE ntrp_singles IS NULL)          AS bez_odinochnogo
  FROM public.slepok6c_igroki;

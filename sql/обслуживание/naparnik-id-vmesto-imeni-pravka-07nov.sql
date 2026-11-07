-- ПРАВКА. МЕНЯЕТ БАЗУ. Гнать ПОСЛЕ чтения.
--
-- Снятый напарник освобождает место полностью — слово Кости 07.11:
-- «ставим напарник определяется». Пустое место показывается как
-- «напарник определяется» с кнопкой добора, и менеджер видит, что пару
-- надо искать заново. Прежде там стоял идентификатор карточки с меткой
-- EXT, и пара выглядела целой.
--
-- Трогаются ТОЛЬКО строки, где во «внешнем» напарнике лежит адрес
-- существующей карточки, — то есть ровно след этой беды. Настоящие
-- внешние напарники с человеческими именами не затрагиваются.

-- ---- 1. Слепок для отката ----
DROP TABLE IF EXISTS public.slepok_naparnik_id_07nov;

CREATE TABLE public.slepok_naparnik_id_07nov AS
SELECT r.*
  FROM public.tournament_registrations r
  JOIN public.players pp ON pp.id = r.partner_external_name;

-- ---- 2. Освободить место напарника ----
UPDATE public.tournament_registrations r
   SET partner_external_name  = NULL,
       partner_external_ntrp  = NULL,
       partner_gender         = NULL,
       guest_confirmed        = false
  FROM public.players pp
 WHERE pp.id = r.partner_external_name;

-- ---- 3. Проверка чтением базы ----
-- Ждём 0 строк: следов не осталось.
SELECT count(*) AS ostalos_sledov
  FROM public.tournament_registrations r
  JOIN public.players pp ON pp.id = r.partner_external_name;

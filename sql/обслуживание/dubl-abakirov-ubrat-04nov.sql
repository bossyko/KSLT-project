-- УБРАТЬ ДУБЛЬ «ЭРМЕК АБАКИРОВ». 04.11
--
-- МОЯ ОШИБКА, И ОНА ХУЖЕ ПЕРВОЙ. Утром при заливке Challengers 6 я
-- переименовал `abakirov-ermek-kurmanbekovich` («Абакиров Эрмек
-- Курманбекович») в «Эрмек Абакиров» — по слову Кости «отчество убираем».
-- А в базе УЖЕ БЫЛ `ermek-abakirov` с 610 очками.
--
-- ДО моей правки их звали по-разному, и отличить было можно. ПОСЛЕ — два
-- человека с одинаковым именем, и в заявке Challengers 6 стоит пустой, с
-- нулём очков. ПЕРЕИМЕНОВАНИЕ, КОТОРОЕ ДЕЛАЕТ ДВА ИМЕНИ ОДИНАКОВЫМИ, —
-- НЕ ПРАВКА НАПИСАНИЯ, А СОЗДАНИЕ ДУБЛЯ, и проверять это надо ДО правки,
-- а не после.
--
-- Расширенный сторож имён (`storozh-imena-tri-slova-04nov.sql`) этого не
-- поймал и поймать не мог: он ищет фамилию впереди имени, а не двойников.
--
-- Слово Кости 04.11: сливаем на `ermek-abakirov`.
--
-- УДАЛЕНИЕ НЕОБРАТИМО. Порядок: сперва заявки переставляются на живую
-- карточку, потом пустая удаляется. Всё в одной сделке — если на пустую
-- ссылается что-то ещё (матч, строка истории, учётная запись), внешний
-- ключ ОТМЕНИТ ВСЮ СДЕЛКУ, и ничего испорченного не останется. Тогда
-- присылай ошибку: будем переносить и это, а не ломать связи.

BEGIN;

UPDATE public.tournament_registrations
   SET player_id = 'ermek-abakirov'
 WHERE player_id = 'abakirov-ermek-kurmanbekovich';

UPDATE public.tournament_registrations
   SET partner_id = 'ermek-abakirov'
 WHERE partner_id = 'abakirov-ermek-kurmanbekovich';

DELETE FROM public.players
 WHERE id = 'abakirov-ermek-kurmanbekovich'
   AND points = 0;

COMMIT;


-- ---- ПРОВЕРКА. ОДИН ЗАПРОС, ОДНА ТАБЛИЦА ------------------------
-- Ждём: pustoy_net = 0, zhivaya = 1, ochki = 610,
-- v_challengers = 1, tyozok_po_imeni = 1 (сам он и остался).

SELECT (SELECT count(*) FROM public.players
         WHERE id = 'abakirov-ermek-kurmanbekovich')                 AS pustoy_net,
       (SELECT count(*) FROM public.players
         WHERE id = 'ermek-abakirov')                                AS zhivaya,
       (SELECT points FROM public.players
         WHERE id = 'ermek-abakirov')                                AS ochki,
       (SELECT count(*) FROM public.tournament_registrations
         WHERE tournament_id = '382222ba-e396-4ece-9807-7358594d256c'
           AND player_id = 'ermek-abakirov')                         AS v_challengers,
       (SELECT count(*) FROM public.players
         WHERE lower(btrim(name)) = 'эрмек абакиров')                AS tyozok_po_imeni;

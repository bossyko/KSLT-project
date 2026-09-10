-- ============================================================
-- Максим Серко: карточка игрока
-- ============================================================
--
-- При переносе заявок из формы он был единственным, кого не нашлось среди
-- карточек, и пошёл в пару к Ибрагиму Кошойбекову приглашённым — строкой с
-- именем. Теперь заводим карточку и ставим её в заявку вместо строки: пара
-- получит настоящий рейтинг и суммарный NTRP.
--
-- NTRP: одиночный 6, парный 5.5 — цифры от Costa.
--
-- Разряд не ставлю: очков в клубных турнирах у него пока нет, а домашний
-- разряд у нас берётся по самому низкому разряду, где игрок набрал очки.
-- Появятся очки — разряд проставится вместе с ними.
--
-- Запускать можно повторно.

BEGIN;

-- Сначала убеждаемся, что карточки нет под другим написанием: заводить
-- двойника мы уже пробовали, ничего хорошего
DO $$
DECLARE
    похожие text;
BEGIN
    SELECT string_agg(id || ' — ' || name, ', ')
      INTO похожие
      FROM public.players
     WHERE id <> 'maksim-serko'
       AND (name ILIKE '%серко%' OR name ILIKE '%serko%');

    IF похожие IS NOT NULL THEN
        RAISE EXCEPTION 'Похожие карточки уже есть: %. Проверь, не он ли это', похожие;
    END IF;
END $$;

INSERT INTO public.players (id, name, gender, ntrp_singles, ntrp_doubles)
VALUES ('maksim-serko', 'Максим Серко', 'men', 6, 5.5)
ON CONFLICT (id) DO UPDATE
   SET name         = EXCLUDED.name,
       gender       = EXCLUDED.gender,
       ntrp_singles = EXCLUDED.ntrp_singles,
       ntrp_doubles = EXCLUDED.ntrp_doubles;

-- ---- Заявка: вместо имени строкой — карточка ----

UPDATE public.tournament_registrations
   SET partner_id            = 'maksim-serko',
       partner_external_name = NULL
 WHERE tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
   AND player_id = 'ibragim-koshoybekov'
   AND partner_external_name = 'Максим Серко';

COMMIT;

-- ---- Проверка ----

SELECT p.id, p.name, p.gender AS пол,
       p.ntrp_singles AS одиночный, p.ntrp_doubles AS парный,
       p.category_id AS разряд
  FROM public.players p
 WHERE p.id = 'maksim-serko';

SELECT r.player_id AS первый, r.partner_id AS второй,
       r.partner_external_name AS второй_строкой
  FROM public.tournament_registrations r
 WHERE r.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
   AND r.player_id = 'ibragim-koshoybekov';
-- Ожидаем: partner_id = maksim-serko, строка с именем пустая.

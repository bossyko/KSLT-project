-- ============================================================
-- Парный баттл показывает парный NTRP
-- ============================================================
--
-- На карточке баттла рядом с именем стоит NTRP. До сих пор там всегда был
-- одиночный — и в парном баттле, и в миксте тоже. Хотя играется как раз пара.
--
-- Правило то же, что в турнирах: парный баттл и микст считаются парным
-- рейтингом, а если он у человека не проставлен — одиночным, иначе NTRP
-- пропал бы с карточки вовсе. Одиночный баттл как был, так и остаётся на
-- одиночном.
--
-- Вторые половины пар бывают только в парном баттле, поэтому у них разбора
-- по формату нет: сразу парный, с тем же запасным одиночным.
--
-- Меняем только четыре строки функции, всё остальное её тело — как было.
-- Берём живое определение из базы и подставляем в него новые выражения:
-- так ничего не потеряется, даже если функцию правили после этого файла.
--
-- Запускать можно повторно.

DO $$
DECLARE
    код text;
BEGIN
    SELECT pg_get_functiondef(p.oid) INTO код
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'get_battle_public'
     LIMIT 1;

    IF код IS NULL THEN
        RAISE EXCEPTION 'Функция public.get_battle_public не найдена';
    END IF;

    -- Основные игроки: смотрим на формат вызова
    код := replace(код,
        'p1.ntrp_singles AS challenger_player_ntrp',
        'CASE WHEN c.format IN (''doubles'', ''mixed_doubles'')
                   THEN COALESCE(p1.ntrp_doubles, p1.ntrp_singles)
                   ELSE p1.ntrp_singles END AS challenger_player_ntrp');
    код := replace(код,
        'p2.ntrp_singles AS opponent_player_ntrp',
        'CASE WHEN c.format IN (''doubles'', ''mixed_doubles'')
                   THEN COALESCE(p2.ntrp_doubles, p2.ntrp_singles)
                   ELSE p2.ntrp_singles END AS opponent_player_ntrp');

    -- Напарники: они бывают только в паре
    код := replace(код,
        'm1.ntrp_singles AS challenger_partner_ntrp',
        'COALESCE(m1.ntrp_doubles, m1.ntrp_singles) AS challenger_partner_ntrp');
    код := replace(код,
        'm2.ntrp_singles AS opponent_partner_ntrp',
        'COALESCE(m2.ntrp_doubles, m2.ntrp_singles) AS opponent_partner_ntrp');

    IF код NOT LIKE '%ntrp_doubles%' THEN
        RAISE EXCEPTION 'В функции не нашлось строк с NTRP — менять нечего, посмотреть её тело руками';
    END IF;

    EXECUTE код;
    RAISE NOTICE 'get_battle_public переписана на парный рейтинг';
END $$;

-- ---- Проверка ----
-- В теле функции должны появиться четыре упоминания парного рейтинга.

SELECT (length(p.prosrc) - length(replace(p.prosrc, 'ntrp_doubles', ''))) / length('ntrp_doubles') AS упоминаний_парного
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'get_battle_public';
-- Ожидаем 4.

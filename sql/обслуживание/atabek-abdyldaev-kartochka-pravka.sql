-- ============================================================
-- Одиночный FUTURES: карточка гостю Атабеку Абдылдаеву — ПРАВКА
-- ============================================================
--
-- Участник группы D заведён внешним: в заявке стоит имя, а карточки игрока
-- нет. Матчи хранят игрока, поэтому в трёх встречах группы вторая сторона
-- пустая — счёт туда не вписать, и группа не доиграется.
--
-- Заводим карточку гостя и привязываем её к заявке, а потом подставляем
-- игрока в его встречи: они узнаются по заявке (reg1_id / reg2_id).
--
-- Карточка гостя: не член клуба, без аккаунта — как у остальных гостей
-- этого турнира.
--
-- Запускать можно повторно.

BEGIN;

INSERT INTO public.players (id, name, country, category_id,
                            ntrp_singles, gender, is_member, is_guest, has_account)
VALUES ('atabek-abdyldaev', 'Атабек Абдылдаев', '🇰🇬', 'futures',
        3.0, 'men', false, true, false)
ON CONFLICT (id) DO NOTHING;

-- Заявка перестаёт быть внешней: за ней теперь стоит карточка
UPDATE public.tournament_registrations
   SET player_id     = 'atabek-abdyldaev',
       is_external   = false,
       external_name = NULL
 WHERE id = '99fa4f43-f44e-4e5d-bd9e-1dcaa0890577';

-- Его встречи в группе: игрока подставляем по ссылке на заявку
UPDATE public.matches
   SET player1_id = 'atabek-abdyldaev'
 WHERE tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND reg1_id = '99fa4f43-f44e-4e5d-bd9e-1dcaa0890577'
   AND player1_id IS NULL;

UPDATE public.matches
   SET player2_id = 'atabek-abdyldaev'
 WHERE tournament_id = 'c6883b98-eaf9-4bc4-a09e-6174f11afb26'
   AND reg2_id = '99fa4f43-f44e-4e5d-bd9e-1dcaa0890577'
   AND player2_id IS NULL;

COMMIT;

-- ============================================================
-- Микст FUTURES: вернуть отменённый доп. матч — ПРАВКА
-- ============================================================
--
-- Отмена доп. матча раньше удаляла запись целиком, и в сетке не оставалось
-- следа: клетка пустая, а почему — непонятно. Теперь отменённый матч живёт
-- со статусом «cancelled» и виден карточкой с пометкой.
--
-- Возвращаем тот, что был удалён до правки: первый доп. матч, Айгерим
-- Алижанова / Евгений Осипов (Q3) против Анвара Насырова / Канышай
-- Бадретдиновой (Q6). Сразу отменённым — он и был отменён.
--
-- Заявки подставляем по игроку: по ним сетка читает состав пары.
--
-- Запускать можно повторно: если такой матч уже есть, ничего не добавится.

BEGIN;

INSERT INTO public.matches (
    tournament_id, round, round_number, match_order,
    player1_id, player2_id, reg1_id, reg2_id,
    slot1_label, slot2_label, status, group_number
)
SELECT 'c0a30bae-30ee-4a38-a26a-4c6b339bd695',
       'IG', 1, 1,
       'aygerim-alizhanova', 'anvar-nasyrov',
       (SELECT id FROM public.tournament_registrations
         WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
           AND (player_id = 'aygerim-alizhanova' OR partner_id = 'aygerim-alizhanova')
           AND status NOT IN ('withdrawn', 'rejected') LIMIT 1),
       (SELECT id FROM public.tournament_registrations
         WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
           AND (player_id = 'anvar-nasyrov' OR partner_id = 'anvar-nasyrov')
           AND status NOT IN ('withdrawn', 'rejected') LIMIT 1),
       'Q3', 'Q6', 'cancelled', NULL
 WHERE NOT EXISTS (
     SELECT 1 FROM public.matches
      WHERE tournament_id = 'c0a30bae-30ee-4a38-a26a-4c6b339bd695'
        AND round = 'IG' AND match_order = 1
 );

COMMIT;

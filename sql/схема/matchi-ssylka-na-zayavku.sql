-- ============================================================
-- Матч знает не игрока, а заявку
-- ============================================================
--
-- Сейчас в матче записан игрок: player1_id, player2_id. Заменили человека в
-- заявке — и код идёт по всем матчам турнира, подменяя один id другим. Где-то
-- замена доезжала, где-то нет: имя в группе новое, в плей-офф старое, а
-- проход без игры и вовсе считался по прежнему составу.
--
-- Заводим ссылку на заявку. Тогда матч знает, ЧЬЯ это заявка, а кто в ней
-- сегодня — дело самой заявки. Поменяли состав — имена сменились везде разом:
-- в группе, в доп. матчах, в плей-офф, на странице турнира и в приложении.
-- Переписывать нечего, значит и разъехаться нечему.
--
-- Игрок в матче остаётся: по нему считаются очки и история встреч — их
-- получает тот, кто выходил на корт, а не тот, кто числится в заявке сегодня.
-- Правило клуба это защищает: после первой сыгранной игры состав не меняют.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS reg1_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reg2_id uuid REFERENCES public.tournament_registrations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.matches.reg1_id IS
    'Заявка первой стороны. Состав пары читается из неё: имена в сетке меняются вместе с заявкой';
COMMENT ON COLUMN public.matches.reg2_id IS
    'Заявка второй стороны';

CREATE INDEX IF NOT EXISTS idx_matches_reg1 ON public.matches (reg1_id);
CREATE INDEX IF NOT EXISTS idx_matches_reg2 ON public.matches (reg2_id);

-- Проставляем ссылки уже сыгранным и текущим матчам: заявку узнаём по
-- игроку в том же турнире. Заявка на пару одна, поэтому ищем и первым
-- номером, и вторым
UPDATE public.matches m
   SET reg1_id = r.id
  FROM public.tournament_registrations r
 WHERE m.reg1_id IS NULL
   AND m.player1_id IS NOT NULL
   AND r.tournament_id = m.tournament_id
   AND (r.player_id = m.player1_id OR r.partner_id = m.player1_id)
   AND r.status <> 'withdrawn' AND r.status <> 'rejected';

UPDATE public.matches m
   SET reg2_id = r.id
  FROM public.tournament_registrations r
 WHERE m.reg2_id IS NULL
   AND m.player2_id IS NOT NULL
   AND r.tournament_id = m.tournament_id
   AND (r.player_id = m.player2_id OR r.partner_id = m.player2_id)
   AND r.status <> 'withdrawn' AND r.status <> 'rejected';

COMMIT;

-- ---- Проверка ----

SELECT count(*)                                             AS матчей_с_игроками,
       count(*) FILTER (WHERE reg1_id IS NOT NULL)          AS есть_ссылка_первой,
       count(*) FILTER (WHERE reg2_id IS NOT NULL)          AS есть_ссылка_второй
  FROM public.matches
 WHERE player1_id IS NOT NULL OR player2_id IS NOT NULL;
-- Ожидаем: ссылок примерно столько же, сколько сторон с игроками. Матчи
-- старых турниров, где заявки удалены, останутся без ссылки — это нормально,
-- они читаются по игроку, как раньше.

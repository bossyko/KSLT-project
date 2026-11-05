-- СТЫКОВЫЕ ЛИГИ ТУРНИРА `e660119c` — РАССТАНОВКА И СЧЕТА ПО ДОКУМЕНТУ.
--
-- ТОЛЬКО ЭТОТ ТУРНИР. Идентификатор стоит в КАЖДОМ запросе, других
-- турниров файл не упоминает ни разу — слово Кости 05.11.
--
-- ЧТО ДЕЛАЕТ. Переписывает обе стыковые сетки — высшую и утешительную —
-- так, как они сыграны на кортах и нарисованы в документе: 9 пар наверху,
-- 12 внизу, со счетами до финала. Пара A4 (Замир Борубаев и Искендер
-- Сейдиматов) снялась W/O и в сетках не стоит.
--
-- ЧЕГО НЕ ДЕЛАЕТ. Не трогает группы, заявки, рейтинг и другие турниры.
-- Матч за третье место не заполняет: в документе его нет ни в одной лиге.
--
-- СЧЁТ ПИШЕТСЯ В ПОРЯДКЕ СТОРОН, А НЕ ГЛАЗАМИ ПОБЕДИТЕЛЯ. В базе
-- `score` — это `первая сторона / вторая` (`js/kslt-rules.js:417`,
-- серверная проверка `sql/функции/match-score-notify.sql:140`). Поэтому
-- «6/4» из документа, где выиграла нижняя пара, здесь записан как «4/6».
--
-- ТАЙ-БРЕЙК ЗАПИСАН ТАК, КАК НАПИСАН В ДОКУМЕНТЕ, И ЭТО НАМЕРЕННО.
-- «6/5 (5)» — это показ по мировой записи: очки ПРОИГРАВШЕГО. Полная
-- форма с обоими счетами (`6/5(7-5)`) требует второго числа, а его в
-- документе нет, и выдумывать его я не стал. Код понимает обе формы:
-- `R.перевернутьСчёт` разбирает старую одним числом явным правилом
-- (`js/kslt-rules.js:1288`), `R.счётПоМировому` на ней ничего не меняет.
--
-- ПОРЯДОК ЗАПРОСОВ ВАЖЕН. На `matches` висит `trg_advance_bracket`
-- (`sql/функции/fic-advance-by-round.sql:455`): он сам двигает победителя
-- в следующий круг. Поэтому круги заполняются ПО ОЧЕРЕДИ — первый, потом
-- четверти, потом полуфиналы, потом финалы. Триггер проставит то же
-- самое, что и следующий запрос, и расхождения не будет. Он же доложит
-- проигравших полуфиналов в матч за третье место — это штатное поведение
-- продукта, и я его не отключаю.
--
-- ГНАТЬ ПО ОДНОМУ, СВЕРХУ ВНИЗ. Последний запрос — проверка чтением.
--
--   sql/обслуживание/stykovye-ligi-e660119c-0511.sql


-- ── 1. СЛЕПОК ДЛЯ ОТКАТА. ОН ЖЕ СЛОВАРЬ МЕТОК ────────────────────────
-- Ждём: 32 строки (по 16 на лигу).
-- Этот слепок нужен не только для отката: метки `A1`…`F3` уже стоят в
-- матчах лиг вместе с заявками, и дальше пары берутся ИЗ НЕГО, а не по
-- именам. Имя можно написать иначе, метка — нет.
DROP TABLE IF EXISTS public.slepok_ligi_e660119c_0511;

CREATE TABLE public.slepok_ligi_e660119c_0511 AS
SELECT * FROM public.matches
 WHERE tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND (round LIKE 'PL-%' OR round LIKE 'CL-%');

SELECT count(*) AS strok_v_slepke FROM public.slepok_ligi_e660119c_0511;


-- ── 2. СЛОВАРЬ: МЕТКА → ЗАЯВКА → ИГРОК ───────────────────────────────
-- Ждём: 22 строки, по одной на каждую метку от A1 до F3.
DROP TABLE IF EXISTS public.metki_e660119c_0511;

CREATE TABLE public.metki_e660119c_0511 AS
WITH пары AS (
  SELECT slot1_label AS metka, reg1_id AS reg
    FROM public.slepok_ligi_e660119c_0511
   WHERE slot1_label IS NOT NULL AND reg1_id IS NOT NULL
  UNION
  SELECT slot2_label, reg2_id
    FROM public.slepok_ligi_e660119c_0511
   WHERE slot2_label IS NOT NULL AND reg2_id IS NOT NULL
)
SELECT п.metka, п.reg, r.player_id
  FROM пары п
  JOIN public.tournament_registrations r ON r.id = п.reg;

SELECT count(*) AS metok, string_agg(metka, ' ' ORDER BY metka) AS spisok
  FROM public.metki_e660119c_0511;


-- ── 3. ПЕРВЫЙ КРУГ ОБЕИХ ЛИГ ─────────────────────────────────────────
-- Ждём: 16 строк (8 + 8).
UPDATE public.matches m
   SET slot1_label = v.m1,
       slot2_label = v.m2,
       reg1_id     = p1.reg,
       reg2_id     = p2.reg,
       player1_id  = p1.player_id,
       player2_id  = p2.player_id,
       winner_id   = pw.player_id,
       score       = v.schet,
       status      = 'completed'
  FROM (VALUES
    -- ВЫСШАЯ. Семь проходов, одна игра: D2 — B2.
    ('PL-R1', 1, 'B1', NULL::text, 'B1', 'BYE'),
    ('PL-R1', 2, 'C2', NULL, 'C2', 'BYE'),
    ('PL-R1', 3, 'E1', NULL, 'E1', 'BYE'),
    ('PL-R1', 4, NULL, 'D1', 'D1', 'BYE'),
    ('PL-R1', 5, 'C1', NULL, 'C1', 'BYE'),
    ('PL-R1', 6, NULL, 'F1', 'F1', 'BYE'),
    ('PL-R1', 7, 'D2', 'B2', 'B2', '4/6'),
    ('PL-R1', 8, NULL, 'A1', 'A1', 'BYE'),
    -- УТЕШИТЕЛЬНАЯ. Четыре прохода, четыре игры.
    ('CL-R1', 1, 'A2', NULL, 'A2', 'BYE'),
    ('CL-R1', 2, 'D4', 'B4', 'D4', '6/4'),
    ('CL-R1', 3, 'F3', 'E2', 'F3', '6/4'),
    ('CL-R1', 4, NULL, 'C3', 'C3', 'BYE'),
    ('CL-R1', 5, NULL, 'B3', 'B3', 'BYE'),
    ('CL-R1', 6, 'F2', 'E3', 'E3', '5/6(5)'),
    ('CL-R1', 7, NULL, 'D3', 'D3', 'BYE'),
    ('CL-R1', 8, 'C4', 'A3', 'C4', '6/4')
  ) AS v(krug, ord, m1, m2, pob, schet)
  LEFT JOIN public.metki_e660119c_0511 p1 ON p1.metka = v.m1
  LEFT JOIN public.metki_e660119c_0511 p2 ON p2.metka = v.m2
  LEFT JOIN public.metki_e660119c_0511 pw ON pw.metka = v.pob
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND m.round = v.krug
   AND m.match_order = v.ord;


-- ── 4. ЧЕТВЕРТЬФИНАЛЫ ОБЕИХ ЛИГ ──────────────────────────────────────
-- Ждём: 8 строк. Пары сюда уже доложил триггер — запрос ставит то же
-- самое плюс заявки, которых триггер не двигает, и счёт.
UPDATE public.matches m
   SET slot1_label = v.m1,
       slot2_label = v.m2,
       reg1_id     = p1.reg,
       reg2_id     = p2.reg,
       player1_id  = p1.player_id,
       player2_id  = p2.player_id,
       winner_id   = pw.player_id,
       score       = v.schet,
       status      = 'completed'
  FROM (VALUES
    ('PL-QF', 1, 'B1', 'C2', 'B1', '6/5(5)'),
    ('PL-QF', 2, 'E1', 'D1', 'D1', '4/6'),
    ('PL-QF', 3, 'C1', 'F1', 'C1', '6/3'),
    ('PL-QF', 4, 'B2', 'A1', 'A1', '2/6'),
    ('CL-QF', 1, 'A2', 'D4', 'A2', '6/5(5)'),
    ('CL-QF', 2, 'F3', 'C3', 'C3', '1/6'),
    ('CL-QF', 3, 'B3', 'E3', 'E3', '1/6'),
    ('CL-QF', 4, 'D3', 'C4', 'C4', '1/6')
  ) AS v(krug, ord, m1, m2, pob, schet)
  LEFT JOIN public.metki_e660119c_0511 p1 ON p1.metka = v.m1
  LEFT JOIN public.metki_e660119c_0511 p2 ON p2.metka = v.m2
  LEFT JOIN public.metki_e660119c_0511 pw ON pw.metka = v.pob
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND m.round = v.krug
   AND m.match_order = v.ord;


-- ── 5. ПОЛУФИНАЛЫ ОБЕИХ ЛИГ ──────────────────────────────────────────
-- Ждём: 4 строки.
UPDATE public.matches m
   SET slot1_label = v.m1,
       slot2_label = v.m2,
       reg1_id     = p1.reg,
       reg2_id     = p2.reg,
       player1_id  = p1.player_id,
       player2_id  = p2.player_id,
       winner_id   = pw.player_id,
       score       = v.schet,
       status      = 'completed'
  FROM (VALUES
    ('PL-SF', 1, 'B1', 'D1', 'D1', '5/6(1)'),
    ('PL-SF', 2, 'C1', 'A1', 'A1', '3/6'),
    ('CL-SF', 1, 'A2', 'C3', 'A2', '6/4'),
    ('CL-SF', 2, 'E3', 'C4', 'E3', '6/5(2)')
  ) AS v(krug, ord, m1, m2, pob, schet)
  LEFT JOIN public.metki_e660119c_0511 p1 ON p1.metka = v.m1
  LEFT JOIN public.metki_e660119c_0511 p2 ON p2.metka = v.m2
  LEFT JOIN public.metki_e660119c_0511 pw ON pw.metka = v.pob
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND m.round = v.krug
   AND m.match_order = v.ord;


-- ── 6. ФИНАЛЫ ОБЕИХ ЛИГ ──────────────────────────────────────────────
-- Ждём: 2 строки. Чемпионы: высшая — A1 Азим и Владислав,
-- утешительная — A2 Бек и Улукбек.
UPDATE public.matches m
   SET slot1_label = v.m1,
       slot2_label = v.m2,
       reg1_id     = p1.reg,
       reg2_id     = p2.reg,
       player1_id  = p1.player_id,
       player2_id  = p2.player_id,
       winner_id   = pw.player_id,
       score       = v.schet,
       status      = 'completed'
  FROM (VALUES
    ('PL-F', 1, 'D1', 'A1', 'A1', '5/6(4)'),
    ('CL-F', 1, 'A2', 'E3', 'A2', '6/2')
  ) AS v(krug, ord, m1, m2, pob, schet)
  LEFT JOIN public.metki_e660119c_0511 p1 ON p1.metka = v.m1
  LEFT JOIN public.metki_e660119c_0511 p2 ON p2.metka = v.m2
  LEFT JOIN public.metki_e660119c_0511 pw ON pw.metka = v.pob
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND m.round = v.krug
   AND m.match_order = v.ord;


-- ── 7. ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success» ─────────────────
-- Ждём: обе сетки от первого круга до финала, слева направо, с именами
-- и счетами ровно как в документе. Последняя строка каждой лиги — финал.
SELECT m.round || ' #' || m.match_order                       AS krug,
       COALESCE(m.slot1_label, '—') || ' ' ||
         COALESCE(COALESCE(p1.name, r1.external_name) || ' и ' ||
                  COALESCE(pp1.name, r1.partner_external_name), 'свободно')
                                                              AS storona_1,
       COALESCE(m.slot2_label, '—') || ' ' ||
         COALESCE(COALESCE(p2.name, r2.external_name) || ' и ' ||
                  COALESCE(pp2.name, r2.partner_external_name), 'свободно')
                                                              AS storona_2,
       COALESCE(m.score, '')                                  AS schet,
       CASE WHEN m.winner_id IS NULL THEN ''
            WHEN m.winner_id = m.player1_id THEN COALESCE(m.slot1_label, '?')
            ELSE COALESCE(m.slot2_label, '?') END             AS proshel,
       m.status
  FROM public.matches m
  LEFT JOIN public.tournament_registrations r1 ON r1.id = m.reg1_id
  LEFT JOIN public.tournament_registrations r2 ON r2.id = m.reg2_id
  LEFT JOIN public.players p1  ON p1.id  = r1.player_id
  LEFT JOIN public.players pp1 ON pp1.id = r1.partner_id
  LEFT JOIN public.players p2  ON p2.id  = r2.player_id
  LEFT JOIN public.players pp2 ON pp2.id = r2.partner_id
 WHERE m.tournament_id = 'e660119c-4360-45a8-a2d9-cfaa81e83ebb'
   AND (m.round LIKE 'PL-%' OR m.round LIKE 'CL-%')
 ORDER BY LEFT(m.round, 2), m.round_number, m.match_order;

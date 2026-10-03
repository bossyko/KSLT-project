-- ============================================================
-- СТЕНД: части схемы КСЛТ, которых касаются версии очков
-- ============================================================
--
-- ТИПЫ И ИМЕНА ВЗЯТЫ ИЗ `supabase/migrations/20260210000000_baseline.sql`,
-- А НЕ ПРИДУМАНЫ. Первая редакция стенда придумала три вещи, и каждая
-- потом упала у Кости на боевой:
--   · `tournaments.start_date` — на деле `date_start` (:2830);
--   · у `tournaments` не было ни `format`, ни `bracket_type`, ни `gender`,
--     ни `status` — запрос до них не доходил и ошибки не показывал;
--   · `tournaments.name` — на деле `title`, и `id` там **text**, не uuid.
--
-- СТЕНД, В КОТОРОМ НЕТ НУЖНОЙ КОЛОНКИ, НИЧЕГО НЕ ДОКАЗЫВАЕТ. Поэтому у
-- каждой таблицы названо, откуда взяты её колонки.

CREATE SCHEMA IF NOT EXISTS auth;

-- auth.uid() у Supabase; на стенде подменяется переменной
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('стенд.uid', true), '')::uuid;
$$;

-- profiles — baseline :2595, role :2602, CHECK :2639
CREATE TABLE public.profiles (
    id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text DEFAULT 'user'
        CHECK (role = ANY (ARRAY['user','player','manager','admin']))
);

-- is_admin — sql/схема/schema-snapshot.sql:1430
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin');
$$;

-- tournament_levels — baseline :2820, плюс on_ladder (заведён Костей 02.10)
CREATE TABLE public.tournament_levels (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    name_en    text,
    sort_order integer DEFAULT 0,
    on_ladder  boolean NOT NULL DEFAULT true
);

-- tournaments — baseline :2828. id ТЕКСТОВЫЙ, название в title.
CREATE TABLE public.tournaments (
    id           text PRIMARY KEY,
    title        text NOT NULL,
    date_start   date NOT NULL,
    date_end     date,
    status       text DEFAULT 'upcoming',
    format       text DEFAULT 'singles'
        CHECK (format = ANY (ARRAY['singles','doubles','mixed_doubles'])),
    level_id     uuid REFERENCES public.tournament_levels(id),
    bracket_type text,
    gender       text,
    start_time   text
);

-- tournament_results — baseline :2800. tournament_id и player_id ТЕКСТОВЫЕ.
CREATE TABLE public.tournament_results (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id text REFERENCES public.tournaments(id),
    player_id     text,
    round_reached text NOT NULL,
    points_earned integer DEFAULT 0,
    season        integer NOT NULL,
    category_id   text
);

-- points_by_place — sql/схема/kategorii-i-ochki.sql:67, КАК СЕЙЧАС В БОЕВОЙ:
-- без версии, уникальность по (level_id, place)
CREATE TABLE public.points_by_place (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id uuid NOT NULL REFERENCES public.tournament_levels(id) ON DELETE CASCADE,
    place    integer NOT NULL CHECK (place BETWEEN 1 AND 64),
    points   integer NOT NULL DEFAULT 0,
    UNIQUE (level_id, place)
);

ALTER TABLE public.points_by_place ENABLE ROW LEVEL SECURITY;
CREATE POLICY points_by_place_read ON public.points_by_place FOR SELECT USING (true);
CREATE POLICY points_by_place_staff ON public.points_by_place FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin','manager')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p
                         WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

-- points_rules — baseline :2584. Содержимое ЦЕЛИКОМ из боевой: замер 03.10,
-- шаг 4, все ДВЕНАДЦАТЬ ключей. Прежняя редакция стенда несла шесть из
-- двенадцати — R16, R32 и G3…G6 в ней не было вовсе, и четвёртый раз подряд
-- стенд не имел нужной колонки. Ключи заведены один раз,
-- `js/admin/sections/players.js:131`; подписи — `js/admin/core/constants.js:908`.
CREATE TABLE public.points_rules (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id uuid,
    round    text NOT NULL,
    points   integer NOT NULL DEFAULT 0
);

-- ---- Данные: пять уровней, как после переименований 30.09 и 02.10 ----

INSERT INTO public.tournament_levels (name, name_en, sort_order, on_ladder) VALUES
    ('Высшая категория', 'Top category',    5, true),
    ('1 категория',      'Category 1',      4, true),
    ('2 категория',      'Category 2',      3, true),
    ('3 категория',      'Category 3',      2, true),
    ('Итоговый турнир',  'Year-End Finals', 1, false);

-- ВСЕ 64 МЕСТА ПЯТИ УРОВНЕЙ — ДОСЛОВНО ИЗ `sql/схема/kategorii-i-ochki.sql`
-- (строки 101–167), тем же файлом, которым наполнялась боевая. Прежняя
-- редакция черновой базы брала настоящие числа только для мест 1–4, а
-- 5–64 добивала убывающей шкалой `greatest(2, 70 - место)` — и прувер тогда
-- проверял МОЮ шкалу, а не клубную. Проверка, которая мерит выдуманное
-- основание, ничего не доказывает про боевую.
--
-- Колонки идут в порядке Высшая · Первая · Вторая · Третья · Четвёртая, то
-- есть sort_order 5 · 4 · 3 · 2 · 1. Нынешние имена уровней другие
-- (переименования 30.09 и 02.10), поэтому привязка ПО `sort_order`.
WITH таблица(место, с5, с4, с3, с2, с1) AS (
    VALUES
        ( 1, 1000,  600,  360,  215,  130),
        ( 2,  600,  360,  215,  130,   80),
        ( 3,  420,  250,  150,   90,   55),
        ( 4,  360,  215,  130,   77,   48),
        ( 5,  250,  150,   90,   55,   33),
        ( 6,  215,  130,   78,   45,   28),
        ( 7,  180,  110,   65,   38,   23),
        ( 8,  180,  110,   65,   38,   23),
        ( 9,  145,   90,   50,   30,   18),
        (10,  125,   75,   45,   27,   16),
        (11,  110,   65,   40,   23,   13),
        (12,  110,   65,   40,   23,   13),
        (13,   90,   55,   32,   19,   11),
        (14,   90,   55,   32,   19,   11),
        (15,   90,   55,   32,   19,   11),
        (16,   90,   55,   32,   19,   11),
        (17,   80,   50,   29,   17,   10),
        (18,   65,   38,   22,   13,    8),
        (19,   45,   27,   16,    9,    6),
        (20,   45,   27,   16,    9,    6),
        (21,   35,   21,   12,    8,    4),
        (22,   35,   21,   12,    8,    4),
        (23,   35,   21,   12,    8,    4),
        (24,   35,   21,   12,    8,    4),
        (25,   33,   18,   10,    6,    3),
        (26,   32,   18,   10,    6,    3),
        (27,   31,   18,   10,    6,    3),
        (28,   31,   18,   10,    6,    3),
        (29,   30,   18,   10,    6,    3),
        (30,   30,   18,   10,    6,    3),
        (31,   30,   18,   10,    6,    3),
        (32,   30,   18,   10,    6,    3),
        (33,   30,   18,   10,    6,    3),
        (34,   20,   12,    6,    4,    2),
        (35,   15,    8,    4,    3,    0),
        (36,   15,    8,    4,    3,    0),
        (37,   10,    5,    3,    2,    0),
        (38,   10,    5,    3,    2,    0),
        (39,   10,    4,    3,    2,    0),
        (40,   10,    4,    3,    2,    0),
        (41,    8,    3,    2,    1,    0),
        (42,    7,    3,    2,    1,    0),
        (43,    5,    3,    2,    1,    0),
        (44,    5,    3,    2,    1,    0),
        (45,    5,    3,    2,    1,    0),
        (46,    5,    3,    2,    1,    0),
        (47,    5,    3,    2,    1,    0),
        (48,    5,    3,    2,    1,    0),
        (49,    4,    2,    1,    1,    0),
        (50,    4,    2,    1,    1,    0),
        (51,    4,    2,    1,    1,    0),
        (52,    4,    2,    1,    1,    0),
        (53,    3,    2,    1,    1,    0),
        (54,    3,    2,    1,    1,    0),
        (55,    3,    2,    1,    1,    0),
        (56,    3,    2,    1,    1,    0),
        (57,    2,    1,    1,    1,    0),
        (58,    2,    1,    1,    1,    0),
        (59,    2,    1,    1,    1,    0),
        (60,    2,    1,    1,    1,    0),
        (61,    2,    1,    1,    1,    0),
        (62,    2,    1,    1,    1,    0),
        (63,    2,    1,    1,    1,    0),
        (64,    2,    1,    1,    1,    0)
)
INSERT INTO public.points_by_place (level_id, place, points)
SELECT у.id, т.место,
       CASE у.sort_order
           WHEN 5 THEN т.с5 WHEN 4 THEN т.с4 WHEN 3 THEN т.с3
           WHEN 2 THEN т.с2 WHEN 1 THEN т.с1
       END
  FROM public.tournament_levels у
  CROSS JOIN таблица т;

-- Таблица по раундам — числа боевой, замер 03.10, шаг 4.
-- W·F·3RD·4TH совпадают с местами 1–4 у всех пяти уровней.
-- SF перевёрнут: 150 · 8 · 18 · 36 · 70 сверху вниз по лестнице.
-- QF ровно SF/2 у всех пяти — это сгенерировано, а не введено руками.
-- R16 ноль везде; R32 ноль у четырёх и 9 у ИТОГОВОГО — единственное
-- ненулевое R там, где 1/16 финала невозможна (восьмёрка).
-- G3 и G4 — «3-е в группе» и «4-е в группе»: 25 и 10 у четырёх уровней и
-- НОЛЬ у Высшей. G5 и G6 ноль везде.
INSERT INTO public.points_rules (level_id, round, points)
SELECT у.id, р.round,
       CASE у.sort_order
           WHEN 5 THEN (ARRAY[1000,600,420,360,150,75,0,0, 0, 0,0,0])[р.n]
           WHEN 4 THEN (ARRAY[ 600,360,250,215,  8, 4,0,0,25,10,0,0])[р.n]
           WHEN 3 THEN (ARRAY[ 360,215,150,130, 18, 9,0,0,25,10,0,0])[р.n]
           WHEN 2 THEN (ARRAY[ 215,130, 90, 77, 36,18,0,0,25,10,0,0])[р.n]
           WHEN 1 THEN (ARRAY[ 130, 80, 55, 48, 70,35,0,9,25,10,0,0])[р.n]
       END
  FROM public.tournament_levels у
  CROSS JOIN (VALUES ('W',1),('F',2),('3RD',3),('4TH',4),('SF',5),('QF',6),
                     ('R16',7),('R32',8),('G3',9),('G4',10),('G5',11),('G6',12))
             AS р(round, n);

INSERT INTO public.profiles (id, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'manager');

-- ---- Турниры: крайние случаи, а не удобные ----

INSERT INTO public.tournaments (id, title, level_id, date_start, format, bracket_type, gender, status)
SELECT 't-proshedshiy', 'Прошедший рейтинговый', id, DATE '2026-09-18',
       'singles', 'round_robin', 'men', 'completed'
  FROM public.tournament_levels WHERE sort_order = 3;

INSERT INTO public.tournaments (id, title, level_id, date_start, format, bracket_type, gender, status)
VALUES ('t-parnyy', 'Парный дружеский',      NULL, DATE '2025-04-27', 'doubles', NULL,  'men', 'completed'),
       ('t-sirota', 'Осиротевший одиночный', NULL, DATE '2026-06-01', 'singles', 'fic', 'men', 'completed');

-- Итоги: оплачено по месту, оплачено кривым раундом, мимо обеих, по старому
-- правилу «таблица плюс победы», и очки у турниров без уровня — которых
-- там быть не должно вовсе.
INSERT INTO public.tournament_results (tournament_id, player_id, round_reached, points_earned, season)
VALUES ('t-proshedshiy', 'p1', 'W',   360, 2026),
       ('t-proshedshiy', 'p2', 'F',   215, 2026),
       ('t-proshedshiy', 'p3', 'SF',   18, 2026),
       ('t-proshedshiy', 'p4', 'QF',  777, 2026),
       ('t-proshedshiy', 'p5', 'W',   535, 2026),
       ('t-parnyy',      'p6', 'W',  1000, 2026),
       ('t-sirota',      'p7', 'W',  1000, 2026);

-- Крайние случаи шага 9: осиротевшие с разными очками победителя.
-- Один оплачен РОВНО по таблице Высшей (1000), один — по 2 категории со
-- старой добавкой за победы (360 + 7×25 = 535), один — мимо всех шкал (999).
INSERT INTO public.tournaments (id, title, level_id, date_start, format, bracket_type, gender, status)
VALUES ('t-tbsh-pro',  'ТБШ ProMasters 2026',  NULL, DATE '2026-06-01', 'singles', 'fic', 'men',   'completed'),
       ('t-tbsh-chal', 'ТБШ Challengers 2026', NULL, DATE '2026-06-01', 'singles', 'fic', 'men',   'completed'),
       ('t-tbsh-tour', 'ТБШ Tour 2026',        NULL, DATE '2026-06-01', 'singles', 'fic', 'women', 'completed');

INSERT INTO public.tournament_results (tournament_id, player_id, round_reached, points_earned, season)
VALUES ('t-tbsh-pro',  'p10', 'W', 1000, 2026),
       ('t-tbsh-chal', 'p11', 'W',  535, 2026),
       ('t-tbsh-tour', 'p12', 'W',  999, 2026);

-- Крайние случаи шага 10: лестница есть · лестницы нет · победителя нет.
INSERT INTO public.tournaments (id, title, level_id, date_start, format, bracket_type, gender, status)
VALUES ('t-tbsh-lest', 'ТБШ с лестницей',   NULL, DATE '2026-06-01', 'singles', 'fic', 'men', 'completed'),
       ('t-tbsh-flat', 'ТБШ всем одинаково', NULL, DATE '2026-06-01', 'singles', 'fic', 'men', 'completed'),
       ('t-tbsh-bezw', 'ТБШ без победителя', NULL, DATE '2026-06-01', 'singles', 'fic', 'men', 'completed');

INSERT INTO public.tournament_results (tournament_id, player_id, round_reached, points_earned, season)
VALUES -- настоящая лестница Высшей: 1000 · 600 · 420 · 360
       ('t-tbsh-lest', 'p20', 'W',   1000, 2026),
       ('t-tbsh-lest', 'p21', 'F',    600, 2026),
       ('t-tbsh-lest', 'p22', '3RD',  420, 2026),
       ('t-tbsh-lest', 'p23', '4TH',  360, 2026),
       -- всем одно и то же: лестницы нет
       ('t-tbsh-flat', 'p24', 'W',   1000, 2026),
       ('t-tbsh-flat', 'p25', 'F',   1000, 2026),
       ('t-tbsh-flat', 'p26', 'SF',  1000, 2026),
       -- победителя нет вовсе, этап записан местом В ГРУППЕ.
       -- КЛЮЧИ ТОЛЬКО ИЗ НАСТОЯЩИХ ДВЕНАДЦАТИ (`players.js:131`): первая
       -- редакция стенда писала здесь 'G1' и 'G2', которых в продукте нет
       -- вовсе — стенд придумал ключ, как раньше придумывал колонку.
       ('t-tbsh-bezw', 'p27', 'G3',   250, 2026),
       ('t-tbsh-bezw', 'p28', 'G4',   120, 2026);

-- Крайний случай шага 10в: один уровень турнира, два дивизиона, очки
-- зачтены в РАЗНЫЕ категории игрока, а числа платит одна таблица.
INSERT INTO public.tournaments (id, title, level_id, date_start, format, bracket_type, gender, status)
VALUES ('t-tbsh-divs', 'ТБШ два дивизиона', NULL, DATE '2026-06-01', 'singles', 'fic', 'men', 'completed');

INSERT INTO public.tournament_results (tournament_id, player_id, round_reached, points_earned, season, category_id)
VALUES ('t-tbsh-divs', 'p30', 'W', 1000, 2026, 'promasters'),
       ('t-tbsh-divs', 'p31', 'F',  600, 2026, 'promasters'),
       ('t-tbsh-divs', 'p32', 'W', 1000, 2026, 'tour'),
       ('t-tbsh-divs', 'p33', 'F',  600, 2026, NULL);

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

-- points_rules — baseline :2584. Кривые числа ТЕ ЖЕ, что в боевой
-- (замер 02.10, шаг 4): SF перевёрнут по категориям, QF ровно вдвое меньше.
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

-- Места 1–4 — настоящие числа боевой (замер 02.10, шаг 3)
INSERT INTO public.points_by_place (level_id, place, points)
SELECT у.id, м.место,
       CASE у.sort_order
           WHEN 5 THEN (ARRAY[1000,600,420,360])[м.место]
           WHEN 4 THEN (ARRAY[600,360,250,215])[м.место]
           WHEN 3 THEN (ARRAY[360,215,150,130])[м.место]
           WHEN 2 THEN (ARRAY[215,130,90,77])[м.место]
           WHEN 1 THEN (ARRAY[130,80,55,48])[м.место]
       END
  FROM public.tournament_levels у
  CROSS JOIN generate_series(1, 4) AS м(место);

-- Места 5–64. В БОЕВОЙ 64 СТРОКИ У ВСЕХ ПЯТИ УРОВНЕЙ, включая итоговый
-- (замер, шаг 2: у итогового 64 строки, из них 30 нулевых). Стенд это
-- повторяет — иначе он не показал бы беду, ради которой заведён предел.
INSERT INTO public.points_by_place (level_id, place, points)
SELECT у.id, м.место,
       CASE WHEN у.on_ladder    THEN greatest(2, 70 - м.место)
            WHEN м.место <= 34  THEN greatest(2, 36 - м.место)
            ELSE 0 END
  FROM public.tournament_levels у
  CROSS JOIN generate_series(5, 64) AS м(место);

-- Кривая таблица по раундам
INSERT INTO public.points_rules (level_id, round, points)
SELECT у.id, р.round,
       CASE у.sort_order
           WHEN 5 THEN (ARRAY[1000,600,420,360,150,75])[р.n]
           WHEN 4 THEN (ARRAY[600,360,250,215,8,4])[р.n]
           WHEN 3 THEN (ARRAY[360,215,150,130,18,9])[р.n]
           WHEN 2 THEN (ARRAY[215,130,90,77,36,18])[р.n]
           WHEN 1 THEN (ARRAY[130,80,55,48,70,35])[р.n]
       END
  FROM public.tournament_levels у
  CROSS JOIN (VALUES ('W',1),('F',2),('3RD',3),('4TH',4),('SF',5),('QF',6)) AS р(round, n);

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
       -- победителя нет вовсе, этап записан группой
       ('t-tbsh-bezw', 'p27', 'G1',   250, 2026),
       ('t-tbsh-bezw', 'p28', 'G2',   120, 2026);

-- Крайний случай шага 10в: один уровень турнира, два дивизиона, очки
-- зачтены в РАЗНЫЕ категории игрока, а числа платит одна таблица.
INSERT INTO public.tournaments (id, title, level_id, date_start, format, bracket_type, gender, status)
VALUES ('t-tbsh-divs', 'ТБШ два дивизиона', NULL, DATE '2026-06-01', 'singles', 'fic', 'men', 'completed');

INSERT INTO public.tournament_results (tournament_id, player_id, round_reached, points_earned, season, category_id)
VALUES ('t-tbsh-divs', 'p30', 'W', 1000, 2026, 'promasters'),
       ('t-tbsh-divs', 'p31', 'F',  600, 2026, 'promasters'),
       ('t-tbsh-divs', 'p32', 'W', 1000, 2026, 'tour'),
       ('t-tbsh-divs', 'p33', 'F',  600, 2026, NULL);

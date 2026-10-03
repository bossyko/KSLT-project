-- Стенд: ровно те части схемы КСЛТ, которых касается миграция версий.
-- Числа и формы взяты из sql/схема/kategorii-i-ochki.sql и
-- sql/схема/schema-snapshot.sql, а не выдуманы.

CREATE SCHEMA IF NOT EXISTS auth;

-- auth.uid() у Supabase; на стенде подменяется переменной
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('стенд.uid', true), '')::uuid;
$$;

CREATE TABLE public.profiles (
    id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text
);

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE TABLE public.tournament_levels (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    name_en    text,
    sort_order integer,
    on_ladder  boolean NOT NULL DEFAULT true
);

CREATE TABLE public.tournaments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text,
    level_id   uuid REFERENCES public.tournament_levels(id),
    start_date date
);

CREATE TABLE public.tournament_results (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid REFERENCES public.tournaments(id),
    player_id     uuid,
    round_reached text,
    points_earned integer,
    season        integer
);

-- Как сейчас в боевой: без версии, уникальность по (level_id, place)
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

-- ---- Данные: пять уровней, как после переименований 30.09 и 02.10 ----
INSERT INTO public.tournament_levels (name, name_en, sort_order, on_ladder) VALUES
    ('Высшая категория', 'Top category', 5, true),
    ('1 категория',      'Category 1',   4, true),
    ('2 категория',      'Category 2',   3, true),
    ('3 категория',      'Category 3',   2, true),
    ('Итоговый турнир',  'Year-End Finals', 1, false);

-- Первые четыре места по числам из трекера, остальные места добиваем
-- убывающей шкалой: форма важнее значений, но числа 1–4 настоящие.
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

-- четырём категориям добиваем места 5–64, итоговому — 5–8
INSERT INTO public.points_by_place (level_id, place, points)
SELECT у.id, м.место, greatest(2, 70 - м.место)
  FROM public.tournament_levels у
  CROSS JOIN generate_series(5, 64) AS м(место)
 WHERE у.on_ladder;

INSERT INTO public.points_by_place (level_id, place, points)
SELECT у.id, м.место, 0
  FROM public.tournament_levels у
  CROSS JOIN generate_series(5, 8) AS м(место)
 WHERE NOT у.on_ladder;

-- Прошедший турнир с начисленными очками
INSERT INTO public.profiles (id, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'manager');

INSERT INTO public.tournaments (name, level_id, start_date)
SELECT 'Прошедший', id, DATE '2026-09-18'
  FROM public.tournament_levels WHERE sort_order = 3;

INSERT INTO public.tournament_results (tournament_id, player_id, round_reached, points_earned, season)
SELECT id, gen_random_uuid(), 'W', 360, 2026 FROM public.tournaments;

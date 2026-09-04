-- ============================================================
-- Ручной игрок в баттле: фото и страна
-- ============================================================
--
-- В баттл можно поставить человека, которого нет в базе клуба: гостя,
-- приглашённую звезду, соперника из другого города. Имя, пол, NTRP и
-- разряд для него уже сохраняются прямо в вызове — своей карточки игрока
-- он не получает и пользователем не заводится. Так и надо: он не член
-- клуба, а если однажды зарегистрируется, заведёт себе всё сам.
--
-- Не хватало двух вещей.
--
-- Фото. У игрока из базы аватарка подтягивается из его профиля, у ручного
-- взяться неоткуда — и на карточке баттла вместо лица стояли инициалы.
-- Снимок кладём сюда же, в вызов: это не отдельная сущность, а вторая
-- подпитка того же места на карточке.
--
-- Страна напарника. У основных игроков поле было, у напарников — нет,
-- хотя на карточке рядом с именем стоит флаг.
--
-- Файл меняет базу. Читающие запросы — в battle-manual-player-fields-check.sql.

-- ---- Фото ручного игрока ----
-- Ссылка на файл в хранилище, туда же, куда кладутся афиши баттлов.

ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS challenger_photo         text,
    ADD COLUMN IF NOT EXISTS opponent_photo           text,
    ADD COLUMN IF NOT EXISTS challenger_partner_photo text,
    ADD COLUMN IF NOT EXISTS opponent_partner_photo   text;

COMMENT ON COLUMN public.challenges.challenger_photo IS
    'Снимок для аватарки, если игрок введён вручную и его нет в базе клуба. У игрока из базы берётся фото профиля.';

-- ---- Страна напарника ----
-- У основных игроков поля challenger_country и opponent_country уже есть.

ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS challenger_partner_country text,
    ADD COLUMN IF NOT EXISTS opponent_partner_country   text;

COMMENT ON COLUMN public.challenges.challenger_partner_country IS
    'Страна напарника, введённого вручную. Двухбуквенный код, как в challenger_country.';

-- ---- Отдать новые поля на страницу баттла ----
--
-- Одних столбцов мало. Страница баттла читает не таблицу, а функцию
-- get_battle_public, и та отдаёт снимок и страну только из карточки игрока:
-- `p1.photo AS challenger_photo`. У ручного игрока карточки нет — приходит
-- пусто, и новые столбцы так и остались бы лежать в базе без дела.
--
-- Поэтому подставляем второй источник: сначала карточка клуба, если игрок
-- в базе есть, иначе то, что ввели в самом вызове. Страна напарника
-- добавляется впервые — раньше её не отдавали вообще.
--
-- Остальное в функции не меняется.

CREATE OR REPLACE FUNCTION public.get_battle_public(p_challenge_id uuid)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed, c.format,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.challenger_partner_id, c.opponent_partner_id,
               c.battle_published_at, c.banner_url,
               c.challenger_ntrp, c.opponent_ntrp,
               c.challenger_category, c.opponent_category,
               c.set_format,
               COALESCE(p1.name,    c.challenger_external_name) AS challenger_name,
               COALESCE(p1.name_en, c.challenger_external_name) AS challenger_name_en,
               COALESCE(p1.name_kg, c.challenger_external_name) AS challenger_name_kg,
               COALESCE(p1.photo,   c.challenger_photo)         AS challenger_photo,
               COALESCE(c.challenger_country, p1.country)       AS challenger_country,
               p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses, p1.form AS challenger_form,
               p1.doubles_wins AS challenger_dbl_wins, p1.doubles_losses AS challenger_dbl_losses,
               p1.mixed_wins AS challenger_mix_wins, p1.mixed_losses AS challenger_mix_losses,
               p1.points AS challenger_points,
               p1.ntrp_rating AS challenger_player_ntrp,
               p1.country AS challenger_player_country,
               COALESCE(p2.name,    c.opponent_external_name) AS opponent_name,
               COALESCE(p2.name_en, c.opponent_external_name) AS opponent_name_en,
               COALESCE(p2.name_kg, c.opponent_external_name) AS opponent_name_kg,
               COALESCE(p2.photo,   c.opponent_photo)         AS opponent_photo,
               COALESCE(c.opponent_country, p2.country)       AS opponent_country,
               p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses, p2.form AS opponent_form,
               p2.doubles_wins AS opponent_dbl_wins, p2.doubles_losses AS opponent_dbl_losses,
               p2.mixed_wins AS opponent_mix_wins, p2.mixed_losses AS opponent_mix_losses,
               p2.points AS opponent_points,
               p2.ntrp_rating AS opponent_player_ntrp,
               p2.country AS opponent_player_country,
               -- Вторые половины пар
               COALESCE(m1.name,  c.challenger_partner_name)    AS challenger_partner_display,
               COALESCE(m1.photo, c.challenger_partner_photo)   AS challenger_partner_photo,
               COALESCE(c.challenger_partner_country, m1.country) AS challenger_partner_country,
               m1.category_id AS challenger_partner_cat,
               m1.ntrp_rating AS challenger_partner_ntrp,
               m1.doubles_wins AS challenger_partner_dbl_wins,
               m1.doubles_losses AS challenger_partner_dbl_losses,
               m1.mixed_wins AS challenger_partner_mix_wins,
               m1.mixed_losses AS challenger_partner_mix_losses,
               COALESCE(m2.name,  c.opponent_partner_name)      AS opponent_partner_display,
               COALESCE(m2.photo, c.opponent_partner_photo)     AS opponent_partner_photo,
               COALESCE(c.opponent_partner_country, m2.country) AS opponent_partner_country,
               m2.category_id AS opponent_partner_cat,
               m2.ntrp_rating AS opponent_partner_ntrp,
               m2.doubles_wins AS opponent_partner_dbl_wins,
               m2.doubles_losses AS opponent_partner_dbl_losses,
               m2.mixed_wins AS opponent_partner_mix_wins,
               m2.mixed_losses AS opponent_partner_mix_losses,
               ct.google_maps_url AS court_google_maps,
               ct.twogis_url AS court_twogis
        FROM challenges c
        LEFT JOIN players p1 ON p1.id = c.challenger_player_id
        LEFT JOIN players p2 ON p2.id = c.opponent_player_id
        LEFT JOIN players m1 ON m1.id = c.challenger_partner_id
        LEFT JOIN players m2 ON m2.id = c.opponent_partner_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$;

ALTER FUNCTION public.get_battle_public(uuid) OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_battle_public(uuid) TO anon;
GRANT ALL ON FUNCTION public.get_battle_public(uuid) TO authenticated;

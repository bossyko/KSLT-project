-- ============================================
-- Парные баттлы: четверо вместо двоих
-- ============================================
--
-- Что не так сейчас.
--
-- Баттл в базе — это ровно два человека: challenger_player_id и
-- opponent_player_id. Ни формата, ни напарников. Парный показательный матч
-- завести не через что.
--
-- Что делаем.
--
-- Добавляем формат — одиночный, парный, микст — и вторую половину каждой
-- пары. Напарник, как и основной участник, может быть членом клуба или
-- гостем: тогда у него только имя, карточки игрока не заводим.
--
-- Пол хранится у всех четверых. Он нужен проверке состава: в парном оба
-- одного пола, в миксте разного. На страницах он не показывается — только
-- на вход, чтобы менеджер не завёл микст как парный по ошибке.
--
-- Исключение: allow_any_pair. Показательная игра вне правил бывает, и лучше
-- честная галочка в форме, чем два выдуманных игрока в базе ради обхода.
-- Работает она только для парного. Микст — это мужчина и женщина по самому
-- смыслу слова, там исключений нет.
--
-- Парный счёт.
--
-- recalc_pair_stats считала только турнирные матчи: формат она брала из
-- турнира, а у баттла турнира нет. Теперь берёт и баттлы — формат у них
-- свой, состав пары лежит в самом вызове.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT (SELECT count(*) FROM challenges WHERE battle_published) AS баттлов,
       (SELECT count(*) FROM matches WHERE match_type = 'duel')  AS матчей_баттлов;


-- ---- 2. Формат и напарники ----------------------------------------------
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS format text DEFAULT 'singles';

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_format_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_format_check
    CHECK (format IN ('singles', 'doubles', 'mixed_doubles'));

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_partner_id       text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_partner_name     text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_partner_gender   text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_partner_id         text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_partner_name       text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_partner_gender     text;

-- Показательная игра вне правил: снимает проверку состава для этого баттла
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS allow_any_pair boolean DEFAULT false;

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_partner_gender_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_partner_gender_check CHECK (
    (challenger_partner_gender IS NULL OR challenger_partner_gender IN ('men','women')) AND
    (opponent_partner_gender   IS NULL OR opponent_partner_gender   IN ('men','women'))
);

-- В парном и миксте у каждой стороны обязан быть напарник: игрок клуба или
-- гость по имени. Половина пары — это не пара
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_partners_filled;
ALTER TABLE challenges ADD CONSTRAINT challenges_partners_filled CHECK (
    format = 'singles' OR (
        (challenger_partner_id IS NOT NULL OR challenger_partner_name IS NOT NULL) AND
        (opponent_partner_id   IS NOT NULL OR opponent_partner_name   IS NOT NULL)
    )
);


-- ---- 3. Состав пары по правилам -----------------------------------------
-- Проверку держит база, а не форма: форма подсказывает, база отвечает.
-- Ошибка «завёл микст как парный» иначе всплывёт через месяц, в статистике.
CREATE OR REPLACE FUNCTION public.check_battle_pair()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.format = 'singles' THEN
        RETURN NEW;
    END IF;

    -- Галочка «состав любой» послабляет только парный. Микст — это по
    -- определению мужчина и женщина: разреши там двоих одного пола, и слово
    -- «микст» на карточке перестанет что-либо значить
    IF NEW.format = 'doubles' AND NEW.allow_any_pair THEN
        RETURN NEW;
    END IF;

    -- Пол известен не всегда: у старых записей его нет, у гостя спрашивают
    -- в форме. Чего не знаем, того не проверяем — молча пропускаем
    IF NEW.format = 'doubles' THEN
        IF NEW.challenger_gender IS NOT NULL AND NEW.challenger_partner_gender IS NOT NULL
           AND NEW.challenger_gender <> NEW.challenger_partner_gender THEN
            RAISE EXCEPTION 'В парном баттле оба игрока пары одного пола';
        END IF;
        IF NEW.opponent_gender IS NOT NULL AND NEW.opponent_partner_gender IS NOT NULL
           AND NEW.opponent_gender <> NEW.opponent_partner_gender THEN
            RAISE EXCEPTION 'В парном баттле оба игрока пары одного пола';
        END IF;
    ELSIF NEW.format = 'mixed_doubles' THEN
        IF NEW.challenger_gender IS NOT NULL AND NEW.challenger_partner_gender IS NOT NULL
           AND NEW.challenger_gender = NEW.challenger_partner_gender THEN
            RAISE EXCEPTION 'В миксте в паре мужчина и женщина';
        END IF;
        IF NEW.opponent_gender IS NOT NULL AND NEW.opponent_partner_gender IS NOT NULL
           AND NEW.opponent_gender = NEW.opponent_partner_gender THEN
            RAISE EXCEPTION 'В миксте в паре мужчина и женщина';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.check_battle_pair() OWNER TO postgres;

DROP TRIGGER IF EXISTS trg_check_battle_pair ON public.challenges;

CREATE TRIGGER trg_check_battle_pair
    BEFORE INSERT OR UPDATE ON public.challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.check_battle_pair();


-- ---- 4. Баттлы в парный счёт -------------------------------------------
-- Прежняя версия считала только турнирные матчи: формат брался из турнира,
-- а у баттла турнира нет. Парный баттл не попадал никуда.
--
-- Победителем в матче записан капитан стороны — тот же, кто стоит в вызове
-- первым. Значит по нему и определяем, чья пара выиграла.
CREATE OR REPLACE FUNCTION public.recalc_pair_stats(p_ids text[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE players p
    SET doubles_wins = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id = r.player_id
        ) + (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN challenges c ON c.match_id = m.id
            WHERE c.format = 'doubles'
              AND m.winner_id IS NOT NULL
              AND ((p.id IN (c.challenger_player_id, c.challenger_partner_id)
                    AND m.winner_id = c.challenger_player_id)
                OR (p.id IN (c.opponent_player_id, c.opponent_partner_id)
                    AND m.winner_id = c.opponent_player_id))
        ),
        doubles_losses = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id IS NOT NULL
              AND m.winner_id <> r.player_id
        ) + (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN challenges c ON c.match_id = m.id
            WHERE c.format = 'doubles'
              AND m.winner_id IS NOT NULL
              AND ((p.id IN (c.challenger_player_id, c.challenger_partner_id)
                    AND m.winner_id <> c.challenger_player_id)
                OR (p.id IN (c.opponent_player_id, c.opponent_partner_id)
                    AND m.winner_id <> c.opponent_player_id))
        ),
        mixed_wins = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'mixed_doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id = r.player_id
        ) + (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN challenges c ON c.match_id = m.id
            WHERE c.format = 'mixed_doubles'
              AND m.winner_id IS NOT NULL
              AND ((p.id IN (c.challenger_player_id, c.challenger_partner_id)
                    AND m.winner_id = c.challenger_player_id)
                OR (p.id IN (c.opponent_player_id, c.opponent_partner_id)
                    AND m.winner_id = c.opponent_player_id))
        ),
        mixed_losses = (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN tournaments t ON t.id = m.tournament_id
            JOIN tournament_registrations r
              ON r.tournament_id = m.tournament_id
             AND (r.player_id = p.id OR r.partner_id = p.id)
            WHERE t.format = 'mixed_doubles'
              AND COALESCE(m.score, '') <> 'BYE'
              AND m.winner_id IS NOT NULL
              AND r.player_id IN (m.player1_id, m.player2_id)
              AND m.winner_id <> r.player_id
        ) + (
            SELECT count(DISTINCT m.id) FROM matches m
            JOIN challenges c ON c.match_id = m.id
            WHERE c.format = 'mixed_doubles'
              AND m.winner_id IS NOT NULL
              AND ((p.id IN (c.challenger_player_id, c.challenger_partner_id)
                    AND m.winner_id <> c.challenger_player_id)
                OR (p.id IN (c.opponent_player_id, c.opponent_partner_id)
                    AND m.winner_id <> c.opponent_player_id))
        )
    WHERE p.id = ANY(p_ids);
END;
$$;

ALTER FUNCTION public.recalc_pair_stats(text[]) OWNER TO postgres;
GRANT ALL ON FUNCTION public.recalc_pair_stats(text[]) TO authenticated;
GRANT ALL ON FUNCTION public.recalc_pair_stats(text[]) TO service_role;


-- ---- 5. Напарники в пересчёте после матча -------------------------------
-- У баттла нет заявки на турнир, поэтому напарников берём из самого вызова.
-- Иначе после парного баттла счёт менялся бы только у капитанов
CREATE OR REPLACE FUNCTION public.recalc_after_match()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    ids  text[];
    tid  text;
    mid  integer;
BEGIN
    IF TG_OP = 'DELETE' THEN
        ids := ARRAY(
            SELECT DISTINCT x FROM unnest(ARRAY[OLD.player1_id, OLD.player2_id]) AS x
            WHERE x IS NOT NULL
        );
        tid := OLD.tournament_id;
        mid := OLD.id;
    ELSE
        ids := ARRAY(
            SELECT DISTINCT x FROM unnest(ARRAY[
                NEW.player1_id, NEW.player2_id,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.player1_id END,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.player2_id END
            ]) AS x
            WHERE x IS NOT NULL
        );
        tid := NEW.tournament_id;
        mid := NEW.id;
    END IF;

    IF array_length(ids, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    -- Напарники капитанов из этого турнира
    IF tid IS NOT NULL THEN
        ids := ids || ARRAY(
            SELECT DISTINCT r.partner_id
            FROM tournament_registrations r
            WHERE r.tournament_id = tid
              AND r.player_id = ANY(ids)
              AND r.partner_id IS NOT NULL
        );
    END IF;

    -- Напарники из парного баттла
    ids := ids || ARRAY(
        SELECT DISTINCT x FROM (
            SELECT unnest(ARRAY[c.challenger_partner_id, c.opponent_partner_id]) AS x
            FROM challenges c WHERE c.match_id = mid
        ) q WHERE x IS NOT NULL
    );

    PERFORM public.recalc_player_categories(ids);
    PERFORM public.recalc_pair_stats(ids);

    PERFORM public.check_and_award_badges(pid) FROM unnest(ids) AS pid;

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.recalc_after_match() OWNER TO postgres;


-- ---- 5б. Пересчёт, когда баттл привязали к матчу ------------------------
-- Порядок записи такой: сначала создаётся матч, потом вызову проставляется
-- match_id. В момент вставки матча ни один вызов на него ещё не указывает —
-- значит напарников там не найти, и парный счёт им не обновится.
--
-- Ловим второй шаг: привязали матч к баттлу — пересчитали всех четверых.
CREATE OR REPLACE FUNCTION public.recalc_after_battle_link()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    ids text[];
BEGIN
    IF NEW.match_id IS NULL THEN
        RETURN NULL;
    END IF;

    ids := ARRAY(
        SELECT DISTINCT x FROM unnest(ARRAY[
            NEW.challenger_player_id, NEW.challenger_partner_id,
            NEW.opponent_player_id,   NEW.opponent_partner_id
        ]) AS x
        WHERE x IS NOT NULL
    );

    IF array_length(ids, 1) IS NULL THEN
        RETURN NULL;
    END IF;

    PERFORM public.recalc_pair_stats(ids);
    PERFORM public.check_and_award_badges(pid) FROM unnest(ids) AS pid;

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.recalc_after_battle_link() OWNER TO postgres;

DROP TRIGGER IF EXISTS trg_recalc_after_battle_link ON public.challenges;

CREATE TRIGGER trg_recalc_after_battle_link
    AFTER UPDATE OF match_id ON public.challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.recalc_after_battle_link();


-- ---- 6. Четверо на странице баттла --------------------------------------
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
               c.challenger_country, c.opponent_country,
               c.challenger_category, c.opponent_category,
               c.set_format,
               COALESCE(p1.name,    c.challenger_external_name) AS challenger_name,
               COALESCE(p1.name_en, c.challenger_external_name) AS challenger_name_en,
               COALESCE(p1.name_kg, c.challenger_external_name) AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses, p1.form AS challenger_form,
               p1.doubles_wins AS challenger_dbl_wins, p1.doubles_losses AS challenger_dbl_losses,
               p1.mixed_wins AS challenger_mix_wins, p1.mixed_losses AS challenger_mix_losses,
               p1.points AS challenger_points,
               p1.ntrp_rating AS challenger_player_ntrp,
               p1.country AS challenger_player_country,
               COALESCE(p2.name,    c.opponent_external_name) AS opponent_name,
               COALESCE(p2.name_en, c.opponent_external_name) AS opponent_name_en,
               COALESCE(p2.name_kg, c.opponent_external_name) AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses, p2.form AS opponent_form,
               p2.doubles_wins AS opponent_dbl_wins, p2.doubles_losses AS opponent_dbl_losses,
               p2.mixed_wins AS opponent_mix_wins, p2.mixed_losses AS opponent_mix_losses,
               p2.points AS opponent_points,
               p2.ntrp_rating AS opponent_player_ntrp,
               p2.country AS opponent_player_country,
               -- Вторые половины пар
               COALESCE(m1.name, c.challenger_partner_name) AS challenger_partner_display,
               m1.photo AS challenger_partner_photo,
               m1.category_id AS challenger_partner_cat,
               m1.ntrp_rating AS challenger_partner_ntrp,
               m1.doubles_wins AS challenger_partner_dbl_wins,
               m1.doubles_losses AS challenger_partner_dbl_losses,
               m1.mixed_wins AS challenger_partner_mix_wins,
               m1.mixed_losses AS challenger_partner_mix_losses,
               COALESCE(m2.name, c.opponent_partner_name) AS opponent_partner_display,
               m2.photo AS opponent_partner_photo,
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
GRANT ALL ON FUNCTION public.get_battle_public(uuid) TO service_role;


-- ---- 7. Пересчёт по всем ------------------------------------------------
SELECT public.recalc_pair_stats(ARRAY(SELECT id FROM players));


-- ---- 8. ПРОВЕРКА --------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenges'
        AND column_name IN ('format','challenger_partner_id','opponent_partner_id',
                            'challenger_partner_name','opponent_partner_name',
                            'challenger_partner_gender','opponent_partner_gender',
                            'allow_any_pair'))                       AS новых_колонок,
    (SELECT count(*) FROM pg_trigger
      WHERE tgrelid = 'public.challenges'::regclass
        AND tgname = 'trg_check_battle_pair')                        AS проверка_пары,
    (SELECT count(*) FROM pg_trigger
      WHERE tgrelid = 'public.challenges'::regclass
        AND tgname = 'trg_recalc_after_battle_link')                 AS пересчёт_после_баттла,
    (SELECT count(*) FROM players
      WHERE doubles_wins + doubles_losses + mixed_wins + mixed_losses > 0) AS игроков_с_парным_счётом;

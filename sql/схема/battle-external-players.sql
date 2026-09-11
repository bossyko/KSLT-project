-- ============================================
-- Баттлы: вписанный руками остаётся в баттле, а не в базе игроков
-- ============================================
--
-- Что не так сейчас.
--
-- В турнире человека со стороны заводят в заявку: player_id пустой,
-- is_external = true, имя в external_name. Карточки игрока не появляется,
-- в сетке имя идёт с пометкой EXT и ссылкой не становится — переходить некуда.
--
-- В баттле сделано иначе. Функция ensurePlayer в админке делает INSERT
-- в таблицу players: придумывает идентификатор из имени, ставит ноль очков
-- и кладёт человека в базу насовсем. Получается настоящая карточка, ничем
-- не отличимая от карточки члена клуба. Она попадает в поиск партнёра и в
-- блок «Найди партнёра» на главной — get_public_partners берёт всех, у кого
-- есть имя.
--
-- То есть каждый показательный матч с гостем оставлял в базе лишнего игрока
-- навсегда. С парными баттлами это стало бы вчетверо чаще.
--
-- Что делаем.
--
-- Выравниваем баттлы по турнирам: имя гостя живёт в самом вызове.
-- Заодно заводим пол — он нужен проверке пары: в парном оба одного пола,
-- в миксте разного. У членов клуба пол известен, у гостя его спрашивают.
--
-- Голосование.
--
-- Голос хранился как идентификатор игрока. У гостя идентификатора нет и не
-- будет, поэтому переводим голос на сторону: 1 — первая, 2 — вторая. Так уже
-- устроены кнопки в Telegram (bv:UUID:1), просто база об этом не знала.
--
-- Старую колонку оставляем и заполняем правилом: иначе запуск этого файла
-- и выкладку кода пришлось бы делать одной секундой, а между ними
-- голосование падало бы на первом голосе.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT (SELECT count(*) FROM challenges)                       AS вызовов,
       (SELECT count(*) FROM challenges
         WHERE battle_published)                               AS баттлов,
       (SELECT count(*) FROM challenge_predictions)            AS голосов;


-- ---- 2. Гость в вызове --------------------------------------------------
ALTER TABLE challenges ALTER COLUMN challenger_player_id DROP NOT NULL;
ALTER TABLE challenges ALTER COLUMN opponent_player_id   DROP NOT NULL;

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_external_name text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_external_name   text;

-- Пол нужен на вход, для проверки состава пары. Ни на карточке, ни на
-- странице баттла он не показывается
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenger_gender text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS opponent_gender   text;

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_gender_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_gender_check CHECK (
    (challenger_gender IS NULL OR challenger_gender IN ('men','women')) AND
    (opponent_gender   IS NULL OR opponent_gender   IN ('men','women'))
);

-- Сторона либо игрок клуба, либо гость по имени. Пустой она быть не может:
-- баттл без участника — это не баттл
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_side_filled;
ALTER TABLE challenges ADD CONSTRAINT challenges_side_filled CHECK (
    (challenger_player_id IS NOT NULL OR challenger_external_name IS NOT NULL) AND
    (opponent_player_id   IS NOT NULL OR opponent_external_name   IS NOT NULL)
);


-- ---- 3. Голос за сторону, а не за идентификатор -------------------------
ALTER TABLE challenge_predictions
    ADD COLUMN IF NOT EXISTS predicted_side smallint;

-- Прежние голоса переносим: сравниваем с составом баттла
UPDATE challenge_predictions cp
SET predicted_side = CASE
        WHEN cp.predicted_winner_id = c.challenger_player_id THEN 1
        WHEN cp.predicted_winner_id = c.opponent_player_id   THEN 2
        ELSE NULL
    END
FROM challenges c
WHERE c.id = cp.challenge_id
  AND cp.predicted_side IS NULL;

-- Голоса, которые не сошлись ни с одной стороной, — мусор: за кого именно
-- голосовали, восстановить нельзя, а в подсчёте они дают третий столбик
DELETE FROM challenge_predictions WHERE predicted_side IS NULL;

ALTER TABLE challenge_predictions DROP CONSTRAINT IF EXISTS challenge_predictions_side_check;
ALTER TABLE challenge_predictions
    ADD CONSTRAINT challenge_predictions_side_check CHECK (predicted_side IN (1, 2));

-- Колонку голоса по игроку оставляем и делаем необязательной.
--
-- Иначе миграцию и выкладку кода пришлось бы делать одной секундой: старый
-- вебхук пишет predicted_winner_id, новый — predicted_side. Между запуском
-- этого файла и обновлением функции голосование падало бы на первом голосе.
--
-- Правило ниже заполняет одно из другого, поэтому работают оба. Когда сайт,
-- приложение и функции обновятся, колонку и правило можно убрать — для
-- этого есть отдельный файл-уборщик.
ALTER TABLE challenge_predictions ALTER COLUMN predicted_winner_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.fill_prediction_side()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    c RECORD;
BEGIN
    SELECT challenger_player_id, opponent_player_id INTO c
    FROM challenges WHERE id = NEW.challenge_id;

    -- Пришёл старый способ: за кого голосовали — знаем, сторону выводим
    IF NEW.predicted_side IS NULL AND NEW.predicted_winner_id IS NOT NULL THEN
        IF NEW.predicted_winner_id = c.challenger_player_id THEN
            NEW.predicted_side := 1;
        ELSIF NEW.predicted_winner_id = c.opponent_player_id THEN
            NEW.predicted_side := 2;
        END IF;
    END IF;

    -- Пришёл новый: сторону знаем, идентификатор проставляем для старых
    -- экранов. У гостя баттла его нет — там колонка останется пустой
    IF NEW.predicted_winner_id IS NULL AND NEW.predicted_side IS NOT NULL THEN
        NEW.predicted_winner_id := CASE NEW.predicted_side
            WHEN 1 THEN c.challenger_player_id
            ELSE c.opponent_player_id END;
    END IF;

    IF NEW.predicted_side IS NULL THEN
        RAISE EXCEPTION 'Голос ни за одну из сторон баттла';
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.fill_prediction_side() OWNER TO postgres;

DROP TRIGGER IF EXISTS trg_fill_prediction_side ON public.challenge_predictions;

CREATE TRIGGER trg_fill_prediction_side
    BEFORE INSERT ON public.challenge_predictions
    FOR EACH ROW
    EXECUTE FUNCTION public.fill_prediction_side();


-- ---- 4. Подсчёт голосов -------------------------------------------------
-- Возвращаем и сторону, и идентификатор игрока. Идентификатор нужен, пока
-- сайт и приложение считают голоса по нему; у гостя он пустой. Когда все
-- экраны перейдут на сторону, колонку можно убрать.
DROP FUNCTION IF EXISTS public.get_battle_votes(uuid);

CREATE OR REPLACE FUNCTION public.get_battle_votes(p_challenge_id uuid)
RETURNS TABLE(side smallint, player_id text, votes bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT cp.predicted_side AS side,
           CASE WHEN cp.predicted_side = 1
                THEN c.challenger_player_id
                ELSE c.opponent_player_id END AS player_id,
           count(*) AS votes
    FROM challenge_predictions cp
    JOIN challenges c ON c.id = cp.challenge_id
    WHERE cp.challenge_id = p_challenge_id
    GROUP BY cp.predicted_side, c.challenger_player_id, c.opponent_player_id;
$$;

ALTER FUNCTION public.get_battle_votes(uuid) OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_battle_votes(uuid) TO anon;
GRANT ALL ON FUNCTION public.get_battle_votes(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_battle_votes(uuid) TO service_role;


-- ---- 5. Приём голоса ----------------------------------------------------
-- Принимает и сторону, и старый идентификатор игрока: сайт обновится
-- отдельно от базы, и между запуском этого файла и выкладкой страниц
-- голосование не должно ломаться. Идентификатор превращается в сторону
-- здесь же, второй логики подсчёта не заводим.
DROP FUNCTION IF EXISTS public.cast_battle_vote(uuid, text);

CREATE OR REPLACE FUNCTION public.cast_battle_vote(
    p_challenge_id uuid,
    p_player_id text DEFAULT NULL,
    p_side smallint DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_challenge RECORD;
    v_side      smallint;
    v_existing  smallint;
    v_tg_chat   text;
    v_tg_vote   smallint;
    v_match_dt  timestamptz;
BEGIN
    -- Встречного предложения больше нет: дату и место задаёт менеджер,
    -- колонки counter_* удалены прежней миграцией
    SELECT battle_published, voting_closed,
           challenger_player_id, opponent_player_id,
           proposed_date AS match_date,
           proposed_time AS match_time
    INTO v_challenge
    FROM challenges WHERE id = p_challenge_id;

    IF v_challenge IS NULL OR v_challenge.battle_published = false THEN
        RETURN json_build_object('ok', false, 'error', 'not_found');
    END IF;

    IF v_challenge.voting_closed THEN
        RETURN json_build_object('ok', false, 'error', 'voting_closed');
    END IF;

    -- За кого голос. Раньше сюда принимали любой идентификатор и писали его
    -- как есть: проголосовать можно было за постороннего игрока, и он
    -- попадал в проценты. Теперь сторона либо определяется, либо отказ
    v_side := p_side;
    IF v_side IS NULL AND p_player_id IS NOT NULL THEN
        IF p_player_id = v_challenge.challenger_player_id THEN
            v_side := 1;
        ELSIF p_player_id = v_challenge.opponent_player_id THEN
            v_side := 2;
        END IF;
    END IF;

    IF v_side IS NULL OR v_side NOT IN (1, 2) THEN
        RETURN json_build_object('ok', false, 'error', 'bad_side');
    END IF;

    -- Голосование закрывается само, когда начался матч
    IF v_challenge.match_date IS NOT NULL AND v_challenge.match_time IS NOT NULL THEN
        v_match_dt := (v_challenge.match_date::text || ' ' || v_challenge.match_time)::timestamp
                      AT TIME ZONE 'Asia/Bishkek';
        IF NOW() >= v_match_dt THEN
            UPDATE challenges SET voting_closed = true WHERE id = p_challenge_id;
            RETURN json_build_object('ok', false, 'error', 'voting_closed');
        END IF;
    END IF;

    SELECT predicted_side INTO v_existing
    FROM challenge_predictions
    WHERE challenge_id = p_challenge_id
      AND voter_type = 'site'
      AND voter_id = auth.uid()::text;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object('ok', false, 'error', 'already_voted');
    END IF;

    -- Тот же человек мог проголосовать из Telegram
    SELECT telegram_chat_id::text INTO v_tg_chat FROM profiles WHERE id = auth.uid();

    IF v_tg_chat IS NOT NULL THEN
        SELECT predicted_side INTO v_tg_vote
        FROM challenge_predictions
        WHERE challenge_id = p_challenge_id
          AND voter_type = 'telegram'
          AND voter_id = v_tg_chat;

        IF v_tg_vote IS NOT NULL THEN
            RETURN json_build_object('ok', false, 'error', 'already_voted_tg');
        END IF;
    END IF;

    INSERT INTO challenge_predictions (challenge_id, voter_type, voter_id, predicted_side)
    VALUES (p_challenge_id, 'site', auth.uid()::text, v_side);

    RETURN json_build_object('ok', true, 'side', v_side);
END;
$$;

ALTER FUNCTION public.cast_battle_vote(uuid, text, smallint) OWNER TO postgres;
GRANT ALL ON FUNCTION public.cast_battle_vote(uuid, text, smallint) TO authenticated;
GRANT ALL ON FUNCTION public.cast_battle_vote(uuid, text, smallint) TO service_role;


-- ---- 6. Колонку голоса по игроку пока не трогаем ------------------------
-- Она остаётся, пока не обновятся сайт, приложение и функции. Убрать её
-- вместе с правилом — отдельным файлом, sql/battle-vote-cleanup.sql


-- ---- 7. Имя гостя вместо имени игрока ----------------------------------
-- Соединение с игроками становится необязательным: у гостя строки в players
-- нет. Имя берём его, из вызова.
CREATE OR REPLACE FUNCTION public.get_battle_public(p_challenge_id uuid)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT row_to_json(r) FROM (
        SELECT c.id, c.battle_title, c.status, c.voting_closed,
               c.proposed_date, c.proposed_time, c.proposed_venue,
               c.challenger_player_id, c.opponent_player_id, c.match_id,
               c.battle_published_at, c.banner_url,
               c.challenger_ntrp, c.opponent_ntrp,
               c.challenger_country, c.opponent_country,
               c.challenger_category, c.opponent_category,
               c.set_format,
               COALESCE(p1.name,    c.challenger_external_name) AS challenger_name,
               COALESCE(p1.name_en, c.challenger_external_name) AS challenger_name_en,
               COALESCE(p1.name_kg, c.challenger_external_name) AS challenger_name_kg,
               p1.photo AS challenger_photo, p1.category_id AS challenger_cat,
               p1.wins AS challenger_wins, p1.losses AS challenger_losses,
               p1.points AS challenger_points,
               p1.ntrp_rating AS challenger_player_ntrp,
               p1.country AS challenger_player_country,
               COALESCE(p2.name,    c.opponent_external_name) AS opponent_name,
               COALESCE(p2.name_en, c.opponent_external_name) AS opponent_name_en,
               COALESCE(p2.name_kg, c.opponent_external_name) AS opponent_name_kg,
               p2.photo AS opponent_photo, p2.category_id AS opponent_cat,
               p2.wins AS opponent_wins, p2.losses AS opponent_losses,
               p2.points AS opponent_points,
               p2.ntrp_rating AS opponent_player_ntrp,
               p2.country AS opponent_player_country,
               ct.google_maps_url AS court_google_maps,
               ct.twogis_url AS court_twogis
        FROM challenges c
        LEFT JOIN players p1 ON p1.id = c.challenger_player_id
        LEFT JOIN players p2 ON p2.id = c.opponent_player_id
        LEFT JOIN courts ct ON ct.id = c.proposed_court_id
        WHERE c.id = p_challenge_id
          AND c.battle_published = true
    ) r;
$$;

ALTER FUNCTION public.get_battle_public(uuid) OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_battle_public(uuid) TO anon;
GRANT ALL ON FUNCTION public.get_battle_public(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_battle_public(uuid) TO service_role;


-- ---- 8. ПРОВЕРКА --------------------------------------------------------
SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenges'
        AND column_name IN ('challenger_external_name','opponent_external_name',
                            'challenger_gender','opponent_gender'))        AS новых_колонок,
    (SELECT count(*) FROM pg_trigger
      WHERE tgrelid = 'public.challenge_predictions'::regclass
        AND tgname = 'trg_fill_prediction_side')                           AS мост_голосов,
    (SELECT count(*) FROM challenge_predictions WHERE predicted_side IN (1,2)) AS голосов_перенесено,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenges' AND column_name = 'challenger_player_id'
        AND is_nullable = 'YES')                                           AS гость_разрешён;

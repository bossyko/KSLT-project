-- ============================================
-- Вызов на баттл: правила переезжают в базу
-- ============================================
--
-- Что было не так.
--
-- Принять вызов можно было ТОЛЬКО из Telegram: create-challenge слала боту
-- сообщение с кнопками, а нажатия ловил telegram-webhook. На сайте кнопок не
-- было вовсе. Игроку без бота вызов даже не отправлялся — функция отвечала
-- «no_telegram». То есть ключевое действие жило в чужом мессенджере, а
-- половина клуба до фичи не допускалась.
--
-- Вызов заводился прямым INSERT из двух мест — с сайта и из приложения.
-- Проверить при этом ни членство, ни лимиты нельзя: правило, которое живёт
-- в интерфейсе, обходится одним запросом.
--
-- Дата, время и площадка спрашивались в момент отправки. Смысла в них нет:
-- корт назначает не вызывающий, а менеджер после того, как соперник
-- согласится. К тому времени выбранная дата успевает устареть.
--
-- Что делаем.
--
--   create_challenge   — единственный способ завести вызов. Правила внутри:
--                        членство KSLT, не больше трёх неотвеченных сразу,
--                        один вызов на человека, и запрет звать того, с кем
--                        матч уже назначен. Отказ ничего не запрещает:
--                        отклонить могли случайно.
--   respond_to_challenge — принять или отклонить, только адресат.
--   cancel_challenge   — отозвать, только автор и только пока ждёт ответа.
--                        Запись остаётся в истории у обоих с пометкой.
--
-- Срок ожидания ответа — 10 дней вместо прежних трёх суток.
--
-- КАК ЗАПУСКАТЬ: ничего не выделяй мышью, поставь курсор в текст и нажми
-- Ctrl+Enter. Ответ последнего запроса и есть проверка.


-- ---- 1. Куда я попал --------------------------------------------------
SELECT count(*) AS всего_игроков,
       (SELECT count(*) FROM players WHERE id LIKE 'test-%') AS тестовых
FROM players;


-- ---- 2. Поля ----------------------------------------------------------
-- Дата и время перестают быть обязательными: их теперь никто не вводит
ALTER TABLE public.challenges ALTER COLUMN proposed_date DROP NOT NULL;
ALTER TABLE public.challenges ALTER COLUMN proposed_time DROP NOT NULL;

-- Кто и когда отозвал. Нужно, чтобы обе стороны видели не просто
-- «вызова больше нет», а кто именно передумал
ALTER TABLE public.challenges
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_by uuid;

-- Встречное предложение умирает вместе с датой: переторговываться по
-- времени больше не о чем, место назначает менеджер
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_counter_step_check;
ALTER TABLE public.challenges
    DROP COLUMN IF EXISTS counter_date,
    DROP COLUMN IF EXISTS counter_time,
    DROP COLUMN IF EXISTS counter_venue,
    DROP COLUMN IF EXISTS counter_court_id,
    DROP COLUMN IF EXISTS counter_step,
    DROP COLUMN IF EXISTS countered_at;

-- Срок ожидания — 10 дней
ALTER TABLE public.challenges
    ALTER COLUMN expires_at SET DEFAULT (now() + interval '10 days');

COMMENT ON COLUMN public.challenges.cancelled_by IS
    'Кто отозвал вызов. Запись остаётся в истории обеих сторон.';


-- ---- 2б. Уведомление умеет вести к действию ----------------------------
-- Уведомление о вызове несёт две кнопки. Чтобы интерфейс знал, к чему они
-- относятся, у записи появляется предмет: тип и ссылка на него. Колонка
-- data тут не годится — по ней не поискать и не выстроить правило.
ALTER TABLE public.notification_log
    ADD COLUMN IF NOT EXISTS action_type text,
    ADD COLUMN IF NOT EXISTS action_id uuid;

COMMENT ON COLUMN public.notification_log.action_type IS
    'К чему уведомление зовёт: challenge — вызов на баттл, кнопки «Принять» и «Отклонить».';


-- ---- 3. Завести вызов ---------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."create_challenge"(
    "p_opponent_player_id" "text", "p_message" "text" DEFAULT NULL)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    me            profiles%ROWTYPE;
    opp_profile   uuid;
    pending_count int;
    new_id        uuid;
BEGIN
    SELECT * INTO me FROM profiles WHERE id = auth.uid();
    IF me.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_logged_in');
    END IF;
    IF me.player_id IS NULL THEN
        RETURN jsonb_build_object('error', 'no_player');
    END IF;
    IF me.player_id = p_opponent_player_id THEN
        RETURN jsonb_build_object('error', 'self_challenge');
    END IF;

    -- Вызов на баттл — привилегия членства, а не всякой учётной записи.
    -- Сотрудникам клуба разрешено без членства: им заводить показательные
    -- матчи по должности
    IF me.role NOT IN ('admin', 'manager') AND NOT EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.profile_id = me.id AND m.status = 'active'
          AND (m.expires_at IS NULL OR m.expires_at >= current_date)
    ) THEN
        RETURN jsonb_build_object('error', 'not_member');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_opponent_player_id) THEN
        RETURN jsonb_build_object('error', 'opponent_not_found');
    END IF;

    -- Спам — это не «много вызовов», а много неотвеченных разом. Ответили
    -- или срок вышел — место освободилось
    SELECT count(*) INTO pending_count
    FROM challenges
    WHERE challenger_id = me.id AND status = 'active' AND expires_at > now();

    IF pending_count >= 3 THEN
        RETURN jsonb_build_object('error', 'too_many_pending', 'pending', pending_count);
    END IF;

    -- Один неотвеченный вызов на человека: второй — это уже напоминание.
    -- Смотрим в обе стороны: если он уже позвал тебя, встречный вызов —
    -- это тот же матч, только заведённый дважды
    IF EXISTS (
        SELECT 1 FROM challenges
        WHERE status = 'active' AND expires_at > now()
          AND ((challenger_player_id = me.player_id AND opponent_player_id = p_opponent_player_id)
            OR (challenger_player_id = p_opponent_player_id AND opponent_player_id = me.player_id))
    ) THEN
        RETURN jsonb_build_object('error', 'already_pending');
    END IF;

    -- Вызов принят, но матч ещё не сыгран — звать снова некуда: игра уже
    -- назначена. Отказ, наоборот, ничего не запрещает: человек мог нажать
    -- случайно или передумать
    IF EXISTS (
        SELECT 1 FROM challenges
        WHERE status = 'accepted'
          AND ((challenger_player_id = me.player_id AND opponent_player_id = p_opponent_player_id)
            OR (challenger_player_id = p_opponent_player_id AND opponent_player_id = me.player_id))
    ) THEN
        RETURN jsonb_build_object('error', 'match_pending');
    END IF;

    SELECT id INTO opp_profile FROM profiles WHERE player_id = p_opponent_player_id LIMIT 1;

    INSERT INTO challenges (challenger_id, challenger_player_id,
                            opponent_player_id, opponent_profile_id,
                            message, status, expires_at)
    VALUES (me.id, me.player_id, p_opponent_player_id, opp_profile,
            nullif(btrim(coalesce(p_message, '')), ''), 'active',
            now() + interval '10 days')
    RETURNING id INTO new_id;

    RETURN jsonb_build_object('ok', true, 'challenge_id', new_id,
                              'opponent_profile_id', opp_profile);
END;
$$;

ALTER FUNCTION "public"."create_challenge"("text", "text") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."create_challenge"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_challenge"("text", "text") TO "service_role";


-- ---- 4. Ответить на вызов ----------------------------------------------
CREATE OR REPLACE FUNCTION "public"."respond_to_challenge"(
    "p_id" "uuid", "p_accept" boolean)
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    ch         challenges%ROWTYPE;
    chal_name  text;
    opp_name   text;
    note_title text;
    note_text  text;
    push_row   uuid;
    sent_count int;
BEGIN
    SELECT * INTO ch FROM challenges WHERE id = p_id;
    IF ch.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    -- Отвечает только тот, кого вызвали
    IF ch.opponent_profile_id IS DISTINCT FROM auth.uid() THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    -- Уведомление — снимок момента: к нажатию на кнопку могли уже ответить
    -- или срок мог выйти. Молча перезаписывать чужой ответ нельзя
    IF ch.status <> 'active' THEN
        RETURN jsonb_build_object('error', 'already_answered', 'status', ch.status);
    END IF;
    IF ch.expires_at <= now() THEN
        UPDATE challenges SET status = 'expired' WHERE id = p_id;
        RETURN jsonb_build_object('error', 'expired');
    END IF;

    UPDATE challenges
    SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
        accepted_at = CASE WHEN p_accept THEN now() ELSE NULL END
    WHERE id = p_id;

    -- Вызов приняли — об этом знает весь клуб. Публичной страницы у баттла
    -- ещё нет: дату и место назначит менеджер, а пока идёт анонс.
    --
    -- Идём тем же путём, что и ручная рассылка: строка в журнале плюс по
    -- строке каждому получателю, связанные push_id. Иначе автоматическое
    -- уведомление нельзя было бы ни отозвать, ни удалить — а мы это чинили
    -- отдельной задачей.
    IF p_accept THEN
        SELECT full_name INTO chal_name FROM profiles WHERE id = ch.challenger_id;
        SELECT full_name INTO opp_name FROM profiles WHERE id = ch.opponent_profile_id;
        note_title := '🔥 Скоро баттл';
        note_text  := COALESCE(chal_name, 'Игрок') || ' и ' || COALESCE(opp_name, 'игрок') ||
                      ' сыграют показательный матч. Дату и место объявим в ближайшее время.';

        INSERT INTO push_log (admin_id, title, message, type, audience, recipients_count, fcm_sent)
        VALUES (NULL, note_title, note_text, 'battle', 'all', 0, 0)
        RETURNING id INTO push_row;

        -- Участников не тревожим: они и так знают. Остальные получают, если
        -- не отключили баттлы в настройках
        INSERT INTO notification_log (profile_id, type, title, message, is_read, push_id)
        SELECT p.id, 'battle', note_title, note_text, false, push_row
        FROM profiles p
        WHERE p.id <> ch.challenger_id
          AND (ch.opponent_profile_id IS NULL OR p.id <> ch.opponent_profile_id)
          AND COALESCE(p.notify_preferences #>> '{site,challenges}', 'true') <> 'false';

        GET DIAGNOSTICS sent_count = ROW_COUNT;
        UPDATE push_log SET recipients_count = sent_count WHERE id = push_row;
    END IF;

    RETURN jsonb_build_object('ok', true,
        'status', CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
        'challenger_player_id', ch.challenger_player_id,
        'opponent_player_id', ch.opponent_player_id);
END;
$$;

ALTER FUNCTION "public"."respond_to_challenge"("uuid", boolean) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."respond_to_challenge"("uuid", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_challenge"("uuid", boolean) TO "service_role";


-- ---- 5. Отозвать свой вызов --------------------------------------------
CREATE OR REPLACE FUNCTION "public"."cancel_challenge"("p_id" "uuid")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    ch challenges%ROWTYPE;
BEGIN
    SELECT * INTO ch FROM challenges WHERE id = p_id;
    IF ch.id IS NULL THEN
        RETURN jsonb_build_object('error', 'not_found');
    END IF;

    IF ch.challenger_id IS DISTINCT FROM auth.uid() THEN
        RETURN jsonb_build_object('error', 'forbidden');
    END IF;

    IF ch.status <> 'active' THEN
        RETURN jsonb_build_object('error', 'already_answered', 'status', ch.status);
    END IF;

    -- Запись не удаляем: у обеих сторон в истории остаётся, что вызов был
    -- и кто передумал. Чтобы позвать снова, заводят новый — со страницы
    -- игрока, как и первый раз
    UPDATE challenges
    SET status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
    WHERE id = p_id;

    RETURN jsonb_build_object('ok', true);
END;
$$;

ALTER FUNCTION "public"."cancel_challenge"("uuid") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."cancel_challenge"("uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_challenge"("uuid") TO "service_role";


-- ---- 6. Прямой INSERT закрыт -------------------------------------------
-- Правило, которое живёт только в интерфейсе, обходится одним запросом.
-- Единственная дверь — create_challenge
DROP POLICY IF EXISTS "challenges_insert" ON "public"."challenges";


-- ---- 7. Список вызовов знает про отзыв ---------------------------------
CREATE OR REPLACE FUNCTION "public"."get_my_challenges"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
      result json;
  BEGIN
      SELECT json_agg(row_to_json(t)) INTO result
      FROM (
          SELECT
              c.id, c.status, c.proposed_date, c.proposed_time,
              c.proposed_venue, c.message, c.created_at, c.expires_at,
              c.accepted_at, c.match_id,
              c.cancelled_at, c.cancelled_by,
              CASE WHEN c.challenger_id = auth.uid() THEN 'sent' ELSE 'received' END AS direction,
              c.challenger_player_id,
              cp.full_name AS challenger_name,
              COALESCE(cp.avatar_url, cpl.photo) AS challenger_avatar,
              c.opponent_player_id,
              op.full_name AS opponent_name,
              COALESCE(op.avatar_url, opl.photo) AS opponent_avatar,
              ct.name AS court_name,
              COALESCE(m.score, c.score_draft) AS match_score,
              m.winner_id AS match_winner_id,
              c.battle_published,
              c.battle_title
          FROM challenges c
          LEFT JOIN profiles cp ON cp.id = c.challenger_id
          LEFT JOIN profiles op ON op.id = c.opponent_profile_id
          LEFT JOIN players cpl ON cpl.id = c.challenger_player_id
          LEFT JOIN players opl ON opl.id = c.opponent_player_id
          LEFT JOIN courts ct ON ct.id = c.proposed_court_id
          LEFT JOIN matches m ON m.id = c.match_id
          WHERE c.challenger_id = auth.uid()
             OR c.opponent_profile_id = auth.uid()
          ORDER BY c.created_at DESC
          LIMIT 50
      ) t;
      RETURN COALESCE(result, '[]'::json);
  END;
  $$;

ALTER FUNCTION "public"."get_my_challenges"() OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_challenges"() TO "authenticated";


-- ---- 8. Приглашения отдают, с кем именно -------------------------------
-- Без идентификатора игрока имя в кабинете нельзя было сделать ссылкой
DROP FUNCTION IF EXISTS "public"."get_my_game_invites"();
CREATE OR REPLACE FUNCTION "public"."get_my_game_invites"()
RETURNS TABLE("id" "uuid", "status" "text", "created_at" timestamp with time zone,
              "responded_at" timestamp with time zone, "direction" "text",
              "partner_name" "text", "partner_avatar" "text", "partner_player_id" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT gi.id, gi.status, gi.created_at, gi.responded_at,
        'sent'::TEXT, pl.name, COALESCE(pr2.avatar_url, pl.photo), pl.id
    FROM game_invites gi
    JOIN players pl ON pl.id = gi.receiver_player_id
    LEFT JOIN profiles pr2 ON pr2.player_id = pl.id
    WHERE gi.sender_id = auth.uid()
    UNION ALL
    SELECT gi.id, gi.status, gi.created_at, gi.responded_at,
        'received'::TEXT, pr_s.full_name, pr_s.avatar_url, pr_s.player_id
    FROM game_invites gi
    JOIN profiles pr_s ON pr_s.id = gi.sender_id
    WHERE gi.receiver_profile_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 20;
$$;

ALTER FUNCTION "public"."get_my_game_invites"() OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_my_game_invites"() TO "authenticated";


-- ---- 8б. Уведомление не переживает свой вызов --------------------------
-- Удалили вызов — уведомление о нём осталось висеть в колокольчике с
-- кнопками «Принять» и «Отклонить», ведущими в никуда. Правило вешаем на
-- базу, а не на интерфейс: строку могут удалить и запросом напрямую.
CREATE OR REPLACE FUNCTION "public"."drop_challenge_notifications"()
RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM notification_log
    WHERE action_type = 'challenge' AND action_id = OLD.id;
    RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."drop_challenge_notifications"() OWNER TO "postgres";

DROP TRIGGER IF EXISTS trg_drop_challenge_notifications ON public.challenges;
CREATE TRIGGER trg_drop_challenge_notifications
    AFTER DELETE ON public.challenges
    FOR EACH ROW EXECUTE FUNCTION public.drop_challenge_notifications();

-- Подчистить то, что уже осиротело
DELETE FROM notification_log n
WHERE n.action_type = 'challenge'
  AND n.action_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM challenges c WHERE c.id = n.action_id);


-- ---- 9. ПРОВЕРКА -------------------------------------------------------
SELECT
    (SELECT count(*) FROM pg_proc WHERE proname IN
        ('create_challenge', 'respond_to_challenge', 'cancel_challenge')) AS функций_из_трёх,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenges' AND column_name = 'cancelled_by') AS отметка_отзыва,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'challenges' AND column_name LIKE 'counter%') AS осталось_полей_торга,
    (SELECT count(*) FROM pg_policies
      WHERE tablename = 'challenges' AND policyname = 'challenges_insert') AS прямой_insert_открыт,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_name = 'notification_log' AND column_name = 'action_type') AS уведомление_с_действием,
    (SELECT count(*) FROM pg_trigger
      WHERE tgname = 'trg_drop_challenge_notifications') AS уборка_уведомлений,
    (SELECT count(*) FROM notification_log n
      WHERE n.action_type = 'challenge' AND n.action_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM challenges c WHERE c.id = n.action_id)) AS осиротевших;

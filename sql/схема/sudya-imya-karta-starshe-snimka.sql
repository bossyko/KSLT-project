-- RPC СУДЬИ: КАРТОЧКА СТАРШЕ СНИМКА. 13.11, кусок f21, шестое место.
--
-- ЧТО НЕ ТАК. Рядом со ссылкой на игрока в `live_matches` лежит строка
-- `player1_name` — СНИМОК имени на момент создания трансляции. Снимок
-- нужен там, где карточки нет вовсе: гость без профиля и сам экран
-- судьи, который ходит по ключу и игроков не видит.
--
-- Но старшинство было обратным. Замер 13.11 нашёл ПЯТЬ читателей этой
-- пары в коде и два разных порядка; пять приведены к одному — карточка
-- на языке страницы, карточка, снимок. Шестое место оказалось здесь, на
-- сервере:
--
--     COALESCE(v_match.player1_name, v_p1.name)
--
-- Снимок первый, карточка вторая. А так как админка в режимах «турнир»
-- и «вызов» пишет снимок ВСЕГДА, он всегда и побеждал: переименовали
-- человека в карточке — судья до конца матча видит старое имя.
--
-- СНИМОК НЕ МОЖЕТ БЫТЬ СТАРШЕ ЖИВОГО. Карточка — живое имя человека,
-- снимок — слепок на момент создания. Порядок переворачивается.
--
-- ЧТО НЕ МЕНЯЕТСЯ. Поля `player1_name_en` и `player2_name_en` остаются
-- как были: экран судьи русский, языки туда не подключаются (слово
-- Кости 13.11), и эти поля он не читает. Трогать их незачем.
--
-- ОСТАЛЬНОЕ ТЕЛО ФУНКЦИИ ПЕРЕНЕСЕНО СЛОВО В СЛОВО из снимка схемы
-- `sql/схема/schema-snapshot.sql:3509`. Менялись ровно две строки.
--
-- ПРОВЕРЯЕТСЯ ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success»: запрос внизу.

CREATE OR REPLACE FUNCTION public.get_live_by_umpire_key(p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_match RECORD;
    v_p1 RECORD;
    v_p2 RECORD;
BEGIN
    SELECT * INTO v_match FROM live_matches WHERE umpire_key = p_key;
    IF v_match IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Not found');
    END IF;

    -- Get player info
    SELECT id, name, name_en, photo INTO v_p1 FROM players WHERE id = v_match.player1_id;
    SELECT id, name, name_en, photo INTO v_p2 FROM players WHERE id = v_match.player2_id;

    RETURN jsonb_build_object(
        'ok', true,
        'match', jsonb_build_object(
            'id', v_match.id,
            'match_id', v_match.match_id,
            'best_of', v_match.best_of,
            'youtube_url', v_match.youtube_url,
            'serving_player', v_match.serving_player,
            'points_p1', v_match.points_p1,
            'points_p2', v_match.points_p2,
            'current_set', v_match.current_set,
            'sets_data', v_match.sets_data,
            'current_game_p1', v_match.current_game_p1,
            'current_game_p2', v_match.current_game_p2,
            'is_tiebreak', v_match.is_tiebreak,
            'tiebreak_p1', v_match.tiebreak_p1,
            'tiebreak_p2', v_match.tiebreak_p2,
            'status', v_match.status,
            'winner_player', v_match.winner_player,
            'final_score', v_match.final_score,
            'history', v_match.history,
            'tournament_label', v_match.tournament_label,
            -- КАРТОЧКА СТАРШЕ СНИМКА (13.11): было наоборот.
            'player1_name', COALESCE(v_p1.name, v_match.player1_name),
            'player2_name', COALESCE(v_p2.name, v_match.player2_name),
            'player1_name_en', v_p1.name_en,
            'player2_name_en', v_p2.name_en,
            'player1_photo', v_p1.photo,
            'player2_photo', v_p2.photo
        )
    );
END;
$function$;

-- ПРОВЕРКА. Порядок должен читаться как «карточка, потом снимок».
-- Ждём две строки с COALESCE(v_p1.name, ...) и COALESCE(v_p2.name, ...).
SELECT regexp_replace(line, '^\s+', '') AS stroka
  FROM unnest(string_to_array(
         (SELECT pg_get_functiondef(p.oid)
            FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'get_live_by_umpire_key'),
         E'\n')) AS line
 WHERE line LIKE '%player1_name%' OR line LIKE '%player2_name%';

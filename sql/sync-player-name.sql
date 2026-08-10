-- ============================================
-- Имя игрока следует за именем в профиле
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Имя хранилось в двух местах и не связывалось:
--
--   profiles.full_name — то, что игрок задаёт в кабинете
--   players.name       — то, под чем он виден в рейтинге и на карточке
--
-- Игрок менял имя у себя, а в рейтинге оставалось прежнее. Между тем имя
-- принадлежит человеку: девушка вышла замуж, сменила фамилию — и она должна
-- разойтись везде сама, а не через просьбу к менеджеру.
--
-- Перевод имени при этом сбрасывается. У 163 игроков заполнено отдельное имя
-- латиницей; если фамилия сменилась, оно устареет — по-русски «Цветкова», а
-- на английской версии сайта всё ещё «Popkova». Пустое поле безопаснее: сайт
-- показывает основное имя, а латиницу менеджер впишет заново, когда захочет.

CREATE OR REPLACE FUNCTION sync_player_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.player_id IS NOT NULL
       AND NEW.full_name IS NOT NULL
       AND btrim(NEW.full_name) <> ''
       AND NEW.full_name IS DISTINCT FROM OLD.full_name
    THEN
        UPDATE players
        SET name    = NEW.full_name,
            name_en = NULL,     -- перевод устарел вместе с именем
            name_kg = NULL
        WHERE id = NEW.player_id
          AND name IS DISTINCT FROM NEW.full_name;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_player_name() IS
    'Имя в рейтинге следует за именем в профиле: его задаёт сам игрок';

DROP TRIGGER IF EXISTS trg_sync_player_name ON profiles;

CREATE TRIGGER trg_sync_player_name
    AFTER UPDATE OF full_name ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_player_name();

-- --- Разовое выравнивание -----------------------------------------------
-- Там, где имена уже разошлись, берём то, что стоит у игрока в профиле.

UPDATE players pl
SET name    = p.full_name,
    name_en = NULL,
    name_kg = NULL
FROM profiles p
WHERE p.player_id = pl.id
  AND p.full_name IS NOT NULL
  AND btrim(p.full_name) <> ''
  AND pl.name IS DISTINCT FROM p.full_name;

-- --- Проверка -----------------------------------------------------------

SELECT p.full_name AS в_профиле,
       pl.name     AS в_рейтинге,
       pl.name_en  AS латиницей
FROM profiles p
JOIN players pl ON pl.id = p.player_id
ORDER BY p.full_name
LIMIT 20;

-- ============================================
-- Имя латиницей и фото игрока следуют за профилем
-- Запустить в Supabase SQL Editor целиком, после sync-player-name.sql
-- ============================================
--
-- Две вещи, которые остались после связки имени.
--
-- 1. Перевод имени очищался. На английской версии сайта человек с именем
--    «Иван Иванов» выглядел кириллицей: поле name_en пустое, и страница
--    показывала основное имя. Логично видеть там латиницу.
--
--    Писать имя дважды никто не станет, поэтому переводим сами. Правило
--    механическое, ошибиться в нём негде: й → y, ж → zh, щ → shch. Кыргызские
--    буквы тоже: ң → ng, ө → o, ү → u. Если менеджер захочет другое написание,
--    он поправит поле руками — до следующей смены имени.
--
-- 2. Фото. Аватар лежит в профиле, а список рейтинга и поиск партнёра читают
--    players.photo — оно у большинства пустое. Человек менял фотографию в
--    кабинете и не находил её нигде, кроме своей страницы.

CREATE OR REPLACE FUNCTION translit_ru(src TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    -- Буквы, дающие несколько латинских: их заменяем по одной
    pairs CONSTANT TEXT[][] := ARRAY[
        ['щ','shch'], ['ж','zh'], ['ч','ch'], ['ш','sh'], ['ц','ts'],
        ['х','kh'],   ['ю','yu'], ['я','ya'], ['ё','e'],  ['ң','ng']
    ];
    out TEXT;
    i INT;
BEGIN
    IF src IS NULL OR btrim(src) = '' THEN
        RETURN NULL;
    END IF;

    out := lower(src);

    FOR i IN 1 .. array_length(pairs, 1) LOOP
        out := replace(out, pairs[i][1], pairs[i][2]);
    END LOOP;

    -- Остальные — одна к одной. Твёрдый и мягкий знаки исчезают: в конце
    -- строки замен их пары нет, и translate такие буквы удаляет.
    out := translate(
        out,
        'абвгдезийклмнопрстуфыэөүъь',
        'abvgdeziyklmnoprstufyeou'
    );

    RETURN initcap(out);
END;
$$;

COMMENT ON FUNCTION translit_ru(TEXT) IS
    'Кириллица латиницей для имён. Кыргызские буквы тоже: ң, ө, ү';

-- --- Связка -------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_player_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.player_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Имя: следует за профилем, перевод пересчитывается
    IF NEW.full_name IS NOT NULL
       AND btrim(NEW.full_name) <> ''
       AND NEW.full_name IS DISTINCT FROM OLD.full_name
    THEN
        UPDATE players
        SET name    = NEW.full_name,
            name_en = translit_ru(NEW.full_name),
            name_kg = NULL
        WHERE id = NEW.player_id
          AND name IS DISTINCT FROM NEW.full_name;
    END IF;

    -- Фото: список рейтинга и поиск партнёра читают карточку игрока
    IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
        UPDATE players
        SET photo = NEW.avatar_url
        WHERE id = NEW.player_id
          AND photo IS DISTINCT FROM NEW.avatar_url;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_player_name ON profiles;

CREATE TRIGGER trg_sync_player_name
    AFTER UPDATE OF full_name, avatar_url ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_player_name();

-- --- Разовое выравнивание -----------------------------------------------

UPDATE players pl
SET photo = p.avatar_url
FROM profiles p
WHERE p.player_id = pl.id
  AND p.avatar_url IS NOT NULL
  AND pl.photo IS DISTINCT FROM p.avatar_url;

-- Перевод там, где он пропал вместе со сменой имени
UPDATE players pl
SET name_en = translit_ru(pl.name)
FROM profiles p
WHERE p.player_id = pl.id
  AND (pl.name_en IS NULL OR btrim(pl.name_en) = '');

-- --- Проверка -----------------------------------------------------------

SELECT p.full_name AS в_профиле,
       pl.name_en  AS латиницей,
       CASE WHEN pl.photo IS NULL THEN 'нет' ELSE 'есть' END AS фото
FROM profiles p
JOIN players pl ON pl.id = p.player_id
ORDER BY p.full_name;

-- Как переводятся показательные имена
SELECT n AS имя, translit_ru(n) AS латиницей
FROM (VALUES ('Иван Иванов'), ('Жаңыл Өмүрова'), ('Щербаков Юрий'),
             ('Айсулуу Чокоева'), ('Хан Константин')) AS t(n);

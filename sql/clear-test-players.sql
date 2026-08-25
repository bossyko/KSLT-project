-- ============================================
-- Чистка тестового рейтинга
-- ============================================
--
-- В таблице 301 игрок, и все, кроме пятерых, заведены для отладки.
-- Настоящие рейтинги клуба будем переносить отдельно, а призёров турниров
-- заведём из новостей.
--
-- Оставляем пятерых: у них живые учётные записи с настоящей почтой.
-- Азамата Бекболотова и Нурлана Исакова не оставляем, хотя профиль есть:
-- у обоих почта вида *.test@kslt.kg.
--
-- Учётные записи (profiles) не трогаем — это входы в кабинет. У удалённых
-- игроков просто снимаем привязку.

BEGIN;

-- 1. Кого оставляем
SELECT 'останутся' AS что, p.id, p.name, pr.email
FROM players p
LEFT JOIN profiles pr ON pr.player_id = p.id
WHERE p.id IN ('aisuluu-chokoeva', 'tennisa-raketovna', 'tat-yana-nechaeva', 'ivan-ivanov', 'han-konstantin')
ORDER BY p.name;

-- 2. Отвязываем всё, что ссылается на игроков. Список внешних ключей
--    берём у самой базы: перечислять руками уже дважды выходило боком
DO $$
DECLARE
    r RECORD;
    keep text[] := ARRAY['aisuluu-chokoeva', 'tennisa-raketovna', 'tat-yana-nechaeva', 'ivan-ivanov', 'han-konstantin'];
BEGIN
    FOR r IN
        SELECT src.relname AS tbl, att.attname AS col, att.attnotnull AS required
        FROM pg_constraint c
        JOIN pg_class src ON src.oid = c.conrelid
        JOIN pg_class dst ON dst.oid = c.confrelid
        JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND dst.relname = 'players'
    LOOP
        IF r.required THEN
            -- Обязательную ссылку в NULL не поставить: строка уходит целиком
            EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL AND %I <> ALL($1)', r.tbl, r.col, r.col)
              USING keep;
        ELSE
            BEGIN
                EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL AND %I <> ALL($1)', r.tbl, r.col, r.col, r.col)
                  USING keep;
            EXCEPTION WHEN check_violation THEN
                -- У баттлов стоит проверка «сторона должна быть заполнена»:
                -- ссылку не обнулить, значит запись удаляем целиком
                EXECUTE format('DELETE FROM public.%I WHERE %I IS NOT NULL AND %I <> ALL($1)', r.tbl, r.col, r.col)
                  USING keep;
            END;
        END IF;
    END LOOP;
END $$;

-- 3. Сами игроки
DELETE FROM players
 WHERE id NOT IN ('aisuluu-chokoeva', 'tennisa-raketovna', 'tat-yana-nechaeva', 'ivan-ivanov', 'han-konstantin');

-- 4. Что осталось
SELECT 'после' AS когда,
       (SELECT COUNT(*) FROM players) AS игроков,
       (SELECT COUNT(*) FROM profiles) AS учётных_записей,
       (SELECT COUNT(*) FROM profiles WHERE player_id IS NOT NULL) AS привязанных_к_игроку,
       (SELECT COUNT(*) FROM player_categories) AS записей_в_раскладке_очков;

COMMIT;

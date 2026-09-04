-- ============================================================
-- Проверка полей ручного игрока в баттле — только чтение
-- ============================================================

-- 1. Легли ли колонки
SELECT column_name AS колонка, data_type AS тип
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'challenges'
   AND column_name IN ('challenger_photo','opponent_photo',
                       'challenger_partner_photo','opponent_partner_photo',
                       'challenger_partner_country','opponent_partner_country')
 ORDER BY column_name;

-- 2. Где сейчас ручные игроки и чего им не хватает
SELECT id,
       battle_title                                  AS баттл,
       challenger_external_name                      AS вручную_1,
       opponent_external_name                        AS вручную_2,
       (challenger_photo IS NOT NULL)                AS есть_фото_1,
       (opponent_photo   IS NOT NULL)                AS есть_фото_2,
       challenger_country                            AS страна_1,
       opponent_country                              AS страна_2
  FROM challenges
 WHERE challenger_external_name IS NOT NULL
    OR opponent_external_name   IS NOT NULL
 ORDER BY created_at DESC
 LIMIT 20;

-- 3. Доходят ли новые поля до страницы баттла.
--    Функция get_battle_public отдаёт снимок и страну; до правки они брались
--    только из карточки игрока, и у ручного приходило пусто.
--    Ждём: у опубликованного баттла с ручным игроком в столбцах ниже не NULL.
SELECT c.id,
       c.battle_title                        AS баттл,
       j->>'challenger_name'                 AS имя_1,
       j->>'challenger_photo'                AS фото_1,
       j->>'challenger_country'              AS страна_1,
       j->>'opponent_name'                   AS имя_2,
       j->>'opponent_photo'                  AS фото_2,
       j->>'opponent_country'                AS страна_2,
       j->>'challenger_partner_display'      AS напарник_1,
       j->>'challenger_partner_photo'        AS фото_напарника_1,
       j->>'challenger_partner_country'      AS страна_напарника_1,
       j->>'opponent_partner_display'        AS напарник_2,
       j->>'opponent_partner_photo'          AS фото_напарника_2,
       j->>'opponent_partner_country'        AS страна_напарника_2
  FROM challenges c
  CROSS JOIN LATERAL public.get_battle_public(c.id) AS j
 WHERE c.battle_published = true
 ORDER BY c.battle_published_at DESC NULLS LAST
 LIMIT 10;

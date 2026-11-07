-- ============================================================
-- ЧТО В VAULT СЕЙЧАС — ТОЛЬКО ЧТЕНИЕ, ОДИН ЗАПРОС, ОДИН ОТВЕТ
-- ============================================================
--
-- ПОВОД. Замер 06:49 вернул одновременно `pervye_tri = 97e` и
-- `vsyo_eshchyo_otpechatok = true`. Вместе это невозможно: отпечаток
-- начинается на `be35`. Значит показан результат не того оператора
-- (в файле их было два) или прогнана прежняя версия файла.
--
-- ПРОТИВОРЕЧИВЫЙ ЗАМЕР НЕ ТОЛКУЕТСЯ, А ПОВТОРЯЕТСЯ ЧИСТО: в этом
-- файле ОДИН запрос и ничего кроме него, так что редактору нечего
-- перепутать. Сам пароль не показывается.

SELECT length(ds.decrypted_secret)                  AS dlina,
       left(ds.decrypted_secret, 3)                 AS pervye_tri,
       (ds.decrypted_secret LIKE '<%>')             AS zaglushka,
       (ds.decrypted_secret ~ '^[0-9a-f]{64}$')     AS pohozh_na_parol,
       (ds.decrypted_secret =
        'be35be13f9b22acc43c3d521df3b0eb18ff07b8ec43848c4928f0e720edcf2b0')
                                                    AS eto_otpechatok,
       s.updated_at
  FROM vault.secrets s
  JOIN vault.decrypted_secrets ds ON ds.id = s.id
 WHERE s.name = 'cron_secret';

-- ЖДЁМ: dlina 64, zaglushka false, pohozh_na_parol true,
--       eto_otpechatok false.
--
-- НО ГЛАВНАЯ ПРОВЕРКА НЕ ЗДЕСЬ. Совпадение с секретом `CRON_SECRET`
-- у функций этим запросом не проверяется никак — панель значения не
-- отдаёт. Отвечает только сеть: через 5 минут
-- sql/обслуживание/novosti-klyuch-proverka-07nov.sql должен показать
-- 200 у `match-notify` (он ходит каждые */5).
